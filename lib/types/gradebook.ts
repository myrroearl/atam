// Types for Gradebook based on Supabase schema - Updated to include topics

export type AttendanceStatus = 'present' | 'absent' | 'late'
export type EntrySource = 'manual entry' | 'imported from gclass' | 'manual' | 'google_classroom'
export type GradePeriod = 'midterm' | 'final'

export interface AttendanceItem {
  id: number
  name: string
  date: string
  status: AttendanceStatus | null
  imported?: boolean
  source?: EntrySource
  component_id?: number
  grade_period?: GradePeriod
  topics?: string[]
}

export interface ScoreItem {
  id: number
  name: string
  date: string
  score: number
  total: number
  imported?: boolean
  source?: EntrySource
  component_id?: number
  grade_period?: GradePeriod
  topics?: string[]
}

export interface StudentGradeData {
  student_id: number
  name: string
  email: string
  components: Record<number, (AttendanceItem | ScoreItem)[]> // Keyed by component_id
}

export interface GradingWeights {
  [component_id: number]: number // Weight percentage keyed by component_id
}

export interface VisibleComponents {
  [component_id: number]: boolean // Visibility keyed by component_id
}

export interface GradeComponent {
  component_id: number
  component_name: string
  weight_percentage: number
  is_attendance?: boolean // Flag to identify if this is an attendance component
}

export interface Student {
  student_id: number
  first_name: string
  middle_name: string | null
  last_name: string
  email: string
}

export interface GradeEntry {
  grade_id: number
  student_id: number
  component_id: number
  score: number
  max_score: number
  attendance: AttendanceStatus | null
  entry_type: EntrySource
  date_recorded: string
  grade_period: GradePeriod | null
  name: string | null
  topics?: string[]
}

export interface ClassData {
  class_id: number
  class_name: string
  subject_name: string
  subject_code: string
  section_name: string
  schedule_start: string | null
  schedule_end: string | null
  students: Student[]
  gradeComponents: GradeComponent[]
  gradeEntries: GradeEntry[]
  studentCount: number
  avgGrade: number
}

// Google Classroom types
export interface GoogleCourse {
  id: string
  name: string
  section?: string
  description?: string
}

export interface GoogleCoursework {
  id: string
  title: string
  description?: string
  maxPoints?: number
  workType?: string
  creationTime?: string
  dueDate?: any
}

export interface GoogleScore {
  userId: string
  email: string
  name: string
  assignedGrade?: number
  draftGrade?: number
  state: string
}

