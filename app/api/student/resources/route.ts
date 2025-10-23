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
      .from("learning_resources")
      .select(`
        resource_id,
        resource_title,
        resource_link,
        resource_type,
        subjects:subject_id ( subject_name )
      `)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("Resources fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 })
    }

    return NextResponse.json({ resources: data ?? [] })
  } catch (err) {
    console.error("Resources API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

