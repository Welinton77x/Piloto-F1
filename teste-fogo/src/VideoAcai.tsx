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
import {Dog, sm, Lupa} from "./Sets9";
import {Fridge} from "./Sets11";
import {BigPhone, HeadGlasses} from "./Sets17";
import {Sparkles} from "./Sets19";
import {Bg} from "./Sets20";
import {AcaiCup, Spoon, Siren, Lab} from "./Sets31";
import {Captions, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingAcai.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_ACAI = F(words[words.length - 1].e + 2.8);

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
const PROBLEMA0 = at(0, "problema");
const NINGUEM0 = at(0, "ninguem");
const SINTOMAS1 = at(1, "sintomas");
const GELADO1 = at(1, "gelado");
const CHOCOLATE1 = at(1, "chocolate");
const FREEZER2 = at(2, "freezer");
const CACHORRO2 = at(2, "cachorro");
const COLHER2 = at(2, "colher");
const CAUSA3 = at(3, "causa");
const ACAI3 = at(3, "acai");
const VICIADO3 = at(3, "viciado");
const VIBE4 = at(4, "vibe");
const NINHO5 = at(5, "ninho");
const NUTELLA5 = at(5, "nutella");
const MORANGO5 = at(5, "morango");
const OUTRAS5 = at(5, "outras");
const CALMA6 = at(6, "calma");
const EXPERIMENTAR6 = at(6, "experimentar");
const PECA7 = at(7, "peca");
const INSTAGRAM8 = at(8, "instagram");
const COLHERADA9 = at(9, "colherada");

const OLD: ToyLook = {shirt: "#e8e2d0", pants: "#6a5a4a", hairStyle: "bald", skin: "#d9a173", browColor: "#e2e2e2"};
const SCI: ToyLook = {shirt: "#ffffff", pants: "#3a3f4a", apron: true, hairStyle: "curly", hair: "#2a1a10"};
const SCI2: ToyLook = {shirt: "#ffffff", pants: "#3a3f4a", apron: true, hairStyle: "ponytail", hair: "#5a3a20", lips: "#c0392b"};

/* ---------- física do menino ---------- */
const tf = (fr: number) => fr / FPS;
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode; look?: ToyLook; headExtra?: React.ReactNode}> = ({id, a, f, pose, item, look = BOY, headExtra}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={look} item={item} headExtra={headExtra} /> : <Toy pose={p} look={look} headExtra={headExtra} />;
};
const Street: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut />
    <group position={[0, 0, -2]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
  </>
);
const phoneTex = () =>
  canvasTex("vibephone", 440, 860, (c) => {
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
    c.fillText("PEDIR AGORA", 220, 620);
  });

