// /api/state
//   GET  -> every persisted slice, defaults filled in
//   PUT  -> bulk create/update: body { slices: { <key>: <value>, ... } }
import { readAllSlices, writeSlice, isValidSlice } from '../_lib/slices.js'
import { sendJson, fail, readBody, applyCors } from '../_lib/http.js'
import { requireAuth } from '../_lib/auth.js'

export default async function handler(req, res) {
  if (applyCors(req, res)) return
  if (!requireAuth(req, res)) return
  res.setHeader('Cache-Control', 'no-store')
  try {
    if (req.method === 'GET') {
      const slices = await readAllSlices()
      return sendJson(res, 200, slices)
    }

    if (req.method === 'PUT') {
      const body = await readBody(req)
      const slices = (body && body.slices) || {}
      const keys = Object.keys(slices).filter(isValidSlice)
      await Promise.all(keys.map((k) => writeSlice(k, slices[k])))
      return sendJson(res, 200, { ok: true, updated: keys })
    }

    res.setHeader('Allow', 'GET, PUT')
    return sendJson(res, 405, { error: 'Method not allowed' })
  } catch (err) {
    return fail(res, err)
  }
}
