"use client"

import { useState } from "react"
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

export default function NewCourseModalNew({
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

  const isFormValid = formData.course_code.trim() !== "" && formData.course_name.trim() !== ""

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center font-bold text-black">
            Create Course
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Create a new course for the <strong>{departmentName}</strong> department.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course_code" className="text-black">Course Code <strong className="text-red-600">*</strong></Label>
            <Input
              id="course_code"
              type="text"
              placeholder="e.g., BSIT, BSCS, BSN"
              value={formData.course_code}
              onChange={(e) => handleInputChange('course_code', e.target.value.toUpperCase())}
              className={errors.course_code ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"}
              disabled={isSubmitting}
            />
            {errors.course_code && (
              <p className="text-sm text-red-500">{errors.course_code}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="course_name" className="text-black">Course Name <strong className="text-red-600">*</strong></Label>
            <Input
              id="course_name"
              type="text"
              placeholder="e.g., Bachelor of Science in Information Technology"
              value={formData.course_name}
              onChange={(e) => handleInputChange('course_name', e.target.value)}
              className={errors.course_name ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"}
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
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
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
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  Create Course
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
