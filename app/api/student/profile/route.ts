import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get student profile with related data
    const { data: student, error } = await supabaseServer
      .from('students')
      .select(`
        *,
        profile_picture_url,
        accounts (
          email,
          status
        ),
        sections (
          section_name,
          year_level (
            name,
            courses (
              course_name,
              course_code,
              departments (
                department_name
              )
            )
          )
        ),
        final_grades (
          grade,
          completion,
          taken,
          credited,
          remarks,
          year_taken,
          subjects (
            subject_name,
            subject_code,
            units
          )
        )
      `)
      .eq('account_id', session.user.account_id)
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
    }

    // Calculate GPA from final grades
    const validGrades = student.final_grades?.filter(g => g.grade != null && g.grade >= 0) || []
    const totalUnits = validGrades.reduce((sum, g) => sum + (Number((g.subjects as any)?.units) || 0), 0)
    const weightedGradePoints = validGrades.reduce((sum, g) => {
      const units = Number((g.subjects as any)?.units) || 0
      const grade = Number(g.grade) || 0
      return sum + (grade * units)
    }, 0)
    const gpa = totalUnits > 0 ? weightedGradePoints / totalUnits : 0

    // Calculate academic progress
    const passedSubjects = validGrades.filter(g => Number(g.grade) >= 75).length
    const totalSubjects = validGrades.length
    const completionRate = totalSubjects > 0 ? (passedSubjects / totalSubjects) * 100 : 0

    // Determine academic standing
    let academicStanding = "Good"
    if (gpa >= 3.5) academicStanding = "Excellent"
    else if (gpa >= 3.0) academicStanding = "Very Good"
    else if (gpa >= 2.5) academicStanding = "Good"
    else if (gpa >= 2.0) academicStanding = "Satisfactory"
    else academicStanding = "Needs Improvement"

    // Calculate expected graduation based on year level and course duration
    const currentYear = new Date().getFullYear()
    const yearLevel = student.sections?.year_level?.name || "1st Year"
    const yearNumber = parseInt(yearLevel.split(" ")[0]) || 1
    const courseDuration = 4 // Assuming 4-year course
    const remainingYears = courseDuration - yearNumber + 1
    const expectedGraduationYear = currentYear + remainingYears

    // Enhanced student data with calculated values
    const enhancedStudent = {
      ...student,
      academicInfo: {
        gpa: Math.round(gpa * 100) / 100,
        academicStanding,
        passedSubjects,
        totalSubjects,
        completionRate: Math.round(completionRate * 100) / 100,
        totalUnits,
        expectedGraduationYear,
        remainingYears
      }
    }

    return NextResponse.json({ student: enhancedStudent })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}