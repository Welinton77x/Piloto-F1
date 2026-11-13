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
import {Sky, SunDisc, SunLight, Town, Clouds, V3} from "./Sets5";
import {Planet} from "./Sets8";
import {Alien} from "./Sets9";
import {Puff} from "./Sets10";
import {
  ChefHat,
  Shades,
  BakeKitchen,
  Oven,
  Fridge,
  ColdMist,
  Snowfall,
  FlourSack,
  FlourSnowman,
  Penguin,
  EggBowl,
  Chick,
  ChickP,
  Shell,
  Batter,
  Podium,
  FlyingKitchen,
  UFO,
  PartyLights,
  Radio,
  OVEN_P,
  FRIDGE_P,
  ISLAND,
  ISLAND_TOP,
  SINK_P,
} from "./Sets11";
import {Captions, StageTitle, Chip, Sparkles, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, rng} from "./util";
import W from "./timingBolo.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
/** termina logo depois do "medo?" pra emendar no começo (loop) */
export const TOTAL_BOLO = F(words[words.length - 1].e + 0.35);

const CHEF: ToyLook = {hoodie: true, apron: true};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const mix = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
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

/* ---------- o menino cozinheiro ---------- */
const BOY: V3 = [ISLAND[0], 0, ISLAND[2] - 0.85];
const CROSSED: Pose = {rShoulder: [-1.15, 0, 0.6], rElbow: -1.45, lShoulder: [-1.05, 0, -0.6], lElbow: -1.45};
const HANDS_HEAD: Pose = {rShoulder: [-2.5, 0, 0.35], rElbow: -1.9, lShoulder: [-2.5, 0, -0.35], lElbow: -1.9};
const Chef: React.FC<{f: number; pose: Pose; shades?: number; glint?: number; palmRef?: React.Ref<THREE.Object3D>; lPalmRef?: React.Ref<THREE.Object3D>}> = ({pose, shades = 1, glint = 0, palmRef, lPalmRef}) => (
  <Toy
    pose={pose}
    look={CHEF}
    palmRef={palmRef}
    lPalmRef={lPalmRef}
    headExtra={
      <>
        <ChefHat />
        <Shades k={shades} glint={glint} />
      </>
    }
  />
);
const shiver = (t: number, k: number) => k * 0.05 * Math.sin(t * 45);

/* ---------- ambientes ---------- */
const KitchenScene: React.FC<{t: number; frozen?: number; flour?: number; space?: boolean}> = ({t, frozen = 0, flour = 0, space = false}) => (
  <>
    <color attach="background" args={[space ? "#0a0f2a" : "#fff6e6"]} />
    <hemisphereLight args={[space ? "#dfe6ff" : "#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0.3, 3.2, 1.0]} intensity={11} distance={12} decay={1.4} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[2, 4, 5]} intensity={0.5} />
    {frozen > 0.01 && <pointLight position={[-1.5, 2.5, 1.5]} intensity={5 * frozen} distance={10} decay={1.6} color="#9fd8ff" />}
    <BakeKitchen frozen={frozen} flour={flour} space={space} />
    {frozen > 0.01 && <Snowfall c={[0, 0, -0.5]} size={[6, 3.4, 5]} k={0.35 * frozen} t={t} n={90} />}
    {flour > 0.01 && <Snowfall c={[0, 0, -0.5]} size={[6, 3.4, 5]} k={flour} t={t} n={220} />}
  </>
);
/** objetos da bancada (mudam ao longo do vídeo) */
const EGG_P: V3 = [ISLAND[0] - 0.62, ISLAND_TOP, ISLAND[2] + 0.05];
const BATTER_P: V3 = [ISLAND[0] + 0.55, ISLAND_TOP, ISLAND[2] + 0.05];
const SACK_P: V3 = [ISLAND[0] + 1.0, ISLAND_TOP, ISLAND[2] - 0.15];
const Props: React.FC<{f: number; t: number; eggs?: boolean; eggShake?: number; eggEyes?: number; eggScared?: number; crack?: number; sack?: boolean; batterBowl?: boolean; batter?: React.ReactNode; oven?: Partial<React.ComponentProps<typeof Oven>["o"]>; fridge?: Partial<React.ComponentProps<typeof Fridge>["f"]>}> = ({f, t, eggs = true, eggShake = 0, eggEyes = 0, eggScared = 0, crack = 0, sack = true, batterBowl = true, batter, oven = {}, fridge = {}}) => (
  <>
    <Oven p={OVEN_P} o={{mood: 0.8, t, blink: blinkCurve(f + 51), ...oven}} />
    <Fridge p={FRIDGE_P} f={{t, blink: blinkCurve(f + 23), ...fridge}} />
    {eggs && <EggBowl p={EGG_P} shake={eggShake} eyes={eggEyes} scared={eggScared} crack={crack} t={t} />}
    {sack && <FlourSack p={SACK_P} r={[0, -0.4, 0]} />}
    {batterBowl && (
      <group position={BATTER_P}>
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.33, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#9fd8ff" roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.13, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.3, 28]} />
          <meshStandardMaterial color="#f7dd8f" roughness={0.15} />
        </mesh>
        {batter}
      </group>
    )}
  </>
);

/* =================== 1 — o óculos escuro (disfarce culinário) =================== */
const OCULOS = at(0, "oculos");
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 90);
  const pose = physics("b0" + a, (fr) => ({...idle(fr), pos: BOY, rotY: 0.25, torso: [0, 0, shiver(fr / FPS, 0.6)], rShoulder: [-0.6, 0, 0.3], rElbow: -1.3, lShoulder: [-0.6, 0, -0.3], lElbow: -1.3, eyeWide: 0.8, brow: 0.9, mouthOpen: 0.25, head: [0, 0.35, 0], pupil: [1, 0]}), a, f);
  return (
    <>
      <Cam pos={[lerp(0.5, 0.35, k), 1.85, lerp(4.6, 3.9, k)]} look={[0.55, 1.3, -1.5]} fov={52} f={f} a={a} />
      <KitchenScene t={t} />
      <Props f={f} t={t} oven={{mood: 1, rage: 0.4 + 0.2 * Math.sin(t * 3)}} />
      <Chef f={f} pose={pose} shades={0} />
    </>
  );
};
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const put = easeInOut(ramp(f, a + 4, OCULOS + 6));
  const pose = physics("b1" + a, (fr) => {
    const p = ramp(fr, a + 2, a + 10) * (1 - ramp(fr, OCULOS + 8, OCULOS + 16));
    return {...idle(fr), pos: BOY, rotY: 0, torso: [0, 0, shiver(fr / FPS, 0.5 * (1 - put))], rShoulder: [lerp(-0.2, -2.5, p), 0, lerp(-0.1, 0.45, p)], rElbow: lerp(-0.2, -1.7, p), lShoulder: [lerp(-0.2, -2.5, p), 0, lerp(0.1, -0.45, p)], lElbow: lerp(-0.2, -1.7, p), smile: put, brow: lerp(0.8, -0.4, put), mouthOpen: 0.2 * (1 - put), head: [0.05, 0, 0.1 * put]};
  }, a, f);
  return (
    <>
      <Cam pos={[0.25, 1.8, lerp(1.15, 0.9, clamp((f - a) / 80))]} look={[0.2, 1.68, -1.55]} fov={40} f={f} a={a} punch={4} />
      <KitchenScene t={t} />
      <Props f={f} t={t} />
      <Chef f={f} pose={pose} shades={put} glint={ramp(f, OCULOS + 6, OCULOS + 10) * (1 - ramp(f, OCULOS + 14, OCULOS + 22))} />
    </>
  );
};
/* "Assim o forno não vê o medo nos seus olhos." — o forno desconfiado */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("b2" + a, (fr) => ({...idle(fr), pos: BOY, rotY: 0.55, ...CROSSED, smile: 0.8, brow: -0.4, head: [0, 0.2, 0.08]}), a, f);
  return (
    <>
      <Cam pos={[-1.0, 1.95, 2.4]} look={[1.0, 1.25, -2.0]} fov={50} f={f} a={a} />
      <KitchenScene t={t} />
      <Props f={f} t={t} oven={{mood: 1, blink: 0.55, rage: 0.2}} />
      <Chef f={f} pose={pose} />
    </>
  );
};
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("b3" + a, (fr) => ({...idle(fr), pos: BOY, rotY: 0.2, ...CROSSED, smile: 1, brow: -0.5, head: [-0.05, 0.1, 0.1]}), a, f);
  return (
    <>
      <Cam pos={[0.45, 1.75, 3.6]} look={[0.6, 1.25, -1.6]} fov={50} f={f} a={a} />
      <KitchenScene t={t} />
      <Props f={f} t={t} oven={{mood: 1, blink: 0.5 + 0.2 * Math.sin(t * 2)}} />
      <Chef f={f} pose={pose} glint={0.5 + 0.5 * Math.sin(t * 4)} />
    </>
  );
};

