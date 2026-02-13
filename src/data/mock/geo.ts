// Mock geographic performance data
// Generates 30 days of state-level performance data across Guardian products
import type { GeoPerformance } from '../types'

interface GeoConfig {
  state: string
  stateCode: string
  spendShare: number // relative share of total spend
}

// Top 25 US states by insurance market size
const geoConfigs: GeoConfig[] = [
  { state: 'California', stateCode: 'CA', spendShare: 0.13 },
  { state: 'Texas', stateCode: 'TX', spendShare: 0.10 },
  { state: 'New York', stateCode: 'NY', spendShare: 0.09 },
  { state: 'Florida', stateCode: 'FL', spendShare: 0.08 },
  { state: 'Pennsylvania', stateCode: 'PA', spendShare: 0.05 },
  { state: 'Illinois', stateCode: 'IL', spendShare: 0.05 },
  { state: 'Ohio', stateCode: 'OH', spendShare: 0.04 },
  { state: 'Georgia', stateCode: 'GA', spendShare: 0.04 },
  { state: 'North Carolina', stateCode: 'NC', spendShare: 0.035 },
  { state: 'Michigan', stateCode: 'MI', spendShare: 0.035 },
  { state: 'New Jersey', stateCode: 'NJ', spendShare: 0.035 },
  { state: 'Virginia', stateCode: 'VA', spendShare: 0.03 },
  { state: 'Washington', stateCode: 'WA', spendShare: 0.025 },
  { state: 'Arizona', stateCode: 'AZ', spendShare: 0.025 },
  { state: 'Massachusetts', stateCode: 'MA', spendShare: 0.025 },
  { state: 'Tennessee', stateCode: 'TN', spendShare: 0.02 },
  { state: 'Indiana', stateCode: 'IN', spendShare: 0.02 },
  { state: 'Maryland', stateCode: 'MD', spendShare: 0.02 },
  { state: 'Minnesota', stateCode: 'MN', spendShare: 0.018 },
  { state: 'Colorado', stateCode: 'CO', spendShare: 0.018 },
  { state: 'Wisconsin', stateCode: 'WI', spendShare: 0.015 },
  { state: 'Missouri', stateCode: 'MO', spendShare: 0.015 },
  { state: 'Connecticut', stateCode: 'CT', spendShare: 0.015 },
  { state: 'Oregon', stateCode: 'OR', spendShare: 0.012 },
  { state: 'South Carolina', stateCode: 'SC', spendShare: 0.012 },
  { state: 'Alabama', stateCode: 'AL', spendShare: 0.01 },
  { state: 'Louisiana', stateCode: 'LA', spendShare: 0.01 },
  { state: 'Kentucky', stateCode: 'KY', spendShare: 0.01 },
  { state: 'Iowa', stateCode: 'IA', spendShare: 0.008 },
  { state: 'Nevada', stateCode: 'NV', spendShare: 0.008 },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateGeoData(): GeoPerformance[] {
  const data: GeoPerformance[] = []
  const baseDate = new Date('2026-02-12')
  const totalDailySpend = 6000 // ~$180K/mo ÷ 30

  for (const config of geoConfigs) {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!

      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const weekendMult = isWeekend ? 0.7 : 1.0

      // CPA varies by state — northeast and CA have higher CPAs
      const cpaMult = ['CA', 'NY', 'NJ', 'MA', 'CT'].includes(config.stateCode) ? 1.15
        : ['TX', 'FL', 'GA', 'NC', 'SC'].includes(config.stateCode) ? 0.90
        : 1.0

      const spend = totalDailySpend * config.spendShare * rand(0.85, 1.15) * weekendMult
      const cpc = rand(10, 18) * cpaMult
      const clicks = Math.round(spend / cpc)
      const impressions = Math.round(clicks / rand(0.04, 0.07))
      const convRate = rand(0.025, 0.05) / cpaMult
      const conversions = Math.max(0, Math.round(clicks * convRate))
      const conversionValue = conversions * rand(200, 450)

      data.push({
        id: `geo-${config.stateCode}-${dateStr}`,
        date: dateStr,
        campaignId: 'all',
        state: config.state,
        stateCode: config.stateCode,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        conversions,
        conversionValue: Math.round(conversionValue * 100) / 100,
        ctr: impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0,
        cpc: Math.round(cpc * 100) / 100,
        cpa: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : 0,
        roas: spend > 0 ? Math.round((conversionValue / spend) * 100) / 100 : 0,
        convRate: Math.round(convRate * 10000) / 100,
      })
    }
  }

  return data
}

export const geoData = generateGeoData()
