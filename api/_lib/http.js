// Small helpers shared by the API route handlers. Written against the plain
// Node (req, res) signature so the same handlers run unchanged on Vercel
// serverless functions and on the local Express dev server.

// Apply CORS headers and short-circuit preflight (OPTIONS) requests.
// Returns true if the request was fully handled (preflight) and the caller
// should stop. Allowed origin defaults to "*" (this API stores no per-user
// secrets and uses no cookies); set CORS_ALLOW_ORIGIN to lock it to one origin.
export function applyCors(req, res) {
  const origin = process.env.CORS_ALLOW_ORIGIN || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept')
  res.setHeader('Access-Control-Max-Age', '86400')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return true
  }
  return false
}

export function sendJson(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(body))
}

export function fail(res, err) {
  if (err && err.code === 'NO_MONGODB_URI') {
    return sendJson(res, 503, { error: 'Database not configured', detail: err.message })
  }
  // eslint-disable-next-line no-console
  console.error('[api] error:', err)
  return sendJson(res, 500, { error: 'Internal error', detail: String((err && err.message) || err) })
}

// req.body is already parsed by Vercel (JSON) and by express.json() in dev.
// This falls back to reading the raw stream if neither did (defensive).
export async function readBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'string') {
      try {
        return JSON.parse(req.body)
      } catch {
        return {}
      }
    }
    return req.body
  }
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return {}
  }
}
