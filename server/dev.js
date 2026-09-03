// Local development API server.
//
// On Vercel, each file under /api is deployed as its own serverless function.
// Locally we don't have that runtime, so this tiny Express server mounts the
// very same handler modules at the same paths. Run it via `npm run dev` (which
// starts Vite + this server together) — the Vite dev server proxies /api here.
//
// Load env with:  node --env-file-if-exists=.env server/dev.js  (see package.json)
// This file is NOT deployed to Vercel; it is a dev-only convenience.

import express from 'express'
import stateIndex from '../api/state/index.js'
import stateKey from '../api/state/[key].js'
import health from '../api/health.js'

const app = express()
app.use(express.json({ limit: '2mb' }))

// Adapt an (req, res) handler and surface async errors as 500s.
const wrap = (h) => (req, res) => {
  Promise.resolve(h(req, res)).catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[dev-api] unhandled:', err)
    if (!res.headersSent) res.status(500).json({ error: String((err && err.message) || err) })
  })
}

// app.all so preflight OPTIONS reaches the handler (it sets CORS + replies 204).
app.all('/api/health', wrap(health))
app.all('/api/state', wrap(stateIndex))
// Vercel exposes the dynamic segment as req.query.key; mirror that for Express.
app.all('/api/state/:key', (req, res) => {
  req.query.key = req.params.key
  return wrap(stateKey)(req, res)
})

const port = Number(process.env.API_PORT) || 3001
app.listen(port, () => {
  const configured = Boolean(process.env.MONGODB_URI)
  // eslint-disable-next-line no-console
  console.log(`successfully connected to http://localhost:${port}  (MONGODB_URI ${configured ? 'set' : 'NOT set'})`)
})
console.log('nadalalala')