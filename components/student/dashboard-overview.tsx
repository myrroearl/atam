"use client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { StatsCard } from "@/components/ui/stats-card"
import { BookOpen, TrendingUp, Trophy, AlertCircle, CheckCircle, Crown, Users } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"
import { useStudentDashboard, useStudentLeaderboard, useLearningResourcesCount, useBookmarksCount } from "@/hooks/use-student-data"
import { Loading, SkeletonCard, SkeletonChart } from "@/components/ui/loading"
import { usePrivacy } from "@/contexts/privacy-context"
import { shouldHideProfile, getMaskedName, getMaskedAvatarFallback } from "@/lib/student/privacy-utils"
import { ErrorBoundary } from "@/components/ui/error-boundary"

type Student = {
  id: number
  name: string
  section: string
  course: string
  profilePicture?: string
}

type SubjectGrade = {
  subjectId: number
  subjectName: string
  subjectCode: string
  units: number
  percentage: number
  gpa: number
  components: Array<{
    componentName: string
    weight: number
    percentage: number
  }>
}

type RecentEntry = {
  id: number
  name: string
  score: number
  maxScore: number
  percentage: number
  date: string
  subject: string
}

type DashboardData = {
  student: Student
  subjects: SubjectGrade[]
  overallGPA: number
  weightedAverage: number
  totalUnits: number
  recentEntries: RecentEntry[]
  finalGrades: any[]
}

type LeaderRow = { rank: number; name: string; gpa: number | null; avatar?: string; course?: string; isCurrentUser?: boolean }

