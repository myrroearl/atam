import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!session.accessToken) {
      return NextResponse.json({ error: "No access token available" }, { status: 401 })
    }

    // Initialize Google Classroom API
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })

    const classroom = google.classroom({ version: 'v1', auth })

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'courses':
        const coursesResponse = await classroom.courses.list({
          teacherId: 'me',
          courseStates: ['ACTIVE']
        })
        return NextResponse.json({ courses: coursesResponse.data.courses || [] })

      case 'coursework':
        const courseId = searchParams.get('courseId')
        if (!courseId) {
          return NextResponse.json({ error: "Course ID required" }, { status: 400 })
        }

        const courseworkResponse = await classroom.courses.courseWork.list({
          courseId: courseId
        })
        return NextResponse.json({ coursework: courseworkResponse.data.courseWork || [] })

      case 'scores':
        const courseWorkId = searchParams.get('courseWorkId')
        const courseIdForScores = searchParams.get('courseId')
        
        if (!courseWorkId || !courseIdForScores) {
          return NextResponse.json({ error: "Course ID and CourseWork ID required" }, { status: 400 })
        }

        const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
          courseId: courseIdForScores,
          courseWorkId: courseWorkId
        })
        return NextResponse.json({ submissions: submissionsResponse.data.studentSubmissions || [] })

      case 'students':
        const courseIdForStudents = searchParams.get('courseId')
        if (!courseIdForStudents) {
          return NextResponse.json({ error: "Course ID required" }, { status: 400 })
        }

        const studentsResponse = await classroom.courses.students.list({
          courseId: courseIdForStudents
        })
        return NextResponse.json({ students: studentsResponse.data.students || [] })

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

  } catch (error) {
    console.error("Google Classroom API error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch Google Classroom data",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
