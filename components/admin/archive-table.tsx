"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  subAccessor?: (row: T) => React.ReactNode; // For email/sub-info
}

interface ArchiveTableProps<T> {
  data: T[];
  type: string; // e.g., 'students', 'professors', 'courses'
  onAction: (type: string, id: string | number, action: 'restore' | 'permanent_delete') => void;
  columns: Column<T>[];
}

export function ArchiveTable<T extends { [key: string]: any }>({ data, type, onAction, columns }: ArchiveTableProps<T>) {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<T | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleRestoreClick = (record: T) => {
    setSelectedRecord(record)
    setShowRestoreDialog(true)
  }

  const handlePermanentDeleteClick = (record: T) => {
    setSelectedRecord(record)
    setShowPermanentDeleteDialog(true)
  }

  const confirmRestore = async () => {
    if (selectedRecord) {
      setIsProcessing(true)
      const id = getRecordId(selectedRecord);
      await onAction(type, id, 'restore')
      setIsProcessing(false)
      setShowRestoreDialog(false)
    }
  }

  const confirmPermanentDelete = async () => {
    if (selectedRecord) {
      setIsProcessing(true)
      const id = getRecordId(selectedRecord);
      await onAction(type, id, 'permanent_delete')
      setIsProcessing(false)
      setShowPermanentDeleteDialog(false)
    }
  }

  const getRecordId = (record: T) => {
    // Special handling for students/professors where the actual ID is in the nested object
    if (type === 'students' && record.student_id) return record.student_id;
    if (type === 'professors' && record.prof_id) return record.prof_id;
    if (type === 'courses' && record.course_id) return record.course_id;
    if (type === 'departments' && record.department_id) return record.department_id;
    if (type === 'sections' && record.section_id) return record.section_id;
    if (type === 'subjects' && record.subject_id) return record.subject_id;
    if (type === 'classes' && record.class_id) return record.class_id;
    if (type === 'year_level' && record.year_level_id) return record.year_level_id;
    if (type === 'semester' && record.semester_id) return record.semester_id;
    // Fallback for other types
    return record[`${type.slice(0, -1)}_id`] || record.id;
  }

  return (
    <>
      <div className="bg-white rounded-lg border-none overflow-hidden shadow-sm dark:bg-black">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-[var(--customized-color-four)] dark:bg-gray-800">
              <tr>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400"
                  >
                    {column.header}
                  </th>
                ))}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-black dark:divide-gray-700">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No archived {type} found.
                  </td>
                </tr>
              ) : (
                data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    {columns.map((column, colIndex) => (
                      <td key={colIndex} className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        <div>
                          {column.accessor(row)}
                          {column.subAccessor && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">{column.subAccessor(row)}</p>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreClick(row)}
                          className="text-green-600 border-green-600 hover:bg-green-50 dark:text-green-400 dark:border-green-400 dark:hover:bg-green-900/20"
                        >
                          Restore
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermanentDeleteClick(row)}
                          className="text-red-600 border-red-600 hover:bg-red-50 dark:text-red-400 dark:border-red-400 dark:hover:bg-red-900/20"
                        >
                          Delete Permanently
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Record?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore this {type.slice(0, -1)}? It will be moved back to the active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} disabled={isProcessing} className="bg-green-600 hover:bg-green-700">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Permanent Delete Dialog */}
      <AlertDialog open={showPermanentDeleteDialog} onOpenChange={setShowPermanentDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {type.slice(0, -1)} from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDelete} disabled={isProcessing} className="bg-red-600 hover:bg-red-700">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
