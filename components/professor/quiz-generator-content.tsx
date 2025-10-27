"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { FileText, Upload, Sparkles, Download, Eye, ArrowLeft, CheckCircle, Clock, FileUp, MessageSquare, AlertCircle, ExternalLink, RefreshCw, Calendar, Trash2 } from "lucide-react"
import Link from "next/link"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, TableRow as DocxTableRow, TableCell as DocxTableCell, WidthType, SectionType } from "docx"
import { saveAs } from "file-saver"

interface RecentQuiz {
  usage_id: number
  tool_type: string
  request_text: string
  generated_output: string
  success: boolean
  date_used: string
  created_at: string
}

type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "fill_blank" | "identification"

export function QuizGeneratorContent() {
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [uploadedFileName, setUploadedFileName] = useState<string>("")
  const [extractedText, setExtractedText] = useState<string>("")
  const [isExtracting, setIsExtracting] = useState(false)
  const [activeTab, setActiveTab] = useState("file-upload")
  const [prompt, setPrompt] = useState("")
  const [numQuestions, setNumQuestions] = useState("10")
  const [difficulty, setDifficulty] = useState("mixed")
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(["multiple_choice", "true_false", "short_answer"])
  const [error, setError] = useState<string | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [googleFormLink, setGoogleFormLink] = useState<string | null>(null)
  const [quizData, setQuizData] = useState<any>(null) // Store full quiz data for download
  const [numSets, setNumSets] = useState(1) // Number of quiz sets to generate
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("Generating your quiz...")

  // Fetch recent quizzes
  const fetchRecentQuizzes = async () => {
    try {
      setLoadingQuizzes(true)
      const response = await fetch('/api/professor/ai-tools-usage?tool_type=quiz-generator&limit=10')
      const result = await response.json()
      
      if (response.ok) {
        setRecentQuizzes(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent quizzes:', error)
    } finally {
      setLoadingQuizzes(false)
    }
  }

  // Load recent quizzes on component mount
  useEffect(() => {
    fetchRecentQuizzes()
  }, [])

  // Handle question type changes
  const handleQuestionTypeChange = (type: QuestionType) => {
    setQuestionTypes(prev => {
      if (prev.includes(type)) {
        // Prevent removing the last type
        if (prev.length === 1) return prev
        return prev.filter(t => t !== type)
      }
      return [...prev, type]
    })
  }

  // Handle file upload and text extraction
  const handleFileUpload = async (file: File) => {
    try {
      setIsExtracting(true)
      setError(null)
      
      // Validate file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'docx', 'txt'].includes(fileExtension || '')) {
        throw new Error('Please upload a PDF, DOCX, or TXT file')
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }
      
      // Upload file and extract text
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/professor/extract-file-text', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to extract text from file')
      }
      
      const data = await response.json()
      
      // Store the extracted text
      setUploadedFile(file)
      setUploadedFileName(file.name)
      setExtractedText(data.text)
      
    } catch (err: any) {
      setError(err.message)
      setUploadedFile(null)
      setUploadedFileName("")
      setExtractedText("")
    } finally {
      setIsExtracting(false)
    }
  }

  // Helper function to shuffle array
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  // Function to convert quiz data to .docx with multiple sets
  const generateQuizDocx = async (title: string, questions: any[], numSets: number = 1) => {
    try {
      // Create header paragraph
      const headerParagraph = new Paragraph({
        children: [
          new TextRun({
            text: title,
            bold: true,
            size: 32,
          }),
        ],
        heading: HeadingLevel.TITLE,
        spacing: { after: 400 },
        alignment: AlignmentType.CENTER,
      })

      // Create student info section
      const studentInfo = new Paragraph({
        children: [
          new TextRun({
            text: "Name: ___________________________    Date: ___________",
            size: 22,
          }),
        ],
        spacing: { after: 300 },
      })

      const instructions = new Paragraph({
        children: [
          new TextRun({
            text: "Instructions: Read each question carefully and provide your answer in the space provided. Good luck!",
            italics: true,
            size: 22,
          }),
        ],
        spacing: { after: 600 },
      })

      // Generate multiple sets of quizzes
      const allQuestionSets: Paragraph[] = []
      const allAnswerSets: Paragraph[] = []
      
      // Group questions by type for shuffling within each type
      const groupedByType = questions.reduce((acc: any, question: any) => {
        const type = question.type
        if (!acc[type]) {
          acc[type] = []
        }
        acc[type].push(question)
        return acc
      }, {})

      // Type labels mapping
      const typeLabels: { [key: string]: string } = {
        'multiple_choice': 'Multiple Choice',
        'true_false': 'True or False',
        'short_answer': 'Short Answer',
        'identification': 'Identification',
        'fill_blank': 'Fill in the Blank'
      }

      // Generate each quiz return
      for (let setIndex = 0; setIndex < numSets; setIndex++) {
        const setLabel = String.fromCharCode(65 + setIndex) // A, B, C, etc.
        
        // Shuffle questions within each type for variety
        const shuffledGrouped = Object.entries(groupedByType).reduce((acc, [type, typeQuestions]) => {
          acc[type] = shuffleArray(typeQuestions as any[])
          return acc
        }, {} as any)

        // Create questions grouped by type
        const questionParagraphs: Paragraph[] = []
        
        // Add set header if multiple sets
        if (numSets > 1) {
          const setHeader = new Paragraph({
            children: [
              new TextRun({
                text: `Set ${setLabel}`,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { before: 600, after: 300 },
            alignment: AlignmentType.CENTER,
          })
          questionParagraphs.push(setHeader)
        }
        
        Object.entries(shuffledGrouped).forEach(([type, typeQuestions]) => {
          const questions = typeQuestions as any[]
          // Add section header for question type
          const sectionHeader = new Paragraph({
            children: [
              new TextRun({
                text: typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
                bold: true,
                size: 26,
              }),
            ],
            spacing: { before: 400, after: 300 },
          })
          questionParagraphs.push(sectionHeader)

          // Add questions of this type
          questions.forEach((question: any, index: number) => {
            const questionNumber = new Paragraph({
              children: [
                new TextRun({
                  text: `${index + 1}. `,
                  bold: true,
                  size: 24,
                }),
                new TextRun({
                  text: question.question,
                  size: 24,
                }),
              ],
              spacing: { after: 200 },
            })
            
            questionParagraphs.push(questionNumber)

            // Handle different question types
            if (question.type === 'multiple_choice' && question.choices) {
              question.choices.forEach((choice: string) => {
                const choicePara = new Paragraph({
                  children: [
                    new TextRun({
                      text: `   ${choice}`,
                      size: 22,
                    }),
                  ],
                  spacing: { after: 100 },
                  indent: { left: 400 },
                })
                questionParagraphs.push(choicePara)
              })
            }

            // Add space between questions
            const spacing = new Paragraph({
              text: "",
              spacing: { after: 300 },
            })
            questionParagraphs.push(spacing)
          })
        })
        
        // Add the questions for this set
        allQuestionSets.push(...questionParagraphs)
        
        // Add page break between sets (except for last set)
        if (setIndex < numSets - 1) {
          const pageBreak = new Paragraph({
            text: "",
            spacing: { before: 0, after: 0 },
            pageBreakBefore: true,
          })
          allQuestionSets.push(pageBreak)
        }
    }

    // Create answers section on a new page
    const answersHeader = new Paragraph({
      children: [
        new TextRun({
          text: "ANSWER KEY",
          bold: true,
          size: 32,
        }),
      ],
      heading: HeadingLevel.TITLE,
      spacing: { after: 400, before: 400 },
      alignment: AlignmentType.CENTER,
      pageBreakBefore: true,
    })

    const answersSubtitle = new Paragraph({
      children: [
        new TextRun({
          text: title,
          bold: true,
          italics: true,
          size: 22,
        }),
      ],
      spacing: { after: 400 },
      alignment: AlignmentType.CENTER,
    })

    // Generate answer keys for each set
    for (let setIndex = 0; setIndex < numSets; setIndex++) {
        const setLabel = String.fromCharCode(65 + setIndex) // A, B, C, etc.
        
        // Add set header for answers if multiple sets
        if (numSets > 1) {
          const setAnswerHeader = new Paragraph({
            children: [
              new TextRun({
                text: `Set ${setLabel} - Answer Key`,
                bold: true,
                size: 28,
              }),
            ],
            spacing: { before: 400, after: 300 },
            alignment: AlignmentType.CENTER,
          })
          allAnswerSets.push(setAnswerHeader)
        }
        
        // Shuffle the same way as the questions for consistency
        const shuffledGrouped = Object.entries(groupedByType).reduce((acc, [type, typeQuestions]) => {
          acc[type] = shuffleArray(typeQuestions as any[])
          return acc
        }, {} as any)
        
        // Create answer paragraphs grouped by type
        Object.entries(shuffledGrouped).forEach(([type, typeQuestions]) => {
          const questions = typeQuestions as any[]
          // Add section header for answer type
          const sectionHeader = new Paragraph({
            children: [
              new TextRun({
                text: typeLabels[type] || type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' '),
                bold: true,
                size: 26,
              }),
            ],
            spacing: { before: 400, after: 300 },
          })
          allAnswerSets.push(sectionHeader)

          // Add answers of this type
          questions.forEach((question: any, index: number) => {
          let answerText = ""
          
          if (question.type === 'multiple_choice') {
            answerText = `Answer: ${question.answer}`
          } else if (question.type === 'true_false') {
            answerText = `Answer: ${question.answer}`
          } else if (question.type === 'short_answer') {
            answerText = `Answer: ${question.answer}`
          } else if (question.type === 'identification') {
            answerText = `Answer: ${question.answer}`
          } else if (question.type === 'fill_blank') {
            answerText = `Answer: ${question.answer}`
          }

          const answerPara = new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. ${answerText}`,
                bold: true,
                size: 22,
              }),
            ],
            spacing: { after: 200 },
          })
          allAnswerSets.push(answerPara)
        })
      })
        
      // Add space between answer sets
      if (setIndex < numSets - 1) {
        const spacing = new Paragraph({
          text: "",
          spacing: { before: 300, after: 300 },
        })
        allAnswerSets.push(spacing)
      }
    }

    // Create the document
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            headerParagraph,
            studentInfo,
            instructions,
            ...allQuestionSets,
            answersHeader,
            answersSubtitle,
            ...allAnswerSets,
          ],
        },
      ],
    })

    // Generate and download the document
    const blob = await Packer.toBlob(doc)
    const fileName = title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_quiz.docx'
    saveAs(blob, fileName)
  } catch (error) {
    console.error('Error generating DOCX:', error)
    throw new Error('Failed to generate document')
  }
}

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setGoogleFormLink(null)
      setLoadingMessage("Analyzing your request...")
      
      // Validate inputs
      if (activeTab === "custom-prompt" && !prompt.trim()) {
        throw new Error("Please enter a prompt for your quiz")
      }
      
      if (activeTab === "file-upload") {
        if (!uploadedFile) {
          throw new Error("Please upload a file first")
        }
        if (!extractedText) {
          throw new Error("File text extraction failed. Please re-upload the file.")
        }
      }
      
      // Validate at least one question type is selected
      if (questionTypes.length === 0) {
        throw new Error("Please select at least one question type")
      }
      
      // Build the prompt based on the selected tab
      let finalPrompt = ''
      if (activeTab === "custom-prompt") {
        finalPrompt = prompt
      } else {
        // Use extracted text from the file
        finalPrompt = `Generate quiz questions based on the following content:\n\n${extractedText}\n\nCreate questions that assess understanding of the key concepts in this content.`
      }
      
      // Map the UI difficulty to API values
      const apiDifficulty = difficulty === "mixed" ? "medium" : difficulty
      
      setLoadingMessage("Generating quiz questions with AI...")
      
      // Call our API
      const response = await fetch("/api/professor/create-quiz", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: finalPrompt,
          numQuestions: parseInt(numQuestions),
          difficulty: apiDifficulty,
          questionTypes: questionTypes,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate quiz")
      }
      
      const data = await response.json()
      
      setLoadingMessage("Creating Google Form...")
      
      // Store the Google Form link and questions
      setGoogleFormLink(data.editLink)
      
      // Store quiz data for download with shortened title
      setQuizData({
        title: data.quizTitle || finalPrompt.substring(0, 50),
        questions: data.questions,
        difficulty: apiDifficulty,
        numQuestions: parseInt(numQuestions)
      })
      
      setLoadingMessage("Finalizing your quiz...")
      
      // Save to AI tools usage table
      try {
        await fetch("/api/professor/ai-tools-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tool_type: "quiz-generator",
            request_text: activeTab === "file-upload" ? `File: ${uploadedFileName}` : finalPrompt,
            generated_output: data.editLink || "Quiz generated successfully",
            success: true,
          }),
        })
      } catch (logError) {
        console.error("Failed to log AI tool usage:", logError)
        // Don't fail the main operation if logging fails
      }
      
      setShowPreview(true)
      
      // Refresh recent quizzes list
      fetchRecentQuizzes()
    } catch (err: any) {
      setError(err.message)
      console.error("Error generating quiz:", err)
      
      // Log failed attempt
      try {
        await fetch("/api/professor/ai-tools-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tool_type: "quiz-generator",
            request_text: activeTab === "custom-prompt" ? prompt : `File: ${uploadedFileName || 'Uploaded file'}`,
            generated_output: null,
            success: false,
          }),
        })
      } catch (logError) {
        console.error("Failed to log failed AI tool usage:", logError)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  

  return (
    <div className="space-y-6">
      {/* Loading Modal */}
      <Dialog open={isGenerating}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 animate-pulse text-blue-500" />
              Generating Quiz
            </DialogTitle>
            <DialogDescription>
              Please wait while we create your quiz. This may take a few moments.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
            </div>
            <p className="text-sm font-medium text-center animate-pulse">
              {loadingMessage}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              <FileText className="h-8 w-8 text-blue-500" />
              AI Quiz Generator
            </h1>
            <p className="text-muted-foreground">Create custom quizzes from your course materials automatically</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Quiz Configuration</CardTitle>
              <CardDescription>Set up your quiz parameters and source material</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs defaultValue="file-upload" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file-upload" className="flex items-center gap-2">
                    <FileUp className="h-4 w-4" />
                    Upload File
                  </TabsTrigger>
                  <TabsTrigger value="custom-prompt" className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Custom Prompt
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="file-upload" className="space-y-4 pt-4">
                  {/* File Upload */}
                  <div className="space-y-2">
                    <Label>Course Material</Label>
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Upload your course materials</p>
                        <p className="text-xs text-muted-foreground">PDF, TXT, or DOCX files supported</p>
                      </div>
                      <div className="space-y-2">
                        <input
                          type="file"
                          accept=".pdf,.docx,.txt"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) {
                              handleFileUpload(file)
                            }
                          }}
                          className="hidden"
                          id="file-upload"
                          disabled={isExtracting}
                        />
                        <label htmlFor="file-upload">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            asChild
                            disabled={isExtracting}
                          >
                            <span>
                              {isExtracting ? (
                                <>
                                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                                  Extracting...
                                </>
                              ) : (
                                <>
                                  <Upload className="mr-2 h-4 w-4" />
                                  Choose Files
                                </>
                              )}
                            </span>
                          </Button>
                        </label>
                      </div>
                      {uploadedFileName && (
                        <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300">{uploadedFileName}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setUploadedFile(null)
                              setUploadedFileName("")
                              setExtractedText("")
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="custom-prompt" className="space-y-4 pt-4">
                  {/* Custom Prompt */}
                  <div className="space-y-2">
                    <Label htmlFor="prompt">Custom Prompt</Label>
                    <Textarea
                      id="prompt"
                      placeholder="Enter a detailed prompt for generating quiz questions. For example: 'Create a quiz about photosynthesis focusing on the light-dependent reactions and electron transport chain.'"
                      className="min-h-[120px]"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Be specific about the topic, difficulty level, and types of questions you want to generate.
                    </p>
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />

              {/* Quiz Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Number of Questions</Label>
                  <Select value={numQuestions} onValueChange={setNumQuestions}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 Questions</SelectItem>
                      <SelectItem value="10">10 Questions</SelectItem>
                      <SelectItem value="15">15 Questions</SelectItem>
                      <SelectItem value="20">20 Questions</SelectItem>
                      <SelectItem value="25">25 Questions</SelectItem>
                      <SelectItem value="50">50 Questions</SelectItem>
                      <SelectItem value="80">80 Questions</SelectItem>
                      <SelectItem value="100">100 Questions</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Difficulty Level</Label>
                  <Select value={difficulty} onValueChange={setDifficulty}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                      <SelectItem value="mixed">Mixed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Number of Sets (for DOCX download)</Label>
                <Select value={numSets.toString()} onValueChange={(value) => setNumSets(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Set</SelectItem>
                    <SelectItem value="2">2 Sets</SelectItem>
                    <SelectItem value="3">3 Sets</SelectItem>
                    <SelectItem value="4">4 Sets</SelectItem>
                    <SelectItem value="5">5 Sets</SelectItem>
                  </SelectContent>
                </Select>
                {numSets > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Each set will have a different order of questions for variety
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Question Types</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="multiple_choice" 
                      checked={questionTypes.includes("multiple_choice")}
                      onCheckedChange={() => handleQuestionTypeChange("multiple_choice")}
                    />
                    <label
                      htmlFor="multiple_choice"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Multiple Choice
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="true_false" 
                      checked={questionTypes.includes("true_false")}
                      onCheckedChange={() => handleQuestionTypeChange("true_false")}
                    />
                    <label
                      htmlFor="true_false"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      True/False
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="short_answer" 
                      checked={questionTypes.includes("short_answer")}
                      onCheckedChange={() => handleQuestionTypeChange("short_answer")}
                    />
                    <label
                      htmlFor="short_answer"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Short Answer
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="identification" 
                      checked={questionTypes.includes("identification")}
                      onCheckedChange={() => handleQuestionTypeChange("identification")}
                    />
                    <label
                      htmlFor="identification"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Identification
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="fill_blank" 
                      checked={questionTypes.includes("fill_blank")}
                      onCheckedChange={() => handleQuestionTypeChange("fill_blank")}
                    />
                    <label
                      htmlFor="fill_blank"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      Fill in the Blank
                    </label>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-start gap-2 text-red-800 dark:text-red-200">
                  <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{error}</p>
                </div>
              )}

              <Button onClick={handleGenerate} disabled={isGenerating} className="w-full" size="lg">
                {isGenerating ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Generating Quiz...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Quiz
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
                  <CardTitle>Quiz Preview</CardTitle>
                  <CardDescription>Sample output from your generated quiz</CardDescription>
                </div>
                {/* {showPreview && (
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
                )} */}
              </div>
            </CardHeader>
            <CardContent>
              {!showPreview ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your generated quiz will appear here</p>
                  <p className="text-sm">Configure your settings and click generate to start</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-800 dark:text-green-200">
                        Quiz Generated Successfully!
                      </span>
                    </div>
                    <Badge variant="secondary">{numQuestions} Questions</Badge>
                  </div>
                  
                  {googleFormLink && (
                    <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Google Form Created</h4>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-blue-700 dark:text-blue-300">Your quiz is ready to share</p>
                        <a 
                          href={googleFormLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Open Form <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Download Options */}
                  {quizData && (
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                      <h4 className="font-medium text-purple-800 dark:text-purple-200 mb-2">Download Options</h4>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mb-3">
                        Download your quiz as a professional .docx document
                      </p>
                      <Button 
                        onClick={() => generateQuizDocx(quizData.title, quizData.questions, numSets)}
                        className="w-full"
                        variant="outline"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Quiz as DOCX ({numSets} Set{numSets > 1 ? 's' : ''})
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {numSets > 1 
                          ? `Includes ${numSets} sets with different question orders and answer keys`
                          : 'Includes all questions and answer key on separate pages'}
                      </p>
                    </div>
                  )}
                  
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Recent Generated Quizzes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent Generated Quizzes</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRecentQuizzes}
              disabled={loadingQuizzes}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingQuizzes ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="text-sm">
              {recentQuizzes.length} quizzes
            </Badge>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {loadingQuizzes ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading recent quizzes...</p>
              </div>
            ) : recentQuizzes.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Request</TableHead>
                    <TableHead>Generated Output</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentQuizzes.map((quiz) => (
                    <TableRow key={quiz.usage_id}>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm">
                          {quiz.request_text || 'No request text'}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {quiz.generated_output ? (
                          <div className="flex items-center gap-2">
                            <a 
                              href={quiz.generated_output} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Open Quiz
                            </a>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground">No output</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={quiz.success ? "default" : "destructive"} className="text-xs">
                          {quiz.success ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Success</>
                          ) : (
                            <><AlertCircle className="h-3 w-3 mr-1" /> Failed</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(quiz.date_used).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {quiz.generated_output && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(quiz.generated_output, '_blank')}
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="p-6 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Quizzes Generated Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your generated quizzes will appear here. Start by creating your first quiz above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
