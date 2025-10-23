// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
// import { RowActionsMenu } from "@/components/admin/row-actions-menu";
// import EditCourseModal from "@/components/admin/edit-course-modal";

// interface Course {
//   code: string;
//   name: string;
//   department: string;
//   duration: string;
//   totalUnits: string;
//   enrollment: string;
//   majorSubjects: string;
//   status: string;
// }

// interface CoursesTableProps {
//   courses: Course[];
//   onDeleteCourse?: (courseCode: string) => void;
//   onEditCourse?: (course: Course) => void;
//   currentPage: number;
//   setCurrentPage: (page: number) => void;
//   loading?: boolean;
// }

// export function CoursesTable({ courses, onDeleteCourse, onEditCourse, currentPage, setCurrentPage, loading }: CoursesTableProps) {
//   const [editingCourse, setEditingCourse] = useState<Course | null>(null);
//   const [showEditModal, setShowEditModal] = useState(false);
//   const pageSize = 10;
//   const totalPages = Math.ceil(courses.length / pageSize);
//   const paginatedCourses = courses.slice((currentPage - 1) * pageSize, currentPage * pageSize);

//   const handleEdit = (course: Course) => {
//     setEditingCourse(course);
//     setShowEditModal(true);
//   };
//   const handleSave = (updatedCourse: Course) => {
//     if (onEditCourse && updatedCourse) onEditCourse(updatedCourse);
//     setShowEditModal(false);
//   };
//   const handleDelete = (courseCode: string) => {
//     if (onDeleteCourse) onDeleteCourse(courseCode);
//     setShowEditModal(false);
//   };

//   return (
//     <>
//       <div className="bg-white rounded-lg border overflow-hidden">
//         <div className="overflow-x-auto">
//           <table className="w-full min-w-[900px]">
//             <thead className="bg-gray-50 border-b">
//               <tr>
//                 <th className="text-left p-2 font-bold text-gray-700">Name</th>
//                 <th className="text-left p-2 font-bold text-gray-700">Department</th>
//                 <th className="text-left p-2 font-bold text-gray-700">Duration</th>
//                 <th className="text-left p-2 font-bold text-gray-700">Total Units</th>
//                 <th className="text-left p-2 font-bold text-gray-700">Enrollment</th>
//                 <th className="text-left p-2 font-bold text-gray-700">Major Subjects</th>
//                 <th className="text-left p-2 font-bold text-gray-700">Status</th>
//                 <th className="text-left p-2 font-bold text-gray-700"></th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={9} className="text-center text-gray-500 py-8">Loading...</td>
//                 </tr>
//               ) : paginatedCourses.length === 0 ? (
//                 <tr>
//                   <td colSpan={9} className="text-center text-gray-500 py-8">No courses found.</td>
//                 </tr>
//               ) : (
//                 paginatedCourses.map((course) => (
//                   <tr key={course.code} className="border-b hover:bg-gray-50">
//                     <td className="p-2 text-black">
//                       <div>
//                         <p className="text-xs font-semibold">{course.code}</p>
//                         <p className="text-xs">{course.name}</p>
//                       </div>
//                     </td>
//                     <td className="p-2 text-black text-xs">{course.department}</td>
//                     <td className="p-2 text-black text-xs">{course.duration}</td>
//                     <td className="p-2 text-black text-xs">{course.totalUnits}</td>
//                     <td className="p-2 text-black text-xs">{course.enrollment}</td>
//                     <td className="p-2 text-black text-xs">{course.majorSubjects}</td>
//                     <td className="p-2 text-xs">
//                       <Badge
//                         variant={course.status === "Active" ? "default" : "destructive"}
//                         className={course.status === "Active"
//                           ? "bg-green-100 text-green-800 hover:bg-green-100"
//                           : "bg-red-100 text-red-800 hover:bg-red-100"}
//                       >
//                         {course.status}
//                       </Badge>
//                     </td>
//                     <td className="p-2 w-[10px]">
//                       <RowActionsMenu onEdit={() => handleEdit(course)} onDelete={() => handleDelete(course.code)} />
//                     </td>
//                   </tr>
//                 ))
//               )}
//             </tbody>
//           </table>
//         </div>
//         {/* Pagination */}
//         <div className="flex items-center justify-between p-2 border-t bg-gray-50">
//           <p className="text-xs text-gray-600">
//             Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, courses.length)} of {courses.length} courses
//           </p>
//           <div className="flex items-center gap-2">
//             <span className="text-xs text-gray-600">Page {currentPage} of {totalPages}</span>
//             <Button className="text-xs" variant="outline" size="sm" onClick={() => setCurrentPage(1)} disabled={currentPage === 1}>
//               First
//             </Button>
//             <Button className="text-xs" variant="outline" size="sm" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
//               {"<"}
//             </Button>
//             {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, currentPage - 2), currentPage + 3).map((page) => (
//               <Button
//                 key={page}
//                 variant={page === currentPage ? "default" : "outline"}
//                 size="sm"
//                 className={page === currentPage ? "bg-green-700" : ""}
//                 onClick={() => setCurrentPage(page)}
//               >
//                 {page}
//               </Button>
//             ))}
//             <Button className="text-xs" variant="outline" size="sm" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
//               {">"}
//             </Button>
//             <Button className="text-xs" variant="outline" size="sm" onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
//               Last
//             </Button>
//           </div>
//         </div>
//       </div>
//       <EditCourseModal
//         course={editingCourse}
//         open={showEditModal}
//         onOpenChange={setShowEditModal}
//         onSave={handleSave}
//       />
//     </>
//   );
// } 