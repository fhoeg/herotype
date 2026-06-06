import gsap from 'gsap'
import type { Preset } from './types'

/**
 * Six presets. Each defines a font personality + a GSAP "in" timeline builder.
 * Builders receive the per-character `.u` elements and tuning params.
 *
 * Looping effects (wave/glitch/neon) attach repeat:-1 tweens; useGSAP reverts
 * them automatically on replay, so no manual killTweensOf is needed.
 */
export const presets: Record<string, Preset> = {
  rise: {
    key: 'rise',
    name: 'Rise',
    desc: 'editorial · clean',
    font: '"Fraunces"',
    weight: 600,
    tracking: '-0.02em',
    build: (units, p) => {
      const tl = gsap.timeline()
      tl.from(units, {
        yPercent: 120,
        opacity: 0,
        filter: 'blur(8px)',
        duration: 0.9 / p.speed,
        ease: 'power3.out',
        stagger: p.stagger,
      })
      return tl
    },
  },

  kinetic: {
    key: 'kinetic',
    name: 'Kinetic',
    desc: 'bold · punchy',
    font: '"Archivo Black"',
    weight: 400,
    tracking: '-0.03em',
    build: (units, p) => {
      const tl = gsap.timeline()
      tl.from(units, {
        scale: 0,
        opacity: 0,
        rotation: () => gsap.utils.random(-25, 25),
        transformOrigin: '50% 50%',
        duration: 0.6 / p.speed,
        ease: 'back.out(2.2)',
        stagger: p.stagger,
      })
      return tl
    },
  },

  wave: {
    key: 'wave',
    name: 'Wave',
    desc: 'liquid · calm',
    font: '"Fraunces"',
    weight: 500,
    tracking: '-0.01em',
    build: (units, p) => {
      const tl = gsap.timeline()
      tl.from(units, {
        yPercent: 90,
        opacity: 0,
        duration: 1 / p.speed,
        ease: 'sine.out',
        stagger: p.stagger * 1.3,
      }).to(
        units,
        {
          yPercent: -8,
          duration: 1.1 / p.speed,
          ease: 'sine.inOut',
          stagger: { each: p.stagger * 1.3, yoyo: true, repeat: -1 },
        },
        '>-0.2',
      )
      return tl
    },
  },

  glitch: {
    key: 'glitch',
    name: 'Glitch',
    desc: 'cyber · heavy',
    font: '"Space Mono"',
    weight: 700,
    tracking: '0em',
    build: (units, p) => {
      const tl = gsap.timeline()
      tl.from(units, {
        opacity: 0,
        x: () => gsap.utils.random(-40, 40),
        skewX: 30,
        duration: 0.4 / p.speed,
        ease: 'power4.out',
        stagger: p.stagger * 0.6,
      })
      units.forEach((u) => {
        gsap.to(u, {
          x: () => gsap.utils.random(-3, 3),
          textShadow: '2px 0 var(--c2), -2px 0 var(--c3)',
          duration: 0.08,
          repeat: -1,
          repeatRefresh: true,
          repeatDelay: gsap.utils.random(0.4, 2.4),
          yoyo: true,
          ease: 'none',
        })
      })
      return tl
    },
  },

  neon: {
    key: 'neon',
    name: 'Neon',
    desc: 'retro · synth',
    font: '"Bricolage Grotesque"',
    weight: 800,
    tracking: '-0.01em',
    build: (units, p) => {
      const tl = gsap.timeline()
      tl.set(units, { textShadow: '0 0 18px var(--c2), 0 0 40px var(--c2)' })
        .from(units, {
          opacity: 0,
          duration: 0.5 / p.speed,
          ease: 'power1.in',
          stagger: { each: p.stagger, from: 'random' },
        })
        .to(
          units,
          {
            opacity: 0.78,
            duration: 0.06,
            repeat: 3,
            yoyo: true,
            stagger: { each: 0.02, from: 'random' },
          },
          '>-0.1',
        )
      return tl
    },
  },

  drop: {
    key: 'drop',
    name: 'Drop',
    desc: 'elastic · playful',
    font: '"Bricolage Grotesque"',
    weight: 800,
    tracking: '-0.02em',
    build: (units, p) => {
      const tl = gsap.timeline()
      tl.from(units, {
        yPercent: -180,
        opacity: 0,
        duration: 1.1 / p.speed,
        ease: 'elastic.out(1,0.45)',
        stagger: p.stagger,
      })
      return tl
    },
  },

  draw: {
    key: 'draw',
    name: 'Draw',
    desc: 'ink · outline',
    // Default face for the draw effect; bundled locally so it's always
    // parseable (the picker can override it — see HeroStage's draw branch).
    font: '"Anton"',
    weight: 400,
    tracking: '-0.01em',
    kind: 'draw',
    // `kind:'draw'` renders SVG glyph outlines in HeroStage instead of running
    // over the `.u` spans; this builder is never called. Kept as a no-op so the
    // Preset shape stays uniform.
    build: () => gsap.timeline(),
  },
}

export const presetKeys = Object.keys(presets)
