import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { calculateClassAverageFromEntries, calculateComponentAverage, normalizeGradeEntries, normalizeGradeComponents, type GradeEntry } from "@/lib/student/grade-calculations"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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
        keyMetrics: {
          classAverage: 0,
          trend: 0,
          attendanceRate: 0,
          atRiskStudents: 0,
          assignmentCompletion: 0
        },
        performanceData: [],
        gradeDistribution: [],
        pieData: [],
        assignmentPerformance: [],
        engagement: {
          participationLevel: "Low",
          questionFrequency: 0,
          officeHoursVisits: 0,
          onlineDiscussion: "Low"
        },
        improvementAreas: {
          weakTopics: 0,
          strongTopics: 0,
          totalTopics: 0
        },
        recommendations: {
          needsReview: false,
          atRiskCount: 0,
          topPerformers: 0
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

    // 6) Calculate class average using unified method
    const classAverage = Math.round(calculateClassAverageFromEntries(normalizedEntries, normalizedComponents) * 100) / 100

    // 7) Calculate attendance rate
    const attendanceEntries = normalizedEntries.filter(e => e.attendance !== null)
    const presentCount = attendanceEntries.filter(e => 
      e.attendance === 'present' || e.attendance === 'late'
    ).length
    const attendanceRate = attendanceEntries.length > 0 
      ? Math.round((presentCount / attendanceEntries.length) * 100)
      : 0

    // 8) Calculate assignment completion rate
    const scoreEntries = normalizedEntries.filter(e => e.score !== null && e.max_score && e.max_score > 0)
    const assignmentCompletion = scoreEntries.length > 0 ? 100 : 0 // Simplified for now

    // 9) Calculate at-risk students (students with grades below 70%)
    const studentGrades = students.map((student: any) => {
      const studentEntries = normalizedEntries.filter(e => e.student_id === student.student_id)
      
      const studentData = {
        student_id: student.student_id,
        name: `${student.first_name} ${student.middle_name ? student.middle_name + " " : ""}${student.last_name}`.trim(),
        email: student.accounts?.email || "",
        components: {} as Record<number, any[]>
      }

      studentEntries.forEach(entry => {
        if (!studentData.components[entry.component_id]) {
          studentData.components[entry.component_id] = []
        }
        studentData.components[entry.component_id].push(entry)
      })

      // Calculate final grade using unified method
      let finalGrade = 0
      let totalWeightedScore = 0
      let totalWeightUsed = 0

      normalizedComponents.forEach((component) => {
        const items = studentData.components[component.component_id] || []
        if (items.length > 0) {
          // Calculate component average
          let average = 0
          const hasAttendanceEntries = items.some(e => e.attendance !== null)
          const hasScoreEntries = items.some(e => e.score !== null && e.max_score && e.max_score > 0)

          if (hasAttendanceEntries && !hasScoreEntries) {
            const attendanceItems = items.filter(e => e.attendance !== null)
            if (attendanceItems.length > 0) {
              const presentCount = attendanceItems.filter(e => e.attendance === 'present').length
              const lateCount = attendanceItems.filter(e => e.attendance === 'late').length
              average = Math.round(((presentCount + (lateCount * 0.5)) / attendanceItems.length) * 100)
            }
          } else {
            const scoreItems = items.filter(e => e.score !== null && e.max_score && e.max_score > 0)
            if (scoreItems.length > 0) {
              const totalEarned = scoreItems.reduce((sum, entry) => sum + (entry.score || 0), 0)
              const totalPossible = scoreItems.reduce((sum, entry) => sum + (entry.max_score || 0), 0)
              if (totalPossible > 0) {
                average = Math.round((totalEarned / totalPossible) * 100)
              }
            }
          }

          const weight = component.weight_percentage / 100
          totalWeightedScore += average * weight
          totalWeightUsed += weight
        }
      })

      if (totalWeightUsed > 0) {
        finalGrade = Math.round((totalWeightedScore / totalWeightUsed) * 100) / 100
      }

      return { ...studentData, finalGrade }
    })

    const atRiskStudents = studentGrades.filter(s => s.finalGrade > 0 && s.finalGrade < 70).length
    const topPerformers = studentGrades.filter(s => s.finalGrade >= 90).length

    // 10) Generate performance data based on cumulative class averages over time
    const performanceData: Array<{ date: string, average: number, attendance: number }> = []
    
    // Get unique dates when grades were recorded, sorted chronologically
    const uniqueDates = [...new Set(normalizedEntries.map(e => e.date_recorded))]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    
    // Calculate cumulative class average for each date
    uniqueDates.forEach((dateRecorded, index) => {
      const date = new Date(dateRecorded)
      const dateDisplay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      
      // Get all entries up to and including this date
      const entriesUpToDate = normalizedEntries.filter(e => 
        new Date(e.date_recorded).getTime() <= date.getTime()
      )
      
      // Calculate class average using all entries up to this date
      const classAverageUpToDate = Math.round(calculateClassAverageFromEntries(entriesUpToDate, normalizedComponents) * 100) / 100
      
      // Calculate attendance rate for this specific date
      const dateEntries = normalizedEntries.filter(e => 
        new Date(e.date_recorded).getTime() === date.getTime()
      )
      const dateAttendanceEntries = dateEntries.filter(e => e.attendance !== null)
      const datePresentCount = dateAttendanceEntries.filter(e => 
        e.attendance === 'present' || e.attendance === 'late'
      ).length
      const dateAttendanceRate = dateAttendanceEntries.length > 0 
        ? Math.round((datePresentCount / dateAttendanceEntries.length) * 100)
        : 0

      performanceData.push({
        date: dateDisplay,
        average: classAverageUpToDate,
        attendance: dateAttendanceRate
      })
    })

    // 11) Generate grade distribution
    const gradeDistribution = [
      { grade: "90-100", count: studentGrades.filter(s => s.finalGrade >= 90).length, percentage: 0 },
      { grade: "80-89", count: studentGrades.filter(s => s.finalGrade >= 80 && s.finalGrade < 90).length, percentage: 0 },
      { grade: "70-79", count: studentGrades.filter(s => s.finalGrade >= 70 && s.finalGrade < 80).length, percentage: 0 },
      { grade: "60-69", count: studentGrades.filter(s => s.finalGrade >= 60 && s.finalGrade < 70).length, percentage: 0 },
      { grade: "Below 60", count: studentGrades.filter(s => s.finalGrade < 60).length, percentage: 0 }
    ]

    const totalStudents = studentGrades.filter(s => s.finalGrade > 0).length
    if (totalStudents > 0) {
      // Calculate percentages with proper rounding to avoid exceeding 100%
      let remainingPercentage = 100
      gradeDistribution.forEach((item, index) => {
        if (index === gradeDistribution.length - 1) {
          // For the last item, use remaining percentage to ensure total is exactly 100%
          item.percentage = remainingPercentage
        } else {
          const calculatedPercentage = Math.round((item.count / totalStudents) * 100)
          item.percentage = Math.min(calculatedPercentage, remainingPercentage)
          remainingPercentage -= item.percentage
        }
      })
    } else {
      gradeDistribution.forEach(item => {
        item.percentage = 0
      })
    }

    // 12) Generate pie chart data
    const pieData = [
      { name: "Excellent (90-100)", value: gradeDistribution[0].percentage, color: "#10b981" },
      { name: "Good (80-89)", value: gradeDistribution[1].percentage, color: "#3b82f6" },
      { name: "Average (70-79)", value: gradeDistribution[2].percentage, color: "#f59e0b" },
      { name: "Below Average (60-69)", value: gradeDistribution[3].percentage, color: "#ef4444" },
      { name: "Poor (<60)", value: gradeDistribution[4].percentage, color: "#dc2626" }
    ]

    // Debug logging for grade distribution
    const totalPercentage = gradeDistribution.reduce((sum, item) => sum + item.percentage, 0)
    if (totalPercentage !== 100) {
      console.warn('Grade distribution percentage mismatch:', {
        totalPercentage,
        gradeDistribution,
        totalStudents
      })
    }

    // 13) Generate assignment performance data using the same calculation as gradebook
    const assignmentPerformance = normalizedComponents.map(component => {
      const componentEntries = normalizedEntries.filter(e => e.component_id === component.component_id)
      
      // Use the same calculation method as the gradebook (calculateComponentAverage)
      const average = calculateComponentAverage(component, componentEntries)

      return {
        name: component.component_name,
        average
      }
    }).filter(assignment => assignment.average > 0)

    // 14) Calculate improvement areas
    const weakTopics = assignmentPerformance.filter(a => a.average < classAverage).length
    const strongTopics = assignmentPerformance.filter(a => a.average >= classAverage + 10).length

    // 15) Calculate trend (compare most recent class average with immediately previous class average)
    let trend = 0
    if (performanceData.length >= 2) {
      // Get the most recent class average (last entry)
      const currentClassAverage = performanceData[performanceData.length - 1].average
      
      // Get the immediately previous class average (second to last entry)
      const previousClassAverage = performanceData[performanceData.length - 2].average
      
      // Calculate trend: current class average - previous class average
      trend = Math.round((currentClassAverage - previousClassAverage) * 100) / 100
      
      // Safeguard against extreme values (likely calculation errors)
      if (Math.abs(trend) > 100) {
        console.warn('Extreme trend value detected:', trend, 'Setting to 0')
        trend = 0
      }
      
      // Debug logging
      console.log('Analytics Trend Debug:', {
        performanceDataLength: performanceData.length,
        currentClassAverage,
        previousClassAverage,
        trend,
        performanceData: performanceData.slice(-3) // Show last 3 entries for context
      })
    }

    return NextResponse.json({
      keyMetrics: {
        classAverage: classAverage,
        trend: trend,
        attendanceRate,
        atRiskStudents,
        assignmentCompletion
      },
      performanceData,
      gradeDistribution,
      pieData,
      assignmentPerformance,
      engagement: {
        participationLevel: attendanceRate >= 90 ? "High" : attendanceRate >= 75 ? "Medium" : "Low",
        questionFrequency: Math.round(attendanceRate / 20), // Mock calculation
        officeHoursVisits: Math.round(attendanceRate / 25), // Mock calculation
        onlineDiscussion: attendanceRate >= 85 ? "Active" : "Low"
      },
      improvementAreas: {
        weakTopics,
        strongTopics,
        totalTopics: assignmentPerformance.length
      },
      recommendations: {
        needsReview: atRiskStudents > 0,
        atRiskCount: atRiskStudents,
        topPerformers
      }
    }, { status: 200 })

  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}