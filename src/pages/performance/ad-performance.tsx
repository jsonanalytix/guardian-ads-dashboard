// ============================================================
// Ad Performance Page
// RSA effectiveness analysis: ad strength distribution,
// headline/description performance, asset analysis
// 2026-02-19: Headline metrics now use fractional attribution and confidence scoring
// so repeated headlines across many RSAs are directional and non-duplicative.
// 2026-02-19: Wired Ads tab to global date-range filters so cards/charts/table
// stay in sync with the header picker; total conversions card now rounds to whole numbers.
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useDateRange } from '@/hooks/use-date-range'
import { getAdPerformance } from '@/data'
import type { Ad } from '@/data/types'
import type { ColumnDef } from '@tanstack/react-table'
import type { TooltipProps } from 'recharts'
import { DataTable, MetricCell, AdStrengthBadge } from '@/components/tables/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import { FileText, Zap, TrendingUp, Target } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'

const STRENGTH_COLORS: Record<string, string> = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Average: '#f59e0b',
  Poor: '#ef4444',
}

type HeadlineSignal = 'Scale' | 'Test' | 'Watch' | 'Cut'

const SIGNAL_COLORS: Record<HeadlineSignal, string> = {
  Scale: '#10b981',
  Test: '#3b82f6',
  Watch: '#f59e0b',
  Cut: '#ef4444',
}

interface HeadlineInsight {
  headline: string
  avgCtr: number
  cvr: number
  cpa: number
  efficiencyIndex: number
  confidence: number
  signal: HeadlineSignal
  allocatedConversions: number
  allocatedSpend: number
  allocatedClicks: number
  allocatedImpressions: number
  usedIn: number
}

function normalizeHeadline(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase()
}

