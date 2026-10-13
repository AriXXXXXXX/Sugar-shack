import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState, type ReactNode } from 'react'
import { PRODUCTS, type ProductId } from '../config'
import { startCheckout, type CheckoutResult } from '../lib/checkout'

const KEY = 'ssc-cart'
type Items = Partial<Record<ProductId, number>>
type Action = { type: 'add'; id: ProductId; qty: number } | { type: 'set'; id: ProductId; qty: number } | { type: 'remove'; id: ProductId } | { type: 'load'; items: Items }

function reducer(s: Items, a: Action): Items {
  switch (a.type) {
    case 'add': return { ...s, [a.id]: Math.min(99, (s[a.id] ?? 0) + a.qty) }
    case 'set': { const n = { ...s }; if (a.qty <= 0) delete n[a.id]; else n[a.id] = Math.min(99, a.qty); return n }
    case 'remove': { const n = { ...s }; delete n[a.id]; return n }
    case 'load': return a.items
  }
}

interface Ctx {
  items: Items
  lines: { product: (typeof PRODUCTS)[number]; qty: number }[]
  count: number
  subtotal: number
  open: boolean
  setOpen: (o: boolean) => void
  add: (id: ProductId, qty?: number) => void
  setQty: (id: ProductId, qty: number) => void
  remove: (id: ProductId) => void
  checkout: () => Promise<CheckoutResult>
  checkoutNotice: boolean
  setCheckoutNotice: (b: boolean) => void
}
const CartCtx = createContext<Ctx>(null as unknown as Ctx)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(reducer, {})
  const [open, setOpen] = useState(false)
  const [checkoutNotice, setCheckoutNotice] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Items
        const clean: Items = {}
        for (const p of PRODUCTS) if (typeof parsed[p.id] === 'number' && parsed[p.id]! > 0) clean[p.id] = parsed[p.id]
        dispatch({ type: 'load', items: clean })
      }
    } catch { /* ignore */ }
  }, [])
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore */ } }, [items])

  const add = useCallback((id: ProductId, qty = 1) => dispatch({ type: 'add', id, qty }), [])
  const setQty = useCallback((id: ProductId, qty: number) => dispatch({ type: 'set', id, qty }), [])
  const remove = useCallback((id: ProductId) => dispatch({ type: 'remove', id }), [])

  const lines = useMemo(() => PRODUCTS.filter((p) => items[p.id]).map((p) => ({ product: p, qty: items[p.id]! })), [items])
  const count = lines.reduce((n, l) => n + l.qty, 0)
  const subtotal = lines.reduce((n, l) => n + l.qty * l.product.price, 0)

  const checkout = useCallback(async () => {
    const res = await startCheckout(lines.map((l) => ({ id: l.product.id, sku: l.product.sku, qty: l.qty, unitPrice: l.product.price })))
    if (res.status === 'redirect') window.location.href = res.url
    else setCheckoutNotice(true)
    return res
  }, [lines])

  const value = useMemo(() => ({ items, lines, count, subtotal, open, setOpen, add, setQty, remove, checkout, checkoutNotice, setCheckoutNotice }), [items, lines, count, subtotal, open, add, setQty, remove, checkout, checkoutNotice])
  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>
}
export const useCart = () => useContext(CartCtx)
