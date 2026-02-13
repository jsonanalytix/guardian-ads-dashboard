// Budget Pacing - visual gauge per product
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import type { BudgetPacing } from '@/data/types'

interface BudgetPacingCardProps {
  budgets: BudgetPacing[]
}

function getPacingColor(percent: number): string {
  if (percent >= 95 && percent <= 105) return 'bg-emerald-500'
  if (percent >= 85 && percent <= 115) return 'bg-amber-500'
  return 'bg-red-500'
}

function getPacingLabel(percent: number): string {
  if (percent >= 95 && percent <= 105) return 'On Track'
  if (percent > 105) return 'Over Pacing'
  if (percent >= 85) return 'Slightly Under'
  return 'Under Pacing'
}

export function BudgetPacingCard({ budgets }: BudgetPacingCardProps) {
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyBudget, 0)
  const totalMtdSpend = budgets.reduce((sum, b) => sum + b.mtdSpend, 0)
  const totalMtdTarget = budgets.reduce((sum, b) => sum + b.mtdTarget, 0)
  const overallPacing = Math.round((totalMtdSpend / totalMtdTarget) * 100)

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Budget Pacing</CardTitle>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">MTD Total</p>
            <p className="text-sm font-bold">
              {formatCurrency(totalMtdSpend)}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                / {formatCurrency(totalBudget)}
              </span>
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Overall</span>
            <span className={cn('text-xs font-semibold', overallPacing >= 85 && overallPacing <= 105 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
              {overallPacing}% of target
            </span>
          </div>
          <Progress
            value={Math.min(overallPacing, 100)}
            className="h-2"
            indicatorClassName={getPacingColor(overallPacing)}
          />
        </div>

        {/* Per-product breakdown */}
        <div className="space-y-3">
          {budgets.map((budget) => (
            <div key={budget.product}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">{budget.product}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted-foreground">
                    {formatCurrency(budget.mtdSpend)}
                  </span>
                  <span
                    className={cn(
                      'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
                      budget.pacingPercent >= 95 && budget.pacingPercent <= 105
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : budget.pacingPercent >= 85
                        ? 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                        : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                    )}
                  >
                    {getPacingLabel(budget.pacingPercent)}
                  </span>
                </div>
              </div>
              <Progress
                value={Math.min(budget.pacingPercent, 100)}
                className="h-1.5"
                indicatorClassName={getPacingColor(budget.pacingPercent)}
              />
            </div>
          ))}
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          {budgets[0]?.daysRemaining} days remaining in period
        </p>
      </CardContent>
    </Card>
  )
}
