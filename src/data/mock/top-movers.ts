// Mock top movers - campaigns with biggest week-over-week changes
import type { TopMover } from '../types'

export const topMoversData: TopMover[] = [
  {
    campaignName: 'Dental - High Intent',
    product: 'Dental Network',
    metric: 'Conversions',
    currentValue: 89,
    previousValue: 62,
    changePercent: 43.5,
    direction: 'up',
  },
  {
    campaignName: 'Group Benefits - Employer',
    product: 'Group Benefits',
    metric: 'CPA',
    currentValue: 58.40,
    previousValue: 72.10,
    changePercent: -19.0,
    direction: 'down', // CPA down is good
  },
  {
    campaignName: 'Term Life - High Intent',
    product: 'Term Life',
    metric: 'CPA',
    currentValue: 133.20,
    previousValue: 108.30,
    changePercent: 23.0,
    direction: 'up', // CPA up is bad
  },
  {
    campaignName: 'Dental - Brand',
    product: 'Dental Network',
    metric: 'CTR',
    currentValue: 9.8,
    previousValue: 7.4,
    changePercent: 32.4,
    direction: 'up',
  },
  {
    campaignName: 'Annuities - Retirement Planning',
    product: 'Annuities',
    metric: 'ROAS',
    currentValue: 2.1,
    previousValue: 2.8,
    changePercent: -25.0,
    direction: 'down',
  },
  {
    campaignName: 'Disability - High Intent',
    product: 'Disability',
    metric: 'Impression Share',
    currentValue: 58.2,
    previousValue: 68.4,
    changePercent: -14.9,
    direction: 'down',
  },
  {
    campaignName: 'Term Life - Brand',
    product: 'Term Life',
    metric: 'ROAS',
    currentValue: 4.8,
    previousValue: 4.2,
    changePercent: 14.3,
    direction: 'up',
  },
  {
    campaignName: 'Annuities - Brand',
    product: 'Annuities',
    metric: 'Conversions',
    currentValue: 34,
    previousValue: 28,
    changePercent: 21.4,
    direction: 'up',
  },
]
