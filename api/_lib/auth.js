// Single-user login for the API.
//
// Credentials come from server-only env vars (never VITE_*):
//   APP_USER           the user ID
//   APP_PASSWORD_HASH  scrypt hash of the password — create it with `npm run set-login`
//   AUTH_SECRET        random secret used to sign session cookies
//
// A successful login sets an HttpOnly, SameSite=Strict cookie holding a signed,
// expiring token. Changing the password (hash) invalidates existing sessions.

import crypto from 'node:crypto'
import { getCollection } from './mongodb.js'
import { sendJson } from './http.js'

const COOKIE = 'cc_session'
const SESSION_DAYS = 30
const MAX_FAILS = 5
const LOCK_MINUTES = 15
const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 }

/* ---------- password hashing ---------- */

/** "scrypt:N:r:p:salt:hash" (base64url parts; no `$`, so it is safe in .env files). */
export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(String(password), salt, SCRYPT.keylen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p })
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64url'), hash.toString('base64url')].join(':')
}

export function verifyPassword(password, stored) {
  const parts = String(stored || '').split(':')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, N, r, p, saltB64, hashB64] = parts
  const expected = Buffer.from(hashB64, 'base64url')
  const actual = crypto.scryptSync(String(password), Buffer.from(saltB64, 'base64url'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  })
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected)
}

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b))
  return x.length === y.length && crypto.timingSafeEqual(x, y)
}

/* ---------- configuration ---------- */

export function authConfig() {
  const user = process.env.APP_USER || ''
  const hash = process.env.APP_PASSWORD_HASH || ''
  const secret = process.env.AUTH_SECRET || ''
  return { user, hash, secret, ready: Boolean(user && hash && secret.length >= 32) }
}

// Ties sessions to the current password: a new hash => old cookies stop working.
const passwordVersion = (hash) => crypto.createHash('sha256').update(hash).digest('base64url').slice(0, 12)

/* ---------- session tokens ---------- */

function sign(payload, secret) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const mac = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  return body + '.' + mac
}

function unsign(token, secret) {
  const [body, mac] = String(token || '').split('.')
  if (!body || !mac) return null
  const expected = crypto.createHmac('sha256', secret).update(body).digest('base64url')
  if (!safeEqual(mac, expected)) return null
  try { return JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) } catch { return null }
}

function readCookie(req, name) {
  const raw = req.headers?.cookie || ''
  for (const part of raw.split(';')) {
    const i = part.indexOf('=')
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim())
  }
  return ''
}

const isHttps = (req) =>
  Boolean(process.env.VERCEL) || String(req.headers?.['x-forwarded-proto'] || '').split(',')[0].trim() === 'https'

function cookieHeader(req, value, maxAgeSeconds) {
  return [
    `${COOKIE}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Strict',
    `Max-Age=${maxAgeSeconds}`,
    isHttps(req) ? 'Secure' : '',
  ].filter(Boolean).join('; ')
}

export function setSession(req, res, user) {
  const cfg = authConfig()
  const exp = Date.now() + SESSION_DAYS * 864e5
  const token = sign({ u: user, v: passwordVersion(cfg.hash), exp }, cfg.secret)
  res.setHeader('Set-Cookie', cookieHeader(req, token, SESSION_DAYS * 86400))
}

export function clearSession(req, res) {
  res.setHeader('Set-Cookie', cookieHeader(req, '', 0))
}

/** The logged-in user ID, or '' when there is no valid session. */
export function sessionUser(req) {
  const cfg = authConfig()
  if (!cfg.ready) return ''
  const data = unsign(readCookie(req, COOKIE), cfg.secret)
  if (!data || data.exp < Date.now()) return ''
  if (data.u !== cfg.user || data.v !== passwordVersion(cfg.hash)) return ''
  return data.u
}

/** Guard for protected routes. Sends 401/503 and returns false when not allowed. */
export function requireAuth(req, res) {
  if (!authConfig().ready) {
    sendJson(res, 503, { error: 'Login is not set up', setup: false })
    return false
  }
  if (!sessionUser(req)) {
    sendJson(res, 401, { error: 'Not logged in' })
    return false
  }
  return true
}

/* ---------- brute-force protection ---------- */

export function clientIp(req) {
  const fwd = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
  return fwd || req.socket?.remoteAddress || 'unknown'
}

const memory = new Map() // fallback if the database is unreachable

async function attempts() {
  try { return await getCollection('auth_attempts') } catch { return null }
}

/** Minutes left on a lockout for this IP, or 0. */
export async function lockedFor(ip) {
  const col = await attempts()
  const rec = col ? await col.findOne({ _id: ip }) : memory.get(ip)
  if (!rec || rec.count < MAX_FAILS) return 0
  const left = rec.first + LOCK_MINUTES * 60000 - Date.now()
  return left > 0 ? Math.ceil(left / 60000) : 0
}

export async function noteFailure(ip) {
  const now = Date.now()
  const col = await attempts()
  const rec = (col ? await col.findOne({ _id: ip }) : memory.get(ip)) || null
  const fresh = !rec || now - rec.first > LOCK_MINUTES * 60000
  const next = { count: fresh ? 1 : rec.count + 1, first: fresh ? now : rec.first }
  if (col) await col.updateOne({ _id: ip }, { $set: next }, { upsert: true })
  else memory.set(ip, next)
  return MAX_FAILS - next.count
}

export async function clearFailures(ip) {
  const col = await attempts()
  if (col) await col.deleteOne({ _id: ip })
  memory.delete(ip)
}
