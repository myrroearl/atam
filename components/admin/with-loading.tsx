"use client"

import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { ReactNode } from "react"
import {
  DashboardSkeleton,
  StudentsPageSkeleton,
  ProfessorsPageSkeleton,
  CurriculumPageSkeleton,
  SectionsPageSkeleton,
  ClassesPageSkeleton,
  SettingsPageSkeleton,
  AnalyticsPageSkeleton,
  GenericPageSkeleton
} from "./page-skeletons"

interface WithLoadingProps {
  children: ReactNode
  loading?: boolean
  customSkeleton?: ReactNode
}

// Map routes to their corresponding skeleton components
const routeSkeletonMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "/admin/dashboard": DashboardSkeleton,
  "/admin/users/students": StudentsPageSkeleton,
  "/admin/users/professors": ProfessorsPageSkeleton,
  "/admin/curriculum": CurriculumPageSkeleton,
  "/admin/sections": SectionsPageSkeleton,
  "/admin/classes": ClassesPageSkeleton,
  "/admin/settings": SettingsPageSkeleton,
  "/admin/analytics": AnalyticsPageSkeleton,
}

export function WithLoading({ children, loading, customSkeleton }: WithLoadingProps) {
  const pathname = usePathname()
  const { status } = useSession()

  // Determine if we should show loading state
  const shouldShowLoading = loading || status === "loading"

  // Get the appropriate skeleton component for the current route
  const getSkeletonComponent = () => {
    if (customSkeleton) {
      return customSkeleton
    }

    // Check for exact route match first
    if (routeSkeletonMap[pathname]) {
      const SkeletonComponent = routeSkeletonMap[pathname]
      return <SkeletonComponent />
    }

    // Check for route patterns
    for (const [route, SkeletonComponent] of Object.entries(routeSkeletonMap)) {
      if (pathname.startsWith(route)) {
        return <SkeletonComponent />
      }
    }

    // Default skeleton for unknown routes
    return <GenericPageSkeleton />
  }

  if (shouldShowLoading) {
    return <>{getSkeletonComponent()}</>
  }

  return <>{children}</>
}

// Higher-order component for wrapping pages
export function withPageLoading<T extends object>(
  Component: React.ComponentType<T>,
  customSkeleton?: React.ComponentType<{ className?: string }>
) {
  return function WrappedComponent(props: T) {
    return (
      <WithLoading customSkeleton={customSkeleton ? <customSkeleton /> : undefined}>
        <Component {...props} />
      </WithLoading>
    )
  }
}

// Hook for page-specific loading states
export function usePageLoading() {
  const pathname = usePathname()
  const { status } = useSession()

  const isLoading = status === "loading"
  
  const getSkeletonComponent = () => {
    // Check for exact route match first
    if (routeSkeletonMap[pathname]) {
      return routeSkeletonMap[pathname]
    }

    // Check for route patterns
    for (const [route, SkeletonComponent] of Object.entries(routeSkeletonMap)) {
      if (pathname.startsWith(route)) {
        return SkeletonComponent
      }
    }

    // Default skeleton for unknown routes
    return GenericPageSkeleton
  }

  return {
    isLoading,
    SkeletonComponent: getSkeletonComponent()
  }
}
