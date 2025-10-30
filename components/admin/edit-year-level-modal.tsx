"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { SquarePen, Loader2 } from "lucide-react"

interface YearLevel {
  year_level_id: number
  name: string
  course_id: number
}

interface EditYearLevelModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  yearLevel: YearLevel | null
}

export default function EditYearLevelModal({
  isOpen,
  onClose,
  onSuccess,
  yearLevel
}: EditYearLevelModalProps) {
  const [formData, setFormData] = useState({
    name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<string | null>(null)

  useEffect(() => {
    if (yearLevel) {
      setFormData({
        name: yearLevel.name
      })
      setOriginalData(yearLevel.name)
      setHasChanges(false)
    }
  }, [yearLevel])

  // Check for changes whenever formData changes
  useEffect(() => {
    if (originalData !== null) {
      const changed = formData.name !== originalData
      setHasChanges(changed)
    }
  }, [formData, originalData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name || !yearLevel) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch(`/api/admin/year-level/${yearLevel.year_level_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update year level')
      }

      toast.success("Year level updated successfully!")
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating year level:', error)
      toast.error(error instanceof Error ? error.message : "Failed to update year level")
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
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white flex items-center gap-2">
            Edit Year Level
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-600">
            Update the year level information below.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Year Level Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 1ST YEAR, 2ND YEAR"
              required
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
            />
          </div>
          
          <DialogFooter className="w-full">
            <div className="w-full justify-between gap-2 flex">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black w-[50%]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!hasChanges || isLoading} className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 w-[50%] dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black">
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Year Level"
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
