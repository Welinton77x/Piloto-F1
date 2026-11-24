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
import {SunFace, Moon, Backyard, SkyDome} from "./Sets13";
import {ClosedStall, ClosedSign, Pastel} from "./Sets15";
import {Pyramid, Airliner} from "./Sets17";
import {Hen, BedroomC, Sparkles} from "./Sets19";
import {Cama} from "./Sets39";
import {Camelo, Patinete, Mumia, Domino, Oculos, Frigideira, Fogareiro, Raios, Vapor, Flamingo, BombaSuco, PipocaChuva, Piscina} from "./Sets41";
import {Penguin} from "./Sets11";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingSol2.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_SOL2 = F(words[words.length - 1].e + 1.2);

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
const SOL0 = at(0, "sol");
const TELHADO1 = at(1, "telhado");
const SENHA1 = at(1, "senha");
const GALINHA1 = at(1, "galinha");
const EGITO1 = at(1, "egito");
const CAMELO2 = at(2, "camelo");
const POSTO2 = at(2, "posto");
const SUCO2 = at(2, "suco");
const FLAMINGO2 = at(2, "flamingo");
const DANCINHA2 = at(2, "dancinha");
const GALINHA2 = at(3, "galinha");
const DOMINO2 = at(3, "domino");
const PERDENDO4 = at(4, "perdendo");
const AJUDA4 = at(4, "ajuda");
const PINGUINS4 = at(4, "pinguins");
const PASTEL3 = at(5, "pastel");
const FERIAS4 = at(6, "ferias");
const FRITA4 = at(6, "frita");
const CRESCE4 = at(6, "cresce");
const VOANDO4 = at(6, "voando");
const AVIAO7 = at(7, "aviao");
const PIPOCA7 = at(7, "pipoca");
const CHOVE7 = at(7, "chove");
const OLHA6 = at(9, "olha");
const PROPRIO6 = at(9, "proprio");
const MORDE6 = at(9, "morde");
const NOITE6 = at(9, "noite");
const ESCURO11 = at(11, "escuro");
const PISCINA11 = at(11, "piscina");
const MUMIA11 = at(11, "mumia");
const ABAJUR11 = at(11, "abajur");
const DEITA8 = at(12, "deita");
const MASTIGA8 = at(12, "mastiga");
const PARABENS9 = at(13, "parabens");
const QUARTO9 = at(13, "quarto");
const SEGUE10 = at(14, "segue");

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
/* deserto do Egito (dia → noite) */
const Deserto: React.FC<{night?: number; t: number; pyr?: boolean}> = ({night = 0, t, pyr = true}) => (
  <>
    <SkyDome night={night} t={t} />
    <hemisphereLight args={["#ffeccc", "#a08a5e", 1.1 * (1 - night * 0.75)]} />
    <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.6 * (1 - night * 0.85)} ext={12} />
    {night > 0.5 && <pointLight position={[0, 3, 3]} intensity={6} distance={12} color="#8aa0ff" />}
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 60]} />
      <meshStandardMaterial color="#e9c784" />
    </mesh>
    {pyr && (
      <>
        <Pyramid p={[-4, 0, -14]} s={2.2} />
        <Pyramid p={[5, 0, -18]} s={2.8} />
        <Pyramid p={[1, 0, -24]} s={1.6} />
      </>
    )}
  </>
);
/* pirâmide pequena com a galinha, a múmia e o dominó */
const Jogo: React.FC<{t: number; f: number; hy?: number; stare?: number; mum?: number}> = ({t, f, hy = 0, stare = 0, mum = 1}) => (
  <>
    <Pyramid p={[-0.35, 0, -0.2]} s={0.32} />
    <group position={[-0.35, 1.0 + hy, -0.2]}>
      <Hen p={[0, 0, 0]} rotY={0.5} s={0.9} t={t} blink={blinkCurve(f)} stare={stare} />
      <Oculos p={[0.08, 0.66, 0.24]} s={0.9} />
    </group>
    <Domino p={[0.55, 0, 0.2]} s={1} />
    <Mumia p={[1.05, 0, -0.1]} rotY={-0.9} s={0.75} t={t} arm={mum} />
  </>
);
const Quarto: React.FC = () => (
  <>
    <BedroomC night />
    <KitchenLights night />
    <pointLight position={[0.5, 2.6, 1.5]} intensity={10} distance={10} color="#ffe6b0" />
  </>
);
/* pastel virando sol */
const PastelSol: React.FC<{p: V3; s: number; t: number; glow: number; bite?: boolean}> = ({p, s, t, glow, bite = false}) => (
  <group position={p}>
    <Pastel p={[0, 0, 0]} r={[Math.PI / 2, 0, 0]} s={s} fry={1} bite={bite} />
    {glow > 0 && <Raios p={[0, 0, -0.1]} s={s * 0.9} t={t} k={glow} />}
    {glow > 0 && <pointLight position={[0, 0, 0.8]} intensity={8 * glow} distance={8} color="#ffd060" />}
  </group>
);

