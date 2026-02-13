// ============================================================
// Day & Hour Analysis Page
// Phase 3: Hour-of-day x Day-of-week heatmap (by conversions or CPA),
// peak conversion windows, off-hours spend identification,
// ad schedule optimization recommendations
// ============================================================

import { useState, useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getHourlyHeatmapData, getHourlyPerformance } from '@/data'
import type { Filters } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { formatCurrency, formatCurrencyDetailed, formatNumber, cn } from '@/lib/utils'
import { Clock, Sun, Moon, Zap, AlertTriangle } from 'lucide-react'

type HeatmapMetric = 'conversions' | 'cpa' | 'spend' | 'clicks'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const DAY_FULL_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function formatHour(hour: number): string {
  if (hour === 0) return '12am'
  if (hour === 12) return '12pm'
  return hour < 12 ? `${hour}am` : `${hour - 12}pm`
}

export function DayHourAnalysis() {
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('30d')
  const [heatmapMetric, setHeatmapMetric] = useState<HeatmapMetric>('conversions')
  const filters: Filters = { dateRange }

  const { data: heatmapData, loading: heatmapLoading } = useAsync(
    () => getHourlyHeatmapData(heatmapMetric, filters),
    [heatmapMetric, dateRange]
  )

  const { data: hourlyRaw, loading: rawLoading } = useAsync(
    () => getHourlyPerformance(filters),
    [dateRange]
  )

  // Build the 7x24 heatmap grid
  const heatmapGrid = useMemo(() => {
    if (!heatmapData) return []

    const values = heatmapData.map((d) => d.value).filter((v) => v > 0)
    const maxVal = Math.max(...values, 1)
    const minVal = Math.min(...values, 0)

    // Create a 7-day x 24-hour grid
    const grid: { dayOfWeek: number; hour: number; value: number; intensity: number }[][] = []
    for (let day = 0; day < 7; day++) {
      const row: typeof grid[0] = []
      for (let hour = 0; hour < 24; hour++) {
        const cell = heatmapData.find((d) => d.dayOfWeek === day && d.hour === hour)
        const value = cell?.value || 0
        // For CPA, invert (lower is better)
        const intensity = heatmapMetric === 'cpa'
          ? maxVal > minVal ? 1 - (value - minVal) / (maxVal - minVal) : 0.5
          : maxVal > minVal ? (value - minVal) / (maxVal - minVal) : 0.5
        row.push({ dayOfWeek: day, hour, value, intensity })
      }
      grid.push(row)
    }
    return grid
  }, [heatmapData, heatmapMetric])

  // Hourly aggregation (across all days)
  const hourlyTotals = useMemo(() => {
    if (!hourlyRaw) return []
    const hourMap = new Map<number, { spend: number; conversions: number; clicks: number; count: number }>()
    for (const h of hourlyRaw) {
      const existing = hourMap.get(h.hour)
      if (existing) {
        existing.spend += h.spend
        existing.conversions += h.conversions
        existing.clicks += h.clicks
        existing.count++
      } else {
        hourMap.set(h.hour, { spend: h.spend, conversions: h.conversions, clicks: h.clicks, count: 1 })
      }
    }
    return Array.from(hourMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([hour, data]) => ({
        hour: formatHour(hour),
        hourNum: hour,
        avgSpend: data.spend / data.count,
        avgConversions: data.conversions / data.count,
        totalConversions: data.conversions,
        totalSpend: data.spend,
        cpa: data.conversions > 0 ? data.spend / data.conversions : 0,
      }))
  }, [hourlyRaw])

  // Peak conversion windows
  const peakWindows = useMemo(() => {
    if (!hourlyTotals.length) return []
    return [...hourlyTotals]
      .sort((a, b) => b.totalConversions - a.totalConversions)
      .slice(0, 5)
  }, [hourlyTotals])

  // Off-hours spend (10pm-6am)
  const offHoursSpend = useMemo(() => {
    if (!hourlyTotals.length) return { spend: 0, conversions: 0, percent: 0 }
    const offHours = hourlyTotals.filter((h) => h.hourNum >= 22 || h.hourNum < 6)
    const totalSpend = hourlyTotals.reduce((sum, h) => sum + h.totalSpend, 0)
    const offSpend = offHours.reduce((sum, h) => sum + h.totalSpend, 0)
    const offConv = offHours.reduce((sum, h) => sum + h.totalConversions, 0)
    return {
      spend: offSpend,
      conversions: offConv,
      percent: totalSpend > 0 ? (offSpend / totalSpend) * 100 : 0,
    }
  }, [hourlyTotals])

  // Day-of-week aggregation
  const dayTotals = useMemo(() => {
    if (!hourlyRaw) return []
    const dayMap = new Map<number, { spend: number; conversions: number; clicks: number; count: number }>()
    for (const h of hourlyRaw) {
      const existing = dayMap.get(h.dayOfWeek)
      if (existing) {
        existing.spend += h.spend
        existing.conversions += h.conversions
        existing.clicks += h.clicks
        existing.count++
      } else {
        dayMap.set(h.dayOfWeek, { spend: h.spend, conversions: h.conversions, clicks: h.clicks, count: 1 })
      }
    }
    return Array.from(dayMap.entries())
      .sort(([a], [b]) => a - b)
      .map(([day, data]) => ({
        day: DAY_NAMES[day],
        dayFull: DAY_FULL_NAMES[day],
        dayNum: day,
        totalSpend: data.spend,
        totalConversions: data.conversions,
        avgSpend: data.spend / (data.count / 24), // per day average
        avgConversions: data.conversions / (data.count / 24),
        cpa: data.conversions > 0 ? data.spend / data.conversions : 0,
      }))
  }, [hourlyRaw])

  // Schedule recommendations
  const scheduleRecommendations = useMemo(() => {
    const recommendations: { icon: React.ElementType; title: string; description: string; type: 'success' | 'warning' | 'info' }[] = []

    if (peakWindows.length > 0) {
      const peakHours = peakWindows.map((p) => p.hour).join(', ')
      recommendations.push({
        icon: Zap,
        title: 'Peak Conversion Hours',
        description: `Top conversion hours: ${peakHours}. Consider increasing bids during these windows.`,
        type: 'success',
      })
    }

    if (offHoursSpend.percent > 8) {
      recommendations.push({
        icon: Moon,
        title: 'Off-Hours Spend',
        description: `${offHoursSpend.percent.toFixed(1)}% of spend occurs between 10pm-6am with limited conversions. Consider reducing bids or pausing ads during these hours.`,
        type: 'warning',
      })
    }

    const weekendDays = dayTotals.filter((d) => d.dayNum === 0 || d.dayNum === 6)
    const weekdayDays = dayTotals.filter((d) => d.dayNum >= 1 && d.dayNum <= 5)
    if (weekendDays.length && weekdayDays.length) {
      const weekendAvgCPA = weekendDays.reduce((sum, d) => sum + d.cpa, 0) / weekendDays.length
      const weekdayAvgCPA = weekdayDays.reduce((sum, d) => sum + d.cpa, 0) / weekdayDays.length
      if (weekendAvgCPA > weekdayAvgCPA * 1.2) {
        recommendations.push({
          icon: AlertTriangle,
          title: 'Weekend CPA Premium',
          description: `Weekend CPA is ${Math.round(((weekendAvgCPA / weekdayAvgCPA) - 1) * 100)}% higher than weekdays. Consider reducing weekend bids by 15-25%.`,
          type: 'warning',
        })
      }
    }

    recommendations.push({
      icon: Sun,
      title: 'Business Hours Focus',
      description: 'Insurance searches peak during business hours (8am-5pm ET). Ensure maximum bid coverage during these windows.',
      type: 'info',
    })

    return recommendations
  }, [peakWindows, offHoursSpend, dayTotals])

  const formatCellValue = (value: number) => {
    switch (heatmapMetric) {
      case 'spend': return formatCurrency(value)
      case 'cpa': return value > 0 ? `$${value.toFixed(0)}` : '—'
      case 'conversions': return value.toFixed(1)
      case 'clicks': return value.toFixed(0)
    }
  }

  if (heatmapLoading || rawLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Day & Hour Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Identify peak performance windows and optimize ad schedules
          </p>
        </div>
        <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
          <TabsList>
            <TabsTrigger value="7d">7D</TabsTrigger>
            <TabsTrigger value="14d">14D</TabsTrigger>
            <TabsTrigger value="30d">30D</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-muted-foreground">Peak Hour</p>
            </div>
            <p className="mt-1 text-2xl font-bold">{peakWindows[0]?.hour || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {peakWindows[0] ? `${peakWindows[0].totalConversions} total conversions` : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Best Day</p>
            </div>
            <p className="mt-1 text-2xl font-bold">
              {dayTotals.length ? [...dayTotals].sort((a, b) => b.totalConversions - a.totalConversions)[0]?.dayFull : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4 text-purple-500" />
              <p className="text-xs font-medium text-muted-foreground">Off-Hours Spend</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(offHoursSpend.spend)}</p>
            <p className="text-xs text-muted-foreground">{offHoursSpend.percent.toFixed(1)}% of total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Off-Hours Conv.</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{offHoursSpend.conversions}</p>
            <p className="text-xs text-muted-foreground">10pm - 6am</p>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Hour x Day Heatmap</CardTitle>
              <CardDescription>Average daily performance by hour and day of week</CardDescription>
            </div>
            <div className="flex gap-1.5">
              {(['conversions', 'cpa', 'spend', 'clicks'] as HeatmapMetric[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setHeatmapMetric(m)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                    heatmapMetric === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {m === 'cpa' ? 'CPA' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 bg-card p-1 text-left font-medium text-muted-foreground w-12" />
                  {Array.from({ length: 24 }).map((_, h) => (
                    <th key={h} className="p-1 text-center font-medium text-muted-foreground min-w-[32px]">
                      {formatHour(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapGrid.map((row, dayIdx) => (
                  <tr key={dayIdx}>
                    <td className="sticky left-0 z-10 bg-card p-1 font-medium text-muted-foreground">{DAY_NAMES[dayIdx]}</td>
                    {row!.map((cell) => {
                      const hue = heatmapMetric === 'cpa' ? 142 : 142
                      return (
                        <td
                          key={`${cell.dayOfWeek}-${cell.hour}`}
                          className="p-0.5"
                          title={`${DAY_FULL_NAMES[cell.dayOfWeek]}, ${formatHour(cell.hour)}: ${formatCellValue(cell.value)}`}
                        >
                          <div
                            className="flex h-7 items-center justify-center rounded text-[9px] tabular-nums font-medium transition-all hover:ring-1 hover:ring-primary"
                            style={{
                              backgroundColor: cell.value > 0
                                ? `hsl(${hue * cell.intensity}, ${40 + 35 * cell.intensity}%, ${95 - 40 * cell.intensity}%)`
                                : 'hsl(var(--muted))',
                              color: cell.intensity > 0.6 ? 'hsl(142, 50%, 25%)' : 'hsl(var(--muted-foreground))',
                            }}
                          >
                            {cell.value > 0 ? formatCellValue(cell.value) : ''}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Low</span>
            <div className="flex h-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-6"
                  style={{
                    backgroundColor: `hsl(${142 * (i / 4)}, ${40 + 35 * (i / 4)}%, ${95 - 40 * (i / 4)}%)`,
                  }}
                />
              ))}
            </div>
            <span>High</span>
            <span className="ml-2 text-muted-foreground/60">
              ({heatmapMetric === 'cpa' ? 'Lower is better' : 'Higher is better'})
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Hourly + Daily Bar Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversions by Hour of Day</CardTitle>
            <CardDescription>Average conversions per hour across all days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hourlyTotals}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={3} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [Math.round(value), 'Total Conversions']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar
                    dataKey="totalConversions"
                    fill="#3b82f6"
                    radius={[2, 2, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversions by Day of Week</CardTitle>
            <CardDescription>Total conversions per day of week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dayTotals}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value: number) => [Math.round(value), 'Total Conversions']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar
                    dataKey="totalConversions"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ad Schedule Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {scheduleRecommendations.map((rec, idx) => {
              const Icon = rec.icon
              return (
                <div
                  key={idx}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border p-4',
                    rec.type === 'success' && 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50',
                    rec.type === 'warning' && 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/50',
                    rec.type === 'info' && 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                      rec.type === 'success' && 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400',
                      rec.type === 'warning' && 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400',
                      rec.type === 'info' && 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{rec.title}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
      <div className="h-96 rounded-lg border bg-card animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
      </div>
    </div>
  )
}
