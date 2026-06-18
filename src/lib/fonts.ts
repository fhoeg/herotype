/**
 * The default headline typeface. The font is independent of the effect — it is
 * NOT derived from the active preset — so switching effects never changes it.
 * The empty picker value ('') resolves to this.
 */
export const DEFAULT_FONT = 'Fraunces'

/**
 * Parse-failure fallback face for the Draw effect. The font is independent of
 * the effect — Draw resolves the SAME family as every other preset
 * ({@link DEFAULT_FONT} or the explicit picker font). Anton is only used when
 * the chosen face can't be fetched/parsed for outline extraction, so the
 * headline always draws. (opentype.js 1.3.4 parses Fraunces cleanly; the old
 * "serifs mangle" caveat was a 2.0.0-era bug.)
 */
export const DRAW_DEFAULT_FONT = 'Anton'

/**
 * Curated fonts offered in the font picker. The empty value means
 * "use {@link DEFAULT_FONT}" (preset-independent). Everything else is an
 * override loaded on demand via {@link loadGoogleFont}. The first group are the
 * presets' original personality faces, kept selectable now that they no longer
 * apply automatically per effect.
 */
// All families below are verified to exist on @fontsource as `google` type with
// a latin-400 woff, so they work in every path: Google Fonts CSS (loadGoogleFont),
// the Draw effect's woff (fontFileUrl), and the weights API (fetchFontWeights).
// Grouped by category for the picker. KEEP IN SYNC with FONT_OPTIONS in api/style.ts.
export const googleFonts = [
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
]

const loaded = new Set<string>()

/**
 * Inject a Google Fonts stylesheet for `family` exactly once per weight set.
 * No-op for an empty family (= preset default, already linked in index.html).
 * Only the supplied `weights` are requested so the css2 query stays valid even
 * for single-weight faces (requesting a weight a font lacks 400s the whole
 * stylesheet). Pass the weights from {@link fetchFontWeights}.
 */
export function loadGoogleFont(family: string, weights: number[] = [400]) {
  if (!family) return
  const ws = (weights.length ? weights : [400]).join(';')
  const key = `${family}@${ws}`
  if (loaded.has(key)) return
  loaded.add(key)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(
    / /g,
    '+',
  )}:wght@${ws}&display=swap`
  document.head.appendChild(link)
}

/** Sensible default range used until the API responds (covers the variable
 *  default face, Fraunces). */
const FALLBACK_WEIGHTS = [300, 400, 500, 600, 700, 800, 900]

const weightsCache = new Map<string, number[]>()

/**
 * Resolve the real weights a family ships, via the fontsource metadata API
 * (CORS `*`, same source as the Draw woff files). Cached per family; falls back
 * to {@link FALLBACK_WEIGHTS} on any network/parse failure so the picker is
 * never empty. The returned list is the single source of truth for both the
 * weight selector and which weights {@link loadGoogleFont} requests.
 */
export async function fetchFontWeights(family: string): Promise<number[]> {
  const id = (family || DEFAULT_FONT).toLowerCase().replace(/\s+/g, '-')
  const cached = weightsCache.get(id)
  if (cached) return cached
  try {
    const r = await fetch(`https://api.fontsource.org/v1/fonts/${id}`)
    if (!r.ok) throw new Error(`api ${r.status}`)
    const data = (await r.json()) as { weights?: number[] }
    const weights =
      Array.isArray(data.weights) && data.weights.length
        ? [...data.weights].sort((a, b) => a - b)
        : [400]
    weightsCache.set(id, weights)
    return weights
  } catch {
    return FALLBACK_WEIGHTS
  }
}
