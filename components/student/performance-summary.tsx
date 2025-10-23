"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Target, Brain, Clock, Award, AlertTriangle, CheckCircle, Lightbulb } from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  Cell,
} from "recharts"
import ErrorBoundary from "@/components/student/error-boundary"
type WeeklyRow = { week: string; performance: number; assignments: number; exams: number }
type GradeRow = { 
  grade: number | null; 
  subjects: { subject_name: string; units: number }
  avgOutcomeScore: number
  learningOutcomes: any[]
  strength: number
  weakness: string
}
type TopicData = {
  topic_name: string
  average_score: number
  total_assessments: number
  assessments: Array<{
    name: string
    score: number
    max_score: number
    percentage: number
  }>
}
type SubjectAnalysis = {
  subject_name: string
  subject_code: string
  units: number
  topics: TopicData[]
  strengths: Array<{
    topic_name: string
    average_score: number
  }>
  weaknesses: Array<{
    topic_name: string
    average_score: number
  }>
  overall_performance: number
}

export function PerformanceSummary() {
  const [weekly, setWeekly] = useState<WeeklyRow[]>([])
  const [grades, setGrades] = useState<GradeRow[]>([])
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([])
  const [performanceData, setPerformanceData] = useState<any>(null)
  const [topicAnalysis, setTopicAnalysis] = useState<SubjectAnalysis[]>([])
  const [overallStats, setOverallStats] = useState<any>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [pRes, gRes, tRes] = await Promise.all([
          fetch('/api/student/performance', { cache: 'no-store' }).catch(err => ({ ok: false, error: err.message })),
          fetch('/api/student/grades', { cache: 'no-store' }).catch(err => ({ ok: false, error: err.message })),
          fetch('/api/student/topic-performance', { cache: 'no-store' }).catch(err => ({ ok: false, error: err.message })),
        ])
        
        // Handle individual fetch errors
        if (!pRes.ok) {
          console.warn('Performance API failed:', (pRes as any).error || 'Unknown error')
        }
        if (!gRes.ok) {
          console.warn('Grades API failed:', (gRes as any).error || 'Unknown error')
        }
        if (!tRes.ok) {
          console.warn('Topic Performance API failed:', (tRes as any).error || 'Unknown error')
        }
        
        const pBody = pRes.ok ? await (pRes as Response).json().catch(() => ({})) : {}
        const gBody = gRes.ok ? await (gRes as Response).json().catch(() => ({})) : {}
        const tBody = tRes.ok ? await (tRes as Response).json().catch(() => ({})) : {}
        
        if (active) {
          setWeekly(pBody.weekly || [])
          setGrades((gBody.grades || []) as GradeRow[])
          setSubjectAnalysis((gBody.subjectAnalysis || []) as SubjectAnalysis[])
          setPerformanceData(pBody)
          setTopicAnalysis((tBody.subjectAnalysis || []) as SubjectAnalysis[])
          setOverallStats(tBody.overallStats || null)
        }
      } catch (e: any) {
        console.error('Performance Summary load error:', e)
        if (active) setError(e.message || 'Failed to load performance')
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => { active = false }
  }, [])

  const avgWeeklyPerformance = performanceData?.avgPerformance || 0
  const completionRate = performanceData?.completionRate || 0
  const totalAssignments = performanceData?.totalAssignments || 0
  const completedAssignments = performanceData?.completedAssignments || 0
  const riskLevel = performanceData?.riskLevel || 'Moderate'
  const weeksTracked = performanceData?.weeksTracked || 0
  const gpa = performanceData?.gpa || 0
  const subjectsPassed = performanceData?.subjectsPassed || 0
  const totalSubjects = performanceData?.totalSubjects || 0
  const currentSubjects = performanceData?.currentSubjects || 0
  const recommendations = performanceData?.recommendations || []

  const riskPercent = Math.max(0, Math.min(100, Math.round(100 - avgWeeklyPerformance)))

  // Use topic analysis data for strengths and weaknesses with error handling
  let strengths: any[] = []
  let weaknesses: any[] = []
  let lowestSubject: any = null
  let skillsRadar: any[] = []
  let recentPerformance: any[] = []

  try {
    strengths = (topicAnalysis || [])
      .flatMap(subject => subject?.strengths || [])
      .sort((a, b) => (b?.average_score || 0) - (a?.average_score || 0))
      .slice(0, 4)

    weaknesses = (topicAnalysis || [])
      .flatMap(subject => subject?.weaknesses || [])
      .sort((a, b) => (a?.average_score || 0) - (b?.average_score || 0))
      .slice(0, 4)

    lowestSubject = (topicAnalysis || [])
      .sort((a, b) => (a?.overall_performance || 0) - (b?.overall_performance || 0))[0]

    // Create skills radar data from topic analysis
    skillsRadar = (topicAnalysis || []).slice(0, 6).map(subject => ({
      skill: subject?.subject_name || 'Unknown',
      score: Math.round(subject?.overall_performance || 0),
      fullMark: 100
    }))

    // Use recent performance from weekly data
    recentPerformance = (weekly || []).slice(-3).map(w => ({
      period: w?.week || 'Unknown',
      assignments: w?.assignments || 0,
      exams: w?.exams || 0,
      percentage: w?.performance || 0
    }))
  } catch (error) {
    console.error('Error processing performance data:', error)
    // Fallback to empty arrays if processing fails
  }

  // Generate AI recommendations based on performance data with error handling
  let aiRecommendations: any[] = []
  
  try {
    aiRecommendations = (recommendations || []).map((rec: any, index: number) => {
      const icons = [TrendingUp, Award, CheckCircle, Lightbulb]
      const colors = ["text-blue-500", "text-green-500", "text-purple-500", "text-yellow-500"]
      
      return {
        type: rec?.type || "suggestion",
        title: rec?.title || "Recommendation",
        description: rec?.description || "No description available",
        action: rec?.action || "Learn More",
        icon: icons[index % icons.length],
        color: colors[index % colors.length],
        priority: rec?.priority || "medium"
      }
    })
  } catch (error) {
    console.error('Error processing recommendations:', error)
    aiRecommendations = []
  }

  // If no recommendations from API, generate some based on performance
  try {
    if (aiRecommendations.length === 0) {
      if (gpa < 3.0) {
        aiRecommendations.push({
          type: "urgent",
          title: "Improve Overall GPA",
          description: `Your current GPA is ${gpa.toFixed(2)}. Focus on core subjects and seek additional help.`,
          action: "View Study Plan",
          icon: TrendingUp,
          color: "text-red-500",
          priority: "high"
        })
      }
      
      if (lowestSubject && lowestSubject.weaknesses && lowestSubject.weaknesses.length > 0) {
        const topWeakness = lowestSubject.weaknesses[0]
        aiRecommendations.push({
          type: "suggestion",
          title: `Focus on ${topWeakness?.topic_name || 'Unknown Topic'}`,
          description: `${topWeakness?.topic_name || 'This topic'} in ${lowestSubject.subject_name || 'Unknown Subject'} needs attention. Score: ${topWeakness?.average_score || 0}%`,
          action: "View Topic Details",
          icon: Award,
          color: "text-orange-500",
          priority: "medium"
        })
      }
      
      if (completionRate < 85) {
        aiRecommendations.push({
          type: "suggestion",
          title: "Increase Assignment Completion",
          description: `You've completed ${completionRate}% of assignments. Try to submit more work on time.`,
          action: "View Assignments",
          icon: CheckCircle,
          color: "text-blue-500",
          priority: "medium"
        })
      }

      // Add topic-based recommendations
      if (overallStats && overallStats.weaknessesCount > 3) {
        aiRecommendations.push({
          type: "suggestion",
          title: "Focus on Struggling Topics",
          description: `You have ${overallStats.weaknessesCount} topics scoring below 75%. Prioritize these areas in your study schedule.`,
          action: "View Weak Topics",
          icon: AlertTriangle,
          color: "text-orange-500",
          priority: "high"
        })
      }

      if (overallStats && overallStats.strengthsCount > 0 && strengths.length > 0) {
        const topStrength = strengths[0]
        if (topStrength) {
          aiRecommendations.push({
            type: "suggestion",
            title: `Leverage ${topStrength.topic_name || 'Your Strength'} Strength`,
            description: `You excel in ${topStrength.topic_name || 'this area'} (${topStrength.average_score || 0}%). Consider helping classmates or exploring advanced applications.`,
            action: "Explore Advanced Topics",
            icon: Award,
            color: "text-green-500",
            priority: "low"
          })
        }
      }
    }
  } catch (error) {
    console.error('Error generating AI recommendations:', error)
    // Fallback to basic recommendation if generation fails
    if (aiRecommendations.length === 0) {
      aiRecommendations = [{
        type: "suggestion",
        title: "Keep Learning",
        description: "Continue your studies and track your progress regularly.",
        action: "View Progress",
        icon: CheckCircle,
        color: "text-blue-500",
        priority: "medium"
      }]
    }
  }

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {loading && <p className="text-sm text-muted-foreground">Loading performance...</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-foreground">
              Performance Summary
            </h1>
            <p className="text-lg text-muted-foreground">
              AI-powered insights into your academic performance and growth opportunities 
            </p>
          </div>
          
        </div>
        
        {/* Performance Summary Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-4 bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-xl hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Brain className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Topics Analyzed</p>
                <p className="text-xl font-bold text-foreground">{overallStats?.totalTopics || 0}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card border border-slate-200 dark:border-slate-700 rounded-xl shadow-card-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Strong Topics</p>
                <p className="text-xl font-bold text-foreground">{overallStats?.strengthsCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card border border-slate-200 dark:border-slate-700 rounded-xl shadow-card-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Topics to Improve</p>
                <p className="text-xl font-bold text-foreground">{overallStats?.weaknessesCount || 0}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-card border border-slate-200 dark:border-slate-700 rounded-xl shadow-card-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Topic Performance</p>
                <p className="text-xl font-bold text-foreground">{overallStats?.averagePerformance || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shadow-sm">
          <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-blue-400 rounded-lg font-medium">Overview</TabsTrigger>
          <TabsTrigger value="skills" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-blue-400 rounded-lg font-medium">Skills</TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-blue-400 rounded-lg font-medium">Progress</TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-blue-600 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:text-blue-400 rounded-lg font-medium">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-lg shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold">Strengths & Weaknesses</CardTitle>
                    <CardDescription className="text-base">Areas where you excel and need improvement</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Strengths */}
                  <div>
                    <h4 className="font-bold text-lg text-green-700 dark:text-green-400 mb-3 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Top Strengths
                    </h4>
                    <div className="space-y-3">
                      {strengths.length > 0 ? strengths.map((topic, index) => (
                        <div key={index} className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-green-800 dark:text-green-200">{topic.topic_name}</span>
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 shadow-sm px-2 py-1 text-xs font-semibold">
                              {topic.average_score}%
                            </Badge>
                          </div>
                          <Progress value={topic.average_score} className="h-2 mt-2" />
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground italic">No strengths identified yet</p>
                      )}
                    </div>
                  </div>

                  {/* Weaknesses */}
                  <div>
                    <h4 className="font-bold text-lg text-red-700 dark:text-red-400 mb-3 flex items-center">
                      <AlertTriangle className="w-5 h-5 mr-2" />
                      Areas to Improve
                    </h4>
                    <div className="space-y-3">
                      {weaknesses.length > 0 ? weaknesses.map((topic, index) => (
                        <div key={index} className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-red-800 dark:text-red-200">{topic.topic_name}</span>
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800 shadow-sm px-2 py-1 text-xs font-semibold">
                              {topic.average_score}%
                            </Badge>
                          </div>
                          <Progress value={topic.average_score} className="h-2 mt-2" />
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground italic">Great job! No areas need immediate improvement</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-lg rounded-2xl shadow-card-lg hover:shadow-xl transition-all duration-300">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center shadow-md">
                      <Brain className="w-5 h-5 text-foreground" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold">Semester Risk Assessment</CardTitle>
                      <CardDescription className="text-base">AI-powered risk analysis</CardDescription>
                    </div>
                  </div>
                  <Badge className={`shadow-sm px-3 py-1 ${
                    riskLevel === 'Low' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' :
                    riskLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800'
                  }`}>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {riskLevel} Risk
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center space-x-8">
                  {/* Modern Donut Chart */}
                  <div className="relative">
                    <div className="w-36 h-36 rounded-full border-8 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-lg">
                      <div className="w-28 h-28 rounded-full border-8 border-green-500 flex items-center justify-center shadow-xl bg-green-50 dark:bg-green-950/20">
                        <div className="text-center">
                          <span className="text-3xl font-bold text-green-600 dark:text-green-400">{riskPercent}%</span>
                          <p className="text-xs text-muted-foreground">Risk</p>
                        </div>
                      </div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  
                  {/* Enhanced Metrics */}
                  <div className="flex-1 space-y-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">{Math.round(avgWeeklyPerformance)}%</p>
                        <p className="text-xs font-medium text-green-700 dark:text-green-300">Avg Performance</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{weeksTracked}</p>
                        <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Tracked Weeks</p>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
                        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">{totalSubjects}</p>
                        <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Subjects</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced AI Insight */}
                <div className="p-6 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 shadow-lg">
                  <div className="flex items-start space-x-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-md flex-shrink-0">
                      <Lightbulb className="w-5 h-5 text-primary-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-lg text-purple-900 dark:text-purple-100 mb-2">AI Insight</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300 leading-relaxed">
                        Your average weekly performance is {Math.round(avgWeeklyPerformance)}%. {overallStats ? `You have ${overallStats.strengthsCount} strong topics and ${overallStats.weaknessesCount} areas to improve.` : 'Maintain steady study habits.'}
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Enhanced Recommendations */}
                <div className="space-y-4">
                  <h4 className="font-bold text-lg text-foreground">Recommendations</h4>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
                      <div className="w-6 h-6 rounded-full  flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-sm font-medium text-green-800 dark:text-green-200">Maintain current study schedule</span>
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                      <div className="w-6 h-6 rounded-full  flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Focus on upcoming exams</span> 
                    </div>
                    <div className="flex items-center space-x-3 p-3 rounded-lg bg-card border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                      <div className="w-6 h-6 rounded-full  flex items-center justify-center flex-shrink-0">
                        <CheckCircle className="w-4 h-4 text-foreground" />
                      </div>
                      <span className="text-sm font-medium text-purple-800 dark:text-purple-200">Continue group study sessions</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-6">
          {/* Subject-wise Topic Analysis */}
          <div className="space-y-6">
            {topicAnalysis.map((subject, subjectIndex) => (
              <Card key={subjectIndex} className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-md">
                        <Target className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-xl font-bold">{subject.subject_name}</CardTitle>
                        <CardDescription className="text-base">
                          {subject.subject_code} • {subject.units} units • Overall: {subject.overall_performance}%
                        </CardDescription>
                      </div>
                    </div>
                    <Badge 
                      className={`shadow-sm px-3 py-1 ${
                        subject.overall_performance >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' :
                        subject.overall_performance >= 75 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800' :
                        'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800'
                      }`}
                    >
                      {subject.overall_performance}%
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strengths */}
                    <div>
                      <h4 className="font-bold text-lg text-green-700 dark:text-green-400 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" />
                        Strengths ({subject.strengths.length})
                      </h4>
                      <div className="space-y-3">
                        {subject.strengths.length > 0 ? subject.strengths.map((topic, topicIndex) => (
                          <div key={topicIndex} className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-green-800 dark:text-green-200">{topic.topic_name}</span>
                              <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800 shadow-sm px-2 py-1 text-xs font-semibold">
                                {topic.average_score}%
                              </Badge>
                            </div>
                            <Progress value={topic.average_score} className="h-2" />
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground italic">No strengths identified for this subject</p>
                        )}
                      </div>
                    </div>

                    {/* Weaknesses */}
                    <div>
                      <h4 className="font-bold text-lg text-red-700 dark:text-red-400 mb-4 flex items-center">
                        <AlertTriangle className="w-5 h-5 mr-2" />
                        Areas to Improve ({subject.weaknesses.length})
                      </h4>
                      <div className="space-y-3">
                        {subject.weaknesses.length > 0 ? subject.weaknesses.map((topic, topicIndex) => (
                          <div key={topicIndex} className="p-4 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-red-800 dark:text-red-200">{topic.topic_name}</span>
                              <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800 shadow-sm px-2 py-1 text-xs font-semibold">
                                {topic.average_score}%
                              </Badge>
                            </div>
                            <Progress value={topic.average_score} className="h-2" />
                          </div>
                        )) : (
                          <p className="text-sm text-muted-foreground italic">Excellent! No areas need improvement in this subject</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* All Topics Overview */}
                  <div className="mt-6">
                    <h4 className="font-bold text-lg text-slate-700 dark:text-slate-300 mb-4 flex items-center">
                      <Brain className="w-5 h-5 mr-2" />
                      All Topics ({subject.topics.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {subject.topics.map((topic, topicIndex) => (
                        <div key={topicIndex} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">{topic.topic_name}</span>
                            <Badge 
                              className={`shadow-sm px-2 py-1 text-xs font-semibold ${
                                topic.average_score >= 85 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800' :
                                topic.average_score >= 75 ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 border-blue-200 dark:border-blue-800' :
                                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800'
                              }`}
                            >
                              {topic.average_score}%
                            </Badge>
                          </div>
                          <Progress value={topic.average_score} className="h-1.5 mb-1" />
                          <p className="text-xs text-muted-foreground">{topic.total_assessments} assessments</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {topicAnalysis.length === 0 && (
              <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    <Target className="w-8 h-8 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No Topic Data Available</h3>
                  <p className="text-muted-foreground mb-4">
                    {overallStats?.message || "Topic-based analysis will appear here once you have grade entries with topic information."}
                  </p>
                  <div className="text-sm text-muted-foreground bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
                    <p className="font-medium mb-2">To enable topic analysis:</p>
                    <ul className="text-left space-y-1">
                      <li>• Ensure the topic column exists in the grade_entries table</li>
                      <li>• Add topic information when recording grades</li>
                      <li>• Contact your administrator if the feature is not available</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          {/* Enhanced Progress Timeline */}
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl  flex items-center justify-center shadow-md">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-xl font-bold text-foreground">
                      Progress Timeline
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      Your academic journey this semester
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Live</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={weekly} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeWidth={1} />
                    <XAxis 
                      dataKey="week" 
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      domain={[70, 100]}
                      tick={{ fontSize: 12, fill: '#64748b', fontWeight: 500 }}
                      axisLine={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                      tickLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `${value}%`}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Performance']}
                      labelFormatter={(label) => `Week ${label}`}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: '12px',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                        fontSize: '14px'
                      }}
                      labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="performance"
                      stroke="#3b82f6"
                      strokeWidth={4}
                      dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5, stroke: 'white' }}
                      activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 3, fill: 'white' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Summary Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl  flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <TrendingUp className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{completionRate}%</p>
                    <p className="text-muted-foreground font-medium">Assignment Completion</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">Excellent progress</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300 group">
              <CardContent className="p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl  flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                    <Clock className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{completedAssignments}</p>
                    <p className="text-muted-foreground font-medium">Completed Assignments</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Current semester</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Recent Performance */}
          <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl  flex items-center justify-center shadow-md">
                  <Award className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-foreground">
                    Recent Performance
                  </CardTitle>
                  <CardDescription className="text-muted-foreground">
                    Your latest academic achievements
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentPerformance.length > 0 ? recentPerformance.map((w, index) => (
                  <div key={index} className="group p-5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">{index + 1}</span>
                          </div>
                          <p className="font-semibold text-lg text-foreground">{w.period}</p>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">{w.assignments} Assignments</span>
                          </div>
                          <div className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                            </svg>
                            <span className="text-sm font-medium text-green-700 dark:text-green-300">{w.exams} Exams</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl ${
                          w.percentage >= 90 ? 'bg-green-100 dark:bg-green-950/20 border border-green-200 dark:border-green-800' : 
                          w.percentage >= 80 ? 'bg-blue-100 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800' : 
                          'bg-orange-100 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800'
                        }`}>
                          <span className={`text-2xl font-bold ${
                            w.percentage >= 90 ? 'text-green-600 dark:text-green-400' : 
                            w.percentage >= 80 ? 'text-blue-600 dark:text-blue-400' : 'text-orange-600 dark:text-orange-400'
                          }`}>
                            {Math.round(w.percentage)}%
                          </span>
                          <div className={`w-2 h-2 rounded-full ${
                            w.percentage >= 90 ? 'bg-green-500' : 
                            w.percentage >= 80 ? 'bg-blue-500' : 'bg-orange-500'
                          }`}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No performance data available yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {aiRecommendations.length > 0 ? aiRecommendations.map((rec: any, index: number) => {
              const Icon = rec.icon
              return (
                <Card key={index} className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg rounded-2xl hover:shadow-xl transition-all duration-300 group">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl ${rec.color.replace('text-', 'bg-')} flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300`}>
                        <Icon className="w-5 h-5 text-foreground" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-foreground">
                          {rec.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 mt-1">
                          <div className={`w-2 h-2 rounded-full ${
                            rec.type === "urgent" ? "bg-red-500" : 
                            rec.priority === "high" ? "bg-orange-500" : "bg-green-500"
                          }`}></div>   
                          <span className={`text-xs font-medium ${
                            rec.type === "urgent" ? "text-red-600 dark:text-red-400" : 
                            rec.priority === "high" ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"
                          }`}>
                            {rec.type === "urgent" ? "Urgent" : "AI Recommended"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground leading-relaxed">{rec.description}</p>
                    <Button 
                      size="sm" 
                      variant={rec.type === "urgent" ? "destructive" : "outline"} 
                      className={`w-full shadow-sm hover:shadow-md transition-all duration-200 ${
                        rec.type === "urgent" 
                          ? "bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300" 
                          : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/50 dark:hover:bg-slate-800/70 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {rec.action}
                    </Button>
                  </CardContent>
                </Card>
              )
            }) : (
              <div className="col-span-2 text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Great Performance!</h3>
                <p className="text-muted-foreground">You're doing well across all areas. Keep up the excellent work!</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

    
      </div>
    </ErrorBoundary>
  )
}