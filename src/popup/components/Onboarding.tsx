import { useState } from 'react'
import { Radio } from 'lucide-react'
import { getAuthTokenInteractive, getUserProfile } from '../../lib/gmail'
import { saveUserEmail } from '../../lib/storage'
import { Ripple } from './Ripple'

interface OnboardingProps {
  onConnected: () => void
}

export function Onboarding({ onConnected }: OnboardingProps) {
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConnect = async () => {
    setConnecting(true)
    setError(null)
    try {
      await getAuthTokenInteractive()
      const email = await getUserProfile()
      await saveUserEmail(email)
      chrome.runtime.sendMessage({ type: 'INITIAL_SYNC' })
      onConnected()
    } catch {
      setError('Could not connect to Gmail. Please try again.')
      setConnecting(false)
    }
  }

  if (connecting) {
    return (
      <div className="flex flex-col items-center justify-center h-[360px]">
        <div className="w-[160px] h-[160px]">
          <Ripple />
        </div>
        <p className="text-[12px] mt-4" style={{ color: 'var(--fg-3)' }}>Connecting...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-[360px] px-8">
      <Radio size={28} strokeWidth={1.5} style={{ color: 'var(--fg-3)' }} className="mb-4" />
      <h1 className="text-[15px] font-semibold mb-1" style={{ color: 'var(--fg)' }}>Job Radar</h1>
      <p className="text-[12px] text-center mb-8 leading-relaxed max-w-[220px]" style={{ color: 'var(--fg-2)' }}>
        Passively tracks your job search emails. Interview requests, offers, rejections — at a glance.
      </p>

      <button
        onClick={handleConnect}
        className="w-full max-w-[200px] flex items-center justify-center gap-2 py-2 text-[13px] font-medium rounded-lg transition-opacity hover:opacity-90"
        style={{ background: 'var(--fg)', color: 'var(--bg)' }}
      >
        Connect Gmail
      </button>

      <p className="text-[10px] text-center mt-4 max-w-[200px] leading-relaxed" style={{ color: 'var(--fg-3)' }}>
        Read-only metadata access. We never see your email content.
      </p>

      {error && <p className="text-[11px] mt-3" style={{ color: 'var(--danger)' }}>{error}</p>}
    </div>
  )
}
