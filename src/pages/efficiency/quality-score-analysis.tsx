// ============================================================
// Quality Score Analysis Page
// Phase 3: QS distribution histogram, QS trend by product,
// expected CTR / ad relevance / LP experience breakdown,
// weighted QS by spend, and QS improvement opportunities table
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getQualityScoreHistory, getQualityScoreLatest } from '@/data'
import type { QualityScoreSnapshot, Product } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, MetricCell, QualityScoreBadge } from '@/components/tables/data-table'
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
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCurrency, formatCurrencyDetailed } from '@/lib/utils'
import { AlertTriangle, TrendingUp, Award } from 'lucide-react'

const PRODUCT_COLORS: Record<Product, string> = {
  'Term Life': '#3b82f6',
  'Disability': '#10b981',
  'Annuities': '#f59e0b',
  'Dental Network': '#8b5cf6',
  'Group Benefits': '#ec4899',
}

const COMPONENT_COLORS = {
  'Above Average': '#10b981',
  'Average': '#f59e0b',
  'Below Average': '#ef4444',
}

export function QualityScoreAnalysis() {
  const { data: qsHistory, loading: histLoading } = useAsync(() => getQualityScoreHistory())
  const { data: qsLatest, loading: latestLoading } = useAsync(() => getQualityScoreLatest())

  // QS Distribution Histogram (1-10)
  const qsDistribution = useMemo(() => {
    if (!qsLatest) return []
    const buckets = Array.from({ length: 10 }, (_, i) => ({ score: i + 1, count: 0, spend: 0 }))
    for (const qs of qsLatest) {
      const idx = qs.qualityScore - 1
      if (idx >= 0 && idx < 10) {
        buckets[idx]!.count++
        buckets[idx]!.spend += qs.spend
      }
    }
    return buckets
  }, [qsLatest])

  // Spend-weighted average QS
  const weightedQS = useMemo(() => {
    if (!qsLatest) return 0
    let totalSpend = 0
    let weightedSum = 0
    for (const qs of qsLatest) {
      totalSpend += qs.spend
      weightedSum += qs.qualityScore * qs.spend
    }
    return totalSpend > 0 ? Math.round((weightedSum / totalSpend) * 10) / 10 : 0
  }, [qsLatest])

  // QS by product (weighted average)
  const qsByProduct = useMemo(() => {
    if (!qsLatest) return []
    const productMap = new Map<Product, { totalSpend: number; weightedSum: number; count: number }>()
    for (const qs of qsLatest) {
      const existing = productMap.get(qs.product)
      if (existing) {
        existing.totalSpend += qs.spend
        existing.weightedSum += qs.qualityScore * qs.spend
        existing.count++
      } else {
        productMap.set(qs.product, { totalSpend: qs.spend, weightedSum: qs.qualityScore * qs.spend, count: 1 })
      }
    }
    return Array.from(productMap.entries()).map(([product, data]) => ({
      product,
      weightedQS: Math.round((data.weightedSum / data.totalSpend) * 10) / 10,
      keywordCount: data.count,
      totalSpend: data.totalSpend,
    })).sort((a, b) => b.weightedQS - a.weightedQS)
  }, [qsLatest])

  // QS trend over time by product
  const qsTrend = useMemo(() => {
    if (!qsHistory) return []
    const dateProductMap = new Map<string, Map<Product, { totalSpend: number; weightedSum: number }>>()

    for (const qs of qsHistory) {
      let dateMap = dateProductMap.get(qs.date)
      if (!dateMap) {
        dateMap = new Map()
        dateProductMap.set(qs.date, dateMap)
      }
      const existing = dateMap.get(qs.product)
      if (existing) {
        existing.totalSpend += qs.spend
        existing.weightedSum += qs.qualityScore * qs.spend
      } else {
        dateMap.set(qs.product, { totalSpend: qs.spend, weightedSum: qs.qualityScore * qs.spend })
      }
    }

    const products: Product[] = ['Term Life', 'Disability', 'Annuities', 'Dental Network', 'Group Benefits']
    return [...dateProductMap.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, productMap]) => {
        const point: Record<string, string | number> = { date }
        for (const p of products) {
          const data = productMap.get(p)
          point[p] = data ? Math.round((data.weightedSum / data.totalSpend) * 10) / 10 : 0
        }
        return point
      })
  }, [qsHistory])

  // QS component breakdown (pie chart data)
  const componentBreakdown = useMemo(() => {
    if (!qsLatest) return { expectedCtr: [], adRelevance: [], landingPage: [] }

    const count = (field: 'expectedCtr' | 'adRelevance' | 'landingPageExperience') => {
      const counts = { 'Above Average': 0, 'Average': 0, 'Below Average': 0 }
      for (const qs of qsLatest) {
        counts[qs[field]]++
      }
      return Object.entries(counts).map(([name, value]) => ({ name, value }))
    }

    return {
      expectedCtr: count('expectedCtr'),
      adRelevance: count('adRelevance'),
      landingPage: count('landingPageExperience'),
    }
  }, [qsLatest])

  // Improvement opportunities table — keywords with QS <= 6 and significant spend
  const improvementOpportunities = useMemo(() => {
    if (!qsLatest) return []
    return qsLatest
      .filter((qs) => qs.qualityScore <= 6)
      .sort((a, b) => b.spend - a.spend)
  }, [qsLatest])

  const opportunityColumns: ColumnDef<QualityScoreSnapshot, unknown>[] = [
    {
      accessorKey: 'keyword',
      header: 'Keyword',
      cell: ({ row }) => <span className="font-medium">{row.original.keyword}</span>,
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">{row.original.product}</Badge>
      ),
    },
    {
      accessorKey: 'qualityScore',
      header: 'QS',
      cell: ({ row }) => <QualityScoreBadge score={row.original.qualityScore} />,
    },
    {
      accessorKey: 'expectedCtr',
      header: 'Exp. CTR',
      cell: ({ row }) => <ComponentBadge value={row.original.expectedCtr} />,
    },
    {
      accessorKey: 'adRelevance',
      header: 'Ad Relevance',
      cell: ({ row }) => <ComponentBadge value={row.original.adRelevance} />,
    },
    {
      accessorKey: 'landingPageExperience',
      header: 'Landing Page',
      cell: ({ row }) => <ComponentBadge value={row.original.landingPageExperience} />,
    },
    {
      accessorKey: 'spend',
      header: 'Daily Spend',
      cell: ({ row }) => <MetricCell value={row.original.spend} format="currency" />,
    },
  ]

  if (histLoading || latestLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Quality Score Analysis</h2>
        <p className="text-sm text-muted-foreground">
          Analyze quality score distribution, trends, and improvement opportunities
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Weighted Avg QS</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{weightedQS}</p>
            <p className="text-xs text-muted-foreground">Spend-weighted across all keywords</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-muted-foreground">High QS (8-10)</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {qsLatest?.filter((qs) => qs.qualityScore >= 8).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">
              of {qsLatest?.length || 0} keywords
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Low QS (1-4)</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {qsLatest?.filter((qs) => qs.qualityScore <= 4).length || 0}
            </p>
            <p className="text-xs text-muted-foreground">Keywords needing attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <p className="text-xs font-medium text-muted-foreground">Low QS Spend</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">
              {formatCurrency(
                qsLatest?.filter((qs) => qs.qualityScore <= 5).reduce((sum, qs) => sum + qs.spend, 0) || 0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Daily spend on QS ≤ 5</p>
          </CardContent>
        </Card>
      </div>

      {/* QS Distribution + By Product */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* QS Distribution Histogram */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quality Score Distribution</CardTitle>
            <CardDescription>Number of keywords at each QS level</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={qsDistribution}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="score" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === 'count') return [value, 'Keywords']
                      return [formatCurrencyDetailed(value), 'Daily Spend']
                    }}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar
                    dataKey="count"
                    name="count"
                    radius={[4, 4, 0, 0]}
                    fill="#3b82f6"
                  >
                    {qsDistribution.map((entry) => (
                      <Cell
                        key={entry.score}
                        fill={entry.score >= 8 ? '#10b981' : entry.score >= 5 ? '#f59e0b' : '#ef4444'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* QS by Product */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weighted QS by Product</CardTitle>
            <CardDescription>Spend-weighted average quality score per product line</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {qsByProduct.map((item) => (
                <div key={item.product} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: PRODUCT_COLORS[item.product] }}
                      />
                      <span className="font-medium">{item.product}</span>
                    </div>
                    <div className="flex items-center gap-4 text-muted-foreground">
                      <span>{item.keywordCount} keywords</span>
                      <span className="font-semibold text-foreground tabular-nums">{item.weightedQS}</span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${(item.weightedQS / 10) * 100}%`,
                        backgroundColor: item.weightedQS >= 7 ? '#10b981' : item.weightedQS >= 5 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* QS Trend Over Time */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Quality Score Trend by Product</CardTitle>
          <CardDescription>Spend-weighted QS over the past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={qsTrend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(date: string) => {
                    const d = new Date(date + 'T00:00:00')
                    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  }}
                />
                <YAxis domain={[3, 10]} tick={{ fontSize: 11 }} />
                <Tooltip
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

      {/* QS Components Breakdown */}
      <div className="grid gap-6 md:grid-cols-3">
        <ComponentPieCard title="Expected CTR" data={componentBreakdown.expectedCtr} />
        <ComponentPieCard title="Ad Relevance" data={componentBreakdown.adRelevance} />
        <ComponentPieCard title="Landing Page Exp." data={componentBreakdown.landingPage} />
      </div>

      {/* Improvement Opportunities Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">QS Improvement Opportunities</CardTitle>
          <CardDescription>
            Keywords with Quality Score ≤ 6 sorted by daily spend — highest impact improvements first
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={opportunityColumns}
            data={improvementOpportunities}
            searchKey="keyword"
            searchPlaceholder="Search keywords..."
            pageSize={10}
          />
        </CardContent>
      </Card>
    </div>
  )
}

// --- Helper Components ---

function ComponentBadge({ value }: { value: 'Above Average' | 'Average' | 'Below Average' }) {
  const color = COMPONENT_COLORS[value]
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{
        backgroundColor: `${color}15`,
        color,
      }}
    >
      {value === 'Above Average' ? '↑' : value === 'Below Average' ? '↓' : '→'} {value}
    </span>
  )
}

function ComponentPieCard({ title, data }: { title: string; data: { name: string; value: number }[] }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={COMPONENT_COLORS[entry.name as keyof typeof COMPONENT_COLORS]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [value, 'Keywords']}
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
        <div className="mt-2 space-y-1">
          {data.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: COMPONENT_COLORS[entry.name as keyof typeof COMPONENT_COLORS] }}
                />
                <span>{entry.name}</span>
              </div>
              <span className="font-medium tabular-nums">{entry.value}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
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
      <div className="h-96 rounded-lg border bg-card animate-pulse" />
    </div>
  )
}
