import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, Tree, Bus, V3} from "./Sets5";
import {Pigeon} from "./Sets6";
import {Dog, sm, DizzyStars} from "./Sets9";
import {Cap} from "./Sets15";
import {Shades} from "./Sets11";
import {DadHead} from "./Sets12";
import {BigPhone, HeadGlasses, PilotCap} from "./Sets17";
import {Granny} from "./Sets18";
import {Mug, CafeKitchen, FlipCalendar, Brain, Bolt, Building, FoldedClouds, Sparkles, Broom, MetroTrain, Tunnel, BigJet, SkyClouds, Office, NeckTie, Hen, Egg, Yard, HairAntenna, Note, Square, BedroomC, EyeTape, DinnerPlate, Thermos} from "./Sets19";
import {Captions, StageTitle, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingCafe.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_CAFE = F(words[words.length - 1].e + 0.9);

/* ---------- personagens ---------- */
const BOY: ToyLook = {hoodie: true};
const DADW: ToyLook = {suit: true, shirt: "#3a4a6a", pants: "#3a4a6a", hairStyle: "bald", skin: "#d9a173"};
const VO: ToyLook = {hairStyle: "bun", hair: "#f2f2f2", shirt: "#8e5aa8", pants: "#5a4a6a", skin: "#f1c8a0", lips: "#c0606a", browColor: "#e2e2e2"};
const PILOT: ToyLook = {suit: true, shirt: "#1f2a44", pants: "#1f2a44", hairStyle: "buzz", hair: "#3a2a1a"};
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
const NOVE0 = at(0, "nove");
const GOLE1 = at(1, "gole");
const OLHO1 = at(1, "olho");
const CEREBRO1 = at(1, "cerebro");
const ACORDANDO1 = at(1, "acordando");
const PISCA2 = at(2, "pisca");
const QUINTA2 = at(2, "quintafeira");
const RAPIDO3 = at(3, "rapido");
const CONCORDA3 = at(3, "concorda");
const CORACAO4 = at(4, "coracao");
const PREDIO4 = at(4, "predio");
const TRES5 = at(5, "tres");
const VIZINHO5 = at(5, "vizinho");
const BAIRRO5 = at(5, "bairro");
const NUVENS5 = at(5, "nuvens");
const ONIBUS7 = at(7, "onibus", 1);
const METRO7 = at(7, "metro");
const AVIAO7 = at(7, "aviao");
const PAI8 = at(8, "pai", 1);
const PROMOVIDO8 = at(8, "promovido");
const QUATRO9 = at(9, "quatro");
const VO9 = at(9, "vo");
const QUARENTA9 = at(9, "quarenta");
const OLHA10 = at(10, "olha");
const OVO10 = at(10, "ovo");
const CABELO11 = at(11, "cabelo");
const RADIO11 = at(11, "radio");
const SERTANEJO11 = at(11, "sertanejo");
const LIDER12 = at(12, "lider");
const COCHILO14 = at(14, "cochilo");
const FECHA14 = at(14, "fecha");
const FITA14 = at(14, "fita");
const VIBRA15 = at(15, "vibra");
const ATENDE15 = at(15, "atende");
const NOITE16 = at(16, "noite");
const FRA16 = at(16, "fra");
const XICARA18 = at(18, "xicara");
const ACORDA18 = at(18, "acorda");

/* =================== 9:00 — a cozinha =================== */
const BOYZ = -0.75;
const MUG_R: V3 = [Math.PI / 2, 0, 0];
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.55, 3.4]} look={[0, 1.55, -0.6]} fov={52} f={f} a={a} />
    <KitchenLights />
    <CafeKitchen h={9} m={0} />
    <HandToy pose={{...idle(f), pos: [0, 0, BOYZ], rotY: 0, ...HOLD, smile: 0.5, brow: f >= NOVE0 ? 0.6 : 0}} look={BOY} item={<Mug p={[0, 0.02, 0.06]} r={MUG_R} s={2.0} t={t} />} />
  </>
);
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const sip = f >= GOLE1 - 4 && f < OLHO1 - 2;
  const wide = f >= OLHO1;
  const pop1 = easeOut(ramp(f, CEREBRO1 - 2, CEREBRO1 + 10));
  const wake = easeOut(ramp(f, ACORDANDO1, ACORDANDO1 + 10));
  const shake = wide ? 0.012 * Math.sin(t * 70) : 0;
  return (
    <>
      <Cam pos={[0, 1.95, 2.5]} look={[0, 1.85, BOYZ]} fov={50} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={9} m={0} />
      <HandToy
        pose={{...idle(f), pos: [shake, 0, BOYZ], rotY: 0, ...(sip ? SIP : HOLD), eyeWide: wide ? 1 : 0, blink: wide ? 0 : blinkCurve(f), mouthOpen: wide ? 0.4 : 0, brow: wide ? 1 : 0}}
        look={BOY}
        item={<Mug p={[0, 0.02, 0.06]} r={MUG_R} s={2.0} t={t} />}
      />
      {wide && [-1, 1].map((sd) => <Bolt key={sd} p={[0.42 * sd, 1.75 + 0.03 * Math.sin(t * 30), BOYZ + 0.1]} r={[0, 0, -0.4 * sd]} s={1.6} />)}
      {pop1 > 0 && <Brain p={[0, 1.95 + 0.3 * pop1, BOYZ]} s={0.75 * pop1} wake={wake} t={t} />}
    </>
  );
};
/* 9:01 — piscou e já é quinta */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const blink = f >= PISCA2 && f < PISCA2 + 7 ? 1 : 0;
  const flip = easeInOut(ramp(f, PISCA2 + 2, PISCA2 + 12));
  return (
    <>
      <Cam pos={[-0.3, 1.7, 2.7]} look={[-0.3, 1.65, -1.2]} fov={52} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={9} m={1} calendar={<FlipCalendar p={[-1.05, 2.05, -2.47]} s={0.9} flip={flip} />} />
      <HandToy pose={{...idle(f), pos: [0.05, 0, BOYZ], rotY: -0.25, ...HOLD, blink, eyeWide: f >= QUINTA2 ? 1 : 0.4, mouthOpen: f >= QUINTA2 ? 0.5 : 0}} look={BOY} item={<Mug p={[0, 0.02, 0.06]} r={MUG_R} s={2.0} t={t} />} />
    </>
  );
};
/* 9:02 — só o cachorro entende */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const talk = f >= RAPIDO3 - 6;
  const nod = f >= CONCORDA3;
  return (
    <>
      <Cam pos={[0.05, 1.4, 5.4]} look={[0.05, 0.95, 1.0]} fov={50} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={9} m={2} />
      <Toy pose={{...idle(f), pos: [-0.6, 0, 1.1], rotY: 0.55, mouthOpen: talk ? 0.2 + 0.6 * Math.abs(Math.sin(t * 40)) : 0, eyeWide: 0.8, rShoulder: [-1.2 + 0.4 * Math.sin(t * 30), 0.5, 0], rElbow: -1.0, brow: 0.6}} look={BOY} />
      <Dog d={{pos: [0.7, 0, 1.2], rotY: -0.7, t, blink: blinkCurve(f + 7), tail: nod ? 1 : 0.4, mouth: 0.1, tongue: nod ? 0.5 : 0, head: nod ? [0.35 * Math.max(0, Math.sin(t * 12)), 0, 0] : [0, 0, 0.35 * Math.sin(t * 2)], legs: "down"}} />
    </>
  );
};
/* 9:05 — o prédio dança no ritmo do coração */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const on = f >= PREDIO4 - 6;
  const beatPh = (t * 130) / 60;
  const beat = on ? Math.pow(Math.max(0, Math.cos(beatPh * Math.PI * 2)), 6) : 0;
  const hb = f >= CORACAO4 - 2 ? Math.pow(Math.max(0, Math.cos(beatPh * Math.PI * 2)), 6) : 0;
  return (
    <>
      <Cam pos={[0, 3.4, 11.5]} look={[0, 4.2, -2]} fov={58} f={f} a={a} />
      <DayOut />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8ccf5a", 0.95)} receiveShadow>
        <planeGeometry args={[60, 60]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 2.6]} material={sm("#5a606c", 0.9)} receiveShadow>
        <planeGeometry args={[60, 3]} />
      </mesh>
      <Tree p={[-4.6, 0, -3]} s={1.3} />
      <Tree p={[4.7, 0, -3.2]} s={1.2} />
      <Building p={[0, 0, -4.5]} beat={beat} t={on ? t : 0}>
        {NEIGHBORS.map((lk, i) => {
          const spots: [number, number][] = [[-1.9, 0], [1.9, 0], [0, 1], [-1.9, 2], [1.9, 2], [0, 3]];
          const [x, fl] = spots[i];
          return (
            <group key={i} position={[x, 0.55 + fl * 1.9, 1.62]} scale={0.6}>
              <Toy pose={{...idle(f + i * 9), pos: [0, 0, 0], rotY: 0, ...(on ? (i % 2 ? ARMS_UP : {rShoulder: [-2.4, 0, -0.6 - 0.4 * beat], rElbow: -0.6, lShoulder: [-0.6, 0, 0.6], lElbow: -1.2}) : {}), squash: 0.08 * beat, smile: 1}} look={lk} />
            </group>
          );
        })}
      </Building>
      <Toy pose={{...idle(f), pos: [0, 0.08 * beat, 3.2], rotY: 0, ...(on ? ARMS_UP : {}), smile: 1, squash: 0.06 * beat, eyeWide: 0.6}} look={BOY} />
      {f >= CORACAO4 - 2 && <Heart p={[0, 1.15, 3.55]} s={1 + 0.5 * hb} />}
    </>
  );
};
/* 9:10 — arruma tudo em 3 segundos */
const S5a: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, TRES5 - 4, TRES5 + 26);
  const spin = k > 0 && k < 1;
  const r = rng(4);
  const mess = Array.from({length: 14}, () => [(r() - 0.5) * 3.6, (r() - 0.5) * 2.4 + 0.6, r() * 6, ["#e8414f", "#2e86de", "#ffd21f", "#2ecc71", "#9b59b6", "#ffffff"][Math.floor(r() * 6)]] as [number, number, number, string]);
  return (
    <>
      <Cam pos={[0, 2.6, 4.2]} look={[0, 0.9, -0.6]} fov={54} f={f} a={a} />
      <KitchenLights />
      <BedroomC />
      {k < 0.55 &&
        mess.map(([x, z, rot, col], i) => (
          <mesh key={i} position={[x * (1 - k), 0.06 + (spin ? k * 1.5 * Math.abs(Math.sin(i + t * 20)) : 0), z]} rotation={[0, rot + (spin ? t * 20 : 0), 0]} material={sm(col, 0.6)} castShadow>
            <boxGeometry args={[0.3, 0.1, 0.22]} />
          </mesh>
        ))}
      <group position={[0, 0, 0.9]} rotation={[0, spin ? t * 40 : 0, 0]}>
        <HandToy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.3, 0.6, -0.2], rElbow: -0.4, smile: 1, eyeWide: 0.6}} look={BOY} item={<Broom p={[0, -0.2, 0.05]} r={[0.2, 0, 0]} s={1.1} />} />
      </group>
      {spin && (
        <mesh position={[0, 0.9, 0.9]}>
          <cylinderGeometry args={[0.75, 0.6, 1.8, 24, 1, true]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.22} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      )}
      {k >= 1 && <Sparkles p={[0, 0.3, -0.5]} t={t} spread={1.8} n={12} />}
    </>
  );
};
const S5b: React.FC<ShotProps> = ({f, a, t}) => {
  const nuv = f >= NUVENS5 - 4;
  return (
    <>
      <Cam pos={nuv ? [0.2, 1.9, 7.0] : [0, 2.6, 9.5]} look={nuv ? [0.0, 1.55, 1.0] : [0, 2.0, 0]} fov={nuv ? 52 : 58} f={f} a={nuv ? NUVENS5 - 4 : a} />
      <DayOut />
      <Town t={t} galo={false} variant="nova" flat clouds={false} />
      <Sparkles p={[0, 0.5, -1.0]} t={t} spread={4} n={20} />
      {nuv ? (
        <>
          <FoldedClouds p={[-0.65, 0, 1.0]} n={6} s={0.9} />
          <HandToy pose={{...idle(f), pos: [0.75, 0, 1.0], rotY: -0.3, rShoulder: [-2.2, 0.3, -0.2], rElbow: -0.5, smile: 1}} look={BOY} item={<FoldedClouds p={[-0.1, 0.05, 0.1]} n={1} s={0.35} />} />
        </>
      ) : (
        <group position={[lerp(-1.1, 1.1, ramp(f, a, NUVENS5 - 4)), 0, 1.6]} rotation={[0, Math.PI / 2, 0]}>
          <HandToy pose={{...idle(f), ...RUN(t), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.3, 0.6, -0.2], rElbow: -0.4, smile: 1}} look={BOY} item={<Broom p={[0, -0.2, 0.05]} r={[0.2, 0, 0]} s={1.1} />} />
        </group>
      )}
    </>
  );
};
/* título: faxina supersônica */
const S6: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.55, 4.4]} look={[0, 1.55, 0]} fov={52} f={f} a={a} />
    <KitchenLights />
    <BedroomC />
    <HandToy pose={{...idle(f), pos: [0, 0, 0.6], rotY: 0, rShoulder: [-2.6, 0.2, -0.3], rElbow: -0.3, lShoulder: [-0.4, 0, 0.6], lElbow: -1.6, smile: 1}} look={BOY} item={<Broom p={[0, -0.2, 0.05]} r={[0.2, 0, 0]} s={1.1} />} />
    <Sparkles p={[0, 0.5, 0.4]} t={t} spread={1.4} n={12} />
  </>
);

