import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const actionFilter = searchParams.get('action')
    const searchTerm = searchParams.get('search')

    // Build query
    let query = supabaseServer
      .from("activity_logs")
      .select(`
        log_id,
        action,
        description,
        created_at
      `)
      .eq("account_id", session.user.account_id)

    // Apply action filter
    if (actionFilter && actionFilter !== 'all') {
      if (actionFilter === 'other') {
        // Filter out common actions to show "other"
        query = query.not('action', 'in', '(login,grade,grading,class,course,ai,ai_tool)')
      } else {
        query = query.eq('action', actionFilter)
      }
    }

    // Apply search filter
    if (searchTerm) {
      query = query.or(`action.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
    }

    // Get total count for pagination
    const { count: totalCount } = await supabaseServer
      .from("activity_logs")
      .select('*', { count: 'exact', head: true })
      .eq("account_id", session.user.account_id)

    // Fetch activity logs with filters
    const { data: activityLogs, error } = await query
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Activity logs fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
    }

    // Format the logs for display
    const formattedLogs = (activityLogs || []).map(log => ({
      id: log.log_id,
      action: log.action,
      description: log.description,
      timestamp: log.created_at,
      timeAgo: getTimeAgo(new Date(log.created_at))
    }))

    return NextResponse.json({ 
      logs: formattedLogs,
      hasMore: formattedLogs.length === limit,
      total: totalCount || 0
    })
  } catch (err) {
    console.error("Activity logs API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

function getTimeAgo(date: Date): string {
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
  
  if (diffInSeconds < 60) {
    return "Just now"
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes}m ago`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours}h ago`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days}d ago`
  } else {
    return date.toLocaleDateString()
  }
}
