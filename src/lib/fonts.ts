/**
 * The default headline typeface. The font is independent of the effect — it is
 * NOT derived from the active preset — so switching effects never changes it.
 * The empty picker value ('') resolves to this.
 */
export const DEFAULT_FONT = 'Fraunces'

/**
 * Curated fonts offered in the font picker. The empty value means
 * "use {@link DEFAULT_FONT}" (preset-independent). Everything else is an
 * override loaded on demand via {@link loadGoogleFont}. The first group are the
 * presets' original personality faces, kept selectable now that they no longer
 * apply automatically per effect.
 */
export const googleFonts = [
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
]

const loaded = new Set<string>()

/**
 * Inject a Google Fonts stylesheet for `family` exactly once. No-op for an
 * empty family (= preset default) or one already requested. Weights 400 & 700
 * are available on every font in {@link googleFonts}; the browser picks the
 * nearest match for a preset's heavier weights.
 */
export function loadGoogleFont(family: string) {
  if (!family || loaded.has(family)) return
  loaded.add(family)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${family.replace(
    / /g,
    '+',
  )}:wght@400;700&display=swap`
  document.head.appendChild(link)
}
