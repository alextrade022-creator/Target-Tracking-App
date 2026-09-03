# Targets Roadmap

A goal & target tracker — dashboard, todo board, calendar, notes/new-tasks, and a printable monthly report. All data is stored locally in the browser (`localStorage`); there is no backend, so it deploys to Vercel as a static single-page app.

Refactored from the original single-file Claude Design document into **React + Vite + Tailwind CSS**.

## Features

- **Light & dark themes** with a toggle in the top-right of the header. The choice is saved to `localStorage` and applied before first paint (no flash). The theme is driven by CSS variables, so every surface, text and hairline flips consistently; accent colors stay constant.
- **Responsive** from phone to wide desktop. Wide tables (the monthly roadmap, the calendar grid, the target editor, the report tables) scroll horizontally on small screens; multi-column sections collapse to fewer columns.

## Tech stack

- **React 18** (function components + hooks)
- **Vite 5** (dev server + build)
- **Tailwind CSS 3** (all styling; theme neutrals resolve from CSS variables, so light/dark flips without `dark:` variants everywhere. Runtime-dynamic colors/widths remain inline styles because Tailwind can't express arbitrary runtime values.)

## Local development

Requires Node.js 18+ (Node 20 recommended).

```bash
npm install
npm run dev      # http://localhost:5173
```

## Build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
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

**Option B — Vercel CLI**
```bash
npm i -g vercel
vercel          # preview deploy
vercel --prod   # production deploy
```

### Why this works on Vercel's serverless/static platform
- The app is 100% client-side, so Vercel serves the built static assets from `dist/` — no server functions needed.
- `public/` holds static files copied verbatim to the site root (e.g. `favicon.svg`).
- `vercel.json` sets the framework, build command, output directory, and an SPA rewrite so every path serves `index.html`.

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
index.html              Vite entry (fonts + #root)
vercel.json             Vercel build/hosting config
tailwind.config.js      Tailwind theme (color tokens, fonts)
postcss.config.js       Tailwind + autoprefixer
public/favicon.svg      Static asset
src/
  main.jsx              React entry
  App.jsx               Layout + page switch
  config.js             App-level settings
  index.css             Tailwind directives + a few component classes
  lib/
    constants.js        Goals, weekly plan, palette, storage keys
    helpers.js          Date formatting + classnames helper
  hooks/
    useTargetTracker.js State, localStorage persistence, actions, derived values
  components/
    ui.jsx              Select, tick box, progress bar primitives
    Header.jsx          Title, tabs, header stats
    Dashboard.jsx       Goal cards, roadmap grid, weekly plan
    TodoBoard.jsx       Kanban board + history
    CalendarView.jsx    Month calendar + meeting scheduler
    Notes.jsx           New task/target forms, item lists, notes
    Report.jsx          Printable monthly report
```
