import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all notifications/announcements
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch all notifications with account information
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select(`
        notification_id,
        account_id,
        message,
        type,
        status,
        created_at,
        accounts (
          account_id,
          email,
          role
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Transform the data
    const transformedNotifications = notifications?.map((notification: any) => ({
      notification_id: notification.notification_id,
      account_id: notification.account_id,
      receiver: notification.accounts?.email || 'N/A',
      receiver_role: notification.accounts?.role || 'N/A',
      message: notification.message,
      type: notification.type,
      status: notification.status,
      created_at: notification.created_at,
    })) || []

    return NextResponse.json({ notifications: transformedNotifications })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new announcement/notification
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { account_id, message, type, status, send_to } = body

    // Validate required fields
    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    if (send_to === "specific" && !account_id) {
      return NextResponse.json({ error: "Account ID is required for specific user" }, { status: 400 })
    }

    let notifications = []
    let targetUsers = []

    // Determine target users based on send_to option
    if (send_to === "specific") {
      // Get specific user
      const { data: user, error: userError } = await supabase
        .from('accounts')
        .select('account_id, email, role')
        .eq('account_id', parseInt(account_id))
        .eq('status', 'active')
        .single()

      if (userError || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }
      targetUsers = [user]
    } else {
      // Get users based on role
      let roleFilter = null
      if (send_to === "all_students") {
        roleFilter = "student"
      } else if (send_to === "all_professors") {
        roleFilter = "professor"
      } else if (send_to === "all_users") {
        roleFilter = null // Get all users
      }

      const query = supabase
        .from('accounts')
        .select('account_id, email, role')
        .eq('status', 'active')
      
      if (roleFilter) {
        query.eq('role', roleFilter)
      }

      const { data: users, error: usersError } = await query

      if (usersError) {
        console.error("Users fetch error:", usersError)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
      }

      targetUsers = users || []
    }

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No users found for the selected criteria" }, { status: 400 })
    }

    // Create notifications for all target users
    const notificationData = targetUsers.map(user => ({
      account_id: user.account_id,
      message,
      type: type || 'general',
      status: status || 'unread'
    }))

    const { data: createdNotifications, error: notificationError } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select(`
        notification_id,
        account_id,
        message,
        type,
        status,
        created_at,
        accounts (
          account_id,
          email,
          role
        )
      `)

    if (notificationError) {
      console.error("Notification creation error:", notificationError)
      return NextResponse.json({ error: "Failed to create notifications" }, { status: 500 })
    }

    // Transform notifications for response
    const transformedNotifications = createdNotifications?.map((notification: any) => ({
      notification_id: notification.notification_id,
      account_id: notification.account_id,
      receiver: notification.accounts?.email || 'N/A',
      receiver_role: notification.accounts?.role || 'N/A',
      message: notification.message,
      type: notification.type,
      status: notification.status,
      created_at: notification.created_at,
    })) || []

    return NextResponse.json({
      message: `Notification${targetUsers.length > 1 ? 's' : ''} created successfully`,
      count: targetUsers.length,
      notifications: transformedNotifications
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update existing announcement/notification
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { notification_id, account_id, message, type, status } = body

    // Validate required fields
    if (!notification_id || !account_id || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Update notification
    const { data: notification, error: notificationError } = await supabase
      .from('notifications')
      .update({
        account_id: parseInt(account_id),
        message,
        type: type || 'general',
        status: status || 'unread'
      })
      .eq('notification_id', notification_id)
      .select(`
        notification_id,
        account_id,
        message,
        type,
        status,
        created_at,
        accounts (
          account_id,
          email,
          role
        )
      `)
      .single()

    if (notificationError) {
      console.error("Notification update error:", notificationError)
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notification updated successfully",
      notification: {
        notification_id: notification.notification_id,
        account_id: notification.account_id,
        receiver: notification.accounts?.email || 'N/A',
        receiver_role: notification.accounts?.role || 'N/A',
        message: notification.message,
        type: notification.type,
        status: notification.status,
        created_at: notification.created_at,
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete announcement/notification
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const notification_id = searchParams.get('notification_id')

    if (!notification_id) {
      return NextResponse.json({ error: "Missing notification_id" }, { status: 400 })
    }

    // Delete notification
    const { error: deleteError } = await supabase
      .from('notifications')
      .delete()
      .eq('notification_id', notification_id)

    if (deleteError) {
      console.error("Notification deletion error:", deleteError)
      return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
    }

    return NextResponse.json({
      message: "Notification deleted successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
