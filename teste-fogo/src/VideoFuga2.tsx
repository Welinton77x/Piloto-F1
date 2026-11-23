import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {Pigeon} from "./Sets6";
import {SchoolDesk} from "./Sets7";
import {Chinelo} from "./Sets13";
import {Bg} from "./Sets20";
import {Letter} from "./Sets26";
import {Mochila, Armario, Toupeira, Terra, Panda, Dojo, TapeteMagico, Prova} from "./Sets38";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingFuga2.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_FUGA2 = F(words[words.length - 1].e + 1.2);

/* ---------- personagens ---------- */
const BOY: ToyLook = {hoodie: true};
const NEIGHBORS: ToyLook[] = [
  {shirt: "#e8414f", pants: "#101018", hairStyle: "spiky", hair: "#2a1a10"},
  {shirt: "#2ecc71", pants: "#2e86de", hairStyle: "ponytail", hair: "#5a3a20", lips: "#c0392b"},
  {shirt: "#9b59b6", pants: "#101018", hairStyle: "curly", hair: "#101018"},
  {shirt: "#ff8a1f", pants: "#5a4a3a", hairStyle: "bun", hair: "#d9d9d9"},
  {shirt: "#2e86de", pants: "#ffffff", hairStyle: "mohawk", hair: "#101018"},
  {shirt: "#f06292", pants: "#3a3f4a", hairStyle: "long", hair: "#2a1a10", lips: "#c0392b"},
];

