import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { supabaseServer } from "@/lib/student/supabaseServer"
import { deduplicateSubjects } from "@/lib/student/subject-deduplicator"

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get student information
    const { data: student, error: studentError } = await supabaseServer
      .from("students")
      .select("student_id, section_id")
      .eq("account_id", Number(session.user.account_id))
      .single()

    if (studentError || !student) {
      console.error("Student lookup error:", studentError)
      return NextResponse.json({ error: "Failed to resolve student" }, { status: 500 })
    }

    // Step 1: Get student's subjects through their classes
    const { data: classes, error: classesError } = await supabaseServer
      .from('classes')
      .select(`
        class_id,
        subjects:subject_id (
          subject_id,
          subject_code,
          subject_name
        )
      `)
      .eq('section_id', student.section_id)

    if (classesError) {
      console.error('Error fetching classes:', classesError)
      return NextResponse.json({ error: "Failed to fetch classes" }, { status: 500 })
    }

    // Step 2: Deduplicate subjects to avoid counting duplicates
    const deduplicatedSubjects = deduplicateSubjects(classes as any[] || [])
    const subjectIds = deduplicatedSubjects.map(subject => subject.subjects.subject_id).filter(Boolean)
    
    console.log(`Found ${classes?.length || 0} classes, deduplicated to ${deduplicatedSubjects.length} unique subjects`)
    
    // Step 3: Count all learning resources connected to student's subjects
    let resourcesQuery = supabaseServer
      .from('learning_resources')
      .select('id', { count: 'exact' })
      .eq('is_active', true)

    // If we have subjects, filter by them using the topics array
    if (subjectIds.length > 0) {
      // Get subject names to match with learning resource topics
      const { data: subjects, error: subjectsError } = await supabaseServer
        .from('subjects')
        .select('subject_name, subject_code')
        .in('subject_id', subjectIds)

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError)
        return NextResponse.json({ error: "Failed to fetch subjects" }, { status: 500 })
      }

      const subjectNames = subjects?.map(s => s.subject_name).filter(Boolean) || []
      const subjectCodes = subjects?.map(s => s.subject_code).filter(Boolean) || []
      const allSubjectTerms = [...subjectNames, ...subjectCodes]

      if (allSubjectTerms.length > 0) {
        resourcesQuery = resourcesQuery.overlaps('topics', allSubjectTerms)
      }
    }

    const { count: resourcesCount, error: resourcesError } = await resourcesQuery

    if (resourcesError) {
      console.error('Error counting learning resources:', resourcesError)
      return NextResponse.json({ error: "Failed to count learning resources" }, { status: 500 })
    }

    return NextResponse.json({ 
      totalResources: resourcesCount || 0,
      studentSubjects: deduplicatedSubjects.length,
      hasSubjects: deduplicatedSubjects.length > 0
    })

  } catch (err) {
    console.error("Learning resources count API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
