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

    // Get all active students with their related data
    const { data: students, error } = await supabase
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
        accounts (
          email,
          status,
          created_at
        ),
        sections (
          section_name,
          courses (
            course_name,
            course_code,
            departments (
              department_name
            )
          ),
          year_level (
            name
          )
        )
      `)
      .eq('accounts.status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    // Get statistics
    const totalStudents = students?.length || 0
    
    // Get students created in the last semester (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const recentStudents = students?.filter(student => 
      new Date(student.created_at) >= sixMonthsAgo
    ).length || 0

    // Calculate growth percentage
    const previousPeriod = students?.filter(student => {
      const createdDate = new Date(student.created_at)
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return createdDate >= twelveMonthsAgo && createdDate < sixMonthsAgo
    }).length || 0

    const growthPercentage = previousPeriod > 0 
      ? Math.round(((recentStudents - previousPeriod) / previousPeriod) * 100)
      : recentStudents > 0 ? 100 : 0

    return NextResponse.json({ 
      students: students || [],
      statistics: {
        total_students: totalStudents,
        recent_students: recentStudents,
        growth_percentage: growthPercentage,
        growth_period: "from last semester"
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}