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
import {Rooster} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {ChefHat} from "./Sets11";
import {SafariHat} from "./Sets18";
import {WallClock} from "./Sets19";
import {Bg} from "./Sets20";
import {Panela} from "./Sets28";
import {Dino} from "./Sets7";
import {Turtle, PicketSign, FossilMiojo, Sache, Padaria} from "./Sets33";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingMiojo2.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_MIOJO2 = F(words[words.length - 1].e + 0.9);

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
const FOSSIL0 = at(0, "fossil");
const GREVE1 = at(1, "greve");
const MICRO1 = at(1, "micro-ondas");
const TARTARUGA2 = at(2, "tartaruga");
const DIAS2 = at(2, "dias");
const PEDRA4 = at(4, "pedra");
const PALEO4 = at(4, "paleontologo");
const DINO5 = at(5, "dinossauro");
const JURASSICO5 = at(5, "jurassico");
const CLAUDIO6 = at(6, "claudio");
const ODEIA6 = at(6, "odeia");
const KEVIN6 = at(6, "kevin");
const RUGIDO7 = at(7, "rugido");
const GALO7 = at(7, "galo");
const PADARIA8 = at(8, "padaria");
const PAO9 = at(9, "pao");
const ESCAMBO9 = at(9, "escambo");
const MARCO10 = at(10, "marco");
const PARABENS11 = at(11, "parabens");
const SEGUIR11 = at(11, "seguir");

