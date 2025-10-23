"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, MoreVertical, SquarePen, Trash } from "lucide-react"
import { EditClassModal } from "@/components/admin/edit-class-modal"
import { DeleteClassModal } from "@/components/admin/delete-class-modal" // Updated interface
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Class {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
  units: number;
  professor: string;
  professorEmail: string;
  section: string;
  course: string;
  department: string;
  yearLevel: string;
  semester: string;
  schedule_start: string | null;
  schedule_end: string | null;
  class_id: number;
  subject_id: number;
  section_id: number;
  prof_id: number;
  course_id: number;
  department_id: number;
  created_at: string;
  updated_at: string;
}

interface ClassesTableProps {
  classes: Class[];
  onDeleteClass?: (classData: Class) => void;
  onEditClass?: (classData: Class) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
}

export function ClassesTable({ classes, onDeleteClass, onEditClass, currentPage, setCurrentPage }: ClassesTableProps) {
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingClass, setDeletingClass] = useState<Class | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const pageSize = 10;
  const totalPages = Math.ceil(classes.length / pageSize);
  const paginatedClasses = classes.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Display exact schedule timestamps from database
  const formatSchedule = (scheduleStart: string | null, scheduleEnd: string | null) => {
    if (!scheduleStart || !scheduleEnd) {
      return 'Not scheduled';
    }
    
    // Debug logging for schedule display
    console.log('🔍 CLASSES TABLE: Displaying schedule data:', {
      scheduleStart,
      scheduleEnd,
      typeStart: typeof scheduleStart,
      typeEnd: typeof scheduleEnd
    });

    // Extract time from ISO format (2025-10-01T17:00:00+00:00) and convert to 12-hour format
    const startTime = scheduleStart.split('T')[1]?.split('+')[0]?.substring(0, 5) || '';
    const endTime = scheduleEnd.split('T')[1]?.split('+')[0]?.substring(0, 5) || '';
    
    // Convert to 12-hour format
    const formatTo12Hour = (time24: string) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    const startTime12 = formatTo12Hour(startTime);
    const endTime12 = formatTo12Hour(endTime);
    
    return (
    <div className="flex items-center gap-1">
      <span className="text-xs">{startTime12}</span>
      <span className="text-xs">to</span>
      <span className="text-xs">{endTime12}</span>
    </div>
    );
  };

  const handleEdit = (classData: Class) => {
    setEditingClass(classData)
    setShowEditModal(true)
  }

  const handleDelete = (classData: Class) => {
    setDeletingClass(classData)
    setShowDeleteModal(true)
  }

  const handleSave = (updatedClass: Class) => {
    // Enhanced debugging for table update
    console.log('\n🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 CLASSES TABLE: Received updated class data');
    console.log('🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 Updated class ID:', updatedClass.class_id);
    console.log('🔍 Updated class name:', updatedClass.name);
    console.log('🔍 Updated schedule_start:', updatedClass.schedule_start);
    console.log('🔍 Updated schedule_end:', updatedClass.schedule_end);
    console.log('🔍 ═══════════════════════════════════════════════════════════\n');

    if (onEditClass && updatedClass) onEditClass(updatedClass);
    setShowEditModal(false);
  }

  const handleDeleteConfirm = (classData: Class) => {
    if (onDeleteClass) onDeleteClass(classData);
    setShowDeleteModal(false);
  }

  return (
    <>
      <div className="bg-white rounded-lg border-none overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full rounded-lg">
            <thead className="bg-[var(--customized-color-four)] rounded-lg dark:bg-gray-800 w-full">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Class Name</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Subject</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Professor</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Section</th>
                {/* <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Course</th> */}
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Schedule</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedClasses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-gray-500 py-8">No classes found.</td>
                </tr>
              ) : (
                paginatedClasses.map((classData) => (
                  <tr key={classData.id} className="border-b border-[var(--customized-color-five)] bg-white dark:bg-black hover:bg-[var(--customized-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)]">
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div>
                        <p className="font-medium text-gray-900 text-xs dark:text-white">{classData.name}</p>
                        <p className="text-xs text-gray-500">{classData.subjectCode}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div>
                        <p className="text-black text-xs dark:text-white">{classData.subject}</p>
                        <p className="text-xs text-gray-500">{classData.units} units</p>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div>
                        <p className="text-black text-xs dark:text-white">{classData.professor}</p>
                        <p className="text-xs text-gray-500">{classData.professorEmail}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{classData.section}</td>
                    {/* <td className="p-2 text-black text-xs dark:text-white">{classData.course}</td> */}
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      {formatSchedule(classData.schedule_start, classData.schedule_end)}
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex items-center gap-2 justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:!text-[var(--customized-color-one)] hover:bg-[var(--customized-color-four)] dark:hover:text-gray-300"
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(classData) }}
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-24" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(classData)}} className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(classData) }} 
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, classes.length)} of {classes.length} classes
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

      <EditClassModal
        classData={editingClass}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleSave}
      />

      <DeleteClassModal
        classData={deletingClass}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onDelete={handleDeleteConfirm}
      />
    </>
  )
}
