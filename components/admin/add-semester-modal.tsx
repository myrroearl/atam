"use client"

import { useState, useEffect } from "react"
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
import { Plus, Loader2 } from "lucide-react"

interface YearLevel {
  year_level_id: number
  name: string
  course_id: number
}

interface AddSemesterModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  courseId: string
  preSelectedYearLevel?: number
  yearLevelName?: string
}

export default function AddSemesterModal({
  isOpen,
  onClose,
  onSuccess,
  courseId,
  preSelectedYearLevel,
  yearLevelName
}: AddSemesterModalProps) {
  const [formData, setFormData] = useState({
    year_level: "",
    semester_name: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isFormValid, setIsFormValid] = useState(false)
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([])
  const [isLoadingYearLevels, setIsLoadingYearLevels] = useState(false)
  const [existingSemesters, setExistingSemesters] = useState<Record<number, string[]>>({})

  // Validate form whenever formData changes
  useEffect(() => {
    const isValid = !!(formData.year_level && formData.semester_name)
    setIsFormValid(isValid)
  }, [formData])

  // Fetch year levels and existing semesters when modal opens
  useEffect(() => {
    if (isOpen && courseId) {
      fetchYearLevels()
      fetchExistingSemesters()
    }
  }, [isOpen, courseId])

  // Auto-set the pre-selected year level when modal opens
  useEffect(() => {
    if (isOpen && preSelectedYearLevel) {
      setFormData(prev => ({
        ...prev,
        year_level: preSelectedYearLevel.toString()
      }))
    }
  }, [isOpen, preSelectedYearLevel])

  const fetchYearLevels = async () => {
    setIsLoadingYearLevels(true)
    try {
      const response = await fetch(`/api/admin/year-level?course_id=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        setYearLevels(data.yearLevels || [])
      }
    } catch (error) {
      console.error('Error fetching year levels:', error)
      toast.error('Failed to load year levels')
    } finally {
      setIsLoadingYearLevels(false)
    }
  }

  const fetchExistingSemesters = async () => {
    try {
      const response = await fetch(`/api/admin/semester?course_id=${courseId}`)
      if (response.ok) {
        const data = await response.json()
        const semestersByYearLevel = data.semestersByYearLevel || {}
        
        // Transform the data to extract just the semester names
        const transformedData: Record<number, string[]> = {}
        Object.keys(semestersByYearLevel).forEach(yearLevelId => {
          const yearLevelIdNum = parseInt(yearLevelId)
          transformedData[yearLevelIdNum] = semestersByYearLevel[yearLevelId].map((semester: any) => semester.semester_name)
        })
        
        setExistingSemesters(transformedData)
      }
    } catch (error) {
      console.error('Error fetching existing semesters:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.year_level || !formData.semester_name) {
      toast.error("Please select a semester name")
      return
    }

    if (yearLevels.length === 0) {
      toast.error("No year levels available. Please add a year level first.")
      return
    }

    setIsLoading(true)
    try {
      const requestData = {
        course_id: parseInt(courseId),
        year_level: parseInt(formData.year_level),
        semester_name: formData.semester_name
      }
      
      console.log('Sending semester data:', requestData)
      
      const response = await fetch('/api/admin/semester', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create semester')
      }

      onSuccess()
      onClose()
      setFormData({ year_level: "", semester_name: "" })
    } catch (error) {
      console.error('Error creating semester:', error)
      toast.error(error instanceof Error ? error.message : "Failed to create semester")
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
      setFormData({ year_level: "", semester_name: "" })
    }
  }

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFormData({ year_level: "", semester_name: "" })
    }
  }, [isOpen])

  // Get available semester options for the selected year level
  const getAvailableSemesters = (yearLevelId: number) => {
    const allSemesters = ['1st Semester', '2nd Semester', 'Summer']
    const existing = existingSemesters[yearLevelId] || []
    return allSemesters.filter(semester => !existing.includes(semester))
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Create Semester
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Add a new semester for <strong>{yearLevelName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div className="space-y-2">
            <Label htmlFor="semester_name">Semester Name <strong className="text-red-600">*</strong></Label>
            <Select 
              value={formData.semester_name} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, semester_name: value }))}
              disabled={!formData.year_level}
            >
              <SelectTrigger className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
                <SelectValue placeholder={
                  !formData.year_level 
                    ? "Loading..." 
                    : "Select semester"
                } />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                {formData.year_level ? (
                  getAvailableSemesters(parseInt(formData.year_level)).length > 0 ? (
                    getAvailableSemesters(parseInt(formData.year_level)).map((semester) => (
                      <SelectItem 
                        key={semester} 
                        value={semester}
                        className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]"
                      >
                        {semester}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem 
                      value="no-semesters-available" 
                      disabled
                      className="text-gray-400 cursor-not-allowed py-2 px-3"
                    >
                      No semesters available
                    </SelectItem>
                  )
                ) : (
                  <SelectItem 
                    value="loading" 
                    disabled
                    className="text-gray-400 cursor-not-allowed py-2 px-3"
                  >
                    Loading...
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {formData.year_level && (
              <div className="text-sm text-gray-500">
                {(() => {
                  const selectedYearLevelId = parseInt(formData.year_level)
                  const availableSemesters = getAvailableSemesters(selectedYearLevelId)
                  const existingSemestersCount = (existingSemesters[selectedYearLevelId] || []).length
                  
                  if (existingSemestersCount === 0) {
                    return "No semesters added yet for this year level"
                  } else if (existingSemestersCount === 3) {
                    return "All semesters (1st, 2nd, Summer) have been added for this year level"
                  } else {
                    return `Available: ${availableSemesters.join(", ")}`
                  }
                })()}
              </div>
            )}
          </div>
          
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
              <Button 
                type="submit" 
                disabled={
                  !isFormValid || 
                  isLoading || 
                  yearLevels.length === 0 || 
                  getAvailableSemesters(parseInt(formData.year_level)).length === 0
                }
                className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 w-[50%] dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    Add Semester
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
