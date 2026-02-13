// ============================================================
// Landing Page Performance Page
// Phase 4: Landing page table, top/bottom performers, mobile
// vs desktop conversion rates, page performance analysis
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getLandingPageSummary } from '@/data'
import type { LandingPage } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
} from 'recharts'
import { formatCurrency, formatNumber, formatPercent, formatCurrencyDetailed } from '@/lib/utils'
import {
  Globe,
  TrendingUp,
  TrendingDown,
  Smartphone,
  Monitor,
  ArrowUpDown,
} from 'lucide-react'

export function LandingPagePerformance() {
  const { data: pages, loading } = useAsync(() => getLandingPageSummary())

  // Totals
  const totals = useMemo(() => {
    if (!pages) return { sessions: 0, conversions: 0, value: 0, avgConvRate: 0 }
    const sessions = pages.reduce((s, p) => s + p.sessions, 0)
    const conversions = pages.reduce((s, p) => s + p.conversions, 0)
    const value = pages.reduce((s, p) => s + p.conversionValue, 0)
    const avgConvRate = sessions > 0 ? (conversions / sessions) * 100 : 0
    return { sessions, conversions, value, avgConvRate: Math.round(avgConvRate * 10) / 10 }
  }, [pages])

  // Top 5 and bottom 5 by conversion rate
  const topPages = useMemo(() => {
    if (!pages) return []
    return [...pages].sort((a, b) => b.conversionRate - a.conversionRate).slice(0, 5)
  }, [pages])

  const bottomPages = useMemo(() => {
    if (!pages) return []
    return [...pages].sort((a, b) => a.conversionRate - b.conversionRate).slice(0, 5)
  }, [pages])

  // Mobile vs Desktop comparison data
  const deviceComparisonData = useMemo(() => {
    if (!pages) return []
    return pages.map((p) => ({
      url: p.url.replace('guardian.com/', ''),
      Mobile: p.mobileConvRate,
      Desktop: p.desktopConvRate,
    })).sort((a, b) => b.Desktop - a.Desktop)
  }, [pages])

  const columns: ColumnDef<LandingPage, unknown>[] = [
    {
      accessorKey: 'url',
      header: 'Landing Page',
      cell: ({ row }) => (
        <div className="flex items-center gap-1.5 max-w-[300px]">
          <Globe className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate text-sm font-medium">{row.original.url}</span>
        </div>
      ),
    },
    {
      accessorKey: 'sessions',
      header: 'Sessions',
      cell: ({ row }) => <MetricCell value={row.original.sessions} />,
    },
    {
      accessorKey: 'bounceRate',
      header: 'Bounce Rate',
      cell: ({ row }) => {
        const val = row.original.bounceRate
        return (
          <span className={`tabular-nums ${val > 50 ? 'text-red-600 dark:text-red-400' : val > 40 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatPercent(val)}
          </span>
        )
      },
    },
    {
      accessorKey: 'conversionRate',
      header: 'Conv. Rate',
      cell: ({ row }) => {
        const val = row.original.conversionRate
        return (
          <span className={`font-medium tabular-nums ${val > 6 ? 'text-emerald-600 dark:text-emerald-400' : val > 3 ? 'text-foreground' : 'text-red-600 dark:text-red-400'}`}>
            {formatPercent(val)}
          </span>
        )
      },
    },
    {
      accessorKey: 'conversions',
      header: 'Conversions',
      cell: ({ row }) => <MetricCell value={row.original.conversions} />,
    },
    {
      accessorKey: 'conversionValue',
      header: 'Conv. Value',
      cell: ({ row }) => <MetricCell value={row.original.conversionValue} format="currency" />,
    },
    {
      accessorKey: 'mobileConvRate',
      header: 'Mobile CVR',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Smartphone className="h-3 w-3 text-muted-foreground" />
          <span className="tabular-nums">{formatPercent(row.original.mobileConvRate)}</span>
        </div>
      ),
    },
    {
      accessorKey: 'desktopConvRate',
      header: 'Desktop CVR',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Monitor className="h-3 w-3 text-muted-foreground" />
          <span className="tabular-nums">{formatPercent(row.original.desktopConvRate)}</span>
        </div>
      ),
    },
  ]

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Landing Page Performance</h2>
        <p className="text-sm text-muted-foreground">
          Landing page analysis with conversion rates, bounce rates, and device breakdowns
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Total Sessions</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(totals.sessions)}</p>
            <p className="text-xs text-muted-foreground">Across {pages?.length || 0} pages (30d)</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-muted-foreground">Avg Conv. Rate</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatPercent(totals.avgConvRate)}</p>
            <p className="text-xs text-muted-foreground">Overall page average</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium text-muted-foreground">Total Conversions</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(totals.conversions)}</p>
            <p className="text-xs text-muted-foreground">All landing pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Total Value</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(totals.value)}</p>
            <p className="text-xs text-muted-foreground">Conversion value generated</p>
          </CardContent>
        </Card>
      </div>

      {/* Top & Bottom Performers */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <CardTitle className="text-base">Top Performing Pages</CardTitle>
            </div>
            <CardDescription>Highest conversion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topPages.map((page, i) => (
                <div key={page.url} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-950 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{page.url}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatNumber(page.sessions)} sessions</span>
                      <span>{formatNumber(page.conversions)} conv.</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-950">
                    {formatPercent(page.conversionRate)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <CardTitle className="text-base">Pages Needing Improvement</CardTitle>
            </div>
            <CardDescription>Lowest conversion rates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bottomPages.map((page, i) => (
                <div key={page.url} className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-50 dark:bg-red-950 text-xs font-bold text-red-700 dark:text-red-300">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium">{page.url}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatNumber(page.sessions)} sessions</span>
                      <span>Bounce: {formatPercent(page.bounceRate)}</span>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {formatPercent(page.conversionRate)}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile vs Desktop Conv Rate Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Mobile vs Desktop Conversion Rates</CardTitle>
          <CardDescription>Conversion rate comparison by device type per landing page</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deviceComparisonData} layout="vertical" margin={{ left: 30, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} unit="%" />
                <YAxis
                  type="category"
                  dataKey="url"
                  tick={{ fontSize: 10 }}
                  width={180}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                />
                <Legend />
                <Bar dataKey="Desktop" name="Desktop" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={10} />
                <Bar dataKey="Mobile" name="Mobile" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Full Landing Page Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">All Landing Pages</CardTitle>
          <CardDescription>
            Complete landing page performance data aggregated over the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={pages || []}
            searchKey="url"
            searchPlaceholder="Search landing pages..."
            pageSize={12}
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
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
        <div className="h-72 rounded-lg border bg-card animate-pulse" />
      </div>
      <div className="h-96 rounded-lg border bg-card animate-pulse" />
    </div>
  )
}
