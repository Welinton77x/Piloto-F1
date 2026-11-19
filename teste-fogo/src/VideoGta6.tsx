import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, Tree, House, V3} from "./Sets5";
import {Dog, sm, rbox, Controller, RoomShell, Sofa, SOFA_SEAT, MathBook} from "./Sets9";
import {ChefHat} from "./Sets11";
import {PaperHat} from "./Sets12";
import {Sparks, Bolt, EvaHelmet, Dam} from "./Sets14";
import {Stadium} from "./Sets17";
import {Space} from "./Sets18";
import {BedroomC, Mug} from "./Sets19";
import {Bg} from "./Sets20";
import {AlarmClock, SoundRings, Nightstand} from "./Sets21";
import {Helicopter, Pizza} from "./Sets22";
import {GameTV, ScreenMode, GiantDish, SpaceStation, Letter, LightBill, ShipHorn, BigScreen, PizzaBox, PizzaStack, PizzeriaSet, PowerCable, YearCal, Confetti3D, ItaipuSign, GameBoxVI} from "./Sets26";
import {Captions, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut} from "./util";
import W from "./timingGta6.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_GTA6 = F(words[words.length - 1].e + 0.9);

/* ---------- personagens ---------- */
const BOY: ToyLook = {hoodie: true};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const HOLD: Pose = {rShoulder: [-1.0, 0.35, 0.05], rElbow: -1.3};
// eslint-disable-next-line
const _SIP: Pose = {rShoulder: [-1.15, 0.12, 0.05], rElbow: -1.8, head: [-0.18, 0, 0]};
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
/** coração batendo (na frente do peito) */
/** risquinhos de velocidade atrás de quem corre */
/* ---------- horários ---------- */
const ENTAO0 = at(0, "entao");
const SE0 = at(0, "se");
const TREZE0 = at(0, "treze");
const PRESTA0 = at(0, "presta");
const EU = [0, at(1, "eu"), at(2, "eu"), at(3, "eu"), at(4, "eu"), at(5, "eu")];
const MAS = [0, at(1, "mas"), at(2, "mas"), at(3, "mas"), at(4, "mas"), at(5, "mas")];
const CENTO1 = at(1, "cento");
const OS1 = at(1, "os");
const SEM1 = at(1, "sem");
const MANDAM1 = at(1, "mandam");
const CENTO2 = at(2, "cento");
const BAIRRO2 = at(2, "o", 1) - 2;
const CARNAVAL2 = at(2, "carnaval");
const CENTO3 = at(3, "cento");
const QUARENTA3 = at(3, "quarenta");
const BATER3 = at(3, "bater");
const POSTE3 = at(3, "poste");
const TREZENTAS4 = at(4, "trezentas");
const AGORA4 = at(4, "agora");
const CNPJ4 = at(4, "cnpj");
const CATORZE5 = at(5, "catorze");
const CONTROLE5 = at(5, "controle", 1);
const VIZINHO5 = at(5, "vizinho");
const CONTA5 = at(5, "conta");
const GUARANI5 = at(5, "guarani");
const QUARTO6 = at(6, "quarto");
const MAE6 = at(6, "mae");
const ESTUDANDO6 = at(6, "estudando");
const SAVE7 = at(7, "save");
const ULTIMA7 = at(7, "ultima");

const MAE: ToyLook = {apron: true, shirt: "#2e86de", hairStyle: "ponytail", hair: "#2a1a10", lips: "#c0392b"};
const PIJAMA: ToyLook = {shirt: "#7fb8ff", pants: "#7fb8ff", socks: "#ffffff"};
const ASTRO: ToyLook = {shirt: "#f4f4f2", pants: "#f4f4f2", shoe: "#c9ccd3", sole: "#8a8f99"};
const VIZ: ToyLook = {shirt: "#8e44ad", pants: "#3a3f4a", hairStyle: "buzz", hair: "#d0d0d0", belly: 0.7, skin: "#e0b08a"};
const FOLIA: ToyLook[] = [
  {shirt: "#ff4d6d", pants: "#2e86de", hairStyle: "curly", hair: "#2a1a10"},
  {shirt: "#2ecc71", pants: "#ffd21f", hairStyle: "pigtails", hair: "#5a3a20", lips: "#c0392b"},
  {shirt: "#ff9f1c", pants: "#101018", hairStyle: "buzz", hair: "#101018", skin: "#8d5a3b"},
  {shirt: "#c86bfa", pants: "#2ecc71", hairStyle: "long", hair: "#e3b33b", lips: "#c0392b"},
  {shirt: "#3a86ff", pants: "#ff4d6d", hairStyle: "spiky", hair: "#3a2a1a", skin: "#c68a5a"},
];
const CTRL_HOLD: Pose = {rShoulder: [-1.0, 0.25, 0.1], rElbow: -1.25, lShoulder: [-1.0, -0.25, -0.1], lElbow: -1.25};
const CTRL = <Controller p={[0.06, -0.02, 0.02]} r={[0.2, 0, Math.PI / 2]} s={1.05} />;

