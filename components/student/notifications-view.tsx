"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Bell,
  Mail,
  MessageSquare,
  Award,
  Calendar,
  BookOpen,
  Users,
  Settings,
  Check,
  Archive,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"

type NotificationRow = {
  notification_id: number
  message: string
  type: string | null
  status: string | null
  created_at: string
}

type UiNotification = {
  id: number
  type: string
  title: string
  message: string
  time: string
  unread: boolean
  icon: any
  color: string
  priority: "high" | "medium" | "low"
}

const notificationSettings = [
  {
    category: "Grades",
    description: "New grades and grade updates",
    email: true,
    push: true,
    icon: Award,
  },
  
 
  {
    category: "Announcements",
    description: "Class and system announcements",
    email: false,
    push: true,
    icon: BookOpen,
  },
  {
    category: "Scholarships",
    description: "Scholarship opportunities and updates",
    email: true,
    push: true,
    icon: Award,
  },
  {
    category: "Leaderboard",
    description: "Ranking and achievement updates",
    email: false,
    push: false,
    icon: Users,
  },
]

export function NotificationsView() {
  const [selectedNotifications, setSelectedNotifications] = useState<number[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [rows, setRows] = useState<NotificationRow[]>([])

  const notificationList: UiNotification[] = useMemo(() => {
    const iconMap: Record<string, any> = {
      grade: Award,
      deadline: Calendar,
      scholarship: Award,
      message: MessageSquare,
      announcement: BookOpen,
      system: Settings,
      leaderboard: Users,
    }
    const colorMap: Record<string, string> = {
      grade: "text-green-500",
      deadline: "text-orange-500",
      scholarship: "text-purple-500",
      message: "text-blue-500",
      announcement: "text-emerald-500",
      system: "text-gray-500",
      leaderboard: "text-yellow-500",
    }

    return rows.map((r) => {
      const type = (r.type || "announcement").toLowerCase()
      const created = new Date(r.created_at)
      const time = created.toLocaleString()
      const unread = (r.status || "unread").toLowerCase() === "unread"
      const priority: UiNotification["priority"] = unread ? "high" : "medium"
      return {
        id: r.notification_id,
        type,
        title: type.charAt(0).toUpperCase() + type.slice(1),
        message: r.message,
        time,
        unread,
        icon: iconMap[type] || BookOpen,
        color: colorMap[type] || "text-muted-foreground",
        priority,
      }
    })
  }, [rows])

  useEffect(() => {
    let isMounted = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch("/api/student/notifications", { cache: "no-store" })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `Request failed: ${res.status}`)
        }
        const body = await res.json()
        if (isMounted) setRows(body.notifications || [])
      } catch (e: any) {
        if (isMounted) setError(e.message || "Failed to load notifications")
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    load()
    return () => {
      isMounted = false
    }
  }, [])

  const unreadCount = notificationList.filter((n) => n.unread).length
  const todayCount = notificationList.filter(() => true).length

  const handleSelectNotification = (id: number) => {
    setSelectedNotifications((prev) => (prev.includes(id) ? prev.filter((nId) => nId !== id) : [...prev, id]))
  }

  const handleMarkAsRead = async (ids: number[]) => {
    try {
      await fetch("/api/student/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, status: "read" }),
      })
      setRows((prev) => prev.map((r) => (ids.includes(r.notification_id) ? { ...r, status: "read" } : r)))
      setSelectedNotifications([])
    } catch {}
  }

  const handleDeleteNotifications = async (ids: number[]) => {
    try {
      await fetch("/api/student/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      })
      setRows((prev) => prev.filter((r) => !ids.includes(r.notification_id)))
      setSelectedNotifications([])
    } catch {}
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "border-l-red-500"
      case "medium":
        return "border-l-yellow-500"
      case "low":
        return "border-l-green-500"
      default:
        return "border-l-gray-300"
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Notifications
          </h1>
          <p className="text-muted-foreground">Stay updated with your academic progress and important announcements</p>
        </div>
        <div className="flex items-center space-x-2">
          {selectedNotifications.length > 0 && (
            <>
              <Button variant="outline" size="sm" onClick={() => handleMarkAsRead(selectedNotifications)}>
                <Check className="w-4 h-4 mr-2" />
                Mark Read
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleDeleteNotifications(selectedNotifications)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Loading / Error */}
      {loading && <p className="text-sm text-muted-foreground">Loading notifications...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{notificationList.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Mail className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-2xl font-bold">{unreadCount}</p>
                <p className="text-sm text-muted-foreground">Unread</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{todayCount}</p>
                <p className="text-sm text-muted-foreground">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="important">Important</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>All Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Check className="w-4 h-4 mr-2" />
                    Mark All Read
                  </Button>
                  <Button variant="outline" size="sm">
                    <Archive className="w-4 h-4 mr-2" />
                    Archive All
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {notificationList.map((notification) => {
                const Icon = notification.icon
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start space-x-4 p-4 rounded-lg border-l-4 transition-colors cursor-pointer hover:bg-muted/50",
                      notification.unread ? "bg-blue-50 dark:bg-blue-950/20" : "bg-muted/20",
                      getPriorityColor(notification.priority),
                      selectedNotifications.includes(notification.id) && "ring-2 ring-purple-500",
                    )}
                    onClick={() => handleSelectNotification(notification.id)}
                  >
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={() => handleSelectNotification(notification.id)}
                        className="rounded"
                      />
                      <div className={`p-2 rounded-full bg-muted ${notification.unread ? "ring-2 ring-blue-500" : ""}`}>
                        <Icon className={`w-4 h-4 ${notification.color}`} />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4
                          className={`font-medium ${notification.unread ? "text-foreground" : "text-muted-foreground"}`}
                        >
                          {notification.title}
                        </h4>
                        <div className="flex items-center space-x-2">
                          {notification.unread && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                          <Badge
                            variant={notification.priority === "high" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Unread Notifications</CardTitle>
              <CardDescription>{unreadCount} unread notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {notificationList
                .filter((n) => n.unread)
                .map((notification) => {
                  const Icon = notification.icon
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "flex items-start space-x-4 p-4 rounded-lg border-l-4 bg-blue-50 dark:bg-blue-950/20",
                        getPriorityColor(notification.priority),
                      )}
                    >
                      <div className="p-2 rounded-full bg-muted ring-2 ring-blue-500">
                        <Icon className={`w-4 h-4 ${notification.color}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge
                            variant={notification.priority === "high" ? "destructive" : "secondary"}
                            className="text-xs"
                          >
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-muted-foreground">{notification.time}</p>
                          <Button size="sm" variant="outline" onClick={() => handleMarkAsRead([notification.id])}>
                            Mark as Read
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="important" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Important Notifications</CardTitle>
              <CardDescription>High priority notifications that need your attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {notificationList
                .filter((n) => n.priority === "high")
                .map((notification) => {
                  const Icon = notification.icon
                  return (
                    <div
                      key={notification.id}
                      className="flex items-start space-x-4 p-4 rounded-lg border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="p-2 rounded-full bg-red-100 dark:bg-red-900">
                        <Icon className={`w-4 h-4 ${notification.color}`} />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{notification.title}</h4>
                          <Badge variant="destructive" className="text-xs">
                            High Priority
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                        <p className="text-xs text-muted-foreground mt-2">{notification.time}</p>
                      </div>
                    </div>
                  )
                })}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Customize how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {notificationSettings.map((setting, index) => {
                const Icon = setting.icon
                return (
                  <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
                    <div className="flex items-center space-x-3">
                      <Icon className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h4 className="font-medium">{setting.category}</h4>
                        <p className="text-sm text-muted-foreground">{setting.description}</p>  
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`email-${index}`} className="text-sm">
                          Email
                        </Label>
                        <Switch id={`email-${index}`} defaultChecked={setting.email} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Label htmlFor={`push-${index}`} className="text-sm">
                          Push
                        </Label>
                        <Switch id={`push-${index}`} defaultChecked={setting.push} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}