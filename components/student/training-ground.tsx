"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import {
  Brain,
  BookOpen,
  ExternalLink,
  TrendingUp,
  AlertCircle,
  Star,
  Clock,
  User,
  Bookmark,
  Eye,
  Search,
  Filter,
  X,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  FileText,
  Upload,
  Sparkles,
  Download,
  Loader2,
  ArrowUp,
  ChevronDown,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, NumberFormat } from "docx"
import { saveAs } from "file-saver"

// Helper function to parse markdown and render as JSX
const parseMarkdown = (text: string) => {
  if (!text) return null
  
  // Split by newlines to handle line breaks
  const lines = text.split('\n')
  
  return (
    <>
      {lines.map((line, lineIndex) => {
        // Check if line is a bullet point
        if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
          const content = line.replace(/^[-•]\s*/, '')
          return (
            <li key={lineIndex} className="ml-4">
              {parseInlineMarkdown(content)}
            </li>
          )
        }
        
        // Check if line is a numbered list
        const numberedMatch = line.match(/^(\d+)\.\s+(.+)/)
        if (numberedMatch) {
          return (
            <li key={lineIndex} className="ml-4">
              {parseInlineMarkdown(numberedMatch[2])}
            </li>
          )
        }
        
        // Regular paragraph
        if (line.trim()) {
          return (
            <span key={lineIndex}>
              {parseInlineMarkdown(line)}
              {lineIndex < lines.length - 1 && <br />}
            </span>
          )
        }
        return null
      })}
    </>
  )
}

// Helper to parse inline markdown (bold, italic, etc.)
const parseInlineMarkdown = (text: string) => {
  const parts: React.ReactNode[] = []
  let currentIndex = 0
  
  // Match **bold** or __bold__
  const boldRegex = /(\*\*|__)(.*?)\1/g
  let match
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      parts.push(text.substring(currentIndex, match.index))
    }
    
    // Add bold text
    parts.push(<strong key={match.index}>{match[2]}</strong>)
    currentIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    parts.push(text.substring(currentIndex))
  }
  
  return parts.length > 0 ? parts : text
}

// Helper to convert markdown text to DOCX TextRuns
const markdownToDocxRuns = (text: string): TextRun[] => {
  const runs: TextRun[] = []
  let currentIndex = 0
  
  // Match **bold** or __bold__
  const boldRegex = /(\*\*|__)(.*?)\1/g
  let match
  
  while ((match = boldRegex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > currentIndex) {
      runs.push(new TextRun(text.substring(currentIndex, match.index)))
    }
    
    // Add bold text
    runs.push(new TextRun({ text: match[2], bold: true }))
    currentIndex = match.index + match[0].length
  }
  
  // Add remaining text
  if (currentIndex < text.length) {
    runs.push(new TextRun(text.substring(currentIndex)))
  }
  
  return runs.length > 0 ? runs : [new TextRun(text)]
}

type PersonalizedResource = {
  id: string
  title: string
  description: string
  type: string
  source: string
  url: string
  author: string
  topics: string[]
  tags: string[]
  likes: number
  dislikes: number
  relevanceScore: number
  isLowPerformance: boolean
}

type PersonalizedResourcesResponse = {
  resources: PersonalizedResource[]
  studentTopics: string[]
  lowPerformanceTopics: string[]
  totalResources: number
  relevantResources: number
  performanceStats: {
    totalTopics: number
    lowPerformanceTopics: number
    averageScore: number
  }
}

