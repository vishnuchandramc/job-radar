import { useState } from 'react'
import type { EmailCategory } from './types'
import { useStorage } from './popup/hooks/useStorage'
import { useTheme } from './popup/hooks/useTheme'
import { Header } from './popup/components/Header'
import { CategoryCard } from './popup/components/CategoryCard'
import { EmptyState } from './popup/components/EmptyState'
import { ErrorState } from './popup/components/ErrorState'
import { Onboarding } from './popup/components/Onboarding'
import { SettingsPanel } from './popup/components/SettingsPanel'
import { Ripple } from './popup/components/Ripple'
import { CATEGORY_PRIORITY } from './lib/constants'

export default function App() {
  const {
    activeEmails,
    historyEmails,
    settings,
    userEmail,
    connectionState,
    syncing,
    initialLoading,
    handleSync,
    handleMarkSeen,
    handleMarkAllSeen,
    handleDismiss,
    handleUpdateSettings,
    setConnectionState,
    loadData,
  } = useStorage()

  const { theme, toggle: toggleTheme } = useTheme()
  const [showSettings, setShowSettings] = useState(false)

  // Loading — hardcoded for testing
  const forceLoader = true
  if (initialLoading || forceLoader) {
    return (
      <div className="w-[380px] h-[360px] relative overflow-hidden flex flex-col items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Ripple mainCircleSize={100} numCircles={7} mainCircleOpacity={0.2} />
        <p className="relative text-[12px]" style={{ color: 'var(--fg-3)' }}>Scanning your inbox...</p>
      </div>
    )
  }

  // Not connected
  if (!userEmail || connectionState === 'disconnected') {
    if (connectionState === 'disconnected' && userEmail) {
      return (
        <div className="w-[380px]" style={{ background: 'var(--bg)' }}>
          <ErrorState onReconnect={() => { setConnectionState('connected'); loadData() }} />
        </div>
      )
    }
    return (
      <div className="w-[380px]" style={{ background: 'var(--bg)' }}>
        <Onboarding onConnected={loadData} />
      </div>
    )
  }

  // Settings
  if (showSettings && settings) {
    return (
      <div className="w-[380px]" style={{ background: 'var(--bg)' }}>
        <SettingsPanel
          settings={settings}
          onSave={handleUpdateSettings}
          onDisconnect={() => { setConnectionState('disconnected'); setShowSettings(false) }}
          onBack={() => setShowSettings(false)}
        />
      </div>
    )
  }

  // Group by category
  const emailsByCategory = CATEGORY_PRIORITY.reduce(
    (acc, category) => {
      acc[category] = activeEmails
        .filter((e) => e.category === category)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return acc
    },
    {} as Record<EmailCategory, typeof activeEmails>
  )

  const hasActiveEmails = activeEmails.length > 0
  const hasHistoryEmails = historyEmails.length > 0

  return (
    <div className="w-[380px]" style={{ background: 'var(--bg)' }}>
      <Header
        emailCount={activeEmails.length}
        syncing={syncing}
        theme={theme}
        onSync={handleSync}
        onMarkAllSeen={handleMarkAllSeen}
        onOpenSettings={() => setShowSettings(true)}
        onToggleTheme={toggleTheme}
      />

      {!hasActiveEmails && !hasHistoryEmails ? (
        <EmptyState />
      ) : (
        <div className="py-1">
          {/* Category rows */}
          {CATEGORY_PRIORITY.map((category) => (
            <CategoryCard
              key={category}
              category={category}
              emails={emailsByCategory[category]}
              onClickEmail={handleMarkSeen}
              onDismiss={handleDismiss}
            />
          ))}

          {/* History section */}
          {hasHistoryEmails && (
            <>
              <div className="mx-3 my-1" style={{ borderBottom: '0.5px solid var(--divider)' }} />
              <p className="px-3 pt-1 pb-1 text-[11px] font-medium uppercase tracking-wider" style={{ color: 'var(--fg-3)' }}>
                History
              </p>
              {historyEmails
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 8)
                .map((email) => (
                  <div
                    key={email.id}
                    onClick={() => handleMarkSeen(email.id, email.threadId)}
                    className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-colors"
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <span className="text-[12px] truncate flex-1 min-w-0" style={{ color: 'var(--fg-2)' }}>
                      {email.subject}
                    </span>
                    <span className="text-[10px] tabular-nums shrink-0" style={{ color: 'var(--fg-3)' }}>
                      {new Date(email.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                ))}
            </>
          )}

          <div className="h-1" />
        </div>
      )}

      {/* Offline */}
      {connectionState === 'offline' && (
        <div className="px-3 py-1.5 text-center" style={{ borderTop: '0.5px solid var(--divider)' }}>
          <span className="text-[11px]" style={{ color: 'var(--amber)' }}>Offline — showing cached data</span>
        </div>
      )}
    </div>
  )
}
