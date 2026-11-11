import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {Boy, Pose, Look} from "./Boy";
import {Steam} from "./Fire";
import {Post} from "./Post";
import {physics} from "./Physics";
import {Cam, TitleTag, Flash, fontFamily} from "./Video";
import {RioStreet, MedRoom, ShipDeck, Snowfield, SnowLights, Snowfall, Truck, Plane} from "./Sets2";
import {InteriorLights} from "./Sets";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import W from "./timingGuerra.json";

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
export const TOTAL_GUERRA = F(words[words.length - 1].e + 1.6);

/* ---------- personagens ---------- */
const DAVI_CIVIL: Look = {skin: "#b77b4e", hair: "#17110c", hairStyle: "short", shirt: "#f1efe8", trim: "#c9c4b5", pants: "#34507a", shorts: true, slim: 0.8};
const DAVI: Look = {skin: "#b77b4e", hair: "#17110c", hairStyle: "short", shirt: "#5b6b3a", trim: "#4a5830", pants: "#4f5a35", coat: "#55633a", helmet: "#4d5a32", slim: 0.85};
const ECO: Look = {...DAVI, helmetEar: true};
const TIAO_RIO: Look = {skin: "#7a4a2a", hair: "#111", hairStyle: "short", shirt: "#5b6b3a", trim: "#4a5830", pants: "#4f5a35", helmet: "#4d5a32", mustache: "#141414"};
const TIAO: Look = {...TIAO_RIO, coat: "#55633a"};
const MEDICO: Look = {skin: "#e8b48a", hairStyle: "bald", hair: "#cfcfcf", glasses: true, coat: "#f4f4f4", shirt: "#ddd", pants: "#555"};
const RECRUTAS: Look[] = [
  {shirt: "#8fb4d9", pants: "#3a3a3a", hair: "#3a2a1a", hairStyle: "short", skin: "#d9a070"},
  {shirt: "#d9c58f", pants: "#5a4a3a", hair: "#111", hairStyle: "short", skin: "#8d5a3a"},
  {shirt: "#c98f8f", pants: "#333", hair: "#6a4a2a", hairStyle: "short", skin: "#e8b48a"},
  {shirt: "#9fc79a", pants: "#3a3a48", hair: "#2a1a10", hairStyle: "short", skin: "#c68a5a"},
];
const SOLDADOS: Look[] = [
  {...TIAO, mustache: undefined, skin: "#e0a878"},
  {...TIAO, mustache: undefined, skin: "#8d5a3a"},
  {...TIAO, mustache: undefined, skin: "#c68a5a"},
  {...TIAO, mustache: undefined, skin: "#f0c090"},
];
const PATRULHA: Look = {skin: "#9a8a80", hair: "#111", hairStyle: "short", shirt: "#2a2c30", pants: "#2a2c30", coat: "#26282c", helmet: "#3a3d40"};

/* ---------- utilidades de pose ---------- */
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const kick = (f: number, a: number, len = 6) => (f < a ? 0 : Math.exp(-(f - a) / len));
const hop = (f: number, a: number, b: number, h: number) => {
  const x = (f - a) / (b - a);
  return x <= 0 || x >= 1 ? 0 : 4 * h * x * (1 - x);
};
const shiverP = (f: number): Pose => ({
  rShoulder: [-0.75, 0, 0.42],
  lShoulder: [-0.75, 0, -0.42],
  rElbow: -1.8,
  lElbow: -1.8,
  torso: [0.05, 0, Math.sin(f * 2.6) * 0.025],
  head: [0.08, 0, Math.sin(f * 2.6 + 1) * 0.035],
});
const walkP = (f: number, a: number, rate = 1.5): Pose => {
  const ph = ((f - a) / FPS) * Math.PI * 2 * rate;
  return {walk: ph, walkAmt: 1, rShoulder: [Math.sin(ph) * 0.35, 0, -0.1], lShoulder: [-Math.sin(ph) * 0.35, 0, 0.1], rElbow: -0.35, lElbow: -0.35};
};
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
/** dentro da trincheira: corpo mais baixo, atrás dos sacos de areia */
const TR = -0.42;

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Rio: React.FC = () => (
  <>
    <color attach="background" args={["#9fd0ff"]} />
    <hemisphereLight args={["#e8f4ff", "#8a7a5a", 0.9]} />
    <directionalLight position={[4, 7, 4]} intensity={3.0} color="#fff3dc" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-bias={-0.0004} shadow-normalBias={0.02} />
    <RioStreet />
  </>
);
const Snow: React.FC<{v: "day" | "night" | "dawn"; trench?: boolean; t: number; fall?: number; fog?: [number, number]; center?: V3}> = ({v, trench, t, fall = 0, fog, center = [0, 0, 0]}) => {
  const fogCol = v === "night" ? "#0d1626" : v === "dawn" ? "#6a5a7a" : "#d8dee6";
  return (
    <>
      <color attach="background" args={[fogCol]} />
      <fog attach="fog" args={[fogCol, fog?.[0] ?? 4, fog?.[1] ?? 18]} />
      <SnowLights variant={v} />
      <Snowfield variant={v} trench={trench} />
      {fall > 0 && <Snowfall t={t} center={center} count={Math.round(300 + 900 * fall)} speed={0.6 + 0.8 * fall} size={0.03 + 0.02 * fall} wind={0.3 + fall} />}
    </>
  );
};

/* 0 — caiu no Rio de 1944 */
const S0: React.FC<ShotProps> = ({f, a, b}) => {
  const land = a + 12;
  const y = f < land ? lerp(3.5, 0, ((f - a) / (land - a)) ** 2) : 0;
  const pose = physics("g0", (fr) => {
    const look = ramp(fr, land + 15, land + 40, easeInOut);
    return idle(fr, {pos: [0, fr < land ? lerp(3.5, 0, ((fr - a) / (land - a)) ** 2) : 0, 0], squash: 0.2 * kick(fr, land, 5), eyeWide: 0.8, brow: 0.8, mouthOpen: 0.4 * kick(fr, land, 20), head: [-0.1, lerp(0, Math.sin(fr / 14) * 0.6, look), 0], rShoulder: [0, 0, -0.5 + 0.4 * kick(fr, land, 8)], lShoulder: [0, 0, 0.5 - 0.4 * kick(fr, land, 8)], pupil: [Math.sin(fr / 14) * 0.6, 0.2]});
  }, a, f);
  const p = ramp(f, a, b, easeInOut);
  const sh = shake(f, 0.03 * kick(f, land, 5));
  return (
    <>
      <Cam pos={[lerp(0.6, 0.2, p) + sh[0], 1.35 + sh[1], lerp(3.6, 2.9, p)]} look={[0, 1.05, 0]} fov={42} />
      <Rio />
      <Boy pose={pose} look={DAVI_CIVIL} />
      {f >= land && <Steam t={(f - land) / FPS} origin={[0, 0.05, 0]} count={10} spread={0.4} rise={0.3} size={0.5} power={Math.max(0, 1 - (f - land) / 25)} color="#d9cdb8" seed={2} life={1} />}
      {y > 0.1 && null}
    </>
  );
};

