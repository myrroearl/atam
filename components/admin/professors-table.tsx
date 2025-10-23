import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SquarePen, Trash } from "lucide-react";
import { EditProfessorModal } from "@/components/admin/edit-professor-modal";

interface Professor {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  sections: string[];
  facultyType: string;
  status: string;
  avatar: string;
  prof_id: number;
  account_id: number;
  department_id: number;
  birthday?: string;
  address?: string;
  contact_number?: string;
  preferred_time?: string;
  preferred_days?: string;
  created_at: string;
  updated_at: string;
}

interface ProfessorsTableProps {
  professors: Professor[];
  onDeleteProfessor?: (professorId: string) => void;
  onEditProfessor?: (professor: Professor) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  loading?: boolean;
}

export function ProfessorsTable({ professors, onDeleteProfessor, onEditProfessor, currentPage, setCurrentPage, loading }: ProfessorsTableProps) {
  const [editingProfessor, setEditingProfessor] = useState<Professor | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const pageSize = 10;
  const totalPages = Math.ceil(professors.length / pageSize);
  const paginatedProfessors = professors.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleEdit = (prof: Professor) => {
    setEditingProfessor(prof);
    setShowEditModal(true);
  };
  const handleSave = (updatedProfessor: Professor) => {
    if (onEditProfessor && updatedProfessor) onEditProfessor(updatedProfessor);
    setShowEditModal(false);
  };
  const handleDelete = (professorId: string) => {
    if (onDeleteProfessor) onDeleteProfessor(professorId);
    setShowEditModal(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg border-none overflow-hidden">
        <div className="overflow-x-auto border-none overflow-hidden rounded-t-lg">
          <table className="w-full rounded-lg">
            <thead className="bg-[var(--customized-color-four)] rounded-lg dark:bg-gray-800 w-full">
              <tr>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Professor Name</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Employee ID</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Department</th>
                {/* <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Assigned Subjects</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Assigned Sections</th> */}
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Faculty Type</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">Status</th>
                <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">Loading...</td>
                </tr>
              ) : paginatedProfessors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-gray-500 py-8">No professors found.</td>
                </tr>
              ) : (
                paginatedProfessors.map((prof) => (
                  <tr key={prof.id} className="border-b border-[var(--customized-color-five)] bg-white dark:bg-black hover:bg-[var(--customized-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)]">
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex items-center gap-3">
                        <Image
                          src={prof.avatar || "/placeholder.svg"}
                          alt={prof.name}
                          width={40}
                          height={40}
                          className="rounded-full"
                        />
                        <div>
                          <p className="font-medium text-gray-900 text-sm dark:text-white">{prof.name}</p>
                          <p className="text-xs text-gray-700 dark:text-gray-400">{prof.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{prof.id}</td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{prof.department}</td>
                    {/* <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="space-y-1">
                        {prof.subjects && prof.subjects.length > 0 ? (
                          prof.subjects.map((subject_id, idx) => (
                            <p key={idx} className="text-xs text-gray-700">{subject_id}</p>
                          ))
                        ) : (
                          <p className="text-xs text-gray-400 italic">No subjects assigned</p>
                        )}
                      </div>
                    </td> */}
                    {/* <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex flex-wrap gap-1">
                        {prof.sections && prof.sections.length > 0 ? (
                          prof.sections.map((section, idx) => (
                            <Badge key={`${section}-${idx}`} variant="outline" className="text-xs">{section}</Badge>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No sections assigned</span>
                        )}
                      </div>
                    </td> */}
                    <td className="px-2 py-2 text-sm text-black dark:text-white">{prof.facultyType}</td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <Badge
                        variant={
                          prof.status === "Active"
                            ? "default"
                            : prof.status === "Resigned"
                              ? "destructive"
                              : prof.status === "On Leave"
                                ? "secondary"
                                : "outline"
                        }
                        className={
                          prof.status === "Active"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : prof.status === "Resigned"
                              ? "bg-red-100 text-red-800 hover:bg-red-100"
                              : prof.status === "On Leave"
                                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                                : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                        }
                      >
                        {prof.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEdit(prof)
                          }}
                          className="flex items-center gap-1 bg-[var(--customized-color-five)] border-none text-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] hover:text-white dark:bg-black dark:text-white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)]"
                        >
                          <SquarePen className="w-3 h-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(prof.id)
                          }}
                          className="flex items-center gap-1 bg-red-50 border-none text-red-500 hover:bg-red-500 hover:text-red-50 dark:bg-black dark:text-white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-red-500"
                        >
                          <Trash className="w-3 h-3" />
                          Delete
                        </Button>
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
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, professors.length)} of {professors.length} professors
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
      <EditProfessorModal
        professor={editingProfessor}
        open={showEditModal}
        onOpenChange={setShowEditModal}
        onSave={handleSave}
      />
    </>
  );
}
