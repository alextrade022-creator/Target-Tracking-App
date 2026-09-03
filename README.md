# Targets Roadmap

A goal & target tracker — dashboard, todo board, calendar, notes/new-tasks, and a printable monthly report. All app data is persisted in **MongoDB Atlas** through a small serverless API, so it survives refreshes, browser restarts, and redeploys. Deploys to Vercel (static frontend + `/api` serverless functions).

Refactored from the original single-file Claude Design document into **React + Vite + Tailwind CSS**, with a **Node.js + MongoDB** API layer.

## Features

- **Light & dark themes** with a toggle in the top-right of the header. The choice is saved to `localStorage` and applied before first paint (no flash). The theme is driven by CSS variables, so every surface, text and hairline flips consistently; accent colors stay constant.
- **Responsive** from phone to wide desktop. Wide tables (the monthly roadmap, the calendar grid, the target editor, the report tables) scroll horizontally on small screens; multi-column sections collapse to fewer columns.

## Tech stack

- **React 18** (function components + hooks)
- **Vite 5** (dev server + build)
- **Tailwind CSS 3** (all styling; theme neutrals resolve from CSS variables, so light/dark flips without `dark:` variants everywhere. Runtime-dynamic colors/widths remain inline styles because Tailwind can't express arbitrary runtime values.)
- **Node.js + MongoDB** (official `mongodb` driver) behind serverless API routes in `/api`. The browser talks only to the API — it never sees the database or connection string.

## Persistence & API

All persistent data lives in MongoDB. The browser reads/writes it through same-origin
`/api/state` endpoints — the connection string stays server-side.

- **Collection:** `app_state` — one document per state "slice", `{ _id: <slice>, value, updatedAt }`.
- **Slices** (the data that used to be in `localStorage`): `done`, `custom`, `notes`, `edits`, `hidden`, `todos`, `archive`, `meetings`, `goals`, `goalEdits`.
- **Endpoints:**
  - `GET /api/state` — all slices (defaults filled in for any never written)
  - `PUT /api/state` — bulk upsert `{ slices: { <key>: <value> } }`
  - `GET /api/state/:key` — one slice
  - `PUT /api/state/:key` — create/update one slice `{ value }`
  - `DELETE /api/state/:key` — reset one slice to its default
  - `GET /api/health` — DB connectivity probe (no secrets)

The React hook hydrates from `GET /api/state` on mount and syncs each slice back on
change (debounced, and skipped when unchanged). Only the **theme** preference stays in
`localStorage`, because it must be read synchronously before first paint.

## Environment variables

Fill in `.env` with your values. **`.env` is gitignored — never commit it.**

```
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/
MONGODB_DB_NAME=target_tracker
```

These are **server-only**. Do **not** prefix them with `VITE_` — anything `VITE_*` is
bundled into the frontend and would leak your credentials.

## Local development

Requires Node.js 18+ (Node 20 recommended). You need a MongoDB connection string —
either a free MongoDB Atlas cluster or a local `mongod`.

```bash
npm install
# edit .env and set your MONGODB_URI
npm run dev               # web: http://localhost:5173  ·  api: http://localhost:3001
```

`npm run dev` runs the Vite frontend and the local API server together (via
`concurrently`). Vite proxies `/api/*` to the API server, so the frontend calls
same-origin `/api` in dev exactly like it does in production.

Verify the database connection at any time:

```bash
curl http://localhost:3001/api/health
# -> {"ok":true,"configured":true,"db":true,"dbName":"target_tracker"}
```

> The local API server (`server/dev.js`) exists only for local dev — it mounts the same
> `/api` handler modules that Vercel deploys as serverless functions. It is not deployed.

## Build

```bash
npm run build    # outputs the frontend to dist/
npm run preview  # preview the production build + local API together
```

## Deploy to Vercel

This repo is already configured for Vercel (`vercel.json`).

**Option A — Git integration (recommended)**
1. Push this folder to a Git repo (GitHub/GitLab/Bitbucket).
2. In Vercel, "Add New → Project" and import the repo.
3. Vercel auto-detects the **Vite** framework. Defaults are correct:
   - Build command: `vite build`
   - Output directory: `dist`
   - Install command: `npm install`
4. Deploy.

Then set the environment variables in **Project → Settings → Environment Variables**:
`MONGODB_URI` and `MONGODB_DB_NAME` (Production + Preview). Redeploy after adding them.

**Option B — Vercel CLI**
```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

### Why this works on Vercel's serverless/static platform
- The frontend is built to static assets in `dist/` and served from Vercel's CDN.
- Every file in `/api` is deployed as an independent **serverless function** (Node.js). They share one cached MongoDB connection per warm instance (see `api/_lib/mongodb.js`).
- `public/` holds static files copied verbatim to the site root (e.g. `favicon.svg`).
- `vercel.json` sets the framework, build command, output directory, and an SPA rewrite that serves `index.html` for every path **except `/api/*`**, so the API routes are reachable.
- Secrets live only in Vercel env vars / your local `.env` — never in the bundle.

## Configuration

Edit `src/config.js` to change the owner name, the Qissa student target, or whether the weekly plan shows:

```js
export const CONFIG = {
  ownerName: 'My Targets & Growth Plan',
  targetStudents: 160,
  showWeeklyPlan: true,
}
```

## Project structure

```
index.html              Vite entry (fonts + #root + no-flash theme script)
vercel.json             Vercel build/hosting config (SPA rewrite excludes /api)
.env                    Environment variables (gitignored — fill in your values)
tailwind.config.js      Tailwind theme (color tokens, fonts)
postcss.config.js       Tailwind + autoprefixer
public/favicon.svg      Static asset
api/                    Serverless API (Vercel functions; server-only)
  _lib/
    mongodb.js          Reusable cached MongoDB connection (official driver)
    slices.js           app_state collection helpers + slice defaults
    http.js             Small (req,res) response/body helpers
  health.js             GET /api/health
  state/
    index.js            GET all slices / PUT bulk
    [key].js            GET / PUT / DELETE one slice
server/
  dev.js                Local-only Express server mounting the same handlers
src/
  main.jsx              React entry
  App.jsx               Layout + page switch
  config.js             App-level settings
  index.css             Tailwind directives + a few component classes
  lib/
    constants.js        Goals, weekly plan, palette
    helpers.js          Date formatting + classnames helper
    api.js              Frontend client for /api/state (debounced writes)
  hooks/
    useTargetTracker.js State, MongoDB hydration + sync, actions, derived values
    useTheme.js         Light/dark theme (localStorage; pre-paint)
  components/
    ui.jsx              Select, tick box, progress bar primitives
    Header.jsx          Title, tabs, header stats
    Dashboard.jsx       Goal cards, roadmap grid, weekly plan
    TodoBoard.jsx       Kanban board + history
    CalendarView.jsx    Month calendar + meeting scheduler
    Notes.jsx           New task/target forms, item lists, notes
    Report.jsx          Printable monthly report
```
