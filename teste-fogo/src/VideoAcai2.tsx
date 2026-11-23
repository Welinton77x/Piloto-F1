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
import {Scooter} from "./Sets8";
import {BigPhone} from "./Sets17";
import {Sparkles} from "./Sets19";
import {Bg} from "./Sets20";
import {Bear} from "./Sets21";
import {TiaGeladeira} from "./Sets28";
import {AcaiCup} from "./Sets31";
import {Whale, Pepino, VibeShop, Garrafinha, Sabor} from "./Sets32";
import {Captions, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingAcai2.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_ACAI2 = F(words[words.length - 1].e + 3.6);

/* ---------- personagens ---------- */
const BOY: ToyLook = {hoodie: true};
const VO: ToyLook = {hairStyle: "bun", hair: "#f2f2f2", shirt: "#8e5aa8", pants: "#5a4a6a", skin: "#f1c8a0", lips: "#c0606a", browColor: "#e2e2e2"};
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
const ACALMAR0 = at(0, "acalmar");
const CIUMES1 = at(1, "ciumes");
const PEPINO1 = at(1, "pepino");
const URSO2 = at(2, "urso");
const DERRETE4 = at(4, "derrete");
const BALEIA4 = at(4, "baleia");
const NINHO4 = at(4, "ninho");
const NUTELLA5 = at(5, "nutella");
const NUNCA5 = at(5, "nunca");
const POMBO6 = at(6, "pombo-correio");
const MORANGO6 = at(6, "morango");
const VO8 = at(8, "vo");
const TENTACAO8 = at(8, "tentacao");
const BIO8 = at(8, "bio");
const FILA9 = at(9, "fila");
const VOLTA9 = at(9, "volta");
const PAZES10 = at(10, "pazes");
const PACOCA10 = at(10, "pacoca");
const WHATS11 = at(11, "whatsapp");
const CHEGA11 = at(11, "chega");
const PISCAR11 = at(11, "piscar");
const PARABENS12 = at(12, "parabens");
const SEGUIR12 = at(12, "segue");
const AGORA12 = at(12, "agora");
const CARDAPIO12 = at(12, "cardapio");
const END_N = F(words[words.length - 1].e);

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
/** boneco segurando uma coisa em cada mão */
const TwoHands: React.FC<{pose: Pose; look: ToyLook; r: React.ReactNode; l: React.ReactNode}> = ({pose, look, r, l}) => {
  const pr = useRef<THREE.Object3D>(null);
  const pl = useRef<THREE.Object3D>(null);
  return (
    <>
      <Toy pose={pose} look={look} palmRef={pr} lPalmRef={pl} />
      <InHand palm={pr}>{r}</InHand>
      <InHand palm={pl}>{l}</InHand>
    </>
  );
};
const CUP_IN_HAND = <AcaiCup p={[0, -0.04, 0.06]} r={[-Math.PI / 2, 0, 0]} s={0.2} logo={false} />;
const Kitchen: React.FC = () => (
  <>
    <Bg c="#f3e3c8" />
    <KitchenLights />
    <mesh position={[0, 2, -1.8]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color="#f6d9a8" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#c99a6a" />
    </mesh>
  </>
);
const Street: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut />
    <group position={[0, 0, -2]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
  </>
);
const FRIDGE: V3 = [-0.9, 0, -1.1];

/* 0–1 — a geladeira ciumenta */
const K0: React.FC<ShotProps> = ({f, a, t}) => {
  const jealous = f >= CIUMES1 - 4;
  const open = f >= PEPINO1 - 4 ? easeOut(clamp((f - PEPINO1 + 4) / 12)) : 0;
  const shake = jealous && !open ? 0.04 * Math.sin(t * 40) : 0;
  return (
    <>
      <Cam pos={open > 0 ? [0.0, 1.5, 3.4] : [0.1, 1.5, 4.4]} look={open > 0 ? [-0.6, 1.1, -0.8] : [-0.3, 1.0, -0.6]} fov={54} f={f} a={open > 0 ? PEPINO1 - 4 : f >= L(1) ? L(1) : a} />
      <Kitchen />
      <group position={[shake, 0, 0]}>
        <TiaGeladeira p={FRIDGE} rotY={0.3} s={1.0} open={open} mouth={jealous ? 0.3 + 0.2 * Math.abs(Math.sin(t * 8)) : 0} blink={jealous ? 0.5 : blinkCurve(f)} />
      </group>
      {open > 0 &&
        [0, 1, 2, 3, 4].map((i) => {
          const k = clamp((f - PEPINO1 - i * 3) / 20);
          return k > 0 ? <Pepino key={i} p={[FRIDGE[0] + 0.3 + k * (0.4 + i * 0.25), 1.6 - i * 0.2 + Math.sin(k * Math.PI) * 0.5 - k * 0.6, FRIDGE[2] + 0.6 + k * 0.6]} r={[k * 5 + i, k * 3, i]} s={1.6} /> : null;
        })}
      <PBoy id="k0" a={a} f={f} pose={(fr) => {
        const w = clamp(fr / 30);
        const pat = fr >= ACALMAR0 - 6 && fr < L(1);
        return {...idle(fr), pos: [lerp(1.6, 0.35, easeOut(w)), hop(fr, PEPINO1, 12, 0.25), -0.3], rotY: -1.0, walk: tf(fr) * 9, walkAmt: w < 1 ? 1 : 0, ...(pat ? {lShoulder: [-1.4, -0.2, 0.1], lElbow: -0.4 - 0.3 * Math.sin(tf(fr) * 10)} : fr >= PEPINO1 ? {rShoulder: [-1.3, 0.5, 0], rElbow: -1.9, lShoulder: [-1.3, -0.5, 0], lElbow: -1.9} : {}), eyeWide: fr >= CIUMES1 ? 0.9 : 0.3, mouthOpen: fr >= PEPINO1 ? 0.5 : 0, brow: fr >= CIUMES1 ? 1 : 0, smile: pat ? 0.6 : 0};
      }} />
    </>
  );
};
/* 2–3 — o urso polar especialista */
const K2: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - URSO2 + 6) / 40);
  return (
    <>
      <Cam pos={[0.2, 1.7, 5.4]} look={[0.2, 1.0, -0.4]} fov={56} f={f} a={f >= L(3) ? L(3) : a} />
      <Kitchen />
      <TiaGeladeira p={FRIDGE} rotY={0.3} s={1.0} blink={0.5} />
      <Bear polar p={[lerp(4, 1.1, easeOut(k)), 0, -0.3]} rotY={k < 1 ? -1.57 : -0.5} s={0.9} t={t} walk={k < 1 ? 1 : 0} />
      <PBoy id="k2" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.2, hop(fr, L(3), 14, 0.3), 0.4], rotY: 0.6, eyeWide: 0.8, smile: fr >= L(3) ? 1 : 0, ...(fr >= L(3) ? ARMS_UP : {})})} />
    </>
  );
};
/* 4 — o Polo Norte derrete e sai a baleia */
const K4: React.FC<ShotProps> = ({f, a, t}) => {
  const melt = f >= DERRETE4 - 4 ? clamp((f - DERRETE4 + 4) / 30) : 0;
  const rise = f >= BALEIA4 - 8 ? easeOut(clamp((f - BALEIA4 + 8) / 22)) : 0;
  return (
    <>
      <Cam pos={[0, 3.4, 10.5]} look={[0, 1.1, 0]} fov={56} f={f} a={rise > 0 ? BALEIA4 - 8 : a} />
      <Bg c="#9fd8ff" />
      <hemisphereLight args={["#ffffff", "#9fb8d0", 1.2]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.4} ext={12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#eef6fb" />
      </mesh>
      {melt > 0 && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={0.2 + melt * 2.6}>
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial color="#3a8ad0" roughness={0.1} />
        </mesh>
      )}
      {rise > 0 && <Whale p={[0, -2.4 + rise * 2.4, 0]} rotY={0.4} s={1.1} t={t} mouth={f >= NINHO4 - 4 ? 0.6 + 0.3 * Math.sin(t * 10) : 0.2} spout={1} />}
      <Bear polar p={[1.7, 0, 2.4]} rotY={-0.6} s={0.8} t={t} />
      {melt > 0 && <Sparkles p={[1.7, 1.6, 2.4]} t={t} spread={0.6} n={5} />}
    </>
  );
};
/* 5 — a baleia bloqueando a rua */
const K5: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.0, 7.2]} look={[0, 1.2, 0]} fov={56} f={f} a={a} />
    <Street t={t} />
    <Whale p={[0.3, 0, -0.6]} rotY={0.2} s={1.15} t={t} mouth={f < NUNCA5 ? 0.2 + 0.2 * Math.abs(Math.sin(t * 8)) : 0} blink={f >= NUNCA5 ? blinkCurve(f) : 0} spout={f >= NUNCA5 ? 1 : 0} />
    <PBoy id="k5" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-1.6, 0, 1.4], rotY: 0.6, eyeWide: 0.9, brow: 1, ...(fr >= NUNCA5 ? {rShoulder: [-0.4, 0, -0.5], rElbow: -2.2, head: [0, 0, 0.2]} : {lShoulder: [-1.5, -0.2, 0.2], lElbow: -0.1})})} />
  </>
);
/* 6–7 — o pombo-correio viciado */
const K6: React.FC<ShotProps> = ({f, a, t}) => {
  const eat = f >= L(7);
  return (
    <>
      <Cam pos={[0, 1.3, 3.9]} look={[0, 0.75, 0]} fov={52} f={f} a={eat ? L(7) : a} />
      <Street t={t} />
      <mesh position={[0.4, 0.35, 0]} geometry={rbox(0.5, 0.7, 0.5, 0.04)} material={sm("#2e6fd0", 0.5)} castShadow />
      <Pigeon p={{pos: [0.4, 0.7, 0], rotY: -0.4, peck: eat ? Math.abs(Math.sin(t * 9)) : f >= MORANGO6 ? 0.2 : 0, flap: f >= MORANGO6 && !eat ? 1 : 0, t}} s={1.4} />
      {!eat && <BigPhone p={[0.05, 0.95, 0.1]} r={[-0.2, 0.4, 0]} s={0.32} screen={phoneTex()} key2="vibephone2" />}
      {eat && <AcaiCup p={[0.0, 0.7, 0.15]} s={0.32} logo={false} />}
      <PBoy id="k6" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, 0, 0.3], rotY: 0.7, eyeWide: fr >= MORANGO6 ? 1 : 0.4, mouthOpen: fr >= L(7) ? 0.5 : 0, brow: fr >= L(7) ? -0.7 : 0, ...(fr >= L(7) ? {rShoulder: [-0.4, 0, -0.9], rElbow: -1.6, lShoulder: [-0.4, 0, 0.9], lElbow: -1.6} : {})})} />
    </>
  );
};
/* 8 — a vó de patinete com dois Copos Tentação */
const K8: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 36);
  const x = lerp(-4.5, -0.4, easeOut(k));
  return (
    <>
      <Cam pos={[0.2, 1.7, 6.2]} look={[0.2, 1.0, 0]} fov={54} f={f} a={a} />
      <Street t={t} />
      {k < 1 && <SpeedLines p={[x - 0.3, 0, 0.5]} />}
      <group position={[x, 0, 0.5]}>
        <Scooter p={[0, 0, 0]} rotY={Math.PI / 2} spin={-k * 12} />
        <TwoHands look={VO} r={CUP_IN_HAND} l={CUP_IN_HAND} pose={{...idle(f), pos: [0.05, 0.22, 0], rotY: k < 1 ? 1.57 : 0.5, rShoulder: [-1.1, 0.5, 0], rElbow: -0.9, lShoulder: [-1.1, -0.5, 0], lElbow: -0.9, smile: 1, eyeWide: 0.4}} />
      </group>
      <PBoy id="k8" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [1.15, hop(fr, VO8, 14, 0.3), 0.6], rotY: -0.6, eyeWide: 1, mouthOpen: 0.4, brow: 1})} />
    </>
  );
};
/* 9 — a fila que dá a volta em Itumbiara */
const K9: React.FC<ShotProps> = ({f, a, t}) => {
  const big = f >= VOLTA9 - 4;
  return (
    <>
      <Cam pos={big ? [6, 14, 16] : [3.4, 3.4, 11.5]} look={big ? [0, 0, -2] : [0.6, 1.0, 0]} fov={big ? 60 : 56} f={f} a={big ? VOLTA9 - 4 : a} />
      <Street t={t} />
      <VibeShop p={[-2.4, 0, -0.6]} rotY={0.5} />
      <Bear polar p={[-0.8, 0, 0.6]} rotY={-1.9} s={0.7} t={t} />
      <Toy look={VO} pose={{...idle(f), pos: [0.4, 0, 1.0], rotY: -1.9, smile: 1}} />
      <Pigeon p={{pos: [1.2, 0, 1.3], rotY: -1.9, t, peck: Math.abs(Math.sin(t * 3)) * 0.3}} s={1.2} />
      <Whale p={[3.2, 0, 1.2]} rotY={Math.PI + 0.3} s={0.8} t={t} blink={blinkCurve(f)} />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Toy key={i} look={NEIGHBORS[i]} pose={{...idle(f + i * 11), pos: [5.4 + i * 0.9, 0, 1.6 + i * 0.5], rotY: -1.9, eyeWide: 0.5}} />
      ))}
    </>
  );
};
/* 10 — as pazes com a geladeira */
const K10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.1, 1.5, 4.0]} look={[-0.4, 1.1, -0.7]} fov={54} f={f} a={a} />
    <Kitchen />
    <TiaGeladeira p={FRIDGE} rotY={0.3} s={1.0} wink={f >= PACOCA10 ? 1 : 0} mouth={0.3} blink={blinkCurve(f)} />
    {f >= PAZES10 && <Sparkles p={[-0.5, 1.6, -0.6]} t={t} spread={1} n={6} />}
    <PBoy id="k10" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0.0, 0, -0.4], rotY: -1.1, smile: 1, ...(fr >= PAZES10 ? {rShoulder: [-1.4, 0.6, 0], rElbow: -0.7, lShoulder: [-1.4, -0.6, 0], lElbow: -0.7, torso: [0.15, 0, 0]} : {})})} />
  </>
);
/* 11–12 — pede no WhatsApp, o açaí chega voando, parabéns */
const K11: React.FC<ShotProps> = ({f, a, t}) => {
  const got = f >= CHEGA11 + 8;
  const fly = clamp((f - CHEGA11 + 6) / 14);
  const party = f >= PARABENS12;
  return (
    <>
      <Cam pos={[0, 1.8, 6.4]} look={[0, 1.4, 0]} fov={56} f={f} a={party ? PARABENS12 : a} />
      <Street t={t} />
      <Whale p={[2.2, 0, -1.6]} rotY={-0.5} s={0.8} t={t} blink={f >= PISCAR11 - 2 && f < PISCAR11 + 10 ? 1 : 0} />
      {!got && fly > 0 && <AcaiCup p={[lerp(-3, 0, fly), 1.0 + Math.sin(fly * Math.PI) * 1.5, 0.6]} s={0.3} r={[0, 0, fly * 6]} logo={false} />}
      {got && <AcaiCup p={[0, 2.12 + (party ? Math.abs(Math.sin(tf(f) * 7)) * 0.35 : 0), 0.4]} s={0.34} r={[0, t * 2, 0]} logo={false} glow={1} />}
      {party && <Sparkles p={[0, 1.4, 0.4]} t={t} />}
      <PBoy id="k11" a={a} f={f} item={!got ? <BigPhone p={[0, 0.02, 0.06]} r={[-Math.PI / 2 + 0.2, Math.PI, 0]} s={0.36} screen={phoneTex()} key2="vibephone2" /> : undefined} pose={(fr) => {
        if (fr < CHEGA11 + 8) return {...idle(fr), pos: [0, 0, 0.4], rotY: 0, rShoulder: [-1.2, 0.5, 0.05], rElbow: -1.2, head: [0.1, -0.15, 0], smile: 1};
        const j = fr >= PARABENS12 ? Math.abs(Math.sin(tf(fr) * 7)) * 0.35 : 0;
        return {...idle(fr), pos: [0, j, 0.4], ...ARMS_UP, smile: 1, mouthOpen: 0.6, eyeWide: 0.6};
      }} />
    </>
  );
};
/* 12 — propaganda: a loja da Vibe */
const KShop: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 2.0, 8.6]} look={[-0.2, 1.5, -0.5]} fov={54} f={f} a={a} />
    <Street t={t} />
    <VibeShop p={[-0.6, 0, -1.2]} rotY={0.15} s={1.1} />
    <Sparkles p={[-0.6, 3.0, -0.2]} t={t} spread={1.6} n={8} />
    <PBoy id="ks" a={a} f={f} item={CUP_IN_HAND} pose={(fr) => ({...idle(fr), pos: [1.0, hop(fr, a + 4, 14, 0.25), 0.8], rotY: -0.5, rShoulder: [-1.3, 0.4, 0], rElbow: -0.9, lShoulder: [-1.5, -0.6, 0.6], lElbow: -0.1, smile: 1, mouthOpen: 0.3})} />
  </>
);
const SFoto: React.FC<ShotProps> = () => <Bg c="#1a0626" />;
const phoneTex = () =>
  canvasTex("vibephone2", 440, 860, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 860);
    g.addColorStop(0, "#7a2a9a");
    g.addColorStop(1, "#2a0a3a");
    c.fillStyle = g;
    c.fillRect(0, 0, 440, 860);
    c.fillStyle = "#ffffff";
    c.font = "900 92px sans-serif";
    c.textAlign = "center";
    c.fillText("VIBE", 220, 330);
    c.font = "700 36px sans-serif";
    c.fillText("GOURMET AÇAÍ", 220, 385);
    c.fillStyle = "#ffd21f";
    c.fillRect(70, 560, 300, 90);
    c.fillStyle = "#101018";
    c.font = "900 40px sans-serif";
    c.fillText("CARDÁPIO", 220, 620);
  });


