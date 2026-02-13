// ============================================================
// Ad Performance Page
// RSA effectiveness analysis: ad strength distribution,
// headline/description performance, asset analysis
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getAdSummary, getAdPerformance } from '@/data'
import type { Ad } from '@/data/types'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, MetricCell, AdStrengthBadge } from '@/components/tables/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
import { FileText, Zap, TrendingUp, Target } from 'lucide-react'
import { formatCurrency, formatPercent } from '@/lib/utils'

const STRENGTH_COLORS: Record<string, string> = {
  Excellent: '#10b981',
  Good: '#3b82f6',
  Average: '#f59e0b',
  Poor: '#ef4444',
}

export function AdPerformancePage() {
  const { data: adSummary, loading: summaryLoading } = useAsync(() => getAdSummary(), [])
  const { data: allAds, loading: allLoading } = useAsync(() => getAdPerformance(), [])

  // Ad strength distribution
  const strengthDistribution = useMemo(() => {
    if (!adSummary) return []
    return Object.entries(adSummary.byStrength).map(([strength, ads]) => ({
      name: strength,
      value: ads.length,
      fill: STRENGTH_COLORS[strength] ?? '#6b7280',
    }))
  }, [adSummary])

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

  // Headline performance analysis
  const headlineStats = useMemo(() => {
    if (!aggregatedAds) return []

    const headlineCounts = new Map<string, { count: number; totalCtr: number; totalConv: number; totalSpend: number }>()

    for (const ad of aggregatedAds) {
      for (const h of ad.headlines) {
        const existing = headlineCounts.get(h)
        if (existing) {
          existing.count++
          existing.totalCtr += ad.ctr
          existing.totalConv += ad.conversions
          existing.totalSpend += ad.spend
        } else {
          headlineCounts.set(h, { count: 1, totalCtr: ad.ctr, totalConv: ad.conversions, totalSpend: ad.spend })
        }
      }
    }

    return Array.from(headlineCounts.entries())
      .map(([headline, stats]) => ({
        headline,
        avgCtr: Math.round((stats.totalCtr / stats.count) * 100) / 100,
        conversions: stats.totalConv,
        spend: Math.round(stats.totalSpend * 100) / 100,
        usedIn: stats.count,
      }))
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 15)
  }, [aggregatedAds])

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

  const loading = summaryLoading || allLoading
  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Ad Performance</h2>
        <p className="text-sm text-muted-foreground">RSA effectiveness analysis and headline performance rankings</p>
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
          value={String(summaryStats?.totalConv ?? 0)}
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

        {/* Top Headlines by Conversions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Top Headlines by Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={headlineStats.slice(0, 8)}
                  layout="vertical"
                  margin={{ left: 10, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="headline"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={180}
                    tickFormatter={(v: string) => v.length > 25 ? v.substring(0, 25) + '...' : v}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [value, name === 'conversions' ? 'Conversions' : name]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="conversions" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
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
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Avg CTR</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Conversions</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Spend</th>
                  <th className="h-9 px-3 text-right font-medium text-muted-foreground">Used In</th>
                </tr>
              </thead>
              <tbody>
                {headlineStats.map((h, idx) => (
                  <tr key={h.headline} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{idx + 1}</td>
                    <td className="px-3 py-2 font-medium max-w-[300px] truncate">{h.headline}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatPercent(h.avgCtr)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.conversions}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(h.spend)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{h.usedIn} ad{h.usedIn !== 1 ? 's' : ''}</td>
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
