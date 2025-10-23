"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Users,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Star,
  ArrowRight,
  GraduationCap,
  TrendingDown,
  Activity,
  Sparkles,
  Clock,
} from "lucide-react"
import Link from "next/link"
import { Progress } from "@/components/ui/progress"

type ClassStats = {
  class_id: number
  class_name: string
  subject_name: string
  subject_code: string
  section_name: string
  student_count: number
  at_risk_count: number
}

type RecentActivity = {
  type: string
  title: string
  description: string
  time: string
}

type GradeDistribution = {
  A: number
  B: number
  C: number
  D: number
  F: number
}

type DashboardData = {
  professor: {
    name: string
    department: string
  }
  stats: {
    totalStudents: number
    activeClasses: number
    atRiskStudents: number
  }
  classes: ClassStats[]
  recentActivity: RecentActivity[]
  gradeDistribution: GradeDistribution
}

export function DashboardContent({ data }: { data: DashboardData }) {
  const atRiskPercentage = data.stats.totalStudents > 0 
    ? Math.round((data.stats.atRiskStudents / data.stats.totalStudents) * 100) 
    : 0

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome back, Prof. {data.professor.name}!</h1>
          <p className="text-muted-foreground">Here's an overview of your classes</p>
        </div>
        {data.professor.department && (
          <Badge variant="outline" className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4" />
            {data.professor.department}
          </Badge>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Students</p>
                <p className="text-3xl font-bold">{data.stats.totalStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">Across all classes</p>
              </div>
              <Users className="h-10 w-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Classes</p>
                <p className="text-3xl font-bold">{data.stats.activeClasses}</p>
                <p className="text-xs text-muted-foreground mt-1">This semester</p>
              </div>
              <BookOpen className="h-10 w-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">At-Risk Students</p>
                <p className="text-3xl font-bold">{data.stats.atRiskStudents}</p>
                <p className="text-xs text-muted-foreground mt-1">{atRiskPercentage}% of total ({`< 75% avg`})</p>
              </div>
              <AlertCircle className="h-10 w-10 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classes Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Classes Overview
          </CardTitle>
          <CardDescription>Performance summary for each of your classes</CardDescription>
        </CardHeader>
        <CardContent>
          {data.classes.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Classes Yet</h3>
              <p className="text-muted-foreground mb-4">
                Once classes are assigned to you, they will appear here with performance insights.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.classes.map((classItem) => {
                const atRiskPercentage = classItem.student_count > 0
                  ? Math.round((classItem.at_risk_count / classItem.student_count) * 100)
                  : 0
                const hasAtRisk = classItem.at_risk_count > 0

                return (
                  <Link key={classItem.class_id} href={`/professor/classes/${classItem.class_id}`}>
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div>
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-base line-clamp-1">
                                {classItem.subject_name}
                              </h3>
                              {hasAtRisk && (
                                <Badge variant="destructive" className="ml-2 shrink-0">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Alert
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {classItem.subject_code} • {classItem.section_name}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-blue-600" />
                              <div>
                                <p className="text-lg font-bold">{classItem.student_count}</p>
                                <p className="text-xs text-muted-foreground">Students</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {hasAtRisk ? (
                                <>
                                  <TrendingDown className="h-4 w-4 text-orange-600" />
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-orange-600">{classItem.at_risk_count}</p>
                                    <p className="text-xs text-muted-foreground">At Risk ({atRiskPercentage}%)</p>
                                  </div>
                                </>
                              ) : (
                                <>
                                  <TrendingUp className="h-4 w-4 text-green-600" />
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-green-600">0</p>
                                    <p className="text-xs text-muted-foreground">At Risk</p>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest actions and AI tool usage</CardDescription>
        </CardHeader>
        <CardContent>
          {data.recentActivity.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No recent activity
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  {activity.type === 'ai_tool' ? (
                    <Sparkles className="h-5 w-5 mt-0.5 text-purple-600" />
                  ) : (
                    <Activity className="h-5 w-5 mt-0.5 text-blue-600" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{activity.title}</h3>
                    <p className="text-sm text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grade Distribution Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Grade Distribution Overview
          </CardTitle>
          <CardDescription>Current performance distribution across all classes</CardDescription>
        </CardHeader>
        <CardContent>
          {data.stats.totalStudents === 0 ? (
            <div className="text-center py-8">
              <TrendingUp className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                No grade data available yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span className="text-sm font-medium">A (90-100%)</span>
                </div>
                <span className="text-sm text-muted-foreground">{data.gradeDistribution.A} students</span>
              </div>
              <Progress value={(data.gradeDistribution.A / data.stats.totalStudents) * 100} className="h-2 bg-green-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded"></div>
                  <span className="text-sm font-medium">B (80-89%)</span>
                </div>
                <span className="text-sm text-muted-foreground">{data.gradeDistribution.B} students</span>
              </div>
              <Progress value={(data.gradeDistribution.B / data.stats.totalStudents) * 100} className="h-2 bg-blue-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                  <span className="text-sm font-medium">C (70-79%)</span>
                </div>
                <span className="text-sm text-muted-foreground">{data.gradeDistribution.C} students</span>
              </div>
              <Progress value={(data.gradeDistribution.C / data.stats.totalStudents) * 100} className="h-2 bg-yellow-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded"></div>
                  <span className="text-sm font-medium">D (60-69%)</span>
                </div>
                <span className="text-sm text-muted-foreground">{data.gradeDistribution.D} students</span>
              </div>
              <Progress value={(data.gradeDistribution.D / data.stats.totalStudents) * 100} className="h-2 bg-orange-100" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-500 rounded"></div>
                  <span className="text-sm font-medium">F (Below 60%)</span>
                </div>
                <span className="text-sm text-muted-foreground">{data.gradeDistribution.F} students</span>
              </div>
              <Progress value={(data.gradeDistribution.F / data.stats.totalStudents) * 100} className="h-2 bg-red-100" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/professor/classes">
                <BookOpen className="h-6 w-6" />
                <span>View All Classes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/professor/ai-tools">
                <Star className="h-6 w-6" />
                <span>AI Tools</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2 bg-transparent" asChild>
              <Link href="/professor/calendar">
                <TrendingUp className="h-6 w-6" />
                <span>View Schedule</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
