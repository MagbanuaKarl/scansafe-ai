export interface SuggestedRewrite {
  original: string
  improved: string
  reason: string
}

export interface AnalysisResult {
  ats_score: number
  parsed_text: string
  keyword_matches: string[]
  missing_keywords: string[]
  suggested_rewrites: SuggestedRewrite[]
  overall_verdict: string
  section_scores: {
    formatting: number
    keywords: number
    impact: number
    clarity: number
  }
  _metadata?: {
    used_pdf_fallback: boolean
  }
}

export type AnalysisStep =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'analyzing'
  | 'rewrites'
  | 'done'
  | 'error'

/** SSE progress event from the streaming API */
export interface StreamProgress {
  type: 'progress'
  step: AnalysisStep
  partial?: Record<string, unknown>
}

export interface StreamDone {
  type: 'done'
  result: AnalysisResult
}

export interface StreamError {
  type: 'error'
  error: string
}

export type StreamEvent = StreamProgress | StreamDone | StreamError
