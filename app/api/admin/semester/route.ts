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
    const yearLevelId = searchParams.get('year_level_id')

    if (!courseId && !yearLevelId) {
      return NextResponse.json({ error: 'Either Course ID or Year Level ID is required' }, { status: 400 })
    }

    let query = supabase
      .from('semester')
      .select(`
        semester_id,
        semester_name,
        year_level_id,
        created_at,
        updated_at,
        year_level (
          year_level_id,
          name,
          course_id
        )
      `)
      .eq('status', 'active')

    // Fetch semesters by year level if year_level_id is provided
    if (yearLevelId) {
      query = query.eq('year_level_id', yearLevelId)
    } else if (courseId) {
      // Fetch semesters for the course through year_level relationship
      console.log('🔍 Fetching semesters for course_id:', courseId)
      query = query.eq('year_level.course_id', courseId)
    }

    const { data: semesters, error } = await query.order('year_level_id', { ascending: true })
    
    console.log('📊 Semester query results:', {
      courseId,
      yearLevelId,
      semestersCount: semesters?.length || 0,
      semesters: semesters?.map(s => ({
        id: s.semester_id,
        name: s.semester_name,
        yearLevelId: s.year_level_id,
        yearLevelName: (s.year_level as any)?.name,
        courseId: (s.year_level as any)?.course_id
      }))
    })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch semesters' }, { status: 500 })
    }

    // Enhanced response with semester statistics
    const enhancedSemesters = (semesters || []).map(semester => ({
      ...semester,
      semester_number: extractSemesterNumber(semester.semester_name)
    }))

    // Group semesters by year level for better organization
    const semestersByYearLevel = enhancedSemesters.reduce((acc, semester) => {
      const yearLevelId = semester.year_level_id
      if (!acc[yearLevelId]) {
        acc[yearLevelId] = []
      }
      acc[yearLevelId].push(semester)
      return acc
    }, {} as Record<number, any[]>)

    return NextResponse.json({ 
      semesters: enhancedSemesters,
      semestersByYearLevel,
      total_count: enhancedSemesters.length,
      summary: {
        total_semesters: enhancedSemesters.length,
        year_levels_with_semesters: Object.keys(semestersByYearLevel).length
      }
    })
  } catch (error) {
    console.error('Error in semesters GET:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to extract semester number from semester name
function extractSemesterNumber(semesterName: string): number {
  const name = semesterName.toLowerCase()
  if (name.includes('1st') || name.includes('first')) return 1
  if (name.includes('2nd') || name.includes('second')) return 2
  if (name.includes('summer')) return 3
  return 1 // default to first semester
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { course_id, year_level, semester_name } = body

    console.log('Semester POST request body:', { course_id, year_level, semester_name })

    // Validate required fields
    if (!course_id || !year_level || !semester_name) {
      console.log('Validation failed:', { course_id, year_level, semester_name })
      return NextResponse.json(
        { error: 'Course ID, year level, and semester name are required' },
        { status: 400 }
      )
    }

    // Validate semester name is one of the allowed values
    const allowedSemesters = ['1st Semester', '2nd Semester', 'Summer']
    if (!allowedSemesters.includes(semester_name)) {
      return NextResponse.json(
        { error: 'Invalid semester name. Must be one of: 1st Semester, 2nd Semester, Summer' },
        { status: 400 }
      )
    }

    // Check if year level exists
    const { data: yearLevel, error: yearLevelError } = await supabase
      .from('year_level')
      .select('year_level_id, name')
      .eq('year_level_id', year_level)
      .single()

    if (yearLevelError) {
      console.error('Database error fetching year level:', yearLevelError)
      return NextResponse.json({ error: 'Year level not found' }, { status: 404 })
    }

    if (!yearLevel) {
      return NextResponse.json({ error: 'Year level not found' }, { status: 404 })
    }

    // Check if semester already exists for this year level
    const { data: existingSemester, error: existingSemesterError } = await supabase
      .from('semester')
      .select('semester_id, semester_name')
      .eq('year_level_id', year_level)
      .eq('semester_name', semester_name)
      .single()

    if (existingSemesterError && existingSemesterError.code !== 'PGRST116') {
      console.error('Database error checking existing semester:', existingSemesterError)
      return NextResponse.json({ error: 'Failed to check existing semester' }, { status: 500 })
    }

    if (existingSemester) {
      return NextResponse.json(
        { error: `${semester_name} already exists for ${yearLevel.name}` },
        { status: 409 }
      )
    }

    // Check total number of semesters for this year level (max 3)
    const { data: allSemesters, error: countError } = await supabase
      .from('semester')
      .select('semester_id')
      .eq('year_level_id', year_level)

    if (countError) {
      console.error('Database error counting semesters:', countError)
      return NextResponse.json({ error: 'Failed to count existing semesters' }, { status: 500 })
    }

    if (allSemesters && allSemesters.length >= 3) {
      return NextResponse.json(
        { error: 'Maximum of 3 semesters allowed per year level (1st Semester, 2nd Semester, Summer)' },
        { status: 409 }
      )
    }

    // Create semester
    console.log('Creating semester with:', { year_level_id: year_level, semester_name })
    const { data: semester, error } = await supabase
      .from('semester')
      .insert({
        year_level_id: year_level,
        semester_name
      })
      .select()
      .single()

    if (error) {
      console.error('Database error creating semester:', error)
      return NextResponse.json({ error: 'Failed to create semester' }, { status: 500 })
    }

    console.log('Semester created successfully:', semester)

    return NextResponse.json({ semester })
  } catch (error) {
    console.error('Error in semesters POST:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { semester_id, semester_name } = body

    console.log('Semester PUT request body:', { semester_id, semester_name })

    // Validate required fields
    if (!semester_id || !semester_name) {
      console.log('Validation failed:', { semester_id, semester_name })
      return NextResponse.json(
        { error: 'Semester ID and semester name are required' },
        { status: 400 }
      )
    }

    // Validate semester name is one of the allowed values
    const allowedSemesters = ['1st Semester', '2nd Semester', 'Summer']
    if (!allowedSemesters.includes(semester_name)) {
      return NextResponse.json(
        { error: 'Invalid semester name. Must be one of: 1st Semester, 2nd Semester, Summer' },
        { status: 400 }
      )
    }

    // Get current semester to check for conflicts
    const { data: currentSemester, error: currentSemesterError } = await supabase
      .from('semester')
      .select(`
        semester_id, 
        semester_name, 
        year_level_id,
        year_level (
          year_level_id,
          name
        )
      `)
      .eq('semester_id', semester_id)
      .single()

    if (currentSemesterError) {
      console.error('Database error fetching current semester:', currentSemesterError)
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
    }

    if (!currentSemester) {
      return NextResponse.json({ error: 'Semester not found' }, { status: 404 })
    }

    // Check if semester name is being changed
    if (currentSemester.semester_name === semester_name) {
      return NextResponse.json({ error: 'No changes detected' }, { status: 400 })
    }

    // Check if the new semester name already exists for this year level
    const { data: existingSemester, error: existingSemesterError } = await supabase
      .from('semester')
      .select('semester_id, semester_name')
      .eq('year_level_id', currentSemester.year_level_id)
      .eq('semester_name', semester_name)
      .neq('semester_id', semester_id)
      .single()

    if (existingSemesterError && existingSemesterError.code !== 'PGRST116') {
      console.error('Database error checking existing semester:', existingSemesterError)
      return NextResponse.json({ error: 'Failed to check existing semester' }, { status: 500 })
    }

    if (existingSemester) {
      const yearLevelName = currentSemester.year_level?.[0]?.name || 'this year level'
      return NextResponse.json(
        { error: `${semester_name} already exists for ${yearLevelName}` },
        { status: 409 }
      )
    }

    // Update semester
    console.log('Updating semester with:', { semester_id, semester_name })
    const { data: semester, error } = await supabase
      .from('semester')
      .update({
        semester_name,
        updated_at: new Date().toISOString()
      })
      .eq('semester_id', semester_id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating semester:', error)
      return NextResponse.json({ error: 'Failed to update semester' }, { status: 500 })
    }

    console.log('Semester updated successfully:', semester)
    return NextResponse.json({ semester })
  } catch (error) {
    console.error('Error in semesters PUT:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const semesterId = searchParams.get('semester_id')

    console.log('Semester DELETE request:', { semester_id: semesterId })

    if (!semesterId) {
      return NextResponse.json(
        { error: 'Semester ID is required' },
        { status: 400 }
      )
    }

    // Soft delete: Update status to 'inactive' instead of deleting
    console.log('Archiving semester with ID:', semesterId)
    const { error } = await supabase
      .from('semester')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('semester_id', semesterId)

    if (error) {
      console.error('Database error archiving semester:', error)
      return NextResponse.json({ error: 'Failed to archive semester' }, { status: 500 })
    }

    console.log('Semester archived successfully')
    return NextResponse.json({ message: 'Semester archived successfully' })
  } catch (error) {
    console.error('Error in semesters DELETE:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}