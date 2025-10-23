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

    // Fetch all dashboard data in parallel
    const [
      studentsResult,
      professorsResult,
      topStudentsResult,
      unauthorizedLogsResult
    ] = await Promise.allSettled([
      // Students count
      supabase
        .from('students')
        .select('student_id, created_at, accounts!inner(status)')
        .eq('accounts.status', 'active'),
      
      // Professors count
      supabase
        .from('professors')
        .select('prof_id, created_at, accounts!inner(status)')
        .eq('accounts.status', 'active'),
      
      // Top students (simplified query for dashboard)
      supabase
        .from('students')
        .select(`
          student_id,
          first_name,
          last_name,
          created_at,
          accounts!inner(status),
          final_grades (
            grade,
            taken,
            credited,
            subjects (units)
          )
        `)
        .eq('accounts.status', 'active'),
      
      // Unauthorized logs count
      supabase
        .from('activity_logs')
        .select('log_id, action, description, created_at')
        .or('action.ilike.%unauthorized%,action.ilike.%failed login%,action.ilike.%invalid access%')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    ])

    // Process students data
    const students = studentsResult.status === 'fulfilled' ? studentsResult.value.data || [] : []
    const totalStudents = students.length
    
    // Calculate students growth
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const recentStudents = students.filter(student => 
      new Date(student.created_at) >= sixMonthsAgo
    ).length
    
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12)
    const previousPeriodStudents = students.filter(student => {
      const createdDate = new Date(student.created_at)
      return createdDate >= twelveMonthsAgo && createdDate < sixMonthsAgo
    }).length
    
    const studentsGrowth = previousPeriodStudents > 0 
      ? Math.round(((recentStudents - previousPeriodStudents) / previousPeriodStudents) * 100)
      : recentStudents > 0 ? 100 : 0

    // Process professors data
    const professors = professorsResult.status === 'fulfilled' ? professorsResult.value.data || [] : []
    const totalProfessors = professors.length
    
    // Calculate professors growth
    const recentProfessors = professors.filter(professor => 
      new Date(professor.created_at) >= twelveMonthsAgo
    ).length
    
    const twentyFourMonthsAgo = new Date()
    twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24)
    const previousPeriodProfessors = professors.filter(professor => {
      const createdDate = new Date(professor.created_at)
      return createdDate >= twentyFourMonthsAgo && createdDate < twelveMonthsAgo
    }).length
    
    const professorsGrowth = previousPeriodProfessors > 0 
      ? Math.round(((recentProfessors - previousPeriodProfessors) / previousPeriodProfessors) * 100)
      : recentProfessors > 0 ? 100 : 0

    // Process top students data
    const topStudentsData = topStudentsResult.status === 'fulfilled' ? topStudentsResult.value.data || [] : []
    
    // Calculate performance scores for top students
    const studentsWithScores = topStudentsData.map(student => {
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
      
      // Calculate completion rate
      const completionRate = totalSubjects > 0 ? (completedSubjects / totalSubjects) * 100 : 0
      
      // Calculate credit rate
      const creditRate = completedSubjects > 0 ? (creditedSubjects / completedSubjects) * 100 : 0
      
      // Calculate performance score (weighted combination of metrics)
      const performanceScore = (
        (averageGrade * 0.4) +           // 40% - Overall academic performance
        (completionRate * 0.3) +         // 30% - Course completion rate
        (creditRate * 0.3)               // 30% - Credit earning rate
      )
      
      return {
        ...student,
        performance_score: Math.round(performanceScore * 100) / 100
      }
    })
    
    // Get top 10 performers
    const topStudents = studentsWithScores
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, 10)
    
    const totalTopPerformers = topStudents.length

    // Process unauthorized logs data
    const unauthorizedLogs = unauthorizedLogsResult.status === 'fulfilled' ? unauthorizedLogsResult.value.data || [] : []
    const totalUnauthorizedLogs = unauthorizedLogs.length
    
    // Get previous 24 hours for comparison
    const fortyEightHoursAgo = new Date()
    fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)
    
    const previousPeriodLogs = await supabase
      .from('activity_logs')
      .select('log_id')
      .or('action.ilike.%unauthorized%,action.ilike.%failed login%,action.ilike.%invalid access%')
      .gte('created_at', fortyEightHoursAgo.toISOString())
      .lt('created_at', sixMonthsAgo.toISOString())
    
    const previousLogsCount = previousPeriodLogs.data?.length || 0
    const logsGrowth = previousLogsCount > 0 
      ? Math.round(((totalUnauthorizedLogs - previousLogsCount) / previousLogsCount) * 100)
      : totalUnauthorizedLogs > 0 ? 100 : 0

    return NextResponse.json({
      dashboard_stats: {
        active_students: {
          total: totalStudents,
          growth_percentage: studentsGrowth,
          period: "from last semester"
        },
        active_professors: {
          total: totalProfessors,
          growth_percentage: professorsGrowth,
          period: "from last school year"
        },
        top_performers: {
          total: totalTopPerformers,
          growth_percentage: logsGrowth, // Using logs growth as proxy
          period: "from last semester"
        },
        unauthorized_logs: {
          total: totalUnauthorizedLogs,
          growth_percentage: logsGrowth,
          period: "from last 24 hours"
        }
      },
      raw_data: {
        students: students.slice(0, 10), // Sample data
        professors: professors.slice(0, 10), // Sample data
        top_students: topStudents,
        unauthorized_logs: unauthorizedLogs.slice(0, 10) // Sample data
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}