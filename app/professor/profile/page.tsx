import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { ProfileSettingsContent } from "@/components/professor/profile-settings-content"

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== "professor") {
    redirect("/")
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Fetch professor data
  const { data: professor } = await supabase
    .from("professors")
    .select(`
      prof_id,
      first_name,
      middle_name,
      last_name,
      contact_number,
      address,
      department_id,
      departments (
        department_name
      ),
      accounts (
        email
      )
    `)
    .eq("account_id", Number(session.user.account_id))
    .single()

  if (!professor) {
    redirect("/professor")
  }

  const professorData = {
    firstName: professor.first_name,
    middleName: professor.middle_name || "",
    lastName: professor.last_name,
    email: (professor.accounts as any)?.email || "",
    phone: professor.contact_number || "",
    address: professor.address || "",
    department: (professor.departments as any)?.department_name || "",
    departmentId: professor.department_id,
  }

  return <ProfileSettingsContent professor={professorData} />
}
