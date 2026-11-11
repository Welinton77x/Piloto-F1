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
import {Pharmacy, Bag, Portal, Shards, Birmingham, VITRINE, BellTower, ClockShop, WineGlass} from "./Sets3";
import {InteriorLights, Box} from "./Sets";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import W from "./timingBham.json";

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
export const TOTAL_BHAM = F(words[words.length - 1].e + 1.6);

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

/* 1 — cai em Birmingham */
const S1: React.FC<ShotProps> = ({f, a, b, t}) => {
  const land = a + 12;
  const pose = physics("b1", (fr) => {
    const look = ramp(fr, land + 15, land + 45, easeInOut);
    return idle(fr, {pos: [0, fr < land ? lerp(3.5, 0, ((fr - a) / (land - a)) ** 2) : 0, 0], squash: 0.22 * kick(fr, land, 5), eyeWide: 0.8, brow: 0.8, mouthOpen: 0.4 * kick(fr, land, 20), head: [-0.15, lerp(0, Math.sin(fr / 14) * 0.6, look), 0], rShoulder: [0, 0, -0.5 + 0.4 * kick(fr, land, 8)], lShoulder: [0, 0, 0.5 - 0.4 * kick(fr, land, 8)], pupil: [Math.sin(fr / 14) * 0.6, 0.3]});
  }, a, f);
  const p = ramp(f, a, b, easeInOut);
  const sh = shake(f, 0.03 * kick(f, land, 5));
  return (
    <>
      <Cam pos={[lerp(0.8, 0.2, p) + sh[0], 1.3 + sh[1], lerp(4.2, 3.2, p)]} look={[0, 1.4, -1]} fov={46} />
      <Day t={t} />
      <Boy pose={pose} look={DAVI} />
      {f >= land && <Steam t={(f - land) / FPS} origin={[0, 0.05, 0]} count={10} spread={0.4} rise={0.3} size={0.5} power={Math.max(0, 1 - (f - land) / 25)} color="#c9b89a" seed={2} life={1} />}
      {[-2.2, 2.4].map((x, i) => (
        <Boy key={i} look={POVO[i]} pose={physics(`b1p${i}`, (fr) => idle(fr + i * 20, {...walkP(fr, a, 1.1), pos: [x + ((fr - a) / FPS) * (i ? -0.5 : 0.5), 0, -2.2], rotY: i ? -Math.PI / 2 : Math.PI / 2}), a, f)} />
      ))}
    </>
  );
};

/* 2 — tortura: tapa os ouvidos */
const S2: React.FC<ShotProps> = ({f, a, b, t}) => {
  const pose = physics("b2", (fr) => {
    const k = ramp(fr, a + 6, a + 16, easeOut);
    return idle(fr, {...earsCovered(k), blink: 0.7 * k, brow: -0.8 * k, mouthOpen: 0.5 * k, head: [0.15 * k, Math.sin(fr / 4) * 0.08 * k, Math.sin(fr / 5) * 0.06 * k], torso: [0.12 * k, 0, 0]});
  }, a, f);
  const p = ramp(f, a, b, easeInOut);
  const sh = shake(f, 0.008);
  return (
    <>
      <Cam pos={[lerp(0.4, 0.25, p) + sh[0], 1.5 + sh[1], lerp(2.2, 1.7, p)]} look={[0, 1.35, 0]} fov={42} />
      <Day t={t} />
      <Boy pose={pose} look={DAVI} />
      <Steam t={t} origin={[-1.6, 0.1, -1.6]} count={18} spread={0.4} rise={2} size={0.9} power={0.6} color="#e8e2d8" seed={21} life={2} />
    </>
  );
};

/* 7 — perdendo o poder, encostado no muro */
const S7: React.FC<ShotProps> = ({f, a, b, t}) => {
  const pose = physics("b7", (fr) => idle(fr, {pos: [-1.45, 0, -3.1], rotY: 0.35, torso: [0.15, 0, 0.08], head: [0.3, 0.1, 0.12 + Math.sin(fr / 9) * 0.05], blink: Math.max(blinkCurve(fr), 0.45), brow: 0.5, mouthOpen: 0.2, rShoulder: [0.3, 0, -0.5], rElbow: -0.3, lShoulder: [-0.5, 0, 1.0], lElbow: -2.0}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-0.4, -0.7, p), 1.4, lerp(-0.6, -1.1, p)]} look={[-1.5, 1.2, -3.1]} fov={42} />
      <Day t={t} />
      <Boy pose={pose} look={DAVI} />
    </>
  );
};

/* 8 — alguém cantarolando no meio do barulho */
const S8: React.FC<ShotProps> = ({f, a, b, t}) => {
  const c = at(8, "cantarolando");
  const pose = physics("b8", (fr) => idle(fr, {pos: [-0.6, 0, 1.0], rotY: lerp(0.3, -0.9, ramp(fr, c - 4, c + 10, easeInOut)), eyeWide: ramp(fr, c, c + 8), brow: ramp(fr, c, c + 8), head: [0, lerp(0, -0.3, ramp(fr, c, c + 10)), 0], pupil: [-0.6, 0]}), a, f);
  const af = physics("b8a", (fr) => idle(fr, {pos: [1.8, 0, -2.3], rotY: -0.6, mouthOpen: hum(fr), head: [0.05, 0, 0], rShoulder: [0, 0, -0.08], lShoulder: [0, 0, 0.08]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-1.4, -1.2, p), 1.6, lerp(2.6, 2.3, p)]} look={[1.0, 1.3, -1.6]} fov={40} />
      <Day t={t} />
      <Boy pose={pose} look={DAVI} />
      <Boy pose={af} look={AFINADOR} />
      {[0, 1, 2].map((i) => (
        <Boy key={i} look={POVO[i + 2]} pose={physics(`b8p${i}`, (fr) => idle(fr + i * 9, {...walkP(fr, a + i * 5, 1.2), pos: [-4 + i * 1.3 + ((fr - a) / FPS) * 0.6, 0, -1.1 - i * 0.4], rotY: Math.PI / 2}), a, f)} />
      ))}
    </>
  );
};

