# VolleyPlanner PRO

Web app for planning integrated volleyball training sessions with
parallel stations, plyometric load tracking, and printable court sheets.

## Features

- **Planner** — Build sessions with calendar date picker, session start
  time (default 21:00), reorderable timeline grouped by category (with
  per-category minute totals), per-session duration/sets/reps/tabata
  work/rest (initialized from catalog defaults, then independent),
  notes, parallel station blocks, K1/K2 presets, **Salva** (overwrite
  loaded archive entry or match by title+date) and **Salva come…**
- **Exercise database** — CRUD catalog with category and (for *Tecnica
  Analitica*) exercise-type filters, role search, optional image per
  exercise (import or tactical editor), re-editable tactical diagrams,
  stable exercise IDs, and **default** duration/sets/reps/tabata timing
  used only when an exercise is first added to a session
- **Archive** — Save, load, duplicate, and delete training sessions in
  SQLite; sort newest/oldest; filter by date range; overwrite prompts
  when title+date already exist
- **Attendance** — Player roster as a sortable list with calendar date
  picker for medical visit expiry; per-session presence tracking linked
  to saved sessions; date-range filtering; printable/copyable medical
  visit report (expired / expiring within 30 days) formatted for WhatsApp
- **Print sheet** — Print-optimized field schedule (full page width,
  minimal margins, no app chrome); session start time in the header;
  each module shows a computed start time from session start plus
  cumulative durations; duration shown after category in the module
  title; exercise images aligned with the title; sets/reps hidden when
  zero; each exercise kept on one page when printing; descriptions
  preserve line breaks
- **Tactical image editor** — Built-in 3D court editor to place players
  (A/S/O/C/L), draw straight or curved trajectory arrows, zoom the view,
  export PNG, and **edit** a previously saved diagram (scene state is
  stored with the exercise)
- **Jump load** — Estimated jumps from sets × reps, with team average
  weighted by role assignment
- **Theme** — Dark and light mode

Saved sessions store exercise **references** plus **per-session load**
(duration, sets, reps, tabata work/rest). Editing an exercise in the
catalog updates shared content (title, description, image, etc.) in
open and archived sessions, but not load values already saved on each
session item. Tabata duration in a session is derived from work, rest,
series, and repetitions (exercises in the circuit) when tabata timing
applies.

## Requirements

