"use client"

import { cn } from "@/lib/utils"

// Base shimmer skeleton component with improved colors
export const ShimmerSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden bg-gray-200/60 dark:bg-gray-800/60", className)}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-[var(--customized-color-three)]/10 animate-shimmer" />
  </div>
)

// Text skeleton variants
export const TextSkeleton = ({ 
  className, 
  lines = 1 
}: { 
  className?: string
  lines?: number 
}) => (
  <div className="space-y-2">
    {Array.from({ length: lines }).map((_, index) => (
      <ShimmerSkeleton
        key={index}
        className={cn(
          "h-4 rounded",
          lines > 1 && index === lines - 1 && "w-3/4", // Last line shorter
          className
        )}
      />
    ))}
  </div>
)

// Card skeleton with improved styling
export const CardSkeleton = ({ 
  className,
  showHeader = true,
  showContent = true,
  showFooter = false
}: {
  className?: string
  showHeader?: boolean
  showContent?: boolean
  showFooter?: boolean
}) => (
  <div className={cn("bg-white dark:bg-black border-0 shadow-md rounded-lg transition-all", className)}>
    {showHeader && (
      <div className="p-6 pb-4">
        <ShimmerSkeleton className="h-6 w-1/3 rounded-md mb-2" />
        <ShimmerSkeleton className="h-4 w-1/2 rounded-md" />
      </div>
    )}
    {showContent && (
      <div className="p-6 pt-4">
        <div className="space-y-3">
          <ShimmerSkeleton className="h-4 w-full rounded-md" />
          <ShimmerSkeleton className="h-4 w-5/6 rounded-md" />
          <ShimmerSkeleton className="h-4 w-4/6 rounded-md" />
        </div>
      </div>
    )}
    {showFooter && (
      <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <ShimmerSkeleton className="h-4 w-1/4 rounded-md" />
          <ShimmerSkeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
    )}
  </div>
)

// Table skeleton with improved styling
export const TableSkeleton = ({ 
  rows = 5, 
  columns = 4,
  showHeader = true,
  className 
}: {
  rows?: number
  columns?: number
  showHeader?: boolean
  className?: string
}) => (
  <div className={cn("bg-white dark:bg-black border-0 shadow-md rounded-lg overflow-hidden transition-all", className)}>
    {showHeader && (
      <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-800">
        <div className="flex justify-between items-center">
          <ShimmerSkeleton className="h-6 w-1/4 rounded-md" />
          <ShimmerSkeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>
    )}
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 dark:bg-gray-900/50">
          <tr>
            {Array.from({ length: columns }).map((_, index) => (
              <th key={index} className="px-6 py-3 text-left">
                <ShimmerSkeleton className="h-4 w-20 rounded-md" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/30 transition-colors">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="px-6 py-4">
                  <ShimmerSkeleton className="h-4 w-24 rounded-md" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

// Button skeleton
export const ButtonSkeleton = ({ 
  className,
  size = "default"
}: {
  className?: string
  size?: "sm" | "default" | "lg"
}) => {
  const sizeClasses = {
    sm: "h-8 w-16",
    default: "h-10 w-24",
    lg: "h-12 w-32"
  }
  
  return (
    <ShimmerSkeleton 
      className={cn("rounded-lg", sizeClasses[size], className)} 
    />
  )
}

// Avatar skeleton
export const AvatarSkeleton = ({ 
  size = "default",
  className 
}: {
  size?: "sm" | "default" | "lg"
  className?: string
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    default: "w-10 h-10",
    lg: "w-12 h-12"
  }
  
  return (
    <ShimmerSkeleton 
      className={cn("rounded-full", sizeClasses[size], className)} 
    />
  )
}

// Stats card skeleton with improved styling
export const StatsCardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("bg-white dark:bg-black border-0 shadow-md rounded-lg p-4 transition-all", className)}>
    <div className="flex items-center justify-between">
      <div className="space-y-1">
        <ShimmerSkeleton className="h-3 w-32 rounded-md" />
        <ShimmerSkeleton className="h-8 w-20 rounded-md" />
        <div className="flex items-center gap-2">
          <ShimmerSkeleton className="h-4 w-4 rounded-md" />
          <ShimmerSkeleton className="h-3 w-20 rounded-md" />
        </div>
      </div>
      <ShimmerSkeleton className="w-12 h-12 rounded-full" />
    </div>
  </div>
)

// Modal skeleton
export const ModalSkeleton = ({ 
  className,
  showHeader = true,
  showContent = true,
  showFooter = true
}: {
  className?: string
  showHeader?: boolean
  showContent?: boolean
  showFooter?: boolean
}) => (
  <div className={cn("bg-white dark:bg-black border-0 shadow-lg rounded-lg max-w-md mx-auto", className)}>
    {showHeader && (
      <div className="p-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <ShimmerSkeleton className="h-6 w-1/3 rounded" />
      </div>
    )}
    {showContent && (
      <div className="p-6 space-y-4">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-4 w-16 rounded" />
          <ShimmerSkeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-2">
          <ShimmerSkeleton className="h-4 w-20 rounded" />
          <ShimmerSkeleton className="h-10 w-full rounded" />
        </div>
        <div className="space-y-2">
          <ShimmerSkeleton className="h-4 w-24 rounded" />
          <ShimmerSkeleton className="h-20 w-full rounded" />
        </div>
      </div>
    )}
    {showFooter && (
      <div className="p-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-end gap-3">
          <ShimmerSkeleton className="h-10 w-20 rounded" />
          <ShimmerSkeleton className="h-10 w-24 rounded" />
        </div>
      </div>
    )}
  </div>
)

// Form skeleton
export const FormSkeleton = ({ 
  fields = 3,
  className 
}: {
  fields?: number
  className?: string
}) => (
  <div className={cn("space-y-6", className)}>
    {Array.from({ length: fields }).map((_, index) => (
      <div key={index} className="space-y-2">
        <ShimmerSkeleton className="h-4 w-24 rounded" />
        <ShimmerSkeleton className="h-10 w-full rounded" />
      </div>
    ))}
    <div className="flex justify-end gap-3 pt-4">
      <ShimmerSkeleton className="h-10 w-20 rounded" />
      <ShimmerSkeleton className="h-10 w-24 rounded" />
    </div>
  </div>
)

// Page skeleton (for full page loading)
export const PageSkeleton = ({ 
  className,
  showHeader = true,
  showStats = true,
  showContent = true
}: {
  className?: string
  showHeader?: boolean
  showStats?: boolean
  showContent?: boolean
}) => (
  <div className={cn("space-y-6 p-6", className)}>
    {showHeader && (
      <div className="space-y-4">
        <ShimmerSkeleton className="h-8 w-64 rounded" />
        <ShimmerSkeleton className="h-4 w-96 rounded" />
      </div>
    )}
    
    {showStats && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>
    )}
    
    {showContent && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton showHeader showContent />
        </div>
        <div className="lg:col-span-1">
          <CardSkeleton showHeader showContent />
        </div>
      </div>
    )}
  </div>
)

// Loading wrapper component
export const LoadingWrapper = ({ 
  isLoading, 
  children, 
  skeleton: SkeletonComponent,
  className 
}: {
  isLoading: boolean
  children: React.ReactNode
  skeleton: React.ComponentType<any>
  className?: string
}) => {
  if (isLoading) {
    return <SkeletonComponent className={className} />
  }
  
  return <>{children}</>
}
