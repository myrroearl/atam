import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get current student
    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id, section_id")
      .eq("account_id", session.user.account_id)
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    // Get all grade entries for the student with component weights and learning outcomes
    const { data: entries, error: entriesError } = await supabaseServer
      .from("grade_entries")
      .select(`
        grade_id,
        score,
        max_score,
        date_recorded,
        name,
        classes:class_id (
          subject_id,
          subjects:subject_id (
            subject_name,
            subject_code
          )
        ),
        grade_components:component_id (
          component_id,
          component_name,
          weight_percentage
        ),
        learning_outcomes:outcome_id (
          outcome_id,
          outcome_code,
          outcome_description,
          proficiency_level
        )
      `)
      .eq("student_id", student.student_id)
      .not("score", "is", null)
      .not("max_score", "is", null)
      .order("date_recorded", { ascending: false })

    if (entriesError) {
      console.error("Entries fetch error:", entriesError)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    // Get current semester subjects and final grades
    const { data: currentSubjects, error: subjectsError } = await supabaseServer
      .from("classes")
      .select(`
        class_id,
        subjects:subject_id (
          subject_id,
          subject_name,
          subject_code,
          units
        )
      `)
      .eq("section_id", student.section_id)

    if (subjectsError) {
      console.error("Subjects fetch error:", subjectsError)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
    }

    const { data: finalGrades, error: gradesError } = await supabaseServer
      .from("final_grades")
      .select(`
        subject_id,
        grade,
        completion,
        taken,
        subjects:subject_id (
          subject_name,
          units
        )
      `)
      .eq("student_id", student.student_id)
      .eq("taken", true)

    if (gradesError) {
      console.error("Final grades fetch error:", gradesError)
      return NextResponse.json({ error: "Failed to fetch final grades" }, { status: 500 })
    }

    // Calculate weekly performance data
    const weeklyPerformance: Array<{ week: string; performance: number; assignments: number; exams: number }> = []
    
    if (entries && entries.length > 0) {
      // Group entries by week
      const weeklyData: Record<string, any[]> = {}
      
      entries.forEach(entry => {
        const date = new Date(entry.date_recorded)
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
        const weekKey = weekStart.toISOString().split('T')[0]
        
        if (!weeklyData[weekKey]) {
          weeklyData[weekKey] = []
        }
        weeklyData[weekKey].push(entry)
      })

      // Calculate performance for each week
      Object.entries(weeklyData).forEach(([weekKey, weekEntries]) => {
        // Group by subject-component for weighted calculation
        const componentGroups: Record<string, { entries: any[], weight: number }> = {}
        
        weekEntries.forEach(entry => {
          const subjectId = (entry.classes as any)?.subject_id
          const componentId = (entry.grade_components as any)?.component_id
          const weight = Number((entry.grade_components as any)?.weight_percentage) || 0
          
          if (subjectId && componentId && weight > 0) {
            const key = `${subjectId}-${componentId}`
            if (!componentGroups[key]) {
              componentGroups[key] = { entries: [], weight: weight }
            }
            componentGroups[key].entries.push(entry)
          }
        })

        // Calculate weighted performance for the week
        let totalWeightedGrade = 0
        let totalWeight = 0
        
        Object.values(componentGroups).forEach(component => {
          if (component.entries.length > 0 && component.weight > 0) {
            const componentTotalScore = component.entries.reduce((sum, entry) => sum + Number(entry.score), 0)
            const componentTotalPossible = component.entries.reduce((sum, entry) => sum + Number(entry.max_score), 0)
            const componentPercentage = componentTotalPossible > 0 ? (componentTotalScore / componentTotalPossible) * 100 : 0
            
            totalWeightedGrade += (componentPercentage * component.weight) / 100
            totalWeight += component.weight
          }
        })

        const weekPerformance = totalWeight > 0 ? (totalWeightedGrade / totalWeight) * 100 : 0
        
        if (weekPerformance > 0) {
          const weekDate = new Date(weekKey)
          const weekNumber = Math.ceil((weekDate.getTime() - new Date(weekDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
          
          // Count assignments and exams for the week
          const assignments = weekEntries.filter(e => 
            (e.grade_components as any)?.component_name?.toLowerCase().includes('assignment') ||
            (e.grade_components as any)?.component_name?.toLowerCase().includes('quiz') ||
            (e.grade_components as any)?.component_name?.toLowerCase().includes('homework')
          ).length
          
          const exams = weekEntries.filter(e => 
            (e.grade_components as any)?.component_name?.toLowerCase().includes('exam') ||
            (e.grade_components as any)?.component_name?.toLowerCase().includes('test') ||
            (e.grade_components as any)?.component_name?.toLowerCase().includes('final')
          ).length

          weeklyPerformance.push({
            week: `W${weekNumber} • ${weekDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
            performance: Math.round(weekPerformance),
            assignments,
            exams
          })
        }
      })
    }

    // Sort by week number
    weeklyPerformance.sort((a, b) => {
      const aWeekNum = parseInt(a.week.split('W')[1].split(' ')[0])
      const bWeekNum = parseInt(b.week.split('W')[1].split(' ')[0])
      return aWeekNum - bWeekNum
    })

    // Calculate overall performance metrics
    const avgPerformance = weeklyPerformance.length > 0 
      ? weeklyPerformance.reduce((sum, w) => sum + w.performance, 0) / weeklyPerformance.length
      : 0

    // Calculate assignment completion rate
    const totalAssignments = entries?.length || 0
    const completedAssignments = entries?.filter(e => e.score != null && e.max_score != null).length || 0
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0

    // Calculate GPA from final grades
    const validGrades = finalGrades?.filter(g => g.grade != null && g.grade >= 0) || []
    const totalUnits = validGrades.reduce((sum, g) => sum + (Number((g.subjects as any)?.units) || 0), 0)
    const weightedGradePoints = validGrades.reduce((sum, g) => {
      const units = Number((g.subjects as any)?.units) || 0
      const grade = Number(g.grade) || 0
      return sum + (grade * units)
    }, 0)
    const gpa = totalUnits > 0 ? weightedGradePoints / totalUnits : 0

    // Calculate risk assessment based on multiple factors
    let riskScore = 0
    if (avgPerformance < 80) riskScore += 3
    else if (avgPerformance < 90) riskScore += 1
    
    if (completionRate < 80) riskScore += 2
    else if (completionRate < 90) riskScore += 1
    
    if (gpa < 2.5) riskScore += 3
    else if (gpa < 3.0) riskScore += 2
    else if (gpa < 3.5) riskScore += 1

    const riskLevel = riskScore >= 5 ? 'High' : riskScore >= 2 ? 'Moderate' : 'Low'

    // Calculate subjects passed
    const subjectsPassed = validGrades.filter(g => Number(g.grade) >= 75).length

    // Calculate learning outcomes performance
    const outcomesPerformance: Record<number, { totalScore: number; totalPossible: number; count: number }> = {}
    
    entries?.forEach(entry => {
      const outcomeId = (entry.learning_outcomes as any)?.outcome_id
      if (outcomeId && entry.score != null && entry.max_score != null) {
        if (!outcomesPerformance[outcomeId]) {
          outcomesPerformance[outcomeId] = { totalScore: 0, totalPossible: 0, count: 0 }
        }
        outcomesPerformance[outcomeId].totalScore += Number(entry.score)
        outcomesPerformance[outcomeId].totalPossible += Number(entry.max_score)
        outcomesPerformance[outcomeId].count += 1
      }
    })

    // Generate AI recommendations based on performance
    const recommendations = []
    
    if (gpa < 3.0) {
      recommendations.push({
        type: "urgent",
        title: "Improve Overall GPA",
        description: `Your current GPA is ${gpa.toFixed(2)}. Focus on core subjects and seek additional help.`,
        action: "View Study Plan",
        priority: "high"
      })
    }
    
    if (completionRate < 85) {
      recommendations.push({
        type: "suggestion",
        title: "Increase Assignment Completion",
        description: `You've completed ${completionRate}% of assignments. Try to submit more work on time.`,
        action: "View Assignments",
        priority: "medium"
      })
    }
    
    if (avgPerformance < 85) {
      recommendations.push({
        type: "suggestion",
        title: "Enhance Weekly Performance",
        description: `Your average weekly performance is ${Math.round(avgPerformance)}%. Focus on consistent study habits.`,
        action: "View Progress",
        priority: "medium"
      })
    }

    return NextResponse.json({
      weekly: weeklyPerformance.slice(-10), // Last 10 weeks
      avgPerformance: Math.round(avgPerformance),
      completionRate: Math.round(completionRate),
      totalAssignments,
      completedAssignments,
      riskLevel,
      weeksTracked: weeklyPerformance.length,
      gpa: Math.round(gpa * 100) / 100,
      totalUnits,
      subjectsPassed,
      totalSubjects: validGrades.length,
      currentSubjects: currentSubjects?.length || 0,
      outcomesPerformance,
      recommendations,
      riskScore
    })

  } catch (err) {
    console.error("Performance API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}