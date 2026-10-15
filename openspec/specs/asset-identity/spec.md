# asset-identity Specification

## Purpose
Unifies markdown, PDF, cover, and thumbnail filenames under catalog ids, and keeps old reader URLs working via provenance-driven redirects until bookmarks catch up.
## Requirements
### Requirement: Assets are named by catalog id
For each published catalog entry, the markdown file, PDF, processed cover, and thumbnail SHALL use the catalog `id` as the basename (`{id}.md`, `{id}.pdf`, `{id}.jpg`). Processed covers live in `blobs/covers/`. Generated thumbnails live in `blobs/thumb/`. Originals with baked-in text remain untouched in `blobs/originals/`.

#### Scenario: Cover matches catalog id
- **WHEN** catalog id is `the-stillpoint-of-love`
- **THEN** the processed cover file is `blobs/covers/the-stillpoint-of-love.jpg`

#### Scenario: Originals are not renamed
- **WHEN** covers are renamed to new ids
- **THEN** files under `blobs/originals/` keep their existing filenames

### Requirement: Grid uses generated thumbnails
The lattice grid and other compact card surfaces SHALL load the thumbnail URL, not the full cover, once thumbnails exist at a size suitable for the grid (approximately 3:4, large enough that the previous too-small thumbs are not reused).

#### Scenario: Grid image is the thumb
- **WHEN** a CodexCard renders in the lattice grid and a thumbnail URL is present
- **THEN** the `<img>` src is the thumbnail CDN URL, not the full cover URL

### Requirement: CDN URLs are prefix + id
Cover, thumb, and PDF URLs SHALL be constructed from a configurable CDN base (existing Azure base until Ron supplies a new blob prefix) plus the catalog id. The app MUST NOT keep hard-coded old cover filenames.

#### Scenario: Prefix swap does not require per-codex edits
- **WHEN** Ron supplies a new blob prefix and `cdn-config` is updated
- **THEN** all cover/thumb/PDF URLs resolve under the new prefix using catalog ids, without editing markdown

### Requirement: Old ids redirect to new ids
Every provenance `id_change` SHALL produce an HTTP redirect from `/codex/{old_id}` to `/codex/{new_id}` so existing bookmarks and inbound links continue to reach the reader.

#### Scenario: Trailing-number bookmark still opens the reader
- **WHEN** a client requests `/codex/between-the-whole-and-the-relational-11-1`
- **THEN** the response is a redirect to `/codex/between-the-whole-and-the-relational`

#### Scenario: Unchanged ids are not redirected
- **WHEN** a catalog entry's id did not change
- **THEN** no redirect is emitted for that id

### Requirement: Series compilation PDFs are named by series id
A PDF that compiles a whole series SHALL be named `{series-id}.pdf` and referenced from that series' registry record (`compilation_pdf`). It is not a catalog entry, and its name MUST NOT collide with a catalog id.

#### Scenario: Evolution of the Sovereign compilation
- **WHEN** the registry record `the-evolution-of-the-sovereign` is read
- **THEN** its `compilation_pdf` is `the-evolution-of-the-sovereign.pdf` and that file exists in the PDF directory

