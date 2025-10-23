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

interface GradeComponent {
  component_id: number
  component_name: string
  weight_percentage: number
  created_at: string
}

interface Department {
  department_id: number
  department_name: string
  description: string | null
  dean_name: string
  created_at: string
  updated_at: string
  grade_components?: GradeComponent[]
}


interface DepartmentDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  department: Department | null
}

export default function DepartmentDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  department
}: DepartmentDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!department) return

    setIsDeleting(true)

    try {
      const response = await fetch(`/api/admin/department/${department.department_id}`, {
        method: 'DELETE',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete department')
      }

      toast.success(`Department "${department.department_name}" deleted successfully.`)
      
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error deleting department:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to delete department"
      
      // Check if it's a constraint error (department has courses)
      if (errorMessage.includes("associated courses")) {
        toast.error("Cannot delete department with associated courses. Please remove all courses first.")
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

  if (!department) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="flex items-center text-xl gap-2 text-red-600 font-bold dark:text-red-500">
            Delete Department
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete <strong className="text-black dark:text-white">{department.department_name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 bg-red-50 p-4 rounded-lg">
            <Alert className="border-none p-0 bg-red-50">
              <AlertDescription className="text-orange-800 dark:text-orange-400 font-semibold text-sm">
                This action will permanently delete the department and its grading components.
              </AlertDescription>
            </Alert>

            {/* Department info */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Department:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{department.department_name}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Dean:</span>
                <span className="font-medium text-gray-900 dark:text-white">{department.dean_name}</span>
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
              disabled={isDeleting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
            >
              No, keep it
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
                "Yes, Delete it"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
