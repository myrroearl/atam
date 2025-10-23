import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"

/**
 * Debug endpoint to test Google Classroom API access and student data retrieval
 * This helps diagnose Google Classroom API issues
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

    if (!courseId) {
      return NextResponse.json({ 
        error: "Course ID is required" 
      }, { status: 400 })
    }

    console.log('[Debug Google Classroom] Starting Google Classroom API analysis...')

    const debugResults: any = {
      timestamp: new Date().toISOString(),
      professor: session.user.email,
      courseId: courseId,
      tests: {}
    }

    // Test 1: Basic API setup
    console.log('[Debug Google Classroom] Test 1: API setup...')
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    const classroom = google.classroom({ version: 'v1', auth })

    debugResults.tests.apiSetup = {
      success: true,
      accessTokenLength: session.accessToken.length,
      hasAuth: !!auth
    }

    // Test 2: Course access
    console.log('[Debug Google Classroom] Test 2: Course access...')
    try {
      const courseResponse = await classroom.courses.get({ id: courseId })
      debugResults.tests.courseAccess = {
        success: true,
        courseName: courseResponse.data.name,
        courseId: courseResponse.data.id,
        courseState: courseResponse.data.courseState
      }
    } catch (error: any) {
      debugResults.tests.courseAccess = {
        success: false,
        error: error.message,
        statusCode: error.status
      }
    }

    // Test 3: Students list
    console.log('[Debug Google Classroom] Test 3: Students list...')
    try {
      const studentsResponse = await classroom.courses.students.list({
        courseId: courseId
      })

      const students = studentsResponse.data.students || []
      debugResults.tests.studentsList = {
        success: true,
        totalStudents: students.length,
        sampleStudent: students[0] ? {
          userId: students[0].userId,
          hasProfile: !!students[0].profile,
          hasEmail: !!students[0].profile?.emailAddress,
          hasName: !!students[0].profile?.name?.fullName,
          email: students[0].profile?.emailAddress,
          name: students[0].profile?.name?.fullName
        } : null
      }

      // Test 4: Email analysis
      console.log('[Debug Google Classroom] Test 4: Email analysis...')
      const studentsWithEmails = students.filter(s => s.profile?.emailAddress)
      const studentsWithoutEmails = students.filter(s => !s.profile?.emailAddress)
      
      debugResults.tests.emailAnalysis = {
        totalStudents: students.length,
        withEmails: studentsWithEmails.length,
        withoutEmails: studentsWithoutEmails.length,
        sampleEmails: studentsWithEmails.slice(0, 5).map(s => ({
          userId: s.userId,
          email: s.profile?.emailAddress,
          name: s.profile?.name?.fullName
        })),
        studentsWithoutEmails: studentsWithoutEmails.slice(0, 5).map(s => ({
          userId: s.userId,
          name: s.profile?.name?.fullName
        }))
      }

      // Test 5: Profile data analysis
      console.log('[Debug Google Classroom] Test 5: Profile data analysis...')
      const profileAnalysis = students.map(student => ({
        userId: student.userId,
        hasProfile: !!student.profile,
        hasEmail: !!student.profile?.emailAddress,
        hasName: !!student.profile?.name?.fullName,
        hasGivenName: !!student.profile?.name?.givenName,
        hasFamilyName: !!student.profile?.name?.familyName
      }))

      debugResults.tests.profileAnalysis = {
        totalProfiles: profileAnalysis.length,
        withCompleteProfile: profileAnalysis.filter(p => p.hasProfile && p.hasEmail && p.hasName).length,
        withPartialProfile: profileAnalysis.filter(p => p.hasProfile && (p.hasEmail || p.hasName)).length,
        withoutProfile: profileAnalysis.filter(p => !p.hasProfile).length,
        sampleProfiles: profileAnalysis.slice(0, 5)
      }

    } catch (error: any) {
      debugResults.tests.studentsList = {
        success: false,
        error: error.message,
        statusCode: error.status
      }
    }

    // Test 6: Coursework access
    console.log('[Debug Google Classroom] Test 6: Coursework access...')
    try {
      const courseworkResponse = await classroom.courses.courseWork.list({
        courseId: courseId
      })
      
      const coursework = courseworkResponse.data.courseWork || []
      debugResults.tests.courseworkAccess = {
        success: true,
        totalCoursework: coursework.length,
        sampleCoursework: coursework[0] ? {
          id: coursework[0].id,
          title: coursework[0].title,
          state: coursework[0].state
        } : null
      }
    } catch (error: any) {
      debugResults.tests.courseworkAccess = {
        success: false,
        error: error.message,
        statusCode: error.status
      }
    }

    console.log('[Debug Google Classroom] Analysis complete')

    return NextResponse.json({
      success: true,
      debug: debugResults,
      summary: {
        totalTests: Object.keys(debugResults.tests).length,
        successfulTests: Object.values(debugResults.tests).filter((test: any) => test.success !== false).length,
        apiConnection: debugResults.tests.apiSetup?.success,
        courseAccessible: debugResults.tests.courseAccess?.success,
        studentsAccessible: debugResults.tests.studentsList?.success,
        hasStudents: (debugResults.tests.studentsList?.totalStudents || 0) > 0,
        hasStudentEmails: (debugResults.tests.emailAnalysis?.withEmails || 0) > 0
      }
    })

  } catch (error) {
    console.error("[Debug Google Classroom] Error:", error)
    return NextResponse.json({ 
      error: "Failed to run Google Classroom debug analysis",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
