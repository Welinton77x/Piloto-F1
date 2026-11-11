import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame} from "@react-three/fiber";
import {Boy, Pose, Look} from "./Boy";
import {Steam} from "./Fire";
import {Post} from "./Post";
import {physics} from "./Physics";
import {Cam, TitleTag, Flash, fontFamily} from "./Video";
import {Pharmacy, Bag, Portal, Shards, Birmingham, VITRINE, BellTower, ClockShop, WineGlass, Carriage, TimeBubble, ClockWindow} from "./Sets3";
import {InteriorLights, Box} from "./Sets";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import W from "./timingTempo.json";

type V3 = [number, number, number];
type Wd = {w: string; s: number; e: number; line: number};
const words = W as Wd[];

/* ---------- linha do tempo amarrada na narração ---------- */
const clean = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w).startsWith(clean(txt)));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
export const TOTAL_TEMPO = F(words[words.length - 1].e + 1.6);

/* ---------- personagens (estilo palito) ---------- */
const DAVI: Look = {palito: true, skin: "#b77b4e", hair: "#17110c", hairStyle: "short", shirt: "#f1efe8", trim: "#c9c4b5", pants: "#34507a", shorts: true, slim: 0.8};
const AFINADOR: Look = {palito: true, skin: "#e6cbb5", hair: "#2a2a2a", hairStyle: "short", shirt: "#3a3540", trim: "#222", pants: "#2a2830", coat: "#2a2430", scarf: "#7a1a1a", glasses: true};
const AGNES: Look = {palito: true, skin: "#f0c8a8", hair: "#dcdcdc", hairStyle: "short", shirt: "#6a3a5a", trim: "#4a2a3a", pants: "#4a2a3a", coat: "#5a2a4a", glasses: true};
const POVO: Look[] = [
  {palito: true, shirt: "#7a6a52", pants: "#3a3530", hair: "#3a2a1a", hairStyle: "short", skin: "#e8c0a0", cap: "#4a3a2a"},
  {palito: true, shirt: "#5a6a7a", pants: "#2e3038", hair: "#1a1a1a", hairStyle: "short", skin: "#c68a5a"},
  {palito: true, shirt: "#8a3a3a", pants: "#3a3030", hair: "#6a4a2a", hairStyle: "short", skin: "#f0d0b0", coat: "#5a4030"},
  {palito: true, shirt: "#4a5a3a", pants: "#2a2a2a", hair: "#b07a3a", hairStyle: "short", skin: "#e8c0a0", cap: "#2a3a4a"},
  {palito: true, shirt: "#6a5a7a", pants: "#3a3040", hair: "#2a1a10", hairStyle: "short", skin: "#8d5a3a", coat: "#3a3a4a"},
];

/* ---------- utilidades de pose ---------- */
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const kick = (f: number, a: number, len = 6) => (f < a ? 0 : Math.exp(-(f - a) / len));
const walkP = (f: number, a: number, rate = 1.5): Pose => {
  const ph = ((f - a) / FPS) * Math.PI * 2 * rate;
  return {walk: ph, walkAmt: 1, rShoulder: [Math.sin(ph) * 0.35, 0, -0.1], lShoulder: [-Math.sin(ph) * 0.35, 0, 0.1], rElbow: -0.35, lElbow: -0.35};
};
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
const hum = (f: number) => 0.18 + 0.04 * Math.sin(f / 3);
/** mãos tapando os ouvidos */
const earsCovered = (k: number): Pose => ({rShoulder: [-2.2 * k, 0, -0.08 - 0.22 * k], lShoulder: [-2.2 * k, 0, 0.08 + 0.22 * k], rElbow: -0.15 - 1.85 * k, lElbow: -0.15 - 1.85 * k, rWrist: [0, 0, 0.5 * k], lWrist: [0, 0, -0.5 * k]});

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

/** coloca filhos na posição da palma da mão */
const AtPalm: React.FC<{palm: React.RefObject<THREE.Object3D | null>; offset?: V3; children: React.ReactNode}> = ({palm, offset = [0, 0, 0], children}) => {
  const g = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.getWorldPosition(v);
    g.current.position.set(v.x + offset[0], v.y + offset[1], v.z + offset[2]);
  }, -1);
  return <group ref={g}>{children}</group>;
};

const Day: React.FC<{t: number; vw?: number; vb?: boolean}> = ({t, vw, vb}) => (
  <>
    <color attach="background" args={["#b9ae94"]} />
    <fog attach="fog" args={["#b8a888", 5, 26]} />
    <hemisphereLight args={["#f0e2c0", "#4a3a2a", 0.9]} />
    <directionalLight position={[-4, 7, 5]} intensity={2.2} color="#ffe2b0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.0004} shadow-normalBias={0.02} />
    <Birmingham t={t} v="day" vitrineWobble={vw} vitrineBroken={vb} />
  </>
);
const Night: React.FC<{t: number; swing: number; crack: number}> = ({t, swing, crack}) => (
  <>
    <color attach="background" args={["#151826"]} />
    <fog attach="fog" args={["#151826", 6, 30]} />
    <hemisphereLight args={["#5a6a98", "#1a1410", 0.55]} />
    <directionalLight position={[3, 8, 4]} intensity={0.6} color="#9db4ff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
    <Birmingham t={t} v="night" plaza />
    <BellTower t={t} swing={swing} crack={crack} p={[0, 0, -7.5]} />
    <pointLight position={[0, 7, -5.8]} color="#ffd890" intensity={4} distance={6} />
  </>
);
const Shop: React.FC<{t: number}> = ({t}) => (
  <>
    <color attach="background" args={["#1a120c"]} />
    <InteriorLights color="#ffd8a0" key1={[1.5, 2.8, 2.0]} power={0.8} />
    <pointLight position={[0.4, 1.6, -0.3]} color="#ffc070" intensity={2.5} distance={4} />
    <ClockShop t={t} />
  </>
);
const Dark: React.FC = () => <color attach="background" args={["#0a1222"]} />;

/* 0 — saindo da farmácia; o círculo de luz */
const S0: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const out = at(0, "sacolinha") + 6;
  const luz = at(0, "luz");
  const pux = at(0, "puxou");
  const sink = ramp(f, pux, pux + 10, (x) => x * x);
  const pose = physics("b0", (fr) => {
    const w = 1 - ramp(fr, out - 6, out);
    const look = ramp(fr, luz, luz + 8, easeOut);
    const s = ramp(fr, pux, pux + 10, (x) => x * x);
    return idle(fr, {
      ...(w > 0 ? walkP(fr, a, 1.3) : {}),
      walkAmt: w,
      pos: [0, -1.8 * s + 0.08 * ramp(fr, pux - 6, pux), lerp(-2.0, 0.2, ramp(fr, a, out))],
      rShoulder: [w > 0 ? 0.3 * Math.sin(((fr - a) / FPS) * 8.2) : 0, 0, -0.12 - 1.2 * s],
      lShoulder: [0, 0, 0.12 + 1.2 * s],
      rElbow: -0.25,
      head: [0.55 * look * (1 - s), 0, 0],
      pupil: [0, -0.8 * look],
      eyeWide: look,
      brow: look,
      mouthOpen: 0.6 * look,
      squash: -0.25 * s,
      smile: 0.6 * (1 - look),
    });
  }, a, f);
  const bagFall = f >= pux;
  const p = ramp(f, a, b, easeInOut);
  const sh = shake(f, 0.03 * kick(f, pux, 8));
  return (
    <>
      <Cam pos={[lerp(0.5, 0.3, p) + sh[0], lerp(1.5, 1.2, ramp(f, luz, pux)) + sh[1], lerp(3.6, 2.6, p)]} look={[0, lerp(1.0, 0.5, ramp(f, luz, pux)), 0]} fov={42} />
      <color attach="background" args={["#a8d4f6"]} />
      <hemisphereLight args={["#eaf4ff", "#8a8070", 0.55]} />
      <directionalLight position={[3, 7, 5]} intensity={1.5} color="#fff4e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <Pharmacy t={t} />
      <Portal t={t} power={ramp(f, luz, luz + 12, easeOut) * (1 - ramp(f, pux + 8, pux + 16))} p={[0, 0, 0.2]} />
      {sink < 0.95 && <Boy pose={pose} look={DAVI} palmRef={palm} />}
      {!bagFall && (
        <AtPalm palm={palm} offset={[0, -0.02, 0]}>
          <Bag />
        </AtPalm>
      )}
      {bagFall && (
        <group position={[-0.32, Math.max(0.2, 0.6 - 4.9 * ((f - pux) / FPS) ** 2), 0.25]} rotation={[0, 0, Math.min(1.3, (f - pux) / 6)]}>
          <Bag />
        </group>
      )}
    </>
  );
};

