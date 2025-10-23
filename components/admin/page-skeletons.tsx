"use client"

import { cn } from "@/lib/utils"
import { ShimmerSkeleton, CardSkeleton, TableSkeleton, StatsCardSkeleton } from "./skeleton-components"

// Dashboard page skeleton
export const DashboardSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors", className)}>
    <div className="space-y-4 p-5 w-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-8 w-64 rounded" />
          <ShimmerSkeleton className="h-5 w-96 rounded" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* At-Risk Students Chart */}
          <CardSkeleton showHeader showContent className="h-[450px]" />
          
          {/* Dropout Prediction Chart */}
          <CardSkeleton showHeader showContent className="h-[400px]" />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-1">
          {/* Alerts */}
          <CardSkeleton showHeader showContent className="h-[500px]" />
        </div>
      </div>
    </div>
  </div>
)

// Students page skeleton
export const StudentsPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] min-h-screen", className)}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-8 w-48 rounded" />
        <ShimmerSkeleton className="h-5 w-80 rounded" />
      </div>
      <div className="flex gap-3">
        <ShimmerSkeleton className="h-10 w-24 rounded" />
        <ShimmerSkeleton className="h-10 w-32 rounded" />
      </div>
    </div>

    {/* Filters */}
    <div className="flex gap-2 items-center w-full">
      <ShimmerSkeleton className="h-10 min-w-[400px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[400px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[180px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[100px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[90px] rounded" />
    </div>

    {/* Table */}
    <TableSkeleton rows={8} columns={6} showHeader />
  </div>
)

// Professors page skeleton
export const ProfessorsPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] min-h-screen", className)}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-8 w-56 rounded" />
        <ShimmerSkeleton className="h-5 w-96 rounded" />
      </div>
      <div className="flex gap-3">
        <ShimmerSkeleton className="h-10 w-24 rounded" />
        <ShimmerSkeleton className="h-10 w-32 rounded" />
      </div>
    </div>

    {/* Filters */}
    <div className="flex gap-2 items-center w-full">
      <ShimmerSkeleton className="h-10 flex-1 min-w-[500px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[300px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[150px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[100px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[90px] rounded" />
    </div>

    {/* Table */}
    <TableSkeleton rows={10} columns={5} showHeader />
  </div>
)

// Curriculum page skeleton
export const CurriculumPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--try-five)] transition-colors", className)}>
    <div className="p-5 w-full space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <ShimmerSkeleton className="h-8 w-56 rounded" />
        <ShimmerSkeleton className="h-5 w-80 rounded" />
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <CardSkeleton 
            key={index} 
            showHeader 
            showContent 
            showFooter 
            className="h-72"
          />
        ))}
      </div>
    </div>
  </div>
)

// Sections page skeleton
export const SectionsPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("p-5 space-y-6 w-full bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] min-h-screen", className)}>
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-8 w-52 rounded" />
        <ShimmerSkeleton className="h-5 w-64 rounded" />
      </div>
      <ShimmerSkeleton className="h-12 w-32 rounded" />
    </div>

    {/* Filters */}
    <div className="flex items-center w-full gap-2">
      <ShimmerSkeleton className="h-10 min-w-[400px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[300px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[250px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[100px] rounded" />
      <ShimmerSkeleton className="h-10 min-w-[90px] rounded" />
    </div>

    {/* Table */}
    <TableSkeleton rows={12} columns={5} showHeader />
  </div>
)

// Classes page skeleton
export const ClassesPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-4 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] min-h-screen", className)}>
    {/* Header */}
    <div className="flex justify-between items-center">
      <div className="space-y-2">
        <ShimmerSkeleton className="h-8 w-36 rounded" />
        <ShimmerSkeleton className="h-4 w-48 rounded" />
      </div>
      <ShimmerSkeleton className="h-10 w-32 rounded" />
    </div>

    {/* Filters */}
    <div className="flex gap-2 items-center">
      <ShimmerSkeleton className="h-10 min-w-[400px] rounded" />
      <ShimmerSkeleton className="h-10 w-[250px] rounded" />
      <ShimmerSkeleton className="h-10 w-[250px] rounded" />
      <ShimmerSkeleton className="h-10 w-[200px] rounded" />
      <ShimmerSkeleton className="h-10 w-[90px] rounded" />
    </div>

    {/* Table */}
    <TableSkeleton rows={15} columns={6} showHeader />
  </div>
)

