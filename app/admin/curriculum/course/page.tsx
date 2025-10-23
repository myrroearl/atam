"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Search, Download, Plus, ArrowDownAZ, ArrowDownZA } from "lucide-react";
import { CoursesTable } from "@/components/admin/courses-table";
import { AddCourseModal } from "@/components/admin/add-course-modal";
import { EditCourseModal } from "@/components/admin/edit-course-modal";
import { toast } from "@/components/ui/use-toast";

interface Course {
  code: string;
  name: string;
  department: string;
  duration: string;
  totalUnits: string;
  enrollment: string;
  majorSubjects: string;
  status: string;
}

const initialCourses = [
  {
    code: "BSIT",
    name: "Bachelor of Science in Information Technology",
    department: "College of Computer and Studies",
    duration: "4 years",
    totalUnits: "144 units",
    enrollment: "245 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSCS",
    name: "Bachelor of Science in Computer Science",
    department: "College of Computer and Studies",
    duration: "4 years",
    totalUnits: "144 units",
    enrollment: "190 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSN",
    name: "Bachelor of Science in Nursing",
    department: "College of Nursing",
    duration: "4 years",
    totalUnits: "142 units",
    enrollment: "220 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSECE",
    name: "Bachelor of Science in Electronics & Communications Engineering",
    department: "College of Engineering",
    duration: "4 years",
    totalUnits: "142 units",
    enrollment: "215 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSA",
    name: "Bachelor of Science in Accountancy",
    department: "College of Business and Accountancy",
    duration: "4 years",
    totalUnits: "140 units",
    enrollment: "562 students",
    majorSubjects: "8 subjects",
    status: "Inactive",
  },
  {
    code: "BSHM",
    name: "Bachelor of Science in Hospitality Management",
    department: "College of International Hospitality Management",
    duration: "4 years",
    totalUnits: "140 units",
    enrollment: "345 students",
    majorSubjects: "8 subjects",
    status: "Inactive",
  },
  {
    code: "BSBA",
    name: "Bachelor of Science in Business Administration major in Marketing Marketing",
    department: "College of Business and Accountancy",
    duration: "4 years",
    totalUnits: "138 units",
    enrollment: "239 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSENT",
    name: "Bachelor of Science in Business Administration major in Entrepreneurship",
    department: "College of Business and Accountancy",
    duration: "4 years",
    totalUnits: "138 units",
    enrollment: "429 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSED-ENG",
    name: "Bachelor of Secondary Education Major in English",
    department: "College of Education",
    duration: "4 years",
    totalUnits: "136 units",
    enrollment: "782 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSED-FIL",
    name: "Bachelor of Secondary Education Major in Filipino",
    department: "College of Education",
    duration: "4 years",
    totalUnits: "134 units",
    enrollment: "349 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BEEd",
    name: "Bachelor of Arts in Elementary Education",
    department: "College of Education",
    duration: "4 years",
    totalUnits: "134 units",
    enrollment: "349 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "BSMATH",
    name: "Bachelor of Science in Mathematics with Computer",
    department: "College of Education",
    duration: "4 years",
    totalUnits: "134 units",
    enrollment: "349 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
  {
    code: "MAN",
    name: "Master of Arts in Nursing",
    department: "College of Nursing",
    duration: "2 years",
    totalUnits: "134 units",
    enrollment: "349 students",
    majorSubjects: "8 subjects",
    status: "Active",
  },
];

const departmentOptions = [
  { value: "all-department", label: "All Department" },
  { value: "College of Computer and Studies", label: "College of Computer and Studies" },
  { value: "College of Engineering", label: "College of Engineering" },
  { value: "College of Business and Accountancy", label: "College of Business and Accountancy" },
  { value: "College of Education", label: "College of Education" },
  { value: "College of Nursing", label: "College of Nursing" },
  { value: "College of International Hospitality Management", label: "College of International Hospitality Management" },
];
const statusOptions = [
  { value: "all-status", label: "All Status" },
  { value: "Active", label: "Active" },
  { value: "Inactive", label: "Inactive" },
];

export default function CoursePage() {
  const [courses, setCourses] = useState(initialCourses);
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all-department");
  const [status, setStatus] = useState("all-status");
  const [sortAsc, setSortAsc] = useState(true);
  const [sortOrder, setSortOrder] = useState("asc");
  useEffect(() => {
    setSortAsc(sortOrder === "asc");
  }, [sortOrder]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editCourse, setEditCourse] = useState<Course | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  // Filtering, searching, sorting
  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      course.code.toLowerCase().includes(search.toLowerCase()) ||
      course.name.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment =
      department === "all-department" || course.department === department;
    const matchesStatus = status === "all-status" || course.status === status;
    return matchesSearch && matchesDepartment && matchesStatus;
  });
  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sortAsc) {
      return a.name.localeCompare(b.name);
    } else {
      return b.name.localeCompare(a.name);
    }
  });

  // Pagination
  const pageSize = 10;
  const totalPages = Math.ceil(sortedCourses.length / pageSize);
  useEffect(() => {
    setCurrentPage(1);
  }, [search, department, status]);

  // Loading simulation
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, [search, department, status, courses, currentPage]);

  // Add
  const handleAddCourse = (course: Course) => {
    setCourses((prev) => [{ ...course }, ...prev]);
    setShowAddModal(false);
    toast({ title: "Course added successfully" });
  };
  // Edit
  const handleEditCourse = (updated: Course) => {
    setCourses((prev) => prev.map((c) => (c.code === updated.code ? updated : c)));
    setShowEditModal(false);
    toast({ title: "Course updated successfully" });
  };
  // Delete
  const handleDeleteCourse = (code: string) => {
    setCourses((prev) => prev.filter((c) => c.code !== code));
    toast({ title: "Course deleted" });
  };
  // Open edit modal
  const handleOpenEdit = (course: Course) => {
    setEditCourse(course);
    setShowEditModal(true);
  };

  return (
    <div className="p-5 space-y-4 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-two)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Course Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400 font-light">Manage academic courses and students enrollment</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2 bg-white border-none text-[var(--customized-color-one)] hover:bg-green-50 dark:bg-black dark:text-white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)]">
            <Download className="w-4 h-4" />
            Export
          </Button>
          <AddCourseModal onAdd={handleAddCourse} />
        </div>
      </div>
      {/* Filters */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-[600px] text-[11px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input placeholder="Search course..." className="pl-9 text-[11px] placeholder-gray-600 placeholder:text-[11px] focus:outline-none focus:ring-2 focus:ring-green-500" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="min-w-[400px] text-[11px] pr-[8px] pl-[8px]">
            <SelectValue placeholder="All Department" />
          </SelectTrigger>
          <SelectContent>
            {departmentOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="min-w-[100px] text-[11px] pr-[8px] pl-[8px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant="ghost"
          className="flex items-center gap-1 border bg-white min-w-[90px] text-[11px] pr-[8px] pl-[8px]"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
        >
          Sort 
          {sortOrder === "asc" ? " Asc" : " Desc"}
          {sortOrder === "asc" ? <ArrowDownAZ  className="w-4 h-4" /> : <ArrowDownZA  className="w-4 h-4" />}
        </Button>
      </div>
      {/* Table */}
      <CoursesTable
        courses={sortedCourses}
        onDeleteCourse={handleDeleteCourse}
        onEditCourse={handleOpenEdit}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
      />
      {/* Add Modal */}

      {/* Edit Modal */}
      <EditCourseModal course={editCourse} open={showEditModal} onOpenChange={setShowEditModal} onSave={handleEditCourse} />
    </div>
  );
}