/* 9 — a vitrine estoura */
const S9: React.FC<ShotProps> = ({f, a, b, t}) => {
  const c = at(9, "cantarolou");
  const boom = at(9, "estourou");
  const af = physics("b9", (fr) => idle(fr, {pos: [0.35, 0, -2.05], rotY: Math.PI + 0.6, mouthOpen: fr < c ? hum(fr) : 0.3 + 0.1 * Math.sin(fr / 2), head: [-0.1 * ramp(fr, c, boom), 0, 0], torso: [-0.05 * ramp(fr, c, boom), 0, 0]}), a, f);
  const wob = ramp(f, c, boom, (x) => x * x) * 3;
  const sh = shake(f, 0.03 * kick(f, boom, 6));
  return (
    <>
      <Cam pos={[2.5 + sh[0], 1.5 + sh[1], -0.5]} look={[0.7, 1.2, -2.7]} fov={44} />
      <Day t={t} vw={f < boom ? wob : 0} vb={f >= boom} />
      <Boy pose={af} look={AFINADOR} />
      {f >= boom && <Shards t={(f - boom) / FPS} origin={VITRINE.p} count={60} spread={[VITRINE.w, VITRINE.h, 0.05]} />}
    </>
  );
};

/* 11 — ressonância: a taça */
const GlassScene: React.FC<{f: number; t: number; wobble: number; broken: boolean; brokenAt: number}> = ({f, t, wobble, broken, brokenAt}) => (
  <>
    <Cam pos={[0, 1.05, 1.1]} look={[0, 0.92, 0]} fov={34} />
    <color attach="background" args={["#0a0c14"]} />
    <hemisphereLight args={["#8090c0", "#100c08", 0.4]} />
    <spotLight position={[0.6, 2.4, 1.0]} angle={0.5} penumbra={0.6} intensity={8} color="#fff0d8" castShadow />
    <Box p={[0, 0.72, 0]} s={[1.6, 0.06, 1.0]} m={useMemo(() => new THREE.MeshStandardMaterial({color: "#4a2e1e", roughness: 0.5}), [])} />
    <WineGlass t={t} p={[0, 0.75, 0]} wobble={wobble} broken={broken} scale={1.4} />
    {broken && <Shards t={(f - brokenAt) / FPS} origin={[0, 1.05, 0]} count={40} spread={[0.2, 0.25, 0.1]} seed={8} size={0.3} speed={0.45} />}
  </>
);
const S11: React.FC<ShotProps> = ({f, t}) => {
  const ac = at(11, "acerta");
  const br = at(11, "aguentar") + 4;
  return <GlassScene f={f} t={t} wobble={f < br ? ramp(f, ac, br, (x) => x * x) * 1.2 : 0} broken={f >= br} brokenAt={br} />;
};

