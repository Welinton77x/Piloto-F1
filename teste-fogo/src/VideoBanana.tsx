import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, V3, Bicycle} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {Pigeon} from "./Sets6";
import {Sparkles} from "./Sets19";
import {Briefcase} from "./Sets36";
import {Vapor} from "./Sets41";
import {Banana, Demiurgo, PortalChao, Cosmos, NuvemMiojo, Peixe, LuaCara, RelogioPastel, Gravata} from "./Sets42";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingBanana.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_BANANA = F(words[words.length - 1].e + 1.2);

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
const BANANA0 = at(0, "banana");
const ESCORREGOU0 = at(0, "escorregou");
const SIX0 = at(0, "six");
const RACHOU1 = at(1, "rachou");
const PORTAL1 = at(1, "portal");
const GELADEIRA2 = at(2, "demiurgo");
const CONTROLE2 = at(2, "controle");
const CHAVE3 = at(3, "chave");
const CABECA3 = at(3, "cabeca");
const MIOJO5 = at(5, "miojo");
const PEIXES5 = at(5, "peixes");
const PASTEIS5 = at(5, "pasteis");
const DUELO6 = at(6, "duelo");
const VENTILADOR6 = at(6, "ventilador");
const VOANDO6 = at(6, "voando");
const LUA7 = at(7, "lua");
const SEGURO7 = at(7, "seguro");
const POMBO7 = at(7, "pombo");
const CANSADO8 = at(8, "cansado");
const BANANA8 = at(8, "banana");
const EMPRESARIA8 = at(8, "empresaria");
const PORTAL10 = at(10, "portal");
const ESCORREGA10 = at(10, "escorrega");
const PARABENS11 = at(11, "parabens");
const FAMOSA11 = at(11, "famosa");
const ASSISTENTE11 = at(11, "assistente");
const SEGUE12 = at(12, "segue");
const DEMIURGO12 = at(12, "demiurgo");

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
const Street: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut />
    <group position={[0, 0, -2.5]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
  </>
);
/* gesto do six seven: palmas pra cima, uma mão sobe e a outra desce */
const SIX = (fr: number, sp = 16): Pose => ({rShoulder: [-0.75 - 0.5 * Math.sin(tf(fr) * sp), 0, -0.3], rElbow: -1.2, lShoulder: [-0.75 + 0.5 * Math.sin(tf(fr) * sp), 0, 0.3], lElbow: -1.2, mouthOpen: 0.4, eyeWide: 0.5, head: [0.15, 0.15 * Math.sin(tf(fr) * sp / 2), 0]});
const Rachadura: React.FC<{k: number}> = ({k}) => (
  <>
    {Array.from({length: 7}, (_, i) => (
      <mesh key={i} position={[Math.cos(i * 0.9) * 0.4 * k, 0.012, 0.6 + Math.sin(i * 0.9) * 0.3 * k]} rotation={[-Math.PI / 2, 0, i * 0.9]} material={sm("#1a1020", 0.9)}>
        <planeGeometry args={[0.9 * k, 0.04]} />
      </mesh>
    ))}
  </>
);

