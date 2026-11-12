import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {physics} from "./Physics";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Town, Bedroom, House, Tree, Fence, Clouds, V3} from "./Sets5";
import {School, SchoolState, WINDOWS, SneezeBlast, JellyPool, JellySplash, Crack, Dino, DinoPose, Classroom2, SchoolDesk, TestPaper, Pencil, Tissue, Yard} from "./Sets7";
import {Captions, StageTitle, Chip, Sparkles, Confetti, Sticker, Cross, Wd, clean, STROKE} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut, rng} from "./util";
import W from "./timingEscola.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w).startsWith(clean(txt)));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
export const TOTAL_ESCOLA = F(words[words.length - 1].e + 1.6);

/* ---------- personagens ---------- */
const KID: ToyLook = {backpack: "#2f6fd6"};
const KID_HOME: ToyLook = {};
const KLOOKS: ToyLook[] = [
  {shirt: "#e74c3c", pants: "#2c3e50", hair: "#1a1a1a"},
  {shirt: "#3498db", pants: "#34495e", hair: "#7a3a1a", skin: "#c68a5a"},
  {shirt: "#2ecc71", pants: "#2c2c34", hair: "#3b2416"},
  {shirt: "#9b59b6", pants: "#1f6fb2", hair: "#d9b56a", skin: "#f5d0b0"},
  {shirt: "#ff6f91", pants: "#2c3e50", hair: "#1a1a1a", skin: "#8d5a3a"},
  {shirt: "#1abc9c", pants: "#34495e", hair: "#3b2416"},
  {shirt: "#f39c12", pants: "#2c2c34", hair: "#7a3a1a", skin: "#e0a878"},
  {shirt: "#5dade2", pants: "#1f6fb2", hair: "#1a1a1a", skin: "#c68a5a"},
  {shirt: "#e67e22", pants: "#2c3e50", hair: "#d9b56a"},
  {shirt: "#c0392b", pants: "#34495e", hair: "#3b2416", skin: "#a8714a"},
];
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const walkP = (f: number, a: number, rate = 1.6): Pose => {
  const ph = ((f - a) / FPS) * Math.PI * 2 * rate;
  return {walk: ph, walkAmt: 1, rShoulder: [Math.sin(ph) * 0.4, 0, -0.1], lShoulder: [-Math.sin(ph) * 0.4, 0, 0.1], rElbow: -0.35, lElbow: -0.35};
};

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.05;
  c.far = 400;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const InHand: React.FC<{palm: React.RefObject<THREE.Object3D | null>; children: React.ReactNode}> = ({palm, children}) => {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.matrixWorld.decompose(g.current.position, g.current.quaternion, g.current.scale);
  }, -1);
  return <group ref={g}>{children}</group>;
};
const arc = (A: V3, B: V3, k: number, h = 2): V3 => [lerp(A[0], B[0], k), lerp(A[1], B[1], k) + Math.sin(k * Math.PI) * h, lerp(A[2], B[2], k)];

/* ---------- ambientes ---------- */
const DayLights: React.FC<{target: V3; ext?: number}> = ({target, ext = 9}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 35, 120]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={target} dir={[-6, 10, 7]} intensity={2.6} ext={ext} />
  </>
);
const SCHOOL_P: V3 = [0, 0, -6];
const DOOR_Z = SCHOOL_P[2] + 2;
const SchoolSet: React.FC<{t: number; s?: SchoolState; target?: V3; ext?: number}> = ({t, s, target = [0, 0, -3], ext = 10}) => (
  <>
    <DayLights target={target} ext={ext} />
    <Yard />
    <School p={SCHOOL_P} s={{t, ...s}} />
    {[-7, -5.6, 5.8, 7.4].map((x, i) => (
      <Tree key={i} p={[x, 0, -4 - (i % 2) * 2]} s={1.3} />
    ))}
    <Fence x0={-9} x1={-4} z={-2.4} />
    <Fence x0={4.4} x1={9} z={-2.4} />
    <Clouds t={t} />
  </>
);
const POOL_P: V3 = [0, 0, 0];
const PoolSet: React.FC<{t: number; wobble: number; target?: V3}> = ({t, wobble, target = [0, 0, 0]}) => (
  <>
    <DayLights target={target} ext={8} />
    <Yard />
    <House p={[0.5, 0, -6]} w={5} h={4.2} wall="#a9d9ee" roof="#d9534f" />
    <Fence x0={-6} x1={6} z={-3.4} />
    <Tree p={[-4, 0, -2.5]} s={1.2} />
    <Tree p={[4.2, 0, -2.2]} s={1.1} />
    <JellyPool p={POOL_P} t={t} wobble={wobble} />
    <Clouds t={t} />
  </>
);
const RoomScene: React.FC<{t: number}> = ({t}) => (
  <>
    <Sky />
    <hemisphereLight args={["#fff4e0", "#b08a60", 1.05]} />
    <pointLight position={[1.2, 3.4, 1.0]} intensity={9} distance={9} decay={1.4} color="#fff1d6" />
    <SunLight target={[-0.3, 0.6, -1.4]} dir={[2.5, 6, -8]} intensity={2.2} ext={4} />
    <Bedroom t={t} clock={6.5} />
  </>
);
const ClassScene: React.FC = () => (
  <>
    <color attach="background" args={["#ffe7a8"]} />
    <hemisphereLight args={["#fffaf0", "#b08a60", 1.15]} />
    <pointLight position={[0, 4.2, 2]} intensity={14} distance={12} decay={1.3} color="#fff4e0" castShadow />
    <directionalLight position={[-6, 6, 2]} intensity={1.0} color="#cfeaff" />
    <Classroom2 />
  </>
);

