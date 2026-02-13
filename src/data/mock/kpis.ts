// Mock KPI summary data for hero cards
import type { KpiSummary } from '../types'

export const kpiData: KpiSummary[] = [
  {
    label: 'Total Spend',
    value: 142380,
    formattedValue: '$142.4K',
    previousValue: 138200,
    changePercent: 3.0,
    direction: 'up',
    sparklineData: [4200, 4500, 4800, 4600, 4900, 5100, 4700, 5000, 5200, 4800, 5100, 5300, 4900, 5200],
  },
  {
    label: 'Conversions',
    value: 1247,
    formattedValue: '1,247',
    previousValue: 1158,
    changePercent: 7.7,
    direction: 'up',
    sparklineData: [38, 42, 40, 44, 46, 43, 47, 45, 48, 44, 49, 46, 50, 48],
  },
  {
    label: 'CPA',
    value: 113.87,
    formattedValue: '$113.87',
    previousValue: 119.34,
    changePercent: -4.6,
    direction: 'down',
    sparklineData: [122, 118, 120, 116, 119, 114, 117, 112, 115, 113, 116, 114, 112, 114],
  },
  {
    label: 'ROAS',
    value: 3.2,
    formattedValue: '3.2x',
    previousValue: 3.0,
    changePercent: 6.7,
    direction: 'up',
    sparklineData: [2.8, 2.9, 3.0, 2.9, 3.1, 3.0, 3.2, 3.1, 3.3, 3.2, 3.1, 3.3, 3.2, 3.2],
  },
  {
    label: 'CTR',
    value: 5.4,
    formattedValue: '5.4%',
    previousValue: 5.1,
    changePercent: 5.9,
    direction: 'up',
    sparklineData: [4.9, 5.0, 5.1, 5.0, 5.2, 5.1, 5.3, 5.2, 5.4, 5.3, 5.2, 5.4, 5.3, 5.4],
  },
  {
    label: 'Impression Share',
    value: 68.2,
    formattedValue: '68.2%',
    previousValue: 66.5,
    changePercent: 2.6,
    direction: 'up',
    sparklineData: [64, 65, 66, 65, 67, 66, 68, 67, 69, 68, 67, 69, 68, 68],
  },
]
