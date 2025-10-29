"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, ArrowDownAZ, ArrowDownZA, Grid3X3, List } from "lucide-react"
import { AddClassModal } from "@/components/admin/add-class-modal"
import { ClassesTable } from "@/components/admin/classes-table"
import ClassCard from "@/components/admin/class-card"
import { ClassesPageSkeleton } from "@/components/admin/page-skeletons"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Class {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
  units: number;
  professor: string;
  professorEmail: string;
  section: string;
  course: string;
  department: string;
  yearLevel: string;
  semester: string;
  schedule_start: string | null;
  schedule_end: string | null;
  class_id: number;
  subject_id: number;
  section_id: number;
  prof_id: number;
  course_id: number;
  department_id: number;
  created_at: string;
  updated_at: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all-subjects");
  const [professorFilter, setProfessorFilter] = useState("all-professors");
  const [sectionFilter, setSectionFilter] = useState("all-sections");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<"table" | "cards">("cards");

  // Fetch classes from API
  const fetchClasses = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/classes')
      if (!response.ok) {
        throw new Error('Failed to fetch classes')
      }
      const data = await response.json()
      
      // Log exact schedule data received from API
      console.log('\n🔍 ═══════════════════════════════════════════════════════════');
      console.log('🔍 FRONTEND: Received class data from API');
      console.log('🔍 ═══════════════════════════════════════════════════════════');
      
      if (data.classes && data.classes.length > 0) {
        data.classes.forEach((cls: any, index: number) => {
          console.log(`\n📚 Class #${index + 1}: ${cls.name}`);
          console.log(`   🆔 Class ID: ${cls.class_id}`);
          console.log(`   🕐 schedule_start: ${cls.schedule_start || 'Not set'}`);
          console.log(`   🕐 schedule_end: ${cls.schedule_end || 'Not set'}`);
        });
        console.log('\n🔍 ═══════════════════════════════════════════════════════════');
        console.log(`🔍 Total classes received: ${data.classes.length}`);
        console.log('🔍 ═══════════════════════════════════════════════════════════\n');
      }
      
      setClasses(data.classes)
    } catch (error) {
      console.error('Error fetching classes:', error)
      toast.error('Failed to fetch classes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  useEffect(() => {
    setCurrentPage(1);
  }, [search, subjectFilter, professorFilter, sectionFilter, sortOrder]);

  const handleAddClass = (classData: any) => {
    // The modal already handled the API call, just update the state
    setClasses((prev) => [classData, ...prev])
  }

  const handleEditClass = (updatedClass: Class) => {
    // Enhanced debugging for UI update
    console.log('\n🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 CLASSES PAGE: Updating UI with edited class data');
    console.log('🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 Updated class ID:', updatedClass.class_id);
    console.log('🔍 Updated class name:', updatedClass.name);
    console.log('🔍 Updated schedule_start:', updatedClass.schedule_start);
    console.log('🔍 Updated schedule_end:', updatedClass.schedule_end);
    console.log('🔍 ═══════════════════════════════════════════════════════════\n');

    // Update the state with the edited class data
    setClasses((prev) => prev.map((c) => (c.id === updatedClass.id ? updatedClass : c)));
  }

  const handleDeleteClass = (classData: Class) => {
    // Remove the class from the state
    setClasses((prev) => prev.filter((c) => c.id !== classData.id));
  }

  // Helper to get class name for sorting
  function getClassName(name: string) {
    return name.toLowerCase();
  }

  // Filtering and sorting logic
  let filtered = classes.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.subject.toLowerCase().includes(search.toLowerCase()) ||
      c.subjectCode.toLowerCase().includes(search.toLowerCase()) ||
      c.professor.toLowerCase().includes(search.toLowerCase()) ||
      c.section.toLowerCase().includes(search.toLowerCase()) ||
      c.course.toLowerCase().includes(search.toLowerCase()) ||
      c.department.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "all-subjects" || c.subject === subjectFilter;
    const matchesProfessor = professorFilter === "all-professors" || c.professor === professorFilter;
    const matchesSection = sectionFilter === "all-sections" || c.section === sectionFilter;
    return matchesSearch && matchesSubject && matchesProfessor && matchesSection;
  });

  filtered = filtered.sort((a, b) => {
    const nameA = getClassName(a.name);
    const nameB = getClassName(b.name);
    if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
    if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return <ClassesPageSkeleton />
  }

  // Get unique values for filters
  const uniqueSubjects = [...new Set(classes.map(c => c.subject))]
  const uniqueProfessors = [...new Set(classes.map(c => c.professor))]
  const uniqueSections = [...new Set(classes.map(c => c.section))]

  return (
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors w-full">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Class Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400 font-light">Manage classes, subjects, and professor assignments</p>
        </div>
        <div className="flex items-center gap-3">
          <AddClassModal onAdd={handleAddClass} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center w-full gap-2">
        <div className="relative min-w-[300px] text-[11px] !border-none">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3" />
          <Input
            placeholder="Search class..."
            className="pl-9 text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-one)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger className="min-w-[250px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-subjects" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Subjects</SelectItem>
            {uniqueSubjects.map((subject) => (
              <SelectItem key={subject} value={subject} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">{subject}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={professorFilter} onValueChange={setProfessorFilter}>
          <SelectTrigger className="min-w-[250px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Professors" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-professors" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Professors</SelectItem>
            {uniqueProfessors.map((professor) => (
              <SelectItem key={professor} value={professor} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">{professor}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sectionFilter} onValueChange={setSectionFilter}>
          <SelectTrigger className="min-w-[100px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Sections" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-sections" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Sections</SelectItem>
            {uniqueSections.map((section) => (
              <SelectItem key={section} value={section} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">{section}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="flex items-center gap-2 border bg-white min-w-[70px] text-[11px] px-3 py-2 dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0 hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)] transition-colors duration-200"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          <span className="font-medium">Sort</span>
          <div className="flex flex-col items-center">
            {sortOrder === "asc" ? (
              <>
                <ArrowDownAZ className="w-3 h-3 text-[var(--customized-color-one)]" />
              </>
            ) : (
              <>
                <ArrowDownZA className="w-3 h-3 text-[var(--customized-color-one)]" />
              </>
            )}
          </div>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className={`flex items-center gap-2 ${
              viewMode === "cards" 
                ? "bg-[var(--customized-color-two)] text-white" 
                : "bg-white border-none text-[var(--customized-color-one)] dark:bg-black dark:text-white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)]"
            }`}
          >
            <Grid3X3 className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "table" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("table")}
            className={`flex items-center gap-2 ${
              viewMode === "table" 
                ? "bg-[var(--customized-color-one)] text-white" 
                : "bg-white border-none text-[var(--customized-color-one)] hover:bg-green-50 dark:bg-black dark:text-white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)]"
            }`}
          >
            <List className="w-4 h-4" />
            Table
          </Button>
        </div>
      </div>

      {/* Content */}
      {viewMode === "cards" ? (
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center text-gray-500 py-12">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">No classes found</h3>
              <p className="text-gray-400">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 xl:grid-cols-3 gap-6">
              {filtered.map((classData) => (
                <ClassCard
                  key={classData.id}
                  classData={classData}
                  onEdit={handleEditClass}
                  onDelete={handleDeleteClass}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <ClassesTable 
          classes={filtered} 
          onDeleteClass={handleDeleteClass} 
          onEditClass={handleEditClass} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage} 
        />
      )}
    </div>
  )
}