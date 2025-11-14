## Pitch Tuner

- **What it is**: AI-assisted coach that records a pitch, transcribes it, scores clarity/structure/pacing/tone/persuasiveness, and regenerates improved drafts tailored to audience and duration.
- **Why it helps**: Gives founders, PMs, and job seekers a guided rehearsal loop so they can iterate quickly ahead of investor meetings, demos, or interviews.

## Project Structure

- **backend**: Express + TypeScript API for transcription, scoring heuristics, and OpenAI-powered feedback/pitch rewriting.
- **frontend**: Next.js + Tailwind UI with microphone recorder, session controls, and analysis dashboard.
- **shared conventions**: Environment variables drive API endpoints; both apps expect Node 18+.

## Getting Started

- **Prerequisites**
  - Node.js 18 or newer
  - npm (or pnpm/yarn if you adapt the scripts)
  - OpenAI API key (for live transcription/analysis/regeneration)
  - Browser that supports `MediaRecorder` (Chrome, Edge, Firefox)

### 1. Clone & Install

- **Clone repo**
  - `git clone <repo> && cd workspace`
- **Install deps**
  - `cd backend && npm install`
  - `cd ../frontend && npm install`

### 2. Configure Environment

- **Backend**
  - Copy `backend/.env.example` → `backend/.env`
  - Set:
    - `OPENAI_API_KEY` – required for live transcription & AI feedback (fallback heuristics still run without it)
    - `OPENAI_MODEL_GPT` / `OPENAI_MODEL_TRANSCRIPTION` – override if you use different OpenAI models
    - `PORT` – optional (default `4000`)
    - `ORIGIN_WHITELIST` – CSV list of allowed frontends (default `http://localhost:3000`)
- **Frontend**
  - Copy `frontend/.env.example` → `frontend/.env.local`
  - Set `NEXT_PUBLIC_API_BASE_URL` to your backend URL (default `http://localhost:4000`)

### 3. Run in Development

- **Backend**
  - `cd backend`
  - `npm run dev`
  - API available at `http://localhost:4000/api`
- **Frontend**
  - `cd frontend`
  - `npm run dev`
  - Web app at `http://localhost:3000`

## API Overview

- **POST `/api/pitch/process`** (multipart/form-data)
  - Required: `metadata` JSON (pitch type, target audience, optional preferences)
  - Provide either `audio` blob or `transcript` text
  - Optional: `shouldRegenerate` (default true)
  - Returns: transcript, heuristic/AI analysis, scores, suggestions, regenerated pitch
- **POST `/api/pitch/regenerate`** (JSON)
  - Supply transcript + metadata to generate a fresh pitch iteration
- **GET `/api/health`** for health checks

- **Notes**
  - Without an OpenAI key the API falls back to heuristic transcription placeholder and rule-based feedback.
  - File uploads capped at 25 MB.

## Frontend Highlights

- **Recorder controls**: start/stop mic capture, display elapsed time, playback your clip.
- **Pitch setup wizard**: choose `startup`, `product`, or `elevator`, set duration/audience, tone, focus areas, CTA, and optional manual transcript.
- **Results dashboard**: shows scores, heuristics, strengths, improvements, sentiment, and auto-generated next steps.
- **Improved pitch**: copy or regenerate drafts in-line using backend API.

## Production Notes

- Deploy backend behind HTTPS (Heroku, Render, Fly.io, etc.); expose `/api` routes.
- Deploy frontend (Vercel/Netlify) with `NEXT_PUBLIC_API_BASE_URL` pointing at production API.
- Harden CORS origins, secrets storage, and add request auth if multi-tenant.
- Consider storing sessions (DB) and user auth for history tracking.

## Helpful Scripts

- `npm run lint` (both apps) – executes ESLint/Next linting
- `npm run build` – TypeScript compilation (backend) / Next.js production build (frontend)
- `npm start` – run compiled backend / Next.js server in production mode
