"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Sparkles, ArrowLeft, Target, Clock, Users, CheckSquare, Download, Eye, AlertCircle, Lightbulb, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import Link from "next/link"
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"

interface LessonPlan {
  title: string;
  gradeLevel: string;
  duration: string;
  subject: string;
  summary?: string;
  objectives: string[];
  materials: string[];
  activities: Array<{
    phase: string;
    type: string;
    description: string;
  }>;
  assessment: string[];
  extensions?: string[];
}

// Component to render markdown-like formatted text
function FormattedText({ text }: { text: string }) {
  if (!text) return null;
  
  // Split by double line breaks for paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  return (
    <div className="space-y-2">
      {paragraphs.map((paragraph, idx) => {
        // Check for lists
        const renderBoldText = (content: string) => {
          const parts = content.split(/(\*\*.*?\*\*)/g);
          return parts.map((part, i) => 
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={i}>{part.slice(2, -2)}</strong>
            ) : (
              <span key={i}>{part}</span>
            )
          );
        };
        
        const lines = paragraph.split('\n').map(l => l.trim()).filter(l => l);
        if (lines.some(line => line.startsWith('- ') || line.startsWith('* '))) {
          return (
            <ul key={idx} className="list-disc list-inside space-y-2 text-sm ml-4">
              {lines.filter(line => line.startsWith('- ') || line.startsWith('* ')).map((line, li) => {
                const content = line.replace(/^[-*]\s+/, '');
                return (
                  <li key={li} className="text-sm">
                    {renderBoldText(content)}
                  </li>
                );
              })}
            </ul>
          );
        }
        // Check for numbered lists
        if (lines.some(line => /^\d+\.\s/.test(line.trim()))) {
          return (
            <ol key={idx} className="list-decimal list-inside space-y-2 text-sm ml-4">
              {lines.filter(line => /^\d+\.\s/.test(line)).map((line, li) => {
                const content = line.replace(/^\d+\.\s/, '');
                return (
                  <li key={li} className="text-sm">
                    {renderBoldText(content)}
                  </li>
                );
              })}
            </ol>
          );
        }
        // Regular paragraph with bold text support
        return (
          <p key={idx} className="text-sm leading-relaxed">
            {renderBoldText(paragraph)}
          </p>
        );
      })}
    </div>
  );
}

// Helper function to render text with bold formatting for simple spans
function renderTextWithBold(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, idx) => 
    part.startsWith('**') && part.endsWith('**') ? (
      <strong key={idx}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={idx}>{part}</span>
    )
  );
}

interface ClassData {
  class_id: number;
  class_name: string;
  subject_id: number;
  section_id: number;
  subjects?: {
    subject_name: string;
    subject_code: string;
  };
  studentCount: number;
}

interface SubjectData {
  subject_id: number;
  subject_name: string;
  subject_code: string;
}

