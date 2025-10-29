"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Target } from "lucide-react"
import dynamic from "next/dynamic";
import AnalyticsProfessorsTab from "@/components/admin/analytics-professors-tab";
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import AnalyticsGraduationTab from "@/components/admin/analytics-graduation-tab";
import { useEffect, useState } from "react";
import { AnalyticsPageSkeleton } from "@/components/admin/page-skeletons";

const topStudents = [
  {
    name: "Vincent Lawrence F. Enriquez",
    studentId: "22-00604",
    course: "BSIT",
    department: "Computer Studies",
    gwa: "1.55",
    year: "3rd Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (4 semesters)", "President's Lister (1 semester)", "2nd Place", "Research Grant Recipient"],
  },
  {
    name: "John Carlo Reyes",
    studentId: "22-00456",
    course: "BSCS",
    department: "Computer Studies",
    gwa: "1.15",
    year: "3rd Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (6 semesters)", "Programming Competition Winner"],
  },
  {
    name: "Anna Marie Cruz",
    studentId: "22-00789",
    course: "BSA",
    department: "Business & Accountancy",
    gwa: "1.25",
    year: "4th Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (7 semesters)", "CPA Board Exam Qualifier"],
  },
  {
    name: "Michael Torres",
    studentId: "22-00321",
    course: "BSECE",
    department: "Engineering",
    gwa: "1.30",
    year: "3rd Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (5 semesters)", "Engineering Design Competition"],
  },
  {
    name: "Maria Santos",
    studentId: "22-00123",
    course: "BSIT",
    department: "Computer Studies",
    gwa: "1.10",
    year: "4th Year",
    status: "President's Lister",
    achievements: ["Dean's List (8 semesters)", "Academic Excellence Award", "Research Grant Recipient"],
  },
  {
    name: "Sarah Johnson",
    studentId: "22-00876",
    course: "BSN",
    department: "Nursing",
    gwa: "1.22",
    year: "2nd Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (4 semesters)", "Clinical Excellence Award"],
  },
  {
    name: "Carlos Mendoza",
    studentId: "21-00087",
    course: "BSIT",
    department: "Computer Studies",
    gwa: "1.35",
    year: "4th Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (6 semesters)", "Best Capstone Project"],
  },
  {
    name: "Emily Tan",
    studentId: "21-00105",
    course: "BSCS",
    department: "Computer Studies",
    gwa: "1.20",
    year: "4th Year",
    status: "President's Lister",
    achievements: ["President's List (2 semesters)", "Dean's List (6 semesters)", "Top 1 in CCS"],
  },
  {
    name: "Lisa Garcia",
    studentId: "21-00088",
    course: "BSCS",
    department: "Computer Studies",
    gwa: "1.48",
    year: "4th Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (5 semesters)", "Academic Excellence Award"],
  },
  {
    name: "Robert Kim",
    studentId: "21-00112",
    course: "BSIT",
    department: "Computer Studies",
    gwa: "1.62",
    year: "3rd Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (4 semesters)", "Outstanding Capstone Project"],
  },
  {
    name: "Jessica Martinez",
    studentId: "22-00234",
    course: "BSN",
    department: "Nursing",
    gwa: "1.05",
    year: "3rd Year",
    status: "President's Lister",
    achievements: ["President's List (4 semesters)", "Dean's List (2 semesters)", "Outstanding Clinical Performance"],
  },
  {
    name: "David Chen",
    studentId: "22-00345",
    course: "BSECE",
    department: "Engineering",
    gwa: "1.18",
    year: "2nd Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (3 semesters)", "Engineering Design Competition Winner"],
  },
  {
    name: "Sophie Williams",
    studentId: "22-00567",
    course: "BSA",
    department: "Business & Accountancy",
    gwa: "1.12",
    year: "3rd Year",
    status: "President's Lister",
    achievements: ["President's List (3 semesters)", "Dean's List (3 semesters)", "CPA Review Scholar"],
  },
  {
    name: "James Rodriguez",
    studentId: "21-00445",
    course: "BSED",
    department: "Education",
    gwa: "1.28",
    year: "4th Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (6 semesters)", "Outstanding Student Teacher"],
  },
  {
    name: "Amanda Taylor",
    studentId: "22-00678",
    course: "AB-ENG",
    department: "Arts & Sciences",
    gwa: "1.15",
    year: "2nd Year",
    status: "Dean's Lister",
    achievements: ["Dean's List (4 semesters)", "Literary Competition Winner"],
  }
]

