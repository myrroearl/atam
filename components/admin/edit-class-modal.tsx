"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

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

interface EditClassModalProps {
  classData: Class | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (classData: Class) => void;
}

interface Course {
  course_id: number;
  course_code: string;
  course_name: string;
  department_id: number;
}

interface Subject {
  subject_id: number;
  subject_code: string;
  subject_name: string;
  course_id: number;
}

interface Section {
  section_id: number;
  name: string; // Changed from section_name to match API response
  course_id: number;
  year_level_id: number;
}

interface Department {
  department_id: number;
  department_name: string;
}

interface Professor {
  prof_id: number;
  first_name: string;
  middle_name: string;
  last_name: string;
  name: string;
  department_id: number;
}

export function EditClassModal({ classData, open, onOpenChange, onSave }: EditClassModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    courseId: "",
    subjectId: "",
    sectionId: "",
    departmentId: "",
    professorId: "",
    scheduleStart: "",
    scheduleEnd: "",
  });

  // Data arrays
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [professors, setProfessors] = useState<Professor[]>([]);

  // Filtered arrays based on selections
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [filteredSections, setFilteredSections] = useState<Section[]>([]);
  const [filteredProfessors, setFilteredProfessors] = useState<Professor[]>([]);

  const [loading, setLoading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      fetchAllData();
    }
  }, [open]);

  // Populate form when classData changes
  useEffect(() => {
    if (open && classData) {
      // Enhanced debugging for schedule data
      console.log('\n🔍 ═══════════════════════════════════════════════════════════');
      console.log('🔍 EDIT CLASS MODAL: Processing class data');
      console.log('🔍 ═══════════════════════════════════════════════════════════');
      console.log('🔍 Class ID:', classData.class_id);
      console.log('🔍 Class Name:', classData.name);
      console.log('🔍 Raw schedule_start from API:', classData.schedule_start);
      console.log('🔍 Raw schedule_end from API:', classData.schedule_end);
      console.log('🔍 Type of schedule_start:', typeof classData.schedule_start);
      console.log('🔍 Type of schedule_end:', typeof classData.schedule_end);

      // Format schedule data for datetime-local input (YYYY-MM-DDTHH:MM)
      const formatForDateTimeLocal = (scheduleString: string | null) => {
        if (!scheduleString) return "";
        
        // Handle YYYY-MM-DD HH:MM:SS format from database
        if (scheduleString.includes(' ')) {
          return scheduleString.replace(' ', 'T').substring(0, 16); // Convert to YYYY-MM-DDTHH:MM
        }
        
        // Handle YYYY-MM-DDTHH:MM format (already correct)
        if (scheduleString.includes('T')) {
          return scheduleString.substring(0, 16); // Ensure it's YYYY-MM-DDTHH:MM
        }
        
        return "";
      };

      const formattedStart = formatForDateTimeLocal(classData.schedule_start);
      const formattedEnd = formatForDateTimeLocal(classData.schedule_end);

      console.log('🔍 Formatting schedule data for datetime-local:');
      console.log('🔍 Raw schedule_start:', classData.schedule_start);
      console.log('🔍 Formatted schedule_start:', formattedStart);
      console.log('🔍 Raw schedule_end:', classData.schedule_end);
      console.log('🔍 Formatted schedule_end:', formattedEnd);
      console.log('🔍 ═══════════════════════════════════════════════════════════\n');

      setFormData({
        name: classData.name,
        courseId: classData.course_id ? classData.course_id.toString() : "",
        subjectId: classData.subject_id ? classData.subject_id.toString() : "",
        sectionId: classData.section_id ? classData.section_id.toString() : "",
        departmentId: classData.department_id ? classData.department_id.toString() : "",
        professorId: classData.prof_id ? classData.prof_id.toString() : "",
        scheduleStart: formattedStart,
        scheduleEnd: formattedEnd,
      });
    }
  }, [open, classData]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchCourses(),
        fetchSubjects(),
        fetchSections(),
        fetchDepartments(),
        fetchProfessors(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await fetch('/api/admin/course');
      if (response.ok) {
        const data = await response.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subject');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  };

  const fetchSections = async () => {
    try {
      const response = await fetch('/api/admin/sections');
      if (response.ok) {
        const data = await response.json();
        setSections(data.sections || []);
      }
    } catch (error) {
      console.error('Error fetching sections:', error);
    }
  };

  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/department');
      if (response.ok) {
        const data = await response.json();
        setDepartments(data.departments || []);
      }
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchProfessors = async () => {
    try {
      const response = await fetch('/api/admin/professors');
      if (response.ok) {
        const data = await response.json();
        setProfessors(data.professors || []);
      }
    } catch (error) {
      console.error('Error fetching professors:', error);
    }
  };

  // Filter subjects and sections when course changes
  useEffect(() => {
    if (formData.courseId && subjects.length > 0 && sections.length > 0) {
      const courseIdNum = parseInt(formData.courseId);
      setFilteredSubjects(subjects.filter(s => s.course_id === courseIdNum));
      setFilteredSections(sections.filter(s => s.course_id === courseIdNum));
    } else {
      setFilteredSubjects([]);
      setFilteredSections([]);
    }
  }, [formData.courseId, subjects, sections]);

  // Filter professors when department changes
  useEffect(() => {
    if (formData.departmentId && professors.length > 0) {
      const deptIdNum = parseInt(formData.departmentId);
      setFilteredProfessors(professors.filter(p => p.department_id === deptIdNum));
    } else {
      setFilteredProfessors(professors);
    }
  }, [formData.departmentId, professors]);

  const isDisabled = !formData.name || !formData.courseId || !formData.subjectId || !formData.sectionId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!classData || isDisabled) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Check if schedule fields are filled
    if (!formData.scheduleStart || !formData.scheduleEnd) {
      toast.error("Please fill in schedule start and end times");
      return;
    }

    // Convert datetime-local format to database format
    const formatForDatabase = (datetimeLocal: string) => {
      if (!datetimeLocal) return null;
      // Convert YYYY-MM-DDTHH:MM to YYYY-MM-DD HH:MM:00
      return datetimeLocal.replace('T', ' ') + ':00';
    };

    const scheduleStart = formatForDatabase(formData.scheduleStart);
    const scheduleEnd = formatForDatabase(formData.scheduleEnd);

    // Enhanced debugging for form submission
    console.log('\n🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 EDIT CLASS MODAL: Form submission data');
    console.log('🔍 ═══════════════════════════════════════════════════════════');
    console.log('🔍 Class ID:', classData.class_id);
    console.log('🔍 Form schedule_start (datetime-local):', formData.scheduleStart);
    console.log('🔍 Formatted schedule_start (database):', scheduleStart);
    console.log('🔍 Form schedule_end (datetime-local):', formData.scheduleEnd);
    console.log('🔍 Formatted schedule_end (database):', scheduleEnd);
    console.log('🔍 ═══════════════════════════════════════════════════════════\n');

    setLoading(true);
    try {
      const requestBody = {
        class_id: classData.class_id,
        name: formData.name,
        subjectId: formData.subjectId,
        sectionId: formData.sectionId,
        professorId: formData.professorId || null,
        scheduleStart: scheduleStart,
        scheduleEnd: scheduleEnd,
      };

      console.log('🔍 Sending PUT request with body:', requestBody);

      const response = await fetch('/api/admin/classes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update class');
      }

      const result = await response.json();
      
      console.log('\n🔍 ═══════════════════════════════════════════════════════════');
      console.log('🔍 EDIT CLASS MODAL: Update response received');
      console.log('🔍 ═══════════════════════════════════════════════════════════');
      console.log('🔍 Updated class data:', result.class);
      console.log('🔍 Updated schedule_start:', result.class.schedule_start);
      console.log('🔍 Updated schedule_end:', result.class.schedule_end);
      
      // Verify schedule data integrity
      const scheduleIntegrity = {
        originalStart: formData.scheduleStart,
        originalEnd: formData.scheduleEnd,
        receivedStart: result.class.schedule_start,
        receivedEnd: result.class.schedule_end,
        startMatch: formData.scheduleStart === result.class.schedule_start || 
                   (formData.scheduleStart && result.class.schedule_start && 
                    formData.scheduleStart.replace('T', ' ') === result.class.schedule_start),
        endMatch: formData.scheduleEnd === result.class.schedule_end || 
                 (formData.scheduleEnd && result.class.schedule_end && 
                  formData.scheduleEnd.replace('T', ' ') === result.class.schedule_end)
      };
      
      console.log('🔍 Schedule integrity check:', scheduleIntegrity);
      console.log('🔍 ═══════════════════════════════════════════════════════════\n');

      onSave(result.class);
      onOpenChange(false);
      toast.success("Class updated successfully!");
    } catch (error) {
      console.error('Error updating class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update class');
    } finally {
      setLoading(false);
    }
  };

  if (!classData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-bold text-black">Edit Class</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">Update the class information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Class Name <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Programming 1 - BSIT-1A"
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              required
              disabled={loading}
            />
          </div>

          {/* Course Selection - Drives Subject and Section filters */}
          <div className="space-y-2">
            <Label htmlFor="course">Course <span className="text-red-500">*</span></Label>
            <Select
              value={formData.courseId}
              onValueChange={(value) => {
                setFormData({ 
                  ...formData, 
                  courseId: value,
                  subjectId: "",
                  sectionId: ""
                });
              }}
              disabled={loading}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer">
                <SelectValue placeholder="Select Course (e.g., BSIT, BSCS)" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.course_id} value={course.course_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                    {course.course_code} - {course.course_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Subject - Filtered by Course */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject <span className="text-red-500">*</span></Label>
              <Select
                value={formData.subjectId}
                onValueChange={(value) => setFormData({ ...formData, subjectId: value })}
                disabled={!formData.courseId || loading}
              >
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer">
                  <SelectValue placeholder={!formData.courseId ? "Select course first" : "Select Subject"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSubjects.map((subject) => (
                    <SelectItem key={subject.subject_id} value={subject.subject_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                      {subject.subject_code} - {subject.subject_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section - Filtered by Course */}
            <div className="space-y-2">
              <Label htmlFor="section">Section <span className="text-red-500">*</span></Label>
              <Select
                value={formData.sectionId}
                onValueChange={(value) => setFormData({ ...formData, sectionId: value })}
                disabled={!formData.courseId || loading}
              >
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer">
                  <SelectValue placeholder={!formData.courseId ? "Select course first" : "Select Section"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSections.map((section) => (
                    <SelectItem key={section.section_id} value={section.section_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                      {section.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Department Selection - Drives Professor filter */}
          <div className="space-y-2">
            <Label htmlFor="department">Department (Optional)</Label>
            <Select
              value={formData.departmentId}
              onValueChange={(value) => {
                setFormData({ 
                  ...formData, 
                  departmentId: value,
                  professorId: ""
                });
              }}
              disabled={loading}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer">
                <SelectValue placeholder="Select Department (e.g., CCS)" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem key={dept.department_id} value={dept.department_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                    {dept.department_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Professor - Filtered by Department */}
          <div className="space-y-2">
            <Label htmlFor="professor">Professor <strong className="text-red-500">*</strong></Label>
            <Select
              value={formData.professorId}
              onValueChange={(value) => setFormData({ ...formData, professorId: value })}
              disabled={!formData.departmentId || loading}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer">
                <SelectValue placeholder={!formData.departmentId ? "Select department first" : "Select Professor or leave unassigned"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {filteredProfessors.map((professor) => (
                  <SelectItem key={professor.prof_id} value={professor.prof_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                    {professor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleStart">Schedule Start</Label>
              <Input
                id="scheduleStart"
                type="datetime-local"
                value={formData.scheduleStart}
                onChange={(e) => setFormData({ ...formData, scheduleStart: e.target.value })}
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"  
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scheduleEnd">Schedule End</Label>
              <Input
                id="scheduleEnd"
                type="datetime-local"
                value={formData.scheduleEnd}
                onChange={(e) => setFormData({ ...formData, scheduleEnd: e.target.value })}
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isDisabled || loading}
              className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 w-[50%]"
            >
              {loading ? "Updating..." : "Update Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
