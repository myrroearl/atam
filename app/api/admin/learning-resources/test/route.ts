import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/student/supabaseServer"

// GET - Test endpoint to verify database connection and table structure
export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection and table structure...')
    
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Test 1: Basic Supabase connection
    try {
      const { data: testData, error: testError } = await supabaseServer
        .from('learning_resources')
        .select('count')
        .limit(1)
      
      testResults.tests.supabaseConnection = {
        success: !testError,
        error: testError?.message,
        hasData: !!testData
      }
    } catch (error) {
      testResults.tests.supabaseConnection = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 2: Check year_level table structure
    try {
      const { data: yearLevels, error: yearLevelError } = await supabaseServer
        .from('year_level')
        .select('year_level_id, name')
        .limit(3)

      testResults.tests.yearLevelTable = {
        success: !yearLevelError,
        error: yearLevelError?.message,
        count: yearLevels?.length || 0,
        sample: yearLevels?.[0] || null
      }
    } catch (error) {
      testResults.tests.yearLevelTable = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 3: Check classes table with correct join
    try {
      const { data: classes, error: classesError } = await supabaseServer
        .from('classes')
        .select(`
          class_id,
          class_name,
          subjects (
            subject_id,
            subject_code,
            subject_name,
            year_level (name)
          )
        `)
        .limit(3)

      testResults.tests.classesWithYearLevel = {
        success: !classesError,
        error: classesError?.message,
        count: classes?.length || 0,
        sample: classes?.[0] || null
      }
    } catch (error) {
      testResults.tests.classesWithYearLevel = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 4: Check grade_entries table
    try {
      const { data: gradeEntries, error: gradeEntriesError } = await supabaseServer
        .from('grade_entries')
        .select('grade_id, score, max_score')
        .limit(3)

      testResults.tests.gradeEntriesTable = {
        success: !gradeEntriesError,
        error: gradeEntriesError?.message,
        count: gradeEntries?.length || 0,
        sample: gradeEntries?.[0] || null
      }
    } catch (error) {
      testResults.tests.gradeEntriesTable = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    console.log('Database tests completed')

    return NextResponse.json({
      success: true,
      debug: testResults,
      summary: {
        totalTests: Object.keys(testResults.tests).length,
        successfulTests: Object.values(testResults.tests).filter((test: any) => test.success !== false).length,
        supabaseWorking: testResults.tests.supabaseConnection?.success,
        yearLevelTableWorking: testResults.tests.yearLevelTable?.success,
        classesJoinWorking: testResults.tests.classesWithYearLevel?.success,
        gradeEntriesWorking: testResults.tests.gradeEntriesTable?.success
      }
    })

  } catch (error) {
    console.error("[Test] Error:", error)
    return NextResponse.json({ 
      error: "Failed to run database tests",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
