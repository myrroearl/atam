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

    // Get the student_id from account_id
    const { data: studentInfo, error: studentError } = await supabaseServer
      .from('students')
      .select('student_id, notification_preferences')
      .eq('account_id', Number(session.user.account_id))
      .single()

    if (studentError || !studentInfo) {
      console.error("[Notification Preferences API] Student not found:", studentError)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Parse notification preferences from JSON or return default
    let preferences = [
      { id: "emailNotifications", label: "Email Notifications", description: "Receive notifications via email", enabled: true },
      { id: "pushNotifications", label: "Push Notifications", description: "Receive push notifications on your device", enabled: true },
      { id: "gradeUpdates", label: "Grade Updates", description: "Get notified when new grades are posted", enabled: true },
    ]
    
    console.log("[Notification Preferences API] Raw notification_preferences from DB:", studentInfo?.notification_preferences)
    
    if (studentInfo?.notification_preferences) {
      try {
        const savedPreferences = typeof studentInfo.notification_preferences === 'string' 
          ? JSON.parse(studentInfo.notification_preferences)
          : studentInfo.notification_preferences
        
        console.log("[Notification Preferences API] Parsed notification preferences:", savedPreferences)
        
        // If it's an array, use it
        if (Array.isArray(savedPreferences)) {
          preferences = savedPreferences
        }
      } catch (parseError) {
        console.error("[Notification Preferences API] Error parsing notification preferences:", parseError)
        // Keep default preferences if parsing fails
      }
    } else {
      console.log("[Notification Preferences API] No notification_preferences found, using default")
    }

    return NextResponse.json({ 
      preferences 
    })

  } catch (error) {
    console.error("[Notification Preferences API] API error:", error)
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
    const { preferenceId, enabled } = body

    console.log("[Notification Preferences API] Received update request:", body)

    if (!preferenceId || typeof enabled !== 'boolean') {
      console.log("[Notification Preferences API] Invalid request body:", body)
      return NextResponse.json({ 
        error: "Invalid request. Must include preferenceId and enabled boolean" 
      }, { status: 400 })
    }

    // Get the student_id and current preferences from account_id
    const { data: studentInfo, error: studentError } = await supabaseServer
      .from('students')
      .select('student_id, notification_preferences')
      .eq('account_id', Number(session.user.account_id))
      .single()

    if (studentError || !studentInfo) {
      console.error("[Notification Preferences API] Student not found:", studentError)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get current preferences or use defaults
    let currentPreferences = [
      { id: "emailNotifications", label: "Email Notifications", description: "Receive notifications via email", enabled: true },
      { id: "pushNotifications", label: "Push Notifications", description: "Receive push notifications on your device", enabled: true },
      { id: "gradeUpdates", label: "Grade Updates", description: "Get notified when new grades are posted", enabled: true },
    ]

    if (studentInfo?.notification_preferences) {
      try {
        const savedPreferences = typeof studentInfo.notification_preferences === 'string' 
          ? JSON.parse(studentInfo.notification_preferences)
          : studentInfo.notification_preferences
        
        if (Array.isArray(savedPreferences)) {
          currentPreferences = savedPreferences
        }
      } catch (parseError) {
        console.error("[Notification Preferences API] Error parsing existing preferences:", parseError)
      }
    }

    // Update the specific preference
    const updatedPreferences = currentPreferences.map(pref =>
      pref.id === preferenceId ? { ...pref, enabled } : pref
    )
    
    console.log("[Notification Preferences API] Updating notification preferences for student_id:", studentInfo.student_id, "with preferences:", updatedPreferences)
    
    const { data, error } = await supabaseServer
      .from('students')
      .update({
        notification_preferences: updatedPreferences,
        updated_at: new Date().toISOString()
      })
      .eq('student_id', studentInfo.student_id)
      .select('notification_preferences')
      .single()

    if (error) {
      console.error("[Notification Preferences API] Database error:", error)
      return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 })
    }

    console.log("[Notification Preferences API] Successfully updated notification preferences:", data)

    return NextResponse.json({ 
      preferences: updatedPreferences 
    })

  } catch (error) {
    console.error("[Notification Preferences API] API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

