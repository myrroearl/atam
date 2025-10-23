"use client"

import { useState, useEffect } from 'react'
import { GradebookContent } from "@/components/professor/gradebook-content"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, BarChart3, FileText, Trophy, TrendingUp, Users } from "lucide-react"
import Link from "next/link"
import { AnalyticsContent } from "@/components/professor/analytics-content"
import { LeaderboardsContent } from "@/components/professor/leaderboards-content"
import type { ClassData } from "@/lib/types/gradebook"

interface ClassPageClientProps {
  classData: ClassData
}

// Helper functions for main tab localStorage management
const getMainTabStorageKey = (classId: number) => `main-tab-${classId}`

const saveMainTab = (classId: number, tab: string) => {
  try {
    localStorage.setItem(getMainTabStorageKey(classId), tab)
  } catch (error) {
    console.warn('Failed to save main tab to localStorage:', error)
  }
}

const loadMainTab = (classId: number): string => {
  try {
    return localStorage.getItem(getMainTabStorageKey(classId)) || 'gradebook'
  } catch (error) {
    console.warn('Failed to load main tab from localStorage:', error)
    return 'gradebook'
  }
}

export function ClassPageClient({ classData }: ClassPageClientProps) {
  const [activeMainTab, setActiveMainTab] = useState<string>('gradebook')
  const [mainTabLoaded, setMainTabLoaded] = useState<boolean>(false)

  // Load main tab from localStorage only on client side after hydration
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return
    
    const savedMainTab = loadMainTab(classData.class_id)
    setActiveMainTab(savedMainTab)
    setMainTabLoaded(true)
  }, [classData.class_id])

  // Save main tab to localStorage whenever it changes (only after preferences are loaded)
  useEffect(() => {
    if (!mainTabLoaded) return
    saveMainTab(classData.class_id, activeMainTab)
  }, [activeMainTab, classData.class_id, mainTabLoaded])

  const handleTabChange = (value: string) => {
    setActiveMainTab(value)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeMainTab} onValueChange={handleTabChange} className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-start">
            <div className="flex items-center">
              <Link href="/professor/classes">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div>
              <CardTitle className="flex items-center gap-2 ios-title">
                <FileText className="h-5 w-5 text-primary" />
                {classData.subject_name} - {classData.section_name}
              </CardTitle>
              <CardDescription className="ios-body">
                {classData.subject_code} • {classData.studentCount} students
              </CardDescription>
            </div>
          </div>
          <TabsList className="grid grid-cols-3 mb-6 bg-muted/50 rounded-xl p-1">
            <TabsTrigger
              value="gradebook"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline ios-body">Gradebook</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline ios-body">Analytics</span>
              <Badge
                variant="secondary"
                className="ml-1 flex items-center gap-1 bg-ios-green/10 text-ios-green border-ios-green/20"
              >
                <TrendingUp className="h-3 w-3" />
                {classData.avgGrade}%
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="leaderboards"
              className="flex items-center gap-2 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline ios-body">Leaderboards</span>
              <Badge
                variant="secondary"
                className="ml-1 flex items-center gap-1 bg-ios-blue/10 text-ios-blue border-ios-blue/20"
              >
                <Users className="h-3 w-3" />
                {classData.studentCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="border-t border-gray-300 my-4"></div>

        <TabsContent value="gradebook" className="space-y-4 overflow-x-auto">
          <GradebookContent classData={classData} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsContent />
        </TabsContent>

        <TabsContent value="leaderboards" className="space-y-4">
          <LeaderboardsContent />
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      {/* <div className="grid md:grid-cols-4 gap-4">
        <Card className="ios-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ios-blue/10 rounded-xl">
                <Users className="h-4 w-4 text-ios-blue" />
              </div>
              <div>
                <div className="text-2xl font-bold ios-title">{classData.studentCount}</div>
                <div className="text-xs text-muted-foreground ios-caption">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ios-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ios-green/10 rounded-xl">
                <TrendingUp className="h-4 w-4 text-ios-green" />
              </div>
              <div>
                <div className="text-2xl font-bold ios-title">{classData.avgGrade}%</div>
                <div className="text-xs text-muted-foreground ios-caption">Class Average</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ios-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ios-orange/10 rounded-xl">
                <FileText className="h-4 w-4 text-ios-orange" />
              </div>
              <div>
                <div className="text-2xl font-bold ios-title">{classData.gradeComponents.length}</div>
                <div className="text-xs text-muted-foreground ios-caption">Components</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="ios-stats-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-ios-purple/10 rounded-xl">
                <Trophy className="h-4 w-4 text-ios-purple" />
              </div>
              <div>
                <div className="text-2xl font-bold ios-title">
                  {classData.students.filter((s) =>
                    classData.gradeEntries.some((e) => e.student_id === s.student_id && e.attendance === "present")
                  ).length}
                </div>
                <div className="text-xs text-muted-foreground ios-caption">Active</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  )
}
