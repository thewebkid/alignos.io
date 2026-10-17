import { expect, test } from '@playwright/test'

const ATKINSON = {
  font: 'atkinson',
  fontStack: "'Atkinson Hyperlegible Next', system-ui, sans-serif",
  fontHref: 'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible+Next:ital,wght@0,200..800;1,200..800&display=swap'
}
const GEORGIA = { font: 'georgia', fontStack: "Georgia, 'Times New Roman', serif", fontHref: null }

const withReading = (page, reading) => page.addInitScript((value) => {
  localStorage.setItem('alignos-reading', JSON.stringify(value))
}, reading)

const px = (page, selector) => page.locator(selector).first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize))
const family = (page, selector) => page.locator(selector).first().evaluate((el) => getComputedStyle(el).fontFamily)

const latticeSizes = async (page) => {
  await page.goto('/lattice')
  return {
    subtitle: await px(page, '.hero-subtitle'),
    filter: await px(page, '.filter-label'),
    nav: await px(page, 'header .nav-link'),
    footer: await px(page, '.quote-text')
  }
}

test('the largest text size reaches the whole page', async ({ page, browser }) => {
  const base = await latticeSizes(page)

  const large = await browser.newPage()
  await withReading(large, { scale: 1.25 })
  const scaled = await latticeSizes(large)

  for (const key of Object.keys(base)) {
    expect(scaled[key], key).toBeCloseTo(base[key] * 1.25, 0)
  }
  await large.close()
})

test('codex text is scaled once, not twice', async ({ page }) => {
  await withReading(page, { scale: 1.25 })
  await page.goto('/codex/when-ai-remembers-the-field')
  await expect(page.locator('.codex-content')).toBeVisible()
  // 1.125rem at a 1.25 root is 22.5px; scaling twice would be about 28px
  expect(await px(page, '.codex-content')).toBeCloseTo(22.5, 1)
})

test('the default body font is Source Sans 3', async ({ page }) => {
  await page.goto('/lattice')
  expect(await family(page, 'body')).toContain('Source Sans 3')
  expect(await family(page, '.filter-label')).toContain('Source Sans 3')
  expect(await family(page, '.hero-title')).toContain('Cormorant Garamond')
})

test('the reading font is the body font; headings keep the serif', async ({ page }) => {
  await withReading(page, ATKINSON)
  await page.goto('/lattice')
  expect(await family(page, 'header .nav-link')).toContain('Atkinson Hyperlegible Next')
  expect(await family(page, '.filter-label')).toContain('Atkinson Hyperlegible Next')
  expect(await family(page, '.hero-subtitle')).toContain('Atkinson Hyperlegible Next')
  expect(await family(page, '.hero-title')).toContain('Cormorant Garamond')
})

test('headings keep their size when the reading font changes', async ({ page, browser }) => {
  const headingMetrics = async (p) => {
    await p.goto('/lattice')
    await p.evaluate(() => document.fonts.load('500 48px "Cormorant Garamond"'))
    return p.locator('.hero-title').evaluate((el) => {
      const range = document.createRange()
      range.selectNodeContents(el)
      return { adjust: getComputedStyle(el).fontSizeAdjust, width: Math.round(range.getBoundingClientRect().width) }
    })
  }

  const base = await headingMetrics(page)

  const georgia = await browser.newPage()
  await withReading(georgia, GEORGIA)
  const changed = await headingMetrics(georgia)

  expect(changed.adjust).toBe('none')
  expect(changed.width).toBe(base.width)
  await georgia.close()
})

// In dev, Vite injects CSS from JS, so this checks the part index.html owns: the head script sets
// the scale before the body renders, and the root picks it up once styles load
test('a saved size is applied from the head script', async ({ page }) => {
  await withReading(page, { scale: 1.25 })
  await page.goto('/faq', { waitUntil: 'domcontentloaded' })
  expect(await page.evaluate(() => document.documentElement.style.getPropertyValue('--cl-reading-scale'))).toBe('1.25')
  await expect.poll(() => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize))).toBeCloseTo(20, 1)
})