/* =================== 9:30 — corrida =================== */
const S7a: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const sPass = (ONIBUS7 - a) / FPS;
  const bx = 10 * s + (4 / sPass) * s - 6;
  const busX = 10 * s - 2;
  return (
    <>
      <Cam pos={[bx + 0.5, 1.9, 8.2]} look={[bx, 1.3, 1.5]} fov={56} f={f} a={a} punch={4} />
      <DayOut x={bx} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <Bus p={[busX, 0, 0.6]} rotY={0} spin={-s * 20} />
      <Toy pose={{...idle(f), ...RUN(t), pos: [bx, 0, 2.6], rotY: Math.PI / 2, eyeWide: 1, smile: 0.6}} look={BOY} />
      <SpeedLines p={[bx, 0, 2.6]} />
    </>
  );
};
const S7b: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const bx = 20 * s;
  const tx = 11 * s + 5;
  return (
    <>
      <Cam pos={[bx + 0.3, 1.7, 6.6]} look={[bx, 1.3, 0.8]} fov={56} f={f} a={a} punch={4} />
      <Tunnel x={bx} />
      <hemisphereLight args={["#fff6e6", "#303040", 0.9]} />
      <pointLight position={[bx, 3.5, 3]} intensity={12} distance={14} decay={1.3} />
      <MetroTrain p={[tx, 0, -0.4]} cars={4} />
      <Toy pose={{...idle(f), ...RUN(t), pos: [bx, 0, 1.6], rotY: Math.PI / 2, eyeWide: 1, smile: 0.6}} look={BOY} />
      <SpeedLines p={[bx, 0, 1.6]} />
    </>
  );
};
const S7c: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const bx = 9 * s - 2;
  const jx = 6 * s - 2.0;
  const cx = (bx + jx + 2.5) / 2;
  return (
    <>
      <Cam pos={[cx, 0.9, 7.6]} look={[cx, 0.5, 0]} fov={56} f={f} a={a} punch={4} />
      <SkyClouds x={bx} />
      <hemisphereLight args={["#ffffff", "#9fc8ff", 1.2]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <BigJet p={[jx, 0.9, -1.4]} s={0.6}>
        <group position={[3.0, -0.45, 0.72]} scale={0.6}>
          <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0.5, eyeWide: 1, mouthOpen: 0.8, brow: 1}} look={PILOT} headExtra={<PilotCap />} />
        </group>
      </BigJet>
      <Toy pose={{...idle(f), ...RUN(t), pos: [bx, -0.6, 1.6], rotY: Math.PI / 2, eyeWide: 1, smile: 0.8}} look={BOY} />
      <SpeedLines p={[bx, -0.6, 1.6]} />
    </>
  );
};

