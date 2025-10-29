import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all departments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data: departments, error } = await supabase
      .from('departments')
      .select(`
        *,
        grade_components (
          component_id,
          component_name,
          weight_percentage,
          created_at
        )
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch departments" }, { status: 500 })
    }

    return NextResponse.json({ departments })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create a new department
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { department_name, description, dean_name } = body

    // Validate required fields
    if (!department_name || !dean_name) {
      return NextResponse.json({ 
        error: "Department name and dean name are required" 
      }, { status: 400 })
    }

    // Check if department name already exists
    const { data: existingDept } = await supabase
      .from('departments')
      .select('department_id')
      .eq('department_name', department_name)
      .single()

    if (existingDept) {
      return NextResponse.json({ 
        error: "Department with this name already exists" 
      }, { status: 409 })
    }

    // Insert new department
    const { data: newDepartment, error } = await supabase
      .from('departments')
      .insert([{
        department_name,
        description: description || null,
        dean_name
      }])
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to create department" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Department created successfully",
      department: newDepartment 
    }, { status: 201 })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
