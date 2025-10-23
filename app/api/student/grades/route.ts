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

    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id")
      .eq("account_id", session.user.account_id)
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    // Get current semester subjects with grades
    const { data: currentGrades, error: currentError } = await supabaseServer
      .from("final_grades")
      .select(`
        student_id,
        subject_id,
        grade,
        completion,
        taken,
        credited,
        remarks,
        year_taken,
        subjects:subject_id (
          subject_code,
          subject_name,
          units,
          semester_id,
          year_level_id
        )
      `)
      .eq("student_id", student.student_id)
      .eq("taken", true)
      .order("year_taken", { ascending: false })

    if (currentError) {
      console.error("Current grades fetch error:", currentError)
      return NextResponse.json({ error: "Failed to fetch current grades" }, { status: 500 })
    }

    // Get learning outcomes for subjects the student is currently enrolled in
    const subjectIds = currentGrades?.map(g => g.subject_id) || []
    const { data: learningOutcomes, error: outcomesError } = await supabaseServer
      .from("learning_outcomes")
      .select(`
        outcome_id,
        outcome_code,
        outcome_description,
        proficiency_level,
        subject_id,
        subjects:subject_id (
          subject_name
        )
      `)
      .in("subject_id", subjectIds)

    if (outcomesError) {
      console.error("Learning outcomes fetch error:", outcomesError)
      return NextResponse.json({ error: "Failed to fetch learning outcomes" }, { status: 500 })
    }

    // Get grade entries with learning outcomes for detailed analysis
    const { data: gradeEntries, error: entriesError } = await supabaseServer
      .from("grade_entries")
      .select(`
        grade_id,
        score,
        max_score,
        date_recorded,
        outcome_id,
        classes:class_id (
          subject_id
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

    if (entriesError) {
      console.error("Grade entries fetch error:", entriesError)
      return NextResponse.json({ error: "Failed to fetch grade entries" }, { status: 500 })
    }

    // Calculate learning outcomes performance
    const outcomesPerformance: Record<number, { totalScore: number; totalPossible: number; count: number }> = {}
    
    gradeEntries?.forEach(entry => {
      const outcomeId = entry.outcome_id
      if (outcomeId && entry.score != null && entry.max_score != null) {
        if (!outcomesPerformance[outcomeId]) {
          outcomesPerformance[outcomeId] = { totalScore: 0, totalPossible: 0, count: 0 }
        }
        outcomesPerformance[outcomeId].totalScore += Number(entry.score)
        outcomesPerformance[outcomeId].totalPossible += Number(entry.max_score)
        outcomesPerformance[outcomeId].count += 1
      }
    })

    // Enhance learning outcomes with performance data
    const enhancedOutcomes = learningOutcomes?.map(outcome => {
      const performance = outcomesPerformance[outcome.outcome_id]
      const averageScore = performance && performance.totalPossible > 0 
        ? (performance.totalScore / performance.totalPossible) * 100 
        : 0
      
      return {
        ...outcome,
        averageScore: Math.round(averageScore),
        totalEntries: performance?.count || 0
      }
    }) || []

    // Calculate GPA
    const validGrades = currentGrades?.filter(g => g.grade != null && g.grade >= 0) || []
    const totalUnits = validGrades.reduce((sum, g) => sum + (Number((g.subjects as any)?.units) || 0), 0)
    const weightedGradePoints = validGrades.reduce((sum, g) => {
      const units = Number((g.subjects as any)?.units) || 0
      const grade = Number(g.grade) || 0
      return sum + (grade * units)
    }, 0)
    const gpa = totalUnits > 0 ? weightedGradePoints / totalUnits : 0

    // Calculate subject strengths and weaknesses
    const subjectAnalysis = currentGrades?.map(grade => {
      const subjectName = (grade.subjects as any)?.subject_name || 'Unknown'
      const subjectGrade = Number(grade.grade) || 0
      const subjectOutcomes = enhancedOutcomes.filter(o => o.subject_id === grade.subject_id)
      
      // Calculate average performance across learning outcomes for this subject
      const avgOutcomeScore = subjectOutcomes.length > 0 
        ? subjectOutcomes.reduce((sum, o) => sum + o.averageScore, 0) / subjectOutcomes.length
        : subjectGrade

      return {
        subject_name: subjectName,
        grade: subjectGrade,
        units: Number((grade.subjects as any)?.units) || 0,
        completion: grade.completion,
        avgOutcomeScore: Math.round(avgOutcomeScore),
        learningOutcomes: subjectOutcomes,
        strength: avgOutcomeScore,
        weakness: avgOutcomeScore < 80 ? "Focus on foundational concepts and practice more exercises" : 
                 avgOutcomeScore < 90 ? "Review advanced topics and seek additional challenges" : 
                 "Maintain excellent performance and explore advanced applications"
      }
    }) || []

    return NextResponse.json({ 
      grades: currentGrades ?? [],
      learningOutcomes: enhancedOutcomes,
      subjectAnalysis,
      gpa: Math.round(gpa * 100) / 100,
      totalUnits,
      totalSubjects: currentGrades?.length || 0
    })
  } catch (err) {
    console.error("Grades API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

