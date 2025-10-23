import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "@/styles/globals.css"
import "@/app/styles/student.css"
import { ThemeProvider } from "@/components/student/theme-provider"
import { LayoutWrapper } from "./layoutWrapper"
import { ProfileProvider } from "@/contexts/profile-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Student Dashboard",
  description: "A comprehensive student performance tracking and management system",
  generator: 'Next.js',
  authors: [{ name: 'Student Dashboard Team' }],
  keywords: ['student', 'dashboard', 'education', 'performance', 'tracking'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <ProfileProvider>
            <LayoutWrapper>
              {children}
            </LayoutWrapper>
          </ProfileProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
