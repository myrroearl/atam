"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, GraduationCap, TrendingUp, BookOpen, Award, Calendar, Mail, Phone, MapPin } from "lucide-react"
import { toast } from "sonner"
import Image from "next/image"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface StudentPerformance {
  // Basic info
  student_id: number;
  name: string;
  email: string;
  birthday?: string;
  address?: string;
  contact_number?: string;
  status: string;
  
  // Academic info
  section: string;
  course: string;
  courseCode: string;
  department: string;
  yearLevel: string;
  
  // Performance statistics
  gwa: number;
  totalUnits: number;
  passedSubjects: number;
  failedSubjects: number;
  totalSubjects: number;
  completionRate: string;
  
  // Grades
  grades: Array<{
    subject_id: number;
    subjectCode: string;
    subjectName: string;
    units: number;
    grade?: number;
    completion?: string;
    taken: boolean;
    credited: boolean;
    remarks?: string;
    yearTaken?: number;
    course: string;
    department: string;
    yearLevel: string;
    semester: string;
    professor?: string;
  }>;
  
  // Performance analytics
  gwaPerSemester: Array<{
    semester: string;
    year: number;
    gwa: number;
    units: number;
  }>;
  
  attendancePerSemester: Array<{
    semester: string;
    year: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    total: number;
    presentPercentage: number;
  }>;
  
  // Grade entries
  gradeEntries: Array<{
    grade_id: number;
    score?: number;
    maxScore?: number;
    attendance?: string;
    entryType?: string;
    dateRecorded: string;
    className?: string;
    subject?: string;
    subjectCode?: string;
    course?: string;
    professor?: string;
    component?: string;
    weight?: number;
    outcome?: string;
    outcomeDescription?: string;
    proficiencyLevel?: string;
  }>;
  
  created_at: string;
  updated_at: string;
}

