import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { DashboardContent } from "@/components/professor/dashboard-content"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  console.log("Dashboard - Session:", session ? "exists" : "null")
  console.log("Dashboard - Role:", session?.user?.role)

  if (!session || session.user.role !== "professor") {
    console.log("Dashboard - Redirecting to / because no session or wrong role")
    redirect("/")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch professor data
  const { data: professor, error: profError } = await supabase
    .from("professors")
    .select(`
      prof_id,
      first_name,
      last_name,
      department_id,
      departments (department_name)
    `)
    .eq("account_id", Number(session.user.account_id))
    .single()

  console.log("Dashboard - Professor data:", professor ? "found" : "null")
  console.log("Dashboard - Professor error:", profError)
  console.log("Dashboard - Account ID:", session.user.account_id)

  if (!professor) {
    console.log("Dashboard - No professor found in database")
    // Return error page instead of redirecting to avoid loop
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Profile Setup Required</h1>
          <p className="text-muted-foreground mb-4">
            Your professor profile has not been set up yet. Please contact the administrator.
          </p>
          <p className="text-sm text-muted-foreground">
            Account ID: {session.user.account_id}
          </p>
        </div>
      </div>
    )
  }

  // Fetch classes for the professor
  const { data: classes } = await supabase
    .from("classes")
    .select(`
      class_id,
      class_name,
      subject_id,
      section_id,
      subjects (subject_name, subject_code),
      sections (section_name)
    `)
    .eq("professor_id", professor.prof_id)

  // Calculate statistics for each class
  const classStats = await Promise.all(
    (classes || []).map(async (classItem: any) => {
      // Get students in this class's section
      const { data: students } = await supabase
        .from("students")
        .select("student_id")
        .eq("section_id", classItem.section_id)

      const studentCount = students?.length || 0

      // Get grade entries for this class
      const { data: gradeEntries } = await supabase
        .from("grade_entries")
        .select("student_id, component_id, score, max_score")
        .eq("class_id", classItem.class_id)

      // Calculate at-risk students (average < 75%)
      let atRiskCount = 0
      if (gradeEntries && gradeEntries.length > 0 && students) {
        const studentGrades = new Map<number, { total: number; count: number }>()

        gradeEntries.forEach((entry: any) => {
          const percentage = (entry.score / entry.max_score) * 100
          const current = studentGrades.get(entry.student_id) || { total: 0, count: 0 }
          studentGrades.set(entry.student_id, {
            total: current.total + percentage,
            count: current.count + 1,
          })
        })

        studentGrades.forEach((grades) => {
          const average = grades.total / grades.count
          if (average < 75) atRiskCount++
        })
      }

      return {
        class_id: classItem.class_id,
        class_name: classItem.class_name,
        subject_name: classItem.subjects?.subject_name || classItem.class_name,
        subject_code: classItem.subjects?.subject_code || "",
        section_name: classItem.sections?.section_name || "",
        student_count: studentCount,
        at_risk_count: atRiskCount,
      }
    })
  )

  // Calculate overall statistics
  const totalStudents = classStats.reduce((sum, cls) => sum + cls.student_count, 0)
  const totalAtRisk = classStats.reduce((sum, cls) => sum + cls.at_risk_count, 0)
  const activeClasses = classes?.length || 0

  // Fetch recent activity logs
  const { data: activityLogs } = await supabase
    .from("activity_logs")
    .select("log_id, action, description, created_at")
    .eq("account_id", Number(session.user.account_id))
    .order("created_at", { ascending: false })
    .limit(5)

  // Fetch recent AI tool usage
  const { data: aiToolsUsage } = await supabase
    .from("ai_tools_usage")
    .select("usage_id, tool_type, date_used, success")
    .eq("professor_id", professor.prof_id)
    .order("date_used", { ascending: false })
    .limit(3)

  // Calculate grade distribution across all classes
  const gradeDistribution = { A: 0, B: 0, C: 0, D: 0, F: 0 }
  
  for (const classItem of classes || []) {
    const { data: students } = await supabase
      .from("students")
      .select("student_id")
      .eq("section_id", classItem.section_id)

    if (!students) continue

    for (const student of students) {
      const { data: entries } = await supabase
        .from("grade_entries")
        .select("score, max_score")
        .eq("class_id", classItem.class_id)
        .eq("student_id", student.student_id)

      if (entries && entries.length > 0) {
        const total = entries.reduce((sum, e) => sum + (e.score / e.max_score) * 100, 0)
        const average = total / entries.length

        if (average >= 90) gradeDistribution.A++
        else if (average >= 80) gradeDistribution.B++
        else if (average >= 70) gradeDistribution.C++
        else if (average >= 60) gradeDistribution.D++
        else gradeDistribution.F++
      }
    }
  }

  const dashboardData = {
    professor: {
      name: `${professor.first_name} ${professor.last_name}`,
      department: (professor.departments as any)?.department_name || "",
    },
    stats: {
      totalStudents,
      activeClasses,
      atRiskStudents: totalAtRisk,
    },
    classes: classStats,
    recentActivity: [
      ...(activityLogs || []).map((log: any) => ({
        type: 'activity',
        title: log.action,
        description: log.description || '',
        time: new Date(log.created_at).toLocaleDateString(),
      })),
      ...(aiToolsUsage || []).map((tool: any) => ({
        type: 'ai_tool',
        title: `${tool.tool_type} used`,
        description: tool.success ? 'Successfully generated' : 'Failed',
        time: new Date(tool.date_used).toLocaleDateString(),
      })),
    ].slice(0, 5),
    gradeDistribution,
  }

  return <DashboardContent data={dashboardData} />
}
