import type { JobEmail, StorageData, Settings } from '../types'
import { DEFAULT_SETTINGS, STORAGE_RETENTION_DAYS } from './constants'

const DEFAULT_STORAGE: StorageData = {
  emails: [],
  syncState: { lastSyncTimestamp: null, historyId: null },
  settings: DEFAULT_SETTINGS,
  excludedMessageIds: [],
  userEmail: null,
}

export async function getStorageData(): Promise<StorageData> {
  const keys = Object.keys(DEFAULT_STORAGE)
  const data = await chrome.storage.local.get(keys)
  return { ...DEFAULT_STORAGE, ...data } as StorageData
}

export async function getEmails(): Promise<JobEmail[]> {
  const { emails } = await getStorageData()
  return emails
}

export async function saveEmails(emails: JobEmail[]): Promise<void> {
  await chrome.storage.local.set({ emails })
}

export async function addEmails(newEmails: JobEmail[]): Promise<void> {
  const { emails, excludedMessageIds } = await getStorageData()
  const existingIds = new Set(emails.map((e) => e.id))
  const excludedIds = new Set(excludedMessageIds)

  const filtered = newEmails.filter(
    (e) => !existingIds.has(e.id) && !excludedIds.has(e.id)
  )

  if (filtered.length > 0) {
    await saveEmails([...filtered, ...emails])
  }
}

export async function markEmailSeen(emailId: string): Promise<void> {
  const emails = await getEmails()
  const updated = emails.map((e) =>
    e.id === emailId ? { ...e, seen: true } : e
  )
  await saveEmails(updated)
}

export async function markAllSeen(): Promise<void> {
  const emails = await getEmails()
  const updated = emails.map((e) => ({ ...e, seen: true }))
  await saveEmails(updated)
}

export async function dismissEmail(emailId: string): Promise<void> {
  const { emails, excludedMessageIds } = await getStorageData()
  const updated = emails.filter((e) => e.id !== emailId)
  const updatedExclusions = [...excludedMessageIds, emailId]
  await chrome.storage.local.set({
    emails: updated,
    excludedMessageIds: updatedExclusions,
  })
}

export async function getSettings(): Promise<Settings> {
  const { settings } = await getStorageData()
  return settings
}

export async function saveSettings(settings: Settings): Promise<void> {
  await chrome.storage.local.set({ settings })
}

export async function getSyncState() {
  const { syncState } = await getStorageData()
  return syncState
}

export async function saveSyncState(historyId: string | null): Promise<void> {
  await chrome.storage.local.set({
    syncState: {
      lastSyncTimestamp: new Date().toISOString(),
      historyId,
    },
  })
}

export async function getUserEmail(): Promise<string | null> {
  const { userEmail } = await getStorageData()
  return userEmail
}

export async function saveUserEmail(email: string): Promise<void> {
  await chrome.storage.local.set({ userEmail: email })
}

export async function clearUserData(): Promise<void> {
  await chrome.storage.local.remove(['userEmail', 'emails', 'syncState', 'excludedMessageIds'])
}

/**
 * Purge emails older than STORAGE_RETENTION_DAYS.
 * Auto-mark emails outside the active window as seen.
 */
export async function purgeOldEmails(activeWindowDays: number): Promise<void> {
  const emails = await getEmails()
  const now = Date.now()
  const retentionCutoff = now - STORAGE_RETENTION_DAYS * 24 * 60 * 60 * 1000
  const activeCutoff = now - activeWindowDays * 24 * 60 * 60 * 1000

  const updated = emails
    .filter((e) => new Date(e.date).getTime() > retentionCutoff)
    .map((e) => {
      if (new Date(e.date).getTime() <= activeCutoff) {
        return { ...e, seen: true }
      }
      return e
    })

  await saveEmails(updated)
}
