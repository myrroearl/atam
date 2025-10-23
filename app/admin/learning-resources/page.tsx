"use client"

import React, { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Download,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  BookMarked,
  RefreshCw,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from "lucide-react"
import { LearningResource, CreateLearningResourceRequest, UpdateLearningResourceRequest, LEARNING_RESOURCE_TYPES, LEARNING_RESOURCE_SOURCES } from "@/types/learning-resources"
// Import modal components
import { AddLearningResourceModal } from "@/components/admin/add-learning-resource-modal"
import { EditLearningResourceModal } from "@/components/admin/edit-learning-resource-modal"
import { DeleteLearningResourceModal } from "@/components/admin/delete-learning-resource-modal"
import { HarvestingProgressModal } from "@/components/admin/harvesting-progress-modal"

// API functions
const fetchLearningResources = async (filters?: {
  search?: string
  type?: string
  source?: string
  isActive?: string
}) => {
  const params = new URLSearchParams()
  if (filters?.search) params.append('search', filters.search)
  if (filters?.type && filters.type !== 'all') params.append('type', filters.type)
  if (filters?.source && filters.source !== 'all') params.append('source', filters.source)
  if (filters?.isActive && filters.isActive !== 'all') params.append('is_active', filters.isActive)

  const response = await fetch(`/api/admin/learning-resources?${params.toString()}`)
  if (!response.ok) {
    throw new Error('Failed to fetch learning resources')
  }
  const result = await response.json()
  return result.data
}

const createLearningResource = async (resource: CreateLearningResourceRequest) => {
  const response = await fetch('/api/admin/learning-resources', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resource),
  })
  if (!response.ok) {
    throw new Error('Failed to create learning resource')
  }
  const result = await response.json()
  return result.data
}

