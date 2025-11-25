/**
 * Materials Signed URL API
 * POST /api/materials/[id]/signed-url - Generate signed URL for material download
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/materials/[id]/signed-url
 * Generate signed URL for material file (server-side, bypasses RLS)
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get material
    const material = await prisma.material.findUnique({
      where: { id: params.id },
      include: {
        class: {
          select: {
            id: true,
            tutorId: true,
          },
        },
      },
    });

    if (!material) {
      return NextResponse.json(
        { error: "Material not found" },
        { status: 404 }
      );
    }

    if (!material.fileUrl) {
      return NextResponse.json(
        { error: "This material has no downloadable file" },
        { status: 400 }
      );
    }

    // If fileUrl is a full URL (old public bucket), return as-is
    if (material.fileUrl.startsWith("http")) {
      return NextResponse.json({
        success: true,
        url: material.fileUrl,
      });
    }

    // Extract path (handle both formats)
    let filePath = material.fileUrl;

    // Try to generate signed URL with server-side client
    const { data, error } = await supabase.storage
      .from("materials")
      .createSignedUrl(filePath, 3600);

    if (error || !data) {
      // Try flat structure fallback
      const pathParts = filePath.split("/");
      if (pathParts.length >= 2 && pathParts[0].length > 10) {
        const flatPath = pathParts.slice(1).join("/");

        const { data: retryData, error: retryError } = await supabase.storage
          .from("materials")
          .createSignedUrl(flatPath, 3600);

        if (retryError || !retryData) {
          return NextResponse.json(
            {
              error:
                retryError?.message ||
                error?.message ||
                "Failed to generate signed URL",
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          url: retryData.signedUrl,
        });
      }

      return NextResponse.json(
        { error: error?.message || "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.signedUrl,
    });
  } catch (error) {
    console.error("POST /api/materials/[id]/signed-url error:", error);
    return NextResponse.json(
      { error: "Failed to generate signed URL" },
      { status: 500 }
    );
  }
}
