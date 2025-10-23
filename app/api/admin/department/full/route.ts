import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET - Fetch a specific department with its grading components
// If checkDeletion=true, also return counts of related data that will be deleted
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const departmentId = params.id
    const { searchParams } = new URL(request.url)
    const checkDeletion = searchParams.get('checkDeletion') === 'true'

    const { data: department, error } = await supabase
      .from('departments')
      .select(`
        *,
        grade_components (
          component_id,
          component_name,
          weight_percentage,
          created_at
        )
      `)
      .eq('department_id', departmentId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: "Department not found" }, { status: 404 })
      }
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch department" }, { status: 500 })
    }

    // If checkDeletion is true, get counts of all related data
    if (checkDeletion) {
      const deletionImpact = {
        courses: 0,
        yearLevels: 0,
        semesters: 0,
        subjects: 0,
        sections: 0,
        gradeComponents: department.grade_components?.length || 0
      }

      // Get courses
      const { data: courses } = await supabase
        .from('courses')
        .select('course_id')
        .eq('department_id', departmentId)

      const courseIds = courses?.map(c => c.course_id) || []
      deletionImpact.courses = courseIds.length

      if (courseIds.length > 0) {
        // Get year levels
        const { data: yearLevels } = await supabase
          .from('year_level')
          .select('year_level_id')
          .in('course_id', courseIds)

        const yearLevelIds = yearLevels?.map(yl => yl.year_level_id) || []
        deletionImpact.yearLevels = yearLevelIds.length

        if (yearLevelIds.length > 0) {
          // Get semesters
          const { data: semesters } = await supabase
            .from('semester')
            .select('semester_id')
            .in('year_level_id', yearLevelIds)

          deletionImpact.semesters = semesters?.length || 0
        }

        // Get subjects
        const { data: subjects } = await supabase
          .from('subjects')
          .select('subject_id')
          .in('course_id', courseIds)

        deletionImpact.subjects = subjects?.length || 0

        // Get sections
        const { data: sections } = await supabase
          .from('sections')
          .select('section_id')
          .in('course_id', courseIds)

        deletionImpact.sections = sections?.length || 0
      }

      return NextResponse.json({ department, deletionImpact })
    }

    return NextResponse.json({ department })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update a department
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const departmentId = params.id
    const body = await request.json()
    const { department_name, description, dean_name } = body

    // Validate required fields
    if (!department_name || !dean_name) {
      return NextResponse.json({ 
        error: "Department name and dean name are required" 
      }, { status: 400 })
    }

    // Check if department exists
    const { data: existingDept } = await supabase
      .from('departments')
      .select('department_id')
      .eq('department_id', departmentId)
      .single()

    if (!existingDept) {
      return NextResponse.json({ 
        error: "Department not found" 
      }, { status: 404 })
    }

    // Check if department name already exists (excluding current department)
    const { data: duplicateDept } = await supabase
      .from('departments')
      .select('department_id')
      .eq('department_name', department_name)
      .neq('department_id', departmentId)
      .single()

    if (duplicateDept) {
      return NextResponse.json({ 
        error: "Department with this name already exists" 
      }, { status: 409 })
    }

    // Update department
    const { data: updatedDepartment, error } = await supabase
      .from('departments')
      .update({
        department_name,
        description: description || null,
        dean_name,
        updated_at: new Date().toISOString()
      })
      .eq('department_id', departmentId)
      .select()
      .single()

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to update department" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Department updated successfully",
      department: updatedDepartment 
    })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Soft delete a department (set status to 'inactive')
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('🗑️ DELETE department API called with ID:', params.id)
    
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      console.log('❌ Unauthorized access attempt')
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const departmentId = params.id
    console.log('🔍 Checking department existence for ID:', departmentId)

    // Check if department exists
    const { data: existingDept, error: checkError } = await supabase
      .from('departments')
      .select('department_id, department_name')
      .eq('department_id', departmentId)
      .single()

    if (checkError || !existingDept) {
      console.log('❌ Department not found')
      return NextResponse.json({ 
        error: "Department not found" 
      }, { status: 404 })
    }

    console.log('✅ Department exists:', existingDept.department_name)

    // Soft delete: Update status to 'inactive'
    console.log('📦 Archiving department (soft delete)...')
    const { error: archiveError } = await supabase
      .from('departments')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('department_id', departmentId)

    if (archiveError) {
      console.error("❌ Error archiving department:", archiveError)
      return NextResponse.json({ 
        error: "Failed to archive department" 
      }, { status: 500 })
    }

    console.log('✅ Department archived successfully')
    return NextResponse.json({ 
      message: "Department archived successfully" 
    })

  } catch (error) {
    console.error("❌ API error:", error)
    return NextResponse.json({ 
      error: "Internal server error" 
    }, { status: 500 })
  }
}