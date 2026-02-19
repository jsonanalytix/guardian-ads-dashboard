// Account Health Score - composite 0-100 gauge
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'
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

const componentTooltips: Record<string, string> = {
  qualityScore: 'Average Google Ads quality score (1-10) scaled to 0-100. Based on ad relevance, expected CTR, and landing page experience.',
  impressionShare: 'Current period impression-weighted search impression share, mapped directly to a 0-100 score.',
  cpaTrend: 'Score = 70 minus CPA % change. CPA going down improves the score; CPA rising lowers it.',
  budgetPacing: 'Score = 100 minus 2x the deviation from target pacing. Perfect pacing (100%) scores 100; 10% off-pace scores 80.',
  conversionTrend: 'Score = 70 plus conversion % change. Growing conversions raise the score; declining conversions lower it.',
}

export function HealthScoreCard({ score }: HealthScoreCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-1.5">
          Account Health
          <InfoTooltip
            content="Composite score (0-100) averaging 5 components: Quality Score, Impression Share, CPA Trend, Budget Pacing, and Conversion Trend. 80+ = Excellent, 70-79 = Good, 60-69 = Fair, below 60 = Needs Attention."
            side="right"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          <ScoreRing score={score.overall} />

          {/* Component breakdown */}
          <div className="w-full space-y-2">
            {Object.entries(score.components).map(([key, value]) => (
              <div key={key} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-28 shrink-0 flex items-center gap-1">
                  {componentLabels[key] || key}
                  {componentTooltips[key] && (
                    <InfoTooltip content={componentTooltips[key]} side="right" />
                  )}
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
