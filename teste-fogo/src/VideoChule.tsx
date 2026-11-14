import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {physics} from "./Physics";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Town, V3, groundY, groundAng} from "./Sets5";
import {Dino} from "./Sets7";
import {Puff, WeddingPigeon, GROOM, Church, CHURCH_PLAT, Hall, HallParty, PARTY} from "./Sets10";
import {Shades, PartyLights} from "./Sets11";
import {Octopus, CarRobot, DAD, DadHead, Phone} from "./Sets12";
import {Sneaker, SneakerP, Chinelo, Chule, ChuleP, SunFace, Backyard, SkyDome, SILL, Perfume, Mist, TalentStage, STAGE, Plaque, Trophy, MoneyPile, MoneyRain, Bill, Skate, FireTruck, WaterJet, Rain, Umbrella, FireHelmet, NoseClip, WeatherStudio, Runway, ShoeStore, ShoeBox} from "./Sets13";
import {Captions, StageTitle, Chip, Sparkles, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut} from "./util";
import W from "./timingChule.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
/** termina logo depois do "chulé." pra emendar no começo (loop) */
export const TOTAL_CHULE = F(words[words.length - 1].e + 0.35);

/* ---------- visuais do boneco ---------- */
const SOCKS: ToyLook = {hoodie: true, socks: "#ffffff"};
const SUIT: ToyLook = {...GROOM};
const SUIT_SOCKS: ToyLook = {...GROOM, socks: "#ffffff"};
const SUIT_GOLD: ToyLook = {...GROOM, shoe: "#ffd21f", sole: "#ffffff"};
const DAD1: ToyLook = {...DAD, bareR: true};
const PEOPLE: ToyLook[] = [
  {shirt: "#ff6fb1", pants: "#2b2e3b", hairStyle: "ponytail", hair: "#5a2a14", lashes: true, lips: "#d4486a", shoe: "#ffffff", sole: "#ff6fb1"},
  {shirt: "#2ecc71", pants: "#f4f4f2", hairStyle: "curly", hair: "#1a1a1a", skin: "#a8714a", shoe: "#2e86de", sole: "#ffffff"},
  {shirt: "#3a86ff", pants: "#3a3d48", hairStyle: "spiky", hair: "#3b2416", skin: "#e0b088"},
  {shirt: "#ffd21f", pants: "#6b5b45", hairStyle: "bun", hair: "#2a1a10", lashes: true, lips: "#c0392b", skin: "#c98f62"},
  {shirt: "#c39bd3", pants: "#1d1f27", hairStyle: "buzz", hair: "#1a1a1a", skin: "#8d5a3b"},
];
const CLIPS = ["#ff4d6d", "#3a86ff", "#2ecc71", "#ffd21f", "#ff8a1f"];
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const mix = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/* poses de braço */
const OFFER: Pose = {rShoulder: [-1.28, 0.98, 0.1], rElbow: -0.47};
const PINCH_L: Pose = {lShoulder: [-1.407, -0.734, -0.259], lElbow: -1.339};
const PHONE_EAR: Pose = {rShoulder: [-1.654, 0.385, -0.484], rElbow: -1.914};
const CROSSED: Pose = {rShoulder: [-1.15, 0, 0.6], rElbow: -1.45, lShoulder: [-1.05, 0, -0.6], lElbow: -1.45};
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const HANDS_CHEST: Pose = {rShoulder: [-0.9, 0, 0.55], rElbow: -1.7, lShoulder: [-0.9, 0, -0.55], lElbow: -1.7};
const dancePose = (t: number, ph = 0): Pose => ({
  rShoulder: [-2.4 - 0.4 * Math.sin(t * 6 + ph), 0, -0.3], rElbow: -0.5,
  lShoulder: [-0.6 + 0.5 * Math.sin(t * 6 + ph), 0, 0.3], lElbow: -1.2,
  torso: [0, 0, 0.12 * Math.sin(t * 6 + ph)], head: [0, 0.2 * Math.sin(t * 3 + ph), 0.1 * Math.sin(t * 6 + ph)],
  squash: 0.06 * Math.abs(Math.sin(t * 6 + ph)), smile: 1, mouthOpen: 0.3,
});

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 500;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};
const InHand: React.FC<{palm: React.RefObject<THREE.Object3D | null>; children: React.ReactNode}> = ({palm, children}) => {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.matrixWorld.decompose(g.current.position, g.current.quaternion, g.current.scale);
  }, -1);
  return <group ref={g}>{children}</group>;
};
/** personagem que desmaia: cai pra trás em volta dos pés (k = 0..1) */
const Faint: React.FC<{pos: V3; rotY: number; k: number; children: React.ReactNode; side?: boolean}> = ({pos, rotY, k, children, side = false}) => {
  const e = easeInOut(clamp(k));
  return (
    <group position={[pos[0], pos[1] + 0.13 * e, pos[2]]} rotation={[0, rotY, 0]}>
      <group rotation={side ? [0, 0, 1.5 * e] : [-1.5 * e, 0, 0]}>{children}</group>
    </group>
  );
};

/* ---------- ambientes ---------- */
const YardScene: React.FC<{t: number; night?: number; target?: V3}> = ({t, night = 0, target = [-1, 1, -2]}) => (
  <>
    <SkyDome night={night} t={t} />
    <hemisphereLight args={[new THREE.Color("#d6ecff").lerp(new THREE.Color("#5a64b0"), night), new THREE.Color("#a08a5e").lerp(new THREE.Color("#1a1a2a"), night), lerp(1.2, 0.55, night)]} />
    <SunLight target={target} dir={[5, 10, 7]} intensity={lerp(2.6, 0.5, night)} color={night > 0.5 ? "#9fb4ff" : "#fff1d6"} ext={7} />
    {night > 0.01 && <pointLight position={[-1.5, 2.0, -2.2]} intensity={7 * night} distance={6} decay={1.6} color="#ffd9a0" />}
    <Backyard t={t} night={night} />
  </>
);
const SUN0: V3 = [-4, 15, -62];
const PairOnSill: React.FC<{alive?: SneakerP; only?: boolean; backRot?: number}> = ({alive, only = false, backRot = Math.PI / 2 - 0.25}) => (
  <>
    {!only && <Sneaker p={[SILL[0], SILL[1], SILL[2] - 0.25]} r={[0, backRot, 0]} s={0.36} />}
    <Sneaker p={[SILL[0], SILL[1], SILL[2] + 0.25]} r={[0, alive && (alive.alive ?? 0) > 0 ? Math.PI / 2 + 0.55 : Math.PI / 2 - 0.15, 0]} s={0.36} c={alive} />
  </>
);
const StreetScene: React.FC<{t: number; target: V3; ext?: number; tint?: number}> = ({t, target, ext = 9, tint = 0}) => (
  <>
    <Sky top={tint > 0.5 ? "#7fae6a" : "#3d97e6"} bottom={tint > 0.5 ? "#d8ecb0" : "#cfefff"} />
    <fog attach="fog" args={[tint > 0.5 ? "#d8ecb0" : "#cdeeff", 30, 130]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={target} dir={[-6, 10, 7]} intensity={2.6} ext={ext} />
    <Town t={t} galo={false} />
  </>
);

/* =================== 1 — o sol desmaia (eclipse podálico) =================== */
const PRIMEIRO = at(0, "primeiro");
const SO = at(0, "so");
const DESMAIA = at(0, "desmaia");
const ANOITECE = at(0, "anoitece");
const nightK = (f: number) => easeInOut(ramp(f, ANOITECE - 4, ANOITECE + 16));
const BOY0: V3 = [-0.55, 0, -0.85];
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const boy = physics("b0" + a, (fr) => ({...idle(fr), pos: BOY0, rotY: 0.35, ...OFFER, rShoulder: [-1.2, 0.9, 0.1], ...PINCH_L, brow: 0.7, blink: 0.45, mouthOpen: 0.15, head: [0.05, 0.25, -0.12], torso: [-0.12, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[0.35, 1.55, 2.5]} look={[-0.75, 1.3, -1.2]} fov={48} f={f} a={a} />
      <YardScene t={t} />
      <Toy pose={boy} look={SOCKS} palmRef={palm} />
      <InHand palm={palm}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <Sneaker p={[-0.07, -0.2, 0.0]} r={[0, 0.15, 0.05]} s={0.36} />
          <Sneaker p={[0.08, -0.21, -0.02]} r={[0, -0.15, -0.05]} s={0.36} />
        </group>
      </InHand>
      <Chule c={{pos: [BOY0[0] - 0.55, 1.75 + 0.15 * Math.sin(t), BOY0[2] + 0.55], s: 0.28, t, smile: 1, look: [0.6, 0]}} />
    </>
  );
};
/* "...primeiro você precisa colocar ele no sol pra arejar." */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const put = ramp(f, a + 2, a + 14);
  const boy = physics("b1" + a, (fr) => {
    const p = ramp(fr, a + 2, a + 14) * (1 - ramp(fr, a + 20, a + 30));
    return {...idle(fr), pos: [-1.2, 0, -1.7], rotY: -Math.PI / 2 + 0.35, rShoulder: [lerp(-0.3, -1.6, p), 0, 0.1], rElbow: lerp(-0.3, -0.25, p), lShoulder: [lerp(-0.3, -1.6, p), 0, -0.1], lElbow: lerp(-0.3, -0.25, p), brow: 0.4, smile: 0.5 * ramp(fr, a + 20, a + 30), head: [0, 0.4 * ramp(fr, a + 24, a + 34), -0.1]};
  }, a, f);
  return (
    <>
      <Cam pos={[0.9, 1.65, 1.5]} look={[-1.9, 1.5, -2.3]} fov={50} f={f} a={a} />
      <YardScene t={t} />
      <PairOnSill />
      <Toy pose={boy} look={SOCKS} />
      <Chule c={{pos: [-1.95, lerp(1.55, 1.85, put), -2.0], s: 0.3, t, smile: 1, look: [0.6, 0.4]}} />
    </>
  );
};
/* "Só que o chulé é tão forte... que o sol desmaia" — o chulé sobe até o sol */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeInOut(clamp((f - a) / 50));
  const sniff = ramp(f, at(0, "forte") - 4, at(0, "forte") + 6);
  return (
    <>
      <Cam pos={[-0.4, 1.25, 1.2]} look={[-3.0, 9.5, -60]} fov={52} f={f} a={a} />
      <YardScene t={t} />
      <PairOnSill />
      <SunFace p={SUN0} r={6} t={t} sniff={sniff} green={0.4 * sniff} />
      <Chule c={{pos: mix([-1.95, 1.9, -2.0], [-1.2, 4.2, -6.5], k), s: lerp(0.3, 0.55, k), t, smile: 1, look: [0, 1]}} />
    </>
  );
};
/* "...o sol desmaia... e anoitece ao meio-dia." */
const sunFall = (f: number) => easeInOut(ramp(f, DESMAIA + 6, DESMAIA + 26));
const SunFainted: React.FC<{f: number; t: number}> = ({f, t}) => {
  const fall = sunFall(f);
  return (
    <group position={[SUN0[0] + 3 * fall, SUN0[1] - 5.5 * fall, SUN0[2]]} rotation={[0, 0, -0.7 * fall]}>
      <SunFace p={[0, 0, 0]} r={6} t={t} faint={f >= DESMAIA + 2 ? 1 : 0} green={lerp(0.4, 0.9, ramp(f, DESMAIA - 4, DESMAIA + 4))} />
    </group>
  );
};
const S3: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.2, 1.5, 1.8]} look={[-3.0, 8.0, -60]} fov={54} f={f} a={a} />
    <YardScene t={t} night={nightK(f)} />
    <PairOnSill />
    <SunFainted f={f} t={t} />
    <Chule c={{pos: [-1.2, 4.2, -6.5], s: 0.55, t, mouth: 0.4 * ramp(f, DESMAIA, DESMAIA + 6), wide: 1, look: [0, 0.6]}} />
  </>
);
/* título: ECLIPSE PODÁLICO — o sol desmaiado atrás do morro, o chulé dando risadinha */
const S4: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.7, 2.2]} look={[-2.4, 4.6, -40]} fov={54} f={f} a={a} />
    <YardScene t={t} night={1} />
    <PairOnSill />
    <SunFainted f={f} t={t} />
    <Chule c={{pos: [-0.6, 2.4, -2.4], s: 0.5, t, mouth: 0.3 + 0.3 * Math.abs(Math.sin(t * 10)), blink: 0.6, look: [0.5, 0], blush: 0.5}} />
  </>
);

