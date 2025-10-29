"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, SquarePen } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Section {
  id: string;
  name: string;
  course: string;
  department: string;
  yearLevel: string;
  courseCode: string;
  section_id: number;
  course_id: number;
  year_level_id: number;
  department_id: number;
  created_at: string;
  updated_at: string;
}

interface EditSectionModalProps {
  section: Section | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (section: Section) => void;
  onValidationError?: (message: string) => void;
  checkDuplicate?: (name: string, course: string, yearLevel: string) => boolean;
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
  courses: {
    course_name: string
    course_code: string
  }
}

export function EditSectionModal({ section, open, onOpenChange, onSave, onValidationError, checkDuplicate }: EditSectionModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    course: "",
    yearLevel: "",
    courseId: "",
    yearLevelId: "",
  })
  const [courses, setCourses] = useState<Course[]>([])
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([])
  const [filteredYearLevels, setFilteredYearLevels] = useState<YearLevel[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<{name: string, course: string, yearLevel: string} | null>(null)

  // Initialize form data when section changes or modal opens
  useEffect(() => {
    if (open && section) {
      const initialData = {
        name: section.name,
        course: section.course,
        yearLevel: section.yearLevel,
        courseId: section.course_id.toString(),
        yearLevelId: section.year_level_id.toString(),
      }
      setFormData(initialData)
      setOriginalData({
        name: section.name,
        course: section.course,
        yearLevel: section.yearLevel,
      })
      setErrors({})
      setHasChanges(false)
      fetchCourses()
      fetchYearLevels()
    }
  }, [open, section])

  // Check for changes whenever formData changes
  useEffect(() => {
    if (originalData) {
      const changed = formData.name !== originalData.name ||
                     formData.course !== originalData.course ||
                     formData.yearLevel !== originalData.yearLevel
      setHasChanges(changed)
    }
  }, [formData, originalData])

  // Filter year levels when course changes
  useEffect(() => {
    if (formData.courseId && yearLevels.length > 0) {
      const filtered = yearLevels.filter(yl => yl.course_id === parseInt(formData.courseId))
      setFilteredYearLevels(filtered)
    } else {
      setFilteredYearLevels([])
    }
  }, [formData.courseId, yearLevels])

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
        console.log('Year levels fetched:', data)
        setYearLevels(data.yearLevels || [])
      } else {
        toast.error('Failed to fetch year levels')
      }
    } catch (error) {
      console.error('Error fetching year levels:', error)
      toast.error('Failed to fetch year levels')
    }
  }

  // Auto-format section name based on course and year level
  const updateSectionName = (courseCode: string, yearLevelName: string) => {
    if (courseCode && yearLevelName) {
      // Extract year number from year level (e.g., "1st Year" -> "1")
      const yearNumber = yearLevelName.match(/\d+/)?.[0] || yearLevelName
      const baseName = `${courseCode}-${yearNumber}`
      
      setFormData(prev => ({
        ...prev,
        name: baseName
      }))
    }
  }

  const handleCourseChange = (courseName: string) => {
    const selectedCourse = courses.find(c => c.course_name === courseName)
    if (selectedCourse) {
      setFormData(prev => ({
        ...prev,
        course: courseName,
        courseId: selectedCourse.course_id.toString(),
        yearLevel: "", // Reset year level when course changes
        yearLevelId: "",
        name: "" // Reset name when course changes
      }))
      
      // Clear year level error
      if (errors.yearLevel) {
        setErrors(prev => ({ ...prev, yearLevel: undefined }))
      }
    }
  }

  const handleYearLevelChange = (yearLevelName: string) => {
    const selectedYearLevel = filteredYearLevels.find(yl => yl.name === yearLevelName)
    if (selectedYearLevel) {
      setFormData(prev => ({
        ...prev,
        yearLevel: yearLevelName,
        yearLevelId: selectedYearLevel.year_level_id.toString()
      }))
      
      // Auto-format section name
      const selectedCourse = courses.find(c => c.course_id === parseInt(formData.courseId))
      if (selectedCourse) {
        updateSectionName(selectedCourse.course_code, yearLevelName)
      }
      
      // Clear year level error
      if (errors.yearLevel) {
        setErrors(prev => ({ ...prev, yearLevel: undefined }))
      }
    }
  }

  const handleSectionNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value
    }))
    
    // Clear name error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string | undefined> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Section name is required"
    }

    if (!formData.course.trim()) {
      newErrors.course = "Course selection is required"
    }

    if (!formData.yearLevel.trim()) {
      newErrors.yearLevel = "Year level selection is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm() || !section) {
      return
    }

    // Check for duplicates before submitting (excluding current section)
    if (checkDuplicate && onValidationError) {
      const isDuplicate = checkDuplicate(formData.name, formData.course, formData.yearLevel)
      if (isDuplicate && (formData.name !== section.name || formData.course !== section.course || formData.yearLevel !== section.yearLevel)) {
        onValidationError(`A section with the name "${formData.name}" already exists for ${formData.course} - ${formData.yearLevel}`)
        return
      }
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Prepare data for submission
      const submitData = {
        section_id: section.section_id,
        name: formData.name,
        course: formData.course,
        yearLevel: formData.yearLevel
      }

      console.log('Updating section data:', submitData)

      const response = await fetch('/api/admin/sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Section API error:', errorData)
        throw new Error(errorData.error || 'Failed to update section')
      }

      const result = await response.json()
      
      // Use the complete section data returned from the API
      const updatedSection: Section = result.section

      toast.success("Section updated successfully!")
      onSave(updatedSection)
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating section:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to update section'
      setErrors({ general: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({})
      onOpenChange(false)
    }
  }

  const isFormValid = formData.name.trim() !== "" && formData.course.trim() !== "" && formData.yearLevel.trim() !== ""

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white flex items-center gap-2">
            Edit Section
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Update the section information. Select a course and year level to auto-format the section name, then customize as needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course" className="text-black">Course</Label>
            <Select
              value={formData.course}
              onValueChange={handleCourseChange}
              disabled={loading || isSubmitting}
            >
              <SelectTrigger
                className={errors.course ? "border-red-500" : "border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}
              >
                <SelectValue placeholder={loading ? "Loading courses..." : "Select Course"} />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                {courses.map((course) => (
                  <SelectItem key={course.course_id} value={course.course_name} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">
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
            <Label htmlFor="yearLevel" className="text-black">Year Level</Label>
            <Select
              value={formData.yearLevel}
              onValueChange={handleYearLevelChange}
              disabled={!formData.courseId || loading || isSubmitting}
            >
              <SelectTrigger
                className={errors.yearLevel ? "border-red-500" : "border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}
              >
                <SelectValue placeholder={
                  !formData.courseId 
                    ? "Select a course first" 
                    : filteredYearLevels.length === 0 
                      ? "No year levels available" 
                      : "Select Year Level"
                } />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                {filteredYearLevels.map((yearLevel) => (
                  <SelectItem key={yearLevel.year_level_id} value={yearLevel.name} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">
                    {yearLevel.name}
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

          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">Section Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., BSIT-1A (auto-filled when course and year level are selected)"
              value={formData.name}
              onChange={(e) => handleSectionNameChange(e.target.value)}
              className={errors.name ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || !hasChanges || isSubmitting}
              className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Section"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}