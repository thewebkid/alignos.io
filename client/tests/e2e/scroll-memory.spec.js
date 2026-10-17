import { expect, test } from '@playwright/test'

const CODEX = 'when-ai-remembers-the-field'
const HARMONIC = 'the-codices-of-harmonic-activation'

const main = (page) => page.locator('.main-content')
const scrollTop = (page) => main(page).evaluate((el) => Math.round(el.scrollTop))
const scrollTo = (page, top) => main(page).evaluate((el, t) => { el.scrollTop = t }, top)
const scrollFraction = (page) => main(page).evaluate((el) => el.scrollTop / (el.scrollHeight - el.clientHeight))
const reading = (fraction) => ({ furthest: fraction, position: fraction, lastRead: new Date().toISOString() })
const progressEntry = (page, id) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem('codex-reading-progress') || '{}')[key] ?? null, id)

// Seeds localStorage once per test (init scripts run again on reload)
const seed = (page, entries) => page.addInitScript((values) => {
  if (sessionStorage.getItem('seeded')) return
  for (const [key, value] of Object.entries(values)) localStorage.setItem(key, JSON.stringify(value))
  sessionStorage.setItem('seeded', '1')
}, entries)

const headerLink = (page, name) => page.locator('header').getByRole('link', { name, exact: true })

// Clicks a visible codex card without Playwright scrolling it into view (which would move the lattice)
const openVisibleCard = (page) => page.locator('.grid-section a[href^="/codex/"]').evaluateAll((links) => {
  const main = document.querySelector('.main-content').getBoundingClientRect()
  const link = links.find((a) => {
    const r = a.getBoundingClientRect()
    return r.height > 0 && r.top >= main.top && r.bottom <= main.bottom
  })
  link.click()
})

const scopeToggle = (page) => page.locator('.filter-dropdown--scope .filter-toggle')
const progressToggle = (page) => page.locator('.filter-dropdown:not(.filter-dropdown--scope) .filter-toggle')

const chooseScope = async (page, label) => {
  await scopeToggle(page).click()
  await page.locator('.filter-menu .dropdown-item', { hasText: label }).first().click()
}

const chooseProgress = async (page, label) => {
  await progressToggle(page).click()
  await page.locator('.filter-menu .dropdown-item', { hasText: label }).first().click()
}

test.describe('pages start at the top', () => {
  test('standard page to standard page', async ({ page }) => {
    await page.goto('/faq')
    await scrollTo(page, 600)
    expect(await scrollTop(page)).toBeGreaterThan(0)

    await headerLink(page, 'Papers').click()
    await expect(page).toHaveURL(/\/papers$/)
    await expect.poll(() => scrollTop(page)).toBe(0)
  })

  test('threshold page to threshold page', async ({ page }) => {
    await page.goto('/between-worlds')
    await scrollTo(page, 600)
    expect(await scrollTop(page)).toBeGreaterThan(0)

    await page.locator('header').getByRole('button', { name: 'Return Rooms' }).click()
    await page.locator('header').getByRole('menuitem', { name: 'The Arc of Difference' }).click()
    await expect(page).toHaveURL(/\/arc-of-difference$/)
    await expect.poll(() => scrollTop(page)).toBe(0)
  })

  test('back to a page starts at the top', async ({ page }) => {
    await page.goto('/faq')
    await scrollTo(page, 600)
    await headerLink(page, 'Papers').click()
    await expect(page).toHaveURL(/\/papers$/)

    await page.goBack()
    await expect(page).toHaveURL(/\/faq$/)
    await expect.poll(() => scrollTop(page)).toBe(0)
  })
})

