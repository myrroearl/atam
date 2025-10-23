"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
      const response = await fetch(
        `/api/admin/announcements?notification_id=${announcement.notification_id}`,
        {
          method: "DELETE",
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to delete announcement")
      }

      toast.success(`🗑️ Announcement has been deleted successfully.`)
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
        className="sm:max-w-[425px]"
        onEscapeKeyDown={(e) => isDeleting && e.preventDefault()}
        onInteractOutside={(e) => isDeleting && e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-black dark:text-white font-bold">
            Delete Announcement
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this announcement?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert className="border-none p-0">
            <AlertDescription className="text-orange-800 dark:text-orange-400 font-semibold">
              This action cannot be undone. The announcement will be permanently deleted:
            </AlertDescription>
          </Alert>

          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-black dark:text-gray-400">Receiver:</span>
              <span className="text-gray-500 dark:text-white">{announcement.receiver}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-gray-400">Type:</span>
              <span className="text-gray-500 dark:text-white capitalize">{announcement.type || 'general'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-gray-400">Status:</span>
              <span className="text-gray-500 dark:text-white capitalize">{announcement.status || 'unread'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-black dark:text-gray-400">Date Posted:</span>
              <span className="text-gray-500 dark:text-white">
                {new Date(announcement.created_at).toLocaleDateString()}
              </span>
            </div>
            <div className="pt-2">
              <span className="text-black dark:text-gray-400 block mb-1">Message:</span>
              <p className="text-gray-500 dark:text-white text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                {announcement.message.length > 100
                  ? `${announcement.message.substring(0, 100)}...`
                  : announcement.message}
              </p>
            </div>
          </div>

          <Alert className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/20">
            <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
            <AlertDescription className="text-yellow-800 dark:text-yellow-400">
              <strong>Warning:</strong> This announcement will be permanently deleted and cannot be
              recovered.
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter className="w-full">
          <div className="flex w-full justify-between gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isDeleting}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
            >
              No, keep it.
            </Button>
            <Button
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-500 text-white border-none w-[50%]"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Yes, Delete!"
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

