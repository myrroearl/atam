// Resource Deduplication and Data Cleaning Utility
// Handles URL normalization, duplicate detection, and data validation

import { supabaseServer } from "@/lib/student/supabaseServer"

export interface ResourceToValidate {
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
  // YouTube-specific fields (optional)
  youtube_video_id?: string
  youtube_channel_id?: string
  youtube_channel_title?: string
  duration_seconds?: number
  view_count?: number
  published_at?: string
  thumbnail_url?: string
}

export interface DeduplicationResult {
  uniqueResources: ResourceToValidate[]
  duplicates: {
    url: string
    title: string
    reason: string
  }[]
  stats: {
    totalProcessed: number
    uniqueCount: number
    duplicateCount: number
    invalidCount: number
  }
}

/**
 * Normalize URL to standard format for duplicate detection
 * Handles different URL formats, removes tracking parameters
 */
export function normalizeUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    
    // Normalize YouTube URLs
    if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
      // Extract video ID
      let videoId = ''
      
      if (urlObj.hostname.includes('youtu.be')) {
        // Format: https://youtu.be/ABC123
        videoId = urlObj.pathname.substring(1)
      } else if (urlObj.searchParams.has('v')) {
        // Format: https://www.youtube.com/watch?v=ABC123
        videoId = urlObj.searchParams.get('v') || ''
      }
      
      if (videoId) {
        // Return normalized YouTube URL
        return `https://www.youtube.com/watch?v=${videoId}`
      }
    }
    
    // For non-YouTube URLs, remove common tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'source']
    trackingParams.forEach(param => {
      urlObj.searchParams.delete(param)
    })
    
    // Remove trailing slashes
    let normalizedUrl = urlObj.toString()
    if (normalizedUrl.endsWith('/')) {
      normalizedUrl = normalizedUrl.slice(0, -1)
    }
    
    return normalizedUrl
    
  } catch (error) {
    // If URL parsing fails, return original URL
    console.warn(`Failed to normalize URL: ${url}`, error)
    return url
  }
}

/**
 * Fetch all existing resource URLs from database
 */
export async function getExistingResourceUrls(): Promise<Set<string>> {
  try {
    const { data, error } = await supabaseServer
      .from('learning_resources')
      .select('url')
    
    if (error) {
      console.error('Error fetching existing resource URLs:', error)
      return new Set()
    }
    
    // Normalize all existing URLs for comparison
    const normalizedUrls = data.map(resource => normalizeUrl(resource.url))
    return new Set(normalizedUrls)
    
  } catch (error) {
    console.error('Error in getExistingResourceUrls:', error)
    return new Set()
  }
}

/**
 * Validate resource data quality
 */
export function validateResource(resource: ResourceToValidate): { isValid: boolean; reason?: string } {
  // Check required fields
  if (!resource.title || resource.title.trim() === '') {
    return { isValid: false, reason: 'Missing or empty title' }
  }
  
  if (!resource.url || resource.url.trim() === '') {
    return { isValid: false, reason: 'Missing or empty URL' }
  }
  
  if (!resource.type || resource.type.trim() === '') {
    return { isValid: false, reason: 'Missing or empty type' }
  }
  
  // Validate URL format
  try {
    new URL(resource.url)
  } catch (error) {
    return { isValid: false, reason: 'Invalid URL format' }
  }
  
  // Validate type
  const validTypes = ['video', 'book', 'article', 'course', 'document']
  if (!validTypes.includes(resource.type.toLowerCase())) {
    return { isValid: false, reason: `Invalid type: ${resource.type}` }
  }
  
  // Validate title length (prevent extremely long titles)
  if (resource.title.length > 500) {
    return { isValid: false, reason: 'Title too long (max 500 characters)' }
  }
  
  return { isValid: true }
}

/**
 * Deduplicate resources based on normalized URLs
 * Checks against both the current batch and existing database records
 */
