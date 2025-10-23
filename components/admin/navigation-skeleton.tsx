"use client"

import { cn } from "@/lib/utils"

// Custom shimmer animation component
const ShimmerSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden", className)}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-700/50 animate-shimmer" />
    <div className="h-full w-full bg-gray-200 dark:bg-gray-700" />
  </div>
)

export function NavigationSkeleton() {
  return (
    <header className="px-5 py-1 transition-colors bg-white dark:bg-black sticky top-0 z-50 border-l border-[var(--customized-color-five)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Menu button skeleton */}
          <ShimmerSkeleton className="w-[44px] h-[44px] rounded-lg mr-4" />

          <div className="flex items-center gap-4">
            {/* Title skeleton */}
            <ShimmerSkeleton className="w-[280px] h-[24px] rounded" />
            
            {/* Breadcrumbs skeleton */}
            <div className="flex items-center gap-2">
              <ShimmerSkeleton className="w-4 h-4 rounded" />
              <ShimmerSkeleton className="w-[80px] h-[20px] rounded" />
              <ShimmerSkeleton className="w-4 h-4 rounded" />
              <ShimmerSkeleton className="w-[60px] h-[20px] rounded" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Theme toggle button skeleton */}
          <ShimmerSkeleton className="w-[80px] h-[36px] rounded-lg" />
        </div>
      </div>
    </header>
  )
}
