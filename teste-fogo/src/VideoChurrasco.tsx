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
import {Dog, sm, rbox, RoomShell, TV} from "./Sets9";
import {Shades} from "./Sets11";
import {DadHead} from "./Sets12";
import {Umbrella, FireTruck, FireHelmet, SunFace} from "./Sets13";
import {Scooter} from "./Sets8";
import {Airliner, HeadGlasses} from "./Sets17";
import {Granny} from "./Sets18";
import {SkyClouds, Yard} from "./Sets19";
import {Bg, Grill, CoalBag, Skewer, Sausage, SausageRain, Volcano, VolcanoLand, CraterRim, Boat, Water, ZipLine, forecastTex, Baguette, VinaigretteJar, ExcavatorArm, GiantSteak, EarthBall, OrbitRing, LongTable, Hammock, FarofaHill, BigSpoon} from "./Sets20";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingChurrasco.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_CHURRASCO = F(words[words.length - 1].e + 0.9);

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
const VULCAO0 = at(0, "vulcao");
const BARCO1 = at(1, "barco");
const TIROLESA1 = at(1, "tirolesa");
const CRATERA1 = at(1, "cratera");
const DOIS2 = at(2, "dois");
const CHEIRO2 = at(2, "cheiro");
const FOME2 = at(2, "fome");
const ERUPCAO4 = at(4, "erupcao");
const FRANGO4 = at(4, "frango");
const GUARDA5 = at(5, "guardachuvas");
const PREVISAO5 = at(5, "previsao");
const CINQUENTA5 = at(5, "cinquenta");
const ESTADOS7 = at(7, "estados");
const CORRENDO7 = at(7, "correndo");
const DEZ7 = at(7, "dez");
const PATINETE7 = at(7, "patinete");
const BOMBEIROS8 = at(8, "bombeiros");
const PAO8 = at(8, "pao");
const AVENTAL9 = at(9, "avental");
const PA9 = at(9, "pa");
const QUILOS10 = at(10, "quilos");
const ORBITA10 = at(10, "orbita");
const CONHECE12 = at(12, "conhece");
const TRES13 = at(13, "tres");
const TIO13 = at(13, "tio");
const PARABENS14 = at(14, "parabens");
const CARVAO14 = at(14, "carvao");
const COZINHAR14 = at(14, "cozinhar");
const CACHORROS14 = at(14, "cachorros");
const ORBITA14 = at(14, "orbita");
const DOMINGO14 = at(14, "domingo");

/* ---------- personagens extras ---------- */
const VO: ToyLook = {hairStyle: "bun", hair: "#f2f2f2", shirt: "#8e5aa8", pants: "#5a4a6a", skin: "#f1c8a0", lips: "#c0606a", browColor: "#e2e2e2"};
const TIO: ToyLook = {shirt: "#c0392b", plaid: "#1f2a44", pants: "#6b5b45", hairStyle: "buzz", hair: "#2a1a10", belly: 1, skin: "#d9a173"};
const PRIMOS: ToyLook[] = [
  {shirt: "#2ecc71", pants: "#2e86de", hairStyle: "curly", hair: "#2a1a10"},
  {shirt: "#f06292", pants: "#3a3f4a", hairStyle: "pigtails", hair: "#5a3a20", lips: "#c0392b"},
  {shirt: "#ff8a1f", pants: "#101018", hairStyle: "spiky", hair: "#101018"},
];
const PRIMO_X: ToyLook = {shirt: "#101018", pants: "#101018", hairStyle: "buzz", hair: "#101018", skin: "#c98f62"};
const BOMB: ToyLook = {shirt: "#c0392b", pants: "#2a2f3a", hairStyle: "buzz", hair: "#2a1a10"};
const SKEW_R: V3 = [Math.PI / 2, 0, 0];

