import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, Sea, V3} from "./Sets5";
import {sm, rbox, RoomShell} from "./Sets9";
import {Podium} from "./Sets11";
import {Pandeiro} from "./Sets12";
import {PlainCar} from "./Sets14";
import {Cap} from "./Sets15";
import {Capivara, Jacare} from "./Sets17";
import {Accordion, LeatherHat} from "./Sets18";
import {Bg} from "./Sets20";
import {SoundRings, BandDrum} from "./Sets21";
import {Pillow, Mattress, Cavaquinho, PagodeStage, DJDesk, Pelourinho, peloY, Lighthouse, FoamFlood, Skis, Pizza, Pudim, RodizioRoom, Helicopter, BusInterior, Monocle, MayorSash} from "./Sets22";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingTravesseiro.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_TRAVESSEIRO = F(words[words.length - 1].e + 0.9);

/* ---------- personagens ---------- */
const BOY: ToyLook = {hoodie: true};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const ARMS_UP: Pose = {rShoulder: [-2.9, 0, -0.35], rElbow: -0.2, lShoulder: [-2.9, 0, 0.35], lElbow: -0.2};
const HOLD: Pose = {rShoulder: [-1.0, 0.35, 0.05], rElbow: -1.3};
// eslint-disable-next-line
const _SIP: Pose = {rShoulder: [-1.15, 0.12, 0.05], rElbow: -1.8, head: [-0.18, 0, 0]};
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
const Blank: React.FC<ShotProps> = ({f, a}) => (
  <>
    <Cam pos={[0, 1, 3]} look={[0, 1, 0]} fov={50} f={f} a={a} />
    <Bg c="#7fc8ff" />
  </>
);
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
const PAGODE0 = at(0, "pagode");
const ENTAO0 = at(0, "entao");
const JACARE0 = at(0, "jacare");
const ACORDA1 = at(1, "acorda");
const FOGE1 = at(1, "foge");
const CAPIVARA1 = at(1, "capivara");
const MONOCULO1 = at(1, "monoculo");
const ESTADOS3 = at(3, "estados");
const PARA3 = at(3, "para");
const FOME3 = at(3, "fome");
const SETENTA4 = at(4, "setenta");
const TOCAM4 = at(4, "tocam");
const EMOCIONA4 = at(4, "emociona");
const ESPUMA5 = at(5, "espuma");
const ALAGA5 = at(5, "alaga");
const NEVE7 = at(7, "neve");
const ESQUIAR7 = at(7, "esquiar");
const FERIADO8 = at(8, "feriado");
const HELICOPTERO8 = at(8, "helicoptero");
const SOBREMESA8 = at(8, "sobremesa");
const PARABENS10 = at(10, "parabens");
const TRAVESSEIRO10 = at(10, "travesseiro");
const COLCHAO10 = at(10, "colchao");
const SALVADOR10 = at(10, "salvador");
const DORMIU10 = at(10, "dormiu");
const PANDEIRO10 = at(10, "pandeiro");

const BAND: ToyLook[] = [
  {shirt: "#ffffff", pants: "#101018", hairStyle: "buzz", hair: "#101018", skin: "#8a5a3a"},
  {shirt: "#ffd21f", pants: "#2e86de", hairStyle: "curly", hair: "#101018", skin: "#a8744a"},
  {shirt: "#2ecc71", pants: "#ffffff", hairStyle: "buzz", hair: "#2a1a10", skin: "#c98f62"},
];
const SANF: ToyLook = {shirt: "#e8414f", pants: "#5a3a20", hairStyle: "buzz", hair: "#2a1a10"};
const TOURISTS: ToyLook[] = [
  {shirt: "#ff8a1f", pants: "#2e86de", hairStyle: "ponytail", hair: "#e3c27a", skin: "#f1c8a0", lips: "#c0392b"},
  {shirt: "#9b59b6", pants: "#101018", hairStyle: "buzz", hair: "#e3c27a", skin: "#f1c8a0"},
  {shirt: "#2ecc71", pants: "#3a3f4a", hairStyle: "curly", hair: "#5a3a20"},
];
const PREFEITO: ToyLook = {suit: true, shirt: "#1f2330", pants: "#1f2330", hairStyle: "bald", skin: "#d9a173"};
const INSTR_R: V3 = [Math.PI / 2, 0, 0];

