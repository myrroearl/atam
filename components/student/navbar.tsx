"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ThemeToggle } from "@/components/student/theme-toggle"
import { signOut, useSession } from "next-auth/react"
import { usePrivacy } from "@/contexts/privacy-context"
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Trophy,
  TrendingUp,
  Users,
  Dumbbell,
  Bell,
  Settings,
  LogOut,
  User,
  Menu,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"

// Navigation items for the student portal
const navigation = [
  { name: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard },
  { name: "Subjects", href: "/student/subjects", icon: BookOpen },
  { name: "Performance", href: "/student/performance", icon: TrendingUp },
  { name: "Leaderboard", href: "/student/leaderboard", icon: Users },
  { name: "Training", href: "/student/training", icon: Dumbbell },
  
]

type NavNotification = { id: number; title: string; message: string; time: string; unread: boolean }

export function Navbar() {
  const pathname = usePathname()
  const [notificationCount, setNotificationCount] = useState(0)
  const [latestNotifications, setLatestNotifications] = useState<NavNotification[]>([])
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const router = useRouter()
  const { data: session, status } = useSession()
  const [displayName, setDisplayName] = useState<string>("")
  const [displayEmail, setDisplayEmail] = useState<string>("")
  const { privacySettings } = usePrivacy()

  // Refresh page if clicking current nav item, otherwise navigate normally
  const handleNavigation = (href: string, e: React.MouseEvent) => {
    if (pathname === href) {
      e.preventDefault()
      window.location.reload()
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/student" })
  }

  // Hide navbar during auth loading
  if (status === "loading") {
    return null
  }

  // Hide navbar if not student role
  if (!session || session.user.role !== "student") {
    return null
    }

  // Load latest notifications from API
  useEffect(() => {
    let active = true
    async function load() {
      try {
        const res = await fetch('/api/student/notifications', { cache: 'no-store' })
        if (!res.ok) return
        const b = await res.json()
        const items: NavNotification[] = (b.notifications || []).slice(0, 5).map((n: any) => ({
          id: n.notification_id,
          title: n.type || 'Notification',
          message: n.message,
          time: new Date(n.created_at).toLocaleString(),
          unread: (n.status || 'unread') === 'unread',
        }))
        if (!active) return
        setLatestNotifications(items)
        setNotificationCount(items.filter(i => i.unread).length)
      } catch {}
    }
    load()
    return () => { active = false }
  }, [])

  useEffect(() => {
    let active = true
    async function loadProfile() {
      try {
        const res = await fetch('/api/student/profile', { cache: 'no-store' })
        if (!res.ok) return
        const b = await res.json()
        const s = b.student
        if (!active || !s) return
        const name = `${s.first_name || ''} ${s.last_name || ''} ${s.sections?.section_name ? s.sections.section_name : ''}`.trim()
        setDisplayName(name || session?.user?.name || '')
        setDisplayEmail(s.accounts?.email || session?.user?.email || '')
      } catch {
        setDisplayName(session?.user?.name || '')
        setDisplayEmail(session?.user?.email || '')
      }
    }
    if (session) loadProfile()
    return () => { active = false }
  }, [session])
  return (
    <nav className="fixed top-4 left-4 right-4 z-50 rounded-2xl bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg backdrop-blur-lg max-w-[1472px] mx-auto">
      <div className="flex h-16 items-center px-4 lg:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center space-x-2 flex-shrink-0">
          <div className="w-8 h-8  rounded-lg flex items-center justify-center">
            <Image
              src="/logo.jpg"
              alt="PLP Logo"
              width={80}
              height={80}
              className="rounded-full"
               />
          </div>
          <span className="text-lg lg:text-xl font-bold text-foreground">
            PLP
          </span>
        </Link>

        {/* Mobile menu button */}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto md:hidden text-muted-foreground hover:text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Navigation Links - Desktop */}
        <div className="hidden md:flex ml-4 lg:ml-8 space-x-1 flex-1 justify-center">
          {navigation.map((item) => {
            const Icon = item.icon
            // Special case: Grade Reports page should show Subjects as active
            const isActive = pathname === item.href || 
                            pathname.startsWith(`${item.href}/`) ||
                            (item.name === "Subjects" && pathname === "/student/grade-reports")
            return (
              <Link key={item.name} href={item.href} onClick={(e) => handleNavigation(item.href, e)}>
                <div className="relative group">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "flex items-center space-x-1 lg:space-x-2 text-sm lg:text-base text-muted-foreground hover:text-foreground transition-colors px-2 lg:px-3",
                      isActive && "text-foreground bg-muted/50",
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden lg:inline">{item.name}</span>
                    <span className="lg:hidden">{item.name.slice(0, 4)}</span>
                  </Button>
                  {/* Underline hover effect */}
                  <div
                    className={cn(
                      "absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-emerald-500 transform transition-transform duration-200",
                      isActive ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100",
                    )}
                  />
                </div>
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center space-x-2 lg:space-x-4 flex-shrink-0">
          <ThemeToggle />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative text-muted-foreground hover:text-foreground hover:bg-muted/50"
              >
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    {notificationCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-80 p-0 bg-card border-border"
              align="end"
            >
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold text-foreground">Notifications</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {latestNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      "p-4 border-b border-border hover:bg-muted/50 cursor-pointer",
                      notification.unread && "bg-green-50 dark:bg-green-500/5",
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-sm text-foreground">{notification.title}</p>
                        <p className="text-sm text-muted-foreground">{notification.message}</p>
                      </div>
                      {notification.unread && <div className="w-2 h-2 bg-green-500 rounded-full mt-1" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                  </div>
                ))}
              </div>
              <div className="p-2">
                <Link href="/student/notifications">
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  >
                    View all notifications
                  </Button>
                </Link>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full hover:bg-muted/50"
              >
                <ProfileAvatar size="sm" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-56 bg-card border-border"
              align="end"
              forceMount
            >
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <div className="flex items-center space-x-2">
                    <p className="text-sm font-medium leading-none text-foreground">{displayName}</p>
                    {privacySettings.profileVisibility === 'private' && (
                      <Shield className="w-3 h-3 text-orange-500" />
                    )}
                  </div>
                  <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                  {privacySettings.profileVisibility === 'private' && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                      Profile is private
                    </p>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem asChild>
                <Link
                  href="/student/profile"
                  className="flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/student/scholarships"
                  className="flex items-center text-muted-foreground hover:text-foreground hover:bg-muted/50"
                >
                  <Trophy className="mr-2 h-4 w-4" />
                  <span>Scholarships</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-500/20 cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-card backdrop-blur-md rounded-b-2xl">
          <div className="px-4 py-2 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              // Special case: Grade Reports page should show Subjects as active
              const isActive = pathname === item.href || 
                              pathname.startsWith(`${item.href}/`) ||
                              (item.name === "Subjects" && pathname === "/student/grade-reports")
              return (
                <Link key={item.name} href={item.href} onClick={(e) => {
                  handleNavigation(item.href, e)
                  setMobileMenuOpen(false)
                }}>
                  <Button
                    variant="ghost"
                    className={cn(
                      "w-full justify-start text-muted-foreground hover:text-foreground hover:bg-muted/50",
                      isActive && "text-foreground bg-muted/50",
                    )}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.name}
                  </Button>
                </Link>
              )
            })}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <ThemeToggle />
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative text-muted-foreground hover:text-foreground"
                  >
                    <Bell className="w-5 h-5" />
                    {notificationCount > 0 && (
                      <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                        {notificationCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-80 p-0 bg-card border-border"
                  align="end"
                >
                  <div className="p-4 border-b border-border">
                    <h3 className="font-semibold text-foreground">Notifications</h3>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {latestNotifications.slice(0, 3).map((notification: NavNotification) => (
                      <div key={notification.id} className="p-3 border-b border-border">
                        <p className="font-medium text-sm text-foreground">{notification.title}</p>
                        <p className="text-xs text-muted-foreground">{notification.time}</p>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>   
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <ProfileAvatar size="sm" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-56 bg-card border-border"
                  align="end"
                >
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">RENZEL LAGASCA</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        lagascarenzel@plpasig.edu.ph
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/student/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <div className="flex items-center opacity-50 cursor-not-allowed">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </div>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}