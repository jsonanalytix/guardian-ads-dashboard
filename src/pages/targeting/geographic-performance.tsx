// ============================================================
// Geographic Performance Page
// Phase 3: US state-level heatmap (table-based), state performance
// table, top/bottom regions, regional CPA and ROAS comparison
// ============================================================

import { useState, useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useDateRange } from '@/hooks/use-date-range'
import { getGeoSummary } from '@/data'
import type { GeoPerformance } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, MetricCell } from '@/components/tables/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts'
import { formatCurrency, formatCurrencyDetailed, formatNumber, formatPercent, formatMultiplier } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { MapPin, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'

const dateRanges = [
  { key: '7d', label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
] as const

function isStateLikeCode(code: string): boolean {
  return /^[A-Z]{2,3}$/.test((code || '').trim())
}

function getLocationLabel(state: string, stateCode: string): string {
  if (isStateLikeCode(stateCode)) return stateCode
  const base = (state || '').split(',')[0]?.trim() || stateCode || 'N/A'
  const words = base.split(/\s+/).filter(Boolean)
  if (words.length === 1) return words[0]!.slice(0, 3).toUpperCase()
  return words.slice(0, 3).map((w) => w[0]).join('').toUpperCase()
}

export function GeographicPerformance() {
  const { dateRange, setDateRange, filters } = useDateRange()
  const [heatmapMetric, setHeatmapMetric] = useState<'conversions' | 'cpa' | 'spend' | 'roas'>('conversions')

  const { data: geoData, loading } = useAsync(
    () => getGeoSummary(filters),
    [dateRange]
  )

  // Sort by spend for the main table
  const sortedData = useMemo(() => {
    if (!geoData) return []
    return [...geoData].sort((a, b) => b.spend - a.spend)
  }, [geoData])

  // Top performing states (lowest CPA with meaningful conversions)
  const topStates = useMemo(() => {
    if (!geoData) return []
    return [...geoData]
      .filter((g) => g.conversions >= 3)
      .sort((a, b) => a.cpa - b.cpa)
      .slice(0, 5)
  }, [geoData])

  // Bottom performing states (highest CPA with meaningful spend)
  const bottomStates = useMemo(() => {
    if (!geoData) return []
    return [...geoData]
      .filter((g) => g.spend >= 500 && g.cpa > 0)
      .sort((a, b) => b.cpa - a.cpa)
      .slice(0, 5)
  }, [geoData])

  // CPA vs ROAS scatter plot data
  const scatterData = useMemo(() => {
    if (!geoData) return []
    return geoData
      .filter((g) => g.conversions >= 2)
      .map((g) => ({
        state: g.state,
        stateCode: g.stateCode,
        locationLabel: getLocationLabel(g.state, g.stateCode),
        cpa: g.cpa,
        roas: g.roas,
        spend: g.spend,
        conversions: g.conversions,
      }))
  }, [geoData])

  // Heatmap data (for the visual state grid)
  const heatmapData = useMemo(() => {
    if (!geoData) return []
    const values = geoData.map((g) => {
      switch (heatmapMetric) {
        case 'conversions': return g.conversions
        case 'cpa': return g.cpa
        case 'spend': return g.spend
        case 'roas': return g.roas
      }
    })
    const maxVal = Math.max(...values)
    const minVal = Math.min(...values)

    return geoData.map((g) => {
      let value: number
      switch (heatmapMetric) {
        case 'conversions': value = g.conversions; break
        case 'cpa': value = g.cpa; break
        case 'spend': value = g.spend; break
        case 'roas': value = g.roas; break
      }
      // For CPA, invert (lower is better)
      const intensity = heatmapMetric === 'cpa'
        ? maxVal > minVal ? 1 - (value - minVal) / (maxVal - minVal) : 0.5
        : maxVal > minVal ? (value - minVal) / (maxVal - minVal) : 0.5
      return { ...g, value, intensity }
    }).sort((a, b) => b.intensity - a.intensity)
  }, [geoData, heatmapMetric])

  // Summary totals
  const totals = useMemo(() => {
    if (!geoData) return null
    const t = geoData.reduce((acc, g) => ({
      spend: acc.spend + g.spend,
      impressions: acc.impressions + g.impressions,
      clicks: acc.clicks + g.clicks,
      conversions: acc.conversions + g.conversions,
      conversionValue: acc.conversionValue + g.conversionValue,
    }), { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 })

    return {
      ...t,
      cpa: t.conversions > 0 ? t.spend / t.conversions : 0,
      roas: t.spend > 0 ? t.conversionValue / t.spend : 0,
      states: geoData.length,
    }
  }, [geoData])

  const tableColumns: ColumnDef<GeoPerformance, unknown>[] = [
    {
      accessorKey: 'state',
      header: 'State',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs text-muted-foreground">
            {getLocationLabel(row.original.state, row.original.stateCode)}
          </span>
          <span className="font-medium">{row.original.state}</span>
        </div>
      ),
    },
    { accessorKey: 'spend', header: 'Spend', cell: ({ row }) => <MetricCell value={row.original.spend} format="currency" /> },
    { accessorKey: 'impressions', header: 'Impressions', cell: ({ row }) => <MetricCell value={row.original.impressions} /> },
    { accessorKey: 'clicks', header: 'Clicks', cell: ({ row }) => <MetricCell value={row.original.clicks} /> },
    { accessorKey: 'ctr', header: 'CTR', cell: ({ row }) => <MetricCell value={row.original.ctr} format="percent" /> },
    { accessorKey: 'conversions', header: 'Conv.', cell: ({ row }) => <MetricCell value={row.original.conversions} /> },
    { accessorKey: 'cpa', header: 'CPA', cell: ({ row }) => <MetricCell value={row.original.cpa} format="currency" /> },
    { accessorKey: 'roas', header: 'ROAS', cell: ({ row }) => <MetricCell value={row.original.roas} format="multiplier" /> },
    { accessorKey: 'convRate', header: 'Conv Rate', cell: ({ row }) => <MetricCell value={row.original.convRate} format="percent" /> },
  ]

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Geographic Performance</h2>
          <p className="text-sm text-muted-foreground">
            Analyze performance across US states and regions
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

      {/* KPI Cards */}
      {totals && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Active States</p>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{totals.states}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <p className="text-xs font-medium text-muted-foreground">Total Spend</p>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(totals.spend)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-500" />
                <p className="text-xs font-medium text-muted-foreground">Avg CPA</p>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrencyDetailed(totals.cpa)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <p className="text-xs font-medium text-muted-foreground">Avg ROAS</p>
              </div>
              <p className="mt-1 text-2xl font-bold tabular-nums">{formatMultiplier(totals.roas)}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* State Heatmap Grid */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">State Performance Heatmap</CardTitle>
              <CardDescription>Color intensity represents relative performance</CardDescription>
            </div>
            <div className="flex gap-1.5">
              {(['conversions', 'cpa', 'spend', 'roas'] as const).map((m) => (
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
                  {m === 'cpa' ? 'CPA' : m === 'roas' ? 'ROAS' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-8 lg:grid-cols-10">
            {heatmapData.map((g) => {
              const locationLabel = getLocationLabel(g.state, g.stateCode)
              const formatValue = () => {
                switch (heatmapMetric) {
                  case 'spend': return formatCurrency(g.value)
                  case 'cpa': return formatCurrencyDetailed(g.value)
                  case 'roas': return formatMultiplier(g.value)
                  case 'conversions': return formatNumber(g.value)
                }
              }
              return (
                <div
                  key={g.id}
                  className="group relative flex flex-col items-center justify-center rounded-md border p-2 transition-all hover:shadow-md"
                  style={{
                    backgroundColor: `hsl(${142 * g.intensity}, ${40 + 30 * g.intensity}%, ${95 - 35 * g.intensity}%)`,
                  }}
                  title={`${g.state}: ${formatValue()}`}
                >
                  <span className="text-xs font-bold">{locationLabel}</span>
                  <span className="text-[10px] tabular-nums">{formatValue()}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Low</span>
            <div className="flex h-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="h-2 w-6"
                  style={{
                    backgroundColor: `hsl(${142 * (i / 4)}, ${40 + 30 * (i / 4)}%, ${95 - 35 * (i / 4)}%)`,
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

      {/* Top / Bottom States */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              Top Performing States
            </CardTitle>
            <CardDescription>Lowest CPA with meaningful conversion volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topStates} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="state"
                    tick={{ fontSize: 11 }}
                    width={72}
                    tickFormatter={(v: string) => getLocationLabel(v, '')}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'cpa') return [formatCurrencyDetailed(value), 'CPA']
                      return [formatNumber(value), 'Conversions']
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cpa" name="CPA" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Bottom Performing States
            </CardTitle>
            <CardDescription>Highest CPA with meaningful spend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bottomStates} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="state"
                    tick={{ fontSize: 11 }}
                    width={72}
                    tickFormatter={(v: string) => getLocationLabel(v, '')}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'cpa') return [formatCurrencyDetailed(value), 'CPA']
                      return [formatNumber(value), 'Conversions']
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="cpa" name="CPA" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CPA vs ROAS Scatter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">CPA vs ROAS by State</CardTitle>
          <CardDescription>Bubble size represents total spend — ideal position is bottom-right</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  type="number"
                  dataKey="cpa"
                  name="CPA"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `$${v}`}
                  label={{ value: 'CPA ($)', position: 'bottom', fontSize: 12 }}
                />
                <YAxis
                  type="number"
                  dataKey="roas"
                  name="ROAS"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v: number) => `${v}x`}
                  label={{ value: 'ROAS', angle: -90, position: 'left', fontSize: 12 }}
                />
                <ZAxis type="number" dataKey="spend" range={[40, 400]} />
                <Tooltip
                  content={({ payload }) => {
                    if (!payload?.length) return null
                    const d = payload[0]!.payload
                    return (
                      <div className="rounded-lg border bg-card p-2 text-xs shadow-md">
                        <p className="font-semibold">
                          {d.state}
                          {isStateLikeCode(d.stateCode) ? ` (${d.stateCode})` : ''}
                        </p>
                        <p>CPA: {formatCurrencyDetailed(d.cpa)}</p>
                        <p>ROAS: {formatMultiplier(d.roas)}</p>
                        <p>Spend: {formatCurrency(d.spend)}</p>
                        <p>Conversions: {d.conversions}</p>
                      </div>
                    )
                  }}
                />
                <Scatter data={scatterData}>
                  {scatterData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.roas >= 3 ? '#10b981' : entry.roas >= 2 ? '#f59e0b' : '#ef4444'} fillOpacity={0.7} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Full State Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">State Performance Table</CardTitle>
          <CardDescription>Complete state-level performance data for the selected period</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={tableColumns}
            data={sortedData}
            searchKey="state"
            searchPlaceholder="Search states..."
            pageSize={15}
          />
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
      <div className="h-80 rounded-lg border bg-card animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
      </div>
    </div>
  )
}