/* ======================= os planos ======================= */

/* 0 — segunda-feira, 6h30: sono */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("sono" + a, (fr) => ({
    breathe: Math.sin(fr / 14),
    blink: 0.5 + 0.5 * blinkCurve(fr) + 0.3 * Math.max(0, Math.sin(fr / 18)),
    pos: [-0.3, -0.24, -0.05],
    legLift: 1.5,
    torso: [0.25, 0, 0.04 * Math.sin(fr / 20)],
    head: [0.15, 0, 0.1 * Math.sin(fr / 25)],
    bags: 1,
    hairLift: 0.9,
    rShoulder: [-0.25, 0, -0.18],
    lShoulder: [-0.25, 0, 0.18],
    rElbow: -0.6,
    lElbow: -0.6,
    mouthOpen: 0.3 * pop(fr, a + 25, 10) * (1 - ramp(fr, a + 40, a + 50)),
  }), a, f);
  const k = ramp(f, a, a + 80);
  return (
    <>
      <Cam pos={[lerp(0.15, 0.05, k), 1.45, lerp(3.6, 3.0, k)]} look={[-0.3, 1.15, -0.6]} fov={46} f={f} a={a} />
      <RoomScene t={t} />
      <pointLight position={[0.2, 1.8, 1.5]} intensity={3} distance={5} color="#ffe2c0" />
      <Toy pose={pose} look={KID_HOME} />
    </>
  );
};
/* 1 — a escola (ainda saudável); o menino com cara de plano */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("plano" + a, (fr) => ({...idle(fr), pos: [1.7, 0, 0.6], rotY: -2.55, smile: 0.7, brow: -0.6, rShoulder: [-0.9, 0, -0.3], rElbow: -1.6, lShoulder: [-0.9, 0, 0.3], lElbow: -1.6, rWrist: [0, 0, 0.6], lWrist: [0, 0, -0.6]}), a, f);
  const k = ramp(f, a, a + 60);
  return (
    <>
      <Cam pos={[lerp(5.2, 4.6, k), 1.7, lerp(5.2, 4.6, k)]} look={[0.3, 2.3, -4]} fov={50} f={f} a={a} />
      <SchoolSet t={t} />
      <Toy pose={pose} look={KID} />
    </>
  );
};
/* 2 — vai até a porta e espirra */
const SNZ = at(1, "espirra");
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const arrive = SNZ - 14;
  const pose = physics("espirro" + a, (fr) => {
    const wk = fr < arrive;
    const k = ramp(fr, a, arrive, easeOut);
    const inhale = ramp(fr, arrive, SNZ - 1) * (1 - ramp(fr, SNZ - 1, SNZ + 3));
    const blow = ramp(fr, SNZ - 1, SNZ + 3) * (1 - ramp(fr, SNZ + 14, SNZ + 24));
    return {
      ...idle(fr),
      ...(wk ? walkP(fr, a, 1.7) : {}),
      pos: [lerp(1.4, 0.35, k), 0, lerp(1.2, DOOR_Z + 0.75, k)],
      rotY: Math.PI - 0.15,
      head: [-0.4 * inhale + 0.45 * blow, 0, 0],
      torso: [-0.15 * inhale + 0.3 * blow, 0, 0],
      eyeWide: 0.6 * inhale,
      blink: blow > 0.3 ? 1 : blinkCurve(fr),
      mouthOpen: 0.5 * inhale + 0.9 * blow,
      brow: 0.8 * inhale,
    };
  }, a, f);
  const nose: V3 = [0.35, 1.65, DOOR_Z + 0.5];
  return (
    <>
      <Cam pos={[3.6, 1.5, DOOR_Z + 2.4]} look={[0.3, 1.4, DOOR_Z + 0.3]} fov={48} f={f} a={a} />
      <SchoolSet t={t} target={[0, 0, DOOR_Z]} ext={6} />
      <Toy pose={pose} look={KID} />
      <group rotation={[0, Math.PI, 0]} position={nose}>
        <SneezeBlast p={[0, 0, 0]} k={(f - SNZ) / 14} />
      </group>
    </>
  );
};
/* 3 — espirro estratégico: limpa o nariz no braço, orgulhoso */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("estrat" + a, (fr) => {
    const wipe = Math.sin(((fr - a) / 18) * Math.PI) > 0 && fr < a + 36 ? 1 : 0;
    return {...idle(fr), pos: [0.35, 0, DOOR_Z + 0.75], rotY: 0.25, smile: 1, brow: -0.4, rShoulder: [-1.5 * wipe - 0.2, 0, -0.9 * wipe - 0.1], rElbow: -1.7 * wipe - 0.2, lShoulder: [-0.6, 0, 0.3], lElbow: -1.5, lWrist: [0, 0, -0.8], head: [-0.1, 0.15, 0]};
  }, a, f);
  return (
    <>
      <Cam pos={[0.9, 1.5, DOOR_Z + 3.3]} look={[0.35, 1.5, DOOR_Z + 0.75]} fov={44} f={f} a={a} />
      <SchoolSet t={t} target={[0, 0, DOOR_Z]} ext={6} />
      <Toy pose={pose} look={KID} />
    </>
  );
};

