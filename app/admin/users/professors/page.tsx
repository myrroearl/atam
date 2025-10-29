"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, Search, Download, Plus, ArrowUpDown, ArrowDownAZ, ArrowDownZA } from "lucide-react"
import Image from "next/image"
import { AddProfessorModal } from "@/components/admin/add-professor-modal";
import { ProfessorsTable } from "@/components/admin/professors-table";
import { ProfessorsPageSkeleton } from "@/components/admin/page-skeletons";

interface Professor {
  id: string;
  name: string;
  email: string;
  department: string;
  subjects: string[];
  sections: string[];
  facultyType: string;
  status: string;
  avatar: string;
  prof_id: number;
  account_id: number;
  department_id: number;
  birthday?: string;
  address?: string;
  contact_number?: string;
  preferred_time?: string;
  preferred_days?: string;
  created_at: string;
  updated_at: string;
}

export default function ProfessorsPage() {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all-department");
  const [facultyTypeFilter, setFacultyTypeFilter] = useState("all-faculty");
  const [statusFilter, setStatusFilter] = useState("all-status");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  // Fetch professors from API
  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/professors')
        if (!response.ok) {
          throw new Error('Failed to fetch professors')
        }
        const data = await response.json()
        setProfessors(data.professors)
      } catch (error) {
        console.error('Error fetching professors:', error)
        toast.error('Failed to fetch professors')
      } finally {
        setLoading(false)
      }
    }

    fetchProfessors()
  }, [])

  useEffect(() => {
    setCurrentPage(1);
  }, [search, departmentFilter, facultyTypeFilter, statusFilter, sortOrder]);

  // Check for duplicate professor
  const checkDuplicateProfessor = (email: string, professorId?: string) => {
    return professors.some(professor => 
      professor.email.toLowerCase() === email.toLowerCase() &&
      professor.id !== professorId
    )
  }

  // Handle validation error
  const handleValidationError = (message: string) => {
    setError(message)
    setTimeout(() => setError(null), 5000) // Clear error after 5 seconds
  }

  const handleAddProfessor = async (prof: any) => {
    // Check for duplicates before submitting
    if (checkDuplicateProfessor(prof.email)) {
      handleValidationError(`A professor with the email "${prof.email}" already exists`)
      return
    }
    
    setError(null) // Clear any previous errors
    try {
      console.log("Sending professor data:", prof);
      
      const response = await fetch('/api/admin/professors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: prof.firstName,
          middleName: prof.middleName,
          lastName: prof.lastName,
          email: prof.email,
          department: prof.department,
          departmentId: prof.departmentId,
          facultyType: prof.facultyType,
          birthday: prof.birthday,
          address: prof.address,
          contactNumber: prof.contactNumber,
          preferredTime: prof.preferredTime,
          preferredDays: prof.preferredDays,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Server error response:", errorData);
        throw new Error(errorData.error || 'Failed to add professor')
      }

      const result = await response.json()
      console.log("Professor created successfully:", result);
      setProfessors((prev) => [result.professor, ...prev])
      toast.success("Professor added successfully!");
    } catch (error) {
      console.error('Error adding professor:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to add professor')
    }
  };

  const handleEditProfessor = async (updatedProf: Professor): Promise<void> => {
    // Check for duplicates (excluding the current professor being edited)
    if (checkDuplicateProfessor(updatedProf.email, updatedProf.id)) {
      handleValidationError(`A professor with the email "${updatedProf.email}" already exists`)
      return
    }
    
    setError(null) // Clear any previous errors
    try {
      const response = await fetch('/api/admin/professors', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prof_id: updatedProf.prof_id,
          firstName: updatedProf.name.split(', ')[1]?.split(' ')[0] || '',
          middleName: updatedProf.name.split(', ')[1]?.split(' ').slice(1).join(' ') || '',
          lastName: updatedProf.name.split(', ')[0] || '',
          email: updatedProf.email,
          department: updatedProf.department,
          departmentId: String(updatedProf.department_id),
          facultyType: updatedProf.facultyType,
          status: updatedProf.status,
          birthday: updatedProf.birthday,
          address: updatedProf.address,
          contactNumber: updatedProf.contact_number,
          preferredTime: updatedProf.preferred_time,
          preferredDays: updatedProf.preferred_days
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update professor');
      }

      const data = await response.json();
      setProfessors((prev) => prev.map((p) => (p.id === updatedProf.id ? data.professor : p)));
      toast.success("Professor updated successfully!");
    } catch (error) {
      console.error('Error updating professor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update professor');
    }
  };

  const handleDeleteProfessor = async (profId: string) => {
    try {
      const professor = professors.find(p => p.id === profId);
      if (!professor) return;

      const response = await fetch(`/api/admin/professors?prof_id=${professor.prof_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete professor');
      }

      setProfessors((prev) => prev.filter((p) => p.id !== profId));
      toast.success("Professor deleted successfully!");
    } catch (error) {
      console.error('Error deleting professor:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete professor');
    }
  };

  // Helper to get last name for sorting
  function getLastName(name: string) {
    const [last] = name.split(",");
    return last ? last.trim().toLowerCase() : name.toLowerCase();
  }

  // Filtering and sorting logic
  let filtered = professors.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase()) ||
      p.id.toLowerCase().includes(search.toLowerCase()) ||
      p.department.toLowerCase().includes(search.toLowerCase());
    const matchesDepartment = departmentFilter === "all-department" || p.department === departmentFilter;
    const matchesFacultyType = facultyTypeFilter === "all-faculty" || p.facultyType === facultyTypeFilter;
    const matchesStatus =
      statusFilter === "all-status" || (p.status || "").toLowerCase() === statusFilter;
    return matchesSearch && matchesDepartment && matchesFacultyType && matchesStatus;
  });

  filtered = filtered.sort((a, b) => {
    const lastA = getLastName(a.name);
    const lastB = getLastName(b.name);
    if (lastA < lastB) return sortOrder === "asc" ? -1 : 1;
    if (lastA > lastB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  if (loading) {
    return <ProfessorsPageSkeleton />
  }

  return (
    <div className="p-5 space-y-6 w-full bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-extrabold text-black dark:text-white">Professors Management</h1>
          <p className="text-lg text-gray-700 dark:text-gray-400">Manage faculty accounts, departments, and subject assignments</p>
        </div>
        <div className="flex items-center gap-3">
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              {error}
            </div>
          )}
          <AddProfessorModal onAdd={handleAddProfessor} />
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-[500px] text-[11px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-3 h-3" />
          <Input
            placeholder="Search professor..."
            className="pl-9 text-[11px] placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:text-[11px] !border-none !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-one)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none bg-white dark:bg-black"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
          <SelectTrigger className="min-w-[300px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all-department" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Department</SelectItem>
            {[...new Set(professors.map(p => p.department))].map(dep => (
              <SelectItem key={dep} value={dep} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">{dep}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={facultyTypeFilter} onValueChange={setFacultyTypeFilter}>
          <SelectTrigger className="min-w-[150px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Faculty Type" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-faculty" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Faculty Type</SelectItem>
            <SelectItem value="Full-Time" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Full-Time</SelectItem>
            <SelectItem value="Part-Time" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Part-Time</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="min-w-[100px] text-[11px] pr-[8px] pl-[8px] bg-white dark:bg-black !border-none !outline-none focus:!outline-none focus:!border-none focus:!ring-0 focus:!ring-offset-0">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent className="text-[11px]">
            <SelectItem value="all-status" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">All Status</SelectItem>
            <SelectItem value="active" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Active</SelectItem>
            <SelectItem value="inactive" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Inactive</SelectItem>
            <SelectItem value="suspended" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Suspended</SelectItem>
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
                <ArrowDownAZ className="w-3 h-3 text-[var(--customized-color-one)]" />
              </>
            ) : (
              <>
                <ArrowDownZA className="w-3 h-3 text-[var(--customized-color-one)]" />
              </>
            )}
          </div>
        </Button>
      </div>

      {/* Table */}
      <ProfessorsTable
        professors={filtered}
        onDeleteProfessor={handleDeleteProfessor}
        onEditProfessor={handleEditProfessor}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        loading={loading}
      />
    </div>
  );
}