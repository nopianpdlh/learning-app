/**
 * Student Avatar Upload API
 * POST /api/student/profile/avatar - Upload avatar to Supabase Storage
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE_MB = 2;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `Ukuran file maksimal ${MAX_FILE_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    // Validate file extension
    const fileName = file.name.toLowerCase();
    const ext = fileName.substring(fileName.lastIndexOf("."));
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      return NextResponse.json(
        {
          error: `Format file tidak didukung. Gunakan: ${ALLOWED_EXTENSIONS.join(
            ", "
          )}`,
        },
        { status: 400 }
      );
    }

    // Get current user to check for existing avatar
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: { avatar: true },
    });

    // Delete old avatar if exists
    if (userData?.avatar) {
      const oldPath = userData.avatar;
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    // Upload new avatar
    const fileBuffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const safeFileName = `avatar_${timestamp}${ext}`;
    const storagePath = `${user.id}/${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json(
        { error: "Gagal upload avatar" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(storagePath);

    // Update user avatar in database
    await prisma.user.update({
      where: { id: user.id },
      data: { avatar: storagePath },
    });

    return NextResponse.json({
      success: true,
      avatar: storagePath,
      avatarUrl: urlData.publicUrl,
    });
  } catch (error) {
    console.error("POST /api/student/profile/avatar error:", error);
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    );
  }
}
