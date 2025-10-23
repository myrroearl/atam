"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { BookOpen, Users, Star, TrendingUp, Award, ChevronDown, FileText, AlertTriangle, BarChart } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
type ApiClass = {
  class_id: number
  subjects: { subject_id: number; subject_code: string; subject_name: string; units: number | null } | null
  professors: { prof_id: number; first_name: string; last_name: string } | null
  schedule_start: string | null
  schedule_end: string | null
}
type Subject = {
  id: number
  code: string
  name: string
  units: number
  description: string
  instructor: string
  progress: number
  grade: number
  works: any[]
}

const getGradeBadgeClass = (grade: number) => {
  if (grade >= 90) return "bg-green-100/50 text-green-800 hover:bg-green-100";
  if (grade >= 80) return "bg-blue-100/50 text-blue-800 hover:bg-blue-100";
  if (grade >= 70) return "bg-yellow-100/50 text-yellow-800 hover:bg-yellow-100";
  return "bg-red-100/50 text-red-800 hover:bg-red-100";
};

const semesterOptions = ['1st Sem','2nd Sem','Summer']

export function SubjectsList() {
  const router = useRouter();
  const [selectedSemester, setSelectedSemester] = useState('1st Sem');
  const [showViewReportDialog, setShowViewReportDialog] = useState(false);
  const [showGradeReportsDialog, setShowGradeReportsDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [rows, setRows] = useState<ApiClass[]>([])
  const [grades, setGrades] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [subjectsRes, gradesRes, entriesRes] = await Promise.all([
          fetch('/api/student/subjects', { cache: 'no-store' }),
          fetch('/api/student/grades', { cache: 'no-store' }),
          fetch('/api/student/entries', { cache: 'no-store' })
        ])
        
        if (!subjectsRes.ok || !gradesRes.ok || !entriesRes.ok) {
          throw new Error('Failed to load data')
        }
        
        const [subjectsBody, gradesBody, entriesBody] = await Promise.all([
          subjectsRes.json(),
          gradesRes.json(),
          entriesRes.json()
        ])
        
        if (active) {
          setRows(subjectsBody.subjects || [])
          setGrades(gradesBody.grades || [])
          setEntries(entriesBody.entries || [])
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load subjects')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [])

  const subjects: Subject[] = useMemo(() => {
    if (!rows || rows.length === 0) return []
    
    return rows.map((c) => {
      const subj = c.subjects
      const prof = c.professors
      const subjectId = subj?.subject_id || c.class_id
      
      // Get entries for this subject with safe access
      const subjectEntries = (entries || []).filter(e => 
        e && e.classes && e.classes.subject_id === subjectId
      )
      
      // Calculate weighted grade from entries using grade components
      const gradedWorks = subjectEntries.filter(w => 
        w && w.score != null && w.max_score != null && 
        !isNaN(Number(w.score)) && !isNaN(Number(w.max_score)) &&
        w.grade_components && w.grade_components.weight_percentage != null
      )
      
      // Group entries by component and calculate weighted grades
      const componentGroups: Record<string, { entries: any[], weight: number, componentName: string }> = {}
      
      gradedWorks.forEach(entry => {
        const componentId = entry.grade_components.component_id || 'unknown'
        const weight = Number(entry.grade_components.weight_percentage) || 0
        const componentName = entry.grade_components.component_name || 'Unknown'
        
        if (!componentGroups[componentId]) {
          componentGroups[componentId] = {
            entries: [],
            weight: weight,
            componentName: componentName
          }
        }
        componentGroups[componentId].entries.push(entry)
      })
      
      // Calculate weighted average for each component, then overall weighted grade
      let totalWeightedGrade = 0
      let totalWeight = 0
      
      Object.values(componentGroups).forEach(component => {
        if (component.entries.length > 0 && component.weight > 0) {
          const componentTotalScore = component.entries.reduce((sum, entry) => sum + Number(entry.score), 0)
          const componentTotalPossible = component.entries.reduce((sum, entry) => sum + Number(entry.max_score), 0)
          const componentPercentage = componentTotalPossible > 0 ? (componentTotalScore / componentTotalPossible) * 100 : 0
          
          totalWeightedGrade += (componentPercentage * component.weight) / 100
          totalWeight += component.weight
        }
      })
      
      const computedGrade = totalWeight > 0 ? (totalWeightedGrade / totalWeight) * 100 : 0
      
      // Calculate progress based on completed works vs total works
      const totalWorks = subjectEntries.length
      const completedWorks = subjectEntries.filter(w => w && w.score != null).length
      const progress = totalWorks > 0 ? (completedWorks / totalWorks) * 100 : 0
      
      return {
        id: subjectId || c.class_id || 0, // Ensure we always have a valid ID
        code: subj?.subject_code || 'N/A',
        name: subj?.subject_name || 'Subject',
        units: subj?.units || 0,
        description: '',
        instructor: prof ? `${prof.first_name} ${prof.last_name}` : 'TBA',
        progress: Math.round(progress),
        grade: Math.round(computedGrade),
        works: subjectEntries || [], // Ensure works is always an array
      }
    })
  }, [rows, entries])

  const filteredSubjects: Subject[] = subjects.filter(subject => 
    subject && subject.id != null && subject.id !== 0
  )
  
  // Calculate KPI stats with error handling
  const totalCompletedWorks = subjects.reduce((sum, subject) => {
    try {
      return sum + (subject.works || []).filter(w => w && w.score != null).length
    } catch {
      return sum
    }
  }, 0)
  
  const totalWorks = subjects.reduce((sum, subject) => {
    try {
      return sum + (subject.works || []).length
    } catch {
      return sum
    }
  }, 0)
  
  const avgGrade = subjects.length > 0 
    ? Math.round(subjects.reduce((sum, subject) => {
        try {
          return sum + (subject.grade || 0)
        } catch {
          return sum
        }
      }, 0) / subjects.length)
    : 0
  
  const overallProgress = totalWorks > 0 ? Math.round((totalCompletedWorks / totalWorks) * 100) : 0

  const handleViewReport = () => {
    router.push(`/student/subjects/grades?subject=overall`);
  };

  const handleGradeReports = () => {
    router.push('/student/grade-reports');
  };

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject);
  };

  const handleSubjectConfirm = () => {
    if (selectedSubject) {
      router.push(`/student/subjects/grades?subject=${selectedSubject.id}`);
    }
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            My Subjects
          </h1>
          <p className="text-muted-foreground">Track your courses and academic progress</p>
        </div>
        <div className="flex items-center gap-2">
         <div className="relative flex items-center">
           <select
             className="appearance-none px-4 py-2 pr-8 rounded-md border border-input text-foreground bg-background text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors cursor-pointer"
             value={selectedSemester}
             onChange={e => setSelectedSemester(e.target.value)}
           >
             {semesterOptions.map(option => (
               <option key={option} value={option} className="text-foreground bg-background">
                 {option}{option === '1st Sem' ? ' (Current)' : ''}
               </option>
             ))}
           </select>
           <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
         </div>
          <AlertDialog open={showViewReportDialog} onOpenChange={setShowViewReportDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline">View Report</Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-white" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold">View Overall Report</AlertDialogTitle>
                </div>
                  <AlertDialogDescription className="text-muted-foreground">
                    Do you want to view the overall academic report?
                  </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleViewReport} 
                  className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  Yes, View Report
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog open={showGradeReportsDialog} onOpenChange={setShowGradeReportsDialog}>
            <AlertDialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-card hover:shadow-card-lg">
                <FileText className="w-4 h-4 mr-2" />
                Grade Reports
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold">View Grade Reports</AlertDialogTitle>
                </div>
                <AlertDialogDescription className="text-muted-foreground">
                  Do you want to view the complete grade reports?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleGradeReports} 
                  className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                >
                  Yes, View Reports
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <p className="text-sm text-muted-foreground">Loading subjects...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-red-600">Error loading data: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
          >
            Reload page
          </button>
        </div>
      )}

      {/* Only render content if not loading and no error */}
      {!loading && !error && (
        <>
          {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{filteredSubjects.length}</p>
                <p className="text-sm text-muted-foreground">Active Courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-emerald-500" />
              <div>
                <p className="text-2xl font-bold">{avgGrade}%</p>
                <p className="text-sm text-muted-foreground">Avg Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{overallProgress}%</p>
                <p className="text-sm text-muted-foreground">Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{totalCompletedWorks}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>



      {/* Subjects Grid */}
      {filteredSubjects.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">No Subjects Found</h3>
          <p className="text-sm text-muted-foreground">You don't have any subjects enrolled yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSubjects.map((subject, index) => (
          <div key={subject.id || `subject-${index}`} className="no-underline">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl flex flex-col justify-between transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-card-lg h-full cursor-pointer hover:shadow-xl transition-all duration-300">
              <CardHeader>
                <div className="flex-1">
                    <CardTitle className="text-lg">{subject.name}</CardTitle>
                    <CardDescription className="flex items-center space-x-2 mt-1">
                      <span>{subject.code}</span>
                      <Badge variant="secondary">{subject.units} units</Badge>
                    </CardDescription>
                  </div>
              </CardHeader>
              <CardContent className="p-4 flex flex-col space-y-4 flex-grow">
                <p className="text-sm text-muted-foreground flex-grow">{subject.description}</p>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm font-bold">{subject.progress}%</span>
                  </div>
                  <Progress value={subject.progress} className="h-2" />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">{subject.instructor}</span>
                  </div>
                  <Badge className={getGradeBadgeClass(subject.grade)}>
                    {subject.grade}%
                  </Badge>
                </div>

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-muted-foreground">Works</span>
                    <span>{subject.works.filter(w => w.score != null).length}/{subject.works.length}</span>
                  </div>
                  <Progress value={subject.progress} className="h-1" />
                </div>
              </CardContent>
            </Card>
              </AlertDialogTrigger>
              <AlertDialogContent className="sm:max-w-md">
                <AlertDialogHeader className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-white" />
                  </div>
                  <AlertDialogTitle className="text-xl font-bold">View {subject.name} Details</AlertDialogTitle>
                </div>
                  <AlertDialogDescription className="text-muted-foreground">
                    Do you want to view the detailed report for <strong className="text-foreground">{subject.name}</strong>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
                  <AlertDialogCancel className="w-full sm:w-auto order-2 sm:order-1">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => router.push(`/student/subjects/grades?subject=${subject.id}`)} 
                    className="w-full sm:w-auto order-1 sm:order-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    Yes, View Details
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ))}
        </div>
      )}
        </>
      )}
    
    </div>
  )
}