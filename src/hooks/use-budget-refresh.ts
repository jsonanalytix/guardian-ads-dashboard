// ============================================================
// Budget refresh hook
// 2026-02-19: Re-fetches budget-dependent data after non-dev users
// save monthly budgets in the budget pacing card.
// ============================================================

import { useEffect, useState } from 'react'
import { PRODUCT_BUDGETS_UPDATED_EVENT } from '@/lib/budget-config'

export function useBudgetRefreshToken(): number {
  const [budgetRefreshToken, setBudgetRefreshToken] = useState(0)

  useEffect(() => {
    function handleBudgetUpdate() {
      setBudgetRefreshToken((prev) => prev + 1)
    }

    window.addEventListener(PRODUCT_BUDGETS_UPDATED_EVENT, handleBudgetUpdate)
    return () => {
      window.removeEventListener(PRODUCT_BUDGETS_UPDATED_EVENT, handleBudgetUpdate)
    }
  }, [])

  return budgetRefreshToken
}
