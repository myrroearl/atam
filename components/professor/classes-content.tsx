"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Users, BookOpen, Calendar, Search, Plus, MoreHorizontal, TrendingUp, Clock, Archive } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

export type ClassItem = {
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
}

export type ClassesContentProps = { classes?: ClassItem[] }

export function ClassesContent({ classes }: ClassesContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [archivingClasses, setArchivingClasses] = useState<Set<number>>(new Set())
  const { toast } = useToast()

  const filteredClasses = useMemo(() => {
    const term = searchTerm.toLowerCase()
    const list = classes ?? []
    return list.filter(
    (class_) =>
        class_.name.toLowerCase().includes(term) ||
        class_.code.toLowerCase().includes(term),
  )
  }, [classes, searchTerm])

  const handleArchiveClass = async (classId: number, className: string) => {
    setArchivingClasses(prev => new Set(prev).add(classId))
    
    try {
      const response = await fetch('/api/professor/classes/archive', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          class_id: classId,
          action: 'archive'
        })
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Class Archived",
          description: `${className} has been successfully archived.`,
        })
        // Refresh the page to update the class list
        window.location.reload()
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to archive class",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error archiving class:', error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while archiving the class",
        variant: "destructive",
      })
    } finally {
      setArchivingClasses(prev => {
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
            <BookOpen className="h-8 w-8 text-primary" />
            Classes
          </h1>
          <p className="text-muted-foreground">Manage your classes and track student performance</p>
        </div>
        
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search classes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        {/* <Button variant="outline">Filter</Button> */}
      </div>

      {/* Classes Grid */}
      {filteredClasses.length === 0 ? (
        <div className="text-muted-foreground">No classes assigned yet.</div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredClasses.map((class_: ClassItem) => (
          <Card key={class_.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-xl">{class_.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <span>{class_.code}</span>
                    <Badge variant="outline">{class_.status}</Badge>
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
                      <DropdownMenuItem>View Gradebook</DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleArchiveClass(class_.id, class_.name)}
                      disabled={archivingClasses.has(class_.id)}
                    >
                      {archivingClasses.has(class_.id) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-600 border-t-transparent mr-2" />
                          Archiving...
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive Class
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
                    <Users className="h-4 w-4" />
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
                  <p className="text-xs text-muted-foreground">Grade Entries</p>
                </div>
              </div>

              {/* Schedule Info */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{class_.schedule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span>{class_.room}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>Next: {class_.nextClass}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Link href={`/professor/classes/${class_.id}`} className="flex-1">
                  <Button className="w-full" size="sm">
                    View Gradebook
                  </Button>
                </Link>
                
                
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}
    </div>
  )
}
