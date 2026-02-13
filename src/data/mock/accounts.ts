// Mock account-level daily snapshots for the last 30 days
// Based on Guardian insurance benchmarks: ~$180K/mo total budget
import type { AccountSummary } from '../types'

function generateDailyData(): AccountSummary[] {
  const data: AccountSummary[] = []
  const baseDate = new Date('2026-02-12')

  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]!

    // Weekend dip
    const dayOfWeek = date.getDay()
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
    const weekendMultiplier = isWeekend ? 0.7 : 1.0

    // Gradual improvement trend
    const trendMultiplier = 1 + (30 - i) * 0.002

    const dailySpend = (5800 + Math.random() * 800) * weekendMultiplier
    const impressions = Math.round((108000 + Math.random() * 15000) * weekendMultiplier * trendMultiplier)
    const clicks = Math.round(impressions * (0.052 + Math.random() * 0.008))
    const conversions = Math.round(clicks * (0.032 + Math.random() * 0.008) * trendMultiplier)
    const conversionValue = conversions * (380 + Math.random() * 60)

    data.push({
      date: dateStr,
      spend: Math.round(dailySpend * 100) / 100,
      impressions,
      clicks,
      conversions,
      conversionValue: Math.round(conversionValue * 100) / 100,
      ctr: Math.round((clicks / impressions) * 10000) / 100,
      cpc: Math.round((dailySpend / clicks) * 100) / 100,
      cpa: Math.round((dailySpend / conversions) * 100) / 100,
      roas: Math.round((conversionValue / dailySpend) * 100) / 100,
      searchImpressionShare: Math.round((62 + Math.random() * 12) * 10) / 10,
      lostIsBudget: Math.round((8 + Math.random() * 8) * 10) / 10,
      lostIsRank: Math.round((15 + Math.random() * 10) * 10) / 10,
    })
  }
  return data
}

export const accountData = generateDailyData()
