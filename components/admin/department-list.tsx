"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Search, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"
import DepartmentCard from "./department-card"
import DepartmentFormModal from "./department-form-modal"
import DepartmentEditModal from "./department-edit-modal"
import DepartmentDeleteModal from "./department-delete-modal"

interface GradeComponent {
  component_id: number
  component_name: string
  weight_percentage: number
  created_at: string
}

interface Department {
  department_id: number
  department_name: string
  description: string | null
  dean_name: string
  created_at: string
  updated_at: string
  grade_components?: GradeComponent[]
}

interface DepartmentListProps {
  refreshTrigger?: number
}

export default function DepartmentList({ refreshTrigger }: DepartmentListProps) {
  const [departments, setDepartments] = useState<Department[]>([])
  const [filteredDepartments, setFilteredDepartments] = useState<Department[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null)

  // Fetch departments from API
  const fetchDepartments = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/admin/department')
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments')
      }

      const result = await response.json()
      setDepartments(result.departments || [])
      setFilteredDepartments(result.departments || [])
    } catch (error) {
      console.error('Error fetching departments:', error)
      toast.error("Failed to fetch departments")
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch departments on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchDepartments()
  }, [refreshTrigger])

  // Filter departments based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredDepartments(departments)
    } else {
      const filtered = departments.filter(dept =>
        dept.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.dean_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (dept.description && dept.description.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredDepartments(filtered)
    }
  }, [searchTerm, departments])

  // Handle add department
  const handleAddDepartment = () => {
    setSelectedDepartment(null)
    setIsAddModalOpen(true)
  }

  // Handle edit department
  const handleEditDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setIsEditModalOpen(true)
  }

  // Handle delete department
  const handleDeleteDepartment = (department: Department) => {
    setSelectedDepartment(department)
    setIsDeleteModalOpen(true)
  }

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    fetchDepartments()
  }

  // Close all modals
  const closeAllModals = () => {
    setIsAddModalOpen(false)
    setIsEditModalOpen(false)
    setIsDeleteModalOpen(false)
    setSelectedDepartment(null)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--customized-color-one)] mx-auto mb-4" />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading departments...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header with Add Button */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-black dark:text-white">
              Departments
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* <Button
              onClick={fetchDepartments}
              variant="outline"
              size="sm"
              className="bg-white dark:bg-black border-gray-300 dark:border-gray-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button> */}
              {/* Search Bar */}
              <div className="relative w-[20rem]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                      placeholder="Search department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 placeholder:text-[var(--customized-color-one)] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
                  />
              </div>
            <Button
              onClick={handleAddDepartment}
              className="flex items-center gap-2 bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none"
            >
              <Plus className="w-5 h-5" />
              New Department
            </Button>
          </div>
        </div>

        {/* Departments Grid */}
        {filteredDepartments.length === 0 ? (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-black dark:text-white mb-2">
                {searchTerm ? "No departments found" : "No departments yet"}
              </h3>
              <p className="text-gray-600 dark:text-white mb-6">
                {searchTerm 
                  ? "Try adjusting your search terms or clear the search to see all departments."
                  : "Get started by creating your first department."
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={handleAddDepartment}
                  className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Department
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDepartments.map((department) => (
              <DepartmentCard
                key={department.department_id}
                department={department}
                onEdit={handleEditDepartment}
                onDelete={handleDeleteDepartment}
                courseCount={0} // TODO: Add course count when course management is implemented
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <DepartmentFormModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleModalSuccess}
        department={null}
        mode="add"
      />

      <DepartmentEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleModalSuccess}
        department={selectedDepartment}
      />

      <DepartmentDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleModalSuccess}
        department={selectedDepartment}
      />
    </>
  )
}
