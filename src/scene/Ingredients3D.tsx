import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { easeInOut, mulberry, rng } from '../lib/math'
import { chunkGeometry, saltGeometry } from './geometry'
import { R, S, updaters, V } from './store'

type Kind = 'chunk' | 'salt' | 'butter' | 'crumb'
/** Chocolate chunks, sea salt, butter and crumbs that fly in around the cookie while scrolling the ingredients section. */
export function Ingredients3D({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null!)
  const items = useMemo(() => {
    const r = mulberry(31)
    const kinds: [Kind, number][] = [['chunk', 9], ['salt', 14], ['butter', 4], ['crumb', 12]]
    const list: { kind: Kind; end: THREE.Vector3; start: THREE.Vector3; size: number; spin: THREE.Vector3; delay: number; ph: number }[] = []
    kinds.forEach(([kind, n]) => {
      for (let i = 0; i < Math.round(n * count); i++) {
        const a = r() * Math.PI * 2, rad = 1.9 + r() * 1.5
        const end = new THREE.Vector3(Math.cos(a) * rad * 1.15, (r() - 0.5) * 2.2, Math.sin(a) * rad * 0.7)
        const sa = r() * Math.PI * 2, sr = 6 + r() * 4
        list.push({
          kind, end, start: new THREE.Vector3(Math.cos(sa) * sr, (r() - 0.5) * 7, Math.sin(sa) * sr * 0.5 + 2),
          size: kind === 'chunk' ? 0.3 + r() * 0.2 : kind === 'butter' ? 0.7 : kind === 'salt' ? 0.05 + r() * 0.04 : 0.1 + r() * 0.1,
          spin: new THREE.Vector3(r() * 2, r() * 2, r() * 2), delay: r() * 0.4, ph: r() * 6,
        })
      }
    })
    return list
  }, [count])
  const geos = useMemo(() => ({ chunk: chunkGeometry(), salt: saltGeometry(), butter: new THREE.BoxGeometry(0.9, 0.45, 0.55, 1, 1, 1), crumb: new THREE.DodecahedronGeometry(1, 0) }), [])
  const mats = useMemo(() => ({
    chunk: new THREE.MeshPhysicalMaterial({ color: '#2b140a', roughness: 0.38, clearcoat: 0.6, clearcoatRoughness: 0.25, envMapIntensity: 1.2 }),
    salt: new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: 0.2, emissive: '#fff4e0', emissiveIntensity: 0.2, flatShading: true }),
    butter: new THREE.MeshPhysicalMaterial({ color: '#f0cf72', roughness: 0.35, clearcoat: 0.4, envMapIntensity: 1 }),
    crumb: new THREE.MeshStandardMaterial({ color: '#c98f4c', roughness: 0.9, flatShading: true }),
  }), [])
  const refs = useRef<THREE.Mesh[]>([])

  useEffect(() => {
    const fn = (_dt: number, t: number) => {
      const g = group.current, rg = R.rig
      if (!g || !rg) return
      g.visible = V.ingr > 0.003 && V.show > 0.05
      if (!g.visible) return
      const sc = rg.scale.x
      g.position.copy(rg.position)
      g.scale.setScalar(sc * 1.1)
      const orbit = S.reduced ? 0 : t * 0.08
      items.forEach((it, i) => {
        const m = refs.current[i]; if (!m) return
        const k = easeInOut(rng(V.ingr, it.delay * 0.6, 0.6 + it.delay * 0.6 + 0.4))
        m.position.lerpVectors(it.start, it.end, k)
        const c = Math.cos(orbit * k), s = Math.sin(orbit * k), x = m.position.x, z = m.position.z
        m.position.x = x * c - z * s; m.position.z = x * s + z * c
        m.position.y += Math.sin(t * 0.7 + it.ph) * 0.06 * k * (S.reduced ? 0 : 1)
        m.rotation.set(it.spin.x * (1 - k) * 3 + t * 0.15 * it.spin.x * k, it.spin.y * (1 - k) * 3 + t * 0.2 * k, it.spin.z * (1 - k) * 3)
        m.scale.setScalar(it.size * (0.2 + 0.8 * k))
      })
    }
    updaters.add(fn); return () => { updaters.delete(fn) }
  }, [items])

  return (
    <group ref={group} visible={false}>
      {items.map((it, i) => (
        <mesh key={i} ref={(el) => { if (el) refs.current[i] = el }} geometry={geos[it.kind]} material={mats[it.kind]} frustumCulled={false} />
      ))}
    </group>
  )
}
