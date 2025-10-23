import { cookies } from 'next/headers'

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!
const REDIRECT_URI = process.env.NEXTAUTH_URL + '/api/auth/callback/google'
const CLASSROOM_API_BASE = 'https://classroom.googleapis.com/v1'

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expires_at: number
}

export interface GoogleCourse {
  id: string
  name: string
  section?: string
  description?: string
  courseState: string
  alternateLink: string
}

export interface GoogleCoursework {
  id: string
  courseId: string
  title: string
  description?: string
  maxPoints?: number
  workType: string
  state: string
  creationTime: string
  dueDate?: any
  alternateLink: string
}

export interface GoogleSubmission {
  id: string
  userId: string
  courseId: string
  courseWorkId: string
  assignedGrade?: number
  draftGrade?: number
  state: string
  late: boolean
  creationTime: string
  updateTime: string
}

export interface GoogleStudent {
  userId: string
  profile: {
    id: string
    name: {
      fullName: string
      givenName: string
      familyName: string
    }
    emailAddress: string
    photoUrl?: string
  }
}

// Get stored tokens from cookies
export async function getStoredTokens(): Promise<GoogleTokens | null> {
  const cookieStore = await cookies()
  
  const accessToken = cookieStore.get('google_access_token')?.value
  const refreshToken = cookieStore.get('google_refresh_token')?.value
  const expiresAt = cookieStore.get('google_token_expires_at')?.value

  if (!accessToken || !expiresAt) {
    return null
  }

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_at: parseInt(expiresAt)
  }
}

// Refresh access token using refresh token
export async function refreshAccessToken(refreshToken: string): Promise<GoogleTokens | null> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const tokens = await response.json()
    const expiresAt = Date.now() + (tokens.expires_in * 1000)

    // Note: In a utility function, we can't directly set cookies
    // The calling API route should handle cookie updates
    // This function just returns the new tokens

    return {
      access_token: tokens.access_token,
      refresh_token: refreshToken, // Keep the original refresh token
      expires_at: expiresAt
    }
  } catch (error) {
    console.error('Token refresh error:', error)
    return null
  }
}

// Get valid access token (refresh if needed)
export async function getValidAccessToken(): Promise<string | null> {
  const tokens = await getStoredTokens()
  
  if (!tokens) {
    return null
  }

  // Check if token is expired (with 5-minute buffer)
  const isExpired = Date.now() > (tokens.expires_at - 5 * 60 * 1000)
  
  if (!isExpired) {
    return tokens.access_token
  }

  // Token is expired, try to refresh
  if (tokens.refresh_token) {
    const refreshedTokens = await refreshAccessToken(tokens.refresh_token)
    return refreshedTokens?.access_token || null
  }

  return null
}

// Make authenticated request to Google Classroom API
export async function makeClassroomRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const accessToken = await getValidAccessToken()
  
  if (!accessToken) {
    throw new Error('No valid access token available')
  }

  const response = await fetch(`${CLASSROOM_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Classroom API error: ${response.status} - ${error}`)
  }

  return response.json()
}

// Get Google OAuth URL for authentication
export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    scope: [
      'https://www.googleapis.com/auth/classroom.courses.readonly',
      'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
      'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
      'https://www.googleapis.com/auth/classroom.profile.emails',
      'https://www.googleapis.com/auth/classroom.rosters.readonly'
    ].join(' '),
    response_type: 'code',
    access_type: 'offline',
    prompt: 'consent',
    state: 'gradebook_integration'
  })

  return `https://accounts.google.com/o/oauth2/auth?${params.toString()}`
}

// Fetch user's Google Classroom courses
export async function fetchCourses(): Promise<GoogleCourse[]> {
  const data = await makeClassroomRequest('/courses?courseStates=ACTIVE&teacherId=me')
  return data.courses || []
}

// Fetch coursework for a specific course
export async function fetchCoursework(courseId: string): Promise<GoogleCoursework[]> {
  const data = await makeClassroomRequest(`/courses/${courseId}/courseWork`)
  return data.courseWork || []
}

// Fetch students for a specific course
export async function fetchStudents(courseId: string): Promise<GoogleStudent[]> {
  const data = await makeClassroomRequest(`/courses/${courseId}/students`)
  return data.students || []
}

// Fetch student submissions for specific coursework
export async function fetchSubmissions(courseId: string, courseWorkId: string): Promise<GoogleSubmission[]> {
  const data = await makeClassroomRequest(`/courses/${courseId}/courseWork/${courseWorkId}/studentSubmissions`)
  return data.studentSubmissions || []
}

// Check if user is authenticated with Google
export async function isAuthenticated(): Promise<boolean> {
  const tokens = await getStoredTokens()
  return tokens !== null
} 