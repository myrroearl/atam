import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get unauthorized access attempts from activity logs
    const { data: unauthorizedLogs, error } = await supabase
      .from('activity_logs')
      .select(`
        log_id,
        action,
        description,
        created_at,
        accounts (
          email,
          role,
          status
        )
      `)
      .or('action.ilike.%unauthorized%,action.ilike.%failed login%,action.ilike.%invalid access%,action.ilike.%suspicious%')
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch unauthorized logs" }, { status: 500 })
    }

    // Also check for failed login attempts (these might be in a different pattern)
    const { data: failedLogins, error: failedError } = await supabase
      .from('activity_logs')
      .select(`
        log_id,
        action,
        description,
        created_at,
        accounts (
          email,
          role,
          status
        )
      `)
      .ilike('action', '%login%')
      .ilike('description', '%failed%')
      .order('created_at', { ascending: false })
      .limit(50)

    if (failedError) {
      console.error("Database error for failed logins:", failedError)
    }

    // Combine and deduplicate logs
    const allLogs = [...(unauthorizedLogs || []), ...(failedLogins || [])]
    const uniqueLogs = allLogs.filter((log, index, self) => 
      index === self.findIndex(l => l.log_id === log.log_id)
    )

    // Get statistics
    const totalUnauthorizedLogs = uniqueLogs.length
    
    // Get logs from last 24 hours
    const twentyFourHoursAgo = new Date()
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
    
    const recentLogs = uniqueLogs.filter(log => 
      new Date(log.created_at) >= twentyFourHoursAgo
    )

    // Get logs from previous 24 hours for comparison
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)
    
    const previousPeriodLogs = uniqueLogs.filter(log => {
      const logDate = new Date(log.created_at)
      return logDate >= fortyEightHoursAgo && logDate < twentyFourHoursAgo
    })

    const growthPercentage = previousPeriodLogs.length > 0 
      ? Math.round(((recentLogs.length - previousPeriodLogs.length) / previousPeriodLogs.length) * 100)
      : recentLogs.length > 0 ? 100 : 0

    // Categorize logs by type
    const logCategories = uniqueLogs.reduce((acc: any, log) => {
      const action = log.action.toLowerCase()
      if (action.includes('login') || action.includes('authentication')) {
        acc.login_attempts = (acc.login_attempts || 0) + 1
      } else if (action.includes('access') || action.includes('permission')) {
        acc.access_violations = (acc.access_violations || 0) + 1
      } else if (action.includes('suspicious') || action.includes('anomaly')) {
        acc.suspicious_activity = (acc.suspicious_activity || 0) + 1
      } else {
        acc.other = (acc.other || 0) + 1
      }
      return acc
    }, {})

    // Get most common IPs or patterns (if available in description)
    const commonPatterns = uniqueLogs.reduce((acc: any, log) => {
      if (log.description) {
        const desc = log.description.toLowerCase()
        if (desc.includes('ip:')) {
          const ipMatch = desc.match(/ip:\s*([^\s,]+)/)
          if (ipMatch) {
            const ip = ipMatch[1]
            acc[ip] = (acc[ip] || 0) + 1
          }
        }
      }
      return acc
    }, {})

    return NextResponse.json({ 
      unauthorized_logs: uniqueLogs.slice(0, 50), // Return latest 50 logs
      statistics: {
        total_unauthorized_logs: totalUnauthorizedLogs,
        recent_logs_24h: recentLogs.length,
        growth_percentage: growthPercentage,
        growth_period: "from last 24 hours",
        categories: logCategories,
        common_patterns: Object.entries(commonPatterns)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10)
          .map(([pattern, count]) => ({ pattern, count }))
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}