/* =================== 2 — a geladeira apaixonada (paixão congelada) =================== */
const LOVE = at(2, "apaixona");
const OPEN = at(2, "porta");
const FREEZE = at(2, "congela");
const frozenK = (f: number) => ramp(f, OPEN + 6, FREEZE + 4);
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("b4" + a, (fr) => ({...idle(fr), pos: BOY, rotY: -0.15, rShoulder: [-1.9, 0, 0.5], rElbow: -1.9, lShoulder: [-0.2, 0, 0.3], lElbow: -1.2, smile: 1, brow: -0.3, head: [0.05, -0.15, -0.12]}), a, f);
  return (
    <>
      <Cam pos={[0.0, 1.7, 1.1]} look={[0.2, 1.55, -1.55]} fov={42} f={f} a={a} />
      <KitchenScene t={t} />
      <Props f={f} t={t} />
      <Chef f={f} pose={pose} glint={1} />
    </>
  );
};
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const love = ramp(f, LOVE - 4, LOVE + 4);
  return (
    <>
      <Cam pos={[FRIDGE_P[0] + 0.35, 1.75, FRIDGE_P[2] + 2.3]} look={[FRIDGE_P[0], 1.6, FRIDGE_P[2]]} fov={44} f={f} a={a} />
      <KitchenScene t={t} />
      <Props f={f} t={t} fridge={{love, t}} />
    </>
  );
};
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const open = easeInOut(ramp(f, OPEN - 4, OPEN + 10));
  const fz = frozenK(f);
  const pose = physics("b6" + a, (fr) => ({...idle(fr), pos: BOY, rotY: -0.6, torso: [0, 0, shiver(fr / FPS, frozenK(fr))], rShoulder: [-1.0, 0, 0.6], rElbow: -1.5, lShoulder: [-1.0, 0, -0.6], lElbow: -1.5, eyeWide: 0.8 * fz, mouthOpen: 0.3 * fz, brow: 0.8 * fz}), a, f);
  return (
    <>
      <Cam pos={[-0.25, 1.95, 3.9]} look={[-0.55, 1.25, -1.6]} fov={52} f={f} a={a} />
      <KitchenScene t={t} frozen={fz} />
      <Props f={f} t={t} fridge={{love: 1, open, t}} />
      <ColdMist p={[FRIDGE_P[0] + 0.2, 0, FRIDGE_P[2] + 0.55]} k={open} t={t} dir={[0.75, 0, 0.6]} />
      <Chef f={f} pose={pose} />
    </>
  );
};
/* título: a geladeira mandando beijinho, o menino congelado */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("b7" + a, (fr) => ({...idle(fr), pos: BOY, rotY: -0.3, torso: [0, 0, shiver(fr / FPS, 1)], ...CROSSED, rShoulder: [-1.2, 0, 0.75], lShoulder: [-1.1, 0, -0.75], smile: 0, mouthOpen: 0.15, brow: 0.9, eyeWide: 0.5}), a, f);
  return (
    <>
      <Cam pos={[-0.55, 1.75, 2.5]} look={[-0.75, 1.45, -1.9]} fov={50} f={f} a={a} />
      <KitchenScene t={t} frozen={1} />
      <Props f={f} t={t} fridge={{love: 1, open: 1, kiss: Math.sin(t * 3) > 0 ? 1 : 0, t}} />
      <ColdMist p={[FRIDGE_P[0] + 0.2, 0, FRIDGE_P[2] + 0.55]} k={0.6} t={t} dir={[0.75, 0, 0.6]} />
      <Chef f={f} pose={pose} />
    </>
  );
};

/* =================== 3 — a farinha explode (nevasca de trigo) =================== */
const EXPLODE = at(4, "explode");
const PINGUIM = at(4, "pinguim");
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const boom = f >= EXPLODE + 2;
  const pose = physics("b8" + a, (fr) => ({...idle(fr), pos: BOY, rotY: 0, torso: [0, 0, shiver(fr / FPS, 1)], rShoulder: [-0.9, 0, 0.35], rElbow: -1.4, lShoulder: [-0.9, 0, -0.35], lElbow: -1.4, eyeWide: 0.6, brow: 0.8, mouthOpen: 0.2}), a, f);
  return (
    <>
      <Cam pos={[0.25, 1.65, 1.6]} look={[0.2, 1.35, -1.4]} fov={46} f={f} a={a} />
      <KitchenScene t={t} frozen={1} flour={ramp(f, EXPLODE + 2, EXPLODE + 16)} />
      <Props f={f} t={t} sack={false} />
      {!boom && <Chef f={f} pose={pose} palmRef={palm} />}
      {!boom && (
        <InHand palm={palm}>
          <group rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.1]}>
            <FlourSack p={[0, -0.2, 0]} s={1.0} burst={ramp(f, EXPLODE - 4, EXPLODE + 2)} />
          </group>
        </InHand>
      )}
      {boom && <FlourSnowman p={BOY} k={ramp(f, EXPLODE + 4, EXPLODE + 10)} t={t} shiver={1} />}
      <Puff p={[BOY[0], 0.6, BOY[2] + 0.4]} k={(f - EXPLODE) / 26} />
    </>
  );
};
/* "...e começa a nevar dentro da cozinha" */
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.4, 1.95, 4.0]} look={[0.3, 1.25, -1.5]} fov={52} f={f} a={a} />
    <KitchenScene t={t} frozen={1} flour={1} />
    <Props f={f} t={t} sack={false} />
    <FlourSnowman p={BOY} t={t} shiver={1} />
  </>
);
/* "Do nada, aparece um pinguim pedindo a senha do wi-fi." */
const PENG = (f: number): V3 => mix([-3.6, 0, 0.6], [-1.0, 0, 0.5], clamp((f - (PINGUIM - 26)) / 26));
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const walking = f < PINGUIM;
  return (
    <>
      <Cam pos={[-0.25, 1.55, 3.9]} look={[-0.55, 1.0, -0.3]} fov={48} f={f} a={a} />
      <KitchenScene t={t} frozen={1} flour={1} />
      <Props f={f} t={t} sack={false} />
      <FlourSnowman p={BOY} t={t} shiver={0.6} />
      <Penguin p={PENG(f)} rotY={walking ? 1.4 : 0.4} t={t} walk={walking ? 1 : 0} phone={!walking} blink={blinkCurve(f + 7)} s={1.15} />
    </>
  );
};
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.15, 1.6, 3.5]} look={[-0.4, 1.1, -0.6]} fov={48} f={f} a={a} />
    <KitchenScene t={t} frozen={1} flour={1} />
    <Props f={f} t={t} sack={false} />
    <FlourSnowman p={BOY} rotY={-0.4} t={t} shiver={0.6} />
    <Penguin p={[-1.0, 0, 0.5]} rotY={0.9} t={t} phone blink={blinkCurve(f + 7)} s={1.15} />
  </>
);

