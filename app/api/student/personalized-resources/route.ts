import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/student/supabaseServer"

// GET - Fetch personalized learning resources for student
export async function GET(request: NextRequest) {
  try {
    // For now, we'll use a mock student ID. In production, this would come from authentication
    const mockStudentId = 1 // This should be replaced with actual student ID from session
    
    console.log('Fetching personalized resources for student:', mockStudentId)
    
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
      .eq('student_id', mockStudentId)
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

    // Step 4: Fetch learning resources that match student's topics
    const topicsArray = Array.from(allTopics)
    const lowPerfTopicsArray = Array.from(lowPerformanceTopics)
    
    let resourcesQuery = supabaseServer
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

    // If we have topics, filter by them
    if (topicsArray.length > 0) {
      console.log('Filtering resources by topics:', topicsArray)
      // Use PostgreSQL array overlap operator to find resources with matching topics
      resourcesQuery = resourcesQuery.overlaps('topics', topicsArray)
    } else {
      console.log('No topics found, fetching all active resources')
    }

    const { data: resources, error: resourcesError } = await resourcesQuery
      .order('created_at', { ascending: false })
      .limit(50)

    if (resourcesError) {
      console.error('Error fetching learning resources:', resourcesError)
      throw resourcesError
    }

    console.log(`Found ${resources?.length || 0} matching learning resources`)

    // Step 5: Score and prioritize resources based on relevance
    const scoredResources = resources?.map((resource: any) => {
      let relevanceScore = 0
      let isLowPerformance = false
      
      // Check if resource topics match student's topics
      if (resource.topics && Array.isArray(resource.topics)) {
        resource.topics.forEach((resourceTopic: string) => {
          if (allTopics.has(resourceTopic)) {
            relevanceScore += 10
            
            // Bonus points for low-performance topics
            if (lowPerformanceTopics.has(resourceTopic)) {
              relevanceScore += 20
              isLowPerformance = true
            }
          }
        })
      }
      
      // If no topic matches but we have resources, give a base score
      if (relevanceScore === 0) {
        relevanceScore = 1
      }
      
      // Add engagement score
      const engagement = (resource.likes || 0) - (resource.dislikes || 0)
      relevanceScore += Math.max(0, engagement / 100)
      
      return {
        ...resource,
        relevanceScore,
        isLowPerformance,
        studentTopics: topicsArray,
        lowPerformanceTopics: lowPerfTopicsArray
      }
    }).filter((resource: any) => resource.relevanceScore > 0) // Only include relevant resources

    console.log(`After scoring: ${scoredResources.length} resources with relevance score > 0`)

    // Step 6: Sort by relevance and randomize within relevance groups
    scoredResources.sort((a: any, b: any) => {
      // First sort by relevance score (descending)
      if (b.relevanceScore !== a.relevanceScore) {
        return b.relevanceScore - a.relevanceScore
      }
      // Then randomize within same relevance score
      return Math.random() - 0.5
    })

    // Step 7: Limit and format response
    const personalizedResources = scoredResources.slice(0, 20).map((resource: any) => ({
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

    return NextResponse.json({
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

  } catch (error) {
    console.error('Error in personalized resources API:', error)
    return NextResponse.json(
      { error: 'Failed to fetch personalized resources: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
