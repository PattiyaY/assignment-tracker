import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Route-level RBAC. Page/action-level checks still happen server-side
// (never trust middleware alone), but this stops unauthenticated or
// wrong-role users before they even render a protected page.
export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    // /dashboard and any /classrooms/:id/settings page are teacher-only.
    // Plain /classrooms/:id is shared — a student may view their own
    // classroom read-only, which the page itself verifies by id.
    const isTeacherOnly =
      pathname.startsWith("/dashboard") ||
      /^\/classrooms\/[^/]+\/settings/.test(pathname);

    const isAdminLike = role === "TEACHER" || role === "ADMIN";
    if (isTeacherOnly && !isAdminLike) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: { signIn: "/login" },
  },
);

export const config = {
  matcher: ["/dashboard/:path*", "/classrooms/:path*"],
};
