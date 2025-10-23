// app/layout.tsx

import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "@/app/styles/professor.css"
import { ThemeProvider } from "@/components/professor/theme-provider"
import { LayoutWrapper } from "@/app/professor/layoutWrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "PLP Academic Management",
  description: "Academic grading and performance monitoring system for professors",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LayoutWrapper>{children}</LayoutWrapper>
        </ThemeProvider>
      </body>
    </html>
  )
}
