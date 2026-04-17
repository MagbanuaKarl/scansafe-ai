'use client'

import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, Briefcase, Shield, Cpu, Eye, X } from 'lucide-react'
import LoadingState from '@/components/LoadingState'
import ResultsDashboard from '@/components/ResultsDashboard'
import ParsedTextPanel from '@/components/ParsedTextPanel'
import type { AnalysisResult, AnalysisStep, StreamEvent } from '@/lib/types'

type AppState =
  | { mode: 'input' }
  | { mode: 'loading'; step: AnalysisStep; streaming: boolean }
  | { mode: 'verify'; parsedResult: AnalysisResult }
  | { mode: 'results'; result: AnalysisResult }
  | { mode: 'error'; message: string }

export default function HomePage() {
  const [appState, setAppState] = useState<AppState>({ mode: 'input' })
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') {
      setResumeFile(file)
    }
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file?.type === 'application/pdf') {
      setResumeFile(file)
    }
  }

  /** Parse SSE event line from a text chunk */
  function parseSSEEvent(text: string): StreamEvent | null {
    const lines = text.split('\n')
    let eventType = 'message'
    let dataStr = ''

    for (const line of lines) {
      if (line.startsWith('event: ')) {
        eventType = line.slice(7).trim()
      } else if (line.startsWith('data: ')) {
        dataStr = line.slice(6).trim()
      }
    }

    if (!dataStr) return null

    try {
      const data = JSON.parse(dataStr)
      if (eventType === 'progress') {
        return { type: 'progress', step: data.step, partial: data.partial }
      }
      if (eventType === 'done') {
        return { type: 'done', result: data as AnalysisResult }
      }
      if (eventType === 'error') {
        return { type: 'error', error: data.error }
      }
    } catch {
      return null
    }
    return null
  }

  const handleSubmit = async () => {
    if (!resumeFile || !jobDescription.trim()) return

    setAppState({ mode: 'loading', step: 'uploading', streaming: true })

    try {
      const formData = new FormData()
      formData.append('resume', resumeFile)
      formData.append('jobDescription', jobDescription)

      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        setAppState({
          mode: 'error',
          message: errorData?.error || 'Analysis failed.',
        })
        return
      }

      if (!response.body) {
        setAppState({
          mode: 'error',
          message: 'Streaming not supported. Try again.',
        })
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // SSE events are separated by double newlines
        const parts = buffer.split('\n\n')
        buffer = parts.pop() || ''

        for (const part of parts) {
          if (!part.trim()) continue
          const event = parseSSEEvent(part)
          if (!event) continue

          if (event.type === 'progress') {
            setAppState({
              mode: 'loading',
              step: event.step,
              streaming: true,
            })
          } else if (event.type === 'done') {
            setAppState({
              mode: 'verify',
              parsedResult: event.result,
            })
            return
          } else if (event.type === 'error') {
            setAppState({
              mode: 'error',
              message: event.error,
            })
            return
          }
        }
      }

      // If stream ended without a 'done' event
      setAppState({
        mode: 'error',
        message: 'Stream ended unexpectedly. Try again.',
      })
    } catch (err) {
      setAppState({
        mode: 'error',
        message: 'Network error. Check your connection and try again.',
      })
    }
  }

  const handleVerifyConfirm = () => {
    if (appState.mode === 'verify') {
      setAppState({ mode: 'results', result: appState.parsedResult })
    }
  }

  const handleReset = () => {
    setAppState({ mode: 'input' })
    setResumeFile(null)
    setJobDescription('')
  }

  const canSubmit =
    resumeFile !== null &&
    jobDescription.trim().length > 50 &&
    appState.mode === 'input'

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header
        className="px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{
              background: 'var(--accent-dim)',
              border: '1px solid var(--accent)',
              boxShadow: '0 0 16px var(--accent-glow)',
            }}
          >
            <Shield size={16} style={{ color: 'var(--accent)' }} />
          </div>
          <span
            className="font-extrabold tracking-tighter text-lg"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            ScanSafe<span style={{ color: 'var(--accent)' }}>AI</span>
          </span>
        </div>

        <div className="flex items-center gap-5 text-xs" style={{ color: 'var(--ink-muted)' }}>
          <span className="flex items-center gap-1.5">
            <Cpu size={12} style={{ color: 'var(--accent)' }} />
            Gemini 2.5 Flash
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={12} style={{ color: 'var(--success)' }} />
            No data stored
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col items-center px-4 py-10">
        {/* Hero — only shown on input state */}
        {appState.mode === 'input' && (
          <div className="text-center mb-10 fade-up">
            <div
              className="inline-block text-xs font-mono px-3 py-1.5 rounded-full mb-5"
              style={{
                background: 'var(--accent-dim)',
                color: 'var(--accent)',
                border: '1px solid rgba(0, 229, 255, 0.25)',
              }}
            >
              Glass-Box ATS Scanner
            </div>
            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tighter leading-none mb-4"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              See Exactly How an
              <br />
              <span style={{ color: 'var(--accent)' }}>ATS Reads You.</span>
            </h1>
            <p className="text-base max-w-md mx-auto" style={{ color: 'var(--ink-dim)' }}>
              Upload your resume, paste the job description.
              Get a real match score, missing keywords, and 3 rewrites — no hallucinations.
            </p>
          </div>
        )}

        {/* Content */}
        <div className="w-full max-w-3xl">
          {/* Input form */}
          {appState.mode === 'input' && (
            <div className="flex flex-col gap-5">
              {/* File upload */}
              <div
                className={`glass-card p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 min-h-[160px] ${isDragging ? 'scale-[1.01]' : ''}`}
                style={{
                  borderColor: isDragging ? 'var(--accent)' : resumeFile ? 'rgba(0, 224, 150, 0.4)' : 'var(--border)',
                  boxShadow: isDragging ? '0 0 30px var(--accent-glow)' : 'none',
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => !resumeFile && fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {resumeFile ? (
                  <div className="flex items-center gap-3 w-full">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: 'rgba(0, 224, 150, 0.12)', border: '1px solid rgba(0, 224, 150, 0.3)' }}
                    >
                      <FileText size={20} style={{ color: 'var(--success)' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--ink)' }}>
                        {resumeFile.name}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: 'var(--ink-muted)' }}>
                        {(resumeFile.size / 1024).toFixed(0)} KB — PDF ready
                      </p>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setResumeFile(null) }}
                      className="p-1.5 rounded-md transition-all hover:opacity-70"
                      style={{ background: 'var(--surface-3)' }}
                    >
                      <X size={14} style={{ color: 'var(--ink-muted)' }} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: 'var(--accent-dim)', border: '1px solid var(--accent-glow)' }}
                    >
                      <Upload size={22} style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                        Drop your resume PDF here
                      </p>
                      <p className="text-xs mt-1" style={{ color: 'var(--ink-muted)' }}>
                        or click to browse — max 10MB
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Job description */}
              <div className="glass-card overflow-hidden">
                <div
                  className="flex items-center gap-2.5 px-4 py-3"
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <Briefcase size={14} style={{ color: 'var(--accent)' }} />
                  <span
                    className="text-xs font-bold uppercase tracking-widest"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--ink-muted)' }}
                  >
                    Job Description
                  </span>
                  <span className="ml-auto text-xs" style={{ color: 'var(--ink-muted)' }}>
                    {jobDescription.length} chars {jobDescription.length < 50 && jobDescription.length > 0 && (
                      <span style={{ color: 'var(--warn)' }}>— need more detail</span>
                    )}
                  </span>
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job description here. Include requirements, responsibilities, and desired skills. The more detail, the better the analysis..."
                  rows={8}
                  className="w-full p-4 text-sm resize-none outline-none bg-transparent"
                  style={{
                    color: 'var(--ink)',
                    fontFamily: 'var(--font-body)',
                    lineHeight: '1.6',
                  }}
                />
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
              >
                <Shield size={16} />
                Analyze Resume
              </button>

              {/* Disclaimer */}
              <p className="text-center text-xs" style={{ color: 'var(--ink-muted)' }}>
                Your resume is processed in-memory and never stored.
                Analysis uses Gemini 2.5 Flash with live streaming.
              </p>
            </div>
          )}

          {/* Loading */}
          {appState.mode === 'loading' && (
            <div className="glass-card">
              <LoadingState
                step={appState.step}
                streaming={appState.streaming}
              />
            </div>
          )}

          {/* Verify parsed text */}
          {appState.mode === 'verify' && (
            <div className="flex flex-col gap-5">
              <ParsedTextPanel
                parsedText={appState.parsedResult.parsed_text}
                onConfirm={handleVerifyConfirm}
                onReject={handleReset}
              />
            </div>
          )}

          {/* Results */}
          {appState.mode === 'results' && (
            <ResultsDashboard result={appState.result} onReset={handleReset} />
          )}

          {/* Error */}
          {appState.mode === 'error' && (
            <div
              className="glass-card p-6 text-center fade-up"
              style={{ borderColor: 'rgba(255, 77, 106, 0.3)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(255, 77, 106, 0.12)', border: '1px solid rgba(255, 77, 106, 0.3)' }}
              >
                <X size={22} style={{ color: 'var(--danger)' }} />
              </div>
              <p
                className="font-bold mb-2"
                style={{ fontFamily: 'var(--font-display)', color: 'var(--danger)' }}
              >
                Analysis Failed
              </p>
              <p className="text-sm mb-5" style={{ color: 'var(--ink-dim)' }}>
                {appState.message}
              </p>
              <button onClick={handleReset} className="btn-primary text-sm">
                Try Again
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center py-4 text-xs"
        style={{ color: 'var(--ink-muted)', borderTop: '1px solid var(--border)' }}
      >
        ScanSafe AI — Glass-box resume analysis. Built with Next.js + Gemini 2.5 Flash.
      </footer>
    </div>
  )
}
