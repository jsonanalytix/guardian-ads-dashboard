// Global date range context — single source of truth for the header picker
// and all dashboard pages that consume date-based filters.
import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import type { Filters } from '@/data/types'

export type DateRangeKey = Filters['dateRange']

interface DateRangeContextValue {
  dateRange: DateRangeKey
  setDateRange: (range: DateRangeKey) => void
  customStartDate: string
  customEndDate: string
  setCustomDateRange: (startDate: string, endDate: string) => void
  filters: Filters
}

const DateRangeContext = createContext<DateRangeContextValue | null>(null)

function toISODate(d: Date): string {
  return d.toISOString().split('T')[0]!
}

function getDefaultCustomRange(): { startDate: string; endDate: string } {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - 30)
  return {
    startDate: toISODate(startDate),
    endDate: toISODate(endDate),
  }
}

export function DateRangeProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRangeState] = useState<DateRangeKey>('30d')
  const defaults = getDefaultCustomRange()
  const [customStartDate, setCustomStartDate] = useState<string>(defaults.startDate)
  const [customEndDate, setCustomEndDate] = useState<string>(defaults.endDate)

  const setDateRange = useCallback((range: DateRangeKey) => {
    setDateRangeState(range)
  }, [])

  const setCustomDateRange = useCallback((startDate: string, endDate: string) => {
    setCustomStartDate(startDate)
    setCustomEndDate(endDate)
    setDateRangeState('custom')
  }, [])

  const filters: Filters = {
    dateRange,
    startDate: dateRange === 'custom' ? customStartDate : undefined,
    endDate: dateRange === 'custom' ? customEndDate : undefined,
  }

  return (
    <DateRangeContext.Provider
      value={{
        dateRange,
        setDateRange,
        customStartDate,
        customEndDate,
        setCustomDateRange,
        filters,
      }}
    >
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
