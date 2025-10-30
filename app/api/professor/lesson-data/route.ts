import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Find professor
    const { data: professor, error: professorError } = await supabase
      .from("professors")
      .select("prof_id")
      .eq("account_id", Number(session.user.account_id))
      .single()

    if (professorError || !professor) {
      return NextResponse.json(
        { error: "Professor not found" },
        { status: 404 }
      )
    }

    // Fetch classes with subjects and student counts
    const { data: classesData, error: classesError } = await supabase
      .from("classes")
      .select(`
        class_id,
        class_name,
        subject_id,
        section_id,
        subjects (
          subject_name,
          subject_code
        )
      `)
      .eq("professor_id", professor.prof_id)
      .eq("status", "active")

    if (classesError) {
      return NextResponse.json(
        { error: "Failed to fetch classes" },
        { status: 500 }
      )
    }

    // Get student counts for each section
    const classesWithStudentCount = await Promise.all(
      (classesData || []).map(async (cls) => {
        if (!cls.section_id) {
          return { ...cls, studentCount: 0 }
        }

        const { count, error } = await supabase
          .from("students")
          .select("*", { count: "exact", head: true })
          .eq("section_id", cls.section_id)

        return {
          ...cls,
          studentCount: count || 0
        }
      })
    )

    // Fetch all subjects
    const { data: subjectsData, error: subjectsError } = await supabase
      .from("subjects")
      .select(`
        subject_id,
        subject_name,
        subject_code
      `)
      .eq("status", "active")
      .order("subject_name", { ascending: true })

    if (subjectsError) {
      return NextResponse.json(
        { error: "Failed to fetch subjects" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      classes: classesWithStudentCount,
      subjects: subjectsData || []
    })

  } catch (error) {
    console.error("Error fetching lesson data:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