/* 12 — o Afinador vira e olha pro Davi */
const S12: React.FC<ShotProps> = ({f, a, b, t}) => {
  const v = at(12, "virou");
  const d = at(12, "davi");
  const af = physics("b12", (fr) => idle(fr, {pos: [0, 0, 0], rotY: lerp(Math.PI * 0.85, 0, ramp(fr, v, v + 30, easeInOut)), brow: lerp(0, -0.8, ramp(fr, d - 4, d + 6)), smile: 0.5 * ramp(fr, d, d + 10), blink: 0, pupil: [0, 0], head: [-0.05, 0, 0]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[0.1, 1.55, lerp(1.4, 0.9, p)]} look={[0, 1.5, 0]} fov={36} />
      <Day t={t} />
      <Boy pose={af} look={AFINADOR} />
    </>
  );
};

/* 13a — uma mão puxa o Davi */
const S13a: React.FC<ShotProps> = ({f, a, b, t}) => {
  const m = at(13, "mao");
  const k = ramp(f, m, m + 10, easeOut);
  const davi = physics("b13", (fr) => {
    const kk = ramp(fr, m, m + 10, easeOut);
    return idle(fr, {pos: [lerp(0, -1.1, kk), 0, lerp(-0.9, -2.0, kk)], rotY: lerp(-0.4, -1.2, kk), torso: [0, 0, 0.35 * kick(fr, m + 2, 8)], eyeWide: kk, brow: kk, mouthOpen: 0.5 * kk, rShoulder: [-1.3 * kk, 0, -0.4], rElbow: -0.2});
  }, a, f);
  const ag = physics("b13ag", (fr) => idle(fr, {pos: [-1.5, 0, -2.4], rotY: 0.9, rShoulder: [-1.3 + 0.4 * ramp(fr, m, m + 10), 0, -0.1], rElbow: -0.1 - 1.2 * ramp(fr, m, m + 10), brow: -0.4}), a, f);
  return (
    <>
      <Cam pos={[0.9, 1.5, 1.8]} look={[-0.8, 1.2, -2.2]} fov={44} />
      <Day t={t} />
      <Boy pose={ag} look={AGNES} />
      <Boy pose={davi} look={DAVI} />
      {k > 0 && null}
    </>
  );
};

/* 13b/14 — dentro da loja: dona Agnes tranca a porta e explica */
const S14: React.FC<ShotProps> = ({f, a, b, t}) => {
  const tr = at(14, "trancou");
  const d = at(14, "disse");
  const ag = physics("b14", (fr) => {
    const lock = ramp(fr, tr - 4, tr + 6) * (1 - ramp(fr, d - 4, d + 4));
    const turn = ramp(fr, d - 6, d + 4, easeInOut);
    return idle(fr, {pos: [-0.45, 0, 0.3], rotY: lerp(Math.PI, Math.PI / 2 + 0.3, turn), rShoulder: [-1.2 * lock, 0, -0.1], rElbow: -0.4 * lock, rWrist: [0, 0, 1.2 * lock * Math.sin(fr / 3)], mouthOpen: talk(fr, d, L(15) - 6), brow: -0.5, head: [0.05, 0, 0]});
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

/* 17 — primeira lição: o diapasão */
const S17: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const strike = at(17, "primeira");
  const ag = physics("b17", (fr) => idle(fr, {pos: [-0.3, 0, 0.1], rotY: Math.PI / 2, rShoulder: [-1.3, 0, -0.1], rElbow: -0.6 - 0.4 * kick(fr, strike, 4), mouthOpen: talk(fr, at(17, "escutar"), L(18) - 4), smile: 0.4}), a, f);
  const davi = physics("b17d", (fr) => idle(fr, {pos: [0.4, 0, 0.1], rotY: -Math.PI / 2, blink: fr > strike + 6 ? 1 : 0, head: [0, 0, -0.2], brow: -0.3}), a, f);
  const fork = useMemo(() => new THREE.MeshStandardMaterial({color: "#c9ccd1", metalness: 0.9, roughness: 0.2}), []);
  const vib = 0.02 * kick(f, strike, 20) * Math.sin(f * 2.5);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[0.05, 1.5, lerp(2.4, 2.1, p)]} look={[0.05, 1.3, 0.1]} fov={42} />
      <Shop t={t} />
      <Boy pose={ag} look={AGNES} palmRef={palm} />
      <Boy pose={davi} look={DAVI} />
      <AtPalm palm={palm} offset={[0, 0.02, 0]}>
        <group rotation={[0, 0, 0]}>
          <Box p={[-0.022 - vib, 0.12, 0]} s={[0.012, 0.16, 0.012]} m={fork} shadow={false} />
          <Box p={[0.022 + vib, 0.12, 0]} s={[0.012, 0.16, 0.012]} m={fork} shadow={false} />
          <Box p={[0, 0.04, 0]} s={[0.056, 0.012, 0.012]} m={fork} shadow={false} />
          <Box p={[0, -0.02, 0]} s={[0.012, 0.1, 0.012]} m={fork} shadow={false} />
        </group>
      </AtPalm>
    </>
  );
};

/* 18 — a taça para de tremer por 2 segundos */
const S18: React.FC<ShotProps> = ({f, a, b, t}) => {
  const tent = at(18, "tentou");
  const stop = at(18, "parou");
  const back = stop + 60;
  const wob = f < stop ? 0.8 : f < back ? 0.8 * (1 - ramp(f, stop, stop + 6)) : 0.8 * ramp(f, back, back + 6);
  const davi = physics("b18", (fr) => {
    const lost = ramp(fr, back, back + 8);
    return idle(fr, {pos: [0.4, 0, -1.25], rotY: 0, mouthOpen: fr >= tent && fr < back ? hum(fr) : 0.1, blink: fr >= tent && fr < back ? 1 : 0, brow: lerp(-0.4, 0.8, lost), head: [0.15, 0, 0], torso: [0.1, 0, 0], rShoulder: [-0.4, 0, -0.2], lShoulder: [-0.4, 0, 0.2]});
  }, a, f);
  const ag = physics("b18a", (fr) => idle(fr, {pos: [-0.75, 0, -0.9], rotY: 0.7, rShoulder: [-0.75, 0, 0.42], lShoulder: [-0.75, 0, -0.42], rElbow: -1.8, lElbow: -1.8, smile: 0.4 * ramp(fr, stop, stop + 10) * (1 - ramp(fr, back, back + 8))}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.75, 0.6, p), 1.3, lerp(1.5, 1.3, p)]} look={[0.4, 1.05, -0.8]} fov={42} />
      <Shop t={t} />
      <WineGlass t={t} p={[0.4, 0.765, -0.6]} wobble={wob} />
      <Boy pose={davi} look={DAVI} />
      <Boy pose={ag} look={AGNES} />
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

/* ---------- lista de planos ---------- */
const Empty: React.FC<ShotProps> = () => <Dark />;
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1) - 3, Comp: S1},
  {from: L(2) - 3, Comp: S2},
  {from: L(3) - 3, Comp: Empty}, // decibéis
  {from: L(5) - 3, Comp: Empty}, // ouvido
  {from: L(6) - 3, Comp: Empty}, // pelinhos
  {from: L(7) - 3, Comp: S7},
  {from: L(8) - 3, Comp: S8},
  {from: L(9) - 3, Comp: S9},
  {from: L(10) - 3, Comp: Empty}, // balanço
  {from: L(11) - 3, Comp: S11},
  {from: L(12) - 3, Comp: S12},
  {from: L(13) - 3, Comp: S13a},
  {from: at(13, "era") - 3, Comp: S14},
  {from: L(15) - 3, Comp: Empty}, // ondas
  {from: L(16) - 3, Comp: Empty}, // fone
  {from: L(17) - 3, Comp: S17},
  {from: L(18) - 3, Comp: S18},
  {from: L(19) - 3, Comp: S19},
  {from: L(20) - 3, Comp: S20},
];
const SPLIT = at(21, "davi") - 8;

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
  const davi = physics("pa", (fr) => idle(fr, {pos: [0, 0, 0.5], rotY: Math.PI, mouthOpen: hum(fr), blink: 1, brow: -0.6, rShoulder: [-1.5, 0, -0.3], rElbow: -1.6, head: [-0.3, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[1.2, 1.2, 3.2]} look={[0, 4.5, -7]} fov={50} />
      <Night t={t} swing={0.5 - 0.3 * ramp(f, a + 20, a + 60)} crack={0.4} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};
const PB: React.FC<ShotProps> = ({f, a, t}) => {
  const z = 1.5 - ((f - a) / FPS) * 1.0;
  const davi = physics("pb", (fr) => idle(fr, {...walkP(fr, a, 2.4), walkAmt: 1.4, pos: [0, 0, 1.5 - ((fr - a) / FPS) * 1.0], rotY: Math.PI, torso: [0.3, 0, 0], rShoulder: [-1.4, 0, -0.6], rElbow: -0.2, mouthOpen: 1, eyeWide: 1, brow: 1}), a, f);
  return (
    <>
      <Cam pos={[1.0, 1.6, z + 3.2]} look={[0, 1.2, z - 2]} fov={46} />
      <Night t={t} swing={0.5} crack={0.4} />
      <Boy pose={davi} look={DAVI} />
      <Crowd f={f} a={a} flee={1} />
    </>
  );
};
const PanelScene: React.FC<{C: React.FC<ShotProps>; a: number}> = ({C, a}) => {
  const f = useCurrentFrame();
  return (
    <>
      <C f={f} a={a} b={TOTAL_BHAM} t={f / FPS} />
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
const Split: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SPLIT) return null;
  const both = f >= at(21, "comenta");
  return (
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, #17375f 0%, #0b1a30 70%)"}}>
      <Panel top={150} letter="A" label="Anula o som" active={both || (f >= at(21, "anular") && f < at(21, "ou") + 2)} C={PA} a={SPLIT} />
      <Panel top={1050} letter="B" label="Salva o povo" active={both || f >= at(21, "corre")} C={PB} a={SPLIT + 4} />
    </AbsoluteFill>
  );
};

/* ---------- sobreposições 2D ---------- */
const KEY = new Set(["davi", "farmacia", "luz", "birmingham", "1880", "tortura", "decibel", "sessenta", "cento", "dez", "cem", "mil", "timpano", "martelo", "bigorna", "estribo", "coclea", "quinze", "quebra", "nascem", "poder", "cantarolando", "estourou", "frequencia", "natural", "ressonancia", "agnes", "afinador", "osso", "crista", "vale", "anulam", "silencio", "contrario", "dois", "sino", "rachar", "feira", "anular", "corre", "comenta"]);
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
  if (i < 0 || f >= at(21, "comenta")) return null;
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

/** 3/4 — escala de decibéis (logarítmica) */
const Decibels: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(3) - 3, to = L(5) - 3;
  if (f < from || f >= to) return null;
  const conv = at(3, "conversa"), rua = at(3, "rua");
  const steps = [60, 70, 80, 90, 100, 110];
  const mult = ["×1", "×10", "×100", "×1.000", "×10.000", "×100.000"];
  const ladder0 = at(4, "cada");
  const ladder1 = at(4, "cem");
  const y = (db: number) => 1120 - (db / 120) * 820;
  const line4 = f >= L(4) - 3;
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={210} textAnchor="middle" fontSize={92} {...TXT} fill="#ffd21f">DECIBEL (dB)</text>
      {/* régua */}
      <line x1={230} y1={y(0)} x2={230} y2={y(120)} stroke="#fff" strokeWidth={8} />
      {[0, 20, 40, 60, 80, 100, 120].map((d) => (
        <g key={d}>
          <line x1={210} y1={y(d)} x2={250} y2={y(d)} stroke="#fff" strokeWidth={5} />
          <text x={190} y={y(d) + 16} textAnchor="end" fontSize={44} {...TXT}>{d}</text>
        </g>
      ))}
      {!line4 && (
        <>
          {f >= conv && (
            <g opacity={ramp(f, conv, conv + 6)}>
              <rect x={290} y={y(60 * ramp(f, conv, conv + 14, easeOut))} width={260} height={y(0) - y(60 * ramp(f, conv, conv + 14, easeOut))} rx={18} fill="#4cd964" />
              <text x={420} y={y(60) - 30} textAnchor="middle" fontSize={56} {...TXT}>CONVERSA</text>
              <text x={420} y={y(30)} textAnchor="middle" fontSize={84} {...TXT}>60</text>
            </g>
          )}
          {f >= rua && (
            <g opacity={ramp(f, rua, rua + 6)}>
              <rect x={620} y={y(110 * ramp(f, rua, rua + 16, easeOut))} width={260} height={y(0) - y(110 * ramp(f, rua, rua + 16, easeOut))} rx={18} fill="#ff3b30" />
              <text x={750} y={y(110) - 30} textAnchor="middle" fontSize={56} {...TXT}>FÁBRICA</text>
              <text x={750} y={y(55)} textAnchor="middle" fontSize={84} {...TXT}>110</text>
            </g>
          )}
        </>
      )}
      {line4 && (
        <>
          {f < ladder0 && (
            <text x={540} y={700} textAnchor="middle" fontSize={78} {...TXT} fill="#ffd21f">NÃO SOMA NORMAL!</text>
          )}
          {steps.map((d, i) => {
            const tStep = lerp(ladder0, ladder1, i / (steps.length - 1));
            if (f < tStep) return null;
            const w = 70 + i * 60;
            return (
              <g key={d} opacity={ramp(f, tStep, tStep + 5)}>
                <rect x={290} y={y(d) - 34} width={w * ramp(f, tStep, tStep + 8, easeOut)} height={60} rx={14} fill={i < 2 ? "#4cd964" : i < 4 ? "#ffcc00" : "#ff3b30"} />
                <text x={290 + w + 20} y={y(d) + 14} fontSize={i === 5 ? 56 : 48} {...TXT} fill={i === 5 ? "#ffd21f" : "#fff"}>
                  {d} dB {mult[i]}
                </text>
              </g>
            );
          })}
          {f >= ladder1 && (
            <text x={540} y={1230} textAnchor="middle" fontSize={104} {...TXT} fill="#ff3b30" transform={`translate(540 1200) scale(${pop(f, ladder1, 10)}) translate(-540 -1200)`}>
              100.000× MAIS FORTE
            </text>
          )}
        </>
      )}
    </PanelBg>
  );
};

