// ============================================================
// Product budget configuration
// 2026-02-19: Added non-dev editable monthly budgets persisted in localStorage.
// ============================================================

import type { Product } from '@/data/types'

export const DEFAULT_PRODUCT_BUDGETS: Record<Product, number> = {
  'Term Life': 65000,
  Disability: 40000,
  Annuities: 35000,
  'Dental Network': 25000,
  'Group Benefits': 15000,
}

export const PRODUCT_BUDGET_STORAGE_KEY = 'guardian.productBudgets.v1'
export const PRODUCT_BUDGETS_UPDATED_EVENT = 'guardian:budgets-updated'

const PRODUCT_KEYS = Object.keys(DEFAULT_PRODUCT_BUDGETS) as Product[]

function normalizeBudgetValue(value: unknown, fallback: number): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.max(0, Math.round(parsed))
}

export function getProductBudgets(): Record<Product, number> {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PRODUCT_BUDGETS }
  }

  try {
    const raw = window.localStorage.getItem(PRODUCT_BUDGET_STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PRODUCT_BUDGETS }
    const parsed = JSON.parse(raw) as Record<string, unknown>

    const merged = { ...DEFAULT_PRODUCT_BUDGETS }
    for (const product of PRODUCT_KEYS) {
      merged[product] = normalizeBudgetValue(parsed[product], DEFAULT_PRODUCT_BUDGETS[product])
    }
    return merged
  } catch {
    return { ...DEFAULT_PRODUCT_BUDGETS }
  }
}

export function saveProductBudgets(budgets: Record<Product, number>): Record<Product, number> {
  const normalized = { ...DEFAULT_PRODUCT_BUDGETS }
  for (const product of PRODUCT_KEYS) {
    normalized[product] = normalizeBudgetValue(budgets[product], DEFAULT_PRODUCT_BUDGETS[product])
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(PRODUCT_BUDGET_STORAGE_KEY, JSON.stringify(normalized))
    window.dispatchEvent(new Event(PRODUCT_BUDGETS_UPDATED_EVENT))
  }

  return normalized
}
