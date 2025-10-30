"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, RefreshCw, Bell, Eye, Trash, MoreVertical } from "lucide-react"
import { AnnouncementsPageSkeleton } from "@/components/admin/page-skeletons"
import { AddAnnouncementModal } from "@/components/admin/add-announcement-modal"
import { EditAnnouncementModal } from "@/components/admin/edit-announcement-modal"
import { DeleteAnnouncementModal } from "@/components/admin/delete-announcement-modal"
import { format } from "date-fns"
import { toast } from "sonner"
import { Announcement } from "@/types/announcement"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [hasInitialLoad, setHasInitialLoad] = useState(false)

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10)

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

  // Fetch announcements
  const fetchAnnouncements = useCallback(async (showLoading = true, forceRefresh = false) => {
    try {
      // Check if we have cached data and don't need to refresh
      if (!forceRefresh && typeof window !== 'undefined') {
        const cachedData = sessionStorage.getItem('announcements-cache')
        const cacheTimestamp = sessionStorage.getItem('announcements-cache-timestamp')
        
        if (cachedData && cacheTimestamp) {
          const now = Date.now()
          const cacheAge = now - parseInt(cacheTimestamp)
          // Use cached data if it's less than 5 minutes old
          if (cacheAge < 5 * 60 * 1000) {
            setAnnouncements(JSON.parse(cachedData))
            setHasInitialLoad(true)
            return
          }
        }
      }

      if (showLoading) {
        setLoading(true)
      }

      const response = await fetch("/api/admin/announcements")

      if (!response.ok) {
        throw new Error("Failed to fetch announcements")
      }

      const data = await response.json()
      const announcementsData = data.notifications || []
      
      setAnnouncements(announcementsData)
      setHasInitialLoad(true)

      // Cache the data
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('announcements-cache', JSON.stringify(announcementsData))
        sessionStorage.setItem('announcements-cache-timestamp', Date.now().toString())
      }
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial load - only show loading on first visit
  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "admin") {
      // Only show loading if this is the first time loading data
      fetchAnnouncements(!hasInitialLoad)
    }
  }, [status, session, fetchAnnouncements, hasInitialLoad])

  // Cleanup cache on unmount
  useEffect(() => {
    return () => {
      // Clear cache when component unmounts to ensure fresh data on next visit
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('announcements-cache')
        sessionStorage.removeItem('announcements-cache-timestamp')
      }
    }
  }, [])

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAnnouncements(true, true) // Force refresh and show loading
  }

  // Filter announcements
  const filteredAnnouncements = announcements.filter((announcement) => {
    const matchesSearch =
      searchTerm === "" ||
      (announcement.message && announcement.message.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (announcement.receiver && announcement.receiver.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesType = typeFilter === "all" || (announcement.type && announcement.type === typeFilter)
    const matchesStatus = statusFilter === "all" || (announcement.status && announcement.status === statusFilter)
    const matchesRole = roleFilter === "all" || (announcement.receiver_role && announcement.receiver_role === roleFilter)

    return matchesSearch && matchesType && matchesStatus && matchesRole
  })

  // Pagination calculations
  const totalPages = Math.ceil(filteredAnnouncements.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedAnnouncements = filteredAnnouncements.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, typeFilter, statusFilter, roleFilter])

  // Clear filters
  const handleClearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setStatusFilter("all")
    setRoleFilter("all")
  }

  // Edit handler
  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setEditModalOpen(true)
  }

  // Delete handler
  const handleDelete = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setDeleteModalOpen(true)
  }

  // Get badge color based on type
  const getTypeBadgeColor = (type: string | null) => {
    if (!type) {
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
    
    switch (type.toLowerCase()) {
      case "urgent":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
      case "announcement":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
      case "reminder":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      case "event":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
      default:
        return "bg-emerald-100 text-emerald-800 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  // Get badge color based on status
  const getStatusBadgeColor = (status: string | null) => {
    if (!status) {
      return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
    }
    
    return status === "read"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
  }

  if (loading && !isRefreshing) {
    return <AnnouncementsPageSkeleton />
  }

  return (
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Notification Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400">
            Manage and send notifications to all users
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
            className="border-[var(--customized-color-one)] text-[var(--customized-color-one)] hover:bg-[var(--customized-color-one)] hover:text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <AddAnnouncementModal onAdd={() => fetchAnnouncements(false, true)} />
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none bg-transparent shadow-none">
        <CardContent className="p-0 bg-transparent">
          <div className="flex gap-2 w-full">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative min-w-[700px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by message or receiver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="min-w-[100px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Types</SelectItem>
                <SelectItem value="general" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">General</SelectItem>
                <SelectItem value="urgent" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Urgent</SelectItem>
                <SelectItem value="announcement" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Announcement</SelectItem>
                <SelectItem value="reminder" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Reminder</SelectItem>
                <SelectItem value="event" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Event</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="min-w-[100px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Status</SelectItem>
                <SelectItem value="unread" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Unread</SelectItem>
                <SelectItem value="read" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Read</SelectItem>
              </SelectContent>
            </Select>

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
          </div>

          {/* Clear Filters */}
          {/* {(searchTerm || typeFilter !== "all" || statusFilter !== "all" || roleFilter !== "all") && (
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Clear all filters
              </Button>
            </div>
          )} */}
        </CardContent>
      </Card>

      {/* Stats */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Announcements</p>
                <p className="text-2xl font-bold text-black dark:text-white">{announcements.length}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {announcements.filter((a) => !a.status || a.status === "unread").length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Read</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {announcements.filter((a) => a.status === "read").length}
                </p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Filtered Results</p>
                <p className="text-2xl font-bold text-black dark:text-white">{filteredAnnouncements.length}</p>
              </div>
              <Search className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Announcements Table */}
      <Card className="border-none shadow-none">
        <CardContent className="p-0">
          <div className="overflow-x-auto border-none overflow-hidden rounded-t-lg">
            <table className="w-full rounded-lg">
              <thead className="bg-[var(--customized-color-four)] rounded-lg dark:bg-[var(--darkmode-color-two)] w-full transition-colors">
                <tr>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Receiver
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Role
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Message
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Type
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                    Date Posted
                  </th>
                  <th className="text-left px-3 py-3 font-semibold text-black dark:text-gray-400 tracking-wider">
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {paginatedAnnouncements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Bell className="w-12 h-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-gray-500 dark:text-gray-400">
                        {searchTerm || typeFilter !== "all" || statusFilter !== "all" || roleFilter !== "all"
                          ? "No announcements match your filters"
                          : "No announcements yet. Create your first announcement!"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  paginatedAnnouncements.map((announcement) => (
                    <tr
                      key={announcement.notification_id}
                      className="border-b border-[var(--customized-color-five)] bg-white dark:bg-black hover:bg-[var(--customized-color-five)] dark:hover:bg-[var(--darkmode-color-two)] dark:border-[var(--darkmode-color-two)]"
                    >
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {announcement.receiver}
                          {announcement.receiver_count && announcement.receiver_count > 1 && (
                            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                              ({announcement.receiver_count} recipients)
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <Badge variant="outline" className="capitalize border border-gray-200 dark:border-gray-700">
                          {announcement.receiver_role}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <div className="text-sm text-gray-900 dark:text-white line-clamp-2 w-96">
                          {announcement.message}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <Badge className={`capitalize ${getTypeBadgeColor(announcement.type)}`}>
                          {announcement.type || 'general'}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <Badge className={`capitalize ${getStatusBadgeColor(announcement.status)}`}>
                          {announcement.status || 'unread'}
                        </Badge>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        {format(new Date(announcement.created_at), "MMM dd, yyyy")}
                        <div className="text-xs text-gray-400">
                          {format(new Date(announcement.created_at), "h:mm a")}
                        </div>
                      </td>
                      <td className="px-2 py-2 text-sm text-black dark:text-white">
                        <div className="flex items-center gap-2 justify-end">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-600 hover:!text-[var(--customized-color-one)] hover:bg-[var(--customized-color-four)] dark:text-gray-300 dark:hover:text-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-four)] transition-colors"
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(announcement) }}
                              >
                                <MoreVertical className="h-5 w-5" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-24 bg-white dark:bg-[var(--darkmode-color-five)] border-none dark:border-none transition-colors" onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}>
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleEdit(announcement)}} className="flex items-center gap-2 focus:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] cursor-pointer">
                                <Edit className="h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); handleDelete(announcement) }} 
                                className="flex items-center gap-2 text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
                              >
                                <Trash className="h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                          {/* <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(announcement)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(announcement)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button> */}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAnnouncements.length > 0 && (
            <div className="flex items-center justify-between p-2 bg-white dark:bg-black">
              <p className="text-xs text-gray-700 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredAnnouncements.length)} of {filteredAnnouncements.length} announcements
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
        </CardContent>
      </Card>

      {/* Modals */}
      <EditAnnouncementModal
        announcement={selectedAnnouncement}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdate={() => fetchAnnouncements(false, true)}
      />

      <DeleteAnnouncementModal
        announcement={selectedAnnouncement}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onDelete={() => fetchAnnouncements(false, true)}
      />
    </div>
  )
}