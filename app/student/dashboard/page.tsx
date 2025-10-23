"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { DashboardOverview } from "@/components/student/dashboard-overview"

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading

    if (!session) {
      router.push("/")
      return
    }

    if (session.user.role !== "student") {
      router.push("/")
      return
    }
  }, [session, status, router])

  if (status === "loading") {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!session || session.user.role !== "student") {
    return null
  }

  return (
    <div className=" px-6 pb-8 max-w-[1450px] mx-auto">
      <DashboardOverview />
    </div>
  )
}