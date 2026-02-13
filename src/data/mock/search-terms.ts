// Mock search term report data
// Classifies terms as Winner, Loser, New, or Neutral based on performance
import type { SearchTerm, SearchTermLabel, Product, MatchType } from '../types'

interface SearchTermConfig {
  searchTerm: string
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  product: Product
  matchType: MatchType
  label: SearchTermLabel
  reason?: string
  dailySpend: [number, number]
  ctrRange: [number, number]
  convRateRange: [number, number]
  daysActive: number // how many of the 30 days this term appeared
}

const searchTermConfigs: SearchTermConfig[] = [
  // --- WINNERS (conv >= 1 AND CPA <= 80% median) ---
  { searchTerm: 'guardian term life insurance quote', campaignId: 'camp-tl-brand', campaignName: 'Term Life - Brand', adGroupId: 'ag-tl-brand-1', adGroupName: 'Brand - Core', product: 'Term Life', matchType: 'Exact', label: 'Winner', reason: 'High conversion rate with below-median CPA', dailySpend: [45, 70], ctrRange: [0.12, 0.16], convRateRange: [0.06, 0.08], daysActive: 30 },
  { searchTerm: 'guardian life insurance reviews', campaignId: 'camp-tl-brand', campaignName: 'Term Life - Brand', adGroupId: 'ag-tl-brand-1', adGroupName: 'Brand - Core', product: 'Term Life', matchType: 'Phrase', label: 'Winner', reason: 'Strong brand engagement', dailySpend: [30, 50], ctrRange: [0.09, 0.13], convRateRange: [0.05, 0.065], daysActive: 30 },
  { searchTerm: 'buy term life insurance online', campaignId: 'camp-tl-hi', campaignName: 'Term Life - High Intent', adGroupId: 'ag-tl-quotes-1', adGroupName: 'Quotes', product: 'Term Life', matchType: 'Phrase', label: 'Winner', reason: 'High purchase intent', dailySpend: [60, 90], ctrRange: [0.07, 0.09], convRateRange: [0.045, 0.06], daysActive: 28 },
  { searchTerm: 'guardian dental plan enrollment', campaignId: 'camp-dn-brand', campaignName: 'Dental - Brand', adGroupId: 'ag-dn-brand-1', adGroupName: 'Brand - Core', product: 'Dental Network', matchType: 'Exact', label: 'Winner', reason: 'Direct enrollment intent', dailySpend: [25, 40], ctrRange: [0.10, 0.14], convRateRange: [0.07, 0.09], daysActive: 30 },
  { searchTerm: 'disability insurance for self employed', campaignId: 'camp-di-hi', campaignName: 'Disability - High Intent', adGroupId: 'ag-di-ltd-1', adGroupName: 'LTD', product: 'Disability', matchType: 'Phrase', label: 'Winner', reason: 'Niche high-intent audience', dailySpend: [35, 55], ctrRange: [0.06, 0.08], convRateRange: [0.042, 0.055], daysActive: 25 },
  { searchTerm: 'group insurance quotes for small business', campaignId: 'camp-gb-emp', campaignName: 'Group Benefits - Employer', adGroupId: 'ag-gb-emp-1', adGroupName: 'Employer', product: 'Group Benefits', matchType: 'Phrase', label: 'Winner', reason: 'Strong SMB conversion', dailySpend: [20, 35], ctrRange: [0.06, 0.08], convRateRange: [0.04, 0.055], daysActive: 22 },

  // --- LOSERS (high spend, zero/low conversions) ---
  { searchTerm: 'life insurance no medical exam', campaignId: 'camp-tl-hi', campaignName: 'Term Life - High Intent', adGroupId: 'ag-tl-quotes-1', adGroupName: 'Quotes', product: 'Term Life', matchType: 'Broad', label: 'Loser', reason: 'High spend, no conversions - not offered', dailySpend: [40, 65], ctrRange: [0.04, 0.06], convRateRange: [0, 0.005], daysActive: 30 },
  { searchTerm: 'free life insurance quotes no personal info', campaignId: 'camp-tl-hi', campaignName: 'Term Life - High Intent', adGroupId: 'ag-tl-quotes-1', adGroupName: 'Quotes', product: 'Term Life', matchType: 'Broad', label: 'Loser', reason: 'Low-quality traffic, no conversions', dailySpend: [35, 55], ctrRange: [0.05, 0.07], convRateRange: [0, 0.003], daysActive: 28 },
  { searchTerm: 'annuity calculator free', campaignId: 'camp-an-hi', campaignName: 'Annuities - High Intent', adGroupId: 'ag-an-rates-1', adGroupName: 'Rates', product: 'Annuities', matchType: 'Broad', label: 'Loser', reason: 'Informational intent only', dailySpend: [25, 45], ctrRange: [0.04, 0.06], convRateRange: [0, 0.008], daysActive: 30 },
  { searchTerm: 'dental insurance vs dental discount plan', campaignId: 'camp-dn-hi', campaignName: 'Dental - High Intent', adGroupId: 'ag-dn-plans-1', adGroupName: 'Plans', product: 'Dental Network', matchType: 'Broad', label: 'Loser', reason: 'Comparison shoppers, poor conversion', dailySpend: [20, 35], ctrRange: [0.03, 0.05], convRateRange: [0, 0.006], daysActive: 26 },
  { searchTerm: 'what is disability insurance', campaignId: 'camp-di-edu', campaignName: 'Disability - Education', adGroupId: 'ag-di-cost-1', adGroupName: 'Cost/Price', product: 'Disability', matchType: 'Broad', label: 'Loser', reason: 'Pure educational, far from purchase', dailySpend: [30, 50], ctrRange: [0.04, 0.055], convRateRange: [0, 0.004], daysActive: 30 },
  { searchTerm: 'prudential life insurance complaints', campaignId: 'camp-tl-comp', campaignName: 'Term Life - Competitor', adGroupId: 'ag-tl-comp-1', adGroupName: 'MetLife', product: 'Term Life', matchType: 'Broad', label: 'Loser', reason: 'Negative competitor intent', dailySpend: [15, 30], ctrRange: [0.02, 0.035], convRateRange: [0, 0.005], daysActive: 20 },

  // --- NEW (appeared within last 7 days) ---
  { searchTerm: 'guardian insurance ai claims process', campaignId: 'camp-tl-brand', campaignName: 'Term Life - Brand', adGroupId: 'ag-tl-brand-1', adGroupName: 'Brand - Core', product: 'Term Life', matchType: 'Broad', label: 'New', reason: 'Emerging search trend', dailySpend: [10, 20], ctrRange: [0.05, 0.08], convRateRange: [0.02, 0.04], daysActive: 5 },
  { searchTerm: 'best disability coverage 2026', campaignId: 'camp-di-hi', campaignName: 'Disability - High Intent', adGroupId: 'ag-di-ltd-1', adGroupName: 'LTD', product: 'Disability', matchType: 'Broad', label: 'New', reason: 'New year-specific query', dailySpend: [8, 18], ctrRange: [0.04, 0.065], convRateRange: [0.015, 0.03], daysActive: 7 },
  { searchTerm: 'dental insurance that covers implants 2026', campaignId: 'camp-dn-hi', campaignName: 'Dental - High Intent', adGroupId: 'ag-dn-plans-1', adGroupName: 'Plans', product: 'Dental Network', matchType: 'Broad', label: 'New', reason: 'New specific coverage query', dailySpend: [6, 14], ctrRange: [0.05, 0.07], convRateRange: [0.025, 0.04], daysActive: 4 },
  { searchTerm: 'remote employee group benefits', campaignId: 'camp-gb-emp', campaignName: 'Group Benefits - Employer', adGroupId: 'ag-gb-emp-1', adGroupName: 'Employer', product: 'Group Benefits', matchType: 'Broad', label: 'New', reason: 'Remote work trend', dailySpend: [5, 12], ctrRange: [0.04, 0.06], convRateRange: [0.02, 0.035], daysActive: 6 },

  // --- NEUTRAL (mid-range performance) ---
  { searchTerm: 'term life insurance 20 year', campaignId: 'camp-tl-hi', campaignName: 'Term Life - High Intent', adGroupId: 'ag-tl-quotes-1', adGroupName: 'Quotes', product: 'Term Life', matchType: 'Phrase', label: 'Neutral', dailySpend: [30, 50], ctrRange: [0.05, 0.07], convRateRange: [0.02, 0.035], daysActive: 30 },
  { searchTerm: 'compare life insurance companies', campaignId: 'camp-tl-mid', campaignName: 'Term Life - Mid Funnel', adGroupId: 'ag-tl-cost-1', adGroupName: 'Cost/Price', product: 'Term Life', matchType: 'Broad', label: 'Neutral', dailySpend: [25, 40], ctrRange: [0.04, 0.055], convRateRange: [0.015, 0.025], daysActive: 30 },
  { searchTerm: 'disability insurance benefits', campaignId: 'camp-di-edu', campaignName: 'Disability - Education', adGroupId: 'ag-di-cost-1', adGroupName: 'Cost/Price', product: 'Disability', matchType: 'Phrase', label: 'Neutral', dailySpend: [20, 35], ctrRange: [0.04, 0.055], convRateRange: [0.018, 0.028], daysActive: 28 },
  { searchTerm: 'annuity vs 401k', campaignId: 'camp-an-ret', campaignName: 'Annuities - Retirement Planning', adGroupId: 'ag-an-retire-1', adGroupName: 'Retirement', product: 'Annuities', matchType: 'Broad', label: 'Neutral', dailySpend: [15, 30], ctrRange: [0.035, 0.05], convRateRange: [0.01, 0.02], daysActive: 26 },
  { searchTerm: 'dental ppo plans near me', campaignId: 'camp-dn-hi', campaignName: 'Dental - High Intent', adGroupId: 'ag-dn-plans-1', adGroupName: 'Plans', product: 'Dental Network', matchType: 'Broad', label: 'Neutral', dailySpend: [18, 30], ctrRange: [0.055, 0.07], convRateRange: [0.03, 0.04], daysActive: 30 },
  { searchTerm: 'employee benefits administration', campaignId: 'camp-gb-edu', campaignName: 'Group Benefits - Education', adGroupId: 'ag-gb-edu-1', adGroupName: 'Education', product: 'Group Benefits', matchType: 'Broad', label: 'Neutral', dailySpend: [10, 20], ctrRange: [0.035, 0.05], convRateRange: [0.015, 0.025], daysActive: 24 },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateSearchTermData(): SearchTerm[] {
  const terms: SearchTerm[] = []
  const baseDate = new Date('2026-02-12')

  for (const config of searchTermConfigs) {
    const startDay = config.label === 'New' ? config.daysActive - 1 : 29
    for (let i = startDay; i >= 0; i--) {
      // Skip some days for non-30-day terms
      if (i > config.daysActive - 1) continue
      // Random skip for partial-day terms
      if (config.daysActive < 25 && Math.random() > 0.85) continue

      const date = new Date(baseDate)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]!

      const dayOfWeek = date.getDay()
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
      const weekendMult = isWeekend ? 0.65 : 1.0

      const spend = rand(config.dailySpend[0], config.dailySpend[1]) * weekendMult
      const ctr = rand(config.ctrRange[0], config.ctrRange[1])
      const impressions = Math.round(spend / (rand(8, 18) * ctr))
      const clicks = Math.round(impressions * ctr)
      const convRate = rand(config.convRateRange[0], config.convRateRange[1])
      const conversions = Math.max(0, Math.round(clicks * convRate))

      terms.push({
        id: `st-${config.searchTerm.replace(/\s+/g, '-').substring(0, 40)}-${dateStr}`,
        date: dateStr,
        searchTerm: config.searchTerm,
        campaignId: config.campaignId,
        campaignName: config.campaignName,
        adGroupId: config.adGroupId,
        adGroupName: config.adGroupName,
        matchType: config.matchType,
        label: config.label,
        reason: config.reason,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        conversions,
        conversionValue: Math.round(conversions * rand(150, 500) * 100) / 100,
        cpa: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : 0,
        ctr: Math.round(ctr * 10000) / 100,
      })
    }
  }

  return terms
}

export const searchTermData = generateSearchTermData()
