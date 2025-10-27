"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  BookOpen,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Star,
  Clock,
  User,
  Bookmark,
  Eye,
  Search,
  Filter,
  X,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"

type PersonalizedResource = {
  id: string
  title: string
  description: string
  type: string
  source: string
  url: string
  author: string
  topics: string[]
  tags: string[]
  likes: number
  dislikes: number
  relevanceScore: number
  isLowPerformance: boolean
}

type PersonalizedResourcesResponse = {
  resources: PersonalizedResource[]
  studentTopics: string[]
  lowPerformanceTopics: string[]
  totalResources: number
  relevantResources: number
  performanceStats: {
    totalTopics: number
    lowPerformanceTopics: number
    averageScore: number
  }
}

export function TrainingGround() {
  const [resources, setResources] = useState<PersonalizedResource[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [performanceStats, setPerformanceStats] = useState<PersonalizedResourcesResponse['performanceStats'] | null>(null)
  const [studentTopics, setStudentTopics] = useState<string[]>([])
  const [lowPerformanceTopics, setLowPerformanceTopics] = useState<string[]>([])
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set())
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showQuickTips, setShowQuickTips] = useState<boolean>(true)
  const [resourceClickCounts, setResourceClickCounts] = useState<Record<string, number>>({})
  const [resourceStats, setResourceStats] = useState<Record<string, { totalOpens: number, studentOpens: number }>>({})
  const [totalOpens, setTotalOpens] = useState<number>(0)
  const [uniqueResourcesOpened, setUniqueResourcesOpened] = useState<number>(0)
  const [userTotalOpens, setUserTotalOpens] = useState<number>(0)
  const { toast } = useToast()

  // Function to handle resource link clicks and track them
  const handleResourceClick = async (resourceId: string, resourceTitle: string) => {
    try {
      // Check if this is a new resource being opened
      const isNewResource = !resourceClickCounts[resourceId] || resourceClickCounts[resourceId] === 0

      // Record the open in the database
      const openResponse = await fetch('/api/student/resource-opens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId: resourceId
        })
      })

      if (!openResponse.ok) {
        throw new Error('Failed to record resource open')
      }

      // Update local click count
      setResourceClickCounts(prev => ({
        ...prev,
        [resourceId]: (prev[resourceId] || 0) + 1
      }))

      // Always increment user total opens (counts all opens including duplicates)
      setUserTotalOpens(prev => prev + 1)

      // Only increment unique resources for new resources
      if (isNewResource) {
        setTotalOpens(prev => prev + 1)
        setUniqueResourcesOpened(prev => prev + 1)
      }

      // Fetch updated resource stats
      await fetchResourceStats(resourceId)

      // Log the click activity
      await fetch('/api/student/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'link_opened',
          description: `Opened resource: ${resourceTitle}`,
          metadata: {
            resourceId: resourceId,
            resourceTitle: resourceTitle,
            clickCount: (resourceClickCounts[resourceId] || 0) + 1
          }
        })
      })

      // Show success toast
      toast({
        title: "Resource Opened",
        description: `Opening ${resourceTitle}`,
      })
    } catch (error) {
      console.error('Failed to log resource click:', error)
      // Still update the count even if logging fails
      setResourceClickCounts(prev => ({
        ...prev,
        [resourceId]: (prev[resourceId] || 0) + 1
      }))
    }
  }

  // Function to fetch resource statistics
  const fetchResourceStats = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/student/resource-stats?resourceId=${resourceId}`)
      if (response.ok) {
        const data = await response.json()
        setResourceStats(prev => ({
          ...prev,
          [resourceId]: {
            totalOpens: data.resourceStats.total_opens,
            studentOpens: data.studentOpens
          }
        }))
      }
    } catch (error) {
      console.error('Failed to fetch resource stats:', error)
    }
  }

  // Function to load student's resource open counts
  const loadResourceCounts = async () => {
    try {
      const response = await fetch('/api/student/resource-opens')
      if (response.ok) {
        const data = await response.json()
        setResourceClickCounts(data.resourceCounts || {})
        setTotalOpens(data.stats.unique_resources_opened || 0)
        setUniqueResourcesOpened(data.stats.unique_resources_opened || 0)
        setUserTotalOpens(data.stats.total_opens || 0)
      }
    } catch (error) {
      console.error('Failed to load resource counts:', error)
    }
  }



  useEffect(() => {
    let active = true
    async function loadPersonalizedResources() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/student/personalized-resources?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to load resources: ${response.status}`)
        }
        
        const data: PersonalizedResourcesResponse = await response.json()
        
        if (active) {
          setResources(data.resources || [])
          setPerformanceStats(data.performanceStats)
          setStudentTopics(data.studentTopics || [])
          setLowPerformanceTopics(data.lowPerformanceTopics || [])
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load personalized resources')
      } finally {
        if (active) setLoading(false)
      }
    }

    async function loadBookmarks() {
      try {
        const response = await fetch('/api/student/bookmarks', { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (active && data.bookmarks) {
            setBookmarkedResources(new Set(data.bookmarks.map((b: any) => b.resource_id)))
          }
        }
      } catch (e) {
        console.error('Failed to load bookmarks:', e)
      }
    }

    loadPersonalizedResources()
    loadBookmarks()
    loadResourceCounts()
    return () => { active = false }
  }, [])

  // Load resource stats for all resources when resources are loaded
  useEffect(() => {
    if (resources.length > 0) {
      resources.forEach(resource => {
        fetchResourceStats(resource.id)
      })
    }
  }, [resources])


  const handleBookmark = async (resourceId: string) => {
    const isCurrentlyBookmarked = bookmarkedResources.has(resourceId)
    const action = isCurrentlyBookmarked ? 'unbookmark' : 'bookmark'
    
    try {
      const response = await fetch('/api/student/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId,
          action
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update bookmark')
      }

      // Update local state
      setBookmarkedResources(prev => {
        const newSet = new Set(prev)
        if (isCurrentlyBookmarked) {
          newSet.delete(resourceId)
        } else {
          newSet.add(resourceId)
        }
        return newSet
      })

      // Show success toast
      toast({
        title: isCurrentlyBookmarked ? "Bookmark Removed" : "Bookmark Added",
        description: isCurrentlyBookmarked 
          ? "Resource removed from your bookmarks" 
          : "Resource added to your bookmarks",
      })
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getResourceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return '🎥'
      case 'book': return '📚'
      case 'article': return '📄'
      case 'course': return '🎓'
      case 'document': return '📋'
      default: return '📖'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'youtube': return '📺'
      case 'coursera': return '🎓'
      case 'edx': return '📚'
      case 'khan academy': return '🧮'
      case 'google books': return '📖'
      case 'wikipedia': return '🌐'
      case 'ted': return '🎤'
      default: return '🔗'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Filter resources based on search, type, and bookmark status
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === "all" || resource.type.toLowerCase() === filterType.toLowerCase()
    
    const matchesBookmark = !showBookmarksOnly || bookmarkedResources.has(resource.id)
    
    return matchesSearch && matchesType && matchesBookmark
  })

  // Pagination logic
  const resourcesPerPage = 10
  const totalPages = Math.ceil(filteredResources.length / resourcesPerPage)
  const startIndex = (currentPage - 1) * resourcesPerPage
  const endIndex = startIndex + resourcesPerPage
  const paginatedResources = filteredResources.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, showBookmarksOnly])

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
    }
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
    }
  }


  const toggleBookmarkView = () => {
    setShowBookmarksOnly(!showBookmarksOnly)
    
    if (!showBookmarksOnly) {
      toast({
        title: "Showing Bookmarks Only",
        description: "Filtering to show only your bookmarked resources",
      })
    } else {
      toast({
        title: "Showing All Resources",
        description: "Showing all available learning resources",
      })
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
              {showBookmarksOnly ? "My Bookmarks" : "Learning Feed"}
        </h1>
            <p className="text-muted-foreground text-lg">
              {showBookmarksOnly 
                ? "Your saved learning resources" 
                : "Personalized learning resources based on your academic performance"
              }
            </p>
          </div>
          <Button
            onClick={toggleBookmarkView}
            variant={showBookmarksOnly ? "default" : "outline"}
            className="flex items-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <BookmarkCheck className="w-4 h-4" />
            <span>{showBookmarksOnly ? "Show All" : "My Bookmarks"}</span>
          </Button>
        </div>

        {/* Quick Tips */}
        {!showBookmarksOnly && showQuickTips && (
          <Card className="glass-card shadow-card-lg border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                    <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-green-600 dark:text-green-400">💡 Quick Tips</h4>
                    <p className="text-sm text-muted-foreground">
                      • Bookmark resources you find useful for easy access later
                      • Use the search to find specific topics or subjects
                      • Focus on resources marked as "Focus Area" for improvement
                      • Try different resource types (videos, courses, books) for variety
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickTips(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search resources, topics, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="video">Video</option>
              <option value="book">Book</option>
              <option value="article">Article</option>
              <option value="course">Course</option>
              <option value="document">Document</option>
            </select>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>


      {/* Learning Progress Overview */}
      {!loading && !error && (
        <Card className="glass-card shadow-card-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-green-500" />
              <span>Learning Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {resources.length}
                </div>
                <div className="text-sm text-muted-foreground">Total Resources</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {bookmarkedResources.size}
                </div>
                <div className="text-sm text-muted-foreground">Bookmarked</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg">
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {userTotalOpens}
                </div>
                <div className="text-sm text-muted-foreground">Your Total Opens</div>
              </div>
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {uniqueResourcesOpened}
                </div>
                <div className="text-sm text-muted-foreground">Unique Resources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card shadow-card-lg">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="glass-card shadow-card-lg border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {!loading && !error && resources.length > 0 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredResources.length)} of {filteredResources.length} resources
            {showBookmarksOnly && ` (${bookmarkedResources.size} bookmarked)`}
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </span>
          {(searchQuery || filterType !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setFilterType("all")
              }}
              className="text-xs"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* News Feed */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredResources.length === 0 ? (
            <div className="space-y-6">
              {/* Motivational Section */}
              <Card className="glass-card shadow-card-lg border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">
                        Keep Learning!
                      </h3>
                      <p className="text-muted-foreground">
                        Your learning journey is just beginning. Explore new topics and discover amazing resources.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Empty State */}
            <Card className="glass-card shadow-card-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center">
                    <Brain className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {showBookmarksOnly ? "No bookmarks yet" : "No resources found"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {showBookmarksOnly 
                      ? "Start your learning journey by bookmarking resources you find useful. Your bookmarks will appear here!"
                      : "No resources match your current filters. Try adjusting your search terms or clearing the filters to see more content."
                    }
                  </p>
                  {!showBookmarksOnly && (searchQuery || filterType !== "all") && (
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setFilterType("all")
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
              </CardContent>
            </Card>
            </div>
          ) : (
            paginatedResources.map((resource) => (
              <Card key={resource.id} className="glass-card shadow-card-lg hover:shadow-card-xl transition-all duration-300 group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Avatar className="w-12 h-12 ring-2 ring-green-100 dark:ring-green-900/20 group-hover:ring-green-200 dark:group-hover:ring-green-800/40 transition-all duration-300">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white text-lg">
                          {getResourceTypeIcon(resource.type)}
                        </AvatarFallback>
                      </Avatar>
                        {resource.isLowPerformance && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-foreground">{resource.author}</span>
                          {resource.isLowPerformance && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Focus Area
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <span>{getSourceIcon(resource.source)}</span>
                            <span className="font-medium">{resource.source}</span>
                          </div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                          <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Just now</span>
                          </div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full"></div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{resource.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(resource.id)}
                      className={`p-2 rounded-full transition-all duration-200 ${
                        bookmarkedResources.has(resource.id) 
                          ? 'text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                          : 'text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedResources.has(resource.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Resource Content */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold leading-tight text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                        {resource.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                        {resource.description}
                      </p>
                    </div>
                    
                    {/* Topics and Tags */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topics</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/20 to-transparent"></div>
                      </div>
                    <div className="flex flex-wrap gap-2">
                        {resource.topics.slice(0, 4).map((topic, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                            className={`text-xs px-3 py-1 font-medium transition-all duration-200 hover:scale-105 ${
                            lowPerformanceTopics.includes(topic) 
                                ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/20 dark:text-orange-300 dark:hover:bg-orange-950/30' 
                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300 dark:hover:bg-green-950/30'
                          }`}
                        >
                          {lowPerformanceTopics.includes(topic) && <AlertCircle className="w-3 h-3 mr-1" />}
                          {topic}
                        </Badge>
                      ))}
                        {resource.topics.length > 4 && (
                          <Badge variant="outline" className="text-xs px-3 py-1 font-medium hover:bg-muted/50">
                            +{resource.topics.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Resource Stats */}
                    <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>Relevance: {Math.round(resource.relevanceScore)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span>{resource.likes - resource.dislikes} net likes</span>
                        </div>
                        {resourceClickCounts[resource.id] > 0 && (
                          <div className="flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              You opened {resourceClickCounts[resource.id]} time{resourceClickCounts[resource.id] > 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                        {resourceStats[resource.id] && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-muted-foreground text-xs">
                              {resourceStats[resource.id].totalOpens} total opens by all students
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Resource Link */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200/50 dark:border-green-800/50 group-hover:from-green-100 group-hover:to-emerald-100 dark:group-hover:from-green-950/30 dark:group-hover:to-emerald-950/30 transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                          {getResourceTypeIcon(resource.type)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground">{resource.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center space-x-1">
                            <span>{getSourceIcon(resource.source)}</span>
                            <span>{resource.source}</span>
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                        onClick={() => handleResourceClick(resource.id, resource.title)}
                      >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4" />
                          <span>Open Resource</span>
                          {resourceClickCounts[resource.id] > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                              {resourceClickCounts[resource.id]}
                            </span>
                          )}
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex items-center justify-between pt-6">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-1"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}
    </div>
  )
}