/* =================== 4 — os ovos com medo (pânico galináceo) =================== */
const OVOS = at(6, "ovos");
const FICAM = at(6, "ficam");
const CHOCAM = at(6, "chocam");
const HATCH = CHOCAM + 4;
const N_CHICKS = 20;
const chickData = (() => {
  const r = rng(31);
  return Array.from({length: N_CHICKS}, (_, i) => ({ph: r() * Math.PI * 2, rad: 0.25 + r() * 0.5, sp: 1.6 + r() * 1.4, dir: i % 2 ? 1 : -1, s: 1.15 + r() * 0.35}));
})();
/** pintinhos correndo em círculo em cima da ilha */
const RunningChicks: React.FC<{f: number; t: number; k?: number; panic?: number}> = ({f, t, k = 1, panic = 1}) => (
  <>
    {chickData.map((c, i) => {
      if (k * N_CHICKS < i + 1) return null;
      const th = c.ph + c.dir * t * c.sp * panic;
      const x = ISLAND[0] + Math.cos(th) * c.rad * 1.9;
      const z = ISLAND[2] + Math.sin(th) * c.rad * 0.75;
      const ry = Math.atan2(-Math.sin(th) * c.dir, Math.cos(th) * c.dir) + Math.PI / 2;
      return <Chick key={i} c={{pos: [x, ISLAND_TOP, z], rotY: ry, run: panic, t: t + i, peep: Math.abs(Math.sin(t * 9 + i)), blink: blinkCurve(f + i * 7), s: c.s, flap: panic * 0.6}} />;
    })}
  </>
);
const S12: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[EGG_P[0] + 0.35, 1.35, EGG_P[2] + 0.95]} look={[EGG_P[0], 1.08, EGG_P[2]]} fov={42} f={f} a={a} />
    <KitchenScene t={t} frozen={1} flour={1} />
    <Props f={f} t={t} sack={false} eggEyes={backOut(ramp(f, OVOS - 2, OVOS + 6))} />
    <FlourSnowman p={BOY} t={t} shiver={1} />
  </>
);
const S13: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[EGG_P[0] + 0.2, 1.25, EGG_P[2] + 0.7]} look={[EGG_P[0], 1.1, EGG_P[2]]} fov={40} f={f} a={a} />
    <KitchenScene t={t} frozen={1} flour={1} />
    <Props f={f} t={t} sack={false} eggEyes={1} eggScared={ramp(f, a, a + 6)} eggShake={ramp(f, a, a + 8)} />
    <FlourSnowman p={BOY} t={t} shiver={1} />
  </>
);
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const hatched = f >= HATCH;
  return (
    <>
      <Cam pos={[EGG_P[0] + 0.6, 1.55, EGG_P[2] + 1.6]} look={[EGG_P[0] + 0.2, 1.05, EGG_P[2] - 0.1]} fov={46} f={f} a={a} />
      <KitchenScene t={t} frozen={1} flour={1} />
      <Props f={f} t={t} sack={false} eggs={!hatched} eggEyes={1} eggScared={1} eggShake={1} crack={ramp(f, CHOCAM - 6, HATCH)} />
      {hatched && (
        <>
          <group position={EGG_P}>
            <mesh position={[0, 0.13, 0]}>
              <sphereGeometry args={[0.3, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              <meshStandardMaterial color="#ff8fab" roughness={0.35} side={THREE.DoubleSide} />
            </mesh>
          </group>
          {[0, 1, 2, 3, 4].map((i) => {
            const ang = (i / 5) * Math.PI * 2;
            return <Shell key={i} p={[EGG_P[0] + Math.cos(ang) * 0.42, ISLAND_TOP, EGG_P[2] + Math.sin(ang) * 0.3]} r={ang} />;
          })}
          {chickData.slice(0, 8).map((c, i) => {
            const k = clamp((f - HATCH - i * 2) / 10);
            const ang = (i / 8) * Math.PI * 2;
            const p: V3 = [EGG_P[0] + Math.cos(ang) * 0.5 * k, ISLAND_TOP + 0.25 * Math.sin(k * Math.PI), EGG_P[2] + Math.sin(ang) * 0.3 * k];
            return <Chick key={i} c={{pos: p, rotY: -ang + Math.PI / 2, t: t + i, peep: Math.abs(Math.sin(t * 10 + i)), run: k, s: c.s, flap: 1 - k}} />;
          })}
        </>
      )}
      <FlourSnowman p={BOY} t={t} shiver={1} />
    </>
  );
};
const S15: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.35, 2.1, 2.6]} look={[0.2, 1.1, -0.8]} fov={50} f={f} a={a} />
    <KitchenScene t={t} frozen={0.7} flour={1} />
    <Props f={f} t={t} sack={false} eggs={false} />
    <RunningChicks f={f} t={t} />
    <FlourSnowman p={BOY} t={t} shiver={1} />
  </>
);

