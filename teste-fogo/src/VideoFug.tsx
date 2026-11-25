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
import {Pharmacy, Bag, Portal, Birmingham, ClockShop, Carriage, TimeBubble, ClockWindow, BellTower} from "./Sets3";
import {Eye, Alley, Rattle, NoticeBoard, ShopDoor, Mattress} from "./Sets4";
import {InteriorLights, Box} from "./Sets";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import W from "./timingFug.json";

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
export const TOTAL_FUG = F(words[words.length - 1].e + 1.6);

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
const S5bubble: React.FC<ShotProps> = ({f, a, b}) => {
  const k = ramp(f, at(5, "bolha") - 4, at(5, "bolha") + 10, easeOut);
  const t = (a + (f - a) * (1 - 0.9 * k)) / FPS;
  const davi = physics("t7", (fr) => idle(fr, {pos: [0, 0, 0.8], rotY: 0, smile: 0.7, brow: 0.3, rShoulder: [-0.3, 0, -0.7 * ramp(fr, at(5, "bolha"), at(5, "bolha") + 10)], lShoulder: [-0.3, 0, 0.7 * ramp(fr, at(5, "bolha"), at(5, "bolha") + 10)], rElbow: -0.4, lElbow: -0.4}), a, f);
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

/* 10 — os relógios da vitrine disparam quando ele passa */
const S14window: React.FC<ShotProps> = ({f, a, b}) => {
  const sp = at(14, "dispararam");
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
const S14pull: React.FC<ShotProps> = ({f, a, b}) => {
  const m = at(14, "mao");
  const davi = physics("t11", (fr) => {
    const kk = ramp(fr, m, m + 10, easeOut);
    return idle(fr, {pos: [lerp(-0.4, -1.45, kk), 0, lerp(-2.3, -3.05, kk)], rotY: lerp(Math.PI / 2, -2.4, kk), torso: [0, 0, 0.35 * kick(fr, m + 2, 8)], eyeWide: kk, brow: kk, mouthOpen: 0.5 * kk, rShoulder: [-1.3 * kk, 0, -0.4], rElbow: -0.2});
  }, a, f);
  const ag = physics("t11a", (fr) => {
    const run = ramp(fr, (at(14, "mao") - 12), (at(14, "mao") - 12) + 14, easeOut);
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

const PanelScene: React.FC<{C: React.FC<ShotProps>; a: number}> = ({C, a}) => {
  const f = useCurrentFrame();
  return (
    <>
      <C f={f} a={a} b={TOTAL_FUG} t={f / FPS} />
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
  if (i < 0 || f >= at(18, "comenta")) return null;
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

/** 7 — relógio de fora × relógio da bolha (sobre a cena 3D) */
const BubbleClocks: React.FC = () => {
  const f = useCurrentFrame();
  const from = at(5, "segundo"), to = L(6) - 4;
  if (f < from || f > to) return null;
  const t = (f - from) / FPS;
  const o = Math.min(ramp(f, from, from + 6), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {clockSvg(290, 470, 140, t * 0.6)}
      <text x={290} y={680} textAnchor="middle" fontSize={50} {...TXT}>LÁ FORA: 1 s</text>
      {f >= at(5, "dez", 1) && (
        <>
          {clockSvg(790, 470, 140, t * 6, "#8fd3ff")}
          <text x={790} y={680} textAnchor="middle" fontSize={50} {...TXT} fill="#8fd3ff">NA BOLHA: 10 s</text>
        </>
      )}
    </svg>
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



/* ======================= cenas novas: o fugitivo ======================= */
const BOBBY: Look = {palito: true, bobby: true, skin: "#e8c0a0", hair: "#3a2a1a", hairStyle: "short", shirt: "#1c2333", trim: "#141a28", pants: "#1c2333", coat: "#1c2333"};
const BOBBY2: Look = {...BOBBY, skin: "#d8a888", hair: "#6a4a2a"};
const ghostOf = (l: Look, o: number): Look => ({...l, ghost: o});

/* 6 — ninguém percebeu: a rua segue normal; a câmera passa pro beco */
const S6: React.FC<ShotProps> = ({f, a, b}) => {
  const p = ramp(f, a, b, easeInOut);
  const davi = physics("f6", (fr) => idle(fr, {pos: [0, 0, 1.7], rotY: 0.3, head: [0, Math.sin(fr / 20) * 0.5, 0], pupil: [Math.sin(fr / 20) * 0.6, 0], brow: 0.4}), a, f);
  return (
    <>
      <Cam pos={[lerp(1.6, 2.6, p), 1.5, lerp(5.0, 4.4, p)]} look={[lerp(0, 3.2, ramp(f, at(6, "mas") - 10, b, easeInOut)), 1.2, lerp(0.6, -2.0, p)]} fov={44} />
      <Day t={f / FPS} />
      <Boy pose={davi} look={DAVI} />
      {[-2.4, -1.2, 1.4, 2.6].map((x, i) => (
        <Boy key={i} look={POVO[i % 5]} pose={physics(`f6p${i}`, (fr) => idle(fr + i * 17, {...walkP(fr, a + i * 6, 1.1), pos: [x + ((fr - a) / FPS) * (i % 2 ? -0.5 : 0.5), 0, -1.4 - (i % 2) * 0.7], rotY: i % 2 ? -Math.PI / 2 : Math.PI / 2}), a, f)} />
      ))}
    </>
  );
};

/* 7 — o olho no beco */
const EyeShot: React.FC<{f: number; a: number; b: number; push?: number}> = ({f, a, b, push = 1}) => {
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[0, 1.55, lerp(2.4, 0.55, p * push)]} look={[0, 1.55, -1.6]} fov={34} />
      <color attach="background" args={["#020202"]} />
      <fog attach="fog" args={["#020202", 0.5, 3.5]} />
      <ambientLight intensity={0.05} />
      <Alley />
      <Eye p={[0.12, 1.55, -1.6]} look={[0.8 * Math.sin(f / 40) + 0.2, 0]} scale={1.6} />
    </>
  );
};
const S7: React.FC<ShotProps> = ({f, a, b}) => <EyeShot f={f} a={a} b={b} />;

/* 8 — o borrão: 2 metros em 0,2 segundo */
const S8: React.FC<ShotProps> = ({f, a, b}) => {
  const back = at(8, "mas");
  if (f >= back - 3) return <EyeShot f={f} a={back - 3} b={b} />;
  const cyc = ((f - a) % 36) / 36; // repete o passo rápido em loop
  const x = lerp(-1.0, 1.0, Math.min(1, cyc * 3));
  const pose = idle(f, {...walkP(f, a, 6), walkAmt: 1.3, pos: [x, 0, 0.8], rotY: Math.PI / 2, torso: [0.3, 0, 0]});
  return (
    <>
      <Cam pos={[0, 1.3, 4.2]} look={[0, 1.0, 0.4]} fov={44} />
      <Day t={f / FPS} />
      {[0.12, 0.22, 0.35].map((o, i) => (
        <Boy key={i} pose={{...pose, pos: [x - (3 - i) * 0.32, 0, 0.8]}} look={ghostOf(DAVI, o)} />
      ))}
      <Boy pose={pose} look={DAVI} />
    </>
  );
};

/* 9 — o policial aponta e gira a matraca */
const S9: React.FC<ShotProps> = ({f, a, b}) => {
  const palm = useRef<THREE.Object3D>(null);
  const ap = at(9, "apontou"), gi = at(9, "girou");
  const pol = physics("f9", (fr) => idle(fr, {pos: [1.3, 0, -0.6], rotY: -2.0, rShoulder: [fr >= gi ? -1.6 : lerp(-0.1, -1.4, ramp(fr, ap, ap + 8, easeOut)), 0, fr >= gi ? -0.6 : -0.1], rElbow: fr >= gi ? -0.6 + 0.25 * Math.sin(fr * 1.7) : -0.1, brow: -0.7, mouthOpen: talk(fr, ap, ap + 25)}), a, f);
  const davi = physics("f9d", (fr) => idle(fr, {pos: [-0.5, 0, 0.6], rotY: 1.0, eyeWide: ramp(fr, ap, ap + 8), brow: ramp(fr, ap, ap + 8), mouthOpen: 0.4 * ramp(fr, ap, ap + 8), rShoulder: [-0.4, 0, -0.3], lShoulder: [-0.4, 0, 0.3]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-1.4, -1.0, p), 1.5, lerp(2.8, 2.4, p)]} look={[0.5, 1.3, -0.3]} fov={44} />
      <Day t={f / FPS} />
      <Boy pose={pol} look={BOBBY} palmRef={palm} />
      <Boy pose={davi} look={DAVI} />
      {f >= gi && (
        <AtPalm palm={palm} offset={[0, 0.02, 0]}>
          <Rattle spin={(f - gi) * 1.6} />
        </AtPalm>
      )}
    </>
  );
};

/* 11 — perseguição: policiais em câmera lenta, Davi vira borrão */
const S11chase: React.FC<ShotProps> = ({f, a, b}) => {
  const bol = at(11, "bolha");
  const slow = ramp(f, bol - 3, bol + 6);
  const tt = (fr: number) => a + (Math.min(fr, bol) - a) + Math.max(0, fr - bol) * 0.1;
  const run = (k: number, look: Look, x0: number, z0: number) => {
    const ft = tt(f);
    return <Boy key={k} look={look} pose={idle(Math.round(ft), {...walkP(Math.round(ft * 1), a, 2.6), walkAmt: 1.4, pos: [x0, 0, z0 + ((ft - a) / FPS) * 1.4], rotY: 0, torso: [0.3, 0, 0], rShoulder: [-1.2, 0, -0.3], rElbow: -0.3, mouthOpen: 0.5, brow: -0.7})} />;
  };
  const dx = f >= bol ? lerp(-2, 2.5, ((f - bol) % 24) / 24) : -0.2;
  const dPose = idle(f, {...walkP(f, a, f >= bol ? 6 : 1.5), walkAmt: 1.3, pos: [dx, 0, f >= bol ? 2.2 : 1.6 + ((f - a) / FPS) * 0.6], rotY: f >= bol ? Math.PI / 2 : 0, torso: [0.3, 0, 0]});
  return (
    <>
      <Cam pos={[0.6, 1.5, 5.2]} look={[0, 1.1, 0.5]} fov={46} />
      <Day t={tt(f) / FPS} />
      {run(0, BOBBY, -0.8, -4.0)}
      {run(1, BOBBY2, 0.7, -4.6)}
      {[-2.4, -1.4, 1.6, 2.5].map((x, i) => (
        <Boy key={"c" + i} look={POVO[i % 5]} pose={idle(Math.round(tt(f)) + i * 9, {pos: [x, 0, 0.6 - (i % 2) * 0.8], rotY: (i % 2 ? -1 : 1) * 0.8, head: [0, 0.4, 0]})} />
      ))}
      {f >= bol && [0.12, 0.22, 0.35].map((o, i) => <Boy key={"g" + i} pose={{...dPose, pos: [dx - (3 - i) * 0.35, 0, 2.2]}} look={ghostOf(DAVI, o)} />)}
      <Boy pose={dPose} look={DAVI} />
      <TimeBubble t={f / FPS} power={0.5 * slow} p={[dx, 1.0, f >= bol ? 2.2 : 1.6]} r={1.0} />
    </>
  );
};

/* 12 — o cartaz de PROCURADO */
const S12: React.FC<ShotProps> = ({f, a, b}) => {
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-1.3, -1.5, p), 1.45, lerp(1.2, -0.6, p)]} look={[-1.5, 1.45, -2.3]} fov={40} />
      <Day t={f / FPS} />
      <NoticeBoard p={[-1.5, 0, -2.3]} />
    </>
  );
};

/* 15 — o porão: escondido atrás dos relógios de pêndulo */
const Basement: React.FC<{t: number}> = ({t}) => (
  <>
    <color attach="background" args={["#0c0806"]} />
    <hemisphereLight args={["#5a4030", "#0a0604", 0.25]} />
    <pointLight position={[0.3, 1.1, -0.2]} color="#ffb060" intensity={2.6 + 0.4 * Math.sin(t * 13) * Math.sin(t * 5)} distance={4.5} decay={1.6} castShadow />
    <ClockShop t={t} />
    <mesh position={[0.3, 0.95, -0.2]}>
      <sphereGeometry args={[0.025, 8, 6]} />
      <meshBasicMaterial color="#ffd890" />
    </mesh>
  </>
);
const S15: React.FC<ShotProps> = ({f, a, b}) => {
  const ag = physics("f15", (fr) => idle(fr, {...walkP(fr, a, 1.0), walkAmt: 1 - ramp(fr, a + 40, a + 50), pos: [lerp(-0.6, 1.4, ramp(fr, a, a + 50)), 0, -1.5], rotY: Math.PI / 2, lShoulder: [-1.1, 0, 0.2], lElbow: -0.6}), a, f);
  const davi = physics("f15d", (fr) => idle(fr, {...walkP(fr, a, 1.0), walkAmt: 1 - ramp(fr, a + 46, a + 56), pos: [lerp(-1.2, 1.9, ramp(fr, a, a + 56)), 0, -1.75], rotY: Math.PI / 2, head: [0, 0.4, 0], eyeWide: 0.5}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-0.5, 0.4, p), 1.4, 1.3]} look={[lerp(0.2, 1.6, p), 1.1, -1.8]} fov={44} />
      <Basement t={f / FPS} />
      <Boy pose={ag} look={AGNES} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 16 — dormiu 14 horas */
const S16: React.FC<ShotProps> = ({f, a, b}) => {
  const p = ramp(f, a, b, easeInOut);
  const pose = idle(f, {blink: 1, smile: 0.1, breathe: Math.sin(f / 18) * 3, rShoulder: [0, 0, -0.15], lShoulder: [0, 0, 0.15]});
  return (
    <>
      <Cam pos={[lerp(1.9, 1.6, p), lerp(1.3, 1.1, p), lerp(-1.0, -1.2, p)]} look={[0.2, 0.35, -1.3]} fov={42} />
      <Basement t={f / FPS} />
      <Mattress p={[0.2, 0, -1.4]} />
      <group position={[0.2, 0.32, -0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <Boy pose={pose} look={DAVI} />
      </group>
    </>
  );
};

/* 17 — batem na porta; pelo vidro, um olho */
const S17: React.FC<ShotProps> = ({f, a, b}) => {
  const knocks = [a + 6, a + 18, a + 30];
  const shake = knocks.reduce((s, k) => s + kick(f, k, 3), 0);
  const olho = at(17, "olho");
  const p = ramp(f, a, b, easeInOut);
  const davi = physics("f17", (fr) => idle(fr, {...walkP(fr, a, 0.9), walkAmt: fr < at(17, "pelo") ? 1 : 0, pos: [0.15, 0, lerp(-0.4, 1.3, ramp(fr, a, at(17, "pelo")))], rotY: Math.PI, rShoulder: [-0.3, 0, -0.2], lShoulder: [-0.3, 0, 0.2]}), a, f);
  const close = ramp(f, olho - 6, olho + 20, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.6, 0.0, close), lerp(1.45, 1.55, close), lerp(-0.6, 1.75, close) - 0.2 * p]} look={[0, lerp(1.3, 1.55, close), 2.5]} fov={lerp(46, 30, close)} />
      <Basement t={f / FPS} />
      <ShopDoor p={[0, 0, 2.45]} shake={shake} />
      {f >= olho - 4 && <Eye p={[0.0, 1.55, 2.55]} look={[0, 0]} scale={1.3} rotY={Math.PI} />}
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* ---------- lista de planos ---------- */
const Empty: React.FC<ShotProps> = () => <Dark />;
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1) - 3, Comp: Rua},
  {from: L(4) - 3, Comp: Empty}, // Einstein / relógio na nave
  {from: L(5) - 3, Comp: S5bubble},
  {from: L(6) - 3, Comp: S6},
  {from: L(7) - 3, Comp: S7},
  {from: L(8) - 3, Comp: S8},
  {from: L(9) - 3, Comp: S9},
  {from: L(10) - 3, Comp: Empty}, // matraca × apito
  {from: L(11) - 3, Comp: S11chase},
  {from: L(12) - 3, Comp: S12},
  {from: L(13) - 3, Comp: Empty}, // telégrafo
  {from: L(14) - 3, Comp: S14window},
  {from: at(14, "mao") - 8, Comp: S14pull},
  {from: L(15) - 3, Comp: S15},
  {from: L(16) - 3, Comp: S16},
  {from: L(17) - 3, Comp: S17},
];
const SPLIT = at(18, "davi") - 8;

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
const PA: React.FC<ShotProps> = ({f, a}) => {
  const z = -((f - a) / FPS) * 1.2;
  const pose = idle(f, {...walkP(f, a, 3), walkAmt: 1.4, pos: [0, 0, z], rotY: Math.PI, torso: [0.3, 0, 0], mouthOpen: 0.5, brow: 0.8});
  return (
    <>
      <Cam pos={[0.8, 1.4, z + 3.0]} look={[0, 1.1, z - 1.5]} fov={46} />
      <color attach="background" args={["#020202"]} />
      <fog attach="fog" args={["#0a0c14", 2, 9]} />
      <ambientLight intensity={0.7} color="#7a8ab8" />
      <hemisphereLight args={["#8a9ac8", "#1a1410", 0.6]} />
      <pointLight position={[0.5, 2.5, z + 0.5]} color="#c8d4ff" intensity={6} distance={7} />
      <group position={[0, 0, z]} scale={[1, 1, 3]}>
        <Alley />
      </group>
      {[0.15, 0.3].map((o, i) => <Boy key={i} pose={{...pose, pos: [0, 0, z + (2 - i) * 0.35]}} look={ghostOf(DAVI, o)} />)}
      <Boy pose={pose} look={DAVI} />
    </>
  );
};
const PB: React.FC<ShotProps> = ({f, a}) => {
  const davi = physics("fpb", (fr) => idle(fr, {pos: [0.1, 0, 1.4], rotY: Math.PI, rShoulder: [0, 0, -1.4], lShoulder: [0, 0, 1.4], rElbow: -0.1, lElbow: -0.1, brow: -0.8}), a, f);
  const ag = physics("fpba", (fr) => idle(fr, {pos: [0.5, 0, 0.5], rotY: Math.PI - 0.3, brow: 0.8, eyeWide: 0.6, rShoulder: [-0.5, 0, -0.2]}), a, f);
  return (
    <>
      <Cam pos={[-0.9, 1.5, -0.6]} look={[0.2, 1.4, 2.4]} fov={44} />
      <Basement t={f / FPS} />
      <ShopDoor p={[0, 0, 2.45]} />
      <Eye p={[0.0, 1.55, 2.55]} look={[0, 0]} scale={1.3} rotY={Math.PI} />
      <Boy pose={davi} look={DAVI} />
      <Boy pose={ag} look={AGNES} />
    </>
  );
};

