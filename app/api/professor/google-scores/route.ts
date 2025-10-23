import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

/**
 * API endpoint to fetch Google Classroom student submissions and scores
 * Used by the gradebook to import scores from Google Classroom assignments
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    if (!session.accessToken) {
      return NextResponse.json({ 
        error: "No Google Classroom access token available",
        requiresReauth: true 
      }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('courseId')
    const courseWorkId = searchParams.get('courseWorkId')

    if (!courseId || !courseWorkId) {
      return NextResponse.json({ 
        error: "Course ID and CourseWork ID are required" 
      }, { status: 400 })
    }

    // Initialize Google Classroom API
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    const classroom = google.classroom({ version: 'v1', auth })

    console.log(`[Google Scores] Fetching submissions for course ${courseId}, coursework ${courseWorkId}`)

    // Fetch student submissions for the specific coursework
    const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
      courseId: courseId,
      courseWorkId: courseWorkId
    })

    const submissions = submissionsResponse.data.studentSubmissions || []
    console.log(`[Google Scores] Found ${submissions.length} submissions`)

    // Fetch students for the course to get email addresses
    const studentsResponse = await classroom.courses.students.list({
      courseId: courseId
    })

    const students = studentsResponse.data.students || []
    console.log(`[Google Scores] Found ${students.length} students in course`)

    // Create a map of user IDs to emails for easier lookup
    const userIdToEmail = new Map<string, string>()
    const googleClassroomStudents = students.map(student => ({
      userId: student.userId,
      email: student.profile?.emailAddress || '',
      fullName: student.profile?.name?.fullName || '',
      firstName: student.profile?.name?.givenName || '',
      lastName: student.profile?.name?.familyName || ''
    }))

    googleClassroomStudents.forEach(student => {
      if (student.userId && student.email) {
        userIdToEmail.set(student.userId, student.email)
      }
    })

    // Transform submissions into the format expected by the gradebook
    const studentsWithScores = submissions.map(submission => {
      const email = userIdToEmail.get(submission.userId || '') || 'unknown@example.com'
      
      // Extract score from the submission
      let score: number | null = null
      let maxScore: number | null = null

      if (submission.assignedGrade !== null && submission.assignedGrade !== undefined) {
        score = submission.assignedGrade
      } else if (submission.draftGrade !== null && submission.draftGrade !== undefined) {
        score = submission.draftGrade
      }

      // Try to get max score from the coursework (if available in submission)
      if (submission.courseWorkType === 'ASSIGNMENT' && submission.assignmentSubmission) {
        // For assignments, we might need to fetch the coursework details separately
        // For now, we'll use a default or the score if it's available
        maxScore = 100 // Default max score
      }

      return {
        userId: submission.userId,
        email: email,
        score: score,
        maxScore: maxScore,
        state: submission.state,
        submissionId: submission.id,
        assignedGrade: submission.assignedGrade,
        draftGrade: submission.draftGrade,
        lastModified: submission.updateTime
      }
    }).filter(student => student.score !== null) // Only return students with actual scores

    console.log(`[Google Scores] Returning ${studentsWithScores.length} students with scores`)

    return NextResponse.json({
      success: true,
      students: studentsWithScores,
      googleClassroomStudents: googleClassroomStudents,
      totalSubmissions: submissions.length,
      scoredSubmissions: studentsWithScores.length
    })

  } catch (error) {
    console.error("[Google Scores] Error:", error)
    
    // Handle specific Google API errors
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('unauthorized')) {
        return NextResponse.json({ 
          error: "Google Classroom access expired. Please reconnect your account.",
          requiresReauth: true,
          details: error.message
        }, { status: 401 })
      }
      
      if (error.message.includes('403') || error.message.includes('forbidden')) {
        return NextResponse.json({ 
          error: "Insufficient permissions for Google Classroom. Please check your account permissions.",
          requiresReauth: true,
          details: error.message
        }, { status: 403 })
      }

      if (error.message.includes('404') || error.message.includes('not found')) {
        return NextResponse.json({ 
          error: "Course or coursework not found. Please check your selection.",
          details: error.message
        }, { status: 404 })
      }
    }

    return NextResponse.json({ 
      error: "Failed to fetch Google Classroom scores",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
