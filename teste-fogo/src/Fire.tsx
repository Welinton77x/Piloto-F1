import React, {useMemo} from "react";
import * as THREE from "three";
import {Billboard} from "@react-three/drei";
import {rng, canvasTex} from "./util";

/* ---------- Chama: shader com ruído subindo, cores quentes acima de 1 para o bloom ---------- */
const vert = /* glsl */ `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`;

const frag = /* glsl */ `
uniform float uTime; uniform float uSeed; uniform float uPower; uniform float uCore;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float n2(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
float fbm(vec2 p){ float v=0.0, a=0.5; for(int i=0;i<5;i++){ v+=a*n2(p); p*=2.03; a*=0.5; } return v; }
void main(){
  vec2 uv = vUv;
  float t = uTime;
  float n  = fbm(vec2(uv.x*3.2 + uSeed, uv.y*2.6 - t*2.6));
  float n2v = fbm(vec2(uv.x*6.0 - uSeed, uv.y*5.0 - t*4.1));
  float y = uv.y;
  float x = (uv.x - 0.5) * 2.0;
  x += (n - 0.5) * 0.9 * y;                       // a chama ondula mais no alto
  float width = 0.62 * pow(1.0 - y, 0.75) * (0.75 + 0.5*n2v);
  float body = 1.0 - smoothstep(width*0.45, width, abs(x));
  body *= smoothstep(0.0, 0.18, y);               // base arredondada
  float heat = body * (1.0 - smoothstep(0.15, 1.0, y + (n2v-0.5)*0.5));
  heat = clamp(heat * (0.9 + 0.6*n), 0.0, 1.0);
  vec3 red = vec3(0.9, 0.12, 0.02);
  vec3 orange = vec3(1.0, 0.42, 0.05);
  vec3 yellow = vec3(1.0, 0.82, 0.25);
  vec3 white = vec3(1.0, 0.97, 0.85);
  vec3 col = mix(red, orange, smoothstep(0.08, 0.4, heat));
  col = mix(col, yellow, smoothstep(0.45, 0.75, heat) * uCore);
  col = mix(col, white, smoothstep(0.92, 1.0, heat) * uCore * 0.6);
  float a = smoothstep(0.03, 0.35, heat) * uPower;
  gl_FragColor = vec4(col * (0.95 + 0.9*heat), a * 0.95);
}`;

export const Flame: React.FC<{
  t: number; // segundos
  power?: number; // 0..1 (some/aparece)
  height?: number;
  width?: number;
  seed?: number;
  core?: number;
  position?: [number, number, number];
}> = ({t, power = 1, height = 0.5, width = 0.32, seed = 0, core = 1, position = [0, 0, 0]}) => {
  const mats = useMemo(
    () =>
      [0, 1].map(
        (k) =>
          new THREE.ShaderMaterial({
            vertexShader: vert,
            fragmentShader: frag,
            transparent: true,
            depthWrite: false,
            blending: THREE.NormalBlending,
            side: THREE.DoubleSide,
            uniforms: {uTime: {value: 0}, uSeed: {value: seed + k * 3.7}, uPower: {value: 1}, uCore: {value: core}},
          }),
      ),
    [seed, core],
  );
  mats[0].uniforms.uTime.value = t;
  mats[1].uniforms.uTime.value = t * 1.2 + 5;
  mats[0].uniforms.uPower.value = power;
  mats[1].uniforms.uPower.value = power * 0.55;
  if (power <= 0.001) return null;
  return (
    <group position={position}>
      <Billboard lockX lockZ>
        <mesh position={[0, height * 0.42, 0]} material={mats[0]}>
          <planeGeometry args={[width, height]} />
        </mesh>
        <mesh position={[0, height * 0.32, 0.01]} material={mats[1]}>
          <planeGeometry args={[width * 0.6, height * 0.72]} />
        </mesh>
      </Billboard>
    </group>
  );
};

/* ---------- Brasas / faíscas ---------- */
const dotTex = () =>
  canvasTex("dot", 64, 64, (c) => {
    const g = c.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.25, "rgba(255,220,150,0.9)");
    g.addColorStop(1, "rgba(255,120,0,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 64);
  });

