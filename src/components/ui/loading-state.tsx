// ============================================================
// Reusable Loading State component
// Phase 5: Skeleton loading UI for async data pages
// ============================================================

import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingStateProps {
  /** Number of skeleton rows to show */
  rows?: number
  /** Layout variant */
  variant?: 'cards' | 'table' | 'chart' | 'page' | 'inline'
  /** Custom class name */
  className?: string
}

/** Animated skeleton block */
function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', className)}
    />
  )
}

export function LoadingState({ rows = 3, variant = 'page', className }: LoadingStateProps) {
  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 py-8 justify-center text-muted-foreground', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (variant === 'cards') {
    return (
      <div className={cn('grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4', className)}>
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="mb-2 h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('space-y-3', className)}>
        {/* Table header skeleton */}
        <Skeleton className="h-10 w-full" />
        {/* Table rows */}
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
        {/* Pagination skeleton */}
        <div className="flex justify-between">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
    )
  }

  if (variant === 'chart') {
    return (
      <div className={cn('rounded-lg border bg-card p-6', className)}>
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  // 'page' variant - full page loading
  return (
    <div className={cn('space-y-6', className)}>
      {/* KPI-style cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-6 animate-pulse">
            <Skeleton className="mb-3 h-4 w-24" />
            <Skeleton className="mb-2 h-8 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <div className="rounded-lg border bg-card p-6 animate-pulse">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-64 w-full" />
      </div>
      {/* Table area */}
      <div className="space-y-3 animate-pulse">
        <Skeleton className="h-10 w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    </div>
  )
}

export { Skeleton }