export function LessonPlannerContent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)
  const [showFullPreview, setShowFullPreview] = useState(false)
  
  // Data from Supabase
  const [classes, setClasses] = useState<ClassData[]>([])
  const [subjects, setSubjects] = useState<SubjectData[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)

  // Form state
  const [formData, setFormData] = useState({
    selectedClass: '',
    gradeLevel: '',
    subject: '',
    duration: '',
    classSize: '',
    learningGoal: '',
    topic: '',
    customRequirements: '',
    teachingStyle: [] as string[]
  })

  // Fetch classes and subjects on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/professor/lesson-data')
        if (!response.ok) {
          throw new Error('Failed to fetch data')
        }
        const data = await response.json()
        setClasses(data.classes || [])
        setSubjects(data.subjects || [])
      } catch (error) {
        console.error('Error fetching lesson data:', error)
        setError('Failed to load classes and subjects')
      } finally {
        setIsLoadingData(false)
      }
    }

    fetchData()
  }, [])

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle class selection - auto-fill subject and class size
  const handleClassChange = (classId: string) => {
    // If "none" selected, clear the class selection but keep existing values
    if (classId === 'none') {
      setFormData(prev => ({
        ...prev,
        selectedClass: 'none'
      }))
      return
    }

    const selectedClass = classes.find(c => c.class_id.toString() === classId)
    if (selectedClass) {
      // Get subject name safely
      const subjectName = selectedClass.subjects?.subject_name || ''
        
      setFormData(prev => ({
        ...prev,
        selectedClass: classId,
        subject: subjectName,
        classSize: selectedClass.studentCount.toString()
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        selectedClass: classId
      }))
    }
  }

  const handleTeachingStyleToggle = (style: string) => {
    setFormData(prev => {
      const currentStyles = Array.isArray(prev.teachingStyle) ? prev.teachingStyle : []
      if (currentStyles.includes(style)) {
        return { ...prev, teachingStyle: currentStyles.filter(s => s !== style) }
      } else {
        return { ...prev, teachingStyle: [...currentStyles, style] }
      }
    })
  }

  const handleGenerate = async () => {
    // Validate required fields
    if (!formData.gradeLevel || !formData.subject || !formData.duration || !formData.learningGoal || !formData.topic) {
      setError('Please fill in all required fields')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      const response = await fetch('/api/professor/lesson', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate lesson plan')
      }

      const data: LessonPlan = await response.json()
      setLessonPlan(data)
      setShowPreview(true)
      
    } catch (error) {
      console.error('Error generating lesson plan:', error)
      setError(error instanceof Error ? error.message : 'Failed to generate lesson plan')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = () => {
    setShowFullPreview(true)
  }

  const handleExport = async () => {
    if (!lessonPlan) return

    try {
      // Helper to remove markdown formatting for plain text
      const stripMarkdown = (text: string) => text.replace(/\*\*/g, '')

      // Create document sections
      const sections = []

      // Title
      sections.push(
        new Paragraph({
          text: lessonPlan.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { after: 400 }
        })
      )

      // Basic Info
      sections.push(
        new Paragraph({
          children: [
            new TextRun({ text: "Grade Level: ", bold: true }),
            new TextRun({ text: lessonPlan.gradeLevel })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Subject: ", bold: true }),
            new TextRun({ text: lessonPlan.subject })
          ]
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Duration: ", bold: true }),
            new TextRun({ text: lessonPlan.duration })
          ]
        })
      )

      // Summary
      if (lessonPlan.summary) {
        sections.push(
          new Paragraph({ text: "Overview", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } }),
          new Paragraph({ text: lessonPlan.summary, spacing: { after: 300 } })
        )
      }

      // Objectives
      sections.push(
        new Paragraph({ text: "Learning Objectives", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } })
      )
      lessonPlan.objectives.forEach(objective => {
        sections.push(
          new Paragraph({
            text: stripMarkdown(objective),
            bullet: { level: 0 },
            spacing: { after: 100 }
          })
        )
      })

      // Materials
      sections.push(
        new Paragraph({ text: "Materials Needed", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } })
      )
      lessonPlan.materials.forEach(material => {
        sections.push(
          new Paragraph({
            text: material,
            bullet: { level: 0 },
            spacing: { after: 100 }
          })
        )
      })

      // Activities
      sections.push(
        new Paragraph({ text: "Lesson Activities", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } })
      )
      lessonPlan.activities.forEach(activity => {
        sections.push(
          new Paragraph({
            text: `${activity.phase} - ${activity.type}`,
            heading: HeadingLevel.HEADING_3,
            spacing: { after: 100 }
          }),
          new Paragraph({
            text: stripMarkdown(activity.description),
            spacing: { after: 200 }
          })
        )
      })

      // Assessment
      sections.push(
        new Paragraph({ text: "Assessment Strategies", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } })
      )
      lessonPlan.assessment.forEach(item => {
        sections.push(
          new Paragraph({
            text: stripMarkdown(item),
            bullet: { level: 0 },
            spacing: { after: 100 }
          })
        )
      })

      // Extensions
      if (lessonPlan.extensions && lessonPlan.extensions.length > 0) {
        sections.push(
          new Paragraph({ text: "Extended Activities", heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 200 } })
        )
        lessonPlan.extensions.forEach(item => {
          sections.push(
            new Paragraph({
              text: stripMarkdown(item),
              bullet: { level: 0 },
              spacing: { after: 100 }
            })
          )
        })
      }

      // Create document
      const doc = new Document({
        sections: [{
          children: sections
        }]
      })

      // Generate blob and download
      const blob = await Packer.toBlob(doc)
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${lessonPlan.title.replace(/[^a-z0-9]/gi, '_')}_Lesson_Plan.docx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

    } catch (error) {
      console.error('Error exporting lesson plan:', error)
      setError('Failed to export lesson plan')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/professor/ai-tools">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-purple-500" />
              AI Lesson Plan Generator
            </h1>
            <p className="text-muted-foreground">Generate comprehensive lesson plans tailored to your curriculum</p>
          </div>
        </div>
        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lesson Configuration</CardTitle>
              <CardDescription>Provide details about your lesson requirements</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Select Class - Optional */}
              <div className="space-y-2">
                <Label htmlFor="class">Select Class (Optional)</Label>
                <p className="text-sm text-muted-foreground">Select a class to auto-fill subject and class size</p>
                <Select 
                  value={formData.selectedClass}
                  onValueChange={handleClassChange}
                  disabled={isLoadingData}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={isLoadingData ? "Loading..." : "Select a class"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None - Manual Entry</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.class_id} value={cls.class_id.toString()}>
                        {cls.class_name} ({cls.subjects?.subject_name || 'N/A'}) - {cls.studentCount} students
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="grade-level">Grade Level(s) *</Label>
                  <Select value={formData.gradeLevel} onValueChange={(value) => handleInputChange('gradeLevel', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select grade level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="First Year">First Year</SelectItem>
                      <SelectItem value="Second Year">Second Year</SelectItem>
                      <SelectItem value="Third Year">Third Year</SelectItem>
                      <SelectItem value="Fourth Year">Fourth Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Subject *</Label>
                  <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.subject_id} value={subject.subject_name}>
                          {subject.subject_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Lesson Duration *</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Hours</SelectItem>
                      <SelectItem value="3">3 Hours</SelectItem>
                      <SelectItem value="4">4 Hours</SelectItem>
                      <SelectItem value="5">5 Hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class-size">Class Size</Label>
                  <Input 
                    placeholder="e.g., 25 students" 
                    value={formData.classSize}
                    onChange={(e) => handleInputChange('classSize', e.target.value)}
                  />
                </div>
              </div>

              <Separator />

              {/* Learning Objectives */}
              <div className="space-y-2">
                <Label htmlFor="learning-goals">I want my students to learn... *</Label>
                <Textarea
                  id="learning-goals"
                  placeholder="Describe what you want your students to understand, know, or be able to do by the end of this lesson..."
                  className="min-h-[100px]"
                  value={formData.learningGoal}
                  onChange={(e) => handleInputChange('learningGoal', e.target.value)}
                />
              </div>

              {/* Topic/Theme */}
              <div className="space-y-2">
                <Label htmlFor="topic">Topic/Theme *</Label>
                <Input 
                  id="topic" 
                  placeholder="e.g., Java Programming, HTML Fundamentals, Quadratic Equations"
                  value={formData.topic}
                  onChange={(e) => handleInputChange('topic', e.target.value)}
                />
              </div>

              {/* Custom Requirements */}
              <div className="space-y-2">
                <Label htmlFor="custom-prompt">Custom Requirements (Optional)</Label>
                <Textarea
                  id="custom-prompt"
                  placeholder="Any specific requirements, teaching methods, or constraints you'd like to include..."
                  className="min-h-[80px]"
                  value={formData.customRequirements}
                  onChange={(e) => handleInputChange('customRequirements', e.target.value)}
                />
              </div>

              {/* Teaching Style Preferences */}
              <div className="space-y-3">
                <Label>Teaching Style Preferences (Optional)</Label>
                <p className="text-sm text-muted-foreground">Select styles that align with your teaching approach</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Interactive',
                    'Lecture-based',
                    'Inquiry-based',
                    'Project-based',
                    'Hands-on',
                    'Group Collaboration',
                    'Technology Integration',
                    'Experiential Learning'
                  ].map((style) => {
                    const isSelected = formData.teachingStyle.includes(style)
                    return (
                      <Badge
                        key={style}
                        variant={isSelected ? "default" : "outline"}
                        className="cursor-pointer hover:bg-primary/80 transition-colors"
                        onClick={() => handleTeachingStyleToggle(style)}
                      >
                        {style}
                      </Badge>
                    )
                  })}
                </div>
              </div>

              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
                {isGenerating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating Lesson Plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Lesson Plan
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Generated Lesson Plan</CardTitle>
                  <CardDescription>
                    Your structured lesson plan with objectives, activities, and assessments
                  </CardDescription>
                </div>
                {showPreview && lessonPlan && (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handlePreview}>
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm" onClick={handleExport}>
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {!showPreview || !lessonPlan ? (
                <div className="text-center py-12 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your lesson plan will appear here</p>
                  <p className="text-sm">Fill in the requirements and click generate to start</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Lesson Header */}
                  <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">{lessonPlan.title}</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Users className="h-4 w-4" />
                        <span>{lessonPlan.gradeLevel}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Clock className="h-4 w-4" />
                        <span>{lessonPlan.duration}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <BookOpen className="h-4 w-4" />
                        <span>{lessonPlan.subject}</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary/Introduction Section */}
                  {lessonPlan.summary && (
                    <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Overview
                      </h4>
                      <FormattedText text={lessonPlan.summary} />
                    </div>
                  )}

                  {/* Learning Objectives */}
                  <div className="space-y-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                    <h4 className="font-semibold text-lg flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                      Learning Objectives
                    </h4>
                    <ul className="space-y-2">
                      {lessonPlan.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="flex-1">{renderTextWithBold(objective)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Materials */}
                  <div className="space-y-3 p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-900">
                    <h4 className="font-semibold text-lg">Materials Needed</h4>
                    <div className="flex flex-wrap gap-2">
                      {lessonPlan.materials.map((material, index) => (
                        <Badge key={index} variant="outline" className="text-sm bg-white dark:bg-gray-800">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="space-y-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h4 className="font-semibold text-lg">Lesson Activities</h4>
                    <div className="space-y-4">
                      {lessonPlan.activities.map((activity, index) => (
                        <div key={index} className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-base">{activity.phase}</h5>
                            <Badge variant="secondary" className="text-xs">{activity.type}</Badge>
                          </div>
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            <FormattedText text={activity.description} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assessment */}
                  <div className="space-y-3 p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-lg border border-indigo-200 dark:border-indigo-900">
                    <h4 className="font-semibold text-lg">Assessment Strategies</h4>
                    <ul className="space-y-2">
                      {lessonPlan.assessment.map((item, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                          <span className="flex-1">{renderTextWithBold(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Extensions */}
                  {lessonPlan.extensions && lessonPlan.extensions.length > 0 && (
                    <div className="space-y-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
                      <h4 className="font-semibold text-lg flex items-center gap-2">
                        <Lightbulb className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        Extended Activities
                      </h4>
                      <ul className="space-y-2">
                        {lessonPlan.extensions.map((item, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                            <span className="flex-1">{renderTextWithBold(item)}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={showFullPreview} onOpenChange={setShowFullPreview}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{lessonPlan?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 mt-4">
            {lessonPlan && (
              <>
                {/* Lesson Header */}
                <div className="p-5 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{lessonPlan.gradeLevel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{lessonPlan.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      <span>{lessonPlan.subject}</span>
                    </div>
                  </div>
                </div>

                {/* Summary */}
                {lessonPlan.summary && (
                  <div className="p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/20 rounded-r-lg">
                    <h4 className="font-semibold mb-2">Overview</h4>
                    <FormattedText text={lessonPlan.summary} />
                  </div>
                )}

                {/* Objectives */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Learning Objectives</h4>
                  <ul className="space-y-2 ml-4">
                    {lessonPlan.objectives.map((objective, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{renderTextWithBold(objective)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Materials */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Materials Needed</h4>
                  <div className="flex flex-wrap gap-2">
                    {lessonPlan.materials.map((material, index) => (
                      <Badge key={index} variant="outline">{material}</Badge>
                    ))}
                  </div>
                </div>

                {/* Activities */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-lg">Lesson Activities</h4>
                  {lessonPlan.activities.map((activity, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">{activity.phase}</h5>
                        <Badge variant="secondary">{activity.type}</Badge>
                      </div>
                      <FormattedText text={activity.description} />
                    </div>
                  ))}
                </div>

                {/* Assessment */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-lg">Assessment Strategies</h4>
                  <ul className="space-y-2 ml-4">
                    {lessonPlan.assessment.map((item, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                        <span>{renderTextWithBold(item)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Extensions */}
                {lessonPlan.extensions && lessonPlan.extensions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">Extended Activities</h4>
                    <ul className="space-y-2 ml-4">
                      {lessonPlan.extensions.map((item, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0" />
                          <span>{renderTextWithBold(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}