/* =================== 5 — banda de pagode na pia (pagode emplumado) =================== */
const MUSICA = at(8, "musica");
const BANDA = at(8, "banda");
const RADIO_P: V3 = [ISLAND[0] - 0.9, ISLAND_TOP, ISLAND[2] + 0.1];
const BAND: {x: number; inst: ChickP["inst"]; hat?: boolean}[] = [
  {x: -0.75, inst: "pandeiro"},
  {x: -0.35, inst: "cavaco"},
  {x: 0.05, inst: "mic", hat: true},
  {x: 0.45, inst: "pandeiro"},
];
const Band: React.FC<{f: number; t: number}> = ({f, t}) => (
  <>
    {BAND.map((b, i) => (
      <Chick key={i} c={{pos: [SINK_P[0] + b.x, 0.965, SINK_P[2] + 0.2], rotY: 0, inst: b.inst, play: 1, t: t + i * 0.3, hat: b.hat, peep: b.inst === "mic" ? Math.abs(Math.sin(t * 8)) : 0, jump: 0.03 * Math.abs(Math.sin(t * 7 + i)), blink: blinkCurve(f + i * 9), s: 1.6}} />
    ))}
    <PartyLights p={[SINK_P[0], 1.0, SINK_P[2]]} t={t} />
  </>
);
const DancingChicks: React.FC<{f: number; t: number}> = ({f, t}) => (
  <>
    {chickData.slice(4, 16).map((c, i) => {
      const x = ISLAND[0] - 1.0 + (i % 6) * 0.4;
      const z = ISLAND[2] - 0.25 + Math.floor(i / 6) * 0.4;
      return <Chick key={i} c={{pos: [x, ISLAND_TOP, z], rotY: Math.PI + 0.3 * Math.sin(t * 4 + i), t: t + i, jump: 0.05 * Math.abs(Math.sin(t * 7 + i)), flap: 0.5, blink: blinkCurve(f + i * 5), s: c.s}} />;
    })}
  </>
);
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const shake = ramp(f, a, a + 10);
  const shook = f >= a + 12;
  const press = ramp(f, MUSICA - 8, MUSICA - 2) * (1 - ramp(f, MUSICA + 4, MUSICA + 10));
  const pose = physics("b16" + a, (fr) => ({...idle(fr), pos: BOY, rotY: -0.35, rShoulder: [lerp(-0.2, -1.1, ramp(fr, MUSICA - 12, MUSICA - 4)), 0, 0.3], rElbow: -0.4, smile: 0.8, mouthOpen: 0.15}), a, f);
  return (
    <>
      <Cam pos={[-0.3, 1.6, 1.9]} look={[-0.2, 1.2, -1.2]} fov={46} f={f} a={a} />
      <KitchenScene t={t} flour={0.6} />
      <Props f={f} t={t} sack={false} eggs={false} />
      <Radio p={RADIO_P} r={[0, 0.3, 0]} on={ramp(f, MUSICA, MUSICA + 4)} t={t} s={1 - 0.05 * press} />
      <RunningChicks f={f} t={t} k={0.6} panic={1 - ramp(f, MUSICA, MUSICA + 20)} />
      {shook ? <Chef f={f} pose={pose} /> : <FlourSnowman p={BOY} t={t} shiver={shake} />}
      <Puff p={[BOY[0], 0.4, BOY[2]]} k={(f - a - 4) / 22} />
    </>
  );
};
const S17: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[SINK_P[0] + 0.35, 1.45, SINK_P[2] + 2.0]} look={[SINK_P[0], 1.15, SINK_P[2]]} fov={44} f={f} a={a} />
    <KitchenScene t={t} flour={0.4} />
    <Props f={f} t={t} sack={false} eggs={false} />
    <Band f={f} t={t} />
    <Penguin p={[SINK_P[0] + 0.9, 0, SINK_P[2] + 1.1]} rotY={-0.6} t={t} dance={1} blink={blinkCurve(f + 7)} />
  </>
);
const S18: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[SINK_P[0] - 0.1, 1.5, SINK_P[2] + 1.45]} look={[SINK_P[0] - 0.1, 1.2, SINK_P[2]]} fov={44} f={f} a={a} />
    <KitchenScene t={t} flour={0.4} />
    <Props f={f} t={t} sack={false} eggs={false} />
    <Band f={f} t={t} />
    <Penguin p={[SINK_P[0] + 0.85, 0, SINK_P[2] + 0.9]} rotY={-0.7} t={t} dance={1} blink={blinkCurve(f + 7)} />
  </>
);

/* =================== 6 — a massa vira prefeita (democracia de massa) =================== */
const VIDA = at(10, "vida");
const CANDIDATA = at(10, "candidata");
const GANHA = at(10, "ganha", 1);
const PODIUM_P: V3 = [ISLAND[0] + 0.1, ISLAND_TOP, ISLAND[2] - 0.05];
const MayorOnPodium: React.FC<{f: number; t: number; arms?: "down" | "up" | "wave" | "shake"; crown?: number; mouth?: number}> = ({f, t, arms = "wave", crown = 0, mouth = 0.3}) => (
  <>
    <Podium p={PODIUM_P} s={0.9} />
    <Batter b={{pos: [PODIUM_P[0], PODIUM_P[1] + 0.36, PODIUM_P[2] - 0.1], sash: true, t, arms, crown, mouth, blink: blinkCurve(f + 13), dance: 0.3, s: 1.3}} />
  </>
);
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const rise = backOut(ramp(f, VIDA - 4, VIDA + 10));
  return (
    <>
      <Cam pos={[BATTER_P[0] + 0.25, 1.55, BATTER_P[2] + 1.9]} look={[BATTER_P[0], 1.25, BATTER_P[2]]} fov={44} f={f} a={a} />
      <KitchenScene t={t} />
      <Props f={f} t={t} sack={false} eggs={false} batter={<Batter b={{pos: [0, 0.05, 0], rise, dance: ramp(f, VIDA + 8, VIDA + 16), t, blink: blinkCurve(f + 13), mouth: 0.4, s: 1.15, arms: "down"}} />} />
      <Band f={f} t={t} />
    </>
  );
};
const Crowd: React.FC<{f: number; t: number; cheer?: number}> = ({f, t, cheer = 0}) => {
  const pose = (fr: number): Pose => ({...idle(fr), pos: [ISLAND[0] - 0.35, 0, ISLAND[2] + 1.1], rotY: Math.PI - 0.2, rShoulder: [lerp(-0.3, -2.7, cheer), 0, -0.4], lShoulder: [lerp(-0.3, -2.7, cheer), 0, 0.4], rElbow: -0.3, lElbow: -0.3, smile: 1, mouthOpen: 0.4 * cheer});
  return (
    <>
      <Chef f={f} pose={pose(f)} />
      <Penguin p={[ISLAND[0] + 0.55, 0, ISLAND[2] + 1.15]} rotY={Math.PI + 0.3} t={t} dance={cheer} blink={blinkCurve(f + 7)} />
      {chickData.slice(0, 10).map((c, i) => (
        <Chick key={i} c={{pos: [ISLAND[0] - 1.0 + (i % 5) * 0.2 + (i > 4 ? 1.35 : 0), ISLAND_TOP, ISLAND[2] + 0.3 + (i % 2) * 0.12], rotY: Math.PI * 0 + 0.4 * Math.sin(i), t: t + i, jump: cheer * 0.08 * Math.abs(Math.sin(t * 8 + i)), flap: cheer, peep: cheer * Math.abs(Math.sin(t * 9 + i)), s: c.s}} />
      ))}
    </>
  );
};
const S20: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PODIUM_P[0] + 0.2, 1.6, PODIUM_P[2] + 2.3]} look={[PODIUM_P[0], 1.42, PODIUM_P[2]]} fov={44} f={f} a={a} />
    <KitchenScene t={t} />
    <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} />
    <MayorOnPodium f={f} t={t} arms="wave" mouth={talk(f, a, a + 60) * 1.2} />
  </>
);
const S21: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PODIUM_P[0] + 0.25, 2.55, PODIUM_P[2] + 3.6]} look={[PODIUM_P[0], 1.35, PODIUM_P[2]]} fov={48} f={f} a={a} />
    <KitchenScene t={t} />
    <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} />
    <MayorOnPodium f={f} t={t} arms="up" mouth={0.5} />
    <Crowd f={f} t={t} cheer={ramp(f, GANHA - 2, GANHA + 6)} />
  </>
);
const S22: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PODIUM_P[0] - 0.2, 1.6, PODIUM_P[2] + 2.3]} look={[PODIUM_P[0], 1.42, PODIUM_P[2]]} fov={44} f={f} a={a} />
    <KitchenScene t={t} />
    <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} />
    <MayorOnPodium f={f} t={t} arms="wave" mouth={0.2} />
  </>
);