/* =================== 9:40 — o escritório do pai =================== */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, PAI8 - 10, PAI8 + 12));
  return (
    <>
      <Cam pos={[0.6, 1.6, 4.0]} look={[0.6, 1.2, -0.5]} fov={54} f={f} a={a} />
      <hemisphereLight args={["#ffffff", "#8090a0", 1.0]} />
      <pointLight position={[0, 3.4, 1.5]} intensity={10} distance={12} decay={1.4} castShadow />
      <Office />
      <HandToy pose={{...idle(f), pos: [0, 0, -1.0], rotY: 0, ...HOLD, smile: 1, brow: -0.3}} look={BOY} headExtra={<NeckTie />} item={<Mug p={[0, 0.02, 0.06]} r={MUG_R} s={2.0} t={t} />} />
      {f >= PAI8 - 12 && <Toy pose={{...idle(f + 5), pos: [lerp(3.4, 1.25, k), 0, 0.6], rotY: -0.7, walk: t * 9, walkAmt: k < 1 ? 1 : 0, eyeWide: 1, mouthOpen: 0.8, brow: 1}} look={DADW} headExtra={<DadHead cap={false} />} />}
    </>
  );
};

/* =================== 10:00 — o grupo da família =================== */
const chatTex = (n: number) =>
  canvasTex("cafe-chat-" + n, 512, 992, (c) => {
    c.fillStyle = "#efe7dd";
    c.fillRect(0, 0, 512, 992);
    c.fillStyle = "#075e54";
    c.fillRect(0, 0, 512, 110);
    c.fillStyle = "#ffffff";
    c.font = "bold 34px sans-serif";
    c.fillText("Família", 96, 52);
    c.font = "24px sans-serif";
    c.fillText("Vó, Pai, Tio, você", 96, 86);
    c.fillStyle = "#ffd21f";
    c.beginPath();
    c.arc(52, 56, 30, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#101018";
    c.font = "bold 30px sans-serif";
    c.textAlign = "center";
    c.fillText("F", 52, 67);
    c.textAlign = "left";
    const txts = ["ok", "bom dia!", "kkkkkk", "sim", "já vi", "tô indo", "amém", "foto linda", "valeu", "pode crer", "hahaha", "show"];
    let y = 960 - ((n * 37) % 74);
    for (let i = 0; y > 120; i++) {
      const tx = txts[(i + n) % txts.length];
      c.font = "28px sans-serif";
      const w = c.measureText(tx).width + 70;
      c.fillStyle = "#d9fdd3";
      c.fillRect(512 - w - 18, y - 60, w, 56);
      c.fillStyle = "#101018";
      c.fillText(tx, 512 - w + 2, y - 22);
      c.fillStyle = "#34b7f1";
      c.font = "20px sans-serif";
      c.fillText("✓✓", 512 - 58, y - 14);
      y -= 74;
    }
  });
const S9a: React.FC<ShotProps> = ({f, a, t}) => {
  const n = Math.max(0, Math.floor((f - a) * 0.7));
  const shake = 0.012 * Math.sin(t * 50);
  return (
    <>
      <Cam pos={[0, 1.3, 2.0]} look={[0, 1.25, 0]} fov={44} f={f} a={a} />
      <color attach="background" args={["#ffd9a8"]} />
      <hemisphereLight args={["#ffffff", "#b08a60", 1.2]} />
      <pointLight position={[0.5, 2.5, 2]} intensity={6} distance={8} decay={1.4} />
      <BigPhone p={[shake, 1.3, 0]} r={[0, 0, -0.06 + shake]} s={1.15} screen={chatTex(n % 40)} key2={"cafechat-" + (n % 40)} hand />
    </>
  );
};
const S9b: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[0, 1.55, 2.5]} look={[0, 1.45, 0]} fov={48} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={10} m={0} />
      <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.5, 0.55, 0.05], rElbow: -1.75, mouthOpen: 0.3 + 0.35 * Math.abs(Math.sin(t * 9)), smile: 0.3}} look={VO} palmRef={palm} headExtra={<><HeadGlasses color="#8a5a2b" /><Granny /></>} />
      <InHand palm={palm}>
        <mesh position={[0, 0.02, 0.06]} rotation={[0.2, 0, 0]} material={sm("#1d1f27", 0.3)}>
          <boxGeometry args={[0.12, 0.22, 0.02]} />
        </mesh>
      </InHand>
      {[0, 1, 2].map((i) => {
        const q = (t * 0.9 + i / 3) % 1;
        return (
          <mesh key={i} position={[0.05, 1.5, 0.45 + q * 0.5]} scale={0.05 + q * 0.18}>
            <torusGeometry args={[1, 0.06, 6, 28]} />
            <meshBasicMaterial color="#25d366" transparent opacity={(1 - q) * 0.8} />
          </mesh>
        );
      })}
    </>
  );
};