/* praça à noite: povo na feira */
const Crowd: React.FC<{f: number; a: number; flee?: number}> = ({f, a, flee = 0}) => (
  <>
    {[-2.6, -1.3, 0.2, 1.5, 2.8, -0.6].map((x, i) => (
      <Boy key={i} look={POVO[i % 5]} pose={physics(`crowd${i}_${a}`, (fr) => idle(fr + i * 13, {...(flee > 0 ? walkP(fr, a, 2.2) : {}), walkAmt: flee, pos: [x + flee * ((fr - a) / FPS) * (x > 0 ? 1.2 : -1.2), 0, 1.0 - (i % 3) * 0.5 + flee * ((fr - a) / FPS) * 0.8], rotY: flee > 0 ? (x > 0 ? 2.2 : -2.2) : Math.PI + (x > 0 ? 0.3 : -0.3), head: [-0.35, 0, 0], eyeWide: 0.5, mouthOpen: 0.2 * Math.abs(Math.sin((fr + i * 7) / 6))}), a, f)} />
    ))}
  </>
);

/* 19 — o sino toca sozinho */
const S19: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = ramp(f, at(19, "sino"), b, (x) => x);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(2.2, 1.6, p), lerp(1.4, 1.7, p), lerp(5.5, 4.6, p)]} look={[0, lerp(6.0, 8.6, p), -7.5]} fov={55} />
      <Night t={t} swing={0.15 + 0.35 * k} crack={0} />
      <Crowd f={f} a={a} />
    </>
  );
};

/* 20 — o Afinador no telhado; o sino pode rachar */
const S20: React.FC<ShotProps> = ({f, a, b, t}) => {
  const r = at(20, "rachar");
  const af = physics("b20", (fr) => idle(fr, {pos: [3.4, 5.1, -4.0], rotY: -2.3, mouthOpen: hum(fr) + 0.1, head: [-0.15, 0, 0], rShoulder: [0, 0, -0.5], lShoulder: [0, 0, 0.5], rElbow: -0.3, lElbow: -0.3}), a, f);
  const sw = (fr: number) => Math.max(0, fr - r);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(5.4, 5.0, p), 6.0, lerp(-1.4, -1.9, p)]} look={[1.4, 7.0, -7.0]} fov={46} />
      <Night t={t} swing={0.5} crack={ramp(f, r, r + 20)} />
      <Boy pose={af} look={AFINADOR} />
      {sw(f) > 0 && null}
    </>
  );
};

/* 13b/14 — dentro da loja: dona Agnes tranca a porta e explica */
const S14: React.FC<ShotProps> = ({f, a, b, t}) => {
  const tr = at(12, "trancou");
  const d = at(12, "disse");
  const ag = physics("b14", (fr) => {
    const lock = ramp(fr, tr - 4, tr + 6) * (1 - ramp(fr, d - 4, d + 4));
    const turn = ramp(fr, d - 6, d + 4, easeInOut);
    return idle(fr, {pos: [-0.45, 0, 0.3], rotY: lerp(Math.PI, Math.PI / 2 + 0.3, turn), rShoulder: [-1.2 * lock, 0, -0.1], rElbow: -0.4 * lock, rWrist: [0, 0, 1.2 * lock * Math.sin(fr / 3)], mouthOpen: talk(fr, d, L(13) - 6), brow: -0.5, head: [0.05, 0, 0]});
  }, a, f);
  const davi = physics("b14d", (fr) => idle(fr, {pos: [0.35, 0, 0.15], rotY: -Math.PI / 2 + 0.3, eyeWide: 0.5, brow: 0.6, pupil: [-0.5, 0], rShoulder: [0, 0, -0.1], lShoulder: [0, 0, 0.1]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.2, 0.0, p), 1.45, lerp(3.0, 2.6, p)]} look={[-0.05, 1.15, 0.1]} fov={44} />
      <Shop t={t} />
      <Boy pose={ag} look={AGNES} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* ---------- a carruagem: rápida → câmera lenta (bolha) → rápida ---------- */
const SL = at(2, "vieram"); // começa a câmera lenta
const RS = at(3, "voltou"); // o tempo volta
const STEP = at(3, "passos"); // Davi sai da frente
const LAND = L(1) - 3 + 12;
const carX = (f: number) => {
  const xSl = -4.5;
  if (f < SL) return xSl - 6 * ((SL - f) / FPS);
  const xRs = xSl + 0.1 * ((RS - SL) / FPS);
  if (f < RS) return xSl + 0.1 * ((f - SL) / FPS);
  return xRs + 7 * ((f - RS) / FPS);
};
const carPh = (f: number) => {
  if (f < SL) return (f / FPS) * 12;
  const p0 = (SL / FPS) * 12;
  if (f < RS) return p0 + ((f - SL) / FPS) * 1.2;
  return p0 + ((RS - SL) / FPS) * 1.2 + ((f - RS) / FPS) * 12;
};
/** tempo "visto de fora" (para fumaça/poeira congelarem durante a câmera lenta) */
const slowT = (f: number) => {
  if (f < SL) return f / FPS;
  if (f < RS) return SL / FPS + ((f - SL) / FPS) * 0.1;
  return SL / FPS + ((RS - SL) / FPS) * 0.1 + (f - RS) / FPS;
};
const isSlow = (f: number) => f >= SL && f < RS;

const Rua: React.FC<ShotProps> = ({f, a}) => {
  const t = slowT(f);
  const davi = physics("t1", (fr) => {
    const fall = fr < LAND ? lerp(3.5, 0, ((fr - (L(1) - 3)) / 12) ** 2) : 0;
    const see = ramp(fr, at(1, "carruagem") - 4, at(1, "carruagem") + 8, easeOut);
    const step = ramp(fr, STEP, STEP + 18, easeInOut);
    const slowK = isSlow(fr) ? 1 : 0;
    return idle(fr, {
      ...(step > 0 && step < 1 ? walkP(fr, STEP, 1.6) : {}),
      walkAmt: step > 0 && step < 1 ? 1 : 0,
      pos: [0, fall, lerp(0, 1.7, step)],
      rotY: lerp(-Math.PI / 2 + 0.4, -Math.PI / 2 + 0.2, see) + (step > 0 && step < 1 ? Math.PI / 2 : 0),
      squash: 0.22 * kick(fr, LAND, 5),
      eyeWide: Math.max(0.6, see),
      brow: see,
      mouthOpen: 0.6 * see * (1 - slowK * 0.5),
      rShoulder: [-0.9 * see * (1 - step), 0, -0.4],
      lShoulder: [-0.9 * see * (1 - step), 0, 0.4],
      rElbow: -0.6,
      lElbow: -0.6,
      head: [0, lerp(0, -0.5, see), 0],
      pupil: [-0.7 * see, 0],
    });
  }, a, f);
  // câmeras: chegada → câmera lenta dramática → abertura quando o tempo volta
  let cam: {pos: V3; look: V3; fov: number};
  if (f < SL - 3) {
    const p = ramp(f, a, SL, easeInOut);
    cam = {pos: [lerp(1.5, 2.2, p), 1.3, lerp(4.5, 3.6, p)], look: [lerp(0, -1.5, p), 1.2, 0], fov: 46};
  } else if (f < STEP) {
    const p = ramp(f, SL, STEP, easeInOut);
    cam = {pos: [lerp(1.6, 1.0, p), lerp(0.55, 0.7, p), lerp(1.6, 1.3, p)], look: [-1.2, 1.25, 0], fov: 50};
  } else {
    const p = ramp(f, STEP, L(4), easeInOut);
    cam = {pos: [lerp(2.5, 3.2, p), 1.6, lerp(5.0, 5.6, p)], look: [0, 1.0, 0.4], fov: 46};
  }
  const sh = shake(f, 0.03 * kick(f, LAND, 5) + 0.02 * kick(f, RS, 6));
  cam.pos = [cam.pos[0] + sh[0], cam.pos[1] + sh[1], cam.pos[2]];
  return (
    <>
      <Cam {...cam} />
      <Day t={t} />
      <Carriage x={carX(f)} ph={carPh(f)} dust={0.6} t={t} />
      <Boy pose={davi} look={DAVI} />
      <TimeBubble t={f / FPS} power={ramp(f, SL, SL + 10) * (1 - ramp(f, RS - 6, RS + 4))} p={[0, 1.0, 0]} r={1.1} />
      {[-2.2, 2.4].map((x, i) => (
        <Boy key={i} look={POVO[i]} pose={idle(f + i * 20, {...walkP(Math.round(slowT(f) * FPS), 0, 1.1), pos: [x + slowT(f) * (i ? -0.4 : 0.4) - (i ? -2 : 2), 0, -2.4], rotY: i ? -Math.PI / 2 : Math.PI / 2, head: [0, i ? -0.4 : 0.4, 0]})} />
      ))}
    </>
  );
};

/* 7 — a bolha (Davi parado com a bolha, o mundo devagar) */
const S7: React.FC<ShotProps> = ({f, a, b}) => {
  const k = ramp(f, at(7, "bolha") - 4, at(7, "bolha") + 10, easeOut);
  const t = (a + (f - a) * (1 - 0.9 * k)) / FPS;
  const davi = physics("t7", (fr) => idle(fr, {pos: [0, 0, 0.8], rotY: 0, smile: 0.7, brow: 0.3, rShoulder: [-0.3, 0, -0.7 * ramp(fr, at(7, "bolha"), at(7, "bolha") + 10)], lShoulder: [-0.3, 0, 0.7 * ramp(fr, at(7, "bolha"), at(7, "bolha") + 10)], rElbow: -0.4, lElbow: -0.4}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.6, 0.2, p), 1.45, lerp(4.0, 3.4, p)]} look={[0, 1.15, 0.6]} fov={44} />
      <Day t={t} />
      <Boy pose={davi} look={DAVI} />
      <TimeBubble t={f / FPS} power={k} p={[0, 1.0, 0.8]} r={1.15} />
      {[-1.8, 1.6].map((x, i) => (
        <Boy key={i} look={POVO[i + 2]} pose={idle(Math.round(t * FPS) + i * 9, {...walkP(Math.round(t * FPS), 0, 1.1), pos: [x + (t - a / FPS) * (i ? -0.5 : 0.5), 0, -1.6], rotY: i ? -Math.PI / 2 : Math.PI / 2})} />
      ))}
    </>
  );
};

