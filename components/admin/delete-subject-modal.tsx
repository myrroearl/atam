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
import { AlertTriangle, Loader2 } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"

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
      <DialogContent className="sm:max-w-[470px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-black">
            Delete Subject
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Are you sure you want to proceed with deleting <strong>"{subject?.subject_name}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-1 text-xs">
            <strong>Note:</strong>
            <p>This action will permanently remove the subject from the database.</p>
          </div>

          <Alert className="border-none p-0">
            <AlertDescription className="text-red-800 font-semibold">
              Deleting this subject will permanently lost following:
            </AlertDescription>
          </Alert>

          <div className="">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Subject Code:</span>
                <span className="text-gray-500 dark:text-white">{subject?.subject_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Subject Name:</span>
                <span className="text-gray-500 dark:text-white">{subject?.subject_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Units:</span>
                <span className="text-gray-500 dark:text-white">{subject?.units}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* <div className="py-4">
          {subject && (
            <div className="bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] border border-[var(--customized-color-four)] dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <p><strong>Subject Code:</strong> {subject.subject_code}</p>
                    <p><strong>Subject Name:</strong> {subject.subject_name}</p>
                    <p><strong>Units:</strong> {subject.units}</p>
                  </div>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    This action will permanently remove the subject from the database.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div> */}
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-500 text-white border-none w-[50%] hover:text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Subject"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