/* 1 — fila da FEB, o mais magro */
const S1: React.FC<ShotProps> = ({f, a, b}) => {
  const p = ramp(f, a, b, easeInOut);
  const cx = lerp(1.4, -1.75, p);
  const xs = [1.3, 0.6, -0.1, -0.8];
  return (
    <>
      <Cam pos={[cx, 1.45, 2.1]} look={[cx - 0.15, 1.1, -1.0]} fov={42} />
      <Rio />
      {xs.map((x, i) => (
        <Boy key={i} look={RECRUTAS[i]} pose={idle(f + i * 13, {pos: [x, 0, -1.0], rotY: Math.PI / 2, head: [0, Math.sin((f + i * 20) / 30) * 0.2, 0], rShoulder: [0, 0, -0.1], lShoulder: [0, 0, 0.1]})} />
      ))}
      <Boy look={DAVI_CIVIL} pose={idle(f, {pos: [-1.55, 0, -1.0], rotY: Math.PI / 2 - 0.4, head: [0, -0.3, 0], smile: 0.4, pupil: [-0.5, 0]})} />
      <Boy look={TIAO_RIO} pose={idle(f + 40, {pos: [2.2, 0, -2.2], rotY: -0.3})} />
    </>
  );
};

/* 2 — exame médico: inapto */
const S2: React.FC<ShotProps> = ({f, a}) => {
  const st = at(2, "inapto");
  const doc = physics("g2d", (fr) => {
    const up = ramp(fr, st - 14, st - 4, easeOut) * (1 - ramp(fr, st - 2, st + 1));
    return idle(fr, {pos: [0.95, 0, -0.75], rotY: -1.2, rShoulder: [-0.5 - 1.6 * up, 0, -0.1], rElbow: -0.8 + 0.4 * up, rFist: 1, head: [0.15, 0.3, 0], brow: -0.3, mouthOpen: talk(fr, a, a + 10)});
  }, a, f);
  const sad = ramp(f, st, st + 10);
  const davi = idle(f, {pos: [-0.45, 0.1, -1.6], rotY: 0.5, head: [0.25 * sad, 0.2, 0], brow: lerp(0.4, 0.9, sad), smile: lerp(0.5, 0, sad), mouthOpen: 0.2 * sad, pupil: [0.4, -0.3 * sad]});
  return (
    <>
      <Cam pos={[0.3 + shake(f, 0.02 * kick(f, st, 4))[0], 1.5, 2.2]} look={[0.25, 1.1, -1.2]} fov={48} />
      <color attach="background" args={["#223"]} />
      <InteriorLights color="#fff5e0" />
      <MedRoom />
      <Boy look={MEDICO} pose={doc} />
      <Boy look={DAVI_CIVIL} pose={davi} />
    </>
  );
};

/* caminhão e recrutas (cenas 3–6) */
const TRUCK_P: V3 = [-2.4, 0, -1.6];
const crateAt = (f: number) => {
  const d = at(5, "despencou") - 2;
  if (f < d) return {y: 0, x: 0, rx: 0, show: true};
  const k = (f - d) / 13;
  if (k >= 1) return {y: -1.72, x: -1.35, rx: 0.4, show: true};
  return {y: -1.72 * k * k, x: -1.35 * Math.min(1, k * 1.6), rx: 0.4 * k, show: true};
};

/* 3 — volta e volta; o sargento Tião pergunta */
const S3: React.FC<ShotProps> = ({f, a, b}) => {
  const ask = at(3, "por");
  const tiao = idle(f, {pos: [0.9, 0, -0.5], rotY: -1.06, rShoulder: [-0.75, 0, 0.42], lShoulder: [-0.75, 0, -0.42], rElbow: -1.8, lElbow: -1.8, brow: -0.4, mouthOpen: talk(f, ask, at(3, "insiste") + 10), head: [0.1, 0, 0]});
  const davi = idle(f, {pos: [0, 0, 0], rotY: 1.6, smile: 0.5, pupil: [0.6, 0.3], head: [-0.1, 0, 0]});
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-0.2, 0.1, p), 1.45, lerp(2.7, 2.3, p)]} look={[0.45, 1.25, -0.3]} fov={42} />
      <Rio />
      <Truck p={TRUCK_P} ry={Math.PI / 2} crate={crateAt(f)} />
      <Boy look={TIAO_RIO} pose={tiao} />
      <Boy look={DAVI_CIVIL} pose={davi} />
      <Boy look={RECRUTAS[0]} pose={idle(f, {pos: [-3.1, 0, -0.3], rotY: 0.3})} />
      <Boy look={RECRUTAS[1]} pose={idle(f + 30, {pos: [-2.55, 0, -0.35], rotY: -0.2})} />
    </>
  );
};

/* 4/5 — "sai daí!", empurra, o caixote despenca */
const S4: React.FC<ShotProps> = ({f, a, b, t}) => {
  const sai = at(4, "sai");
  const push = at(4, "empurrou");
  const davi = physics("g4", (fr) => {
    const run = ramp(fr, sai + 6, push, easeInOut);
    const pp = ramp(fr, push, push + 4, easeOut);
    return idle(fr, {
      ...walkP(fr, sai, 2.6),
      walkAmt: run > 0 && run < 1 ? 1.4 : 0,
      pos: [lerp(0, -2.45, run), 0, lerp(0, 0.15, run)],
      rotY: lerp(0.75, -Math.PI / 2, ramp(fr, sai, sai + 6)),
      torso: [0.3 * run, 0, 0],
      rShoulder: [lerp(0, -1.5, pp), 0, -0.2],
      lShoulder: [lerp(0, -1.5, pp), 0, 0.2],
      rElbow: lerp(-0.6, -0.1, pp),
      lElbow: lerp(-0.6, -0.1, pp),
      mouthOpen: fr >= sai && fr < sai + 20 ? 1 : 0.3,
      eyeWide: 1,
      brow: 1,
    });
  }, a, f);
  const fall = (i: number) => {
    const k = ramp(f, push + 2, push + 12, easeOut);
    return idle(f, {pos: [lerp(i ? -2.55 : -3.1, i ? -2.3 : -3.0, k), hop(f, push + 2, push + 12, 0.15), lerp(-0.3, 0.7, k)], rotY: i ? -0.2 : 0.3, torso: [-1.0 * k, 0, 0], legLift: 0.8 * k, eyeWide: k, mouthOpen: 0.6 * k, rShoulder: [0, 0, -1.2 * k], lShoulder: [0, 0, 1.2 * k]});
  };
  const cr = crateAt(f);
  const landF = at(5, "despencou") + 11;
  const p = ramp(f, a, b, easeInOut);
  const sh = shake(f, 0.035 * kick(f, landF, 6));
  return (
    <>
      <Cam pos={[lerp(-0.4, -1.0, p) + sh[0], lerp(1.5, 1.1, p) + sh[1], lerp(3.2, 2.8, p)]} look={[-2.4, 0.9, -0.5]} fov={44} />
      <Rio />
      <Truck p={TRUCK_P} ry={Math.PI / 2} crate={cr} />
      <Boy look={TIAO_RIO} pose={idle(f, {pos: [0.9, 0, -0.5], rotY: -1.6, eyeWide: ramp(f, landF, landF + 6), brow: ramp(f, landF, landF + 6)})} />
      <Boy look={DAVI_CIVIL} pose={davi} />
      <Boy look={RECRUTAS[0]} pose={fall(0)} />
      <Boy look={RECRUTAS[1]} pose={fall(1)} />
      {f >= landF && <Steam t={(f - landF) / FPS} origin={[-3.15, 0.1, -0.25]} count={16} spread={0.5} rise={0.6} size={0.7} power={Math.max(0, 1 - (f - landF) / 40)} color="#d9cdb8" seed={5} life={1.3} />}
    </>
  );
};

