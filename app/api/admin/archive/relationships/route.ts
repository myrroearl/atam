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
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || ""
    const idParam = searchParams.get("id") || ""
    const id = parseInt(idParam)

    if (!type || !id || Number.isNaN(id)) {
      return NextResponse.json({ error: "Missing or invalid type/id" }, { status: 400 })
    }

    const rel: Record<string, number> = {}

    // Helper to get exact counts efficiently
    const countExact = async (table: string, column: string, value: number) => {
      const { count, error } = await supabase
        .from(table)
        .select("*", { count: "exact", head: true })
        .eq(column, value)
      if (error) throw error
      return count || 0
    }

    switch (type) {
      case "departments": {
        rel.courses = await countExact("courses", "department_id", id)
        rel.professors = await countExact("professors", "department_id", id)
        rel.grade_components = await countExact("grade_components", "department_id", id)
        break
      }
      case "courses": {
        rel.sections = await countExact("sections", "course_id", id)
        rel.subjects = await countExact("subjects", "course_id", id)
        rel.year_levels = await countExact("year_level", "course_id", id)
        break
      }
      case "sections": {
        rel.students = await countExact("students", "section_id", id)
        rel.classes = await countExact("classes", "section_id", id)
        break
      }
      case "subjects": {
        rel.classes = await countExact("classes", "subject_id", id)
        break
      }
      case "year_level": {
        rel.sections = await countExact("sections", "year_level_id", id)
        rel.semesters = await countExact("semester", "year_level_id", id)
        break
      }
      case "semester": {
        rel.subjects = await countExact("subjects", "semester_id", id)
        break
      }
      case "professors": {
        rel.classes = await countExact("classes", "professor_id", id)
        break
      }
      case "students": {
        rel.grade_entries = await countExact("grade_entries", "student_id", id)
        break
      }
      default:
        return NextResponse.json({ error: "Unsupported type" }, { status: 400 })
    }

    return NextResponse.json({ related: rel })
  } catch (error) {
    console.error("Relationships API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


