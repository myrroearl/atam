"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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

interface EditSemesterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  semester: Semester | null
}

export default function EditSemesterModal({
  isOpen,
  onClose,
  onSuccess,
  semester
}: EditSemesterModalProps) {
  const [formData, setFormData] = useState({
    semester_name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<string | null>(null)

  // Update form data when semester changes
  useEffect(() => {
    if (semester) {
      setFormData({
        semester_name: semester.semester_name,
      })
      setOriginalData(semester.semester_name)
      setHasChanges(false)
    }
  }, [semester])

  // Check for changes whenever formData changes
  useEffect(() => {
    if (originalData !== null) {
      const changed = formData.semester_name !== originalData
      setHasChanges(changed)
    }
  }, [formData, originalData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.semester_name) {
      toast.error("Please select a semester name")
      return
    }

    if (!semester) {
      toast.error("Semester information is missing")
      return
    }

    setIsLoading(true)
    try {
      const requestData = {
        semester_id: semester.semester_id,
        semester_name: formData.semester_name
      }

      console.log('Sending edit semester data:', requestData)

      const response = await fetch('/api/admin/semester', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update semester')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating semester:', error)
      toast.error(error instanceof Error ? error.message : "Failed to update semester")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ semester_name: "" })
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white flex items-center gap-2">
            Edit Semester
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Update the semester information for <strong>{semester?.year_level?.name || 'this year level'}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="semester_name">Semester Name</Label>
            <Select 
              value={formData.semester_name} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, semester_name: value }))}
            >
              <SelectTrigger className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                <SelectItem value="1st Semester" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">1st Semester</SelectItem>
                <SelectItem value="2nd Semester" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">2nd Semester</SelectItem>
                <SelectItem value="Summer" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {semester && (
            <div className="text-sm flex gap-2">
              <strong className="text-black dark:text-white">Current Name:</strong>
              <p className="text-gray-500 dark:text-gray-300">{semester.semester_name}</p>
            </div>
          )}
          
          <DialogFooter className="w-full">
            <div className="w-full flex justify-between gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black"
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
                  <>
                    Update Semester
                  </>
                )}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
