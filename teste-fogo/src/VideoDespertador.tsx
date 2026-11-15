import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, Rooster, BeachChair, Umbrella as Umbrella5, V3} from "./Sets5";
import {sm, rbox, RoomShell} from "./Sets9";
import {Triangle} from "./Sets18";
import {BigJet, SkyClouds, Yard, Square} from "./Sets19";
import {Bg} from "./Sets20";
import {AlarmClock, SoundRings, Nightstand, Beach, Coconut, Shako, BandDrum, Cornet, Bear, Cave, Sheep, Fence, Cardboard} from "./Sets21";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingDespertador.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_DESPERTADOR = F(words[words.length - 1].e + 0.9);

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
const FUGIU0 = at(0, "fugiu");
const GALO0 = at(0, "galo");
const AUDIO1 = at(1, "audio");
const OCULOS1 = at(1, "oculos");
const CINQUENTA2 = at(2, "cinquenta");
const VINTE2 = at(2, "vinte");
const TRIANGULO2 = at(2, "triangulo");
const ATRASADO2 = at(2, "atrasado");
const ACORDA3 = at(3, "acorda");
const URSO3 = at(3, "urso");
const RUSSIA3 = at(3, "russia");
const CONTAR5 = at(5, "contar");
const TAMBEM5 = at(5, "tambem");
const AVIAO6 = at(6, "aviao");
const MORAR6 = at(6, "morar");
const CAMA6 = at(6, "cama");
const TAPETE6 = at(6, "tapete");
const RONCA7 = at(7, "ronca");
const ESCONDERIJO7 = at(7, "esconderijo");
const VOLTA7 = at(7, "volta");
const TOCA9 = at(9, "toca");
const RONCA9 = at(9, "ronca");
const FANFARRA9 = at(9, "fanfarra");
const PARABENS10 = at(10, "parabens");
const QUATROCENTOS10 = at(10, "quatrocentos");

const BAND: ToyLook = {suit: true, shirt: "#c0392b", pants: "#ffffff", hairStyle: "buzz", hair: "#2a1a10"};
const BAND2: ToyLook = {suit: true, shirt: "#c0392b", pants: "#ffffff", hairStyle: "buzz", hair: "#101018", skin: "#c98f62"};
const CORNET_R: V3 = [Math.PI / 2, 0, 0];
const NS: V3 = [0.15, 0, -2.25];
const WINX = 1.55;

/** quarto (com janela aberta) + cama + criado-mudo */
const Room: React.FC<{mark?: boolean; night?: boolean}> = ({mark = true, night = false}) => (
  <>
    <Bg c={night ? "#1a2244" : "#9fd8ff"} />
    <RoomShell wall={night ? "#4a5a8a" : "#a8d8f0"} accent="#3a86ff" openWindow />
    <group position={[-1.3, 0, -1.2]}>
      <mesh position={[0, 0.3, 0]} geometry={rbox(1.6, 0.4, 2.6, 0.06)} material={sm("#8a5a33", 0.6)} castShadow receiveShadow />
      <mesh position={[0, 0.58, 0]} geometry={rbox(1.5, 0.2, 2.5, 0.08)} material={sm("#ffffff", 0.8)} castShadow />
      <mesh position={[0, 0.72, -0.95]} geometry={rbox(1.0, 0.18, 0.45, 0.08)} material={sm("#fff4c8", 0.8)} castShadow />
      <mesh position={[0, 1.0, -1.3]} geometry={rbox(1.6, 1.4, 0.12, 0.04)} material={sm("#8a5a33", 0.6)} castShadow />
      <mesh position={[0, 0.7, 0.45]} geometry={rbox(1.56, 0.1, 1.5, 0.05)} material={sm("#ff7b54", 0.8)} castShadow />
    </group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.9, 0.012, 0.6]} material={sm("#e8414f", 0.9)}>
      <circleGeometry args={[1.1, 28]} />
    </mesh>
    <Nightstand p={NS} mark={mark} />
  </>
);
const RoomLights: React.FC<{night?: boolean}> = ({night = false}) => (
  <>
    <hemisphereLight args={[night ? "#9fb0ff" : "#fff6e6", "#b08a60", night ? 0.6 : 1.0]} />
    <pointLight position={[0.3, 3.0, 1.2]} intensity={night ? 6 : 9} distance={10} decay={1.4} castShadow />
  </>
);
/** o menino deitado na cama (cabeça no travesseiro) */
const BoyInBed: React.FC<{f: number; t: number; extra?: Pose; headExtra?: React.ReactNode}> = ({f, t, extra = {}, headExtra}) => (
  <group position={[-1.3, 0.74, 0.1]} rotation={[-Math.PI / 2, 0, 0]}>
    <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, blink: 1, ...extra}} look={BOY} headExtra={headExtra} />
  </group>
);

