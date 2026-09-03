// Shared definitions + data-access helpers for the persisted app state.
//
// The app persists ten independent "slices" of state. Each slice is stored as a
// single document in the `app_state` collection, keyed by its slice name:
//
//   { _id: "todos", value: [ ... ], updatedAt: ISODate }
//
// This mirrors the original per-slice localStorage model exactly, so the React
// code keeps its existing shape while the data now lives in MongoDB.

import { getCollection } from './mongodb.js'

export const COLLECTION = 'app_state'

// Slice name -> default value (used when a slice has never been written).
export const DEFAULTS = Object.freeze({
  done: {}, // map: milestone id -> 1 (ticked)
  custom: [], // custom dashboard tasks
  notes: '', // freeform notes string
  edits: {}, // map: item id -> edited text
  hidden: {}, // map: item id -> 1 (hidden)
  todos: [], // todo-board cards
  archive: [], // archived / completed todos
  meetings: [], // calendar meetings
  goals: [], // custom targets (xgoals in the hook)
  goalEdits: {}, // map: goal key -> patch (gedits in the hook)
})

export const SLICE_KEYS = Object.keys(DEFAULTS)

export function isValidSlice(key) {
  return Object.prototype.hasOwnProperty.call(DEFAULTS, key)
}

function defaultFor(key) {
  const d = DEFAULTS[key]
  return Array.isArray(d) ? [] : typeof d === 'object' && d !== null ? {} : d
}

/** Read every slice, filling in defaults for any that were never written. */
export async function readAllSlices() {
  const col = await getCollection(COLLECTION)
  const docs = await col.find({}).toArray()
  const byId = new Map(docs.map((d) => [d._id, d.value]))
  const out = {}
  for (const key of SLICE_KEYS) {
    out[key] = byId.has(key) ? byId.get(key) : defaultFor(key)
  }
  return out
}

/** Read one slice (or its default). */
export async function readSlice(key) {
  const col = await getCollection(COLLECTION)
  const doc = await col.findOne({ _id: key })
  return doc ? doc.value : defaultFor(key)
}

/** Create-or-update one slice. */
export async function writeSlice(key, value) {
  const col = await getCollection(COLLECTION)
  await col.updateOne(
    { _id: key },
    { $set: { value, updatedAt: new Date() } },
    { upsert: true },
  )
  return { key, ok: true }
}

/** Reset one slice back to its default (delete the document). */
export async function deleteSlice(key) {
  const col = await getCollection(COLLECTION)
  await col.deleteOne({ _id: key })
  return { key, ok: true }
}
