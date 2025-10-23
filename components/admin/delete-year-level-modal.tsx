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
import { AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "../ui/alert"

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
      <DialogContent className="sm:max-w-[450px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center text-black gap-2 font bold">
            Delete Year Level
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Are you sure you want to proceed with deleting {yearLevel?.name}?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* <div className="flex items-center gap-2 bg-rose-50 p-2">
            <strong className="text-black">Year Level: </strong>
            <p className="text-gray-500">{yearLevel?.name}</p>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-600" /><p className="text-red-600 text-xs">Warning: This will also delete all associated semesters and subjects.</p>
          </div> */}
          <Alert className="border-none p-0">
            <AlertDescription className="text-red-800 font-semibold">
              Deleting this year level will permanently lost following:
            </AlertDescription>
          </Alert>

          <div className="">
            <div className="space-y-1 text-sm">
              <div className="flex gap-1">
                <span className="text-black dark:text-gray-400">Name:</span>
                <span className="text-gray-500 dark:text-white">{yearLevel?.name}</span>
              </div>
              <div className="flex flex-col">
                <span>Semesters and Subjects under this year level.</span>
              </div>
            </div>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          <DialogFooter className="w-full">
            <div className="w-full flex justify-between gap-2">
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
                type="submit" 
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-500 text-white border-none w-[50%]"
              >
                {isLoading ? "Deleting..." : "Delete Year Level"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
