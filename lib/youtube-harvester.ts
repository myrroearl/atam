// YouTube Video Harvesting Module
// Harvests educational YouTube videos based on academic topics from the database

import { 
  searchYouTubeVideos, 
  YouTubeVideo, 
  filterAndSortVideos,
  formatDuration 
} from './youtube-api'

export interface AcademicContext {
  classes: any[]
  gradeEntries: any[]
  subjects: any[]
  topics: string[]
}

export interface HarvestedResource {
  title: string
  description: string
  type: string
  source: string
  url: string
  author: string
  topics: string[]
  tags: string[]
  likes: number
  dislikes: number
  is_active: boolean
}

/**
 * Generate search queries from academic topics
 * Enhances topics with educational keywords for better YouTube search results
 */
function generateSearchQueries(topics: string[], maxQueries: number = 10): string[] {
  const educationalSuffixes = [
    'tutorial lecture',
    'course explained',
    'university lecture',
    'complete guide',
    'fundamentals'
  ]

  const queries: string[] = []

  // Take the most relevant topics
  const selectedTopics = topics.slice(0, maxQueries)

  for (const topic of selectedTopics) {
    // Randomly select a suffix for variety
    const suffix = educationalSuffixes[Math.floor(Math.random() * educationalSuffixes.length)]
    queries.push(`${topic} ${suffix}`)
  }

  return queries
}

/**
 * Harvest educational YouTube videos based on academic context
 * @param academicContext Academic context extracted from database
 * @param videosPerTopic Number of videos to fetch per topic (default: 2)
 * @returns Array of harvested resources formatted for database insertion
 */
export async function harvestYouTubeVideos(
  academicContext: AcademicContext,
  videosPerTopic: number = 2
): Promise<HarvestedResource[]> {
  console.log('[YouTube Harvester] Starting YouTube video harvesting...')
  console.log(`[YouTube Harvester] Academic context: ${academicContext.topics.length} topics identified`)

  if (!academicContext.topics || academicContext.topics.length === 0) {
    console.log('[YouTube Harvester] No topics found, skipping YouTube harvesting')
    return []
  }

  const allVideos: YouTubeVideo[] = []
  const topicToVideos: Map<string, YouTubeVideo[]> = new Map()

  // Generate search queries from topics
  const searchQueries = generateSearchQueries(academicContext.topics, 10)
  console.log(`[YouTube Harvester] Generated ${searchQueries.length} search queries`)

  // Get date 2 years ago for relevancy filter
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  const publishedAfter = twoYearsAgo.toISOString()

  // Process each topic
  for (let i = 0; i < searchQueries.length; i++) {
    const query = searchQueries[i]
    const originalTopic = academicContext.topics[i]

    try {
      console.log(`[YouTube Harvester] [${i + 1}/${searchQueries.length}] Searching: "${query}"`)

      // Search for videos with enhanced parameters
      const videos = await searchYouTubeVideos({
        query: query,
        maxResults: videosPerTopic * 2, // Fetch extra to account for filtering
        publishedAfter: publishedAfter,
        videoDuration: 'medium', // 4-20 minutes
        order: 'relevance'
      })

      if (videos.length > 0) {
        console.log(`[YouTube Harvester] Found ${videos.length} videos for "${originalTopic}"`)
        
        // Filter for educational quality
        const qualityVideos = filterAndSortVideos(videos)
        
        // Take only the best ones
        const topVideos = qualityVideos.slice(0, videosPerTopic)
        
        topicToVideos.set(originalTopic, topVideos)
        allVideos.push(...topVideos)
        
        console.log(`[YouTube Harvester] Selected ${topVideos.length} quality videos`)
      } else {
        console.log(`[YouTube Harvester] No videos found for "${originalTopic}"`)
      }

      // Add delay to respect rate limits (100ms between requests)
      await new Promise(resolve => setTimeout(resolve, 100))

    } catch (error) {
      console.error(`[YouTube Harvester] Error searching for topic "${originalTopic}":`, error)
      // Continue with next topic even if one fails
      continue
    }
  }

  console.log(`[YouTube Harvester] Total videos harvested: ${allVideos.length}`)

  // Deduplicate videos by video ID
  const uniqueVideos = Array.from(
    new Map(allVideos.map(video => [video.videoId, video])).values()
  )

  console.log(`[YouTube Harvester] Unique videos after deduplication: ${uniqueVideos.length}`)

  // Convert to learning resources format
  const harvestedResources: HarvestedResource[] = uniqueVideos.map(video => {
    // Find which topic this video belongs to
    let assignedTopics: string[] = []
    for (const [topic, videos] of topicToVideos.entries()) {
      if (videos.some(v => v.videoId === video.videoId)) {
        assignedTopics.push(topic)
      }
    }

    // If no topic assigned, try to match from title
    if (assignedTopics.length === 0) {
      assignedTopics = academicContext.topics.filter(topic =>
        video.title.toLowerCase().includes(topic.toLowerCase()) ||
        video.description.toLowerCase().includes(topic.toLowerCase())
      )
    }

    // Fallback to general topic
    if (assignedTopics.length === 0) {
      assignedTopics = ['General Education']
    }

    // Generate tags from title and description
    const tags = generateTags(video.title, video.description)

    return {
      title: video.title,
      description: truncateDescription(video.description, 500),
      type: 'video',
      source: 'YouTube',
      url: `https://www.youtube.com/watch?v=${video.videoId}`,
      author: video.channelTitle,
      topics: assignedTopics.slice(0, 5), // Limit to 5 topics
      tags: tags,
      likes: video.likeCount || 0,
      dislikes: 0, // YouTube API no longer provides dislikes
      is_active: true
    }
  })

  console.log(`[YouTube Harvester] Successfully formatted ${harvestedResources.length} resources for database`)

  return harvestedResources
}

