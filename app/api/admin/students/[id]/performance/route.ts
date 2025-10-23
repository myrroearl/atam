import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const studentId = params.id

    // Get student details
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        student_id,
        first_name,
        middle_name,
        last_name,
        birthday,
        address,
        contact_number,
        created_at,
        updated_at,
        accounts (
          account_id,
          email,
          status
        ),
        sections (
          section_id,
          section_name,
          year_level_id,
          course_id,
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
          )
        )
      `)
      .eq('student_id', studentId)
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Student not found" }, { status: 404 })
    }

    // Get student's grades with professor information from classes
    const { data: grades, error: gradesError } = await supabase
      .from('final_grades')
      .select(`
        grade,
        completion,
        taken,
        credited,
        remarks,
        year_taken,
        subjects (
          subject_id,
          subject_code,
          subject_name,
          units,
          courses (
            course_code,
            course_name,
            departments (
              department_name
            )
          ),
          year_level (
            name,
            year_level_id
          ),
          semester (
            semester_name,
            semester_id
          )
        )
      `)
      .eq('student_id', studentId)
      .order('year_taken', { ascending: false })

    if (gradesError) {
      console.error("Grades lookup error:", gradesError)
      return NextResponse.json({ error: "Failed to fetch grades" }, { status: 500 })
    }

    // Get student's grade entries for detailed performance
    const { data: gradeEntries, error: gradeEntriesError } = await supabase
      .from('grade_entries')
      .select(`
        grade_id,
        score,
        max_score,
        attendance,
        entry_type,
        date_recorded,
        classes (
          class_id,
          class_name,
          subjects (
            subject_id,
            subject_code,
            subject_name,
            courses (
              course_code,
              course_name
            ),
            semester (
              semester_id,
              semester_name
            )
          ),
          professors (
            first_name,
            middle_name,
            last_name
          )
        ),
        grade_components (
          component_id,
          component_name,
          weight_percentage
        ),
        learning_outcomes (
          outcome_id,
          outcome_code,
          outcome_description,
          proficiency_level
        )
      `)
      .eq('student_id', studentId)
      .order('date_recorded', { ascending: false })

    if (gradeEntriesError) {
      console.error("Grade entries lookup error:", gradeEntriesError)
      return NextResponse.json({ error: "Failed to fetch grade entries" }, { status: 500 })
    }

    // Get professor information for each subject from classes
    const professorMap = new Map<number, string>()
    
    if (student.sections?.section_id) {
      const { data: classes } = await supabase
        .from('classes')
        .select(`
          subject_id,
          professors (
            first_name,
            middle_name,
            last_name
          )
        `)
        .eq('section_id', student.sections.section_id)
      
      if (classes) {
        classes.forEach((cls: any) => {
          if (cls.subject_id && cls.professors) {
            const profName = cls.professors.middle_name
              ? `${cls.professors.first_name} ${cls.professors.middle_name} ${cls.professors.last_name}`
              : `${cls.professors.first_name} ${cls.professors.last_name}`
            professorMap.set(cls.subject_id, profName)
          }
        })
      }
    }

    // Calculate overall statistics
    const totalUnits = grades?.reduce((sum, grade) => sum + (grade.subjects?.units || 0), 0) || 0
    const totalGradePoints = grades?.reduce((sum, grade) => sum + ((grade.grade || 0) * (grade.subjects?.units || 0)), 0) || 0
    const gwa = totalUnits > 0 ? (totalGradePoints / totalUnits) : 0

    const passedSubjects = grades?.filter(grade => grade.grade && grade.grade >= 75).length || 0
    const failedSubjects = grades?.filter(grade => grade.grade && grade.grade < 75).length || 0
    const totalSubjects = grades?.length || 0

    // Calculate GWA per semester
    const semesterGWA: Record<string, { gwa: number; units: number; semesterName: string; yearTaken: number }> = {}
    grades?.forEach(grade => {
      if (grade.subjects?.semester?.semester_id && grade.grade && grade.subjects?.units) {
        const semKey = `${grade.year_taken}-${grade.subjects.semester.semester_id}`
        if (!semesterGWA[semKey]) {
          semesterGWA[semKey] = {
            gwa: 0,
            units: 0,
            semesterName: grade.subjects.semester.semester_name,
            yearTaken: grade.year_taken || new Date().getFullYear()
          }
        }
        semesterGWA[semKey].gwa += grade.grade * grade.subjects.units
        semesterGWA[semKey].units += grade.subjects.units
      }
    })

    const gwaPerSemester = Object.entries(semesterGWA).map(([key, data]) => ({
      semester: data.semesterName,
      year: data.yearTaken,
      gwa: data.units > 0 ? parseFloat((data.gwa / data.units).toFixed(2)) : 0,
      units: data.units
    })).sort((a, b) => b.year - a.year || a.semester.localeCompare(b.semester))

    // Calculate attendance per semester from grade_entries
    const semesterAttendance: Record<string, { present: number; absent: number; late: number; excused: number; total: number; semesterName: string; yearTaken: number }> = {}
    
    gradeEntries?.forEach(entry => {
      if (entry.attendance && entry.classes?.subjects?.semester) {
        const semId = entry.classes.subjects.semester.semester_id
        const semName = entry.classes.subjects.semester.semester_name
        // Use date_recorded year as yearTaken approximation
        const year = entry.date_recorded ? new Date(entry.date_recorded).getFullYear() : new Date().getFullYear()
        const semKey = `${year}-${semId}`
        
        if (!semesterAttendance[semKey]) {
          semesterAttendance[semKey] = {
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
            total: 0,
            semesterName: semName,
            yearTaken: year
          }
        }
        
        semesterAttendance[semKey].total++
        
        switch (entry.attendance.toLowerCase()) {
          case 'present':
            semesterAttendance[semKey].present++
            break
          case 'absent':
            semesterAttendance[semKey].absent++
            break
          case 'late':
            semesterAttendance[semKey].late++
            break
          case 'excused':
            semesterAttendance[semKey].excused++
            break
        }
      }
    })

    const attendancePerSemester = Object.entries(semesterAttendance).map(([key, data]) => ({
      semester: data.semesterName,
      year: data.yearTaken,
      present: data.present,
      absent: data.absent,
      late: data.late,
      excused: data.excused,
      total: data.total,
      presentPercentage: data.total > 0 ? parseFloat(((data.present / data.total) * 100).toFixed(1)) : 0
    })).sort((a, b) => b.year - a.year || a.semester.localeCompare(b.semester))

    // Transform the data
    const studentData = {
      // Basic info
      student_id: student.student_id,
      name: student.middle_name 
        ? `${student.last_name}, ${student.first_name} ${student.middle_name}`
        : `${student.last_name}, ${student.first_name}`,
      email: student.accounts?.email || 'N/A',
      birthday: student.birthday,
      address: student.address,
      contact_number: student.contact_number,
      status: student.accounts?.status || 'active',
      
      // Academic info
      section: student.sections?.section_name || 'N/A',
      course: student.sections?.courses?.course_name || 'N/A',
      courseCode: student.sections?.courses?.course_code || 'N/A',
      department: student.sections?.courses?.departments?.department_name || 'N/A',
      yearLevel: student.sections?.year_level?.name || 'N/A',
      
      // Performance statistics
      gwa: parseFloat(gwa.toFixed(2)),
      totalUnits,
      passedSubjects,
      failedSubjects,
      totalSubjects,
      completionRate: totalSubjects > 0 ? ((passedSubjects / totalSubjects) * 100).toFixed(1) : '0',
      
      // Grades
      grades: grades?.map(grade => ({
        subject_id: grade.subjects?.subject_id,
        subjectCode: grade.subjects?.subject_code,
        subjectName: grade.subjects?.subject_name,
        units: grade.subjects?.units || 0,
        grade: grade.grade,
        completion: grade.completion,
        taken: grade.taken,
        credited: grade.credited,
        remarks: grade.remarks,
        yearTaken: grade.year_taken,
        course: grade.subjects?.courses?.course_name,
        department: grade.subjects?.courses?.departments?.department_name,
        yearLevel: grade.subjects?.year_level?.name,
        semester: grade.subjects?.semester?.semester_name,
        professor: grade.subjects?.subject_id ? professorMap.get(grade.subjects.subject_id) || 'N/A' : 'N/A'
      })) || [],
      
      // Performance analytics
      gwaPerSemester,
      attendancePerSemester,
      
      // Grade entries
      gradeEntries: gradeEntries?.map(entry => ({
        grade_id: entry.grade_id,
        score: entry.score,
        maxScore: entry.max_score,
        attendance: entry.attendance,
        entryType: entry.entry_type,
        dateRecorded: entry.date_recorded,
        className: entry.classes?.class_name,
        subject: entry.classes?.subjects?.subject_name,
        subjectCode: entry.classes?.subjects?.subject_code,
        course: entry.classes?.subjects?.courses?.course_name,
        professor: entry.classes?.professors?.middle_name 
          ? `${entry.classes.professors.last_name}, ${entry.classes.professors.first_name} ${entry.classes.professors.middle_name}`
          : `${entry.classes?.professors?.last_name}, ${entry.classes?.professors?.first_name}`,
        component: entry.grade_components?.component_name,
        weight: entry.grade_components?.weight_percentage,
        outcome: entry.learning_outcomes?.outcome_code,
        outcomeDescription: entry.learning_outcomes?.outcome_description,
        proficiencyLevel: entry.learning_outcomes?.proficiency_level
      })) || [],
      
      created_at: student.created_at,
      updated_at: student.updated_at
    }

    return NextResponse.json({ student: studentData })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}