/* 0 — quer dormir cedo, mas o sol tá lá */
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.7, 4.8]} look={[0.1, 1.6, 0]} fov={54} f={f} a={a} />
    <DayOut />
    <Backyard t={t} />
    <SunFace p={[0.7, 3.3, -2.5]} r={0.75} t={t} blink={blinkCurve(f + 9)} face={f >= SOL0 ? 1 : 0} />
    <PBoy id="s0" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.3, 0, 0.6], rotY: 0.3, head: [fr >= SOL0 ? -0.4 : 0.1, 0, 0], ...(fr < SOL0 ? {...ARMS_UP, mouthOpen: 0.9, blink: 0.8} : {eyeWide: 0.6, brow: 1, rShoulder: [-2.6, 0, -0.2], rElbow: -0.1})})} />
  </>
);
/* 1 — telhado: o sol quer senha */
const S1: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.4, 5.0]} look={[0.1, 2.1, 0]} fov={54} f={f} a={f >= SENHA1 ? SENHA1 : a} punch={f >= SENHA1 ? 9 : 7} />
    <DayOut />
    <mesh position={[0, 0.55, -0.4]} rotation={[0.25, 0, 0]} geometry={rbox(5, 0.12, 3, 0.03)} material={sm("#c8553a", 0.8)} receiveShadow castShadow />
    <SunFace p={[0.5, 3.6, -2.6]} r={1.0} t={t} blink={blinkCurve(f + 4)} />
    <PBoy id="s1" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.35, 0.55 + hop(fr, a, 14, 0.5), 0.3], rotY: 0.4, head: [-0.35, 0, 0], ...(fr < SENHA1 ? {walk: tf(fr) * 8, walkAmt: 0.6, rShoulder: [-1.6, 0.4, 0], rElbow: -0.3} : fr < EGITO1 ? {lShoulder: [-1.2, 0, 1.2], lElbow: -1.8, brow: -0.5} : {eyeWide: 1, mouthOpen: 0.6, ...ARMS_UP})})} />
  </>
);
/* 2 — Egito: camelo de patinete, depois a galinha no topo da pirâmide */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const jogo = f >= L(3);
  if (jogo)
    return (
      <>
        <Cam pos={[0.3, 1.7, 5.2]} look={[0.3, 1.0, 0]} fov={54} f={f} a={L(3)} punch={9} />
        <Deserto t={t} />
        <Jogo t={t} f={f} hy={hop(f, DOMINO2, 10, 0.15)} mum={f >= DOMINO2 ? 1 : 0} />
      </>
    );
  if (f >= POSTO2 - 3) return <Posto f={f} a={POSTO2 - 3} t={t} />;
  const k = clamp((f - a) / Math.max(1, POSTO2 - 3 - a));
  const x = lerp(1.8, -0.4, k);
  return (
    <>
      <Cam pos={[0.2, 1.9, 7.4]} look={[0.2, 1.4, 0]} fov={54} f={f} a={a} />
      <Deserto t={t} />
      <SpeedLines p={[x + 1.4, 1.0, 0]} dir={1} />
      <group position={[x, 0, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <Patinete p={[0, 0, 0]} s={1.3} t={t} />
        <Camelo p={[0, 0.2, -0.1]} s={1.1} t={t} walk={0} blink={blinkCurve(f)} />
        <PBoy id="s2" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, 1.12, -0.05], rotY: 1.2, legLift: 1, ...ARMS_UP, smile: 1, mouthOpen: 0.5, eyeWide: 0.6})} />
      </group>
    </>
  );
};
/* 3 — a galinha pede um pastel */
const S3: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.2, 1.6, 3.3]} look={[-0.2, 1.3, -0.2]} fov={52} f={f} a={a} />
    <Deserto t={t} />
    <Jogo t={t} f={f} hy={hop(f, PASTEL3, 12, 0.25)} stare={1} mum={0} />
  </>
);
/* 4 — feira de férias → frita o pastel → cresce e voa */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const fry = f >= FRITA4 - 3;
  if (!fry)
    return (
      <>
        <Cam pos={[0, 1.5, 4.8]} look={[0, 1.0, 0]} fov={54} f={f} a={a} />
        <Street t={t} />
        <ClosedStall p={[0.6, 0, -0.6]} rotY={-0.2} />
        <ClosedSign p={[0.5, 0, 0.3]} rotY={-0.2} s={0.9} />
        <PBoy id="s4" a={a} f={f} pose={(fr) => {
          const w = clamp((fr - a) / 22);
          return {...idle(fr), pos: [lerp(-2.2, -0.5, easeOut(w)), 0, 0.5], rotY: w < 1 ? 1.4 : 0.6, ...(w < 1 ? RUN(tf(fr)) : {}), eyeWide: fr >= FERIAS4 ? 1 : 0.4, mouthOpen: fr >= FERIAS4 ? 0.6 : 0.3, brow: fr >= FERIAS4 ? 1 : 0, ...(fr >= FERIAS4 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : {})};
        }} />
      </>
    );
  const g = f >= CRESCE4 ? clamp((f - CRESCE4) / 30) : 0;
  const fly = f >= VOANDO4 ? clamp((f - VOANDO4) / 35) : 0;
  const s = lerp(0.35, 1.1, easeOut(g));
  return (
    <>
      <Cam pos={[0, 1.6, 4.4]} look={[0, 1.2 + fly * 1.2, 0]} fov={54} f={f} a={FRITA4 - 3} />
      <Street t={t} />
      <Fogareiro p={[0.35, 0, 0]} />
      <Frigideira p={[0.35, 0.83, 0]} t={t} />
      <PastelSol p={[0.35, 0.95 + fly * fly * 4.5 + g * 0.3, 0.05]} s={s} t={t} glow={fly} />
      <PBoy id="s4b" a={FRITA4 - 3} f={f} pose={(fr) => ({...idle(fr), pos: [-0.55, 0, 0.35], rotY: 0.7, eyeWide: fr >= CRESCE4 ? 1 : 0.5, mouthOpen: fr >= CRESCE4 ? 0.6 : 0.1, head: [fly > 0 ? -0.5 : 0.2, 0, 0], ...(fr >= VOANDO4 ? ARMS_UP : {rShoulder: [-1.1, 0.3, 0], rElbow: -0.6})})} />
    </>
  );
};
/* 5 — pastel solar no céu */
const S5: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.2, 4.6]} look={[0, 2.4, 0]} fov={56} f={f} a={a} />
    <Street t={t} />
    <PastelSol p={[0, 2.9 + Math.sin(t * 2) * 0.08, -0.5]} s={1.2} t={t} glow={1} />
    <Sparkles p={[0, 2.9, -0.3]} t={t} spread={1.6} n={14} />
  </>
);
/* 6 — a galinha descobre, morde o sol, vira noite */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const jump = f >= MORDE6 - 14 ? clamp((f - MORDE6 + 14) / 14) : 0;
  const back = f >= MORDE6 + 4 ? clamp((f - MORDE6 - 4) / 14) : 0;
  const hy = jump * 2.0 * (1 - back);
  const night = f >= NOITE6 - 6 ? clamp((f - NOITE6 + 6) / 14) : 0;
  const bitten = f >= MORDE6;
  return (
    <>
      <Cam pos={[0.2, 1.6, 5.8]} look={[0.2, 1.9, 0]} fov={56} f={f} a={f >= MORDE6 ? MORDE6 : a} punch={f >= MORDE6 ? 12 : 7} />
      <Deserto t={t} night={night} />
      {(night < 1 || bitten) && <PastelSol p={[-0.2, 3.3, -0.6]} s={0.8} t={t} glow={bitten ? Math.max(0, 1 - night) * 0.3 : 1} bite={bitten} />}
      {night > 0.9 && <Moon p={[1.0, 3.6, -3]} r={0.3} />}
      <Jogo t={t} f={f} hy={hy} stare={f >= OLHA6 ? 1 : 0} mum={0} />
    </>
  );
};
/* 8 — tenta dormir, a galinha mastigando alto */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const chew = f >= MASTIGA8 ? Math.abs(Math.sin(t * 14)) : 0;
  return (
    <>
      <Cam pos={[0, 2.6, 3.4]} look={[0, 0.8, -0.4]} fov={54} f={f} a={a} />
      <Quarto />
      <group position={[0, 0.98, 0.45]} rotation={[-Math.PI / 2, 0, 0]}>
        <PBoy id="s8" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, 0, 0], rotY: 0, blink: fr >= MASTIGA8 ? 0 : 0.9, eyeWide: fr >= MASTIGA8 ? 1 : 0, brow: fr >= MASTIGA8 ? -1 : 0})} />
      </group>
      <group position={[0.55, 0.76, -1.55]}>
        <Hen p={[0, chew * 0.06, 0]} rotY={-0.6} s={0.7} t={t} blink={blinkCurve(f)} />
        <Oculos p={[-0.04, 0.47 + chew * 0.06, 0.15]} s={0.65} />
      </group>
    </>
  );
};
/* 9 — PARABÉNS animado no quarto */
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.6, 5.4]} look={[0, 1.1, 0.6]} fov={54} f={f} a={a} punch={10} />
    <Quarto />
    <group position={[0.6, 0.76, -0.4]}>
      <Hen p={[0, Math.abs(Math.sin(t * 12)) * 0.05, 0]} rotY={-0.5} s={0.7} t={t} blink={blinkCurve(f)} />
      <Oculos p={[-0.04, 0.47, 0.15]} s={0.65} />
    </group>
    <PBoy id="s9" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.2, Math.abs(Math.sin(tf(fr) * 7)) * 0.3, 1.25], rotY: 0.1, ...ARMS_UP, rShoulder: [-2.9, 0, -0.35 - 0.3 * Math.sin(tf(fr) * 14)], lShoulder: [-2.9, 0, 0.35 + 0.3 * Math.sin(tf(fr) * 14)], smile: 1, mouthOpen: 0.6, eyeWide: 0.5, squash: 0})} />
  </>
);
/* 10 — furioso: AGORA SEGUE O PERFIL */
const S10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.7, 4.6]} look={[0, 1.45, 1.1]} fov={52} f={f} a={a} punch={14} />
    <Quarto />
    <pointLight position={[0, 2.2, 2.5]} intensity={8} distance={6} color="#ff3020" />
    <PBoy id="s10" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, hop(fr, a, 10, 0.2) + Math.sin(tf(fr) * 40) * 0.01, 1.2], rotY: 0, torso: [0.15, 0, 0], brow: -1, eyeWide: 0.3, mouthOpen: 0.7, smile: 0, rShoulder: [-1.5, 0, -0.1], rElbow: 0, lShoulder: [0.1, 0, 0.6], lElbow: -1.6})} />
    <Vapor p={[0, 2.25, 1.2]} t={t} />
  </>
);

