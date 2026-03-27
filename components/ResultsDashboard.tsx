'use client'

import { useState } from 'react'
import {
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart2,
  Zap,
  AlignLeft,
  RotateCcw,
} from 'lucide-react'
import ScoreRing from './ScoreRing'
import type { AnalysisResult } from '@/lib/types'

interface ResultsDashboardProps {
  result: AnalysisResult
  onReset: () => void
}

function SectionScoreBar({
  label,
  score,
  delay,
}: {
  label: string
  score: number
  delay: number
}) {
  const color =
    score >= 75 ? 'var(--success)' : score >= 50 ? 'var(--warn)' : 'var(--danger)'

  return (
    <div className="fade-up" style={{ animationDelay: `${delay}ms`, opacity: 0 }}>
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs font-medium" style={{ color: 'var(--ink-dim)' }}>
          {label}
        </span>
        <span className="text-xs font-bold font-mono" style={{ color }}>
          {score}
        </span>
      </div>
      <div
        className="h-1.5 rounded-full overflow-hidden"
        style={{ background: 'var(--surface-3)' }}
      >
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${score}%`,
            background: color,
            boxShadow: `0 0 6px ${color}`,
          }}
        />
      </div>
    </div>
  )
}

type Tab = 'overview' | 'keywords' | 'rewrites'

export default function ResultsDashboard({ result, onReset }: ResultsDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart2 size={14} /> },
    { id: 'keywords', label: 'Keywords', icon: <Zap size={14} /> },
    { id: 'rewrites', label: 'Rewrites', icon: <AlignLeft size={14} /> },
  ]

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-5">
      {/* Header bar */}
      <div className="flex items-center justify-between fade-up">
        <div>
          <h2
            className="text-xl font-extrabold tracking-tight"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Analysis Complete
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
            Powered by Gemini 1.5 Flash — no data stored
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{
            background: 'var(--surface-2)',
            color: 'var(--ink-dim)',
            border: '1px solid var(--border)',
          }}
        >
          <RotateCcw size={13} />
          New Scan
        </button>
      </div>

      {/* Score + verdict card */}
      <div
        className="glass-card p-6 flex flex-col sm:flex-row items-center gap-6 fade-up fade-up-delay-1"
      >
        <ScoreRing score={result.ats_score} />
        <div className="flex-1">
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--ink-dim)' }}
          >
            {result.overall_verdict}
          </p>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <SectionScoreBar label="Formatting" score={result.section_scores.formatting} delay={200} />
            <SectionScoreBar label="Keywords" score={result.section_scores.keywords} delay={300} />
            <SectionScoreBar label="Impact" score={result.section_scores.impact} delay={400} />
            <SectionScoreBar label="Clarity" score={result.section_scores.clarity} delay={500} />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-lg fade-up fade-up-delay-2"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-semibold transition-all"
            style={{
              background: activeTab === tab.id ? 'var(--surface-3)' : 'transparent',
              color: activeTab === tab.id ? 'var(--accent)' : 'var(--ink-muted)',
              fontFamily: 'var(--font-display)',
              border: activeTab === tab.id ? '1px solid var(--border-hover)' : '1px solid transparent',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="glass-card p-5 fade-up">
          <h3
            className="text-sm font-bold mb-4 tracking-wide uppercase"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-muted)', fontSize: '11px', letterSpacing: '2px' }}
          >
            Raw ATS Summary
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Matched Keywords</p>
              <p className="text-3xl font-extrabold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--success)' }}>
                {result.keyword_matches.length}
              </p>
            </div>
            <div
              className="p-4 rounded-lg"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
            >
              <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>Missing Keywords</p>
              <p className="text-3xl font-extrabold mt-1" style={{ fontFamily: 'var(--font-display)', color: 'var(--danger)' }}>
                {result.missing_keywords.length}
              </p>
            </div>
          </div>

          <div className="mt-4 text-xs" style={{ color: 'var(--ink-muted)', fontFamily: 'var(--font-mono)' }}>
            <p className="mb-2" style={{ color: 'var(--ink-dim)' }}>
              What this score means:
            </p>
            <ul className="space-y-1">
              <li>• 75–100: Resume will likely pass ATS filtering</li>
              <li>• 50–74: May pass, but needs keyword improvements</li>
              <li>• 0–49: High risk of auto-rejection before human review</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'keywords' && (
        <div className="glass-card p-5 fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Matched */}
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: 'var(--success)', fontFamily: 'var(--font-display)' }}
              >
                <CheckCircle size={12} />
                Found in Resume ({result.keyword_matches.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.keyword_matches.length > 0 ? (
                  result.keyword_matches.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        background: 'rgba(0, 224, 150, 0.1)',
                        color: 'var(--success)',
                        border: '1px solid rgba(0, 224, 150, 0.25)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    No matching keywords found.
                  </p>
                )}
              </div>
            </div>

            {/* Missing */}
            <div>
              <h3
                className="text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2"
                style={{ color: 'var(--danger)', fontFamily: 'var(--font-display)' }}
              >
                <XCircle size={12} />
                Missing Keywords ({result.missing_keywords.length})
              </h3>
              <div className="flex flex-wrap gap-2">
                {result.missing_keywords.length > 0 ? (
                  result.missing_keywords.map((kw) => (
                    <span
                      key={kw}
                      className="px-2.5 py-1 rounded-md text-xs font-medium"
                      style={{
                        background: 'rgba(255, 77, 106, 0.1)',
                        color: 'var(--danger)',
                        border: '1px solid rgba(255, 77, 106, 0.25)',
                        fontFamily: 'var(--font-mono)',
                      }}
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                    All key terms are covered.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewrites' && (
        <div className="flex flex-col gap-3 fade-up">
          <p className="text-xs px-1" style={{ color: 'var(--ink-muted)' }}>
            3 weakest bullets rewritten using the XYZ formula. No facts invented — only rephrased using JD keywords.
          </p>
          {result.suggested_rewrites.map((rw, i) => (
            <div key={i} className="glass-card p-5">
              {/* Before */}
              <div className="mb-3">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--danger)', fontFamily: 'var(--font-display)' }}
                >
                  Before
                </span>
                <p
                  className="mt-1.5 text-sm leading-relaxed line-through"
                  style={{
                    color: 'var(--ink-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                  }}
                >
                  {rw.original}
                </p>
              </div>

              {/* Arrow */}
              <div className="flex items-center gap-2 my-2">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <ArrowRight size={14} style={{ color: 'var(--accent)' }} />
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>

              {/* After */}
              <div>
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'var(--success)', fontFamily: 'var(--font-display)' }}
                >
                  After
                </span>
                <p
                  className="mt-1.5 text-sm leading-relaxed"
                  style={{
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                  }}
                >
                  {rw.improved}
                </p>
              </div>

              {/* Reason + Copy */}
              <div className="flex items-start justify-between gap-3 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--ink-muted)' }}>
                  💡 {rw.reason}
                </p>
                <button
                  onClick={() => handleCopy(rw.improved, i)}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-md transition-all"
                  style={{
                    background: copiedIndex === i ? 'var(--success)' : 'var(--surface-3)',
                    color: copiedIndex === i ? 'var(--surface-0)' : 'var(--ink-dim)',
                    border: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {copiedIndex === i ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
