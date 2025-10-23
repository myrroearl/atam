"use client"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { BookOpen, TrendingUp, Trophy, AlertCircle, CheckCircle, Star, Crown, Users } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { cn } from "@/lib/utils"
import { useEffect, useMemo, useState } from "react"

type GradeRow = { grade: number | null; subjects: { subject_name: string } }
type SubjectClass = any
type LeaderRow = { rank: number; name: string; gpa: number | null; avatar?: string; course?: string; isCurrentUser?: boolean }
type WeeklyRow = { week: string; performance: number }

export function DashboardOverview() {
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [subjects, setSubjects] = useState<SubjectClass[]>([])
  const [leaders, setLeaders] = useState<LeaderRow[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [weekly, setWeekly] = useState<WeeklyRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  async function fetchJson(url: string, init?: RequestInit & { timeoutMs?: number }, retries = 2): Promise<any> {
    const timeoutMs = init?.timeoutMs ?? 8000
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const res = await fetch(url, {
          cache: 'no-store',
          credentials: 'same-origin',
          ...init,
          signal: controller.signal,
        })
        clearTimeout(timeout)
        if (!res.ok) {
          const text = await res.text().catch(() => '')
          throw new Error(`HTTP ${res.status} from ${url}${text ? `: ${text}` : ''}`)
        }
        return await res.json()
      } catch (e: any) {
        clearTimeout(timeout)
        const isLast = attempt === retries
        const isAbort = e?.name === 'AbortError'
        if (isLast || (!isAbort && attempt === retries)) throw e
        await new Promise(r => setTimeout(r, 300 * (attempt + 1)))
      }
    }
    throw new Error(`Failed to fetch ${url}`)
  }

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.allSettled([
          fetchJson('/api/student/grades'),
          fetchJson('/api/student/subjects'),
          fetchJson('/api/student/leaderboard'),
          fetchJson('/api/student/performance'),
          fetchJson('/api/student/entries'),
        ])
        const [gradesRes, subjectsRes, leadersRes, perfRes, entriesRes] = results
        if (!active) return
        const partialErrors: string[] = []
        if (gradesRes.status === 'fulfilled') {
          setGrades((gradesRes.value.grades || []) as GradeRow[])
        } else {
          setGrades([])
          partialErrors.push('grades')
        }
        if (subjectsRes.status === 'fulfilled') {
          setSubjects(subjectsRes.value.subjects || [])
        } else {
          setSubjects([])
          partialErrors.push('subjects')
        }
        if (leadersRes.status === 'fulfilled') {
          setLeaders((leadersRes.value.leaderboard || []) as LeaderRow[])
        } else {
          setLeaders([])
          partialErrors.push('leaderboard')
        }
        if (perfRes.status === 'fulfilled') {
          setWeekly((perfRes.value.weekly || []) as WeeklyRow[])
        } else {
          setWeekly([])
          partialErrors.push('performance')
        }
        if (entriesRes.status === 'fulfilled') {
          setEntries(entriesRes.value.entries || [])
        } else {
          setEntries([])
          partialErrors.push('entries')
        }
        if (partialErrors.length) {
          setError(`Some data failed to load: ${partialErrors.join(', ')}`)
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load dashboard')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  // Build entries by subject and compute real-time percentage grade per subject
  const computedSubjectGrades = useMemo(() => {
    const map: Record<number, { name: string; total: number; score: number }> = {}
    // derive subject ids and names from subjects list
    const subjectInfos: Array<{ id: number; name: string }> = (subjects || []).map((c: any) => {
      const subj = c?.subjects
      return { id: subj?.subject_id ?? c?.class_id, name: subj?.subject_name ?? 'Subject' }
    }).filter(s => s.id != null)

    for (const e of entries) {
      const subjectId = e?.classes?.subject_id
      if (!subjectId) continue
      const maxScore = e?.max_score != null ? Number(e.max_score) : 0
      const score = e?.score != null ? Number(e.score) : null
      // consider only graded items for percentage
      if (score == null || !Number.isFinite(score) || !Number.isFinite(maxScore) || maxScore <= 0) continue
      const bucket = map[subjectId] || (map[subjectId] = { name: subjectInfos.find(si => si.id === subjectId)?.name || 'Subject', total: 0, score: 0 })
      bucket.total += maxScore
      bucket.score += score
    }

    // Build final list ensuring subjects without graded works appear with 0
    const list = subjectInfos.map(si => {
      const b = map[si.id]
      const percent = b && b.total > 0 ? (b.score / b.total) * 100 : 0
      return { subjectId: si.id, subject: si.name, grade: Number.isFinite(percent) ? percent : 0 }
    })

    return list
  }, [subjects, entries])

  const gradeData = useMemo(() => {
    return computedSubjectGrades.slice(0, 5).map((g) => ({ subject: g.subject, grade: g.grade }))
  }, [computedSubjectGrades])

  const performanceData = useMemo(() => {
    return weekly.map((w) => ({ month: w.week, score: w.performance }))
  }, [weekly])

  const top5Leaderboard = useMemo(() => leaders.slice(0, 5), [leaders])
  const currentUser = undefined
  const userRank = top5Leaderboard[0]?.rank || 0

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

  return (
    <div className="space-y-6">
      {loading && <p className="text-sm text-muted-foreground">Loading dashboard...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Welcome back!
        </h1>
        <p className="text-muted-foreground">Here's what's happening with your studies today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall GPA</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(() => {
              const values = computedSubjectGrades.map(g => g.grade)
              const avg = values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0
              return (Number.isFinite(avg) ? avg : 0).toFixed(2)
            })()}</div>
            <p className="text-xs text-muted-foreground">Based on current graded works</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjects.length}</div>
            <p className="text-xs text-muted-foreground">Active courses</p>
          </CardContent>
        </Card>

      

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userRank ? `#${userRank}` : '-'}</div>
            <p className="text-xs text-muted-foreground">in overall ranking</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Academic Standing</CardTitle>
            <Crown className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Dean's Lister</div>
            <p className="text-xs text-muted-foreground">Maintaining excellent grades!</p>
          </CardContent>
        </Card>
      </div>

      

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
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

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
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

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Leaderboard - Compact Version */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-xl rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Users className="w-4 h-4" />
              <span>Top 5 Rankings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Your Current Position Banner - Compact */}
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
                  <span className="font-medium text-sm">Your Position</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className={cn("text-xs px-2 py-0.5", getRankBadge(userRank))}>#{userRank}</Badge>
                  {userRank <= 3 && <Crown className="w-3 h-3 text-yellow-500" />}
                </div>
              </div>
            </div>

            {/* Top 5 List - Compact */}
            <div className="space-y-1">
              {top5Leaderboard.map((student, index) => (
                <div
                  key={student.rank}
                  className={cn(
                    "flex items-center justify-between p-2 rounded-md transition-all duration-300",
                    student.isCurrentUser ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"
                  )}
                >
                  <div className="flex items-center space-x-2">
                    <Badge className={cn("text-xs px-1.5 py-0.5", getRankBadge(student.rank))}>{student.rank}</Badge>
                    <Avatar className="w-6 h-6 " >
                      <AvatarImage src={student.avatar || "/placeholder.svg"} alt={student.name} />
                      <AvatarFallback className="text-xs text-foreground">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-xs">{student.name}</p>
                      <p className="text-xs opacity-75">{student.course || ''}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-bold">{student.gpa}</div>
                  </div>
                </div>
              ))}
            </div>
         <Link href={`/dashboard/leaderboard`} className="mt-3">
            <Button className="w-full bg-transparent" variant="outline" size="sm">
              View Full Leaderboard
            </Button>
            </Link>
          </CardContent>
        </Card>

        {/* AI Study Recommendations */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300 ">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <div className="w-4 h-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Star className="w-2 h-2 text-white" />
              </div>
              <span>AI Study Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(() => {
              const sorted = [...computedSubjectGrades].sort((a,b) => a.grade - b.grade)
              const low = sorted.slice(0, 1)
              const high = sorted.slice(-1)
              return (
                <>
                  {low.map((g, idx) => (
                    <div key={`low-${idx}`} className="p-3 rounded-lg bg-purple-100/20">
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Focus on {g.subject}</p>
                          <p className="text-xs text-muted-foreground">Your performance is lower here. Review recent materials and practice targeted exercises.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {high.map((g, idx) => (
                    <div key={`high-${idx}`} className="p-3 rounded-lg bg-emerald-100/20">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Great Progress in {g.subject}</p>
                          <p className="text-xs text-muted-foreground">Keep pushing this strength—consider advanced resources to deepen mastery.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {computedSubjectGrades.length > 1 && (
                    <div className="p-3 rounded-lg bg-orange-100/20">
                      <div className="flex items-start space-x-2">
                        <TrendingUp className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-sm">Balanced Study Plan</p>
                          <p className="text-xs text-muted-foreground">Allocate extra time to the lowest subject while maintaining momentum in your best one.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}