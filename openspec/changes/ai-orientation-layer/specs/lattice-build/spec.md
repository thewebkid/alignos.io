## ADDED Requirements

### Requirement: Published metadata carries attribution and review status
Each generated lattice entry (full and meta) SHALL include `author` (from the catalog), `canonicalUrl` (`{base}/codex/{id}`, with the production base URL configurable at build), and `metadataStatus` (`draft` when the catalog entry has `needs_review: true`, otherwise `reviewed`). The API endpoints SHALL serve these fields unchanged.

#### Scenario: Meta endpoint shows status
- **WHEN** a client requests `/api/codex-lattice-meta`
- **THEN** each entry includes `author`, `canonicalUrl`, and `metadataStatus`

#### Scenario: Base URL is configurable
- **WHEN** the build runs with a preview base URL configured
- **THEN** `canonicalUrl` values still use the production base `https://alignos.io` unless the canonical base is explicitly overridden
