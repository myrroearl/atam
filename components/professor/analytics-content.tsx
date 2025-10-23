"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Users, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface PerformanceDataPoint {
  date: string
  average: number
  attendance: number
}

interface GradeDistribution {
  grade: string
  count: number
  percentage: number
}

interface PieDataPoint {
  name: string
  value: number
  color: string
}

interface AssignmentPerformance {
  name: string
  average: number
}

interface AnalyticsData {
  keyMetrics: {
    classAverage: number
    trend: number
    attendanceRate: number
    atRiskStudents: number
    assignmentCompletion: number
  }
  performanceData: PerformanceDataPoint[]
  gradeDistribution: GradeDistribution[]
  pieData: PieDataPoint[]
  assignmentPerformance: AssignmentPerformance[]
  engagement: {
    participationLevel: string
    questionFrequency: number
    officeHoursVisits: number
    onlineDiscussion: string
  }
  improvementAreas: {
    weakTopics: number
    strongTopics: number
    totalTopics: number
  }
  recommendations: {
    needsReview: boolean
    atRiskCount: number
    topPerformers: number
  }
}

export function AnalyticsContent() {
  const params = useParams()
  const classId = params?.classID as string
  
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch analytics data from API
  useEffect(() => {
    async function fetchAnalyticsData() {
      if (!classId) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/professor/analytics?class_id=${classId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch analytics data")
        }
        
        const data = await response.json()
        setAnalyticsData(data)
      } catch (err) {
        console.error("Error fetching analytics:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchAnalyticsData()
  }, [classId])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading analytics data...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  // No data state
  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">No analytics data available yet.</p>
        </div>
      </div>
    )
  }

  // Extract data
  const { keyMetrics, performanceData, gradeDistribution, pieData, assignmentPerformance, engagement, improvementAreas, recommendations } = analyticsData
  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Class Analytics
          </h1>
          <p className="text-muted-foreground">Comprehensive performance insights and trends for your classes</p>
        </div>
        <Select defaultValue="math101">
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="math101">Capstone 1</SelectItem>
            <SelectItem value="physics201">Java Programming</SelectItem>
            <SelectItem value="chem301">Web Development</SelectItem>
            <SelectItem value="all">All Classes</SelectItem>
          </SelectContent>
        </Select>
      </div> */}

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Class Average</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{keyMetrics.classAverage}%</div>
            <p className={`text-xs mt-1 ${keyMetrics.trend >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {keyMetrics.trend >= 0 ? '+' : ''}{keyMetrics.trend}% vs previous average
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Attendance Rate</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{keyMetrics.attendanceRate}%</div>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              {keyMetrics.attendanceRate >= 90 ? 'Excellent attendance' : keyMetrics.attendanceRate >= 75 ? 'Good attendance' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">At-Risk Students</CardTitle>
            <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{keyMetrics.atRiskStudents}</div>
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">Need attention</p>
          </CardContent>
        </Card>

        {/* <Card className="stats-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assignment Completion</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{keyMetrics.assignmentCompletion}%</div>
            <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">On-time submissions</p>
          </CardContent>
        </Card> */}
      </div>

      {/* Performance Trends */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Class average trends over time. Trend compares most recent average with immediately previous average.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="average"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  name="Class Average"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Current grade breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span>{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Average Per Component</CardTitle>
            <CardDescription>Component averages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {assignmentPerformance.length > 0 ? (
              assignmentPerformance.map((assignment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{assignment.name}</span>
                    <span className="font-medium">{assignment.average}%</span>
                  </div>
                  <Progress value={assignment.average} className="h-2" />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No assignment data available yet</p>
            )}
          </CardContent>
        </Card>

        

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Improvement Areas</CardTitle>
            <CardDescription>Suggested focus areas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {improvementAreas.weakTopics > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800">
                <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Below Average Assignments</p>
                  <p className="text-xs text-muted-foreground">{improvementAreas.weakTopics} assignment(s) below class average</p>
                </div>
              </div>
            )}
            {keyMetrics.trend > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Improving Performance</p>
                  <p className="text-xs text-muted-foreground">Strong performance trend</p>
                </div>
              </div>
            )}
            {improvementAreas.strongTopics > 0 && (
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">High Performing Assignments</p>
                  <p className="text-xs text-muted-foreground">{improvementAreas.strongTopics} assignment(s) with excellent results</p>
                </div>
              </div>
            )}
            {improvementAreas.totalTopics === 0 && (
              <p className="text-sm text-muted-foreground">No data available yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Action Items */}
      {/* <Card className="modern-card">
        <CardHeader>
          <CardTitle>Recommended Actions</CardTitle>
          <CardDescription>AI-suggested improvements based on class performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {recommendations.needsReview && (
              <div className="p-4 rounded-lg border bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                <h4 className="font-medium mb-2">Schedule Review Session</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Consider scheduling a review session - {recommendations.atRiskCount} student{recommendations.atRiskCount !== 1 ? 's' : ''} struggling
                </p>
                <Button size="sm" className="modern-button">
                  Schedule Session
                </Button>
              </div>
            )}
            {recommendations.topPerformers > 0 && (
              <div className="p-4 rounded-lg border bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                <h4 className="font-medium mb-2">Recognize Top Performers</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  {recommendations.topPerformers} student{recommendations.topPerformers !== 1 ? 's' : ''} showing exceptional performance - consider recognition
                </p>
                <Button size="sm" variant="outline">
                  Send Recognition
                </Button>
              </div>
            )}
            {!recommendations.needsReview && recommendations.topPerformers === 0 && (
              <p className="text-sm text-muted-foreground col-span-2">No specific recommendations at this time. Keep up the good work!</p>
            )}
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