export async function deduplicateResources(
  resources: ResourceToValidate[]
): Promise<DeduplicationResult> {
  console.log(`\n🔍 Starting deduplication process for ${resources.length} resources...`)
  
  const uniqueResources: ResourceToValidate[] = []
  const duplicates: { url: string; title: string; reason: string }[] = []
  const seenUrlsInBatch = new Set<string>()
  let invalidCount = 0
  
  // Fetch existing URLs from database
  const existingUrls = await getExistingResourceUrls()
  console.log(`📊 Found ${existingUrls.size} existing resources in database`)
  
  // Process each resource
  for (const resource of resources) {
    // Step 1: Validate resource data
    const validation = validateResource(resource)
    if (!validation.isValid) {
      console.log(`❌ Invalid resource: "${resource.title}" - ${validation.reason}`)
      duplicates.push({
        url: resource.url,
        title: resource.title,
        reason: `Invalid: ${validation.reason}`
      })
      invalidCount++
      continue
    }
    
    // Step 2: Normalize URL
    const normalizedUrl = normalizeUrl(resource.url)
    
    // Step 3: Check if URL exists in database
    if (existingUrls.has(normalizedUrl)) {
      console.log(`🔄 Duplicate (existing in DB): "${resource.title}"`)
      duplicates.push({
        url: resource.url,
        title: resource.title,
        reason: 'URL already exists in database'
      })
      continue
    }
    
    // Step 4: Check if URL already seen in current batch
    if (seenUrlsInBatch.has(normalizedUrl)) {
      console.log(`🔄 Duplicate (in current batch): "${resource.title}"`)
      duplicates.push({
        url: resource.url,
        title: resource.title,
        reason: 'Duplicate URL in current batch'
      })
      continue
    }
    
    // Step 5: Resource is unique, add to results
    seenUrlsInBatch.add(normalizedUrl)
    uniqueResources.push({
      ...resource,
      url: normalizedUrl // Use normalized URL
    })
  }
  
  const stats = {
    totalProcessed: resources.length,
    uniqueCount: uniqueResources.length,
    duplicateCount: duplicates.length - invalidCount,
    invalidCount: invalidCount
  }
  
  console.log('\n📊 Deduplication Results:')
  console.log(`   Total processed: ${stats.totalProcessed}`)
  console.log(`   ✅ Unique resources: ${stats.uniqueCount}`)
  console.log(`   🔄 Duplicates skipped: ${stats.duplicateCount}`)
  console.log(`   ❌ Invalid resources: ${stats.invalidCount}`)
  
  return {
    uniqueResources,
    duplicates,
    stats
  }
}

/**
 * Clean and prepare resources for database insertion
 */
export function cleanResourcesForInsertion(resources: ResourceToValidate[]): any[] {
  return resources.map(resource => ({
    title: resource.title.trim(),
    description: resource.description?.trim() || '',
    type: resource.type.toLowerCase(),
    source: resource.source.trim(),
    url: resource.url.trim(),
    author: resource.author?.trim() || 'Unknown',
    topics: Array.isArray(resource.topics) ? resource.topics.filter(t => t && t.trim()) : [],
    tags: Array.isArray(resource.tags) ? resource.tags.filter(t => t && t.trim()) : [],
    likes: Math.max(0, resource.likes || 0),
    dislikes: Math.max(0, resource.dislikes || 0),
    is_active: resource.is_active !== undefined ? resource.is_active : true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
}

/**
 * Log duplicate detection summary
 */
export function logDuplicateSummary(duplicates: DeduplicationResult['duplicates']) {
  if (duplicates.length === 0) {
    console.log('✅ No duplicates detected!')
    return
  }
  
  console.log('\n📋 Duplicate Detection Summary:')
  
  // Group by reason
  const byReason = duplicates.reduce((acc, dup) => {
    if (!acc[dup.reason]) {
      acc[dup.reason] = []
    }
    acc[dup.reason].push(dup)
    return acc
  }, {} as Record<string, typeof duplicates>)
  
  Object.entries(byReason).forEach(([reason, dups]) => {
    console.log(`\n   ${reason}: ${dups.length} resources`)
    dups.slice(0, 3).forEach(dup => {
      console.log(`      - "${dup.title}"`)
    })
    if (dups.length > 3) {
      console.log(`      ... and ${dups.length - 3} more`)
    }
  })
}

