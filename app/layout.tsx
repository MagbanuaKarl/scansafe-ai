import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScanSafe AI — Glass-Box Resume Grader',
  description: 'See exactly how an ATS reads your resume. Get a real match score and targeted rewrites — no hallucinations, no fluff.',
  keywords: ['resume', 'ATS', 'job search', 'resume scanner', 'keyword analysis'],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="scan-bg min-h-screen">
        {children}
      </body>
    </html>
  )
}
