import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { 
  calculateFinalGrade, 
  calculateGPA, 
  calculateWeightedAverage,
  convertPercentageToGPA,
  convertPercentageToPreciseGPA,
  normalizeGradeEntries,
  normalizeGradeComponents,
  calculateComponentAverage
} from "@/lib/student/grade-calculations"
import { cachedFetch, CACHE_KEYS, CACHE_TTL } from "@/lib/cache"
import { deduplicateSubjects } from "@/lib/student/subject-deduplicator"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const cacheKey = CACHE_KEYS.STUDENT_DASHBOARD(Number(session.user.account_id))
    
    const data = await cachedFetch(cacheKey, async () => {
    // Get student information
    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select(`
        student_id,
        first_name,
        last_name,
        section_id,
        profile_picture_url,
        accounts!inner (
          email
        ),
        sections (
          section_name,
          year_level (
            name,
            courses (
              course_name,
              course_code
            )
          )
        )
      `)
      .eq("account_id", session.user.account_id)
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    // Get current semester subjects with grade components
    const { data: classes, error: subjectsError } = await supabaseServer
      .from("classes")
      .select(`
        class_id,
        subjects:subject_id (
          subject_id,
          subject_code,
          subject_name,
          units
        ),
        professors:professor_id (
          first_name,
          last_name
        )
      `)
      .eq("section_id", student.section_id)

    // Deduplicate subjects by subject_id to avoid duplicates
    const subjects = deduplicateSubjects(classes as any[] || [])

    if (subjectsError) {
      console.error("Subjects fetch error:", subjectsError)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
    }

    // Get grade components for all subjects
    const subjectIds = subjects?.map((s: any) => s.subjects?.subject_id).filter(Boolean) || []
    const { data: gradeComponents, error: componentsError } = await supabaseServer
      .from("grade_components")
      .select("*")
      .in("department_id", [1, 2, 3, 4, 5]) // Assuming department IDs, adjust as needed

    if (componentsError) {
      console.error("Grade components fetch error:", componentsError)
    }

    // Get all grade entries for the student
    const { data: gradeEntries, error: entriesError } = await supabaseServer
      .from("grade_entries")
      .select(`
        grade_id,
        class_id,
        component_id,
        score,
        max_score,
        attendance,
        date_recorded,
        name,
        classes:class_id (
          subject_id
        ),
        grade_components:component_id (
          component_id,
          component_name,
          weight_percentage
        )
      `)
      .eq("student_id", student.student_id)
      .order("date_recorded", { ascending: false })

    if (entriesError) {
      console.error("Grade entries fetch error:", entriesError)
      return NextResponse.json({ error: "Failed to fetch grade entries" }, { status: 500 })
    }

    // Get final grades for completed subjects
    const { data: finalGrades, error: finalGradesError } = await supabaseServer
      .from("final_grades")
      .select(`
        subject_id,
        grade,
        completion,
        taken,
        credited,
        remarks,
        year_taken,
        subjects:subject_id (
          subject_name,
          subject_code,
          units
        )
      `)
      .eq("student_id", student.student_id)
      .eq("taken", true)

    if (finalGradesError) {
      console.error("Final grades fetch error:", finalGradesError)
    }

    // Calculate current semester grades
    const currentSubjectGrades: Array<{
      subjectId: number
      subjectName: string
      subjectCode: string
      units: number
      percentage: number
      gpa: number
      components: Array<{
        componentName: string
        weight: number
        percentage: number
      }>
    }> = []

    // Group entries by subject and component
    const entriesBySubject: Record<number, Record<number, any[]>> = {}
    
    gradeEntries?.forEach((entry: any) => {
      const subjectId = entry.classes?.subject_id
      const componentId = entry.component_id
      
      if (!subjectId || !componentId) return
      
      if (!entriesBySubject[subjectId]) {
        entriesBySubject[subjectId] = {}
      }
      if (!entriesBySubject[subjectId][componentId]) {
        entriesBySubject[subjectId][componentId] = []
      }
      entriesBySubject[subjectId][componentId].push(entry)
    })

    // Calculate grades for each subject using the unified college grade calculation system
    subjects?.forEach((subject: any) => {
      const subjectId = subject.subjects?.subject_id
      const subjectName = subject.subjects?.subject_name || "Unknown Subject"
      const subjectCode = subject.subjects?.subject_code || "Unknown Code"
      const units = subject.subjects?.units || 3

      if (!subjectId) return

      const subjectEntries = entriesBySubject[subjectId] || {}
      const components = gradeComponents || []
      
      // Create student data structure for unified grade calculation
      const studentData = {
        student_id: student.student_id,
        name: `${student.first_name} ${student.last_name}`,
        email: (student.accounts as any)?.email,
        components: {} as Record<number, any[]>
      }
      
      // Group entries by component for unified calculation
      Object.entries(subjectEntries).forEach(([componentId, entries]) => {
        studentData.components[Number(componentId)] = entries
      })
      
      // Normalize components for unified calculation
      const normalizedComponents = normalizeGradeComponents(components)
      
      // Calculate final grade using the unified college grade calculation system
      // Formula: Final Grade = Σ(Component Score × Weight)
      const finalPercentage = calculateFinalGrade(studentData, normalizedComponents)
      
      // Calculate component details for display
      const componentDetails: Array<{
        componentName: string
        weight: number
        percentage: number
      }> = []

      normalizedComponents.forEach(component => {
        const items = studentData.components[component.component_id] || []
        if (items.length > 0) {
          const componentPercentage = calculateComponentAverage(component, items)
          componentDetails.push({
            componentName: component.component_name,
            weight: component.weight_percentage,
            percentage: Math.round(componentPercentage * 100) / 100
          })
        }
      })

      const gpa = convertPercentageToGPA(finalPercentage)

      currentSubjectGrades.push({
        subjectId,
        subjectName,
        subjectCode,
        units,
        percentage: Math.round(finalPercentage * 100) / 100,
        gpa: Math.round(gpa * 100) / 100,
        components: componentDetails
      })
    })

    // Calculate GWA using the same method as grades view - use currentSubjectGrades
    const allSubjectGrades: Array<{ percentage: number; units: number }> = currentSubjectGrades.map(s => ({
      percentage: s.percentage,
      units: s.units
    }))

    // Calculate GWA using current semester subjects (show precise GPA)
    const weightedAverage = calculateWeightedAverage(allSubjectGrades)
    const overallGPA = convertPercentageToPreciseGPA(weightedAverage) // Convert to precise GPA

    // Get recent grade entries for activity feed
    const recentEntries = gradeEntries?.slice(0, 10).map((entry: any) => ({
      id: entry.grade_id,
      name: entry.name || "Assignment",
      score: entry.score,
      maxScore: entry.max_score,
      percentage: entry.max_score && entry.score ? Math.round((entry.score / entry.max_score) * 100) : 0,
      date: entry.date_recorded,
      subject: (subjects as any)?.find((s: any) => s.subjects?.subject_id === entry.classes?.subject_id)?.subjects?.subject_name || "Unknown"
    })) || []

      return {
        student: {
          id: student.student_id,
          name: `${student.first_name} ${student.last_name}`,
          email: (student.accounts as any)?.email,
          section: (student.sections as any)?.section_name,
          year_level: (student.sections as any)?.year_level?.name,
          course: (student.sections as any)?.year_level?.courses?.course_name,
          current_semester: "1st Semester", // You can make this dynamic based on your semester logic
          profilePicture: student.profile_picture_url
        },
        subjects: currentSubjectGrades,
        overallGPA: Math.round(overallGPA * 100) / 100,
        weightedAverage: Math.round(weightedAverage * 100) / 100,
        totalUnits: allSubjectGrades.reduce((sum: number, s: any) => sum + s.units, 0),
        recentEntries,
        finalGrades: finalGrades || []
      }
    }, CACHE_TTL.STUDENT_DATA)

    return NextResponse.json(data)

  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
