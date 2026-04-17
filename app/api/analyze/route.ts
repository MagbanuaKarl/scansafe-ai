import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'
import { extractTextFromPDF, isExtractedTextValid } from '@/lib/pdf-extractor'

const SYSTEM_INSTRUCTION = `You are an expert Technical Recruiter and ATS (Applicant Tracking System) Specialist. Your tone is blunt, analytical, and strictly factual.

YOUR RULES:
1. FACTUAL INTEGRITY: Never invent experience, skills, or metrics. If a skill isn't in the resume, list it as 'Missing,' do not add it.
2. STRUCTURED OUTPUT: Always respond in valid JSON format so the frontend can parse your analysis.
3. ATS OPTIMIZATION: When suggesting rephrasing, use the 'XYZ Formula': Accomplished [X] as measured by [Y], by doing [Z].
4. JARGON REDUCTION: Use plain, direct language. Avoid corporate fluff like 'passionate leader' or 'synergistic collaborator'.
5. NEVER wrap your response in markdown code blocks. Return raw JSON only.`

const ANALYSIS_PROMPT = (jobDescription: string) => `
Analyze the uploaded resume PDF against this job description:

--- JOB DESCRIPTION START ---
${jobDescription}
--- JOB DESCRIPTION END ---

Perform a complete ATS analysis and return ONLY a raw JSON object (no markdown, no code blocks) with this exact structure:

{
  "ats_score": <integer 0-100, honest ATS match score>,
  "parsed_text": "<clean plain text extraction of the resume content, preserving structure>",
  "keyword_matches": ["<keywords from JD that ARE in the resume>"],
  "missing_keywords": ["<important keywords from JD that are NOT in the resume>"],
  "suggested_rewrites": [
    {
      "original": "<exact bullet point from resume>",
      "improved": "<rewritten version using XYZ formula and JD keywords — only rephrasing, no invented facts>",
      "reason": "<1 sentence explaining what improved>"
    }
  ],
  "section_scores": {
    "formatting": <integer 0-100>,
    "keywords": <integer 0-100>,
    "impact": <integer 0-100>,
    "clarity": <integer 0-100>
  },
  "overall_verdict": "<2-3 sentence blunt summary of the resume's ATS performance. Be direct.>"
}

Rules:
- suggested_rewrites: pick the 3 weakest bullet points and improve them only
- Do not add skills or experience not present in the resume
- ats_score must reflect how well this resume would pass automated filtering for THIS specific job
- Return ONLY the JSON object, nothing else
`

const TEXT_ANALYSIS_PROMPT = (resumeText: string, jobDescription: string) => `
Analyze the following resume text against this job description:

--- RESUME TEXT ---
${resumeText}
--- RESUME TEXT END ---

--- JOB DESCRIPTION ---
${jobDescription}
--- JOB DESCRIPTION END ---

Perform a complete ATS analysis and return ONLY a raw JSON object (no markdown, no code blocks) with this exact structure:

{
  "ats_score": <integer 0-100, honest ATS match score>,
  "parsed_text": "<clean plain text extraction of the resume content, preserving structure>",
  "keyword_matches": ["<keywords from JD that ARE in the resume>"],
  "missing_keywords": ["<important keywords from JD that are NOT in the resume>"],
  "suggested_rewrites": [
    {
      "original": "<exact bullet point from resume>",
      "improved": "<rewritten version using XYZ formula and JD keywords — only rephrasing, no invented facts>",
      "reason": "<1 sentence explaining what improved>"
    }
  ],
  "section_scores": {
    "formatting": <integer 0-100>,
    "keywords": <integer 0-100>,
    "impact": <integer 0-100>,
    "clarity": <integer 0-100>
  },
  "overall_verdict": "<2-3 sentence blunt summary of the resume's ATS performance. Be direct.>"
}

Rules:
- suggested_rewrites: pick the 3 weakest bullet points and improve them only
- Do not add skills or experience not present in the resume
- ats_score must reflect how well this resume would pass automated filtering for THIS specific job
- Return ONLY the JSON object, nothing else
`

/** SSE event helpers */
function sseEvent(data: object, event?: string): string {
  const lines = [`data: ${JSON.stringify(data)}`]
  if (event) lines.unshift(`event: ${event}`)
  lines.push('')
  lines.push('')
  return lines.join('\n')
}

