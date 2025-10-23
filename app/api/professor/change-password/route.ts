import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { logPasswordChange } from "@/lib/activity-logger"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: "Current password and new password are required" 
      }, { status: 400 })
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: "New password must be at least 6 characters long" 
      }, { status: 400 })
    }

    // Get current password hash from accounts table
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('password_hash')
      .eq('account_id', session.user.account_id)
      .single()

    if (accountError || !account) {
      console.error("Account fetch error:", accountError)
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // For now, we'll do a simple comparison since passwords are stored as plain text
    // TODO: Implement proper password hashing comparison
    if (account.password_hash !== currentPassword) {
      return NextResponse.json({ 
        error: "Current password is incorrect" 
      }, { status: 400 })
    }

    // Update password in accounts table
    // TODO: Hash the new password before storing
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ 
        password_hash: newPassword, // TODO: Hash this password
        updated_at: new Date().toISOString()
      })
      .eq('account_id', session.user.account_id)

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    // Log the password change activity
    try {
      await logPasswordChange(Number(session.user.account_id))
    } catch (logError) {
      console.error("Failed to log password change activity:", logError)
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
