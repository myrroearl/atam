import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ 
        error: "Current password and new password are required" 
      }, { status: 400 })
    }

    // Validate password length
    if (newPassword.length < 6) {
      return NextResponse.json({ 
        error: "New password must be at least 6 characters long" 
      }, { status: 400 })
    }

    // Get current password hash from accounts table
    const { data: account, error: accountError } = await supabaseServer
      .from('accounts')
      .select('password_hash')
      .eq('account_id', session.user.account_id)
      .single()

    if (accountError || !account) {
      console.error("Account fetch error:", accountError)
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    // Compare passwords (plain text comparison for now)
    // TODO: Implement proper password hashing comparison
    if (account.password_hash !== currentPassword) {
      return NextResponse.json({ 
        error: "Current password is incorrect" 
      }, { status: 400 })
    }

    // Update password in accounts table
    // TODO: Hash the new password before storing
    const { error: updateError } = await supabaseServer
      .from('accounts')
      .update({ 
        password_hash: newPassword, // TODO: Hash this password
        updated_at: new Date().toISOString()
      })
      .eq('account_id', session.user.account_id)

    if (updateError) {
      console.error("Password update error:", updateError)
      return NextResponse.json({ error: "Failed to update password" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Password updated successfully"
    })
  } catch (error) {
    console.error("Password update API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get current student
    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id")
      .eq("account_id", session.user.account_id)
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    // Fetch all grade entries for the student with topic and subject information
    const { data: gradeEntries, error: entriesError } = await supabaseServer
      .from("grade_entries")
      .select(`
        grade_id,
        score,
        max_score,
        name,
        topic,
        classes:class_id (
          subject_id,
          subjects:subject_id (
            subject_name,
            subject_code,
            units
          )
        )
      `)
      .eq("student_id", student.student_id)
      .not("score", "is", null)
      .not("max_score", "is", null)
      .order("date_recorded", { ascending: false })

    if (entriesError) {
      console.error("Grade entries fetch error:", entriesError)
      
      // If the error is about the topic column not existing, try without it
      if (entriesError.message?.includes('column grade_entries.topic does not exist')) {
        console.log("Topic column not found, fetching without topic information...")
        
        // Fetch without topic column
        const { data: fallbackEntries, error: fallbackError } = await supabaseServer
          .from("grade_entries")
          .select(`
            grade_id,
            score,
            max_score,
            name,
            classes:class_id (
              subject_id,
              subjects:subject_id (
                subject_name,
                subject_code,
                units
              )
            )
          `)
          .eq("student_id", student.student_id)
          .not("score", "is", null)
          .not("max_score", "is", null)
          .order("date_recorded", { ascending: false })

        if (fallbackError) {
          console.error("Fallback fetch error:", fallbackError)
          return NextResponse.json({ error: "Failed to fetch grade entries" }, { status: 500 })
        }

        // Process without topic information
        return NextResponse.json({
          subjectAnalysis: [],
          overallStats: {
            totalTopics: 0,
            strengthsCount: 0,
            weaknessesCount: 0,
            averagePerformance: 0,
            message: "Topic analysis not available - topic column not found in database"
          }
        })
      }
      
      return NextResponse.json({ error: "Failed to fetch grade entries" }, { status: 500 })
    }

    if (!gradeEntries || gradeEntries.length === 0) {
      return NextResponse.json({
        subjectAnalysis: [],
        overallStats: {
          totalTopics: 0,
          strengthsCount: 0,
          weaknessesCount: 0,
          averagePerformance: 0
        }
      })
    }

    // Group entries by subject and topic
    const subjectTopicMap: Record<string, Record<string, any[]>> = {}
    
    gradeEntries.forEach(entry => {
      const subjectName = (entry.classes as any)?.subjects?.subject_name || 'Unknown Subject'
      const topic = entry.topic || 'General Assessment'
      
      // Skip entries without valid subject information
      if (!subjectName || subjectName === 'Unknown Subject') {
        return
      }
      
      if (!subjectTopicMap[subjectName]) {
        subjectTopicMap[subjectName] = {}
      }
      
      if (!subjectTopicMap[subjectName][topic]) {
        subjectTopicMap[subjectName][topic] = []
      }
      
      subjectTopicMap[subjectName][topic].push(entry)
    })

    // Calculate topic performance for each subject
    const subjectAnalysis: Array<{
      subject_name: string
      subject_code: string
      units: number
      topics: Array<{
        topic_name: string
        average_score: number
        total_assessments: number
        assessments: Array<{
          name: string
          score: number
          max_score: number
          percentage: number
        }>
      }>
      strengths: Array<{
        topic_name: string
        average_score: number
      }>
      weaknesses: Array<{
        topic_name: string
        average_score: number
      }>
      overall_performance: number
    }> = []

    Object.entries(subjectTopicMap).forEach(([subjectName, topicMap]) => {
      const subjectInfo = Object.values(topicMap)[0]?.[0]
      const subjectCode = (subjectInfo?.classes as any)?.subjects?.subject_code || ''
      const units = Number((subjectInfo?.classes as any)?.subjects?.units) || 0

      const topics: Array<{
        topic_name: string
        average_score: number
        total_assessments: number
        assessments: Array<{
          name: string
          score: number
          max_score: number
          percentage: number
        }>
      }> = []

      const strengths: Array<{ topic_name: string; average_score: number }> = []
      const weaknesses: Array<{ topic_name: string; average_score: number }> = []

      Object.entries(topicMap).forEach(([topicName, entries]) => {
        // Calculate average percentage score for this topic
        const totalScore = entries.reduce((sum, entry) => sum + Number(entry.score), 0)
        const totalMaxScore = entries.reduce((sum, entry) => sum + Number(entry.max_score), 0)
        const averageScore = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0

        const assessments = entries.map(entry => ({
          name: entry.name || 'Assessment',
          score: Number(entry.score),
          max_score: Number(entry.max_score),
          percentage: Number(entry.max_score) > 0 ? (Number(entry.score) / Number(entry.max_score)) * 100 : 0
        }))

        const topicData = {
          topic_name: topicName,
          average_score: Math.round(averageScore * 100) / 100,
          total_assessments: entries.length,
          assessments
        }

        topics.push(topicData)

        // Categorize as strength or weakness
        if (averageScore >= 85) {
          strengths.push({
            topic_name: topicName,
            average_score: Math.round(averageScore * 100) / 100
          })
        } else if (averageScore < 75) {
          weaknesses.push({
            topic_name: topicName,
            average_score: Math.round(averageScore * 100) / 100
          })
        }
      })

      // Sort topics by average score (descending)
      topics.sort((a, b) => b.average_score - a.average_score)
      strengths.sort((a, b) => b.average_score - a.average_score)
      weaknesses.sort((a, b) => a.average_score - b.average_score)

      // Calculate overall performance for the subject
      const overallPerformance = topics.length > 0 
        ? topics.reduce((sum, topic) => sum + topic.average_score, 0) / topics.length
        : 0

      subjectAnalysis.push({
        subject_name: subjectName,
        subject_code: subjectCode,
        units,
        topics,
        strengths,
        weaknesses,
        overall_performance: Math.round(overallPerformance * 100) / 100
      })
    })

    // Sort subjects by overall performance (descending)
    subjectAnalysis.sort((a, b) => b.overall_performance - a.overall_performance)

    // Calculate overall statistics
    const allTopics = subjectAnalysis.flatMap(subject => subject.topics)
    const totalTopics = allTopics.length
    const strengthsCount = subjectAnalysis.reduce((sum, subject) => sum + subject.strengths.length, 0)
    const weaknessesCount = subjectAnalysis.reduce((sum, subject) => sum + subject.weaknesses.length, 0)
    const averagePerformance = totalTopics > 0 
      ? allTopics.reduce((sum, topic) => sum + topic.average_score, 0) / totalTopics
      : 0

    return NextResponse.json({
      subjectAnalysis,
      overallStats: {
        totalTopics,
        strengthsCount,
        weaknessesCount,
        averagePerformance: Math.round(averagePerformance * 100) / 100
      }
    })

  } catch (err) {
    console.error("Topic performance API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}