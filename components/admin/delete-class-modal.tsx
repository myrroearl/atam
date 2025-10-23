import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Class {
  id: string;
  name: string;
  subject: string;
  subjectCode: string;
  units: number;
  professor: string;
  professorEmail: string;
  section: string;
  course: string;
  department: string;
  yearLevel: string;
  semester: string;
  schedule_start: string | null;
  schedule_end: string | null;
  class_id: number;
  subject_id: number;
  section_id: number;
  prof_id: number;
  course_id: number;
  department_id: number;
  created_at: string;
  updated_at: string;
}

interface DeleteClassModalProps {
  classData: Class | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (classData: Class) => void;
}

export function DeleteClassModal({ classData, open, onOpenChange, onDelete }: DeleteClassModalProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!classData) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/classes?class_id=${classData.class_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete class');
      }

      onDelete(classData);
      onOpenChange(false);
      toast.success("Class deleted successfully!");
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete class');
    } finally {
      setLoading(false);
    }
  };

  if (!classData) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Class</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Are you sure you want to delete the class <strong>{classData.name}</strong>?
          </p>
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200">
              <strong>Warning:</strong> This action cannot be undone. All grade entries and student records associated with this class will be affected.
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? "Deleting..." : "Delete Class"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
