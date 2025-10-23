"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { BookOpen, Sparkles, ArrowLeft, Target, Clock, Users, CheckSquare, Download, Eye, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"

interface LessonPlan {
  title: string;
  gradeLevel: string;
  duration: string;
  subject: string;
  objectives: string[];
  materials: string[];
  activities: Array<{
    phase: string;
    type: string;
    description: string;
  }>;
  assessment: string[];
}

export function LessonPlannerContent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    gradeLevel: '',
    subject: '',
    duration: '',
    classSize: '',
    learningGoal: '',
    topic: '',
    customRequirements: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
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
                      <SelectItem value="Data Structure and Algorithm">Data Structure and Algorithm</SelectItem>
                      <SelectItem value="Computer Programming 2">Computer Programming 2</SelectItem>
                      <SelectItem value="Consumer's Behavior">Consumer's Behavior</SelectItem>
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
                <Label>Teaching Style Preferences</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Hands-on Activities</Badge>
                  <Badge variant="secondary">Group Work</Badge>
                  <Badge variant="secondary">Technology Integration</Badge>
                  <Badge variant="outline">Lecture-based</Badge>
                  <Badge variant="outline">Project-based</Badge>
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
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button size="sm">
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
                  <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-lg border">
                    <h3 className="text-xl font-bold mb-2">{lessonPlan.title}</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        <span>{lessonPlan.gradeLevel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{lessonPlan.duration}</span>
                      </div>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Learning Objectives
                    </h4>
                    <ul className="space-y-2">
                      {lessonPlan.objectives.map((objective, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <CheckSquare className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span>{objective}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Materials */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Materials Needed</h4>
                    <div className="flex flex-wrap gap-2">
                      {lessonPlan.materials.map((material, index) => (
                        <Badge key={index} variant="outline">
                          {material}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Activities */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Lesson Activities</h4>
                    <div className="space-y-4">
                      {lessonPlan.activities.map((activity, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium">{activity.phase}</h5>
                            <Badge variant="secondary">{activity.type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{activity.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Assessment */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Assessment Strategies</h4>
                    <ul className="space-y-2">
                      {lessonPlan.assessment.map((item, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}