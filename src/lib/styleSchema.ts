/**
 * Client-side shape of the AI `/api/style` response. Type-only (no zod), so the
 * browser bundle stays zod-free. The authoritative validated schema lives in
 * `api/style.ts` (self-contained — it can't import this file, since extensionless
 * cross-tree imports break in the deployed ESM function). `effect`/`font` come
 * back constrained to the function's enums; the client still clamps/sanitizes
 * every soft field (weight, colours, speed, tagline) in App.tsx.
 */
export type StyleResult = {
  effect: string
  font: string
  weight: number
  colors: { canvas: string; c1: string; c2: string; c3: string }
  speed: number
  tagline: string
  reasoning: string
}
