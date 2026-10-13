import { useEffect, useRef } from 'react'
import { Icon } from '../components'
import { useLang, useMoney } from '../lib/lang'
import { useCart } from './CartContext'

export function CartDrawer() {
  const { t } = useLang()
  const money = useMoney()
  const { open, setOpen, lines, subtotal, setQty, remove, checkout, checkoutNotice, setCheckoutNotice } = useCart()
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!open) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { if (checkoutNotice) setCheckoutNotice(false); else setOpen(false) } }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev }
  }, [open, checkoutNotice, setOpen, setCheckoutNotice])

  return (
    <div className={`fixed inset-0 z-[55] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
      <aside role="dialog" aria-modal="true" aria-label={t.cart.title} className={`absolute right-0 top-0 h-full w-full max-w-md bg-roast border-l border-cream/10 flex flex-col transition-transform duration-500 ease-[cubic-bezier(.2,.8,.2,1)] ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between px-6 h-20 border-b border-cream/10">
          <h2 className="display text-2xl text-cream">{t.cart.title}</h2>
          <button ref={closeRef} onClick={() => setOpen(false)} className="p-2 text-cream/80 hover:text-gold" aria-label={t.cart.close}><Icon.close /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {lines.length === 0 ? (
            <div className="h-full grid place-items-center text-center text-cream/60">
              <div><p className="display text-3xl text-cream mb-2">{t.cart.empty}</p><p className="text-sm">{t.cart.emptyHint}</p></div>
            </div>
          ) : (
            <ul className="divide-y divide-cream/10">
              {lines.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-4 py-5">
                  <img src={product.image} alt="" className="w-20 h-20 rounded-xl object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-3">
                      <p className="font-medium text-cream leading-snug">{t.products.items[product.id].name}</p>
                      <p className="text-gold whitespace-nowrap">{money(product.price * qty)}</p>
                    </div>
                    <p className="text-xs text-cream/50 mt-0.5">{money(product.price)}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="inline-flex items-center rounded-full border border-cream/20">
                        <button className="w-9 h-9 text-lg text-cream/80 hover:text-gold" onClick={() => setQty(product.id, qty - 1)} aria-label={t.cart.decrease}>−</button>
                        <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
                        <button className="w-9 h-9 text-lg text-cream/80 hover:text-gold" onClick={() => setQty(product.id, qty + 1)} aria-label={t.cart.increase}>+</button>
                      </div>
                      <button className="text-xs text-cream/50 hover:text-gold underline underline-offset-4" onClick={() => remove(product.id)}>{t.cart.remove}</button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="border-t border-cream/10 px-6 py-5 space-y-3">
          <div className="flex justify-between text-sm text-cream/70"><span>{t.cart.subtotal}</span><span>{money(subtotal)}</span></div>
          <div className="flex justify-between text-lg text-cream"><span>{t.cart.total}</span><span className="text-gold">{money(subtotal)}</span></div>
          <p className="text-xs text-cream/45">{t.cart.shippingNote} {t.cart.priceNote}</p>
          <button className="btn btn-primary w-full disabled:opacity-40 disabled:pointer-events-none" disabled={lines.length === 0} onClick={() => { void checkout() }}>{t.cart.checkout}</button>
        </div>
      </aside>
      {checkoutNotice && (
        <div className="absolute inset-0 z-10 grid place-items-center p-6 bg-black/70" onClick={() => setCheckoutNotice(false)}>
          <div role="alertdialog" aria-modal="true" aria-label={t.cart.checkoutTitle} className="max-w-sm rounded-3xl bg-roast border border-gold/30 p-7" onClick={(e) => e.stopPropagation()}>
            <h3 className="display text-2xl text-cream mb-3">{t.cart.checkoutTitle}</h3>
            <p className="text-sm text-cream/75 leading-relaxed">{t.cart.checkoutBody}</p>
            <button className="btn btn-primary mt-6 w-full" onClick={() => setCheckoutNotice(false)} autoFocus>{t.cart.checkoutClose}</button>
          </div>
        </div>
      )}
    </div>
  )
}
