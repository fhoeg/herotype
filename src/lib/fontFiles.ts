/**
 * Resolves a font family name to a parseable font-binary URL for the Draw
 * effect. opentype.js cannot decode the `.woff2` that Google Fonts serves, so
 * we fetch the `.woff` that jsDelivr ships for the matching `@fontsource`
 * package (CORS `*`, opentype-parseable). The URL is deterministic from the
 * family name; the override map covers any face whose package id or available
 * weight doesn't follow the convention.
 */

/** Bundled, guaranteed-parseable fallback used when a family can't be fetched. */
export const BUNDLED_FALLBACK = `${import.meta.env.BASE_URL}fonts/anton.woff`

/** family → fully-qualified font-file URL, for faces that break the convention. */
const FONT_FILE_OVERRIDES: Record<string, string> = {
  // All 16 curated fonts follow the default pattern at weight 400 (verified),
  // so this is currently empty — kept as the documented escape hatch.
}

/** Strip the CSS quoting a Preset's `font` carries, e.g. `'"Anton"'` → `Anton`. */
export function familyName(cssFont: string): string {
  return cssFont.replace(/['"]/g, '').trim()
}

/**
 * jsDelivr `@fontsource` `.woff` URL for `family` at weight 400 / latin / normal.
 * Returns the override when present.
 */
export function fontFileUrl(family: string): string {
  const name = familyName(family)
  if (FONT_FILE_OVERRIDES[name]) return FONT_FILE_OVERRIDES[name]
  const id = name.toLowerCase().replace(/\s+/g, '-')
  return `https://cdn.jsdelivr.net/npm/@fontsource/${id}/files/${id}-latin-400-normal.woff`
}
