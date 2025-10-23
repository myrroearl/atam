// YouTube Data API v3 Service
// This module handles all YouTube API interactions for harvesting educational videos

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3'

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  channelTitle: string
  channelId: string
  publishedAt: string
  thumbnailUrl: string
  duration: string
  viewCount: number
  likeCount: number
  commentCount: number
}

export interface YouTubeSearchParams {
  query: string
  maxResults?: number
  publishedAfter?: string
  videoDuration?: 'short' | 'medium' | 'long' | 'any'
  order?: 'relevance' | 'date' | 'rating' | 'viewCount'
}

/**
 * Search for educational videos on YouTube
 * @param params Search parameters
 * @returns Array of video IDs and basic info
 */
export async function searchYouTubeVideos(
  params: YouTubeSearchParams
): Promise<YouTubeVideo[]> {
  try {
    if (!YOUTUBE_API_KEY) {
      console.error('YouTube API key is not configured')
      return []
    }

    const { 
      query, 
      maxResults = 10,
      publishedAfter,
      videoDuration = 'medium', // 4-20 minutes
      order = 'relevance'
    } = params

    console.log(`[YouTube API] Searching for: "${query}"`)

    // Step 1: Search for videos
    const searchParams = new URLSearchParams({
      key: YOUTUBE_API_KEY,
      part: 'snippet',
      q: query,
      type: 'video',
      videoCategoryId: '27', // Education category
      maxResults: maxResults.toString(),
      order: order,
      videoDuration: videoDuration,
      relevanceLanguage: 'en',
      safeSearch: 'strict'
    })

    if (publishedAfter) {
      searchParams.append('publishedAfter', publishedAfter)
    }

    const searchUrl = `${YOUTUBE_BASE_URL}/search?${searchParams.toString()}`
    const searchResponse = await fetch(searchUrl)

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json()
      console.error('[YouTube API] Search error:', errorData)
      return []
    }

    const searchData = await searchResponse.json()

    if (!searchData.items || searchData.items.length === 0) {
      console.log(`[YouTube API] No videos found for query: "${query}"`)
      return []
    }

    console.log(`[YouTube API] Found ${searchData.items.length} videos`)

    // Step 2: Get detailed information for each video
    const videoIds = searchData.items.map((item: any) => item.id.videoId).join(',')
    const detailsUrl = `${YOUTUBE_BASE_URL}/videos?key=${YOUTUBE_API_KEY}&part=snippet,statistics,contentDetails&id=${videoIds}`

    const detailsResponse = await fetch(detailsUrl)

    if (!detailsResponse.ok) {
      const errorData = await detailsResponse.json()
      console.error('[YouTube API] Details error:', errorData)
      return []
    }

    const detailsData = await detailsResponse.json()

    // Step 3: Format the data
    const videos: YouTubeVideo[] = detailsData.items.map((video: any) => ({
      videoId: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelTitle: video.snippet.channelTitle,
      channelId: video.snippet.channelId,
      publishedAt: video.snippet.publishedAt,
      thumbnailUrl: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
      duration: video.contentDetails.duration,
      viewCount: parseInt(video.statistics.viewCount || '0'),
      likeCount: parseInt(video.statistics.likeCount || '0'),
      commentCount: parseInt(video.statistics.commentCount || '0')
    }))

    console.log(`[YouTube API] Successfully retrieved ${videos.length} video details`)
    return videos

  } catch (error) {
    console.error('[YouTube API] Error searching videos:', error)
    return []
  }
}

/**
 * Convert ISO 8601 duration (PT4M13S) to seconds
 * @param isoDuration ISO duration string
 * @returns Duration in seconds
 */
export function formatDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0

  const hours = parseInt(match[1] || '0')
  const minutes = parseInt(match[2] || '0')
  const seconds = parseInt(match[3] || '0')

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Format duration in seconds to human-readable format
 * @param seconds Duration in seconds
 * @returns Formatted duration (e.g., "4m 13s", "1h 23m")
 */
export function formatDurationHuman(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`
  } else {
    return `${secs}s`
  }
}

/**
 * Check if a video is suitable for educational purposes
 * @param video YouTube video data
 * @returns true if video meets educational criteria
 */
export function isEducationalVideo(video: YouTubeVideo): boolean {
  // Educational keywords to look for
  const educationalKeywords = [
    'tutorial', 'course', 'lecture', 'lesson', 'learn', 'education',
    'university', 'college', 'academic', 'study', 'explain', 'guide',
    'introduction', 'beginner', 'advanced', 'master', 'complete',
    'programming', 'mathematics', 'science', 'engineering', 'physics',
    'chemistry', 'biology', 'calculus', 'algebra', 'statistics'
  ]

  // Spam/low-quality keywords to avoid
  const spamKeywords = [
    'click here', 'subscribe now', 'free download', 'hack', 'cheat',
    'get rich', 'make money fast', 'secret trick', 'shocking'
  ]

  const titleLower = video.title.toLowerCase()
  const descriptionLower = video.description.toLowerCase()

  // Check for spam keywords
  const hasSpam = spamKeywords.some(keyword =>
    titleLower.includes(keyword) || descriptionLower.includes(keyword)
  )

  if (hasSpam) {
    return false
  }

  // Check for educational keywords
  const hasEducationalContent = educationalKeywords.some(keyword =>
    titleLower.includes(keyword) || descriptionLower.includes(keyword)
  )

  // Check video duration (should be between 5 minutes and 60 minutes for quality content)
  const durationSeconds = formatDuration(video.duration)
  const isGoodDuration = durationSeconds >= 300 && durationSeconds <= 3600 // 5 min - 60 min

  // Check view count (minimum 1000 views for quality indicator)
  const hasGoodEngagement = video.viewCount >= 1000

  return hasEducationalContent && isGoodDuration && hasGoodEngagement
}

/**
 * Filter and sort videos by quality
 * @param videos Array of YouTube videos
 * @returns Filtered and sorted array
 */
export function filterAndSortVideos(videos: YouTubeVideo[]): YouTubeVideo[] {
  return videos
    .filter(isEducationalVideo)
    .sort((a, b) => {
      // Sort by engagement (views + likes)
      const scoreA = a.viewCount + (a.likeCount * 10)
      const scoreB = b.viewCount + (b.likeCount * 10)
      return scoreB - scoreA
    })
}

