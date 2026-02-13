// Mock conversion actions data
// Conversion types: Call, Form, Quote, Chat — with Last Click and Assisted attribution
import type { ConversionAction, Product } from '../types'

interface ConvConfig {
  product: Product
  campaignId: string
  callRange: [number, number]
  formRange: [number, number]
  quoteRange: [number, number]
  chatRange: [number, number]
  avgCallValue: number
  avgFormValue: number
  avgQuoteValue: number
  avgChatValue: number
}

const configs: ConvConfig[] = [
  {
    product: 'Term Life', campaignId: 'camp-term-life-high-intent',
    callRange: [4, 8], formRange: [6, 12], quoteRange: [8, 14], chatRange: [2, 5],
    avgCallValue: 480, avgFormValue: 350, avgQuoteValue: 420, avgChatValue: 280,
  },
  {
    product: 'Disability', campaignId: 'camp-disability-high-intent',
    callRange: [3, 6], formRange: [5, 10], quoteRange: [4, 8], chatRange: [1, 4],
    avgCallValue: 380, avgFormValue: 290, avgQuoteValue: 340, avgChatValue: 220,
  },
  {
    product: 'Annuities', campaignId: 'camp-annuities-high-intent',
    callRange: [2, 5], formRange: [3, 7], quoteRange: [2, 5], chatRange: [1, 3],
    avgCallValue: 620, avgFormValue: 510, avgQuoteValue: 580, avgChatValue: 400,
  },
  {
    product: 'Dental Network', campaignId: 'camp-dental-high-intent',
    callRange: [5, 10], formRange: [8, 14], quoteRange: [3, 6], chatRange: [3, 6],
    avgCallValue: 180, avgFormValue: 150, avgQuoteValue: 170, avgChatValue: 120,
  },
  {
    product: 'Group Benefits', campaignId: 'camp-group-benefits-employer',
    callRange: [2, 4], formRange: [3, 6], quoteRange: [1, 3], chatRange: [1, 2],
    avgCallValue: 260, avgFormValue: 220, avgQuoteValue: 250, avgChatValue: 180,
  },
]

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min)
}
function randInt(min: number, max: number): number {
  return Math.round(rand(min, max))
}

function generateConversionData(): ConversionAction[] {
  const data: ConversionAction[] = []
  const baseDate = new Date('2026-02-12')
  let idCounter = 1

  for (let i = 29; i >= 0; i--) {
    const date = new Date(baseDate)
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]!
    const isWeekend = date.getDay() === 0 || date.getDay() === 6
    const mult = isWeekend ? 0.65 : 1.0

    for (const cfg of configs) {
      const types: { type: 'Call' | 'Form' | 'Quote' | 'Chat'; range: [number, number]; avgValue: number }[] = [
        { type: 'Call', range: cfg.callRange, avgValue: cfg.avgCallValue },
        { type: 'Form', range: cfg.formRange, avgValue: cfg.avgFormValue },
        { type: 'Quote', range: cfg.quoteRange, avgValue: cfg.avgQuoteValue },
        { type: 'Chat', range: cfg.chatRange, avgValue: cfg.avgChatValue },
      ]

      for (const t of types) {
        const totalConv = Math.max(1, Math.round(randInt(t.range[0], t.range[1]) * mult))
        const lastClickConv = Math.round(totalConv * rand(0.55, 0.75))
        const assistedConv = totalConv - lastClickConv

        // Last Click attribution
        data.push({
          id: `conv-${idCounter++}`,
          date: dateStr,
          campaignId: cfg.campaignId,
          product: cfg.product,
          conversionType: t.type,
          conversions: lastClickConv,
          conversionValue: Math.round(lastClickConv * t.avgValue * rand(0.9, 1.1)),
          attribution: 'Last Click',
        })

        // Assisted attribution
        if (assistedConv > 0) {
          data.push({
            id: `conv-${idCounter++}`,
            date: dateStr,
            campaignId: cfg.campaignId,
            product: cfg.product,
            conversionType: t.type,
            conversions: assistedConv,
            conversionValue: Math.round(assistedConv * t.avgValue * rand(0.8, 1.0)),
            attribution: 'Assisted',
          })
        }
      }
    }
  }

  return data
}

export const conversionData = generateConversionData()
