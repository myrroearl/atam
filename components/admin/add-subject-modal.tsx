"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface AddSubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  courseId: string
  yearLevelId?: number
  semesterId?: number
  yearLevelName?: string
  semesterName?: string
}

export default function AddSubjectModal({
  isOpen,
  onClose,
  onSuccess,
  courseId,
  yearLevelId,
  semesterId,
  yearLevelName,
  semesterName
}: AddSubjectModalProps) {
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_name: "",
    units: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject_code || !formData.subject_name || !formData.units) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!yearLevelId || !semesterId) {
      toast.error("Year level and semester information is missing")
      return
    }

    setIsLoading(true)
    try {
      const requestData = {
        course_id: courseId,
        subject_code: formData.subject_code,
        subject_name: formData.subject_name,
        units: parseInt(formData.units),
        year_level_id: yearLevelId,
        semester_id: semesterId
      }

      console.log('Sending subject data:', requestData)

      const response = await fetch('/api/admin/subject', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create subject')
      }

      onSuccess()
      onClose()
      setFormData({ subject_code: "", subject_name: "", units: "" })
    } catch (error) {
      console.error('Error creating subject:', error)
      toast.error(error instanceof Error ? error.message : "Failed to create subject")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setFormData({ subject_code: "", subject_name: "", units: "" })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-bold text-black">Create Subject</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Add a new subject for {yearLevelName || 'Selected Year Level'}, {semesterName || 'Selected Semester'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject_code" className="text-black">Subject Code <strong className="text-red-500">*</strong></Label>
            <Input
              id="subject_code"
              value={formData.subject_code}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_code: e.target.value }))}
              placeholder="e.g., CS 101"
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject_name" className="text-black">Subject Name <strong className="text-red-500">*</strong></Label>
            <Input
              id="subject_name"
              value={formData.subject_name}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_name: e.target.value }))}
              placeholder="e.g., Introduction to Computer Science"
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="units" className="text-black">Units <strong className="text-red-500">*</strong></Label>
            <Input
              id="units"
              type="number"
              min="1"
              max="6"
              value={formData.units}
              onChange={(e) => setFormData(prev => ({ ...prev, units: e.target.value }))}
              placeholder="e.g., 3"
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              required
            />
          </div>
          
          <DialogFooter className="w-full">
            <div className="w-full flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="w-full hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)]"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading || !yearLevelId || !semesterId} className="w-full bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2">
                {isLoading ? "Adding..." : "Add Subject"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
