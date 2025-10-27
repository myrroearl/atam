"use client"

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, Download, HelpCircle, Save, Calculator, Plus, Search, Eye, EyeOff, Calendar, GraduationCap, ExternalLink, Edit3, Grid3X3, List, User, X, ArrowRight, CheckCircle2, AlertTriangle, AlertCircle, GripVertical, Edit, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ClassData, StudentGradeData, GradingWeights, VisibleComponents, AttendanceItem, ScoreItem, GoogleCourse, GoogleCoursework, GoogleScore, GradeComponent } from "@/lib/types/gradebook"
import { useGoogleClassroom, useGoogleClassroomAuth } from "@/hooks/use-google-classroom"
import { calculateFinalGrade, calculateComponentAverage, convertPercentageToPreciseGPA } from "@/lib/student/grade-calculations"

// Interface for user preferences that should be persisted
interface UserPreferences {
  activeTab: string // 'midterm', 'final', 'overall'
  mainTab: string // 'gradebook', 'analytics', 'leaderboards' 
  viewMode: 'grid' | 'list'
  searchTerm: string
  visibleComponents: VisibleComponents
  componentOrder: number[]
}

// Helper functions for localStorage management
const getStorageKey = (classId: number) => `gradebook-preferences-${classId}`

const saveUserPreferences = (classId: number, preferences: Partial<UserPreferences>) => {
  try {
    const storageKey = getStorageKey(classId)
    const existingPrefs = loadUserPreferences(classId)
    const updatedPrefs = { ...existingPrefs, ...preferences }
    localStorage.setItem(storageKey, JSON.stringify(updatedPrefs))
  } catch (error) {
    console.warn('Failed to save user preferences to localStorage:', error)
  }
}

const loadUserPreferences = (classId: number): Partial<UserPreferences> => {
  try {
    const storageKey = getStorageKey(classId)
    const saved = localStorage.getItem(storageKey)
    return saved ? JSON.parse(saved) : {}
  } catch (error) {
    console.warn('Failed to load user preferences from localStorage:', error)
    return {}
  }
}

// Helper function to format name as "Surname, First Name Middle"
const formatStudentName = (firstName: string, middleName: string | null, lastName: string): string => {
  const middle = middleName ? ` ${middleName}` : ''
  return `${lastName}, ${firstName}${middle}`
}

// Helper function to extract surname for sorting
const getSurname = (fullName: string): string => {
  // Name is already formatted as "Surname, First Middle"
  const parts = fullName.split(',')
  return parts[0].trim()
}

// Table components inline
const Table = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <table className={`w-full caption-bottom text-sm ${className}`}>{children}</table>
)
const TableHeader = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <thead className={`[&_tr]:border-b ${className}`}>{children}</thead>
)
const TableBody = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <tbody className={`[&_tr:last-child]:border-0 ${className}`}>{children}</tbody>
)
const TableRow = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <tr className={`group border-b border-l-4 border-l-transparent transition-all duration-200 hover:bg-primary/10 hover:border-l-primary hover:shadow-md active:bg-primary/20 cursor-pointer data-[state=selected]:bg-muted ${className}`}>{children}</tr>
)
const TableHead = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <th className={`h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 ${className}`}>
    {children}
  </th>
)
const TableCell = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <td className={`p-4 align-middle [&:has([role=checkbox])]:pr-0 transition-colors ${className}`}>
    {children}
  </td>
)

// Transform Supabase data to UI format with dynamic components
function transformClassDataToStudents(classData: ClassData, gradePeriod?: 'midterm' | 'final'): StudentGradeData[] {
  const studentMap = new Map<number, StudentGradeData>()

  // Initialize students with empty component arrays
  classData.students.forEach((student) => {
    // Format name as "Surname, First Name Middle"
    const fullName = formatStudentName(student.first_name, student.middle_name, student.last_name)
    const components: Record<number, (AttendanceItem | ScoreItem)[]> = {}
    
    // Initialize empty arrays for each component
    classData.gradeComponents.forEach((comp) => {
      components[comp.component_id] = []
    })

    studentMap.set(student.student_id, {
      student_id: student.student_id,
      name: fullName,
      email: student.email,
      components,
    })
  })

  // Organize grade entries by component, filtered by grade period if specified
  classData.gradeEntries.forEach((entry) => {
    // Filter by grade period if specified
    // If entry has no grade_period (null/undefined), show it in all tabs for backward compatibility
    if (gradePeriod && entry.grade_period && entry.grade_period !== gradePeriod) {
      return
    }

    const student = studentMap.get(entry.student_id)
    if (!student) return

    const component = classData.gradeComponents.find((c) => c.component_id === entry.component_id)
    if (!component) return

    const isImported = entry.entry_type === 'imported from gclass'

    // Check if this is an attendance component
    if (component.is_attendance) {
      const attendanceItem: AttendanceItem = {
        id: entry.grade_id,
        name: entry.name || `${component.component_name} ${student.components[entry.component_id].length + 1}`, // Use entry name from database
        date: new Date(entry.date_recorded).toISOString().split('T')[0],
        status: entry.attendance || null, // Allow null status for "Not marked" display
        imported: isImported,
        source: entry.entry_type,
        component_id: entry.component_id,
        grade_period: entry.grade_period || undefined,
        topics: (entry as any).topics || []
      } as AttendanceItem
      student.components[entry.component_id].push(attendanceItem)
    } else {
      const scoreItem: ScoreItem = {
        id: entry.grade_id,
        name: entry.name || component.component_name, // Use entry name from database
        date: new Date(entry.date_recorded).toISOString().split('T')[0],
        score: entry.score,
        total: entry.max_score,
        imported: isImported,
        source: entry.entry_type,
        component_id: entry.component_id,
        grade_period: entry.grade_period || undefined,
        topics: (entry as any).topics || []
      } as ScoreItem
      student.components[entry.component_id].push(scoreItem)
    }
  })

  // Sort entries within each component by date for all students
  studentMap.forEach(student => {
    Object.keys(student.components).forEach(componentId => {
      student.components[parseInt(componentId)].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })
    })
  })

  return Array.from(studentMap.values())
}

// Calculate grading weights from components
function calculateGradingWeights(components: ClassData['gradeComponents']): GradingWeights {
  const weights: GradingWeights = {}

  components.forEach((component) => {
    weights[component.component_id] = component.weight_percentage / 100
  })

  return weights
}

