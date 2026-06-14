import type { JobEmail } from '../types'
import { classifyEmail } from './classifier'
import { getSettings } from './storage'
import { dbg, dbgError } from './debug'

const GMAIL_API = 'https://www.googleapis.com/gmail/v1/users/me'

function broadcastProgress(step: string, processed?: number, total?: number) {
  chrome.runtime.sendMessage({
    type: 'SYNC_PROGRESS',
    step,
    processed,
    total,
  }).catch(() => {}) // popup might be closed
}

async function getAuthToken(): Promise<string> {
  dbg('gmail.getAuthToken (interactive=false) — requesting')
  const result = await chrome.identity.getAuthToken({ interactive: false })
  dbg('gmail.getAuthToken (interactive=false) — result', {
    hasToken: !!result.token,
    tokenLength: result.token?.length ?? 0,
  })
  if (!result.token) {
    throw new Error('No auth token')
  }
  return result.token
}

export async function getAuthTokenInteractive(): Promise<string> {
  dbg('gmail.getAuthTokenInteractive — requesting')
  const result = await chrome.identity.getAuthToken({ interactive: true })
  dbg('gmail.getAuthTokenInteractive — result', {
    hasToken: !!result.token,
    tokenLength: result.token?.length ?? 0,
  })
  if (!result.token) {
    throw new Error('No auth token')
  }
  return result.token
}

export async function revokeAuthToken(): Promise<void> {
  const token = await getAuthToken().catch(() => null)
  if (token) {
    await new Promise<void>((resolve) => {
      chrome.identity.removeCachedAuthToken({ token }, resolve)
    })
  }
}

