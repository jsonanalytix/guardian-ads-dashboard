// ============================================================
// Performance Overview Page
// Multi-metric time series chart with date range selector,
// period comparison, and metric summary row with % changes
// ============================================================

import { useState, useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getPerformanceTimeSeries, getCampaignPerformance } from '@/data'
import type { Filters, MultiSeriesPoint } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { formatCurrency, formatNumber, formatPercent, formatMultiplier } from '@/lib/utils'
import {
  DollarSign,
  MousePointerClick,
  Eye,
  TrendingUp,
  Target,
  BarChart3,
} from 'lucide-react'

type MetricKey = 'spend' | 'conversions' | 'cpa' | 'roas' | 'clicks' | 'impressions' | 'ctr'

interface MetricOption {
  key: MetricKey
  label: string
  icon: React.ElementType
  color: string
  format: (v: number) => string
}

const metricOptions: MetricOption[] = [
  { key: 'spend', label: 'Spend', icon: DollarSign, color: '#3b82f6', format: formatCurrency },
  { key: 'conversions', label: 'Conversions', icon: Target, color: '#10b981', format: (v) => formatNumber(Math.round(v)) },
  { key: 'cpa', label: 'CPA', icon: TrendingUp, color: '#f59e0b', format: (v) => `$${v.toFixed(2)}` },
  { key: 'roas', label: 'ROAS', icon: BarChart3, color: '#8b5cf6', format: formatMultiplier },
  { key: 'clicks', label: 'Clicks', icon: MousePointerClick, color: '#ec4899', format: (v) => formatNumber(Math.round(v)) },
  { key: 'impressions', label: 'Impressions', icon: Eye, color: '#06b6d4', format: (v) => formatNumber(Math.round(v)) },
  { key: 'ctr', label: 'CTR', icon: BarChart3, color: '#14b8a6', format: formatPercent },
]

const dateRanges = [
  { key: '7d', label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
] as const

export function PerformanceOverview() {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('spend')
  const [dateRange, setDateRange] = useState<'7d' | '14d' | '30d'>('30d')

  const filters: Filters = { dateRange }

  const { data: timeSeries, loading: tsLoading } = useAsync(
    () => getPerformanceTimeSeries(selectedMetric, filters),
    [selectedMetric, dateRange]
  )

  const { data: campaigns, loading: campLoading } = useAsync(
    () => getCampaignPerformance(filters),
    [dateRange]
  )

  // Calculate summary metrics for the selected period
  const summaryMetrics = useMemo(() => {
    if (!campaigns) return null

    const totals = campaigns.reduce(
      (acc, c) => ({
        spend: acc.spend + c.spend,
        impressions: acc.impressions + c.impressions,
        clicks: acc.clicks + c.clicks,
        conversions: acc.conversions + c.conversions,
        conversionValue: acc.conversionValue + c.conversionValue,
      }),
      { spend: 0, impressions: 0, clicks: 0, conversions: 0, conversionValue: 0 }
    )

    return {
      spend: totals.spend,
      impressions: totals.impressions,
      clicks: totals.clicks,
      conversions: totals.conversions,
      cpa: totals.conversions > 0 ? totals.spend / totals.conversions : 0,
      roas: totals.spend > 0 ? totals.conversionValue / totals.spend : 0,
      ctr: totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0,
      cpc: totals.clicks > 0 ? totals.spend / totals.clicks : 0,
    }
  }, [campaigns])

  const metricConfig = metricOptions.find((m) => m.key === selectedMetric)!

  if (tsLoading || campLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Performance Overview</h2>
          <p className="text-sm text-muted-foreground">Aggregated metrics across all campaigns</p>
        </div>
        <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as typeof dateRange)}>
          <TabsList>
            {dateRanges.map((r) => (
              <TabsTrigger key={r.key} value={r.key}>{r.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Metric Summary Cards */}
      {summaryMetrics && (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <SummaryCard label="Total Spend" value={formatCurrency(summaryMetrics.spend)} />
          <SummaryCard label="Conversions" value={formatNumber(summaryMetrics.conversions)} />
          <SummaryCard label="Avg CPA" value={`$${summaryMetrics.cpa.toFixed(2)}`} />
          <SummaryCard label="ROAS" value={formatMultiplier(summaryMetrics.roas)} />
          <SummaryCard label="Clicks" value={formatNumber(summaryMetrics.clicks)} />
          <SummaryCard label="Impressions" value={formatNumber(summaryMetrics.impressions)} />
          <SummaryCard label="CTR" value={formatPercent(summaryMetrics.ctr)} />
          <SummaryCard label="Avg CPC" value={`$${summaryMetrics.cpc.toFixed(2)}`} />
        </div>
      )}

      {/* Metric Toggle + Chart */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-medium">
              {metricConfig.label} Trend
            </CardTitle>
            <div className="flex flex-wrap gap-1.5">
              {metricOptions.map((m) => (
                <button
                  key={m.key}
                  onClick={() => setSelectedMetric(m.key)}
                  className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedMetric === m.key
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  <m.icon className="h-3 w-3" />
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeSeries ?? []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(date: string) => {
                    const d = new Date(date + 'T00:00:00')
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                  className="text-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  tickFormatter={(value: number) => metricConfig.format(value)}
                  className="text-muted-foreground"
                  width={80}
                />
                <Tooltip
                  formatter={(value: number) => [metricConfig.format(value), metricConfig.label]}
                  labelFormatter={(date: string) => {
                    const d = new Date(date + 'T00:00:00')
                    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                  }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="value"
                  name={metricConfig.label}
                  stroke={metricConfig.color}
                  strokeWidth={2}
                  fill="url(#colorMetric)"
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-1 text-xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
      <div className="h-96 rounded-lg border bg-card animate-pulse" />
    </div>
  )
}
