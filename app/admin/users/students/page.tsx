"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, ArrowDownAZ, ArrowDownZA, ArrowUpDown } from "lucide-react"
import { AddStudentModal } from "@/components/admin/add-student-modal"
import { StudentsTable } from "@/components/admin/students-table"
import { StudentsPageSkeleton } from "@/components/admin/page-skeletons"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Student, StudentsResponse } from "@/types/student"

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all-courses");
  const [yearLevelFilter, setYearLevelFilter] = useState("all-year-levels");
  const [sectionFilter, setSectionFilter] = useState("all-sections");
  const [statusFilter, setStatusFilter] = useState("all-status");
  // Always sort by last name
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch students from API
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/students')
        if (!response.ok) {
          throw new Error('Failed to fetch students')
        }
        const data: StudentsResponse = await response.json()
        setStudents(data.students)
      } catch (error) {
        console.error('Error fetching students:', error)
        toast.error('Failed to fetch students')
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  useEffect(() => {
    setCurrentPage(1);
  }, [search, courseFilter, yearLevelFilter, sectionFilter, statusFilter, sortOrder]);

  // Check for duplicate student
  const checkDuplicateStudent = (email: string, studentId?: string) => {
    return students.some(student => 
      student.email.toLowerCase() === email.toLowerCase() &&
      student.id !== studentId
    )
  }

  // Handle validation error
  const handleValidationError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
  }

  const handleAddStudent = async (studentData: any) => {
    setError(null) // Clear any previous errors
    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to add student')
      }

      const result = await response.json()
      setStudents((prev) => [result.student, ...prev])
    toast.success("Student added successfully!");
    } catch (error) {
      console.error('Error adding student:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add student')
    }
  }

  const handleEditStudent = async (updatedStudent: Student) => {
    setError(null) // Clear any previous errors
    try {
      const response = await fetch('/api/admin/students', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: updatedStudent.student_id,
          firstName: updatedStudent.name.split(', ')[1]?.split(' ')[0] || '',
          middleName: updatedStudent.name.split(', ')[1]?.split(' ').slice(1).join(' ') || '',
          lastName: updatedStudent.name.split(', ')[0] || '',
          email: updatedStudent.email,
          password: '', // Password will be handled separately if needed
          course: updatedStudent.course,
          schoolYear: updatedStudent.schoolYear,
          yearLevel: updatedStudent.yearSection.split(' & ')[0],
          section: updatedStudent.yearSection.split(' & ')[1],
          status: updatedStudent.status,
          birthday: updatedStudent.birthday,
          address: updatedStudent.address,
          contactNumber: updatedStudent.contact_number,
          // Provide IDs to ensure reliable server-side resolution
          courseId: String(updatedStudent.course_id),
          sectionId: String(updatedStudent.section_id)
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update student');
      }

      const data = await response.json();
      setStudents((prev) => prev.map((s) => (s.id === updatedStudent.id ? data.student : s)));
    toast.success("Student updated successfully!");
    } catch (error) {
      console.error('Error updating student:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update student');
    }
  }

  const handleDeleteStudent = async (studentId: string) => {
    try {
      // The actual archiving is handled by the DeleteStudentModal
      // Here we just remove the student from the local state
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
    } catch (error) {
      console.error('Error removing student from list:', error);
      toast.error('Failed to update student list');
    }
  }

  // Helper to get last name for sorting
  function getLastName(name: string) {
    const [last] = name.split(",");
    return last ? last.trim().toLowerCase() : name.toLowerCase();
  }

  // Enhanced filtering and sorting logic with cascading behavior
  let filtered = students.filter((s) => {
    // Search filter - comprehensive search across multiple fields
    const searchTerm = search.toLowerCase().trim()
    const matchesSearch = !searchTerm || 
      s.name.toLowerCase().includes(searchTerm) ||
      s.email.toLowerCase().includes(searchTerm) ||
      s.id.toLowerCase().includes(searchTerm) ||
      s.yearSection.toLowerCase().includes(searchTerm) ||
      s.course.toLowerCase().includes(searchTerm)
    
    // Course filter - exact match
    const matchesCourse = courseFilter === "all-courses" || s.course === courseFilter;
    
    // Year level filter - extract year level from yearSection with error handling
    let yearLevelFromSection = ""
    if (s.yearSection && s.yearSection.includes(' & ')) {
      yearLevelFromSection = s.yearSection.split(' & ')[0].trim()
    }
    const matchesYearLevel = yearLevelFilter === "all-year-levels" || yearLevelFromSection === yearLevelFilter;
    
    // Section filter - extract section from yearSection with error handling
    let sectionFromSection = ""
    if (s.yearSection && s.yearSection.includes(' & ')) {
      sectionFromSection = s.yearSection.split(' & ')[1].trim()
    }
    const matchesSection = sectionFilter === "all-sections" || sectionFromSection === sectionFilter;
    
    // Status filter - exact match
    const matchesStatus = statusFilter === "all-status" || s.status === statusFilter;
    
    return matchesSearch && matchesCourse && matchesYearLevel && matchesSection && matchesStatus;
  });

  filtered = filtered.sort((a, b) => {
    const lastA = getLastName(a.name);
    const lastB = getLastName(b.name);
    if (lastA < lastB) return sortOrder === "asc" ? -1 : 1;
    if (lastA > lastB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return <StudentsPageSkeleton />
  }

  // Get unique values for filters with cascading logic
  const getFilteredCourses = () => {
    return [...new Set(students.map(s => s.course))].sort()
  }

  const getFilteredYearLevels = () => {
    let filteredStudents = students
    
    // If course is selected, filter by course first
    if (courseFilter !== "all-courses") {
      filteredStudents = filteredStudents.filter(s => s.course === courseFilter)
    }
    
    // Extract year levels with error handling
    const yearLevels = filteredStudents
      .map(s => {
        if (s.yearSection && s.yearSection.includes(' & ')) {
          return s.yearSection.split(' & ')[0].trim()
        }
        return null
      })
      .filter((level): level is string => level !== null && level !== '')
    
    return [...new Set(yearLevels)].sort()
  }

  const getFilteredSections = () => {
    let filteredStudents = students
    
    // If course is selected, filter by course first
    if (courseFilter !== "all-courses") {
      filteredStudents = filteredStudents.filter(s => s.course === courseFilter)
    }
    
    // If year level is selected, filter by year level
    if (yearLevelFilter !== "all-year-levels") {
      filteredStudents = filteredStudents.filter(s => {
        if (s.yearSection && s.yearSection.includes(' & ')) {
          return s.yearSection.split(' & ')[0].trim() === yearLevelFilter
        }
        return false
      })
    }
    
    // Extract sections with error handling
    const sections = filteredStudents
      .map(s => {
        if (s.yearSection && s.yearSection.includes(' & ')) {
          return s.yearSection.split(' & ')[1].trim()
        }
        return null
      })
      .filter((section): section is string => section !== null && section !== '')
    
    return [...new Set(sections)].sort()
  }

  // Reset dependent filters when parent filter changes
  const handleCourseFilterChange = (value: string) => {
    setCourseFilter(value)
    // Reset dependent filters
    setYearLevelFilter("all-year-levels")
    setSectionFilter("all-sections")
  }

  const handleYearLevelFilterChange = (value: string) => {
    setYearLevelFilter(value)
    // Reset dependent filter
    setSectionFilter("all-sections")
  }

  return (
    <div className="p-5 space-y-6 w-full bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Student Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400">Manage student accounts, enrollment, and academic records</p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}
          <AddStudentModal onAdd={handleAddStudent} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center w-full gap-2">
        <div className="relative min-w-[400px] text-[11px] !border-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3" />
          <Input
            placeholder="Search student..."
            className="pl-9 text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={courseFilter} onValueChange={handleCourseFilterChange}>
          <SelectTrigger className="min-w-[400px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-courses" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Courses</SelectItem>
            {getFilteredCourses().map((course) => (
              <SelectItem key={course} value={course} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">{course}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={yearLevelFilter} onValueChange={handleYearLevelFilterChange}>
          <SelectTrigger className="min-w-[50px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Year Levels" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-year-levels" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Year Levels</SelectItem>
            {getFilteredYearLevels().map((yearLevel) => (
              <SelectItem key={yearLevel} value={yearLevel} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">{yearLevel}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="min-w-[50px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-sections" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Sections</SelectItem>
            {getFilteredSections().map((section) => (
              <SelectItem key={section} value={section} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">{section}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="flex items-center gap-2 border bg-white min-w-[80px] text-[11px] px-3 py-2 dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0 hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)] transition-colors duration-200"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <span className="font-medium">Sort</span>
          <div className="flex flex-col items-center">
            {sortOrder === "asc" ? (
              <>
                <ArrowDownZA className="w-3 h-3 text-[var(--customized-color-one)]" />
              </>
            ) : (
              <>
                <ArrowDownAZ className="w-3 h-3 text-[var(--customized-color-one)]" />
              </>
            )}
          </div>
        </Button>
      </div>

      {/* Table */}
      <StudentsTable students={filtered} onDeleteStudent={handleDeleteStudent} onEditStudent={handleEditStudent} currentPage={currentPage} setCurrentPage={setCurrentPage} />
    </div>
  )
}