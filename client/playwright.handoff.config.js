import { defineConfig, devices } from '@playwright/test'
import { resolve } from 'node:path'

// Two-site handoff tests against the legacy reader repo; opt-in via `npm run test:e2e:handoff`.
// Everything runs on localhost (not 127.0.0.1) so an already-running reader dev server, whose
// .env.development targets http://localhost:5555, can be reused.
const READER_DIR = resolve(process.env.READER_DIR || '../../alignos/client')
const ALIGNOS = 'http://localhost:5555'

export default defineConfig({
  testDir: './tests/handoff',
  fullyParallel: true,
  use: {
    baseURL: ALIGNOS,
    trace: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev',
      url: ALIGNOS,
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npm run dev',
      cwd: READER_DIR,
      url: 'http://localhost:5556',
      env: { VITE_ALIGNOS_ORIGIN: ALIGNOS, VITE_HANDOFF_MODE: 'prompt' },
      reuseExistingServer: true,
      timeout: 180_000,
    },
    {
      command: 'npx vite --port 5557 --strictPort',
      cwd: READER_DIR,
      url: 'http://localhost:5557',
      env: { VITE_ALIGNOS_ORIGIN: ALIGNOS, VITE_HANDOFF_MODE: 'forward' },
      reuseExistingServer: false,
      timeout: 180_000,
    },
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
