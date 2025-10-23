"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoreVertical, Edit, Trash } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Course {
  course_id: number
  department_id: number
  course_code: string
  course_name: string
  description: string | null
  created_at: string
  updated_at: string
}

interface CourseCardProps {
  course: Course
  onEdit: (course: Course) => void
  onDelete: (course: Course) => void
}

// Color variations for course cards
const cardColors = [
  "bg-green-100",
  "bg-blue-100", 
  "bg-purple-100",
  "bg-yellow-100",
  "bg-pink-100",
  "bg-indigo-100",
  "bg-red-100",
  "bg-teal-100"
]

export default function CourseCard({ course, onEdit, onDelete }: CourseCardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const router = useRouter()
  const colorIndex = course.course_id % cardColors.length
  const headerColor = cardColors[colorIndex]

  const handleViewSubjects = () => {
    router.push(`/admin/curriculum/course/${course.course_id}/subjects`)
  }

  const handleEdit = () => {
    setIsDropdownOpen(false)
    onEdit(course)
  }

  const handleDelete = () => {
    setIsDropdownOpen(false)
    onDelete(course)
  }

  return (
    <div 
      className="flex border border-gray-300 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-md transition-all bg-white dark:bg-black cursor-pointer"
      onClick={handleViewSubjects}
    >
      {/* Left Side - Colored Section */}
      <div className={`${headerColor} flex items-center justify-center w-24 p-6 rounded-l-xl`}>
        <span className="font-extrabold text-xl text-gray-900 dark:text-white">
          {course.course_code}
        </span>
      </div>

      {/* Right Side - Main Section */}
      <div className="flex-1 p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-gray-800 dark:text-white">
              {course.course_name}
            </h3>
            {course.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mt-1">
                {course.description}
              </p>
            )}
            {/* <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
              <span>Created: {new Date(course.created_at).toLocaleDateString()}</span>
              {course.updated_at !== course.created_at && (
                <span>Updated: {new Date(course.updated_at).toLocaleDateString()}</span>
              )}
            </div> */}
          </div>

          {/* Options Menu */}
          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleEdit} className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Edit Course
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete} 
                className="flex items-center gap-2 text-red-600 hover:text-red-700 focus:text-red-700"
              >
                <Trash className="h-4 w-4" />
                Delete Course
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  )
}
