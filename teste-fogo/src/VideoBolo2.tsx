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
import {sm, rbox, MoonSet, Helmet, Alien} from "./Sets9";
import {Fridge, UFO} from "./Sets11";
import {Space} from "./Sets18";
import {Bg} from "./Sets20";
import {BoloChar, HamsterShip, PlanetMom, EggGuy, Faca, Portal, ChantillyGalaxy} from "./Sets34";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingBolo2.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_BOLO2 = F(words[words.length - 1].e + 0.15);

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
const GELADEIRA1 = at(1, "geladeira");
const PORTAL1 = at(1, "portal");
const HAMSTER2 = at(2, "hamster");
const FESTA4 = at(4, "festa");
const ET4 = at(4, "et");
const OVOS4 = at(4, "ovos");
const FACA5 = at(5, "faca");
const ACERTA5 = at(5, "acerta");
const MAE6 = at(6, "mae");
const PLANETA6 = at(6, "planeta");
const MONTANHA7 = at(7, "montanha-russa");
const VIA8 = at(8, "via");
const UNIVERSO8 = at(8, "universo");
const QUEBRA9 = at(9, "quebra");
const PORTAL9 = at(9, "portal");
const FAMOSO10 = at(10, "famoso");
const AUTOGRAFO10 = at(10, "autografo");
const MAE11 = at(11, "mae");
const MORDIDA11 = at(11, "mordida");
const SEGUIR12 = at(12, "seguir");
const NOVINHO13 = at(13, "novinho");
const JANELA13 = at(13, "janela");
const MALINHA13 = at(13, "malinha");

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
const MAE: ToyLook = {shirt: "#f06292", pants: "#3a3f4a", hairStyle: "long", hair: "#3a2010", lips: "#c0392b", skin: "#e0b08a", lashes: true};
const ASTRO: ToyLook = {shirt: "#f2f2f2", pants: "#f2f2f2", hairStyle: "buzz", hair: "#3a2a1a"};
const TABLE: V3 = [0, 0, -0.6];
const WIN: V3 = [0.9, 1.75, -1.72];
const FRIDGE: V3 = [-1.4, 0, -1.2];