/* 4 — a escola pega gripe... e espirra */
const BIG = at(3, "gigante") + 4;
const schoolState = (f: number): SchoolState => ({
  sick: ramp(f, at(3, "gripe") - 4, at(3, "gripe") + 8),
  hot: ramp(f, at(3, "telhado") - 2, at(3, "quente") + 6),
  thermo: pop(f, at(3, "quente") + 2, 10),
  drip: ramp(f, at(3, "porta") - 2, at(3, "escorrendo") + 6),
  inflate: ramp(f, at(3, "e", 0) - 4, BIG - 2, easeInOut) * (1 - ramp(f, BIG, BIG + 6)),
  eyesClosed: ramp(f, BIG - 12, BIG - 2) * (1 - ramp(f, BIG + 8, BIG + 16)),
  sneeze: clamp((f - BIG) / 14),
  open: f > BIG ? 1 : 0,
});
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const sh = shake(f, 0.12 * ramp(f, BIG - 1, BIG + 1) * (1 - ramp(f, BIG + 6, BIG + 20)));
  const blown = clamp((f - BIG) / 18);
  const bp = arc([2.2, 0, DOOR_Z + 1.2], [3.6, 0, DOOR_Z + 7], easeOut(blown), 1.4);
  const pose = physics("sopro" + a, (fr) => {
    const bl = clamp((fr - BIG) / 18);
    return {...idle(fr), rotY: Math.PI + 0.4 + bl * 6, eyeWide: bl > 0 ? 1 : 0.4, mouthOpen: bl > 0 ? 0.9 : 0, brow: 1, rShoulder: [-2.6 * Math.min(1, bl * 3), 0, -0.5], lShoulder: [-2.6 * Math.min(1, bl * 3), 0, 0.5], hairLift: bl > 0 ? 1 : 0};
  }, a, f);
  return (
    <>
      <Cam pos={[0.4 + sh[0], 2.4 + sh[1], 8.6]} look={[0.2, 2.4, -4]} fov={52} f={f} a={a} />
      <SchoolSet t={t} s={schoolState(f)} target={[0, 0, -3]} ext={10} />
      <SneezeBlast p={[0, 0.9, DOOR_Z + 0.3]} k={(f - BIG) / 16} />
      <Toy pose={{...pose, pos: bp}} look={KID} />
    </>
  );
};

/* 5/6 — os alunos saem voando pelas janelas */
const NK = 10;
const FLY0 = L(4) - 6;
const kidStart = (i: number): V3 => {
  const w = WINDOWS[[0, 1, 2, 3, 4, 7, 0, 3, 1, 2][i]];
  return [SCHOOL_P[0] + w[0], SCHOOL_P[1] + w[1] - 0.6, SCHOOL_P[2] + 2.2];
};
const kidFly = (i: number, f: number): {p: V3; spin: number; k: number} => {
  const s0 = FLY0 + i * 4;
  const k = clamp((f - s0) / 70);
  const A = kidStart(i);
  const B: V3 = [A[0] + 14 + (i % 3) * 1.5, -2, A[2] + 4 + (i % 4)];
  return {p: f < s0 ? A : arc(A, B, k, 7 + (i % 3) * 1.5), spin: k * (5 + i), k};
};
const kidPose = (f: number, i: number, wild = 1): Pose => ({
  ...idle(f + i * 13),
  eyeWide: 0.8 * wild,
  mouthOpen: (0.6 + 0.3 * Math.sin(f / 3 + i)) * wild,
  brow: 0.8 * wild,
  rShoulder: [-2.4 * wild + 0.3 * Math.sin(f / 4 + i), 0, -0.6],
  lShoulder: [-2.4 * wild + 0.3 * Math.cos(f / 4 + i), 0, 0.6],
  legLift: 0.4 * wild,
  hairLift: wild,
});
const FlyingKids: React.FC<{f: number}> = ({f}) => (
  <>
    {Array.from({length: NK}, (_, i) => {
      const fl = kidFly(i, f);
      if (f < FLY0 + i * 4 || fl.k >= 1) return null;
      return (
        <group key={i} position={fl.p} rotation={[fl.spin * 0.6, fl.spin * 0.3, fl.spin * 0.4]} scale={0.8}>
          <group position={[0, -1.0, 0]}>
            <Toy pose={kidPose(f, i)} look={KLOOKS[i]} />
          </group>
        </group>
      );
    })}
  </>
);
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 90);
  return (
    <>
      <Cam pos={[lerp(5.5, 7, k), lerp(1.3, 2.2, k), lerp(7.5, 9, k)]} look={[lerp(1, 4, k), lerp(4.0, 5.2, k), -3]} fov={54} f={f} a={a} />
      <SchoolSet t={t} s={{...schoolState(BIG + 30), open: 1}} target={[2, 0, -3]} ext={12} />
      <FlyingKids f={f} />
    </>
  );
};
const S6: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 2.3, 9.4]} look={[0.3, 3.0, -4]} fov={52} f={f} a={a} />
    <SchoolSet t={t} s={{...schoolState(BIG + 30), open: 1, sneeze: 0, eyesClosed: 0.25 * Math.max(0, Math.sin(f / 6))}} target={[0, 0, -3]} ext={10} />
    <FlyingKids f={f} />
  </>
);

