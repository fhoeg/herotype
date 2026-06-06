/**
 * Curated Google Fonts offered in the font picker. The empty value means
 * "use the active preset's own font" (the default look). Everything else is
 * an override that's loaded on demand via {@link loadGoogleFont}.
 */
export const googleFonts = [
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
