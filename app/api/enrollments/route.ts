import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { createSnapTransaction, generateInvoiceNumber } from "@/lib/midtrans";
import { sendEnrollmentConfirmationEmail } from "@/lib/email";

// POST /api/enrollments - Create enrollment (Student only) - Section based with Midtrans
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get student profile
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: true,
      },
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json(
        { error: "Student profile not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const sectionId = body.sectionId || body.classId; // Support both for compatibility

    if (!sectionId) {
      return NextResponse.json(
        { error: "sectionId is required" },
        { status: 400 }
      );
    }

    // Check if section exists and is active
    const section = await db.classSection.findUnique({
      where: { id: sectionId },
      include: {
        template: true,
      },
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section tidak ditemukan" },
        { status: 404 }
      );
    }

    if (section.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Section tidak aktif" },
        { status: 400 }
      );
    }

    // Check capacity
    const enrollmentCount = await db.enrollment.count({
      where: { sectionId },
    });

    if (enrollmentCount >= section.template.maxStudentsPerSection) {
      return NextResponse.json(
        { error: "Section sudah penuh" },
        { status: 400 }
      );
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        studentId_sectionId: {
          studentId: user.studentProfile.id,
          sectionId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Anda sudah terdaftar di section ini" },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        studentId: user.studentProfile.id,
        sectionId,
        status: "PENDING",
        meetingsRemaining: section.template.meetingsPerPeriod,
        totalMeetings: section.template.meetingsPerPeriod,
      },
      include: {
        section: { include: { template: true } },
      },
    });

    const price = section.template.pricePerMonth;
    const orderId = generateInvoiceNumber();
    const className = `${section.template.name} - Section ${section.sectionLabel}`;

    // Create Midtrans Snap transaction
    let snapToken = "";
    let redirectUrl = "";

    try {
      const snapResponse = await createSnapTransaction({
        orderId,
        grossAmount: price,
        customerDetails: {
          firstName: user.name,
          email: user.email,
          phone: user.phone || undefined,
        },
        itemDetails: [
          {
            id: sectionId,
            name: className,
            price,
            quantity: 1,
          },
        ],
        expiryDuration: 1440, // 24 hours
      });

      snapToken = snapResponse.token;
      redirectUrl = snapResponse.redirect_url;
    } catch (error) {
      console.error("Midtrans Snap creation error:", error);
      // Continue with enrollment but without payment
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        enrollmentId: enrollment.id,
        amount: price,
        paymentMethod: "midtrans",
        status: "PENDING",
        paymentUrl: redirectUrl || null,
        transactionId: orderId,
      },
    });

    // Send enrollment confirmation email with payment link
    if (redirectUrl) {
      try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await sendEnrollmentConfirmationEmail({
          to: user.email,
          userName: user.name,
          className,
          paymentUrl: redirectUrl,
          amount: price,
          expiresAt,
        });
      } catch (emailError) {
        console.error("Failed to send enrollment email:", emailError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        enrollment,
        payment: {
          id: payment.id,
          amount: payment.amount,
          paymentUrl: redirectUrl,
          snapToken,
          status: "PENDING",
        },
        message: "Enrollment berhasil dibuat. Silakan lanjutkan pembayaran.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json({ error: "Gagal mendaftar" }, { status: 500 });
  }
}

// GET /api/enrollments - Get user's enrollments (section based)
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        studentProfile: {
          include: {
            enrollments: {
              include: {
                section: {
                  include: {
                    template: true,
                    tutor: {
                      include: {
                        user: {
                          select: {
                            name: true,
                            avatar: true,
                          },
                        },
                      },
                    },
                  },
                },
                payment: true,
              },
              orderBy: {
                enrolledAt: "desc",
              },
            },
          },
        },
      },
    });

    if (!user || !user.studentProfile) {
      return NextResponse.json({ enrollments: [] });
    }

    return NextResponse.json({ enrollments: user.studentProfile.enrollments });
  } catch (error) {
    console.error("Get enrollments error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data enrollment" },
      { status: 500 }
    );
  }
}
