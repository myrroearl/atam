import type React from "react"
import type { Metadata } from "next"
import "@/styles/globals.css"
import "@/app/styles/student.css"
import { LayoutWrapper } from "./layoutWrapper"
import { ProfileProvider } from "@/contexts/profile-context"
import { PrivacyProvider } from "@/contexts/privacy-context"

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "A comprehensive student performance tracking and management system",
  generator: 'Next.js',
  authors: [{ name: 'Student Dashboard Team' }],
  keywords: ['student', 'dashboard', 'education', 'performance', 'tracking'],
}

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProfileProvider>
      <PrivacyProvider>
        <LayoutWrapper>
          {children}
        </LayoutWrapper>
      </PrivacyProvider>
    </ProfileProvider>
  )
}
