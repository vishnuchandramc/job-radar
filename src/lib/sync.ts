import {
  fetchMessagesByDate,
  fetchMessagesSinceHistory,
  getProfileHistoryId,
} from './gmail'
import {
  addEmails,
  getSyncState,
  saveSyncState,
  purgeOldEmails,
} from './storage'
import { updateBadge } from './badge'
import { BACKFILL_DAYS, ACTIVE_WINDOW_DAYS } from './constants'
import { dbg, dbgError } from './debug'

export interface SyncResult {
  success: boolean
  newEmailCount: number
  error?: string
}

export async function performSync(): Promise<SyncResult> {
  dbg('sync.performSync — start')
  try {
    const syncState = await getSyncState()

    let newEmails
    let newHistoryId: string | null = null

    if (!syncState.historyId) {
      // First sync or historyId lost — do a full backfill
      newEmails = await fetchMessagesByDate(BACKFILL_DAYS)
      newHistoryId = await getProfileHistoryId()
    } else {
      // Incremental sync via historyId
      const result = await fetchMessagesSinceHistory(syncState.historyId)
      newEmails = result.emails

      if (result.newHistoryId) {
        newHistoryId = result.newHistoryId
      } else {
        // historyId expired — fall back to date-based query
        newEmails = await fetchMessagesByDate(ACTIVE_WINDOW_DAYS)
        newHistoryId = await getProfileHistoryId()
      }
    }

    await addEmails(newEmails)
    await saveSyncState(newHistoryId)
    await purgeOldEmails(ACTIVE_WINDOW_DAYS)
    await updateBadge('connected')

    const result = { success: true, newEmailCount: newEmails.length }
    dbg('sync.performSync — success', result)
    return result
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    dbgError('sync.performSync — failed', { message, error })

    if (message === 'AUTH_REVOKED') {
      await updateBadge('disconnected')
      return { success: false, newEmailCount: 0, error: 'AUTH_REVOKED' }
    }

    return { success: false, newEmailCount: 0, error: message }
  }
}
