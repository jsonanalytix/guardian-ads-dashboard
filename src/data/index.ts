// ============================================================
// Data Access Layer
// Phase 1: Reads from mock data modules
// Phase 2 (future): Replace with Supabase client queries
// Updated: Added keyword, search term, ad, and time series access
// ============================================================

import type {
  AccountSummary,
  Campaign,
  Keyword,
  SearchTerm,
  Ad,
  BudgetPacing,
  Alert,
  TopMover,
  KpiSummary,
  ProductSummary,
  AccountHealthScore,
  QualityScoreSnapshot,
  GeoPerformance,
  DevicePerformance,
  HourlyPerformance,
  AuctionInsight,
  ConversionAction,
  LandingPage,
  MultiSeriesPoint,
  Filters,
  Product,
} from './types'

// --- Helpers ---

function filterByDateRange<T extends { date: string }>(data: T[], filters?: Filters): T[] {
  if (!filters?.dateRange || filters.dateRange === 'custom') return data
  const now = new Date('2026-02-12')
  let daysBack = 30
  switch (filters.dateRange) {
    case '7d': daysBack = 7; break
    case '14d': daysBack = 14; break
    case '30d': daysBack = 30; break
    case '90d': daysBack = 90; break
    case 'ytd': {
      const start = new Date(now.getFullYear(), 0, 1)
      daysBack = Math.ceil((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
      break
    }
  }
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - daysBack)
  const cutoffStr = cutoff.toISOString().split('T')[0]!
  return data.filter((d) => d.date >= cutoffStr)
}

// --- Account ---

export async function getAccountSummary(_filters?: Filters): Promise<AccountSummary[]> {
  const { accountData } = await import('./mock/accounts')
  return accountData
}

export async function getLatestAccountSummary(): Promise<AccountSummary> {
  const data = await getAccountSummary()
  return data[data.length - 1]!
}

// --- Campaigns ---

export async function getCampaignPerformance(filters?: Filters): Promise<Campaign[]> {
  const { campaignData } = await import('./mock/campaigns')
  let filtered = filterByDateRange(campaignData, filters)

  if (filters?.products?.length) {
    filtered = filtered.filter((c) => filters.products!.includes(c.product))
  }
  if (filters?.intentBuckets?.length) {
    filtered = filtered.filter((c) => filters.intentBuckets!.includes(c.intentBucket))
  }
  if (filters?.campaignStatus?.length) {
    filtered = filtered.filter((c) => filters.campaignStatus!.includes(c.status))
  }

  return filtered
}

export async function getCampaignSummary(): Promise<{
  campaigns: Campaign[]
  byProduct: Record<Product, Campaign[]>
}> {
  const campaigns = await getCampaignPerformance()
  const dates = [...new Set(campaigns.map((c) => c.date))].sort()
  const latestDate = dates[dates.length - 1]!
  const latest = campaigns.filter((c) => c.date === latestDate)

  const byProduct: Record<string, Campaign[]> = {}
  for (const campaign of latest) {
    if (!byProduct[campaign.product]) {
      byProduct[campaign.product] = []
    }
    byProduct[campaign.product]!.push(campaign)
  }

  return { campaigns: latest, byProduct: byProduct as Record<Product, Campaign[]> }
}

// --- Keywords ---

export async function getKeywordPerformance(filters?: Filters): Promise<Keyword[]> {
  const { keywordData } = await import('./mock/keywords')
  let filtered = filterByDateRange(keywordData, filters)

  if (filters?.products?.length) {
    const campaigns = await getCampaignPerformance(filters)
    const campaignIds = new Set(campaigns.map((c) => c.id.split('-').slice(0, 3).join('-')))
    filtered = filtered.filter((k) => {
      // match by campaign name product
      return filters.products!.some((p) =>
        k.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
      )
    })
  }

  return filtered
}

export async function getKeywordSummaryByDate(): Promise<Keyword[]> {
  const { keywordData } = await import('./mock/keywords')
  const dates = [...new Set(keywordData.map((k) => k.date))].sort()
  const latestDate = dates[dates.length - 1]!
  return keywordData.filter((k) => k.date === latestDate)
}

// --- Search Terms ---

export async function getSearchTermReport(filters?: Filters): Promise<SearchTerm[]> {
  const { searchTermData } = await import('./mock/search-terms')
  let filtered = filterByDateRange(searchTermData, filters)

  if (filters?.products?.length) {
    filtered = filtered.filter((t) =>
      filters.products!.some((p) =>
        t.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
      )
    )
  }

  return filtered
}

export async function getSearchTermSummary(): Promise<{
  winners: SearchTerm[]
  losers: SearchTerm[]
  newTerms: SearchTerm[]
  neutral: SearchTerm[]
}> {
  const { searchTermData } = await import('./mock/search-terms')
  // Aggregate by search term (sum across dates)
  const termMap = new Map<string, SearchTerm & { _count: number }>()

  for (const t of searchTermData) {
    const existing = termMap.get(t.searchTerm)
    if (existing) {
      existing.spend += t.spend
      existing.impressions += t.impressions
      existing.clicks += t.clicks
      existing.conversions += t.conversions
      existing.conversionValue += t.conversionValue
      existing._count++
    } else {
      termMap.set(t.searchTerm, { ...t, _count: 1 })
    }
  }

  const aggregated = Array.from(termMap.values()).map((t) => ({
    ...t,
    cpa: t.conversions > 0 ? Math.round((t.spend / t.conversions) * 100) / 100 : 0,
    ctr: t.impressions > 0 ? Math.round((t.clicks / t.impressions) * 10000) / 100 : 0,
  }))

  return {
    winners: aggregated.filter((t) => t.label === 'Winner'),
    losers: aggregated.filter((t) => t.label === 'Loser'),
    newTerms: aggregated.filter((t) => t.label === 'New'),
    neutral: aggregated.filter((t) => t.label === 'Neutral'),
  }
}

// --- Ads ---

export async function getAdPerformance(filters?: Filters): Promise<Ad[]> {
  const { adData } = await import('./mock/ads')
  let filtered = filterByDateRange(adData, filters)

  if (filters?.products?.length) {
    filtered = filtered.filter((a) =>
      filters.products!.some((p) =>
        a.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
      )
    )
  }

  return filtered
}

export async function getAdSummary(): Promise<{
  ads: Ad[]
  byStrength: Record<string, Ad[]>
}> {
  const { adData } = await import('./mock/ads')
  const dates = [...new Set(adData.map((a) => a.date))].sort()
  const latestDate = dates[dates.length - 1]!
  const latest = adData.filter((a) => a.date === latestDate)

  const byStrength: Record<string, Ad[]> = {}
  for (const ad of latest) {
    if (!byStrength[ad.adStrength]) byStrength[ad.adStrength] = []
    byStrength[ad.adStrength]!.push(ad)
  }

  return { ads: latest, byStrength }
}

// --- Performance Time Series ---

export async function getPerformanceTimeSeries(
  metric: 'spend' | 'conversions' | 'cpa' | 'roas' | 'clicks' | 'impressions' | 'ctr',
  filters?: Filters
): Promise<MultiSeriesPoint[]> {
  const campaigns = await getCampaignPerformance(filters)

  // Group by date and aggregate
  const dateMap = new Map<string, { spend: number; impressions: number; clicks: number; conversions: number; conversionValue: number }>()

  for (const c of campaigns) {
    const existing = dateMap.get(c.date)
    if (existing) {
      existing.spend += c.spend
      existing.impressions += c.impressions
      existing.clicks += c.clicks
      existing.conversions += c.conversions
      existing.conversionValue += c.conversionValue
    } else {
      dateMap.set(c.date, {
        spend: c.spend,
        impressions: c.impressions,
        clicks: c.clicks,
        conversions: c.conversions,
        conversionValue: c.conversionValue,
      })
    }
  }

  const sorted = [...dateMap.entries()].sort(([a], [b]) => a.localeCompare(b))

  return sorted.map(([date, data]) => {
    let value: number
    switch (metric) {
      case 'spend': value = Math.round(data.spend * 100) / 100; break
      case 'conversions': value = data.conversions; break
      case 'cpa': value = data.conversions > 0 ? Math.round((data.spend / data.conversions) * 100) / 100 : 0; break
      case 'roas': value = data.spend > 0 ? Math.round((data.conversionValue / data.spend) * 100) / 100 : 0; break
      case 'clicks': value = data.clicks; break
      case 'impressions': value = data.impressions; break
      case 'ctr': value = data.impressions > 0 ? Math.round((data.clicks / data.impressions) * 10000) / 100 : 0; break
      default: value = 0
    }
    return { date, value }
  })
}

// --- Budget Pacing ---

export async function getBudgetPacing(): Promise<BudgetPacing[]> {
  const { budgetPacingData } = await import('./mock/budgets')
  return budgetPacingData
}

// --- Alerts ---

export async function getAlerts(): Promise<Alert[]> {
  const { alertsData } = await import('./mock/alerts')
  return alertsData
}

// --- Top Movers ---

export async function getTopMovers(): Promise<TopMover[]> {
  const { topMoversData } = await import('./mock/top-movers')
  return topMoversData
}

// --- KPIs ---

export async function getKpiSummary(): Promise<KpiSummary[]> {
  const { kpiData } = await import('./mock/kpis')
  return kpiData
}

// --- Product Summary ---

export async function getProductSummary(): Promise<ProductSummary[]> {
  const { productSummaryData } = await import('./mock/products')
  return productSummaryData
}

// --- Health Score ---

export async function getAccountHealthScore(): Promise<AccountHealthScore> {
  const { healthScoreData } = await import('./mock/health-score')
  return healthScoreData
}

// --- Quality Score History ---

export async function getQualityScoreHistory(filters?: Filters): Promise<QualityScoreSnapshot[]> {
  const { qualityScoreData } = await import('./mock/quality-scores')
  return filterByDateRange(qualityScoreData, filters)
}

export async function getQualityScoreLatest(): Promise<QualityScoreSnapshot[]> {
  const { qualityScoreData } = await import('./mock/quality-scores')
  const dates = [...new Set(qualityScoreData.map((q) => q.date))].sort()
  const latestDate = dates[dates.length - 1]!
  return qualityScoreData.filter((q) => q.date === latestDate)
}

// --- Geographic Performance ---

export async function getGeoPerformance(filters?: Filters): Promise<GeoPerformance[]> {
  const { geoData } = await import('./mock/geo')
  return filterByDateRange(geoData, filters)
}

export async function getGeoSummary(filters?: Filters): Promise<GeoPerformance[]> {
  const geoData = await getGeoPerformance(filters)

  // Aggregate by state across dates
  const stateMap = new Map<string, GeoPerformance & { _count: number }>()
  for (const g of geoData) {
    const existing = stateMap.get(g.stateCode)
    if (existing) {
      existing.spend += g.spend
      existing.impressions += g.impressions
      existing.clicks += g.clicks
      existing.conversions += g.conversions
      existing.conversionValue += g.conversionValue
      existing._count++
    } else {
      stateMap.set(g.stateCode, { ...g, _count: 1 })
    }
  }

  return Array.from(stateMap.values()).map((g) => ({
    ...g,
    ctr: g.impressions > 0 ? Math.round((g.clicks / g.impressions) * 10000) / 100 : 0,
    cpc: g.clicks > 0 ? Math.round((g.spend / g.clicks) * 100) / 100 : 0,
    cpa: g.conversions > 0 ? Math.round((g.spend / g.conversions) * 100) / 100 : 0,
    roas: g.spend > 0 ? Math.round((g.conversionValue / g.spend) * 100) / 100 : 0,
    convRate: g.clicks > 0 ? Math.round((g.conversions / g.clicks) * 10000) / 100 : 0,
  }))
}

// --- Device Performance ---

export async function getDevicePerformance(filters?: Filters): Promise<DevicePerformance[]> {
  const { deviceData } = await import('./mock/devices')
  return filterByDateRange(deviceData, filters)
}

export async function getDeviceSummary(filters?: Filters): Promise<DevicePerformance[]> {
  const deviceData = await getDevicePerformance(filters)

  // Aggregate by device across dates
  const deviceMap = new Map<string, DevicePerformance & { _count: number }>()
  for (const d of deviceData) {
    const existing = deviceMap.get(d.device)
    if (existing) {
      existing.spend += d.spend
      existing.impressions += d.impressions
      existing.clicks += d.clicks
      existing.conversions += d.conversions
      existing.conversionValue += d.conversionValue
      existing._count++
    } else {
      deviceMap.set(d.device, { ...d, _count: 1 })
    }
  }

  return Array.from(deviceMap.values()).map((d) => ({
    ...d,
    ctr: d.impressions > 0 ? Math.round((d.clicks / d.impressions) * 10000) / 100 : 0,
    cpc: d.clicks > 0 ? Math.round((d.spend / d.clicks) * 100) / 100 : 0,
    cpa: d.conversions > 0 ? Math.round((d.spend / d.conversions) * 100) / 100 : 0,
    roas: d.spend > 0 ? Math.round((d.conversionValue / d.spend) * 100) / 100 : 0,
    convRate: d.clicks > 0 ? Math.round((d.conversions / d.clicks) * 10000) / 100 : 0,
  }))
}

// --- Hourly Performance ---

export async function getHourlyPerformance(filters?: Filters): Promise<HourlyPerformance[]> {
  const { hourlyData } = await import('./mock/hour-of-day')
  return filterByDateRange(hourlyData, filters)
}

// --- Auction Insights (Competitive Intelligence) ---

export async function getAuctionInsights(filters?: Filters): Promise<AuctionInsight[]> {
  const { auctionInsightData } = await import('./mock/auction-insights')
  return filterByDateRange(auctionInsightData, filters)
}

export async function getAuctionInsightsSummary(): Promise<{
  byCompetitor: { competitor: string; impressionShare: number; overlapRate: number; positionAboveRate: number; topOfPageRate: number; outrankingShare: number }[]
  trend: Record<string, string | number>[]
}> {
  const { auctionInsightData } = await import('./mock/auction-insights')

  // Aggregate by competitor across all dates and campaigns
  const compMap = new Map<string, { is: number; overlap: number; posAbove: number; topPage: number; outrank: number; count: number }>()
  for (const ai of auctionInsightData) {
    const existing = compMap.get(ai.competitor)
    if (existing) {
      existing.is += ai.impressionShare
      existing.overlap += ai.overlapRate
      existing.posAbove += ai.positionAboveRate
      existing.topPage += ai.topOfPageRate
      existing.outrank += ai.outrankingShare
      existing.count++
    } else {
      compMap.set(ai.competitor, { is: ai.impressionShare, overlap: ai.overlapRate, posAbove: ai.positionAboveRate, topPage: ai.topOfPageRate, outrank: ai.outrankingShare, count: 1 })
    }
  }

  const byCompetitor = Array.from(compMap.entries()).map(([competitor, data]) => ({
    competitor,
    impressionShare: Math.round((data.is / data.count) * 10) / 10,
    overlapRate: Math.round((data.overlap / data.count) * 10) / 10,
    positionAboveRate: Math.round((data.posAbove / data.count) * 10) / 10,
    topOfPageRate: Math.round((data.topPage / data.count) * 10) / 10,
    outrankingShare: Math.round((data.outrank / data.count) * 10) / 10,
  })).sort((a, b) => b.impressionShare - a.impressionShare)

  // Trend by date: avg IS per competitor per day
  const dateCompMap = new Map<string, Map<string, { is: number; count: number }>>()
  for (const ai of auctionInsightData) {
    let dateMap = dateCompMap.get(ai.date)
    if (!dateMap) { dateMap = new Map(); dateCompMap.set(ai.date, dateMap) }
    const existing = dateMap.get(ai.competitor)
    if (existing) { existing.is += ai.impressionShare; existing.count++ }
    else { dateMap.set(ai.competitor, { is: ai.impressionShare, count: 1 }) }
  }

  const competitorNames = byCompetitor.map((c) => c.competitor)
  const trend = [...dateCompMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, compMap]) => {
      const point: Record<string, string | number> = { date }
      for (const name of competitorNames) {
        const data = compMap.get(name)
        point[name] = data ? Math.round((data.is / data.count) * 10) / 10 : 0
      }
      return point
    })

  return { byCompetitor, trend }
}

