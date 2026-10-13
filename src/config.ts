// ─────────────────────────────────────────────────────────────
// SITE CONFIG: edit prices, links and contact details here.
// All visible words live in src/i18n.ts.
// ─────────────────────────────────────────────────────────────
export const CURRENCY = { code: 'USD' } // PLACEHOLDER: change to your real currency (e.g. 'THB', 'EUR')

export const SITE = {
  instagram: '#', // TODO: your Instagram URL
  email: 'hello@example.com', // TODO: your contact email
  shipping: '#shipping', // TODO: link to your shipping info page
  faq: '#faq', // TODO: link to your FAQ page
}

export type ProductId = 'chocolateChip' | 'nutellaBrownie' | 'oreoMarshmallow' | 'strawberryCheesecake' | 'trioChocolate' | 'biscoff'

export interface Product {
  id: ProductId
  image: string
  price: number // PLACEHOLDER prices
  sku: string // TODO: map to your Shopify variant / store SKU
}

export const PRODUCTS: Product[] = [
  { id: 'chocolateChip', image: '/images/chocolate-chip.jpg', price: 4.5, sku: 'SSC-CHOC-CHIP' },
  { id: 'nutellaBrownie', image: '/images/nutella-brownie.jpg', price: 5.0, sku: 'SSC-NUTELLA-BROWNIE' },
  { id: 'oreoMarshmallow', image: '/images/oreo-marshmallow.jpg', price: 5.0, sku: 'SSC-OREO-MARSH' },
  { id: 'strawberryCheesecake', image: '/images/strawberry-cheesecake.jpg', price: 5.5, sku: 'SSC-STRAWB-CHEESE' },
  { id: 'trioChocolate', image: '/images/trio-chocolate.jpg', price: 5.0, sku: 'SSC-TRIO-CHOC' },
  { id: 'biscoff', image: '/images/biscoff-cookie.jpg', price: 5.0, sku: 'SSC-BISCOFF' },
]