/** 5 — o ouvido por dentro */
const Ear: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(5) - 3, to = L(6) - 3;
  if (f < from || f >= to) return null;
  const tim = at(5, "timpano"), mar = at(5, "martelo"), big = at(5, "bigorna"), est = at(5, "estribo"), men = at(5, "menor"), coc = at(5, "coclea");
  const hl = (a: number, b2: number) => (f >= a && f < b2 ? 1 : 0);
  const vib = (a: number) => (f >= a ? Math.sin(f * 1.4) * 6 * kick(f, a, 25) + Math.sin(f * 1.4) * 2 : 0);
  // pulso de som andando pelo caminho
  const px = f < tim ? lerp(60, 330, ramp(f, from, tim)) : f < mar ? 330 : f < coc ? lerp(390, 720, ramp(f, mar, coc)) : 800;
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={190} textAnchor="middle" fontSize={84} {...TXT} fill="#ffd21f">O OUVIDO POR DENTRO</text>
      <g transform="translate(540 880) scale(1.22) translate(-430 -880)">
      {/* canal auditivo */}
      <path d="M 0 760 L 330 800 L 330 980 L 0 1040 Z" fill="#e8a888" stroke="#8a4a3a" strokeWidth={6} />
      {/* ondas entrando */}
      {[0, 1, 2].map((i) => {
        const k = ((f - from) / 18 + i / 3) % 1;
        return <path key={i} d={`M ${40 + k * 250} 830 q 30 60 0 120`} fill="none" stroke="#8fd3ff" strokeWidth={8} opacity={1 - k} />;
      })}
      {/* tímpano */}
      <ellipse cx={335 + vib(tim)} cy={890} rx={18} ry={100} fill={hl(tim, mar) ? "#ffd21f" : "#f4c0a8"} stroke="#8a4a3a" strokeWidth={6} />
      {f >= tim && <text x={335} y={1050} textAnchor="middle" fontSize={44} {...TXT}>TÍMPANO</text>}
      {/* martelo, bigorna, estribo */}
      <path d={`M ${350 + vib(mar)} 880 l 70 -60 l 20 15 l -60 60 z`} fill={hl(mar, big) ? "#ffd21f" : "#f2ead6"} stroke="#5a4a3a" strokeWidth={5} />
      <path d={`M ${430 + vib(big)} 820 q 50 -20 60 30 l -30 60 l -25 -10 z`} fill={hl(big, est) ? "#ffd21f" : "#f2ead6"} stroke="#5a4a3a" strokeWidth={5} />
      <path d={`M ${470 + vib(est)} 900 l 60 0 l 0 -18 l 10 0 l 0 56 l -10 0 l 0 -18 l -60 0 z`} fill={hl(est, coc) ? "#ffd21f" : "#f2ead6"} stroke="#5a4a3a" strokeWidth={5} />
      {f >= mar && <text x={385} y={760} textAnchor="middle" fontSize={40} {...TXT}>MARTELO</text>}
      {f >= big && <text x={520} y={720} textAnchor="middle" fontSize={40} {...TXT}>BIGORNA</text>}
      {f >= est && <text x={510} y={990} textAnchor="middle" fontSize={40} {...TXT}>ESTRIBO</text>}
      {/* cóclea */}
      <g transform="translate(720 880)">
        <path d="M 0 0 m -10 0 a 10 10 0 1 1 20 0 a 25 25 0 1 1 -50 0 a 45 45 0 1 1 90 0 a 65 65 0 1 1 -130 0 a 85 85 0 1 1 170 0" fill="none" stroke={hl(coc, to + 1) ? "#ffd21f" : "#f0a0b0"} strokeWidth={22} strokeLinecap="round" />
      </g>
      {f >= coc && <text x={760} y={1040} textAnchor="middle" fontSize={48} {...TXT}>CÓCLEA</text>}
      <circle cx={px} cy={890} r={16} fill="#8fd3ff" opacity={0.9} />
      </g>
      {f >= men && (
        <g transform={`translate(540 1180) scale(${pop(f, men, 10)})`}>
          <rect x={-330} y={-60} width={660} height={100} rx={20} fill="#d01f1a" stroke="#fff" strokeWidth={5} />
          <text x={0} y={10} textAnchor="middle" fontSize={50} {...TXT} strokeWidth={0}>MENOR OSSO DO CORPO · 3 mm</text>
        </g>
      )}
    </PanelBg>
  );
};

