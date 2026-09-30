# ULPIN 3D: Vertical Property Mapping Prototype

**A working prototype that turns 2D land parcel records into interactive 3D buildings, adds AI document extraction that a surveyor has to check, and simulates the government verification workflow.**

> **Prototype disclaimer.** This project is for visualization and workflow demonstration only. Building geometry, coordinates, ULPINs (`DEMO-ULPIN-…`), roles and the "AI-Assisted Property Analysis" card are **demo data**. They are not official cadastral records. Any real use requires authorised surveyor and government verification. It is not connected to any government ULPIN database.

ULPIN (Unique Land Parcel Identification Number) is India's 14-character land parcel ID. This prototype explores what a **3D / vertical** extension could look like: one parcel with several floors and units, each of which can be viewed, verified and complained about separately.

---

## What is real vs. simulated

Stating this plainly so nobody has to dig through the code to find out.

| Area | Status | How it works today |
|---|---|---|
| 3D building viewer | ✅ Real | Three.js scene built from floor and room data, with orbit controls, floor isolation, room picking, measurement, labels and full GPU cleanup on unmount |
| Map | ✅ Real | Leaflet map with parcel polygons and search |
| **AI document extraction** | ✅ **Real (needs API key)** | A small Node server sends an uploaded PDF or image to Claude, which returns structured fields with confidence scores and source quotes. A surveyor compares them with the application and records a review. See [AI pipeline](#ai-pipeline) |
| Workflow rules | ✅ Real logic, ⚠️ runs in the browser | Citizen → Surveyor → Government state machine with checklist gates and a complaint → review → revoke flow. Covered by unit tests |
| Upload checks | ⚠️ Client-side | Type, extension, magic-byte, 10 MB and 5-file limits. The AI server repeats the type, size and magic-byte checks |
| Authentication / roles | ❌ Simulated | A "Demo Mode" switch picks Citizen, Surveyor or Government. Anyone can switch, so it is **not access control** |
| Database | ❌ Simulated | Browser `localStorage` for records and IndexedDB for uploaded files. Data stays in one browser |
| "AI-Assisted Property Analysis" card | ❌ Illustrative | Hard-coded text per demo property. The card itself says so |
| Property geometry and ULPINs | ❌ Demo | Schematic room boxes and `DEMO-ULPIN-000001`-style IDs. Never official |

---

## Features

- **Map to 3D twin.** Pick a building on the map and open its digital twin. Switch floors, click rooms, and measure.
- **ULPIN request wizard.** Location, parcel, applicant and document upload, then submit.
- **Surveyor review.** Checklist (parcel, coordinates, building, documents, 3D). **AI document extraction** compares the uploaded deed with what the applicant declared.
- **Government decision.** Only possible after the surveyor finishes the review. Approval assigns a clearly-labelled demo ULPIN.
- **Complaints.** A complaint never revokes verification by itself. Government must open a review, record a reason and decide (confirmed → verification revoked; rejected → unchanged).
- **Audit trail.** Every step records who did it, their role, the time and the reason. It is stored in the browser, so it is not tamper-proof (see limits below).

---

## AI pipeline

```text
Uploaded deed / patta / permit (PDF, JPG, PNG, ≤10 MB)
        │  browser reads it from IndexedDB
        ▼
POST /api/extract  (server/: type, size, magic-byte checks, 10 req/min/IP)
        │
        ▼
Claude (claude-opus-5-5): structured JSON output
   fields: document_type, owner_name, parcel_number, plot_area, land_use,
           floors, address, district, issuing_authority, document_date
   each:   value · confidence 0–1 · verbatim source quote
   + warnings (illegible, conflicting, missing stamps) + summary
        │  server validates the shape with zod
        ▼
Surveyor screen: AI value vs. applicant-declared value
   highlighted when they differ or confidence < 0.6
        │
        ▼
Surveyor writes what they checked → "AI Extraction Reviewed" in history
```

Design rules:

- **The AI never decides anything.** Its output is stored as a *candidate* next to the reviewer's note. It never changes an application, ULPIN or verification status. Only the surveyor checklist and the government decision do that.
- **The document is untrusted input.** The system prompt tells the model to transcribe text, not follow it. The output is limited to a fixed JSON schema, and React renders it as plain text.
- **The API key stays on the server.** The browser talks to `/api/extract` through the Vite proxy. `ANTHROPIC_API_KEY` is never bundled.
- **Refusals and cut-off responses** come back as clear errors, not partial data. Server-side model fallback (`fallbacks: "default"`) is enabled for safety-classifier declines.

---

## Run locally

Requires Node 22.9+ (the `server` script uses `--env-file-if-exists`). Tested on Node 22.22.

```bash
git clone https://github.com/ayeshairsha1977/ULPIN-3d-land-visualization-updated-one.git
cd ULPIN-3d-land-visualization-updated-one
npm install
npm run dev            # web app at http://localhost:5173
```

The whole app works without the AI server. To turn on AI extraction, open a second terminal:

```bash
cp .env.example .env   # then set ANTHROPIC_API_KEY=...
npm run server         # AI API at http://127.0.0.1:8787 (proxied as /api)
```

Try it: switch to **Citizen Demo**, submit a ULPIN request with a real-looking PDF or photo, switch to **Surveyor Demo**, open the application and click **Extract with AI**.

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server |
| `npm run server` | AI extraction API (reads `.env`) |
| `npm test` | Unit + API tests (Vitest) |
| `npm run coverage` | Tests with coverage for `src/services`, `src/lib`, `server` |
| `npm run lint` | ESLint over `src/` and `server/` |
| `npm run build` | Production build |

---

## Project structure

```text
src/
├── api/localClient.js     # localStorage/IndexedDB stand-in for a backend
├── api/aiClient.js        # calls /api/extract
├── services/workflow.js   # application, complaint, verification rules (+ tests)
├── lib/files.js           # upload validation (+ tests)
├── lib/aiCompare.js       # AI value vs. declared value (+ tests)
├── components/twin/       # Three.js viewer, scene, floor/room panels
├── components/admin/      # checklist, review actions, AI extraction panel
├── pages/                 # Home, Map, DigitalTwin, Applications, Complaints, admin/*
└── data/properties.js     # demo properties (schematic, not surveyed)
server/
├── index.js               # HTTP server, rate limit, body limit (+ tests)
├── extract.js             # Claude call, validation, error mapping (+ tests)
└── schema.js              # JSON schema for model output + zod validators
```

---

## Known limits (read before production)

This is a prototype. A production system needs at least:

| Gap | What it needs |
|---|---|
| Auth is a demo switch | OIDC / government SSO, server-issued sessions, RBAC enforced on the server |
| Workflow runs in the browser | Move `services/workflow.js` behind an API; the server derives reviewer identity and time |
| localStorage / IndexedDB | PostgreSQL + PostGIS; object storage for files; database-generated IDs (the demo `ULP-2026-0001` counters can collide across tabs) |
| Audit log editable in browser | Append-only server-side audit table. Today two tabs saving a review at the same moment can overwrite each other |
| Uploads | Server-side validation on every upload path, malware scanning, quarantine, signed short-lived URLs |
| AI server has no auth | Put `/api/extract` behind the same auth; per-user quotas instead of the per-IP limit; global concurrency cap |
| GIS | Areas here are rough lat/lng offsets. Real work needs CRS/EPSG handling and geodesic area |
| Typing | `npm run typecheck` currently reports many errors from the JS codebase. A TypeScript migration is planned |

## Roadmap

1. Backend (FastAPI or Node) with PostgreSQL/PostGIS, JWT/OIDC, server-side RBAC and audit log
2. Move workflow rules and their tests to the server unchanged
3. AI: footprint and height candidates from satellite or drone imagery, always gated by surveyor review
4. CI: lint, tests, `npm audit`, CodeQL

---

## Team

| # | Name | Role | Contribution | GitHub |
|---|---|---|---|---|
| 1 | _add_ | | | |

Smart India Hackathon (SIH) project.
