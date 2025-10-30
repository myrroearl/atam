"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, AlertTriangle, Check } from "lucide-react"
import { toast } from "sonner"

export interface GradeComponent {
  component_name: string
  weight_percentage: number
}

interface GradeComponentFormProps {
  components: GradeComponent[]
  onComponentsChange: (components: GradeComponent[]) => void
  totalWeight: number
}

export default function GradeComponentForm({
  components,
  onComponentsChange,
  totalWeight
}: GradeComponentFormProps) {
  const [newComponent, setNewComponent] = useState({
    component_name: "",
    weight_percentage: 0
  })

  const handleAddComponent = () => {
    if (!newComponent.component_name.trim()) {
      toast.error("Component name is required")
      return
    }

    if (newComponent.weight_percentage <= 0) {
      toast.error("Weight percentage must be greater than 0")
      return
    }

    if (newComponent.weight_percentage > 100) {
      toast.error("Weight percentage cannot exceed 100%")
      return
    }

    if (totalWeight + newComponent.weight_percentage > 100) {
      toast.error(`Adding ${newComponent.weight_percentage}% would exceed 100% total weight`)
      return
    }

    // Check for duplicate component names
    if (components.some(comp => 
      comp.component_name.toLowerCase() === newComponent.component_name.toLowerCase()
    )) {
      toast.error("A component with this name already exists")
      return
    }

    onComponentsChange([...components, { ...newComponent }])
    setNewComponent({ component_name: "", weight_percentage: 0 })
    toast.success("Grading component added successfully")
  }

  const handleRemoveComponent = (index: number) => {
    onComponentsChange(components.filter((_, i) => i !== index))
    toast.success("Grading component removed")
  }

  const handleComponentNameChange = (index: number, value: string) => {
    const updatedComponents = [...components]
    updatedComponents[index].component_name = value
    onComponentsChange(updatedComponents)
  }

  const handleWeightChange = (index: number, value: number) => {
    if (value < 0 || value > 100) return

    // Check if the new total would exceed 100%
    const newTotal = components.reduce((sum, comp, i) => 
      sum + (i === index ? value : comp.weight_percentage), 0
    )

    if (newTotal > 100) {
      toast.error("Total weight percentage cannot exceed 100%")
      return
    }

    const updatedComponents = [...components]
    updatedComponents[index].weight_percentage = value
    onComponentsChange(updatedComponents)
  }

  const isValid = totalWeight === 100 && components.length > 0

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-black dark:text-white">
          Grading Components
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Total Weight:
          </span>
          <span className={`text-sm font-bold ${
            totalWeight === 100 ? 'text-green-600 dark:text-green-400' : 
            totalWeight > 100 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
          }`}>
            {totalWeight}%
          </span>
        </div>
      </div>

      {/* Add New Component */}
      <div className="">
        <div className="flex gap-3">
          <div className="flex-1 space-y-1">
            <Label htmlFor="component_name" className="text-xs">Component Name</Label>
            <Input
              id="component_name"
              placeholder="e.g., Quizzes, Exams, Projects"
              value={newComponent.component_name}
              onChange={(e) => setNewComponent(prev => ({ ...prev, component_name: e.target.value }))}
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
            />
          </div>
          <div className="w-24 space-y-1">
            <Label htmlFor="weight_percentage" className="text-xs">Weight %</Label>
            <Input
              id="weight_percentage"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="20"
              value={newComponent.weight_percentage || ""}
              onChange={(e) => setNewComponent(prev => ({ 
                ...prev, 
                weight_percentage: parseFloat(e.target.value) || 0 
              }))}
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleAddComponent}
              disabled={!newComponent.component_name.trim() || newComponent.weight_percentage <= 0}
              className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Components List */}
      {components.length > 0 ? (
        <div className="space-y-2 bg-white p-3 border border-gray-300 rounded-lg dark:bg-black dark:border-gray-800">
          <h4 className="text-sm font-medium text-black dark:text-white">
            Current Components
          </h4>
          <div className="space-y-2">
            {components.map((component, index) => (
              <div
                key={index}
                className="flex items-center gap-3"
              >
                <div className="flex-1">
                  <Input
                    value={component.component_name}
                    onChange={(e) => handleComponentNameChange(index, e.target.value)}
                    className="px-3 py-2 h-auto font-medium text-black dark:text-white bg-transparent placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
                    placeholder="Component name"
                  />
                </div>
                <div className="w-20">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={component.weight_percentage}
                    onChange={(e) => handleWeightChange(index, parseFloat(e.target.value) || 0)}
                    className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-8">%</span>
                <Button
                  onClick={() => handleRemoveComponent(index)}
                  variant="outline"
                  size="sm"
                  className="bg-red-100 border-none text-red-500 hover:bg-red-500 hover:text-red-50 dark:bg-[var(--delete-color-one)] dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-black"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-700 dark:text-gray-400">
          <p className="text-sm">No grading components added yet</p>
        </div>
      )}

      {/* Validation Messages */}
      {components.length > 0 && totalWeight !== 100 && (
        <div className="flex items-center gap-2 p-2 bg-orange-50 border border-orange-200 rounded-lg dark:bg-orange-900 dark:border-orange-300 text-orange-800 dark:text-orange-300">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-xs">
            {totalWeight < 100 
              ? `Total weight is ${totalWeight}%. Add ${100 - totalWeight}% more to reach 100%.`
              : `Total weight is ${totalWeight}%. Reduce by ${totalWeight - 100}% to reach 100%.`
            }
          </p>
        </div>
      )}

      {components.length === 0 && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 border border-blue-200 rounded-lg dark:bg-blue-900 dark:border-blue-300 text-blue-800 dark:text-blue-300">
          <AlertTriangle className="w-4 h-4" />
          <p className="text-xs">
            Add at least one grading component to define how grades will be calculated.
          </p>
        </div>
      )}

      {isValid && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900 dark:border-green-300 text-green-800 dark:text-green-300">
          <Check className="w-4 h-4 rounded-full"></Check>
          <p className="text-xs font-medium">
            Perfect! All grading components are set up correctly.
          </p>
        </div>
      )}
    </div>
  )
}
