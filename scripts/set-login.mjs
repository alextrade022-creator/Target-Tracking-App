// Set (or change) the app's login.  Run:  npm run set-login
//
// Asks for a user ID and a password (typed hidden), then writes three lines to
// .env:  APP_USER, APP_PASSWORD_HASH (a one-way scrypt hash — the password itself
// is never stored) and AUTH_SECRET (random, signs login cookies; kept if it
// already exists). Restart `npm run dev` afterwards. For Vercel, copy the same
// three values into Project → Settings → Environment Variables.

import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import readline from 'node:readline'
import { hashPassword } from '../api/_lib/auth.js'

const envPath = path.resolve(process.cwd(), '.env')

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => rl.question(question, (a) => { rl.close(); resolve(a.trim()) }))
}

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin
    process.stdout.write(question)
    let value = ''
    const onData = (buf) => {
      for (const ch of buf.toString('utf8')) {
        if (ch === '\r' || ch === '\n' || ch === '\u0004') {
          stdin.setRawMode(false); stdin.pause(); stdin.removeListener('data', onData)
          process.stdout.write('\n')
          return resolve(value)
        }
        if (ch === '\u0003') { process.stdout.write('\n'); process.exit(1) } // Ctrl+C
        if (ch === '\u007f' || ch === '\b') { if (value) { value = value.slice(0, -1); process.stdout.write('\b \b') } continue }
        value += ch
        process.stdout.write('*')
      }
    }
    stdin.setRawMode(true); stdin.resume(); stdin.on('data', onData)
  })
}

function setVar(text, key, value) {
  const line = `${key}=${value}`
  const re = new RegExp(`^${key}=.*$`, 'm')
  return re.test(text) ? text.replace(re, line) : text.replace(/\n*$/, '\n') + line + '\n'
}

if (!process.stdin.isTTY) {
  console.error('Run this in a terminal:  npm run set-login')
  process.exit(1)
}

console.log('\nSet the login for Command Center\n')
let user = ''
while (!/^[A-Za-z0-9._@-]{3,40}$/.test(user)) {
  user = await ask('User ID (3–40 letters, numbers, . _ @ -): ')
}
let password = ''
for (;;) {
  password = await askHidden('Password (at least 10 characters): ')
  if (password.length < 10) { console.log('  Too short. Use at least 10 characters.'); continue }
  const again = await askHidden('Type the password again: ')
  if (again !== password) { console.log("  The passwords didn't match. Try again."); continue }
  break
}

let env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : ''
const hasSecret = /^AUTH_SECRET=.{32,}$/m.test(env)
env = setVar(env, 'APP_USER', user)
env = setVar(env, 'APP_PASSWORD_HASH', hashPassword(password))
if (!hasSecret) env = setVar(env, 'AUTH_SECRET', crypto.randomBytes(48).toString('base64url'))
fs.writeFileSync(envPath, env, { mode: 0o600 })
fs.chmodSync(envPath, 0o600) // readable by you only

console.log(`\nSaved. User ID "${user}" and a hashed password are in .env.`)
console.log('Restart the app (stop npm run dev, then run it again) and log in.')
console.log('Deploying to Vercel? Add APP_USER, APP_PASSWORD_HASH and AUTH_SECRET from .env to the project\'s Environment Variables.\n')