/* ---------- física e utilidades ---------- */
const tf = (fr: number) => fr / FPS;
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode; look?: ToyLook; headExtra?: React.ReactNode}> = ({id, a, f, pose, item, look = BOY, headExtra}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={look} item={item} headExtra={headExtra} /> : <Toy pose={p} look={look} headExtra={headExtra} />;
};
const PALEO: ToyLook = {shirt: "#c9a46a", pants: "#6a5a3a", hairStyle: "buzz", hair: "#5a3a20", skin: "#d9a173"};
const BAKER: ToyLook = {shirt: "#ffffff", pants: "#3a3f4a", apron: true, hairStyle: "bald", skin: "#e0b08a", belly: 0.7};
const STOVE: V3 = [0.4, 0, -1.2];
const PAN: V3 = [0.4, 0.95, -1.15];
const Loaf: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[0.18, 0.09, 0.1]} material={sm("#d9913a", 0.6)}>
      <sphereGeometry args={[1, 14, 10]} />
    </mesh>
    {[-0.08, 0, 0.08].map((x, i) => (
      <mesh key={i} position={[x, 0.07, 0]} rotation={[0, 0, 0.5]} scale={[0.02, 0.012, 0.07]} material={sm("#f2d08a", 0.6)}>
        <sphereGeometry args={[1, 6, 4]} />
      </mesh>
    ))}
  </group>
);
const Brush = <group rotation={[0.4, 0, 0]}><mesh position={[0, 0.1, 0]} material={sm("#8a5a2a", 0.6)}><cylinderGeometry args={[0.012, 0.012, 0.22, 6]} /></mesh><mesh position={[0, 0.23, 0]} material={sm("#f2e6c8", 0.8)}><coneGeometry args={[0.03, 0.06, 8]} /></mesh></group>;
const Kitchen: React.FC<{night?: boolean}> = ({night = true}) => (
  <>
    <Bg c={night ? "#1a2244" : "#f3e3c8"} />
    <hemisphereLight args={[night ? "#9fb0ff" : "#fff6e6", "#8a6a50", night ? 0.75 : 1.0]} />
    <pointLight position={[0.3, 3.0, 1.4]} intensity={night ? 8 : 10} distance={12} decay={1.4} color="#fff4e0" castShadow />
    <mesh position={[0, 2, -1.8]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color={night ? "#7a86b8" : "#f6d9a8"} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#b98a5a" />
    </mesh>
    {/* bancada com fogão */}
    <mesh position={[STOVE[0], 0.45, STOVE[2]]} geometry={rbox(2.6, 0.9, 0.8, 0.04)} material={sm("#f2f2ee", 0.5)} castShadow receiveShadow />
    {[-0.2, 0.4, 1.0].map((x) => (
      <mesh key={x} position={[STOVE[0] - 0.4 + x, 0.91, STOVE[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.1, 0.15, 16]} />
        <meshStandardMaterial color="#2a2a32" />
      </mesh>
    ))}
    {/* micro-ondas */}
    <group position={[STOVE[0] - 1.0, 0.9, STOVE[2] - 0.05]}>
      <mesh position={[0, 0.22, 0]} geometry={rbox(0.6, 0.42, 0.45, 0.03)} material={sm("#d8dde6", 0.4)} castShadow />
      <mesh position={[-0.06, 0.22, 0.23]}>
        <planeGeometry args={[0.38, 0.3]} />
        <meshStandardMaterial color="#1d1f27" />
      </mesh>
      <mesh position={[0.21, 0.32, 0.23]}>
        <planeGeometry args={[0.12, 0.06]} />
        <meshBasicMaterial color="#3ee07a" toneMapped={false} />
      </mesh>
    </group>
    <WallClock p={[STOVE[0] + 0.4, 2.35, -1.74]} h={3} m={0} s={0.9} />
  </>
);
const Pan: React.FC<{t: number; fossil?: boolean; steam?: number}> = ({t, fossil = true, steam = 0}) => (
  <>
    <Panela p={PAN} s={0.55} t={t} />
    {fossil && <FossilMiojo p={[PAN[0], PAN[1] + 0.2, PAN[2]]} s={0.55} />}
    {steam > 0 &&
      [0, 1, 2, 3].map((i) => {
        const k = (t * 0.6 + i * 0.25) % 1;
        return (
          <mesh key={i} position={[PAN[0] + Math.sin(i * 3 + t) * 0.1, PAN[1] + 0.4 + k * 0.9, PAN[2]]} scale={0.1 + k * 0.15}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#ffffff" transparent opacity={0.5 * (1 - k) * steam} />
          </mesh>
        );
      })}
  </>
);
const NightStreet: React.FC<{t: number; lit?: boolean; day?: number}> = ({t, lit = false, day = 0}) => (
  <>
    {day > 0.5 ? <DayOut /> : (
      <>
        <Bg c="#101836" />
        <hemisphereLight args={["#8fa0ff", "#2a2a40", 0.7]} />
        <directionalLight position={[-4, 8, 6]} intensity={0.6} color="#bfc8ff" />
      </>
    )}
    <group position={[0, 0, -2]}>
      <Town t={t} galo={false} variant="nova" dark={day < 0.5} lit={lit ? () => true : undefined} lamps />
    </group>
  </>
);

/* 0 — o miojo virou fóssil */
const M0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.6, 3.6]} look={[0.2, 1.1, -1.0]} fov={54} f={f} a={f >= FOSSIL0 ? FOSSIL0 : a} punch={f >= FOSSIL0 ? 12 : 7} />
    <Kitchen />
    <Pan t={t} fossil={f >= FOSSIL0 - 4} steam={1} />
    <PBoy id="m0" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, hop(fr, FOSSIL0, 12, 0.25), -0.3], rotY: 0.7, eyeWide: fr >= FOSSIL0 ? 1 : 0.4, mouthOpen: fr >= FOSSIL0 ? 0.7 : 0, brow: fr >= FOSSIL0 ? 1 : 0, ...(fr >= FOSSIL0 ? {rShoulder: [-1.3, 0.5, 0], rElbow: -1.9, lShoulder: [-1.3, -0.5, 0], lElbow: -1.9} : {})})} />
  </>
);
/* 1 — o relógio em greve */
const M1: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.6, 1.9, 2.6]} look={[0.7, 1.8, -1.6]} fov={52} f={f} a={a} />
    <Kitchen />
    <Pan t={t} />
    <PicketSign p={[STOVE[0] + 0.4 + 0.05 * Math.sin(t * 6), 1.35, -1.6]} r={[0, 0, 0.1 * Math.sin(t * 6)]} s={1.0} text={"EM\nGREVE!"} k="greve" />
    <PBoy id="m1" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.4, 0, 0.0], rotY: 0.9, head: [-0.3, 0, 0], eyeWide: 0.8, ...(fr >= MICRO1 ? {lShoulder: [-1.5, -0.3, 0.3], lElbow: -0.1} : {}), brow: fr >= GREVE1 ? 1 : 0})} />
  </>
);
/* 2–3 — a tartaruga cronometrista */
const M2: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - TARTARUGA2 + 4) / 90);
  return (
    <>
      <Cam pos={[0.1, 1.4, 4.8]} look={[0.1, 0.75, -0.4]} fov={52} f={f} a={f >= L(3) ? L(3) : a} />
      <Kitchen />
      <Pan t={t} steam={1} />
      <Turtle p={[lerp(2.4, 0.7, k), 0, 0.3]} rotY={k < 1 ? -1.4 : -0.4} s={0.85} t={t} walk={k < 1 ? 0.3 : 0} blink={0.4} arm={f >= DIAS2 ? 0.4 : 0} />
      <PBoy id="m2" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.7, hop(fr, L(3), 14, 0.3), 0.2], rotY: 0.6, eyeWide: 0.7, smile: fr >= L(3) ? 1 : 0, ...(fr >= L(3) ? ARMS_UP : {})})} />
    </>
  );
};
/* 4 — paleontólogo escavando a panela */
const M4: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - PALEO4 + 6) / 24);
  return (
    <>
      <Cam pos={[0.0, 1.8, 4.8]} look={[0.0, 1.0, -0.7]} fov={54} f={f} a={a} />
      <Kitchen />
      <Pan t={t} steam={f < PEDRA4 ? 1 : 0.3} />
      <Turtle p={[1.6, 0, 0.3]} rotY={-0.6} s={0.7} t={t} blink={0.4} />
      {k > 0 && <PBoy id="m4p" a={PALEO4 - 6} f={f} look={PALEO} headExtra={<SafariHat />} item={Brush} pose={(fr) => ({...idle(fr), pos: [lerp(-2.6, -0.25, easeOut(clamp((fr - PALEO4 + 6) / 24))), 0, -0.45], rotY: 1.2, walk: tf(fr) * 9, walkAmt: clamp((fr - PALEO4 + 6) / 24) < 1 ? 1 : 0, torso: [0.35, 0, 0], rShoulder: [-1.2, 0.3, 0.1], rElbow: -0.6 + 0.3 * Math.sin(tf(fr) * 14), head: [0.3, 0, 0]})} />}
      <PBoy id="m4" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.95, 0, 0.9], rotY: 0.7, eyeWide: fr >= PEDRA4 ? 1 : 0.5, mouthOpen: fr >= PEDRA4 ? 0.4 : 0})} />
    </>
  );
};
/* 5–6 — o dinossauro Kevin na panela */
const M5: React.FC<ShotProps> = ({f, a, t}) => {
  const up = f >= DINO5 - 4 ? easeOut(clamp((f - DINO5 + 4) / 16)) : 0;
  const mad = f >= ODEIA6;
  return (
    <>
      <Cam pos={[0.0, 1.5, 3.9]} look={[0.0, 1.1, PAN[2]]} fov={50} f={f} a={f >= L(6) ? L(6) : up > 0 ? DINO5 - 4 : a} />
      <Kitchen />
      <Pan t={t} fossil={up < 0.5} />
      {up > 0 && <Dino p={{pos: [PAN[0], PAN[1] - 0.25 + up * 0.25, PAN[2]], rotY: 0.2, t, jaw: mad ? 0.5 + 0.4 * Math.abs(Math.sin(t * 10)) : 0.3 + 0.3 * Math.abs(Math.sin(t * 7)), blink: blinkCurve(f), arms: mad ? 1 : 0.4, tail: 1}} s={0.22} />}
      {up > 0 && !mad && <Sache p={[PAN[0] + 0.12, PAN[1] + 0.32, PAN[2] + 0.12]} r={[0, 0, 0.3]} s={1.2} />}
      <PBoy id="m5" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, 0, -0.7], rotY: 0.8, eyeWide: 0.9, mouthOpen: fr >= CLAUDIO6 && fr < ODEIA6 ? 0.4 : 0, smile: fr >= CLAUDIO6 && fr < ODEIA6 ? 1 : 0, brow: mad ? 1 : 0, ...(fr >= CLAUDIO6 && fr < ODEIA6 ? {lShoulder: [-1.2, -0.3, 0.2], lElbow: -0.4} : {})})} />
    </>
  );
};
/* 7 — o rugido e o galo vizinho */
const M7: React.FC<ShotProps> = ({f, a, t}) => {
  const out = f >= GALO7 - 6;
  if (!out)
    return (
      <>
        <Cam pos={[0.4, 1.4, 2.0]} look={[PAN[0], 1.2, PAN[2]]} fov={48} f={f} a={f >= RUGIDO7 ? RUGIDO7 : a} punch={14} />
        <Kitchen />
        <Pan t={t} fossil={false} />
        <Dino p={{pos: [PAN[0], PAN[1], PAN[2]], rotY: 0.2, t, jaw: f >= RUGIDO7 ? 1 : 0.4, arms: 1, tail: 2}} s={0.22} />
      </>
    );
  return (
    <>
      <Cam pos={[0, 1.4, 4.4]} look={[0.2, 1.1, 0]} fov={52} f={f} a={GALO7 - 6} />
      <pointLight position={[0.8, 3.5, 0]} intensity={8} distance={8} color="#ffe6b0" />
      <NightStreet t={t} />
      <Rooster p={{pos: [0.2, 0, 0.4], rotY: 0.2, t, crow: 0.6 + 0.4 * Math.abs(Math.sin(t * 6)), flap: 1, flapPh: t * 20, chest: 1}} s={2.0} />
    </>
  );
};
/* 8 — o bairro acorda e a padaria abre */
const M8: React.FC<ShotProps> = ({f, a, t}) => {
  const open = f >= PADARIA8 - 4 ? easeOut(clamp((f - PADARIA8 + 4) / 20)) : 0;
  return (
    <>
      <Cam pos={[0.4, 2.2, 8.4]} look={[0, 1.3, 0]} fov={56} f={f} a={a} />
      <NightStreet t={t} lit />
      <Padaria p={[-1.2, 0, -1.0]} rotY={0.2} s={0.95} open={open} />
      {[0, 1, 2, 3].map((i) => (
        <Toy key={i} look={NEIGHBORS[i]} pose={{...idle(f + i * 9), pos: [0.9 + (i % 2) * 0.9, Math.abs(Math.sin(t * 6 + i)) * 0.1, 0.4 + (i >> 1) * 0.8], rotY: -0.5, ...ARMS_UP, smile: 1, mouthOpen: 0.5}} />
      ))}
    </>
  );
};
/* 9 — o escambo padeirístico */
const M9: React.FC<ShotProps> = ({f, a, t}) => {
  const swap = f >= PAO9;
  return (
    <>
      <Cam pos={[0.0, 1.7, 5.6]} look={[0.0, 1.2, -0.5]} fov={54} f={f} a={f >= ESCAMBO9 ? ESCAMBO9 : a} />
      <NightStreet t={t} lit />
      <Padaria p={[0, 0, -2.2]} s={1.0} open={1} />
      <PBoy id="m9b" a={a} f={f} look={BAKER} headExtra={<ChefHat />} item={swap ? <FossilMiojo p={[0, -0.05, 0.12]} s={0.35} /> : <Loaf p={[0, -0.04, 0.1]} r={[0, Math.PI / 2, 0]} s={1.3} />} pose={(fr) => ({...idle(fr), pos: [0.75, 0, -0.1], rotY: -0.7, rShoulder: [-1.2, 0.3, 0], rElbow: -0.8, smile: 1, eyeWide: fr >= PAO9 ? 1 : 0.3})} />
      <PBoy id="m9" a={a} f={f} item={swap ? <Loaf p={[0, -0.04, 0.1]} r={[0, Math.PI / 2, 0]} s={1.3} /> : <FossilMiojo p={[0, -0.05, 0.12]} s={0.35} />} pose={(fr) => ({...idle(fr), pos: [-0.75, hop(fr, ESCAMBO9, 14, 0.3), 0.1], rotY: 0.7, rShoulder: [-0.9, 0.3, 0], rElbow: -0.5, smile: fr >= PAO9 ? 1 : 0.3})} />
    </>
  );
};
/* 10–11 — a tartaruga termina em março; parabéns */
const M10: React.FC<ShotProps> = ({f, a, t}) => {
  const party = f >= PARABENS11;
  return (
    <>
      <Cam pos={party ? [0.0, 1.6, 4.9] : [0.6, 1.0, 2.6]} look={party ? [0.1, 1.0, -0.4] : [0.6, 0.55, 0]} fov={52} f={f} a={party ? PARABENS11 : a} />
      <Kitchen night={false} />
      <Pan t={t} fossil={false} />
      <Turtle p={[0.7, 0, 0.1]} rotY={-0.3} s={0.85} t={t} blink={0.3} arm={f >= MARCO10 ? 0.8 : 0} />
      {party && <Dino p={{pos: [PAN[0], PAN[1], PAN[2]], rotY: 0.3, t, jaw: 0.3, arms: 0.5 + 0.5 * Math.sin(t * 5), tail: 1, blink: blinkCurve(f)}} s={0.22} />}
      <PBoy id="m10" a={a} f={f} item={<Loaf p={[0, -0.04, 0.1]} r={[0, Math.PI / 2, 0]} s={1.3} />} pose={(fr) => ({...idle(fr), pos: [-0.7, party ? Math.abs(Math.sin(tf(fr) * 6)) * 0.25 : 0, 0.3], rotY: 0.5, rShoulder: [party ? -2.6 : -1.3, 0.3, 0], rElbow: -0.5, smile: 1, mouthOpen: party ? 0.5 : 0, ...(party ? {lShoulder: [-2.6, -0.2, 0.3], lElbow: -0.3} : {})})} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: M0},
  {from: L(1), Comp: M1},
  {from: L(2), Comp: M2},
  {from: L(4), Comp: M4},
  {from: L(5), Comp: M5},
  {from: L(7), Comp: M7},
  {from: L(8), Comp: M8},
  {from: L(9), Comp: M9},
  {from: L(10), Comp: M10},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_MIOJO2} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["miojo", "fossil", "tres", "minutos", "relogio", "greve", "micro-ondas", "tartaruga", "cronometrista", "dias", "cronometro", "casco-lento", "pedra", "paleontologo", "pincelzinho", "dinossauro", "sache", "tempero", "macarrao", "jurassico", "claudio", "odeia", "kevin", "rugido", "galo", "bairro", "dia", "padaria", "padeiro", "pao", "rara", "escambo", "padeiristico", "marco", "parabens", "seguir", "perfil", "sempre"]);
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
  [L(3), L(4), ["CRONÔMETRO", "CASCO-LENTO"]],
  [JURASSICO5, L(6), ["MACARRÃO", "JURÁSSICO"]],
  [ESCAMBO9, L(10), ["ESCAMBO", "PADEIRÍSTICO"]],
];
const FOLLOW_FROM = SEGUIR11 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoMiojo2: React.FC = () => {
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
      <TopTitle from={4} to={FOSSIL0 - 3} text="MIOJO DE MADRUGADA" />
      <Ono from={FOSSIL0} to={L(1) - 2} text="FÓSSIL?!" size={140} color="#ffd21f" />
      <Tag from={GREVE1} to={L(2) - 2} text="RELÓGIO EM GREVE ✊" y={330} />
      <BigNum from={DIAS2} to={L(3) - 2} text="3 DIAS" size={140} />
      <Ono from={PEDRA4} to={PALEO4 - 3} text="VIROU PEDRA!" size={120} color="#c9a46a" />
      <Bubble from={CLAUDIO6} to={ODEIA6 - 2} text="CLÁUDIO?" x={360} y={620} size={56} />
      <Bubble from={KEVIN6 - 4} to={L(7) - 2} text="EU SOU O KEVIN!" x={680} y={560} size={52} />
      <Ono from={RUGIDO7} to={GALO7 - 8} text="RAAAWR!" size={150} color="#7ed957" />
      <Ono from={GALO7 - 4} to={L(8) - 2} text="COCORICÓ!" size={130} color="#ffd21f" />
      <Plaque from={L(8) + 6} to={L(9) - 2} text={"🕒 3 DA MANHÃ"} x={540} y={420} size={60} />
      <Plaque from={MARCO10} to={L(11) - 2} text={"📅 MARÇO"} x={540} y={420} size={70} />
      <Confetti from={PARABENS11} to={PARABENS11 + 60} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_MIOJO2 - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozmiojo2.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 2} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx10/bonk.mp3" from={FOSSIL0} dur={20} v={FXV * 0.4} />
      <SND src="sfx3/bell.mp3" from={DIAS2} dur={30} v={FXV * 0.3} />
      <SND src="sfx3/crack.mp3" from={PEDRA4} dur={20} v={FXV * 0.4} />
      <SND src="sfx10/bubble.mp3" from={L(4)} dur={PEDRA4 - L(4)} v={FXV * 0.25} />
      <SND src="sfx7/pof.mp3" from={DINO5} dur={20} v={FXV * 0.4} />
      <SND src="sfx10/plim.mp3" from={PAO9} dur={30} v={FXV * 0.3} />
      <SND src="sfx7/confetti.mp3" from={PARABENS11} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
