"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface EditProfessorModalProps {
  professor: Professor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (professor: Professor) => void;
}

interface Department {
  department_id: number;
  department_name: string;
}

export function EditProfessorModal({ professor, open, onOpenChange, onSave }: EditProfessorModalProps) {
  function splitName(name: string) {
    const [last, rest] = name.split(", ");
    if (!rest) return { firstName: last || "", middleName: "", lastName: "" };
    const parts = rest.trim().split(" ");
    if (parts.length === 1) return { firstName: parts[0], middleName: "", lastName: last || "" };
    if (parts.length === 2) return { firstName: parts[0], middleName: parts[1], lastName: last || "" };
    return {
      firstName: parts.slice(0, parts.length - 1).join(" "),
      middleName: parts[parts.length - 1],
      lastName: last || "",
    };
  }

  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    departmentId: "",
    department: "",
    facultyType: "",
    status: "Active",
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

  // Populate form when professor data changes
  useEffect(() => {
    if (professor) {
      const { firstName, middleName, lastName } = splitName(professor.name);
      setFormData({
        id: professor.id,
        firstName,
        middleName,
        lastName,
        email: professor.email,
        departmentId: professor.department_id.toString(),
        department: professor.department,
        facultyType: professor.facultyType,
        status: professor.status,
        birthday: professor.birthday || "",
        address: professor.address || "",
        contactNumber: professor.contact_number || "",
        preferredTime: professor.preferred_time || "",
        preferredDays: professor.preferred_days || "",
      });
    }
  }, [professor]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setFormData({
        id: "",
        firstName: "",
        middleName: "",
        lastName: "",
        email: "",
        departmentId: "",
        department: "",
        facultyType: "",
        status: "Active",
        birthday: "",
        address: "",
        contactNumber: "",
        preferredTime: "",
        preferredDays: "",
      });
    }
  }, [open]);

  const isDisabled = !formData.id || !formData.firstName || !formData.lastName || !formData.email || !formData.departmentId || !formData.facultyType || !formData.status;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.middleName
      ? `${formData.lastName}, ${formData.firstName} ${formData.middleName}`
      : `${formData.lastName}, ${formData.firstName}`;
    
    onSave({
      ...professor!,
      id: formData.id,
      name,
      email: formData.email,
      department: formData.department,
      facultyType: formData.facultyType,
      status: formData.status,
      birthday: formData.birthday,
      address: formData.address,
      contact_number: formData.contactNumber,
      preferred_time: formData.preferredTime,
      preferred_days: formData.preferredDays,
      department_id: parseInt(formData.departmentId),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Professor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="id">Employee ID</Label>
              <Input 
                id="id" 
                value={formData.id} 
                readOnly
                disabled
                className="bg-gray-100"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
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
                onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName">Middle Name (Optional)</Label>
              <Input 
                id="middleName" 
                value={formData.middleName} 
                onChange={e => setFormData({ ...formData, middleName: e.target.value })} 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName} 
                onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                required 
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
                    department: dept?.department_name || formData.department
                  });
                }}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loading ? "Loading departments..." : "Select department"} />
                </SelectTrigger>
                <SelectContent>
                  {departments.map(dept => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()}>
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
                <SelectTrigger>
                  <SelectValue placeholder="Select faculty type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-Time">Full-Time</SelectItem>
                  <SelectItem value="Part-Time">Part-Time</SelectItem>
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={e => setFormData({ ...formData, address: e.target.value })} 
                placeholder="Home address"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber">Contact Number</Label>
              <Input 
                id="contactNumber" 
                value={formData.contactNumber} 
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} 
                placeholder="+63 912 345 6789"
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
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredDays">Preferred Days (Optional)</Label>
              <Input 
                id="preferredDays" 
                value={formData.preferredDays} 
                onChange={e => setFormData({ ...formData, preferredDays: e.target.value })} 
                placeholder="e.g., MWF, TTH"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={v => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Resigned">Resigned</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
  );
}
