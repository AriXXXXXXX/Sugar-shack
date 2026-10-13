import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry } from '../lib/math'
import { buildHalf, chunkGeometry, facePoint, jag, poolGeometry, pocketField, R0, saltGeometry, silhouette, softGeometry, yTop, type Quality } from './geometry'
import { makeMaterials, U, type Mats } from './shaders'
import { R } from './store'
import type { Variant } from './variants'

/** Molten pockets on the broken face. Strands and the goo blobs both use these. */
export const ANCHORS = (() => {
  // greedy pick of the strongest pocket centers, spaced apart
  const cand: { z: number; v: number; f: number }[] = []
  for (let z = -1.05; z <= 1.05; z += 0.03) for (let v = 0.22; v <= 0.85; v += 0.03) cand.push({ z, v, f: pocketField(z, v) })
  cand.sort((a, b) => b.f - a.f)
  const out: { z: number; v: number; r: number }[] = []
  const r = mulberry(21)
  for (const c of cand) {
    if (out.length >= 9) break
    if (c.f < 0.66) break
    if (out.every((o) => Math.hypot((o.z - c.z) * 1.0, (o.v - c.v) * 1.6) > 0.3)) out.push({ z: c.z, v: c.v, r: 0.07 + r() * 0.04 })
  }
  return out
})()
/** Lower points on the broken face where chocolate drips form */
export const DRIP_ANCHORS = [
  { z: -0.74, v: 0.12 }, { z: 0.08, v: 0.1 }, { z: 0.72, v: 0.14 }, { z: -0.3, v: 0.12 }, { z: 0.4, v: 0.1 }, { z: 1.0, v: 0.2 },
]

interface Item { m: THREE.Matrix4; c?: THREE.Color }
type Kind = 'chunk' | 'pool' | 'soft' | 'salt'
type Layout = Record<'L' | 'R', Record<Kind, Item[]>>

function layoutDecor(v: Variant, q: number): Layout {
  const rand = mulberry(1234)
  const out: Layout = { L: { chunk: [], pool: [], soft: [], salt: [] }, R: { chunk: [], pool: [], soft: [], salt: [] } }
  const wsum = v.chunks.reduce((a, c) => a + c.w, 0)
  const pick = () => { let t = rand() * wsum; for (const c of v.chunks) { t -= c.w; if (t <= 0) return c.color } return v.chunks[0].color }
  const up = new THREE.Vector3(0, 1, 0)
  const place = (kind: Kind, x: number, z: number, size: number, sy: number, sink: number, color?: string, flat = 1) => {
    const e = 0.04
    const nx = -(yTop(x + e, z) - yTop(x - e, z)) / (2 * e), nz = -(yTop(x, z + e) - yTop(x, z - e)) / (2 * e)
    const n = new THREE.Vector3(nx, 1, nz).normalize()
    const qn = new THREE.Quaternion().setFromUnitVectors(up, n)
    qn.multiply(new THREE.Quaternion().setFromAxisAngle(up, rand() * Math.PI * 2))
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, yTop(x, z) + sink, z), qn, new THREE.Vector3(size * (0.8 + rand() * 0.5) * flat, size * sy, size * (0.8 + rand() * 0.5) * flat))
    const side = x < jag(z) ? 'L' : 'R'
    out[side][kind].push({ m, c: color ? new THREE.Color(color) : undefined })
  }
  const spot = () => {
    for (let k = 0; k < 40; k++) {
      const th = rand() * Math.PI * 2, s = Math.sqrt(rand()) * 0.9
      const rr = s * silhouette(th), x = rr * Math.cos(th), z = rr * Math.sin(th)
      if (Math.abs(x - jag(z)) > 0.16) return { x, z }
    }
    return { x: 0.8, z: 0.5 }
  }
  const nChunk = Math.round(v.chunkCount * q)
  for (let i = 0; i < nChunk; i++) {
    const { x, z } = spot()
    const size = v.chunkSize[0] + rand() * (v.chunkSize[1] - v.chunkSize[0])
    const col = pick()
    place('chunk', x, z, size, 0.7, -size * 0.12, col)
    if (v.pool && i % 5 === 0) place('pool', x + (rand() - 0.5) * 0.08, z + (rand() - 0.5) * 0.08, size * (0.7 + rand() * 0.5), 0.13, size * 0.04, v.pool, 1)
  }
  if (v.soft) for (let i = 0; i < Math.round(v.soft.count * q); i++) { const { x, z } = spot(); place('soft', x, z, v.soft.size * (0.8 + rand() * 0.4), 0.8, v.soft.size * 0.15, v.soft.color) }
  if (v.salt) for (let i = 0; i < Math.round(26 * q); i++) { const { x, z } = spot(); place('salt', x, z, 0.022 + rand() * 0.02, 0.9, 0.02, '#ffffff') }
  // chunks poking out of the broken face
  for (const side of ['L', 'R'] as const) {
    const dir = side === 'L' ? -1 : 1
    for (let i = 0; i < Math.round(8 * q); i++) {
      const z = (rand() - 0.5) * 2.0, vv = 0.18 + rand() * 0.64
      const p = facePoint(z, vv), size = 0.09 + rand() * 0.1
      const m = new THREE.Matrix4().compose(
        new THREE.Vector3(p.x + dir * size * 0.25, p.y, p.z),
        new THREE.Quaternion().setFromEuler(new THREE.Euler(rand() * 3, rand() * 3, rand() * 3)),
        new THREE.Vector3(size, size * 0.8, size),
      )
      out[side].chunk.push({ m, c: new THREE.Color(pick()) })
    }
  }
  return out
}

