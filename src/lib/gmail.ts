import type { JobEmail } from '../types'
import { classifyEmail } from './classifier'
import { getSettings } from './storage'

const GMAIL_API = 'https://www.googleapis.com/gmail/v1/users/me'

async function getAuthToken(): Promise<string> {
  const result = await chrome.identity.getAuthToken({ interactive: false })
  if (!result.token) {
    throw new Error('No auth token')
  }
  return result.token
}

export async function getAuthTokenInteractive(): Promise<string> {
  const result = await chrome.identity.getAuthToken({ interactive: true })
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
  const response = await fetch(`${GMAIL_API}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (response.status === 401) {
    // Token expired or revoked
    chrome.identity.removeCachedAuthToken({ token })
    throw new Error('AUTH_REVOKED')
  }
  if (!response.ok) {
    throw new Error(`Gmail API error: ${response.status}`)
  }
  return response
}

// Job-related search keywords for Gmail query (high-signal terms)
const JOB_SEARCH_KEYWORDS = [
  '"interview invitation"',
  '"phone screen"',
  '"technical assessment"',
  '"coding challenge"',
  '"offer letter"',
  '"pleased to offer"',
  '"compensation package"',
  '"received your application"',
  '"thank you for applying"',
  '"application submitted"',
  '"not moving forward"',
  '"other candidates"',
  '"position has been filled"',
  '"next steps in the process"',
  '"schedule an interview"',
  '"meet the team"',
  '"virtual onsite"',
]

function buildJobQuery(customDomains: string[]): string {
  const keywordPart = JOB_SEARCH_KEYWORDS.join(' OR ')
  if (customDomains.length > 0) {
    const domainPart = customDomains.map((d) => `from:${d}`).join(' OR ')
    return `(${keywordPart} OR ${domainPart})`
  }
  return `(${keywordPart})`
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

  const messageIds: GmailMessage[] = []
  let pageToken: string | undefined

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

  // Fetch details for each message
  return fetchMessageDetails(messageIds, token)
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
export async function getUserProfile(): Promise<string> {
  const token = await getAuthToken()
  const response = await gmailFetch('/profile', token)
  const data = await response.json()
  return data.emailAddress
}

async function fetchMessageDetails(
  messages: GmailMessage[],
  token: string
): Promise<JobEmail[]> {
  const emails: JobEmail[] = []

  // Batch in groups of 20 to avoid overwhelming the API
  for (let i = 0; i < messages.length; i += 20) {
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
