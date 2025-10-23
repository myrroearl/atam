// Student types based on database schema
export interface Student {
  // Display fields (what the frontend shows)
  id: string
  name: string
  email: string
  course: string
  schoolYear: string
  yearSection: string
  status: string
  avatar: string
  
  // Database fields (for internal use)
  student_id: number
  account_id: number
  section_id: number
  course_id: number
  department_id: number
  birthday?: string | null
  address?: string | null
  contact_number?: string | null
  created_at: string
  updated_at: string
}

// Student creation/update form data
export interface StudentFormData {
  firstName: string
  middleName?: string
  lastName: string
  email: string
  password: string
  course: string
  yearLevel: string
  section: string
  status: string
  birthday?: string
  address?: string
  contactNumber?: string
  // Additional fields for dropdown filtering
  courseId?: string
  yearLevelId?: string
  sectionId?: string
}

// API response types
export interface StudentsResponse {
  students: Student[]
}

export interface StudentResponse {
  message: string
  student: Student
}

export interface ApiError {
  error: string
}
