import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * API endpoint to fetch comprehensive student profile data
 * Includes topic-based performance from grade_entries, attendance, and analytics
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[Student Profile] API endpoint called')
    
    const session = await getServerSession(authOptions)
    console.log('[Student Profile] Session:', session ? 'Found' : 'Not found')

    if (!session || session.user.role !== "professor") {
      console.log('[Student Profile] Unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('student_id')
    console.log('[Student Profile] Student ID:', studentId)

    if (!studentId) {
      return NextResponse.json({ error: "Student ID is required" }, { status: 400 })
    }

    console.log(`[Student Profile] Fetching data for student ${studentId}`)

    // Fetch student basic information
    console.log('[Student Profile] Querying students table for student_id:', studentId)
    const { data: studentInfo, error: studentError } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        account_id
      `)
      .eq('student_id', studentId)
      .single()

    console.log('[Student Profile] Student query result:', { studentInfo, studentError })

    if (studentError || !studentInfo) {
      console.error('[Student Profile] Student not found:', studentError)
      return NextResponse.json({ 
        error: "Student not found",
        details: studentError?.message 
      }, { status: 404 })
    }

    // Fetch student email separately
    const { data: accountInfo, error: accountError } = await supabase
      .from('accounts')
      .select('email')
      .eq('account_id', studentInfo.account_id)
      .single()

    console.log('[Student Profile] Account query result:', { accountInfo, accountError })

    // Fetch grade entries for this student grouped by topics
    console.log('[Student Profile] Querying grade_entries table for student_id:', studentId)
    const { data: gradeEntries, error: gradesError } = await supabase
      .from('grade_entries')
      .select(`
        grade_id,
        score,
        max_score,
        attendance,
        entry_type,
        date_recorded,
        grade_period,
        name,
        component_id,
        topics
      `)
      .eq('student_id', studentId)
      .order('date_recorded', { ascending: true })

    console.log('[Student Profile] Grade entries query result:', { 
      count: gradeEntries?.length || 0, 
      error: gradesError 
    })

    if (gradesError) {
      console.error('[Student Profile] Error fetching grades:', gradesError)
      return NextResponse.json({ 
        error: "Failed to fetch grade entries",
        details: gradesError.message 
      }, { status: 500 })
    }

    // Process grade entries to extract topics and calculate performance
    const topicsMap = new Map<string, {
      topic: string
      totalScore: number
      totalMaxScore: number
      entries: any[]
      average: number
      trend: 'up' | 'down' | 'stable'
      lastScore?: number
      previousScore?: number
    }>()

    // Group entries by topics from the topics array column
    gradeEntries?.forEach(entry => {
      // Get topics from the topics array column
      const entryTopics = entry.topics || []
      
      // Only process entries that have topics in the topics array
      if (entryTopics.length > 0) {
        // Process each topic in the topics array
        entryTopics.forEach((topicName: string) => {
          if (!topicsMap.has(topicName)) {
            topicsMap.set(topicName, {
              topic: topicName,
              totalScore: 0,
              totalMaxScore: 0,
              entries: [],
              average: 0,
              trend: 'stable'
            })
          }

          const topicData = topicsMap.get(topicName)!
          
          // Check if this is an attendance entry by looking at the attendance field
          if (entry.attendance !== null && entry.attendance !== undefined) {
            // Handle attendance
            const score = entry.attendance === 'present' ? 10 : entry.attendance === 'late' ? 5 : 0
            topicData.totalScore += score
            topicData.totalMaxScore += 10
          } else {
            // Handle regular scores
            topicData.totalScore += entry.score || 0
            topicData.totalMaxScore += entry.max_score || 100
          }
          
          topicData.entries.push(entry)
        })
      }
    })

    // Calculate averages and trends for each topic
    const topics = Array.from(topicsMap.values()).map(topicData => {
      topicData.average = topicData.totalMaxScore > 0 
        ? Math.round((topicData.totalScore / topicData.totalMaxScore) * 100)
        : 0

      // Calculate trend based on recent entries
      if (topicData.entries.length >= 2) {
        const sortedEntries = topicData.entries.sort((a, b) => 
          new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime()
        )
        
        const recentEntry = sortedEntries[0]
        const previousEntry = sortedEntries[1]
        
        let recentScore = 0
        let previousScore = 0
        
        if (recentEntry.attendance !== null && recentEntry.attendance !== undefined) {
          recentScore = recentEntry.attendance === 'present' ? 100 : recentEntry.attendance === 'late' ? 50 : 0
        } else {
          recentScore = recentEntry.max_score > 0 ? (recentEntry.score / recentEntry.max_score) * 100 : 0
        }
        
        if (previousEntry.attendance !== null && previousEntry.attendance !== undefined) {
          previousScore = previousEntry.attendance === 'present' ? 100 : previousEntry.attendance === 'late' ? 50 : 0
        } else {
          previousScore = previousEntry.max_score > 0 ? (previousEntry.score / previousEntry.max_score) * 100 : 0
        }
        
        topicData.lastScore = recentScore
        topicData.previousScore = previousScore
        
        if (recentScore > previousScore + 5) {
          topicData.trend = 'up'
        } else if (recentScore < previousScore - 5) {
          topicData.trend = 'down'
        } else {
          topicData.trend = 'stable'
        }
      }

      return topicData
    })

    // Calculate overall performance trends by date
    const performanceTrends: Array<{
      date: string
      average: number
      entries: number
    }> = []
    const dateGroups = new Map<string, any[]>()
    
    gradeEntries?.forEach(entry => {
      if (entry.date_recorded) {
        const date = new Date(entry.date_recorded).toISOString().split('T')[0]
        if (!dateGroups.has(date)) {
          dateGroups.set(date, [])
        }
        dateGroups.get(date)!.push(entry)
      }
    })

    // Calculate daily averages
    const sortedDates = Array.from(dateGroups.keys()).sort()
    sortedDates.forEach(date => {
      const dayEntries = dateGroups.get(date) || []
      let totalScore = 0
      let totalMaxScore = 0
      
      dayEntries.forEach(entry => {
        if (entry.attendance !== null && entry.attendance !== undefined) {
          const score = entry.attendance === 'present' ? 10 : entry.attendance === 'late' ? 5 : 0
          totalScore += score
          totalMaxScore += 10
        } else {
          totalScore += entry.score || 0
          totalMaxScore += entry.max_score || 100
        }
      })
      
      const average = totalMaxScore > 0 ? Math.round((totalScore / totalMaxScore) * 100) : 0
      performanceTrends.push({
        date,
        average,
        entries: dayEntries.length
      })
    })

    // Calculate attendance statistics
    const attendanceEntries = gradeEntries?.filter(entry => 
      entry.attendance !== null && entry.attendance !== undefined
    ) || []
    
    const attendanceStats = {
      totalDays: attendanceEntries.length,
      present: attendanceEntries.filter(e => e.attendance === 'present').length,
      late: attendanceEntries.filter(e => e.attendance === 'late').length,
      absent: attendanceEntries.filter(e => e.attendance === 'absent').length,
      attendanceRate: 0
    }
    
    if (attendanceStats.totalDays > 0) {
      attendanceStats.attendanceRate = Math.round(
        ((attendanceStats.present + attendanceStats.late * 0.5) / attendanceStats.totalDays) * 100
      )
    }

    // Calculate overall average
    const overallAverage = topics.length > 0 
      ? Math.round(topics.reduce((sum, topic) => sum + topic.average, 0) / topics.length)
      : 0

    // Prepare skills mastery based on topics
    const skillsMastery = {
      mastered: topics.filter(t => t.average >= 90).map(t => t.topic),
      developing: topics.filter(t => t.average >= 70 && t.average < 90).map(t => t.topic),
      needsImprovement: topics.filter(t => t.average < 70).map(t => t.topic)
    }

    const studentData = {
      student_id: studentInfo.student_id,
      name: `${studentInfo.first_name} ${studentInfo.middle_name ? studentInfo.middle_name + ' ' : ''}${studentInfo.last_name}`,
      email: accountInfo?.email || '',
      overallAverage,
      topics,
      performanceTrends,
      attendanceStats,
      skillsMastery,
      totalEntries: gradeEntries?.length || 0,
      lastUpdated: new Date().toISOString(),
      gradeEntries: gradeEntries || []
    }

    console.log(`[Student Profile] Successfully processed data for student ${studentId}:`, {
      topicsCount: topics.length,
      totalEntries: gradeEntries?.length || 0,
      overallAverage,
      performanceTrendsCount: performanceTrends.length
    })

    return NextResponse.json({
      success: true,
      student: studentData
    })

  } catch (error) {
    console.error("[Student Profile] Error:", error)
    return NextResponse.json({ 
      error: "Failed to fetch student profile data",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
