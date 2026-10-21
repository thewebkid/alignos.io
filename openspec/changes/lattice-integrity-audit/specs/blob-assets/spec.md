## ADDED Requirements

### Requirement: Every catalog PDF exists in the store under its catalog id
For every catalog entry, an object SHALL exist in the public alignos-blob store at `pdf/{id}.pdf`, where the path equals the entry's `assets.pdf`. Objects with other names MAY remain in the store, and the app SHALL NOT depend on them. A rename of any catalog id or PDF path SHALL be followed by an upload to the new name before the change is deployed.

#### Scenario: Every download resolves
- **WHEN** a request is made to `{blob base}/{assets.pdf}` for each catalog entry
- **THEN** each responds 200 with a PDF content type and a non-trivial size

#### Scenario: Legacy redirect targets resolve
- **WHEN** a request follows any `vercel.json` redirect whose destination is `/pdf/{filename}`
- **THEN** the `/pdf/:path*` rewrite reaches an existing blob object

### Requirement: A check proves the store matches the catalog
The repository SHALL provide `scripts/verify-blob-pdfs.js` (run as `npm run verify:pdfs`) that requests every catalog PDF from the store, and from a site when `--site <url>` is given, and exits non-zero listing each entry that is missing, is not a PDF, or is smaller than 10 KB.

#### Scenario: Drift is detected
- **WHEN** the store lacks `pdf/{id}.pdf` for a catalog entry
- **THEN** the script exits 1 and names that entry and URL

#### Scenario: Healthy store
- **WHEN** every catalog PDF resolves
- **THEN** the script exits 0 and reports the count checked