/* 9 — o preço: ofegante */
const S9cost: React.FC<ShotProps> = ({f, a, b}) => {
  const davi = physics("t9", (fr) => idle(fr, {pos: [0, -0.05, 0.6], rotY: 0.3, torso: [0.75, 0, 0], head: [-0.45, 0, 0], rShoulder: [-0.75, 0, -0.15], lShoulder: [-0.75, 0, 0.15], rElbow: -0.1, lElbow: -0.1, legLift: 0.15, mouthOpen: 0.5 + 0.3 * Math.abs(Math.sin(fr / 3)), blink: 0.4, brow: 0.6, breathe: Math.sin(fr / 2.5) * 3}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(1.7, 1.4, p), 1.35, lerp(3.2, 2.8, p)]} look={[0, 0.8, 0.6]} fov={42} />
      <Day t={f / FPS} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 10 — os relógios da vitrine disparam quando ele passa */
const S10: React.FC<ShotProps> = ({f, a, b}) => {
  const sp = at(10, "dispararam");
  const x = lerp(-3.2, 0.6, ramp(f, a, b));
  const davi = physics("t10", (fr) => idle(fr, {...walkP(fr, a, 1.2), pos: [lerp(-3.2, 0.6, ramp(fr, a, b)), 0, -2.6], rotY: Math.PI / 2, head: [0, 0.5 * ramp(fr, sp, sp + 8), 0], eyeWide: ramp(fr, sp, sp + 8), pupil: [0.7, 0]}), a, f);
  const near = clamp(1 - Math.abs(x - -0.65) / 1.6);
  return (
    <>
      <Cam pos={[-0.2, 1.3, -0.3]} look={[-0.65, 0.95, -3.4]} fov={44} />
      <Day t={f / FPS} />
      <ClockWindow t={f / FPS} spin={f >= sp - 6 ? Math.max(near, 0.6) : near * 0.3} />
      <Boy pose={davi} look={DAVI} />
      <TimeBubble t={f / FPS} power={0.35} p={[x, 1.0, -2.6]} r={0.9} />
    </>
  );
};

/* 11 — a dona Agnes puxa o Davi pra dentro */
const S11: React.FC<ShotProps> = ({f, a, b}) => {
  const m = at(11, "puxou");
  const davi = physics("t11", (fr) => {
    const kk = ramp(fr, m, m + 10, easeOut);
    return idle(fr, {pos: [lerp(-0.4, -1.45, kk), 0, lerp(-2.3, -3.05, kk)], rotY: lerp(Math.PI / 2, -2.4, kk), torso: [0, 0, 0.35 * kick(fr, m + 2, 8)], eyeWide: kk, brow: kk, mouthOpen: 0.5 * kk, rShoulder: [-1.3 * kk, 0, -0.4], rElbow: -0.2});
  }, a, f);
  const ag = physics("t11a", (fr) => {
    const run = ramp(fr, at(11, "saiu"), at(11, "saiu") + 14, easeOut);
    return idle(fr, {...(run > 0 && run < 1 ? walkP(fr, a, 2.2) : {}), walkAmt: run > 0 && run < 1 ? 1 : 0, pos: [-1.7, 0, lerp(-3.4, -2.75, run)], rotY: 0.6, rShoulder: [-1.3 + 0.4 * ramp(fr, m, m + 10), 0, -0.1], rElbow: -0.1 - 1.2 * ramp(fr, m, m + 10), brow: -0.4});
  }, a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.9, 0.6, p), 1.5, lerp(0.6, 0.2, p)]} look={[-1.3, 1.15, -3.0]} fov={44} />
      <Day t={f / FPS} />
      <ClockWindow t={f / FPS} spin={0.3} />
      <Boy pose={ag} look={AGNES} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 13 — lembrança: o Afinador estourando uma vitrine */
const S13: React.FC<ShotProps> = ({f, a, b}) => {
  const boom = at(13, "cantarolando") + 12;
  const c = a + 4;
  const af = physics("t13", (fr) => idle(fr, {pos: [0.35, 0, -2.05], rotY: Math.PI + 0.6, mouthOpen: 0.3 + 0.1 * Math.sin(fr / 2), head: [-0.1 * ramp(fr, c, boom), 0, 0]}), a, f);
  const wob = ramp(f, c, boom, (x) => x * x) * 3;
  const sh = shake(f, 0.03 * kick(f, boom, 6));
  return (
    <>
      <Cam pos={[2.5 + sh[0], 1.5 + sh[1], -0.5]} look={[0.7, 1.2, -2.7]} fov={44} />
      <Day t={f / FPS} vw={f < boom ? wob : 0} vb={f >= boom} />
      <Boy pose={af} look={AFINADOR} />
      {f >= boom && <Shards t={(f - boom) / FPS} origin={VITRINE.p} count={60} spread={[VITRINE.w, VITRINE.h, 0.05]} />}
    </>
  );
};