/* =================== o despertador foge =================== */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - (FUGIU0 - 10)) / 40);
  const p: V3 = k < 0.5 ? [lerp(NS[0], WINX, k * 2), 0.6 + Math.sin(k * 2 * Math.PI) * 0.6 + k * 1.0, lerp(NS[2], -2.45, k * 2)] : [WINX, 1.38 + (k - 0.5) * 0.4, -2.45 - (k - 0.5) * 2.4];
  return (
    <>
      <Cam pos={[0.5, 1.9, 2.6]} look={[-0.25, 0.9, -1.4]} fov={58} f={f} a={a} />
      <RoomLights />
      <Room />
      <BoyInBed f={f} t={t} />
      {f >= FUGIU0 - 10 ? <AlarmClock p={p} rotY={-0.6} s={1.3} t={t} legs walk={t * 12} bundle /> : <AlarmClock p={[NS[0], 0.6, NS[2]]} s={1.3} t={t} />}
    </>
  );
};
const S0b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 0.9, 2.6]} look={[0, 0.6, 0]} fov={46} f={f} a={a} />
    <DayOut />
    <Yard />
    <Rooster p={{pos: [0, 0, 0], rotY: 0.3, t, blink: blinkCurve(f), chest: 0.6}} s={1.4} />
  </>
);
/* o galo de férias */
const S1: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.2, 3.4]} look={[0, 0.7, 0]} fov={50} f={f} a={a} />
    <DayOut />
    <Beach t={t} />
    <Umbrella5 p={[-0.9, 0, -0.6]} />
    <BeachChair p={[0, 0, 0]} rotY={0} />
    <Rooster p={{pos: [0, 0.28, 0.05], rotY: 0, t, blink: f >= OCULOS1 ? 0 : blinkCurve(f), sit: 1, glasses: f >= OCULOS1 - 4 ? 1 : 0, beakOpen: f >= AUDIO1 ? 0.5 + 0.4 * Math.sin(t * 12) : 0}} s={1.3} />
    <Coconut p={[0.7, 0.45, 0.2]} s={1.5} />
    <mesh position={[0.7, 0.2, 0.2]} material={sm("#ffffff", 0.5)}>
      <cylinderGeometry args={[0.18, 0.18, 0.4, 12]} />
    </mesh>
  </>
);
/* a fanfarra */
const Bandsman: React.FC<{p: V3; f: number; t: number; i: number; drum: boolean; walk?: number; rotY?: number; look?: ToyLook}> = ({p, f, t, i, drum, walk = 1, rotY = Math.PI / 2, look}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    {drum ? (
      <>
        <Toy pose={{...idle(f + i * 7), pos: [0, 0, 0], rotY: 0, walk: t * 8 + i, walkAmt: walk, rShoulder: [-0.9 + 0.3 * Math.sin(t * 16 + i), 0.3, -0.2], rElbow: -1.2, lShoulder: [-0.9 + 0.3 * Math.cos(t * 16 + i), -0.3, 0.2], lElbow: -1.2, brow: -0.3}} look={look ?? (i % 2 ? BAND2 : BAND)} headExtra={<Shako />} />
        <BandDrum p={[0, 0.85, 0.32]} t={t + i} />
      </>
    ) : (
      <HandToy pose={{...idle(f + i * 7), pos: [0, 0, 0], rotY: 0, walk: t * 8 + i, walkAmt: walk, rShoulder: [-1.75, 0.25, 0], rElbow: -1.6, brow: -0.3}} look={look ?? (i % 2 ? BAND2 : BAND)} headExtra={<Shako />} item={<Cornet p={[0, 0.02, 0.06]} r={CORNET_R} s={1.6} />} />
    )}
  </group>
);
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const x = s * 1.0;
  const late = f >= TRIANGULO2 - 4;
  return (
    <>
      <Cam pos={[x + 0.2, 2.0, 9.0]} look={[x - 1.3, 1.1, 0.8]} fov={56} f={f} a={a} />
      <DayOut x={x} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      {Array.from({length: 8}, (_, i) => (
        <Bandsman key={i} p={[x - (i % 4) * 0.9, 0, 0.4 + Math.floor(i / 4) * 1.0]} f={f} t={t} i={i} drum={i < 4} />
      ))}
      {late && (
        <group position={[x - 3.6 - 1.6 * (1 - clamp((f - TRIANGULO2) / 40)), 0, 1.4]} rotation={[0, Math.PI / 2, 0]}>
          <HandToy pose={{...idle(f), ...RUN(t), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.6, 0.3, 0], rElbow: -0.6, mouthOpen: 0.6, eyeWide: 1}} look={BAND} headExtra={<Shako />} item={<Triangle p={[0, -0.05, 0.08]} />} />
        </group>
      )}
    </>
  );
};
/* a fanfarra acorda a cidade */
const S3a: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 6, 14]} look={[0, 1.5, 0]} fov={56} f={f} a={a} />
    <DayOut />
    <Town t={t} galo={false} variant="nova" flat clouds />
    {Array.from({length: 6}, (_, i) => (
      <Bandsman key={i} p={[-1.2 + (i % 3) * 1.2, 0, 0.6 + Math.floor(i / 3) * 1.0]} f={f} t={t} i={i} drum={i < 3} walk={0} rotY={0} />
    ))}
    <SoundRings p={[0, 1.5, 0.8]} t={t} size={6} />
  </>
);
/* o urso na caverna */
const BearCave: React.FC<{f: number; a: number; t: number; eyes: number}> = ({f, a, t, eyes}) => (
  <>
    <Cam pos={[0.2, 1.6, 4.2]} look={[0, 0.8, -0.6]} fov={50} f={f} a={a} />
    <Bg c="#cfe8ff" />
    <hemisphereLight args={["#ffffff", "#8a9aaa", 1.0]} />
    <directionalLight position={[3, 6, 5]} intensity={1.8} castShadow />
    <Cave />
    <Bear p={[0, 0, -0.6]} rotY={0} t={t} eyes={eyes} lie={eyes < 0.5 ? 0.0 : 0} snore={eyes < 0.5 ? 1 : 0} />
  </>
);
const S3b: React.FC<ShotProps> = ({f, a, t}) => <BearCave f={f} a={a} t={t} eyes={f >= RUSSIA3 + 22 ? 1 : 0} />;
const S4: React.FC<ShotProps> = ({f, a, t}) => <BearCave f={f} a={a} t={t} eyes={1} />;
/* insônia e carneirinhos */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const leave = f >= TAMBEM5 + 6;
  return (
    <>
      <Cam pos={[0.3, 1.5, 5.4]} look={[0, 0.7, -0.2]} fov={52} f={f} a={a} />
      <Bg c="#1a2244" />
      <hemisphereLight args={["#9fb0ff", "#30304a", 0.8]} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} color="#cfd8ff" castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a7a4a", 0.95)} receiveShadow>
        <planeGeometry args={[40, 40]} />
      </mesh>
      <Bear p={[-1.0, 0, -1.4]} rotY={0.5} t={t} eyes={1} />
      <Fence p={[0.8, 0, 0.2]} />
      {!leave
        ? [0, 1, 2].map((i) => {
            const q = ((t - a / FPS) * 0.7 + i / 3) % 1;
            const x = lerp(-0.6, 2.2, q);
            return <Sheep key={i} p={[x, 0, 0.2]} rotY={Math.PI / 2} s={1.0} t={t} walk={1} jump={Math.max(0, Math.sin((q - 0.3) * Math.PI / 0.4)) * 0.8 * (q > 0.3 && q < 0.7 ? 1 : 0)} />;
          })
        : [0, 1, 2].map((i) => <Sheep key={i} p={[0.4 + i * 0.7 + (f - TAMBEM5 - 6) * 0.04, 0, 1.0 - i * 0.4]} rotY={Math.PI / 2} s={1.0} t={t} walk={1} bag />)}
    </>
  );
};
/* o urso pega um avião */
const S6a: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const x = s * 3;
  return (
    <>
      <Cam pos={[x + 0.9, 1.6, 6.2]} look={[x + 0.9, 1.4, 0]} fov={54} f={f} a={a} punch={4} />
      <SkyClouds x={x} />
      <hemisphereLight args={["#ffffff", "#9fc8ff", 1.2]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <BigJet p={[x, 0.9, -0.6]} s={0.75} />
      <Bear p={[x + 0.9, 1.5, -0.6]} rotY={Math.PI / 2 - 0.5} t={t} eyes={1} s={0.55} />
    </>
  );
};
/* o urso mora no seu quarto */
const S6b: React.FC<ShotProps> = ({f, a, t}) => {
  const tap = f >= TAPETE6 - 6;
  return (
    <>
      <Cam pos={tap ? [1.6, 2.4, 2.6] : [-0.5, 2.1, 3.0]} look={tap ? [0.8, 0.3, 0.4] : [-1.3, 0.8, -1.0]} fov={54} f={f} a={tap ? TAPETE6 - 6 : a} />
      <RoomLights night />
      <Room night />
      <Bear p={[-1.3, 0.42, -0.9]} rotY={0} t={t} eyes={f >= CAMA6 ? 0 : 1} lie={0} snore={f >= CAMA6 ? 1 : 0} s={0.95} />
      {tap && (
        <group position={[0.9, 0.14, 1.3]} rotation={[-Math.PI / 2, 0, 0]}>
          <Toy pose={{...idle(f), pos: [0, 0, 0], rotY: 0, blink: 0, eyeWide: 0.6, brow: 1, mouthOpen: 0.2}} look={BOY} />
        </group>
      )}
    </>
  );
};
/* o ronco e o despertador escondido */
const S7a: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[-0.3, 1.7, 1.6]} look={[-1.3, 0.9, -1.4]} fov={52} f={f} a={a} />
    <RoomLights night />
    <Room night />
    <Bear p={[-1.3, 0.42, -0.9]} rotY={0} t={t} eyes={0} lie={0} snore={1} s={0.95} />
    {f >= RONCA7 - 2 && <SoundRings p={[-1.1, 1.0, -0.2]} t={t} color="#ffffff" size={1.2} vertical />}
  </>
);
const S7b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 0.8, 2.6]} look={[0, 0.4, 0]} fov={48} f={f} a={a} />
    <DayOut />
    <Square />
    <Cardboard p={[0, 0, 0]} s={1.2} />
    <AlarmClock p={[0, 0.42, 0.05]} s={1.1} t={t} scared={1} />
    <SoundRings p={[-2.5, 1.2, -1]} t={t} color="#ffffff" size={1.6} vertical />
  </>
);
const S7c: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const x = -2 + s * 3.2;
  return (
    <>
      <Cam pos={[x + 0.2, 1.0, 4.8]} look={[x, 0.45, 1.4]} fov={50} f={f} a={a} />
      <DayOut x={x} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <AlarmClock p={[x, 0, 1.4]} rotY={Math.PI / 2} s={1.6} t={t} legs walk={t * 22} scared={1} />
      <SpeedLines p={[x, 0, 1.4]} />
    </>
  );
};
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.3, 1.4]} look={[0.15, 0.8, -2.2]} fov={48} f={f} a={a} />
    <RoomLights />
    <Room mark={false} />
    <AlarmClock p={[NS[0], 0.6, NS[2]]} s={1.3} t={t} scared={0.3} />
  </>
);
/* 6:00, 6:05, 6:10 */
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const ring = f >= TOCA9 - 2 ? 1 : 0;
  const snore = f >= RONCA9 - 2;
  const band = f >= FANFARRA9 - 2;
  return (
    <>
      <Cam pos={[0.0, 1.9, 2.9]} look={[-0.1, 1.1, -1.6]} fov={62} f={f} a={a} />
      <RoomLights />
      <Room mark={false} />
      <Bear p={[-1.3, 0.42, -0.9]} rotY={0} t={t} eyes={0} lie={0} snore={snore ? 1 : 0} s={0.95} />
      <AlarmClock p={[NS[0], 0.6, NS[2]]} s={1.3} t={t} ring={ring} />
      {ring > 0 && <SoundRings p={[NS[0], 0.95, NS[2] + 0.1]} t={t} size={0.5} vertical />}
      {snore && <SoundRings p={[-1.1, 1.0, -0.2]} t={t + 0.3} color="#ffffff" size={0.9} vertical />}
      {band &&
        [0, 1, 2].map((i) => <Bandsman key={i} p={[WINX - 0.45 + i * 0.45, 0, -3.4]} f={f} t={t} i={i} drum={i !== 1} walk={0} rotY={0} />)}
    </>
  );
};
/* parabéns: olheiras e o colega de 400 kg */
const DarkCircles: React.FC = () => (
  <group>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.11 * sd, -0.1, 0.285]} scale={[0.06, 0.025, 0.01]} material={sm("#6b4a8a", 0.6)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
    ))}
  </group>
);
const S10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.1, 1.5, 2.9]} look={[-0.2, 1.0, -0.6]} fov={56} f={f} a={a} />
    <RoomLights />
    <Room mark={false} />
    <Toy pose={{...idle(f), pos: [0.35, 0, 0.1], rotY: -0.2, blink: 0.55, mouthOpen: 0.15, brow: 0.4}} look={BOY} headExtra={<DarkCircles />} />
    <Bear p={[-0.75, 0, -0.3]} rotY={0.7} t={t} eyes={1} />
  </>
);
/* final: a fanfarra na janela às 5 da manhã */
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.9, 1.7, 1.4]} look={[1.3, 1.5, -2.6]} fov={52} f={f} a={a} />
    <RoomLights night />
    <Room mark={false} night />
    {[0, 1, 2].map((i) => <Bandsman key={i} p={[WINX - 0.45 + i * 0.45, 0, -3.4]} f={f} t={t} i={i} drum={i !== 1} walk={0} rotY={0} />)}
    <SoundRings p={[WINX, 1.9, -2.3]} t={t} size={0.8} vertical />
  </>
);

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: GALO0 - 6, Comp: S0b},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3a},
  {from: URSO3 - 4, Comp: S3b},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5},
  {from: L(6), Comp: S6a},
  {from: MORAR6 - 6, Comp: S6b},
  {from: L(7), Comp: S7a},
  {from: ESCONDERIJO7 - 4, Comp: S7b},
  {from: VOLTA7 - 4, Comp: S7c},
  {from: L(8), Comp: S8},
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
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_DESPERTADOR} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["acordar", "cedo", "despertador", "fugiu", "galo", "ferias", "praia", "oculos", "escuros", "audio", "volto", "marco", "fanfarra", "militar", "cinquenta", "tambores", "vinte", "cornetas", "triangulo", "atrasado", "alto", "bairro", "cidade", "urso", "hibernando", "russia", "despertar", "continental", "insonia", "carneirinhos", "embora", "aviao", "morar", "quarto", "cama", "tapete", "ronca", "esconderijo", "assustado", "volta", "relogio", "prodigo", "seis", "cinco", "dez", "parabens", "vida", "colega", "quatrocentos", "quilos", "seguir", "perfil", "janela"]);
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
const CONTS: [number, number][][] = [
  [[-168, 66], [-140, 70], [-95, 72], [-80, 63], [-60, 55], [-55, 48], [-70, 43], [-76, 35], [-81, 25], [-97, 26], [-105, 20], [-90, 15], [-83, 9], [-78, 8], [-92, 15], [-105, 22], [-117, 32], [-124, 40], [-124, 48], [-135, 58], [-150, 60], [-165, 60]],
  [[-78, 8], [-60, 10], [-50, 0], [-35, -6], [-40, -22], [-48, -28], [-58, -35], [-65, -42], [-68, -52], [-72, -50], [-74, -40], [-71, -30], [-70, -18], [-76, -12], [-81, -5], [-80, 0]],
  [[-10, 36], [-9, 43], [-2, 44], [-5, 48], [2, 51], [8, 54], [10, 58], [5, 62], [14, 67], [25, 71], [40, 68], [45, 55], [40, 45], [28, 41], [22, 38], [15, 40], [12, 44], [5, 43], [0, 38]],
  [[-17, 15], [-17, 21], [-10, 30], [-5, 36], [10, 37], [20, 32], [32, 31], [35, 28], [43, 12], [51, 11], [42, 0], [40, -15], [35, -25], [20, -35], [15, -28], [12, -15], [9, -1], [8, 4], [-8, 4], [-13, 8]],
  [[40, 45], [45, 55], [40, 68], [60, 70], [80, 73], [110, 77], [140, 72], [170, 68], [180, 65], [160, 58], [140, 52], [135, 43], [128, 35], [121, 30], [120, 22], [108, 20], [105, 10], [100, 13], [98, 8], [100, 2], [95, 15], [90, 22], [80, 15], [77, 8], [72, 20], [66, 25], [57, 25], [52, 27], [48, 30], [35, 32], [35, 37]],
  [[130, 31], [135, 34], [140, 36], [142, 40], [141, 44], [145, 44], [141, 38], [136, 33]],
  [[114, -22], [122, -18], [130, -12], [137, -12], [142, -11], [146, -18], [153, -26], [150, -37], [140, -38], [131, -32], [115, -34]],
  [[-180, -68], [-120, -72], [-60, -64], [0, -70], [60, -67], [120, -66], [180, -68], [180, -80], [-180, -80]],
];
const projW = (lon: number, lat: number): [number, number] => [540 + lon * 2.85, 760 - lat * 3.3];
const RussiaMap: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const B = projW(-46.6, -23.5), R = projW(60, 58);
  const k = easeInOut(ramp(f, from + 3, from + 22));
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        {CONTS.map((pts, i) => (
          <path key={i} d={pts.map(([lo, la], q) => `${q ? "L" : "M"} ${projW(lo, la)[0].toFixed(0)} ${projW(lo, la)[1].toFixed(0)}`).join(" ") + " Z"} fill={i === 7 ? "#f4f8fc" : "#ffc35a"} stroke="#c9822a" strokeWidth={4} strokeLinejoin="round" />
        ))}
        {[0, 1, 2].map((i) => {
          const rr = 60 + ((k * 900 + i * 300) % 900);
          return <circle key={i} cx={B[0]} cy={B[1]} r={rr} fill="none" stroke="#e8262d" strokeWidth={10} opacity={Math.max(0, 1 - rr / 900)} />;
        })}
      </svg>
      <div style={{position: "absolute", left: B[0], top: B[1], transform: "translate(-50%,-100%)", fontSize: 80}}>🥁</div>
      <div style={{position: "absolute", left: R[0], top: R[1], transform: `translate(-50%,-100%) scale(${pop(f, from + 18, 10)})`, fontSize: 90}}>🐻</div>
      <div style={{position: "absolute", left: R[0], top: R[1] + 20, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 44, padding: "4px 16px", whiteSpace: "nowrap"}}>RÚSSIA</div>
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
  [L(4), ["DESPERTAR", "CONTINENTAL"]],
  [L(8), ["A VOLTA DO", "RELÓGIO PRÓDIGO"]],
];
const FOLLOW_FROM = L(11) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoDespertador: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <RussiaMap from={RUSSIA3 - 2} to={RUSSIA3 + 20} />
      {TITLES.map(([x, lines], i) => {
        const next = [L(5), L(9)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      <Ono from={4} to={FUGIU0 - 3} text="?" x={540} y={470} size={200} color="#ffd21f" rot={8} />
      <Tag from={FUGIU0} to={GALO0 - 8} text="FUGIU" />
      <Bubble from={AUDIO1 + 2} to={L(2) - 2} text="🎤 VOLTO EM MARÇO 🌴" size={48} />
      <BigNum from={CINQUENTA2} to={VINTE2 - 3} text="50 TAMBORES" size={110} />
      <BigNum from={VINTE2} to={TRIANGULO2 - 3} text="20 CORNETAS" size={110} />
      <Tag from={ATRASADO2} to={L(3) - 2} text="ATRASADO" />
      <Ono from={L(3) + 4} to={URSO3 - 6} text="PÓ-PÓ-RÓ-PÓ!" size={110} color="#ffd21f" />
      <BigNum from={CONTAR5 + 6} to={TAMBEM5 - 3} text="1… 2… 3…" size={120} />
      <Tag from={TAMBEM5 + 4} to={L(6) - 2} text="FORAM EMBORA" />
      <Tag from={CAMA6} to={L(7) - 2} text="COLEGA DE QUARTO" />
      <Ono from={RONCA7} to={ESCONDERIJO7 - 6} text="RONC!" size={170} color="#ffffff" />
      <BigNum from={TOCA9} to={at(9, "urso") - 2} text="⏰ 6:00" size={140} />
      <BigNum from={at(9, "urso")} to={at(9, "fanfarra") - 2} text="🐻 6:05" size={140} />
      <BigNum from={at(9, "fanfarra")} to={L(10) - 2} text="🥁 6:10" size={140} />
      <Confetti from={PARABENS10} to={PARABENS10 + 60} />
      <BigNum from={QUATROCENTOS10} to={L(11) - 2} text="400 KG" size={160} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_DESPERTADOR - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozdespertador.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx10/tick.mp3" from={4} dur={FUGIU0 - 4} v={FXV * 0.3} />
      <SND src="sfx7/boing.mp3" from={FUGIU0 - 6} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/rooster.mp3" from={GALO0 - 4} dur={30} v={FXV * 0.3} />
      <SND src="sfx7/beach.mp3" from={L(1)} dur={L(2) - L(1)} v={FXV * 0.25} />
      <SND src="sfx2/march.mp3" from={L(2)} dur={URSO3 - L(2)} v={FXV * 0.3} />
      <SND src="sfx9/roar.mp3" from={RUSSIA3 + 20} dur={30} v={FXV * 0.3} />
      <SND src="sfx14/grilos.mp3" from={L(5)} dur={L(6) - L(5)} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={AVIAO6 - 4} dur={MORAR6 - AVIAO6} v={FXV * 0.3} />
      <SND src="sfx7/snore.mp3" from={CAMA6} dur={ESCONDERIJO7 - CAMA6} v={FXV * 0.35} />
      <SND src="sfx5/run.mp3" from={VOLTA7 - 4} dur={L(8) - VOLTA7} v={FXV * 0.3} />
      <SND src="sfx9/alarm.mp3" from={TOCA9 - 2} dur={at(9, "urso") - TOCA9} v={FXV * 0.3} />
      <SND src="sfx7/snore.mp3" from={RONCA9 - 2} dur={40} v={FXV * 0.35} />
      <SND src="sfx2/march.mp3" from={FANFARRA9 - 2} dur={L(10) - FANFARRA9} v={FXV * 0.3} />
      <SND src="sfx7/confetti.mp3" from={PARABENS10} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/march.mp3" from={L(11) + 60} dur={TOTAL_DESPERTADOR - L(11) - 60} v={FXV * 0.25} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
