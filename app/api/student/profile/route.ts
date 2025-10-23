import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get student profile with related data
    const { data: student, error } = await supabase
      .from('students')
      .select(`
        *,
        profile_picture_url,
        accounts (
          email,
          status
        ),
        sections (
          section_name,
          year_level (
            name,
            courses (
              course_name,
              course_code,
              departments (
                department_name
              )
            )
          )
        ),
        final_grades (
          grade,
          completion,
          taken,
          credited,
          remarks,
          year_taken,
          subjects (
            subject_name,
            subject_code,
            units
          )
        )
      `)
      .eq('account_id', session.user.account_id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json({ student })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}