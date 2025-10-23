/**
 * Activity Logging Integration Examples
 * 
 * This file contains practical examples of how to integrate activity logging
 * into various parts of your application.
 */

import { logActivity, logActivityClient, logPredefinedActivity, ActivityActions } from "@/lib/activity-logger"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createClient } from "@supabase/supabase-js"

// Mock auth options for examples
const authOptions = {
  // Add your auth configuration here
}

// Mock supabase client for examples
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// ============================================================================
// EXAMPLE 1: Login Handler with Activity Logging
// ============================================================================

export const LoginExample = () => {
  const router = useRouter()
  const [error, setError] = useState<string>("")

  const handleLogin = async (email: string, password: string, accountId?: number) => {
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.ok) {
        // ✅ Log successful login using client-side logging
        await logActivityClient({
          action: ActivityActions.LOGIN,
          description: `Successful login from ${email}`,
          account_id: accountId
        })
        
        router.push("/admin/dashboard")
      } else {
        // ✅ Log failed login attempt (for security monitoring)
        await logActivityClient({
          action: ActivityActions.FAILED_LOGIN,
          description: `Failed login attempt for ${email}`,
          account_id: accountId
        })
        
        setError("Invalid credentials")
      }
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  return null // Component implementation
}

// ============================================================================
// EXAMPLE 2: Student Creation with Activity Logging
// ============================================================================