// --- Conversion Actions ---

export async function getConversionActions(filters?: Filters): Promise<ConversionAction[]> {
  const { conversionData } = await import('./mock/conversions')
  let filtered = filterByDateRange(conversionData, filters)
  if (filters?.products?.length) {
    filtered = filtered.filter((c) => filters.products!.includes(c.product))
  }
  return filtered
}

export async function getConversionSummary(): Promise<{
  byType: { type: string; lastClick: number; assisted: number; totalValue: number }[]
  byProduct: { product: Product; conversions: number; value: number }[]
  trend: { date: string; Call: number; Form: number; Quote: number; Chat: number }[]
}> {
  const { conversionData } = await import('./mock/conversions')

  // By conversion type with attribution split
  const typeMap = new Map<string, { lastClick: number; assisted: number; totalValue: number }>()
  for (const c of conversionData) {
    const existing = typeMap.get(c.conversionType) || { lastClick: 0, assisted: 0, totalValue: 0 }
    if (c.attribution === 'Last Click') existing.lastClick += c.conversions
    else existing.assisted += c.conversions
    existing.totalValue += c.conversionValue
    typeMap.set(c.conversionType, existing)
  }
  const byType = Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data }))

  // By product
  const prodMap = new Map<Product, { conversions: number; value: number }>()
  for (const c of conversionData) {
    const existing = prodMap.get(c.product) || { conversions: 0, value: 0 }
    existing.conversions += c.conversions
    existing.value += c.conversionValue
    prodMap.set(c.product, existing)
  }
  const byProduct = Array.from(prodMap.entries()).map(([product, data]) => ({ product, ...data }))

  // Trend by date (total conversions by type)
  const dateMap = new Map<string, { Call: number; Form: number; Quote: number; Chat: number }>()
  for (const c of conversionData) {
    const existing = dateMap.get(c.date) || { Call: 0, Form: 0, Quote: 0, Chat: 0 }
    existing[c.conversionType] += c.conversions
    dateMap.set(c.date, existing)
  }
  const trend = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  return { byType, byProduct, trend }
}