/* =================== 7 — o forno desempregado vira foguete (cozinha interplanetária) =================== */
const PROIBIDO = at(12, "proibido");
const FORNO2 = at(12, "forno", 1);
const VIRA = at(12, "vira");
const DECOLA = at(12, "decola");
const S23: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.6, 1.55, 1.9]} look={[1.25, 1.2, -1.7]} fov={48} f={f} a={a} />
    <KitchenScene t={t} />
    <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} oven={{mood: lerp(-0.3, 0.6, ramp(f, PROIBIDO + 10, PROIBIDO + 30)), blink: 0.3, eyes: 1}} />
    <Podium p={PODIUM_P} s={0.9} />
    <Batter b={{pos: [PODIUM_P[0], PODIUM_P[1] + 0.36, PODIUM_P[2] - 0.1], sash: true, t, arms: "shake", mouth: talk(f, a, a + 70) * 1.2, blink: blinkCurve(f + 13), s: 1.3}} />
  </>
);
const S24: React.FC<ShotProps> = ({f, a, t}) => {
  const heat = ramp(f, a, VIRA);
  return (
    <>
      <Cam pos={[OVEN_P[0] - 0.3, 1.25, OVEN_P[2] + 2.1]} look={[OVEN_P[0], 0.85, OVEN_P[2]]} fov={44} f={f} a={a} />
      <KitchenScene t={t} />
      <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} oven={{mood: 1, rage: 1, heat, shake: heat}} />
    </>
  );
};
/* lá fora: a cozinha decola */
const KITCHEN_OUT: V3 = [6, 0, -3.4];
const S25: React.FC<ShotProps> = ({f, a, t}) => {
  const up = clamp((f - DECOLA) / 60);
  const y = 0.1 + 18 * up * up;
  return (
    <>
      <Cam pos={[6.6, 1.6 + 6 * up, 6.5]} look={[6, 1.6 + y * 0.8, -3.4]} fov={52} f={f} a={a} />
      <Sky />
      <fog attach="fog" args={["#cdeeff", 35, 120]} />
      <SunDisc p={[-40, 45, -110]} r={6} />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
      <SunLight target={[6, 0, -3]} dir={[-6, 10, 7]} intensity={2.6} ext={9} />
      <Town t={t} galo={false} flat clear={[3.4, 8.6]} />
      <Clouds t={t} />
      <FlyingKitchen p={[KITCHEN_OUT[0] + 0.03 * Math.sin(t * 50) * (1 - up), y, KITCHEN_OUT[2]]} flame={ramp(f, a, a + 10)} t={t} />
      <Puff p={[KITCHEN_OUT[0], 0, KITCHEN_OUT[2]]} k={(f - DECOLA) / 40} color="#e6e6e6" />
    </>
  );
};
/* no espaço */
const SpaceScene: React.FC = () => {
  const stars = React.useMemo(() => {
    const r = rng(77);
    return Array.from({length: 200}, () => [(r() - 0.5) * 90, (r() - 0.5) * 120, -40 - r() * 20] as V3);
  }, []);
  return (
    <>
      <color attach="background" args={["#0a0f2a"]} />
      <hemisphereLight args={["#ffffff", "#203060", 0.9]} />
      <directionalLight position={[6, 5, 8]} intensity={2.4} color="#fff4e0" />
      {stars.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08 + (i % 3) * 0.04, 6, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
};
const KS: V3 = [5.2, 1.0, 1.5];
const FloatingKitchen: React.FC<{t: number; open?: boolean}> = ({t, open = true}) => (
  <group position={[KS[0], KS[1] + 0.15 * Math.sin(t * 1.2), KS[2]]} rotation={[0.1 * Math.sin(t * 0.7), -0.5 + 0.05 * Math.sin(t), 0.06 * Math.sin(t * 0.9)]} scale={0.8}>
    <FlyingKitchen p={[0, 0, 0]} open={open} t={t} />
    {chickData.slice(0, 7).map((c, i) => (
      <Chick key={i} c={{pos: [-1.0 + i * 0.32, 0.6 + 0.3 * Math.sin(t * 1.5 + i), 0.2 * Math.cos(i)], rotY: t * 0.5 + i, t: t + i, flap: 1, s: 1.6}} />
    ))}
    <Penguin p={[0.9, 0.3 + 0.15 * Math.sin(t * 1.3), 0.2]} rotY={0.4} t={t} dance={0.5} s={0.7} />
    <Batter b={{pos: [-0.2, 0.25 + 0.1 * Math.sin(t * 1.1), 0.2], sash: true, t, s: 0.9, arms: "wave"}} />
  </group>
);
const S26: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 90);
  return (
    <>
      <Cam pos={[lerp(4.4, 4.2, k), 2.3, lerp(8.2, 7.2, k)]} look={[3.6, 1.0, 0.6]} fov={50} f={f} a={a} />
      <SpaceScene />
      <Planet t={t} queue={0} n={0} spin={t * 0.1} />
      <FloatingKitchen t={t} />
    </>
  );
};