test.describe('codex resume rule', () => {
  test('a never-opened codex opens at the top', async ({ page }) => {
    await page.goto('/lattice')
    await scrollTo(page, 900)
    await openVisibleCard(page)
    await expect(page.locator('.codex-content')).toBeVisible()
    await page.waitForTimeout(800)
    expect(await scrollTop(page)).toBe(0)
  })

  test('a partly read codex resumes where it was left', async ({ page }) => {
    await seed(page, { 'codex-reading-progress': { [CODEX]: reading(0.4) } })
    await page.goto(`/codex/${CODEX}`)
    await expect.poll(() => scrollFraction(page), { timeout: 15_000 }).toBeCloseTo(0.4, 2)
  })

  test('a partly read codex resumes from the Continue reading shelf', async ({ page }) => {
    await seed(page, { 'codex-reading-progress': { [CODEX]: reading(0.4) } })
    await page.goto('/lattice')
    await page.locator(`.continue-shelf a[href="/codex/${CODEX}"]`).first().click()
    await expect(page).toHaveURL(new RegExp(`/codex/${CODEX}$`))
    await expect.poll(() => scrollFraction(page), { timeout: 15_000 }).toBeCloseTo(0.4, 2)
  })

  test('progress saved in pixels resumes from its furthest point', async ({ page }) => {
    await seed(page, { 'codex-reading-progress': { [CODEX]: { scrollPercent: 40, scrollPosition: 1500, lastRead: new Date().toISOString() } } })
    await page.goto(`/codex/${CODEX}`)
    await expect.poll(() => scrollFraction(page), { timeout: 15_000 }).toBeCloseTo(0.4, 2)
  })

  test('a larger text size resumes at the same place in the codex', async ({ page }) => {
    await seed(page, {
      'codex-reading-progress': { [CODEX]: reading(0.5) },
      'alignos-reading': { font: 'source-sans', scale: 1.25, glossary: 'always', pace: 'typical' }
    })
    await page.goto(`/codex/${CODEX}`)
    await expect.poll(() => scrollFraction(page), { timeout: 15_000 }).toBeCloseTo(0.5, 2)
  })

  test('a finished codex opens at the top', async ({ page }) => {
    await seed(page, { 'codex-reading-progress': { [CODEX]: reading(1) } })
    await page.goto(`/codex/${CODEX}`)
    await expect(page.locator('.codex-content')).toBeVisible()
    await page.waitForTimeout(1500)
    expect(await scrollTop(page)).toBe(0)
  })

  test('next in a series opens at the top and records nothing until scrolled', async ({ page }) => {
    await page.goto('/codex/the-codex-of-living-harmonics')
    await expect(page.locator('.codex-content')).toBeVisible()
    await scrollTo(page, 1200)
    await expect.poll(() => progressEntry(page, 'the-codex-of-living-harmonics')).not.toBeNull()

    await page.locator('.series-link.next').click()
    await expect(page).toHaveURL(/the-codex-of-resonant-action$/)
    await expect(page.locator('.codex-content')).toBeVisible()
    await page.waitForTimeout(1000)
    expect(await scrollTop(page)).toBe(0)
    expect(await progressEntry(page, 'the-codex-of-resonant-action')).toBeNull()
  })
})

