"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface AddProfessorModalProps {
  onAdd: (professor: any) => void;
}

interface Department {
  department_id: number;
  department_name: string;
}

export function AddProfessorModal({ onAdd }: AddProfessorModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    departmentId: "",
    department: "",
    facultyType: "",
    birthday: "",
    address: "",
    contactNumber: "",
    preferredTime: "",
    preferredDays: "",
  });

  // Fetch departments when modal opens
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/department');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.departments || []);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      } finally {
        setLoading(false);
      }
    };

    if (open) {
      fetchDepartments();
    }
  }, [open]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        departmentId: "",
        department: "",
        facultyType: "",
        birthday: "",
        address: "",
        contactNumber: "",
        preferredTime: "",
        preferredDays: "",
      });
    }
  }, [open]);

  const isDisabled = !formData.firstName || !formData.lastName || !formData.email || !formData.departmentId || !formData.facultyType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Call the API with the professor data
    await onAdd({
      firstName: formData.firstName,
      middleName: formData.middleName,
      lastName: formData.lastName,
      email: formData.email,
      department: formData.department,
      departmentId: formData.departmentId,
      facultyType: formData.facultyType,
      birthday: formData.birthday,
      address: formData.address,
      contactNumber: formData.contactNumber,
      preferredTime: formData.preferredTime,
      preferredDays: formData.preferredDays,
    });
    
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Professor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="font-bold text-black">Add Professor</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-400">
            Add a new professor to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({ ...formData, email: e.target.value })} 
              placeholder="professor@example.com"
              required 
              className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName" 
                value={formData.firstName} 
                onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                required
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input 
                id="middleName" 
                value={formData.middleName} 
                onChange={e => setFormData({ ...formData, middleName: e.target.value })} 
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName} 
                onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                required 
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Select 
                value={formData.departmentId}
                onValueChange={(value) => {
                  const dept = departments.find(d => d.department_id.toString() === value);
                  setFormData({ 
                    ...formData, 
                    departmentId: value,
                    department: dept?.department_name || ""
                  });
                }}
                disabled={loading}
              >
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600">
                  <SelectValue placeholder={loading ? "Loading departments..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultyType">Faculty Type</Label>
              <Select 
                value={formData.facultyType} 
                onValueChange={v => setFormData({ ...formData, facultyType: v })}
              >
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600">
                  <SelectValue placeholder="Select faculty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-Time" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Full-Time</SelectItem>
                  <SelectItem value="Part-Time" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer">Part-Time</SelectItem>
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
                onChange={e => setFormData({ ...formData, birthday: e.target.value })} 
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
              <p className="text-xs text-gray-500">Password will be auto-generated from birthday (MMDDYYYY)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={e => setFormData({ ...formData, address: e.target.value })} 
                placeholder="Home address"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input 
                id="contactNumber" 
                value={formData.contactNumber} 
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} 
                placeholder="+63 912 345 6789"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
              <Input 
                id="preferredTime" 
                value={formData.preferredTime} 
                onChange={e => setFormData({ ...formData, preferredTime: e.target.value })} 
                placeholder="e.g., Morning, Afternoon"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredDays">Preferred Days (Optional)</Label>
              <Input 
                id="preferredDays" 
                value={formData.preferredDays} 
                onChange={e => setFormData({ ...formData, preferredDays: e.target.value })} 
                placeholder="e.g., MWF, TTH"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] w-[50%]">
              Cancel
            </Button>
            <Button type="submit" className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 w-[50%]" disabled={isDisabled}>
              Add Professor
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
