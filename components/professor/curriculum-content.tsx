"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { GraduationCap, Plus, Edit, Save, Target, Calendar, BookOpen, CheckCircle2 } from "lucide-react"
import { TooltipProvider } from "@/components/ui/tooltip"

const curriculumData = {
  courseInfo: {
    title: "Capstone Project 1",
    description: "Development of a research-based system proposal, including problem identification, literature review, and methodology planning.",
    credits: 3,
    semester: "1st Semester AY 2024–2025",
    prerequisites: "Research Methods, System Analysis and Design",
  },
  learningOutcomes: [
    "LO1: Identify and define a real-world problem suitable for capstone research",
    "LO2: Conduct a comprehensive literature review and related studies",
    "LO3: Formulate research questions, objectives, and scope",
    "LO4: Develop a system/project proposal with clear methodology",
  ],
  weeklyTopics: [
    { week: 1, topic: "Course Orientation and Capstone Overview", outcomes: ["LO1"], assessments: ["Introduction Draft"] },
    { week: 2, topic: "Identifying Real-World Problems", outcomes: ["LO1"], assessments: ["Problem Statement Exercise"] },
    { week: 3, topic: "Project Title and Objectives", outcomes: ["LO1", "LO3"], assessments: ["Title Defense"] },
    { week: 4, topic: "Review of Related Literature and Studies", outcomes: ["LO2"], assessments: ["Literature Review Submission"] },
    { week: 5, topic: "Defining Scope, Delimitation, and Significance", outcomes: ["LO3"], assessments: ["Scope and Limitations Draft"] },
    { week: 6, topic: "Methodology and System Design Overview", outcomes: ["LO4"], assessments: ["Methodology Outline"] },
    { week: 7, topic: "Consultation and Proposal Refinement", outcomes: ["LO1", "LO2", "LO3", "LO4"], assessments: ["Peer Review"] },
    { week: 8, topic: "Final Proposal Submission and Presentation", outcomes: ["LO4"], assessments: ["Final Proposal Defense"] },
  ],
}


export function CurriculumContent() {
  const [selectedClass, setSelectedClass] = useState("math101")
  const [editMode, setEditMode] = useState(false)

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              Curriculum Management
            </h1>
            <p className="text-muted-foreground">
              Design and manage your course curriculum, learning outcomes, and assessments
            </p>
          </div>
          <Button onClick={() => setEditMode(!editMode)}>
            {editMode ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            ) : (
              <>
                <Edit className="mr-2 h-4 w-4" />
                Edit Curriculum
              </>
            )}
          </Button>
        </div>

        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Course</CardTitle>
            <CardDescription>Choose which course curriculum to view and edit</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="math101">Capstone 1 - BSIT3B</SelectItem>
                <SelectItem value="physics201">Capstone 1 - BSIT3C</SelectItem>
                <SelectItem value="chem301">Networking - BSIT3A</SelectItem>
                <SelectItem value="bio401">Programming - BSIT1A</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Course Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Course Overview
            </CardTitle>
            <CardDescription>Basic information about your course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Course Title</label>
                {editMode ? (
                  <Input defaultValue={curriculumData.courseInfo.title} />
                ) : (
                  <p className="text-lg font-semibold">{curriculumData.courseInfo.title}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Credits</label>
                {editMode ? (
                  <Input type="number" defaultValue={curriculumData.courseInfo.credits} />
                ) : (
                  <p>{curriculumData.courseInfo.credits} Credits</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Course Description</label>
              {editMode ? (
                <Textarea defaultValue={curriculumData.courseInfo.description} />
              ) : (
                <p>{curriculumData.courseInfo.description}</p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Semester</label>
                {editMode ? (
                  <Input defaultValue={curriculumData.courseInfo.semester} />
                ) : (
                  <Badge variant="outline">{curriculumData.courseInfo.semester}</Badge>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Prerequisites</label>
                {editMode ? (
                  <Input defaultValue={curriculumData.courseInfo.prerequisites} />
                ) : (
                  <p className="text-sm">{curriculumData.courseInfo.prerequisites}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Outcomes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Learning Outcomes
            </CardTitle>
            <CardDescription>Define what students should achieve by the end of the course</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {curriculumData.learningOutcomes.map((outcome, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold mt-0.5">
                  {index + 1}
                </div>
                {editMode ? (
                  <Textarea defaultValue={outcome} className="flex-1" />
                ) : (
                  <p className="flex-1">{outcome}</p>
                )}
              </div>
            ))}
            {editMode && (
              <Button variant="outline" className="w-full bg-transparent">
                <Plus className="mr-2 h-4 w-4" />
                Add Learning Outcome
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Weekly Curriculum */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Curriculum Plan
            </CardTitle>
            <CardDescription>Detailed week-by-week breakdown of topics and assessments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Week</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Learning Outcomes</TableHead>
                    <TableHead>Assessments</TableHead>
                    {editMode && <TableHead className="w-[100px]">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {curriculumData.weeklyTopics.map((week) => (
                    <TableRow key={week.week}>
                      <TableCell className="font-medium">Week {week.week}</TableCell>
                      <TableCell>{editMode ? <Input defaultValue={week.topic} /> : week.topic}</TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {week.outcomes.map((outcome) => (
                            <Badge key={outcome} variant="secondary" className="text-xs">
                              {outcome}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1 flex-wrap">
                          {week.assessments.map((assessment) => (
                            <Badge key={assessment} variant="outline" className="text-xs">
                              {assessment}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      {editMode && (
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {editMode && (
              <div className="mt-4">
                <Button variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Week
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Curriculum Map */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Curriculum Alignment Map
            </CardTitle>
            <CardDescription>Visual representation of how assessments align with learning outcomes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {curriculumData.learningOutcomes.map((outcome, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="default">LO{index + 1}</Badge>
                    <p className="text-sm font-medium">{outcome}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-12">
                    <span className="text-sm text-muted-foreground">Assessed by:</span>
                    <div className="flex gap-1">
                      {/* Show which assessments align with this outcome */}
                      {curriculumData.weeklyTopics
                        .filter((week) => week.outcomes.includes(`LO${index + 1}`))
                        .flatMap((week) => week.assessments)
                        .map((assessment, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {assessment}
                          </Badge>
                        ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common curriculum management tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
                <BookOpen className="h-6 w-6" />
                <span>Export Syllabus</span>
                <span className="text-xs text-muted-foreground">Generate PDF syllabus</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
                <Calendar className="h-6 w-6" />
                <span>Schedule Builder</span>
                <span className="text-xs text-muted-foreground">Create class schedule</span>
              </Button>
              <Button variant="outline" className="h-auto p-4 flex-col gap-2 bg-transparent">
                <Target className="h-6 w-6" />
                <span>Assessment Planner</span>
                <span className="text-xs text-muted-foreground">Plan all assessments</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
