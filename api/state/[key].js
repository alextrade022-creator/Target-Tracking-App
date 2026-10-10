// /api/state/:key  — CRUD for a single persisted slice
//   GET    -> { key, value }
//   PUT    -> create/update, body { value }
//   DELETE -> reset the slice to its default
import { readSlice, writeSlice, deleteSlice, isValidSlice } from '../_lib/slices.js'
import { sendJson, fail, readBody, applyCors } from '../_lib/http.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (!requireAuth(req, res)) return
  res.setHeader('Cache-Control', 'no-store')
  const key = req.query && req.query.key
  if (!isValidSlice(key)) {
    return sendJson(res, 400, { error: 'Unknown slice: ' + key })
  }

  try {
    if (req.method === 'GET') {
      const value = await readSlice(key)
      return sendJson(res, 200, { key, value })
    }

    if (req.method === 'PUT') {
      const body = await readBody(req)
      const value = body ? body.value : undefined
      await writeSlice(key, value)
      return sendJson(res, 200, { ok: true, key })
    }

    if (req.method === 'DELETE') {
      await deleteSlice(key)
      return sendJson(res, 200, { ok: true, key })
    }

    res.setHeader('Allow', 'GET, PUT, DELETE')
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return fail(res, err)
  }
}