/* =================== quarto sem travesseiro =================== */
const Bedroom: React.FC<{night?: boolean}> = ({night = true}) => (
  <>
    <Bg c={night ? "#1a2244" : "#9fd8ff"} />
    <RoomShell wall={night ? "#4a5a8a" : "#a8d8f0"} accent="#3a86ff" openWindow />
    <group position={[-0.6, 0, -1.2]}>
      <mesh position={[0, 0.3, 0]} geometry={rbox(1.6, 0.4, 2.6, 0.06)} material={sm("#8a5a33", 0.6)} castShadow receiveShadow />
      <mesh position={[0, 0.58, 0]} geometry={rbox(1.5, 0.2, 2.5, 0.08)} material={sm("#ffffff", 0.8)} castShadow />
      <mesh position={[0, 1.0, -1.3]} geometry={rbox(1.6, 1.4, 0.12, 0.04)} material={sm("#8a5a33", 0.6)} castShadow />
      <mesh position={[0, 0.7, 0.45]} geometry={rbox(1.56, 0.1, 1.5, 0.05)} material={sm("#ff7b54", 0.8)} castShadow />
    </group>
  </>
);
const NightLights: React.FC = () => (
  <>
    <hemisphereLight args={["#9fb0ff", "#30304a", 0.7]} />
    <pointLight position={[0.3, 2.8, 1.2]} intensity={6} distance={10} decay={1.4} castShadow />
  </>
);
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.6, 2.0, 2.4]} look={[-0.6, 0.8, -1.4]} fov={54} f={f} a={a} />
    <NightLights />
    <Bedroom />
    <group position={[-0.6, 0.74, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
      <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, blink: 0, eyeWide: 0.6, brow: 0.8, mouthOpen: 0.2}} look={BOY} />
    </group>
  </>
);
/* o travesseiro no pagode em Salvador */
const StageScene: React.FC<{f: number; a: number; t: number; close?: boolean}> = ({f, a, t, close}) => (
  <>
    <Cam pos={close ? [0, 1.5, 2.6] : [0, 2.0, 6.0]} look={close ? [0, 1.25, -0.2] : [0, 1.5, -0.3]} fov={54} f={f} a={a} />
    <Bg c="#160c30" />
    <hemisphereLight args={["#ffd0f0", "#30204a", 0.8]} />
    <spotLight position={[0, 5, 3]} angle={0.6} penumbra={0.6} intensity={40} distance={14} castShadow />
    <PagodeStage p={[0, 0, -0.5]} t={t} />
    <HandToy pose={{...idle(f), pos: [-1.6, 0.5, -0.6], rotY: 0.3, rShoulder: [-1.2, 0.5, 0.1], rElbow: -1.2, lShoulder: [-0.9, -0.4, 0.2], lElbow: -1.3, smile: 1}} look={BAND[0]} item={<Cavaquinho p={[0, 0.02, 0.06]} r={[0, 0, 0.8]} s={1.6} />} />
    <HandToy pose={{...idle(f + 7), pos: [1.6, 0.5, -0.6], rotY: -0.3, rShoulder: [-1.5 + 0.3 * Math.sin(t * 12), 0.2, 0.1], rElbow: -0.8, smile: 1}} look={BAND[1]} item={<Pandeiro p={[0, 0.02, 0.06]} s={1.4} />} />
    <Toy pose={{...idle(f + 13), pos: [0.9, 0.5, -1.1], rotY: -0.2, rShoulder: [-0.9 + 0.3 * Math.sin(t * 14), 0.3, -0.2], rElbow: -1.2, lShoulder: [-0.9 + 0.3 * Math.cos(t * 14), -0.3, 0.2], lElbow: -1.2, smile: 1}} look={BAND[2]} />
    <BandDrum p={[0.9, 1.35, -0.78]} t={t} s={1.3} />
    <Pillow p={[0, 1.15, -0.2]} t={t} s={1.4} bounce={1} mouth={0.4 + 0.4 * Math.abs(Math.sin(t * 10))} />
    <Pandeiro p={[0.62, 1.1, -0.1]} r={[0, 0, 0.3 * Math.sin(t * 12)]} s={1.6} />
  </>
);
const S0b: React.FC<ShotProps> = ({f, a, t}) => <StageScene f={f} a={a} t={t} />;
/* o DJ do bairro, que é um jacaré de boné */
const JacareDJ: React.FC<{f: number; a: number; t: number; loud?: boolean; room?: boolean}> = ({f, a, t, loud, room}) => (
  <>
    <Cam pos={[0.0, 1.8, 3.0]} look={[-0.1, 1.15, 0]} fov={60} f={f} a={a} />
    {room ? (
      <>
        <NightLights />
        <Bedroom />
      </>
    ) : (
      <>
        <DayOut />
        <Town t={t} galo={false} variant="nova" flat clouds />
      </>
    )}
    <DJDesk p={[0, 0, 0.6]} t={t} />
    <mesh position={[0, 0.55, -0.1]} geometry={rbox(1.4, 1.1, 1.0, 0.04)} material={sm("#3a3f4a", 0.6)} />
    <group position={[-0.35, 1.1, -0.1]} rotation={[0, 0, loud ? 0.06 * Math.sin(t * 16) : 0]}>
      <Jacare p={[0, 0, 0]} rotY={Math.PI / 2} s={1.15} t={t} />
      <group position={[0.98, 0.36, 0]} rotation={[0, Math.PI / 2, 0]} scale={0.62}>
        <Cap color="#ffd21f" />
      </group>
    </group>
    {loud && <SoundRings p={[0, 1.4, 0.8]} t={t} size={2.2} vertical />}
  </>
);
const S0c: React.FC<ShotProps> = ({f, a, t}) => <JacareDJ f={f} a={a} t={t} />;
const S1a: React.FC<ShotProps> = ({f, a, t}) => <JacareDJ f={f} a={a} t={t} loud />;
/* o colchão acorda e foge de Uber */
const S1b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.6, 2.0, 2.6]} look={[-0.6, 0.8, -1.2]} fov={54} f={f} a={a} />
    <NightLights />
    <Bedroom />
    <Mattress p={[-0.6, 0.9 + 0.08 * Math.abs(Math.sin(t * 20)), -1.0]} t={t} mood="scared" mouth={0.6} />
    <SoundRings p={[0.6, 1.6, -1.6]} t={t} size={1.2} vertical color="#ffffff" />
  </>
);
const UberCar: React.FC<{x: number; t: number; f: number}> = ({x, t, f}) => (
  <group position={[x, 0, 1.2]} rotation={[0, Math.PI / 2, 0]}>
    <PlainCar p={[0, 0, 0]} color="#101018" />
    <Mattress p={[0, 1.25, -0.2]} r={[0, 0, 0]} s={0.85} t={t} mood="happy" />
    <group position={[-0.8, 0.78, 0.15]} rotation={[0, -Math.PI / 2, 0]}>
      <Capivara p={[0, -0.25, -0.3]} rotY={0} s={0.55} t={t} blink={blinkCurve(f)} sit={1} />
      <Monocle p={[0.09, 0.15, 0.12]} s={0.9} />
    </group>
  </group>
);
const S1c: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  const x = -2 + s2 * 1.2;
  const close = f >= CAPIVARA1 - 4;
  return (
    <>
      <Cam pos={close ? [x + 0.6, 1.3, 4.6] : [x + 0.8, 2.2, 7.4]} look={close ? [x + 0.1, 0.95, 1.9] : [x, 1.0, 1.2]} fov={close ? 46 : 56} f={f} a={close ? CAPIVARA1 - 4 : a} />
      <DayOut x={x} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <UberCar x={x} t={t} f={f} />
    </>
  );
};
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  const x = s2 * 3;
  return (
    <>
      <Cam pos={[x - 3.5, 2.4, 6.5]} look={[x, 1.0, 1.2]} fov={56} f={f} a={a} />
      <DayOut x={x} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <UberCar x={x} t={t} f={f} />
    </>
  );
};
/* o rodízio em BH */
const Rodizio: React.FC<{f: number; a: number; t: number; dessert?: boolean; heli?: boolean}> = ({f, a, t, dessert, heli}) => (
  <>
    <Cam pos={[0.3, 1.6, 3.4]} look={[0, 1.0, -0.3]} fov={52} f={f} a={a} />
    <Bg c="#9fd8ff" />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0, 3, 1.5]} intensity={9} distance={10} decay={1.4} castShadow />
    <RodizioRoom />
    <Mattress p={[0, 1.35, -0.85]} r={[Math.PI / 2 - 0.15, 0, 0]} s={0.75} t={t} mood="happy" mouth={0.3 + 0.4 * Math.abs(Math.sin(t * 9))} faceTop />
    {dessert ? <Pudim p={[0, 0.84, 0.15]} s={1.6} /> : [-0.6, 0, 0.6].map((x) => <Pizza key={x} p={[x, 0.84, 0.2]} s={0.9} />)}
    {heli && <Helicopter p={[2.0, 2.0, -3.3]} rotY={Math.PI} s={0.55} t={t} />}
  </>
);
const S3b: React.FC<ShotProps> = ({f, a, t}) => <Rodizio f={f} a={a} t={t} />;
/* setenta sanfoneiros */
const S4a: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 2.6, 7.5]} look={[0, 1.2, 0]} fov={56} f={f} a={a} />
    <DayOut />
    <Town t={t} galo={false} variant="nova" flat clouds />
    {Array.from({length: 12}, (_, i) => {
      const row = Math.floor(i / 4);
      const x = -1.8 + (i % 4) * 1.2 + (row % 2) * 0.3;
      const z = 1.6 - row * 1.3;
      return (
        <group key={i} position={[x, 0, z]}>
          <Toy pose={{...idle(f + i * 7), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.0, 0.5, -0.2], rElbow: -1.4, lShoulder: [-1.0, -0.5, 0.2], lElbow: -1.4, smile: 1, head: [0, 0, 0.15 * Math.sin(t * 3 + i)]}} look={SANF} headExtra={<LeatherHat />} />
          <Accordion p={[0, 1.1, 0.32]} t={t + i * 0.2} />
        </group>
      );
    })}
  </>
);
const S4b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <StageScene f={f} a={a} t={t} close />
  </>
);
const PillowCry: React.FC<{f: number; a: number; t: number; foam: number}> = ({f, a, t, foam}) => (
  <>
    <Cam pos={[0, 1.4, 2.4]} look={[0, 1.15, -0.2]} fov={50} f={f} a={a} />
    <Bg c="#160c30" />
    <hemisphereLight args={["#ffd0f0", "#30204a", 0.9]} />
    <spotLight position={[0, 5, 3]} angle={0.6} penumbra={0.6} intensity={40} distance={14} castShadow />
    <PagodeStage p={[0, 0, -0.5]} t={t} />
    <Pillow p={[0, 1.15, -0.2]} t={t} s={1.4} mood="sad" cry={1} mouth={0.5} />
    {foam > 0 &&
      Array.from({length: 18}, (_, i) => {
        const q = (t * 0.9 + i / 18) % 1;
        const sd = i % 2 ? 1 : -1;
        return (
          <mesh key={i} position={[sd * (0.2 + q * 1.2), 1.1 - q * 0.9 + Math.sin(q * Math.PI) * 0.4, -0.05 + q * 0.6]} scale={(0.06 + q * 0.18) * foam} material={sm("#ffffff", 0.9)}>
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
        );
      })}
    <FoamFlood level={foam * 0.4} w={6} d={3} t={t} c={[0, 0, 0.8]} />
  </>
);
const S4c: React.FC<ShotProps> = ({f, a, t}) => <PillowCry f={f} a={a} t={t} foam={0} />;
const S5a: React.FC<ShotProps> = ({f, a, t}) => <PillowCry f={f} a={a} t={t} foam={clamp((f - ESPUMA5 + 6) / 30)} />;
/* o Farol da Barra alagado de espuma */
const FarolScene: React.FC<{f: number; a: number; t: number; level: number}> = ({f, a, t, level}) => (
  <>
    <Cam pos={[0, 3.2, 14]} look={[0, 3.2, 0]} fov={56} f={f} a={a} />
    <Sky />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
    <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.4} ext={14} />
    <Sea t={t} y={-0.2} z={-20} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 6]} material={sm("#f3d9a0", 0.95)} receiveShadow>
      <planeGeometry args={[60, 20]} />
    </mesh>
    <Lighthouse p={[0, 0, 0]} s={1} t={t} />
    <FoamFlood level={level} w={22} d={16} t={t} c={[0, 0, 3]} />
  </>
);
const S5b: React.FC<ShotProps> = ({f, a, t}) => <FarolScene f={f} a={a} t={t} level={0.2 + 2.2 * easeOut(ramp(f, ALAGA5 - 2, ALAGA5 + 40))} />;
const S6: React.FC<ShotProps> = ({f, a, t}) => <FarolScene f={f} a={a} t={t} level={2.4} />;
/* turistas esquiando no Pelourinho */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const ski = f >= ESQUIAR7 - 6;
  const k = (f - (ESQUIAR7 - 6)) / FPS;
  return (
    <>
      <Cam pos={[0.3, peloY(6) + 1.8, 6]} look={[0, peloY(-2) + 0.6, -2]} fov={56} f={f} a={a} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.4} ext={14} />
      <Pelourinho snow={1} />
      {TOURISTS.map((lk, i) => {
        const z = ski ? -5 + i * 1.1 + ((k * 2.6 + i * 0.4) % 6) : -3 + i * 1.6;
        const x = -1.1 + i * 1.1 + (ski ? 0.4 * Math.sin(k * 3 + i) : 0);
        return (
          <group key={i} position={[x, peloY(z), z]} rotation={[0.18, 0, 0]}>
            <Toy pose={{...idle(f + i * 9), pos: [0, 0, 0], rotY: 0, rShoulder: [-0.6, 0.3, -0.4], rElbow: -0.3, lShoulder: [-0.6, -0.3, 0.4], lElbow: -0.3, smile: 1, eyeWide: f >= NEVE7 ? 0.6 : 0, legLift: ski ? 0.25 : 0}} look={lk} />
            {ski && <Skis />}
          </group>
        );
      })}
    </>
  );
};
/* o prefeito decreta feriado */
const S8a: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.6, 3.6]} look={[0, 1.3, 0]} fov={50} f={f} a={a} />
    <DayOut />
    <Town t={t} galo={false} variant="nova" flat clouds />
    <Podium p={[0, 0, 0.4]} s={1.0} />
    <Toy pose={{...idle(f), pos: [0, 0, -0.1], rotY: 0, rShoulder: f >= FERIADO8 ? [-2.7, 0, -0.3] : [-0.8, 0.4, -0.2], rElbow: -0.3, mouthOpen: 0.3 + 0.3 * Math.abs(Math.sin(t * 9)), smile: 0.6}} look={PREFEITO} headExtra={<MayorSash />} />
  </>
);
const S8b: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  const x = -3 + s2 * 3;
  return (
    <>
      <Cam pos={[x + 0.5, 3.6, 7]} look={[x, 3.2, 0]} fov={54} f={f} a={a} />
      <DayOut x={x} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <Helicopter p={[x, 3.4, 0.5]} rotY={0} s={0.9} t={t} />
    </>
  );
};
const S8c: React.FC<ShotProps> = ({f, a, t}) => <Rodizio f={f} a={a} t={t} dessert heli />;
const S9: React.FC<ShotProps> = ({f, a, t}) => <Rodizio f={f} a={a} t={t} dessert heli />;
/* parabéns: recapitulação e o ônibus */
const BusSleep: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.6, 2.6]} look={[0.1, 1.3, -0.5]} fov={52} f={f} a={a} />
    <Bg c="#9fd8ff" />
    <hemisphereLight args={["#ffffff", "#606878", 1.0]} />
    <pointLight position={[0, 2.9, 1]} intensity={8} distance={8} decay={1.4} castShadow />
    <group rotation={[0, 0, 0.03 * Math.sin(t * 2)]}>
      <BusInterior t={t} />
      <HandToy pose={{...idle(f), pos: [0, 0, -0.4], rotY: 0, blink: 1, mouthOpen: 0.25, rShoulder: [-1.0, 0.7, 0.1], rElbow: -1.6, lShoulder: [-1.0, -0.7, -0.1], lElbow: -1.6, head: [0.2, 0, 0.2]}} look={BOY} item={<Pandeiro p={[0, 0.02, 0.1]} s={1.5} />} />
    </group>
  </>
);
const S10: React.FC<ShotProps> = (p) => {
  const {f} = p;
  if (f >= DORMIU10 - 3) return <BusSleep {...p} a={DORMIU10 - 3} />;
  if (f >= SALVADOR10 - 3) return <S7 {...p} f={ESQUIAR7 + 30 + (f - SALVADOR10)} a={SALVADOR10 - 3} />;
  if (f >= COLCHAO10 - 3) return <Rodizio f={f} a={COLCHAO10 - 3} t={p.t} />;
  if (f >= TRAVESSEIRO10 - 3) return <StageScene f={f} a={TRAVESSEIRO10 - 3} t={p.t} />;
  return <BusSleep {...p} />;
};
/* final: o jacaré DJ no seu quarto */
const S11: React.FC<ShotProps> = ({f, a, t}) => <JacareDJ f={f} a={a} t={t} loud room />;

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: PAGODE0 - 6, Comp: S0b},
  {from: ENTAO0 - 4, Comp: S0c},
  {from: L(1), Comp: S1a},
  {from: ACORDA1 - 6, Comp: S1b},
  {from: FOGE1 - 2, Comp: S1c},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: Blank},
  {from: PARA3 - 4, Comp: S3b},
  {from: L(4), Comp: S4a},
  {from: TOCAM4 + 16, Comp: S4b},
  {from: EMOCIONA4 - 2, Comp: S4c},
  {from: L(5), Comp: S5a},
  {from: ALAGA5 - 4, Comp: S5b},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
  {from: L(8), Comp: S8a},
  {from: HELICOPTERO8 - 4, Comp: S8b},
  {from: SOBREMESA8 - 8, Comp: S8c},
  {from: L(9), Comp: S9},
  {from: L(10), Comp: S10},
  {from: L(11), Comp: S11},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_TRAVESSEIRO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["dormir", "travesseiro", "pagode", "salvador", "dj", "jacare", "bone", "colchao", "acorda", "foge", "uber", "capivara", "monoculo", "fuga", "ortopedica", "tres", "estados", "rodizio", "pizza", "fome", "setenta", "sanfoneiros", "emociona", "chora", "espuma", "farol", "barra", "temporal", "algodao", "turistas", "neve", "esquiar", "pelourinho", "prefeito", "feriado", "helicoptero", "sobremesa", "negociacao", "estofada", "parabens", "esqui", "dormiu", "pe", "onibus", "pandeiro", "seguir", "perfil", "quarto"]);
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
const BR: [number, number][] = [[-73.9, -7.3], [-70, -4], [-69.9, 1.7], [-64, 2], [-60, 4.5], [-60, 5.2], [-56, 2], [-51.6, 4.3], [-50, 1.8], [-48, -1.4], [-44.5, -2.6], [-41, -2.9], [-38, -3.7], [-35.2, -5.5], [-34.8, -7.5], [-35.3, -9.5], [-37.5, -12], [-39, -14.8], [-39.2, -17.7], [-40.7, -21.5], [-42, -23], [-44.6, -23.3], [-47, -24.5], [-48.5, -26.2], [-48.6, -28.5], [-50, -30.5], [-52, -32.5], [-53.4, -33.7], [-53.6, -31.8], [-55.6, -30.8], [-57.6, -30.2], [-56, -28], [-54.6, -25.6], [-54.3, -24], [-55.5, -23.9], [-57.8, -22.1], [-58, -20], [-57.5, -18], [-60.2, -16.3], [-60.4, -13.8], [-62, -12.8], [-65, -11.8], [-65.3, -9.8], [-68, -10.7], [-70.6, -11], [-72.5, -9.5]];
const projBR = (lon: number, lat: number): [number, number] => [100 + (lon + 75) * 22, 330 + (6 - lat) * 22];
const MapTrip: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${projBR(lo, la)[0].toFixed(0)} ${projBR(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  const A = projBR(-38.5, -13), B = projBR(-43.9, -19.9);
  const k = easeInOut(clamp((f - from - 4) / (to - from - 10)));
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill="#ffc35a" stroke="#c9822a" strokeWidth={8} strokeLinejoin="round" />
        <line x1={A[0]} y1={A[1]} x2={lerp(A[0], B[0], k)} y2={lerp(A[1], B[1], k)} stroke="#ffffff" strokeWidth={12} strokeDasharray="18 14" strokeLinecap="round" />
      </svg>
      <div style={{position: "absolute", left: A[0], top: A[1] - 70, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 40, padding: "4px 14px"}}>SALVADOR</div>
      <div style={{position: "absolute", left: B[0], top: B[1] + 30, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 40, padding: "4px 14px", whiteSpace: "nowrap"}}>BELO HORIZONTE 🍕</div>
      <div style={{position: "absolute", left: lerp(A[0], B[0], k), top: lerp(A[1], B[1], k), transform: "translate(-50%,-50%)", fontSize: 90}}>🚗🛏️</div>
    </AbsoluteFill>
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
  [L(2), ["FUGA", "ORTOPÉDICA"]],
  [L(6), ["TEMPORAL", "DE ALGODÃO"]],
  [L(9), ["NEGOCIAÇÃO", "ESTOFADA"]],
];
const FOLLOW_FROM = L(11) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoTravesseiro: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapTrip from={L(3)} to={PARA3 - 5} />
      {TITLES.map(([x, lines], i) => {
        const next = [L(3), L(7), L(10)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      <Ono from={4} to={PAGODE0 - 8} text="?" x={540} y={470} size={200} color="#ffd21f" rot={8} />
      <Tag from={PAGODE0} to={ENTAO0 - 6} text="BANDA DE PAGODE" />
      <Tag from={JACARE0} to={L(1) - 2} text="DJ JACARÉ" />
      <Ono from={L(1) + 6} to={ACORDA1 - 8} text="TUNTS TUNTS!" size={120} color="#ff4d6d" />
      <Tag from={MONOCULO1} to={L(2) - 2} text="MOTORISTA 5 ESTRELAS" />
      <BigNum from={SETENTA4} to={TOCAM4 - 3} text="70" size={200} />
      <Ono from={EMOCIONA4 + 2} to={L(5) - 2} text="SNIF…" size={130} color="#9fe0ff" />
      <Tag from={NEVE7} to={ESQUIAR7 - 3} text="NEVE?" />
      <Bubble from={FERIADO8 - 2} to={HELICOPTERO8 - 6} text="FERIADO!" size={80} />
      <Tag from={SOBREMESA8} to={L(9) - 2} text="PEDIU PUDIM" />
      <Confetti from={PARABENS10} to={PARABENS10 + 60} />
      <Ono from={PANDEIRO10 + 6} to={L(11) - 2} text="ZZZ…" size={130} color="#ffffff" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_TRAVESSEIRO - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("voztravesseiro.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx14/grilos.mp3" from={4} dur={PAGODE0 - 6} v={FXV * 0.3} />
      <SND src="sfx13/pagode.mp3" from={PAGODE0 - 6} dur={ENTAO0 - PAGODE0 + 2} v={FXV * 0.25} />
      <SND src="sfx16/funk.mp3" from={L(1)} dur={ACORDA1 - L(1)} v={FXV * 0.35} />
      <SND src="sfx12/gasp.mp3" from={ACORDA1} dur={30} v={FXV * 0.3} />
      <SND src="sfx14/buzina.mp3" from={FOGE1} dur={30} v={FXV * 0.3} />
      <SND src="sfx3/street.mp3" from={FOGE1} dur={L(3) - FOGE1} v={FXV * 0.2} />
      <SND src="sfx6/chew.mp3" from={FOME3 - 10} dur={30} v={FXV * 0.35} />
      <SND src="sfx14/forro.mp3" from={L(4) + 4} dur={EMOCIONA4 - L(4)} v={FXV * 0.25} />
      <SND src="sfx9/sniffle.mp3" from={EMOCIONA4} dur={30} v={FXV * 0.35} />
      <SND src="sfx10/bubble.mp3" from={ESPUMA5} dur={L(6) - ESPUMA5} v={FXV * 0.3} />
      <SND src="sfx2/wind.mp3" from={ESQUIAR7 - 6} dur={L(8) - ESQUIAR7} v={FXV * 0.25} />
      <SND src="sfx3/crowd.mp3" from={FERIADO8} dur={30} v={FXV * 0.25} />
      <SND src="sfx12/tornado.mp3" from={HELICOPTERO8 - 4} dur={SOBREMESA8 - HELICOPTERO8} v={FXV * 0.3} />
      <SND src="sfx7/confetti.mp3" from={PARABENS10} dur={50} v={FXV * 0.4} />
      <SND src="sfx7/bus.mp3" from={DORMIU10} dur={L(11) - DORMIU10} v={FXV * 0.2} />
      <SND src="sfx7/snore.mp3" from={PANDEIRO10} dur={L(11) - PANDEIRO10} v={FXV * 0.3} />
      <SND src="sfx13/pagode.mp3" from={L(11) + 30} dur={TOTAL_TRAVESSEIRO - L(11) - 30} v={FXV * 0.2} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
