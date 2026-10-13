import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useEffect, useLayoutEffect, useRef, useState, type ElementType, type ReactNode } from 'react'
import { useCart } from './cart/CartContext'
import { LANGS } from './i18n'
import { useLang } from './lib/lang'
import { readyStore, webglStore } from './lib/stores'
import { S } from './scene/store'

gsap.registerPlugin(ScrollTrigger)

export const Icon = {
  cart: (p: { className?: string }) => (<svg className={p.className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 7h13l-1.5 9.5a2 2 0 0 1-2 1.5H9.5a2 2 0 0 1-2-1.6L5.2 4H3" /><circle cx="10" cy="21" r="1" /><circle cx="17" cy="21" r="1" /></svg>),
  globe: () => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>),
  truck: () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M2 6h11v10H2zM13 9h4l3 3v4h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></svg>),
  close: () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M5 5l14 14M19 5L5 19" /></svg>),
  menu: () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M4 8h16M4 16h16" /></svg>),
}

/** Headline that reveals line by line. text uses "\n" for line breaks. */
export function Lines({ text, className = '', as: Tag = 'div', mode = 'scroll', delay = 0 }: { text: string; className?: string; as?: ElementType; mode?: 'scroll' | 'ready'; delay?: number }) {
  const ref = useRef<HTMLElement>(null)
  const done = useRef(false)
  const ready = readyStore.use()
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const inner = el.querySelectorAll('[data-in]')
    if (S.reduced || done.current) { gsap.set(inner, { yPercent: 0 }); return }
    gsap.set(inner, { yPercent: 115 })
    const play = () => { done.current = true; gsap.to(inner, { yPercent: 0, duration: 1.1, stagger: 0.12, ease: 'power4.out', delay }) }
    if (mode === 'ready') { if (ready) play(); return }
    const st = ScrollTrigger.create({ trigger: el, start: 'top 88%', once: true, onEnter: play })
    return () => st.kill()
  }, [text, ready, mode, delay])
  const lines = text.split('\n')
  return (
    <Tag ref={ref} className={className} aria-label={lines.join(' ')}>
      {lines.map((l, i) => (
        <span key={i} className="block overflow-hidden pt-[0.16em] -mt-[0.16em] pb-[0.1em] -mb-[0.1em]" aria-hidden><span data-in className="block will-change-transform">{l}</span></span>
      ))}
    </Tag>
  )
}

/** Fades + lifts its children in when scrolled into view */
export function Fade({ children, className = '', delay = 0, y = 36 }: { children: ReactNode; className?: string; delay?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current!
    if (S.reduced) return
    gsap.set(el, { opacity: 0, y })
    const st = ScrollTrigger.create({ trigger: el, start: 'top 90%', once: true, onEnter: () => gsap.to(el, { opacity: 1, y: 0, duration: 1, delay, ease: 'power3.out' }) })
    return () => { st.kill(); gsap.set(el, { clearProps: 'opacity,transform' }) }
  }, [delay, y])
  return <div ref={ref} className={className}>{children}</div>
}

