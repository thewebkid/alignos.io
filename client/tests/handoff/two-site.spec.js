import { expect, test } from '@playwright/test'

// The legacy reader (prompt mode on 5556, forward mode on 5557) handing off to alignos.io on 5555
const READER = 'http://localhost:5556'
const FORWARD_READER = 'http://localhost:5557'
const PROGRESS_KEY = 'codex-reading-progress'

const ago = (days) => new Date(Date.now() - days * 86400000).toISOString()
const legacy = (percent, days = 0) => ({ scrollPercent: percent, scrollPosition: percent * 120, lastRead: ago(days) })

// Seeds an origin's localStorage once per test, before any of its scripts run
const seedOrigin = (page, origin, entries) => page.addInitScript(({ origin, entries }) => {
  if (location.origin !== origin || sessionStorage.getItem('seeded')) return
  for (const [key, value] of Object.entries(entries)) localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  sessionStorage.setItem('seeded', '1')
}, { origin, entries })

const storedProgress = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), PROGRESS_KEY)
const scrollFraction = (page) =>
  page.locator('.main-content').evaluate((el) => el.scrollTop / (el.scrollHeight - el.clientHeight))

test('the first-visit dialog carries reader progress to alignos.io under current ids', async ({ page }) => {
  await seedOrigin(page, READER, {
    [PROGRESS_KEY]: {
      'the-codex-of-listening-121': legacy(42),
      'bridge-between-chords-63': legacy(100, 2),
      'the-codex-of-the-interbeing-lattice-42': legacy(97, 5)
    },
    'alignos-theme': 'dark'
  })
  await page.goto(`${READER}/codex/the-codex-of-listening-121`)

  const dialog = page.getByRole('dialog', { name: 'Alignos has a new home' })
  await expect(dialog).toContainText('read 3 codices here, 2 to the end')
  await dialog.getByRole('link', { name: /Take my reading to/ }).click()

  await expect(page).toHaveURL(/localhost:5555\/import$/)
  await expect(page.getByRole('heading', { name: 'Welcome to alignos.io' })).toBeVisible()
  await expect(page.locator('.import-counts')).toHaveText(/2 complete\s*·\s*1 in progress/)
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')

  const stored = await storedProgress(page)
  expect(Object.keys(stored).sort()).toEqual(['bridge-between-chords', 'the-codex-of-listening', 'the-codex-of-the-interbeing-lattice'])
  expect(stored['the-codex-of-listening'].furthest).toBe(0.42)

  await page.getByRole('link', { name: 'Continue reading' }).click()
  await expect(page).toHaveURL(/localhost:5555\/codex\/the-codex-of-listening$/)
  await expect.poll(() => scrollFraction(page), { timeout: 15_000 }).toBeCloseTo(0.42, 2)
})

test('carrying again after more reading combines both sides and lowers nothing', async ({ page }) => {
  await seedOrigin(page, READER, { [PROGRESS_KEY]: { 'the-codex-of-listening-121': legacy(30, 1) } })
  await page.goto(READER)
  await page.getByRole('dialog').getByRole('link', { name: /Take my reading to/ }).click()
  await expect(page.locator('.import-counts')).toBeVisible()

  // Read further on alignos.io, and a little more (but less far) back on the reader
  await page.evaluate((key) => {
    const progress = JSON.parse(localStorage.getItem(key))
    progress['the-codex-of-listening'] = { furthest: 0.7, position: 0.7, lastRead: new Date(Date.now() - 3600_000).toISOString() }
    localStorage.setItem(key, JSON.stringify(progress))
  }, PROGRESS_KEY)

  await page.goto(READER)
  await page.evaluate(({ key, at }) => {
    localStorage.setItem(key, JSON.stringify({
      'the-codex-of-listening-121': { scrollPercent: 55, scrollPosition: 900, lastRead: at },
      'bridge-between-chords-63': { scrollPercent: 20, scrollPosition: 300, lastRead: at }
    }))
  }, { key: PROGRESS_KEY, at: new Date().toISOString() })
  await page.reload()

  const banner = page.getByRole('complementary', { name: 'Alignos has moved' })
  await expect(banner).toBeVisible()
  await banner.getByRole('link', { name: /Take my reading there/ }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to alignos.io' })).toBeVisible()

  const stored = await storedProgress(page)
  expect(stored['the-codex-of-listening']).toMatchObject({ furthest: 0.7, position: 0.55 })
  expect(stored['bridge-between-chords'].furthest).toBe(0.2)
})

test('declining the dialog leaves a banner on the next visit that hides for the session', async ({ page, context }) => {
  await page.goto(READER)
  const dialog = page.getByRole('dialog', { name: 'Alignos has a new home' })
  await expect(dialog).toContainText('now lives at localhost:5555')
  await dialog.getByRole('button', { name: 'Not now' }).click()
  await expect(dialog).toBeHidden()
  await expect(page.getByRole('complementary', { name: 'Alignos has moved' })).toHaveCount(0)

  // A later visit is a new session: sessionStorage is per tab
  const later = await context.newPage()
  await later.goto(READER)
  const banner = later.getByRole('complementary', { name: 'Alignos has moved' })
  await expect(banner).toBeVisible()
  await expect(later.getByRole('dialog')).toHaveCount(0)
  await banner.getByRole('button', { name: 'Hide for now' }).click()
  await later.reload()
  await expect(later.locator('.app-container')).toBeVisible()
  // The banner is client-only and appears after the link is built; give it the chance to show
  await later.waitForTimeout(1000)
  await expect(banner).toHaveCount(0)
})

test('forward mode sends every visit to alignos.io with progress merged', async ({ page }) => {
  await seedOrigin(page, FORWARD_READER, { [PROGRESS_KEY]: { 'bridge-between-chords-63': legacy(64) } })
  await page.goto(`${FORWARD_READER}/codex/bridge-between-chords-63`)

  await expect(page).toHaveURL(/localhost:5555\/import$/, { timeout: 15_000 })
  await expect(page.getByRole('heading', { name: 'Welcome to alignos.io' })).toBeVisible()
  expect((await storedProgress(page))['bridge-between-chords'].furthest).toBe(0.64)

  await page.getByRole('link', { name: 'Continue reading' }).click()
  await expect(page).toHaveURL(/localhost:5555\/codex\/bridge-between-chords$/)
})
