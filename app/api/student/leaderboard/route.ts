import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { convertPercentageToGPA, convertPercentageToPreciseGPA, calculateGPA, calculateWeightedAverage } from "@/lib/student/grade-calculations"
import { calculateAllSubjectGrades } from "@/lib/student/subject-grade-calculator"

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

    // Get students with privacy settings
    const { data: students, error: studentsError } = await supabaseServer
      .from("students")
      .select(`student_id, first_name, last_name, section_id, profile_picture_url, privacy_settings, account_id, accounts:account_id(role)`) // keep simple to avoid nested shape issues

    if (studentsError) {
      console.error("Students fetch error:", studentsError)
      return NextResponse.json({ error: "Failed to fetch students" }, { status: 500 })
    }

    const studentIds = (students || []).map(s => s.student_id)

    
    // Get grade entries for all students from current year only
    const currentYear = new Date().getFullYear()
    
    const { data: entries, error: entriesError } = await supabaseServer
      .from("grade_entries")
      .select(`
        student_id,
        score,
        max_score,
        date_recorded,
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
      .gte("date_recorded", `${currentYear}-01-01`)
      .lte("date_recorded", `${currentYear}-12-31`)

    if (entriesError) {
      console.error("Entries fetch error:", entriesError)
      return NextResponse.json({ error: "Failed to fetch grade entries" }, { status: 500 })
    }

    // Get subject units information for proper GWA calculation
    const { data: subjects, error: subjectsError } = await supabaseServer
      .from("subjects")
      .select(`
        subject_id,
        subject_name,
        subject_code,
        units
      `)

    if (subjectsError) {
      console.error("Subjects fetch error:", subjectsError)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
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

    // Calculate GWA per student using weighted average by units (same as dashboard)
    const byStudent: Record<number, Array<{ percentage: number; units: number }>> = {}
    for (const [key, computedGrade] of Object.entries(computedGrades)) {
      const [studentIdStr, subjectIdStr] = key.split('-')
      const studentId = Number(studentIdStr)
      const subjectId = Number(subjectIdStr)
      
      // Get subject units
      const subject = subjects?.find(s => s.subject_id === subjectId)
      const units = subject?.units || 3 // Default to 3 units if not found
      
      if (!byStudent[studentId]) byStudent[studentId] = []
      byStudent[studentId].push({
        percentage: computedGrade.percentage,
        units: units
      })
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
      const subjectGrades = byStudent[s.student_id] || []
      // Use weighted average by units (same as dashboard GWA calculation)
      const weightedAveragePercentage = subjectGrades.length > 0 ? calculateWeightedAverage(subjectGrades) : null
      const gwa = weightedAveragePercentage !== null ? convertPercentageToPreciseGPA(weightedAveragePercentage) : null
      const course = studentIdToCourseName[s.student_id] || null
      const department = studentIdToDepartmentName[s.student_id] || null
      const sectionName = sectionIdToName[s.section_id as number] || null
      const isCurrentUser = me?.student_id ? s.student_id === me.student_id : false
      return {
        student_id: s.student_id,
        name: `${s.first_name} ${s.last_name}`.trim(),
        gpa: gwa, // Now in 1.0-5.0 scale using weighted average by units
        course,
        department,
        section: sectionName,
        isCurrentUser,
        avatar: (s as any).profile_picture_url || null,
        privacy_settings: (s as any).privacy_settings || { profileVisibility: 'public' },
        account_id: (s as any).account_id,
      }
    })
    .filter((x) => x.gpa !== null)
    .sort((a, b) => (a.gpa as number) - (b.gpa as number)) // Sort ascending - lower GWA (1.0) is better
    .map((x, idx) => ({ ...x, rank: idx + 1 }))

    // Build subject-specific rankings using the new library
    const allStudentIds = (students || []).map(s => s.student_id)
    const allSubjectIds = (subjects || []).map(s => s.subject_id)
    
    // Get all grade components
    const allGradeComponents = (entries || [])
      .map(entry => entry.grade_components)
      .filter(component => component != null)
      .reduce((unique, component) => {
        if (!unique.find((c: any) => c.component_id === (component as any).component_id)) {
          unique.push(component)
        }
        return unique
      }, [] as any[])

    // Calculate all subject grades using the new library
    const allSubjectGrades = calculateAllSubjectGrades(
      allStudentIds,
      allSubjectIds,
      entries || [],
      allGradeComponents
    )

    // Convert to the expected format for the API response
    const subjectRankings: Record<number, Array<{
      student_id: number
      name: string
      grade: number
      rank: number
      avatar: string | null
    }>> = {}

    for (const [subjectIdStr, subjectGrades] of Object.entries(allSubjectGrades)) {
      const subjectId = Number(subjectIdStr)
      
      const rankings = subjectGrades.map(gradeData => {
        const student = students?.find(s => s.student_id === gradeData.student_id)
        return {
          student_id: gradeData.student_id,
          name: student ? `${student.first_name} ${student.last_name}`.trim() : 'Unknown Student',
          grade: gradeData.gpa, // Use GPA from the library calculation
          rank: gradeData.rank || 1, // Ensure rank is always a number
          avatar: (student as any)?.profile_picture_url || null,
          privacy_settings: (student as any)?.privacy_settings || { profileVisibility: 'public' },
          account_id: (student as any)?.account_id,
        }
      })
      
      subjectRankings[subjectId] = rankings
    }

    // Get subject names for the frontend
    const subjectIdsForNames = Object.keys(allSubjectGrades).map(Number)
    let subjectNames: Record<number, string> = {}
    if (subjectIdsForNames.length > 0) {
      const { data: subjectsData } = await supabaseServer
        .from('subjects')
        .select('subject_id, subject_name, subject_code')
        .in('subject_id', subjectIdsForNames)
      
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
