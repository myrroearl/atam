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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // e.g., 'students', 'professors', 'courses'

    let query;
    let tableName;

    switch (type) {
      case 'students':
        tableName = 'students';
        query = supabase
          .from('students')
          .select(`
            student_id,
            first_name,
            middle_name,
            last_name,
            birthday,
            address,
            contact_number,
            accounts!inner (
              account_id,
              email,
              status
            ),
            sections (
              section_name,
              year_level (name),
              courses (course_name)
            )
          `)
          .eq('accounts.status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'professors':
        tableName = 'professors';
        query = supabase
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
            accounts!inner (
              account_id,
              email,
              status
            ),
            departments (department_name)
          `)
          .eq('accounts.status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'courses':
        tableName = 'courses';
        query = supabase
          .from('courses')
          .select(`
            course_id,
            course_code,
            course_name,
            description,
            status,
            departments (department_name)
          `)
          .eq('status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'departments':
        tableName = 'departments';
        query = supabase
          .from('departments')
          .select(`
            department_id,
            department_name,
            dean_name,
            description,
            status
          `)
          .eq('status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'sections':
        tableName = 'sections';
        query = supabase
          .from('sections')
          .select(`
            section_id,
            section_name,
            status,
            year_level (name),
            courses (course_name)
          `)
          .eq('status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'subjects':
        tableName = 'subjects';
        query = supabase
          .from('subjects')
          .select(`
            subject_id,
            subject_code,
            subject_name,
            units,
            status,
            courses (course_name),
            year_level (name),
            semester (semester_name)
          `)
          .eq('status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'classes':
        tableName = 'classes';
        query = supabase
          .from('classes')
          .select(`
            class_id,
            class_name,
            status,
            subjects (subject_name),
            sections (section_name),
            professors (first_name, last_name)
          `)
          .eq('status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'year_level':
        tableName = 'year_level';
        query = supabase
          .from('year_level')
          .select(`
            year_level_id,
            name,
            status,
            courses (course_name, course_code)
          `)
          .eq('status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      case 'semester':
        tableName = 'semester';
        query = supabase
          .from('semester')
          .select(`
            semester_id,
            semester_name,
            status,
            year_level (
              name,
              courses (course_name)
            )
          `)
          .eq('status', 'inactive')
          .order('updated_at', { ascending: false });
        break;
      default:
        return NextResponse.json({ error: "Invalid archive type" }, { status: 400 });
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Database error fetching archived ${tableName}:`, error);
      return NextResponse.json({ error: `Failed to fetch archived ${tableName}` }, { status: 500 });
    }

    return NextResponse.json({ [tableName]: data });
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
        // For students and professors, we need to update the 'accounts' table status
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('account_id')
          .eq('student_id', id)
          .single();
        if (studentError || !studentData) {
          console.error("Student lookup error:", studentError);
          return NextResponse.json({ error: "Student not found" }, { status: 404 });
        }
        accountId = studentData.account_id;
        break;
      case 'professors':
        tableName = 'professors';
        idColumn = 'prof_id';
        const { data: professorData, error: professorError } = await supabase
          .from('professors')
          .select('account_id')
          .eq('prof_id', id)
          .single();
        if (professorError || !professorData) {
          console.error("Professor lookup error:", professorError);
          return NextResponse.json({ error: "Professor not found" }, { status: 404 });
        }
        accountId = professorData.account_id;
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

    if (action === 'archive') {
      // Archive: set status to 'inactive'
      let updateQuery;
      if (accountId) {
        // For students and professors, update the associated account status
        updateQuery = supabase
          .from('accounts')
          .update({ status: 'inactive', updated_at: new Date().toISOString() })
          .eq('account_id', accountId);
      } else {
        // For other entities, update their own status
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

    } else if (action === 'restore') {
      // Restore: set status to 'active'
      let updateQuery;
      if (accountId) {
        // For students and professors, update the associated account status
        updateQuery = supabase
          .from('accounts')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('account_id', accountId);
      } else {
        // For other entities, update their own status
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

    } else if (action === 'permanent_delete') {
      // Permanent Delete - with special handling for entities with relationships
      
      try {
        if (accountId) {
          // For students and professors, delete the account (which cascades to student/professor record)
          const { error } = await supabase
            .from('accounts')
            .delete()
            .eq('account_id', accountId);

          if (error) {
            console.error(`Database error permanently deleting account:`, error);
            return NextResponse.json({ error: `Failed to permanently delete ${tableName}: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'departments') {
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

          // Check for grade components
          const { data: gradeComponents, error: gcError } = await supabase
            .from('grade_components')
            .select('component_id')
            .eq('department_id', id);

          if (gcError) {
            console.error('Error checking grade components:', gcError);
            return NextResponse.json({ error: 'Failed to check department relationships' }, { status: 500 });
          }

          if (gradeComponents && gradeComponents.length > 0) {
            // Delete grade components first
            const { error: deleteGcError } = await supabase
              .from('grade_components')
              .delete()
              .eq('department_id', id);

            if (deleteGcError) {
              console.error('Error deleting grade components:', deleteGcError);
              return NextResponse.json({ error: 'Failed to delete grade components' }, { status: 500 });
            }
          }

          // Now delete the department
          const { error } = await supabase
            .from('departments')
            .delete()
            .eq('department_id', id);

          if (error) {
            console.error('Error deleting department:', error);
            return NextResponse.json({ error: `Failed to permanently delete department: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'courses') {
          // Check for related data
          const { data: yearLevels, error: ylError } = await supabase
            .from('year_level')
            .select('year_level_id')
            .eq('course_id', id);

          if (ylError) {
            console.error('Error checking course year levels:', ylError);
            return NextResponse.json({ error: 'Failed to check course relationships' }, { status: 500 });
          }

          if (yearLevels && yearLevels.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete course. It has ${yearLevels.length} year level(s). Please archive or delete all year levels first.` 
            }, { status: 409 });
          }

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

          const { data: subjects, error: subjError } = await supabase
            .from('subjects')
            .select('subject_id')
            .eq('course_id', id);

          if (subjError) {
            console.error('Error checking course subjects:', subjError);
            return NextResponse.json({ error: 'Failed to check course relationships' }, { status: 500 });
          }

          if (subjects && subjects.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete course. It has ${subjects.length} subject(s). Please archive or delete all subjects first.` 
            }, { status: 409 });
          }

          // Now delete the course
          const { error } = await supabase
            .from('courses')
            .delete()
            .eq('course_id', id);

          if (error) {
            console.error('Error deleting course:', error);
            return NextResponse.json({ error: `Failed to permanently delete course: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'year_level') {
          // Check for related semesters
          const { data: semesters, error: semError } = await supabase
            .from('semester')
            .select('semester_id')
            .eq('year_level_id', id);

          if (semError) {
            console.error('Error checking year level semesters:', semError);
            return NextResponse.json({ error: 'Failed to check year level relationships' }, { status: 500 });
          }

          if (semesters && semesters.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete year level. It has ${semesters.length} semester(s). Please archive or delete all semesters first.` 
            }, { status: 409 });
          }

          // Check for related sections
          const { data: sections, error: secError } = await supabase
            .from('sections')
            .select('section_id')
            .eq('year_level_id', id);

          if (secError) {
            console.error('Error checking year level sections:', secError);
            return NextResponse.json({ error: 'Failed to check year level relationships' }, { status: 500 });
          }

          if (sections && sections.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete year level. It has ${sections.length} section(s). Please archive or delete all sections first.` 
            }, { status: 409 });
          }

          // Now delete the year level
          const { error } = await supabase
            .from('year_level')
            .delete()
            .eq('year_level_id', id);

          if (error) {
            console.error('Error deleting year level:', error);
            return NextResponse.json({ error: `Failed to permanently delete year level: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'semester') {
          // Check for related subjects
          const { data: subjects, error: subjError } = await supabase
            .from('subjects')
            .select('subject_id')
            .eq('semester_id', id);

          if (subjError) {
            console.error('Error checking semester subjects:', subjError);
            return NextResponse.json({ error: 'Failed to check semester relationships' }, { status: 500 });
          }

          if (subjects && subjects.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete semester. It has ${subjects.length} subject(s). Please archive or delete all subjects first.` 
            }, { status: 409 });
          }

          // Now delete the semester
          const { error } = await supabase
            .from('semester')
            .delete()
            .eq('semester_id', id);

          if (error) {
            console.error('Error deleting semester:', error);
            return NextResponse.json({ error: `Failed to permanently delete semester: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'sections') {
          // Check for students in this section
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

          // Check for classes
          const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('class_id')
            .eq('section_id', id);

          if (classError) {
            console.error('Error checking section classes:', classError);
            return NextResponse.json({ error: 'Failed to check section relationships' }, { status: 500 });
          }

          if (classes && classes.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete section. It has ${classes.length} class(es). Please archive or delete all classes first.` 
            }, { status: 409 });
          }

          // Now delete the section
          const { error } = await supabase
            .from('sections')
            .delete()
            .eq('section_id', id);

          if (error) {
            console.error('Error deleting section:', error);
            return NextResponse.json({ error: `Failed to permanently delete section: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'subjects') {
          // Check for classes using this subject
          const { data: classes, error: classError } = await supabase
            .from('classes')
            .select('class_id')
            .eq('subject_id', id);

          if (classError) {
            console.error('Error checking subject classes:', classError);
            return NextResponse.json({ error: 'Failed to check subject relationships' }, { status: 500 });
          }

          if (classes && classes.length > 0) {
            return NextResponse.json({ 
              error: `Cannot permanently delete subject. It has ${classes.length} class(es). Please archive or delete all classes first.` 
            }, { status: 409 });
          }

          // Now delete the subject
          const { error } = await supabase
            .from('subjects')
            .delete()
            .eq('subject_id', id);

          if (error) {
            console.error('Error deleting subject:', error);
            return NextResponse.json({ error: `Failed to permanently delete subject: ${error.message}` }, { status: 500 });
          }
        } else if (tableName === 'classes') {
          // Check for grade entries
          const { data: grades, error: gradeError } = await supabase
            .from('grade_entries')
            .select('grade_id')
            .eq('class_id', id);

          if (gradeError) {
            console.error('Error checking class grade entries:', gradeError);
            return NextResponse.json({ error: 'Failed to check class relationships' }, { status: 500 });
          }

          if (grades && grades.length > 0) {
            // Delete grade entries first
            const { error: deleteGradeError } = await supabase
              .from('grade_entries')
              .delete()
              .eq('class_id', id);

            if (deleteGradeError) {
              console.error('Error deleting grade entries:', deleteGradeError);
              return NextResponse.json({ error: 'Failed to delete grade entries' }, { status: 500 });
            }
          }

          // Now delete the class
          const { error } = await supabase
            .from('classes')
            .delete()
            .eq('class_id', id);

          if (error) {
            console.error('Error deleting class:', error);
            return NextResponse.json({ error: `Failed to permanently delete class: ${error.message}` }, { status: 500 });
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