/* 15 — primeira lição: a taça na bolha */
const S15: React.FC<ShotProps> = ({f, a, b}) => {
  const tap = at(15, "bateu");
  const bub = at(15, "bolha");
  const des = at(15, "despencou");
  const ringing = f >= tap;
  const inBubble = ramp(f, bub - 2, bub + 8);
  // a taça vibra; na bolha, o ritmo (visto de fora) cai 10×
  const wob = ringing ? 0.7 * (1 - 0.85 * ramp(f, des - 4, des + 10)) : 0;
  const ag = physics("t15a", (fr) => idle(fr, {pos: [-0.75, 0, -0.85], rotY: 0.9, rShoulder: [-1.0 - 0.3 * kick(fr, tap, 4), 0, 0.1], rElbow: -0.5, mouthOpen: talk(fr, a, tap), brow: 0.2}), a, f);
  const davi = physics("t15d", (fr) => idle(fr, {pos: [0.4, 0, -1.3], rotY: -0.15, rShoulder: [-1.1 * ramp(fr, bub - 8, bub + 2), 0, 0.15], rElbow: -0.5, lShoulder: [-1.1 * ramp(fr, bub - 8, bub + 2), 0, -0.15], lElbow: -0.5, brow: -0.4, blink: fr > bub ? 1 : 0, head: [0.15, 0, 0]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.75, 0.6, p), 1.3, lerp(1.5, 1.3, p)]} look={[0.4, 1.0, -0.8]} fov={42} />
      <Shop t={f / FPS} />
      <WineGlass t={f / FPS * (1 - 0.9 * inBubble)} p={[0.4, 0.765, -0.6]} wobble={wob} />
      <TimeBubble t={f / FPS} power={inBubble} p={[0.4, 0.92, -0.6]} r={0.28} />
      <Boy pose={davi} look={DAVI} />
      <Boy pose={ag} look={AGNES} />
    </>
  );
};

/* 16 — aguentou três segundos e sentou no chão */
const S16: React.FC<ShotProps> = ({f, a, b}) => {
  const sit = at(16, "sentou");
  const davi = physics("t16", (fr) => {
    const k = ramp(fr, sit - 6, sit + 10, easeInOut);
    return idle(fr, {pos: [0.4, lerp(0, -0.62, k), lerp(-1.3, -0.9, k)], rotY: -0.15, legLift: 1.45 * k, torso: [lerp(0, -0.2, k), 0, 0], rShoulder: [lerp(-1.1, 0.5, k), 0, -0.3], lShoulder: [lerp(-1.1, 0.5, k), 0, 0.3], rElbow: -0.1, lElbow: -0.1, mouthOpen: 0.4 + 0.3 * Math.abs(Math.sin(fr / 3)), blink: 0.5, brow: 0.6, head: [-0.2 * k, 0, 0], breathe: Math.sin(fr / 2.5) * 3});
  }, a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.9, 0.7, p), 1.2, lerp(1.4, 1.2, p)]} look={[0.35, 0.75, -0.9]} fov={44} />
      <Shop t={f / FPS} />
      <WineGlass t={f / FPS} p={[0.4, 0.765, -0.6]} wobble={0.25} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 17/18 — o sino; o Afinador no telhado */
const S17: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = ramp(f, at(17, "sino"), b, (x) => x);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(2.2, 1.6, p), lerp(1.4, 1.7, p), lerp(5.5, 4.6, p)]} look={[0, lerp(6.0, 8.6, p), -7.5]} fov={55} />
      <Night t={t} swing={0.15 + 0.35 * k} crack={0} />
      <Crowd f={f} a={a} />
    </>
  );
};
const S18: React.FC<ShotProps> = ({f, a, b, t}) => {
  const r = at(18, "rachar");
  const af = physics("t18", (fr) => idle(fr, {pos: [3.4, 5.1, -4.0], rotY: -2.3, mouthOpen: hum(fr) + 0.1, head: [-0.15, 0, 0], rShoulder: [0, 0, -0.5], lShoulder: [0, 0, 0.5], rElbow: -0.3, lElbow: -0.3}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(5.4, 5.0, p), 6.0, lerp(-1.4, -1.9, p)]} look={[1.4, 7.0, -7.0]} fov={46} />
      <Night t={t} swing={0.5} crack={ramp(f, r, r + 20)} />
      <Boy pose={af} look={AFINADOR} />
    </>
  );
};

/* ---------- lista de planos ---------- */
const Empty: React.FC<ShotProps> = () => <Dark />;
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1) - 3, Comp: Rua},
  {from: L(4) - 3, Comp: Empty}, // Einstein
  {from: L(5) - 3, Comp: Empty}, // relógio na nave
  {from: L(6) - 3, Comp: Empty}, // GPS
  {from: L(7) - 3, Comp: S7},
  {from: L(8) - 3, Comp: Empty}, // som grave
  {from: L(9) - 3, Comp: S9cost},
  {from: L(10) - 3, Comp: S10},
  {from: L(11) - 3, Comp: S11},
  {from: at(11, "era") - 3, Comp: S14},
  {from: L(13) - 3, Comp: S13},
  {from: at(13, "ressonancia") - 3, Comp: Empty}, // balanço
  {from: L(14) - 3, Comp: Empty}, // ritmo
  {from: L(15) - 3, Comp: S15},
  {from: L(16) - 3, Comp: S16},
  {from: L(17) - 3, Comp: S17},
  {from: L(18) - 3, Comp: S18},
];
const SPLIT = at(19, "davi") - 8;

const Scene: React.FC<{f: number}> = ({f}) => {
  if (f >= SPLIT) return <Dark />;
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? SPLIT} t={f / FPS} />
      {C !== Empty && <Post />}
    </>
  );
};

/* ---------- tela dividida A/B ---------- */
const PA: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a + 10, a + 30);
  const davi = physics("tpa", (fr) => idle(fr, {pos: [0, 0, 0.5], rotY: Math.PI, blink: 1, brow: -0.6, rShoulder: [-2.4, 0, -0.3], lShoulder: [-2.4, 0, 0.3], rElbow: -0.2, lElbow: -0.2, head: [-0.4, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[1.2, 1.2, 3.2]} look={[0, 5.5, -7]} fov={52} />
      <Night t={(a + (f - a) * (1 - 0.9 * k)) / FPS} swing={0.5 * (1 - 0.8 * k)} crack={0.4} />
      <TimeBubble t={f / FPS} power={k} p={[0, 8.9, -7.5]} r={1.4} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};
const PB: React.FC<ShotProps> = ({f, a, t}) => {
  const z = 1.5 - ((f - a) / FPS) * 1.0;
  const davi = physics("tpb", (fr) => idle(fr, {...walkP(fr, a, 2.4), walkAmt: 1.4, pos: [0, 0, 1.5 - ((fr - a) / FPS) * 1.0], rotY: Math.PI, torso: [0.3, 0, 0], rShoulder: [-1.4, 0, -0.6], rElbow: -0.2, mouthOpen: 1, eyeWide: 1, brow: 1}), a, f);
  return (
    <>
      <Cam pos={[1.0, 1.6, z + 3.2]} look={[0, 1.2, z - 2]} fov={46} />
      <Night t={t} swing={0.5} crack={0.4} />
      <Boy pose={davi} look={DAVI} />
      <TimeBubble t={f / FPS} power={0.5} p={[0, 1.0, z]} r={1.0} />
      <Crowd f={f} a={a} flee={1} />
    </>
  );
};

const PanelScene: React.FC<{C: React.FC<ShotProps>; a: number}> = ({C, a}) => {
  const f = useCurrentFrame();
  return (
    <>
      <C f={f} a={a} b={TOTAL_TEMPO} t={f / FPS} />
      <Post />
    </>
  );
};
const Panel: React.FC<{top: number; letter: string; label: string; active: boolean; C: React.FC<ShotProps>; a: number}> = ({top, letter, label, active, C, a}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: "absolute", top, left: 20, width: 1040, height: 720, borderRadius: 26, overflow: "hidden", border: `7px solid ${active ? "#ffd21f" : "rgba(160,190,230,0.55)"}`, boxShadow: active ? "0 0 38px rgba(255,210,31,0.75)" : "0 0 18px rgba(0,0,0,0.5)", transform: `scale(${(active ? 1.015 : 1) * Math.min(1, pop(f, a, 10))})`}}>
      <ThreeCanvas width={1026} height={706} shadows gl={{antialias: false}} dpr={1}>
        <PanelScene C={C} a={a} />
      </ThreeCanvas>
      {!active && <AbsoluteFill style={{background: "rgba(10,20,40,0.35)"}} />}
      <div style={{position: "absolute", top: 22, left: 22, width: 104, height: 104, borderRadius: 52, background: "#0d1b33", border: `6px solid ${active ? "#ffd21f" : "#9fb8dc"}`, color: active ? "#ffd21f" : "#fff", fontFamily, fontWeight: 900, fontSize: 66, display: "flex", alignItems: "center", justifyContent: "center"}}>{letter}</div>
      <div style={{position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 56, color: "#fff", WebkitTextStroke: "8px #0d1b33", paintOrder: "stroke fill", textTransform: "uppercase"}}>{label}</div>
    </div>
  );
};

