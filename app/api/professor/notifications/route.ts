import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // 'all', 'unread', 'read'

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Build query
    let query = supabase
      .from("notifications")
      .select(`
        notification_id,
        message,
        type,
        status,
        created_at
      `)
      .eq("account_id", Number(session.user.account_id))
      .order("created_at", { ascending: false })

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq("status", status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: notifications, error } = await query

    if (error) {
      console.error("Error fetching notifications:", error)
      return NextResponse.json({ 
        error: "Failed to fetch notifications",
        details: error.message
      }, { status: 500 })
    }

    // Format notifications for frontend
    const formattedNotifications = notifications?.map(notification => ({
      id: notification.notification_id,
      title: getNotificationTitle(notification.type),
      description: notification.message,
      time: formatTimeAgo(notification.created_at),
      type: notification.type,
      status: notification.status,
      unread: notification.status === 'unread',
      createdAt: notification.created_at
    })) || []

    return NextResponse.json({ 
      notifications: formattedNotifications,
      total: formattedNotifications.length
    }, { status: 200 })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { notification_id, action } = body

    if (!notification_id || !action) {
      return NextResponse.json({ 
        error: "Missing required fields: notification_id, action" 
      }, { status: 400 })
    }

    if (!['mark_read', 'mark_unread', 'mark_all_read'].includes(action)) {
      return NextResponse.json({ 
        error: "Invalid action. Must be 'mark_read', 'mark_unread', or 'mark_all_read'" 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    if (action === 'mark_all_read') {
      // Mark all notifications as read for this professor
      const { error } = await supabase
        .from("notifications")
        .update({ status: 'read' })
        .eq("account_id", Number(session.user.account_id))
        .eq("status", "unread")

      if (error) {
        console.error("Error marking all notifications as read:", error)
        return NextResponse.json({ 
          error: "Failed to mark all notifications as read",
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: "All notifications marked as read" 
      }, { status: 200 })
    } else {
      // Mark specific notification as read/unread
      const newStatus = action === 'mark_read' ? 'read' : 'unread'
      
      const { error } = await supabase
        .from("notifications")
        .update({ status: newStatus })
        .eq("notification_id", notification_id)
        .eq("account_id", Number(session.user.account_id))

      if (error) {
        console.error("Error updating notification status:", error)
        return NextResponse.json({ 
          error: "Failed to update notification status",
          details: error.message
        }, { status: 500 })
      }

      return NextResponse.json({ 
        success: true, 
        message: `Notification ${action === 'mark_read' ? 'marked as read' : 'marked as unread'}` 
      }, { status: 200 })
    }

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to get notification title based on type
function getNotificationTitle(type: string | null): string {
  switch (type) {
    case 'assignment_submission':
      return 'New Assignment Submission'
    case 'grade_update':
      return 'Grade Updated'
    case 'class_schedule':
      return 'Class Schedule Update'
    case 'student_achievement':
      return 'Student Achievement'
    case 'meeting_reminder':
      return 'Meeting Reminder'
    case 'system_announcement':
      return 'System Announcement'
    case 'grade_report':
      return 'Grade Report Ready'
    case 'attendance_alert':
      return 'Attendance Alert'
    default:
      return 'Notification'
  }
}

// Helper function to format time ago
function formatTimeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Just now'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} day${days !== 1 ? 's' : ''} ago`
  } else {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }
}
