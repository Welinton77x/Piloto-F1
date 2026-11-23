import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, V3, PalmTree, Umbrella} from "./Sets5";
import {sm, rbox, MoonSet, Alien} from "./Sets9";
import {Penguin} from "./Sets11";
import {SunFace} from "./Sets13";
import {Goal, Ball} from "./Sets17";
import {Bg} from "./Sets20";
import {Cow, CowP} from "./Sets8";
import {IceCream, IceBlock, PuddleTie, Laser, RatAstro, SorveteCart} from "./Sets35";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingSorv.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_SORV = F(words[words.length - 1].e + 1.2);

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
const ESCONDER0 = at(0, "esconder");
const DERRETE1 = at(1, "derrete");
const PINGUIM3 = at(3, "pinguim");
const SOPRA4 = at(4, "sopra");
const CONGELA4 = at(4, "congela");
const PICOLE4 = at(4, "picole");
const CIUMES6 = at(6, "ciumes");
const LASER6 = at(6, "laser");
const POCA6 = at(6, "poca");
const VACA8 = at(8, "vaca");
const MEDO9 = at(9, "medo");
const SOBE9 = at(9, "sobe");
const DOBRA9 = at(9, "dobra");
const QUEIJO11 = at(11, "queijo");
const RATOS11 = at(11, "ratos");
const TROCA13 = at(13, "troca");
const DESCE13 = at(13, "desce");
const PATINA15 = at(15, "patina");
const GOL15 = at(15, "gol");
const PARABENS17 = at(17, "parabens");
const SELECAO17 = at(17, "selecao");
const SEGUIR18 = at(18, "seguir");
const DERRETER18 = at(18, "derreter");

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
const CowHold: React.FC<{c: CowP; item: React.ReactNode; s?: number}> = ({c, item, s = 1}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cow c={c} s={s} palmRef={palm} />
      <InHand palm={palm}>{item}</InHand>
    </>
  );
};
const SUN: V3 = [2.5, 7.5, -14];
const ICE_HAND = (melt = 0, flavor = "#ff9ec7") => <IceCream p={[0, -0.02, 0.06]} r={[Math.PI, 0, 0]} s={1.3} melt={melt} flavor={flavor} />;
const BANHISTAS = [NEIGHBORS[1], NEIGHBORS[3], NEIGHBORS[5]];