/* 7/8 — caem na piscina de gelatina */
const LAND0 = at(6, "caem") - 8;
const spotOf = (i: number): V3 => [-1.7 + (i % 5) * 0.85, -1.02, -0.85 + Math.floor(i / 5) * 1.5 + ((i % 2) * 0.2 - 0.1)];
const landT = (i: number) => LAND0 + i * 6;
const kidInPool = (i: number, f: number): {p: V3; k: number; spin: number} => {
  const tl = landT(i);
  const k = clamp((f - (tl - 18)) / 18);
  const S = spotOf(i);
  const A: V3 = [S[0] - 6, S[1] + 9, S[2] + 1];
  if (f < tl) return {p: arc(A, [S[0], 0.5, S[2]], k, 0), k, spin: k * 4};
  const sink = ramp(f, tl, tl + 14, easeOut);
  return {p: [S[0], lerp(0.5, S[1], sink) + 0.12 * Math.sin((f - tl) / 2.5) * (1 - sink), S[2]], k: 1, spin: 0};
};
const POOL_KIDS_FROM = (f: number, jump = 0) =>
  Array.from({length: NK}, (_, i) => {
    const kp = kidInPool(i, f);
    if (f < landT(i) - 18) return null;
    const j = jump * Math.max(0, Math.sin(f / 4 + i * 1.3)) * 0.6;
    const landed = f >= landT(i);
    const pose: Pose = landed ? {...idle(f + i * 11), smile: 0.8, mouthOpen: jump > 0 ? 0.5 : 0.2 * Math.sin(f / 5 + i) + 0.1, eyeWide: 0.3, rShoulder: [-2.3 + 0.4 * Math.sin(f / 5 + i), 0, -0.5], lShoulder: [-2.0, 0, 0.6], rotY: 0.3 * Math.sin(i * 2.1)} : kidPose(f, i);
    return (
      <group key={i} position={[kp.p[0], kp.p[1] + j, kp.p[2]]} rotation={landed ? [0, 0, 0] : [kp.spin, kp.spin * 0.4, 0]} scale={0.8}>
        <Toy pose={pose} look={{...KLOOKS[i], jelly: landed ? 0.6 : 0}} />
      </group>
    );
  });
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const zoom = ramp(f, at(6, "gelatina") - 4, at(6, "morango") + 10, easeInOut);
  const wob = 0.3 + 0.7 * Math.max(...Array.from({length: NK}, (_, i) => Math.exp(-Math.max(0, f - landT(i)) / 10) * (f >= landT(i) ? 1 : 0)), 0);
  return (
    <>
      <Cam pos={[lerp(2.8, 1.4, zoom), lerp(3.6, 1.6, zoom), lerp(7.0, 3.6, zoom)]} look={[lerp(-0.2, 0.2, zoom), lerp(0.6, 0.1, zoom), 0]} fov={50} f={f} a={a} />
      <PoolSet t={t} wobble={wob} />
      {POOL_KIDS_FROM(f)}
      {Array.from({length: NK}, (_, i) => (
        <JellySplash key={"s" + i} p={[spotOf(i)[0], 0.1, spotOf(i)[2]]} k={(f - landT(i)) / 16} />
      ))}
    </>
  );
};
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.6, 1.25, 4.2]} look={[0, 0.5, 0]} fov={48} f={f} a={a} />
    <PoolSet t={t} wobble={0.35} />
    {POOL_KIDS_FROM(f)}
  </>
);
/* 9 — pulando na gelatina: tudo treme */
const QUAKE = at(8, "cidade");
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const jump = ramp(f, a, at(8, "pulando") + 6);
  const sh = shake(f, 0.06 * ramp(f, at(8, "treme") - 4, QUAKE));
  return (
    <>
      <Cam pos={[1.0 + sh[0], 2.0 + sh[1], 5.2]} look={[0, 0.4, 0]} fov={50} f={f} a={a} />
      <PoolSet t={t} wobble={0.4 + 1.2 * jump} />
      {POOL_KIDS_FROM(f, jump)}
    </>
  );
};
/* 10/11 — a cidade inteira balança; rachadura na rua */
const TownQuake: React.FC<ShotProps & {crack?: number}> = ({f, a, t, crack = 0}) => {
  const amp = ramp(f, QUAKE - 2, QUAKE + 6);
  const sh = shake(f, 0.12 * amp);
  const rock = 0.025 * amp * Math.sin(f * 1.9);
  return (
    <>
      <Cam pos={[2 + sh[0], 2.4 + sh[1], 9]} look={[0.5, 1.8, -3]} fov={52} f={f} a={a} />
      <DayLights target={[0, 0, -3]} ext={12} />
      <group rotation={[0, 0, rock]}>
        <Town t={t} galo={false} />
      </group>
      <Crack p={[0.5, 0, 0]} k={crack} len={9} rotY={0.15} />
    </>
  );
};
const S10: React.FC<ShotProps> = (p) => <TownQuake {...p} />;
const S11: React.FC<ShotProps> = (p) => <TownQuake {...p} crack={ramp(p.f, p.a + 6, p.a + 50, easeOut)} />;

