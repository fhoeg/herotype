import { z } from 'zod'

/**
 * Shared contract between the `/api/style` Vercel function and the client.
 * Kept dependency-light (only zod) on purpose: importing `presets.ts` here
 * would pull gsap into the serverless bundle. The key arrays below mirror
 * `presets.ts` / `fonts.ts` — keep them in sync if those lists change.
 */

/** Effect keys — mirror `Object.keys(presets)` in src/lib/presets.ts. */
export const EFFECT_KEYS = [
  'rise',
  'kinetic',
  'wave',
  'glitch',
  'neon',
  'drop',
  'draw',
] as const

/**
 * Selectable faces. `'Fraunces'` is the app default (DEFAULT_FONT, the empty
 * picker value); the rest mirror `googleFonts` in src/lib/fonts.ts. The client
 * maps `'Fraunces'` back to `''` so it resolves to the default.
 */
export const FONT_OPTIONS = [
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

// NOTE: only `enum` (effect, font) is enforceable inside structured output —
// string/number range + length constraints are stripped from the schema sent
// to the model, so the AI SDK would validate them *after* generation and reject
// otherwise-good objects when the model overshoots (e.g. a long reasoning).
// We therefore keep this schema types-only beyond the enums and clamp/sanitize
// every soft constraint client-side in App.tsx (nearestWeight, speed clamp,
// safeHex, tagline/​reasoning slice). The intended ranges live in `.describe()`.
const hex = z.string().describe('CSS hex colour, e.g. #0a0a0c')

/** The full hero combination the model returns for a free-text style phrase. */
export const styleSchema = z.object({
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

export type StyleResult = z.infer<typeof styleSchema>
