import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Town, V3} from "./Sets5";
import {WeddingPigeon} from "./Sets10";
import {Dino} from "./Sets7";
import {Cow} from "./Sets8";
import {MoonSet, Rocket} from "./Sets9";
import {ChefHat, Shades} from "./Sets11";
import {Car, Octopus, Phone, FruitStall} from "./Sets12";
import {Plaque, Trophy} from "./Sets13";
import {EvaHelmet, EvaGear} from "./Sets14";
import {Pastel, Girafa, NECK_TOP, Calendar, ClosedSign, IceCube, Fan, CookStudio, Meteor, Duck, Cap} from "./Sets15";
import {Captions, StageTitle, Confetti, Sticker, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut} from "./util";
import W from "./timingPastel.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_PASTEL = F(words[words.length - 1].e + 0.9);

const BOYL: ToyLook = {hoodie: true};
const ASTRO: ToyLook = {shirt: "#f4f4f2", pants: "#f4f4f2", shoe: "#f4f4f2", sole: "#c9ced6"};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};
const PHONE_EAR: Pose = {rShoulder: [-1.654, 0.385, -0.484], rElbow: -1.914};
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const OFFER: Pose = {rShoulder: [-1.28, 0.98, 0.1], rElbow: -0.47};

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};
const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 600;
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

