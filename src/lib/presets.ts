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
      // Subtle, randomly-ordered entrance — a few px + a little skew, both axes.
      tl.from(units, {
        opacity: 0,
        x: () => gsap.utils.random(-8, 8),
        y: () => gsap.utils.random(-6, 6),
        skewX: 10,
        duration: 0.45 / p.speed,
        ease: 'power3.out',
        stagger: { each: p.stagger, from: 'random' },
      })
      // Faint constant chromatic aberration; full glyphs to start.
      gsap.set(units, {
        clipPath: 'inset(0% 0% 0% 0%)',
        textShadow: '1px 0 var(--c2), -1px 0 var(--c3)',
      })
      // "Broken rendering": each glyph runs on its OWN randomised, sparse clock,
      // so the breakup is staggered across the word. Two independent layers —
      // (1) a constant 1–2px micro-jitter, and (2) an occasional hard "slice"
      // that cuts a horizontal band out of the glyph (+ skew + stronger split)
      // and snaps back, like a frame that failed to render.
      units.forEach((u) => {
        gsap.to(u, {
          x: () => gsap.utils.random(-1.5, 1.5),
          y: () => gsap.utils.random(-1, 1),
          duration: 0.1,
          delay: gsap.utils.random(0.5, 1.6),
          repeat: -1,
          repeatRefresh: true,
          repeatDelay: gsap.utils.random(0.4, 1.8),
          yoyo: true,
          ease: 'none',
        })
        gsap
          .timeline({
            repeat: -1,
            repeatRefresh: true,
            delay: gsap.utils.random(0.8, 2.6),
            repeatDelay: gsap.utils.random(1.6, 4.8),
          })
          .set(u, {
            clipPath: () =>
              `inset(${gsap.utils.random(0, 55)}% 0% ${gsap.utils.random(0, 35)}% 0%)`,
            skewX: () => gsap.utils.random(-8, 8),
            textShadow: '2px 0 var(--c2), -2px 0 var(--c3)',
          })
          .set(
            u,
            {
              clipPath: 'inset(0% 0% 0% 0%)',
              skewX: 0,
              textShadow: '1px 0 var(--c2), -1px 0 var(--c3)',
            },
            '+=0.09',
          )
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