/* 6 — o Tião rasga o carimbo */
const S6: React.FC<ShotProps> = ({f, a, b}) => {
  const rip = at(6, "rasgou");
  const k = ramp(f, rip, rip + 8, easeOut);
  const tiao = physics("g6", (fr) => idle(fr, {pos: [0.35, 0, -0.2], rotY: -0.95, rShoulder: [-1.1, 0.4 * ramp(fr, rip, rip + 8), -0.1], lShoulder: [-1.1, -0.4 * ramp(fr, rip, rip + 8), 0.1], rElbow: -0.8, lElbow: -0.8, smile: 0.4 * ramp(fr, rip + 6, rip + 14), head: [0.15, 0, 0]}), a, f);
  const davi = idle(f, {pos: [-0.35, 0, 0.3], rotY: 2.19, smile: lerp(0.2, 1, ramp(f, rip + 4, rip + 12)), eyeWide: 0.6 * ramp(f, rip, rip + 6), pupil: [0.5, -0.2]});
  const paper = useMemo(() => new THREE.MeshStandardMaterial({color: "#fbf6e8", roughness: 0.9, side: THREE.DoubleSide}), []);
  const red = useMemo(() => new THREE.MeshBasicMaterial({color: "#c0201a", side: THREE.DoubleSide}), []);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-0.75, -0.6, p), 1.45, lerp(1.7, 1.4, p)]} look={[0.15, 1.25, -0.1]} fov={42} />
      <Rio />
      <Boy look={TIAO_RIO} pose={tiao} />
      <Boy look={DAVI_CIVIL} pose={davi} />
      {[-1, 1].map((s) => (
        <group key={s} position={[0.08 + s * 0.12 * k, 1.12 - 0.5 * ramp(f, rip + 10, rip + 30), -0.05 + 0.1 * k]} rotation={[0.3 + k * 0.5, -0.8, s * 0.6 * k]}>
          <mesh material={paper}>
            <planeGeometry args={[0.13, 0.26]} />
          </mesh>
          <mesh position={[s * -0.03, 0.02, 0.002]} material={red}>
            <planeGeometry args={[0.08, 0.04]} />
          </mesh>
        </group>
      ))}
    </>
  );
};

/* 7 — navio → Itália, -20 °C */
const S7: React.FC<ShotProps> = ({f, a, b, t}) => {
  const it = at(7, "italia") - 3;
  if (f < it) {
    const p = ramp(f, a, it, easeInOut);
    return (
      <>
        <Cam pos={[lerp(2.5, 2.0, p), 1.7, lerp(4, 2.5, p)]} look={[0, 1.0, -2]} fov={44} />
        <color attach="background" args={["#b8d8f0"]} />
        <hemisphereLight args={["#e8f4ff", "#3a4a5a", 0.9]} />
        <directionalLight position={[4, 7, 4]} intensity={2.4} castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
        <ShipDeck t={t} />
        {[-1.5, -0.5, 0.5, 1.5].map((x, i) => (
          <Boy key={i} look={i === 1 ? DAVI : SOLDADOS[i]} pose={idle(f + i * 9, {pos: [x * 0.9 + 1.5, 0, -1.5 - i * 0.3], rotY: 1.5, head: [0, 0.1 * Math.sin((f + i * 10) / 25), 0]})} />
        ))}
      </>
    );
  }
  const p = ramp(f, it, b, easeInOut);
  const x0 = lerp(-1.0, 0.6, p);
  return (
    <>
      <Cam pos={[x0 + 0.6, 1.35, 2.6]} look={[x0 - 0.2, 1.0, -0.3]} fov={44} />
      <Snow v="day" t={t} fall={0.3} center={[x0, 0, 0]} />
      {[0, 1, 2, 3].map((i) => {
        const look = i === 2 ? DAVI : SOLDADOS[i];
        const pose = idle(f + i * 11, {...walkP(f, it - i * 4, 1.1), pos: [x0 - i * 0.9 + 1.0, 0.02, -0.3 - (i % 2) * 0.4], rotY: Math.PI / 2, ...(i === 2 ? {...shiverP(f), walk: ((f - it) / FPS) * 6.9, walkAmt: 1, brow: 0.7, mouthOpen: 0.15} : {})});
        return <Boy key={i} look={look} pose={pose} />;
      })}
      <Steam t={t} origin={[x0 - 1.8 + 1.0 + 0.25, 1.55, -0.3]} count={5} spread={0.03} rise={0.3} size={0.12} power={0.6} seed={9} life={1} />
    </>
  );
};

/* trincheira à noite: base */
const Trench: React.FC<{f: number; t: number; fall: number; extra?: React.ReactNode; davi: Pose; cam: {pos: V3; look: V3; fov: number}; mates?: boolean; look?: Look}> = ({f, t, fall, extra, davi, cam, mates = true, look = DAVI}) => (
  <>
    <Cam {...cam} />
    <Snow v="night" trench t={t} fall={fall} fog={[2, 10 - 5 * fall]} />
    <Boy look={look} pose={davi} />
    {mates &&
      [-1.4, 1.3].map((x, i) => (
        <Boy key={i} look={SOLDADOS[i]} pose={idle(f + i * 17, {pos: [x, TR, 0.05], rotY: Math.PI + (i ? -0.2 : 0.2), head: [0.15, 0, 0], blink: Math.max(blinkCurve(f + i * 40), 0.5)})} />
      ))}
    <pointLight position={[0.4, 1.5, -1.3]} color="#ffc890" intensity={2.6} distance={4} />
    <pointLight position={[-1.2, 1.6, 1.2]} color="#7f9cff" intensity={1.2} distance={4} />
    {extra}
  </>
);
const FRONT_CAM = (p: number) => ({pos: [lerp(0.6, 0.4, p), 0.95, lerp(-2.3, -2.0, p)] as V3, look: [0, 0.95, 0.1] as V3, fov: 40});

/* 8 — passos na neblina */
const S8: React.FC<ShotProps> = ({f, a, b, t}) => {
  const ps = at(8, "passos");
  const davi = physics("g8", (fr) => idle(fr, {pos: [0, TR, 0.05], rotY: Math.PI, eyeWide: ramp(fr, ps - 4, ps + 4), brow: ramp(fr, ps - 4, ps + 4), head: [0.05, 0.35 * ramp(fr, ps, ps + 10, easeOut), 0.1 * ramp(fr, ps, ps + 10)], pupil: [0.8 * ramp(fr, ps, ps + 6), 0], rShoulder: [-0.6, 0, -0.1], lShoulder: [-0.6, 0, 0.1], rElbow: -0.8, lElbow: -0.8}), a, f);
  return <Trench f={f} t={t} fall={0.2} davi={davi} cam={FRONT_CAM(ramp(f, a, b, easeInOut))} />;
};

