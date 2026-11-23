import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, V3, House} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {BedroomC} from "./Sets19";
import {Bg} from "./Sets20";
import {Sheep} from "./Sets21";
import {Pillow, Helicopter} from "./Sets22";
import {PicketSign} from "./Sets33";
import {Crack, Debris} from "./Sets27";
import {Sloth, Briefcase, RichShades} from "./Sets36";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingTrav2.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_TRAV2 = F(words[words.length - 1].e + 1.2);

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
const DEMITIR0 = at(0, "demitir");
const EMPRESA1 = at(1, "empresa");
const OVELHA3 = at(3, "ovelha");
const CONTAR4 = at(4, "contar");
const PREGUICA6 = at(6, "bicho-preguica");
const DIAS7 = at(7, "dias");
const CIMA7 = at(7, "cima");
const RICO9 = at(9, "rico");
const HELI9 = at(9, "helicoptero");
const ESCRITORIO10 = at(10, "escritorio");
const DORME12 = at(12, "dorme");
const TELHADO12 = at(12, "telhado");
const PARABENS14 = at(14, "parabens");
const SEGUIR15 = at(15, "seguir");
const DEMITIR15 = at(15, "demitir");

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
const PJ: ToyLook = {hoodie: false, shirt: "#7fb8e8", pants: "#7fb8e8"};
const BED_TOP = 0.82;
/* travesseiro executivo: gravata, maleta e (quando rico) óculos */
const CeoPillow: React.FC<{p: V3; s?: number; t: number; rich?: boolean; mood?: "happy" | "sad" | "sleep" | "scared"; mouth?: number; rotY?: number}> = ({p, s = 1, t, rich = false, mood = "happy", mouth = 0.3, rotY = 0}) => (
  <group position={p} scale={s} rotation={[0, rotY, 0]}>
    <Pillow p={[0, 0.24, 0]} t={t} mood={mood} mouth={mouth} />
    <group position={[0, 0.1, 0.13]}>
      <mesh geometry={rbox(0.09, 0.06, 0.03, 0.01)} material={sm("#e8262d", 0.5)} />
      <mesh position={[0, -0.11, 0]} rotation={[0, 0, Math.PI]} material={sm("#e8262d", 0.5)}>
        <coneGeometry args={[0.05, 0.18, 4]} />
      </mesh>
    </group>
    <Briefcase p={[0.5, 0.13, 0.05]} s={0.9} />
    {rich && <RichShades p={[0, 0.3, 0.15]} s={1.1} />}
  </group>
);
const Room: React.FC<{office?: number}> = ({office = 0}) => (
  <>
    <Bg c={office < 0.5 ? "#1a2244" : "#9fd8ff"} />
    <KitchenLights night={office < 0.5} />
    <pointLight position={[0, 2.6, 2.0]} intensity={6} distance={10} color="#fff4e0" />
    <BedroomC night={office < 0.5} />
    {office > 0.5 && (
      <>
        <mesh position={[0, 2.0, -2.55]} geometry={rbox(2.0, 1.0, 0.05, 0.03)} material={sm("#ffffff", 0.5)} />
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[-0.6 + i * 0.4, 1.7 + (0.1 + i * 0.12) / 2, -2.51]}>
            <boxGeometry args={[0.25, 0.1 + i * 0.12, 0.02]} />
            <meshStandardMaterial color={i === 3 ? "#2ecc71" : "#3a86ff"} />
          </mesh>
        ))}
      </>
    )}
  </>
);

