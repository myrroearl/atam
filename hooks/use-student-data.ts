import { useState, useEffect, useCallback } from 'react'

interface UseStudentDataOptions {
  cacheTime?: number
  retryCount?: number
  retryDelay?: number
}

interface UseStudentDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useStudentData<T>(
  url: string,
  options: UseStudentDataOptions = {}
): UseStudentDataResult<T> {
  const { cacheTime = 2 * 60 * 1000, retryCount = 2, retryDelay = 1000 } = options
  
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async (retries = retryCount): Promise<void> => {
    try {
      setLoading(true)
      setError(null)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000) // 10 second timeout

      const response = await fetch(url, {
        cache: 'no-store',
        credentials: 'same-origin',
        signal: controller.signal,
      })

      clearTimeout(timeout)

      if (!response.ok) {
        const errorText = await response.text().catch(() => '')
        throw new Error(`HTTP ${response.status}${errorText ? `: ${errorText}` : ''}`)
      }

      const result = await response.json()
      setData(result)
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError'
      const isLastRetry = retries === 0
      
      if (isLastRetry || isAbort) {
        setError(err.message || 'Failed to fetch data')
      } else {
        // Retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, retryDelay * (retryCount - retries + 1)))
        return fetchData(retries - 1)
      }
    } finally {
      setLoading(false)
    }
  }, [url, retryCount, retryDelay])

  const refetch = useCallback(() => fetchData(), [fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, loading, error, refetch }
}

// Specialized hooks for common student data
export function useStudentDashboard() {
  return useStudentData('/api/student/dashboard')
}

export function useStudentSubjects() {
  return useStudentData('/api/student/subjects')
}

export function useStudentGrades() {
  return useStudentData('/api/student/grades')
}

export function useStudentLeaderboard() {
  return useStudentData('/api/student/leaderboard', { cacheTime: 5 * 60 * 1000 })
}

export function useStudentProfile() {
  return useStudentData('/api/student/profile')
}

export function useLearningResourcesCount() {
  return useStudentData('/api/student/learning-resources-count')
}

export function useBookmarksCount() {
  return useStudentData('/api/student/bookmarks-count')
}