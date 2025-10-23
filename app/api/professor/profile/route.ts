import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { logProfileUpdate } from "@/lib/activity-logger"

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

    // Get professor profile with related data
    const { data: professor, error } = await supabase
      .from('professors')
      .select(`
        *,
        accounts (
          email,
          status
        ),
        departments (
          department_name,
          description
        ),
        classes (
          class_id,
          class_name,
          schedule_start,
          schedule_end,
          subjects (
            subject_name,
            subject_code,
            units
          ),
          sections (
            section_name
          )
        )
      `)
      .eq('account_id', session.user.account_id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    return NextResponse.json({ professor })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { phone, address } = body

    // Validate required fields
    if (phone === undefined && address === undefined) {
      return NextResponse.json({ 
        error: "At least one field (phone or address) must be provided" 
      }, { status: 400 })
    }

    // Prepare update data
    const updateData: any = {}
    if (phone !== undefined) updateData.contact_number = phone
    if (address !== undefined) updateData.address = address

    // Update professor profile
    const { data, error } = await supabase
      .from('professors')
      .update(updateData)
      .eq('account_id', session.user.account_id)
      .select()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Log the profile update activity
    try {
      await logProfileUpdate(Number(session.user.account_id), {
        phone: phone !== undefined ? phone : undefined,
        address: address !== undefined ? address : undefined
      })
    } catch (logError) {
      console.error("Failed to log profile update activity:", logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Profile updated successfully",
      data: data[0]
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}