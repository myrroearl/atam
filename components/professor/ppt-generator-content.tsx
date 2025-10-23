"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Presentation, Download, Eye, Sparkles, Clock, Palette, FileText, ArrowLeft, AlertCircle, CheckCircle, RefreshCw, Calendar, ExternalLink } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface RecentPresentation {
  usage_id: number
  tool_type: string
  request_text: string
  generated_output: string
  success: boolean
  date_used: string
  created_at: string
}

export function PPTGeneratorContent() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPPT, setGeneratedPPT] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<string>("")
  const [recentPresentations, setRecentPresentations] = useState<RecentPresentation[]>([])
  const [loadingPresentations, setLoadingPresentations] = useState(true)
  const [formData, setFormData] = useState({
    topic: "",
    gradeLevel: "",
    style: "",
    slideCount: "10",
    additionalNotes: "",
  })

  // Fetch recent presentations
  const fetchRecentPresentations = async () => {
    try {
      setLoadingPresentations(true)
      const response = await fetch('/api/professor/ai-tools-usage?tool_type=ppt-generator&limit=10')
      const result = await response.json()
      
      if (response.ok) {
        setRecentPresentations(result.data || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent presentations:', error)
    } finally {
      setLoadingPresentations(false)
    }
  }

  // Load recent presentations on component mount
  useEffect(() => {
    fetchRecentPresentations()
  }, [])

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setCurrentStep("Initializing...");
    
    try {
      // Step 1: Get the appropriate template ID based on style
      setCurrentStep("Selecting template...");
      const templateId = getTemplateId(formData.style);
      
      // Step 2: Call Google Apps Script to create a copy and prepare slides
      setCurrentStep("Creating presentation from template...");
      const scriptResponse = await fetch('/api/professor/create-presentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          templateId,
          slideCount: Number.parseInt(formData.slideCount),
        }),
      });
      
      const responseData = await scriptResponse.json();
      console.log('Create presentation response:', responseData);
      
      // Check if the response contains an error
      if (responseData.error) {
        throw new Error(responseData.error || 'Failed to create presentation');
      }
      
      // Destructure the response data with default values to prevent errors
      const { 
        presentationId = '', 
        presentationUrl = '', 
        placeholders = [] 
      } = responseData;
      
      if (!presentationId) {
        throw new Error('Failed to create presentation: No presentation ID returned');
      }
      
      // Step 3: Generate content with Gemini AI
      setCurrentStep("Generating AI content...");
      const contentResponse = await fetch('/api/professor/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: formData.topic,
          placeholders,
          gradeLevel: formData.gradeLevel,
          style: formData.style,
          additionalNotes: formData.additionalNotes,
        }),
      });
      
      const contentJson = await contentResponse.json();
      console.log('Generate content response:', contentJson);
      
      if (contentJson.error) {
        throw new Error(`Content generation failed: ${contentJson.error}`);
      }
      
      // Step 4: Inject the content into the presentation
      setCurrentStep("Injecting content into slides...");
      const injectionResponse = await fetch('/api/professor/inject-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          presentationId,
          contentJson,
        }),
      });
      
      const injectionResult = await injectionResponse.json();
      console.log('Injection response:', injectionResult);
      
      // More detailed error checking for injection
      if (injectionResult.error) {
        throw new Error(`Content injection failed: ${injectionResult.error}`);
      }
      
      if (!injectionResult.success) {
        throw new Error(`Content injection failed: ${injectionResult.error || 'Unknown error during content injection'}`);
      }
      
      // Use the final URL from injection response, fallback to original URL
      const finalPresentationUrl = injectionResult.presentationUrl || presentationUrl;
      
      setCurrentStep("Presentation generated successfully!");
      
      // Set the generated PPT data for display
      setGeneratedPPT({
        title: formData.topic,
        slideCount: Number.parseInt(formData.slideCount),
        gradeLevel: formData.gradeLevel,
        style: formData.style,
        presentationUrl: finalPresentationUrl,
        presentationId: presentationId,
        slides: Array.from({ length: Number.parseInt(formData.slideCount) }, (_, i) => ({
          id: i + 1,
          title: `Slide ${i + 1}`,
        })),
      });

      // Save to AI tools usage table
      try {
        await fetch("/api/professor/ai-tools-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tool_type: "ppt-generator",
            request_text: `Topic: ${formData.topic}, Grade: ${formData.gradeLevel}, Style: ${formData.style}, Slides: ${formData.slideCount}${formData.additionalNotes ? `, Notes: ${formData.additionalNotes}` : ''}`,
            generated_output: finalPresentationUrl,
            success: true,
          }),
        })
      } catch (logError) {
        console.error("Failed to log AI tool usage:", logError)
        // Don't fail the main operation if logging fails
      }

      // Refresh recent presentations list
      fetchRecentPresentations()
      
    } catch (error) {
      console.error('Error generating presentation:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      setCurrentStep("Error occurred");

      // Log failed attempt
      try {
        await fetch("/api/professor/ai-tools-usage", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tool_type: "ppt-generator",
            request_text: `Topic: ${formData.topic}, Grade: ${formData.gradeLevel}, Style: ${formData.style}, Slides: ${formData.slideCount}`,
            generated_output: null,
            success: false,
          }),
        })
      } catch (logError) {
        console.error("Failed to log failed AI tool usage:", logError)
      }
    } finally {
      setIsGenerating(false);
      if (!error) {
        setTimeout(() => setCurrentStep(""), 3000); // Clear success message after 3 seconds
      }
    }
  };
  
  // Helper function to get template ID based on style
  const getTemplateId = (style: string) => {
    switch (style) {
      case "professional":
        return "19XHL8C0unjIqwCOEYpnu0a0mI_TCm3AAeP1AS4KI3Pg";
      case "minimal":
        return "171dBwmJuMEzM09rGj6gDpjgVA1_kqblrMuoUC0kPEaQ";
      case "creative":
        return "1ruWGZZihHjNYwRrHcbLgvq62vmljbcowqR3o37WRQ0o"; // Add your creative template ID
      case "academic":
        return "15PmRbvVnd_-gSJfagDxD8MTRBi80zC2qSLqKeRQxi18"; // Add your academic template ID
      case "interactive":
        return "1JFFImTzi92db7sKzOMvzIhzNV0SjzPEj2-NU0HWjgkI"; // Add your interactive template ID
      case "storytelling":
        return "1yb93dqKg53CRiRWIfKM4wlWmDPAtU1UwF7mIHlvDchU"; // Add your storytelling template ID
      default:
        return "19XHL8C0unjIqwCOEYpnu0a0mI_TCm3AAeP1AS4KI3Pg"; // Default to professional
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
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
              <Presentation className="h-8 w-8 text-blue-500" />
              PowerPoint Generator
            </h1>
            <p className="text-muted-foreground">Create engaging presentations with AI assistance</p>
          </div>
        </div>
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
          <Sparkles className="h-4 w-4 mr-1" />
          AI Powered
        </Badge>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Progress Alert */}
      {isGenerating && currentStep && (
        <Alert>
          <Clock className="h-4 w-4 animate-spin" />
          <AlertDescription>
            {currentStep}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Alert */}
      {!isGenerating && currentStep && !error && (
        <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            {currentStep}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Presentation Details
            </CardTitle>
            <CardDescription>Fill in the details to generate your custom presentation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="topic">Topic/Subject</Label>
              <Input
                id="topic"
                placeholder="e.g., Introduction to Photosynthesis"
                value={formData.topic}
                onChange={(e) => handleInputChange("topic", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Grade Level</Label>
                <Select value={formData.gradeLevel} onValueChange={(value) => handleInputChange("gradeLevel", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select grade level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="elementary">1st Year</SelectItem>
                    <SelectItem value="middle">2nd Year</SelectItem>
                    <SelectItem value="high">3rd Year</SelectItem>
                    <SelectItem value="college">4th Year</SelectItem>
                    <SelectItem value="adult">Adult Education</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slideCount">Number of Slides</Label>
                <Select value={formData.slideCount} onValueChange={(value) => handleInputChange("slideCount", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select slide count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 slides</SelectItem>
                    <SelectItem value="10">10 slides</SelectItem>
                    <SelectItem value="15">15 slides</SelectItem>
                    <SelectItem value="20">20 slides</SelectItem>
                    <SelectItem value="25">25 slides</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="style">Presentation Style</Label>
              <Select value={formData.style} onValueChange={(value) => handleInputChange("style", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select presentation style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="creative">Creative & Colorful</SelectItem>
                  <SelectItem value="minimal">Minimal & Clean</SelectItem>
                  <SelectItem value="academic">Academic</SelectItem>
                  <SelectItem value="interactive">Interactive</SelectItem>
                  <SelectItem value="storytelling">Storytelling</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additionalNotes">Additional Notes (Optional)</Label>
              <Textarea
                id="additionalNotes"
                placeholder="Any specific requirements, key points to include, or special instructions..."
                value={formData.additionalNotes}
                onChange={(e) => handleInputChange("additionalNotes", e.target.value)}
                rows={3}
              />
            </div>

            <Button
              onClick={handleGenerate}
              disabled={!formData.topic || !formData.gradeLevel || !formData.style || isGenerating}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Generating Presentation...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Presentation
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-sm">Be Specific</p>
                  <p className="text-xs text-muted-foreground">Include specific topics or subtopics you want covered</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-sm">Consider Your Audience</p>
                  <p className="text-xs text-muted-foreground">Choose the appropriate grade level and style</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <p className="font-medium text-sm">Add Context</p>
                  <p className="text-xs text-muted-foreground">Use additional notes for special requirements</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Style Examples
              </h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <strong>Professional:</strong> Clean, business-ready layouts
                </p>
                <p>
                  <strong>Creative:</strong> Colorful, engaging visuals
                </p>
                <p>
                  <strong>Academic:</strong> Research-focused, citation-ready
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {generatedPPT && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Presentation className="w-5 h-5" />
              Generated Presentation: {generatedPPT.title}
            </CardTitle>
            <CardDescription>
              {generatedPPT.slideCount} slides • {generatedPPT.gradeLevel} level • {generatedPPT.style} style
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button size="sm" onClick={() => window.open(generatedPPT.presentationUrl, '_blank')}>
                  <Download className="w-4 h-4 mr-2" />
                  Download PPTX
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.open(generatedPPT.presentationUrl, '_blank')}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>

              {/* Debug info - remove in production */}
              <div className="text-xs text-muted-foreground">
                <p>Presentation ID: {generatedPPT.presentationId}</p>
              </div>

              
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Generated Presentations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold tracking-tight">Recent Generated Presentations</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchRecentPresentations}
              disabled={loadingPresentations}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loadingPresentations ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Badge variant="outline" className="text-sm">
              {recentPresentations.length} presentations
            </Badge>
          </div>
        </div>
        
        <Card>
          <CardContent className="p-0">
            {loadingPresentations ? (
              <div className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">Loading recent presentations...</p>
              </div>
            ) : recentPresentations.length > 0 ? (
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
                  {recentPresentations.map((presentation) => (
                    <TableRow key={presentation.usage_id}>
                      <TableCell className="max-w-xs">
                        <p className="truncate text-sm">
                          {presentation.request_text || 'No request text'}
                        </p>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {presentation.generated_output ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(presentation.generated_output, '_blank')}
                            className="h-8 text-xs"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Open Presentation
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">No output</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={presentation.success ? "default" : "destructive"} className="text-xs">
                          {presentation.success ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Success</>
                          ) : (
                            <><AlertCircle className="h-3 w-3 mr-1" /> Failed</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(presentation.date_used).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {presentation.generated_output && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(presentation.generated_output, '_blank')}
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
                <Presentation className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Presentations Generated Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Your generated presentations will appear here. Start by creating your first presentation above.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}