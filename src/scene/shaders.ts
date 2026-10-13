import * as THREE from 'three'

// Shared uniforms: mutated in place when the flavor changes (no shader recompiles)
export const U = {
  c1: { value: new THREE.Color() }, c2: { value: new THREE.Color() }, c3: { value: new THREE.Color() },
  i1: { value: new THREE.Color() }, i2: { value: new THREE.Color() }, fill: { value: new THREE.Color() },
  fillGloss: { value: 1 }, crack: { value: 0 }, crackLen: { value: 0 },
}

const NOISE = /* glsl */ `
float hash31(vec3 p){ p = fract(p*0.3183099 + 0.1); p *= 17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
float vnoise(vec3 x){ vec3 i=floor(x); vec3 f=fract(x); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash31(i),hash31(i+vec3(1,0,0)),f.x), mix(hash31(i+vec3(0,1,0)),hash31(i+vec3(1,1,0)),f.x),f.y),
             mix(mix(hash31(i+vec3(0,0,1)),hash31(i+vec3(1,0,1)),f.x), mix(hash31(i+vec3(0,1,1)),hash31(i+vec3(1,1,1)),f.x),f.y), f.z); }
float fbm(vec3 p){ float a=0.5,s=0.0; for(int i=0;i<4;i++){ s+=a*vnoise(p); p=p*2.03+1.7; a*=0.5; } return s; }
// MUST match jag() in geometry.ts
float jag(float z){ return 0.06*sin(2.0*z) + 0.03*sin(5.3*z) + 0.012*sin(12.0*z); }
`
const HEAD = /* glsl */ `
varying vec3 vOP;
uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3; uniform vec3 uI1; uniform vec3 uI2; uniform vec3 uFill;
uniform float uFillGloss; uniform float uCrack; uniform float uCrackLen;
${NOISE}
`
const BUMP = (hExpr: string, k: string) => /* glsl */ `
{
  float bh = ${hExpr};
  vec2 dHdxy = vec2(dFdx(bh), dFdy(bh)) * ${k};
  vec3 bsx = dFdx(-vViewPosition), bsy = dFdy(-vViewPosition);
  vec3 bR1 = cross(bsy, normal), bR2 = cross(normal, bsx);
  float bDet = dot(bsx, bR1) * faceDirection;
  vec3 bGrad = sign(bDet) * (dHdxy.x * bR1 + dHdxy.y * bR2);
  normal = normalize(abs(bDet) * normal - bGrad);
}
`
function patch(m: THREE.Material, color: string, bump: string, rough = '', pocket = false) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uC1 = U.c1; sh.uniforms.uC2 = U.c2; sh.uniforms.uC3 = U.c3; sh.uniforms.uI1 = U.i1; sh.uniforms.uI2 = U.i2
    sh.uniforms.uFill = U.fill; sh.uniforms.uFillGloss = U.fillGloss; sh.uniforms.uCrack = U.crack; sh.uniforms.uCrackLen = U.crackLen
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vOP;' + (pocket ? '\nattribute float aPocket; varying float vPk;' : '')).replace('#include <begin_vertex>', '#include <begin_vertex>\nvOP = position;' + (pocket ? '\nvPk = aPocket;' : ''))
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\n' + (pocket ? 'varying float vPk;\n' : '') + HEAD)
      .replace('#include <color_fragment>', '#include <color_fragment>\n' + color)
      .replace('#include <normal_fragment_maps>', '#include <normal_fragment_maps>\n' + bump)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + rough)
  }
}

export function makeMaterials() {
  const shell = new THREE.MeshStandardMaterial({ roughness: 0.84, metalness: 0, envMapIntensity: 0.45 })
  patch(shell, /* glsl */ `
    vec3 sp = vOP;
    float sn1 = fbm(sp*2.6); float sn2 = fbm(sp*7.0+3.1); float sn3 = vnoise(sp*18.0);
    vec3 scol = mix(uC1, uC2, smoothstep(0.35,0.7,sn1));
    scol = mix(scol, uC3, smoothstep(0.5,0.78,sn2)*0.55);
    float srr = length(sp.xz)/1.5;
    scol = mix(scol, uC3, smoothstep(0.84,1.05,srr)*0.35 + smoothstep(-0.05,-0.3,sp.y)*0.6);
    scol *= 0.9 + 0.2*sn3;
    float sjx = jag(sp.z);
    float sdd = abs(sp.x - sjx + 0.025*(vnoise(sp*22.0)-0.5));
    float sline = (1.0 - smoothstep(0.0, 0.012+0.03*uCrack, sdd)) * step(abs(sp.z), uCrackLen) * step(0.001,uCrack);
    scol *= 1.0 - 0.93*sline;
    diffuseColor.rgb = scol;
  `, BUMP('fbm(vOP*7.0)*0.8 + vnoise(vOP*20.0)*0.2', '0.08'))

  const face = new THREE.MeshStandardMaterial({ roughness: 0.92, metalness: 0, envMapIntensity: 0.55, side: THREE.DoubleSide })
  patch(face, /* glsl */ `
    vec3 fp = vOP;
    float fc = fbm(fp*11.0); float fc2 = vnoise(fp*30.0);
    vec3 fdough = mix(uI1, uI2, smoothstep(0.35,0.7,fc));
    fdough *= 0.86 + 0.26*fc2;
    float fPk = smoothstep(0.57,0.63, vPk + 0.07*(fbm(fp*9.0)-0.5));
    fdough = mix(fdough, fdough*0.55, smoothstep(0.62,0.7,vnoise(fp*22.0))*0.7);
    diffuseColor.rgb = mix(fdough, uFill, fPk);
  `, BUMP('(fbm(vOP*9.0)*0.8 + vnoise(vOP*26.0)*0.2) * (1.0 - fPk)', '0.06'),
  'roughnessFactor = mix(0.95, 0.16 + 0.6*(1.0-uFillGloss), fPk);', true)

  const goo = new THREE.MeshPhysicalMaterial({ color: '#2b1209', roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.1, envMapIntensity: 1.5 })
  const chunk = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.25, envMapIntensity: 1.2 })
  const soft = new THREE.MeshPhysicalMaterial({ color: '#ffffff', roughness: 0.5, clearcoat: 0.3, envMapIntensity: 0.9 })
  const salt = new THREE.MeshStandardMaterial({ color: '#f6f2ea', roughness: 0.2, metalness: 0, emissive: '#fff4e0', emissiveIntensity: 0.18, flatShading: true })
  return { shell, face, goo, chunk, soft, salt }
}
export type Mats = ReturnType<typeof makeMaterials>
