// ============================================================
// Guardian Google Ads Dashboard - TypeScript Interfaces
// These types mirror the eventual Supabase schema and are used
// throughout the application for data access and display.
// ============================================================

// --- Enums / Union Types ---

export type Product =
  | 'Term Life'
  | 'Disability'
  | 'Annuities'
  | 'Dental Network'
  | 'Group Benefits'

export type IntentBucket =
  | 'Brand'
  | 'High Intent'
  | 'Mid Intent'
  | 'Low Intent'
  | 'Competitor'

export type CampaignStatus = 'Enabled' | 'Paused' | 'Removed'

export type MatchType = 'Exact' | 'Phrase' | 'Broad'

export type Device = 'Desktop' | 'Mobile' | 'Tablet'

export type SearchTermLabel = 'Winner' | 'Loser' | 'New' | 'Neutral'

export type AdStrength = 'Excellent' | 'Good' | 'Average' | 'Poor'

export type AlertSeverity = 'critical' | 'warning' | 'info' | 'success'

export type TrendDirection = 'up' | 'down' | 'flat'

export type ProductStrength = 'strong' | 'opportunity' | 'risk'

// --- Core Metric Fields ---

export interface BaseMetrics {
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversionValue: number
}

export interface DerivedMetrics {
  ctr: number         // clicks / impressions * 100
  cpc: number         // spend / clicks
  cpa: number         // spend / conversions
  roas: number        // conversionValue / spend
  convRate: number    // conversions / clicks * 100
}

// --- Account Level ---

export interface AccountSummary {
  date: string
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversionValue: number
  ctr: number
  cpc: number
  cpa: number
  roas: number
  searchImpressionShare: number
  lostIsBudget: number
  lostIsRank: number
}

// --- Campaign Level ---

export interface Campaign extends BaseMetrics, DerivedMetrics {
  id: string
  date: string
  campaignName: string
  product: Product
  intentBucket: IntentBucket
  status: CampaignStatus
  searchImpressionShare: number
  lostIsBudget: number
  lostIsRank: number
}

// --- Ad Group Level ---

export interface AdGroup extends BaseMetrics, DerivedMetrics {
  id: string
  date: string
  campaignId: string
  campaignName: string
  adGroupName: string
  product: Product
}

// --- Keyword Level ---

export interface Keyword extends BaseMetrics, DerivedMetrics {
  id: string
  date: string
  keyword: string
  matchType: MatchType
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  qualityScore: number | null
  expectedCtr: 'Above Average' | 'Average' | 'Below Average' | null
  adRelevance: 'Above Average' | 'Average' | 'Below Average' | null
  landingPageExperience: 'Above Average' | 'Average' | 'Below Average' | null
}

// --- Search Term Level ---

export interface SearchTerm extends BaseMetrics {
  id: string
  date: string
  searchTerm: string
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  matchType: MatchType
  label: SearchTermLabel
  reason?: string
  cpa: number
  ctr: number
}

// --- Ad Level ---

export interface Ad {
  id: string
  date: string
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  headlines: string[]
  descriptions: string[]
  adStrength: AdStrength
  spend: number
  impressions: number
  clicks: number
  conversions: number
  conversionValue: number
  ctr: number
  cpc: number
  cpa: number
}

// --- Geographic Performance ---

export interface GeoPerformance extends BaseMetrics, DerivedMetrics {
  id: string
  date: string
  campaignId: string
  state: string
  stateCode: string
  dma?: string
}

// --- Device Performance ---

export interface DevicePerformance extends BaseMetrics, DerivedMetrics {
  id: string
  date: string
  campaignId: string
  device: Device
}

// --- Hourly Performance ---

export interface HourlyPerformance extends BaseMetrics {
  id: string
  date: string
  campaignId: string
  hour: number        // 0-23
  dayOfWeek: number   // 0=Sunday, 6=Saturday
}

// --- Auction Insights (Competitive) ---

export interface AuctionInsight {
  id: string
  date: string
  campaignId: string
  competitor: string
  impressionShare: number
  overlapRate: number
  positionAboveRate: number
  topOfPageRate: number
  outrankingShare: number
}

// --- Quality Score History ---

export interface QualityScoreSnapshot {
  id: string
  date: string
  keywordId: string
  keyword: string
  campaignId: string
  product: Product
  qualityScore: number
  expectedCtr: 'Above Average' | 'Average' | 'Below Average'
  adRelevance: 'Above Average' | 'Average' | 'Below Average'
  landingPageExperience: 'Above Average' | 'Average' | 'Below Average'
  spend: number
}

// --- Landing Page Performance ---

export interface LandingPage {
  id: string
  date: string
  url: string
  sessions: number
  bounceRate: number
  conversionRate: number
  conversions: number
  conversionValue: number
  mobileConvRate: number
  desktopConvRate: number
}

// --- Conversion Actions ---

export interface ConversionAction {
  id: string
  date: string
  campaignId: string
  product: Product
  conversionType: 'Call' | 'Form' | 'Quote' | 'Chat'
  conversions: number
  conversionValue: number
  attribution: 'Last Click' | 'Assisted'
}

// --- Budget Pacing ---

export interface BudgetPacing {
  product: Product
  monthlyBudget: number
  mtdSpend: number
  mtdTarget: number
  dailyAvgSpend: number
  projectedSpend: number
  pacingPercent: number   // mtdSpend / mtdTarget * 100
  daysRemaining: number
  daysElapsed: number
}

// --- Alerts & Recommendations ---

export interface Alert {
  id: string
  severity: AlertSeverity
  title: string
  description: string
  product?: Product
  metric?: string
  changePercent?: number
  timestamp: string
}

// --- Top Movers ---

export interface TopMover {
  campaignName: string
  product: Product
  metric: string
  currentValue: number
  previousValue: number
  changePercent: number
  direction: TrendDirection
}

// --- KPI Summary (for hero cards) ---

export interface KpiSummary {
  label: string
  value: number
  formattedValue: string
  previousValue: number
  changePercent: number
  direction: TrendDirection
  sparklineData: number[]
}

// --- Product Summary ---

export interface ProductSummary {
  product: Product
  spend: number
  conversions: number
  cpa: number
  roas: number
  impressionShare: number
  strength: ProductStrength
  spendShare: number   // % of total spend
}

// --- Filters ---

export interface Filters {
  dateRange: '7d' | '14d' | '30d' | '90d' | 'ytd' | 'custom'
  startDate?: string
  endDate?: string
  products?: Product[]
  intentBuckets?: IntentBucket[]
  campaignStatus?: CampaignStatus[]
}

// --- Time Series Data Point ---

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface MultiSeriesPoint {
  date: string
  [key: string]: string | number
}

// --- Account Health Score ---

export interface AccountHealthScore {
  overall: number       // 0-100
  components: {
    qualityScore: number
    impressionShare: number
    cpaTrend: number
    budgetPacing: number
    conversionTrend: number
  }
}