const STROKE = {WebkitTextStroke: "10px #0a0f18", paintOrder: "stroke fill" as const};
const TXT = {fontFamily, fontWeight: 900, fill: "#fff", stroke: "#0a0f18", strokeWidth: 10, paintOrder: "stroke" as const};

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const chunks = useMemo(() => {
    const out: Wd[][] = [];
    let cur: Wd[] = [];
    for (const w of words) {
      const len = cur.map((x) => x.w).join(" ").length + w.w.length;
      if (cur.length && (len > 15 || w.line !== cur[0].line)) {
        out.push(cur);
        cur = [];
      }
      cur.push(w);
      if (/[.:…?,!]$/.test(w.w)) {
        out.push(cur);
        cur = [];
      }
    }
    if (cur.length) out.push(cur);
    return out;
  }, []);
  const t = f / FPS;
  const i = chunks.findIndex((c, k) => t >= c[0].s - 0.05 && t < (chunks[k + 1]?.[0].s ?? c[c.length - 1].e + 0.8) - 0.05);
  if (i < 0 || f >= at(19, "comenta")) return null;
  const c = chunks[i];
  const sc = pop(f, Math.round(c[0].s * FPS) - 2, 8);
  return (
    <div style={{position: "absolute", top: f >= SPLIT ? 905 : 1300, left: 50, right: 50, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 84, lineHeight: 1.05, textTransform: "uppercase", color: "#fff", ...STROKE, textShadow: "0 8px 18px rgba(0,0,0,0.55)", transform: `scale(${0.85 + 0.15 * sc})`}}>
      {c.map((w, k) => (
        <span key={k} style={{color: KEY.has(clean(w.w)) ? "#FFB31A" : "#FFFFFF"}}>
          {w.w.replace(/\.\.\.$/, "…")}
          {k < c.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

const Chip: React.FC<{from: number; to: number; text: string; bg: string; top?: number; size?: number}> = ({from, to, text, bg, top = 230, size = 70}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{transform: `scale(${pop(f, from, 10)}) rotate(-3deg)`, background: bg, color: "#fff", fontFamily, fontWeight: 900, fontSize: size, padding: "12px 44px", borderRadius: 18, border: "5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 0 rgba(0,0,0,0.3)", WebkitTextStroke: "4px rgba(0,0,0,0.45)", paintOrder: "stroke fill", whiteSpace: "nowrap"}}>{text}</div>
    </div>
  );
};

const Rings: React.FC<{from: number; to: number; x: number; y: number; color?: string; speed?: number}> = ({from, to, x, y, color = "#8fd3ff", speed = 22}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 5), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {[0, 1, 2, 3].map((i) => {
        const k = ((f - from) / speed + i / 4) % 1;
        return <circle key={i} cx={x} cy={y} r={lerp(20, 560, k)} fill="none" stroke={color} strokeWidth={10 * (1 - k) + 2} opacity={1 - k} />;
      })}
    </svg>
  );
};

/** fundo dos painéis de ciência */
const PanelBg: React.FC<{from: number; to: number; children: React.ReactNode; bg?: string}> = ({from, to, children, bg = "radial-gradient(circle at 50% 35%, #183456, #07101e 75%)"}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  return (
    <AbsoluteFill style={{background: bg}}>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        {children}
      </svg>
    </AbsoluteFill>
  );
};


/* ---------- painéis de ciência: relatividade ---------- */
const clockSvg = (cx: number, cy: number, r: number, ang: number, color = "#ffd21f") => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#f4ead2" stroke="#0a0f18" strokeWidth={10} />
    {Array.from({length: 12}, (_, i) => {
      const a2 = (i / 12) * Math.PI * 2;
      return <circle key={i} cx={cx + Math.sin(a2) * r * 0.8} cy={cy - Math.cos(a2) * r * 0.8} r={6} fill="#333" />;
    })}
    <line x1={cx} y1={cy} x2={cx + Math.sin(ang) * r * 0.78} y2={cy - Math.cos(ang) * r * 0.78} stroke={color} strokeWidth={12} strokeLinecap="round" />
    <circle cx={cx} cy={cy} r={12} fill="#0a0f18" />
  </g>
);

/** 4 — Einstein, 1905 */
const Einstein: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(4) - 3, to = L(5) - 3;
  if (f < from || f >= to) return null;
  const e = at(4, "einstein"), v = at(4, "vinte");
  const k = ramp(f, v, v + 20, easeInOut);
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={230} textAnchor="middle" fontSize={64} {...TXT}>O TEMPO NÃO PASSA</text>
      <text x={540} y={310} textAnchor="middle" fontSize={64} {...TXT}>IGUAL PRA TODO MUNDO</text>
      {f >= e && (
        <g transform={`translate(540 560) scale(${pop(f, e, 10)})`}>
          <rect x={-380} y={-90} width={760} height={150} rx={26} fill="#ffd21f" stroke="#fff" strokeWidth={6} />
          <text x={0} y={18} textAnchor="middle" fontSize={78} fontFamily={fontFamily} fontWeight={900} fill="#0a0f18">EINSTEIN · 1905</text>
        </g>
      )}
      <line x1={140} y1={900} x2={940} y2={900} stroke="#fff" strokeWidth={10} />
      <circle cx={180} cy={900} r={26} fill="#ff9a3a" />
      <text x={180} y={990} textAnchor="middle" fontSize={64} {...TXT}>1880</text>
      <text x={180} y={830} textAnchor="middle" fontSize={44} {...TXT}>DAVI</text>
      {f >= e && <circle cx={900} cy={900} r={26} fill="#ffd21f" />}
      {f >= e && <text x={900} y={990} textAnchor="middle" fontSize={64} {...TXT}>1905</text>}
      {f >= v && (
        <>
          <path d={`M 180 870 Q 540 ${870 - 200 * k} ${lerp(180, 900, k)} 870`} fill="none" stroke="#ffd21f" strokeWidth={8} strokeDasharray="20 12" />
          <text x={540} y={720} textAnchor="middle" fontSize={80} {...TXT} fill="#ffd21f" opacity={k}>+25 ANOS</text>
        </>
      )}
    </PanelBg>
  );
};

