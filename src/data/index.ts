// ============================================================
// Data Access Layer
// Queries Supabase when configured, falls back to mock data.
// Updated: Wired all 11 direct table queries to Supabase.
// 2026-02-19: Budget pacing now reads editable product budgets from localStorage config.
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
import { DEFAULT_PRODUCT_BUDGETS, getProductBudgets } from '../lib/budget-config'

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

// 2026-02-19: Respect global date-range/product filters for keyword summary.
export async function getKeywordSummaryByDate(filters?: Filters): Promise<Keyword[]> {
  if (!isSupabaseConfigured) {
    const { keywordData } = await import('./mock/keywords')
    const filtered = filterByDateRange(keywordData, filters)
    const dates = [...new Set(filtered.map((k) => k.date))].sort()
    const latestDate = dates[dates.length - 1]!
    if (!latestDate) return []

    let latestRows = filtered.filter((k) => k.date === latestDate)
    if (filters?.products?.length) {
      latestRows = latestRows.filter((k) =>
        filters.products!.some((p) =>
          k.campaignName.toLowerCase().includes(p.toLowerCase().split(' ')[0]!)
        )
      )
    }
    return latestRows
  }

  let query = sb()
    .from('keywords')
    .select('*')
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

  const orderedDates = [...new Set(mapped.map((k) => k.date))].sort()
  const latestDate = orderedDates[orderedDates.length - 1]
  if (!latestDate) return []

  return mapped.filter((k) => k.date === latestDate)
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

// 2026-02-19: Respect global date-range/product filters for search-term summary.
export async function getSearchTermSummary(filters?: Filters): Promise<{
  winners: SearchTerm[]
  losers: SearchTerm[]
  newTerms: SearchTerm[]
  neutral: SearchTerm[]
}> {
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
    return aggregateSearchTerms(filtered)
  }

  let query = sb()
    .from('search_terms')
    .select('*')
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
// (computed from filtered campaign windows)
// ===================================================================

type CampaignTotals = {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversionValue: number
  impressionShare: number
  cpa: number
  roas: number
  ctr: number
}

const ALL_PRODUCTS = Object.keys(DEFAULT_PRODUCT_BUDGETS) as Product[]

function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value))
}

function percentChange(current: number, previous: number): number {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return 0
  if (previous === 0) return current === 0 ? 0 : 100
  return ((current - previous) / previous) * 100
}

function hasMeaningfulPercentBaseline(current: number, previous: number): boolean {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return false
  // Exclude "new from zero" changes (e.g., 0 -> positive) because the % swing is technically
  // correct but not decision-useful when the prior period had no baseline activity.
  if (previous === 0 && current > 0) return false
  // Skip all-zero pairs to avoid filling movers with flat/no-signal entries.
  if (previous === 0 && current === 0) return false
  return true
}

function trendDirection(changePercent: number): 'up' | 'down' | 'flat' {
  if (Math.abs(changePercent) < 0.1) return 'flat'
  return changePercent > 0 ? 'up' : 'down'
}

function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation: 'compact',
    compactDisplay: 'short',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))
}

function aggregateCampaigns(campaigns: Campaign[]): CampaignTotals {
  const spend = campaigns.reduce((sum, c) => sum + c.spend, 0)
  const impressions = campaigns.reduce((sum, c) => sum + c.impressions, 0)
  const clicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
  const conversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
  const conversionValue = campaigns.reduce((sum, c) => sum + c.conversionValue, 0)
  const impressionShareWeighted = campaigns.reduce((sum, c) => sum + c.searchImpressionShare * Math.max(c.impressions, 1), 0)
  const impressionWeight = campaigns.reduce((sum, c) => sum + Math.max(c.impressions, 1), 0)
  const impressionShare = impressionWeight > 0 ? impressionShareWeighted / impressionWeight : 0

  return {
    spend,
    impressions,
    clicks,
    conversions,
    conversionValue,
    impressionShare,
    cpa: conversions > 0 ? spend / conversions : 0,
    roas: spend > 0 ? conversionValue / spend : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
  }
}

function getDateKeys(campaigns: Campaign[]): string[] {
  return [...new Set(campaigns.map((c) => c.date))].sort((a, b) => a.localeCompare(b))
}