function makeInstanced(geo: THREE.BufferGeometry, mat: THREE.Material, items: Item[], castShadow: boolean) {
  const im = new THREE.InstancedMesh(geo, mat, Math.max(1, items.length))
  im.count = items.length
  items.forEach((it, i) => { im.setMatrixAt(i, it.m); if (it.c) im.setColorAt(i, it.c) })
  im.instanceMatrix.needsUpdate = true
  if (im.instanceColor) im.instanceColor.needsUpdate = true
  im.castShadow = castShadow; im.receiveShadow = true
  im.frustumCulled = false
  return im
}

function Half({ side, geo, mats, layout, variant, shadows }: { side: 'L' | 'R'; geo: { shell: THREE.BufferGeometry; face: THREE.BufferGeometry }; mats: Mats; layout: Layout; variant: Variant; shadows: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  const shared = useMemo(() => ({ chunk: chunkGeometry(), pool: poolGeometry(), soft: softGeometry(), salt: saltGeometry(), blob: new THREE.SphereGeometry(1, 20, 14) }), [])
  useLayoutEffect(() => { if (side === 'L') R.left = ref.current; else R.right = ref.current }, [side])

  const objs = useMemo(() => {
    const l = layout[side]
    const poolMat = mats.goo.clone(); poolMat.color.set(variant.pool ?? '#000')
    const softMat = mats.soft.clone(); softMat.roughness = 1 - (variant.soft?.gloss ?? 0.4)
    const list = [
      makeInstanced(shared.chunk, mats.chunk, l.chunk, shadows),
      makeInstanced(shared.pool, poolMat, l.pool, false),
      makeInstanced(shared.soft, softMat, l.soft, shadows),
      makeInstanced(shared.salt, mats.salt, l.salt, false),
    ]
    // molten blobs on the break face
    const blobs = new THREE.InstancedMesh(shared.blob, mats.goo, ANCHORS.length)
    ANCHORS.forEach((a, i) => {
      const p = facePoint(a.z, a.v, side === 'L' ? 1 : -1)
      blobs.setMatrixAt(i, new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(a.r * 0.4, a.r * 1.9, a.r * 2.3)))
    })
    blobs.frustumCulled = false
    list.push(blobs)
    return { list, poolMat, softMat }
  }, [layout, side, mats, shared, variant, shadows])

  useEffect(() => () => { objs.list.forEach((o) => o.dispose()); objs.poolMat.dispose(); objs.softMat.dispose() }, [objs])

  return (
    <group ref={ref}>
      <mesh geometry={geo.shell} material={mats.shell} castShadow={shadows} receiveShadow={shadows} frustumCulled={false} />
      <mesh geometry={geo.face} material={mats.face} receiveShadow={shadows} frustumCulled={false} />
      {objs.list.map((o, i) => <primitive key={o.uuid + i} object={o} />)}
    </group>
  )
}

export function Cookie({ variant, quality, shadows }: { variant: Variant; quality: Quality & { decor: number }; shadows: boolean }) {
  const rootRef = useRef<THREE.Group>(null!)
  const geoL = useMemo(() => buildHalf('L', quality), [quality])
  const geoR = useMemo(() => buildHalf('R', quality), [quality])
  const mats = useMemo(() => makeMaterials(), [])
  const layout = useMemo(() => layoutDecor(variant, quality.decor), [variant, quality.decor])

  useLayoutEffect(() => {
    R.root = rootRef.current
    return () => { R.root = null; R.left = null; R.right = null }
  }, [])

  useEffect(() => {
    U.c1.value.set(variant.crust[0]); U.c2.value.set(variant.crust[1]); U.c3.value.set(variant.crust[2])
    U.i1.value.set(variant.inner[0]); U.i2.value.set(variant.inner[1]); U.fill.value.set(variant.fill)
    U.fillGloss.value = variant.fillGloss
    mats.goo.color.set(variant.fill)
    mats.goo.roughness = 0.12 + 0.55 * (1 - variant.fillGloss)
    mats.goo.clearcoat = 0.4 + 0.6 * variant.fillGloss
  }, [variant, mats])
  useEffect(() => () => { geoL.shell.dispose(); geoL.face.dispose(); geoR.shell.dispose(); geoR.face.dispose() }, [geoL, geoR])

  return (
    <group ref={rootRef}>
      <Half side="L" geo={geoL} mats={mats} layout={layout} variant={variant} shadows={shadows} />
      <Half side="R" geo={geoR} mats={mats} layout={layout} variant={variant} shadows={shadows} />
    </group>
  )
}
export const COOKIE_R = R0