/* =================== a sala do videogame =================== */
const TV_P: V3 = [0, 0, 2.75];
const BOY_P: V3 = [0, 0, 0.7];
const RoomLights: React.FC<{dim?: number}> = ({dim = 1}) => (
  <>
    <Bg c="#cfe8ff" />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0 * dim]} />
    <pointLight position={[0.3, 2.9, 0.6]} intensity={10 * dim} distance={10} decay={1.4} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[2, 4, 4]} intensity={0.5 * dim} />
  </>
);
const GameRoom: React.FC<{mode?: ScreenMode; dog?: boolean; t: number; f: number; tv?: boolean; dogCover?: boolean; wall?: string}> = ({mode = "game", dog = true, t, f, tv = true, dogCover = false, wall = "#cfe3ff"}) => (
  <>
    <RoomShell wall={wall} accent="#ff8a5c" />
    {tv && <GameTV p={TV_P} rotY={Math.PI} mode={mode} />}
    <Sofa p={[0, 0, -1.55]} />
    {dog && <Dog d={{pos: [0.55, SOFA_SEAT - 0.02, -1.5], rotY: 0.1, t, blink: dogCover ? 1 : blinkCurve(f + 11), tail: dogCover ? 0 : 1, legs: dogCover ? "point" : "down", legK: dogCover ? 1 : 0, tongue: dogCover ? 0 : 0.5, head: dogCover ? [0.45, 0, 0] : [0, 0.2 * Math.sin(t * 0.7), 0]}} s={0.9} />}
  </>
);
/** câmera por cima do ombro: vê as costas do menino e a TV */
const OverCam: React.FC<{f: number; a: number}> = ({f, a}) => <Cam pos={[1.2, 2.3, -2.2]} look={[-0.25, 1.05, 2.75]} fov={46} f={f} a={a} />;
/** câmera de reação: de frente pro menino, a TV fica atrás da câmera */
const FaceCam: React.FC<{f: number; a: number; close?: boolean}> = ({f, a, close}) => <Cam pos={close ? [0.4, 1.4, 2.55] : [0.45, 1.5, 2.55]} look={close ? [0, 1.1, 0.6] : [0, 1.05, -0.4]} fov={close ? 62 : 56} f={f} a={a} />;
const Player: React.FC<{f: number; t: number; extra?: Pose; look?: ToyLook; headExtra?: React.ReactNode; item?: React.ReactNode}> = ({f, t, extra = {}, look = BOY, headExtra, item = CTRL}) => (
  <HandToy pose={{...idle(f), pos: BOY_P, rotY: 0, ...CTRL_HOLD, rWrist: [0.15 * Math.sin(t * 13), 0, 0], ...extra}} look={look} headExtra={headExtra} item={item} />
);

/* abertura: a caixa do jogo e o calendário dos treze anos */
const YEAR0 = (f: number) => (f < TREZE0 - 10 ? 2013 : Math.min(2026, 2013 + Math.floor((f - TREZE0 + 10) / 4)));
const IntroRoom: React.FC<{f: number; t: number}> = ({f, t}) => {
  const y = YEAR0(f);
  const flip = f >= TREZE0 - 10 && y < 2026 ? ((f - TREZE0 + 10) % 4) / 4 : 0;
  return (
    <>
      <RoomLights />
      <GameRoom t={t} f={f} tv={false} />
      <YearCal p={[-1.55, 1.85, -2.48]} year={y} flip={flip} s={1.1} />
      <GameBoxVI p={[0, 0.95, 0.92]} r={[0, 0, 0]} s={0.85} glow={0.85 + 0.15 * Math.sin(t * 5)} />
    </>
  );
};
const HUG: Pose = {rShoulder: [-0.7, 0.4, 0.1], rElbow: -1.35, lShoulder: [-0.7, -0.4, -0.1], lElbow: -1.35};
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.45, 3.3]} look={[0, 1.05, -0.6]} fov={52} f={f} a={a} />
    <IntroRoom f={f} t={t} />
    <Toy pose={{...idle(f), pos: [0, 0, 0.7], rotY: 0, ...HUG, smile: 1, eyeWide: 0.5, head: [0.05, 0.15 * Math.sin(t * 2), 0.06 * Math.sin(t * 3)]}} look={BOY} />
  </>
);
const S0b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.45, 3.3]} look={[0, 1.25, 0.5]} fov={46} f={f} a={a} />
    <IntroRoom f={f} t={t} />
    <Toy pose={{...idle(f), pos: [0, 0, 0.7], rotY: 0, ...HUG, eyeWide: 0.9, brow: 1, mouthOpen: 0.25}} look={BOY} />
  </>
);
const S0c: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.7, 1.7, 0.2]} look={[-1.55, 1.75, -2.48]} fov={52} f={f} a={a} />
    <IntroRoom f={f} t={t} />
    <Toy pose={{...idle(f), pos: [0, 0, 0.7], rotY: -0.6, ...HUG, eyeWide: 0.4, bags: 1}} look={BOY} />
  </>
);
const S0d: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.45, 3.3]} look={[0, 1.25, 0.5]} fov={46} f={f} a={a} />
    <IntroRoom f={f} t={t} />
    <Toy pose={{...idle(f), pos: [0, 0, 0.7], rotY: 0, rShoulder: [-1.45, 0.05, -0.1], rElbow: -0.1, lShoulder: [-0.95, -0.45, -0.1], lElbow: -1.5, brow: -0.6, smile: 0.4}} look={BOY} />
  </>
);

