"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Announcement } from "@/types/announcement"

interface User {
  account_id: number
  email: string
  role: string
}

interface EditAnnouncementModalProps {
  announcement: Announcement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: () => void
}

export function EditAnnouncementModal({
  announcement,
  open,
  onOpenChange,
  onUpdate,
}: EditAnnouncementModalProps) {
  const [formData, setFormData] = useState({
    account_id: "",
    message: "",
    type: "general",
    status: "unread",
    send_to: "specific", // "specific", "all_students", "all_professors", "all_users"
  })
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load announcement data when modal opens
  useEffect(() => {
    if (open && announcement) {
      setFormData({
        account_id: announcement.account_id.toString(),
        message: announcement.message || "",
        type: announcement.type || "general",
        status: announcement.status || "unread",
        send_to: "specific", // Edit mode only supports specific user editing
      })
      fetchUsers()
      setErrors({})
    }
  }, [open, announcement])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/admin/announcements/users")
      const data = await response.json()
      if (response.ok) {
        setUsers(data.users || [])
      } else {
        toast.error("Failed to load users")
      }
    } catch (error) {
      console.error("Error fetching users:", error)
      toast.error("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (formData.send_to === "specific" && !formData.account_id) {
      newErrors.account_id = "Please select a receiver"
    }
    if (!formData.message.trim()) {
      newErrors.message = "Message is required"
    }
    if (!formData.type) {
      newErrors.type = "Please select a type"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!announcement) return

    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          notification_id: announcement.notification_id,
          ...formData,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update announcement")
      }

      toast.success("✅ Announcement updated successfully!")
      onUpdate()
      onOpenChange(false)
    } catch (error) {
      console.error("Error updating announcement:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to update announcement"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  if (!announcement) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onEscapeKeyDown={(e) => isSubmitting && e.preventDefault()}
        onInteractOutside={(e) => isSubmitting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-black dark:text-white font-bold">Edit Announcement</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info about editing specific notification */}
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div className="text-sm text-yellow-800 dark:text-yellow-200">
                <p className="font-medium">Editing specific notification</p>
                <p className="text-xs mt-1">
                  You can only edit individual notifications. To send to multiple users, create a new announcement.
                </p>
              </div>
            </div>
          </div>

          {/* Receiver Selection */}
          <div className="space-y-2">
            <Label htmlFor="receiver" className="text-black dark:text-white">
              Receiver <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.account_id}
              onValueChange={(value) => setFormData({ ...formData, account_id: value })}
              disabled={loading || isSubmitting}
            >
              <SelectTrigger id="receiver" className={errors.account_id ? "border-red-500" : ""}>
                <SelectValue placeholder={loading ? "Loading users..." : "Select receiver"} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                {users.map((user) => (
                  <SelectItem key={user.account_id} value={user.account_id.toString()}>
                    {user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && <p className="text-red-500 text-sm">{errors.account_id}</p>}
          </div>

          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-black dark:text-white">
              Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="type" className={errors.type ? "border-red-500" : ""}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="reminder">Reminder</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-black dark:text-white">
              Status
            </Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData({ ...formData, status: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-black dark:text-white">
              Message <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="message"
              placeholder="Enter announcement message..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className={`min-h-[120px] ${errors.message ? "border-red-500" : ""}`}
              disabled={isSubmitting}
            />
            {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)]"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Updating...
              </>
            ) : (
              "Update Announcement"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

