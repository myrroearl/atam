import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch all users for announcement recipient selection
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch all active accounts
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('account_id, email, role')
      .eq('status', 'active')
      .order('email', { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users: accounts || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
