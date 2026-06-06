import { test as base, expect, type Page } from '@playwright/test'

/**
 * HEROTYPE validation suite — criteria V1–V7 from specs/herotype.spec.md.
 * Runs against the production bundle (see playwright.config.ts). Screenshots are
 * for human review of motion quality; assertions cover DOM/state + a global
 * "zero console errors" guard.
 */

// Fixture: collect console errors + uncaught exceptions for every test (V7 guard).
const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = []
    page.on('console', (m) => {
      if (m.type() === 'error' && !m.text().includes('favicon')) errors.push(m.text())
    })
    page.on('pageerror', (e) => errors.push(String(e)))
    await use(errors)
  },
})

const SHOTS = 'tests/__screenshots__'

async function gotoApp(page: Page) {
  await page.goto('/')
  // first-paint: a real character unit is present
  await expect(page.locator('.u:not(.space)').first()).toBeVisible()
}

/** Count of char units (excludes the inter-word .space units). */
const charUnits = (page: Page) => page.locator('.u:not(.space)')

const PRESET_FONT: Record<string, string> = {
  rise: 'Fraunces',
  kinetic: 'Archivo Black',
  wave: 'Fraunces',
  glitch: 'Space Mono',
  neon: 'Bricolage Grotesque',
  drop: 'Bricolage Grotesque',
}
const NEON_TAGLINES = ['after dark', 'press start', 'night drive', 'high score']