/* 0 — anda, pisa na banana, escorrega e faz o six seven */
const A0: React.FC<ShotProps> = ({f, a, t}) => {
  const sl = f >= ESCORREGOU0 - 8 ? clamp((f - ESCORREGOU0 + 8) / 20) : 0;
  const six = f >= SIX0 - 4;
  return (
    <>
      <Cam pos={[0, 1.6, 4.8]} look={[0, 1.0, 0]} fov={54} f={f} a={f >= ESCORREGOU0 - 8 ? ESCORREGOU0 - 8 : a} punch={f >= ESCORREGOU0 - 8 ? 10 : 7} />
      <Street t={t} />
      {sl < 0.3 ? <Banana p={[0.15, 0, 0.6]} peel s={1.2} /> : <Banana p={[0.15 + sl * 1.5, sl * (1 - sl) * 3, 0.6]} r={[sl * 9, sl * 6, 0]} peel s={1.2} />}
      <group position={[sl > 0 && sl < 1 ? lerp(0.1, 0, sl) : 0, Math.sin(sl * Math.PI) * 1.1, 0.6]} rotation={[-Math.sin(sl * Math.PI) * 0.4, 0, sl < 1 ? sl * Math.PI * 2 : 0]}>
        <PBoy id="a0" a={a} f={f} pose={(fr) => {
          const w = clamp((fr - a) / Math.max(1, ESCORREGOU0 - 10 - a));
          if (six) return {...idle(fr), pos: [0, 0, 0], rotY: 0, ...SIX(fr)};
          if (sl > 0) return {...idle(fr), pos: [0, 0, 0], rotY: 0.3, eyeWide: 1, mouthOpen: 0.8, brow: 1, ...ARMS_UP, legLift: 0.4};
          return {...idle(fr), pos: [lerp(-1.6, 0.05, w), 0, 0], rotY: 1.3, walk: tf(fr) * 9, walkAmt: 1, head: [0.15, 0, 0]};
        }} />
      </group>
    </>
  );
};
/* 1 — mãos sozinhas, o chão racha, abre o portal */
const A1: React.FC<ShotProps> = ({f, a, t}) => {
  const crack = f >= RACHOU1 - 3 ? clamp((f - RACHOU1 + 3) / 10) : 0;
  const por = f >= PORTAL1 - 3 ? clamp((f - PORTAL1 + 3) / 14) : 0;
  const shake = crack > 0 && crack < 1 ? Math.sin(f * 3) * 0.04 : 0;
  return (
    <>
      <Cam pos={[shake, 1.7, 4.2]} look={[0, 1.1, 0]} fov={54} f={f} a={a} />
      <Street t={t} />
      {crack > 0 && por < 0.6 && <Rachadura k={crack} />}
      {por > 0 && <PortalChao p={[0, 0, 0.6]} s={0.9} t={t} k={por} />}
      <PBoy id="a1" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, por > 0.5 ? -clamp((fr - PORTAL1 - 10) / 14) * 2.5 : 0, 0.6], rotY: 0, ...SIX(fr, 18), eyeWide: fr >= RACHOU1 ? 1 : 0.5, brow: fr >= RACHOU1 ? 1 : 0})} />
    </>
  );
};
/* 2 — cai girando, o demiurgo é uma geladeira gigante de três olhos */
const A2: React.FC<ShotProps> = ({f, a, t}) => {
  const dem = f >= GELADEIRA2 - 4;
  if (!dem)
    return (
      <>
        <Cam pos={[0, 1.5, 5.0]} look={[0, 1.4, 0]} fov={56} f={f} a={a} />
        <Cosmos t={t} />
        <group position={[0, lerp(3.5, 0.2, clamp((f - a) / Math.max(1, GELADEIRA2 - 4 - a))), 0]} rotation={[0, 0, t * 6]}>
          <PBoy id="a2" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, -0.9, 0], ...ARMS_UP, eyeWide: 1, mouthOpen: 0.8, brow: 1})} />
        </group>
      </>
    );
  return (
    <>
      <Cam pos={[0, 2.0, 7.4]} look={[0, 2.0, 0]} fov={56} f={f} a={GELADEIRA2 - 4} punch={10} />
      <Cosmos t={t} />
      <Demiurgo p={[0.35, 0, -1.2]} s={1.4} t={t} blink={blinkCurve(f)} mouth={f >= CONTROLE2 ? 0.5 + 0.4 * Math.sin(t * 12) : 0.2} />
      {f >= CONTROLE2 && (
        <mesh position={[1.2, 1.9 + Math.sin(t * 3) * 0.1, -0.5]} rotation={[0.4, 0, t]} geometry={rbox(0.12, 0.4, 0.05, 0.02)} material={sm("#222228", 0.5)} />
      )}
      <PBoy id="a2b" a={GELADEIRA2 - 4} f={f} pose={(fr) => ({...idle(fr), pos: [-0.55, 0, 0.7], rotY: 0.5, head: [-0.35, 0, 0], eyeWide: 1, mouthOpen: 0.6, brow: 1})} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[2.6, 7]} />
        <meshStandardMaterial color="#3a1a6a" emissive="#2a0a5a" emissiveIntensity={0.4} />
      </mesh>
    </>
  );
};
/* 3 — a banana era a chave do universo; física de cabeça pra baixo */
const A3: React.FC<ShotProps> = ({f, a, t}) => {
  const flip = f >= CABECA3 - 4 ? clamp((f - CABECA3 + 4) / 16) : 0;
  return (
    <>
      <Cam pos={[0, 1.8, 6.0]} look={[0, 1.6, 0]} fov={56} f={f} a={a} />
      <Cosmos t={t} />
      <Demiurgo p={[0.6, 0, -1.4]} s={1.0} t={t} blink={blinkCurve(f)} mouth={0.3 + 0.3 * Math.sin(t * 10)} />
      <group position={[-0.2, 2.6 + Math.sin(t * 3) * 0.1, 0]} rotation={[0, t * 2, flip * Math.PI]}>
        <Banana p={[0, -0.3, 0]} s={1.3} />
        {f >= CHAVE3 && <Sparkles p={[0, 0, 0]} t={t} spread={0.7} n={10} />}
      </group>
      <group position={[-0.4, 1.0, 0.6]} rotation={[0, 0, flip * Math.PI]}>
        <PBoy id="a3" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, -0.95, 0], rotY: 0.3, eyeWide: 1, mouthOpen: 0.5, ...(flip > 0 ? ARMS_UP : {})})} />
      </group>
    </>
  );
};
/* 5 — nuvens de miojo, peixes de bicicleta, tempo em pastéis */
const A5: React.FC<ShotProps> = ({f, a, t}) => {
  const bx = f >= PEIXES5 - 4 ? lerp(-2.6, 2.6, clamp((f - PEIXES5 + 4) / 60)) : -9;
  return (
    <>
      <Cam pos={[0, 1.8, 6.0]} look={[0, 1.8, 0]} fov={56} f={f} a={a} />
      <Cosmos t={t} c1="#2a0a4a" />
      <NuvemMiojo p={[-0.7, 3.3, -0.5]} s={1.0} t={t} />
      <NuvemMiojo p={[0.9, 2.9, -1]} s={0.8} t={t + 1} />
      <NuvemMiojo p={[0.1, 3.8, -2]} s={0.7} t={t + 2} />
      <group position={[bx, 0, 0.4]}>
        <Bicycle p={[0, 0, 0]} rotY={Math.PI / 2} spin={t * 10} color="#3a86ff" />
        <Peixe p={[0, 1.15, 0]} rotY={Math.PI / 2} s={1.6} t={t} />
      </group>
      {f >= PASTEIS5 - 3 && <RelogioPastel p={[0, 1.9, 0.5]} s={lerp(0.2, 1.0, easeOut(clamp((f - PASTEIS5 + 3) / 12)))} t={t} />}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 7]} />
        <meshStandardMaterial color="#3a1a6a" emissive="#2a0a5a" emissiveIntensity={0.4} />
      </mesh>
    </>
  );
};
/* 6 — duelo de six seven, viram ventilador e voam */
const A6: React.FC<ShotProps> = ({f, a, t}) => {
  const fan = f >= VENTILADOR6 - 4 ? clamp((f - VENTILADOR6 + 4) / 20) : 0;
  const up = f >= VOANDO6 - 4 ? clamp((f - VOANDO6 + 4) / 30) : 0;
  const spin = fan * fan * (f - VENTILADOR6 + 4) * 0.9;
  return (
    <>
      <Cam pos={[0, 1.9, 6.4]} look={[0, 1.6 + up * 2.5, 0]} fov={56} f={f} a={a} punch={8} />
      <Cosmos t={t} />
      <SpeedLines p={[0, 1.6, -0.5]} dir={-1} />
      <group position={[0, up * up * 5, 0]} rotation={[0, spin, 0]}>
        <Demiurgo p={[0.75, 0, -0.6]} s={0.9} t={t} blink={blinkCurve(f)} arms={1} mouth={0.4} />
        <PBoy id="a6" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, 0, 0.3], rotY: 0.6, ...SIX(fr, 24), brow: -1})} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 7]} />
        <meshStandardMaterial color="#3a1a6a" emissive="#2a0a5a" emissiveIntensity={0.4} />
      </mesh>
    </>
  );
};
/* 7 — atropelam a Lua, ela pede o seguro, o corretor é um pombo de terno */
const A7: React.FC<ShotProps> = ({f, a, t}) => {
  const hit = f >= LUA7 - 2;
  const k = clamp((f - a) / Math.max(1, LUA7 - 2 - a));
  const pk = f >= POMBO7 - 6 ? clamp((f - POMBO7 + 6) / 18) : 0;
  return (
    <>
      <Cam pos={[0, 1.8, 6.2]} look={[0, 1.8, 0]} fov={56} f={f} a={hit ? LUA7 - 2 : a} punch={hit ? 12 : 7} />
      <Cosmos t={t} c1="#0a0620" />
      <LuaCara p={[0.4, 2.2 + (hit ? Math.sin(Math.min(1, (f - LUA7) / 10) * Math.PI) * 0.2 : 0), -0.8]} s={1.0} t={t} angry={f >= SEGURO7 ? 1 : 0} blink={blinkCurve(f)} mouth={f >= SEGURO7 ? 0.4 + 0.4 * Math.sin(t * 12) : hit ? 0.8 : 0} />
      <group position={hit ? [-0.6, 1.0 - clamp((f - LUA7) / 12) * 0.3, 0.6] : [lerp(-3, -0.6, k), lerp(3.2, 1.0, k), 0.6]} rotation={[0, hit ? 0 : t * 12, hit ? 0.3 : 0]}>
        <Demiurgo p={[0.2, -0.4, -0.5]} s={0.45} t={t} blink={hit ? 1 : 0} mouth={0.5} />
        <PBoy id="a7" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.2, -0.9, 0], rotY: 0.4, eyeWide: 1, mouthOpen: 0.6, brow: 1, ...(hit ? {} : ARMS_UP)})} />
      </group>
      {pk > 0 && (
        <group position={[lerp(3, 1.0, easeOut(pk)), 0.25, 0.9]} scale={2.6}>
          <Pigeon p={{pos: [0, 0, 0], rotY: -0.8, flap: pk < 1 ? 1 : 0, t}} />
          <Gravata p={[-0.06, 0.2, 0.12]} s={0.8} />
          <Briefcase p={[-0.15, 0.06, 0.1]} s={0.25} />
        </group>
      )}
    </>
  );
};
/* 8 — demiurgo cansado devolve a banana, que fala inglês e vira empresária */
const A8: React.FC<ShotProps> = ({f, a, t}) => {
  const bk = f >= BANANA8 - 4 ? clamp((f - BANANA8 + 4) / 18) : 0;
  return (
    <>
      <Cam pos={[0, 1.6, 5.4]} look={[0, 1.3, 0]} fov={56} f={f} a={a} />
      <Cosmos t={t} />
      <Demiurgo p={[0.75, f >= CANSADO8 ? -0.3 : 0, -1.0]} s={0.9} t={t} tired={f >= CANSADO8 ? 1 : 0} blink={0.3} mouth={f >= CANSADO8 ? 0.6 : 0.2} />
      {bk > 0 && (
        <group position={[lerp(0.6, -0.05, easeOut(bk)), 0.9 + Math.sin(t * 4) * 0.06, 0.7]}>
          <Banana p={[0, 0, 0]} s={1.5} t={t} face={1} glasses={f >= EMPRESARIA8} talk={f < L(9) ? 1 : 0} blink={blinkCurve(f + 4)} />
          {f >= EMPRESARIA8 && <Briefcase p={[0.25, 0.1, 0.1]} s={0.3} />}
        </group>
      )}
      <PBoy id="a8" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, 0, 0.5], rotY: 0.6, eyeWide: fr >= BANANA8 ? 1 : 0.4, mouthOpen: fr >= EMPRESARIA8 ? 0.6 : 0.1, brow: fr >= EMPRESARIA8 ? 1 : 0})} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3, 7]} />
        <meshStandardMaterial color="#3a1a6a" emissive="#2a0a5a" emissiveIntensity={0.4} />
      </mesh>
    </>
  );
};
/* 10 — volta pelo portal e escorrega de novo */
const A10: React.FC<ShotProps> = ({f, a, t}) => {
  const out = clamp((f - a) / 16);
  const sl = f >= ESCORREGA10 - 6 ? clamp((f - ESCORREGA10 + 6) / 20) : 0;
  return (
    <>
      <Cam pos={[0, 1.6, 4.8]} look={[0, 1.0, 0]} fov={54} f={f} a={f >= ESCORREGA10 - 6 ? ESCORREGA10 - 6 : a} punch={f >= ESCORREGA10 - 6 ? 10 : 7} />
      <Street t={t} />
      <PortalChao p={[-0.6, 0, 0.4]} s={0.7} t={t} k={1 - clamp((f - a - 30) / 12)} />
      <Banana p={[0.35, 0, 0.6]} peel s={1.2} />
      <group position={[lerp(-0.6, 0.25, clamp((f - a - 14) / Math.max(1, ESCORREGA10 - 20 - a))), Math.sin(out * Math.PI) * 1.4 + Math.sin(sl * Math.PI) * 1.0, 0.6]} rotation={[0, 0, sl > 0 && sl < 1 ? -sl * Math.PI * 2 : 0]}>
        <PBoy id="a10" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, 0, 0], rotY: 0.4, ...(sl > 0 || out < 1 ? {...ARMS_UP, eyeWide: 1, mouthOpen: 0.8} : {walk: tf(fr) * 9, walkAmt: 1, smile: 1})})} />
      </group>
    </>
  );
};
/* 11 — PARABÉNS: a banana famosa, você o assistente */
const A11: React.FC<ShotProps> = ({f, a, t}) => {
  const fame = f >= FAMOSA11 - 4;
  return (
    <>
      <Cam pos={[0, 1.6, 4.8]} look={[0, 1.1, 0]} fov={54} f={f} a={a} punch={10} />
      <Street t={t} />
      {fame && (
        <>
          <mesh position={[0.2, 0.01, 0.4]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#c8262d", 0.8)}>
            <planeGeometry args={[1.0, 4]} />
          </mesh>
          <Banana p={[0.2, 0.05 + Math.abs(Math.sin(t * 5)) * 0.1, 0.7]} s={1.6} t={t} face={1} glasses blink={blinkCurve(f)} />
          <Sparkles p={[0.2, 1.0, 0.6]} t={t} spread={1.2} n={14} />
        </>
      )}
      <PBoy id="a11" a={a} f={f} item={f >= ASSISTENTE11 ? <Briefcase s={0.5} /> : undefined} pose={(fr) =>
        fr < FAMOSA11 - 4
          ? {...idle(fr), pos: [0, Math.abs(Math.sin(tf(fr) * 7)) * 0.3, 0.6], rotY: 0, ...ARMS_UP, rShoulder: [-2.9, 0, -0.35 - 0.3 * Math.sin(tf(fr) * 14)], lShoulder: [-2.9, 0, 0.35 + 0.3 * Math.sin(tf(fr) * 14)], smile: 1, mouthOpen: 0.6}
          : {...idle(fr), pos: [-0.75, 0, 0.3], rotY: 0.5, eyeWide: 0.3, mouthOpen: 0.1, brow: -0.6, smile: 0, rShoulder: [-0.2, 0, -0.1], rElbow: -0.2}
      } />
    </>
  );
};
/* 12 — furioso: AGORA SEGUE O PERFIL */
const A12: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.5, 4.6]} look={[0, 1.15, 0.2]} fov={54} f={f} a={a} punch={14} />
    <Street t={t} />
    <pointLight position={[0, 2.2, 2.0]} intensity={8} distance={6} color="#ff3020" />
    <PBoy id="a12" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, hop(fr, a, 10, 0.2) + Math.sin(tf(fr) * 40) * 0.01, 0.6], rotY: 0, torso: [0.15, 0, 0], brow: -1, eyeWide: 0.3, mouthOpen: 0.7, smile: 0, rShoulder: [-1.5, 0, -0.1], rElbow: 0, lShoulder: [0.1, 0, 0.6], lElbow: -1.6})} />
    <Vapor p={[0, 2.25, 0.6]} t={t} />
    {f >= DEMIURGO12 - 4 && <Demiurgo p={[0.75, lerp(-2.5, 0, easeOut(clamp((f - DEMIURGO12 + 4) / 12))), -0.6]} s={0.75} t={t} mouth={0.8} />}
  </>
);

