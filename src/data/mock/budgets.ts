// Mock budget pacing data
// Guardian monthly budgets: Term Life $65K, Disability $40K, Annuities $35K, Dental $25K, Group $15K
import type { BudgetPacing, Product } from '../types'

const today = new Date('2026-02-12')
const daysInMonth = 28 // February 2026
const dayOfMonth = today.getDate()
const daysElapsed = dayOfMonth
const daysRemaining = daysInMonth - dayOfMonth

interface BudgetConfig {
  product: Product
  monthlyBudget: number
  dailyAvgSpend: number
}

const budgetConfigs: BudgetConfig[] = [
  { product: 'Term Life', monthlyBudget: 65000, dailyAvgSpend: 2180 },
  { product: 'Disability', monthlyBudget: 40000, dailyAvgSpend: 1320 },
  { product: 'Annuities', monthlyBudget: 35000, dailyAvgSpend: 1280 },
  { product: 'Dental Network', monthlyBudget: 25000, dailyAvgSpend: 870 },
  { product: 'Group Benefits', monthlyBudget: 15000, dailyAvgSpend: 520 },
]

export const budgetPacingData: BudgetPacing[] = budgetConfigs.map((config) => {
  const mtdSpend = config.dailyAvgSpend * daysElapsed * (0.95 + Math.random() * 0.1)
  const mtdTarget = (config.monthlyBudget / daysInMonth) * daysElapsed
  const projectedSpend = (mtdSpend / daysElapsed) * daysInMonth

  return {
    product: config.product,
    monthlyBudget: config.monthlyBudget,
    mtdSpend: Math.round(mtdSpend),
    mtdTarget: Math.round(mtdTarget),
    dailyAvgSpend: Math.round(config.dailyAvgSpend),
    projectedSpend: Math.round(projectedSpend),
    pacingPercent: Math.round((mtdSpend / mtdTarget) * 100),
    daysRemaining,
    daysElapsed,
  }
})
