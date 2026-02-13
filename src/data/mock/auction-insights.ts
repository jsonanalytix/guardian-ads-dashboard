// Mock auction insights (competitive intelligence) data
// Top competitors: MetLife, Prudential, Northwestern Mutual, Unum, Lincoln Financial
import type { AuctionInsight } from '../types'

interface CompetitorConfig {
  name: string
  isBase: [number, number]
  overlapBase: [number, number]
  posAboveBase: [number, number]
  topPageBase: [number, number]
  outrankBase: [number, number]
}

const competitors: CompetitorConfig[] = [
  { name: 'MetLife', isBase: [28, 35], overlapBase: [72, 82], posAboveBase: [38, 48], topPageBase: [62, 72], outrankBase: [32, 42] },
  { name: 'Prudential', isBase: [22, 30], overlapBase: [65, 75], posAboveBase: [30, 42], topPageBase: [55, 68], outrankBase: [28, 38] },
  { name: 'Northwestern Mutual', isBase: [18, 25], overlapBase: [58, 68], posAboveBase: [25, 38], topPageBase: [50, 62], outrankBase: [24, 34] },
  { name: 'Unum', isBase: [15, 22], overlapBase: [52, 62], posAboveBase: [22, 32], topPageBase: [45, 56], outrankBase: [20, 30] },
  { name: 'Lincoln Financial', isBase: [12, 20], overlapBase: [48, 58], posAboveBase: [18, 28], topPageBase: [40, 52], outrankBase: [18, 26] },
  { name: 'Aflac', isBase: [10, 18], overlapBase: [42, 55], posAboveBase: [15, 25], topPageBase: [38, 48], outrankBase: [15, 24] },
  { name: 'New York Life', isBase: [14, 22], overlapBase: [55, 65], posAboveBase: [28, 38], topPageBase: [48, 60], outrankBase: [22, 32] },
]

const campaignIds = [
  'camp-term-life-brand',
  'camp-term-life-high-intent',
  'camp-disability-high-intent',
  'camp-annuities-high-intent',
  'camp-dental-high-intent',
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateAuctionInsights(): AuctionInsight[] {
  const insights: AuctionInsight[] = []
  const baseDate = new Date('2026-02-12')

  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]!

    for (const campId of campaignIds) {
      for (const comp of competitors) {
        insights.push({
          id: `ai-${campId}-${comp.name.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`,
          date: dateStr,
          campaignId: campId,
          competitor: comp.name,
          impressionShare: Math.round(rand(comp.isBase[0], comp.isBase[1]) * 10) / 10,
          overlapRate: Math.round(rand(comp.overlapBase[0], comp.overlapBase[1]) * 10) / 10,
          positionAboveRate: Math.round(rand(comp.posAboveBase[0], comp.posAboveBase[1]) * 10) / 10,
          topOfPageRate: Math.round(rand(comp.topPageBase[0], comp.topPageBase[1]) * 10) / 10,
          outrankingShare: Math.round(rand(comp.outrankBase[0], comp.outrankBase[1]) * 10) / 10,
        })
      }
    }
  }

  return insights
}

export const auctionInsightData = generateAuctionInsights()