/* ---------- vitrine 3D dos sabores ---------- */
const HeroSet: React.FC<{f: number; a: number; t: number; children: React.ReactNode}> = ({f, a, t, children}) => (
  <>
    <Cam pos={[0, 1.3, 3.4]} look={[0, 0.95, 0]} fov={46} f={f} a={a} punch={14} />
    <Bg c="#2a0a3a" />
    <hemisphereLight args={["#ffe6ff", "#3a1050", 0.9]} />
    <pointLight position={[1.5, 3, 2.5]} intensity={14} distance={12} decay={1.4} color="#fff2e0" castShadow />
    <pointLight position={[-2, 1.5, -1]} intensity={8} distance={8} color="#c86bfa" />
    <mesh position={[0, -0.1, 0]} receiveShadow>
      <cylinderGeometry args={[1.0, 1.1, 0.2, 40]} />
      <meshStandardMaterial color="#f4ecf8" />
    </mesh>
    {Array.from({length: 14}, (_, i) => {
      const k = ((t * 0.5 + i / 14) % 1);
      return (
        <mesh key={i} position={[Math.cos(i * 2.4) * (1.2 + k), 0.2 + k * 2.5, Math.sin(i * 2.4) * (1.2 + k) - 0.6]} scale={0.04 * (1 - k)}>
          <octahedronGeometry args={[1, 0]} />
          <meshBasicMaterial color={i % 2 ? "#ffd21f" : "#ffffff"} toneMapped={false} />
        </mesh>
      );
    })}
    <group position={[0, 0, 0]} rotation={[0, (f - a) * 0.05, 0]} scale={0.75 + 0.25 * easeOut(clamp((f - a) / 10))}>
      {children}
    </group>
    <Sparkles p={[0, 1.4, 0]} t={t} spread={1.2} n={8} />
  </>
);
const hero = (sabor: Sabor | "copo"): React.FC<ShotProps> => {
  const H: React.FC<ShotProps> = ({f, a, t}) => (
    <HeroSet f={f} a={a} t={t}>
      {sabor === "copo" ? (
        <>
          <AcaiCup p={[-0.42, 0, 0]} s={0.75} logo={false} />
          <AcaiCup p={[0.42, 0, 0]} s={0.75} logo={false} />
        </>
      ) : (
        <Garrafinha sabor={sabor} s={1.05} glow={1} />
      )}
    </HeroSet>
  );
  return H;
};
const HNinho = hero("ninho");
const HNutella = hero("nutella");
const HMorango = hero("morango");
const HCopo = hero("copo");
const HPacoca = hero("pacoca");

