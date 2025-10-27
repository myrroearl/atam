"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { 
  HelpCircle, 
  BookOpen, 
  Users, 
  Calendar, 
  Sparkles, 
  Archive, 
  FileText, 
  Settings, 
  Search,
  ChevronRight,
  ChevronDown,
  GraduationCap,
  BarChart3,
  Clock,
  Award,
  MessageSquare,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  Plus,
  Filter,
  RefreshCw,
  Mail
} from "lucide-react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"

export function HelpSupportContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(["getting-started"]))

  const toggleSection = (sectionId: string) => {
    setOpenSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const helpSections = [
    {
      id: "getting-started",
      title: "Getting Started",
      icon: HelpCircle,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-950",
      content: [
        {
          title: "Welcome to PLP Academic Management System",
          description: "This comprehensive guide will help you navigate and utilize all the features available in the Professor Academic Management System.",
          steps: [
            "Access your dashboard to view an overview of your classes and recent activity",
            "Navigate through the sidebar to access different features",
            "Use the search functionality to quickly find specific information",
            "Check notifications for important updates and alerts"
          ]
        },
        {
          title: "System Overview",
          description: "The system is designed to streamline your academic management tasks with the following main areas:",
          features: [
            { name: "Classes Management", description: "Create, manage, and track your classes" },
            { name: "Gradebook", description: "Record and manage student grades and assessments" },
            { name: "AI Tools", description: "Leverage AI-powered tools for content generation" },
            { name: "Schedule", description: "Manage your class schedules and calendar" },
            { name: "Archived Classes", description: "Access and manage previously archived classes" }
          ]
        }
      ]
    },
    {
      id: "classes-management",
      title: "Classes Management",
      icon: BookOpen,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-950",
      content: [
        {
          title: "Viewing Your Classes",
          description: "The Classes page displays all your active classes with key information:",
          steps: [
            "Navigate to 'Classes' in the sidebar",
            "View class cards showing student count, average grade, and assignments",
            "Use the search bar to filter classes by name or code",
            "Click on 'View Gradebook' to access detailed class information"
          ]
        },
        {
          title: "Class Information Display",
          description: "Each class card shows:",
          features: [
            { name: "Student Count", description: "Number of students enrolled in the class" },
            { name: "Average Grade", description: "Current class average across all assessments" },
            { name: "Assignments", description: "Total number of assignments given" },
            { name: "Schedule", description: "Class meeting times and schedule" },
            { name: "Status", description: "Current status of the class (Active/Inactive)" }
          ]
        },
        {
          title: "Archiving Classes",
          description: "To archive a class when the semester ends:",
          steps: [
            "Click the three-dot menu (⋯) on any class card",
            "Select 'Archive Class' from the dropdown menu",
            "Confirm the action when prompted",
            "The class will be moved to the 'Archived Classes' section"
          ]
        }
      ]
    },
    {
      id: "gradebook",
      title: "Gradebook & Grading",
      icon: FileText,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-950",
      content: [
        {
          title: "Accessing the Gradebook",
          description: "To access a class gradebook:",
          steps: [
            "Go to the Classes page",
            "Click 'View Gradebook' on any class card",
            "Or use the dropdown menu and select 'View Gradebook'"
          ]
        },
        {
          title: "Grade Components",
          description: "The gradebook is organized by components:",
          features: [
            { name: "Quizzes", description: "Short assessments and quizzes" },
            { name: "Exams", description: "Major examinations and tests" },
            { name: "Assignments", description: "Homework and projects" },
            { name: "Participation", description: "Class participation and attendance" }
          ]
        },
        {
          title: "Adding Grade Entries",
          description: "To add new grade entries:",
          steps: [
            "Click the 'Add Grade Entry' button",
            "Fill in the entry details (name, date, max score, topics)",
            "Select the students and enter their scores",
            "Choose the appropriate grade component",
            "Save the entry to record all grades"
          ]
        },
        {
          title: "Editing Grades",
          description: "To modify existing grades:",
          steps: [
            "Click on any grade cell in the gradebook",
            "Enter the new score",
            "Click 'Save Changes' to update all modified grades",
            "The system will log all changes for audit purposes"
          ]
        },
        {
          title: "Attendance Tracking",
          description: "Track student attendance:",
          steps: [
            "Click on attendance cells (marked with clock icon)",
            "Select Present, Late, or Absent",
            "Save changes to update attendance records",
            "View attendance history in student profiles"
          ]
        }
      ]
    },
    {
      id: "ai-tools",
      title: "AI Tools & Co-Guro",
      icon: Sparkles,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-950",
      content: [
        {
          title: "Accessing AI Tools",
          description: "Navigate to 'Co-Guro AI Tools' in the sidebar to access AI-powered features.",
          steps: [
            "Click on 'Co-Guro AI Tools' in the navigation",
            "Choose from available AI tools and features",
            "Follow the prompts to generate content",
            "Review and edit generated content as needed"
          ]
        },
        {
          title: "Available AI Features",
          description: "The system includes various AI-powered tools:",
          features: [
            { name: "Quiz Generation", description: "Generate quizzes based on topics and difficulty" },
            { name: "PPT Creation", description: "Create presentation slides for your classes" },
            { name: "Content Generation", description: "Generate educational content and materials" },
            { name: "Assessment Tools", description: "Create various types of assessments" }
          ]
        }
      ]
    },
    {
      id: "schedule",
      title: "Schedule & Calendar",
      icon: Calendar,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50 dark:bg-indigo-950",
      content: [
        {
          title: "Viewing Your Schedule",
          description: "Access your class schedule and calendar:",
          steps: [
            "Click 'Schedule' in the sidebar",
            "View your weekly/monthly schedule",
            "See upcoming classes and important dates",
            "Check for any schedule conflicts or changes"
          ]
        },
        {
          title: "Schedule Management",
          description: "Manage your class schedules:",
          features: [
            { name: "Class Times", description: "View and manage class meeting times" },
            { name: "Room Assignments", description: "Check classroom assignments" },
            { name: "Important Dates", description: "Track deadlines and important events" },
            { name: "Notifications", description: "Receive alerts for schedule changes" }
          ]
        }
      ]
    },
    {
      id: "archived-classes",
      title: "Archived Classes",
      icon: Archive,
      color: "text-gray-600",
      bgColor: "bg-gray-50 dark:bg-gray-950",
      content: [
        {
          title: "Accessing Archived Classes",
          description: "View and manage your archived classes:",
          steps: [
            "Click 'Archived Classes' in the sidebar",
            "View all previously archived classes",
            "Use filters to find specific semesters",
            "Search through archived class data"
          ]
        },
        {
          title: "Managing Archived Classes",
          description: "What you can do with archived classes:",
          features: [
            { name: "View Gradebooks", description: "Access historical grade data" },
            { name: "Restore Classes", description: "Reactivate classes if needed" },
            { name: "Export Data", description: "Download class and grade information" },
            { name: "Semester Filtering", description: "Filter by specific semesters" }
          ]
        },
        {
          title: "Restoring Classes",
          description: "To restore an archived class:",
          steps: [
            "Go to the Archived Classes page",
            "Find the class you want to restore",
            "Click 'Restore' button or use the dropdown menu",
            "Confirm the restoration action",
            "The class will return to your active classes list"
          ]
        }
      ]
    },
    {
      id: "student-profiles",
      title: "Student Profiles & Analytics",
      icon: Users,
      color: "text-cyan-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950",
      content: [
        {
          title: "Accessing Student Profiles",
          description: "View detailed student information:",
          steps: [
            "Go to any class gradebook",
            "Click on a student's name or profile",
            "View comprehensive student data",
            "Analyze performance and progress"
          ]
        },
        {
          title: "Student Profile Features",
          description: "Student profiles include:",
          features: [
            { name: "Grade Entries", description: "All individual grade records with dates" },
            { name: "Topic Mastery", description: "Performance analysis by topic areas" },
            { name: "Progress Trends", description: "Visual charts showing improvement over time" },
            { name: "Attendance Records", description: "Complete attendance history" },
            { name: "Performance Summary", description: "Overall academic performance metrics" }
          ]
        },
        {
          title: "Analytics & Insights",
          description: "Use analytics to track student progress:",
          steps: [
            "View topic mastery charts and graphs",
            "Analyze performance trends over time",
            "Identify students who need additional support",
            "Track class-wide performance metrics"
          ]
        }
      ]
    },
    {
      id: "notifications",
      title: "Notifications & Activity",
      icon: MessageSquare,
      color: "text-pink-600",
      bgColor: "bg-pink-50 dark:bg-pink-950",
      content: [
        {
          title: "Notification Center",
          description: "Stay updated with system notifications:",
          steps: [
            "Click the bell icon in the top navigation",
            "View all recent notifications",
            "Mark notifications as read",
            "Access detailed notification history"
          ]
        },
        {
          title: "Activity Logging",
          description: "The system automatically logs your activities:",
          features: [
            { name: "Grade Changes", description: "All grade modifications are logged" },
            { name: "Class Management", description: "Class creation, updates, and archiving" },
            { name: "System Actions", description: "Login, logout, and other system activities" },
            { name: "AI Tool Usage", description: "Usage of AI-powered features" }
          ]
        },
        {
          title: "Recent Activity Sidebar",
          description: "View recent activity in the sidebar:",
          steps: [
            "Check the 'Recent Activity' section in the sidebar",
            "View your latest actions and changes",
            "Click 'View All' to see complete activity history",
            "Use activity logs for audit and review purposes"
          ]
        }
      ]
    },
    {
      id: "troubleshooting",
      title: "Troubleshooting & Support",
      icon: Settings,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-950",
      content: [
        {
          title: "Common Issues",
          description: "Solutions to frequently encountered problems:",
          issues: [
            {
              problem: "Cannot access gradebook",
              solution: "Ensure you have the correct permissions and the class is active"
            },
            {
              problem: "Grades not saving",
              solution: "Check your internet connection and try refreshing the page"
            },
            {
              problem: "AI tools not responding",
              solution: "Wait a moment and try again, or contact support if the issue persists"
            },
            {
              problem: "Cannot archive class",
              solution: "Ensure all grades are saved and the class has no pending activities"
            }
          ]
        },
        {
          title: "Getting Help",
          description: "If you need additional support:",
          steps: [
            "Check this help documentation first",
            "Look for error messages and follow suggested solutions",
            "Contact your system administrator",
            "Report bugs or issues through the support channel"
          ]
        },
        {
          title: "System Requirements",
          description: "Ensure optimal performance:",
          features: [
            { name: "Browser", description: "Use modern browsers (Chrome, Firefox, Safari, Edge)" },
            { name: "Internet", description: "Stable internet connection required" },
            { name: "JavaScript", description: "Ensure JavaScript is enabled" },
            { name: "Cookies", description: "Allow cookies for proper functionality" }
          ]
        }
      ]
    }
  ]

  const filteredSections = helpSections.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.content.some(content => 
      content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      content.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <HelpCircle className="h-8 w-8 text-primary" />
            Help & Support
          </h1>
          <p className="text-muted-foreground">Complete guide to using the Professor Academic Management System</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search help topics..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="#classes-management">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <BookOpen className="h-6 w-6 text-green-600" />
                <div>
                  <h3 className="font-semibold">Classes</h3>
                  <p className="text-sm text-muted-foreground">Manage your classes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="#gradebook">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-purple-600" />
                <div>
                  <h3 className="font-semibold">Gradebook</h3>
                  <p className="text-sm text-muted-foreground">Record and manage grades</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="#ai-tools">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-orange-600" />
                <div>
                  <h3 className="font-semibold">AI Tools</h3>
                  <p className="text-sm text-muted-foreground">Use Co-Guro AI features</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="#troubleshooting">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Settings className="h-6 w-6 text-red-600" />
                <div>
                  <h3 className="font-semibold">Troubleshooting</h3>
                  <p className="text-sm text-muted-foreground">Get help with issues</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Help Sections */}
      <div className="space-y-4">
        {filteredSections.map((section) => {
          const IconComponent = section.icon
          const isOpen = openSections.has(section.id)
          
          return (
            <Card key={section.id} id={section.id}>
              <Collapsible open={isOpen} onOpenChange={() => toggleSection(section.id)}>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${section.bgColor}`}>
                          <IconComponent className={`h-5 w-5 ${section.color}`} />
                        </div>
                        <div>
                          <CardTitle className="text-xl">{section.title}</CardTitle>
                          <CardDescription>
                            {section.content.length} topic{section.content.length !== 1 ? 's' : ''} available
                          </CardDescription>
                        </div>
                      </div>
                      {isOpen ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <CardContent className="space-y-6">
                    {section.content.map((content, index) => (
                      <div key={index} className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold mb-2">{content.title}</h3>
                          <p className="text-muted-foreground mb-4">{content.description}</p>
                        </div>
                        
                        {content.steps && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <Clock className="h-4 w-4" />
                              Steps:
                            </h4>
                            <ol className="list-decimal list-inside space-y-1 text-sm">
                              {content.steps.map((step, stepIndex) => (
                                <li key={stepIndex} className="text-muted-foreground">{step}</li>
                              ))}
                            </ol>
                          </div>
                        )}
                        
                        {content.features && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <Award className="h-4 w-4" />
                              Features:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {content.features.map((feature, featureIndex) => (
                                <div key={featureIndex} className="flex items-start gap-2 p-2 rounded-lg bg-muted/50">
                                  <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                                  <div>
                                    <p className="font-medium text-sm">{feature.name}</p>
                                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {content.issues && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <Settings className="h-4 w-4" />
                              Common Issues:
                            </h4>
                            <div className="space-y-3">
                              {content.issues.map((issue, issueIndex) => (
                                <div key={issueIndex} className="p-3 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
                                  <p className="font-medium text-sm text-red-800 dark:text-red-200">
                                    <strong>Problem:</strong> {issue.problem}
                                  </p>
                                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    <strong>Solution:</strong> {issue.solution}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )
        })}
      </div>

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-6 text-center">
          <h3 className="text-lg font-semibold mb-2">Need More Help?</h3>
          <p className="text-muted-foreground mb-4">
            If you can't find what you're looking for, contact your system administrator or IT support team.
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              0917 123 4567
            </Button>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              atam@gmail.com
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
