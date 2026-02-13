// Mock hourly performance data
// Generates hour-of-day x day-of-week aggregated data for schedule analysis
import type { HourlyPerformance } from '../types'

// Conversion probability multiplier by hour (0-23)
// Insurance search volume peaks during business hours, lower at night
const hourMultipliers: number[] = [
  0.15, 0.08, 0.05, 0.04, 0.05, 0.10,  // 12am-5am: very low
  0.25, 0.55, 0.82, 0.95, 1.00, 0.98,  // 6am-11am: ramp up to peak
  0.90, 0.92, 0.95, 0.88, 0.78, 0.65,  // 12pm-5pm: afternoon plateau
  0.50, 0.42, 0.35, 0.28, 0.22, 0.18,  // 6pm-11pm: evening decline
]

// Day-of-week multiplier (0=Sunday, 6=Saturday)
const dayMultipliers: number[] = [
  0.55, // Sunday
  1.00, // Monday
  1.05, // Tuesday
  1.02, // Wednesday
  0.98, // Thursday
  0.85, // Friday
  0.50, // Saturday
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function generateHourlyData(): HourlyPerformance[] {
  const data: HourlyPerformance[] = []
  const baseDate = new Date('2026-02-12')
  const baseDailySpend = 6000 // ~$180K/mo ÷ 30

  // Generate data for each day in the 30-day window
  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]!
    const dayOfWeek = date.getDay()
    const dayMult = dayMultipliers[dayOfWeek]!

    for (let hour = 0; hour < 24; hour++) {
      const hourMult = hourMultipliers[hour]!
      const combinedMult = dayMult * hourMult

      // Distribute daily spend across hours proportional to multiplier
      const hourlySpend = (baseDailySpend / 24) * combinedMult * rand(0.8, 1.2)
      const cpc = rand(10, 16)
      const clicks = Math.max(0, Math.round(hourlySpend / cpc))
      const ctr = rand(0.04, 0.07)
      const impressions = clicks > 0 ? Math.round(clicks / ctr) : Math.round(rand(20, 100) * combinedMult)

      // Conversion rate is slightly higher during business hours
      const convBoost = hour >= 8 && hour <= 17 ? 1.15 : 0.85
      const convRate = rand(0.025, 0.045) * convBoost
      const conversions = Math.max(0, Math.round(clicks * convRate))
      const conversionValue = conversions * rand(250, 450)

      data.push({
        id: `hr-${dateStr}-d${dayOfWeek}-h${hour.toString().padStart(2, '0')}`,
        date: dateStr,
        campaignId: 'all',
        hour,
        dayOfWeek,
        spend: Math.round(hourlySpend * 100) / 100,
        impressions,
        clicks,
        conversions,
        conversionValue: Math.round(conversionValue * 100) / 100,
      })
    }
  }

  return data
}

export const hourlyData = generateHourlyData()
