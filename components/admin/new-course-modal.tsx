"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface NewCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  departmentId: string
  departmentName: string
}

interface FormData {
  course_code: string
  course_name: string
  description: string
}

interface FormErrors {
  course_code?: string
  course_name?: string
  general?: string
}

export default function NewCourseModal({
  isOpen,
  onClose,
  onSuccess,
  departmentId,
  departmentName
}: NewCourseModalProps) {
  const [formData, setFormData] = useState<FormData>({
    course_code: "",
    course_name: "",
    description: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)

  // Validate form whenever formData changes
  useEffect(() => {
    const isValid = formData.course_code.trim().length >= 2 && 
                   formData.course_name.trim().length >= 2
    setIsFormValid(isValid)
  }, [formData])

  // Reset form when modal opens/closes
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setFormData({
        course_code: "",
        course_name: "",
        description: ""
      })
      setErrors({})
    }
    onClose()
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.course_code.trim()) {
      newErrors.course_code = "Course code is required"
    } else if (formData.course_code.length < 2) {
      newErrors.course_code = "Course code must be at least 2 characters"
    }

    if (!formData.course_name.trim()) {
      newErrors.course_name = "Course name is required"
    } else if (formData.course_name.length < 5) {
      newErrors.course_name = "Course name must be at least 5 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      const response = await fetch('/api/admin/course', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          department_id: parseInt(departmentId)
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Duplicate course code error
          setErrors({ course_code: result.error })
          return
        }
        throw new Error(result.error || 'Failed to create course')
      }

      // Success
      toast.success("Course created successfully!")
      onSuccess()
      handleOpenChange(false)

    } catch (error) {
      console.error('Error creating course:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to create course"
      setErrors({ general: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Create Course
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Create a new course for the <strong>{departmentName}</strong> department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course_code">Course Code <strong className="text-red-600">*</strong></Label>
            <Input
              id="course_code"
              type="text"
              placeholder="e.g., BSIT, BSCS, BSN"
              value={formData.course_code}
              onChange={(e) => handleInputChange('course_code', e.target.value.toUpperCase())}
              className={errors.course_code ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}
              disabled={isSubmitting}
            />
            {errors.course_code && (
              <p className="text-sm text-red-500">{errors.course_code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_name">Course Name <strong className="text-red-600">*</strong></Label>
            <Input
              id="course_name"
              type="text"
              placeholder="e.g., Bachelor of Science in Information Technology"
              value={formData.course_name}
              onChange={(e) => handleInputChange('course_name', e.target.value)}
              className={errors.course_name ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}
              disabled={isSubmitting}
            />
            {errors.course_name && (
              <p className="text-sm text-red-500">{errors.course_name}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the course..."
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              disabled={isSubmitting}
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
            />
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
              onClick={() => handleOpenChange(false)}
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
                  Creating...
                </>
              ) : (
                <>
                  Add Course
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
