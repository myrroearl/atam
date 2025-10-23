# Skeleton Loading System

A comprehensive skeleton loading system for the Academic Management System admin interface.

## Overview

This system provides:
- **Consistent UI/UX**: All skeleton components match the actual content layout
- **Smooth Animations**: Shimmer effects and transitions
- **Automatic Loading States**: Session-based and custom loading detection
- **Reusable Components**: Modular skeleton components for different use cases
- **Type Safety**: Full TypeScript support

## Components

### Base Components

#### `ShimmerSkeleton`
Basic shimmer skeleton with customizable styling.

```tsx
import { ShimmerSkeleton } from "@/components/admin/skeleton-components"

<ShimmerSkeleton className="w-full h-4 rounded" />
```

#### `TextSkeleton`
Multi-line text skeleton with varying line lengths.

```tsx
import { TextSkeleton } from "@/components/admin/skeleton-components"

<TextSkeleton lines={3} className="w-full" />
```

#### `CardSkeleton`
Card layout skeleton with optional header, content, and footer.

```tsx
import { CardSkeleton } from "@/components/admin/skeleton-components"

<CardSkeleton 
  showHeader={true} 
  showContent={true} 
  showFooter={false}
  className="h-64"
/>
```

#### `TableSkeleton`
Table skeleton with customizable rows and columns.

```tsx
import { TableSkeleton } from "@/components/admin/skeleton-components"

<TableSkeleton 
  rows={8} 
  columns={4} 
  showHeader={true}
  className="w-full"
/>
```

#### `StatsCardSkeleton`
Statistics card skeleton matching the dashboard stats layout.

```tsx
import { StatsCardSkeleton } from "@/components/admin/skeleton-components"

<StatsCardSkeleton className="w-full" />
```

#### `ButtonSkeleton`
Button skeleton with size variants.

```tsx
import { ButtonSkeleton } from "@/components/admin/skeleton-components"

<ButtonSkeleton size="default" className="w-24" />
```

#### `AvatarSkeleton`
Avatar skeleton with size variants.

```tsx
import { AvatarSkeleton } from "@/components/admin/skeleton-components"

<AvatarSkeleton size="default" className="w-10 h-10" />
```

#### `FormSkeleton`
Form skeleton with customizable field count.

```tsx
import { FormSkeleton } from "@/components/admin/skeleton-components"

<FormSkeleton fields={4} className="w-full" />
```

#### `ModalSkeleton`
Modal dialog skeleton.

```tsx
import { ModalSkeleton } from "@/components/admin/skeleton-components"

<ModalSkeleton 
  showHeader={true} 
  showContent={true} 
  showFooter={true}
  className="max-w-md"
/>
```

### Page Skeletons

Pre-built skeletons for specific admin pages:

- `DashboardSkeleton`
- `StudentsPageSkeleton`
- `ProfessorsPageSkeleton`
- `CurriculumPageSkeleton`
- `SectionsPageSkeleton`
- `ClassesPageSkeleton`
- `SettingsPageSkeleton`
- `AnalyticsPageSkeleton`
- `GenericPageSkeleton`

## Hooks

### `useLoadingState`

Basic loading state management with optional delay and timeout.

```tsx
import { useLoadingState } from "@/hooks/use-loading-state"

function MyComponent() {
  const { isLoading, startLoading, stopLoading } = useLoadingState({
    delay: 500, // Minimum loading time
    timeout: 10000 // Maximum loading time
  })

  const handleAction = async () => {
    startLoading()
    try {
      await someAsyncOperation()
    } finally {
      stopLoading()
    }
  }

  return (
    <div>
      {isLoading ? <SomeSkeleton /> : <ActualContent />}
    </div>
  )
}
```

### `useAsyncLoading`

Loading state for async operations.

```tsx
import { useAsyncLoading } from "@/hooks/use-loading-state"

function MyComponent() {
  const { isLoading, error, execute } = useAsyncLoading(
    async () => {
      const response = await fetch('/api/data')
      return response.json()
    },
    [] // dependencies
  )

  return (
    <div>
      <button onClick={execute} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Fetch Data'}
      </button>
      {error && <div>Error: {error}</div>}
    </div>
  )
}
```

### `useMultipleLoadingStates`

Manage multiple loading states simultaneously.

```tsx
import { useMultipleLoadingStates } from "@/hooks/use-loading-state"

function MyComponent() {
  const { 
    isLoading, 
    setLoading, 
    isAnyLoading, 
    isAllLoading 
  } = useMultipleLoadingStates(['data', 'users', 'stats'])

  const fetchData = async () => {
    setLoading('data', true)
    try {
      await fetchDataFromAPI()
    } finally {
      setLoading('data', false)
    }
  }

  return (
    <div>
      <button onClick={fetchData} disabled={isLoading('data')}>
        {isLoading('data') ? 'Loading...' : 'Fetch Data'}
      </button>
      {isAnyLoading && <LoadingSpinner />}
    </div>
  )
}
```

## Higher-Order Components

### `WithLoading`

Wrap pages or components with automatic loading detection.