/* =================== o quintal de casa =================== */
const DayOut: React.FC<{x?: number; z?: number}> = ({x = 0, z = 0}) => (
  <>
    <Sky />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
    <SunLight target={[x, 1, z]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
  </>
);
const Yard: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut />
    <group position={[0, 0, -9]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
      <planeGeometry args={[30, 12]} />
    </mesh>
    <House p={[-2.6, 0, -3.4]} w={3.4} h={2.7} d={3} wall="#ffd166" roof="#e8414f" />
    <Tree p={[3.2, 0, -2.6]} s={1.3} />
  </>
);

/* ① antena da estação espacial */
const DISH_P: V3 = [1.5, 0, -2.6];
const Item1: React.FC<ShotProps> = ({f, a, t}) => {
  const on = f >= MAS[1];
  const up = on ? easeInOut(ramp(f, MAS[1] + 6, MAS[1] + 40)) : 0;
  return (
    <>
      <Cam pos={[0.2, 2.0 + up * 0.4, 7.0]} look={[0.6, 2.0 + up * 1.2, -2]} fov={60} f={f} a={on ? MAS[1] - 3 : a} />
      <Yard t={t} />
      <GiantDish p={DISH_P} s={1.15} tilt={0.35} beam={on ? clamp((f - MAS[1]) / 8) : 0} t={t} />
      <Toy pose={{...idle(f), pos: [-0.6, 0, 0.6], rotY: 0.5, head: [-0.45, 0, 0], eyeWide: on ? 1 : 0.4, mouthOpen: on ? 0.5 : 0, ...(on ? ARMS_UP : {})}} look={BOY} />
    </>
  );
};
const Item1b: React.FC<ShotProps> = ({f, a, t}) => {
  const p = Math.min(3, Math.floor((f - a) / 25) + 1);
  return (
    <>
      <OverCam f={f} a={a} />
      <RoomLights />
      <GameRoom mode={`load${p}`} t={t} f={f} />
      <Player f={f} t={0} extra={{torso: [0.3, 0, 0], head: [0.25, 0, 0], rShoulder: [-0.5, 0.25, 0.1], lShoulder: [-0.5, -0.25, -0.1], rElbow: -0.9, lElbow: -0.9}} />
    </>
  );
};
const Item1c: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0.3, 0.8, 7.2]} look={[0, 0.7, 0]} fov={56} f={f} a={a} />
      <Space t={t} />
      <hemisphereLight args={["#ffffff", "#203050", 0.9]} />
      <directionalLight position={[-5, 6, 6]} intensity={2.4} />
      <SpaceStation p={[0, 2.3, -3.2]} r={[0.35, 0.3 + k * 0.03, 0.08]} s={0.55} />
      {/* raio do download chegando de baixo */}
      <mesh position={[0.8, -3, -1.0]} rotation={[0, 0, -0.15]}>
        <cylinderGeometry args={[0.15, 0.4, 7, 14, 1, true]} />
        <meshBasicMaterial color="#7dfcff" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.95 * sd, -0.25 + 0.12 * Math.sin(t * 1.5 + sd), 0.6]} rotation={[0.1 * Math.sin(t + sd), -0.35 * sd, 0.2 * sd + 0.08 * Math.sin(t * 1.2)]}>
          <Toy pose={{...idle(f + sd * 9), pos: [0, -0.8, 0], rotY: 0, legLift: 0.4, eyeWide: 1, brow: 1, mouthOpen: 0.4, rShoulder: [-2.5, 0, -0.3 * sd], rElbow: -0.3, lShoulder: [-0.4, 0, 0.3], lElbow: -0.6}} look={ASTRO} headExtra={<EvaHelmet open />} />
        </group>
      ))}
    </>
  );
};
const Item1d: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.55, 3.1]} look={[0.1, 1.35, 0]} fov={50} f={f} a={a} />
    <RoomLights />
    <GameRoom t={t} f={f} tv={false} dog={false} wall="#ffe3b8" />
    <HandToy pose={{...idle(f), pos: [0, 0, 0.2], rotY: 0, rShoulder: [-1.25, 0.2, 0.1], rElbow: -1.2, brow: -1, mouthOpen: 0.25 + 0.2 * Math.abs(Math.sin(t * 9)), eyeWide: 0.3}} look={MAE} item={<Letter p={[0.02, 0.08, 0.06]} r={[0, 0, 0]} s={1.5} />} />
  </>
);

