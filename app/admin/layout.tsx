import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/styles/admin.css"
import { ThemeProvider } from "@/components/admin/theme-provider"
import { LayoutWrapper } from "@/app/admin/layoutWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Academic Management System - PLP",
  description: "Comprehensive academic management system for PLP",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
