"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

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
  const [hasChanges, setHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [originalData, setOriginalData] = useState<any>(null);
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    departmentId: "",
    department: "",
    facultyType: "",
    status: "active",
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
      const initialData = {
        id: professor.id,
        firstName,
        middleName,
        lastName,
        email: professor.email,
        departmentId: professor.department_id.toString(),
        department: professor.department,
        facultyType: professor.facultyType,
        status: (professor.status || "").toLowerCase(),
        birthday: professor.birthday || "",
        address: professor.address || "",
        contactNumber: professor.contact_number || "",
        preferredTime: professor.preferred_time || "",
        preferredDays: professor.preferred_days || "",
      };
      setFormData(initialData);
      setOriginalData(initialData);
      setHasChanges(false);
    }
  }, [professor]);

  // Check for changes whenever formData changes
  useEffect(() => {
    if (originalData) {
      const changed = formData.firstName !== originalData.firstName ||
                     formData.middleName !== originalData.middleName ||
                     formData.lastName !== originalData.lastName ||
                     formData.email !== originalData.email ||
                     formData.departmentId !== originalData.departmentId ||
                     formData.facultyType !== originalData.facultyType ||
                     formData.status !== originalData.status ||
                     formData.birthday !== originalData.birthday ||
                     formData.address !== originalData.address ||
                     formData.contactNumber !== originalData.contactNumber ||
                     formData.preferredTime !== originalData.preferredTime ||
                     formData.preferredDays !== originalData.preferredDays
      setHasChanges(changed);
    }
  }, [formData, originalData]);

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
        status: "active",
        birthday: "",
        address: "",
        contactNumber: "",
        preferredTime: "",
        preferredDays: "",
      });
    }
  }, [open]);

  const isDisabled = !formData.id || !formData.firstName || !formData.lastName || !formData.email || !formData.departmentId || !formData.facultyType || !formData.status || !hasChanges;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      const name = formData.middleName
        ? `${formData.lastName}, ${formData.firstName} ${formData.middleName}`
        : `${formData.lastName}, ${formData.firstName}`;
      
      await onSave({
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
    } catch (error) {
      console.error('Error saving professor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-black border-none" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">Edit Professor</DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Update the professor information below.
          </DialogDescription>
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
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-black dark:text-white">First Name</Label>
              <Input 
                id="firstName" 
                value={formData.firstName} 
                onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                required
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="middleName" className="text-black dark:text-white">Middle Name (Optional)</Label>
              <Input 
                id="middleName" 
                value={formData.middleName} 
                onChange={e => setFormData({ ...formData, middleName: e.target.value })} 
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-black dark:text-white">Last Name</Label>
              <Input 
                id="lastName" 
                value={formData.lastName} 
                onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                required
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
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
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
                  <SelectValue placeholder={loading ? "Loading departments..." : "Select department"} />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                  {departments.map(dept => (
                    <SelectItem key={dept.department_id} value={dept.department_id.toString()} className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">
                      {dept.department_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultyType" className="text-black dark:text-white">Faculty Type</Label>
              <Select 
                value={formData.facultyType} 
                onValueChange={v => setFormData({ ...formData, facultyType: v })}
              >
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
                  <SelectValue placeholder="Select faculty type" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                  <SelectItem value="Full-Time" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Full-Time</SelectItem>
                  <SelectItem value="Part-Time" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Part-Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="birthday" className="text-black dark:text-white">Birthday</Label>
              <Input 
                id="birthday" 
                type="date"
                value={formData.birthday} 
                onChange={e => setFormData({ ...formData, birthday: e.target.value })} 
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-black dark:text-white">Address</Label>
              <Input 
                id="address" 
                value={formData.address} 
                onChange={e => setFormData({ ...formData, address: e.target.value })} 
                placeholder="Home address"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactNumber" className="text-black dark:text-white">Contact Number</Label>
              <Input 
                id="contactNumber" 
                value={formData.contactNumber} 
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} 
                placeholder="+63 912 345 6789"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="preferredTime" className="text-black dark:text-white">Preferred Time (Optional)</Label>
              <Input 
                id="preferredTime" 
                value={formData.preferredTime} 
                onChange={e => setFormData({ ...formData, preferredTime: e.target.value })} 
                placeholder="e.g., Morning, Afternoon"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="preferredDays" className="text-black dark:text-white">Preferred Days (Optional)</Label>
              <Input 
                id="preferredDays" 
                value={formData.preferredDays} 
                onChange={e => setFormData({ ...formData, preferredDays: e.target.value })} 
                placeholder="e.g., MWF, TTH"
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-black dark:text-white">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={v => setFormData({ ...formData, status: v })}
            >
              <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border border-[var(--customized-color-four)] shadow-lg rounded-md overflow-hidden dark:bg-black dark:border-[var(--darkmode-color-four)]">
                <SelectItem value="active" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Active</SelectItem>
                <SelectItem value="inactive" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Inactive</SelectItem>
                <SelectItem value="suspended" className="hover:bg-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] focus:bg-[var(--customized-color-five)] focus:text-[var(--customized-color-one)] cursor-pointer dark:hover:bg-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:focus:bg-[var(--darkmode-color-five)] dark:focus:text-[var(--darkmode-color-one)]">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting} className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black">
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled || isSubmitting} className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating Professor...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
