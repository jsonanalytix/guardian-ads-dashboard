// ============================================================
// Page Wrapper component
// Phase 5: Wraps async page content with consistent loading,
// error, and empty states. Combines ErrorBoundary with the
// useAsync hook pattern used throughout the dashboard.
// ============================================================

import { type ReactNode } from 'react'
import { ErrorBoundary } from './error-boundary'
import { LoadingState } from './loading-state'
import { EmptyState } from './empty-state'

interface PageWrapperProps {
  /** Whether data is still loading */
  loading?: boolean
  /** Error object if the fetch failed */
  error?: Error | null
  /** Whether the data is empty (no results) */
  isEmpty?: boolean
  /** Loading skeleton variant */
  loadingVariant?: 'cards' | 'table' | 'chart' | 'page' | 'inline'
  /** Number of skeleton rows to show */
  loadingRows?: number
  /** Custom empty state title */
  emptyTitle?: string
  /** Custom empty state description */
  emptyDescription?: string
  /** Content to render when data is available */
  children: ReactNode
}

export function PageWrapper({
  loading = false,
  error = null,
  isEmpty = false,
  loadingVariant = 'page',
  loadingRows = 5,
  emptyTitle,
  emptyDescription,
  children,
}: PageWrapperProps) {
  if (loading) {
    return <LoadingState variant={loadingVariant} rows={loadingRows} />
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Failed to load data"
        description={error.message || 'An unexpected error occurred. Please try refreshing the page.'}
      />
    )
  }

  if (isEmpty) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
      />
    )
  }

  return <ErrorBoundary>{children}</ErrorBoundary>
}
