"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, ArrowLeft, MoreVertical, Edit, Trash, BookOpen } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import AddSubjectModal from "@/components/admin/add-subject-modal"

interface Subject {
  subject_id: number
  course_id: number
  subject_code: string
  subject_name: string
  units: number
  year_level: number
  semester: number
  subject_type?: string
  prerequisites?: string | null
  assigned_professor?: string | null
  status?: string
  created_at: string
  updated_at: string
}

interface Semester {
  semester_id: number
  course_id: number
  year_level: number
  semester_number: number
  semester_name: string
  created_at: string
  updated_at: string
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

export default function SubjectManagementPage() {
  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string
  const courseId = params.courseId as string

  const [department, setDepartment] = useState<Department | null>(null)
  const [course, setCourse] = useState<Course | null>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [semesters, setSemesters] = useState<Semester[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState<number>(1)
  
  // Modal states
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false)
  const [selectedSemester, setSelectedSemester] = useState<number>(1)

  // Fetch department, course, and subjects data
  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      // Fetch department details
      const deptResponse = await fetch(`/api/admin/department/${departmentId}`)
      if (!deptResponse.ok) {
        throw new Error('Failed to fetch department')
      }
      const deptResult = await deptResponse.json()
      setDepartment(deptResult.department)

      // Fetch course details
      const courseResponse = await fetch(`/api/admin/course/${courseId}`)
      if (!courseResponse.ok) {
        throw new Error('Failed to fetch course')
      }
      const courseResult = await courseResponse.json()
      setCourse(courseResult.course)

      // Fetch subjects for this course
      const subjectsResponse = await fetch(`/api/admin/subject?course_id=${courseId}`)
      if (!subjectsResponse.ok) {
        throw new Error('Failed to fetch subjects')
      }
      const subjectsResult = await subjectsResponse.json()
      setSubjects(subjectsResult.subjects || [])

      // Fetch semesters for this course
      const semestersResponse = await fetch(`/api/admin/semester?course_id=${courseId}`)
      if (!semestersResponse.ok) {
        throw new Error('Failed to fetch semesters')
      }
      const semestersResult = await semestersResponse.json()
      setSemesters(semestersResult.semesters || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Failed to load data")
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

  // Get available year levels
  const yearLevels = [...new Set(subjects.map(s => s.year_level))].sort()
  
  // Get subjects for selected year
  const yearSubjects = subjects.filter(s => s.year_level === selectedYear)
  
  // Group subjects by semester
  const subjectsBySemester = yearSubjects.reduce((acc, subject) => {
    const semester = subject.semester
    if (!acc[semester]) {
      acc[semester] = []
    }
    acc[semester].push(subject)
    return acc
  }, {} as Record<number, Subject[]>)

  // Navigation handlers
  const handleBackToCourses = () => {
    router.push(`/admin/curriculum/${departmentId}/courses`)
  }

  const handleBackToDepartments = () => {
    router.push('/admin/curriculum')
  }

  // Subject handlers
  const handleAddSubject = (semester: number) => {
    setSelectedSemester(semester)
    setIsAddSubjectModalOpen(true)
  }

  const handleEditSubject = (subject: Subject) => {
    // TODO: Open edit subject modal
    console.log('Edit subject:', subject)
    toast.info("Edit subject functionality coming soon")
  }

  const handleDeleteSubject = async (subject: Subject) => {
    if (confirm(`Are you sure you want to delete "${subject.subject_name}"?`)) {
      try {
        const response = await fetch(`/api/admin/subject/${subject.subject_id}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Failed to delete subject')
        }

        toast.success("Subject deleted successfully!")
        fetchData() // Refresh data
      } catch (error) {
        console.error('Error deleting subject:', error)
        toast.error(error instanceof Error ? error.message : "Failed to delete subject")
      }
    }
  }

  const handleAddSemester = () => {
    // TODO: Open add semester modal
    console.log('Add semester')
    toast.info("Add semester functionality coming soon")
  }

  const handleEditSemester = (semester: number) => {
    // TODO: Open edit semester modal
    console.log('Edit semester:', semester)
    toast.info("Edit semester functionality coming soon")
  }

  const handleDeleteSemester = (semester: number) => {
    // TODO: Open delete semester modal
    console.log('Delete semester:', semester)
    toast.info("Delete semester functionality coming soon")
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
    <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors">
      <div className="p-5 w-full space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center">
          <Button 
            onClick={handleBackToCourses}
            variant="outline"
            className="group hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] text-xs bg-transparent flex items-center gap-1 transition-all duration-300 pl-3 pr-3"
          >
            <ArrowLeft className="w-3 h-3 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-80" />
            Back to Courses
          </Button>

          </div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Curriculum Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400">Manage departments, academic courses and subjects</p>
        </div>
        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              onClick={handleBackToCourses}
              variant="outline"
              className="bg-white dark:bg-black border-gray-300 dark:border-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Courses
            </Button>
          </div>
          
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" onClick={handleBackToDepartments}>
              Academic Management System
            </span>
            <span></span>
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" onClick={handleBackToDepartments}>
              Departments
            </span>
            <span></span>
            <span className="hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer" onClick={handleBackToCourses}>
              {department.department_name}
            </span>
            <span></span>
            <span className="text-gray-900 dark:text-white font-medium">
              {course.course_name}
            </span>
          </nav>

          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Subject Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage subjects for {course.course_name}</p>
        </div>

        {/* Course Header */}
        <div className="bg-green-200 dark:bg-green-900/20 p-6 rounded-xl mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {course.course_name}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Course Code: {course.course_code}
              </p>
              {course.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {course.description}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddSemester}
                className="bg-green-600 text-white hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Semester
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleEditSemester(selectedYear)}
                className="bg-white dark:bg-black"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Semester
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleDeleteSemester(selectedYear)}
                className="bg-white dark:bg-black text-red-600 hover:text-red-700"
              >
                <Trash className="w-4 h-4 mr-2" />
                Delete Semester
              </Button>
            </div>
          </div>
        </div>

        {/* Year Level Tabs */}
        <Tabs value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))} className="w-full">
          <TabsList className="flex border-b bg-white dark:bg-black rounded-lg p-1 w-fit">
            {yearLevels.length > 0 ? yearLevels.map((year) => (
              <TabsTrigger 
                key={year}
                value={year.toString()}
                className="px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-green-100 data-[state=active]:text-green-900 dark:data-[state=active]:bg-green-900/20 dark:data-[state=active]:text-green-100"
              >
                {year}ST YEAR
              </TabsTrigger>
            )) : (
              <TabsTrigger value="1" className="px-4 py-2 text-sm font-medium rounded-md transition-colors data-[state=active]:bg-green-100 data-[state=active]:text-green-900 dark:data-[state=active]:bg-green-900/20 dark:data-[state=active]:text-green-100">
                1ST YEAR
              </TabsTrigger>
            )}
          </TabsList>

          {yearLevels.length > 0 ? yearLevels.map((year) => (
            <TabsContent key={year} value={year.toString()} className="mt-6">
              {/* Semester Sections */}
              {Object.keys(subjectsBySemester).length === 0 ? (
                <div className="text-center py-12">
                  <div className="max-w-md mx-auto">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No subjects yet
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-6">
                      Get started by adding subjects for this year level.
                    </p>
                    <Button 
                      onClick={() => handleAddSubject(1)}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Subject
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {[1, 2].map((semesterNum) => (
                    <div key={semesterNum} className="bg-white dark:bg-black rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                      {/* Semester Header */}
                      <div className="bg-green-200 dark:bg-green-900/20 font-semibold text-lg p-4 rounded-t-xl">
                        {semesterNum === 1 ? 'First' : 'Second'} Semester
                      </div>
                      
                      {/* Semester Content */}
                      <div className="p-6">
                        {subjectsBySemester[semesterNum]?.length > 0 ? (
                          <>
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                  <tr>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Subject Code</th>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Subject Name</th>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Units</th>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Year</th>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300">Semester</th>
                                    <th className="text-left p-3 font-semibold text-gray-700 dark:text-gray-300"></th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {subjectsBySemester[semesterNum].map((subject) => (
                                    <tr key={subject.subject_id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                      <td className="p-3 text-sm font-medium text-gray-900 dark:text-white">
                                        {subject.subject_code}
                                      </td>
                                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                        {subject.subject_name}
                                      </td>
                                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                        {subject.units}
                                      </td>
                                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                        {subject.year_level}
                                      </td>
                                      <td className="p-3 text-sm text-gray-600 dark:text-gray-400">
                                        {subject.semester}
                                      </td>
                                      <td className="p-3">
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                              <MoreVertical className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEditSubject(subject)}>
                                              <Edit className="w-4 h-4 mr-2" />
                                              Edit Subject
                                            </DropdownMenuItem>
                                            <DropdownMenuItem 
                                              onClick={() => handleDeleteSubject(subject)}
                                              className="text-red-600 hover:text-red-700"
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
                            <div className="mt-4 flex justify-end">
                              <Button 
                                onClick={() => handleAddSubject(semesterNum)}
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                <Plus className="w-4 h-4 mr-2" />
                                New Subject
                              </Button>
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                              <Plus className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 mb-4">
                              No subjects for {semesterNum === 1 ? 'First' : 'Second'} Semester
                            </p>
                            <Button 
                              onClick={() => handleAddSubject(semesterNum)}
                              className="bg-green-600 text-white hover:bg-green-700"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              New Subject
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          )) : (
            <TabsContent value="1" className="mt-6">
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    No subjects yet
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">
                    Get started by adding subjects for this course.
                  </p>
                  <Button 
                    onClick={() => handleAddSubject(1)}
                    className="bg-green-600 text-white hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Subject
                  </Button>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Add Subject Modal */}
        {/* <AddSubjectModal
          isOpen={isAddSubjectModalOpen}
          onClose={() => setIsAddSubjectModalOpen(false)}
          onSuccess={fetchData}
          courseId={courseId}
          yearLevel={selectedYear}
          semester={selectedSemester}
        /> */}
      </div>
    </div>
  )
}