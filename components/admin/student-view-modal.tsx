"use client"

import type React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Student } from "@/types/student"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { BarChart3 } from "lucide-react"

interface StudentViewModalProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function StudentViewModal({ student, open, onOpenChange }: StudentViewModalProps) {
  const router = useRouter()
  
  if (!student) return null

  // Helper to format date
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "Not provided"
    return new Date(dateString).toLocaleDateString()
  }

  // Helper to format phone number
  const formatPhoneNumber = (phone?: string | null) => {
    if (!phone) return "Not provided"
    return phone
  }

  const handleViewPerformance = () => {
    onOpenChange(false)
    router.push(`/admin/users/students/${student.student_id}/performance`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl bg-white dark:bg-black border-none">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black dark:text-white">
            Student Information
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Student Header */}
          <div className="flex items-center gap-6 p-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] rounded-lg">
            <Image
              src={student.avatar || "/placeholder.svg"}
              alt={student.name}
              width={80}
              height={80}
              className="rounded-full border-4 border-white dark:border-gray-800"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black dark:text-white">{student.name}</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">{student.email}</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Student ID: {student.id}</p>
            </div>
            <div className="text-right space-y-2">
              <Badge
                variant={
                  student.status === "Enrolled"
                    ? "default"
                    : student.status === "Graduated"
                      ? "secondary"
                      : student.status === "Dropout"
                        ? "destructive"
                        : student.status === "Leave of Absence"
                          ? "outline"
                          : "outline"
                }
                className={
                  student.status === "Enrolled"
                    ? "bg-green-100 text-green-600 hover:bg-green-100 text-lg px-4 py-2"
                    : student.status === "Graduated"
                      ? "bg-blue-100 text-blue-600 hover:bg-blue-100 text-lg px-4 py-2"
                      : student.status === "Dropout"
                        ? "bg-red-100 text-red-600 hover:bg-red-100 text-lg px-4 py-2"
                        : student.status === "Leave of Absence"
                          ? "bg-yellow-100 text-yellow-600 hover:bg-yellow-100 border-none text-lg px-4 py-2"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-100 text-lg px-4 py-2"
                }
              >
                {student.status}
              </Badge>
              <Button
                onClick={handleViewPerformance}
                className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                View Performance
              </Button>
            </div>
          </div>

          {/* Academic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-black dark:text-white border-b border-gray-300 dark:border-gray-600 pb-2">
                Academic Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Course</label>
                  <p className="text-black dark:text-white">{student.course}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">School Year</label>
                  <p className="text-black dark:text-white">{student.schoolYear}</p>
                </div>
                
                 <div>
                   <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Year & Section</label>
                   <p className="text-black dark:text-white">{student.yearSection}</p>
                 </div>
              </div>
            </div>

            {/* Personal Information */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-black dark:text-white border-b border-gray-300 dark:border-gray-600 pb-2">
                Personal Information
              </h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Birthday</label>
                  <p className="text-black dark:text-white">{formatDate(student.birthday)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                  <p className="text-black dark:text-white">{student.address || "Not provided"}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Contact Number</label>
                  <p className="text-black dark:text-white">{formatPhoneNumber(student.contact_number)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Student ID (Internal)</label>
                  <p className="text-black dark:text-white">{student.student_id}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Information */}
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-black dark:text-white border-b border-gray-300 dark:border-gray-600 pb-2">
              System Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Date Created</label>
                <p className="text-black dark:text-white">{formatDate(student.created_at)}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</label>
                <p className="text-black dark:text-white">{formatDate(student.updated_at)}</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
