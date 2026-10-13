import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { mulberry, rng, smooth } from '../lib/math'
import { facePoint } from './geometry'
import { R, S, updaters, V } from './store'
import type { Variant } from './variants'

/** Crumbs that break off along the crack and drift outward. Fully scroll-driven (reversible). */
export function Crumbs({ variant, count }: { variant: Variant; count: number }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  const data = useMemo(() => {
    const r = mulberry(5)
    return Array.from({ length: count }, (_, i) => {
      const z = (r() - 0.5) * 2.1
      const side = r() > 0.5 ? 1 : -1
      return {
        start: facePoint(z, 0.1 + r() * 0.85),
        vel: new THREE.Vector3(side * (0.4 + r() * 1.4), (r() - 0.35) * 1.5, (r() - 0.2) * 1.6),
        thr: r() * 0.55, size: 0.025 + Math.pow(r(), 2) * 0.07, spin: new THREE.Vector3(r() * 4, r() * 4, r() * 4), seed: r() * 10, i,
      }
    })
  }, [count])

  useEffect(() => {
    const im = ref.current
    const cols = [variant.crust[0], variant.crust[1], variant.crust[2], variant.chunks[0].color, variant.crust[0]]
    data.forEach((d, i) => im.setColorAt(i, new THREE.Color(cols[i % cols.length])))
    if (im.instanceColor) im.instanceColor.needsUpdate = true
  }, [variant, data])

  useEffect(() => {
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3()
    const fn = (_dt: number, t: number) => {
      const im = ref.current, root = R.root, rg = R.rig
      if (!im || !root || !rg) return
      const sc = rg.scale.x
      V.crumbT = V.crack * 0.3 + V.sep * 1.25
      im.visible = V.show > 0.05 && V.crumbT > 0.002
      if (!im.visible) return
      for (let i = 0; i < data.length; i++) {
        const d = data[i]
        const age = Math.max(0, V.crumbT - d.thr * 0.5)
        const k = smooth(rng(age, 0, 0.06))
        p.copy(d.start).applyMatrix4(root.matrixWorld)
        const drift = S.reduced ? 0 : Math.sin(t * 0.5 + d.seed) * 0.03 * age
        p.x += d.vel.x * age * 1.5 * sc + drift
        p.y += d.vel.y * age * 1.2 * sc - 0.35 * age * age * sc
        p.z += d.vel.z * age * 1.2 * sc
        e.set(d.spin.x * age, d.spin.y * age, d.spin.z * age)
        q.setFromEuler(e)
        const sz = d.size * sc * k * (1 - smooth(rng(age, 2.0, 2.8)))
        s.set(sz, sz * 0.8, sz)
        m.compose(p, q, s)
        im.setMatrixAt(i, m)
      }
      im.instanceMatrix.needsUpdate = true
    }
    updaters.add(fn)
    return () => { updaters.delete(fn) }
  }, [data])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, count]} frustumCulled={false} visible={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.85} flatShading />
    </instancedMesh>
  )
}

/** Sparse atmospheric dust */
export function Dust({ count }: { count: number }) {
  const ref = useRef<THREE.Points>(null!)
  const geo = useMemo(() => {
    const r = mulberry(77), pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) { pos[i * 3] = (r() - 0.5) * 9; pos[i * 3 + 1] = (r() - 0.5) * 6; pos[i * 3 + 2] = (r() - 0.5) * 5 - 0.5 }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); return g
  }, [count])
  useEffect(() => {
    const fn = (_dt: number, t: number) => {
      const pts = ref.current
      if (!pts) return
      pts.visible = V.show > 0.05
      pts.position.y = S.reduced ? 0 : Math.sin(t * 0.12) * 0.25
      pts.rotation.y = S.reduced ? 0 : t * 0.01
    }
    updaters.add(fn); return () => { updaters.delete(fn) }
  }, [])
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial size={0.035} color="#ffcf8a" transparent opacity={0.55} depthWrite={false} sizeAttenuation blending={THREE.AdditiveBlending} />
    </points>
  )
}
