# CourseLens AI — AI Assessment Quality Auditor

CourseLens AI is an academic decision-support tool that helps university faculty evaluate a question paper against its syllabus/CLOs. Faculty provide the syllabus, the current question paper, and (optionally) previous question papers; CourseLens runs an AI audit and returns a structured report covering CLO/topic coverage, Bloom's-Taxonomy and difficulty balance, duplicate-question detection, specific evidence-backed issues, and prioritized recommendations — while keeping the faculty member in control of the final decision.

Built for the AUST CSE Carnival <8.0/> AI Build Hackathon.

## Project Structure

```
courselens-ai/
├── frontend/   # React + Vite UI
├── backend/    # Node.js + Express + SQLite API & AI Agent
└── docs/       # API contract and documentation
```

## Features

- **Email/password authentication** with JWT sessions.
- **Guided analysis workflow**: a 3-step wizard (course details → materials → review) for submitting a syllabus, question paper, and optional previous papers as pasted text, `.txt` upload, or **PDF upload** (server-side text extraction).
- **AI-powered audit**: a single structured LLM call (via OpenRouter or Groq) that returns CLO/topic coverage, Bloom's-Taxonomy distribution, difficulty distribution, duplicate/similar-question detection, evidence-cited issues, an overall quality score, and recommendations.
- **Asynchronous processing**: analysis requests return immediately (`202 processing`) while the AI runs in the background; the frontend polls for completion and supports retrying a failed or stuck analysis.
- **Dashboard & history**: summary metrics, recent analyses, searchable/filterable history, and a detailed report view with a printable export.
- **Faculty-in-control UX**: every report is framed as decision support, not a replacement for faculty judgment.
- **Demo mode**: the frontend can run entirely on mock data (`VITE_USE_DEMO_DATA=true`) for offline UI preview without a backend.

## Tech Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19, Vite, React Router |
| Backend   | Node.js, Express, SQLite (`sqlite3`) |
| Auth      | JWT (`jsonwebtoken`), `bcryptjs` |
| AI        | OpenRouter or Groq chat-completion APIs (JSON-mode), via `axios` with retry/backoff |
| Documents | `multer` (uploads), `pdf-parse` (PDF text extraction) |

## Prerequisites

- Node.js 18+ and npm
- An API key from [OpenRouter](https://openrouter.ai/) or [Groq](https://groq.com/) for the AI provider

## Local Setup

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd courselens-ai
```

### 2. Backend setup

```bash
cd backend
npm install
copy .env.example .env      # Windows (PowerShell/CMD)
# cp .env.example .env      # macOS/Linux
```

Open `backend/.env` and fill in the required values (see [Environment Variables](#environment-variables) below), then start the server:

```bash
npm run dev      # nodemon, auto-restarts on changes
# or
npm start        # plain node
```

The API will run at `http://localhost:3000` and SQLite will auto-create its database file and tables on first run — no manual migration step is needed.

### 3. Frontend setup

Open a new terminal:

```bash
cd frontend
npm install
copy .env.example .env      # Windows
# cp .env.example .env      # macOS/Linux
npm run dev
```

The app will run at `http://localhost:5173` (Vite's default) and expects the backend at the URL configured in `VITE_API_BASE_URL`.

### 4. Open the app

Visit `http://localhost:5173`, create an account, and start a new analysis.

## Environment Variables

### `backend/.env`

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the Express server listens on | `3000` |
| `DATABASE_PATH` | Path to the SQLite database file (auto-created) | `./data/courselens.db` |
| `FRONTEND_ORIGIN` | Allowed CORS origin for the frontend | `http://localhost:5173` |
| `AI_PROVIDER` | AI backend to use: `groq` or `openrouter` | `groq` |
| `AI_API_KEY` | API key for the selected AI provider | `your_actual_api_key_here` |
| `AI_MODEL` | Model identifier for the selected provider | `openai/gpt-oss-20b` |
| `JWT_SECRET` | Secret used to sign JWTs — **set a strong, unique value** | `a-long-random-string` |

### `frontend/.env`

| Variable | Description | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Base URL of the backend API | `http://localhost:3000/api` |
| `VITE_USE_DEMO_DATA` | When `true`, the UI runs entirely on mock data with no backend calls | `false` |

> Keep `VITE_USE_DEMO_DATA=false` for real backend integration and for final verification/demo runs.

## API Overview

Full request/response details are in [`docs/api-contract.md`](./docs/api-contract.md). Summary:

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Create a faculty account |
| `POST` | `/api/auth/login` | No | Sign in and receive a JWT |
| `GET`  | `/api/auth/me` | Yes | Get the current user's profile |
| `PUT`  | `/api/auth/me` | Yes | Update the current user's display name |
| `POST` | `/api/analyses` | Yes | Submit a new assessment for AI analysis |
| `GET`  | `/api/analyses` | Yes | List the current user's analyses |
| `GET`  | `/api/analyses/:id` | Yes | Get one analysis and its AI result |
| `DELETE` | `/api/analyses/:id` | Yes | Delete an analysis |
| `POST` | `/api/analyses/:id/retry` | Yes | Re-run a failed or processing analysis |
| `POST` | `/api/documents/extract` | Yes | Extract text from an uploaded PDF/TXT file (`multipart/form-data`, field `file`, max 5MB) |
| `GET`  | `/api/health` | No | Health check |

All protected routes require `Authorization: Bearer <token>`.

## Document Upload Support

The frontend materials step accepts either pasted text or a file upload. Uploaded files are sent to `/api/documents/extract`, which:

- Extracts text directly from `.pdf` files using `pdf-parse`.
- Reads `.txt` files as plain UTF-8 text.
- Rejects files under 10 characters of extracted text (e.g., scanned/image-only PDFs) with a clear error, since OCR is not currently supported.
- Enforces a 5MB upload limit.

## Available Scripts

**Backend** (`backend/`)
```bash
npm run dev     # start with nodemon (auto-reload)
npm start       # start with node
```

**Frontend** (`frontend/`)
```bash
npm run dev       # start Vite dev server
npm run build     # production build
npm run preview   # preview the production build locally
npm run lint      # run ESLint
```

## Notes & Known Limitations

- OCR for scanned/image-based PDFs is not supported; only text-based PDFs and plain text are accepted.
- The AI agent makes a single structured completion call per analysis rather than a multi-step tool-using loop.
- Analyses are private per authenticated user; there is no sharing or department-level view.
- AI findings are advisory — faculty are expected to verify evidence before making final academic decisions.

## License

This project was built for the AUST CSE Carnival <8.0/> AI Build Hackathon.