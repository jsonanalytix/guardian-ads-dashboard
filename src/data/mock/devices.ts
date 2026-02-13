// Mock device performance data
// Generates 30 days of device-level metrics (Desktop, Mobile, Tablet)
import type { DevicePerformance, Device, Product } from '../types'

interface DeviceConfig {
  device: Device
  product: Product
  spendShare: number
  ctrRange: [number, number]
  convRateRange: [number, number]
  cpcMult: number // multiplier vs base CPC
}

const deviceConfigs: DeviceConfig[] = [
  // Term Life — Desktop heavy (insurance is research-heavy)
  { device: 'Desktop', product: 'Term Life', spendShare: 0.52, ctrRange: [0.055, 0.075], convRateRange: [0.04, 0.055], cpcMult: 1.0 },
  { device: 'Mobile', product: 'Term Life', spendShare: 0.40, ctrRange: [0.04, 0.06], convRateRange: [0.025, 0.038], cpcMult: 0.85 },
  { device: 'Tablet', product: 'Term Life', spendShare: 0.08, ctrRange: [0.045, 0.065], convRateRange: [0.035, 0.048], cpcMult: 0.90 },

  // Disability
  { device: 'Desktop', product: 'Disability', spendShare: 0.55, ctrRange: [0.05, 0.07], convRateRange: [0.042, 0.058], cpcMult: 1.0 },
  { device: 'Mobile', product: 'Disability', spendShare: 0.38, ctrRange: [0.038, 0.055], convRateRange: [0.025, 0.035], cpcMult: 0.82 },
  { device: 'Tablet', product: 'Disability', spendShare: 0.07, ctrRange: [0.042, 0.06], convRateRange: [0.032, 0.045], cpcMult: 0.88 },

  // Annuities — Very desktop heavy (older demographic)
  { device: 'Desktop', product: 'Annuities', spendShare: 0.62, ctrRange: [0.045, 0.065], convRateRange: [0.025, 0.038], cpcMult: 1.1 },
  { device: 'Mobile', product: 'Annuities', spendShare: 0.30, ctrRange: [0.03, 0.045], convRateRange: [0.012, 0.022], cpcMult: 0.80 },
  { device: 'Tablet', product: 'Annuities', spendShare: 0.08, ctrRange: [0.04, 0.055], convRateRange: [0.02, 0.032], cpcMult: 0.92 },

  // Dental Network — More mobile (younger demographic)
  { device: 'Desktop', product: 'Dental Network', spendShare: 0.42, ctrRange: [0.06, 0.08], convRateRange: [0.05, 0.065], cpcMult: 1.0 },
  { device: 'Mobile', product: 'Dental Network', spendShare: 0.48, ctrRange: [0.055, 0.075], convRateRange: [0.035, 0.05], cpcMult: 0.78 },
  { device: 'Tablet', product: 'Dental Network', spendShare: 0.10, ctrRange: [0.055, 0.07], convRateRange: [0.045, 0.058], cpcMult: 0.85 },

  // Group Benefits — Desktop dominant (B2B)
  { device: 'Desktop', product: 'Group Benefits', spendShare: 0.65, ctrRange: [0.05, 0.07], convRateRange: [0.035, 0.05], cpcMult: 1.05 },
  { device: 'Mobile', product: 'Group Benefits', spendShare: 0.28, ctrRange: [0.035, 0.05], convRateRange: [0.018, 0.028], cpcMult: 0.75 },
  { device: 'Tablet', product: 'Group Benefits', spendShare: 0.07, ctrRange: [0.04, 0.055], convRateRange: [0.025, 0.038], cpcMult: 0.85 },
]

// Daily product budgets (approx)
const productDailyBudgets: Record<Product, number> = {
  'Term Life': 2167,
  'Disability': 1333,
  'Annuities': 1167,
  'Dental Network': 833,
  'Group Benefits': 500,
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateDeviceData(): DevicePerformance[] {
  const data: DevicePerformance[] = []
  const baseDate = new Date('2026-02-12')

  for (const config of deviceConfigs) {
    const dailyBudget = productDailyBudgets[config.product]

    for (let i = 29; i >= 0; i--) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!

      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const weekendMult = isWeekend ? 0.7 : 1.0

      const spend = dailyBudget * config.spendShare * rand(0.85, 1.15) * weekendMult
      const baseCpc = rand(10, 16) * config.cpcMult
      const clicks = Math.round(spend / baseCpc)
      const ctr = rand(config.ctrRange[0], config.ctrRange[1])
      const impressions = Math.round(clicks / ctr)
      const convRate = rand(config.convRateRange[0], config.convRateRange[1])
      const conversions = Math.max(0, Math.round(clicks * convRate))
      const conversionValue = conversions * rand(200, 500)

      data.push({
        id: `dev-${config.device.toLowerCase()}-${config.product.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
        date: dateStr,
        campaignId: 'all',
        device: config.device,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        conversions,
        conversionValue: Math.round(conversionValue * 100) / 100,
        ctr: Math.round(ctr * 10000) / 100,
        cpc: Math.round(baseCpc * 100) / 100,
        cpa: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : 0,
        roas: spend > 0 ? Math.round((conversionValue / spend) * 100) / 100 : 0,
        convRate: Math.round(convRate * 10000) / 100,
      })
    }
  }

  return data
}

export const deviceData = generateDeviceData()
