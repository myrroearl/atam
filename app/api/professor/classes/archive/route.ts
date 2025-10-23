import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { class_id, action } = body

    if (!class_id || !action) {
      return NextResponse.json({ 
        error: "Missing required fields: class_id, action" 
      }, { status: 400 })
    }

    if (!['archive', 'restore'].includes(action)) {
      return NextResponse.json({ 
        error: "Invalid action. Must be 'archive' or 'restore'" 
      }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // First, verify the professor owns this class
    const { data: professor, error: professorError } = await supabase
      .from("professors")
      .select("prof_id")
      .eq("account_id", Number(session.user.account_id))
      .single()

    if (professorError || !professor) {
      return NextResponse.json({ 
        error: "Professor not found" 
      }, { status: 404 })
    }

    const { data: classData, error: classError } = await supabase
      .from("classes")
      .select("class_id, professor_id, status")
      .eq("class_id", class_id)
      .eq("professor_id", professor.prof_id)
      .single()

    if (classError || !classData) {
      return NextResponse.json({ 
        error: "Class not found or you don't have permission to modify it" 
      }, { status: 404 })
    }

    // Determine the new status
    const newStatus = action === 'archive' ? 'inactive' : 'active'

    // Update the class status
    const { data: updatedClass, error: updateError } = await supabase
      .from("classes")
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq("class_id", class_id)
      .select()
      .single()

    if (updateError) {
      console.error("Error updating class status:", updateError)
      return NextResponse.json({ 
        error: "Failed to update class status",
        details: updateError.message
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Class ${action === 'archive' ? 'archived' : 'restored'} successfully`,
      class: updatedClass
    }, { status: 200 })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
