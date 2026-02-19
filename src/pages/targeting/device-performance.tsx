// ============================================================
// Device Performance Page
// Phase 3: Desktop vs Mobile vs Tablet comparison,
// device split by product, CPA and conversion rate by device,
// device bid adjustment recommendations
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useDateRange } from '@/hooks/use-date-range'
import { getDeviceSummary, getDevicePerformance } from '@/data'
import type { DevicePerformance as DevicePerf, Device, Product } from '@/data/types'
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
  Legend,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCurrency, formatCurrencyDetailed, formatPercent, formatMultiplier, cn } from '@/lib/utils'
import { Monitor, Smartphone, Tablet, TrendingUp, TrendingDown } from 'lucide-react'

const DEVICE_COLORS: Record<Device, string> = {
  Desktop: '#3b82f6',
  Mobile: '#10b981',
  Tablet: '#f59e0b',
}

const DEVICE_ICONS: Record<Device, React.ElementType> = {
  Desktop: Monitor,
  Mobile: Smartphone,
  Tablet: Tablet,
}

const dateRanges = [
  { key: '7d', label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
  { key: 'custom', label: 'Custom' },
] as const

export function DevicePerformancePage() {
  const { dateRange, setDateRange, filters } = useDateRange()

  const { data: deviceSummary, loading: summaryLoading } = useAsync(
    () => getDeviceSummary(filters),
    [dateRange, filters.startDate, filters.endDate]
  )
  const { data: deviceRaw, loading: rawLoading } = useAsync(
    () => getDevicePerformance(filters),
    [dateRange, filters.startDate, filters.endDate]
  )

  // Aggregate by device
  const deviceTotals = useMemo(() => {
    if (!deviceSummary) return []
    const deviceMap = new Map<Device, { spend: number; impressions: number; clicks: number; conversions: number; conversionValue: number }>()
    for (const d of deviceSummary) {
      const existing = deviceMap.get(d.device)
      if (existing) {
        existing.spend += d.spend
        existing.impressions += d.impressions
        existing.clicks += d.clicks
        existing.conversions += d.conversions
        existing.conversionValue += d.conversionValue
      } else {
        deviceMap.set(d.device, {
          spend: d.spend,
          impressions: d.impressions,
          clicks: d.clicks,
          conversions: d.conversions,
          conversionValue: d.conversionValue,
        })
      }
    }
    const totalSpend = Array.from(deviceMap.values()).reduce((sum, d) => sum + d.spend, 0)
    return Array.from(deviceMap.entries()).map(([device, data]) => ({
      device,
      ...data,
      ctr: data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0,
      cpc: data.clicks > 0 ? data.spend / data.clicks : 0,
      cpa: data.conversions > 0 ? data.spend / data.conversions : 0,
      roas: data.spend > 0 ? data.conversionValue / data.spend : 0,
      convRate: data.clicks > 0 ? (data.conversions / data.clicks) * 100 : 0,
      spendShare: totalSpend > 0 ? (data.spend / totalSpend) * 100 : 0,
    }))
  }, [deviceSummary])

  // Spend distribution pie
  const spendPieData = useMemo(() => {
    return deviceTotals.map((d) => ({
      name: d.device,
      value: Math.round(d.spend),
    }))
  }, [deviceTotals])

  // Device trend over time
  const deviceTrend = useMemo(() => {
    if (!deviceRaw) return []
    const dateDeviceMap = new Map<string, Map<Device, { spend: number; conversions: number; clicks: number; impressions: number }>>()

    for (const d of deviceRaw) {
      let dateMap = dateDeviceMap.get(d.date)
      if (!dateMap) {
        dateMap = new Map()
        dateDeviceMap.set(d.date, dateMap)
      }
      const existing = dateMap.get(d.device)
      if (existing) {
        existing.spend += d.spend
        existing.conversions += d.conversions
        existing.clicks += d.clicks
        existing.impressions += d.impressions
      } else {
        dateMap.set(d.device, { spend: d.spend, conversions: d.conversions, clicks: d.clicks, impressions: d.impressions })
      }
    }

    return [...dateDeviceMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, deviceMap]) => {
        const point: Record<string, string | number> = { date }
        for (const [device, data] of deviceMap.entries()) {
          point[`${device} CPA`] = data.conversions > 0 ? Math.round((data.spend / data.conversions) * 100) / 100 : 0
        }
        return point
      })
  }, [deviceRaw])

  // CPA comparison bar chart
  const cpaComparison = useMemo(() => {
    return deviceTotals.map((d) => ({
      device: d.device,
      CPA: Math.round(d.cpa * 100) / 100,
      'Conv Rate': Math.round(d.convRate * 100) / 100,
      ROAS: Math.round(d.roas * 100) / 100,
    }))
  }, [deviceTotals])

  // Bid adjustment recommendations
  const bidRecommendations = useMemo(() => {
    if (deviceTotals.length === 0) return []
    const avgCPA = deviceTotals.reduce((sum, d) => sum + d.cpa, 0) / deviceTotals.length
    return deviceTotals.map((d) => {
      const cpaRatio = d.cpa / avgCPA
      let recommendation: string
      let adjustment: number
      let status: 'increase' | 'decrease' | 'maintain'

      if (cpaRatio < 0.85) {
        adjustment = Math.round((1 - cpaRatio) * 100)
        recommendation = `Increase bids by ${adjustment}% — CPA is ${Math.round((1 - cpaRatio) * 100)}% below average`
        status = 'increase'
      } else if (cpaRatio > 1.15) {
        adjustment = -Math.round((cpaRatio - 1) * 100)
        recommendation = `Decrease bids by ${Math.abs(adjustment)}% — CPA is ${Math.round((cpaRatio - 1) * 100)}% above average`
        status = 'decrease'
      } else {
        adjustment = 0
        recommendation = 'Maintain current bids — CPA is within 15% of average'
        status = 'maintain'
      }

      return { ...d, recommendation, adjustment, status }
    })
  }, [deviceTotals])

  if (summaryLoading || rawLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Device Performance</h2>
          <p className="text-sm text-muted-foreground">
            Compare performance across Desktop, Mobile, and Tablet
          </p>
        </div>
        <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
          <TabsList>
            {dateRanges.map((r) => (
              <TabsTrigger key={r.key} value={r.key}>{r.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Device KPI Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {deviceTotals.map((d) => {
          const Icon = DEVICE_ICONS[d.device]
          return (
            <Card key={d.device}>
              <CardContent className="px-5 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${DEVICE_COLORS[d.device]}15` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: DEVICE_COLORS[d.device] }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{d.device}</p>
                    <p className="text-xs text-muted-foreground">{formatPercent(d.spendShare)} of spend</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Spend</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(d.spend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CPA</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrencyDetailed(d.cpa)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">ROAS</p>
                    <p className="text-sm font-bold tabular-nums">{formatMultiplier(d.roas)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Conv Rate</p>
                    <p className="text-sm font-bold tabular-nums">{formatPercent(d.convRate)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Conversions</p>
                    <p className="text-sm font-bold tabular-nums">{d.conversions.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CTR</p>
                    <p className="text-sm font-bold tabular-nums">{formatPercent(d.ctr)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Spend Distribution + CPA Comparison */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spend Distribution</CardTitle>
            <CardDescription>How budget is allocated across devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spendPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {spendPieData.map((entry) => (
                      <Cell key={entry.name} fill={DEVICE_COLORS[entry.name as Device]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), 'Spend']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">CPA & Conversion Rate by Device</CardTitle>
            <CardDescription>Key efficiency metrics compared across devices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cpaComparison}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="device" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'CPA') return [formatCurrencyDetailed(value), 'CPA']
                      if (name === 'Conv Rate') return [formatPercent(value), 'Conv Rate']
                      return [formatMultiplier(value), 'ROAS']
                    }}
                  />
                  <Legend />
                  <Bar dataKey="CPA" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="ROAS" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPA Trend by Device */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CPA Trend by Device</CardTitle>
          <CardDescription>Daily CPA across device types over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={deviceTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(date: string) => {
                    const d = new Date(date + 'T00:00:00')
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                <Tooltip
                  formatter={(value: number) => [formatCurrencyDetailed(value), '']}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  labelFormatter={(date: string) => {
                    const d = new Date(date + 'T00:00:00')
                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  }}
                />
                <Legend />
                {(['Desktop', 'Mobile', 'Tablet'] as Device[]).map((device) => (
                  <Line
                    key={device}
                    type="monotone"
                    dataKey={`${device} CPA`}
                    name={`${device} CPA`}
                    stroke={DEVICE_COLORS[device]}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Bid Adjustment Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Device Bid Adjustment Recommendations</CardTitle>
          <CardDescription>
            Based on relative CPA performance across devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bidRecommendations.map((rec) => {
              const Icon = DEVICE_ICONS[rec.device]
              return (
                <div
                  key={rec.device}
                  className={cn(
                    'flex items-center gap-4 rounded-lg border p-4',
                    rec.status === 'increase' && 'border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/50',
                    rec.status === 'decrease' && 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50',
                    rec.status === 'maintain' && 'border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-950/50',
                  )}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${DEVICE_COLORS[rec.device]}15` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: DEVICE_COLORS[rec.device] }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{rec.device}</span>
                      {rec.status === 'increase' && (
                        <Badge variant="success" className="text-xs">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          +{rec.adjustment}%
                        </Badge>
                      )}
                      {rec.status === 'decrease' && (
                        <Badge variant="destructive" className="text-xs">
                          <TrendingDown className="mr-1 h-3 w-3" />
                          {rec.adjustment}%
                        </Badge>
                      )}
                      {rec.status === 'maintain' && (
                        <Badge variant="secondary" className="text-xs">Maintain</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-muted-foreground">{rec.recommendation}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">{formatCurrencyDetailed(rec.cpa)}</p>
                    <p className="text-xs text-muted-foreground">CPA</p>
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
      <div className="grid gap-4 md:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-40 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
      </div>
    </div>
  )
}