/* =================== 11:00 — a galinha =================== */
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const stare = f >= OLHA10 ? 1 : 0;
  const jump = Math.max(0, Math.sin(clamp((f - OVO10) / 10) * Math.PI));
  const egg = f >= OVO10 + 3;
  const eggY = egg ? Math.max(0.09, 0.4 - (f - OVO10 - 3) * 0.05) : 0;
  return (
    <>
      <Cam pos={[0, 1.15, 4.9]} look={[0, 0.75, 0]} fov={50} f={f} a={a} />
      <DayOut />
      <Yard />
      <Toy pose={{...idle(f), pos: [-0.75, 0, 0.1], rotY: 0.6, eyeWide: 1, mouthOpen: 0.3, ...HOLD}} look={BOY} />
      <Hen p={[0.65, 0, 0.1]} rotY={-0.8} s={1.4} t={t} blink={stare ? 0 : blinkCurve(f + 11)} stare={stare} jump={jump} />
      {egg && <Egg p={[0.75, eggY, -0.15]} s={1.3} />}
    </>
  );
};

/* =================== 12:00 — cabelo antena =================== */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const up = easeOut(ramp(f, CABELO11, CABELO11 + 10));
  const ant = easeOut(ramp(f, RADIO11 - 4, RADIO11 + 8));
  const notes = f >= SERTANEJO11 - 2;
  return (
    <>
      <Cam pos={[0, 1.85, 2.9]} look={[0, 1.75, 0]} fov={50} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={12} m={0} />
      <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, hairLift: up, eyeWide: 0.7, smile: notes ? 1 : 0.3, head: notes ? [0, 0, 0.15 * Math.sin(t * 6)] : [0, 0, 0]}} look={BOY} headExtra={<HairAntenna k={ant} t={t} />} />
      {notes &&
        [0, 1, 2, 3, 4, 5].map((i) => {
          const q = (t * 0.5 + i / 6) % 1;
          const sd = i % 2 ? 1 : -1;
          return <Note key={i} p={[sd * (0.4 + q * 0.6), 1.6 + q * 0.9, 0.1]} s={0.9 + q * 0.6} color={i % 3 ? "#101018" : "#e8262d"} />;
        })}
    </>
  );
};

