"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ArrowLeft, MoreVertical, Edit, Trash, BookOpen, ChevronDown, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AddSubjectModal from "@/components/admin/add-subject-modal"
import EditSubjectModal from "@/components/admin/edit-subject-modal"
import DeleteSubjectModal from "@/components/admin/delete-subject-modal"
import AddSemesterModal from "@/components/admin/add-semester-modal"
import EditSemesterModal from "@/components/admin/edit-semester-modal"
import DeleteSemesterModal from "@/components/admin/delete-semester-modal"
import AddYearLevelModal from "@/components/admin/add-year-level-modal"
import EditYearLevelModal from "@/components/admin/edit-year-level-modal"
import DeleteYearLevelModal from "@/components/admin/delete-year-level-modal"

interface Subject {
  subject_id: number
  course_id: number
  subject_code: string
  subject_name: string
  units: number
  year_level_id: number
  semester_id: number
  subject_type?: string
  prerequisites?: string | null
  assigned_professor?: string | null
  status?: string
  created_at: string
  updated_at: string
  year_level?: {
    year_level_id: number
    name: string
    course_id: number
  }
  semester?: {
    semester_id: number
    semester_name: string
    year_level_id: number
  }
}

interface Semester {
  semester_id: number
  course_id: number
  year_level_id: number
  semester_number: number
  semester_name: string
  created_at: string
  updated_at: string
  year_level?: {
    year_level_id: number
    name: string
    course_id: number
  }
}

interface Course {
  course_id: number
  department_id: number
  course_code: string
  course_name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface Department {
  department_id: number
  department_name: string
  description: string | null
  dean_name: string
  created_at: string
  updated_at: string
}

interface YearLevel {
  year_level_id: number
  name: string
  course_id: number
  created_at: string
  updated_at: string
  semester_count?: number
  subject_count?: number
  total_units?: number
  semester?: any[]
  subjects?: any[]
}

export default function SubjectManagementPage() {
  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string
  const courseId = params.courseId as string

  const [department, setDepartment] = useState<Department | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [semestersByYearLevel, setSemestersByYearLevel] = useState<Record<number, Semester[]>>({})
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(1)
  
  // Modal states
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false)
  const [isEditSubjectModalOpen, setIsEditSubjectModalOpen] = useState(false)
  const [isDeleteSubjectModalOpen, setIsDeleteSubjectModalOpen] = useState(false)
  const [isAddSemesterModalOpen, setIsAddSemesterModalOpen] = useState(false)
  const [isEditSemesterModalOpen, setIsEditSemesterModalOpen] = useState(false)
  const [isDeleteSemesterModalOpen, setIsDeleteSemesterModalOpen] = useState(false)
  const [isAddYearLevelModalOpen, setIsAddYearLevelModalOpen] = useState(false)
  const [isEditYearLevelModalOpen, setIsEditYearLevelModalOpen] = useState(false)
  const [isDeleteYearLevelModalOpen, setIsDeleteYearLevelModalOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<number>(1)
  const [selectedYearLevel, setSelectedYearLevel] = useState<YearLevel | null>(null)
  const [selectedYearLevelForSemester, setSelectedYearLevelForSemester] = useState<number | undefined>(undefined)
  const [selectedSemesterData, setSelectedSemesterData] = useState<any>(null)
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [expandedSemesters, setExpandedSemesters] = useState<Set<number>>(new Set())
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set())

  // Color variations for course headers (reuse department/courses palette)
  const cardColors = [
    "bg-[var(--customized-color-two)]",
    "bg-[var(--customized-color-three)]",
  ]

  const headerColor = course ? cardColors[course.course_id % cardColors.length] : cardColors[0]

  // Fetch department, course, year levels, semesters, and subjects data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch all data in parallel for better performance
      const [deptResponse, courseResponse, subjectsResponse, semestersResponse, yearLevelsResponse] = await Promise.all([
        fetch(`/api/admin/department/${departmentId}`),
        fetch(`/api/admin/course/${courseId}`),
        fetch(`/api/admin/subject?course_id=${courseId}`),
        fetch(`/api/admin/semester?course_id=${courseId}`),
        fetch(`/api/admin/year-level?course_id=${courseId}`)
      ])

