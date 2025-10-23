import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { HelpSupportContent } from "@/components/professor/help-support-content"

export default async function HelpSupportPage() {
  const session = await getServerSession(authOptions)

  // Fallback UI when unauthenticated or wrong role
  if (!session || session.user.role !== "professor") {
    return <div className="p-6 text-muted-foreground">Unauthorized</div>
  }

  return <HelpSupportContent />
}
