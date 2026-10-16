import { readJson, rejectUnlessGet, sendJson } from '../lattice-file.js'

export default function handler(req, res) {
  if (rejectUnlessGet(req, res)) return

  const { id } = req.query

  try {
    const codex = readJson('codex-lattice.json').find(c => c.id === id)

    if (codex) {
      sendJson(res, codex)
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