/* =================== quintal sem carvão =================== */
const Backyard: React.FC<{f: number; t: number; volcano?: number}> = ({f, t, volcano = 1}) => (
  <>
    <DayOut />
    <Yard />
    <Grill p={[-0.95, 0, -0.9]} />
    <CoalBag p={[-1.9, 0, -0.4]} />
    {volcano > 0 && <Volcano p={[5, 0, -40]} s={2.2} t={t} />}
  </>
);
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const pan = easeInOut(ramp(f, VULCAO0 - 4, VULCAO0 + 18));
  return (
    <>
      <Cam pos={[0.2, 1.6, 4.4]} look={[lerp(-0.2, 2.0, pan), lerp(1.2, 3.2, pan), lerp(-0.4, -30, pan)]} fov={54} f={f} a={a} />
      <Backyard f={f} t={t} />
      <HandToy pose={{...idle(f), pos: [0.55, 0, 0.3], rotY: -0.3 + pan * 0.4, ...HOLD, brow: pan > 0.5 ? 0.8 : -0.6, eyeWide: pan > 0.5 ? 1 : 0, mouthOpen: pan > 0.5 ? 0.4 : 0, head: [-pan * 0.3, pan * 0.4, 0]}} look={BOY} item={<Skewer p={[0, 0.02, 0.06]} r={SKEW_R} s={1.2} />} />
    </>
  );
};
/* avião → barco → tirolesa → cratera */
const S1a: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const x = s * 6;
  return (
    <>
      <Cam pos={[x + 0.5, 1.3, 7.5]} look={[x, 0.9, 0]} fov={54} f={f} a={a} punch={4} />
      <SkyClouds x={x} />
      <hemisphereLight args={["#ffffff", "#9fc8ff", 1.2]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} />
      <Airliner p={[x, 0, 0]} r={[0, Math.PI / 2, 0]} s={1.3} />
      <HandToy pose={{...idle(f), pos: [x + 0.4, 0.62, 0], rotY: 0.6, legLift: 1, ...HOLD, smile: 1}} look={BOY} item={<Skewer p={[0, 0.02, 0.06]} r={SKEW_R} s={1.2} />} />
    </>
  );
};
const S1b: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const x = s * 3;
  return (
    <>
      <Cam pos={[x + 0.8, 1.7, 5.2]} look={[x, 1.0, 0]} fov={54} f={f} a={a} punch={4} />
      <Water t={t} />
      <hemisphereLight args={["#ffffff", "#5a8aa8", 1.1]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} castShadow />
      <Boat p={[x, 0, 0]} t={t} />
      <HandToy pose={{...idle(f), pos: [x + 0.6, 0.55, 0], rotY: Math.PI / 2, rShoulder: [-1.6, 0, -0.1], rElbow: -0.2, smile: 1}} look={BOY} item={<Skewer p={[0, 0.02, 0.06]} r={SKEW_R} s={1.2} />} />
    </>
  );
};
const S1c: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (CRATERA1 - 6 - a));
  const A: V3 = [-6, 9, -6];
  const B: V3 = [3, 5.5, -16];
  const P: V3 = [lerp(A[0], B[0], k), lerp(A[1], B[1], k), lerp(A[2], B[2], k)];
  return (
    <>
      <Cam pos={[P[0] + 1.2, P[1] - 0.3, P[2] + 5]} look={[P[0], P[1] - 1.2, P[2] - 2]} fov={56} f={f} a={a} punch={4} />
      <VolcanoLand />
      <hemisphereLight args={["#ffe2c0", "#6b5244", 1.1]} />
      <directionalLight position={[4, 10, 6]} intensity={2.2} />
      <Volcano p={[5, 0, -26]} s={2.0} t={t} />
      <ZipLine a={[-20, 13, 2]} b={[8, 4.2, -24]} />
      <HandToy pose={{...idle(f), pos: [P[0], P[1] - 2.0, P[2]], rotY: 0.3, ...ARMS_UP, lShoulder: [-2.9, 0, 0.35], mouthOpen: 0.6, eyeWide: 1, legLift: 0.3}} look={BOY} item={<Skewer p={[0, 0.02, 0.06]} r={SKEW_R} s={1.2} />} />
    </>
  );
};
/* na borda da cratera */
const RimScene: React.FC<{f: number; a: number; t: number; cook: number; close?: boolean}> = ({f, a, t, cook, close}) => (
  <>
    <Cam pos={close ? [-0.1, 1.7, 3.7] : [0.3, 1.8, 4.6]} look={close ? [-0.1, 1.45, -0.2] : [0, 0.9, -1.2]} fov={52} f={f} a={a} />
    <CraterRim t={t} />
    <hemisphereLight args={["#ffd0a0", "#5a2a10", 0.9]} />
    <pointLight position={[0, 0.5, -2]} intensity={14} distance={8} decay={1.5} color="#ff8a3a" />
    <directionalLight position={[3, 6, 5]} intensity={1.6} castShadow />
    <HandToy pose={{...idle(f), pos: [0, 0, 0.9], rotY: 0, rShoulder: [-1.5, 0.1, -0.05], rElbow: -0.25, eyeWide: cook > 0.5 ? 0.6 : 0, smile: cook > 0.5 ? 1 : 0.3}} look={BOY} item={<Skewer p={[0, 0.02, 0.06]} r={SKEW_R} s={1.4} cook={cook} t={t} />} />
  </>
);
const S1d: React.FC<ShotProps> = ({f, a, t}) => <RimScene f={f} a={a} t={t} cook={0} />;
const S2: React.FC<ShotProps> = ({f, a, t}) => <RimScene f={f} a={a} t={t} cook={easeOut(ramp(f, DOIS2, DOIS2 + 24))} close />;
/* o vulcão sente o cheiro */
const VolcanoFace: React.FC<{f: number; a: number; t: number; face: number; mouth: number; tongue: number; wide?: boolean}> = ({f, a, t, face, mouth, tongue, wide}) => (
  <>
    <Cam pos={wide ? [0, 4.5, 17] : [0, 4.2, 12.5]} look={[0, wide ? 4.5 : 4.0, 0]} fov={56} f={f} a={a} />
    <VolcanoLand />
    <hemisphereLight args={["#ffe2c0", "#6b5244", 1.1]} />
    <directionalLight position={[4, 10, 8]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
    <Volcano p={[0, 0, 0]} s={1.5} t={t} face={face} mouth={mouth} tongue={tongue} />
  </>
);
const S2b: React.FC<ShotProps> = ({f, a, t}) => (
  <VolcanoFace f={f} a={a} t={t} face={easeOut(ramp(f, CHEIRO2 - 2, CHEIRO2 + 10))} mouth={f >= FOME2 ? 0.5 : 0} tongue={f >= FOME2 ? 1 : 0} />
);
const S3: React.FC<ShotProps> = ({f, a, t}) => <VolcanoFace f={f} a={a} t={t} face={1} mouth={0.3} tongue={0.6} />;
/* erupção de linguiça */
const Eruption: React.FC<{t0: number; t: number; top: V3; n?: number}> = ({t0, t, top, n = 36}) => {
  const r = rng(44);
  const items = Array.from({length: n}, () => [r() * Math.PI * 2, 2 + r() * 4, 7 + r() * 5, r(), Math.floor(r() * 3)] as [number, number, number, number, number]);
  if (t < t0) return null;
  return (
    <group position={top}>
      {items.map(([ang, hv, vv, ph, k], i) => {
        const T = 2.2;
        const tt = ((t - t0) + ph * T) % T;
        if (t - t0 < ph * T * 0.5) return null;
        const x = Math.cos(ang) * hv * tt;
        const z = Math.sin(ang) * hv * tt;
        const y = vv * tt - 4.9 * tt * tt;
        return <Sausage key={i} p={[x, y, z]} r={[tt * 6 + i, i, tt * 4]} s={2.6} kind={k} />;
      })}
    </group>
  );
};
const S4: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <VolcanoFace f={f} a={a} t={t} face={1} mouth={f >= ERUPCAO4 ? 0.9 : 0.3} tongue={0} wide />
    <Eruption t0={ERUPCAO4 / FPS} t={t} top={[0, 6.2, 0]} />
  </>
);
const S6: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <VolcanoFace f={f} a={a} t={t} face={1} mouth={0.9} tongue={0} wide />
    <Eruption t0={0} t={t + 3} top={[0, 6.2, 0]} />
  </>
);
/* chove linguiça na cidade */
const UMB_HAND: V3 = [-0.264, 1.5, 0.333];
const S5a: React.FC<ShotProps> = ({f, a, t}) => {
  const brk = easeOut(ramp(f, GUARDA5 + 4, GUARDA5 + 14));
  return (
    <>
      <Cam pos={[0, 2.2, 8.0]} look={[0, 1.7, 0.5]} fov={56} f={f} a={a} />
      <DayOut />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <SausageRain c={[0, 0, 1.2]} w={7} d={4} h={7} t={t} n={45} />
      {[-1.3, 0, 1.3].map((x, i) => (
        <group key={i} position={[x, 0, 1.6 + (i % 2) * 0.5]}>
          <Toy pose={{...idle(f + i * 9), pos: [0, 0, 0], rotY: 0, rShoulder: [-1.3, 0, 0.35], rElbow: -1.5, eyeWide: 1, mouthOpen: brk > 0.3 ? 0.7 : 0.3, brow: 1}} look={[PRIMOS[0], VO, PRIMOS[2]][i]} headExtra={i === 1 ? <><HeadGlasses color="#8a5a2b" /><Granny /></> : null} />
          <group position={UMB_HAND} rotation={[brk * 2.6, 0, brk * (i - 1) * 0.6]}>
            <Umbrella p={[0, 0, 0]} color={["#2e86de", "#e8414f", "#2ecc71"][i]} />
          </group>
        </group>
      ))}
    </>
  );
};
const S5b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.2, 1.95]} look={[0, 1.18, -1]} fov={46} f={f} a={a} />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0.2, 2.6, 1.0]} intensity={8} distance={8} decay={1.4} />
    <RoomShell wall="#ffe3b8" accent="#3a86ff" />
    <TV p={[0, 0, -1.4]} rotY={0} />
    <mesh position={[0, 1.18, -1.38]}>
      <planeGeometry args={[1.65, 0.92]} />
      <meshBasicMaterial map={forecastTex()} toneMapped={false} />
    </mesh>
  </>
);
/* cachorros de três estados */
const S7b: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  return (
    <>
      <Cam pos={[0, 1.2, 6.5 - s * 0.6]} look={[0, 0.6, 0]} fov={56} f={f} a={a} />
      <DayOut />
      <Town t={t} galo={false} variant="nova" flat clouds />
      {Array.from({length: 14}, (_, i) => {
        const row = Math.floor(i / 4);
        const col = (i % 4) - 1.5;
        const z = -6 + row * 1.6 + ((s * 4.5) % 1.6);
        return <Dog key={i} d={{pos: [col * 0.95 + (row % 2) * 0.3, 0, z], rotY: 0, walk: 1, run: 3, t: t + i * 0.21, tail: 1, tongue: 0.7, mouth: 0.3}} />;
      })}
    </>
  );
};
const S7c: React.FC<ShotProps> = ({f, a, t}) => {
  const s = (f - a) / FPS;
  const x = -2 + s * 2.4;
  return (
    <>
      <Cam pos={[x + 0.3, 1.2, 4.8]} look={[x, 0.6, 1.0]} fov={52} f={f} a={a} />
      <DayOut x={x} />
      <Town t={t} galo={false} variant="nova" flat clouds />
      <Scooter p={[x, 0, 1.0]} rotY={Math.PI / 2} spin={-s * 12} />
      <Dog d={{pos: [x - 0.05, 0.18, 1.0], rotY: Math.PI / 2, t, tail: 1, tongue: 0.8, mouth: 0.3, legs: "down", blink: blinkCurve(f), head: [0, -0.4, 0]}} />
    </>
  );
};
/* bombeiros com pão e vinagrete */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const k = easeOut(ramp(f, a, BOMBEIROS8 + 20));
  const out = f >= PAO8 - 10;
  return (
    <>
      <Cam pos={[0, 2.0, 9.0]} look={[0, 2.2, 0]} fov={56} f={f} a={a} />
      <VolcanoLand />
      <hemisphereLight args={["#ffe2c0", "#6b5244", 1.1]} />
      <directionalLight position={[4, 10, 8]} intensity={2.4} castShadow />
      <Volcano p={[0, 0, -8]} s={1.5} t={t} face={1} mouth={0.4} />
      <FireTruck p={[lerp(-14, -2.6, k), 0, 1.2]} rotY={Math.PI / 2} t={t} s={0.9} />
      {out &&
        [0, 1].map((i) => (
          <HandToy
            key={i}
            pose={{...idle(f + i * 7), pos: [-0.35 + i * 1.2, 0, 2.2], rotY: -0.2, rShoulder: [-1.3, 0.2, 0.05], rElbow: -0.6, smile: 1}}
            look={BOMB}
            headExtra={<FireHelmet />}
            item={i ? <VinaigretteJar p={[0, 0.02, 0.08]} r={SKEW_R} s={2.2} /> : <Baguette p={[0, 0.02, 0.08]} r={[Math.PI / 2, 0, 0.3]} s={1.6} />}
          />
        ))}
    </>
  );
};
/* o vulcão churrasqueiro */
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const ap = f >= AVENTAL9 - 2;
  const work = f >= PA9 - 4;
  const lift = work ? 0.5 + 0.5 * Math.sin((f - PA9) / 6) : 0;
  const flip = work ? Math.max(0, Math.sin((f - PA9) / 6)) * Math.PI : 0;
  return (
    <>
      <Cam pos={[1.3, 4.4, 15]} look={[1.0, 3.6, 0]} fov={56} f={f} a={a} />
      <VolcanoLand />
      <hemisphereLight args={["#ffe2c0", "#6b5244", 1.1]} />
      <directionalLight position={[4, 10, 8]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} />
      <Volcano p={[0, 0, -2]} s={1.5} t={t} face={1} mouth={0.2} apron={ap} hat={ap} />
      <mesh position={[1.4, 0.6, 3.4]} geometry={rbox(3.4, 1.2, 1.6, 0.05)} material={sm("#3a3f4a", 0.5)} castShadow />
      <GiantSteak p={[1.4, 1.5 + lift * 1.2, 3.4]} r={[flip, 0, 0]} s={1.0} />
      <ExcavatorArm p={[3.6, 0, 4.4]} s={1.0} lift={lift} />
    </>
  );
};
/* a Terra pesada */
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const off = easeInOut(ramp(f, ORBITA10 - 4, ORBITA10 + 20));
  return (
    <>
      <Cam pos={[0, 2.6, 8.5]} look={[0, 0.3, 0]} fov={52} f={f} a={a} />
      <Bg c="#05060f" />
      <ambientLight intensity={0.5} />
      <directionalLight position={[-6, 4, 6]} intensity={2.4} />
      {Array.from({length: 50}, (_, i) => {
        const r = rng(i + 70);
        return (
          <mesh key={i} position={[(r() - 0.5) * 30, (r() - 0.3) * 20, -12 - r() * 6]}>
            <sphereGeometry args={[0.03 + r() * 0.03, 6, 4]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        );
      })}
      <SunFace p={[-2.0, 4.6, -9]} r={1.6} t={t} face={1} />
      <OrbitRing p={[0, 0, 0]} r={2.4} />
      <EarthBall p={[off * 0.75, -0.15 + off * 0.9, 2.4 + off * 0.3]} s={0.9} t={t} pile={f >= QUILOS10 - 6 ? 1 : 0.6} />
    </>
  );
};
const S11: React.FC<ShotProps> = ({f, a, t}) => <S10 f={Math.max(f, ORBITA10 + 20)} a={a} b={a} t={t} />;
/* a família come tudo */
const Family: React.FC<{f: number; t: number; full?: boolean; showX?: boolean}> = ({f, t, full, showX}) => {
  const mouth = (i: number) => (full ? 0 : 0.2 + 0.5 * Math.abs(Math.sin(t * 9 + i)));
  return (
    <>
      <Toy pose={{...idle(f), pos: [-1.8, 0, -0.75], rotY: 0, mouthOpen: mouth(0), smile: full ? 1 : 0.5}} look={VO} headExtra={<><HeadGlasses color="#8a5a2b" /><Granny /></>} />
      <Toy pose={{...idle(f + 4), pos: [-0.6, 0, -0.75], rotY: 0, mouthOpen: mouth(1), smile: full ? 1 : 0.5, squash: full ? -0.05 : 0}} look={TIO} headExtra={<DadHead cap={false} />} />
      <Toy pose={{...idle(f + 8), pos: [0.6, 0, -0.75], rotY: 0, mouthOpen: mouth(2), smile: 1}} look={BOY} />
      <Toy pose={{...idle(f + 12), pos: [1.8, 0, -0.75], rotY: 0, mouthOpen: mouth(3), smile: 0.6}} look={PRIMOS[1]} />
      <Toy pose={{...idle(f + 16), pos: [-2.4, 0, 0.5], rotY: 1.2, mouthOpen: mouth(4), smile: 0.6}} look={PRIMOS[0]} />
      {showX && <Toy pose={{...idle(f + 20), pos: [2.45, 0, 0.5], rotY: -0.5, mouthOpen: mouth(5), smile: 0.2, brow: -0.6}} look={PRIMO_X} headExtra={<Shades />} />}
    </>
  );
};
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const x = f >= CONHECE12 - 4;
  return (
    <>
      <Cam pos={x ? [1.7, 1.65, 4.2] : [0, 2.3, 6.2]} look={x ? [2.1, 1.4, 0.3] : [0, 1.1, -0.4]} fov={x ? 48 : 58} f={f} a={x ? CONHECE12 - 4 : a} />
      <VolcanoLand />
      <hemisphereLight args={["#ffe2c0", "#6b5244", 1.1]} />
      <directionalLight position={[4, 10, 8]} intensity={2.4} castShadow />
      <Volcano p={[0, 0, -12]} s={1.5} t={t} face={1} mouth={0.2} apron hat />
      <LongTable p={[0, 0, 0]} />
      <Family f={f} t={t} showX={x} />
    </>
  );
};
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const rede = f >= TIO13 - 4;
  if (rede)
    return (
      <>
        <Cam pos={[2.7, 2.4, 3.1]} look={[0, 1.3, 0]} fov={52} f={f} a={TIO13 - 4} />
        <DayOut />
        <Yard />
        <Hammock p={[0, 0, 0]} sway={0.08 * Math.sin(t * 1.4)} />
        <group position={[0, 1.33 + 0.02 * Math.sin(t * 1.4), 0]} rotation={[0.08 * Math.sin(t * 1.4), 0, 0]}>
          <group rotation={[0, Math.PI / 2, 0]} position={[0.95, 0, 0]}>
            <group rotation={[-Math.PI / 2, 0, 0]}>
              <Toy pose={{pos: [0, 0, 0], rotY: 0, blink: 1, mouthOpen: 0.35 + 0.15 * Math.sin(t * 2), breathe: Math.sin(t * 2)}} look={TIO} headExtra={<DadHead cap={false} />} />
            </group>
          </group>
        </group>
      </>
    );
  return (
    <>
      <Cam pos={[0, 2.3, 6.2]} look={[0, 1.1, -0.4]} fov={58} f={f} a={a} />
      <VolcanoLand />
      <hemisphereLight args={["#ffe2c0", "#6b5244", 1.1]} />
      <directionalLight position={[4, 10, 8]} intensity={2.4} castShadow />
      <Volcano p={[0, 0, -12]} s={1.5} t={t} face={1} mouth={0} apron hat />
      <LongTable p={[0, 0, 0]} food={0} />
      <Family f={f} t={t} full showX />
    </>
  );
};
/* parabéns: recapitulação */
const SmallVolcanoYard: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.5, 2.0, 6.4]} look={[0.5, 1.4, -1]} fov={54} f={f} a={a} />
    <Backyard f={f} t={t} volcano={0} />
    <Volcano p={[1.3, 0, -1.6]} s={0.45} t={t} face={1} mouth={0.5} apron hat />
    <mesh position={[1.4, 0.9, 0.1]} geometry={rbox(0.8, 0.05, 0.5, 0.02)} material={sm("#cfd4da", 0.3, {metalness: 0.5})} />
    {[0, 1, 2, 3].map((k) => <Sausage key={k} p={[1.1 + k * 0.2, 0.97, 0.1]} r={[0, 0.2 * k, 0]} s={1.3} kind={k} />)}
    <Toy pose={{...idle(f), pos: [-0.25, 0, 0.3], rotY: 0.4, ...ARMS_UP, smile: 1}} look={BOY} />
  </>
);
const S14: React.FC<ShotProps> = (p) => {
  const {f} = p;
  if (f >= DOMINGO14 - 3) return <SmallVolcanoYard {...p} a={DOMINGO14 - 3} />;
  if (f >= ORBITA14 - 3) return <S10 {...p} f={ORBITA10 + 10} a={ORBITA14 - 3} />;
  if (f >= CACHORROS14 - 3) return <S7b {...p} a={CACHORROS14 - 3} />;
  if (f >= COZINHAR14 - 3) return <S9 {...p} f={PA9 + 4 + (f - COZINHAR14)} a={COZINHAR14 - 3} />;
  if (f >= CARVAO14 - 3)
    return (
      <>
        <Cam pos={[-0.6, 1.4, 2.6]} look={[-1.3, 0.6, -0.6]} fov={50} f={f} a={CARVAO14 - 3} />
        <Backyard f={f} t={p.t} volcano={0} />
      </>
    );
  return <SmallVolcanoYard {...p} />;
};
/* final: a farofa do vulcão */
const S15: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.8, 6.0]} look={[0.3, 1.4, -0.5]} fov={54} f={f} a={a} />
    <Backyard f={f} t={t} volcano={0} />
    <Volcano p={[1.3, 0, -3.4]} s={0.45} t={t} face={1} mouth={0.6} apron hat />
    <FarofaHill p={[0.5, 0, -0.9]} s={1.0} />
    <HandToy pose={{...idle(f), pos: [-0.55, 0, 0.3], rotY: 0.35, rShoulder: [-2.4, 0.2, -0.2], rElbow: -0.2, eyeWide: 1, mouthOpen: 0.5, brow: 1}} look={BOY} item={<BigSpoon p={[0, 0.02, 0.06]} r={SKEW_R} s={2.2} />} />
  </>
);

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: S1a},
  {from: BARCO1 - 3, Comp: S1b},
  {from: TIROLESA1 - 3, Comp: S1c},
  {from: CRATERA1 - 6, Comp: S1d},
  {from: L(2), Comp: S2},
  {from: CHEIRO2 - 3, Comp: S2b},
  {from: L(3), Comp: S3},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5a},
  {from: PREVISAO5 - 3, Comp: S5b},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: Blank},
  {from: CORRENDO7 - 3, Comp: S7b},
  {from: PATINETE7 - 6, Comp: S7c},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: S9},
  {from: L(10), Comp: S10},
  {from: L(11), Comp: S11},
  {from: L(12), Comp: S12},
  {from: L(13), Comp: S13},
  {from: L(14), Comp: S14},
  {from: L(15), Comp: S15},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_CHURRASCO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["churrasco", "carvao", "picanha", "vulcao", "aviao", "barco", "tirolesa", "cratera", "espeto", "dois", "segundos", "cheiro", "fome", "geologico", "erupcao", "linguica", "toscana", "calabresa", "frango", "chove", "guardachuvas", "previsao", "cinquenta", "farofa", "estados", "correndo", "dez", "mil", "cachorros", "patinete", "bombeiros", "pao", "vinagrete", "churrasqueiro", "avental", "pa", "escavadeira", "terra", "tres", "quilos", "orbita", "desequilibrio", "planetario", "familia", "vo", "tios", "primos", "conhece", "horas", "tio", "rede", "barriga", "parabens", "domingo", "seguir", "perfil"]);
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