/* ② sirene de navio */
const NightRoom: React.FC<{t: number}> = ({t}) => (
  <>
    <BedroomC night />
    <hemisphereLight args={["#9fb0ff", "#403050", 0.55]} />
    <pointLight position={[1.4, 1.6, -0.6]} intensity={4} distance={6} decay={1.5} color="#bfd0ff" castShadow />
    <Nightstand p={[1.35, 0, -1.6]} />
    <AlarmClock p={[1.5, 0.6, -1.55]} rotY={-0.4} s={0.7} t={t} />
    <GameTV p={[-1.8, 0, -1.6]} rotY={0.5} mode="clock" s={0.8} />
  </>
);
const Item2: React.FC<ShotProps> = ({f, a, t}) => {
  const blow = f >= MAS[2] ? 1 : 0;
  const jump = blow ? Math.sin(clamp((f - MAS[2] - 6) / 22) * Math.PI) : 0;
  return (
    <>
      <Cam pos={[2.4, 1.9, 1.5]} look={[0.4, 1.25, -1.0]} fov={62} f={f} a={blow ? MAS[2] - 3 : a} />
      <NightRoom t={t} />
      <ShipHorn p={[1.2, 0.6, -1.55]} rotY={-0.5} s={1.0} blow={blow} t={t} />
      {blow > 0 && <SoundRings p={[1.05, 0.95, -1.25]} t={t} color="#ffd21f" size={1.4} />}
      <Toy pose={{...idle(f), pos: [0, 0.32 + jump * 0.8, -1.2], rotY: 0.3, legLift: 1, blink: blow ? 0 : 1, eyeWide: blow ? 1 : 0, brow: blow ? 1 : 0, mouthOpen: blow ? 0.6 : 0.15, hairLift: blow ? 1 : 0, head: blow ? [0, 0, 0] : [0.35, 0, 0.35], ...(blow ? ARMS_UP : {rShoulder: [0, 0, -0.1], lShoulder: [0, 0, 0.1]})}} look={PIJAMA} />
    </>
  );
};
const Item2b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.7, 1.3, 0.5]} look={[-1.8, 1.05, -1.6]} fov={50} f={f} a={a} />
    <NightRoom t={t} />
    <ShipHorn p={[1.2, 0.6, -1.55]} rotY={-0.5} s={1.0} />
  </>
);
const Item2c: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.0, 6.0]} look={[0, 1.7, 0]} fov={56} f={f} a={a} />
    <Bg c="#1a2244" />
    <hemisphereLight args={["#9fb0ff", "#403050", 0.8]} />
    <pointLight position={[0, 4, 2]} intensity={12} distance={14} decay={1.3} color="#ffe0b0" castShadow />
    <pointLight position={[-3, 3, 0]} intensity={6} distance={9} decay={1.4} color="#ff5fb0" />
    <pointLight position={[3, 3, 0]} intensity={6} distance={9} decay={1.4} color="#3a86ff" />
    <Town t={t} galo={false} variant="nova" flat dark lamps />
    {FOLIA.map((lk, i) => {
      const x = -1.3 + i * 0.65;
      const ph = t * 9 + i * 1.3;
      return <Toy key={i} pose={{...idle(f + i * 7), pos: [x, Math.abs(Math.sin(ph)) * 0.15, 0.6 - (i % 2) * 0.7], rotY: 0.15 * Math.sin(ph / 2), smile: 1, mouthOpen: 0.4, rShoulder: [-2.6, 0, -0.3 + 0.3 * Math.sin(ph)], rElbow: -0.4, lShoulder: [-2.6, 0, 0.3 - 0.3 * Math.sin(ph)], lElbow: -0.4, walk: ph, walkAmt: 0.6}} look={lk} headExtra={<PaperHat />} />;
    })}
    <Confetti3D c={[0, 0, 0.5]} w={8} h={4.5} t={t} n={90} />
  </>
);

/* ③ telão de estádio */
const Item3: React.FC<ShotProps> = ({f, a, t}) => {
  const after = f >= MAS[3];
  const crash = f >= BATER3 + 10;
  return (
    <>
      {crash ? (
        <Cam pos={[0, 6, 4]} look={[0, 8, -14]} fov={60} f={f} a={BATER3 - 3} />
      ) : after ? (
        <Cam pos={[0, 11, 22]} look={[0, 3.2, -6]} fov={66} f={f} a={MAS[3] - 3} />
      ) : (
        <Cam pos={[0.8, 1.7, 3.6]} look={[0, 4.5, -14]} fov={60} f={f} a={a} />
      )}
      <Stadium />
      <hemisphereLight args={["#ffffff", "#5a8a3a", 1.1]} />
      <directionalLight position={[-6, 12, 8]} intensity={2.4} castShadow />
      <BigScreen p={[0, 0, -15]} mode={crash ? "crash" : "game"} s={1.0} />
      <Toy pose={{...idle(f), pos: [0, 0, 0.6], rotY: Math.PI, ...CTRL_HOLD, ...(crash ? {rShoulder: [-2.4, 0.3, 0], rElbow: -2.2} : {})}} look={BOY} />
    </>
  );
};
const Item3b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[1.8, 1.8, -1.6]} look={[-0.05, 0.85, 1.75]} fov={62} f={f} a={a} />
    <RoomLights />
    <GameRoom t={t} f={f} tv={false} />
    <mesh position={[0.35, 0.3, 2.3]} geometry={rbox(0.5, 0.6, 0.4, 0.03)} material={sm("#c8874a", 0.6)} castShadow />
    <GameTV p={[0.35, 0.6, 2.3]} rotY={Math.PI} s={0.28} rack={false} />
    <Player f={f} t={t} extra={{pos: [-0.35, 0, 1.15], torso: [0.2, 0, 0], head: [0.2, 0, 0], eyeWide: 0, blink: 0.6, brow: -0.8}} />
  </>
);

