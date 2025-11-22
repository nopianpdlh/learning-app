import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createEnrollmentSchema } from "@/lib/validations/enrollment.schema";
import { createClient } from "@/lib/supabase/server";
import { createPayment, PaymentMethod } from "@/lib/pakasir";
import { sendEnrollmentConfirmationEmail } from "@/lib/email";

// POST /api/enrollments - Create enrollment (Student only)
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
    const data = createEnrollmentSchema.parse(body);

    // Check if class exists and is published
    const classData = await db.class.findUnique({
      where: { id: data.classId },
    });

    if (!classData) {
      return NextResponse.json(
        { error: "Kelas tidak ditemukan" },
        { status: 404 }
      );
    }

    if (!classData.published) {
      return NextResponse.json(
        { error: "Kelas belum dipublish" },
        { status: 400 }
      );
    }

    // Check capacity
    const enrollmentCount = await db.enrollment.count({
      where: { classId: data.classId },
    });

    if (enrollmentCount >= classData.capacity) {
      return NextResponse.json({ error: "Kelas sudah penuh" }, { status: 400 });
    }

    // Check if already enrolled
    const existingEnrollment = await db.enrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: user.studentProfile.id,
          classId: data.classId,
        },
      },
    });

    if (existingEnrollment) {
      return NextResponse.json(
        { error: "Anda sudah terdaftar di kelas ini" },
        { status: 400 }
      );
    }

    // Create enrollment
    const enrollment = await db.enrollment.create({
      data: {
        studentId: user.studentProfile.id,
        classId: data.classId,
        status: "PENDING",
      },
      include: {
        class: true,
      },
    });

    // Get payment method from request body (default to qris)
    const paymentMethod = (body.paymentMethod as PaymentMethod) || "qris";

    // Use enrollment ID as order ID for easier tracking
    const orderId = enrollment.id;

    // Create payment URL (will create transaction when user visits)
    // For Pakasir, we use the URL method which is simpler
    const returnUrl = `${process.env.NEXT_PUBLIC_APP_URL}/payment/status?enrollmentId=${enrollment.id}`;
    let paymentUrl = "";
    let paymentStatus: "PENDING" | "PAID" | "FAILED" = "PENDING";

    try {
      // For Pakasir, we can use either API or URL method
      // URL method is simpler for redirect scenario
      const response = await createPayment({
        orderId,
        amount: classData.price,
        paymentMethod,
        returnUrl,
      });

      paymentUrl = response.paymentUrl;
      paymentStatus = "PENDING";
    } catch (error) {
      console.error("Pakasir payment creation error:", error);
      // Fallback: generate URL directly without API call
      const pakasirSlug = process.env.PAKASIR_PROJECT_SLUG;
      if (pakasirSlug) {
        paymentUrl = `https://app.pakasir.com/pay/${pakasirSlug}/${
          classData.price
        }?order_id=${orderId}&redirect=${encodeURIComponent(returnUrl)}`;
        paymentStatus = "PENDING";
      }
    }

    // Create payment record
    const payment = await db.payment.create({
      data: {
        enrollmentId: enrollment.id,
        amount: classData.price,
        paymentMethod,
        status: paymentStatus,
        paymentUrl,
      },
    });

    // Send enrollment confirmation email with payment link
    if (paymentUrl && paymentStatus === "PENDING") {
      try {
        // Calculate expiry date (24 hours from now)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await sendEnrollmentConfirmationEmail({
          to: user.email,
          userName: user.name,
          className: classData.name,
          paymentUrl,
          amount: classData.price,
          expiresAt,
        });
      } catch (emailError) {
        console.error("Failed to send enrollment email:", emailError);
        // Don't fail the enrollment if email fails
      }
    }

    return NextResponse.json(
      {
        success: true,
        enrollment,
        payment: {
          id: payment.id,
          amount: payment.amount,
          paymentUrl,
          status: paymentStatus,
        },
        message: "Enrollment berhasil dibuat. Silakan lanjutkan pembayaran.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Enrollment error:", error);
    return NextResponse.json(
      { error: "Gagal mendaftar kelas" },
      { status: 500 }
    );
  }
}

// GET /api/enrollments - Get user's enrollments
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
                class: {
                  include: {
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
