import type { ConnectionState } from '../types'
import { getEmails } from './storage'
import { BADGE_CATEGORIES, ACTIVE_WINDOW_DAYS } from './constants'

export async function updateBadge(connectionState?: ConnectionState): Promise<void> {
  if (connectionState === 'disconnected') {
    await chrome.action.setBadgeText({ text: '!' })
    await chrome.action.setBadgeBackgroundColor({ color: '#EF4444' })
    return
  }

  const emails = await getEmails()
  const activeCutoff = Date.now() - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000

  const count = emails.filter(
    (e) =>
      !e.seen &&
      !e.dismissed &&
      BADGE_CATEGORIES.includes(e.category) &&
      new Date(e.date).getTime() > activeCutoff
  ).length

  await chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' })
  await chrome.action.setBadgeBackgroundColor({ color: '#3B82F6' })
}
