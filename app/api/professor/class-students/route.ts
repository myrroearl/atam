import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API endpoint to fetch students enrolled in a specific class
 * Used for Google Classroom synchronization
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get('class_id')

    if (!classId) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    console.log(`[Class Students] Fetching students for class ${classId}`)

    // Fetch students enrolled in the class
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        accounts!inner(
          account_id,
          email
        )
      `)
      .eq('accounts.role', 'student')

    if (error) {
      console.error('[Class Students] Database error:', error)
      return NextResponse.json({ 
        error: "Failed to fetch students from database",
        details: error.message 
      }, { status: 500 })
    }

    // Transform the data to a cleaner format
    const transformedStudents = students?.map(student => ({
      student_id: student.student_id,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      email: (student.accounts as any)?.email || '',
      full_name: `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`
    })) || []

    console.log(`[Class Students] Found ${transformedStudents.length} students in database`)

    return NextResponse.json({
      success: true,
      students: transformedStudents,
      total: transformedStudents.length
    })

  } catch (error) {
    console.error("[Class Students] Error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch class students",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
