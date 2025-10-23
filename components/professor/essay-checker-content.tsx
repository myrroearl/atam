"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PenTool, Upload, Sparkles, ArrowLeft, CheckCircle, AlertTriangle, Info, Clock } from "lucide-react"
import Link from "next/link"

export function EssayCheckerContent() {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [essayText, setEssayText] = useState("")

  const handleAnalyze = async () => {
    setIsAnalyzing(true)
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 3000))
    setIsAnalyzing(false)
    setShowResults(true)
  }

  const analysisResults = {
    overallScore: 85,
    grammar: {
      score: 92,
      issues: 3,
      suggestions: [
        { type: "Grammar", text: "Consider using 'who' instead of 'that' when referring to people", line: 5 },
        { type: "Punctuation", text: "Missing comma after introductory phrase", line: 12 },
        { type: "Word Choice", text: "Consider using 'significant' instead of 'big'", line: 18 },
      ],
    },
    structure: {
      score: 78,
      feedback: [
        { type: "Positive", text: "Clear thesis statement in introduction" },
        { type: "Improvement", text: "Body paragraphs could benefit from stronger topic sentences" },
        { type: "Improvement", text: "Conclusion should better summarize main arguments" },
      ],
    },
    coherence: {
      score: 88,
      feedback: "Good use of transitional phrases. Ideas flow logically from one paragraph to the next.",
    },
    plagiarism: {
      score: 98,
      status: "Original content detected",
    },
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
              <PenTool className="h-8 w-8 text-green-500" />
              AI Essay Checker
            </h1>
            <p className="text-muted-foreground">Analyze essays for grammar, structure, and coherence automatically</p>
          </div>
        </div>
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Powered
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Essay Input</CardTitle>
              <CardDescription>Paste your essay text or upload a document for analysis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Text Area */}
              <div className="space-y-2">
                <Textarea
                  placeholder="Paste your essay here for analysis..."
                  className="min-h-[300px] resize-none"
                  value={essayText}
                  onChange={(e) => setEssayText(e.target.value)}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{essayText.length} characters</span>
                  <span>{essayText.split(/\s+/).filter((word) => word.length > 0).length} words</span>
                </div>
              </div>

              {/* File Upload Alternative */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 text-center space-y-2">
                <Upload className="h-6 w-6 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Upload Document</p>
                  <p className="text-xs text-muted-foreground">DOCX or TXT files supported</p>
                </div>
                <Button variant="outline" size="sm">
                  Choose File
                </Button>
              </div>

              {/* Analysis Options */}
              <div className="space-y-3">
                <h4 className="font-medium">Analysis Options</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Grammar Check</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Structure Analysis</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Coherence Check</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 border rounded">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Plagiarism Scan</span>
                  </div>
                </div>
              </div>

              <Button onClick={handleAnalyze} disabled={isAnalyzing || !essayText.trim()} className="w-full" size="lg">
                {isAnalyzing ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Essay...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Analyze Essay
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analysis Report</CardTitle>
              <CardDescription>AI-powered feedback and suggestions for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              {!showResults ? (
                <div className="text-center py-12 text-muted-foreground">
                  <PenTool className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Your analysis report will appear here</p>
                  <p className="text-sm">Enter your essay text and click analyze to start</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Overall Score */}
                  <div className="text-center p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 rounded-lg">
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                      {analysisResults.overallScore}%
                    </div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>

                  {/* Detailed Analysis */}
                  <Tabs defaultValue="grammar" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="grammar">Grammar</TabsTrigger>
                      <TabsTrigger value="structure">Structure</TabsTrigger>
                      <TabsTrigger value="coherence">Coherence</TabsTrigger>
                      <TabsTrigger value="plagiarism">Plagiarism</TabsTrigger>
                    </TabsList>

                    <TabsContent value="grammar" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Grammar Analysis</h4>
                        <Badge variant="secondary">{analysisResults.grammar.score}%</Badge>
                      </div>
                      <Progress value={analysisResults.grammar.score} className="h-2" />

                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Found {analysisResults.grammar.issues} issues that need attention:
                        </p>
                        {analysisResults.grammar.suggestions.map((suggestion, index) => (
                          <div key={index} className="flex gap-3 p-3 border rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {suggestion.type}
                                </Badge>
                                <span className="text-xs text-muted-foreground">Line {suggestion.line}</span>
                              </div>
                              <p className="text-sm">{suggestion.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="structure" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Structure Analysis</h4>
                        <Badge variant="secondary">{analysisResults.structure.score}%</Badge>
                      </div>
                      <Progress value={analysisResults.structure.score} className="h-2" />

                      <div className="space-y-3">
                        {analysisResults.structure.feedback.map((item, index) => (
                          <div key={index} className="flex gap-3 p-3 border rounded-lg">
                            {item.type === "Positive" ? (
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            ) : (
                              <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            )}
                            <div>
                              <Badge
                                variant={item.type === "Positive" ? "default" : "secondary"}
                                className="text-xs mb-2"
                              >
                                {item.type}
                              </Badge>
                              <p className="text-sm">{item.text}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="coherence" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Coherence Analysis</h4>
                        <Badge variant="secondary">{analysisResults.coherence.score}%</Badge>
                      </div>
                      <Progress value={analysisResults.coherence.score} className="h-2" />

                      <div className="p-3 border rounded-lg">
                        <div className="flex gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <p className="text-sm">{analysisResults.coherence.feedback}</p>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="plagiarism" className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Plagiarism Check</h4>
                        <Badge variant="secondary">{analysisResults.plagiarism.score}%</Badge>
                      </div>
                      <Progress value={analysisResults.plagiarism.score} className="h-2" />

                      <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <div className="flex gap-3">
                          <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-green-800 dark:text-green-200">
                              {analysisResults.plagiarism.status}
                            </p>
                            <p className="text-xs text-green-600 dark:text-green-400">
                              No significant plagiarism detected
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