/* =================== 13:00 — o líder dos pombos =================== */
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const bx = -1.2 + s * 1.1;
  return (
    <>
      <Cam pos={[bx + 2.7, 1.6, 3.3]} look={[bx - 0.7, 0.6, -0.1]} fov={54} f={f} a={a} />
      <DayOut x={bx} />
      <Square />
      <Tree p={[bx - 6, 0, -4]} s={1.3} />
      <Toy pose={{...idle(f), pos: [bx, 0, 0], rotY: Math.PI / 2, walk: t * 7, walkAmt: 1, smile: 1, rShoulder: [-2.6, 0, -0.3], rElbow: -0.2}} look={BOY} />
      {Array.from({length: 10}, (_, i) => (
        <Pigeon key={i} p={{pos: [bx - 0.9 - i * 0.48, 0, 0], rotY: Math.PI / 2, t: t + i * 0.13, bob: Math.sin(t * 9 + i), blink: blinkCurve(f + i * 11), chest: 0.3}} s={0.7} />
      ))}
    </>
  );
};
/* título: evolução cafeinada */
const S13: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.4, 4.2]} look={[0, 1.2, 0]} fov={52} f={f} a={a} />
    <DayOut />
    <Square />
    <Toy pose={{...idle(f), pos: [0, 0, 0.3], rotY: 0, hairLift: 1, ...ARMS_UP, smile: 1, eyeWide: 0.8}} look={BOY} headExtra={<HairAntenna k={1} t={t} />} />
    {Array.from({length: 8}, (_, i) => {
      const ang = (i / 8) * Math.PI * 2;
      return <Pigeon key={i} p={{pos: [Math.cos(ang) * 1.1, 0, 0.3 + Math.sin(ang) * 0.7], rotY: -ang + Math.PI / 2, t: t + i, bob: Math.sin(t * 9 + i), blink: blinkCurve(f + i * 11)}} s={0.65} />;
    })}
  </>
);

/* =================== 15:00 — o olho não fecha =================== */
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const tape = f >= FECHA14 - 6;
  const peel = easeOut(ramp(f, FITA14 + 6, FITA14 + 14));
  const closed = tape && peel < 0.3 ? 1 : f >= COCHILO14 && f < FECHA14 - 6 ? 0.5 + 0.5 * Math.sin(t * 6) : 0;
  return (
    <>
      <Cam pos={[0.2, 2.9, 0.6]} look={[0, 0.8, -1.35]} fov={48} f={f} a={a} />
      <KitchenLights />
      <BedroomC />
      <group position={[0, 0.78, 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
        <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, blink: closed, eyeWide: peel > 0.3 ? 1 : 0, brow: peel > 0.3 ? 1 : 0, mouthOpen: peel > 0.3 ? 0.5 : 0}} look={BOY} headExtra={tape ? <EyeTape peel={peel} /> : null} />
      </group>
    </>
  );
};