export function GradebookContent({ classData }: { classData: ClassData }) {
  const router = useRouter()
  
  // Google Classroom integration - automatically fetch data upon component mount
  const {
    courses: googleCourses,
    classwork: googleClasswork,
    isLoading: isGoogleLoading,
    isRefreshing: isGoogleRefreshing,
    error: googleError,
    refresh: refreshGoogleData,
    totalCourses,
    totalClasswork
  } = useGoogleClassroom()
  
  const { hasGoogleAccess, requiresReauth } = useGoogleClassroomAuth()
  
  // Transform class data to student grade data for different periods
  const initialMidtermStudents = useMemo(() => transformClassDataToStudents(classData, 'midterm'), [classData])
  const initialFinalStudents = useMemo(() => transformClassDataToStudents(classData, 'final'), [classData])
  const initialAllStudents = useMemo(() => transformClassDataToStudents(classData), [classData])
  
  const gradingWeights = useMemo(() => calculateGradingWeights(classData.gradeComponents), [classData.gradeComponents])
  
  // Initialize state with default values (no localStorage access during SSR)
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [activeTab, setActiveTab] = useState<string>("midterm")
  const [midtermStudents, setMidtermStudents] = useState<StudentGradeData[]>(initialMidtermStudents)
  const [finalStudents, setFinalStudents] = useState<StudentGradeData[]>(initialFinalStudents)
  const [allStudents, setAllStudents] = useState<StudentGradeData[]>(initialAllStudents)
  
  // Drag and drop state (declared early to be used in useEffect)
  const [draggedComponent, setDraggedComponent] = useState<number | null>(null)
  const [componentOrder, setComponentOrder] = useState<number[]>([])
  const [isDragging, setIsDragging] = useState<boolean>(false)
  
  // Track if preferences have been loaded from localStorage
  const [preferencesLoaded, setPreferencesLoaded] = useState<boolean>(false)
  
  // Sync state with memoized values when classData changes
  useEffect(() => {
    setMidtermStudents(initialMidtermStudents)
    setFinalStudents(initialFinalStudents)
    setAllStudents(initialAllStudents)
    
    // Capture original values from database when data first loads
    const originalValues = new Map<number, { score: number, status?: string }>()
    
    const captureOriginals = (students: StudentGradeData[]) => {
      students.forEach(student => {
        Object.values(student.components).forEach(items => {
          items.forEach(item => {
            if ('score' in item) {
              originalValues.set(item.id, { score: item.score })
            } else if ('status' in item) {
              originalValues.set(item.id, { 
                score: item.status === 'present' ? 10 : item.status === 'late' ? 5 : 0,
                status: item.status || undefined
              })
            }
          })
        })
      })
    }
    
    captureOriginals(initialAllStudents)
    setOriginalGradeValues(originalValues)
  }, [initialMidtermStudents, initialFinalStudents, initialAllStudents])
  
  // Initialize visible components based on actual components from database
  const initialVisibility = useMemo(() => {
    const visibility: VisibleComponents = {}
    classData.gradeComponents.forEach((comp) => {
      // Default to true during SSR, will be updated after localStorage loads
      visibility[comp.component_id] = true
    })
    return visibility
  }, [classData.gradeComponents])
  
  const [visibleComponents, setVisibleComponents] = useState<VisibleComponents>(initialVisibility)
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false)
  const [selectedComponent, setSelectedComponent] = useState<number | null>(null) // Now stores component_id
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false)
  // Legacy state - kept for backward compatibility but now uses Google Classroom hook data
  const [courses, setCourses] = useState<GoogleCourse[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [coursework, setCoursework] = useState<GoogleCoursework[]>([])
  const [selectedCoursework, setSelectedCoursework] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [topics, setTopics] = useState<string[]>([])
  const [currentTopic, setCurrentTopic] = useState<string>("")
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false)
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | string // 'name' or grade entry unique key (name-date)
    direction: 'asc' | 'desc'
    componentId?: number // Only used for grade entry sorting
  }>({
    key: 'name',
    direction: 'asc' // Default: sort by surname ascending
  })
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [changedGrades, setChangedGrades] = useState<Map<number, { score: number, gradeId: number, studentName: string, entryName: string, oldScore: number, isAttendance?: boolean, component_id?: number, studentId?: number }>>(new Map())
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState<boolean>(false)
  
  // Store original values from database for comparison
  const [originalGradeValues, setOriginalGradeValues] = useState<Map<number, { score: number, status?: string }>>(new Map())
  
  // Student synchronization state
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false)
  const [syncData, setSyncData] = useState<{
    matched: Array<{student_id: number, email: string, db_name: string, gc_name: string, match_type: string}>
    dbOnly: Array<{student_id: number, email: string, full_name: string}>
    gcOnly: Array<{userId: string, email: string, fullName: string}>
    totalMatched: number
    totalDbOnly: number
    totalGcOnly: number
  } | null>(null)
  const [isSyncLoading, setIsSyncLoading] = useState<boolean>(false)
  
  // Result and confirmation modals
  const [resultModal, setResultModal] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'warning'
    title: string
    message: string
    details?: string[]
  }>({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  })

  // General feedback modal for replacing alerts
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message: string
    details?: string[]
    preventAutoRefresh?: boolean
    onConfirm?: () => void
  }>({
    isOpen: false,
    type: 'info',
    title: '',
    message: ''
  })
  
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  })

  // Edit and Delete modals for grade entry headers
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false)
  const [selectedEntry, setSelectedEntry] = useState<{
    grade_id: number
    name: string
    date: string
    max_score?: number
    is_attendance: boolean
    component_id: number
  } | null>(null)
  const [editFormData, setEditFormData] = useState<{
    name: string
    date: string
    max_score: number
    topics: string[]
  }>({
    name: '',
    date: '',
    max_score: 0,
    topics: []
  })

  // Load preferences from localStorage only on client side after hydration
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const savedPreferences = loadUserPreferences(classData.class_id)
    
    // Load saved preferences
    if (savedPreferences.searchTerm) setSearchTerm(savedPreferences.searchTerm)
    if (savedPreferences.activeTab) setActiveTab(savedPreferences.activeTab)
    if (savedPreferences.viewMode) setViewMode(savedPreferences.viewMode)
    
    // Load component order
    if (savedPreferences.componentOrder && savedPreferences.componentOrder.length > 0) {
      setComponentOrder(savedPreferences.componentOrder)
    } else {
      // Initialize with default order if no saved order exists
      const defaultOrder = classData.gradeComponents.map(c => c.component_id)
      setComponentOrder(defaultOrder)
    }
    
    // Load visible components
    if (savedPreferences.visibleComponents) {
      const updatedVisibility: VisibleComponents = {}
      classData.gradeComponents.forEach((comp) => {
        updatedVisibility[comp.component_id] = savedPreferences.visibleComponents![comp.component_id] ?? true
      })
      setVisibleComponents(updatedVisibility)
    }
    
    setPreferencesLoaded(true)
  }, [classData.class_id, classData.gradeComponents])

  // Save all user preferences to localStorage whenever they change (only after preferences are loaded)
  useEffect(() => {
    if (!preferencesLoaded || componentOrder.length === 0) return
    saveUserPreferences(classData.class_id, { componentOrder })
  }, [componentOrder, classData.class_id, preferencesLoaded])

  useEffect(() => {
    if (!preferencesLoaded) return
    saveUserPreferences(classData.class_id, { activeTab })
  }, [activeTab, classData.class_id, preferencesLoaded])

  useEffect(() => {
    if (!preferencesLoaded) return
    saveUserPreferences(classData.class_id, { viewMode })
  }, [viewMode, classData.class_id, preferencesLoaded])

  // Debounce search term saving to avoid saving on every keystroke
  useEffect(() => {
    if (!preferencesLoaded) return
    
    const timeoutId = setTimeout(() => {
      saveUserPreferences(classData.class_id, { searchTerm })
    }, 500) // Save after 500ms of no typing

    return () => clearTimeout(timeoutId)
  }, [searchTerm, classData.class_id, preferencesLoaded])

  useEffect(() => {
    if (!preferencesLoaded) return
    saveUserPreferences(classData.class_id, { visibleComponents })
  }, [visibleComponents, classData.class_id, preferencesLoaded])

  // Get current students based on active tab
  const getCurrentStudents = () => {
    if (activeTab === 'midterm') return midtermStudents
    if (activeTab === 'final') return finalStudents
    return allStudents
  }

  const currentStudents = getCurrentStudents()

  // Navigation handler for student profile
  const handleStudentClick = (studentId: number) => {
    router.push(`/professor/student/${studentId}`)
  }

  // Helper function to show feedback modals (replaces alert calls)
  const showFeedback = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string, details?: string[], preventAutoRefresh?: boolean, onConfirm?: () => void) => {
    setFeedbackModal({
      isOpen: true,
      type,
      title,
      message,
      details,
      preventAutoRefresh,
      onConfirm
    })
  }

  // Keyboard navigation for grade input fields
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLButtonElement>, currentStudentIndex: number, currentEntryIndex: number, totalStudents: number, totalEntries: number) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      
      // Calculate next position
      let nextStudentIndex = currentStudentIndex
      let nextEntryIndex = currentEntryIndex
      
      if (e.shiftKey) {
        // Shift+Tab: move to previous student
        nextStudentIndex = currentStudentIndex - 1
        if (nextStudentIndex < 0) {
          nextStudentIndex = totalStudents - 1
          nextEntryIndex = currentEntryIndex - 1
          if (nextEntryIndex < 0) {
            nextEntryIndex = totalEntries - 1
          }
        }
      } else {
        // Tab: move to next student
        nextStudentIndex = currentStudentIndex + 1
        if (nextStudentIndex >= totalStudents) {
          nextStudentIndex = 0
          nextEntryIndex = currentEntryIndex + 1
          if (nextEntryIndex >= totalEntries) {
            nextEntryIndex = 0
          }
        }
      }
      
      // Find the next input field (try both grade input and attendance select)
      const nextInputId = `grade-input-${nextStudentIndex}-${nextEntryIndex}`
      const nextAttendanceId = `attendance-select-${nextStudentIndex}-${nextEntryIndex}`
      
      let nextInput = document.getElementById(nextInputId)
      if (!nextInput) {
        nextInput = document.getElementById(nextAttendanceId)
      }
      
      if (nextInput) {
        nextInput.focus()
        if (nextInput.tagName === 'INPUT') {
          (nextInput as HTMLInputElement).select() // Select the text for easy editing
        }
      }
    }
  }

  // Enhanced Google Classroom data fetching - now uses the hook
  const fetchGoogleCourses = async () => {
    try {
      setIsLoading(true)
      
      // Use the hook's refresh function for better error handling and caching
      await refreshGoogleData()
      
      // Update local state with hook data for backward compatibility
      setCourses(googleCourses)
      
    } catch (error) {
      console.error('Error fetching Google Classroom courses:', error)
      if (requiresReauth) {
        showFeedback('error', 'Google Classroom Access Expired', 'Please reconnect your account to continue using Google Classroom features.')
      } else {
        showFeedback('error', 'Failed to Fetch Courses', googleError || 'Failed to fetch Google Classroom courses')
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced coursework fetching - now uses pre-loaded data from hook
  const fetchGoogleCoursework = async (courseId: string) => {
    try {
      setIsLoading(true)
      
      // Use pre-loaded classwork data from the hook
      const courseClasswork = googleClasswork[courseId] || []
      
      if (courseClasswork.length > 0) {
        // Use pre-loaded data
        setCoursework(courseClasswork)
        console.log(`[Google Classroom] Using pre-loaded classwork for course ${courseId}: ${courseClasswork.length} items`)
      } else {
        // Fallback to API call if data not available
        console.log(`[Google Classroom] No pre-loaded classwork found for course ${courseId}, fetching from API...`)
        const response = await fetch(`/api/professor/google-classroom?action=coursework&courseId=${courseId}`)
        const data = await response.json()
        
        if (response.ok) {
          setCoursework(data.coursework || [])
        } else if (response.status === 401) {
          showFeedback('error', 'Google Classroom Access Expired', 'Please reconnect your account to continue using Google Classroom features.')
        } else {
          throw new Error(data.error || 'Failed to fetch coursework')
        }
      }
    } catch (error) {
      console.error('Error fetching coursework:', error)
      showFeedback('error', 'Failed to Fetch Coursework', googleError || 'Failed to fetch coursework')
    } finally {
      setIsLoading(false)
    }
  }

  // Import scores from Google Classroom using synchronization system
  const importGoogleScores = async () => {
    if (!selectedCourse || !selectedCoursework || selectedComponent === null) {
      showFeedback('warning', 'Missing Selection', 'Please select a course, classwork, and grade component before importing.')
      return
    }

    try {
      setIsLoading(true)
      
      // Determine current grade period based on active tab
      const currentGradePeriod = activeTab === 'midterm' || activeTab === 'final' ? activeTab : 'midterm'
      
      // Use the new synchronization API
      const response = await fetch('/api/professor/sync-scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: classData.class_id,
          course_id: selectedCourse,
          coursework_id: selectedCoursework,
          component_id: selectedComponent,
          grade_period: currentGradePeriod,
          topics: topics
        })
      })
      
      const data = await response.json()
      
      if (response.ok) {
        const componentName = classData.gradeComponents.find(c => c.component_id === selectedComponent)?.component_name || 'component'
        
        // Close modals
        setIsGoogleModalOpen(false)
        setIsAddModalOpen(false)
        setTopics([])
        setCurrentTopic("")
        
        // Show success message with detailed results
        const resultMessage = data.message || 'Import completed successfully'
        const details = data.data || {}
        
        if (details.matchedStudents > 0 || details.placeholderEntries > 0) {
          const messageLines = [
            'Import Summary:',
            `• Matched students with scores: ${details.matchedStudents || 0}`,
            `• Placeholder entries created: ${details.placeholderEntries || 0}`,
            `• Total entries created: ${details.totalEntries || 0}`,
            `• Skipped students: ${details.skippedStudents || 0}`,
            '',
            'Assignment Details:',
            `• Assignment: ${details.courseworkTitle}`,
            `• Component: ${componentName}`,
            `• Type: ${details.componentType || 'score-based'}`
          ]
          
          if (details.placeholderEntries > 0) {
            messageLines.push(
              '',
              '📝 Note: Students not in Google Classroom have placeholder entries (score = 0) that can be edited later.'
            )
          }
          
          showFeedback('success', 'Import Completed Successfully', resultMessage, messageLines, true, () => {
            // Refresh the page to show updated data
            window.location.reload()
          })
        } else {
          showFeedback('info', 'Import Completed', `${resultMessage}\n\nNo grade entries were created.`, undefined, true, () => {
            // Refresh the page to show updated data
            window.location.reload()
          })
        }
      } else if (response.status === 401) {
        showFeedback('error', 'Google Classroom Access Expired', 'Please reconnect your account to continue using Google Classroom features.')
      } else if (response.status === 403) {
        showFeedback('error', 'Insufficient Permissions', 'Insufficient permissions for Google Classroom. Please check your account permissions.')
      } else if (response.status === 404) {
        showFeedback('error', 'Not Found', 'Course or assignment not found. Please check your selection.')
      } else {
        throw new Error(data.error || 'Failed to import scores')
      }
    } catch (error) {
      console.error('Error importing scores:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showFeedback('error', 'Import Failed', `Failed to import scores from Google Classroom: ${errorMessage}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Enhanced course selection handler - uses pre-loaded data
  const handleCourseChange = (courseId: string) => {
    setSelectedCourse(courseId)
    setSelectedCoursework('')
    
    if (courseId) {
      // Check if we have pre-loaded classwork data
      const courseClasswork = googleClasswork[courseId] || []
      
      if (courseClasswork.length > 0) {
        // Use pre-loaded data immediately
        setCoursework(courseClasswork)
        console.log(`[Google Classroom] Auto-loaded ${courseClasswork.length} classwork items for course ${courseId}`)
      } else {
        // Fetch from API if not pre-loaded
        setCoursework([])
        fetchGoogleCoursework(courseId)
      }
    } else {
      setCoursework([])
    }
  }

  // Enhanced modal open handler - uses pre-loaded data when available
  const handleGoogleModalOpen = () => {
    setIsGoogleModalOpen(true)
    
    // Use pre-loaded courses if available, otherwise fetch
    if (googleCourses.length > 0) {
      setCourses(googleCourses)
      console.log(`[Google Classroom] Using pre-loaded ${googleCourses.length} courses`)
    } else if (courses.length === 0) {
      fetchGoogleCourses()
    }
  }

  // Fetch student synchronization preview
  const fetchStudentSyncPreview = async () => {
    if (!selectedCourse) {
      showFeedback('warning', 'No Course Selected', 'Please select a Google Classroom course first.')
      return
    }

    try {
      setIsSyncLoading(true)
      const response = await fetch(
        `/api/professor/sync-students?class_id=${classData.class_id}&course_id=${selectedCourse}`
      )
      const data = await response.json()
      
      if (response.ok) {
        setSyncData(data.sync)
        setIsSyncModalOpen(true)
      } else if (response.status === 401) {
        showFeedback('error', 'Google Classroom Access Expired', 'Please reconnect your account to continue using Google Classroom features.')
      } else if (response.status === 403) {
        showFeedback('error', 'Insufficient Permissions', 'Insufficient permissions for Google Classroom. Please check your account permissions.')
      } else if (response.status === 404) {
        showFeedback('error', 'Course Not Found', 'Course not found. Please check your selection.')
      } else {
        throw new Error(data.error || 'Failed to fetch sync preview')
      }
    } catch (error) {
      console.error('Error fetching sync preview:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      showFeedback('error', 'Sync Preview Failed', `Failed to fetch student synchronization preview: ${errorMessage}`)
    } finally {
      setIsSyncLoading(false)
    }
  }

  // Handle adding a topic tag
  const handleAddTopic = () => {
    if (currentTopic.trim() && !topics.includes(currentTopic.trim())) {
      setTopics([...topics, currentTopic.trim()])
      setCurrentTopic("")
    }
  }

  // Handle adding a topic tag for edit modal
  const handleAddTopicEdit = () => {
    if (currentTopic.trim() && !editFormData.topics.includes(currentTopic.trim())) {
      setEditFormData(prev => ({
        ...prev,
        topics: [...prev.topics, currentTopic.trim()]
      }))
      setCurrentTopic("")
    }
  }

  // Handle removing a topic tag
  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove))
  }

  // Handle removing a topic tag from edit form
  const handleRemoveTopicEdit = (topicToRemove: string) => {
    setEditFormData(prev => ({
      ...prev,
      topics: prev.topics.filter(topic => topic !== topicToRemove)
    }))
  }

  // Handle Enter key press in topic input
  const handleTopicKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTopic()
    }
  }

  // Handle Enter key press in topic input for edit modal
  const handleTopicKeyDownEdit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTopicEdit()
    }
  }

  // Handle edit grade entry header
  const handleEditEntry = (entry: any, component: GradeComponent) => {
    // Ensure topics are properly loaded from the database entry
    const existingTopics = Array.isArray(entry.topics) ? entry.topics : []
    
    setSelectedEntry({
      grade_id: entry.id,
      name: entry.name,
      date: entry.date,
      max_score: entry.total || 0,
      is_attendance: component.is_attendance || false,
      component_id: component.component_id
    })
    setEditFormData({
      name: entry.name,
      date: entry.date,
      max_score: entry.total || 0,
      topics: existingTopics
    })
    // Clear current topic input when opening edit modal
    setCurrentTopic("")
    setIsEditModalOpen(true)
  }

  // Handle delete grade entry header
  const handleDeleteEntry = (entry: any, component: GradeComponent) => {
    setSelectedEntry({
      grade_id: entry.id,
      name: entry.name,
      date: entry.date,
      max_score: entry.total || 0,
      is_attendance: component.is_attendance || false,
      component_id: component.component_id
    })
    setIsDeleteModalOpen(true)
  }

  // Save edited grade entry header
  const handleSaveEdit = async () => {
    if (!selectedEntry) return

    try {
      setIsLoading(true)
      
      const response = await fetch('/api/professor/grade-entries', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grade_id: selectedEntry.grade_id,
          update_type: 'header',
          name: editFormData.name,
          date_recorded: editFormData.date,
          max_score: selectedEntry.is_attendance ? undefined : editFormData.max_score,
          is_attendance: selectedEntry.is_attendance,
          topics: editFormData.topics
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update grade entry')
      }

      // Close modal and refresh page to show changes
      setIsEditModalOpen(false)
      setSelectedEntry(null)
      
      setResultModal({
        isOpen: true,
        type: 'success',
        title: 'Entry Updated Successfully!',
        message: `Successfully updated "${editFormData.name}" for all students.`
      })

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Error updating grade entry:', error)
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Update Failed',
        message: error instanceof Error ? error.message : 'Failed to update grade entry'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Delete grade entry header
  const handleConfirmDelete = async () => {
    if (!selectedEntry) return

    try {
      setIsLoading(true)
      
      const response = await fetch(`/api/professor/grade-entries?grade_id=${selectedEntry.grade_id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete grade entry')
      }

      // Close modal and refresh page to show changes
      setIsDeleteModalOpen(false)
      setSelectedEntry(null)
      
      setResultModal({
        isOpen: true,
        type: 'success',
        title: 'Entry Deleted Successfully!',
        message: `Successfully deleted "${result.data?.[0]?.name || 'entry'}" for ${result.deletedCount || 0} students.`
      })

      // Refresh the page after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 1500)

    } catch (error) {
      console.error('Error deleting grade entry:', error)
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Delete Failed',
        message: error instanceof Error ? error.message : 'Failed to delete grade entry'
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle manual entry
  const handleManualEntry = async () => {
    if (selectedComponent === null) return

    const nameInput = document.getElementById('name') as HTMLInputElement
    const dateInput = document.getElementById('date') as HTMLInputElement
    const totalInput = document.getElementById('total') as HTMLInputElement

    if (!nameInput?.value || !dateInput?.value) {
      showFeedback('warning', 'Missing Required Fields', 'Please fill in the name and date fields')
      return
    }

    const component = classData.gradeComponents.find(c => c.component_id === selectedComponent)
    if (!component) return

    // Determine current grade period based on active tab
    const currentGradePeriod = activeTab === 'midterm' || activeTab === 'final' ? activeTab : 'midterm'

    // Prepare data for API call
    const studentIds = currentStudents.map(s => s.student_id)
    const totalPoints = component.is_attendance ? 10 : (parseInt(totalInput?.value) || 100)

    try {
      setIsLoading(true)

      // Call API to insert grade entries into Supabase
      const response = await fetch('/api/professor/grade-entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: classData.class_id,
          component_id: selectedComponent,
          students: studentIds,
          name: nameInput.value,
          date_recorded: dateInput.value,
          max_score: totalPoints,
          grade_period: currentGradePeriod,
          is_attendance: component.is_attendance || false,
          topics: topics
        })
      })

      const result = await response.json()

      if (!response.ok) {
        console.error('API Error Response:', result)
        const errorMsg = result.details || result.error || 'Failed to create grade entries'
        throw new Error(errorMsg)
      }

      // Update client-side state with new entries from database
      if (component.is_attendance) {
        const newAttendanceItems = result.data.map((entry: any) => ({
          id: entry.grade_id,
          name: entry.name,
          date: new Date(entry.date_recorded).toISOString().split('T')[0],
          status: entry.attendance || null, // Allow null for "Not marked" display
          imported: false,
          source: 'manual' as const,
          component_id: selectedComponent,
          grade_period: entry.grade_period as 'midterm' | 'final'
        }))

        const updatedStudents = currentStudents.map(student => {
          const studentEntry = newAttendanceItems.find((item: any) => 
            result.data.some((d: any) => d.student_id === student.student_id && d.grade_id === item.id)
          )
          return {
        ...student,
        components: {
          ...student.components,
              [selectedComponent]: [...(student.components[selectedComponent] || []), studentEntry]
            }
          }
        })

        // Update the appropriate state based on active tab
        if (activeTab === 'midterm') {
          setMidtermStudents(updatedStudents)
        } else if (activeTab === 'final') {
          setFinalStudents(updatedStudents)
        }
        setAllStudents(prev => prev.map((student, idx) => ({
          ...student,
          components: {
            ...student.components,
            [selectedComponent]: [...(student.components[selectedComponent] || []), newAttendanceItems[idx]]
          }
        })))
    } else {
        const newScoreItems = result.data.map((entry: any) => ({
          id: entry.grade_id,
          name: entry.name,
          date: new Date(entry.date_recorded).toISOString().split('T')[0],
          score: entry.score,
          total: entry.max_score,
        imported: false,
          source: 'manual' as const,
          component_id: selectedComponent,
          grade_period: entry.grade_period as 'midterm' | 'final'
        }))

        const updatedStudents = currentStudents.map((student, idx) => ({
        ...student,
        components: {
          ...student.components,
            [selectedComponent]: [...(student.components[selectedComponent] || []), newScoreItems[idx]]
          }
        }))

        // Update the appropriate state based on active tab
        if (activeTab === 'midterm') {
          setMidtermStudents(updatedStudents)
        } else if (activeTab === 'final') {
          setFinalStudents(updatedStudents)
        }
        setAllStudents(prev => prev.map((student, idx) => ({
          ...student,
          components: {
            ...student.components,
            [selectedComponent]: [...(student.components[selectedComponent] || []), newScoreItems[idx]]
          }
        })))
    }

    setIsAddModalOpen(false)
      setTopics([]) // Clear topics after adding
      setCurrentTopic("")
      showFeedback('success', 'Entry Added Successfully', `Successfully added new ${component.component_name} item to ${currentGradePeriod} for ${studentIds.length} students!`, undefined, true, () => {
        // Refresh the page to show the new entry with edit/delete buttons
        window.location.reload()
      })

    } catch (error) {
      console.error('Error creating grade entries:', error)
      showFeedback('error', 'Failed to Create Entries', `Failed to create grade entries: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle modal close to reset topics
  const handleModalClose = (open: boolean) => {
    setIsAddModalOpen(open)
    if (!open) {
      setTopics([])
      setCurrentTopic("")
    }
  }

  // Handle score change tracking
  const handleScoreChange = (gradeId: number, newScore: number, studentName: string, entryName: string, oldScore: number, componentId?: number, studentId?: number) => {
    // Get the original value from database, not the current state value
    const originalValue = originalGradeValues.get(gradeId)
    const originalScore = originalValue?.score ?? oldScore
    
    const updatedChanges = new Map(changedGrades)
    updatedChanges.set(gradeId, { 
      score: newScore, 
      gradeId,
      studentName,
      entryName,
      oldScore: originalScore, // Use original database value
      component_id: componentId,
      studentId: studentId
    })
    setChangedGrades(updatedChanges)
    setHasUnsavedChanges(true)
    
    // Update the UI immediately by updating the student data in state
    const updateStudentData = (students: StudentGradeData[]) => {
      return students.map(student => {
        if (student.name !== studentName) return student
        
        // Update the specific score item
        const updatedComponents = { ...student.components }
        Object.keys(updatedComponents).forEach(componentId => {
          const items = updatedComponents[parseInt(componentId)]
          updatedComponents[parseInt(componentId)] = items.map(item => {
            if (item.id === gradeId && 'score' in item) {
              return { ...item, score: newScore }
            }
            return item
          })
        })
        
        return { ...student, components: updatedComponents }
      })
    }
    
    // Update the appropriate state based on active tab
    if (activeTab === 'midterm') {
      setMidtermStudents(prev => updateStudentData(prev))
    } else if (activeTab === 'final') {
      setFinalStudents(prev => updateStudentData(prev))
    }
    setAllStudents(prev => updateStudentData(prev))
  }

  // Handle attendance change tracking
  const handleAttendanceChange = (gradeId: number, newStatus: string, studentName: string, entryName: string, oldStatus: string | null, componentId?: number, studentId?: number) => {
    // Get the original value from database, not the current state value
    const originalValue = originalGradeValues.get(gradeId)
    const originalScore = originalValue?.score ?? (oldStatus === 'present' ? 10 : oldStatus === 'late' ? 5 : 0)
    
    const updatedChanges = new Map(changedGrades)
    // Convert attendance status to score: present=10, late=5, absent=0, null/empty=0
    const newScore = newStatus === 'present' ? 10 : newStatus === 'late' ? 5 : newStatus === 'absent' ? 0 : 0
    
    updatedChanges.set(gradeId, { 
      score: newScore, 
      gradeId,
      studentName,
      entryName,
      oldScore: originalScore, // Use original database value
      isAttendance: true,
      component_id: componentId,
      studentId: studentId
    })
    setChangedGrades(updatedChanges)
    setHasUnsavedChanges(true)
    
    // Update the UI immediately by updating the student data in state
    const updateStudentData = (students: StudentGradeData[]) => {
      return students.map(student => {
        if (student.name !== studentName) return student
        
        // Update the specific attendance item
        const updatedComponents = { ...student.components }
        Object.keys(updatedComponents).forEach(componentId => {
          const items = updatedComponents[parseInt(componentId)]
          updatedComponents[parseInt(componentId)] = items.map(item => {
            if (item.id === gradeId && 'status' in item) {
              return { ...item, status: newStatus as 'present' | 'absent' | 'late' | null, score: newScore }
            }
            return item
          })
        })
        
        return { ...student, components: updatedComponents }
      })
    }
    
    // Update the appropriate state based on active tab
    if (activeTab === 'midterm') {
      setMidtermStudents(prev => updateStudentData(prev))
    } else if (activeTab === 'final') {
      setFinalStudents(prev => updateStudentData(prev))
    }
    setAllStudents(prev => updateStudentData(prev))
  }

  // Handle save all changes
  const handleSaveChanges = async () => {
    if (changedGrades.size === 0) return

    setIsSaving(true)
    let successCount = 0
    let errorCount = 0
    const errors: string[] = []
    const successfulChanges: Array<{ score: number, gradeId: number, studentName: string, entryName: string, oldScore: number, isAttendance?: boolean, component_id?: number, studentId?: number }> = []

    try {
      // Save each changed grade
      for (const [gradeId, change] of changedGrades) {
        try {
          const response = await fetch('/api/professor/grade-entries', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              grade_id: gradeId,
              score: change.score,
              is_attendance: false, // Will be determined by API based on component
              skip_individual_logging: true // Skip individual logging since we'll log bulk changes
            })
          })

          const result = await response.json()

          if (!response.ok) {
            throw new Error(result.details || result.error || 'Failed to save')
          }

          successCount++
          successfulChanges.push(change) // Track successful changes for logging
        } catch (error) {
          errorCount++
          errors.push(`${change.studentName} - ${change.entryName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
          console.error(`Error saving grade ${gradeId}:`, error)
        }
      }

      // Log bulk score changes activity only once for all successful changes
      if (successfulChanges.length > 0) {
        try {
          // Group changes by component_id to log them separately
          const changesByComponent = new Map<number, typeof successfulChanges>()
          
          successfulChanges.forEach(change => {
            const componentId = change.component_id || 1
            if (!changesByComponent.has(componentId)) {
              changesByComponent.set(componentId, [])
            }
            changesByComponent.get(componentId)!.push(change)
          })

          // Log each component's changes separately
          for (const [componentId, changes] of changesByComponent) {
            const scoreChanges = changes.map(change => ({
              student_id: change.studentId || 0,
              student_name: change.studentName,
              old_score: change.oldScore,
              new_score: change.score,
              entry_name: change.entryName
            }))

            if (scoreChanges.length > 0) {
              await fetch('/api/professor/log-score-changes', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  class_id: classData.class_id,
                  component_id: componentId,
                  score_changes: scoreChanges
                })
              })
            }
          }
        } catch (logError) {
          console.error("Failed to log bulk score changes:", logError)
          // Don't fail the save operation if logging fails
        }
      }

      // Show results
      if (errorCount === 0) {
        setResultModal({
          isOpen: true,
          type: 'success',
          title: 'Changes Saved Successfully!',
          message: `Successfully saved ${successCount} grade${successCount !== 1 ? 's' : ''}.`
        })
        setHasUnsavedChanges(false)
        setChangedGrades(new Map())
        
        // Update original values with the new saved values
        const newOriginalValues = new Map(originalGradeValues)
        changedGrades.forEach((change, gradeId) => {
          newOriginalValues.set(gradeId, { 
            score: change.score,
            status: change.isAttendance ? scoreToAttendanceStatus(change.score).toLowerCase() : undefined
          })
        })
        setOriginalGradeValues(newOriginalValues)
        
        // Refresh after modal closes
        setTimeout(() => {
          window.location.reload()
        }, 1500)
      } else {
        setResultModal({
          isOpen: true,
          type: 'warning',
          title: 'Partially Saved',
          message: `Saved ${successCount} grade${successCount !== 1 ? 's' : ''}, but ${errorCount} failed.`,
          details: errors
        })
        // Remove successfully saved items from changed grades
        const remainingChanges = new Map(changedGrades)
        changedGrades.forEach((change, id) => {
          if (!errors.some(e => e.includes(change.studentName))) {
            remainingChanges.delete(id)
          }
        })
        setChangedGrades(remainingChanges)
        setHasUnsavedChanges(remainingChanges.size > 0)
      }
    } catch (error) {
      console.error('Error saving changes:', error)
      setResultModal({
        isOpen: true,
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'An unknown error occurred while saving changes.'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle discard changes
  const handleDiscardChanges = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Discard Changes?',
      message: `Are you sure you want to discard ${changedGrades.size} unsaved change${changedGrades.size !== 1 ? 's' : ''}? This action cannot be undone.`,
      onConfirm: () => {
        setChangedGrades(new Map())
        setHasUnsavedChanges(false)
        setConfirmModal({ ...confirmModal, isOpen: false })
        // Refresh page to reset all values
        window.location.reload()
      }
    })
  }

  const calculateAttendanceAverage = (items: (AttendanceItem | ScoreItem)[]): number => {
    const attendanceItems = items.filter((item): item is AttendanceItem => 'status' in item)
    if (!attendanceItems.length) return 0
    const presentCount = attendanceItems.filter(a => a.status === "present").length
    const lateCount = attendanceItems.filter(a => a.status === "late").length
    return Math.round(((presentCount + (lateCount * 0.5)) / attendanceItems.length) * 100)
  }

  const calculateScoreAverage = (items: (AttendanceItem | ScoreItem)[]): number => {
    const scoreItems = items.filter((item): item is ScoreItem => 'score' in item)
    if (!scoreItems.length) return 0
    const totalEarned = scoreItems.reduce((sum, score) => sum + score.score, 0)
    const totalPossible = scoreItems.reduce((sum, score) => sum + score.total, 0)
    if (totalPossible === 0) return 0
    return Math.round((totalEarned / totalPossible) * 100)
  }

  const calculateStudentComponentAverage = (component_id: number, items: (AttendanceItem | ScoreItem)[]): number => {
    const component = classData.gradeComponents.find(c => c.component_id === component_id)
    if (!component) return 0
    
    // Convert items to GradeEntry format for unified calculation
    const gradeEntries = items.map(item => ({
      student_id: 0, // Not needed for component average calculation
      score: 'score' in item ? item.score : null,
      max_score: 'total' in item ? item.total : 10,
      attendance: 'status' in item ? item.status : null,
      component_id: component_id,
      name: item.name,
      date_recorded: item.date,
      grade_period: item.grade_period
    }))
    
    return calculateComponentAverage(component, gradeEntries)
  }

  const calculateStudentFinalGrade = (student: StudentGradeData): number => {
    // Convert student data to format expected by unified calculation
    const convertedStudent = {
      student_id: student.student_id,
      name: student.name,
      email: student.email,
      components: {} as Record<number, any[]>
    }

    // Convert each component's items to GradeEntry format
    Object.keys(student.components).forEach(componentIdStr => {
      const componentId = parseInt(componentIdStr)
      const items = student.components[componentId] || []
      
      convertedStudent.components[componentId] = items.map(item => ({
        student_id: student.student_id,
        score: 'score' in item ? item.score : null,
        max_score: 'total' in item ? item.total : 10,
        attendance: 'status' in item ? item.status : null,
        component_id: componentId,
        name: item.name,
        date_recorded: item.date,
        grade_period: item.grade_period
      }))
    })

    return calculateFinalGrade(convertedStudent, classData.gradeComponents)
  }

  const getGWA = (grade: number): string => {
    return convertPercentageToPreciseGPA(grade).toFixed(2)
  }

  const getGradeColor = (grade: number): string => {
    if (grade >= 90) return "text-green-600 dark:text-green-400"
    if (grade >= 80) return "text-blue-600 dark:text-blue-400"
    if (grade >= 70) return "text-yellow-600 dark:text-yellow-400"
    return "text-red-600 dark:text-red-400"
  }

  const getAttendanceColor = (status: string): string => {
    switch (status) {
      case "present": return "text-green-600 dark:text-green-400"
      case "late": return "text-yellow-600 dark:text-yellow-400"
      case "absent": return "text-red-600 dark:text-red-400"
      default: return ""
    }
  }

  // Convert score to attendance status for display
  const scoreToAttendanceStatus = (score: number): string => {
    if (score >= 10) return "Present"
    if (score >= 5 && score < 10) return "Late"
    if (score === 0) return "Absent"
    return "Not marked"
  }

  // Filter and sort students
  const filteredStudents = React.useMemo(() => {
    // First, filter students
    let filtered = currentStudents.filter(student =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Then, sort filtered students
    const sorted = [...filtered].sort((a, b) => {
      if (sortConfig.key === 'name') {
        // Sort by surname
        const surnameA = getSurname(a.name)
        const surnameB = getSurname(b.name)
        const comparison = surnameA.localeCompare(surnameB)
        return sortConfig.direction === 'asc' ? comparison : -comparison
      } else {
        // Sort by specific grade entry
        if (sortConfig.componentId === undefined) return 0
        
        const itemsA = a.components[sortConfig.componentId] || []
        const itemsB = b.components[sortConfig.componentId] || []
        
        // Find the matching entry by the unique key
        const entryA = itemsA.find(item => `${item.name}-${item.date}` === sortConfig.key)
        const entryB = itemsB.find(item => `${item.name}-${item.date}` === sortConfig.key)
        
        // Get scores for comparison
        let scoreA = 0
        let scoreB = 0
        
        if (entryA) {
          if ('score' in entryA) {
            // Score-based: calculate percentage
            scoreA = entryA.total > 0 ? (entryA.score / entryA.total) * 100 : 0
          } else if ('status' in entryA) {
            // Attendance-based: convert to percentage
            scoreA = entryA.status === 'present' ? 100 : entryA.status === 'late' ? 50 : 0
          }
        }
        
        if (entryB) {
          if ('score' in entryB) {
            scoreB = entryB.total > 0 ? (entryB.score / entryB.total) * 100 : 0
          } else if ('status' in entryB) {
            scoreB = entryB.status === 'present' ? 100 : entryB.status === 'late' ? 50 : 0
          }
        }
        
        // Sort by score
        const comparison = scoreA - scoreB
        return sortConfig.direction === 'desc' ? comparison : -comparison // Note: reversed for scores (high to low is default)
      }
    })

    return sorted
  }, [currentStudents, searchTerm, sortConfig])

  const toggleComponentVisibility = (componentId: number): void => {
    setVisibleComponents(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }))
  }

  // Handle sorting
  const handleSort = (key: 'name' | string, componentId?: number) => {
    setSortConfig(prevConfig => {
      // If clicking the same column, toggle direction
      if (prevConfig.key === key && prevConfig.componentId === componentId) {
        return {
          ...prevConfig,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      }
      // If clicking a new column, set it as the sort key with default direction
      return {
        key,
        direction: key === 'name' ? 'asc' : 'desc', // Name defaults to asc, scores default to desc (highest first)
        componentId
      }
    })
  }

  // Get sort icon for a column
  const getSortIcon = (key: 'name' | string, componentId?: number) => {
    if (sortConfig.key !== key || sortConfig.componentId !== componentId) {
      return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3 w-3 text-primary" />
      : <ArrowDown className="h-3 w-3 text-primary" />
  }

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, componentId: number) => {
    setDraggedComponent(componentId)
    setIsDragging(true)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/html', e.currentTarget.innerHTML)
    
    // Add drag image with slight opacity
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5'
    }
  }

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedComponent(null)
    setIsDragging(false)
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, targetComponentId: number) => {
    e.preventDefault()
    
    if (draggedComponent === null || draggedComponent === targetComponentId) {
      return
    }

    const newOrder = [...componentOrder]
    const draggedIndex = newOrder.indexOf(draggedComponent)
    const targetIndex = newOrder.indexOf(targetComponentId)

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1)
    newOrder.splice(targetIndex, 0, draggedComponent)

    setComponentOrder(newOrder)
  }

  // Get sorted components based on saved order
  const getSortedComponents = React.useCallback(() => {
    if (!componentOrder || componentOrder.length === 0) {
      return classData.gradeComponents
    }

    return componentOrder
      .map(id => classData.gradeComponents.find(c => c.component_id === id))
      .filter((c): c is GradeComponent => c !== undefined)
  }, [componentOrder, classData.gradeComponents])

  

  const renderGradingComponentTable = (gradeComponent: GradeComponent) => {
    if (!visibleComponents[gradeComponent.component_id]) return null

    // Get all unique entries for this component from all students and sort by date
    const allEntries = new Map<string, any>()
    
    filteredStudents.forEach(student => {
      const items = student.components[gradeComponent.component_id] || []
      items.forEach(item => {
        const uniqueKey = `${item.name}-${item.date}`
        if (!allEntries.has(uniqueKey)) {
          allEntries.set(uniqueKey, item)
        }
      })
    })

    // Sort entries by date in ascending order (oldest to newest)
    const componentData = Array.from(allEntries.values()).sort((a, b) => {
      return new Date(a.date).getTime() - new Date(b.date).getTime()
    })

    const isAttendance = gradeComponent.is_attendance || false
    const isBeingDragged = draggedComponent === gradeComponent.component_id

    return (
      <Card 
        key={gradeComponent.component_id}
        className={`mb-6 transition-all duration-300 ${
          isBeingDragged ? 'scale-105 shadow-2xl ring-2 ring-primary' : 'shadow-md hover:shadow-lg'
        } ${isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'}`}
        draggable
        onDragStart={(e) => handleDragStart(e, gradeComponent.component_id)}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, gradeComponent.component_id)}
        style={{
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none'
        }}
      >
        <CardHeader>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="flex items-center text-muted-foreground hover:text-primary transition-colors">
                <GripVertical className="h-6 w-6" />
              </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                {gradeComponent.component_name}
                <Badge variant="outline">{gradeComponent.weight_percentage}%</Badge>
              </CardTitle>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => {
                  setSelectedComponent(gradeComponent.component_id)
                  setIsAddModalOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Entry
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleComponentVisibility(gradeComponent.component_id)}
              >
                <EyeOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ maxWidth: "calc(100vw - 320px)" }}>
            <div className="p-6 min-w-fit">
              <Table key={`${gradeComponent.component_id}-${filteredStudents.length}`}>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-auto p-1 hover:bg-accent font-medium flex items-center gap-1"
                    >
                      Student Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  {(componentData as any[]).map((item: any, index: number) => (
                    <TableHead key={index} className="text-center min-w-[120px]">
                      <div className="text-xs">
                        <div className="font-medium flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSort(`${item.name}-${item.date}`, gradeComponent.component_id)}
                            className="h-auto p-1 hover:bg-accent text-xs flex items-center gap-1"
                          >
                            {item.name}
                            {getSortIcon(`${item.name}-${item.date}`, gradeComponent.component_id)}
                          </Button>
                          {item.imported && (
                            <Tooltip>
                              <TooltipTrigger>
                                <GraduationCap className="h-3 w-3 text-blue-500" />
                              </TooltipTrigger>
                              <TooltipContent>Imported from Google Classroom</TooltipContent>
                            </Tooltip>
                          )}
                          {item.source === 'manual entry' && (
                            <Tooltip>
                              <TooltipTrigger>
                                <Edit3 className="h-3 w-3 text-gray-500" />
                              </TooltipTrigger>
                              <TooltipContent>Manual Entry</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                        <div className="text-muted-foreground">
                          {new Date(item.date).toLocaleDateString()}
                          {!isAttendance && 'total' in item && ` (${item.total} pts)`}
                        </div>
                        {/* Edit and Delete buttons for manual and imported (Google Classroom) entries */}
                        {(item.source === 'manual entry' || item.imported) && (
                          <div className="flex justify-center gap-1 mt-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                                  onClick={() => handleEditEntry(item, gradeComponent)}
                                >
                                  <Edit className="h-3 w-3 text-blue-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit Entry</TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                                  onClick={() => handleDeleteEntry(item, gradeComponent)}
                                >
                                  <Trash2 className="h-3 w-3 text-red-600" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete Entry</TooltipContent>
                            </Tooltip>
                          </div>
                        )}
                      </div>
                    </TableHead>
                  ))}
                  <TableHead className="text-center font-bold">Average</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => {
                  const studentItems = student.components[gradeComponent.component_id] || []
                  return (
                    <TableRow key={student.student_id}>
                      <TableCell className="font-medium">
                        <div>
                          <Button
                            variant="ghost"
                            className="p-0 h-auto font-medium text-left justify-start hover:text-primary"
                            onClick={() => handleStudentClick(student.student_id)}
                          >
                            <User className="h-4 w-4 mr-2" />
                            {student.name}
                          </Button>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </TableCell>
                      {(componentData as any[]).map((headerItem: any, index: number) => {
                        const matchingItem = studentItems.find((item: any) => 
                          item.name === headerItem.name && item.date === headerItem.date
                        )
                        
                        return (
                          <TableCell key={index} className="text-center">
                            {matchingItem ? (
                              isAttendance && 'status' in matchingItem ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Select
                                    value={matchingItem.status || ""}
                                    onValueChange={(value) => {
                                      handleAttendanceChange(
                                        matchingItem.id,
                                        value,
                                        student.name,
                                        matchingItem.name,
                                        matchingItem.status,
                                        gradeComponent.component_id,
                                        student.student_id
                                      )
                                    }}
                                  >
                                    <SelectTrigger 
                                      id={`attendance-select-${filteredStudents.findIndex(s => s.student_id === student.student_id)}-${index}`}
                                      className={`w-[120px] mx-auto ${
                                        matchingItem.imported ? 'border-blue-500' : ''
                                      } ${
                                        changedGrades.has(matchingItem.id) ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950' : ''
                                      } ${
                                        !matchingItem.status ? 'border-dashed border-2 border-gray-400 bg-gray-50 dark:bg-gray-900' : ''
                                      }`}
                                      onKeyDown={(e) => handleKeyDown(e, filteredStudents.findIndex(s => s.student_id === student.student_id), index, filteredStudents.length, componentData.length)}
                                    >
                                      <SelectValue placeholder="Not marked" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="present">
                                        <span className="text-green-600 dark:text-green-400 font-medium">Present</span>
                                      </SelectItem>
                                      <SelectItem value="late">
                                        <span className="text-yellow-600 dark:text-yellow-400 font-medium">Late</span>
                                      </SelectItem>
                                      <SelectItem value="absent">
                                        <span className="text-red-600 dark:text-red-400 font-medium">Absent</span>
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                  {matchingItem.imported && (
                                    <div className="flex items-center gap-1 text-xs text-blue-500">
                                      <GraduationCap className="h-3 w-3" />
                                      <span>GC</span>
                                    </div>
                                  )}
                                </div>
                              ) : 'score' in matchingItem ? (
                                <div className="flex flex-col items-center gap-1">
                                  <Input
                                    id={`grade-input-${filteredStudents.findIndex(s => s.student_id === student.student_id)}-${index}`}
                                    type="number"
                                    value={matchingItem.score}
                                    className={`w-16 text-center mx-auto ${
                                      matchingItem.imported ? 'border-blue-500' : ''
                                    } ${
                                      changedGrades.has(matchingItem.id) ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950' : ''
                                    }`}
                                    min="0"
                                    max={matchingItem.total}
                                    onKeyDown={(e) => handleKeyDown(e, filteredStudents.findIndex(s => s.student_id === student.student_id), index, filteredStudents.length, componentData.length)}
                                    onChange={(e) => {
                                      const newScore = parseFloat(e.target.value) || 0
                                      handleScoreChange(
                                        matchingItem.id, 
                                        newScore, 
                                        student.name,
                                        matchingItem.name,
                                        matchingItem.score,
                                        gradeComponent.component_id,
                                        student.student_id
                                      )
                                    }}
                                  />
                                  {matchingItem.imported && (
                                    <div className="flex items-center gap-1 text-xs text-blue-500">
                                      <GraduationCap className="h-3 w-3" />
                                      <span>GC</span>
                                    </div>
                                  )}
                                </div>
                              ) : <span className="text-muted-foreground">-</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                        )
                      })}
                      <TableCell className="text-center">
                        <span className={`font-bold ${getGradeColor(calculateStudentComponentAverage(gradeComponent.component_id, studentItems))}`}>
                          {calculateStudentComponentAverage(gradeComponent.component_id, studentItems)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderListView = () => {
    // Show all components in list view using sorted order
    const sortedComponents = getSortedComponents()
    const componentGroups = sortedComponents.map(gradeComponent => {
      const componentItems = new Map<string, any>()
      
      // Collect all items for this component from all students
      filteredStudents.forEach(student => {
        const items = student.components[gradeComponent.component_id] || []
        items.forEach(item => {
          const uniqueKey = `${item.name}-${item.date}`
          if (!componentItems.has(uniqueKey)) {
            componentItems.set(uniqueKey, {
              ...item,
              gradeComponent,
            })
          }
        })
      })

      const sortedItems = Array.from(componentItems.values()).sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime()
      })

      return {
        gradeComponent,
        items: sortedItems
      }
    })

        return (
      <Card>
        <CardHeader>
          <CardTitle>
            {activeTab === 'midterm' ? 'Midterm Components - List View' :
             activeTab === 'final' ? 'Final Components - List View' :
             'All Grading Components - List View'}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto" style={{ maxWidth: "calc(100vw - 320px)" }}>
            <div className="p-6 min-w-fit">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-background group-hover:bg-primary/10 z-10 transition-colors">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('name')}
                      className="h-auto p-1 hover:bg-accent font-medium flex items-center gap-1"
                    >
                      Student Name
                      {getSortIcon('name')}
                    </Button>
                  </TableHead>
                  {componentGroups.map((group, groupIndex) => {
                    const isBeingDragged = draggedComponent === group.gradeComponent.component_id
                    return (
                    <React.Fragment key={groupIndex}>
                        {/* Separator Column */}
                        {groupIndex > 0 && (
                          <TableHead className="w-[40px] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <div className="h-full w-full flex items-center justify-center">
                              <div className="h-12 w-[2px] bg-gray-300 dark:bg-gray-700"></div>
                            </div>
                          </TableHead>
                        )}
                        {/* Component Title Column - Draggable */}
                        <th 
                          colSpan={group.items.length + 2} 
                          className={`h-12 px-4 text-center align-middle font-medium text-muted-foreground transition-all duration-300 ${
                            isBeingDragged 
                              ? 'bg-primary/30 scale-105 shadow-lg ring-2 ring-primary' 
                              : 'bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/20 hover:to-primary/10'
                          } ${
                            isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
                          } border-l-4 border-primary`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, group.gradeComponent.component_id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={handleDragOver}
                          onDrop={(e) => handleDrop(e, group.gradeComponent.component_id)}
                          style={{
                            cursor: isDragging ? 'grabbing' : 'grab',
                            userSelect: 'none'
                          }}
                        >
                          <div className="flex items-center justify-center gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground" />
                            <span className="text-base font-bold text-primary">{group.gradeComponent.component_name}</span>
                            <Badge variant="outline" className="font-semibold">
                              {group.gradeComponent.weight_percentage}%
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {group.items.length} {group.items.length === 1 ? 'item' : 'items'}
                            </Badge>
                          </div>
                        </th>
                      </React.Fragment>
                    )
                  })}
                  {/* Overall Average Column */}
                  <TableHead className="text-center min-w-[120px] bg-green-50 dark:bg-green-950 group-hover:bg-green-100 dark:group-hover:bg-green-900 sticky right-0 z-10 transition-colors">
                    <div className="text-xs font-bold">
                      <div className="text-green-600 dark:text-green-400">Overall</div>
                      <div>Final Grade</div>
                    </div>
                  </TableHead>
                </TableRow>
                {/* Second header row with individual items */}
                <TableRow>
                  <TableHead className="w-[200px] sticky left-0 bg-background group-hover:bg-primary/10 z-10 transition-colors">
                    <span className="sr-only">Student Details</span>
                  </TableHead>
                  {componentGroups.map((group, groupIndex) => {
                    const isBeingDragged = draggedComponent === group.gradeComponent.component_id
                    return (
                      <React.Fragment key={groupIndex}>
                        {/* Separator Column */}
                        {groupIndex > 0 && (
                          <TableHead className="w-[40px] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                            <div className="h-full w-full flex items-center justify-center">
                              <div className="h-12 w-[2px] bg-gray-300 dark:bg-gray-700"></div>
                            </div>
                          </TableHead>
                        )}
                      {group.items.map((item: any, itemIndex: number) => (
                          <TableHead 
                            key={`${groupIndex}-${itemIndex}`} 
                            className={`text-center min-w-[120px] transition-opacity duration-300 ${
                              isBeingDragged ? 'bg-primary/20' : 'bg-primary/5'
                            } ${
                              isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
                            }`}
                          >
                          <div className="text-xs">
                            <div className="font-medium flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSort(`${item.name}-${item.date}`, group.gradeComponent.component_id)}
                                className="h-auto p-1 hover:bg-accent text-xs flex items-center gap-1"
                              >
                                {item.name}
                                {getSortIcon(`${item.name}-${item.date}`, group.gradeComponent.component_id)}
                              </Button>
                              {item.imported && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <GraduationCap className="h-3 w-3 text-blue-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>Imported from Google Classroom</TooltipContent>
                                </Tooltip>
                              )}
                              {item.source === 'manual entry' && (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Edit3 className="h-3 w-3 text-gray-500" />
                                  </TooltipTrigger>
                                  <TooltipContent>Manual Entry</TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-muted-foreground">
                              {new Date(item.date).toLocaleDateString()}
                              {!group.gradeComponent.is_attendance && 'total' in item && ` (${item.total} pts)`}
                            </div>
                            {/* Edit and Delete buttons for manual and imported (Google Classroom) entries */}
                            {(item.source === 'manual entry' || item.imported) && (
                              <div className="flex justify-center gap-1 mt-2">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-blue-100 dark:hover:bg-blue-900"
                                      onClick={() => handleEditEntry(item, group.gradeComponent)}
                                    >
                                      <Edit className="h-3 w-3 text-blue-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Edit Entry</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 hover:bg-red-100 dark:hover:bg-red-900"
                                      onClick={() => handleDeleteEntry(item, group.gradeComponent)}
                                    >
                                      <Trash2 className="h-3 w-3 text-red-600" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Entry</TooltipContent>
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        </TableHead>
                      ))}
                      {/* Component Average Column */}
                        <TableHead className={`text-center min-w-[100px] transition-opacity duration-300 ${
                          isBeingDragged ? 'bg-blue-100 dark:bg-blue-900' : 'bg-blue-50 dark:bg-blue-950'
                        } ${
                          isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
                        }`}>
                        <div className="text-xs font-bold">
                            <div className="text-blue-600 dark:text-blue-400">Average</div>
                          <div className="text-xs text-muted-foreground">
                            ({group.gradeComponent.weight_percentage}%)
                          </div>
                        </div>
                      </TableHead>
                      {/* Add Score Button Column */}
                        <TableHead className={`text-center min-w-[80px] transition-opacity duration-300 ${
                          isBeingDragged ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950'
                        } ${
                          isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
                        }`}>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedComponent(group.gradeComponent.component_id)
                            setIsAddModalOpen(true)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </TableHead>
                    </React.Fragment>
                    )
                  })}
                  {/* Overall Average Column */}
                  <TableHead className="text-center min-w-[120px] bg-green-50 dark:bg-green-950 group-hover:bg-green-100 dark:group-hover:bg-green-900 sticky right-0 z-10 transition-colors">
                    <div className="text-xs font-bold">
                      <div className="text-green-600 dark:text-green-400">Overall</div>
                      <div>Final Grade</div>
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium sticky left-0 bg-background group-hover:bg-primary/10 z-10">
                      <div>
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-medium text-left justify-start hover:text-primary"
                          onClick={() => handleStudentClick(student.student_id)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {student.name}
                        </Button>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </TableCell>
                    {componentGroups.map((group, groupIndex) => {
                      const isBeingDragged = draggedComponent === group.gradeComponent.component_id
                      return (
                      <React.Fragment key={groupIndex}>
                          {/* Separator Column */}
                          {groupIndex > 0 && (
                            <TableCell className="w-[40px] bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
                              <div className="h-full w-full flex items-center justify-center">
                                <div className="h-16 w-[2px] bg-gray-300 dark:bg-gray-700"></div>
                              </div>
                            </TableCell>
                          )}
                        {group.items.map((headerItem: any, itemIndex: number) => {
                          // Find matching item for this student and component
                          const studentItems = student.components[group.gradeComponent.component_id] || []
                          const matchingItem = studentItems.find((item: any) => 
                            item.name === headerItem.name && item.date === headerItem.date
                          )

                          return (
                              <TableCell 
                                key={`${groupIndex}-${itemIndex}`} 
                                className={`text-center transition-opacity duration-300 ${
                                  isBeingDragged ? 'bg-primary/20' : 'bg-primary/5'
                                } ${
                                  isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
                                }`}
                              >
                              {matchingItem ? (
                                group.gradeComponent.is_attendance && 'status' in matchingItem ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <Select
                                      value={matchingItem.status || ""}
                                      onValueChange={(value) => {
                                        handleAttendanceChange(
                                          matchingItem.id,
                                          value,
                                          student.name,
                                          matchingItem.name,
                                          matchingItem.status,
                                          group.gradeComponent.component_id,
                                          student.student_id
                                        )
                                      }}
                                    >
                                      <SelectTrigger 
                                        id={`attendance-select-${filteredStudents.findIndex(s => s.student_id === student.student_id)}-${itemIndex}`}
                                        className={`w-[120px] mx-auto ${
                                          matchingItem.imported ? 'border-blue-500' : ''
                                        } ${
                                          changedGrades.has(matchingItem.id) ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950' : ''
                                        } ${
                                          !matchingItem.status ? 'border-dashed border-2 border-gray-400 bg-gray-50 dark:bg-gray-900' : ''
                                        }`}
                                        onKeyDown={(e) => handleKeyDown(e, filteredStudents.findIndex(s => s.student_id === student.student_id), itemIndex, filteredStudents.length, group.items.length)}
                                      >
                                        <SelectValue placeholder="Not marked" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="present">
                                          <span className="text-green-600 dark:text-green-400 font-medium">Present</span>
                                        </SelectItem>
                                        <SelectItem value="late">
                                          <span className="text-yellow-600 dark:text-yellow-400 font-medium">Late</span>
                                        </SelectItem>
                                        <SelectItem value="absent">
                                          <span className="text-red-600 dark:text-red-400 font-medium">Absent</span>
                                        </SelectItem>
                                      </SelectContent>
                                    </Select>
                                    {matchingItem.imported && (
                                      <div className="flex items-center gap-1 text-xs text-blue-500">
                                        <GraduationCap className="h-3 w-3" />
                                        <span>GC</span>
                                      </div>
                                    )}
                                  </div>
                                ) : 'score' in matchingItem ? (
                                  <div className="flex flex-col items-center gap-1">
                                    <Input
                                      id={`grade-input-${filteredStudents.findIndex(s => s.student_id === student.student_id)}-${itemIndex}`}
                                      type="number"
                                      value={matchingItem.score}
                                      className={`w-16 text-center mx-auto ${
                                        matchingItem.imported ? 'border-blue-500' : ''
                                      } ${
                                        changedGrades.has(matchingItem.id) ? 'border-2 border-amber-500 bg-amber-50 dark:bg-amber-950' : ''
                                      }`}
                                      min="0"
                                      max={matchingItem.total}
                                      onKeyDown={(e) => handleKeyDown(e, filteredStudents.findIndex(s => s.student_id === student.student_id), itemIndex, filteredStudents.length, group.items.length)}
                                      onChange={(e) => {
                                        const newScore = parseFloat(e.target.value) || 0
                                        handleScoreChange(
                                          matchingItem.id, 
                                          newScore,
                                          student.name,
                                          matchingItem.name,
                                          matchingItem.score,
                                          group.gradeComponent.component_id,
                                          student.student_id
                                        )
                                      }}
                                    />
                                    {matchingItem.imported && (
                                      <div className="flex items-center gap-1 text-xs text-blue-500">
                                        <GraduationCap className="h-3 w-3" />
                                        <span>GC</span>
                                      </div>
                                    )}
                                  </div>
                                ) : <span className="text-muted-foreground">-</span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          )
                        })}
                        {/* Component Average Cell */}
                          <TableCell className={`text-center transition-opacity duration-300 ${
                            isBeingDragged ? 'bg-blue-100 dark:bg-blue-900' : 'bg-blue-50 dark:bg-blue-950'
                          } ${
                            isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
                          }`}>
                          <span className={`font-bold ${getGradeColor(
                            calculateStudentComponentAverage(group.gradeComponent.component_id, student.components[group.gradeComponent.component_id] || [])
                          )}`}>
                            {calculateStudentComponentAverage(group.gradeComponent.component_id, student.components[group.gradeComponent.component_id] || [])}%
                          </span>
                        </TableCell>
                        {/* Empty cell for add button column */}
                          <TableCell className={`transition-opacity duration-300 ${
                            isBeingDragged ? 'bg-gray-100 dark:bg-gray-900' : 'bg-gray-50 dark:bg-gray-950'
                          } ${
                            isDragging && !isBeingDragged ? 'opacity-50' : 'opacity-100'
                          }`}>&nbsp;</TableCell>
                      </React.Fragment>
                      )
                    })}
                    {/* Overall Average Cell */}
                    <TableCell className="text-center bg-green-50 dark:bg-green-950 group-hover:bg-green-100 dark:group-hover:bg-green-900 sticky right-0 z-10">
                      <div className="flex flex-col items-center gap-1">
                        <span className={`font-bold text-lg ${getGradeColor(calculateStudentFinalGrade(student))}`}>
                          {calculateStudentFinalGrade(student)}%
                        </span>
                        <Badge
                          variant={parseFloat(getGWA(calculateStudentFinalGrade(student))) <= 1.5 ? "default" : 
                                  parseFloat(getGWA(calculateStudentFinalGrade(student))) >= 4.0 ? "destructive" : "secondary"}
                        >
                          {getGWA(calculateStudentFinalGrade(student))}
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderOverallGrades = () => (
    <Card>
      <CardHeader>
        <CardTitle>Overall Student Grades</CardTitle>
        <CardDescription>Final grades calculated using weighted averages</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto" style={{ maxWidth: "calc(100vw - 320px)" }}>
          <div className="p-6 min-w-fit">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleSort('name')}
                    className="h-auto p-1 hover:bg-accent font-medium flex items-center gap-1"
                  >
                    Student Name
                    {getSortIcon('name')}
                  </Button>
                </TableHead>
                {classData.gradeComponents.map((component) => (
                  <TableHead key={component.component_id} className="text-center">
                    {component.component_name} ({component.weight_percentage}%)
                  </TableHead>
                ))}
                <TableHead className="text-center">Final Grade</TableHead>
                <TableHead className="text-center">GWA</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => {
                const finalGrade = calculateStudentFinalGrade(student)
                const gwa = getGWA(finalGrade)

                return (
                  <TableRow key={student.student_id}>
                    <TableCell className="font-medium">
                      <div>
                        <Button
                          variant="ghost"
                          className="p-0 h-auto font-medium text-left justify-start hover:text-primary"
                          onClick={() => handleStudentClick(student.student_id)}
                        >
                          <User className="h-4 w-4 mr-2" />
                          {student.name}
                        </Button>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </TableCell>
                    {classData.gradeComponents.map((component) => {
                      const items = student.components[component.component_id] || []
                      const average = calculateStudentComponentAverage(component.component_id, items)
                      return (
                        <TableCell key={component.component_id} className="text-center">
                          <span className={getGradeColor(average)}>
                            {average}%
                          </span>
                        </TableCell>
                      )
                    })}
                    <TableCell className="text-center">
                      <span className={`font-bold ${getGradeColor(finalGrade)}`}>{finalGrade}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={gwa === "1" ? "default" : gwa === "5" ? "destructive" : "secondary"}
                      >
                        {gwa}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* Sticky Save Changes Banner */}
        {hasUnsavedChanges && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber-50 dark:bg-amber-950 border-b-2 border-amber-500 shadow-lg">
            <div className="container mx-auto px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-amber-500 rounded-full animate-pulse">
                    <HelpCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      You have unsaved changes
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      {changedGrades.size} grade{changedGrades.size !== 1 ? 's' : ''} modified. Don't forget to save!
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsViewDetailsOpen(true)}
                    disabled={isSaving}
                    className="text-amber-700 hover:text-amber-900 hover:bg-amber-100 dark:hover:bg-amber-900"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDiscardChanges}
                    disabled={isSaving}
                    className="border-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Discard
                  </Button>
                  
                  <Button
                    size="sm"
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700 text-white shadow-md"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save {changedGrades.size} Change{changedGrades.size !== 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Floating Save Button (Bottom Right) */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-6 right-6 z-40">
            <div className="relative">
              {/* Badge with count */}
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-bounce shadow-lg">
                {changedGrades.size}
              </div>
              
              <Button
                size="lg"
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white shadow-2xl hover:shadow-green-500/50 transition-all duration-300 scale-110 hover:scale-125"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-5 w-5 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Google Classroom Integration Status */}
        {hasGoogleAccess && (
          <div className="mb-4 p-3 rounded-lg border bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <span className="font-medium text-green-900 dark:text-green-100">Google Classroom Connected</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-green-700 dark:text-green-300">
                  <span>{totalCourses} courses loaded</span>
                  <span>{totalClasswork} classwork items</span>
                  {isGoogleLoading && <span className="flex items-center gap-1">
                    <div className="animate-spin h-3 w-3 border border-green-600 border-t-transparent rounded-full" />
                    Loading...
                  </span>}
                  {isGoogleRefreshing && <span className="flex items-center gap-1">
                    <div className="animate-spin h-3 w-3 border border-green-600 border-t-transparent rounded-full" />
                    Refreshing...
                  </span>}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshGoogleData}
                disabled={isGoogleLoading || isGoogleRefreshing}
                className="border-green-300 text-green-700 hover:bg-green-100 dark:hover:bg-green-900"
              >
                {isGoogleRefreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </div>
          </div>
        )}

        {googleError && (
          <div className="mb-4 p-3 rounded-lg border bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div>
                  <span className="font-medium text-yellow-900 dark:text-yellow-100">Google Classroom Warning</span>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">{googleError}. You can’t import scores from Google Classroom because your email doesn’t match your Google Classroom account.</p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">Fix: Please try logging in to your account again.</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshGoogleData}
                className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:hover:bg-yellow-900"
              >
                Retry
              </Button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="flex gap-2 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[250px]"
              />
            </div>
            
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter components" />
              </SelectTrigger>
              <SelectContent>
                {classData.gradeComponents.map((component) => (
                  <div key={component.component_id} className="flex items-center space-x-2 p-2">
                    <Checkbox
                      id={`component-${component.component_id}`}
                      checked={visibleComponents[component.component_id]}
                      onCheckedChange={() => toggleComponentVisibility(component.component_id)}
                    />
                    <label htmlFor={`component-${component.component_id}`}>
                      {component.component_name}
                    </label>
                  </div>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            {/* View Mode Toggle */}
            <div className="flex rounded-lg border p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-md"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-md"
              >
                <List className="h-4 w-4 mr-1" />
                List
              </Button>
            </div>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="midterm">Midterm</TabsTrigger>
            <TabsTrigger value="final">Final</TabsTrigger>
            <TabsTrigger value="overall">Overall</TabsTrigger>
          </TabsList>

          <TabsContent value="midterm" className="space-y-6">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Midterm Components</h3>
                <Badge variant="default" className="text-xs">
                  Midterm Period
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Viewing and editing midterm grades only
                </span>
              </div>
              {currentStudents.some(s => 
                Object.values(s.components).some(items => 
                  items.some(item => !item.grade_period)
                )
              ) && (
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <HelpCircle className="h-3 w-3" />
                  <span>Note: Entries without a period label are shown in all tabs</span>
                </div>
              )}
            </div>
            {viewMode === 'grid' ? (
              <>
                {getSortedComponents().map((component) => 
                  renderGradingComponentTable(component)
                )}
              </>
            ) : (
              renderListView()
            )}
          </TabsContent>

          <TabsContent value="final" className="space-y-6">
            <div className="flex flex-col gap-2 mb-4">
              <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold">Final Components</h3>
                <Badge variant="secondary" className="text-xs">
                  Final Period
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Viewing and editing final grades only
                </span>
              </div>
              {currentStudents.some(s => 
                Object.values(s.components).some(items => 
                  items.some(item => !item.grade_period)
                )
              ) && (
                <div className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <HelpCircle className="h-3 w-3" />
                  <span>Note: Entries without a period label are shown in all tabs</span>
                </div>
              )}
            </div>
            {viewMode === 'grid' ? (
              <>
                {getSortedComponents().map((component) => 
                  renderGradingComponentTable(component)
                )}
              </>
            ) : (
              renderListView()
            )}
          </TabsContent>

          <TabsContent value="overall" className="space-y-6">
            {viewMode === 'grid' ? (
              renderOverallGrades()
            ) : (
              <>
                {renderListView()}
                <div className="mt-6">
                  {renderOverallGrades()}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* Grading Weights Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Grade Calculation Weights
            </CardTitle>
            <CardDescription>How final grades are calculated for this class</CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="grid gap-4"
              style={{
                gridTemplateColumns: `repeat(${classData.gradeComponents.length}, minmax(0, 1fr))`
              }}
            >
              {classData.gradeComponents.map((component) => (
                <div key={component.component_id} className="text-center p-3 rounded-lg border">
                  <p className="text-2xl font-bold text-primary">{component.weight_percentage}%</p>
                  <p className="text-sm text-muted-foreground">
                    {component.component_name}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Score Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={handleModalClose}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                Add New Entry
                <Badge variant={activeTab === 'midterm' ? 'default' : 'secondary'} className="text-xs">
                  {activeTab === 'midterm' ? 'Midterm' : activeTab === 'final' ? 'Final' : 'Overall'}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Add a new entry for {classData.gradeComponents.find(c => c.component_id === selectedComponent)?.component_name}
                {(activeTab === 'midterm' || activeTab === 'final') && (
                  <span className="block mt-1 text-primary font-medium">
                    This entry will be saved to the {activeTab} period
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input id="name" placeholder="Quiz 1, Assignment 2, etc." className="col-span-3" />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date <span className="text-red-500">*</span>
                </Label>
                <Input id="date" type="date" className="col-span-3" defaultValue={new Date().toISOString().split('T')[0]} />
              </div>
              
              {selectedComponent !== null && !classData.gradeComponents.find(c => c.component_id === selectedComponent)?.is_attendance && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="total" className="text-right">
                    Total Score <span className="text-red-500">*</span>
                  </Label>
                  <Input id="total" type="number" placeholder="100" className="col-span-3" min="0" step="1" />
                </div>
              )}
              
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="topics" className="text-right pt-2">Topics</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="topics"
                      placeholder="Type a topic and press Enter"
                      value={currentTopic}
                      onChange={(e) => setCurrentTopic(e.target.value)}
                      onKeyDown={handleTopicKeyDown}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddTopic}
                      disabled={!currentTopic.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {topics.length > 0 && (
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 min-h-[60px]">
                      {topics.map((topic, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="px-3 py-1 text-sm flex items-center gap-1 hover:bg-secondary/80 transition-colors"
                        >
                          {topic}
                          <button
                            type="button"
                            onClick={() => handleRemoveTopic(topic)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Add topics or learning outcomes covered in this assessment
                  </p>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4 border-t">
                {selectedComponent !== null && !classData.gradeComponents.find(c => c.component_id === selectedComponent)?.is_attendance && (
                  <Button className="flex-1" variant="outline" onClick={handleGoogleModalOpen}>
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Import from Google Classroom
                  </Button>
                )}

                <Button className="flex-1" onClick={handleManualEntry}>
                  <Save className="mr-2 h-4 w-4" />
                  Save Entry
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Changes Details Modal */}
        <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
          <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Review Changes
                <Badge variant="secondary" className="ml-2">
                  {changedGrades.size} {changedGrades.size === 1 ? 'change' : 'changes'}
                </Badge>
              </DialogTitle>
              <DialogDescription>
                Review all grade changes before saving to the database
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {changedGrades.size === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No changes to display</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {Array.from(changedGrades.values()).map((change, index) => (
                    <div 
                      key={change.gradeId}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{change.studentName}</span>
                        </div>
                        <div className="text-sm text-muted-foreground ml-6">
                          {change.entryName}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground line-through">
                            {change.isAttendance ? scoreToAttendanceStatus(change.oldScore) : change.oldScore}
                          </div>
                        </div>
                        
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        
                        <div className="text-right min-w-[60px]">
                          <div className="font-bold text-lg text-green-600 dark:text-green-400">
                            {change.isAttendance ? scoreToAttendanceStatus(change.score) : change.score}
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const updatedChanges = new Map(changedGrades)
                            updatedChanges.delete(change.gradeId)
                            setChangedGrades(updatedChanges)
                            setHasUnsavedChanges(updatedChanges.size > 0)
                          }}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => setIsViewDetailsOpen(false)}
              >
                Close
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsViewDetailsOpen(false)
                    setConfirmModal({
                      isOpen: true,
                      title: 'Discard All Changes?',
                      message: `Are you sure you want to discard all ${changedGrades.size} changes? This action cannot be undone.`,
                      onConfirm: () => {
                        setChangedGrades(new Map())
                        setHasUnsavedChanges(false)
                        setConfirmModal({ ...confirmModal, isOpen: false })
                        window.location.reload()
                      }
                    })
                  }}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  Discard All
                </Button>
                
                <Button
                  onClick={() => {
                    setIsViewDetailsOpen(false)
                    handleSaveChanges()
                  }}
                  disabled={isSaving || changedGrades.size === 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save All Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

      <Dialog open={isGoogleModalOpen} onOpenChange={(open) => {
        setIsGoogleModalOpen(open)
        if (!open) {
          // Reset selections when modal is closed
          setSelectedComponent(null)
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Import from Google Classroom
              {hasGoogleAccess && (
                <Badge variant="secondary" className="text-xs">
                  {totalCourses} courses loaded
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Choose the Google Classroom class and classwork to import scores from.
              {hasGoogleAccess && (
                <span className="block mt-1 text-green-600 dark:text-green-400 text-sm">
                  ✓ Connected to Google Classroom • {totalClasswork} classwork items available
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="google-class" className="text-right">Class</Label>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a class" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="google-assignment" className="text-right">Classwork</Label>
              <Select 
                value={selectedCoursework} 
                onValueChange={setSelectedCoursework}
                disabled={!selectedCourse || coursework.length === 0}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a classwork" />
                </SelectTrigger>
                <SelectContent>
                  {coursework.map(work => (
                    <SelectItem key={work.id} value={work.id}>
                      {work.title} ({work.maxPoints} pts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Topics configuration for imported entries */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="gc-topics" className="text-right pt-2">Topics</Label>
              <div className="col-span-3 space-y-2">
                <div className="flex gap-2">
                  <Input
                    id="gc-topics"
                    placeholder="Type a topic and press Enter"
                    value={currentTopic}
                    onChange={(e) => setCurrentTopic(e.target.value)}
                    onKeyDown={handleTopicKeyDown}
                    className="flex-1"
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    onClick={handleAddTopic}
                    disabled={!currentTopic.trim()}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {topics.length > 0 && (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 min-h-[60px]">
                    {topics.map((topic, index) => (
                      <Badge 
                        key={`gc-${index}`} 
                        variant="secondary" 
                        className="px-3 py-1 text-sm flex items-center gap-1 hover:bg-secondary/80 transition-colors"
                      >
                        {topic}
                        <button
                          type="button"
                          onClick={() => handleRemoveTopic(topic)}
                          className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  These topics will be saved to all imported entries
                </p>
              </div>
            </div>

            <div className="flex justify-between pt-4">
              <Button 
                variant="outline"
                onClick={fetchStudentSyncPreview}
                disabled={!selectedCourse || isSyncLoading}
              >
                {isSyncLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-gray-600 border-t-transparent rounded-full" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <User className="h-4 w-4 mr-2" />
                    Sync Students
                  </>
                )}
              </Button>
              
              <Button 
                onClick={importGoogleScores}
                disabled={!selectedCourse || !selectedCoursework || selectedComponent === null || isLoading}
              >
                {isLoading ? 'Importing...' : 'Import Scores'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Result Modal (Success/Warning/Error) */}
      <Dialog open={resultModal.isOpen} onOpenChange={(open) => setResultModal({ ...resultModal, isOpen: open })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {resultModal.type === 'success' && (
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              )}
              {resultModal.type === 'warning' && (
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              {resultModal.type === 'error' && (
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              )}
              <span>{resultModal.title}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {resultModal.message}
            </DialogDescription>
          </DialogHeader>

          {resultModal.details && resultModal.details.length > 0 && (
            <div className="py-4">
              <div className="text-sm font-medium mb-2 text-muted-foreground">Failed Items:</div>
              <div className="space-y-1 max-h-[200px] overflow-y-auto bg-muted/50 rounded-lg p-3">
                {resultModal.details.map((detail, index) => (
                  <div key={index} className="text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                    <span className="text-red-400">•</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              onClick={() => {
                setResultModal({ ...resultModal, isOpen: false })
              }}
              className={
                resultModal.type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : resultModal.type === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-red-600 hover:bg-red-700'
              }
            >
              {resultModal.type === 'success' ? 'Great!' : 'OK'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={confirmModal.isOpen} onOpenChange={(open) => setConfirmModal({ ...confirmModal, isOpen: open })}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
              <span>{confirmModal.title}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {confirmModal.message}
            </DialogDescription>
          </DialogHeader>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmModal.onConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Yes, Discard
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Student Synchronization Preview Modal */}
      <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
        <DialogContent className="sm:max-w-[800px] my-5 max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Student Synchronization Preview
              {syncData && (
                <Badge variant="secondary" className="ml-2">
                  {syncData.totalMatched + syncData.totalDbOnly + syncData.totalGcOnly} total students
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Review student matches between your database and Google Classroom before importing scores
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 flex-1 overflow-y-auto">
            {syncData ? (
              <div className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg border bg-green-50 dark:bg-green-950">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      <span className="font-semibold text-green-900 dark:text-green-100">Matched</span>
                    </div>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                      {syncData.totalMatched}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Students in both systems
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-amber-50 dark:bg-amber-950">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <span className="font-semibold text-amber-900 dark:text-amber-100">Database Only</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {syncData.totalDbOnly}
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Not in Google Classroom
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-center gap-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span className="font-semibold text-blue-900 dark:text-blue-100">Google Only</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {syncData.totalGcOnly}
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Not in database
                    </p>
                  </div>
                </div>

                {/* Matched Students */}
                {syncData.matched.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Matched Students ({syncData.totalMatched})
                    </h3>
                    <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Email</TableHead>
                              <TableHead className="min-w-[150px]">Database Name</TableHead>
                              <TableHead className="min-w-[150px]">Google Classroom Name</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {syncData.matched.map((student, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{student.email}</TableCell>
                                <TableCell>{student.db_name}</TableCell>
                                <TableCell>{student.gc_name}</TableCell>
                                <TableCell>
                                  <Badge variant="default" className="bg-green-600">
                                    {student.match_type}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Database Only Students */}
                {syncData.dbOnly.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Database Only ({syncData.totalDbOnly})
                    </h3>
                    <div className="max-h-[150px] overflow-y-auto border rounded-lg">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Email</TableHead>
                              <TableHead className="min-w-[150px]">Name</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {syncData.dbOnly.map((student, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{student.email}</TableCell>
                                <TableCell>{student.full_name}</TableCell>
                                <TableCell>
                                  <Badge variant="secondary" className="bg-amber-600">
                                    Not in GC
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Classroom Only Students */}
                {syncData.gcOnly.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Google Classroom Only ({syncData.totalGcOnly})
                    </h3>
                    <div className="max-h-[150px] overflow-y-auto border rounded-lg">
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="min-w-[200px]">Email</TableHead>
                              <TableHead className="min-w-[150px]">Name</TableHead>
                              <TableHead className="min-w-[100px]">Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {syncData.gcOnly.map((student, index) => (
                              <TableRow key={index}>
                                <TableCell className="font-medium">{student.email}</TableCell>
                                <TableCell>{student.fullName}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="border-blue-600 text-blue-600">
                                    Not in DB
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No synchronization data available</p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setIsSyncModalOpen(false)}
            >
              Close
            </Button>
            
            {syncData && syncData.totalMatched > 0 && (
              <Button
                onClick={() => {
                  setIsSyncModalOpen(false)
                  // Trigger the actual import process
                  importGoogleScores()
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Proceed with Import
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Grade Entry Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={(open) => {
        setIsEditModalOpen(open)
        if (!open) {
          // Reset form data and clear current topic when modal is closed
          setEditFormData({
            name: '',
            date: '',
            max_score: 0,
            topics: []
          })
          setCurrentTopic("")
          setSelectedEntry(null)
        }
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Grade Entry
              {selectedEntry && (
                <Badge variant="outline" className="text-xs">
                  {selectedEntry.is_attendance ? 'Attendance' : 'Score Entry'}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Edit the details for this grade entry. Changes will apply to all students.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="edit-name" 
                placeholder="Quiz 1, Assignment 2, etc." 
                className="col-span-3" 
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-date" className="text-right">
                Date <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="edit-date" 
                type="date" 
                className="col-span-3" 
                value={editFormData.date}
                onChange={(e) => setEditFormData(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            
            {selectedEntry && !selectedEntry.is_attendance && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-max-score" className="text-right">
                  Max Score <span className="text-red-500">*</span>
                </Label>
                <Input 
                  id="edit-max-score" 
                  type="number" 
                  placeholder="100" 
                  className="col-span-3" 
                  min="0" 
                  step="1"
                  value={editFormData.max_score}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, max_score: parseInt(e.target.value) || 0 }))}
                />
              </div>
            )}

            <div className="grid grid-cols-4 items-start gap-4">
              <Label htmlFor="edit-topics" className="text-right pt-2">Topics</Label>
              <div className="col-span-3 space-y-3">
                {/* Existing topics display */}
                {editFormData.topics.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Existing Topics ({editFormData.topics.length})
                      </span>
                      <div className="h-px flex-1 bg-border"></div>
                    </div>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-md bg-muted/30 min-h-[60px]">
                      {editFormData.topics.map((topic, index) => (
                        <Badge 
                          key={`existing-${index}`}
                          variant="secondary" 
                          className="px-3 py-1 text-sm flex items-center gap-1 hover:bg-secondary/80 transition-colors group"
                        >
                          <span className="text-xs text-muted-foreground mr-1">•</span>
                          {topic}
                          <button
                            type="button"
                            onClick={() => handleRemoveTopicEdit(topic)}
                            className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors opacity-0 group-hover:opacity-100"
                            title={`Remove "${topic}"`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Add new topics section */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">
                      {editFormData.topics.length > 0 ? 'Add New Topics' : 'Add Topics'}
                    </span>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      id="edit-topics"
                      placeholder="Type a topic and press Enter"
                      value={currentTopic}
                      onChange={(e) => setCurrentTopic(e.target.value)}
                      onKeyDown={handleTopicKeyDownEdit}
                      className="flex-1"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      onClick={handleAddTopicEdit}
                      disabled={!currentTopic.trim() || editFormData.topics.includes(currentTopic.trim())}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {editFormData.topics.length > 0 
                    ? "Click the × on any topic to remove it, or add new topics above"
                    : "Add topics or learning outcomes covered in this assessment"
                  }
                </p>
              </div>
            </div>

            {selectedEntry && selectedEntry.is_attendance && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs text-white">i</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Attendance Entry
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Max score is automatically set to 10 points for attendance entries.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editFormData.name || !editFormData.date || (selectedEntry && !selectedEntry.is_attendance && editFormData.max_score <= 0) || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Grade Entry Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              Delete Grade Entry
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete the grade entry for all students.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {selectedEntry && (
              <div className="p-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900 dark:text-red-100">
                      Are you sure you want to delete this entry?
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-red-700 dark:text-red-300">
                      <p><strong>Entry Name:</strong> {selectedEntry.name}</p>
                      <p><strong>Date:</strong> {new Date(selectedEntry.date).toLocaleDateString()}</p>
                      <p><strong>Type:</strong> {selectedEntry.is_attendance ? 'Attendance Entry' : 'Score Entry'}</p>
                      {!selectedEntry.is_attendance && (
                        <p><strong>Max Score:</strong> {selectedEntry.max_score} points</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 p-3 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
              <div className="flex items-start gap-2">
                <div className="h-5 w-5 rounded-full bg-amber-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs text-white">!</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                    Warning
                  </p>
                  <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                    This will delete the grade entry for ALL students in this class. Individual student scores and attendance records will be permanently removed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Entry
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feedback Modal (replaces alert calls) */}
      <Dialog open={feedbackModal.isOpen} onOpenChange={(open) => setFeedbackModal({ ...feedbackModal, isOpen: open })}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {feedbackModal.type === 'success' && (
                <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              )}
              {feedbackModal.type === 'warning' && (
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              {feedbackModal.type === 'error' && (
                <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              )}
              {feedbackModal.type === 'info' && (
                <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <HelpCircle className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
              )}
              <span>{feedbackModal.title}</span>
            </DialogTitle>
            <DialogDescription className="pt-2">
              {feedbackModal.message}
            </DialogDescription>
          </DialogHeader>

          {feedbackModal.details && feedbackModal.details.length > 0 && (
            <div className="py-4">
              <div className="space-y-1 max-h-[200px] overflow-y-auto bg-muted/50 rounded-lg p-3">
                {feedbackModal.details.map((detail, index) => (
                  <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-muted-foreground">•</span>
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            {feedbackModal.preventAutoRefresh && (
              <Button
                variant="outline"
                onClick={() => {
                  setFeedbackModal({ ...feedbackModal, isOpen: false })
                }}
              >
                Cancel
              </Button>
            )}
            <Button
              onClick={() => {
                if (feedbackModal.onConfirm) {
                  feedbackModal.onConfirm()
                }
                setFeedbackModal({ ...feedbackModal, isOpen: false })
              }}
              className={
                feedbackModal.type === 'success' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : feedbackModal.type === 'warning'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : feedbackModal.type === 'error'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
              }
            >
              {feedbackModal.preventAutoRefresh ? 'Continue' :
               feedbackModal.type === 'success' ? 'Great!' : 
               feedbackModal.type === 'warning' ? 'Got it' :
               feedbackModal.type === 'error' ? 'OK' : 'OK'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      </div>
    </TooltipProvider>
  )
}
