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
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    // Build query - filter by course_id if provided, otherwise get all
    let query = supabase
      .from('year_level')
      .select(`
        year_level_id,
        name,
        course_id,
        created_at,
        updated_at,
        courses (
          course_name,
          course_code,
          departments (
            department_name
          )
        )
      `)
      .eq('status', 'active')
      .order('name', { ascending: true })

    // Apply course filter if provided
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: yearLevels, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch year levels' }, { status: 500 })
    }

    return NextResponse.json({ 
      yearLevels: yearLevels || [],
      total_count: (yearLevels || []).length
    })
  } catch (error) {
    console.error('Error in year levels GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { course_id, name } = body

    // Validate required fields
    if (!course_id || !name) {
      return NextResponse.json(
        { error: 'Course ID and name are required' },
        { status: 400 }
      )
    }

    // Create year level
    const { data: yearLevel, error } = await supabase
      .from('year_level')
      .insert({
        course_id,
        name
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to create year level' }, { status: 500 })
    }

    return NextResponse.json({ yearLevel })
  } catch (error) {
    console.error('Error in year levels POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}