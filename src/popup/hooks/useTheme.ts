import { useState, useEffect, useCallback } from 'react'

type Theme = 'light' | 'dark'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>('dark')

  useEffect(() => {
    chrome.storage.local.get('theme').then((data) => {
      const saved = (data.theme as Theme) || 'dark'
      setThemeState(saved)
      document.documentElement.classList.toggle('dark', saved === 'dark')
    })
  }, [])

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t)
    document.documentElement.classList.toggle('dark', t === 'dark')
    chrome.storage.local.set({ theme: t })
  }, [])

  const toggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  return { theme, toggle }
}
