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

    // Group notifications by message and timestamp (within 5 seconds)
    const notificationsMap = new Map<string, any>()
    
    for (const notification of notifications || []) {
      // Create a key based on message and timestamp (group notifications sent within 5 seconds)
      const createdAt = new Date(notification.created_at).getTime()
      const timeKey = Math.floor(createdAt / 5000) // Group by 5-second windows
      const key = `${notification.message}_${timeKey}`

      if (notificationsMap.has(key)) {
        // Already have this notification group, just continue (counting happens elsewhere)
        continue
      }

      // For new notification, find all similar notifications in this time window
      const similarNotifications = notifications.filter(n => {
        const nTime = Math.floor(new Date(n.created_at).getTime() / 5000)
        return n.message === notification.message && 
               nTime === timeKey
      })

      // Determine receiver label based on grouping
      const firstAccount = Array.isArray(notification.accounts) ? notification.accounts[0] : notification.accounts
      let receiver = firstAccount?.email || 'N/A'
      let receiver_role = firstAccount?.role || 'N/A'
      let receiver_count = similarNotifications.length

      // If this is a bulk notification, determine the group type
      if (receiver_count > 1) {
        const roles = new Set<string>()
        
        // Collect all roles from this group
        similarNotifications.forEach(n => {
          const acc = Array.isArray(n.accounts) ? n.accounts[0] : n.accounts
          if (acc?.role) {
            roles.add(acc.role)
          }
        })
        
        // Also add the role from the first notification
        if (firstAccount?.role) {
          roles.add(firstAccount.role)
        }

        // Determine group label based on roles
        const hasStudents = roles.has('student')
        const hasProfessors = roles.has('professor')
        const hasAdmins = roles.has('admin')
        
        if ((hasStudents && hasProfessors) || (hasStudents && hasProfessors && hasAdmins)) {
          receiver = 'All Users'
          receiver_role = 'All Users'
        } else if (hasStudents && !hasProfessors && !hasAdmins) {
          receiver = 'All Students'
          receiver_role = 'student'
        } else if (hasProfessors && !hasStudents && !hasAdmins) {
          receiver = 'All Professors'
          receiver_role = 'professor'
        } else {
          // Mixed or other combinations - show all roles
          const roleList = Array.from(roles).join(', ')
          receiver = `${receiver_count} Recipients (${roleList})`
          receiver_role = roleList
        }
      }

      notificationsMap.set(key, {
        notification_id: notification.notification_id,
        account_id: notification.account_id,
        receiver,
        receiver_role,
        message: notification.message,
        type: notification.type,
        status: notification.status,
        created_at: notification.created_at,
        receiver_count,
      })
    }

    const transformedNotifications = Array.from(notificationsMap.values())

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

    // Return first notification with grouped info
    const firstNotification = createdNotifications?.[0]
    const firstAccount = Array.isArray(firstNotification?.accounts) 
      ? firstNotification?.accounts[0] 
      : firstNotification?.accounts
    
    let receiver = firstAccount?.email || 'N/A'
    let receiver_role = firstAccount?.role || 'N/A'
    
    // Determine if this was a bulk send based on target users
    if (send_to !== "specific" && targetUsers.length > 1) {
      const roles = new Set(targetUsers.map(u => u.role))
      
      if (roles.has('student') && roles.has('professor')) {
        receiver = 'All Users'
        receiver_role = 'All Users'
      } else if (roles.has('student') && !roles.has('professor')) {
        receiver = 'All Students'
        receiver_role = 'student'
      } else if (roles.has('professor') && !roles.has('student')) {
        receiver = 'All Professors'
        receiver_role = 'professor'
      }
    }

    const transformedNotifications = firstNotification ? [{
      notification_id: firstNotification.notification_id,
      account_id: firstNotification.account_id,
      receiver,
      receiver_role,
      message: firstNotification.message,
      type: firstNotification.type,
      status: firstNotification.status,
      created_at: firstNotification.created_at,
      receiver_count: targetUsers.length,
    }] : []

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
    const { notification_id, message, type, status, send_to, account_id } = body

    // Validate required fields
    if (!notification_id || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // First, get the original notification to understand its scope
    const { data: originalNotification, error: fetchError } = await supabase
      .from('notifications')
      .select('message, created_at')
      .eq('notification_id', notification_id)
      .single()

    if (fetchError || !originalNotification) {
      return NextResponse.json({ error: "Notification not found" }, { status: 404 })
    }

    // Check if this is part of a bulk notification (same message and similar timestamp)
    const notificationTime = new Date(originalNotification.created_at).getTime()
    const timeKey = Math.floor(notificationTime / 5000)
    
    const { data: allNotifications, error: allError } = await supabase
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
    
    if (allError) {
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    // Find all notifications in the same group (same message, within 5 seconds)
    const similarNotifications = allNotifications.filter(n => {
      const nTime = Math.floor(new Date(n.created_at).getTime() / 5000)
      return n.message === originalNotification.message && 
             nTime === timeKey
    })

    // Update all notifications in the group if this was a bulk send
    const isBulkNotification = similarNotifications.length > 1
    let updateCount = 0

    if (isBulkNotification) {
      if (send_to && send_to !== "keep_same") {
        // This is a bulk notification and sender wants to change target group
        // Delete old notifications and create new ones with the new target
        
        const notificationIds = similarNotifications.map(n => n.notification_id)
        
        // Delete old notifications
        const { error: deleteError } = await supabase
          .from('notifications')
          .delete()
          .in('notification_id', notificationIds)
        
        if (deleteError) {
          return NextResponse.json({ error: "Failed to delete old notifications" }, { status: 500 })
        }

        // Create new notifications with updated content and new recipients
        let targetUsers: Array<{ account_id: number; email: string; role: string }> = []
        
        if (send_to === "specific" && account_id) {
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
        } else if (send_to === "all_students" || send_to === "all_professors" || send_to === "all_users") {
          // Get users based on role
          let roleFilter = null
          if (send_to === "all_students") {
            roleFilter = "student"
          } else if (send_to === "all_professors") {
            roleFilter = "professor"
          }

          const { data: users, error: usersError } = await supabase
            .from('accounts')
            .select('account_id, email, role')
            .eq('status', 'active')
            .eq(roleFilter ? 'role' : 'status', roleFilter || 'active')

          if (usersError) {
            return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
          }
          targetUsers = users || []
        }

        if (targetUsers.length === 0) {
          return NextResponse.json({ error: "No users found for the selected criteria" }, { status: 400 })
        }

        // Create new notifications
        const notificationData = targetUsers.map(user => ({
          account_id: user.account_id,
          message,
          type: type || 'general',
          status: status || 'unread'
        }))

        const { data: createdNotifications, error: createError } = await supabase
          .from('notifications')
          .insert(notificationData)
          .select(`
            notification_id,
            account_id,
            message,
            type,
            status,
            created_at
          `)

        if (createError) {
          return NextResponse.json({ error: "Failed to create new notifications" }, { status: 500 })
        }

        updateCount = targetUsers.length

        return NextResponse.json({
          message: `Bulk notification updated successfully`,
          count: updateCount,
          updated: true
        })
      } else {
        // Bulk notification - just update message/content for all recipients without changing recipients
        const { error: updateError } = await supabase
          .from('notifications')
          .update({
            message,
            type: type || 'general',
            status: status || 'unread'
          })
          .in('notification_id', similarNotifications.map(n => n.notification_id))

        if (updateError) {
          console.error("Bulk notification update error:", updateError)
          return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
        }

        return NextResponse.json({
          message: `Bulk notification updated successfully`,
          count: similarNotifications.length,
          updated: true
        })
      }
    } else {
      // Single notification update
      const { data: notification, error: notificationError } = await supabase
        .from('notifications')
        .update({
          account_id: account_id ? parseInt(account_id) : undefined,
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

      const firstAccount = Array.isArray(notification.accounts) ? notification.accounts[0] : notification.accounts
      
      return NextResponse.json({
        message: "Notification updated successfully",
        notification: {
          notification_id: notification.notification_id,
          account_id: notification.account_id,
          receiver: firstAccount?.email || 'N/A',
          receiver_role: firstAccount?.role || 'N/A',
          message: notification.message,
          type: notification.type,
          status: notification.status,
          created_at: notification.created_at,
        }
      })
    }
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
    const bulk_delete = searchParams.get('bulk_delete') === 'true'

    if (!notification_id) {
      return NextResponse.json({ error: "Missing notification_id" }, { status: 400 })
    }

    if (bulk_delete) {
      // Bulk delete: Delete all notifications with the same message
      // First, get the notification to find its message and timestamp
      const { data: originalNotification, error: fetchError } = await supabase
        .from('notifications')
        .select('message, created_at')
        .eq('notification_id', notification_id)
        .single()

      if (fetchError || !originalNotification) {
        return NextResponse.json({ error: "Notification not found" }, { status: 404 })
      }

      // Find all notifications with the same message and similar timestamp (within 5 seconds)
      const notificationTime = new Date(originalNotification.created_at).getTime()
      const timeKey = Math.floor(notificationTime / 5000)
      
      const { data: allNotifications, error: allError } = await supabase
        .from('notifications')
        .select('notification_id, message, created_at')
      
      if (allError) {
        return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
      }

      // Find all notifications in the same group (same message, within 5 seconds)
      const similarNotifications = allNotifications.filter(n => {
        const nTime = Math.floor(new Date(n.created_at).getTime() / 5000)
        return n.message === originalNotification.message && 
               nTime === timeKey
      })

      if (similarNotifications.length === 0) {
        return NextResponse.json({ error: "No notifications found to delete" }, { status: 404 })
      }

      // Delete all notifications in the group
      const notificationIds = similarNotifications.map(n => n.notification_id)
      
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .in('notification_id', notificationIds)

      if (deleteError) {
        console.error("Bulk notification deletion error:", deleteError)
        return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
      }

      return NextResponse.json({
        message: `Bulk notification deleted successfully`,
        deleted_count: notificationIds.length,
        bulk_deleted: true
      })
    } else {
      // Single notification delete
      const { error: deleteError } = await supabase
        .from('notifications')
        .delete()
        .eq('notification_id', notification_id)

      if (deleteError) {
        console.error("Notification deletion error:", deleteError)
        return NextResponse.json({ error: "Failed to delete notification" }, { status: 500 })
      }

      return NextResponse.json({
        message: "Notification deleted successfully",
        bulk_deleted: false
      })
    }
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
