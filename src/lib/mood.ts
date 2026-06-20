import type { MoodResult } from './types'

/**
 * Keyword-matcher mood parser. Maps a free-text phrase to a full config:
 * effect + palette + speed + tagline. Zero dependencies, works offline,
 * demos identically to an AI version.
 *
 * Last-hour upgrade path: swap `parseMood` for an async LLM call that returns
 * the same MoodResult shape. The interface is identical — see specs/plan.md.
 */
type MoodBucket = {
  keys: string[]
  preset: string
  palette: string
  speed: number
  taglines: string[]
  /** Mood-underpinning background (see lib/background.ts). */
  background: string
}

export const moodMap: MoodBucket[] = [
  {
    keys: ['ominous', 'dark', 'cyber', 'glitch', 'hack', 'heavy', 'dystopia', 'brutal', 'danger'],
    preset: 'glitch',
    palette: 'cyber',
    speed: 1.3,
    taglines: ['system online', 'access granted', 'no signal', 'enter the grid'],
    background: 'noise',
  },
  {
    keys: ['neon', 'retro', '80s', 'synth', 'vapor', 'arcade', 'miami', 'outrun'],
    preset: 'neon',
    palette: 'neon',
    speed: 1,
    taglines: ['after dark', 'press start', 'night drive', 'high score'],
    background: 'grid',
  },
  {
    keys: ['playful', 'bouncy', 'fun', 'joy', 'happy', 'toy', 'kids', 'party', 'energetic'],
    preset: 'drop',
    palette: 'ember',
    speed: 1.1,
    taglines: ['let’s play', 'good times', 'bounce in', 'say hi'],
    background: 'particles',
  },
  {
    keys: ['elegant', 'luxury', 'refined', 'editorial', 'classy', 'premium', 'minimal', 'calm', 'sophisticated'],
    preset: 'rise',
    palette: 'cream',
    speed: 0.85,
    taglines: ['est. 2026', 'quietly crafted', 'in good taste', 'the fine print'],
    background: 'aurora',
  },
  {
    keys: ['liquid', 'smooth', 'organic', 'flow', 'wave', 'water', 'soft', 'dream', 'ambient'],
    preset: 'wave',
    palette: 'ink',
    speed: 0.9,
    taglines: ['go with the flow', 'easy does it', 'drift in', 'stay fluid'],
    background: 'waves',
  },
  {
    keys: ['bold', 'loud', 'impact', 'strong', 'power', 'sport', 'headline', 'shout', 'max'],
    preset: 'kinetic',
    palette: 'ember',
    speed: 1.2,
    taglines: ['no small talk', 'go big', 'full send', 'make noise'],
    background: 'particles',
  },
]

export const moodChips = [
  'ominous, cyberpunk',
  'playful & bouncy',
  'elegant editorial',
  'liquid & calm',
  'retro neon',
  'bold impact',
]

const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]

/** Parse a phrase into a hero config. Falls back to a random bucket on no match. */
export function parseMood(raw: string): MoodResult {
  const q = (raw || '').toLowerCase()
  let hit: MoodBucket | null = null
  let score = 0
  for (const m of moodMap) {
    const s = m.keys.filter((k) => q.includes(k)).length
    if (s > score) {
      score = s
      hit = m
    }
  }
  if (!hit) hit = pick(moodMap)
  return {
    preset: hit.preset,
    palette: hit.palette,
    speed: hit.speed,
    tagline: pick(hit.taglines),
    background: hit.background,
  }
}
