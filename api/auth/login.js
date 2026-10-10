// POST /api/auth/login  body { user, password }
//   200 { ok, user } + session cookie · 401 wrong details · 429 locked out · 503 not set up
import { authConfig, verifyPassword, setSession, clientIp, lockedFor, noteFailure, clearFailures } from '../_lib/auth.js'
import { sendJson, fail, readBody, applyCors } from '../_lib/http.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return sendJson(res, 405, { error: 'Method not allowed' })
  }
  try {
    const cfg = authConfig()
    if (!cfg.ready) return sendJson(res, 503, { error: 'Login is not set up', setup: false })

    const ip = clientIp(req)
    const wait = await lockedFor(ip)
    if (wait) return sendJson(res, 429, { error: `Too many attempts. Try again in ${wait} minute${wait === 1 ? '' : 's'}.` })

    const body = await readBody(req)
    const user = String(body?.user || '').trim()
    const password = String(body?.password || '')
    // Always run the (slow) hash check so a wrong user ID takes as long as a wrong password.
    const passOk = verifyPassword(password, cfg.hash)
    if (!(passOk && user.toLowerCase() === cfg.user.toLowerCase())) {
      const left = await noteFailure(ip)
      return sendJson(res, 401, {
        error: left > 0 ? 'User ID or password is incorrect.' : 'Too many attempts. Try again in 15 minutes.',
      })
    }
    await clearFailures(ip)
    setSession(req, res, cfg.user)
    return sendJson(res, 200, { ok: true, user: cfg.user })
  } catch (err) {
    return fail(res, err)
  }
}
