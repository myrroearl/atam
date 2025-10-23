import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Manual sync endpoint for when automatic email matching fails
 * Allows professors to manually map Google Classroom students to database students
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { mappings } = body

    if (!mappings || !Array.isArray(mappings)) {
      return NextResponse.json({ 
        error: "Invalid mappings data" 
      }, { status: 400 })
    }

    console.log(`[Manual Sync] Processing ${mappings.length} manual mappings`)

    const results = []
    
    for (const mapping of mappings) {
      const { gcUserId, gcName, dbStudentId, dbEmail } = mapping
      
      if (!gcUserId || !dbStudentId) {
        results.push({
          success: false,
          error: "Missing required fields",
          mapping
        })
        continue
      }

      try {
        // Verify the database student exists
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select(`
            student_id,
            first_name,
            last_name,
            accounts!inner(email, role)
          `)
          .eq('student_id', dbStudentId)
          .eq('accounts.role', 'student')
          .single()

        if (studentError || !student) {
          results.push({
            success: false,
            error: "Database student not found",
            mapping
          })
          continue
        }

        // Store the mapping (you might want to create a separate table for this)
        // For now, we'll just log it
        console.log(`[Manual Sync] Mapped GC user ${gcUserId} (${gcName}) to DB student ${dbStudentId} (${student.accounts.email})`)
        
        results.push({
          success: true,
          mapping: {
            gcUserId,
            gcName,
            dbStudentId,
            dbEmail: student.accounts.email,
            dbName: `${student.first_name} ${student.last_name}`
          }
        })

      } catch (error) {
        console.error(`[Manual Sync] Error processing mapping:`, error)
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          mapping
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.filter(r => !r.success).length

    console.log(`[Manual Sync] Completed: ${successCount} successful, ${failureCount} failed`)

    return NextResponse.json({
      success: true,
      message: `Manual sync completed: ${successCount} successful, ${failureCount} failed`,
      results,
      summary: {
        total: mappings.length,
        successful: successCount,
        failed: failureCount
      }
    })

  } catch (error) {
    console.error("[Manual Sync] Error:", error)
    return NextResponse.json({ 
      error: "Failed to process manual sync",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * GET endpoint to retrieve students for manual mapping
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log('[Manual Sync] Fetching students for manual mapping')

    // Get all database students
    const { data: dbStudents, error: dbError } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        accounts!inner(email, role)
      `)
      .eq('accounts.role', 'student')

    if (dbError) {
      console.error('[Manual Sync] Database error:', dbError)
      return NextResponse.json({ 
        error: "Failed to fetch database students",
        details: dbError.message 
      }, { status: 500 })
    }

    const students = dbStudents?.map(student => ({
      student_id: student.student_id,
      name: `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`,
      email: student.accounts.email
    })) || []

    console.log(`[Manual Sync] Found ${students.length} database students`)

    return NextResponse.json({
      success: true,
      students,
      total: students.length
    })

  } catch (error) {
    console.error("[Manual Sync] Error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch students for manual mapping",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
