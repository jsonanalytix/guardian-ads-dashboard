// ============================================================
// Data Access Layer
// Queries Supabase when configured, falls back to mock data.
// Updated: Wired all 11 direct table queries to Supabase.
// ============================================================

import type {
  AccountSummary,
  Campaign,
  CampaignStatus,
  Keyword,
  SearchTerm,
  SearchTermLabel,
  Ad,
  AdStrength,
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

import { isSupabaseConfigured, getSupabaseBrowserClient } from '../lib/supabase'
import { mapRow } from '../lib/case-utils'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STATUS_DB_TO_UI: Record<string, CampaignStatus> = {
  enabled: 'Enabled',
  paused: 'Paused',
  ended: 'Removed',
}

const STATUS_UI_TO_DB: Record<string, string> = {
  Enabled: 'enabled',
  Paused: 'paused',
  Removed: 'ended',
}

const DOW_NAME_TO_NUM: Record<string, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Coerce Supabase `numeric` columns (returned as strings) to JS numbers. */
function num(v: unknown): number {
  if (v == null) return 0
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

/** Decimal fraction → display percentage. Handles null/undefined/strings. */
function pct(v: unknown): number {
  return Math.round(num(v) * 10000) / 100
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

function titleCase(s: string): string {
  if (!s) return s
  return s
    .toLowerCase()
    .split(/[\s_]+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

// ---------------------------------------------------------------------------
// Row Mappers  (Supabase snake_case → TypeScript camelCase + value transforms)
// ---------------------------------------------------------------------------

function toCampaign(row: Record<string, unknown>): Campaign {
  const r = mapRow<Record<string, any>>(row)
  r.status = STATUS_DB_TO_UI[r.status] ?? capitalize(r.status ?? '')
  r.spend = num(r.spend)
  r.impressions = num(r.impressions)
  r.clicks = num(r.clicks)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.cpc = num(r.cpc)
  r.cpa = num(r.cpa)
  r.roas = num(r.roas)
  r.ctr = pct(r.ctr)
  r.convRate = pct(r.convRate)
  r.searchImpressionShare = pct(r.searchImpressionShare)
  r.lostIsBudget = pct(r.lostIsBudget)
  r.lostIsRank = pct(r.lostIsRank)
  return r as Campaign
}

function toKeyword(row: Record<string, unknown>): Keyword {
  const r = mapRow<Record<string, any>>(row)
  r.spend = num(r.spend)
  r.impressions = num(r.impressions)
  r.clicks = num(r.clicks)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.cpc = num(r.cpc)
  r.cpa = num(r.cpa)
  r.roas = num(r.roas)
  r.qualityScore = num(r.qualityScore)
  r.ctr = pct(r.ctr)
  r.convRate = pct(r.convRate)
  return r as Keyword
}

function toSearchTerm(row: Record<string, unknown>): SearchTerm {
  const r = mapRow<Record<string, any>>(row)
  r.label = capitalize(r.label ?? '') as SearchTermLabel
  r.spend = num(r.spend)
  r.impressions = num(r.impressions)
  r.clicks = num(r.clicks)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.cpa = num(r.cpa)
  r.ctr = pct(r.ctr)
  return r as SearchTerm
}

function toAd(row: Record<string, unknown>): Ad {
  const r = mapRow<Record<string, any>>(row)
  r.adStrength = titleCase(r.adStrength ?? '') as AdStrength
  r.spend = num(r.spend)
  r.impressions = num(r.impressions)
  r.clicks = num(r.clicks)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.cpc = num(r.cpc)
  r.cpa = num(r.cpa)
  r.ctr = pct(r.ctr)
  return r as Ad
}

function toGeo(row: Record<string, unknown>): GeoPerformance {
  const r = mapRow<Record<string, any>>(row)
  r.spend = num(r.spend)
  r.impressions = num(r.impressions)
  r.clicks = num(r.clicks)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.cpc = num(r.cpc)
  r.cpa = num(r.cpa)
  r.roas = num(r.roas)
  r.ctr = pct(r.ctr)
  r.convRate = pct(r.convRate)
  return r as GeoPerformance
}

function toDevice(row: Record<string, unknown>): DevicePerformance {
  const r = mapRow<Record<string, any>>(row)
  r.spend = num(r.spend)
  r.impressions = num(r.impressions)
  r.clicks = num(r.clicks)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.cpc = num(r.cpc)
  r.cpa = num(r.cpa)
  r.roas = num(r.roas)
  r.ctr = pct(r.ctr)
  r.convRate = pct(r.convRate)
  return r as DevicePerformance
}

function toHourly(row: Record<string, unknown>): HourlyPerformance {
  const r = mapRow<Record<string, any>>(row)
  r.spend = num(r.spend)
  r.impressions = num(r.impressions)
  r.clicks = num(r.clicks)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.hour = num(r.hour)
  r.dayOfWeek =
    typeof r.dayOfWeek === 'string'
      ? (DOW_NAME_TO_NUM[r.dayOfWeek] ?? 0)
      : (r.dayOfWeek ?? 0)
  return r as HourlyPerformance
}

function toAuctionInsight(row: Record<string, unknown>): AuctionInsight {
  const r = mapRow<Record<string, any>>(row)
  r.impressionShare = pct(r.impressionShare)
  r.overlapRate = pct(r.overlapRate)
  r.positionAboveRate = pct(r.positionAboveRate)
  r.topOfPageRate = pct(r.topOfPageRate)
  r.outrankingShare = pct(r.outrankingShare)
  return r as AuctionInsight
}

function toQualityScore(row: Record<string, unknown>): QualityScoreSnapshot {
  const r = mapRow<Record<string, any>>(row)
  r.qualityScore = num(r.qualityScore)
  r.spend = num(r.spend)
  return r as QualityScoreSnapshot
}

function toConversion(row: Record<string, unknown>): ConversionAction {
  const r = mapRow<Record<string, any>>(row)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  return r as ConversionAction
}

function toLandingPage(row: Record<string, unknown>): LandingPage {
  const r = mapRow<Record<string, any>>(row)
  r.sessions = num(r.sessions)
  r.conversions = num(r.conversions)
  r.conversionValue = num(r.conversionValue)
  r.bounceRate = num(r.bounceRate)
  r.conversionRate = pct(r.conversionRate)
  r.mobileConvRate = num(r.mobileConvRate)
  r.desktopConvRate = num(r.desktopConvRate)
  return r as LandingPage
}

// ---------------------------------------------------------------------------
// Date Filtering
// ---------------------------------------------------------------------------

/**
 * Client-side date filter for mock data.
 * Uses a hardcoded reference date that matches the mock data window.
 */
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

/** Returns a YYYY-MM-DD cutoff string for Supabase .gte() queries. */
function getDateCutoff(filters?: Filters): string | null {
  if (!filters?.dateRange || filters.dateRange === 'custom') return null
  const now = new Date()
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
  return cutoff.toISOString().split('T')[0]!
}

// ---------------------------------------------------------------------------
// Supabase query helper
// ---------------------------------------------------------------------------

function sb() {
  return getSupabaseBrowserClient()
}

// ===================================================================
// Account  (computed from campaigns — mock-only until Step 4)
// ===================================================================

export async function getAccountSummary(_filters?: Filters): Promise<AccountSummary[]> {
  const { accountData } = await import('./mock/accounts')
  return accountData
}

export async function getLatestAccountSummary(): Promise<AccountSummary> {
  const data = await getAccountSummary()
  return data[data.length - 1]!
}

// ===================================================================
// Campaigns  →  Supabase table: campaigns
// ===================================================================

export async function getCampaignPerformance(filters?: Filters): Promise<Campaign[]> {
  if (!isSupabaseConfigured) {
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

  let query = sb().from('campaigns').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)
  if (filters?.products?.length) query = query.in('product', filters.products)
  if (filters?.intentBuckets?.length) query = query.in('intent_bucket', filters.intentBuckets)
  if (filters?.campaignStatus?.length) {
    const dbStatuses = filters.campaignStatus.map((s) => STATUS_UI_TO_DB[s] ?? s.toLowerCase())
    query = query.in('status', dbStatuses)
  }

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toCampaign(row as Record<string, unknown>))
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

// ===================================================================
// Keywords  →  Supabase table: keywords
// ===================================================================

export async function getKeywordPerformance(filters?: Filters): Promise<Keyword[]> {
  if (!isSupabaseConfigured) {
    const { keywordData } = await import('./mock/keywords')
    let filtered = filterByDateRange(keywordData, filters)
    if (filters?.products?.length) {
      filtered = filtered.filter((k) =>
        filters.products!.some((p) =>
          k.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
        )
      )
    }
    return filtered
  }

  let query = sb().from('keywords').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error

  let mapped = (data ?? []).map((row) => toKeyword(row as Record<string, unknown>))

  if (filters?.products?.length) {
    mapped = mapped.filter((k) =>
      filters.products!.some((p) =>
        k.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
      )
    )
  }

  return mapped
}

export async function getKeywordSummaryByDate(): Promise<Keyword[]> {
  if (!isSupabaseConfigured) {
    const { keywordData } = await import('./mock/keywords')
    const dates = [...new Set(keywordData.map((k) => k.date))].sort()
    const latestDate = dates[dates.length - 1]!
    return keywordData.filter((k) => k.date === latestDate)
  }

  const { data, error } = await sb()
    .from('keywords')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)

  if (error) throw error
  const latestDate = (data?.[0] as Record<string, unknown> | undefined)?.date as string | undefined
  if (!latestDate) return []

  const { data: rows, error: err2 } = await sb()
    .from('keywords')
    .select('*')
    .eq('date', latestDate)
    .limit(50000)

  if (err2) throw err2
  return (rows ?? []).map((row) => toKeyword(row as Record<string, unknown>))
}

// ===================================================================
// Search Terms  →  Supabase table: search_terms
// ===================================================================

export async function getSearchTermReport(filters?: Filters): Promise<SearchTerm[]> {
  if (!isSupabaseConfigured) {
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

  let query = sb().from('search_terms').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error

  let mapped = (data ?? []).map((row) => toSearchTerm(row as Record<string, unknown>))

  if (filters?.products?.length) {
    mapped = mapped.filter((t) =>
      filters.products!.some((p) =>
        t.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
      )
    )
  }

  return mapped
}

export async function getSearchTermSummary(): Promise<{
  winners: SearchTerm[]
  losers: SearchTerm[]
  newTerms: SearchTerm[]
  neutral: SearchTerm[]
}> {
  if (!isSupabaseConfigured) {
    const { searchTermData } = await import('./mock/search-terms')
    return aggregateSearchTerms(searchTermData)
  }

  const { data, error } = await sb()
    .from('search_terms')
    .select('*')
    .limit(50000)

  if (error) throw error
  const mapped = (data ?? []).map((row) => toSearchTerm(row as Record<string, unknown>))
  return aggregateSearchTerms(mapped)
}

function aggregateSearchTerms(searchTermData: SearchTerm[]) {
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

// ===================================================================
// Ads  →  Supabase table: ads
// ===================================================================

export async function getAdPerformance(filters?: Filters): Promise<Ad[]> {
  if (!isSupabaseConfigured) {
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

  let query = sb().from('ads').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error

  let mapped = (data ?? []).map((row) => toAd(row as Record<string, unknown>))

  if (filters?.products?.length) {
    mapped = mapped.filter((a) =>
      filters.products!.some((p) =>
        a.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
      )
    )
  }

  return mapped
}

export async function getAdSummary(): Promise<{
  ads: Ad[]
  byStrength: Record<string, Ad[]>
}> {
  if (!isSupabaseConfigured) {
    const { adData } = await import('./mock/ads')
    return buildAdSummary(adData)
  }

  const { data, error } = await sb()
    .from('ads')
    .select('*')
    .limit(50000)

  if (error) throw error
  const mapped = (data ?? []).map((row) => toAd(row as Record<string, unknown>))
  return buildAdSummary(mapped)
}

function buildAdSummary(adData: Ad[]) {
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

// ===================================================================
// Performance Time Series  (derived from campaigns — no direct query)
// ===================================================================

export async function getPerformanceTimeSeries(
  metric: 'spend' | 'conversions' | 'cpa' | 'roas' | 'clicks' | 'impressions' | 'ctr',
  filters?: Filters
): Promise<MultiSeriesPoint[]> {
  const campaigns = await getCampaignPerformance(filters)

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

// ===================================================================
// Budget / Alerts / Top Movers / KPIs / Products / Health
// (computed — mock-only until Step 4)
// ===================================================================

export async function getBudgetPacing(): Promise<BudgetPacing[]> {
  const { budgetPacingData } = await import('./mock/budgets')
  return budgetPacingData
}

export async function getAlerts(): Promise<Alert[]> {
  const { alertsData } = await import('./mock/alerts')
  return alertsData
}

export async function getTopMovers(): Promise<TopMover[]> {
  const { topMoversData } = await import('./mock/top-movers')
  return topMoversData
}

export async function getKpiSummary(): Promise<KpiSummary[]> {
  const { kpiData } = await import('./mock/kpis')
  return kpiData
}

export async function getProductSummary(): Promise<ProductSummary[]> {
  const { productSummaryData } = await import('./mock/products')
  return productSummaryData
}

export async function getAccountHealthScore(): Promise<AccountHealthScore> {
  const { healthScoreData } = await import('./mock/health-score')
  return healthScoreData
}

// ===================================================================
// Quality Score Snapshots  →  Supabase table: quality_score_snapshots
// ===================================================================

export async function getQualityScoreHistory(filters?: Filters): Promise<QualityScoreSnapshot[]> {
  if (!isSupabaseConfigured) {
    const { qualityScoreData } = await import('./mock/quality-scores')
    return filterByDateRange(qualityScoreData, filters)
  }

  let query = sb().from('quality_score_snapshots').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toQualityScore(row as Record<string, unknown>))
}

export async function getQualityScoreLatest(): Promise<QualityScoreSnapshot[]> {
  if (!isSupabaseConfigured) {
    const { qualityScoreData } = await import('./mock/quality-scores')
    const dates = [...new Set(qualityScoreData.map((q) => q.date))].sort()
    const latestDate = dates[dates.length - 1]!
    return qualityScoreData.filter((q) => q.date === latestDate)
  }

  const { data, error } = await sb()
    .from('quality_score_snapshots')
    .select('*')
    .order('date', { ascending: false })
    .limit(1)

  if (error) throw error
  const latestDate = (data?.[0] as Record<string, unknown> | undefined)?.date as string | undefined
  if (!latestDate) return []

  const { data: rows, error: err2 } = await sb()
    .from('quality_score_snapshots')
    .select('*')
    .eq('date', latestDate)
    .limit(50000)

  if (err2) throw err2
  return (rows ?? []).map((row) => toQualityScore(row as Record<string, unknown>))
}

// ===================================================================
// Geographic Performance  →  Supabase table: geo_performance
// ===================================================================

export async function getGeoPerformance(filters?: Filters): Promise<GeoPerformance[]> {
  if (!isSupabaseConfigured) {
    const { geoData } = await import('./mock/geo')
    return filterByDateRange(geoData, filters)
  }

  let query = sb().from('geo_performance').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toGeo(row as Record<string, unknown>))
}

export async function getGeoSummary(filters?: Filters): Promise<GeoPerformance[]> {
  const geoData = await getGeoPerformance(filters)

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

// ===================================================================
// Device Performance  →  Supabase table: device_performance
// ===================================================================

export async function getDevicePerformance(filters?: Filters): Promise<DevicePerformance[]> {
  if (!isSupabaseConfigured) {
    const { deviceData } = await import('./mock/devices')
    return filterByDateRange(deviceData, filters)
  }

  let query = sb().from('device_performance').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toDevice(row as Record<string, unknown>))
}

export async function getDeviceSummary(filters?: Filters): Promise<DevicePerformance[]> {
  const deviceData = await getDevicePerformance(filters)

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

// ===================================================================
// Hourly Performance  →  Supabase table: hourly_performance
// ===================================================================

export async function getHourlyPerformance(filters?: Filters): Promise<HourlyPerformance[]> {
  if (!isSupabaseConfigured) {
    const { hourlyData } = await import('./mock/hour-of-day')
    return filterByDateRange(hourlyData, filters)
  }

  let query = sb().from('hourly_performance').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toHourly(row as Record<string, unknown>))
}

export async function getHourlyHeatmapData(
  metric: 'spend' | 'conversions' | 'cpa' | 'clicks',
  filters?: Filters
): Promise<{ dayOfWeek: number; hour: number; value: number }[]> {
  const hourlyData = await getHourlyPerformance(filters)

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

// ===================================================================
// Auction Insights  →  Supabase table: auction_insights
// ===================================================================

export async function getAuctionInsights(filters?: Filters): Promise<AuctionInsight[]> {
  if (!isSupabaseConfigured) {
    const { auctionInsightData } = await import('./mock/auction-insights')
    return filterByDateRange(auctionInsightData, filters)
  }

  let query = sb().from('auction_insights').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toAuctionInsight(row as Record<string, unknown>))
}

export async function getAuctionInsightsSummary(): Promise<{
  byCompetitor: { competitor: string; impressionShare: number; overlapRate: number; positionAboveRate: number; topOfPageRate: number; outrankingShare: number }[]
  trend: Record<string, string | number>[]
}> {
  if (!isSupabaseConfigured) {
    const { auctionInsightData } = await import('./mock/auction-insights')
    return buildAuctionSummary(auctionInsightData)
  }

  const { data, error } = await sb()
    .from('auction_insights')
    .select('*')
    .limit(50000)

  if (error) throw error
  const mapped = (data ?? []).map((row) => toAuctionInsight(row as Record<string, unknown>))
  return buildAuctionSummary(mapped)
}

function buildAuctionSummary(auctionInsightData: AuctionInsight[]) {
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
    .map(([date, innerMap]) => {
      const point: Record<string, string | number> = { date }
      for (const name of competitorNames) {
        const d = innerMap.get(name)
        point[name] = d ? Math.round((d.is / d.count) * 10) / 10 : 0
      }
      return point
    })

  return { byCompetitor, trend }
}

// ===================================================================
// Conversion Actions  →  Supabase table: conversion_actions
// ===================================================================

export async function getConversionActions(filters?: Filters): Promise<ConversionAction[]> {
  if (!isSupabaseConfigured) {
    const { conversionData } = await import('./mock/conversions')
    let filtered = filterByDateRange(conversionData, filters)
    if (filters?.products?.length) {
      filtered = filtered.filter((c) => filters.products!.includes(c.product))
    }
    return filtered
  }

  let query = sb().from('conversion_actions').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)
  if (filters?.products?.length) query = query.in('product', filters.products)

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toConversion(row as Record<string, unknown>))
}

export async function getConversionSummary(): Promise<{
  byType: { type: string; lastClick: number; assisted: number; totalValue: number }[]
  byProduct: { product: Product; conversions: number; value: number }[]
  trend: { date: string; Call: number; Form: number; Quote: number; Chat: number }[]
}> {
  if (!isSupabaseConfigured) {
    const { conversionData } = await import('./mock/conversions')
    return buildConversionSummary(conversionData)
  }

  const { data, error } = await sb()
    .from('conversion_actions')
    .select('*')
    .limit(50000)

  if (error) throw error
  const mapped = (data ?? []).map((row) => toConversion(row as Record<string, unknown>))
  return buildConversionSummary(mapped)
}

function buildConversionSummary(conversionData: ConversionAction[]) {
  const typeMap = new Map<string, { lastClick: number; assisted: number; totalValue: number }>()
  for (const c of conversionData) {
    const existing = typeMap.get(c.conversionType) || { lastClick: 0, assisted: 0, totalValue: 0 }
    if (c.attribution === 'Last Click') existing.lastClick += c.conversions
    else existing.assisted += c.conversions
    existing.totalValue += c.conversionValue
    typeMap.set(c.conversionType, existing)
  }
  const byType = Array.from(typeMap.entries()).map(([type, data]) => ({ type, ...data }))

  const prodMap = new Map<Product, { conversions: number; value: number }>()
  for (const c of conversionData) {
    const existing = prodMap.get(c.product) || { conversions: 0, value: 0 }
    existing.conversions += c.conversions
    existing.value += c.conversionValue
    prodMap.set(c.product, existing)
  }
  const byProduct = Array.from(prodMap.entries()).map(([product, data]) => ({ product, ...data }))

  const dateMap = new Map<string, { Call: number; Form: number; Quote: number; Chat: number }>()
  for (const c of conversionData) {
    const existing = dateMap.get(c.date) || { Call: 0, Form: 0, Quote: 0, Chat: 0 }
    const key = c.conversionType as keyof typeof existing
    if (key in existing) existing[key] += c.conversions
    dateMap.set(c.date, existing)
  }
  const trend = [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, data]) => ({ date, ...data }))

  return { byType, byProduct, trend }
}

// ===================================================================
// Landing Pages  →  Supabase table: landing_pages
// ===================================================================

export async function getLandingPages(filters?: Filters): Promise<LandingPage[]> {
  if (!isSupabaseConfigured) {
    const { landingPageData } = await import('./mock/landing-pages')
    return filterByDateRange(landingPageData, filters)
  }

  let query = sb().from('landing_pages').select('*')

  const cutoff = getDateCutoff(filters)
  if (cutoff) query = query.gte('date', cutoff)

  const { data, error } = await query.limit(50000)
  if (error) throw error
  return (data ?? []).map((row) => toLandingPage(row as Record<string, unknown>))
}

export async function getLandingPageSummary(): Promise<LandingPage[]> {
  if (!isSupabaseConfigured) {
    const { landingPageData } = await import('./mock/landing-pages')
    return aggregateLandingPages(landingPageData)
  }

  const { data, error } = await sb()
    .from('landing_pages')
    .select('*')
    .limit(50000)

  if (error) throw error
  const mapped = (data ?? []).map((row) => toLandingPage(row as Record<string, unknown>))
  return aggregateLandingPages(mapped)
}

function aggregateLandingPages(landingPageData: LandingPage[]) {
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

// ===================================================================
// Product Performance Time Series  (derived from campaigns)
// ===================================================================

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