/* ---------- ambientes ---------- */
const FX = -20;
const StreetScene: React.FC<{t: number; hot?: number}> = ({t, hot = 0}) => (
  <>
    <Sky top={hot > 0.5 ? "#ff9a3a" : "#3d97e6"} bottom={hot > 0.5 ? "#ffe2a0" : "#cfefff"} />
    <fog attach="fog" args={[hot > 0.5 ? "#ffe2a0" : "#cdeeff", 30, 130]} />
    <SunDisc p={[-30, 40, -110]} r={hot > 0.5 ? 12 : 6} />
    <hemisphereLight args={[hot > 0.5 ? "#ffe8c0" : "#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={[FX, 1, 0]} dir={[-6, 10, 7]} intensity={hot > 0.5 ? 3.0 : 2.6} color={hot > 0.5 ? "#ffd9a0" : "#fff1d6"} ext={10} />
    <Town t={t} galo={false} variant="nova" clouds={hot < 0.5} />
  </>
);
const MoonScene: React.FC<{t: number}> = ({t}) => (
  <>
    <hemisphereLight args={["#dfe6ff", "#202030", 0.7]} />
    <directionalLight position={[6, 10, 6]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} />
    <MoonSet t={t} />
  </>
);
const Astro: React.FC<{pose: Pose; pos: V3; rotY: number; t: number; palmRef?: React.Ref<THREE.Object3D>; hat?: React.ReactNode; noHelmet?: boolean}> = ({pose, pos, rotY, t, palmRef, hat, noHelmet}) => (
  <>
    <Toy pose={{...pose, pos, rotY}} look={ASTRO} palmRef={palmRef} headExtra={<>{!noHelmet && <EvaHelmet open />}{hat}</>} />
    <EvaGear pos={pos} rotY={rotY} t={t} />
  </>
);

/* =================== 1 — feira fechada, a girafa pasteleira =================== */
const ENTAO0 = at(0, "entao");
const GIRAFA0 = at(0, "girafa");
const BOY0: V3 = [FX, 0.08, 2.1];
const GIR: V3 = [FX + 0.6, 0, -1.6];
const FeiraFechada: React.FC<{cal?: boolean}> = ({cal = true}) => (
  <>
    {[FX - 6.2, FX - 1.45, FX + 1.5, FX + 7.8].map((x, i) => (
      <ClosedSign key={i} p={[x, 0.08, -1.95]} rotY={0} s={1.15} />
    ))}
    {cal && <Calendar p={[FX - 1.05, 2.2, -0.2]} r={[0, 0.2, 0]} s={1.1} />}
  </>
);
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  return (
    <>
      <Cam pos={[FX - 0.12, 1.7, 6.6]} look={[FX - 0.12, 1.35, 1.2]} fov={50} f={f} a={a} />
      <StreetScene t={t} />
      <FeiraFechada />
      <Toy pose={{...idle(f), pos: BOY0, rotY: 0.1, rShoulder: [-0.5, 0, 0.3], rElbow: -1.0, lShoulder: [-0.4, 0, -0.3], lElbow: -0.9, brow: 0.6, mouthOpen: 0.15, head: [0.15, -0.2, 0]}} look={BOYL} palmRef={palm} />
      <InHand palm={palm}>
        <Phone p={[0, -0.03, 0.04]} s={1.3} t={t} />
      </InHand>
    </>
  );
};
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const k = easeOut(ramp(f, a + 6, GIRAFA0 + 4));
  return (
    <>
      <Cam pos={[FX + 0.3, 2.4, 9.8]} look={[FX + 0.3, 2.9, 0]} fov={46} f={f} a={a} />
      <StreetScene t={t} />
      <FeiraFechada cal={false} />
      <Toy pose={{...idle(f), pos: BOY0, rotY: 0.1, ...PHONE_EAR, head: [-0.3 * k, 0, 0], eyeWide: k, smile: 0.5}} look={BOYL} palmRef={palm} />
      <InHand palm={palm}>
        <Phone p={[0, -0.03, 0.04]} s={1.3} t={t} />
      </InHand>
      <Girafa g={{pos: [lerp(FX + 9, GIR[0], k), 0, GIR[2]], rotY: lerp(-Math.PI / 2, 0.15, k), t, walk: 1 - k, blink: blinkCurve(f + 7), smile: 1, mouth: f > GIRAFA0 ? 0.4 : 0}} />
    </>
  );
};
/* 🌀 "A girafa nunca pegou um resfriado, porque o nariz dela mora em outro CEP." */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const top = NECK_TOP(1);
  return (
    <>
      <Cam pos={[GIR[0] + 0.3, top + 0.55, GIR[2] + 4.6]} look={[GIR[0], top - 0.05, GIR[2] + 0.6]} fov={50} f={f} a={a} punch={10} />
      <StreetScene t={t} />
      <Girafa g={{pos: GIR, rotY: 0.15, t, blink: blinkCurve(f + 7), smile: 1, look: [0, 0.6]}} />
      <group position={[GIR[0] + 0.12, top + 0.62, GIR[2] + 0.75]}>
        <WeddingPigeon p={{pos: [0, 0, 0], rotY: 0.6, t, blink: blinkCurve(f + 3)}} s={0.6} />
      </group>
      {Array.from({length: 4}, (_, i) => (
        <mesh key={i} position={[GIR[0] - 1.6 + i * 1.2, top + 0.2 + 0.3 * (i % 2), GIR[2] - 1.2]}>
          <sphereGeometry args={[0.45 + 0.1 * (i % 3), 12, 10]} />
          <meshStandardMaterial color="#ffffff" roughness={0.9} />
        </mesh>
      ))}
    </>
  );
};
/* "Mas o pescoço dela é tão comprido... que o pastel esfria antes de chegar na boca." */
const ESFRIA = at(2, "esfria");
const BOCA = at(2, "boca");
const S3: React.FC<ShotProps> = ({f, a, b, t}) => {
  const top = NECK_TOP(1);
  const k = easeInOut(clamp((f - a - 6) / (BOCA - a - 6)));
  const y = lerp(1.9, top - 0.25, k);
  const z = GIR[2] + lerp(0.55, 0.95, k);
  const frozen = ramp(f, ESFRIA - 6, ESFRIA + 10);
  return (
    <>
      <Cam pos={[GIR[0] + 1.0, y + 0.6, z + 3.4]} look={[GIR[0] + 0.05, y + 0.1, z]} fov={48} f={f} a={a} />
      <StreetScene t={t} />
      <Girafa g={{pos: GIR, rotY: 0.15, t, blink: blinkCurve(f + 7), smile: 1, mouth: f > BOCA - 4 ? 0.6 : 0, look: [0, -0.6]}} />
      {/* elevadorzinho subindo pelo pescoço */}
      <group position={[GIR[0] + 0.08, y, z]}>
        <mesh position={[0, -0.08, 0]}>
          <boxGeometry args={[0.7, 0.05, 0.5]} />
          <meshStandardMaterial color="#c9ced6" metalness={0.5} roughness={0.3} />
        </mesh>
        <Pastel p={[0, 0.05, 0.05]} r={[0.9, 0, 0]} s={1.3} frozen={frozen} />
      </group>
    </>
  );
};
/* título: RESFRIAMENTO PESCOÇAL — a girafa com o pastel-picolé na boca */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const top = NECK_TOP(1);
  return (
    <>
      <Cam pos={[GIR[0] + 0.3, top + 0.3, GIR[2] + 3.8]} look={[GIR[0], top - 0.35, GIR[2] + 0.6]} fov={48} f={f} a={a} />
      <StreetScene t={t} />
      <Girafa g={{pos: GIR, rotY: 0.15, t, blink: 0.35, smile: 0, sad: 1, look: [0.6, -0.5]}}>
        <Pastel p={[0.26, -0.1, 0.06]} r={[Math.PI / 2, 0, -Math.PI / 2]} s={1.0} frozen={1} />
      </Girafa>
    </>
  );
};

