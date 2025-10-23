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

    // Get all active classes with comprehensive details
    const { data: classes, error } = await supabase
      .from('classes')
      .select(`
        class_id,
        class_name,
        schedule_start,
        schedule_end,
        created_at,
        updated_at,
        subjects (
          subject_id,
          subject_code,
          subject_name,
          units,
          courses (
            course_id,
            course_code,
            course_name,
            departments (
              department_id,
              department_name
            )
          ),
          year_level (
            year_level_id,
            name
          ),
          semester (
            semester_id,
            semester_name
          )
        ),
        sections (
          section_id,
          section_name,
          courses (
            course_id,
            course_code,
            course_name
          ),
          year_level (
            year_level_id,
            name
          )
        ),
        professors (
          prof_id,
          first_name,
          middle_name,
          last_name,
          accounts (
            email
          )
        )
      `)
      .eq('status', 'active')
      .order('class_name', { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
    }

    // Log all raw schedule data from database (Philippine Time)
    console.log('\n📊 ═══════════════════════════════════════════════════════════');
    console.log('📊 FETCHING EXACT SCHEDULE TIMES FROM DATABASE (Philippine Time)');
    console.log('📊 ═══════════════════════════════════════════════════════════');
    
    if (classes && classes.length > 0) {
      classes.forEach((cls: any, index: number) => {
        console.log(`\n📚 Class #${index + 1}: ${cls.class_name || 'Unnamed'}`);
        console.log(`   🆔 Class ID: ${cls.class_id}`);
        console.log(`   🕐 schedule_start: ${cls.schedule_start || 'Not set'}`);
        console.log(`   🕐 schedule_end: ${cls.schedule_end || 'Not set'}`);
      });
      console.log('\n📊 ═══════════════════════════════════════════════════════════');
      console.log(`📊 Total classes fetched: ${classes.length}`);
      console.log('📊 ═══════════════════════════════════════════════════════════\n');
    } else {
      console.log('📊 No classes found in database');
      console.log('📊 ═══════════════════════════════════════════════════════════\n');
    }

    // Transform the data to match the frontend format
    const transformedClasses = classes?.map((cls: any) => {
      // Create professor name
      const profName = cls.professors?.middle_name 
        ? `${cls.professors.last_name}, ${cls.professors.first_name} ${cls.professors.middle_name}`
        : `${cls.professors.last_name}, ${cls.professors.first_name}`

      return {
        id: cls.class_id.toString(),
        name: cls.class_name,
        subject: cls.subjects?.subject_name || 'N/A',
        subjectCode: cls.subjects?.subject_code || 'N/A',
        units: cls.subjects?.units || 0,
        professor: profName || 'Unassigned',
        professorEmail: cls.professors?.accounts?.email || 'N/A',
        section: cls.sections?.section_name || 'N/A',
        course: cls.sections?.courses?.course_name || 'N/A',
        department: cls.subjects?.courses?.departments?.department_name || 'N/A',
        yearLevel: cls.sections?.year_level?.name || 'N/A',
        semester: cls.subjects?.semester?.semester_name || 'N/A',
        // Include raw timestamps for accurate display
        schedule_start: cls.schedule_start,
        schedule_end: cls.schedule_end,
        // Internal IDs for updates
        class_id: cls.class_id,
        subject_id: cls.subjects?.subject_id || 0,
        section_id: cls.sections?.section_id || 0,
        prof_id: cls.professors?.prof_id || 0,
        course_id: cls.sections?.courses?.course_id || 0,
        department_id: cls.subjects?.courses?.departments?.department_id || 0,
        created_at: cls.created_at,
        updated_at: cls.updated_at
      }
    }) || []

    return NextResponse.json({ classes: transformedClasses })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      subjectId,
      sectionId,
      professorId,
      scheduleStart,
      scheduleEnd
    } = body

    console.log("POST /api/admin/classes - Request body:", body)

    // Validate required fields
    if (!name || !subjectId || !sectionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert IDs to numbers
    const subject_id = parseInt(subjectId)
    const section_id = parseInt(sectionId)
    const prof_id = professorId && professorId !== 'unassigned' ? parseInt(professorId) : null

    // Verify subject exists
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('subject_id, subject_name')
      .eq('subject_id', subject_id)
      .single()

    if (subjectError || !subjectData) {
      console.error("Subject lookup error:", subjectError)
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 })
    }

    // Verify section exists
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('section_id, section_name')
      .eq('section_id', section_id)
      .single()

    if (sectionError || !sectionData) {
      console.error("Section lookup error:", sectionError)
      return NextResponse.json({ error: "Invalid section ID" }, { status: 400 })
    }

    // Verify professor exists if provided
    if (prof_id) {
      const { data: professorData, error: professorError } = await supabase
        .from('professors')
        .select('prof_id')
        .eq('prof_id', prof_id)
        .single()

      if (professorError || !professorData) {
        console.error("Professor lookup error:", professorError)
        return NextResponse.json({ error: "Invalid professor ID" }, { status: 400 })
      }
    }

    // Use raw schedule data directly (YYYY-MM-DD HH:MM:SS format)
    const formatScheduleForDB = (scheduleData: string) => {
      if (!scheduleData) return null;
      // If already in correct format, return as-is
      if (scheduleData.includes(' ') && scheduleData.includes(':')) {
        return scheduleData;
      }
      // If in datetime-local format, convert to database format
      if (scheduleData.includes('T')) {
        return scheduleData.replace('T', ' ') + ':00';
      }
      // Return as-is if in unknown format
      return scheduleData;
    };

    const formattedScheduleStart = formatScheduleForDB(scheduleStart);
    const formattedScheduleEnd = formatScheduleForDB(scheduleEnd);

    console.log('📅 Schedule processing:');
    console.log('  Input scheduleStart:', scheduleStart);
    console.log('  Processed scheduleStart:', formattedScheduleStart);
    console.log('  Input scheduleEnd:', scheduleEnd);
    console.log('  Processed scheduleEnd:', formattedScheduleEnd);

    // Create class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .insert({
        class_name: name,
        subject_id: subject_id,
        section_id: section_id,
        professor_id: prof_id,
        schedule_start: formattedScheduleStart,
        schedule_end: formattedScheduleEnd
      })
      .select('*')
      .single()

    if (classError) {
      console.error("Class creation error:", classError)
      return NextResponse.json({ error: "Failed to create class" }, { status: 500 })
    }

    console.log('Class created, DB returned:');
    console.log('  schedule_start:', classData.schedule_start);
    console.log('  schedule_end:', classData.schedule_end);

    // Fetch full class details for response
    const { data: fullClass } = await supabase
      .from('classes')
      .select(`
        *,
        subjects (subject_name, subject_code, units, courses (course_id, course_name, departments (department_id, department_name))),
        sections (section_name, courses (course_id), year_level (name)),
        professors (prof_id, first_name, middle_name, last_name, accounts (email))
      `)
      .eq('class_id', classData.class_id)
      .single()

    return NextResponse.json({ 
      message: "Class created successfully",
      class: {
        id: classData.class_id.toString(),
        name: classData.class_name,
        subject: fullClass?.subjects?.subject_name || 'N/A',
        subjectCode: fullClass?.subjects?.subject_code || 'N/A',
        units: fullClass?.subjects?.units || 0,
        section: fullClass?.sections?.section_name || 'N/A',
        professor: fullClass?.professors 
          ? `${fullClass.professors.last_name}, ${fullClass.professors.first_name}${fullClass.professors.middle_name ? ` ${fullClass.professors.middle_name}` : ''}`
          : 'Unassigned',
        professorEmail: fullClass?.professors?.accounts?.email || 'N/A',
        course: fullClass?.sections?.courses?.course_name || 'N/A',
        department: fullClass?.subjects?.courses?.departments?.department_name || 'N/A',
        yearLevel: fullClass?.sections?.year_level?.name || 'N/A',
        // Include raw timestamps for accurate display (from fresh database query)
        schedule_start: fullClass?.schedule_start,
        schedule_end: fullClass?.schedule_end,
        class_id: classData.class_id,
        subject_id: subject_id,
        section_id: section_id,
        prof_id: prof_id || 0,
        course_id: fullClass?.subjects?.courses?.course_id || 0,
        department_id: fullClass?.subjects?.courses?.departments?.department_id || 0,
        created_at: classData.created_at,
        updated_at: classData.updated_at
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      class_id,
      name,
      subjectId,
      sectionId,
      professorId,
      scheduleStart,
      scheduleEnd
    } = body

    console.log("PUT /api/admin/classes - Request body:", body)

    // Validate required fields
    if (!class_id || !name || !subjectId || !sectionId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Convert IDs to numbers
    const subject_id = parseInt(subjectId)
    const section_id = parseInt(sectionId)
    const prof_id = professorId && professorId !== 'unassigned' ? parseInt(professorId) : null

    // Verify subject exists
    const { data: subjectData, error: subjectError } = await supabase
      .from('subjects')
      .select('subject_id, subject_name')
      .eq('subject_id', subject_id)
      .single()

    if (subjectError || !subjectData) {
      console.error("Subject lookup error:", subjectError)
      return NextResponse.json({ error: "Invalid subject ID" }, { status: 400 })
    }

    // Verify section exists
    const { data: sectionData, error: sectionError } = await supabase
      .from('sections')
      .select('section_id, section_name')
      .eq('section_id', section_id)
      .single()

    if (sectionError || !sectionData) {
      console.error("Section lookup error:", sectionError)
      return NextResponse.json({ error: "Invalid section ID" }, { status: 400 })
    }

    // Verify professor exists if provided
    if (prof_id) {
      const { data: professorData, error: professorError } = await supabase
        .from('professors')
        .select('prof_id')
        .eq('prof_id', prof_id)
        .single()

      if (professorError || !professorData) {
        console.error("Professor lookup error:", professorError)
        return NextResponse.json({ error: "Invalid professor ID" }, { status: 400 })
      }
    }

    // Use raw schedule data directly (YYYY-MM-DD HH:MM:SS format)
    const formatScheduleForDB = (scheduleData: string) => {
      if (!scheduleData) return null;
      // If already in correct format, return as-is
      if (scheduleData.includes(' ') && scheduleData.includes(':')) {
        return scheduleData;
      }
      // If in datetime-local format, convert to database format
      if (scheduleData.includes('T')) {
        return scheduleData.replace('T', ' ') + ':00';
      }
      // Return as-is if in unknown format
      return scheduleData;
    };

    const formattedScheduleStart = formatScheduleForDB(scheduleStart);
    const formattedScheduleEnd = formatScheduleForDB(scheduleEnd);

    console.log('📅 Schedule update:');
    console.log('  Input scheduleStart:', scheduleStart);
    console.log('  Processed scheduleStart:', formattedScheduleStart);
    console.log('  Input scheduleEnd:', scheduleEnd);
    console.log('  Processed scheduleEnd:', formattedScheduleEnd);

    // Update class
    const { data: classData, error: classError } = await supabase
      .from('classes')
      .update({
        class_name: name,
        subject_id: subject_id,
        section_id: section_id,
        professor_id: prof_id,
        schedule_start: formattedScheduleStart,
        schedule_end: formattedScheduleEnd
      })
      .eq('class_id', class_id)
      .select('*')
      .single()

    if (classError) {
      console.error("Class update error:", classError)
      return NextResponse.json({ error: "Failed to update class" }, { status: 500 })
    }

    // Fetch full class details for response
    const { data: fullClass } = await supabase
      .from('classes')
      .select(`
        *,
        subjects (subject_name, subject_code, units, courses (course_id, course_name, departments (department_id, department_name))),
        sections (section_name, courses (course_id), year_level (name)),
        professors (prof_id, first_name, middle_name, last_name, accounts (email))
      `)
      .eq('class_id', classData.class_id)
      .single()

    return NextResponse.json({ 
      message: "Class updated successfully",
      class: {
        id: classData.class_id.toString(),
        name: classData.class_name,
        subject: fullClass?.subjects?.subject_name || 'N/A',
        subjectCode: fullClass?.subjects?.subject_code || 'N/A',
        units: fullClass?.subjects?.units || 0,
        section: fullClass?.sections?.section_name || 'N/A',
        professor: fullClass?.professors 
          ? `${fullClass.professors.last_name}, ${fullClass.professors.first_name}${fullClass.professors.middle_name ? ` ${fullClass.professors.middle_name}` : ''}`
          : 'Unassigned',
        professorEmail: fullClass?.professors?.accounts?.email || 'N/A',
        course: fullClass?.sections?.courses?.course_name || 'N/A',
        department: fullClass?.subjects?.courses?.departments?.department_name || 'N/A',
        yearLevel: fullClass?.sections?.year_level?.name || 'N/A',
        // Include raw timestamps for accurate display (from fresh database query)
        schedule_start: fullClass?.schedule_start,
        schedule_end: fullClass?.schedule_end,
        class_id: classData.class_id,
        subject_id: subject_id,
        section_id: section_id,
        prof_id: prof_id || 0,
        course_id: fullClass?.subjects?.courses?.course_id || 0,
        department_id: fullClass?.subjects?.courses?.departments?.department_id || 0,
        created_at: classData.created_at,
        updated_at: classData.updated_at
      }
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const class_id = searchParams.get('class_id')

    if (!class_id) {
      return NextResponse.json({ error: "Class ID is required" }, { status: 400 })
    }

    // Soft delete: Update status to 'inactive' instead of deleting
    const { error: classError } = await supabase
      .from('classes')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('class_id', class_id)

    if (classError) {   
      console.error("Class archive error:", classError)
      return NextResponse.json({ error: "Failed to archive class" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Class archived successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}