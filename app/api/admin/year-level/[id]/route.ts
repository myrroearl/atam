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
    const yearLevelId = params.id

    // Fetch year level details
    const { data: yearLevel, error } = await supabase
      .from('year_level')
      .select(`
        year_level_id,
        name,
        course_id,
        created_at,
        updated_at
      `)
      .eq('year_level_id', yearLevelId)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Year level not found' }, { status: 404 })
    }

    return NextResponse.json({ yearLevel })
  } catch (error) {
    console.error('Error in year level GET:', error)
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
    const yearLevelId = params.id
    const body = await request.json()
    const { name } = body

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Update year level
    const { data: yearLevel, error } = await supabase
      .from('year_level')
      .update({
        name,
        updated_at: new Date().toISOString()
      })
      .eq('year_level_id', yearLevelId)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update year level' }, { status: 500 })
    }

    return NextResponse.json({ yearLevel })
  } catch (error) {
    console.error('Error in year level PUT:', error)
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
    const yearLevelId = params.id

    // Soft delete: Update status to 'inactive' instead of deleting
    const { error } = await supabase
      .from('year_level')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('year_level_id', yearLevelId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to archive year level' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Year level archived successfully' })
  } catch (error) {
    console.error('Error in year level DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}