import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { LearningResource, UpdateLearningResourceRequest } from "@/types/learning-resources"

// GET - Fetch a specific learning resource by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('learning_resources')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Learning resource not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching learning resource:', error)
      return NextResponse.json(
        { error: 'Failed to fetch learning resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/admin/learning-resources/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update a learning resource
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body: UpdateLearningResourceRequest = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // Prepare the data for update
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    // Only include fields that are provided in the request
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.source !== undefined) updateData.source = body.source
    if (body.url !== undefined) updateData.url = body.url
    if (body.author !== undefined) updateData.author = body.author
    if (body.topics !== undefined) updateData.topics = body.topics
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.is_active !== undefined) updateData.is_active = body.is_active

    const { data, error } = await supabaseServer
      .from('learning_resources')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Learning resource not found' },
          { status: 404 }
        )
      }
      console.error('Error updating learning resource:', error)
      return NextResponse.json(
        { error: 'Failed to update learning resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in PUT /api/admin/learning-resources/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Delete a learning resource
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Resource ID is required' },
        { status: 400 }
      )
    }

    // First, check if the resource exists
    const { data: existingResource, error: fetchError } = await supabaseServer
      .from('learning_resources')
      .select('id')
      .eq('id', id)
      .single()

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Learning resource not found' },
          { status: 404 }
        )
      }
      console.error('Error checking learning resource existence:', fetchError)
      return NextResponse.json(
        { error: 'Failed to check learning resource' },
        { status: 500 }
      )
    }

    // Delete the resource
    const { error } = await supabaseServer
      .from('learning_resources')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting learning resource:', error)
      return NextResponse.json(
        { error: 'Failed to delete learning resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Learning resource deleted successfully' })
  } catch (error) {
    console.error('Error in DELETE /api/admin/learning-resources/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
