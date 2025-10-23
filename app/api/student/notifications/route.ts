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
      .from("notifications")
      .select("notification_id, message, type, status, created_at")
      .eq("account_id", session.user.account_id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Notifications fetch error:", error)
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    return NextResponse.json({ notifications: data ?? [] })
  } catch (err) {
    console.error("Notifications API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const ids: number[] = Array.isArray(body.ids) ? body.ids : []
    const status: string | undefined = body.status
    if (!ids.length || !status) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from("notifications")
      .update({ status })
      .in("notification_id", ids)
      .eq("account_id", session.user.account_id)

    if (error) {
      console.error("Notifications update error:", error)
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Notifications API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const ids: number[] = Array.isArray(body.ids) ? body.ids : []
    if (!ids.length) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
    }

    const { error } = await supabaseServer
      .from("notifications")
      .delete()
      .in("notification_id", ids)
      .eq("account_id", session.user.account_id)

    if (error) {
      console.error("Notifications delete error:", error)
      return NextResponse.json({ error: "Failed to delete notifications" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("Notifications API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

