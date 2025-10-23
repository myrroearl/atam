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

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url)
    const role = searchParams.get("role") // student, professor, admin
    const action = searchParams.get("action") // specific action filter
    const startDate = searchParams.get("startDate")
    const endDate = searchParams.get("endDate")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('activity_logs')
      .select(`
        log_id,
        account_id,
        action,
        description,
        created_at,
        status,
        accounts (
          account_id,
          email,
          role,
          students (
            first_name,
            middle_name,
            last_name
          ),
          professors (
            first_name,
            middle_name,
            last_name
          )
        )
      `, { count: 'exact' })
      .eq('status', 'active')

    // Apply filters
    if (startDate) {
      query = query.gte('created_at', startDate)
    }
    if (endDate) {
      query = query.lte('created_at', endDate)
    }
    if (action) {
      query = query.ilike('action', `%${action}%`)
    }

    // Apply role filter BEFORE counting and pagination by constraining account_ids
    if (role && role !== "all") {
      const { data: roleAccounts, error: roleErr } = await supabase
        .from('accounts')
        .select('account_id')
        .eq('role', role)

      if (roleErr) {
        console.error('Role filter error:', roleErr)
        return NextResponse.json({ error: 'Failed to apply role filter' }, { status: 500 })
      }

      const accountIds = (roleAccounts || []).map((a: any) => a.account_id)

      // If no accounts match the role, return empty result early
      if (accountIds.length === 0) {
        return NextResponse.json({
          logs: [],
          pagination: {
            page,
            limit,
            total: 0,
            totalPages: 0,
          },
        })
      }

      query = query.in('account_id', accountIds)
    }

    // Get total count first
    const { count } = await query

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: logs, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch activity logs" }, { status: 500 })
    }

    // Transform the data to include user names
    const transformedLogs = logs
      ?.map((log: any) => {
        const account = log.accounts
        let userName = "Unknown User"
        let userRole = account?.role || "unknown"

        if (account) {
          if (account.role === "student" && account.students && account.students.length > 0) {
            const student = account.students[0]
            userName = `${student.first_name} ${student.middle_name || ''} ${student.last_name}`.trim().replace(/\s+/g, ' ')
          } else if (account.role === "professor" && account.professors && account.professors.length > 0) {
            const professor = account.professors[0]
            userName = `${professor.first_name} ${professor.middle_name || ''} ${professor.last_name}`.trim().replace(/\s+/g, ' ')
          } else if (account.role === "admin") {
            userName = account.email.split('@')[0] || account.email
          }
        }

        return {
          log_id: log.log_id,
          account_id: log.account_id,
          user_name: userName,
          user_role: userRole,
          action: log.action,
          description: log.description,
          created_at: log.created_at,
          status: log.status,
          email: account?.email || ""
        }
      }) || []

    return NextResponse.json({
      logs: transformedLogs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { account_id, action, description } = body

    // Validate required fields
    if (!action) {
      return NextResponse.json({ error: "Action is required" }, { status: 400 })
    }

    // Use account_id from body or session
    const logAccountId = account_id || session.user.account_id

    // Insert activity log
    const { data, error } = await supabase
      .from('activity_logs')
      .insert({
        account_id: logAccountId,
        action,
        description: description || null,
        status: 'active'
      })
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create activity log" }, { status: 500 })
    }

    return NextResponse.json({ success: true, log: data[0] }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