const updateLearningResource = async (id: string, resource: Partial<UpdateLearningResourceRequest>) => {
  const response = await fetch(`/api/admin/learning-resources/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resource),
  })
  if (!response.ok) {
    throw new Error('Failed to update learning resource')
  }
  const result = await response.json()
  return result.data
}

const deleteLearningResource = async (id: string) => {
  const response = await fetch(`/api/admin/learning-resources/${id}`, {
    method: 'DELETE',
  })
  if (!response.ok) {
    throw new Error('Failed to delete learning resource')
  }
}

export default function LearningResourcesPage() {
  const [learningResources, setLearningResources] = useState<LearningResource[]>([])
  const [filteredResources, setFilteredResources] = useState<LearningResource[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [sourceFilter, setSourceFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isHarvestingModalOpen, setIsHarvestingModalOpen] = useState(false)
  const [selectedResource, setSelectedResource] = useState<LearningResource | null>(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Load data from API on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchLearningResources()
        setLearningResources(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load learning resources')
        console.error('Error loading learning resources:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  // Filter resources based on search and filters
  useEffect(() => {
    let filtered = learningResources

    if (searchTerm) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.author?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
        resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter(resource => resource.type === typeFilter)
    }

    if (sourceFilter !== "all") {
      filtered = filtered.filter(resource => resource.source === sourceFilter)
    }

    if (statusFilter !== "all") {
      const isActive = statusFilter === "active"
      filtered = filtered.filter(resource => resource.is_active === isActive)
    }

    setFilteredResources(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [learningResources, searchTerm, typeFilter, sourceFilter, statusFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredResources.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentResources = filteredResources.slice(startIndex, endIndex)

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  const handleAddResource = async (resourceData: CreateLearningResourceRequest) => {
    try {
      const newResource = await createLearningResource(resourceData)
      setLearningResources(prev => [newResource, ...prev])
      setIsAddModalOpen(false)
    } catch (err) {
      console.error('Error adding learning resource:', err)
      setError(err instanceof Error ? err.message : 'Failed to add learning resource')
    }
  }

  const handleEditResource = async (updatedResource: LearningResource) => {
    try {
      const { id, created_at, updated_at, likes, dislikes, ...updateData } = updatedResource
      const result = await updateLearningResource(id, updateData)
      setLearningResources(prev =>
        prev.map(resource =>
          resource.id === updatedResource.id ? result : resource
        )
      )
      setIsEditModalOpen(false)
      setSelectedResource(null)
    } catch (err) {
      console.error('Error updating learning resource:', err)
      setError(err instanceof Error ? err.message : 'Failed to update learning resource')
    }
  }

  const handleDeleteResource = async (resourceId: string) => {
    try {
      await deleteLearningResource(resourceId)
      setLearningResources(prev => prev.filter(resource => resource.id !== resourceId))
      setIsDeleteModalOpen(false)
      setSelectedResource(null)
    } catch (err) {
      console.error('Error deleting learning resource:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete learning resource')
    }
  }

  const handleDataHarvest = () => {
    // Open the harvesting progress modal
    setIsHarvestingModalOpen(true)
  }

  const openEditModal = (resource: LearningResource) => {
    setSelectedResource(resource)
    setIsEditModalOpen(true)
  }

  const openDeleteModal = (resource: LearningResource) => {
    setSelectedResource(resource)
    setIsDeleteModalOpen(true)
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      video: "bg-red-100 text-red-800",
      book: "bg-blue-100 text-blue-800",
      article: "bg-green-100 text-green-800",
      course: "bg-purple-100 text-purple-800",
      document: "bg-orange-100 text-orange-800",
      other: "bg-gray-100 text-gray-800"
    }
    return colors[type] || colors.other
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Learning Resources</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage educational resources including videos, books, articles, and courses
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDataHarvest}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
            title="Generate learning resources using AI based on your classes and grade entries"
          >
            <RefreshCw className="h-4 w-4" />
            AI Data Harvest
          </Button>
          <Button 
            onClick={() => setIsAddModalOpen(true)} 
            disabled={isLoading}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Resource
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search resources..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {LEARNING_RESOURCE_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sourceFilter} onValueChange={setSourceFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                {LEARNING_RESOURCE_SOURCES.map(source => (
                  <SelectItem key={source.value} value={source.value}>
                    {source.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookMarked className="h-5 w-5" />
                Learning Resources ({filteredResources.length})
              </CardTitle>
              <CardDescription>
                Manage your educational content library
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Items per page:</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value))
                setCurrentPage(1)
              }}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-500">Loading learning resources...</span>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Topics</TableHead>
                    {/* <TableHead>Engagement</TableHead> */}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{resource.title}</div>
                        {resource.description && (
                          <div className="text-sm text-gray-500 line-clamp-2">
                            {resource.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeColor(resource.type)}>
                        {resource.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{resource.source}</TableCell>
                    <TableCell>{resource.author || "N/A"}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {resource.topics.slice(0, 2).map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                        {resource.topics.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{resource.topics.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    {/* <TableCell>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="flex items-center gap-1 text-green-600">
                          <ThumbsUp className="h-3 w-3" />
                          {resource.likes}
                        </div>
                        <div className="flex items-center gap-1 text-red-600">
                          <ThumbsDown className="h-3 w-3" />
                          {resource.dislikes}
                        </div>
                      </div>
                    </TableCell> */}
                    <TableCell>
                      <Badge variant={resource.is_active ? "default" : "secondary"}>
                        {resource.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(resource.url, '_blank')}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Resource
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditModal(resource)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openDeleteModal(resource)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {!isLoading && currentResources.length === 0 && (
            <div className="text-center py-8">
              <BookMarked className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No learning resources found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                {searchTerm || typeFilter !== "all" || sourceFilter !== "all" || statusFilter !== "all"
                  ? "Try adjusting your filters to see more results."
                  : "Get started by adding your first learning resource."}
              </p>
              {!searchTerm && typeFilter === "all" && sourceFilter === "all" && statusFilter === "all" && (
                <Button onClick={() => setIsAddModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Resource
                </Button>
              )}
            </div>
          )}
        </CardContent>
        
        {/* Pagination Controls */}
        {!isLoading && filteredResources.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t">
            <div className="text-sm text-gray-500">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredResources.length)} of {filteredResources.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = []
                  const maxVisiblePages = 5
                  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
                  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
                  
                  if (endPage - startPage + 1 < maxVisiblePages) {
                    startPage = Math.max(1, endPage - maxVisiblePages + 1)
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <Button
                        key={i}
                        variant={currentPage === i ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(i)}
                        className="h-8 w-8 p-0"
                      >
                        {i}
                      </Button>
                    )
                  }
                  return pages
                })()}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modals */}
      <AddLearningResourceModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddResource}
      />

      {selectedResource && (
        <>
          <EditLearningResourceModal
            isOpen={isEditModalOpen}
            onClose={() => {
              setIsEditModalOpen(false)
              setSelectedResource(null)
            }}
            onEdit={handleEditResource}
            resource={selectedResource}
          />

          <DeleteLearningResourceModal
            isOpen={isDeleteModalOpen}
            onClose={() => {
              setIsDeleteModalOpen(false)
              setSelectedResource(null)
            }}
            onDelete={handleDeleteResource}
            resource={selectedResource}
          />
        </>
      )}

      {/* Harvesting Progress Modal */}
      <HarvestingProgressModal
        isOpen={isHarvestingModalOpen}
        onClose={() => setIsHarvestingModalOpen(false)}
      />
    </div>
  )
}
