"use client"
import { BookOpen, Calendar, FileText, GraduationCap, Home, Settings, Sparkles, Clock, Activity, Archive, MessageCircle, Bell } from "lucide-react"
import { useEffect, useState } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

const navigationItems = [
  {
    title: "Home",
    url: "/professor/dashboard",
    icon: Home,
  },
  {
    title: "Classes",
    url: "/professor/classes",
    icon: BookOpen,
  },
  {
    title: "Co-Guro AI Tools",
    url: "/professor/ai-tools",
    icon: Sparkles,
  },
  // {
  //   title: "Curriculum",
  //   url: "/professor/curriculum",
  //   icon: GraduationCap,
  // },
  {
    title: "Schedule",
    url: "/professor/calendar",
    icon: Calendar,
  },
  {
    title: "Archived Classes",
    url: "/professor/archived-classes",
    icon : Archive,
  },
  // {
  //   title: "Notifications",
  //   url: "/professor/notifications",
  //   icon: Bell,
  // },
  
  // {
  //   title: "Reports",
  //   url: "/professor/reports",
  //   icon: FileText,
  // },
]

interface ActivityLog {
  id: number
  action: string
  description: string | null
  timestamp: string
  timeAgo: string
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

export function AppSidebar() {
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([])
  const [aiToolUsage, setAiToolUsage] = useState<AIToolUsage[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both activity logs and AI tools usage in parallel
        const [activityResponse, aiToolsResponse] = await Promise.all([
          fetch('/api/professor/activity-logs?limit=5'),
          fetch('/api/professor/ai-tools-usage?limit=5')
        ])

        if (activityResponse.ok) {
          const activityData = await activityResponse.json()
          setActivityLogs(activityData.logs || [])
        }

        if (aiToolsResponse.ok) {
          const aiToolsData = await aiToolsResponse.json()
          setAiToolUsage(aiToolsData.data || [])
        }
      } catch (error) {
        console.error('Failed to fetch data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <Activity className="h-3 w-3" />
      case 'grade':
      case 'grading':
      case 'grade_entry_created':
      case 'grade_entry_updated':
      case 'grade_entry_deleted':
      case 'scores_updated':
        return <FileText className="h-3 w-3" />
      case 'class':
      case 'course':
        return <BookOpen className="h-3 w-3" />
      case 'ai':
      case 'ai_tool':
      case 'quiz-generator':
      case 'ppt-generator':
      case 'lesson-planner':
      case 'code-checker':
        return <Sparkles className="h-3 w-3" />
      case 'google_classroom_import':
        return <GraduationCap className="h-3 w-3" />
      default:
        return <Clock className="h-3 w-3" />
    }
  }

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
      case 'grade':
      case 'grading':
      case 'grade_entry_created':
      case 'grade_entry_updated':
      case 'grade_entry_deleted':
      case 'scores_updated':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
      case 'class':
      case 'course':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300'
      case 'ai':
      case 'ai_tool':
      case 'quiz-generator':
      case 'ppt-generator':
      case 'lesson-planner':
      case 'code-checker':
      case 'google_classroom_import':
        return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
      default:
        return 'bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-300'
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
      type: 'ai_tool'
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

  const truncateText = (text: string, maxLength: number): string => {
    if (text.length <= maxLength) return text
    
    // Find the last space before the max length to avoid cutting words
    const truncated = text.substring(0, maxLength)
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastSpace > maxLength * 0.7) {
      // If we found a space reasonably close to the end, use it
      return text.substring(0, lastSpace) + '...'
    } else {
      // Otherwise, just cut at max length and add ellipsis
      return truncated + '...'
    }
  }
  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-4 py-2">
          <Image
              src="/logo.jpg"
              alt="Logo"
              width={40}
              height={40}
              className="rounded-full transition-all duration-200"
            />
          <div>
            <h2 className="text-lg font-semibold">PLP Academic</h2>
            <p className="text-sm text-muted-foreground">Management System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Recent Activity Section */}
        <SidebarGroup>
          <div className="flex items-center justify-between px-2 py-1">
            <SidebarGroupLabel className="text-xs font-medium text-muted-foreground">
              Recent Activity
            </SidebarGroupLabel>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <Link href="/professor/activity-logs">
                View All
              </Link>
            </Button>
          </div>
          <SidebarGroupContent>
            <ScrollArea className="h-[400px]">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary/20 border-t-primary"></div>
                </div>
              ) : (activityLogs.length === 0 && aiToolUsage.length === 0) ? (
                <div className="flex flex-col items-center py-8">
                  <Activity className="h-8 w-8 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground mt-2">No recent activity</p>
                </div>
              ) : (
                <div className="space-y-1">
                  {/* Activity Logs */}
                  {activityLogs.map((log) => (
                    <Link key={`activity-${log.id}`} href="/professor/activity-logs">
                      <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex-shrink-0 mt-0.5">
                          {getActionIcon(log.action)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <Badge 
                              variant="secondary" 
                              className={`text-xs px-1.5 py-0.5 ${getActionColor(log.action)}`}
                            >
                              {log.action.replace('_', ' ')}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {log.timeAgo}
                            </span>
                          </div>
                          {log.description && (
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {truncateText(log.description, 50)}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}

                  {/* AI Tools Usage */}
                  {aiToolUsage.map((usage) => {
                    const formattedUsage = formatAIToolUsage(usage)
                    return (
                      <Link key={`ai-${usage.usage_id}`} href="/professor/ai-tools">
                        <div className="flex items-start gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors border-l-2 border-orange-200 dark:border-orange-800">
                          <div className="flex-shrink-0 mt-0.5">
                            {getActionIcon(usage.tool_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <Badge 
                                variant="secondary" 
                                className={`text-xs px-1.5 py-0.5 ${getActionColor(usage.tool_type)}`}
                              >
                                AI: {usage.tool_type.replace('-', ' ')}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formattedUsage.timeAgo}
                              </span>
                            </div>
                            <p className="text-xs text-foreground/80 leading-relaxed">
                              {truncateText(formattedUsage.description, 50)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Profile Settings">
              <Link href="/professor/profile">
                <Settings />
                <span>Profile Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
