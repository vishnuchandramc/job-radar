import { Inbox } from 'lucide-react'
import { WarpBackground } from './WarpBackground'

export function EmptyState() {
  return (
    <WarpBackground beamSize={8} perspective={150} gridColor="var(--divider)">
      <div className="flex flex-col items-center justify-center py-16 px-6">
        <Inbox size={24} strokeWidth={1.5} style={{ color: 'var(--fg-3)' }} className="mb-3" />
        <p className="text-[13px] font-medium mb-0.5" style={{ color: 'var(--fg)' }}>No job emails yet</p>
        <p className="text-[11px] text-center leading-relaxed" style={{ color: 'var(--fg-3)' }}>
          Emails from Greenhouse, Lever, LinkedIn will appear here.
        </p>
      </div>
    </WarpBackground>
  )
}
