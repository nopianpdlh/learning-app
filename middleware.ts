import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const pathname = request.nextUrl.pathname;

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
    const user = session.user;
    const role = (user.user_metadata?.role || "student").toLowerCase();
    return NextResponse.redirect(new URL(`/${role}/dashboard`, request.url));
  }

  // Role-based access control for dashboard routes
  if (isDashboard && session) {
    const user = session.user;
    const role = (user.user_metadata?.role || "STUDENT").toUpperCase();

    // Admin can only access /admin/* routes
    if (isAdminRoute && role !== "ADMIN") {
      const redirectRole = role.toLowerCase();
      return NextResponse.redirect(
        new URL(`/${redirectRole}/dashboard`, request.url)
      );
    }

    // Tutor can only access /tutor/* routes (admin is excluded from tutor routes)
    if (isTutorRoute && role !== "TUTOR") {
      const redirectRole = role.toLowerCase();
      return NextResponse.redirect(
        new URL(`/${redirectRole}/dashboard`, request.url)
      );
    }

    // Student can only access /student/* routes
    if (isStudentRoute && role !== "STUDENT") {
      const redirectRole = role.toLowerCase();
      return NextResponse.redirect(
        new URL(`/${redirectRole}/dashboard`, request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/student/:path*",
    "/tutor/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
