import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Handle reset password redirect: if root URL has code parameter, redirect to /reset-password
  if (pathname === "/" && request.nextUrl.searchParams.has("code")) {
    const code = request.nextUrl.searchParams.get("code");
    const redirectUrl = new URL("/reset-password", request.url);
    if (code) {
      redirectUrl.searchParams.set("code", code);
    }
    return NextResponse.redirect(redirectUrl);
  }

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const isAdminRoute = pathname.startsWith("/admin");
  const isTutorRoute = pathname.startsWith("/tutor");
  const isStudentRoute = pathname.startsWith("/student");
  const isDashboard = isAdminRoute || isTutorRoute || isStudentRoute;

  // Redirect to login if accessing dashboard without session
  if (isDashboard && !session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if accessing auth page with session
  if (isAuthPage && session) {
    const userRole = getUserRole(session.user);
    const rolePath = userRole.toLowerCase();
    return NextResponse.redirect(
      new URL(`/${rolePath}/dashboard`, request.url)
    );
  }

  // Role-based access control for dashboard routes
  if (isDashboard && session) {
    const userRole = getUserRole(session.user);

    // Admin can only access /admin/* routes
    if (isAdminRoute && userRole !== "ADMIN") {
      const redirectRole = userRole.toLowerCase();
      return NextResponse.redirect(
        new URL(`/${redirectRole}/dashboard`, request.url)
      );
    }

    // Tutor can only access /tutor/* routes
    if (isTutorRoute && userRole !== "TUTOR") {
      const redirectRole = userRole.toLowerCase();
      return NextResponse.redirect(
        new URL(`/${redirectRole}/dashboard`, request.url)
      );
    }

    // Student can only access /student/* routes
    if (isStudentRoute && userRole !== "STUDENT") {
      const redirectRole = userRole.toLowerCase();
      return NextResponse.redirect(
        new URL(`/${redirectRole}/dashboard`, request.url)
      );
    }
  }

  return NextResponse.next();
}

/**
 * Get user role from session user metadata
 * Priority: user_metadata.role > app_metadata.role > "STUDENT" (default)
 */
function getUserRole(user: {
  user_metadata?: Record<string, unknown>;
  app_metadata?: Record<string, unknown>;
}): string {
  // Check user_metadata first (custom claims set during signup/update)
  if (user.user_metadata?.role && typeof user.user_metadata.role === "string") {
    return user.user_metadata.role.toUpperCase();
  }

  // Fallback to app_metadata (if role set by admin)
  if (user.app_metadata?.role && typeof user.app_metadata.role === "string") {
    return user.app_metadata.role.toUpperCase();
  }

  // Default to STUDENT if no role found
  return "STUDENT";
}

export const config = {
  matcher: [
    "/",
    "/student/:path*",
    "/tutor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