const bottomStudents = [
  {
    name: "Carlos Mendoza",
    studentId: "22-00987",
    course: "BSIT",
    gwa: "2.85",
    year: "2nd Year",
    status: "At Risk",
    issues: ["Low attendance (65%)", "Failed 2 subjects", "No academic support"],
    riskLevel: "High",
  },
  {
    name: "Lisa Garcia",
    studentId: "22-00654",
    course: "BSA",
    gwa: "2.75",
    year: "3rd Year",
    status: "Academic Probation",
    issues: ["Below required GWA", "Incomplete requirements", "Financial difficulties"],
    riskLevel: "High",
  },
  {
    name: "Robert Kim",
    studentId: "22-00432",
    course: "BSCS",
    gwa: "2.65",
    year: "1st Year",
    status: "At Risk",
    issues: ["Struggling with programming", "Low quiz scores", "Needs tutoring"],
    riskLevel: "Medium",
  },
  {
    name: "Sarah Johnson",
    studentId: "22-00876",
    course: "BSN",
    gwa: "2.70",
    year: "2nd Year",
    status: "Academic Warning",
    issues: ["Clinical performance issues", "Theory-practice gap", "Time management"],
    riskLevel: "Medium",
  },
]

export default function AnalyticsPage() {
  const [searchParams, setSearchParams] = useState<URLSearchParams | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("professors");
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showStudentPerformance, setShowStudentPerformance] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState("All Subjects");

  useEffect(() => {
    // Safe access to search params
    try {
      const params = new URLSearchParams(window.location.search);
      setSearchParams(params);
      const tabParam = params.get('tab');
      if (tabParam) {
        setActiveTab(tabParam);
      }
    } catch (error) {
      console.warn('Error accessing search params:', error);
    }
  }, []);

  if (loading) {
    return <AnalyticsPageSkeleton />
  }

  // Prepare data for bar chart (Dean's Listers and President's Listers by department)
  const departmentPerformanceData = () => {
    const departments = selectedDepartment === "All Departments" 
      ? ["Computer Studies", "Engineering", "Nursing", "Business & Accountancy", "Education", "Arts & Sciences"]
      : [selectedDepartment];
      
    return departments.map(dept => {
      const deptStudents = topStudents.filter(student => student.department === dept);
      const deansListers = deptStudents.filter(student => student.status === "Dean's Lister").length;
      const presidentsListers = deptStudents.filter(student => student.status === "President's Lister").length;
      return {
        department: dept,
        "Dean's Lister": deansListers,
        "President's Lister": presidentsListers,
        total: deansListers + presidentsListers
      };
    });
  };

  // Filter and sort students
  const filteredStudents = topStudents
    .filter(student =>
      (selectedDepartment === "All Departments" || student.department === selectedDepartment) &&
      (searchTerm === "" || 
       student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
       student.course.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;
      if (sortField === "gwa") return direction * (parseFloat(a.gwa) - parseFloat(b.gwa));
      if (sortField === "year") return direction * a.year.localeCompare(b.year);
      if (sortField === "name") return direction * a.name.localeCompare(b.name);
      if (sortField === "status") return direction * a.status.localeCompare(b.status);
      return 0;
    });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle student selection for performance view
  const handleStudentClick = (student: any) => {
    const studentData = getStudentPerformanceData(student.name);
    if (studentData) {
      setSelectedStudent(studentData);
      setShowStudentPerformance(true);
    }
  };

  // Handle back to table view
  const handleBackToStudentsTable = () => {
    setShowStudentPerformance(false);
    setSelectedStudent(null);
  };

  // Mock student performance data
  const getStudentPerformanceData = (studentName: string) => {
    const performanceData: { [key: string]: any } = {
      "Vincent Lawrence F. Enriquez": {
        name: "Vincent Lawrence F. Enriquez",
        studentId: "22-00604",
        course: "BSIT",
        department: "Computer Studies",
        year: "3rd Year",
        overallPerformance: {
          excellent: 45,
          good: 35,
          fair: 15,
          poor: 5
        },
        semesterData: [
          {
            semester: "1st Semester 2024-2025",
            subjects: [
              { name: "Data Structures & Algorithms", performance: "Excellent", score: 92, learningOutcome: "Mastered complex algorithms including sorting, searching, and graph traversal. Demonstrated proficiency in analyzing time and space complexity." },
              { name: "Database Management", performance: "Good", score: 88, learningOutcome: "Acquired skills in SQL query optimization, database design, normalization, and transaction management." },
              { name: "Web Development", performance: "Excellent", score: 95, learningOutcome: "Developed full-stack applications using modern frameworks, API development, and responsive design principles." },
              { name: "Software Engineering", performance: "Good", score: 85, learningOutcome: "Understanding of SDLC methodologies, project management, and software testing practices." }
            ]
          },
          {
            semester: "2nd Semester 2023-2024",
            subjects: [
              { name: "Object-Oriented Programming", performance: "Excellent", score: 94, learningOutcome: "Advanced OOP concepts, design patterns, and code architecture principles for scalable applications." },
              { name: "Computer Networks", performance: "Good", score: 87, learningOutcome: "Network protocols, security implementation, and distributed systems architecture." },
              { name: "Human Computer Interaction", performance: "Excellent", score: 91, learningOutcome: "User experience design, interface development, and accessibility standards." },
              { name: "Systems Analysis and Design", performance: "Good", score: 86, learningOutcome: "Requirements gathering, system modeling, and documentation methodologies." }
            ]
          }
        ]
      },
      "John Carlo Reyes": {
        name: "John Carlo Reyes",
        studentId: "22-00456",
        course: "BSCS",
        department: "Computer Studies",
        year: "3rd Year",
        overallPerformance: {
          excellent: 50,
          good: 30,
          fair: 15,
          poor: 5
        },
        semesterData: [
          {
            semester: "1st Semester 2024-2025",
            subjects: [
              { name: "Computer Networks", performance: "Excellent", score: 93, learningOutcome: "Comprehensive understanding of network protocols, security implementations, and troubleshooting methodologies." },
              { name: "Machine Learning", performance: "Excellent", score: 94, learningOutcome: "Mastered supervised and unsupervised learning algorithms, neural networks, and deep learning applications." },
              { name: "Operating Systems", performance: "Excellent", score: 89, learningOutcome: "Process management, memory allocation, file systems, and concurrent programming concepts." },
              { name: "Computer Graphics", performance: "Good", score: 84, learningOutcome: "3D rendering techniques, shader programming, and animation fundamentals." }
            ]
          },
          {
            semester: "2nd Semester 2023-2024",
            subjects: [
              { name: "Data Structures & Algorithms", performance: "Excellent", score: 96, learningOutcome: "Advanced algorithmic thinking, complex data structures, and optimization techniques for efficient programming." },
              { name: "Software Engineering", performance: "Good", score: 88, learningOutcome: "Software development lifecycle, agile methodologies, and collaborative development practices." },
              { name: "Database Systems", performance: "Excellent", score: 91, learningOutcome: "Database design, query optimization, transaction processing, and distributed database concepts." },
              { name: "Computer Architecture", performance: "Good", score: 86, learningOutcome: "Understanding of CPU design, memory hierarchy, and computer system organization." }
            ]
          }
        ]
      },
      "Maria Santos": {
        name: "Maria Santos",
        studentId: "22-00123",
        course: "BSIT",
        department: "Computer Studies",
        year: "4th Year",
        overallPerformance: {
          excellent: 60,
          good: 25,
          fair: 10,
          poor: 5
        },
        semesterData: [
          {
            semester: "1st Semester 2024-2025",
            subjects: [
              { name: "Capstone Project", performance: "Excellent", score: 98, learningOutcome: "Complete system analysis, design, implementation, and documentation of a comprehensive IT solution with real-world applications." },
              { name: "IT Project Management", performance: "Excellent", score: 94, learningOutcome: "Project planning, execution, risk management, team leadership, and stakeholder communication in IT environments." },
              { name: "Systems Integration", performance: "Excellent", score: 91, learningOutcome: "API development, microservices architecture, security implementation, and enterprise system integration." },
              { name: "Professional Ethics", performance: "Excellent", score: 95, learningOutcome: "IT ethical standards, data privacy regulations, professional responsibility, and industry compliance requirements." }
            ]
          },
          {
            semester: "2nd Semester 2023-2024",
            subjects: [
              { name: "Advanced Database Management", performance: "Excellent", score: 96, learningOutcome: "Database optimization, performance tuning, backup and recovery strategies, and distributed database systems." },
              { name: "Network Security", performance: "Good", score: 89, learningOutcome: "Cybersecurity principles, threat assessment, security protocols, and incident response procedures." },
              { name: "Web Application Development", performance: "Excellent", score: 93, learningOutcome: "Full-stack development, modern frameworks, responsive design, and user experience optimization." },
              { name: "Information Systems Management", performance: "Good", score: 87, learningOutcome: "IT governance, strategic planning, resource management, and organizational technology alignment." }
            ]
          }
        ]
       },
       "Anna Marie Cruz": {
         name: "Anna Marie Cruz",
         studentId: "22-00789",
         course: "BSA",
         department: "Business & Accountancy",
         year: "4th Year",
         overallPerformance: {
           excellent: 55,
           good: 30,
           fair: 10,
           poor: 5
         },
         semesterData: [
           {
             semester: "1st Semester 2024-2025",
             subjects: [
               { name: "Financial Accounting", performance: "Excellent", score: 94, learningOutcome: "Advanced financial statement preparation, consolidated reporting, and international accounting standards compliance." },
               { name: "Auditing", performance: "Good", score: 88, learningOutcome: "Internal control evaluation, risk assessment procedures, and comprehensive audit report preparation." },
               { name: "Taxation", performance: "Excellent", score: 90, learningOutcome: "Tax compliance, planning strategies, advisory services, and international tax regulations." },
               { name: "Business Law", performance: "Good", score: 87, learningOutcome: "Corporate legal compliance, contract law applications, and securities law understanding." }
             ]
           },
           {
             semester: "2nd Semester 2023-2024",
             subjects: [
               { name: "Management Accounting", performance: "Excellent", score: 92, learningOutcome: "Cost analysis, budgeting, performance measurement, and strategic financial planning for business decisions." },
               { name: "Corporate Finance", performance: "Excellent", score: 90, learningOutcome: "Capital structure decisions, investment analysis, financial risk management, and corporate valuation." },
               { name: "Financial Management", performance: "Good", score: 86, learningOutcome: "Working capital management, financial planning, and investment portfolio optimization." },
               { name: "Business Ethics", performance: "Excellent", score: 93, learningOutcome: "Professional ethics, corporate governance, social responsibility, and ethical decision-making frameworks." }
             ]
           }
         ]
       },
       "Sarah Johnson": {
         name: "Sarah Johnson",
         studentId: "22-00876",
         course: "BSN",
         department: "Nursing",
         year: "2nd Year",
         overallPerformance: {
           excellent: 65,
           good: 25,
           fair: 8,
           poor: 2
         },
         semesterData: [
           {
             semester: "1st Semester 2024-2025",
             subjects: [
               { name: "Fundamentals of Nursing", performance: "Excellent", score: 97, learningOutcome: "Mastery of basic nursing skills, evidence-based practice, and adherence to professional nursing standards." },
               { name: "Anatomy & Physiology", performance: "Good", score: 88, learningOutcome: "Comprehensive understanding of human body systems, pathophysiology concepts, and disease processes." },
               { name: "Medical-Surgical Nursing", performance: "Excellent", score: 94, learningOutcome: "Patient care planning, critical thinking in nursing practice, and advanced patient assessment techniques." },
               { name: "Pharmacology", performance: "Good", score: 89, learningOutcome: "Drug administration safety, medication management protocols, and drug interaction analysis." }
             ]
           },
           {
             semester: "2nd Semester 2023-2024",
             subjects: [
               { name: "Health Assessment", performance: "Excellent", score: 95, learningOutcome: "Comprehensive health assessment techniques, physical examination skills, and clinical documentation." },
               { name: "Nursing Research", performance: "Good", score: 87, learningOutcome: "Research methodology, evidence-based practice integration, and critical analysis of nursing literature." },
               { name: "Community Health Nursing", performance: "Excellent", score: 92, learningOutcome: "Public health principles, community assessment, and health promotion strategies." },
               { name: "Mental Health Nursing", performance: "Good", score: 85, learningOutcome: "Psychiatric nursing interventions, therapeutic communication, and mental health assessment." }
             ]
           }
         ]
       }
     };

     return performanceData[studentName] || null;
  };

  return (
    <div className="flex h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] px-5 py-5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-black dark:text-white">Report & Analytics</h1>
              <p className="text-lg text-gray-700 dark:text-gray-400 font-light">Comprehensive academic performance insights and predictions</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-5 bg-white dark:bg-[var(--darkmode-color-one)] border rounded-full h-full p-0">
              <TabsTrigger
                value="professors"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-md px-4 py-3 rounded-l-full px-3 py-3 hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                Outstanding Professors
              </TabsTrigger>
              <TabsTrigger
                value="graduation"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-md px-4 py-3 px-3 py-3 rounded-none hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                Graduation Rates
              </TabsTrigger>
              <TabsTrigger
                value="students"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-md px-4 py-3 px-3 py-3 rounded-none hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                Top Performing Students
              </TabsTrigger>
              <TabsTrigger
                value="atrisk"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-md px-4 py-3 px-3 py-3 rounded-none hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                At-Risk Students
              </TabsTrigger>
              <TabsTrigger
                value="dropout"
                className="data-[state=active]:bg-[var(--customized-color-one)] data-[state=active]:text-white rounded-md px-4 py-3 rounded-r-full px-3 py-3 hover:bg-[var(--customized-color-two)] hover:text-white dark:text-gray-300 dark:hover:text-white"
              >
                Dropout Prediction
              </TabsTrigger>
            </TabsList>

            {/* Outstanding Professors */}
            <TabsContent value="professors" className="space-y-6">
              <AnalyticsProfessorsTab />
            </TabsContent>

            {/* Graduation Rates */}
            <TabsContent value="graduation" className="space-y-6">
              <AnalyticsGraduationTab />
            </TabsContent>

            {/* Top Performing Students */}
            <TabsContent value="students" className="space-y-6">
              {showStudentPerformance && selectedStudent ? (
                // Student Performance View
                <div className="space-y-6">
                  {/* Header with Back Button */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleBackToStudentsTable}
                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to Students
                      </button>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">{selectedStudent.name}</h2>
                      <p className="text-gray-600 text-sm">
                        {selectedStudent.studentId} • {selectedStudent.course} • {selectedStudent.department} • {selectedStudent.year}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-700">GWA:</span>
                          <span className={`font-bold text-lg ${
                            parseFloat(topStudents.find(s => s.name === selectedStudent.name)?.gwa || '0') <= 1.25 ? 'text-green-700' : 
                            parseFloat(topStudents.find(s => s.name === selectedStudent.name)?.gwa || '0') <= 1.75 ? 'text-blue-700' : 'text-gray-700'
                          }`}>
                            {topStudents.find(s => s.name === selectedStudent.name)?.gwa}
                          </span>
                        </div>
                        <Badge className={
                          topStudents.find(s => s.name === selectedStudent.name)?.status === "President's Lister" 
                            ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" 
                            : "bg-green-100 text-green-800 hover:bg-green-100"
                        }>
                          {topStudents.find(s => s.name === selectedStudent.name)?.status}
                        </Badge>
                      </div>
                      <div className="mt-2">
                        <span className="text-sm font-medium text-gray-700">Achievements:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {topStudents.find(s => s.name === selectedStudent.name)?.achievements.slice(0, 3).map((achievement, index) => (
                            <span key={index} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                              {achievement}
                            </span>
                          ))}
                          {(topStudents.find(s => s.name === selectedStudent.name)?.achievements.length || 0) > 3 && (
                            <span className="text-xs text-gray-500">
                              +{(topStudents.find(s => s.name === selectedStudent.name)?.achievements.length || 0) - 3} more...
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Overall Performance Donut Chart */}
                  <Card className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg transition-colors duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Overall Academic Performance</CardTitle>
                      <p className="text-gray-600 text-sm">Distribution of performance ratings across all subjects</p>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[50vh] w-full">
                        <ChartContainer config={{
                          excellent: { label: "Excellent", color: "#10b981" },
                          good: { label: "Good", color: "#3b82f6" },
                          fair: { label: "Fair", color: "#f59e42" },
                          poor: { label: "Poor", color: "#ef4444" }
                        }} className="h-[50vh] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: "Excellent", value: selectedStudent.overallPerformance.excellent, fill: "#10b981" },
                                  { name: "Good", value: selectedStudent.overallPerformance.good, fill: "#3b82f6" },
                                  { name: "Fair", value: selectedStudent.overallPerformance.fair, fill: "#f59e42" },
                                  { name: "Poor", value: selectedStudent.overallPerformance.poor, fill: "#ef4444" }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={120}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {[
                                  { name: "Excellent", value: selectedStudent.overallPerformance.excellent, fill: "#10b981" },
                                  { name: "Good", value: selectedStudent.overallPerformance.good, fill: "#3b82f6" },
                                  { name: "Fair", value: selectedStudent.overallPerformance.fair, fill: "#f59e42" },
                                  { name: "Poor", value: selectedStudent.overallPerformance.poor, fill: "#ef4444" }
                                ].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                              </Pie>
                              <ChartTooltip />
                              <ChartLegend />
                            </PieChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Subject Filter */}
                  <Card className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg transition-colors duration-300">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Subject Filter</CardTitle>
                      <p className="text-gray-600 text-sm">Filter academic performance and learning outcomes by specific subject</p>
                    </CardHeader>
                    <CardContent>
                      <select 
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 w-64" 
                        value={selectedSubject} 
                        onChange={e => setSelectedSubject(e.target.value)}
                      >
                        <option value="All Subjects">All Subjects</option>
                        {Array.from(new Set(
                          selectedStudent.semesterData.flatMap((sem: any) => 
                            sem.subjects.map((subj: any) => subj.name)
                          )
                        ) as Set<string>).map((subject: string) => (
                          <option key={subject} value={subject}>{subject}</option>
                        ))}
                      </select>
                    </CardContent>
                  </Card>

                  {/* Learning Outcomes per Semester */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Learning Outcomes per Semester</h3>
                    {selectedStudent.semesterData.map((semesterData: any, index: number) => (
                      <Card key={index} className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg transition-colors duration-300">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold dark:text-white">{semesterData.semester}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border rounded-lg">
                              <thead className="bg-gray-50 dark:bg-[var(--darkmode-color-two)]">
                                <tr>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Subject</th>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Learning Outcome</th>
                                </tr>
                              </thead>
                              <tbody>
                                {semesterData.subjects
                                  .filter((subject: any) => selectedSubject === "All Subjects" || subject.name === selectedSubject)
                                  .map((subject: any, subIdx: number) => (
                                  <tr key={subIdx} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-[var(--darkmode-color-two)]">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white w-1/4">{subject.name}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{subject.learningOutcome}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Academic Performance per Semester */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Academic Performance per Semester</h3>
                    {selectedStudent.semesterData.map((semesterData: any, index: number) => (
                      <Card key={index} className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg transition-colors duration-300">
                        <CardHeader>
                          <CardTitle className="text-lg font-bold dark:text-white">{semesterData.semester}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-sm border rounded-lg">
                              <thead className="bg-gray-50 dark:bg-[var(--darkmode-color-two)]">
                                <tr>
                                  <th className="px-4 py-3 text-left font-medium text-gray-700 dark:text-gray-300">Subject</th>
                                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Score</th>
                                  <th className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">Performance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {semesterData.subjects
                                  .filter((subject: any) => selectedSubject === "All Subjects" || subject.name === selectedSubject)
                                  .map((subject: any, subIdx: number) => (
                                  <tr key={subIdx} className="border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-[var(--darkmode-color-two)]">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{subject.name}</td>
                                    <td className="px-4 py-3 text-center">
                                      <span className={`font-semibold ${
                                        subject.score >= 90 ? 'text-green-700' : 
                                        subject.score >= 80 ? 'text-blue-700' : 
                                        subject.score >= 70 ? 'text-orange-700' : 'text-red-700'
                                      }`}>
                                        {subject.score}%
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      <Badge className={
                                        subject.performance === "Excellent" ? "bg-green-100 text-green-800" :
                                        subject.performance === "Good" ? "bg-blue-100 text-blue-800" :
                                        subject.performance === "Fair" ? "bg-orange-100 text-orange-800" :
                                        "bg-red-100 text-red-800"
                                      }>
                                        {subject.performance}
                                      </Badge>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                // Default Students Table View
                <>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Top Performing Students</h2>
                <p className="text-gray-600 text-sm mb-4">Monitor and track Dean's Listers and President's Listers across all departments.</p>
              </div>

              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Filters</h3>
                <div className="flex flex-wrap gap-4">
                  <select 
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500" 
                    value={selectedDepartment} 
                    onChange={e => setSelectedDepartment(e.target.value)}
                  >
                    <option value="All Departments">All Departments</option>
                    <option value="Computer Studies">Computer Studies</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Nursing">Nursing</option>
                    <option value="Business & Accountancy">Business & Accountancy</option>
                    <option value="Education">Education</option>
                    <option value="Arts & Sciences">Arts & Sciences</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Search students..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              <div className="mb-6">
                {/* Bar graph placeholder for number of top-performing students by department/year */}
                <Card className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg mb-4 transition-colors duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">
                      {selectedDepartment === "All Departments" 
                        ? "Top Performers by Department" 
                        : `Top Performers - ${selectedDepartment}`}
                    </CardTitle>
                    <p className="text-gray-600 text-sm">Bar graph visualizing the number of Dean’s Listers and President’s Listers</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[50vh] w-full">
                      <ChartContainer config={{
                        "Dean's Lister": { label: "Dean's Lister", color: "#3b82f6" },
                        "President's Lister": { label: "President's Lister", color: "#f59e42" }
                      }} className="h-[50vh] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={departmentPerformanceData()} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis 
                              dataKey="department" 
                              tick={{ fontSize: 12, fill: "#374151" }}
                              interval={0}
                              angle={-45}
                              textAnchor="end"
                              height={80}
                            />
                            <YAxis tick={{ fontSize: 14, fill: "#374151" }} />
                            <ChartTooltip />
                            <ChartLegend />
                            <Bar dataKey="Dean's Lister" fill="#3b82f6" name="Dean's Lister" />
                            <Bar dataKey="President's Lister" fill="#f59e42" name="President's Lister" />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Students Table */}
              <Card className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg transition-colors duration-300">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold">Detailed Performance Insights</CardTitle>
                      <p className="text-gray-600 text-sm">Complete list of top performing students with their achievements</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      ({filteredStudents.length} students)
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm border rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("studentId")}>
                            Student ID {sortField === "studentId" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("name")}>
                            Name {sortField === "name" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Course</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700">Department</th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("year")}>
                            Year {sortField === "year" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                          <th className="px-4 py-3 text-center font-medium text-gray-700 cursor-pointer hover:bg-gray-100" onClick={() => handleSort("status")}>
                            Honor's List {sortField === "status" && (sortDirection === "asc" ? "↑" : "↓")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredStudents.map((student, idx) => (
                          <tr 
                            key={student.studentId} 
                            className="border-b last:border-b-0 hover:bg-gray-50 transition-colors cursor-pointer"
                            onClick={() => handleStudentClick(student)}
                            title="Click to view academic performance and learning outcomes"
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{student.studentId}</td>
                            <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{student.name}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{student.course}</td>
                            <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{student.department}</td>
                            <td className="px-4 py-3 text-center">{student.year}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge className={
                                student.status === "President's Lister" 
                                  ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" 
                                  : "bg-green-100 text-green-800 hover:bg-green-100"
                              }>
                                {student.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
                </>
              )}
            </TabsContent>

            {/* At-Risk Students */}
            <TabsContent value="atrisk" className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">At-Risk Students</h2>
              <div className="mb-6">
                {/* Donut chart placeholder for at-risk student distribution */}
                <Card className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg mb-4 transition-colors duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Distribution of At-Risk Students</CardTitle>
                    <p className="text-gray-600 text-sm">Donut chart visualizing risk levels and monthly trends</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-400">
                      [Donut chart visualization goes here]
                    </div>
                  </CardContent>
                </Card>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {/* Detailed insights for each at-risk student */}
                {bottomStudents.map((student) => (
                  <Card key={student.studentId} className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg transition-colors duration-300">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <Target className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg font-bold">{student.name}</CardTitle>
                          <p className="text-gray-600 text-sm">{student.status}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                        <div>
                          <p className="text-sm text-gray-600">
                            {student.studentId} • {student.course} • {student.year}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge
                            className={
                              student.riskLevel === "High"
                                ? "bg-red-100 text-red-800 hover:bg-red-100"
                                : "bg-orange-100 text-orange-800 hover:bg-orange-100"
                            }
                          >
                            {student.riskLevel} Risk
                          </Badge>
                          <p className="text-lg font-bold text-gray-900 mt-1">GWA: {student.gwa}</p>
                        </div>
                      </div>
                      <div className="space-y-1 mb-2">
                        <p className="text-xs font-medium text-gray-700">Issues Identified:</p>
                        {student.issues.map((issue, index) => (
                          <p key={index} className="text-xs text-gray-600">
                            • {issue}
                          </p>
                        ))}
                      </div>
                      {/* Monthly trend and risk factors placeholder */}
                      <div className="h-24 flex items-center justify-center text-gray-400 border-t pt-2 mt-2">
                        [Monthly trend & risk factors for {student.name}]
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Dropout Prediction */}
            <TabsContent value="dropout" className="space-y-6">
              <h2 className="text-xl font-bold text-gray-900">Dropout Prediction</h2>
              <div className="flex flex-wrap gap-4 mb-4">
                <select className="border rounded px-2 py-1 text-sm">
                  <option>All Departments</option>
                  <option>IT</option>
                  <option>CS</option>
                  <option>Engineering</option>
                  <option>Business</option>
                  <option>Nursing</option>
                </select>
                <select className="border rounded px-2 py-1 text-sm">
                  <option>All Programs</option>
                  <option>BSIT</option>
                  <option>BSCS</option>
                  <option>BSA</option>
                  <option>BSECE</option>
                  <option>BSN</option>
                </select>
                <select className="border rounded px-2 py-1 text-sm">
                  <option>All Years</option>
                  <option>2019</option>
                  <option>2020</option>
                  <option>2021</option>
                  <option>2022</option>
                  <option>2023</option>
                  <option>2024</option>
                </select>
              </div>
              <Card className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg mb-4 transition-colors duration-300">
                <CardHeader>
                  <CardTitle className="text-lg font-bold dark:text-white">Dropout Trends</CardTitle>
                  <p className="text-gray-600 text-sm">Visualize and analyze student dropouts per academic year</p>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-gray-400">
                    [Dropout trends visualization goes here]
                  </div>
                </CardContent>
              </Card>
              <div className="grid grid-cols-1 gap-8">
                {/* Detailed dropout insights placeholder */}
                <Card className="bg-white dark:bg-[var(--darkmode-color-one)] border rounded-lg transition-colors duration-300">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold">Dropout Insights</CardTitle>
                    <p className="text-gray-600 text-sm">Potential reasons for each dropout (academic, financial, personal, etc.)</p>
                  </CardHeader>
                  <CardContent>
                    <div className="h-32 flex items-center justify-center text-gray-400">
                      [Dropout reasons and insights go here]
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}

// Add mock data at the top of the file
const programKeys = ["BSIT", "BSCS", "BSA", "BSECE", "BSN"] as const;
type ProgramKey = typeof programKeys[number];

type GraduationTrendsRow = {
  year: string;
  BSIT: number;
  BSCS: number;
  BSA: number;
  BSECE: number;
  BSN: number;
};

const graduationTrendsData: GraduationTrendsRow[] = [
  { year: "2019", BSIT: 85, BSCS: 88, BSA: 91, BSECE: 89, BSN: 93 },
  { year: "2020", BSIT: 88, BSCS: 90, BSA: 92, BSECE: 90, BSN: 94 },
  { year: "2021", BSIT: 91, BSCS: 92, BSA: 94, BSECE: 92, BSN: 96 },
  { year: "2022", BSIT: 89, BSCS: 91, BSA: 93, BSECE: 91, BSN: 95 },
  { year: "2023", BSIT: 93, BSCS: 94, BSA: 96, BSECE: 94, BSN: 97 },
];
const dropoutGraduateRatioData = [
  { label: "Graduates", value: 420, color: "#10b981" },
  { label: "Dropouts", value: 80, color: "#ef4444" },
];
const earlyGraduates = [
  { name: "Maria Santos", program: "BSIT", expectedYear: 2024, actualYear: 2023, reason: "Accelerated" },
  { name: "John Carlo Reyes", program: "BSCS", expectedYear: 2024, actualYear: 2023, reason: "Credit Transfer" },
  { name: "Anna Marie Cruz", program: "BSA", expectedYear: 2024, actualYear: 2023, reason: "Honors Program" },
];
