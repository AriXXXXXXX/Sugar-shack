import { clamp, easeInOut, lerp, rng, smooth } from '../lib/math'
import { S, type Pose } from './store'

const TAU = Math.PI * 2
const e = (v: number, a: number, b: number) => easeInOut(rng(v, a, b))

/** Maps scroll progress to the cookie's target pose for the active section. */
export function computePose(P: Pose, time: number) {
  const m = S.mobile
  // defaults
  P.show = 1; P.cx = 0; P.cy = 0; P.sc = 1; P.z = 0; P.tilt = 0.9; P.yaw = 0; P.spin = 0; P.auto = 0
  P.sep = 0; P.hinge = 0; P.crack = 0; P.ingr = 0; P.loop = 0; P.dripT = 0; P.glow = 1; P.pop = 1

  switch (S.active) {
    case 'hero': {
      const u = S.p.hero
      P.cy = m ? 0.1 : 0.02; P.sc = 1 + 0.12 * u; P.tilt = 0.95 - 0.12 * u; P.auto = 1
      break
    }
    case 'brk': {
      const p = S.p.brk
      const e1 = e(p, 0, 0.2), crack = e(p, 0.14, 0.34), snap = e(p, 0.34, 0.4), open = e(p, 0.38, 0.9), push = e(p, 0.78, 1)
      P.sc = (lerp(1.1, 1.3, e1) + 0.1 * push) * (m ? 0.7 : 1)
      P.tilt = lerp(0.83, 0.6, e1) - 0.2 * open
      P.spin = TAU * e1
      P.cy = (m ? lerp(0.1, 0.12, e1) : lerp(0.02, 0.0, e1)) - (m ? 0.05 : 0.1) * push
      P.z = 0.6 * push
      P.crack = crack
      P.sep = (0.07 * snap + 0.93 * open) * (m ? 0.8 : 1)
      P.hinge = e(p, 0.4, 0.95)
      P.dripT = rng(p, 0.42, 1) * 3.4
      break
    }
    case 'intro': {
      const u = S.p.intro
      const re = 1 - e(u, 0, 0.3) // halves rejoin
      P.sep = re; P.hinge = re; P.dripT = 3.4 * re
      P.cx = m ? 0 : lerp(0.4, 0.3, u); P.cy = m ? 0.2 : 0
      P.sc = lerp(m ? 1.0 : 1.05, m ? 0.85 : 0.95, e(u, 0.2, 0.6))
      P.tilt = lerp(0.9, 1.25, e(u, 0.25, 0.55)) + 0.9 * e(u, 0.55, 0.9) - 0.4 * e(u, 0.85, 1)
      P.spin = TAU + Math.PI * e(u, 0.2, 1)
      P.yaw = 0.6 * Math.sin(u * 5)
      break
    }
    case 'prod': {
      const flip = S.prodIndex % 2 === 0
      P.cx = m ? 0 : flip ? 0.34 : -0.34
      P.cy = m ? 0.24 : 0.0
      P.sc = m ? 0.62 : 0.78; P.tilt = 0.95; P.auto = 1
      P.pop = 1
      break
    }
    case 'ingr': {
      const u = S.p.ingr
      P.cx = 0; P.cy = m ? 0.14 : 0.12
      P.sc = m ? 0.6 : 0.62 + 0.08 * u; P.tilt = 0.95; P.auto = 1
      P.ingr = e(u, 0.05, 0.62)
      break
    }
    case 'close': {
      const u = S.p.close
      P.sep = m ? 0.5 : 0.62; P.hinge = 0.95; P.sc = m ? 1.15 : 2.3; P.tilt = 0.38 + 0.08 * u; P.z = 0.5
      P.cx = m ? lerp(0.25, -0.25, u) : lerp(0.18, -0.18, u); P.cy = m ? 0.05 : 0
      P.yaw = lerp(0.25, -0.25, u)
      P.dripT = 2.0 + u * 1.2
      break
    }
    case 'final': {
      P.sep = m ? 0.24 : 0.3; P.hinge = 0.55; P.sc = m ? 1.0 : 1.45; P.tilt = 0.6; P.cy = m ? 0.2 : 0.1; P.cx = 0
      P.loop = 1; P.glow = 1.2
      break
    }
    default: {
      P.show = 0
    }
  }
  P.crack = clamp(P.crack)
  void smooth; void time
}
