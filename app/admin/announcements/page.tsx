"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit, Trash2, RefreshCw, Bell, Eye } from "lucide-react"
import { AnnouncementsPageSkeleton } from "@/components/admin/page-skeletons"
import { AddAnnouncementModal } from "@/components/admin/add-announcement-modal"
import { EditAnnouncementModal } from "@/components/admin/edit-announcement-modal"
import { DeleteAnnouncementModal } from "@/components/admin/delete-announcement-modal"
import { format } from "date-fns"
import { toast } from "sonner"
import { Announcement } from "@/types/announcement"

export default function AnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [roleFilter, setRoleFilter] = useState("all")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal states
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

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
  const fetchAnnouncements = useCallback(async () => {
    try {
      setLoading(true)

      const response = await fetch("/api/admin/announcements")

      if (!response.ok) {
        throw new Error("Failed to fetch announcements")
      }

      const data = await response.json()
      setAnnouncements(data.notifications || [])
    } catch (error) {
      console.error("Error fetching announcements:", error)
      toast.error("Failed to load announcements")
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [])

  // Initial load
  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "admin") {
      fetchAnnouncements()
    }
  }, [status, session, fetchAnnouncements])

  // Refresh handler
  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchAnnouncements()
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
        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400"
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
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] transition-colors w-full">
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
          <AddAnnouncementModal onAdd={fetchAnnouncements} />
        </div>
      </div>

      {/* Filters */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by message or receiver..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="professor">Professor</SelectItem>
                <SelectItem value="student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || typeFilter !== "all" || statusFilter !== "all" || roleFilter !== "all") && (
            <div className="mt-4">
              <Button
                variant="ghost"
                onClick={handleClearFilters}
                className="text-sm text-gray-600 dark:text-gray-400"
              >
                Clear all filters
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
      </div>

      {/* Announcements Table */}
      <Card className="border-none shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Receiver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date Posted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                {filteredAnnouncements.length === 0 ? (
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
                  filteredAnnouncements.map((announcement) => (
                    <tr
                      key={announcement.notification_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {announcement.receiver}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant="outline" className="capitalize">
                          {announcement.receiver_role}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 dark:text-white max-w-md truncate">
                          {announcement.message.length > 80
                            ? `${announcement.message.substring(0, 80)}...`
                            : announcement.message}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`capitalize ${getTypeBadgeColor(announcement.type)}`}>
                          {announcement.type || 'general'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={`capitalize ${getStatusBadgeColor(announcement.status)}`}>
                          {announcement.status || 'unread'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {format(new Date(announcement.created_at), "MMM dd, yyyy")}
                        <div className="text-xs text-gray-400">
                          {format(new Date(announcement.created_at), "h:mm a")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex gap-2">
                          <Button
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
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <EditAnnouncementModal
        announcement={selectedAnnouncement}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onUpdate={fetchAnnouncements}
      />

      <DeleteAnnouncementModal
        announcement={selectedAnnouncement}
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        onDelete={fetchAnnouncements}
      />
    </div>
  )
}