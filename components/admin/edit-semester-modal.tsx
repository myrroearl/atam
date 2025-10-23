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
import { Edit, Loader2 } from "lucide-react"

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

  // Update form data when semester changes
  useEffect(() => {
    if (semester) {
      setFormData({
        semester_name: semester.semester_name,
      })
    }
  }, [semester])

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
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-black">
            <Edit className="w-5 h-5" />
            Edit Semester
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Update the semester information for {semester?.year_level?.name || 'this year level'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="semester_name" className="text-black">Semester Name</Label>
            <Select 
              value={formData.semester_name} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, semester_name: value }))}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer">
                <SelectValue placeholder="Select semester" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden">
                <SelectItem value="1st Semester" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">1st Semester</SelectItem>
                <SelectItem value="2nd Semester" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">2nd Semester</SelectItem>
                <SelectItem value="Summer" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Summer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {semester && (
            <div className="text-sm flex gap-2">
              <strong className="text-black">Current Name:</strong>
              <p className="text-gray-500">{semester.semester_name}</p>
            </div>
          )}
          
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
              <Button type="submit" disabled={isLoading} className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center w-[50%]">
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
