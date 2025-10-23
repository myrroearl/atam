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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Student } from "@/types/student"

interface DeleteStudentModalProps {
  student: Student | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (studentId: string) => void;
}

export function DeleteStudentModal({ student, open, onOpenChange, onDelete }: DeleteStudentModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!student) return

    setIsDeleting(true)

    try {
      // Archive the student by updating their account status to 'inactive'
      const response = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'students',
          id: student.student_id,
          action: 'archive'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive student')
      }

      toast.success(`🗄️ Student "${student.name}" has been archived successfully.`)
      onDelete(student.id)
      onOpenChange(false)

    } catch (error) {
      console.error('Error archiving student:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to archive student"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false)
    }
  }

  if (!student) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black font-bold">
            Archive Student
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Are you sure you want to archive <strong>"{student.name}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-none p-0">
            <AlertDescription className="text-orange-800 font-semibold">
              Archiving this student will move them to the archive and deactivate their account:
            </AlertDescription>
          </Alert>

          <div className="">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Student ID:</span>
                <span className="text-gray-500 dark:text-white">{student.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Name:</span>
                <span className="text-gray-500 dark:text-white">{student.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Email:</span>
                <span className="text-gray-500 dark:text-white">{student.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Course:</span>
                <span className="text-gray-500 dark:text-white">{student.course}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Year & Section:</span>
                <span className="text-gray-500 dark:text-white">{student.yearSection}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Status:</span>
                <span className="text-gray-500 dark:text-white">{student.status}</span>
              </div>
            </div>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Note:</strong> The student can be restored from the archive later if needed. Their account will be deactivated but not permanently deleted.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="w-full">
          <div className="flex w-full justify-between gap-2">
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
              className="bg-orange-600 hover:bg-orange-500 text-white border-none w-[50%]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Archiving...
                </>
              ) : (
                "Yes, Archive!"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
