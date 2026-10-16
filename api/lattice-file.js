import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const GENERATED_DIR = path.join(__dirname, '..', 'client', 'src', 'generated')

const CACHE_CONTROL = 'public, max-age=3600, stale-while-revalidate=86400'

const parsed = new Map()

export function readJson(filename) {
  if (!parsed.has(filename)) {
    const filePath = path.join(GENERATED_DIR, filename)
    parsed.set(filename, JSON.parse(fs.readFileSync(filePath, 'utf-8')))
  }
  return parsed.get(filename)
}

export function rejectUnlessGet(req, res) {
  if (req.method === 'GET') return false
  res.status(405).json({ error: 'Method not allowed' })
  return true
}

export function sendJson(res, body) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Cache-Control', CACHE_CONTROL)
  res.status(200).json(body)
}
