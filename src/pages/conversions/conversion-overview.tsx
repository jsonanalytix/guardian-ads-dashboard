// ============================================================
// Conversion Intelligence Overview Page
// Phase 4: Conversion volume & value trends, conversion type
// breakdown, conversion rate by product, and attribution comparison
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getConversionSummary } from '@/data'
import type { Product } from '@/data/types'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { formatCurrency, formatNumber } from '@/lib/utils'
import {
  ArrowRightLeft,
  Phone,
  FileText,
  MessageSquare,
  ClipboardCheck,
  TrendingUp,
  DollarSign,
  BarChart3,
} from 'lucide-react'

const CONV_TYPE_COLORS: Record<string, string> = {
  Call: '#3b82f6',
  Form: '#10b981',
  Quote: '#f59e0b',
  Chat: '#8b5cf6',
}

const CONV_TYPE_ICONS: Record<string, React.ElementType> = {
  Call: Phone,
  Form: FileText,
  Quote: ClipboardCheck,
  Chat: MessageSquare,
}

const PRODUCT_COLORS: Record<Product, string> = {
  'Term Life': '#3b82f6',
  'Disability': '#10b981',
  'Annuities': '#f59e0b',
  'Dental Network': '#8b5cf6',
  'Group Benefits': '#ec4899',
}

export function ConversionOverview() {
  const { data, loading } = useAsync(() => getConversionSummary())

  const byType = data?.byType ?? []
  const byProduct = data?.byProduct ?? []
  const trend = data?.trend ?? []

  // Totals
  const totalConversions = useMemo(() =>
    byType.reduce((sum, t) => sum + t.lastClick + t.assisted, 0), [byType])
  const totalValue = useMemo(() =>
    byType.reduce((sum, t) => sum + t.totalValue, 0), [byType])
  const totalLastClick = useMemo(() =>
    byType.reduce((sum, t) => sum + t.lastClick, 0), [byType])
  const totalAssisted = useMemo(() =>
    byType.reduce((sum, t) => sum + t.assisted, 0), [byType])

  // Pie data for type distribution
  const pieData = useMemo(() =>
    byType.map((t) => ({
      name: t.type,
      value: t.lastClick + t.assisted,
    })), [byType])

  // Attribution comparison bar data
  const attributionData = useMemo(() =>
    byType.map((t) => ({
      type: t.type,
      'Last Click': t.lastClick,
      'Assisted': t.assisted,
    })), [byType])

  // Product conversion bar data
  const productData = useMemo(() =>
    byProduct.map((p) => ({
      product: p.product,
      conversions: p.conversions,
      value: p.value,
    })).sort((a, b) => b.conversions - a.conversions), [byProduct])

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Conversion Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          Conversion volume, value trends, type breakdown, and attribution analysis
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Total Conversions</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(totalConversions)}</p>
            <p className="text-xs text-muted-foreground">Past 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-muted-foreground">Conversion Value</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatCurrency(totalValue)}</p>
            <p className="text-xs text-muted-foreground">Total attributed value</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              <p className="text-xs font-medium text-muted-foreground">Last Click</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(totalLastClick)}</p>
            <p className="text-xs text-muted-foreground">
              {totalConversions > 0 ? `${((totalLastClick / totalConversions) * 100).toFixed(1)}% of total` : '—'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Assisted</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatNumber(totalAssisted)}</p>
            <p className="text-xs text-muted-foreground">
              {totalConversions > 0 ? `${((totalAssisted / totalConversions) * 100).toFixed(1)}% of total` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Type Breakdown Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {byType.map((t) => {
          const Icon = CONV_TYPE_ICONS[t.type] || ArrowRightLeft
          const total = t.lastClick + t.assisted
          return (
            <Card key={t.type}>
              <CardContent className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ backgroundColor: `${CONV_TYPE_COLORS[t.type]}15` }}
                  >
                    <Icon className="h-3.5 w-3.5" style={{ color: CONV_TYPE_COLORS[t.type] }} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t.type}s</p>
                    <p className="text-lg font-bold tabular-nums">{formatNumber(total)}</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                  <span>Value: {formatCurrency(t.totalValue)}</span>
                  <span>Avg: {formatCurrency(total > 0 ? t.totalValue / total : 0)}</span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Conversion Volume Trend (Stacked Area) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversion Volume Trend</CardTitle>
          <CardDescription>Daily conversion volume by type over the past 30 days</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
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
                />
                <Legend />
                {Object.keys(CONV_TYPE_COLORS).map((type) => (
                  <Area
                    key={type}
                    type="monotone"
                    dataKey={type}
                    name={type}
                    stackId="1"
                    stroke={CONV_TYPE_COLORS[type]}
                    fill={CONV_TYPE_COLORS[type]}
                    fillOpacity={0.3}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Attribution + Type Distribution */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Attribution Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Attribution Comparison</CardTitle>
            <CardDescription>Last click vs assisted conversions by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={attributionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
                  />
                  <Legend />
                  <Bar dataKey="Last Click" name="Last Click" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Assisted" name="Assisted" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Type Distribution Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Conversion Type Distribution</CardTitle>
            <CardDescription>Share of total conversions by type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={CONV_TYPE_COLORS[entry.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [formatNumber(value), name]}
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
            <div className="mt-2 grid grid-cols-2 gap-2">
              {pieData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-2 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CONV_TYPE_COLORS[entry.name] }} />
                  <span className="text-muted-foreground">{entry.name}</span>
                  <span className="ml-auto font-medium tabular-nums">{formatNumber(entry.value)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conversions by Product */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversions by Product</CardTitle>
          <CardDescription>Total conversions and value attributed per product line</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productData} layout="vertical" margin={{ left: 20, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="product" tick={{ fontSize: 11 }} width={110} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                  formatter={(value: number, name: string) => {
                    if (name === 'Conversions') return [formatNumber(value), name]
                    return [formatCurrency(value), name]
                  }}
                />
                <Legend />
                <Bar dataKey="conversions" name="Conversions" fill="#3b82f6" radius={[0, 4, 4, 0]}>
                  {productData.map((entry) => (
                    <Cell key={entry.product} fill={PRODUCT_COLORS[entry.product as Product] || '#3b82f6'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Product summary cards below chart */}
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {productData.map((p) => (
              <div key={p.product} className="rounded-lg border p-3 text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: PRODUCT_COLORS[p.product as Product] }} />
                  <span className="text-xs font-medium">{p.product}</span>
                </div>
                <p className="mt-1 text-lg font-bold tabular-nums">{formatNumber(p.conversions)}</p>
                <p className="text-[10px] text-muted-foreground">{formatCurrency(p.value)}</p>
              </div>
            ))}
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
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg border bg-card animate-pulse" />
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
