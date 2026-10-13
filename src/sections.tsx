import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent } from 'react'
import { useCart } from './cart/CartContext'
import { Fade, FallbackBg, Icon, Lines } from './components'
import { PRODUCTS, SITE, type ProductId } from './config'
import { useLang, useMoney } from './lib/lang'
import { S } from './scene/store'

gsap.registerPlugin(ScrollTrigger)
const pad = (n: number) => String(n).padStart(2, '0')

export function Hero() {
  const { t } = useLang()
  const sub = useRef<HTMLDivElement>(null)
  const head = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (S.reduced || !head.current) return
    const tw = gsap.to(head.current, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '#hero', start: 'top top', end: 'bottom top', scrub: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [])
  return (
    <section id="hero" className="relative h-[100svh] min-h-[620px] overflow-hidden">
      <div className="layer-bg" style={{ background: 'radial-gradient(ellipse at 50% 55%, #2a1710 0%, #0b0706 68%)' }} />
      <FallbackBg />
      {/* giant headline sits BEHIND the 3D cookie (canvas is z-5) */}
      <div ref={head} className="absolute z-[3] inset-x-0 top-[13svh] md:top-[11svh] px-5 md:px-12 pointer-events-none">
        <Lines mode="ready" delay={0.5} as="h1" text={t.hero.h1} className="display d-xl text-cream/95 whitespace-pre-line text-shadow" />
      </div>
      <div ref={sub} className="layer-content absolute inset-x-0 bottom-0 px-5 md:px-12 pb-10 md:pb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Lines mode="ready" delay={1.1} text={t.hero.sub} className="text-lg md:text-2xl text-cream/90 max-w-md" />
          <a href="#break" className="btn btn-primary mt-6">{t.hero.cta}</a>
        </div>
        <a href="#break" className="hidden md:flex items-center gap-3 text-[0.7rem] tracking-[0.3em] uppercase text-cream/60" aria-label={t.hero.scroll}>
          {t.hero.scroll}<span className="block w-px h-12 bg-gold/80 animate-[scrollLine_2.4s_ease-in-out_infinite]" />
        </a>
      </div>
    </section>
  )
}

export function BreakSequence() {
  const { t } = useLang()
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current!
    const q = (s: string) => el.querySelector<HTMLElement>(s)!
    const items = [['.c1', 0.0, 0.17], ['.c2', 0.17, 0.33], ['.c3', 0.33, 0.5], ['.c4', 0.5, 0.74]] as const
    if (S.reduced) { gsap.set(el.querySelectorAll('.cap, .fin'), { opacity: 1 }); return }
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
    tl.set(el.querySelectorAll('.cap, .fin'), { opacity: 0 }, 0)
    items.forEach(([sel, a, b]) => {
      tl.fromTo(q(sel), { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.04, ease: 'none' }, Math.max(a, 0.005))
      tl.to(q(sel), { opacity: 0, y: -24, duration: 0.04, ease: 'none' }, b - 0.04)
    })
    tl.fromTo(el.querySelectorAll('.fin'), { opacity: 0, y: 50 }, { opacity: 1, y: 0, duration: 0.1, ease: 'none' }, 0.8)
    tl.fromTo(q('.hint'), { opacity: 1 }, { opacity: 0, duration: 0.04, ease: 'none' }, 0.04)
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
  }, [])
  return (
    <section id="break" ref={root} className="relative h-[560vh] md:h-[640vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <FallbackBg scrub />
        <div className="absolute inset-0 z-[8] pointer-events-none flex flex-col justify-between p-5 md:p-12 pt-24 md:pt-28">
          <div />
          <div className="relative min-h-[4rem]">
            {[t.brk.ch1, t.brk.ch2, t.brk.ch3, t.brk.ch4].map((c, i) => (
              <p key={i} className={`cap c${i + 1} absolute left-0 bottom-0 display text-[1.7rem] md:text-5xl text-cream text-shadow opacity-0`}>{c}</p>
            ))}
          </div>
        </div>
        <div className="hint absolute z-[8] bottom-6 left-1/2 -translate-x-1/2 text-[0.68rem] tracking-[0.3em] uppercase text-cream/60">{t.brk.hint}</div>
        <div className="fin absolute z-[3] inset-x-0 top-[13svh] md:top-[12svh] px-5 md:px-12 text-center md:text-left opacity-0 pointer-events-none">
          <h2 className="display d-lg text-cream whitespace-pre-line">{t.brk.h}</h2>
        </div>
        <p className="fin absolute z-10 inset-x-0 bottom-[7svh] px-5 md:px-12 text-center text-xs md:text-xl tracking-[0.16em] text-gold font-semibold text-shadow opacity-0 pointer-events-none">{t.brk.sub}</p>
      </div>
    </section>
  )
}

