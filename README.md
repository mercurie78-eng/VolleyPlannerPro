# VolleyPlanner PRO

Web app for planning integrated volleyball training sessions with parallel stations, plyometric load tracking, and printable court sheets.

## Features

- **Planner** — Build 120-minute sessions with drag-reorder timeline, duration/notes per exercise, and K1/K2 presets
- **Exercise database** — Filter by category, role, and search; add exercises to the current session
- **Archive** — Save, load, and delete training sessions
- **Print sheet** — Generate a printable field schedule for coaches

## Requirements

- [Node.js](https://nodejs.org/) 18+ (20 recommended)
- npm

## Quick start

```bash
cd VolleyPlannerPro
npm install
npm run dev
```

Open [http://localhost:8080](http://localhost:8080).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (port 8080) with hot reload |
| `npm run build` | Type-check and build for production → `dist/` |
| `npm run preview` | Serve the production build locally |

## Project structure

```
src/
├── App.tsx                 # App state and tab routing
├── main.tsx                # Entry point
├── types/                  # TypeScript interfaces
├── data/
│   ├── constants.ts        # Categories, roles, session target
│   ├── exercises.ts        # Exercise catalog
│   └── presets.ts          # Default session and K1/K2 presets
├── utils/
│   └── session.ts          # Session helpers (totals, clone, reorder)
└── components/
    ├── AppHeader.tsx
    ├── ItemControls.tsx
    ├── SessionTimelineItem.tsx
    ├── ExercisePickerCard.tsx
    └── tabs/               # Builder, Archive, Database, Print
```

## Debug in VS Code / Cursor

1. Run `npm run dev` in a terminal.
2. Use **Run → Launch Chrome against localhost** (F5) — configured for `http://localhost:8080`.

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- [Lucide](https://lucide.dev/) icons
