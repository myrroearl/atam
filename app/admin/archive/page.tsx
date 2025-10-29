"use client"

import { useState, useEffect, useMemo } from "react"
import { ArchiveTable } from "@/components/admin/archive-table"
import { GenericPageSkeleton } from "@/components/admin/page-skeletons"
import { toast } from "sonner"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, ArrowDownAZ, ArrowDownZA } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function ArchivePage() {
  const [allArchivedData, setAllArchivedData] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [tableFilter, setTableFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")

  const fetchArchivedData = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/archive')
      if (!response.ok) {
        throw new Error('Failed to fetch archived data')
      }
      const data = await response.json()
      setAllArchivedData(data)
    } catch (error) {
      console.error('Error fetching archived data:', error)
      toast.error('Failed to fetch archived data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedData()
  }, [])

  const handleAction = async (type: string, id: string | number, action: 'restore' | 'permanent_delete') => {
    try {
      const response = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id, action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action.replace('_', ' ')} ${type}`)
      }

      toast.success(result.message)
      // Re-fetch all data to update the UI
      fetchArchivedData()
    } catch (error) {
      console.error(`Error performing ${action} on ${type}:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${action.replace('_', ' ')} ${type}`)
    }
  }

  // Combine all archived data into one array
  const allData = useMemo(() => {
    const combined: any[] = []
    Object.keys(allArchivedData).forEach(key => {
      if (Array.isArray(allArchivedData[key])) {
        combined.push(...allArchivedData[key])
      }
    })
    return combined
  }, [allArchivedData])

  // Get all table types for the filter
  const tableTypes = useMemo(() => {
    const types = new Set(allData.map(item => item.record_type))
    return Array.from(types)
  }, [allData])

  if (loading) {
    return <GenericPageSkeleton />
  }

  return (
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Archive</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400 font-light">
            Review and manage archived records. Restore or permanently delete them as needed.
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="p-0 bg-transparent">
          <div className="flex gap-2 w-full">
            {/* Search */}
            <div className="flex-1">
              <div className="relative min-w-[900px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search archived records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* Table Filter */}
            <Select value={tableFilter} onValueChange={setTableFilter}>
              <SelectTrigger className="min-w-[180px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0 capitalize">
                <SelectValue placeholder="Filter by table" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer capitalize">
                  All Tables
                </SelectItem>
                {tableTypes.map(type => (
                  <SelectItem 
                    key={type} 
                    value={type} 
                    className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer capitalize"
                  >
                    {type.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Button */}
            <Button
              variant="ghost"
              className="flex items-center gap-2 border bg-white min-w-[80px] text-[11px] px-3 py-2 dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0 hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)] transition-colors duration-200"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            >
              <span className="font-medium">Sort</span>
              <div className="flex flex-col items-center">
                {sortOrder === "asc" ? (
                  <>
                    <ArrowDownZA className="w-3 h-3 text-[var(--customized-color-one)]" />
                  </>
                ) : (
                  <>
                    <ArrowDownAZ className="w-3 h-3 text-[var(--customized-color-one)]" />
                  </>
                )}
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Unified Archive Table */}
      <ArchiveTable
        data={allData}
        tableFilter={tableFilter}
        searchTerm={searchTerm}
        onAction={handleAction}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        sortOrder={sortOrder}
      />
    </div>
  )
}