/* =================== 2 — perfume e ópera (chulé lírico) =================== */
const PERF = at(2, "perfume");
const E2 = at(2, "e", 0);
const OPERA = at(2, "cantar");
const pinkK = (f: number) => ramp(f, at(2, "cheiroso") - 6, at(2, "cheiroso") + 10);
const BOY5: V3 = [-1.25, 0, -1.95];
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pour = ramp(f, PERF - 10, PERF);
  const boy = physics("b5" + a, (fr) => ({...idle(fr), pos: BOY5, rotY: -Math.PI / 2 + 0.25, rShoulder: [-2.0, 0, 0.15], rElbow: -0.2, ...PINCH_L, smile: 0.4, brow: 0.3, head: [0.3, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[-0.9, 1.75, 1.3]} look={[-1.8, 1.55, -2.1]} fov={50} f={f} a={a} />
      <YardScene t={t} night={1} />
      <PairOnSill />
      <Toy pose={boy} look={SOCKS} palmRef={palm} />
      <InHand palm={palm}>
        <group rotation={[0, 0, Math.PI * 0.85 * pour]}>
          <Perfume p={[0, -0.05, 0.05]} s={0.8} level={1 - 0.8 * ramp(f, PERF, E2)} />
        </group>
      </InHand>
      <WaterJet a={[-1.85, 1.75, -2.15]} b={[-1.95, 1.4, -2.2]} k={ramp(f, PERF - 2, PERF + 4) * (1 - ramp(f, E2 - 6, E2))} t={t} arc={0} color="#ff5fb0" size={0.6} />
      <Mist p={[SILL[0], SILL[1] + 0.15, SILL[2]]} dir={[0.4, 0.8, 0.2]} k={ramp(f, PERF, PERF + 8)} t={t} />
      <Chule c={{pos: [-1.75, 2.35, -2.0], s: 0.42, t, wide: 1, look: [0.4, -0.5], pink: 0.3 * ramp(f, PERF, E2)}} />
    </>
  );
};
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const pk = pinkK(f);
  const sing = f >= OPERA ? 0.4 + 0.5 * Math.abs(Math.sin(t * 5)) : 0;
  return (
    <>
      <Cam pos={[-0.35, 2.15, 0.7]} look={[-1.75, 2.2, -2.0]} fov={46} f={f} a={a} punch={4} />
      <YardScene t={t} night={1} />
      <PairOnSill />
      <Mist p={[SILL[0], SILL[1] + 0.15, SILL[2]]} dir={[0.4, 0.8, 0.2]} k={1 - ramp(f, a + 20, a + 40)} t={t} />
      <Chule c={{pos: [-1.75, 2.3, -2.0], s: 0.55, t, pink: pk, mustache: ramp(f, OPERA - 8, OPERA), arms: f >= OPERA - 4 ? "opera" : "down", mouth: sing, smile: 1, blink: f >= OPERA ? 0.5 : blinkCurve(f), look: [0.5, 0.2]}} />
    </>
  );
};
/* título: CHULÉ LÍRICO — cantando, o menino emocionado */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b7" + a, (fr) => ({...idle(fr), pos: [-0.6, 0, -1.0], rotY: -2.29, ...HANDS_CHEST, smile: 0.8, brow: 0.8, blink: 0.4, head: [-0.2, 0, 0.12]}), a, f);
  return (
    <>
      <Cam pos={[-1.8, 2.0, -3.9]} look={[-0.6, 1.95, -0.6]} fov={54} f={f} a={a} />
      <YardScene t={t} night={1} />
      <PairOnSill />
      <Chule c={{pos: [-0.95, 2.2, -1.45], s: 0.5, t, pink: 1, mustache: 1, arms: "opera", mouth: 0.4 + 0.5 * Math.abs(Math.sin(t * 5)), blink: 0.5, rotY: Math.PI * 0.85}} />
      <Toy pose={boy} look={SOCKS} />
    </>
  );
};

