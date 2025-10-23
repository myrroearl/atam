"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/professor/app-sidebar"
import { Navbar } from "@/components/professor/navbar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { SidebarInset } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/toaster"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/professor"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset>
        <Navbar />
        <main className="flex-1 p-6 overflow-x-auto">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  )
}
