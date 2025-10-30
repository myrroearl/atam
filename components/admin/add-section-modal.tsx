"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface AddSectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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

export function AddSectionModal({ isOpen, onClose, onSuccess }: AddSectionModalProps) {
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
  const [existingSections, setExistingSections] = useState<any[]>([])
  const [isFormValid, setIsFormValid] = useState(false)

  // Validate form whenever formData changes
  useEffect(() => {
    const isValid = formData.name.trim().length > 0 && 
                   formData.course.trim() !== "" && 
                   formData.yearLevel.trim() !== ""
    setIsFormValid(isValid)
  }, [formData])

  // Fetch existing sections
  const fetchExistingSections = async () => {
    try {
      const response = await fetch('/api/admin/sections')
      if (response.ok) {
        const data = await response.json()
        setExistingSections(data.sections || [])
      }
    } catch (error) {
      console.error('Error fetching existing sections:', error)
    }
  }

  // Check for duplicate section within the modal
  const checkDuplicateSection = (name: string, course: string, yearLevel: string) => {
    return existingSections.some(section => 
      section.name.toLowerCase() === name.toLowerCase() &&
      section.course === course &&
      section.yearLevel === yearLevel
    )
  }

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: "",
        course: "",
        yearLevel: "",
        courseId: "",
        yearLevelId: "",
      })
      setErrors({})
      setFilteredYearLevels([])
      fetchCourses()
      fetchYearLevels()
      fetchExistingSections()
    }
  }, [isOpen])

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
    
    if (!validateForm()) {
      return
    }

    // Check for duplicates before submitting
    if (checkDuplicateSection(formData.name, formData.course, formData.yearLevel)) {
      setErrors({ general: `A section with the name "${formData.name}" already exists for ${formData.course} - ${formData.yearLevel}` });

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
        name: formData.name,
        course: formData.course,
        yearLevel: formData.yearLevel
      }

      console.log('Submitting section data:', submitData)

      const response = await fetch('/api/admin/sections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Section API error:', errorData)
        throw new Error(errorData.error || 'Failed to add section')
      }

      const result = await response.json()
      toast.success("Section added successfully!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error adding section:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to add section'
      setErrors({ general: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({})
      onClose()
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-black border-none transition-colors duration-300" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Create Section
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-600">
            Select a course and year level to auto-format the section name, then customize as needed.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course" className="text-black">Course <strong className="text-red-600">*</strong></Label>
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
            <Label htmlFor="yearLevel" className="text-black">Year Level <strong className="text-red-600">*</strong></Label>
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

          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">Section Name <strong className="text-red-600">*</strong></Label>
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
              disabled={!isFormValid || isSubmitting}
              className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add Section"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
