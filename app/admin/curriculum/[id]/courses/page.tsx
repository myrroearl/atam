"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, MoreVertical, Edit, Trash } from "lucide-react"
import { toast } from "sonner"
import { generateAcronym } from "@/lib/utils"
import CourseCard from "@/components/admin/course-card"
import NewCourseModalNew from "@/components/admin/new-course-modal"
import EditCourseModalNew from "@/components/admin/edit-course-modal"
import DeleteCourseModalNew from "@/components/admin/delete-course-modal"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface GradeComponent {
  component_id: number
  component_name: string
  weight_percentage: number
  created_at: string
}

interface Department {
  department_id: number
  department_name: string
  description: string | null
  dean_name: string
  created_at: string
  updated_at: string
  grade_components?: GradeComponent[]
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

export default function CoursePage() {
  const router = useRouter()
  const params = useParams()
  const departmentId = params.id as string

  const [department, setDepartment] = useState<Department | null>(null)
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  // Modal states
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [isNewCourseModalOpen, setIsNewCourseModalOpen] = useState(false)
  const [isEditCourseModalOpen, setIsEditCourseModalOpen] = useState(false)
  const [isDeleteCourseModalOpen, setIsDeleteCourseModalOpen] = useState(false)
  const [openDropdowns, setOpenDropdowns] = useState<Set<number>>(new Set())

  // Color variations for course cards (reuse department card palette)
  const cardColors = [
    "bg-[var(--customized-color-two)]",
    "bg-[var(--customized-color-three)]",
  ]

  const headerColor = department ? cardColors[department.department_id % cardColors.length] : cardColors[0]

  // Fetch department and courses
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

      // Fetch courses for this department
      const coursesResponse = await fetch(`/api/admin/course?department_id=${departmentId}`)
      if (!coursesResponse.ok) {
        throw new Error('Failed to fetch courses')
      }
      const coursesResult = await coursesResponse.json()
      setCourses(coursesResult.courses || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Failed to load department data")
      router.push('/admin/curriculum')
    } finally {
      setIsLoading(false)
    }
  }

  // Dropdown control functions
  const toggleDropdown = (courseId: number) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      if (newSet.has(courseId)) {
        newSet.delete(courseId)
      } else {
        newSet.add(courseId)
      }
      return newSet
    })
  }

  const closeDropdown = (courseId: number) => {
    setOpenDropdowns(prev => {
      const newSet = new Set(prev)
      newSet.delete(courseId)
      return newSet
    })
  }

  useEffect(() => {
    if (departmentId) {
      fetchData()
    }
  }, [departmentId])

  // Handle add course
  const handleAddCourse = () => {
    setSelectedCourse(null)
    setIsNewCourseModalOpen(true)
  }

  // Handle edit course
  const handleEditCourse = (course: Course) => {
    closeDropdown(course.course_id)
    setSelectedCourse(course)
    setIsEditCourseModalOpen(true)
  }

  // Handle delete course
  const handleDeleteCourse = (course: Course) => {
    closeDropdown(course.course_id)
    setSelectedCourse(course)
    setIsDeleteCourseModalOpen(true)
  }

  // Handle view subjects for a course
  const handleViewSubjects = (course: Course) => {
    router.push(`/admin/curriculum/${departmentId}/courses/${course.course_id}/subjects`)
  }

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    fetchData()
  }

  // Handle back to departments
  const handleBackToDepartments = () => {
    router.push('/admin/curriculum')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors">
        <div className="p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-8 h-8 animate-spin border-4 border-[var(--customized-color-one)] border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-lg text-black dark:text-gray-400">Loading courses...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!department) {
    return (
      <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors">
        <div className="p-8">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-black dark:text-white mb-2">Department Not Found</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">The requested department could not be found.</p>
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
              onClick={handleBackToDepartments}
              variant="outline"
              className="group bg-white hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] border-none shadow md text-xs flex items-center gap-1 transition-all duration-300 pl-3 pr-3 transition-transform duration-500 hover:-translate-x-2"
            >
              <ArrowLeft className="w-5 h-5 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-80" />
              Back to Departments
            </Button>
          </div>
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Curriculum Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400">Manage departments, academic courses and subjects</p>
        </div>

        {/* Department Info */}
        <div className={`${headerColor} rounded-xl border-none p-5`}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white dark:text-white mb-2">
                {department.department_name}
              </h2>
              {department.description && (
                <p className="text-sm text-gray-300 dark:text-gray-400 mb-2">
                  {department.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm">
                <span className="text-gray-300"><strong className="text-white">Dean:</strong> {department.dean_name}</span>
                <span className="text-gray-300"><strong className="text-white">Course:</strong> {courses.length}</span>
                {department.grade_components && department.grade_components.length > 0 && (
                  <span className="text-gray-300"><strong className="text-white">Grading Components:</strong> {department.grade_components.length}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">Courses</h2>
          <Button 
            onClick={handleAddCourse}
            className="flex items-center gap-2 bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none"
          >
            <Plus className="w-5 h-5" />
            New Course
          </Button>
        </div>

        {/* Courses List */}
        {courses.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No courses yet
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                Get started by creating the first course for this department.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {courses.map((course, index) => (
              <div key={course.course_id} className="flex dark:border-gray-700 rounded-xl bg-white dark:bg-black border-0 transition-transform duration-500 hover:-translate-y-2 shadow-md cursor-pointer" onClick={() => handleViewSubjects(course)}>
                {/* Left Side - Colored Section */}
                <div className={`flex items-center justify-center w-24 p-6 rounded-l-xl ${cardColors[index % cardColors.length]}`}>
                  <span className="font-extrabold text-xl text-white dark:text-white">
                    {course.course_code}
                  </span>
                </div>

                {/* Right Side - Main Section */}
                <div className="flex-1 p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-black dark:text-white">
                        {course.course_name}
                      </h3>
                      {course.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1">
                          {course.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {/* <Button
                        onClick={() => handleViewSubjects(course)}
                        className="bg-blue-600 text-white hover:bg-blue-700"
                      >
                        View Subjects
                      </Button> */}
                      <DropdownMenu
                        open={openDropdowns.has(course.course_id)}
                        onOpenChange={(open) => {
                          if (!open) {
                            closeDropdown(course.course_id)
                          }
                        }}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-gray-600 hover:!text-[var(--customized-color-one)] hover:bg-[var(--customized-color-five)] dark:hover:text-gray-300"
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); toggleDropdown(course.course_id); }}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEditCourse(course)}} className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer">
                            <Edit className="h-4 w-4" />
                            Edit Course
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDeleteCourse(course) }} 
                            className="flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
                          >
                            <Trash className="h-4 w-4" />
                            Delete Course
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modals */}
        <NewCourseModalNew
          isOpen={isNewCourseModalOpen}
          onClose={() => setIsNewCourseModalOpen(false)}
          onSuccess={handleModalSuccess}
          departmentId={departmentId}
          departmentName={department.department_name}
        />

        <EditCourseModalNew
          isOpen={isEditCourseModalOpen}
          onClose={() => setIsEditCourseModalOpen(false)}
          onSuccess={handleModalSuccess}
          course={selectedCourse}
        />

        <DeleteCourseModalNew
          isOpen={isDeleteCourseModalOpen}
          onClose={() => setIsDeleteCourseModalOpen(false)}
          onSuccess={handleModalSuccess}
          course={selectedCourse}
        />
      </div>
    </div>
  )
}
