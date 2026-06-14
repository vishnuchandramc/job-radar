import { performSync } from '../lib/sync'
import { getSettings, saveSyncState } from '../lib/storage'
import { updateBadge } from '../lib/badge'
import { ALARM_NAME } from '../lib/constants'

// Set up alarm on install
chrome.runtime.onInstalled.addListener(async () => {
  const settings = await getSettings()
  await chrome.alarms.create(ALARM_NAME, {
    periodInMinutes: settings.syncIntervalMinutes,
  })
})

// Handle alarm-triggered sync
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === ALARM_NAME) {
    await performSync()
  }
})

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SYNC_NOW') {
    performSync().then(sendResponse)
    return true // keep channel open for async response
  }

  if (message.type === 'UPDATE_BADGE') {
    updateBadge(message.connectionState).then(() => sendResponse())
    return true
  }

  if (message.type === 'UPDATE_ALARM') {
    chrome.alarms.create(ALARM_NAME, {
      periodInMinutes: message.intervalMinutes,
    }).then(() => sendResponse())
    return true
  }

  if (message.type === 'INITIAL_SYNC') {
    // First-time sync after OAuth
    performSync().then(sendResponse)
    return true
  }

  if (message.type === 'DISCONNECT') {
    // Clear sync state but keep settings
    saveSyncState(null).then(async () => {
      await updateBadge('disconnected')
      sendResponse()
    })
    return true
  }
})

// Check connectivity changes
self.addEventListener('online', () => updateBadge('connected'))
self.addEventListener('offline', () => updateBadge('offline'))
