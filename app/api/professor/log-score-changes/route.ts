import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { 
  logScoreChanges,
  getProfessorAccountId,
  getComponentName,
  type GradeEntryActivityData
} from "@/lib/activity-logger"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      class_id,
      component_id,
      score_changes
    } = body

    // Validation
    if (!class_id || !component_id || !score_changes || !Array.isArray(score_changes)) {
      return NextResponse.json({ 
        error: "Missing required fields: class_id, component_id, score_changes" 
      }, { status: 400 })
    }

    // Get professor account ID
    const accountId = await getProfessorAccountId(session)
    if (!accountId) {
      return NextResponse.json({ 
        error: "Failed to get professor account ID" 
      }, { status: 500 })
    }

    // Get component name
    const componentName = await getComponentName(component_id)
    if (!componentName) {
      return NextResponse.json({ 
        error: "Failed to get component name" 
      }, { status: 500 })
    }

    // Log the bulk score changes
    const activityData: GradeEntryActivityData = {
      class_id: Number(class_id),
      component_id: Number(component_id),
      component_name: componentName,
      student_count: score_changes.length,
      score_changes: score_changes
    }

    const success = await logScoreChanges(accountId, activityData)

    if (!success) {
      return NextResponse.json({ 
        error: "Failed to log score changes" 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully logged ${score_changes.length} score changes`
    }, { status: 200 })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
