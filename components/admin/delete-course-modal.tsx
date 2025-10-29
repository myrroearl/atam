"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Course {
  course_id: number
  department_id: number
  course_code: string
  course_name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface DeleteCourseModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  course: Course | null
}

export default function DeleteCourseModal({
  isOpen,
  onClose,
  onSuccess,
  course
}: DeleteCourseModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!course) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/course/${course.course_id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete course')
      }

      toast.success(`Course "${course.course_name}" deleted successfully.`)
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error deleting course:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to delete course"
      
      // Check if it's a constraint error (course has associated data)
      if (errorMessage.includes("associated") || errorMessage.includes("constraint")) {
        toast.error("Cannot delete course with associated subjects or students. Please remove all associated data first.")
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onClose()
    }
  }

  if (!course) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Delete Course
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Are you sure you want to delete <strong>{course.course_name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 p-0 rounded-lg">
            <div className="border-none p-0">
              <p className="text-red-600 dark:text-red-500 font-semibold text-sm">
                This action will permanently delete the course and all associated data.
              </p>
            </div>

            {/* Course info */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Course Code:</span>
                <span className="font-semibold text-black dark:text-white">{course.course_code}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Course Name:</span>
                <span className="font-medium text-black dark:text-white">{course.course_name}</span>
              </div>
              {course.description && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Description:</span>
                  <span className="font-medium text-black dark:text-white line-clamp-1 w-80 truncate">
                    {course.description}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="w-full">
          <div className="flex w-full justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%] dark:border-[var(--darkmode-color-four)] dark:bg-transparent dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:text-white dark:hover:border-none"
            >
              No, keep it
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white border-none w-[50%] dark:bg-red-800 dark:hover:bg-red-600 dark:hover:text-white dark:border-none"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete it"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
