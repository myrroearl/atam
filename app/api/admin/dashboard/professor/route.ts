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

    // Get all active professors with their related data
    const { data: professors, error } = await supabase
      .from('professors')
      .select(`
        prof_id,
        first_name,
        middle_name,
        last_name,
        birthday,
        address,
        contact_number,
        faculty_type,
        preferred_time,
        preferred_days,
        created_at,
        updated_at,
        accounts (
          email,
          status,
          created_at
        ),
        departments (
          department_name,
          dean_name
        )
      `)
      .eq('accounts.status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 })
    }

    // Get statistics
    const totalProfessors = professors?.length || 0
    
    // Get professors hired in the last school year (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    
    const recentProfessors = professors?.filter(professor => 
      new Date(professor.created_at) >= twelveMonthsAgo
    ).length || 0

    // Calculate growth percentage
    const previousPeriod = professors?.filter(professor => {
      const createdDate = new Date(professor.created_at)
      const twentyFourMonthsAgo = new Date()
      twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24)
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      return createdDate >= twentyFourMonthsAgo && createdDate < twelveMonthsAgo
    }).length || 0

    const growthPercentage = previousPeriod > 0 
      ? Math.round(((recentProfessors - previousPeriod) / previousPeriod) * 100)
      : recentProfessors > 0 ? 100 : 0

    // Get department distribution
    const departmentStats = professors?.reduce((acc: any, professor) => {
      const deptName = professor.departments?.department_name || 'Unknown'
      acc[deptName] = (acc[deptName] || 0) + 1
      return acc
    }, {}) || {}

    return NextResponse.json({ 
      professors: professors || [],
      statistics: {
        total_professors: totalProfessors,
        recent_professors: recentProfessors,
        growth_percentage: growthPercentage,
        growth_period: "from last school year",
        department_distribution: departmentStats
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}