import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { clamp, easeInOut, easeOut, mulberry, rng, smooth } from '../lib/math'
import { ANCHORS, DRIP_ANCHORS } from './Cookie'
import { facePoint } from './geometry'
import { R, updaters, V } from './store'
import type { Variant } from './variants'

const NR = 10
class Tube {
  geo = new THREE.BufferGeometry()
  pos: Float32Array
  nor: Float32Array
  constructor(public NP: number) {
    this.pos = new Float32Array((NP + 1) * (NR + 1) * 3)
    this.nor = new Float32Array((NP + 1) * (NR + 1) * 3)
    const idx: number[] = []
    for (let j = 0; j < NP; j++) for (let k = 0; k < NR; k++) {
      const a = j * (NR + 1) + k, b = a + 1, c = a + NR + 1, d = c + 1
      idx.push(a, c, b, b, c, d)
    }
    this.geo.setIndex(idx)
    this.geo.setAttribute('position', new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage))
    this.geo.setAttribute('normal', new THREE.BufferAttribute(this.nor, 3).setUsage(THREE.DynamicDrawUsage))
  }
  update(pts: THREE.Vector3[], radii: number[]) {
    const T = new THREE.Vector3(), N = new THREE.Vector3(), B = new THREE.Vector3(), ref = new THREE.Vector3()
    for (let j = 0; j <= this.NP; j++) {
      const a = pts[Math.max(0, j - 1)], b = pts[Math.min(this.NP, j + 1)]
      T.subVectors(b, a).normalize()
      ref.set(0, 0, 1); if (Math.abs(T.z) > 0.9) ref.set(1, 0, 0)
      N.crossVectors(T, ref).normalize(); B.crossVectors(T, N)
      for (let k = 0; k <= NR; k++) {
        const ph = (k / NR) * Math.PI * 2, c = Math.cos(ph), s = Math.sin(ph)
        const o = (j * (NR + 1) + k) * 3
        const nx = N.x * c + B.x * s, ny = N.y * c + B.y * s, nz = N.z * c + B.z * s
        this.nor[o] = nx; this.nor[o + 1] = ny; this.nor[o + 2] = nz
        this.pos[o] = pts[j].x + nx * radii[j]; this.pos[o + 1] = pts[j].y + ny * radii[j]; this.pos[o + 2] = pts[j].z + nz * radii[j]
      }
    }
    this.geo.attributes.position.needsUpdate = true
    this.geo.attributes.normal.needsUpdate = true
  }
}
const mkPts = (n: number) => Array.from({ length: n + 1 }, () => new THREE.Vector3())

const rand = mulberry(99)
const BREAKS = [0.9, 1.25, 1.6, 1.95, 2.3, 2.7, 3.6, 4.5, 5.5].sort(() => rand() - 0.5)
const STRANDS = ANCHORS.map((a, i) => ({ ...a, r0: a.r * 0.85, breakD: BREAKS[i % BREAKS.length], phase: rand() * 6, baseL: facePoint(a.z, a.v, 1), baseR: facePoint(a.z, a.v, -1) }))
const DRIPS = DRIP_ANCHORS.map((a, i) => ({ ...a, side: (i % 2 ? 'R' : 'L') as 'L' | 'R', off: 0.1 + i * 0.32 + rand() * 0.2, speed: 0.8 + rand() * 0.4, rb: 0.07 + rand() * 0.03, base: facePoint(a.z, a.v, i % 2 ? -1 : 1) }))

const NP = 22
const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3()
function toWorld(out: THREE.Vector3, local: THREE.Vector3, half: THREE.Group) {
  return out.copy(local).applyMatrix4(half.matrix).applyMatrix4(R.root!.matrixWorld)
}

