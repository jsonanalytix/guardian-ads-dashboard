// Top Movers - campaigns with biggest WoW changes
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { TopMover } from '@/data/types'

interface TopMoversCardProps {
  movers: TopMover[]
}

// Metrics where "down" is positive
const inverseMetrics = new Set(['CPA'])

function isPositiveChange(mover: TopMover): boolean {
  const inverse = inverseMetrics.has(mover.metric)
  return mover.direction === 'up' ? !inverse : inverse
}

function formatMoverValue(metric: string, value: number): string {
  switch (metric) {
    case 'CPA':
      return `$${value.toFixed(2)}`
    case 'ROAS':
      return `${value.toFixed(1)}x`
    case 'CTR':
    case 'Impression Share':
      return `${value.toFixed(1)}%`
    case 'Conversions':
      return value.toFixed(0)
    default:
      return value.toString()
  }
}

export function TopMoversCard({ movers }: TopMoversCardProps) {
  // Split into positive and negative movers
  const positive = movers.filter((m) => isPositiveChange(m)).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
  const negative = movers.filter((m) => !isPositiveChange(m)).sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-1.5">
          Top Movers (WoW)
          <InfoTooltip
            content="Campaigns with the largest metric swings vs. the prior period. For each campaign, the metric with the biggest absolute % change is shown (Conversions, CPA, ROAS, or CTR). Top 8 movers are displayed."
            side="right"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Positive movers */}
          <div>
            <h4 className="text-xs font-medium text-emerald-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Improving
            </h4>
            <div className="space-y-2">
              {positive.slice(0, 4).map((mover, i) => (
                <MoverRow key={i} mover={mover} positive />
              ))}
            </div>
          </div>

          {/* Negative movers */}
          <div>
            <h4 className="text-xs font-medium text-red-600 uppercase tracking-wider mb-2 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" /> Declining
            </h4>
            <div className="space-y-2">
              {negative.slice(0, 4).map((mover, i) => (
                <MoverRow key={i} mover={mover} positive={false} />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function MoverRow({ mover, positive }: { mover: TopMover; positive: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-md border px-3 py-2">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{mover.campaignName}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className="text-[10px] px-1.5">
            {mover.product}
          </Badge>
          <span className="text-xs text-muted-foreground">{mover.metric}</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold">{formatMoverValue(mover.metric, mover.currentValue)}</p>
        <p
          className={cn(
            'text-xs font-medium',
            positive ? 'text-emerald-600' : 'text-red-600'
          )}
        >
          {mover.changePercent > 0 ? '+' : ''}
          {mover.changePercent.toFixed(1)}%
        </p>
      </div>
    </div>
  )
}
