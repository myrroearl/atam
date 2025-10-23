"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

interface AddClassModalProps {
  onAdd: (classData: any) => void;
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

export function AddClassModal({ onAdd }: AddClassModalProps) {
  const [open, setOpen] = useState(false);
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

  useEffect(() => {
    if (!open) {
      setFormData({
        name: "",
        courseId: "",
        subjectId: "",
        sectionId: "",
        departmentId: "",
        professorId: "",
        scheduleStart: "",
        scheduleEnd: "",
      });
    } else {
      fetchAllData();
    }
  }, [open]);

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
        console.log('Courses fetched:', data.courses?.length || 0);
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('❌ Error fetching courses:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await fetch('/api/admin/subject');
      if (response.ok) {
        const data = await response.json();
        console.log('Subjects fetched:', data.subjects?.length || 0);
        setSubjects(data.subjects || []);
      } else {
        const errorData = await response.json();
        console.error('❌ Failed to fetch subjects:', response.status, errorData);
      }
    } catch (error) {
      console.error('❌ Error fetching subjects:', error);
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
    if (formData.courseId) {
      const courseIdNum = parseInt(formData.courseId);
      const filteredSubjs = subjects.filter(s => s.course_id === courseIdNum);
      const filteredSects = sections.filter(s => s.course_id === courseIdNum);
      
      console.log(`🔍 Filtering for course ID ${courseIdNum}:`);
      console.log(`   - Total subjects: ${subjects.length}, Filtered: ${filteredSubjs.length}`);
      console.log(`   - Total sections: ${sections.length}, Filtered: ${filteredSects.length}`);
      
      setFilteredSubjects(filteredSubjs);
      setFilteredSections(filteredSects);
    } else {
      setFilteredSubjects([]);
      setFilteredSections([]);
    }
    // Reset dependent fields
    setFormData(prev => ({ ...prev, subjectId: "", sectionId: "" }));
  }, [formData.courseId, subjects, sections]);

  // Filter professors when department changes
  useEffect(() => {
    if (formData.departmentId) {
      const deptIdNum = parseInt(formData.departmentId);
      setFilteredProfessors(professors.filter(p => p.department_id === deptIdNum));
    } else {
      setFilteredProfessors([]);
    }
    // Reset professor field
    setFormData(prev => ({ ...prev, professorId: "" }));
  }, [formData.departmentId, professors]);

  const isDisabled = !formData.name || !formData.courseId || !formData.subjectId || !formData.sectionId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isDisabled) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const requestBody = {
        name: formData.name,
        subjectId: formData.subjectId,
        sectionId: formData.sectionId,
        professorId: formData.professorId || null,
        scheduleStart: formData.scheduleStart || null,
        scheduleEnd: formData.scheduleEnd || null,
      };

      console.log('📤 Creating class with data:', requestBody);

      const response = await fetch('/api/admin/classes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Server error:', errorData);
        throw new Error(errorData.error || 'Failed to add class');
      }

      const result = await response.json();
      console.log('Class created:', result);
      onAdd(result.class);
      setOpen(false);
      toast.success("Class added successfully!");
    } catch (error) {
      console.error('❌ Error adding class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add class');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Class
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-bold text-black">Create Class</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Add a new class to the system and assign subject to the professor
          </DialogDescription>
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
              onValueChange={(value) => setFormData({ ...formData, courseId: value })}
              disabled={loading}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600">
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
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600">
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
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600">
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
              onValueChange={(value) => setFormData({ ...formData, departmentId: value })}
              disabled={loading}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600">
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
            <Label htmlFor="professor">Professors</Label>
            <Select
              value={formData.professorId}
              onValueChange={(value) => setFormData({ ...formData, professorId: value })}
              disabled={!formData.departmentId || loading}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600">
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

          {/* Schedule (Philippine Time - Asia/Manila) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="scheduleStart">Schedule Start (Philippine Time)</Label>
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
              <Label htmlFor="scheduleEnd">Schedule End (Philippine Time)</Label>
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
              onClick={() => setOpen(false)}
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
              {loading ? "Adding..." : "Add Class"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
