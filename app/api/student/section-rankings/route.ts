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

    // Get current student to find their section
    const { data: currentStudent, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id, section_id")
      .eq("account_id", session.user.account_id)
      .single()

    if (studentError || !currentStudent) {
      console.error("Current student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve current student" }, { status: 500 })
    }

    // Get all students in the same section
    const { data: sectionStudents, error: sectionError } = await supabaseServer
      .from("students")
      .select("student_id, first_name, last_name, section_id")
      .eq("section_id", currentStudent.section_id)

    if (sectionError) {
      console.error("Section students fetch error:", sectionError)
      return NextResponse.json({ error: "Failed to fetch section students" }, { status: 500 })
    }

    if (!sectionStudents || sectionStudents.length === 0) {
      return NextResponse.json({ rankings: {} })
    }

    const studentIds = sectionStudents.map(s => s.student_id)

    // Get all grade entries for students in this section to compute weighted grades
    const { data: entries, error: entriesError } = await supabaseServer
      .from("grade_entries")
      .select(`
        student_id,
        score,
        max_score,
        classes:class_id (
          subject_id
        ),
        grade_components:component_id (
          component_id,
          component_name,
          weight_percentage
        )
      `)
      .in("student_id", studentIds)
      .not("score", "is", null)
      .not("max_score", "is", null)

    if (entriesError) {
      console.error("Entries fetch error:", entriesError)
      return NextResponse.json({ error: "Failed to fetch grade entries" }, { status: 500 })
    }

    // Calculate weighted grades by student and subject from entries
    const computedGrades: Record<string, { percentage: number }> = {}
    
    // Group entries by student-subject-component
    const groupedEntries: Record<string, any[]> = {}
    
    for (const entry of entries || []) {
      const studentId = entry.student_id
      const subjectId = (entry.classes as any)?.subject_id
      const componentId = (entry.grade_components as any)?.component_id
      
      if (!studentId || !subjectId || !componentId || !(entry.grade_components as any)?.weight_percentage) continue
      
      const key = `${studentId}-${subjectId}`
      if (!groupedEntries[key]) {
        groupedEntries[key] = []
      }
      groupedEntries[key].push(entry)
    }
    
    // Calculate weighted grades for each student-subject combination
    for (const [key, subjectEntries] of Object.entries(groupedEntries)) {
      // Group entries by component
      const componentGroups: Record<string, { entries: any[], weight: number }> = {}
      
      subjectEntries.forEach(entry => {
        const componentId = (entry.grade_components as any)?.component_id
        const weight = Number(entry.grade_components.weight_percentage) || 0
        
        if (!componentGroups[componentId]) {
          componentGroups[componentId] = { entries: [], weight: weight }
        }
        componentGroups[componentId].entries.push(entry)
      })
      
      // Calculate weighted average
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
      
      computedGrades[key] = {
        percentage: totalWeight > 0 ? (totalWeightedGrade / totalWeight) * 100 : 0
      }
    }

    // Group grades by subject for ranking
    const gradesBySubject: Record<number, Array<{
      student_id: number
      grade: number
    }>> = {}

    for (const [key, computedGrade] of Object.entries(computedGrades)) {
      const [studentIdStr, subjectIdStr] = key.split('-')
      const studentId = Number(studentIdStr)
      const subjectId = Number(subjectIdStr)
      
      if (!gradesBySubject[subjectId]) {
        gradesBySubject[subjectId] = []
      }
      gradesBySubject[subjectId].push({
        student_id: studentId,
        grade: computedGrade.percentage
      })
    }

    // Calculate rankings by subject
    const rankingsBySubject: Record<number, Array<{
      student_id: number
      student_name: string
      grade: number
      rank: number
    }>> = {}

    // Calculate rankings for each subject
    for (const [subjectId, subjectGrades] of Object.entries(gradesBySubject)) {
      // Sort by grade (descending - higher grades get better ranks)
      const sortedGrades = subjectGrades.sort((a, b) => b.grade - a.grade)
      
      // Assign ranks
      const rankings = sortedGrades.map((gradeData, index) => {
        const student = sectionStudents.find(s => s.student_id === gradeData.student_id)
        return {
          student_id: gradeData.student_id,
          student_name: student ? `${student.first_name} ${student.last_name}`.trim() : "Unknown",
          grade: gradeData.grade,
          rank: index + 1
        }
      })

      rankingsBySubject[Number(subjectId)] = rankings
    }

    // Create a simplified response with just the current student's rankings
    const currentStudentRankings: Record<number, number> = {}
    for (const [subjectId, rankings] of Object.entries(rankingsBySubject)) {
      const studentRank = (rankings as Array<{student_id: number; student_name: string; grade: number; rank: number}>).find((r: any) => r.student_id === currentStudent.student_id)
      if (studentRank) {
        currentStudentRankings[Number(subjectId)] = studentRank.rank
      }
    }

    return NextResponse.json({ 
      rankings: currentStudentRankings,
      sectionId: currentStudent.section_id,
      totalStudentsInSection: sectionStudents.length
    })

  } catch (err) {
    console.error("Section rankings API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}