/* =================== 2 — Teresina e o carro chef (gastronomia automotiva) =================== */
const TERESINA = at(4, "teresina");
const QUARENTA = at(4, "quarenta");
const CAR_P: V3 = [FX, 0, 0.3];
const HoodPastel: React.FC<{t: number; fry: number}> = ({t, fry}) => (
  <group position={[CAR_P[0], 1.25 + 0.015 * Math.abs(Math.sin(t * 20)), CAR_P[2] + 1.15]} rotation={[0.25, 0, 0]}>
    <Pastel s={1.1} fry={fry} />
    {Array.from({length: 6}, (_, i) => {
      const q = (t * 1.5 + i / 6) % 1;
      return (
        <mesh key={i} position={[0.3 * Math.sin(i * 2), 0.1 + q * 0.8, 0.2 * Math.cos(i * 3)]}>
          <sphereGeometry args={[0.05 + 0.1 * q, 8, 6]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.5 * (1 - q)} />
        </mesh>
      );
    })}
  </group>
);
const S5: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.5, 2.7, 7.4]} look={[FX + 0.5, 1.0, 0.8]} fov={48} f={f} a={a} />
    <StreetScene t={t} hot={1} />
    <Car p={CAR_P} rotY={0} c={{noFace: true, t, sleepy: 0.3, mood: 0.2}} s={1.6} />
    <HoodPastel t={t} fry={ramp(f, a, a + 120)} />
    <Toy pose={{...idle(f), pos: [FX + 1.45, 0, 1.3], rotY: -0.35, rShoulder: [-1.2, 0, 0.2], rElbow: -0.4, smile: 1, heat: 0.5}} look={BOYL} headExtra={<Shades />} />
  </>
);
/* 🌀 "Em Teresina, até o gelo pede ventilador." */
const S6: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX + 0.15, 1.3, 4.7]} look={[FX + 0.15, 0.5, 0.8]} fov={44} f={f} a={a} punch={10} />
    <StreetScene t={t} hot={1} />
    <IceCube p={[FX - 0.3, 0.02, 0.8]} t={t} s={1.0} />
    <Fan p={[FX + 0.65, 0.02, 0.9]} rotY={-1.0} t={t} s={1.0} />
  </>
);
const PROGRAMA = at(6, "programa");
const GANHA = at(6, "ganha");
const S7: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[FX, 2.2, 7.0]} look={[FX, 1.0, 0.6]} fov={48} f={f} a={a} />
    <StreetScene t={t} hot={1} />
    <Car p={CAR_P} rotY={0} c={{noFace: true, t, smile: 1, wide: 1, bounce: 0.3}} s={1.6} />
    <HoodPastel t={t} fry={1} />
  </>
);
const CZ = -0.2;
const CookCar: React.FC<{t: number; f: number; trophy?: boolean}> = ({t, trophy}) => (
  <>
    <Car p={[0, 0, CZ]} rotY={0} c={{noFace: true, t, smile: 1, wide: trophy ? 0 : 0.5, bounce: trophy ? 0.6 : 0}} s={1.4} />
    <group position={[0, 1.32, CZ - 0.2]} scale={1.5}>
      <ChefHat />
    </group>
    {trophy && <Trophy p={[0, 1.07, CZ + 1.05]} s={1.2} />}
    {!trophy && <Pastel p={[0, 1.1, CZ + 1.05]} r={[0.35, 0, 0]} s={1.2} fry={1} />}
  </>
);
const JX = [-1.2, -0.4, 0.4, 1.2];
const Judges: React.FC<{f: number; t: number; plaques: number}> = ({f, t, plaques}) => (
  <>
    <WeddingPigeon p={{pos: [JX[0], 0.45, 2.75], rotY: Math.PI, t, blink: blinkCurve(f + 3), chest: plaques}} s={2.4} />
    <Octopus o={{pos: [JX[1], 0.42, 2.85], rotY: Math.PI, t, shades: true, s: 0.72, mouth: 0.5 * plaques, wrench: false}} />
    <Dino p={{pos: [JX[2], 0, 2.85], rotY: Math.PI, t, blink: blinkCurve(f + 41), arms: 0.6 * plaques, jaw: 0.4 * plaques}} s={0.62} />
    <Cow c={{pos: [JX[3], 0, 2.9], rotY: Math.PI, t, blink: blinkCurve(f + 23), arms: plaques > 0.3 ? "up" : "down", armK: 0.6, mouth: 0.4 * plaques, happy: plaques}} s={1.05} />
    {plaques > 0.01 &&
      JX.map((x, i) => <Plaque key={i} p={[x, lerp(0.5, 1.15, plaques), 2.05]} r={[0, Math.PI, 0.1 * Math.sin(t * 4 + i)]} s={1.15} />)}
  </>
);
const StudioScene: React.FC<{desk?: boolean}> = ({desk = false}) => (
  <>
    <hemisphereLight args={["#fff1e0", "#5a3a6a", 0.85]} />
    <pointLight position={[0, 4.2, 1]} intensity={20} distance={16} decay={1.4} color="#fff0e0" castShadow shadow-mapSize={[1024, 1024]} />
    <CookStudio desk={desk} />
  </>
);
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.3, 5.4]} look={[0, 1.15, -0.4]} fov={50} f={f} a={a} />
    <StudioScene />
    <CookCar t={t} f={f} />
  </>
);
/* contraplano: os jurados dando 10 */
const S8b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.65, -3.4]} look={[0, 1.05, 2.6]} fov={56} f={f} a={a} />
    <StudioScene desk />
    <mesh position={[0, 2.5, 4.4]} rotation={[0, Math.PI, 0]}>
      <planeGeometry args={[10, 5]} />
      <meshStandardMaterial color="#5a2a7a" roughness={0.8} />
    </mesh>
    {Array.from({length: 18}, (_, i) => (
      <mesh key={i} position={[-3.4 + (i % 9) * 0.85, 2.2 + Math.floor(i / 9) * 1.1, 4.35]}>
        <sphereGeometry args={[0.09, 10, 8]} />
        <meshStandardMaterial color="#ffe08a" emissive="#ffd21f" emissiveIntensity={1.4} />
      </mesh>
    ))}
    <Judges f={f} t={t} plaques={backOut(ramp(f, GANHA, GANHA + 10))} />
  </>
);
/* título: GASTRONOMIA AUTOMOTIVA */
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.0, 4.6]} look={[0, 1.2, -0.3]} fov={50} f={f} a={a} />
    <StudioScene />
    <CookCar t={t} f={f} trophy />
  </>
);

