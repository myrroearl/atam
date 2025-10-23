"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, BarChart, Book, CheckCircle, ChevronDown, ChevronRight, FileText, FlaskConical, Percent, Plus, Star, Target, TrendingUp, Trophy, XCircle, Brain, AlertTriangle, Award, BookOpen, GraduationCap } from "lucide-react"
import { Bar, BarChart as BarChartRecharts, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from "recharts"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

type ApiClass = {
  class_id: number
  subjects: { subject_id: number; subject_code: string; subject_name: string; units: number | null } | null
}
type GradeRow = {
  subject_id: number
  grade: number | null
}

// Grade conversion function (e.g., German/Austrian style where 1 is best)
const convertPercentToGradeScale = (percentage: number | null): string => {
  if (percentage === null || !isFinite(percentage)) return "N/A";
  if (percentage >= 90) return "1.0";
  if (percentage >= 80) return "2.0";
  if (percentage >= 70) return "3.0";
  if (percentage >= 60) return "4.0";
  return "5.0";
};

// Helper component to render grade status icons
const GradeStatusIcon = ({ status }: { status: string }) => {
  if (status === "Graded") return <CheckCircle className="w-4 h-4 text-green-500" />
  if (status === "Upcoming") return <ChevronRight className="w-4 h-4 text-gray-400" />
  return <XCircle className="w-4 h-4 text-red-500" />
}

// Define the type for a single subject based on the new data structure
type Subject = {
  id: number
  name: string
  code: string
  progress: number
  target: number
  grade: number
  classRank: number
  works: any[]
  icon: any
}

type Assignment = {
  name: string;
  status: string;
  score: number | null;
  total: number;
  component?: any;
};

function GradesPanel({ subjects, selectedSubjectId, onBack, showGradeReportsDialog, setShowGradeReportsDialog, handleGradeReports, entriesBySubject }: { 
  subjects: Subject[]; 
  selectedSubjectId: number | 'overall' | null; 
  onBack: () => void;
  showGradeReportsDialog: boolean;
  setShowGradeReportsDialog: (show: boolean) => void;
  handleGradeReports: () => void;
  entriesBySubject: Record<number, Assignment[]>;
}) {
  if (selectedSubjectId === 'overall') {
    if (subjects.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No subject data available.</p>
        </div>
      );
    }
    const overallAverage = subjects.reduce((acc, s) => acc + s.grade, 0) / subjects.length;
    const bestSubject = subjects.reduce((best, s) => (s.grade > best.grade ? s : best), subjects[0]);
    const improvementSubject = subjects.reduce((worst, s) => (s.grade < worst.grade ? s : worst), subjects[0]);
    const gradeData = subjects.map(s => ({
      name: s.name,
      grade: s.grade,
      target: s.target,
    }));
    
    // Calculate additional statistics for visualizations
    const totalProgress = subjects.reduce((acc, s) => acc + s.progress, 0) / subjects.length;
    const totalAssignments = subjects.reduce((acc, s) => acc + (s.works as any[]).length, 0);
    const completedAssignments = subjects.reduce((acc, s) => acc + (s.works as any[]).filter(a => a.status === 'Graded').length, 0);
    const completionRate = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;
    
    // Grade distribution data
    const gradeDistribution = [
      { range: '90-100%', count: subjects.filter(s => s.grade >= 90).length, color: '#10b981' },
      { range: '80-89%', count: subjects.filter(s => s.grade >= 80 && s.grade < 90).length, color: '#3b82f6' },
      { range: '70-79%', count: subjects.filter(s => s.grade >= 70 && s.grade < 80).length, color: '#f59e0b' },
      { range: '60-69%', count: subjects.filter(s => s.grade >= 60 && s.grade < 70).length, color: '#ef4444' },
      { range: 'Below 60%', count: subjects.filter(s => s.grade < 60).length, color: '#dc2626' },
    ];
    
    // Progress vs Target comparison
    const progressData = subjects.map(s => ({
      name: s.name,
      progress: s.progress,
      target: s.target,
      grade: s.grade,
    }));
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Subjects
          </Button>
          <AlertDialog open={showGradeReportsDialog} onOpenChange={setShowGradeReportsDialog}>
            <AlertDialogTrigger asChild>
              <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-card hover:shadow-card-lg">
                <GraduationCap className="w-4 h-4 mr-2" />
                Grade Reports
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="sm:max-w-md">
              <AlertDialogHeader className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-5 h-5 text-white" />
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
        
        {/* Overall Performance Summary */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Overall Academic Performance</CardTitle>
            <CardDescription>A comprehensive summary of your grades across all subjects.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-6 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground font-medium">Average Grade</p>
                <p className="text-3xl font-bold">{convertPercentToGradeScale(overallAverage)}</p>
                <p className="text-sm text-muted-foreground">{Number.isFinite(overallAverage) ? overallAverage.toFixed(2) : '0.00'}%</p>
              </div>
              <div className="p-6 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground font-medium">Overall Progress</p>
                <p className="text-3xl font-bold">{Number.isFinite(totalProgress) ? totalProgress.toFixed(2) : '0.00'}%</p>
                <Progress value={totalProgress} className="mt-2 h-2" />
              </div>
              <div className="p-6 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground font-medium">Works Completion</p>
                <p className="text-3xl font-bold">{Number.isFinite(completionRate) ? completionRate.toFixed(2) : '0.00'}%</p>
                <p className="text-sm text-muted-foreground">{completedAssignments}/{totalAssignments}</p>
              </div>
              <div className="p-6 rounded-lg bg-muted/50">
                <p className="text-sm text-muted-foreground font-medium">Subjects</p>
                <p className="text-3xl font-bold">{subjects.length}</p>
                <p className="text-sm text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
            <CardHeader>
              <CardTitle>Best Performing Subject</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-xl font-bold mb-2">{bestSubject.name}</p>
                  <p className="text-4xl font-bold">{convertPercentToGradeScale(bestSubject.grade)}</p>
                  <p className="text-sm text-muted-foreground">{Number.isFinite(bestSubject.grade) ? bestSubject.grade.toFixed(2) : '0.00'}%</p>
                </div>
                <Progress value={bestSubject.grade} className="mt-4 h-3" />
                <p className="text-xs text-muted-foreground">Keep up the excellent work!</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
            <CardHeader>
              <CardTitle>Needs Improvement</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div>
                  <p className="text-xl font-bold mb-2">{improvementSubject.name}</p>
                  <p className="text-4xl font-bold">{convertPercentToGradeScale(improvementSubject.grade)}</p>
                  <p className="text-sm text-muted-foreground">{Number.isFinite(improvementSubject.grade) ? improvementSubject.grade.toFixed(2) : '0.00'}%</p>
                </div>
                <Progress value={improvementSubject.grade} className="mt-4 h-3" />
                <p className="text-xs text-muted-foreground">Focus on this subject for improvement</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Grade Distribution Chart */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Breakdown of your grades across all subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChartRecharts data={gradeDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" name="Number of Subjects">
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChartRecharts>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progress vs Target Comparison */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
          <CardHeader>
            <CardTitle>Progress vs Goal Comparison</CardTitle>
            <CardDescription>How your current progress compares to your goals</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChartRecharts data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="progress" fill="hsl(var(--primary))" name="Current Progress" />
                <Bar dataKey="target" fill="hsl(var(--chart-2))" name="Goal Progress" />
                <Bar dataKey="grade" fill="hsl(var(--chart-3))" name="Current Grade" />
              </BarChartRecharts>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject Performance Comparison */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
          <CardHeader>
            <CardTitle>Subject Performance Comparison</CardTitle>
            <CardDescription>Your current grades vs. goal grades for each subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChartRecharts data={gradeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                  }}
                />
                <Bar dataKey="grade" fill="hsl(var(--primary))" name="Current Grade" />
                <Bar dataKey="target" fill="hsl(var(--chart-2))" name="Goal Grade" />
              </BarChartRecharts>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-2xl rounded-2xl border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                <Brain className="w-3 h-3 text-white" />
              </div>
              <span>Overall Performance Insights</span>
            </CardTitle>
            <CardDescription>AI-powered analysis of your academic performance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
                <div className="flex items-start space-x-3">
                  <TrendingUp className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Strong Subjects</p>
                    <p className="text-sm text-muted-foreground">
                      {subjects.filter(s => s.grade >= 85).length} subjects with grades 85% or higher. 
                      {subjects.filter(s => s.grade >= 85).length > 0 && 
                        ` ${subjects.filter(s => s.grade >= 85).map(s => s.name).join(', ')} are your strongest areas.`
                      }
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="flex items-start space-x-3">
                  <Target className="w-5 h-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Goal Achievement</p>
                    <p className="text-sm text-muted-foreground">
                      {subjects.filter(s => s.grade >= s.target).length} out of {subjects.length} subjects 
                      are meeting or exceeding your goal grades.
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-orange-500 mt-0.5" />
                  <div>
                    <p className="font-medium">Focus Areas</p>
                    <p className="text-sm text-muted-foreground">
                      {subjects.filter(s => s.grade < 75).length} subjects need attention. 
                      {subjects.filter(s => s.grade < 75).length > 0 && 
                        ` Focus on ${subjects.filter(s => s.grade < 75).map(s => s.name).join(', ')}.`
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const subject = subjects.find(s => s.id === selectedSubjectId);
  if (!subject) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Select a subject to view its details.</p>
      </div>
    );
  }
  
  const assignments: Assignment[] = entriesBySubject[subject.id] || [];
  const gradedAssignments = assignments.filter(a => a.status === 'Graded' && a.score !== null);
  const totalPossible = gradedAssignments.reduce((sum, a) => sum + a.total, 0);
  const averageScorePercent = totalPossible > 0 ? (gradedAssignments.reduce((sum, a) => sum + a.score!, 0) / totalPossible) * 100 : 0;
  const assignmentScoresPercent = gradedAssignments.map(a => (a.score! / a.total) * 100);
  const highestScore = Math.max(...assignmentScoresPercent);
  const lowestScore = Math.min(...assignmentScoresPercent);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Subjects
        </Button>
        <AlertDialog open={showGradeReportsDialog} onOpenChange={setShowGradeReportsDialog}>
          <AlertDialogTrigger asChild>
            <Button className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-card hover:shadow-card-lg">
              <GraduationCap className="w-4 h-4 mr-2" />
              Grade Reports
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
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
      
      <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardTitle className="text-2xl flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <Book className="w-5 h-5 text-white" />
            </div>
            <span>{subject.name}</span>
          </CardTitle>
          <CardDescription>Detailed breakdown of your performance in this subject.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground font-medium">Overall Grade</p>
              <p className="text-3xl font-bold">{convertPercentToGradeScale(subject.grade)}</p>
              <p className="text-sm text-muted-foreground">{Number.isFinite(subject.grade) ? subject.grade.toFixed(2) : '0.00'}%</p>
            </div>
            <div className="p-6 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground font-medium">Goal Grade</p>
              <p className="text-3xl font-bold">{convertPercentToGradeScale(subject.target)}</p>
              <p className="text-sm text-muted-foreground">{Number.isFinite(subject.target) ? subject.target.toFixed(2) : '0.00'}%</p>
            </div>
            <div className="p-6 rounded-lg bg-muted/50 text-center">
              <p className="text-sm text-muted-foreground font-medium">Class Rank</p>
              <p className="text-3xl font-bold">#{subject.classRank}</p>
              <p className="text-sm text-muted-foreground">Position</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
        <CardHeader>
          <CardTitle>Subject Statistics</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">Total Works</p>
            <p className="font-bold text-lg">{assignments.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">Graded</p>
            <p className="font-bold text-lg">{gradedAssignments.length}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">Average Grade</p>
            <p className="font-bold text-lg">{convertPercentToGradeScale(averageScorePercent)}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-muted-foreground">High / Low Grade</p>
            <p className="font-bold text-lg">
              {convertPercentToGradeScale(highestScore)} / {convertPercentToGradeScale(lowestScore)}
            </p>
          </div>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl rounded-2xl">
            <CardHeader>
              <CardTitle>Works</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((item: Assignment) => (
                    <TableRow key={item.name}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell>{item.score !== null ? `${item.score}/${item.total}` : "N/A"}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <GradeStatusIcon status={item.status} />
                          <span>{item.status}</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
     
    </div>
  );
}

// Map subject IDs to semesters (for now, based on the new subjects.ts structure)
const semesterMap: Record<string, number[]> = {
  '1st Sem': [1,2,3,4,5],
  '2nd Sem': [6,7,8,9,10],
  'Summer': [11,12,13,14],
};
const semesterOptions = Object.keys(semesterMap);

export function GradeReports() {
  const router = useRouter();
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [selectedSemester, setSelectedSemester] = useState('1st Sem');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'overall' | null>(null);
  const [showGradeReportsDialog, setShowGradeReportsDialog] = useState(false);

  useEffect(() => {
    // Safe access to search params
    try {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
      const subjectId = params.get('subject');
      if (subjectId && subjectId !== 'overall') {
        setSelectedSubjectId(parseInt(subjectId, 10));
      } else {
        setSelectedSubjectId('overall');
      }
    } catch (error) {
      console.warn('Error accessing search params:', error);
      setSelectedSubjectId('overall');
    }
  }, []);

  const handleBack = () => {
    router.push('/student/subjects');
  };

  const handleGradeReports = () => {
    router.push('/student/grade-reports');
  };

  const [apiSubjects, setApiSubjects] = useState<ApiClass[]>([])
  const [apiGrades, setApiGrades] = useState<GradeRow[]>([])
  const [apiEntries, setApiEntries] = useState<any[]>([])
  const [sectionRankings, setSectionRankings] = useState<Record<number, number>>({})
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [sRes, gRes, eRes, rRes] = await Promise.all([
          fetch('/api/student/subjects', { cache: 'no-store' }),
          fetch('/api/student/grades', { cache: 'no-store' }),
          fetch('/api/student/entries', { cache: 'no-store' }),
          fetch('/api/student/section-rankings', { cache: 'no-store' }),
        ])
        if (!sRes.ok || !gRes.ok || !eRes.ok || !rRes.ok) throw new Error('Failed to load subjects/grades/entries/rankings')
        const sBody = await sRes.json()
        const gBody = await gRes.json()
        const eBody = await eRes.json()
        const rBody = await rRes.json()
        if (!active) return
        setApiSubjects(sBody.subjects || [])
        setApiGrades((gBody.grades || []).map((g: any) => ({ subject_id: g.subject_id, grade: g.grade })))
        setApiEntries(eBody.entries || [])
        setSectionRankings(rBody.rankings || {})
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load data')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  // Build entries by subject to compute grades from actual works
  const entriesBySubject: Record<number, Assignment[]> = (() => {
    const map: Record<number, Assignment[]> = {}
    for (const e of apiEntries) {
      const subjectId = e.classes?.subject_id || null
      if (!subjectId) continue
      const arr = map[subjectId] || (map[subjectId] = [])
      arr.push({
        name: e.name || e.learning_outcomes?.outcome_description || e.learning_outcomes?.outcome_code || e.grade_components?.component_name || `Work ${e.grade_id}`,
        status: e.score != null ? 'Graded' : 'Pending',
        score: e.score != null ? Number(e.score) : null,
        total: e.max_score != null ? Number(e.max_score) : 0,
        component: e.grade_components || null, // Include component info for weighted calculation
      })
    }
    return map
  })()

  const subjects: Subject[] = apiSubjects.map((c) => {
    const subj = c.subjects
    const subjectId = subj?.subject_id || c.class_id
    const worksForSubject = entriesBySubject[subjectId] || []
    const gradedWorks = worksForSubject.filter(w => 
      w.status === 'Graded' && w.score !== null && w.component && w.component.weight_percentage != null
    )
    
    // Group works by component and calculate weighted grades
    const componentGroups: Record<string, { works: Assignment[], weight: number, componentName: string }> = {}
    
    gradedWorks.forEach(work => {
      const componentId = work.component.component_id || 'unknown'
      const weight = Number(work.component.weight_percentage) || 0
      const componentName = work.component.component_name || 'Unknown'
      
      if (!componentGroups[componentId]) {
        componentGroups[componentId] = {
          works: [],
          weight: weight,
          componentName: componentName
        }
      }
      componentGroups[componentId].works.push(work)
    })
    
    // Calculate weighted average for each component, then overall weighted grade
    let totalWeightedGrade = 0
    let totalWeight = 0
    
    Object.values(componentGroups).forEach(component => {
      if (component.works.length > 0 && component.weight > 0) {
        const componentTotalScore = component.works.reduce((sum, work) => sum + (work.score as number), 0)
        const componentTotalPossible = component.works.reduce((sum, work) => sum + work.total, 0)
        const componentPercentage = componentTotalPossible > 0 ? (componentTotalScore / componentTotalPossible) * 100 : 0
        
        totalWeightedGrade += (componentPercentage * component.weight) / 100
        totalWeight += component.weight
      }
    })
    
    const computedPercent = totalWeight > 0 ? (totalWeightedGrade / totalWeight) * 100 : 0

    return {
      id: subjectId,
      name: subj?.subject_name || 'Subject',
      code: subj?.subject_code || 'N/A',
      progress: 0,
      target: 85,
      grade: Number.isFinite(computedPercent) ? computedPercent : 0,
      classRank: sectionRankings[subjectId] || 0,
      works: worksForSubject,
      icon: BookOpen,
    }
  })

  // entriesBySubject computed above

  // Filter subjects by selected semester (placeholder mapping retained)
  const filteredSubjects = subjects.filter(subject => semesterMap[selectedSemester].includes(subject.id));

  return (
    <div className="px-6 pb-8 max-w-[1400px] mx-auto">
      {loading && <p className="text-sm text-muted-foreground">Loading subjects...</p>}
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="grid md:grid-cols-[280px_1fr] gap-8 items-start">
      <aside className="hidden md:flex flex-col gap-4 sticky top-20">
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
            <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-white" />
            </div>
            <span>Subjects</span>
          </h3>
          <div className="mb-4 relative">
            <select
              className="w-full appearance-none px-4 py-3 pr-10 rounded-lg border border-input text-foreground bg-background text-sm font-medium shadow-card focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-200 cursor-pointer hover:shadow-card-lg"
              value={selectedSemester}
              onChange={e => setSelectedSemester(e.target.value)}
            >
              {semesterOptions.map(option => (
                <option key={option} value={option} className="text-foreground bg-background">
                  {option}{option === '1st Sem' ? ' (Current)' : ''}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            <Link
              href={`/student/subjects/grades?subject=overall`}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                selectedSubjectId === 'overall'
                  ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-card-lg"
                  : "hover:bg-muted hover:shadow-card text-foreground"
              }`}
            >
              <BarChart className="w-5 h-5" />
              <span className="font-medium">Overall</span>
            </Link>
            <Separator className="my-2" />
            {filteredSubjects.map((subject) => {
              const Icon = subject.icon;
              return (
                <Link
                  href={`/student/subjects/grades?subject=${subject.id}`}
                  key={subject.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                    selectedSubjectId === subject.id
                      ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-card-lg"
                      : "hover:bg-muted hover:shadow-card text-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{subject.name}</span>
                </Link>
              );
            })}
          </nav>
        </Card>
      </aside>
      <main>
        <GradesPanel 
          subjects={filteredSubjects} 
          selectedSubjectId={selectedSubjectId} 
          onBack={handleBack}
          showGradeReportsDialog={showGradeReportsDialog}
          setShowGradeReportsDialog={setShowGradeReportsDialog}
          handleGradeReports={handleGradeReports}
          entriesBySubject={entriesBySubject}
        />
      </main>
      </div>
    </div>
  );
}