/* ---------- painéis 2D ---------- */
/** 4 — Einstein 1905 + relógio parado × relógio na nave */
const Relat: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(4) - 3, to = L(5) - 3;
  if (f < from || f >= to) return null;
  const e = at(4, "einstein"), q = at(4, "quanto"), dv = at(4, "devagar");
  const t = (f - from) / FPS;
  if (f < q - 3) {
    return (
      <PanelBg from={from} to={to}>
        <text x={540} y={260} textAnchor="middle" fontSize={64} {...TXT}>O TEMPO NÃO PASSA</text>
        <text x={540} y={340} textAnchor="middle" fontSize={64} {...TXT}>IGUAL PRA TODO MUNDO</text>
        {f >= e && (
          <g transform={`translate(540 700) scale(${pop(f, e, 10)})`}>
            <rect x={-380} y={-90} width={760} height={150} rx={26} fill="#ffd21f" stroke="#fff" strokeWidth={6} />
            <text x={0} y={18} textAnchor="middle" fontSize={78} fontFamily={fontFamily} fontWeight={900} fill="#0a0f18">EINSTEIN · 1905</text>
          </g>
        )}
      </PanelBg>
    );
  }
  const fast = f >= at(4, "rapido");
  const shipX = fast ? lerp(-200, 1280, ((f - at(4, "rapido")) % 45) / 45) : 540;
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
      {f >= dv && (
        <g transform={`translate(790 430) scale(${pop(f, dv, 10)})`}>
          <rect x={-200} y={-60} width={400} height={100} rx={20} fill="#d01f1a" stroke="#fff" strokeWidth={5} />
          <text x={0} y={12} textAnchor="middle" fontSize={52} fontFamily={fontFamily} fontWeight={900} fill="#fff">MAIS DEVAGAR</text>
        </g>
      )}
    </PanelBg>
  );
};

