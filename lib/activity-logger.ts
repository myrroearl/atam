import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface ActivityLogEntry {
  account_id: number
  action: string
  description: string
  metadata?: Record<string, any>
}

interface LogActivityParams {
  action: string
  description?: string
  account_id?: number
}

export interface GradeEntryActivityData {
  class_id: number
  component_id: number
  component_name?: string
  grade_period?: string
  entry_name?: string
  student_count?: number
  student_names?: string[]
  topics?: string[]
  old_value?: any
  new_value?: any
  score_changes?: Array<{
    student_id: number
    student_name: string
    old_score: number
    new_score: number
    entry_name: string
  }>
}

/**
 * Logs an activity to the activity_logs table
 */
export async function logActivity(entry: ActivityLogEntry): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('activity_logs')
      .insert({
        account_id: entry.account_id,
        action: entry.action,
        description: entry.description,
        created_at: new Date().toISOString()
      })

    if (error) {
      console.error('Failed to log activity:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error logging activity:', error)
    return false
  }
}

/**
 * Log an activity to the database
 * Can be called from client-side or server-side
 */
export async function logActivityClient({ action, description, account_id }: LogActivityParams): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/activity-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        description,
        account_id
      }),
    })

    if (!response.ok) {
      console.error('Failed to log activity:', await response.text())
      return false
    }

    return true
  } catch (error) {
    console.error('Error logging activity:', error)
    return false
  }
}

/**
 * Logs grade entry creation activity
 */
export async function logGradeEntryCreation(
  accountId: number,
  data: GradeEntryActivityData
): Promise<boolean> {
  const description = `Created grade entry "${data.entry_name}" for ${data.student_count} student(s) in ${data.component_name} (${data.grade_period || 'no period'})`
  
  return await logActivity({
    account_id: accountId,
    action: 'GRADE_ENTRY_CREATED',
    description,
    metadata: {
      class_id: data.class_id,
      component_id: data.component_id,
      component_name: data.component_name,
      grade_period: data.grade_period,
      entry_name: data.entry_name,
      student_count: data.student_count,
      topics: data.topics
    }
  })
}

/**
 * Logs grade entry update activity (header changes)
 */
export async function logGradeEntryUpdate(
  accountId: number,
  data: GradeEntryActivityData
): Promise<boolean> {
  const description = `Updated grade entry "${data.entry_name}" in ${data.component_name} (${data.grade_period || 'no period'})`
  
  return await logActivity({
    account_id: accountId,
    action: 'GRADE_ENTRY_UPDATED',
    description,
    metadata: {
      class_id: data.class_id,
      component_id: data.component_id,
      component_name: data.component_name,
      grade_period: data.grade_period,
      entry_name: data.entry_name,
      old_value: data.old_value,
      new_value: data.new_value,
      topics: data.topics
    }
  })
}

/**
 * Logs grade entry deletion activity
 */
export async function logGradeEntryDeletion(
  accountId: number,
  data: GradeEntryActivityData
): Promise<boolean> {
  const description = `Deleted grade entry "${data.entry_name}" from ${data.component_name} (${data.grade_period || 'no period'}) affecting ${data.student_count} student(s)`
  
  return await logActivity({
    account_id: accountId,
    action: 'GRADE_ENTRY_DELETED',
    description,
    metadata: {
      class_id: data.class_id,
      component_id: data.component_id,
      component_name: data.component_name,
      grade_period: data.grade_period,
      entry_name: data.entry_name,
      student_count: data.student_count
    }
  })
}

/**
 * Logs individual score changes (bulk update)
 */
export async function logScoreChanges(
  accountId: number,
  data: GradeEntryActivityData
): Promise<boolean> {
  const changeCount = data.score_changes?.length || 0
  const description = `Updated ${changeCount} score(s) in ${data.component_name}`
  
  return await logActivity({
    account_id: accountId,
    action: 'SCORES_UPDATED',
    description,
    metadata: {
      class_id: data.class_id,
      component_id: data.component_id,
      component_name: data.component_name,
      grade_period: data.grade_period,
      change_count: changeCount,
      score_changes: data.score_changes
    }
  })
}

/**
 * Logs Google Classroom import activity
 */
