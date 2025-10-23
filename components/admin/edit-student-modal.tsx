"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { useRouter } from "next/navigation"
import { Student } from "@/types/student"

interface EditStudentModalProps {
  student: Student | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (student: Student) => void
}

export function EditStudentModal({ student, open, onOpenChange, onSave }: EditStudentModalProps) {
  // Helper to split name
  function splitName(name: string) {
    const [last, rest] = name.split(", ");
    if (!rest) {
      return { firstName: last || "", middleName: "", lastName: "" };
    }
    const parts = rest.trim().split(" ");
    if (parts.length === 1) {
      return { firstName: parts[0], middleName: "", lastName: last || "" };
    }
    if (parts.length === 2) {
      return { firstName: parts[0], middleName: parts[1], lastName: last || "" };
    }
    return {
      firstName: parts.slice(0, parts.length - 1).join(" "),
      middleName: parts[parts.length - 1],
      lastName: last || "",
    };
  }
  // Helper to split yearSection
  function splitYearSection(yearSection: string) {
    const [yearLevel, section] = yearSection.split("&").map(s => s.trim());
    return { yearLevel: yearLevel || "", section: section || "" };
  }

  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    course: "",
    schoolYear: "",
    yearLevel: "",
    section: "",
    status: "",
    birthday: "",
    address: "",
    contactNumber: "",
    avatar: "",
    // ID-based fields for dropdowns
    courseId: "",
    yearLevelId: "",
    sectionId: "",
  });

  // Dynamic data and dependent filtering
  interface Course { course_id: number; course_code: string; course_name: string }
  interface YearLevel { year_level_id: number; name: string; course_id: number }
  interface Section { section_id: number; section_name: string; course_id: number; year_level_id: number }

  const [courses, setCourses] = useState<Course[]>([])
  const [yearLevels, setYearLevels] = useState<YearLevel[]>([])
  const [sections, setSections] = useState<Section[]>([])
  const [filteredYearLevels, setFilteredYearLevels] = useState<YearLevel[]>([])
  const [filteredSections, setFilteredSections] = useState<Section[]>([])
  const [loading, setLoading] = useState(false)
  const [existingStudents, setExistingStudents] = useState<any[]>([])
  const [errors, setErrors] = useState<Record<string, string | undefined>>({})

  useEffect(() => {
    if (student) {
      const { firstName, middleName, lastName } = splitName(student.name);
      const { yearLevel, section } = splitYearSection(student.yearSection);
      setFormData({
        id: student.id,
        firstName,
        middleName,
        lastName,
        email: student.email,
        password: "", // Don't populate password for security
        course: student.course,
        schoolYear: student.schoolYear,
        yearLevel,
        section,
        status: student.status,
        birthday: student.birthday || "",
        address: student.address || "",
        contactNumber: student.contact_number || "",
        avatar: student.avatar,
        courseId: student.course_id ? String(student.course_id) : "",
        // yearLevelId will be derived once sections are fetched
        yearLevelId: "",
        sectionId: student.section_id ? String(student.section_id) : "",
      });
    }
    if (!open) {
      setFormData({
        id: "",
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        password: "",
        course: "",
        schoolYear: "",
        yearLevel: "",
        section: "",
        status: "Enrolled",
        birthday: "",
        address: "",
        contactNumber: "",
        avatar: "",
        courseId: "",
        yearLevelId: "",
        sectionId: "",
      });
    }
  }, [student, open]);

  // Fetch existing students for validation
  const fetchExistingStudents = async () => {
    try {
      const response = await fetch('/api/admin/students')
      if (response.ok) {
        const data = await response.json()
        setExistingStudents(data.students || [])
      }
    } catch (error) {
      console.error('Error fetching existing students:', error)
    }
  }

  // Check for duplicate student within the modal (excluding current student)
  const checkDuplicateStudent = (email: string, studentId: string) => {
    return existingStudents.some(s => 
      s.email.toLowerCase() === email.toLowerCase() &&
      s.id !== studentId
    )
  }

  // Fetch dynamic options when modal opens
  useEffect(() => {
    const fetchAll = async () => {
      try {
        setLoading(true)
        const [coursesRes, yearLevelsRes, sectionsRes] = await Promise.all([
          fetch('/api/admin/course'),
          fetch('/api/admin/year-level'),
          fetch('/api/admin/sections'),
        ])
        
        // Fetch existing students for validation
        fetchExistingStudents()
        if (coursesRes.ok) {
          const data = await coursesRes.json()
          setCourses(data.courses || [])
        }
        if (yearLevelsRes.ok) {
          const data = await yearLevelsRes.json()
          setYearLevels(data.yearLevels || [])
        }
        if (sectionsRes.ok) {
          const data = await sectionsRes.json()
          const raw = (data.sections || []) as any[]
          const normalized: Section[] = raw
            .map((s: any) => {
              const section_id = s.section_id ?? (s.id ? parseInt(s.id) : undefined)
              const section_name = s.section_name ?? s.name
              const course_id = s.course_id ?? s.courses?.course_id
              const year_level_id = s.year_level_id ?? s.year_level?.year_level_id
              if (
                typeof section_id === 'number' &&
                typeof course_id === 'number' &&
                typeof year_level_id === 'number' &&
                typeof section_name === 'string'
              ) {
                return { section_id, section_name, course_id, year_level_id }
              }
              return undefined
            })
            .filter(Boolean) as Section[]
          setSections(normalized)
        }
      } finally {
        setLoading(false)
      }
    }
    if (open) fetchAll()
  }, [open])

  // Filter year levels by selected courseId
  useEffect(() => {
    if (formData.courseId && yearLevels.length > 0) {
      setFilteredYearLevels(yearLevels.filter(yl => yl.course_id === parseInt(formData.courseId!)))
    } else {
      setFilteredYearLevels([])
    }
  }, [formData.courseId, yearLevels])

  // Filter sections by selected courseId and yearLevelId
  useEffect(() => {
    if (formData.courseId && formData.yearLevelId && sections.length > 0) {
      setFilteredSections(sections.filter(s => s.course_id === parseInt(formData.courseId!) && s.year_level_id === parseInt(formData.yearLevelId!)))
    } else {
      setFilteredSections([])
    }
  }, [formData.courseId, formData.yearLevelId, sections])

  // Derive yearLevelId from existing sectionId once sections are loaded
  useEffect(() => {
    if (formData.sectionId && !formData.yearLevelId && sections.length > 0) {
      const sec = sections.find(s => s.section_id.toString() === formData.sectionId)
      if (sec) {
        setFormData(prev => ({ ...prev, yearLevelId: String(sec.year_level_id) }))
      }
    }
  }, [formData.sectionId, formData.yearLevelId, sections])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for duplicates before submitting (excluding current student)
    if (checkDuplicateStudent(formData.email, formData.id)) {
      setErrors({ general: `A student with the email "${formData.email}" already exists` });
      
      setTimeout(() => {
        setErrors({});
      }, 3000);
      
      return
    }
    
    // Merge names and yearSection
    const name = formData.middleName
      ? `${formData.lastName}, ${formData.firstName} ${formData.middleName}`
      : `${formData.lastName}, ${formData.firstName}`;
    const yearSection = `${formData.yearLevel} & ${formData.section}`;
    // Update internal IDs on the Student before handing off
    const updated: Student = {
      ...student!,
      id: formData.id,
      name,
      email: formData.email,
      course: formData.course,
      schoolYear: formData.schoolYear,
      yearSection,
      status: formData.status,
      birthday: formData.birthday || null,
      address: formData.address || null,
      contact_number: formData.contactNumber || null,
      avatar: formData.avatar,
      // keep existing db fields, but adjust ids if chosen
      student_id: student!.student_id,
      account_id: student!.account_id,
      section_id: formData.sectionId ? parseInt(formData.sectionId) : student!.section_id,
      course_id: formData.courseId ? parseInt(formData.courseId) : student!.course_id,
      department_id: student!.department_id,
    }
    onSave(updated);
    onOpenChange(false);
  };

  const isDisabled = !formData.id || !formData.firstName || !formData.lastName || !formData.email || !formData.course || !formData.schoolYear || !formData.yearLevel || !formData.section;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="font-bold text-black">Edit Student</DialogTitle>
          <DialogDescription className="text-sm text-gray-600 dark:text-gray-400">
            Update the student information.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-3 grid-cols-[120px_minmax(300px,_1fr)_250px] gap-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                value={formData.id}
                readOnly
                disabled
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input
                id="middleName"
                value={formData.middleName}
                onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="course">Course</Label>
            <Select 
              value={formData.courseId || ""}
              onValueChange={(value) => {
                const selected = courses.find(c => c.course_id.toString() === value)
                setFormData(prev => ({
                  ...prev,
                  courseId: value,
                  course: selected?.course_name || prev.course,
                  yearLevel: "",
                  yearLevelId: "",
                  section: "",
                  sectionId: "",
                }))
              }}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading courses..." : "Select course"} />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={`course-${course.course_id}`} value={course.course_id.toString()}>
                    {course.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="yearLevel">Year Level</Label>
              <Select
                value={formData.yearLevelId || ""}
                onValueChange={(value) => {
                  const yl = filteredYearLevels.find(y => y.year_level_id.toString() === value)
                  setFormData(prev => ({
                    ...prev,
                    yearLevelId: value,
                    yearLevel: yl?.name || prev.yearLevel,
                    section: "",
                    sectionId: "",
                  }))
                }}
                disabled={!formData.courseId || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.courseId ? "Select course first" : (filteredYearLevels.length ? "Select year level" : "No year levels available")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredYearLevels.map(yl => (
                    <SelectItem key={`yl-${yl.year_level_id}`} value={yl.year_level_id.toString()}>
                      {yl.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="section">Section</Label>
              <Select
                value={formData.sectionId || ""}
                onValueChange={(value) => {
                  const sec = filteredSections.find(s => s.section_id.toString() === value)
                  setFormData(prev => ({
                    ...prev,
                    sectionId: value,
                    section: sec?.section_name || prev.section,
                  }))
                }}
                disabled={!formData.yearLevelId || loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={!formData.yearLevelId ? "Select course and year level first" : (filteredSections.length ? "Select section" : "No sections available")} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSections.map(section => (
                    <SelectItem key={`section-${section.section_id}`} value={section.section_id.toString()}>
                      {section.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Enrolled">Enrolled</SelectItem>
                  <SelectItem value="Graduated">Graduated</SelectItem>
                  <SelectItem value="Dropout">Dropout</SelectItem>
                  <SelectItem value="Leave of Absence">Leave of Absence</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthday">Birthday</Label>
              <Input
                id="birthday"
                type="date"
                value={formData.birthday}
                onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Student address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                placeholder="+63 912 345 6789"
              />
            </div>
          </div>

          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isDisabled}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