```tsx
import { WithLoading } from "@/components/admin/with-loading"

function MyPage() {
  return (
    <WithLoading>
      <div>Your page content</div>
    </WithLoading>
  )
}
```

### `withPageLoading`

Higher-order component for wrapping pages.

```tsx
import { withPageLoading } from "@/components/admin/with-loading"
import { CustomPageSkeleton } from "./custom-skeleton"

const MyPage = withPageLoading(
  () => <div>Your page content</div>,
  CustomPageSkeleton
)
```

### `LoadingWrapper`

Wrap individual components with loading states.

```tsx
import { LoadingWrapper } from "@/components/admin/skeleton-components"
import { TableSkeleton } from "@/components/admin/skeleton-components"

function MyTable({ data, isLoading }) {
  return (
    <LoadingWrapper 
      isLoading={isLoading} 
      skeleton={TableSkeleton}
    >
      <ActualTable data={data} />
    </LoadingWrapper>
  )
}
```

## Context

### `LoadingProvider`

Global loading state management.

```tsx
import { LoadingProvider } from "@/contexts/loading-context"

function App() {
  return (
    <LoadingProvider>
      <YourApp />
    </LoadingProvider>
  )
}
```

### `useLoading`

Access global loading context.

```tsx
import { useLoading } from "@/contexts/loading-context"

function MyComponent() {
  const { isLoading, setGlobalLoading, isAnyLoading } = useLoading()

  const handleGlobalAction = () => {
    setGlobalLoading(true)
    // Perform action
    setGlobalLoading(false)
  }

  return (
    <div>
      {isAnyLoading && <GlobalLoadingIndicator />}
    </div>
  )
}
```

## Integration Examples

### Basic Page Integration

```tsx
"use client"

import { WithLoading } from "@/components/admin/with-loading"
import { useSession } from "next-auth/react"

export default function StudentsPage() {
  const { status } = useSession()

  return (
    <WithLoading loading={status === "loading"}>
      <div className="space-y-6 p-6">
        <h1>Students</h1>
        {/* Your content */}
      </div>
    </WithLoading>
  )
}
```

### Component with Data Fetching

```tsx
"use client"

import { LoadingWrapper } from "@/components/admin/skeleton-components"
import { TableSkeleton } from "@/components/admin/skeleton-components"
import { useAsyncLoading } from "@/hooks/use-loading-state"

export function StudentsTable() {
  const { isLoading, error, execute } = useAsyncLoading(
    async () => {
      const response = await fetch('/api/students')
      return response.json()
    }
  )

  useEffect(() => {
    execute()
  }, [])

  return (
    <LoadingWrapper 
      isLoading={isLoading} 
      skeleton={() => <TableSkeleton rows={10} columns={5} />}
    >
      <ActualStudentsTable data={data} />
    </LoadingWrapper>
  )
}
```

### Custom Skeleton Component

```tsx
"use client"

import { ShimmerSkeleton } from "@/components/admin/skeleton-components"
import { cn } from "@/lib/utils"

export function CustomSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <ShimmerSkeleton className="h-8 w-48 rounded" />
      <div className="grid grid-cols-3 gap-4">
        <ShimmerSkeleton className="h-32 w-full rounded-lg" />
        <ShimmerSkeleton className="h-32 w-full rounded-lg" />
        <ShimmerSkeleton className="h-32 w-full rounded-lg" />
      </div>
      <ShimmerSkeleton className="h-64 w-full rounded-lg" />
    </div>
  )
}
```

## Best Practices

1. **Match Layout**: Ensure skeleton dimensions match actual content
2. **Use Appropriate Delays**: Add minimum loading times for better UX
3. **Handle Errors**: Always handle loading errors gracefully
4. **Consistent Spacing**: Use the same spacing as actual content
5. **Accessibility**: Maintain proper contrast and structure
6. **Performance**: Use CSS animations for smooth performance
7. **Responsive**: Ensure skeletons work on all screen sizes

## CSS Animations

The system includes a shimmer animation defined in `app/styles/admin.css`:

```css
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}
```

## Customization

### Custom Animation Timing

```css
.animate-shimmer-slow {
  animation: shimmer 3s infinite;
}

.animate-shimmer-fast {
  animation: shimmer 1s infinite;
}
```

### Custom Colors

```tsx
<ShimmerSkeleton 
  className="bg-blue-200 dark:bg-blue-800" 
/>
```

## Troubleshooting

### Common Issues

1. **Skeleton not showing**: Check if loading state is properly set
2. **Layout shifts**: Ensure skeleton dimensions match content
3. **Animation not smooth**: Check CSS animation properties
4. **TypeScript errors**: Ensure proper type definitions

### Debug Tips

```tsx
// Add debug logging
const { isLoading } = useLoadingState()
console.log('Loading state:', isLoading)
```

## Migration Guide

To migrate existing loading states:

1. Replace loading spinners with skeleton components
2. Use `WithLoading` for page-level loading
3. Use `LoadingWrapper` for component-level loading
4. Replace manual loading states with hooks
5. Update CSS to include shimmer animations
