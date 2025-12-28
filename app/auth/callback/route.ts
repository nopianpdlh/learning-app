import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/student/dashboard";
  const errorParam = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle OAuth errors from provider
  if (errorParam) {
    console.error("OAuth error:", errorParam, errorDescription);
    return NextResponse.redirect(
      new URL(`/login?error=oauth_failed`, request.url)
    );
  }

  if (!code) {
    console.error("No code provided in callback");
    return NextResponse.redirect(
      new URL("/login?error=invalid_token", request.url)
    );
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error("Exchange code error:", error.message);

      // Map specific errors to error codes
      if (error.message.includes("expired")) {
        return NextResponse.redirect(
          new URL("/login?error=email_expired", request.url)
        );
      }
      if (error.message.includes("invalid") || error.message.includes("PKCE")) {
        return NextResponse.redirect(
          new URL("/login?error=invalid_token", request.url)
        );
      }

      return NextResponse.redirect(
        new URL("/login?error=auth_failed", request.url)
      );
    }

    if (!data.user) {
      console.error("No user returned after code exchange");
      return NextResponse.redirect(
        new URL("/login?error=auth_failed", request.url)
      );
    }

    // Check if user exists in database
    let existingUser = await db.user.findUnique({
      where: { id: data.user.id },
      include: {
        studentProfile: true,
      },
    });

    // Also check by email in case user was created by different auth method
    if (!existingUser && data.user.email) {
      existingUser = await db.user.findUnique({
        where: { email: data.user.email },
        include: {
          studentProfile: true,
        },
      });

      // If found by email but different ID, update the ID
      if (existingUser && existingUser.id !== data.user.id) {
        // This shouldn't happen normally, but handle gracefully
        console.warn("User found with email but different ID");
      }
    }

    // Create user if doesn't exist (for OAuth users)
    if (!existingUser) {
      try {
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
      } catch (dbError) {
        console.error("Database error creating user:", dbError);
        return NextResponse.redirect(
          new URL("/login?error=database_error", request.url)
        );
      }
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
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      case "TUTOR":
        return NextResponse.redirect(new URL("/tutor/dashboard", request.url));
      case "EXECUTIVE":
        return NextResponse.redirect(
          new URL("/executive/dashboard", request.url)
        );
      case "STUDENT":
      default:
        return NextResponse.redirect(new URL(next, request.url));
    }
  } catch (error) {
    console.error("Callback error:", error);
    return NextResponse.redirect(
      new URL("/login?error=auth_failed", request.url)
    );
  }
}
