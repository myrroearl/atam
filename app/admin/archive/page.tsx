"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArchiveTable } from "@/components/admin/archive-table"
import { GenericPageSkeleton } from "@/components/admin/page-skeletons"
import { toast } from "sonner"

export default function ArchivePage() {
  const [activeTab, setActiveTab] = useState("students")
  const [archivedData, setArchivedData] = useState<any>({
    students: [],
    professors: [],
    courses: [],
    departments: [],
    sections: [],
    subjects: [],
    classes: [],
    year_level: [],
    semester: [],
  })
  const [loading, setLoading] = useState(true)

  const fetchArchivedData = async (type: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/archive?type=${type}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch archived ${type}`)
      }
      const data = await response.json()
      setArchivedData((prev: any) => ({
        ...prev,
        [type]: data[type] || [],
      }))
    } catch (error) {
      console.error(`Error fetching archived ${type}:`, error)
      toast.error(`Failed to fetch archived ${type}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchArchivedData(activeTab)
  }, [activeTab])

  const handleAction = async (type: string, id: string | number, action: 'restore' | 'permanent_delete') => {
    try {
      const response = await fetch('/api/admin/archive', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, id, action }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${action.replace('_', ' ')} ${type}`)
      }

      toast.success(result.message)
      // Re-fetch data for the active tab to update the UI
      fetchArchivedData(activeTab)
    } catch (error) {
      console.error(`Error performing ${action} on ${type}:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${action.replace('_', ' ')} ${type}`)
    }
  }

  if (loading) {
    return <GenericPageSkeleton />
  }

  return (
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] transition-colors min-h-screen">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Archive</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400 font-light">
            Review and manage archived records. Restore or permanently delete them as needed.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-9 bg-white dark:bg-black">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="professors">Professors</TabsTrigger>
          <TabsTrigger value="courses">Courses</TabsTrigger>
          <TabsTrigger value="departments">Departments</TabsTrigger>
          <TabsTrigger value="year_level">Year Levels</TabsTrigger>
          <TabsTrigger value="semester">Semesters</TabsTrigger>
          <TabsTrigger value="sections">Sections</TabsTrigger>
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <ArchiveTable
            data={archivedData.students}
            type="students"
            onAction={handleAction}
            columns={[
              { header: "Student Name", accessor: (row: any) => `${row.last_name}, ${row.first_name} ${row.middle_name || ''}`.trim(), subAccessor: (row: any) => row.accounts?.email },
              { header: "Student No.", accessor: (row: any) => row.student_id.toString().padStart(8, '0') },
              { header: "Course", accessor: (row: any) => row.sections?.courses?.course_name || 'N/A' },
              { header: "Year & Section", accessor: (row: any) => `${row.sections?.year_level?.name || 'N/A'} & ${row.sections?.section_name || 'N/A'}` },
              { header: "Status", accessor: (row: any) => row.accounts?.status === 'inactive' ? 'Archived' : row.accounts?.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="professors">
          <ArchiveTable
            data={archivedData.professors}
            type="professors"
            onAction={handleAction}
            columns={[
              { header: "Professor Name", accessor: (row: any) => `${row.last_name}, ${row.first_name} ${row.middle_name || ''}`.trim(), subAccessor: (row: any) => row.accounts?.email },
              { header: "Professor No.", accessor: (row: any) => row.prof_id.toString().padStart(8, '0') },
              { header: "Department", accessor: (row: any) => row.departments?.department_name || 'N/A' },
              { header: "Faculty Type", accessor: (row: any) => row.faculty_type || 'N/A' },
              { header: "Status", accessor: (row: any) => row.accounts?.status === 'inactive' ? 'Archived' : row.accounts?.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="courses">
          <ArchiveTable
            data={archivedData.courses}
            type="courses"
            onAction={handleAction}
            columns={[
              { header: "Course Code", accessor: (row: any) => row.course_code },
              { header: "Course Name", accessor: (row: any) => row.course_name },
              { header: "Department", accessor: (row: any) => row.departments?.department_name || 'N/A' },
              { header: "Status", accessor: (row: any) => row.status === 'inactive' ? 'Archived' : row.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="departments">
          <ArchiveTable
            data={archivedData.departments}
            type="departments"
            onAction={handleAction}
            columns={[
              { header: "Department Name", accessor: (row: any) => row.department_name },
              { header: "Dean", accessor: (row: any) => row.dean_name },
              { header: "Status", accessor: (row: any) => row.status === 'inactive' ? 'Archived' : row.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="sections">
          <ArchiveTable
            data={archivedData.sections}
            type="sections"
            onAction={handleAction}
            columns={[
              { header: "Section Name", accessor: (row: any) => row.section_name },
              { header: "Course", accessor: (row: any) => row.courses?.course_name || 'N/A' },
              { header: "Year Level", accessor: (row: any) => row.year_level?.name || 'N/A' },
              { header: "Status", accessor: (row: any) => row.status === 'inactive' ? 'Archived' : row.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="subjects">
          <ArchiveTable
            data={archivedData.subjects}
            type="subjects"
            onAction={handleAction}
            columns={[
              { header: "Subject Code", accessor: (row: any) => row.subject_code },
              { header: "Subject Name", accessor: (row: any) => row.subject_name },
              { header: "Course", accessor: (row: any) => row.courses?.course_name || 'N/A' },
              { header: "Year Level", accessor: (row: any) => row.year_level?.name || 'N/A' },
              { header: "Semester", accessor: (row: any) => row.semester?.semester_name || 'N/A' },
              { header: "Units", accessor: (row: any) => row.units || 'N/A' },
              { header: "Status", accessor: (row: any) => row.status === 'inactive' ? 'Archived' : row.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="year_level">
          <ArchiveTable
            data={archivedData.year_level}
            type="year_level"
            onAction={handleAction}
            columns={[
              { header: "Year Level Name", accessor: (row: any) => row.name },
              { header: "Course", accessor: (row: any) => row.courses?.course_name || 'N/A', subAccessor: (row: any) => row.courses?.course_code },
              { header: "Status", accessor: (row: any) => row.status === 'inactive' ? 'Archived' : row.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="semester">
          <ArchiveTable
            data={archivedData.semester}
            type="semester"
            onAction={handleAction}
            columns={[
              { header: "Semester Name", accessor: (row: any) => row.semester_name },
              { header: "Year Level", accessor: (row: any) => row.year_level?.name || 'N/A' },
              { header: "Course", accessor: (row: any) => row.year_level?.courses?.course_name || 'N/A' },
              { header: "Status", accessor: (row: any) => row.status === 'inactive' ? 'Archived' : row.status },
            ]}
          />
        </TabsContent>
        <TabsContent value="classes">
          <ArchiveTable
            data={archivedData.classes}
            type="classes"
            onAction={handleAction}
            columns={[
              { header: "Class Name", accessor: (row: any) => row.class_name },
              { header: "Subject", accessor: (row: any) => row.subjects?.subject_name || 'N/A' },
              { header: "Section", accessor: (row: any) => row.sections?.section_name || 'N/A' },
              { header: "Professor", accessor: (row: any) => `${row.professors?.last_name || ''}, ${row.professors?.first_name || ''}`.trim() || 'N/A' },
              { header: "Status", accessor: (row: any) => row.status === 'inactive' ? 'Archived' : row.status },
            ]}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}