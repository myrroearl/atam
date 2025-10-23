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

    // Get all active professors with comprehensive details
    const { data: professors, error } = await supabase
      .from('professors')
      .select(`
        prof_id,
        first_name,
        middle_name,
        last_name,
        birthday,
        address,
        contact_number,
        faculty_type,
        preferred_time,
        preferred_days,
        created_at,
        updated_at,
        accounts!inner (
          account_id,
          email,
          status
        ),
        departments (
          department_id,
          department_name
        )
      `)
      .eq('accounts.status', 'active')
      .order('last_name', { ascending: true })

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: "Failed to fetch professors" }, { status: 500 })
    }

    // Fetch classes for each professor to get subjects and sections
    const professorsWithClasses = await Promise.all(
      (professors || []).map(async (prof: any) => {
        const { data: classes, error: classesError } = await supabase
          .from('classes')
          .select(`
            class_id,
            subject_id,
            section_id,
            subjects (
              subject_id,
              subject_name,
              subject_code
            ),
            sections (
              section_id,
              section_name
            )
          `)
          .eq('professor_id', prof.prof_id)

        if (classesError) {
          console.error(`Error fetching classes for professor ${prof.prof_id}:`, classesError)
        }

        // Extract unique subjects and sections
        const subjects = classes ? [...new Set(classes.map((c: any) => c.subjects?.subject_name).filter(Boolean))] : []
        const sections = classes ? [...new Set(classes.map((c: any) => c.sections?.section_name).filter(Boolean))] : []

        console.log(`Professor ${prof.prof_id} - Subjects: ${subjects.length}, Sections: ${sections.length}`)

        return { ...prof, subjects, sections }
      })
    )

    // Transform the data to match the frontend format
    const transformedProfessors = professorsWithClasses.map((prof: any) => {
      // Create full name
      const fullName = prof.middle_name 
        ? `${prof.last_name}, ${prof.first_name} ${prof.middle_name}`
        : `${prof.last_name}, ${prof.first_name}`

      // Generate professor ID from prof_id (assuming it's numeric)
      const profId = prof.prof_id.toString().padStart(8, '0')

      // Determine status based on account status
      let status = "Active"
      if (prof.accounts?.status === "inactive") {
        status = "Inactive"
      } else if (prof.accounts?.status === "suspended") {
        status = "On Leave"
      }

      return {
        id: profId,
        name: fullName,
        email: prof.accounts?.email || 'N/A',
        department: prof.departments?.department_name || 'N/A',
        subjects: prof.subjects || [],
        sections: prof.sections || [],
        facultyType: prof.faculty_type || 'Part-Time',
        status: status,
        avatar: "/placeholder.svg?height=40&width=40",
        // Additional fields for internal use
        prof_id: prof.prof_id,
        account_id: prof.accounts?.account_id || 0,
        department_id: prof.departments?.department_id || 0,
        birthday: prof.birthday,
        address: prof.address,
        contact_number: prof.contact_number,
        preferred_time: prof.preferred_time,
        preferred_days: prof.preferred_days,
        created_at: prof.created_at,
        updated_at: prof.updated_at
      }
    })

    return NextResponse.json({ professors: transformedProfessors })
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
    console.log("POST /api/admin/professors - Request body:", body)
    
    const {
      firstName,
      middleName,
      lastName,
      email,
      department,
      facultyType,
      birthday,
      address,
      contactNumber,
      preferredTime,
      preferredDays,
      // Optional: departmentId for precise lookup
      departmentId
    } = body

    // Validate required fields
    if (!firstName || !lastName || !email || (!department && !departmentId) || !facultyType) {
      console.error("Missing required fields:", { firstName, lastName, email, department, departmentId, facultyType })
      return NextResponse.json({ 
        error: "Missing required fields",
        received: { firstName: !!firstName, lastName: !!lastName, email: !!email, department: !!department, departmentId: !!departmentId, facultyType: !!facultyType }
      }, { status: 400 })
    }

    // Auto-generate password from birthday (format: MMDDYYYY)
    let passwordHash = 'default_password'
    if (birthday) {
      const date = new Date(birthday)
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const year = date.getFullYear()
      passwordHash = `${month}${day}${year}`
    }

    // Hash password
    try {
      const bcrypt = await import('bcryptjs')
      passwordHash = await bcrypt.default.hash(passwordHash, 12)
    } catch (e) {
      console.error("Password hashing error:", e)
    }

    // Start transaction - create account first, then professor
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        email,
        password_hash: passwordHash,
        role: 'professor',
        status: 'active' // Always set to active on creation
      })
      .select('account_id')
      .single()

    if (accountError) {
      console.error("Account creation error:", accountError)
      return NextResponse.json({ 
        error: `Failed to create account: ${accountError.message || 'Unknown error'}`,
        details: accountError 
      }, { status: 500 })
    }

    // Resolve department_id
    let resolvedDepartmentId: number | null = null
    if (departmentId) {
      resolvedDepartmentId = parseInt(departmentId)
    } else {
      const { data: departmentData, error: departmentError } = await supabase
        .from('departments')
        .select('department_id')
        .eq('department_name', department)
        .single()

      if (departmentError || !departmentData) {
        console.error("Department lookup error:", departmentError)
        // Clean up account
        await supabase.from('accounts').delete().eq('account_id', account.account_id)
        return NextResponse.json({ 
          error: `Invalid department: ${departmentError?.message || 'Department not found'}`,
          departmentName: department
        }, { status: 400 })
      }
      resolvedDepartmentId = departmentData.department_id
    }

    // Create professor record
    const { data: professor, error: professorError } = await supabase
      .from('professors')
      .insert({
        account_id: account.account_id,
        department_id: resolvedDepartmentId,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        birthday: birthday || null,
        address: address || null,
        contact_number: contactNumber || null,
        faculty_type: facultyType,
        preferred_time: preferredTime || null,
        preferred_days: preferredDays || null
      })
      .select('*')
      .single()

    if (professorError) {
      console.error("Professor creation error:", professorError)
      // Clean up account if professor creation fails
      await supabase.from('accounts').delete().eq('account_id', account.account_id)
      return NextResponse.json({ 
        error: `Failed to create professor: ${professorError.message || 'Unknown error'}`,
        details: professorError
      }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Professor created successfully",
      professor: {
        id: professor.prof_id.toString().padStart(8, '0'),
        name: `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}`,
        email,
        department,
        subjects: [],
        sections: [],
        facultyType,
        status: 'Active',
        avatar: "/placeholder.svg?height=40&width=40",
        prof_id: professor.prof_id,
        account_id: account.account_id,
        department_id: resolvedDepartmentId,
        birthday: birthday || null,
        address: address || null,
        contact_number: contactNumber || null,
        preferred_time: preferredTime || null,
        preferred_days: preferredDays || null,
        created_at: professor.created_at,
        updated_at: professor.updated_at
      }
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
      prof_id,
      firstName,
      middleName,
      lastName,
      email,
      password,
      department,
      facultyType,
      status,
      birthday,
      address,
      contactNumber,
      preferredTime,
      preferredDays,
      // Optional: departmentId for precise lookup
      departmentId
    } = body

    // Validate required fields
    if (!prof_id || !firstName || !lastName || !email || (!department && !departmentId) || !facultyType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get the current professor data to find account_id
    const { data: currentProfessor, error: professorError } = await supabase
      .from('professors')
      .select('account_id')
      .eq('prof_id', prof_id)
      .single()

    if (professorError || !currentProfessor) {
      console.error("Professor lookup error:", professorError)
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Update account information
    const accountUpdateData: any = {
      email,
      status: status === 'Inactive' ? 'inactive' : status === 'On Leave' ? 'suspended' : status === 'Resigned' ? 'inactive' : 'active'
    }

    // Only update password if provided and hash it
    if (password && password.trim() !== '') {
      try {
        const bcrypt = await import('bcryptjs')
        accountUpdateData.password_hash = await bcrypt.default.hash(password, 12)
      } catch (e) {
        accountUpdateData.password_hash = password
      }
    }

    const { error: accountError } = await supabase
      .from('accounts')
      .update(accountUpdateData)
      .eq('account_id', currentProfessor.account_id)

    if (accountError) {
      console.error("Account update error:", accountError)
      return NextResponse.json({ error: "Failed to update account" }, { status: 500 })
    }

    // Resolve department_id
    let resolvedDepartmentId: number | null = null
    if (departmentId) {
      resolvedDepartmentId = parseInt(departmentId)
    } else {
      const { data: departmentData, error: departmentError } = await supabase
        .from('departments')
        .select('department_id')
        .eq('department_name', department)
        .single()

      if (departmentError || !departmentData) {
        console.error("Department lookup error:", departmentError)
        return NextResponse.json({ error: "Invalid department" }, { status: 400 })
      }
      resolvedDepartmentId = departmentData.department_id
    }

    // Update professor record
    const { data: professor, error: professorUpdateError } = await supabase
      .from('professors')
      .update({
        department_id: resolvedDepartmentId,
        first_name: firstName,
        middle_name: middleName || null,
        last_name: lastName,
        birthday: birthday || null,
        address: address || null,
        contact_number: contactNumber || null,
        faculty_type: facultyType,
        preferred_time: preferredTime || null,
        preferred_days: preferredDays || null
      })
      .eq('prof_id', prof_id)
      .select('*')
      .single()

    if (professorUpdateError) {
      console.error("Professor update error:", professorUpdateError)
      return NextResponse.json({ error: "Failed to update professor" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Professor updated successfully",
      professor: {
        id: prof_id.toString().padStart(8, '0'),
        name: `${lastName}, ${firstName}${middleName ? ` ${middleName}` : ''}`,
        email,
        department,
        subjects: [],
        sections: [],
        facultyType,
        status,
        avatar: "/placeholder.svg?height=40&width=40",
        prof_id: professor.prof_id,
        account_id: currentProfessor.account_id,
        department_id: resolvedDepartmentId,
        birthday: birthday || null,
        address: address || null,
        contact_number: contactNumber || null,
        preferred_time: preferredTime || null,
        preferred_days: preferredDays || null,
        created_at: professor.created_at,
        updated_at: professor.updated_at
      }
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
    const prof_id = searchParams.get('prof_id')

    if (!prof_id) {
      return NextResponse.json({ error: "Professor ID is required" }, { status: 400 })
    }

    // Get professor's account_id first
    const { data: professor, error: professorError } = await supabase
      .from('professors')
      .select('account_id')
      .eq('prof_id', prof_id)
      .single()

    if (professorError || !professor) {
      console.error("Professor lookup error:", professorError)
      return NextResponse.json({ error: "Professor not found" }, { status: 404 })
    }

    // Soft delete: Update account status to 'inactive' instead of deleting
    const { error: deleteError } = await supabase
      .from('accounts')
      .update({ 
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('account_id', professor.account_id)

    if (deleteError) {
      console.error("Professor archive error:", deleteError)
      return NextResponse.json({ error: "Failed to archive professor" }, { status: 500 })
    }

    return NextResponse.json({ 
      message: "Professor archived successfully"
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}