/* 9 — close no ouvido */
const S9: React.FC<ShotProps> = ({f, a, b, t}) => {
  const davi = idle(f, {pos: [0, TR, 0.05], rotY: Math.PI, head: [0.05, 0.6, 0.1], blink: 0.6, pupil: [0.8, 0]});
  const p = ramp(f, a, b, easeInOut);
  return <Trench f={f} t={t} fall={0.2} mates={false} davi={davi} cam={{pos: [lerp(-0.8, -0.6, p), 1.2, lerp(-0.5, -0.35, p)], look: [0, 1.18, 0.05], fov: 34}} />;
};

/* 10 — estala a língua e conta o eco (vista por trás, olhando a neblina) */
const S10: React.FC<ShotProps> = ({f, a, b, t}) => {
  const cl = at(10, "estalava");
  const davi = idle(f, {pos: [0, TR, 0.05], rotY: Math.PI, mouthOpen: f >= cl && f < cl + 30 ? 0.3 * Math.abs(Math.sin(f / 2)) : 0, head: [-0.05, 0, 0]});
  const p = ramp(f, a, b, easeInOut);
  return (
    <Trench
      f={f}
      t={t}
      fall={0.2}
      davi={davi}
      cam={{pos: [0.35, 1.45, lerp(1.4, 1.2, p)], look: [0, 1.0, -4], fov: 44}}
      extra={
        <Boy look={PATRULHA} pose={idle(f, {pos: [1.2, 0, -6.5], rotY: 0.2})} />
      }
    />
  );
};

/* 12/13 — neve engolindo o som */
const S12: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[0, lerp(0.9, 0.6, p), 1.4]} look={[0, 0.1, -1]} fov={42} />
      <Snow v="night" t={t} fall={0.9} center={[0, -0.2, 0]} fog={[2, 9]} />
      <pointLight position={[0, 1.2, 0.5]} color="#9db4ff" intensity={1.5} distance={4} />
    </>
  );
};
const S13: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = ramp(f, a, b);
  const davi = idle(f, {pos: [0, TR, 0.05], rotY: Math.PI, brow: 0.6 * k, head: [0.05, Math.sin(f / 10) * 0.25 * k, 0], pupil: [Math.sin(f / 10) * 0.6, 0], rShoulder: [-0.6, 0, 0.3 * k], lShoulder: [-0.6, 0, -0.3 * k], rElbow: -0.8 - 1.0 * k, lElbow: -0.8 - 1.0 * k});
  return <Trench f={f} t={t} fall={0.4 + 0.6 * k} davi={davi} cam={FRONT_CAM(ramp(f, a, b, easeInOut))} />;
};

/* 14 — a patrulha chega perto, para e volta */
const S14: React.FC<ShotProps> = ({f, a, b, t}) => {
  const stop = at(14, "pararam");
  const back = at(14, "voltaram");
  const zAt = (fr: number) => (fr < stop ? lerp(-8, -3.6, ramp(fr, a, stop)) : fr < back ? -3.6 : lerp(-3.6, -8, ramp(fr, back, back + 60)));
  const z = zAt(f);
  const turned = ramp(f, back - 4, back + 6, easeInOut);
  const walking = f < stop || f >= back;
  const davi = idle(f, {pos: [0, TR - 0.15, 0.05], rotY: Math.PI, eyeWide: 1, brow: 1, blink: 0, head: [0.1, 0, 0]});
  return (
    <Trench
      f={f}
      t={t}
      fall={0.85}
      mates={false}
      davi={davi}
      cam={{pos: [0.45, 1.25, 0.85], look: [-0.2, 1.0, -4], fov: 46}}
      extra={
        <>
          {[-0.9, 0.2, 1.2].map((x, i) => (
            <Boy key={i} look={PATRULHA} pose={idle(f + i * 7, {...(walking ? walkP(f, a + i * 5, 1.2) : {}), pos: [x, 0, z - i * 0.5], rotY: lerp(0, Math.PI, turned), head: [0, f >= stop && f < back ? Math.sin((f + i * 10) / 12) * 0.5 : 0, 0]})} />
          ))}
        </>
      }
    />
  );
};

/* 15 — de manhã, treino no vale */
const S15: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  const x = lerp(-1.4, 0.4, p);
  return (
    <>
      <Cam pos={[x + 0.5, 1.4, 3.0]} look={[x, 1.0, -0.6]} fov={44} />
      <Snow v="day" t={t} fall={0.1} />
      <Boy look={TIAO} pose={idle(f, {...walkP(f, a, 1.1), pos: [x + 0.5, 0.02, -0.5], rotY: Math.PI / 2 - 0.3, mouthOpen: talk(f, at(15, "primeira"), at(15, "dura") + 12), head: [0, -0.5, 0]})} />
      <Boy look={DAVI} pose={idle(f + 9, {...walkP(f, a + 4, 1.1), pos: [x - 0.2, 0.02, -0.2], rotY: Math.PI / 2 + 0.2, head: [0, 0.5, 0], pupil: [0.6, 0]})} />
    </>
  );
};

/* 16/17 — orelha na rocha */
const ROCK: V3 = [0.6, 0, -0.6];
const BigRock: React.FC = () => {
  const m = useMemo(() => new THREE.MeshStandardMaterial({color: "#74767b", roughness: 0.95, flatShading: true}), []);
  return (
    <mesh position={[ROCK[0], 0.45, ROCK[2]]} scale={[1.0, 0.75, 0.8]} material={m} castShadow receiveShadow>
      <dodecahedronGeometry args={[0.7, 0]} />
    </mesh>
  );
};
const kneel = (f: number, a: number, k: number): Pose =>
  idle(f, {pos: [lerp(-1.0, -0.62, k), lerp(0, -0.3, k), -0.55], rotY: Math.PI / 2, legLift: -0.55 * k, torso: [0.25 * k, 0, 0], head: [0.1 * k, 0, lerp(0, -0.75, k)], blink: k > 0.9 ? 1 : 0, rShoulder: [0, 0, -0.1], lShoulder: [-0.6 * k, 0, 0.2], lElbow: -1.0 * k});
const S16: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = ramp(f, at(16, "rocha") - 4, at(16, "rocha") + 20, easeInOut);
  const pose = physics("g16", (fr) => kneel(fr, a, ramp(fr, at(16, "rocha") - 4, at(16, "rocha") + 20, easeInOut)), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.2, 0.1, p), 1.3, lerp(2.6, 2.2, p)]} look={[0.2, 0.8, -0.6]} fov={42} />
      <Snow v="day" t={t} fall={0.1} />
      <BigRock />
      <Boy look={DAVI} pose={pose} />
      <Boy look={TIAO} pose={idle(f, {pos: [-1.3, 0.02, -1.3], rotY: 0.7, rShoulder: [-0.75, 0, 0.42], lShoulder: [-0.75, 0, -0.42], rElbow: -1.8, lElbow: -1.8, smile: 0.3 * k})} />
    </>
  );
};
const S17: React.FC<ShotProps> = ({f, a, b, t}) => {
  const z = at(17, "zumbido");
  const pose = idle(f, {...kneel(f, a, 1), blink: f > z ? 0 : 1, eyeWide: ramp(f, z, z + 6), brow: ramp(f, z, z + 6)});
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-0.4, -0.25, p), 0.95, lerp(0.75, 0.55, p)]} look={[0.1, 0.9, -0.55]} fov={38} />
      <Snow v="day" t={t} fall={0.1} />
      <BigRock />
      <Boy look={DAVI} pose={pose} />
    </>
  );
};

