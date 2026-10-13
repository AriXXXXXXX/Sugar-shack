import { Component, lazy, Suspense, useEffect, type ReactNode } from 'react'
import { CartProvider } from './cart/CartContext'
import { CartDrawer } from './cart/CartDrawer'
import { Header, Loader } from './components'
import { LangProvider, useLang } from './lib/lang'
import { readyStore, webglStore } from './lib/stores'
import { initScroll } from './scroll'
import { S } from './scene/store'
import { BreakSequence, Closeup, Final, Footer, Hero, Ingredients, Order, Products, Social, Story } from './sections'

const Experience = lazy(() => import('./scene/Experience'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch { return false }
}

class Boundary extends Component<{ children: ReactNode }, { err: boolean }> {
  state = { err: false }
  static getDerivedStateFromError() { return { err: true } }
  componentDidCatch() { webglStore.set(false); readyStore.set(true) }
  render() { return this.state.err ? null : this.props.children }
}

function Page() {
  const { t } = useLang()
  const gl = webglStore.use()
  useEffect(() => {
    const mqR = matchMedia('(prefers-reduced-motion: reduce)')
    const upd = () => { S.reduced = mqR.matches; S.mobile = innerWidth < 768 }
    upd(); mqR.addEventListener('change', upd); addEventListener('resize', upd)
    const ok = hasWebGL()
    webglStore.set(ok)
    if (!ok) readyStore.set(true)
    const onMove = (e: PointerEvent) => { if (e.pointerType === 'mouse') { S.pointer.x = (e.clientX / innerWidth) * 2 - 1; S.pointer.y = (e.clientY / innerHeight) * 2 - 1 } }
    addEventListener('pointermove', onMove)
    const kill = initScroll()
    return () => { kill(); removeEventListener('pointermove', onMove); removeEventListener('resize', upd); mqR.removeEventListener('change', upd) }
  }, [])
  return (
    <>
      <Loader />
      <Header />
      {gl && <Boundary><Suspense fallback={null}><Experience /></Suspense></Boundary>}
      <div className="vignette" />
      <div className="grain" />
      <main>
        <Hero />
        <BreakSequence />
        <Story />
        <Products />
        <Ingredients />
        <Closeup />
        <Social />
        <Order />
        <Final />
      </main>
      <Footer />
      <CartDrawer />
      {gl === false && <p className="fixed bottom-3 left-3 z-20 text-[0.7rem] text-cream/50 max-w-[16rem]">{t.fallback.note}</p>}
    </>
  )
}

export default function App() {
  useEffect(() => { document.documentElement.classList.add('js') }, [])
  return <LangProvider><CartProvider><Page /></CartProvider></LangProvider>
}