const MapDogs: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${projBR(lo, la)[0].toFixed(0)} ${projBR(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  const goal = projBR(-46.6, -23.5);
  const srcs = [projBR(-44, -18.5), projBR(-51.5, -25), projBR(-42.5, -22)];
  const k = easeInOut(ramp(f, from + 4, from + 30));
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill="#ffc35a" stroke="#c9822a" strokeWidth={8} strokeLinejoin="round" />
        {srcs.map(([x, y], i) => (
          <g key={i}>
            <line x1={x} y1={y} x2={lerp(x, goal[0], k)} y2={lerp(y, goal[1], k)} stroke="#e8262d" strokeWidth={14} strokeLinecap="round" strokeDasharray="4 26" />
            <text x={lerp(x, goal[0], k)} y={lerp(y, goal[1], k) + 20} fontSize={70} textAnchor="middle">🐕</text>
          </g>
        ))}
        <text x={goal[0]} y={goal[1] - 30} fontSize={90} textAnchor="middle">🌋</text>
      </svg>
      <div style={{position: "absolute", left: 540, top: 1250, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 54, padding: "6px 24px", whiteSpace: "nowrap"}}>3 ESTADOS</div>
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
  [L(3), ["CHURRASCO", "GEOLÓGICO"]],
  [L(6), ["ERUPÇÃO", "CALABRESA"]],
  [L(11), ["DESEQUILÍBRIO", "PLANETÁRIO"]],
];
const FOLLOW_FROM = L(15) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoChurrasco: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapDogs from={L(7)} to={CORRENDO7 - 4} />
      {TITLES.map(([x, lines], i) => {
        const next = [L(4), L(7), L(12)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      <Ono from={4} to={VULCAO0 - 4} text="?" x={540} y={470} size={200} color="#ffd21f" rot={8} />
      <Tag from={at(0, "carvao") + 2} to={VULCAO0 - 3} text="SEM CARVÃO" />
      <Ono from={VULCAO0 + 4} to={L(1) - 2} text="!" x={540} y={470} size={220} color="#ff5a3a" rot={-6} />
      <FastFwd from={L(1) + 2} to={CRATERA1 - 8} text="ATÉ O VULCÃO" />
      <BigNum from={DOIS2} to={CHEIRO2 - 5} text="2 SEG" size={160} />
      <Ono from={DOIS2 + 2} to={CHEIRO2 - 5} text="TSSSS!" y={640} size={110} color="#ffffff" />
      <Ono from={ERUPCAO4} to={FRANGO4 - 3} text="BUUUM!" color="#ff8a1f" />
      <Tag from={FRANGO4} to={L(5) - 2} text="LINGUIÇA DE FRANGO?" />
      <BigNum from={DEZ7} to={PATINETE7 - 8} text="10.000" size={180} />
      <Ono from={CORRENDO7} to={DEZ7 - 3} text="AU AU AU!" color="#ffd21f" />
      <Tag from={PATINETE7} to={L(8) - 2} text="DE PATINETE" />
      <Tag from={PAO8} to={L(9) - 2} text="REFORÇO" />
      <Tag from={AVENTAL9} to={L(10) - 2} text="CHURRASQUEIRO" />
      <BigNum from={QUILOS10} to={ORBITA10 - 3} text="+3 KG" size={170} />
      <Tag from={CONHECE12} to={L(13) - 2} text="PRIMO DESCONHECIDO" />
      <FastFwd from={L(13)} to={TIO13 - 6} text="3 HORAS" />
      <Ono from={TIO13 + 6} to={L(14) - 2} text="ZZZ…" x={540} y={460} size={130} color="#ffffff" />
      <Confetti from={PARABENS14} to={PARABENS14 + 60} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_CHURRASCO - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozchurrasco.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx14/grilos.mp3" from={4} dur={VULCAO0} v={FXV * 0.3} />
      <SND src="sfx2/plane.mp3" from={L(1)} dur={BARCO1 - L(1)} v={FXV * 0.3} />
      <SND src="sfx2/sea.mp3" from={BARCO1 - 3} dur={TIROLESA1 - BARCO1} v={FXV * 0.3} />
      <SND src="sfx2/wind.mp3" from={TIROLESA1 - 3} dur={CRATERA1 - TIROLESA1} v={FXV * 0.3} />
      <SND src="sfx10/bubble.mp3" from={CRATERA1 - 6} dur={L(3) - CRATERA1} v={FXV * 0.25} />
      <SND src="sfx14/spray.mp3" from={DOIS2} dur={40} v={FXV * 0.3} />
      <SND src="sfx8/sniff.mp3" from={CHEIRO2} dur={30} v={FXV * 0.35} />
      <SND src="sfx6/stomach.mp3" from={FOME2} dur={35} v={FXV * 0.35} />
      <SND src="sfx2/boom.mp3" from={ERUPCAO4} dur={45} v={FXV * 0.35} />
      <SND src="sfx14/chuva.mp3" from={L(5)} dur={PREVISAO5 - L(5)} v={FXV * 0.3} />
      <SND src="sfx12/gasp.mp3" from={GUARDA5 + 4} dur={30} v={FXV * 0.3} />
      <SND src="sfx11/bark.mp3" from={CORRENDO7} dur={30} v={FXV * 0.4} />
      <SND src="sfx11/bark.mp3" from={CORRENDO7 + 25} dur={30} v={FXV * 0.35} />
      <SND src="sfx5/run.mp3" from={CORRENDO7} dur={PATINETE7 - CORRENDO7} v={FXV * 0.3} />
      <SND src="sfx14/sirene.mp3" from={BOMBEIROS8 - 6} dur={PAO8 - BOMBEIROS8} v={FXV * 0.25} />
      <SND src="sfx9/quake.mp3" from={PA9 - 4} dur={L(10) - PA9} v={FXV * 0.25} />
      <SND src="sfx12/tornado.mp3" from={ORBITA10 - 4} dur={40} v={FXV * 0.25} />
      <SND src="sfx3/fork.mp3" from={L(12) + 10} dur={L(13) - L(12)} v={FXV * 0.25} />
      <SND src="sfx4/clocks.mp3" from={L(13)} dur={30} v={FXV * 0.25} />
      <SND src="sfx7/snore.mp3" from={TIO13 + 4} dur={L(14) - TIO13} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS14} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
