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
test('V3 — Generate (AI) applies effect + colours + tagline, with fallback', async ({
  page,
  errors,
}) => {
  // Part A — AI path. Mock /api/style with a deterministic StyleResult (no key
  // needed in CI; mirrors production where the function returns 200).
  await page.route('**/api/style', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        effect: 'neon',
        font: 'Anton',
        weight: 700,
        colors: { canvas: '#0c0414', c1: '#fef0ff', c2: '#ff3df2', c3: '#3df2ff' },
        speed: 1,
        headline: 'NEON DREAMS',
        tagline: 'after dark',
        reasoning: 'retro synth glow',
      }),
    }),
  )
  await gotoApp(page)

  // Tweak a setting first — a new style description must reset it to default.
  await page.getByTestId('scale').focus()
  for (let i = 0; i < 6; i++) await page.keyboard.press('ArrowRight') // scale → 1.3×
  await expect(page.getByTestId('scale-val')).toHaveText('1.3×')

  const taglineBefore = await page.getByTestId('tagline').textContent()
  await page.getByRole('button', { name: 'retro neon' }).click()

  await expect(page.locator('.preset[data-preset="neon"]')).toHaveClass(/active/)

  // AI writes a fresh headline + tagline
  await expect(page.getByTestId('headline-input')).toHaveValue('NEON DREAMS')
  const taglineAfter = await page.getByTestId('tagline').textContent()
  expect(taglineAfter).not.toBe(taglineBefore)
  expect(taglineAfter?.trim()).toBe('after dark')

  const c2 = await page.evaluate(() =>
    getComputedStyle(document.documentElement).getPropertyValue('--c2').trim(),
  )
  expect(c2).toBe('#ff3df2') // AI-generated accent

  // settings reset on a new description: scale is back to its default
  await expect(page.getByTestId('scale-val')).toHaveText('1.0×')

  await expect(page.getByTestId('hint')).toContainText('Neon')
  await expect(page.getByTestId('hint')).toContainText('retro synth glow') // AI reasoning

  // Part B — fallback path. Make the endpoint fail; Generate must still apply a
  // valid preset via the local keyword parser and never blank the stage.
  await page.unroute('**/api/style')
  await page.route('**/api/style', (route) => route.fulfill({ status: 500, body: '{}' }))
  await page.getByTestId('mood-input').fill('zxqw blorptastic')
  await page.getByTestId('generate').click()
  await expect(page.getByTestId('hint')).toContainText('offline') // fallback marker
  await expect(page.locator('.preset.active')).toHaveCount(1)
  expect(await charUnits(page).count()).toBeGreaterThan(0)

  // The deliberate 500 logs a resource-load error; everything else must be clean.
  expect(errors.filter((e) => !e.includes('Failed to load resource'))).toEqual([])
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
// V2 — six visibly distinct presets (+ loop-stack guard). Font is independent
// of the effect now, so this no longer asserts a per-preset typeface.
// ---------------------------------------------------------------------------
test('V2 — each preset activates and does not stack', async ({ page, errors }) => {
  await gotoApp(page)

  for (const key of ['rise', 'kinetic', 'wave', 'glitch', 'neon', 'drop']) {
    await page.locator(`.preset[data-preset="${key}"]`).click()
    await expect(page.locator(`.preset[data-preset="${key}"]`)).toHaveClass(/active/)
    await page.waitForTimeout(250) // let the in-animation settle for the shot
    await page.screenshot({ path: `${SHOTS}/preset-${key}.png` })
  }

  // rapid re-switch: looping effects (wave/glitch/neon) must not pile up / error
  for (const key of ['wave', 'glitch', 'neon', 'wave', 'glitch', 'neon']) {
    await page.locator(`.preset[data-preset="${key}"]`).click()
  }
  expect(errors).toEqual([])
})

