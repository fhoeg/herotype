import { generateObject } from 'ai'
import { z } from 'zod'

/**
 * POST /api/style — translate a free-text style description into a full hero
 * combination (effect / font / weight / custom colours / speed / tagline).
 *
 * Uses Mistral Ministral 14B (small, cheap) through the Vercel AI Gateway: the
 * plain `mistral/ministral-14b` model string resolves via the gateway when
 * AI_GATEWAY_API_KEY (or prod OIDC) is set. The key never reaches the browser.
 * On any failure we return 500 and the client falls back to its local keyword
 * parser, so the app keeps working offline / without a key.
 *
 * SELF-CONTAINED on purpose: importing from ../src/lib breaks in the deployed
 * ESM function (extensionless relative imports → ERR_MODULE_NOT_FOUND). The
 * enums below mirror presets.ts / fonts.ts — keep them in sync. The client's
 * matching `StyleResult` type lives in src/lib/styleSchema.ts.
 */

// Effect keys — mirror Object.keys(presets) in src/lib/presets.ts.
const EFFECT_KEYS = ['rise', 'kinetic', 'wave', 'glitch', 'neon', 'drop', 'draw'] as const
// Background keys — mirror BG_KEYS in src/lib/background.ts (KEEP IN SYNC).
const BG_KEYS = ['none', 'aurora', 'particles', 'grid', 'waves', 'noise'] as const
// 'Fraunces' = the app default; rest mirror googleFonts in src/lib/fonts.ts
// (KEEP IN SYNC). All exist on @fontsource as google type with a latin-400 woff.
const FONT_OPTIONS = [
  'Fraunces',
  // Sans-serif
  'Inter',
  'Roboto',
  'Open Sans',
  'Lato',
  'Montserrat',
  'Poppins',
  'Raleway',
  'Nunito',
  'Work Sans',
  'Rubik',
  'Manrope',
  'DM Sans',
  'Outfit',
  'Sora',
  'Plus Jakarta Sans',
  'Josefin Sans',
  'Quicksand',
  'Comfortaa',
  'Archivo',
  'Archivo Black',
  'Bricolage Grotesque',
  'Oswald',
  'Kanit',
  // Serif
  'Playfair Display',
  'DM Serif Display',
  'Merriweather',
  'Lora',
  'PT Serif',
  'EB Garamond',
  'Cormorant Garamond',
  'Libre Baskerville',
  'Spectral',
  'Bitter',
  'Zilla Slab',
  'Abril Fatface',
  // Display / decorative
  'Anton',
  'Bebas Neue',
  'Staatliches',
  'Alfa Slab One',
  'Titan One',
  'Bowlby One',
  'Bangers',
  'Fredoka',
  'Righteous',
  'Russo One',
  'Black Ops One',
  'Orbitron',
  'Audiowide',
  'Monoton',
  'Faster One',
  'Shrikhand',
  'Bungee',
  'Bungee Shade',
  'Lobster',
  'Pacifico',
  'Nabla',
  // Monospace
  'Space Mono',
  'Roboto Mono',
  'JetBrains Mono',
  'IBM Plex Mono',
  'Fira Code',
  'Source Code Pro',
  'Inconsolata',
  'Rubik Mono One',
  'VT323',
  'Syne Mono',
  'Silkscreen',
  'Major Mono Display',
  'Press Start 2P',
  // Handwriting / script
  'Caveat',
  'Dancing Script',
  'Great Vibes',
  'Satisfy',
  'Sacramento',
  'Permanent Marker',
  'Shadows Into Light',
  'Amatic SC',
  'Kalam',
] as const

// Only `enum` (effect, font) is enforceable in structured output — string/number
// length + range constraints are stripped before the model sees them, so we keep
// this types-only beyond the enums and clamp/sanitize client-side. Intended
// ranges live in the system prompt + `.describe()`.
const hex = z.string().describe('CSS hex colour, e.g. #0a0a0c')
const styleSchema = z.object({
  effect: z.enum(EFFECT_KEYS).describe('Animation preset that best fits the vibe'),
  font: z.enum(FONT_OPTIONS).describe('Headline typeface'),
  subFont: z
    .enum(FONT_OPTIONS)
    .describe('Small sub-line typeface that PAIRS WELL with the headline font (a classic type pairing — often a clean complement, sometimes the same family)'),
  weight: z.number().describe('Headline font weight, 100–900 (heavier = louder)'),
  colors: z
    .object({ canvas: hex, c1: hex, c2: hex, c3: hex })
    .describe('canvas=background, c1=headline, c2=accent, c3=secondary accent'),
  speed: z.number().describe('Animation speed multiplier, 0.4 (calm) to 2.2 (frantic)'),
  background: z
    .enum(BG_KEYS)
    .describe('Subtle animated backdrop that underpins the mood (kept behind the text)'),
  bgIntensity: z
    .number()
    .describe('Background density/opacity, 0 (barely there) to 1 (lush). Keep subtle: 0.3–0.6 for most moods.'),
  headline: z
    .string()
    .describe('Main display headline — 1–5 punchy words capturing the vibe (the big hero text, a brand-style phrase, NOT a full sentence)'),
  tagline: z.string().describe('Short sub line under the headline, ≤50 chars'),
  reasoning: z.string().describe('One short sentence on why this fits'),
})

// Curated palettes (mirror src/lib/palettes.ts) shown as colour inspiration only.
const PALETTE_INSPO = [
  'ember: bg #0a0a0c, text #f4f1ea, accent #ff5a3c/#19d3c5',
  'cyber: bg #05060a, text #e8fbff, accent #19d3c5/#2af0ff',
  'neon:  bg #0c0414, text #fef0ff, accent #ff3df2/#3df2ff',
  'cream: bg #ece6da, text #1a1a1a, accent #b4502d/#2d6e7d',
  'ink:   bg #101418, text #f0f4f8, accent #7fd4ff/#ffb37f',
].join('\n')

