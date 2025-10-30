"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { AlertTriangle, Loader2, Trash2 } from "lucide-react"

interface Subject {
  subject_id: number
  course_id: number
  subject_code: string
  subject_name: string
  units: number
  year_level_id: number
  semester_id: number
  created_at: string
  updated_at: string
}

interface DeleteSubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  subject: Subject | null
}

export default function DeleteSubjectModal({
  isOpen,
  onClose,
  onSuccess,
  subject
}: DeleteSubjectModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!subject) {
      toast.error("Subject information is missing")
      return
    }

    setIsLoading(true)
    try {
      console.log('Deleting subject with ID:', subject.subject_id)

      const response = await fetch(`/api/admin/subject?subject_id=${subject.subject_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete subject')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting subject:', error)
      toast.error(error instanceof Error ? error.message : "Failed to delete subject")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-black border-none transition-colors duration-300" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Delete Subject
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-600">
            Are you sure you want to delete <strong>{subject?.subject_name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 p-0 rounded-lg">
            <div className="border-none p-0">
              <p className="text-red-900 dark:text-orange-400 font-semibold text-sm">
                This action will permanently delete the subject and all associated data.
              </p>
            </div>
            {/* Subject info */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subject Code:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{subject?.subject_code}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subject Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">{subject?.subject_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Units:</span>
                <span className="font-medium text-gray-900 dark:text-white">{subject?.units}</span>
              </div>
            </div>
          </div>
        </div>
        
        
        <DialogFooter className="w-full">
          <div className="flex w-full justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
            >
              No, keep it
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-500 text-white border-none w-[50%] flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  Yes, Delete it
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