async function gmailFetch(endpoint: string, token: string): Promise<Response> {
  dbg('gmail.gmailFetch', { endpoint })
  const response = await fetch(`${GMAIL_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  dbg('gmail.gmailFetch — response', { endpoint, status: response.status, ok: response.ok })
  if (response.status === 401) {
    // Token expired or revoked
    chrome.identity.removeCachedAuthToken({ token })
    throw new Error('AUTH_REVOKED')
  }
  if (!response.ok) {
    const body = await response.text().catch(() => '')
    dbgError('gmail.gmailFetch — error body', { endpoint, status: response.status, body })
    throw new Error(`Gmail API error: ${response.status}`)
  }
  return response
}

// Full-text search terms (gmail.readonly scope allows body search)
const JOB_SEARCH_TERMS = [
  '"interview invitation"',
  '"phone screen"',
  '"offer letter"',
  '"thank you for applying"',
  '"received your application"',
  '"application status"',
  '"not moving forward"',
  '"position has been filled"',
  '"coding challenge"',
  '"technical assessment"',
  '"hiring manager"',
  '"compensation package"',
  '"we regret"',
  '"schedule an interview"',
  '"pleased to inform"',
  '"next round"',
]

// ATS domains as fallback to catch emails that might not have keyword matches
const ATS_DOMAINS = [
  'greenhouse.io',
  'lever.co',
  'myworkday.com',
  'smartrecruiters.com',
  'ashbyhq.com',
  'icims.com',
  'linkedin.com',
  'jobvite.com',
  'workable.com',
  'hired.com',
  'wellfound.com',
]

function buildJobQuery(customDomains: string[]): string {
  const keywordPart = JOB_SEARCH_TERMS.join(' OR ')
  const allDomains = [...ATS_DOMAINS, ...customDomains]
  const domainPart = allDomains.map((d) => `from:${d}`).join(' OR ')
  return `(${keywordPart} OR ${domainPart})`
}

interface GmailMessage {
  id: string
  threadId: string
}

interface GmailMessageDetail {
  id: string
  threadId: string
  snippet: string
  internalDate: string
  payload: {
    headers: Array<{ name: string; value: string }>
  }
}

/**
 * Fetch messages by date query (used for initial backfill and historyId fallback).
 */
export async function fetchMessagesByDate(afterDays: number): Promise<JobEmail[]> {
  const token = await getAuthToken()
  const settings = await getSettings()
  const afterDate = new Date(Date.now() - afterDays * 24 * 60 * 60 * 1000)
  const dateStr = `${afterDate.getFullYear()}/${afterDate.getMonth() + 1}/${afterDate.getDate()}`
  const jobQuery = buildJobQuery(settings.customDomains)
  const query = `${jobQuery} after:${dateStr}`
  console.log('[Job Radar] Gmail query:', query)

  const messageIds: GmailMessage[] = []
  let pageToken: string | undefined

  broadcastProgress('Searching your inbox...')

  // Paginate through message list
  do {
    const params = new URLSearchParams({ q: query, maxResults: '100' })
    if (pageToken) params.set('pageToken', pageToken)

    const response = await gmailFetch(`/messages?${params}`, token)
    const data = await response.json()

    if (data.messages) {
      messageIds.push(...data.messages)
    }
    pageToken = data.nextPageToken
  } while (pageToken)

  console.log('[Job Radar] Found', messageIds.length, 'messages')

  broadcastProgress(`Found ${messageIds.length} emails, extracting details...`)

  // Fetch details for each message
  const emails = await fetchMessageDetails(messageIds, token)
  console.log('[Job Radar] Classified', emails.length, 'as job emails')

  broadcastProgress(`Classified ${emails.length} job emails`)
  return emails
}

/**
 * Fetch new messages since a historyId (incremental sync).
 */
export async function fetchMessagesSinceHistory(
  historyId: string
): Promise<{ emails: JobEmail[]; newHistoryId: string | null }> {
  const token = await getAuthToken()

  try {
    const params = new URLSearchParams({
      startHistoryId: historyId,
      historyTypes: 'messageAdded',
    })

    const response = await gmailFetch(`/history?${params}`, token)
    const data = await response.json()

    const newHistoryId = data.historyId || null

    if (!data.history) {
      return { emails: [], newHistoryId }
    }

    // Extract message IDs from history records
    const messages: GmailMessage[] = []
    for (const record of data.history) {
      if (record.messagesAdded) {
        for (const added of record.messagesAdded) {
          messages.push(added.message)
        }
      }
    }

    const emails = await fetchMessageDetails(messages, token)
    return { emails, newHistoryId }
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      // historyId expired — caller should fall back to date-based query
      return { emails: [], newHistoryId: null }
    }
    throw error
  }
}

/**
 * Get the current historyId for the user's mailbox.
 */
export async function getProfileHistoryId(): Promise<string> {
  const token = await getAuthToken()
  const response = await gmailFetch('/profile', token)
  const data = await response.json()
  return data.historyId
}

/**
 * Get the authenticated user's email address.
 */
export async function getUserProfile(tokenOverride?: string): Promise<string> {
  const token = tokenOverride ?? (await getAuthToken())
  dbg('gmail.getUserProfile', { usingOverrideToken: !!tokenOverride })
  const response = await gmailFetch('/profile', token)
  const data = await response.json()
  dbg('gmail.getUserProfile — profile data', {
    emailAddress: data.emailAddress,
    historyId: data.historyId,
    messagesTotal: data.messagesTotal,
  })
  if (!data.emailAddress) {
    throw new Error('Gmail profile missing emailAddress')
  }
  return data.emailAddress
}

async function fetchMessageDetails(
  messages: GmailMessage[],
  token: string
): Promise<JobEmail[]> {
  const emails: JobEmail[] = []

  // Batch in groups of 20 to avoid overwhelming the API
  for (let i = 0; i < messages.length; i += 20) {
    broadcastProgress('Parsing emails...', Math.min(i + 20, messages.length), messages.length)
    const batch = messages.slice(i, i + 20)
    const details = await Promise.all(
      batch.map(async (msg) => {
        const response = await gmailFetch(
          `/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
          token
        )
        return response.json() as Promise<GmailMessageDetail>
      })
    )

    for (const detail of details) {
      const fromHeader = detail.payload.headers.find(
        (h) => h.name.toLowerCase() === 'from'
      )
      const subjectHeader = detail.payload.headers.find(
        (h) => h.name.toLowerCase() === 'subject'
      )

      const sender = fromHeader?.value || ''
      const subject = subjectHeader?.value || ''
      const snippet = detail.snippet || ''

      const category = classifyEmail(subject, snippet)

      // Skip emails that don't match any job category
      if (category === 'other') continue

      emails.push({
        id: detail.id,
        threadId: detail.threadId,
        sender,
        subject,
        snippet,
        date: new Date(parseInt(detail.internalDate)).toISOString(),
        category,
        seen: false,
        dismissed: false,
      })
    }
  }

  return emails
}
