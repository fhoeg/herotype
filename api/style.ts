import { generateObject } from 'ai'
import { styleSchema, EFFECT_KEYS, FONT_OPTIONS } from '../src/lib/styleSchema'
import { palettes } from '../src/lib/palettes'

/**
 * POST /api/style — translate a free-text style description into a full hero
 * combination (effect / font / weight / custom colours / speed / tagline).
 *
 * Uses Mistral Ministral 14B (small, cheap) through the Vercel AI Gateway: the
 * plain `mistral/ministral-14b` model string resolves via the gateway when
 * AI_GATEWAY_API_KEY (or prod OIDC) is set. The key never reaches the browser.
 * On any failure we return 500 and the client falls back to its local keyword
 * parser, so the app keeps working offline / without a key.
 */

const EFFECTS = EFFECT_KEYS.join(', ')
const FONTS = FONT_OPTIONS.join(', ')
// Curated palettes shown to the model as inspiration (it returns custom hex).
const PALETTE_INSPO = Object.entries(palettes)
  .map(([k, v]) => `${k}: bg ${v.canvas}, text ${v.c1}, accent ${v.c2}/${v.c3}`)
  .join('\n')

const SYSTEM = `You are an art director for an animated typographic website hero.
Given a short style/mood phrase, choose the combination that best expresses it.

Effects (pick one): ${EFFECTS}
Fonts (pick one): ${FONTS}
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
