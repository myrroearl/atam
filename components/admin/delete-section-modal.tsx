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

interface Section {
  id: string;
  name: string;
  course: string;
  department: string;
  yearLevel: string;
  courseCode: string;
  section_id: number;
  course_id: number;
  year_level_id: number;
  department_id: number;
  created_at: string;
  updated_at: string;
}

interface DeleteSectionModalProps {
  section: Section | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (sectionId: string) => void;
}

export function DeleteSectionModal({ section, open, onOpenChange, onDelete }: DeleteSectionModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!section) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/sections?section_id=${section.section_id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete section')
      }

      toast.success(`🗑 Section deleted successfully.`)
      onDelete(section.id)
      onOpenChange(false)

    } catch (error) {
      console.error('Error deleting section:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to delete section"
      
      // Check if it's a constraint error (section has students or classes)
      if (errorMessage.includes("associated") || errorMessage.includes("constraint")) {
        toast.error("Cannot delete section with associated students or classes. Please reassign them first.")
      } else {
        toast.error(errorMessage)
      }
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false)
    }
  }

  if (!section) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black font-bold">
            Delete Section
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Are you sure you want to proceed with deleting <strong>"{section.name}"</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-none p-0">
            <AlertDescription className="text-red-800 font-semibold">
              Deleting this section will permanently lost following:
            </AlertDescription>
          </Alert>

          <div className="">
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Name:</span>
                <span className="text-gray-500 dark:text-white">{section.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Course:</span>
                <span className="text-gray-500 dark:text-white">{section.course}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Year Level:</span>
                <span className="text-gray-500 dark:text-white">{section.yearLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-black dark:text-gray-400">Department:</span>
                <span className="text-gray-500 dark:text-white">{section.department}</span>
              </div>
            </div>
          </div>
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
              className="bg-red-600 hover:bg-red-500 text-white border-none w-[50%]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete!"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