export const StudentCreationExample = () => {
  const handleCreateStudent = async (studentData: any, accountId?: number) => {
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studentData)
      })

      if (!response.ok) {
        throw new Error('Failed to create student')
      }

      const result = await response.json()

      // ✅ Log the student creation using client-side logging
      await logActivityClient({
        action: ActivityActions.CREATE_STUDENT,
        description: `Created student: ${studentData.first_name} ${studentData.last_name} (${studentData.email})`,
        account_id: accountId
      })

      toast.success("Student created successfully")
      
    } catch (error) {
      console.error("Error creating student:", error)
      toast.error("Failed to create student")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 3: Update Operations with Before/After Details
// ============================================================================

export const ProfileUpdateExample = () => {
  const handleUpdateProfile = async (studentId: number, updates: any, accountId?: number) => {
    try {
      // Get current data for comparison
      const currentResponse = await fetch(`/api/admin/students/${studentId}`)
      const currentData = await currentResponse.json()

      // Perform update
      const response = await fetch(`/api/admin/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (!response.ok) {
        throw new Error('Failed to update student')
      }

      // ✅ Log with detailed description of what changed using client-side logging
      const changedFields = Object.keys(updates).join(', ')
      await logActivityClient({
        action: ActivityActions.UPDATE_STUDENT,
        description: `Updated student ${currentData.first_name} ${currentData.last_name} - Modified fields: ${changedFields}`,
        account_id: accountId
      })

      toast.success("Profile updated successfully")
      
    } catch (error) {
      console.error("Error updating profile:", error)
      toast.error("Failed to update profile")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 4: Delete Operations with Confirmation
// ============================================================================

export const DeleteOperationExample = () => {
  const handleDeleteSection = async (sectionId: number, sectionName: string, accountId?: number) => {
    try {
      // Perform deletion
      const response = await fetch(`/api/admin/sections/${sectionId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete section')
      }

      // ✅ Log the deletion with section name for tracking using client-side logging
      await logActivityClient({
        action: ActivityActions.DELETE_SECTION,
        description: `Deleted section: ${sectionName} (ID: ${sectionId})`,
        account_id: accountId
      })

      toast.success("Section deleted successfully")
      
    } catch (error) {
      console.error("Error deleting section:", error)
      toast.error("Failed to delete section")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 5: Bulk Operations
// ============================================================================

export const BulkImportExample = () => {
  const handleBulkImport = async (file: File, accountId?: number) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/students/import', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to import students')
      }

      const result = await response.json()

      // ✅ Log bulk operation with count using client-side logging
      await logActivityClient({
        action: ActivityActions.IMPORT_STUDENTS,
        description: `Bulk imported ${result.count} students from ${file.name}`,
        account_id: accountId
      })

      toast.success(`Successfully imported ${result.count} students`)
      
    } catch (error) {
      console.error("Error importing students:", error)
      toast.error("Failed to import students")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 6: Export Operations
// ============================================================================

export const ExportDataExample = () => {
  const handleExportStudents = async (filters: any, accountId?: number) => {
    try {
      // Generate and download CSV
      const response = await fetch('/api/admin/students/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filters)
      })

      if (!response.ok) {
        throw new Error('Failed to export data')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `students-export-${new Date().toISOString()}.csv`
      a.click()

      // ✅ Log the export with details using client-side logging
      await logActivityClient({
        action: ActivityActions.EXPORT_DATA,
        description: `Exported student data (${Object.keys(filters).length} filters applied)`,
        account_id: accountId
      })

      toast.success("Data exported successfully")
      
    } catch (error) {
      console.error("Error exporting data:", error)
      toast.error("Failed to export data")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 7: View/Access Logging (Optional - use sparingly)
// ============================================================================

export const ViewLoggingExample = () => {
  const [studentData, setStudentData] = useState<any>(null)

  const handleViewStudentProfile = async (studentId: number, accountId?: number) => {
    try {
      // Fetch student data
      const response = await fetch(`/api/admin/students/${studentId}`)
      const student = await response.json()

      // ✅ Log viewing of sensitive data (optional - use only for sensitive operations)
      // Note: Don't log every view, only important ones
      await logActivityClient({
        action: ActivityActions.VIEW_STUDENT,
        description: `Viewed detailed profile of ${student.first_name} ${student.last_name}`,
        account_id: accountId
      })

      // Display student data
      setStudentData(student)
      
    } catch (error) {
      console.error("Error viewing student:", error)
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 8: API Route with Activity Logging
// ============================================================================

// Example: app/api/admin/departments/route.ts

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { department_name, description, dean_name } = body

    // Create department
    const { data, error } = await supabase
      .from('departments')
      .insert({
        department_name,
        description,
        dean_name,
        status: 'active'
      })
      .select()

    if (error) {
      throw error
    }

    // ✅ Log activity in API route using server-side logging
    await logActivity({
      account_id: Number(session.user.account_id),
      action: ActivityActions.CREATE_DEPARTMENT,
      description: `Created new department: ${department_name}`,
      metadata: {
        department_name,
        dean_name,
        status: 'active'
      }
    })

    return NextResponse.json({ success: true, department: data[0] }, { status: 201 })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// ============================================================================
// EXAMPLE 9: AI Tools Usage Logging
// ============================================================================

export const AIToolsExample = () => {
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null)

  const handleGenerateQuiz = async (topic: string, questions: number, accountId?: number) => {
    try {
      const response = await fetch('/api/professor/ai-tools/quiz-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, questions })
      })

      if (!response.ok) {
        throw new Error('Failed to generate quiz')
      }

      const result = await response.json()

      // ✅ Log AI tool usage using client-side logging
      await logActivityClient({
        action: ActivityActions.USE_QUIZ_GENERATOR,
        description: `Generated ${questions} quiz questions on topic: ${topic}`,
        account_id: accountId
      })

      setGeneratedQuiz(result.quiz)
      toast.success("Quiz generated successfully")
      
    } catch (error) {
      console.error("Error generating quiz:", error)
      toast.error("Failed to generate quiz")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 10: Settings Changes
// ============================================================================

export const SettingsChangeExample = () => {
  const handleUpdateSettings = async (settingKey: string, newValue: string, accountId?: number) => {
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setting_key: settingKey, setting_value: newValue })
      })

      if (!response.ok) {
        throw new Error('Failed to update setting')
      }

      // ✅ Log settings change with details using client-side logging
      await logActivityClient({
        action: ActivityActions.UPDATE_SETTINGS,
        description: `Modified system setting: ${settingKey} = ${newValue}`,
        account_id: accountId
      })

      toast.success("Settings updated successfully")
      
    } catch (error) {
      console.error("Error updating settings:", error)
      toast.error("Failed to update settings")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 11: Error Handling in Logging
// ============================================================================

// Mock function for example
const performCriticalOperation = async () => {
  // Simulate some operation
  return new Promise(resolve => setTimeout(resolve, 1000))
}

export const SafeLoggingExample = () => {
  const handleOperation = async (accountId?: number) => {
    try {
      // Main operation
      await performCriticalOperation()

      // ✅ Log activity - wrapped in try/catch so it doesn't break main flow
      try {
        await logActivityClient({
          action: ActivityActions.CREATE_CLASS,
          description: "Created new class",
          account_id: accountId
        })
      } catch (logError) {
        // Don't fail the main operation if logging fails
        console.error("Failed to log activity:", logError)
      }

      toast.success("Operation completed successfully")
      
    } catch (error) {
      console.error("Operation failed:", error)
      toast.error("Operation failed")
    }
  }

  return null
}

// ============================================================================
// EXAMPLE 12: Conditional Logging
// ============================================================================

// Mock function for example
const fetchData = async (dataType: string) => {
  // Simulate data fetching
  return { dataType, timestamp: new Date().toISOString() }
}

export const ConditionalLoggingExample = () => {
  const handleDataAccess = async (dataType: string, isSensitive: boolean, accountId?: number) => {
    try {
      // Fetch data
      const data = await fetchData(dataType)

      // ✅ Only log sensitive data access
      if (isSensitive) {
        await logActivityClient({
          action: 'Viewed sensitive data',
          description: `Accessed ${dataType} containing sensitive information`,
          account_id: accountId
        })
      }

      return data
      
    } catch (error) {
      console.error("Error accessing data:", error)
    }
  }

  return null
}

// ============================================================================
// BEST PRACTICES SUMMARY
// ============================================================================

/**
 * BEST PRACTICES FOR ACTIVITY LOGGING:
 * 
 * 1. ✅ DO log:
 *    - Authentication events (login, logout, failed attempts)
 *    - CRUD operations (create, update, delete)
 *    - Bulk operations (imports, exports)
 *    - Security-related events
 *    - Configuration changes
 *    - Access to sensitive data
 * 
 * 2. ❌ DON'T log:
 *    - Every single page view (too noisy)
 *    - Passwords or sensitive credentials
 *    - Personal identification numbers
 *    - Payment information
 * 
 * 3. 📝 Description Guidelines:
 *    - Include entity names/IDs
 *    - Mention what changed
 *    - Be specific but concise
 *    - Include counts for bulk operations
 * 
 * 4. 🔒 Security:
 *    - Never log passwords
 *    - Don't fail main operations if logging fails
 *    - Use try/catch around logging calls
 *    - Validate all logged data
 * 
 * 5. 🎯 Performance:
 *    - Log asynchronously (don't block UI)
 *    - Don't log too frequently
 *    - Consider batching for high-frequency operations
 *    - Archive old logs periodically
 */

export default {
  LoginExample,
  StudentCreationExample,
  ProfileUpdateExample,
  DeleteOperationExample,
  BulkImportExample,
  ExportDataExample,
  ViewLoggingExample,
  AIToolsExample,
  SettingsChangeExample,
  SafeLoggingExample,
  ConditionalLoggingExample
}