export default function StudentPerformancePage() {
  const params = useParams()
  const router = useRouter()
  const [student, setStudent] = useState<StudentPerformance | null>(null)
  const [loading, setLoading] = useState(true)
  const [yearLevelFilter, setYearLevelFilter] = useState<string>("__all__")
  const [semesterFilter, setSemesterFilter] = useState<string>("__all__")

  useEffect(() => {
    const fetchStudentPerformance = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/admin/students/${params.id}/performance`)
        if (!response.ok) {
          throw new Error('Failed to fetch student performance')
        }
        const data = await response.json()
        setStudent(data.student)
      } catch (error) {
        console.error('Error fetching student performance:', error)
        toast.error('Failed to fetch student performance')
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchStudentPerformance()
    }
  }, [params.id])

  if (loading) {
    return (
      <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Loading student performance...</div>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-600 dark:text-gray-400">Student not found</div>
        </div>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getGradeColor = (grade?: number) => {
    if (!grade) return "bg-gray-100 text-gray-800"
    if (grade >= 1.00) return "bg-green-100 text-green-800"
    if (grade >= 90) return "bg-blue-100 text-blue-800"
    if (grade >= 85) return "bg-yellow-100 text-yellow-800"
    if (grade >= 80) return "bg-orange-100 text-orange-800"
    if (grade >= 75) return "bg-red-100 text-red-800"
    return "bg-red-100 text-red-800"
  }

  const getGradeStatus = (grade?: number) => {
    if (!grade) return "No Grade"
    if (grade >= 1.00) return "Excellent"
    if (grade >= 90) return "Very Good"
    if (grade >= 85) return "Good"
    if (grade >= 80) return "Satisfactory"
    if (grade >= 75) return "Passed"
    return "Failed"
  }

  return (
    <div className="p-5 space-y-6 w-full bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
      {/* Header */}
      <div className="space-y-2">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="group bg-white hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] border-none shadow md text-xs flex items-center gap-1 transition-all duration-300 pl-3 pr-3 transition-transform duration-500 hover:-translate-x-2"
        >
          <ArrowLeft className="w-5 h-5 transition-all duration-300 group-hover:-translate-x-1 group-hover:opacity-80" />
          Back to Student List
        </Button>
        <h1 className="text-3xl font-extrabold text-black dark:text-white">Student Performance</h1>
        <p className="text-lg text-gray-700 dark:text-gray-400">Academic performance and detailed analysis</p>
      </div>

      {/* Student Header Card */}
      <Card className="bg-white dark:bg-black border-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <Image
              src="/placeholder.svg"
              alt={student.name}
              width={80}
              height={80}
              className="rounded-full border-4 border-[var(--customized-color-one)]"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-black dark:text-white">{student.name}</h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                <div className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {student.email}
                </div>
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-4 h-4" />
                  {student.course}
                </div>
                <div className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {student.section}
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <Badge
                variant={
                  student.status === "active" ? "default" : 
                  student.status === "inactive" ? "destructive" : 
                  "secondary"
                }
                className={
                  student.status === "active" ? "bg-green-100 text-green-800" :
                  student.status === "inactive" ? "bg-red-100 text-red-800" :
                  "bg-yellow-100 text-yellow-800"
                }
              >
                {student.status === "active" ? "Active" : 
                 student.status === "inactive" ? "Inactive" : 
                 student.status}
              </Badge>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Student ID: {student.student_id}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview Cards */}
      {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-white dark:bg-black border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-[var(--customized-color-one)] rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">GWA</p>
                <p className="text-2xl font-bold text-black dark:text-white">{student.gwa}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500 rounded-full">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Units</p>
                <p className="text-2xl font-bold text-black dark:text-white">{student.totalUnits}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500 rounded-full">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passed Subjects</p>
                <p className="text-2xl font-bold text-black dark:text-white">{student.passedSubjects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-black border-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-500 rounded-full">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-black dark:text-white">{student.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div> */}

      {/* Main Content Tabs */}
      <Tabs defaultValue="grades" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-white dark:bg-black border-none rounded-full">
          <TabsTrigger value="grades" className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-full hover:bg-[var(--customized-color-five)] text-black hover:text-[var(--customized-color-one)]">
            Academic Records
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-full hover:bg-[var(--customized-color-five)] transition-all duration-300 text-black hover:text-[var(--customized-color-one)]">
            Performance Details
          </TabsTrigger>
          <TabsTrigger value="profile" className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-full hover:bg-[var(--customized-color-five)] transition-all duration-300 text-black hover:text-[var(--customized-color-one)]">
            Profile Information
          </TabsTrigger>
        </TabsList>

        {/* Academic Records Tab */}
        <TabsContent value="grades" className="space-y-4">
          <Card className="bg-white dark:bg-black border-none">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Academic Records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {student.grades.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">No academic records found</div>
              ) : (
                <>
                  {/* Optional Filters */}
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      const yearLevels = Array.from(new Set(student.grades.map(g => g.yearLevel).filter(Boolean)));
                      const semesters = Array.from(new Set(student.grades.map(g => g.semester).filter(Boolean)));
                      return (
                        <>
                          <div className="min-w-[180px]">
                            <Select onValueChange={(val) => setYearLevelFilter(val)}>
                              <SelectTrigger className="text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!ring-0 focus:!outline-none">
                                <SelectValue placeholder="All Year Levels" />
                              </SelectTrigger>
                              <SelectContent className="text-[11px]">
                                <SelectItem value="__all__" className="cursor-pointer">All Year Levels</SelectItem>
                                {yearLevels.map((yl) => (
                                  <SelectItem key={yl} value={yl || ""} className="cursor-pointer">{yl}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="min-w-[180px]">
                            <Select onValueChange={(val) => setSemesterFilter(val)}>
                              <SelectTrigger className="text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!ring-0 focus:!outline-none">
                                <SelectValue placeholder="All Semesters" />
                              </SelectTrigger>
                              <SelectContent className="text-[11px]">
                                <SelectItem value="__all__" className="cursor-pointer">All Semesters</SelectItem>
                                {semesters.map((sem) => (
                                  <SelectItem key={sem} value={sem || ""} className="cursor-pointer">{sem}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  {/* Data Table */}
                  <div className="max-h-[600px] overflow-auto rounded-md border border-gray-200 dark:border-gray-700">
                    <Table className="text-[12px]">
                      <TableHeader>
                        <TableRow className="bg-[var(--customized-color-five)]/60 dark:bg-muted/30">
                          <TableHead className="whitespace-nowrap text-black dark:text-white">Year Level - Semester</TableHead>
                          <TableHead className="whitespace-nowrap text-black dark:text-white">Subject Code</TableHead>
                          <TableHead className="whitespace-nowrap text-black dark:text-white">Subject Name</TableHead>
                          <TableHead className="whitespace-nowrap text-black dark:text-white">Units</TableHead>
                          <TableHead className="whitespace-nowrap text-black dark:text-white">Grade of Student</TableHead>
                          <TableHead className="whitespace-nowrap text-black dark:text-white">Year Taken</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {student.grades
                          .filter(g => (yearLevelFilter === "__all__" || !yearLevelFilter ? true : g.yearLevel === yearLevelFilter))
                          .filter(g => (semesterFilter === "__all__" || !semesterFilter ? true : g.semester === semesterFilter))
                          .map((grade, idx) => {
                            const ylSem = `${grade.yearLevel} - ${grade.semester}`
                            const yearTakenText = typeof grade.yearTaken === "number"
                              ? `${grade.yearTaken}-${grade.yearTaken + 1} / ${grade.semester}`
                              : "N/A"
                            return (
                              <TableRow key={`${grade.subjectCode}-${idx}`}>
                                <TableCell className="whitespace-nowrap text-black dark:text-white">{ylSem}</TableCell>
                                <TableCell className="whitespace-nowrap text-black dark:text-white">{grade.subjectCode}</TableCell>
                                <TableCell className="text-black dark:text-white">{grade.subjectName}</TableCell>
                                <TableCell className="whitespace-nowrap text-black dark:text-white">{grade.units}</TableCell>
                                <TableCell className="whitespace-nowrap">
                                  <Badge className={`${getGradeColor(grade.grade)} font-bold`}>
                                    {grade.grade ? grade.grade.toFixed(2) : "N/A"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap text-black dark:text-white">{yearTakenText}</TableCell>
                              </TableRow>
                            )
                          })}
                      </TableBody>
                    </Table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Details Tab */}
        <TabsContent value="performance" className="space-y-4">
          {/* GWA per Semester */}
          <Card className="bg-white dark:bg-black border-none">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">GWA per Semester</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.gwaPerSemester && student.gwaPerSemester.length > 0 ? (
                  student.gwaPerSemester.map((sem, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-[var(--customized-color-one)] dark:hover:border-[var(--customized-color-one)] transition-colors">
                      <div className="flex-1">
                        <h4 className="font-semibold text-black dark:text-white">{sem.semester}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Academic Year {sem.year} • {sem.units} units</p>
                      </div>
                      <div className="text-right">
                        <Badge className={`${getGradeColor(sem.gwa)} text-xl px-4 py-2 font-bold`}>
                          {sem.gwa.toFixed(2)}
                        </Badge>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{getGradeStatus(sem.gwa)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No semester GWA data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance per Semester */}
          <Card className="bg-white dark:bg-black border-none">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Attendance per Semester</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.attendancePerSemester && student.attendancePerSemester.length > 0 ? (
                  student.attendancePerSemester.map((att, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-[var(--customized-color-one)] dark:hover:border-[var(--customized-color-one)] transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-black dark:text-white">{att.semester}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Academic Year {att.year}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-[var(--customized-color-one)]">{att.presentPercentage}%</div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Present Rate</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-3 text-sm text-center">
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded">
                          <p className="text-lg font-bold text-green-600">{att.present}</p>
                          <p className="text-xs text-green-600">Present</p>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded">
                          <p className="text-lg font-bold text-red-600">{att.absent}</p>
                          <p className="text-xs text-red-600">Absent</p>
                        </div>
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                          <p className="text-lg font-bold text-yellow-600">{att.late}</p>
                          <p className="text-xs text-yellow-600">Late</p>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <p className="text-lg font-bold text-blue-600">{att.excused}</p>
                          <p className="text-xs text-blue-600">Excused</p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Attendance Progress</span>
                          <span className="text-black dark:text-white">{att.present}/{att.total}</span>
                        </div>
                        <Progress value={att.presentPercentage} className="h-2" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No attendance data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Grades per Subject (Chart/Graph View) */}
          <Card className="bg-white dark:bg-black border-none">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Grades per Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.grades && student.grades.length > 0 ? (
                  student.grades.map((grade, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-black dark:text-white">{grade.subjectName}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{grade.subjectCode} • {grade.semester}</p>
                        </div>
                        <Badge className={`${getGradeColor(grade.grade)} font-bold`}>
                          {grade.grade ? grade.grade.toFixed(2) : "N/A"}
                        </Badge>
                      </div>
                      <div className="relative w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            grade.grade && grade.grade >= 95 ? "bg-green-500" :
                            grade.grade && grade.grade >= 90 ? "bg-blue-500" :
                            grade.grade && grade.grade >= 85 ? "bg-yellow-500" :
                            grade.grade && grade.grade >= 80 ? "bg-orange-500" :
                            grade.grade && grade.grade >= 75 ? "bg-red-400" :
                            "bg-red-600"
                          }`}
                          style={{ width: grade.grade ? `${(grade.grade / 100) * 100}%` : "0%" }}
                        />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No grade data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Progress Overview */}
          <Card className="bg-white dark:bg-black border-none">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Overall Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Completion Rate</span>
                  <span className="text-black dark:text-white font-semibold">{student.completionRate}%</span>
                </div>
                <Progress value={parseFloat(student.completionRate)} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-2 border-green-200 dark:border-green-800">
                  <p className="text-3xl font-bold text-green-600">{student.passedSubjects}</p>
                  <p className="text-sm text-green-600 font-medium">Passed</p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800">
                  <p className="text-3xl font-bold text-red-600">{student.failedSubjects}</p>
                  <p className="text-sm text-red-600 font-medium">Failed</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-2 border-blue-200 dark:border-blue-800">
                  <p className="text-3xl font-bold text-blue-600">{student.totalSubjects}</p>
                  <p className="text-sm text-blue-600 font-medium">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Grade Entries */}
          <Card className="bg-white dark:bg-black border-none">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Recent Grade Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {student.gradeEntries && student.gradeEntries.length > 0 ? (
                  student.gradeEntries.slice(0, 10).map((entry, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-[var(--customized-color-one)] dark:hover:border-[var(--customized-color-one)] transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-black dark:text-white">{entry.subject}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {entry.className} • {entry.professor}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className="bg-[var(--customized-color-one)] text-white text-base px-3 py-1">
                            {entry.score}/{entry.maxScore || "N/A"}
                          </Badge>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatDate(entry.dateRecorded)}</p>
                        </div>
                      </div>
                      {entry.component && (
                        <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          <span className="font-medium">Component:</span> {entry.component}
                          {entry.weight && <span className="font-semibold"> ({entry.weight}%)</span>}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    No grade entries found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Profile Information Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card className="bg-white dark:bg-black border-none">
            <CardHeader>
              <CardTitle className="text-black dark:text-white">Profile Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black dark:text-white">Personal Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Birthday</p>
                        <p className="text-black dark:text-white">{formatDate(student.birthday || student.created_at)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Contact Number</p>
                        <p className="text-black dark:text-white">{student.contact_number || "Not provided"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                        <p className="text-black dark:text-white">{student.address || "Not provided"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-black dark:text-white">Academic Information</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Course</p>
                      <p className="text-black dark:text-white">{student.course}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Department</p>
                      <p className="text-black dark:text-white">{student.department}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Year Level</p>
                      <p className="text-black dark:text-white">{student.yearLevel}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Section</p>
                      <p className="text-black dark:text-white">{student.section}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black dark:text-white">System Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Account Created</p>
                    <p className="text-black dark:text-white">{formatDate(student.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                    <p className="text-black dark:text-white">{formatDate(student.updated_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}