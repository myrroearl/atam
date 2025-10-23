"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Brain,
  BookOpen,
  ExternalLink,
  Heart,
  MessageCircle,
  Share,
  TrendingUp,
  AlertCircle,
  Star,
  Clock,
  User,
  Bookmark,
  Eye,
  ThumbsUp,
  ThumbsDown,
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
  const [likedResources, setLikedResources] = useState<Set<string>>(new Set())
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set())

  useEffect(() => {
    let active = true
    async function loadPersonalizedResources() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch('/api/student/personalized-resources', { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
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
    loadPersonalizedResources()
    return () => { active = false }
  }, [])

  const handleLike = (resourceId: string) => {
    setLikedResources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
  }

  const handleBookmark = (resourceId: string) => {
    setBookmarkedResources(prev => {
      const newSet = new Set(prev)
      if (newSet.has(resourceId)) {
        newSet.delete(resourceId)
      } else {
        newSet.add(resourceId)
      }
      return newSet
    })
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Learning Feed
        </h1>
        <p className="text-muted-foreground">Personalized learning resources based on your academic performance</p>
      </div>

      {/* Performance Stats */}
      {performanceStats && (
        <Card className="glass-card shadow-card-lg">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Brain className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium">{performanceStats.totalTopics} topics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                  <span className="text-sm font-medium">{performanceStats.lowPerformanceTopics} areas to improve</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  <span className="text-sm font-medium">{Math.round(performanceStats.averageScore)}% avg</span>
                </div>
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

      {/* News Feed */}
      {!loading && !error && (
        <div className="space-y-4">
          {resources.length === 0 ? (
            <Card className="glass-card shadow-card-lg">
              <CardContent className="p-6 text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium mb-2">No personalized resources found</h3>
                <p className="text-muted-foreground">Complete some activities to get personalized learning recommendations!</p>
              </CardContent>
            </Card>
          ) : (
            resources.map((resource) => (
              <Card key={resource.id} className="glass-card shadow-card-lg hover:shadow-card-xl transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-500 text-white">
                          {getResourceTypeIcon(resource.type)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{resource.author}</span>
                          {resource.isLowPerformance && (
                            <Badge variant="destructive" className="text-xs">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Focus Area
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <span>{getSourceIcon(resource.source)} {resource.source}</span>
                          <span>•</span>
                          <Clock className="w-3 h-3" />
                          <span>Just now</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(resource.id)}
                      className={`${bookmarkedResources.has(resource.id) ? 'text-blue-600' : 'text-muted-foreground'}`}
                    >
                      <Bookmark className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Resource Content */}
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold leading-tight">{resource.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{resource.description}</p>
                    
                    {/* Topics and Tags */}
                    <div className="flex flex-wrap gap-2">
                      {resource.topics.slice(0, 3).map((topic, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className={`text-xs ${
                            lowPerformanceTopics.includes(topic) 
                              ? 'border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/20 dark:text-orange-300' 
                              : 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/20 dark:text-blue-300'
                          }`}
                        >
                          {lowPerformanceTopics.includes(topic) && <AlertCircle className="w-3 h-3 mr-1" />}
                          {topic}
                        </Badge>
                      ))}
                      {resource.topics.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{resource.topics.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Resource Link */}
                  <div className="p-4 bg-muted/30 rounded-lg border border-dashed">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded flex items-center justify-center text-white text-sm">
                          {getResourceTypeIcon(resource.type)}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{resource.title}</p>
                          <p className="text-xs text-muted-foreground">{resource.source}</p>
                        </div>
                      </div>
                      <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </a>
                      </Button>
                    </div>
                  </div>

                  {/* Engagement Bar */}
                  <div className="flex items-center justify-between pt-2 border-t">
                    <div className="flex items-center space-x-6">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLike(resource.id)}
                        className={`flex items-center space-x-2 ${
                          likedResources.has(resource.id) ? 'text-blue-600' : 'text-muted-foreground'
                        }`}
                      >
                        <Heart className={`w-4 h-4 ${likedResources.has(resource.id) ? 'fill-current' : ''}`} />
                        <span>{resource.likes + (likedResources.has(resource.id) ? 1 : 0)}</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        <span>Comment</span>
                      </Button>
                      <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-muted-foreground">
                        <Share className="w-4 h-4" />
                        <span>Share</span>
                      </Button>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <Eye className="w-3 h-3" />
                      <span>Relevance: {Math.round(resource.relevanceScore)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  )
}
