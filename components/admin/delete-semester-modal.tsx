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
import { Loader2 } from "lucide-react"

interface Semester {
  semester_id: number
  semester_name: string
  year_level_id: number
  created_at: string
  updated_at: string
  year_level?: {
    year_level_id: number
    name: string
    course_id: number
  }
}

interface DeleteSemesterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  semester: Semester | null
}

export default function DeleteSemesterModal({
  isOpen,
  onClose,
  onSuccess,
  semester
}: DeleteSemesterModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleDelete = async () => {
    if (!semester) {
      toast.error("Semester information is missing")
      return
    }

    setIsLoading(true)
    try {
      console.log('Deleting semester with ID:', semester.semester_id)

      const response = await fetch(`/api/admin/semester?semester_id=${semester.semester_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete semester')
      }

      toast.success("Semester deleted successfully!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting semester:', error)
      toast.error(error instanceof Error ? error.message : "Failed to delete semester")
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
      <DialogContent className="sm:max-w-[500px] dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Delete Semester
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-600">
            Are you sure you want to proceed with deleting <strong>"{semester?.semester_name}"</strong>?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2 p-0">
            <div className="border-none p-0">
              <p className="text-red-900 dark:text-orange-400 font-semibold text-sm">
                This action will permanently delete the semester and all associated data.
              </p>
            </div>
            {/* Year Level info */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600 dark:text-gray-400">Semester Name:</span>
              <span className="font-semibold text-gray-900 dark:text-white">{semester?.semester_name}</span>
            </div>
          </div>
          {/* <div>
            <span className="text-sm">Noted: Make sure you have deleted all subjects first, or this action will be blocked.</span>
          </div>

          <Alert className="border-none p-0">
            <AlertDescription className="text-red-800 font-semibold">
              Deleting this semester will permanently lost following:
            </AlertDescription>
          </Alert>

          <div className="">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Name:</span>
                <span className="text-gray-500 dark:text-white">{semester?.semester_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Year Level:</span>
                <span className="text-gray-500 dark:text-white">{semester?.year_level?.name || 'Unknown'}</span>
              </div>
              <div className="flex flex-col">
                <span>All subjects in this semester</span>
              </div>
            </div>
          </div> */}
        </div>
        
        <DialogFooter className="w-full">
          <div className="w-full flex justify-between gap-2">
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
              className="bg-red-600 hover:bg-red-500 text-white border-none w-[50%]"
            >
                {isLoading ? (
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
