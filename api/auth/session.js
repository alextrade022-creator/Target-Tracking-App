// GET /api/auth/session — who is logged in.
//   200 { user } · 401 not logged in · 503 { setup: false } when login isn't configured
import { authConfig, sessionUser } from '../_lib/auth.js'
import { sendJson, applyCors } from '../_lib/http.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  res.setHeader('Cache-Control', 'no-store')
  if (!authConfig().ready) return sendJson(res, 503, { error: 'Login is not set up', setup: false })
  const user = sessionUser(req)
  return user ? sendJson(res, 200, { user }) : sendJson(res, 401, { error: 'Not logged in' })
}
