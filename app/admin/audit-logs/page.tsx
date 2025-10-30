"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, Download, RefreshCw, Calendar, User, Activity } from "lucide-react"
import { AuditLogsPageSkeleton } from "@/components/admin/page-skeletons"
import { format } from "date-fns"

interface ActivityLog {
  log_id: number
  account_id: number
  user_name: string
  user_role: string
  action: string
  description: string | null
  created_at: string
  status: string
  email: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function AuditLogsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })
  
  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState("all")
  const [actionFilter, setActionFilter] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Session check
  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/")
      return
    }

    if (session.user.role !== "admin") {
      router.push("/")
      return
    }
  }, [session, status, router])

  // Fetch logs
  const fetchLogs = useCallback(async (page: number = 1) => {
    try {
      setLoading(true)
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
      })

      if (roleFilter && roleFilter !== "all") {
        params.append("role", roleFilter)
      }
      if (actionFilter) {
        params.append("action", actionFilter)
      }
      if (startDate) {
        params.append("startDate", startDate)
      }
      if (endDate) {
        params.append("endDate", endDate)
      }

      const response = await fetch(`/api/admin/activity-logs?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error("Failed to fetch activity logs")
      }

      const data = await response.json()
      
      // Log exact timestamp data received from API
      console.log('\n🔍 ═══════════════════════════════════════════════════════════');
      console.log('🔍 FRONTEND: Received audit log data from API');
      console.log('🔍 ═══════════════════════════════════════════════════════════');
      
      if (data.logs && data.logs.length > 0) {
        data.logs.forEach((log: any, index: number) => {
          console.log(`\n📝 Log #${index + 1}: ${log.action}`);
          console.log(`   🆔 Log ID: ${log.log_id}`);
          console.log(`   👤 User: ${log.user_name} (${log.email})`);
          console.log(`   🕐 created_at: ${log.created_at || 'Not set'}`);
        });
        console.log('\n🔍 ═══════════════════════════════════════════════════════════');
        console.log(`🔍 Total logs received: ${data.logs.length}`);
        console.log('🔍 ═══════════════════════════════════════════════════════════\n');
      }
      
      setLogs(data.logs || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error("Error fetching logs:", error)
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [pagination.limit, roleFilter, actionFilter, startDate, endDate])

  // Initial load and filter changes
  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "admin") {
      fetchLogs(1)
    }
  }, [status, session, roleFilter, actionFilter, startDate, endDate])

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchLogs(pagination.page)
  }

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setRoleFilter("all")
    setActionFilter("")
    setStartDate("")
    setEndDate("")
  }

  // Export to CSV
  const handleExport = () => {
    const headers = ["Timestamp", "User Name", "Role", "Action", "Description"]
    const rows = filteredLogs.map(log => [
      format(new Date(log.created_at), "PPpp"),
      log.user_name,
      log.user_role,
      log.action,
      log.description || ""
    ])

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `activity-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  // Client-side search filter
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === "" || 
      log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.description && log.description.toLowerCase().includes(searchTerm.toLowerCase()))
    
    return matchesSearch
  })

  // Get role badge color
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
      case "professor":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
      case "student":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
    }
  }

  // Format timestamp similar to formatSchedule in classes
  const formatTimestamp = (timestamp: string) => {
    if (!timestamp) {
      return {
        date: 'No date',
        time: 'No time',
        raw: 'No timestamp'
      };
    }
    
    // Debug logging for timestamp display
    console.log('🔍 AUDIT LOGS: Displaying timestamp data:', {
      timestamp,
      type: typeof timestamp
    });

    // Extract time from ISO format (2025-10-01T17:00:00+00:00) and convert to 12-hour format
    const time = timestamp.split('T')[1]?.split('+')[0]?.substring(0, 5) || '';
    const date = timestamp.split('T')[0] || '';
    
    // Convert to 12-hour format
    const formatTo12Hour = (time24: string) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    const time12 = formatTo12Hour(time);
    
    // Format date
    const [year, month, day] = date.split('-');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const formattedDate = `${monthNames[parseInt(month) - 1]} ${day}, ${year}`;
    
    return {
      date: formattedDate,
      time: time12,
      raw: timestamp
    };
  }

  if (status === "loading" || loading) {
    return <AuditLogsPageSkeleton />
  }

  return (
    <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] transition-colors">
      <div className="p-5 w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-black dark:text-white">Activity Logs</h1>
            <p className="text-lg text-gray-700 dark:text-gray-400">
              Monitor system activities and security events
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-transparent border-0 shadow-none">
          <div className="flex items-center w-full gap-2">
            {/* Search */}
            <div className="relative min-w-[750px] text-[11px] !border-none">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3" />
              <Input
                type="text"
                placeholder="Search by user, action, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
              />
            </div>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="min-w-[100px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Roles</SelectItem>
                <SelectItem value="admin" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Admin</SelectItem>
                <SelectItem value="professor" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Professor</SelectItem>
                <SelectItem value="student" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Student</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center">
              {/* Start Date */}
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                placeholder="Start date"
                className="text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black col-span-1"
              />
              <span className="text-black text-[11px] text-center mx-2">to</span>
              {/* End Date */}
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                placeholder="End date"
                className="text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
              />
            </div>
          </div>

          {/* Action Filter and Clear Filters */}
          {/* <div className="flex items-center gap-4 mt-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Filter by action (e.g., 'Created', 'Updated', 'Deleted')..."
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full"
              />
            </div>
            <Button
              variant="ghost"
              onClick={handleClearFilters}
              className="whitespace-nowrap"
            >
              Clear Filters
            </Button>
          </div> */}

          {/* Stats */}
          {/* <div className="flex items-center gap-4 mt-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              <span>Total Logs: {pagination.total}</span>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Showing: {filteredLogs.length}</span>
            </div>
          </div> */}
        </Card>

        {/* Activity Logs Table */}
        <Card className="bg-white dark:bg-black border-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--customized-color-four)] rounded-lg dark:bg-gray-800 w-full">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Timestamp
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider ">
                    User
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Action
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p className="text-lg font-medium">No activity logs found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or check back later</p>
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr 
                      key={log.log_id}
                      className="border-b border-[var(--customized-color-five)] bg-white dark:bg-black hover:bg-[var(--customized-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)]"
                    >
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <div className="flex items-center gap-2 text-sm text-gray-900 dark:text-gray-100">
                          <div>
                            {(() => {
                              const formatted = formatTimestamp(log.created_at);
                              return (
                                <>
                                  <div>{formatted.date}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {formatted.time}
                                  </div>
                                  <div className="text-[10px] text-gray-400 dark:text-gray-600 mt-1 font-mono">
                                    {formatted.raw}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {log.user_name}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {log.email}
                          </span>
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <Badge className={`${getRoleBadgeColor(log.user_role)} capitalize`}>
                          {log.user_role}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {log.description || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-2 bg-white dark:bg-black">
              <p className="text-xs text-gray-700 dark:text-gray-400">
                Showing {(pagination.page - 1) * pagination.limit + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} logs
              </p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-600 dark:text-gray-400">Page {pagination.page} of {pagination.totalPages}</span>
                <Button 
                  className="text-xs border-none" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchLogs(1)} 
                  disabled={pagination.page === 1}
                >
                  First
                </Button>
                <Button 
                  className="text-xs border-none" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchLogs(pagination.page - 1)} 
                  disabled={pagination.page === 1}
                >
                  {"<"}
                </Button>
                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .slice(Math.max(0, pagination.page - 2), pagination.page + 3)
                  .map((page) => (
                    <Button
                      key={page}
                      variant={page === pagination.page ? "default" : "outline"}
                      size="sm"
                      className={page === pagination.page ? "bg-[var(--customized-color-one)] border-none hover:bg-[var(--customized-color-two)]" : "border-none hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)]"}
                      onClick={() => fetchLogs(page)}
                    >
                      {page}
                    </Button>
                  ))}
                <Button 
                  className="text-xs border-none hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)]" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchLogs(pagination.page + 1)} 
                  disabled={pagination.page === pagination.totalPages}
                >
                  {">"}
                </Button>
                <Button 
                  className="text-xs border-none hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)]" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchLogs(pagination.totalPages)} 
                  disabled={pagination.page === pagination.totalPages}
                >
                  Last
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}