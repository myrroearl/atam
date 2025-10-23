import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { calculateFinalGrade, normalizeGradeEntries, normalizeGradeComponents, calculateClassAverage, calculateClassAverageFromEntries, type GradeEntry } from "@/lib/grade-calculations"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface StudentLeaderboardData {
  student_id: number
  name: string
  email: string
  grade: number
  trend: string
  assignments: number
  participation: number
  avatar: string | null
  badges: string[]
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const classId = searchParams.get("class_id")

    if (!classId) {
      return NextResponse.json({ error: "Missing class_id parameter" }, { status: 400 })
    }

    // 1) Get class details including section
    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("class_id, class_name, section_id")
      .eq("class_id", classId)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ error: "Class not found" }, { status: 404 })
    }

    if (!classData.section_id) {
      return NextResponse.json({ 
        students: [],
        achievements: [],
        classStats: {
          classAverage: 0,
          assignmentCompletion: 0,
          activeParticipation: 0,
          aboveAverage: 0,
          needSupport: 0
        }
      }, { status: 200 })
    }

    // 2) Get all students in this section
    const { data: students, error: studentsError } = await supabase
      .from("students")
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        accounts!inner(email)
      `)
      .eq("section_id", classData.section_id)

    if (studentsError || !students) {
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    // 3) Get all grade entries for this class with component information
    const { data: gradeEntries, error: gradeError } = await supabase
      .from("grade_entries")
      .select(`
        student_id, 
        score,
        max_score,
        attendance,
        date_recorded,
        component_id,
        grade_period,
        grade_components!inner(
          component_id,
          component_name,
          weight_percentage
        )
      `)
      .eq("class_id", classId)

    if (gradeError) {
      return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 })
    }

    // 4) Get grade components for this class
    const { data: components, error: componentsError } = await supabase
      .from("grade_components")
      .select("component_id, component_name, weight_percentage")

    if (componentsError) {
      return NextResponse.json({ error: "Failed to fetch components" }, { status: 500 })
    }

    // 5) Normalize data for unified calculations
    const normalizedEntries = normalizeGradeEntries(gradeEntries || [])
    const normalizedComponents = normalizeGradeComponents(components || [])

    // 6) Calculate metrics for each student using unified grade calculation
    const leaderboardData: StudentLeaderboardData[] = students.map((student: any) => {
      const fullName = `${student.first_name} ${student.middle_name ? student.middle_name + " " : ""}${student.last_name}`.trim()
      const email = student.accounts?.email || ""

      // Get all grade entries for this student
      const studentEntries = normalizedEntries.filter(e => e.student_id === student.student_id)

      // Create student data structure for unified calculation
      const studentData = {
        student_id: student.student_id,
        name: fullName,
        email,
        components: {} as Record<number, any[]>
      }

      // Group entries by component
      studentEntries.forEach(entry => {
        if (!studentData.components[entry.component_id]) {
          studentData.components[entry.component_id] = []
        }
        studentData.components[entry.component_id].push(entry)
      })

      // Calculate final grade using unified method (weighted average)
      const finalGrade = calculateFinalGrade(studentData, normalizedComponents)

      // Count assignments (entries with scores)
      const assignments = studentEntries.filter(e => e.score !== null).length

      // Calculate participation (attendance percentage)
      const attendanceEntries = studentEntries.filter(e => e.attendance !== null)
      const presentCount = attendanceEntries.filter(e => 
        e.attendance === 'present' || e.attendance === 'late'
      ).length
      const participation = attendanceEntries.length > 0 
        ? Math.round((presentCount / attendanceEntries.length) * 100) 
        : 0

      // Calculate trend based on date last recorded
      // Compare cumulative performance over time (more accurate than individual entries)
      const sortedEntries = studentEntries
        .filter(e => e.score !== null)
        .sort((a, b) => new Date(a.date_recorded).getTime() - new Date(b.date_recorded).getTime())
      
      let trend = "+0.0"
      
      if (sortedEntries.length >= 2) {
        // Get unique dates when grades were recorded
        const uniqueDates = [...new Set(sortedEntries.map(e => e.date_recorded))]
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
        
        // Calculate cumulative average for each date
        const cumulativeAverages: number[] = []
        
        uniqueDates.forEach((dateRecorded) => {
          const date = new Date(dateRecorded)
          // Get all entries up to and including this date
          const entriesUpToDate = sortedEntries.filter(e => 
            new Date(e.date_recorded).getTime() <= date.getTime()
          )
          
          // Calculate average of all entries up to this date
          const averageUpToDate = entriesUpToDate.reduce((sum, e) => 
            sum + ((e.score || 0) / (e.max_score || 1) * 100), 0
          ) / entriesUpToDate.length
          
          cumulativeAverages.push(averageUpToDate)
        })
        
        if (cumulativeAverages.length >= 2) {
          // Get the most recent cumulative average
          const currentAverage = cumulativeAverages[cumulativeAverages.length - 1]
          
          // Get the immediately previous cumulative average (second to last)
          const previousAverage = cumulativeAverages[cumulativeAverages.length - 2]
          
          // Calculate trend: current average - previous average
          const trendValue = currentAverage - previousAverage
          trend = trendValue > 0 ? `+${trendValue.toFixed(1)}` : trendValue.toFixed(1)
          
          // Safeguard against extreme values (likely calculation errors)
          if (Math.abs(trendValue) > 50) {
            console.warn(`Extreme student trend value detected for ${fullName}:`, {
              currentAverage,
              previousAverage,
              trendValue,
              cumulativeAverages: cumulativeAverages.slice(-3) // Show last 3 for context
            })
            trend = "+0.0"
          }
        }
      } else if (sortedEntries.length === 1) {
        // Single entry - check if it's recent (within last 7 days)
        const entryDate = new Date(sortedEntries[0].date_recorded)
        const daysSinceEntry = (Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24)
        trend = daysSinceEntry <= 7 ? "+1.0" : "+0.0"
      }

      // Assign badges based on performance
      const badges: string[] = []
      if (participation >= 98) badges.push("Perfect Attendance")
      if (finalGrade >= 95) badges.push("Top Scorer")
      if (finalGrade >= 90 && finalGrade < 95) badges.push("Consistent Performer")
      if (participation >= 85 && finalGrade >= 85) badges.push("Active Participant")
      
      // Improved Student badge based on actual trend calculation
      const trendValue = parseFloat(trend)
      if (trendValue >= 2.0) badges.push("Improved Student")

      return {
        student_id: student.student_id,
        name: fullName,
        email,
        grade: finalGrade, // Use unified weighted grade calculation
        trend,
        assignments,
        participation,
        avatar: null,
        badges
      }
    })

    // 7) Sort by grade (descending)
    leaderboardData.sort((a, b) => b.grade - a.grade)

    // 8) Calculate class statistics using unified method (same as analytics)
    // Use the same calculation as analytics: calculateClassAverageFromEntries
    const classAverage = Math.round(calculateClassAverageFromEntries(normalizedEntries, normalizedComponents) * 100) / 100

    const totalAssignments = Math.max(...leaderboardData.map(s => s.assignments), 1)
    const avgAssignments = leaderboardData.reduce((sum, s) => sum + s.assignments, 0) / leaderboardData.length
    const assignmentCompletion = (avgAssignments / totalAssignments) * 100

    const avgParticipation = leaderboardData.reduce((sum, s) => sum + s.participation, 0) / leaderboardData.length

    const aboveAverage = leaderboardData.filter(s => s.grade >= classAverage).length
    const needSupport = leaderboardData.filter(s => s.grade < classAverage && s.grade > 0).length

    // 8) Calculate achievement counts
    const achievementCounts = {
      "Perfect Attendance": leaderboardData.filter(s => s.badges.includes("Perfect Attendance")).length,
      "Top Scorer": leaderboardData.filter(s => s.badges.includes("Top Scorer")).length,
      "Improved Student": leaderboardData.filter(s => s.badges.includes("Improved Student")).length,
      "Consistent Performer": leaderboardData.filter(s => s.badges.includes("Consistent Performer")).length,
      "Active Participant": leaderboardData.filter(s => s.badges.includes("Active Participant")).length,
    }

    return NextResponse.json({
      students: leaderboardData,
      achievements: achievementCounts,
      classStats: {
        classAverage: classAverage,
        assignmentCompletion: Math.round(assignmentCompletion * 100) / 100,
        activeParticipation: Math.round(avgParticipation * 100) / 100,
        aboveAverage,
        needSupport
      }
    }, { status: 200 })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

