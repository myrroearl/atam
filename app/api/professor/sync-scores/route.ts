import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { google } from "googleapis"
import { createClient } from '@supabase/supabase-js'
import { 
  logGoogleClassroomImport,
  getProfessorAccountId,
  getComponentName,
  getStudentNames,
  type GradeEntryActivityData
} from "@/lib/activity-logger"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API endpoint to synchronize and import scores from Google Classroom
 * Only imports scores for students that exist in both systems
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { class_id, course_id, coursework_id, component_id, grade_period, topics } = body

    if (!class_id || !course_id || !coursework_id || !component_id) {
      return NextResponse.json({ 
        error: "Missing required parameters: class_id, course_id, coursework_id, component_id" 
      }, { status: 400 })
    }

    console.log(`[Sync Scores] Starting score sync for class ${class_id}, coursework ${coursework_id}`)

    // First, let's debug the database query step by step
    console.log('[Sync Scores] Step 1: Testing basic students query...')
    const { data: allStudents, error: allStudentsError } = await supabase
      .from('students')
      .select('student_id, first_name, last_name, account_id')
      .limit(5)

    if (allStudentsError) {
      console.error('[Sync Scores] Basic students query error:', allStudentsError)
    } else {
      console.log(`[Sync Scores] Basic students query returned ${allStudents?.length || 0} students`)
      if (allStudents && allStudents.length > 0) {
        console.log('[Sync Scores] Sample student:', allStudents[0])
      }
    }

    // Test accounts query
    console.log('[Sync Scores] Step 2: Testing accounts query...')
    const { data: allAccounts, error: allAccountsError } = await supabase
      .from('accounts')
      .select('account_id, email, role')
      .eq('role', 'student')
      .limit(5)

    if (allAccountsError) {
      console.error('[Sync Scores] Accounts query error:', allAccountsError)
    } else {
      console.log(`[Sync Scores] Found ${allAccounts?.length || 0} student accounts`)
      if (allAccounts && allAccounts.length > 0) {
        console.log('[Sync Scores] Sample account:', allAccounts[0])
      }
    }

    // Now test the join query - only fetch students from the specific class
    console.log('[Sync Scores] Step 3: Testing join query for class-specific students...')
    
    // First, get the class details to find the section_id
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .select('class_id, section_id')
      .eq('class_id', class_id)
      .single()

    if (classError || !classData) {
      console.error('[Sync Scores] Class query error:', classError)
      return NextResponse.json({ 
        error: "Failed to fetch class details",
        details: classError?.message || 'Class not found'
      }, { status: 500 })
    }

    console.log(`[Sync Scores] Found class with section_id: ${classData.section_id}`)

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
      console.error('[Sync Scores] Join query error:', dbError)
      return NextResponse.json({ 
        error: "Failed to fetch students from database",
        details: dbError.message 
      }, { status: 500 })
    }

    console.log(`[Sync Scores] Class-specific students query returned ${dbStudents?.length || 0} students`)
    if (dbStudents && dbStudents.length > 0) {
      console.log('[Sync Scores] Sample class student:', dbStudents[0])
    }

    const databaseStudents = dbStudents?.map(student => ({
      student_id: student.student_id,
      email: (student.accounts as any)?.email || ''
    })) || []

    // Filter out students without emails and log them
    const studentsWithEmails = databaseStudents.filter(student => student.email)
    const studentsWithoutEmails = databaseStudents.filter(student => !student.email)
    
    if (studentsWithoutEmails.length > 0) {
      console.warn(`[Sync Scores] Found ${studentsWithoutEmails.length} students without email addresses:`, 
        studentsWithoutEmails.map(s => `ID: ${s.student_id}`))
    }

    // Create email to student_id map
    const emailToStudentId = new Map<string, number>()
    studentsWithEmails.forEach(student => {
      if (student.email) {
        emailToStudentId.set(student.email.toLowerCase().trim(), student.student_id)
      }
    })

    console.log(`[Sync Scores] Created email map with ${emailToStudentId.size} valid email addresses`)

    // Fetch scores from Google Classroom with debugging
    console.log('[Sync Scores] Step 4: Setting up Google Classroom API...')
    console.log('[Sync Scores] Access token available:', !!session.accessToken)
    console.log('[Sync Scores] Access token length:', session.accessToken?.length || 0)
    
    const auth = new google.auth.OAuth2()
    auth.setCredentials({ access_token: session.accessToken })
    const classroom = google.classroom({ version: 'v1', auth })

    // Get coursework details
    const courseworkResponse = await classroom.courses.courseWork.get({
      courseId: course_id,
      id: coursework_id
    })

    const coursework = courseworkResponse.data
    console.log(`[Sync Scores] Coursework: ${coursework.title}`)

    // Get student submissions
    const submissionsResponse = await classroom.courses.courseWork.studentSubmissions.list({
      courseId: course_id,
      courseWorkId: coursework_id
    })

    const submissions = submissionsResponse.data.studentSubmissions || []
    console.log(`[Sync Scores] Found ${submissions.length} submissions`)

    // Get students from Google Classroom with debugging
    console.log('[Sync Scores] Step 5: Fetching students from Google Classroom...')
    
    // Method 1: Basic students list
    const studentsResponse = await classroom.courses.students.list({
      courseId: course_id
    })

    let gcStudents = studentsResponse.data.students || []
    console.log(`[Sync Scores] Method 1 - Basic list: ${gcStudents.length} students`)
    
    if (gcStudents.length > 0) {
      console.log('[Sync Scores] Sample GC student:', {
        userId: gcStudents[0].userId,
        email: gcStudents[0].profile?.emailAddress,
        name: gcStudents[0].profile?.name?.fullName,
        hasProfile: !!gcStudents[0].profile,
        hasEmail: !!gcStudents[0].profile?.emailAddress
      })
      
      // Check if any students have emails
      const studentsWithEmailsBasic = gcStudents.filter(s => s.profile?.emailAddress)
      console.log(`[Sync Scores] Students with emails: ${studentsWithEmailsBasic.length}/${gcStudents.length}`)
      
      if (studentsWithEmailsBasic.length > 0) {
        console.log('[Sync Scores] Sample email addresses:', studentsWithEmailsBasic.slice(0, 3).map(s => s.profile?.emailAddress))
      }
    }

    // Method 2: Try to get individual student profiles for emails
    console.log('[Sync Scores] Method 2: Fetching individual student profiles...')
    const enhancedGcStudents = []
    
    for (const student of gcStudents) {
      try {
        // Try to get individual student profile
        const userResponse = await classroom.userProfiles.get({
          userId: student.userId || ''
        })
        
        const userProfile = userResponse.data
        console.log(`[Sync Scores] Individual profile for ${student.userId}:`, {
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
          enhancedGcStudents.push(student)
        }
      } catch (error: any) {
        console.log(`[Sync Scores] Failed to get profile for ${student.userId}:`, error.message)
        enhancedGcStudents.push(student)
      }
    }
    
    gcStudents = enhancedGcStudents
    console.log(`[Sync Scores] Method 2 - After profile fetch: ${gcStudents.length} students`)
    
    // Check if we now have emails
    const studentsWithEmailsAfter = gcStudents.filter(s => s.profile?.emailAddress)
    console.log(`[Sync Scores] Students with emails after profile fetch: ${studentsWithEmailsAfter.length}/${gcStudents.length}`)
    
    if (studentsWithEmailsAfter.length > 0) {
      console.log('[Sync Scores] Sample emails found:', studentsWithEmailsAfter.slice(0, 3).map(s => s.profile?.emailAddress))
    }
    
    // Create user ID to email map with improved validation
    const userIdToEmail = new Map<string, string>()
    const validGcStudents: Array<{ userId: string, email: string }> = []
    const invalidGcStudents: Array<{ userId: string, name: string }> = []
    
    gcStudents.forEach(student => {
      if (student.userId && student.profile?.emailAddress) {
        const email = student.profile.emailAddress.trim()
        if (email) {
          userIdToEmail.set(student.userId, email)
          validGcStudents.push({ userId: student.userId, email })
        } else {
          invalidGcStudents.push({ userId: student.userId, name: student.profile?.name?.fullName || 'Unknown' })
        }
      } else {
        invalidGcStudents.push({ 
          userId: student.userId || 'unknown', 
          name: student.profile?.name?.fullName || 'unknown' 
        })
      }
    })

    console.log(`[Sync Scores] Found ${validGcStudents.length} valid GC students with emails`)
    if (invalidGcStudents.length > 0) {
      console.warn(`[Sync Scores] Found ${invalidGcStudents.length} GC students without valid emails:`, 
        invalidGcStudents.map(s => `${s.name} (${s.userId})`))
    }

    // Debug the email matching process
    console.log('[Sync Scores] Step 6: Email matching analysis...')
    console.log(`[Sync Scores] Database emails (${emailToStudentId.size}):`, Array.from(emailToStudentId.keys()).slice(0, 5))
    console.log(`[Sync Scores] Google Classroom emails (${validGcStudents.length}):`, validGcStudents.slice(0, 5).map(s => s.email))
    
    // Check for potential matches
    let potentialMatches = 0
    for (const gcStudent of validGcStudents) {
      if (emailToStudentId.has(gcStudent.email.toLowerCase().trim())) {
        potentialMatches++
      }
    }
    console.log(`[Sync Scores] Potential email matches found: ${potentialMatches}`)

    // Process submissions and create grade entries for matched students
    const gradeEntries = []
    let matchedCount = 0
    let skippedCount = 0

    for (const submission of submissions) {
      const email = userIdToEmail.get(submission.userId || '')
      if (!email) {
        console.log(`[Sync Scores] Skipping submission ${submission.id} - no email for user ${submission.userId}`)
        continue
      }

      const studentId = emailToStudentId.get(email.toLowerCase().trim())
      if (!studentId) {
        skippedCount++
        console.log(`[Sync Scores] Skipping ${email} - not found in database (checked ${emailToStudentId.size} database emails)`)
        continue
      }

      // Extract score
      let score: number | null = null
      if (submission.assignedGrade !== null && submission.assignedGrade !== undefined) {
        score = submission.assignedGrade
      } else if (submission.draftGrade !== null && submission.draftGrade !== undefined) {
        score = submission.draftGrade
      }

      if (score === null) {
        skippedCount++
        console.log(`[Sync Scores] Skipping ${email} - no score`)
        continue
      }

      // Create grade entry
      const gradeEntry = {
        class_id: parseInt(class_id),
        component_id: parseInt(component_id),
        student_id: studentId,
        score: score,
        max_score: coursework.maxPoints || 100,
        entry_type: 'imported from gclass',
        date_recorded: new Date().toISOString(),
        grade_period: grade_period || null,
        name: coursework.title || null,
        topics: Array.isArray(topics) ? topics : []
      }

      gradeEntries.push(gradeEntry)
      matchedCount++
    }

    console.log(`[Sync Scores] Creating ${gradeEntries.length} grade entries`)

    // Create placeholder entries for students in database but not in Google Classroom
    const studentsWithScores = new Set(gradeEntries.map(entry => entry.student_id))
    const placeholderEntries = []
    
    // Find students who are in the database but don't have scores from Google Classroom
    const studentsNeedingPlaceholders = databaseStudents.filter(student => 
      !studentsWithScores.has(student.student_id)
    )
    
    console.log(`[Sync Scores] Found ${studentsNeedingPlaceholders.length} students needing placeholder entries`)
    
    // Create placeholder entries for students not in Google Classroom
    for (const student of studentsNeedingPlaceholders) {
      const placeholderEntry = {
        class_id: parseInt(class_id),
        component_id: parseInt(component_id),
        student_id: student.student_id,
        score: 0, // Placeholder score - editable
        max_score: coursework.maxPoints || 100,
        entry_type: 'imported from gclass', // Mark as imported so it displays consistently
        date_recorded: new Date().toISOString(),
        grade_period: grade_period || null,
        name: coursework.title || null,
        topics: Array.isArray(topics) ? topics : []
      }
      placeholderEntries.push(placeholderEntry)
    }
    
    console.log(`[Sync Scores] Creating ${placeholderEntries.length} placeholder entries`)

    // Combine all entries
    const allEntries = [...gradeEntries, ...placeholderEntries]
    console.log(`[Sync Scores] Total entries to create: ${allEntries.length} (${gradeEntries.length} with scores + ${placeholderEntries.length} placeholders)`)

    // Insert all grade entries into database
    if (allEntries.length > 0) {
      const { data: insertedEntries, error: insertError } = await supabase
        .from('grade_entries')
        .insert(allEntries)
        .select()

      if (insertError) {
        console.error('[Sync Scores] Insert error:', insertError)
        return NextResponse.json({ 
          error: "Failed to insert grade entries",
          details: insertError.message 
        }, { status: 500 })
      }

      console.log(`[Sync Scores] Successfully inserted ${insertedEntries.length} grade entries`)

      // Log the activity
      try {
        const accountId = await getProfessorAccountId(session)
        const componentName = await getComponentName(parseInt(component_id))
        const studentIds = allEntries.map(entry => entry.student_id)
        const studentNames = await getStudentNames(studentIds)

        if (accountId) {
          const activityData: GradeEntryActivityData = {
            class_id: parseInt(class_id),
            component_id: parseInt(component_id),
            component_name: componentName || undefined,
            grade_period: grade_period || undefined,
            entry_name: coursework.title || 'Google Classroom Import',
            student_count: allEntries.length,
            student_names: studentNames,
            topics: Array.isArray(topics) ? topics : []
          }

          await logGoogleClassroomImport(accountId, activityData)
        }
      } catch (logError) {
        console.error("Failed to log Google Classroom import activity:", logError)
        // Don't fail the request if logging fails
      }

      return NextResponse.json({
        success: true,
        message: `Successfully imported ${matchedCount} scores and created ${placeholderEntries.length} placeholder entries`,
        data: {
          totalSubmissions: submissions.length,
          matchedStudents: matchedCount,
          skippedStudents: skippedCount,
          placeholderEntries: placeholderEntries.length,
          totalEntries: insertedEntries.length,
          courseworkTitle: coursework.title,
          componentId: component_id,
          componentType: coursework.workType || 'score-based'
        }
      })
    } else {
      // Even if no Google Classroom scores, create placeholder entries for all class students
      const placeholderEntries = []
      
      // Create placeholder entries for all students in the class
      for (const student of databaseStudents) {
        const placeholderEntry = {
          class_id: parseInt(class_id),
          component_id: parseInt(component_id),
          student_id: student.student_id,
          score: 0, // Placeholder score - editable
          max_score: coursework.maxPoints || 100,
          entry_type: 'imported from gclass', // Mark as imported so it displays consistently
          date_recorded: new Date().toISOString(),
          grade_period: grade_period || null,
          name: coursework.title || null,
          topics: Array.isArray(topics) ? topics : []
        }
        placeholderEntries.push(placeholderEntry)
      }
      
      if (placeholderEntries.length > 0) {
        const { data: insertedEntries, error: insertError } = await supabase
          .from('grade_entries')
          .insert(placeholderEntries)
          .select()

        if (insertError) {
          console.error('[Sync Scores] Placeholder insert error:', insertError)
          return NextResponse.json({ 
            error: "Failed to insert placeholder grade entries",
            details: insertError.message 
          }, { status: 500 })
        }

        console.log(`[Sync Scores] Successfully inserted ${insertedEntries.length} placeholder entries`)

        // Log the activity
        try {
          const accountId = await getProfessorAccountId(session)
          const componentName = await getComponentName(parseInt(component_id))
          const studentIds = placeholderEntries.map(entry => entry.student_id)
          const studentNames = await getStudentNames(studentIds)

          if (accountId) {
            const activityData: GradeEntryActivityData = {
              class_id: parseInt(class_id),
              component_id: parseInt(component_id),
              component_name: componentName || undefined,
              grade_period: grade_period || undefined,
              entry_name: coursework.title || 'Google Classroom Import (Placeholders)',
              student_count: placeholderEntries.length,
              student_names: studentNames,
              topics: Array.isArray(topics) ? topics : []
            }

            await logGoogleClassroomImport(accountId, activityData)
          }
        } catch (logError) {
          console.error("Failed to log Google Classroom placeholder import activity:", logError)
          // Don't fail the request if logging fails
        }

        return NextResponse.json({
          success: true,
          message: `No Google Classroom scores found, but created ${placeholderEntries.length} placeholder entries for class students`,
          data: {
            totalSubmissions: submissions.length,
            matchedStudents: 0,
            skippedStudents: skippedCount,
            placeholderEntries: placeholderEntries.length,
            totalEntries: insertedEntries.length,
            courseworkTitle: coursework.title,
            componentId: component_id,
            componentType: coursework.workType || 'score-based'
          }
        })
      } else {
        return NextResponse.json({
          success: true,
          message: "No entries to create - no students found",
          data: {
            totalSubmissions: submissions.length,
            matchedStudents: 0,
            skippedStudents: skippedCount,
            placeholderEntries: 0,
            totalEntries: 0
          }
        })
      }
    }

  } catch (error) {
    console.error("[Sync Scores] Error:", error)
    
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
      error: "Failed to synchronize scores",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
