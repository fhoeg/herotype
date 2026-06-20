/**
 * Mood backgrounds — a subtle animated backdrop that underpins the hero's vibe.
 *
 * One self-contained Canvas 2D renderer drives both the live app
 * (BackgroundCanvas in HeroStage) and the copy-code export. `runBackground` is
 * deliberately CLOSURE-FREE — it references only its arguments and browser
 * globals (window, requestAnimationFrame, Math) — so `runBackground.toString()`
 * serializes into the export untouched and stays byte-for-byte identical to what
 * ships in the app. Do NOT pull in module-scope helpers here.
 *
 * Effects are themed off the active palette (c1/c2/c3) and kept low-alpha so the
 * headline always stays readable. `intensity` (0..1) scales density/opacity;
 * `speed` scales motion.
 */

export type BgColors = { canvas: string; c1: string; c2: string; c3: string }

/** Background catalogue — drives the picker + the AI enum. `none` = flat canvas. */
export const backgrounds: { key: string; name: string; desc: string }[] = [
  { key: 'none', name: 'None', desc: 'flat canvas' },
  { key: 'aurora', name: 'Aurora', desc: 'soft drifting glow' },
  { key: 'particles', name: 'Particles', desc: 'floating dust' },
  { key: 'grid', name: 'Grid', desc: 'retro perspective' },
  { key: 'waves', name: 'Waves', desc: 'flowing lines' },
  { key: 'noise', name: 'Static', desc: 'grain + scanlines' },
]

export const BG_KEYS = backgrounds.map((b) => b.key)

/** True if `k` is a known background key. */
export const isBgKey = (k: unknown): k is string => typeof k === 'string' && BG_KEYS.includes(k)

/**
 * Start animating `type` onto `canvas`, themed by `colors`. Returns a cleanup
 * function that cancels the loop, detaches the resize listener, and clears the
 * surface. Self-contained on purpose (see file header).
 */
