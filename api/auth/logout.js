// POST /api/auth/logout — clears the session cookie.
import { clearSession } from '../_lib/auth.js'
import { sendJson, applyCors } from '../_lib/http.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }
  clearSession(req, res)
  return sendJson(res, 200, { ok: true })
}
