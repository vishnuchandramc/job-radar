import React, { type HTMLAttributes } from "react"

interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  perspective?: number
  gridSize?: number
  gridColor?: string
}

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 200,
  className = "",
  gridSize = 40,
  gridColor = "var(--divider)",
  ...props
}) => {
  const gridBg = [
    `linear-gradient(${gridColor} 1px, transparent 1px)`,
    `linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
  ].join(", ")

  return (
    <div className={`relative overflow-hidden ${className}`} {...props}>
      <div
        className="pointer-events-none absolute inset-0"
        style={{ perspective: `${perspective}px` }}
      >
        {/* Floor grid */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "-50%",
            width: "200%",
            height: "200%",
            transformOrigin: "bottom center",
            transform: "rotateX(60deg)",
            background: gridBg,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        />
        {/* Fade overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at 50% 70%, transparent 20%, var(--bg) 70%)`,
          }}
        />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
