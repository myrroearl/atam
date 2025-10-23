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

    const { data, error } = await supabaseServer
      .from("grade_entries")
      .select(`
        grade_id,
        class_id,
        student_id,
        name,
        score,
        max_score,
        date_recorded,
        classes:class_id (
          subject_id
        ),
         grade_components:component_id (
           component_name,
           weight_percentage
         ),
         learning_outcomes:outcome_id (
           outcome_code,
           outcome_description
         )
      `)
      .eq("student_id", student.student_id)

    if (error) {
      console.error("Entries fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 })
    }

    return NextResponse.json({ entries: data ?? [] })
  } catch (err) {
    console.error("Entries API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

