import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const { token } = req.nextauth;

    // Protect admin routes
    if (pathname.startsWith("/admin") && token?.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Protect student routes
    if (pathname.startsWith("/student") && token?.role !== "student") {
      return NextResponse.redirect(new URL("/auth/login", req.url));
    }

    // Redirect logged-in users from login page
    if (pathname === "/auth/login" && token) {
      if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
      if (token.role === "student") {
        return NextResponse.redirect(new URL("/student/dashboard", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        // Allow access to login page without token
        if (req.nextUrl.pathname === "/auth/login") {
          return true;
        }
        // Require token for all other routes
        return token !== null;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/student/:path*", "/auth/login"],
};