- [Node.js](https://nodejs.org/) 18+ (20 recommended)
- npm
- Native build tools for `better-sqlite3` (usually preinstalled on Linux;
  on Windows use Visual Studio Build Tools)

## Quick start

```bash
cd VolleyPlannerPro
npm install
npm run dev
```

This starts:

- **API** — [http://localhost:3001](http://localhost:3001) by default
- **Web** — [http://localhost:8080](http://localhost:8080) by default
  (proxies `/api` to the backend)

If **3001** or **8080** are already in use, `npm run dev` picks the
next free ports automatically and wires the Vite proxy to the API
instance that started. Check the terminal for the actual URLs (e.g.
`http://localhost:8081/`).

Override defaults if needed:

```bash
PORT=3002 VITE_PORT=8090 npm run dev
```

Open the web app in your browser. On first run the API seeds the
exercise catalog, a sample session, and a sample player roster into
`data/volley.db`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API then web via `scripts/dev.ts`; auto-fallback ports |
| `npm run dev:web` | Frontend only (uses `API_PORT` / `PORT` for proxy target) |
| `npm run dev:server` | API only with hot reload; auto-fallback if port busy |
| `npm run build` | Type-check and build frontend → `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run start:server` | Run API without watch (production) |

For production, serve `dist/` with any static host and run the API
separately with `npm run start:server`. Point the frontend at the API
via the same `/api` path or adjust the proxy/host config.

## Data

Local files under `data/` (gitignored):

| Path | Purpose |
|------|---------|
| `data/volley.db` | SQLite database (see [Database schema](#database-schema)) |
| `data/uploads/exercises/` | Exercise images |
| `data/uploads/tmp/` | Temporary upload staging (multer) |

Exercise images can be **imported** (JPEG/PNG/WebP/GIF) or **created**
in the tactical editor. When created or edited in the editor, a JSON
snapshot of the scene (players, arrows, zoom) is stored in
`tactical_image_data` so the diagram can be reopened and modified later.
Importing an external file replaces the image and clears tactical data.

## Database schema

The app uses a single SQLite file (`data/volley.db`) managed by
`server/db.ts`. Schema is created on startup with `CREATE TABLE IF NOT
EXISTS`; column additions for older databases are applied inline via
`PRAGMA table_info` checks (no external migration tool). WAL mode and
foreign keys are enabled.

Column names in SQL use **snake_case**; the API and frontend use
**camelCase**. JSON is stored as `TEXT` where noted.

### `exercises`

Exercise catalog (CRUD from the **Esercizi** tab).

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `ex-cccc-nnn` (4 lettere categoria + 3 cifre), es. `ex-tecn-001` |
| `title` | TEXT | |
| `category` | TEXT | One of: Riscaldamento, Pliometria, Potenziamento, Tecnica Analitica, Lavoro Sintetico, Gioco Globale, Defaticamento |
| `exercise_type` | TEXT | Optional subtype for *Tecnica Analitica*: Fondamentale tecnico, Progressione didattica, A coppie, A gruppi, Coordinazione, Situazionale |
| `target_roles` | TEXT | JSON string array of role names |
| `duration_min` | INTEGER | Default duration in minutes |
| `intensity` | TEXT | Bassa, Media, Alta, Massimale |
| `description` | TEXT | Supports line breaks (`\n`) in the UI |
| `coaching_points` | TEXT | JSON string array |
| `estimated_jumps` | INTEGER | Derived: `sets × reps` |
| `sets` | INTEGER | Default sets / tabata rounds |
| `reps` | INTEGER | Default reps per set |
| `work_seconds` | INTEGER | Tabata work interval in seconds (default 0) |
| `rest_seconds` | INTEGER | Tabata rest interval in seconds (default 0) |
| `image_url` | TEXT | Optional URL path, e.g. `/api/exercises/:id/image` |
| `tactical_image_data` | TEXT | Optional JSON snapshot of the tactical editor scene (players, arrows, zoom) for re-editing |

### `saved_sessions`

Archived training plans from the **Planner** / **Archivio** tabs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Client-generated, e.g. `saved-173…` |
| `date` | TEXT | ISO date `YYYY-MM-DD` |
| `title` | TEXT | |
| `focus` | TEXT | Session focus / objectives |
| `start_time` | TEXT | Session start clock time (`HH:mm`, default `21:00`) |
| `target_minutes` | INTEGER | Planned session length |
| `total_minutes` | INTEGER | Sum of item durations (persisted, recomputed on read) |
| `total_jumps` | INTEGER | Estimated jump load (persisted, recomputed on read) |
| `items` | TEXT | JSON array of session item **references** (see below) |
| `created_at` | TEXT | SQLite `datetime('now')`, set on insert |

**`items` JSON format** — references into `exercises` plus per-item
load fields (not full exercise snapshots). Serialized by
`src/utils/sessionStorage.ts`:

```json
[
  {
    "type": "exercise",
    "exerciseId": "ex-1",
    "sessionDuration": 15,
    "notes": "",
    "sets": 4,
    "reps": 10,
    "workSeconds": 20,
    "restSeconds": 10
  },
  {
    "type": "parallel",
    "parallelTitle": "Stazioni parallele",
    "sessionDuration": 20,
    "notes": "",
    "stations": [
      {
        "role": "Schiacciatori",
        "exerciseId": "ex-2",
        "sets": 3,
        "reps": 8,
        "workSeconds": 20,
        "restSeconds": 10
      }
    ]
  }
]
```

Legacy rows that embedded full exercise objects are migrated to this
reference format on server startup (`migrateSavedSessionsToRefs`).

### `players`

Team roster for attendance (**Presenze → Rosa**).

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Client-generated, e.g. `player-173…` |
| `first_name` | TEXT | |
| `last_name` | TEXT | |
| `role` | TEXT | Schiacciatori, Centrali, Alzatori, Liberi, Opposti |
| `jersey_number` | INTEGER | Optional |
| `active` | INTEGER | `1` = active, `0` = inactive |
| `medical_visit_expiry` | TEXT | Optional medical visit expiry (`YYYY-MM-DD`) |
| `notes` | TEXT | Optional |
| `created_at` | TEXT | SQLite `datetime('now')`, set on insert |

### `training_attendance`

Presence records per saved session and player (**Presenze → Registro
Presenze**).

| Column | Type | Notes |
|--------|------|-------|
| `session_id` | TEXT | FK → `saved_sessions(id)` ON DELETE CASCADE |
| `player_id` | TEXT | FK → `players(id)` ON DELETE CASCADE |
| `present` | INTEGER | `1` = present, `0` = absent |
| `note` | TEXT | Optional per-player note |
| `recorded_at` | TEXT | Last update timestamp |

**Primary key:** `(session_id, player_id)`.

### Entity relationships

```
exercises ──(exerciseId)──► saved_sessions.items (JSON refs)

saved_sessions ◄── session_id ── training_attendance ── player_id ──► players
```

Deleting a saved session or player removes related attendance rows
(cascade).

## Project structure

```
scripts/
└── dev.ts            # Dev orchestrator: port selection, API then web

server/
├── index.ts          # Express API routes
├── db.ts             # SQLite schema and queries
├── port.ts           # Available-port detection and listen helpers
├── seed.ts           # Initial catalog, sample session, sample roster
└── images.ts         # Image upload and storage

src/
├── App.tsx           # App state and tab routing
├── api/              # REST client (exercises, sessions, players, attendance)
├── hooks/            # useExercises, useSavedSessions, usePlayers, useAttendance
├── types/            # TypeScript interfaces
├── tactical-court/   # 3D court editor (Three.js): scene, players, arrows, export
├── data/
│   ├── constants.ts  # Categories, exercise types, roles, team size
│   ├── exercises.ts  # Seed catalog (first run only)
│   ├── players.ts    # Seed roster (first run only)
│   └── presets.ts    # K1/K2 preset builders
├── utils/
│   ├── session.ts        # Timeline helpers, category grouping
│   ├── sessionStorage.ts # Session ↔ DB ref serialization
│   ├── savedSession.ts   # Save identity checks, session duplication
│   ├── exerciseId.ts     # ID format ex-cccc-nnn and next-id helpers
│   ├── jumps.ts          # Jump load calculations
│   ├── roles.ts          # Role-based player counts
│   └── tabata.ts         # Tabata labels and duration from work/rest/sets/reps
└── components/
    ├── DateRangePicker.tsx         # Calendar date / range picker
    ├── ExerciseFormModal.tsx       # Exercise CRUD form
    ├── PlayerFormModal.tsx         # Player CRUD form
    ├── MedicalVisitReportModal.tsx # Medical visit expiry report
    ├── ExerciseImageCreatorModal.tsx # Tactical court image editor
    ├── ExerciseImage.tsx
    ├── SessionTimelineItem.tsx
    ├── SessionCategoryGroupHeader.tsx
    └── tabs/         # Builder, Archive, Database, Attendance, Print
```

## Tactical image editor

Available from **Esercizi** → create or edit an exercise → **Crea
immagine** / **Modifica immagine**.

| Capability | Description |
|------------|-------------|
| Players | Add/remove roles A, S, O, C, L; drag on court |
| Arrows | Straight or curved trajectories; numbered labels at start; delete from list |
| Zoom | +/- controls on the canvas |
| Export | PNG attached to the exercise on confirm |
| Re-edit | Scene JSON saved in `tactical_image_data` after save (not available for imported images) |

Court modules live under `src/tactical-court/` (`scene.ts`, `players.ts`,
`arrows.ts`, `sceneState.ts`, `exportImage.ts`).

## API overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/exercises` | List exercises |
| POST | `/api/exercises` | Create exercise |
| PUT | `/api/exercises/:id` | Update exercise |
| DELETE | `/api/exercises/:id` | Delete exercise |
| POST/GET/DELETE | `/api/exercises/:id/image` | Upload, fetch, remove image |
| GET | `/api/sessions` | List saved sessions |
| POST | `/api/sessions` | Save session |
| PUT | `/api/sessions/:id` | Update session |
| DELETE | `/api/sessions/:id` | Delete session |
| GET/PUT | `/api/sessions/:id/attendance` | Read / save attendance for a session |
| GET | `/api/players` | List players |
| POST | `/api/players` | Create player |
| PUT | `/api/players/:id` | Update player |
| DELETE | `/api/players/:id` | Delete player |

## Debug in VS Code / Cursor

1. Run `npm run dev` in a terminal and note the **web** URL printed by
   Vite (may differ from 8080 if the port is busy).
2. Use **Run → Launch Chrome against localhost** (F5) — configured for
   `http://localhost:8080`; change `.vscode/launch.json` if another
   port is used.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Three.js (tactical court editor)
- Express + better-sqlite3
- [Lucide](https://lucide.dev/) icons

## License

VolleyPlanner PRO is licensed under the **GNU General Public License v3.0**
(or later). See [LICENSE](LICENSE) for the full text.
