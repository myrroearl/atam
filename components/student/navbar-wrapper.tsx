"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Navbar } from "@/components/student/navbar"

export function NavbarWrapper() {
  const pathname = usePathname()
  const { data: session, status } = useSession()

  // Don't show navbar on login pages
  const isLoginPage = pathname === "/" || pathname === "/student" || pathname === "/professor"

  if (isLoginPage) {
    return null
  }

  // Don't show navbar if not authenticated or not a student
  if (status === "loading") {
    return null
  }

  if (!session || session.user.role !== "student") {
    return null
  }

  return (
    <>
      <Navbar />
      <div className="pt-24" />
    </>
  )
}
