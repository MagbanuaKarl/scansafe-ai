'use client'

import { useEffect, useRef } from 'react'

interface ScoreRingProps {
  score: number
  size?: number
}

export default function ScoreRing({ score, size = 160 }: ScoreRingProps) {
  const circleRef = useRef<SVGCircleElement>(null)

  const radius = (size - 20) / 2
  const circumference = 2 * Math.PI * radius
  const targetOffset = circumference - (score / 100) * circumference

  const color =
    score >= 75
      ? 'var(--success)'
      : score >= 50
        ? 'var(--warn)'
        : 'var(--danger)'

  useEffect(() => {
    const circle = circleRef.current
    if (!circle) return

    // Animate from full offset to target
    circle.style.strokeDashoffset = String(circumference)
    const timeout = setTimeout(() => {
      circle.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)'
      circle.style.strokeDashoffset = String(targetOffset)
    }, 200)

    return () => clearTimeout(timeout)
  }, [score, circumference, targetOffset])

  const label =
    score >= 75 ? 'Strong Match' : score >= 50 ? 'Partial Match' : 'Weak Match'

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface-3)"
          strokeWidth="10"
        />
        {/* Animated score ring */}
        <circle
          ref={circleRef}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
        {/* Score text */}
        <text
          x={size / 2}
          y={size / 2 - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill={color}
          fontSize="32"
          fontFamily="var(--font-display)"
          fontWeight="800"
        >
          {score}
        </text>
        <text
          x={size / 2}
          y={size / 2 + 20}
          textAnchor="middle"
          fill="var(--ink-dim)"
          fontSize="10"
          fontFamily="var(--font-body)"
          letterSpacing="2"
        >
          ATS SCORE
        </text>
      </svg>
      <span
        className="text-xs font-semibold tracking-widest uppercase px-3 py-1 rounded-full"
        style={{
          color,
          background: `${color}18`,
          border: `1px solid ${color}40`,
        }}
      >
        {label}
      </span>
    </div>
  )
}
