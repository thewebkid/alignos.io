## ADDED Requirements

### Requirement: /api/codex-lattice returns full lattice JSON
A Vercel Serverless Function at `api/codex-lattice.js` SHALL respond to `GET /api/codex-lattice` with the full `codex-lattice.json` content, setting `Content-Type: application/json` and an appropriate cache header.

#### Scenario: Successful response
- **WHEN** a `GET` request is made to `/api/codex-lattice`
- **THEN** the response has status 200, `Content-Type: application/json`, and body equal to the full codex lattice array

#### Scenario: Cache header is set
- **WHEN** a `GET` request is made to `/api/codex-lattice`
- **THEN** the response includes `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`

### Requirement: /api/codex-lattice-meta returns metadata JSON
A Vercel Serverless Function at `api/codex-lattice-meta.js` SHALL respond to `GET /api/codex-lattice-meta` with the `codex-lattice-meta.json` content.

#### Scenario: Successful metadata response
- **WHEN** a `GET` request is made to `/api/codex-lattice-meta`
- **THEN** the response has status 200, `Content-Type: application/json`, and body is the metadata array (130KB, no full markdown content)

### Requirement: /api/codex/[id] returns a single codex by ID
A Vercel Serverless Function at `api/codex/[id].js` SHALL respond to `GET /api/codex/{id}` with the matching codex object, or 404 if not found.

#### Scenario: Known ID returns codex
- **WHEN** a `GET` request is made to `/api/codex/between-worlds-the-architecture-of-the-third-structure`
- **THEN** the response has status 200 and body is the codex object with matching `id` field

#### Scenario: Unknown ID returns 404
- **WHEN** a `GET` request is made to `/api/codex/does-not-exist`
- **THEN** the response has status 404 and body contains an `error` field

### Requirement: API functions include the JSON data files at build time
The `vercel.json` `functions` config SHALL use `includeFiles` so that `codex-lattice.json` and `codex-lattice-meta.json` are bundled with their respective functions and readable via `fs.readFileSync` at runtime.

#### Scenario: Function can read the lattice file
- **WHEN** the deployed function is invoked
- **THEN** `fs.readFileSync` on the relative path to `codex-lattice.json` succeeds without error