export const Embers: React.FC<{
  t: number;
  count?: number;
  origin?: [number, number, number];
  spread?: number;
  rise?: number;
  life?: number;
  size?: number;
  power?: number;
  seed?: number;
  burst?: number; // se definido: explosão radial começando nesse instante (s)
}> = ({t, count = 50, origin = [0, 0, 0], spread = 0.15, rise = 0.9, life = 1.4, size = 0.035, power = 1, seed = 1, burst}) => {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
    return g;
  }, [count]);
  const seeds = useMemo(() => {
    const r = rng(seed * 101 + 7);
    return Array.from({length: count}, () => [r(), r(), r(), r(), r()]);
  }, [count, seed]);
  const mat = useMemo(
    () =>
      new THREE.PointsMaterial({
        map: dotTex(),
        size,
        color: new THREE.Color(1.4, 0.55, 0.12),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true,
      }),
    [size],
  );
  mat.opacity = power;
  const arr = geo.attributes.position.array as Float32Array;
  seeds.forEach(([a, b, c, d, e], i) => {
    let x: number, y: number, z: number;
    if (burst !== undefined) {
      const k = Math.max(0, t - burst);
      const ang = a * Math.PI * 2;
      const el = (b - 0.3) * 1.6;
      const sp = (0.8 + c * 1.8) * (1 - Math.exp(-k * 3)) * spread * 4;
      x = Math.cos(ang) * Math.cos(el) * sp;
      z = Math.sin(ang) * Math.cos(el) * sp;
      y = Math.sin(el) * sp + k * rise * 0.3 - k * k * 0.4;
      if (k <= 0 || k > life * (0.5 + d)) y = -999;
    } else {
      const ph = (t / (life * (0.6 + d * 0.8)) + a) % 1;
      x = (b - 0.5) * spread * 2 + Math.sin(t * 3 + e * 9) * 0.04 * ph;
      z = (c - 0.5) * spread * 2 + Math.cos(t * 2.4 + a * 9) * 0.04 * ph;
      y = ph * rise * (0.6 + e * 0.8);
      if (ph > 0.92) y = -999;
    }
    arr[i * 3] = origin[0] + x;
    arr[i * 3 + 1] = origin[1] + y;
    arr[i * 3 + 2] = origin[2] + z;
  });
  geo.attributes.position.needsUpdate = true;
  if (power <= 0.001) return null;
  return <points geometry={geo} material={mat} frustumCulled={false} />;
};

/** Luz alaranjada tremeluzente para iluminar o rosto e o cenário */
export const FireLight: React.FC<{t: number; power: number; position: [number, number, number]; intensity?: number; distance?: number}> = ({
  t,
  power,
  position,
  intensity = 6,
  distance = 4,
}) => {
  const flick = 0.85 + 0.15 * Math.sin(t * 23) * Math.sin(t * 7.3 + 1);
  return <pointLight position={position} color="#ff7a2a" intensity={intensity * power * flick} distance={distance} decay={1.6} />;
};

/* ---------- vapor / fumaça: sprites brancos que sobem e se espalham ---------- */
const puffTex = () =>
  canvasTex("puff", 128, 128, (c) => {
    const g = c.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, "rgba(255,255,255,0.9)");
    g.addColorStop(0.5, "rgba(255,255,255,0.35)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 128);
  });

export const Steam: React.FC<{
  t: number;
  origin?: [number, number, number];
  count?: number;
  spread?: number;
  rise?: number;
  size?: number;
  power?: number;
  color?: string;
  seed?: number;
  life?: number;
}> = ({t, origin = [0, 0, 0], count = 24, spread = 0.2, rise = 1, size = 0.25, power = 1, color = "#ffffff", seed = 3, life = 2}) => {
  const items = useMemo(() => {
    const r = rng(seed * 31 + 1);
    return Array.from({length: count}, () => [r(), r(), r(), r()]);
  }, [count, seed]);
  const mats = useMemo(
    () => items.map(() => new THREE.SpriteMaterial({map: puffTex(), color, transparent: true, depthWrite: false})),
    [items, color],
  );
  if (power <= 0.001) return null;
  return (
    <group position={origin}>
      {items.map(([a, b, c, d], i) => {
        const ph = (t / (life * (0.7 + d * 0.6)) + a) % 1;
        const sc = size * (0.4 + ph * 1.4);
        mats[i].opacity = power * 0.55 * Math.sin(ph * Math.PI);
        mats[i].rotation = a * 6 + t * 0.3;
        return (
          <sprite
            key={i}
            material={mats[i]}
            position={[(b - 0.5) * spread * 2 * (1 + ph), ph * rise, (c - 0.5) * spread * 2 * (1 + ph)]}
            scale={[sc, sc, sc]}
          />
        );
      })}
    </group>
  );
};
