import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// POST - Create a new department with grading components
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { department, gradeComponents } = body

    // Validate required fields
    if (!department.department_name || !department.dean_name) {
      return NextResponse.json({ 
        error: "Department name and dean name are required" 
      }, { status: 400 })
    }

    // Validate grading components
    if (!gradeComponents || gradeComponents.length === 0) {
      return NextResponse.json({ 
        error: "At least one grading component is required" 
      }, { status: 400 })
    }

    // Validate total weight percentage
    const totalWeight = gradeComponents.reduce((sum: number, comp: any) => 
      sum + (comp.weight_percentage || 0), 0
    )

    if (Math.abs(totalWeight - 100) > 0.01) { // Allow for small floating point differences
      return NextResponse.json({ 
        error: `Total weight percentage must equal 100%. Current total: ${totalWeight}%` 
      }, { status: 400 })
    }

    // Validate individual components
    for (const component of gradeComponents) {
      if (!component.component_name || !component.weight_percentage) {
        return NextResponse.json({ 
          error: "All grading components must have a name and weight percentage" 
        }, { status: 400 })
      }

      if (component.weight_percentage <= 0 || component.weight_percentage > 100) {
        return NextResponse.json({ 
          error: "Weight percentage must be between 0 and 100" 
        }, { status: 400 })
      }
    }

    // Check if department name already exists
    const { data: existingDept } = await supabase
      .from('departments')
      .select('department_id')
      .eq('department_name', department.department_name)
      .single()

    if (existingDept) {
      return NextResponse.json({ 
        error: "Department with this name already exists" 
      }, { status: 409 })
    }

    // Start transaction-like operation
    // First, create the department
    const { data: newDepartment, error: deptError } = await supabase
      .from('departments')
      .insert([{
        department_name: department.department_name,
        description: department.description || null,
        dean_name: department.dean_name
      }])
      .select()
      .single()

    if (deptError) {
      console.error("Database error creating department:", deptError)
      return NextResponse.json({ error: "Failed to create department" }, { status: 500 })
    }

    // Then, create the grading components
    const componentsToInsert = gradeComponents.map((component: any) => ({
      department_id: newDepartment.department_id,
      component_name: component.component_name,
      weight_percentage: component.weight_percentage
    }))

    const { error: componentsError } = await supabase
      .from('grade_components')
      .insert(componentsToInsert)

    if (componentsError) {
      console.error("Database error creating grade components:", componentsError)
      
      // Rollback: delete the department if grade components failed
      await supabase
        .from('departments')
        .delete()
        .eq('department_id', newDepartment.department_id)
      
      return NextResponse.json({ 
        error: "Failed to create grading components" 
      }, { status: 500 })
    }

    // Fetch the complete department with its grade components
    const { data: completeDepartment, error: fetchError } = await supabase
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
      .eq('department_id', newDepartment.department_id)
      .single()

    if (fetchError) {
      console.error("Error fetching complete department:", fetchError)
      // Department was created successfully, just return the basic info
      return NextResponse.json({ 
        message: "Department created successfully with grading components",
        department: newDepartment,
        gradeComponents: componentsToInsert
      }, { status: 201 })
    }

    return NextResponse.json({ 
      message: "Department created successfully with grading components",
      department: completeDepartment
    }, { status: 201 })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update a department with its grading components
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const { department_id, department, gradeComponents } = body

    // Validate required fields
    if (!department_id) {
      return NextResponse.json({ 
        error: "Department ID is required" 
      }, { status: 400 })
    }

    if (!department.department_name || !department.dean_name) {
      return NextResponse.json({ 
        error: "Department name and dean name are required" 
      }, { status: 400 })
    }

    // Validate grading components
    if (!gradeComponents || gradeComponents.length === 0) {
      return NextResponse.json({ 
        error: "At least one grading component is required" 
      }, { status: 400 })
    }

    // Validate total weight percentage
    const totalWeight = gradeComponents.reduce((sum: number, comp: any) => 
      sum + (comp.weight_percentage || 0), 0
    )

    if (Math.abs(totalWeight - 100) > 0.01) {
      return NextResponse.json({ 
        error: `Total weight percentage must equal 100%. Current total: ${totalWeight}%` 
      }, { status: 400 })
    }

    // Validate individual components
    for (const component of gradeComponents) {
      if (!component.component_name || component.weight_percentage === undefined) {
        return NextResponse.json({ 
          error: "All grading components must have a name and weight percentage" 
        }, { status: 400 })
      }

      if (component.weight_percentage <= 0 || component.weight_percentage > 100) {
        return NextResponse.json({ 
          error: "Weight percentage must be between 0 and 100" 
        }, { status: 400 })
      }
    }

    // Check if department exists
    const { data: existingDept } = await supabase
      .from('departments')
      .select('department_id')
      .eq('department_id', department_id)
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
      .eq('department_name', department.department_name)
      .neq('department_id', department_id)
      .single()

    if (duplicateDept) {
      return NextResponse.json({ 
        error: "Department with this name already exists" 
      }, { status: 409 })
    }

    // Start transaction-like operation
    // First, update the department
    const { data: updatedDepartment, error: deptError } = await supabase
      .from('departments')
      .update({
        department_name: department.department_name,
        description: department.description || null,
        dean_name: department.dean_name,
        updated_at: new Date().toISOString()
      })
      .eq('department_id', department_id)
      .select()
      .single()

    if (deptError) {
      console.error("Database error updating department:", deptError)
      return NextResponse.json({ error: "Failed to update department" }, { status: 500 })
    }

    // Delete existing grade components
    const { error: deleteError } = await supabase
      .from('grade_components')
      .delete()
      .eq('department_id', department_id)

    if (deleteError) {
      console.error("Database error deleting grade components:", deleteError)
      return NextResponse.json({ 
        error: "Failed to update grading components" 
      }, { status: 500 })
    }

    // Insert new grade components
    const componentsToInsert = gradeComponents.map((component: any) => ({
      department_id: department_id,
      component_name: component.component_name,
      weight_percentage: component.weight_percentage
    }))

    const { error: componentsError } = await supabase
      .from('grade_components')
      .insert(componentsToInsert)

    if (componentsError) {
      console.error("Database error creating grade components:", componentsError)
      return NextResponse.json({ 
        error: "Failed to update grading components" 
      }, { status: 500 })
    }

    // Fetch the complete updated department with its grade components
    const { data: completeDepartment, error: fetchError } = await supabase
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
      .eq('department_id', department_id)
      .single()

    if (fetchError) {
      console.error("Error fetching complete department:", fetchError)
      // Department was updated successfully, just return the basic info
      return NextResponse.json({ 
        message: "Department updated successfully with grading components",
        department: updatedDepartment
      })
    }

    return NextResponse.json({ 
      message: "Department updated successfully with grading components",
      department: completeDepartment
    })

  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