export function Story() {
  const { t } = useLang()
  return (
    <section id="story" className="relative h-[240vh]">
      <div className="layer-bg" style={{ background: 'linear-gradient(180deg, #0b0706, #130b08 40%, #0b0706)' }} />
      <div className="sticky top-0 h-[100svh] layer-content flex items-end md:items-center px-5 md:px-12 pb-14 md:pb-0">
        <div className="max-w-[46rem] md:max-w-[52%]">
          <Fade><p className="kicker mb-5">{t.intro.kicker}</p></Fade>
          <Lines as="h2" text={t.intro.h2} className="display d-md text-cream" />
          <Fade delay={0.15}><p className="mt-6 md:mt-8 text-cream/75 text-base md:text-lg leading-relaxed max-w-xl">{t.intro.body}</p></Fade>
          <Fade delay={0.25}>
            <ul className="mt-6 flex flex-wrap gap-2.5">
              {t.intro.points.map((p) => <li key={p} className="px-4 py-2 rounded-full border border-cream/20 text-xs md:text-sm text-cream/85">{p}</li>)}
            </ul>
          </Fade>
        </div>
      </div>
    </section>
  )
}

function AddButton({ id, qty = 1, className = '' }: { id: ProductId; qty?: number; className?: string }) {
  const { t } = useLang()
  const { add } = useCart()
  const [done, setDone] = useState(false)
  useEffect(() => { if (done) { const x = setTimeout(() => setDone(false), 1400); return () => clearTimeout(x) } }, [done])
  return (
    <button className={`btn ${done ? 'btn-ghost' : 'btn-primary'} ${className}`} onClick={() => { add(id, qty); setDone(true) }} aria-live="polite">
      {done ? `✓ ${t.products.added}` : t.products.add}
    </button>
  )
}

