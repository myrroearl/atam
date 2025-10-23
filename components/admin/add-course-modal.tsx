import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface AddCourseModalProps {
  onAdd: (course: {
    code: string;
    name: string;
    department: string;
    duration: string;
    totalUnits: string;
    enrollment: string;
    majorSubjects: string;
    status: string;
  }) => void;
}

export function AddCourseModal({ onAdd }: AddCourseModalProps) {
  const [open, setOpen] = useState(false);
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
    if (!open) {
      setFormData({
        code: "",
        name: "",
        department: "",
        duration: "",
        totalUnits: "",
        enrollment: "",
        majorSubjects: "",
        status: "Active",
      });
    }
  }, [open]);

  const isDisabled = !formData.code || !formData.name || !formData.department || !formData.duration || !formData.totalUnits || !formData.enrollment || !formData.majorSubjects || !formData.status;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({ ...formData });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-green-700 hover:bg-green-800 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Course
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Course Name</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input id="department" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input id="duration" value={formData.duration} onChange={e => setFormData({ ...formData, duration: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total Units</Label>
              <Input id="totalUnits" value={formData.totalUnits} onChange={e => setFormData({ ...formData, totalUnits: e.target.value })} required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="enrollment">Enrollment</Label>
              <Input id="enrollment" value={formData.enrollment} onChange={e => setFormData({ ...formData, enrollment: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="majorSubjects">Major Subjects</Label>
              <Input id="majorSubjects" value={formData.majorSubjects} onChange={e => setFormData({ ...formData, majorSubjects: e.target.value })} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isDisabled}>
              Add Course
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 