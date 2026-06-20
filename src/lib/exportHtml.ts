import { presets } from './presets'
import { DEFAULT_FONT, DRAW_DEFAULT_FONT } from './fonts'
import { fontFileUrl } from './fontFiles'
import { runBackground } from './background'
import type { HeroState } from './types'

/**
 * Build a COMPLETE, self-contained, runnable HTML document for the current
 * hero — markup + CSS + GSAP (CDN) + the real animation timeline — so it can be
 * pasted into any page and works as-is. (Supersedes the old styled-stub export.)
 */

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const escAttr = (s: string) => esc(s).replace(/"/g, '&quot;')
/** Round baked numbers so the emitted JS stays readable. */
const n = (x: number) => +x.toFixed(3)

const ALIGN_ITEMS = { left: 'flex-start', center: 'center', right: 'flex-end' } as const

/** Hand-rolled per-character split, emitted straight into the markup. */
function splitMarkup(text: string): string {
  return text
    .split(' ')
    .map((word, wi, arr) => {
      const chars = [...word].map((ch) => `<span class="u">${esc(ch)}</span>`).join('')
      const space = wi < arr.length - 1 ? '<span class="space u"> </span>' : ''
      return `<span class="word">${chars}</span>${space}`
    })
    .join('')
}

/** Google Fonts stylesheet for the headline face + the Space Mono sub line,
 *  plus a chosen sub-line face. Only the headline's real `weights` are requested
 *  (requesting a weight a font lacks 400s the whole css2 query); the sub-line
 *  face is requested at weight 400 only, which every face has. */
function fontsHref(font: string, weights: number[], taglineFont: string): string {
  const head = font || DEFAULT_FONT
  const fam = head.replace(/ /g, '+')
  const ws = (weights.length ? weights : [400]).join(';')
  let href = `https://fonts.googleapis.com/css2?family=${fam}:wght@${ws}&family=Space+Mono:wght@400;700`
  // Add the sub-line face unless it's already loaded (Space Mono or the headline).
  if (taglineFont && taglineFont !== 'Space Mono' && taglineFont !== head) {
    href += `&family=${taglineFont.replace(/ /g, '+')}:wght@400`
  }
  return href + '&display=swap'
}

/** The GSAP "in" timeline for each span-based preset, with params baked in. */
function timelineJs(key: string, speed: number, stagger: number): string {
  switch (key) {
    case 'rise':
      return `tl.from(units,{yPercent:120,opacity:0,filter:'blur(8px)',duration:${n(0.9 / speed)},ease:'power3.out',stagger:${n(stagger)}});`
    case 'kinetic':
      return `tl.from(units,{scale:0,opacity:0,rotation:function(){return gsap.utils.random(-25,25)},transformOrigin:'50% 50%',duration:${n(0.6 / speed)},ease:'back.out(2.2)',stagger:${n(stagger)}});`
    case 'wave':
      return `tl.from(units,{yPercent:90,opacity:0,duration:${n(1 / speed)},ease:'sine.out',stagger:${n(stagger * 1.3)}})
    .to(units,{yPercent:-8,duration:${n(1.1 / speed)},ease:'sine.inOut',stagger:{each:${n(stagger * 1.3)},yoyo:true,repeat:-1}},'>-0.2');`
    case 'glitch':
      return `tl.from(units,{opacity:0,x:function(){return gsap.utils.random(-8,8)},y:function(){return gsap.utils.random(-6,6)},skewX:10,duration:${n(0.45 / speed)},ease:'power3.out',stagger:{each:${n(stagger)},from:'random'}});
  gsap.set(units,{clipPath:'inset(0% 0% 0% 0%)',textShadow:'1px 0 var(--c2), -1px 0 var(--c3)'});
  units.forEach(function(u){
    gsap.to(u,{x:function(){return gsap.utils.random(-1.5,1.5)},y:function(){return gsap.utils.random(-1,1)},duration:0.1,delay:gsap.utils.random(0.5,1.6),repeat:-1,repeatRefresh:true,repeatDelay:gsap.utils.random(0.4,1.8),yoyo:true,ease:'none'});
    gsap.timeline({repeat:-1,repeatRefresh:true,delay:gsap.utils.random(0.8,2.6),repeatDelay:gsap.utils.random(1.6,4.8)})
      .set(u,{clipPath:function(){return 'inset('+gsap.utils.random(0,55)+'% 0% '+gsap.utils.random(0,35)+'% 0%)'},skewX:function(){return gsap.utils.random(-8,8)},textShadow:'2px 0 var(--c2), -2px 0 var(--c3)'})
      .set(u,{clipPath:'inset(0% 0% 0% 0%)',skewX:0,textShadow:'1px 0 var(--c2), -1px 0 var(--c3)'},'+=0.09');
  });`
    case 'neon':
      return `tl.set(units,{textShadow:'0 0 18px var(--c2), 0 0 40px var(--c2)'})
    .from(units,{opacity:0,duration:${n(0.5 / speed)},ease:'power1.in',stagger:{each:${n(stagger)},from:'random'}})
    .to(units,{opacity:0.78,duration:0.06,repeat:3,yoyo:true,stagger:{each:0.02,from:'random'}},'>-0.1');`
    case 'drop':
      return `tl.from(units,{yPercent:-180,opacity:0,duration:${n(1.1 / speed)},ease:'elastic.out(1,0.45)',stagger:${n(stagger)}});`
    default:
      return `tl.from(units,{opacity:0,y:20,duration:${n(0.8 / speed)},ease:'power2.out',stagger:${n(stagger)}});`
  }
}

/** The mood-background <canvas>, or '' when the hero has none. */
function bgMarkup(state: HeroState): string {
  return state.background === 'none' ? '' : '\n  <canvas class="ht-bg" aria-hidden="true"></canvas>'
}

/**
 * Inlined background runtime: serialize the SAME `runBackground` the app uses
 * (it's closure-free by design) and call it on load with the baked-in state, so
 * the exported hero animates identically. Wrapped in try/catch so a background
 * hiccup never blocks the headline. Returns '' for the 'none' background.
 */
function bgScript(state: HeroState): string {
  if (state.background === 'none') return ''
  const c = state.colors
  const colors = `{canvas:${JSON.stringify(c.canvas)},c1:${JSON.stringify(c.c1)},c2:${JSON.stringify(c.c2)},c3:${JSON.stringify(c.c3)}}`
  return `<script>
window.addEventListener('load', function () {
  var run = ${runBackground.toString()};
  var cv = document.querySelector('.herotype .ht-bg');
  try { if (cv) run(cv, ${JSON.stringify(state.background)}, ${colors}, ${n(state.bgIntensity)}, ${n(state.bgSpeed)}); } catch (e) {}
});
</script>
`
}

function sharedCss(state: HeroState, fontFamily: string, weight: number, tracking: string): string {
  const c = state.colors
  const tagFont = state.taglineFont ? `"${state.taglineFont}", sans-serif` : '"Space Mono", monospace'
  // Tasteful CRT scanline overlay for the Glitch effect (keyframe names prefixed
  // to avoid clashing with the host page).
  const crt =
    state.preset === 'glitch'
      ? `
  .herotype::before{content:'';position:absolute;inset:0;z-index:2;pointer-events:none;background:repeating-linear-gradient(to bottom,rgba(0,0,0,0) 0,rgba(0,0,0,0) 1.5px,rgba(0,0,0,.16) 2px,rgba(0,0,0,.16) 3px);animation:ht-crt-flicker 5s linear infinite,ht-crt-roll 7s linear infinite}
  @keyframes ht-crt-flicker{0%,100%{opacity:.6}47%{opacity:.6}50%{opacity:.42}53%{opacity:.62}92%{opacity:.6}95%{opacity:.78}97%{opacity:.55}}
  @keyframes ht-crt-roll{from{background-position-y:0}to{background-position-y:3px}}
  @media (prefers-reduced-motion:reduce){.herotype::before{animation:none}}`
      : ''
  return `  .herotype{
    --c1:${c.c1}; --c2:${c.c2}; --c3:${c.c3}; --canvas:${c.canvas};
    position:relative;
    background:var(--canvas); color:var(--c1);
    min-height:100vh; box-sizing:border-box; padding:6vmin;
    display:flex; flex-direction:column; justify-content:center;
    align-items:${ALIGN_ITEMS[state.align]}; text-align:${state.align};
    overflow:hidden;
  }
  .herotype .ht-bg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none}
  .herotype h1{
    position:relative; z-index:1;
    margin:0; font-family:${fontFamily}; font-weight:${weight};
    letter-spacing:${tracking}; line-height:.95;
    font-size:calc(clamp(2.6rem,9vw,8.5rem) * ${n(state.headlineScale)}); color:var(--c1); text-wrap:balance;
  }
  .herotype .ht-tag{
    position:relative; z-index:1;
    margin:1.4rem 0 0; font-family:${tagFont};
    font-size:calc(clamp(.7rem,1.3vw,.95rem) * ${n(state.taglineScale)}); letter-spacing:.28em;
    text-transform:uppercase; color:var(--c2);
  }
  .herotype .u{display:inline-block;will-change:transform,opacity,filter}
  .herotype .word{display:inline-block;white-space:nowrap}
  .herotype .space{display:inline-block;width:.28em}
  .herotype svg{position:relative;z-index:1;display:block;height:calc(clamp(3rem,13vw,9rem) * ${n(state.headlineScale)});width:auto;max-width:88vw;overflow:visible}${crt}`
}

function shell(state: HeroState, weights: number[], head: string, body: string): string {
  const def = presets[state.preset]
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>HEROTYPE — ${escAttr(state.headline)}</title>
<!-- HEROTYPE export · ${def.name} · ${state.palette || 'custom'} palette -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${fontsHref(state.font, weights, state.taglineFont)}" rel="stylesheet">
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>
${head}</head>
<body>
${body}</body>
</html>`
}

function buildSpans(state: HeroState, weights: number[]): string {
  const def = presets[state.preset]
  const fontFamily = `"${state.font || DEFAULT_FONT}", serif`
  const weight = state.weight || def.weight
  const head = `<style>
${sharedCss(state, fontFamily, weight, def.tracking)}
</style>
`
  const body = `<section class="herotype">${bgMarkup(state)}
  <h1 aria-label="${escAttr(state.headline)}">${splitMarkup(state.headline)}</h1>
  <p class="ht-tag">${esc(state.tagline)}</p>
</section>
${bgScript(state)}<script>
window.addEventListener('load', function () {
  var units = gsap.utils.toArray('.herotype .u');
  var tl = gsap.timeline();
  ${timelineJs(state.preset, state.speed, state.stagger)}
  gsap.fromTo('.herotype .ht-tag', { opacity: 0, y: 10 }, { opacity: 0.9, y: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' });
});
</script>
`
  return shell(state, weights, head, body)
}

function buildDraw(state: HeroState, weights: number[]): string {
  const def = presets[state.preset]
  const drawFamily = state.font || DEFAULT_FONT
  const fontFamily = `"${drawFamily}", serif`
  const weight = state.weight || def.weight
  // Chosen weight → same face @400 → bundled-equivalent Anton @400.
  const fontUrl = fontFileUrl(drawFamily, weight)
  const midUrl = fontFileUrl(drawFamily, 400)
  const fallbackUrl = fontFileUrl(DRAW_DEFAULT_FONT)
  const head = `<style>
${sharedCss(state, fontFamily, state.weight || def.weight, def.tracking)}
</style>
`
  const fillStep = state.drawFill
    ? `\n    tl.to(paths, { fillOpacity: 1, duration: ${n(0.5 / state.speed)}, ease: 'power2.out', stagger: ${n(state.stagger * 3 + 0.12)} }, '>-0.3');`
    : ''
  const body = `<section class="herotype">${bgMarkup(state)}
  <svg role="img" aria-label="${escAttr(state.headline)}"></svg>
  <p class="ht-tag">${esc(state.tagline)}</p>
</section>
${bgScript(state)}<script src="https://cdn.jsdelivr.net/npm/opentype.js@1.3.4/dist/opentype.min.js"></script>
<script>
window.addEventListener('load', function () {
  var SIZE = 200, TEXT = ${JSON.stringify(state.headline)};
  function draw(buf) {
    var font = opentype.parse(buf);
    var unit = SIZE / font.unitsPerEm, ascent = font.ascender * unit, descent = font.descender * unit;
    var svg = document.querySelector('.herotype svg');
    svg.setAttribute('viewBox', '0 0 ' + font.getAdvanceWidth(TEXT, SIZE) + ' ' + (ascent - descent));
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    font.getPaths(TEXT, 0, ascent, SIZE).forEach(function (p) {
      var d = p.toPathData(2); if (!d) return;
      var el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      el.setAttribute('d', d); el.setAttribute('class', 'glyph');
      el.setAttribute('fill', 'var(--c1)'); el.setAttribute('stroke', 'var(--c1)');
      el.setAttribute('stroke-width', '3'); el.setAttribute('stroke-linejoin', 'round'); el.setAttribute('stroke-linecap', 'round');
      svg.appendChild(el);
    });
    var paths = gsap.utils.toArray('.herotype .glyph');
    paths.forEach(function (p) { var len = p.getTotalLength(); gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 }); });
    var tl = gsap.timeline();
    tl.to(paths, { strokeDashoffset: 0, duration: ${n(1 / state.speed)}, ease: 'power1.inOut', stagger: ${n(state.stagger * 3 + 0.12)} });${fillStep}
    gsap.fromTo('.herotype .ht-tag', { opacity: 0, y: 10 }, { opacity: 0.9, y: 0, duration: 0.6, delay: 0.4, ease: 'power2.out' });
  }
  function load(url) { return fetch(url).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); }); }
  load(${JSON.stringify(fontUrl)})
    .catch(function () { return load(${JSON.stringify(midUrl)}); })
    .catch(function () { return load(${JSON.stringify(fallbackUrl)}); })
    .then(draw);
});
</script>
`
  return shell(state, weights, head, body)
}

export function buildExport(state: HeroState, weights: number[] = [400, 700]): string {
  return presets[state.preset].kind === 'draw'
    ? buildDraw(state, weights)
    : buildSpans(state, weights)
}
