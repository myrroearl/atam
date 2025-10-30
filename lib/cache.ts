// Simple in-memory cache for API responses
// In production, consider using Redis or similar for distributed caching

interface CacheEntry<T> {
    data: T
    timestamp: number
    ttl: number // Time to live in milliseconds
  }
  
  class MemoryCache {
    private cache = new Map<string, CacheEntry<any>>()
  
    set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
        ttl: ttlMs
      })
    }
  
    get<T>(key: string): T | null {
      const entry = this.cache.get(key)
      if (!entry) return null
  
      const now = Date.now()
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
        return null
      }
  
      return entry.data
    }
  
    delete(key: string): void {
      this.cache.delete(key)
    }
  
    clear(): void {
      this.cache.clear()
    }
  
    // Clean up expired entries
    cleanup(): void {
      const now = Date.now()
      for (const [key, entry] of this.cache.entries()) {
        if (now - entry.timestamp > entry.ttl) {
          this.cache.delete(key)
        }
      }
    }
  }
  
  export const cache = new MemoryCache()
  
  // Cache keys for different data types
  export const CACHE_KEYS = {
    STUDENT_PROFILE: (accountId: number) => `student_profile_${accountId}`,
    STUDENT_DASHBOARD: (accountId: number) => `student_dashboard_${accountId}`,
    STUDENT_SUBJECTS: (accountId: number) => `student_subjects_${accountId}`,
    STUDENT_GRADES: (accountId: number) => `student_grades_${accountId}`,
    STUDENT_LEADERBOARD: () => 'student_leaderboard',
    GRADE_COMPONENTS: () => 'grade_components',
  } as const
  
  // Cache TTL constants (in milliseconds)
  export const CACHE_TTL = {
    STUDENT_DATA: 2 * 60 * 1000, // 2 minutes
    LEADERBOARD: 5 * 60 * 1000, // 5 minutes
    GRADE_COMPONENTS: 10 * 60 * 1000, // 10 minutes
    STATIC_DATA: 30 * 60 * 1000, // 30 minutes
  } as const
  
  // Helper function to create cache-aware fetch
  export async function cachedFetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number = CACHE_TTL.STUDENT_DATA
  ): Promise<T> {
    // Try to get from cache first
    const cached = cache.get<T>(key)
    if (cached !== null) {
      return cached
    }
  
    // Fetch fresh data
    const data = await fetcher()
    
    // Store in cache
    cache.set(key, data, ttl)
    
    return data
  }
  
  // Cleanup expired entries every 5 minutes
  if (typeof window === 'undefined') {
    setInterval(() => {
      cache.cleanup()
    }, 5 * 60 * 1000)
  }