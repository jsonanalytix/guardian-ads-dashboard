// ============================================================
// Campaign Performance Page
// Full-featured data table with product/intent/status filters,
// column sorting, pagination, and inline metric formatting
// ============================================================

import { useState, useMemo } from 'react'
import { useAsync } from '@/hooks/use-data'
import { useDateRange } from '@/hooks/use-date-range'
import { getCampaignPerformance } from '@/data'
import type { Campaign, Product, IntentBucket, CampaignStatus } from '@/data/types'
import type { ColumnDef } from '@tanstack/react-table'
import { DataTable, MetricCell, StatusBadge } from '@/components/tables/data-table'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

const products: Product[] = ['Term Life', 'Disability', 'Annuities', 'Dental Network', 'Group Benefits']
const intents: IntentBucket[] = ['Brand', 'High Intent', 'Mid Intent', 'Low Intent', 'Competitor']
const statuses: CampaignStatus[] = ['Enabled', 'Paused']

export function CampaignPerformance() {
  const { dateRange, filters: dateFilters } = useDateRange()
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([])
  const [selectedIntents, setSelectedIntents] = useState<IntentBucket[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<CampaignStatus[]>([])

  const filters = {
    ...dateFilters,
    products: selectedProducts.length ? selectedProducts : undefined,
    intentBuckets: selectedIntents.length ? selectedIntents : undefined,
    campaignStatus: selectedStatuses.length ? selectedStatuses : undefined,
  }

  const { data: campaigns, loading } = useAsync(
    () => getCampaignPerformance(filters),
    [dateRange, selectedProducts.join(','), selectedIntents.join(','), selectedStatuses.join(',')]
  )

  // Aggregate to latest date per campaign (or sum over period)
  const aggregated = useMemo(() => {
    if (!campaigns) return []

    const map = new Map<string, Campaign & { _days: number }>()
    for (const c of campaigns) {
      const existing = map.get(c.campaignName)
      if (existing) {
        existing.spend += c.spend
        existing.impressions += c.impressions
        existing.clicks += c.clicks
        existing.conversions += c.conversions
        existing.conversionValue += c.conversionValue
        existing._days++
        // Take latest IS values
        if (c.date > existing.date) {
          existing.searchImpressionShare = c.searchImpressionShare
          existing.lostIsBudget = c.lostIsBudget
          existing.lostIsRank = c.lostIsRank
          existing.date = c.date
        }
      } else {
        map.set(c.campaignName, { ...c, _days: 1 })
      }
    }

    return Array.from(map.values()).map((c) => ({
      ...c,
      ctr: c.impressions > 0 ? Math.round((c.clicks / c.impressions) * 10000) / 100 : 0,
      cpc: c.clicks > 0 ? Math.round((c.spend / c.clicks) * 100) / 100 : 0,
      cpa: c.conversions > 0 ? Math.round((c.spend / c.conversions) * 100) / 100 : 0,
      roas: c.spend > 0 ? Math.round((c.conversionValue / c.spend) * 100) / 100 : 0,
      convRate: c.clicks > 0 ? Math.round((c.conversions / c.clicks) * 10000) / 100 : 0,
    }))
  }, [campaigns])

  const columns: ColumnDef<Campaign & { _days: number }>[] = [
    {
      accessorKey: 'campaignName',
      header: 'Campaign',
      cell: ({ row }) => (
        <div className="max-w-[200px]">
          <p className="font-medium truncate">{row.original.campaignName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
    },
    {
      accessorKey: 'product',
      header: 'Product',
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.product}</span>
      ),
    },
    {
      accessorKey: 'intentBucket',
      header: 'Intent',
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">{row.original.intentBucket}</Badge>
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
      accessorKey: 'roas',
      header: 'ROAS',
      cell: ({ row }) => <MetricCell value={row.original.roas} format="multiplier" />,
    },
    {
      accessorKey: 'searchImpressionShare',
      header: 'Search IS',
      cell: ({ row }) => <MetricCell value={row.original.searchImpressionShare} format="percent" />,
    },
    {
      accessorKey: 'lostIsBudget',
      header: 'Lost IS (Budget)',
      cell: ({ row }) => <MetricCell value={row.original.lostIsBudget} format="percent" />,
    },
    {
      accessorKey: 'lostIsRank',
      header: 'Lost IS (Rank)',
      cell: ({ row }) => <MetricCell value={row.original.lostIsRank} format="percent" />,
    },
  ]

  const toggleFilter = <T,>(arr: T[], item: T, setter: (v: T[]) => void) => {
    setter(arr.includes(item) ? arr.filter((a) => a !== item) : [...arr, item])
  }

  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Campaign Performance</h2>
        <p className="text-sm text-muted-foreground">30-day aggregated metrics by campaign</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Product Filter */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Product</p>
            <div className="flex flex-wrap gap-1.5">
              {products.map((p) => (
                <button
                  key={p}
                  onClick={() => toggleFilter(selectedProducts, p, setSelectedProducts)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedProducts.includes(p)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Intent Filter */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Intent Bucket</p>
            <div className="flex flex-wrap gap-1.5">
              {intents.map((i) => (
                <button
                  key={i}
                  onClick={() => toggleFilter(selectedIntents, i, setSelectedIntents)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedIntents.includes(i)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {statuses.map((s) => (
                <button
                  key={s}
                  onClick={() => toggleFilter(selectedStatuses, s, setSelectedStatuses)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedStatuses.includes(s)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {s}
                </button>
              ))}
              {(selectedProducts.length > 0 || selectedIntents.length > 0 || selectedStatuses.length > 0) && (
                <button
                  onClick={() => {
                    setSelectedProducts([])
                    setSelectedIntents([])
                    setSelectedStatuses([])
                  }}
                  className="rounded-md px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign Table */}
      <DataTable
        columns={columns}
        data={aggregated}
        searchKey="campaignName"
        searchPlaceholder="Search campaigns..."
        pageSize={20}
      />
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 w-64 rounded bg-muted animate-pulse" />
      <div className="h-32 rounded-lg border bg-card animate-pulse" />
      <div className="h-96 rounded-lg border bg-card animate-pulse" />
    </div>
  )
}