/** 5 — relógio parado × relógio na nave */
const Ship: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(5) - 3, to = L(6) - 3;
  if (f < from || f >= to) return null;
  const vel = at(5, "oitenta"), met = at(5, "metade");
  const t = (f - from) / FPS;
  const fast = f >= vel;
  const shipX = fast ? lerp(-200, 1280, ((f - vel) % 45) / 45) : 540;
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={210} textAnchor="middle" fontSize={54} {...TXT} fill="#ffd21f">MAIS RÁPIDO = TEMPO MAIS DEVAGAR</text>
      {clockSvg(290, 620, 170, t * 2)}
      <text x={290} y={870} textAnchor="middle" fontSize={56} {...TXT}>PARADO</text>
      {clockSvg(790, 620, 170, t * (fast ? 1 : 2), "#8fd3ff")}
      <text x={790} y={870} textAnchor="middle" fontSize={56} {...TXT}>NA NAVE</text>
      <g transform={`translate(${shipX} 1060)`}>
        {fast && [0, 1, 2].map((i) => <line key={i} x1={-200 - i * 40} y1={-20 + i * 20} x2={-80 - i * 40} y2={-20 + i * 20} stroke="#8fd3ff" strokeWidth={8} opacity={0.7} />)}
        <path d="M -70 -30 L 60 -30 L 110 0 L 60 30 L -70 30 Z" fill="#e8e8f0" stroke="#0a0f18" strokeWidth={6} />
        <circle cx={40} cy={0} r={12} fill="#8fd3ff" />
        <path d="M -70 -30 L -100 -60 L -40 -30 Z M -70 30 L -100 60 L -40 30 Z" fill="#d01f1a" />
      </g>
      {fast && <text x={540} y={1180} textAnchor="middle" fontSize={64} {...TXT}>87% DA VELOCIDADE DA LUZ</text>}
      {f >= met && (
        <g transform={`translate(790 430) scale(${pop(f, met, 10)})`}>
          <rect x={-170} y={-60} width={340} height={100} rx={20} fill="#d01f1a" stroke="#fff" strokeWidth={5} />
          <text x={0} y={12} textAnchor="middle" fontSize={56} fontFamily={fontFamily} fontWeight={900} fill="#fff">TEMPO ÷ 2</text>
        </g>
      )}
    </PanelBg>
  );
};

/** 6 — gravidade e GPS */
const Gps: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(6) - 3, to = L(7) - 3;
  if (f < from || f >= to) return null;
  const sat = at(6, "satelites"), mic = at(6, "trinta"), err = at(6, "dez");
  const ang = ((f - from) / 90) * Math.PI;
  const sx = 540 + Math.cos(ang) * 380, sy = 760 + Math.sin(ang) * 150;
  const drift = ramp(f, err, err + 40, easeOut);
  return (
    <PanelBg from={from} to={to} bg="radial-gradient(circle at 50% 40%, #102040, #02040a 75%)">
      <text x={540} y={200} textAnchor="middle" fontSize={70} {...TXT} fill="#ffd21f">GRAVIDADE MEXE NO TEMPO</text>
      <ellipse cx={540} cy={760} rx={380} ry={150} fill="none" stroke="#8fd3ff" strokeWidth={4} strokeDasharray="14 10" opacity={0.7} />
      <circle cx={540} cy={790} r={190} fill="#2f6fd6" />
      <path d="M 430 700 q 60 -50 120 0 q 30 60 -40 90 q -70 -10 -80 -90 Z M 580 820 q 60 -10 70 40 q -40 50 -90 20 Z" fill="#4cb050" />
      {f >= sat && (
        <g transform={`translate(${sx} ${sy})`}>
          <rect x={-26} y={-20} width={52} height={40} fill="#c9ccd1" stroke="#0a0f18" strokeWidth={4} />
          <rect x={-90} y={-12} width={56} height={24} fill="#2a4a8a" stroke="#0a0f18" strokeWidth={3} />
          <rect x={34} y={-12} width={56} height={24} fill="#2a4a8a" stroke="#0a0f18" strokeWidth={3} />
        </g>
      )}
      {f >= mic && (
        <g transform={`translate(540 430) scale(${pop(f, mic, 10)})`}>
          <rect x={-330} y={-70} width={660} height={120} rx={24} fill="#ffd21f" stroke="#fff" strokeWidth={5} />
          <text x={0} y={14} textAnchor="middle" fontSize={64} fontFamily={fontFamily} fontWeight={900} fill="#0a0f18">+38 µs POR DIA</text>
        </g>
      )}
      {f >= err && (
        <g opacity={ramp(f, err, err + 6)}>
          <rect x={160} y={1020} width={760} height={240} rx={24} fill="#e8e2c8" stroke="#fff" strokeWidth={5} />
          {[0, 1, 2, 3].map((i) => <line key={i} x1={160} y1={1060 + i * 55} x2={920} y2={1060 + i * 55} stroke="#c8bfa0" strokeWidth={6} />)}
          <circle cx={300} cy={1140} r={22} fill="#2E9E4F" />
          <path d={`M ${300 + 480 * drift} 1080 l 24 0 l -24 50 l -24 -50 Z`} fill="#d01f1a" />
          <text x={540} y={1230} textAnchor="middle" fontSize={50} {...TXT}>ERRO DE 10 km POR DIA</text>
        </g>
      )}
    </PanelBg>
  );
};

/** 7 — relógio de fora × relógio da bolha (sobre a cena 3D) */
const BubbleClocks: React.FC = () => {
  const f = useCurrentFrame();
  const from = at(7, "segundo"), to = L(8) - 4;
  if (f < from || f > to) return null;
  const t = (f - from) / FPS;
  const o = Math.min(ramp(f, from, from + 6), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {clockSvg(290, 470, 140, t * 0.6)}
      <text x={290} y={680} textAnchor="middle" fontSize={50} {...TXT}>LÁ FORA: 1 s</text>
      {f >= at(7, "dez", 1) && (
        <>
          {clockSvg(790, 470, 140, t * 6, "#8fd3ff")}
          <text x={790} y={680} textAnchor="middle" fontSize={50} {...TXT} fill="#8fd3ff">NA BOLHA: 10 s</text>
        </>
      )}
    </svg>
  );
};

/** 8 — som devagar é som grave */
const Pitch: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(8) - 3, to = L(9) - 3;
  if (f < from || f >= to) return null;
  const st = at(8, "ondas"), gr = at(8, "grave", 1);
  const stretch = lerp(1, 4, ramp(f, st, st + 40, easeInOut));
  const wave = (y: number, freq: number, color: string) => {
    const pts = Array.from({length: 81}, (_, i) => `${80 + i * 11.5},${y + Math.sin(i * freq - f * 0.25 * (freq / 0.6)) * 70}`).join(" ");
    return <polyline points={pts} fill="none" stroke={color} strokeWidth={10} />;
  };
  const noteY = lerp(360, 560, ramp(f, gr, gr + 12, easeOut));
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={200} textAnchor="middle" fontSize={70} {...TXT} fill="#ffd21f">SOM DEVAGAR = SOM GRAVE</text>
      {wave(520, 0.6, "#ff9a3a")}
      <text x={540} y={670} textAnchor="middle" fontSize={50} {...TXT}>LÁ FORA: ONDAS RÁPIDAS (AGUDO)</text>
      {f >= st && wave(930, 0.6 / stretch, "#8fd3ff")}
      {f >= st && <text x={540} y={1080} textAnchor="middle" fontSize={50} {...TXT} fill="#8fd3ff">NA BOLHA: ONDAS ESPAÇADAS (GRAVE)</text>}
      {f >= gr && (
        <g transform={`translate(930 ${noteY})`}>
          <circle cx={0} cy={0} r={34} fill="#ffd21f" />
          <rect x={26} y={-120} width={10} height={120} fill="#ffd21f" />
          <text x={-80} y={20} textAnchor="end" fontSize={60} {...TXT}>↓</text>
        </g>
      )}
    </PanelBg>
  );
};

/** 9 — coração disparado */
const Heart: React.FC<{from: number; to: number; bpm: number}> = ({from, to, bpm}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const beat = Math.pow(Math.max(0, Math.sin(((f - from) / FPS) * Math.PI * (bpm / 60))), 8);
  return (
    <div style={{position: "absolute", top: 430, right: 90, display: "flex", alignItems: "center", gap: 16, opacity: 1 - ramp(f, to - 6, to)}}>
      <svg width={150} height={140} viewBox="0 0 100 92" style={{transform: `scale(${1 + 0.25 * beat})`}}>
        <path d="M50 88 C 10 60 0 40 0 25 C 0 10 12 0 26 0 C 38 0 46 8 50 16 C 54 8 62 0 74 0 C 88 0 100 10 100 25 C 100 40 90 60 50 88 Z" fill="#e0261c" stroke="#fff" strokeWidth={5} />
      </svg>
      <div style={{fontFamily, fontWeight: 900, fontSize: 70, color: "#fff", ...STROKE}}>{bpm} BPM</div>
    </div>
  );
};

