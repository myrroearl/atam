"use client"

import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

interface SidebarSkeletonProps {
  state?: "expanded" | "collapsed"
}

// Custom shimmer animation component
const ShimmerSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("relative overflow-hidden", className)}>
    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-200/50 to-transparent dark:via-gray-700/50 animate-shimmer" />
    <div className="h-full w-full bg-gray-200 dark:bg-gray-700" />
  </div>
)

export function SidebarSkeleton({ state = "expanded" }: SidebarSkeletonProps) {
  return (
    <Sidebar
      className="!bg-blue-900 dark:!bg-[var(--try-one)] border-none"
      collapsible="icon"
      style={{ width: 'full' }}
    >
      <div className="flex h-full w-full flex-col bg-white transition-colors dark:bg-[var(--try-one)]">
        {/* Header Skeleton */}
        <SidebarHeader className={state === "collapsed" ? "p-2 mt-2" : "p-4"}>
          <div className="flex items-center justify-center gap-2">
            {/* Logo skeleton */}
            <ShimmerSkeleton className="w-[50px] h-[50px] rounded-full" />
            {state === "expanded" && (
              <ShimmerSkeleton className="w-[60px] h-[32px] rounded" />
            )}
          </div>
        </SidebarHeader>

        {/* Content Skeleton */}
        <SidebarContent className={state === "collapsed" ? "p-2 mt-2" : "flex-1 p-4"}>
          <div className="space-y-1">
            {/* Menu items skeleton */}
            {Array.from({ length: 11 }).map((_, index) => (
              <ShimmerSkeleton
                key={index}
                className={cn(
                  "h-[40px] rounded-lg mb-1",
                  state === "collapsed" ? "w-[40px] mx-auto" : "w-full"
                )}
              />
            ))}
          </div>
        </SidebarContent>

        {/* Footer Skeleton */}
        <SidebarFooter className={state === "collapsed" ? "p-2 mt-2" : "p-4"}>
          {state === "collapsed" ? (
            // Collapsed footer skeleton
            <ShimmerSkeleton className="w-[40px] h-[40px] rounded-full mx-auto" />
          ) : (
            // Expanded footer skeleton
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-1">
                <ShimmerSkeleton className="w-[40px] h-[40px] rounded-full" />
                <div className="space-y-1">
                  <ShimmerSkeleton className="w-[80px] h-[16px] rounded" />
                  <ShimmerSkeleton className="w-[120px] h-[12px] rounded" />
                </div>
              </div>
              <ShimmerSkeleton className="w-6 h-6 rounded" />
            </div>
          )}
        </SidebarFooter>
      </div>
    </Sidebar>
  )
}
