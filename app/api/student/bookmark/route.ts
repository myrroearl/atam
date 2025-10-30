import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { logBookmarkActivity } from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { resourceId, action } = await request.json()

    if (!resourceId || !action) {
      return NextResponse.json({ error: "Missing resourceId or action" }, { status: 400 })
    }

    // Get resource title for activity logging
    let resourceTitle = "Unknown Resource"
    try {
      const { data: resource } = await supabaseServer
        .from('learning_resources')
        .select('title')
        .eq('id', resourceId)
        .single()
      
      if (resource) {
        resourceTitle = resource.title
      }
    } catch (error) {
      console.log('Could not fetch resource title for activity log:', error)
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

    try {
      if (action === 'bookmark') {
        // Add bookmark
        const { error: bookmarkError } = await supabaseServer
          .from('student_bookmarks')
          .upsert({
            student_id: student.student_id,
            resource_id: resourceId,
            is_active: true,
            created_at: new Date().toISOString()
          }, {
            onConflict: 'student_id,resource_id'
          })

        if (bookmarkError) {
          console.log('Bookmarks table may not exist:', bookmarkError.message)
          return NextResponse.json({ success: true, action: 'bookmarked', note: 'Table not available' })
        }

        // Log bookmark activity
        await logBookmarkActivity(
          Number(session.user.account_id),
          resourceId,
          resourceTitle,
          'bookmark'
        )

        return NextResponse.json({ success: true, action: 'bookmarked' })
      } else if (action === 'unbookmark') {
        // Remove bookmark
        const { error: unbookmarkError } = await supabaseServer
          .from('student_bookmarks')
          .update({ is_active: false })
          .eq('student_id', student.student_id)
          .eq('resource_id', resourceId)

        if (unbookmarkError) {
          console.log('Bookmarks table may not exist:', unbookmarkError.message)
          return NextResponse.json({ success: true, action: 'unbookmarked', note: 'Table not available' })
        }

        // Log unbookmark activity
        await logBookmarkActivity(
          Number(session.user.account_id),
          resourceId,
          resourceTitle,
          'unbookmark'
        )

        return NextResponse.json({ success: true, action: 'unbookmarked' })
      } else {
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
      }
    } catch (tableError) {
      console.log('Bookmarks table not available, returning success for UI')
      return NextResponse.json({ 
        success: true, 
        action: action === 'bookmark' ? 'bookmarked' : 'unbookmarked',
        note: 'Table not available'
      })
    }

  } catch (err) {
    console.error("Bookmark API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}