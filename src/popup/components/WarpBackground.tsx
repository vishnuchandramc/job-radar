import React, { type HTMLAttributes } from "react"

interface WarpBackgroundProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  perspective?: number
  beamSize?: number
  gridColor?: string
}

export const WarpBackground: React.FC<WarpBackgroundProps> = ({
  children,
  perspective = 100,
  className = "",
  beamSize = 5,
  gridColor = "var(--divider)",
  ...props
}) => {
  const gridBg = `linear-gradient(${gridColor} 0 1px,transparent 1px ${beamSize}%) 50% -0.5px / ${beamSize}% ${beamSize}%,linear-gradient(90deg,${gridColor} 0 1px,transparent 1px ${beamSize}%) 50% 50% / ${beamSize}% ${beamSize}%`

  const sideStyle: React.CSSProperties = {
    backgroundSize: `${beamSize}% ${beamSize}%`,
    background: gridBg,
  }

  return (
    <div className={`relative ${className}`} {...props}>
      <div
        style={{ perspective: `${perspective}px`, transformStyle: "preserve-3d" }}
        className="pointer-events-none absolute top-0 left-0 w-full h-full overflow-hidden"
      >
        {/* top */}
        <div className="absolute w-full origin-[50%_0%]" style={{ ...sideStyle, height: "400px", transform: "rotateX(-90deg)", transformStyle: "preserve-3d" }} />
        {/* bottom */}
        <div className="absolute w-full origin-[50%_0%]" style={{ ...sideStyle, height: "400px", top: "100%", transform: "rotateX(-90deg)", transformStyle: "preserve-3d" }} />
        {/* left */}
        <div className="absolute top-0 left-0 origin-[0%_0%]" style={{ ...sideStyle, height: "400px", width: "100%", transform: "rotate(90deg) rotateX(-90deg)", transformStyle: "preserve-3d" }} />
        {/* right */}
        <div className="absolute top-0 right-0 origin-[100%_0%]" style={{ ...sideStyle, height: "400px", width: "100%", transform: "rotate(-90deg) rotateX(-90deg)", transformStyle: "preserve-3d" }} />
      </div>
      <div className="relative">{children}</div>
    </div>
  )
}
