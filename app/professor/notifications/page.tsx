import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { NotificationsContent } from "@/components/professor/notifications-content"

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  // Fallback UI when unauthenticated or wrong role
  if (!session || session.user.role !== "professor") {
    return <div className="p-6 text-muted-foreground">Unauthorized</div>
  }

  return <NotificationsContent />
}
