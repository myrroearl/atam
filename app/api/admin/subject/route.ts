import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const courseId = searchParams.get('course_id')

    let query = supabase
      .from('subjects')
      .select(`
        subject_id,
        course_id,
        subject_code,
        subject_name,
        units,
        year_level_id,
        semester_id,
        created_at,
        updated_at,
        year_level (
          year_level_id,
          name,
          course_id
        ),
        semester (
          semester_id,
          semester_name,
          year_level_id
        )
      `)
      .eq('status', 'active')
      .order('subject_name', { ascending: true })

    // If courseId is provided, filter by it
    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    const { data: subjects, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch subjects', details: error.message }, { status: 500 })
    }

    console.log(`Fetched ${subjects?.length || 0} subjects${courseId ? ` for course ${courseId}` : ''}`)
    return NextResponse.json({ subjects: subjects || [] })
  } catch (error) {
    console.error('Error in subjects GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { course_id, subject_code, subject_name, units, year_level_id, semester_id } = body

    console.log('Subject POST request body:', { course_id, subject_code, subject_name, units, year_level_id, semester_id })

    // Validate required fields
    if (!course_id || !subject_code || !subject_name || !units || !year_level_id || !semester_id) {
      console.log('Validation failed:', { course_id, subject_code, subject_name, units, year_level_id, semester_id })
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Verify year level exists
    const { data: yearLevel, error: yearLevelError } = await supabase
      .from('year_level')
      .select('year_level_id, name')
      .eq('year_level_id', year_level_id)
      .single()

    if (yearLevelError) {
      console.error('Year level not found:', yearLevelError)
      return NextResponse.json({ error: 'Year level not found' }, { status: 404 })
    }

    // Verify semester exists
    const { data: semesterData, error: semesterError } = await supabase
      .from('semester')
      .select('semester_id, semester_name')
      .eq('semester_id', semester_id)
      .single()

    if (semesterError) {
      console.error('Semester not found:', semesterError)
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
    }

    // Create subject
    console.log('Creating subject with:', { course_id, subject_code, subject_name, units, year_level_id, semester_id })
    const { data: subject, error } = await supabase
      .from('subjects')
      .insert({
        course_id: parseInt(course_id),
        subject_code,
        subject_name,
        units: parseInt(units),
        year_level_id: parseInt(year_level_id),
        semester_id: parseInt(semester_id)
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating subject:', error)
      return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 })
    }

    console.log('Subject created successfully:', subject)
    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Error in subjects POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { subject_id, subject_code, subject_name, units } = body

    console.log('Subject PUT request body:', { subject_id, subject_code, subject_name, units })

    // Validate required fields
    if (!subject_id || !subject_code || !subject_name || !units) {
      console.log('Validation failed:', { subject_id, subject_code, subject_name, units })
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Update subject
    console.log('Updating subject with:', { subject_id, subject_code, subject_name, units })
    const { data: subject, error } = await supabase
      .from('subjects')
      .update({
        subject_code,
        subject_name,
        units: parseInt(units),
        updated_at: new Date().toISOString()
      })
      .eq('subject_id', subject_id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating subject:', error)
      return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
    }

    if (!subject) {
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    console.log('Subject updated successfully:', subject)
    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Error in subjects PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const subjectId = searchParams.get('subject_id')

    console.log('Subject DELETE request:', { subject_id: subjectId })

    if (!subjectId) {
      return NextResponse.json(
        { error: 'Subject ID is required' },
        { status: 400 }
      )
    }

    // Soft delete: Update status to 'inactive' instead of deleting
    console.log('Archiving subject with ID:', subjectId)
    const { error } = await supabase
      .from('subjects')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('subject_id', subjectId)

    if (error) {
      console.error('Database error archiving subject:', error)
      return NextResponse.json({ error: 'Failed to archive subject' }, { status: 500 })
    }

    console.log('Subject archived successfully')
    return NextResponse.json({ message: 'Subject archived successfully' })
  } catch (error) {
    console.error('Error in subjects DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}