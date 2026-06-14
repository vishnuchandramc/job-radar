import { useCallback, useRef } from "react"
import { Moon, Sun } from "lucide-react"
import { flushSync } from "react-dom"

interface ThemeToggleProps {
  theme: "light" | "dark"
  onThemeChange: (theme: "light" | "dark") => void
  className?: string
}

export function ThemeToggle({ theme, onThemeChange, className = "" }: ThemeToggleProps) {
  const isDark = theme === "dark"
  const buttonRef = useRef<HTMLButtonElement>(null)

  const toggleTheme = useCallback(() => {
    const button = buttonRef.current
    if (!button) return

    const viewportWidth = window.visualViewport?.width ?? window.innerWidth
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight

    const { top, left, width, height } = button.getBoundingClientRect()
    const x = left + width / 2
    const y = top + height / 2

    const maxRadius = Math.hypot(
      Math.max(x, viewportWidth - x),
      Math.max(y, viewportHeight - y)
    )

    const applyTheme = () => {
      document.documentElement.classList.toggle("dark")
      onThemeChange(isDark ? "light" : "dark")
    }

    if (typeof document.startViewTransition !== "function") {
      applyTheme()
      return
    }

    const clipFrom = `circle(0px at ${x}px ${y}px)`
    const clipTo = `circle(${maxRadius}px at ${x}px ${y}px)`

    const root = document.documentElement
    root.style.setProperty("--magicui-theme-vt-clip-from", clipFrom)

    const transition = document.startViewTransition(() => {
      flushSync(applyTheme)
    })

    const cleanup = () => {
      root.style.removeProperty("--magicui-theme-vt-clip-from")
    }

    if (typeof transition?.finished?.finally === "function") {
      transition.finished.finally(cleanup)
    } else {
      cleanup()
    }

    transition?.ready?.then(() => {
      document.documentElement.animate(
        { clipPath: [clipFrom, clipTo] },
        {
          duration: 400,
          easing: "ease-in-out",
          fill: "forwards",
          pseudoElement: "::view-transition-new(root)",
        }
      )
    })
  }, [isDark, onThemeChange])

  return (
    <button
      type="button"
      ref={buttonRef}
      onClick={toggleTheme}
      className={`p-1 rounded-md transition-colors ${className}`}
      style={{ color: "var(--fg-3)" }}
      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
      title={isDark ? "Light mode" : "Dark mode"}
    >
      {isDark ? <Sun size={14} strokeWidth={1.8} /> : <Moon size={14} strokeWidth={1.8} />}
    </button>
  )
}