/* ④ helicóptero da pizza */
const ROOF: V3 = [-2.6, 3.6, -3.4];
const Item4: React.FC<ShotProps> = ({f, a, t}) => {
  const land = f >= MAS[4] ? easeInOut(ramp(f, MAS[4], MAS[4] + 40)) : 0;
  const drop = f >= TREZENTAS4 - 8;
  return (
    <>
      <Cam pos={[1.2, 2.8, 7.4]} look={[-1.0, 3.0, -2.8]} fov={60} f={f} a={f >= MAS[4] ? MAS[4] - 3 : a} />
      <Yard t={t} />
      <Helicopter p={[ROOF[0] + 0.3, lerp(7.5, ROOF[1] + 0.5, land) + 0.1 * Math.sin(t * 3), ROOF[2] + 0.3]} rotY={0.5} s={0.7} t={t} />
      {drop &&
        Array.from({length: 26}, (_, i) => {
          const q = ((t - TREZENTAS4 / FPS) * 1.2 + i / 26) % 1;
          const x = ROOF[0] + 1.3 + (i % 5) * 0.35 - 0.6;
          const z = ROOF[2] + 1.6 + ((i * 7) % 5) * 0.25;
          return <PizzaBox key={i} p={[x + q * 0.8, Math.max(0.05, 3.2 - q * q * 4.2), z + q * 0.6]} r={[q * 4 + i, i, q * 3]} s={1.2} />;
        })}
      {drop && <PizzaStack p={[-0.4, 0, -0.9]} n={14} s={1.2} />}
      <Toy pose={{...idle(f), pos: [0.4, 0, 0.6], rotY: -0.4, head: [-0.4, 0, 0], eyeWide: land > 0 ? 1 : 0.4, mouthOpen: land > 0 ? 0.5 : 0.1, ...CTRL_HOLD}} look={BOY} />
    </>
  );
};
const Item4b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <FaceCam f={f} a={a} close />
    <RoomLights />
    <GameRoom t={t} f={f} />
    <Player f={f} t={t} extra={{rotY: 0, eyeWide: 0.9, brow: -0.8, mouthOpen: 0.15, torso: [0.15, 0, 0], pupil: [0, 0]}} />
  </>
);
const Item4c: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.6, 3.3]} look={[0, 1.2, -0.6]} fov={54} f={f} a={a} />
    <RoomLights />
    <RoomShell wall="#ffe9c9" accent="#ff8a5c" />
    <PizzeriaSet p={[0, 0, -1.2]} />
    <PizzaStack p={[-1.0, 1.05, -1.15]} n={6} />
    <PizzaStack p={[0.95, 1.05, -1.2]} n={4} seed={2} />
    <PizzaStack p={[-2.3, 0, 0.2]} n={18} s={1.2} seed={4} />
    <PizzaStack p={[2.2, 0, 0.4]} n={15} s={1.2} seed={6} />
    <PizzaStack p={[1.7, 0, 1.2]} n={9} s={1.2} seed={8} />
    <Pizza p={[0.2, 1.08, -1.0]} s={1.0} />
    <HandToy pose={{...idle(f), pos: [0, 0, -1.75], rotY: 0, ...CTRL_HOLD, smile: 1, eyeWide: 0.4}} look={BOY} headExtra={<ChefHat />} item={CTRL} />
  </>
);

/* ⑤ usina de Itaipu */
const Item5: React.FC<ShotProps> = ({f, a, t}) => {
  const on = f >= MAS[5];
  return (
    <>
      <Cam pos={[1.5, 4.5, 26]} look={[1.5, 6.5, -2]} fov={60} f={f} a={on ? MAS[5] - 3 : a} />
      <DayOut z={-4} />
      <Dam t={t} />
      <ItaipuSign p={[0, 11.2, -2.15]} />
      <PowerCable pts={[[9, 11.5, -3], [10, 9, 4], [11, 4, 12], [12, 0.6, 22], [14, 0.3, 30]]} r={0.35} glow={on ? 0.6 + 0.4 * Math.sin(t * 20) : 0} />
    </>
  );
};
const Item5b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <OverCam f={f} a={a} />
    <RoomLights />
    <GameRoom mode="low" t={t} f={f} />
    <Player f={f} t={t} extra={{head: [0.1, 0, 0]}} />
  </>
);
const Item5d: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <FaceCam f={f} a={a} close />
    <RoomLights dim={0.8} />
    <GameRoom t={t} f={f} />
    <Player f={f} t={t} extra={{eyeWide: 1, brow: 1, mouthOpen: 0.5, hairLift: 1, squash: 0.03 * Math.sin(t * 50)}} />
    <Sparks p={[0, 1.15, 1.05]} k={1} t={t} size={1.2} />
    <Bolt a={[0, 1.15, 1.05]} b={[1.5, 2.6, 2.4]} k={1} t={t} />
    <Bolt a={[0, 1.15, 1.05]} b={[-1.6, 2.2, 2.6]} k={1} t={t} color="#9fefff" />
  </>
);
const Item5e: React.FC<ShotProps> = ({f, a, t}) => {
  const on = f >= VIZINHO5 + 4;
  return (
    <>
      <Cam pos={[0.9, 1.5, 2.6]} look={[0.35, 1.1, -0.8]} fov={56} f={f} a={a} />
      <Bg c="#f2e6cc" />
      <hemisphereLight args={["#fff6e6", "#b08a60", 0.8]} />
      <pointLight position={[0.3, 2.8, 1.0]} intensity={6} distance={9} decay={1.4} castShadow />
      <RoomShell wall="#d9f2d0" accent="#3a86ff" />
      <GameTV p={[1.1, 0, -1.7]} rotY={-0.35} mode={on ? "game" : "off"} />
      <HandToy pose={{...idle(f), pos: [-0.15, 0, -0.3], rotY: 0.5, rShoulder: [-1.2, 0.3, 0.1], rElbow: -1.4, eyeWide: on ? 1 : 0.2, mouthOpen: on ? 0.6 : 0, brow: on ? 1 : 0, ...(on ? {lShoulder: [-2.6, 0, 0.4], lElbow: -0.3} : {})}} look={VIZ} item={<Mug p={[0, 0.02, 0.06]} r={[Math.PI / 2, 0, 0]} s={1.2} />} />
    </>
  );
};
const Item5f: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.55, 3.1]} look={[0.1, 1.35, 0]} fov={50} f={f} a={a} />
    <RoomLights />
    <GameRoom t={t} f={f} tv={false} dog={false} wall="#ffe3b8" />
    <HandToy pose={{...idle(f), pos: [0, 0, 0.2], rotY: 0, rShoulder: [-1.25, 0.2, 0.1], rElbow: -1.2, eyeWide: 1, brow: 1, mouthOpen: 0.7, hairLift: f >= GUARANI5 ? 1 : 0}} look={MAE} item={<LightBill p={[0.02, 0.08, 0.06]} s={1.5} />} />
  </>
);

