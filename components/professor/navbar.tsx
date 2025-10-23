"use client"

import { Bell, HelpCircle, User, Clock, BookOpen, Users, Award, BotMessageSquare, Check, CheckCheck, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/professor/theme-toggle"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { signOut, useSession } from "next-auth/react"
import { useToast } from "@/hooks/use-toast"
import { useState, useEffect } from "react"
import Link from "next/link"

interface Notification {
  id: number
  title: string
  description: string
  time: string
  type: string
  status: string
  unread: boolean
  createdAt: string
}

export function Navbar() {
  const { data: session } = useSession()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  
  const handleSignOut = () => {
    signOut({ callbackUrl: "/professor" })
  }

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/professor/notifications?limit=10')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await fetch('/api/professor/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_id: notificationId,
          action: 'mark_read'
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId 
              ? { ...notif, status: 'read', unread: false }
              : notif
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/professor/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_all_read'
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(notif => ({ ...notif, status: 'read', unread: false }))
        )
        toast({
          title: "Success",
          description: "All notifications marked as read",
        })
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'assignment_submission':
        return <BookOpen className="h-4 w-4" />
      case 'grade_update':
        return <Award className="h-4 w-4" />
      case 'class_schedule':
        return <Clock className="h-4 w-4" />
      case 'student_achievement':
        return <Award className="h-4 w-4" />
      case 'meeting_reminder':
        return <Users className="h-4 w-4" />
      case 'system_announcement':
        return <Bell className="h-4 w-4" />
      case 'grade_report':
        return <BookOpen className="h-4 w-4" />
      case 'attendance_alert':
        return <Clock className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment_submission':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'grade_update':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'class_schedule':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      case 'student_achievement':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'meeting_reminder':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'system_announcement':
        return 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200'
      case 'grade_report':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200'
      case 'attendance_alert':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex flex-1 items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-semibold bg-gradient-to-r from-ios-blue to-ios-purple bg-clip-text ios-title">
            PLP Academic Management
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Help Button */}
          {/* <Button variant="ghost" size="icon" className="relative hover:bg-ios-blue/10 rounded-xl ios-button">
            <BotMessageSquare className="h-5 w-5" />
            <span className="sr-only">Help</span>
          </Button> */}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* Notifications */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative hover:bg-ios-blue/10 rounded-xl ios-button">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs bg-ios-red text-white border-0 flex items-center justify-center">
                    {unreadCount}
                  </Badge>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 rounded-xl ios-shadow">
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg ios-title">Notifications</h3>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-ios-blue hover:bg-ios-blue/10 rounded-lg"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark all read
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-ios-blue hover:bg-ios-blue/10 rounded-lg"
                    onClick={fetchNotifications}
                    disabled={loading}
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
              
              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-ios-blue/20 border-t-ios-blue"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center py-8">
                    <Bell className="h-8 w-8 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div key={notification.id}>
                      <div className={`flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                        notification.unread ? 'bg-ios-blue/5' : ''
                      }`}>
                        <div className={`p-2 rounded-full ${
                          notification.unread ? 'bg-ios-blue/10' : 'bg-muted'
                        }`}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium leading-none ${
                              notification.unread ? 'text-foreground' : 'text-muted-foreground'
                            }`}>
                              {notification.title}
                            </p>
                            <Badge variant="outline" className={`text-xs ${getNotificationColor(notification.type)}`}>
                              {notification.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {notification.description}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {notification.time}
                          </p>
                        </div>
                        {notification.unread && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-muted-foreground hover:text-foreground p-1"
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {index < notifications.length - 1 && <Separator />}
                    </div>
                  ))
                )}
              </div>
              
              <div className="p-4 border-t">
                <Button variant="ghost" className="w-full justify-center text-ios-blue hover:bg-ios-blue/10 rounded-lg" asChild>
                  <Link href="/professor/notifications">
                    View all notifications
                  </Link>
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-ios-blue/10 rounded-xl ios-button">
                <User className="h-5 w-5" />
                <span className="sr-only">Profile menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl ios-shadow">
              <DropdownMenuLabel className="ios-body">
                {session?.user?.email || "Professor"}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="rounded-lg ios-body">
                <Link href="/professor/profile">Account Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg ios-body">
                <Link href="/professor/help-support">Help & Support</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="rounded-lg ios-body text-ios-red cursor-pointer" 
                onClick={handleSignOut}
              >
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
