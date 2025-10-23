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
    const subjectId = params.id

    // Fetch subject details
    const { data: subject, error } = await supabase
      .from('subjects')
      .select(`
        subject_id,
        course_id,
        subject_code,
        subject_name,
        units,
        year_level,
        semester,
        created_at,
        updated_at
      `)
      .eq('subject_id', subjectId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Subject not found' }, { status: 404 })
    }

    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Error in subject GET:', error)
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
    const subjectId = params.id
    const body = await request.json()
    const { subject_code, subject_name, units, year_level, semester } = body

    // Validate required fields
    if (!subject_code || !subject_name || !units || !year_level || !semester) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Update subject
    const { data: subject, error } = await supabase
      .from('subjects')
      .update({
        subject_code,
        subject_name,
        units,
        year_level,
        semester,
        updated_at: new Date().toISOString()
      })
      .eq('subject_id', subjectId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update subject' }, { status: 500 })
    }

    return NextResponse.json({ subject })
  } catch (error) {
    console.error('Error in subject PUT:', error)
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
    const subjectId = params.id

    // Delete subject
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('subject_id', subjectId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subject deleted successfully' })
  } catch (error) {
    console.error('Error in subject DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}