export function runBackground(
  canvas: HTMLCanvasElement,
  type: string,
  colors: BgColors,
  intensity: number,
  speed: number,
): () => void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}
  if (type === 'none') {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    return () => {}
  }

  const inten = Math.max(0, Math.min(1, intensity))
  const spd = Math.max(0.05, speed || 1)

  // hex → [r,g,b]
  const rgb = (hex: string): number[] => {
    let h = (hex || '#000000').replace('#', '')
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]
    const n = parseInt(h, 16) || 0
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  }
  const c1 = rgb(colors.c1)
  const c2 = rgb(colors.c2)
  const c3 = rgb(colors.c3)
  const css = (c: number[], a: number) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'

  let W = 1
  let H = 1
  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const r = canvas.getBoundingClientRect()
    W = Math.max(1, Math.floor(r.width))
    H = Math.max(1, Math.floor(r.height))
    canvas.width = Math.floor(W * dpr)
    canvas.height = Math.floor(H * dpr)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  }
  resize()

  // Particle pool (only used by the 'particles' effect).
  let parts: { x: number; y: number; r: number; sp: number; ph: number }[] = []
  const seed = () => {
    const count = type === 'particles' ? Math.round(40 + inten * 120) : 0
    parts = []
    for (let i = 0; i < count; i++) {
      parts.push({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.6 + Math.random() * 1.8,
        sp: 0.2 + Math.random() * 0.9,
        ph: Math.random() * Math.PI * 2,
      })
    }
  }
  seed()

  let t = 0
  let last = 0
  let raf = 0

  const frame = (now: number) => {
    raf = requestAnimationFrame(frame)
    if (!last) last = now
    const dt = Math.min(0.05, (now - last) / 1000)
    last = now
    t += dt * spd

    ctx.clearRect(0, 0, W, H)

    if (type === 'aurora') {
      // Three big soft glows drifting on lissajous paths, additively blended.
      ctx.globalCompositeOperation = 'lighter'
      const rad = Math.max(W, H) * 0.6
      const a = 0.08 + inten * 0.22
      const blob = (cx: number, cy: number, rr: number, col: number[], aa: number) => {
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr)
        g.addColorStop(0, css(col, aa))
        g.addColorStop(1, css(col, 0))
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }
      blob(W * (0.3 + 0.18 * Math.sin(t * 0.3)), H * (0.35 + 0.14 * Math.cos(t * 0.23)), rad, c2, a)
      blob(W * (0.72 + 0.16 * Math.cos(t * 0.27)), H * (0.62 + 0.14 * Math.sin(t * 0.2)), rad, c3, a)
      blob(W * (0.5 + 0.2 * Math.sin(t * 0.17)), H * (0.5 + 0.18 * Math.cos(t * 0.31)), rad * 0.8, c1, a * 0.35)
      ctx.globalCompositeOperation = 'source-over'
    } else if (type === 'particles') {
      // Dust drifting upward with a gentle horizontal sway.
      ctx.globalCompositeOperation = 'lighter'
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i]
        p.y -= p.sp * 14 * dt * spd
        const x = p.x + Math.sin(t * 0.6 + p.ph) * 8
        if (p.y < -4) {
          p.y = H + 4
          p.x = Math.random() * W
        }
        ctx.fillStyle = css(c2, (0.18 + inten * 0.5) * (0.4 + 0.6 * p.sp))
        ctx.beginPath()
        ctx.arc(x, p.y, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
    } else if (type === 'grid') {
      // Synthwave floor: lines converging to a vanishing point, rows scrolling
      // toward the viewer with perspective spacing.
      const horizon = H * 0.52
      const vpx = W * 0.5
      ctx.lineWidth = 1
      ctx.strokeStyle = css(c2, 0.08 + inten * 0.22)
      const cols = 16
      for (let i = -cols; i <= cols; i++) {
        const f = i / cols
        ctx.beginPath()
        ctx.moveTo(vpx + f * W * 0.06, horizon)
        ctx.lineTo(vpx + f * W * 1.4, H)
        ctx.stroke()
      }
      const rows = 14
      const scroll = (t * 0.25) % 1
      for (let j = 0; j < rows; j++) {
        let f = (j + scroll) / rows
        f = f * f // perspective: rows bunch up near the horizon
        const y = horizon + f * (H - horizon)
        ctx.strokeStyle = css(c3, (0.05 + inten * 0.2) * (0.3 + f))
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
        ctx.stroke()
      }
    } else if (type === 'waves') {
      // Stacked sine ribbons, phase-drifting, breathing in amplitude.
      const lines = 5
      ctx.lineWidth = 1.5
      for (let k = 0; k < lines; k++) {
        const yBase = H * (0.28 + 0.46 * (k / (lines - 1)))
        const amp = (10 + inten * 34) * (0.5 + 0.5 * Math.sin(t * 0.3 + k))
        ctx.strokeStyle = css(k % 2 ? c3 : c2, 0.08 + inten * 0.2)
        ctx.beginPath()
        for (let x = 0; x <= W; x += 8) {
          const y = yBase + Math.sin(x * 0.012 + t * 1.2 + k * 0.8) * amp
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.stroke()
      }
    } else if (type === 'noise') {
      // Faint scanlines + per-frame film grain (CRT / glitch).
      ctx.fillStyle = css([0, 0, 0], 0.04 + inten * 0.06)
      for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1)
      const dots = Math.round(W * H * 0.0006 * (0.3 + inten))
      for (let i = 0; i < dots; i++) {
        ctx.globalAlpha = Math.random() * (0.05 + inten * 0.12)
        ctx.fillStyle = Math.random() < 0.5 ? css(c2, 1) : css(c1, 1)
        ctx.fillRect(Math.random() * W, Math.random() * H, 1.5, 1.5)
      }
      ctx.globalAlpha = 1
    }
  }
  raf = requestAnimationFrame(frame)

  const onResize = () => {
    resize()
    seed()
  }
  window.addEventListener('resize', onResize)

  return () => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', onResize)
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }
}
