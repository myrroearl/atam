import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Course {
  course_id: number;
  department_id: number;
  course_code: string;
  course_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

interface EditCourseModalProps {
  course: Course | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function EditCourseModalNew({ course, isOpen, onClose, onSuccess }: EditCourseModalProps) {
  const [formData, setFormData] = useState({
    course_code: "",
    course_name: "",
    description: "",
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (course) {
      setFormData({
        course_code: course.course_code,
        course_name: course.course_name,
        description: course.description || "",
      });
      setErrors({});
    }
  }, [course]);

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.course_code.trim()) {
      newErrors.course_code = "Course code is required";
    } else if (formData.course_code.length < 2) {
      newErrors.course_code = "Course code must be at least 2 characters";
    }

    if (!formData.course_name.trim()) {
      newErrors.course_name = "Course name is required";
    } else if (formData.course_name.length < 5) {
      newErrors.course_name = "Course name must be at least 5 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!course || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`/api/admin/course/${course.course_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setErrors({ course_code: result.error });
          return;
        }
        throw new Error(result.error || 'Failed to update course');
      }

      onSuccess();
      onClose();

    } catch (error) {
      console.error('Error updating course:', error);
      const errorMessage = error instanceof Error ? error.message : "Failed to update course";
      setErrors({ general: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!course) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Course</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-course-code">Course Code</Label>
            <Input 
              id="edit-course-code" 
              value={formData.course_code} 
              onChange={e => setFormData({ ...formData, course_code: e.target.value.toUpperCase() })} 
              required 
            />
            {errors.course_code && (
              <p className="text-sm text-red-500">{errors.course_code}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-course-name">Course Name</Label>
            <Input 
              id="edit-course-name" 
              value={formData.course_name} 
              onChange={e => setFormData({ ...formData, course_name: e.target.value })} 
              required 
            />
            {errors.course_name && (
              <p className="text-sm text-red-500">{errors.course_name}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input 
              id="edit-description" 
              value={formData.description} 
              onChange={e => setFormData({ ...formData, description: e.target.value })} 
            />
          </div>
          {errors.general && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-700 hover:bg-green-800" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update Course"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}