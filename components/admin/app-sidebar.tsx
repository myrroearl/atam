"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { PiStudentBold } from "react-icons/pi";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FaBookBookmark } from "react-icons/fa6";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  LayoutDashboard,
  GraduationCap,
  UserCheck,
  BookOpen,
  Settings,
  BarChart3,
  FileText,
  Megaphone,
  ChevronDown,
  Brain,
  User,
  LogOut,
  UserCircle,
  Calendar,
  Archive,
  BookMarked,
} from "lucide-react"
import { SiGoogleclassroom } from "react-icons/si";
import { cn } from "@/lib/utils"
import { useState } from "react"
import { SidebarSkeleton } from "./sidebar-skeleton"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin/dashboard",
  },
  {
    title: "Curriculum",
    icon: FaBookBookmark,
    href: "/admin/curriculum",
  },
  {
    title: "Sections",
    icon: Calendar,
    href: "/admin/sections",
  },
  {
    title: "Students",
    icon: PiStudentBold,
    href: "/admin/users/students",
  },
  {
    title: "Professors", 
    icon: FaChalkboardTeacher,
    href: "/admin/users/professors",
  },
  {
    title: "Class",
    icon: SiGoogleclassroom,
    href: "/admin/classes",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/admin/settings",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/admin/analytics",
  },
  {
    title: "Activity Logs",
    icon: FileText,
    href: "/admin/audit-logs",
  },
  {
    title: "Announcements",
    icon: Megaphone,
    href: "/admin/announcements",
  },
  {
    title: "Learning Resources",
    icon: BookMarked,
    href: "/admin/learning-resources",
  },
  // {
  //   title: "ML Settings",
  //   icon: Brain,
  //   href: "/admin/ml-settings",
  // },
  {
    title: "Archive",
    icon: Archive,
    href: "/admin/archive",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { isMobile, setOpen: setSidebarOpen, state } = useSidebar()
  const [open, setOpen] = useState(false)
  const { data: session, status } = useSession()

  const isActive = (href: string) => {
    // Default behavior: exact or prefix match
    return pathname === href || pathname.startsWith(href + "/")
  }

  // Show skeleton while session is loading
  if (status === "loading") {
    return <SidebarSkeleton state={state} />
  }

  if (!session || session.user.role !== "admin") {
    return null
  }

  return (
    <Sidebar
      className="border-none"
      collapsible="icon"
      style={{ width: 'full' }}
    >
      <div className="flex h-full w-full flex-col bg-white transition-colors dark:bg-black">
        <SidebarHeader className={state === "collapsed" ? "p-2 mt-2" : "p-4"}>
          <div className="flex items-center justify-center gap-2">
            <Image
              src="/plp.png"
              alt="Logo"
              width={50}
              height={50}
              className="rounded-full transition-all duration-200 bg-transparent border-none dark:bg-transparent"
            />
            <span
              className={`ml-2 text-4xl font-black text-[var(--customized-color-one)] dark:text-[var(--darkmode-color-one)] ${state === "collapsed" ? "hidden" : "block transition-opacity duration-200 text-center dark:text-white"}`}
            >
              PLP
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent className={state === "collapsed" ? "p-2 mt-2" : "flex-1 p-4"}>
          <SidebarMenu>
            {menuItems.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  className={cn(
                    "text-black rounded-lg mb-1 ripple transition-all duration-200 ease-in-out active:scale-[0.97]",
                    isActive(item.href)
                    ? "bg-[var(--customized-color-one)] text-white hover:bg-[var(--customized-color-one)] hover:text-white font-black dark:bg-[var(--darkmode-color-one)] dark:text-black"
                    : "text-black hover:ml-2 hover:transition-all hover:duration-300 hover:text-black hover:bg-transparent dark:hover:bg-[var(--customized-color-one)] dark:text-white dark:hover:bg-transparent"
                  )}
                  tooltip={item.title}
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <item.icon className="w-[14px] h-[14px]" />
                    <span
                      className={
                        state === "collapsed"
                          ? "hidden"
                          : "text-[14px] transition-opacity duration-200"
                      }
                    >
                      {item.title}
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className={state === "collapsed" ? "p-2 mt-2" : "p-4"}>
          <DropdownMenu open={open} onOpenChange={setOpen}>
            {state === "collapsed" ? (
              // ✅ Collapsed: avatar = trigger
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                  <div className="bg-[var(--customized-color-one)] rounded-full flex items-center justify-center">
                  <Settings />
                  </div>
                </div>
              </DropdownMenuTrigger>
            ) : (
              // ✅ Expanded: chevron = trigger (wrapped to prevent layout shift)
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-1">
                  
                  <Settings />
                  
                  <div>
                    <p className="text-sm font-bold text-black dark:text-white capitalize">
                      {session.user.role} User
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {session.user.email}
                    </p>
                  </div>
                </div>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center justify-center w-6 h-6 shrink-0 cursor-pointer">
                    <ChevronDown
                      className={cn(
                        "text-gray-500 dark:text-black transition-transform duration-200 ease-in-out hover:bg-[var(--customized-color-five)] rounded-sm dark:text-gray-500 dark:hover:bg-[var(--darkmode-color-five)]",
                        open ? "rotate-180" : "rotate-0"
                      )}
                    />
                  </button>
                </DropdownMenuTrigger>
              </div>
            )}

            {/* Menu content (works for both states) */}
            <DropdownMenuContent
              align={state === "expanded" ? "end" : "start"}
              side="top"
              sideOffset={8}
              alignOffset={0}
              collisionPadding={8}
              avoidCollisions={false}
              className={cn("w-24 min-w-[8rem]", state === "expanded" ? "mb-3" : "")}
              forceMount={open ? true : undefined}
            >
              <DropdownMenuItem
                className="cursor-pointer rounded-md border-none outline-none focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)]"
                onClick={() => {
                  console.log("View Profile clicked")
                }}
              >
                <UserCircle className="h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20 rounded-md border-none outline-none"
                onClick={() => signOut({ callbackUrl: "/admin" })}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