// --- Landing Page Performance ---

export async function getLandingPages(filters?: Filters): Promise<LandingPage[]> {
  const { landingPageData } = await import('./mock/landing-pages')
  return filterByDateRange(landingPageData, filters)
}

export async function getLandingPageSummary(): Promise<LandingPage[]> {
  const { landingPageData } = await import('./mock/landing-pages')

  // Aggregate by URL across dates
  const urlMap = new Map<string, LandingPage & { _count: number; _mobileTotal: number; _desktopTotal: number }>()
  for (const lp of landingPageData) {
    const existing = urlMap.get(lp.url)
    if (existing) {
      existing.sessions += lp.sessions
      existing.conversions += lp.conversions
      existing.conversionValue += lp.conversionValue
      existing._mobileTotal += lp.mobileConvRate
      existing._desktopTotal += lp.desktopConvRate
      existing._count++
    } else {
      urlMap.set(lp.url, { ...lp, _count: 1, _mobileTotal: lp.mobileConvRate, _desktopTotal: lp.desktopConvRate })
    }
  }

  return Array.from(urlMap.values()).map((lp) => ({
    ...lp,
    bounceRate: Math.round((lp.bounceRate) * 10) / 10,
    conversionRate: lp.sessions > 0 ? Math.round((lp.conversions / lp.sessions) * 1000) / 10 : 0,
    mobileConvRate: Math.round((lp._mobileTotal / lp._count) * 10) / 10,
    desktopConvRate: Math.round((lp._desktopTotal / lp._count) * 10) / 10,
  })).sort((a, b) => b.conversions - a.conversions)
}