export async function logGoogleClassroomImport(
  accountId: number,
  data: GradeEntryActivityData
): Promise<boolean> {
  const description = `Imported scores from Google Classroom: "${data.entry_name}" for ${data.student_count} student(s) in ${data.component_name}`
  
  return await logActivity({
    account_id: accountId,
    action: 'GOOGLE_CLASSROOM_IMPORT',
    description,
    metadata: {
      class_id: data.class_id,
      component_id: data.component_id,
      component_name: data.component_name,
      grade_period: data.grade_period,
      entry_name: data.entry_name,
      student_count: data.student_count,
      topics: data.topics
    }
  })
}

/**
 * Gets the professor's account_id from session
 */
export async function getProfessorAccountId(session: any): Promise<number | null> {
  if (!session?.user?.email) {
    return null
  }

  try {
    const { data: account, error } = await supabase
      .from('accounts')
      .select('account_id')
      .eq('email', session.user.email)
      .eq('role', 'professor')
      .single()

    if (error || !account) {
      console.error('Failed to get professor account_id:', error)
      return null
    }

    return account.account_id
  } catch (error) {
    console.error('Error getting professor account_id:', error)
    return null
  }
}

/**
 * Gets component name by component_id
 */
export async function getComponentName(componentId: number): Promise<string | null> {
  try {
    const { data: component, error } = await supabase
      .from('grade_components')
      .select('component_name')
      .eq('component_id', componentId)
      .single()

    if (error || !component) {
      console.error('Failed to get component name:', error)
      return null
    }

    return component.component_name
  } catch (error) {
    console.error('Error getting component name:', error)
    return null
  }
}

/**
 * Gets student names by student IDs
 */
export async function getStudentNames(studentIds: number[]): Promise<string[]> {
  if (studentIds.length === 0) return []

  try {
    const { data: students, error } = await supabase
      .from('students')
      .select('student_id, first_name, middle_name, last_name')
      .in('student_id', studentIds)

    if (error || !students) {
      console.error('Failed to get student names:', error)
      return []
    }

    return students.map(student => {
      const fullName = `${student.first_name} ${student.middle_name ? student.middle_name + ' ' : ''}${student.last_name}`
      return fullName.trim()
    })
  } catch (error) {
    console.error('Error getting student names:', error)
    return []
  }
}

/**
 * Logs profile information update activity
 */
export async function logProfileUpdate(
  accountId: number,
  changes: {
    phone?: string
    address?: string
  }
): Promise<boolean> {
  const changedFields = []
  if (changes.phone !== undefined) changedFields.push('phone number')
  if (changes.address !== undefined) changedFields.push('address')
  
  const description = `Updated profile information: ${changedFields.join(', ')}`
  
  return await logActivity({
    account_id: accountId,
    action: 'PROFILE_UPDATE',
    description,
    metadata: {
      changed_fields: changedFields,
      phone: changes.phone,
      address: changes.address
    }
  })
}

/**
 * Logs password change activity
 */
export async function logPasswordChange(
  accountId: number
): Promise<boolean> {
  const description = 'Changed account password'
  
  return await logActivity({
    account_id: accountId,
    action: 'PASSWORD_CHANGE',
    description,
    metadata: {
      timestamp: new Date().toISOString()
    }
  })
}

/**
 * Predefined action types for consistency
 */
