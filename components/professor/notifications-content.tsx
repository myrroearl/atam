"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  Bell, 
  Search, 
  Filter, 
  Check, 
  CheckCheck, 
  X, 
  RefreshCw,
  BookOpen,
  Clock,
  Award,
  Users,
  FileText,
  Calendar,
  AlertCircle,
  Info,
  MessageSquare
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

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

export function NotificationsContent() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const { toast } = useToast()

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/professor/notifications?limit=50')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch notifications",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
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
        toast({
          title: "Success",
          description: "Notification marked as read",
        })
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
        return <FileText className="h-4 w-4" />
      case 'grade_update':
        return <Award className="h-4 w-4" />
      case 'class_schedule':
        return <Calendar className="h-4 w-4" />
      case 'student_achievement':
        return <Award className="h-4 w-4" />
      case 'meeting_reminder':
        return <Users className="h-4 w-4" />
      case 'system_announcement':
        return <Info className="h-4 w-4" />
      case 'grade_report':
        return <BookOpen className="h-4 w-4" />
      case 'attendance_alert':
        return <AlertCircle className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'assignment_submission':
        return 'text-blue-600 bg-blue-50 dark:bg-blue-950'
      case 'grade_update':
        return 'text-green-600 bg-green-50 dark:bg-green-950'
      case 'class_schedule':
        return 'text-purple-600 bg-purple-50 dark:bg-purple-950'
      case 'student_achievement':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
      case 'meeting_reminder':
        return 'text-orange-600 bg-orange-50 dark:bg-orange-950'
      case 'system_announcement':
        return 'text-cyan-600 bg-cyan-50 dark:bg-cyan-950'
      case 'grade_report':
        return 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950'
      case 'attendance_alert':
        return 'text-red-600 bg-red-50 dark:bg-red-950'
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.description.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter
    const matchesType = typeFilter === 'all' || notification.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const unreadCount = notifications.filter(n => n.unread).length
  const typeOptions = Array.from(new Set(notifications.map(n => n.type))).filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8 text-primary" />
            Notifications
          </h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 
              ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
              : 'All caught up! No unread notifications'
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Status: {statusFilter === 'all' ? 'All' : statusFilter}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setStatusFilter('all')}>
              All ({notifications.length})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('unread')}>
              Unread ({unreadCount})
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter('read')}>
              Read ({notifications.length - unreadCount})
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {typeOptions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Type: {typeFilter === 'all' ? 'All' : typeFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter('all')}>
                All Types
              </DropdownMenuItem>
              {typeOptions.map(type => (
                <DropdownMenuItem key={type} onClick={() => setTypeFilter(type)}>
                  {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="text-center py-12">
          <Bell className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {notifications.length === 0 
              ? "No notifications yet" 
              : "No notifications match your filters"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {notifications.length === 0 
              ? "You'll see notifications here when they arrive" 
              : "Try adjusting your search or filter criteria"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`hover:shadow-md transition-shadow ${
                notification.unread ? 'border-l-4 border-l-primary bg-primary/5' : ''
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full ${getNotificationColor(notification.type)}`}>
                    {getNotificationIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium ${
                            notification.unread ? 'text-foreground' : 'text-muted-foreground'
                          }`}>
                            {notification.title}
                          </h3>
                          {notification.unread && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {notification.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
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
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Summary */}
      {notifications.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{notifications.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{unreadCount}</p>
                <p className="text-xs text-muted-foreground">Unread</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{notifications.length - unreadCount}</p>
                <p className="text-xs text-muted-foreground">Read</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">{typeOptions.length}</p>
                <p className="text-xs text-muted-foreground">Types</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
