// ============================================================
// Executive Summary Page
// Landing page for leadership - everything at a glance.
// Includes: Health Score, KPI Hero Cards, Budget Pacing,
// Top Movers, Alerts & Recommendations, Product Donut
// ============================================================

import { useAsync } from '@/hooks/use-data'
import {
  getKpiSummary,
  getAccountHealthScore,
  getBudgetPacing,
  getTopMovers,
  getAlerts,
  getProductSummary,
} from '@/data'
import { KpiCard } from '@/components/cards/kpi-card'
import { HealthScoreCard } from '@/components/cards/health-score-card'
import { BudgetPacingCard } from '@/components/cards/budget-pacing-card'
import { TopMoversCard } from '@/components/cards/top-movers-card'
import { AlertsCard } from '@/components/cards/alert-card'
import { ProductDonut } from '@/components/charts/product-donut'

// CPA is a metric where a decrease is positive
const inverseMetrics = new Set(['CPA'])

export function ExecutiveSummary() {
  const { data: kpis, loading: kpisLoading } = useAsync(() => getKpiSummary(), [])
  const { data: healthScore, loading: healthLoading } = useAsync(() => getAccountHealthScore(), [])
  const { data: budgets, loading: budgetsLoading } = useAsync(() => getBudgetPacing(), [])
  const { data: movers, loading: moversLoading } = useAsync(() => getTopMovers(), [])
  const { data: alerts, loading: alertsLoading } = useAsync(() => getAlerts(), [])
  const { data: products, loading: productsLoading } = useAsync(() => getProductSummary(), [])

  const isLoading = kpisLoading || healthLoading || budgetsLoading || moversLoading || alertsLoading || productsLoading

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="space-y-6">
      {/* Row 1: KPI Hero Cards */}
      <section>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {kpis?.map((kpi) => (
            <KpiCard
              key={kpi.label}
              kpi={kpi}
              inverseColor={inverseMetrics.has(kpi.label)}
            />
          ))}
        </div>
      </section>

      {/* Row 2: Health Score + Budget Pacing + Product Donut */}
      <section className="grid gap-6 lg:grid-cols-3">
        {healthScore && <HealthScoreCard score={healthScore} />}
        {budgets && <BudgetPacingCard budgets={budgets} />}
        {products && <ProductDonut products={products} />}
      </section>

      {/* Row 3: Top Movers + Alerts */}
      <section className="grid gap-6 lg:grid-cols-2">
        {movers && <TopMoversCard movers={movers} />}
        {alerts && <AlertsCard alerts={alerts} />}
      </section>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* KPI skeleton */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>

      {/* Middle row skeleton */}
      <div className="grid gap-6 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-80 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>

      {/* Bottom row skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-96 rounded-lg border bg-card animate-pulse" />
        ))}
      </div>
    </div>
  )
}
