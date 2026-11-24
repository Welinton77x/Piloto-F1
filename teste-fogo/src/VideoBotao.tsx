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
import {sm, rbox, Sofa, Desk} from "./Sets9";
import {Bread} from "./Sets4";
import {Cow} from "./Sets8";
import {Chick} from "./Sets11";
import {Egg} from "./Sets19";
import {Bg} from "./Sets20";
import {Turtle} from "./Sets33";
import {BotaoDesfazer, Gato, Lustre, Trigo, CopoLeite} from "./Sets40";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingBotao2.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_BOTAO = F(words[words.length - 1].e + 1.2);

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
const APERTA0 = at(0, "aperta");
const APERTOU0 = at(0, "apertou");
const SEGUNDA0 = at(0, "segunda-feira");
const DOMINGO1 = at(1, "domingo");
const CHEFE1 = at(1, "chefe");
const PIJAMA1 = at(1, "pijama");
const CAFE2 = at(2, "cafe");
const TRIGO2 = at(2, "trigo");
const VACA2 = at(2, "vaca", 1);
const GRAVIDADE4 = at(4, "gravidade");
const GATO4 = at(4, "gato");
const TARTARUGA5 = at(5, "tartaruga");
const HINO5 = at(5, "hino");
const CANTA6 = at(6, "canta");
const OVO6 = at(6, "ovo", 1);
const PINTINHO6 = at(6, "pintinho");
const BOTAO6 = at(6, "botao");
const NORMAL8 = at(8, "normal");
const SOFA8 = at(8, "sofa");
const SEGUNDA8 = at(8, "segunda-feira");
const PARABENS9 = at(9, "parabens");
const DUAS9 = at(9, "duas");
const SEGUIR10 = at(10, "seguir");

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
const CHEFE: ToyLook = {shirt: "#9ad0f0", pants: "#9ad0f0", hairStyle: "bald", skin: "#e0b08a", belly: 0.7};
const Street: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut />
    <group position={[0, 0, -2.5]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
  </>
);
const Casa: React.FC<{wall?: string}> = ({wall = "#f6d9a8"}) => (
  <>
    <Bg c="#f3e3c8" />
    <KitchenLights />
    <mesh position={[0, 2, -1.8]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color={wall} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#c99a6a" />
    </mesh>
  </>
);
const TABLE: V3 = [0.5, 0, -0.9];

/* 0 — achou o botão e apertou */
const B0: React.FC<ShotProps> = ({f, a, t}) => {
  const press = f >= APERTOU0 - 2 && f < APERTOU0 + 10 ? 1 : 0;
  return (
    <>
      <Cam pos={[0, 1.5, 4.6]} look={[0, 0.8, 0]} fov={54} f={f} a={f >= APERTOU0 ? APERTOU0 : a} punch={f >= APERTOU0 ? 12 : 7} />
      <Street t={t} />
      <BotaoDesfazer p={[0.3, 0, 0.7]} s={1.1} press={press} glow={1} t={t} />
      <PBoy id="b0" a={a} f={f} pose={(fr) => {
        const w = clamp(fr / 40);
        const pr = fr >= APERTOU0 - 6 && fr < APERTOU0 + 14;
        return {...idle(fr), pos: [lerp(-2.2, -0.45, easeOut(w)), hop(fr, SEGUNDA0, 12, 0.25), 0.6], rotY: w < 1 ? 1.4 : 0.7, walk: tf(fr) * 9, walkAmt: w < 1 ? 1 : 0, torso: [pr ? 0.45 : 0, 0, 0], ...(pr ? {rShoulder: [-0.9, 0.3, 0], rElbow: -0.2} : fr >= APERTA0 && fr < APERTOU0 - 6 ? {lShoulder: [-1.5, -0.3, 0.2], lElbow: -0.1, brow: 1} : fr >= SEGUNDA0 ? {...ARMS_UP} : {}), eyeWide: fr >= APERTOU0 ? 1 : 0.4, mouthOpen: fr >= SEGUNDA0 ? 0.5 : 0, smile: fr >= SEGUNDA0 ? 1 : 0};
      }} />
    </>
  );
};
/* 1 — todo mundo feliz no domingo; o chefe de pijama */
const B1: React.FC<ShotProps> = ({f, a, t}) => {
  const boss = f >= CHEFE1 - 4;
  return (
    <>
      <Cam pos={boss ? [0.4, 1.5, 3.4] : [0, 2.0, 6.5]} look={boss ? [0.6, 1.1, 0] : [0, 1.2, 0]} fov={54} f={f} a={boss ? CHEFE1 - 4 : a} />
      <Street t={t} />
      {!boss &&
        [0, 1, 2, 3, 4].map((i) => (
          <Toy key={i} look={i === 2 ? BOY : NEIGHBORS[i]} pose={{...idle(f + i * 7), pos: [-2 + i, Math.abs(Math.sin(t * 7 + i)) * 0.2, 0.4 + (i % 2) * 0.6], rotY: 0, ...ARMS_UP, smile: 1, mouthOpen: 0.5}} />
        ))}
      {boss && (
        <>
          <Desk p={[0.9, 0, -0.3]} w={1.4} />
          <PBoy id="b1" a={CHEFE1 - 4} f={f} look={CHEFE} pose={(fr) => ({...idle(fr), pos: [0.9, 0, 0.35], rotY: Math.PI, head: [0.2, 0, 0], rShoulder: [-1.2, 0.3, 0], rElbow: -0.5 + 0.2 * Math.sin(tf(fr) * 20), lShoulder: [-1.2, -0.3, 0], lElbow: -0.5 + 0.2 * Math.sin(tf(fr) * 20 + 1), brow: -1, mouthOpen: 0.2})} />
        </>
      )}
    </>
  );
};
/* 2–3 — desfaz o café da manhã: pão vira trigo, leite volta pra vaca */
const B2: React.FC<ShotProps> = ({f, a, t}) => {
  const wheat = f >= TRIGO2 - 4;
  const milk = f >= TRIGO2 + 20 ? 1 - clamp((f - TRIGO2 - 20) / 20) : 1;
  const cow = f >= VACA2 - 6 ? easeOut(clamp((f - VACA2 + 6) / 24)) : 0;
  return (
    <>
      <Cam pos={[0.2, 1.7, 5.8]} look={[0.2, 1.0, -0.6]} fov={54} f={f} a={a} />
      <Casa />
      <mesh position={[TABLE[0], 0.72, TABLE[2]]} geometry={rbox(1.4, 0.08, 0.8, 0.03)} material={sm("#8a5a2a", 0.6)} castShadow />
      {[[-0.6, -0.3], [0.6, -0.3], [-0.6, 0.3], [0.6, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[TABLE[0] + x, 0.36, TABLE[2] + z]} material={sm("#6a4020", 0.6)}>
          <boxGeometry args={[0.07, 0.72, 0.07]} />
        </mesh>
      ))}
      {wheat ? <Trigo p={[TABLE[0] - 0.25, 0.76, TABLE[2]]} s={1.3} /> : <Bread p={[TABLE[0] - 0.25, 0.76, TABLE[2]]} />}
      <CopoLeite p={[TABLE[0] + 0.3, 0.76, TABLE[2]]} k={milk} />
      {cow > 0 && <Cow c={{pos: [lerp(3.2, 1.25, cow), 0, 0.2], rotY: -0.9, walk: t * 8, walkAmt: cow < 1 ? 1 : 0, arms: "crossed", armK: 1, t, mouth: f >= L(3) - 20 ? 0.4 : 0.2, blink: blinkCurve(f), brow: -1}} s={0.85} />}
      <PBoy id="b2" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, hop(fr, TRIGO2, 12, 0.2), 0.3], rotY: 0.7, eyeWide: fr >= TRIGO2 ? 1 : 0.4, mouthOpen: fr >= VACA2 ? 0.5 : 0, brow: fr >= TRIGO2 ? 1 : 0, ...(fr >= VACA2 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : {})})} />
    </>
  );
};
/* 4 — desfaz a gravidade: tudo flutua, gato no lustre */
const B4: React.FC<ShotProps> = ({f, a, t}) => {
  const fl = f >= GRAVIDADE4 ? easeOut(clamp((f - GRAVIDADE4) / 30)) : 0;
  const bob = (ph: number) => Math.sin(t * 1.5 + ph) * 0.12 * fl;
  return (
    <>
      <Cam pos={[0, 2.0, 5.4]} look={[0, 1.4, -0.6]} fov={56} f={f} a={a} />
      <Casa wall="#cfe3d9" />
      <Lustre p={[0.6, 4.0, -0.6]} t={t} swing={1} />
      <Gato p={[0.6, 3.25, -0.6]} r={[0, 0.3, 0.2]} s={1.0} t={t} angry={f >= GATO4 ? 1 : 0.3} />
      <group position={[-1.0, fl * 1.1 + bob(0), -0.9]} rotation={[0, 0, fl * 0.25]}>
        <Sofa p={[0, 0, 0]} rotY={0} color="#3cb3a5" />
      </group>
      <Cow c={{pos: [1.4, fl * 1.4 + bob(1), -0.4], rotY: -0.5, arms: "up", armK: 1, t, mouth: 0.5, blink: blinkCurve(f), lean: fl * 0.3}} s={0.8} />
      <group position={[-0.1, fl * 1.0 + bob(2), 0.5]} rotation={[0, 0, -fl * 0.4]}>
        <PBoy id="b4" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, 0, 0], rotY: 0.2, ...(fl > 0 ? {rShoulder: [-1.6, 0, -1.2 + 0.4 * Math.sin(tf(fr) * 6)], lShoulder: [-1.6, 0, 1.2 - 0.4 * Math.sin(tf(fr) * 6)], walk: tf(fr) * 4, walkAmt: 0.5} : {}), eyeWide: 1, mouthOpen: 0.5})} />
      </group>
    </>
  );
};
/* 5–7 — a tartaruga técnica; vira ovo; pintinho apaga o botão */
const B5: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - TARTARUGA5 + 4) / 50);
  const egg = f >= OVO6 - 4;
  const chick = f >= PINTINHO6 - 4;
  const gone = f >= BOTAO6 + 14;
  const press = f >= BOTAO6 - 4 && f < BOTAO6 + 8 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.1, 1.6, 5.8]} look={[0.1, 0.8, 0]} fov={54} f={f} a={f >= CANTA6 ? CANTA6 : a} />
      <Street t={t} />
      {!gone && <BotaoDesfazer p={[0.05, 0, 0.7]} s={0.9} press={press} glow={1} t={t} />}
      {!egg && (
        <group position={[lerp(2.6, 1.0, easeOut(k)), 0, 0.5]}>
          <Turtle p={[0, 0, 0]} rotY={k < 1 ? -1.4 : -0.6} s={0.8} t={t} walk={k < 1 ? 0.3 : 0} blink={0.3} watch={false} />
          <group position={[0.12, 0.62, 0.62]} rotation={[0.4, -0.6, 0]}>
            <mesh material={sm("#e8262d", 0.5)}>
              <coneGeometry args={[0.04, 0.12, 4]} />
            </mesh>
          </group>
        </group>
      )}
      {egg && !chick && <Egg p={[1.0, 0, 0.5]} s={1.6} />}
      {chick && <Chick c={{pos: [chick && f >= BOTAO6 - 10 ? lerp(1.0, 0.25, clamp((f - BOTAO6 + 10) / 8)) : 1.0, f >= BOTAO6 - 4 && !gone ? 0.25 : 0, 0.55], rotY: -1.2, t, peep: 1, run: f >= BOTAO6 - 10 && f < BOTAO6 - 2 ? 1 : 0, s: 1.6}} />}
      <PBoy id="b5" a={a} f={f} pose={(fr) => {
        const back = fr >= HINO5 && fr < OVO6;
        return {...idle(fr), pos: [-0.65, 0, 0.3], rotY: back ? Math.PI : 0.6, ...(back ? {rShoulder: [-2.4, 0.2, -0.3], rElbow: -0.3, mouthOpen: 0.5 + 0.3 * Math.sin(tf(fr) * 9)} : {}), eyeWide: fr >= OVO6 ? 1 : 0.4, brow: fr >= OVO6 ? 1 : 0, ...(fr >= BOTAO6 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1, mouthOpen: 0.6} : {})};
      }} />
    </>
  );
};
/* 8 — tudo volta: a vaca cai no sofá e a segunda-feira volta */
const B8: React.FC<ShotProps> = ({f, a, t}) => {
  const fall = f >= SOFA8 - 10 ? clamp((f - SOFA8 + 10) / 14) : 0;
  return (
    <>
      <Cam pos={[0, 2.0, 6.2]} look={[0, 1.4, -0.6]} fov={56} f={f} a={a} />
      <Casa wall="#cfe3d9" />
      <Lustre p={[0.6, 4.0, -0.6]} t={t} />
      <Sofa p={[-0.2, 0, -0.9]} rotY={0} color="#3cb3a5" />
      <Cow c={{pos: [-0.2, lerp(2.6, 0.45, fall * fall), -0.7], rotY: 0.2, arms: "up", armK: 1, t, mouth: 0.6, blink: 0, lean: fall < 1 ? 0.3 : 0}} s={0.8} />
      <PBoy id="b8" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0.95, Math.max(0, 1.0 - clamp((fr - a) / 14) * 1.0), 0.5], rotY: -0.5, squash: fr >= a + 14 && fr < a + 22 ? 0.3 * Math.sin(((fr - a - 14) / 8) * Math.PI) : 0, eyeWide: 1, mouthOpen: fr >= SEGUNDA8 ? 0.7 : 0.3, brow: 1, ...(fr >= SEGUNDA8 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : {})})} />
    </>
  );
};
/* 9–10 — duas segundas-feiras; a ameaça do pintinho */
const B9: React.FC<ShotProps> = ({f, a, t}) => {
  const threat = f >= SEGUIR10 - 4;
  return (
    <>
      <Cam pos={threat ? [0.2, 0.9, 3.0] : [0.2, 1.6, 4.0]} look={threat ? [0.2, 0.5, 0] : [0.2, 1.0, -0.4]} fov={52} f={f} a={threat ? SEGUIR10 - 4 : a} />
      <Street t={t} />
      {threat ? (
        <>
          <BotaoDesfazer p={[-0.15, 0, 0.3]} s={0.7} glow={1} t={t} />
          <Chick c={{pos: [0.4, 0, 0.3], rotY: -0.6, t, peep: 1, s: 1.8, jump: Math.abs(Math.sin(t * 6)) * 0.08}} />
        </>
      ) : (
        <>
          <Desk p={[0.2, 0, -0.5]} w={1.6} />
          <PBoy id="b9" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0.2, 0, 0.25], rotY: 0, head: [0.3, 0, 0], eyeWide: 0, blink: 0.4, mouthOpen: 0.2, brow: -0.6, rShoulder: [-1.1, 0.3, 0], rElbow: -0.6, lShoulder: [-1.1, -0.3, 0], lElbow: -0.6})} />
        </>
      )}
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: B0},
  {from: L(1), Comp: B1},
  {from: L(2), Comp: B2},
  {from: L(4), Comp: B4},
  {from: L(5), Comp: B5},
  {from: L(8), Comp: B8},
  {from: L(9), Comp: B9},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_BOTAO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["botao", "desfazer", "aperta", "apertou", "segunda-feira", "domingo", "feliz", "chefe", "pijama", "cafe", "pao", "trigo", "leite", "vaca", "explicacao", "retrocesso", "matinal", "gravidade", "flutuar", "gato", "lustre", "ofendido", "tecnico", "tartaruga", "terno", "costas", "hino", "ovo", "pintinho", "cancelamento", "definitivo", "normal", "sofa", "parabens", "duas", "seguir", "fim", "semana"]);
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
  [L(3), L(4), ["RETROCESSO", "MATINAL"]],
  [L(7), L(8), ["CANCELAMENTO", "DEFINITIVO"]],
];
const Notes: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const k = ((f - from) / 40 + i * 0.25) % 1;
        return <div key={i} style={{position: "absolute", left: 300 + i * 90 + Math.sin(k * 6 + i) * 30, top: 820 - k * 300, fontSize: 80, opacity: 1 - k}}>{i % 2 ? "♪" : "♫"}</div>;
      })}
    </>
  );
};
const FOLLOW_FROM = SEGUIR10 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoBotao: React.FC = () => {
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
      <Ono from={APERTOU0} to={SEGUNDA0 - 2} text="CLICK!" size={140} color="#ffffff" />
      <Plaque from={SEGUNDA0} to={L(1) + 30} text={"SEGUNDA ➜ DOMINGO"} x={540} y={420} size={62} />
      <Bubble from={PIJAMA1} to={L(2) - 2} text="DE PIJAMA?!" x={600} y={560} size={56} />
      <Ono from={TRIGO2} to={VACA2 - 4} text="PUF!" size={150} color="#ffd21f" />
      <Ono from={VACA2} to={L(3) - 2} text="MUUU?!" size={140} color="#ffffff" />
      <Ono from={GRAVIDADE4} to={GATO4 - 2} text="FLUTUA!" size={130} color="#7fd0ff" />
      <Ono from={GATO4} to={L(5) - 2} text="MIAU!" size={140} color="#ff9a3a" />
      <Notes from={HINO5} to={OVO6 - 4} />
      <Ono from={OVO6} to={PINTINHO6 - 2} text="POF!" size={150} color="#ffffff" />
      <Ono from={PINTINHO6} to={BOTAO6 - 2} text="PIU!" size={140} color="#ffd21f" />
      <Ono from={BOTAO6 + 12} to={L(7) - 2} text="PUFT!" size={150} color="#e8262d" />
      <Ono from={SOFA8 - 2} to={SEGUNDA8 - 2} text="TUM!" size={150} color="#ffffff" />
      <BigNum from={SEGUNDA8} to={L(9) - 2} text="SEGUNDA-FEIRA 😩" size={100} />
      <Plaque from={DUAS9} to={L(10) - 2} text={"📅 SEGUNDA\n📅 SEGUNDA"} x={540} y={420} size={62} />
      <Confetti from={PARABENS9} to={PARABENS9 + 50} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_BOTAO - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio: som junto de cada onomatopeia ---------- */}
      <Audio src={staticFile("vozbotao2.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.12} />
      ))}
      <SND src="sfx19/rewind.mp3" from={APERTOU0} dur={45} v={FXV * 0.6} />
      <SND src="sfx9/yay.mp3" from={DOMINGO1} dur={50} v={FXV * 0.35} />
      <SND src="sfx7/pof.mp3" from={TRIGO2} dur={20} v={FXV * 0.5} />
      <SND src="sfx10/moo.mp3" from={VACA2} dur={45} v={FXV * 0.5} />
      <SND src="sfx9/wobble.mp3" from={GRAVIDADE4} dur={50} v={FXV * 0.45} />
      <SND src="sfx19/meow.mp3" from={GATO4} dur={40} v={FXV * 0.6} />
      <SND src="sfx7/pof.mp3" from={OVO6} dur={20} v={FXV * 0.55} />
      <SND src="sfx13/peeps.mp3" from={PINTINHO6} dur={40} v={FXV * 0.45} />
      <SND src="sfx2/click.mp3" from={BOTAO6} dur={20} v={FXV * 0.8} />
      <SND src="sfx12/poof.mp3" from={BOTAO6 + 12} dur={30} v={FXV * 0.5} />
      <SND src="sfx7/boing.mp3" from={SOFA8 - 2} dur={30} v={FXV * 0.5} />
      <SND src="sfx9/alarm.mp3" from={SEGUNDA8} dur={45} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS9} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
