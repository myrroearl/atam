import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import type { GradeEntry } from "@/lib/types/gradebook"
import { ClassPageClient } from "./class-page-client"
import { calculateClassAverageFromEntries, normalizeGradeEntries, normalizeGradeComponents } from "@/lib/grade-calculations"

// Types based on Supabase schema
export type GradeComponent = {
  component_id: number
  component_name: string
  weight_percentage: number
}

export type Student = {
  student_id: number
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
}

export type ClassData = {
  class_id: number
  class_name: string
  subject_name: string
  subject_code: string
  section_name: string
  schedule_start: string | null
  schedule_end: string | null
  students: Student[]
  gradeComponents: GradeComponent[]
  gradeEntries: GradeEntry[]
  studentCount: number
  avgGrade: number
}

export default async function ClassPage({
  params,
}: {
  params: Promise<{ classID: string }>
}) {
  const resolvedParams = await params
  const classId = parseInt(resolvedParams.classID)

  if (isNaN(classId)) {
    redirect("/professor/classes")
  }

  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "professor") {
    redirect("/")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // 1. Get professor record
  const { data: professor } = await supabase
    .from("professors")
    .select("prof_id")
    .eq("account_id", Number(session.user.account_id))
    .single()

  if (!professor) {
    redirect("/professor/classes")
  }

  // 2. Fetch class details with subject and section info
  const { data: classData, error: classError } = await supabase
    .from("classes")
    .select(`
      class_id,
      class_name,
      schedule_start,
      schedule_end,
      subjects (
        subject_id,
        subject_name,
        subject_code
      ),
      sections (
        section_id,
        section_name
      )
    `)
    .eq("class_id", classId)
    .eq("professor_id", professor.prof_id)
    .single()

  if (classError || !classData) {
    redirect("/professor/classes")
  }

  // 3. Fetch students enrolled in this class's section
  const { data: studentsData } = await supabase
    .from("students")
    .select(`
      student_id,
      first_name,
      middle_name,
      last_name,
      accounts (
        email
      )
    `)
    .eq("section_id", (classData.sections as any)?.section_id)

  const students: Student[] = (studentsData || []).map((s: any) => ({
    student_id: s.student_id,
    first_name: s.first_name,
    middle_name: s.middle_name,
    last_name: s.last_name,
    email: s.accounts?.email || "",
  }))

  // 4. Fetch grade components for this class's department
  // First get the department from the professor
  const { data: profDept } = await supabase
    .from("professors")
    .select("department_id")
    .eq("prof_id", professor.prof_id)
    .single()

  const { data: componentsData } = await supabase
    .from("grade_components")
    .select("component_id, component_name, weight_percentage")
    .eq("department_id", profDept?.department_id || 1)

  // Mark components as attendance-based if their name contains "attendance"
  const gradeComponents: GradeComponent[] = (componentsData || []).map((comp: any) => ({
    ...comp,
    is_attendance: comp.component_name.toLowerCase().includes('attendance')
  }))

  // 5. Fetch grade entries for this class
  const { data: entriesData } = await supabase
    .from("grade_entries")
    .select("*")
    .eq("class_id", classId)

  const gradeEntries: GradeEntry[] = (entriesData || []).map((entry: any) => ({
    grade_id: entry.grade_id,
    student_id: entry.student_id,
    component_id: entry.component_id,
    score: entry.score || 0,
    max_score: entry.max_score || 100,
    attendance: entry.attendance,
    entry_type: entry.entry_type,
    date_recorded: entry.date_recorded,
    grade_period: entry.grade_period,
    name: entry.name, // Include entry name from database
    topics: entry.topics || [], // Include topics from database
  }))

  // Calculate average grade using unified weighted calculation
  let avgGrade = 0
  if (gradeEntries.length > 0 && gradeComponents.length > 0) {
    const normalizedEntries = normalizeGradeEntries(gradeEntries)
    const normalizedComponents = normalizeGradeComponents(gradeComponents)
    avgGrade = calculateClassAverageFromEntries(normalizedEntries, normalizedComponents)
  }

  const formattedClassData: ClassData = {
    class_id: classData.class_id,
    class_name: classData.class_name,
    subject_name: (classData.subjects as any)?.subject_name || classData.class_name,
    subject_code: (classData.subjects as any)?.subject_code || "",
    section_name: (classData.sections as any)?.section_name || "",
    schedule_start: classData.schedule_start,
    schedule_end: classData.schedule_end,
    students,
    gradeComponents,
    gradeEntries,
    studentCount: students.length,
    avgGrade: avgGrade,
  }

  return <ClassPageClient classData={formattedClassData} />
}

