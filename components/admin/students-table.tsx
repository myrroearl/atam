"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { SquarePen, Trash, Eye, Edit, MoreVertical } from "lucide-react"
import { EditStudentModal } from "@/components/admin/edit-student-modal"
import { DeleteStudentModal } from "@/components/admin/delete-student-modal"
import { useEffect } from "react"
import { Student } from "@/types/student"
import { useRouter } from "next/navigation"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"

interface StudentsTableProps {
  students: Student[];
  onDeleteStudent?: (studentId: string) => void;
  onEditStudent?: (student: Student) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export function StudentsTable({ students, onDeleteStudent, onEditStudent, currentPage, setCurrentPage }: StudentsTableProps) {
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingStudent, setDeletingStudent] = useState<Student | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const router = useRouter()
  const pageSize = 10;
  const totalPages = Math.ceil(students.length / pageSize);
  const paginatedStudents = students.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setShowEditModal(true)
  }

  const handleDelete = (student: Student) => {
    setDeletingStudent(student)
    setShowDeleteModal(true)
  }

  const handleRowClick = (student: Student) => {
    router.push(`/admin/users/students/${student.student_id}/performance`)
  }

  // Save and delete should be handled in parent for full sync, but keep modal open/close logic here
  const handleSave = (updatedStudent: Student) => {
    if (onEditStudent && updatedStudent) onEditStudent(updatedStudent);
    setShowEditModal(false);
  }
  
  const handleConfirmDelete = (studentId: string) => {
    if (onDeleteStudent) onDeleteStudent(studentId);
    setShowDeleteModal(false);
    setDeletingStudent(null);
  }

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  return (
    <>
      <div className="bg-white rounded-lg border-none overflow-hidden">
        <div className="overflow-x-auto border-none overflow-hidden rounded-t-lg">
          <table className="w-full rounded-lg">
            <thead className="bg-[var(--customized-color-four)] rounded-lg dark:bg-gray-800 w-full">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Student Name</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Student No.</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Course</th>
                {/* <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">School Year</th> */}
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Year & Section</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Status</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">No students found.</td>
                </tr>
              ) : (
                paginatedStudents.map((student) => (
                  <tr 
                    key={student.id} 
                    className="border-b border-[var(--customized-color-five)] bg-white dark:bg-black hover:bg-[var(--customized-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)] cursor-pointer transition-colors"
                    onClick={() => handleRowClick(student)}
                  >
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex items-center gap-3">
                        <Image
                          src={student.avatar || "/placeholder.svg"}
                          alt={student.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm dark:text-white">{student.name}</p>
                          <p className="text-xs text-gray-700 dark:text-gray-400">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{student.id}</td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{student.course}</td>
                    {/* <td className="px-2 py-2 text-sm text-black dark:text-white">{student.schoolYear}</td> */}
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{student.yearSection}</td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <Badge
                        variant={
                          student.status === "active"
                            ? "default"
                            : student.status === "inactive"
                              ? "destructive"
                              : "outline"
                        }
                        className={
                          student.status === "active"
                            ? "bg-green-100 text-green-800 hover:bg-emerald-100"
                            : student.status === "inactive"
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : student.status === "suspended"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex items-center gap-2 justify-end">
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:!text-[var(--customized-color-one)] hover:bg-[var(--customized-color-four)] dark:hover:text-gray-300"
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(student) }}
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-24" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(student)}} className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(student) }} 
                              className="flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
                            >
                              <Trash className="h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-2 bg-white dark:bg-black">
          <p className="text-xs text-gray-700 dark:text-gray-400">
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, students.length)} of {students.length} students
          </p>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600">Page {currentPage} of {totalPages}</span>
            <Button className="text-xs border-none" variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
              First
            </Button>
            <Button className="text-xs border-none" variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              {"<"}
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 2), currentPage + 3).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? "default" : "outline"}
                size="sm"
                className={page === currentPage ? "bg-[var(--customized-color-one)] border-none hover:bg-[var(--customized-color-two)]" : "border-none hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)]"}
                onClick={() => setCurrentPage(page)}  
              >
                {page}
              </Button>
            ))}
            <Button className="text-xs border-none hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)]" variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              {">"}
            </Button>
            <Button className="text-xs border-none hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)]" variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
              Last
            </Button>
          </div>
        </div>
      </div>

      <EditStudentModal
        student={editingStudent}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleSave}
      />

      <DeleteStudentModal
        student={deletingStudent}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onDelete={handleConfirmDelete}
      />
    </>
  )
}