/* =================== 3 — show de talentos (empresário olfativo) =================== */
const GANHA = at(4, "ganha");
const FICA4 = at(4, "fica");
const E4 = at(4, "e", 0);
const CH_STAGE: V3 = [0, STAGE.top + 0.75, STAGE.z + 0.1];
const ShowScene: React.FC<{t: number; lights?: number}> = ({t, lights = 1}) => (
  <>
    <hemisphereLight args={["#c9b8ff", "#2a1a40", 0.7]} />
    <pointLight position={[0, 4.2, 0.5]} intensity={22} distance={16} decay={1.4} color="#fff0e0" castShadow shadow-mapSize={[1024, 1024]} />
    <pointLight position={[0, 2.5, -2.0]} intensity={8} distance={7} decay={1.6} color="#ff9ccf" />
    <TalentStage t={t} lights={lights} />
  </>
);
const JX = {pig: -1.2, oct: 0.05, rob: 1.25};
const Judges: React.FC<{f: number; t: number; facing?: number; plaques?: number}> = ({f, t, facing = Math.PI, plaques = 0}) => (
  <>
    <WeddingPigeon p={{pos: [JX.pig, 0.45, 2.75], rotY: facing, t, blink: blinkCurve(f + 3), chest: plaques, flap: plaques > 0.5 ? 0.4 : 0}} s={3.0} />
    <Octopus o={{pos: [JX.oct, 0, 2.85], rotY: facing, t, shades: true, s: 0.78, mouth: 0.4 * plaques, wrench: false, thumbs: plaques}} />
    <CarRobot p={[JX.rob, 0.15, 2.85]} rotY={facing} t={t} s={0.33} mic={false} dance={0.5 * plaques} mouth={0.4 * plaques} />
    {plaques > 0.01 &&
      [JX.pig, JX.oct, JX.rob].map((x, i) => <Plaque key={i} p={[x + 0.25, lerp(0.4, 1.05, plaques) + 0.04 * Math.sin(t * 6 + i), 2.05]} r={[0, facing, 0.1 * Math.sin(t * 4 + i)]} s={1.3} />)}
  </>
);
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 2.6, 4.8]} look={[0, 1.5, -3.0]} fov={50} f={f} a={a} />
    <ShowScene t={t} />
    <Chule c={{pos: CH_STAGE, s: 0.8, t, pink: 1, mustache: 1, arms: "mic", mouth: 0.35 + 0.5 * Math.abs(Math.sin(t * 5)), blink: 0.4}} />
    <Judges f={f} t={t} />
  </>
);
/* "...ganha..." — os jurados levantam o 10 */
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.0, 1.45, -1.0]} look={[0.0, 1.0, 2.6]} fov={64} f={f} a={a} punch={4} />
    <ShowScene t={t} lights={0.3} />
    <Judges f={f} t={t} plaques={backOut(ramp(f, a + 1, a + 10))} />
  </>
);
/* "...fica famoso..." — troféu e flashes */
const S10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.6, 1.75, 2.4]} look={[0, 1.4, -2.8]} fov={46} f={f} a={a} />
    <ShowScene t={t} lights={0.3} />
    <Chule c={{pos: CH_STAGE, s: 0.8, t, pink: 1, mustache: 1, arms: "up", smile: 1, mouth: 0.5, blink: 0.5}} />
    <Trophy p={[CH_STAGE[0] + 0.5, CH_STAGE[1] + 0.48, CH_STAGE[2] + 0.1]} s={1.4} />
    <Judges f={f} t={t} plaques={1} />
  </>
);
/* "...e você vira empresário do seu próprio chulé." — terno, óculos e celular */
const BOY11: V3 = [2.75, 0, -0.9];
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const boy = physics("b11" + a, (fr) => ({...idle(fr), pos: BOY11, rotY: -0.5, ...PHONE_EAR, smile: 1, brow: -0.3, mouthOpen: 0.2 + 0.2 * Math.abs(Math.sin(fr / 2.3)), head: [0, -0.2, 0.08]}), a, f);
  return (
    <>
      <Cam pos={[2.2, 1.75, 1.6]} look={[2.5, 1.6, -0.9]} fov={46} f={f} a={a} punch={4} />
      <ShowScene t={t} />
      <Chule c={{pos: CH_STAGE, s: 0.8, t, pink: 1, mustache: 1, arms: "up", smile: 1, blink: 0.5}} />
      <Toy pose={boy} look={SUIT} palmRef={palm} headExtra={<Shades />} />
      <InHand palm={palm}>
        <Phone p={[0, -0.03, 0.04]} s={1.3} t={t} />
      </InHand>
    </>
  );
};
/* título: EMPRESÁRIO OLFATIVO — contando dinheiro; o chulé dando autógrafo */
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const boy = physics("b12" + a, (fr) => ({...idle(fr), pos: [-1.0, 0, -0.75], rotY: 0.35, rShoulder: [-0.9 - 0.15 * Math.sin((fr / FPS) * 14), 0, 0.3], rElbow: -1.0, lShoulder: [-0.8, 0, -0.3], lElbow: -1.2, smile: 1, brow: -0.2, pupil: [0, -1]}), a, f);
  return (
    <>
      <Cam pos={[-0.1, 1.8, 4.4]} look={[0, 1.3, -1.4]} fov={56} f={f} a={a} />
      <ShowScene t={t} />
      <MoneyPile p={[-1.75, STAGE.top, -1.95]} s={0.55} />
      <Toy pose={boy} look={SUIT} palmRef={palm} headExtra={<Shades />} />
      <InHand palm={palm}>
        <Bill p={[0, -0.02, 0.06]} r={[0, 0, 0.3]} s={1.2} />
      </InHand>
      <Chule c={{pos: [0.75, 1.55, -1.75], s: 0.6, t, pink: 1, mustache: 1, arms: "sign", smile: 1, blink: 0.5, look: [0.8, -0.6]}} />
      <Toy pose={{...idle(f + 40), pos: [1.55, 0, -0.65], rotY: -0.9, rShoulder: [-1.3, 0, 0.1], rElbow: -0.5, smile: 1, eyeWide: 0.6}} look={PEOPLE[0]} />
      <mesh position={[1.12, 1.3, -1.15]} rotation={[0, -0.9, 0.1]}>
        <planeGeometry args={[0.22, 0.3]} />
        <meshStandardMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>
    </>
  );
};

/* =================== 4 — o tênis com ciúme (ciúme de cadarço) =================== */
const TENIS6 = at(6, "tenis");
const ALIVE = TENIS6 + 2; // o tênis ganha vida
const aliveK = (f: number) => backOut(ramp(f, ALIVE, ALIVE + 10));
const E6 = at(6, "e", 0);
const FOGE = at(6, "foge");
/** cartaz do chulé famoso na parede */
const PosterChule: React.FC<{t: number}> = ({t}) => (
  <group position={[-2.09, 1.85, -3.25]} rotation={[0, Math.PI / 2, 0]}>
    <mesh>
      <planeGeometry args={[0.85, 1.1]} />
      <meshStandardMaterial color="#1a1050" />
    </mesh>
    <Chule c={{pos: [0, 0.12, 0.03], s: 0.3, t, pink: 1, mustache: 1, smile: 1, arms: "up"}} />
    <mesh position={[0, -0.4, 0.01]}>
      <planeGeometry args={[0.7, 0.16]} />
      <meshStandardMaterial color="#ffd21f" />
    </mesh>
  </group>
);
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const k = aliveK(f);
  const jealous = ramp(f, at(6, "ciume") - 6, at(6, "ciume") + 4);
  return (
    <>
      <Cam pos={[-1.0, 1.65, -0.9]} look={[-2.0, 1.5, -2.4]} fov={46} f={f} a={a} />
      <YardScene t={t} />
      <SunFace p={[6, 20, -70]} r={5} t={t} band />
      <PosterChule t={t} />
      <PairOnSill backRot={-Math.PI / 2 + 0.3} alive={{alive: k, mood: jealous, arms: jealous > 0.5 ? "crossed" : "down", t, blink: blinkCurve(f + 9), look: [jealous > 0.3 ? -0.6 : 0.4, 0.2], wide: k > 0 && jealous < 0.3 ? 1 : 0}} />
    </>
  );
};
/* "...e foge de casa de skate." */
const skX = (f: number) => {
  const tt = (f - E6) / FPS;
  return -6 + 1.2 * tt * tt + 2.5 * tt;
};
const SkaterOnRoad: React.FC<{f: number; t: number; tongue?: number}> = ({f, t, tongue = 0}) => {
  const x = skX(f);
  return (
    <group position={[x, groundY(x), 0.6]} rotation={[0, 0, groundAng(x)]}>
      <group rotation={[0, Math.PI / 2 - 0.45, 0]}>
        <Skate s={1.0} spin={-t * 20} />
        <Sneaker p={[0, 0.17, 0.05]} s={0.62} c={{alive: 1, mood: 0.6 * (1 - tongue), tongue, smile: tongue, arms: tongue > 0.5 ? "up" : "crossed", t, look: [0, 0]}} />
      </group>
    </group>
  );
};
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const x = skX(f);
  return (
    <>
      <Cam pos={[x - 1.4, groundY(x) + 1.2, 4.6]} look={[x + 0.2, groundY(x) + 0.5, 0.6]} fov={46} f={f} a={a} />
      <StreetScene t={t} target={[x, groundY(x), 0]} ext={7} />
      <SkaterOnRoad f={f} t={t} />
    </>
  );
};
/* título: CIÚME DE CADARÇO — no skate, mostrando a língua */
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const x = skX(f);
  return (
    <>
      <Cam pos={[x + 1.6, groundY(x + 1.6) + 1.0, 3.2]} look={[x, groundY(x) + 0.5, 0.6]} fov={48} f={f} a={a} />
      <StreetScene t={t} target={[x, groundY(x), 0]} ext={7} />
      <SkaterOnRoad f={f} t={t} tongue={ramp(f, a + 4, a + 12)} />
    </>
  );
};

