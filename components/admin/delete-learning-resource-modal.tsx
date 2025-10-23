"use client"

import React, { useState } from 'react'
import { Button } from "@/components/ui/button"
import { AlertTriangle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LearningResource } from "@/types/learning-resources"

interface DeleteLearningResourceModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: (resourceId: string) => void
  resource: LearningResource
}

export function DeleteLearningResourceModal({ isOpen, onClose, onDelete, resource }: DeleteLearningResourceModalProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)

    try {
      onDelete(resource.id)
    } catch (error) {
      console.error('Error deleting learning resource:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleClose = () => {
    if (!isDeleting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Learning Resource
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this learning resource? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-white mb-2">
              Resource Details
            </h4>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <div><strong>Title:</strong> {resource.title}</div>
              <div><strong>Type:</strong> {resource.type}</div>
              <div><strong>Source:</strong> {resource.source}</div>
              {resource.author && (
                <div><strong>Author:</strong> {resource.author}</div>
              )}
            </div>
          </div>

          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="text-sm text-red-700 dark:text-red-400">
                <strong>Warning:</strong> Deleting this resource will permanently remove it from your library. 
                All associated data including likes, dislikes, and engagement metrics will be lost.
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose} 
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            type="button" 
            variant="destructive" 
            onClick={handleDelete}
            disabled={isDeleting}
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? 'Deleting...' : 'Delete Resource'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
