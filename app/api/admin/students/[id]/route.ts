import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const student_id = params.id

    // Get student with comprehensive details
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        birthday,
        address,
        contact_number,
        created_at,
        updated_at,
        accounts!inner (
          account_id,
          email,
          status
        ),
        sections (
          section_id,
          section_name,
          year_level_id,
          course_id,
          courses (
            course_id,
            course_code,
            course_name,
            departments (
              department_id,
              department_name
            )
          ),
          year_level (
            year_level_id,
            name
          )
        )
      `)
      .eq('student_id', student_id)
      .eq('accounts.status', 'active')
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try { 
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const student_id = params.id

    // Get student's account_id first
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('account_id')
      .eq('student_id', student_id)
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Soft delete: Update account status to 'inactive' instead of deleting
    const { error: deleteError } = await supabase
      .from('accounts')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('account_id', student.account_id)

    if (deleteError) {
      console.error("Student archive error:", deleteError)
      return NextResponse.json({ error: "Failed to archive student" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Student archived successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
