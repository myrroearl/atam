"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, BookOpen, Users, Loader2, AlertCircle } from "lucide-react"

interface ScheduleClass {
  classId: number
  className: string
  subjectCode: string
  subjectName: string
  sectionName: string
  units: number
  startTime: Date
  endTime: Date
  dayOfWeek: number
  timeSlot: string
  startTimeFormatted: string
  endTimeFormatted: string
}

interface ScheduleData {
  schedule: {
    0: ScheduleClass[]
    1: ScheduleClass[]
    2: ScheduleClass[]
    3: ScheduleClass[]
    4: ScheduleClass[]
    5: ScheduleClass[]
    6: ScheduleClass[]
  }
  timeSlots: string[]
  totalClasses: number
  professorId: number
}

const DAYS = [
  { name: "Monday", short: "Mon", index: 1 },
  { name: "Tuesday", short: "Tue", index: 2 },
  { name: "Wednesday", short: "Wed", index: 3 },
  { name: "Thursday", short: "Thu", index: 4 },
  { name: "Friday", short: "Fri", index: 5 },
  { name: "Saturday", short: "Sat", index: 6 }
]

export function CalendarContent() {
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchSchedule()
  }, [])

  const fetchSchedule = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/professor/schedule')
      if (!response.ok) {
        throw new Error('Failed to fetch schedule')
      }
      
         const data = await response.json()
         console.log("Calendar component received data:", data)
         setScheduleData(data)
    } catch (err) {
      console.error('Error fetching schedule:', err)
      setError(err instanceof Error ? err.message : 'Failed to load schedule')
    } finally {
      setIsLoading(false)
    }
  }

  const getClassForTimeSlot = (dayIndex: number, timeSlot: string): ScheduleClass | null => {
    if (!scheduleData) return null
    
    const dayClasses = scheduleData.schedule[dayIndex as keyof typeof scheduleData.schedule] || []
    return dayClasses.find(cls => cls.timeSlot === timeSlot) || null
  }

  const getClassColor = (classItem: ScheduleClass) => {
    // Generate consistent color based on subject code
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800',
      'bg-pink-100 text-pink-800 border-pink-200 dark:bg-pink-900 dark:text-pink-200 dark:border-pink-800',
      'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900 dark:text-indigo-200 dark:border-indigo-800'
    ]
    
    const hash = classItem.subjectCode.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Loading your schedule...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-3">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <Button onClick={fetchSchedule} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Professor Schedule
          </h1>
          <p className="text-muted-foreground">
            Your weekly class timetable • {scheduleData?.totalClasses || 0} classes scheduled
          </p>
        </div>
        <Button onClick={fetchSchedule} variant="outline">
          <Clock className="mr-2 h-4 w-4" />
          Refresh Schedule
        </Button>
      </div>

      {/* Schedule Timetable */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Weekly Timetable
          </CardTitle>
          <CardDescription>
            Your classes organized by day and time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4 font-semibold text-muted-foreground min-w-[100px]">
                    Time
                  </th>
                  {DAYS.map((day) => (
                    <th key={day.index} className="text-center p-4 font-semibold text-muted-foreground min-w-[200px]">
                      {day.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheduleData?.timeSlots.map((timeSlot) => (
                  <tr key={timeSlot} className="border-b hover:bg-muted/50">
                    <td className="p-4 font-mono text-sm text-muted-foreground">
                      {timeSlot}
                    </td>
                    {DAYS.map((day) => {
                      const classItem = getClassForTimeSlot(day.index, timeSlot)
                      return (
                        <td key={day.index} className="p-2 text-center">
                          {classItem ? (
                            <div className={`p-3 rounded-lg border ${getClassColor(classItem)} hover:shadow-md transition-shadow`}>
                              <div className="space-y-1">
                                <div className="font-semibold text-sm">
                                  {classItem.subjectCode}
                                </div>
                                <div className="text-xs opacity-90">
                                  {classItem.subjectName}
                                </div>
                                <div className="text-xs font-medium">
                                  Section {classItem.sectionName}
                                </div>
                                <div className="text-xs opacity-75">
                                  {classItem.units} units
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="p-3 text-muted-foreground/50">
                              <div className="text-xs">—</div>
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Class Summary */}
      {scheduleData && scheduleData.totalClasses > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DAYS.map((day) => {
            const dayClasses = scheduleData.schedule[day.index as keyof typeof scheduleData.schedule] || []
            if (dayClasses.length === 0) return null

            return (
              <Card key={day.index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {day.name}
                  </CardTitle>
                  <CardDescription>
                    {dayClasses.length} class{dayClasses.length !== 1 ? 'es' : ''} scheduled
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {dayClasses.map((classItem) => (
                    <div key={classItem.classId} className={`p-3 rounded-lg border ${getClassColor(classItem)}`}>
                      <div className="font-medium text-sm">
                        {classItem.subjectCode}
                      </div>
                      <div className="text-xs opacity-90">
                        {classItem.subjectName}
                      </div>
                      <div className="text-xs font-medium">
                        Section {classItem.sectionName} • {classItem.timeSlot}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty State */}
      {scheduleData && scheduleData.totalClasses === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-muted-foreground mb-2">
              No Classes Scheduled
            </h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You don't have any classes scheduled yet. Contact your administrator to set up your teaching schedule.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
