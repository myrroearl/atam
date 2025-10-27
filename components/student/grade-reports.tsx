"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { 
  GraduationCap, 
  BookOpen, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  Award,
  Calendar,
  FileText,
  BarChart3,
  Target,
  ArrowLeft
} from "lucide-react"
import { convertPercentageToGPA, calculateGPA } from "@/lib/student/grade-calculations"

type GradeRow = {
  student_id: number
  subject_id: number
  grade: number | null
  completion: string | null
  taken: boolean | null
  credited: boolean | null
  remarks: string | null
  year_taken: number | null
  subjects: { subject_code: string; subject_name: string; units: number | null }
}

// Helper function to calculate GPA using the same logic as dashboard
const calculateGPACorrect = (courses: any[]) => {
  const completedCourses = courses.filter((course: any) => course.completed && course.grade !== null)
  if (completedCourses.length === 0) return 0
  
  // The grades from the API are already in GPA format (1.0-5.0), not percentages
  // So we need to calculate weighted average directly
  let totalGradePoints = 0
  let totalUnits = 0
  
  completedCourses.forEach((course: any) => {
    const grade = Number(course.grade) || 0
    const units = course.units || 3
    totalGradePoints += grade * units
    totalUnits += units
  })
  
  return totalUnits > 0 ? Math.round((totalGradePoints / totalUnits) * 100) / 100 : 0
}

// Helper function to calculate total units
const calculateTotalUnits = (courses: any[]) => {
  return courses.reduce((sum, course: any) => sum + course.units, 0)
}

// Helper function to calculate completed units
const calculateCompletedUnits = (courses: any[]) => {
  return courses.filter((course: any) => course.completed).reduce((sum, course: any) => sum + course.units, 0)
}

