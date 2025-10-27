import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { ClassesContent } from "@/components/professor/classes-content"
import { calculateClassAverageFromEntries, normalizeGradeEntries, normalizeGradeComponents } from "@/lib/student/grade-calculations"

type UiClass = {
  id: number
  name: string
  code: string
  students: number
  schedule: string
  room: string
  avgGrade: number
  status: string
  nextClass: string
  assignments: number // Average grade entries per student
}

export default async function ClassesPage() {
  const session = await getServerSession(authOptions)

  // Fallback UI when unauthenticated or wrong role
  if (!session || session.user.role !== "professor") {
    return <div className="p-6 text-muted-foreground">Unauthorized</div>
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1) Find professor by account_id from session
  const { data: professor, error: professorError } = await supabase
    .from("professors")
    .select("prof_id")
    .eq("account_id", Number(session.user.account_id))
    .single()

  if (!professor) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-muted-foreground">Professor record not found in database.</p>
        <p className="text-sm text-muted-foreground">Account ID: {session.user.account_id}</p>
        {professorError && (
          <p className="text-sm text-red-500">Error: {professorError.message}</p>
        )}
      </div>
    )
  }

  // 2) Fetch classes for this professor with related subject and section
  const { data: classesData, error: classesError } = await supabase
    .from("classes")
    .select(`
      class_id,
      class_name,
      schedule_start,
      schedule_end,
      subject_id,
      section_id,
      status,
      subjects ( subject_name, subject_code ),
      sections ( section_name )
    `)
    .eq("professor_id", professor.prof_id)
    .eq("status", "active")

  if (classesError) {
    return (
      <div className="p-6 space-y-2">
        <p className="text-muted-foreground">Failed to load classes.</p>
        <p className="text-sm text-red-500">Error: {classesError.message}</p>
      </div>
    )
  }

  if (!classesData || classesData.length === 0) {
    return <ClassesContent classes={[]} />
  }

  // Collect section ids to count students per class
  const sectionIds = Array.from(
    new Set(
      classesData
        .map((c: any) => c.section_id)
        .filter((id: number | null) => typeof id === "number")
    )
  ) as number[]

  let sectionIdToStudentCount: Record<number, number> = {}

  if (sectionIds.length > 0) {
    const { data: studentCounts } = await supabase
      .from("students")
      .select("section_id")
      .in("section_id", sectionIds)

    if (studentCounts) {
      sectionIdToStudentCount = studentCounts.reduce((acc: Record<number, number>, row: any) => {
        const key = row.section_id as number
        acc[key] = (acc[key] ?? 0) + 1
        return acc
      }, {})
    }
  }

  // Collect class IDs to fetch grade data
  const classIds = classesData.map((c: any) => c.class_id)

  // Fetch grade entries and components for all classes
  let classIdToAvgGrade: Record<number, number> = {}
  let classIdToGradeEntryCount: Record<number, number> = {}

  if (classIds.length > 0) {
    // Fetch grade entries with component information
    const { data: gradeData } = await supabase
      .from("grade_entries")
      .select(`
        class_id,
        component_id,
        score,
        max_score,
        attendance,
        date_recorded,
        grade_period,
        grade_components!inner(
          component_id,
          component_name,
          weight_percentage
        )
      `)
      .in("class_id", classIds)

    if (gradeData) {
      // Group entries by class
      const classGroups = new Map<number, any[]>()
      gradeData.forEach((entry: any) => {
        const classId = entry.class_id
        if (!classGroups.has(classId)) {
          classGroups.set(classId, [])
        }
        classGroups.get(classId)!.push(entry)
      })

      // Calculate averages and assignment counts for each class
      classGroups.forEach((entries, classId) => {
        // Normalize entries and components
        const normalizedEntries = normalizeGradeEntries(entries)
        const components = normalizeGradeComponents(entries.map((e: any) => e.grade_components).filter((comp, index, arr) => 
          arr.findIndex(c => c.component_id === comp.component_id) === index
        ))
        
        // Calculate class average using unified method
        classIdToAvgGrade[classId] = calculateClassAverageFromEntries(normalizedEntries, components)
        
        // Count total grade entries (both score-based and attendance-based)
        classIdToGradeEntryCount[classId] = normalizedEntries.length
      })
    }
  }

  // Helper to format schedule
  const formatSchedule = (start?: string | null, end?: string | null) => {
    if (!start || !end) return "Schedule TBD"
    try {
      const s = new Date(start)
      const e = new Date(end)
      const opts: Intl.DateTimeFormatOptions = { weekday: "short", hour: "2-digit", minute: "2-digit" }
      return `${s.toLocaleString(undefined, opts)} - ${e.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`
    } catch {
      return "Schedule TBD"
    }
  }

  const uiClasses: UiClass[] = classesData.map((c: any) => {
    const students = c.section_id ? (sectionIdToStudentCount[c.section_id] ?? 0) : 0
    const schedule = formatSchedule(c.schedule_start, c.schedule_end)
    const subjectName = c.subjects?.subject_name ?? c.class_name ?? "Unnamed Class"
    const subjectCode = c.subjects?.subject_code ?? ""
    const avgGrade = classIdToAvgGrade[c.class_id] ?? 0
    const totalGradeEntries = classIdToGradeEntryCount[c.class_id] ?? 0
    const gradeEntriesPerStudent = students > 0 ? Math.round(totalGradeEntries / students) : 0

    return {
      id: c.class_id,
      name: subjectName,
      code: subjectCode || c.sections?.section_name || "",
      students,
      schedule,
      room: "TBD",
      avgGrade,
      status: "active",
      nextClass: schedule,
      assignments: gradeEntriesPerStudent, // Average grade entries per student
    }
  })

  return <ClassesContent classes={uiClasses} />
}