const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const HOLD: Pose = {rShoulder: [-1.0, 0.35, 0.05], rElbow: -1.3};
const SIP: Pose = {rShoulder: [-1.15, 0.12, 0.05], rElbow: -1.8, head: [-0.18, 0, 0]};
const RUN = (t: number, i = 0): Pose => ({walk: t * 16 + i, walkAmt: 1.3, rShoulder: [-0.9 * Math.sin(t * 16 + i), 0, -0.15], rElbow: -1.2, lShoulder: [0.9 * Math.sin(t * 16 + i), 0, 0.15], lElbow: -1.2, torso: [0.25, 0, 0]});

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};
const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 900;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const InHand: React.FC<{palm: React.RefObject<THREE.Object3D | null>; children: React.ReactNode}> = ({palm, children}) => {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    const m = palm.current.matrixWorld.clone();
    const par = g.current.parent;
    if (par) {
      par.updateWorldMatrix(true, false);
      m.premultiply(par.matrixWorld.clone().invert());
    }
    m.decompose(g.current.position, g.current.quaternion, g.current.scale);
  }, -1);
  return <group ref={g}>{children}</group>;
};
const HandToy: React.FC<{pose: Pose; look: ToyLook; headExtra?: React.ReactNode; item: React.ReactNode}> = ({pose, look, headExtra, item}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Toy pose={pose} look={look} palmRef={palm} headExtra={headExtra} />
      <InHand palm={palm}>{item}</InHand>
    </>
  );
};
const KitchenLights: React.FC<{night?: boolean}> = ({night = false}) => (
  <>
    <hemisphereLight args={[night ? "#9fb0ff" : "#fff6e6", "#b08a60", night ? 0.6 : 1.0]} />
    <pointLight position={[0.3, 3.2, 1.6]} intensity={night ? 7 : 10} distance={12} decay={1.4} color="#fff4e0" castShadow />
  </>
);
const DayOut: React.FC<{x?: number; z?: number}> = ({x = 0, z = 0}) => (
  <>
    <Sky />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
    <SunLight target={[x, 1, z]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
  </>
);
/** coração batendo (na frente do peito) */
const Heart: React.FC<{p: V3; s: number}> = ({p, s}) => {
  const m = sm("#e8262d", 0.3, {emissive: "#e8262d", emissiveIntensity: 0.6});
  return (
    <group position={p} scale={s}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.06 * sd, 0.05, 0]} material={m}>
          <sphereGeometry args={[0.08, 14, 10]} />
        </mesh>
      ))}
      <mesh position={[0, -0.05, 0]} rotation={[0, 0, Math.PI]} material={m}>
        <coneGeometry args={[0.135, 0.18, 16]} />
      </mesh>
    </group>
  );
};
/** risquinhos de velocidade atrás de quem corre */
const SpeedLines: React.FC<{p: V3; dir?: number}> = ({p, dir = -1}) => {
  const r = rng(9);
  const ls = Array.from({length: 7}, () => [r() * 2.2, 0.3 + r() * 1.4, (r() - 0.5) * 0.4] as V3);
  return (
    <group position={p}>
      {ls.map((q, i) => (
        <mesh key={i} position={[dir * (0.6 + q[0]), q[1], q[2]]}>
          <boxGeometry args={[0.9 + (i % 3) * 0.4, 0.025, 0.025]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- horários ---------- */
const MOCHILA0 = at(0, "mochila");
const NERD1 = at(1, "nerd");
const TRANCA1 = at(1, "tranca");
const TOUPEIRA3 = at(3, "toupeira");
const CAVA4 = at(4, "cava");
const JAPAO4 = at(4, "japao");
const PANDA6 = at(6, "panda");
const LICAO6 = at(6, "licao");
const POMBO7 = at(7, "pombo-correio");
const MAE7 = at(7, "mae");
const TAPETE9 = at(9, "tapete");
const CHINELO9 = at(9, "chinelo");
const MEDO10 = at(10, "medo");
const FOGE10 = at(10, "foge");
const PROVA12 = at(12, "prova");
const TERRA12 = at(12, "terra");
const SENTADA13 = at(13, "sentada");
const DEZ14 = at(14, "dez");
const PARABENS14 = at(14, "parabens");
const SEGUIR15 = at(15, "seguir");
const DIRETORA15 = at(15, "diretora");

/* ---------- física e utilidades ---------- */
const tf = (fr: number) => fr / FPS;
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode; look?: ToyLook}> = ({id, a, f, pose, item, look = BOY}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={look} item={item} /> : <Toy pose={p} look={look} />;
};
const MAE: ToyLook = {shirt: "#f06292", pants: "#3a3f4a", hairStyle: "bun", hair: "#3a2010", lips: "#c0392b", skin: "#e0b08a", lashes: true};
const DIRETORA: ToyLook = {suit: true, shirt: "#5a2a6a", pants: "#5a2a6a", hairStyle: "bun", hair: "#a0a0a8", lips: "#c0392b", skin: "#f1c8a0", lashes: true};
const DIRTY: ToyLook = {hoodie: true, shirt: "#a8843a", pants: "#5a4a3a"};
const LOCKER: V3 = [1.6, 0, -1.4];
const DESK: V3 = [-0.2, 0, -0.6];
const DESK_TOP = 0.72;

/* sala de aula */
const Sala: React.FC<{hole?: number}> = ({hole = 0}) => (
  <>
    <Bg c="#cfe8f6" />
    <KitchenLights />
    <mesh position={[0, 2, -2.2]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color="#f6e7c0" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#c99a6a" />
    </mesh>
    <mesh position={[-0.6, 2.0, -2.13]} geometry={rbox(2.6, 1.2, 0.05, 0.03)} material={sm("#2e6a4a", 0.8)} />
    <mesh position={[-0.9, 2.2, -2.1]}>
      <planeGeometry args={[1.2, 0.08]} />
      <meshBasicMaterial color="#f2f2ee" />
    </mesh>
    <mesh position={[-0.4, 1.9, -2.1]}>
      <planeGeometry args={[1.6, 0.06]} />
      <meshBasicMaterial color="#f2f2ee" />
    </mesh>
    <SchoolDesk p={DESK} s={1} />
    <SchoolDesk p={[-1.8, 0, -0.9]} s={1} />
    <SchoolDesk p={[1.0, 0, 0.4]} s={1} />
    {hole > 0 && (
      <mesh position={[0.6, 0.012, 0.6]} rotation={[-Math.PI / 2, 0, 0]} scale={hole}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#2a1a10" />
      </mesh>
    )}
  </>
);

/* 0–2 — a mochila nerd se tranca no armário */
const G0: React.FC<ShotProps> = ({f, a, t}) => {
  const alive = f >= NERD1 - 4 ? easeOut(clamp((f - NERD1 + 4) / 10)) : 0;
  const jump = f >= TRANCA1 - 4 ? clamp((f - TRANCA1 + 4) / 18) : 0;
  const open = jump > 0 ? (jump < 0.9 ? 1 : 1 - (jump - 0.9) * 10) : 0;
  const mp: V3 = [lerp(DESK[0], LOCKER[0], jump), DESK_TOP + Math.sin(jump * Math.PI) * 0.8 + jump * 0.2, lerp(DESK[2], LOCKER[2], jump)];
  return (
    <>
      <Cam pos={[0.2, 1.8, 4.8]} look={[0.3, 1.0, -0.8]} fov={56} f={f} a={f >= L(1) ? L(1) : a} />
      <Sala />
      <Armario p={LOCKER} rotY={-0.3} s={1} open={clamp(open)} shake={f >= TRANCA1 + 18 ? 1 : 0} t={t} />
      {jump < 1 && <Mochila p={mp} r={[0, jump * 3, 0]} s={0.8} alive={alive} glasses blink={blinkCurve(f)} mouth={alive > 0 && jump === 0 ? 0.3 + 0.3 * Math.abs(Math.sin(t * 8)) : 0} />}
      <PBoy id="g0" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, hop(fr, TRANCA1 + 18, 12, 0.2), 0.5], rotY: 0.6, ...(fr >= MOCHILA0 && fr < NERD1 ? {lShoulder: [-1.4, -0.2, 0.2], lElbow: -0.3} : fr >= TRANCA1 ? {rShoulder: [-1.6, 0.3, 0], rElbow: -0.1} : {}), eyeWide: fr >= NERD1 ? 1 : 0.4, mouthOpen: fr >= TRANCA1 ? 0.5 : 0, brow: fr >= NERD1 ? 1 : 0})} />
    </>
  );
};
/* 3–4 — a toupeira cava o túnel */
const G3: React.FC<ShotProps> = ({f, a, t}) => {
  const up = clamp((f - TOUPEIRA3 + 4) / 14);
  const dig = f >= CAVA4 ? 1 : 0;
  const sink = f >= CAVA4 + 10 ? clamp((f - CAVA4 - 10) / 20) : 0;
  return (
    <>
      <Cam pos={[0.3, 1.9, 4.4]} look={[0.4, 0.6, 0]} fov={54} f={f} a={a} />
      <Sala hole={up} />
      <Armario p={LOCKER} rotY={-0.3} s={1} t={t} />
      <Toupeira p={[0.6, -0.5 + up * 0.5 - sink * 0.6, 0.6]} rotY={-0.4} s={1.2} t={t} dig={dig} />
      {dig > 0 && <Terra p={[0.6, 0, 0.6]} t={t} k={1} />}
      <PBoy id="g3" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, -sink * 1.6, 0.6], rotY: 0.6, eyeWide: 1, mouthOpen: 0.4, ...(sink > 0 ? ARMS_UP : {})})} />
    </>
  );
};
/* 4–6 — sai no Japão, no meio da aula de kung fu do panda */
const G4: React.FC<ShotProps> = ({f, a, t}) => {
  const pop = easeOut(clamp((f - a) / 16));
  const kick = f >= PANDA6 ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
  return (
    <>
      <Cam pos={[0.2, 1.8, 5.2]} look={[0.2, 1.1, -0.6]} fov={56} f={f} a={f >= L(6) ? L(6) : a} />
      <Bg c="#f4ecd8" />
      <KitchenLights />
      <Dojo />
      <mesh position={[-0.6, 0.012, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.5, 20]} />
        <meshBasicMaterial color="#2a1a10" />
      </mesh>
      {f < a + 40 && <Terra p={[-0.6, 0, 0.6]} t={t} k={1.4} />}
      <Toupeira p={[-0.1, 0, 0.9]} rotY={0.3} s={1.0} t={t} />
      <Panda p={[1.0, 0, -0.6]} rotY={-0.4} s={1.1} t={t} kick={kick} />
      <PBoy id="g4" a={a} f={f} look={DIRTY} pose={(fr) => ({...idle(fr), pos: [-0.6, -1.6 + pop * 1.6 + hop(fr, a + 10, 14, 0.4), 0.6], rotY: 0.4, eyeWide: 1, mouthOpen: 0.5, brow: 1, ...(fr >= LICAO6 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : ARMS_UP)})} />
    </>
  );
};
/* 7–8 — o pombo-correio entrega a carta pra mãe */
const G7: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - POMBO7) / (MAE7 - POMBO7 + 20));
  return (
    <>
      <Cam pos={[0, 2.0, 7.0]} look={[0, 1.6, 0]} fov={56} f={f} a={a} />
      <DayOut />
      <group position={[0, 0, -3]}>
        <Town t={t} galo={false} variant="nova" flat clouds />
      </group>
      <Pigeon p={{pos: [lerp(-3, 0.8, k), 1.6 + Math.sin(k * Math.PI) * 1.2, 0.4], rotY: 1.4, flap: k < 1 ? 1 : 0, flapPh: t * 22, t}} s={1.6} />
      {k < 1 && <Letter p={[lerp(-3, 0.8, k) + 0.18, 1.55 + Math.sin(k * Math.PI) * 1.2, 0.4]} r={[0, 0.5, 0]} s={0.5} />}
      <PBoy id="g7" a={a} f={f} look={MAE} item={k >= 1 ? <Letter p={[0, 0, 0.06]} s={0.5} /> : undefined} pose={(fr) => ({...idle(fr), pos: [1.3, 0, 0.3], rotY: -0.5, ...(k >= 1 ? {rShoulder: [-1.3, 0.4, 0], rElbow: -1.2, brow: -1, eyeWide: 0.8} : {})} as Pose)} />
    </>
  );
};
/* 9–11 — a mãe no tapete mágico com o chinelo; o panda foge */
const G9: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(clamp((f - TAPETE9 + 6) / 30));
  const scared = f >= MEDO10 ? 1 : 0;
  const run = f >= FOGE10 ? clamp((f - FOGE10) / 30) : 0;
  return (
    <>
      <Cam pos={[0.2, 1.9, 5.6]} look={[0.2, 1.3, -0.6]} fov={56} f={f} a={a} />
      <Bg c="#f4ecd8" />
      <KitchenLights />
      <Dojo />
      <TapeteMagico p={[lerp(-4, -0.9, k), 1.0 + Math.sin(t * 3) * 0.1, 0.4]} rotY={0.3} s={1.1} t={t}>
        <PBoy id="g9m" a={a} f={f} look={MAE} item={f >= CHINELO9 - 4 ? <Chinelo p={[0, 0.02, 0.08]} r={[Math.PI / 2, 0, 0]} s={0.6} /> : undefined} pose={(fr) => ({...idle(fr), pos: [0, 0, 0], rotY: 0.6, ...(fr >= CHINELO9 - 4 ? {rShoulder: [-2.6 + 0.4 * Math.sin(tf(fr) * 6), 0.2, -0.2], rElbow: -0.6} : {}), brow: -1, eyeWide: 0.6} as Pose)} />
      </TapeteMagico>
      <Panda p={[1.2 + run * 4, 0, -0.4 + run * 0.5]} rotY={run > 0 ? 1.4 : -0.6} s={1.1} t={t} scared={scared} run={run > 0 ? 1 : 0} />
      <PBoy id="g9" a={a} f={f} look={DIRTY} pose={(fr) => ({...idle(fr), pos: [0.2, 0, 0.9], rotY: -0.3, eyeWide: 1, mouthOpen: 0.3, brow: 1})} />
    </>
  );
};
/* 12–14 — de volta na prova, sujo de terra; a mochila fazendo a prova e tirando 10 */
const G12: React.FC<ShotProps> = ({f, a, t}) => {
  const pop = easeOut(clamp((f - PROVA12 + 6) / 16));
  const bag = f >= SENTADA13 - 4;
  return (
    <>
      <Cam pos={bag ? [0.2, 1.7, 4.3] : [0.2, 1.8, 4.8]} look={bag ? [-0.2, 0.9, -0.6] : [0.3, 0.9, -0.2]} fov={54} f={f} a={bag ? SENTADA13 - 4 : a} />
      <Sala hole={1} />
      <Armario p={LOCKER} rotY={-0.3} s={1} open={1} t={t} />
      {f < PROVA12 + 40 && <Terra p={[0.6, 0, 0.6]} t={t} k={1.2} />}
      <Prova p={[DESK[0], DESK_TOP + 0.02, DESK[2] + 0.05]} s={1.2} nota={f >= DEZ14} />
      <Mochila p={[DESK[0], DESK_TOP - 0.25, DESK[2] - 0.45]} s={0.8} alive={1} glasses blink={blinkCurve(f)} mouth={f >= DEZ14 ? 0.6 : 0.1} />
      <mesh position={[DESK[0] + 0.12, DESK_TOP + 0.08, DESK[2] + 0.02]} rotation={[0, 0, 0.6 + Math.sin(t * 12) * 0.2]} material={sm("#ffd21f", 0.5)}>
        <cylinderGeometry args={[0.015, 0.015, 0.22, 6]} />
      </mesh>
      <PBoy id="g12" a={a} f={f} look={DIRTY} pose={(fr) => ({...idle(fr), pos: [0.75, -1.6 + pop * 1.6 + hop(fr, PROVA12 + 8, 14, 0.3), 0.4], rotY: -0.6, eyeWide: 1, mouthOpen: 0.5, brow: 1, ...(fr >= DEZ14 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : {})})} />
    </>
  );
};
/* 15 — a mochila conta tudo pra diretora */
const G15: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.6, 3.6]} look={[0, 1.1, -0.4]} fov={54} f={f} a={a} />
    <Sala hole={1} />
    <Mochila p={[0.1, 1.15, 0]} r={[0, -0.6, 0]} s={0.8} alive={1} glasses blink={blinkCurve(f)} mouth={0.3 + 0.4 * Math.abs(Math.sin(t * 9))} />
    <PBoy id="g15d" a={a} f={f} look={DIRETORA} pose={(fr) => ({...idle(fr), pos: [-0.5, 0, -0.2], rotY: 0.6, rShoulder: [-1.2, 0.5, 0], rElbow: -1.0, brow: fr >= DIRETORA15 ? -1 : 0, eyeWide: 0.6, head: [0.1, -0.3, 0]})} />
    <PBoy id="g15" a={a} f={f} look={DIRTY} pose={(fr) => ({...idle(fr), pos: [0.85, 0, 0.2], rotY: -0.6, eyeWide: 1, mouthOpen: 0.6, brow: 1, rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1})} />
  </>
);