/** 6 — os pelinhos da cóclea */
const Hair: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(6) - 3, to = L(7) - 3;
  if (f < from || f >= to) return null;
  const q = at(6, "quinze"), si = at(6, "sinal"), qb = at(6, "quebra"), nn = at(6, "nascem");
  const N = 12;
  return (
    <PanelBg from={from} to={to} bg="radial-gradient(circle at 50% 45%, #4a1a3a, #12060e 75%)">
      <text x={540} y={210} textAnchor="middle" fontSize={78} {...TXT} fill="#ffd21f">DENTRO DA CÓCLEA</text>
      <rect x={60} y={1000} width={960} height={70} rx={20} fill="#c06080" />
      {Array.from({length: N}, (_, i) => {
        const x = 110 + i * 78;
        const broken = f >= qb + 6 && i % 3 !== 1;
        const sway = broken ? 0 : Math.sin(f / 4 + i * 0.6) * (f >= qb && f < qb + 10 ? 30 : 10);
        const bend = broken ? 70 : 0;
        return (
          <g key={i}>
            <rect x={x - 24} y={880} width={48} height={120} rx={20} fill={broken ? "#6a5a60" : "#f2c0d0"} stroke="#5a2a3a" strokeWidth={4} />
            {[-12, 0, 12].map((dx) => (
              <line key={dx} x1={x + dx} y1={880} x2={x + dx + sway + bend} y2={broken ? 870 : 790 - Math.abs(dx)} stroke={broken ? "#8a8a8a" : "#fff"} strokeWidth={7} strokeLinecap="round" />
            ))}
            {broken && <text x={x} y={850} textAnchor="middle" fontSize={44} fill="#ff3b30" fontFamily={fontFamily} fontWeight={900}>×</text>}
          </g>
        );
      })}
      {f >= q && <text x={540} y={480} textAnchor="middle" fontSize={100} {...TXT} transform={`translate(540 450) scale(${pop(f, q, 10)}) translate(-540 -450)`}>≈ 15.000 PELINHOS</text>}
      {f >= si && f < qb && (
        <g opacity={ramp(f, si, si + 6)}>
          <path d="M 540 760 L 540 620" stroke="#8fd3ff" strokeWidth={14} />
          <path d="M 510 650 L 540 600 L 570 650 Z" fill="#8fd3ff" />
          <text x={540} y={580} textAnchor="middle" fontSize={56} {...TXT}>SINAL → CÉREBRO</text>
        </g>
      )}
      {f >= qb && f < qb + 10 && <rect x={0} y={0} width={1080} height={1920} fill="#ff3b30" opacity={0.25 * (1 - (f - qb) / 10)} />}
      {f >= nn && (
        <g transform={`translate(540 620) scale(${pop(f, nn, 10)})`}>
          <rect x={-420} y={-70} width={840} height={110} rx={22} fill="#d01f1a" stroke="#fff" strokeWidth={5} />
          <text x={0} y={8} textAnchor="middle" fontSize={56} {...TXT} strokeWidth={0}>NÃO NASCEM DE NOVO</text>
        </g>
      )}
    </PanelBg>
  );
};

