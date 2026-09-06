# CourseLens AI

CourseLens AI is an academic decision-support tool that helps university faculty audit assessment quality. A faculty member provides course details, syllabus/CLOs, a current question paper, and optional previous papers. The AI returns evidence-based coverage, Bloom's Taxonomy and difficulty distributions, similarity findings, detected issues, and recommendations. Faculty members remain responsible for final academic decisions.

## Core workflow

1. Register or sign in as a faculty member.
2. Enter course and assessment details.
3. Paste text or extract text from a PDF, DOCX, or TXT document.
4. Submit the assessment for asynchronous AI analysis.
5. Review the structured report and saved analysis history.

## Technology

- Frontend: React 19, Vite, React Router
- Backend: Node.js, Express
- Database: SQLite
- AI providers: Groq or OpenRouter
- Document extraction: Multer and pdf-parse

## Repository structure

```text
frontend/   React application
backend/    Express API, SQLite database, and assessment agent
docs/       API contract
```

## Prerequisites

- A current Node.js LTS release
- npm
- A Groq or OpenRouter API key

## Backend setup

1. Open a terminal in `backend/`.
2. Copy `.env.example` to `.env`.
3. Set a real `AI_API_KEY`.
4. Keep `AI_PROVIDER` and `AI_MODEL` consistent with the selected provider.
5. Replace `JWT_SECRET` with a private random value containing at least 32 characters.
6. Install and start the API:

```bash
npm ci
npm run dev
```

The API runs at `http://localhost:3000`. Open `http://localhost:3000/api/health` to verify it. SQLite creates `backend/data/courselens.db` automatically.

Default Groq configuration:

```env
AI_PROVIDER=groq
AI_MODEL=openai/gpt-oss-20b
```

Never commit `.env`, API keys, JWT secrets, SQLite files, `node_modules/`, or build output.

## Frontend setup

1. Open a second terminal in `frontend/`.
2. Copy `.env.example` to `.env`.
3. For real API testing, confirm:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_USE_DEMO_DATA=false
```

4. Install and start the frontend:

```bash
npm ci
npm run dev
```

Open `http://localhost:5173`.

## Verification

Backend automated API tests:

```bash
cd backend
npm test
```

Frontend checks:

```bash
cd frontend
npm run lint
npm run build
```

## Supported documents

- Text-based PDF, DOCX, and UTF-8 TXT
- Maximum upload size: 5 MB
- Maximum extracted text: 250,000 characters
- Scanned/image-only PDF OCR is not supported

## API documentation

See [`docs/api-contract.md`](docs/api-contract.md) for endpoints, request and response shapes, upload limits, authentication, and asynchronous retry behavior.

## Demo resilience

Set `VITE_USE_DEMO_DATA=true` only for an explicitly labeled offline UI demonstration. Keep it `false` for the real end-to-end workflow.
