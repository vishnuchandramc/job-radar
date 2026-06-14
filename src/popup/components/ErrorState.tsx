import { AlertTriangle } from 'lucide-react'

interface ErrorStateProps {
  onReconnect: () => void
}

export function ErrorState({ onReconnect }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[360px] px-8">
      <AlertTriangle size={24} strokeWidth={1.5} style={{ color: 'var(--danger)' }} className="mb-3" />
      <p className="text-[13px] font-medium mb-0.5" style={{ color: 'var(--fg)' }}>Gmail disconnected</p>
      <p className="text-[11px] mb-6" style={{ color: 'var(--fg-3)' }}>Access was revoked or expired.</p>
      <button
        onClick={onReconnect}
        className="px-4 py-2 text-[13px] font-medium rounded-lg transition-opacity hover:opacity-90"
        style={{ background: 'var(--fg)', color: 'var(--bg)' }}
      >
        Reconnect Gmail
      </button>
    </div>
  )
}
