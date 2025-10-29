"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Building2, Settings, Plus, Trash2, SquarePen } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GradeComponentData {
  component_id?: number
  component_name: string
  weight_percentage: number
  created_at?: string
}

interface GradeComponent {
  component_name: string
  weight_percentage: number
}

interface Department {
  department_id: number
  department_name: string
  description: string | null
  dean_name: string
  created_at: string
  updated_at: string
  grade_components?: GradeComponentData[]
}

interface DepartmentEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  department: Department | null
}

interface FormData {
  department_name: string
  description: string
  dean_name: string
}

interface FormErrors {
  department_name?: string
  dean_name?: string
  general?: string
}

export default function DepartmentEditModal({
  isOpen,
  onClose,
  onSuccess,
  department
}: DepartmentEditModalProps) {
  const [formData, setFormData] = useState<FormData>({
    department_name: "",
    description: "",
    dean_name: ""
  })
  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([])
  const [originalFormData, setOriginalFormData] = useState<FormData>({
    department_name: "",
    description: "",
    dean_name: ""
  })
  const [originalGradeComponents, setOriginalGradeComponents] = useState<GradeComponent[]>([])
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Reset form when modal opens/closes or department changes
  useEffect(() => {
    if (isOpen && department) {
      setIsLoading(true)
      
      // Set department form data
      const initialFormData = {
        department_name: department.department_name,
        description: department.description || "",
        dean_name: department.dean_name
      }
      setFormData(initialFormData)
      setOriginalFormData(initialFormData)
      
      // Set grading components data
      const initialGradeComponents = department.grade_components?.map(comp => ({
        component_name: comp.component_name,
        weight_percentage: comp.weight_percentage
      })) || []
      setGradeComponents(initialGradeComponents)
      setOriginalGradeComponents(initialGradeComponents)
      
      setErrors({})
      setIsLoading(false)
    }
  }, [isOpen, department])

  const validateDepartmentForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!formData.department_name.trim()) {
      newErrors.department_name = "Department name is required"
    }

    if (!formData.dean_name.trim()) {
      newErrors.dean_name = "Dean name is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validateGradingComponents = (): boolean => {
    const totalWeight = gradeComponents.reduce((sum, comp) => sum + comp.weight_percentage, 0)
    // If no components, that's valid (empty grading system)
    // If components exist, total weight must equal 100%
    return gradeComponents.length === 0 || totalWeight === 100
  }

  const totalWeight = gradeComponents.reduce((sum, comp) => sum + comp.weight_percentage, 0)

  // Check if department form data has changed
  const hasDepartmentFormChanged = (): boolean => {
    return (
      formData.department_name !== originalFormData.department_name ||
      formData.description !== originalFormData.description ||
      formData.dean_name !== originalFormData.dean_name
    )
  }

  // Check if grading components have changed
  const haveGradeComponentsChanged = (): boolean => {
    if (gradeComponents.length !== originalGradeComponents.length) {
      return true
    }
    
    return gradeComponents.some((component, index) => {
      const originalComponent = originalGradeComponents[index]
      return (
        !originalComponent ||
        component.component_name !== originalComponent.component_name ||
        component.weight_percentage !== originalComponent.weight_percentage
      )
    })
  }

  // Check if any changes have been made
  const hasAnyChanges = (): boolean => {
    return hasDepartmentFormChanged() || haveGradeComponentsChanged()
  }

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate department form
    if (!validateDepartmentForm()) {
      return
    }
    
    // Validate grading components
    if (!validateGradingComponents()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Update department with grading components in one request
      const response = await fetch('/api/admin/department/full', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department_id: department?.department_id,
          department: formData,
          gradeComponents: gradeComponents
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Duplicate name error
          setErrors({ department_name: result.error })
          return
        }
        throw new Error(result.error || 'Failed to update department')
      }

      // Success
      toast.success("Department updated successfully.")
      onSuccess()
      onClose()

    } catch (error) {
      console.error('Error updating department:', error)
      
      const errorMessage = error instanceof Error ? error.message : "Failed to update department"
      setErrors({ general: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({})
      onClose()
    }
  }

  // Grading component management functions
  const addGradeComponent = () => {
    setGradeComponents([...gradeComponents, { component_name: "", weight_percentage: 0 }])
  }

  const removeGradeComponent = (index: number) => {
    setGradeComponents(gradeComponents.filter((_, i) => i !== index))
  }

  const updateGradeComponent = (index: number, field: keyof GradeComponent, value: string | number) => {
    const updated = [...gradeComponents]
    updated[index] = { ...updated[index], [field]: value }
    setGradeComponents(updated)
  }

  const isDepartmentFormValid = formData.department_name.trim() !== "" && formData.dean_name.trim() !== ""
  const isGradingComponentsValid = validateGradingComponents()
  const isFormValid = isDepartmentFormValid && isGradingComponentsValid && hasAnyChanges()

  if (!department) return null

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[600px]">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--customized-color-one)] mx-auto mb-4" />
              <p className="text-lg text-gray-600 dark:text-gray-400">Loading department data...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Edit Department
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Update the information and configure grading components for <strong>{department.department_name}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex justify-between gap-4">
            {/* Department Information Section */}
            <Card className="w-[40%] border border-gray-200 bg-transparent dark:border-gray-900">
              <CardHeader className="p-4">
                <CardTitle className="flex items-center justify-between text-lg text-black dark:text-white">
                  <div className="flex items-center gap-2 font-bold">
                    Department Information
                  </div>
                  {/* {hasDepartmentFormChanged() && (
                    <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded-full">
                      Modified
                    </span>
                  )} */}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-4">
                <div className="space-y-4">
                  <div className="w-full space-y-1">
                    <Label htmlFor="edit-department_name">Department Name</Label>
                    <Input
                      id="edit-department_name"
                      type="text"
                      placeholder="e.g., College of Arts and Science"
                      value={formData.department_name}
                      onChange={(e) => handleInputChange('department_name', e.target.value)}
                      className={errors.department_name ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}
                      disabled={isSubmitting}
                    />
                    {errors.department_name && (
                      <p className="text-sm text-red-500">{errors.department_name}</p>
                    )}
                  </div>

                  <div className="w-full space-y-1">
                    <Label htmlFor="edit-dean_name">Department Dean</Label>
                    <Input
                      id="edit-dean_name"
                      type="text"
                      placeholder="e.g., Dr. Carolyn A. Alvero"
                      value={formData.dean_name}
                      onChange={(e) => handleInputChange('dean_name', e.target.value)}
                      className={errors.dean_name ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}
                      disabled={isSubmitting}
                    />
                    {errors.dean_name && (
                      <p className="text-sm text-red-500">{errors.dean_name}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-description">Description</Label>
                  <Textarea
                    id="edit-description"
                    placeholder="Brief description of the department..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    disabled={isSubmitting}
                    className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Grading Components Section */}
            <Card className="w-[60%] bg-transparent border border-gray-200 dark:border-gray-900">
              <CardHeader className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CardTitle className="flex items-center gap-2 text-lg font-bold text-black dark:text-white">
                      Grading Components
                    </CardTitle>
                    {/* {haveGradeComponentsChanged() && (
                      <span className="text-xs bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 px-2 py-1 rounded-full">
                        Modified
                      </span>
                    )} */}
                  </div>
                  <Button
                    type="button"
                    onClick={addGradeComponent}
                    size="sm"
                    className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
                    disabled={isSubmitting}
                  >
                    <Plus className="w-4 h-4" />
                    Add Component
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                {gradeComponents.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>No grading components configured</p>
                    <p className="text-sm">Add components to define the grading system for this department</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    {/* Total Weight Display */}
                    <div className="flex justify-between p-2 rounded-lg">
                      <div className="space-x-1">
                        <span className="font-medium text-black dark:text-gray-300">Total Weight:</span>
                        <span className={`font-bold text-lg ${totalWeight === 100 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {totalWeight}%
                        </span>
                      </div>
                        {totalWeight !== 100 && gradeComponents.length > 0 && (
                        <p className="text-sm text-red-500 dark:text-red-400">
                          Total weight must equal 100%
                        </p>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {gradeComponents.map((component, index) => (
                        <div key={index} className="flex items-center gap-2 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                          <div className="">
                            <div>
                              <Label htmlFor={`component-name-${index}`}>Component Name</Label>
                              <Input
                                id={`component-name-${index}`}
                                type="text"
                                placeholder="e.g., Quizzes, Exams, Projects"
                                value={component.component_name}
                                onChange={(e) => updateGradeComponent(index, 'component_name', e.target.value)}
                                disabled={isSubmitting}
                                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
                              />
                            </div>
                          </div>
                          <div className="w-3xs">
                            <Label htmlFor={`component-weight-${index}`}>Weight (%)</Label>
                            <Input
                              id={`component-weight-${index}`}
                              type="number"
                              min="0"
                              max="100"
                              placeholder="0"
                              value={component.weight_percentage}
                              onChange={(e) => updateGradeComponent(index, 'weight_percentage', Number(e.target.value))}
                              disabled={isSubmitting}
                              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeGradeComponent(index)}
                            className="bg-red-100 border-none text-red-500 hover:bg-red-500 hover:text-red-50 dark:bg-[var(--delete-color-one)] dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-black"
                            disabled={isSubmitting}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          {/* Debug Information - Remove this in production */}
          {/* <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md text-xs">
            <p><strong>Debug Info:</strong></p>
            <p>Department Form Valid: {isDepartmentFormValid ? '✅' : '❌'}</p>
            <p>Grading Components Valid: {isGradingComponentsValid ? '✅' : '❌'}</p>
            <p>Department Changed: {hasDepartmentFormChanged() ? '✅' : '❌'}</p>
            <p>Grading Changed: {haveGradeComponentsChanged() ? '✅' : '❌'}</p>
            <p>Has Changes: {hasAnyChanges() ? '✅' : '❌'}</p>
            <p>Form Valid: {isFormValid ? '✅' : '❌'}</p>
            <p>Total Weight: {totalWeight}%</p>
            <p>Components Count: {gradeComponents.length}</p>
            <p>Original Components Count: {originalGradeComponents.length}</p>
          </div> */}

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none disabled:opacity-50 disabled:cursor-not-allowed dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : !hasAnyChanges() ? (
                "No Changes to Save"
              ) : (
                "Update Department"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
