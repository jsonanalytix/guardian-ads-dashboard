// Product Performance Donut Chart
// Shows spend distribution with conversion efficiency overlay
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import { InfoTooltip } from '@/components/ui/info-tooltip'
import type { ProductSummary } from '@/data/types'

interface ProductDonutProps {
  products: ProductSummary[]
}

const COLORS: Record<string, string> = {
  'Term Life': '#3b82f6',
  'Disability': '#8b5cf6',
  'Annuities': '#f59e0b',
  'Dental Network': '#10b981',
  'Group Benefits': '#ec4899',
}

const strengthColors: Record<string, string> = {
  strong: 'text-emerald-600',
  opportunity: 'text-amber-600',
  risk: 'text-red-600',
}

const strengthLabels: Record<string, string> = {
  strong: 'Strong',
  opportunity: 'Opportunity',
  risk: 'Risk',
}

const strengthTooltips: Record<string, string> = {
  strong: 'This product is performing well on efficiency metrics (CPA and ROAS).',
  opportunity: 'This product has room for improvement on efficiency.',
  risk: 'This product has poor efficiency and may need attention.',
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ payload: ProductSummary }>
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null
  const data = payload[0]!.payload

  return (
    <div className="rounded-lg border bg-background p-3 shadow-lg">
      <p className="font-medium text-sm">{data.product}</p>
      <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
        <p>Spend: {formatCurrency(data.spend)}</p>
        <p>Conv: {data.conversions}</p>
        <p>CPA: {formatCurrency(data.cpa)}</p>
        <p>ROAS: {data.roas}x</p>
      </div>
    </div>
  )
}

export function ProductDonut({ products }: ProductDonutProps) {
  const totalSpend = products.reduce((sum, p) => sum + p.spend, 0)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-1.5">
          Product Performance
          <InfoTooltip
            content="Spend distribution across product lines. Each product's share (%) and efficiency rating are shown. Hover the chart segments for spend, conversions, CPA, and ROAS details."
            side="right"
          />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-4">
          {/* Donut chart */}
          <div className="relative h-48 w-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={products}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="spend"
                  nameKey="product"
                  isAnimationActive={false}
                >
                  {products.map((entry) => (
                    <Cell
                      key={entry.product}
                      fill={COLORS[entry.product] || '#94a3b8'}
                      strokeWidth={0}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold">{formatCurrency(totalSpend)}</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                MTD Spend
                <InfoTooltip
                  content="Total month-to-date spend across all product lines."
                  side="bottom"
                  iconClassName="h-2.5 w-2.5"
                />
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="w-full space-y-2">
            {products.map((product) => (
              <div key={product.product} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[product.product] }}
                />
                <span className="text-xs flex-1">{product.product}</span>
                <span className={cn('text-[10px] font-medium flex items-center gap-0.5', strengthColors[product.strength])}>
                  {strengthLabels[product.strength]}
                  <InfoTooltip
                    content={strengthTooltips[product.strength]}
                    side="left"
                    iconClassName="h-2.5 w-2.5"
                  />
                </span>
                <span className="text-xs text-muted-foreground w-12 text-right">
                  {product.spendShare.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
