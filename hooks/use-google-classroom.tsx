import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'

/**
 * Custom hook for managing Google Classroom data
 * Automatically fetches and caches Google Classroom courses and classwork
 * Provides loading states, error handling, and refresh functionality
 */

export interface GoogleCoursework {
  id: string
  title: string
  description?: string
  maxPoints?: number
  dueDate?: any
  dueTime?: any
  state: string
  workType?: string
  creationTime?: string
  updateTime?: string
  studentCount?: string | number
}

export interface GoogleCourse {
  id: string
  name: string
  section?: string
  description?: string
  room?: string
  ownerId?: string
  enrollmentCode?: string
  alternateLink?: string
  teacherGroupEmail?: string
  courseGroupEmail?: string
  teacherFolder?: any
  courseState?: string
  creationTime?: string
  updateTime?: string
  classwork: GoogleCoursework[]
  classworkCount: number
  classworkError?: string
}

export interface GoogleClassroomData {
  courses: GoogleCourse[]
  summary: {
    totalCourses: number
    totalClasswork: number
    coursesWithErrors: number
    fetchTimestamp: string
  }
  errors?: {
    failedCourses: number
    message: string
  } | null
}

export interface UseGoogleClassroomReturn {
  // Data
  courses: GoogleCourse[]
  classwork: Record<string, GoogleCoursework[]> // courseId -> classwork[]
  
  // State
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  lastFetched: Date | null
  requiresReauth: boolean
  
  // Actions
  refresh: () => Promise<void>
  getCourseClasswork: (courseId: string) => GoogleCoursework[]
  clearError: () => void
  
  // Statistics
  totalCourses: number
  totalClasswork: number
  coursesWithErrors: number
}

export function useGoogleClassroom(): UseGoogleClassroomReturn {
  const { data: session, status } = useSession()
  const [data, setData] = useState<GoogleClassroomData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastFetched, setLastFetched] = useState<Date | null>(null)
  const [requiresReauth, setRequiresReauth] = useState(false)

  /**
   * Fetch Google Classroom data from the API
   */
  const fetchData = useCallback(async (isRefresh = false) => {
    // Only fetch for professors with valid sessions
    if (status !== 'authenticated' || session?.user?.role !== 'professor') {
      return
    }

    // Don't fetch if we already have recent data (unless it's a manual refresh)
    if (!isRefresh && data && lastFetched) {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
      if (lastFetched > fiveMinutesAgo) {
        console.log('[useGoogleClassroom] Using cached data (less than 5 minutes old)')
        return
      }
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)
      setRequiresReauth(false)

      console.log('[useGoogleClassroom] Fetching Google Classroom data...')
      
      const response = await fetch('/api/professor/google-classroom/auto-fetch', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        if (result.requiresReauth) {
          setRequiresReauth(true)
          setError(result.error || 'Authentication required')
        } else {
          setError(result.error || 'Failed to fetch Google Classroom data')
        }
        return
      }

      // Store the fetched data
      setData(result.data)
      setLastFetched(new Date())
      setError(null)
      setRequiresReauth(false)
      
      console.log(`[useGoogleClassroom] Successfully fetched ${result.data.courses.length} courses with ${result.data.summary.totalClasswork} total classwork items`)

    } catch (err) {
      console.error('[useGoogleClassroom] Fetch error:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch Google Classroom data')
      setRequiresReauth(false)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [status, session, data, lastFetched])

  /**
   * Manually refresh the data
   */
  const refresh = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  /**
   * Clear the current error
   */
  const clearError = useCallback(() => {
    setError(null)
    setRequiresReauth(false)
  }, [])

  /**
   * Get classwork for a specific course
   */
  const getCourseClasswork = useCallback((courseId: string): GoogleCoursework[] => {
    if (!data?.courses) return []
    
    const course = data.courses.find(c => c.id === courseId)
    return course?.classwork || []
  }, [data])

  /**
   * Auto-fetch data when component mounts or session changes
   */
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role === 'professor') {
      fetchData(false)
    } else {
      // Clear data when not authenticated or not a professor
      setData(null)
      setError(null)
      setRequiresReauth(false)
      setLastFetched(null)
    }
  }, [status, session?.user?.role, fetchData])

  /**
   * Build classwork lookup object for easy access
   */
  const classwork = data?.courses.reduce((acc, course) => {
    acc[course.id] = course.classwork
    return acc
  }, {} as Record<string, GoogleCoursework[]>) || {}

  return {
    // Data
    courses: data?.courses || [],
    classwork,
    
    // State
    isLoading,
    isRefreshing,
    error,
    lastFetched,
    requiresReauth,
    
    // Actions
    refresh,
    getCourseClasswork,
    clearError,
    
    // Statistics
    totalCourses: data?.summary.totalCourses || 0,
    totalClasswork: data?.summary.totalClasswork || 0,
    coursesWithErrors: data?.summary.coursesWithErrors || 0,
  }
}

/**
 * Helper hook for Google Classroom authentication status
 */
export function useGoogleClassroomAuth() {
  const { data: session, status } = useSession()
  const { requiresReauth, error } = useGoogleClassroom()
  
  const isAuthenticated = status === 'authenticated' && session?.user?.role === 'professor'
  const hasGoogleAccess = isAuthenticated && session?.accessToken && !requiresReauth
  
  return {
    isAuthenticated,
    hasGoogleAccess,
    requiresReauth,
    authError: error,
    isProfessor: session?.user?.role === 'professor'
  }
}
