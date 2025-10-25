import type React from "react"
import type { Metadata } from "next"
import "@/app/styles/admin.css"
import { LayoutWrapper } from "@/app/admin/layoutWrapper"

export const metadata: Metadata = {
  title: "Academic Management System - PLP",
  description: "Comprehensive academic management system for PLP",
  generator: 'v0.dev'
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <LayoutWrapper>{children}</LayoutWrapper>
}