/* cozinha de noite com a Lua na janela */
const Kitchen: React.FC<{t: number}> = ({t}) => (
  <>
    <Bg c="#141c3a" />
    <hemisphereLight args={["#aab8ff", "#6a5040", 0.8]} />
    <pointLight position={[0.2, 3.0, 1.4]} intensity={9} distance={12} decay={1.4} color="#fff4e0" castShadow />
    <mesh position={[0, 2, -1.8]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color="#f6d9a8" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#b98a5a" />
    </mesh>
    {/* janela com céu e Lua */}
    <mesh position={[WIN[0], WIN[1], -1.74]}>
      <planeGeometry args={[1.2, 1.0]} />
      <meshBasicMaterial color="#0c1230" />
    </mesh>
    <mesh position={[WIN[0] + 0.25, WIN[1] + 0.2, -1.73]}>
      <circleGeometry args={[0.16, 24]} />
      <meshBasicMaterial color="#fff6c0" toneMapped={false} />
    </mesh>
    {[[-0.4, 0.3], [-0.2, -0.25], [0.35, -0.3], [-0.45, -0.1]].map(([x, y], i) => (
      <mesh key={i} position={[WIN[0] + x, WIN[1] + y, -1.73]} scale={0.015 + 0.01 * Math.abs(Math.sin(t * 3 + i))}>
        <circleGeometry args={[1, 5]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
    ))}
    <mesh position={[WIN[0], WIN[1], -1.72]} geometry={rbox(1.3, 1.1, 0.05, 0.03)} material={sm("#ffffff", 0.5, {transparent: true, opacity: 0})} />
    {[[0, 0.55, 1.34, 0.08], [0, -0.55, 1.34, 0.08], [0.63, 0, 0.08, 1.1], [-0.63, 0, 0.08, 1.1], [0, 0, 0.05, 1.0]].map(([x, y, w, h], i) => (
      <mesh key={"f" + i} position={[WIN[0] + x, WIN[1] + y, -1.71]} geometry={rbox(w, h, 0.06, 0.01)} material={sm("#ffffff", 0.5)} />
    ))}
    {/* mesa */}
    <mesh position={[TABLE[0], 0.72, TABLE[2]]} geometry={rbox(1.4, 0.08, 0.9, 0.03)} material={sm("#8a5a2a", 0.6)} castShadow receiveShadow />
    {[[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].map(([x, z], i) => (
      <mesh key={"l" + i} position={[TABLE[0] + x, 0.36, TABLE[2] + z]} material={sm("#6a4020", 0.6)}>
        <boxGeometry args={[0.07, 0.72, 0.07]} />
      </mesh>
    ))}
  </>
);
/* bolo saindo pela janela (é o MESMO quadro no fim e no começo: loop) */
const ESCAPE = (k: number): V3 => [lerp(0.25, WIN[0], k), 0.76 + Math.sin(k * Math.PI) * 0.6 + k * (WIN[1] - 0.76 - 0.3), lerp(TABLE[2], WIN[2] + 0.2, k)];
const LoopShot: React.FC<{f: number; t: number; k: number; fly: number; boy?: React.ReactNode}> = ({f, t, k, fly, boy}) => {
  const pos = fly > 0 ? ([WIN[0] + fly * 0.4, WIN[1] + fly * 1.2, WIN[2] - fly * 3] as V3) : ESCAPE(k);
  return (
    <>
      <Cam pos={[0.1, 1.55, 3.4]} look={[0.2, 1.25, -1.0]} fov={52} f={f} a={-99} />
      <Kitchen t={t} />
      <BoloChar p={pos} rotY={-0.4} s={0.45 * (1 - fly * 0.7)} t={t} suitcase={1} hop={1} blink={blinkCurve(f)} />
      {boy}
    </>
  );
};

/* 0 — o bolo fugindo pra Lua (continua o fim do vídeo) */
const B0: React.FC<ShotProps> = ({f, a, t}) => {
  const fly = clamp((f - a) / 50);
  return (
    <LoopShot f={f} t={t} k={1} fly={fly} boy={<PBoy id="b0" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.8, 0, -0.1], rotY: 0.6, eyeWide: 1, mouthOpen: 0.4, brow: 1, lShoulder: [-1.6, -0.3, 0.3], lElbow: -0.1, rShoulder: [-1.6, 0.3, 0], rElbow: -0.1})} />} />
  );
};
/* 1 — a geladeira vira portal */
const B1: React.FC<ShotProps> = ({f, a, t}) => {
  const open = f >= GELADEIRA1 ? easeOut(clamp((f - GELADEIRA1) / 12)) : 0;
  const pull = f >= PORTAL1 + 10 ? clamp((f - PORTAL1 - 10) / 20) : 0;
  return (
    <>
      <Cam pos={[-0.4, 1.5, 3.4]} look={[-1.1, 1.0, -1.0]} fov={54} f={f} a={a} />
      <Kitchen t={t} />
      <Fridge p={FRIDGE} rotY={0.35} f={{t, open}} />
      {f >= PORTAL1 - 4 && <Portal p={[FRIDGE[0] + 0.15, 1.0, FRIDGE[2] + 0.45]} r={[0, 0.35, 0]} s={0.6 * easeOut(clamp((f - PORTAL1 + 4) / 10))} t={t} />}
      <group position={[lerp(0, FRIDGE[0] + 0.15 + 0.3, pull), 0, lerp(0, FRIDGE[2] + 0.5 - 0.3, pull)]} rotation={[0, 0, pull * 4]} scale={1 - pull * 0.8}>
        <PBoy id="b1" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.2, 0, 0.3], rotY: -0.8, eyeWide: fr >= PORTAL1 ? 1 : 0.4, mouthOpen: fr >= PORTAL1 ? 0.6 : 0, ...(fr >= PORTAL1 ? ARMS_UP : {lShoulder: [-1.4, -0.3, 0.2], lElbow: -0.3})})} />
      </group>
    </>
  );
};
/* 2–3 — a nave do hamster */
const B2: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.3, 5.8]} look={[0, 0.7, 0]} fov={54} f={f} a={f >= L(3) ? L(3) : a} />
    <Space t={t} />
    <hemisphereLight args={["#ffffff", "#3a3a5a", 1.0]} />
    <pointLight position={[2, 4, 3]} intensity={12} distance={14} />
    <group position={[0, Math.sin(t * 2) * 0.08, 0]} rotation={[0.1, 0.3 * Math.sin(t * 0.6), Math.sin(t * 1.5) * 0.05]}>
      <HamsterShip p={[0, 0, 0]} s={1.0} t={t} run={f >= L(3) ? 2 : 1} />
      <Toy look={BOY} pose={{...idle(f), pos: [-0.45, 0.25, 0.1], rotY: 0.4, sit: 1, eyeWide: 0.7, smile: f >= L(3) ? 1 : 0, ...(f >= L(3) ? ARMS_UP : {})} as Pose} />
    </group>
    <SpeedLines p={[0.5, 0, 0]} dir={1} />
  </>
);
/* 4–5 — a festa do bolo na Lua e a faca voadora */
const MoonParty: React.FC<{f: number; t: number; knife?: number; ufoHit?: number; alienMad?: boolean; tilt?: number}> = ({f, t, knife = -1, ufoHit = 0, alienMad = false, tilt = 0}) => (
  <group rotation={[0, 0, tilt]}>
    <MoonSet t={t} />
    <hemisphereLight args={["#ffffff", "#5a5a6a", 1.0]} />
    <pointLight position={[2, 5, 4]} intensity={14} distance={16} castShadow />
    <BoloChar p={[0, 0, -0.6]} s={1.1} t={t} hat arms={1} blink={blinkCurve(f)} mouth={0.3 + 0.2 * Math.abs(Math.sin(t * 6))} />
    {[0, 1].map((i) => (
      <Toy key={i} look={ASTRO} headExtra={<Helmet />} pose={{...idle(f + i * 11), pos: [i ? 1.5 : -1.5, Math.abs(Math.sin(t * 6 + i)) * 0.15, -0.2], rotY: i ? -0.6 : 0.6, ...ARMS_UP, smile: 1}} />
    ))}
    <Alien a={{pos: [1.0, 0, 0.8], rotY: -0.4, t, blink: blinkCurve(f + 7), mouth: alienMad ? 0.8 : 0.3, wave: alienMad ? 0 : 1}} s={0.9} />
    {[0, 1, 2].map((i) => (
      <EggGuy key={i} p={[-0.9 + i * 0.35, 0, 0.9]} t={t} ph={i * 1.3} s={1.2} />
    ))}
    <UFO p={[1.6 + ufoHit * 0.3 * Math.sin(t * 30), 3.0, -2.5]} r={[0.2 + ufoHit * 0.3, 0, ufoHit * 0.4]} s={0.8} t={t} />
    {knife >= 0 && <Faca p={[lerp(-0.6, 1.6, knife), lerp(1.2, 3.0, knife), lerp(0.4, -2.5, knife)]} r={[0, 0, knife * 12]} s={2.0} />}
  </group>
);
const B4: React.FC<ShotProps> = ({f, a, t}) => {
  const knife = f >= FACA5 ? clamp((f - FACA5) / (ACERTA5 - FACA5 + 6)) : -1;
  const hit = f >= ACERTA5 + 6 ? 1 : 0;
  return (
    <>
      <Cam pos={knife >= 0 ? [0, 1.6, 5.6] : [0, 1.3, 4.6]} look={knife >= 0 ? [0.4, 1.6, -0.8] : [0, 0.8, 0]} fov={56} f={f} a={knife >= 0 ? FACA5 : a} />
      <MoonParty f={f} t={t} knife={knife} ufoHit={hit} />
      <PBoy id="b4" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, 0, 1.3], rotY: 0.4, eyeWide: fr >= FACA5 ? 1 : 0.5, smile: fr < FACA5 ? 1 : 0, mouthOpen: fr >= FACA5 ? 0.5 : 0, ...(fr >= FACA5 && fr < FACA5 + 10 ? {rShoulder: [-2.4, 0.3, -0.3], rElbow: -0.2} : {})})} />
    </>
  );
};
/* 6–7 — o ET chama a mãe planeta; a Lua vira montanha-russa */
const B6: React.FC<ShotProps> = ({f, a, t}) => {
  const planet = f >= PLANETA6 - 4;
  const ride = f >= MONTANHA7 - 6 ? Math.sin(t * 3) * 0.35 : 0;
  const pk = planet ? easeOut(clamp((f - PLANETA6 + 4) / 20)) : 0;
  return (
    <>
      <Cam pos={planet ? [0, 2.2, 8.5] : [0.8, 1.3, 3.4]} look={planet ? [0, 3.0, -4] : [1.0, 1.0, 0.8]} fov={planet ? 60 : 50} f={f} a={planet ? PLANETA6 - 4 : a} />
      <MoonParty f={f} t={t} ufoHit={1} alienMad tilt={ride} />
      {planet && <PlanetMom p={[0, 5.2 - (f >= MONTANHA7 ? clamp((f - MONTANHA7) / 60) * 1.0 : 0), -9]} s={3.2 * pk} t={t} />}
      <PBoy id="b6" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, Math.abs(ride) * 0.6, 1.3], rotY: 0.4, eyeWide: 1, mouthOpen: 0.5, brow: 1, ...(fr >= MONTANHA7 ? ARMS_UP : {})})} />
    </>
  );
};
/* 8 — universo confeitado */
const B8: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 50);
  return (
    <>
      <Cam pos={[0, 0.5, 7]} look={[0, 0.5, 0]} fov={56} f={f} a={f >= UNIVERSO8 ? UNIVERSO8 : a} />
      <Space t={t} />
      <hemisphereLight args={["#ffffff", "#3a3a5a", 1.0]} />
      <ChantillyGalaxy p={[0, 1.0, -1]} s={1.6} t={t} k={0.3 + k * 0.7} />
      <BoloChar p={[0, -0.6, 1.2]} rotY={0} s={0.9} t={t} hat arms={1} mouth={0.5} />
    </>
  );
};
/* 9 — a rodinha quebra e todos caem pelo portal */
const B9: React.FC<ShotProps> = ({f, a, t}) => {
  const fall = f >= PORTAL9 - 6 ? clamp((f - PORTAL9 + 6) / 30) : 0;
  return (
    <>
      <Cam pos={[0, 1.8, 5.2]} look={[0, 0.3, 0]} fov={56} f={f} a={a} />
      <Space t={t} />
      <hemisphereLight args={["#ffffff", "#3a3a5a", 1.0]} />
      <pointLight position={[2, 4, 3]} intensity={12} distance={14} />
      <Portal p={[0, -1.6, -0.5]} r={[-1.2, 0, 0]} s={1.6} t={t} />
      <group position={[0, -fall * 2.2, 0]} rotation={[fall * 2, t * (f >= QUEBRA9 ? 3 : 0.3), 0]} scale={1 - fall * 0.7}>
        <HamsterShip p={[0, 0, 0]} s={1.0} t={f >= QUEBRA9 ? tf(f - QUEBRA9) : t} run={3} broken={f >= QUEBRA9 ? 1 : 0} />
        <Toy look={BOY} pose={{...idle(f), pos: [-0.45, 0.25, 0.1], rotY: 0.4, sit: 1, eyeWide: 1, mouthOpen: 0.6, ...ARMS_UP} as Pose} />
        <BoloChar p={[0.6, 0.25, 0.4]} s={0.4} t={t} hat mouth={0.6} arms={1} />
      </group>
    </>
  );
};
/* 10–12 — o bolo famoso, a mãe come tudo, parabéns */
const B10: React.FC<ShotProps> = ({f, a, t}) => {
  const mom = f >= MAE11 - 4;
  const bite = f >= MORDIDA11 ? clamp((f - MORDIDA11) / 8) : 0;
  return (
    <>
      <Cam pos={[0.1, 1.6, 3.6]} look={[0.1, 1.1, -0.6]} fov={52} f={f} a={mom ? MAE11 - 4 : a} />
      <Kitchen t={t} />
      {bite < 1 && <BoloChar p={[lerp(0.1, 0.55, bite), 0.76 + bite * 0.75, lerp(TABLE[2], TABLE[2] + 0.3, bite)]} s={0.45 * (1 - bite)} t={t} shades={f >= FAMOSO10} arms={f >= AUTOGRAFO10 && !mom ? 1 : 0} blink={blinkCurve(f)} mouth={mom && bite === 0 ? 0.6 : 0} />}
      {mom && <PBoy id="b10m" a={MAE11 - 4} f={f} look={MAE} pose={(fr) => ({...idle(fr), pos: [lerp(2.4, 0.75, easeOut(clamp((fr - MAE11 + 4) / 18))), 0, -0.3], rotY: -1.0, walk: tf(fr) * 9, walkAmt: fr < MAE11 + 14 ? 1 : 0, mouthOpen: fr >= MORDIDA11 - 4 && fr < MORDIDA11 + 10 ? 0.9 : 0, smile: fr >= MORDIDA11 + 10 ? 1 : 0, torso: [fr >= MORDIDA11 - 4 && fr < MORDIDA11 + 8 ? 0.3 : 0, 0, 0]})} />}
      <PBoy id="b10" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.75, 0, -0.1], rotY: 0.6, eyeWide: fr >= MORDIDA11 ? 1 : 0.5, mouthOpen: fr >= MORDIDA11 ? 0.7 : 0, brow: fr >= MORDIDA11 ? 1 : 0, ...(fr >= MORDIDA11 ? {rShoulder: [-0.5, 0, -0.9], rElbow: -2.1, lShoulder: [-0.5, 0, 0.9], lElbow: -2.1} : fr >= AUTOGRAFO10 ? {lShoulder: [-1.3, -0.4, 0.2], lElbow: -0.6} : {})})} />
    </>
  );
};
/* 13 — bolo novinho, olha a Lua, arruma a malinha… e volta pro começo */
const B13: React.FC<ShotProps> = ({f, a, b, t}) => {
  const bag = f >= MALINHA13 ? easeOut(clamp((f - MALINHA13) / 10)) : 0;
  const k = f >= MALINHA13 + 8 ? clamp((f - MALINHA13 - 8) / Math.max(1, b - (MALINHA13 + 8))) : 0;
  const look = f >= JANELA13 ? 0.7 : 0;
  return (
    <>
      <Cam pos={[0.1, 1.55, 3.4]} look={[0.2, 1.25, -1.0]} fov={52} f={f} a={-99} />
      <Kitchen t={t} />
      {f >= NOVINHO13 - 6 && <BoloChar p={k > 0 ? ESCAPE(k) : [0.25, 0.76, TABLE[2]]} rotY={-0.4 * Math.min(1, k * 4) + 0} look={look} s={0.45 * easeOut(clamp((f - NOVINHO13 + 6) / 10))} t={t} suitcase={bag} hop={k > 0 ? 1 : 0} blink={blinkCurve(f)} />}
      <PBoy id="b13m" a={a} f={f} look={MAE} pose={(fr) => ({...idle(fr), pos: [lerp(0.75, 3.4, clamp((fr - NOVINHO13) / 40)), 0, -0.2], rotY: fr < NOVINHO13 + 6 ? -1.0 : 1.4, walk: tf(fr) * 9, walkAmt: fr >= NOVINHO13 && fr < NOVINHO13 + 40 ? 1 : 0, smile: 1})} />
      <PBoy id="b13" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.8, 0, -0.1], rotY: 0.6, eyeWide: fr >= MALINHA13 ? 1 : 0.5, mouthOpen: fr >= MALINHA13 ? 0.4 : 0, brow: fr >= MALINHA13 ? 1 : 0, ...(fr >= MALINHA13 + 8 ? {lShoulder: [-1.6, -0.3, 0.3], lElbow: -0.1, rShoulder: [-1.6, 0.3, 0], rElbow: -0.1} : {})})} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: B0},
  {from: L(1), Comp: B1},
  {from: L(2), Comp: B2},
  {from: L(4), Comp: B4},
  {from: L(6), Comp: B6},
  {from: L(8), Comp: B8},
  {from: L(9), Comp: B9},
  {from: L(10), Comp: B10},
  {from: L(13), Comp: B13},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_BOLO2} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["bolo", "lua", "geladeira", "portal", "nave", "hamster", "re", "motor", "roedoristico", "festa", "aniversario", "astronautas", "et", "ovos", "fugitivos", "faca", "voando", "disco", "voador", "bravo", "mae", "planeta", "montanha-russa", "chantilly", "via", "lactea", "doce", "universo", "confeitado", "rodinha", "quebra", "cozinha", "famoso", "autografo", "mordida", "sobremesa", "parabens", "seguir", "segunda-feira", "novinho", "janela", "malinha"]);
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
  [L(3), L(4), ["MOTOR", "ROEDORÍSTICO"]],
  [UNIVERSO8, L(9), ["UNIVERSO", "CONFEITADO"]],
];
const FOLLOW_FROM = SEGUIR12 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 36;
export const VideoBolo2: React.FC = () => {
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
      <Ono from={PORTAL1} to={L(2) - 2} text="VUUUSH!" size={140} color="#c86bfa" />
      <Tag from={FESTA4} to={FACA5 - 3} text="FESTA DO BOLO 🎂" y={330} />
      <Ono from={ACERTA5 + 6} to={L(6) - 2} text="PLÉIM!" size={140} color="#ffd21f" />
      <Bubble from={MAE6} to={PLANETA6 + 6} text="MAAAÃE!" x={700} y={620} size={60} />
      <Ono from={MONTANHA7} to={L(8) - 2} text="UHUUUL!" size={130} color="#ffffff" />
      <Ono from={QUEBRA9} to={PORTAL9 - 2} text="CRACK!" size={140} color="#ff8a1f" />
      <Bubble from={AUTOGRAFO10} to={MAE11 - 3} text="SEM FOTOS! 😎" x={540} y={560} size={54} />
      <Ono from={MORDIDA11} to={L(12) - 2} text="NHAC!" size={170} color="#ffd21f" />
      <Confetti from={L(12)} to={L(12) + 50} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={L(13) - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozbolo2.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 2} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx3/portal.mp3" from={PORTAL1} dur={50} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={FESTA4} dur={40} v={FXV * 0.3} />
      <SND src="sfx10/bonk.mp3" from={ACERTA5 + 6} dur={20} v={FXV * 0.4} />
      <SND src="sfx3/crack.mp3" from={QUEBRA9} dur={20} v={FXV * 0.4} />
      <SND src="sfx3/portal.mp3" from={PORTAL9} dur={40} v={FXV * 0.3} />
      <SND src="sfx7/pof.mp3" from={MORDIDA11} dur={20} v={FXV * 0.5} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
