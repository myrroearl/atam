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

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const toolType = searchParams.get('tool_type')

    // Get professor ID from session
    const { data: professor, error: profError } = await supabase
      .from('professors')
      .select('prof_id')
      .eq('account_id', session.user.account_id)
      .single()

    if (profError || !professor) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Build query for AI tools usage
    let query = supabase
      .from('ai_tools_usage')
      .select(`
        usage_id,
        tool_type,
        request_text,
        generated_output,
        success,
        date_used,
        created_at
      `)
      .eq('professor_id', professor.prof_id)
      .eq('status', 'active')
      .order('date_used', { ascending: false })

    // Apply tool type filter if provided
    if (toolType && toolType !== 'all') {
      query = query.eq('tool_type', toolType)
    }

    // Get total count for pagination
    const { count: totalCount } = await supabase
      .from('ai_tools_usage')
      .select('*', { count: 'exact', head: true })
      .eq('professor_id', professor.prof_id)
      .eq('status', 'active')

    // Fetch usage data with pagination
    const { data: usageData, error } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("AI tools usage fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch usage data" }, { status: 500 })
    }

    // Get usage statistics
    const { data: statsData, error: statsError } = await supabase
      .from('ai_tools_usage')
      .select('tool_type, success, date_used')
      .eq('professor_id', professor.prof_id)
      .eq('status', 'active')

    if (statsError) {
      console.error("Stats fetch error:", statsError)
    }

    // Calculate statistics
    const stats = {
      totalUsage: statsData?.length || 0,
      successfulUsage: statsData?.filter(item => item.success).length || 0,
      toolTypeCounts: {} as Record<string, number>,
      recentUsage: statsData?.filter(item => {
        const usageDate = new Date(item.date_used)
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return usageDate >= weekAgo
      }).length || 0
    }

    // Count usage by tool type
    statsData?.forEach(item => {
      if (item.tool_type) {
        stats.toolTypeCounts[item.tool_type] = (stats.toolTypeCounts[item.tool_type] || 0) + 1
      }
    })

    return NextResponse.json({
      success: true,
      data: usageData || [],
      stats,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > offset + limit
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

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { tool_type, request_text, generated_output, success = true } = body

    // Validate required fields
    if (!tool_type) {
      return NextResponse.json({ 
        error: "tool_type is required" 
      }, { status: 400 })
    }

    // Get professor ID from session
    const { data: professor, error: profError } = await supabase
      .from('professors')
      .select('prof_id')
      .eq('account_id', session.user.account_id)
      .single()

    if (profError || !professor) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Insert usage record
    const { data, error } = await supabase
      .from('ai_tools_usage')
      .insert({
        professor_id: professor.prof_id,
        tool_type,
        request_text: request_text || null,
        generated_output: generated_output || null,
        success,
        date_used: new Date().toISOString(),
        status: 'active'
      })
      .select()

    if (error) {
      console.error("Failed to insert AI tool usage:", error)
      return NextResponse.json({ error: "Failed to log usage" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Usage logged successfully",
      data: data[0]
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
