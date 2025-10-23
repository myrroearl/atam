"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SquarePen, Trash, ArrowRight } from "lucide-react"
import { generateAcronym } from "@/lib/utils"
import { useRouter } from "next/navigation"

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

interface DepartmentCardProps {
  department: Department
  onEdit: (department: Department) => void
  onDelete: (department: Department) => void
  courseCount?: number
}

// Color variations for department cards
const cardColors = [
  "bg-[var(--customized-color-two)]",
  "bg-[var(--customized-color-three)]",
]

export default function DepartmentCard({ 
  department, 
  onEdit, 
  onDelete, 
  courseCount = 0 
}: DepartmentCardProps) {
  const router = useRouter()
  const acronym = generateAcronym(department.department_name)
  const colorIndex = department.department_id % cardColors.length
  const headerColor = cardColors[colorIndex]

  const handleViewCourses = () => {
    router.push(`/admin/curriculum/${department.department_id}/courses`)
  }

  return (
    <Card className="bg-white dark:bg-black border-0 transition-transform duration-500 hover:-translate-y-2 shadow-md dark:shadow-none rounded-2xl cursor-pointer h-[400px] flex flex-col" onClick={handleViewCourses}>
      <CardHeader className={`p-4 ${headerColor} rounded-t-2xl flex-shrink-0`}>
        <CardTitle className="text-center font-semibold text-white">
          {acronym}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex flex-col space-y-3 flex-1">
          <div className="flex-shrink-0">
            <h3 className="font-medium text-black dark:text-white text-lg">
              {department.department_name}
            </h3>
            {department.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                {department.description}
              </p>
            )}
          </div>
          
          <div className="flex-1 flex flex-col space-y-3">
            <div className="flex justify-between items-center">
              <p className="text-sm font-medium text-black dark:text-gray-400">Dean:</p>
              <p className="text-sm font-normal text-gray-600 dark:text-white">
                {department.dean_name}
              </p>
            </div>
            
            {department.grade_components && department.grade_components.length > 0 ? (
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-black dark:text-gray-400">Grading:</p>
                  <p className="text-sm font-normal text-gray-600 dark:text-white">
                    {department.grade_components.length} component{department.grade_components.length !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="flex-1 ml-2 space-y-1 border-l-2 border-gray-200 dark:border-gray-700 pl-3 overflow-y-auto max-h-32">
                  {department.grade_components.map((component, index) => (
                    <div key={component.component_id} className="flex justify-between text-xs">
                      <span className="text-black dark:text-gray-400">{component.component_name}</span>
                      <span className="text-gray-600 dark:text-white font-medium">{component.weight_percentage}%</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-xs font-semibold pt-1 border-t border-gray-200 dark:border-gray-700 mt-1 sticky bottom-0 bg-white dark:bg-black">
                    <span className="text-black dark:text-gray-400">Total</span>
                    <span className="text-gray-600 dark:text-white">
                      {department.grade_components.reduce((sum, comp) => sum + comp.weight_percentage, 0)}%
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400"></p>
                  <p className="text-xs text-gray-400 dark:text-gray-500"></p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4 flex justify-end flex-shrink-0">
        {/* <Button 
          onClick={handleViewCourses}
          className="flex items-center gap-2 bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none"
        >
          View Courses
          <ArrowRight className="w-4 h-4" />
        </Button> */}
        <div className="flex justify-between w-full gap-3">
          <Button 
            variant="outline" 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onEdit(department) }}
            className="flex items-center gap-2 bg-[var(--customized-color-five)] border-none text-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] hover:text-white dark:bg-black dark:text:white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)] w-full"
          >
            <SquarePen className="w-4 h-4" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDelete(department) }}
            className="flex items-center gap-2 bg-red-50 border-none text-red-500 hover:bg-red-500 hover:text-red-50 dark:bg-black dark:text:white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-red-500 w-full"
          >
            <Trash className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
