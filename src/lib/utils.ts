import type { EmailCategory } from '../types'

export function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = now - date

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

export function getCategoryLabel(category: EmailCategory): string {
  const labels: Record<EmailCategory, string> = {
    offer: 'Offers',
    interview_request: 'Interview Requests',
    rejection: 'Rejections',
    application_confirmation: 'Application Confirmations',
    other: 'Other',
  }
  return labels[category]
}

export function getCategoryColor(category: EmailCategory): string {
  const colors: Record<EmailCategory, string> = {
    offer: 'text-emerald-600 bg-emerald-500/10 dark:text-emerald-400 dark:bg-emerald-500/10',
    interview_request: 'text-blue-600 bg-blue-500/10 dark:text-blue-400 dark:bg-blue-500/10',
    rejection: 'text-red-500 bg-red-500/10 dark:text-red-400 dark:bg-red-500/10',
    application_confirmation: 'text-amber-600 bg-amber-500/10 dark:text-amber-400 dark:bg-amber-500/10',
    other: 'text-zinc-500 bg-zinc-500/10 dark:text-zinc-400 dark:bg-zinc-500/10',
  }
  return colors[category]
}

export function getCategoryIconColor(category: EmailCategory): string {
  const colors: Record<EmailCategory, string> = {
    offer: 'text-emerald-500',
    interview_request: 'text-blue-500',
    rejection: 'text-red-400',
    application_confirmation: 'text-amber-500',
    other: 'text-gray-400',
  }
  return colors[category]
}

export function extractSenderName(sender: string): string {
  // "Company Name <noreply@ats.com>" -> "Company Name"
  const match = sender.match(/^(.+?)\s*</)
  if (match) return match[1].replace(/"/g, '')
  // "noreply@ats.com" -> "noreply@ats.com"
  return sender
}

export function buildGmailLink(threadId: string, userEmail: string): string {
  return `https://mail.google.com/mail/?authuser=${encodeURIComponent(userEmail)}#all/${threadId}`
}