// Font is independent of the effect: switching presets must NOT change the typeface.
test('Font does not change when the effect changes', async ({ page, errors }) => {
  await gotoApp(page)
  const familyOf = () =>
    page.getByTestId('headline').evaluate((el) => getComputedStyle(el).fontFamily)

  await page.getByTestId('font-select').selectOption('Anton')
  const before = await familyOf()
  expect(before).toContain('Anton')

  for (const key of ['kinetic', 'glitch', 'wave', 'drop', 'rise']) {
    await page.locator(`.preset[data-preset="${key}"]`).click()
    expect(await familyOf()).toBe(before) // unchanged by the effect switch
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

  // F1 — default value renders the app default font (Fraunces), preset-independent
  await expect(select).toHaveValue('')
  await expect(select.locator('option').first()).toHaveText('Default (Fraunces)')
  expect(await fontFamilyOf(page)).toContain('Fraunces')

  // F4 — curated, distinct list (serif / display / mono represented)
  expect(await select.locator('option').count()).toBeGreaterThan(10)
  for (const f of ['Playfair Display', 'Anton', 'Major Mono Display']) {
    await expect(select.locator('option', { hasText: f })).toHaveCount(1)
  }

  // F2 — choosing a font applies live
  await select.selectOption('Anton')
  const family = await fontFamilyOf(page)
  expect(family).toContain('Anton')

  // F3 — the face is fetched on demand (a Google Fonts <link> appears)
  await expect(page.locator('head link[href*="Anton"]')).toHaveCount(1)

  // F5 — export carries the chosen font
  await page.getByTestId('copy').click()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('Anton')

  // F2 (revert) — "Preset default" clears the override
  await select.selectOption('')
  expect(await fontFamilyOf(page)).not.toContain('Anton')

  // F6 — override is sticky across a preset switch...
  await select.selectOption('Anton')
  await page.locator('.preset[data-preset="wave"]').click()
  expect(await fontFamilyOf(page)).toContain('Anton')

  // ...but a new style description resets ALL settings, font included.
  await page.route('**/api/style', (route) => route.fulfill({ status: 500, body: '{}' }))
  await page.getByRole('button', { name: 'retro neon' }).click()
  await expect(page.getByTestId('hint')).toContainText('offline')
  await expect(select).toHaveValue('') // font reset to default
  expect(await fontFamilyOf(page)).not.toContain('Anton')

  // The deliberate 500 logs a resource-load error; everything else must be clean.
  expect(errors.filter((e) => !e.includes('Failed to load resource'))).toEqual([])
})

// ---------------------------------------------------------------------------
// C1–C6 — selectable colors
// ---------------------------------------------------------------------------
const cssVars = (page: Page) =>
  page.evaluate(() => {
    const s = getComputedStyle(document.documentElement)
    return {
      canvas: s.getPropertyValue('--canvas').trim(),
      c1: s.getPropertyValue('--c1').trim(),
      c2: s.getPropertyValue('--c2').trim(),
      c3: s.getPropertyValue('--c3').trim(),
    }
  })

test('C1–C6 — colors are selectable, seed from palettes, go custom, and export', async ({
  page,
  errors,
}) => {
  await gotoApp(page)

  // C1 — four colour inputs present with hex values
  for (const id of ['font-color', 'effect-color-1', 'effect-color-2', 'bg-color']) {
    await expect(page.getByTestId(id)).toHaveValue(/^#[0-9a-f]{6}$/)
  }

  // C6 — default load is the ember palette (no regression)
  expect((await cssVars(page)).c1).toBe('#f4f1ea')

  // C2 — a palette seeds all pickers and marks itself active
  await page.locator('.sw[data-palette="ink"]').click()
  await expect(page.getByTestId('font-color')).toHaveValue('#f0f4f8')
  await expect(page.locator('.sw[data-palette="ink"]')).toHaveClass(/active/)

  // C2 (cont) — tweaking a channel → "Custom" (no swatch active)
  await page.getByTestId('font-color').fill('#00ff88')
  await expect(page.locator('.sw.active')).toHaveCount(0)
  await expect(page.locator('.custom-tag')).toBeVisible()
  expect((await cssVars(page)).c1).toBe('#00ff88')

  // C3 — live recolour of background and effect 1
  await page.getByTestId('bg-color').fill('#123456')
  expect((await cssVars(page)).canvas).toBe('#123456')
  await page.getByTestId('effect-color-1').fill('#abcdef')
  expect((await cssVars(page)).c2).toBe('#abcdef')

  // C4 — second accent (--c3) is wired (assert the var; the live Glitch tween
  // colour is a screenshot/eyeball concern)
  await page.locator('.preset[data-preset="glitch"]').click()
  await page.getByTestId('effect-color-2').fill('#00ffff')
  expect((await cssVars(page)).c3).toBe('#00ffff')

  // C5 — export reflects the actual colours on screen
  await page.getByTestId('copy').click()
  const clip = await page.evaluate(() => navigator.clipboard.readText())
  expect(clip).toContain('#123456') // background
  expect(clip).toContain('#00ffff') // secondary accent

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// D1–D6 — Draw effect (self-drawing glyph outlines)
// ---------------------------------------------------------------------------
const drawPaths = (page: Page) => page.locator('svg.draw-svg path.glyph')

test('D1–D6 — Draw renders SVG outlines, follows the font, toggles fill, themes by palette', async ({
  page,
  errors,
}) => {
  await gotoApp(page)

  // D1 — selecting Draw renders an SVG outline layer (not the .u spans)
  await page.locator('.preset[data-preset="draw"]').click()
  await expect(page.locator('svg.draw-svg')).toBeVisible()
  await expect(drawPaths(page).first()).toBeVisible()
  await expect(charUnits(page)).toHaveCount(0) // distinct from the span renderer

  // D2 — drawn shapes follow the picked font (path data changes) …
  const dDefault = await drawPaths(page).first().getAttribute('d')
  await page.getByTestId('font-select').selectOption('Pacifico')
  await page.waitForFunction(
    (prev) => {
      const el = document.querySelector('svg.draw-svg path.glyph')
      return !!el && el.getAttribute('d') !== prev
    },
    dDefault,
  )
  // … and follow the headline (one glyph path per non-space char)
  await page.getByTestId('headline-input').fill('Motion')
  await expect(drawPaths(page)).toHaveCount(6)

  // D6 — stroke colour comes from the palette --c1 var; a palette swap recolours
  const strokeBefore = await drawPaths(page).first().evaluate((e) => getComputedStyle(e).stroke)
  await page.locator('.sw[data-palette="ink"]').click()
  await expect
    .poll(() => drawPaths(page).first().evaluate((e) => getComputedStyle(e).stroke))
    .not.toBe(strokeBefore)

  // D4 — fill/outline toggle is visible for Draw and flips the active state
  const toggle = page.getByTestId('draw-fill')
  await expect(toggle).toBeVisible()
  await toggle.getByText('Outline').click()
  await expect(toggle.getByText('Outline')).toHaveClass(/active/)
  await expect(toggle.getByText('Fill')).not.toHaveClass(/active/)
  await toggle.getByText('Fill').click()
  await expect(toggle.getByText('Fill')).toHaveClass(/active/)

  // D5 — switching away returns the span renderer with no orphaned SVG; an empty
  // headline does not crash the stage
  await page.locator('.preset[data-preset="rise"]').click()
  await expect(page.locator('svg.draw-svg')).toHaveCount(0)
  await expect(charUnits(page).first()).toBeVisible()
  await expect(page.getByTestId('draw-fill')).toHaveCount(0) // toggle hidden off-draw
  await page.locator('.preset[data-preset="draw"]').click()
  await page.getByTestId('headline-input').fill('')
  await expect(page.locator('.hero')).toBeVisible()

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// Sub line (editable tagline) + text alignment
// ---------------------------------------------------------------------------
test('Sub line is editable and alignment switches left/center/right', async ({ page, errors }) => {
  await gotoApp(page)

  // Sub line: default value + live edit reflects in the rendered tagline
  const tagInput = page.getByTestId('tagline-input')
  await expect(tagInput).toHaveValue('static is boring')
  await tagInput.fill('shipped at 3am')
  await expect(page.getByTestId('tagline')).toHaveText('shipped at 3am')

  // Alignment: default centre, then left, then right — .hero inline style follows
  await expect(page.locator('.hero')).toHaveAttribute('style', /text-align:\s*center/)

  await page.getByTestId('align').locator('[data-align="left"]').click()
  await expect(page.getByTestId('align').locator('[data-align="left"]')).toHaveClass(/active/)
  await expect(page.locator('.hero')).toHaveAttribute('style', /text-align:\s*left/)

  await page.getByTestId('align').locator('[data-align="right"]').click()
  await expect(page.locator('.hero')).toHaveAttribute('style', /text-align:\s*right/)

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// Font weight selector
// ---------------------------------------------------------------------------
test('Weight selector overrides the preset font-weight and reverts', async ({ page, errors }) => {
  await gotoApp(page)

  const weightOf = () =>
    page.getByTestId('headline').evaluate((el) => getComputedStyle(el).fontWeight)

  // default rise preset weight is 600
  await expect(page.getByTestId('weight-select')).toHaveValue('0')
  expect(await weightOf()).toBe('600')

  // override → 900
  await page.getByTestId('weight-select').selectOption('900')
  expect(await weightOf()).toBe('900')

  // revert → preset default (600)
  await page.getByTestId('weight-select').selectOption('0')
  expect(await weightOf()).toBe('600')

  expect(errors).toEqual([])
})

// ---------------------------------------------------------------------------
// Copy code exports FULL, runnable, self-contained HTML
// ---------------------------------------------------------------------------
test('Copy code exports a self-contained, runnable hero', async ({ page, errors }) => {
  await gotoApp(page)
  await page.locator('.preset[data-preset="glitch"]').click()
  await page.getByTestId('copy').click()
  const html = await page.evaluate(() => navigator.clipboard.readText())

  // a complete document with the runtime deps inlined + the real timeline
  expect(html).toContain('<!doctype html>')
  expect(html).toContain('gsap.min.js')
  expect(html).toContain('aria-label="Make it move."')
  expect(html).toContain('gsap.timeline()')
  expect(html).toContain('var(--c2)') // glitch strokes use the themed accents

  // and it actually runs: load it standalone, GSAP fetched from the CDN
  await page.setContent(html, { waitUntil: 'load' })
  await expect(page.locator('.herotype h1')).toHaveAttribute('aria-label', 'Make it move.')
  expect(await page.locator('.herotype .u').count()).toBeGreaterThan(0)
  expect(await page.evaluate(() => typeof window.gsap)).toBe('object')
  await page.waitForTimeout(400)
  const animated = await page
    .locator('.herotype .u')
    .first()
    .evaluate((el) => !!el.getAttribute('style'))
  expect(animated).toBe(true)

  expect(errors).toEqual([])
})