function Panel({ i }: { i: number }) {
  const { t } = useLang()
  const money = useMoney()
  const p = PRODUCTS[i]
  const flip = i % 2 === 0 // cookie on the right → text on the left
  const drag = useRef({ x: 0, y: 0, moved: 0, id: -1 })
  const down = (e: RPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: 0, id: e.pointerId }
    S.kick.dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const move = (e: RPointerEvent) => {
    if (!S.kick.dragging) return
    const dx = e.clientX - drag.current.x
    drag.current.x = e.clientX; drag.current.moved += Math.abs(dx)
    S.kick.vyaw = Math.max(-14, Math.min(14, dx * 0.55))
  }
  const up = () => {
    S.kick.dragging = false
    if (drag.current.moved < 6) { S.tapPulse = 1; S.kick.vyaw = 7 }
  }
  return (
    <article data-product-index={i} className="relative min-h-[100svh] flex items-end md:items-center overflow-hidden" aria-labelledby={`p-${p.id}`}>
      <div className="layer-bg">
        <img src={p.image} alt="" loading={i < 1 ? 'eager' : 'lazy'} decoding="async" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-espresso/55" />
        <div className={`absolute inset-0 hidden md:block ${flip ? 'bg-[linear-gradient(90deg,rgba(11,7,6,.93)_0%,rgba(11,7,6,.72)_42%,rgba(11,7,6,.2)_100%)]' : 'bg-[linear-gradient(270deg,rgba(11,7,6,.93)_0%,rgba(11,7,6,.72)_42%,rgba(11,7,6,.2)_100%)]'}`} />
        <div className="absolute inset-0 md:hidden bg-[linear-gradient(180deg,rgba(11,7,6,.25)_0%,rgba(11,7,6,.6)_38%,rgba(11,7,6,.95)_72%)]" />
      </div>
      {/* interactive area over the 3D cookie (drag / tap to turn it) */}
      <div
        className={`absolute z-[8] touch-pan-y cursor-grab active:cursor-grabbing ${flip ? 'md:right-0' : 'md:left-0'} md:w-[55%] md:inset-y-0 inset-x-0 top-[12svh] h-[44svh] md:h-auto md:top-0`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onPointerEnter={() => { S.hover = 1 }} onPointerLeave={() => { S.hover = 0 }}
        aria-hidden
      />
      <div className={`layer-content w-full px-5 md:px-12 pb-12 pt-24 md:py-24 flex ${flip ? 'justify-start' : 'justify-end'} pointer-events-none`}>
        <div className="max-w-xl pointer-events-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="kicker">{pad(i + 1)} / {pad(PRODUCTS.length)}</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-gold/50 bg-espresso/60 backdrop-blur px-3 py-1.5 text-[0.68rem] tracking-[0.12em] uppercase text-gold">
              <span className="w-1.5 h-1.5 rounded-full bg-gold animate-[pulseDot_2s_infinite]" /><Icon.truck />{t.products.badge}
            </span>
          </div>
          <Lines as="h3" text={t.products.items[p.id].name} className="display d-md text-cream text-shadow" />
          <Fade><p id={`p-${p.id}`} className="mt-4 md:mt-5 text-[0.95rem] md:text-base leading-relaxed text-cream/85 text-shadow">{t.products.items[p.id].desc}</p></Fade>
          <div className="mt-6 flex items-center gap-5 flex-wrap">
            <div><p className="text-[0.62rem] tracking-[0.2em] uppercase text-cream/50">{t.products.price}</p><p className="display text-3xl text-gold">{money(p.price)}</p></div>
            <AddButton id={p.id} />
          </div>
        </div>
      </div>
    </article>
  )
}

export function Products() {
  const { t } = useLang()
  return (
    <section id="cookies" className="relative">
      <div className="relative min-h-[78svh] flex items-end px-5 md:px-12 pb-14 pt-32" style={{ background: 'linear-gradient(180deg,#0b0706,#140b08)' }}>
        <div className="layer-content w-full flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <Fade><p className="kicker mb-5">{t.products.kicker}</p></Fade>
            <Lines as="h2" text={t.products.h2} className="display d-xl text-cream" />
          </div>
          <div className="md:max-w-xs md:pb-4"><p className="text-cream/70 text-lg">{t.products.body}</p><p className="mt-3 text-xs text-cream/45">{t.products.placeholder} · {t.products.tap}</p></div>
        </div>
      </div>
      {PRODUCTS.map((_, i) => <Panel key={i} i={i} />)}
    </section>
  )
}

export function Ingredients() {
  const { t } = useLang()
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current!
    const list = Array.from(el.querySelectorAll<HTMLElement>('.ing'))
    if (S.reduced) { gsap.set(list, { opacity: 1, y: 0 }); return }
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
    list.forEach((n, i) => tl.fromTo(n, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.1, ease: 'none' }, 0.22 + i * 0.12))
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
  }, [])
  return (
    <section id="ingredients" ref={root} className="relative h-[280vh]">
      <div className="layer-bg" style={{ background: 'radial-gradient(ellipse at 50% 50%, #24130c 0%, #0b0706 75%)' }} />
      <div className="sticky top-0 h-[100svh] layer-content px-5 md:px-12 pt-24 md:pt-28 pb-8 flex flex-col justify-between">
        <div className="max-w-2xl">
          <Fade><p className="kicker mb-4">{t.ingredients.kicker}</p></Fade>
          <Lines as="h2" text={t.ingredients.h2} className="display d-lg text-cream" />
          <p className="mt-4 text-cream/65 max-w-md hidden md:block">{t.ingredients.body}</p>
        </div>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-5 md:gap-8">
          {t.ingredients.items.map((it, i) => (
            <li key={i} className="ing border-t border-cream/20 pt-3 opacity-0">
              <p className="kicker mb-1">{pad(i + 1)}</p>
              <p className="display text-xl md:text-3xl text-cream">{it.name}</p>
              <p className="mt-1.5 text-xs md:text-sm text-cream/65 leading-snug">{it.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export function Closeup() {
  const { t } = useLang()
  const root = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = root.current!
    const list = Array.from(el.querySelectorAll<HTMLElement>('.cl'))
    if (S.reduced) { gsap.set(list, { opacity: 1, y: 0 }); return }
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top top', end: 'bottom bottom', scrub: 0.5 } })
    list.forEach((n, i) => {
      tl.fromTo(n, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.08, ease: 'none' }, 0.12 + i * 0.26)
      if (i < list.length - 1) tl.to(n, { opacity: 0, y: -26, duration: 0.08, ease: 'none' }, 0.12 + (i + 1) * 0.26 - 0.1)
    })
    return () => { tl.scrollTrigger?.kill(); tl.kill() }
  }, [])
  return (
    <section id="closeup" ref={root} className="relative h-[300vh]">
      <div className="layer-bg" style={{ background: 'radial-gradient(ellipse at 50% 50%, #2a150b 0%, #080504 80%)' }} />
      <FallbackBg src="/images/nutella-brownie.jpg" scrub />
      <div className="sticky top-0 h-[100svh] px-5 md:px-12 pt-24 md:pt-28 pb-12 flex flex-col justify-between pointer-events-none">
        <div className="absolute z-[3] inset-x-0 top-24 md:top-28 px-5 md:px-12">
          <Fade><p className="kicker mb-4">{t.closeup.kicker}</p></Fade>
          <Lines as="h2" text={t.closeup.h2} className="display d-lg text-cream" />
        </div>
        <div />
        <div className="relative z-10 h-24 md:h-28">
          {t.closeup.lines.map((l, i) => <p key={i} className="cl absolute left-0 bottom-0 text-xl md:text-4xl font-medium text-gold text-shadow opacity-0">{l}</p>)}
        </div>
      </div>
    </section>
  )
}

export function Social() {
  const { t } = useLang()
  return (
    <section id="reviews" className="relative px-5 md:px-12 py-28 md:py-40" style={{ background: 'linear-gradient(180deg,#0b0706,#120a07 50%,#0b0706)' }}>
      <div className="layer-content max-w-6xl mx-auto">
        <Fade><p className="kicker mb-5">{t.social.kicker}</p></Fade>
        <Lines as="h2" text={t.social.h2} className="display d-lg text-cream" />
        <Fade><p className="mt-6 inline-block rounded-full border border-amber/50 bg-amber/10 text-amber px-4 py-2 text-xs tracking-wider">{t.social.placeholder}</p></Fade>
        <div className="mt-14 grid md:grid-cols-12 gap-6 md:gap-8">
          {t.social.reviews.map((r, i) => (
            <Fade key={i} delay={i * 0.1} className={i === 0 ? 'md:col-span-7 md:row-span-2' : 'md:col-span-5'}>
              <figure className={`h-full rounded-3xl border border-cream/10 bg-cocoa/40 p-7 md:p-10 ${i === 0 ? 'md:p-14' : ''}`}>
                <span className="display text-6xl text-gold/80 leading-none block h-8" aria-hidden>“</span>
                <blockquote className={`mt-4 text-cream/90 leading-snug ${i === 0 ? 'display text-3xl md:text-5xl normal-case' : 'text-lg md:text-xl'}`}>{r.quote}</blockquote>
                <figcaption className="mt-6 text-xs tracking-[0.2em] uppercase text-cream/50">{r.who}</figcaption>
              </figure>
            </Fade>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Order() {
  const { t } = useLang()
  const money = useMoney()
  const { add, lines, subtotal, setQty, setOpen, count } = useCart()
  const [sel, setSel] = useState<ProductId>('chocolateChip')
  const [qty, setQ] = useState(2)
  const [flash, setFlash] = useState(false)
  useEffect(() => { if (flash) { const x = setTimeout(() => setFlash(false), 1500); return () => clearTimeout(x) } }, [flash])
  const prod = PRODUCTS.find((p) => p.id === sel)!
  return (
    <section id="order" className="relative px-5 md:px-12 py-28 md:py-40" style={{ background: '#110a07' }}>
      <div className="layer-content max-w-6xl mx-auto grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <Fade><p className="kicker mb-5">{t.order.kicker}</p></Fade>
          <Lines as="h2" text={t.order.h2} className="display d-lg text-cream" />
          <p className="mt-6 text-cream/70 text-lg max-w-sm">{t.order.body}</p>
          <div className="mt-10 rounded-3xl border border-cream/10 p-6 bg-espresso/40">
            <p className="kicker mb-4">{t.order.yourOrder}</p>
            {lines.length === 0 ? <p className="text-cream/50 text-sm">{t.order.empty}</p> : (
              <ul className="space-y-3">
                {lines.map(({ product, qty: q }) => (
                  <li key={product.id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-cream/90">{t.products.items[product.id].name}</span>
                    <span className="inline-flex items-center gap-2 text-cream/70">
                      <button className="w-7 h-7 rounded-full border border-cream/20 hover:border-gold" onClick={() => setQty(product.id, q - 1)} aria-label={t.cart.decrease}>−</button>
                      <span className="w-5 text-center">{q}</span>
                      <button className="w-7 h-7 rounded-full border border-cream/20 hover:border-gold" onClick={() => setQty(product.id, q + 1)} aria-label={t.cart.increase}>+</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-5 pt-4 border-t border-cream/10 flex items-center justify-between">
              <span className="text-cream/70 text-sm">{t.cart.subtotal}</span><span className="display text-2xl text-gold">{money(subtotal)}</span>
            </div>
            <button className="btn btn-ghost w-full mt-4 disabled:opacity-40 disabled:pointer-events-none" disabled={count === 0} onClick={() => setOpen(true)}>{t.order.viewCart}</button>
          </div>
        </div>
        <div className="lg:col-span-7">
          <p className="text-[0.7rem] tracking-[0.2em] uppercase text-cream/55 mb-4" id="choose-label">{t.order.choose}</p>
          <div role="radiogroup" aria-labelledby="choose-label" className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PRODUCTS.map((p) => (
              <button key={p.id} role="radio" aria-checked={sel === p.id} onClick={() => setSel(p.id)}
                className={`group relative overflow-hidden rounded-2xl text-left aspect-[4/3] border transition-all ${sel === p.id ? 'border-gold ring-2 ring-gold/40' : 'border-cream/10 hover:border-cream/40'}`}>
                <img src={p.image} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <span className="absolute inset-0 bg-gradient-to-t from-espresso via-espresso/40 to-espresso/10" />
                <span className="absolute bottom-0 inset-x-0 p-3.5"><span className="block text-[0.85rem] leading-tight text-cream font-medium">{t.products.items[p.id].name}</span><span className="block text-xs text-gold mt-1">{money(p.price)}</span></span>
              </button>
            ))}
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-[0.7rem] tracking-[0.2em] uppercase text-cream/55 mb-2">{t.order.quantity}</p>
              <div className="inline-flex items-center rounded-full border border-cream/25">
                <button className="w-12 h-12 text-xl hover:text-gold" onClick={() => setQ((q) => Math.max(1, q - 1))} aria-label={t.cart.decrease}>−</button>
                <span className="w-10 text-center text-lg" aria-live="polite">{qty}</span>
                <button className="w-12 h-12 text-xl hover:text-gold" onClick={() => setQ((q) => Math.min(99, q + 1))} aria-label={t.cart.increase}>+</button>
              </div>
            </div>
            <div className="flex-1 min-w-[12rem]">
              <p className="text-[0.7rem] tracking-[0.2em] uppercase text-cream/55 mb-2">{t.cart.total}</p>
              <p className="display text-4xl text-gold">{money(prod.price * qty)}</p>
            </div>
            <button className={`btn ${flash ? 'btn-ghost' : 'btn-primary'} w-full sm:w-auto`} onClick={() => { add(sel, qty); setFlash(true) }} aria-live="polite">{flash ? `✓ ${t.order.added}` : t.order.add}</button>
          </div>
          <p className="mt-5 text-xs text-cream/45 inline-flex items-center gap-2"><Icon.truck />{t.products.badge} · {t.products.placeholder}</p>
        </div>
      </div>
    </section>
  )
}

export function Final() {
  const { t } = useLang()
  return (
    <section id="final" className="relative h-[210vh]">
      <div className="layer-bg" style={{ background: 'radial-gradient(ellipse at 50% 55%, #2c170d 0%, #0b0706 72%)' }} />
      <FallbackBg src="/images/trio-chocolate.jpg" />
      <div className="sticky top-0 h-[100svh] pointer-events-none">
        <div className="absolute z-[3] inset-x-0 top-[14svh] px-5 md:px-12 text-center">
          <Lines as="h2" text={t.final.h2} className="display d-xl text-cream" />
        </div>
        <div className="absolute z-10 inset-x-0 bottom-[8svh] flex justify-center"><a href="#order" className="btn btn-primary pointer-events-auto text-sm">{t.final.cta}</a></div>
      </div>
    </section>
  )
}

export function Footer() {
  const { t } = useLang()
  const links: [string, string][] = [[SITE.instagram, t.footer.instagram], [`mailto:${SITE.email}`, t.footer.contact], [SITE.shipping, t.footer.shipping], [SITE.faq, t.footer.faq]]
  return (
    <footer className="relative z-10 bg-espresso border-t border-cream/10 px-5 md:px-12 py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div><p className="display text-2xl text-cream">SUGAR SHACK <span className="text-gold">COOKIES</span></p><p className="mt-2 text-sm text-cream/55">{t.footer.tagline}</p></div>
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-cream/75" aria-label="Footer">
          {links.map(([h, l]) => <a key={l} href={h} className="hover:text-gold transition-colors">{l}</a>)}
        </nav>
      </div>
      <p className="max-w-6xl mx-auto mt-10 text-xs text-cream/35">© {new Date().getFullYear()} Sugar Shack Cookies. {t.footer.rights}</p>
    </footer>
  )
}