/* final: o jeito certo e o save apagado */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const mom = f >= MAE6 - 6 ? easeOut(ramp(f, MAE6 - 6, MAE6 + 12)) : 0;
  const book = f >= MAE6 + 6;
  return (
    <>
      <Cam pos={[1.35, 1.5, 2.35]} look={[-0.5, 1.1, 0.4]} fov={66} f={f} a={a} />
      <RoomLights />
      <GameRoom t={t} f={f} mode="game" />
      {book ? (
        <Toy pose={{...idle(f), pos: BOY_P, rotY: 0.7, rShoulder: [-1.2, 0.3, 0.1], rElbow: -1.0, lShoulder: [-1.2, -0.3, -0.1], lElbow: -1.0, smile: 1, blink: f >= ESTUDANDO6 + 6 && f < ESTUDANDO6 + 30 ? 1 : blinkCurve(f), head: [0, 0.3, 0.15]}} look={PIJAMA} />
      ) : (
        <Player f={f} t={t} look={PIJAMA} extra={{smile: 1}} />
      )}
      {book && <MathBook p={[0.35, 1.05, 1.05]} r={[-0.9, 0.7, 0]} s={0.9} open={1} />}
      {mom > 0 && <Toy pose={{...idle(f + 5), pos: [lerp(-3.4, -1.0, mom), 0, 0.6], rotY: 0.9, walk: t * 8, walkAmt: mom < 1 ? 1 : 0, brow: -0.6, ...(f > MAE6 + 12 ? {rShoulder: [-0.4, 0, -0.5], rElbow: -1.6, lShoulder: [-0.4, 0, 0.5], lElbow: -1.6} : {})}} look={MAE} />}
    </>
  );
};
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const gone = f >= SAVE7 + 6;
  return (
    <>
      {gone ? <FaceCam f={f} a={SAVE7 + 6} close /> : <OverCam f={f} a={a} />}
      <RoomLights />
      <GameRoom t={t} f={f} mode={gone ? "save" : "mission"} dogCover={gone} />
      <Player f={f} t={t} extra={gone ? {...ARMS_UP, eyeWide: 1, brow: 1, mouthOpen: 0.8} : {brow: -0.6}} item={gone ? null : CTRL} />
    </>
  );
};

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: ENTAO0 - 3, Comp: S0b},
  {from: SE0 - 3, Comp: S0c},
  {from: PRESTA0 - 3, Comp: S0d},
  {from: L(1), Comp: Item1},
  {from: EU[1] - 3, Comp: Item1b},
  {from: MAS[1] - 3, Comp: Item1},
  {from: OS1 - 3, Comp: Item1c},
  {from: MANDAM1 - 3, Comp: Item1d},
  {from: L(2), Comp: Item2},
  {from: EU[2] - 3, Comp: Item2b},
  {from: MAS[2] - 3, Comp: Item2},
  {from: BAIRRO2, Comp: Item2c},
  {from: L(3), Comp: Item3},
  {from: EU[3] - 3, Comp: Item3b},
  {from: MAS[3] - 3, Comp: Item3},
  {from: L(4), Comp: Item4},
  {from: EU[4] - 3, Comp: Item4b},
  {from: MAS[4] - 3, Comp: Item4},
  {from: AGORA4 - 3, Comp: Item4c},
  {from: L(5), Comp: Item5},
  {from: EU[5] - 3, Comp: Item5b},
  {from: MAS[5] - 3, Comp: Item5},
  {from: CONTROLE5 - 4, Comp: Item5d},
  {from: VIZINHO5 - 4, Comp: Item5e},
  {from: CONTA5 - 4, Comp: Item5f},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_GTA6} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["gta", "6", "primeira", "nao", "faca", "isso", "treze", "anos", "baixe", "antena", "estacao", "espacial", "internet", "lenta", "cento", "cinquenta", "gigas", "segundo", "astronautas", "wifi", "reclamacao", "mae", "acorde", "sirene", "navio", "madrugada", "decibeis", "bairro", "acorda", "carnaval", "telao", "estadio", "futebol", "tv", "pequena", "vinte", "metros", "quadrados", "quarenta", "mil", "pessoas", "ingresso", "bater", "carro", "poste", "lanche", "helicoptero", "pausar", "trezentas", "pizzas", "telhado", "pizzaria", "cnpj", "carregue", "controle", "usina", "itaipu", "bateria", "acaba", "melhor", "momento", "catorze", "megawatts", "vizinho", "conta", "luz", "guarani", "paraguaio", "seguro", "quarto", "estudando", "seguir", "perfil", "save", "sumir", "ultima", "missao"]);