/* =================== 3 — viagem pra Lua e a feira lunar =================== */
const LUA8 = at(8, "lua", 0);
const E8 = at(8, "e", 1);
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const up = Math.max(0, (f - a - 10) / FPS);
  const y = 1.2 * up * up;
  return (
    <>
      <Cam pos={[FX + 0.2, 3.0 + y * 0.6, 12]} look={[FX, 3.2 + y * 0.9, 0]} fov={56} f={f} a={a} />
      <StreetScene t={t} />
      <Rocket p={[FX, y, -0.5]} s={2.4} flame={1} t={t} />
    </>
  );
};
const MOON_BOY: V3 = [-0.5, 0, 1.0];
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.05, 1.9, 6.2]} look={[0.05, 1.05, 0.5]} fov={48} f={f} a={a} />
    <MoonScene t={t} />
    <Astro pose={{...idle(f), rShoulder: [-0.3, 0, -0.8], lShoulder: [-0.3, 0, 0.8], rElbow: -0.3, lElbow: -0.3, brow: 0.6, mouthOpen: 0.2, head: [0, 0.6 * Math.sin(t * 2), 0]}} pos={MOON_BOY} rotY={0.2} t={t} />
    <Car p={[0.65, 0, 0.1]} rotY={-0.35} c={{noFace: true, t, wide: 0.6, mood: 0.3}} s={1.0} />
  </>
);
/* 🌀 "A Lua não tem vento, então ninguém lá nunca perdeu um boné." */
const S12: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.85, 4.4]} look={[0, 1.5, 0.6]} fov={46} f={f} a={a} punch={10} />
    <MoonScene t={t} />
    <Astro pose={{...idle(f), rShoulder: [-1.4, 0, -0.3], rElbow: -1.5, smile: 1, brow: -0.3}} pos={[0, 0, 0.6]} rotY={0} t={t} hat={<group position={[0, -0.1, 0]} scale={1.45}><Cap color="#3a86ff" /></group>} />
  </>
);
const METEORO = at(10, "meteoro");
const MEAT: V3 = [0.7, 1.25, 0.8];
const meteorPos = (f: number): V3 => {
  const k = easeOut(ramp(f, METEORO - 30, METEORO + 2));
  return [lerp(8, MEAT[0], k), lerp(9, MEAT[1], k), lerp(-6, MEAT[2], k)];
};
const S13: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.0, 6.0]} look={[0, 1.15, -0.2]} fov={48} f={f} a={a} />
    <MoonScene t={t} />
    <FruitStall p={[0, 0, -0.4]} kind="pastel" colors={["#ffd21f", "#ffffff"]} />
    {[-0.6, -0.25, 0.45].map((x, i) => <Pastel key={i} p={[x, 0.88, -0.1]} r={[0.5, 0.3 * i, 0]} s={0.7} fry={1} />)}
    <Astro pose={{...idle(f), ...OFFER, smile: 1}} pos={[-0.15, 0, -1.2]} rotY={0} t={t} />
    {f >= METEORO - 30 && <Meteor p={meteorPos(f)} t={t} s={0.8} mouth={f > METEORO ? 0.5 : 0} rotY={-0.6} fire={1 - ramp(f, METEORO + 2, METEORO + 14) * 0.7} />}
  </>
);
/* título: COMÉRCIO GRAVITACIONAL — pastel flutuando */
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const k = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0, 1.6, 4.4]} look={[0, 1.35, 0.6]} fov={48} f={f} a={a} />
      <MoonScene t={t} />
      <Meteor p={[0.42, 0.85, 0.6]} t={t} s={0.8} mouth={0.8} fire={0.3} rotY={-0.35} />
      <Pastel p={[-0.32 + 0.1 * Math.sin(k * 2), 1.45 + 0.12 * Math.sin(k * 1.4), 0.9]} r={[Math.PI / 2 + 0.3 * Math.sin(k), 0.3 * Math.sin(k * 1.3), k * 0.9]} s={1.3} fry={1} />
    </>
  );
};

