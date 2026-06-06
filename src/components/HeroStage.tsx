import { useRef, Fragment } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { presets } from '../lib/presets'
import type { HeroState } from '../lib/types'

gsap.registerPlugin(useGSAP)

type Props = {
  state: HeroState
  /** Bumping this forces a replay without any other state change. */
  runId: number
}

/**
 * Renders the split headline (word / char spans) and drives the active
 * preset's GSAP timeline. useGSAP scopes all selectors to this subtree and
 * reverts the previous timeline (including looping tweens) whenever any
 * dependency changes — that replaces the PoC's manual kill()/killTweensOf().
 */
export function HeroStage({ state, runId }: Props) {
  const scope = useRef<HTMLDivElement>(null)
  const def = presets[state.preset]

  useGSAP(
    () => {
      const units = gsap.utils.toArray<HTMLElement>('.u')
      if (!units.length) return

      def.build(units, { speed: state.speed, stagger: state.stagger })

      // tagline reveal
      gsap.fromTo(
        '.tag',
        { opacity: 0, y: 10 },
        { opacity: 0.9, y: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' },
      )
    },
    {
      scope,
      dependencies: [
        state.headline,
        state.preset,
        state.speed,
        state.stagger,
        runId,
      ],
    },
  )

  const words = state.headline.split(' ')

  return (
    <div className="canvas">
      <div
        className="hero"
        ref={scope}
        style={{ transform: `scale(${state.scale})` }}
      >
        <h1
          data-testid="headline"
          style={{
            fontFamily: `${def.font}, serif`,
            fontWeight: def.weight,
            letterSpacing: def.tracking,
          }}
        >
          {words.map((word, wi) => (
            <Fragment key={wi}>
              <span className="word">
                {[...word].map((ch, ci) => (
                  <span className="u" key={ci}>
                    {ch}
                  </span>
                ))}
              </span>
              {wi < words.length - 1 && (
                <span className="space u">{' '}</span>
              )}
            </Fragment>
          ))}
        </h1>
        <div className="tag" data-testid="tagline">
          {state.tagline}
        </div>
      </div>
    </div>
  )
}