const encoder = new TextEncoder()

/** Build a streaming response from a Gemini stream */
function createStreamResponse(
  stream: AsyncGenerator<{ text?: string }>,
  usedFallback: boolean
): Response {
  const readable = new ReadableStream({
    async start(controller) {
      let fullText = ''

      try {
        // Send initial progress
        controller.enqueue(
          encoder.encode(sseEvent({ step: 'analyzing' }, 'progress'))
        )

        for await (const chunk of stream) {
          const chunkText = chunk.text ?? ''
          fullText += chunkText

          // Try to extract parsed fields incrementally
          const partial = tryParsePartial(fullText)
          if (partial) {
            controller.enqueue(
              encoder.encode(
                sseEvent({ step: 'rewrites', partial }, 'progress')
              )
            )
          }
        }

        // Final parse
        const cleaned = fullText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/\s*```$/i, '')
          .trim()

        let parsed
        try {
          parsed = JSON.parse(cleaned)
        } catch {
          console.error(
            'Failed to parse Gemini response:',
            cleaned.slice(0, 500)
          )
          controller.enqueue(
            encoder.encode(
              sseEvent(
                { error: 'AI returned an unexpected format. Please try again.' },
                'error'
              )
            )
          )
          controller.close()
          return
        }

        // Send final result
        controller.enqueue(
          encoder.encode(
            sseEvent(
              {
                ...parsed,
                _metadata: { used_pdf_fallback: usedFallback },
              },
              'done'
            )
          )
        )
        controller.close()
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : 'Unknown error occurred'

        if (message.includes('429') || message.includes('quota')) {
          controller.enqueue(
            encoder.encode(
              sseEvent(
                {
                  error:
                    'Gemini free tier rate limit reached. Wait 60 seconds and try again.',
                },
                'error'
              )
            )
          )
        } else {
          controller.enqueue(
            encoder.encode(sseEvent({ error: message }, 'error'))
          )
        }
        controller.close()
      }
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}

/**
 * Try to extract partial JSON from an incomplete string.
 * Returns null if nothing parseable is found.
 */
function tryParsePartial(text: string): Record<string, unknown> | null {
  if (!text || text.length < 10) return null

  // Try full parse first
  try {
    return JSON.parse(text)
  } catch {
    // Not yet complete — skip partial emission
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'GEMINI_API_KEY is not configured. Add it to your .env.local file.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const resumeFile = formData.get('resume') as File | null
    const jobDescription = formData.get('jobDescription') as string | null

    if (!resumeFile || !jobDescription) {
      return NextResponse.json(
        { error: 'Both a resume PDF and job description are required.' },
        { status: 400 }
      )
    }

    if (resumeFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Resume file must be under 10MB.' },
        { status: 400 }
      )
    }

    const ai = new GoogleGenAI({ apiKey })
    const fileBuffer = await resumeFile.arrayBuffer()
    const base64Data = Buffer.from(fileBuffer).toString('base64')

    // Path A: Try Gemini with raw PDF first (best quality)
    let stream: AsyncGenerator<{ text?: string }>
    let usedFallback = false

    try {
      stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: 'application/pdf',
                  data: base64Data,
                },
              },
              {
                text: ANALYSIS_PROMPT(jobDescription),
              },
            ],
          },
        ],
      })
    } catch (pdfError) {
      console.warn(
        '[PDF Fallback] Gemini failed to parse PDF directly, falling back to text extraction',
        pdfError instanceof Error ? pdfError.message : pdfError
      )
      usedFallback = true

      // Path B: Extract text locally and retry
      const extractedText = await extractTextFromPDF(fileBuffer)

      if (!isExtractedTextValid(extractedText)) {
        return NextResponse.json(
          {
            error:
              'Could not extract readable text from your PDF. The file may be image-based or heavily formatted. Try converting to plain text or using a simpler format.',
          },
          { status: 400 }
        )
      }

      console.log(
        `[PDF Fallback] Successfully extracted ${extractedText.length} characters from PDF`
      )

      stream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: TEXT_ANALYSIS_PROMPT(extractedText, jobDescription),
              },
            ],
          },
        ],
      })
    }

    return createStreamResponse(stream, usedFallback)
  } catch (error: unknown) {
    console.error('Gemini API error:', error)

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
