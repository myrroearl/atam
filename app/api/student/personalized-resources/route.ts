import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

// GET - Fetch personalized learning resources for student
export async function GET(request: NextRequest) {
  try {
    // Get authenticated student
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student ID from database
    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id")
      .eq("account_id", Number(session.user.account_id))
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    const studentId = student.student_id
    console.log('Fetching personalized resources for student:', studentId)
    
    // Step 1: Get student's grade entries with topics and performance data
    const { data: gradeEntries, error: gradeEntriesError } = await supabaseServer
      .from('grade_entries')
      .select(`
        grade_id,
        score,
        max_score,
        topics,
        name,
        date_recorded,
        classes (
          class_name,
          subjects (subject_name, subject_code)
        )
      `)
      .eq('student_id', studentId)
      .not('topics', 'is', null)
      .order('date_recorded', { ascending: false })
      .limit(100)

    if (gradeEntriesError) {
      console.error('Error fetching grade entries:', gradeEntriesError)
      throw gradeEntriesError
    }

    console.log(`Found ${gradeEntries?.length || 0} grade entries for student`)

    // Step 2: Extract topics from grade entries and identify low-performing areas
    const allTopics = new Set<string>()
    const lowPerformanceTopics = new Set<string>()
    const topicPerformanceMap = new Map<string, { total: number, count: number }>()

    gradeEntries?.forEach((entry: any) => {
      if (entry.topics && Array.isArray(entry.topics)) {
        entry.topics.forEach((topic: string) => {
          if (topic && topic.trim()) {
            allTopics.add(topic.trim())
            
            // Calculate performance for this topic
            if (entry.score !== null && entry.max_score !== null && entry.max_score > 0) {
              const percentage = (Number(entry.score) / Number(entry.max_score)) * 100
              
              if (!topicPerformanceMap.has(topic)) {
                topicPerformanceMap.set(topic, { total: 0, count: 0 })
              }
              
              const perf = topicPerformanceMap.get(topic)!
              perf.total += percentage
              perf.count += 1
            }
          }
        })
      }
      
      if (entry.name && entry.name.trim()) {
        allTopics.add(entry.name.trim())
      }
    })

    // Step 3: Identify low-performing topics (below 70% average)
    topicPerformanceMap.forEach((perf, topic) => {
      const average = perf.total / perf.count
      if (average < 70) {
        lowPerformanceTopics.add(topic)
      }
    })

    console.log(`Extracted ${allTopics.size} topics, ${lowPerformanceTopics.size} low-performance topics`)
    console.log('Student topics:', Array.from(allTopics))

    // Step 4: Fetch ALL learning resources applicable to students
    const topicsArray = Array.from(allTopics)
    const lowPerfTopicsArray = Array.from(lowPerformanceTopics)
    
    console.log('Fetching all active learning resources for students')
    
    const { data: resources, error: resourcesError } = await supabaseServer
      .from('learning_resources')
      .select(`
        id,
        title,
        description,
        type,
        source,
        url,
        author,
        topics,
        tags,
        likes,
        dislikes,
        is_active
      `)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      // Remove limit to get ALL resources

    if (resourcesError) {
      console.error('Error fetching learning resources:', resourcesError)
      throw resourcesError
    }

    console.log(`Found ${resources?.length || 0} matching learning resources`)

    // Step 5: Score and prioritize ALL resources based on relevance
    const scoredResources = resources?.map((resource: any) => {
      let relevanceScore = 5 // Base score for all resources
      let isLowPerformance = false
      
      // Check if resource topics match student's topics
      if (resource.topics && Array.isArray(resource.topics)) {
        resource.topics.forEach((resourceTopic: string) => {
          if (allTopics.has(resourceTopic)) {
            relevanceScore += 15 // Higher bonus for topic matches
            
            // Extra bonus points for low-performance topics
            if (lowPerformanceTopics.has(resourceTopic)) {
              relevanceScore += 25
              isLowPerformance = true
            }
          }
        })
      }
      
      // Add engagement score based on likes/dislikes
      const engagement = (resource.likes || 0) - (resource.dislikes || 0)
      relevanceScore += Math.max(0, engagement / 50) // Reduced divisor for more impact
      
      // Add variety bonus for different resource types
      const typeBonus = {
        'video': 2,
        'course': 3,
        'book': 2,
        'article': 1,
        'document': 1
      }
      relevanceScore += typeBonus[resource.type as keyof typeof typeBonus] || 1
      
      return {
        ...resource,
        relevanceScore,
        isLowPerformance,
        studentTopics: topicsArray,
        lowPerformanceTopics: lowPerfTopicsArray
      }
    }) || [] // Include ALL resources, no filtering

    console.log(`After scoring: ${scoredResources.length} resources with relevance score > 0`)

    // Step 6: Sort by relevance and randomize within relevance groups
    scoredResources.sort((a: any, b: any) => {
      // First sort by relevance score (descending)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      // Then randomize within same relevance score for fresh content on each load
      return Math.random() - 0.5
    })

    // Step 7: Create a mix of highly relevant and diverse resources
    const highlyRelevant = scoredResources
      .filter((r: any) => r.relevanceScore >= 20) // High relevance resources
      .sort(() => Math.random() - 0.5) // Randomize within high relevance
    
    const diverseResources = scoredResources
      .filter((r: any) => r.relevanceScore < 20) // Other resources
      .sort(() => Math.random() - 0.5) // Randomize for variety
    
    // Mix 70% highly relevant with 30% diverse resources
    const mixedResources = [
      ...highlyRelevant.slice(0, Math.ceil(highlyRelevant.length * 0.7)),
      ...diverseResources.slice(0, Math.ceil(diverseResources.length * 0.3))
    ].sort(() => Math.random() - 0.5) // Final shuffle for variety
    
    // Step 8: Format response - return more resources for better pagination
    const personalizedResources = mixedResources.map((resource: any) => ({
      id: resource.id,
      title: resource.title,
      description: resource.description,
      type: resource.type,
      source: resource.source,
      url: resource.url,
      author: resource.author,
      topics: resource.topics || [],
      tags: resource.tags || [],
      likes: resource.likes || 0,
      dislikes: resource.dislikes || 0,
      relevanceScore: resource.relevanceScore,
      isLowPerformance: resource.isLowPerformance
    }))

    const response = NextResponse.json({
      resources: personalizedResources,
      studentTopics: topicsArray,
      lowPerformanceTopics: lowPerfTopicsArray,
      totalResources: resources?.length || 0,
      relevantResources: scoredResources.length,
      performanceStats: {
        totalTopics: allTopics.size,
        lowPerformanceTopics: lowPerformanceTopics.size,
        averageScore: topicPerformanceMap.size > 0 
          ? Array.from(topicPerformanceMap.values()).reduce((sum, perf) => sum + (perf.total / perf.count), 0) / topicPerformanceMap.size
          : 0
      }
    })

    // Add cache control headers to prevent caching and ensure fresh content
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('Surrogate-Control', 'no-store')

    return response

  } catch (error) {
    console.error('Error in personalized resources API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personalized resources: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
