import { getServerSession } from "next-auth"
import { NextRequest, NextResponse } from "next/server"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get all active sections with related data
    const { data: sections, error } = await supabase
      .from('sections')
      .select(`
        section_id,
        section_name,
        created_at,
        updated_at,
        courses (
          course_id,
          course_code,
          course_name,
          departments (
            department_id,
            department_name
          )
        ),
        year_level (
          year_level_id,
          name
        )
      `)
      .eq('status', 'active')
      .order('section_name', { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch sections" }, { status: 500 })
    }

    // Transform the data to match the frontend format
    const transformedSections = sections?.map((section: any) => ({
      id: section.section_id.toString(),
      name: section.section_name,
      course: section.courses?.course_name || 'N/A',
      department: section.courses?.departments?.department_name || 'N/A',
      yearLevel: section.year_level?.name || 'N/A',
      courseCode: section.courses?.course_code || 'N/A',
      // Internal IDs for updates
      section_id: section.section_id,
      course_id: section.courses?.course_id || 0,
      year_level_id: section.year_level?.year_level_id || 0,
      department_id: section.courses?.departments?.department_id || 0,
      created_at: section.created_at,
      updated_at: section.updated_at
    })) || []

    return NextResponse.json({ sections: transformedSections })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      course,
      yearLevel
    } = body

    // Validate required fields
    if (!name || !course || !yearLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get course_id first
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('course_id')
      .eq('course_name', course)
      .single()

    if (courseError || !courseData) {
      console.error("Course lookup error:", courseError)
      return NextResponse.json({ error: "Invalid course" }, { status: 400 })
    }

    // Get year_level_id for the specific course
    const { data: yearLevelData, error: yearLevelError } = await supabase
      .from('year_level')
      .select('year_level_id')
      .eq('name', yearLevel)
      .eq('course_id', courseData.course_id)
      .single()

    if (yearLevelError || !yearLevelData) {
      console.error("Year level lookup error:", yearLevelError)
      console.error("Looking for year level:", yearLevel, "for course_id:", courseData.course_id)
      return NextResponse.json({ error: "Invalid year level for the selected course" }, { status: 400 })
    }

    // Create section
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .insert({
        section_name: name,
        year_level_id: yearLevelData.year_level_id,
        course_id: courseData.course_id
      })
      .select(`
        section_id,
        section_name,
        created_at,
        updated_at,
        courses (
          course_id,
          course_code,
          course_name,
          departments (
            department_id,
            department_name
          )
        ),
        year_level (
          year_level_id,
          name
        )
      `)
      .single()

    if (sectionError) {
      console.error("Section creation error:", sectionError)
      return NextResponse.json({ error: "Failed to create section" }, { status: 500 })
    }

    // Transform the data to match the frontend format
    const transformedSection = {
      id: section.section_id.toString(),
      name: section.section_name,
      course: (section.courses as any)?.course_name || 'N/A',
      department: (section.courses as any)?.departments?.department_name || 'N/A',
      yearLevel: (section.year_level as any)?.name || 'N/A',
      courseCode: (section.courses as any)?.course_code || 'N/A',
      // Internal IDs for updates
      section_id: section.section_id,
      course_id: (section.courses as any)?.course_id || 0,
      year_level_id: (section.year_level as any)?.year_level_id || 0,
      department_id: (section.courses as any)?.departments?.department_id || 0,
      created_at: section.created_at,
      updated_at: section.updated_at
    }

    return NextResponse.json({ 
      message: "Section created successfully",
      section: transformedSection
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const body = await request.json()
    const {
      section_id,
      name,
      course,
      yearLevel
    } = body

    // Validate required fields
    if (!section_id || !name || !course || !yearLevel) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get course_id first
    const { data: courseData, error: courseError } = await supabase
      .from('courses')
      .select('course_id')
      .eq('course_name', course)
      .single()

    if (courseError || !courseData) {
      console.error("Course lookup error:", courseError)
      return NextResponse.json({ error: "Invalid course" }, { status: 400 })
    }

    // Get year_level_id for the specific course
    const { data: yearLevelData, error: yearLevelError } = await supabase
      .from('year_level')
      .select('year_level_id')
      .eq('name', yearLevel)
      .eq('course_id', courseData.course_id)
      .single()

    if (yearLevelError || !yearLevelData) {
      console.error("Year level lookup error:", yearLevelError)
      console.error("Looking for year level:", yearLevel, "for course_id:", courseData.course_id)
      return NextResponse.json({ error: "Invalid year level for the selected course" }, { status: 400 })
    }

    // Update section
    const { data: section, error: sectionError } = await supabase
      .from('sections')
      .update({
        section_name: name,
        year_level_id: yearLevelData.year_level_id,
        course_id: courseData.course_id
      })
      .eq('section_id', section_id)
      .select(`
        section_id,
        section_name,
        created_at,
        updated_at,
        courses (
          course_id,
          course_code,
          course_name,
          departments (
            department_id,
            department_name
          )
        ),
        year_level (
          year_level_id,
          name
        )
      `)
      .single()

    if (sectionError) {
      console.error("Section update error:", sectionError)
      return NextResponse.json({ error: "Failed to update section" }, { status: 500 })
    }

    // Transform the data to match the frontend format
    const transformedSection = {
      id: section.section_id.toString(),
      name: section.section_name,
      course: (section.courses as any)?.course_name || 'N/A',
      department: (section.courses as any)?.departments?.department_name || 'N/A',
      yearLevel: (section.year_level as any)?.name || 'N/A',
      courseCode: (section.courses as any)?.course_code || 'N/A',
      // Internal IDs for updates
      section_id: section.section_id,
      course_id: (section.courses as any)?.course_id || 0,
      year_level_id: (section.year_level as any)?.year_level_id || 0,
      department_id: (section.courses as any)?.departments?.department_id || 0,
      created_at: section.created_at,
      updated_at: section.updated_at
    }

    return NextResponse.json({ 
      message: "Section updated successfully",
      section: transformedSection
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const section_id = searchParams.get('section_id')

    if (!section_id) {
      return NextResponse.json({ error: "Section ID is required" }, { status: 400 })
    }

    // Soft delete: Update status to 'inactive' instead of deleting
    const { error: sectionError } = await supabase
      .from('sections')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('section_id', section_id)

    if (sectionError) {
      console.error("Section archive error:", sectionError)
      return NextResponse.json({ error: "Failed to archive section" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Section archived successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}