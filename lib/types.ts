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
}

export type AnalysisStep =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'analyzing'
  | 'rewrites'
  | 'done'
  | 'error'
