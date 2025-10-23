import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

// Convert percentage (0-100) to Philippine grading scale (1.0-5.0, where 1.0 is highest)
function convertPercentToGrade(percentage: number): number {
  if (percentage >= 97.5) return 1.0
  if (percentage >= 94.5) return 1.25
  if (percentage >= 91.5) return 1.5
  if (percentage >= 88.5) return 1.75
  if (percentage >= 85.5) return 2.0
  if (percentage >= 82.5) return 2.25
  if (percentage >= 79.5) return 2.5
  if (percentage >= 76.5) return 2.75
  if (percentage >= 74.5) return 3.0
  if (percentage >= 69.5) return 3.5
  if (percentage >= 64.5) return 4.0
  if (percentage >= 59.5) return 4.5
  return 5.0
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Resolve current student_id
    const { data: me, error: meError } = await supabaseServer
      .from("students")
      .select("student_id")
      .eq("account_id", session.user.account_id)
      .single()

    if (meError) {
      console.error("Current student lookup error:", meError)
    }

    // Get students
    const { data: students, error: studentsError } = await supabaseServer
      .from("students")
      .select(`student_id, first_name, last_name, section_id, profile_picture_url, accounts:account_id(role)`) // keep simple to avoid nested shape issues

    if (studentsError) {
      console.error("Students fetch error:", studentsError)
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    const studentIds = (students || []).map(s => s.student_id)

    // Get all grade entries for all students to compute weighted grades
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

    // Calculate GWA per student from computed subject grades
    const byStudent: Record<number, { sum: number; count: number }> = {}
    for (const [key, computedGrade] of Object.entries(computedGrades)) {
      const [studentIdStr] = key.split('-')
      const studentId = Number(studentIdStr)
      
      if (!byStudent[studentId]) byStudent[studentId] = { sum: 0, count: 0 }
      byStudent[studentId].sum += computedGrade.percentage
      byStudent[studentId].count += 1
    }

    // Fetch section information for section names
    const uniqueSectionIds = Array.from(new Set((students || []).map((s) => s.section_id).filter(Boolean)))
    let sectionIdToName: Record<number, string | null> = {}
    if (uniqueSectionIds.length) {
      const { data: sectionRows } = await supabaseServer
        .from('sections')
        .select('section_id, section_name')
        .in('section_id', uniqueSectionIds as number[])
      for (const row of (sectionRows || [])) {
        sectionIdToName[row.section_id as number] = row.section_name || null
      }
    }

    // Fetch student courses and departments through their enrolled subjects from grade entries
    let studentIdToCourseName: Record<number, string | null> = {}
    let studentIdToDepartmentName: Record<number, string | null> = {}
    if (studentIds.length) {
      // Get the most common course and department for each student based on their grade entries
      const { data: studentCourses } = await supabaseServer
        .from('grade_entries')
        .select(`
          student_id,
          classes:class_id (
            subjects:subject_id (
              courses:course_id (
                course_name,
                department_id,
                departments:department_id (
                  department_name
                )
              )
            )
          )
        `)
        .in('student_id', studentIds)
        .not('classes.subjects.courses.course_name', 'is', null)

      // Count course and department occurrences per student
      const courseCounts: Record<number, Record<string, number>> = {}
      const departmentCounts: Record<number, Record<string, number>> = {}
      
      for (const row of (studentCourses || [])) {
        const studentId = row.student_id as number
        const courseName = (row.classes as any)?.subjects?.courses?.course_name
        const departmentName = (row.classes as any)?.subjects?.courses?.departments?.department_name
        
        if (courseName) {
          if (!courseCounts[studentId]) courseCounts[studentId] = {}
          courseCounts[studentId][courseName] = (courseCounts[studentId][courseName] || 0) + 1
        }
        
        if (departmentName) {
          if (!departmentCounts[studentId]) departmentCounts[studentId] = {}
          departmentCounts[studentId][departmentName] = (departmentCounts[studentId][departmentName] || 0) + 1
        }
      }

      // Get the most common course and department for each student
      for (const studentId of studentIds) {
        const courseCountsForStudent = courseCounts[studentId] || {}
        const mostCommonCourse = Object.entries(courseCountsForStudent).reduce((max, [course, count]) => 
          count > max.count ? { course, count } : max, 
          { course: null as string | null, count: 0 }
        )
        studentIdToCourseName[studentId] = mostCommonCourse.course
        
        const departmentCountsForStudent = departmentCounts[studentId] || {}
        const mostCommonDepartment = Object.entries(departmentCountsForStudent).reduce((max, [dept, count]) => 
          count > max.count ? { dept, count } : max, 
          { dept: null as string | null, count: 0 }
        )
        studentIdToDepartmentName[studentId] = mostCommonDepartment.dept
      }
    }

    const leaderboard = (students || []).map((s) => {
      const agg = byStudent[s.student_id] || { sum: 0, count: 0 }
      const averagePercentage = agg.count ? agg.sum / agg.count : null
      const gwa = averagePercentage !== null ? convertPercentToGrade(averagePercentage) : null
      const course = studentIdToCourseName[s.student_id] || null
      const department = studentIdToDepartmentName[s.student_id] || null
      const sectionName = sectionIdToName[s.section_id as number] || null
      const isCurrentUser = me?.student_id ? s.student_id === me.student_id : false
      return {
        student_id: s.student_id,
        name: `${s.first_name} ${s.last_name}`.trim(),
        gpa: gwa, // Now in 1.0-5.0 scale
        course,
        department,
        section: sectionName,
        isCurrentUser,
        avatar: (s as any).profile_picture_url || null,
      }
    })
    .filter((x) => x.gpa !== null)
    .sort((a, b) => (a.gpa as number) - (b.gpa as number)) // Sort ascending - lower GWA (1.0) is better
    .map((x, idx) => ({ ...x, rank: idx + 1 }))

    // Build subject-specific rankings
    const subjectRankings: Record<number, Array<{
      student_id: number
      name: string
      grade: number
      rank: number
      avatar: string | null
    }>> = {}

    // Group grades by subject
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

    // Calculate rankings for each subject
    for (const [subjectIdStr, subjectGrades] of Object.entries(gradesBySubject)) {
      const subjectId = Number(subjectIdStr)
      
      // Convert grades to 1.0-5.0 scale and sort by grade (ascending - lower grade (1.0) is better)
      const sortedGrades = subjectGrades
        .map(g => ({
          student_id: g.student_id,
          grade: convertPercentToGrade(g.grade)
        }))
        .sort((a, b) => a.grade - b.grade)
      
      // Assign ranks
      const rankings = sortedGrades.map((gradeData, index) => {
        const student = students?.find(s => s.student_id === gradeData.student_id)
        return {
          student_id: gradeData.student_id,
          name: student ? `${student.first_name} ${student.last_name}`.trim() : "Unknown",
          grade: gradeData.grade,
          rank: index + 1,
          avatar: student ? (student as any).profile_picture_url || null : null
        }
      })

      subjectRankings[subjectId] = rankings
    }

    // Get subject names for the frontend
    const subjectIds = Object.keys(gradesBySubject).map(Number)
    let subjectNames: Record<number, string> = {}
    if (subjectIds.length > 0) {
      const { data: subjectsData } = await supabaseServer
        .from('subjects')
        .select('subject_id, subject_name, subject_code')
        .in('subject_id', subjectIds)
      
      for (const subj of (subjectsData || [])) {
        subjectNames[subj.subject_id] = `${subj.subject_code} - ${subj.subject_name}`
      }
    }

    return NextResponse.json({ 
      leaderboard, 
      subjectRankings,
      subjectNames,
      currentAccountId: session.user.account_id 
    })
  } catch (err) {
    console.error("Leaderboard API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