/** Fisher–Yates shuffle (returns a new array) — used to randomise the font list
 *  order per request so the model doesn't keep reaching for the first names. */
function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)]

// Per-request "creative brief" entropy. The same mood is otherwise deterministic,
// so without these nudges the model collapses to the same Playfair/all-caps look
// every time. Each request rolls one direction + one casing to push variance.
const DIRECTIONS = [
  'Reach for a display or decorative face — avoid the safe editorial serif.',
  'Consider a monospace or technical face for a built/engineered feel.',
  'If the mood allows, try a handwriting or script face.',
  'Use a geometric or grotesque sans for clean, modern minimalism.',
  'If a serif fits, pick a characterful one (slab, high-contrast, transitional) — not the obvious default.',
  'Lean unexpected: choose a typeface people rarely use for this mood.',
  'Pair a heavy display headline with a quiet, restrained sub line.',
  'Channel a specific era or subculture in the type choice.',
] as const

const CASINGS = [
  'Title Case',
  'lowercase only',
  'ALL CAPS',
  'Sentence case',
  'expressive / mixed casing',
] as const

const SYSTEM = `You are an art director for an animated typographic website hero.
Given a short style/mood phrase, choose the combination that best expresses it.
Be inventive — two different moods should NEVER look the same. Treat every brief
as a fresh chance to surprise; do not fall back to a house style.

Effects (pick one): ${EFFECT_KEYS.join(', ')}
- glitch pairs well with mono/techy faces; rise/wave with editorial serifs;
  drop/kinetic with heavy display faces; draw renders stroked outlines.
- subFont is the small sub-line face: choose a tasteful pairing with the
  headline font (e.g. a clean sans under a display serif), not a clashing one.

FONTS — you have 80+ faces (the valid list is provided per request). Range
WIDELY across them: serif, sans, display, mono, script. Do NOT default to
Playfair Display or other obvious "safe" picks — only choose them when they are
genuinely the best fit, and avoid repeating the same face across different moods.

CASING — vary it to fit the mood. ALL CAPS is one option among several, NOT the
default. Lowercase reads intimate/modern; Title Case reads editorial; Sentence
case reads human. Write the literal headline text in the casing you intend.

Colours: return a CUSTOM hex set tuned to the vibe — do not just copy a palette.
canvas = background, c1 = headline (must read clearly on the canvas),
c2 = primary accent, c3 = secondary accent. Favour bold, high-contrast,
mostly-dark hero looks. Curated palettes for inspiration only:
${PALETTE_INSPO}

weight: 100–900 matching the mood (heavier = louder).
speed: 0.4 (slow/calm) to 2.2 (fast/frantic).
background: a subtle animated backdrop, behind the text, that reinforces the
mood (pick one): ${BG_KEYS.join(', ')}.
- aurora = soft drifting colour glow (dreamy, elegant, calm, premium);
  particles = floating dust/sparks (playful, airy, energetic, magical);
  grid = retro synthwave perspective floor (neon, 80s, cyber, arcade);
  waves = flowing horizontal lines (liquid, organic, ambient, oceanic);
  noise = film grain + scanlines (glitch, gritty, dystopian, cyber);
  none = a flat solid canvas (stark, brutalist, ultra-minimal).
bgIntensity: 0–1 density/opacity. Keep it subtle so the headline stays the
hero — 0.3–0.6 suits most moods; go higher only for deliberately lush vibes.
headline: the big hero text — 1–5 punchy words capturing the vibe (a
brand-style phrase or statement, NOT a full sentence, NOT the tagline).
tagline: a short sub line under the headline, max 50 chars, fitting the vibe.
reasoning: one short sentence on why this combination fits.`

export async function POST(req: Request): Promise<Response> {
  let mood = ''
  try {
    const body = (await req.json()) as { mood?: unknown }
    mood = typeof body.mood === 'string' ? body.mood.trim() : ''
  } catch {
    return Response.json({ error: 'invalid body' }, { status: 400 })
  }
  if (!mood) return Response.json({ error: 'mood required' }, { status: 400 })

  // Per-request creative brief: a shuffled font list (kills positional bias
  // toward the first names) + a random direction + a random casing. This is the
  // main lever against "every mood looks the same" — see DIRECTIONS/CASINGS.
  const fontList = shuffle(FONT_OPTIONS).join(', ')
  const direction = pick(DIRECTIONS)
  const casing = pick(CASINGS)

  // Model is env-swappable so different models can be A/B'd without a code change.
  // Stronger models (e.g. mistral/mistral-small-latest, anthropic/claude-haiku-4-5)
  // follow the anti-default guidance better and produce more varied, tasteful picks.
  const model = process.env.STYLE_MODEL || 'mistral/ministral-14b'

  try {
    const { object } = await generateObject({
      model,
      schema: styleSchema,
      system: SYSTEM,
      // Higher temperature + topP widen the sampling so the model explores beyond
      // its single most-likely answer for a given mood.
      temperature: 1,
      topP: 0.95,
      prompt: `Style/mood: "${mood}"

Valid fonts (choose from these for font + subFont): ${fontList}

Creative direction for THIS hero: ${direction}
Headline casing for THIS hero: ${casing} (bend it only if the mood demands).
Make this look distinct from a generic elegant-serif hero.`,
    })
    return Response.json(object)
  } catch (err) {
    console.error('style generation failed', err)
    return Response.json({ error: 'generation failed' }, { status: 500 })
  }
}
