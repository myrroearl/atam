"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle, Trash } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

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

export default function DeleteCourseModalNew({
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

      toast.success(`Course "${course.course_name}" has been deleted successfully!`)
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
      <DialogContent className="sm:max-w-[500px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black">
            Delete Course
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Are you sure you want to delete the course <strong>"{course.course_name}"</strong> ({course.course_code})?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-none p-0">
            <AlertDescription className="text-red-800 font-semibold">
              Deleting this course will permanently lost following:
            </AlertDescription>
          </Alert>

          <div className="">
            <div className="space-y-1 text-sm">
              <div className="flex gap-1">
                <span className="text-black dark:text-gray-400">Code:</span>
                <span className="text-gray-600 dark:text-white">{course.course_code}</span>
              </div>
              <div className="flex gap-1">
                <span className="text-black dark:text-gray-400">Name:</span>
                <span className="text-gray-600 dark:text-white">{course.course_name}</span>
              </div>
              {course.description && (
                <div className="flex gap-1">
                  <span className="text-black dark:text-gray-400">Description:</span>
                  <span className="text-gray-600 dark:text-white line-clamp-1">
                    {course.description}
                  </span>
                </div>
              )}
              {/* <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="text-gray-900 dark:text-white">
                  {new Date(course.created_at).toLocaleDateString()}
                </span>
              </div> */}
            </div>
          </div>
        </div>

        <DialogFooter className="w-full">
          <div className="w-full justify-between gap-2 flex">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
            >
              No, keep it.
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white border-none w-[50%]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                <>
                  Yes, Delete!
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
