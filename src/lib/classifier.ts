import type { EmailCategory } from '../types'
import { KEYWORD_RULES, CATEGORY_PRIORITY } from './constants'

/**
 * Classify an email based on subject + snippet keyword matching.
 * Priority order: Offer > Interview Request > Rejection > Application Confirmation > Other
 */
export function classifyEmail(subject: string, snippet: string): EmailCategory {
  const text = `${subject} ${snippet}`.toLowerCase()

  for (const category of CATEGORY_PRIORITY) {
    if (category === 'other') continue
    const keywords = KEYWORD_RULES[category]
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category
    }
  }

  return 'other'
}
