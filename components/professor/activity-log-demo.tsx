// This is a demo component to showcase the enhanced activity log design
// You can remove this file after reviewing the design

"use client"

import { Activity, BookOpen, FileText, Sparkles, Clock } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const demoLogs = [
  {
    id: 1,
    action: "login",
    description: "Successfully logged into the professor portal and accessed the dashboard",
    timeAgo: "2m ago"
  },
  {
    id: 2,
    action: "grading",
    description: "Updated grades for Mathematics 101 - Calculus I assignment for 25 students",
    timeAgo: "15m ago"
  },
  {
    id: 3,
    action: "ai_tool",
    description: "Used Co-Guro AI to generate personalized study recommendations for struggling students",
    timeAgo: "1h ago"
  },
  {
    id: 4,
    action: "class",
    description: "Created new class session for Physics 201 - Mechanics and uploaded course materials",
    timeAgo: "2h ago"
  },
  {
    id: 5,
    action: "grade",
    description: "Reviewed and finalized midterm exam grades for Computer Science 301 - Data Structures",
    timeAgo: "3h ago"
  }
]

const getActionIcon = (action: string) => {
  switch (action.toLowerCase()) {
    case 'login':
      return <Activity className="h-3 w-3" />
    case 'grade':
    case 'grading':
      return <FileText className="h-3 w-3" />
    case 'class':
    case 'course':
      return <BookOpen className="h-3 w-3" />
    case 'ai':
    case 'ai_tool':
      return <Sparkles className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

const getActionColor = (action: string) => {
  switch (action.toLowerCase()) {
    case 'login':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
    case 'grade':
    case 'grading':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
    case 'class':
    case 'course':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
    case 'ai':
    case 'ai_tool':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
  }
}

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text
  
  const truncated = text.substring(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  
  if (lastSpace > maxLength * 0.7) {
    return text.substring(0, lastSpace) + '...'
  } else {
    return truncated + '...'
  }
}

export function ActivityLogDemo() {
  return (
    <div className="w-80 p-4 bg-background border rounded-lg">
      <h3 className="text-xs font-semibold text-foreground/80 uppercase tracking-wide mb-4">
        Recent Activity (Demo)
      </h3>
      <div className="space-y-1 max-h-80 overflow-y-auto">
        {demoLogs.map((log, index) => (
          <div key={log.id} className="group relative activity-log-item">
            {index < demoLogs.length - 1 && (
              <div className="activity-log-connector"></div>
            )}
            
            <div className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/60 transition-all duration-200 cursor-pointer group-hover:shadow-sm">
              <div className="flex-shrink-0 relative activity-log-icon">
                <div className={`p-2 rounded-full ${getActionColor(log.action)} shadow-sm group-hover:shadow-md transition-shadow duration-200`}>
                  {getActionIcon(log.action)}
                </div>
                {index < 3 && (
                  <div className={`absolute -inset-1 rounded-full ${getActionColor(log.action)} opacity-20 animate-pulse`}></div>
                )}
              </div>
              
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge 
                    variant="secondary" 
                    className={`text-xs px-2.5 py-1 font-medium ${getActionColor(log.action)} border-0 shadow-sm`}
                  >
                    {log.action}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-mono">
                    {log.timeAgo}
                  </span>
                </div>
                
                <div className="space-y-1">
                  <p className="text-sm text-foreground/90 leading-relaxed group-hover:text-foreground transition-colors duration-200">
                    {truncateText(log.description, 60)}
                  </p>
                  {log.description.length > 60 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground/40"></div>
                      <span>Click to view more</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
