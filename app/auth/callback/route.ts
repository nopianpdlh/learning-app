import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/student/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Check if user exists in database
      let existingUser = await db.user.findUnique({
        where: { id: data.user.id },
        include: {
          studentProfile: true,
        },
      });

      // Create user if doesn't exist (for OAuth users)
      if (!existingUser) {
        existingUser = await db.user.create({
          data: {
            id: data.user.id,
            email: data.user.email || "",
            name:
              data.user.user_metadata?.name ||
              data.user.email?.split("@")[0] ||
              "User",
            phone: data.user.user_metadata?.phone || null,
            role: "STUDENT",
            avatar: data.user.user_metadata?.avatar_url || null,
          },
          include: {
            studentProfile: true,
          },
        });

        // Create empty student profile (will be completed later)
        await db.studentProfile.create({
          data: {
            userId: existingUser.id,
          },
        });

        // Redirect to complete profile for new OAuth users
        return NextResponse.redirect(new URL("/complete-profile", request.url));
      }

      // Check if profile is complete (has gradeLevel and terms accepted)
      const studentProfile = existingUser.studentProfile;
      const isProfileComplete = studentProfile?.gradeLevel != null;

      if (!isProfileComplete && existingUser.role === "STUDENT") {
        // Redirect to complete profile
        return NextResponse.redirect(new URL("/complete-profile", request.url));
      }

      // Profile is complete, redirect based on role
      switch (existingUser.role) {
        case "ADMIN":
          return NextResponse.redirect(
            new URL("/admin/dashboard", request.url)
          );
        case "TUTOR":
          return NextResponse.redirect(
            new URL("/tutor/dashboard", request.url)
          );
        case "STUDENT":
        default:
          return NextResponse.redirect(new URL(next, request.url));
      }
    }
  }

  // If something went wrong, redirect to login
  return NextResponse.redirect(
    new URL("/login?error=auth_failed", request.url)
  );
}
