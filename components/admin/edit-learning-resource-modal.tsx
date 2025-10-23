"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { X, Plus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { LearningResource, UpdateLearningResourceRequest, LEARNING_RESOURCE_TYPES, LEARNING_RESOURCE_SOURCES } from "@/types/learning-resources"

interface EditLearningResourceModalProps {
  isOpen: boolean
  onClose: () => void
  onEdit: (resource: LearningResource) => void
  resource: LearningResource
}

export function EditLearningResourceModal({ isOpen, onClose, onEdit, resource }: EditLearningResourceModalProps) {
  const [formData, setFormData] = useState<UpdateLearningResourceRequest>({
    title: resource.title,
    description: resource.description || '',
    type: resource.type,
    source: resource.source,
    url: resource.url,
    author: resource.author || '',
    topics: resource.topics,
    tags: resource.tags,
    is_active: resource.is_active
  })
  const [newTopic, setNewTopic] = useState('')
  const [newTag, setNewTag] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Update form data when resource changes
  useEffect(() => {
    setFormData({
      title: resource.title,
      description: resource.description || '',
      type: resource.type,
      source: resource.source,
      url: resource.url,
      author: resource.author || '',
      topics: resource.topics,
      tags: resource.tags,
      is_active: resource.is_active
    })
  }, [resource])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Update resource with new data
      const updatedResource: LearningResource = {
        ...resource,
        ...formData,
        updated_at: new Date().toISOString()
      }

      onEdit(updatedResource)
    } catch (error) {
      console.error('Error updating learning resource:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const addTopic = () => {
    if (newTopic.trim() && !formData.topics?.includes(newTopic.trim())) {
      setFormData(prev => ({
        ...prev,
        topics: [...(prev.topics || []), newTopic.trim()]
      }))
      setNewTopic('')
    }
  }

  const removeTopic = (topicToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      topics: (prev.topics || []).filter(topic => topic !== topicToRemove)
    }))
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(tag => tag !== tagToRemove)
    }))
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Learning Resource</DialogTitle>
          <DialogDescription>
            Update the learning resource information.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter resource title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="author">Author</Label>
              <Input
                id="author"
                value={formData.author}
                onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Enter author name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter resource description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as any }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_RESOURCE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="source">Source *</Label>
              <Select value={formData.source} onValueChange={(value) => setFormData(prev => ({ ...prev, source: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  {LEARNING_RESOURCE_SOURCES.map(source => (
                    <SelectItem key={source.value} value={source.value}>
                      {source.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL *</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com/resource"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Topics</Label>
            <div className="flex gap-2">
              <Input
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Add a topic"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTopic())}
              />
              <Button type="button" onClick={addTopic} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.topics || []).map((topic, index) => (
                <Badge key={index} variant="secondary" className="flex items-center gap-1">
                  {topic}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeTopic(topic)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tags</Label>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {(formData.tags || []).map((tag, index) => (
                <Badge key={index} variant="outline" className="flex items-center gap-1">
                  {tag}
                  <X 
                    className="h-3 w-3 cursor-pointer hover:text-red-500" 
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
            />
            <Label htmlFor="is_active">Active</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Update Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
