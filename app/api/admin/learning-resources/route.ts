import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { LearningResource, CreateLearningResourceRequest, LearningResourceFilters } from "@/types/learning-resources"

// GET - Fetch all learning resources with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const type = searchParams.get('type')
    const source = searchParams.get('source')
    const isActive = searchParams.get('is_active')

    // Build the query
    let query = supabaseServer
      .from('learning_resources')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,author.ilike.%${search}%`)
    }

    if (type && type !== 'all') {
      query = query.eq('type', type)
    }

    if (source && source !== 'all') {
      query = query.eq('source', source)
    }

    if (isActive !== null && isActive !== undefined && isActive !== 'all') {
      query = query.eq('is_active', isActive === 'true')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching learning resources:', error)
      return NextResponse.json(
        { error: 'Failed to fetch learning resources' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/learning-resources:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create a new learning resource
export async function POST(request: NextRequest) {
  try {
    const body: CreateLearningResourceRequest = await request.json()

    // Validate required fields
    if (!body.title || !body.type || !body.source || !body.url) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, source, url' },
        { status: 400 }
      )
    }

    // Prepare the data for insertion
    const resourceData = {
      title: body.title,
      description: body.description || null,
      type: body.type,
      source: body.source,
      url: body.url,
      author: body.author || null,
      topics: body.topics || [],
      tags: body.tags || [],
      likes: 0,
      dislikes: 0,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabaseServer
      .from('learning_resources')
      .insert([resourceData])
      .select()
      .single()

    if (error) {
      console.error('Error creating learning resource:', error)
      return NextResponse.json(
        { error: 'Failed to create learning resource' },
        { status: 500 }
      )
    }

    return NextResponse.json({ data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/learning-resources:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