      // Check if all requests were successful
      const responses = [
        { response: deptResponse, name: 'department', error: 'Failed to fetch department' },
        { response: courseResponse, name: 'course', error: 'Failed to fetch course' },
        { response: subjectsResponse, name: 'subjects', error: 'Failed to fetch subjects' },
        { response: semestersResponse, name: 'semesters', error: 'Failed to fetch semesters' },
        { response: yearLevelsResponse, name: 'year levels', error: 'Failed to fetch year levels' }
      ]

      // Check for any failed responses
      const failedResponse = responses.find(r => !r.response.ok)
      if (failedResponse) {
        const errorText = await failedResponse.response.text()
        console.error(`${failedResponse.name} API error:`, errorText)
        throw new Error(`${failedResponse.error}: ${errorText}`)
      }

      // Parse all responses
      const [deptResult, courseResult, subjectsResult, semestersResult, yearLevelsResult] = await Promise.all([
        deptResponse.json(),
        courseResponse.json(),
        subjectsResponse.json(),
        semestersResponse.json(),
        yearLevelsResponse.json()
      ])

      // Set all data with comprehensive year level information
      setDepartment(deptResult.department)
      setCourse(courseResult.course)
      setSubjects(subjectsResult.subjects || [])
      setSemesters(semestersResult.semesters || [])
      
      // Debug semester data for course
      console.log('🔍 Frontend semester data for course:', {
        courseId,
        courseName: courseResult.course?.course_name,
        semestersCount: semestersResult.semesters?.length || 0,
        semesters: semestersResult.semesters?.map((s: any) => ({
          id: s.semester_id,
          name: s.semester_name,
          yearLevelId: s.year_level_id,
          yearLevelName: s.year_level?.name,
          courseId: s.year_level?.course_id
        }))
      })
      
      // Enhanced semester data processing - organize by year level
      const semestersData = semestersResult.semesters || []
      const semestersByYearLevelData = semestersResult.semestersByYearLevel || {}
      setSemestersByYearLevel(semestersByYearLevelData)
      
      // Enhanced year levels data processing with comprehensive information
      const yearLevelsData = yearLevelsResult.yearLevels || []
      const yearLevelsSummary = yearLevelsResult.summary || {}
      setYearLevels(yearLevelsData)

