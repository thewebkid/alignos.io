## ADDED Requirements

### Requirement: Large static assets are uploaded to Vercel Blob
PDF files from `client/public/pdf/` and cover images from `client/public/md/covers/` and `client/public/md/thumb/` SHALL be uploaded to Vercel Blob storage as a one-time migration step. The resulting Blob URLs SHALL be stored in a manifest or env var for use by the application.

#### Scenario: PDFs are accessible via Blob URL
- **WHEN** a user requests a codex PDF download
- **THEN** the request resolves to a Vercel Blob CDN URL (e.g., `https://<hash>.public.blob.vercel-storage.com/pdf/...`) and the file downloads successfully

#### Scenario: Cover images render from Blob
- **WHEN** a codex card or reader view renders a cover image
- **THEN** the `src` resolves to a Vercel Blob URL and the image loads

### Requirement: VITE_BLOB_BASE_URL env var controls asset base path
The client application SHALL read `import.meta.env.VITE_BLOB_BASE_URL` to construct PDF and image URLs. When this env var is set, asset paths SHALL be prefixed with the Blob base URL. When unset (local dev), asset paths SHALL fall back to relative `/pdf/` and `/md/covers/` paths.

#### Scenario: Blob URL used in production
- **WHEN** `VITE_BLOB_BASE_URL` is set in Vercel environment variables
- **THEN** all PDF download links and cover image `src` attributes use the Blob base URL as prefix

#### Scenario: Local dev falls back to public/ paths
- **WHEN** `VITE_BLOB_BASE_URL` is not set
- **THEN** PDF links resolve to `/pdf/<filename>` and image src resolves to `/md/covers/<filename>` (served from `client/public/` by Vite dev server)

### Requirement: build-lattice.js writes Blob URLs when VITE_BLOB_BASE_URL is set
The `build-lattice.js` script SHALL write Blob-prefixed PDF and cover image URLs into `codex-lattice.json` when `VITE_BLOB_BASE_URL` is present in the environment, enabling the generated data to reference Blob assets without client-side URL construction.

#### Scenario: Lattice JSON contains Blob URLs in production build
- **WHEN** `build-lattice.js` runs with `VITE_BLOB_BASE_URL` set
- **THEN** each codex entry's `pdfUrl` and `coverImage` fields reference the Blob CDN hostname

#### Scenario: Lattice JSON contains relative paths in dev
- **WHEN** `build-lattice.js` runs without `VITE_BLOB_BASE_URL`
- **THEN** each codex entry's `pdfUrl` and `coverImage` fields use relative paths (`/pdf/...`, `/md/covers/...`)

### Requirement: PDF and image files can be removed from Git after Blob migration
After Blob upload is confirmed, `client/public/pdf/` and `client/public/md/covers/`, `client/public/md/thumb/` SHALL be removable from the repository without breaking the deployed site.

#### Scenario: Site works after removing binaries from Git
- **WHEN** PDF and image files are deleted from `client/public/` and the change is deployed
- **THEN** all PDF links and images still load from Vercel Blob CDN
