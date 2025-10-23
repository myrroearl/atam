"use client"

import { useDashboardData } from "@/hooks/use-dashboard-data"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { WithLoading } from "./with-loading"
import { LoadingWrapper } from "./skeleton-components"
import { StatsCardSkeleton, TableSkeleton } from "./skeleton-components"

// Example of how to integrate loading states with existing components
export function DashboardWithLoading() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { data: dashboardData, loading, error, refreshData } = useDashboardData()
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      router.push("/")
      return
    }

    if (session.user.role !== "admin") {
      router.push("/")
      return
    }
  }, [session, status, router])

  // Handle initial loading state
  useEffect(() => {
    if (status === "authenticated" && dashboardData) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false)
      }, 1000) // Show skeleton for at least 1 second for better UX

      return () => clearTimeout(timer)
    }
  }, [status, dashboardData])

  if (status === "loading") {
    return null // Let the WithLoading wrapper handle this
  }

  if (!session || session.user.role !== "admin") {
    return null
  }

  return (
    <WithLoading loading={isInitialLoad || loading}>
      <div className="min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors">
        <div className="space-y-4 p-5 w-full">
          {/* Your existing dashboard content here */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
            {/* Stats Cards with individual loading states */}
            <LoadingWrapper 
              isLoading={loading} 
              skeleton={StatsCardSkeleton}
            >
              <div>Your actual stats card content</div>
            </LoadingWrapper>
            
            <LoadingWrapper 
              isLoading={loading} 
              skeleton={StatsCardSkeleton}
            >
              <div>Your actual stats card content</div>
            </LoadingWrapper>
            
            <LoadingWrapper 
              isLoading={loading} 
              skeleton={StatsCardSkeleton}
            >
              <div>Your actual stats card content</div>
            </LoadingWrapper>
            
            <LoadingWrapper 
              isLoading={loading} 
              skeleton={StatsCardSkeleton}
            >
              <div>Your actual stats card content</div>
            </LoadingWrapper>
          </div>

          {/* Tables with loading states */}
          <LoadingWrapper 
            isLoading={loading} 
            skeleton={() => <TableSkeleton rows={8} columns={4} />}
          >
            <div>Your actual table content</div>
          </LoadingWrapper>
        </div>
      </div>
    </WithLoading>
  )
}

// Example of how to use the loading hooks
export function ExampleWithLoadingHooks() {
  const [loadingStates, setLoadingStates] = useState({
    data: false,
    users: false,
    stats: false
  })

  const isLoading = (key: keyof typeof loadingStates) => loadingStates[key]
  const isAnyLoading = Object.values(loadingStates).some(Boolean)

  const setLoading = (key: keyof typeof loadingStates, loading: boolean) => {
    setLoadingStates(prev => ({ ...prev, [key]: loading }))
  }

  const fetchData = async () => {
    setLoading('data', true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      // Handle success
    } finally {
      setLoading('data', false)
    }
  }

  const fetchUsers = async () => {
    setLoading('users', true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      // Handle success
    } finally {
      setLoading('users', false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex gap-4">
        <button 
          onClick={fetchData}
          disabled={isLoading('data')}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
        >
          {isLoading('data') ? 'Loading...' : 'Fetch Data'}
        </button>
        
        <button 
          onClick={fetchUsers}
          disabled={isLoading('users')}
          className="px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
        >
          {isLoading('users') ? 'Loading...' : 'Fetch Users'}
        </button>
      </div>

      {/* Show skeleton while any loading */}
      <LoadingWrapper 
        isLoading={isAnyLoading} 
        skeleton={TableSkeleton}
      >
        <div>Your content here</div>
      </LoadingWrapper>
    </div>
  )
}
