# ULPIN 3D: Vertical Property Mapping Prototype

**A working prototype that turns 2D land parcel records into interactive 3D buildings. It runs a Citizen → Surveyor → Government verification workflow on a real backend, and adds AI document extraction that a surveyor has to check.**

> **Prototype disclaimer.** Building geometry, parcel boundaries, ULPINs (`DEMO-ULPIN-…`) and the "Property Analysis (Illustrative)" card are **demo data**. They are not official cadastral records. Any real use requires authorised surveyor and government verification. It is not connected to any government ULPIN database.

ULPIN (Unique Land Parcel Identification Number) is India's 14-character land parcel ID. This prototype explores what a **3D / vertical** extension could look like: one parcel with several floors and units, each of which can be viewed, verified and complained about separately.

---

## What is real vs. simulated

| Area | Status | How it works |
|---|---|---|
| **Backend API** | ✅ Real | Node.js + Fastify. Every workflow rule runs on the server |
| **Database** | ✅ Real | PostgreSQL 16 + PostGIS 3.4 (Docker). Constraints, sequences, row locks, transactions |
| **Authentication** | ✅ Real | Email + password (scrypt). Sessions in httpOnly `SameSite=Strict` cookies, stored hashed in the DB |
| **Roles (RBAC)** | ✅ Real, server-enforced | `citizen` / `surveyor` / `government` come from the session, never from the browser. Staff accounts can't self-register |
| **Audit log** | ✅ Real, append-only | A database trigger blocks `UPDATE`, `DELETE` and `TRUNCATE` on `audit_log`. The actor comes from the session |
| **File uploads** | ✅ Real | Server checks type, 10 MB limit and file signature (magic bytes), then stores the file with SHA-256. Only the owner and reviewers can download it |
| **GIS check** | ✅ Real | On submit, PostGIS checks whether the coordinates fall inside the parcel (`ST_Contains`) and computes the geodesic area |
| **AI document extraction** | ✅ Real (needs an API key) | The server sends a stored document to **Claude** or **Groq** and gets structured fields with confidence and source quotes. A surveyor must record a review. See [AI pipeline](#ai-pipeline) |
| 3D building viewer | ✅ Real | Three.js scene from floor/room data: orbit, floor isolation, room picking, measurement |
| Property geometry and ULPINs | ❌ Demo | Schematic room boxes, 3 demo parcels, `DEMO-ULPIN-000001`-style IDs. Never official |
| "Property Analysis (Illustrative)" card | ❌ Illustrative | Hard-coded text per demo property. The card says so |

---

## Architecture

```text
 Browser (React + Vite)                    Server (Node 22, Fastify)                    Data
 ─────────────────────                     ─────────────────────────                    ────
 Pages, 3D viewer, map   ── /api/* ──►  Origin check (CSRF) ─► session cookie ─►        PostgreSQL + PostGIS
 no tokens in JS           (httpOnly     rate limits (login 10/min, upload 30/min,       users, sessions (hashed)
                            cookie)       AI 10/min)                                     applications, complaints
                                         zod validation on every body                    verifications, history
                                         services/*: workflow rules + RBAC               audit_log (append-only)
                                           one transaction per action, row locks         properties (geometry)
                                         files: signature check, SHA-256 ──────────►    server/storage/<uuid>
                                         AI: stored file ─► Claude ─► zod ─► run row
```

**Separation of concerns (on purpose):**

| Layer | Example | Can change official status? |
|---|---|---|
| **AI inference** | "Parcel no. on deed: 123/4B, confidence 0.55" | ❌ Never. Stored as a candidate run |
| **Deterministic GIS** | "Point is inside parcel; area 902 m² (geodesic)" | ❌ Evidence only |
| **Human decision** | Surveyor checklist → Government approval | ✅ Only these |

### Security model (summary)

- **Identity** comes only from the session cookie (httpOnly, `SameSite=Strict`, `Secure` unless `COOKIE_SECURE=false`). Only a SHA-256 of the session token is stored.
- **Authorization** is checked in `server/services/*` for every action. The React app only hides buttons.
- **Row-level reads:**
  - Citizens see only their own applications, complaints, notifications and files.
  - Surveyors see applications and the files attached to them.
  - Government also sees complaints and their evidence.
  - Guests see public property facts only: no reviewer names, remarks, or complaint text.
- **Integrity:**
  - One open application per property. A property that already has a ULPIN can't be re-applied for.
  - Row locks and transactions on every state change.
  - Database sequences for all numbers.
  - An append-only audit log.
- **Input:** zod validation on every request body. SQL is always parameterized, with allow-listed column names. Uploads are checked by type, signature and size, with a per-user quota, and served with `nosniff` and a sandboxing CSP.
- **Abuse:**
  - Rate limits: login 10/min, submissions 10/min, uploads 30/min, AI 10/min, everything else 300/min.
  - The same error is returned for an unknown email and a wrong password.
  - Browser writes from other origins are rejected.

---

## Run locally

Requires **Node 22.9+** and **Docker**.

```bash
git clone https://github.com/ayeshairsha1977/ULPIN-3d-land-visualization-updated-one.git
cd ULPIN-3d-land-visualization-updated-one
npm install

cp .env.example .env          # set SEED_DEMO_PASSWORD, and ANTHROPIC_API_KEY or GROQ_API_KEY for AI
npm run setup                 # starts PostGIS, creates tables, seeds demo parcels + accounts

npm run server                # API on http://127.0.0.1:8787
npm run dev                   # web app on http://localhost:5173 (second terminal)
```

Sign in with a demo account (the password is your `SEED_DEMO_PASSWORD`):

| Account | Can do |
|---|---|
| `citizen@demo.local` | Submit ULPIN requests, raise complaints, see only their own records |
| `surveyor@demo.local` | Review applications, run and review AI extraction, complete the checklist |
| `government@demo.local` | Approve/reject after surveyor review, decide complaints, verify properties, set building photos |

New users can register at `/register`. They always get the **citizen** role.

**Try the full flow:**
1. As the citizen, request a ULPIN for *Sree Lalitha Girls Hostel 2* and upload a PDF.
2. As the surveyor, open the application. Check the **Automated GIS Check** panel, click **Extract with AI**, record a review and complete the checklist.
3. As government, approve it. The property becomes *Verified* with `DEMO-ULPIN-000001`.

| Script | What it does |
|---|---|
| `npm run setup` | `docker compose up`, migrate, seed |
| `npm run server` | API server (reads `.env`, applies pending migrations on start) |
| `npm run dev` | Vite dev server (proxies `/api` to the API) |
| `npm test` | Unit tests: upload checks, AI comparison, AI server (no database needed) |
| `npm run test:db` | Integration tests against Postgres: auth, RBAC, workflow, files, GIS, audit log |
| `npm run lint` / `npm run build` | ESLint over `src/` and `server/` / production build |
| `npm run db:migrate` / `npm run db:seed` | Apply migrations / seed demo parcels and accounts |

---

## API

All responses use `{ success, data, error }`. Every write needs a signed-in session. Every rule is checked on the server.

| Method & path | Who | Purpose |
|---|---|---|
| `POST /api/auth/register` · `login` · `logout`, `GET /api/auth/me` | anyone | Citizen sign-up and sessions |
| `GET /api/records/:type?property_id=…` | depends | Read records. Citizens see only their own applications, complaints and notifications |
| `POST /api/files`, `GET /api/files/:id` | signed in | Upload (raw body, `X-File-Name` header) / download if permitted |
| `POST /api/applications` | citizen | Submit (runs the PostGIS check) |
| `POST /api/applications/:id/review` | surveyor / government | Status change, checked against the state machine |
| `POST /api/applications/:id/ai-extract` · `ai-review` | surveyor / government | Run Claude on a stored document / sign off a run |
| `POST /api/complaints`, `…/:id/assign` · `status` · `priority` · `decision` | citizen / government | Complaint lifecycle |
| `POST /api/properties/:id/verify` · `remove-verification`, `PUT/DELETE …/photo`, `GET …/geo` | government / anyone for `geo` | Verification, photos, PostGIS facts |

---

## AI pipeline

```text
Document stored on the server (PDF / JPG / PNG, ≤10 MB, signature-checked)
        │  surveyor clicks "Extract with AI"   (POST /api/applications/:id/ai-extract)
        ▼
Provider (chosen from server config):
   Claude  claude-opus-5-5 reads PDFs and images directly
   Groq    PDF → text layer (unpdf) → GROQ_MODEL (e.g. openai/gpt-oss-120b)
           image → GROQ_VISION_MODEL (e.g. qwen/qwen3.8-27b)
           scanned PDFs with no text layer → clear error: upload as an image
Structured JSON output (strict schema)
   fields: document_type, owner_name, parcel_number, plot_area, land_use,
           floors, address, district, issuing_authority, document_date
   each:   value · confidence 0–1 · verbatim source quote   + warnings + summary
        │  zod validates the shape → saved as an ai_extraction_run
        ▼
Surveyor screen: AI value vs. applicant-declared value
   (differences and confidence < 0.6 highlighted)
        │  surveyor writes what they checked   (POST …/ai-review with the run id)
        ▼
"AI Extraction Reviewed" in history + audit log. No status changes.
```

- A review can only reference a run the server actually produced, so a client can't forge "AI results".
- The document is treated as untrusted input. The prompt says to transcribe, not obey, and the output is limited to a fixed schema.
- API keys stay on the server. Refusals, cut-off answers and missing configuration return clear errors.
- Models make mistakes, including confident ones and invented warnings. That is why a result is only a candidate until a surveyor records what they checked.

---

## Project structure

```text
server/
├── index.js / app.js        # startup; Fastify app, CSRF origin check, sessions, errors
├── routes/                  # auth, records + files, applications, complaints, properties
├── services/                # workflow rules (applications, complaints, properties), files, validation
├── repos/                   # SQL: store.js (writes, locks, audit), records.js (reads + row-level access)
├── auth/                    # scrypt passwords, hashed session tokens
├── db/                      # pool, migrations/*.sql, migrate + seed scripts
├── extract.js, schema.js    # Claude call, shared prompt + output schema
├── ai/                      # Groq provider (PDF text + vision) and provider selection
└── test/*.db.test.js        # integration tests (need Postgres)
src/
├── api/apiClient.js         # fetch wrapper (cookie session)
├── lib/SessionContext.jsx   # current user, sign in/out
├── services/workflow.js     # thin API calls (no rules here)
├── components/twin/         # Three.js viewer
├── components/admin/        # review actions, GIS check, AI extraction panel
└── pages/                   # public pages, citizen pages, admin/*
```

---

## Known limits

| Gap | Next step |
|---|---|
| No email: password reset is manual | Email-based reset, or government SSO (OIDC) instead of passwords |
| Files on local disk, no malware scan | Object storage (S3/MinIO), ClamAV scanning with quarantine, signed URLs |
| Rate limits are per IP, in memory (300/min global, stricter on login, uploads, submissions, AI) | Per-user limits in Redis when running more than one server; set `TRUST_PROXY` behind a proxy |
| Staff can open files attached to applications they may review | Assign reviewers per application and scope file access to the assignment |
| The app connects to Postgres as the table owner (can disable the audit trigger) | Separate migration role and a non-owner runtime role in production |
| 3 demo parcels with schematic geometry | Import real parcel data with CRS/EPSG handling |
| JavaScript, not TypeScript (`npm run typecheck` fails) | TypeScript migration with strict mode |
| No CI yet | GitHub Actions: lint, `npm test`, `npm run test:db` with a PostGIS service, `npm audit` |

---

## Team

| # | Name | Role | Contribution | GitHub |
|---|---|---|---|---|
| 1 | _add_ | | | |

Smart India Hackathon (SIH) project.
