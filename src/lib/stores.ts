import { useSyncExternalStore } from 'react'
import type { ProductId } from '../config'

function createStore<T>(initial: T) {
  let value = initial
  const subs = new Set<() => void>()
  return {
    get: () => value,
    set: (v: T) => { if (v !== value) { value = v; subs.forEach((f) => f()) } },
    use: () => useSyncExternalStore((cb) => { subs.add(cb); return () => { subs.delete(cb) } }, () => value),
  }
}
export const readyStore = createStore(false) // first 3D frame drawn (or 3D unavailable)
export const variantStore = createStore<ProductId>('chocolateChip')
export const renderGate = createStore(true) // false = pause WebGL while sections without 3D are on screen
export const webglStore = createStore<boolean | null>(null) // null = unknown yet
