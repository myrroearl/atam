import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Fetch all archived data at once (unified table approach)
    const [studentsResult, professorsResult, coursesResult, departmentsResult, 
           sectionsResult, subjectsResult, classesResult, yearLevelResult, semesterResult] = await Promise.all([
      // Students
      supabase
        .from('students')
        .select(`
          student_id,
          first_name,
          middle_name,
          last_name,
          birthday,
          address,
          contact_number,
          status,
          updated_at,
          accounts!inner (
            account_id,
            email
          ),
          sections (
            section_name,
            year_level (name),
            courses (course_name)
          )
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Professors
      supabase
        .from('professors')
        .select(`
          prof_id,
          first_name,
          middle_name,
          last_name,
          birthday,
          address,
          contact_number,
          faculty_type,
          status,
          updated_at,
          accounts!inner (
            account_id,
            email
          ),
          departments (department_name)
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Courses
      supabase
        .from('courses')
        .select(`
          course_id,
          course_code,
          course_name,
          description,
          status,
          updated_at,
          departments (department_name)
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Departments
      supabase
        .from('departments')
        .select(`
          department_id,
          department_name,
          dean_name,
          description,
          status,
          updated_at
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Sections
      supabase
        .from('sections')
        .select(`
          section_id,
          section_name,
          status,
          updated_at,
          year_level (name),
          courses (course_name)
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Subjects
      supabase
        .from('subjects')
        .select(`
          subject_id,
          subject_code,
          subject_name,
          units,
          status,
          updated_at,
          courses (course_name),
          year_level (name),
          semester (semester_name)
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Classes
      supabase
        .from('classes')
        .select(`
          class_id,
          class_name,
          status,
          updated_at,
          subjects (subject_name),
          sections (section_name),
          professors (first_name, last_name)
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Year Level
      supabase
        .from('year_level')
        .select(`
          year_level_id,
          name,
          status,
          updated_at,
          courses (course_name, course_code)
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false }),
      
      // Semester
      supabase
        .from('semester')
        .select(`
          semester_id,
          semester_name,
          status,
          updated_at,
          year_level (
            name,
            courses (course_name)
          )
        `)
        .eq('status', 'inactive')
        .order('updated_at', { ascending: false })
    ])

    // Combine all data into a unified response
    const allArchivedData: any = {
      students: studentsResult.data || [],
      professors: professorsResult.data || [],
      courses: coursesResult.data || [],
      departments: departmentsResult.data || [],
      sections: sectionsResult.data || [],
      subjects: subjectsResult.data || [],
      classes: classesResult.data || [],
      year_level: yearLevelResult.data || [],
      semester: semesterResult.data || []
    }

    // Add record_type to each item for unified table display
    Object.keys(allArchivedData).forEach(key => {
      allArchivedData[key] = allArchivedData[key].map((item: any) => ({ ...item, record_type: key }))
    })

    return NextResponse.json(allArchivedData);
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { type, id, action } = body; // action can be 'restore' or 'permanent_delete'

    if (!type || !id || !action) {
      return NextResponse.json({ error: "Missing required fields: type, id, action" }, { status: 400 });
    }

    let tableName;
    let idColumn;
    let accountId = null;

    // Determine table name and ID column based on type
    switch (type) {
      case 'students':
        tableName = 'students';
        idColumn = 'student_id';
        // Check if student exists
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('student_id')
          .eq('student_id', id)
          .single();
        if (studentError || !studentData) {
          console.error("Student lookup error:", studentError);
          return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }
        break;
      case 'professors':
        tableName = 'professors';
        idColumn = 'prof_id';
        // Check if professor exists
        const { data: professorData, error: professorError } = await supabase
          .from('professors')
          .select('prof_id')
          .eq('prof_id', id)
          .single();
        if (professorError || !professorData) {
          console.error("Professor lookup error:", professorError);
          return NextResponse.json({ error: "Professor not found" }, { status: 404 });
        }
        break;
      case 'courses':
        tableName = 'courses';
        idColumn = 'course_id';
        break;
      case 'departments':
        tableName = 'departments';
        idColumn = 'department_id';
        break;
      case 'sections':
        tableName = 'sections';
        idColumn = 'section_id';
        break;
      case 'subjects':
        tableName = 'subjects';
        idColumn = 'subject_id';
        break;
      case 'classes':
        tableName = 'classes';
        idColumn = 'class_id';
        break;
      case 'year_level':
        tableName = 'year_level';
        idColumn = 'year_level_id';
        break;
      case 'semester':
        tableName = 'semester';
        idColumn = 'semester_id';
        break;
      default:
        return NextResponse.json({ error: "Invalid archive type" }, { status: 400 });
    }

    if (action === 'restore') {
      // Restore: set status to 'active'
      let updateQuery;
      if (type === 'students') {
        updateQuery = supabase
          .from('students')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('student_id', id);
      } else if (type === 'professors') {
        updateQuery = supabase
          .from('professors')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('prof_id', id);
      } else {
        updateQuery = supabase
          .from(tableName)
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq(idColumn, id);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error(`Database error restoring ${tableName}:`, error);
        return NextResponse.json({ error: `Failed to restore ${tableName}` }, { status: 500 });
      }
      return NextResponse.json({ message: `${tableName} restored successfully` });
    } else if (action === 'archive') {
      // Archive: set status to 'inactive'
      let updateQuery;
      if (type === 'students') {
        updateQuery = supabase
          .from('students')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('student_id', id);
      } else if (type === 'professors') {
        updateQuery = supabase
          .from('professors')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('prof_id', id);
      } else {
        updateQuery = supabase
          .from(tableName)
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq(idColumn, id);
      }

      const { error } = await updateQuery;

      if (error) {
        console.error(`Database error archiving ${tableName}:`, error);
        return NextResponse.json({ error: `Failed to archive ${tableName}` }, { status: 500 });
      }
      return NextResponse.json({ message: `${tableName} archived successfully` });
    } else if (action === 'permanent_delete') {
      // Permanent Delete - with special handling for entities with relationships
      try {
        if (tableName === 'departments') {
          // Special handling for departments - check for related data first
          const { data: courses, error: coursesError } = await supabase
            .from('courses')
            .select('course_id')
            .eq('department_id', id);

          if (coursesError) {
            console.error('Error checking department courses:', coursesError);
            return NextResponse.json({ error: 'Failed to check department relationships' }, { status: 500 });
          }

          if (courses && courses.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete department. It has ${courses.length} course(s). Please archive or delete all courses first.` 
            }, { status: 409 });
          }

          // Check for professors
          const { data: professors, error: profsError } = await supabase
            .from('professors')
            .select('prof_id')
            .eq('department_id', id);

          if (profsError) {
            console.error('Error checking department professors:', profsError);
            return NextResponse.json({ error: 'Failed to check department relationships' }, { status: 500 });
          }

          if (professors && professors.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete department. It has ${professors.length} professor(s). Please archive or delete all professors first.` 
            }, { status: 409 });
          }

          // Handle grade components: delete related grade_entries first, then grade_components
          const { data: gradeComponents, error: gradeCompError } = await supabase
            .from('grade_components')
            .select('component_id')
            .eq('department_id', id);

          if (gradeCompError) {
            console.error('Error checking department grade components:', gradeCompError);
            return NextResponse.json({ error: 'Failed to check department relationships' }, { status: 500 });
          }

          if (gradeComponents && gradeComponents.length > 0) {
            const componentIds = gradeComponents.map((gc: any) => gc.component_id);
            // Delete grade_entries referencing these components (to satisfy FK)
            const { error: delEntriesError } = await supabase
              .from('grade_entries')
              .delete()
              .in('component_id', componentIds);

            if (delEntriesError) {
              console.error('Error deleting related grade entries:', delEntriesError);
              return NextResponse.json({ error: 'Failed to delete related grade entries' }, { status: 500 });
            }

            // Delete grade_components for this department
            const { error: delComponentsError } = await supabase
              .from('grade_components')
              .delete()
              .eq('department_id', id);

            if (delComponentsError) {
              console.error('Error deleting grade components:', delComponentsError);
              return NextResponse.json({ error: 'Failed to delete grade components' }, { status: 500 });
            }
          }

          const { error } = await supabase
            .from('departments')
            .delete()
            .eq('department_id', id);

          if (error) {
            console.error('Error deleting department:', error);
            return NextResponse.json({ error: `Failed to permanently delete department: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'courses') {
          const { data: sections, error: secError } = await supabase
            .from('sections')
            .select('section_id')
            .eq('course_id', id);

          if (secError) {
            console.error('Error checking course sections:', secError);
            return NextResponse.json({ error: 'Failed to check course relationships' }, { status: 500 });
          }

          if (sections && sections.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete course. It has ${sections.length} section(s). Please archive or delete all sections first.` 
            }, { status: 409 });
          }

          const { error } = await supabase
            .from('courses')
            .delete()
            .eq('course_id', id);

          if (error) {
            console.error('Error deleting course:', error);
            return NextResponse.json({ error: `Failed to permanently delete course: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'sections') {
          const { data: students, error: studError } = await supabase
            .from('students')
            .select('student_id')
            .eq('section_id', id);

          if (studError) {
            console.error('Error checking section students:', studError);
            return NextResponse.json({ error: 'Failed to check section relationships' }, { status: 500 });
          }

          if (students && students.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete section. It has ${students.length} student(s). Please move or delete all students first.` 
            }, { status: 409 });
          }

          const { error } = await supabase
            .from('sections')
            .delete()
            .eq('section_id', id);

          if (error) {
            console.error('Error deleting section:', error);
            return NextResponse.json({ error: `Failed to permanently delete section: ${error.message}` }, { status: 500 });
          }
        } else {
          // For other entities, directly delete the record
          const { error } = await supabase
            .from(tableName)
            .delete()
            .eq(idColumn, id);

          if (error) {
            console.error(`Database error permanently deleting ${tableName}:`, error);
            return NextResponse.json({ error: `Failed to permanently delete ${tableName}: ${error.message}` }, { status: 500 });
          }
        }

        return NextResponse.json({ message: `${tableName} permanently deleted successfully` });
      } catch (error) {
        console.error('Error in permanent delete:', error);
        return NextResponse.json({ 
          error: `Failed to permanently delete ${tableName}: ${error instanceof Error ? error.message : 'Unknown error'}` 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
