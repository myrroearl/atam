import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const token = req.nextauth.token
    const { pathname } = req.nextUrl

    // Allow access to landing page and public assets
    if (
      pathname === "/" ||
      pathname.startsWith("/api/auth") ||
      pathname.startsWith("/api/landing-stats") ||
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.startsWith("/public")
    ) {
      return NextResponse.next()
    }

    // Handle login pages - redirect authenticated users to their dashboards
    if (pathname === "/admin" || pathname === "/professor" || pathname === "/student") {
      if (token) {
        const userRole = token.role as string
        // Redirect authenticated users to their appropriate dashboard
        if (pathname === "/admin" && userRole === "admin") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url))
        }
        if (pathname === "/professor" && userRole === "professor") {
          return NextResponse.redirect(new URL("/professor/dashboard", req.url))
        }
        if (pathname === "/student" && userRole === "student") {
          return NextResponse.redirect(new URL("/student/dashboard", req.url))
        }
        // If user has wrong role for this login page, redirect to their correct dashboard
        if (userRole === "admin") {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url))
        }
        if (userRole === "professor") {
          return NextResponse.redirect(new URL("/professor/dashboard", req.url))
        }
        if (userRole === "student") {
          return NextResponse.redirect(new URL("/student/dashboard", req.url))
        }
      }
      // Allow unauthenticated users to access login pages
      return NextResponse.next()
    }

    // If no token, redirect to landing page
    if (!token) {
      return NextResponse.redirect(new URL("/", req.url))
    }

    const userRole = token.role as string

    // Admin dashboard routes protection (but allow /admin login page)
    if (pathname.startsWith("/admin/")) {
      if (userRole !== "admin") {
        return NextResponse.redirect(new URL("/admin", req.url))
      }
      return NextResponse.next()
    }

    // Professor dashboard routes protection (but allow /professor login page)
    if (pathname.startsWith("/professor/")) {
      console.log("Middleware - Professor route check:", pathname, "Role:", userRole)
      if (userRole !== "professor") {
        console.log("Middleware - Redirecting to /professor (wrong role)")
        return NextResponse.redirect(new URL("/professor", req.url))
      }
      console.log("Middleware - Allowing access to professor route")
      return NextResponse.next()
    }

    // Student dashboard routes protection (but allow /student login page)
    if (pathname.startsWith("/student/")) {
      if (userRole !== "student") {
        return NextResponse.redirect(new URL("/student", req.url))
      }
      return NextResponse.next()
    }

    // API routes protection
    if (pathname.startsWith("/api/admin")) {
      if (userRole !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      return NextResponse.next()
    }

    if (pathname.startsWith("/api/professor")) {
      if (userRole !== "professor") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      return NextResponse.next()
    }

    if (pathname.startsWith("/api/student")) {
      if (userRole !== "student") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
      return NextResponse.next()
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl

        console.log("Middleware authorized callback - Path:", pathname, "Has token:", !!token)

        // Always allow access to landing page, login pages, and public assets
        if (
          pathname === "/" ||
          pathname === "/admin" ||
          pathname === "/professor" ||
          pathname === "/student" ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/landing-stats") ||
          pathname.startsWith("/_next") ||
          pathname.startsWith("/favicon") ||
          pathname.startsWith("/public")
        ) {
          console.log("Middleware - Public route, allowing access")
          return true
        }

        // For protected routes, require a token
        const hasAccess = !!token
        console.log("Middleware - Protected route, has access:", hasAccess)
        return hasAccess
      },
    },
  }
)

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