/** 8 — conta do borrão */
const Speed: React.FC = () => {
  const f = useCurrentFrame();
  const from = at(8, "dois"), to = at(8, "mas") - 4;
  if (f < from || f > to) return null;
  const s1 = at(8, "decimos"), s2 = at(8, "trinta"), s3 = at(8, "borrao");
  const row = (y: number, a2: number, txt: string, col = "#fff", size = 66) =>
    f >= a2 ? (
      <text x={540} y={y} textAnchor="middle" fontSize={size} {...TXT} fill={col} opacity={ramp(f, a2, a2 + 6)}>
        {txt}
      </text>
    ) : null;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      {row(300, from, "2 METROS")}
      {row(390, s1, "÷ 0,2 SEGUNDO")}
      {row(500, s2, "= 36 km/h", "#ffd21f", 100)}
      {row(600, s3, "O OLHO NÃO ACOMPANHA", "#8fd3ff", 54)}
    </svg>
  );
};

/** 10 — matraca × apito */
const RattleWhistle: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(10) - 3, to = L(11) - 3;
  if (f < from || f >= to) return null;
  const ap = at(10, "apito"), y83 = at(10, "1883"), lo = at(10, "longe");
  const ring = (cx: number, cy: number, rmax: number, col: string) =>
    [0, 1, 2].map((i) => {
      const k = (((f - from) / 25) + i / 3) % 1;
      return <circle key={i} cx={cx} cy={cy} r={20 + k * rmax} fill="none" stroke={col} strokeWidth={8 * (1 - k) + 2} opacity={1 - k} />;
    });
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={200} textAnchor="middle" fontSize={64} {...TXT} fill="#ffd21f">CHAMANDO REFORÇO</text>
      {/* matraca */}
      {ring(300, 620, 140, "#ff9a3a")}
      <rect x={292} y={620} width={16} height={130} rx={6} fill="#4a2e14" />
      <rect x={250} y={560} width={140} height={60} rx={10} fill="#8a5a2a" stroke="#0a0f18" strokeWidth={5} transform={`rotate(${(f * 25) % 360} 300 590)`} />
      <text x={300} y={860} textAnchor="middle" fontSize={56} {...TXT}>MATRACA</text>
      <text x={300} y={930} textAnchor="middle" fontSize={50} {...TXT} fill="#ff9a3a">1880</text>
      {/* apito */}
      {f >= ap && (
        <g opacity={ramp(f, ap, ap + 6)}>
          {ring(780, 620, f >= lo ? 330 : 140, "#8fd3ff")}
          <path d="M 700 600 L 820 600 Q 860 600 860 640 Q 860 680 820 680 L 760 680 L 740 640 L 700 640 Z" fill="#c9ccd1" stroke="#0a0f18" strokeWidth={5} />
          <text x={780} y={860} textAnchor="middle" fontSize={56} {...TXT}>APITO</text>
          {f >= y83 && <text x={780} y={930} textAnchor="middle" fontSize={50} {...TXT} fill="#8fd3ff">1883 · LONDRES</text>}
        </g>
      )}
      {f >= lo && (
        <text x={540} y={1150} textAnchor="middle" fontSize={60} {...TXT} fill="#4cd964" transform={`translate(540 1130) scale(${pop(f, lo, 10)}) translate(-540 -1130)`}>
          SE OUVE MUITO MAIS LONGE
        </text>
      )}
    </PanelBg>
  );
};