const SHOTS: Shot[] = [
  {from: 0, Comp: A0},
  {from: L(1), Comp: A1},
  {from: L(2), Comp: A2},
  {from: L(3), Comp: A3},
  {from: L(5), Comp: A5},
  {from: L(6), Comp: A6},
  {from: L(7), Comp: A7},
  {from: L(8), Comp: A8},
  {from: L(10), Comp: A10},
  {from: L(11), Comp: A11},
  {from: L(12), Comp: A12},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_BANANA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["banana", "escorregou", "six", "seven", "rachou", "portal", "demiurgo", "cobra", "leao", "universo", "controle", "chave", "fisica", "cabeca", "escorregao", "cosmico", "miojo", "peixes", "bicicleta", "pasteis", "duelo", "ventilador", "cosmos", "lua", "seguro", "pombo", "terno", "migalhas", "cansado", "ingles", "empresaria", "contrato", "bananistico", "escorrega", "parabens", "famosa", "assistente", "segue", "perfil"]);
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
  [L(4), L(5), ["ESCORREGÃO", "CÓSMICO"]],
  [L(9), L(10), ["CONTRATO", "BANANÍSTICO"]],
];
const SixSeven: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const k = Math.floor((f - from) / 8) % 2;
  return (
    <div style={{position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily, fontWeight: 900, fontSize: 300, color: k ? "#ffd21f" : "#ffffff", WebkitTextStroke: "16px #101018", paintOrder: "stroke fill", transform: `rotate(${k ? -6 : 6}deg) scale(${1 + 0.08 * Math.sin((f - from) * 0.8)})`}}>
      {k ? "7" : "6"}
    </div>
  );
};
const Angry: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const k = Math.min(1, (f - from) / 8);
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(255,0,0,0) 40%, rgba(220,0,0,${0.35 * k}) 100%)`}} />;
};
const FOLLOW_FROM = SEGUE12 - 6;
const FOLLOW_TAP = FOLLOW_FROM + 30;
export const VideoBanana: React.FC = () => {
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
      <Ono from={BANANA0} to={ESCORREGOU0 - 8} text="PLÉC!" size={140} color="#ffd21f" />
      <Ono from={ESCORREGOU0 - 8} to={SIX0 - 4} text="WOOOOW!" size={130} color="#ffffff" />
      <SixSeven from={SIX0 - 2} to={RACHOU1 - 4} />
      <Ono from={RACHOU1} to={PORTAL1 - 3} text="CRAAACK!" size={130} color="#ffffff" />
      <Ono from={PORTAL1} to={L(2) - 2} text="VUUUSH!" size={140} color="#e08aff" />
      <Ono from={GELADEIRA2 - 2} to={CONTROLE2 - 4} text="ZÔÔÔM" size={130} color="#4ad8ff" />
      <Bubble from={CONTROLE2} to={L(3) - 2} text="CADÊ O CONTROLE?" x={540} y={380} size={54} />
      <Ono from={CABECA3 - 2} to={L(4) - 2} text="¡ǝuɐɹʇsƎ" size={130} color="#ffffff" />
      <Ono from={PEIXES5} to={PASTEIS5 - 3} text="TRIM TRIM!" size={120} color="#ffd21f" />
      <Ono from={PASTEIS5} to={L(6) - 2} text="⏰ = 🥟" size={130} color="#ffffff" />
      <SixSeven from={DUELO6 + 6} to={VENTILADOR6 - 4} />
      <Ono from={VENTILADOR6} to={VOANDO6 - 2} text="VRRRRRR!" size={130} color="#7fd0ff" />
      <Ono from={VOANDO6} to={L(7) - 2} text="FIIIUUU!" size={130} color="#ff9a3a" />
      <Ono from={LUA7 - 2} to={SEGURO7 - 2} text="BONK!" size={170} color="#ffffff" />
      <Bubble from={SEGURO7} to={POMBO7 - 6} text="CADÊ O SEGURO?!" x={600} y={430} size={54} />
      <Ono from={POMBO7} to={L(8) - 2} text="RU RU!" size={130} color="#cfd4da" />
      <Ono from={CANSADO8} to={BANANA8 - 4} text="ZZZ..." size={130} color="#ffffff" />
      <Bubble from={BANANA8 + 10} to={EMPRESARIA8 - 2} text="HELLO, BABY!" x={540} y={430} size={58} />
      <Plaque from={EMPRESARIA8} to={L(9) - 2} text={"🍌 BANANA\nPRODUÇÕES"} x={540} y={420} size={60} />
      <Ono from={PORTAL10 - 4} to={ESCORREGA10 - 6} text="PLOP!" size={140} color="#e08aff" />
      <Ono from={ESCORREGA10 - 6} to={L(11) - 2} text="PLÉC! DE NOVO?!" size={110} color="#ffd21f" />
      <Confetti from={PARABENS11} to={PARABENS11 + 60} />
      <Ono from={FAMOSA11} to={L(12) - 2} text="📸 FLASH! FLASH!" size={100} color="#ffffff" />
      <Angry from={L(12)} />
      <Ono from={SEGUE12 - 6} to={TOTAL_BANANA - 1} text="😡" size={200} color="#ffffff" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_BANANA - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio: som junto de cada onomatopeia ---------- */}
      <Audio src={staticFile("vozbanana.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.12} />
      ))}
      <SND src="sfx7/boing.mp3" from={BANANA0} dur={30} v={FXV * 0.5} />
      <SND src="sfx7/whoosh.mp3" from={ESCORREGOU0 - 8} dur={30} v={FXV * 0.5} />
      <SND src="sfx3/crack.mp3" from={RACHOU1} dur={40} v={FXV * 0.6} />
      <SND src="sfx11/rocket.mp3" from={PORTAL1} dur={50} v={FXV * 0.4} />
      <SND src="sfx18/brilho.mp3" from={GELADEIRA2 - 2} dur={45} v={FXV * 0.5} />
      <SND src="sfx9/wobble.mp3" from={CABECA3 - 2} dur={50} v={FXV * 0.45} />
      <SND src="sfx20/lamp.mp3" from={PEIXES5} dur={30} v={FXV * 0.5} />
      <SND src="sfx11/rocket.mp3" from={VOANDO6} dur={50} v={FXV * 0.4} />
      <SND src="sfx10/bonk.mp3" from={LUA7 - 2} dur={30} v={FXV * 0.8} />
      <SND src="sfx7/whoosh.mp3" from={POMBO7 - 6} dur={25} v={FXV * 0.4} />
      <SND src="sfx9/yawn.mp3" from={CANSADO8} dur={45} v={FXV * 0.4} />
      <SND src="sfx18/brilho.mp3" from={EMPRESARIA8} dur={40} v={FXV * 0.4} />
      <SND src="sfx7/pof.mp3" from={PORTAL10 - 4} dur={20} v={FXV * 0.5} />
      <SND src="sfx7/boing.mp3" from={ESCORREGA10 - 6} dur={30} v={FXV * 0.5} />
      <SND src="sfx9/yay.mp3" from={PARABENS11} dur={50} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS11} dur={50} v={FXV * 0.4} />
      <SND src="sfx20/steam.mp3" from={L(12)} dur={45} v={FXV * 0.5} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
