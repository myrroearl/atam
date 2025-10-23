"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Eye, EyeOff, Loader2 } from "lucide-react"
import { StudentFormData } from "@/types/student"
import { toast } from "sonner"

interface AddStudentModalProps {
  onAdd: (studentData: StudentFormData) => void
}

interface Course {
  course_id: number
  course_code: string
  course_name: string
  departments: {
    department_name: string
  }
}

interface YearLevel {
  year_level_id: number
  name: string
  course_id: number
}

interface Section {
  section_id: number
  section_name: string
  course_id: number
  year_level_id: number
}

export function AddStudentModal({ onAdd }: AddStudentModalProps) {
  const [open, setOpen] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    course: "",
    yearLevel: "",
    section: "",
    courseId: "",
    yearLevelId: "",
    sectionId: "",
    status: "Enrolled",
  })
  
  // New state for dynamic data
  const [courses, setCourses] = useState<Course[]>([])
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [filteredYearLevels, setFilteredYearLevels] = useState<YearLevel[]>([])
  const [filteredSections, setFilteredSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingStudents, setExistingStudents] = useState<any[]>([])

  // Fetch courses when modal opens
  useEffect(() => {
    if (open) {
      fetchCourses()
      fetchYearLevels()
      fetchSections()
      fetchExistingStudents()
      setErrors({})
    } else {
      // Reset form when modal closes
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        password: "",
        course: "",
        yearLevel: "",
        section: "",
        courseId: "",
        yearLevelId: "",
        sectionId: "",
        status: "Enrolled",
      })
      setShowPassword(false)
    }
  }, [open])

// Filter year levels when course changes (ID-based)
useEffect(() => {
  if (formData.courseId && yearLevels.length > 0) {
    const filtered = yearLevels.filter(yl => yl.course_id === parseInt(formData.courseId!))
    setFilteredYearLevels(filtered)
  } else {
    setFilteredYearLevels([])
  }
}, [formData.courseId, yearLevels])

// Filter sections when course and year level change (ID-based)
useEffect(() => {
  if (formData.courseId && formData.yearLevelId && sections.length > 0) {
    const filtered = sections.filter(s => 
      s.course_id === parseInt(formData.courseId!) &&
      s.year_level_id === parseInt(formData.yearLevelId!)
    )
    setFilteredSections(filtered)
  } else {
    setFilteredSections([])
  }
}, [formData.courseId, formData.yearLevelId, sections])

  // Auto-generate password when birthday changes
  useEffect(() => {
    if (formData.birthday) {
      const generatedPassword = generatePassword(formData.birthday)
      setFormData(prev => ({
        ...prev,
        password: generatedPassword
      }))
    } else {
      setFormData(prev => ({ ...prev, password: "" }))
    }
  }, [formData.birthday])

  // Fetch existing students for validation
  const fetchExistingStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setExistingStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching existing students:', error)
    }
  }

  // Check for duplicate student within the modal
  const checkDuplicateStudent = (email: string) => {
    return existingStudents.some(student => 
      student.email.toLowerCase() === email.toLowerCase()
    )
  }

  // API fetching functions
  const fetchCourses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/course')
      if (response.ok) {
        const data = await response.json()
        setCourses(data.courses || [])
      } else {
        toast.error('Failed to fetch courses')
      }
    } catch (error) {
      console.error('Error fetching courses:', error)
      toast.error('Failed to fetch courses')
    } finally {
      setLoading(false)
    }
  }

  const fetchYearLevels = async () => {
    try {
      const response = await fetch('/api/admin/year-level')
      if (response.ok) {
        const data = await response.json()
        setYearLevels(data.yearLevels || [])
      } else {
        toast.error('Failed to fetch year levels')
      }
    } catch (error) {
      console.error('Error fetching year levels:', error)
      toast.error('Failed to fetch year levels')
    }
  }

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/sections')
      if (response.ok) {
        const data = await response.json()
        // Normalize various possible API shapes into Section[] for filtering by IDs
        const raw = (data.sections || []) as any[]
        const normalized: Section[] = raw
          .map((s: any) => {
            const section_id = s.section_id ?? (s.id ? parseInt(s.id) : undefined)
            const section_name = s.section_name ?? s.name
            const course_id = s.course_id ?? s.courses?.course_id
            const year_level_id = s.year_level_id ?? s.year_level?.year_level_id
            if (
              typeof section_id === 'number' &&
              typeof course_id === 'number' &&
              typeof year_level_id === 'number' &&
              typeof section_name === 'string'
            ) {
              return { section_id, section_name, course_id, year_level_id }
            }
            return undefined
          })
          .filter(Boolean) as Section[]
        setSections(normalized)
      } else {
        toast.error('Failed to fetch sections')
      }
    } catch (error) {
      console.error('Error fetching sections:', error)
      toast.error('Failed to fetch sections')
    }
  }

  // Password generation function
  const generatePassword = (birthday: string): string => {
    // Format birthday as MMDDYYYY
    const date = new Date(birthday)
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const day = date.getDate().toString().padStart(2, '0')
    const year = date.getFullYear().toString()
    
    // Use MM/DD/YYYY as default password
    return `${month}/${day}/${year}`
  }

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {}

    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required"
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required"
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email is invalid"
    }
    if (!formData.course.trim()) {
      newErrors.course = "Course selection is required"
    }
    if (!formData.yearLevel.trim()) {
      newErrors.yearLevel = "Year level selection is required"
    }
    if (!formData.section.trim()) {
      newErrors.section = "Section selection is required"
    }
    if (!formData.birthday) {
      newErrors.birthday = "Birthday is required for password generation"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Check for duplicates before submitting
    if (checkDuplicateStudent(formData.email)) {
      setErrors({ general: `A student with the email "${formData.email}" already exists` });
      
      setTimeout(() => {
        setErrors({});
      }, 3000);
      
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Prepare data for submission
      const submitData = {
        ...formData,
        schoolYear: "2024-2025 / 1st Semester" // Default school year
      }

      await onAdd(submitData)
      setOpen(false)
    } catch (error) {
      console.error('Error adding student:', error)
      setErrors({ general: 'Failed to add student' })
    } finally {
      setIsSubmitting(false)
    }
  }

