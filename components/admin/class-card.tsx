"use client"

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SquarePen, Trash, Clock, User, BookOpen, Users } from "lucide-react"
import { EditClassModal } from "@/components/admin/edit-class-modal"
import { DeleteClassModal } from "@/components/admin/delete-class-modal"
import { useState } from "react"

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

interface ClassCardProps {
  classData: Class
  onEdit: (classData: Class) => void
  onDelete: (classData: Class) => void
}

// Color variations for class cards
const cardColors = [
  "bg-[var(--customized-color-two)]",
  "bg-[var(--customized-color-three)]",
  "bg-[var(--customized-color-one)]",
]

export default function ClassCard({ 
  classData, 
  onEdit, 
  onDelete
}: ClassCardProps) {
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const colorIndex = classData.class_id % cardColors.length
  const headerColor = cardColors[colorIndex]

  // Format schedule display to match class table format with 12-hour time
  const formatSchedule = (scheduleStart: string | null, scheduleEnd: string | null) => {
    if (!scheduleStart || !scheduleEnd) {
      return 'Not scheduled';
    }

    console.log('🔍 CLASS CARD: Displaying schedule data:', {
      scheduleStart,
      scheduleEnd,
      typeStart: typeof scheduleStart,
      typeEnd: typeof scheduleEnd
    });

    // Extract time from ISO format (2025-10-01T17:00:00+00:00) and convert to 12-hour format
    const startTime = scheduleStart.split('T')[1]?.split('+')[0]?.substring(0, 5) || '';
    const endTime = scheduleEnd.split('T')[1]?.split('+')[0]?.substring(0, 5) || '';
    
    // Convert to 12-hour format
    const formatTo12Hour = (time24: string) => {
      if (!time24) return '';
      const [hours, minutes] = time24.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    const startTime12 = formatTo12Hour(startTime);
    const endTime12 = formatTo12Hour(endTime);
    
    return (
        <div className="flex items-center gap-1">
          <span className="text-xs">{startTime12}</span>
          <span className="text-xs">to</span>
          <span className="text-xs">{endTime12}</span>
        </div>
    );
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowEditModal(true);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setShowDeleteModal(true);
  };

  const handleEditSave = (updatedClass: Class) => {
    onEdit(updatedClass);
    setShowEditModal(false);
  };

  const handleDeleteConfirm = (classData: Class) => {
    onDelete(classData);
    setShowDeleteModal(false);
  };

  return (
    <>
    <Card className="bg-white dark:bg-black border-0 transition-transform duration-500 hover:-translate-y-2 shadow-md dark:shadow-none rounded-2xl h-[300px] flex flex-col">
      <CardHeader className={`p-4 ${headerColor} rounded-t-2xl flex-shrink-0`}>
        <CardTitle className="text-center font-semibold text-white text-lg">
          {classData.name}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 flex-1 flex flex-col">
        <div className="flex flex-col space-y-3 flex-1">
          <div className="flex-1 flex flex-col space-y-3">
            {/* Subject Information */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-black dark:text-gray-400">Subject:</p>
              </div>
              <p className="text-sm font-normal text-gray-600 dark:text-white text-right">
                {classData.subject}
              </p>
            </div>
            
            {/* Professor Information */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-black dark:text-gray-400">Professor:</p>
              </div>
              <p className="text-sm font-normal text-gray-600 dark:text-white text-right">
                {classData.professor}
              </p>
            </div>
            
            {/* Section Information */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-black dark:text-gray-400">Section:</p>
              </div>
              <p className="text-sm font-normal text-gray-600 dark:text-white">
                {classData.section}
              </p>
            </div>
            
            {/* Schedule Information */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <p className="text-sm font-medium text-black dark:text-gray-400">Schedule:</p>
              </div>
              <div className="text-sm font-normal text-gray-600 dark:text-white text-right">
                {formatSchedule(classData.schedule_start, classData.schedule_end)}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      <Separator />
      <CardFooter className="p-4 flex justify-end flex-shrink-0">
        <div className="flex justify-between w-full gap-3">
          <Button 
            variant="outline" 
            onClick={handleEdit}
            className="flex items-center gap-2 bg-[var(--customized-color-five)] border-none text-[var(--customized-color-one)] hover:bg-[var(--customized-color-two)] hover:text-white dark:bg-black dark:text:white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-[var(--customized-color-one)] w-full"
          >
            <SquarePen className="w-4 h-4" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={handleDelete}
            className="flex items-center gap-2 bg-red-50 border-none text-red-500 hover:bg-red-500 hover:text-red-50 dark:bg-black dark:text:white dark:hover:bg-[var(--customized-color-five)] dark:hover:text-red-500 w-full"
          >
            <Trash className="w-4 h-4" />
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>

    {/* Modals */}
    <EditClassModal
      classData={classData}
      open={showEditModal}
      onOpenChange={setShowEditModal}
      onSave={handleEditSave}
    />

    <DeleteClassModal
      classData={classData}
      open={showDeleteModal}
      onOpenChange={setShowDeleteModal}
      onDelete={handleDeleteConfirm}
    />
  </>
  )
}