function buildSparkline(
  campaigns: Campaign[],
  metric: 'spend' | 'conversions' | 'cpa' | 'roas' | 'ctr' | 'impressionShare'
): number[] {
  const dateMap = new Map<string, Campaign[]>()
  for (const c of campaigns) {
    if (!dateMap.has(c.date)) dateMap.set(c.date, [])
    dateMap.get(c.date)!.push(c)
  }

  return [...dateMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, rows]) => {
      const totals = aggregateCampaigns(rows)
      switch (metric) {
        case 'spend': return Math.round(totals.spend * 100) / 100
        case 'conversions': return Math.round(totals.conversions)
        case 'cpa': return Math.round(totals.cpa * 100) / 100
        case 'roas': return Math.round(totals.roas * 100) / 100
        case 'ctr': return Math.round(totals.ctr * 100) / 100
        case 'impressionShare': return Math.round(totals.impressionShare * 100) / 100
        default: return 0
      }
    })
}

async function getCurrentAndPreviousCampaignWindows(filters?: Filters): Promise<{
  current: Campaign[]
  previous: Campaign[]
}> {
  const current = await getCampaignPerformance(filters)
  const all = await getCampaignPerformance({
    ...filters,
    dateRange: 'custom',
  })

  const currentDates = getDateKeys(current)
  const allDates = getDateKeys(all)
  if (currentDates.length === 0 || allDates.length === 0) return { current, previous: [] }

  const startDate = currentDates[0]!
  const startIndex = allDates.indexOf(startDate)
  const prevStart = Math.max(0, startIndex - currentDates.length)
  const previousDates = allDates.slice(prevStart, startIndex)
  const previousDateSet = new Set(previousDates)

  let previous = all.filter((c) => previousDateSet.has(c.date))
  if (previous.length === 0) {
    const fallbackSet = new Set(currentDates.slice(0, Math.min(7, currentDates.length)))
    previous = all.filter((c) => fallbackSet.has(c.date))
  }

  return { current, previous }
}

export async function getBudgetPacing(filters?: Filters): Promise<BudgetPacing[]> {
  const campaigns = await getCampaignPerformance(filters)
  const productBudgets = getProductBudgets()
  const dateKeys = getDateKeys(campaigns)
  const daysElapsed = Math.max(dateKeys.length, 1)

  const latestDate = dateKeys.length > 0 ? new Date(dateKeys[dateKeys.length - 1]!) : new Date()
  const daysInMonth = new Date(latestDate.getFullYear(), latestDate.getMonth() + 1, 0).getDate()
  const daysRemaining = Math.max(daysInMonth - daysElapsed, 0)

  const spendByProduct = new Map<Product, number>()
  for (const c of campaigns) {
    spendByProduct.set(c.product, (spendByProduct.get(c.product) ?? 0) + c.spend)
  }

  return ALL_PRODUCTS.map((product) => {
    const monthlyBudget = productBudgets[product]
    const mtdSpend = Math.round(spendByProduct.get(product) ?? 0)
    const mtdTarget = Math.round((monthlyBudget / daysInMonth) * daysElapsed)
    const dailyAvgSpend = Math.round(mtdSpend / daysElapsed)
    const projectedSpend = Math.round(dailyAvgSpend * daysInMonth)
    const pacingPercent = mtdTarget > 0 ? Math.round((mtdSpend / mtdTarget) * 100) : 0

    return {
      product,
      monthlyBudget,
      mtdSpend,
      mtdTarget,
      dailyAvgSpend,
      projectedSpend,
      pacingPercent,
      daysRemaining,
      daysElapsed,
    }
  })
}