export function Strands({ variant }: { variant: Variant }) {
  const mat = useMemo(() => new THREE.MeshPhysicalMaterial({ color: '#4a2210', emissive: '#1f0b03', roughness: 0.28, clearcoat: 0.35, clearcoatRoughness: 0.2, envMapIntensity: 0.6 }), [])
  useEffect(() => {
    mat.color.set(variant.fill); mat.emissive.set(variant.fill).multiplyScalar(0.3)
    mat.roughness = 0.16 + 0.5 * (1 - variant.fillGloss)
    mat.clearcoat = 0.2 + 0.4 * variant.fillGloss
  }, [variant, mat])

  const rig = useRef<THREE.Group>(null!)
  const parts = useMemo(() => ({
    strands: STRANDS.map(() => ({ span: new Tube(NP), pa: new Tube(10), pb: new Tube(10), pts: mkPts(NP), ptsP: mkPts(10), radii: new Array(NP + 1).fill(0), radiiP: new Array(11).fill(0) })),
    drips: DRIPS.map(() => ({ tail: new Tube(10), pts: mkPts(10), radii: new Array(11).fill(0) })),
    dropGeo: new THREE.SphereGeometry(1, 14, 10),
  }), [])
  const meshes = useRef<{ span: THREE.Mesh[]; pa: THREE.Mesh[]; pb: THREE.Mesh[]; tail: THREE.Mesh[]; drop: THREE.Mesh[] }>({ span: [], pa: [], pb: [], tail: [], drop: [] })

  useEffect(() => {
    const A = new THREE.Vector3(), B = new THREE.Vector3(), tmp = new THREE.Vector3()
    const fn = (_dt: number, t: number) => {
      const root = R.root, L = R.left, Rt = R.right, rg = R.rig
      if (!root || !L || !Rt || !rg || V.show < 0.05) { rig.current.visible = false; return }
      const sc = rg.scale.x
      const anyOpen = V.sepW > 0.03
      rig.current.visible = anyOpen
      if (!anyOpen) return
      // ── strands ──
      STRANDS.forEach((st, i) => {
        const o = parts.strands[i], m = meshes.current
        toWorld(A, st.baseL, L); toWorld(B, st.baseR, Rt)
        const d = A.distanceTo(B) / sc
        const s = (d - 0.04) / (st.breakD - 0.04)
        const vis = d > 0.05
        m.span[i].visible = vis && s < 1
        m.pa[i].visible = m.pb[i].visible = vis && s >= 1
        if (!vis) return
        if (s < 1) {
          const sagAmt = sc * (0.16 + 0.3 * Math.min(d, 2.2)) * (1 - 0.4 * clamp(s))
          for (let j = 0; j <= NP; j++) {
            const u = j / NP
            const p = o.pts[j].lerpVectors(A, B, u)
            p.y -= sagAmt * 4 * u * (1 - u)
            p.z += Math.sin(u * 7 + st.phase) * 0.015 * sc * clamp(s) * 4
            const bell = Math.pow(Math.sin(Math.PI * u), 0.8)
            const flare = 1 + 0.9 * Math.pow(1 - Math.sin(Math.PI * u), 3)
            o.radii[j] = sc * st.r0 * flare * (1 - 0.9 * Math.pow(clamp(s), 0.55) * Math.pow(bell, 1.4))
          }
          o.span.update(o.pts, o.radii)
        } else {
          const q = clamp((s - 1) / 0.6)
          const eq = easeOut(q)
          const dirAB = tmp.subVectors(B, A)
          const len0 = dirAB.length()
          for (const [tube, E, other, sign] of [[o.pa, A, B, 1], [o.pb, B, A, -1]] as const) {
            const dir = new THREE.Vector3().subVectors(other, E).normalize()
            const reach = len0 * 0.5 * (1 - eq) + 0.02
            const hang = sc * (0.1 + 0.55 * eq)
            for (let j = 0; j <= 10; j++) {
              const u = j / 10
              const p = o.ptsP[j].copy(E).addScaledVector(dir, reach * u * (1 - 0.55 * u))
              p.y -= hang * Math.pow(u, 1.5) + sc * 0.12 * (1 - eq) * 4 * u * (1 - u)
              p.z += sign * Math.sin(u * 5 + st.phase) * 0.01 * sc
              const tipU = 0.9
              let r = sc * st.r0 * (0.75 - 0.35 * u) * (1 - 0.3 * eq * u)
              if (u > 0.55) r += sc * st.r0 * 0.8 * smooth(rng(u, 0.55, 0.95)) * (0.5 + 0.5 * eq)
              if (u > tipU) r *= Math.sqrt(Math.max(0, 1 - Math.pow((u - tipU) / (1 - tipU), 2)))
              o.radiiP[j] = r
            }
            tube === o.pa ? o.pa.update(o.ptsP, o.radiiP) : o.pb.update(o.ptsP, o.radiiP)
          }
        }
      })
      // ── drips ──
      const loop = V.loop > 0.5
      const T1 = 1.0, T2 = 0.95, REST = 0.55, CYC = T1 + T2 + REST
      DRIPS.forEach((dr, i) => {
        const o = parts.drips[i], m = meshes.current
        const half = dr.side === 'L' ? L : Rt
        toWorld(A, dr.base, half)
        let tau = (loop ? V.dripLoopT : V.dripT) * dr.speed - dr.off
        if (loop) tau = ((tau % CYC) + CYC) % CYC
        const vis = tau > 0 && V.sepW > 0.12
        m.tail[i].visible = vis
        m.drop[i].visible = false
        if (!vis) return
        let ell: number, rb: number, neck: number
        if (tau < T1) {
          const a = easeInOut(tau / T1)
          ell = 0.05 + 0.4 * a; rb = dr.rb * (0.85 + 0.5 * a); neck = 0.4 - 0.18 * a
        } else {
          const b = clamp((tau - T1) / T2)
          ell = 0.45 - 0.37 * easeOut(Math.min(1, b * 1.4)); rb = dr.rb * (1.1 - 0.3 * b); neck = 0.22 - 0.1 * b
          if (b < 1 && tau < CYC - REST + 0.01) {
            const dm = m.drop[i]
            dm.visible = true
            const fall = 0.16 + 3.4 * b * b
            dm.position.set(A.x, A.y - sc * (0.45 + fall), A.z)
            dm.scale.set(sc * rb * 0.95, sc * rb * (1 + 1.4 * b), sc * rb * 0.95)
          }
        }
        for (let j = 0; j <= 10; j++) {
          const u = j / 10
          o.pts[j].set(A.x, A.y - sc * ell * u, A.z)
          let r = sc * dr.rb * (0.3 + 0.35 * (1 - u))
          r += sc * Math.max(0, rb * 1.05 - dr.rb * 0.3) * smooth(rng(u, 0.55, 0.93))
          if (u > 0.9) r *= Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.9) / 0.1, 2)))
          o.radii[j] = Math.max(r, 0.0005)
        }
        o.tail.update(o.pts, o.radii)
      })
      void t
    }
    updaters.add(fn)
    return () => { updaters.delete(fn) }
  }, [parts])

  const setRef = (kind: 'span' | 'pa' | 'pb' | 'tail' | 'drop', i: number) => (el: THREE.Mesh | null) => { if (el) meshes.current[kind][i] = el }
  return (
    <group ref={rig} visible={false}>
      {parts.strands.map((s, i) => (
        <group key={i}>
          <mesh ref={setRef('span', i)} geometry={s.span.geo} material={mat} frustumCulled={false} />
          <mesh ref={setRef('pa', i)} geometry={s.pa.geo} material={mat} frustumCulled={false} />
          <mesh ref={setRef('pb', i)} geometry={s.pb.geo} material={mat} frustumCulled={false} />
        </group>
      ))}
      {parts.drips.map((d, i) => (
        <group key={i}>
          <mesh ref={setRef('tail', i)} geometry={d.tail.geo} material={mat} frustumCulled={false} />
          <mesh ref={setRef('drop', i)} geometry={parts.dropGeo} material={mat} frustumCulled={false} />
        </group>
      ))}
    </group>
  )
}