/** 14 — ressonância depende do ritmo */
const Rhythm: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(14) - 3, to = L(15) - 3;
  if (f < from || f >= to) return null;
  const mu = at(14, "muda");
  const off = ramp(f, mu, mu + 20, easeInOut);
  const beats = (y: number, period: number, color: string) => (
    <g>
      {Array.from({length: 7}, (_, i) => (
        <rect key={i} x={110 + i * period * 130} y={y - 40} width={18} height={80} rx={6} fill={color} />
      ))}
    </g>
  );
  const wave = Array.from({length: 81}, (_, i) => `${110 + i * 11},${560 + Math.sin((i * 11) / 130 * Math.PI * 2) * 60}`).join(" ");
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={200} textAnchor="middle" fontSize={64} {...TXT} fill="#ffd21f">RESSONÂNCIA = RITMO CERTO</text>
      <polyline points={wave} fill="none" stroke="#8fd3ff" strokeWidth={10} />
      <text x={540} y={700} textAnchor="middle" fontSize={50} {...TXT}>COMO O VIDRO GOSTA DE VIBRAR</text>
      {beats(880, 1, "#4cd964")}
      <text x={540} y={990} textAnchor="middle" fontSize={50} {...TXT} fill="#4cd964">EMPURRÕES DO AFINADOR ✓</text>
      {f >= mu && (
        <g opacity={off}>
          {beats(1160, 1.45, "#ff3b30")}
          <text x={540} y={1240} textAnchor="middle" fontSize={50} {...TXT} fill="#ff3b30">NA BOLHA: FORA DO RITMO ✗</text>
        </g>
      )}
    </PanelBg>
  );
};

/** tela azulada de câmera lenta */
const SlowTint: React.FC = () => {
  const f = useCurrentFrame();
  const k = Math.max(isSlow(f) ? Math.min(ramp(f, SL, SL + 8), 1 - ramp(f, RS - 4, RS + 2)) : 0, f >= L(7) - 3 && f < L(8) - 3 ? ramp(f, at(7, "bolha") - 4, at(7, "bolha") + 10) * 0.7 : 0);
  if (k <= 0) return null;
  return <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 45%, rgba(80,160,255,0) 35%, rgba(20,60,170,0.55) 100%)", opacity: k, mixBlendMode: "multiply"}} />;
};

const KEY = new Set(["davi", "farmacia", "luz", "birmingham", "1880", "carruagem", "lentos", "grave", "tempo", "einstein", "1905", "rapido", "devagar", "metade", "gravidade", "gps", "trinta", "oito", "microssegundos", "dez", "quilometros", "bolha", "segundos", "preco", "dispara", "dispararam", "agnes", "afinador", "ressonancia", "ritmo", "despencou", "tres", "sino", "rachar", "feira", "folego", "comenta"]);

/** 10 — frequência natural: o balanço */
const Swing: React.FC = () => {
  const f = useCurrentFrame();
  const from = at(13, "ressonancia") - 3, to = L(14) - 3;
  if (f < from || f >= to) return null;
  const emp = at(13, "empurra");
  const T = 36; // período em quadros
  const amp = 0.12 + 0.55 * ramp(f, emp, to, easeOut);
  const ang = amp * Math.sin(((f - from) / T) * Math.PI * 2);
  const pivot = [540, 420];
  const len = 620;
  const sx = pivot[0] + Math.sin(ang) * len, sy = pivot[1] + Math.cos(ang) * len;
  const atPush = f >= emp && Math.abs(((f - from) % T) - T * 0.75) < 3;
  return (
    <PanelBg from={from} to={to} bg="linear-gradient(#bfe3ff, #f2f8ff 60%, #9fd08a 60%, #6fa85a)">
      <text x={540} y={200} textAnchor="middle" fontSize={78} {...TXT} fill="#ffd21f">FREQUÊNCIA NATURAL</text>
      <rect x={180} y={400} width={720} height={30} rx={12} fill="#6a4a2a" />
      <line x1={pivot[0] - 60} y1={pivot[1]} x2={sx - 60} y2={sy} stroke="#5a4030" strokeWidth={8} />
      <line x1={pivot[0] + 60} y1={pivot[1]} x2={sx + 60} y2={sy} stroke="#5a4030" strokeWidth={8} />
      <rect x={sx - 85} y={sy - 10} width={170} height={28} rx={8} fill="#c0392b" transform={`rotate(${(-ang * 180) / Math.PI} ${sx} ${sy})`} />
      {atPush && (
        <g>
          <path d={`M ${sx - 240} ${sy} L ${sx - 110} ${sy}`} stroke="#ffd21f" strokeWidth={22} />
          <path d={`M ${sx - 120} ${sy - 30} L ${sx - 80} ${sy} L ${sx - 120} ${sy + 30} Z`} fill="#ffd21f" />
          <text x={Math.max(250, sx - 180)} y={sy - 50} textAnchor="middle" fontSize={50} {...TXT}>NA HORA CERTA!</text>
        </g>
      )}
      <path d={`M ${pivot[0] + Math.sin(-amp) * len} ${pivot[1] + Math.cos(amp) * len + 60} A ${len} ${len} 0 0 0 ${pivot[0] + Math.sin(amp) * len} ${pivot[1] + Math.cos(amp) * len + 60}`} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="16 12" opacity={0.8} />
    </PanelBg>
  );
};

/** barra de audição */
const Hearing: React.FC<{from: number; to: number; v0: number; v1: number}> = ({from, to, v0, v1}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const v = lerp(v0, v1, ramp(f, from + 10, to - 10, easeInOut));
  const col = v > 0.5 ? "#4cd964" : v > 0.25 ? "#ffcc00" : "#ff3b30";
  return (
    <div style={{position: "absolute", top: 260, left: 140, right: 140, opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{fontFamily, fontWeight: 900, fontSize: 60, color: "#fff", ...STROKE, marginBottom: 12}}>FÔLEGO {Math.round(v * 100)}%</div>
      <div style={{height: 56, borderRadius: 28, background: "rgba(10,15,24,0.7)", border: "5px solid #fff", overflow: "hidden"}}>
        <div style={{height: "100%", width: `${v * 100}%`, background: col}} />
      </div>
    </div>
  );
};


const Split: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SPLIT) return null;
  const both = f >= at(19, "comenta");
  return (
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, #17375f 0%, #0b1a30 70%)"}}>
      <Panel top={150} letter="A" label="Sino na bolha" active={both || (f >= at(19, "gasta") && f < at(19, "ou") + 2)} C={PA} a={SPLIT} />
      <Panel top={1050} letter="B" label="Salva o povo" active={both || f >= at(19, "usa")} C={PB} a={SPLIT + 4} />
    </AbsoluteFill>
  );
};

