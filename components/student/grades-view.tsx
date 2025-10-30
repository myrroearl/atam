"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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

type ApiClass = {
  class_id: number
  subjects: { subject_id: number; subject_code: string; subject_name: string; units: number | null } | null
}
type GradeRow = {
  subject_id: number
  grade: number | null
}

// Import the precise GPA conversion function and grade calculation utilities
import { convertPercentageToPreciseGPA, calculateWeightedAverage } from "@/lib/student/grade-calculations";
import { calculateIndividualSubjectGrade } from "@/lib/student/subject-grade-calculator";

// Grade conversion function using precise GPA calculation
const convertPercentToGradeScale = (percentage: number | null): string => {
  if (percentage === null || !isFinite(percentage)) return "N/A";
  return convertPercentageToPreciseGPA(percentage).toFixed(2);
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
  units: number
}

type Assignment = {
  name: string;
  status: string;
  score: number | null;
  total: number;
  component?: any;
};

function GradesPanel({ subjects, selectedSubjectId, onBack, handleGradeReports, entriesBySubject, apiSubjects, apiEntries }: { 
  subjects: Subject[]; 
  selectedSubjectId: number | 'overall' | null; 
  onBack: () => void;
  handleGradeReports: () => void;
  entriesBySubject: Record<number, Assignment[]>;
  apiSubjects: ApiClass[];
  apiEntries: any[];
}) {
  if (selectedSubjectId === 'overall') {
    if (subjects.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">No subject data available.</p>
        </div>
      );
    }
    // Calculate overall average using the same method as dashboard GWA
    // Use the units stored in the subject object
    const allSubjectsWithGrades = subjects.map(s => ({
      percentage: s.grade,
      units: s.units // Use actual units from subject object
    }));
    
    // Calculate weighted average using the same function as dashboard GWA
    const overallAverage = calculateWeightedAverage(allSubjectsWithGrades);
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
          <Button 
            onClick={handleGradeReports}
            className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-card hover:shadow-card-lg"
          >
            <GraduationCap className="w-4 h-4 mr-2" />
            Grade Reports
          </Button>
        </div>
        
        {/* Overall Performance Summary */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
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
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
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
          
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
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
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
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


        {/* Subject Achievement Analysis */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-500" />
              Subject Achievement Analysis
            </CardTitle>
            <CardDescription>Detailed analysis of your performance across all subjects with achievement insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Achievement Status Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {gradeData.map((subject, index) => {
                  const achievement = subject.grade >= subject.target ? 'exceeded' : 
                                   subject.grade >= subject.target * 0.9 ? 'on-track' : 'needs-improvement';
                  const achievementColor = achievement === 'exceeded' ? 'emerald' : 
                                         achievement === 'on-track' ? 'blue' : 'orange';
                  
                  return (
                    <div key={subject.name} className={`p-4 rounded-xl border-2 transition-all duration-200 hover:shadow-lg ${
                      achievement === 'exceeded' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800' :
                      achievement === 'on-track' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800' :
                      'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm text-foreground truncate">{subject.name}</h4>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          achievement === 'exceeded' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                          achievement === 'on-track' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                          'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300'
                        }`}>
                          {achievement === 'exceeded' ? 'Exceeded' : 
                           achievement === 'on-track' ? 'On Track' : 'Needs Focus'}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Current Grade</span>
                          <span className="font-bold text-sm">{subject.grade.toFixed(1)}%</span>
                        </div>
                        <Progress value={subject.grade} className="h-2" />
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Target Grade</span>
                          <span className="font-bold text-sm">{subject.target.toFixed(1)}%</span>
                        </div>
                        <Progress value={subject.target} className="h-2" />
                        
                        <div className="pt-2 border-t border-border/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">Gap</span>
                            <span className={`font-medium ${
                              subject.grade >= subject.target ? 'text-emerald-600 dark:text-emerald-400' : 
                              'text-orange-600 dark:text-orange-400'
                            }`}>
                              {subject.grade >= subject.target ? '+' : ''}{(subject.grade - subject.target).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Achievement Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Trophy className="w-5 h-5 text-emerald-600" />
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">Exceeded Goals</span>
                  </div>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {gradeData.filter(s => s.grade >= s.target).length}
                  </p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    {gradeData.length > 0 ? Math.round((gradeData.filter(s => s.grade >= s.target).length / gradeData.length) * 100) : 0}% of subjects
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Target className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-700 dark:text-blue-300">On Track</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {gradeData.filter(s => s.grade >= s.target * 0.9 && s.grade < s.target).length}
                  </p>
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    {gradeData.length > 0 ? Math.round((gradeData.filter(s => s.grade >= s.target * 0.9 && s.grade < s.target).length / gradeData.length) * 100) : 0}% of subjects
                  </p>
                </div>
                
                <div className="text-center p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                    <span className="font-semibold text-orange-700 dark:text-orange-300">Needs Focus</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {gradeData.filter(s => s.grade < s.target * 0.9).length}
                  </p>
                  <p className="text-sm text-orange-600 dark:text-orange-400">
                    {gradeData.length > 0 ? Math.round((gradeData.filter(s => s.grade < s.target * 0.9).length / gradeData.length) * 100) : 0}% of subjects
                  </p>
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
        <Button 
          onClick={handleGradeReports}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-card hover:shadow-card-lg"
        >
          <GraduationCap className="w-4 h-4 mr-2" />
          Grade Reports
        </Button>
      </div>
      
      <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300 overflow-hidden">
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
      
      <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
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
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-2xl dark:shadow-card-2xl rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
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
                  {assignments.map((item: Assignment, index: number) => (
                    <TableRow key={`${item.name}-${index}`}>
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

export function GradesView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedSemester, setSelectedSemester] = useState('1st Sem');
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | 'overall' | null>(null);

  useEffect(() => {
    const subjectId = searchParams.get('subject');
    if (subjectId && subjectId !== 'overall') {
      setSelectedSubjectId(parseInt(subjectId, 10));
    } else {
      setSelectedSubjectId('overall');
    }
  }, [searchParams]);

  const handleBack = () => {
    router.push('/student/subjects');
  };

  const handleGradeReports = () => {
    console.log('Grade Reports button clicked - navigating to /student/subjects/grades/grade-reports');
    
    try {
      router.push('/student/subjects/grades/grade-reports');
    } catch (error) {
      console.error('Router push failed:', error);
      // Fallback to window.location
      window.location.href = '/student/subjects/grades/grade-reports';
    }
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
    
    // Get all grade entries for this subject from apiEntries
    const subjectEntries = apiEntries.filter(entry => 
      entry.classes?.subject_id === subjectId
    )
    
    // Get the actual student ID from the entries (assuming all entries are for the current student)
    const currentStudentId = subjectEntries.length > 0 ? subjectEntries[0].student_id : 1
    
    // Use the subject grade calculator for consistent calculation
    const calculatedGrade = calculateIndividualSubjectGrade(
      currentStudentId, // Use actual student ID from the data
      subjectId,
      apiEntries, // Pass all entries, calculator will filter by student and subject
      subjectEntries.map(entry => entry.grade_components).filter(comp => comp != null)
    )

    // Calculate progress based on completed works vs total works
    // A work is considered completed if it has a score (even if it's 0 or failing)
    const totalWorks = subjectEntries.length
    const completedWorks = subjectEntries.filter(w => w && w.score != null && w.max_score != null).length
    const progress = totalWorks > 0 ? (completedWorks / totalWorks) * 100 : 0

    return {
      id: subjectId,
      name: subj?.subject_name || 'Subject',
      code: subj?.subject_code || 'N/A',
      progress: Math.round(progress),
      target: 85,
      grade: calculatedGrade.percentage,
      classRank: sectionRankings[subjectId] || 0,
      works: worksForSubject,
      icon: BookOpen,
      units: subj?.units || 3, // Store actual units for consistency
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
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg dark:shadow-card-lg rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300 p-4">
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
          handleGradeReports={handleGradeReports}
          entriesBySubject={entriesBySubject}
          apiSubjects={apiSubjects}
          apiEntries={apiEntries}
        />
      </main>
      </div>
    </div>
  );
}