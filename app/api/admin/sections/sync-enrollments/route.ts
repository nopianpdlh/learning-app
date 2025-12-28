import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

// POST - Sync currentEnrollments field with actual enrollment count
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all sections with their actual enrollment count
    const sections = await prisma.classSection.findMany({
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                status: { in: ["ACTIVE", "PENDING"] },
              },
            },
          },
        },
        template: { select: { name: true } },
      },
    });

    let updatedCount = 0;
    const updates: {
      id: string;
      name: string;
      oldCount: number;
      newCount: number;
    }[] = [];

    for (const section of sections) {
      const actualCount = section._count.enrollments;

      // Only update if different
      if (section.currentEnrollments !== actualCount) {
        await prisma.classSection.update({
          where: { id: section.id },
          data: { currentEnrollments: actualCount },
        });

        updates.push({
          id: section.id,
          name: `${section.template.name} - Section ${section.sectionLabel}`,
          oldCount: section.currentEnrollments,
          newCount: actualCount,
        });
        updatedCount++;
      }
    }

    console.log(
      `[SYNC_ENROLLMENTS] Admin ${user.id} synced ${updatedCount} sections:`,
      updates
    );

    return NextResponse.json({
      success: true,
      message: `Synced ${updatedCount} section(s)`,
      updatedCount,
      updates,
    });
  } catch (error) {
    console.error("Error syncing currentEnrollments:", error);
    return NextResponse.json(
      { error: "Failed to sync enrollments" },
      { status: 500 }
    );
  }
}

// GET - Preview sections that need syncing
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify admin role
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    });

    if (!dbUser || dbUser.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get all sections with mismatch
    const sections = await prisma.classSection.findMany({
      include: {
        _count: {
          select: {
            enrollments: {
              where: {
                status: { in: ["ACTIVE", "PENDING"] },
              },
            },
          },
        },
        template: { select: { name: true } },
        tutor: { include: { user: { select: { name: true } } } },
      },
    });

    const mismatchedSections = sections
      .filter((s) => s.currentEnrollments !== s._count.enrollments)
      .map((s) => ({
        sectionId: s.id,
        sectionName: `${s.template.name} - Section ${s.sectionLabel}`,
        tutorName: s.tutor.user.name,
        currentField: s.currentEnrollments,
        actualCount: s._count.enrollments,
        status: s.status,
      }));

    return NextResponse.json({
      total: mismatchedSections.length,
      sections: mismatchedSections,
    });
  } catch (error) {
    console.error("Error fetching mismatched sections:", error);
    return NextResponse.json(
      { error: "Failed to fetch sections" },
      { status: 500 }
    );
  }
}
