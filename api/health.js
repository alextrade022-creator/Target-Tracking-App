// /api/health — connectivity probe. Handy for confirming your MONGODB_URI works
// before opening the app. Never returns any secrets.
import { pingDb } from './_lib/mongodb.js'
import { sendJson, fail, applyCors } from './_lib/http.js'
import { sessionUser } from './_lib/auth.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  try {
    const configured = Boolean(process.env.MONGODB_URI)
    if (!configured) {
      return sendJson(res, 503, { ok: false, configured: false, db: false })
    }
    await pingDb()
    const body = { ok: true, configured: true, db: true }
    // The database name is only shown to a logged-in user.
    if (sessionUser(req)) body.dbName = process.env.MONGODB_DB_NAME || 'target_tracker'
    return sendJson(res, 200, body)
  } catch (err) {
    return fail(res, err)
  }
}
