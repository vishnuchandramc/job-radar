import { X } from 'lucide-react'
import type { JobEmail } from '../../types'
import { formatRelativeTime, extractSenderName } from '../../lib/utils'

interface EmailRowProps {
  email: JobEmail
  onClick: () => void
  onDismiss: () => void
}

export function EmailRow({ email, onClick, onDismiss }: EmailRowProps) {
  return (
    <div
      className="group flex items-center gap-2.5 px-3 py-2 cursor-pointer transition-colors"
      style={{ borderBottom: '0.5px solid var(--divider)' }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
      onClick={onClick}
    >
      {/* Unseen dot */}
      <span
        className="w-[5px] h-[5px] rounded-full shrink-0"
        style={{ background: !email.seen ? 'var(--accent)' : 'transparent' }}
      />

      {/* Sender */}
      <span className="text-[13px] font-medium shrink-0 max-w-[120px] truncate" style={{ color: 'var(--fg)' }}>
        {extractSenderName(email.sender)}
      </span>

      {/* Subject */}
      <span className="text-[12px] truncate flex-1 min-w-0" style={{ color: 'var(--fg-2)' }}>
        {email.subject}
      </span>

      {/* Time */}
      <span className="text-[11px] tabular-nums shrink-0" style={{ color: 'var(--fg-3)' }}>
        {formatRelativeTime(email.date)}
      </span>

      {/* Dismiss */}
      <button
        onClick={(e) => { e.stopPropagation(); onDismiss() }}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity"
        style={{ color: 'var(--fg-3)' }}
        title="Dismiss"
      >
        <X size={11} strokeWidth={2} />
      </button>
    </div>
  )
}