/**
 * Truncate description to specified length
 */
function truncateDescription(description: string, maxLength: number): string {
  if (description.length <= maxLength) {
    return description
  }

  const truncated = description.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')

  if (lastSpace > maxLength * 0.8) {
    return description.substring(0, lastSpace) + '...'
  }

  return truncated + '...'
}

/**
 * Generate relevant tags from video title and description
 */
function generateTags(title: string, description: string): string[] {
  const tagKeywords = [
    'tutorial', 'course', 'lecture', 'lesson', 'guide', 'learn',
    'beginner', 'intermediate', 'advanced', 'complete', 'full',
    'programming', 'coding', 'math', 'mathematics', 'science',
    'physics', 'chemistry', 'biology', 'engineering', 'computer',
    'calculus', 'algebra', 'statistics', 'data', 'algorithm'
  ]

  const text = (title + ' ' + description).toLowerCase()
  const foundTags = tagKeywords.filter(keyword => text.includes(keyword))

  // Always include base tags
  const baseTags = ['youtube', 'video', 'educational']

  // Combine and deduplicate
  const allTags = [...new Set([...baseTags, ...foundTags])]

  return allTags.slice(0, 10) // Limit to 10 tags
}

/**
 * Get statistics about harvested videos
 */
export function getHarvestingStats(resources: HarvestedResource[]): {
  totalVideos: number
  totalViews: number
  averageLikes: number
  topTopics: string[]
  topChannels: string[]
} {
  const totalVideos = resources.length
  const totalViews = resources.reduce((sum, r) => sum + (r.likes * 100), 0) // Estimate views
  const averageLikes = totalVideos > 0 
    ? Math.floor(resources.reduce((sum, r) => sum + r.likes, 0) / totalVideos)
    : 0

  // Get top topics
  const topicCounts = new Map<string, number>()
  resources.forEach(r => {
    r.topics.forEach(topic => {
      topicCounts.set(topic, (topicCounts.get(topic) || 0) + 1)
    })
  })
  const topTopics = Array.from(topicCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic)

  // Get top channels
  const channelCounts = new Map<string, number>()
  resources.forEach(r => {
    channelCounts.set(r.author, (channelCounts.get(r.author) || 0) + 1)
  })
  const topChannels = Array.from(channelCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([channel]) => channel)

  return {
    totalVideos,
    totalViews,
    averageLikes,
    topTopics,
    topChannels
  }
}

