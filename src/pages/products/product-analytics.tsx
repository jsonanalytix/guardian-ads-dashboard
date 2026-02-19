// ============================================================
// Product Analytics Page
// Phase 4: Product-level KPI cards, product comparison chart,
// product trend lines, campaign drill-down, and strength indicators
// 2026-02-19: Budget cards now refresh after in-app monthly budget edits.
// ============================================================

import { useMemo, useState } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useBudgetRefreshToken } from '@/hooks/use-budget-refresh'
import { getProductSummary, getBudgetPacing, getCampaignPerformance, getProductTimeSeries } from '@/data'
import type { ProductSummary, BudgetPacing, Campaign, Product } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts'
import {
  formatCurrency,
  formatPercent,
  formatMultiplier,
  formatNumber,
  formatCurrencyDetailed,
} from '@/lib/utils'
import {
  Package,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
} from 'lucide-react'

const PRODUCT_COLORS: Record<Product, string> = {
  'Term Life': '#3b82f6',
  'Disability': '#10b981',
  'Annuities': '#f59e0b',
  'Dental Network': '#8b5cf6',
  'Group Benefits': '#ec4899',
}

const STRENGTH_CONFIG = {
  strong: { icon: ShieldCheck, label: 'Strong', color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' },
  opportunity: { icon: ShieldQuestion, label: 'Opportunity', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' },
  risk: { icon: ShieldAlert, label: 'At Risk', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' },
}

export function ProductAnalytics() {
  const budgetRefreshToken = useBudgetRefreshToken()
  const { data: products, loading: prodLoading } = useAsync(() => getProductSummary())
  const { data: budgets, loading: budgetLoading } = useAsync(
    () => getBudgetPacing(),
    [budgetRefreshToken]
  )
  const { data: campaigns, loading: campLoading } = useAsync(() => getCampaignPerformance())

  const [trendMetric, setTrendMetric] = useState<'spend' | 'conversions' | 'cpa' | 'roas'>('conversions')
  const { data: trendData, loading: trendLoading } = useAsync(
    () => getProductTimeSeries(trendMetric),
    [trendMetric]
  )

  // Budget map for product cards
  const budgetMap = useMemo(() => {
    if (!budgets) return new Map<Product, BudgetPacing>()
    return new Map(budgets.map((b) => [b.product, b]))
  }, [budgets])

  // Campaign drill-down grouped by product
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  const productCampaigns = useMemo(() => {
    if (!campaigns || !selectedProduct) return []
    // Get latest date data per campaign
    const dateMap = new Map<string, Campaign>()
    for (const c of campaigns) {
      if (c.product !== selectedProduct) continue
      const existing = dateMap.get(c.campaignName)
      if (!existing || c.date > existing.date) {
        dateMap.set(c.campaignName, c)
      }
    }
    return Array.from(dateMap.values())
  }, [campaigns, selectedProduct])

  // Radar chart data for product comparison (normalized 0-100)
  const radarData = useMemo(() => {
    if (!products) return []
    const maxSpend = Math.max(...products.map((p) => p.spend))
    const maxConv = Math.max(...products.map((p) => p.conversions))
    const maxROAS = Math.max(...products.map((p) => p.roas))
    const maxIS = Math.max(...products.map((p) => p.impressionShare))
    // Invert CPA (lower is better): use minCPA as 100
    const minCPA = Math.min(...products.map((p) => p.cpa))

    const metrics = ['Spend Volume', 'Conversions', 'ROAS', 'Impression Share', 'CPA Efficiency']
    return metrics.map((metric) => {
      const point: Record<string, string | number> = { metric }
      for (const p of products) {
        switch (metric) {
          case 'Spend Volume': point[p.product] = Math.round((p.spend / maxSpend) * 100); break
          case 'Conversions': point[p.product] = Math.round((p.conversions / maxConv) * 100); break
          case 'ROAS': point[p.product] = Math.round((p.roas / maxROAS) * 100); break
          case 'Impression Share': point[p.product] = Math.round((p.impressionShare / maxIS) * 100); break
          case 'CPA Efficiency': point[p.product] = Math.round((minCPA / p.cpa) * 100); break
        }
      }
      return point
    })
  }, [products])

  // Bar chart comparison data
  const comparisonData = useMemo(() => {
    if (!products) return []
    return products.map((p) => ({
      product: p.product.replace(' ', '\n'),
      productFull: p.product,
      spend: p.spend,
      conversions: p.conversions,
      cpa: p.cpa,
      roas: p.roas,
    }))
  }, [products])

  const campaignColumns: ColumnDef<Campaign, unknown>[] = [
    {
      accessorKey: 'campaignName',
      header: 'Campaign',
      cell: ({ row }) => <span className="font-medium">{row.original.campaignName}</span>,
    },
    {
      accessorKey: 'intentBucket',
      header: 'Intent',
      cell: ({ row }) => <Badge variant="outline" className="text-xs">{row.original.intentBucket}</Badge>,
    },
    {
      accessorKey: 'spend',
      header: 'Spend',
      cell: ({ row }) => <MetricCell value={row.original.spend} format="currency" />,
    },
    {
      accessorKey: 'conversions',
      header: 'Conv.',
      cell: ({ row }) => <MetricCell value={row.original.conversions} />,
    },
    {
      accessorKey: 'cpa',
      header: 'CPA',
      cell: ({ row }) => <MetricCell value={row.original.cpa} format="currency" />,
    },
    {
      accessorKey: 'roas',
      header: 'ROAS',
      cell: ({ row }) => <MetricCell value={row.original.roas} format="multiplier" />,
    },
    {
      accessorKey: 'ctr',
      header: 'CTR',
      cell: ({ row }) => <MetricCell value={row.original.ctr} format="percent" />,
    },
    {
      accessorKey: 'searchImpressionShare',
      header: 'Search IS',
      cell: ({ row }) => <MetricCell value={row.original.searchImpressionShare} format="percent" />,
    },
  ]

  if (prodLoading || budgetLoading || campLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Product Analytics</h2>
        <p className="text-sm text-muted-foreground">
          Per-product performance metrics, comparisons, and campaign drill-down
        </p>
      </div>

      {/* Product KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {products?.map((product) => {
          const budget = budgetMap.get(product.product)
          const strengthCfg = STRENGTH_CONFIG[product.strength]
          const StrengthIcon = strengthCfg.icon
          const isSelected = selectedProduct === product.product

          return (
            <Card
              key={product.product}
              className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedProduct(isSelected ? null : product.product)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: PRODUCT_COLORS[product.product] }}
                    />
                    <span className="text-sm font-semibold">{product.product}</span>
                  </div>
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${strengthCfg.bg} ${strengthCfg.color}`}>
                    <StrengthIcon className="h-3 w-3" />
                    {strengthCfg.label}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground">Spend (30d)</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrency(product.spend)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">Conversions</p>
                    <p className="text-sm font-bold tabular-nums">{formatNumber(product.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">CPA</p>
                    <p className="text-sm font-bold tabular-nums">{formatCurrencyDetailed(product.cpa)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground">ROAS</p>
                    <p className="text-sm font-bold tabular-nums">{formatMultiplier(product.roas)}</p>
                  </div>
                </div>

                {/* Budget pacing mini bar */}
                {budget && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                      <span>Budget Pacing</span>
                      <span className="font-medium tabular-nums">{budget.pacingPercent}%</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{
                          width: `${Math.min(budget.pacingPercent, 100)}%`,
                          backgroundColor:
                            budget.pacingPercent >= 95 && budget.pacingPercent <= 105
                              ? '#10b981'
                              : budget.pacingPercent > 105
                              ? '#ef4444'
                              : '#f59e0b',
                        }}
                      />
                    </div>
                    <div className="mt-0.5 flex justify-between text-[10px] text-muted-foreground">
                      <span>{formatCurrency(budget.mtdSpend)} MTD</span>
                      <span>{formatCurrency(budget.monthlyBudget)} budget</span>
                    </div>
                  </div>
                )}

                <div className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Target className="h-3 w-3" />
                  <span>IS: {formatPercent(product.impressionShare)}</span>
                  <span className="mx-1">|</span>
                  <span>Share: {formatPercent(product.spendShare)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Product Comparison Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart: Spend & Conversions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Comparison</CardTitle>
            <CardDescription>Spend and conversions across all product lines (30d)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="productFull" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === 'Spend') return [formatCurrency(value), name]
                      return [formatNumber(value), name]
                    }}
                  />
                  <Legend />
                  <Bar yAxisId="left" dataKey="spend" name="Spend" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="conversions" name="Conversions" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Radar Chart: Product Strength */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Product Strength Radar</CardTitle>
            <CardDescription>Normalized comparison across key metrics (0-100 scale)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  {products?.map((p) => (
                    <Radar
                      key={p.product}
                      name={p.product}
                      dataKey={p.product}
                      stroke={PRODUCT_COLORS[p.product]}
                      fill={PRODUCT_COLORS[p.product]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Trend Lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Product Trend Lines</CardTitle>
              <CardDescription>Daily metric trends by product over the past 30 days</CardDescription>
            </div>
            <div className="flex gap-1">
              {(['conversions', 'spend', 'cpa', 'roas'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTrendMetric(m)}
                  className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                    trendMetric === m
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {m === 'cpa' ? 'CPA' : m === 'roas' ? 'ROAS' : m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {trendLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData || []} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(date: string) => {
                      const d = new Date(date + 'T00:00:00')
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
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
                    formatter={(value: number) => {
                      if (trendMetric === 'spend' || trendMetric === 'cpa') return [formatCurrencyDetailed(value)]
                      if (trendMetric === 'roas') return [formatMultiplier(value)]
                      return [formatNumber(value)]
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
            )}
          </div>
        </CardContent>
      </Card>

      {/* Campaign Drill-Down */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Campaign Drill-Down
            {selectedProduct && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {selectedProduct}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>
            {selectedProduct
              ? `Campaigns for ${selectedProduct} — click a product card above to switch`
              : 'Click a product card above to view its campaigns'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedProduct ? (
            <DataTable
              columns={campaignColumns}
              data={productCampaigns}
              searchKey="campaignName"
              searchPlaceholder="Search campaigns..."
              pageSize={10}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="h-12 w-12 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">
                Select a product card above to drill into campaign-level performance
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Performance Narrative Cards */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {products?.map((product) => (
          <ProductNarrativeCard key={product.product} product={product} budget={budgetMap.get(product.product)} />
        ))}
      </div>
    </div>
  )
}

// --- Helper Components ---

function ProductNarrativeCard({ product, budget }: { product: ProductSummary; budget?: BudgetPacing }) {
  const strengthCfg = STRENGTH_CONFIG[product.strength]

  // Generate performance narrative
  const narratives: string[] = []
  if (product.cpa < 80) narratives.push('CPA is well below target — strong efficiency.')
  else if (product.cpa < 120) narratives.push('CPA is within healthy range.')
  else narratives.push('CPA is elevated — review keyword and bid strategy.')

  if (product.impressionShare > 70) narratives.push('Impression share is high — good visibility.')
  else if (product.impressionShare > 55) narratives.push('Impression share has room for growth — consider budget increase.')
  else narratives.push('Low impression share — losing significant traffic to competitors.')

  if (budget) {
    if (budget.pacingPercent > 105) narratives.push('Over-pacing on budget — may exhaust funds early.')
    else if (budget.pacingPercent < 90) narratives.push('Under-pacing — opportunity to increase spend.')
    else narratives.push('Budget pacing is on track.')
  }

  if (product.roas > 3.5) narratives.push('ROAS is excellent.')
  else if (product.roas > 2.5) narratives.push('ROAS is acceptable but could improve.')
  else narratives.push('ROAS below target — evaluate conversion value attribution.')

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: PRODUCT_COLORS[product.product] }}
          />
          <span className="text-sm font-semibold">{product.product}</span>
          <span className={`ml-auto inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${strengthCfg.bg} ${strengthCfg.color}`}>
            {strengthCfg.label}
          </span>
        </div>
        <div className="mt-3 space-y-1.5">
          {narratives.map((note, idx) => (
            <div key={idx} className="flex items-start gap-2 text-xs text-muted-foreground">
              <span className="mt-0.5 shrink-0">
                {note.includes('excellent') || note.includes('strong') || note.includes('on track') || note.includes('high') || note.includes('well below')
                  ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                  : note.includes('elevated') || note.includes('losing') || note.includes('Over-pacing') || note.includes('below target')
                  ? <TrendingDown className="h-3 w-3 text-red-500" />
                  : <Minus className="h-3 w-3 text-amber-500" />}
              </span>
              <span>{note}</span>
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
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-52 rounded-lg border bg-card animate-pulse" />
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