/* casa do menino no meio da cidade dos vídeos antigos */
const HW = 3.4;
const HH = 2.7;
const HZ = -0.6;
const PEAK = HH + HW * 0.4;
const HouseOut: React.FC<{f: number; t: number; heli: V3; heliRot?: number; spin?: number; crack?: number; debris?: number}> = ({f, t, heli, heliRot = 0.3, spin = 6, crack = 0, debris = 0}) => (
  <>
    <DayOut />
    <group position={[0, 0, -5]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
    <House p={[0, 0, HZ]} w={HW} h={HH} d={3} wall="#f6d9a8" roof="#e8412c" />
    {crack > 0 && <Crack p={[0, HH + 0.55, HZ + 1.77]} r={[0, 0, 0]} s={1.3 * crack} />}
    {crack > 0 && <Crack p={[0.4, HH + 0.35, HZ + 1.77]} r={[0, 0, 1.2]} s={0.9 * crack} />}
    <Debris k={debris} at={[0, PEAK, HZ]} />
    <Helicopter p={heli} rotY={heliRot} s={1.0} t={t * spin} />
  </>
);

/* 0–2 — demitir o travesseiro empresário */
const T0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.8, 4.4]} look={[0, 1.0, -0.8]} fov={54} f={f} a={f >= L(1) ? L(1) : a} />
    <Room />
    <CeoPillow p={[0, BED_TOP, -1.55]} s={1.3} t={t} mood={f >= DEMITIR0 + 10 ? "sad" : "happy"} mouth={f >= EMPRESA1 ? 0.3 + 0.3 * Math.abs(Math.sin(t * 8)) : 0.2} />
    {f >= EMPRESA1 && <PicketSign p={[0.75, BED_TOP, -1.45]} s={0.8} text={"PENAS\nS.A."} k="penas" />}
    <PBoy id="t0" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [-0.62, 0, 0.5], rotY: 0.6, ...(fr >= DEMITIR0 && fr < L(1) + 20 ? {lShoulder: [-1.5, -0.3, 0.2], lElbow: -0.1, brow: -0.8} : {}), mouthOpen: fr < DEMITIR0 ? 0.6 : 0, eyeWide: fr >= EMPRESA1 ? 1 : 0.2})} />
  </>
);
/* 3–5 — a ovelha conta você */
const T3: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - OVELHA3 + 4) / 26);
  return (
    <>
      <Cam pos={[0.2, 1.8, 4.4]} look={[0, 1.0, -0.8]} fov={54} f={f} a={a} />
      <Room />
      <Sheep p={[lerp(2.4, 0.2, easeOut(k)), k < 1 ? 0 : BED_TOP - 0.1, k < 1 ? 0.3 : -1.4]} rotY={k < 1 ? -1.5 : 0} s={0.8} t={t} walk={k < 1 ? 1 : 0} jump={f >= CONTAR4 ? 0.3 : 0} />
      <PBoy id="t3" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [-0.62, 0, 0.5], rotY: 0.6, eyeWide: fr >= CONTAR4 ? 1 : 0.4, mouthOpen: fr >= CONTAR4 ? 0.5 : 0, brow: fr >= CONTAR4 ? 1 : 0})} />
    </>
  );
};
/* 6–8 — a preguiça demora 3 dias e deita em cima de você */
const T6: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - PREGUICA6) / 120);
  const lie = f >= CIMA7 - 4 ? easeInOut(clamp((f - CIMA7 + 4) / 18)) : 0;
  return (
    <>
      <Cam pos={[0.4, 1.9, 4.8]} look={[0, 0.9, -0.4]} fov={56} f={f} a={lie > 0 ? CIMA7 - 4 : a} />
      <Room />
      <Sloth p={[lerp(2.6, 1.3, k) - lie * 1.6, 0, 0.2 + lie * 0.2]} rotY={-1.2 + lie * 1.2} s={0.9} t={t} lie={lie} blink={0.6} reach={f >= DIAS7 ? 0.3 : 0} />
      <group scale={[1, 1 - lie * 0.6, 1]} position={[-0.3, 0, 0.4]}>
        <PBoy id="t6" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [0, 0, 0], rotY: 0.6, eyeWide: 1, mouthOpen: lie > 0 ? 0.7 : 0, brow: 1})} />
      </group>
    </>
  );
};
/* 9–11 — o travesseiro volta rico de helicóptero e vira o quarto escritório */
const T9: React.FC<ShotProps> = ({f, a, t}) => {
  if (f >= HELI9 - 6 && f < ESCRITORIO10) {
    const k = easeOut(clamp((f - HELI9 + 6) / 34));
    return (
      <>
        <Cam pos={[0.5, 3.4, 11]} look={[0, 2.6, HZ]} fov={56} f={f} a={HELI9 - 6} />
        <HouseOut f={f} t={t} heli={[0, lerp(9, PEAK + 0.45, k), HZ]} heliRot={0.3 + (1 - k) * 1.5} />
      </>
    );
  }
  const land = f >= HELI9 - 6 ? easeOut(clamp((f - HELI9 + 6) / 30)) : 0;
  const office = f >= ESCRITORIO10 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.3, 2.2, 5.6]} look={[0, 1.2, -0.6]} fov={58} f={f} a={office ? ESCRITORIO10 : a} />
      <Room office={office} />
      {land > 0 && <Helicopter p={[1.9, 4 - land * 2.9, -1.0]} rotY={-0.6} s={0.7} t={t * 6} />}
      <CeoPillow p={[office ? 0 : 1.0, office ? BED_TOP : 0.2, office ? -1.55 : 0.4]} s={1.3} t={t} rich mouth={0.3 + 0.3 * Math.abs(Math.sin(t * 8))} />
      {office > 0 && [-0.7, 0.7].map((x) => <Briefcase key={x} p={[x, BED_TOP + 0.12, -0.6]} r={[-Math.PI / 2, 0, 0]} s={0.9} />)}
      <PBoy id="t9" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [-0.75, 0, 0.6], rotY: 0.6, eyeWide: 1, mouthOpen: 0.5, brow: 1, ...(fr >= ESCRITORIO10 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : {})})} />
    </>
  );
};
/* 12–13 — a reunião em que todo mundo dorme; helicóptero no telhado */
const T12: React.FC<ShotProps> = ({f, a, t}) => {
  const out = f >= TELHADO12 - 6;
  if (out) {
    const cr = clamp((f - TELHADO12 + 4) / 10);
    const fall = f >= TELHADO12 + 10 ? easeInOut(clamp((f - TELHADO12 - 10) / 18)) : 0;
    return (
      <>
        <Cam pos={[0.5, 3.4, 11]} look={[0, 2.6, HZ]} fov={56} f={f} a={TELHADO12 - 6} punch={12} />
        <HouseOut f={f} t={t} heli={[0, PEAK + 0.45 - fall * 2.6 + 0.04 * Math.sin(t * 40) * cr, HZ]} heliRot={0.3 + fall * 0.4} spin={0.3} crack={cr} debris={fall > 0 ? fall * 1.5 : 0} />
      </>
    );
  }
  return (
    <>
      <Cam pos={[0.2, 2.0, 4.6]} look={[0, 1.0, -0.8]} fov={54} f={f} a={a} />
      <Room office={1} />
      <CeoPillow p={[0, BED_TOP, -1.55]} s={1.3} t={t} rich mood="sleep" mouth={0} />
      <Sheep p={[0.95, 0, -0.5]} rotY={-1.2} s={0.7} t={t} />
      <Sloth p={[-1.1, 0, -0.5]} rotY={1.0} s={0.75} t={t} blink={1} />
      <PBoy id="t12" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [0.2, 0, 0.6], rotY: Math.PI, blink: fr >= DORME12 ? 1 : 0, head: [fr >= DORME12 ? 0.4 : 0, 0, 0.2]})} />
    </>
  );
};
/* 14–15 — dormindo em pé no escritório; e a ameaça */
const T14: React.FC<ShotProps> = ({f, a, t}) => {
  const threat = f >= SEGUIR15 - 4;
  return (
    <>
      <Cam pos={threat ? [0.0, 1.6, 3.8] : [0.2, 1.9, 4.6]} look={threat ? [-0.2, 1.1, -1.0] : [0, 1.0, -0.6]} fov={52} f={f} a={threat ? SEGUIR15 - 4 : a} />
      <Room office={1} />
      <CeoPillow p={[0.3, BED_TOP, -1.4]} s={1.3} t={t} rich mood={threat ? "scared" : "happy"} mouth={threat ? 0.6 + 0.3 * Math.abs(Math.sin(t * 9)) : 0.3} />
      <PBoy id="t14" a={a} f={f} look={PJ} pose={(fr) => ({...idle(fr), pos: [-0.6, 0, 0.5], rotY: 0.5, blink: threat ? 0 : 1, head: [threat ? 0 : 0.35, 0, threat ? 0 : 0.25], smile: threat ? 0 : 0.6, eyeWide: threat ? 1 : 0, mouthOpen: threat ? 0.6 : 0, brow: threat ? 1 : 0})} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: T0},
  {from: L(3), Comp: T3},
  {from: L(6), Comp: T6},
  {from: L(9), Comp: T9},
  {from: L(12), Comp: T12},
  {from: L(14), Comp: T14},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_TRAV2} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["soneca", "demitir", "travesseiro", "empresa", "penas", "terno", "gravata", "empreendedorismo", "plumario", "ovelha", "fofinha", "dormir", "voce", "carneirinhos", "insonia", "lanosa", "bicho-preguica", "sono", "tres", "dias", "cima", "esmagamento", "sonolento", "rico", "helicoptero", "cama", "escritorio", "reuniao", "planejamento", "dormitorial", "dorme", "telhado", "ronco", "cochilo", "aeronautico", "parabens", "pe", "seguir", "perfil"]);
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
  [L(2), L(3), ["EMPREENDEDORISMO", "PLUMÁRIO"]],
  [L(5), L(6), ["INSÔNIA", "LANOSA"]],
  [L(8), L(9), ["ESMAGAMENTO", "SONOLENTO"]],
  [L(11), L(12), ["PLANEJAMENTO", "DORMITORIAL"]],
  [L(13), L(14), ["COCHILO", "AERONÁUTICO"]],
];
const Counting: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const n = Math.floor((f - from) / 10) + 1;
  return (
    <>
      {Array.from({length: Math.min(n, 6)}, (_, i) => (
        <div key={i} style={{position: "absolute", left: 180 + (i % 3) * 260, top: 520 + Math.floor(i / 3) * 170, transform: `scale(${pop(f, from + i * 10, 8)}) rotate(${i % 2 ? 8 : -8}deg)`, fontFamily, fontWeight: 900, fontSize: 120, color: "#ffffff", WebkitTextStroke: "10px #101018", paintOrder: "stroke fill"}}>{i + 1}</div>
      ))}
    </>
  );
};
const Zzz: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1, 2, 3, 4].map((i) => {
        const k = ((f - from) / 45 + i * 0.2) % 1;
        return <div key={i} style={{position: "absolute", left: 300 + i * 120 + k * 60, top: 700 - k * 300, fontFamily, fontWeight: 900, fontSize: 60 + k * 50, color: "#ffffff", WebkitTextStroke: "7px #101018", paintOrder: "stroke fill", opacity: 1 - k}}>Z</div>;
      })}
    </>
  );
};
const FOLLOW_FROM = SEGUIR15 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoTrav2: React.FC = () => {
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
      <TopTitle from={4} to={DEMITIR0 - 3} text="HORA DA SONECA" />
      <Ono from={DEMITIR0} to={L(1) - 2} text="DEMITIDO!" size={140} color="#e8262d" />
      <Counting from={CONTAR4} to={L(5) - 2} />
      <BigNum from={DIAS7} to={CIMA7 - 3} text="⏳ 3 DIAS" size={130} />
      <Ono from={CIMA7 + 4} to={L(8) - 2} text="SPLOFT!" size={150} color="#ffd21f" />
      <Ono from={HELI9} to={L(10) - 2} text="TUTUTUTU!" size={120} color="#ffffff" />
      <Zzz from={DORME12} to={TELHADO12 - 4} />
      <Ono from={TELHADO12} to={L(13) - 2} text="CRASH!" size={160} color="#ff8a1f" />
      <Zzz from={L(14) + 20} to={SEGUIR15 - 6} />
      <Confetti from={PARABENS14} to={PARABENS14 + 50} />
      <Plaque from={DEMITIR15} to={TOTAL_TRAV2 - 1} text={"📋 VOCÊ ESTÁ\nDEMITIDO DA CAMA!"} x={540} y={420} size={56} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_TRAV2 - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("voztrav2.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 2} dur={40} v={FXV * 0.25} />
      ))}
      <SND src="sfx10/bonk.mp3" from={DEMITIR0} dur={20} v={FXV * 0.4} />
      <SND src="sfx10/plim.mp3" from={CONTAR4} dur={30} v={FXV * 0.3} />
      <SND src="sfx7/pof.mp3" from={CIMA7 + 4} dur={20} v={FXV * 0.5} />
      <SND src="sfx3/crack.mp3" from={TELHADO12} dur={30} v={FXV * 0.5} />
      <SND src="sfx7/confetti.mp3" from={PARABENS14} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
