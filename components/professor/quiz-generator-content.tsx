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
import { FileText, Upload, Sparkles, Download, Eye, ArrowLeft, CheckCircle, Clock, FileUp, MessageSquare, AlertCircle, ExternalLink, RefreshCw, Calendar, Trash2 } from "lucide-react"
import Link from "next/link"

interface RecentQuiz {
  usage_id: number
  tool_type: string
  request_text: string
  generated_output: string
  success: boolean
  date_used: string
  created_at: string
}

export function QuizGeneratorContent() {
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("file-upload")
  const [prompt, setPrompt] = useState("")
  const [numQuestions, setNumQuestions] = useState("10")
  const [difficulty, setDifficulty] = useState("mixed")
  const [error, setError] = useState<string | null>(null)
  const [generatedQuestions, setGeneratedQuestions] = useState([])
  const [googleFormLink, setGoogleFormLink] = useState<string | null>(null)
  const [recentQuizzes, setRecentQuizzes] = useState<RecentQuiz[]>([])
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)

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

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)
      setError(null)
      setGoogleFormLink(null)
      
      // Validate inputs
      if (activeTab === "custom-prompt" && !prompt.trim()) {
        throw new Error("Please enter a prompt for your quiz")
      }
      
      if (activeTab === "file-upload" && !uploadedFile) {
        throw new Error("Please upload a file first")
      }
      
      // For file upload, we would need to extract text from the file
      // This is a simplified version that just uses the filename as the prompt
      const finalPrompt = activeTab === "custom-prompt" 
        ? prompt 
        : `Generate questions based on ${uploadedFile} content about biology`
      
      // Map the UI difficulty to API values
      const apiDifficulty = difficulty === "mixed" ? "medium" : difficulty
      
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
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to generate quiz")
      }
      
      const data = await response.json()
      
      // Store the Google Form link and questions
      setGoogleFormLink(data.editLink)
      
      // Save to AI tools usage table
      try {
        await fetch("/api/professor/ai-tools-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tool_type: "quiz-generator",
            request_text: finalPrompt,
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
            request_text: activeTab === "custom-prompt" ? prompt : `File: ${uploadedFile}`,
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
                      <Button variant="outline" size="sm" onClick={() => setUploadedFile("biology-chapter-5.pdf")}>
                        Choose Files
                      </Button>
                      {uploadedFile && (
                        <div className="flex items-center justify-center gap-2 mt-2 p-2 bg-green-50 dark:bg-green-950/20 rounded">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-700 dark:text-green-300">{uploadedFile}</span>
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
                <Label>Question Types</Label>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">Multiple Choice</Badge>
                  <Badge variant="secondary">True/False</Badge>
                  <Badge variant="secondary">Short Answer</Badge>
                  <Badge variant="outline">Fill in the Blank</Badge>
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
                {showPreview && (
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
