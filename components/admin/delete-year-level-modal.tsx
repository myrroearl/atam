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

interface YearLevel {
  year_level_id: number
  name: string
  course_id: number
}

interface DeleteYearLevelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  yearLevel: YearLevel | null
}

export default function DeleteYearLevelModal({
  isOpen,
  onClose,
  onSuccess,
  yearLevel
}: DeleteYearLevelModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!yearLevel) {
      toast.error("No year level selected")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/year-level/${yearLevel.year_level_id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete year level')
      }

      toast.success("Year level deleted successfully!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error deleting year level:', error)
      toast.error(error instanceof Error ? error.message : "Failed to delete year level")
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
            Delete Year Level
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Are you sure you want to delete <strong>{yearLevel?.name}</strong>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 p-0 rounded-lg">
            <div className="border-none p-0">
              <p className="text-red-600 dark:text-red-500 font-semibold text-sm">
                This action will permanently delete the year level and all associated data.
              </p>
            </div>

            {/* Year Level info */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">Year Level Name:</span>
                <span className="font-semibold text-black dark:text-white">{yearLevel?.name}</span>
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
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%] dark:border-[var(--darkmode-color-four)] dark:bg-transparent dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:text-white dark:hover:border-none"
            >
              No, keep it
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700 text-white border-none w-[50%] dark:bg-red-800 dark:hover:bg-red-600 dark:hover:text-white dark:border-none"
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
