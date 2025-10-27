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

    // Count bookmarked learning resources for the student
    // For now, return 0 if the table doesn't exist
    let bookmarksCount = 0
    
    try {
      const { count, error: bookmarksError } = await supabaseServer
        .from('student_bookmarks')
        .select('id', { count: 'exact' })
        .eq('student_id', student.student_id)
        .eq('is_active', true)

      if (bookmarksError) {
        console.log('Bookmarks table may not exist, returning 0:', bookmarksError.message)
        bookmarksCount = 0
      } else {
        bookmarksCount = count || 0
      }
    } catch (tableError) {
      console.log('Bookmarks table not available, returning 0')
      bookmarksCount = 0
    }

    return NextResponse.json({ 
      bookmarksCount: bookmarksCount
    })

  } catch (err) {
    console.error("Bookmarks count API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