/** 13 — telégrafo */
const Telegraph: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(13) - 3, to = L(14) - 3;
  if (f < from || f >= to) return null;
  const sin = at(13, "sinal"), mil = at(13, "milhares"), min = at(13, "minutos");
  const poles = [120, 330, 540, 750, 960];
  const wireY = (x: number) => 700 + 40 * Math.sin(((x - 120) / 210) * Math.PI);
  const pulseX = f >= sin ? 120 + (((f - sin) % 16) / 16) * 840 : -100;
  const lit = ramp(f, min, min + 30);
  return (
    <PanelBg from={from} to={to} bg="linear-gradient(#0e1a30, #1a2a40 60%, #2a2016 60%, #1a140e)">
      <text x={540} y={210} textAnchor="middle" fontSize={70} {...TXT} fill="#ffd21f">TELÉGRAFO</text>
      {poles.map((x) => (
        <g key={x}>
          <rect x={x - 8} y={660} width={16} height={520} fill="#5a3a22" />
          <rect x={x - 50} y={660} width={100} height={12} fill="#5a3a22" />
        </g>
      ))}
      <polyline points={Array.from({length: 85}, (_, i) => `${120 + i * 10},${wireY(120 + i * 10)}`).join(" ")} fill="none" stroke="#c9ccd1" strokeWidth={4} />
      {f >= sin && <circle cx={pulseX} cy={wireY(pulseX)} r={18} fill="#ffd21f" />}
      {f >= mil && <text x={540} y={500} textAnchor="middle" fontSize={56} {...TXT}>MILHARES DE km POR SEGUNDO</text>}
      {Array.from({length: 24}, (_, i) => (
        <rect key={i} x={80 + (i % 12) * 78} y={1260 + Math.floor(i / 12) * 90} width={50} height={60} rx={6} fill={i / 24 < lit ? "#ffd27a" : "#2a2a30"} />
      ))}
      {f >= min && <text x={540} y={1520} textAnchor="middle" fontSize={56} {...TXT} fill="#ffd21f">A CIDADE INTEIRA SABIA</text>}
    </PanelBg>
  );
};