/** 10 — frequência natural: o balanço */
const Swing: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(10) - 3, to = L(11) - 3;
  if (f < from || f >= to) return null;
  const emp = at(10, "empurra");
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
          <text x={sx - 180} y={sy - 50} textAnchor="middle" fontSize={50} {...TXT}>NA HORA CERTA!</text>
        </g>
      )}
      <path d={`M ${pivot[0] + Math.sin(-amp) * len} ${pivot[1] + Math.cos(amp) * len + 60} A ${len} ${len} 0 0 0 ${pivot[0] + Math.sin(amp) * len} ${pivot[1] + Math.cos(amp) * len + 60}`} fill="none" stroke="#fff" strokeWidth={6} strokeDasharray="16 12" opacity={0.8} />
    </PanelBg>
  );
};

/** 11 — onda crescendo (ressonância) por cima da taça */
const Grow: React.FC = () => {
  const f = useCurrentFrame();
  const from = at(11, "acerta"), to = at(11, "aguentar") + 4;
  if (f < from || f >= to) return null;
  const amp = 20 + 160 * ramp(f, from, to, (x) => x * x);
  const pts = Array.from({length: 61}, (_, i) => {
    const x = 90 + i * 15;
    return `${x},${430 + Math.sin(i * 0.55 + f * 0.6) * amp}`;
  }).join(" ");
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      <polyline points={pts} fill="none" stroke="#ffd21f" strokeWidth={10} />
      <text x={540} y={720} textAnchor="middle" fontSize={56} {...TXT}>CADA VIBRAÇÃO SOMA NA OUTRA</text>
    </svg>
  );
};

/** 15 — crista + vale = silêncio */
const Waves: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(15) - 3, to = L(16) - 3;
  if (f < from || f >= to) return null;
  const cr = at(15, "crista"), va = at(15, "vale"), en = at(15, "encontra"), an = at(15, "anulam"), si = at(15, "silencio");
  const merge = ramp(f, en, an, easeInOut);
  const wave = (y: number, phase: number, color: string, ampK = 1) => {
    const pts = Array.from({length: 61}, (_, i) => `${90 + i * 15},${y + Math.sin(i * 0.42 + phase + f * 0.15) * 90 * ampK}`).join(" ");
    return <polyline points={pts} fill="none" stroke={color} strokeWidth={10} />;
  };
  const yA = lerp(520, 820, merge), yB = lerp(1120, 820, merge);
  const sum = 1 - ramp(f, an - 4, an + 10);
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={200} textAnchor="middle" fontSize={84} {...TXT} fill="#ffd21f">ONDAS</text>
      {merge < 0.98 ? (
        <>
          {wave(yA, 0, "#8fd3ff")}
          {wave(yB, Math.PI, "#ff9a3a")}
        </>
      ) : (
        wave(820, 0, sum > 0.05 ? "#ffd21f" : "#4cd964", sum)
      )}
      {f >= cr && merge < 0.5 && (
        <g opacity={ramp(f, cr, cr + 5)}>
          <text x={300} y={yA - 120} textAnchor="middle" fontSize={56} {...TXT}>CRISTA ↓</text>
        </g>
      )}
      {f >= va && merge < 0.5 && (
        <g opacity={ramp(f, va, va + 5)}>
          <text x={760} y={yA + 170} textAnchor="middle" fontSize={56} {...TXT}>VALE ↑</text>
        </g>
      )}
      {f >= en && merge < 0.98 && <text x={540} y={1215} textAnchor="middle" fontSize={60} {...TXT}>CRISTA + VALE</text>}
      {f >= si && (
        <text x={540} y={1060} textAnchor="middle" fontSize={130} {...TXT} fill="#4cd964" transform={`translate(540 1020) scale(${pop(f, si, 10)}) translate(-540 -1020)`}>
          SILÊNCIO
        </text>
      )}
    </PanelBg>
  );
};

