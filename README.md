# ScanSafe AI — Glass-Box Resume Grader

A **"Glass-Box" ATS Scanner** that shows users exactly how an Applicant Tracking System reads their resume, with a real match score, missing keywords, and 3 targeted bullet-point rewrites.

Built with **Next.js 14 + Tailwind CSS + Gemini 1.5 Flash** (free tier).

---

## ✨ Features

| Feature | Description |
|---|---|
| **ATS Score** | 0–100 score with animated ring showing how well your resume matches the JD |
| **Section Scores** | Formatting, Keywords, Impact, Clarity breakdown |
| **Keyword Gap Analysis** | Side-by-side view of matched vs. missing keywords |
| **The Mirror Tool** | 3 weakest bullet points rewritten with the XYZ formula — no facts invented |
| **Parsed Text Viewer** | Shows how Gemini read your PDF before running analysis (catches 2-column layout issues) |
| **Rate Limit Protection** | Single-pass API call + disabled button during processing |

---

## 🚀 Setup (5 minutes)

### 1. Get a Free Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click **"Create API Key"**
3. Copy the key

### 2. Clone & Install

```bash
git clone <your-repo>
cd scansafe-ai
npm install
```

### 3. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and replace with your key:
```
GEMINI_API_KEY=AIzaSy...your_key_here
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
scansafe-ai/
├── app/
│   ├── api/analyze/route.ts   # Gemini API integration (single-pass)
│   ├── globals.css            # Design tokens + animations
│   ├── layout.tsx
│   └── page.tsx               # Main UI / state machine
├── components/
│   ├── ScoreRing.tsx          # Animated SVG score ring
│   ├── LoadingState.tsx       # Step-by-step loading with quotes
│   ├── ParsedTextPanel.tsx    # PDF parse verification step
│   └── ResultsDashboard.tsx   # Tabbed results view
└── lib/
    └── types.ts               # Shared TypeScript types
```

---

## 🔑 API Design (Single-Pass)

To stay under the **15 requests/minute** free tier limit, the entire analysis is done in **one Gemini call**:

- PDF document (inline base64)
- Job description text
- Returns combined JSON: score + parsed text + keywords + rewrites

The loading UI simulates step progression to prevent users from spamming the submit button.

---

## ⚠️ Known Limitations

1. **2-Column Layouts**: Gemini may misread column order in complex PDFs. The **Verify Parsed Text** step lets users catch this before analysis runs.
2. **Free Tier Rate Limit**: 15 req/min. If you hit it, wait 60 seconds.
3. **No History**: V1 stores nothing. Each session is fresh.
4. **PDF Only**: Images-only scanned PDFs will return poor results.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS + custom CSS variables
- **AI**: `@google/generative-ai` SDK — Gemini 1.5 Flash
- **Icons**: `lucide-react`
- **Fonts**: Syne (display) + DM Sans (body) + DM Mono (code)

---

## 📈 V2 Ideas

- [ ] Add PostgreSQL + Prisma for resume history (with user consent)
- [ ] Support `.docx` files via `mammoth` 
- [ ] Side-by-side diff view for rewrites
- [ ] Export analysis as PDF report
- [ ] Industry-specific scoring presets
