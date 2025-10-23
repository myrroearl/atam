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

    // Subjects available to this student's section through classes
    const { data, error } = await supabaseServer
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

    return NextResponse.json({ subjects: data ?? [], studentId: student.student_id })
  } catch (err) {
    console.error("Subjects API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

