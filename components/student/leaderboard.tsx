"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ProfileAvatar } from "@/components/ui/profile-avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePrivacy } from "@/contexts/privacy-context"
import { shouldHideProfile, getMaskedName, getMaskedAvatarFallback } from "@/lib/student/privacy-utils"

type LeaderRow = { rank: number; name: string; gpa: number | null; isCurrentUser?: boolean; course?: string; department?: string | null; section?: string | null; avatar?: string; student_id?: number; privacy_settings?: any; account_id?: number }
const overallLeaderboard: LeaderRow[] = []

const userNotInTop10: LeaderRow = { rank: 0, name: "You", gpa: null, isCurrentUser: true }

type SubjectRanking = {
  student_id: number
  name: string
  grade: number
  rank: number
  avatar: string | null
}


export function Leaderboard() {
  const [selectedFilter, setSelectedFilter] = useState("Overall")
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null)
  const [rows, setRows] = useState<LeaderRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [availableCourses, setAvailableCourses] = useState<string[]>([])
  const [availableDepartments, setAvailableDepartments] = useState<string[]>([])
  const [availableSubjects, setAvailableSubjects] = useState<Record<number, string>>({})
  const [subjectRankings, setSubjectRankings] = useState<Record<number, SubjectRanking[]>>({})
  const [currentStudentId, setCurrentStudentId] = useState<number | null>(null)
  const [currentAccountId, setCurrentAccountId] = useState<number | null>(null)
  const { privacySettings } = usePrivacy()

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/student/leaderboard', { cache: 'no-store' })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b.error || `Failed: ${res.status}`)
        }
        const b = await res.json()
        console.log('[Leaderboard] API Response:', b)
        if (active) {
          setCurrentAccountId(b.currentAccountId)
          console.log('[Leaderboard] Current Account ID:', b.currentAccountId)
          const leaderboardData = (b.leaderboard || []).map((r: any) => ({ 
            rank: r.rank, 
            name: r.name, 
            gpa: r.gpa, 
            isCurrentUser: r.isCurrentUser, 
            course: r.course,
            department: r.department,
            section: r.section, 
            avatar: r.avatar,
            privacy_settings: r.privacy_settings,
            account_id: r.account_id,
            student_id: r.student_id
          }))
          console.log('[Leaderboard] Processed leaderboard data:', leaderboardData)
          setRows(leaderboardData)
          
          // Extract unique courses for filtering
          const courses = [...new Set(leaderboardData.map((r: LeaderRow) => r.course).filter(Boolean))] as string[]
          setAvailableCourses(courses.sort())
          
          // Extract unique departments for filtering
          const departments = [...new Set(leaderboardData.map((r: LeaderRow) => r.department).filter(Boolean))] as string[]
          setAvailableDepartments(departments.sort())
          
          // Store subject rankings and names
          setSubjectRankings(b.subjectRankings || {})
          setAvailableSubjects(b.subjectNames || {})
          
          // Find current student ID
          const currentUser = leaderboardData.find((r: LeaderRow) => r.isCurrentUser)
          if (currentUser) {
            const currentUserInSubject = Object.values(b.subjectRankings || {}).flat().find((r: any) => r.name === currentUser.name) as SubjectRanking | undefined
            if (currentUserInSubject && 'student_id' in currentUserInSubject) {
              setCurrentStudentId(currentUserInSubject.student_id)
            }
          }
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load leaderboard')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  // Check if selected filter is a subject (starts with "subject:")
  const isSubjectFilter = selectedFilter.startsWith('subject:')
  const selectedSubjectId = isSubjectFilter ? parseInt(selectedFilter.replace('subject:', '')) : null

  // Apply dropdown filter and recompute ranks within the filtered set
  const filteredAndRanked: LeaderRow[] = useMemo(() => {
    // If subject is selected, use subject-specific rankings
    if (selectedSubjectId && subjectRankings[selectedSubjectId]) {
      return subjectRankings[selectedSubjectId].map((r: SubjectRanking): LeaderRow => {
        // Find the original student data to get section information
        const originalStudent = rows.find(s => s.name === r.name)
        return {
          rank: r.rank,
          name: r.name,
          gpa: r.grade, // Use grade for subject view
          isCurrentUser: r.student_id === currentStudentId,
          course: originalStudent?.course,
          department: originalStudent?.department,
          section: originalStudent?.section,
          avatar: r.avatar || originalStudent?.avatar,
          student_id: r.student_id,
          privacy_settings: originalStudent?.privacy_settings,
          account_id: originalStudent?.account_id
        }
      })
    }

    let filtered = rows
    if (selectedFilter === 'Overall') {
      // Show all students
      filtered = rows
    } else if (selectedFilter === 'In Class') {
      // Show only students in the same section as current user
      const me = rows.find(r => r.isCurrentUser)
      const mySection = me?.section?.trim()
      if (mySection) {
        filtered = rows.filter(r => r.section?.trim() === mySection)
      } else {
        filtered = rows // If no section found, show all
      }
    } else if (availableDepartments.includes(selectedFilter)) {
      // Filter by department - exact match
      filtered = rows.filter(r => r.department === selectedFilter)
    } else if (availableCourses.includes(selectedFilter)) {
      // Filter by specific course - exact match
      filtered = rows.filter(r => r.course === selectedFilter)
    } else {
      // Fallback to all rows if filter doesn't match any category
      filtered = rows
    }
    
    // Sort ascending - lower GWA (1.0) is better than higher GWA (5.0)
    const ranked = [...filtered].sort((a,b) => (a.gpa ?? 5.0) - (b.gpa ?? 5.0)).map((r, idx) => ({ ...r, rank: idx + 1 }))
    return ranked
  }, [rows, selectedFilter, selectedSubjectId, subjectRankings, currentStudentId, availableDepartments, availableCourses])

  // Check if current user is in top 10/3 for the filtered view
  const currentUser = filteredAndRanked.find((s) => s.isCurrentUser)
  const isUserInTop10 = !!(currentUser && (currentUser.rank as number) <= 10)
  const isUserTop3 = !!(currentUser && (currentUser.rank as number) <= 3)

  // Get top 3 for podium
  const topThree = filteredAndRanked.slice(0, 3)

  // Get remaining players for table (4-10 if user is in top 10, or 4-10 + user if not)
  let tableData = filteredAndRanked.slice(3, 10)

  // If user is not in top 10, add them at the bottom
  if (!isUserInTop10 && filteredAndRanked.length) {
    const lastRank = filteredAndRanked[filteredAndRanked.length - 1]?.rank || 10
    tableData = [...tableData, { ...userNotInTop10, rank: lastRank + 1, gpa: null }]
  }

  const handleStudentClick = (rank: number) => {
    setSelectedStudent(selectedStudent === rank ? null : rank)
  }

  const getRankBadge = (rank: number) => {
    const colors = {
      1: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white",
      2: "bg-gradient-to-r from-gray-300 to-gray-500 text-white",
      3: "bg-gradient-to-r from-amber-400 to-amber-600 text-white",
    }
    return colors[rank as keyof typeof colors] || "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
  }


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Honorable Students
          </h1>
          <p className="text-muted-foreground">Academic performance rankings and achievements</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={selectedFilter} onValueChange={setSelectedFilter}>
            <SelectTrigger className="w-64 bg-background border border-slate-200 dark:border-slate-700 shadow rounded-md flex items-center justify-between">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[400px]">
              <SelectItem value="Overall">Overall (University)</SelectItem>
              <SelectItem value="In Class">My Section</SelectItem>
              
              {availableDepartments.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Departments</div>
                  {availableDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </>
              )}
              
              {availableCourses.length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Programs</div>
                  {availableCourses.map((course) => (
                    <SelectItem key={course} value={course}>
                      {course}
                    </SelectItem>
                  ))}
                </>
              )}
              
              {Object.keys(availableSubjects).length > 0 && (
                <>
                  <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Subjects</div>
                  {Object.entries(availableSubjects).map(([subjectId, subjectName]) => (
                    <SelectItem key={subjectId} value={`subject:${subjectId}`}>
                      {subjectName}
                    </SelectItem>
                  ))}
                </>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Loading leaderboard...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* User Position Indicator */}
      <Card
        className={cn(
          "bg-card/50 border-2",
          isUserInTop10
            ? "border-green-500 bg-green-100/20"
            : "border-blue-500 bg-blue-100/20",
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <ProfileAvatar size="lg" className="border-2 border-white shadow-lg" />
              <div>
                <h3 className="font-bold text-lg">Your Current Position</h3>
                <p className="text-sm text-muted-foreground">
                  {isUserInTop10 ? "You're in the Top 10!" : "Keep climbing the ranks!"}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2">
                <Badge
                  className={cn(
                    "text-lg px-3 py-1",
                    isUserInTop10 ? "bg-green-500 text-white" : "bg-blue-500 text-white",
                  )}
                >
                  #{isUserInTop10 ? currentUser?.rank : userNotInTop10.rank}
                </Badge>
                {isUserInTop10 && (
                  <Badge className="bg-yellow-500 text-white">
                    <Crown className="w-3 h-3 mr-1" />
                    Top 10
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {isSubjectFilter ? 'Grade' : 'GWA'}: {isUserInTop10 ? currentUser?.gpa?.toFixed(2) : userNotInTop10.gpa}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
          {/* Top 3 Podium */}
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-xl rounded-2xl">
            <CardContent className="p-6">
              <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto">
                {/* 2nd Place */}
                {topThree[1] && (() => {
                  const student = topThree[1]
                  const shouldHide = shouldHideProfile(student, currentAccountId || undefined)
                  const displayName = shouldHide ? getMaskedName(student.name, student.student_id || undefined) : student.name
                  const displaySection = shouldHide ? 'Private' : (student.section || 'N/A')
                  const displayCourse = shouldHide ? 'Private' : (student.course || 'N/A')
                  const avatarFallback = shouldHide ? getMaskedAvatarFallback(student.name, student.student_id || undefined) : 
                    student.name.split(" ").map((n) => n[0]).join("")
                  
                  return (
                    <div className="order-1 flex flex-col items-center">
                      <div className="relative mb-4">
                        <Avatar className="w-20 h-20 border-4 border-gray-300">
                          <AvatarImage src={shouldHide ? "/placeholder.svg" : (student.avatar || "/placeholder.svg")} alt={displayName} />
                          <AvatarFallback className="text-lg bg-gradient-to-br from-gray-400 to-gray-600 text-white">
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-gray-300 to-gray-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          2
                        </div>
                      </div>
                      <h3 className="font-bold text-lg text-center">{displayName}</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {(selectedFilter === 'In Class' || isSubjectFilter) 
                          ? displaySection
                          : displayCourse
                        }
                      </p>
                      <div className="mt-2 text-center">
                        <p className="text-2xl font-bold">{student.gpa?.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{isSubjectFilter ? 'Grade' : 'GWA'}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* 1st Place */}
                {topThree[0] && (() => {
                  const student = topThree[0]
                  const shouldHide = shouldHideProfile(student, currentAccountId || undefined)
                  const displayName = shouldHide ? getMaskedName(student.name, student.student_id || undefined) : student.name
                  const displaySection = shouldHide ? 'Private' : (student.section || 'N/A')
                  const displayCourse = shouldHide ? 'Private' : (student.course || 'N/A')
                  const avatarFallback = shouldHide ? getMaskedAvatarFallback(student.name, student.student_id || undefined) : 
                    student.name.split(" ").map((n) => n[0]).join("")
                  
                  return (
                    <div className="order-2 flex flex-col items-center">
                      <div className="relative mb-4">
                        <Avatar className="w-24 h-24 border-4 border-yellow-400">
                          <AvatarImage src={shouldHide ? "/placeholder.svg" : (student.avatar || "/placeholder.svg")} alt={displayName} />
                          <AvatarFallback className="text-xl bg-gradient-to-br from-yellow-400 to-yellow-600 text-white">
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                          <Crown className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      <h3 className="font-bold text-xl text-center">{displayName}</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {(selectedFilter === 'In Class' || isSubjectFilter) 
                          ? displaySection
                          : displayCourse
                        }
                      </p>
                      <div className="mt-2 text-center">
                        <p className="text-3xl font-bold text-yellow-600">{student.gpa?.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{isSubjectFilter ? 'Grade' : 'GWA'}</p>
                      </div>
                    </div>
                  )
                })()}

                {/* 3rd Place */}
                {topThree[2] && (() => {
                  const student = topThree[2]
                  const shouldHide = shouldHideProfile(student, currentAccountId || undefined)
                  const displayName = shouldHide ? getMaskedName(student.name, student.student_id || undefined) : student.name
                  const displaySection = shouldHide ? 'Private' : (student.section || 'N/A')
                  const displayCourse = shouldHide ? 'Private' : (student.course || 'N/A')
                  const avatarFallback = shouldHide ? getMaskedAvatarFallback(student.name, student.student_id || undefined) : 
                    student.name.split(" ").map((n) => n[0]).join("")
                  
                  return (
                    <div className="order-3 flex flex-col items-center">
                      <div className="relative mb-4">
                        <Avatar className="w-20 h-20 border-4 border-amber-400">
                          <AvatarImage src={shouldHide ? "/placeholder.svg" : (student.avatar || "/placeholder.svg")} alt={displayName} />
                          <AvatarFallback className="text-lg bg-gradient-to-br from-amber-600 to-orange-600 text-white">
                            {avatarFallback}
                          </AvatarFallback>
                        </Avatar>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          3
                        </div>
                        {student.isCurrentUser && (
                          <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                            You
                          </Badge>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-center">{displayName}</h3>
                      <p className="text-sm text-muted-foreground text-center">
                        {(selectedFilter === 'In Class' || isSubjectFilter) 
                          ? displaySection
                          : displayCourse
                        }
                      </p>
                      <div className="mt-2 text-center">
                        <p className="text-2xl font-bold">{student.gpa?.toFixed(2)}</p>
                        <p className="text-sm text-muted-foreground">{isSubjectFilter ? 'Grade' : 'GWA'}</p>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Rankings Table */}
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-xl rounded-2xl">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold text-foreground">Rank</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">Student Name</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">{(selectedFilter === 'In Class' || isSubjectFilter) ? 'Section' : 'Program'}</th>
                      <th className="text-left p-4 font-semibold text-gray-700 dark:text-gray-300">{isSubjectFilter ? 'Grade' : 'GWA'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((student, index) => {
                      console.log('[Leaderboard] Processing student:', {
                        name: student.name,
                        studentId: student.student_id,
                        accountId: student.account_id,
                        privacySettings: student.privacy_settings,
                        currentAccountId
                      })
                      
                      const shouldHide = shouldHideProfile(student, currentAccountId || undefined)
                      
                      console.log('[Leaderboard] Should hide:', shouldHide)
                      
                      const displayName = shouldHide ? getMaskedName(student.name, student.student_id || undefined) : student.name
                      const displaySection = shouldHide ? 'Private' : (student.section || 'N/A')
                      const displayCourse = shouldHide ? 'Private' : (student.course || 'N/A')
                      const avatarFallback = shouldHide ? getMaskedAvatarFallback(student.name, student.student_id || undefined) : 
                        student.name.split(" ").map((n) => n[0]).join("")
                      
                      console.log('[Leaderboard] Display name:', displayName)
                      
                      return (
                        <tr
                          key={student.rank}
                          className={cn(
                            "border-b transition-all duration-300 cursor-pointer group",
                            "hover:bg-accent/50",
                            "hover:shadow-md hover:scale-[1.02] hover:border-border",
                            student.isCurrentUser && "bg-blue-500 text-white hover:bg-blue-600 hover:shadow-lg",
                            selectedStudent === student.rank &&
                              !student.isCurrentUser &&
                              "bg-accent shadow-inner",
                            // Add separator before user if they're not in top 10
                            !isUserInTop10 &&
                              index === tableData.length - 1 &&
                              "border-t-4 border-t-blue-500/50",
                          )}
                          onClick={() => handleStudentClick(student.rank)}
                        >
                          <td className="p-4 pl-5">
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-lg">{student.rank.toString().padStart(2, "0")}</span>
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center space-x-3">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={shouldHide ? "/placeholder.svg" : (student.avatar || "/placeholder.svg")} alt={displayName} />
                                <AvatarFallback>
                                  {avatarFallback}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">{displayName}</p>
                                {student.isCurrentUser && <Badge className="text-xs bg-white/20 text-white">You</Badge>}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge
                              variant="outline"
                              className={cn(student.isCurrentUser ? "border-white/30 text-white" : "")}
                            >
                              {(selectedFilter === 'In Class' || isSubjectFilter)
                                ? displaySection
                                : displayCourse
                              }
                            </Badge>
                          </td>
                          <td className="p-4 font-semibold text-lg">{student.gpa?.toFixed(2)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  )
}