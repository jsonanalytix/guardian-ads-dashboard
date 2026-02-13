// KPI Hero Card with sparkline and delta indicator
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Area, AreaChart, ResponsiveContainer } from 'recharts'
import type { KpiSummary, TrendDirection } from '@/data/types'

interface KpiCardProps {
  kpi: KpiSummary
  /** Whether a decrease is positive (e.g., CPA going down is good) */
  inverseColor?: boolean
}

function getDeltaColor(direction: TrendDirection, inverse: boolean): string {
  if (direction === 'flat') return 'text-muted-foreground'
  const isPositive = direction === 'up' ? !inverse : inverse
  return isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'
}

function getDeltaBg(direction: TrendDirection, inverse: boolean): string {
  if (direction === 'flat') return 'bg-muted'
  const isPositive = direction === 'up' ? !inverse : inverse
  return isPositive ? 'bg-emerald-50 dark:bg-emerald-950' : 'bg-red-50 dark:bg-red-950'
}

function getSparklineColor(direction: TrendDirection, inverse: boolean): string {
  if (direction === 'flat') return '#94a3b8'
  const isPositive = direction === 'up' ? !inverse : inverse
  return isPositive ? '#10b981' : '#ef4444'
}

export function KpiCard({ kpi, inverseColor = false }: KpiCardProps) {
  const sparkData = kpi.sparklineData.map((value, i) => ({ i, value }))
  const color = getSparklineColor(kpi.direction, inverseColor)

  const DeltaIcon =
    kpi.direction === 'up'
      ? TrendingUp
      : kpi.direction === 'down'
      ? TrendingDown
      : Minus

  return (
    <Card className="relative overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {kpi.label}
            </p>
            <p className="text-2xl font-bold tracking-tight">{kpi.formattedValue}</p>
          </div>
          <div
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
              getDeltaBg(kpi.direction, inverseColor),
              getDeltaColor(kpi.direction, inverseColor)
            )}
          >
            <DeltaIcon className="h-3 w-3" />
            {Math.abs(kpi.changePercent).toFixed(1)}%
          </div>
        </div>

        {/* Sparkline */}
        <div className="mt-3 h-10">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData}>
              <defs>
                <linearGradient id={`grad-${kpi.label}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                strokeWidth={1.5}
                fill={`url(#grad-${kpi.label})`}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-1 text-[11px] text-muted-foreground">
          vs prior period
        </p>
      </CardContent>
    </Card>
  )
}