/* 18 — Avião! a tropa pula na trincheira, estrondo ao longe */
const S18: React.FC<ShotProps> = ({f, a, b, t}) => {
  const jump = at(18, "pulou");
  const boom = at(18, "estrondo");
  const davi = physics("g18", (fr) => idle(fr, {pos: [0, lerp(0, TR, ramp(fr, jump, jump + 8)), 0.05 + 0.3 * (1 - ramp(fr, jump, jump + 8))], rotY: Math.PI - 0.5, mouthOpen: fr < a + 25 ? 1 : 0.4, eyeWide: 1, brow: 1, rShoulder: [-0.4, 0, -2.4 * (1 - ramp(fr, jump, jump + 6))], lShoulder: [0, 0, 0.3], rElbow: -0.4, head: [-0.3 * (1 - ramp(fr, jump, jump + 6)), 0.3, 0]}), a, f);
  const sh = shake(f, 0.05 * kick(f, boom, 8));
  const planeX = lerp(14, -14, ramp(f, a, b + 30));
  return (
    <>
      <Cam pos={[0.9 + sh[0], 1.2 + sh[1], 1.9]} look={[-0.2, 1.4, -2]} fov={50} />
      <Snow v="day" trench t={t} fall={0.1} fog={[6, 26]} />
      <Plane p={[planeX, 7.5, -12]} ry={Math.PI} />
      <Boy look={DAVI} pose={davi} />
      {[-1.3, -0.7, 0.8, 1.5].map((x, i) => (
        <Boy key={i} look={SOLDADOS[i]} pose={idle(f + i * 5, {pos: [x, lerp(0, TR, ramp(f, jump + i * 2, jump + 8 + i * 2)) + hop(f, jump + i * 2, jump + 8 + i * 2, 0.25), lerp(0.6, 0.05, ramp(f, jump + i * 2, jump + 8 + i * 2))], rotY: Math.PI, rShoulder: [-1.2, 0, -0.3], lShoulder: [-1.2, 0, 0.3], rElbow: -1.6, lElbow: -1.6, head: [0.4, 0, 0]})} />
      ))}
      {f >= boom && <Steam t={(f - boom) / FPS} origin={[-3, 0.5, -9]} count={22} spread={1.2} rise={3} size={2.5} power={Math.max(0, 1 - (f - boom) / 70)} color="#e8ecf0" seed={31} life={2.5} />}
    </>
  );
};

/* 19 — vira o "Eco": orelha pintada no capacete */
const S19: React.FC<ShotProps> = ({f, a, b, t}) => {
  const ear = at(19, "orelha");
  const pat = ramp(f, a + 6, a + 16, easeOut) * (1 - ramp(f, ear - 10, ear));
  const davi = physics("g19", (fr) => idle(fr, {pos: [0, 0.02, 0], rotY: 0.2, smile: 1, squash: 0.06 * kick(fr, a + 16, 5), head: [0, 0, 0.05 * Math.sin(fr / 10)], brow: 0.3}), a, f);
  const p = ramp(f, a, b, easeInOut);
  const closeK = ramp(f, ear - 6, ear + 10, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.9, 0.35, closeK), lerp(1.5, 1.85, closeK), lerp(2.6, 1.2, closeK) - 0.2 * p]} look={[0, lerp(1.25, 1.7, closeK), 0]} fov={40} />
      <Snow v="day" t={t} fall={0.15} />
      <Boy look={f >= ear ? ECO : DAVI} pose={davi} />
      <Boy look={TIAO} pose={idle(f, {pos: [0.6, 0.02, -0.3], rotY: -1.0, rShoulder: [-1.0 * pat - 0.2, 0, -0.9 * pat], rElbow: -0.3, smile: 0.8})} />
      {[-1.0, 1.4].map((x, i) => (
        <Boy key={i} look={SOLDADOS[i + 1]} pose={idle(f + i * 8, {pos: [x, Math.abs(Math.sin((f + i * 5) / 8)) * 0.1 * ramp(f, at(19, "eco"), at(19, "eco") + 5), -0.9], rotY: x < 0 ? 0.6 : -0.6, rShoulder: [0, 0, -2.4 * ramp(f, at(19, "eco"), at(19, "eco") + 5)], lShoulder: [0, 0, 2.4 * ramp(f, at(19, "eco"), at(19, "eco") + 5)], mouthOpen: 0.6 * ramp(f, at(19, "eco"), at(19, "eco") + 5), smile: 1})} />
      ))}
    </>
  );
};

/* 20 — ordem: Monte Castello, madrugada, neve */
const S20: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(2.4, 2.0, p), 1.2, lerp(3.2, 2.6, p)]} look={[0, 1.2, -3]} fov={46} />
      <Snow v="dawn" t={t} fall={0.6} fog={[3, 16]} />
      {[0, 1, 2, 3, 4].map((i) => {
        const z = -0.5 - i * 1.0 - ((f - a) / FPS) * 0.5;
        return <Boy key={i} look={i === 1 ? ECO : SOLDADOS[i % 4]} pose={idle(f + i * 6, {...walkP(f, a + i * 6, 0.9), pos: [Math.sin(i * 1.7) * 0.6, 0.02 + Math.max(0, -z - 4) * 0.08, z], rotY: Math.PI, torso: [0.25, 0, 0]})} />;
      })}
    </>
  );
};

/* 21 — neve que deixa o Davi surdo */
const S21: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = ramp(f, a, b);
  const davi = idle(f, {pos: [0, 0.02, 0], rotY: 0, brow: 0.7, head: [0.1 * k, Math.sin(f / 12) * 0.2, 0], pupil: [Math.sin(f / 12) * 0.5, -0.2], blink: Math.max(blinkCurve(f), 0.2)});
  return (
    <>
      <Cam pos={[0.2, 1.62, lerp(1.4, 1.0, k)]} look={[0, 1.6, 0]} fov={40} />
      <Snow v="dawn" t={t} fall={1} center={[0, 0, 0.5]} fog={[1.5, 7]} />
      <Boy look={ECO} pose={davi} />
    </>
  );
};

