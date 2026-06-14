import { useState } from 'react'
import { ArrowLeft, Plus, X, LogOut } from 'lucide-react'
import type { Settings } from '../../types'
import { revokeAuthToken } from '../../lib/gmail'
import { clearUserData } from '../../lib/storage'

interface SettingsPanelProps {
  settings: Settings
  onSave: (settings: Settings) => void
  onDisconnect: () => void
  onBack: () => void
}

export function SettingsPanel({ settings, onSave, onDisconnect, onBack }: SettingsPanelProps) {
  const [syncInterval, setSyncInterval] = useState(settings.syncIntervalMinutes)
  const [customDomain, setCustomDomain] = useState('')
  const [domains, setDomains] = useState(settings.customDomains)

  const handleSyncChange = (value: number) => {
    setSyncInterval(value)
    onSave({ ...settings, syncIntervalMinutes: value, customDomains: domains })
  }

  const handleAddDomain = () => {
    const domain = customDomain.trim().toLowerCase()
    if (domain && !domains.includes(domain)) {
      const updated = [...domains, domain]
      setDomains(updated)
      setCustomDomain('')
      onSave({ ...settings, customDomains: updated, syncIntervalMinutes: syncInterval })
    }
  }

  const handleRemoveDomain = (domain: string) => {
    const updated = domains.filter((d) => d !== domain)
    setDomains(updated)
    onSave({ ...settings, customDomains: updated, syncIntervalMinutes: syncInterval })
  }

  const handleDisconnect = async () => {
    await revokeAuthToken()
    await clearUserData()
    chrome.runtime.sendMessage({ type: 'DISCONNECT' })
    onDisconnect()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: '0.5px solid var(--divider)' }}>
        <button onClick={onBack} className="p-1 rounded-md transition-colors" style={{ color: 'var(--fg-3)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
          <ArrowLeft size={14} strokeWidth={1.8} />
        </button>
        <span className="text-[13px] font-medium" style={{ color: 'var(--fg)' }}>Settings</span>
      </div>

      <div className="py-1">
        {/* Sync frequency */}
        <div className="px-3 pt-2 pb-1">
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--fg-3)' }}>Sync frequency</p>
          <select
            value={syncInterval}
            onChange={(e) => handleSyncChange(Number(e.target.value))}
            className="w-full px-2.5 py-1.5 text-[13px] rounded-md outline-none appearance-none"
            style={{ background: 'var(--bg-hover)', color: 'var(--fg)', border: '0.5px solid var(--divider)' }}
          >
            <option value={5}>Every 5 minutes</option>
            <option value={15}>Every 15 minutes</option>
            <option value={30}>Every 30 minutes</option>
            <option value={60}>Every 60 minutes</option>
          </select>
        </div>

        <div className="my-1.5 mx-3" style={{ borderBottom: '0.5px solid var(--divider)' }} />

        {/* Custom domains */}
        <div className="px-3 pt-1 pb-1">
          <p className="text-[11px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--fg-3)' }}>Custom domains</p>
          <div className="flex gap-1.5">
            <input
              type="text"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
              placeholder="careers.acme.com"
              className="flex-1 px-2.5 py-1.5 text-[13px] rounded-md outline-none"
              style={{ background: 'var(--bg-hover)', color: 'var(--fg)', border: '0.5px solid var(--divider)' }}
            />
            <button
              onClick={handleAddDomain}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: 'var(--fg-3)', border: '0.5px solid var(--divider)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <Plus size={14} strokeWidth={1.8} />
            </button>
          </div>
          {domains.length > 0 && (
            <div className="mt-2 space-y-0.5">
              {domains.map((domain) => (
                <div key={domain} className="flex items-center justify-between px-2.5 py-1 rounded-md" style={{ background: 'var(--bg-hover)' }}>
                  <span className="text-[12px]" style={{ color: 'var(--fg-2)' }}>{domain}</span>
                  <button onClick={() => handleRemoveDomain(domain)} className="p-0.5 rounded transition-colors" style={{ color: 'var(--fg-3)' }}>
                    <X size={11} strokeWidth={2} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="my-1.5 mx-3" style={{ borderBottom: '0.5px solid var(--divider)' }} />

        {/* Disconnect */}
        <button
          onClick={handleDisconnect}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md transition-colors text-left"
          style={{ color: 'var(--danger)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          <LogOut size={15} strokeWidth={1.8} />
          <span className="text-[13px]">Disconnect Gmail</span>
        </button>
      </div>
    </div>
  )
}
