import { useState, useEffect, useCallback } from 'react'
import type { JobEmail, Settings, ConnectionState } from '../../types'
import {
  getEmails,
  getSettings,
  getUserEmail,
  markEmailSeen,
  markAllSeen,
  dismissEmail,
  saveSettings,
} from '../../lib/storage'
import { ACTIVE_WINDOW_DAYS } from '../../lib/constants'
import { buildGmailLink } from '../../lib/utils'
import { dbg, dbgError } from '../../lib/debug'

export function useStorage() {
  const [emails, setEmails] = useState<JobEmail[]>([])
  const [settings, setSettings] = useState<Settings | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<ConnectionState>('connected')
  const [syncing, setSyncing] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const loadData = useCallback(async () => {
    dbg('useStorage.loadData — start')
    try {
      const [emailData, settingsData, emailAddr] = await Promise.all([
        getEmails(),
        getSettings(),
        getUserEmail(),
      ])

      dbg('useStorage.loadData — loaded', {
        jobEmailCount: emailData.length,
        userEmail: emailAddr,
        syncInterval: settingsData.syncIntervalMinutes,
      })

      setEmails(emailData)

      setSettings(settingsData)
      setUserEmail(emailAddr)
      setConnectionState(emailAddr ? 'connected' : 'disconnected')
      dbg('useStorage.loadData — state set', {
        userEmail: emailAddr,
        connectionState: emailAddr ? 'connected' : 'disconnected',
      })
    } catch (error) {
      dbgError('useStorage.loadData — failed', error)
      setConnectionState('disconnected')
    } finally {
      setInitialLoading(false)
      dbg('useStorage.loadData — done', { initialLoading: false })
    }
  }, [])

  useEffect(() => {
    loadData()

    // Listen for storage changes
    const listener = () => loadData()
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [loadData])

  const now = Date.now()
  const activeCutoff = now - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const retentionCutoff = now - 30 * 24 * 60 * 60 * 1000

  const activeEmails = emails.filter(
    (e) => !e.dismissed && new Date(e.date).getTime() > activeCutoff
  )

  const historyEmails = emails.filter(
    (e) =>
      !e.dismissed &&
      new Date(e.date).getTime() <= activeCutoff &&
      new Date(e.date).getTime() > retentionCutoff
  )

  const handleSync = useCallback(async () => {
    setSyncing(true)
    try {
      await chrome.runtime.sendMessage({ type: 'SYNC_NOW' })
      await loadData()
    } finally {
      setSyncing(false)
    }
  }, [loadData])

  const handleMarkSeen = useCallback(
    async (emailId: string, threadId: string) => {
      if (userEmail) {
        chrome.tabs.create({ url: buildGmailLink(threadId, userEmail) })
      }
      await markEmailSeen(emailId)
      chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
    },
    [userEmail]
  )

  const handleMarkAllSeen = useCallback(async () => {
    await markAllSeen()
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
  }, [])

  const handleDismiss = useCallback(async (emailId: string) => {
    await dismissEmail(emailId)
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' })
  }, [])

  const handleUpdateSettings = useCallback(async (newSettings: Settings) => {
    await saveSettings(newSettings)
    setSettings(newSettings)
    if (newSettings.syncIntervalMinutes !== settings?.syncIntervalMinutes) {
      chrome.runtime.sendMessage({
        type: 'UPDATE_ALARM',
        intervalMinutes: newSettings.syncIntervalMinutes,
      })
    }
  }, [settings])

  return {
    activeEmails,
    historyEmails,
    settings,
    userEmail,
    connectionState,
    syncing,
    initialLoading,
    handleSync,
    handleMarkSeen,
    handleMarkAllSeen,
    handleDismiss,
    handleUpdateSettings,
    setConnectionState,
    loadData,
  }
}