export function AdPerformancePage() {
  const { dateRange, filters: dateFilters } = useDateRange()
  const { data: allAds, loading: allLoading } = useAsync(
    () => getAdPerformance(dateFilters),
    [dateRange, dateFilters.startDate, dateFilters.endDate]
  )

  // Aggregated ad performance (sum across 30 days per ad group)
  const aggregatedAds = useMemo(() => {
    if (!allAds) return []

    const map = new Map<string, Ad & { _days: number }>()
    for (const ad of allAds) {
      const key = ad.adGroupId
      const existing = map.get(key)
      if (existing) {
        existing.spend += ad.spend
        existing.impressions += ad.impressions
        existing.clicks += ad.clicks
        existing.conversions += ad.conversions
        existing.conversionValue += ad.conversionValue
        existing._days++
      } else {
        map.set(key, { ...ad, _days: 1 })
      }
    }

    return Array.from(map.values()).map((a) => ({
      ...a,
      ctr: a.impressions > 0 ? Math.round((a.clicks / a.impressions) * 10000) / 100 : 0,
      cpc: a.clicks > 0 ? Math.round((a.spend / a.clicks) * 100) / 100 : 0,
      cpa: a.conversions > 0 ? Math.round((a.spend / a.conversions) * 100) / 100 : 0,
    }))
  }, [allAds])

  // Ad strength distribution
  const strengthDistribution = useMemo(() => {
    if (!aggregatedAds.length) return []

    const byStrength = aggregatedAds.reduce<Record<string, number>>((acc, ad) => {
      acc[ad.adStrength] = (acc[ad.adStrength] ?? 0) + 1
      return acc
    }, {})

    return Object.entries(byStrength).map(([strength, count]) => ({
      name: strength,
      value: count,
      fill: STRENGTH_COLORS[strength] ?? '#6b7280',
    }))
  }, [aggregatedAds])

  // Headline performance analysis (directional only; no true asset-level attribution)
  const headlineStats = useMemo(() => {
    if (!aggregatedAds) return []

    const accountTotals = aggregatedAds.reduce(
      (acc, ad) => {
        acc.spend += ad.spend
        acc.impressions += ad.impressions
        acc.clicks += ad.clicks
        acc.conversions += ad.conversions
        return acc
      },
      { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
    )
    const accountCvr = accountTotals.clicks > 0 ? accountTotals.conversions / accountTotals.clicks : 0
    const accountCpa = accountTotals.conversions > 0 ? accountTotals.spend / accountTotals.conversions : 0

    const headlineCounts = new Map<string, {
      count: number
      totalCtr: number
      allocSpend: number
      allocImpressions: number
      allocClicks: number
      allocConversions: number
    }>()

    for (const ad of aggregatedAds) {
      const uniqueHeadlines = Array.from(
        new Map(
          ad.headlines
            .map((headline) => headline.trim())
            .filter((headline) => headline.length > 0)
            .map((headline) => [normalizeHeadline(headline), headline])
        ).values()
      )
      const headlineWeight = uniqueHeadlines.length > 0 ? 1 / uniqueHeadlines.length : 1
      const allocSpend = ad.spend * headlineWeight
      const allocImpressions = ad.impressions * headlineWeight
      const allocClicks = ad.clicks * headlineWeight
      const allocConversions = ad.conversions * headlineWeight

      for (const h of uniqueHeadlines) {
        const normalizedHeadline = normalizeHeadline(h)
        const existing = headlineCounts.get(normalizedHeadline)
        if (existing) {
          existing.count++
          existing.totalCtr += ad.ctr
          existing.allocSpend += allocSpend
          existing.allocImpressions += allocImpressions
          existing.allocClicks += allocClicks
          existing.allocConversions += allocConversions
        } else {
          headlineCounts.set(normalizedHeadline, {
            count: 1,
            totalCtr: ad.ctr,
            allocSpend,
            allocImpressions,
            allocClicks,
            allocConversions,
          })
        }
      }
    }

    return Array.from(headlineCounts.entries())
      .map(([headlineKey, stats]) => ({
        headline: headlineKey
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        avgCtr: Math.round((stats.totalCtr / stats.count) * 100) / 100,
        cvr: stats.allocClicks > 0 ? Math.round((stats.allocConversions / stats.allocClicks) * 10000) / 100 : 0,
        cpa: stats.allocConversions > 0 ? Math.round((stats.allocSpend / stats.allocConversions) * 100) / 100 : 0,
        efficiencyIndex:
          accountCvr > 0 && accountCpa > 0 && stats.allocClicks > 0 && stats.allocConversions > 0
            ? Math.round((((stats.allocConversions / stats.allocClicks) / accountCvr) * (accountCpa / (stats.allocSpend / stats.allocConversions))) * 100) / 100
            : 0,
        confidence: 0,
        signal: 'Watch' as HeadlineSignal,
        allocatedConversions: Math.round(stats.allocConversions * 10) / 10,
        allocatedSpend: Math.round(stats.allocSpend * 100) / 100,
        allocatedClicks: Math.round(stats.allocClicks),
        allocatedImpressions: Math.round(stats.allocImpressions),
        usedIn: stats.count,
      }))
      .map((h) => {
        const clicksConfidence = Math.min(1, h.allocatedClicks / 150)
        const supportConfidence = Math.min(1, h.usedIn / 8)
        const impressionConfidence = Math.min(1, h.allocatedImpressions / 5000)
        const confidence = Math.round((clicksConfidence * 0.5 + supportConfidence * 0.3 + impressionConfidence * 0.2) * 100)

        let signal: HeadlineSignal = 'Watch'
        if (confidence >= 65 && h.efficiencyIndex >= 1.15) signal = 'Scale'
        else if (confidence < 65 && h.efficiencyIndex >= 1.05) signal = 'Test'
        else if (confidence >= 65 && h.efficiencyIndex <= 0.9) signal = 'Cut'

        return { ...h, confidence, signal }
      })
      .sort((a, b) => {
        const priority = { Scale: 0, Test: 1, Watch: 2, Cut: 3 } as const
        const bySignal = priority[a.signal] - priority[b.signal]
        if (bySignal !== 0) return bySignal
        return b.efficiencyIndex - a.efficiencyIndex
      })
      .slice(0, 20)
  }, [aggregatedAds])

  const matrixHeadlines = useMemo(() => {
    return [...headlineStats]
      .sort((a, b) => b.allocatedSpend - a.allocatedSpend)
      .slice(0, 12)
  }, [headlineStats])

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!aggregatedAds) return null
    const totalAds = aggregatedAds.length
    const excellent = aggregatedAds.filter((a) => a.adStrength === 'Excellent').length
    const avgCtr = aggregatedAds.reduce((sum, a) => sum + a.ctr, 0) / (totalAds || 1)
    const totalConv = aggregatedAds.reduce((sum, a) => sum + a.conversions, 0)

    return { totalAds, excellent, avgCtr, totalConv }
  }, [aggregatedAds])

  const columns: ColumnDef<Ad & { _days: number }>[] = [
    {
      accessorKey: 'campaignName',
      header: 'Campaign / Ad Group',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-medium text-sm truncate">{row.original.campaignName}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.adGroupName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'adStrength',
      header: 'Strength',
      cell: ({ row }) => <AdStrengthBadge strength={row.original.adStrength} />,
    },
    {
      id: 'headlines',
      header: 'Headlines',
      cell: ({ row }) => (
        <div className="max-w-[250px]">
          <p className="text-xs truncate">{row.original.headlines.slice(0, 3).join(' | ')}</p>
          {row.original.headlines.length > 3 && (
            <p className="text-xs text-muted-foreground">+{row.original.headlines.length - 3} more</p>
          )}
        </div>
      ),
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
      accessorKey: 'conversions',
      header: 'Conv',
      cell: ({ row }) => <MetricCell value={row.original.conversions} />,
    },
    {
      accessorKey: 'cpa',
      header: 'CPA',
      cell: ({ row }) => <MetricCell value={row.original.cpa} format="currency" />,
    },
  ]

  const loading = allLoading
  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Ad Performance</h2>
        <p className="text-sm text-muted-foreground">RSA effectiveness analysis and headline performance rankings</p>
        <p className="text-xs text-muted-foreground mt-1">
          Headline insights are directional: metrics are fractionally allocated across all headlines in each RSA to avoid double-counting.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={FileText}
          iconColor="text-blue-600"
          label="Total RSAs"
          value={String(summaryStats?.totalAds ?? 0)}
        />
        <StatCard
          icon={Zap}
          iconColor="text-emerald-600"
          label="Excellent Strength"
          value={String(summaryStats?.excellent ?? 0)}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-purple-600"
          label="Avg CTR"
          value={formatPercent(summaryStats?.avgCtr ?? 0)}
        />
        <StatCard
          icon={Target}
          iconColor="text-amber-600"
          label="Total Conversions"
          value={(summaryStats?.totalConv ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        />
      </div>

      {/* Ad Strength Distribution + Headline Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Strength Pie */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ad Strength Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="h-48 w-48 shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={strengthDistribution}
                      dataKey="value"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={75}
                      strokeWidth={2}
                      stroke="hsl(var(--card))"
                    >
                      {strengthDistribution.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
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
              <div className="space-y-3">
                {strengthDistribution.map((d) => (
                  <div key={d.name} className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <div>
                      <p className="text-sm font-medium">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.value} ad{d.value !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Headline Opportunity Matrix */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Headline Opportunity Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 16, left: 6, bottom: 6 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="confidence"
                    type="number"
                    tick={{ fontSize: 11 }}
                    domain={[0, 100]}
                    name="Confidence"
                    unit="%"
                    label={{ value: 'Confidence (evidence strength)', position: 'insideBottom', offset: -2, fontSize: 11 }}
                  />
                  <YAxis
                    dataKey="efficiencyIndex"
                    type="number"
                    tick={{ fontSize: 11 }}
                    domain={[0.6, 1.8]}
                    name="Efficiency Index"
                    label={{ value: 'Efficiency vs baseline', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <ZAxis dataKey="allocatedSpend" range={[80, 420]} name="Allocated Spend" />
                  <ReferenceLine x={65} stroke="#94a3b8" strokeDasharray="4 4" />
                  <ReferenceLine y={1} stroke="#94a3b8" strokeDasharray="4 4" />
                  <Tooltip content={<HeadlineMatrixTooltip />} />
                  <Scatter data={matrixHeadlines}>
                    {matrixHeadlines.map((point) => (
                      <Cell key={point.headline} fill={SIGNAL_COLORS[point.signal]} fillOpacity={0.85} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Each dot is one unique headline. Right = stronger confidence, up = better efficiency vs account baseline, larger bubble = more allocated spend.
            </p>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Scale</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Test</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500" /> Watch</span>
              <span className="inline-flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Cut</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Headline Performance Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Headline Performance Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="h-9 px-3 text-left font-medium text-muted-foreground">#</th>
                  <th className="h-9 px-3 text-left font-medium text-muted-foreground">Headline</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Eff. Index</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Confidence</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Signal</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Alloc Conv</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Alloc Spend</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Support</th>
                </tr>
              </thead>
              <tbody>
                {headlineStats.map((h, idx) => (
                  <tr key={h.headline} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium max-w-[300px] truncate">{h.headline}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.efficiencyIndex.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.confidence}%</td>
                    <td className="px-3 py-2 text-right"><SignalBadge signal={h.signal} /></td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.allocatedConversions.toFixed(1)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(h.allocatedSpend)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.usedIn} / {h.allocatedClicks} clicks</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Full RSA Table */}
      <DataTable
        columns={columns}
        data={aggregatedAds}
        searchKey="campaignName"
        searchPlaceholder="Search ads..."
        pageSize={15}
      />
    </div>
  )
}

function SignalBadge({ signal }: { signal: HeadlineSignal }) {
  const classes: Record<HeadlineSignal, string> = {
    Scale: 'bg-emerald-100 text-emerald-800',
    Test: 'bg-blue-100 text-blue-800',
    Watch: 'bg-amber-100 text-amber-800',
    Cut: 'bg-red-100 text-red-800',
  }

  return (
    <span className={`inline-flex min-w-[58px] justify-center rounded-full px-2 py-0.5 text-xs font-medium ${classes[signal]}`}>
      {signal}
    </span>
  )
}

function HeadlineMatrixTooltip({ active, payload }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null
  const point = payload[0]?.payload as HeadlineInsight | undefined
  if (!point) return null

  return (
    <div className="rounded-md border bg-card p-2 text-xs shadow-sm">
      <p className="font-semibold">{point.headline}</p>
      <p className="text-muted-foreground">Signal: {point.signal}</p>
      <div className="mt-1 space-y-0.5">
        <p>Confidence: {point.confidence}%</p>
        <p>Efficiency Index: {point.efficiencyIndex.toFixed(2)} (1.00 = baseline)</p>
        <p>Allocated Spend: {formatCurrency(point.allocatedSpend)}</p>
        <p>Allocated Conv: {point.allocatedConversions.toFixed(1)}</p>
        <p>Avg CTR / CVR: {formatPercent(point.avgCtr)} / {formatPercent(point.cvr)}</p>
        <p>Support: {point.usedIn} ad groups / {point.allocatedClicks} clicks</p>
      </div>
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string
}) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-4">
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
