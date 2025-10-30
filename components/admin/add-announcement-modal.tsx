"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface User {
  account_id: number
  email: string
  role: string
}

interface AddAnnouncementModalProps {
  onAdd: () => void
}

export function AddAnnouncementModal({ onAdd }: AddAnnouncementModalProps) {
  const [open, setOpen] = useState(false)
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
  const [isFormValid, setIsFormValid] = useState(false)

  // Validate form whenever formData changes
  useEffect(() => {
    const isValid = formData.message.trim() !== "" && 
                   formData.type !== "" &&
                   (formData.send_to === "specific" ? formData.account_id !== "" : true)
    setIsFormValid(isValid)
  }, [formData])

  // Fetch users when modal opens
  useEffect(() => {
    if (open) {
      fetchUsers()
      setErrors({})
    } else {
      // Reset form when modal closes
      setFormData({
        account_id: "",
        message: "",
        type: "general",
        status: "unread",
        send_to: "specific",
      })
    }
  }, [open])

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
    if (!validateForm()) {
      toast.error("Please fill in all required fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/admin/announcements", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to create announcement")
      }

      const successMessage = formData.send_to === "specific" 
        ? "✅ Announcement created successfully!"
        : `✅ Announcement sent to all ${formData.send_to.replace('all_', '')}!`
      
      toast.success(successMessage)
      onAdd()
      setOpen(false)
    } catch (error) {
      console.error("Error creating announcement:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to create announcement"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white">
          <Plus className="w-4 h-4" />
          New Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto dark:bg-black border-none transition-colors duration-300" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">Create New Announcement</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-600">
            Create and send announcements to users in the system.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Send To Selection */}
          <div className="space-y-2">
            <Label htmlFor="send_to" className="text-black dark:text-white">
              Send To <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.send_to}
              onValueChange={(value) => setFormData({ ...formData, send_to: value, account_id: "" })}
            >
              <SelectTrigger id="send_to" className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
                <SelectValue placeholder="Select recipient type" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                <SelectItem value="specific" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Specific User</SelectItem>
                <SelectItem value="all_students" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">All Students</SelectItem>
                <SelectItem value="all_professors" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">All Professors</SelectItem>
                <SelectItem value="all_users" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">All Users (Students + Professors)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Receiver Selection - Only show when specific user is selected */}
          {formData.send_to === "specific" && (
            <div className="space-y-2">
              <Label htmlFor="receiver" className="text-black dark:text-white">
                Receiver <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) => setFormData({ ...formData, account_id: value })}
                disabled={loading}
              >
                <SelectTrigger id="receiver" className={errors.account_id ? "border-red-500" : "border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}>
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
              {errors.account_id && <p className="text-red-500 text-sm">{errors.account_id}</p>}
            </div>
          )}

          {/* Bulk sending info */}
          {formData.send_to !== "specific" && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">
                    {formData.send_to === "all_students" && "Sending to all students"}
                    {formData.send_to === "all_professors" && "Sending to all professors"}
                    {formData.send_to === "all_users" && "Sending to all users (students and professors)"}
                  </p>
                  <p className="text-xs mt-1">
                    This will create individual notifications for each user in the selected group.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Type Selection */}
          <div className="space-y-2">
              <Label htmlFor="type" className="text-black dark:text-white">
                Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger id="type" className={errors.type ? "border-red-500" : "border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}>
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
              {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
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
              className={`min-h-[120px] ${errors.message ? "border-red-500" : "placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"}`}
            />
            {errors.message && <p className="text-red-500 text-sm">{errors.message}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
            className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || isSubmitting}
            className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating...
              </>
            ) : (
              "Add Announcement"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

