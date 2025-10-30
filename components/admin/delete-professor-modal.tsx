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

interface Professor {
  id: string
  name: string
  email: string
  department: string
  subjects: string[]
  sections: string[]
  facultyType: string
  status: string
  avatar: string
  prof_id: number
  account_id: number
  department_id: number
  birthday?: string
  address?: string
  contact_number?: string
  created_at: string
  updated_at: string
}

interface DeleteProfessorModalProps {
  professor: Professor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (professorId: string) => void;
}

export function DeleteProfessorModal({ professor, open, onOpenChange, onDelete }: DeleteProfessorModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!professor) return

    setIsDeleting(true)

    try {
      // Archive the professor by updating their status in the professors table to 'inactive'
      const response = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'professors',
          id: professor.prof_id,
          action: 'archive'
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to archive professor')
      }
      onDelete(professor.id)
      onOpenChange(false)

    } catch (error) {
      console.error('Error archiving professor:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to archive professor"
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

  if (!professor) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Delete Professor
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Are you sure you want to archive <strong>{professor.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 p-0 rounded-lg">
            <div className="border-none p-0">
              <p className="text-red-600 dark:text-red-500 font-semibold text-sm">
                This action will archive the professor and deactivate their account.
              </p>
            </div>

            {/* Professor info */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Professor ID:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{professor.prof_id}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Name:</span>
                <span className="font-medium text-gray-900 dark:text-white">{professor.name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Email:</span>
                <span className="font-medium text-gray-900 dark:text-white">{professor.email}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Department:</span>
                <span className="font-medium text-gray-900 dark:text-white">{professor.department}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Faculty Type:</span>
                <span className="font-medium text-gray-900 dark:text-white">{professor.facultyType}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-gray-900 dark:text-white">{professor.status}</span>
              </div>
            </div>
          </div>

          {/* <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                <strong>Note:</strong> The professor can be restored from the archive later if needed. Their account will be deactivated but not permanently deleted.
              </p>
            </div>
          </div> */}
        </div>

        <DialogFooter className="w-full">
          <div className="flex w-full justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
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
