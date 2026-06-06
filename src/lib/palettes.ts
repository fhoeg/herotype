import type { Palette } from './types'

/** Five curated palettes. Switching a palette = a few setProperty calls. */
export const palettes: Record<string, Palette> = {
  ember: { canvas: '#0a0a0c', c1: '#f4f1ea', c2: '#ff5a3c', c3: '#19d3c5' },
  cyber: { canvas: '#05060a', c1: '#e8fbff', c2: '#19d3c5', c3: '#2af0ff' },
  neon: { canvas: '#0c0414', c1: '#fef0ff', c2: '#ff3df2', c3: '#3df2ff' },
  cream: { canvas: '#ece6da', c1: '#1a1a1a', c2: '#b4502d', c3: '#2d6e7d' },
  ink: { canvas: '#101418', c1: '#f0f4f8', c2: '#7fd4ff', c3: '#ffb37f' },
}

export const paletteKeys = Object.keys(palettes)
