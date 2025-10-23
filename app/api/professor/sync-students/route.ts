import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface DatabaseStudent {
  student_id: number
  first_name: string
  middle_name?: string
  last_name: string
  email: string
  full_name: string
}

interface GoogleClassroomStudent {
  userId: string
  email: string
  fullName: string
  firstName: string
  lastName: string
}

interface MatchedStudent {
  student_id: number
  email: string
  db_name: string
  gc_name: string
  match_type: 'Matched' | 'partial'
}

interface SyncResult {
  matched: MatchedStudent[]
  dbOnly: DatabaseStudent[]
  gcOnly: GoogleClassroomStudent[]
  totalMatched: number
  totalDbOnly: number
  totalGcOnly: number
}

/**
 * API endpoint to synchronize students between database and Google Classroom
 * Returns a preview of what will be synchronized without making changes
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
    const classId = searchParams.get('class_id')
    const courseId = searchParams.get('course_id')

    if (!classId || !courseId) {
      return NextResponse.json({ 
        error: "Class ID and Course ID are required" 
      }, { status: 400 })
    }

    console.log(`[Sync Students] Starting sync for class ${classId} and course ${courseId}`)

    // Debug database queries step by step
    console.log('[Sync Students] Step 1: Testing basic database queries...')
    
    // Test basic students query
    const { data: allStudents, error: allStudentsError } = await supabase
      .from('students')
      .select('student_id, first_name, last_name, account_id')
      .limit(5)

    if (allStudentsError) {
      console.error('[Sync Students] Basic students query error:', allStudentsError)
    } else {
      console.log(`[Sync Students] Basic students query: ${allStudents?.length || 0} students`)
      if (allStudents && allStudents.length > 0) {
        console.log('[Sync Students] Sample student:', allStudents[0])
      }
    }

    // Test accounts query
    const { data: allAccounts, error: allAccountsError } = await supabase
      .from('accounts')
      .select('account_id, email, role')
      .eq('role', 'student')
      .limit(5)

    if (allAccountsError) {
      console.error('[Sync Students] Accounts query error:', allAccountsError)
    } else {
      console.log(`[Sync Students] Student accounts found: ${allAccounts?.length || 0}`)
      if (allAccounts && allAccounts.length > 0) {
        console.log('[Sync Students] Sample account:', allAccounts[0])
      }
    }

    // Now test the join query - only fetch students from the specific class
    console.log('[Sync Students] Step 2: Testing join query for class-specific students...')
    
    // First, get the class details to find the section_id
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('class_id, section_id')
      .eq('class_id', classId)
      .single()

    if (classError || !classData) {
      console.error('[Sync Students] Class query error:', classError)
      return NextResponse.json({ 
        error: "Failed to fetch class details",
        details: classError?.message || 'Class not found'
      }, { status: 500 })
    }

    console.log(`[Sync Students] Found class with section_id: ${classData.section_id}`)

    // Now fetch only students from the same section as the class
    const { data: dbStudents, error: dbError } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        section_id,
        accounts!inner(
          account_id,
          email,
          role
        )
      `)
      .eq('accounts.role', 'student')
      .eq('section_id', classData.section_id)

    if (dbError) {
      console.error('[Sync Students] Join query error:', dbError)
      return NextResponse.json({ 
        error: "Failed to fetch students from database",
        details: dbError.message 
      }, { status: 500 })
    }

    console.log(`[Sync Students] Class-specific students query returned: ${dbStudents?.length || 0} students`)
    if (dbStudents && dbStudents.length > 0) {
      console.log('[Sync Students] Sample class student:', dbStudents[0])
    }

    const databaseStudents: DatabaseStudent[] = dbStudents?.map(student => ({
      student_id: student.student_id,
      first_name: student.first_name,
      middle_name: student.middle_name,
      last_name: student.last_name,
      email: (student.accounts as any)?.email || '',
      full_name: `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`
    })) || []

    // Filter and log students without emails
    const studentsWithEmails = databaseStudents.filter(student => student.email)
    const studentsWithoutEmails = databaseStudents.filter(student => !student.email)
    
    if (studentsWithoutEmails.length > 0) {
      console.warn(`[Sync Students] Found ${studentsWithoutEmails.length} students without email addresses:`, 
        studentsWithoutEmails.map(s => `ID: ${s.student_id}, Name: ${s.full_name}`))
    }

    console.log(`[Sync Students] Processing ${studentsWithEmails.length} students with valid emails`)

    // Fetch students from Google Classroom with debugging
    console.log('[Sync Students] Step 3: Setting up Google Classroom API...')
    console.log('[Sync Students] Access token available:', !!session.accessToken)
    
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    const classroom = google.classroom({ version: 'v1', auth })

    console.log('[Sync Students] Step 4: Fetching students from Google Classroom...')
    
    // Method 1: Basic students list
    const studentsResponse = await classroom.courses.students.list({
      courseId: courseId
    })

    let rawGcStudents = studentsResponse.data.students || []
    console.log(`[Sync Students] Method 1 - Basic list: ${rawGcStudents.length} students`)
    
    if (rawGcStudents.length > 0) {
      console.log('[Sync Students] Sample raw GC student:', {
        userId: rawGcStudents[0].userId,
        email: rawGcStudents[0].profile?.emailAddress,
        name: rawGcStudents[0].profile?.name?.fullName,
        hasProfile: !!rawGcStudents[0].profile,
        hasEmail: !!rawGcStudents[0].profile?.emailAddress
      })
    }

    // Method 2: Try to get individual student profiles for emails
    console.log('[Sync Students] Method 2: Fetching individual student profiles...')
    const enhancedGcStudents = []
    
    for (const student of rawGcStudents) {
      try {
        // Try to get individual student profile
        const userResponse = await classroom.userProfiles.get({
          userId: student.userId || ''
        })
        
        const userProfile = userResponse.data
        console.log(`[Sync Students] Individual profile for ${student.userId}:`, {
          email: userProfile.emailAddress,
          name: userProfile.name?.fullName,
          hasEmail: !!userProfile.emailAddress
        })
        
        if (userProfile.emailAddress) {
          enhancedGcStudents.push({
            ...student,
            profile: {
              ...student.profile,
              emailAddress: userProfile.emailAddress,
              id: userProfile.id,
              name: userProfile.name || student.profile?.name
            }
          })
        } else {
          // Method 3: Try alternative approach - construct email from user ID
          console.log(`[Sync Students] No email found for ${student.userId}, trying alternative methods...`)
          
          // Try to get user info from Google People API (if available)
          try {
            const peopleResponse = await fetch(`https://people.googleapis.com/v1/people/${student.userId}?personFields=emailAddresses`, {
              headers: {
                'Authorization': `Bearer ${session.accessToken}`
              }
            })
            
            if (peopleResponse.ok) {
              const peopleData = await peopleResponse.json()
              const email = peopleData.emailAddresses?.[0]?.value
              if (email) {
                console.log(`[Sync Students] Found email via People API: ${email}`)
                enhancedGcStudents.push({
                  ...student,
                  profile: {
                    ...student.profile,
                    emailAddress: email,
                    id: userProfile.id,
                    name: userProfile.name || student.profile?.name
                  }
                })
              } else {
                enhancedGcStudents.push(student)
              }
            } else {
              console.log(`[Sync Students] People API failed: ${peopleResponse.status}`)
              enhancedGcStudents.push(student)
            }
          } catch (peopleError: any) {
            console.log(`[Sync Students] People API error: ${peopleError.message}`)
            enhancedGcStudents.push(student)
          }
        }
      } catch (error: any) {
        console.log(`[Sync Students] Failed to get profile for ${student.userId}:`, error.message)
        enhancedGcStudents.push(student)
      }
    }
    
    rawGcStudents = enhancedGcStudents
    console.log(`[Sync Students] Method 2 - After profile fetch: ${rawGcStudents.length} students`)
    
    // Check if we now have emails
    const studentsWithEmailsAfter = rawGcStudents.filter(s => s.profile?.emailAddress)
    console.log(`[Sync Students] Students with emails after profile fetch: ${studentsWithEmailsAfter.length}/${rawGcStudents.length}`)
    
    if (studentsWithEmailsAfter.length > 0) {
      console.log('[Sync Students] Sample emails found:', studentsWithEmailsAfter.slice(0, 3).map(s => s.profile?.emailAddress))
    }

    const gcStudents: GoogleClassroomStudent[] = rawGcStudents.map(student => ({
      userId: student.userId || '',
      email: student.profile?.emailAddress || '',
      fullName: student.profile?.name?.fullName || '',
      firstName: student.profile?.name?.givenName || '',
      lastName: student.profile?.name?.familyName || ''
    }))

    console.log(`[Sync Students] Found ${databaseStudents.length} class-specific DB students and ${gcStudents.length} GC students`)

    // Match students by email
    const matched: MatchedStudent[] = []
    const dbOnly: DatabaseStudent[] = []
    const gcOnly: GoogleClassroomStudent[] = []

    // Create email maps for efficient lookup with improved validation
    const dbEmailMap = new Map<string, DatabaseStudent>()
    studentsWithEmails.forEach(student => {
      if (student.email) {
        dbEmailMap.set(student.email.toLowerCase().trim(), student)
      }
    })

    const gcEmailMap = new Map<string, GoogleClassroomStudent>()
    const validGcStudents: Array<{ email: string, name: string }> = []
    const invalidGcStudents: Array<{ email: string, name: string }> = []
    
    gcStudents.forEach(student => {
      if (student.email) {
        const email = student.email.trim()
        if (email) {
          gcEmailMap.set(email.toLowerCase(), student)
          validGcStudents.push({ email, name: student.fullName })
        } else {
          invalidGcStudents.push({ email: student.email, name: student.fullName })
        }
      } else {
        invalidGcStudents.push({ email: 'no email', name: student.fullName })
      }
    })

    console.log(`[Sync Students] Created maps: ${dbEmailMap.size} DB emails, ${gcEmailMap.size} GC emails`)
    if (invalidGcStudents.length > 0) {
      console.warn(`[Sync Students] Found ${invalidGcStudents.length} GC students without valid emails:`, 
        invalidGcStudents.map(s => `${s.name} (${s.email})`))
    }

    // Find matches
    studentsWithEmails.forEach(dbStudent => {
      const gcStudent = gcEmailMap.get(dbStudent.email.toLowerCase().trim())
      if (gcStudent) {
        matched.push({
          student_id: dbStudent.student_id,
          email: dbStudent.email,
          db_name: dbStudent.full_name,
          gc_name: gcStudent.fullName,
          match_type: 'Matched'
        })
      } else {
        dbOnly.push(dbStudent)
      }
    })

    // Add students without emails to dbOnly
    studentsWithoutEmails.forEach(dbStudent => {
      dbOnly.push(dbStudent)
    })

    // Find Google Classroom only students
    gcStudents.forEach(gcStudent => {
      if (gcStudent.email && !dbEmailMap.has(gcStudent.email.toLowerCase().trim())) {
        gcOnly.push(gcStudent)
      }
    })

    const syncResult: SyncResult = {
      matched,
      dbOnly,
      gcOnly,
      totalMatched: matched.length,
      totalDbOnly: dbOnly.length,
      totalGcOnly: gcOnly.length
    }

    console.log(`[Sync Students] Sync preview: ${matched.length} matched, ${dbOnly.length} DB only, ${gcOnly.length} GC only`)

    return NextResponse.json({
      success: true,
      sync: syncResult
    })

  } catch (error) {
    console.error("[Sync Students] Error:", error)
    
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
          error: "Course not found. Please check your selection.",
          details: error.message
        }, { status: 404 })
      }
    }

    return NextResponse.json({ 
      error: "Failed to synchronize students",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
