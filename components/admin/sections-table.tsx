"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Edit, SquarePen, Trash } from "lucide-react"
import { EditSectionModal } from "@/components/admin/edit-section-modal"
import { DeleteSectionModal } from "@/components/admin/delete-section-modal"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"

interface Section {
  id: string;
  name: string;
  course: string;
  department: string;
  yearLevel: string;
  courseCode: string;
  section_id: number;
  course_id: number;
  year_level_id: number;
  department_id: number;
  created_at: string;
  updated_at: string;
}

interface SectionsTableProps {
  sections: Section[];
  onDeleteSection?: (sectionId: string) => void;
  onEditSection?: (section: Section) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  onValidationError?: (message: string) => void;
  checkDuplicate?: (name: string, course: string, yearLevel: string) => boolean;
}

export function SectionsTable({ sections, onDeleteSection, onEditSection, currentPage, setCurrentPage, onValidationError, checkDuplicate }: SectionsTableProps) {
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [deletingSection, setDeletingSection] = useState<Section | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const pageSize = 10;
  const totalPages = Math.ceil(sections.length / pageSize);
  const paginatedSections = sections.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleEdit = (section: Section) => {
    setEditingSection(section)
    setShowEditModal(true)
  }

  const handleDelete = (section: Section) => {
    setDeletingSection(section)
    setShowDeleteModal(true)
  }

  const handleSave = (updatedSection: Section) => {
    if (onEditSection && updatedSection) onEditSection(updatedSection);
    setShowEditModal(false);
  }

  const handleDeleteConfirm = (sectionId: string) => {
    if (onDeleteSection) onDeleteSection(sectionId);
    setShowDeleteModal(false);
  }

  return (
    <>
      <div className="bg-white rounded-lg">
        <div className="overflow-x-auto border-none overflow-hidden rounded-t-lg">
          <table className="w-full rounded-lg">
            <thead className="bg-[var(--customized-color-four)] rounded-lg dark:bg-gray-800 w-full">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Section Name</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Course</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Department</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Year Level</th>
                {/* <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Course Code</th> */}
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {paginatedSections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">No sections found.</td>
                </tr>
              ) : (
                paginatedSections.map((section) => (
                  <tr key={section.id} className="border-b border-[var(--customized-color-five)] bg-white dark:bg-black hover:bg-[var(--customized-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)]">
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div>
                        <p>{section.name}</p>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{section.course} ({section.courseCode})</td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{section.department}</td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{section.yearLevel}</td>
                    {/* <td className="p-2 text-black text-sm dark:text-white">{section.courseCode}</td> */}
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex items-center gap-2 justify-end">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-gray-600 hover:!text-[var(--customized-color-one)] hover:bg-[var(--customized-color-four)] dark:hover:text-gray-300"
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(section) }}
                            >
                              <MoreVertical className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-24" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(section)}} className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer">
                              <Edit className="h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(section) }} 
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sections.length)} of {sections.length} sections
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

      <EditSectionModal
        section={editingSection}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleSave}
        onValidationError={onValidationError}
        checkDuplicate={checkDuplicate}
      />

      <DeleteSectionModal
        section={deletingSection}
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        onDelete={handleDeleteConfirm}
      />
    </>
  )
}
