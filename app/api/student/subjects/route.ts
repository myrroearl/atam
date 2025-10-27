import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { deduplicateSubjects } from "@/lib/student/subject-deduplicator"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get student to find section_id
    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id, section_id")
      .eq("account_id", session.user.account_id)
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    // Get student's section and year level information
    const { data: sectionInfo, error: sectionError } = await supabaseServer
      .from("sections")
      .select(`
        section_id,
        section_name,
        year_level_id,
        year_level (
          year_level_id,
          name,
          course_id,
          courses (
            course_id,
            course_name,
            course_code
          )
        )
      `)
      .eq("section_id", student.section_id)
      .single()

    if (sectionError || !sectionInfo) {
      console.error("Section lookup error:", sectionError)
      return NextResponse.json({ error: "Failed to resolve section" }, { status: 500 })
    }

    // Get current semester for this year level
    const { data: currentSemester, error: semesterError } = await supabaseServer
      .from("semester")
      .select(`
        semester_id,
        semester_name,
        year_level_id
      `)
      .eq("year_level_id", sectionInfo.year_level_id)
      .eq("status", "active")
      .single()

    // Subjects available to this student's section through classes
    const { data: classes, error } = await supabaseServer
      .from("classes")
      .select(`
        class_id,
        subjects:subject_id (
          subject_id,
          subject_code,
          subject_name,
          units,
          semester_id,
          year_level_id
        ),
        professors:professor_id (
          prof_id,
          first_name,
          last_name
        ),
        schedule_start,
        schedule_end
      `)
      .eq("section_id", student.section_id)

    if (error) {
      console.error("Subjects fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
    }

    // Deduplicate subjects by subject_id to avoid duplicates
    const subjects = deduplicateSubjects(classes as any[] || [])

    return NextResponse.json({ 
      subjects: subjects ?? [], 
      studentId: student.student_id,
      sectionInfo: {
        sectionName: sectionInfo.section_name,
        yearLevel: sectionInfo.year_level?.[0]?.name,
        course: sectionInfo.year_level?.[0]?.courses?.[0]?.course_name,
        courseCode: sectionInfo.year_level?.[0]?.courses?.[0]?.course_code
      },
      currentSemester: currentSemester ? {
        semesterName: currentSemester.semester_name,
        semesterId: currentSemester.semester_id
      } : null
    })
  } catch (err) {
    console.error("Subjects API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

