"use client"

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  ArrowLeft, 
  Download, 
  Printer, 
  GraduationCap, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target, 
  Award, 
  FileText, 
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  Brain,
  BarChart3,
  PieChart,
  Loader2
} from "lucide-react"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts'

interface StudentProfileContentProps {
  studentId: string
}

interface TopicData {
  topic: string
  totalScore: number
  totalMaxScore: number
  entries: any[]
  average: number
  trend: 'up' | 'down' | 'stable'
  lastScore?: number
  previousScore?: number
}

interface GradeEntry {
  grade_id: number
  score: number
  max_score: number
  attendance: string | null
  entry_type: string
  date_recorded: string
  grade_period: string
  name: string
  component_id: number
  topics: string[]
}

interface StudentData {
  student_id: number
  name: string
  email: string
  overallAverage: number
  topics: TopicData[]
  performanceTrends: Array<{
    date: string
    average: number
    entries: number
  }>
  attendanceStats: {
    totalDays: number
    present: number
    late: number
    absent: number
    attendanceRate: number
  }
  skillsMastery: {
    mastered: string[]
    developing: string[]
    needsImprovement: string[]
  }
  totalEntries: number
  lastUpdated: string
  gradeEntries: GradeEntry[]
}

export function StudentProfileContent({ studentId }: StudentProfileContentProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStudentData() {
      try {
        setLoading(true)
        setError(null)
        
        console.log('[Student Profile] Fetching data for studentId:', studentId)
        const response = await fetch(`/api/professor/student-profile?student_id=${studentId}`)
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("API Error:", response.status, errorData)
          throw new Error(errorData.error || `Failed to fetch student data (${response.status})`)
        }
        
        const data = await response.json()
        setStudentData(data.student)
      } catch (err) {
        console.error("Error fetching student data:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchStudentData()
  }, [studentId])

  const handleBack = () => {
    router.back()
  }

  const handleExport = () => {
    window.print()
  }

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return 'text-green-600 dark:text-green-400'
      case 'down': return 'text-red-600 dark:text-red-400'
      case 'stable': return 'text-blue-600 dark:text-blue-400'
      default: return 'text-gray-600 dark:text-gray-400'
    }
  }

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />
      case 'stable': return <BarChart3 className="h-4 w-4 text-blue-500" />
      default: return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading student profile...</span>
        </div>
      </div>
    )
  }

  if (error || !studentData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Profile</h2>
          <p className="text-muted-foreground mb-4">{error || "Student data not found"}</p>
          <Button onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Class
          </Button>
        </div>
      </div>
    )
  }

  // Prepare data for attendance pie chart
  const attendancePieData = studentData ? [
    { name: 'Present', value: studentData.attendanceStats.present, color: '#00C49F' },
    { name: 'Late', value: studentData.attendanceStats.late, color: '#FFBB28' },
    { name: 'Absent', value: studentData.attendanceStats.absent, color: '#FF8042' }
  ] : []

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Class
              </Button>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src="/placeholder-user.jpg" alt={studentData.name} />
                  <AvatarFallback>{studentData.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div>
                  <h1 className="text-2xl font-bold">{studentData.name}</h1>
                  <p className="text-muted-foreground">Student ID: {studentData.student_id}</p>
                  <p className="text-sm text-muted-foreground">{studentData.email}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExport}>
                <Printer className="h-4 w-4 mr-2" />
                Print Profile
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="academic">Grade Entries</TabsTrigger>
            <TabsTrigger value="summary">Summary of Grades</TabsTrigger>
            <TabsTrigger value="topics">Topics Mastery</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{studentData.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{studentData.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                    <Badge variant="default">{studentData.totalEntries} entries</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Academic Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Average</p>
                    <p className="text-2xl font-bold text-primary">{studentData.overallAverage}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Topics Covered</p>
                    <p className="text-xl font-semibold">{studentData.topics.length} topics</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Rate</span>
                      <span className="font-medium">{studentData.attendanceStats.attendanceRate}%</span>
                    </div>
                    <Progress value={studentData.attendanceStats.attendanceRate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {studentData.attendanceStats.present}/{studentData.attendanceStats.totalDays} days present
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Performance Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Improving Topics</p>
                      <p className="text-lg font-bold text-green-600">
                        {studentData.topics.filter(t => t.trend === 'up').length}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Needs Attention</p>
                      <p className="text-lg font-bold text-red-600">
                        {studentData.topics.filter(t => t.trend === 'down').length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Topic Performance Strengths and Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Strong Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentData.topics
                      .filter(topic => topic.average >= 85)
                      .map(topic => (
                        <div key={topic.topic} className="flex items-center justify-between">
                          <span className="font-medium">{topic.topic}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-green-600 font-bold">{topic.average}%</span>
                            {getTrendIcon(topic.trend)}
                          </div>
                        </div>
                      ))}
                    {studentData.topics.filter(topic => topic.average >= 85).length === 0 && (
                      <p className="text-muted-foreground text-sm">No topics with 85%+ average yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                    Topics Needing Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {studentData.topics
                      .filter(topic => topic.average < 75)
                      .map(topic => (
                        <div key={topic.topic} className="flex items-center justify-between">
                          <span className="font-medium">{topic.topic}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-red-600 font-bold">{topic.average}%</span>
                            {getTrendIcon(topic.trend)}
                          </div>
                        </div>
                      ))}
                    {studentData.topics.filter(topic => topic.average < 75).length === 0 && (
                      <p className="text-muted-foreground text-sm">All topics are performing well!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Performance Trends Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Performance Trends Over Time
                </CardTitle>
                <CardDescription>Daily average performance based on grade entries</CardDescription>
              </CardHeader>
              <CardContent>
                {studentData.performanceTrends.length > 0 ? (
                  <ChartContainer 
                    config={{
                      average: { label: "Daily Average", color: "#8884d8" }
                    }}
                    className="h-80"
                  >
                    <LineChart data={studentData.performanceTrends}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="date" 
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="average" 
                        stroke="#8884d8" 
                        strokeWidth={3}
                        dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No performance data available yet</p>
                    <p className="text-sm">Grades will appear here as they are recorded</p>
                      </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Academic Tab - Grade Entries Only */}
          <TabsContent value="academic" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Grade Entries
                </CardTitle>
                <CardDescription>All grade entries with dates and details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentData.gradeEntries && studentData.gradeEntries.length > 0 ? (
                    studentData.gradeEntries.map((entry) => (
                      <div key={entry.grade_id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">
                                {entry.topics && entry.topics.length > 0 
                                  ? entry.topics.join(', ') 
                                  : entry.name || 'Untitled Entry'
                                }
                              </h4>
                              {entry.topics && entry.topics.length > 1 && (
                                <Badge variant="outline" className="text-xs">
                                  {entry.topics.length} topics
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {new Date(entry.date_recorded).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </Badge>
                              <Badge variant="secondary">
                                {entry.entry_type}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-6">
                            {entry.attendance !== null ? (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Attendance:</span>
                                <Badge 
                                  variant={entry.attendance === 'present' ? 'default' : 
                                          entry.attendance === 'late' ? 'secondary' : 'destructive'}
                                >
                                  {entry.attendance}
                                </Badge>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">Score:</span>
                                <span className="font-bold text-lg">
                                  {entry.score}/{entry.max_score}
                                </span>
                                <span className="text-sm text-muted-foreground">
                                  ({Math.round((entry.score / entry.max_score) * 100)}%)
                                </span>
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Period:</span>
                              <span className="font-medium">{entry.grade_period}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No grade entries available yet</p>
                      <p className="text-sm">Grades will appear here as they are recorded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Summary of Grades Tab */}
          <TabsContent value="summary" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Grade Summary Overview
                </CardTitle>
                <CardDescription>Comprehensive view of student's academic performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Overall Statistics */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Overall Performance</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Overall Average</span>
                        <span className="text-2xl font-bold text-primary">{studentData.overallAverage}%</span>
                        </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Topics</span>
                        <span className="font-semibold">{studentData.topics.length}</span>
                          </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Entries</span>
                        <span className="font-semibold">{studentData.totalEntries}</span>
                        </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Attendance Rate</span>
                        <span className="font-semibold text-green-600">{studentData.attendanceStats.attendanceRate}%</span>
                      </div>
                        </div>
                    </div>

                  {/* Performance Distribution */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Performance Distribution</h4>
                    <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-green-600">Excellent (85%+)</span>
                        <span className="font-semibold">{studentData.topics.filter(t => t.average >= 85).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-blue-600">Good (70-84%)</span>
                        <span className="font-semibold">{studentData.topics.filter(t => t.average >= 70 && t.average < 85).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-yellow-600">Fair (60-69%)</span>
                        <span className="font-semibold">{studentData.topics.filter(t => t.average >= 60 && t.average < 70).length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-red-600">Needs Improvement (&lt;60%)</span>
                        <span className="font-semibold">{studentData.topics.filter(t => t.average < 60).length}</span>
                    </div>
                      </div>
                    </div>

                  {/* Trend Analysis */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-lg">Trend Analysis</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-green-600">Improving</span>
                        <span className="font-semibold">{studentData.topics.filter(t => t.trend === 'up').length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-blue-600">Stable</span>
                        <span className="font-semibold">{studentData.topics.filter(t => t.trend === 'stable').length}</span>
                    </div>
                      <div className="flex justify-between items-center">
                        <span className="text-red-600">Declining</span>
                        <span className="font-semibold">{studentData.topics.filter(t => t.trend === 'down').length}</span>
                </div>
                        </div>
                      </div>
                    </div>

                {/* Performance Trends Chart */}
                <div className="mt-8">
                  <h4 className="font-semibold text-lg mb-4">Performance Trends Over Time</h4>
                  {studentData.performanceTrends.length > 0 ? (
                    <ChartContainer 
                      config={{
                        average: { label: "Daily Average", color: "#8884d8" }
                      }}
                      className="h-80"
                    >
                      <LineChart data={studentData.performanceTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        />
                        <YAxis domain={[0, 100]} />
                        <ChartTooltip 
                          content={<ChartTooltipContent />}
                          labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="average" 
                          stroke="#8884d8" 
                          strokeWidth={3}
                          dot={{ fill: '#8884d8', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ChartContainer>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No performance trends available yet</p>
                      <p className="text-sm">Trends will appear here as grades are recorded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Topics Mastery Tab */}
          <TabsContent value="topics" className="space-y-6">
            {/* Topic Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Topic Performance Overview
                </CardTitle>
                <CardDescription>Performance trends and mastery levels by topic (from topics column in grade entries)</CardDescription>
              </CardHeader>
              <CardContent>
                {studentData.topics.length > 0 ? (
                  <ChartContainer 
                    config={{
                      average: { label: "Average Score", color: "#8884d8" }
                    }}
                    className="h-80"
                  >
                    <BarChart data={studentData.topics}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="topic" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={100}
                      />
                      <YAxis domain={[0, 100]} />
                      <ChartTooltip 
                        content={<ChartTooltipContent />}
                        labelFormatter={(value) => `Topic: ${value}`}
                      />
                      <Bar 
                        dataKey="average" 
                        fill="#8884d8"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ChartContainer>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No topic data available yet</p>
                    <p className="text-sm">Topic performance will appear here as grades are recorded</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Topic Mastery Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Mastery Level Distribution
                </CardTitle>
                <CardDescription>Distribution of topics across mastery levels (based on topics column data)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-green-600 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      Mastered Topics (85%+)
                    </h4>
                    <div className="space-y-2">
                      {studentData.skillsMastery.mastered.map((topic, index) => (
                        <Badge key={index} variant="default" className="mr-2 mb-2">
                          {topic}
                        </Badge>
                      ))}
                      {studentData.skillsMastery.mastered.length === 0 && (
                        <p className="text-sm text-muted-foreground">No topics mastered yet</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-yellow-600 mb-3 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Developing Topics (70-84%)
                    </h4>
                    <div className="space-y-2">
                      {studentData.skillsMastery.developing.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="mr-2 mb-2">
                          {topic}
                        </Badge>
                      ))}
                      {studentData.skillsMastery.developing.length === 0 && (
                        <p className="text-sm text-muted-foreground">No topics in development</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600 mb-3 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Needs Improvement (&lt;70%)
                    </h4>
                    <div className="space-y-2">
                      {studentData.skillsMastery.needsImprovement.map((topic, index) => (
                        <Badge key={index} variant="destructive" className="mr-2 mb-2">
                          {topic}
                        </Badge>
                      ))}
                      {studentData.skillsMastery.needsImprovement.length === 0 && (
                        <p className="text-sm text-muted-foreground">All topics performing well!</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Topic Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Detailed Topic Analysis
                </CardTitle>
                <CardDescription>Individual topic performance with trends and insights (grouped by topics column)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentData.topics.map((topic) => (
                    <div key={topic.topic} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{topic.topic}</h4>
                          <span className="text-sm text-muted-foreground">{topic.entries.length} entries</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Average: </span>
                            <span className="font-bold text-lg">{topic.average}%</span>
                          </div>
                          <div>
                            <span className="text-sm text-muted-foreground">Total Score: </span>
                            <span className="font-medium">{topic.totalScore}/{topic.totalMaxScore}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            {getTrendIcon(topic.trend)}
                            <span className={`text-sm font-medium ${getTrendColor(topic.trend)}`}>
                              {topic.trend}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Progress 
                        value={topic.average} 
                        className="w-24 h-2 ml-4" 
                      />
                    </div>
                  ))}
                  {studentData.topics.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No topic data available yet</p>
                      <p className="text-sm">Topic analysis will appear here as grades are recorded</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
} 