/* =================== 8 — alienígenas e a presidente da galáxia (diplomacia de chocolate) =================== */
const ALIENS = at(14, "alienigenas");
const VEM = at(14, "vem");
const NEGOCIA = at(14, "negocia");
const PRESIDENTE = at(14, "presidente");
const ufoRing = (f: number, i: number, n: number, k: number): V3 => {
  const a = (i / n) * Math.PI * 2 + f * 0.01;
  return [KS[0] + Math.cos(a) * (2.6 + 6 * (1 - k)), KS[1] + 0.8 + 0.6 * Math.sin(a * 2), KS[2] + Math.sin(a) * (2.2 + 6 * (1 - k))];
};
const S27: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(clamp((f - a) / 50));
  const ufo: V3 = [lerp(12, 8.2, k), 2.6, lerp(-4, -0.8, k)];
  return (
    <>
      <Cam pos={[8.6, 3.0, 4.4]} look={[7.4, 2.0, -0.4]} fov={46} f={f} a={a} />
      <SpaceScene />
      <Planet t={t} queue={0} n={0} spin={t * 0.1} />
      <FloatingKitchen t={t} />
      <UFO p={ufo} r={[0.15, 0, -0.1]} t={t} s={0.9} />
      <Alien a={{pos: [ufo[0], ufo[1] - 0.05, ufo[2]], rotY: -1.0, t, mouth: 0.3 * Math.abs(Math.sin(t * 6)), blink: blinkCurve(f + 11)}} s={0.42} />
    </>
  );
};
const S28: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(clamp((f - a) / 40));
  return (
    <>
      <Cam pos={[5.4, 4.2, 9.6]} look={[5.2, 1.4, 1.5]} fov={50} f={f} a={a} />
      <SpaceScene />
      <Planet t={t} queue={0} n={0} spin={t * 0.1} />
      <FloatingKitchen t={t} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <UFO key={i} p={ufoRing(f, i, 6, k)} r={[0.15 * Math.sin(i), 0, 0.1 * Math.cos(i)]} t={t + i} s={0.7} />
      ))}
    </>
  );
};
/* dentro da cozinha no espaço: aperto de mão e coroa */
const ALIEN_IN: V3 = [ISLAND[0] - 1.2, 0, ISLAND[2] + 0.55];
const S29: React.FC<ShotProps> = ({f, a, t}) => {
  const beam = ramp(f, a, a + 8) * (1 - ramp(f, a + 20, a + 28));
  const appear = ramp(f, a + 4, a + 16);
  const shake = ramp(f, NEGOCIA - 4, NEGOCIA + 4);
  return (
    <>
      <Cam pos={[ISLAND[0] - 0.35, 1.5, ISLAND[2] + 2.5]} look={[ISLAND[0] - 0.5, 1.2, ISLAND[2]]} fov={46} f={f} a={a} />
      <KitchenScene t={t} space />
      <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} />
      <Podium p={PODIUM_P} s={0.9} />
      <Batter b={{pos: [PODIUM_P[0], PODIUM_P[1] + 0.36, PODIUM_P[2] - 0.1], sash: true, t, arms: shake > 0.5 ? "shake" : "down", mouth: talk(f, NEGOCIA, NEGOCIA + 40), blink: blinkCurve(f + 13), s: 1.3}} />
      {appear > 0.01 && <Alien a={{pos: [ALIEN_IN[0] + 0.15 * shake, ALIEN_IN[1], ALIEN_IN[2]], rotY: 0.9, offer: shake, t, mouth: 0.3, blink: blinkCurve(f + 11)}} s={appear} />}
      {beam > 0.01 && (
        <mesh position={[ALIEN_IN[0], 1.7, ALIEN_IN[2]]}>
          <cylinderGeometry args={[0.35, 0.6, 3.4, 24, 1, true]} />
          <meshStandardMaterial color="#b8ffd0" emissive="#7affb0" emissiveIntensity={1} transparent opacity={0.3 * beam} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      )}
    </>
  );
};
const S30: React.FC<ShotProps> = ({f, a, t}) => {
  const crown = backOut(ramp(f, PRESIDENTE - 4, PRESIDENTE + 6));
  const cheer = ramp(f, PRESIDENTE, PRESIDENTE + 6);
  return (
    <>
      <Cam pos={[ISLAND[0], 1.65, ISLAND[2] + 3.2]} look={[ISLAND[0] - 0.2, 1.25, ISLAND[2]]} fov={48} f={f} a={a} />
      <KitchenScene t={t} space />
      <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} />
      <MayorOnPodium f={f} t={t} arms={crown > 0.5 ? "up" : "down"} crown={crown} mouth={0.5 * cheer} />
      {[-1.3, -0.75, 1.05, 1.6].map((x, i) => (
        <Alien key={i} a={{pos: [ISLAND[0] + x, 0, ISLAND[2] + 0.75 + (i % 2) * 0.2], rotY: x < 0 ? 0.6 : -0.6, offer: 0.3 * cheer + 0.2 * Math.abs(Math.sin(t * 8 + i)) * cheer, t: t + i, mouth: 0.4 * cheer, blink: blinkCurve(f + i * 11)}} s={0.85} />
      ))}
    </>
  );
};
const S31: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PODIUM_P[0] + 0.2, 1.65, PODIUM_P[2] + 2.3]} look={[PODIUM_P[0], 1.5, PODIUM_P[2]]} fov={44} f={f} a={a} />
    <KitchenScene t={t} space />
    <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} />
    <MayorOnPodium f={f} t={t} arms="wave" crown={1} mouth={0.3} />
  </>
);

/* =================== Parabéns + final (loop) =================== */
const PB = L(16);
const NEM = at(16, "nem");
const S32: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (NEM - a));
  const pose: Pose = {...idle(f), pos: [ISLAND[0] - 0.55, 0, ISLAND[2] + 1.2], rotY: 0.25, rShoulder: [-2.6, 0, -0.4], lShoulder: [-2.6, 0, 0.4], rElbow: -0.3, lElbow: -0.3, smile: 1, mouthOpen: 0.4};
  return (
    <>
      <Cam pos={[ISLAND[0] + lerp(0.1, 0.3, k), 1.75, ISLAND[2] + lerp(3.9, 3.4, k)]} look={[ISLAND[0], 1.2, ISLAND[2]]} fov={52} f={f} a={a} />
      <KitchenScene t={t} space />
      <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} fridge={{love: 1, t}} />
      <MayorOnPodium f={f} t={t} arms="up" crown={1} mouth={0.4} />
      <Chef f={f} pose={pose} />
      <Penguin p={[ISLAND[0] + 1.05, 0, ISLAND[2] + 0.8]} rotY={-0.4} t={t} dance={1} blink={blinkCurve(f + 7)} />
      <Alien a={{pos: [ISLAND[0] + 1.75, 0, ISLAND[2] + 0.2], rotY: -0.6, offer: 0.4, t, mouth: 0.3}} s={0.85} />
      {chickData.slice(0, 8).map((c, i) => (
        <Chick key={i} c={{pos: [ISLAND[0] - 1.0 + i * 0.27, ISLAND_TOP, ISLAND[2] + 0.35], rotY: 0.2 * Math.sin(i), t: t + i, jump: 0.08 * Math.abs(Math.sin(t * 8 + i)), flap: 1, peep: Math.abs(Math.sin(t * 9 + i)), s: c.s}} />
      ))}
    </>
  );
};
/* "...e o bolo? Nem começou." — o menino olhando a tigela vazia */
const S33: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("b33" + a, (fr) => ({...idle(fr), pos: BOY, rotY: 0, rShoulder: [-0.5, 0, 0.3], rElbow: -0.9, lShoulder: [-0.5, 0, -0.3], lElbow: -0.9, head: [0.45, 0, 0], smile: 0, brow: 0.2, mouthOpen: 0, blink: 0.35}), a, f);
  return (
    <>
      <Cam pos={[ISLAND[0] + 0.1, 1.85, ISLAND[2] + 1.75]} look={[ISLAND[0], 1.3, ISLAND[2] - 0.5]} fov={46} f={f} a={a} />
      <KitchenScene t={t} space />
      <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} />
      <group position={[ISLAND[0], ISLAND_TOP, ISLAND[2] - 0.05]}>
        <mesh position={[0, 0.14, 0]}>
          <sphereGeometry args={[0.33, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
          <meshStandardMaterial color="#9fd8ff" roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <Chef f={f} pose={pose} />
    </>
  );
};
/* "E agora, pra fazer esse bolo de uma vez por todas... mas e se você estiver com medo?" */
const MEDO = at(17, "medo");
const S34: React.FC<ShotProps> = ({f, a, t}) => {
  const fear = ramp(f, MEDO - 10, MEDO);
  const lift = ramp(f, at(17, "coragem") - 4, at(17, "coragem") + 6) * (1 - fear);
  const pose = physics("b34" + a, (fr) => {
    const fr2 = ramp(fr, MEDO - 10, MEDO);
    return {...idle(fr), pos: BOY, rotY: 0.45, torso: [0, 0, shiver(fr / FPS, fr2)], rShoulder: [lerp(-0.4, -2.4, ramp(fr, a + 10, a + 20)), 0, 0.4], rElbow: -1.8, lShoulder: [-0.3, 0, 0.2], lElbow: -0.9, smile: 0.6 * (1 - fr2), brow: lerp(-0.3, 0.9, fr2), eyeWide: 0.7 * fr2, mouthOpen: 0.25 * fr2, head: [0, 0.3, 0]};
  }, a, f);
  return (
    <>
      <Cam pos={[0.15, 1.7, lerp(2.4, 1.6, clamp((f - a) / (TOTAL_BOLO - a)))]} look={[0.6, 1.4, -1.8]} fov={46} f={f} a={a} />
      <KitchenScene t={t} space />
      <Props f={f} t={t} sack={false} eggs={false} batterBowl={false} oven={{mood: 1, rage: 0.4 + 0.6 * fear}} />
      <Chef f={f} pose={pose} shades={1 - 0.6 * lift} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "primeiro"), Comp: S1},
  {from: at(0, "assim"), Comp: S2},
  {from: L(1), Comp: S3},
  {from: L(2), Comp: S4},
  {from: at(2, "que"), Comp: S5},
  {from: at(2, "ela"), Comp: S6},
  {from: L(3), Comp: S7},
  {from: L(4), Comp: S8},
  {from: at(4, "e", 0), Comp: S9},
  {from: at(4, "do"), Comp: S10},
  {from: L(5), Comp: S11},
  {from: L(6), Comp: S12},
  {from: FICAM, Comp: S13},
  {from: at(6, "e", 0), Comp: S14},
  {from: L(7), Comp: S15},
  {from: L(8), Comp: S16},
  {from: at(8, "e", 0), Comp: S17},
  {from: L(9), Comp: S18},
  {from: L(10), Comp: S19},
  {from: at(10, "se"), Comp: S20},
  {from: at(10, "e", 0), Comp: S21},
  {from: L(11), Comp: S22},
  {from: L(12), Comp: S23},
  {from: FORNO2 - 3, Comp: S24},
  {from: VIRA, Comp: S25},
  {from: L(13), Comp: S26},
  {from: L(14), Comp: S27},
  {from: at(14, "e", 0), Comp: S28},
  {from: at(14, "mas"), Comp: S29},
  {from: at(14, "e", 1), Comp: S30},
  {from: L(15), Comp: S31},
  {from: PB, Comp: S32},
  {from: NEM - 6, Comp: S33},
  {from: L(17), Comp: S34},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_BOLO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["bolo", "medo", "oculos", "escuro", "forno", "olhos", "disfarce", "culinario", "estiloso", "geladeira", "apaixona", "abraco", "congela", "paixao", "congelada", "farinha", "explode", "nevar", "pinguim", "senha", "wifi", "nevasca", "trigo", "ovos", "tremendo", "chocam", "panico", "galinaceo", "pintinhos", "musica", "banda", "pagode", "emplumado", "massa", "vida", "dancando", "prefeita", "ganha", "democracia", "proibido", "desempregado", "foguete", "espaco", "cozinha", "interplanetaria", "alienigenas", "disco", "voador", "negocia", "presidente", "galaxia", "diplomacia", "chocolate", "parabens", "nem", "comecou", "coragem"]);
