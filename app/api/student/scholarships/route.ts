import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { data, error } = await supabaseServer
      .from("scholarships")
      .select("scholarship_id, scholarship_name, description, requirements, application_link, eligibility_criteria, created_at")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Scholarships fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch scholarships" }, { status: 500 })
    }

    return NextResponse.json({ scholarships: data ?? [] })
  } catch (err) {
    console.error("Scholarships API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

