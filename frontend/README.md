# CourseLens AI Frontend

React + Vite frontend for the CourseLens AI assessment quality auditor.

## Local setup

```bash
npm install
copy .env.example .env
npm run dev
```

The default backend URL is `http://localhost:3000/api`.

Set `VITE_USE_DEMO_DATA=true` only for an explicitly labelled frontend preview. Keep it `false` for backend integration and final verification.

## Checks

```bash
npm run lint
npm run build
```

All backend endpoint paths and response normalization are centralized in `src/services/api.js`.

The current Express backend accepts JSON text input. The frontend therefore supports pasted text and local `.txt` file reading; PDF/DOCX parsing must be added to the backend before those formats are enabled.