/* =================== 5 — o casamento (matrimônio calçadístico) =================== */
const CASANDO = at(8, "casando");
const PAI8 = at(8, "pai");
const ChurchScene: React.FC<{t: number; target: V3}> = ({t, target}) => (
  <>
    <color attach="background" args={["#e6f0ff"]} />
    <hemisphereLight args={["#f2f6ff", "#6a7a9a", 0.95]} />
    <SunLight target={target} dir={[5, 9, 4]} intensity={1.6} ext={7} />
    {[0.5, 5.5, 10.5].map((z) => (
      <pointLight key={z} position={[0, 5.8, z]} intensity={7} distance={12} decay={1.6} color="#fff6e0" />
    ))}
    <pointLight position={[0, 3.5, -3.0]} intensity={5} distance={8} decay={1.6} color="#fff0d8" />
    <Church t={t} theme={{wall: "#e3eeff", vault: "#f0f6ff", carpet: "#1f6fd1", flowers: ["#ffd21f", "#ffffff", "#ffe680"]}} />
  </>
);
const TEN_W: V3 = [-0.5, CHURCH_PLAT, -2.35];
const CHI_W: V3 = [0.5, CHURCH_PLAT, -2.35];
const DAD_W: V3 = [-0.3, 0, 1.2];
const DAD_RY = Math.PI - 0.35;
const Couple: React.FC<{f: number; t: number; kiss?: number}> = ({f, t, kiss = 0}) => (
  <>
    <Sneaker p={[TEN_W[0] + 0.12 * kiss, TEN_W[1], TEN_W[2]]} r={[0, 0.9 - 0.5 * kiss, 0.25 * kiss]} s={0.7} c={{alive: 1, bowtie: true, smile: 1, t, blink: kiss > 0.5 ? 1 : blinkCurve(f + 9), look: [0.6, 0.2]}} />
    <Chinelo p={[CHI_W[0] - 0.08 * kiss, CHI_W[1], CHI_W[2]]} r={[0, -0.35, -0.25 * kiss]} s={0.75} c={{alive: 1, veil: 1, smile: 1, blink: kiss > 0.5 ? 1 : blinkCurve(f + 33), look: [-0.6, 0.2]}} />
  </>
);
const Priest: React.FC<{f: number; t: number; jaw?: number; faint?: number}> = ({f, t, jaw = 0}) => <Dino p={{pos: [0, CHURCH_PLAT, -3.6], rotY: 0, priest: true, t, blink: blinkCurve(f + 41), tail: 0.3, jaw}} s={0.85} />;
const dadCry = (fr: number, a: number): Pose => ({...idle(fr + 13), pos: DAD_W, rotY: DAD_RY, rShoulder: [-1.3, 0, 0.5], rElbow: -1.6, lShoulder: [-0.4, 0, -0.2], lElbow: -0.6, blink: 1, mouthOpen: 0.45 + 0.15 * Math.sin(fr / 2), brow: 0.9, torso: [0, 0, 0.04 * Math.sin(fr / 2.5)], head: [0.1, 0, 0]});
const Tears: React.FC<{p: V3; t: number}> = ({p, t}) => (
  <group position={p}>
    {[-1, 1].map((sd) =>
      [0, 1, 2].map((i) => {
        const q = (t * 1.6 + i / 3 + (sd > 0 ? 0.15 : 0)) % 1;
        return (
          <mesh key={`${sd}${i}`} position={[0.12 * sd + 0.1 * sd * q, -0.6 * q * q, 0.25]} material={new THREE.MeshStandardMaterial({color: "#7fd0ff", roughness: 0.1, transparent: true, opacity: 0.85 * (1 - q)})}>
            <sphereGeometry args={[0.03, 8, 6]} />
          </mesh>
        );
      }),
    )}
  </group>
);
/* "Você encontra o tênis numa igreja..." — o menino entra pela nave */
const S16: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = clamp((f - a) / (b - a));
  const boy = physics("b16" + a, (fr) => ({...idle(fr), pos: [0.15, 0, lerp(6.4, 5.4, clamp((fr - a) / (b - a)))], rotY: Math.PI, walk: (fr / FPS) * 7, walkAmt: 1 - ramp(fr, b - 10, b), head: [0, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[0.6, 2.2, lerp(9.4, 8.8, k)]} look={[0, 1.2, -2.5]} fov={52} f={f} a={a} />
      <ChurchScene t={t} target={[0, 1, 0]} />
      <Couple f={f} t={t} />
      <Priest f={f} t={t} />
      <Toy pose={{...dadCry(f, a)}} look={DAD1} headExtra={<DadHead cap={false} />} />
      <Toy pose={boy} look={SUIT} />
    </>
  );
};
/* "...casando com o chinelo do seu pai." */
const S17: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.1, 0.8]} look={[0, 0.75, -2.4]} fov={52} f={f} a={a} punch={4} />
    <ChurchScene t={t} target={[0, 1, -2]} />
    <Couple f={f} t={t} />
    <Priest f={f} t={t} jaw={0.3 * Math.abs(Math.sin(t * 6))} />
  </>
);
const S18: React.FC<ShotProps> = ({f, a, t}) => {
  const dad = physics("d18" + a, (fr) => dadCry(fr, a), a, f);
  return (
    <>
      <Cam pos={[0.15, 1.1, -1.4]} look={[-0.3, 0.9, 1.2]} fov={58} f={f} a={a} punch={4} />
      <ChurchScene t={t} target={[-2, 1, 0]} />
      <Toy pose={dad} look={DAD1} headExtra={<DadHead cap={false} />} />
      <group position={DAD_W} rotation={[0, DAD_RY, 0]}>
        <Tears p={[0, 1.74, 0.02]} t={t} />
      </group>
      <Couple f={f} t={t} />
    </>
  );
};
/* título: MATRIMÔNIO CALÇADÍSTICO — o "beijo", arroz voando, o pai chorando */
const Rice: React.FC<{c: V3; t: number; k: number}> = ({c, t, k}) => {
  if (k < 0.01) return null;
  return (
    <group position={c}>
      {Array.from({length: 40}, (_, i) => {
        const q = (t * 0.8 + i / 40) % 1;
        return (
          <mesh key={i} position={[Math.sin(i * 2.7) * 1.4, 2.6 - q * 2.6, Math.cos(i * 1.9) * 0.9]} rotation={[i, t * 4 + i, 0]}>
            <boxGeometry args={[0.03, 0.012, 0.012]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        );
      })}
    </group>
  );
};
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const dad = physics("d19" + a, (fr) => dadCry(fr, a), a, f);
  return (
    <>
      <Cam pos={[0.35, 1.25, 0.9]} look={[0, 0.75, -2.35]} fov={50} f={f} a={a} />
      <ChurchScene t={t} target={[0, 1, -1]} />
      <Couple f={f} t={t} kiss={ramp(f, a + 6, a + 16)} />
      <Priest f={f} t={t} />
      <Toy pose={dad} look={DAD1} headExtra={<DadHead cap={false} />} />
      <group position={DAD_W} rotation={[0, DAD_RY, 0]}>
        <Tears p={[0, 1.74, 0.02]} t={t} />
      </group>
      <Rice c={[0, CHURCH_PLAT, -2.3]} t={t} k={1} />
    </>
  );
};

/* =================== 6 — a festa (apagão olfativo) =================== */
const MAS10 = at(10, "mas");
const E10 = at(10, "e", 0);
const DESM = at(10, "desmaia");
const DINO10 = at(10, "dinossauro");
const P = (dx: number, dz: number): V3 => [PARTY[0] + dx, 0, PARTY[2] + dz];
const CH_PARTY: V3 = [PARTY[0], 2.4, PARTY[2] - 0.7];
const HallScene: React.FC<{t: number; target: V3}> = ({t, target}) => (
  <>
    <Sky top="#2a1b6b" bottom="#6a4fb0" />
    <hemisphereLight args={["#fff1dc", "#5a4a6a", 0.95]} />
    <SunLight target={target} dir={[3, 9, 4]} intensity={1.3} ext={8} />
    {[
      [PARTY[0], PARTY[2] + 1.0],
      [PARTY[0] - 3.8, PARTY[2] + 4.0],
      [PARTY[0] + 3.8, PARTY[2] + 4.0],
    ].map(([x, z], i) => (
      <pointLight key={i} position={[x, 4.4, z]} intensity={8} distance={11} decay={1.6} color="#ffe2b0" />
    ))}
    <Hall t={t} wall="#e8f7ee" lowerC="#2e8b57" />
    <HallParty />
    <PartyLights p={[PARTY[0], 4.6, PARTY[2]]} t={t} />
  </>
);
type Guest = {kind: "toy" | "dino" | "pig" | "ten" | "chi"; pos: V3; rotY: number; look?: ToyLook; extra?: React.ReactNode; order: number};
const GUESTS: Guest[] = [
  {kind: "ten", pos: P(-1.25, 0.85), rotY: 0.5, order: 2},
  {kind: "chi", pos: P(-0.65, 1.05), rotY: 0.2, order: 3},
  {kind: "toy", pos: P(1.3, 1.25), rotY: -0.5, look: DAD1, extra: <DadHead cap={false} />, order: 1},
  {kind: "toy", pos: P(-1.9, 2.3), rotY: 0.3, look: SUIT, order: 0},
  {kind: "toy", pos: P(-2.9, 0.9), rotY: 0.8, look: PEOPLE[1], order: 4},
  {kind: "toy", pos: P(2.25, 2.35), rotY: -0.7, look: PEOPLE[3], order: 5},
  {kind: "pig", pos: P(-2.4, -0.6), rotY: 0.9, order: 6},
  {kind: "dino", pos: P(2.5, 0.0), rotY: -0.8, order: 9},
];
const faintAt = (g: Guest) => (g.kind === "dino" ? DINO10 + 2 : DESM - 6 + g.order * 4);
const GuestView: React.FC<{g: Guest; f: number; t: number; dance: number; shock: number}> = ({g, f, t, dance, shock}) => {
  const fk = ramp(f, faintAt(g), faintAt(g) + 9);
  const out = fk > 0.4;
  if (g.kind === "toy")
    return (
      <Faint pos={g.pos} rotY={g.rotY} k={fk}>
        <Toy pose={{...idle(f + g.order * 13), ...(dance > 0.5 && !out ? dancePose(t, g.order) : {}), ...(shock > 0.5 && !out ? {eyeWide: 1, mouthOpen: 0.5, brow: 0.9, ...HANDS_CHEST} : {}), ...(out ? {blink: 1, mouthOpen: 0.3, rShoulder: [-0.4, 0, -0.6], lShoulder: [-0.4, 0, 0.6]} : {})}} look={g.look} headExtra={g.extra} />
      </Faint>
    );
  if (g.kind === "dino")
    return (
      <Faint pos={g.pos} rotY={g.rotY} k={fk}>
        <Dino p={{pos: [0, 0, 0], priest: true, t, blink: out ? 1 : blinkCurve(f + 41), jaw: out ? 0.6 : shock * 0.5, arms: dance > 0.5 && !out ? 0.5 + 0.4 * Math.sin(t * 6) : 0.3 * shock, tail: 0.3}} s={0.8} />
      </Faint>
    );
  if (g.kind === "pig")
    return (
      <Faint pos={g.pos} rotY={g.rotY} k={fk} side>
        <WeddingPigeon p={{pos: [0, 0, 0], t, blink: out ? 1 : blinkCurve(f + 3), flap: dance > 0.5 && !out ? 0.5 : 0, bob: 1}} s={2.6} />
      </Faint>
    );
  if (g.kind === "ten")
    return (
      <Faint pos={g.pos} rotY={g.rotY} k={fk} side>
        <Sneaker s={0.7} c={{alive: 1, bowtie: true, smile: 1, t, blink: out ? 1 : blinkCurve(f + 9), hop: dance > 0.5 && !out ? 1 : 0, wide: shock && !out ? 1 : 0, arms: dance > 0.5 && !out ? "up" : "down"}} />
      </Faint>
    );
  return (
    <Faint pos={g.pos} rotY={g.rotY} k={fk} side>
      <Chinelo s={0.75} c={{alive: 1, veil: 1, smile: 1, blink: out ? 1 : blinkCurve(f + 33)}} />
    </Faint>
  );
};
const StinkWave: React.FC<{f: number; from: number}> = ({f, from}) => {
  const k = (f - from) / 30;
  if (k <= 0 || k >= 1) return null;
  return (
    <mesh position={[CH_PARTY[0], 1.2, CH_PARTY[2]]} rotation={[Math.PI / 2, 0, 0]} scale={0.3 + 6 * k}>
      <torusGeometry args={[1, 0.18, 10, 40]} />
      <meshStandardMaterial color="#8fd14f" transparent opacity={0.55 * (1 - k)} emissive="#8fd14f" emissiveIntensity={0.4} depthWrite={false} />
    </mesh>
  );
};
const partyChule = (f: number, t: number): ChuleP => {
  const fade = ramp(f, MAS10 + 6, at(10, "acaba") + 8);
  const singing = f < at(10, "acaba") + 4;
  return {pos: CH_PARTY, s: 0.7, t, pink: 1 - fade, mustache: 1, arms: singing ? "mic" : "down", mouth: singing ? 0.35 + 0.5 * Math.abs(Math.sin(t * 5)) : 0, wide: fade, smile: singing ? 1 : 0, blink: singing ? 0.4 : 0, blush: f > DINO10 ? 0.8 : 0, sad: f > E10 ? 1 : 0};
};
const S20: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PARTY[0] + 0.3, 2.9, PARTY[2] + 7.4]} look={[PARTY[0], 1.4, PARTY[2] + 0.3]} fov={54} f={f} a={a} />
    <HallScene t={t} target={[PARTY[0], 1, PARTY[2]]} />
    <Chule c={partyChule(f, t)} />
    {GUESTS.map((g, i) => (
      <GuestView key={i} g={g} f={f} t={t} dance={1} shock={0} />
    ))}
  </>
);
const S21: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PARTY[0] + 0.2, 2.45, PARTY[2] + 2.0]} look={[CH_PARTY[0], 2.35, CH_PARTY[2]]} fov={44} f={f} a={a} punch={4} />
    <HallScene t={t} target={[PARTY[0], 1, PARTY[2]]} />
    <Chule c={partyChule(f, t)} />
    {GUESTS.filter((g) => g.kind !== "toy" || g.order !== 0).map((g, i) => (
      <GuestView key={i} g={g} f={f} t={t} dance={0} shock={1} />
    ))}
  </>
);
const S22: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PARTY[0] + 0.4, 2.9, PARTY[2] + 7.6]} look={[PARTY[0], 0.9, PARTY[2] + 0.6]} fov={54} f={f} a={a} />
    <HallScene t={t} target={[PARTY[0], 1, PARTY[2]]} />
    <Chule c={partyChule(f, t)} />
    <StinkWave f={f} from={E10 - 4} />
    {GUESTS.map((g, i) => (
      <GuestView key={i} g={g} f={f} t={t} dance={0} shock={1} />
    ))}
  </>
);
/* título: APAGÃO OLFATIVO — todo mundo no chão, o chulé sem graça */
const S23: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[PARTY[0] - 0.3, 3.6, PARTY[2] + 6.0]} look={[PARTY[0], 0.6, PARTY[2] + 0.8]} fov={54} f={f} a={a} />
    <HallScene t={t} target={[PARTY[0], 1, PARTY[2]]} />
    <Chule c={{...partyChule(DINO10 + 30, t), pos: CH_PARTY, blush: 0.9, sad: 1, smile: 0, mouth: 0, look: [0, -0.8]}} />
    {GUESTS.map((g, i) => (
      <GuestView key={i} g={g} f={DINO10 + 40} t={t} dance={0} shock={1} />
    ))}
  </>
);

