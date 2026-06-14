import { RefreshCw, Check, Settings } from 'lucide-react'
import { ThemeToggle } from './ThemeToggle'

interface HeaderProps {
  emailCount: number
  syncing: boolean
  theme: 'light' | 'dark'
  onSync: () => void
  onMarkAllSeen: () => void
  onOpenSettings: () => void
  onToggleTheme: () => void
}

export function Header({ emailCount, syncing, theme, onSync, onMarkAllSeen, onOpenSettings, onToggleTheme }: HeaderProps) {
  return (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{ borderBottom: '0.5px solid var(--divider)' }}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>Job Radar</span>
        <span className="text-[11px] tabular-nums" style={{ color: 'var(--fg-3)' }}>{emailCount}</span>
      </div>
      <div className="flex items-center gap-0.5">
        <ThemeToggle theme={theme} onThemeChange={() => onToggleTheme()} />
        <button onClick={onMarkAllSeen} className="p-1 rounded-md transition-colors" style={{ color: 'var(--fg-3)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Mark all seen">
          <Check size={14} strokeWidth={1.8} />
        </button>
        <button onClick={onSync} disabled={syncing} className="p-1 rounded-md transition-colors disabled:opacity-30" style={{ color: 'var(--fg-3)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Sync now">
          <RefreshCw size={14} strokeWidth={1.8} className={syncing ? 'animate-spin' : ''} />
        </button>
        <button onClick={onOpenSettings} className="p-1 rounded-md transition-colors" style={{ color: 'var(--fg-3)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'} title="Settings">
          <Settings size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
