// Mock ad (RSA) performance data
// Responsive Search Ads with headline/description performance
import type { Ad, AdStrength, Product } from '../types'

interface AdConfig {
  campaignId: string
  campaignName: string
  adGroupId: string
  adGroupName: string
  product: Product
  headlines: string[]
  descriptions: string[]
  adStrength: AdStrength
  dailySpend: [number, number]
  ctrRange: [number, number]
  convRateRange: [number, number]
}

const adConfigs: AdConfig[] = [
  // Term Life RSAs
  {
    campaignId: 'camp-tl-brand', campaignName: 'Term Life - Brand', adGroupId: 'ag-tl-brand-1', adGroupName: 'Brand - Core', product: 'Term Life',
    headlines: ['Guardian Term Life Insurance', 'Get a Free Quote Today', 'Protect Your Family', 'Affordable Term Life', 'Trusted Since 1860', 'Apply Online in Minutes'],
    descriptions: ['Guardian offers affordable term life insurance to protect what matters most. Get a free quote in minutes.', 'Join millions who trust Guardian for their life insurance needs. Flexible terms, competitive rates.'],
    adStrength: 'Excellent', dailySpend: [180, 240], ctrRange: [0.09, 0.13], convRateRange: [0.05, 0.065],
  },
  {
    campaignId: 'camp-tl-hi', campaignName: 'Term Life - High Intent', adGroupId: 'ag-tl-quotes-1', adGroupName: 'Quotes', product: 'Term Life',
    headlines: ['Term Life Insurance Quotes', 'Compare Rates Online', 'Get Your Free Quote', 'Coverage Starting at $15/mo', 'No Medical Exam Plans', 'Instant Online Approval'],
    descriptions: ['Compare term life insurance quotes from Guardian. Affordable coverage for every budget. Apply now.', 'Protect your family with Guardian term life. Get a personalized quote in under 2 minutes.'],
    adStrength: 'Good', dailySpend: [350, 450], ctrRange: [0.055, 0.075], convRateRange: [0.035, 0.048],
  },
  {
    campaignId: 'camp-tl-mid', campaignName: 'Term Life - Mid Funnel', adGroupId: 'ag-tl-cost-1', adGroupName: 'Cost/Price', product: 'Term Life',
    headlines: ['How Much Is Life Insurance?', 'Life Insurance Calculator', 'Affordable Protection', 'Plans From $15/Month'],
    descriptions: ['Wondering about life insurance costs? Use our free calculator to find the right plan for your budget.', 'Guardian makes life insurance affordable. See your personalized rate in minutes.'],
    adStrength: 'Average', dailySpend: [130, 180], ctrRange: [0.04, 0.055], convRateRange: [0.02, 0.03],
  },

  // Disability RSAs
  {
    campaignId: 'camp-di-brand', campaignName: 'Disability - Brand', adGroupId: 'ag-di-brand-1', adGroupName: 'Brand - Core', product: 'Disability',
    headlines: ['Guardian Disability Insurance', 'Protect Your Income', 'Get a Free Quote', 'Industry-Leading Coverage', 'Trusted by Millions'],
    descriptions: ['Guardian disability insurance protects your most valuable asset — your income. Get covered today.', 'Don\'t risk your financial future. Guardian offers comprehensive disability coverage for professionals.'],
    adStrength: 'Excellent', dailySpend: [100, 140], ctrRange: [0.08, 0.11], convRateRange: [0.05, 0.065],
  },
  {
    campaignId: 'camp-di-hi', campaignName: 'Disability - High Intent', adGroupId: 'ag-di-ltd-1', adGroupName: 'LTD', product: 'Disability',
    headlines: ['Long Term Disability Insurance', 'Protect Your Paycheck', 'LTD Coverage Options', 'Income Protection Plans', 'Apply Online Now'],
    descriptions: ['Long-term disability insurance from Guardian. Protect up to 60% of your income if you can\'t work.', 'Guardian LTD insurance — comprehensive coverage, competitive rates, trusted provider.'],
    adStrength: 'Good', dailySpend: [200, 260], ctrRange: [0.05, 0.065], convRateRange: [0.035, 0.048],
  },

  // Annuities RSAs
  {
    campaignId: 'camp-an-brand', campaignName: 'Annuities - Brand', adGroupId: 'ag-an-brand-1', adGroupName: 'Brand - Core', product: 'Annuities',
    headlines: ['Guardian Annuities', 'Secure Your Retirement', 'Competitive Rates', 'Fixed & Variable Options', 'Tax-Deferred Growth'],
    descriptions: ['Guardian annuities offer guaranteed income for retirement. Explore fixed and variable options today.', 'Plan your retirement with confidence. Guardian annuities deliver stable, tax-deferred growth.'],
    adStrength: 'Good', dailySpend: [90, 130], ctrRange: [0.065, 0.09], convRateRange: [0.028, 0.04],
  },
  {
    campaignId: 'camp-an-hi', campaignName: 'Annuities - High Intent', adGroupId: 'ag-an-rates-1', adGroupName: 'Rates', product: 'Annuities',
    headlines: ['Best Annuity Rates 2026', 'Fixed Annuity Rates', 'Compare Annuity Options', 'Guaranteed Income Stream'],
    descriptions: ['Compare Guardian\'s competitive annuity rates. Fixed, variable, and indexed options available.', 'Looking for the best annuity rates? Guardian offers top-tier options for every retirement plan.'],
    adStrength: 'Average', dailySpend: [180, 240], ctrRange: [0.045, 0.06], convRateRange: [0.02, 0.03],
  },

  // Dental RSAs
  {
    campaignId: 'camp-dn-brand', campaignName: 'Dental - Brand', adGroupId: 'ag-dn-brand-1', adGroupName: 'Brand - Core', product: 'Dental Network',
    headlines: ['Guardian Dental Insurance', 'Find a Dentist Near You', 'Affordable Dental Plans', 'PPO & HMO Options', '100% Preventive Coverage'],
    descriptions: ['Guardian dental insurance covers preventive care at 100%. Find an in-network dentist near you today.', 'Smile with confidence. Guardian dental plans cover cleanings, fillings, and more at affordable rates.'],
    adStrength: 'Excellent', dailySpend: [75, 105], ctrRange: [0.08, 0.11], convRateRange: [0.055, 0.07],
  },
  {
    campaignId: 'camp-dn-hi', campaignName: 'Dental - High Intent', adGroupId: 'ag-dn-plans-1', adGroupName: 'Plans', product: 'Dental Network',
    headlines: ['Dental Insurance Plans', 'Enroll in Dental Coverage', 'PPO Dental Plans', 'Affordable Dental Options'],
    descriptions: ['Find the right dental plan for you and your family. Guardian offers PPO and HMO options nationwide.', 'Dental insurance starting at competitive rates. Cleanings, fillings, crowns, and more covered.'],
    adStrength: 'Good', dailySpend: [140, 190], ctrRange: [0.06, 0.075], convRateRange: [0.04, 0.055],
  },

  // Group Benefits RSAs
  {
    campaignId: 'camp-gb-brand', campaignName: 'Group Benefits - Brand', adGroupId: 'ag-gb-brand-1', adGroupName: 'Brand - Core', product: 'Group Benefits',
    headlines: ['Guardian Group Benefits', 'Employee Benefits Solutions', 'Trusted by Top Employers', 'Comprehensive Benefits'],
    descriptions: ['Guardian group benefits — comprehensive employee insurance packages. Life, dental, disability, and more.', 'Attract and retain top talent with Guardian\'s industry-leading group benefits solutions.'],
    adStrength: 'Good', dailySpend: [50, 75], ctrRange: [0.07, 0.095], convRateRange: [0.04, 0.052],
  },
  {
    campaignId: 'camp-gb-emp', campaignName: 'Group Benefits - Employer', adGroupId: 'ag-gb-emp-1', adGroupName: 'Employer', product: 'Group Benefits',
    headlines: ['Employer Group Insurance', 'Employee Benefits Packages', 'Group Life & Disability', 'Small Business Benefits', 'Get a Group Quote'],
    descriptions: ['Guardian offers customizable group insurance for employers of all sizes. Get a tailored quote today.', 'Comprehensive group benefits: life, dental, vision, disability. Flexible plans for every business.'],
    adStrength: 'Average', dailySpend: [100, 150], ctrRange: [0.05, 0.065], convRateRange: [0.028, 0.04],
  },
  {
    campaignId: 'camp-gb-edu', campaignName: 'Group Benefits - Education', adGroupId: 'ag-gb-edu-1', adGroupName: 'Education', product: 'Group Benefits',
    headlines: ['What Are Group Benefits?', 'Employee Benefits Guide', 'Benefits Administration'],
    descriptions: ['Learn about group benefits and how they can help your business attract top talent. Guardian can help.'],
    adStrength: 'Poor', dailySpend: [40, 60], ctrRange: [0.035, 0.05], convRateRange: [0.015, 0.025],
  },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateAdData(): Ad[] {
  const ads: Ad[] = []
  const baseDate = new Date('2026-02-12')

  for (const config of adConfigs) {
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
      const convValue = conversions * rand(150, 600)

      ads.push({
        id: `ad-${config.adGroupId}-${dateStr}`,
        date: dateStr,
        campaignId: config.campaignId,
        campaignName: config.campaignName,
        adGroupId: config.adGroupId,
        adGroupName: config.adGroupName,
        headlines: config.headlines,
        descriptions: config.descriptions,
        adStrength: config.adStrength,
        spend: Math.round(spend * 100) / 100,
        impressions,
        clicks,
        conversions,
        conversionValue: Math.round(convValue * 100) / 100,
        ctr: Math.round(ctr * 10000) / 100,
        cpc: clicks > 0 ? Math.round((spend / clicks) * 100) / 100 : 0,
        cpa: conversions > 0 ? Math.round((spend / conversions) * 100) / 100 : 0,
      })
    }
  }

  return ads
}

export const adData = generateAdData()
