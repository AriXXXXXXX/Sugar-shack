import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import gsap from 'gsap'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { renderGate, readyStore, variantStore } from '../lib/stores'
import { damp, smooth } from '../lib/math'
import { Cookie } from './Cookie'
import { Crumbs, Dust } from './Crumbs'
import { Ingredients3D } from './Ingredients3D'
import { computePose } from './pose'
import { HINGE_MAX, newPose, R, S, SEP_MAX, updaters, V, type Pose } from './store'
import { Strands } from './Strands'
import { VARIANTS } from './variants'

const TAU = Math.PI * 2
const SMOOTH_KEYS: (keyof Pose)[] = ['cx', 'cy', 'sc', 'z', 'tilt', 'yaw', 'sep', 'hinge', 'crack', 'ingr', 'dripT', 'glow', 'show']

function Rig({ lights }: { lights: React.MutableRefObject<{ key?: THREE.DirectionalLight; rim?: THREE.DirectionalLight; fill?: THREE.DirectionalLight; glow?: THREE.Mesh }> }) {
  const { viewport } = useThree()
  const pose = useRef(newPose())
  const lock = useRef({ on: false, base: 0 })
  const frames = useRef(0)
  const pointer = useRef({ x: 0, y: 0 })

  useFrame((state, dtRaw) => {
    const dt = Math.min(dtRaw, 0.12), t = state.clock.elapsedTime
    const P = pose.current
    computePose(P, t)
    const lam = S.reduced ? 80 : 5.5
    for (const k of SMOOTH_KEYS) (V as unknown as Record<string, number>)[k] = damp((V as unknown as Record<string, number>)[k], P[k] as number, k === 'dripT' ? 20 : lam, dt)
    V.loop = P.loop
    V.dripLoopT += dt * 0.32

    pointer.current.x = damp(pointer.current.x, S.pointer.x, 3, dt)
    pointer.current.y = damp(pointer.current.y, S.pointer.y, 3, dt)

    // turntable spin: free-running when `auto`, otherwise glides to a multiple of 2π + the scripted angle
    if (P.auto > 0.5) {
      lock.current.on = false
      V.spin += dt * (S.reduced ? 0 : 0.25) + S.kick.vyaw * dt
    } else {
      if (!lock.current.on) { lock.current.on = true; lock.current.base = Math.round(V.spin / TAU) * TAU }
      V.spin = damp(V.spin, lock.current.base + P.spin, S.reduced ? 80 : 5, dt)
    }
    if (!S.kick.dragging) S.kick.vyaw = damp(S.kick.vyaw, 0, 1.8, dt)
    S.tapPulse = damp(S.tapPulse, 0, 4, dt)

    const rg = R.rig, root = R.root, L = R.left, Rt = R.right
    if (rg && root && L && Rt) {
      const vw = viewport.width, vh = viewport.height
      const base = Math.min(vw * 0.62, vh * 0.6) / 3.2
      const intro = smooth(S.intro)
      const show = smooth(Math.min(1, V.show))
      const s = base * V.sc * (0.7 + 0.3 * intro) * show * (1 + 0.07 * S.tapPulse)
      const bob = S.reduced ? 0 : Math.sin(t * 0.9) * 0.05 * base * 3
      rg.position.set(V.cx * vw * 0.5, V.cy * vh * 0.5 + bob, V.z + (1 - intro) * -2)
      rg.scale.setScalar(Math.max(s, 0.0001))
      rg.visible = show > 0.01
      rg.rotation.order = 'YXZ'
      const sway = S.reduced ? 0 : Math.sin(t * 0.35) * 0.35 * Math.min(1, P.auto + 0.0)
      rg.rotation.set(V.tilt - pointer.current.y * 0.12 + (S.reduced ? 0 : Math.sin(t * 0.5) * 0.03), V.yaw + sway + pointer.current.x * 0.28, S.reduced ? 0 : Math.sin(t * 0.4) * 0.02)
      root.rotation.y = V.spin

      V.sepW = 0.018 * V.crack + V.sep * SEP_MAX
      L.position.set(-V.sepW, 0, 0); Rt.position.set(V.sepW, 0, 0)
      L.rotation.set(0, -0.22 * V.hinge, V.hinge * HINGE_MAX)
      Rt.rotation.set(0, 0.22 * V.hinge, -V.hinge * HINGE_MAX)
      rg.updateMatrixWorld(true)
      updaters.forEach((f) => f(dt, t))

      // lights fade up with the intro
      const li = intro
      if (lights.current.key) lights.current.key.intensity = 2.1 * li
      if (lights.current.rim) lights.current.rim.intensity = 2.0 * li
      if (lights.current.fill) lights.current.fill.intensity = 0.8 * li
      const g = lights.current.glow
      if (g) {
        g.position.set(rg.position.x, rg.position.y, -3.5)
        ;(g.material as THREE.MeshBasicMaterial).opacity = 0.5 * V.glow * li * show
        g.visible = show > 0.01
      }
    }
    frames.current++
    if (frames.current === 3) readyStore.set(true)
  })
  return null
}

function glowTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 128
  const g = c.getContext('2d')!
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  gr.addColorStop(0, 'rgba(255,170,80,0.55)'); gr.addColorStop(0.45, 'rgba(160,80,30,0.2)'); gr.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function Scene() {
  const variantId = variantStore.use()
  const variant = VARIANTS[variantId]
  const mobile = S.mobile
  const quality = useMemo(() => (mobile ? { rings: 26, cols: 38, decor: 0.65 } : { rings: 44, cols: 68, decor: 1 }), [mobile])
  const lights = useRef<{ key?: THREE.DirectionalLight; rim?: THREE.DirectionalLight; fill?: THREE.DirectionalLight; glow?: THREE.Mesh }>({})
  const glowTex = useMemo(glowTexture, [])
  return (
    <>
      <ambientLight intensity={0.18} color="#ffe2c0" />
      <directionalLight ref={(l) => { lights.current.key = l ?? undefined }} position={[3.5, 4.5, 4.5]} color="#ffd9a3" intensity={0} castShadow={!mobile} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0005} shadow-normalBias={0.02}>
        <orthographicCamera attach="shadow-camera" args={[-4, 4, 4, -4, 0.5, 14]} />
      </directionalLight>
      <directionalLight ref={(l) => { lights.current.rim = l ?? undefined }} position={[-4.5, 2.5, -3]} color="#ff9a4a" intensity={0} />
      <directionalLight ref={(l) => { lights.current.fill = l ?? undefined }} position={[-4, 0.5, 3.5]} color="#ffe6c8" intensity={0} />
      <Environment resolution={mobile ? 128 : 256} frames={1}>
        <Lightformer form="rect" intensity={5} color="#ffd9a0" position={[3, 4, 3]} scale={[5, 2.5, 1]} />
        <Lightformer form="rect" intensity={3} color="#ff9650" position={[-5, 1, -2]} rotation-y={Math.PI / 2} scale={[6, 2, 1]} />
        <Lightformer form="rect" intensity={2.2} color="#fff0dc" position={[0, 5, -3]} rotation-x={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="ring" intensity={1.6} color="#ffd9b0" position={[0, 0, 6]} scale={3} />
      </Environment>
      <mesh ref={(m) => { lights.current.glow = m ?? undefined }} position={[0, 0, -3.5]} renderOrder={-1}>
        <planeGeometry args={[16, 16]} />
        <meshBasicMaterial map={glowTex} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
      </mesh>
      <Rig lights={lights} />
      <RigGroup variant={variant} quality={quality} shadows={!mobile} />
      <Strands variant={variant} />
      <Crumbs variant={variant} count={mobile ? 34 : 72} />
      <Ingredients3D count={mobile ? 0.6 : 1} />
      <Dust count={mobile ? 28 : 70} />
    </>
  )
}

function RigGroup({ variant, quality, shadows }: { variant: (typeof VARIANTS)[keyof typeof VARIANTS]; quality: { rings: number; cols: number; decor: number }; shadows: boolean }) {
  const ref = useRef<THREE.Group>(null!)
  useEffect(() => { R.rig = ref.current; return () => { R.rig = null } }, [])
  return <group ref={ref}><Cookie variant={variant} quality={quality} shadows={shadows} /></group>
}

export default function Experience() {
  const gate = renderGate.use()
  const mobile = S.mobile
  return (
    <div className="fixed inset-0 z-[5] pointer-events-none" style={{ visibility: gate ? 'visible' : 'hidden' }} aria-hidden="true">
      <Canvas
        dpr={mobile ? [1, 1.5] : [1, 1.8]}
        shadows={!mobile}
        frameloop={gate ? 'always' : 'never'}
        camera={{ position: [0, 0, 8], fov: 30, near: 0.5, far: 40 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.toneMapping = THREE.ACESFilmicToneMapping
          gl.toneMappingExposure = 0.95
          gsap.to(S, { intro: 1, duration: S.reduced ? 0.01 : 2.4, ease: 'power3.out', delay: 0.15 })
        }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}
