// Mock account health score
import type { AccountHealthScore } from '../types'

export const healthScoreData: AccountHealthScore = {
  overall: 72,
  components: {
    qualityScore: 68,
    impressionShare: 65,
    cpaTrend: 74,
    budgetPacing: 82,
    conversionTrend: 78,
  },
}
