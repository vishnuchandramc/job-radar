import { useState, useEffect } from 'react'
import { Ripple } from './Ripple'

interface SyncProgressProps {
  onDone: () => void
}

interface ProgressData {
  step: string
  processed?: number
  total?: number
}

export function SyncProgress({ onDone }: SyncProgressProps) {
  const [progress, setProgress] = useState<ProgressData>({
    step: 'Connecting to Gmail...',
  })

  useEffect(() => {
    const listener = (message: Record<string, unknown>) => {
      if (message.type === 'SYNC_PROGRESS') {
        setProgress({
          step: (message.step as string) || '',
          processed: message.processed as number | undefined,
          total: message.total as number | undefined,
        })
      }
    }
    chrome.runtime.onMessage.addListener(listener)

    // Listen for storage changes — when emails appear, sync is done
    const storageListener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.emails) {
        const newEmails = changes.emails.newValue
        if (Array.isArray(newEmails) && newEmails.length > 0) {
          onDone()
        }
      }
    }
    chrome.storage.onChanged.addListener(storageListener)

    // Timeout fallback — dismiss after 30s even if no emails found
    const timeout = setTimeout(() => onDone(), 30000)

    return () => {
      chrome.runtime.onMessage.removeListener(listener)
      chrome.storage.onChanged.removeListener(storageListener)
      clearTimeout(timeout)
    }
  }, [onDone])

  const pct = progress.total && progress.processed
    ? Math.round((progress.processed / progress.total) * 100)
    : null

  return (
    <div className="flex flex-col items-center justify-center h-[360px] px-8">
      <div className="w-[120px] h-[120px] mb-6">
        <Ripple mainCircleSize={80} numCircles={6} mainCircleOpacity={0.15} />
      </div>

      <p className="text-[13px] font-medium mb-2" style={{ color: 'var(--fg)' }}>
        Scanning your inbox
      </p>

      <p className="text-[11px] text-center mb-4" style={{ color: 'var(--fg-3)' }}>
        {progress.step}
      </p>

      {/* Progress bar */}
      <div className="w-full max-w-[200px] h-[3px] rounded-full overflow-hidden" style={{ background: 'var(--divider)' }}>
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            background: 'var(--accent)',
            width: pct != null ? `${pct}%` : '100%',
            ...(pct == null ? { animation: 'indeterminate 1.5s ease-in-out infinite' } : {}),
          }}
        />
      </div>

      {pct != null && (
        <p className="text-[10px] mt-2 tabular-nums" style={{ color: 'var(--fg-3)' }}>
          {progress.processed} / {progress.total} emails
        </p>
      )}
    </div>
  )
}
