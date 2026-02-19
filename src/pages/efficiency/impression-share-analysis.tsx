// ============================================================
// Impression Share Analysis Page
// Phase 3: IS waterfall chart, IS trend by product,
// campaign-level IS heatmap, budget/rank constrained campaigns
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useDateRange } from '@/hooks/use-date-range'
import { getCampaignPerformance } from '@/data'
import type { Campaign, Product } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
  LineChart,
  Line,
  Cell,
} from 'recharts'
import { formatPercent, formatCurrency } from '@/lib/utils'
import { Eye, AlertTriangle, TrendingDown, DollarSign } from 'lucide-react'

const PRODUCT_COLORS: Record<Product, string> = {
  'Term Life': '#3b82f6',
  'Disability': '#10b981',
  'Annuities': '#f59e0b',
  'Dental Network': '#8b5cf6',
  'Group Benefits': '#ec4899',
}

const dateRanges = [
  { key: '7d', label: '7D' },
  { key: '14d', label: '14D' },
  { key: '30d', label: '30D' },
  { key: 'custom', label: 'Custom' },
] as const

export function ImpressionShareAnalysis() {
  const { dateRange, setDateRange, filters } = useDateRange()

  const { data: campaigns, loading } = useAsync(
    () => getCampaignPerformance(filters),
    [dateRange, filters.startDate, filters.endDate]
  )

  // Aggregate IS data by campaign (latest date)
  const campaignIS = useMemo(() => {
    if (!campaigns) return []
    const dates = [...new Set(campaigns.map((c) => c.date))].sort()
    const latestDate = dates[dates.length - 1]!
    return campaigns
      .filter((c) => c.date === latestDate && c.status === 'Enabled')
      .sort((a, b) => b.spend - a.spend)
  }, [campaigns])

  // Overall IS waterfall
  const waterfallData = useMemo(() => {
    if (!campaignIS.length) return []
    const totalIS = campaignIS.reduce((sum, c) => sum + c.searchImpressionShare, 0) / campaignIS.length
    const totalLostBudget = campaignIS.reduce((sum, c) => sum + c.lostIsBudget, 0) / campaignIS.length
    const totalLostRank = campaignIS.reduce((sum, c) => sum + c.lostIsRank, 0) / campaignIS.length

    return [
      { name: 'Captured IS', value: Math.round(totalIS * 10) / 10, fill: '#10b981' },
      { name: 'Lost to Budget', value: Math.round(totalLostBudget * 10) / 10, fill: '#f59e0b' },
      { name: 'Lost to Rank', value: Math.round(totalLostRank * 10) / 10, fill: '#ef4444' },
    ]
  }, [campaignIS])

  // IS trend by product over time
  const isTrend = useMemo(() => {
    if (!campaigns) return []
    const dateProductMap = new Map<string, Map<Product, { totalIS: number; count: number }>>()

    for (const c of campaigns) {
      if (c.status !== 'Enabled') continue
      let dateMap = dateProductMap.get(c.date)
      if (!dateMap) {
        dateMap = new Map()
        dateProductMap.set(c.date, dateMap)
      }
      const existing = dateMap.get(c.product)
      if (existing) {
        existing.totalIS += c.searchImpressionShare
        existing.count++
      } else {
        dateMap.set(c.product, { totalIS: c.searchImpressionShare, count: 1 })
      }
    }

    const products: Product[] = ['Term Life', 'Disability', 'Annuities', 'Dental Network', 'Group Benefits']
    return [...dateProductMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, productMap]) => {
        const point: Record<string, string | number> = { date }
        for (const p of products) {
          const data = productMap.get(p)
          point[p] = data ? Math.round((data.totalIS / data.count) * 10) / 10 : 0
        }
        return point
      })
  }, [campaigns])

  // IS by product summary
  const isByProduct = useMemo(() => {
    if (!campaignIS.length) return []
    const productMap = new Map<Product, { is: number; lostBudget: number; lostRank: number; spend: number; count: number }>()
    for (const c of campaignIS) {
      const existing = productMap.get(c.product)
      if (existing) {
        existing.is += c.searchImpressionShare
        existing.lostBudget += c.lostIsBudget
        existing.lostRank += c.lostIsRank
        existing.spend += c.spend
        existing.count++
      } else {
        productMap.set(c.product, {
          is: c.searchImpressionShare,
          lostBudget: c.lostIsBudget,
          lostRank: c.lostIsRank,
          spend: c.spend,
          count: 1,
        })
      }
    }
    return Array.from(productMap.entries()).map(([product, data]) => ({
      product,
      is: Math.round((data.is / data.count) * 10) / 10,
      lostBudget: Math.round((data.lostBudget / data.count) * 10) / 10,
      lostRank: Math.round((data.lostRank / data.count) * 10) / 10,
      spend: data.spend,
    })).sort((a, b) => a.is - b.is)
  }, [campaignIS])

  // Budget-constrained campaigns table
  const budgetConstrained = useMemo(() => {
    return campaignIS
      .filter((c) => c.lostIsBudget > 5)
      .sort((a, b) => b.lostIsBudget - a.lostIsBudget)
  }, [campaignIS])

  // Rank-constrained campaigns table
  const rankConstrained = useMemo(() => {
    return campaignIS
      .filter((c) => c.lostIsRank > 10)
      .sort((a, b) => b.lostIsRank - a.lostIsRank)
  }, [campaignIS])

  const constrainedColumns: ColumnDef<Campaign, unknown>[] = [
    {
      accessorKey: 'campaignName',
      header: 'Campaign',
      cell: ({ row }) => <span className="font-medium">{row.original.campaignName}</span>,
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.product}</Badge>,
    },
    {
      accessorKey: 'searchImpressionShare',
      header: 'Search IS',
      cell: ({ row }) => <MetricCell value={row.original.searchImpressionShare} format="percent" />,
    },
    {
      accessorKey: 'lostIsBudget',
      header: 'Lost IS (Budget)',
      cell: ({ row }) => (
        <span className="text-amber-600 font-medium tabular-nums">{formatPercent(row.original.lostIsBudget)}</span>
      ),
    },
    {
      accessorKey: 'lostIsRank',
      header: 'Lost IS (Rank)',
      cell: ({ row }) => (
        <span className="text-red-600 font-medium tabular-nums">{formatPercent(row.original.lostIsRank)}</span>
      ),
    },
    {
      accessorKey: 'spend',
      header: 'Daily Spend',
      cell: ({ row }) => <MetricCell value={row.original.spend} format="currency" />,
    },
  ]

  if (loading) {
    return <LoadingSkeleton />
  }

  const avgIS = waterfallData.length ? waterfallData[0]!.value : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Impression Share Analysis</h2>
          <p className="text-sm text-muted-foreground">
            Understand where you're winning and losing impression share
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Avg Search IS</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatPercent(avgIS)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Lost to Budget</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-amber-600">
              {waterfallData.length ? formatPercent(waterfallData[1]!.value) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-xs font-medium text-muted-foreground">Lost to Rank</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums text-red-600">
              {waterfallData.length ? formatPercent(waterfallData[2]!.value) : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Budget Constrained</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{budgetConstrained.length}</p>
            <p className="text-xs text-muted-foreground">campaigns losing &gt;5% to budget</p>
          </CardContent>
        </Card>
      </div>

      {/* Waterfall + Product Stacked Bar */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* IS Waterfall */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Impression Share Breakdown</CardTitle>
            <CardDescription>Where your impression share is going</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waterfallData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
                  <Tooltip
                    formatter={(value: number) => [`${value.toFixed(1)}%`, '']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>
                    {waterfallData.map((entry, idx) => (
                      <Cell key={idx} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* IS by Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">IS by Product</CardTitle>
            <CardDescription>Impression share captured vs lost by product</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={isByProduct} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} domain={[0, 100]} tickFormatter={(v: number) => `${v}%`} />
                  <YAxis type="category" dataKey="product" tick={{ fontSize: 11 }} width={110} />
                  <Tooltip
                    formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="is" name="Captured IS" stackId="a" fill="#10b981" />
                  <Bar dataKey="lostBudget" name="Lost (Budget)" stackId="a" fill="#f59e0b" />
                  <Bar dataKey="lostRank" name="Lost (Rank)" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* IS Trend Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Impression Share Trend by Product</CardTitle>
          <CardDescription>Average search IS per product over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={isTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(date: string) => {
                    const d = new Date(date + 'T00:00:00')
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis domain={[30, 100]} tick={{ fontSize: 11 }} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  formatter={(value: number, name: string) => [`${value}%`, name]}
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
                {(Object.keys(PRODUCT_COLORS) as Product[]).map((product) => (
                  <Line
                    key={product}
                    type="monotone"
                    dataKey={product}
                    name={product}
                    stroke={PRODUCT_COLORS[product]}
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

      {/* Budget-Constrained Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Budget-Constrained Campaigns</CardTitle>
          <CardDescription>
            Campaigns losing more than 5% IS due to budget — consider increasing budgets for high-performing campaigns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={constrainedColumns}
            data={budgetConstrained}
            searchKey="campaignName"
            searchPlaceholder="Search campaigns..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Rank-Constrained Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rank-Constrained Campaigns</CardTitle>
          <CardDescription>
            Campaigns losing more than 10% IS due to rank — improve quality score, bids, or ad relevance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={constrainedColumns}
            data={rankConstrained}
            searchKey="campaignName"
            searchPlaceholder="Search campaigns..."
            pageSize={10}
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
        <div className="h-80 rounded-lg border bg-card animate-pulse" />
        <div className="h-80 rounded-lg border bg-card animate-pulse" />
      </div>
    </div>
  )
}
