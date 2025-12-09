/**
 * Material View Tracking API
 * POST /api/student/materials/[id]/view - Track material view
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: materialId } = await params;

  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Increment view count
    const material = await prisma.material.update({
      where: { id: materialId },
      data: {
        viewCount: { increment: 1 },
      },
      select: { viewCount: true },
    });

    return NextResponse.json({
      success: true,
      viewCount: material.viewCount,
    });
  } catch (error: any) {
    console.error("Track view error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
