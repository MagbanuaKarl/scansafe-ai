'use client'

import { AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

interface ParsedTextPanelProps {
  parsedText: string
  onConfirm: () => void
  onReject: () => void
}

export default function ParsedTextPanel({
  parsedText,
  onConfirm,
  onReject,
}: ParsedTextPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <div
      className="glass-card overflow-hidden fade-up"
      style={{ borderColor: 'rgba(255, 184, 48, 0.3)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4 cursor-pointer"
        style={{ borderBottom: '1px solid var(--border)' }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={16} style={{ color: 'var(--warn)' }} />
          <span
            className="font-semibold text-sm tracking-wide"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--warn)' }}
          >
            Step 1: Verify Parsed Text
          </span>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={{
              background: 'rgba(255, 184, 48, 0.12)',
              color: 'var(--warn)',
              border: '1px solid rgba(255, 184, 48, 0.25)',
            }}
          >
            ACTION REQUIRED
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={16} style={{ color: 'var(--ink-muted)' }} />
        ) : (
          <ChevronDown size={16} style={{ color: 'var(--ink-muted)' }} />
        )}
      </div>

      {isExpanded && (
        <div className="px-5 pb-5">
          <p className="text-sm mt-4 mb-3" style={{ color: 'var(--ink-dim)' }}>
            This is how the AI read your resume. Complex 2-column layouts may have{' '}
            <strong style={{ color: 'var(--warn)' }}>reordered sections</strong>.
            Confirm before running the full analysis.
          </p>

          {/* Parsed text display */}
          <div
            className="rounded-lg p-4 font-mono text-xs leading-relaxed overflow-y-auto max-h-64"
            style={{
              background: 'var(--surface-0)',
              color: 'var(--ink-dim)',
              border: '1px solid var(--border)',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {parsedText || 'No text could be extracted from the document.'}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={onConfirm}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'var(--success)',
                color: 'var(--surface-0)',
                fontFamily: 'var(--font-display)',
                boxShadow: '0 0 16px rgba(0, 224, 150, 0.3)',
              }}
            >
              <CheckCircle size={15} />
              Looks correct — Run Analysis
            </button>
            <button
              onClick={onReject}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{
                background: 'var(--surface-3)',
                color: 'var(--ink-dim)',
                border: '1px solid var(--border)',
              }}
            >
              Something's wrong — Start Over
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
