# blob-assets Specification

## Purpose
Serve codex PDFs from the public alignos-blob store. Cover images and thumbnails stay on the deployment.
## Requirements
### Requirement: PDF downloads use the public alignos-blob store
Codex and compilation PDF links SHALL resolve to `https://qahh5hlfi6v2odz8.public.blob.vercel-storage.com/pdf/{filename}`. `VITE_BLOB_BASE_URL`, when set, SHALL replace that host. Cover images and thumbnails SHALL stay same-origin files from the deployment (`/covers/`, `/thumb/`) and SHALL NOT use the blob host.

#### Scenario: A reader download opens the blob PDF
- **WHEN** a reader or corridor link builds a PDF href
- **THEN** the href is `{blob base}/pdf/{id}.pdf` on the public alignos-blob store
- **AND** the file downloads successfully

#### Scenario: Cover images and thumbnails stay on the deployment
- **WHEN** a codex card, search result, or reader view renders a cover or thumbnail
- **THEN** the image `src` is a same-origin path (`/covers/...` or `/thumb/...`)
- **AND** the `src` is not a Vercel Blob URL

### Requirement: Legacy /pdf paths rewrite to the same store
`vercel.json` SHALL rewrite `/pdf/:path*` to the same blob prefix so existing redirects whose destination is `/pdf/{filename}` keep working after `client/public/pdf/` is removed from the deployment.

#### Scenario: An old PDF redirect still downloads
- **WHEN** a request arrives at `/pdf/{filename}` on the site
- **THEN** Vercel rewrites it to the blob object at `/pdf/{filename}`

### Requirement: PDF files are not part of the deployment
`client/public/pdf/` SHALL be removed from Git. `client/public/covers/` and `client/public/thumb/` SHALL remain in the repository and in the deployment.

#### Scenario: Site works after removing PDFs from Git
- **WHEN** PDF files are absent from `client/public/pdf/` and the change is deployed
- **THEN** PDF links still download from Vercel Blob
- **AND** cover images and thumbnails still load from the deployment
