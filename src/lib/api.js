// Frontend persistence client. Talks to the /api/state endpoints (same origin;
// proxied to the local dev API by Vite, served by Vercel functions in prod).
//
// Replaces the old localStorage read/write. Writes are debounced per slice and
// skipped when the value is unchanged, so frequent edits (e.g. typing notes) do
// not flood the server.

export const SLICE_KEYS = [
  'done', 'custom', 'notes', 'edits', 'hidden',
  'todos', 'archive', 'meetings', 'goals', 'goalEdits', 'branding', 'brandTags', 'leads',
  'wsBusinesses', 'wsTasks', 'wsMeetings',
  'pfTxns', 'pfInvestments', 'pfGoals', 'pfSavings', 'pfEmis', 'pfSettings',
  'crmLeads', 'crmSettings', 'paySales', 'paySettings',
]

const WRITE_DELAY = 400 // ms

const lastSent = {} // key -> last JSON string queued/sent
const timers = {} // key -> debounce timer

let inflight = null

/** Load every slice (one shared request for all modules). Returns the slices
 *  object, or null if the API is unreachable (a later call retries). */
export function getState() {
  if (!inflight) {
    inflight = loadState().then((d) => {
      if (!d) inflight = null
      return d
    })
  }
  return inflight
}

async function loadState() {
  try {
    const res = await fetch('/api/state', { headers: { Accept: 'application/json' } })
    if (res.status === 401) authExpired()
    if (!res.ok) return null
    const data = await res.json()
    // Seed the de-dupe cache so the hydration re-render doesn't echo the freshly
    // loaded values straight back to the server.
    for (const key of SLICE_KEYS) {
      lastSent[key] = JSON.stringify(data && key in data ? data[key] : null)
    }
    return data
  } catch (e) {
    return null
  }
}

/** Debounced create/update for one slice. No-op when the value is unchanged. */
export function putSlice(key, value) {
  const json = JSON.stringify(value ?? null)
  if (lastSent[key] === json) return
  lastSent[key] = json

  clearTimeout(timers[key])
  timers[key] = setTimeout(() => {
    fetch('/api/state/' + encodeURIComponent(key), {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    }).then((res) => {
      if (res.ok) { delete unsaved[key]; return }
      // Keep the change so it can be sent again (e.g. after logging back in).
      unsaved[key] = value
      lastSent[key] = undefined
      if (res.status === 401) authExpired()
    }).catch(() => {
      unsaved[key] = value
      lastSent[key] = undefined
    })
  }, WRITE_DELAY)
}

/* ---------- login ---------- */

const unsaved = {} // key -> value whose save failed

function authExpired() {
  window.dispatchEvent(new Event('cc:auth-expired'))
}

/** Re-send changes that failed while logged out. */
export function flushUnsaved() {
  for (const key of Object.keys(unsaved)) {
    const value = unsaved[key]
    delete unsaved[key]
    putSlice(key, value)
  }
}

/** { status: 'in', user } | { status: 'out' } | { status: 'setup' } | { status: 'offline' } */
export async function getSession() {
  try {
    const res = await fetch('/api/auth/session', { headers: { Accept: 'application/json' }, cache: 'no-store' })
    if (res.ok) return { status: 'in', user: (await res.json()).user }
    if (res.status === 401) return { status: 'out' }
    if (res.status === 503) {
      const body = await res.json().catch(() => ({}))
      if (body.setup === false) return { status: 'setup' }
    }
    return { status: 'offline' }
  } catch {
    return { status: 'offline' }
  }
}

/** Returns '' on success, otherwise a message to show. */
export async function login(user, password) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ user, password }),
    })
    if (res.ok) return ''
    const body = await res.json().catch(() => ({}))
    if (res.status === 503 && body.setup === false) return 'Login is not set up yet. Run "npm run set-login" in the project folder.'
    return body.error || 'Could not log in. Try again.'
  } catch {
    return 'Could not reach the server. Check that the app is running.'
  }
}

export async function logout() {
  try { await fetch('/api/auth/logout', { method: 'POST' }) } catch { /* ignore */ }
}
