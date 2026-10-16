import { readJson, rejectUnlessGet, sendJson } from './lattice-file.js'

export default function handler(req, res) {
  if (rejectUnlessGet(req, res)) return

  try {
    sendJson(res, readJson('codex-lattice.json'))
  } catch (error) {
    res.status(500).json({ error: 'Failed to read lattice file', message: error.message })
  }
}