const SHOTS: Shot[] = [
  {from: 0, Comp: G0},
  {from: L(3), Comp: G3},
  {from: JAPAO4 - 18, Comp: G4},
  {from: L(7), Comp: G7},
  {from: L(9), Comp: G9},
  {from: L(12), Comp: G12},
  {from: L(15), Comp: G15},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_FUGA2} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["fugir", "escola", "mochila", "nerd", "matematica", "armario", "ziper", "sequestro", "escolar", "toupeira", "tunel", "mundo", "kung", "fu", "japao", "escavacao", "intercontinental", "mestre", "panda", "licao", "japones", "pombo-correio", "carta", "mae", "deduro", "voador", "tapete", "magico", "pantufa", "chinelo", "medo", "foge", "fuga", "pandastica", "prova", "terra", "carteira", "parabens", "dez", "seguir", "diretora"]);
const Tag: React.FC<{from: number; to: number; text: string; x?: number; y?: number}> = ({from, to, text, x = 540, y = 420}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 8) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: "#ffffff", color: "#101018", fontFamily, fontWeight: 900, fontSize: 54, padding: "12px 28px", borderRadius: 40, boxShadow: "0 4px 0 rgba(0,0,0,0.25)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 10}}>
      <span style={{width: 18, height: 18, borderRadius: 9, background: "#101018", display: "inline-block"}} />
      {text}
    </div>
  );
};
const Ono: React.FC<{from: number; to: number; text: string; x?: number; y?: number; size?: number; color?: string; rot?: number}> = ({from, to, text, x = 540, y = 460, size = 150, color = "#ffd21f", rot = -8}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${rot}deg)`, fontFamily, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap", letterSpacing: 2}}>
      {text}
    </div>
  );
};
const BigNum: React.FC<{from: number; to: number; text: string; y?: number; size?: number}> = ({from, to, text, y = 420, size = 140}) => <Ono from={from} to={to} text={text} x={540} y={y} size={size} color="#ffffff" rot={-3} />;
const Bubble: React.FC<{from: number; to: number; text: string; x?: number; y?: number; size?: number}> = ({from, to, text, x = 540, y = 420, size = 50}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: "#ffffff", color: "#101018", fontFamily, fontWeight: 900, fontSize: size, padding: "18px 30px", borderRadius: 34, border: "6px solid #101018", whiteSpace: "nowrap", textAlign: "center"}}>
      {text}
      <div style={{position: "absolute", left: "45%", bottom: -34, width: 0, height: 0, borderLeft: "20px solid transparent", borderRight: "20px solid transparent", borderTop: "34px solid #101018"}} />
    </div>
  );
};
const FastFwd: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = (f - from) * 0.9;
  return (
    <>
      <div style={{position: "absolute", left: 760, top: 300, fontSize: 110, fontFamily, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill"}}>⏩</div>
      <Ono from={from} to={to} text={text} x={540} y={540} size={110} color="#ffffff" rot={-3} />
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <g transform="translate(260,370)">
          <circle r={85} fill="#ffffff" stroke="#101018" strokeWidth={12} />
          <line x1={0} y1={0} x2={55 * Math.sin(a)} y2={-55 * Math.cos(a)} stroke="#101018" strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={0} x2={36 * Math.sin(a / 12)} y2={-36 * Math.cos(a / 12)} stroke="#e8262d" strokeWidth={12} strokeLinecap="round" />
        </g>
      </svg>
    </>
  );
};
const HANDLE = "@e.naoepossivel";
const FollowCard: React.FC<{from: number; to: number; tap: number}> = ({from, to, tap}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 12) * (1 - ramp(f, to - 8, to));
  const done = f >= tap + 2;
  const press = 1 - 0.1 * Math.sin(clamp((f - tap + 3) / 6) * Math.PI);
  return (
    <div style={{position: "absolute", left: 230, top: 1540, width: 620, height: 140, transform: `scale(${s})`, transformOrigin: "50% 50%"}}>
      <div style={{position: "absolute", inset: 0, background: "#ffffff", borderRadius: 34, boxShadow: "0 8px 0 rgba(0,0,0,0.22), 0 0 0 4px rgba(16,16,24,0.9)", display: "flex", alignItems: "center", padding: "0 20px", gap: 16}}>
        <div style={{width: 100, height: 100, borderRadius: "50%", overflow: "hidden", border: "4px solid #ffd21f", flexShrink: 0, background: "#eee"}}>
          <Img src={staticFile("perfil.png")} style={{width: "100%", height: "100%", objectFit: "cover"}} />
        </div>
        <div style={{flex: 1, fontFamily, fontWeight: 900, fontSize: 34, color: "#101018", letterSpacing: -0.5, whiteSpace: "nowrap"}}>{HANDLE}</div>
        <div style={{flexShrink: 0, transform: `scale(${press})`, background: done ? "#e4e4ea" : "#ffd21f", color: done ? "#3a3a44" : "#101018", fontFamily, fontWeight: 900, fontSize: 28, padding: "12px 18px", borderRadius: 22, border: done ? "4px solid #c9c9d2" : "4px solid #101018", whiteSpace: "nowrap"}}>
          {done ? "Seguindo ✓" : "+ Seguir"}
        </div>
      </div>
    </div>
  );
};


/* ---------- título amarelo no topo (igual à referência) ---------- */
const TopTitle: React.FC<{from: number; to: number; text: string; size?: number}> = ({from, to, text, size = 88}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: 540, top: 250, width: 980, transform: `translate(-50%,-50%) scale(${s})`, textAlign: "center", fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.0, color: "#ffd21f", WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", textTransform: "uppercase"}}>
      {text}
    </div>
  );
};
/* ---------- plaquinha amarela ---------- */
const Plaque: React.FC<{from: number; to: number; text: string; x?: number; y?: number; size?: number}> = ({from, to, text, x = 540, y = 600, size = 46}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(-3deg)`, background: "#ffd21f", border: "6px solid #101018", fontFamily, fontWeight: 900, fontSize: size, color: "#101018", padding: "10px 22px", textAlign: "center", whiteSpace: "pre", lineHeight: 1.05}}>
      {text}
    </div>
  );
};
/* ---------- relógio do fiado (3:00 → 0:00) ---------- */
const FiadoClock: React.FC<{from: number; to: number; end: number; start?: number}> = ({from, to, end, start = 1}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  const k = clamp((f - from) / (end - from));
  const secs = Math.max(0, Math.round(180 * start * (1 - k)));
  const txt = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <div style={{position: "absolute", left: 830, top: 560, transform: `translate(-50%,-50%) scale(${s})`, width: 230, height: 230, borderRadius: 115, background: "#ffffff", border: "10px solid #101018", display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 900, fontSize: 70, color: secs < 30 ? "#e8262d" : "#101018"}}>
      {txt}
    </div>
  );
};

