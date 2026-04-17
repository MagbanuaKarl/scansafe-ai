import pdf from 'pdf-parse'

/**
 * Extract clean text content from a PDF file.
 * Used as a fallback when Gemini can't parse complex PDF layouts.
 *
 * @param fileBuffer - ArrayBuffer of the PDF file
 * @returns Extracted text content
 */
export async function extractTextFromPDF(
  fileBuffer: ArrayBuffer
): Promise<string> {
  try {
    const data = await pdf(Buffer.from(fileBuffer))

    if (!data.text || data.text.trim().length === 0) {
      throw new Error('No text content could be extracted from the PDF.')
    }

    // Clean up excessive whitespace but preserve structure
    return data.text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`PDF extraction failed: ${error.message}`)
    }
    throw new Error('PDF extraction failed with an unknown error.')
  }
}

/**
 * Check if extracted text from Gemini is sufficient.
 * Returns false if the text is too short or appears to be garbage.
 */
export function isExtractedTextValid(text: string): boolean {
  const minLength = 50 // Reasonable minimum for a resume
  const trimmed = text.trim()

  return (
    trimmed.length >= minLength &&
    // Check if text contains recognizable patterns (letters, not just symbols)
    /[a-zA-Z]{3,}/.test(trimmed)
  )
}
