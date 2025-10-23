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
import { Edit, Loader2 } from "lucide-react"

interface Subject {
  subject_id: number
  course_id: number
  subject_code: string
  subject_name: string
  units: number
  year_level_id: number
  semester_id: number
  created_at: string
  updated_at: string
}

interface EditSubjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  subject: Subject | null
}

export default function EditSubjectModal({
  isOpen,
  onClose,
  onSuccess,
  subject
}: EditSubjectModalProps) {
  const [formData, setFormData] = useState({
    subject_code: "",
    subject_name: "",
    units: "",
  })
  const [isLoading, setIsLoading] = useState(false)

  // Update form data when subject changes
  useEffect(() => {
    if (subject) {
      setFormData({
        subject_code: subject.subject_code,
        subject_name: subject.subject_name,
        units: subject.units.toString(),
      })
    }
  }, [subject])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.subject_code || !formData.subject_name || !formData.units) {
      toast.error("Please fill in all required fields")
      return
    }

    if (!subject) {
      toast.error("Subject information is missing")
      return
    }

    setIsLoading(true)
    try {
      const requestData = {
        subject_id: subject.subject_id,
        subject_code: formData.subject_code,
        subject_name: formData.subject_name,
        units: parseInt(formData.units)
      }

      console.log('Sending edit subject data:', requestData)

      const response = await fetch('/api/admin/subject', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update subject')
      }

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error updating subject:', error)
      toast.error(error instanceof Error ? error.message : "Failed to update subject")
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
      setFormData({ subject_code: "", subject_name: "", units: "" })
    }
  }, [isOpen])

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-black">
            <Edit className="w-5 h-5" />
            Edit Subject
          </DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Update the subject information for {subject?.subject_name}
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
              required
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject_name" className="text-black">Subject Name <strong className="text-red-500">*</strong></Label>
            <Input
              id="subject_name"
              value={formData.subject_name}
              onChange={(e) => setFormData(prev => ({ ...prev, subject_name: e.target.value }))}
              placeholder="e.g., Introduction to Computer Science"
              required
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
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
              required
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
            />
          </div>
          
          <DialogFooter>
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
                  Update Subject
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
