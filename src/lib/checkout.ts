// ─────────────────────────────────────────────────────────────
// CHECKOUT INTEGRATION POINT
// Right now this does NOT take payments or create orders.
// To go live, replace the body of startCheckout() with your provider:
//   • Shopify Storefront API: cartCreate({ lines: [{ merchandiseId, quantity }] }) → redirect to cart.checkoutUrl
//   • Shopify Buy Button / Stripe Checkout / Snipcart / etc.
// Each CartLine carries a `sku` to map to your store's variant IDs (see src/config.ts).
// ─────────────────────────────────────────────────────────────
import type { ProductId } from '../config'

export interface CartLine { id: ProductId; sku: string; qty: number; unitPrice: number }
export type CheckoutResult = { status: 'not-configured' } | { status: 'redirect'; url: string }

export async function startCheckout(_lines: CartLine[]): Promise<CheckoutResult> {
  return { status: 'not-configured' }
}
