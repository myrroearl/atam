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
import { Edit } from "lucide-react"

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

  useEffect(() => {
    if (yearLevel) {
      setFormData({
        name: yearLevel.name
      })
    }
  }, [yearLevel])

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
      <DialogContent className="sm:max-w-[425px]" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-bold text-black">
            <Edit className="w-5 h-5" />
            Edit Year Level</DialogTitle>
          <DialogDescription className="text-gray-500 text-sm">
            Update the year level information
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-black">Year Level Name <strong className="text-red-600">*</strong></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., 1ST YEAR, 2ND YEAR"
              required
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
            />
          </div>
          
          <DialogFooter className="w-full">
            <div className="w-full justify-between gap-2 flex">
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
                {isLoading ? "Updating..." : "Update Year Level"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