/* ======================= vídeo ======================= */
const FXV = 0.3;
const SND: React.FC<{src: string; from: number; dur?: number; v: number}> = ({src, from, dur = 60, v}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} />
  </Sequence>
);
const TITLES: [number, number, string[]][] = [
  [L(2), L(3), ["SEQUESTRO", "ESCOLAR"]],
  [L(5), L(6), ["ESCAVAÇÃO", "INTERCONTINENTAL"]],
  [L(8), L(9), ["DEDURO", "VOADOR"]],
  [L(11), L(12), ["FUGA", "PANDÁSTICA"]],
];
const FOLLOW_FROM = SEGUIR15 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoFuga2: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      {TITLES.map(([x, nx, lines], i) => (
        <StageTitle key={i} from={x + 2} to={nx - 3} lines={lines} />
      ))}
      <TopTitle from={4} to={MOCHILA0 - 3} text="FUGIR DA ESCOLA" />
      <Plaque from={LICAO6} to={L(7) - 2} text={"宿題\\nLIÇÃO DE CASA"} x={540} y={420} size={60} />
      <BigNum from={DEZ14} to={SEGUIR15 - 12} text="NOTA 10 🎒" size={120} />
      <Confetti from={PARABENS14} to={PARABENS14 + 50} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_FUGA2 - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio: efeitos só onde precisa ---------- */}
      <Audio src={staticFile("vozfuga2.mp3")} />
      <SND src="sfx3/lock.mp3" from={TRANCA1 + 18} dur={30} v={FXV * 0.5} />
      <SND src="sfx7/shovel.mp3" from={CAVA4} dur={50} v={FXV * 0.5} />
      <SND src="sfx8/wings.mp3" from={POMBO7} dur={50} v={FXV * 0.45} />
      <SND src="sfx10/bonk.mp3" from={MEDO10} dur={20} v={FXV * 0.5} />
      <SND src="sfx7/confetti.mp3" from={PARABENS14} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