// --- Product Performance Time Series (for Product Analytics page) ---

export async function getProductTimeSeries(
  metric: 'spend' | 'conversions' | 'cpa' | 'roas',
): Promise<Record<string, string | number>[]> {
  const campaigns = await getCampaignPerformance()

  const dateProductMap = new Map<string, Map<Product, { spend: number; conversions: number; conversionValue: number }>>()

  for (const c of campaigns) {
    let dateMap = dateProductMap.get(c.date)
    if (!dateMap) { dateMap = new Map(); dateProductMap.set(c.date, dateMap) }
    const existing = dateMap.get(c.product)
    if (existing) {
      existing.spend += c.spend
      existing.conversions += c.conversions
      existing.conversionValue += c.conversionValue
    } else {
      dateMap.set(c.product, { spend: c.spend, conversions: c.conversions, conversionValue: c.conversionValue })
    }
  }

  const products: Product[] = ['Term Life', 'Disability', 'Annuities', 'Dental Network', 'Group Benefits']
  return [...dateProductMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, productMap]) => {
      const point: Record<string, string | number> = { date }
      for (const p of products) {
        const data = productMap.get(p)
        if (!data) { point[p] = 0; continue }
        switch (metric) {
          case 'spend': point[p] = Math.round(data.spend * 100) / 100; break
          case 'conversions': point[p] = data.conversions; break
          case 'cpa': point[p] = data.conversions > 0 ? Math.round((data.spend / data.conversions) * 100) / 100 : 0; break
          case 'roas': point[p] = data.spend > 0 ? Math.round((data.conversionValue / data.spend) * 100) / 100 : 0; break
        }
      }
      return point
    })
}