/* =================== 17:00 — vibrando =================== */
const callTex = (on: boolean) =>
  canvasTex("cafe-call-" + (on ? 1 : 0), 512, 992, (c) => {
    c.fillStyle = "#1c2b3a";
    c.fillRect(0, 0, 512, 992);
    c.fillStyle = "#ffffff";
    c.textAlign = "center";
    c.font = "28px sans-serif";
    c.fillText(on ? "Em chamada · 00:01" : "Chamada recebida…", 256, 160);
    c.fillStyle = "#ffd21f";
    c.beginPath();
    c.arc(256, 360, 110, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "#101018";
    c.font = "bold 120px sans-serif";
    c.fillText("☺", 256, 405);
    c.fillStyle = "#ffffff";
    c.font = "bold 70px sans-serif";
    c.fillText("VOCÊ", 256, 580);
    if (!on) {
      c.fillStyle = "#e8262d";
      c.beginPath();
      c.arc(140, 820, 60, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = "#25d366";
      c.beginPath();
      c.arc(372, 820, 60, 0, Math.PI * 2);
      c.fill();
    } else {
      c.fillStyle = "#e8262d";
      c.beginPath();
      c.arc(256, 820, 60, 0, Math.PI * 2);
      c.fill();
    }
  });
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const vib = f >= VIBRA15 - 2;
  const on = f >= ATENDE15;
  const j = vib ? 0.03 : 0;
  return (
    <>
      <Cam pos={[0.25, 1.65, 2.7]} look={[0.2, 1.1, -0.3]} fov={50} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={17} m={0} />
      <Toy pose={{...idle(f), pos: [j * Math.sin(t * 90), 0, BOYZ + j * Math.cos(t * 77)], rotY: 0, squash: vib ? 0.03 * Math.sin(t * 60) : 0, eyeWide: 1, mouthOpen: 0.3, rShoulder: [-0.3 + 0.2 * Math.sin(t * 80), 0, -0.4], lShoulder: [-0.3 + 0.2 * Math.cos(t * 80), 0, 0.4], brow: 0.8}} look={BOY} />
      <BigPhone p={[0.42 + (vib && !on ? 0.01 * Math.sin(t * 100) : 0), 0.87, 0.15]} r={[-Math.PI / 2 + 0.35, 0, 0.2]} s={0.42} screen={callTex(on)} key2={"cafecall-" + (on ? 1 : 0)} />
    </>
  );
};

/* =================== 21:00 — a cafeína acaba =================== */
/** cabeça bate na mesa: o boneco tomba a partir dos pés e para quando a testa encosta no tampo */
const HIT = 0.66;
const PIVZ = -1.15;
const PLATE: V3 = [-0.55, 0.84, -0.15];
const fallAngle = (f: number) => {
  const t0 = FRA16 + 14;
  if (f < t0) return 0;
  const k = clamp((f - t0) / 8);
  if (k < 1) return HIT * k * k;
  const b = f - t0 - 8;
  return b < 8 ? HIT - 0.1 * Math.sin((b / 8) * Math.PI) * (1 - b / 8) : HIT;
};
const KnockedOut: React.FC<{f: number; t: number; ang: number; zzz?: boolean}> = ({f, t, ang, zzz}) => (
  <>
    <group position={[0, 0, PIVZ]} rotation={[ang, 0, 0]}>
      <Toy pose={{pos: [0, 0, 0], rotY: 0, blink: 1, mouthOpen: 0.5, rShoulder: [-0.4, 0.2, -0.25], rElbow: -0.3, lShoulder: [-0.4, -0.2, 0.25], lElbow: -0.3}} look={BOY} />
    </group>
    <DizzyStars p={[0, 1.55, PIVZ + 1.05]} k={1} t={t} />
    {zzz && null}
  </>
);
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const frozen = f >= FRA16 + 4;
  const ang = fallAngle(f);
  const hit = f >= FRA16 + 22;
  return (
    <>
      {f < FRA16 + 12 ? <Cam pos={[1.9, 1.55, 2.4]} look={[0.0, 1.05, -0.4]} fov={50} f={f} a={a} /> : <Cam pos={[3.3, 1.4, -0.15]} look={[0, 1.0, -0.15]} fov={50} f={f} a={FRA16 + 12} />}
      <KitchenLights night />
      <CafeKitchen h={21} m={0} night />
      <DinnerPlate p={PLATE} />
      {hit ? (
        <KnockedOut f={f} t={t} ang={ang} />
      ) : (
        <group position={[0, 0, PIVZ]} rotation={[ang, 0, 0]}>
          <Toy pose={{...idle(frozen ? FRA16 + 4 : f), pos: [0, 0, 0], rotY: 0, mouthOpen: frozen ? 0.5 : 0.2 + 0.4 * Math.abs(Math.sin(t * 12)), blink: ang > 0.3 ? 1 : 0, eyeWide: frozen ? 0.3 : 0.6, rShoulder: frozen ? [-1.0, 0.3, -0.2] : [-1.0 + 0.4 * Math.sin(t * 8), 0.3, -0.2], rElbow: -1.0}} look={BOY} />
        </group>
      )}
    </>
  );
};
const S17: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[3.3, 1.4, -0.15]} look={[0, 1.0, -0.15]} fov={50} f={f} a={a} punch={0} />
    <KitchenLights night />
    <CafeKitchen h={21} m={1} night />
    <DinnerPlate p={PLATE} />
    <KnockedOut f={f} t={t} ang={HIT} />
  </>
);

