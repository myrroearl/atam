"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, ArrowLeft, ArrowRight, Check, X } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import GradeComponentForm, { GradeComponent } from "./grade-component-form"

interface Department {
  department_id: number
  department_name: string
  description: string | null
  dean_name: string
  created_at: string
  updated_at: string
}

interface DepartmentFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  department?: Department | null
  mode: "add" | "edit"
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

type Step = "department" | "grading"

export default function DepartmentFormModal({
  isOpen,
  onClose,
  onSuccess,
  department,
  mode
}: DepartmentFormModalProps) {
  const [formData, setFormData] = useState<FormData>({
    department_name: "",
    description: "",
    dean_name: ""
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>("department")
  const [gradeComponents, setGradeComponents] = useState<GradeComponent[]>([])

  // Reset form when modal opens/closes or department changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && department) {
        setFormData({
          department_name: department.department_name,
          description: department.description || "",
          dean_name: department.dean_name
        })
        setCurrentStep("department") // Edit mode only shows department step
      } else {
        setFormData({
          department_name: "",
          description: "",
          dean_name: ""
        })
        setCurrentStep("department") // Add mode starts with department step
        setGradeComponents([]) // Reset grading components for new department
      }
      setErrors({})
    }
  }, [isOpen, department, mode])

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
    return gradeComponents.length > 0 && totalWeight === 100
  }

  const totalWeight = gradeComponents.reduce((sum, comp) => sum + comp.weight_percentage, 0)

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

  const handleNext = () => {
    if (validateDepartmentForm()) {
      setCurrentStep("grading")
    }
  }

  const handleBack = () => {
    setCurrentStep("department")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (mode === "edit") {
      // For edit mode, only validate department form
      if (!validateDepartmentForm()) {
        return
      }
    } else {
      // For add mode, validate both department form and grading components
      if (!validateDepartmentForm()) {
        setCurrentStep("department")
        return
      }
      
      if (!validateGradingComponents()) {
        setCurrentStep("grading")
        return
      }
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      let response: Response
      let result: any

      if (mode === "edit") {
        // Edit mode: only update department details
        response = await fetch(`/api/admin/department/${department?.department_id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        result = await response.json()
      } else {
        // Add mode: create department with grading components
        response = await fetch('/api/admin/department/full', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            department: formData,
            gradeComponents: gradeComponents
          }),
        })
        result = await response.json()
      }

      if (!response.ok) {
        if (response.status === 409) {
          // Duplicate name error
          setErrors({ department_name: result.error })
          setCurrentStep("department")
          return
        }
        throw new Error(result.error || `Failed to ${mode} department`)
      }

      // Success
      const successMessage = mode === "edit" 
        ? "Department updated successfully!" 
        : "Department created successfully with grading components!"
      
      toast.success(successMessage)
      onSuccess()
      onClose()

    } catch (error) {
      console.error(`Error ${mode === "edit" ? "updating" : "creating"} department:`, error)
      
      const errorMessage = error instanceof Error ? error.message : `Failed to ${mode} department`
      setErrors({ general: errorMessage })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      setErrors({})
      setCurrentStep("department")
      setGradeComponents([])
      onClose()
    }
  }

  const isDepartmentFormValid = formData.department_name.trim() !== "" && formData.dean_name.trim() !== ""
  const isGradingComponentsValid = validateGradingComponents()

  const getStepTitle = () => {
    if (mode === "edit") return "Edit Department"
    return currentStep === "department" ? "Create Department" : "Setup Grading Components"
  }

  const getStepDescription = () => {
    if (mode === "edit") return "Update the department information below."
    if (currentStep === "department") return "Fill in the department details below."
    return "Define how grades will be calculated for this department."
  }

  const renderDepartmentStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="department_name">Department Name <strong className="text-red-600">*</strong></Label>
        <Input
          id="department_name"
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

      <div className="space-y-2">
        <Label htmlFor="dean_name">Department Dean <strong className="text-red-600">*</strong></Label>
        <Input
          id="dean_name"
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

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Brief description of the department..."
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          disabled={isSubmitting}
          className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
        />
      </div>
    </div>
  )

  const renderGradingStep = () => (
    <GradeComponentForm
      components={gradeComponents}
      onComponentsChange={setGradeComponents}
      totalWeight={totalWeight}
    />
  )

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>
        {mode === "add" && (
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-4">
              {/* Step 1 */}
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  currentStep === "department" 
                    ? "bg-[var(--customized-color-one)] border-[var(--customized-color-one)] dark:bg-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-one)] dark:text-black text-white" 
                    : currentStep === "grading"
                    ? "bg-[var(--customized-color-two)] border-[var(--customized-color-two)] dark:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)] text-white"
                    : "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-700 text-gray-500 dark:text-gray-400"
                }`}>
                  {currentStep === "grading" ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">1</span>
                  )}
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === "department" ? "text-[var(--customized-color-one)] dark:text-[var(--darkmode-color-one)]"
                    : currentStep === "grading"
                    ? "text-[var(--customized-color-two)] dark:text-[var(--darkmode-color-two)]"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  Department Details
                </span>
              </div>

              {/* Connector Line */}
              <div className={`w-12 h-0.5 transition-colors ${
                currentStep === "grading" ? "bg-[var(--customized-color-one)] dark:bg-[var(--darkmode-color-one)]" : "bg-gray-300 dark:bg-gray-700 dark:border-gray-700"
              }`} />

              {/* Step 2 */}
              <div className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors ${
                  currentStep === "grading" 
                    ? "bg-[var(--customized-color-one)] border-[var(--customized-color-one)] dark:bg-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-one)] dark:text-black text-white" 
                    : "bg-gray-100 border-gray-300 text-gray-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-500 dark:border-gray-700 dark:text-black"
                }`}>
                  <span className="text-sm font-semibold">2</span>
                </div>
                <span className={`ml-2 text-sm font-medium ${
                  currentStep === "grading"
                    ? "text-[var(--customized-color-one)] dark:text-[var(--darkmode-color-one)]"
                    : "text-gray-500 dark:text-gray-400"
                }`}>
                  Grading Setup
                </span>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentStep === "department" ? renderDepartmentStep() : renderGradingStep()}

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <DialogFooter>
            <div className="flex-1">
              {mode === "add" && currentStep === "grading" && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black"
              >
                Cancel
              </Button>
              
              {mode === "add" && currentStep === "department" ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isDepartmentFormValid || isSubmitting}
                  className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-[var(--darkmode-color-one)] dark:text-black group"
                >
                  Next
                  <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || 
                    !isDepartmentFormValid || 
                    (mode === "add" && !isGradingComponentsValid)
                  }
                  className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {mode === "edit" ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      {mode === "edit" ? "Update Department" : "Add Department"}
                    </>
                  )}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
