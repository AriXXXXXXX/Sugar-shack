import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { renderGate, variantStore } from './lib/stores'
import { VARIANT_ORDER } from './scene/variants'
import { S, type SectionKey } from './scene/store'

gsap.registerPlugin(ScrollTrigger)

const NO3D: SectionKey[] = ['social', 'order']

/** Wires page sections to scene state. Returns a cleanup function. */
export function initScroll() {
  const ctxs: ScrollTrigger[] = []
  const add = (v: ScrollTrigger.Vars) => ctxs.push(ScrollTrigger.create(v))
  const prog = (key: string, sel: string, start: string, end: string) => {
    if (!document.querySelector(sel)) return
    add({ trigger: sel, start, end, onUpdate: (s) => { S.p[key] = s.progress }, onRefresh: (s) => { S.p[key] = s.progress } })
  }
  prog('hero', '#hero', 'top top', 'bottom top')
  prog('brk', '#break', 'top top', 'bottom bottom')
  prog('intro', '#story', 'top center', 'bottom center')
  prog('prod', '#cookies', 'top bottom', 'bottom top')
  prog('ingr', '#ingredients', 'top top', 'bottom bottom')
  prog('close', '#closeup', 'top top', 'bottom bottom')
  prog('final', '#final', 'top bottom', 'bottom bottom')

  const activate = (key: SectionKey) => {
    S.active = key
    renderGate.set(!NO3D.includes(key))
    // the signature chocolate chip cookie everywhere except the product showcase
    variantStore.set(key === 'prod' ? VARIANT_ORDER[S.prodIndex] : 'chocolateChip')
  }
  const sections: [SectionKey, string][] = [
    ['hero', '#hero'], ['brk', '#break'], ['intro', '#story'], ['prod', '#cookies'], ['ingr', '#ingredients'],
    ['close', '#closeup'], ['social', '#reviews'], ['order', '#order'], ['final', '#final'],
  ]
  for (const [key, sel] of sections) {
    if (!document.querySelector(sel)) continue
    add({ trigger: sel, start: 'top 52%', end: 'bottom 52%', onEnter: () => activate(key), onEnterBack: () => activate(key), onRefresh: (s) => { if (s.isActive) activate(key) } })
  }
  document.querySelectorAll<HTMLElement>('[data-product-index]').forEach((el) => {
    const i = Number(el.dataset.productIndex)
    add({
      trigger: el, start: 'top 55%', end: 'bottom 55%',
      onToggle: (s) => { if (s.isActive) { S.prodIndex = i; if (S.active === 'prod') variantStore.set(VARIANT_ORDER[i]) } },
      onRefresh: (s) => { if (s.isActive) { S.prodIndex = i; if (S.active === 'prod') variantStore.set(VARIANT_ORDER[i]) } },
    })
  })
  ScrollTrigger.refresh()
  return () => ctxs.forEach((c) => c.kill())
}
export { ScrollTrigger }