/* 12 — o dinossauro de massinha acorda embaixo da escola */
const DINO_P: V3 = [0.5, 0, -1.2];
const RISE0 = at(10, "acorda") - 4;
const RISE1 = at(10, "dinossauro") + 14;
const dinoRise = (f: number) => ramp(f, RISE0, RISE1, easeOut);
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const rise = dinoRise(f);
  const yawn = ramp(f, at(10, "de", 0) + 2, at(10, "massinha") + 4) * (1 - ramp(f, at(10, "embaixo"), at(10, "escola", 1) + 6));
  const study = ramp(f, at(10, "voltar") - 4, at(10, "estudar"));
  const sh = shake(f, 0.07 * (1 - ramp(f, RISE1, RISE1 + 12)) * ramp(f, RISE0 - 4, RISE0));
  const dp: DinoPose = {pos: [DINO_P[0], lerp(-3.8, 0, rise), DINO_P[2]], rotY: -0.25, jaw: yawn, blink: yawn > 0.5 ? 1 : blinkCurve(f), headTilt: -0.2 * yawn, arms: yawn * 0.8 + 0.4 * pop(f, at(10, "estudar"), 10) * (1 - ramp(f, at(10, "estudar") + 14, at(10, "estudar") + 24)), glasses: study > 0.5, backpack: study > 0.5, t, tail: 0.6, pupil: [0.3 * Math.sin(f / 15), 0]};
  return (
    <>
      <Cam pos={[2.8 + sh[0], 2.3 + sh[1], 7.6]} look={[0.4, 2.3, -2]} fov={52} f={f} a={a} />
      <SchoolSet t={t} s={{...schoolState(BIG + 60), open: 1, sneeze: 0, sick: 0.6, hot: 0.4, drip: 0}} target={[0, 0, -2]} ext={10} />
      <Crack p={[DINO_P[0], 0, DINO_P[2]]} k={ramp(f, RISE0 - 10, RISE0 + 6)} len={4.5} />
      <Dino p={dp} s={1.55} />
    </>
  );
};

/* 13/14 — intercâmbio jurássico; a prova */
const DESK_D: V3 = [0.6, 0, -0.6];
const classKids = (f: number) =>
  [[-2.6, -1.4], [-1.0, -1.6], [2.6, -1.4], [-2.6, 0.6], [2.4, 0.9]].map(([x, z], i) => (
    <group key={i}>
      <SchoolDesk p={[x, 0, z]} />
      <group position={[x, 0, z + 0.62]} rotation={[0, Math.PI, 0]} scale={0.8}>
        <Toy pose={{...idle(f + i * 9), pos: [0, -0.12, 0], legLift: 1.5, rotY: Math.PI, rShoulder: [-0.7, 0, -0.2], lShoulder: [-0.7, 0, 0.2], rElbow: -0.8, lElbow: -0.8, head: [0.1, 0.4 * Math.sin(f / 30 + i) * 0, 0], eyeWide: 0.5, mouthOpen: 0.15}} look={{...KLOOKS[i], jelly: 0.5}} />
      </group>
    </group>
  ));