/* =================== 7 — bombeiros e chuva (meteorologia podal) =================== */
const FX = -20; // trecho plano da rua
const ELES = at(12, "eles");
const MAS12 = at(12, "mas");
const CRESCE = at(12, "cresce");
const NUVEM = at(12, "nuvem");
const CHOVE = at(12, "e", 0);
const growK = (f: number) => easeInOut(ramp(f, CRESCE - 6, NUVEM + 14));
const streetChule = (f: number, t: number): ChuleP => {
  const g = growK(f);
  return {pos: [FX + 1.0, lerp(3.0, 14.0, g), lerp(0.2, -6, g)], s: lerp(0.85, 9, g), t, smile: g > 0.5 ? 1 : 0, mouth: g > 0.3 && g < 0.95 ? 0.5 : 0, wide: f > ELES && g < 0.3 ? 1 : 0, look: [-0.5, -0.4]};
};
const truckX = (f: number) => lerp(FX - 16, FX - 4.2, easeOut(ramp(f, L(12) - 4, ELES - 4)));
const Firefighters: React.FC<{f: number; t: number; spray: number}> = ({f, t, spray}) => (
  <>
    {[0, 1].map((i) => (
      <Toy key={i} pose={{...idle(f + i * 23), pos: [FX - 2.6 - i * 0.7, 0, 1.6 + i * 0.4], rotY: 1.1, rShoulder: [-1.4, 0.5, 0], rElbow: -0.3, lShoulder: [-1.2, -0.4, 0], lElbow: -0.5, brow: -0.3, mouthOpen: 0.2 * spray}} look={{shirt: "#2b2e3b", pants: "#2b2e3b", shoe: "#15161d", sole: "#15161d", skin: i ? "#a8714a" : "#e0b088"}} headExtra={<FireHelmet />} />
    ))}
    <mesh position={[FX - 2.2, 1.1, 1.65]} rotation={[0, 0, -1.2]}>
      <cylinderGeometry args={[0.05, 0.06, 0.5, 10]} />
      <meshStandardMaterial color="#e3b33b" metalness={0.6} roughness={0.3} />
    </mesh>
    <WaterJet a={[FX - 2.0, 1.2, 1.6]} b={[FX + 0.9, 2.9, 0.3]} k={spray} t={t} arc={0.6} />
  </>
);
const S24: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX - 2.4, 2.4, 10.5]} look={[FX - 1.2, 2.2, 0]} fov={54} f={f} a={a} />
    <StreetScene t={t} target={[FX - 3, 1, 0]} ext={10} />
    <FireTruck p={[truckX(f), 0, -0.4]} rotY={Math.PI / 2} t={t} />
    <Chule c={streetChule(f, t)} />
    {f > ELES - 6 && <Firefighters f={f} t={t} spray={0} />}
  </>
);
const S25: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX - 1.2, 1.9, 7.8]} look={[FX - 0.9, 2.0, 0.6]} fov={56} f={f} a={a} />
    <StreetScene t={t} target={[FX - 1, 1, 0]} ext={8} />
    <FireTruck p={[FX - 4.2, 0, -0.4]} rotY={Math.PI / 2} t={t} />
    <Firefighters f={f} t={t} spray={ramp(f, a + 2, a + 10)} />
    <Chule c={{...streetChule(f, t), wide: 1, mouth: 0.4}} />
  </>
);
const S26: React.FC<ShotProps> = ({f, a, t}) => {
  const g = growK(f);
  return (
    <>
      <Cam pos={[FX - 1.5, 1.6, lerp(9, 18, g)]} look={[FX + 0.5, lerp(3.0, 10.5, g), -2]} fov={56} f={f} a={a} />
      <StreetScene t={t} target={[FX, 1, 0]} ext={12} />
      <FireTruck p={[FX - 4.2, 0, -0.4]} rotY={Math.PI / 2} t={t} />
      <Firefighters f={f} t={t} spray={1 - ramp(f, CRESCE, CRESCE + 20)} />
      <Chule c={streetChule(f, t)} />
    </>
  );
};
const RAIN_PEOPLE: [number, number, number][] = [
  [-2.2, 1.8, 0],
  [-0.4, 2.6, 1],
  [1.6, 1.4, 2],
  [3.0, 2.8, 3],
];
const S27: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.6, 2.6, 11.5]} look={[FX + 0.5, 4.2, 0]} fov={58} f={f} a={a} />
    <StreetScene t={t} target={[FX, 1, 0]} ext={12} tint={1} />
    <Chule c={{...streetChule(NUVEM + 20, t), smile: 1, mouth: 0}} />
    <Rain c={[FX + 0.5, 0, 1]} size={[14, 12, 8]} t={t} k={ramp(f, a, a + 8)} n={320} />
    {RAIN_PEOPLE.map(([x, z, i]) => {
      const run = ((t * 1.6 + i * 0.7) % 4) - 2;
      return (
        <group key={i}>
          <Toy pose={{...idle(f + i * 9), pos: [FX + x + run * (i % 2 ? 1 : -1), 0, z], rotY: i % 2 ? Math.PI / 2 : -Math.PI / 2, walk: t * 13, walkAmt: 1, rShoulder: [-2.6, 0, -0.15], rElbow: -0.4, eyeWide: 1, mouthOpen: 0.5}} look={PEOPLE[i]} />
          <Umbrella p={[FX + x + run * (i % 2 ? 1 : -1), 1.75, z]} color={CLIPS[i]} />
        </group>
      );
    })}
  </>
);
/* título: METEOROLOGIA PODAL — a moça do tempo */
const S28: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.75, 4.6]} look={[0, 1.7, -2]} fov={54} f={f} a={a} />
    <hemisphereLight args={["#ffffff", "#3a4a6a", 0.95]} />
    <pointLight position={[0, 3, 2.2]} intensity={14} distance={12} decay={1.4} castShadow />
    <WeatherStudio />
    <Toy pose={{...idle(f), pos: [1.35, 0, -0.5], rotY: -0.45, rShoulder: [-1.5, -0.6 + 0.15 * Math.sin(t * 3), 0], rElbow: 0, smile: 1, mouthOpen: 0.2 + 0.25 * Math.abs(Math.sin(t * 7))}} look={{...PEOPLE[0], hairStyle: "long"}} headExtra={<NoseClip color="#3a86ff" />} />
  </>
);

