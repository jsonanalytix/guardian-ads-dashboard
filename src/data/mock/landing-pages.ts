// Mock landing page performance data
import type { LandingPage } from '../types'

interface LPConfig {
  url: string
  sessionsRange: [number, number]
  bounceRange: [number, number]
  convRateRange: [number, number]
  avgConvValue: number
  mobileConvRateAdj: number // multiplier vs desktop
}

const lpConfigs: LPConfig[] = [
  {
    url: 'guardian.com/life-insurance/term-life-quote',
    sessionsRange: [280, 420], bounceRange: [32, 42], convRateRange: [5.2, 7.8],
    avgConvValue: 420, mobileConvRateAdj: 0.72,
  },
  {
    url: 'guardian.com/life-insurance/term-life',
    sessionsRange: [350, 500], bounceRange: [38, 48], convRateRange: [3.8, 5.5],
    avgConvValue: 380, mobileConvRateAdj: 0.68,
  },
  {
    url: 'guardian.com/disability-insurance',
    sessionsRange: [180, 300], bounceRange: [35, 45], convRateRange: [4.5, 6.5],
    avgConvValue: 310, mobileConvRateAdj: 0.75,
  },
  {
    url: 'guardian.com/disability-insurance/quote',
    sessionsRange: [140, 220], bounceRange: [30, 38], convRateRange: [5.8, 8.2],
    avgConvValue: 340, mobileConvRateAdj: 0.70,
  },
  {
    url: 'guardian.com/annuities/fixed-annuity',
    sessionsRange: [120, 200], bounceRange: [40, 52], convRateRange: [2.8, 4.5],
    avgConvValue: 560, mobileConvRateAdj: 0.62,
  },
  {
    url: 'guardian.com/annuities/retirement-planning',
    sessionsRange: [150, 250], bounceRange: [42, 55], convRateRange: [2.2, 3.8],
    avgConvValue: 520, mobileConvRateAdj: 0.58,
  },
  {
    url: 'guardian.com/dental-insurance',
    sessionsRange: [320, 480], bounceRange: [28, 38], convRateRange: [6.0, 8.5],
    avgConvValue: 170, mobileConvRateAdj: 0.80,
  },
  {
    url: 'guardian.com/dental-insurance/plans',
    sessionsRange: [200, 340], bounceRange: [32, 42], convRateRange: [5.0, 7.2],
    avgConvValue: 160, mobileConvRateAdj: 0.78,
  },
  {
    url: 'guardian.com/group-benefits/employers',
    sessionsRange: [100, 180], bounceRange: [35, 48], convRateRange: [3.5, 5.5],
    avgConvValue: 240, mobileConvRateAdj: 0.55,
  },
  {
    url: 'guardian.com/group-benefits',
    sessionsRange: [80, 150], bounceRange: [40, 52], convRateRange: [2.5, 4.2],
    avgConvValue: 220, mobileConvRateAdj: 0.52,
  },
  {
    url: 'guardian.com/insurance/get-a-quote',
    sessionsRange: [400, 600], bounceRange: [25, 35], convRateRange: [6.5, 9.0],
    avgConvValue: 350, mobileConvRateAdj: 0.74,
  },
  {
    url: 'guardian.com/about/why-guardian',
    sessionsRange: [180, 280], bounceRange: [55, 68], convRateRange: [1.2, 2.5],
    avgConvValue: 280, mobileConvRateAdj: 0.65,
  },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateLandingPageData(): LandingPage[] {
  const data: LandingPage[] = []
  const baseDate = new Date('2026-02-12')
  let idCounter = 1

  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]!
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const mult = isWeekend ? 0.65 : 1.0

    for (const cfg of lpConfigs) {
      const sessions = Math.round(rand(cfg.sessionsRange[0], cfg.sessionsRange[1]) * mult)
      const bounceRate = Math.round(rand(cfg.bounceRange[0], cfg.bounceRange[1]) * 10) / 10
      const desktopConvRate = Math.round(rand(cfg.convRateRange[0], cfg.convRateRange[1]) * 10) / 10
      const mobileConvRate = Math.round(desktopConvRate * cfg.mobileConvRateAdj * 10) / 10
      // Overall conversion rate: weighted avg (assume 55% mobile, 45% desktop)
      const conversionRate = Math.round((mobileConvRate * 0.55 + desktopConvRate * 0.45) * 10) / 10
      const conversions = Math.max(1, Math.round(sessions * (conversionRate / 100)))
      const conversionValue = Math.round(conversions * cfg.avgConvValue * rand(0.9, 1.1))

      data.push({
        id: `lp-${idCounter++}`,
        date: dateStr,
        url: cfg.url,
        sessions,
        bounceRate,
        conversionRate,
        conversions,
        conversionValue,
        mobileConvRate,
        desktopConvRate,
      })
    }
  }

  return data
}

export const landingPageData = generateLandingPageData()
