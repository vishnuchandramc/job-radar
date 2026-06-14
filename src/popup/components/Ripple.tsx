import React, { type CSSProperties } from "react"

interface RippleProps {
  mainCircleSize?: number
  mainCircleOpacity?: number
  numCircles?: number
}

export const Ripple = React.memo(function Ripple({
  mainCircleSize = 210,
  mainCircleOpacity = 0.24,
  numCircles = 8,
}: RippleProps) {
  return (
    <div className="pointer-events-none absolute inset-0 select-none" style={{ mask: "linear-gradient(to bottom, white, transparent)" }}>
      {Array.from({ length: numCircles }, (_, i) => {
        const size = mainCircleSize + i * 70
        const opacity = mainCircleOpacity - i * 0.03

        return (
          <div
            key={i}
            className="animate-ripple absolute rounded-full"
            style={
              {
                "--i": i,
                width: `${size}px`,
                height: `${size}px`,
                opacity,
                animationDelay: `${i * 0.06}s`,
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--fg-3)",
                background: "var(--bg-hover)",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) scale(1)",
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
})