export function DashboardOverview() {
  // Data hooks
  const { data: dashboardData, loading: dashboardLoading, error: dashboardError } = useStudentDashboard()
  const { data: leaderboardData, loading: leaderboardLoading, error: leaderboardError } = useStudentLeaderboard()
  const { data: resourcesData, loading: resourcesLoading, error: resourcesError } = useLearningResourcesCount()
  const { data: bookmarksData, loading: bookmarksLoading, error: bookmarksError } = useBookmarksCount()
  const { privacySettings } = usePrivacy()
  
  // Combined loading/error states
  const loading = dashboardLoading || leaderboardLoading || resourcesLoading || bookmarksLoading
  const error = dashboardError || leaderboardError || resourcesError || bookmarksError
  
  // Extract leaderboard data
  const leaders = (leaderboardData as any)?.leaderboard || []
  const currentAccountId = (leaderboardData as any)?.currentAccountId

  // Prepare subject grades for bar chart (top 5 subjects)
  const gradeData = useMemo(() => {
    if (!(dashboardData as any)?.subjects) return []
    return (dashboardData as any).subjects.slice(0, 5).map((subject: any) => ({ 
      subject: subject.subjectCode, 
      grade: subject.percentage 
    }))
  }, [dashboardData])

  // Calculate weekly performance averages from recent entries
  const performanceData = useMemo(() => {
    if (!(dashboardData as any)?.recentEntries) return []
    
    // Group entries by week and calculate average scores
    const weeklyData: Record<string, { total: number; count: number }> = {}
    
    const recentEntries = (dashboardData as any)?.recentEntries || []
    recentEntries.forEach((entry: any) => {
      const week = new Date(entry.date).toISOString().split('T')[0]
      if (!weeklyData[week]) {
        weeklyData[week] = { total: 0, count: 0 }
      }
      weeklyData[week].total += entry.percentage
      weeklyData[week].count += 1
    })

    // Convert to array format and sort by date
    return Object.entries(weeklyData).map(([week, data]) => ({
      month: week,
      score: Math.round((data.total / data.count) * 100) / 100
    })).sort((a, b) => a.month.localeCompare(b.month))
  }, [dashboardData])

  // Get top 5 from leaderboard and current user's rank
  const top5Leaderboard = useMemo(() => leaders.slice(0, 5), [leaders])
  const currentUser = leaders.find((l: any) => l.isCurrentUser)
  const userRank = currentUser?.rank || 0

  // Get badge color based on rank (1st gold, 2nd silver, 3rd bronze)
  const getRankBadge = (rank: number) => {
    const colors = {
      1: "bg-yellow-500 text-primary-foreground",
      2: "bg-gray-500 text-primary-foreground",
      3: "bg-amber-500 text-primary-foreground",
      4: " text-primary-foreground",
      5: " text-primary-foreground",
    }
    return colors[rank as keyof typeof colors] || "bg-blue-500 text-primary-foreground"
  }

  // Get status badge color based on academic standing
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "President's Lister":
        return "bg-red-500 text-primary-foreground"
      case "Dean's Lister":
        return "bg-orange-500 text-primary-foreground"
      case "Honor Student":
        return "bg-green-500 text-primary-foreground"
      default:
        return "bg-gray-500 text-primary-foreground"
    }
  }

  // Loading skeleton UI
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col space-y-2">
          <div className="h-8 bg-muted rounded w-64 animate-pulse"></div>
          <div className="h-4 bg-muted rounded w-96 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-semibold text-red-800">Error Loading Dashboard</h3>
          </div>
          <p className="text-sm text-red-600 mt-2">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline" 
            size="sm" 
            className="mt-4"
          >
            Reload Page
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
      {/* Welcome header with student info */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back, {(dashboardData as any)?.student?.name || 'Student'}!
          </h1>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                {(dashboardData as any)?.student?.email || 'student@email.com'}
              </p>
              <p className="text-sm text-muted-foreground opacity-90">
                {(dashboardData as any)?.student?.year_level || 'Year Level'} - {(dashboardData as any)?.student?.section || 'Section'} - {(dashboardData as any)?.student?.current_semester || 'Semester'}
              </p>
            </div>
          </div>
        </div>
        
       
      </div>

      {/* Summary stats cards: GWA, Active Courses, Rank, Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="GWA"
          value={(dashboardData as any)?.overallGPA ? (dashboardData as any).overallGPA.toFixed(2) : '0.00'}
          description={(dashboardData as any)?.totalUnits ? `${(dashboardData as any).totalUnits} units` : 'No units'}
          icon={Trophy}
          iconColor="text-yellow-500"
        />

        <StatsCard
          title="Active Courses"
          value={(dashboardData as any)?.subjects?.length || 0}
          description="Active courses"
          icon={BookOpen}
          iconColor="text-blue-500"
        />

        <StatsCard
          title="Rank"
          value={userRank ? `#${userRank}` : '-'}
          description="in overall ranking"
          icon={TrendingUp}
          iconColor="text-emerald-500"
        />

        <StatsCard
          title="Learning Resources"
          value={(resourcesData as any)?.totalResources || 0}
          description={`${(bookmarksData as any)?.bookmarksCount || 0} bookmarked`}
          icon={BookOpen}
          iconColor="text-purple-500"
        />
      </div>

      

      {/* Charts: Subject performance bar chart and performance trend line chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg dark:shadow-card-lg rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle>Subject Performance</CardTitle>
            <CardDescription>Your current grades by subject</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="subject" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="grade" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg dark:shadow-card-lg rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
            <CardDescription>Your academic progress over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--chart-2))" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom section: Top 5 leaderboard and latest grade entries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Leaderboard - Compact Version */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-xl rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Users className="w-4 h-4" />
              <span>Top 5 Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {/* Highlight current user's rank */}
            <div
              className={cn(
                "p-2 rounded-lg border border-border",
                userRank <= 3
                  ? "bg-yellow-100/20"
                  : "bg-blue-100/20"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ProfileAvatar size="sm" className="border border-white shadow-sm" />
                  <span className="font-medium text-lg">Your Position</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className={cn("text-sm px-2 py-1", getRankBadge(userRank))}>#{userRank}</Badge>
                  {userRank <= 3 && <Crown className="w-3 h-3 text-yellow-500" />}
                </div>
              </div>
            </div>

            {/* Display top 5 students with privacy masking */}
            <div className="space-y-1">
              {top5Leaderboard.map((student: any, index: number) => {
                // Apply privacy settings to hide sensitive data
                const shouldHide = shouldHideProfile(student, currentAccountId)
                const displayName = shouldHide ? getMaskedName(student.name, student.student_id) : student.name
                const displayCourse = shouldHide ? 'Private' : (student.course || '')
                const avatarFallback = shouldHide ? getMaskedAvatarFallback(student.name, student.student_id) : 
                  student.name.split(" ").map((n: string) => n[0]).join("")
                
                return (
                  <div
                    key={student.rank}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-md transition-all duration-300",
                      student.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted/30 hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <Badge className={cn("text-sm px-2 py-1", getRankBadge(student.rank))}>{student.rank}</Badge>
                      <Avatar className="w-5 h-5 flex-shrink-0">
                        <AvatarImage src={shouldHide ? "/placeholder.svg" : (student.avatar || "/placeholder.svg")} alt={displayName} />
                        <AvatarFallback className="text-xs text-foreground">
                          {avatarFallback}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm truncate">{displayName}</p>
                        <p className="text-sm opacity-75 truncate">{displayCourse}</p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <div className="text-sm font-bold">{student.gpa?.toFixed(2)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <Link href="/student/leaderboard" className="block mt-2">
              <Button className="w-full bg-transparent" variant="outline" size="sm">
                View Full Leaderboard
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Latest 5 grade entries with score and percentage */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-xl rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <div className="w-4 h-4 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-2 h-2 text-white" />
              </div>
              <span>Latest Grades</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(() => {
              const recentEntries = (dashboardData as any)?.recentEntries || []
              
              // Show empty state if no entries
              if (recentEntries.length === 0) {
                return (
                  <div className="p-2 rounded-lg bg-gray-100/20">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-3 h-3 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-xs">No Recent Grades</p>
                        <p className="text-xs text-muted-foreground">No recent entries available.</p>
                      </div>
                    </div>
                  </div>
                )
              }

              const latestEntries = recentEntries.slice(0, 5)
              
              return (
                <>
                  {latestEntries.map((entry: any, idx: number) => (
                    <div key={`entry-${idx}`} className="flex items-center justify-between p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-all duration-300">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full flex-shrink-0"></div>
                          <p className="font-medium text-xs truncate">{entry.name}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{entry.subject}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-2">
                        <div className="text-xs font-bold">
                          {entry.score}/{entry.maxScore}
                        </div>
                        {/* Color-coded badge by percentage */}
                        <Badge 
                          variant="secondary" 
                          className={cn(
                            "text-xs px-1.5 py-0.5",
                            entry.percentage >= 90 ? "bg-green-100 text-green-800" :
                            entry.percentage >= 80 ? "bg-blue-100 text-blue-800" :
                            entry.percentage >= 70 ? "bg-yellow-100 text-yellow-800" :
                            "bg-red-100 text-red-800"
                          )}
                        >
                          {entry.percentage.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                  
                  <Link href="/student/subjects/grades" className="block mt-2">
                    <Button className="w-full bg-transparent" variant="outline" size="sm">
                      View All Grades
                    </Button>
                  </Link>
                </>
              )
            })()}
          </CardContent>
        </Card>
      </div>
      </div>
    </ErrorBoundary>
  )
}