/** tela azulada de câmera lenta (carruagem, bolha e perseguição) */
const SlowTint: React.FC = () => {
  const f = useCurrentFrame();
  const k = Math.max(
    isSlow(f) ? Math.min(ramp(f, SL, SL + 8), 1 - ramp(f, RS - 4, RS + 2)) : 0,
    f >= L(5) - 3 && f < L(6) - 3 ? ramp(f, at(5, "bolha") - 4, at(5, "bolha") + 10) * 0.7 : 0,
    f >= L(11) - 3 && f < L(12) - 3 ? ramp(f, at(11, "bolha") - 3, at(11, "bolha") + 6) * 0.7 : 0,
  );
  if (k <= 0) return null;
  return <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 45%, rgba(80,160,255,0) 35%, rgba(20,60,170,0.55) 100%)", opacity: k, mixBlendMode: "multiply"}} />;
};

/** escuridão em volta nas cenas do olho */
const EyeVignette: React.FC = () => {
  const f = useCurrentFrame();
  const on = (f >= L(7) - 3 && f < L(8) - 3) || (f >= at(8, "mas") - 3 && f < L(9) - 3) || f >= at(17, "olho") - 4 && f < SPLIT;
  if (!on) return null;
  return <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 42%, rgba(0,0,0,0) 18%, rgba(0,0,0,0.92) 60%)"}} />;
};