export async function getAlerts(filters?: Filters): Promise<Alert[]> {
  const [movers, budgets] = await Promise.all([getTopMovers(filters), getBudgetPacing(filters)])

  const alerts: Alert[] = []
  const now = new Date().toISOString()

  for (const mover of movers.slice(0, 4)) {
    const metric = mover.metric
    const pct = mover.changePercent
    const severity: Alert['severity'] =
      metric === 'CPA' && pct > 15
        ? 'critical'
        : Math.abs(pct) > 20
        ? metric === 'Conversions' && pct > 0
          ? 'success'
          : 'warning'
        : 'info'

    alerts.push({
      id: `mover-${mover.campaignName}-${metric}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      severity,
      title: `${mover.campaignName} ${metric} ${pct >= 0 ? 'up' : 'down'} ${Math.abs(pct).toFixed(1)}%`,
      description: `Compared to the prior period, ${mover.campaignName} moved from ${mover.previousValue.toFixed(2)} to ${mover.currentValue.toFixed(2)} on ${metric}.`,
      product: mover.product,
      metric,
      changePercent: Math.round(pct * 10) / 10,
      timestamp: now,
    })
  }

  const underPaced = budgets.filter((b) => b.pacingPercent < 85).sort((a, b) => a.pacingPercent - b.pacingPercent)[0]
  if (underPaced) {
    alerts.push({
      id: `budget-under-${underPaced.product}`.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      severity: 'warning',
      title: `${underPaced.product} under pacing at ${underPaced.pacingPercent}%`,
      description: `${underPaced.product} is spending below pace and may miss monthly volume goals.`,
      product: underPaced.product,
      metric: 'Budget Pacing',
      changePercent: underPaced.pacingPercent - 100,
      timestamp: now,
    })
  }

  return alerts.slice(0, 6)
}

export async function getTopMovers(filters?: Filters): Promise<TopMover[]> {
  const { current, previous } = await getCurrentAndPreviousCampaignWindows(filters)
  if (current.length === 0) return []

  const buildByCampaign = (rows: Campaign[]) => {
    const map = new Map<string, Campaign & { _count: number }>()
    for (const c of rows) {
      const existing = map.get(c.campaignName)
      if (existing) {
        existing.spend += c.spend
        existing.impressions += c.impressions
        existing.clicks += c.clicks
        existing.conversions += c.conversions
        existing.conversionValue += c.conversionValue
        existing._count++
      } else {
        map.set(c.campaignName, { ...c, _count: 1 })
      }
    }
    return map
  }

  const currentByCampaign = buildByCampaign(current)
  const previousByCampaign = buildByCampaign(previous)
  const names = new Set([...currentByCampaign.keys(), ...previousByCampaign.keys()])
  const movers: TopMover[] = []

  for (const campaignName of names) {
    const curr = currentByCampaign.get(campaignName)
    const prev = previousByCampaign.get(campaignName)
    if (!curr) continue

    const currentCtr = curr.impressions > 0 ? (curr.clicks / curr.impressions) * 100 : 0
    const previousCtr = prev && prev.impressions > 0 ? (prev.clicks / prev.impressions) * 100 : 0
    const currentCpa = curr.conversions > 0 ? curr.spend / curr.conversions : 0
    const previousCpa = prev && prev.conversions > 0 ? prev.spend / prev.conversions : 0
    const currentRoas = curr.spend > 0 ? curr.conversionValue / curr.spend : 0
    const previousRoas = prev && prev.spend > 0 ? prev.conversionValue / prev.spend : 0

    const candidates: Array<{
      metric: TopMover['metric']
      currentValue: number
      previousValue: number
      changePercent: number
    }> = [
      {
        metric: 'Conversions',
        currentValue: curr.conversions,
        previousValue: prev?.conversions ?? 0,
        changePercent: percentChange(curr.conversions, prev?.conversions ?? 0),
      },
      {
        metric: 'CPA',
        currentValue: currentCpa,
        previousValue: previousCpa,
        changePercent: percentChange(currentCpa, previousCpa),
      },
      {
        metric: 'ROAS',
        currentValue: currentRoas,
        previousValue: previousRoas,
        changePercent: percentChange(currentRoas, previousRoas),
      },
      {
        metric: 'CTR',
        currentValue: currentCtr,
        previousValue: previousCtr,
        changePercent: percentChange(currentCtr, previousCtr),
      },
    ]

    const best = candidates
      .filter((candidate) => hasMeaningfulPercentBaseline(candidate.currentValue, candidate.previousValue))
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))[0]
    if (!best || !Number.isFinite(best.changePercent)) continue

    movers.push({
      campaignName,
      product: curr.product,
      metric: best.metric,
      currentValue: Math.round(best.currentValue * 100) / 100,
      previousValue: Math.round(best.previousValue * 100) / 100,
      changePercent: Math.round(best.changePercent * 10) / 10,
      direction: trendDirection(best.changePercent),
    })
  }

  return movers
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 8)
}

export async function getKpiSummary(filters?: Filters): Promise<KpiSummary[]> {
  const { current, previous } = await getCurrentAndPreviousCampaignWindows(filters)
  const currentTotals = aggregateCampaigns(current)
  const previousTotals = aggregateCampaigns(previous)

  const kpis: Array<{
    label: KpiSummary['label']
    current: number
    previous: number
    metric: 'spend' | 'conversions' | 'cpa' | 'roas' | 'ctr' | 'impressionShare'
    format: (v: number) => string
  }> = [
    {
      label: 'Total Spend',
      current: currentTotals.spend,
      previous: previousTotals.spend,
      metric: 'spend',
      format: formatCompactCurrency,
    },
    {
      label: 'Conversions',
      current: currentTotals.conversions,
      previous: previousTotals.conversions,
      metric: 'conversions',
      format: formatInteger,
    },
    {
      label: 'CPA',
      current: currentTotals.cpa,
      previous: previousTotals.cpa,
      metric: 'cpa',
      format: (v) => `$${v.toFixed(2)}`,
    },
    {
      label: 'ROAS',
      current: currentTotals.roas,
      previous: previousTotals.roas,
      metric: 'roas',
      format: (v) => `${v.toFixed(1)}x`,
    },
    {
      label: 'CTR',
      current: currentTotals.ctr,
      previous: previousTotals.ctr,
      metric: 'ctr',
      format: (v) => `${v.toFixed(1)}%`,
    },
    {
      label: 'Impression Share',
      current: currentTotals.impressionShare,
      previous: previousTotals.impressionShare,
      metric: 'impressionShare',
      format: (v) => `${v.toFixed(1)}%`,
    },
  ]

  return kpis.map((kpi) => {
    const changePercent = percentChange(kpi.current, kpi.previous)
    return {
      label: kpi.label,
      value: Math.round(kpi.current * 100) / 100,
      formattedValue: kpi.format(kpi.current),
      previousValue: Math.round(kpi.previous * 100) / 100,
      changePercent: Math.round(changePercent * 10) / 10,
      direction: trendDirection(changePercent),
      sparklineData: buildSparkline(current, kpi.metric),
    }
  })
}

export async function getProductSummary(filters?: Filters): Promise<ProductSummary[]> {
  const campaigns = await getCampaignPerformance(filters)
  const totalsByProduct = new Map<Product, Campaign[]>()

  for (const c of campaigns) {
    if (!totalsByProduct.has(c.product)) totalsByProduct.set(c.product, [])
    totalsByProduct.get(c.product)!.push(c)
  }

  const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)

  return ALL_PRODUCTS.map((product) => {
    const rows = totalsByProduct.get(product) ?? []
    const totals = aggregateCampaigns(rows)
    const spendShare = totalSpend > 0 ? (totals.spend / totalSpend) * 100 : 0
    const cpa = totals.cpa
    const roas = totals.roas
    const impressionShare = totals.impressionShare

    let strength: ProductSummary['strength'] = 'opportunity'
    if (roas >= 3 && cpa <= 120 && impressionShare >= 65) strength = 'strong'
    else if (roas < 2.5 || cpa > 150 || impressionShare < 55) strength = 'risk'

    return {
      product,
      spend: Math.round(totals.spend),
      conversions: Math.round(totals.conversions),
      cpa: Math.round(cpa * 100) / 100,
      roas: Math.round(roas * 10) / 10,
      impressionShare: Math.round(impressionShare * 10) / 10,
      strength,
      spendShare: Math.round(spendShare * 10) / 10,
    }
  }).sort((a, b) => b.spend - a.spend)
}

export async function getAccountHealthScore(filters?: Filters): Promise<AccountHealthScore> {
  const [{ current, previous }, qualityHistory, budgets] = await Promise.all([
    getCurrentAndPreviousCampaignWindows(filters),
    getQualityScoreHistory(filters),
    getBudgetPacing(filters),
  ])

  const currentTotals = aggregateCampaigns(current)
  const previousTotals = aggregateCampaigns(previous)

  const avgQuality = qualityHistory.length
    ? qualityHistory.reduce((sum, q) => sum + q.qualityScore, 0) / qualityHistory.length
    : 7
  const qualityScore = clamp(Math.round(avgQuality * 10))
  const impressionShare = clamp(Math.round(currentTotals.impressionShare))

  const cpaDelta = percentChange(currentTotals.cpa, previousTotals.cpa)
  const cpaTrend = clamp(Math.round(70 - cpaDelta))

  const conversionDelta = percentChange(currentTotals.conversions, previousTotals.conversions)
  const conversionTrend = clamp(Math.round(70 + conversionDelta))

  const totalMtdSpend = budgets.reduce((sum, b) => sum + b.mtdSpend, 0)
  const totalMtdTarget = budgets.reduce((sum, b) => sum + b.mtdTarget, 0)
  const pacingPct = totalMtdTarget > 0 ? (totalMtdSpend / totalMtdTarget) * 100 : 100
  const budgetPacing = clamp(Math.round(100 - Math.abs(pacingPct - 100) * 2))

  const overall = Math.round(
    (qualityScore + impressionShare + cpaTrend + budgetPacing + conversionTrend) / 5
  )

  return {
    overall,
    components: {
      qualityScore,
      impressionShare,
      cpaTrend,
      budgetPacing,
      conversionTrend,
    },
  }
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
