import { expect, test } from '@playwright/test'
import { buildDocument, decodeDocument, encodeDocument } from '../../src/lib/handoff/envelope.js'

const PROGRESS_KEY = 'codex-reading-progress'
const ago = (days) => new Date(Date.now() - days * 86400000).toISOString()
const reading = (fraction, days = 0) => ({ furthest: fraction, position: fraction, lastRead: ago(days) })

// A reader-style handoff: retired ids, the reader's own path as the return path
const readerProgress = {
  'the-codex-of-listening-121': reading(0.42),
  'bridge-between-chords-63': reading(1, 3),
  'not-a-codex-9': reading(0.3, 9)
}

const importPath = async (opts) => `/import#${await encodeDocument(buildDocument({ lattice: 'test', ...opts }))}`

const storedProgress = (page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) || '{}'), PROGRESS_KEY)
const scrollFraction = (page) =>
  page.locator('.main-content').evaluate((el) => el.scrollTop / (el.scrollHeight - el.clientHeight))

const seed = (page, entries) => page.addInitScript((values) => {
  if (sessionStorage.getItem('seeded')) return
  for (const [key, value] of Object.entries(values)) localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
  sessionStorage.setItem('seeded', '1')
}, entries)

test.describe('arriving with a handoff link', () => {
  test('a reader link merges under current ids and shows a summary', async ({ page }) => {
    await page.goto(await importPath({ src: 'reader', progress: readerProgress, to: '/codex/the-codex-of-listening-121' }))

    await expect(page.getByRole('heading', { name: 'Welcome to alignos.io' })).toBeVisible()
    await expect(page.locator('.import-counts')).toHaveText(/1 complete\s*·\s*1 in progress/)
    await expect(page.locator('.import-last')).toContainText('The Codex of Listening')
    await expect(page.locator('.import-note')).toContainText('1 entry')
    expect(page.url()).not.toContain('#')

    const stored = await storedProgress(page)
    expect(Object.keys(stored).sort()).toEqual(['bridge-between-chords', 'the-codex-of-listening'])
    expect(stored['the-codex-of-listening'].furthest).toBe(0.42)
  })

  test('continue reading lands on the page they came from, at their place', async ({ page }) => {
    await page.goto(await importPath({ src: 'reader', progress: readerProgress, to: '/codex/the-codex-of-listening-121' }))
    await page.getByRole('link', { name: 'Continue reading' }).click()

    await expect(page).toHaveURL(/\/codex\/the-codex-of-listening$/)
    await expect.poll(() => scrollFraction(page), { timeout: 15_000 }).toBeCloseTo(0.42, 2)
  })

  test('reloading after arrival imports nothing again', async ({ page }) => {
    await page.goto(await importPath({ src: 'reader', progress: readerProgress }))
    await expect(page.locator('.import-counts')).toBeVisible()
    const before = await storedProgress(page)

    await page.reload()
    await expect(page.getByRole('heading', { name: 'Carry your reading' })).toBeVisible()
    expect(await storedProgress(page)).toEqual(before)
  })

  test('merging never lowers what this device already has', async ({ page }) => {
    await seed(page, { [PROGRESS_KEY]: { 'bridge-between-chords': reading(0.9, 1), 'the-codex-of-listening': reading(0.8, 5) } })
    await page.goto(await importPath({ src: 'reader', progress: readerProgress }))
    await expect(page.locator('.import-counts')).toBeVisible()

    const stored = await storedProgress(page)
    expect(stored['bridge-between-chords'].furthest).toBe(1)
    expect(stored['the-codex-of-listening']).toMatchObject({ furthest: 0.8, position: 0.42 })
  })

  test('a theme already chosen here is kept', async ({ page }) => {
    await seed(page, { 'alignos-theme': 'dark' })
    await page.goto(await importPath({ src: 'reader', progress: readerProgress, theme: 'light' }))
    await expect(page.locator('.import-counts')).toBeVisible()

    expect(await page.evaluate(() => localStorage.getItem('alignos-theme'))).toBe('dark')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('an incoming theme applies when none is saved', async ({ page }) => {
    await page.goto(await importPath({ src: 'reader', progress: readerProgress, theme: 'light' }))
    await expect(page.locator('.import-counts')).toBeVisible()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('with nothing to carry, it goes straight to the return path', async ({ page }) => {
    await page.goto(await importPath({ src: 'reader', progress: {}, to: '/search' }))
    await expect(page).toHaveURL(/\/search$/)
  })

  test('a damaged link changes nothing and says so', async ({ page }) => {
    await seed(page, { [PROGRESS_KEY]: { 'bridge-between-chords': reading(0.5) } })
    const path = await importPath({ src: 'reader', progress: readerProgress })
    await page.goto(path.slice(0, path.length - 40))

    await expect(page.getByRole('alert')).toContainText('Nothing on this device was changed')
    expect(Object.keys(await storedProgress(page))).toEqual(['bridge-between-chords'])
    await expect(page.getByRole('link', { name: 'Go to the Codex Lattice' })).toBeVisible()
  })

  test('a pasted link from another device is added', async ({ page }) => {
    const path = await importPath({ src: 'alignos.io', progress: { 'the-codex-of-listening': reading(0.6) }, to: '/faq' })
    await page.goto('/import')
    await page.getByLabel('Reading link').fill(`https://alignos.io${path}`)
    await page.getByRole('button', { name: 'Add my reading' }).click()

    await expect(page.getByRole('heading', { name: 'Your reading is here' })).toBeVisible()
    await page.getByRole('link', { name: 'Continue reading' }).click()
    await expect(page).toHaveURL(/\/faq$/)
  })
})

test.describe('carrying reading from this device', () => {
  const openCarry = async (page) => {
    await page.locator('button[aria-label="Reading settings"]:visible').click()
    await page.getByRole('button', { name: 'Carry my reading' }).click()
    const dialog = page.getByRole('dialog', { name: 'Carry my reading' })
    await expect(dialog).toBeVisible()
    return dialog
  }

  test('with nothing read yet, there is nothing to carry', async ({ page }) => {
    await page.goto('/lattice')
    const dialog = await openCarry(page)

    await expect(dialog).toContainText('nothing to carry yet')
    await expect(dialog.getByRole('button', { name: 'Copy link' })).toHaveCount(0)
  })

  test('the link carries this device, the page, and opens elsewhere at the same place', async ({ page, browser }) => {
    await seed(page, {
      [PROGRESS_KEY]: { 'the-codex-of-listening': reading(0.42), 'bridge-between-chords': reading(1, 3) },
      'alignos-theme': 'dark'
    })
    await page.goto('/codex/the-codex-of-listening')
    await expect.poll(() => scrollFraction(page), { timeout: 15_000 }).toBeCloseTo(0.42, 2)
    const dialog = await openCarry(page)

    await expect(dialog).toContainText('2 codices')
    await expect(dialog.locator('.carry-qr svg')).toBeVisible()
    const link = await dialog.getByLabel('Reading link').inputValue()
    expect(link).toMatch(/^http:\/\/127\.0\.0\.1:5555\/import#z=/)

    const doc = await decodeDocument(link)
    expect(doc).toMatchObject({ src: 'alignos.io', theme: 'dark', to: '/codex/the-codex-of-listening' })
    expect(Object.keys(doc.progress).sort()).toEqual(['bridge-between-chords', 'the-codex-of-listening'])

    const other = await browser.newPage()
    await other.goto(link)
    await expect(other.getByRole('heading', { name: 'Your reading is here' })).toBeVisible()
    await other.getByRole('link', { name: 'Continue reading' }).click()
    await expect(other).toHaveURL(/\/codex\/the-codex-of-listening$/)
    await expect.poll(() => scrollFraction(other), { timeout: 15_000 }).toBeCloseTo(0.42, 2)
    await expect(other.locator('html')).toHaveAttribute('data-theme', 'dark')
    await other.close()
  })

  test('copy puts the link on the clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write'])
    await seed(page, { [PROGRESS_KEY]: { 'the-codex-of-listening': reading(0.42) } })
    await page.goto('/lattice')
    const dialog = await openCarry(page)

    await dialog.getByRole('button', { name: 'Copy link' }).click()
    await expect(dialog.getByRole('button', { name: 'Copied' })).toBeVisible()
    const copied = await page.evaluate(() => navigator.clipboard.readText())
    expect(copied).toBe(await dialog.getByLabel('Reading link').inputValue())
  })

  test('too much reading for a code still gives a link', async ({ page }) => {
    const many = Object.fromEntries(Array.from({ length: 140 }, (_, i) => [`codex-number-${i}`, reading((i * 37 % 97) / 100, i)]))
    await seed(page, { [PROGRESS_KEY]: many })
    await page.goto('/lattice')
    const dialog = await openCarry(page)

    await expect(dialog).toContainText('too much reading here to fit')
    await expect(dialog.locator('.carry-qr')).toHaveCount(0)
    expect((await dialog.getByLabel('Reading link').inputValue()).length).toBeGreaterThan(1200)
  })
})
