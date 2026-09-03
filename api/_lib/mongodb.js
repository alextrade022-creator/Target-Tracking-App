// Reusable MongoDB connection module.
//
// Uses the official `mongodb` Node.js driver. The connected client is cached on
// the Node `global` object so that a warm serverless function (Vercel) or the
// long-lived local dev server reuses a single connection pool across many
// invocations instead of opening a new connection on every request.
//
// This module is server-only. It reads MONGODB_URI / MONGODB_DB_NAME from the
// environment and MUST NEVER be imported by browser/React code.

import { MongoClient } from 'mongodb'

const DEFAULT_DB = 'target_tracker'

// Strip the `user:pass@` part so credentials never reach the logs.
function safeHost(uri) {
  try {
    return uri.replace(/\/\/[^/@]*@/, '//')
  } catch {
    return '(unparseable URI)'
  }
}

/** @returns {Promise<import('mongodb').MongoClient>} */
function clientPromise() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    const err = new Error('MONGODB_URI is not set. Fill in .env with your connection string.')
    err.code = 'NO_MONGODB_URI'
    throw err
  }

  // Reuse the connection across hot reloads (dev) and warm invocations (Vercel).
  if (!global._mongoClientPromise) {
    const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB
    const client = new MongoClient(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 8000,
    })
    global._mongoClientPromise = client
      .connect()
      // connect() resolves lazily for standard URIs, so ping once to confirm we
      // can actually reach the server before declaring success.
      .then(async (connected) => {
        await connected.db(dbName).command({ ping: 1 })
        // eslint-disable-next-line no-console
        console.log(`[mongodb] ✅ connected — ${safeHost(uri)} (db: ${dbName})`)
        return connected
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`[mongodb] ❌ connection error — ${safeHost(uri)}: ${err.message}`)
        // Clear the cache so the next request retries instead of reusing a rejected promise.
        global._mongoClientPromise = undefined
        throw err
      })
  }
  return global._mongoClientPromise
}

/** @returns {Promise<import('mongodb').Db>} */
export async function getDb() {
  const client = await clientPromise()
  return client.db(process.env.MONGODB_DB_NAME || DEFAULT_DB)
}

/** @returns {Promise<import('mongodb').Collection>} */
export async function getCollection(name) {
  const db = await getDb()
  return db.collection(name)
}

/** Lightweight connectivity probe used by the /api/health endpoint. */
export async function pingDb() {
  const db = await getDb()
  await db.command({ ping: 1 })
  return true
}