export function GradeReports() {
  const router = useRouter()
  const [selectedYear, setSelectedYear] = useState<string>("")
  const [rows, setRows] = useState<GradeRow[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch('/api/student/grades', { cache: 'no-store' })
        if (!res.ok) {
          const b = await res.json().catch(() => ({}))
          throw new Error(b.error || `Failed: ${res.status}`)
        }
        const b = await res.json()
        if (active) setRows(b.grades || [])
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load grades')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const academicYears = useMemo(() => {
    const byYear: Record<string, any> = {}
    for (const r of rows) {
      const yearKey = r.year_taken ? `${r.year_taken}-${(r.year_taken + 1).toString()}` : 'Unknown'
      const yearLabel = r.year_taken ? `${Object.keys(byYear).length + 1} Year` : 'N/A'
      if (!byYear[yearKey]) {
        byYear[yearKey] = { year: yearLabel, yearRange: yearKey, semesters: [{ name: 'All', yearRange: yearKey, courses: [], totalUnits: 0 }] }
      }
      const course = {
        code: r.subjects.subject_code,
        description: r.subjects.subject_name,
        units: r.subjects.units || 0,
        grade: r.grade,
        completed: r.completion ? true : r.grade !== null,
        taken: r.taken ?? true,
        credited: r.credited ?? false,
        remarks: r.remarks || '',
      }
      byYear[yearKey].semesters[0].courses.push(course)
      byYear[yearKey].semesters[0].totalUnits += course.units
    }
    const list = Object.values(byYear)
    if (list.length) setSelectedYear((list[0] as any).year)
    return list as any[]
  }, [rows])

  // Calculate overall statistics
  const allCourses = useMemo(() => academicYears.flatMap((year: any) => year.semesters.flatMap((s: any) => s.courses)), [academicYears])
  const completedCourses = allCourses.filter((course: any) => course.completed && course.grade !== null)
  const totalGPA = calculateGPACorrect(allCourses)
  const totalUnits = calculateTotalUnits(allCourses)
  const completedUnits = calculateCompletedUnits(allCourses)
  const completionRate = totalUnits ? (completedUnits / totalUnits) * 100 : 0

  return (
    <div className="space-y-6">
      {loading && <p className="text-sm text-muted-foreground">Loading grades...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col space-y-2">
          <h1 className="text-3xl font-bold text-foreground flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span>Overall Grade Reports</span>
          </h1>
          <p className="text-muted-foreground">Complete academic transcript from 1st Year to Current</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => router.push('/student/subjects')} 
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subjects
        </Button>
      </div>

      {/* Overall Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
           
            <p className="text-sm text-muted-foreground font-medium">Overall GPA</p>
            <p className="text-3xl font-bold">{totalGPA.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Cumulative</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
           
            <p className="text-sm text-muted-foreground font-medium">Total Units</p>
            <p className="text-3xl font-bold">{totalUnits}</p>
            <p className="text-sm text-muted-foreground">Credits</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
           
            <p className="text-sm text-muted-foreground font-medium">Completed Units</p>
            <p className="text-3xl font-bold">{completedUnits}</p>
            <p className="text-sm text-muted-foreground">Credits</p>
          </CardContent>
        </Card>

        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 text-center">
            
            <p className="text-sm text-muted-foreground font-medium">Progress</p>
            <p className="text-3xl font-bold">{completionRate.toFixed(1)}%</p>
            <Progress value={completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Year Selection */}
      <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Academic Years</span>
          </CardTitle>
          <CardDescription>Select an academic year to view detailed grade reports</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedYear} onValueChange={setSelectedYear} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              {academicYears.map((year) => (
                <TabsTrigger key={year.year} value={year.year} className="flex items-center space-x-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>{year.year}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {academicYears.map((year) => (
              <TabsContent key={year.year} value={year.year} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-bold">{year.year}</h3>
                    <p className="text-muted-foreground">{year.yearRange}</p>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {year.semesters.length} Semesters
                  </Badge>
                </div>

                {/* Year Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Year GPA</p>
                      <p className="text-2xl font-bold">{calculateGPACorrect(year.semesters.flatMap((s: any) => s.courses)).toFixed(2)}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Total Units</p>
                      <p className="text-2xl font-bold">{calculateTotalUnits(year.semesters.flatMap((s: any) => s.courses))}</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/50">
                    <CardContent className="p-4 text-center">
                      <p className="text-sm text-muted-foreground">Completed Units</p>
                      <p className="text-2xl font-bold">{calculateCompletedUnits(year.semesters.flatMap((s: any) => s.courses))}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Semesters */}
                <div className="space-y-6">
                  {year.semesters.map((semester: any, index: number) => (
                    <Card key={index} className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg dark:shadow-card-lg rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle className="flex items-center space-x-2">
                              <FileText className="w-5 h-5" />
                              <span>{semester.name}</span>
                            </CardTitle>
                            <CardDescription>{semester.yearRange}</CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Semester GPA</p>
                            <p className="text-xl font-bold">{calculateGPACorrect(semester.courses).toFixed(2)}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Course Code</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead className="text-center">Units</TableHead>
                              <TableHead className="text-center">Grade</TableHead>
                              <TableHead className="text-center">Status</TableHead>
                              <TableHead className="text-center">Remarks</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {semester.courses.map((course: any, courseIndex: number) => (
                              <TableRow key={courseIndex}>
                                <TableCell className="font-medium">{course.code}</TableCell>
                                <TableCell className="max-w-xs">
                                  <p className="truncate" title={course.description}>
                                    {course.description}
                                  </p>
                                </TableCell>
                                <TableCell className="text-center">{course.units}</TableCell>
                                <TableCell className="text-center">
                                  {course.grade ? (
                                    <Badge 
                                      variant={course.grade <= 1.5 ? "default" : course.grade <= 2.0 ? "secondary" : "destructive"}
                                      className="font-bold"
                                    >
                                      {course.grade}
                                    </Badge>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center">
                                  <div className="flex items-center justify-center space-x-2">
                                    {course.completed && <CheckCircle className="w-4 h-4 text-green-500" />}
                                    {course.taken && <Clock className="w-4 h-4 text-blue-500" />}
                                    {course.credited && <Award className="w-4 h-4 text-purple-500" />}
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  {course.remarks ? (
                                    <Badge variant="outline">{course.remarks}</Badge>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Total Units: {semester.totalUnits}</span>
                            <div className="flex space-x-4 text-sm text-muted-foreground">
                              <span>Completed: {semester.courses.filter((c: any) => c.completed).length}</span>
                              <span>Taken: {semester.courses.filter((c: any) => c.taken).length}</span>
                              <span>Credited: {semester.courses.filter((c: any) => c.credited).length}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
