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
  // Canvas-2D effects (lightweight)
  { key: 'aurora', name: 'Aurora', desc: 'soft drifting glow' },
  { key: 'particles', name: 'Particles', desc: 'floating dust' },
  // WebGL shader effects (sophisticated)
  { key: 'plasma', name: 'Plasma', desc: 'liquid marble' },
  { key: 'mesh', name: 'Mesh', desc: 'gradient flow' },
  { key: 'chrome', name: 'Chrome', desc: 'iridescent metal' },
  { key: 'dots', name: 'Dot field', desc: 'twinkling grid' },
]

/** Kinds rendered with WebGL (vs Canvas 2D). The canvas element must be
 *  remounted when crossing this boundary — a canvas is locked to one context
 *  type for its lifetime. */
export const GL_BG_KEYS = ['plasma', 'mesh', 'chrome', 'dots']

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
  if (type === 'none') {
    const c0 = canvas.getContext('2d')
    if (c0) c0.clearRect(0, 0, canvas.width, canvas.height)
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
  const cv = rgb(colors.canvas)
  const css = (c: number[], a: number) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'

  // ── WebGL shader backgrounds (plasma / mesh / chrome / dots) ──────────────
  // Self-contained: one full-screen triangle + a fragment shader that branches
  // on the kind. Themed by palette uniforms; `inten` keeps it muted so the
  // headline stays readable. Falls back to a flat fill if WebGL is unavailable.
  if (type === 'plasma' || type === 'mesh' || type === 'chrome' || type === 'dots') {
    const gl = (canvas.getContext('webgl', { antialias: true, alpha: false }) ||
      canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null
    if (!gl) return () => {}
    const kind = type === 'plasma' ? 0 : type === 'mesh' ? 1 : type === 'chrome' ? 2 : 3

    const VERT = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.0,1.0);}'
    const FRAG = `precision highp float;
uniform vec2 uRes;uniform float uTime;uniform float uInten;uniform int uKind;
uniform vec3 uC1;uniform vec3 uC2;uniform vec3 uC3;uniform vec3 uBg;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);float a=hash(i),b=hash(i+vec2(1.,0.)),c=hash(i+vec2(0.,1.)),d=hash(i+vec2(1.,1.));vec2 u=f*f*(3.-2.*f);return mix(mix(a,b,u.x),mix(c,d,u.x),u.y);}
float fbm(vec2 p){float s=0.,a=0.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<5;i++){s+=a*vn(p);p=m*p;a*=0.5;}return s;}
vec3 iris(float t){return 0.5+0.5*cos(6.2831853*(vec3(0.0,0.33,0.67)+t));}
void main(){
  vec2 uv=gl_FragCoord.xy/uRes;
  vec2 p=(gl_FragCoord.xy-0.5*uRes)/min(uRes.x,uRes.y);
  float tm=uTime;vec3 col=uBg;
  if(uKind==0){
    vec2 q=vec2(fbm(p*2.2+tm*0.08),fbm(p*2.2+vec2(5.2,1.3)-tm*0.10));
    vec2 r=vec2(fbm(p*2.2+2.2*q+tm*0.12+1.7),fbm(p*2.2+2.2*q-tm*0.11+8.3));
    float f=clamp(fbm(p*2.2+3.0*r),0.0,1.0);
    vec3 g=mix(uC1,uC2,smoothstep(0.05,0.65,f));
    g=mix(g,uC3,smoothstep(0.5,1.0,f));
    g*=0.18+0.95*smoothstep(0.12,0.7,f);
    col=g;
  }else if(uKind==1){
    float w=fbm(p*0.9+tm*0.05)*1.5;
    float a=0.5+0.5*sin(p.x*1.6+w+tm*0.22);
    float b=0.5+0.5*sin(p.y*1.5+w*1.2-tm*0.18+2.0);
    float c=0.5+0.5*sin((p.x+p.y)*1.2+w-tm*0.15+4.0);
    vec3 g=mix(uC1,uC2,a);g=mix(g,uC3,b);g=mix(g,uC1,c*0.4);col=g;
  }else if(uKind==2){
    // Full-bleed liquid chrome: a domain-warped height field, shaded as polished
    // metal — crisp light/dark reflection bands from the surface normal, a sharp
    // specular, iridescent sheen at grazing angles, and a faint palette tint.
    vec2 w=vec2(fbm(p*1.5+tm*0.10),fbm(p*1.5-tm*0.08+3.1));
    float e=0.012;
    float hC=fbm(p*1.8+1.5*w+tm*0.05);
    float hX=fbm((p+vec2(e,0.0))*1.8+1.5*w+tm*0.05);
    float hY=fbm((p+vec2(0.0,e))*1.8+1.5*w+tm*0.05);
    vec3 nrm=normalize(vec3(-(hX-hC)/e*0.4,-(hY-hC)/e*0.4,1.0));
    float refl=nrm.y;
    float bands=smoothstep(0.35,0.65,0.5+0.5*sin(refl*8.0+tm*0.4));
    vec3 metal=mix(vec3(0.04),vec3(0.98),bands);
    metal+=pow(clamp(nrm.z,0.0,1.0),6.0)*0.4;
    metal=mix(metal,iris(refl*1.2+tm*0.05),(1.0-nrm.z)*0.3);
    metal*=mix(vec3(1.0),clamp(uC3*2.0,0.0,1.0),0.12);
    col=metal;
  }else{
    vec2 sc=vec2(uRes.x/uRes.y,1.0)*42.0;
    vec2 gp=fract(uv*sc)-0.5;float d=length(gp);
    float tw=0.5+0.5*sin(tm*1.8+hash(floor(uv*sc))*40.0);
    float dt=smoothstep(0.16,0.06,d)*(0.25+0.75*tw);
    col=mix(uBg,uC2,dt*0.7);
  }
  col=mix(uBg,col,clamp(0.22+0.55*uInten,0.0,1.0));
  gl_FragColor=vec4(col,1.0);
}`

    const sh = (src: string, k: number) => {
      const s = gl.createShader(k) as WebGLShader
      gl.shaderSource(s, src)
      gl.compileShader(s)
      return s
    }
    const prog = gl.createProgram() as WebGLProgram
    const vs = sh(VERT, gl.VERTEX_SHADER)
    const fs = sh(FRAG, gl.FRAGMENT_SHADER)
    gl.attachShader(prog, vs)
    gl.attachShader(prog, fs)
    gl.linkProgram(prog)
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      // Shader failed (e.g. no highp): clear to the canvas colour and bail.
      gl.clearColor(cv[0] / 255, cv[1] / 255, cv[2] / 255, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      return () => {}
    }
    gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
    const aLoc = gl.getAttribLocation(prog, 'p')
    gl.enableVertexAttribArray(aLoc)
    gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(prog, name)
    gl.uniform1i(u('uKind'), kind)
    gl.uniform3f(u('uC1'), c1[0] / 255, c1[1] / 255, c1[2] / 255)
    gl.uniform3f(u('uC2'), c2[0] / 255, c2[1] / 255, c2[2] / 255)
    gl.uniform3f(u('uC3'), c3[0] / 255, c3[1] / 255, c3[2] / 255)
    gl.uniform3f(u('uBg'), cv[0] / 255, cv[1] / 255, cv[2] / 255)
    gl.uniform1f(u('uInten'), inten)
    const uResL = u('uRes')
    const uTimeL = u('uTime')

    const glResize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const r = canvas.getBoundingClientRect()
      canvas.width = Math.max(1, Math.floor(r.width * dpr))
      canvas.height = Math.max(1, Math.floor(r.height * dpr))
      gl.viewport(0, 0, canvas.width, canvas.height)
    }
    glResize()

    let graf = 0
    let gt = 0
    let glast = 0
    const gframe = (now: number) => {
      graf = requestAnimationFrame(gframe)
      if (!glast) glast = now
      const dt = Math.min(0.05, (now - glast) / 1000)
      glast = now
      gt += dt * spd
      gl.uniform2f(uResL, canvas.width, canvas.height)
      gl.uniform1f(uTimeL, gt)
      gl.drawArrays(gl.TRIANGLES, 0, 3)
    }
    graf = requestAnimationFrame(gframe)
    const onGlResize = () => glResize()
    window.addEventListener('resize', onGlResize)
    return () => {
      cancelAnimationFrame(graf)
      window.removeEventListener('resize', onGlResize)
      gl.deleteProgram(prog)
      gl.deleteShader(vs)
      gl.deleteShader(fs)
      gl.deleteBuffer(buf)
    }
  }

  const ctx = canvas.getContext('2d')
  if (!ctx) return () => {}

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