/** 16 — fone com cancelamento de ruído */
const Headphone: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(16) - 3, to = L(17) - 3;
  if (f < from || f >= to) return null;
  const ct = at(16, "contrario");
  const wave = (x0: number, y: number, phase: number, color: string, k = 1) => {
    const pts = Array.from({length: 25}, (_, i) => `${x0 + i * 12},${y + Math.sin(i * 0.6 + phase + f * 0.3) * 50 * k}`).join(" ");
    return <polyline points={pts} fill="none" stroke={color} strokeWidth={9} />;
  };
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={200} textAnchor="middle" fontSize={64} {...TXT} fill="#ffd21f">FONE QUE CANCELA RUÍDO</text>
      <path d="M 300 820 A 240 240 0 0 1 780 820" fill="none" stroke="#2a2a30" strokeWidth={48} strokeLinecap="round" />
      <rect x={230} y={790} width={140} height={230} rx={50} fill="#2a2a30" />
      <rect x={710} y={790} width={140} height={230} rx={50} fill="#2a2a30" />
      {wave(40, 640, 0, "#ff3b30")}
      <text x={180} y={570} textAnchor="middle" fontSize={44} {...TXT}>RUÍDO</text>
      {f >= at(16, "toca") && (
        <>
          {wave(40, 1180, Math.PI, "#8fd3ff")}
          <text x={190} y={1290} textAnchor="middle" fontSize={44} {...TXT}>AO CONTRÁRIO</text>
        </>
      )}
      {f >= ct && (
        <g opacity={ramp(f, ct, ct + 6)}>
          <line x1={420} y1={905} x2={660} y2={905} stroke="#4cd964" strokeWidth={12} />
          <text x={540} y={1450} textAnchor="middle" fontSize={64} {...TXT} fill="#4cd964">= SILÊNCIO</text>
        </g>
      )}
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
      <div style={{fontFamily, fontWeight: 900, fontSize: 60, color: "#fff", ...STROKE, marginBottom: 12}}>PODER {Math.round(v * 100)}%</div>
      <div style={{height: 56, borderRadius: 28, background: "rgba(10,15,24,0.7)", border: "5px solid #fff", overflow: "hidden"}}>
        <div style={{height: "100%", width: `${v * 100}%`, background: col}} />
      </div>
    </div>
  );
};

/** muitas ondas bagunçadas (barulho) e uma nota limpa */
const Noise: React.FC<{from: number; to: number; clean?: number}> = ({from, to, clean: cl}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 6), 1 - ramp(f, to - 6, to));
  const jag = (y: number, seed: number, col: string) => {
    const pts = Array.from({length: 46}, (_, i) => `${60 + i * 21},${y + Math.sin(i * 1.7 + seed + f * 0.9) * 30 + Math.sin(i * 3.1 + f * 1.3 + seed) * 22}`).join(" ");
    return <polyline points={pts} fill="none" stroke={col} strokeWidth={6} opacity={0.75} />;
  };
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {jag(330, 1, "#ff3b30")}
      {jag(420, 4, "#ff9a3a")}
      {jag(510, 7, "#ff3b30")}
      {cl !== undefined && f >= cl && (
        <>
          <polyline points={Array.from({length: 46}, (_, i) => `${60 + i * 21},${620 + Math.sin(i * 0.5 + f * 0.3) * 40}`).join(" ")} fill="none" stroke="#8fd3ff" strokeWidth={10} />
          <text x={540} y={720} textAnchor="middle" fontSize={56} {...TXT} fill="#8fd3ff">UMA NOTA SÓ</text>
        </>
      )}
    </svg>
  );
};

