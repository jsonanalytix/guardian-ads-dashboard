// Global date range context — single source of truth for the header picker
// and all dashboard pages that consume date-based filters.
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Filters } from '@/data/types'

export type DateRangeKey = Filters['dateRange']

interface DateRangeContextValue {
  dateRange: DateRangeKey
  setDateRange: (range: DateRangeKey) => void
  filters: Filters
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRangeKey>('30d')

  const setDateRange = useCallback((range: DateRangeKey) => {
    setDateRangeState(range)
  }, [])

  const filters: Filters = { dateRange }

  return (
    <DateRangeContext.Provider value={{ dateRange, setDateRange, filters }}>
      {children}
    </DateRangeContext.Provider>
  )
}

export function useDateRange(): DateRangeContextValue {
  const ctx = useContext(DateRangeContext)
  if (!ctx) {
    throw new Error('useDateRange must be used within a DateRangeProvider')
  }
  return ctx
}
