## ADDED Requirements

### Requirement: Project is deployable to Vercel from GitHub
The system SHALL be deployable to Vercel by connecting the GitHub repository `https://github.com/thewebkid/alignos.io.git` via the Vercel dashboard or CLI. Every push to `master` SHALL trigger a production deployment.

#### Scenario: Build succeeds on Vercel
- **WHEN** a commit is pushed to the `master` branch
- **THEN** Vercel runs the build command `cd client && npm install && npm run build` and produces output in `client/dist`

#### Scenario: Preview deployment on non-master branch
- **WHEN** a commit is pushed to any branch other than `master`
- **THEN** Vercel creates a preview deployment with a unique URL

### Requirement: vercel.json configures the build
The repository SHALL include a `vercel.json` at the root that specifies `buildCommand`, `outputDirectory`, and `installCommand` targeting the `client/` subdirectory.

#### Scenario: Output directory is correct
- **WHEN** the build completes
- **THEN** Vercel serves static files from `client/dist`

#### Scenario: API functions are included
- **WHEN** the build completes
- **THEN** the `api/` directory at the repo root is recognized by Vercel as Serverless Functions

### Requirement: All Windows-specific deployment artifacts are removed
The repository SHALL NOT contain `deploy.ps1`, `caddy.ps1`, `setup-staging.ps1`, `test_middleware.bat`, or `DEPLOYMENT.md`.

#### Scenario: Clean repo after removal
- **WHEN** the repository is cloned
- **THEN** no PowerShell deployment scripts or Windows-specific config files are present

### Requirement: server/ directory is removed
The `server/` directory, including `index.js`, `package.json`, and `package-lock.json`, SHALL be deleted from the repository.

#### Scenario: No Express server in repo
- **WHEN** the repository is cloned
- **THEN** there is no `server/` directory and no `express`, `mongoose`, `prom-client`, or `http-proxy-middleware` dependencies anywhere in the codebase

### Requirement: AboutView.vue is removed
`client/src/views/AboutView.vue` SHALL be deleted and its route (`/about`) removed from `client/src/router/index.js`.

#### Scenario: /about route is gone
- **WHEN** a user navigates to `/about`
- **THEN** the page renders the SPA fallback (index.html), not the old About view

### Requirement: All hardcoded cosmiccreation.net URL references are made relative
Any URL in the client source that references `https://alignos.cosmiccreation.net/api/` SHALL be updated to a relative path (e.g., `/api/codex-lattice`).

#### Scenario: No hardcoded external domain in client source
- **WHEN** the codebase is searched for `alignos.cosmiccreation.net`
- **THEN** zero matches are found in `client/src/`