/* 0 — alerta em Itumbiara */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const panic = f >= NINGUEM0 - 4;
  return (
    <>
      <Cam pos={[0, 1.5, 4.2]} look={[0, 1.15, 0]} fov={52} f={f} a={f >= PROBLEMA0 ? PROBLEMA0 : a} punch={10} />
      <Street t={t} />
      <Siren p={[-1.9, 0, -0.6]} t={t} />
      <Siren p={[1.9, 0, -0.6]} t={t + 0.3} />
      {panic &&
        [0, 1, 2, 3].map((i) => {
          const k = (f - NINGUEM0 + 4) / FPS;
          const dir = i % 2 ? 1 : -1;
          return <Toy key={i} look={NEIGHBORS[i]} pose={{...idle(f), ...RUN(k, i), pos: [dir * (-4 + k * 3.2) + i * 0.3, 0, -1.2 - i * 0.35], rotY: dir * 1.57, eyeWide: 1, mouthOpen: 0.7, brow: 1, ...(i % 2 ? ARMS_UP : {})}} />;
        })}
      <PBoy id="a0" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, hop(fr, PROBLEMA0, 12, 0.2), 0.6], rotY: 0, eyeWide: 0.9, brow: 1, mouthOpen: 0.25 + 0.2 * Math.abs(Math.sin(tf(fr) * 8)), ...(fr >= PROBLEMA0 ? {rShoulder: [-1.3, 0.5, 0], rElbow: -1.9, lShoulder: [-1.3, -0.5, 0], lElbow: -1.9} : {lShoulder: [-1.5, -0.2, 0.2], lElbow: -0.1})})} />
    </>
  );
};
/* 1 — os sintomas: todo mundo para e fica com vontade */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const stop = f >= SINTOMAS1;
  const cold = f >= GELADO1 && f < CHOCOLATE1;
  return (
    <>
      <Cam pos={[0, 1.7, 6.2]} look={[0, 1.0, 0]} fov={56} f={f} a={a} />
      <Street t={t} />
      {[0, 1, 2, 3].map((i) => {
        const x0 = [-1.45, -0.5, 0.5, 1.45][i];
        const wk = stop ? 0 : 1;
        const sh = cold ? 0.03 * Math.sin(t * 60 + i) : 0;
        return (
          <Toy key={i} look={NEIGHBORS[i + 1]} pose={{...idle(f + i * 9), pos: [x0 + sh + (stop ? 0 : (((t * 0.4 + i * 0.3) % 1) - 0.5) * 0.6), 0, -0.2 + (i % 2) * 0.5], rotY: stop ? 0 : 1.57 * (i % 2 ? -1 : 1), walk: t * 9, walkAmt: wk, eyeWide: stop ? 1 : 0.3, mouthOpen: f >= CHOCOLATE1 ? 0.8 : stop ? 0.35 : 0, smile: f >= CHOCOLATE1 ? 0.6 : 0, brow: stop ? 1 : 0, ...(cold ? {rShoulder: [-0.5, 0, -1.0], rElbow: -2.2, lShoulder: [-0.5, 0, 1.0], lElbow: -2.2} : f >= CHOCOLATE1 ? {rShoulder: [-1.4, 0.2, 0], rElbow: -0.3, lShoulder: [-1.4, -0.2, 0], lElbow: -0.3} : {})}} />
        );
      })}
    </>
  );
};
/* 2 — o senhor lambendo o freezer e o cachorro com a colher */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const dog = f >= CACHORRO2 - 3;
  return (
    <>
      <Cam pos={dog ? [1.4, 0.9, 3.0] : [-0.2, 1.5, 3.6]} look={dog ? [1.4, 0.5, 0] : [-0.5, 1.2, -0.6]} fov={52} f={f} a={dog ? CACHORRO2 - 3 : a} />
      <Bg c="#f3e3c8" />
      <KitchenLights />
      <mesh position={[0, 2, -1.6]}>
        <boxGeometry args={[10, 4, 0.1]} />
        <meshStandardMaterial color="#f6d9a8" />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#c99a6a" />
      </mesh>
      <Fridge p={[-1.2, 0, -1.0]} rotY={0.25} f={{t, love: f >= FREEZER2 ? 1 : 0}} />
      <PBoy id="a2" a={a} f={f} look={OLD} pose={(fr) => ({...idle(fr), pos: [-0.25, 0, -0.35], rotY: -1.2, torso: [0.25, 0, 0.1], head: [0.15, 0.2, 0.1 * Math.sin(tf(fr) * 10)], mouthOpen: 0.7, eyeWide: 0.2, blink: 0.6, rShoulder: [-1.5, 0.6, 0], rElbow: -0.2, lShoulder: [-1.5, -0.6, 0], lElbow: -0.2})} />
      <Dog d={{pos: [1.4, 0, 0.2], rotY: -0.3, t, blink: 0, tail: 1, legs: "down", mouth: f >= COLHER2 ? 0.3 : 0, mouthItem: <Spoon r={[0, 0, Math.PI / 2]} s={1.4} />}} />
    </>
  );
};
/* 3 — os especialistas e o açaí suspeito */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const up = f >= ACAI3 - 4 ? easeOut(clamp((f - ACAI3 + 4) / 16)) : 0;
  return (
    <>
      <Cam pos={[0, 1.7, 4.4]} look={[0, 1.2, -1.0]} fov={54} f={f} a={up > 0 ? ACAI3 - 4 : a} />
      <Bg c="#dfe9f2" />
      <KitchenLights />
      <Lab t={t} />
      {up > 0 && <AcaiCup p={[0, 0.9 + (1 - up) * -0.8, -1.3]} s={0.9 * up} r={[0, t * 0.8, 0]} glow={1} logo={false} />}
      {up > 0 && <Sparkles p={[0, 1.6, -1.3]} t={t} spread={1.2} />}
      <PBoy id="a3s" a={a} f={f} look={SCI} headExtra={<HeadGlasses />} item={<Lupa s={0.7} />} pose={(fr) => ({...idle(fr), pos: [-1.0, hop(fr, ACAI3, 14, 0.3), -0.3], rotY: 0.5, rShoulder: [-1.3, 0.4, 0], rElbow: -0.8, eyeWide: fr >= ACAI3 ? 1 : 0.4, mouthOpen: fr >= ACAI3 ? 0.6 : 0, brow: fr >= ACAI3 ? 1 : 0})} />
      <PBoy id="a3t" a={a} f={f} look={SCI2} headExtra={<HeadGlasses />} pose={(fr) => ({...idle(fr), pos: [1.0, hop(fr, ACAI3 + 3, 14, 0.3), -0.3], rotY: -0.5, eyeWide: fr >= CAUSA3 ? 1 : 0.4, mouthOpen: fr >= ACAI3 ? 0.6 : 0, ...(fr >= ACAI3 ? ARMS_UP : {lShoulder: [-1.0, -0.3, 0.1], lElbow: -1.6})})} />
    </>
  );
};
/* 3b — açaí gigante na praça e todo mundo correndo */
const S3b: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0, 2.6, 9.6]} look={[0, 1.7, 0]} fov={58} f={f} a={a} />
      <Street t={t} />
      <AcaiCup p={[0, 0, -0.8]} s={2.4} r={[0, Math.sin(t) * 0.2, 0]} glow={1} logo={false} />
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const dir = i % 2 ? 1 : -1;
        const x = dir * Math.max(1.3, 3.0 - k * 2.2 - (i >> 1) * 0.3);
        const arrived = Math.abs(x) <= 1.31;
        return <Toy key={i} look={NEIGHBORS[i]} pose={{...idle(f + i * 7), ...(arrived ? ARMS_UP : RUN(k, i)), pos: [x, arrived ? Math.abs(Math.sin(t * 8 + i)) * 0.15 : 0, 0.2 + (i >> 1) * 0.6], rotY: arrived ? -dir * 0.6 : -dir * 1.57, eyeWide: 1, mouthOpen: 0.6, smile: arrived ? 1 : 0}} />;
      })}
    </>
  );
};
/* 4–5 — fotos de verdade (camada 2D) */
const SFoto: React.FC<ShotProps> = () => <Bg c="#1a0626" />;
/* 6 — o tratamento: o açaí chega e o menino fica feliz demais */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const got = f >= EXPERIMENTAR6;
  const fly = clamp((f - EXPERIMENTAR6 + 14) / 14);
  return (
    <>
      <Cam pos={[0, 1.6, 4.8]} look={[0, 1.35, 0]} fov={54} f={f} a={got ? EXPERIMENTAR6 : a} />
      <Street t={t} />
      {!got && fly > 0 && <AcaiCup p={[lerp(3, 0.4, fly), 1.0 + Math.sin(fly * Math.PI) * 1.2, 0.6]} s={0.3} r={[0, 0, fly * 6]} logo={false} />}
      {got && <Sparkles p={[0, 1.4, 0.4]} t={t} />}
      {got && <AcaiCup p={[0, 0.86 + Math.abs(Math.sin(tf(f - EXPERIMENTAR6) * 7)) * 0.35, 0.78]} s={0.36} glow={1} logo={false} />}
      <PBoy id="a6" a={a} f={f} pose={(fr) => {
        if (fr < EXPERIMENTAR6) return {...idle(fr), pos: [0, 0, 0.4], rotY: 0, torso: [0.35, 0, 0], head: [0.3, 0, 0], eyeWide: 0, blink: 0.5, brow: -0.6, rShoulder: [0.1, 0, -0.1], lShoulder: [0.1, 0, 0.1]};
        const j = Math.abs(Math.sin(tf(fr - EXPERIMENTAR6) * 7)) * 0.35;
        return {...idle(fr), pos: [0, j, 0.4], rShoulder: [-1.0, 0.45, 0.05], rElbow: -1.15, lShoulder: [-1.0, -0.45, -0.05], lElbow: -1.15, head: [0.25, 0, 0], smile: 1, mouthOpen: 0.6, eyeWide: 0.6};
      }} />
    </>
  );
};
/* 7 — o menino pega o celular pra pedir */
const S7: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.4, 3.7]} look={[0, 1.1, 0]} fov={50} f={f} a={a} />
    <Street t={t} />
    <BigPhone p={[0.0, 1.08 + hop(f, a + 4, 12, 0.15), 0.78]} r={[-0.35, Math.PI, 0]} s={0.42} screen={phoneTex()} key2="vibephone" />
    <PBoy id="a7" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, hop(fr, a + 4, 12, 0.15), 0.3], rotY: 0, rShoulder: [-1.05, 0.45, 0.05], rElbow: -1.25, lShoulder: [-1.05, -0.45, -0.05], lElbow: -1.25, smile: 1, eyeWide: 0.5, head: [0.35, 0, 0]})} />
  </>
);

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3},
  {from: VICIADO3 - 6, Comp: S3b},
  {from: L(4), Comp: SFoto},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
  {from: PECA7, Comp: SFoto},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_ACAI} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["itumbiara", "problema", "serio", "sintomas", "gelado", "cremoso", "chocolate", "senhor", "lamber", "freezer", "cachorro", "colher", "especialistas", "causa", "acai", "recheado", "gostoso", "viciado", "suspeito", "epidemia", "vibe", "gourmet", "ninho", "sensacao", "explosao", "nutella", "morango", "sonhos", "delicias", "calma", "combater", "experimentar", "fora", "peca", "agora", "cardapio", "link", "bio", "instagram", "arroba", "aviso", "colherada", "novo"]);
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
const Photo: React.FC<{src: string; w?: number; h?: number; cx?: number; cy?: number; zoom?: number; style?: React.CSSProperties}> = ({src, w = 1080, h = 1920, cx = 0.5, cy = 0.5, zoom = 1, style}) => {
  const [iw, ih] = PH[src];
  const base = Math.max(w / iw, h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const left = Math.min(0, Math.max(w - dw, w / 2 - cx * dw));
  const top = Math.min(0, Math.max(h - dh, h / 2 - cy * dh));
  return (
    <div style={{position: "absolute", overflow: "hidden", width: w, height: h, ...style}}>
      <Img src={staticFile(`acai/${src}.jpg`)} style={{position: "absolute", left, top, width: dw, height: dh}} />
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
/* alerta vermelho piscando nas bordas */
const AlertGlow: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = 0.35 + 0.35 * Math.sin(f * 0.5);
  return <AbsoluteFill style={{boxShadow: `inset 0 0 220px 40px rgba(255,20,20,${o})`, pointerEvents: "none"}} />;
};
/* lista de sintomas */
const Symptoms: React.FC<{items: [number, string][]; to: number}> = ({items, to}) => {
  const f = useCurrentFrame();
  if (f < items[0][0] || f > to) return null;
  const out = 1 - ramp(f, to - 5, to);
  return (
    <div style={{position: "absolute", left: 90, top: 400, transform: `scale(${out})`, transformOrigin: "0 0", display: "flex", flexDirection: "column", gap: 18}}>
      {items.map(([t, s], i) =>
        f >= t ? (
          <div key={i} style={{transform: `scale(${pop(f, t, 8)})`, transformOrigin: "0 50%", background: "#ffffff", border: "6px solid #101018", borderRadius: 22, padding: "8px 24px", fontFamily, fontWeight: 900, fontSize: 56, color: "#101018", whiteSpace: "nowrap"}}>
            ✅ {s}
          </div>
        ) : null,
      )}
    </div>
  );
};
/* cartaz de procurado */
const Wanted: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const k = (f - from) / (to - from);
  const s = pop(f, from, 12);
  const stamp = f >= VIBE4 + 8;
  return (
    <AbsoluteFill style={{background: "radial-gradient(circle at 50% 40%, #4a1a5a, #12041a)"}}>
      <div style={{position: "absolute", left: 140, top: 230, width: 800, height: 1100, background: "#f3e2b8", border: "10px solid #5a3a1a", transform: `scale(${s * (1 + k * 0.06)}) rotate(${-2 + Math.sin(f * 0.6) * 0.6}deg)`, boxShadow: "0 20px 40px rgba(0,0,0,0.5)"}}>
        <div style={{textAlign: "center", fontFamily, fontWeight: 900, fontSize: 120, color: "#b3261e", marginTop: 20, letterSpacing: 4}}>PROCURADO</div>
        <div style={{textAlign: "center", fontFamily, fontWeight: 900, fontSize: 44, color: "#5a3a1a", marginTop: -6}}>SUSPEITO Nº 1 DA EPIDEMIA</div>
        <div style={{position: "absolute", left: 90, top: 230, width: 620, height: 620, border: "8px solid #5a3a1a", overflow: "hidden"}}>
          <Photo src="p3" w={604} h={604} cy={0.45} zoom={1.15} />
        </div>
        <div style={{position: "absolute", left: 0, right: 0, top: 880, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 74, color: "#2a0a3a"}}>VIBE GOURMET AÇAÍ</div>
        <div style={{position: "absolute", left: 0, right: 0, top: 975, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 40, color: "#5a3a1a"}}>CRIME: GOSTOSO DEMAIS</div>
      </div>
      {stamp && (
        <div style={{position: "absolute", left: 560, top: 1010, transform: `translate(-50%,-50%) rotate(-14deg) scale(${1 + 1.5 * (1 - clamp((f - VIBE4 - 8) / 6))})`, border: "12px solid #e8262d", color: "#e8262d", fontFamily, fontWeight: 900, fontSize: 96, padding: "0 30px", opacity: 0.9}}>CULPADO!</div>
      )}
    </AbsoluteFill>
  );
};
/* cortes rápidos dos produtos de verdade */
const Products: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const segs: {a: number; src: string; cx: number; cy: number; z: number; label: string; col?: string}[] = [
    {a: from, src: "p1", cx: 0.5, cy: 0.55, z: 1.0, label: ""},
    {a: NINHO5, src: "p2", cx: 0.5, cy: 0.5, z: 1.05, label: "NINHO SENSAÇÃO"},
    {a: NUTELLA5, src: "p1", cx: 0.13, cy: 0.6, z: 1.9, label: "EXPLOSÃO DE NUTELLA", col: "#ffb37a"},
    {a: MORANGO5, src: "p1", cx: 0.3, cy: 0.55, z: 1.9, label: "MORANGO DOS SONHOS", col: "#ff6b8b"},
    {a: OUTRAS5, src: "p3", cx: 0.45, cy: 0.5, z: 1.0, label: "E MUITO MAIS 🤤"},
  ];
  let i = 0;
  segs.forEach((s, k) => f >= s.a && (i = k));
  const s = segs[i];
  const end = segs[i + 1]?.a ?? to;
  const k = (f - s.a) / Math.max(1, end - s.a);
  const shake = f - s.a < 6 ? (6 - (f - s.a)) * 3 * Math.sin(f * 3) : 0;
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <div style={{position: "absolute", inset: 0, transform: `translate(${shake}px,0) scale(${1.02 + k * 0.08})`}}>
        <Photo src={s.src} cx={s.cx} cy={s.cy} zoom={s.z} />
      </div>
      <AbsoluteFill style={{background: "linear-gradient(180deg, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)"}} />
      {s.label && <Label key={i} text={s.label} from={s.a} y={330} color={s.col ?? "#ffffff"} size={s.label.length > 16 ? 82 : 96} />}
      <Flash at={s.a} />
    </AbsoluteFill>
  );
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
const PhoneUI: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  const s = pop(f, from, 12);
  const insta = f >= INSTAGRAM8 - 2;
  const k = (f - from) / (INSTAGRAM8 - from);
  return (
    <AbsoluteFill style={{background: `radial-gradient(circle at 50% 35%, #8a3aaa, #1a0626)`}}>
      <div style={{position: "absolute", left: 540, top: 800, width: 660, height: 1300, transform: `translate(-50%,-50%) scale(${s}) rotate(${Math.sin(f * 0.08) * 1.2}deg)`, background: "#101018", borderRadius: 70, padding: 18, boxShadow: "0 30px 60px rgba(0,0,0,0.5)"}}>
        <div style={{position: "relative", width: "100%", height: "100%", borderRadius: 54, overflow: "hidden"}}>
          {insta ? <InstaScreen f={f} from={INSTAGRAM8} /> : <MenuScreen k={k} tap={(f - (from + 22)) / 8} />}
        </div>
        <div style={{position: "absolute", left: 270, top: 30, width: 120, height: 30, borderRadius: 15, background: "#101018"}} />
      </div>
      <Flash at={from} />
    </AbsoluteFill>
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
        <Photo src="p1" w={1160} h={2000} />
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

/* ======================= vídeo ======================= */
const FXV = 0.3;
const SND: React.FC<{src: string; from: number; dur?: number; v: number}> = ({src, from, dur = 60, v}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} />
  </Sequence>
);
const END_FROM = L(9);
export const VideoAcai: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const early = words.filter((w) => w.line < 7 && w.line !== 4);
  const late = words.filter((w) => w.line >= 7 || w.line === 4);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <AlertGlow from={0} to={L(1) - 1} />
      <TopTitle from={4} to={L(1) - 3} text="🚨 ALERTA EM ITUMBIARA! 🚨" size={76} />
      <TopTitle from={SINTOMAS1} to={L(2) - 2} text="SINTOMAS IDENTIFICADOS!" size={78} />
      <Symptoms items={[[GELADO1, "GELADO"], [at(1, "cremoso"), "CREMOSO"], [CHOCOLATE1, "CHOCOLATE"]]} to={L(2) - 2} />
      <Ono from={FREEZER2} to={CACHORRO2 - 4} text="SLURP!" size={150} color="#7fd0ff" />
      <Bubble from={COLHER2 - 4} to={L(3) - 2} text="UMA COLHER, POR FAVOR 🥄" x={600} y={620} size={46} />
      <TopTitle from={CAUSA3} to={VICIADO3 - 8} text="ESPECIALISTAS" />
      <TopTitle from={VICIADO3 - 6} to={L(4) - 2} text="☣️ AÇAÍ ALTAMENTE CONTAGIOSO! ☣️" size={70} />
      <Wanted from={L(4)} to={L(5)} />
      <Products from={L(5)} to={L(6)} />
      <Ono from={CALMA6} to={EXPERIMENTAR6 - 4} text="CALMA!" size={150} color="#ffffff" />
      <TopTitle from={EXPERIMENTAR6} to={L(7) - 2} text="TRATAMENTO DISPONÍVEL! 😂" size={74} />
      <Confetti from={EXPERIMENTAR6} to={EXPERIMENTAR6 + 60} />
      <Bubble from={L(7) + 6} to={PECA7 - 2} text="VOU PEDIR AGORA!" x={540} y={560} size={56} />
      <PhoneUI from={PECA7} to={END_FROM} />
      <EndCard from={END_FROM} to={TOTAL_ACAI} />
      <Watermark />

      <Captions words={early} keys={KEYS} />
      <Captions words={late} keys={KEYS} top={1650} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozacai.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {[NINHO5, NUTELLA5, MORANGO5, OUTRAS5].map((c) => (
        <SND key={"p" + c} src="sfx7/whoosh.mp3" from={c - 2} dur={20} v={FXV * 0.3} />
      ))}
      <SND src="sfx10/plim.mp3" from={GELADO1} dur={20} v={FXV * 0.3} />
      <SND src="sfx10/plim.mp3" from={at(1, "cremoso")} dur={20} v={FXV * 0.3} />
      <SND src="sfx10/plim.mp3" from={CHOCOLATE1} dur={20} v={FXV * 0.3} />
      <SND src="sfx11/bark.mp3" from={CACHORRO2 + 6} dur={30} v={FXV * 0.35} />
      <SND src="sfx12/tada.mp3" from={ACAI3} dur={40} v={FXV * 0.3} />
      <SND src="sfx10/bonk.mp3" from={VIBE4 + 8} dur={20} v={FXV * 0.5} />
      <SND src="sfx7/confetti.mp3" from={EXPERIMENTAR6} dur={50} v={FXV * 0.4} />
      <SND src="sfx9/yay.mp3" from={EXPERIMENTAR6} dur={50} v={FXV * 0.3} />
      <SND src="sfx2/click.mp3" from={PECA7 + 20} dur={20} v={FXV * 0.8} />
      <SND src="sfx2/click.mp3" from={INSTAGRAM8 + 24} dur={20} v={FXV * 0.8} />
      <SND src="sfx12/tada.mp3" from={END_FROM} dur={40} v={FXV * 0.3} />
    </AbsoluteFill>
  );
};