const Bubble: React.FC<{from: number; to: number; text: string; x: number; y: number; color?: string}> = ({from, to, text, x, y, color = "#101018"}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: x - 400, top: y, width: 800, display: "flex", justifyContent: "center", transform: `scale(${s}) rotate(-3deg)`}}>
      <div style={{background: "#fff", color, fontFamily, fontWeight: 900, fontSize: 70, padding: "16px 40px", borderRadius: 40, border: "8px solid #101018", textAlign: "center", lineHeight: 1.05, boxShadow: "0 10px 0 rgba(0,0,0,0.25)"}}>{text}</div>
    </div>
  );
};
/** coraçõezinhos subindo */
const Hearts: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      {Array.from({length: 9}, (_, i) => {
        const k = ((f - from) / 40 + i / 9) % 1;
        const s = (0.6 + 0.5 * ((i * 37) % 10) / 10) * Math.sin(Math.min(1, k * 3) * Math.PI * 0.5);
        const cx = x + Math.sin(i * 2.3 + k * 4) * 220;
        const cy = y - k * 520;
        return (
          <g key={i} transform={`translate(${cx},${cy}) scale(${s})`} opacity={1 - k * k}>
            <path d="M 0 30 C -60 -10, -40 -60, 0 -28 C 40 -60, 60 -10, 0 30 Z" fill={i % 2 ? "#ff4d6d" : "#ff8fab"} stroke="#101018" strokeWidth={6} />
          </g>
        );
      })}
    </svg>
  );
};
/** notinhas musicais */
const Notes: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {Array.from({length: 6}, (_, i) => {
        const k = ((f - from) / 36 + i / 6) % 1;
        return (
          <div key={i} style={{position: "absolute", left: x + Math.sin(i * 2.1 + k * 5) * 260, top: y - k * 420, fontSize: 80 + 30 * (i % 2), color: ["#ff4d6d", "#3a86ff", "#2ecc71", "#ffd21f"][i % 4], WebkitTextStroke: "5px #101018", paintOrder: "stroke fill", opacity: 1 - k * k, transform: `rotate(${-15 + i * 9}deg)`, fontFamily}}>
            {i % 2 ? "♪" : "♫"}
          </div>
        );
      })}
    </>
  );
};
/** linhas de cheiro (onduladas) */
const Smell: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const ph = (f - from) / 8;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${x + i * 60} ${y} q 20 -40 0 -80 q -20 -40 0 -80 q 20 -40 0 -80`} transform={`translate(${8 * Math.sin(ph + i)},0)`} stroke="#c58cff" strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.85} />
      ))}
    </svg>
  );
};

/* ======================= vídeo ======================= */
const FX = 0.3;
const MUSIC = 0.125;
const SND: React.FC<{src: string; from: number; dur?: number; v: number; loop?: boolean}> = ({src, from, dur = 60, v, loop}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} loop={loop} />
  </Sequence>
);
export const VideoBolo: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(1), L(3), L(5), L(7), L(9), L(11), L(13), L(15)];
  const end = (i: number) => (i < 17 ? L(i + 1) - 3 : TOTAL_BOLO);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <StageTitle from={L(1) + 4} to={end(1)} lines={["DISFARCE", "CULINÁRIO"]} />
      <StageTitle from={L(3) + 4} to={end(3)} lines={["PAIXÃO", "CONGELADA"]} />
      <StageTitle from={L(5) + 4} to={end(5)} lines={["NEVASCA", "DE TRIGO"]} />
      <StageTitle from={L(7) + 4} to={end(7)} lines={["PÂNICO", "GALINÁCEO"]} />
      <StageTitle from={L(9) + 4} to={end(9)} lines={["PAGODE", "EMPLUMADO"]} />
      <StageTitle from={L(11) + 4} to={end(11)} lines={["DEMOCRACIA", "DE MASSA"]} />
      <StageTitle from={L(13) + 4} to={end(13)} lines={["COZINHA", "INTERPLANETÁRIA"]} />
      <StageTitle from={L(15) + 4} to={end(15)} lines={["DIPLOMACIA", "DE CHOCOLATE"]} />

      <Sparkles from={L(2)} to={at(2, "que") - 2} x={540} y={760} r={300} />
      <Hearts from={LOVE - 2} to={L(4) - 2} x={540} y={1100} />
      <Bubble from={at(4, "senha") - 6} to={L(5) + 2} text="QUAL A SENHA DO WI-FI? 📶" x={540} y={300} />
      <Notes from={MUSICA} to={L(10) + 40} x={460} y={900} />
      <Chip from={GANHA - 2} to={L(11) - 3} text="ELEITA! 🗳️" bg="#2e8b57" top={290} size={110} />
      <Confetti from={GANHA} to={GANHA + 90} />
      <Chip from={PROIBIDO - 2} to={FORNO2 - 4} text="🚫 PROIBIDO LIGAR O FORNO" bg="#e8262d" top={290} size={66} />
      <Smell from={ALIENS} to={VEM - 2} x={420} y={1000} />
      <Confetti from={PB} to={PB + 120} />
      <Chip from={PB + 1} to={at(16, "geladeira") - 3} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(16, "geladeira")} to={NEM - 6} x={190} y={420} rot={-6} label="GELADEIRA">
        <g transform="translate(152,100)">
          <rect x={-45} y={-80} width={90} height={160} rx={16} fill="#d9f1fb" stroke="#101018" strokeWidth={6} />
          <path d="M -28 -45 c -10 -14 -28 0 -14 12 l 14 12 l 14 -12 c 14 -12 -4 -26 -14 -12 z" fill="#ff4d6d" transform="translate(0,0)" />
          <path d="M 28 -45 c -10 -14 -28 0 -14 12 l 14 12 l 14 -12 c 14 -12 -4 -26 -14 -12 z" fill="#ff4d6d" transform="translate(-14,0)" />
        </g>
      </Sticker>
      <Sticker from={at(16, "boneco")} to={NEM - 6} x={540} y={400} rot={4} label="BONECO DE NEVE">
        <g transform="translate(152,105)">
          <circle cx={0} cy={45} r={48} fill="#ffffff" stroke="#101018" strokeWidth={6} />
          <circle cx={0} cy={-25} r={34} fill="#ffffff" stroke="#101018" strokeWidth={6} />
          <rect x={-24} y={-36} width={48} height={14} rx={5} fill="#101018" />
        </g>
      </Sticker>
      <Sticker from={at(16, "ovos")} to={NEM - 6} x={890} y={430} rot={6} label="OVOS DE SUSTO">
        <g transform="translate(152,105)">
          <ellipse cx={0} cy={10} rx={50} ry={66} fill="#fff3df" stroke="#101018" strokeWidth={6} />
          <ellipse cx={-16} cy={0} rx={9} ry={14} fill="#101018" />
          <ellipse cx={16} cy={0} rx={9} ry={14} fill="#101018" />
          <ellipse cx={0} cy={34} rx={9} ry={12} fill="#3a1510" />
        </g>
      </Sticker>
      <Sticker from={at(16, "banda")} to={NEM - 6} x={250} y={1620} rot={-4} label="BANDA DE PINTINHOS">
        <g transform="translate(152,105)">
          <circle cx={0} cy={20} r={52} fill="#ffd84a" stroke="#101018" strokeWidth={6} />
          <circle cx={0} cy={-45} r={34} fill="#ffd84a" stroke="#101018" strokeWidth={6} />
          <path d="M -10 -40 L 10 -40 L 0 -26 Z" fill="#ff9a1f" />
        </g>
      </Sticker>
      <Sticker from={at(16, "massa")} to={NEM - 6} x={830} y={1620} rot={5} label="PREFEITA MASSA">
        <g transform="translate(152,105)">
          <ellipse cx={0} cy={20} rx={68} ry={58} fill="#f7dd8f" stroke="#101018" strokeWidth={6} />
          <rect x={-70} y={4} width={140} height={20} fill="#2e8b57" transform="rotate(-25)" />
          <circle cx={-18} cy={0} r={7} fill="#101018" />
          <circle cx={18} cy={0} r={7} fill="#101018" />
        </g>
      </Sticker>
      <Sticker from={at(16, "cozinha")} to={NEM - 6} x={540} y={1020} rot={-3} label="COZINHA NO ESPAÇO">
        <g transform="translate(152,105)">
          <rect x={-60} y={-55} width={120} height={95} rx={10} fill="#ffe7b8" stroke="#101018" strokeWidth={6} />
          <rect x={-70} y={-70} width={140} height={20} rx={6} fill="#e8414f" stroke="#101018" strokeWidth={5} />
          <path d="M -40 40 L -25 90 L -10 40 Z" fill="#ff9a1f" />
          <path d="M 10 40 L 25 90 L 40 40 Z" fill="#ff9a1f" />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozbolo.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 12) * (1 - ramp(fr, TOTAL_BOLO - 20, TOTAL_BOLO)) * (1 - 0.7 * ramp(fr, MUSICA, MUSICA + 10) * (1 - ramp(fr, L(11) - 10, L(11))))} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FX * 0.18} />
      ))}
      {titles.map((b) => (
        <SND key={"b" + b} src="sfx7/boing.mp3" from={b + 3} dur={32} v={FX * 0.75} />
      ))}
      <SND src="sfx13/growl.mp3" from={8} dur={60} v={FX * 0.45} />
      <SND src="sfx10/plim.mp3" from={OCULOS + 6} dur={30} v={FX * 0.7} />
      <SND src="sfx13/peeps.mp3" from={HATCH} dur={L(8) + 20 - HATCH} v={FX * 0.5} loop />
      <SND src="sfx13/pagode.mp3" from={MUSICA + 2} dur={L(11) - MUSICA} v={FX * 0.5} loop />
      <SND src="sfx13/growl.mp3" from={FORNO2} dur={60} v={FX * 0.6} />
      <SND src="sfx13/ufo.mp3" from={VEM - 4} dur={NEGOCIA - VEM + 4} v={FX * 0.5} loop />
      <SND src="sfx13/growl.mp3" from={MEDO - 8} dur={40} v={FX * 0.45} />
      <SND src="sfx12/kiss.mp3" from={LOVE} dur={36} v={FX * 0.6} />
      <SND src="sfx11/wind.mp3" from={OPEN} dur={L(4) - OPEN} v={FX * 0.5} />
      <SND src="sfx9/crack.mp3" from={FREEZE} dur={40} v={FX * 0.5} />
      <SND src="sfx12/poof.mp3" from={EXPLODE} dur={45} v={FX * 0.8} />
      <SND src="sfx11/wind.mp3" from={at(4, "e", 0)} dur={L(6) - at(4, "e", 0)} v={FX * 0.35} />
      <SND src="sfx9/crack.mp3" from={CHOCAM - 4} dur={40} v={FX * 0.6} />
      <SND src="sfx12/gasp.mp3" from={FICAM} dur={40} v={FX * 0.4} />
      <SND src="sfx9/stamp.mp3" from={MUSICA - 4} dur={30} v={FX * 0.5} />
      <SND src="sfx9/yay.mp3" from={GANHA} dur={60} v={FX * 0.55} />
      <SND src="sfx7/confetti.mp3" from={GANHA} dur={61} v={FX * 0.5} />
      <SND src="sfx11/rocket.mp3" from={VIRA - 4} dur={90} v={FX * 0.6} />
      <SND src="sfx11/alien.mp3" from={ALIENS} dur={45} v={FX * 0.6} />
      <SND src="sfx11/alien.mp3" from={NEGOCIA} dur={45} v={FX * 0.5} />
      <SND src="sfx9/yay.mp3" from={PRESIDENTE} dur={60} v={FX * 0.5} />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FX * 0.6} />
      {["geladeira", "boneco", "ovos", "banda", "massa", "cozinha"].map((w, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={at(16, w)} dur={22} v={FX * 0.55} />
      ))}
    </AbsoluteFill>
  );
};
