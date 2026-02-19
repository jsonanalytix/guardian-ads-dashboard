// Budget Pacing - visual gauge per product
// 2026-02-19: Added in-app editable monthly budgets and aligned
// header metrics to MTD Spend / MTD Target for consistency.
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { BudgetPacing } from '@/data/types'
import type { Product } from '@/data/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getProductBudgets,
  saveProductBudgets,
} from '@/lib/budget-config'

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
  const [isEditingBudgets, setIsEditingBudgets] = useState(false)
  const [draftBudgets, setDraftBudgets] = useState<Record<Product, string>>({} as Record<Product, string>)

  const productOrder = useMemo(() => budgets.map((b) => b.product), [budgets])
  const totalBudget = budgets.reduce((sum, b) => sum + b.monthlyBudget, 0)
  const totalMtdSpend = budgets.reduce((sum, b) => sum + b.mtdSpend, 0)
  const totalMtdTarget = budgets.reduce((sum, b) => sum + b.mtdTarget, 0)
  const overallPacing = Math.round((totalMtdSpend / totalMtdTarget) * 100)

  useEffect(() => {
    const current = getProductBudgets()
    const nextDraft = {} as Record<Product, string>
    for (const product of productOrder) {
      nextDraft[product] = String(current[product])
    }
    setDraftBudgets(nextDraft)
  }, [productOrder])

  function handleDraftChange(product: Product, value: string) {
    setDraftBudgets((prev) => ({ ...prev, [product]: value }))
  }

  function handleSaveBudgets() {
    const next = { ...getProductBudgets() }
    for (const product of productOrder) {
      next[product] = Number(draftBudgets[product] ?? next[product])
    }
    saveProductBudgets(next)
    setIsEditingBudgets(false)
  }

  function handleCancelBudgets() {
    const current = getProductBudgets()
    const resetDraft = {} as Record<Product, string>
    for (const product of productOrder) {
      resetDraft[product] = String(current[product])
    }
    setDraftBudgets(resetDraft)
    setIsEditingBudgets(false)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-1.5">
            Budget Pacing
            <InfoTooltip
              content="Compares month-to-date spend against a prorated daily target. Target = (monthly budget / days in month) x days elapsed. On Track = 95-105%, Slightly Under = 85-94%, Under Pacing < 85%, Over Pacing > 105%."
              side="right"
            />
          </CardTitle>
          <div className="text-right space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
              MTD Spend / MTD Target
              <InfoTooltip
                content="Month-to-date spend across all products versus the combined prorated month-to-date target."
                side="left"
              />
            </p>
            <p className="text-sm font-bold">
              {formatCurrency(totalMtdSpend)}{' '}
              <span className="text-xs font-normal text-muted-foreground">
                / {formatCurrency(totalMtdTarget)}
              </span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Monthly budget: {formatCurrency(totalBudget)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => setIsEditingBudgets((prev) => !prev)}
            >
              {isEditingBudgets ? 'Close' : 'Edit budgets'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isEditingBudgets && (
          <div className="rounded-md border bg-muted/30 p-3 space-y-3">
            <p className="text-xs font-medium">Adjust monthly budgets (USD)</p>
            <div className="grid gap-2">
              {productOrder.map((product) => (
                <div key={product} className="grid grid-cols-[1fr_130px] items-center gap-2">
                  <label className="text-xs text-muted-foreground">{product}</label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={draftBudgets[product] ?? ''}
                    onChange={(e) => handleDraftChange(product, e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" className="h-7 text-[11px]" onClick={handleCancelBudgets}>
                Cancel
              </Button>
              <Button type="button" size="sm" className="h-7 text-[11px]" onClick={handleSaveBudgets}>
                Save budgets
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Saved locally for this browser. Values refresh across dashboard cards immediately.
            </p>
          </div>
        )}

        {/* Overall progress */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium">Overall</span>
            <span className={cn('text-xs font-semibold flex items-center gap-1', overallPacing >= 85 && overallPacing <= 105 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400')}>
              {overallPacing}% of target
              <InfoTooltip
                content="MTD spend / MTD prorated target across all products."
                side="left"
              />
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
