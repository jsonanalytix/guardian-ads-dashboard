// Mock quality score history data
// Generates 30 days of QS snapshots across all Guardian product keywords
import type { QualityScoreSnapshot, Product } from '../types'

interface QSConfig {
  keyword: string
  keywordId: string
  campaignId: string
  product: Product
  baseQS: number
  expectedCtr: 'Above Average' | 'Average' | 'Below Average'
  adRelevance: 'Above Average' | 'Average' | 'Below Average'
  landingPageExperience: 'Above Average' | 'Average' | 'Below Average'
  dailySpend: [number, number]
}

const qsConfigs: QSConfig[] = [
  // Term Life
  { keyword: 'guardian term life insurance', keywordId: 'kw-tl-1', campaignId: 'camp-tl-brand', product: 'Term Life', baseQS: 9, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Above Average', dailySpend: [120, 160] },
  { keyword: 'guardian life insurance', keywordId: 'kw-tl-2', campaignId: 'camp-tl-brand', product: 'Term Life', baseQS: 8, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [90, 130] },
  { keyword: 'term life insurance quotes', keywordId: 'kw-tl-3', campaignId: 'camp-tl-hi', product: 'Term Life', baseQS: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [200, 280] },
  { keyword: 'best term life insurance', keywordId: 'kw-tl-4', campaignId: 'camp-tl-hi', product: 'Term Life', baseQS: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [150, 220] },
  { keyword: 'how much is term life insurance', keywordId: 'kw-tl-5', campaignId: 'camp-tl-mid', product: 'Term Life', baseQS: 5, expectedCtr: 'Below Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [80, 120] },
  { keyword: 'cheap term life insurance', keywordId: 'kw-tl-6', campaignId: 'camp-tl-mid', product: 'Term Life', baseQS: 4, expectedCtr: 'Below Average', adRelevance: 'Below Average', landingPageExperience: 'Average', dailySpend: [60, 100] },
  { keyword: 'metlife term life insurance', keywordId: 'kw-tl-7', campaignId: 'camp-tl-comp', product: 'Term Life', baseQS: 5, expectedCtr: 'Average', adRelevance: 'Below Average', landingPageExperience: 'Average', dailySpend: [80, 130] },

  // Disability
  { keyword: 'guardian disability insurance', keywordId: 'kw-di-1', campaignId: 'camp-di-brand', product: 'Disability', baseQS: 9, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Above Average', dailySpend: [80, 110] },
  { keyword: 'long term disability insurance', keywordId: 'kw-di-2', campaignId: 'camp-di-hi', product: 'Disability', baseQS: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [130, 180] },
  { keyword: 'short term disability insurance', keywordId: 'kw-di-3', campaignId: 'camp-di-hi', product: 'Disability', baseQS: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [110, 150] },
  { keyword: 'disability insurance cost', keywordId: 'kw-di-4', campaignId: 'camp-di-edu', product: 'Disability', baseQS: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [70, 100] },

  // Annuities
  { keyword: 'guardian annuities', keywordId: 'kw-an-1', campaignId: 'camp-an-brand', product: 'Annuities', baseQS: 8, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [70, 100] },
  { keyword: 'fixed annuity rates', keywordId: 'kw-an-2', campaignId: 'camp-an-hi', product: 'Annuities', baseQS: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [120, 170] },
  { keyword: 'best annuity rates 2026', keywordId: 'kw-an-3', campaignId: 'camp-an-hi', product: 'Annuities', baseQS: 5, expectedCtr: 'Average', adRelevance: 'Below Average', landingPageExperience: 'Average', dailySpend: [90, 140] },
  { keyword: 'retirement annuity plans', keywordId: 'kw-an-4', campaignId: 'camp-an-ret', product: 'Annuities', baseQS: 5, expectedCtr: 'Below Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [80, 120] },

  // Dental Network
  { keyword: 'guardian dental insurance', keywordId: 'kw-dn-1', campaignId: 'camp-dn-brand', product: 'Dental Network', baseQS: 9, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Above Average', dailySpend: [60, 85] },
  { keyword: 'dental insurance plans', keywordId: 'kw-dn-2', campaignId: 'camp-dn-hi', product: 'Dental Network', baseQS: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [100, 140] },
  { keyword: 'affordable dental insurance', keywordId: 'kw-dn-3', campaignId: 'camp-dn-hi', product: 'Dental Network', baseQS: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [80, 120] },
  { keyword: 'dental insurance for families', keywordId: 'kw-dn-4', campaignId: 'camp-dn-plans', product: 'Dental Network', baseQS: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [50, 80] },

  // Group Benefits
  { keyword: 'guardian group benefits', keywordId: 'kw-gb-1', campaignId: 'camp-gb-brand', product: 'Group Benefits', baseQS: 8, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [40, 60] },
  { keyword: 'employer group insurance', keywordId: 'kw-gb-2', campaignId: 'camp-gb-emp', product: 'Group Benefits', baseQS: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [70, 100] },
  { keyword: 'group life insurance for employees', keywordId: 'kw-gb-3', campaignId: 'camp-gb-emp', product: 'Group Benefits', baseQS: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [50, 80] },
  { keyword: 'employee benefits packages', keywordId: 'kw-gb-4', campaignId: 'camp-gb-edu', product: 'Group Benefits', baseQS: 5, expectedCtr: 'Below Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [30, 50] },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateQualityScoreData(): QualityScoreSnapshot[] {
  const snapshots: QualityScoreSnapshot[] = []
  const baseDate = new Date('2026-02-12')

  for (const config of qsConfigs) {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!

      // QS can fluctuate slightly over time (±1)
      const qsVariance = Math.random() < 0.15 ? (Math.random() < 0.5 ? -1 : 1) : 0
      const qualityScore = Math.max(1, Math.min(10, config.baseQS + qsVariance))

      const isWeekend = date.getDay() === 0 || date.getDay() === 6
      const weekendMult = isWeekend ? 0.7 : 1.0
      const spend = rand(config.dailySpend[0], config.dailySpend[1]) * weekendMult

      snapshots.push({
        id: `qs-${config.keywordId}-${dateStr}`,
        date: dateStr,
        keywordId: config.keywordId,
        keyword: config.keyword,
        campaignId: config.campaignId,
        product: config.product,
        qualityScore,
        expectedCtr: config.expectedCtr,
        adRelevance: config.adRelevance,
        landingPageExperience: config.landingPageExperience,
        spend: Math.round(spend * 100) / 100,
      })
    }
  }

  return snapshots
}

export const qualityScoreData = generateQualityScoreData()
