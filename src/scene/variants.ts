import type { ProductId } from '../config'

export interface Variant {
  id: ProductId
  crust: [string, string, string] // base, light, dark
  inner: [string, string] // broken-face dough light/dark
  fill: string // molten center
  fillGloss: number // 0 matte .. 1 glossy
  chunks: { color: string; w: number }[]
  chunkCount: number
  chunkSize: [number, number]
  pool: string | null // melted pools on top
  soft: { color: string; count: number; size: number; gloss: number } | null // berries / marshmallow puffs
  salt: boolean
}

export const VARIANTS: Record<ProductId, Variant> = {
  chocolateChip: {
    id: 'chocolateChip', crust: ['#b27a38', '#d19c52', '#68381a'], inner: ['#dca85c', '#b9803f'], fill: '#4a2210', fillGloss: 1,
    chunks: [{ color: '#2b140a', w: 5 }, { color: '#41200f', w: 3 }], chunkCount: 36, chunkSize: [0.13, 0.27], pool: '#5a2c14', soft: null, salt: true,
  },
  nutellaBrownie: {
    id: 'nutellaBrownie', crust: ['#3d1f13', '#5e301b', '#1b0c07'], inner: ['#52291a', '#2f160d'], fill: '#7a4423', fillGloss: 1,
    chunks: [{ color: '#1e0e08', w: 1 }], chunkCount: 24, chunkSize: [0.12, 0.24], pool: '#6a3a1c', soft: null, salt: false,
  },
  oreoMarshmallow: {
    id: 'oreoMarshmallow', crust: ['#6e4224', '#92602f', '#2f180c'], inner: ['#5f3a22', '#3b2112'], fill: '#f6f0e6', fillGloss: 0.3,
    chunks: [{ color: '#171110', w: 6 }, { color: '#efe5d1', w: 2 }], chunkCount: 32, chunkSize: [0.12, 0.26], pool: null,
    soft: { color: '#fbf7ef', count: 9, size: 0.17, gloss: 0.3 }, salt: false,
  },
  strawberryCheesecake: {
    id: 'strawberryCheesecake', crust: ['#caa05c', '#e2bd7e', '#8c5f2a'], inner: ['#e8cb90', '#d0a966'], fill: '#f0a0b0', fillGloss: 0.55,
    chunks: [{ color: '#f4ead4', w: 1 }], chunkCount: 22, chunkSize: [0.11, 0.22], pool: null,
    soft: { color: '#c71f31', count: 8, size: 0.16, gloss: 0.7 }, salt: false,
  },
  trioChocolate: {
    id: 'trioChocolate', crust: ['#b27a38', '#d19c52', '#68381a'], inner: ['#dca85c', '#b9803f'], fill: '#4a2210', fillGloss: 1,
    chunks: [{ color: '#2b140a', w: 3 }, { color: '#7d4a2a', w: 3 }, { color: '#f1e6cf', w: 3 }], chunkCount: 38, chunkSize: [0.13, 0.27], pool: '#4a2210', soft: null, salt: false,
  },
  biscoff: {
    id: 'biscoff', crust: ['#b9803f', '#d4a05a', '#7a4a22'], inner: ['#deac62', '#bb8344'], fill: '#c27a2e', fillGloss: 0.9,
    chunks: [{ color: '#b3763a', w: 3 }, { color: '#8a5524', w: 2 }], chunkCount: 28, chunkSize: [0.12, 0.26], pool: '#b8782c', soft: null, salt: false,
  },
}
export const VARIANT_ORDER: ProductId[] = ['chocolateChip', 'nutellaBrownie', 'oreoMarshmallow', 'strawberryCheesecake', 'trioChocolate', 'biscoff']