      // Log comprehensive data for debugging
      console.log('Fetched comprehensive data:', {
        department: deptResult.department,
        course: courseResult.course,
        subjects: subjectsResult.subjects,
        semesters: semestersData,
        semestersByYearLevel: semestersByYearLevelData,
        yearLevels: yearLevelsData,
        yearLevelsCount: yearLevelsData.length,
        yearLevelsSummary,
        semesterSummary: semestersResult.summary,
        yearLevelsDetails: yearLevelsData.map((yl: any) => ({
          id: yl.year_level_id,
          name: yl.name,
          courseId: yl.course_id,
          createdAt: yl.created_at,
          updatedAt: yl.updated_at,
          semesterCount: yl.semester_count,
          subjectCount: yl.subject_count,
          totalUnits: yl.total_units,
          semesters: yl.semester,
          subjects: yl.subjects
        }))
      })

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error(error instanceof Error ? error.message : "Failed to load data")
      router.push('/admin/curriculum')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (departmentId && courseId) {
      fetchData()
    }
  }, [departmentId, courseId])

  // Enhanced year level processing - Get available year levels with comprehensive data
  const availableYearLevels = yearLevels.map(yl => {
    const yearLevelName = yl.name || ''
    const yearNum = parseInt(yearLevelName.replace('ST YEAR', '').replace('ND YEAR', '').replace('RD YEAR', '').replace('TH YEAR', ''))
    return {
      year: yearNum,
      yearLevel: yl,
      name: yearLevelName,
      isValid: !isNaN(yearNum)
    }
  }).filter(item => item.isValid).sort((a, b) => a.year - b.year)

  // Extract just the year numbers for backward compatibility
  const yearNumbers = availableYearLevels.map(item => item.year)
  
  // Get subjects for selected year level
  const yearSubjects = subjects.filter(s => {
    const yearLevelName = s.year_level?.name || ''
    const yearNum = parseInt(yearLevelName.replace('ST YEAR', '').replace('ND YEAR', '').replace('RD YEAR', '').replace('TH YEAR', ''))
    return yearNum === selectedYear
  })

  // Get semesters for selected year level
  const currentYearLevelItem = availableYearLevels.find(item => item.year === selectedYear)
  const yearLevelSemesters = currentYearLevelItem 
    ? semestersByYearLevel[currentYearLevelItem.yearLevel.year_level_id] || []
    : []
  
  // Enhanced semester grouping using actual semester data
  const subjectsBySemester = yearSubjects.reduce((acc, subject) => {
    const semesterId = subject.semester_id
    if (!acc[semesterId]) {
      acc[semesterId] = []
    }
    acc[semesterId].push(subject)
    return acc
  }, {} as Record<number, Subject[]>)

  // Create semester display data with proper ordering
  const semesterDisplayData = yearLevelSemesters
    .sort((a, b) => a.semester_number - b.semester_number)
    .map(semester => ({
      ...semester,
      subjects: subjectsBySemester[semester.semester_id] || [],
      subjectCount: subjectsBySemester[semester.semester_id]?.length || 0
    }))

  // Calculate total semesters for the course using multiple methods for verification
  // Method 1: Direct count from API response (primary)
  const totalSemestersForCourse = semesters.length
  
  // Method 2: Count from year levels data (fallback)
  const semestersFromYearLevels = Object.values(semestersByYearLevel).flat().length
  
  // Method 3: Count unique semesters from subjects (last resort)
  const uniqueSemestersFromSubjects = [...new Set(subjects.map(s => s.semester_id))].length

  // Enhanced debug logging with comprehensive year level and semester information
  console.log('Enhanced data processing:', {
    totalYearLevels: yearLevels,
    availableYearLevels,
    yearNumbers,
    selectedYear,
    currentYearLevelItem,
    yearLevelSemesters,
    semesterDisplayData,
    yearSubjects: yearSubjects.length,
    subjectsBySemester,
    yearLevelsDetails: availableYearLevels.map(item => ({
      year: item.year,
      name: item.name,
      id: item.yearLevel.year_level_id,
      courseId: item.yearLevel.course_id,
      createdAt: item.yearLevel.created_at,
      updatedAt: item.yearLevel.updated_at,
      semesterCount: yearLevelSemesters.length
    })),
    subjectsCount: subjects.length,
    semestersCount: semesters.length,
    totalSemestersForCourse,
    semestersFromYearLevels,
    uniqueSemestersFromSubjects,
    semestersByYearLevelKeys: Object.keys(semestersByYearLevel)
  })

  // Navigation handlers
  const handleBackToCourses = () => {
    router.push(`/admin/curriculum/${departmentId}/courses`)
  }

  const handleBackToDepartments = () => {
    router.push('/admin/curriculum')
  }

  // Subject handlers
  const handleAddSubject = (semesterData: any) => {
    setSelectedSemester(semesterData.semester_number)
    setSelectedSemesterData(semesterData)
    setIsAddSubjectModalOpen(true)
  }

  const handleAddFirstSubject = () => {
    // For the case when no semesters exist yet, we can't add a subject
    toast.warning("Please add a semester first before adding subjects")
  }

  const handleEditSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsEditSubjectModalOpen(true)
  }

  const handleDeleteSubject = (subject: Subject) => {
    setSelectedSubject(subject)
    setIsDeleteSubjectModalOpen(true)
  }

  const handleAddSemester = () => {
    // Set the current year level for the semester modal
    setSelectedYearLevelForSemester(currentYearLevelItem?.yearLevel.year_level_id)
    setIsAddSemesterModalOpen(true)
  }

  const handleEditSemester = (semesterData: any) => {
    closeDropdown(semesterData.semester_id)
    setSelectedSemesterData(semesterData)
    setIsEditSemesterModalOpen(true)
  }

  const handleDeleteSemester = (semesterData: any) => {
    closeDropdown(semesterData.semester_id)
    setSelectedSemesterData(semesterData)
    setIsDeleteSemesterModalOpen(true)
  }

  // Enhanced Year Level handlers with better error handling and validation
  const handleAddYearLevel = () => {
    if (!courseId) {
      toast.error("Course ID is missing")
      return
    }
    setIsAddYearLevelModalOpen(true)
  }

  const handleEditYearLevel = (yearLevel: YearLevel) => {
    if (!yearLevel || !yearLevel.year_level_id) {
      toast.error("Invalid year level selected")
      return
    }
    setSelectedYearLevel(yearLevel)
    setIsEditYearLevelModalOpen(true)
  }

  const handleDeleteYearLevel = (yearLevel: YearLevel) => {
    if (!yearLevel || !yearLevel.year_level_id) {
      toast.error("Invalid year level selected")
      return
    }
    
    // Check if year level has subjects or semesters
    const hasSubjects = subjects.some(s => s.year_level_id === yearLevel.year_level_id)
    const hasSemesters = semesters.some(s => s.year_level_id === yearLevel.year_level_id)
    
    if (hasSubjects || hasSemesters) {
      toast.warning(`This year level has ${hasSubjects ? 'subjects' : ''}${hasSubjects && hasSemesters ? ' and ' : ''}${hasSemesters ? 'semesters' : ''}. Deleting will remove all associated data.`)
    }
    
    setSelectedYearLevel(yearLevel)
    setIsDeleteYearLevelModalOpen(true)
  }

  // Accordion toggle function
  const toggleSemesterAccordion = (semesterId: number) => {
    setExpandedSemesters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(semesterId)) {
        newSet.delete(semesterId)
      } else {
        newSet.add(semesterId)
      }
      return newSet
    })
  }

  // Dropdown control functions
  const toggleDropdown = (semesterId: number) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(semesterId)) {
        newSet.delete(semesterId)
      } else {
        newSet.add(semesterId)
      }
      return newSet
    })
  }

  const closeDropdown = (semesterId: number) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      newSet.delete(semesterId)
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin border-4 border-[var(--customized-color-one)] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg text-gray-600 dark:text-gray-400">Loading subjects...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!department || !course) {
    return (
      <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors">
        <div className="p-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Data Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The requested department or course could not be found.</p>
            <Button onClick={handleBackToDepartments} className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Departments
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] transition-colors">
      <div className="p-5 w-full space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center">
            <Button 
              onClick={handleBackToCourses}
              variant="outline"
              className="group bg-white hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] border-none shadow md text-xs flex items-center gap-1 transition-all duration-300 pl-3 pr-3 transition-transform duration-500 hover:-translate-x-2"
            >
              <ArrowLeft className="w-3 h-3 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-80" />
              Back to Courses
            </Button>
          </div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Curriculum Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400">Manage departments, academic courses and subjects</p>
        </div>

        {/* Year Level Tabs */}
        <div className="bg-white rounded-md dark:border-gray-700">
          <div className="flex items-center justify-between px-6 py-3">
            <Tabs value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))} className="flex-1">
              <TabsList className="h-auto p-0 bg-transparent rounded-none border-0">
                <div className="flex items-center gap-2 w-full">
                  <div>
                    {availableYearLevels.length > 0 ? availableYearLevels.map((item) => (
                      <TabsTrigger 
                        key={item.year}
                        value={item.year.toString()}
                        className="flex-1 gap-1 px-6 py-2 text-sm font-medium rounded-lg border-b-2 border-transparent data-[state=active]:border-[var(--customized-color-one)] data-[state=active]:text-[var(--customized-color-one)] data-[state=active]:bg-[transparent] data-[state=active]:hover:bg-[var(--customized-color-four)] hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] text-gray-600 mr-2 dark:hover:text-gray-300"
                      >
                        {item.name}
                      </TabsTrigger>
                    )) : (
                      <p>No year levels found</p>
                    )}
                  </div>
                  <Button 
                    onClick={handleAddYearLevel}
                    size="sm"
                    className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white rounded-full p-2 h-[32px]"
                    disabled={isLoading}
                    title="Add New Year Level"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </TabsList>
            </Tabs>
            
            {/* Enhanced Year Level Actions */}
            <div className="flex items-center gap-2">
              {yearLevels.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-gray-600 border-none hover:!text-[var(--customized-color-one)] hover:bg-[var(--customized-color-five)] dark:hover:text-gray-300"
                      disabled={isLoading}
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer" onClick={() => {
                      const currentYearLevelItem = availableYearLevels.find(item => item.year === selectedYear)
                      if (currentYearLevelItem) handleEditYearLevel(currentYearLevelItem.yearLevel)
                    }}>
                      <Edit className="w-4 h-4" />
                      Edit Current Year Level
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const currentYearLevelItem = availableYearLevels.find(item => item.year === selectedYear)
                        if (currentYearLevelItem) handleDeleteYearLevel(currentYearLevelItem.yearLevel)
                      }}
                      className="flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
                    >
                      <Trash className="w-4 h-4" />
                      Delete Current Year Level
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Content Area */}
          <div className="">
            {/* Header Section - Program Banner */}
            <div className={`p-6 rounded-md ${headerColor}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {course.course_name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <strong className="text-white">Course Code: </strong>
                    <p className="text-gray-300">{course.course_code}</p>
                  </div>
                  {/* Enhanced Year Level Information */}
                  <div className="mt-3 flex items-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                      <strong className="text-white">Year Levels:</strong>
                      <span className="text-gray-300">{yearLevels.length}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <strong className="text-white">Total Subjects:</strong>
                      <span className="text-gray-300">{subjects.length}</span>
                    </div>
                    {/* <div className="flex items-center gap-2">
                      <strong className="text-white">Semesters:</strong>
                      <span className="text-gray-300">
                        {totalSemestersForCourse > 0 ? totalSemestersForCourse : 
                          // Fallback: count from year levels if API data is incomplete
                          semestersFromYearLevels > 0 ? semestersFromYearLevels :
                          // Last resort: count unique semesters from subjects
                          uniqueSemestersFromSubjects
                        }
                      </span>
                    </div> */}
                    <div className="flex items-center gap-2">
                      <strong className="text-white">Total Units:</strong>
                      <span className="text-gray-300">
                        {subjects.reduce((sum, subject) => sum + (subject.units || 0), 0)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Semester Sections */}
            <Tabs value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))} className="w-full">
              <div className="pt-6">
                {availableYearLevels.length > 0 ? availableYearLevels.map((item) => (
                  <TabsContent key={item.year} value={item.year.toString()} className="mt-0">
                    <div className="space-y-6">
                      {/* Year Level Information Panel */}
                      {/* <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {item.name} Details
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <span>ID: {item.yearLevel.year_level_id}</span>
                              <span>Created: {new Date(item.yearLevel.created_at).toLocaleDateString()}</span>
                              <span>Updated: {new Date(item.yearLevel.updated_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>Subjects: {item.yearLevel.subject_count || yearSubjects.length}</span>
                            <span>Semesters: {yearLevelSemesters.length}</span>
                            <span>Units: {item.yearLevel.total_units || 0}</span>
                          </div>
                        </div>
                      </div> */}

                      {/* Semester Actions - Available for every year level */}
                      <div className="flex justify-end gap-3">
                        <Button 
                          onClick={handleAddSemester}
                          className="bg-[var(--customized-color-one)] text-white hover:bg-[var(--customized-color-two)] border-[var(--customized-color-one)]"
                        >
                          <Plus className="w-5 h-5" />
                          New Semester
                        </Button>
                      </div>

                      {semesterDisplayData.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <h3 className="text-lg font-medium text-black dark:text-white mb-2">
                            No subjects yet for {availableYearLevels.find(item => item.year === selectedYear)?.name || 'this year level'}
                          </h3>
                          <p className="text-gray-500 mb-6">
                            Get started by adding semesters for this year level.
                          </p>
                        </div>
                      </div>
                      ) : (
                        <div className="space-y-6">
                        {semesterDisplayData.map((semesterData) => (
                          <div key={semesterData.semester_id} className="bg-white rounded-lg overflow-hidden border-none">
                            {/* Enhanced Semester Header - Clickable Accordion */}
                            <div 
                              className="bg-white px-4 py-3 cursor-pointer rounded-lg transition-colors duration-200 border border-transparent focus:border-[var(--customized-color-one)]"
                              role="button"
                              tabIndex={0}
                              aria-expanded={expandedSemesters.has(semesterData.semester_id)}
                              onClick={(e) => { e.currentTarget.focus(); toggleSemesterAccordion(semesterData.semester_id) }}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <h3 className="text-lg font-semibold text-black dark:text-gray-400">
                                    {semesterData.semester_name}
                                  </h3>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <DropdownMenu 
                                      open={openDropdowns.has(semesterData.semester_id)}
                                      onOpenChange={(open) => {
                                        if (!open) {
                                          closeDropdown(semesterData.semester_id)
                                        }
                                      }}
                                    >
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-8 w-8 p-0 text-gray-600 hover:!text-[var(--customized-color-one)] hover:bg-[var(--customized-color-five)]"
                                          onClick={(e) => { 
                                            e.stopPropagation(); 
                                            e.preventDefault(); 
                                            toggleDropdown(semesterData.semester_id);
                                          }}
                                        >
                                          <MoreVertical className="h-4 w-4" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-48 bg-white">
                                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEditSemester(semesterData)}} className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer">
                                          <Edit className="h-4 w-4" />
                                          Edit Semester
                                        </DropdownMenuItem>
                                        <DropdownMenuItem 
                                          onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteSemester(semesterData)}} 
                                          className="flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
                                        >
                                          <Trash className="h-4 w-4" />
                                          Delete Semester
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Semester Content - Accordion */}
                            {expandedSemesters.has(semesterData.semester_id) && (
                              <div className="p-0 transition-all duration-300 ease-in-out border-t border-gray-300">
                                {semesterData.subjects.length > 0 ? (
                                  <>
                                    <div className="overflow-x-auto p-4 bg-white">
                                      <table className="w-full rounded-t-lg border-none overflow-hidden">
                                        <thead className="bg-[var(--customized-color-four)] rounded-lg dark:bg-gray-800 w-full">
                                          <tr>
                                            <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Subject Code</th>
                                            <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Subject Name</th>
                                            <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Units</th>
                                            <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Year</th>
                                            <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Semester</th>
                                            <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider w-[50px]"></th>
                                          </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                          {semesterData.subjects.map((subject) => (
                                            <tr key={subject.subject_id} className="hover:bg-[var(--customized-color-five)] dark:hover:bg-gray-700">
                                              <td className="px-2 py-2 text-sm text-black dark:text-white">
                                                {subject.subject_code}
                                              </td>
                                              <td className="px-2 py-2 text-sm text-black dark:text-gray-400">
                                                {subject.subject_name}
                                              </td>
                                              <td className="px-2 py-2 text-sm text-black dark:text-gray-400">
                                                {subject.units}
                                              </td>
                                              <td className="px-2 py-2 text-sm text-black dark:text-gray-400">
                                                {subject.year_level?.name || 'N/A'}
                                              </td>
                                              <td className="px-2 py-2 text-sm text-black dark:text-gray-400">
                                                {subject.semester?.semester_name || 'N/A'}
                                              </td>
                                              <td className="px-2 py-2 text-sm flex justify-end">
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                      <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => handleEditSubject(subject)} className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer">
                                                      <Edit className="w-4 h-4 mr-2" />
                                                      Edit Subject
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                      onClick={() => handleDeleteSubject(subject)}
                                                      className="flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
                                                    >
                                                      <Trash className="w-4 h-4 mr-2" />
                                                      Delete Subject
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                    
                                    {/* Add Subject Button */}
                                    <div className="px-4 py-4 dark:bg-gray-800 w-full border-t border-gray-300">
                                      <div className="flex justify-center w-full">
                                        <Button 
                                          onClick={() => handleAddSubject(semesterData)}
                                          className="bg-[var(--customized-color-one)] text-white hover:bg-[var(--customized-color-two)] border-none w-full"
                                        >
                                          <Plus className="w-4 h-4 mr-2" />
                                          New Subject
                                        </Button>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <div className="text-center py-12">
                                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                                      No subjects for {semesterData.semester_name}
                                    </p>
                                    <Button 
                                      onClick={() => handleAddSubject(semesterData)}
                                      className="bg-[var(--customized-color-one)] text-white hover:bg-[var(--customized-color-two)] border-none"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                    New Subject
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                )) : (
                  <TabsContent value="1" className="mt-0">
                    <div className="space-y-6">
                      {/* Semester Actions - Available even when no year levels exist */}
                      <div className="flex justify-end gap-3">
                        <Button 
                          onClick={handleAddSemester}
                          className="bg-[var(--customized-color-one)] text-white hover:bg-[var(--customized-color-two)] border-[var(--customized-color-one)]"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          New Semester
                        </Button>
                      </div>

                      <div className="text-center py-12">
                        <div className="max-w-md mx-auto">
                          <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No year levels yet
                          </h3>
                          <p className="text-gray-500 dark:text-gray-400 mb-6">
                            Get started by adding year levels for this course. You need year levels before adding semesters and subjects.
                          </p>
                          <Button 
                            onClick={handleAddYearLevel}
                            className="bg-[var(--customized-color-one)] text-white hover:bg-[var(--customized-color-two)] border-[var(--customized-color-one)]"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Your First Year Level
                          </Button>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
              </div>
            </Tabs>
          </div>
        </div>

        {/* Add Subject Modal */}
        <AddSubjectModal
          isOpen={isAddSubjectModalOpen}
          onClose={() => {
            setIsAddSubjectModalOpen(false)
            setSelectedSemesterData(null)
          }}
          onSuccess={() => {
            fetchData()
            toast.success("Subject added successfully!")
            setSelectedSemesterData(null)
          }}
          courseId={courseId}
          yearLevelId={selectedSemesterData?.year_level_id}
          semesterId={selectedSemesterData?.semester_id}
          yearLevelName={currentYearLevelItem?.yearLevel.name}
          semesterName={selectedSemesterData?.semester_name}
        />

        {/* Edit Subject Modal */}
        <EditSubjectModal
          isOpen={isEditSubjectModalOpen}
          onClose={() => {
            setIsEditSubjectModalOpen(false)
            setSelectedSubject(null)
          }}
          onSuccess={() => {
            fetchData()
            toast.success("Subject updated successfully!")
            setSelectedSubject(null)
          }}
          subject={selectedSubject}
        />

        {/* Delete Subject Modal */}
        <DeleteSubjectModal
          isOpen={isDeleteSubjectModalOpen}
          onClose={() => {
            setIsDeleteSubjectModalOpen(false)
            setSelectedSubject(null)
          }}
          onSuccess={() => {
            fetchData()
            toast.success("Subject deleted successfully!")
            setSelectedSubject(null)
          }}
          subject={selectedSubject}
        />

        {/* Add Semester Modal */}
        <AddSemesterModal
          isOpen={isAddSemesterModalOpen}
          onClose={() => {
            setIsAddSemesterModalOpen(false)
            setSelectedYearLevelForSemester(undefined)
          }}
          onSuccess={() => {
            fetchData()
            toast.success("Semester added successfully!")
            setSelectedYearLevelForSemester(undefined)
          }}
          courseId={courseId}
          preSelectedYearLevel={selectedYearLevelForSemester}
          yearLevelName={currentYearLevelItem?.yearLevel.name}
        />

        {/* Edit Semester Modal */}
        <EditSemesterModal
          isOpen={isEditSemesterModalOpen}
          onClose={() => {
            setIsEditSemesterModalOpen(false)
            setSelectedSemesterData(null)
          }}
          onSuccess={() => {
            fetchData()
            toast.success("Semester updated successfully!")
            setSelectedSemesterData(null)
          }}
          semester={selectedSemesterData}
        />

        {/* Delete Semester Modal */}
        <DeleteSemesterModal
          isOpen={isDeleteSemesterModalOpen}
          onClose={() => {
            setIsDeleteSemesterModalOpen(false)
            setSelectedSemesterData(null)
          }}
          onSuccess={() => {
            fetchData()
            setSelectedSemesterData(null)
          }}
          semester={selectedSemesterData}
        />

        {/* Add Year Level Modal */}
        <AddYearLevelModal
          isOpen={isAddYearLevelModalOpen}
          onClose={() => setIsAddYearLevelModalOpen(false)}
          onSuccess={() => {
            fetchData()
          }}
          courseId={courseId}
        />

        {/* Edit Year Level Modal */}
        <EditYearLevelModal
          isOpen={isEditYearLevelModalOpen}
          onClose={() => setIsEditYearLevelModalOpen(false)}
          onSuccess={() => {
            fetchData()
            toast.success("Year level updated successfully!")
          }}
          yearLevel={selectedYearLevel}
        />

        {/* Delete Year Level Modal */}
        <DeleteYearLevelModal
          isOpen={isDeleteYearLevelModalOpen}
          onClose={() => setIsDeleteYearLevelModalOpen(false)}
          onSuccess={() => {
            fetchData()
            toast.success("Year level deleted successfully!")
            // Reset to first available year level if current one was deleted
            if (availableYearLevels.length > 0) {
              setSelectedYear(availableYearLevels[0].year)
            }
          }}
          yearLevel={selectedYearLevel}
        />
      </div>
    </div>
  )
}