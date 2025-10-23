"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Trophy, Medal, Award, TrendingUp, Star, Crown, Target, Zap, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"

interface StudentData {
  student_id: number
  name: string
  email: string
  grade: number
  trend: string
  assignments: number
  participation: number
  avatar: string | null
  badges: string[]
}

interface LeaderboardData {
  students: StudentData[]
  achievements: {
    "Perfect Attendance": number
    "Top Scorer": number
    "Improved Student": number
    "Consistent Performer": number
    "Active Participant": number
  }
  classStats: {
    classAverage: number
    assignmentCompletion: number
    activeParticipation: number
    aboveAverage: number
    needSupport: number
  }
}

const achievementIcons = [
  { name: "Perfect Attendance", icon: Star, color: "text-yellow-500" },
  { name: "Top Scorer", icon: Trophy, color: "text-gold-500" },
  { name: "Improved Student", icon: TrendingUp, color: "text-green-500" },
  { name: "Consistent Performer", icon: Target, color: "text-blue-500" },
  { name: "Active Participant", icon: Zap, color: "text-purple-500" },
]

export function LeaderboardsContent() {
  const params = useParams()
  const classId = params?.classID as string
  
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch leaderboard data from API
  useEffect(() => {
    async function fetchLeaderboardData() {
      if (!classId) return
      
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/professor/leaderboard?class_id=${classId}`)
        
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard data")
        }
        
        const data = await response.json()
        setLeaderboardData(data)
      } catch (err) {
        console.error("Error fetching leaderboard:", err)
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }
    
    fetchLeaderboardData()
  }, [classId])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>
    }
  }

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Badge className="bg-gradient-to-r from-yellow-400 to-yellow-600 text-white">🥇 1st Place</Badge>
      case 2:
        return <Badge className="bg-gradient-to-r from-gray-300 to-gray-500 text-white">🥈 2nd Place</Badge>
      case 3:
        return <Badge className="bg-gradient-to-r from-amber-400 to-amber-600 text-white">🥉 3rd Place</Badge>
      default:
        return <Badge variant="outline">#{rank}</Badge>
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading leaderboard data...</p>
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
  if (!leaderboardData || leaderboardData.students.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">No student data available yet.</p>
        </div>
      </div>
    )
  }

  // Extract data
  const allStudents = leaderboardData.students
  const topPerformers = allStudents.slice(0, 3)
  const achievements = achievementIcons.map(achievement => ({
    ...achievement,
    count: leaderboardData.achievements[achievement.name as keyof typeof leaderboardData.achievements]
  }))

  return (
    <div className="space-y-6">
      {/* <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="h-8 w-8 text-primary" />
            Class Leaderboards
          </h1>
          <p className="text-muted-foreground">Celebrate student achievements and track class performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="math101">Capstone 1</SelectItem>
              <SelectItem value="physics201">Physics 201</SelectItem>
              <SelectItem value="chem301">Chemistry 301</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Current</SelectItem>
              <SelectItem value="midterm">Midterm</SelectItem>
              <SelectItem value="monthly">This Month</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div> */}

      {/* Top 3 Podium */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Top Performers
          </CardTitle>
          <CardDescription>Outstanding students leading the class</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            {topPerformers.map((student, index) => (
              <div
                key={student.student_id}
                className={`relative p-6 rounded-2xl border-2 ${
                  index === 0
                    ? "bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-300 dark:border-yellow-700"
                    : index === 1
                      ? "bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 border-gray-300 dark:border-gray-700"
                      : "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border-amber-300 dark:border-amber-700"
                }`}
              >
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">{getRankBadge(index + 1)}</div>
                <div className="text-center space-y-4 mt-2">
                  <Avatar className="h-16 w-16 mx-auto border-4 border-white dark:border-gray-800">
                    <AvatarImage src={student.avatar || "/placeholder.svg"} />
                    <AvatarFallback className="text-lg font-semibold">
                      {student.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-lg">{student.name}</h3>
                    <p className="text-sm text-muted-foreground">{student.email}</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-primary">{student.grade}%</div>
                    <div className={`flex items-center justify-center gap-1 text-sm ${
                      parseFloat(student.trend) > 0 
                        ? "text-green-600 dark:text-green-400" 
                        : parseFloat(student.trend) < 0 
                          ? "text-red-600 dark:text-red-400"
                          : "text-muted-foreground"
                    }`}>
                      <TrendingUp className={`h-3 w-3 ${parseFloat(student.trend) < 0 ? "rotate-180" : ""}`} />
                      {student.trend}%
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {student.badges.map((badge, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {badge}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Full Leaderboard */}
      <Card className="modern-card">
        <CardHeader>
          <CardTitle>Complete Class Rankings</CardTitle>
          <CardDescription>All students ranked by overall performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {allStudents.map((student, index) => (
              <div
                key={student.student_id}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:shadow-md ${
                  index < 3 ? "bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20" : "bg-card"
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted">
                  {getRankIcon(index + 1)}
                </div>

                <Avatar className="h-12 w-12">
                  <AvatarImage src={student.avatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    {student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-semibold">{student.name}</h4>
                    <div className="text-right">
                      <div className="text-xl font-bold text-primary">{student.grade}%</div>
                      <div
                        className={`text-sm flex items-center gap-1 ${
                          parseFloat(student.trend) > 0
                            ? "text-green-600 dark:text-green-400"
                            : parseFloat(student.trend) < 0
                              ? "text-red-600 dark:text-red-400"
                              : "text-muted-foreground"
                        }`}
                      >
                        <TrendingUp className={`h-3 w-3 ${parseFloat(student.trend) < 0 ? "rotate-180" : ""}`} />
                        {student.trend}%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                    <div>Participation: {student.participation}%</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">
                      {student.badges.map((badge, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {badge}
                        </Badge>
                      ))}
                    </div>
                    <Progress value={student.grade} className="w-24 h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievement System */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="modern-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-primary" />
              Achievement System
            </CardTitle>
            <CardDescription>Student badges and accomplishments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {achievements.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-muted ${achievement.color}`}>
                    <achievement.icon className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{achievement.name}</span>
                  </div>
                  <Badge variant="secondary">{achievement.count} students</Badge>
                </div>
            ))}
          </CardContent>
        </Card>

        <Card className="modern-card">
          <CardHeader>
            <CardTitle>Class Statistics</CardTitle>
            <CardDescription>
              Overall performance metrics. Student trends compare the most recent cumulative average with the immediately previous cumulative average.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Class Average</span>
                <span className="font-medium">{leaderboardData.classStats.classAverage}%</span>
              </div>
              <Progress value={leaderboardData.classStats.classAverage} className="h-3" />
            </div>

            {/* <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Assignment Completion</span>
                <span className="font-medium">{leaderboardData.classStats.assignmentCompletion}%</span>
              </div>
              <Progress value={leaderboardData.classStats.assignmentCompletion} className="h-3" />
            </div> */}

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Attendance Rate</span>
                <span className="font-medium">{leaderboardData.classStats.activeParticipation}%</span>
              </div>
              <Progress value={leaderboardData.classStats.activeParticipation} className="h-3" />
            </div>

            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{leaderboardData.classStats.aboveAverage}</div>
                  <div className="text-xs text-muted-foreground">Above Average</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{leaderboardData.classStats.needSupport}</div>
                  <div className="text-xs text-muted-foreground">Need Support</div>
                </div>
              </div>
              
              
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {/* <Card className="modern-card">
        <CardHeader>
          <CardTitle>Recognition Actions</CardTitle>
          <CardDescription>Celebrate and motivate your students</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button className="h-auto p-4 flex-col gap-2 modern-button">
              <Trophy className="h-6 w-6" />
              <span>Send Congratulations</span>
              <span className="text-xs opacity-80">To top performers</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
              <Award className="h-6 w-6" />
              <span>Award Badges</span>
              <span className="text-xs text-muted-foreground">Recognize achievements</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
              <TrendingUp className="h-6 w-6" />
              <span>Motivate Strugglers</span>
              <span className="text-xs text-muted-foreground">Encourage improvement</span>
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  )
}
