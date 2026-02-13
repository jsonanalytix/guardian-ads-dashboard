// Updated: Phase 5 - added ErrorBoundary wrapper and 404 catch-all route
import { Routes, Route } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { AppShell } from '@/components/layout/app-shell'
import { ExecutiveSummary } from '@/pages/executive/executive-summary'
import { PerformanceOverview } from '@/pages/performance/performance-overview'
import { CampaignPerformance } from '@/pages/performance/campaign-performance'
import { KeywordPerformance } from '@/pages/performance/keyword-performance'
import { SearchTermIntelligence } from '@/pages/performance/search-term-intelligence'
import { AdPerformancePage } from '@/pages/performance/ad-performance'
import { QualityScoreAnalysis } from '@/pages/efficiency/quality-score-analysis'
import { ImpressionShareAnalysis } from '@/pages/efficiency/impression-share-analysis'
import { WastedSpendAnalyzer } from '@/pages/efficiency/wasted-spend-analyzer'
import { GeographicPerformance } from '@/pages/targeting/geographic-performance'
import { DevicePerformancePage } from '@/pages/targeting/device-performance'
import { DayHourAnalysis } from '@/pages/targeting/day-hour-analysis'
import { ProductAnalytics } from '@/pages/products/product-analytics'
import { CompetitiveIntelligence } from '@/pages/competitive/competitive-intelligence'
import { ConversionOverview } from '@/pages/conversions/conversion-overview'
import { LandingPagePerformance } from '@/pages/conversions/landing-page-performance'
import { SettingsPage } from '@/pages/settings/settings-page'
import { NotFoundPage } from '@/pages/not-found'

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider>
        <Routes>
          <Route element={<AppShell />}>
            {/* Executive Summary */}
            <Route index element={<ExecutiveSummary />} />

            {/* Performance Hub (Phase 2) */}
            <Route path="performance/overview" element={<PerformanceOverview />} />
            <Route path="performance/campaigns" element={<CampaignPerformance />} />
            <Route path="performance/keywords" element={<KeywordPerformance />} />
            <Route path="performance/ads" element={<AdPerformancePage />} />
            <Route path="performance/search-terms" element={<SearchTermIntelligence />} />

            {/* Efficiency (Phase 3) */}
            <Route path="efficiency/quality-score" element={<QualityScoreAnalysis />} />
            <Route path="efficiency/impression-share" element={<ImpressionShareAnalysis />} />
            <Route path="efficiency/wasted-spend" element={<WastedSpendAnalyzer />} />

            {/* Targeting (Phase 3) */}
            <Route path="targeting/geo" element={<GeographicPerformance />} />
            <Route path="targeting/devices" element={<DevicePerformancePage />} />
            <Route path="targeting/schedule" element={<DayHourAnalysis />} />

            {/* Products (Phase 4) */}
            <Route path="products" element={<ProductAnalytics />} />

            {/* Competitive (Phase 4) */}
            <Route path="competitive" element={<CompetitiveIntelligence />} />

            {/* Conversions (Phase 4) */}
            <Route path="conversions/overview" element={<ConversionOverview />} />
            <Route path="conversions/landing-pages" element={<LandingPagePerformance />} />

            {/* Settings (Phase 4) */}
            <Route path="settings" element={<SettingsPage />} />

            {/* 404 catch-all (Phase 5) */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </ErrorBoundary>
  )
}