const DinoAtDesk: React.FC<{f: number; t: number; writing?: number; graded?: boolean; show?: number}> = ({f, t, writing = 0, graded = false, show = 0}) => (
  <>
    <SchoolDesk p={DESK_D} tag />
    <Dino p={{pos: [DESK_D[0], 0, DESK_D[2] + 0.75], rotY: Math.PI, sit: 1, glasses: true, backpack: true, t, arms: 0.15 + 0.1 * writing * Math.sin(f * 1.2) + 0.9 * show, headTilt: 0.35 * writing - 0.1 * show, blink: blinkCurve(f + 7), pupil: [0, -0.6 * writing]}} s={1.05} />
    {show < 0.5 && <TestPaper p={[DESK_D[0], 0.78, DESK_D[2] + 0.05]} r={[-Math.PI / 2, 0, 0.1]} s={1.4} graded={graded} />}
    {writing > 0.5 && <Pencil p={[DESK_D[0] + 0.1 + 0.05 * Math.sin(f * 1.5), 0.86, DESK_D[2] + 0.12]} r={[0.6, 0, -0.5]} s={1.2} />}
    {show >= 0.5 && <TestPaper p={[DESK_D[0], 2.1, DESK_D[2] + 1.6]} r={[0, 0, 0.08 * Math.sin(f / 6)]} s={1.8} graded />}
  </>
);
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 80);
  return (
    <>
      <Cam pos={[lerp(1.6, 1.2, k), 2.5, lerp(-3.2, -2.8, k)]} look={[0.4, 1.3, 0.6]} fov={52} f={f} a={a} />
      <ClassScene />
      {classKids(f)}
      <DinoAtDesk f={f} t={t} />
    </>
  );
};
const TEN = at(12, "dez");
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, TEN, easeInOut);
  return (
    <>
      <Cam pos={[DESK_D[0] + lerp(1.4, 1.0, k), lerp(2.6, 2.45, k), DESK_D[2] + lerp(-2.6, -2.2, k)]} look={[DESK_D[0], 1.35, DESK_D[2] + 0.5]} fov={52} f={f} a={a} />
      <ClassScene />
      <DinoAtDesk f={f} t={t} writing={f < TEN - 4 ? 1 : 0} graded={f >= TEN} />
    </>
  );
};

/* 15 — parabéns: coberto de gelatina, o dino com a prova 10 */
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("parab" + a, (fr) => ({...idle(fr), pos: [-0.9, 0, 0.9], rotY: 0.35, bags: 0.6, blink: 0.35 + 0.65 * blinkCurve(fr), smile: 0, brow: -0.3, head: [0.15, 0.3, 0.08], rShoulder: [-0.15, 0, -0.15], lShoulder: [-0.15, 0, 0.15]}), a, f);
  const k = ramp(f, a, a + 200);
  return (
    <>
      <Cam pos={[lerp(0.2, 0.1, k), 1.8, lerp(5.6, 5.0, k)]} look={[0, 1.5, 0]} fov={50} f={f} a={a} />
      <ClassScene />
      <Toy pose={pose} look={{...KID, jelly: 1}} />
      <Dino p={{pos: [1.1, 0, 0.0], rotY: -0.3, t, glasses: true, backpack: true, arms: 0.9, jaw: 0.3 + 0.15 * Math.sin(f / 4), blink: blinkCurve(f + 9), tail: 1}} s={1.05} />
      <TestPaper p={[1.05, 2.25, 0.55]} r={[0, -0.3, 0.08 * Math.sin(f / 6)]} s={1.6} graded />
    </>
  );
};
/* 16 — pra faltar: deixar o dinossauro doente... ATCHIM */
const DSNZ = at(14, "doente") + 6;
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const blown = clamp((f - DSNZ - 6) / 20);
  const pose = physics("lenco" + a, (fr) => {
    const bl = clamp((fr - DSNZ - 6) / 20);
    return {...idle(fr), rotY: 0.6 + bl * 5, rShoulder: [-1.3 * (1 - bl) - 2.5 * bl, 0, -0.2], rElbow: -0.2, rFist: 1, smile: 0.6 * (1 - bl), brow: -0.5 * (1 - bl) + bl, eyeWide: bl > 0 ? 1 : 0, mouthOpen: bl > 0 ? 0.9 : 0, hairLift: bl > 0 ? 1 : 0, lShoulder: [-2.5 * bl, 0, 0.5]};
  }, a, f);
  const bp = arc([-0.9, 0, 0.9], [-4, 0, 4.5], easeOut(blown), 1.6);
  const inhale = ramp(f, DSNZ - 20, DSNZ) * (1 - ramp(f, DSNZ, DSNZ + 4));
  const snz = ramp(f, DSNZ, DSNZ + 4) * (1 - ramp(f, DSNZ + 16, DSNZ + 26));
  return (
    <>
      <Cam pos={[0.6, 1.9, 5.8]} look={[0, 1.6, 0]} fov={52} f={f} a={a} />
      <ClassScene />
      <Toy pose={{...pose, pos: bp}} look={{...KID, jelly: 1}} palmRef={palm} />
      {blown < 0.05 && (
        <InHand palm={palm}>
          <Tissue s={1.2} />
        </InHand>
      )}
      <Dino p={{pos: [1.1, 0, 0.0], rotY: -0.5, t, glasses: true, backpack: true, jaw: 0.5 * inhale + snz, headTilt: -0.5 * inhale + 0.5 * snz, blink: snz > 0.3 ? 1 : 0, sneeze: inhale, arms: 0.3 * inhale}} s={1.05} />
      <group position={[0.6, 2.4, 0.5]} rotation={[0, -2.1, 0]}>
        <SneezeBlast p={[0, 0, 0]} k={(f - DSNZ) / 16} />
      </group>
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "primeiro"), Comp: S1},
  {from: L(1), Comp: S2},
  {from: L(2), Comp: S3},
  {from: L(3), Comp: S4},
  {from: L(4), Comp: S5},
  {from: L(5), Comp: S6},
  {from: L(6), Comp: S7},
  {from: L(7), Comp: S8},
  {from: L(8), Comp: S9},
  {from: QUAKE - 4, Comp: S10},
  {from: L(9), Comp: S11},
  {from: L(10), Comp: S12},
  {from: L(11), Comp: S13},
  {from: L(12), Comp: S14},
  {from: L(13), Comp: S15},
  {from: L(14), Comp: S16},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_ESCOLA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["faltar", "aula", "escola", "doente", "espirra", "porta", "espirro", "estrategico", "gripe", "telhado", "quente", "escorrendo", "gigante", "alunos", "voando", "janela", "epidemia", "predial", "piscina", "gelatina", "morango", "pouso", "gelatinoso", "treme", "cidade", "balancar", "terremoto", "dinossauro", "massinha", "estudar", "milhoes", "atrasado", "intercambio", "jurassico", "carteira", "prova", "dez", "parabens", "nota", "novo"]);