/* =================== 8 — prendedor no nariz (economia nasal) =================== */
const VIRA14 = at(14, "vira");
const E14 = at(14, "e", 0);
const PREND = at(14, "prendedor", 0);
const S29: React.FC<ShotProps> = ({f, a, t}) => {
  const clip = (i: number) => f >= PREND - 6 + i * 4;
  return (
    <>
      <Cam pos={[FX + 0.4, 1.8, 7.6]} look={[FX + 0.2, 1.4, 0.6]} fov={52} f={f} a={a} />
      <StreetScene t={t} target={[FX, 1, 0]} ext={8} tint={1} />
      {[0, 1, 2, 3, 4].map((i) => {
        const x = FX - 2.4 + i * 1.2 + ((t * 0.5 * (i % 2 ? 1 : -1)) % 1) * 0.3;
        return <Toy key={i} pose={{...idle(f + i * 11), pos: [x, 0, 1.0 + (i % 2) * 1.2], rotY: i % 2 ? 0.4 : -0.4, walk: t * 8, walkAmt: 0.6, brow: clip(i) ? -0.2 : 0.7, smile: clip(i) ? 0.8 : 0, mouthOpen: clip(i) ? 0 : 0.3, blink: clip(i) ? blinkCurve(f + i * 7) : 0.4}} look={PEOPLE[i]} headExtra={clip(i) ? <NoseClip color={CLIPS[i]} /> : undefined} />;
      })}
    </>
  );
};
const S30: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = clamp((f - a) / (b - a));
  return (
    <>
      <Cam pos={[1.0, 1.6, 5.2]} look={[0, 1.4, -1]} fov={50} f={f} a={a} />
      <hemisphereLight args={["#ffffff", "#3a2a5a", 0.8]} />
      <pointLight position={[0, 4, 1.5]} intensity={18} distance={14} decay={1.4} castShadow />
      <Runway t={t} />
      <Toy pose={{...idle(f), pos: [0, 0.4, lerp(-3.5, 0.6, k)], rotY: 0, walk: t * 7, walkAmt: 1, smile: 1, brow: -0.3, rShoulder: [-0.2, 0, -0.3], lShoulder: [-0.2, 0, 0.3]}} look={{...PEOPLE[3], hairStyle: "bun"}} headExtra={<NoseClip color="#ff4d6d" />} />
      <Toy pose={{...idle(f + 30), pos: [0.15, 0.4, lerp(-6.0, -3.2, k)], rotY: 0, walk: t * 7 + 1, walkAmt: 1, smile: 1}} look={PEOPLE[1]} headExtra={<NoseClip color="#ffd21f" />} />
    </>
  );
};
const SignTex = () => {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 160;
  const x = c.getContext("2d")!;
  x.fillStyle = "#ffd21f";
  x.fillRect(0, 0, 512, 160);
  x.fillStyle = "#101018";
  x.font = "bold 64px sans-serif";
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("PRENDEDORES", 256, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
let signTex: THREE.CanvasTexture | null = null;
const RichBoy: React.FC<{f: number; a: number; t: number; pos: V3}> = ({f, a, t, pos}) => {
  const boy = physics("rb" + a, (fr) => ({...idle(fr), pos, rotY: 0.1, ...ARMS_UP, rShoulder: [-2.9 + 0.25 * Math.sin((fr / FPS) * 9), 0, -0.35], smile: 1, mouthOpen: 0.35, brow: -0.2, squash: 0.05 * Math.abs(Math.sin((fr / FPS) * 9))}), a, f);
  return <Toy pose={boy} look={SUIT} headExtra={<><Shades /><NoseClip gold /></>} />;
};
const MoneyStreet: React.FC<{f: number; a: number; t: number}> = ({f, a, t}) => {
  if (!signTex) signTex = SignTex();
  return (
    <>
      <StreetScene t={t} target={[FX, 1, 0]} ext={8} tint={1} />
      <MoneyPile p={[FX, 0, 0.6]} s={1.5} n={80} />
      <RichBoy f={f} a={a} t={t} pos={[FX, 0.45, 0.6]} />
      <MoneyRain c={[FX, 0, 0.6]} t={t} size={[5, 4]} />
      <mesh position={[FX - 2.4, 2.4, -0.9]}>
        <planeGeometry args={[2.0, 0.62]} />
        <meshStandardMaterial map={signTex} emissive="#ffffff" emissiveMap={signTex} emissiveIntensity={0.3} />
      </mesh>
      {[0, 1, 2].map((i) => (
        <Toy key={i} pose={{...idle(f + i * 17), pos: [FX - 3.2 + i * 0.75, 0, 1.6 + i * 0.25], rotY: 0.9, smile: 1, rShoulder: [-1.4, 0, 0.1], rElbow: -0.3}} look={PEOPLE[i + 2]} headExtra={<NoseClip color={CLIPS[i + 1]} />} />
      ))}
    </>
  );
};
const S31: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.3, 2.1, 7.6]} look={[FX - 0.4, 1.6, 0.4]} fov={52} f={f} a={a} />
    <MoneyStreet f={f} a={a} t={t} />
  </>
);
/* título: ECONOMIA NASAL — o menino rico de prendedor dourado */
const S32: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.4, 2.35, 3.4]} look={[FX, 2.2, 0.6]} fov={46} f={f} a={a} punch={4} />
    <MoneyStreet f={f} a={a} t={t} />
  </>
);

