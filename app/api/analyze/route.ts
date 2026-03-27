import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI } from '@google/genai'

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

    // Convert file to base64 for inline data
    const fileBuffer = await resumeFile.arrayBuffer()
    const base64Data = Buffer.from(fileBuffer).toString('base64')

    // Single-pass: send resume + JD together
    const response = await ai.models.generateContent({
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

    const responseText = response.text ?? ''

    // Strip any accidental markdown code fences
    const cleaned = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()

    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Gemini response:', cleaned.slice(0, 500))
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(parsed)
  } catch (error: unknown) {
    console.error('Gemini API error:', error)

    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'

    // Handle rate limit specifically
    if (message.includes('429') || message.includes('quota')) {
      return NextResponse.json(
        {
          error:
            'Gemini free tier rate limit reached. Wait 60 seconds and try again.',
        },
        { status: 429 }
      )
    }

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
