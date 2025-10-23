import { StudentProfileContent } from '@/components/professor/student-profile-content'

interface PageProps {
  params: {
    id: string
  }
}

export default function StudentProfilePage({ params }: PageProps) {
  return <StudentProfileContent studentId={params.id} />
} 