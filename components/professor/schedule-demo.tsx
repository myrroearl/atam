// This is a demo component to showcase the new professor schedule design
// You can remove this file after reviewing the implementation

"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, BookOpen, Users } from "lucide-react"

const demoSchedule = {
  schedule: {
    1: [ // Monday
      {
        classId: 1,
        className: "CS101 - Programming Fundamentals",
        subjectCode: "CS101",
        subjectName: "Programming Fundamentals",
        sectionName: "A",
        units: 3,
        timeSlot: "8:00 AM - 9:30 AM",
        startTimeFormatted: "8:00 AM",
        endTimeFormatted: "9:30 AM"
      },
      {
        classId: 2,
        className: "CS201 - Data Structures",
        subjectCode: "CS201",
        subjectName: "Data Structures",
        sectionName: "B",
        units: 3,
        timeSlot: "10:00 AM - 11:30 AM",
        startTimeFormatted: "10:00 AM",
        endTimeFormatted: "11:30 AM"
      }
    ],
    2: [ // Tuesday
      {
        classId: 3,
        className: "CS301 - Algorithms",
        subjectCode: "CS301",
        subjectName: "Algorithms",
        sectionName: "A",
        units: 3,
        timeSlot: "2:00 PM - 3:30 PM",
        startTimeFormatted: "2:00 PM",
        endTimeFormatted: "3:30 PM"
      }
    ],
    3: [], // Wednesday
    4: [ // Thursday
      {
        classId: 4,
        className: "CS401 - Software Engineering",
        subjectCode: "CS401",
        subjectName: "Software Engineering",
        sectionName: "A",
        units: 3,
        timeSlot: "9:00 AM - 10:30 AM",
        startTimeFormatted: "9:00 AM",
        endTimeFormatted: "10:30 AM"
      }
    ],
    5: [], // Friday
    6: []  // Saturday
  },
  timeSlots: [
    "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
    "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM", "7:00 PM"
  ],
  totalClasses: 4
}

const DAYS = [
  { name: "Monday", short: "Mon", index: 1 },
  { name: "Tuesday", short: "Tue", index: 2 },
  { name: "Wednesday", short: "Wed", index: 3 },
  { name: "Thursday", short: "Thu", index: 4 },
  { name: "Friday", short: "Fri", index: 5 },
  { name: "Saturday", short: "Sat", index: 6 }
]

export function ScheduleDemo() {
  const getClassColor = (classItem: any) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900 dark:text-blue-200 dark:border-blue-800',
      'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-200 dark:border-green-800',
      'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-800',
      'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-800'
    ]
    
    const hash = classItem.subjectCode.split('').reduce((a: number, b: string) => {
      a = ((a << 5) - a) + b.charCodeAt(0)
      return a & a
    }, 0)
    
    return colors[Math.abs(hash) % colors.length]
  }

  const getClassForTimeSlot = (dayIndex: number, timeSlot: string) => {
    const dayClasses = demoSchedule.schedule[dayIndex as keyof typeof demoSchedule.schedule] || []
    return dayClasses.find((cls: any) => cls.timeSlot === timeSlot) || null
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Calendar className="h-8 w-8 text-primary" />
            Professor Schedule (Demo)
          </h1>
          <p className="text-muted-foreground">
            Your weekly class timetable • {demoSchedule.totalClasses} classes scheduled
          </p>
        </div>
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
                {demoSchedule.timeSlots.map((timeSlot) => (
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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map((day) => {
          const dayClasses = demoSchedule.schedule[day.index as keyof typeof demoSchedule.schedule] || []
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
                {dayClasses.map((classItem: any) => (
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
    </div>
  )
}
