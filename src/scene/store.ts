import type * as THREE from 'three'

export type SectionKey = 'hero' | 'brk' | 'intro' | 'prod' | 'ingr' | 'close' | 'social' | 'order' | 'final'

// Mutable scene state: written by scroll/pointer handlers, read every frame (no React re-renders).
export const S = {
  intro: 0, // entrance 0..1
  p: { hero: 0, brk: 0, intro: 0, prod: 0, ingr: 0, close: 0, final: 0 } as Record<string, number>,
  active: 'hero' as SectionKey,
  prodIndex: 0,
  pointer: { x: 0, y: 0 },
  kick: { yaw: 0, tilt: 0, vyaw: 0, dragging: false },
  hover: 0,
  mobile: false,
  reduced: false,
  tapPulse: 0,
}

export interface Pose {
  show: number; cx: number; cy: number; sc: number; z: number
  tilt: number; yaw: number; spin: number; auto: number
  sep: number; hinge: number; crack: number; ingr: number
  loop: number; dripT: number; glow: number; pop: number
}
export const newPose = (): Pose => ({ show: 1, cx: 0, cy: 0, sc: 1, z: 0, tilt: 0.9, yaw: 0, spin: 0, auto: 0, sep: 0, hinge: 0, crack: 0, ingr: 0, loop: 0, dripT: 0, glow: 1, pop: 1 })

// Smoothed values actually applied to the cookie each frame
export const V: Pose & { crumbT: number; time: number; sc3: number; sepW: number; dripLoopT: number } = {
  ...newPose(), crumbT: 0, time: 0, sc3: 1, sepW: 0, dripLoopT: 0,
}

export const R: { rig: THREE.Group | null; root: THREE.Group | null; left: THREE.Group | null; right: THREE.Group | null } = { rig: null, root: null, left: null, right: null }

export const SEP_MAX = 1.35
export const HINGE_MAX = 0.8

// Per-frame update hooks registered by scene subsystems (run after the rig has positioned the cookie)
export const updaters = new Set<(dt: number, t: number) => void>()

if (typeof window !== 'undefined') {
  S.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  S.mobile = window.innerWidth < 768
}
