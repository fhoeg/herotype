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
// 'Fraunces' = the app default; rest mirror googleFonts in src/lib/fonts.ts.
const FONT_OPTIONS = [
  'Fraunces',
  'Bricolage Grotesque',
  'Archivo Black',
  'Space Mono',
  'Inter',
  'Poppins',
  'Montserrat',
  'Playfair Display',
  'DM Serif Display',
  'Abril Fatface',
  'Oswald',
  'Anton',
  'Bebas Neue',
  'Righteous',
  'Lobster',
  'Pacifico',
  'Caveat',
  'Rubik Mono One',
  'Press Start 2P',
  'Major Mono Display',
] as const

// Only `enum` (effect, font) is enforceable in structured output — string/number
// length + range constraints are stripped before the model sees them, so we keep
// this types-only beyond the enums and clamp/sanitize client-side. Intended
// ranges live in the system prompt + `.describe()`.
const hex = z.string().describe('CSS hex colour, e.g. #0a0a0c')
const styleSchema = z.object({
  effect: z.enum(EFFECT_KEYS).describe('Animation preset that best fits the vibe'),
  font: z.enum(FONT_OPTIONS).describe('Headline typeface'),
  weight: z.number().describe('Headline font weight, 100–900 (heavier = louder)'),
  colors: z
    .object({ canvas: hex, c1: hex, c2: hex, c3: hex })
    .describe('canvas=background, c1=headline, c2=accent, c3=secondary accent'),
  speed: z.number().describe('Animation speed multiplier, 0.4 (calm) to 2.2 (frantic)'),
  tagline: z.string().describe('Punchy sub line, ≤50 chars'),
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

const SYSTEM = `You are an art director for an animated typographic website hero.
Given a short style/mood phrase, choose the combination that best expresses it.

Effects (pick one): ${EFFECT_KEYS.join(', ')}
Fonts (pick one): ${FONT_OPTIONS.join(', ')}
- glitch pairs well with mono/techy faces; rise/wave with editorial serifs;
  drop/kinetic with heavy display faces; draw renders stroked outlines.

Colours: return a CUSTOM hex set tuned to the vibe — do not just copy a palette.
canvas = background, c1 = headline (must read clearly on the canvas),
c2 = primary accent, c3 = secondary accent. Favour bold, high-contrast,
mostly-dark hero looks. Curated palettes for inspiration only:
${PALETTE_INSPO}

weight: 100–900 matching the mood (heavier = louder).
speed: 0.4 (slow/calm) to 2.2 (fast/frantic).
tagline: a punchy sub line, max 50 chars, fitting the vibe.
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

  try {
    const { object } = await generateObject({
      model: 'mistral/ministral-14b',
      schema: styleSchema,
      system: SYSTEM,
      prompt: `Style/mood: "${mood}"`,
    })
    return Response.json(object)
  } catch (err) {
    console.error('style generation failed', err)
    return Response.json({ error: 'generation failed' }, { status: 500 })
  }
}
