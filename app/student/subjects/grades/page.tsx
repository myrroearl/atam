import { Suspense } from "react"
import { GradesView } from "@/components/student/grades-view"

export default function GradesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GradesView />
    </Suspense>
  )
}
