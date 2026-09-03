// Frontend persistence client. Talks to the /api/state endpoints (same origin;
// proxied to the local dev API by Vite, served by Vercel functions in prod).
//
// Replaces the old localStorage read/write. Writes are debounced per slice and
// skipped when the value is unchanged, so frequent edits (e.g. typing notes) do
// not flood the server.

export const SLICE_KEYS = [
  'done', 'custom', 'notes', 'edits', 'hidden',
  'todos', 'archive', 'meetings', 'goals', 'goalEdits',
]

const WRITE_DELAY = 400 // ms

const lastSent = {} // key -> last JSON string queued/sent
const timers = {} // key -> debounce timer

/** Load every slice. Returns the slices object, or null if the API is unreachable. */
export async function getState() {
  try {
    const res = await fetch('/api/state', { headers: { Accept: 'application/json' } })
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
    }).catch(() => {
      // Let a later change retry this slice.
      lastSent[key] = undefined
    })
  }, WRITE_DELAY)
}
