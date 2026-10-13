import * as THREE from 'three'
import { mulberry } from '../lib/math'

// ─── Analytic cookie shape (shared by geometry, decor placement and GLSL) ───
export const R0 = 1.5
export const H_TOP = 0.56
export const H_BOT = 0.2

/** x-position of the jagged break line as a function of z. MUST match GLSL `jag()` in shaders.ts */
export const jag = (z: number) => 0.06 * Math.sin(2.0 * z) + 0.03 * Math.sin(5.3 * z) + 0.012 * Math.sin(12.0 * z)

export const silhouette = (th: number) =>
  R0 * (1 + 0.055 * Math.sin(2 * th + 0.6) + 0.045 * Math.sin(3 * th + 1.9) + 0.03 * Math.sin(5 * th + 4.1) + 0.018 * Math.sin(8 * th + 2.2))

const n2 = (x: number, z: number) => 0.5 * Math.sin(3.1 * x + 1.7 * z) + 0.3 * Math.sin(5.3 * z - 2.9 * x + 1.1) + 0.2 * Math.sin(9.7 * x + 7.3 * z)

function sOf(x: number, z: number) {
  const th = Math.atan2(z, x)
  return Math.min(1, Math.hypot(x, z) / silhouette(th))
}
export function yTop(x: number, z: number) {
  const s = sOf(x, z)
  const n = n2(x, z)
  return H_TOP * Math.pow(1 - Math.pow(s, 3.2), 0.42) * (1 + 0.07 * n) + 0.05 * n * (1 - s * s) * (1 - Math.pow(s, 6))
}
export function yBot(x: number, z: number) {
  const s = sOf(x, z)
  return -H_BOT * Math.pow(1 - Math.pow(s, 5), 0.35) * (1 + 0.05 * n2(x + 3, z - 2))
}
/** Roughness of the broken face along x (same for both halves so they interlock) */
export const faceDx = (z: number, v: number) => 0.04 * Math.pow(Math.sin(Math.PI * v), 0.7) * (0.5 * Math.sin(7.1 * z + 15 * v) + 0.5 * Math.sin(13 * z - 24 * v + 1))

const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t) }
/** Where molten chocolate pockets sit on the broken face (0..1). Also baked into a vertex attribute for the shader. */
export const pocketField = (z: number, v: number) =>
  (0.5 + 0.28 * Math.sin(3.7 * z + 7.8 * v) + 0.2 * Math.sin(5.9 * z - 24.6 * v + 2.0) + 0.14 * Math.sin(9.3 * z + 46 * v + 0.5)) * sm(0.08, 0.26, v) * sm(0.08, 0.26, 1 - v) * sm(1.35, 1.0, Math.abs(z))
export const faceBulge = (z: number, v: number) => 0.075 * sm(0.58, 0.8, pocketField(z, v))

/** Point on the broken face in cookie-local coordinates. v: 0 = bottom, 1 = top. dir: +1 left half (bulges +x), -1 right half */
export function facePoint(z: number, v: number, dir = 0) {
  const x = jag(z)
  return new THREE.Vector3(x + faceDx(z, v) + dir * faceBulge(z, v), THREE.MathUtils.lerp(yBot(x, z), yTop(x, z), v), z)
}

