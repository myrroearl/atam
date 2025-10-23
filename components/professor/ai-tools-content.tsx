"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Sparkles, FileText, PenTool, Presentation, Zap, Brain, BookOpen, BarChart3, ArrowRight, Clock, Users, Target, Code2, Camera, TrendingUp, CheckCircle, XCircle, Calendar, ExternalLink as ExternalLinkIcon } from "lucide-react"
import Link from "next/link"

interface UsageData {
  usage_id: number
  tool_type: string
  request_text: string
  generated_output: string
  success: boolean
  date_used: string
  created_at: string
}

interface UsageStats {
  totalUsage: number
  successfulUsage: number
  toolTypeCounts: Record<string, number>
  recentUsage: number
}

export function AIToolsContent() {
  const [usageData, setUsageData] = useState<UsageData[]>([])
  const [stats, setStats] = useState<UsageStats>({
    totalUsage: 0,
    successfulUsage: 0,
    toolTypeCounts: {},
    recentUsage: 0
  })
  const [loading, setLoading] = useState(true)

  // Fetch usage data
  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch('/api/professor/ai-tools-usage?limit=10')
        const result = await response.json()
        
        if (response.ok) {
          setUsageData(result.data || [])
          setStats(result.stats || stats)
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsageData()
  }, [])

  const aiFeatures = [
    {
      id: "ppt-generator",
      title: "PowerPoint Generator",
      description: "Create engaging PowerPoint presentations with AI assistance",
      icon: Presentation,
      color: "bg-orange-500",
      bgColor: "bg-yellow-50 dark:bg-yellow-950/20",
      borderColor: "border-yellow-200 dark:border-yellow-800",
      href: "/professor/ai-tools/ppt-generator",
      features: ["Custom templates", "Content generation", "Visual design", "Editable via Google Slides","Export ready"],
      status: "active",
    },
    {
      id: "quiz-generator",
      title: "Quiz Generator",
      description: "Create custom quizzes from your course materials automatically",
      icon: FileText,
      color: "from-blue-500 to-cyan-500",
      bgColor: "bg-blue-50 dark:bg-blue-950/20",
      borderColor: "border-blue-200 dark:border-blue-800",
      href: "/professor/ai-tools/quiz-generator",
      features: ["Multiple question types", "Difficulty levels", "Auto-grading", "Editable via Google Docs", "Export options"],
      status: "active",
    },
    {
      id: "lesson-planner",
      title: "Lesson Plan Generator",
      description: "Generate comprehensive lesson plans to get ready for your class",
      icon: BookOpen,
      color: "from-purple-500 to-violet-500",
      bgColor: "bg-purple-50 dark:bg-purple-950/20",
      borderColor: "border-purple-200 dark:border-purple-800",
      href: "/professor/ai-tools/lesson-planner",
      features: ["Grade-level alignment", "Learning objectives", "Activity suggestions", "Assessment ideas"],
      status: "active",
    },
    {
      id: "code-checker",
      title: "Programming Code Checker",  
      description: "Execute and evaluate student code with automated test cases for different programming languages",
      icon: Code2,
      color: "from-green-500 to-emerald-500",
      bgColor: "bg-green-50 dark:bg-green-950/20",
      borderColor: "border-green-200 dark:border-green-800",
      href: "/professor/ai-tools/code-checker",
      features: ["Multi-language support", "Test case validation", "Real-time execution", "Code Editor"],
      status: "active",
    },
    // {
    //   id: "scan-and-grade-quiz-answers",
    //   title: "Scan and Grade Quiz Answers",
    //   description: "Automatically evaluate and analyze student quiz answers just scanning the test paper with your phone camera.",
    //   icon: Camera,
    //   color: "from-orange-500 to-red-500",
    //   bgColor: "bg-orange-50 dark:bg-orange-950/20",
    //   borderColor: "border-orange-200 dark:border-orange-800",
    //   href: "/professor/ai-tools/smart-grading",
    //   features: ["Automated scoring", "Feedback generation", "Rubric alignment", "Batch processing", "Camera scanning"],
    //   status: "coming-soon",
    // },
  ]

  const recentActivity = [
    {
      tool: "Quiz Generator",
      action: "Generated 20-question quiz for Chemistry 301",
      time: "2 hours ago",
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900",
    },
    {
      tool: "Essay Checker",
      action: "Analyzed 15 essays with 94% accuracy",
      time: "5 hours ago",
      icon: PenTool,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900",
    },
    {
      tool: "Lesson Planner",
      action: "Created lesson plan for Physics 201",
      time: "1 day ago",
      icon: BookOpen,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Co-Guro AI Tools
        </h1>
        <p className="text-muted-foreground">
          Powerful AI tools to enhance your teaching, save time, and improve student outcomes
        </p>
      </div>

     
      {/* Stats Overview */}
      {/* <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">24h</p>
                <p className="text-xs text-muted-foreground">Time Saved This Week</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-2xl font-bold">156</p>
                <p className="text-xs text-muted-foreground">Students Helped</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">94%</p>
                <p className="text-xs text-muted-foreground">Accuracy Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">47</p>
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* AI Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {aiFeatures.map((feature) => (
          <Card
            key={feature.id}
            className={`${feature.bgColor} ${feature.borderColor} hover:shadow-lg transition-all duration-200`}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} flex items-center justify-center`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{feature.title}</CardTitle>
                    <CardDescription className="mt-1">{feature.description}</CardDescription>
                  </div>
                </div>
                <Badge variant={feature.status === "active" ? "default" : "secondary"}>
                  {feature.status === "active" ? "Active" : "Coming Soon"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                {feature.features.map((feat, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>

              {feature.status === "active" ? (
                <Link href={feature.href}>
                  <Button className="w-full group mt-5">
                    Launch {feature.title.replace("AI ", "")}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              ) : (
                <Button className="w-full" disabled>
                  Coming Soon
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent AI Tool Outputs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent AI Tool Outputs</h2>
          <Badge variant="outline" className="text-sm">
            {usageData.length} recent outputs
          </Badge>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading recent outputs...</p>
              </div>
            ) : usageData.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tool Type</TableHead>
                    <TableHead>Request</TableHead>
                    <TableHead>Output Preview</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Used</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usageData.map((usage) => (
                    <TableRow key={usage.usage_id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {usage.tool_type === 'quiz-generator' && <FileText className="h-4 w-4 text-blue-500" />}
                          {usage.tool_type === 'ppt-generator' && <Presentation className="h-4 w-4 text-orange-500" />}
                          {usage.tool_type === 'lesson-planner' && <BookOpen className="h-4 w-4 text-purple-500" />}
                          {usage.tool_type === 'code-checker' && <Code2 className="h-4 w-4 text-green-500" />}
                          <span className="font-medium capitalize">
                            {usage.tool_type?.replace('-', ' ')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm text-muted-foreground">
                          {usage.request_text || 'No request text'}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {usage.generated_output ? (
                          usage.generated_output.startsWith('http') ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(usage.generated_output, '_blank')}
                              className="h-8 text-xs"
                            >
                              <ExternalLinkIcon className="h-3 w-3 mr-1" />
                              Open Link
                            </Button>
                          ) : (
                            <p className="truncate text-sm">
                              {usage.generated_output.substring(0, 100) + (usage.generated_output.length > 100 ? '...' : '')}
                            </p>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">No output generated</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={usage.success ? "default" : "destructive"} className="text-xs">
                          {usage.success ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Success</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Failed</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(usage.date_used).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center">
                <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No AI Tool Usage Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Start using AI tools to see your recent outputs and usage statistics here.
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/professor/ai-tools/quiz-generator">
                    <Button size="sm">Generate Quiz</Button>
                  </Link>
                  <Link href="/professor/ai-tools/ppt-generator">
                    <Button size="sm" variant="outline">Create Presentation</Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-500" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/professor/ai-tools/ppt-generator" >
              <Button variant="outline" size="sm" className="w-full justify-start bg-transparent">
                <Presentation className="w-4 h-4 mr-2" />
                Generate Presentation
              </Button>
            </Link>
            <Link href="/professor/ai-tools/quiz-generator" >
              <Button variant="outline" size="sm" className="mt-3 w-full justify-start bg-transparent">
                <Brain className="w-4 h-4 mr-2" />
                Generate Quick Quiz
              </Button>
            </Link>
            <Link href="/professor/ai-tools/lesson-planner" >
              <Button variant="outline" size="sm" className="mt-3 w-full justify-start bg-transparent">
                <Presentation className="w-4 h-4 mr-2" />
                Generate Lesson Plan
              </Button>
            </Link>
            <Link href="/professor/ai-tools/code-checker" >
              <Button variant="outline" size="sm" className="mt-3 w-full justify-start bg-transparent">
                <Code2 className="w-4 h-4 mr-2" />
                Check Programming Code
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="w-5 h-5 text-green-500" />
              Usage Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Quizzes Generated</span>
              <Badge variant="secondary">24</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Essays Checked</span>
              <Badge variant="secondary">18</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Lessons Planned</span>
              <Badge variant="secondary">12</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Presentations Made</span>
              <Badge variant="secondary">8</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm">
              <p className="font-medium">Programming Quiz - Java</p>
              <p className="text-muted-foreground text-xs">2 hours ago</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">Quiz Check - Web Development</p>
              <p className="text-muted-foreground text-xs">5 hours ago</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">Lesson Plan - Programming</p>
              <p className="text-muted-foreground text-xs">1 day ago</p>
            </div>
            <div className="text-sm">
              <p className="font-medium">PPT - Java Programming Intro</p>
              <p className="text-muted-foreground text-xs">2 days ago</p>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  )
}
