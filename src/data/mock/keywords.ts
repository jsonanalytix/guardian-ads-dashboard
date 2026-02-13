// Mock keyword performance data
// Generates 30 days of daily keyword metrics across all Guardian product campaigns
import type { Keyword, Product, MatchType } from '../types'

interface KeywordConfig {
  keyword: string
  matchType: MatchType
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  product: Product
  qualityScore: number | null
  expectedCtr: 'Above Average' | 'Average' | 'Below Average' | null
  adRelevance: 'Above Average' | 'Average' | 'Below Average' | null
  landingPageExperience: 'Above Average' | 'Average' | 'Below Average' | null
  dailySpend: [number, number]
  ctrRange: [number, number]
  convRateRange: [number, number]
}

const keywordConfigs: KeywordConfig[] = [
  // Term Life keywords
  { keyword: 'guardian term life insurance', matchType: 'Exact', campaignId: 'camp-tl-brand', campaignName: 'Term Life - Brand', adGroupId: 'ag-tl-brand-1', adGroupName: 'Brand - Core', product: 'Term Life', qualityScore: 9, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Above Average', dailySpend: [120, 160], ctrRange: [0.10, 0.14], convRateRange: [0.055, 0.07] },
  { keyword: 'guardian life insurance', matchType: 'Phrase', campaignId: 'camp-tl-brand', campaignName: 'Term Life - Brand', adGroupId: 'ag-tl-brand-1', adGroupName: 'Brand - Core', product: 'Term Life', qualityScore: 8, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [90, 130], ctrRange: [0.08, 0.12], convRateRange: [0.04, 0.055] },
  { keyword: 'term life insurance quotes', matchType: 'Exact', campaignId: 'camp-tl-hi', campaignName: 'Term Life - High Intent', adGroupId: 'ag-tl-quotes-1', adGroupName: 'Quotes', product: 'Term Life', qualityScore: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [200, 280], ctrRange: [0.055, 0.07], convRateRange: [0.035, 0.05] },
  { keyword: 'best term life insurance', matchType: 'Phrase', campaignId: 'camp-tl-hi', campaignName: 'Term Life - High Intent', adGroupId: 'ag-tl-best-1', adGroupName: 'Best/Top', product: 'Term Life', qualityScore: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [150, 220], ctrRange: [0.05, 0.065], convRateRange: [0.03, 0.04] },
  { keyword: 'how much is term life insurance', matchType: 'Broad', campaignId: 'camp-tl-mid', campaignName: 'Term Life - Mid Funnel', adGroupId: 'ag-tl-cost-1', adGroupName: 'Cost/Price', product: 'Term Life', qualityScore: 5, expectedCtr: 'Below Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [80, 120], ctrRange: [0.035, 0.05], convRateRange: [0.015, 0.025] },
  { keyword: 'cheap term life insurance', matchType: 'Broad', campaignId: 'camp-tl-mid', campaignName: 'Term Life - Mid Funnel', adGroupId: 'ag-tl-cost-1', adGroupName: 'Cost/Price', product: 'Term Life', qualityScore: 4, expectedCtr: 'Below Average', adRelevance: 'Below Average', landingPageExperience: 'Average', dailySpend: [60, 100], ctrRange: [0.03, 0.045], convRateRange: [0.01, 0.02] },
  { keyword: 'metlife term life insurance', matchType: 'Exact', campaignId: 'camp-tl-comp', campaignName: 'Term Life - Competitor', adGroupId: 'ag-tl-comp-1', adGroupName: 'MetLife', product: 'Term Life', qualityScore: 5, expectedCtr: 'Average', adRelevance: 'Below Average', landingPageExperience: 'Average', dailySpend: [80, 130], ctrRange: [0.035, 0.05], convRateRange: [0.018, 0.028] },

  // Disability keywords
  { keyword: 'guardian disability insurance', matchType: 'Exact', campaignId: 'camp-di-brand', campaignName: 'Disability - Brand', adGroupId: 'ag-di-brand-1', adGroupName: 'Brand - Core', product: 'Disability', qualityScore: 9, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Above Average', dailySpend: [80, 110], ctrRange: [0.09, 0.12], convRateRange: [0.05, 0.065] },
  { keyword: 'long term disability insurance', matchType: 'Exact', campaignId: 'camp-di-hi', campaignName: 'Disability - High Intent', adGroupId: 'ag-di-ltd-1', adGroupName: 'LTD', product: 'Disability', qualityScore: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [130, 180], ctrRange: [0.05, 0.065], convRateRange: [0.035, 0.048] },
  { keyword: 'short term disability insurance', matchType: 'Phrase', campaignId: 'camp-di-hi', campaignName: 'Disability - High Intent', adGroupId: 'ag-di-std-1', adGroupName: 'STD', product: 'Disability', qualityScore: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [110, 150], ctrRange: [0.048, 0.06], convRateRange: [0.032, 0.045] },
  { keyword: 'disability insurance cost', matchType: 'Broad', campaignId: 'camp-di-edu', campaignName: 'Disability - Education', adGroupId: 'ag-di-cost-1', adGroupName: 'Cost/Price', product: 'Disability', qualityScore: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [70, 100], ctrRange: [0.04, 0.055], convRateRange: [0.02, 0.03] },

  // Annuities keywords
  { keyword: 'guardian annuities', matchType: 'Exact', campaignId: 'camp-an-brand', campaignName: 'Annuities - Brand', adGroupId: 'ag-an-brand-1', adGroupName: 'Brand - Core', product: 'Annuities', qualityScore: 8, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [70, 100], ctrRange: [0.07, 0.09], convRateRange: [0.03, 0.04] },
  { keyword: 'fixed annuity rates', matchType: 'Exact', campaignId: 'camp-an-hi', campaignName: 'Annuities - High Intent', adGroupId: 'ag-an-rates-1', adGroupName: 'Rates', product: 'Annuities', qualityScore: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [120, 170], ctrRange: [0.045, 0.06], convRateRange: [0.02, 0.032] },
  { keyword: 'best annuity rates 2026', matchType: 'Phrase', campaignId: 'camp-an-hi', campaignName: 'Annuities - High Intent', adGroupId: 'ag-an-rates-1', adGroupName: 'Rates', product: 'Annuities', qualityScore: 5, expectedCtr: 'Average', adRelevance: 'Below Average', landingPageExperience: 'Average', dailySpend: [90, 140], ctrRange: [0.04, 0.055], convRateRange: [0.018, 0.028] },
  { keyword: 'retirement annuity plans', matchType: 'Broad', campaignId: 'camp-an-ret', campaignName: 'Annuities - Retirement Planning', adGroupId: 'ag-an-retire-1', adGroupName: 'Retirement', product: 'Annuities', qualityScore: 5, expectedCtr: 'Below Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [80, 120], ctrRange: [0.035, 0.05], convRateRange: [0.015, 0.025] },

  // Dental keywords
  { keyword: 'guardian dental insurance', matchType: 'Exact', campaignId: 'camp-dn-brand', campaignName: 'Dental - Brand', adGroupId: 'ag-dn-brand-1', adGroupName: 'Brand - Core', product: 'Dental Network', qualityScore: 9, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Above Average', dailySpend: [60, 85], ctrRange: [0.09, 0.12], convRateRange: [0.06, 0.075] },
  { keyword: 'dental insurance plans', matchType: 'Exact', campaignId: 'camp-dn-hi', campaignName: 'Dental - High Intent', adGroupId: 'ag-dn-plans-1', adGroupName: 'Plans', product: 'Dental Network', qualityScore: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [100, 140], ctrRange: [0.06, 0.075], convRateRange: [0.045, 0.058] },
  { keyword: 'affordable dental insurance', matchType: 'Phrase', campaignId: 'camp-dn-hi', campaignName: 'Dental - High Intent', adGroupId: 'ag-dn-afford-1', adGroupName: 'Affordable', product: 'Dental Network', qualityScore: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [80, 120], ctrRange: [0.055, 0.07], convRateRange: [0.035, 0.048] },
  { keyword: 'dental insurance for families', matchType: 'Broad', campaignId: 'camp-dn-plans', campaignName: 'Dental - Plans', adGroupId: 'ag-dn-family-1', adGroupName: 'Family', product: 'Dental Network', qualityScore: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [50, 80], ctrRange: [0.045, 0.06], convRateRange: [0.028, 0.04] },

  // Group Benefits keywords
  { keyword: 'guardian group benefits', matchType: 'Exact', campaignId: 'camp-gb-brand', campaignName: 'Group Benefits - Brand', adGroupId: 'ag-gb-brand-1', adGroupName: 'Brand - Core', product: 'Group Benefits', qualityScore: 8, expectedCtr: 'Above Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [40, 60], ctrRange: [0.08, 0.10], convRateRange: [0.04, 0.055] },
  { keyword: 'employer group insurance', matchType: 'Exact', campaignId: 'camp-gb-emp', campaignName: 'Group Benefits - Employer', adGroupId: 'ag-gb-emp-1', adGroupName: 'Employer', product: 'Group Benefits', qualityScore: 7, expectedCtr: 'Average', adRelevance: 'Above Average', landingPageExperience: 'Average', dailySpend: [70, 100], ctrRange: [0.05, 0.065], convRateRange: [0.03, 0.042] },
  { keyword: 'group life insurance for employees', matchType: 'Phrase', campaignId: 'camp-gb-emp', campaignName: 'Group Benefits - Employer', adGroupId: 'ag-gb-emp-1', adGroupName: 'Employer', product: 'Group Benefits', qualityScore: 6, expectedCtr: 'Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [50, 80], ctrRange: [0.045, 0.06], convRateRange: [0.025, 0.035] },
  { keyword: 'employee benefits packages', matchType: 'Broad', campaignId: 'camp-gb-edu', campaignName: 'Group Benefits - Education', adGroupId: 'ag-gb-edu-1', adGroupName: 'Education', product: 'Group Benefits', qualityScore: 5, expectedCtr: 'Below Average', adRelevance: 'Average', landingPageExperience: 'Average', dailySpend: [30, 50], ctrRange: [0.035, 0.05], convRateRange: [0.018, 0.028] },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateKeywordData(): Keyword[] {
  const keywords: Keyword[] = []
  const baseDate = new Date('2026-02-12')

  for (const config of keywordConfigs) {
    for (let i = 29; i >= 0; i--) {
      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!

      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const weekendMult = isWeekend ? 0.7 : 1.0

      const spend = rand(config.dailySpend[0], config.dailySpend[1]) * weekendMult
      const ctr = rand(config.ctrRange[0], config.ctrRange[1])
      const impressions = Math.round(spend / (rand(8, 18) * ctr))
      const clicks = Math.round(impressions * ctr)
      const convRate = rand(config.convRateRange[0], config.convRateRange[1])
      const conversions = Math.max(0, Math.round(clicks * convRate))
      const conversionValue = conversions * rand(150, 600)

      keywords.push({
        id: `kw-${config.keyword.replace(/\s+/g, '-')}-${dateStr}`,
        date: dateStr,
        keyword: config.keyword,
        matchType: config.matchType,
        campaignId: config.campaignId,
        campaignName: config.campaignName,
        adGroupId: config.adGroupId,
        adGroupName: config.adGroupName,
        qualityScore: config.qualityScore,
        expectedCtr: config.expectedCtr,
        adRelevance: config.adRelevance,
        landingPageExperience: config.landingPageExperience,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        conversions,
        conversionValue: Math.round(conversionValue * 100) / 100,
        ctr: Math.round(ctr * 10000) / 100,
        cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
        cpa: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : 0,
        roas: spend > 0 ? Math.round((conversionValue / spend) * 100) / 100 : 0,
        convRate: Math.round(convRate * 10000) / 100,
      })
    }
  }

  return keywords
}

export const keywordData = generateKeywordData()
