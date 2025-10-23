"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Archive, BookOpen, Calendar, Search, MoreHorizontal, TrendingUp, Clock, RotateCcw, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export type ArchivedClassItem = {
  id: number
  name: string
  code: string
  students: number
  schedule: string
  room: string
  avgGrade: number
  status: string
  nextClass: string
  assignments: number
  archivedAt: string
  semester: string
}

export type ArchivedClassesContentProps = { classes?: ArchivedClassItem[] }

export function ArchivedClassesContent({ classes }: ArchivedClassesContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterSemester, setFilterSemester] = useState("all")
  const [restoringClasses, setRestoringClasses] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  const filteredClasses = useMemo(() => {
    const term = searchTerm.toLowerCase()
    const list = classes ?? []
    
    return list.filter((class_) => {
      const matchesSearch = 
        class_.name.toLowerCase().includes(term) ||
        class_.code.toLowerCase().includes(term) ||
        class_.semester.toLowerCase().includes(term)
      
      const matchesSemester = filterSemester === "all" || class_.semester === filterSemester
      
      return matchesSearch && matchesSemester
    })
  }, [classes, searchTerm, filterSemester])

  const semesters = useMemo(() => {
    const uniqueSemesters = Array.from(
      new Set(classes?.map(c => c.semester) || [])
    ).sort()
    return uniqueSemesters
  }, [classes])

  const handleRestoreClass = async (classId: number, className: string) => {
    setRestoringClasses(prev => new Set(prev).add(classId))
    
    try {
      const response = await fetch('/api/professor/classes/archive', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: classId,
          action: 'restore'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Class Restored",
          description: `${className} has been successfully restored and is now active.`,
        })
        // Refresh the page to update the class list
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to restore class",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error restoring class:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while restoring the class",
        variant: "destructive",
      })
    } finally {
      setRestoringClasses(prev => {
        const newSet = new Set(prev)
        newSet.delete(classId)
        return newSet
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Archive className="h-8 w-8 text-orange-500" />
            Archived Classes
          </h1>
          <p className="text-muted-foreground">View and manage your archived classes from previous semesters</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search archived classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        
        <select
          value={filterSemester}
          onChange={(e) => setFilterSemester(e.target.value)}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <option value="all">All Semesters</option>
          {semesters.map((semester) => (
            <option key={semester} value={semester}>
              {semester}
            </option>
          ))}
        </select>
      </div>

      {/* Stats Summary */}
      {classes && classes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Archive className="h-5 w-5 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{classes.length}</p>
                  <p className="text-xs text-muted-foreground">Total Archived</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {classes.reduce((sum, c) => sum + c.assignments, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground">Total Assignments</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">
                    {classes.length > 0 
                      ? Math.round(classes.reduce((sum, c) => sum + c.avgGrade, 0) / classes.length)
                      : 0}%
                  </p>
                  <p className="text-xs text-muted-foreground">Avg Grade</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{semesters.length}</p>
                  <p className="text-xs text-muted-foreground">Semesters</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Archived Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-center py-12">
          <Archive className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-muted-foreground mb-2">
            {classes && classes.length === 0 
              ? "No archived classes yet" 
              : "No classes match your search"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {classes && classes.length === 0 
              ? "Classes will appear here when they are archived" 
              : "Try adjusting your search or filter criteria"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredClasses.map((class_: ArchivedClassItem) => (
            <Card key={class_.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">{class_.name}</CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <span>{class_.code}</span>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                        {class_.status}
                      </Badge>
                    </CardDescription>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <Link href={`/professor/classes/${class_.id}`}>
                        <DropdownMenuItem>
                          <Eye className="h-4 w-4 mr-2" />
                          View Gradebook
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem 
                        className="text-blue-600"
                        onClick={() => handleRestoreClass(class_.id, class_.name)}
                        disabled={restoringClasses.has(class_.id)}
                      >
                        {restoringClasses.has(class_.id) ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2" />
                            Restoring...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Restore Class
                          </>
                        )}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Class Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold">{class_.students}</p>
                    <p className="text-xs text-muted-foreground">Students</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold">{class_.avgGrade}%</p>
                    <p className="text-xs text-muted-foreground">Avg Grade</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-purple-600 mb-1">
                      <BookOpen className="h-4 w-4" />
                    </div>
                    <p className="text-2xl font-bold">{class_.assignments}</p>
                    <p className="text-xs text-muted-foreground">Assignments</p>
                  </div>
                </div>

                {/* Archive Info */}
                <div className="space-y-2 text-sm bg-muted/50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Archive className="h-4 w-4 text-orange-500" />
                    <span className="font-medium">Archived: {class_.archivedAt}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Semester: {class_.semester}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Schedule: {class_.schedule}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Link href={`/professor/classes/${class_.id}`} className="flex-1">
                    <Button variant="outline" className="w-full" size="sm">
                      <Eye className="h-4 w-4 mr-2" />
                      View Gradebook
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="text-blue-600 hover:text-blue-700"
                    onClick={() => handleRestoreClass(class_.id, class_.name)}
                    disabled={restoringClasses.has(class_.id)}
                  >
                    {restoringClasses.has(class_.id) ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent mr-2" />
                        Restoring...
                      </>
                    ) : (
                      <>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Restore
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
