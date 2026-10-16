import { readJson, rejectUnlessGet, sendJson } from './lattice-file.js'

export default function handler(req, res) {
  if (rejectUnlessGet(req, res)) return

  try {
    sendJson(res, readJson('codex-lattice-meta.json'))
  } catch (error) {
    res.status(500).json({ error: 'Failed to read metadata file', message: error.message })
  }
}
