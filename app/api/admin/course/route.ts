import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all courses (with optional department filter)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const departmentId = searchParams.get('department_id')

    let query = supabase
      .from('courses')
      .select(`
        *,
        departments (
          department_name,
          dean_name
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    // Filter by department if specified
    if (departmentId) {
      query = query.eq('department_id', departmentId)
    }

    const { data: courses, error } = await query

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 })
    }

    return NextResponse.json({ courses })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new course
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { course_code, course_name, description, department_id } = body

    // Validate required fields
    if (!course_code || !course_name || !department_id) {
      return NextResponse.json({ 
        error: "Course code, course name, and department ID are required" 
      }, { status: 400 })
    }

    // Check if course code already exists
    const { data: existingCourse } = await supabase
      .from('courses')
      .select('course_id')
      .eq('course_code', course_code)
      .single()

    if (existingCourse) {
      return NextResponse.json({ 
        error: "Course with this code already exists" 
      }, { status: 409 })
    }

    // Check if department exists
    const { data: department } = await supabase
      .from('departments')
      .select('department_id')
      .eq('department_id', department_id)
      .single()

    if (!department) {
      return NextResponse.json({ 
        error: "Department not found" 
      }, { status: 404 })
    }

    // Insert new course
    const { data: newCourse, error } = await supabase
      .from('courses')
      .insert([{
        course_code,
        course_name,
        description: description || null,
        department_id
      }])
      .select(`
        *,
        departments (
          department_name,
          dean_name
        )
      `)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create course" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Course created successfully",
      course: newCourse 
    }, { status: 201 })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