/* ---------- cartões no estilo "guia" ---------- */
const NumBadge: React.FC<{from: number; to: number; n: number}> = ({from, to, n}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10);
  return (
    <div style={{position: "absolute", left: 70, top: 120, width: 96, height: 96, transform: `scale(${s})`, borderRadius: 48, background: "#ffd21f", border: "7px solid #101018", display: "flex", alignItems: "center", justifyContent: "center", fontFamily, fontWeight: 900, fontSize: 60, color: "#101018"}}>
      {n}
    </div>
  );
};
const TopTitle: React.FC<{from: number; to: number; text: string; size?: number}> = ({from, to, text, size = 92}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: 540, top: 330, width: 960, transform: `translate(-50%,-50%) scale(${s})`, textAlign: "center", fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1.0, color: "#ffd21f", WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", textTransform: "uppercase"}}>
      {text}
    </div>
  );
};
const Card: React.FC<{from: number; to: number; y?: number; children: React.ReactNode}> = ({from, to, y = 820, children}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: 540, top: y, transform: `translate(-50%,-50%) scale(${s})`, background: "#ffffff", borderRadius: 36, padding: "30px 46px", boxShadow: "0 10px 0 rgba(0,0,0,0.18), 0 0 0 5px rgba(16,16,24,0.12)", fontFamily, color: "#101018", textAlign: "center", minWidth: 520}}>
      {children}
    </div>
  );
};
const InfoCard: React.FC<{from: number; to: number; big: string; unit: string; small: string}> = ({from, to, big, unit, small}) => (
  <Card from={from} to={to}>
    <div style={{fontWeight: 900, fontSize: 120, lineHeight: 1}}>{big}</div>
    <div style={{fontWeight: 900, fontSize: 40, color: "#2e6fd8", marginTop: 8}}>{unit}</div>
    <div style={{fontWeight: 600, fontSize: 32, color: "#7a7f8a", marginTop: 10}}>{small}</div>
  </Card>
);
const TimerCard: React.FC<{from: number; to: number; big: string; small: string}> = ({from, to, big, small}) => (
  <Card from={from} to={to}>
    <div style={{display: "flex", alignItems: "center", gap: 26}}>
      <div style={{fontSize: 96}}>⏱️</div>
      <div style={{textAlign: "left"}}>
        <div style={{fontWeight: 900, fontSize: 90, lineHeight: 1, whiteSpace: "nowrap"}}>{big}</div>
        <div style={{fontWeight: 600, fontSize: 34, color: "#7a7f8a"}}>{small}</div>
      </div>
    </div>
  </Card>
);
const CheckCard: React.FC<{from: number; to: number; title: string; items: string[]; step?: number}> = ({from, to, title, items, step = 14}) => {
  const f = useCurrentFrame();
  return (
    <Card from={from} to={to}>
      <div style={{fontWeight: 900, fontSize: 46, color: "#2e6fd8", textAlign: "left", marginBottom: 10}}>{title}</div>
      {items.map((it, i) =>
        f >= from + 8 + i * step ? (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 18, fontWeight: 900, fontSize: 52, textAlign: "left", marginTop: 6}}>
            <span style={{display: "inline-flex", width: 52, height: 52, borderRadius: 26, background: "#2ecc71", color: "#ffffff", alignItems: "center", justifyContent: "center", fontSize: 36}}>✓</span>
            {it}
          </div>
        ) : null,
      )}
    </Card>
  );
};
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



