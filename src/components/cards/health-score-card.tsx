// Account Health Score - composite 0-100 gauge
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { AccountHealthScore } from '@/data/types'

interface HealthScoreCardProps {
  score: AccountHealthScore
}

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 60) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return 'stroke-emerald-500'
  if (score >= 60) return 'stroke-amber-500'
  return 'stroke-red-500'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 60) return 'Fair'
  return 'Needs Attention'
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 45
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="120" height="120" viewBox="0 0 100 100" className="-rotate-90">
        {/* Background ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        {/* Score ring */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn('transition-all duration-1000', getScoreRingColor(score))}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn('text-3xl font-bold', getScoreColor(score))}>{score}</span>
        <span className="text-[10px] text-muted-foreground">{getScoreLabel(score)}</span>
      </div>
    </div>
  )
}

const componentLabels: Record<string, string> = {
  qualityScore: 'Quality Score',
  impressionShare: 'Impression Share',
  cpaTrend: 'CPA Trend',
  budgetPacing: 'Budget Pacing',
  conversionTrend: 'Conv. Trend',
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Account Health</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <ScoreRing score={score.overall} />

          {/* Component breakdown */}
          <div className="w-full space-y-2">
            {Object.entries(score.components).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 shrink-0">
                  {componentLabels[key] || key}
                </span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all',
                      value >= 80 ? 'bg-emerald-500' : value >= 60 ? 'bg-amber-500' : 'bg-red-500'
                    )}
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs font-medium w-8 text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