export const ActivityActions = {
  // Authentication
  LOGIN: 'Logged in',
  LOGOUT: 'Logged out',
  
  // User Management
  CREATE_USER: 'Created user',
  UPDATE_USER: 'Updated user',
  DELETE_USER: 'Deleted user',
  VIEW_USER: 'Viewed user profile',
  
  // Student Management
  CREATE_STUDENT: 'Created student',
  UPDATE_STUDENT: 'Updated student',
  DELETE_STUDENT: 'Deleted student',
  VIEW_STUDENT: 'Viewed student',
  IMPORT_STUDENTS: 'Imported students',
  
  // Professor Management
  CREATE_PROFESSOR: 'Created professor',
  UPDATE_PROFESSOR: 'Updated professor',
  DELETE_PROFESSOR: 'Deleted professor',
  VIEW_PROFESSOR: 'Viewed professor',
  
  // Department Management
  CREATE_DEPARTMENT: 'Created department',
  UPDATE_DEPARTMENT: 'Updated department',
  DELETE_DEPARTMENT: 'Deleted department',
  VIEW_DEPARTMENT: 'Viewed department',
  
  // Course Management
  CREATE_COURSE: 'Created course',
  UPDATE_COURSE: 'Updated course',
  DELETE_COURSE: 'Deleted course',
  VIEW_COURSE: 'Viewed course',
  
  // Subject Management
  CREATE_SUBJECT: 'Created subject',
  UPDATE_SUBJECT: 'Updated subject',
  DELETE_SUBJECT: 'Deleted subject',
  VIEW_SUBJECT: 'Viewed subject',
  
  // Section Management
  CREATE_SECTION: 'Created section',
  UPDATE_SECTION: 'Updated section',
  DELETE_SECTION: 'Deleted section',
  VIEW_SECTION: 'Viewed section',
  
  // Class Management
  CREATE_CLASS: 'Created class',
  UPDATE_CLASS: 'Updated class',
  DELETE_CLASS: 'Deleted class',
  VIEW_CLASS: 'Viewed class',
  
  // Grade Management
  CREATE_GRADE: 'Created grade entry',
  UPDATE_GRADE: 'Updated grade entry',
  DELETE_GRADE: 'Deleted grade entry',
  VIEW_GRADES: 'Viewed grades',
  IMPORT_GRADES: 'Imported grades from Google Classroom',
  
  // Curriculum Management
  UPDATE_CURRICULUM: 'Updated curriculum',
  VIEW_CURRICULUM: 'Viewed curriculum',
  
  // Announcements
  CREATE_ANNOUNCEMENT: 'Created announcement',
  UPDATE_ANNOUNCEMENT: 'Updated announcement',
  DELETE_ANNOUNCEMENT: 'Deleted announcement',
  VIEW_ANNOUNCEMENT: 'Viewed announcements',
  
  // Archive
  ARCHIVE_ITEM: 'Archived item',
  RESTORE_ITEM: 'Restored item',
  VIEW_ARCHIVE: 'Viewed archive',
  
  // Settings
  UPDATE_SETTINGS: 'Updated system settings',
  VIEW_SETTINGS: 'Viewed settings',
  
  // AI Tools
  USE_QUIZ_GENERATOR: 'Used quiz generator',
  USE_LESSON_PLANNER: 'Used lesson planner',
  USE_PPT_GENERATOR: 'Used PowerPoint generator',
  USE_ESSAY_CHECKER: 'Used essay checker',
  
  // Reports
  GENERATE_REPORT: 'Generated report',
  EXPORT_DATA: 'Exported data',
  
  // Analytics
  VIEW_ANALYTICS: 'Viewed analytics',
  VIEW_DASHBOARD: 'Viewed dashboard',
  
  // Learning Resources & Bookmarks
  BOOKMARK_RESOURCE: 'Bookmarked learning resource',
  UNBOOKMARK_RESOURCE: 'Removed bookmark from learning resource',
  
  // Security
  FAILED_LOGIN: 'Failed login attempt',
  PASSWORD_CHANGE: 'Changed password',
  UNAUTHORIZED_ACCESS: 'Attempted unauthorized access',
} as const

/**
 * Log bookmark activity
 */
export async function logBookmarkActivity(
  accountId: number,
  resourceId: string,
  resourceTitle: string,
  action: 'bookmark' | 'unbookmark'
): Promise<boolean> {
  return logActivity({
    account_id: accountId,
    action: action === 'bookmark' ? ActivityActions.BOOKMARK_RESOURCE : ActivityActions.UNBOOKMARK_RESOURCE,
    description: `${action === 'bookmark' ? 'Bookmarked' : 'Removed bookmark from'} resource: "${resourceTitle}"`,
    metadata: {
      resource_id: resourceId,
      resource_title: resourceTitle,
      timestamp: new Date().toISOString()
    }
  })
}


/**
 * Helper function to log activities with predefined actions
 */
export async function logPredefinedActivity(
  action: typeof ActivityActions[keyof typeof ActivityActions],
  description?: string,
  account_id?: number
): Promise<boolean> {
  return logActivityClient({ action, description, account_id })
}