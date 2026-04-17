'use client'

import { useEffect, useState } from 'react'
import type { AnalysisStep } from '@/lib/types'

const STEPS: { step: AnalysisStep; label: string; detail: string }[] = [
  {
    step: 'uploading',
    label: 'Uploading PDF',
    detail: 'Sending your resume to the Gemini API securely...',
  },
  {
    step: 'parsing',
    label: 'Parsing Document',
    detail: 'Extracting text, reading structure, detecting layout...',
  },
  {
    step: 'analyzing',
    label: 'Running Gap Analysis',
    detail: 'Comparing your resume against the job description...',
  },
  {
    step: 'rewrites',
    label: 'Generating Rewrites',
    detail: 'Finding your 3 weakest bullets and applying the XYZ formula...',
  },
]

const ANALYZING_QUOTES = [
  'Checking for buzzword pollution...',
  'Scanning for impact metrics...',
  'Measuring keyword density...',
  'Evaluating ATS compatibility...',
  'Analyzing your career...',
  'Counting passive voice instances...',
  'Looking for "results-oriented" clichés...',
]

interface LoadingStateProps {
  step: AnalysisStep
  streaming?: boolean
}

export default function LoadingState({ step, streaming }: LoadingStateProps) {
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [dots, setDots] = useState('')

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((i) => (i + 1) % ANALYZING_QUOTES.length)
    }, 1800)
    return () => clearInterval(quoteInterval)
  }, [])

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '' : d + '.'))
    }, 400)
    return () => clearInterval(dotsInterval)
  }, [])

  const activeStepIndex = STEPS.findIndex((s) => s.step === step)

  return (
    <div className="flex flex-col items-center gap-8 py-12 px-6 max-w-lg mx-auto">
      {/* Animated scanner visual */}
      <div className="relative w-24 h-32 flex items-center justify-center">
        <div
          className="absolute inset-0 rounded-lg border"
          style={{ borderColor: 'var(--accent)', opacity: 0.3 }}
        />
        {/* Scan line */}
        <div
          className="absolute left-0 right-0 h-0.5 animate-scan-line"
          style={{
            background:
              'linear-gradient(90deg, transparent, var(--accent), transparent)',
            boxShadow: '0 0 12px var(--accent)',
          }}
        />
        {/* Document lines */}
        {[20, 35, 50, 65, 80].map((top) => (
          <div
            key={top}
            className="absolute left-4 right-4 h-px rounded"
            style={{
              top: `${top}%`,
              background: 'var(--surface-3)',
            }}
          />
        ))}
      </div>

      {/* Current quote */}
      <p
        className="text-center font-mono text-sm"
        style={{ color: 'var(--accent)' }}
        key={quoteIndex}
      >
        {streaming ? 'Streaming live analysis' : ANALYZING_QUOTES[quoteIndex]}
        {dots}
      </p>

      {/* Steps */}
      <div className="w-full flex flex-col gap-3">
        {STEPS.map((s, i) => {
          const isDone = i < activeStepIndex
          const isActive = i === activeStepIndex
          const isPending = i > activeStepIndex

          return (
            <div
              key={s.step}
              className="flex items-start gap-3 transition-all duration-300"
              style={{ opacity: isPending ? 0.35 : 1 }}
            >
              {/* Step indicator */}
              <div
                className="mt-0.5 w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold"
                style={{
                  background: isDone
                    ? 'var(--success)'
                    : isActive
                      ? 'var(--accent)'
                      : 'var(--surface-3)',
                  color: isDone || isActive ? 'var(--surface-0)' : 'var(--ink-muted)',
                  boxShadow: isActive ? '0 0 12px var(--accent-glow)' : 'none',
                }}
              >
                {isDone ? '✓' : i + 1}
              </div>

              <div>
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: isDone
                      ? 'var(--success)'
                      : isActive
                        ? 'var(--ink)'
                        : 'var(--ink-muted)',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {s.label}
                </p>
                {isActive && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                    {s.detail}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Warning */}
      <p className="text-xs text-center" style={{ color: 'var(--ink-muted)' }}>
        {streaming
          ? 'Receiving real-time results from Gemini 2.5 Flash.'
          : 'Gemini 2.5 Flash is analyzing your full document.'}
        <br />
        {streaming ? 'Streaming active...' : 'This takes 5–15 seconds on the free tier.'}
      </p>
    </div>
  )
}
