import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Debug endpoint to test database queries and identify sync issues
 * This endpoint helps diagnose why email matching might be failing
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "professor") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log('[Debug Sync] Starting comprehensive database analysis...')

    const debugResults: any = {
      timestamp: new Date().toISOString(),
      professor: session.user.email,
      tests: {}
    }

    // Test 1: Basic students table query
    console.log('[Debug Sync] Test 1: Basic students table...')
    const { data: allStudents, error: studentsError } = await supabase
      .from('students')
      .select('student_id, first_name, last_name, account_id')
      .limit(10)

    debugResults.tests.studentsTable = {
      success: !studentsError,
      error: studentsError?.message,
      count: allStudents?.length || 0,
      sample: allStudents?.[0] || null
    }

    // Test 2: Basic accounts table query
    console.log('[Debug Sync] Test 2: Basic accounts table...')
    const { data: allAccounts, error: accountsError } = await supabase
      .from('accounts')
      .select('account_id, email, role, status')
      .limit(10)

    debugResults.tests.accountsTable = {
      success: !accountsError,
      error: accountsError?.message,
      count: allAccounts?.length || 0,
      sample: allAccounts?.[0] || null
    }

    // Test 3: Student accounts only
    console.log('[Debug Sync] Test 3: Student accounts only...')
    const { data: studentAccounts, error: studentAccountsError } = await supabase
      .from('accounts')
      .select('account_id, email, role, status')
      .eq('role', 'student')
      .limit(10)

    debugResults.tests.studentAccounts = {
      success: !studentAccountsError,
      error: studentAccountsError?.message,
      count: studentAccounts?.length || 0,
      sample: studentAccounts?.[0] || null
    }

    // Test 4: Students with account_id
    console.log('[Debug Sync] Test 4: Students with account_id...')
    const { data: studentsWithAccounts, error: studentsWithAccountsError } = await supabase
      .from('students')
      .select('student_id, first_name, last_name, account_id')
      .not('account_id', 'is', null)
      .limit(10)

    debugResults.tests.studentsWithAccounts = {
      success: !studentsWithAccountsError,
      error: studentsWithAccountsError?.message,
      count: studentsWithAccounts?.length || 0,
      sample: studentsWithAccounts?.[0] || null
    }

    // Test 5: Join query (the one used in sync)
    console.log('[Debug Sync] Test 5: Join query (sync method)...')
    const { data: joinedStudents, error: joinError } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        accounts!inner(
          account_id,
          email,
          role
        )
      `)
      .eq('accounts.role', 'student')
      .limit(10)

    debugResults.tests.joinQuery = {
      success: !joinError,
      error: joinError?.message,
      count: joinedStudents?.length || 0,
      sample: joinedStudents?.[0] || null
    }

    // Test 6: Manual join simulation
    console.log('[Debug Sync] Test 6: Manual join simulation...')
    const { data: manualJoin, error: manualJoinError } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        last_name,
        account_id,
        accounts!inner(email, role)
      `)
      .eq('accounts.role', 'student')
      .limit(10)

    debugResults.tests.manualJoin = {
      success: !manualJoinError,
      error: manualJoinError?.message,
      count: manualJoin?.length || 0,
      sample: manualJoin?.[0] || null
    }

    // Test 7: Check for orphaned records
    console.log('[Debug Sync] Test 7: Checking for orphaned records...')
    const { data: orphanedStudents, error: orphanedError } = await supabase
      .from('students')
      .select('student_id, first_name, last_name, account_id')
      .not('account_id', 'is', null)
      .limit(100)

    const { data: allAccountIds, error: accountIdsError } = await supabase
      .from('accounts')
      .select('account_id')
      .eq('role', 'student')

    const orphanedCount = orphanedStudents?.filter(student => 
      !allAccountIds?.some(account => account.account_id === student.account_id)
    ).length || 0

    debugResults.tests.orphanedRecords = {
      orphanedStudents: orphanedCount,
      totalStudentsWithAccountId: orphanedStudents?.length || 0,
      totalStudentAccounts: allAccountIds?.length || 0
    }

    // Test 8: Email format analysis
    console.log('[Debug Sync] Test 8: Email format analysis...')
    const { data: emails, error: emailsError } = await supabase
      .from('accounts')
      .select('email')
      .eq('role', 'student')
      .not('email', 'is', null)
      .limit(20)

    const emailAnalysis = {
      total: emails?.length || 0,
      withEmails: emails?.filter(e => e.email && e.email.trim()).length || 0,
      emptyEmails: emails?.filter(e => !e.email || !e.email.trim()).length || 0,
      sampleEmails: emails?.slice(0, 5).map(e => e.email) || []
    }

    debugResults.tests.emailAnalysis = emailAnalysis

    console.log('[Debug Sync] Analysis complete')

    return NextResponse.json({
      success: true,
      debug: debugResults,
      summary: {
        totalTests: Object.keys(debugResults.tests).length,
        successfulTests: Object.values(debugResults.tests).filter((test: any) => test.success !== false).length,
        databaseConnection: !studentsError && !accountsError,
        hasStudents: (allStudents?.length || 0) > 0,
        hasStudentAccounts: (studentAccounts?.length || 0) > 0,
        joinQueryWorks: !joinError && (joinedStudents?.length || 0) > 0
      }
    })

  } catch (error) {
    console.error("[Debug Sync] Error:", error)
    return NextResponse.json({ 
      error: "Failed to run debug analysis",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
