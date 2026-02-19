// ============================================================
// Wasted Spend Analyzer Page
// Phase 3: Zero-conversion keywords, irrelevant search terms,
// negative keyword gaps, estimated savings, poor QS keyword costs
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useDateRange } from '@/hooks/use-date-range'
import { getKeywordPerformance, getSearchTermReport, getQualityScoreLatest } from '@/data'
import type { Keyword, SearchTerm, QualityScoreSnapshot } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, MetricCell } from '@/components/tables/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { formatCurrency, formatCurrencyDetailed, formatNumber } from '@/lib/utils'
import { Trash2, AlertTriangle, DollarSign, TrendingDown, Ban } from 'lucide-react'

export function WastedSpendAnalyzer() {
  const { dateRange, setDateRange, filters } = useDateRange()

  const { data: keywords, loading: kwLoading } = useAsync(
    () => getKeywordPerformance(filters),
    [dateRange]
  )
  const { data: searchTerms, loading: stLoading } = useAsync(
    () => getSearchTermReport(filters),
    [dateRange]
  )
  const { data: qsLatest, loading: qsLoading } = useAsync(
    () => getQualityScoreLatest(),
    []
  )

  // Aggregate keywords across dates
  const aggregatedKeywords = useMemo(() => {
    if (!keywords) return []
    const kwMap = new Map<string, Keyword & { _count: number }>()
    for (const kw of keywords) {
      const existing = kwMap.get(kw.keyword)
      if (existing) {
        existing.spend += kw.spend
        existing.impressions += kw.impressions
        existing.clicks += kw.clicks
        existing.conversions += kw.conversions
        existing.conversionValue += kw.conversionValue
        existing._count++
      } else {
        kwMap.set(kw.keyword, { ...kw, _count: 1 })
      }
    }
    return Array.from(kwMap.values()).map((kw) => ({
      ...kw,
      cpa: kw.conversions > 0 ? kw.spend / kw.conversions : 0,
      ctr: kw.impressions > 0 ? (kw.clicks / kw.impressions) * 100 : 0,
      cpc: kw.clicks > 0 ? kw.spend / kw.clicks : 0,
    }))
  }, [keywords])

  // Zero-conversion keywords with significant spend
  const zeroConvKeywords = useMemo(() => {
    return aggregatedKeywords
      .filter((kw) => kw.conversions === 0 && kw.spend > 50)
      .sort((a, b) => b.spend - a.spend)
  }, [aggregatedKeywords])

  // Aggregate search terms
  const aggregatedSearchTerms = useMemo(() => {
    if (!searchTerms) return []
    const stMap = new Map<string, SearchTerm & { _count: number }>()
    for (const st of searchTerms) {
      const existing = stMap.get(st.searchTerm)
      if (existing) {
        existing.spend += st.spend
        existing.impressions += st.impressions
        existing.clicks += st.clicks
        existing.conversions += st.conversions
        existing.conversionValue += st.conversionValue
        existing._count++
      } else {
        stMap.set(st.searchTerm, { ...st, _count: 1 })
      }
    }
    return Array.from(stMap.values()).map((st) => ({
      ...st,
      cpa: st.conversions > 0 ? st.spend / st.conversions : 0,
      ctr: st.impressions > 0 ? (st.clicks / st.impressions) * 100 : 0,
    }))
  }, [searchTerms])

  // Loser search terms (negative keyword candidates)
  const negativeKeywordCandidates = useMemo(() => {
    return aggregatedSearchTerms
      .filter((st) => st.label === 'Loser' && st.spend > 30)
      .sort((a, b) => b.spend - a.spend)
  }, [aggregatedSearchTerms])

  // Poor QS keyword costs
  const poorQSCost = useMemo(() => {
    if (!qsLatest) return { totalDailySpend: 0, keywords: [] }
    const poor = qsLatest
      .filter((qs) => qs.qualityScore <= 4)
      .sort((a, b) => b.spend - a.spend)
    return {
      totalDailySpend: poor.reduce((sum, qs) => sum + qs.spend, 0),
      keywords: poor,
    }
  }, [qsLatest])

  // Estimated savings summary
  const estimatedSavings = useMemo(() => {
    const zeroConvSavings = zeroConvKeywords.reduce((sum, kw) => sum + kw.spend, 0)
    const loserTermSavings = negativeKeywordCandidates.reduce((sum, st) => sum + st.spend * 0.7, 0) // assume 70% recoverable
    const poorQSSavings = poorQSCost.totalDailySpend * 30 * 0.2 // 20% of monthly poor-QS spend
    const total = zeroConvSavings + loserTermSavings + poorQSSavings
    return [
      { name: 'Zero-Conv Keywords', value: Math.round(zeroConvSavings), fill: '#ef4444' },
      { name: 'Negative KW Gaps', value: Math.round(loserTermSavings), fill: '#f59e0b' },
      { name: 'Poor QS Premium', value: Math.round(poorQSSavings), fill: '#8b5cf6' },
    ]
  }, [zeroConvKeywords, negativeKeywordCandidates, poorQSCost])

  const totalSavings = estimatedSavings.reduce((sum, s) => sum + s.value, 0)

  // Table columns
  const zeroConvColumns: ColumnDef<typeof zeroConvKeywords[0], unknown>[] = [
    {
      accessorKey: 'keyword',
      header: 'Keyword',
      cell: ({ row }) => <span className="font-medium">{row.original.keyword}</span>,
    },
    {
      accessorKey: 'campaignName',
      header: 'Campaign',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.campaignName}</span>,
    },
    {
      accessorKey: 'matchType',
      header: 'Match',
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.matchType}</Badge>,
    },
    {
      accessorKey: 'spend',
      header: 'Total Spend',
      cell: ({ row }) => (
        <span className="font-medium text-red-600 dark:text-red-400 tabular-nums">{formatCurrencyDetailed(row.original.spend)}</span>
      ),
    },
    {
      accessorKey: 'clicks',
      header: 'Clicks',
      cell: ({ row }) => <MetricCell value={row.original.clicks} />,
    },
    {
      accessorKey: 'impressions',
      header: 'Impressions',
      cell: ({ row }) => <MetricCell value={row.original.impressions} />,
    },
    {
      accessorKey: 'ctr',
      header: 'CTR',
      cell: ({ row }) => <MetricCell value={row.original.ctr} format="percent" />,
    },
  ]

  const negKwColumns: ColumnDef<typeof negativeKeywordCandidates[0], unknown>[] = [
    {
      accessorKey: 'searchTerm',
      header: 'Search Term',
      cell: ({ row }) => <span className="font-medium">{row.original.searchTerm}</span>,
    },
    {
      accessorKey: 'campaignName',
      header: 'Campaign',
      cell: ({ row }) => <span className="text-muted-foreground text-xs">{row.original.campaignName}</span>,
    },
    {
      accessorKey: 'spend',
      header: 'Total Spend',
      cell: ({ row }) => (
        <span className="font-medium text-amber-600 dark:text-amber-400 tabular-nums">{formatCurrencyDetailed(row.original.spend)}</span>
      ),
    },
    {
      accessorKey: 'clicks',
      header: 'Clicks',
      cell: ({ row }) => <MetricCell value={row.original.clicks} />,
    },
    {
      accessorKey: 'conversions',
      header: 'Conversions',
      cell: ({ row }) => <span className="tabular-nums">{row.original.conversions}</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Issue',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.reason || 'High cost, low conversion'}</span>
      ),
    },
  ]

  const poorQSColumns: ColumnDef<QualityScoreSnapshot, unknown>[] = [
    {
      accessorKey: 'keyword',
      header: 'Keyword',
      cell: ({ row }) => <span className="font-medium">{row.original.keyword}</span>,
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.product}</Badge>,
    },
    {
      accessorKey: 'qualityScore',
      header: 'QS',
      cell: ({ row }) => (
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-red-100 dark:bg-red-950 text-xs font-bold text-red-800 dark:text-red-300">
          {row.original.qualityScore}
        </span>
      ),
    },
    {
      accessorKey: 'spend',
      header: 'Daily Spend',
      cell: ({ row }) => <MetricCell value={row.original.spend} format="currency" />,
    },
    {
      accessorKey: 'expectedCtr',
      header: 'Exp. CTR',
      cell: ({ row }) => <ComponentTag value={row.original.expectedCtr} />,
    },
    {
      accessorKey: 'adRelevance',
      header: 'Ad Relevance',
      cell: ({ row }) => <ComponentTag value={row.original.adRelevance} />,
    },
    {
      accessorKey: 'landingPageExperience',
      header: 'Landing Page',
      cell: ({ row }) => <ComponentTag value={row.original.landingPageExperience} />,
    },
  ]

  if (kwLoading || stLoading || qsLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Wasted Spend Analyzer</h2>
          <p className="text-sm text-muted-foreground">
            Identify and recover wasted ad spend across your campaigns
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
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50">
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-red-600 dark:text-red-400" />
              <p className="text-xs font-medium text-red-700 dark:text-red-300">Est. Monthly Savings</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-red-700 dark:text-red-300">
              {formatCurrency(totalSavings)}
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">Potential recoverable spend</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <p className="text-xs font-medium text-muted-foreground">Zero-Conv Keywords</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{zeroConvKeywords.length}</p>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(zeroConvKeywords.reduce((s, k) => s + k.spend, 0))} wasted
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Ban className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Neg KW Gaps</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{negativeKeywordCandidates.length}</p>
            <p className="text-xs text-muted-foreground">Loser terms to add as negatives</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-purple-500" />
              <p className="text-xs font-medium text-muted-foreground">Poor QS Daily Cost</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(poorQSCost.totalDailySpend)}
            </p>
            <p className="text-xs text-muted-foreground">Spend on QS ≤ 4 keywords</p>
          </CardContent>
        </Card>
      </div>

      {/* Savings Breakdown */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estimated Monthly Savings Breakdown</CardTitle>
            <CardDescription>Sources of recoverable ad spend</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estimatedSavings}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                  >
                    {estimatedSavings.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatCurrency(value), '']}
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

        {/* Top Zero-Conv Keywords by Spend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Wasteful Keywords</CardTitle>
            <CardDescription>Highest-spending keywords with zero conversions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zeroConvKeywords.slice(0, 6)}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis
                    type="category"
                    dataKey="keyword"
                    tick={{ fontSize: 10 }}
                    width={140}
                    tickFormatter={(v: string) => v.length > 22 ? v.substring(0, 22) + '...' : v}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatCurrencyDetailed(value), 'Spend']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="spend" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Zero-Conversion Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zero-Conversion Keywords</CardTitle>
          <CardDescription>
            Keywords spending money but generating no conversions — consider pausing or restructuring
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={zeroConvColumns}
            data={zeroConvKeywords}
            searchKey="keyword"
            searchPlaceholder="Search keywords..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Negative Keyword Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Negative Keyword Opportunities</CardTitle>
          <CardDescription>
            Search terms classified as "Losers" — add as negative keywords to prevent future waste
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={negKwColumns}
            data={negativeKeywordCandidates}
            searchKey="searchTerm"
            searchPlaceholder="Search terms..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Poor Quality Score Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Poor Quality Score Costs</CardTitle>
          <CardDescription>
            Keywords with QS ≤ 4 are paying a premium due to low ad rank — estimated 20% overspend
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={poorQSColumns}
            data={poorQSCost.keywords}
            searchKey="keyword"
            searchPlaceholder="Search keywords..."
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function ComponentTag({ value }: { value: string }) {
  const colors = {
    'Above Average': 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300',
    'Average': 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300',
    'Below Average': 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${colors[value as keyof typeof colors] || ''}`}>
      {value}
    </span>
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
