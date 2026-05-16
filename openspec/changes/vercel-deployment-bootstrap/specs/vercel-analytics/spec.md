## ADDED Requirements

### Requirement: Vercel Analytics is integrated in the Vue client
The client application SHALL include `@vercel/analytics` and call its `inject()` function on client-side mount, replacing the self-hosted Umami proxy (`/stats/*`).

#### Scenario: Analytics loads in production
- **WHEN** a user visits any page on the deployed Vercel site
- **THEN** the Vercel Analytics script fires pageview events visible in the Vercel Analytics dashboard

#### Scenario: Analytics does not error in development
- **WHEN** the app runs locally via `npm run dev`
- **THEN** the analytics `inject()` call is a no-op or silently suppressed (Vercel Analytics SDK handles this automatically)

### Requirement: Umami proxy is removed from vite.config.js
The `server.proxy` configuration in `client/vite.config.js` SHALL NOT include a `/stats` proxy entry.

#### Scenario: Dev server starts without /stats proxy
- **WHEN** `npm run dev` is run in the `client/` directory
- **THEN** the Vite dev server starts successfully with no proxy configuration for `/stats`

### Requirement: Umami script tag is removed from HTML
Any `<script>` tag or `src` reference to `/stats/script.js` or `umami` SHALL be removed from `client/index.html` and all Vue component templates.

#### Scenario: No Umami script in built output
- **WHEN** the production build is inspected
- **THEN** no reference to `/stats/script.js` or `umami` appears in the output HTML
