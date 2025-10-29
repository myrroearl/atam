"use client"

import { useState, useMemo, useEffect } from "react"
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
import { Loader2, ArrowUpDown, ArchiveRestore, Trash2 } from "lucide-react"
import { toast } from "sonner"

interface ArchiveTableProps {
  data: any[];
  tableFilter: string;
  searchTerm: string;
  onAction: (type: string, id: string | number, action: 'restore' | 'permanent_delete') => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  sortOrder?: "asc" | "desc";
}

type SortField = 'record_type' | 'name' | 'id' | 'status' | null
type SortDirection = 'asc' | 'desc' | null

export function ArchiveTable({ data, tableFilter, searchTerm, onAction, currentPage, setCurrentPage, sortOrder = "asc" }: ArchiveTableProps) {
  const [showRestoreDialog, setShowRestoreDialog] = useState(false)
  const [showPermanentDeleteDialog, setShowPermanentDeleteDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [relatedInfo, setRelatedInfo] = useState<Record<string, number> | null>(null)
  const [isLoadingRelated, setIsLoadingRelated] = useState(false)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>(null)
  const pageSize = 10

  // Get display value for record
  const getRecordDisplayName = (record: any) => {
    const type = record.record_type || 'unknown'
    switch (type) {
      case 'students':
        return `${record.last_name || ''}, ${record.first_name || ''} ${record.middle_name || ''}`.trim() || 'N/A'
      case 'professors':
        return `${record.last_name || ''}, ${record.first_name || ''} ${record.middle_name || ''}`.trim() || 'N/A'
      case 'courses':
        return record.course_name || 'N/A'
      case 'departments':
        return record.department_name || 'N/A'
      case 'sections':
        return record.section_name || 'N/A'
      case 'subjects':
        return record.subject_name || 'N/A'
      case 'classes':
        return record.class_name || 'N/A'
      case 'year_level':
        return record.name || 'N/A'
      case 'semester':
        return record.semester_name || 'N/A'
      default:
        return 'N/A'
    }
  }

  // Get record ID
  const getRecordId = (record: any) => {
    const type = record.record_type || 'unknown'
    switch (type) {
      case 'students':
        return record.student_id
      case 'professors':
        return record.prof_id
      case 'courses':
        return record.course_id
      case 'departments':
        return record.department_id
      case 'sections':
        return record.section_id
      case 'subjects':
        return record.subject_id
      case 'classes':
        return record.class_id
      case 'year_level':
        return record.year_level_id
      case 'semester':
        return record.semester_id
      default:
        return record.id
    }
  }

  // Get additional info for record
  const getRecordInfo = (record: any) => {
    const type = record.record_type || 'unknown'
    switch (type) {
      case 'students':
        return `Student No.: ${record.student_id?.toString().padStart(8, '0') || 'N/A'}`
      case 'professors':
        return `Professor No.: ${record.prof_id?.toString().padStart(8, '0') || 'N/A'}`
      case 'courses':
        return `Code: ${record.course_code || 'N/A'}`
      case 'departments':
        return `Dean: ${record.dean_name || 'N/A'}`
      case 'sections':
        return `Course: ${record.courses?.course_name || 'N/A'}`
      case 'subjects':
        return `Code: ${record.subject_code || 'N/A'}`
      case 'classes':
        return `Subject: ${record.subjects?.subject_name || 'N/A'}`
      case 'year_level':
        return `Course: ${record.courses?.course_name || 'N/A'}`
      case 'semester':
        return `Year Level: ${record.year_level?.name || 'N/A'}`
      default:
        return ''
    }
  }

  // Filter and search data
  const filteredData = useMemo(() => {
    return data.filter(record => {
      // Filter by table type
      const matchesTable = tableFilter === 'all' || record.record_type === tableFilter
      
      // Search across all fields
      const matchesSearch = searchTerm === '' || 
        getRecordDisplayName(record).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getRecordInfo(record).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.accounts?.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (record.record_type || '').toLowerCase().includes(searchTerm.toLowerCase())

      return matchesTable && matchesSearch
    })
  }, [data, tableFilter, searchTerm])

  // Sort data
  const sortedData = useMemo(() => {
    // Use name field by default if no sort field is set
    if (!sortField || !sortDirection) {
      return [...filteredData].sort((a, b) => {
        const aValue = getRecordDisplayName(a).toLowerCase()
        const bValue = getRecordDisplayName(b).toLowerCase()
        if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1
        if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1
        return 0
      })
    }

    return [...filteredData].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'record_type':
          aValue = (a.record_type || '').toLowerCase()
          bValue = (b.record_type || '').toLowerCase()
          break
        case 'name':
          aValue = getRecordDisplayName(a).toLowerCase()
          bValue = getRecordDisplayName(b).toLowerCase()
          break
        case 'id':
          aValue = getRecordId(a)
          bValue = getRecordId(b)
          break
        case 'status':
          aValue = a.status || ''
          bValue = b.status || ''
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [filteredData, sortField, sortDirection, sortOrder])

  // Paginate data
  const totalPages = Math.ceil(sortedData.length / pageSize)
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [tableFilter, searchTerm, setCurrentPage])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleRestoreClick = (record: any) => {
    setSelectedRecord(record)
    setShowRestoreDialog(true)
  }

  const handlePermanentDeleteClick = (record: any) => {
    setSelectedRecord(record)
    setShowPermanentDeleteDialog(true)
    // Fetch foreign key related counts to display
    if (record?.record_type) {
      setIsLoadingRelated(true)
      const id = getRecordId(record)
      const type = record.record_type
      fetch(`/api/admin/archive/relationships?type=${encodeURIComponent(type)}&id=${encodeURIComponent(id)}`)
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to load related data')
          return res.json()
        })
        .then((data) => setRelatedInfo(data.related || {}))
        .catch(() => setRelatedInfo(null))
        .finally(() => setIsLoadingRelated(false))
    } else {
      setRelatedInfo(null)
    }
  }

  const confirmRestore = async () => {
    if (selectedRecord) {
      setIsProcessing(true)
      const id = getRecordId(selectedRecord)
      const type = selectedRecord.record_type || 'unknown'
      await onAction(type, id, 'restore')
      setIsProcessing(false)
      setShowRestoreDialog(false)
    }
  }

  const confirmPermanentDelete = async () => {
    if (selectedRecord) {
      setIsProcessing(true)
      const id = getRecordId(selectedRecord)
      const type = selectedRecord.record_type || 'unknown'
      await onAction(type, id, 'permanent_delete')
      setIsProcessing(false)
      setShowPermanentDeleteDialog(false)
    }
  }

  return (
    <>
      <div className="bg-white rounded-lg border-none overflow-hidden shadow-sm dark:bg-black">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-[var(--customized-color-four)] dark:bg-[var(--darkmode-color-two)] transition-colors">
              <tr>
                <th
                  scope="col"
                  className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider"
                >
                  Record Name
                </th>
                <th
                  scope="col"
                  className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider"
                >
                  Table
                </th>
                <th scope="col" className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                  Information
                </th>
                <th
                  scope="col"
                  className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider"
                >
                  Status
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200 dark:bg-black dark:divide-gray-700">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                    No archived records found.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-[var(--customized-color-five)] bg-white dark:bg-black hover:bg-[var(--customized-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)] transition-colors">
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div>
                        {getRecordDisplayName(row)}
                        {row.accounts?.email && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">{row.accounts.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <Badge variant="outline" className="capitalize">
                        {row.record_type?.replace('_', ' ') || 'Unknown'}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {getRecordInfo(row)}
                      </div>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">
                        {row.status === 'inactive' ? 'Archived' : row.status}
                      </Badge>
                    </td>
                    <td className="px-2 py-2 text-sm text-black dark:text-white">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreClick(row)}
                          className="flex items-center gap-2 bg-[var(--customized-color-four)] border-none text-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] hover:text-white dark:bg-[var(--darkmode-color-five)] dark:text-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:hover:text-black"
                          title="Restore Record"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePermanentDeleteClick(row)}
                          className="flex items-center bg-red-100 border-none text-red-500 hover:bg-red-500 hover:text-red-50 dark:bg-[var(--delete-color-one)] dark:text-red-300 dark:hover:bg-red-500 dark:hover:text-black"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
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
        {sortedData.length > 0 && (
          <div className="flex items-center justify-between p-2 bg-white dark:bg-black">
            <p className="text-xs text-gray-700 dark:text-gray-400">
              Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} records
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
        )}
      </div>

      {/* Restore Dialog */}
      <AlertDialog open={showRestoreDialog} onOpenChange={setShowRestoreDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Record?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-500">
              Are you sure you want to restore this record? It will be moved back to the active list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} className="bg-white dark:bg-black border border-[var(--customized-color-five)] text-black dark:text-white hover:bg-[var(--customized-color-five)] dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore} disabled={isProcessing} className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] border-none text-white dark:bg-[var(--darkmode-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black border border-[var(--customized-color-four)]">
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
            <AlertDialogDescription className="text-gray-500">
              This action cannot be undone. This will permanently delete the record from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {selectedRecord && (
            <div className="mt-2 rounded-md border border-gray-200 dark:border-gray-700 p-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-400">Record:</span>
                <span className="font-medium text-gray-900 dark:text-white">{getRecordDisplayName(selectedRecord)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-gray-600 dark:text-gray-400">Table:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{selectedRecord.record_type?.replace('_', ' ')}</span>
              </div>
              {selectedRecord.accounts?.email && (
                <div className="flex justify-between gap-4">
                  <span className="text-gray-600 dark:text-gray-400">Email:</span>
                  <span className="font-medium text-gray-900 dark:text-white">{selectedRecord.accounts.email}</span>
                </div>
              )}
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">{getRecordInfo(selectedRecord)}</div>
              {/* Related (foreign key) info */}
              <div className="mt-3">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Related data that will be affected:</p>
                {isLoadingRelated ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500"><Loader2 className="h-3 w-3 animate-spin" /> Loading…</div>
                ) : relatedInfo && Object.keys(relatedInfo).length > 0 ? (
                  <ul className="list-disc pl-5 text-xs text-gray-700 dark:text-gray-300">
                    {Object.entries(relatedInfo).map(([k, v]) => (
                      <li key={k}>
                        <span className="capitalize">{k.replace(/_/g, ' ')}</span>: {v}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-gray-500">No related records detected.</p>
                )}
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing} className="bg-white dark:bg-black border border-[var(--customized-color-five)] text-black dark:text-white hover:bg-[var(--customized-color-five)] dark:hover:bg-gray-800">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPermanentDelete} disabled={isProcessing} className="bg-red-600 hover:bg-red-700 text-white border-none dark:bg-red-800 dark:hover:bg-red-600 dark:hover:text-white dark:border-none">
              {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
