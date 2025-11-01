"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatsCard } from "@/components/ui/stats-card"
import { TrendingUp, Target, Brain, Clock, Award, AlertTriangle, CheckCircle, Lightbulb, Filter, Trophy, School, BarChart3, TrendingDown, Minus, BookOpen, Users, Percent } from "lucide-react"
import { convertPercentageToGPA, calculateGPA, calculateWeightedAverage, calculateFinalGrade, normalizeGradeEntries, normalizeGradeComponents } from "@/lib/student/grade-calculations"
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
// Types for Performance Analytics
type GradeEntry = {
  id: string
  score: number
  max_score: number
  date_recorded: string
  student_id?: number
  attendance?: string | null
  name?: string | null
  grade_period?: string | null
  grade_components?: {
    component_id: number
    component_name: string
    weight_percentage: number
    is_attendance?: boolean
  }
  classes: {
    subjects: {
      subject_id: number
      subject_name: string
      subject_code: string
      units: number
    }
  }
  semester?: string
}

type PerformanceData = {
  overallGPA: number
  semesterGPA: number
  totalCredits: number
  completedCredits: number
  totalSubjects: number
  gradeDistribution: { A: number; B: number; C: number; D: number; F: number }
  trendData: {
    dates: string[]
    subjects: Array<{
      subjectName: string
      color: string
      dataPoints: Array<{
        date: string
        formattedDate: string
        subjectName: string
        subjectId: number
        entryName: string
        score: number
        maxScore: number
        percentage: number
        color: string
        component: string
      }>
    }>
    allDataPoints: Array<{
      date: string
      formattedDate: string
      subjectName: string
      subjectId: number
      entryName: string
      score: number
      maxScore: number
      percentage: number
      color: string
      component: string
    }>
  }
  subjects: any[]
  recentGrades: any[]
  learningOutcomes: any[]
}

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
  // State for performance analytics
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [grades, setGrades] = useState<GradeEntry[]>([])
  const [filteredGrades, setFilteredGrades] = useState<GradeEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState('all')
  const [selectedSemester, setSelectedSemester] = useState('all')
  const [availableYears, setAvailableYears] = useState<string[]>([])
  const [availableSemesters, setAvailableSemesters] = useState<string[]>([])
  const [hoveredPoint, setHoveredPoint] = useState<any>(null)
  const [subjectFilter, setSubjectFilter] = useState<'all' | 'best' | 'lowest'>('all')

  // Legacy state for compatibility
  const [weekly, setWeekly] = useState<WeeklyRow[]>([])
  const [gradeRows, setGradeRows] = useState<GradeRow[]>([])
  const [subjectAnalysis, setSubjectAnalysis] = useState<SubjectAnalysis[]>([])
  const [topicAnalysis, setTopicAnalysis] = useState<SubjectAnalysis[]>([])
  const [overallStats, setOverallStats] = useState<any>(null)

  // Use the standardized GPA calculation from grade-calculations.ts
  const calculateFilipinoGPA = convertPercentageToGPA;

  // GWA Performance Categorization
  const getGWAPerformanceCategory = (gwa: number) => {
    if (gwa >= 4.0) return { level: 'failing', label: 'Failing', color: 'text-red-500' };
    if (gwa >= 3.0) return { level: 'needs-improvement', label: 'Needs Improvement', color: 'text-yellow-500' };
    if (gwa >= 2.0) return { level: 'doing-good', label: 'Doing Good', color: 'text-green-500' };
    return { level: 'excellent', label: 'Excellent', color: 'text-blue-500' };
  };

  // Load performance data
  const loadPerformanceData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Load multiple data sources in parallel
      const [entriesResponse, subjectsResponse, dashboardResponse] = await Promise.all([
        fetch('/api/student/entries', { cache: 'no-store' }),
        fetch('/api/student/subjects', { cache: 'no-store' }),
        fetch('/api/student/dashboard', { cache: 'no-store' })
      ]);
      
      if (!entriesResponse.ok) {
        setError('Failed to load entries data');
        return;
      }
      
      const entriesData = await entriesResponse.json();
      const subjectsData = subjectsResponse.ok ? await subjectsResponse.json() : { subjects: [] };
      const dashboardData = dashboardResponse.ok ? await dashboardResponse.json() : {};
      
      const allEntries = entriesData.entries || [];
      const subjects = subjectsData.subjects || [];
      
      // Convert entries to GradeEntry format for compatibility
      const gradeEntries: GradeEntry[] = allEntries.map((entry: any) => ({
        id: entry.grade_id,
        score: entry.score,
        max_score: entry.max_score,
        date_recorded: entry.date_recorded,
        student_id: entry.student_id,
        attendance: null,
        name: entry.name,
        grade_period: null,
        grade_components: entry.grade_components ? {
          component_id: entry.grade_components.component_id,
          component_name: entry.grade_components.component_name,
          weight_percentage: entry.grade_components.weight_percentage,
          is_attendance: false
        } : null,
        classes: {
          subjects: {
            subject_id: entry.classes?.subject_id || 0,
            subject_name: 'Unknown Subject', // Will be populated from subjects data
            subject_code: 'N/A',
            units: 3
          }
        },
        semester: null
      }));
      
      // Get ALL entries for the student (no filtering)
      setGrades(gradeEntries);
      setFilteredGrades(gradeEntries);
      
      // Extract available years and semesters
      extractYearAndSemesterOptions(gradeEntries);
      
      // Calculate performance metrics from entries and subjects
      const performance = calculatePerformanceMetrics(gradeEntries, subjects, dashboardData);
      setPerformanceData(performance);
      
    } catch (error) {
      console.error('Error loading performance data:', error);
      setError('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  const extractYearAndSemesterOptions = (gradesData: GradeEntry[]) => {
    // Extract academic year levels from actual grades
    const academicYearLevels = [...new Set(gradesData.map(grade => {
      const gradeDate = new Date(grade.date_recorded);
      const currentYear = new Date().getFullYear();
      const gradeYear = gradeDate.getFullYear();
      
      const yearDifference = currentYear - gradeYear;
      if (yearDifference === 0) return '1st Year';
      if (yearDifference === 1) return '2nd Year';
      if (yearDifference === 2) return '3rd Year';
      if (yearDifference === 3) return '4th Year';
      if (yearDifference >= 4) return '5th Year+';
      return '1st Year'; // Default
    }))];

    const sortedYearLevels = academicYearLevels.sort((a, b) => {
      const yearOrder = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year+'];
      return yearOrder.indexOf(a) - yearOrder.indexOf(b);
    });

    // Extract semesters
    const semesters = [...new Set(gradesData.map(grade => {
      if (grade.semester) {
        return grade.semester;
      }
      // Fallback: determine semester from date
      const gradeDate = new Date(grade.date_recorded);
      const month = gradeDate.getMonth() + 1;
      if (month >= 8 && month <= 12) return '1st Semester';
      if (month >= 1 && month <= 5) return '2nd Semester';
      if (month >= 6 && month <= 7) return 'Summer';
      return '1st Semester'; // Default
    }))];

    setAvailableYears(sortedYearLevels);
    setAvailableSemesters(semesters);

    // Auto-select current year and semester
    if (sortedYearLevels.length > 0) {
      // Prioritize 2nd Year if available, otherwise use first available
      const preferredYear = sortedYearLevels.includes('2nd Year') ? '2nd Year' : sortedYearLevels[0];
      setSelectedYear(preferredYear);
    }
    
    const currentMonth = new Date().getMonth() + 1;
    let currentSemester = '1st Semester';
    if (currentMonth >= 1 && currentMonth <= 5) currentSemester = '2nd Semester';
    else if (currentMonth >= 6 && currentMonth <= 7) currentSemester = 'Summer';
    
    if (semesters.includes(currentSemester)) {
      setSelectedSemester(currentSemester);
    } else if (semesters.length > 0) {
      setSelectedSemester(semesters[0]); // Fallback to first available semester
    }
  };

  const applyFilters = (gradesToFilter: GradeEntry[] = grades) => {
    let filtered = [...gradesToFilter];

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(grade => {
        const gradeDate = new Date(grade.date_recorded);
        const currentYear = new Date().getFullYear();
        const gradeYear = gradeDate.getFullYear();
        const yearDifference = currentYear - gradeYear;
        
        let gradeYearLevel = '1st Year';
        if (yearDifference === 0) gradeYearLevel = '1st Year';
        else if (yearDifference === 1) gradeYearLevel = '2nd Year';
        else if (yearDifference === 2) gradeYearLevel = '3rd Year';
        else if (yearDifference === 3) gradeYearLevel = '4th Year';
        else if (yearDifference >= 4) gradeYearLevel = '5th Year+';
        
        return gradeYearLevel === selectedYear;
      });
    }

    // Filter by semester
    if (selectedSemester !== 'all') {
      filtered = filtered.filter(grade => {
        if (grade.semester) {
          return grade.semester === selectedSemester;
        }
        // Fallback: determine semester from date
        const gradeDate = new Date(grade.date_recorded);
        const month = gradeDate.getMonth() + 1;
        let gradeSemester = '1st Semester';
        if (month >= 8 && month <= 12) gradeSemester = '1st Semester';
        else if (month >= 1 && month <= 5) gradeSemester = '2nd Semester';
        else if (month >= 6 && month <= 7) gradeSemester = 'Summer';
        return gradeSemester === selectedSemester;
      });
    }

    setFilteredGrades(filtered);
    
    // Recalculate performance metrics with filtered data
    // Note: We'll need to pass subjects and dashboard data here too
    // For now, we'll use the existing performance data structure
    if (performanceData) {
      setPerformanceData(performanceData);
    }
  };

  useEffect(() => {
    loadPerformanceData();
  }, []);

  useEffect(() => {
    if (grades.length > 0) {
      applyFilters();
    }
  }, [selectedYear, selectedSemester, grades]);

  const calculatePerformanceMetrics = (grades: GradeEntry[], subjects: any[], dashboardData: any) => {
    if (grades.length === 0) {
      return {
        overallGPA: 0,
        semesterGPA: 0,
        totalCredits: 0,
        completedCredits: 0,
        totalSubjects: 0,
        gradeDistribution: { A: 0, B: 0, C: 0, D: 0, F: 0 },
        trendData: {
          dates: [],
          subjects: [],
          allDataPoints: []
        },
        subjects: [],
        recentGrades: [],
        learningOutcomes: []
      };
    }

    // Use dashboard data if available, otherwise calculate from grades
    const overallGPA = dashboardData.overallGPA || 0;
    const totalCredits = dashboardData.totalUnits || 0;
    const totalSubjects = subjects.length || 0;

    // Calculate subject performance using the same method as grades-view.tsx
    const subjectPerformance = subjects.map(subject => {
      const subjectId = subject.subjects?.subject_id || subject.class_id;
      
      // Get all grade entries for this subject
      const subjectEntries = grades.filter(grade => 
        grade.classes?.subjects?.subject_id === subjectId
      );
      
      // Get grade components for this subject
      const subjectComponents = subjectEntries
        .map(entry => entry.grade_components)
        .filter(component => component != null)
        .reduce((unique, component) => {
          if (!unique.find((c: any) => c.component_id === component.component_id)) {
            unique.push(component);
          }
          return unique;
        }, [] as any[]);
      
      // Normalize entries and components for grade calculation
      const normalizedEntries = subjectEntries.map(entry => ({
        student_id: entry.student_id || 1,
        score: entry.score,
        max_score: entry.max_score,
        attendance: entry.attendance,
        component_id: entry.grade_components?.component_id || 0,
        name: entry.name || null,
        date_recorded: entry.date_recorded,
        grade_period: entry.grade_period
      }));
      
      const normalizedComponents = subjectComponents.map((comp: any) => ({
        component_id: comp.component_id,
        component_name: comp.component_name,
        weight_percentage: comp.weight_percentage,
        is_attendance: comp.is_attendance || false
      }));
      
      // Create student data structure for grade calculation
      const studentData = {
        student_id: 1,
        name: 'Current Student',
        email: '',
        components: {} as Record<number, any[]>
      };
      
      // Group entries by component
      normalizedEntries.forEach(entry => {
        if (!studentData.components[entry.component_id]) {
          studentData.components[entry.component_id] = [];
        }
        studentData.components[entry.component_id].push(entry);
      });
      
      // Calculate final grade using the unified grade calculation
      const computedPercent = calculateFinalGrade(studentData, normalizedComponents);
      const computedGPA = convertPercentageToGPA(computedPercent);

      return {
        id: subjectId,
        name: subject.subjects?.subject_name || 'Unknown Subject',
        code: subject.subjects?.subject_code || 'N/A',
        units: subject.subjects?.units || 3,
        percentage: Math.round(computedPercent * 100) / 100,
        gpa: Math.round(computedGPA * 100) / 100,
        instructor: subject.professors ? 
          `${subject.professors.first_name} ${subject.professors.last_name}` : 'TBA',
        totalWorks: subjectEntries.length,
        completedWorks: subjectEntries.filter(w => w && w.score != null && w.max_score != null).length,
        progress: subjectEntries.length > 0 ? 
          Math.round((subjectEntries.filter(w => w && w.score != null && w.max_score != null).length / subjectEntries.length) * 100) : 0
      };
    });

    // Calculate grade distribution from subject performance
    const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    subjectPerformance.forEach(subject => {
      const percentage = subject.percentage;
      if (percentage >= 90) gradeDistribution.A++;
      else if (percentage >= 80) gradeDistribution.B++;
      else if (percentage >= 70) gradeDistribution.C++;
      else if (percentage >= 60) gradeDistribution.D++;
      else gradeDistribution.F++;
    });

    // Calculate detailed trend data similar to dashboard
    const trendData = calculateDetailedTrendData(grades, subjects);

    // Get recent grades for performance insights
    const recentGrades = grades
      .sort((a, b) => new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime())
      .slice(0, 5)
      .map(grade => ({
        id: grade.id,
        name: 'Assignment', // Default name since GradeEntry doesn't have name property
        score: grade.score,
        maxScore: grade.max_score,
        percentage: Math.round((grade.score / grade.max_score) * 100),
        date: grade.date_recorded,
        subject: grade.classes?.subjects?.subject_name || 'Unknown Subject'
      }));

    return {
      overallGPA,
      semesterGPA: overallGPA,
      totalCredits,
      completedCredits: totalCredits,
      totalSubjects,
      gradeDistribution,
      trendData,
      subjects: subjectPerformance,
      recentGrades,
      learningOutcomes: [] // Can be populated later
    };
  };

  const calculateDetailedTrendData = (grades: GradeEntry[], subjects: any[]) => {
    // Sort grades by date
    const sortedGrades = [...grades].sort((a, b) => 
      new Date(a.date_recorded).getTime() - new Date(b.date_recorded).getTime()
    );

    // Create a mapping of subject_id to subject details
    const subjectMap = new Map();
    subjects.forEach(subject => {
      const subjectId = subject.subjects?.subject_id || subject.class_id;
      subjectMap.set(subjectId, {
        id: subjectId,
        name: subject.subjects?.subject_name || 'Unknown Subject',
        code: subject.subjects?.subject_code || 'N/A'
      });
    });

    // Get all unique subjects from the grades data
    const uniqueSubjectIds = [...new Set(sortedGrades.map(grade => grade.classes?.subjects?.subject_id).filter(Boolean))];
    
    const allSubjects = uniqueSubjectIds.map(subjectId => {
      const subject = subjectMap.get(subjectId);
      return subject || {
        id: subjectId,
        name: 'Unknown Subject',
        code: 'N/A'
      };
    });

    // Generate color palette for subjects
    const subjectColors = generateSubjectColors(allSubjects.length);

    // Create individual data points for each grade entry
    const allDataPoints = sortedGrades.map(grade => {
      const subjectId = grade.classes?.subjects?.subject_id;
      const subject = subjectMap.get(subjectId);
      const subjectIndex = allSubjects.findIndex(s => s.id === subjectId);
      const color = subjectColors[subjectIndex] || '#6366F1';
      
      const date = new Date(grade.date_recorded);
      const formattedDate = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
      
      return {
        date: grade.date_recorded,
        formattedDate,
        subjectName: subject?.name || 'Unknown Subject',
        subjectId: subjectId,
        entryName: grade.name || 'Assignment',
        score: grade.score,
        maxScore: grade.max_score,
        percentage: grade.max_score > 0 ? (grade.score / grade.max_score) * 100 : 0,
        color: color,
        component: grade.grade_components?.component_name || 'Assignment'
      };
    });

    // Group data points by subject for the chart
    const subjectTrends = allSubjects.map((subject, index) => {
      const color = subjectColors[index];
      const subjectDataPoints = allDataPoints.filter(point => point.subjectId === subject.id);
      
      return {
        subjectName: subject.name,
        color,
        dataPoints: subjectDataPoints
      };
    });

    // Get all unique dates for x-axis
    const allDates = [...new Set(sortedGrades.map(grade => grade.date_recorded))].sort();

    return {
      dates: allDates,
      subjects: subjectTrends,
      allDataPoints: allDataPoints
    };
  };

  const calculateTrendData = (grades: GradeEntry[]) => {
    // Sort grades by date
    const sortedGrades = [...grades].sort((a, b) => 
      new Date(a.date_recorded).getTime() - new Date(b.date_recorded).getTime()
    );

    // Group by month-week for trend analysis
    const weeklyData = sortedGrades.reduce((acc, grade) => {
      const date = new Date(grade.date_recorded);
      const weekKey = getMonthWeekKey(date);
      
      if (!acc[weekKey]) {
        acc[weekKey] = [];
      }
      acc[weekKey].push(grade);
      return acc;
    }, {} as Record<string, GradeEntry[]>);

    // Get all unique subjects
    const allSubjects = [...new Set(sortedGrades.map(grade => 
      grade.classes?.subjects?.subject_name || 'Unknown Subject'
    ))];

    // Generate color palette for subjects
    const subjectColors = generateSubjectColors(allSubjects.length);

    // Calculate weekly data for each subject
    const subjectTrends = allSubjects.map((subjectName, index) => {
      const color = subjectColors[index];
      const allWeeks = Object.keys(weeklyData).sort();
      const trendPoints = allWeeks.map((week) => {
        const weekGrades = weeklyData[week] || [];
        const subjectGrades = weekGrades.filter(grade => 
          grade.classes?.subjects?.subject_name === subjectName
        );

        if (subjectGrades.length === 0) {
          // For missing weeks, interpolate or use previous value
          return {
            week,
            subjectName,
            score: null,
            maxScore: null,
            percentage: null,
            count: 0,
            color
          };
        }

        // Calculate average score and percentage for the week
        const totalScore = subjectGrades.reduce((sum, grade) => sum + grade.score, 0);
        const totalMaxScore = subjectGrades.reduce((sum, grade) => sum + grade.max_score, 0);
        const averageScore = totalScore / subjectGrades.length;
        const averageMaxScore = totalMaxScore / subjectGrades.length;
        const averagePercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;
        
        return {
          week,
          subjectName,
          score: Math.round(averageScore * 100) / 100,
          maxScore: Math.round(averageMaxScore * 100) / 100,
          percentage: Math.round(averagePercentage * 100) / 100,
          count: subjectGrades.length,
          color
        };
      });

      return {
        subjectName,
        color,
        trendPoints: trendPoints
      };
    });

    return {
      weeks: Object.keys(weeklyData).sort(),
      subjects: subjectTrends
    };
  };

  const getWeekNumber = (date: Date) => {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
  };

  const getWeekKey = (date: Date) => {
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    return `Week ${weekNumber}`;
  };

  const getMonthWeekKey = (date: Date) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();
    
    // Get the first day of the month
    const firstDayOfMonth = new Date(year, date.getMonth(), 1);
    const firstWeekOfMonth = getWeekNumber(firstDayOfMonth);
    const currentWeek = getWeekNumber(date);
    
    // Calculate which week of the month this is
    const weekOfMonth = currentWeek - firstWeekOfMonth + 1;
    
    return `${month} Week ${weekOfMonth}`;
  };

  const generateSubjectColors = (count: number) => {
    const baseColors = [
      '#6366F1', // Primary
      '#8B5CF6', // Secondary
      '#06B6D4', // Accent
      '#10B981', // Success
      '#F59E0B', // Warning
      '#EF4444', // Error
      '#3B82F6', // Info
      '#84CC16', // Lime
      '#F97316', // Orange
      '#EC4899', // Pink
      '#8B5CF6', // Purple
      '#14B8A6', // Teal
    ];

    const colors = [];
    for (let i = 0; i < count; i++) {
      if (i < baseColors.length) {
        colors.push(baseColors[i]);
      } else {
        // Generate additional colors if we have more subjects than base colors
        const hue = (i * 137.5) % 360; // Golden angle approximation
        colors.push(`hsl(${hue}, 70%, 50%)`);
      }
    }
    return colors;
  };

  // Legacy useEffect for compatibility
  useEffect(() => {
    let active = true
    async function load() {
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
          setGradeRows((gBody.grades || []) as GradeRow[])
          setSubjectAnalysis((gBody.subjectAnalysis || []) as SubjectAnalysis[])
          setTopicAnalysis((tBody.subjectAnalysis || []) as SubjectAnalysis[])
          setOverallStats(tBody.overallStats || null)
        }
      } catch (e: any) {
        console.error('Performance Summary load error:', e)
        if (active) setError(e.message || 'Failed to load performance')
      }
    }
    load()
    return () => { active = false }
  }, [])

  // Legacy variables for compatibility - using fallback values
  const avgWeeklyPerformance = 85 // Default fallback
  const completionRate = 90 // Default fallback
  const totalAssignments = 10 // Default fallback
  const completedAssignments = 9 // Default fallback
  const riskLevel = 'Moderate' // Default fallback
  const weeksTracked = 8 // Default fallback
  const gpa = performanceData?.overallGPA || 0
  const subjectsPassed = performanceData?.totalSubjects || 0
  const totalSubjects = performanceData?.totalSubjects || 0
  const currentSubjects = performanceData?.totalSubjects || 0
  const recommendations: any[] = [] // Default fallback

  const riskPercent = Math.max(0, Math.min(100, Math.round(100 - avgWeeklyPerformance)))

  // Loading and error states
  if (isLoading) {
      return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading performance data...</p>
        </div>
      </div>
    );
    }

  if (error) {
      return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Something went wrong</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadPerformanceData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

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
    aiRecommendations = (recommendations as any[] || []).map((rec: any, index: number) => {
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
        {/* Header */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground">
                Performance Summary
              </h1>
              <p className="text-base lg:text-lg text-muted-foreground">
                AI-powered insights into your academic performance and growth opportunities 
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Academic Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedSemester} onValueChange={setSelectedSemester}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {availableSemesters.map(semester => (
                    <SelectItem key={semester} value={semester}>{semester}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {performanceData && (() => {
          const gwaCategory = getGWAPerformanceCategory(performanceData.overallGPA || 0);
          return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StatsCard
                title="GWA"
                value={performanceData.overallGPA?.toFixed(2) || '0.00'}
                description={gwaCategory.label}
                icon={gwaCategory.level === 'excellent' ? Trophy :
                      gwaCategory.level === 'doing-good' ? CheckCircle :
                      gwaCategory.level === 'needs-improvement' ? AlertTriangle : AlertTriangle}
                iconColor={gwaCategory.level === 'excellent' ? 'text-blue-500' :
                           gwaCategory.level === 'doing-good' ? 'text-green-500' :
                           gwaCategory.level === 'needs-improvement' ? 'text-yellow-500' : 'text-red-500'}
              />

              <StatsCard
                title="Performance"
                value={gwaCategory.level === 'excellent' ? 'Excellent' :
                     gwaCategory.level === 'doing-good' ? 'Good' :
                     gwaCategory.level === 'needs-improvement' ? 'Fair' : 'Poor'}
                description={gwaCategory.level === 'excellent' ? 'Outstanding!' :
                     gwaCategory.level === 'doing-good' ? 'Keep it up!' :
                     gwaCategory.level === 'needs-improvement' ? 'Needs work' : 'Focus required'}
                icon={gwaCategory.level === 'excellent' ? TrendingUp :
                      gwaCategory.level === 'doing-good' ? TrendingUp :
                      gwaCategory.level === 'needs-improvement' ? Minus : TrendingDown}
                iconColor={gwaCategory.level === 'excellent' ? 'text-blue-500' :
                           gwaCategory.level === 'doing-good' ? 'text-green-500' :
                           gwaCategory.level === 'needs-improvement' ? 'text-yellow-500' : 'text-red-500'}
              />

              <StatsCard
                title="Total Units"
                value={performanceData.totalCredits || 0}
                description={`${performanceData.totalSubjects} subject${performanceData.totalSubjects !== 1 ? 's' : ''}`}
                icon={BookOpen}
                iconColor="text-purple-500"
              />
                  </div>
          );
        })()}

        {/* Performance Trend Chart */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg dark:shadow-card-lg rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Performance Trend Analysis</CardTitle>
            <CardDescription>Detailed student performance scores by subject over time with comprehensive metrics</CardDescription>
          </CardHeader>
          <CardContent>
            {performanceData?.trendData && performanceData.trendData.subjects.length > 0 ? (
              <div className="space-y-6">
                {/* Chart */}
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={performanceData.trendData.allDataPoints}>
                      <defs>
                        <style>
                          {`
                            .recharts-cartesian-grid-horizontal line,
                            .recharts-cartesian-grid-vertical line {
                              stroke: rgb(226 232 240);
                            }
                            @media (prefers-color-scheme: dark) {
                              .recharts-cartesian-grid-horizontal line,
                              .recharts-cartesian-grid-vertical line {
                                stroke: rgb(51 65 85);
                              }
                            }
                          `}
                        </style>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="formattedDate" 
                        tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <Tooltip 
                        formatter={(value, name, props) => {
                          const point = props.payload;
                          if (point) {
                            return [
                              `${point.percentage.toFixed(1)}% (${point.score}/${point.maxScore})`,
                              point.subjectName
                            ];
                          }
                          return [value, name];
                        }}
                        labelFormatter={(label, payload) => {
                          if (payload && payload.length > 0) {
                            const point = payload[0].payload;
                            return `${point.entryName} - ${point.formattedDate}`;
                          }
                          return label;
                        }}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          color: 'hsl(var(--popover-foreground))'
                        }}
                        labelStyle={{
                          color: 'hsl(var(--popover-foreground))'
                        }}
                      />
                      {performanceData.trendData.subjects.map((subject, index) => (
                        <Line
                          key={subject.subjectName}
                          type="monotone"
                          dataKey="percentage"
                          data={subject.dataPoints}
                          stroke={subject.color}
                          strokeWidth={2}
                          dot={{ fill: subject.color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: subject.color, strokeWidth: 2 }}
                          connectNulls={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Metrics Table */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <h4 className="text-lg font-semibold text-foreground">Subject Performance Summary</h4>
                    <Tabs value={subjectFilter} onValueChange={(value: any) => setSubjectFilter(value)} className="w-full sm:w-auto">
                      <TabsList className="grid w-full grid-cols-3 sm:w-auto">
                        <TabsTrigger value="all" className="text-xs sm:text-sm">All</TabsTrigger>
                        <TabsTrigger value="best" className="text-xs sm:text-sm">Best</TabsTrigger>
                        <TabsTrigger value="lowest" className="text-xs sm:text-sm">Lowest</TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground">Total Entries</th>
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground">Avg %</th>
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground">Best Score</th>
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground">Worst Score</th>
                          <th className="text-center py-3 px-4 font-medium text-muted-foreground">Trend</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          // Calculate avg percentage for each subject and sort
                          const subjectsWithAvg = performanceData.trendData.subjects.map((subject, index) => {
                            const allPercentages = subject.dataPoints.map(p => p.percentage);
                            const avgPercentage = allPercentages.length > 0 
                              ? allPercentages.reduce((sum, percentage) => sum + percentage, 0) / allPercentages.length 
                              : 0;
                            return { subject, index, avgPercentage };
                          });

                          // Filter based on selected filter
                          let filteredSubjects = subjectsWithAvg;
                          if (subjectFilter === 'best') {
                            // Top 50% performing subjects
                            filteredSubjects = subjectsWithAvg
                              .sort((a, b) => b.avgPercentage - a.avgPercentage)
                              .slice(0, Math.ceil(subjectsWithAvg.length / 2));
                          } else if (subjectFilter === 'lowest') {
                            // Bottom 50% performing subjects
                            filteredSubjects = subjectsWithAvg
                              .sort((a, b) => a.avgPercentage - b.avgPercentage)
                              .slice(0, Math.ceil(subjectsWithAvg.length / 2));
                          }

                          return filteredSubjects.map(({ subject, index, avgPercentage: calculatedAvg }) => {
                          const allPercentages = subject.dataPoints.map(p => p.percentage);
                          const allDataPoints = subject.dataPoints;
                          
                          const bestPoint = allDataPoints.length > 0 
                            ? allDataPoints.reduce((best, current) => current.percentage > best.percentage ? current : best)
                            : null;
                          const worstPoint = allDataPoints.length > 0 
                            ? allDataPoints.reduce((worst, current) => current.percentage < worst.percentage ? current : worst)
                            : null;
                          
                          // Calculate trend (comparing first half vs second half)
                          const midPoint = Math.floor(allPercentages.length / 2);
                          const firstHalf = allPercentages.slice(0, midPoint);
                          const secondHalf = allPercentages.slice(midPoint);
                          
                          const firstHalfAvg = firstHalf.length > 0 
                            ? firstHalf.reduce((sum, percentage) => sum + percentage, 0) / firstHalf.length 
                            : 0;
                          const secondHalfAvg = secondHalf.length > 0 
                            ? secondHalf.reduce((sum, percentage) => sum + percentage, 0) / secondHalf.length 
                            : 0;
                          
                          const trend = secondHalfAvg - firstHalfAvg;
                          const trendIcon = trend > 0 ? <TrendingUp className="w-4 h-4 text-green-500" /> : 
                                          trend < 0 ? <TrendingDown className="w-4 h-4 text-red-500" /> : 
                                          <Minus className="w-4 h-4 text-gray-500" />;
                          const trendText = trend > 0 ? 'Improving' : trend < 0 ? 'Declining' : 'Stable';
                          const trendColor = trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';

                          return (
                            <tr key={index} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded-full" 
                                    style={{ backgroundColor: subject.color }}
                                  />
                                  <span className="font-medium text-foreground">{subject.subjectName}</span>
                                </div>
                              </td>
                              <td className="text-center py-3 px-4 text-muted-foreground">
                                {allPercentages.length}
                              </td>
                              <td className="text-center py-3 px-4 font-medium text-foreground">
                                {calculatedAvg.toFixed(1)}%
                              </td>
                              <td className="text-center py-3 px-4 text-green-600 font-medium">
                                {bestPoint ? `${bestPoint.score}/${bestPoint.maxScore}` : 'N/A'}
                              </td>
                              <td className="text-center py-3 px-4 text-red-600 font-medium">
                                {worstPoint ? `${worstPoint.score}/${worstPoint.maxScore}` : 'N/A'}
                              </td>
                              <td className="text-center py-3 px-4">
                                <div className="flex items-center justify-center space-x-1">
                                  {trendIcon}
                                  <span className={`text-xs ${trendColor}`}>{trendText}</span>
                                </div>
                              </td>
                            </tr>
                          );
                        });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <h5 className="font-semibold text-blue-900 dark:text-blue-100">Best Performing Subject</h5>
                    </div>
                    {(() => {
                      const bestSubject = performanceData.trendData.subjects.reduce((best, current) => {
                        const currentAvg = current.dataPoints.length > 0 
                          ? current.dataPoints.reduce((sum, p) => sum + p.percentage, 0) / current.dataPoints.length 
                          : 0;
                        const bestAvg = best.dataPoints.length > 0 
                          ? best.dataPoints.reduce((sum, p) => sum + p.percentage, 0) / best.dataPoints.length 
                          : 0;
                        return currentAvg > bestAvg ? current : best;
                      });
                      const avgPercentage = bestSubject.dataPoints.length > 0 
                        ? bestSubject.dataPoints.reduce((sum, p) => sum + p.percentage, 0) / bestSubject.dataPoints.length 
                        : 0;
                      return (
                        <div>
                          <p className="text-blue-800 dark:text-blue-200 font-medium">{bestSubject.subjectName}</p>
                          <p className="text-sm text-blue-600 dark:text-blue-400">Avg: {avgPercentage.toFixed(1)}%</p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <Award className="w-5 h-5 text-green-600" />
                      <h5 className="font-semibold text-green-900 dark:text-green-100">Most Consistent</h5>
                    </div>
                    {(() => {
                      const mostConsistent = performanceData.trendData.subjects.reduce((most, current) => {
                        const currentPercentages = current.dataPoints.map(p => p.percentage);
                        const bestPercentages = most.dataPoints.map(p => p.percentage);
                        
                        const currentVariance = currentPercentages.length > 1 ? 
                          Math.sqrt(currentPercentages.reduce((sum, percentage) => {
                            const avg = currentPercentages.reduce((a, b) => a + b, 0) / currentPercentages.length;
                            return sum + Math.pow(percentage - avg, 2);
                          }, 0) / currentPercentages.length) : 0;
                        const bestVariance = bestPercentages.length > 1 ? 
                          Math.sqrt(bestPercentages.reduce((sum, percentage) => {
                            const avg = bestPercentages.reduce((a, b) => a + b, 0) / bestPercentages.length;
                            return sum + Math.pow(percentage - avg, 2);
                          }, 0) / bestPercentages.length) : 0;
                        
                        return currentVariance < bestVariance ? current : most;
                      });
                      return (
                        <div>
                          <p className="text-green-800 dark:text-green-200 font-medium">{mostConsistent.subjectName}</p>
                          <p className="text-sm text-green-600 dark:text-green-400">Lowest variance</p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center space-x-2 mb-2">
                      <BarChart3 className="w-5 h-5 text-purple-600" />
                      <h5 className="font-semibold text-purple-900 dark:text-purple-100">Total Data Points</h5>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-purple-800 dark:text-purple-200">
                        {performanceData.trendData.subjects.reduce((total, subject) => 
                          total + subject.dataPoints.length, 0
                        )}
                      </p>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Across {performanceData.trendData.subjects.length} subjects</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No trend data available</p>
                <p className="text-sm text-muted-foreground mt-2">Complete some assignments to see your performance trends</p>
              </div>
            )}
            </CardContent>
          </Card>


        {/* Performance Insights */}
        <Card className="bg-card border border-slate-200 dark:border-slate-700 shadow-card-lg dark:shadow-card-lg rounded-2xl hover:shadow-xl dark:hover:shadow-xl transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Performance Insights</CardTitle>
            <CardDescription>AI-powered analysis and recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performanceData && (() => {
              const gwaCategory = getGWAPerformanceCategory(performanceData.overallGPA || 0);
              return (
                <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    gwaCategory.level === 'excellent' ? 'bg-blue-100 dark:bg-blue-950/20' :
                        gwaCategory.level === 'doing-good' ? 'bg-green-100 dark:bg-green-950/20' :
                        gwaCategory.level === 'needs-improvement' ? 'bg-yellow-100 dark:bg-yellow-950/20' : 'bg-red-100 dark:bg-red-950/20'
                      }`}>
                    {gwaCategory.level === 'excellent' ? <Trophy className="w-4 h-4 text-blue-600" /> :
                     gwaCategory.level === 'doing-good' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
                     gwaCategory.level === 'needs-improvement' ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                      </div>
                      <div className="flex-1">
                    <h4 className="font-semibold text-foreground mb-2">Academic Standing</h4>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {gwaCategory.level === 'excellent' 
                            ? 'Excellent performance! You\'re doing outstanding work and maintaining the highest academic standards.'
                            : gwaCategory.level === 'doing-good'
                            ? 'Good performance! You\'re on the right track. Keep up the great work and continue striving for excellence.'
                            : gwaCategory.level === 'needs-improvement'
                            ? 'Your performance needs improvement. Focus on your studies, seek help when needed, and work towards better grades.'
                            : 'Your academic performance is below passing standards. It\'s crucial to focus on improving your grades and seek academic support immediately.'}
                        </p>
                      </div>
                    </div>
              );
            })()}
            
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-950/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">Grade Analysis</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {performanceData?.totalSubjects && performanceData.totalSubjects > 0
                        ? `You have ${performanceData.totalSubjects} subjects with an overall GWA of ${performanceData.overallGPA?.toFixed(2)}.`
                        : 'No grades recorded yet. Start your academic journey!'}
                    </p>
                  </div>
                </div>
            
            <div className="flex items-start space-x-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/20 flex items-center justify-center flex-shrink-0">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                <h4 className="font-semibold text-foreground mb-2">Grade Distribution</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {performanceData?.gradeDistribution && performanceData.gradeDistribution.A > 0
                        ? `You have ${performanceData.gradeDistribution.A} excellent grades (A) and ${performanceData.gradeDistribution.B} good grades (B).`
                        : 'Complete more assignments to see your grade distribution.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
      </div>
    </ErrorBoundary>
  )
}