/* =================== 9 — Parabéns + volta pro começo =================== */
const PB = L(16);
const E16 = at(16, "e", 0);
const S33: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b33" + a, (fr) => ({...idle(fr), pos: [-0.1, 0, -0.6], rotY: 0.1, ...ARMS_UP, rShoulder: [-2.9 + 0.2 * Math.sin((fr / FPS) * 9), 0, -0.35], smile: 1, mouthOpen: 0.4, squash: 0.08 * Math.abs(Math.sin((fr / FPS) * 9))}), a, f);
  return (
    <>
      <Cam pos={[0.3, 1.9, 4.2]} look={[-0.3, 1.5, -1.2]} fov={54} f={f} a={a} />
      <YardScene t={t} />
      <SunFace p={[6, 20, -70]} r={5} t={t} band />
      <Toy pose={boy} look={SUIT} headExtra={<><Shades /><NoseClip gold /></>} />
      <Chule c={{pos: [-1.4, 2.2, -1.4], s: 0.5, t, pink: 0.5, mustache: 1, arms: "up", smile: 1, mouth: 0.4}} />
      <Sneaker p={[0.8, 0, 0.2]} r={[0, -0.4, 0]} s={0.7} c={{alive: 1, bowtie: true, smile: 1, arms: "up", hop: 1, t}} />
      <Chinelo p={[-0.95, 0, 0.2]} r={[0, 0.4, 0]} s={0.75} c={{alive: 1, veil: 1, smile: 1, blink: blinkCurve(f + 33)}} />
    </>
  );
};
const S34: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.3, 2.1, 7.6]} look={[FX - 0.4, 1.6, 0.4]} fov={52} f={f} a={a} />
    <MoneyStreet f={f} a={a} t={t} />
  </>
);
/* "E agora, rico, você compra um tênis novinho..." — loja de tênis */
const CALCA = at(17, "calca");
const E17 = at(17, "e", 1);
const CHEIRO = at(17, "cheirinho");
const CHULE17 = at(17, "chule");
const BOY_ST: V3 = [0.6, 0, -0.2];
const S35: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b35" + a, (fr) => ({...idle(fr), pos: BOY_ST, rotY: -0.45, rShoulder: [-1.2, 0, 0.2], rElbow: -0.4, lShoulder: [-0.4, 0, -0.2], lElbow: -0.6, smile: 1, eyeWide: 0.6, pupil: [0.6, -0.7], head: [0.25, -0.3, 0]}), a, f);
  return (
    <>
      <Cam pos={[1.0, 1.65, 3.6]} look={[1.2, 1.1, -0.6]} fov={50} f={f} a={a} />
      <hemisphereLight args={["#ffffff", "#8a6a4a", 1.0]} />
      <pointLight position={[0.5, 3.6, 1.2]} intensity={12} distance={12} decay={1.4} castShadow />
      <ShoeStore />
      <ShoeBox p={[1.95, 0.31, -0.6]} r={[0, -0.2, 0]} s={1.4} open={1} />
      {[-0.1, 0.1].map((z) => (
        <Sneaker key={z} p={[1.95 - 0.08, 0.36, -0.6 + z]} r={[0, Math.PI / 2 - 0.2, 0]} s={0.3} c={{color: "#ffd21f", sole: "#ffffff"}} />
      ))}
      <Toy pose={boy} look={SUIT_SOCKS} />
    </>
  );
};
const S36: React.FC<ShotProps> = ({f, a, t}) => {
  const boy = physics("b36" + a, (fr) => ({...idle(fr), pos: BOY_ST, rotY: -0.2, rShoulder: [-0.5, 0, -0.6], rElbow: -0.2, lShoulder: [-0.5, 0, 0.6], lElbow: -0.2, smile: 1, blink: 1, head: [-0.15, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[0.9, 1.3, 3.2]} look={[0.7, 1.0, -0.2]} fov={50} f={f} a={a} />
      <hemisphereLight args={["#ffffff", "#8a6a4a", 1.0]} />
      <pointLight position={[0.5, 3.6, 1.2]} intensity={12} distance={12} decay={1.4} castShadow />
      <ShoeStore />
      <ShoeBox p={[1.95, 0.31, -0.6]} r={[0, -0.2, 0]} s={1.4} open={1} />
      <Toy pose={boy} look={SUIT_GOLD} />
    </>
  );
};
const S37: React.FC<ShotProps> = ({f, a, t}) => {
  const sn = ramp(f, CHEIRO - 4, CHEIRO + 4);
  const down = ramp(f, CHULE17 - 10, CHULE17);
  const boy = physics("b37" + a, (fr) => {
    const s2 = ramp(fr, CHEIRO - 4, CHEIRO + 4);
    const d2 = ramp(fr, CHULE17 - 10, CHULE17);
    return {...idle(fr), pos: BOY_ST, rotY: -0.2, rShoulder: [-0.5, 0, -0.6], rElbow: -0.2, lShoulder: [-0.5, 0, 0.6], lElbow: -0.2, smile: 1 - s2, blink: lerp(1, 0, s2), brow: 0.8 * s2, eyeWide: d2, mouthOpen: 0.3 * d2, head: [lerp(-0.15, 0.55, d2), 0, 0], pupil: [0, -d2]};
  }, a, f);
  return (
    <>
      <Cam pos={[0.85, 1.75, 2.9]} look={[0.65, 1.35, -0.2]} fov={48} f={f} a={a} punch={4} />
      <hemisphereLight args={["#ffffff", "#8a6a4a", 1.0]} />
      <pointLight position={[0.5, 3.6, 1.2]} intensity={12} distance={12} decay={1.4} castShadow />
      <ShoeStore />
      <Toy pose={boy} look={SUIT_GOLD} />
      <Chule c={{pos: [BOY_ST[0] + 0.25, lerp(0.25, 0.75, sn), BOY_ST[2] + 0.35], s: 0.2 * sn, t, smile: 1, look: [0, 1]}} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: PRIMEIRO, Comp: S1},
  {from: SO, Comp: S2},
  {from: DESMAIA - 4, Comp: S3},
  {from: L(1), Comp: S4},
  {from: L(2), Comp: S5},
  {from: E2, Comp: S6},
  {from: L(3), Comp: S7},
  {from: L(4), Comp: S8},
  {from: GANHA, Comp: S9},
  {from: FICA4, Comp: S10},
  {from: E4, Comp: S11},
  {from: L(5), Comp: S12},
  {from: L(6), Comp: S13},
  {from: E6, Comp: S14},
  {from: L(7), Comp: S15},
  {from: L(8), Comp: S16},
  {from: CASANDO, Comp: S17},
  {from: at(8, "chinelo"), Comp: S18},
  {from: L(9), Comp: S19},
  {from: L(10), Comp: S20},
  {from: MAS10, Comp: S21},
  {from: E10, Comp: S22},
  {from: L(11), Comp: S23},
  {from: L(12), Comp: S24},
  {from: ELES, Comp: S25},
  {from: MAS12, Comp: S26},
  {from: CHOVE, Comp: S27},
  {from: L(13), Comp: S28},
  {from: L(14), Comp: S29},
  {from: VIRA14, Comp: S30},
  {from: E14, Comp: S31},
  {from: L(15), Comp: S32},
  {from: PB, Comp: S33},
  {from: E16, Comp: S34},
  {from: L(17), Comp: S35},
  {from: CALCA, Comp: S36},
  {from: E17, Comp: S37},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_CHULE} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["tenis", "chule", "sol", "arejar", "forte", "desmaia", "anoitece", "meiodia", "eclipse", "podalico", "perfume", "cheiroso", "cantar", "opera", "lirico", "show", "talentos", "ganha", "famoso", "empresario", "olfativo", "ciume", "sucesso", "foge", "skate", "cadarco", "igreja", "casando", "chinelo", "pai", "matrimonio", "calcadistico", "festa", "acaba", "desmaia", "dinossauro", "apagao", "bombeiros", "agua", "esponja", "nuvem", "gigante", "chove", "cidade", "meteorologia", "podal", "prendedor", "nariz", "moda", "milionario", "economia", "nasal", "parabens", "novinho", "calca", "cheirinho"]);
const Bubble: React.FC<{from: number; to: number; text: string; x: number; y: number; size?: number}> = ({from, to, text, x, y, size = 70}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: x - 400, top: y, width: 800, display: "flex", justifyContent: "center", transform: `scale(${s}) rotate(-3deg)`}}>
      <div style={{background: "#fff", color: "#101018", fontFamily, fontWeight: 900, fontSize: size, padding: "16px 40px", borderRadius: 40, border: "8px solid #101018", textAlign: "center", lineHeight: 1.05, boxShadow: "0 10px 0 rgba(0,0,0,0.25)"}}>{text}</div>
    </div>
  );
};
const Notes: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {Array.from({length: 6}, (_, i) => {
        const k = ((f - from) / 36 + i / 6) % 1;
        return (
          <div key={i} style={{position: "absolute", left: x + Math.sin(i * 2.1 + k * 5) * 260, top: y - k * 420, fontSize: 80 + 30 * (i % 2), color: ["#ff4d6d", "#3a86ff", "#2ecc71", "#ffd21f"][i % 4], WebkitTextStroke: "5px #101018", paintOrder: "stroke fill", opacity: 1 - k * k, transform: `rotate(${-15 + i * 9}deg)`, fontFamily}}>
            {i % 2 ? "♪" : "♫"}
          </div>
        );
      })}
    </>
  );
};
/** linhas de cheiro (onduladas, verdes) */
const Smell: React.FC<{from: number; to: number; x: number; y: number; color?: string}> = ({from, to, x, y, color = "#8fd14f"}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const ph = (f - from) / 8;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      {[0, 1, 2].map((i) => (
        <path key={i} d={`M ${x + i * 60} ${y} q 20 -40 0 -80 q -20 -40 0 -80 q 20 -40 0 -80`} transform={`translate(${8 * Math.sin(ph + i)},0)`} stroke={color} strokeWidth={14} fill="none" strokeLinecap="round" opacity={0.85} />
      ))}
    </svg>
  );
};
/** flashes de câmera */
const Flash: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const on = (f - from) % 9 < 2;
  return on ? <AbsoluteFill style={{background: "rgba(255,255,255,0.55)"}} /> : null;
};
/** cartão "seguir o perfil" (pequeno, sem dedinho) */
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
const MUSIC = 0.11;
const SND: React.FC<{src: string; from: number; dur?: number; v: number; loop?: boolean}> = ({src, from, dur = 60, v, loop}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} loop={loop} />
  </Sequence>
);
const FOLLOW_FROM = L(17) + 8;
const FOLLOW_TAP = FOLLOW_FROM + 50;
const singing = (fr: number) => (fr >= at(2, "cantar") - 4 && fr < L(4) + 10) || (fr >= L(10) && fr < at(10, "acaba") + 4) || (fr >= L(4) && fr < GANHA);
export const VideoChule: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(1), L(3), L(5), L(7), L(9), L(11), L(13), L(15)];
  const end = (i: number) => (i < 17 ? L(i + 1) - 3 : TOTAL_CHULE);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <StageTitle from={L(1) + 4} to={end(1)} lines={["ECLIPSE", "PODÁLICO"]} />
      <StageTitle from={L(3) + 4} to={end(3)} lines={["CHULÉ", "LÍRICO"]} />
      <StageTitle from={L(5) + 4} to={end(5)} lines={["EMPRESÁRIO", "OLFATIVO"]} />
      <StageTitle from={L(7) + 4} to={end(7)} lines={["CIÚME", "DE CADARÇO"]} />
      <StageTitle from={L(9) + 4} to={end(9)} lines={["MATRIMÔNIO", "CALÇADÍSTICO"]} />
      <StageTitle from={L(11) + 4} to={end(11)} lines={["APAGÃO", "OLFATIVO"]} />
      <StageTitle from={L(13) + 4} to={end(13)} lines={["METEOROLOGIA", "PODAL"]} />
      <StageTitle from={L(15) + 4} to={end(15)} lines={["ECONOMIA", "NASAL"]} />

      <Smell from={8} to={PRIMEIRO - 2} x={330} y={900} />
      <Chip from={ANOITECE - 2} to={L(1) - 3} text="12:00 🌙" bg="#2a2f6a" top={300} size={100} />
      <Notes from={OPERA} to={L(4) - 2} x={420} y={760} />
      <Bubble from={OPERA + 4} to={L(3) - 3} text="🎶 LÁÁÁÁ!" x={540} y={330} size={84} />
      <Notes from={L(4)} to={GANHA - 2} x={460} y={700} />
      <Chip from={FICA4 - 2} to={E4 - 3} text="CAMPEÃO 🏆" bg="#e8a317" top={300} size={100} />
      <Flash from={FICA4} to={E4 - 4} />
      <Confetti from={GANHA} to={GANHA + 80} />
      <Sparkles from={ALIVE} to={ALIVE + 22} x={430} y={980} r={170} />
      <Chip from={CASANDO + 4} to={at(8, "chinelo") - 3} text="SIM! 💍" bg="#ff4d6d" top={300} size={100} />
      <Notes from={L(10)} to={at(10, "acaba") + 2} x={460} y={700} />
      <Smell from={at(10, "acaba")} to={L(11) - 3} x={470} y={900} />
      <Chip from={CHOVE + 2} to={L(13) - 3} text="🌧️ CHUVA DE CHULÉ" bg="#4c9a35" top={300} size={78} />
      <Chip from={L(13) + 4} to={L(14) - 3} text="🔴 AO VIVO" bg="#e8262d" top={560} size={56} rot={0} />
      <Flash from={VIRA14} to={E14 - 4} />
      <Chip from={at(14, "milionario") - 2} to={L(15) - 3} text="ESGOTADO 💸" bg="#2e8b57" top={300} size={100} />
      <Confetti from={PB} to={PB + 120} />
      <Chip from={PB + 1} to={at(16, "desmaiou") - 3} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(16, "desmaiou")} to={E16 - 3} x={190} y={420} rot={-6} label="SOL DESMAIADO">
        <g transform="translate(152,105)">
          <circle cx={0} cy={5} r={55} fill="#c8de4a" stroke="#101018" strokeWidth={6} />
          <path d="M -32 -15 l 18 18 m 0 -18 l -18 18 M 14 -15 l 18 18 m 0 -18 l -18 18" stroke="#101018" strokeWidth={6} />
          <ellipse cx={0} cy={30} rx={16} ry={9} fill="#3a1510" />
          <ellipse cx={4} cy={42} rx={9} ry={12} fill="#e2606e" />
        </g>
      </Sticker>
      <Sticker from={at(16, "empresariou")} to={E16 - 3} x={540} y={400} rot={4} label="CHULÉ CANTOR">
        <g transform="translate(152,105)">
          <circle cx={-30} cy={10} r={36} fill="#ff9ccf" stroke="#101018" strokeWidth={5} />
          <circle cx={25} cy={5} r={42} fill="#ff9ccf" stroke="#101018" strokeWidth={5} />
          <circle cx={0} cy={-25} r={34} fill="#ff9ccf" stroke="#101018" strokeWidth={5} />
          <circle cx={-10} cy={0} r={7} fill="#101018" />
          <circle cx={14} cy={0} r={7} fill="#101018" />
          <path d="M -18 18 q 15 -8 30 0" stroke="#2a170d" strokeWidth={7} fill="none" />
          <ellipse cx={0} cy={32} rx={9} ry={11} fill="#3a1510" />
        </g>
      </Sticker>
      <Sticker from={at(16, "casou")} to={E16 - 3} x={890} y={430} rot={6} label="TÊNIS + CHINELO">
        <g transform="translate(152,110)">
          <rect x={-78} y={-5} width={80} height={40} rx={16} fill="#f4f4f2" stroke="#101018" strokeWidth={5} />
          <rect x={-80} y={30} width={84} height={12} rx={5} fill="#f08a1c" />
          <ellipse cx={45} cy={0} rx={24} ry={50} fill="#ffd21f" stroke="#101018" strokeWidth={5} />
          <path d="M 45 -30 L 30 5 M 45 -30 L 60 5" stroke="#2e86de" strokeWidth={7} />
          <path d="M 0 -55 c -8 -10 -22 0 -12 10 l 12 10 l 12 -10 c 10 -10 -4 -20 -12 -10 z" fill="#ff4d6d" />
        </g>
      </Sticker>
      <Sticker from={at(16, "chover")} to={E16 - 3} x={250} y={1620} rot={-4} label="CHUVA DE CHULÉ">
        <g transform="translate(152,100)">
          <circle cx={-30} cy={-10} r={32} fill="#8fd14f" stroke="#101018" strokeWidth={5} />
          <circle cx={20} cy={-15} r={40} fill="#8fd14f" stroke="#101018" strokeWidth={5} />
          <path d="M -40 35 l -6 20 M -10 40 l -6 20 M 20 35 l -6 20 M 48 40 l -6 20" stroke="#4c9a35" strokeWidth={7} strokeLinecap="round" />
        </g>
      </Sticker>
      <Sticker from={at(16, "milionario")} to={L(17) - 3} x={830} y={1620} rot={5} label="PRENDEDOR DE OURO">
        <g transform="translate(152,105)">
          <rect x={-70} y={-22} width={140} height={20} rx={8} fill="#ffcc33" stroke="#101018" strokeWidth={5} transform="rotate(-8)" />
          <rect x={-70} y={4} width={140} height={20} rx={8} fill="#ffcc33" stroke="#101018" strokeWidth={5} transform="rotate(8)" />
          <circle cx={-30} cy={0} r={10} fill="#c9ced6" stroke="#101018" strokeWidth={4} />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      <FollowCard from={FOLLOW_FROM} to={TOTAL_CHULE - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozchule.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 12) * (1 - ramp(fr, TOTAL_CHULE - 20, TOTAL_CHULE)) * (singing(fr) ? 0.45 : 1)} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.18} />
      ))}
      {titles.map((b) => (
        <SND key={"b" + b} src="sfx7/boing.mp3" from={b + 3} dur={32} v={FXV * 0.75} />
      ))}
      <SND src="sfx8/sniff.mp3" from={6} dur={40} v={FXV * 0.6} />
      <SND src="sfx8/sniff.mp3" from={at(0, "forte") - 4} dur={40} v={FXV * 0.6} />
      <SND src="sfx12/slip.mp3" from={DESMAIA + 4} dur={40} v={FXV * 0.5} />
      <SND src="sfx14/grilos.mp3" from={ANOITECE + 6} dur={L(4) - ANOITECE - 6} v={FXV * 0.4} loop />
      <SND src="sfx11/water.mp3" from={PERF - 4} dur={36} v={FXV * 0.45} />
      <SND src="sfx14/spray.mp3" from={PERF + 4} dur={40} v={FXV * 0.4} />
      <SND src="sfx11/angels.mp3" from={OPERA - 2} dur={L(4) - OPERA + 2} v={FXV * 0.45} />
      <SND src="sfx11/angels.mp3" from={L(4)} dur={GANHA - L(4)} v={FXV * 0.4} />
      <SND src="sfx2/cheer.mp3" from={GANHA} dur={70} v={FXV * 0.4} />
      <SND src="sfx10/plim.mp3" from={FICA4} dur={30} v={FXV * 0.5} />
      <SND src="sfx8/snap.mp3" from={FICA4 + 4} dur={20} v={FXV * 0.5} />
      <SND src="sfx8/snap.mp3" from={FICA4 + 13} dur={20} v={FXV * 0.5} />
      <SND src="sfx7/cash.mp3" from={at(4, "empresario")} dur={40} v={FXV * 0.55} />
      <SND src="sfx7/cash.mp3" from={L(5) + 6} dur={40} v={FXV * 0.45} />
      <SND src="sfx10/plim.mp3" from={ALIVE} dur={30} v={FXV * 0.6} />
      <SND src="sfx13/growl.mp3" from={at(6, "ciume")} dur={45} v={FXV * 0.35} />
      <SND src="sfx10/scooter.mp3" from={E6} dur={L(8) - E6} v={FXV * 0.45} loop />
      <SND src="sfx12/bells.mp3" from={L(8)} dur={70} v={FXV * 0.45} />
      <SND src="sfx9/sniffle.mp3" from={PAI8 - 6} dur={50} v={FXV * 0.6} />
      <SND src="sfx12/kiss.mp3" from={L(9) + 12} dur={36} v={FXV * 0.6} />
      <SND src="sfx12/aww.mp3" from={L(9) + 16} dur={60} v={FXV * 0.45} />
      <SND src="sfx11/angels.mp3" from={L(10)} dur={at(10, "acaba") + 4 - L(10)} v={FXV * 0.45} />
      <SND src="sfx14/scratch.mp3" from={at(10, "acaba")} dur={30} v={FXV * 0.5} />
      <SND src="sfx12/gasp.mp3" from={E10 - 4} dur={40} v={FXV * 0.3} />
      {GUESTS.map((g, i) => (
        <SND key={"t" + i} src="sfx10/bonk.mp3" from={faintAt(g) + 7} dur={20} v={FXV * (g.kind === "dino" ? 0.7 : 0.35)} />
      ))}
      <SND src="sfx14/sirene.mp3" from={L(12) - 4} dur={ELES - L(12) + 10} v={FXV * 0.45} loop />
      <SND src="sfx11/water.mp3" from={ELES + 2} dur={CRESCE - ELES} v={FXV * 0.33} loop />
      <SND src="sfx11/grow.mp3" from={CRESCE - 6} dur={60} v={FXV * 0.6} />
      <SND src="sfx2/boom.mp3" from={CHOVE - 4} dur={50} v={FXV * 0.35} />
      <SND src="sfx14/chuva.mp3" from={CHOVE} dur={L(14) - CHOVE} v={FXV * 0.45} loop />
      <SND src="sfx10/ding.mp3" from={L(13) + 4} dur={30} v={FXV * 0.5} />
      {[0, 1, 2, 3, 4].map((i) => (
        <SND key={"c" + i} src="sfx8/snap.mp3" from={PREND - 6 + i * 4} dur={15} v={FXV * 0.35} />
      ))}
      <SND src="sfx3/crowd.mp3" from={VIRA14} dur={E14 - VIRA14} v={FXV * 0.35} />
      <SND src="sfx7/cash.mp3" from={at(14, "milionario")} dur={40} v={FXV * 0.6} />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FXV * 0.6} />
      <SND src="sfx9/yay.mp3" from={PB} dur={60} v={FXV * 0.45} />
      {["desmaiou", "empresariou", "casou", "chover", "milionario"].map((w, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={at(16, w)} dur={22} v={FXV * 0.45} />
      ))}
      <SND src="sfx3/bell.mp3" from={L(17)} dur={40} v={FXV * 0.3} />
      <SND src="sfx12/tada.mp3" from={CALCA} dur={45} v={FXV * 0.45} />
      <SND src="sfx8/sniff.mp3" from={CHEIRO - 2} dur={40} v={FXV * 0.6} />
      <SND src="sfx11/drama.mp3" from={CHULE17 - 4} dur={40} v={FXV * 0.5} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
