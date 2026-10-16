import { describe, expect, it } from 'vitest'
import lattice from '../../../api/codex-lattice.js'
import meta from '../../../api/codex-lattice-meta.js'
import codex from '../../../api/codex/[id].js'

function invoke(handler, { method = 'GET', query = {} } = {}) {
  const res = {
    statusCode: 200,
    headers: {},
    body: undefined,
    setHeader(name, value) {
      this.headers[name] = value
    },
    status(code) {
      this.statusCode = code
      return this
    },
    json(data) {
      this.body = data
      return this
    },
    send(data) {
      this.body = data
      return this
    },
  }
  handler({ method, query }, res)
  return res
}

describe('codex api', () => {
  it('returns the lattice and metadata as JSON', () => {
    const full = invoke(lattice)
    const brief = invoke(meta)

    const fullBody = typeof full.body === 'string' ? JSON.parse(full.body) : full.body
    const briefBody = typeof brief.body === 'string' ? JSON.parse(brief.body) : brief.body

    expect(full.statusCode).toBe(200)
    expect(full.headers['Content-Type']).toBe('application/json')
    expect(full.headers['Cache-Control']).toContain('max-age=3600')
    expect(Array.isArray(fullBody)).toBe(true)

    expect(brief.statusCode).toBe(200)
    expect(Array.isArray(briefBody)).toBe(true)
    expect(briefBody[0].markdown).toBeUndefined()
  })

  it('returns one codex, a 404, and a 405', () => {
    const found = invoke(codex, {
      query: { id: 'between-worlds-the-architecture-of-the-third-structure' },
    })
    const missing = invoke(codex, { query: { id: 'does-not-exist' } })
    const denied = invoke(codex, { method: 'POST', query: { id: 'does-not-exist' } })

    expect(found.statusCode).toBe(200)
    expect(found.body.id).toBe('between-worlds-the-architecture-of-the-third-structure')

    expect(missing.statusCode).toBe(404)
    expect(missing.body.error).toBe('Codex not found')

    expect(denied.statusCode).toBe(405)
  })
})
