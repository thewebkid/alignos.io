import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LATTICE_PATH = path.join(__dirname, '..', '..', 'client', 'src', 'generated', 'codex-lattice.json')

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query

  try {
    const latticeData = JSON.parse(fs.readFileSync(LATTICE_PATH, 'utf-8'))
    const codex = latticeData.find(c => c.id === id)

    if (codex) {
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400')
      res.status(200).json(codex)
    } else {
      res.status(404).json({
        error: 'Codex not found',
        suggestion: 'Browse available codexes at /api/codex-lattice-meta',
        requested_id: id
      })
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to load codex data', message: error.message })
  }
}
