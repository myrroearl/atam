"use client"

import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/admin/app-sidebar"
import { TopNavigation } from "@/components/admin/top-navigation"
import { SidebarProvider } from "@/components/ui/sidebar"

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === "/admin"

  if (isLoginPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <TopNavigation />
          <main className="flex-1 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)]">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}

