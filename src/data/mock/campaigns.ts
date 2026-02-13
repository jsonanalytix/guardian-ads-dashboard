// Mock campaign performance data
// Guardian products: Term Life, Disability, Annuities, Dental Network, Group Benefits
import type { Campaign, Product, IntentBucket, CampaignStatus } from '../types'

interface CampaignConfig {
  name: string
  product: Product
  intent: IntentBucket
  status: CampaignStatus
  dailySpend: [number, number]
  ctrRange: [number, number]
  convRateRange: [number, number]
  avgConvValue: number
  isRange: [number, number]
}

const campaignConfigs: CampaignConfig[] = [
  // Term Life ($65K/mo budget)
  { name: 'Term Life - Brand', product: 'Term Life', intent: 'Brand', status: 'Enabled', dailySpend: [350, 450], ctrRange: [0.08, 0.12], convRateRange: [0.045, 0.06], avgConvValue: 420, isRange: [78, 88] },
  { name: 'Term Life - High Intent', product: 'Term Life', intent: 'High Intent', status: 'Enabled', dailySpend: [650, 800], ctrRange: [0.055, 0.07], convRateRange: [0.035, 0.045], avgConvValue: 390, isRange: [58, 72] },
  { name: 'Term Life - Quotes', product: 'Term Life', intent: 'High Intent', status: 'Enabled', dailySpend: [400, 550], ctrRange: [0.06, 0.075], convRateRange: [0.04, 0.05], avgConvValue: 410, isRange: [62, 75] },
  { name: 'Term Life - Mid Funnel', product: 'Term Life', intent: 'Mid Intent', status: 'Enabled', dailySpend: [250, 350], ctrRange: [0.04, 0.055], convRateRange: [0.02, 0.03], avgConvValue: 350, isRange: [55, 65] },
  { name: 'Term Life - Competitor', product: 'Term Life', intent: 'Competitor', status: 'Enabled', dailySpend: [180, 250], ctrRange: [0.035, 0.05], convRateRange: [0.018, 0.028], avgConvValue: 360, isRange: [42, 55] },

  // Disability ($40K/mo budget)
  { name: 'Disability - Brand', product: 'Disability', intent: 'Brand', status: 'Enabled', dailySpend: [200, 280], ctrRange: [0.07, 0.10], convRateRange: [0.05, 0.065], avgConvValue: 310, isRange: [72, 85] },
  { name: 'Disability - High Intent', product: 'Disability', intent: 'High Intent', status: 'Enabled', dailySpend: [380, 480], ctrRange: [0.05, 0.065], convRateRange: [0.038, 0.048], avgConvValue: 290, isRange: [60, 72] },
  { name: 'Disability - Education', product: 'Disability', intent: 'Mid Intent', status: 'Enabled', dailySpend: [200, 300], ctrRange: [0.04, 0.055], convRateRange: [0.022, 0.032], avgConvValue: 270, isRange: [52, 64] },
  { name: 'Disability - Competitor', product: 'Disability', intent: 'Competitor', status: 'Paused', dailySpend: [0, 0], ctrRange: [0.03, 0.04], convRateRange: [0.015, 0.02], avgConvValue: 280, isRange: [38, 48] },

  // Annuities ($35K/mo budget)
  { name: 'Annuities - Brand', product: 'Annuities', intent: 'Brand', status: 'Enabled', dailySpend: [180, 240], ctrRange: [0.065, 0.09], convRateRange: [0.03, 0.04], avgConvValue: 580, isRange: [70, 82] },
  { name: 'Annuities - High Intent', product: 'Annuities', intent: 'High Intent', status: 'Enabled', dailySpend: [350, 450], ctrRange: [0.045, 0.06], convRateRange: [0.022, 0.032], avgConvValue: 540, isRange: [55, 68] },
  { name: 'Annuities - Retirement Planning', product: 'Annuities', intent: 'Mid Intent', status: 'Enabled', dailySpend: [200, 280], ctrRange: [0.035, 0.05], convRateRange: [0.015, 0.025], avgConvValue: 500, isRange: [48, 60] },
  { name: 'Annuities - Low Funnel', product: 'Annuities', intent: 'Low Intent', status: 'Enabled', dailySpend: [120, 180], ctrRange: [0.03, 0.042], convRateRange: [0.01, 0.018], avgConvValue: 480, isRange: [42, 55] },

  // Dental Network ($25K/mo budget)
  { name: 'Dental - Brand', product: 'Dental Network', intent: 'Brand', status: 'Enabled', dailySpend: [150, 200], ctrRange: [0.075, 0.10], convRateRange: [0.055, 0.07], avgConvValue: 180, isRange: [75, 86] },
  { name: 'Dental - High Intent', product: 'Dental Network', intent: 'High Intent', status: 'Enabled', dailySpend: [280, 360], ctrRange: [0.06, 0.075], convRateRange: [0.045, 0.058], avgConvValue: 165, isRange: [62, 74] },
  { name: 'Dental - Plans', product: 'Dental Network', intent: 'Mid Intent', status: 'Enabled', dailySpend: [150, 220], ctrRange: [0.045, 0.06], convRateRange: [0.03, 0.04], avgConvValue: 150, isRange: [55, 65] },

  // Group Benefits ($15K/mo budget)
  { name: 'Group Benefits - Brand', product: 'Group Benefits', intent: 'Brand', status: 'Enabled', dailySpend: [100, 140], ctrRange: [0.07, 0.095], convRateRange: [0.04, 0.055], avgConvValue: 250, isRange: [68, 80] },
  { name: 'Group Benefits - Employer', product: 'Group Benefits', intent: 'High Intent', status: 'Enabled', dailySpend: [200, 280], ctrRange: [0.05, 0.065], convRateRange: [0.03, 0.042], avgConvValue: 230, isRange: [55, 68] },
  { name: 'Group Benefits - Education', product: 'Group Benefits', intent: 'Mid Intent', status: 'Enabled', dailySpend: [80, 120], ctrRange: [0.04, 0.05], convRateRange: [0.02, 0.03], avgConvValue: 210, isRange: [48, 58] },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateCampaignData(): Campaign[] {
  const campaigns: Campaign[] = []
  const baseDate = new Date('2026-02-12')

  for (const config of campaignConfigs) {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!

      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const weekendMult = isWeekend ? 0.7 : 1.0

      if (config.status === 'Paused') {
        // Paused campaigns have no recent data
        continue
      }

      const spend = rand(config.dailySpend[0], config.dailySpend[1]) * weekendMult
      const ctr = rand(config.ctrRange[0], config.ctrRange[1])
      const impressions = Math.round(spend / (rand(8, 18) * ctr))
      const clicks = Math.round(impressions * ctr)
      const convRate = rand(config.convRateRange[0], config.convRateRange[1])
      const conversions = Math.max(1, Math.round(clicks * convRate))
      const conversionValue = conversions * config.avgConvValue * rand(0.9, 1.1)
      const searchIS = rand(config.isRange[0], config.isRange[1])

      campaigns.push({
        id: `camp-${config.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
        date: dateStr,
        campaignName: config.name,
        product: config.product,
        intentBucket: config.intent,
        status: config.status,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        conversions,
        conversionValue: Math.round(conversionValue * 100) / 100,
        ctr: Math.round(ctr * 10000) / 100,
        cpc: Math.round((spend / clicks) * 100) / 100,
        cpa: Math.round((spend / conversions) * 100) / 100,
        roas: Math.round((conversionValue / spend) * 100) / 100,
        convRate: Math.round(convRate * 10000) / 100,
        searchImpressionShare: Math.round(searchIS * 10) / 10,
        lostIsBudget: Math.round(rand(3, 15) * 10) / 10,
        lostIsRank: Math.round((100 - searchIS - rand(3, 15)) * 10) / 10,
      })
    }
  }

  return campaigns
}

export const campaignData = generateCampaignData()
export const campaignConfigs_export = campaignConfigs
