# VolleyPlanner PRO

Web app for planning integrated volleyball training sessions with
parallel stations, plyometric load tracking, and printable court sheets.

## Features

- **Planner** — Build sessions with calendar date picker, reorderable
  timeline grouped by category (with per-category minute totals),
  duration and notes per exercise, sets/reps, tabata work/rest times,
  parallel station blocks, and K1/K2 presets
- **Exercise database** — CRUD catalog with category and (for *Tecnica
  Analitica*) exercise-type filters, role search, optional image per
  exercise, stable exercise IDs, and editable defaults for sets/reps and
  tabata timing
- **Archive** — Save, load, and delete training sessions in SQLite;
  sort newest/oldest; filter by date range; duplicate title/date
  prompts before overwrite
- **Attendance** — Player roster with medical visit expiry date,
  per-session presence tracking linked to saved sessions, and date-range
  filtering
- **Print sheet** — Printable field schedule with exercise images when
  available; descriptions preserve line breaks
- **Jump load** — Estimated jumps from sets × reps, with team average
  weighted by role assignment
- **Theme** — Dark and light mode

Saved sessions store exercise references, not full snapshots: updating
an exercise in the catalog updates it everywhere it is used.

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

- **API** — [http://localhost:3001](http://localhost:3001)
- **Web** — [http://localhost:8080](http://localhost:8080) (proxies
  `/api` to the backend)

Open the web app in your browser. On first run the API seeds the
exercise catalog, a sample session, and a sample player roster into
`data/volley.db`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start API (:3001) and Vite dev server (:8080) |
| `npm run dev:web` | Frontend only |
| `npm run dev:server` | API only with hot reload |
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

### `saved_sessions`

Archived training plans from the **Planner** / **Archivio** tabs.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Client-generated, e.g. `saved-173…` |
| `date` | TEXT | ISO date `YYYY-MM-DD` |
| `title` | TEXT | |
| `focus` | TEXT | Session focus / objectives |
| `target_minutes` | INTEGER | Planned session length |
| `total_minutes` | INTEGER | Sum of item durations (persisted, recomputed on read) |
| `total_jumps` | INTEGER | Estimated jump load (persisted, recomputed on read) |
| `items` | TEXT | JSON array of session item **references** (see below) |
| `created_at` | TEXT | SQLite `datetime('now')`, set on insert |

**`items` JSON format** — references into `exercises`, not full
snapshots. Updating an exercise in the catalog updates it everywhere it
is used. Serialized by `src/utils/sessionStorage.ts`:

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
server/
├── index.ts          # Express API routes
├── db.ts             # SQLite schema and queries
├── seed.ts           # Initial catalog, sample session, sample roster
└── images.ts         # Image upload and storage

src/
├── App.tsx           # App state and tab routing
├── api/              # REST client (exercises, sessions, players, attendance)
├── hooks/            # useExercises, useSavedSessions, usePlayers, useAttendance
├── types/            # TypeScript interfaces
├── data/
│   ├── constants.ts  # Categories, exercise types, roles, team size
│   ├── exercises.ts  # Seed catalog (first run only)
│   ├── players.ts    # Seed roster (first run only)
│   └── presets.ts    # K1/K2 preset builders
├── utils/
│   ├── session.ts        # Timeline helpers, category grouping
│   ├── sessionStorage.ts # Session ↔ DB ref serialization
│   ├── exerciseId.ts     # ID format ex-cccc-nnn and next-id helpers
│   ├── jumps.ts          # Jump load calculations
│   ├── roles.ts          # Role-based player counts
│   └── tabata.ts         # Work/rest label formatting
└── components/
    ├── DateRangePicker.tsx       # Calendar date / range picker
    ├── ExerciseImage.tsx
    ├── SessionTimelineItem.tsx
    ├── SessionCategoryGroupHeader.tsx
    └── tabs/         # Builder, Archive, Database, Attendance, Print
```

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

1. Run `npm run dev` in a terminal.
2. Use **Run → Launch Chrome against localhost** (F5) — configured for
   `http://localhost:8080`.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Express + better-sqlite3
- [Lucide](https://lucide.dev/) icons
