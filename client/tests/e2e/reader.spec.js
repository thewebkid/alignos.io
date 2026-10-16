import { expect, test } from '@playwright/test'

test('home renders the welcome', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByText('Alignos is a field of remembrance.')).toBeVisible()
})

test('search finds a known title', async ({ page }) => {
  await page.goto('/')
  await page.locator('.btn-search').click()
  await page.getByPlaceholder('Search codexes...').fill('When AI Remembers the Field')
  await expect(page.locator('.result-title', { hasText: 'When AI Remembers the Field' })).toBeVisible()
})

test('a glossary term opens its definition', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/codex/when-ai-remembers-the-field')
  const term = page.locator('.codex-content .glossary-term.has-definition[data-term="stillpoint"]').first()
  await expect(term).toBeVisible({ timeout: 60_000 })
  await term.click()
  await expect(page.locator('.glossary-essence')).not.toBeEmpty()
})

test('reading progress survives a reload', async ({ page }) => {
  await page.goto('/codex/when-ai-remembers-the-field')
  await expect(page.locator('.codex-content')).toBeVisible()
  await page.locator('.main-content').evaluate((el) => {
    el.scrollTop = el.scrollHeight
  })
  await expect.poll(() => page.evaluate(() => localStorage.getItem('codex-reading-progress'))).toContain('when-ai-remembers-the-field')
  await page.reload()
  await expect.poll(() => page.locator('.main-content').evaluate((el) => el.scrollTop)).toBeGreaterThan(0)
})
