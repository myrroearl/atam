"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, ArrowDownAZ, ArrowDownZA, Loader2, Plus } from "lucide-react"
import { AddSectionModal } from "@/components/admin/add-section-modal"
import { SectionsTable } from "@/components/admin/sections-table"
import { WithLoading } from "@/components/admin/with-loading"
import { SectionsPageSkeleton } from "@/components/admin/page-skeletons"
import { useState, useEffect } from "react"
import { toast } from "sonner"

interface Section {
  id: string;
  name: string;
  course: string;
  department: string;
  yearLevel: string;
  courseCode: string;
  section_id: number;
  course_id: number;
  year_level_id: number;
  department_id: number;
  created_at: string;
  updated_at: string;
}

export default function SectionsPage() {
  const [sections, setSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("all-courses");
  const [departmentFilter, setDepartmentFilter] = useState("all-departments");
  const [yearLevelFilter, setYearLevelFilter] = useState("all-year-levels");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch sections from API
  const fetchSections = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/sections')
      if (!response.ok) {
        throw new Error('Failed to fetch sections')
      }
      const data = await response.json()
      setSections(data.sections)
    } catch (error) {
      console.error('Error fetching sections:', error)
      toast.error('Failed to fetch sections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSections()
  }, [])

  useEffect(() => {
    setCurrentPage(1);
  }, [search, courseFilter, departmentFilter, yearLevelFilter, sortOrder]);

  // Handle add section button click
  const handleAddSection = () => {
    setIsAddModalOpen(true)
  }

  // Handle modal success (refresh data)
  const handleModalSuccess = () => {
    setError(null) // Clear any previous errors
    fetchSections()
  }

  // Check for duplicate section
  const checkDuplicateSection = (name: string, course: string, yearLevel: string) => {
    return sections.some(section => 
      section.name.toLowerCase() === name.toLowerCase() &&
      section.course === course &&
      section.yearLevel === yearLevel
    )
  }

  // Handle validation error
  const handleValidationError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
  }

  const handleEditSection = async (updatedSection: Section) => {
    try {
      // Check for duplicates (excluding the current section being edited)
      const isDuplicate = sections.some(section => 
        section.id !== updatedSection.id &&
        section.name.toLowerCase() === updatedSection.name.toLowerCase() &&
        section.course === updatedSection.course &&
        section.yearLevel === updatedSection.yearLevel
      );

      if (isDuplicate) {
        handleValidationError(`A section with the name "${updatedSection.name}" already exists for ${updatedSection.course} - ${updatedSection.yearLevel}`);
        return;
      }

      const response = await fetch('/api/admin/sections', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          section_id: updatedSection.section_id,
          name: updatedSection.name,
          course: updatedSection.course,
          yearLevel: updatedSection.yearLevel,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update section');
      }

      const data = await response.json();
      setSections((prev) => prev.map((s) => (s.id === updatedSection.id ? data.section : s)));
      setError(null); // Clear any previous errors
      toast.success("Section updated successfully!");
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update section');
    }
  }

  const handleDeleteSection = async (sectionId: string) => {
    try {
      const section = sections.find(s => s.id === sectionId);
      if (!section) return;

      const response = await fetch(`/api/admin/sections?section_id=${section.section_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete section');
      }

      setSections((prev) => prev.filter((s) => s.id !== sectionId));
      toast.success("Section deleted successfully!");
    } catch (error) {
      console.error('Error deleting section:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete section');
    }
  }

  // Helper to get section name for sorting
  function getSectionName(name: string) {
    return name.toLowerCase();
  }

  // Filtering and sorting logic
  let filtered = sections.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.course.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.yearLevel.toLowerCase().includes(search.toLowerCase()) ||
      s.courseCode.toLowerCase().includes(search.toLowerCase());
    const matchesCourse = courseFilter === "all-courses" || s.course === courseFilter;
    const matchesDepartment = departmentFilter === "all-departments" || s.department === departmentFilter;
    const matchesYearLevel = yearLevelFilter === "all-year-levels" || s.yearLevel === yearLevelFilter;
    return matchesSearch && matchesCourse && matchesDepartment && matchesYearLevel;
  });

  filtered = filtered.sort((a, b) => {
    const nameA = getSectionName(a.name);
    const nameB = getSectionName(b.name);
    if (nameA < nameB) return sortOrder === "asc" ? -1 : 1;
    if (nameA > nameB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Show skeleton while loading
  if (loading) {
    return <SectionsPageSkeleton />
  }

  // Get unique values for filters
  const uniqueCourses = [...new Set(sections.map(s => s.course))]
  const uniqueDepartments = [...new Set(sections.map(s => s.department))]
  const uniqueYearLevels = [...new Set(sections.map(s => s.yearLevel))]

  return (
    <WithLoading loading={loading}>
      <>
        <div className="p-5 space-y-6 w-full bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-black dark:text-white">Section Management</h1>
              <p className="text-lg text-gray-700 dark:text-gray-400">Manage sections, courses, and year levels</p>
            </div>
            <div className="flex items-center gap-3">
              {error && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {error}
                </div>
              )}
              <Button 
                onClick={handleAddSection}
                className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Section
              </Button>
            </div>
          </div>

        {/* Filters */}
        <div className="flex items-center w-full gap-2">
          <div className="relative min-w-[400px] text-[11px] !border-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3" />
            <Input
              placeholder="Search section..."
              className="pl-9 text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
            <SelectTrigger className="min-w-[300px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent className="text-[11px]">
              <SelectItem value="all-departments" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Departments</SelectItem>
              {uniqueDepartments.map((department) => (
                <SelectItem key={department} value={department} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                  {department}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={courseFilter} onValueChange={setCourseFilter}>
            <SelectTrigger className="min-w-[300px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent className="text-[11px]">
              <SelectItem value="all-courses" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Courses</SelectItem>
              {uniqueCourses.map((course) => (
                <SelectItem key={course} value={course} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                  {course}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={yearLevelFilter} onValueChange={setYearLevelFilter}>
            <SelectTrigger className="min-w-[50px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
              <SelectValue placeholder="All Year Levels" />
            </SelectTrigger>  
            <SelectContent className="text-[11px]">
              <SelectItem value="all-year-levels" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Year Levels</SelectItem>
              {uniqueYearLevels.map((yearLevel) => (
                <SelectItem key={yearLevel} value={yearLevel} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                  {yearLevel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            className="flex items-center gap-2 border bg-white min-w-[80px] text-[11px] px-3 py-2 dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0 hover:bg-[var(--customized-color-four)] hover:text-[var(--customized-color-one)] dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)] transition-colors duration-200"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            <span className="font-medium">Sort</span>
            <div className="flex flex-col items-center">
              {sortOrder === "asc" ? (
                <>
                  <ArrowDownZA className="w-3 h-3 text-[var(--customized-color-one)]" />
                </>
              ) : (
                <>
                  <ArrowDownAZ className="w-3 h-3 text-[var(--customized-color-one)]" />
                </>
              )}
            </div>
          </Button>
        </div>

        {/* Table */}
        <SectionsTable 
          sections={filtered} 
          onDeleteSection={handleDeleteSection} 
          onEditSection={handleEditSection} 
          currentPage={currentPage} 
          setCurrentPage={setCurrentPage}
          onValidationError={handleValidationError}
          checkDuplicate={checkDuplicateSection}
        />
        </div>

        {/* Add Section Modal */}
        <AddSectionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleModalSuccess}
        />
      </>
    </WithLoading>
  )
}