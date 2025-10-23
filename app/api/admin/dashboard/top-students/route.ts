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

    // Get students with their performance metrics
    const { data: students, error } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        created_at,
        accounts (
          email,
          status
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
        ),
        final_grades (
          grade,
          subject_id,
          year_taken,
          taken,
          credited,
          subjects (
            subject_name,
            units,
            courses (
              course_name
            )
          )
        )
      `)
      .eq('accounts.status', 'active')

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    // Calculate performance metrics for each student
    const studentsWithMetrics = students?.map(student => {
      const finalGrades = student.final_grades || []
      
      // Calculate metrics
      const totalSubjects = finalGrades.length
      const completedSubjects = finalGrades.filter((grade: any) => grade.taken).length
      const creditedSubjects = finalGrades.filter((grade: any) => grade.credited).length
      
      // Calculate average grade
      const validGrades = finalGrades.filter((grade: any) => 
        grade.grade !== null && grade.grade !== undefined && grade.taken
      )
      const averageGrade = validGrades.length > 0 
        ? validGrades.reduce((sum: number, grade: any) => sum + Number(grade.grade), 0) / validGrades.length
        : 0
      
      // Calculate total units
      const totalUnits = finalGrades.reduce((sum: number, grade: any) => 
        sum + (grade.subjects?.units || 0), 0
      )
      
      // Calculate completion rate
      const completionRate = totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0
      
      // Calculate credit rate
      const creditRate = completedSubjects > 0 ? (creditedSubjects / completedSubjects) * 100 : 0
      
      // Recent performance (last year)
      const currentYear = new Date().getFullYear()
      const recentGrades = finalGrades.filter((grade: any) => 
        grade.year_taken === currentYear || grade.year_taken === currentYear - 1
      )
      const recentAverageGrade = recentGrades.length > 0 
        ? recentGrades.reduce((sum: number, grade: any) => sum + Number(grade.grade || 0), 0) / recentGrades.length
        : 0

      // Calculate performance score (weighted combination of metrics)
      const performanceScore = (
        (averageGrade * 0.4) +           // 40% - Overall academic performance
        (completionRate * 0.3) +         // 30% - Course completion rate
        (creditRate * 0.2) +             // 20% - Credit earning rate
        (recentAverageGrade * 0.1)       // 10% - Recent performance
      )

      return {
        ...student,
        metrics: {
          total_subjects: totalSubjects,
          completed_subjects: completedSubjects,
          credited_subjects: creditedSubjects,
          average_grade: Math.round(averageGrade * 100) / 100,
          recent_average_grade: Math.round(recentAverageGrade * 100) / 100,
          completion_rate: Math.round(completionRate * 100) / 100,
          credit_rate: Math.round(creditRate * 100) / 100,
          total_units: totalUnits,
          performance_score: Math.round(performanceScore * 100) / 100
        }
      }
    }) || []

    // Sort by performance score and get top performers
    const topStudents = studentsWithMetrics
      .sort((a, b) => b.metrics.performance_score - a.metrics.performance_score)
      .slice(0, 10) // Top 10 students

    // Get statistics
    const totalTopPerformers = topStudents.length
    const avgPerformanceScore = topStudents.length > 0 
      ? Math.round(topStudents.reduce((sum, student) => sum + student.metrics.performance_score, 0) / topStudents.length * 100) / 100
      : 0

    // Calculate growth (comparing with previous semester)
    const previousSemester = studentsWithMetrics.filter(student => {
      const createdDate = new Date(student.created_at)
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return createdDate >= twelveMonthsAgo && createdDate < sixMonthsAgo
    }).length

    const currentSemester = studentsWithMetrics.filter(student => {
      const createdDate = new Date(student.created_at)
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
      return createdDate >= sixMonthsAgo
    }).length

    const growthPercentage = previousSemester > 0 
      ? Math.round(((currentSemester - previousSemester) / previousSemester) * 100)
      : currentSemester > 0 ? 100 : 0

    return NextResponse.json({ 
      top_students: topStudents,
      statistics: {
        total_top_performers: totalTopPerformers,
        average_performance_score: avgPerformanceScore,
        growth_percentage: growthPercentage,
        growth_period: "from last semester",
        department_breakdown: topStudents.reduce((acc: any, student) => {
          const dept = student.sections?.courses?.departments?.department_name || 'Unknown'
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