// Analytics page skeleton
export const AnalyticsPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors", className)}>
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] px-5 py-5">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-8 w-52 rounded" />
          <ShimmerSkeleton className="h-5 w-96 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 space-y-4">
        {/* Tabs */}
        <div className="bg-white dark:bg-black border-0 shadow-sm rounded-full p-0 h-12">
          <div className="grid grid-cols-5 h-full">
            {Array.from({ length: 5 }).map((_, index) => (
              <ShimmerSkeleton 
                key={index} 
                className={cn("h-full", 
                  index === 0 && "rounded-l-full",
                  index === 4 && "rounded-r-full"
                )} 
              />
            ))}
          </div>
        </div>

        {/* Charts and Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton showHeader showContent className="h-96" />
          <CardSkeleton showHeader showContent className="h-96" />
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <CardSkeleton showHeader showContent className="h-80" />
          <CardSkeleton showHeader showContent className="h-80" />
          <CardSkeleton showHeader showContent className="h-80" />
        </div>
      </div>
    </div>
  </div>
)

// Generic page skeleton for unknown pages
export const GenericPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("space-y-6 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] min-h-screen", className)}>
    {/* Header */}
    <div className="space-y-2">
      <ShimmerSkeleton className="h-8 w-48 rounded" />
      <ShimmerSkeleton className="h-5 w-72 rounded" />
    </div>

    {/* Content */}
    <div className="space-y-6">
      <CardSkeleton showHeader showContent className="h-64" />
      <CardSkeleton showHeader showContent className="h-64" />
      <CardSkeleton showHeader showContent className="h-64" />
    </div>
  </div>
)

// Audit Logs page skeleton
export const AuditLogsPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors", className)}>
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] border-b border-gray-200 dark:border-gray-700 px-5 py-5">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-7 w-40 rounded" />
          <ShimmerSkeleton className="h-4 w-80 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)]">
        <div className="bg-white dark:bg-black border-0 shadow-md rounded-lg">
          {/* Search Bar */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between gap-4">
              <ShimmerSkeleton className="h-10 flex-1 max-w-md rounded" />
              <ShimmerSkeleton className="h-10 w-48 rounded" />
            </div>
          </div>

          {/* Table */}
          <TableSkeleton rows={10} columns={7} showHeader={false} />

          {/* Pagination */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <ShimmerSkeleton className="h-4 w-48 rounded" />
              <div className="flex items-center gap-2">
                {Array.from({ length: 9 }).map((_, index) => (
                  <ShimmerSkeleton key={index} className="h-8 w-12 rounded" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Announcements page skeleton
export const AnnouncementsPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("min-h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors", className)}>
    <div className="p-5 max-w-7xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-9 w-64 rounded" />
          <ShimmerSkeleton className="h-5 w-96 rounded" />
        </div>
        <ShimmerSkeleton className="h-12 w-36 rounded-xl" />
      </div>

      {/* Search Card */}
      <div className="bg-white dark:bg-black border-0 shadow-sm rounded-lg p-4">
        <ShimmerSkeleton className="h-10 max-w-md rounded-xl" />
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-black border-0 shadow-sm rounded-2xl p-2">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <ShimmerSkeleton key={index} className="h-12 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Announcement Cards */}
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <CardSkeleton 
            key={index} 
            showHeader 
            showContent 
            className="h-44"
          />
        ))}
      </div>
    </div>
  </div>
)

// Settings page skeleton  
export const SettingsPageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors", className)}>
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] px-5 py-5">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-8 w-48 rounded" />
          <ShimmerSkeleton className="h-5 w-96 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)]">
        <div className="space-y-4">
          {/* Tabs */}
          <div className="bg-white dark:bg-black border-0 shadow-sm rounded-full p-0 h-12">
            <div className="grid grid-cols-3 h-full gap-0">
              {Array.from({ length: 3 }).map((_, index) => (
                <ShimmerSkeleton 
                  key={index} 
                  className={cn("h-full", 
                    index === 0 && "rounded-l-full",
                    index === 2 && "rounded-r-full"
                  )} 
                />
              ))}
            </div>
          </div>

          {/* Settings Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, index) => (
              <CardSkeleton 
                key={index} 
                showHeader 
                showContent 
                className="h-80"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
)

// Archive page skeleton
export const ArchivePageSkeleton = ({ className }: { className?: string }) => (
  <div className={cn("flex h-screen bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] transition-colors", className)}>
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)] px-5 py-5">
        <div className="space-y-2">
          <ShimmerSkeleton className="h-8 w-48 rounded" />
          <ShimmerSkeleton className="h-5 w-96 rounded" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 bg-[var(--customized-color-five)] dark:bg-[var(--darkmode-color-five)]">
        <div className="space-y-4">
          {/* Tabs */}
          <div className="bg-white dark:bg-black border-0 shadow-sm rounded-lg p-1 h-12">
            <div className="grid grid-cols-9 h-full gap-1">
              {Array.from({ length: 9 }).map((_, index) => (
                <ShimmerSkeleton 
                  key={index} 
                  className="h-full rounded" 
                />
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-black rounded-lg shadow-sm overflow-hidden">
            <TableSkeleton rows={10} columns={5} showHeader />
          </div>
        </div>
      </div>
    </div>
  </div>
)