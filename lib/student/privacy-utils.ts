/**
 * Utility functions for handling privacy settings
 */

export interface StudentWithPrivacy {
  student_id?: number
  account_id?: number
  privacy_settings?: {
    profileVisibility: 'public' | 'private'
  }
}

/**
 * Determines if a student's profile should be hidden from other users
 * @returns true if profile should be hidden (private setting), false otherwise
 */
export function shouldHideProfile(
  student: StudentWithPrivacy, 
  currentUserAccountId?: number
): boolean {
  // Always show current user their own profile
  if (student.account_id === currentUserAccountId) {
    return false
  }

  // Hide if privacy setting is set to private
  if (student.privacy_settings?.profileVisibility === 'private') {
    return true
  }

  return false
}

/**
 * Generate a consistent random alphanumeric string for a student based on their ID
 * @param studentId - Student ID to use as seed
 * @returns Randomized alphanumeric string
 */
function generateRandomName(studentId: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const length = 12 
  
  // Use student ID as seed for consistent randomization
  let seed = studentId * 7 + 13
  let result = ''
  
  for (let i = 0; i < length; i++) {
    seed = (seed * 17 + 23) % 1000000 
    result += chars[seed % chars.length]
  }
  
  return result
}

/**
 * Get a masked name for display when profile is private
 * @param originalName - Original student name
 * @param studentId - Student ID for consistent randomization
 * @returns Randomized alphanumeric string for privacy  
 */
export function getMaskedName(originalName: string, studentId?: number): string {
  if (studentId) {
    return generateRandomName(studentId)
  }
  
  // Fallback: generate random alphanumeric string
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 12; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

/**
 * Get a masked avatar fallback for private profiles
 * @param originalName - Original student name
 * @param studentId - Student ID for consistent randomization
 * @returns First 2 characters of randomized string
 */
export function getMaskedAvatarFallback(originalName: string, studentId?: number): string {
  if (studentId) {
    const randomString = generateRandomName(studentId)
    return randomString.substring(0, 2)
  }
  
  return "??"
}
