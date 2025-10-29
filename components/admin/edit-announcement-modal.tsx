"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Loader2, SquarePen } from "lucide-react"
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
    send_to: "keep_same", // "keep_same", "specific", "all_students", "all_professors", "all_users"
  })
  const [originalSendTo, setOriginalSendTo] = useState<string>("keep_same")
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [originalData, setOriginalData] = useState<any>(null)

  // Load announcement data when modal opens
  useEffect(() => {
    if (open && announcement) {
      // Determine if this is a bulk notification based on receiver field
      let sendToValue = "specific"
      if (announcement.receiver === "All Users") {
        sendToValue = "all_users"
      } else if (announcement.receiver === "All Students") {
        sendToValue = "all_students"
      } else if (announcement.receiver === "All Professors") {
        sendToValue = "all_professors"
      } else if (announcement.receiver_count && announcement.receiver_count > 1) {
        sendToValue = "keep_same" // Bulk but unknown type
      }

      const initialData = {
        account_id: announcement.account_id.toString(),
        message: announcement.message || "",
        type: announcement.type || "general",
        status: announcement.status || "unread",
        send_to: sendToValue,
      }
      setFormData(initialData)
      setOriginalData(initialData)
      setOriginalSendTo(sendToValue)
      setHasChanges(false)
      fetchUsers()
      setErrors({})
    }
  }, [open, announcement])

  // Check for changes whenever formData changes
  useEffect(() => {
    if (originalData) {
      const changed = (formData.send_to === "specific" && formData.account_id !== originalData.account_id) ||
                     formData.message !== originalData.message ||
                     formData.type !== originalData.type ||
                     formData.status !== originalData.status
      setHasChanges(changed)
    }
  }, [formData, originalData])

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

  // Check if receiver is changing
  const isReceiverChanging = () => {
    if (formData.send_to === "keep_same") {
      return false // Not changing
    }
    return formData.send_to !== originalSendTo
  }

  const handleSubmit = async () => {
    if (!announcement) return

    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const requestBody: any = {
        notification_id: announcement.notification_id,
        account_id: formData.account_id,
        message: formData.message,
        type: formData.type,
        status: formData.status,
      }

      // Only include send_to if receiver is being changed
      if (isReceiverChanging() && formData.send_to !== "keep_same") {
        requestBody.send_to = formData.send_to
      }

      const response = await fetch("/api/admin/announcements", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to update announcement")
      }

      if (result.updated && result.count) {
        toast.success(`✅ Bulk notification updated successfully for ${result.count} recipients!`)
      } else {
        toast.success("✅ Announcement updated successfully!")
      }

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
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto dark:bg-black border-none"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white flex items-center gap-2">
            <SquarePen className="w-5 h-5" />
            Edit Announcement
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Update the announcement information below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Info about editing notification */}
          {announcement?.receiver_count && announcement.receiver_count > 1 && (
            <div className="p-3 border rounded-lg bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 rounded-full mt-2 bg-blue-500"></div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">Editing bulk notification ({announcement.receiver_count} recipients)</p>
                  <p className="text-xs mt-1">
                    {formData.send_to === "keep_same" 
                      ? "Changing the recipient group will recreate the notification for new recipients."
                      : "This will update all notifications in this group if you keep the same recipient group."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Change Receiver Selection */}
          <div className="space-y-2">
            <Label htmlFor="send_to" className="text-black dark:text-white">
              Recipient Group
            </Label>
            <Select
              value={formData.send_to}
              onValueChange={(value) => setFormData({ ...formData, send_to: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger 
                id="send_to" 
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              >
                <SelectValue placeholder="Select recipient group" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                <SelectItem value="keep_same" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Keep Same Recipients</SelectItem>
                <SelectItem value="specific" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Specific User</SelectItem>
                <SelectItem value="all_students" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">All Students</SelectItem>
                <SelectItem value="all_professors" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">All Professors</SelectItem>
                <SelectItem value="all_users" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">All Users</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Receiver Selection - Only shown for specific notifications */}
          {formData.send_to === "specific" && (
            <div className="space-y-2">
              <Label htmlFor="receiver" className="text-black dark:text-white">
                Receiver
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                disabled={loading || isSubmitting}
              >
              <SelectTrigger 
                id="receiver" 
                className={`placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)] ${errors.account_id ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder={loading ? "Loading users..." : "Select receiver"} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px] bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                {users.map((user) => (
                  <SelectItem key={user.account_id} value={user.account_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">
                    {user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.account_id && <p className="text-sm text-red-500">{errors.account_id}</p>}
            </div>
          )}

          {/* Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-black dark:text-white">
              Type
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) => setFormData({ ...formData, type: value })}
              disabled={isSubmitting}
            >
              <SelectTrigger 
                id="type" 
                className={`placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)] ${errors.type ? "border-red-500" : ""}`}
              >
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                <SelectItem value="general" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">General</SelectItem>
                <SelectItem value="urgent" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Urgent</SelectItem>
                <SelectItem value="announcement" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Announcement</SelectItem>
                <SelectItem value="reminder" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Reminder</SelectItem>
                <SelectItem value="event" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Event</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type}</p>}
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message" className="text-black dark:text-white">
              Message
            </Label>
            <Textarea
              id="message"
              placeholder="Enter announcement message..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className={`min-h-[120px] placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)] ${errors.message ? "border-red-500" : ""}`}
              disabled={isSubmitting}
            />
            {errors.message && <p className="text-sm text-red-500">{errors.message}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!hasChanges || isSubmitting}
            className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Announcement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

