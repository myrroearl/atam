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

    // Get professors with their performance metrics
    const { data: professors, error } = await supabase
      .from('professors')
      .select(`
        prof_id,
        first_name,
        middle_name,
        last_name,
        faculty_type,
        created_at,
        departments (
          department_name
        ),
        accounts (
          email,
          status
        ),
        classes (
          class_id,
          class_name,
          schedule_start,
          schedule_end,
          subjects (
            subject_name,
            units
          ),
          sections (
            section_name,
            courses (
              course_name
            )
          )
        ),
        ai_tools_usage (
          usage_id,
          tool_type,
          success,
          date_used
        )
      `)
      .eq('accounts.status', 'active')

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 })
    }

    // Calculate performance metrics for each professor
    const professorsWithMetrics = professors?.map(professor => {
      const classes = professor.classes || []
      const aiUsage = professor.ai_tools_usage || []
      
      // Calculate metrics
      const totalClasses = classes.length
      const totalUnits = classes.reduce((sum: number, cls: any) => 
        sum + (cls.subjects?.units || 0), 0
      )
      const totalStudents = classes.reduce((sum: number, cls: any) => 
        sum + (cls.sections?.length || 0), 0
      )
      
      // AI tools usage metrics
      const successfulAiUsage = aiUsage.filter((usage: any) => usage.success).length
      const totalAiUsage = aiUsage.length
      const aiSuccessRate = totalAiUsage > 0 ? (successfulAiUsage / totalAiUsage) * 100 : 0
      
      // Recent activity (last 6 months)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      
      const recentClasses = classes.filter((cls: any) => 
        new Date(cls.schedule_start) >= sixMonthsAgo
      ).length
      
      const recentAiUsage = aiUsage.filter((usage: any) => 
        new Date(usage.date_used) >= sixMonthsAgo
      ).length

      // Calculate performance score (weighted combination of metrics)
      const performanceScore = (
        (totalClasses * 0.3) +
        (totalUnits * 0.2) +
        (aiSuccessRate * 0.3) +
        (recentClasses * 0.1) +
        (recentAiUsage * 0.1)
      )

      return {
        ...professor,
        metrics: {
          total_classes: totalClasses,
          total_units: totalUnits,
          total_students: totalStudents,
          ai_usage_count: totalAiUsage,
          ai_success_rate: Math.round(aiSuccessRate * 100) / 100,
          recent_classes: recentClasses,
          recent_ai_usage: recentAiUsage,
          performance_score: Math.round(performanceScore * 100) / 100
        }
      }
    }) || []

    // Sort by performance score and get top performers
    const topProfessors = professorsWithMetrics
      .sort((a, b) => b.metrics.performance_score - a.metrics.performance_score)
      .slice(0, 10) // Top 10 professors

    // Get statistics
    const totalTopPerformers = topProfessors.length
    const avgPerformanceScore = topProfessors.length > 0 
      ? Math.round(topProfessors.reduce((sum, prof) => sum + prof.metrics.performance_score, 0) / topProfessors.length * 100) / 100
      : 0

    // Calculate growth (comparing with previous semester)
    const previousSemester = professorsWithMetrics.filter(prof => {
      const createdDate = new Date(prof.created_at)
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return createdDate >= twelveMonthsAgo && createdDate < sixMonthsAgo
    }).length

    const currentSemester = professorsWithMetrics.filter(prof => {
      const createdDate = new Date(prof.created_at)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return createdDate >= sixMonthsAgo
    }).length

    const growthPercentage = previousSemester > 0 
      ? Math.round(((currentSemester - previousSemester) / previousSemester) * 100)
      : currentSemester > 0 ? 100 : 0

    return NextResponse.json({ 
      top_professors: topProfessors,
      statistics: {
        total_top_performers: totalTopPerformers,
        average_performance_score: avgPerformanceScore,
        growth_percentage: growthPercentage,
        growth_period: "from last semester",
        department_breakdown: topProfessors.reduce((acc: any, prof) => {
          const dept = prof.departments?.department_name || 'Unknown'
          acc[dept] = (acc[dept] || 0) + 1
          return acc
        }, {})
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}