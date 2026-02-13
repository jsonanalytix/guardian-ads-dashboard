// ============================================================
// Search Term Intelligence Page
// Winner/Loser classification, new term discovery,
// negative keyword opportunities, and recommended actions
// ============================================================

import { useMemo, useState } from 'react'
import { useAsync } from '@/hooks/use-data'
import { getSearchTermSummary } from '@/data'
import type { SearchTerm } from '@/data/types'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, MetricCell, LabelBadge } from '@/components/tables/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
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
import {
  Trophy,
  AlertTriangle,
  Sparkles,
  MinusCircle,
  TrendingDown,
  DollarSign,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

const LABEL_COLORS: Record<string, string> = {
  Winner: '#10b981',
  Loser: '#ef4444',
  New: '#3b82f6',
  Neutral: '#6b7280',
}

export function SearchTermIntelligence() {
  const { data: termSummary, loading } = useAsync(() => getSearchTermSummary(), [])
  const [activeTab, setActiveTab] = useState('winners')

  // Computed stats
  const stats = useMemo(() => {
    if (!termSummary) return null
    const { winners, losers, newTerms, neutral } = termSummary

    const wastedSpend = losers.reduce((sum, t) => sum + t.spend, 0)
    const winnerConversions = winners.reduce((sum, t) => sum + t.conversions, 0)
    const totalTerms = winners.length + losers.length + newTerms.length + neutral.length

    return { wastedSpend, winnerConversions, totalTerms, counts: {
      Winner: winners.length,
      Loser: losers.length,
      New: newTerms.length,
      Neutral: neutral.length,
    }}
  }, [termSummary])

  // Pie chart data
  const distributionData = useMemo(() => {
    if (!stats) return []
    return Object.entries(stats.counts).map(([name, value]) => ({
      name,
      value,
      fill: LABEL_COLORS[name],
    }))
  }, [stats])

  // Combined data for current tab
  const currentData = useMemo(() => {
    if (!termSummary) return []
    switch (activeTab) {
      case 'winners': return termSummary.winners
      case 'losers': return termSummary.losers
      case 'new': return termSummary.newTerms
      case 'neutral': return termSummary.neutral
      case 'all': return [...termSummary.winners, ...termSummary.losers, ...termSummary.newTerms, ...termSummary.neutral]
      default: return []
    }
  }, [termSummary, activeTab])

  const columns: ColumnDef<SearchTerm>[] = [
    {
      accessorKey: 'searchTerm',
      header: 'Search Term',
      cell: ({ row }) => (
        <div className="max-w-[260px]">
          <p className="font-medium truncate">{row.original.searchTerm}</p>
          <p className="text-xs text-muted-foreground truncate">{row.original.campaignName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'label',
      header: 'Label',
      cell: ({ row }) => <LabelBadge label={row.original.label} />,
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
      cell: ({ row }) => row.original.cpa > 0 ? <MetricCell value={row.original.cpa} format="currency" /> : <span className="text-muted-foreground">—</span>,
    },
    {
      accessorKey: 'reason',
      header: 'Notes',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground max-w-[200px] truncate block">
          {row.original.reason ?? '—'}
        </span>
      ),
    },
    {
      id: 'action',
      header: 'Action',
      cell: ({ row }) => <RecommendedAction term={row.original} />,
    },
  ]

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Search Term Intelligence</h2>
        <p className="text-sm text-muted-foreground">Aggregated 30-day search term analysis with winner/loser classification</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <StatCard
          icon={Trophy}
          iconColor="text-emerald-600 dark:text-emerald-400"
          label="Winners"
          value={String(stats?.counts.Winner ?? 0)}
          sublabel={`${stats?.winnerConversions ?? 0} conversions`}
        />
        <StatCard
          icon={AlertTriangle}
          iconColor="text-red-600 dark:text-red-400"
          label="Losers"
          value={String(stats?.counts.Loser ?? 0)}
          sublabel="Neg. keyword candidates"
        />
        <StatCard
          icon={Sparkles}
          iconColor="text-blue-600 dark:text-blue-400"
          label="New Terms"
          value={String(stats?.counts.New ?? 0)}
          sublabel="Appeared last 7 days"
        />
        <StatCard
          icon={TrendingDown}
          iconColor="text-red-600 dark:text-red-400"
          label="Wasted Spend"
          value={formatCurrency(stats?.wastedSpend ?? 0)}
          sublabel="From loser terms"
        />
        <Card>
          <CardContent className="px-4 py-3">
            <p className="text-xs font-medium text-muted-foreground mb-2">Distribution</p>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={18}
                    outerRadius={30}
                    strokeWidth={0}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Negative Keyword Opportunities (from losers) */}
      {termSummary && termSummary.losers.length > 0 && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-red-800 dark:text-red-300">
              <MinusCircle className="h-4 w-4" />
              Negative Keyword Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3 text-xs text-red-700 dark:text-red-300">
              These terms have significant spend with zero or near-zero conversions. Consider adding as negative keywords.
            </p>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={termSummary.losers.sort((a, b) => b.spend - a.spend)}
                  layout="vertical"
                  margin={{ left: 10, right: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-red-200" />
                  <XAxis type="number" tickFormatter={(v: number) => `$${v}`} tick={{ fontSize: 11 }} />
                  <YAxis
                    dataKey="searchTerm"
                    type="category"
                    tick={{ fontSize: 10 }}
                    width={200}
                    tickFormatter={(v: string) => v.length > 30 ? v.substring(0, 30) + '...' : v}
                  />
                  <Tooltip
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'Wasted Spend']}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="spend" fill="#ef4444" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabbed Table */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({stats?.totalTerms ?? 0})</TabsTrigger>
          <TabsTrigger value="winners" className="data-[state=active]:text-emerald-700 dark:data-[state=active]:text-emerald-300">
            Winners ({stats?.counts.Winner ?? 0})
          </TabsTrigger>
          <TabsTrigger value="losers" className="data-[state=active]:text-red-700 dark:data-[state=active]:text-red-300">
            Losers ({stats?.counts.Loser ?? 0})
          </TabsTrigger>
          <TabsTrigger value="new" className="data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-300">
            New ({stats?.counts.New ?? 0})
          </TabsTrigger>
          <TabsTrigger value="neutral">
            Neutral ({stats?.counts.Neutral ?? 0})
          </TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <DataTable
            columns={columns}
            data={currentData}
            searchKey="searchTerm"
            searchPlaceholder="Search terms..."
            pageSize={15}
          />
        </div>
      </Tabs>
    </div>
  )
}

function StatCard({
  icon: Icon,
  iconColor,
  label,
  value,
  sublabel,
}: {
  icon: React.ElementType
  iconColor: string
  label: string
  value: string
  sublabel: string
}) {
  return (
    <Card>
      <CardContent className="px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${iconColor}`} />
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
        </div>
        <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{sublabel}</p>
      </CardContent>
    </Card>
  )
}

function RecommendedAction({ term }: { term: SearchTerm }) {
  if (term.label === 'Winner') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
        Add as keyword
      </span>
    )
  }
  if (term.label === 'Loser') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-red-50 dark:bg-red-950 px-2 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
        Add as negative
      </span>
    )
  }
  if (term.label === 'New') {
    return (
      <span className="inline-flex items-center gap-1 rounded bg-blue-50 dark:bg-blue-950 px-2 py-0.5 text-xs font-medium text-blue-700 dark:text-blue-300">
        Monitor
      </span>
    )
  }
  return (
    <span className="text-xs text-muted-foreground">—</span>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-24 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
      <div className="h-96 rounded-lg border bg-card animate-pulse" />
    </div>
  )
}