/* ---------- lista de planos ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1) - 3, Comp: S1},
  {from: L(2) - 3, Comp: S2},
  {from: L(3) - 3, Comp: S3},
  {from: L(4) - 3, Comp: S4},
  {from: L(6) - 3, Comp: S6},
  {from: L(7) - 3, Comp: S7},
  {from: L(8) - 3, Comp: S8},
  {from: L(9) - 3, Comp: S9},
  {from: L(10) - 3, Comp: S10},
  {from: L(11) - 3, Comp: () => <color attach="background" args={["#08101e"]} />},
  {from: L(12) - 3, Comp: S12},
  {from: L(13) - 3, Comp: S13},
  {from: L(14) - 3, Comp: S14},
  {from: L(15) - 3, Comp: S15},
  {from: L(16) - 3, Comp: S16},
  {from: L(17) - 3, Comp: S17},
  {from: L(18) - 3, Comp: S18},
  {from: L(19) - 3, Comp: S19},
  {from: L(20) - 3, Comp: S20},
  {from: L(21) - 3, Comp: S21},
];
const SPLIT = at(22, "davi") - 8;

const Scene: React.FC<{f: number}> = ({f}) => {
  if (f >= SPLIT) return <color attach="background" args={["#0b1a30"]} />;
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? SPLIT} t={f / FPS} />
      <Post />
    </>
  );
};

/* ---------- tela dividida A/B ---------- */
const PA: React.FC<ShotProps> = ({f, a, t}) => {
  const davi = idle(f, {pos: [0, 0.02, 0], rotY: 0.9, mouthOpen: talk(f, a + 4, a + 200), brow: 0.6, pupil: [0.5, 0.2], rShoulder: [-0.3, 0, -0.4], rElbow: -1.2});
  const tiao = idle(f, {pos: [0.85, 0.02, -0.3], rotY: -2.2, head: [0.12 + 0.08 * Math.sin(f / 10), 0, 0], brow: 0.3, lShoulder: [-1.0, 0, 0.6], lElbow: -0.3});
  return (
    <>
      <Cam pos={[-0.4, 1.5, 2.3]} look={[0.4, 1.35, -0.2]} fov={36} />
      <Snow v="dawn" t={t} fall={0.4} fog={[3, 14]} />
      <Boy look={ECO} pose={davi} />
      <Boy look={TIAO} pose={tiao} />
    </>
  );
};
const PB: React.FC<ShotProps> = ({f, a, t}) => {
  const z = -((f - a) / FPS) * 0.45;
  const davi = idle(f, {...walkP(f, a, 0.9), pos: [0, 0.02, z], rotY: Math.PI - 0.15, torso: [0.25, 0, 0], brow: -0.6, head: [0, 0.4, 0]});
  return (
    <>
      <Cam pos={[0.9, 1.4, z + 2.4]} look={[-0.1, 1.2, z - 1]} fov={40} />
      <Snow v="dawn" t={t} fall={0.9} fog={[2, 12]} center={[0, 0, z]} />
      <Boy look={ECO} pose={davi} />
      {[0, 1].map((i) => (
        <Boy key={i} look={SOLDADOS[i]} pose={idle(f + i * 9, {...walkP(f, a + i * 7, 0.9), pos: [i ? 0.8 : -0.9, 0.02, z - 1.8 - i * 0.6], rotY: Math.PI, torso: [0.25, 0, 0]})} />
      ))}
    </>
  );
};
const PanelScene: React.FC<{C: React.FC<ShotProps>; a: number}> = ({C, a}) => {
  const f = useCurrentFrame();
  return (
    <>
      <C f={f} a={a} b={TOTAL_GUERRA} t={f / FPS} />
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
  const both = f >= at(22, "comenta");
  return (
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, #17375f 0%, #0b1a30 70%)"}}>
      <Panel top={150} letter="A" label="Conta pro Tião" active={both || (f >= at(22, "conta") && f < at(22, "ou") + 2)} C={PA} a={SPLIT} />
      <Panel top={1050} letter="B" label="Vai sem contar" active={both || f >= at(22, "vai", 1)} C={PB} a={SPLIT + 4} />
    </AbsoluteFill>
  );
};

/* ---------- sobreposições 2D ---------- */
const KEY = new Set(["davi", "1944", "segunda", "guerra", "feb", "inapto", "tiao", "caixote", "corda", "rasgou", "italia", "vinte", "zero", "passos", "trezentos", "trinta", "eco", "duzentos", "cinquenta", "morcego", "sonar", "engole", "espuma", "surdo", "dura", "rocha", "quatro", "mil", "zumbido", "aviao", "dez", "ouvido", "monte", "castello", "neve", "conta", "comenta"]);
const STROKE = {WebkitTextStroke: "10px #0a0f18", paintOrder: "stroke fill" as const};

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
  if (i < 0 || f >= at(22, "comenta")) return null;
  const c = chunks[i];
  const sc = pop(f, Math.round(c[0].s * FPS) - 2, 8);
  return (
    <div style={{position: "absolute", top: f >= SPLIT ? 905 : 1250, left: 50, right: 50, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 84, lineHeight: 1.05, textTransform: "uppercase", color: "#fff", ...STROKE, textShadow: "0 8px 18px rgba(0,0,0,0.55)", transform: `scale(${0.85 + 0.15 * sc})`}}>
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

/** carimbo INAPTO batendo na tela */
const Stamp: React.FC<{at: number; to: number}> = ({at: a, to}) => {
  const f = useCurrentFrame();
  if (f < a || f > to) return null;
  const k = ramp(f, a, a + 5, easeOut);
  return (
    <div style={{position: "absolute", top: 520, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{transform: `rotate(-14deg) scale(${lerp(2.2, 1, k)})`, opacity: k, border: "14px solid #d01f1a", borderRadius: 22, padding: "10px 50px", color: "#d01f1a", fontFamily, fontWeight: 900, fontSize: 150, letterSpacing: 12, background: "rgba(255,240,230,0.18)", boxShadow: "0 0 0 6px rgba(208,31,26,0.25)"}}>INAPTO</div>
    </div>
  );
};

/** anéis de som saindo de um ponto */
const Rings: React.FC<{from: number; to: number; x: number; y: number; color?: string; inward?: boolean; label?: string}> = ({from, to, x, y, color = "#8fd3ff", inward, label}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 5), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {[0, 1, 2, 3].map((i) => {
        const k = (((f - from) / 22 + i / 4) % 1);
        const r = inward ? lerp(520, 30, k) : lerp(20, 520, k);
        return <circle key={i} cx={x} cy={y} r={r} fill="none" stroke={color} strokeWidth={10 * (inward ? k : 1 - k) + 2} opacity={inward ? k : 1 - k} />;
      })}
      {label && (
        <text x={x} y={y - 40} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={70} fill="#fff" stroke="#0a0f18" strokeWidth={10} paintOrder="stroke">
          {label}
        </text>
      )}
    </svg>
  );
};

/** número grande com unidade (velocidade do som etc.) */
const BigStat: React.FC<{from: number; to: number; value: number; unit: string; label: string; top?: number; color?: string}> = ({from, to, value, unit, label, top = 300, color = "#8fd3ff"}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const v = Math.round(value * ramp(f, from, from + 18, easeOut));
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, color: "#fff", ...STROKE, opacity: 1 - ramp(f, to - 6, to), transform: `scale(${pop(f, from, 10)})`}}>
      <div style={{fontSize: 170, color, lineHeight: 1}}>
        {v.toLocaleString("pt-BR")}
        <span style={{fontSize: 80}}> {unit}</span>
      </div>
      <div style={{fontSize: 58}}>{label}</div>
    </div>
  );
};

