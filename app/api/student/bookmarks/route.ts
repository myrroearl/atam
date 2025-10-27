import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student information
    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id")
      .eq("account_id", Number(session.user.account_id))
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    // Get student's bookmarks
    try {
      const { data: bookmarks, error: bookmarksError } = await supabaseServer
        .from('student_bookmarks')
        .select(`
          resource_id,
          created_at,
          learning_resources (
            id,
            title,
            description,
            type,
            source,
            url,
            author,
            topics,
            tags
          )
        `)
        .eq('student_id', student.student_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (bookmarksError) {
        console.log('Bookmarks table may not exist:', bookmarksError.message)
        return NextResponse.json({ bookmarks: [] })
      }

      return NextResponse.json({ 
        bookmarks: bookmarks || []
      })
    } catch (tableError) {
      console.log('Bookmarks table not available, returning empty array')
      return NextResponse.json({ bookmarks: [] })
    }

  } catch (err) {
    console.error("Bookmarks API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