test.describe('lattice memory', () => {
  test('returning through the header restores scope, progress filter, and scroll', async ({ page }) => {
    await page.goto('/lattice')
    await chooseScope(page, 'The Architecture of Love')
    await chooseProgress(page, 'Unread')
    await expect(page).toHaveURL(/series=the-architecture-of-love/)
    await scrollTo(page, 450)

    await openVisibleCard(page)
    await expect(page.locator('.codex-content')).toBeVisible()

    await headerLink(page, 'Codex Lattice').click()
    await expect(page).toHaveURL(/\/lattice\?series=the-architecture-of-love$/)
    await expect(scopeToggle(page)).toContainText('The Architecture of Love')
    await expect(progressToggle(page)).toContainText('Unread')
    await expect.poll(() => scrollTop(page)).toBe(450)
  })

  test('survives a reload', async ({ page }) => {
    await page.goto('/lattice')
    await chooseScope(page, 'The Architecture of Love')
    await chooseProgress(page, 'Unread')
    await scrollTo(page, 450)
    await page.waitForTimeout(400)

    await page.reload()
    await expect(scopeToggle(page)).toContainText('The Architecture of Love')
    await expect(progressToggle(page)).toContainText('Unread')
    await expect.poll(() => scrollTop(page)).toBe(450)
  })

  test('browser back to a scoped lattice restores progress and scroll', async ({ page }) => {
    await page.goto(`/lattice?series=${HARMONIC}`)
    await chooseProgress(page, 'Unread')
    await scrollTo(page, 300)
    await openVisibleCard(page)
    await expect(page.locator('.codex-content')).toBeVisible()

    await page.goBack()
    await expect(page).toHaveURL(new RegExp(`series=${HARMONIC}`))
    await expect(progressToggle(page)).toContainText('Unread')
    await expect.poll(() => scrollTop(page)).toBe(300)
  })

  test('the reader series link opens a fresh corridor', async ({ page }) => {
    await seed(page, { 'lattice-state': { scope: { kind: 'series', id: HARMONIC }, progress: 'complete', scrollTop: 600 } })
    await page.goto('/codex/the-codex-of-the-spiral')
    await page.locator('.context-series').click()
    await expect(page).toHaveURL(new RegExp(`/lattice\\?series=${HARMONIC}$`))
    await expect(progressToggle(page)).toContainText('Any progress')
    await expect(page.locator('.corridor-title')).toHaveText('The Codices of Harmonic Activation')
    await page.waitForTimeout(300)
    expect(await scrollTop(page)).toBe(0)
  })

  test('a deep link to a different scope replaces the memory', async ({ page }) => {
    await seed(page, { 'lattice-state': { scope: { kind: 'series', id: HARMONIC }, progress: 'complete', scrollTop: 600 } })
    await page.goto('/lattice?collection=papers')
    await expect(page.locator('.corridor-title')).toHaveText('Papers')
    await expect(progressToggle(page)).toContainText('Any progress')
    await page.waitForTimeout(300)
    expect(await scrollTop(page)).toBe(0)
  })

  test('the reset control appears only when filtered and clears both filters', async ({ page }) => {
    await page.goto('/lattice')
    const reset = page.getByRole('button', { name: 'Reset filters' })
    await expect(reset).toHaveCount(0)

    await chooseScope(page, 'Realized Flame')
    await chooseProgress(page, 'Unread')
    await expect(reset).toBeVisible()

    await reset.click()
    await expect(reset).toHaveCount(0)
    await expect(scopeToggle(page)).toContainText('Everything')
    await expect(progressToggle(page)).toContainText('Any progress')
    await expect(page).toHaveURL(/\/lattice$/)
  })
})

test.describe('filter changes never move the bar', () => {
  const barTop = (page) => page.locator('.filter-section').evaluate((el) => Math.round(el.getBoundingClientRect().top))

  test('a docked bar stays docked for small and empty results', async ({ page }) => {
    await page.goto('/lattice')
    await scrollTo(page, 2000)
    const docked = await barTop(page)

    await chooseScope(page, 'InterBeing Glossary Series')
    await expect(page.locator('.corridor-title')).toHaveText('InterBeing Glossary Series')
    expect(await barTop(page)).toBe(docked)
    await expect(page.locator('.corridor-header')).toBeInViewport()

    await chooseProgress(page, 'Complete')
    await expect(page.locator('.empty-state')).toBeVisible()
    expect(await barTop(page)).toBe(docked)
    await expect(page.locator('.empty-state')).toBeInViewport()
  })

  test('an undocked bar and the scroll position stay put', async ({ page }) => {
    await page.goto('/lattice')
    await scrollTo(page, 100)
    const before = { top: await barTop(page), scroll: await scrollTop(page) }

    await chooseProgress(page, 'Unread')
    await expect(progressToggle(page)).toContainText('Unread')
    expect({ top: await barTop(page), scroll: await scrollTop(page) }).toEqual(before)
  })
})
