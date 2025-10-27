import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // First get the student_id from account_id
    const { data: studentInfo, error: studentError } = await supabaseServer
      .from('students')
      .select('student_id, privacy_settings')
      .eq('account_id', Number(session.user.account_id))
      .single()

    if (studentError || !studentInfo) {
      console.error("[Privacy API] Student not found:", studentError)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Parse privacy settings from JSON or return default
    let privacySettings = { profileVisibility: 'public' }
    
    console.log("[Privacy API] Raw privacy_settings from DB:", studentInfo?.privacy_settings)
    
    if (studentInfo?.privacy_settings) {
      try {
        privacySettings = typeof studentInfo.privacy_settings === 'string' 
          ? JSON.parse(studentInfo.privacy_settings)
          : studentInfo.privacy_settings
        console.log("[Privacy API] Parsed privacy settings:", privacySettings)
      } catch (parseError) {
        console.error("[Privacy API] Error parsing privacy settings:", parseError)
        // Keep default settings if parsing fails
      }
    } else {
      console.log("[Privacy API] No privacy_settings found, using default")
    }

    return NextResponse.json({ 
      privacySettings 
    })

  } catch (error) {
    console.error("[Privacy API] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { profileVisibility } = body

    console.log("[Privacy API] Received update request:", body)

    if (!profileVisibility || !['public', 'private'].includes(profileVisibility)) {
      console.log("[Privacy API] Invalid profile visibility:", profileVisibility)
      return NextResponse.json({ 
        error: "Invalid profile visibility. Must be 'public' or 'private'" 
      }, { status: 400 })
    }

    // First get the student_id from account_id
    const { data: studentInfo, error: studentError } = await supabaseServer
      .from('students')
      .select('student_id')
      .eq('account_id', Number(session.user.account_id))
      .single()

    if (studentError || !studentInfo) {
      console.error("[Privacy API] Student not found:", studentError)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Update privacy settings in the students table using student_id
    const privacySettings = { profileVisibility }
    
    console.log("[Privacy API] Updating privacy settings for student_id:", studentInfo.student_id, "with settings:", privacySettings)
    
    const { data, error } = await supabaseServer
      .from('students')
      .update({
        privacy_settings: privacySettings,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentInfo.student_id)
      .select('privacy_settings')
      .single()

    if (error) {
      console.error("[Privacy API] Database error:", error)
      return NextResponse.json({ error: "Failed to update privacy settings" }, { status: 500 })
    }

    console.log("[Privacy API] Successfully updated privacy settings:", data)

    return NextResponse.json({ 
      privacySettings 
    })

  } catch (error) {
    console.error("[Privacy API] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}