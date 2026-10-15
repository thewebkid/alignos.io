# legacy-url-redirects Specification

## Purpose
Keeps links into the retired WordPress alignos.io working after DNS moves to the new site, by permanently redirecting every known legacy URL (pages, uploaded PDFs, ripple posts) to its new home.
## Requirements
### Requirement: Legacy URL map is committed data
The site SHALL keep a committed map of every known legacy WordPress URL path and its new destination. Each row SHALL record the legacy path, the destination path, and a kind (`page`, `pdf`, `ripple`, or `retired`). Rows SHALL come from the captured WordPress page sitemap, the PDF links on captured pages, and the ripple/post sitemap. Redirect configuration SHALL be generated from this map, not edited by hand.

#### Scenario: Map drives configuration
- **WHEN** a row is added to the legacy URL map and the redirect generator runs
- **THEN** the deployment's redirect configuration contains a matching permanent redirect

### Requirement: Every captured legacy URL is accounted for
The redirect generator SHALL fail if any captured legacy PDF or ripple URL has no destination in the map. A URL with no successor SHALL appear in the map with kind `retired` and an explicit destination. It MUST NOT be left unmapped or fall through to the catch-all.

#### Scenario: Unmapped PDF fails generation
- **WHEN** a captured `wp-content/uploads/...pdf` URL has no row in the map
- **THEN** the generator exits with an error naming that URL

### Requirement: Retired pages redirect to their successors
Legacy page paths SHALL redirect permanently as follows:

| Legacy path | Destination |
|---|---|
| `/codex-lattice/` | `/lattice` |
| `/contact/` | `/faq` |
| `/newsletter/` | `/` |
| `/login/` | `/` |
| `/lostpassword/` | `/` |

Legacy pages whose slug is kept (`/return-room/`, `/before-you-begin/`, `/between-worlds/`, `/papers/`, `/faq/`, `/arc-of-difference/`) SHALL resolve to the same path without the trailing slash.

#### Scenario: Old lattice bookmark
- **WHEN** a client requests `/codex-lattice/`
- **THEN** it receives a permanent redirect to `/lattice`

#### Scenario: Kept slug with trailing slash
- **WHEN** a client requests `/papers/`
- **THEN** it reaches the Papers page at `/papers`

### Requirement: Uploaded PDFs redirect to catalog PDFs
Each legacy `wp-content/uploads/**.pdf` URL SHALL permanently redirect to the PDF of the catalog codex it contains (`/pdf/{id}.pdf`, or the configured PDF base plus `{id}.pdf`). Variant uploads of the same work (for example `-1` suffixed copies) SHALL redirect to the same destination. A series compilation PDF SHALL redirect to its kebab-case compilation file.

#### Scenario: Suffixed variant
- **WHEN** a client requests `/wp-content/uploads/2025/08/Framing-the-Mirror-1.pdf`
- **THEN** it receives a permanent redirect to the PDF for catalog id `framing-the-mirror`

#### Scenario: Series compilation
- **WHEN** a client requests `/wp-content/uploads/2025/07/The-Evolution-of-the-Sovereign-1.pdf`
- **THEN** it receives a permanent redirect to `/pdf/the-evolution-of-the-sovereign.pdf`

### Requirement: Ripple posts redirect to the reader
Each legacy `/ripple/{slug}` post URL SHALL permanently redirect to `/codex/{id}` for the codex it presented.

#### Scenario: Ripple post
- **WHEN** a client requests a captured `/ripple/{slug}` URL for The Fundamental Arc
- **THEN** it receives a permanent redirect to `/codex/the-fundamental-arc`

### Requirement: Codex-id redirects are preserved
The existing `/codex/{old_id}` → `/codex/{new_id}` redirects generated from provenance SHALL remain in place alongside the legacy URL redirects.

#### Scenario: Both families present
- **WHEN** the redirect generator runs
- **THEN** the output contains both the provenance id redirects and the legacy URL redirects, with no duplicate sources

