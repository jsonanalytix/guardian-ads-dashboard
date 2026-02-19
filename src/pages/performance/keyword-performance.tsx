// ============================================================
// Keyword Performance Page
// Keyword table with Quality Score distribution chart,
// top/bottom performers highlighting, and bid recommendations
// 2026-02-19: Wired keyword summary fetch to global date-range filters.
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useDateRange } from '@/hooks/use-date-range'
import { getKeywordSummaryByDate } from '@/data'
import type { Keyword } from '@/data/types'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, MetricCell, QualityScoreBadge } from '@/components/tables/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts'

const QS_COLORS: Record<string, string> = {
  'Above Average': '#10b981',
  'Average': '#f59e0b',
  'Below Average': '#ef4444',
}

export function KeywordPerformance() {
  const { dateRange, filters: dateFilters } = useDateRange()
  const { data: keywords, loading } = useAsync(
    () => getKeywordSummaryByDate(dateFilters),
    [dateRange, dateFilters.startDate, dateFilters.endDate]
  )

  // Quality Score distribution
  const qsDistribution = useMemo(() => {
    if (!keywords) return []
    const counts: Record<number, number> = {}
    for (let i = 1; i <= 10; i++) counts[i] = 0

    for (const kw of keywords) {
      if (kw.qualityScore != null) {
        counts[kw.qualityScore] = (counts[kw.qualityScore] || 0) + 1
      }
    }

    return Object.entries(counts).map(([score, count]) => ({
      score: Number(score),
      count,
      fill: Number(score) >= 8 ? '#10b981' : Number(score) >= 5 ? '#f59e0b' : '#ef4444',
    }))
  }, [keywords])

  // QS component breakdown
  const qsComponents = useMemo(() => {
    if (!keywords) return { expectedCtr: {}, adRelevance: {}, landingPage: {} }

    const count = (field: 'expectedCtr' | 'adRelevance' | 'landingPageExperience') => {
      const acc: Record<string, number> = { 'Above Average': 0, 'Average': 0, 'Below Average': 0 }
      for (const kw of keywords) {
        const val = kw[field]
        if (val) acc[val] = (acc[val] || 0) + 1
      }
      return Object.entries(acc).map(([name, value]) => ({ name, value, fill: QS_COLORS[name] }))
    }

    return {
      expectedCtr: count('expectedCtr'),
      adRelevance: count('adRelevance'),
      landingPage: count('landingPageExperience'),
    }
  }, [keywords])

  // Weighted average QS
  const weightedQs = useMemo(() => {
    if (!keywords) return 0
    let totalSpend = 0
    let weightedSum = 0
    for (const kw of keywords) {
      if (kw.qualityScore != null) {
        weightedSum += kw.qualityScore * kw.spend
        totalSpend += kw.spend
      }
    }
    return totalSpend > 0 ? Math.round((weightedSum / totalSpend) * 10) / 10 : 0
  }, [keywords])

  const columns: ColumnDef<Keyword>[] = [
    {
      accessorKey: 'keyword',
      header: 'Keyword',
      cell: ({ row }) => (
        <div className="max-w-[220px]">
          <p className="font-medium truncate">{row.original.keyword}</p>
          <p className="text-xs text-muted-foreground">{row.original.campaignName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'matchType',
      header: 'Match',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">{row.original.matchType}</Badge>
      ),
    },
    {
      accessorKey: 'qualityScore',
      header: 'QS',
      cell: ({ row }) => <QualityScoreBadge score={row.original.qualityScore} />,
    },
    {
      accessorKey: 'spend',
      header: 'Spend',
      cell: ({ row }) => <MetricCell value={row.original.spend} format="currency" />,
    },
    {
      accessorKey: 'impressions',
      header: 'Impr',
      cell: ({ row }) => <MetricCell value={row.original.impressions} />,
    },
    {
      accessorKey: 'clicks',
      header: 'Clicks',
      cell: ({ row }) => <MetricCell value={row.original.clicks} />,
    },
    {
      accessorKey: 'ctr',
      header: 'CTR',
      cell: ({ row }) => <MetricCell value={row.original.ctr} format="percent" />,
    },
    {
      accessorKey: 'cpc',
      header: 'CPC',
      cell: ({ row }) => <MetricCell value={row.original.cpc} format="currency" />,
    },
    {
      accessorKey: 'conversions',
      header: 'Conv',
      cell: ({ row }) => <MetricCell value={row.original.conversions} />,
    },
    {
      accessorKey: 'cpa',
      header: 'CPA',
      cell: ({ row }) => <MetricCell value={row.original.cpa} format="currency" />,
    },
    {
      accessorKey: 'expectedCtr',
      header: 'Exp. CTR',
      cell: ({ row }) => <ComponentBadge value={row.original.expectedCtr} />,
    },
    {
      accessorKey: 'adRelevance',
      header: 'Ad Rel.',
      cell: ({ row }) => <ComponentBadge value={row.original.adRelevance} />,
    },
    {
      accessorKey: 'landingPageExperience',
      header: 'LP Exp.',
      cell: ({ row }) => <ComponentBadge value={row.original.landingPageExperience} />,
    },
  ]

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Keyword Performance</h2>
        <p className="text-sm text-muted-foreground">Latest day keyword metrics and Quality Score analysis</p>
      </div>

      {/* QS Summary Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground">Spend-Weighted QS</p>
            <p className="mt-1 text-3xl font-bold tabular-nums">{weightedQs}</p>
            <p className="text-xs text-muted-foreground">across {keywords?.length ?? 0} keywords</p>
          </CardContent>
        </Card>

        {/* QS Distribution Chart */}
        <Card className="md:col-span-1 lg:col-span-3">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quality Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qsDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="score" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {qsDistribution.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QS Components Breakdown */}
      <div className="grid gap-4 md:grid-cols-3">
        <QSComponentCard title="Expected CTR" data={qsComponents.expectedCtr as {name: string; value: number; fill: string}[]} />
        <QSComponentCard title="Ad Relevance" data={qsComponents.adRelevance as {name: string; value: number; fill: string}[]} />
        <QSComponentCard title="Landing Page Exp." data={qsComponents.landingPage as {name: string; value: number; fill: string}[]} />
      </div>

      {/* Keyword Table */}
      <DataTable
        columns={columns}
        data={keywords ?? []}
        searchKey="keyword"
        searchPlaceholder="Search keywords..."
        pageSize={20}
      />
    </div>
  )
}

function ComponentBadge({ value }: { value: string | null }) {
  if (!value) return <span className="text-muted-foreground text-xs">—</span>
  const color = QS_COLORS[value] ?? '#6b7280'
  return (
    <span
      className="text-xs font-medium whitespace-nowrap"
      style={{ color }}
    >
      {value}
    </span>
  )
}

function QSComponentCard({ title, data }: { title: string; data: { name: string; value: number; fill: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="h-24 w-24 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                  innerRadius={25}
                  outerRadius={40}
                  strokeWidth={0}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.fill} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5">
            {data.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-xs">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                <span className="text-muted-foreground">{d.name}</span>
                <span className="font-medium">
                  {total > 0 ? Math.round((d.value / total) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
      <div className="h-96 rounded-lg border bg-card animate-pulse" />
    </div>
  )
}
