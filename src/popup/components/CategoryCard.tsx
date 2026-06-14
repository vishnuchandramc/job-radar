import { useState } from 'react'
import { ChevronRight, Trophy, CalendarCheck, XCircle, MailCheck, HelpCircle } from 'lucide-react'
import type { JobEmail, EmailCategory } from '../../types'
import { getCategoryLabel } from '../../lib/utils'
import { EmailRow } from './EmailRow'

const categoryIcons: Record<EmailCategory, typeof Trophy> = {
  offer: Trophy,
  interview_request: CalendarCheck,
  rejection: XCircle,
  application_confirmation: MailCheck,
  other: HelpCircle,
}

const categoryColors: Record<EmailCategory, string> = {
  offer: 'var(--green)',
  interview_request: 'var(--accent)',
  rejection: 'var(--red)',
  application_confirmation: 'var(--amber)',
  other: 'var(--fg-3)',
}

interface CategoryCardProps {
  category: EmailCategory
  emails: JobEmail[]
  onClickEmail: (emailId: string, threadId: string) => void
  onDismiss: (emailId: string) => void
}

export function CategoryCard({ category, emails, onClickEmail, onDismiss }: CategoryCardProps) {
  const [expanded, setExpanded] = useState(false)
  const count = emails.length
  if (count === 0) return null

  const Icon = categoryIcons[category]
  const unseenCount = emails.filter((e) => !e.seen).length

  return (
    <>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors"
        style={{ background: expanded ? 'var(--bg-hover)' : 'transparent' }}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = 'var(--bg-hover)' }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent' }}
      >
        <Icon size={15} strokeWidth={1.8} style={{ color: categoryColors[category], flexShrink: 0 }} />
        <span className="text-[13px] flex-1 text-left" style={{ color: 'var(--fg)' }}>
          {getCategoryLabel(category)}
        </span>
        <span
          className="text-[11px] font-medium tabular-nums"
          style={{ color: unseenCount > 0 ? 'var(--accent)' : 'var(--fg-3)' }}
        >
          {count}
        </span>
        <ChevronRight
          size={12}
          strokeWidth={2}
          className={`transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
          style={{ color: 'var(--fg-3)' }}
        />
      </button>

      {expanded && (
        <div className="ml-[30px]">
          {emails.map((email) => (
            <EmailRow
              key={email.id}
              email={email}
              onClick={() => onClickEmail(email.id, email.threadId)}
              onDismiss={() => onDismiss(email.id)}
            />
          ))}
        </div>
      )}
    </>
  )
}
