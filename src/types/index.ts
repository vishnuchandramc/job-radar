export type EmailCategory =
  | 'offer'
  | 'interview_request'
  | 'rejection'
  | 'application_confirmation'
  | 'other'

export interface JobEmail {
  id: string
  threadId: string
  sender: string
  subject: string
  snippet: string
  date: string
  category: EmailCategory
  seen: boolean
  dismissed: boolean
}

export type ConnectionState = 'connected' | 'disconnected' | 'offline'

export interface SyncState {
  lastSyncTimestamp: string | null
  historyId: string | null
}

export interface Settings {
  syncIntervalMinutes: number
  enabledCategories: EmailCategory[]
  customDomains: string[]
}

export interface StorageData {
  emails: JobEmail[]
  syncState: SyncState
  settings: Settings
  excludedMessageIds: string[]
  userEmail: string | null
}
