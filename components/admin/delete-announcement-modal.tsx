"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Announcement } from "@/types/announcement"

interface DeleteAnnouncementModalProps {
  announcement: Announcement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
}

export function DeleteAnnouncementModal({
  announcement,
  open,
  onOpenChange,
  onDelete,
}: DeleteAnnouncementModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!announcement) return

    setIsDeleting(true)

    try {
      // Automatically use bulk delete if receiver_count > 1
      const isBulkNotification = announcement.receiver_count && announcement.receiver_count > 1
      const url = isBulkNotification
        ? `/api/admin/announcements?notification_id=${announcement.notification_id}&bulk_delete=true`
        : `/api/admin/announcements?notification_id=${announcement.notification_id}`

      const response = await fetch(url, {
        method: "DELETE",
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete announcement")
      }

      if (result.bulk_deleted) {
        toast.success(`🗑️ Bulk announcement deleted successfully! (${result.deleted_count} notifications removed)`)
      } else {
        toast.success(`🗑️ Announcement deleted successfully.`)
      }
      
      onDelete()
      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting announcement:", error)

      const errorMessage = error instanceof Error ? error.message : "Failed to delete announcement"
      toast.error(errorMessage)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onOpenChange(false)
    }
  }

  if (!announcement) return null

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px] dark:bg-black border-none"
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">
            Delete Announcement
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-600">
            Are you sure you want to delete this announcement?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 p-0 rounded-lg">
            <div className="border-none p-0">
              <p className="text-red-900 dark:text-orange-400 font-semibold text-sm">
                This action will permanently delete {announcement.receiver_count && announcement.receiver_count > 1 
                  ? `all ${announcement.receiver_count} notifications with this message.`
                  : "the announcement."}
              </p>
            </div>

            {/* Announcement info */}
            <div className="space-y-1">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Receiver:</span>
                <span className="font-semibold text-gray-900 dark:text-white">{announcement.receiver}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{announcement.type || 'general'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Status:</span>
                <span className="font-medium text-gray-900 dark:text-white capitalize">{announcement.status || 'unread'}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600 dark:text-gray-400">Date Posted:</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {new Date(announcement.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="w-full">
          <div className="flex w-full justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
            >
              No, keep it
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className={`text-white border-none w-[50%] ${
                announcement.receiver_count && announcement.receiver_count > 1
                  ? 'bg-red-700 hover:bg-red-600' 
                  : 'bg-red-600 hover:bg-red-500'
              }`}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                announcement.receiver_count && announcement.receiver_count > 1
                  ? `Delete All ${announcement.receiver_count}!`
                  : "Yes, Delete it"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

