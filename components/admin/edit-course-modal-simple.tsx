import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

interface EditCourseModalProps {
  course: Course | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (course: Course) => void;
}

export default function EditCourseModal({ course, open, onOpenChange, onSave }: EditCourseModalProps) {
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    department: "",
    duration: "",
    totalUnits: "",
    enrollment: "",
    majorSubjects: "",
    status: "Active",
  });

  useEffect(() => {
    if (course) {
      setFormData({
        code: course.code,
        name: course.name,
        department: course.department,
        duration: course.duration,
        totalUnits: course.totalUnits,
        enrollment: course.enrollment,
        majorSubjects: course.majorSubjects,
        status: course.status,
      });
    }
  }, [course]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-code">Course Code</Label>
              <Input 
                id="edit-code" 
                value={formData.code} 
                onChange={e => setFormData({ ...formData, code: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Course Name</Label>
              <Input 
                id="edit-name" 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-department">Department</Label>
            <Input 
              id="edit-department" 
              value={formData.department} 
              onChange={e => setFormData({ ...formData, department: e.target.value })} 
              required 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-duration">Duration</Label>
              <Input 
                id="edit-duration" 
                value={formData.duration} 
                onChange={e => setFormData({ ...formData, duration: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-totalUnits">Total Units</Label>
              <Input 
                id="edit-totalUnits" 
                value={formData.totalUnits} 
                onChange={e => setFormData({ ...formData, totalUnits: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-enrollment">Enrollment</Label>
              <Input 
                id="edit-enrollment" 
                value={formData.enrollment} 
                onChange={e => setFormData({ ...formData, enrollment: e.target.value })} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-majorSubjects">Major Subjects</Label>
              <Input 
                id="edit-majorSubjects" 
                value={formData.majorSubjects} 
                onChange={e => setFormData({ ...formData, majorSubjects: e.target.value })} 
                required 
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-status">Status</Label>
            <Select value={formData.status} onValueChange={v => setFormData({ ...formData, status: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-700 hover:bg-green-800">
              Update Course
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
