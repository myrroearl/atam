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
    // For now, return a placeholder response
    return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
  } catch (error) {
    console.error('Error in semester GET:', error)
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
    // For now, return a placeholder response
    return NextResponse.json({ message: 'Semester update not implemented yet' }, { status: 501 })
  } catch (error) {
    console.error('Error in semester PUT:', error)
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
    const semesterId = params.id

    // Soft delete: Update status to 'inactive' instead of deleting
    const { error } = await supabase
      .from('semester')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('semester_id', semesterId)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to archive semester' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Semester archived successfully' })
  } catch (error) {
    console.error('Error in semester DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}