const Atchim: React.FC<{from: number; x: number; y: number; size?: number}> = ({from, x, y, size = 120}) => {
  const f = useCurrentFrame();
  if (f < from || f > from + 30) return null;
  const s = pop(f, from, 8) * (1 - ramp(f, from + 22, from + 30));
  return (
    <div style={{position: "absolute", left: x - 400, top: y, width: 800, textAlign: "center", fontFamily, fontWeight: 900, fontSize: size, color: "#9ee86a", ...STROKE, transform: `scale(${s}) rotate(-8deg)`}}>
      ATCHIM!
    </div>
  );
};
const Stamp10: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = f - from < 6 ? lerp(2.4, 1, easeOut((f - from) / 6)) : 1;
  return (
    <div style={{position: "absolute", top: 820, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{width: 300, height: 300, borderRadius: 150, border: "18px solid #e8262d", color: "#e8262d", fontFamily, fontWeight: 900, fontSize: 190, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${s}) rotate(-12deg)`, background: "rgba(255,255,255,0.85)"}}>10</div>
    </div>
  );
};

/* ======================= vídeo ======================= */
const FX = 0.3;
const MUSIC = 0.125;
export const VideoEscola: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const pb = L(13);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <StageTitle from={L(2) + 4} to={L(3) - 3} lines={["ESPIRRO", "ESTRATÉGICO"]} />
      <StageTitle from={L(5) + 4} to={L(6) - 3} lines={["EPIDEMIA", "PREDIAL"]} />
      <StageTitle from={L(7) + 4} to={L(8) - 3} lines={["POUSO", "GELATINOSO"]} />
      <StageTitle from={L(9) + 4} to={L(10) - 3} lines={["TERREMOTO", "DE MORANGO"]} />
      <StageTitle from={L(11) + 4} to={L(12) - 3} lines={["INTERCÂMBIO", "JURÁSSICO"]} />

      <Chip from={6} to={at(0, "primeiro") - 2} text="⏰ SEGUNDA-FEIRA, 6:30" bg="#e8412c" top={300} size={68} />
      <Atchim from={SNZ} x={540} y={520} />
      <Chip from={at(3, "quente") + 2} to={at(3, "e", 0) - 2} text="🌡️ 40°" bg="#e8412c" top={300} size={96} />
      <Atchim from={BIG} x={540} y={420} size={190} />
      <Chip from={at(6, "gelatina") - 2} to={L(7) - 2} text="SPLOFT!" bg="#e3263a" top={300} size={100} rot={4} />
      <Chip from={at(10, "sessenta") - 2} to={L(11) - 2} text="65 MILHÕES DE ANOS DE ATRASO" bg="#2f9e5a" top={300} size={56} />
      <Stamp10 from={TEN} to={L(13) - 2} />
      <Atchim from={DSNZ} x={540} y={420} size={190} />
      <Sparkles from={L(2)} to={L(3) - 2} x={540} y={900} />
      <Confetti from={pb} to={pb + 100} />
      <Chip from={pb + 1} to={at(13, "faltou") - 2} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(13, "faltou")} to={L(14) - 2} x={250} y={420} rot={-6} label="FALTOU">
        <g transform="translate(152,100)">
          <rect x={-70} y={-55} width={140} height={115} rx={12} fill="#fff" stroke="#101018" strokeWidth={6} />
          <rect x={-70} y={-55} width={140} height={30} rx={10} fill="#e8412c" stroke="#101018" strokeWidth={6} />
          <path d="M -30 0 L -5 30 L 40 -25" stroke="#2ecc71" strokeWidth={12} fill="none" strokeLinecap="round" />
        </g>
      </Sticker>
      <Sticker from={at(13, "gelatina")} to={L(14) - 2} x={830} y={430} rot={5} label="GELATINA">
        <g transform="translate(152,110)">
          <path d="M -70 40 L -55 -40 Q 0 -70 55 -40 L 70 40 Z" fill="#e3263a" stroke="#101018" strokeWidth={6} />
          <ellipse cx={0} cy={-42} rx={56} ry={14} fill="#ff6070" stroke="#101018" strokeWidth={5} />
        </g>
      </Sticker>
      <Sticker from={at(13, "dinossauro")} to={L(14) - 2} x={540} y={1060} rot={-3} label="DINO 10 × 0 VOCÊ">
        <g transform="translate(152,105)">
          <ellipse cx={-20} cy={20} rx={60} ry={42} fill="#6cc24a" stroke="#101018" strokeWidth={6} />
          <circle cx={40} cy={-30} r={38} fill="#6cc24a" stroke="#101018" strokeWidth={6} />
          <circle cx={52} cy={-38} r={8} fill="#101018" />
          <path d="M -60 -10 L -48 -40 L -36 -12 M -30 -18 L -18 -48 L -6 -20" fill="#ff9f40" stroke="#101018" strokeWidth={4} />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozescola.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 20) * (1 - ramp(fr, TOTAL_ESCOLA - 30, TOTAL_ESCOLA))} />
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 3} durationInFrames={25}>
          <Audio src={staticFile("sfx7/whoosh.mp3")} volume={FX * 0.18} />
        </Sequence>
      ))}
      {[L(2), L(5), L(7), L(9), L(11)].map((b) => (
        <Sequence key={"b" + b} from={b + 3} durationInFrames={32}>
          <Audio src={staticFile("sfx7/boing.mp3")} volume={FX * 0.75} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={at(0, "primeiro") - 4}>
        <Audio src={staticFile("sfx9/alarm.mp3")} volume={FX * 0.55} />
      </Sequence>
      <Sequence from={SNZ - 4} durationInFrames={45}>
        <Audio src={staticFile("sfx9/sneeze.mp3")} volume={FX * 0.9} />
      </Sequence>
      <Sequence from={at(3, "gripe") - 4} durationInFrames={45}>
        <Audio src={staticFile("sfx9/sniffle.mp3")} volume={FX * 0.7} />
      </Sequence>
      <Sequence from={BIG - 8} durationInFrames={90}>
        <Audio src={staticFile("sfx9/bigsneeze.mp3")} volume={FX * 1.0} />
      </Sequence>
      <Sequence from={FLY0} durationInFrames={90}>
        <Audio src={staticFile("sfx9/yay.mp3")} volume={FX * 0.7} />
      </Sequence>
      {Array.from({length: 4}, (_, i) => (
        <Sequence key={"sp" + i} from={landT(i * 3) - 2} durationInFrames={60}>
          <Audio src={staticFile("sfx9/splat.mp3")} volume={FX * (0.8 - i * 0.12)} />
        </Sequence>
      ))}
      <Sequence from={L(7)} durationInFrames={L(9) - L(7)}>
        <Audio src={staticFile("sfx9/wobble.mp3")} volume={(fr) => FX * 0.6 * clamp(fr / 10)} loop />
      </Sequence>
      <Sequence from={at(8, "treme") - 4} durationInFrames={L(10) - at(8, "treme") + 10}>
        <Audio src={staticFile("sfx9/quake.mp3")} volume={(fr) => FX * 0.9 * clamp(fr / 15) * (1 - ramp(fr, L(10) - at(8, "treme") - 10, L(10) - at(8, "treme") + 10))} loop />
      </Sequence>
      <Sequence from={L(9) + 4} durationInFrames={60}>
        <Audio src={staticFile("sfx9/crack.mp3")} volume={FX * 0.8} />
      </Sequence>
      <Sequence from={RISE0 - 6} durationInFrames={60}>
        <Audio src={staticFile("sfx9/crack.mp3")} volume={FX * 0.7} />
      </Sequence>
      <Sequence from={at(10, "massinha") - 6} durationInFrames={60}>
        <Audio src={staticFile("sfx9/yawn.mp3")} volume={FX * 0.8} />
      </Sequence>
      <Sequence from={at(10, "estudar")} durationInFrames={60}>
        <Audio src={staticFile("sfx9/roar.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={L(11) - 4} durationInFrames={70}>
        <Audio src={staticFile("sfx9/bell.mp3")} volume={FX * 0.5} />
      </Sequence>
      <Sequence from={L(12) + 10} durationInFrames={TEN - L(12) - 10}>
        <Audio src={staticFile("sfx9/pencil.mp3")} volume={FX * 0.8} loop />
      </Sequence>
      <Sequence from={TEN - 1} durationInFrames={30}>
        <Audio src={staticFile("sfx9/stamp.mp3")} volume={FX * 0.9} />
      </Sequence>
      {[at(13, "faltou"), at(13, "gelatina"), at(13, "dinossauro")].map((p, i) => (
        <Sequence key={"p" + i} from={p} durationInFrames={22}>
          <Audio src={staticFile("sfx7/pof.mp3")} volume={FX * 0.55} />
        </Sequence>
      ))}
      <Sequence from={pb - 2} durationInFrames={61}>
        <Audio src={staticFile("sfx7/confetti.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={DSNZ - 8} durationInFrames={90}>
        <Audio src={staticFile("sfx9/bigsneeze.mp3")} volume={FX * 0.9} />
      </Sequence>
    </AbsoluteFill>
  );
};
