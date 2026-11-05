# Resumora — AI Resume Analyzer

Resumora helps job seekers evaluate and improve resumes with ATS-style scoring, actionable analysis, and AI-assisted bullet rewrites. The application stores each user's resumes, versions, and analysis history in MongoDB.

## Features

- Upload and parse PDF and DOCX resumes.
- Create, edit, and generate resume versions.
- Analyze ATS compatibility, skills, keywords, formatting, experience, grammar, and resume sections with Google Gemini.
- Review suggestions and rewritten bullets without automatically changing resume content.
- Compare versions, view history and insights, and export a resume as PDF.
- Authenticate with email/password or Google sign-in.
- Keep resume and analysis records scoped to the signed-in user.

## Technology stack

- **Frontend:** React, Vite, Tailwind CSS, React Router, TanStack Query
- **Backend:** Node.js 20+, Express
- **Database:** MongoDB with Mongoose
- **AI:** Google Gemini through the `@google/genai` SDK
- **Authentication:** JWT cookies and Firebase Authentication/Admin
- **Resume parsing:** `pdf-parse` and Mammoth

## Project structure

```text
.
├── backend/
│   ├── src/
│   │   ├── config/       # Environment, database, and Firebase setup
│   │   ├── controllers/  # HTTP request handlers
│   │   ├── middleware/   # Authentication, validation, uploads, errors
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # Express API routes
│   │   ├── services/     # Gemini, parsing, and analysis logic
│   │   └── server.js
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── public/           # Static assets and brand logo
│   ├── src/
│   │   ├── api/          # Backend API clients
│   │   ├── components/   # UI, layout, resume, and landing components
│   │   ├── context/      # Authentication, theme, and UI state
│   │   ├── hooks/        # React Query hooks
│   │   ├── pages/        # Application and landing pages
│   │   └── routes.jsx
│   ├── .env.example
│   └── package.json
├── .gitignore
└── README.md
```

The frontend and backend are separate npm projects and have separate lockfiles. Install and run commands from their respective directories.

## Prerequisites

- Node.js 20 or newer and npm
- MongoDB Atlas or a local MongoDB instance
- A Google Gemini API key
- A Firebase project configured for the web app and Google sign-in
- A Firebase Admin service-account JSON file for backend Google-token verification

## Installation

From the project root:

```powershell
cd frontend
npm ci
Copy-Item .env.example .env

cd ..\backend
npm ci
Copy-Item .env.example .env
```

If PowerShell reports that an `.env` file already exists, preserve it and edit it locally rather than overwriting it.

## Environment setup

### Backend: `backend/.env`

Set the following values:

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Use `development` locally and `production` when deployed. |
| `PORT` | Express server port; defaults to `5000`. |
| `MONGO_URI` | MongoDB connection URI. |
| `JWT_SECRET` | Long, random secret used to sign session tokens. |
| `JWT_EXPIRES_IN` | JWT lifetime; defaults to `7d`. |
| `COOKIE_NAME` | Session cookie name; defaults to `arr_token`. |
| `CLIENT_ORIGIN` | Comma-separated frontend origin(s) allowed by the server. |
| `GEMINI_API_KEY` | Server-side Google Gemini API key. |
| `GEMINI_MODEL` | Gemini model name; defaults to `gemini-3.6-flash`. |

The Firebase Admin configuration currently loads `backend/firebase-service-account.json`. Place your own service-account file there for local development. **Never commit this file or copy its contents into source code.**

### Frontend: `frontend/.env`

Configure the `VITE_FIREBASE_*` values for your Firebase web app. Vite exposes `VITE_` variables to the browser bundle; do not put Gemini, MongoDB, JWT, or service-account credentials in frontend variables.

The example files contain placeholder values only. Replace them in your local ignored `.env` files.

## Run locally

Open two terminals from the project root.

Backend:

```powershell
cd backend
npm run dev
```

Frontend:

```powershell
cd frontend
npm run dev
```

Vite runs on `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:5000`. The backend exposes `GET /api/health` for a health check.

## Production build and checks

Frontend:

```powershell
cd frontend
npm run lint
npm run build
```

Backend syntax check (PowerShell):

```powershell
cd backend
Get-ChildItem .\src -Filter *.js -Recurse | ForEach-Object { node --check $_.FullName }
```

## Security notes

- Keep `.env` files and `firebase-service-account.json` private. They are excluded by the root `.gitignore`.
- Rotate credentials if they were ever committed, shared, or otherwise exposed.
- Restrict the Firebase web API key by allowed APIs and domains; it is client configuration, not a server-side secret.
- Resume text and analysis data are personal information. Avoid logging their contents or sharing production data.
- ATS scores are estimates and are not guaranteed outcomes from any specific applicant tracking system.
