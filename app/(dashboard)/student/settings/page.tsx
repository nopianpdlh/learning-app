/**
 * Student Settings Page - Server Component
 * Fetches user profile data and passes to client component
 */

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";
import SettingsClient from "./SettingsClient";

export default async function StudentSettingsPage() {
  const supabase = await createClient();

  // Get authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  // Fetch user data with student profile
  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      studentProfile: true,
    },
  });

  if (!userData) {
    redirect("/login");
  }

  // Generate avatar URL if avatar path exists
  let avatarUrl: string | null = null;
  if (userData.avatar) {
    // Check if it's a full URL or storage path
    if (userData.avatar.startsWith("http")) {
      avatarUrl = userData.avatar;
    } else {
      // Get public URL from Supabase Storage
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(userData.avatar);
      avatarUrl = urlData.publicUrl;
    }
  }

  return (
    <SettingsClient
      initialUser={{
        id: userData.id,
        email: userData.email,
        name: userData.name,
        phone: userData.phone,
        avatar: userData.avatar,
      }}
      initialProfile={
        userData.studentProfile
          ? {
              id: userData.studentProfile.id,
              gradeLevel: userData.studentProfile.gradeLevel,
              school: userData.studentProfile.school,
              parentName: userData.studentProfile.parentName,
              parentPhone: userData.studentProfile.parentPhone,
            }
          : null
      }
      avatarUrl={avatarUrl}
    />
  );
}