export async function getHourlyHeatmapData(
  metric: 'spend' | 'conversions' | 'cpa' | 'clicks',
  filters?: Filters
): Promise<{ dayOfWeek: number; hour: number; value: number }[]> {
  const hourlyData = await getHourlyPerformance(filters)

  // Aggregate by dayOfWeek x hour
  const grid = new Map<string, { spend: number; clicks: number; conversions: number; count: number }>()

  for (const h of hourlyData) {
    const key = `${h.dayOfWeek}-${h.hour}`
    const existing = grid.get(key)
    if (existing) {
      existing.spend += h.spend
      existing.clicks += h.clicks
      existing.conversions += h.conversions
      existing.count++
    } else {
      grid.set(key, { spend: h.spend, clicks: h.clicks, conversions: h.conversions, count: 1 })
    }
  }

  return Array.from(grid.entries()).map(([key, data]) => {
    const [dow, hr] = key.split('-').map(Number)
    let value: number
    switch (metric) {
      case 'spend': value = Math.round((data.spend / data.count) * 100) / 100; break
      case 'conversions': value = Math.round((data.conversions / data.count) * 100) / 100; break
      case 'cpa': value = data.conversions > 0 ? Math.round((data.spend / data.conversions) * 100) / 100 : 0; break
      case 'clicks': value = Math.round((data.clicks / data.count) * 100) / 100; break
      default: value = 0
    }
    return { dayOfWeek: dow!, hour: hr!, value }
  })
}