// Solve ring-angle where the ring (s) crosses the jagged seam. branch +1 → z>0, -1 → z<0
function seamAngle(s: number, branch: 1 | -1) {
  const f = (th: number) => {
    const rr = s * silhouette(th)
    return rr * Math.cos(th) - jag(rr * Math.sin(th))
  }
  let lo = branch === 1 ? 0.15 : -0.15
  let hi = branch === 1 ? Math.PI - 0.15 : -Math.PI + 0.15
  // f(lo) > 0, f(hi) < 0
  for (let i = 0; i < 38; i++) {
    const mid = (lo + hi) / 2
    if (f(mid) > 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

export interface Quality { rings: number; cols: number }

function orient(geo: THREE.BufferGeometry, vertexIndex: number, target: THREE.Vector3) {
  geo.computeVertexNormals()
  const n = geo.getAttribute('normal')
  const d = n.getX(vertexIndex) * target.x + n.getY(vertexIndex) * target.y + n.getZ(vertexIndex) * target.z
  if (d < 0) {
    const idx = geo.getIndex()!
    for (let i = 0; i < idx.count; i += 3) {
      const b = idx.getX(i + 1), c = idx.getX(i + 2)
      idx.setX(i + 1, c); idx.setX(i + 2, b)
    }
    geo.computeVertexNormals()
  }
}

export function buildHalf(side: 'L' | 'R', q: Quality) {
  const N = q.rings, M = q.cols
  const rows = 2 * N + 1
  const pos = new Float32Array(rows * (M + 1) * 3)
  const ringS = (i: number) => { const u = i / N; return 1 - (1 - u) * (1 - u) }
  const seam: { x: number; z: number; s: number }[] = [] // planar polyline per ring: [-branch ... +branch]

  for (let r = 0; r < rows; r++) {
    const top = r <= N
    const i = top ? r : 2 * N - r
    const s = ringS(i)
    const thP = seamAngle(Math.max(s, 1e-4), 1), thM = seamAngle(Math.max(s, 1e-4), -1)
    const a0 = side === 'R' ? thM : thP
    const a1 = side === 'R' ? thP : thM + Math.PI * 2
    for (let j = 0; j <= M; j++) {
      const th = a0 + ((a1 - a0) * j) / M
      const rr = s * silhouette(th)
      const x = rr * Math.cos(th), z = rr * Math.sin(th)
      const y = s >= 0.9999 ? 0 : top ? yTop(x, z) : yBot(x, z)
      const k = (r * (M + 1) + j) * 3
      pos[k] = x; pos[k + 1] = y; pos[k + 2] = z
    }
  }
  const index: number[] = []
  for (let r = 0; r < rows - 1; r++)
    for (let j = 0; j < M; j++) {
      const a = r * (M + 1) + j, b = a + 1, c = a + (M + 1), d = c + 1
      index.push(a, b, c, b, d, c)
    }
  const shell = new THREE.BufferGeometry()
  shell.setAttribute('position', new THREE.BufferAttribute(pos, 3))
  shell.setIndex(index)
  orient(shell, (Math.floor(N * 0.45) * (M + 1) + Math.floor(M / 2)), new THREE.Vector3(0, 1, 0))
  // top-facing check done; bottom follows by construction

  // ── Broken face: polyline from rim(-z) → pole → rim(+z) ──
  for (let i = N; i >= 0; i--) {
    const s = ringS(i), th = seamAngle(Math.max(s, 1e-4), -1), rr = s * silhouette(th)
    seam.push({ x: rr * Math.cos(th), z: rr * Math.sin(th), s })
  }
  for (let i = 1; i <= N; i++) {
    const s = ringS(i), th = seamAngle(s, 1), rr = s * silhouette(th)
    seam.push({ x: rr * Math.cos(th), z: rr * Math.sin(th), s })
  }
  const V = 18
  const K = seam.length
  const fpos = new Float32Array(K * (V + 1) * 3)
  const fpk = new Float32Array(K * (V + 1))
  const dirOut = side === 'L' ? 1 : -1
  const rand = mulberry(11)
  void rand
  for (let k = 0; k < K; k++) {
    const { x, z, s } = seam[k]
    const yt = s >= 0.9999 ? 0 : yTop(x, z), yb = s >= 0.9999 ? 0 : yBot(x, z)
    for (let v = 0; v <= V; v++) {
      const t = v / V
      const o = (k * (V + 1) + v) * 3
      const pf = pocketField(z, t)
      fpk[k * (V + 1) + v] = pf
      fpos[o] = x + faceDx(z, t) + dirOut * faceBulge(z, t)
      fpos[o + 1] = THREE.MathUtils.lerp(yb, yt, t)
      fpos[o + 2] = z
    }
  }
  const fidx: number[] = []
  for (let k = 0; k < K - 1; k++)
    for (let v = 0; v < V; v++) {
      const a = k * (V + 1) + v, b = a + 1, c = a + (V + 1), d = c + 1
      fidx.push(a, b, c, b, d, c)
    }
  const face = new THREE.BufferGeometry()
  face.setAttribute('position', new THREE.BufferAttribute(fpos, 3))
  face.setAttribute('aPocket', new THREE.BufferAttribute(fpk, 1))
  face.setIndex(fidx)
  orient(face, Math.floor(K / 2) * (V + 1) + Math.floor(V / 2), new THREE.Vector3(side === 'L' ? 1 : -1, 0, 0))
  return { shell, face }
}

// ─── Small meshes ───
export function chunkGeometry() {
  const g = new THREE.BoxGeometry(1, 0.55, 1, 3, 2, 3)
  const p = g.getAttribute('position')
  const rand = mulberry(7)
  const v = new THREE.Vector3()
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i)
    const l = v.length()
    v.lerp(v.clone().divideScalar(l).multiplyScalar(0.6), 0.28)
    v.x += (rand() - 0.5) * 0.14; v.y += (rand() - 0.5) * 0.08; v.z += (rand() - 0.5) * 0.14
    p.setXYZ(i, v.x, v.y, v.z)
  }
  const ng = g.toNonIndexed()
  ng.computeVertexNormals()
  return ng
}
export const poolGeometry = () => new THREE.IcosahedronGeometry(1, 2)
export const softGeometry = () => new THREE.SphereGeometry(1, 12, 9)
export const saltGeometry = () => new THREE.OctahedronGeometry(1, 0)
