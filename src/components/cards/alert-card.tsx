// Alerts & Recommendations cards
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
} from 'lucide-react'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { Alert, AlertSeverity } from '@/data/types'

interface AlertsCardProps {
  alerts: Alert[]
}

const severityConfig: Record<
  AlertSeverity,
  { icon: React.ElementType; color: string; bg: string; badge: 'destructive' | 'warning' | 'success' | 'secondary' }
> = {
  critical: {
    icon: AlertCircle,
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800',
    badge: 'destructive',
  },
  warning: {
    icon: AlertTriangle,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800',
    badge: 'warning',
  },
  success: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800',
    badge: 'success',
  },
  info: {
    icon: Info,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800',
    badge: 'secondary',
  },
}

export function AlertsCard({ alerts }: AlertsCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-1.5">
            Alerts & Recommendations
            <InfoTooltip
              content="Auto-generated from top movers and budget pacing. CPA increase > 15% = Critical. Metric change > 20% = Warning (or Success for rising conversions). Products pacing below 85% of target trigger a Warning. Zero-to-positive prior-period baselines are excluded from mover-driven alerts."
              side="right"
            />
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            {alerts.length} active
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[360px]">
          <div className="space-y-2 px-6 pb-6">
            {alerts.length === 0 && (
              <p className="pt-2 text-sm text-muted-foreground">
                No active alerts. Mover alerts exclude zero-baseline jumps to avoid misleading recommendations.
              </p>
            )}
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity]
              const Icon = config.icon

              return (
                <div
                  key={alert.id}
                  className={cn(
                    'rounded-lg border p-3 transition-colors hover:shadow-sm',
                    config.bg
                  )}
                >
                  <div className="flex gap-3">
                    <Icon className={cn('h-4 w-4 mt-0.5 shrink-0', config.color)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{alert.title}</p>
                        {alert.product && (
                          <Badge variant={config.badge} className="shrink-0 text-[10px]">
                            {alert.product}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