export const VideoBham: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cuts = [...SHOTS.slice(1).map((s) => s.from), SPLIT];
  const factoryVol = (fr: number) => {
    const g = fr + (L(1) - 3);
    if (g < L(2) - 3) return 0.25;
    if (g < L(3) - 3) return 0.5;
    if (g < L(7) - 3) return 0.08;
    if (g < L(10) - 3) return 0.25;
    if (g < L(12) - 3) return 0.06;
    return 0.2;
  };
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>
      <Decibels />
      <Ear />
      <Hair />
      <Swing />
      <Waves />
      <Headphone />
      <Grow />
      {cuts.map((c) => (f >= c && f < c + 5 ? <AbsoluteFill key={c} style={{background: "#000", opacity: 0.35 * (1 - (f - c) / 5)}} /> : null))}
      <Flash at={at(0, "puxou") + 6} strength={1} />
      <Flash at={L(1) - 3} strength={0.6} />
      <TitleTag text="BIRMINGHAM" from={at(1, "birmingham")} to={L(2) - 4} />
      <Chip from={at(1, "1880")} to={L(2) - 4} text="1880" bg="#7a1f1a" top={660} size={56} />
      <Chip from={at(1, "inglaterra")} to={L(2) - 4} text="INGLATERRA" bg="#1f3a6b" top={420} size={56} />
      <Chip from={at(1, "cidade")} to={L(2) - 4} text="CIDADE DAS MIL FÁBRICAS" bg="#5a3a2a" top={540} size={50} />
      <Rings from={at(2, "martelo")} to={L(3) - 4} x={200} y={500} color="#ff3b30" speed={12} />
      <Rings from={at(2, "apito")} to={L(3) - 4} x={900} y={420} color="#ff9a3a" speed={10} />
      <Rings from={at(2, "ferro")} to={L(3) - 4} x={540} y={980} color="#ff3b30" speed={8} />
      <Hearing from={L(7) - 3} to={L(8) - 4} v0={1} v1={0.72} />
      <Noise from={L(8) - 3} to={L(9) - 4} clean={at(8, "cantarolando")} />
      <Flash at={at(9, "estourou")} strength={0.5} />
      <TitleTag text="RESSONÂNCIA" from={at(11, "ressonancia")} to={L(12) - 4} />
      <Chip from={at(13, "agnes")} to={L(14) - 4} text="DONA AGNES · RELOJOEIRA" bg="#5a2a4a" size={52} />
      <TitleTag text="O AFINADOR" from={at(14, "afinador")} to={L(15) - 4} />
      <Chip from={at(14, "vidro")} to={L(15) - 4} text="VIDRO" bg="#2f6fd6" top={420} size={56} />
      <Chip from={at(14, "sino")} to={L(15) - 4} text="SINO" bg="#b8863a" top={530} size={56} />
      <Chip from={at(14, "osso")} to={L(15) - 4} text="OSSO" bg="#d01f1a" top={640} size={56} />
      <TitleTag text="1ª LIÇÃO" from={at(17, "primeira")} to={L(18) - 4} />
      <Rings from={at(17, "primeira")} to={L(18) - 4} x={460} y={760} color="#8fd3ff" speed={18} />
      <Chip from={at(18, "parou")} to={at(18, "parou") + 60} text={`${Math.max(0, 2 - Math.floor((f - at(18, "parou")) / 30))} s DE SILÊNCIO`} bg="#2E9E4F" />
      <Rings from={at(19, "sino")} to={SPLIT} x={540} y={420} color="#ffd21f" speed={16} />
      <Chip from={at(20, "rachar")} to={SPLIT - 2} text="SE RACHAR… CAI NA FEIRA" bg="#d01f1a" top={560} size={52} />
      <Split />
      <Captions />
      <Chip from={at(21, "comenta")} to={TOTAL_BHAM} text="COMENTA AÍ ↓" bg="#2E9E4F" top={905} />
      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozbham.mp3")} />
      <Audio src={staticFile("trilha-bham.mp3")} volume={(fr) => 0.15 * clamp(fr / 30) * (1 - ramp(fr, TOTAL_BHAM - 40, TOTAL_BHAM))} />
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
      <Sequence from={L(1) - 3} durationInFrames={L(19) - L(1)}>
        <Audio src={staticFile("sfx3/factory.mp3")} volume={factoryVol} loop />
      </Sequence>
      <Sequence from={L(1) + 9} durationInFrames={30}>
        <Audio src={staticFile("sfx2/land.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(2, "apito") - 2} durationInFrames={90}>
        <Audio src={staticFile("sfx3/whistle.mp3")} volume={0.45} />
      </Sequence>
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 4} durationInFrames={30}>
          <Audio src={staticFile("sfx2/whoosh.mp3")} volume={0.18} />
        </Sequence>
      ))}
      <Sequence from={at(8, "cantarolando") - 2} durationInFrames={L(10) - at(8, "cantarolando")}>
        <Audio src={staticFile("sfx3/hum.mp3")} volume={0.5} loop />
      </Sequence>
      <Sequence from={at(9, "estourou")} durationInFrames={90}>
        <Audio src={staticFile("sfx3/glass.mp3")} volume={0.9} />
      </Sequence>
      <Sequence from={at(10, "balanco") - 4} durationInFrames={L(11) - at(10, "balanco")}>
        <Audio src={staticFile("sfx3/swing.mp3")} volume={0.35} loop />
      </Sequence>
      <Sequence from={at(11, "acerta")} durationInFrames={at(11, "aguentar") - at(11, "acerta") + 4}>
        <Audio src={staticFile("sfx3/ring.mp3")} volume={(fr) => 0.2 + 0.5 * clamp(fr / 60)} loop />
      </Sequence>
      <Sequence from={at(11, "aguentar") + 4} durationInFrames={60}>
        <Audio src={staticFile("sfx3/glass.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={L(12) - 3} durationInFrames={L(13) - L(12)}>
        <Audio src={staticFile("sfx3/hum.mp3")} volume={0.45} loop />
      </Sequence>
      <Sequence from={at(13, "era") - 3} durationInFrames={L(19) - at(13, "era")}>
        <Audio src={staticFile("sfx3/ticking.mp3")} volume={(fr) => {
          const g = fr + at(13, "era") - 3;
          return g >= L(15) - 3 && g < L(17) - 3 ? 0.08 : 0.3;
        }} loop />
      </Sequence>
      <Sequence from={at(14, "trancou") - 2} durationInFrames={60}>
        <Audio src={staticFile("sfx3/lock.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={at(17, "primeira")} durationInFrames={90}>
        <Audio src={staticFile("sfx3/fork.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={L(18) - 3} durationInFrames={at(18, "parou") - L(18) + 3}>
        <Audio src={staticFile("sfx3/ring.mp3")} volume={0.35} loop />
      </Sequence>
      <Sequence from={at(18, "parou") + 60} durationInFrames={L(19) - at(18, "parou") - 60}>
        <Audio src={staticFile("sfx3/ring.mp3")} volume={0.35} loop />
      </Sequence>
      <Sequence from={L(19) - 3} durationInFrames={TOTAL_BHAM - L(19)}>
        <Audio src={staticFile("sfx3/crowd.mp3")} volume={0.25} loop />
      </Sequence>
      <Sequence from={at(19, "sino") - 2} durationInFrames={TOTAL_BHAM - at(19, "sino")}>
        <Audio src={staticFile("sfx3/bell.mp3")} volume={(fr) => 0.25 + 0.35 * clamp(fr / 150)} loop />
      </Sequence>
      <Sequence from={L(20) - 3} durationInFrames={L(21) - L(20)}>
        <Audio src={staticFile("sfx3/hum.mp3")} volume={0.4} loop />
      </Sequence>
      <Sequence from={at(20, "rachar")} durationInFrames={60}>
        <Audio src={staticFile("sfx3/crack.mp3")} volume={0.8} />
      </Sequence>
    </AbsoluteFill>
  );
};
