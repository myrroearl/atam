"use client"

import { NavbarWrapper } from "@/components/student/navbar-wrapper"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NavbarWrapper />
      {children}
    </>
  )
}
