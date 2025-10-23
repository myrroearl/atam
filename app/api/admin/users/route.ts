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

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all users with their details
    const { data: accounts, error } = await supabase
      .from('accounts')
      .select(`
        account_id,
        email,
        role,
        status,
        created_at,
        students (
          student_id,
          first_name,
          middle_name,
          last_name,
          contact_number
        ),
        professors (
          prof_id,
          first_name,
          middle_name,
          last_name,
          contact_number,
          faculty_type
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users: accounts })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
