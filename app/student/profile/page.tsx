import { ProfileSettings } from "@/components/student/profile-settings"
import ErrorBoundary from "@/components/student/error-boundary"

export default function ProfilePage() {

  return (
    <div className="px-6 pb-8">
      <div className="max-w-[1400px] mx-auto">
      <ErrorBoundary>
          <ProfileSettings />
        </ErrorBoundary>
      </div>
    </div>
  )
}