/* =================== 4 — Parabéns, o pato e a girafa na janela =================== */
const PB = L(12);
const OLEO = at(12, "gasolina");
const GELO = at(12, "gelo");
const POEIRA = at(12, "poeira");
/** sai da boca, um de cada vez: óleo (gasolina) → gelo (girafa) → poeira (Lua) — no espaço da cabeça */
const FX_END = L(13);
const Spray: React.FC<{f: number; t: number; from: number; to: number; n: number; life: number; render: (q: number, i: number, amp: number) => React.ReactNode}> = ({f, from, to, n, life, render}) => {
  if (f < from || f > to + life * FPS) return null;
  const el = (f - from) / FPS;
  const amp = clamp((f - from) / 5);
  return (
    <>
      {Array.from({length: n}, (_, i) => {
        const age = ((el / life + i / n) % 1) * life;
        const born = f / FPS - age; // instante em que a partícula saiu da boca
        if (age > el || born > to / FPS) return null;
        return <React.Fragment key={i}>{render(age / life, i, amp)}</React.Fragment>;
      })}
    </>
  );
};
const PastelFX: React.FC<{f: number; t: number}> = ({f, t}) => (
  <group position={[0.0, -0.21, 0.36]}>
    {/* 1) óleo do carro jorrando da boca e caindo */}
    <Spray f={f} t={t} from={OLEO - 2} to={GELO - 3} n={14} life={0.7} render={(q, i, amp) => (
      <mesh position={[Math.sin(i * 2.1) * 0.35 * q, 0.08 * q - 0.9 * q * q, 0.04 + 0.55 * q]} scale={[0.03 * amp, (0.04 + 0.03 * q) * amp, 0.03 * amp]}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#2a1a08" roughness={0.1} metalness={0.5} emissive="#3a2408" emissiveIntensity={0.3} />
      </mesh>
    )} />
    {/* 2) gelo saindo da boca (cristais + fumacinha fria) */}
    <Spray f={f} t={t} from={GELO - 2} to={POEIRA - 3} n={14} life={0.8} render={(q, i, amp) => (
      <mesh position={[Math.sin(i * 2.4) * 0.45 * q, Math.cos(i * 1.7) * 0.25 * q, 0.04 + 0.6 * q]} rotation={[t * 3 + i, t * 2 + i, 0]} scale={(0.035 + 0.02 * q) * amp}>
        {i % 3 === 0 ? <sphereGeometry args={[1.4, 8, 6]} /> : <octahedronGeometry args={[1, 0]} />}
        <meshStandardMaterial color={i % 3 === 0 ? "#ffffff" : "#cfefff"} emissive="#9fd8ff" emissiveIntensity={0.6} transparent opacity={(i % 3 === 0 ? 0.5 : 0.95) * (1 - q * 0.7)} />
      </mesh>
    )} />
    {/* 3) poeira de Lua saindo da boca */}
    <Spray f={f} t={t} from={POEIRA - 2} to={FX_END - 4} n={12} life={0.9} render={(q, i, amp) => (
      <mesh position={[(i % 2 ? 1 : -1) * (0.08 + 0.45 * q) * (0.6 + 0.4 * Math.abs(Math.sin(i * 2.7))), -0.08 * q + Math.cos(i * 1.3) * 0.1 * q, 0.06 + 0.55 * q]} scale={(0.025 + 0.085 * q) * amp}>
        <sphereGeometry args={[1, 10, 8]} />
        <meshStandardMaterial color="#b9b4a4" roughness={1} transparent opacity={0.85 * (1 - q)} />
      </mesh>
    )} />
  </group>
);
const S15: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.0, 1.7, 4.6]} look={[0, 1.4, 0.6]} fov={50} f={f} a={a} />
    <MoonScene t={t} />
    <Astro
      pose={{...idle(f), ...ARMS_UP, smile: 1, mouthOpen: 0.35, eyeWide: 0.4}}
      pos={[0, 0, 0.6]}
      rotY={0}
      t={t}
      noHelmet
      hat={
        <>
          <Pastel p={[0.0, -0.2, 0.3]} r={[-Math.PI / 2 + 0.3, 0, 0]} s={0.5} fry={1} bite />
          <PastelFX f={f} t={t} />
        </>
      }
    />
  </>
);
/* 🌀 "E lembre-se: o pato não sabe que é pato." */
const S16: React.FC<ShotProps> = ({f, a, b, t}) => {
  const k = clamp((f - a) / (b - a));
  return (
    <>
      <Cam pos={[0.0, 1.85, 3.4]} look={[0, 1.75, 0.6]} fov={44} f={f} a={a} punch={10} />
      <MoonScene t={t} />
      <Astro pose={{...idle(f), smile: 0, brow: -0.2, mouthOpen: 0, blink: 0.1}} pos={[0, 0, 0.6]} rotY={0} t={t} />
      <Duck p={[lerp(-1.1, 1.1, k), 2.1 + 0.05 * Math.sin(t * 3), 1.6]} r={[0, Math.PI / 2 - 0.5, 0.25 * Math.sin(t * 2)]} s={0.36} t={t} />
    </>
  );
};
/* final: a girafa na janela (vista de dentro do quarto) */
const WIN: V3 = [0, 2.3, -2.0];
const Bedroom: React.FC = () => {
  const wx0 = -0.8, wx1 = 0.8, wy0 = 1.65, wy1 = 2.95;
  const wall = new THREE.MeshStandardMaterial({color: "#c9b6f2", roughness: 0.85});
  const parts: [number, number, number, number][] = [
    [-4, wx0, 0, 4],
    [wx1, 4, 0, 4],
    [wx0, wx1, 0, wy0],
    [wx0, wx1, wy1, 4],
  ];
  return (
    <group>
      <color attach="background" args={["#0b1030"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 10]} />
        <meshStandardMaterial color="#b0723c" roughness={0.6} />
      </mesh>
      {parts.map(([a0, a1, b0, b1], i) => (
        <mesh key={i} position={[(a0 + a1) / 2, (b0 + b1) / 2, WIN[2]]} material={wall}>
          <boxGeometry args={[a1 - a0, b1 - b0, 0.2]} />
        </mesh>
      ))}
      {[[0, wy1, 1.75, 0.1], [0, wy0, 1.75, 0.1], [wx0, (wy0 + wy1) / 2, 0.1, 1.4], [wx1, (wy0 + wy1) / 2, 0.1, 1.4], [0, (wy0 + wy1) / 2, 0.06, 1.3]].map(([x, y, w, h], i) => (
        <mesh key={"m" + i} position={[x, y, WIN[2] + 0.12]}>
          <boxGeometry args={[w, h, 0.08]} />
          <meshStandardMaterial color="#ffffff" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 2.3, WIN[2] - 4]}>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color="#101a44" emissive="#101a44" emissiveIntensity={0.6} />
      </mesh>
      {Array.from({length: 14}, (_, i) => (
        <mesh key={"s" + i} position={[-3 + (i * 0.47) % 6, 2.0 + ((i * 0.73) % 2.4), WIN[2] - 3.9]}>
          <sphereGeometry args={[0.03, 6, 4]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1.5} />
        </mesh>
      ))}
    </group>
  );
};
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const peek = easeOut(ramp(f, a + 6, a + 24));
  const neck = 0.15;
  const headY = NECK_TOP(neck) + 0.1;
  return (
    <>
      <Cam pos={[0, 2.25, 1.6]} look={[0, 2.25, WIN[2]]} fov={46} f={f} a={a} />
      <hemisphereLight args={["#8090d0", "#202030", 0.6]} />
      <pointLight position={[0, 3.2, 0.5]} intensity={6} distance={8} decay={1.5} color="#ffe2b0" />
      <pointLight position={[0, 2.3, WIN[2] - 0.6]} intensity={3} distance={3} decay={1.5} color="#fff2c0" />
      <Bedroom />
      <Girafa g={{pos: [0, lerp(-1.4, 2.3 - headY, peek), WIN[2] - 1.5], rotY: 0, t, neck, blink: blinkCurve(f + 7), smile: 1, look: [0, -0.2], mouth: 0}} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: ENTAO0, Comp: S1},
  {from: L(1), Comp: S2},
  {from: L(2), Comp: S3},
  {from: L(3), Comp: S4},
  {from: L(4), Comp: S5},
  {from: L(5), Comp: S6},
  {from: L(6), Comp: S7},
  {from: PROGRAMA - 3, Comp: S8},
  {from: GANHA - 2, Comp: S8b},
  {from: L(7), Comp: S9},
  {from: L(8), Comp: S10},
  {from: E8, Comp: S11},
  {from: L(9), Comp: S12},
  {from: L(10), Comp: S13},
  {from: L(11), Comp: S14},
  {from: PB, Comp: S15},
  {from: L(13), Comp: S16},
  {from: L(14), Comp: S17},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_PASTEL} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["pastel", "feira", "segundafeira", "pasteleiro", "girafa", "resfriado", "nariz", "cep", "pescoco", "comprido", "esfria", "boca", "resfriamento", "pescocal", "capo", "carro", "teresina", "quarenta", "oito", "graus", "gelo", "ventilador", "orgulhoso", "programa", "culinaria", "ganha", "gastronomia", "automotiva", "lua", "vento", "bone", "lunar", "meteoro", "comercio", "gravitacional", "parabens", "gasolina", "poeira", "pato", "seguir", "perfil", "casa"]);