/* 2b — posto de suco, frentista flamingo, pagamento em dancinha */
const Posto: React.FC<{f: number; a: number; t: number}> = ({f, a, t}) => {
  const dance = f >= DANCINHA2 - 4 ? 1 : 0;
  return (
    <>
      <Cam pos={[-0.1, 1.8, 7.4]} look={[-0.1, 1.1, 0]} fov={54} f={f} a={f >= DANCINHA2 - 4 ? DANCINHA2 - 4 : a} punch={f >= DANCINHA2 - 4 ? 9 : 7} />
      <Deserto t={t} />
      <mesh position={[0.4, 2.3, -0.6]} geometry={rbox(2.6, 0.12, 1.4, 0.03)} material={sm("#ff8a1f", 0.5)} castShadow />
      {[-0.6, 1.4].map((x) => (
        <mesh key={x} position={[x, 1.15, -0.6]} material={sm("#f2f2f2", 0.5)}>
          <cylinderGeometry args={[0.06, 0.06, 2.3, 10]} />
        </mesh>
      ))}
      <BombaSuco p={[0.35, 0, -0.5]} />
      <group position={[-1.15, 0, -0.3]} rotation={[0, Math.PI / 2, 0]}>
        <Patinete p={[0, 0, 0]} s={1.3} t={0} />
        <Camelo p={[0, 0.2, -0.1]} s={1.1} t={t} blink={blinkCurve(f + 5)} />
      </group>
      {f >= SUCO2 && (
        <mesh position={[-0.3, 1.35, -0.05]} rotation={[0, 0, 1.2]} material={sm("#ffb020", 0.3, {emissive: "#ff8a1f", emissiveIntensity: 0.3})}>
          <cylinderGeometry args={[0.03, 0.03, 0.9, 8]} />
        </mesh>
      )}
      <Flamingo p={[1.0, 0, 0.3]} rotY={-0.5} s={1.1} t={t} dance={dance} blink={blinkCurve(f + 3)} />
      <PBoy id="s2p" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.05, dance ? Math.abs(Math.sin(tf(fr) * 10)) * 0.15 : 0, 0.6], rotY: 0.3, ...(dance ? {rShoulder: [-2.4 + Math.sin(tf(fr) * 10) * 0.6, 0, -0.5], lShoulder: [-0.6 - Math.sin(tf(fr) * 10) * 0.6, 0, 0.6], rElbow: -0.8, lElbow: -1.2, smile: 1, mouthOpen: 0.4, torso: [0, 0, Math.sin(tf(fr) * 10) * 0.15]} : fr >= FLAMINGO2 ? {eyeWide: 1, brow: 1, mouthOpen: 0.4} : {})})} />
    </>
  );
};
/* 4 — a múmia perdendo, chama os pinguins */
const S4b: React.FC<ShotProps> = ({f, a, t}) => {
  const k = f >= PINGUINS4 - 6 ? clamp((f - PINGUINS4 + 6) / 24) : 0;
  return (
    <>
      <Cam pos={[0.4, 1.6, 5.6]} look={[0.4, 1.0, 0]} fov={54} f={f} a={f >= AJUDA4 ? AJUDA4 : a} punch={f >= AJUDA4 ? 9 : 7} />
      <Deserto t={t} />
      <Jogo t={t} f={f} mum={f >= AJUDA4 ? 2 : 0.5} />
      {k > 0 &&
        [0, 1, 2].map((i) => (
          <group key={i} position={[lerp(3.4 + i * 0.5, 0.2 + i * 0.45, easeOut(k)), 0, 1.0 - i * 0.15]}>
            <Penguin p={[0, 0, 0]} rotY={k < 1 ? -1.4 : -0.3} t={t + i} walk={k < 1 ? 1 : 0} dance={k >= 1 ? 1 : 0} s={0.8} blink={0} />
            <Oculos p={[0, 0.95 * 0.8, 0.27 * 0.8]} s={1.0} dark />
          </group>
        ))}
    </>
  );
};
/* 7 — pastel bate no avião → pipoca → chove pipoca no Egito */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  if (f >= CHOVE7 - 3)
    return (
      <>
        <Cam pos={[0.3, 1.7, 5.6]} look={[0.3, 1.2, 0]} fov={54} f={f} a={CHOVE7 - 3} />
        <Deserto t={t} />
        <Jogo t={t} f={f} hy={Math.abs(Math.sin(t * 8)) * 0.1} stare={1} mum={2} />
        {[0, 1, 2].map((i) => (
          <group key={i} position={[0.2 + i * 0.45, 0, 1.0 - i * 0.15]}>
            <Penguin p={[0, 0, 0]} rotY={-0.3} t={t + i} dance={1} s={0.8} />
            <Oculos p={[0, 0.76, 0.22]} s={1.0} dark />
          </group>
        ))}
        <PipocaChuva c={[0.3, 0, 0.3]} t={t} n={70} />
      </>
    );
  const hit = f >= PIPOCA7 - 4;
  const fx = lerp(-1.6, 0.2, clamp((f - a) / Math.max(1, AVIAO7 + 4 - a)));
  return (
    <>
      <Cam pos={[0, 1.2, 4.6]} look={[0, 2.6, 0]} fov={56} f={f} a={hit ? PIPOCA7 - 4 : a} punch={hit ? 12 : 7} />
      <Street t={t} />
      <PastelSol p={[0, 2.4 + clamp((f - a) / 40) * 0.6, -0.5]} s={0.9} t={t} glow={1} />
      {!hit && <Airliner p={[fx + 0.8, 3.2, -1]} r={[0, Math.PI, 0.15]} s={0.32} />}
      {hit && <PipocaChuva c={[0, 0, -0.5]} t={t} n={60} w={3} />}
    </>
  );
};
/* 11 — caos no escuro: piscina, múmia desenrolando, flamingo abajur */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const fall = f >= PISCINA11 - 14 ? clamp((f - PISCINA11 + 14) / 14) : 0;
  const splash = f >= PISCINA11 ? clamp((f - PISCINA11) / 18) : 0;
  const unr = f >= MUMIA11 ? 1 : 0;
  const lamp = f >= ABAJUR11 - 2 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.1, 2.2, 6.4]} look={[0.1, 1.0, 0]} fov={54} f={f} a={a} />
      <SkyDome night={1} t={t} />
      <hemisphereLight args={["#9aa8ff", "#404070", lamp ? 1.6 : 1.3]} />
      <directionalLight position={[2, 6, 5]} intensity={1.4} color="#b8c4ff" />
      <pointLight position={[0, 3, 3]} intensity={14} distance={14} color="#a0b4ff" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#3a6a3a" />
      </mesh>
      <mesh position={[0, 1.2, -2.6]} geometry={rbox(8, 2.4, 0.2, 0.04)} material={sm("#c8a070", 0.8)} />
      <Piscina p={[-0.4, 0, 0.6]} t={t} splash={splash} />
      {fall < 1 ? (
        <group position={[-0.4 - 1.6 * (1 - fall), 2.2 * (1 - fall * fall), 0.6]} rotation={[0, Math.PI / 2, fall * 1.2]}>
          <Camelo p={[0, -0.9, 0]} s={0.8} t={t} />
        </group>
      ) : (
        <group position={[-0.4, -0.55, 0.6]} rotation={[0, 0.4, 0.2]}>
          <Camelo p={[0, 0, 0]} s={0.8} t={t} blink={1} />
        </group>
      )}
      <Mumia p={[1.0, 0, -0.6]} rotY={-0.4} s={0.75} t={t} arm={1} unravel={unr} />
      <Flamingo p={[1.25, 0, 0.6]} rotY={-0.4} s={1} t={t} lamp={lamp} blink={lamp ? 0.8 : blinkCurve(f)} />
      {[0, 1].map((i) => (
        <group key={i} position={[Math.sin(t * 2 + i * 3) * 1.2, 0, -1.2 + i * 0.4]}>
          <Penguin p={[0, 0, 0]} rotY={Math.cos(t * 2 + i * 3) > 0 ? 1.4 : -1.4} t={t + i} walk={1} s={0.7} />
        </group>
      ))}
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(4), Comp: S4b},
  {from: L(5), Comp: S3},
  {from: L(6), Comp: S4},
  {from: L(7), Comp: S7},
  {from: L(8), Comp: S5},
  {from: L(9), Comp: S6},
  {from: L(11), Comp: S11},
  {from: L(12), Comp: S8},
  {from: L(13), Comp: S9},
  {from: L(14), Comp: S10},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_SOL2} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["dormir", "desligar", "sol", "telhado", "senha", "galinha", "oculos", "egito", "camelo", "patinete", "piramide", "domino", "mumia", "pastel", "feira", "ferias", "frita", "cresce", "ceu", "brilhando", "solar", "morde", "noite", "apagao", "crocante", "posto", "suco", "laranja", "flamingo", "dancinha", "pinguins", "universitarios", "aviao", "pipoca", "escuro", "piscina", "abajur", "mastiga", "parabens", "quarto", "segue", "perfil"]);
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
  [L(8), L(9), ["PASTEL", "SOLAR"]],
  [L(10), L(11), ["APAGÃO", "CROCANTE"]],
];
const Angry: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const k = Math.min(1, (f - from) / 8);
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(255,0,0,0) 40%, rgba(220,0,0,${0.35 * k}) 100%)`}} />;
};
const FOLLOW_FROM = SEGUE10 - 6;
const FOLLOW_TAP = FOLLOW_FROM + 30;
export const VideoSol2: React.FC = () => {
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
      <Ono from={2} to={SOL0 - 4} text="AAAHHH..." size={110} color="#ffffff" />
      <Ono from={TELHADO1 - 4} to={SENHA1 - 2} text="TOC TOC!" size={130} color="#ffd21f" />
      <Bubble from={SENHA1} to={GALINHA1 - 2} text="SÓ COM SENHA!" x={600} y={430} size={56} />
      <Ono from={EGITO1} to={L(2) - 2} text="EGITO?!" size={140} color="#ffffff" />
      <Ono from={CAMELO2} to={POSTO2 - 4} text="VRUUUM!" size={140} color="#7fd0ff" />
      <Ono from={DOMINO2} to={L(4) - 2} text="TLEC!" size={130} color="#ffffff" />
      <Bubble from={PASTEL3 - 6} to={L(6) - 2} text="TRAZ UM PASTEL!" x={540} y={430} size={58} />
      <Plaque from={FERIAS4} to={FRITA4 - 4} text={"PASTELEIRO\nDE FÉRIAS 🏖️"} x={540} y={420} size={60} />
      <Ono from={FRITA4} to={CRESCE4 - 2} text="TSSSS!" size={140} color="#ffd21f" />
      <Ono from={VOANDO4} to={L(7) - 2} text="FIIIUU!" size={140} color="#ff9a3a" />
      <Ono from={MORDE6} to={NOITE6 - 2} text="NHAC!" size={170} color="#ffd21f" />
      <Ono from={MASTIGA8} to={L(13) - 2} text="CROC CROC CROC" size={100} color="#ffd21f" />
      <Plaque from={SUCO2} to={FLAMINGO2 - 2} text={"⛽ SUCO DE\nLARANJA 🍊"} x={540} y={420} size={60} />
      <Ono from={DANCINHA2} to={L(3) - 2} text="TUTS TUTS!" size={130} color="#ff7fae" />
      <Bubble from={AJUDA4} to={PINGUINS4 - 2} text="AJUDA!!" x={700} y={520} size={60} />
      <Ono from={PINGUINS4} to={L(5) - 2} text="😎😎😎" size={130} color="#ffffff" />
      <Ono from={PIPOCA7 - 4} to={CHOVE7 - 4} text="POC!" size={170} color="#ffffff" />
      <Ono from={CHOVE7} to={L(8) - 2} text="PLOC PLOC PLOC" size={100} color="#ffd21f" />
      <Ono from={ESCURO11} to={PISCINA11 - 2} text="BONK! PLAFT!" size={110} color="#ffffff" />
      <Ono from={PISCINA11} to={MUMIA11 - 2} text="TCHIBUM!" size={140} color="#7fd0ff" />
      <Ono from={MUMIA11} to={ABAJUR11 - 3} text="VRRRUM!" size={130} color="#ece2c6" />
      <Ono from={ABAJUR11 - 2} to={L(12) - 2} text="CLIC!" size={150} color="#ffd890" />
      <Confetti from={PARABENS9} to={PARABENS9 + 60} />
      <Angry from={L(14)} />
      <Ono from={SEGUE10 - 6} to={TOTAL_SOL2 - 1} text="😡" size={200} color="#ffffff" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_SOL2 - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio: som junto de cada onomatopeia ---------- */}
      <Audio src={staticFile("vozsol2.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.12} />
      ))}
      <SND src="sfx9/yawn.mp3" from={2} dur={45} v={FXV * 0.5} />
      <SND src="sfx5/knock.mp3" from={TELHADO1 - 4} dur={30} v={FXV * 0.6} />
      <SND src="sfx10/scooter.mp3" from={CAMELO2} dur={50} v={FXV * 0.4} />
      <SND src="sfx20/cluck.mp3" from={GALINHA2} dur={45} v={FXV * 0.5} />
      <SND src="sfx20/clack.mp3" from={DOMINO2} dur={30} v={FXV * 0.6} />
      <SND src="sfx20/cluck.mp3" from={PASTEL3 - 6} dur={45} v={FXV * 0.5} />
      <SND src="sfx20/sizzle.mp3" from={SUCO2} dur={30} v={FXV * 0.2} />
      <SND src="sfx16/funk.mp3" from={DANCINHA2 - 4} dur={L(3) - DANCINHA2} v={FXV * 0.5} />
      <SND src="sfx20/cluck.mp3" from={AJUDA4} dur={30} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={AVIAO7 - 20} dur={40} v={FXV * 0.4} />
      <SND src="sfx18/boom.mp3" from={PIPOCA7 - 4} dur={40} v={FXV * 0.5} />
      <SND src="sfx20/popcorn.mp3" from={CHOVE7} dur={60} v={FXV * 0.6} />
      <SND src="sfx10/bonk.mp3" from={ESCURO11 + 6} dur={20} v={FXV * 0.6} />
      <SND src="sfx7/crash.mp3" from={ESCURO11 + 20} dur={30} v={FXV * 0.35} />
      <SND src="sfx17/splash.mp3" from={PISCINA11} dur={40} v={FXV * 0.6} />
      <SND src="sfx20/unravel.mp3" from={MUMIA11} dur={40} v={FXV * 0.6} />
      <SND src="sfx20/lamp.mp3" from={ABAJUR11 - 2} dur={30} v={FXV * 0.7} />
      <SND src="sfx20/sizzle.mp3" from={FRITA4} dur={60} v={FXV * 0.5} />
      <SND src="sfx11/grow.mp3" from={CRESCE4} dur={40} v={FXV * 0.4} />
      <SND src="sfx11/rocket.mp3" from={VOANDO4} dur={45} v={FXV * 0.35} />
      <SND src="sfx18/brilho.mp3" from={L(5)} dur={45} v={FXV * 0.4} />
      <SND src="sfx20/crunch.mp3" from={MORDE6} dur={30} v={FXV * 0.8} />
      <SND src="sfx8/poweroff.mp3" from={NOITE6 - 4} dur={40} v={FXV * 0.5} />
      <SND src="sfx6/chew.mp3" from={MASTIGA8} dur={50} v={FXV * 0.6} />
      <SND src="sfx9/yay.mp3" from={PARABENS9} dur={50} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS9} dur={50} v={FXV * 0.4} />
      <SND src="sfx20/steam.mp3" from={L(10)} dur={45} v={FXV * 0.5} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