/** diagrama do eco: onda vai até a silhueta e volta, cronômetro, distância */
const Echo: React.FC<{from: number; to: number; dist: number}> = ({from, to, dist}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 6), 1 - ramp(f, to - 6, to));
  const cyc = 45;
  const k = ((f - from) % cyc) / cyc;
  const go = k < 0.5;
  const px = go ? lerp(200, 880, k * 2) : lerp(880, 200, (k - 0.5) * 2);
  const secs = Math.min(1.5, ((f - from) / cyc) * 1.5);
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      <rect x={60} y={260} width={960} height={520} rx={30} fill="rgba(8,16,30,0.72)" stroke="#8fd3ff" strokeWidth={5} />
      <circle cx={200} cy={560} r={46} fill="#ffd21f" />
      <text x={200} y={660} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={44} fill="#fff">DAVI</text>
      <rect x={850} y={470} width={60} height={160} rx={20} fill="#556" />
      <circle cx={880} cy={445} r={30} fill="#556" />
      <text x={880} y={680} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={44} fill="#fff">???</text>
      <line x1={250} y1={720} x2={830} y2={720} stroke="#fff" strokeWidth={4} strokeDasharray="14 10" />
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${px + (go ? -i * 26 : i * 26)} 490 q ${go ? 30 : -30} 70 0 140`} fill="none" stroke={go ? "#8fd3ff" : "#ffd21f"} strokeWidth={9 - i * 2.5} opacity={1 - i * 0.3} />
      ))}
      <text x={540} y={340} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={70} fill="#ffd21f" stroke="#0a0f18" strokeWidth={8} paintOrder="stroke">
        {secs.toFixed(1).replace(".", ",")} s
      </text>
      {f >= dist && (
        <text x={540} y={760} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={64} fill="#fff" stroke="#0a0f18" strokeWidth={8} paintOrder="stroke">
          ≈ 250 METROS
        </text>
      )}
    </svg>
  );
};

/** morcego e sonar */
const BatSonar: React.FC<{from: number; to: number; sonar: number}> = ({from, to, sonar}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const isSonar = f >= sonar;
  const k = ((f - from) % 24) / 24;
  return (
    <AbsoluteFill style={{background: isSonar ? "linear-gradient(#9fd0ff 0%, #9fd0ff 38%, #12406a 38%, #061a30 100%)" : "radial-gradient(circle at 50% 40%, #1c2b4a, #050a14 75%)"}}>
      <svg width={1080} height={1920}>
        {!isSonar ? (
          <g transform={`translate(380,700) scale(${1 + 0.04 * Math.sin(f / 3)})`}>
            <path d="M0 0 C -60 -50 -140 -40 -200 0 C -150 0 -120 30 -90 50 C -60 20 -30 30 0 40 C 30 30 60 20 90 50 C 120 30 150 0 200 0 C 140 -40 60 -50 0 0 Z" fill="#111" stroke="#9db4ff" strokeWidth={4} />
            <circle cx={-12} cy={-6} r={6} fill="#ffd21f" />
            <circle cx={12} cy={-6} r={6} fill="#ffd21f" />
            {[0, 1, 2].map((i) => {
              const kk = (k + i / 3) % 1;
              return <path key={i} d={`M ${220 + kk * 300} -${60 + kk * 80} q ${50 + kk * 40} ${60 + kk * 80} 0 ${120 + kk * 160}`} fill="none" stroke="#8fd3ff" strokeWidth={10 * (1 - kk) + 2} opacity={1 - kk} />;
            })}
            <circle cx={720} cy={0} r={18} fill="#c9a0ff" />
          </g>
        ) : (
          <g>
            <path d="M 180 700 L 900 700 L 840 790 L 240 790 Z" fill="#3a4550" />
            <rect x={420} y={630} width={220} height={70} fill="#4e5a63" />
            <rect x={500} y={570} width={40} height={60} fill="#3a3f45" />
            {[0, 1, 2].map((i) => {
              const kk = (k + i / 3) % 1;
              return <path key={i} d={`M ${400 - kk * 200} ${830 + kk * 500} q ${140 + kk * 200} ${90 + kk * 120} ${280 + kk * 400} 0`} fill="none" stroke="#8fd3ff" strokeWidth={10 * (1 - kk) + 2} opacity={1 - kk} />;
            })}
            <path d="M 700 1500 q 80 -50 160 0 q -80 50 -160 0 Z" fill="#223" />
          </g>
        )}
        <text x={540} y={420} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={110} fill="#ffd21f" stroke="#0a0f18" strokeWidth={12} paintOrder="stroke">
          {isSonar ? "SONAR" : "MORCEGO"}
        </text>
      </svg>
    </AbsoluteFill>
  );
};

/** ondas entrando na neve e sumindo */
const SnowEats: React.FC<{from: number; to: number; label: number}> = ({from, to, label}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 6), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {[0, 1, 2, 3].map((i) => {
        const k = (((f - from) / 30 + i / 4) % 1);
        const y = lerp(380, 1000, k);
        return <path key={i} d={`M 220 ${y} q 160 -50 320 0 t 320 0`} fill="none" stroke="#8fd3ff" strokeWidth={10} opacity={y < 800 ? 0.9 : Math.max(0, 1 - (y - 800) / 120)} />;
      })}
      <rect x={0} y={820} width={1080} height={260} fill="rgba(240,246,255,0.55)" />
      {f >= label && (
        <text x={540} y={760} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={66} fill="#fff" stroke="#0a0f18" strokeWidth={10} paintOrder="stroke">
          NEVE = ESPUMA DE ESTÚDIO
        </text>
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
      <div style={{fontFamily, fontWeight: 900, fontSize: 60, color: "#fff", ...STROKE, marginBottom: 12}}>AUDIÇÃO {Math.round(v * 100)}%</div>
      <div style={{height: 56, borderRadius: 28, background: "rgba(10,15,24,0.7)", border: "5px solid #fff", overflow: "hidden"}}>
        <div style={{height: "100%", width: `${v * 100}%`, background: col}} />
      </div>
    </div>
  );
};

/** comparação ar × rocha */
const Compare: React.FC<{from: number; to: number; rock: number}> = ({from, to, rock}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const bar = (label: string, val: number, max: number, a: number, col: string) => {
    const w = 760 * (val / max) * ramp(f, a, a + 16, easeOut);
    return (
      <div style={{marginBottom: 28, opacity: f >= a ? 1 : 0}}>
        <div style={{fontFamily, fontWeight: 900, fontSize: 56, color: "#fff", ...STROKE}}>
          {label} · {Math.round(val * ramp(f, a, a + 16)).toLocaleString("pt-BR")} m/s
        </div>
        <div style={{height: 50, width: Math.max(8, w), borderRadius: 25, background: col, border: "4px solid #fff"}} />
      </div>
    );
  };
  return (
    <div style={{position: "absolute", top: 250, left: 100, opacity: 1 - ramp(f, to - 6, to)}}>
      {bar("AR", 330, 4200, from, "#8fd3ff")}
      {bar("ROCHA", 4000, 4200, rock, "#ffb31a")}
    </div>
  );
};

/** o que ele ouve pela pedra */
const Heard: React.FC<{from: number; to: number; items: {at: number; text: string}[]}> = ({from, to, items}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <div style={{position: "absolute", top: 260, left: 90, opacity: 1 - ramp(f, to - 6, to)}}>
      {items.map((it, i) =>
        f >= it.at ? (
          <div key={i} style={{display: "inline-block", marginBottom: 20, marginRight: 16, transform: `scale(${pop(f, it.at, 8)})`, background: i === items.length - 1 ? "#d01f1a" : "rgba(10,15,24,0.75)", border: "5px solid #fff", borderRadius: 20, padding: "10px 30px", fontFamily, fontWeight: 900, fontSize: 56, color: "#fff"}}>
            {it.text}
          </div>
        ) : null,
      )}
    </div>
  );
};

/** abafado: borra e dessatura a imagem */
const Muffle: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const k13 = f >= L(13) - 3 && f < L(14) - 3 ? ramp(f, at(13, "surdo"), L(14) - 10) * 0.45 : 0;
  const k21 = f >= L(21) - 3 && f < SPLIT ? ramp(f, at(21, "surdo") - 4, at(21, "surdo") + 14) : 0;
  const k = Math.max(k13, k21);
  return <AbsoluteFill style={{filter: k > 0 ? `blur(${k * 8}px) saturate(${1 - 0.7 * k}) brightness(${1 - 0.08 * k})` : undefined}}>{children}</AbsoluteFill>;
};

/** cobra fumando (símbolo da FEB) */
const Cobra: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <svg width={260} height={260} viewBox="0 0 200 200" style={{position: "absolute", top: 420, right: 70, opacity: Math.min(ramp(f, from, from + 6), 1 - ramp(f, to - 6, to)), transform: `scale(${pop(f, from, 10)})`}}>
      <circle cx={100} cy={100} r={92} fill="#f2c94c" stroke="#1f6f3a" strokeWidth={10} />
      <path d="M 50 150 C 40 110 90 120 95 95 C 100 70 60 70 70 50 C 80 35 115 40 120 55" fill="none" stroke="#1f6f3a" strokeWidth={18} strokeLinecap="round" />
      <circle cx={122} cy={58} r={9} fill="#1f6f3a" />
      <path d="M 128 62 L 160 62 L 160 72 L 150 72" fill="none" stroke="#5a3a1a" strokeWidth={8} strokeLinecap="round" />
      {[0, 1, 2].map((i) => {
        const k = ((f / 20 + i / 3) % 1);
        return <circle key={i} cx={162 + k * 10} cy={50 - k * 40} r={5 + k * 8} fill="rgba(255,255,255,0.8)" opacity={1 - k} />;
      })}
    </svg>
  );
};

export const VideoGuerra: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cuts = [...SHOTS.slice(1).map((s) => s.from), SPLIT];
  const wind = [L(7), SPLIT];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <Muffle>
        <ThreeCanvas width={width} height={height} shadows gl={{antialias: false}} dpr={1}>
          <Scene f={f} />
        </ThreeCanvas>
      </Muffle>
      {cuts.map((c) => (f >= c && f < c + 5 ? <AbsoluteFill key={c} style={{background: "#000", opacity: 0.35 * (1 - (f - c) / 5)}} /> : null))}
      <Flash at={0} strength={0.9} />
      <TitleTag text="RIO · 1944" from={at(0, "1944")} to={L(1) - 4} />
      <Chip from={at(0, "segunda")} to={L(1) - 4} text="SEGUNDA GUERRA" bg="#7a1f1a" top={420} size={60} />
      <Chip from={at(1, "feb")} to={L(2) - 4} text="FEB" bg="#1f6f3a" />
      <Cobra from={at(1, "feb")} to={L(2) - 4} />
      <Chip from={at(1, "cinquenta")} to={L(2) - 4} text="50 KG" bg="#555" top={420} />
      <Stamp at={at(2, "inapto")} to={L(3) - 4} />
      <Chip from={at(3, "dia")} to={at(3, "outro") - 1} text="2ª TENTATIVA" bg="#d07a1a" />
      <Chip from={at(3, "outro")} to={L(4) - 4} text="3ª TENTATIVA" bg="#d01f1a" />
      <Rings from={at(5, "corda") - 2} to={L(6) - 4} x={300} y={760} color="#ffd21f" label="ESTALO" />
      <TitleTag text="ITÁLIA · INVERNO" from={at(7, "italia")} to={L(8) - 4} />
      <Chip from={at(7, "vinte")} to={L(8) - 4} text="-20 °C" bg="#2f6fd6" top={420} />
      <Rings from={at(8, "passos") - 2} to={L(9) - 4} x={980} y={900} color="#8fd3ff" inward label="" />
      <BigStat from={at(9, "trezentos")} to={L(10) - 4} value={330} unit="m/s" label="VELOCIDADE DO SOM NO AR" />
      <Echo from={at(10, "estalava")} to={L(11) - 4} dist={at(10, "duzentos")} />
      <BatSonar from={L(11) - 3} to={L(12) - 3} sonar={at(11, "sonar")} />
      <SnowEats from={at(12, "engole") - 4} to={L(13) - 4} label={at(12, "espuma")} />
      <Hearing from={L(13) - 3} to={L(14) - 4} v0={1} v1={0.2} />
      <Compare from={L(16) - 2} to={L(17) - 4} rock={at(16, "rocha")} />
      <Rings from={at(17, "ouviu") - 2} to={L(18) - 4} x={620} y={900} color="#ffd21f" />
      <Heard from={at(17, "caminh")} to={L(18) - 4} items={[{at: at(17, "caminh"), text: "CAMINHÃO · 2 KM"}, {at: at(17, "cavalo"), text: "CAVALO"}, {at: at(17, "zumbido"), text: "ZUMBIDO NO CÉU ???"}]} />
      <Chip from={at(18, "dez")} to={L(19) - 4} text="10 SEGUNDOS ANTES" bg="#d01f1a" />
      <Flash at={at(18, "estrondo")} strength={0.7} />
      <TitleTag text="ECO" from={at(19, "eco")} to={L(20) - 4} />
      <TitleTag text="MONTE CASTELLO" from={at(20, "monte")} to={L(21) - 4} />
      <Chip from={at(21, "surdo")} to={SPLIT - 2} text="AUDIÇÃO 0%" bg="#d01f1a" />
      <Split />
      <Captions />
      <Chip from={at(22, "comenta")} to={TOTAL_GUERRA} text="COMENTA AÍ ↓" bg="#2E9E4F" top={905} />
      <Audio src={staticFile("vozguerra.mp3")} />
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 3} durationInFrames={45}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.1} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={40}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.4} />
      </Sequence>
      <Sequence from={at(2, "inapto")} durationInFrames={20}>
        <Audio src={staticFile("sfx/stamp.wav")} volume={0.8} />
      </Sequence>
      <Sequence from={at(5, "despencou") + 11} durationInFrames={40}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={at(5, "corda") - 2} durationInFrames={10}>
        <Audio src={staticFile("sfx/snap.wav")} volume={0.6} />
      </Sequence>
      {[0, 1, 2].map((i) => (
        <Sequence key={"c" + i} from={at(10, "estalava") + i * 12} durationInFrames={10}>
          <Audio src={staticFile("sfx/snap.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={wind[0]} durationInFrames={wind[1] - wind[0]}>
        <Audio src={staticFile("sfx/wind.wav")} volume={0.1} loop />
      </Sequence>
      <Sequence from={at(17, "zumbido") - 4} durationInFrames={110}>
        <Audio src={staticFile("sfx/plane.wav")} volume={0.35} />
      </Sequence>
      <Sequence from={at(18, "estrondo")} durationInFrames={40}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.6} />
      </Sequence>
    </AbsoluteFill>
  );
};