/* praia (normal ou congelada) */
const BeachSet: React.FC<{t: number; frozen?: number; sun?: React.ReactNode}> = ({t, frozen = 0, sun}) => {
  const fz = frozen > 0.5;
  return (
    <>
      <Bg c={fz ? "#cfe8f6" : "#8fd3ff"} />
      <hemisphereLight args={["#ffffff", fz ? "#bcd8ea" : "#d8b880", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[4, 10, 6]} intensity={2.6} ext={12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color={fz ? "#eaf6ff" : "#f3d9a0"} roughness={fz ? 0.2 : 0.95} />
      </mesh>
      <mesh position={[0, 0.02, -9]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 12]} />
        <meshStandardMaterial color={fz ? "#bfe6ff" : "#2e9ad6"} roughness={fz ? 0.1 : 0.3} />
      </mesh>
      <PalmTree p={[-3.2, 0, -3]} s={1.1} />
      <PalmTree p={[3.6, 0, -4]} s={1.0} lean={-0.2} />
      <Umbrella p={[-1.8, 0, -2.6]} s={0.9} />
      {sun ?? <SunFace p={SUN} r={2.2} t={t} />}
    </>
  );
};

/* 0–2 — o sol apaixonado derrete o sorvete */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const melt = f >= DERRETE1 ? clamp((f - DERRETE1) / 30) : 0;
  return (
    <>
      <Cam pos={[0, 1.7, 5.4]} look={[0.5, 2.0, -2]} fov={56} f={f} a={f >= L(1) ? L(1) : a} />
      <BeachSet t={t} />
      <PBoy id="s0" a={a} f={f} item={ICE_HAND(melt)} pose={(fr) => {
        const hide = fr >= ESCONDER0 && fr < L(1);
        return {...idle(fr), pos: [-0.5, hop(fr, L(2), 14, 0.25), 0.6], rotY: 0.4, ...(hide ? {rShoulder: [0.6, 0.2, 0.3], rElbow: -0.6, head: [-0.3, 0.3, 0]} : {rShoulder: [-1.2, 0.4, 0.05], rElbow: -1.4}), eyeWide: fr >= DERRETE1 ? 1 : 0.5, mouthOpen: fr >= DERRETE1 ? 0.5 : 0, brow: fr >= DERRETE1 ? 1 : 0};
      }} />
    </>
  );
};
/* 3–5 — o pinguim congela a praia */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - PINGUIM3 + 4) / 30);
  const frozen = f >= CONGELA4 ? 1 : 0;
  const blow = f >= SOPRA4 && f < CONGELA4 + 30;
  return (
    <>
      <Cam pos={[0, 2.2, 7.4]} look={[0, 1.0, -0.5]} fov={58} f={f} a={frozen ? CONGELA4 : a} />
      <BeachSet t={t} frozen={frozen} />
      <Penguin p={[lerp(3.5, 1.0, easeOut(k)), 0, 0.6]} rotY={k < 1 ? -1.4 : -0.5} t={t} walk={k < 1 ? 1 : 0} s={1.1} dance={blow ? 1 : 0} />
      {blow &&
        Array.from({length: 10}, (_, i) => {
          const q = ((t * 1.5 + i * 0.1) % 1);
          return (
            <mesh key={i} position={[1.0 - q * 4, 0.9 + Math.sin(i * 3) * 0.3, 0.6 + Math.cos(i * 2) * 0.4]} scale={0.05 + q * 0.1}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshBasicMaterial color="#e6f7ff" transparent opacity={0.8 * (1 - q)} />
            </mesh>
          );
        })}
      {BANHISTAS.map((lk, i) => {
        const pos: V3 = [-2.4 + i * 1.3, 0, -1.6 - (i % 2) * 0.6];
        return f >= PICOLE4 - 6 ? (
          <IceBlock key={i} p={pos} s={0.8}>
            <Toy look={lk} pose={{pos: [0, 0, 0], rotY: 0.3, ...ARMS_UP, eyeWide: 1, mouthOpen: 0.6, brow: 1}} />
          </IceBlock>
        ) : (
          <Toy key={i} look={lk} pose={{...idle(f + i * 9), pos: [pos[0], 0, pos[2]], rotY: 0.3, smile: 1}} />
        );
      })}
      <PBoy id="s3" a={a} f={f} item={ICE_HAND(0.3)} pose={(fr) => ({...idle(fr), pos: [-0.6, 0, 1.0], rotY: 0.5, rShoulder: [-1.2, 0.4, 0.05], rElbow: -1.4, eyeWide: frozen ? 1 : 0.5, mouthOpen: frozen ? 0.5 : 0, smile: fr >= L(5) ? 1 : 0})} />
    </>
  );
};
/* 6–7 — o raio laser do sol ciumento */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const laser = f >= LASER6 && f < POCA6 + 6;
  const melt = f >= LASER6 + 8 ? clamp((f - LASER6 - 8) / 24) : 0;
  const PEN: V3 = [0.6, 0, 0.4];
  return (
    <>
      <Cam pos={[-0.5, 1.6, 6.0]} look={[0.8, 2.4, -3]} fov={60} f={f} a={f >= LASER6 ? LASER6 : a} />
      <BeachSet t={t} frozen={1} sun={<SunFace p={[1.8, 6.0, -9]} r={1.8} t={t} blink={f >= CIUMES6 ? 0.4 : 0} />} />
      {laser && <Laser a={[1.8, 6.0, -9]} b={[PEN[0], 0.6, PEN[2]]} k={1} />}
      {melt < 1 && <group position={PEN} scale={[1, 1 - melt, 1]}><Penguin p={[0, 0, 0]} rotY={-0.2} t={t} s={1.1} blink={laser ? 1 : 0} /></group>}
      {melt > 0.3 && <PuddleTie p={PEN} s={1.2} k={clamp(melt * 1.4)} />}
      <PBoy id="s6" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.9, 0, 0.9], rotY: 0.6, eyeWide: 1, mouthOpen: fr >= LASER6 ? 0.7 : 0, brow: 1, ...(fr >= POCA6 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : {})})} />
    </>
  );
};
/* 8–10 — a vaca com medo sobe no coqueiro que dobra até a Lua */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - VACA8 + 4) / 30);
  const climb = f >= SOBE9 ? clamp((f - SOBE9) / 40) : 0;
  const bend = f >= DOBRA9 ? easeInOut(clamp((f - DOBRA9) / 50)) : 0;
  const top = f >= L(10);
  const trunkH = 3 + bend * 9;
  const cowY = climb * (trunkH - 1.2);
  return (
    <>
      <Cam pos={top ? [1.5, 7, 9] : [0.2, 1.8 + bend * 3, 6.4 + bend * 4]} look={top ? [-5.5, 9, -2] : [-0.6, 1.4 + bend * 4, -0.6]} fov={58} f={f} a={top ? L(10) : a} />
      <BeachSet t={t} frozen={1} />
      {/* o coqueiro que cresce e dobra */}
      <group position={[-1.2, 0, -0.8]} rotation={[0, 0, bend * 0.5]}>
        <mesh position={[0, trunkH / 2, 0]} material={sm("#8a6a4a", 0.85)}>
          <cylinderGeometry args={[0.14, 0.2, trunkH, 10]} />
        </mesh>
        {Array.from({length: 6}, (_, i) => (
          <mesh key={i} position={[Math.cos(i) * 0.6, trunkH, Math.sin(i) * 0.6]} rotation={[Math.sin(i) * 0.5, i, Math.cos(i) * 0.5]} scale={[0.9, 0.05, 0.25]} material={sm("#3aa84a", 0.7)}>
            <sphereGeometry args={[1, 10, 6]} />
          </mesh>
        ))}
        {climb > 0 && <Cow c={{pos: [0.25, cowY, 0.15], rotY: -1.2, arms: "up", armK: 1, t, blink: blinkCurve(f), mouth: 0.4}} s={0.8} />}
      </group>
      {climb === 0 && <Cow c={{pos: [lerp(3.0, 0.4, easeOut(k)), 0, 0.6], rotY: k < 1 ? -1.5 : -0.4, walk: t * 8, walkAmt: k < 1 ? 1 : 0, t, blink: blinkCurve(f), mouth: f >= MEDO9 ? 0.6 : 0.2, arms: f >= MEDO9 ? "up" : "down", armK: 1, lean: f >= MEDO9 ? 0.05 * Math.sin(t * 40) : 0}} s={0.85} />}
      {bend > 0.5 && <mesh position={[-6, 13, -10]}><sphereGeometry args={[2.2, 24, 16]} /><meshStandardMaterial color="#e8e8ee" emissive="#fff6d0" emissiveIntensity={0.4} /></mesh>}
      <PBoy id="s8" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0.9, 0, 1.2], rotY: -0.4, eyeWide: 0.8, head: [fr >= DOBRA9 ? -0.5 : 0, 0, 0], mouthOpen: fr >= DOBRA9 ? 0.5 : 0})} />
    </>
  );
};
/* 11–14 — o sorveteiro alienígena na Lua e a troca */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const traded = f >= TROCA13 + 6;
  return (
    <>
      <Cam pos={[0, 1.6, 5.6]} look={[0, 1.0, 0]} fov={56} f={f} a={f >= L(13) ? L(13) : a} />
      <MoonSet t={t} />
      <hemisphereLight args={["#ffffff", "#5a5a6a", 1.0]} />
      <pointLight position={[2, 5, 4]} intensity={14} distance={16} castShadow />
      <SorveteCart p={[0.5, 0, -0.9]} rotY={-0.2} s={1.1} />
      <Alien a={{pos: [1.7, 0, -0.5], rotY: -0.5, t, blink: blinkCurve(f + 7), mouth: 0.4 + 0.2 * Math.sin(t * 6), wave: 1}} s={0.9} />
      {[0, 1, 2].map((i) => (
        <RatAstro key={i} p={[0.0 + i * 0.45, 0, 1.0 + (i % 2) * 0.3]} rotY={-0.8} t={t} ph={i} s={1.3} />
      ))}
      <CowHold c={{pos: [-0.9, 0, 0.4], rotY: 0.5, arms: "hold", armK: 1, t, blink: blinkCurve(f), mouth: 0.3, happy: traded ? 1 : 0}} s={0.85} item={traded ? <IceCream s={1.6} flavor="#ffcf3a" /> : <IceCream s={1.6} />} />
      {f >= QUEIJO11 && f < L(13) && <IceCream p={[0.3, 1.1 + Math.sin(t * 3) * 0.05, 0.2]} s={2.2} flavor="#ffcf3a" />}
    </>
  );
};
/* 14 — escorregando pelo coqueiro que nem tobogã */
const S14: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = clamp((f - a) / Math.max(1, b - a));
  return (
    <>
      <Cam pos={[0, 0, 9]} look={[0, 0, 0]} fov={60} f={f} a={a} />
      <Bg c="#3a6ad0" />
      <hemisphereLight args={["#ffffff", "#3a4a8a", 1.2]} />
      <mesh position={[0, 0, -1]} rotation={[0, 0, -0.75]}>
        <cylinderGeometry args={[0.25, 0.3, 16, 12]} />
        <meshStandardMaterial color="#8a6a4a" />
      </mesh>
      <group position={[lerp(-3.2, 3.2, k), lerp(3.4, -3.4, k), -0.6]} rotation={[0, 0.3, -0.75]}>
        <Cow c={{pos: [0, 0, 0], rotY: 0.4, arms: "up", armK: 1, t, mouth: 0.8, blink: 0}} s={0.8} />
      </group>
      <SpeedLines p={[lerp(-3.2, 3.2, k), lerp(3.4, -3.4, k), -0.8]} dir={-1} />
      {Array.from({length: 12}, (_, i) => (
        <mesh key={i} position={[((i * 1.7) % 10) - 5, ((i * 2.3 + t * 3) % 12) - 6, -3]} scale={0.3}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
};
/* 15–16 — futebol glacial no campeonato de pinguins */
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 50);
  const shot = f >= GOL15 - 6 ? clamp((f - GOL15 + 6) / 14) : 0;
  return (
    <>
      <Cam pos={[0.5, 2.6, 7.6]} look={[-0.3, 0.8, -1]} fov={58} f={f} a={a} />
      <BeachSet t={t} frozen={1} />
      <Goal p={[-2.6, 0, -2.6]} rotY={0.6} />
      {[0, 1, 2, 3].map((i) => (
        <Penguin key={i} p={[0.4 + i * 0.7, 0, -1.2 + (i % 2) * 0.9]} rotY={-0.9} t={t + i} s={0.8} dance={shot > 0 ? 1 : 0} />
      ))}
      <Cow c={{pos: [lerp(2.4, -0.4, k), 0, 0.6], rotY: -1.2, walk: t * 4, walkAmt: k < 1 ? 0.5 : 0, arms: shot > 0 ? "up" : "down", armK: 1, t, mouth: 0.5, lean: 0.1 * Math.sin(t * 5)}} s={0.85} />
      <Ball p={[lerp(-0.9, -2.4, shot), 0.15 + Math.sin(shot * Math.PI) * 0.8, lerp(0.6, -2.4, shot)]} s={1.0} />
    </>
  );
};
/* 17–18 — parabéns; e o sol derrete você */
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const threat = f >= DERRETER18 - 4;
  const melt = threat ? clamp((f - DERRETER18 - 8) / 30) : 0;
  return (
    <>
      <Cam pos={[0, 1.6, 5.0]} look={[0, 1.3, -1]} fov={56} f={f} a={threat ? DERRETER18 - 4 : a} />
      <BeachSet t={t} frozen={1} sun={<SunFace p={[1.4, 5.0, -7]} r={1.5} t={t} />} />
      {threat && <Laser a={[1.4, 5.0, -7]} b={[-0.4, 0.8, 0.6]} k={0.8} />}
      <Cow c={{pos: [1.1, 0, 0.0], rotY: -0.5, arms: "up", armK: 0.7 + 0.3 * Math.sin(t * 6), t, mouth: 0.4, happy: 1, blink: blinkCurve(f)}} s={0.8} />
      {melt < 1 && (
        <group position={[-0.4, 0, 0.6]} scale={[1, 1 - melt, 1]}>
          <PBoy id="s17" a={a} f={f} item={ICE_HAND(0, "#ffcf3a")} pose={(fr) => ({...idle(fr), pos: [0, threat ? 0 : Math.abs(Math.sin(tf(fr) * 6)) * 0.2, 0], rotY: 0.3, rShoulder: [-1.3, 0.4, 0.05], rElbow: -1.6, smile: threat ? 0 : 1, eyeWide: threat ? 1 : 0.5, mouthOpen: threat ? 0.7 : 0.3, brow: threat ? 1 : 0})} />
        </group>
      )}
      {melt > 0.3 && <PuddleTie p={[-0.4, 0, 0.6]} s={1.2} k={clamp(melt * 1.4)} />}
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(3), Comp: S3},
  {from: L(6), Comp: S6},
  {from: L(8), Comp: S8},
  {from: L(11), Comp: S11},
  {from: DESCE13 + 4, Comp: S14},
  {from: L(15), Comp: S15},
  {from: L(17), Comp: S17},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_SORV} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["sorvete", "sol", "apaixonado", "derrete", "amor", "derretimento", "romantico", "pinguim", "gelada", "sopra", "congela", "praia", "picole", "flocos", "inverno", "litoraneo", "ciumes", "laser", "poca", "gravata", "pinguinistico", "vaca", "leite", "medo", "coqueiro", "lua", "escalada", "bovinistica", "alienigena", "queijo", "ratos", "astronautas", "comercio", "lunatico", "tobogã", "toboga", "escorregamento", "leiteiro", "patina", "gol", "futebol", "glacial", "parabens", "selecao", "seguir", "derreter"]);
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
  [L(2), L(3), ["DERRETIMENTO", "ROMÂNTICO"]],
  [L(5), L(6), ["INVERNO", "LITORÂNEO"]],
  [L(7), L(8), ["DERRETIMENTO", "PINGUINÍSTICO"]],
  [L(10), L(11), ["ESCALADA", "BOVINÍSTICA"]],
  [L(12), L(13), ["COMÉRCIO", "LUNÁTICO"]],
  [L(14), L(15), ["ESCORREGAMENTO", "LEITEIRO"]],
  [L(16), L(17), ["FUTEBOL", "GLACIAL"]],
];
const Hearts2D: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const k = ((f - from) / 40 + i * 0.2) % 1;
        return <div key={i} style={{position: "absolute", left: 640 + Math.sin(i * 2 + f * 0.05) * 120, top: 520 - k * 260, fontSize: 70, opacity: 1 - k}}>❤️</div>;
      })}
    </>
  );
};
const FOLLOW_FROM = SEGUIR18 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoSorvete: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      {TITLES.map(([x, nx, lines], i) => (
        <StageTitle key={i} from={x + 2} to={nx - 3} lines={lines} />
      ))}
      <TopTitle from={4} to={ESCONDER0 - 3} text="SORVETE NO SOL" />
      <Hearts2D from={L(1)} to={L(2) - 2} />
      <Ono from={DERRETE1} to={L(2) - 2} text="PLOFT!" size={130} color="#ff9ec7" />
      <Ono from={CONGELA4} to={PICOLE4 - 2} text="CREC CREC!" size={120} color="#7fd0ff" />
      <Ono from={LASER6} to={POCA6 - 2} text="PEW PEW!" size={140} color="#ff3030" />
      <Ono from={MEDO9} to={SOBE9 - 2} text="MUUU!" size={150} color="#ffffff" />
      <Ono from={GOL15} to={L(16) - 2} text="GOOOL!" size={170} color="#ffd21f" />
      <Plaque from={SELECAO17} to={L(18) - 2} text={"🐄 CONVOCADA\nPRA SELEÇÃO"} x={540} y={420} size={60} />
      <Confetti from={PARABENS17} to={PARABENS17 + 60} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_SORV - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozsorv.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 2} dur={40} v={FXV * 0.25} />
      ))}
      <SND src="sfx3/crack.mp3" from={CONGELA4} dur={30} v={FXV * 0.4} />
      <SND src="sfx14/zap.mp3" from={LASER6} dur={30} v={FXV * 0.4} />
      <SND src="sfx10/bubble.mp3" from={LASER6 + 8} dur={30} v={FXV * 0.3} />
      <SND src="sfx7/whoosh.mp3" from={DESCE13} dur={40} v={FXV * 0.4} />
      <SND src="sfx9/yay.mp3" from={GOL15} dur={50} v={FXV * 0.4} />
      <SND src="sfx7/confetti.mp3" from={PARABENS17} dur={50} v={FXV * 0.4} />
      <SND src="sfx14/zap.mp3" from={DERRETER18} dur={30} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