const KEY = new Set(["davi", "farmacia", "luz", "birmingham", "1880", "carruagem", "lentos", "grave", "tempo", "einstein", "1905", "rapido", "devagar", "bolha", "dez", "segundos", "ninguem", "alguem", "viu", "beco", "olho", "piscou", "decimos", "trinta", "seis", "quilometros", "borrao", "matraca", "contado", "apito", "1883", "longe", "procurado", "some", "testemunha", "telegrafo", "milhares", "dispararam", "agnes", "porao", "caro", "catorze", "horas", "foge", "fica", "protege", "comenta"]);

const Split: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SPLIT) return null;
  const both = f >= at(18, "comenta");
  return (
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, #17375f 0%, #0b1a30 70%)"}}>
      <Panel top={150} letter="A" label="Foge pela janela" active={both || (f >= at(18, "foge") && f < at(18, "ou") + 2)} C={PA} a={SPLIT} />
      <Panel top={1050} letter="B" label="Protege a Agnes" active={both || f >= at(18, "fica")} C={PB} a={SPLIT + 4} />
    </AbsoluteFill>
  );
};

export const VideoFug: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cuts = [...SHOTS.slice(1).map((s) => s.from), SPLIT];
  const ruaVol = (g: number) => (g < SL ? 0.9 : g < RS ? 0 : g < L(4) - 3 ? 0.9 : g < L(6) - 3 ? 0 : g < L(7) - 3 ? 0.6 : g < L(9) - 3 ? 0 : g < L(10) - 3 ? 0.6 : g < L(11) - 3 ? 0 : g < L(13) - 3 ? 0.6 : g < L(14) - 3 ? 0 : g < L(15) - 3 ? 0.6 : 0);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>
      <SlowTint />
      <EyeVignette />
      <Relat />
      <RattleWhistle />
      <Telegraph />
      <BubbleClocks />
      <Speed />
      {cuts.map((c) => (f >= c && f < c + 5 ? <AbsoluteFill key={c} style={{background: "#000", opacity: 0.35 * (1 - (f - c) / 5)}} /> : null))}
      <Flash at={at(0, "puxou") + 6} strength={1} />
      <Flash at={L(1) - 3} strength={0.6} />
      <TitleTag text="BIRMINGHAM" from={at(1, "birmingham")} to={at(1, "carruagem") - 2} />
      <Chip from={at(1, "1880")} to={at(1, "carruagem") - 2} text="INGLATERRA · 1880" bg="#7a1f1a" top={420} size={56} />
      <Chip from={at(2, "grave")} to={L(3) - 4} text="APITO GRAVE…" bg="#2f4fa0" top={300} size={56} />
      <Chip from={at(2, "poeira")} to={L(3) - 4} text="POEIRA PARADA NO AR" bg="#2f4fa0" top={420} size={56} />
      <TitleTag text="BOLHA DE TEMPO" from={at(5, "bolha")} to={at(5, "segundo") - 2} />
      <Chip from={at(6, "alguem")} to={L(7) - 4} text="MAS ALGUÉM VIU…" bg="#3a0a0a" size={60} />
      
      <Chip from={at(14, "agnes")} to={L(15) - 4} text="DONA AGNES · RELOJOEIRA" bg="#5a2a4a" size={52} />
      <Chip from={at(15, "porao")} to={L(16) - 4} text="ESCONDIDO NO PORÃO" bg="#3a2a1a" size={56} />
      <Hearing from={L(16) - 3} to={at(16, "dormiu") - 2} v0={1} v1={0.05} />
      <Chip from={at(16, "dormiu")} to={L(17) - 4} text="DORMIU 14 HORAS" bg="#2f4fa0" size={60} />
      <Split />
      <Captions />
      <Chip from={at(18, "comenta")} to={TOTAL_FUG} text="COMENTA AÍ ↓" bg="#2E9E4F" top={905} />
      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozfug.mp3")} />
      <Audio src={staticFile("trilha-bham.mp3")} volume={(fr) => 0.14 * clamp(fr / 30) * (isSlow(fr) ? 0.4 : 1) * (1 - ramp(fr, TOTAL_FUG - 40, TOTAL_FUG))} />
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
      <Sequence from={L(1) - 3} durationInFrames={L(15) - L(1)}>
        <Audio src={staticFile("sfx4/rua1880.mp3")} volume={(fr) => ruaVol(fr + L(1) - 3)} loop />
      </Sequence>
      <Sequence from={L(1) + 9} durationInFrames={30}>
        <Audio src={staticFile("sfx2/land.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(1, "carruagem") - 30} durationInFrames={SL - at(1, "carruagem") + 30}>
        <Audio src={staticFile("sfx4/carriage.mp3")} volume={(fr) => 0.2 + 0.3 * clamp(fr / 40)} />
      </Sequence>
      <Sequence from={SL - 4} durationInFrames={60}>
        <Audio src={staticFile("sfx4/slow.mp3")} volume={0.45} />
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
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 4} durationInFrames={30}>
          <Audio src={staticFile("sfx2/whoosh.mp3")} volume={0.16} />
        </Sequence>
      ))}
      <Sequence from={L(4) - 3} durationInFrames={L(6) - L(4)}>
        <Audio src={staticFile("sfx3/ticking.mp3")} volume={0.15} loop />
      </Sequence>
      <Sequence from={at(5, "bolha") - 4} durationInFrames={60}>
        <Audio src={staticFile("sfx4/slow.mp3")} volume={0.3} />
      </Sequence>
      {/* o olho */}
      <Sequence from={L(7) - 3} durationInFrames={L(8) - L(7)}>
        <Audio src={staticFile("sfx5/eye.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={at(8, "mas") - 3} durationInFrames={L(9) - at(8, "mas")}>
        <Audio src={staticFile("sfx5/eye.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={L(8) - 3} durationInFrames={at(8, "mas") - L(8)}>
        <Audio src={staticFile("sfx3/crowd.mp3")} volume={0.15} loop />
      </Sequence>
      {/* polícia */}
      <Sequence from={at(9, "girou")} durationInFrames={L(10) - at(9, "girou")}>
        <Audio src={staticFile("sfx5/rattle.mp3")} volume={0.55} />
      </Sequence>
      <Sequence from={at(10, "matraca") - 2} durationInFrames={50}>
        <Audio src={staticFile("sfx5/rattle.mp3")} volume={0.3} />
      </Sequence>
      <Sequence from={at(10, "apito") - 2} durationInFrames={60}>
        <Audio src={staticFile("sfx5/whistle.mp3")} volume={0.35} />
      </Sequence>
      <Sequence from={L(11) - 3} durationInFrames={at(11, "bolha") - L(11)}>
        <Audio src={staticFile("sfx5/run.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={at(11, "bolha") - 3} durationInFrames={60}>
        <Audio src={staticFile("sfx4/slow.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={L(13) - 3} durationInFrames={L(14) - L(13)}>
        <Audio src={staticFile("sfx5/telegraph.mp3")} volume={0.4} loop />
      </Sequence>
      <Sequence from={at(14, "dispararam") - 6} durationInFrames={at(14, "mao") - at(14, "dispararam")}>
        <Audio src={staticFile("sfx4/clocks.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={L(15) - 3} durationInFrames={L(17) + 40 - L(15)}>
        <Audio src={staticFile("sfx5/basement.mp3")} volume={0.35} loop />
      </Sequence>
      <Sequence from={at(16, "dormiu") - 4} durationInFrames={L(17) - at(16, "dormiu")}>
        <Audio src={staticFile("sfx5/sleep.mp3")} volume={0.9} />
      </Sequence>
      <Sequence from={L(17) - 3} durationInFrames={60}>
        <Audio src={staticFile("sfx5/knock.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={at(17, "olho") - 4} durationInFrames={TOTAL_FUG - at(17, "olho")}>
        <Audio src={staticFile("sfx5/eye.mp3")} volume={0.5} loop />
      </Sequence>
    </AbsoluteFill>
  );
};