/* ======================= vídeo ======================= */
const FXV = 0.3;
const SND: React.FC<{src: string; from: number; dur?: number; v: number}> = ({src, from, dur = 60, v}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} />
  </Sequence>
);
const FOLLOW_FROM = L(7) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
const ITEMS = ["ANTENA DE ESTAÇÃO ESPACIAL", "SIRENE DE NAVIO", "TELÃO DE ESTÁDIO", "HELICÓPTERO", "USINA DE ITAIPU"];
const SMALL = ["INTERNET LENTA 🐢", "LANÇA DE MADRUGADA 🌙", "TV PEQUENA 📺", "SEM PAUSAR ⏸️", "BATERIA 1% 🔋"];
export const VideoGta6: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <TopTitle from={4} to={ENTAO0 - 2} text="PRIMEIRA VEZ JOGANDO GTA 6?" size={88} />
      <TopTitle from={ENTAO0} to={SE0 - 2} text="NÃO FAÇA ISSO" size={110} />
      <Tag from={TREZE0} to={L(1) - 2} text="13 ANOS ESPERANDO ⏳" y={330} />
      {[1, 2, 3, 4, 5].map((n) => (
        <React.Fragment key={n}>
          <NumBadge from={L(n)} to={L(n + 1) - 2} n={n} />
          <TopTitle from={L(n) + 4} to={EU[n] - 3} text={ITEMS[n - 1]} size={n === 1 ? 80 : 92} />
          <Tag from={EU[n]} to={MAS[n] - 3} text={SMALL[n - 1]} y={330} />
        </React.Fragment>
      ))}
      <InfoCard from={CENTO1} to={OS1 - 4} big="150" unit="GIGAS POR SEGUNDO" small="a sua internet: 2 megas" />
      <Bubble from={SEM1} to={MANDAM1 - 4} text="SEM WI-FI AQUI! 📵" y={420} size={54} />
      <Tag from={MANDAM1} to={L(2) - 2} text="RECLAMAÇÃO DO ESPAÇO 🚀" y={330} />
      <InfoCard from={CENTO2} to={BAIRRO2 - 3} big="150" unit="DECIBÉIS" small="o seu despertador: 60" />
      <CheckCard from={BAIRRO2 + 4} to={L(3) - 2} title="ACORDARAM:" items={["você", "o bairro", "o cachorro do vizinho"]} step={12} />
      <InfoCard from={CENTO3} to={QUARENTA3 - 4} big="120 m²" unit="DE TELÃO" small="a sua TV: meio metro" />
      <InfoCard from={QUARENTA3} to={BATER3 - 2} big="40.000" unit="PESSOAS" small="na sua sala: 1 cachorro" />
      <Ono from={POSTE3} to={L(4) - 2} text="UUUH!" y={420} size={130} color="#ffffff" />
      <InfoCard from={TREZENTAS4} to={AGORA4 - 4} big="300" unit="PIZZAS NO TELHADO" small="você pediu: 1" />
      <Tag from={CNPJ4} to={L(5) - 2} text="CNPJ ATIVO ✓" y={330} />
      <InfoCard from={CATORZE5} to={CONTROLE5 - 6} big="14.000" unit="MEGAWATTS" small="o seu carregador: 0,005" />
      <BigNum from={GUARANI5} to={L(6) - 2} text="₲ 9.000.000" y={330} size={120} />
      <Tag from={QUARTO6} to={MAE6 - 3} text="JEITO CERTO ✓" y={330} />
      <Ono from={ESTUDANDO6} to={L(7) - 2} text="😉" y={330} size={160} />
      <Ono from={SAVE7 + 6} to={TOTAL_GTA6 - 1} text="NÃÃÃO!" y={200} size={130} color="#ff4d6d" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_GTA6 - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozgta6.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {[1, 2, 3, 4, 5].map((n) => (
        <SND key={"n" + n} src="sfx7/boing.mp3" from={L(n)} dur={30} v={FXV * 0.4} />
      ))}
      <SND src="sfx11/drama.mp3" from={ENTAO0} dur={40} v={FXV * 0.35} />
      <SND src="sfx12/satellite.mp3" from={MAS[1]} dur={OS1 - MAS[1]} v={FXV * 0.3} />
      <SND src="sfx15/static.mp3" from={OS1} dur={MANDAM1 - OS1} v={FXV * 0.2} />
      <SND src="sfx14/papel.mp3" from={MANDAM1} dur={30} v={FXV * 0.35} />
      <SND src="sfx14/buzina.mp3" from={MAS[2]} dur={BAIRRO2 - MAS[2]} v={FXV * 0.4} />
      <SND src="sfx13/pagode.mp3" from={BAIRRO2} dur={L(3) - BAIRRO2} v={FXV * 0.25} />
      <SND src="sfx3/crowd.mp3" from={MAS[3]} dur={BATER3 - MAS[3]} v={FXV * 0.3} />
      <SND src="sfx7/crash.mp3" from={BATER3 + 10} dur={30} v={FXV * 0.4} />
      <SND src="sfx12/sadcrowd.mp3" from={POSTE3} dur={L(4) - POSTE3} v={FXV * 0.35} />
      <SND src="sfx7/rumble.mp3" from={L(4)} dur={EU[4] - L(4)} v={FXV * 0.25} />
      <SND src="sfx11/gaming.mp3" from={EU[4]} dur={MAS[4] - EU[4]} v={FXV * 0.25} />
      <SND src="sfx7/rumble.mp3" from={MAS[4]} dur={AGORA4 - MAS[4]} v={FXV * 0.25} />
      <SND src="sfx2/crate.mp3" from={TREZENTAS4} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/cash.mp3" from={CNPJ4} dur={30} v={FXV * 0.35} />
      <SND src="sfx3/factory.mp3" from={MAS[5]} dur={CONTROLE5 - MAS[5]} v={FXV * 0.2} />
      <SND src="sfx14/zap.mp3" from={CONTROLE5} dur={40} v={FXV * 0.4} />
      <SND src="sfx8/beep.mp3" from={VIZINHO5 + 4} dur={20} v={FXV * 0.4} />
      <SND src="sfx12/gasp.mp3" from={CONTA5} dur={40} v={FXV * 0.4} />
      <SND src="sfx3/door.mp3" from={MAE6 - 6} dur={30} v={FXV * 0.3} />
      <SND src="sfx10/sad.mp3" from={SAVE7 + 6} dur={60} v={FXV * 0.35} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