export function TrainingGround() {
  const [resources, setResources] = useState<PersonalizedResource[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [performanceStats, setPerformanceStats] = useState<PersonalizedResourcesResponse['performanceStats'] | null>(null)
  const [studentTopics, setStudentTopics] = useState<string[]>([])
  const [lowPerformanceTopics, setLowPerformanceTopics] = useState<string[]>([])
  const [bookmarkedResources, setBookmarkedResources] = useState<Set<string>>(new Set())
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>("")
  const [filterType, setFilterType] = useState<string>("all")
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [showQuickTips, setShowQuickTips] = useState<boolean>(true)
  const [resourceClickCounts, setResourceClickCounts] = useState<Record<string, number>>({})
  const [resourceStats, setResourceStats] = useState<Record<string, { totalOpens: number, studentOpens: number }>>({})
  const [totalOpens, setTotalOpens] = useState<number>(0)
  const [uniqueResourcesOpened, setUniqueResourcesOpened] = useState<number>(0)
  const [userTotalOpens, setUserTotalOpens] = useState<number>(0)
  const { toast } = useToast()

  // Reviewer generation states
  const [showReviewerDialog, setShowReviewerDialog] = useState(false)
  const [reviewerContent, setReviewerContent] = useState("")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [isGeneratingReviewer, setIsGeneratingReviewer] = useState(false)
  const [generatedReviewer, setGeneratedReviewer] = useState<any>(null)
  const [showReviewerPreview, setShowReviewerPreview] = useState(false)
  const [reviewerTab, setReviewerTab] = useState("text")
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Function to handle resource link clicks and track them
  const handleResourceClick = async (resourceId: string, resourceTitle: string) => {
    try {
      // Check if this is a new resource being opened
      const isNewResource = !resourceClickCounts[resourceId] || resourceClickCounts[resourceId] === 0

      // Record the open in the database
      const openResponse = await fetch('/api/student/resource-opens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId: resourceId
        })
      })

      if (!openResponse.ok) {
        throw new Error('Failed to record resource open')
      }

      // Update local click count
      setResourceClickCounts(prev => ({
        ...prev,
        [resourceId]: (prev[resourceId] || 0) + 1
      }))

      // Always increment user total opens (counts all opens including duplicates)
      setUserTotalOpens(prev => prev + 1)

      // Only increment unique resources for new resources
      if (isNewResource) {
        setTotalOpens(prev => prev + 1)
        setUniqueResourcesOpened(prev => prev + 1)
      }

      // Fetch updated resource stats
      await fetchResourceStats(resourceId)

      // Log the click activity
      await fetch('/api/student/activity-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'link_opened',
          description: `Opened resource: ${resourceTitle}`,
          metadata: {
            resourceId: resourceId,
            resourceTitle: resourceTitle,
            clickCount: (resourceClickCounts[resourceId] || 0) + 1
          }
        })
      })

      // Show success toast
      toast({
        title: "Resource Opened",
        description: `Opening ${resourceTitle}`,
      })
    } catch (error) {
      console.error('Failed to log resource click:', error)
      // Still update the count even if logging fails
      setResourceClickCounts(prev => ({
        ...prev,
        [resourceId]: (prev[resourceId] || 0) + 1
      }))
    }
  }

  // Function to fetch resource statistics
  const fetchResourceStats = async (resourceId: string) => {
    try {
      const response = await fetch(`/api/student/resource-stats?resourceId=${resourceId}`)
      if (response.ok) {
        const data = await response.json()
        setResourceStats(prev => ({
          ...prev,
          [resourceId]: {
            totalOpens: data.resourceStats.total_opens,
            studentOpens: data.studentOpens
          }
        }))
      }
    } catch (error) {
      console.error('Failed to fetch resource stats:', error)
    }
  }

  // Function to load student's resource open counts
  const loadResourceCounts = async () => {
    try {
      const response = await fetch('/api/student/resource-opens')
      if (response.ok) {
        const data = await response.json()
        setResourceClickCounts(data.resourceCounts || {})
        setTotalOpens(data.stats.unique_resources_opened || 0)
        setUniqueResourcesOpened(data.stats.unique_resources_opened || 0)
        setUserTotalOpens(data.stats.total_opens || 0)
      }
    } catch (error) {
      console.error('Failed to load resource counts:', error)
    }
  }



  useEffect(() => {
    let active = true
    async function loadPersonalizedResources() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`/api/student/personalized-resources?t=${Date.now()}`, { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          throw new Error(errorData.error || `Failed to load resources: ${response.status}`)
        }
        
        const data: PersonalizedResourcesResponse = await response.json()
        
        if (active) {
          setResources(data.resources || [])
          setPerformanceStats(data.performanceStats)
          setStudentTopics(data.studentTopics || [])
          setLowPerformanceTopics(data.lowPerformanceTopics || [])
        }
      } catch (e: any) {
        if (active) setError(e.message || 'Failed to load personalized resources')
      } finally {
        if (active) setLoading(false)
      }
    }

    async function loadBookmarks() {
      try {
        const response = await fetch('/api/student/bookmarks', { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          if (active && data.bookmarks) {
            setBookmarkedResources(new Set(data.bookmarks.map((b: any) => b.resource_id)))
          }
        }
      } catch (e) {
        console.error('Failed to load bookmarks:', e)
      }
    }

    loadPersonalizedResources()
    loadBookmarks()
    loadResourceCounts()
    return () => { active = false }
  }, [])

  // Load resource stats for all resources when resources are loaded
  useEffect(() => {
    if (resources.length > 0) {
      resources.forEach(resource => {
        fetchResourceStats(resource.id)
      })
    }
  }, [resources])


  const handleBookmark = async (resourceId: string) => {
    const isCurrentlyBookmarked = bookmarkedResources.has(resourceId)
    const action = isCurrentlyBookmarked ? 'unbookmark' : 'bookmark'
    
    try {
      const response = await fetch('/api/student/bookmark', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          resourceId,
          action
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update bookmark')
      }

      // Update local state
      setBookmarkedResources(prev => {
        const newSet = new Set(prev)
        if (isCurrentlyBookmarked) {
          newSet.delete(resourceId)
        } else {
          newSet.add(resourceId)
        }
        return newSet
      })

      // Show success toast
      toast({
        title: isCurrentlyBookmarked ? "Bookmark Removed" : "Bookmark Added",
        description: isCurrentlyBookmarked 
          ? "Resource removed from your bookmarks" 
          : "Resource added to your bookmarks",
      })
    } catch (error) {
      console.error('Error updating bookmark:', error)
      toast({
        title: "Error",
        description: "Failed to update bookmark. Please try again.",
        variant: "destructive",
      })
    }
  }

  const getResourceTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'video': return '🎥'
      case 'book': return '📚'
      case 'article': return '📄'
      case 'course': return '🎓'
      case 'document': return '📋'
      default: return '📖'
    }
  }

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'youtube': return '📺'
      case 'coursera': return '🎓'
      case 'edx': return '📚'
      case 'khan academy': return '🧮'
      case 'google books': return '📖'
      case 'wikipedia': return '🌐'
      case 'ted': return '🎤'
      default: return '🔗'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const now = new Date()
    const date = new Date(dateString)
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  // Filter resources based on search, type, and bookmark status
  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === "" || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesType = filterType === "all" || resource.type.toLowerCase() === filterType.toLowerCase()
    
    const matchesBookmark = !showBookmarksOnly || bookmarkedResources.has(resource.id)
    
    return matchesSearch && matchesType && matchesBookmark
  })

  // Pagination logic
  const resourcesPerPage = 10
  const totalPages = Math.ceil(filteredResources.length / resourcesPerPage)
  const startIndex = (currentPage - 1) * resourcesPerPage
  const endIndex = startIndex + resourcesPerPage
  const paginatedResources = filteredResources.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, showBookmarksOnly])

  // Handle scroll to show/hide scroll-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1)
      scrollToTop()
    }
  }

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1)
      scrollToTop()
    }
  }

  const toggleBookmarkView = () => {
    setShowBookmarksOnly(!showBookmarksOnly)
    
    if (!showBookmarksOnly) {
      toast({
        title: "Showing Bookmarks Only",
        description: "Filtering to show only your bookmarked resources",
      })
    } else {
      toast({
        title: "Showing All Resources",
        description: "Showing all available learning resources",
      })
    }
  }

  // Handle file upload for reviewer generation
  const handleFileUpload = async (file: File) => {
    try {
      setIsExtracting(true)
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase()
      if (!['pdf', 'docx', 'txt'].includes(fileExtension || '')) {
        throw new Error('Please upload a PDF, DOCX, or TXT file')
      }
      
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB')
      }
      
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('/api/student/extract-file-text', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to extract text from file')
      }
      
      const data = await response.json()
      setReviewerContent(data.text)
      setUploadedFile(file)
      
      toast({
        title: "File Uploaded",
        description: `Successfully extracted ${data.extractedLength.toLocaleString()} characters`,
      })
    } catch (err: any) {
      toast({
        title: "Upload Error",
        description: err.message,
        variant: "destructive",
      })
      setUploadedFile(null)
    } finally {
      setIsExtracting(false)
    }
  }

  // Generate reviewer
  const handleGenerateReviewer = async () => {
    if (!reviewerContent || reviewerContent.trim().length < 100) {
      toast({
        title: "Invalid Content",
        description: "Please provide at least 100 characters of content",
        variant: "destructive",
      })
      return
    }

    try {
      setIsGeneratingReviewer(true)
      
      const response = await fetch('/api/student/generate-reviewer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: reviewerContent,
          title: uploadedFile?.name || "Study Reviewer",
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate reviewer')
      }
      
      const data = await response.json()
      setGeneratedReviewer(data.reviewer)
      setShowReviewerDialog(false)
      setShowReviewerPreview(true)
      
      toast({
        title: "Reviewer Generated!",
        description: "Your study reviewer is ready",
      })
    } catch (err: any) {
      toast({
        title: "Generation Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsGeneratingReviewer(false)
    }
  }

  // Download reviewer as DOCX
  const downloadReviewerAsDocx = async () => {
    if (!generatedReviewer) return

    try {
      const sections: any[] = []

      // Title
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: generatedReviewer.title,
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        })
      )

      // Overview
      sections.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "Overview",
              bold: true,
              size: 28,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
        new Paragraph({
          children: markdownToDocxRuns(generatedReviewer.overview),
          spacing: { after: 300 },
        })
      )

      // Key Concepts
      if (generatedReviewer.keyConcepts && generatedReviewer.keyConcepts.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Key Concepts",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        )

        generatedReviewer.keyConcepts.forEach((concept: any) => {
          const conceptRuns = [
            ...markdownToDocxRuns(concept.concept),
            new TextRun(': '),
          ]
          sections.push(
            new Paragraph({
              children: conceptRuns,
              spacing: { after: 100 },
            }),
            new Paragraph({
              children: markdownToDocxRuns(concept.definition),
              spacing: { after: 200 },
              indent: { left: 400 },
            })
          )
        })
      }

      // Sections
      if (generatedReviewer.sections && generatedReviewer.sections.length > 0) {
        generatedReviewer.sections.forEach((section: any) => {
          sections.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: section.title,
                  bold: true,
                  size: 26,
                }),
              ],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 400, after: 200 },
            }),
            new Paragraph({
              children: markdownToDocxRuns(section.content),
              spacing: { after: 300 },
            })
          )
        })
      }

      // Terms
      if (generatedReviewer.terms && generatedReviewer.terms.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Important Terms",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        )

        generatedReviewer.terms.forEach((term: any) => {
          const termRuns = [
            ...markdownToDocxRuns(term.term),
            new TextRun(': '),
            ...markdownToDocxRuns(term.definition),
          ]
          sections.push(
            new Paragraph({
              children: termRuns,
              spacing: { after: 200 },
            })
          )
        })
      }

      // Study Tips
      if (generatedReviewer.studyTips && generatedReviewer.studyTips.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Study Tips",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        )

        generatedReviewer.studyTips.forEach((tip: string, index: number) => {
          const tipRuns = [
            new TextRun(`${index + 1}. `),
            ...markdownToDocxRuns(tip)
          ]
          sections.push(
            new Paragraph({
              children: tipRuns,
              spacing: { after: 200 },
            })
          )
        })
      }

      // Practice Questions
      if (generatedReviewer.practiceQuestions && generatedReviewer.practiceQuestions.length > 0) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Practice Questions",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          })
        )

        generatedReviewer.practiceQuestions.forEach((q: any, index: number) => {
          const questionRuns = [
            new TextRun({
              text: `${index + 1}. `,
              bold: true,
            }),
            ...markdownToDocxRuns(q.question)
          ]
          sections.push(
            new Paragraph({
              children: questionRuns,
              spacing: { after: q.hint ? 100 : 200 },
            })
          )
          
          if (q.hint) {
            const hintRuns = [
              new TextRun('   Hint: '),
              ...markdownToDocxRuns(q.hint)
            ]
            sections.push(
              new Paragraph({
                children: hintRuns,
                spacing: { after: 200 },
              })
            )
          }
        })
      }

      // Summary
      if (generatedReviewer.summary) {
        sections.push(
          new Paragraph({
            children: [
              new TextRun({
                text: "Summary",
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
          new Paragraph({
            children: markdownToDocxRuns(generatedReviewer.summary),
            spacing: { after: 300 },
          })
        )
      }

      const doc = new Document({
        sections: [
          {
            properties: {},
            children: sections,
          },
        ],
      })

      const blob = await Packer.toBlob(doc)
      const fileName = generatedReviewer.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '_reviewer.docx'
      saveAs(blob, fileName)

      toast({
        title: "Downloaded",
        description: "Reviewer downloaded successfully",
      })
    } catch (error) {
      console.error('Error downloading DOCX:', error)
      toast({
        title: "Download Error",
        description: "Failed to download reviewer",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Reviewer Dialog */}
      <Dialog open={showReviewerDialog} onOpenChange={setShowReviewerDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              Generate Study Reviewer
            </DialogTitle>
            <DialogDescription>
              Upload a file or paste your study material to generate an AI-powered study reviewer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Tabs value={reviewerTab} onValueChange={setReviewerTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="text">Paste Text</TabsTrigger>
                <TabsTrigger value="file">Upload File</TabsTrigger>
              </TabsList>
              <TabsContent value="text" className="space-y-4">
                <div className="space-y-2">
                  <Label>Study Content</Label>
                  <Textarea
                    placeholder="Paste your study material here (minimum 100 characters)..."
                    value={reviewerContent}
                    onChange={(e) => setReviewerContent(e.target.value)}
                    className="min-h-[200px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    {reviewerContent.length} characters
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="file" className="space-y-4">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center space-y-2">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Upload your study materials</p>
                    <p className="text-xs text-muted-foreground">PDF, DOCX, or TXT (max 10MB)</p>
                  </div>
                  <input
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file)
                    }}
                    className="hidden"
                    id="reviewer-file-upload"
                    disabled={isExtracting}
                  />
                  <label htmlFor="reviewer-file-upload">
                    <Button variant="outline" size="sm" asChild disabled={isExtracting}>
                      <span>
                        {isExtracting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </>
                        )}
                      </span>
                    </Button>
                  </label>
                  {uploadedFile && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm font-medium text-green-700 dark:text-green-300">
                        {uploadedFile.name}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {reviewerContent.length.toLocaleString()} characters extracted
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowReviewerDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleGenerateReviewer}
                disabled={isGeneratingReviewer || reviewerContent.length < 100}
                className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              >
                {isGeneratingReviewer ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Reviewer
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reviewer Preview Dialog */}
      <Dialog open={showReviewerPreview} onOpenChange={setShowReviewerPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-purple-500" />
                Study Reviewer Preview
              </span>
              <Button onClick={downloadReviewerAsDocx} size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Download className="mr-2 h-4 w-4" />
                Download DOCX
              </Button>
            </DialogTitle>
          </DialogHeader>
          {generatedReviewer && (
            <div className="space-y-6 py-4">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">{generatedReviewer.title}</h2>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overview</h3>
                  <p className="text-muted-foreground">{parseMarkdown(generatedReviewer.overview)}</p>
                </div>

                {generatedReviewer.keyConcepts && generatedReviewer.keyConcepts.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Key Concepts</h3>
                    <div className="space-y-2">
                      {generatedReviewer.keyConcepts.map((concept: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="font-semibold">{parseMarkdown(concept.concept)}</p>
                          <p className="text-sm text-muted-foreground">{parseMarkdown(concept.definition)}</p>
                          {concept.importance && (
                            <p className="text-xs text-muted-foreground mt-1 italic">{parseMarkdown(concept.importance)}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedReviewer.sections && generatedReviewer.sections.length > 0 && (
                  <div className="space-y-4">
                    {generatedReviewer.sections.map((section: any, index: number) => (
                      <div key={index}>
                        <h3 className="text-lg font-semibold mb-2">{section.title}</h3>
                        <div className="text-muted-foreground">{parseMarkdown(section.content)}</div>
                      </div>
                    ))}
                  </div>
                )}

                {generatedReviewer.terms && generatedReviewer.terms.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Important Terms</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {generatedReviewer.terms.map((term: any, index: number) => (
                        <div key={index} className="p-2 bg-muted rounded">
                          <p className="font-semibold text-sm">{parseMarkdown(term.term)}</p>
                          <p className="text-xs text-muted-foreground">{parseMarkdown(term.definition)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedReviewer.studyTips && generatedReviewer.studyTips.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Study Tips</h3>
                    <ul className="list-disc list-inside space-y-1">
                      {generatedReviewer.studyTips.map((tip: string, index: number) => (
                        <li key={index} className="text-muted-foreground">{parseMarkdown(tip)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {generatedReviewer.practiceQuestions && generatedReviewer.practiceQuestions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Practice Questions</h3>
                    <div className="space-y-2">
                      {generatedReviewer.practiceQuestions.map((q: any, index: number) => (
                        <div key={index} className="p-3 bg-muted rounded-lg">
                          <p className="font-medium">{index + 1}. {parseMarkdown(q.question)}</p>
                          {q.hint && <p className="text-sm text-muted-foreground mt-1">Hint: {parseMarkdown(q.hint)}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {generatedReviewer.summary && (
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Summary</h3>
                    <p className="text-muted-foreground">{parseMarkdown(generatedReviewer.summary)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-2 flex-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {showBookmarksOnly ? "My Bookmarks" : "Learning Feed"}
        </h1>
            <p className="text-muted-foreground text-sm sm:text-lg">
              {showBookmarksOnly 
                ? "Your saved learning resources" 
                : "Personalized learning resources based on your academic performance"
              }
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              onClick={() => setShowReviewerDialog(true)}
              variant="outline"
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>Generate Reviewer</span>
            </Button>
            <Button
              onClick={toggleBookmarkView}
              variant={showBookmarksOnly ? "default" : "outline"}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
            >
              <BookmarkCheck className="w-4 h-4" />
              <span>{showBookmarksOnly ? "Show All" : "My Bookmarks"}</span>
            </Button>
          </div>
        </div>

        {/* Quick Tips */}
        {!showBookmarksOnly && showQuickTips && (
          <Card className="glass-card shadow-card-lg border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg flex-shrink-0">
                    <Brain className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-green-600 dark:text-green-400">💡 Quick Tips</h4>
                    <p className="text-sm text-muted-foreground">
                      • Bookmark resources you find useful for easy access later
                      • Use the search to find specific topics or subjects
                      • Focus on resources marked as "Focus Area" for improvement
                      • Try different resource types (videos, courses, books) for variety
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowQuickTips(false)}
                  className="text-muted-foreground hover:text-foreground p-1"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search resources, topics, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="all">All Types</option>
              <option value="video">Video</option>
              <option value="book">Book</option>
              <option value="article">Article</option>
              <option value="course">Course</option>
              <option value="document">Document</option>
            </select>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>


      {/* Learning Progress Overview */}
      {!loading && !error && (
        <Card className="glass-card shadow-card-lg">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="flex items-center space-x-2 text-lg sm:text-xl">
              <BookOpen className="w-5 h-5 text-green-500" />
              <span>Learning Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {resources.length}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Total Resources</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {bookmarkedResources.size}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Bookmarked</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {userTotalOpens}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Your Total Opens</div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {uniqueResourcesOpened}
                </div>
                <div className="text-xs sm:text-sm text-muted-foreground">Unique Resources</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="glass-card shadow-card-lg">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-muted rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-32"></div>
                      <div className="h-3 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-1/2"></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card className="glass-card shadow-card-lg border-red-200 dark:border-red-800">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-600 dark:text-red-400">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Summary */}
      {!loading && !error && resources.length > 0 && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-muted-foreground">
          <span className="text-xs sm:text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredResources.length)} of {filteredResources.length} resources
            {showBookmarksOnly && ` (${bookmarkedResources.size} bookmarked)`}
            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
          </span>
          {(searchQuery || filterType !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("")
                setFilterType("all")
              }}
              className="text-xs w-full sm:w-auto"
            >
              Clear filters
            </Button>
          )}
        </div>
      )}

      {/* Pagination Controls - Top */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            {/* Desktop: Show page buttons if <= 10 pages */}
            {totalPages <= 10 && (
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setCurrentPage(page)
                      scrollToTop()
                    }}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}

            {/* Desktop with >10 pages OR Mobile/Tablet: Show dropdown */}
            <select
              value={currentPage}
              onChange={(e) => {
                setCurrentPage(Number(e.target.value))
                scrollToTop()
              }}
              className={`${totalPages > 10 ? 'block' : 'md:hidden'} px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-[80px]`}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="hidden sm:block text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* News Feed */}
      {!loading && !error && (
        <div className="space-y-4">
          {filteredResources.length === 0 ? (
            <div className="space-y-6">
              {/* Motivational Section */}
              <Card className="glass-card shadow-card-lg border-l-4 border-l-green-500">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
                      <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-1">
                        Keep Learning!
                      </h3>
                      <p className="text-muted-foreground">
                        Your learning journey is just beginning. Explore new topics and discover amazing resources.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Empty State */}
            <Card className="glass-card shadow-card-lg">
                <CardContent className="p-8 text-center">
                  <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-full flex items-center justify-center">
                    <Brain className="w-10 h-10 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {showBookmarksOnly ? "No bookmarks yet" : "No resources found"}
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    {showBookmarksOnly 
                      ? "Start your learning journey by bookmarking resources you find useful. Your bookmarks will appear here!"
                      : "No resources match your current filters. Try adjusting your search terms or clearing the filters to see more content."
                    }
                  </p>
                  {!showBookmarksOnly && (searchQuery || filterType !== "all") && (
                    <Button
                      onClick={() => {
                        setSearchQuery("")
                        setFilterType("all")
                      }}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Clear Filters
                    </Button>
                  )}
              </CardContent>
            </Card>
            </div>
          ) : (
            paginatedResources.map((resource) => (
              <Card key={resource.id} className="glass-card shadow-card-lg hover:shadow-card-xl transition-all duration-300 group">
                <CardHeader className="pb-3 p-4 sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start sm:items-center space-x-3 flex-1 min-w-0">
                      <div className="relative flex-shrink-0">
                        <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-green-100 dark:ring-green-900/20 group-hover:ring-green-200 dark:group-hover:ring-green-800/40 transition-all duration-300">
                          <AvatarFallback className="bg-gradient-to-br from-green-500 to-emerald-500 text-white text-base sm:text-lg">
                          {getResourceTypeIcon(resource.type)}
                        </AvatarFallback>
                      </Avatar>
                        {resource.isLowPerformance && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-2.5 h-2.5 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1">
                          <span className="font-semibold text-foreground text-sm sm:text-base truncate">{resource.author}</span>
                          {resource.isLowPerformance && (
                            <Badge variant="destructive" className="text-xs px-2 py-0.5 w-fit">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              <span className="hidden sm:inline">Focus Area</span>
                              <span className="sm:hidden">Focus</span>
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <span>{getSourceIcon(resource.source)}</span>
                            <span className="font-medium">{resource.source}</span>
                          </div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block"></div>
                          <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Just now</span>
                          </div>
                          <div className="w-1 h-1 bg-muted-foreground rounded-full hidden sm:block"></div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-3 h-3 text-yellow-500" />
                            <span>{resource.likes}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleBookmark(resource.id)}
                      className={`p-2 rounded-full transition-all duration-200 flex-shrink-0 ${
                        bookmarkedResources.has(resource.id) 
                          ? 'text-green-600 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' 
                          : 'text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${bookmarkedResources.has(resource.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4 p-4 sm:p-6">
                  {/* Resource Content */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h3 className="text-lg sm:text-xl font-bold leading-tight text-foreground group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-200">
                        {resource.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3">
                        {resource.description}
                      </p>
                    </div>
                    
                    {/* Topics and Tags */}
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Topics</span>
                        <div className="flex-1 h-px bg-gradient-to-r from-muted-foreground/20 to-transparent"></div>
                      </div>
                    <div className="flex flex-wrap gap-2">
                        {resource.topics.slice(0, 4).map((topic, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                            className={`text-xs px-3 py-1 font-medium transition-all duration-200 hover:scale-105 ${
                            lowPerformanceTopics.includes(topic) 
                                ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:bg-orange-950/20 dark:text-orange-300 dark:hover:bg-orange-950/30' 
                                : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-800 dark:bg-green-950/20 dark:text-green-300 dark:hover:bg-green-950/30'
                          }`}
                        >
                          {lowPerformanceTopics.includes(topic) && <AlertCircle className="w-3 h-3 mr-1" />}
                          {topic}
                        </Badge>
                      ))}
                        {resource.topics.length > 4 && (
                          <Badge variant="outline" className="text-xs px-3 py-1 font-medium hover:bg-muted/50">
                            +{resource.topics.length - 4} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    {/* Resource Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-muted/50">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Eye className="w-3 h-3" />
                          <span>Relevance: {Math.round(resource.relevanceScore)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <TrendingUp className="w-3 h-3" />
                          <span className="hidden sm:inline">{resource.likes - resource.dislikes} net likes</span>
                          <span className="sm:hidden">{resource.likes - resource.dislikes} likes</span>
                        </div>
                        {resourceClickCounts[resource.id] > 0 && (
                          <div className="flex items-center space-x-1">
                            <ExternalLink className="w-3 h-3" />
                            <span className="text-green-600 dark:text-green-400 font-medium">
                              <span className="hidden sm:inline">You opened {resourceClickCounts[resource.id]} time{resourceClickCounts[resource.id] > 1 ? 's' : ''}</span>
                              <span className="sm:hidden">{resourceClickCounts[resource.id]}x opened</span>
                            </span>
                          </div>
                        )}
                        {resourceStats[resource.id] && (
                          <div className="flex items-center space-x-1">
                            <TrendingUp className="w-3 h-3" />
                            <span className="text-muted-foreground text-xs">
                              <span className="hidden sm:inline">{resourceStats[resource.id].totalOpens} total opens by all students</span>
                              <span className="sm:hidden">{resourceStats[resource.id].totalOpens} total</span>
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="text-xs px-2 py-1">
                          {resource.type.charAt(0).toUpperCase() + resource.type.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Resource Link */}
                  <div className="p-3 sm:p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl border border-green-200/50 dark:border-green-800/50 group-hover:from-green-100 group-hover:to-emerald-100 dark:group-hover:from-green-950/30 dark:group-hover:to-emerald-950/30 transition-all duration-300">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center text-white text-lg shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105 flex-shrink-0">
                          {getResourceTypeIcon(resource.type)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground truncate">{resource.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center space-x-1">
                            <span>{getSourceIcon(resource.source)}</span>
                            <span className="truncate">{resource.source}</span>
                          </p>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105 w-full sm:w-auto"
                        onClick={() => handleResourceClick(resource.id, resource.title)}
                      >
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center space-x-2 w-full">
                          <ExternalLink className="w-4 h-4" />
                          <span className="hidden sm:inline">Open Resource</span>
                          <span className="sm:hidden">Open</span>
                          {resourceClickCounts[resource.id] > 0 && (
                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                              {resourceClickCounts[resource.id]}
                            </span>
                          )}
                        </a>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pagination Controls - Bottom */}
      {!loading && !error && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>
            
            {/* Desktop: Show page buttons if <= 10 pages */}
            {totalPages <= 10 && (
              <div className="hidden md:flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "ghost"}
                    size="sm"
                    onClick={() => {
                      setCurrentPage(page)
                      scrollToTop()
                    }}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
            )}

            {/* Desktop with >10 pages OR Mobile/Tablet: Show dropdown */}
            <select
              value={currentPage}
              onChange={(e) => {
                setCurrentPage(Number(e.target.value))
                scrollToTop()
              }}
              className={`${totalPages > 10 ? 'block' : 'md:hidden'} px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring flex-1 min-w-[80px]`}
            >
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <option key={page} value={page}>
                  {page}
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="hidden sm:block text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  )
}