"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { 
  Activity, 
  BookOpen, 
  FileText, 
  Sparkles, 
  Clock, 
  Search, 
  Filter, 
  ArrowLeft,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import Link from "next/link"

interface ActivityLog {
  id: number
  action: string
  description: string | null
  timestamp: string
  timeAgo: string
  created_at: string
}

interface AIToolUsage {
  usage_id: number
  tool_type: string
  request_text: string
  generated_output: string
  success: boolean
  date_used: string
  created_at: string
}

interface ActivityLogsResponse {
  logs: ActivityLog[]
  hasMore: boolean
  total: number
}

interface AIToolsUsageResponse {
  data: AIToolUsage[]
  stats: {
    totalUsage: number
    successfulUsage: number
    recentUsage: number
    successRate: number
  }
}

export default function ActivityLogsPage() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [aiToolUsage, setAiToolUsage] = useState<AIToolUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [actionFilter, setActionFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [total, setTotal] = useState(0)
  const [filterType, setFilterType] = useState<"all" | "activity" | "ai_tools">("all")
  const router = useRouter()

  const itemsPerPage = 20

  useEffect(() => {
    fetchData()
  }, [currentPage, actionFilter, filterType])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      
      if (filterType === "all" || filterType === "activity") {
        await fetchActivityLogs()
      }
      
      if (filterType === "all" || filterType === "ai_tools") {
        await fetchAIToolUsage()
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchActivityLogs = async () => {
    try {
      const offset = (currentPage - 1) * itemsPerPage
      const params = new URLSearchParams({
        limit: itemsPerPage.toString(),
        offset: offset.toString(),
        ...(actionFilter !== "all" && { action: actionFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/professor/activity-logs?${params}`)
      if (response.ok) {
        const data: ActivityLogsResponse = await response.json()
        setActivityLogs(data.logs || [])
        setHasMore(data.hasMore || false)
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error)
    }
  }

  const fetchAIToolUsage = async () => {
    try {
      const response = await fetch('/api/professor/ai-tools-usage')
      if (response.ok) {
        const data: AIToolsUsageResponse = await response.json()
        setAiToolUsage(data.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch AI tool usage:', error)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    setCurrentPage(1)
    // Debounce search
    setTimeout(() => {
      fetchData()
    }, 500)
  }

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <Activity className="h-4 w-4" />
      case 'grade':
      case 'grading':
        return <FileText className="h-4 w-4" />
      case 'class':
      case 'course':
        return <BookOpen className="h-4 w-4" />
      case 'ai':
      case 'ai_tool':
      case 'quiz-generator':
      case 'ppt-generator':
      case 'lesson-planner':
      case 'code-checker':
        return <Sparkles className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800'
      case 'grade':
      case 'grading':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800'
      case 'class':
      case 'course':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 border-purple-200 dark:border-purple-800'
      case 'ai':
      case 'ai_tool':
      case 'quiz-generator':
      case 'ppt-generator':
      case 'lesson-planner':
      case 'code-checker':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200 border-gray-200 dark:border-gray-800'
    }
  }

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    }
  }

  // Helper function to format AI tool usage for display
  const formatAIToolUsage = (usage: AIToolUsage) => {
    const toolName = usage.tool_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())
    const description = usage.success 
      ? `Generated ${toolName} successfully`
      : `Failed to generate ${toolName}`
    
    return {
      id: usage.usage_id,
      action: usage.tool_type,
      description,
      timestamp: usage.date_used,
      timeAgo: getTimeAgo(usage.date_used),
      type: 'ai_tool',
      success: usage.success,
      generated_output: usage.generated_output
    }
  }

  // Helper function to get time ago
  const getTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  const actionOptions = [
    { value: "all", label: "All Actions" },
    { value: "login", label: "Login" },
    { value: "grading", label: "Grading" },
    { value: "class", label: "Class Management" },
    { value: "ai_tool", label: "AI Tools" },
    { value: "other", label: "Other" }
  ]

  const filterTypeOptions = [
    { value: "all", label: "All Activities" },
    { value: "activity", label: "Activity Logs Only" },
    { value: "ai_tools", label: "AI Tools Usage Only" }
  ]

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Activity Logs</h1>
            <p className="text-muted-foreground">Detailed view of your recent activities</p>
          </div>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <User className="h-3 w-3" />
          {total} total activities
        </Badge>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
          <CardDescription>Find specific activities or filter by action type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full sm:w-48">
              <Select value={filterType} onValueChange={(value: "all" | "activity" | "ai_tools") => setFilterType(value)}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  {filterTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-48">
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent>
                  {actionOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {filterType === "all" ? "All Activities" : filterType === "activity" ? "Activity Logs" : "AI Tools Usage"}
          </CardTitle>
          <CardDescription>
            {filterType === "all" 
              ? `Showing ${activityLogs.length + aiToolUsage.length} total activities`
              : filterType === "activity" 
                ? `Showing ${activityLogs.length} of ${total} activity logs`
                : `Showing ${aiToolUsage.length} AI tool usage records`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center space-y-3">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary/20 border-t-primary"></div>
                <p className="text-sm text-muted-foreground">Loading activities...</p>
              </div>
            </div>
          ) : (filterType === "all" && activityLogs.length === 0 && aiToolUsage.length === 0) || 
               (filterType === "activity" && activityLogs.length === 0) || 
               (filterType === "ai_tools" && aiToolUsage.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
                <Activity className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-foreground/60">No activities found</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {searchTerm || actionFilter !== "all" 
                    ? "Try adjusting your search or filters" 
                    : "Your activities will appear here as you use the system"
                  }
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {/* Activity Logs */}
                {(filterType === "all" || filterType === "activity") && activityLogs.map((log, index) => {
                  const { date, time } = formatDate(log.timestamp)
                  return (
                    <div key={`activity-${log.id}`} className="group">
                      <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-primary/20">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                              <div className={`p-3 rounded-full ${getActionColor(log.action)} border`}>
                                {getActionIcon(log.action)}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Badge 
                                      variant="secondary" 
                                      className={`${getActionColor(log.action)} border-0`}
                                    >
                                      {log.action}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground font-mono">
                                      {log.timeAgo}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-semibold text-foreground mb-1">
                                    {log.action.charAt(0).toUpperCase() + log.action.slice(1)} Activity
                                  </h3>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3" />
                                    {date}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {time}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Description */}
                              {log.description && (
                                <>
                                  <Separator />
                                  <div>
                                    <h4 className="text-sm font-medium text-foreground/80 mb-2">Description</h4>
                                    <p className="text-sm text-foreground/70 leading-relaxed">
                                      {log.description}
                                    </p>
                                  </div>
                                </>
                              )}
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Activity ID: #{log.id}</span>
                                <span>•</span>
                                <span>Full timestamp: {log.timestamp}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}

                {/* AI Tools Usage */}
                {(filterType === "all" || filterType === "ai_tools") && aiToolUsage.map((usage, index) => {
                  const formattedUsage = formatAIToolUsage(usage)
                  const { date, time } = formatDate(usage.date_used)
                  return (
                    <div key={`ai-${usage.usage_id}`} className="group">
                      <Card className="hover:shadow-md transition-all duration-200 border-l-4 border-l-orange-400">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <div className="flex-shrink-0">
                              <div className={`p-3 rounded-full ${getActionColor(usage.tool_type)} border`}>
                                {getActionIcon(usage.tool_type)}
                              </div>
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-3">
                              {/* Header */}
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-3 mb-2">
                                    <Badge 
                                      variant="secondary" 
                                      className={`${getActionColor(usage.tool_type)} border-0`}
                                    >
                                      AI: {usage.tool_type.replace('-', ' ')}
                                    </Badge>
                                    <Badge 
                                      variant={usage.success ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      {usage.success ? "Success" : "Failed"}
                                    </Badge>
                                    <span className="text-sm text-muted-foreground font-mono">
                                      {formattedUsage.timeAgo}
                                    </span>
                                  </div>
                                  <h3 className="text-lg font-semibold text-foreground mb-1">
                                    {usage.tool_type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Usage
                                  </h3>
                                </div>
                                <div className="text-right text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1 mb-1">
                                    <Calendar className="h-3 w-3" />
                                    {date}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {time}
                                  </div>
                                </div>
                              </div>
                              
                              {/* Description */}
                              <Separator />
                              <div>
                                <h4 className="text-sm font-medium text-foreground/80 mb-2">Request</h4>
                                <p className="text-sm text-foreground/70 leading-relaxed mb-3">
                                  {usage.request_text.length > 200 
                                    ? usage.request_text.substring(0, 200) + '...' 
                                    : usage.request_text
                                  }
                                </p>
                                
                                {usage.generated_output && (
                                  <>
                                    <h4 className="text-sm font-medium text-foreground/80 mb-2">Generated Output</h4>
                                    <div className="flex items-center gap-2">
                                      {usage.generated_output.startsWith('http') ? (
                                        <Button
                                          variant="outline"
                                          size="sm"
                                          onClick={() => window.open(usage.generated_output, '_blank')}
                                          className="h-8 text-xs"
                                        >
                                          <Sparkles className="h-3 w-3 mr-1" />
                                          Open Generated Content
                                        </Button>
                                      ) : (
                                        <p className="text-sm text-foreground/70 leading-relaxed">
                                          {usage.generated_output.length > 200 
                                            ? usage.generated_output.substring(0, 200) + '...' 
                                            : usage.generated_output
                                          }
                                        </p>
                                      )}
                                    </div>
                                  </>
                                )}
                              </div>
                              
                              {/* Metadata */}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Usage ID: #{usage.usage_id}</span>
                                <span>•</span>
                                <span>Tool: {usage.tool_type}</span>
                                <span>•</span>
                                <span>Date: {usage.date_used}</span>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {!isLoading && (filterType === "all" || filterType === "activity") && activityLogs.length > 0 && (
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} • {activityLogs.length} activities shown
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={!hasMore}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
