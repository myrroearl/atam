"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import DepartmentList from "@/components/admin/department-list"
import { CurriculumPageSkeleton } from "@/components/admin/page-skeletons"

export default function Department(){
    const { data: session, status } = useSession()
    const router = useRouter()
    const [refreshTrigger, setRefreshTrigger] = useState(0)

    const handleDepartmentAdded = () => {
        setRefreshTrigger(prev => prev + 1)
    }

    if (status === "loading") {
        return <CurriculumPageSkeleton />
    }
    
    return (
        <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors">
            <div className="p-5 w-full space-y-6">
                {/* Header */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-black dark:text-white">Curriculum Management</h1>
                    <p className="text-lg text-gray-700 dark:text-gray-400">Manage departments, academic courses and subjects</p>
                </div>

                {/* Department List with Card View */}
                <DepartmentList refreshTrigger={refreshTrigger} />
            </div>
        </div>
    )
}