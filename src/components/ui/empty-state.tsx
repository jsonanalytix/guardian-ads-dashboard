// ============================================================
// Reusable Empty State component
// Phase 5: Displayed when data is empty or no results match
// ============================================================

import { cn } from '@/lib/utils'
import { Inbox, Search, FileX, type LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  /** Icon to display */
  icon?: LucideIcon
  /** Main heading */
  title?: string
  /** Description text */
  description?: string
  /** Optional action button */
  action?: React.ReactNode
  /** Variant for different contexts */
  variant?: 'default' | 'search' | 'error'
  /** Custom class name */
  className?: string
}

const variantDefaults = {
  default: {
    icon: Inbox,
    title: 'No data available',
    description: 'There is no data to display for the current selection.',
  },
  search: {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or filter criteria.',
  },
  error: {
    icon: FileX,
    title: 'Unable to load data',
    description: 'Something went wrong while loading the data. Please try again.',
  },
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  const defaults = variantDefaults[variant]
  const Icon = icon ?? defaults.icon

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center',
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="mt-4 text-sm font-semibold">{title ?? defaults.title}</h3>
      <p className="mt-1 text-sm text-muted-foreground max-w-sm">
        {description ?? defaults.description}
      </p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