const SHOTS: Shot[] = [
  {from: 0, Comp: K0},
  {from: L(2), Comp: K2},
  {from: L(4), Comp: K4},
  {from: NINHO4 - 2, Comp: HNinho},
  {from: L(5), Comp: K5},
  {from: NUTELLA5 - 2, Comp: HNutella},
  {from: NUNCA5 - 2, Comp: K5},
  {from: L(6), Comp: K6},
  {from: MORANGO6 - 2, Comp: HMorango},
  {from: L(7), Comp: K6},
  {from: L(8), Comp: K8},
  {from: TENTACAO8 - 2, Comp: HCopo},
  {from: BIO8 - 4, Comp: SFoto},
  {from: L(9), Comp: K9},
  {from: L(10), Comp: K10},
  {from: PACOCA10 - 2, Comp: HPacoca},
  {from: L(11), Comp: K11},
  {from: AGORA12 - 2, Comp: KShop},
  {from: CARDAPIO12 - 4, Comp: SFoto},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_ACAI2} t={f / FPS} />
      <Post bloom={0.5} />
    </>
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

const PURPLE = "#7a2a9a";
const IG = "@vibegourmetacai";
const PH: Record<string, [number, number]> = {p1: [1086, 1448], p2: [1200, 1600], p3: [1080, 1440]};
/** foto preenchendo uma caixa, com foco (cx, cy) e zoom */
const TILE: Record<string, [string, string, string]> = {p1: ["#8a5636", "#f6bfcc", "🍫"], p2: ["#f7f1de", "#3a0c3c", "🥛"], p3: ["#3a0c3c", "#f7f1de", "🍓"]};
const Photo: React.FC<{src: string; w?: number; h?: number; cx?: number; cy?: number; zoom?: number; style?: React.CSSProperties}> = ({src, w = 1080, h = 1920, cx = 0.5, style}) => {
  const [c1, c2, e] = TILE[src];
  const em = cx < 0.2 ? "🍫" : cx < 0.4 && cx > 0.2 ? "🍓" : cx > 0.4 && cx < 0.6 && src === "p1" ? "🥜" : cx > 0.8 ? "💛" : e;
  return (
    <div style={{position: "absolute", overflow: "hidden", width: w, height: h, background: `radial-gradient(circle at 30% 30%, ${c2} 0%, ${c1} 55%, #2a0a3a 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: Math.min(w, h) * 0.5, ...style}}>
      {em}
    </div>
  );
};
const Label: React.FC<{text: string; from: number; y?: number; color?: string; size?: number}> = ({text, from, y = 300, color = "#ffd21f", size = 92}) => {
  const f = useCurrentFrame();
  const s = pop(f, from, 10);
  return (
    <div style={{position: "absolute", left: 540, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(-3deg)`, fontFamily, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap", textAlign: "center", lineHeight: 1.0}}>
      {text}
    </div>
  );
};
const Flash: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const o = 1 - clamp((f - at) / 6);
  return f >= at && o > 0 ? <AbsoluteFill style={{background: "#ffffff", opacity: o * 0.8}} /> : null;
};
/* ---------- celular: cardápio e Instagram ---------- */
const MENU: [string, string, string, number, number, number][] = [
  ["Copo Tentação", "🔥 O favorito!", "p3", 0.5, 0.4, 1.3],
  ["Ninho Sensação", "Creme de Ninho artesanal", "p2", 0.5, 0.5, 1.4],
  ["Explosão de Nutella", "Creme artesanal de Nutella", "p1", 0.11, 0.6, 3.2],
  ["Morango dos Sonhos", "Creme de morango", "p1", 0.3, 0.5, 3.2],
  ["Sonho de Paçoca", "Muita paçoca", "p1", 0.48, 0.5, 3.2],
  ["Maracujá Divino", "Creme de maracujá", "p1", 0.88, 0.55, 3.2],
];
const PRICE = ["R$ 20,90", "R$ 19,90", "R$ 19,90", "R$ 19,90", "R$ 19,90", "R$ 19,90"];
const MenuScreen: React.FC<{k: number; tap: number}> = ({k, tap}) => {
  const scroll = easeInOut(clamp(k * 1.4)) * 380;
  return (
    <div style={{position: "absolute", inset: 0, background: "#f6f2fa", fontFamily}}>
      <div style={{position: "absolute", left: 0, right: 0, top: 116 - scroll, zIndex: 0}}>
        <div style={{height: 230, background: `linear-gradient(135deg, ${PURPLE}, #2a0a3a)`, display: "flex", alignItems: "center", padding: "0 26px", gap: 20}}>
          <Img src={staticFile("acai/logo.png")} style={{width: 150, height: 150, borderRadius: 75, border: "5px solid #ffffff"}} />
          <div style={{color: "#fff"}}>
            <div style={{fontWeight: 900, fontSize: 40}}>Vibe Gourmet Açaí</div>
            <div style={{fontSize: 22, opacity: 0.9, marginTop: 6}}>📍 Itumbiara-GO</div>
            <div style={{fontSize: 22, opacity: 0.9}}>🛵 Entrega 20–50 min</div>
          </div>
        </div>
        <div style={{padding: "18px 24px 6px", fontWeight: 900, fontSize: 34, color: "#2a0a3a"}}>Mais pedidos 🔥</div>
        {MENU.map(([n, d, src, cx, cy, z], i) => {
          const tapped = i === 0 && tap > 0;
          return (
            <div key={i} style={{display: "flex", gap: 18, alignItems: "center", margin: "10px 20px", padding: 14, background: tapped ? "#ead8f5" : "#ffffff", borderRadius: 22, boxShadow: "0 3px 10px rgba(0,0,0,0.08)", transform: `scale(${tapped ? 1 - 0.04 * Math.sin(clamp(tap) * Math.PI) : 1})`}}>
              <div style={{width: 130, height: 130, borderRadius: 18, overflow: "hidden", position: "relative", flexShrink: 0}}>
                <Photo src={src} w={130} h={130} cx={cx} cy={cy} zoom={z} />
              </div>
              <div style={{flex: 1}}>
                <div style={{fontWeight: 900, fontSize: 32, color: "#1a0626"}}>{n}</div>
                <div style={{fontSize: 22, color: "#666", marginTop: 4}}>{d}</div>
                <div style={{fontWeight: 900, fontSize: 28, color: PURPLE, marginTop: 6}}>A partir de {PRICE[i]}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{position: "absolute", left: 0, right: 0, top: 0, height: 64, paddingTop: 50, background: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, color: "#555", borderBottom: "2px solid #eee", zIndex: 5}}>🔒 pedido.brendi.com.br/vibe-gourmet-acai</div>
    </div>
  );
};
const InstaScreen: React.FC<{f: number; from: number}> = ({f, from}) => {
  const tap = from + 26;
  const done = f >= tap + 2;
  const press = 1 - 0.08 * Math.sin(clamp((f - tap + 3) / 6) * Math.PI);
  const grid: [string, number, number, number][] = [["p3", 0.5, 0.4, 1], ["p2", 0.5, 0.5, 1], ["p1", 0.5, 0.55, 1], ["p1", 0.13, 0.6, 2.4], ["p1", 0.3, 0.55, 2.4], ["p1", 0.88, 0.55, 2.4]];
  return (
    <div style={{position: "absolute", inset: 0, background: "#ffffff", fontFamily, color: "#101018"}}>
      <div style={{height: 70, marginTop: 50, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 30, borderBottom: "2px solid #eee"}}>vibegourmetacai</div>
      <div style={{display: "flex", alignItems: "center", gap: 28, padding: "26px 28px 10px"}}>
        <div style={{width: 170, height: 170, borderRadius: 85, padding: 6, background: "conic-gradient(#feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5, #feda75)", flexShrink: 0}}>
          <Img src={staticFile("acai/logo.png")} style={{width: 158, height: 158, borderRadius: 79, border: "4px solid #fff"}} />
        </div>
        <div>
          <div style={{fontWeight: 900, fontSize: 36}}>Vibe Gourmet Açaí</div>
          <div style={{fontSize: 26, color: "#555", marginTop: 4}}>{IG}</div>
        </div>
      </div>
      <div style={{padding: "6px 28px", fontSize: 26, lineHeight: 1.35}}>
        💜 Açaí gourmet na garrafinha e no copo
        <br />📍 Itumbiara-GO
        <br />📲 (64) 99252-0622
        <br />
        <span style={{color: "#00376b", fontWeight: 700}}>🔗 pedido.brendi.com.br/vibe-gourmet-acai</span>
      </div>
      <div style={{margin: "16px 28px", padding: "16px 0", borderRadius: 16, textAlign: "center", fontWeight: 900, fontSize: 30, transform: `scale(${press})`, background: done ? "#efefef" : "#0095f6", color: done ? "#101018" : "#ffffff"}}>{done ? "Seguindo ✓" : "Seguir"}</div>
      <div style={{display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, marginTop: 10}}>
        {grid.map(([src, cx, cy, z], i) => (
          <div key={i} style={{position: "relative", height: 260, overflow: "hidden"}}>
            <Photo src={src} w={208} h={260} cx={cx} cy={cy} zoom={z} />
          </div>
        ))}
      </div>
    </div>
  );
};
/* ---------- cartão final ---------- */
const EndCard: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const rows: [number, string, string][] = [
    [from + 10, "📍 Itumbiara-GO", "#ffffff"],
    [from + 18, "📲 WhatsApp: (64) 99252-0622", "#ffffff"],
    [from + 26, "📸 " + IG, "#ffffff"],
    [from + 34, "🛵 Peça agora! Cardápio no link da bio", "#ffd21f"],
  ];
  const sp = Math.sin(f * 0.12) * 4;
  return (
    <AbsoluteFill>
      <div style={{position: "absolute", inset: -40, filter: "blur(18px) brightness(0.45)"}}>
        <div style={{position: "absolute", inset: 0, background: "radial-gradient(circle at 50% 30%, #8a3aaa, #1a0626)"}} />
      </div>
      <Img src={staticFile("acai/logo.png")} style={{position: "absolute", left: 540 - 230, top: 170, width: 460, height: 460, borderRadius: 230, border: "10px solid #ffffff", boxShadow: "0 0 60px #c86bfa", transform: `scale(${pop(f, from, 14)}) rotate(${sp}deg)`}} />
      <div style={{position: "absolute", left: 0, right: 0, top: 680, textAlign: "center", transform: `scale(${pop(f, from + 4, 10)})`, fontFamily, fontWeight: 900, fontSize: 84, color: "#ffffff", WebkitTextStroke: "10px #2a0a3a", paintOrder: "stroke fill"}}>VIBE GOURMET AÇAÍ 💜</div>
      <div style={{position: "absolute", left: 70, right: 70, top: 820, display: "flex", flexDirection: "column", gap: 20}}>
        {rows.map(([t, txt, c], i) =>
          f >= t ? (
            <div key={i} style={{transform: `scale(${pop(f, t, 8)})`, background: "rgba(26,6,38,0.85)", border: `5px solid ${i === 3 ? "#ffd21f" : "#c86bfa"}`, borderRadius: 26, padding: "16px 24px", fontFamily, fontWeight: 900, fontSize: 44, color: c, textAlign: "center"}}>
              {txt}
            </div>
          ) : null,
        )}
      </div>
    </AbsoluteFill>
  );
};
/* marca d'água do Instagram (igual à referência) */
const Watermark: React.FC = () => (
  <div style={{position: "absolute", right: 34, top: 120, display: "flex", alignItems: "center", gap: 10, opacity: 0.85, fontFamily, fontWeight: 900, fontSize: 28, color: "#ffffff", textShadow: "0 2px 6px rgba(0,0,0,0.7)"}}>
    <div style={{width: 40, height: 40, borderRadius: 12, background: "linear-gradient(45deg, #feda75, #d62976, #4f5bd5)", display: "flex", alignItems: "center", justifyContent: "center"}}>
      <div style={{width: 20, height: 20, borderRadius: 10, border: "4px solid #fff"}} />
    </div>
    {IG}
  </div>
);


const ProdLabel: React.FC<{from: number; to: number; text: string}> = ({from, to, text}) => {
  const f = useCurrentFrame();
  if (f < from - 2 || f >= to) return null;
  return <Label text={text} from={from - 2} y={330} size={text.length > 16 ? 84 : 100} />;
};
/* foto de verdade estilo polaroid (não usada) */
// eslint-disable-next-line
const _PhotoCard: React.FC<{from: number; to: number; src: string; cx?: number; cy?: number; zoom?: number; label: string; rot?: number; color?: string}> = ({from, to, src, cx = 0.5, cy = 0.5, zoom = 1, label, rot = -4, color = "#ffd21f"}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 12) * (1 - ramp(f, to - 5, to));
  const wob = Math.sin((f - from) * 0.25) * 1.5;
  return (
    <div style={{position: "absolute", left: 540, top: 640, transform: `translate(-50%,-50%) scale(${s}) rotate(${rot + wob}deg)`}}>
      <div style={{background: "#ffffff", padding: "18px 18px 26px", borderRadius: 10, boxShadow: "0 16px 40px rgba(0,0,0,0.45)", border: "4px solid #101018"}}>
        <div style={{position: "relative", width: 560, height: 640, overflow: "hidden", borderRadius: 4}}>
          <Photo src={src} w={560} h={640} cx={cx} cy={cy} zoom={zoom} />
        </div>
      </div>
      <div style={{position: "absolute", left: "50%", bottom: -70, transform: "translateX(-50%) rotate(3deg)", fontFamily, fontWeight: 900, fontSize: 78, color, WebkitTextStroke: "11px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap"}}>{label}</div>
    </div>
  );
};
const PhoneUI: React.FC<{from: number; to: number; insta?: boolean}> = ({from, to, insta = false}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const s = pop(f, from, 12);
  const k = (f - from) / (to - from);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, #8a3aaa, #1a0626)`}}>
      <div style={{position: "absolute", left: 540, top: 800, width: 660, height: 1300, transform: `translate(-50%,-50%) scale(${s}) rotate(${Math.sin(f * 0.08) * 1.2}deg)`, background: "#101018", borderRadius: 70, padding: 18, boxShadow: "0 30px 60px rgba(0,0,0,0.5)"}}>
        <div style={{position: "relative", width: "100%", height: "100%", borderRadius: 54, overflow: "hidden"}}>
          {insta ? <InstaScreen f={f} from={from} /> : <MenuScreen k={k} tap={(f - (from + 22)) / 8} />}
        </div>
        <div style={{position: "absolute", left: 270, top: 30, width: 120, height: 30, borderRadius: 15, background: "#101018"}} />
      </div>
      <Flash at={from} />
    </AbsoluteFill>
  );
};

/* ======================= vídeo ======================= */
const KEYS = new Set(["acai", "itumbiara", "geladeira", "ciumes", "pepino", "urso", "polar", "gelada", "consultor", "glacial", "derrete", "polo", "norte", "baleia", "ninho", "sensacao", "explosao", "nutella", "pombo-correio", "cardapio", "viciado", "morango", "sonhos", "desvio", "pombistico", "vo", "patinete", "copo", "tentacao", "bio", "fila", "vibe", "gourmet", "volta", "pazes", "sonho", "pacoca", "whatsapp", "piscar", "parabens", "segue", "arroba", "verdade", "peca", "agora"]);
const FXV = 0.3;
const SND: React.FC<{src: string; from: number; dur?: number; v: number}> = ({src, from, dur = 60, v}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} />
  </Sequence>
);
const INSTA_TO = END_N + 6;
export const VideoAcai2: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <TopTitle from={4} to={ACALMAR0 - 3} text="AÇAÍ EM ITUMBIARA" />
      <Tag from={CIUMES1} to={PEPINO1 - 3} text="COM CIÚMES 😤" y={330} />
      <Ono from={PEPINO1} to={L(2) - 2} text="SÓ PEPINO!" size={130} color="#7ed957" />
      <TopTitle from={L(3)} to={L(4) - 2} text="CONSULTOR GLACIAL" />
      <Ono from={DERRETE4} to={BALEIA4 - 6} text="DERRETEU!" size={130} color="#7fd0ff" />
      <ProdLabel from={NINHO4} to={L(5) - 2} text="NINHO SENSAÇÃO" />
      <ProdLabel from={NUTELLA5} to={NUNCA5 - 3} text="EXPLOSÃO DE NUTELLA" />
      <Tag from={NUNCA5 + 4} to={L(6) - 2} text="ELA É UMA BALEIA 🐋" y={330} />
      <ProdLabel from={MORANGO6} to={L(7) - 2} text="MORANGO DOS SONHOS" />
      <TopTitle from={at(7, "desvio") - 2} to={L(8) - 2} text="DESVIO POMBÍSTICO" />
      <ProdLabel from={TENTACAO8} to={BIO8 - 5} text="COPO TENTAÇÃO ×2" />
      <PhoneUI from={BIO8 - 4} to={L(9)} />
      <Plaque from={VOLTA9} to={L(10) - 2} text={"A FILA DÁ A VOLTA\nEM ITUMBIARA"} x={540} y={560} size={56} />
      <ProdLabel from={PACOCA10} to={L(11) - 2} text="SONHO DE PAÇOCA" />
      <Plaque from={WHATS11} to={PARABENS12 - 2} text={"📲 (64) 99252-0622"} x={540} y={420} size={60} />
      <Confetti from={PARABENS12} to={PARABENS12 + 60} />
      <Plaque from={AGORA12 + 6} to={CARDAPIO12 - 5} text={"📍 VIBE GOURMET AÇAÍ\nITUMBIARA-GO"} x={540} y={1420} size={56} />
      <PhoneUI from={CARDAPIO12 - 4} to={SEGUIR12 - 2} />
      <PhoneUI from={SEGUIR12 - 2} to={INSTA_TO} insta />
      <EndCard from={INSTA_TO} to={TOTAL_ACAI2} />
      <Watermark />

      <Captions words={words} keys={KEYS} top={1650} />

      <Audio src={staticFile("vozacai2.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {[NINHO4, NUTELLA5, MORANGO6, TENTACAO8, PACOCA10].map((c) => (
        <SND key={"p" + c} src="sfx12/tada.mp3" from={c} dur={30} v={FXV * 0.25} />
      ))}
      <SND src="sfx10/bonk.mp3" from={CIUMES1} dur={20} v={FXV * 0.35} />
      <SND src="sfx7/pof.mp3" from={PEPINO1} dur={20} v={FXV * 0.4} />
      <SND src="sfx10/bubble.mp3" from={DERRETE4} dur={BALEIA4 - DERRETE4} v={FXV * 0.3} />
      <SND src="sfx7/whoosh.mp3" from={L(8)} dur={30} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={BIO8 + 18} dur={20} v={FXV * 0.8} />
      <SND src="sfx7/cash.mp3" from={CHEGA11} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS12} dur={50} v={FXV * 0.4} />
      <SND src="sfx9/yay.mp3" from={PARABENS12} dur={50} v={FXV * 0.3} />
      <SND src="sfx2/click.mp3" from={SEGUIR12 + 24} dur={20} v={FXV * 0.8} />
      <SND src="sfx2/click.mp3" from={CARDAPIO12 + 18} dur={20} v={FXV * 0.8} />
      <SND src="sfx12/tada.mp3" from={INSTA_TO} dur={40} v={FXV * 0.3} />
    </AbsoluteFill>
  );
};