const handleCourseChange = (courseId: string) => {
  const selectedCourse = courses.find(c => c.course_id.toString() === courseId)
  if (selectedCourse) {
    setFormData(prev => ({
      ...prev,
      courseId: courseId,
      course: selectedCourse.course_name,
      yearLevel: "",
      yearLevelId: "",
      section: "",
      sectionId: "",
    }))
    if (errors.yearLevel) {
      setErrors(prev => ({ ...prev, yearLevel: undefined }))
    }
    if (errors.section) {
      setErrors(prev => ({ ...prev, section: undefined }))
    }
  }
}

const handleYearLevelChange = (yearLevelId: string) => {
  const selectedYearLevel = filteredYearLevels.find(yl => yl.year_level_id.toString() === yearLevelId)
  if (selectedYearLevel) {
    setFormData(prev => ({
      ...prev,
      yearLevelId: yearLevelId,
      yearLevel: selectedYearLevel.name,
      section: "",
      sectionId: "",
    }))
    if (errors.section) {
      setErrors(prev => ({ ...prev, section: undefined }))
    }
  }
}

const handleSectionChange = (sectionId: string) => {
  const selectedSection = filteredSections.find(s => s.section_id.toString() === sectionId)
  if (selectedSection) {
    setFormData(prev => ({
      ...prev,
      sectionId: sectionId,
      section: selectedSection.section_name,
    }))
  }
}

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--customized-color-one)] text-white hover:bg-[var(--customized-color-two)] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Student
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-bold text-black">Create Student</DialogTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Add a new student to the system. Select course, year level, and section to assign the student properly.
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="gap-4 flex">
            <div className="space-y-2 w-[80%]">
              <Label htmlFor="email">Email <strong className="text-red-600">*</strong></Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value })
                  if (errors.email) {
                    setErrors(prev => ({ ...prev, email: undefined }))
                  }
                }}
                placeholder="student@plpasig.edu.ph"
                className={errors.email ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"}
                disabled={isSubmitting}
                required
              />
              {errors.email && (
                <p className="text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div className="space-y-2 w-[20%]">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber || ""}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+63 912 345 6789"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
            {/* <div className="space-y-2">
              <Label htmlFor="schoolYear">School Year</Label>
              <Select
                value={formData.schoolYear}
                onValueChange={(value) => setFormData({ ...formData, schoolYear: value })}
              >
                <SelectTrigger
                  className="
                    bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] text-black data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600 !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0
                  "
                >
                  <SelectValue placeholder="S.Y." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024-2025" className="text-black dark:text-white">
                    2024-2025 / Summer Term
                  </SelectItem>
                  <SelectItem value="2025-2026" className="text-black dark:text-white">
                    2025-2026 / 1st Semester
                  </SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name <strong className="text-red-600">*</strong></Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => {
                  setFormData({ ...formData, firstName: e.target.value })
                  if (errors.firstName) {
                    setErrors(prev => ({ ...prev, firstName: undefined }))
                  }
                }}
                disabled={isSubmitting}
                required
                className={errors.firstName ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                disabled={isSubmitting}
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name <strong className="text-red-600">*</strong></Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => {
                  setFormData({ ...formData, lastName: e.target.value })
                  if (errors.lastName) {
                    setErrors(prev => ({ ...prev, lastName: undefined }))
                  }
                }}
                disabled={isSubmitting}
                required
                className={errors.lastName ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="course">Course <strong className="text-red-600">*</strong></Label>
              <Select 
                value={formData.courseId || ""} 
                onValueChange={handleCourseChange}
                disabled={loading || isSubmitting}
              >
                <SelectTrigger 
                  className={errors.course ? "border-red-500" : "border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer"}
                >
                  <SelectValue placeholder={loading ? "Loading courses..." : "Select course"} />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={`course-${course.course_id}`} value={course.course_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                      <span className="font-medium">{course.course_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.course && (
                <p className="text-sm text-red-500">{errors.course}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="yearLevel">Year Level <strong className="text-red-600">*</strong></Label>
              <Select
                value={formData.yearLevelId || ""}
                onValueChange={handleYearLevelChange}
                disabled={!formData.courseId || loading || isSubmitting}
              >
                <SelectTrigger 
                  className={errors.yearLevel ? "border-red-500" : "border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-one)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer"}
                >
                  <SelectValue placeholder={
                    !formData.courseId 
                      ? "Select a course first" 
                      : filteredYearLevels.length === 0 
                        ? "No year levels available" 
                        : "Select year level"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredYearLevels.map((yearLevel) => (
                    <SelectItem key={`yl-${yearLevel.year_level_id}`} value={yearLevel.year_level_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                      <span>{yearLevel.name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.yearLevel && (
                <p className="text-sm text-red-500">{errors.yearLevel}</p>
              )}
              {formData.courseId && filteredYearLevels.length === 0 && (
                <p className="text-sm text-gray-600">No year levels found for the selected course.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="section">Section <strong className="text-red-600">*</strong></Label>
              <Select
                value={formData.sectionId || ""}
                onValueChange={handleSectionChange}
                disabled={!formData.yearLevelId || loading || isSubmitting}
              >
                <SelectTrigger 
                  className={errors.section ? "border-red-500" : "border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-one)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer"}
                >
                  <SelectValue placeholder={
                    !formData.yearLevelId 
                      ? "Select course and year level first" 
                      : filteredSections.length === 0
                        ? "No sections available" 
                        : "Select section"
                  } />
                </SelectTrigger>
                <SelectContent>
                  {filteredSections.map((section) => (
                    <SelectItem key={`section-${section.section_id}`} value={section.section_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                      <span>{section.section_name}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.section && (
                <p className="text-sm text-red-500">{errors.section}</p>
              )}
              {formData.yearLevelId && filteredSections.length === 0 && (
                <p className="text-sm text-gray-600">No sections found for the selected course and year level.</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday <strong className="text-red-600">*</strong></Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday || ""}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                className={errors.birthday ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"}
                disabled={isSubmitting}
              />
              {errors.birthday && (
                <p className="text-sm text-red-500">{errors.birthday}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password <strong className="text-red-600">*</strong></Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Password will be auto-generated"
                  className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none pr-10"
                  disabled={isSubmitting}
                  readOnly
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={formData.address || ""}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Student address"
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
            />
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)} 
              disabled={isSubmitting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)]"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.course || !formData.yearLevel || !formData.section || !formData.birthday || isSubmitting}
              className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding Student...
                </>
              ) : (
                "Add Student"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