export function Header() {
  const { t, lang, setLang } = useLang()
  const { count, setOpen } = useCart()
  const [langOpen, setLangOpen] = useState(false)
  const [menu, setMenu] = useState(false)
  const [solid, setSolid] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 40)
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    const onDoc = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setLangOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setLangOpen(false); setMenu(false) } }
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [])
  const links: [string, string][] = [['#story', t.nav.story], ['#cookies', t.nav.cookies], ['#ingredients', t.nav.ingredients], ['#reviews', t.nav.reviews], ['#order', t.nav.order]]
  const cur = LANGS.find((l) => l.code === lang)!
  return (
    <header className={`fixed top-0 inset-x-0 z-40 transition-colors duration-500 ${solid ? 'bg-espresso/70 backdrop-blur-md' : ''}`}>
      <div className="mx-auto flex items-center justify-between gap-4 px-5 md:px-10 h-16 md:h-20">
        <a href="#hero" className="display text-[1.15rem] md:text-[1.35rem] tracking-[0.04em] text-cream whitespace-nowrap" aria-label={t.brand}>
          SUGAR SHACK <span className="text-gold">COOKIES</span>
        </a>
        <nav className="hidden lg:flex items-center gap-9 text-[0.78rem] tracking-[0.14em] uppercase text-cream/80" aria-label="Primary">
          {links.map(([h, l]) => <a key={h} href={h} className="hover:text-gold transition-colors">{l}</a>)}
        </nav>
        <div className="flex items-center gap-1 md:gap-3">
          <div className="relative" ref={box}>
            <button className="flex items-center gap-2 px-3 py-2 rounded-full text-[0.78rem] tracking-widest text-cream/90 hover:text-gold transition-colors" onClick={() => setLangOpen((o) => !o)} aria-haspopup="listbox" aria-expanded={langOpen} aria-label={t.nav.language}>
              <Icon.globe /><span>{cur.short}</span>
            </button>
            {langOpen && (
              <ul role="listbox" aria-label={t.nav.language} className="absolute right-0 mt-2 min-w-[10.5rem] rounded-2xl border border-cream/10 bg-roast/95 backdrop-blur-md p-1.5 shadow-2xl">
                {LANGS.map((l) => (
                  <li key={l.code} role="option" aria-selected={l.code === lang}>
                    <button className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-colors ${l.code === lang ? 'bg-gold/15 text-gold' : 'text-cream/85 hover:bg-cream/5'}`} onClick={() => { setLang(l.code); setLangOpen(false) }}>{l.label}</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button className="relative p-2.5 text-cream hover:text-gold transition-colors" onClick={() => setOpen(true)} aria-label={`${t.nav.cart} (${count})`}>
            <Icon.cart />
            {count > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full bg-gold text-espresso text-[0.68rem] font-semibold grid place-items-center">{count}</span>}
          </button>
          <button className="lg:hidden p-2.5 text-cream" onClick={() => setMenu(true)} aria-label={t.nav.menu}><Icon.menu /></button>
        </div>
      </div>
      {menu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-espresso/97 backdrop-blur-xl flex flex-col px-6 py-5" role="dialog" aria-modal="true" aria-label={t.nav.menu}>
          <button className="self-end p-2.5 text-cream" onClick={() => setMenu(false)} aria-label={t.nav.close}><Icon.close /></button>
          <nav className="flex flex-col gap-5 mt-8">
            {links.map(([h, l]) => <a key={h} href={h} onClick={() => setMenu(false)} className="display text-4xl text-cream">{l}</a>)}
          </nav>
        </div>
      )}
    </header>
  )
}

export function Loader() {
  const { t } = useLang()
  const ready = readyStore.use()
  const [gone, setGone] = useState(false)
  const [force, setForce] = useState(false)
  useEffect(() => { const id = setTimeout(() => setForce(true), 4500); return () => clearTimeout(id) }, [])
  const hide = ready || force
  useEffect(() => { if (hide) { const id = setTimeout(() => setGone(true), 900); return () => clearTimeout(id) } }, [hide])
  if (gone) return null
  return (
    <div className={`fixed inset-0 z-[60] bg-espresso grid place-items-center transition-opacity duration-700 ${hide ? 'opacity-0 pointer-events-none' : 'opacity-100'}`} aria-live="polite">
      <div className="text-center px-6">
        <div className="display text-3xl md:text-5xl text-cream">SUGAR SHACK <span className="text-gold">COOKIES</span></div>
        <div className="mt-4 text-[0.7rem] tracking-[0.3em] uppercase text-cream/55">{t.loader.text}</div>
        <div className="mt-6 mx-auto h-px w-40 bg-cream/15 overflow-hidden"><div className="h-full w-1/2 bg-gold animate-[loadbar_1.2s_ease-in-out_infinite]" /></div>
      </div>
    </div>
  )
}

/** Photo-based stand-in for the 3D scene when WebGL is unavailable */
export function FallbackBg({ src = '/images/chocolate-chip.jpg', scrub = false }: { src?: string; scrub?: boolean }) {
  const ref = useRef<HTMLImageElement>(null)
  const w = webglStore.use()
  useEffect(() => {
    if (w !== false || !scrub || S.reduced || !ref.current) return
    const tw = gsap.fromTo(ref.current, { scale: 1.02 }, { scale: 1.3, ease: 'none', scrollTrigger: { trigger: ref.current.closest('section'), start: 'top top', end: 'bottom bottom', scrub: true } })
    return () => { tw.scrollTrigger?.kill(); tw.kill() }
  }, [w, scrub])
  if (w !== false) return null
  return (
    <div className="layer-bg overflow-hidden" aria-hidden>
      <img ref={ref} src={src} alt="" className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-b from-espresso/70 via-espresso/45 to-espresso/85" />
    </div>
  )
}