const Tag: React.FC<{from: number; to: number; text: string; x: number; y: number}> = ({from, to, text, x, y}) => {
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
const Ono: React.FC<{from: number; to: number; text: string; x: number; y: number; size?: number; color?: string; rot?: number}> = ({from, to, text, x, y, size = 150, color = "#ffd21f", rot = -8}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${rot}deg)`, fontFamily, fontWeight: 900, fontSize: size, color, WebkitTextStroke: "12px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap", letterSpacing: 2}}>
      {text}
    </div>
  );
};
const BigNum: React.FC<{from: number; to: number; text: string; y?: number; size?: number}> = ({from, to, text, y = 330, size = 130}) => <Ono from={from} to={to} text={text} x={540} y={y} size={size} color="#ffffff" rot={-3} />;
/** plaquinha rosa do fato aleatório */
const RandomFact: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: 540, top: 300, transform: `translate(-50%,-50%) scale(${s}) rotate(${-4 + 2 * Math.sin(f / 4)}deg)`, background: "#ff5fb0", color: "#ffffff", fontFamily, fontWeight: 900, fontSize: 60, padding: "14px 34px", borderRadius: 26, border: "7px solid #101018", boxShadow: "0 8px 0 rgba(0,0,0,0.3)", whiteSpace: "nowrap"}}>
      🌀 FATO ALEATÓRIO
    </div>
  );
};
/** mapa do Brasil com Teresina */
const BR: [number, number][] = [[-73.9, -7.3], [-70, -4], [-69.9, 1.7], [-64, 2], [-60, 4.5], [-60, 5.2], [-56, 2], [-51.6, 4.3], [-50, 1.8], [-48, -1.4], [-44.5, -2.6], [-41, -2.9], [-38, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12], [-39, -14.8], [-39.2, -17.7], [-40.7, -21.5], [-42, -23], [-44.6, -23.3], [-47, -24.5], [-48.5, -26.2], [-48.6, -28.5], [-50, -30.5], [-52, -32.5], [-53.4, -33.7], [-53.6, -31.8], [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.5, -23.9], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-60.2, -16.3], [-60.4, -13.8], [-62, -12.8], [-65, -11.8], [-65.3, -9.8], [-68, -10.7], [-70.6, -11], [-72.5, -9.5]];
const proj = (lon: number, lat: number): [number, number] => [100 + (lon + 75) * 22, 330 + (6 - lat) * 22];
const MapTeresina: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const P = proj(-42.8, -5.1);
  const drop = backOut(ramp(f, from + 3, from + 12));
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${proj(lo, la)[0].toFixed(0)} ${proj(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill="#ffc35a" stroke="#c9822a" strokeWidth={8} strokeLinejoin="round" />
        <g transform={`translate(${P[0]},${P[1] - 200 * (1 - drop)})`}>
          <path d="M 0 0 C -26 -36, -30 -70, 0 -78 C 30 -70, 26 -36, 0 0 Z" fill="#e8262d" stroke="#101018" strokeWidth={6} />
          <circle cy={-54} r={11} fill="#ffffff" />
        </g>
      </svg>
      <div style={{position: "absolute", left: P[0], top: P[1] - 160, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 40, padding: "4px 16px"}}>TERESINA</div>
    </AbsoluteFill>
  );
};
const FastFwd: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const a = (f - from) * 0.9;
  return (
    <>
      <div style={{position: "absolute", left: 800, top: 470, fontSize: 110, fontFamily, color: "#ffffff", WebkitTextStroke: "8px #101018", paintOrder: "stroke fill"}}>⏩</div>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        <g transform="translate(220,560)">
          <circle r={95} fill="#ffffff" stroke="#101018" strokeWidth={12} />
          <line x1={0} y1={0} x2={60 * Math.sin(a)} y2={-60 * Math.cos(a)} stroke="#101018" strokeWidth={10} strokeLinecap="round" />
          <line x1={0} y1={0} x2={40 * Math.sin(a / 12)} y2={-40 * Math.cos(a / 12)} stroke="#e8262d" strokeWidth={12} strokeLinecap="round" />
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

/* ======================= vídeo ======================= */
const FXV = 0.3;
const SND: React.FC<{src: string; from: number; dur?: number; v: number; loop?: boolean}> = ({src, from, dur = 60, v, loop}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} loop={loop} />
  </Sequence>
);
const FOLLOW_FROM = L(14) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
const FACTS = [L(1), L(5), L(9), L(13)];
export const VideoPastel: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(3), L(7), L(11)];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapTeresina from={TERESINA - 4} to={QUARENTA - 2} />

      <StageTitle from={L(3) + 4} to={L(4) - 3} lines={["RESFRIAMENTO", "PESCOÇAL"]} />
      <StageTitle from={L(7) + 4} to={L(8) - 3} lines={["GASTRONOMIA", "AUTOMOTIVA"]} />
      <StageTitle from={L(11) + 4} to={L(12) - 3} lines={["COMÉRCIO", "GRAVITACIONAL"]} />
      {FACTS.map((x, i) => (
        <RandomFact key={i} from={x + 2} to={(i === 3 ? L(14) : [L(2), L(6), L(10)][i]) - 3} />
      ))}

      <Ono from={4} to={at(0, "mas") + 6} text="?" x={580} y={560} size={230} color="#ffd21f" rot={8} />
      <Tag from={at(0, "segundafeira") - 2} to={ENTAO0 - 2} text="FEIRA FECHADA" x={540} y={560} />
      <Tag from={GIRAFA0 - 2} to={L(1) - 2} text="GIRAFA PASTELEIRA" x={540} y={520} />
      <Ono from={ESFRIA} to={BOCA - 4} text="BRRR!" x={540} y={460} size={140} color="#9fd8ff" />
      <BigNum from={ESFRIA + 6} to={L(3) - 3} text="-20°C" y={620} size={120} />
      <Ono from={BOCA} to={BOCA + 20} text="TOC!" x={600} y={720} size={120} />
      <BigNum from={QUARENTA} to={L(5) - 3} text="48°C" y={420} size={170} />
      <Ono from={QUARENTA + 10} to={L(5) - 3} text="TSSS!" x={560} y={640} size={110} color="#ff8a1f" />
      <Tag from={at(6, "orgulhoso") - 2} to={PROGRAMA - 5} text="CARRO ORGULHOSO" x={540} y={560} />
      <Tag from={PROGRAMA} to={GANHA - 3} text="CHEF CARRO" x={540} y={380} />
      <BigNum from={GANHA + 4} to={L(7) - 3} text="10 · 10 · 10 · 10" y={330} size={100} />
      <Confetti from={GANHA} to={GANHA + 50} />
      <BigNum from={LUA8} to={E8 - 2} text="384.000 KM" y={330} size={110} />
      <FastFwd from={L(8) + 10} to={E8 - 2} />
      <Tag from={E8 + 4} to={L(9) - 2} text="NENHUMA FEIRA" x={540} y={420} />
      <Tag from={at(10, "feira") - 2} to={METEORO - 4} text="FEIRA LUNAR" x={540} y={400} />
      <Tag from={METEORO} to={L(11) - 2} text="CLIENTE" x={700} y={600} />
      <Ono from={METEORO - 10} to={METEORO + 14} text="FUUUM!" x={600} y={420} size={120} color="#ff8a1f" />
      <Confetti from={PB} to={PB + 120} />
      <Ono from={PB} to={at(12, "voce") - 2} text="PARABÉNS!" x={540} y={380} size={130} color="#ff4d6d" rot={-4} />
      <Sticker from={at(12, "capo")} to={L(13) - 3} x={190} y={420} rot={-6} label="CARRO CHEF">
        <g transform="translate(152,105)">
          <rect x={-70} y={-10} width={140} height={60} rx={20} fill="#e8414f" stroke="#101018" strokeWidth={6} />
          <rect x={-30} y={-70} width={60} height={50} rx={18} fill="#ffffff" stroke="#101018" strokeWidth={5} />
          <circle cx={-45} cy={55} r={16} fill="#1d1f27" />
          <circle cx={45} cy={55} r={16} fill="#1d1f27" />
        </g>
      </Sticker>
      <Sticker from={at(12, "girafa")} to={L(13) - 3} x={540} y={400} rot={4} label="GIRAFA GELADA">
        <g transform="translate(152,105)">
          <rect x={-14} y={-70} width={28} height={110} rx={12} fill="#f3b64a" stroke="#101018" strokeWidth={5} />
          <ellipse cx={0} cy={-80} rx={36} ry={26} fill="#f3b64a" stroke="#101018" strokeWidth={5} />
          <path d="M -10 -60 l 20 0 l -10 18 z" fill="#a8d8ff" stroke="#101018" strokeWidth={3} />
        </g>
      </Sticker>
      <Sticker from={at(12, "lua")} to={L(13) - 3} x={890} y={430} rot={6} label="POEIRA DE LUA">
        <g transform="translate(152,105)">
          <circle r={60} fill="#d9d4c0" stroke="#101018" strokeWidth={6} />
          <circle cx={-20} cy={-15} r={12} fill="#b8b29a" />
          <circle cx={22} cy={18} r={9} fill="#b8b29a" />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      <FollowCard from={FOLLOW_FROM} to={TOTAL_PASTEL - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozpastel.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.18} />
      ))}
      {titles.map((x) => (
        <SND key={"b" + x} src="sfx7/boing.mp3" from={x + 3} dur={32} v={FXV * 0.75} />
      ))}
      {FACTS.map((x) => (
        <SND key={"r" + x} src="sfx10/ding.mp3" from={x + 2} dur={30} v={FXV * 0.5} />
      ))}
      <SND src="sfx11/wind.mp3" from={0} dur={ENTAO0} v={FXV * 0.3} />
      <SND src="sfx3/ring.mp3" from={ENTAO0 + 4} dur={30} v={FXV * 0.35} />
      <SND src="sfx9/quake.mp3" from={ENTAO0 + 10} dur={GIRAFA0 - ENTAO0} v={FXV * 0.3} />
      <SND src="sfx8/coo.mp3" from={L(1) + 6} dur={40} v={FXV * 0.4} />
      <SND src="sfx10/plim.mp3" from={L(2) + 4} dur={30} v={FXV * 0.4} />
      <SND src="sfx7/brr.mp3" from={ESFRIA} dur={40} v={FXV * 0.5} />
      <SND src="sfx10/bonk.mp3" from={BOCA} dur={25} v={FXV * 0.5} />
      <SND src="sfx14/spray.mp3" from={QUARENTA + 8} dur={40} v={FXV * 0.4} />
      <SND src="sfx6/drain.mp3" from={L(5)} dur={L(6) - L(5)} v={FXV * 0.25} />
      <SND src="sfx14/buzina.mp3" from={at(6, "orgulhoso")} dur={30} v={FXV * 0.4} />
      <SND src="sfx2/cheer.mp3" from={GANHA} dur={60} v={FXV * 0.45} />
      <SND src="sfx14/buzina.mp3" from={L(7) + 8} dur={30} v={FXV * 0.4} />
      <SND src="sfx11/rocket.mp3" from={L(8) + 6} dur={E8 - L(8)} v={FXV * 0.5} />
      <SND src="sfx11/rocket.mp3" from={METEORO - 28} dur={34} v={FXV * 0.4} />
      <SND src="sfx2/boom.mp3" from={METEORO + 2} dur={40} v={FXV * 0.3} />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FXV * 0.6} />
      <SND src="sfx9/yay.mp3" from={PB} dur={60} v={FXV * 0.45} />
      {["capo", "girafa", "lua"].map((w, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={at(12, w)} dur={22} v={FXV * 0.45} />
      ))}
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