// ---------------------------------------------------------------------------
// V1 — live headline
// ---------------------------------------------------------------------------
test('V1 — typing the headline re-renders and stays empty-safe', async ({ page, errors }) => {
  await gotoApp(page)

  const input = page.getByTestId('headline-input')
  await input.fill('Hello World')
  // "HelloWorld" = 10 non-space chars
  await expect(charUnits(page)).toHaveCount(10)

  await input.fill('Motion')
  await expect(charUnits(page)).toHaveCount(6)

  // empty field must not crash or collapse the stage
  await input.fill('')
  await expect(page.locator('.hero')).toBeVisible()
  await expect(page.getByTestId('headline')).toBeVisible()

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// V3 — the wow beat (run early: it's the protected core beat)
// ---------------------------------------------------------------------------
test('V3 — Generate changes preset + palette + tagline together', async ({ page, errors }) => {
  await gotoApp(page)

  const taglineBefore = await page.getByTestId('tagline').textContent()

  // mood chip "retro neon" → neon preset + neon palette
  await page.getByRole('button', { name: 'retro neon' }).click()

  await expect(page.locator('.preset[data-preset="neon"]')).toHaveClass(/active/)

  const c2 = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--c2').trim(),
  )
  expect(c2).toBe('#ff3df2') // neon palette c2

  const taglineAfter = await page.getByTestId('tagline').textContent()
  expect(taglineAfter).not.toBe(taglineBefore)
  expect(NEON_TAGLINES).toContain(taglineAfter?.trim())

  await expect(page.getByTestId('hint')).toContainText('Neon')
  await expect(page.getByTestId('hint')).toContainText('palette')

  // nonsense phrase → graceful fallback, never a blank stage
  await page.getByTestId('mood-input').fill('zxqw blorptastic')
  await page.getByTestId('generate').click()
  await expect(page.locator('.preset.active')).toHaveCount(1)
  expect(await charUnits(page).count()).toBeGreaterThan(0)

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// V6 — copy code
// ---------------------------------------------------------------------------
test('V6 — copy writes a snippet of the current state and confirms', async ({ page, errors }) => {
  await gotoApp(page)

  await page.getByTestId('copy').click()
  await expect(page.getByTestId('copy')).toContainText('copied')

  const clip = await page.evaluate(() => navigator.clipboard.readText())
  expect(clip).toContain('Make it move.') // default headline
  expect(clip).toContain('Rise') // default preset name

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// V2 — six visibly distinct presets (+ font + loop-stack guard)
// ---------------------------------------------------------------------------
test('V2 — each preset activates, applies its font, and does not stack', async ({ page, errors }) => {
  await gotoApp(page)

  for (const [key, font] of Object.entries(PRESET_FONT)) {
    await page.locator(`.preset[data-preset="${key}"]`).click()
    await expect(page.locator(`.preset[data-preset="${key}"]`)).toHaveClass(/active/)

    const family = await page
      .getByTestId('headline')
      .evaluate((el) => getComputedStyle(el).fontFamily)
    expect(family).toContain(font)

    await page.waitForTimeout(250) // let the in-animation settle for the shot
    await page.screenshot({ path: `${SHOTS}/preset-${key}.png` })
  }

  // rapid re-switch: looping effects (wave/glitch/neon) must not pile up / error
  for (const key of ['wave', 'glitch', 'neon', 'wave', 'glitch', 'neon']) {
    await page.locator(`.preset[data-preset="${key}"]`).click()
  }
  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// V4 — replay
// ---------------------------------------------------------------------------
test('V4 — replay re-runs without reload or leftover tweens', async ({ page, errors }) => {
  await gotoApp(page)
  await page.getByTestId('replay').click()
  await expect(charUnits(page).first()).toBeVisible()
  await page.waitForTimeout(200)
  await page.screenshot({ path: `${SHOTS}/replay.png` })
  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// V5 — tuning sliders (real keyboard input → React onChange)
// ---------------------------------------------------------------------------
test('V5 — speed / stagger / scale visibly change with tracking readouts', async ({ page, errors }) => {
  await gotoApp(page)

  // speed 1.0 → 1.8 (8 × +0.1 steps)
  await page.getByTestId('speed').focus()
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('speed-val')).toHaveText('1.8×')

  // stagger 40ms → 80ms (8 × +5ms steps)
  await page.getByTestId('stagger').focus()
  for (let i = 0; i < 8; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('stagger-val')).toHaveText('80ms')

  // scale 1.0 → 1.3 (6 × +0.05 steps) and the hero transform follows
  await page.getByTestId('scale').focus()
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight')
  await expect(page.getByTestId('scale-val')).toHaveText('1.3×')
  await expect(page.locator('.hero')).toHaveAttribute('style', /scale\(1\.3\)/)

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// V7 — clean load + mobile layout
// ---------------------------------------------------------------------------
test('V7 — loads clean and holds on a narrow viewport', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await gotoApp(page)

  await expect(page.locator('.stage')).toBeVisible()
  await expect(page.locator('.panel')).toBeVisible()

  const noHScroll = await page.evaluate(
    () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
  )
  expect(noHScroll).toBe(true)

  await page.screenshot({ path: `${SHOTS}/mobile.png`, fullPage: true })
  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// F1–F6 — font override
// ---------------------------------------------------------------------------
const fontFamilyOf = (page: Page) =>
  page.getByTestId('headline').evaluate((el) => getComputedStyle(el).fontFamily)

test('F1–F6 — font override applies, reverts, loads on demand, exports, sticks', async ({
  page,
  errors,
}) => {
  await gotoApp(page)
  const select = page.getByTestId('font-select')

  // F1 — default is "Preset default" → the active preset's font (rise = Fraunces)
  await expect(select).toHaveValue('')
  await expect(select.locator('option').first()).toHaveText('Preset default')
  expect(await fontFamilyOf(page)).toContain('Fraunces')

  // F4 — curated, distinct list (serif / display / mono represented)
  expect(await select.locator('option').count()).toBeGreaterThan(10)
  for (const f of ['Playfair Display', 'Anton', 'Major Mono Display']) {
    await expect(select.locator('option', { hasText: f })).toHaveCount(1)
  }

  // F2 — choosing a font applies live, keeping the preset font as fallback
  await select.selectOption('Anton')
  let family = await fontFamilyOf(page)
  expect(family).toContain('Anton')
  expect(family).toContain('Fraunces') // preset fallback retained

  // F3 — the face is fetched on demand (a Google Fonts <link> appears)
  await expect(page.locator('head link[href*="Anton"]')).toHaveCount(1)

  // F5 — export carries the chosen font
  await page.getByTestId('copy').click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Anton')

  // F6 — override is sticky across a preset switch AND a Generate
  await page.locator('.preset[data-preset="wave"]').click()
  expect(await fontFamilyOf(page)).toContain('Anton')
  await page.getByRole('button', { name: 'retro neon' }).click()
  expect(await fontFamilyOf(page)).toContain('Anton')

  // F2 (revert) — "Preset default" clears the override
  await select.selectOption('')
  expect(await fontFamilyOf(page)).not.toContain('Anton')

  expect(errors).toEqual([])
})