export const VideoTempo: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cuts = [...SHOTS.slice(1).map((s) => s.from), SPLIT];
  const ruaVol = (g: number) => (g < SL ? 0.9 : g < RS ? 0 : g < L(4) - 3 ? 0.9 : g < L(9) - 3 ? 0 : g < at(11, "era") - 3 ? 0.5 : g < L(13) - 3 ? 0 : g < at(13, "ressonancia") - 3 ? 0.5 : 0);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>
      <SlowTint />
      <Einstein />
      <Ship />
      <Gps />
      <Pitch />
      <Swing />
      <Rhythm />
      <BubbleClocks />
      {cuts.map((c) => (f >= c && f < c + 5 ? <AbsoluteFill key={c} style={{background: "#000", opacity: 0.35 * (1 - (f - c) / 5)}} /> : null))}
      <Flash at={at(0, "puxou") + 6} strength={1} />
      <Flash at={L(1) - 3} strength={0.6} />
      <TitleTag text="BIRMINGHAM" from={at(1, "birmingham")} to={at(1, "carruagem") - 2} />
      <Chip from={at(1, "1880")} to={at(1, "carruagem") - 2} text="INGLATERRA · 1880" bg="#7a1f1a" top={420} size={56} />
      <Chip from={at(2, "grave")} to={L(3) - 4} text="APITO GRAVE…" bg="#2f4fa0" top={300} size={56} />
      <Chip from={at(2, "poeira")} to={L(3) - 4} text="POEIRA PARADA NO AR" bg="#2f4fa0" top={420} size={56} />
      <TitleTag text="BOLHA DE TEMPO" from={at(7, "bolha")} to={at(7, "segundo") - 2} />
      <Hearing from={L(9) - 3} to={L(10) - 4} v0={1} v1={0.45} />
      <Heart from={at(9, "coracao") - 2} to={L(10) - 4} bpm={180} />
      <Chip from={at(10, "dispararam")} to={L(11) - 4} text="OS RELÓGIOS DISPARARAM!" bg="#b8863a" size={56} />
      <Chip from={at(11, "agnes")} to={L(12) - 4} text="DONA AGNES · RELOJOEIRA" bg="#5a2a4a" size={52} />
      <TitleTag text="O AFINADOR" from={at(12, "afinador")} to={L(13) - 4} />
      <TitleTag text="1ª LIÇÃO" from={at(15, "primeira")} to={at(15, "bateu") + 20} />
      <Chip from={at(15, "despencou")} to={L(16) - 4} text="A NOTA NÃO BATE MAIS" bg="#2E9E4F" size={56} />
      <Chip from={at(16, "tres")} to={L(17) - 4} text="3 s · FÔLEGO 0%" bg="#d01f1a" size={60} />
      <Rings from={at(17, "sino")} to={SPLIT} x={540} y={420} color="#ffd21f" speed={16} />
      <Chip from={at(18, "rachar")} to={SPLIT - 2} text="SE RACHAR… CAI NA FEIRA" bg="#d01f1a" top={560} size={52} />
      <Split />
      <Captions />
      <Chip from={at(19, "comenta")} to={TOTAL_TEMPO} text="COMENTA AÍ ↓" bg="#2E9E4F" top={905} />
      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("voztempo.mp3")} />
      <Audio src={staticFile("trilha-bham.mp3")} volume={(fr) => 0.14 * clamp(fr / 30) * (isSlow(fr) ? 0.4 : 1) * (1 - ramp(fr, TOTAL_TEMPO - 40, TOTAL_TEMPO))} />
      <Sequence from={0} durationInFrames={L(1) - 3}>
        <Audio src={staticFile("sfx3/street.mp3")} volume={0.25} />
      </Sequence>
      <Sequence from={4} durationInFrames={60}>
        <Audio src={staticFile("sfx3/door.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={at(0, "luz") - 4} durationInFrames={110}>
        <Audio src={staticFile("sfx3/portal.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(0, "puxou")} durationInFrames={40}>
        <Audio src={staticFile("sfx2/whoosh.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={L(1) - 3} durationInFrames={L(17) - L(1)}>
        <Audio src={staticFile("sfx4/rua1880.mp3")} volume={(fr) => ruaVol(fr + L(1) - 3)} loop />
      </Sequence>
      <Sequence from={L(1) + 9} durationInFrames={30}>
        <Audio src={staticFile("sfx2/land.mp3")} volume={0.7} />
      </Sequence>
      {/* carruagem: normal → câmera lenta (grave) → normal */}
      <Sequence from={at(1, "carruagem") - 30} durationInFrames={SL - at(1, "carruagem") + 30}>
        <Audio src={staticFile("sfx4/carriage.mp3")} volume={(fr) => 0.2 + 0.3 * clamp(fr / 40)} />
      </Sequence>
      <Sequence from={SL - 4} durationInFrames={60}>
        <Audio src={staticFile("sfx4/slow.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={SL} durationInFrames={RS - SL}>
        <Audio src={staticFile("sfx4/carriage_lenta.mp3")} volume={0.2} loop />
      </Sequence>
      <Sequence from={SL} durationInFrames={RS - SL}>
        <Audio src={staticFile("sfx4/rua1880_grave.mp3")} volume={0.8} loop />
      </Sequence>
      <Sequence from={at(2, "apito") - 4} durationInFrames={100}>
        <Audio src={staticFile("sfx4/whistle_grave_curto.mp3")} volume={0.2} />
      </Sequence>
      <Sequence from={RS - 3} durationInFrames={50}>
        <Audio src={staticFile("sfx4/resume.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={RS} durationInFrames={L(4) - RS}>
        <Audio src={staticFile("sfx4/carriage.mp3")} volume={0.45} />
      </Sequence>
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 4} durationInFrames={30}>
          <Audio src={staticFile("sfx2/whoosh.mp3")} volume={0.18} />
        </Sequence>
      ))}
      {/* painéis de relatividade: tique-taque suave */}
      <Sequence from={L(4) - 3} durationInFrames={L(7) - L(4)}>
        <Audio src={staticFile("sfx3/ticking.mp3")} volume={0.15} loop />
      </Sequence>
      <Sequence from={at(7, "bolha") - 4} durationInFrames={60}>
        <Audio src={staticFile("sfx4/slow.mp3")} volume={0.3} />
      </Sequence>
      <Sequence from={L(9) - 3} durationInFrames={L(10) - L(9)}>
        <Audio src={staticFile("sfx4/pant.mp3")} volume={0.6} loop />
      </Sequence>
      <Sequence from={at(9, "coracao") - 4} durationInFrames={L(10) - at(9, "coracao")}>
        <Audio src={staticFile("sfx4/heart.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(10, "dispararam") - 6} durationInFrames={L(11) - at(10, "dispararam") + 6}>
        <Audio src={staticFile("sfx4/clocks.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(11, "era") - 3} durationInFrames={L(13) - at(11, "era")}>
        <Audio src={staticFile("sfx3/ticking.mp3")} volume={0.3} loop />
      </Sequence>
      <Sequence from={at(12, "trancou") - 2} durationInFrames={60}>
        <Audio src={staticFile("sfx3/lock.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={L(13) - 3} durationInFrames={at(13, "ressonancia") - L(13)}>
        <Audio src={staticFile("sfx3/hum.mp3")} volume={0.45} loop />
      </Sequence>
      <Sequence from={at(13, "cantarolando") + 12} durationInFrames={90}>
        <Audio src={staticFile("sfx3/glass.mp3")} volume={0.85} />
      </Sequence>
      <Sequence from={at(13, "empurra") - 4} durationInFrames={L(14) - at(13, "empurra")}>
        <Audio src={staticFile("sfx3/swing.mp3")} volume={0.35} loop />
      </Sequence>
      <Sequence from={L(15) - 3} durationInFrames={L(17) - L(15)}>
        <Audio src={staticFile("sfx3/ticking.mp3")} volume={0.25} loop />
      </Sequence>
      <Sequence from={at(15, "bateu")} durationInFrames={50}>
        <Audio src={staticFile("sfx4/tap.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={at(15, "cantou") - 4} durationInFrames={at(15, "despencou") - at(15, "cantou")}>
        <Audio src={staticFile("sfx3/ring.mp3")} volume={0.5} loop />
      </Sequence>
      <Sequence from={at(15, "despencou") - 4} durationInFrames={L(16) - at(15, "despencou")}>
        <Audio src={staticFile("sfx4/ring_grave.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={L(16) - 3} durationInFrames={L(17) - L(16)}>
        <Audio src={staticFile("sfx4/pant.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={L(17) - 3} durationInFrames={TOTAL_TEMPO - L(17)}>
        <Audio src={staticFile("sfx3/crowd.mp3")} volume={0.25} loop />
      </Sequence>
      <Sequence from={at(17, "sino") - 2} durationInFrames={TOTAL_TEMPO - at(17, "sino")}>
        <Audio src={staticFile("sfx3/bell.mp3")} volume={(fr) => 0.25 + 0.35 * clamp(fr / 150)} loop />
      </Sequence>
      <Sequence from={L(18) - 3} durationInFrames={L(19) - L(18)}>
        <Audio src={staticFile("sfx3/hum.mp3")} volume={0.4} loop />
      </Sequence>
      <Sequence from={at(18, "rachar")} durationInFrames={60}>
        <Audio src={staticFile("sfx3/crack.mp3")} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
