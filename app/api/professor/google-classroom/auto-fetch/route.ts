import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

/**
 * Enhanced Google Classroom API endpoint for automatic data fetching
 * This endpoint fetches courses and their classwork in a single optimized request
 * Used when professor logs in to pre-populate Google Classroom data
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

    // Initialize Google Classroom API with professor's access token
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    const classroom = google.classroom({ version: 'v1', auth })

    console.log(`[Google Classroom] Auto-fetching data for professor: ${session.user.email}`)

    // Fetch active courses for the professor
    const coursesResponse = await classroom.courses.list({
      teacherId: 'me',
      courseStates: ['ACTIVE'],
      pageSize: 100 // Increase page size to get more courses
    })

    const courses = coursesResponse.data.courses || []
    console.log(`[Google Classroom] Found ${courses.length} active courses`)

    // For each course, fetch its classwork in parallel for better performance
    const coursesWithClasswork = await Promise.allSettled(
      courses.map(async (course) => {
        try {
          // Fetch classwork for this course
          const courseworkResponse = await classroom.courses.courseWork.list({
            courseId: course.id!,
            pageSize: 50 // Get recent classwork
          })

          const classwork = courseworkResponse.data.courseWork || []
          
          // Transform classwork data to include essential information
          const transformedClasswork = classwork.map(work => ({
            id: work.id,
            title: work.title,
            description: work.description,
            maxPoints: work.maxPoints,
            dueDate: work.dueDate,
            dueTime: work.dueTime,
            state: work.state,
            workType: work.workType,
            creationTime: work.creationTime,
            updateTime: work.updateTime,
            // Include student count for better UX (placeholder for future enhancement)
            studentCount: 0
          }))

          return {
            id: course.id,
            name: course.name,
            section: course.section,
            description: course.description,
            room: course.room,
            ownerId: course.ownerId,
            enrollmentCode: course.enrollmentCode,
            alternateLink: course.alternateLink,
            teacherGroupEmail: course.teacherGroupEmail,
            courseGroupEmail: course.courseGroupEmail,
            teacherFolder: course.teacherFolder,
            courseState: course.courseState,
            creationTime: course.creationTime,
            updateTime: course.updateTime,
            // Include classwork data
            classwork: transformedClasswork,
            classworkCount: transformedClasswork.length
          }
        } catch (error) {
          console.error(`[Google Classroom] Error fetching classwork for course ${course.id}:`, error)
          // Return course without classwork if there's an error
          return {
            id: course.id,
            name: course.name,
            section: course.section,
            description: course.description,
            room: course.room,
            ownerId: course.ownerId,
            enrollmentCode: course.enrollmentCode,
            alternateLink: course.alternateLink,
            teacherGroupEmail: course.teacherGroupEmail,
            courseGroupEmail: course.courseGroupEmail,
            teacherFolder: course.teacherFolder,
            courseState: course.courseState,
            creationTime: course.creationTime,
            updateTime: course.updateTime,
            classwork: [],
            classworkCount: 0,
            classworkError: error instanceof Error ? error.message : 'Failed to fetch classwork'
          }
        }
      })
    )

    // Process results and separate successful from failed
    const successfulCourses = coursesWithClasswork
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)

    const failedCourses = coursesWithClasswork
      .filter((result): result is PromiseRejectedResult => result.status === 'rejected')
      .map(result => result.reason)

    // Log results for debugging
    console.log(`[Google Classroom] Successfully fetched ${successfulCourses.length} courses with classwork`)
    if (failedCourses.length > 0) {
      console.warn(`[Google Classroom] Failed to fetch ${failedCourses.length} courses:`, failedCourses)
    }

    // Calculate summary statistics
    const totalClasswork = successfulCourses.reduce((sum, course) => sum + course.classworkCount, 0)
    const coursesWithErrors = successfulCourses.filter(course => course.classworkError)

    return NextResponse.json({
      success: true,
      data: {
        courses: successfulCourses,
        summary: {
          totalCourses: successfulCourses.length,
          totalClasswork,
          coursesWithErrors: coursesWithErrors.length,
          fetchTimestamp: new Date().toISOString()
        },
        errors: failedCourses.length > 0 ? {
          failedCourses: failedCourses.length,
          message: 'Some courses failed to load. You can try refreshing or reconnecting to Google Classroom.'
        } : null
      }
    }, { status: 200 })

  } catch (error) {
    console.error("[Google Classroom] Auto-fetch error:", error)
    
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
    }

    return NextResponse.json({ 
      error: "Failed to fetch Google Classroom data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * POST endpoint to refresh Google Classroom data
 * Can be called when user manually requests a refresh
 */
export async function POST(request: NextRequest) {
  // For now, just call the GET endpoint
  // In the future, this could implement caching strategies or incremental updates
  return GET(request)
}
