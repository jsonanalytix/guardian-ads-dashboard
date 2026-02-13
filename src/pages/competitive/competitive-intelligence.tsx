// ============================================================
// Competitive Intelligence (Auction Insights) Page
// Phase 4: Competitor table, share of voice trend, competitive
// positioning scatter plot, and competitor movement alerts
// ============================================================

import { useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getAuctionInsightsSummary } from '@/data'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DataTable, MetricCell } from '@/components/tables/data-table'
import type { ColumnDef } from '@tanstack/react-table'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ZAxis,
  Cell,
} from 'recharts'
import { formatPercent } from '@/lib/utils'
import {
  Swords,
  TrendingUp,
  TrendingDown,
  Eye,
  ArrowUpRight,
  Crown,
  Shield,
} from 'lucide-react'

const COMPETITOR_COLORS = [
  '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
]

interface CompetitorRow {
  competitor: string
  impressionShare: number
  overlapRate: number
  positionAboveRate: number
  topOfPageRate: number
  outrankingShare: number
}

export function CompetitiveIntelligence() {
  const { data, loading } = useAsync(() => getAuctionInsightsSummary())

  const competitors = data?.byCompetitor ?? []
  const trend = data?.trend ?? []

  // Guardian's own average metrics (approximate from product summary)
  const guardianIS = 65.2 // Average IS across products

  // Scatter plot data: IS% vs Top of Page Rate
  const scatterData = useMemo(() => {
    return competitors.map((c, i) => ({
      x: c.impressionShare,
      y: c.topOfPageRate,
      z: c.overlapRate,
      name: c.competitor,
      fill: COMPETITOR_COLORS[i % COMPETITOR_COLORS.length]!,
    }))
  }, [competitors])

  // Competitor movement alerts (simulated WoW changes)
  const movements = useMemo(() => {
    if (!competitors.length) return []
    return [
      { competitor: 'MetLife', metric: 'Impression Share', change: 3.2, direction: 'up' as const },
      { competitor: 'Prudential', metric: 'Top of Page Rate', change: -4.1, direction: 'down' as const },
      { competitor: 'Northwestern Mutual', metric: 'Outranking Share', change: 2.8, direction: 'up' as const },
      { competitor: 'Unum', metric: 'Overlap Rate', change: -2.5, direction: 'down' as const },
      { competitor: 'Lincoln Financial', metric: 'Position Above Rate', change: 1.9, direction: 'up' as const },
    ]
  }, [competitors])

  const columns: ColumnDef<CompetitorRow, unknown>[] = [
    {
      accessorKey: 'competitor',
      header: 'Competitor',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Swords className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{row.original.competitor}</span>
        </div>
      ),
    },
    {
      accessorKey: 'impressionShare',
      header: 'Impression Share',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <MetricCell value={row.original.impressionShare} format="percent" />
          {row.original.impressionShare > guardianIS && (
            <Badge variant="destructive" className="text-[10px] px-1 py-0">Above You</Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'overlapRate',
      header: 'Overlap Rate',
      cell: ({ row }) => <MetricCell value={row.original.overlapRate} format="percent" />,
    },
    {
      accessorKey: 'positionAboveRate',
      header: 'Position Above',
      cell: ({ row }) => <MetricCell value={row.original.positionAboveRate} format="percent" />,
    },
    {
      accessorKey: 'topOfPageRate',
      header: 'Top of Page',
      cell: ({ row }) => <MetricCell value={row.original.topOfPageRate} format="percent" />,
    },
    {
      accessorKey: 'outrankingShare',
      header: 'Outranking Share',
      cell: ({ row }) => {
        const val = row.original.outrankingShare
        return (
          <div className="flex items-center gap-1.5">
            <MetricCell value={val} format="percent" />
            <div className="h-1.5 w-16 rounded-full bg-muted">
              <div
                className="h-1.5 rounded-full"
                style={{
                  width: `${val}%`,
                  backgroundColor: val > 35 ? '#ef4444' : val > 25 ? '#f59e0b' : '#10b981',
                }}
              />
            </div>
          </div>
        )
      },
    },
  ]

  if (loading) return <LoadingSkeleton />

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">Competitive Intelligence</h2>
        <p className="text-sm text-muted-foreground">
          Auction insights, share of voice trends, and competitor positioning analysis
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <p className="text-xs font-medium text-muted-foreground">Your Avg IS</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{formatPercent(guardianIS)}</p>
            <p className="text-xs text-muted-foreground">Across all campaigns</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <p className="text-xs font-medium text-muted-foreground">Top Competitor</p>
            </div>
            <p className="mt-1 text-lg font-bold">{competitors[0]?.competitor || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {competitors[0] ? `${formatPercent(competitors[0].impressionShare)} IS` : ''}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-emerald-500" />
              <p className="text-xs font-medium text-muted-foreground">Competitors Tracked</p>
            </div>
            <p className="mt-1 text-2xl font-bold tabular-nums">{competitors.length}</p>
            <p className="text-xs text-muted-foreground">Active in your auctions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="px-4 py-3">
            <div className="flex items-center gap-2">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
              <p className="text-xs font-medium text-muted-foreground">Highest Overlap</p>
            </div>
            <p className="mt-1 text-lg font-bold">{competitors[0]?.competitor || '—'}</p>
            <p className="text-xs text-muted-foreground">
              {competitors[0] ? `${formatPercent(competitors[0].overlapRate)} overlap` : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Auction Insights Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Auction Insights</CardTitle>
          <CardDescription>
            Average metrics across all campaigns over the past 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={competitors}
            searchKey="competitor"
            searchPlaceholder="Search competitors..."
            pageSize={10}
          />
        </CardContent>
      </Card>

      {/* Share of Voice Trend + Scatter Plot */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* SoV Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Share of Voice Trend</CardTitle>
            <CardDescription>Competitor impression share over the past 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    tickFormatter={(date: string) => {
                      const d = new Date(date + 'T00:00:00')
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                  />
                  <YAxis domain={[0, 50]} tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                    labelFormatter={(date: string) => {
                      const d = new Date(date + 'T00:00:00')
                      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
                    }}
                    formatter={(value: number) => [`${value.toFixed(1)}%`]}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  {competitors.slice(0, 5).map((c, i) => (
                    <Line
                      key={c.competitor}
                      type="monotone"
                      dataKey={c.competitor}
                      name={c.competitor}
                      stroke={COMPETITOR_COLORS[i]!}
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

        {/* Competitive Positioning Scatter */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Competitive Positioning</CardTitle>
            <CardDescription>Impression Share vs Top of Page Rate (bubble size = overlap rate)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" dataKey="x" name="Impression Share" unit="%" tick={{ fontSize: 11 }} domain={[5, 40]} />
                  <YAxis type="number" dataKey="y" name="Top of Page" unit="%" tick={{ fontSize: 11 }} domain={[30, 80]} />
                  <ZAxis type="number" dataKey="z" range={[50, 300]} name="Overlap Rate" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                    formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                    labelFormatter={(_: unknown, payload: Array<{ payload?: { name?: string } }>) =>
                      payload?.[0]?.payload?.name || ''
                    }
                  />
                  <Scatter data={scatterData} name="Competitors">
                    {scatterData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-3">
              {scatterData.map((entry) => (
                <div key={entry.name} className="flex items-center gap-1.5 text-xs">
                  <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: entry.fill }} />
                  <span>{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Competitor Movement Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Competitor Movement Alerts</CardTitle>
          <CardDescription>Notable week-over-week changes in competitor auction behavior</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {movements.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50"
              >
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                  m.direction === 'up' ? 'bg-red-50 dark:bg-red-950' : 'bg-emerald-50 dark:bg-emerald-950'
                }`}>
                  {m.direction === 'up' ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {m.competitor}{' '}
                    <span className="text-muted-foreground font-normal">
                      {m.direction === 'up' ? 'increased' : 'decreased'} {m.metric}
                    </span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {m.direction === 'up' ? '+' : ''}{m.change.toFixed(1)}% WoW change
                  </p>
                </div>
                <Badge
                  variant={m.direction === 'up' ? 'destructive' : 'default'}
                  className="text-xs"
                >
                  {m.direction === 'up' ? 'Threat' : 'Opportunity'}
                </Badge>
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
      <div className="h-80 rounded-lg border bg-card animate-pulse" />
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-80 rounded-lg border bg-card animate-pulse" />
        <div className="h-80 rounded-lg border bg-card animate-pulse" />
      </div>
    </div>
  )
}
