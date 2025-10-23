import { NextRequest, NextResponse } from "next/server"
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
    const courseId = params.id

    // Fetch course details
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select(`
        course_id,
        department_id,
        course_code,
        course_name,
        description,
        created_at,
        updated_at,
        departments (
          department_id,
          department_name,
          description,
          dean_name
        )
      `)
      .eq('course_id', courseId)
      .single()

    if (courseError) {
      console.error('Database error:', courseError)
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error in course GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id
    const body = await request.json()
    const { course_code, course_name, description } = body

    // Validate required fields
    if (!course_code || !course_name) {
      return NextResponse.json(
        { error: 'Course code and name are required' },
        { status: 400 }
      )
    }

    // Update course
    const { data: course, error } = await supabase
      .from('courses')
      .update({
        course_code,
        course_name,
        description: description || null,
        updated_at: new Date().toISOString()
      })
      .eq('course_id', courseId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update course' }, { status: 500 })
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('Error in course PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = params.id

    // Soft delete: Update status to 'inactive' instead of deleting
    const { error } = await supabase
      .from('courses')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('course_id', courseId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to archive course' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Course archived successfully' })
  } catch (error) {
    console.error('Error in course DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}