/* =================== 9:00 de novo =================== */
const S18: React.FC<ShotProps> = ({f, a, t}) => {
  const lift = 1 - easeInOut(ramp(f, ACORDA18, ACORDA18 + 14));
  const mug = easeOut(ramp(f, XICARA18 - 2, XICARA18 + 8));
  return (
    <>
      <Cam pos={[0, 1.55, 3.0]} look={[0.15, 1.3, -0.5]} fov={50} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={9} m={0} />
      <DinnerPlate p={PLATE} />
      <group position={[0, 0, PIVZ]} rotation={[lift * HIT, 0, 0]}>
        <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, blink: lift > 0.5 ? 1 : f >= XICARA18 ? 0 : blinkCurve(f), eyeWide: f >= XICARA18 + 6 ? 1 : 0, mouthOpen: f >= XICARA18 + 6 ? 0.4 : 0, head: f >= XICARA18 + 6 ? [0, -0.5, 0] : [0, 0, 0]}} look={BOY} />
      </group>
      {mug > 0 && <Mug p={[-0.45, 0.83, 0.05]} s={1.6 * mug} t={t} />}
      {mug > 0 && mug < 1 && <Sparkles p={[-0.45, 0.85, 0.05]} t={t} spread={0.3} n={6} />}
    </>
  );
};
/* final: outra pessoa chega com a garrafa térmica */
const MOCO: ToyLook = {shirt: "#ff8a1f", pants: "#3a3f4a", hairStyle: "buzz", hair: "#2a1a10", skin: "#c98f62"};
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a + 4, a + 34));
  return (
    <>
      <Cam pos={[0.35, 1.5, 3.9]} look={[0.35, 1.3, -0.4]} fov={54} f={f} a={a} />
      <KitchenLights />
      <CafeKitchen h={9} m={1} />
      <Toy pose={{...idle(f), pos: [-0.45, 0, BOYZ], rotY: 0.5, eyeWide: k > 0.5 ? 1 : 0.3, mouthOpen: k > 0.5 ? 0.7 : 0, brow: k > 0.5 ? 1 : 0, ...(k > 0.5 ? ARMS_UP : {})}} look={BOY} />
      <HandToy
        pose={{...idle(f + 7), pos: [lerp(3.4, 0.85, k), 0, 0.2], rotY: -0.55, walk: t * 8, walkAmt: k < 1 ? 1 : 0, rShoulder: [-0.55, 0.3, 0.05], rElbow: -0.9, smile: 1, brow: -0.7}}
        look={MOCO}
        headExtra={<><Cap color="#101018" /><Shades /></>}
        item={<Thermos p={[0, 0.02, 0.1]} r={MUG_R} s={0.85} />}
      />
    </>
  );
};

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5a},
  {from: VIZINHO5 - 2, Comp: S5b},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7a},
  {from: METRO7 - 3, Comp: S7b},
  {from: AVIAO7 - 3, Comp: S7c},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: S9a},
  {from: VO9 - 4, Comp: S9b},
  {from: L(10), Comp: S10},
  {from: L(11), Comp: S11},
  {from: L(12), Comp: S12},
  {from: L(13), Comp: S13},
  {from: L(14), Comp: S14},
  {from: L(15), Comp: S15},
  {from: L(16), Comp: S16},
  {from: L(17), Comp: S17},
  {from: L(18), Comp: S18},
  {from: L(19), Comp: S19},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_CAFE} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["nunca", "cafe", "nove", "manha", "isso", "gole", "olho", "cerebro", "acordando", "pisca", "quintafeira", "rapido", "cachorro", "concorda", "coracao", "funk", "predio", "dancar", "tres", "segundos", "vizinho", "bairro", "nuvens", "dobradinhas", "faxina", "supersonica", "onibus", "metro", "aviao", "trabalho", "pai", "promovido", "quatro", "mil", "mensagens", "vo", "audio", "quarenta", "minutos", "galinha", "ovo", "susto", "cabelo", "radio", "sertanejo", "orelha", "pombos", "lider", "fila", "evolucao", "cafeinada", "cochilo", "fecha", "fita", "adesiva", "vibra", "celular", "atende", "noite", "cafeina", "acaba", "desliga", "apagao", "humano", "acorda", "xicara", "seguir", "perfil", "garrafa", "termica"]);
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
/** relógio digital no topo, com a hora de cada cena */
const HOURS: [number, string][] = [
  [0, "9:00"],
  [L(2), "9:01"],
  [L(3), "9:02"],
  [L(4), "9:05"],
  [L(5), "9:10"],
  [L(7), "9:30"],
  [L(8), "9:40"],
  [L(9), "10:00"],
  [L(10), "11:00"],
  [L(11), "12:00"],
  [L(12), "13:00"],
  [L(14), "15:00"],
  [L(15), "17:00"],
  [L(16), "21:00"],
  [L(18), "9:00"],
];
const HIDE: [number, number][] = [
  [L(6), L(7)],
  [L(13), L(14)],
  [L(17), L(18)],
];
const ClockPill: React.FC = () => {
  const f = useCurrentFrame();
  if (HIDE.some(([x, y]) => f >= x && f < y)) return null;
  let i = 0;
  for (let k = 0; k < HOURS.length; k++) if (f >= HOURS[k][0]) i = k;
  const [from, txt] = HOURS[i];
  const s = 1 + 0.25 * Math.max(0, 1 - (f - from) / 8);
  const night = txt === "21:00";
  return (
    <div style={{position: "absolute", left: 540, top: 170, transform: `translate(-50%,-50%) scale(${s})`, display: "flex", alignItems: "center", gap: 18, background: night ? "#1a2244" : "#101018", color: night ? "#fff6c0" : "#ffd21f", fontFamily, fontWeight: 900, fontSize: 84, padding: "8px 34px", borderRadius: 26, border: "6px solid #ffffff", boxShadow: "0 8px 0 rgba(0,0,0,0.3)", letterSpacing: 4}}>
      <span style={{fontSize: 64}}>{night ? "🌙" : "☕"}</span>
      {txt}
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
/** bateria acabando */
const Battery: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  const blink = Math.floor((f - from) / 6) % 2 === 0;
  return (
    <div style={{position: "absolute", left: 540, top: 460, transform: `translate(-50%,-50%) scale(${s})`, display: "flex", alignItems: "center", gap: 26}}>
      <div style={{position: "relative", width: 260, height: 120, border: "12px solid #ffffff", borderRadius: 22, boxShadow: "0 0 0 6px #101018"}}>
        <div style={{position: "absolute", left: 8, top: 8, bottom: 8, width: 26, background: blink ? "#e8262d" : "transparent", borderRadius: 6}} />
        <div style={{position: "absolute", right: -34, top: 30, width: 22, height: 44, background: "#ffffff", borderRadius: 6, boxShadow: "0 0 0 5px #101018"}} />
      </div>
      <div style={{fontFamily, fontWeight: 900, fontSize: 110, color: "#e8262d", WebkitTextStroke: "10px #101018", paintOrder: "stroke fill"}}>0%</div>
    </div>
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
const TITLES: [number, string[]][] = [
  [L(6), ["FAXINA", "SUPERSÔNICA"]],
  [L(13), ["EVOLUÇÃO", "CAFEINADA"]],
  [L(17), ["APAGÃO", "HUMANO"]],
];
const FOLLOW_FROM = L(19) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoCafe: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <ClockPill />
      {TITLES.map(([x, lines], i) => {
        const next = [L(7), L(14), L(18)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      <Ono from={4} to={NOVE0 - 2} text="?" x={540} y={520} size={200} color="#ffd21f" rot={8} />
      <Ono from={GOLE1} to={OLHO1 - 2} text="GLUP!" />
      <Tag from={CEREBRO1 + 4} to={L(2) - 2} text="CÉREBRO ACORDADO" />
      <FastFwd from={PISCA2 + 4} to={L(3) - 2} text="QUINTA-FEIRA" />
      <Bubble from={RAPIDO3} to={CONCORDA3 - 3} text="BLÁBLÁBLÁBLÁBLÁ" size={46} />
      <Tag from={CONCORDA3} to={L(4) - 2} text="O CACHORRO ENTENDEU" />
      <Ono from={CORACAO4} to={L(5) - 2} text="TUM TUM TUM!" y={330} size={120} color="#ff5a6a" />
      <BigNum from={TRES5} to={VIZINHO5 - 4} text="3 SEG" size={160} />
      <Tag from={BAIRRO5} to={NUVENS5 - 3} text="BAIRRO BRILHANDO" />
      <Tag from={NUVENS5} to={L(6) - 2} text="NUVENS DOBRADAS" />
      <Ono from={ONIBUS7} to={METRO7 - 4} text="VUUUSH!" color="#ffffff" />
      <BigNum from={AVIAO7} to={L(8) - 2} text="900 KM/H" size={130} />
      <Tag from={PROMOVIDO8} to={L(9) - 2} text="CHEFE" />
      <BigNum from={QUATRO9} to={VO9 - 6} text="4.000" y={980} size={190} />
      <BigNum from={QUARENTA9} to={L(10) - 2} text="🎤 40:00" size={140} />
      <Ono from={OVO10} to={L(11) - 2} text="PLOC!" />
      <Tag from={RADIO11 + 2} to={L(12) - 2} text="RÁDIO CABELO FM" />
      <Tag from={LIDER12} to={L(13) - 2} text="LÍDER DOS POMBOS" />
      <Ono from={FITA14 + 6} to={L(15) - 2} text="BOING!" color="#ffffff" />
      <Ono from={VIBRA15} to={L(16) - 2} text="BZZZZZ!" />
      <Battery from={FRA16 + 4} to={FRA16 + 22} />
      <Ono from={FRA16 + 22} to={L(17) - 2} text="POC!" color="#ffffff" />
      <FastFwd from={L(18)} to={ACORDA18 + 20} text="DIA SEGUINTE" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_CAFE - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo; o funk é só na cena do prédio) ---------- */}
      <Audio src={staticFile("vozcafe.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx10/tick.mp3" from={4} dur={NOVE0} v={FXV * 0.35} />
      <SND src="sfx16/glup.mp3" from={GOLE1} dur={15} v={FXV * 0.35} />
      <SND src="sfx14/zap.mp3" from={OLHO1} dur={30} v={FXV * 0.3} />
      <SND src="sfx12/poof.mp3" from={CEREBRO1} dur={25} v={FXV * 0.3} />
      <SND src="sfx14/papel.mp3" from={PISCA2 + 2} dur={25} v={FXV * 0.4} />
      <SND src="sfx11/bark.mp3" from={CONCORDA3 + 4} dur={30} v={FXV * 0.35} />
      <SND src="sfx4/heart.mp3" from={CORACAO4} dur={PREDIO4 - CORACAO4} v={FXV * 0.4} />
      <SND src="sfx16/funk.mp3" from={PREDIO4 - 6} dur={L(5) - PREDIO4 + 6} v={FXV * 0.35} />
      <SND src="sfx12/tornado.mp3" from={TRES5 - 4} dur={30} v={FXV * 0.3} />
      <SND src="sfx10/ding.mp3" from={TRES5 + 28} dur={30} v={FXV * 0.3} />
      <SND src="sfx7/bus.mp3" from={L(7)} dur={METRO7 - L(7)} v={FXV * 0.3} />
      <SND src="sfx2/whoosh.mp3" from={ONIBUS7 - 4} dur={30} v={FXV * 0.4} />
      <SND src="sfx7/rumble.mp3" from={METRO7 - 3} dur={AVIAO7 - METRO7} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={AVIAO7 - 3} dur={L(8) - AVIAO7 + 3} v={FXV * 0.3} />
      <SND src="sfx3/door.mp3" from={PAI8 - 12} dur={30} v={FXV * 0.3} />
      <SND src="sfx12/gasp.mp3" from={PAI8 + 6} dur={30} v={FXV * 0.3} />
      {Array.from({length: 8}, (_, i) => (
        <SND key={"p" + i} src="sfx10/plim.mp3" from={L(9) + 6 + i * 10} dur={12} v={FXV * 0.25} />
      ))}
      <SND src="sfx16/coco.mp3" from={OLHA10 + 4} dur={25} v={FXV * 0.4} />
      <SND src="sfx7/pof.mp3" from={OVO10 + 8} dur={20} v={FXV * 0.5} />
      <SND src="sfx15/static.mp3" from={RADIO11} dur={SERTANEJO11 - RADIO11} v={FXV * 0.25} />
      <SND src="sfx8/coo.mp3" from={L(12) + 6} dur={L(13) - L(12)} v={FXV * 0.3} />
      <SND src="sfx7/boing.mp3" from={FITA14 + 6} dur={30} v={FXV * 0.5} />
      <SND src="sfx16/buzz.mp3" from={VIBRA15} dur={50} v={FXV * 0.6} />
      <SND src="sfx16/buzz.mp3" from={VIBRA15 + 50} dur={50} v={FXV * 0.6} />
      <SND src="sfx8/poweroff.mp3" from={FRA16 + 4} dur={30} v={FXV * 0.4} />
      <SND src="sfx10/bonk.mp3" from={FRA16 + 21} dur={25} v={FXV * 0.4} />
      <SND src="sfx7/snore.mp3" from={L(17) + 6} dur={L(18) - L(17)} v={FXV * 0.3} />
      <SND src="sfx4/clocks.mp3" from={L(18)} dur={30} v={FXV * 0.25} />
      <SND src="sfx12/poof.mp3" from={XICARA18 - 2} dur={25} v={FXV * 0.35} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
