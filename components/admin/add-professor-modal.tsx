"use client"

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Eye, EyeOff, Loader2 } from "lucide-react";

interface AddProfessorModalProps {
  onAdd: (professor: any) => void;
}

interface Department {
  department_id: number;
  department_name: string;
}

// Password generation function
const generatePassword = (birthday: string): string => {
  // Format birthday as MM/DD/YYYY
  const date = new Date(birthday);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear().toString();
  
  // Use MM/DD/YYYY as default password
  return `${month}/${day}/${year}`;
};

export function AddProfessorModal({ onAdd }: AddProfessorModalProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    password: "",
    departmentId: "",
    department: "",
    facultyType: "",
    birthday: "",
    address: "",
    contactNumber: "",
    preferredTime: "",
    preferredDays: "",
  });
  const [isFormValid, setIsFormValid] = useState(false);

  // Auto-generate password when birthday changes
  useEffect(() => {
    if (formData.birthday) {
      const generatedPassword = generatePassword(formData.birthday);
      setFormData(prev => ({
        ...prev,
        password: generatedPassword
      }));
    } else {
      setFormData(prev => ({ ...prev, password: "" }));
    }
  }, [formData.birthday]);

  // Validate form whenever formData changes
  useEffect(() => {
    const isValid = formData.firstName.trim() !== "" && 
                   formData.lastName.trim() !== "" && 
                   formData.email.trim() !== "" && 
                   formData.departmentId !== "" && 
                   formData.facultyType !== "" &&
                   formData.birthday !== ""
    setIsFormValid(isValid);
  }, [formData]);

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
        password: "",
        departmentId: "",
        department: "",
        facultyType: "",
        birthday: "",
        address: "",
        contactNumber: "",
        preferredTime: "",
        preferredDays: "",
      });
      setShowPassword(false);
      setIsSubmitting(false);
    }
  }, [open]);

  const isDisabled = !isFormValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    
    try {
      // Call the API with the professor data
      await onAdd({
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
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
    } catch (error) {
      console.error('Error adding professor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2">
          <Plus className="w-4 h-4" />
          New Professor
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto dark:bg-black border-none transition-colors duration-300" onEscapeKeyDown={(e) => e.preventDefault()} onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader className="space-y-1">
          <DialogTitle className="font-bold text-black text-xl dark:text-white">Create Professor</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-gray-600">
            Add a new professor to the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-4 w-full">
            <div className="space-y-2 w-[70%]">
              <Label htmlFor="email" className="text-black">Email <strong className="text-red-600">*</strong></Label>
              <Input 
                id="email" 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                placeholder="professor@example.com"
                required 
                disabled={isSubmitting}
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
            <div className="space-y-2 w-[30%]">
              <Label htmlFor="contactNumber" className="text-black dark:text-white">Contact Number</Label>
              <Input 
                id="contactNumber" 
                value={formData.contactNumber} 
                onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} 
                placeholder="+63 912 345 6789"
                disabled={isSubmitting}
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-black dark:text-white">First Name <strong className="text-red-600">*</strong></Label>
              <Input 
                id="firstName" 
                value={formData.firstName} 
                onChange={e => setFormData({ ...formData, firstName: e.target.value })} 
                required
                disabled={isSubmitting}
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
              <Label htmlFor="lastName" className="text-black dark:text-white">Last Name <strong className="text-red-600">*</strong></Label>
              <Input 
                id="lastName" 
                value={formData.lastName} 
                onChange={e => setFormData({ ...formData, lastName: e.target.value })} 
                required 
                disabled={isSubmitting}
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department" className="text-black dark:text-white">Department <strong className="text-red-600">*</strong></Label>
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
                disabled={loading || isSubmitting}
              >
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600 dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
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
              <Label htmlFor="facultyType" className="text-black dark:text-white">Faculty Type <strong className="text-red-600">*</strong></Label>
              <Select 
                value={formData.facultyType} 
                onValueChange={v => setFormData({ ...formData, facultyType: v })}
                disabled={isSubmitting}
              >
                <SelectTrigger className="border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none cursor-pointer text-black dark:text-white data-[placeholder]:text-gray-400 dark:data-[placeholder]:text-gray-600 dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]">
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
              <Label htmlFor="birthday" className="text-black dark:text-white">Birthday <strong className="text-red-600">*</strong></Label>
              <Input 
                id="birthday" 
                type="date"
                value={formData.birthday} 
                onChange={e => setFormData({ ...formData, birthday: e.target.value })} 
                disabled={isSubmitting}
                className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-black dark:text-white">Password <strong className="text-red-600">*</strong></Label>
              <div className="relative">
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"}
                  value={formData.password || ""} 
                  onChange={e => setFormData({ ...formData, password: e.target.value })} 
                  placeholder="Password will be auto-generated"
                  readOnly
                  className="placeholder:text-gray-400 border border-[var(--customized-color-four)] !outline-none focus:!outline focus:!outline-2 focus:!outline-[var(--customized-color-two)] focus:!outline-offset-0 focus:!ring-0 focus:!border-none pr-10 dark:focus:!outline-[var(--darkmode-color-two)] dark:placeholder:text-gray-600 dark:bg-black bg-white dark:border-[var(--darkmode-color-four)]"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting} className="hover:bg-[var(--customized-color-five)] hover:border hover:border-[var(--customized-color-five)] hover:text-[var(--customized-color-one)] border border-[var(--customized-color-four)] dark:hover:bg-[var(--darkmode-color-five)] dark:hover:border-[var(--darkmode-color-five)] dark:hover:text-[var(--darkmode-color-one)] dark:border-[var(--darkmode-color-four)] dark:bg-black">
              Cancel
            </Button>
            <Button type="submit" disabled={isDisabled || isSubmitting} className="bg-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] text-white border-none flex items-center gap-2 dark:bg-[var(--darkmode-color-one)] dark:hover:bg-[var(--darkmode-color-two)] dark:text-black">
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding Professor...
                </>
              ) : (
                "Add Professor"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
