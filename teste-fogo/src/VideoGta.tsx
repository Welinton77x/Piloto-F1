import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {physics} from "./Physics";
import {fontFamily} from "./Video";
import {Sky, SunDisc, SunLight, Town, Clouds, V3} from "./Sets5";
import {
  Controller,
  GameBox,
  RoomShell,
  SideTable,
  Desk,
  DESK_H,
  MathBook,
  BOOK_H,
  Dog,
  DogP,
  Sofa,
  SOFA_SEAT,
  TV,
  SignPost,
  proibidoTex,
  YardSet,
  StrawHat,
  WateringCan,
  SPOUT,
  WaterDrops,
  ControllerTree,
  DizzyStars,
  MoonSet,
  Crater,
  Rocket,
  Dust,
  BeachChair,
  BEACH_SEAT,
  Helmet,
  Wifi,
  semTomadaTex,
  Alien,
  GameStore,
  CampChair,
  CAMP_SEAT,
  Beard,
  Nest,
  Cobweb,
  CalendarPage,
  WIN,
  sm,
} from "./Sets9";
import {Captions, StageTitle, Chip, Sparkles, Confetti, Sticker, Cross, Wd, clean, STROKE} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut, rng} from "./util";
import W from "./timingGta.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
/** termina logo depois do "dessas..." pra emendar no "cinco dicas..." (loop) */
export const TOTAL_GTA = F(words[words.length - 1].e + 0.35);

const KID: ToyLook = {hoodie: true};
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
const backOut = (k: number) => {
  const c = 1.9;
  const x = clamp(k) - 1;
  return 1 + (c + 1) * x * x * x + c * x * x;
};

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Cam: React.FC<{pos: V3; look: V3; fov: number; f: number; a: number; punch?: number}> = ({pos, look, fov, f, a, punch = 7}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov + punch * (1 - easeOut(clamp((f - a) / 9)));
  c.near = 0.03;
  c.far = 400;
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
/** segue só a posição da mão (o objeto mantém a orientação que a gente der) */
const AtPalm: React.FC<{palm: React.RefObject<THREE.Object3D | null>; offset?: V3; children: React.ReactNode}> = ({palm, offset = [0, 0, 0], children}) => {
  const g = useRef<THREE.Group>(null);
  const v = React.useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.getWorldPosition(v);
    g.current.position.set(v.x + offset[0], v.y + offset[1], v.z + offset[2]);
  }, -1);
  return <group ref={g}>{children}</group>;
};
const arc = (A: V3, B: V3, k: number, h = 1): V3 => [lerp(A[0], B[0], k), lerp(A[1], B[1], k) + Math.sin(k * Math.PI) * h, lerp(A[2], B[2], k)];
const mix = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

/* ---------- ambientes ---------- */
const BedroomScene: React.FC<{glow?: number}> = ({glow = 0}) => (
  <>
    <color attach="background" args={["#cfe8ff"]} />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0.3, 2.9, 1.2]} intensity={10} distance={10} decay={1.4} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[2, 4, 4]} intensity={0.6} />
    <RoomShell wall="#cfe3ff" accent="#ff8a5c" />
    {glow > 0 && <pointLight position={[-0.4, 1.2, 0.2]} intensity={2 * glow} distance={3} decay={2} color="#8fe8ff" />}
  </>
);
const LivingScene: React.FC<{t: number}> = ({t}) => (
  <>
    <Sky />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.0]} />
    <pointLight position={[0.2, 2.9, 0.4]} intensity={10} distance={10} decay={1.4} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />
    <directionalLight position={[2, 4, 4]} intensity={0.5} />
    <RoomShell wall="#ffe3b8" accent="#3a86ff" openWindow />
    <TV p={[0, 0, 2.95]} rotY={Math.PI} />
    <Sofa p={[0, 0, -1.25]} />
    {/* lá fora (visto pela janela) */}
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -14]} material={sm("#7fcf5a", 0.95)}>
      <planeGeometry args={[60, 22]} />
    </mesh>
    <directionalLight position={[3, 6, -8]} intensity={1.2} />
    {[-2.5, 0.5, 3.8].map((x, i) => (
      <mesh key={i} position={[x, 0.5, -6.5 - i]} scale={[1.2, 0.9, 0.8]} material={sm(i % 2 ? "#4fae3a" : "#5cbf45", 0.8)}>
        <sphereGeometry args={[1, 20, 14]} />
      </mesh>
    ))}
    <Clouds t={t} n={5} />
  </>
);
const YardScene: React.FC<{t: number}> = ({t}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 30, 110]} />
    <SunDisc p={[-30, 40, -100]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.15]} />
    <SunLight target={[0.5, 0, 0]} dir={[-5, 9, 6]} intensity={2.4} ext={6} />
    <YardSet />
    <Clouds t={t} />
  </>
);
const MoonScene: React.FC<{t: number}> = ({t}) => (
  <>
    <hemisphereLight args={["#c8d4ff", "#3a3a48", 0.55]} />
    <directionalLight position={[-6, 9, 6]} intensity={2.6} color="#ffffff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} shadow-bias={-0.0006} shadow-normalBias={0.03} />
    <MoonSet t={t} />
  </>
);
const STORE_P: V3 = [6, 0, -2.78];
const StreetScene: React.FC<{t: number; target: V3}> = ({t, target}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 35, 120]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={target} dir={[-6, 10, 7]} intensity={2.6} ext={8} />
    <Town t={t} galo={false} flat clear={[3.4, 8.6]} />
    <GameStore p={STORE_P} />
  </>
);

/* =================== 0 — abertura: a caixa do jogo brilhando =================== */
const BOX_P: V3 = [-0.15, 1.09, 0.6];
const NAO = at(0, "nao");
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 120);
  const pose = physics("intro" + a, (fr) => {
    const turn = ramp(fr, NAO - 4, NAO + 4);
    const shakeH = fr > NAO + 30 ? 0.22 * Math.sin((fr - NAO) / 2.2) : 0;
    return {
      ...idle(fr),
      pos: [0.25, 0, -0.75],
      rotY: -0.29,
      torso: [0.07 * (1 - turn), 0, 0],
      head: [0.05 * (1 - turn), 0.95 * turn + shakeH * turn, 0.05 * turn],
      eyeWide: 0.6 * (1 - turn),
      mouthOpen: 0.25 * (1 - turn),
      blink: turn > 0.5 ? 0.85 : blinkCurve(fr),
      brow: lerp(0.8, -0.6, turn),
      rShoulder: [lerp(-0.1, -1.55, turn), 0, lerp(-0.08, 0.05, turn)],
      rElbow: lerp(-0.15, -0.35, turn),
      rWrist: [lerp(0, -0.9, turn), 0, 0],
      lShoulder: [0, 0, 0.12],
      lElbow: -0.2,
    };
  }, a, f);
  return (
    <>
      <Cam pos={[lerp(0.22, 0.15, k), 1.38, lerp(2.7, 2.3, k)]} look={[0.06, 1.2, -0.4]} fov={48} f={f} a={a} />
      <BedroomScene glow={1} />
      <SideTable p={[BOX_P[0], 0, BOX_P[2]]} h={0.8} />
      <GameBox p={BOX_P} r={[0, 0.25, 0]} s={0.85} glow={0.85 + 0.15 * Math.sin(t * 5)} t={t} />
      <Toy pose={pose} look={KID} />
    </>
  );
};
/* "a última vai mudar sua vida" — close no rosto iluminado pela caixa */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 75);
  const pose = physics("intro2" + a, (fr) => ({...idle(fr), pos: [0.25, 0, -0.75], rotY: -0.29, eyeWide: 0.8, brow: 0.9, mouthOpen: 0.3, head: [0.05, 0, 0], pupil: [-0.6, -0.2]}), a, f);
  return (
    <>
      <Cam pos={[lerp(0.0, 0.05, k), 1.64, lerp(1.05, 0.8, k)]} look={[0.22, 1.58, -0.75]} fov={40} f={f} a={a} punch={4} />
      <BedroomScene glow={1.2} />
      <SideTable p={[BOX_P[0], 0, BOX_P[2]]} h={0.8} />
      <GameBox p={BOX_P} r={[0, 0.25, 0]} s={0.85} glow={1} t={t} />
      <Toy pose={pose} look={KID} />
    </>
  );
};

/* =================== DICA 1 — esconderijo acadêmico =================== */
const DESK_P: V3 = [0, 0, -0.45];
const BOOK_P: V3 = [-0.15, DESK_H, -0.6];
const BOY_D: V3 = [0.05, 0, -1.08];
const OPEN1 = at(1, "esconda");
const PLACE = at(1, "dentro") - 30;
const CLOSE1 = at(1, "dentro") - 4;
const LOCK = at(1, "matematica");
const deskPose = (fr: number, extra: Pose): Pose => ({...idle(fr), pos: BOY_D, rotY: 0, ...extra});
const DeskSet: React.FC<{open: number; lock: number; lockOff?: number; inside?: boolean; glow?: number; t: number}> = ({open, lock, lockOff = 0, inside = false, glow = 0, t}) => (
  <>
    <Desk p={DESK_P} />
    <MathBook p={BOOK_P} open={open} lock={lock} lockOff={lockOff} inside={inside ? <Controller p={[0, 0.16 * glow, 0]} r={[0, 0.2, 0]} s={0.9} /> : null} />
    {glow > 0.01 && <pointLight position={[BOOK_P[0], DESK_H + 0.3, BOOK_P[2] + 0.15]} intensity={0.35 * glow} distance={1.5} decay={2} color="#fff0b0" />}
  </>
);
/* 1a — "Dica um... o esconderijo acadêmico!" (controle na mão, olhando pros lados) */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("d1" + a, (fr) => deskPose(fr, {rShoulder: [-1.25, 0, 0.25], rElbow: -1.5, rWrist: [0.2, 0, 0], lShoulder: [-0.35, 0, 0.1], lElbow: -0.5, smile: 0.7, brow: -0.3, pupil: [Math.sin(fr / 9) * 1.2, 0], head: [0, 0.25 * Math.sin(fr / 9), 0]}), a, f);
  return (
    <>
      <Cam pos={[0.15, 1.55, 1.55]} look={[0, 1.2, -0.9]} fov={46} f={f} a={a} />
      <BedroomScene />
      <DeskSet open={0} lock={0} t={t} />
      <Toy pose={pose} look={KID} palmRef={palm} />
      <InHand palm={palm}>
        <Controller p={[0, -0.02, 0.02]} r={[0.2, 0, Math.PI / 2]} s={1.05} />
      </InHand>
    </>
  );
};
/* 1b — abre o livro, enfia o controle no buraco, fecha */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const open = easeInOut(ramp(f, OPEN1, OPEN1 + 12)) * (1 - easeInOut(ramp(f, CLOSE1, CLOSE1 + 10)));
  const reach = (fr: number) => easeInOut(ramp(fr, OPEN1 + 14, PLACE)) * (1 - easeInOut(ramp(fr, PLACE + 8, PLACE + 22)));
  const pose = physics("d1b" + a, (fr) => {
    const r = reach(fr);
    return deskPose(fr, {
      torso: [0.18 * r, 0, 0],
      rShoulder: [lerp(-1.25, -0.95, r), 0, lerp(0.25, 0.42, r)],
      rElbow: lerp(-1.5, -0.25, r),
      rWrist: [lerp(0.2, -0.3, r), 0, 0],
      lShoulder: [lerp(-0.35, -0.75, ramp(fr, OPEN1 - 4, OPEN1 + 4) * (1 - ramp(fr, OPEN1 + 14, OPEN1 + 22))), 0, 0.1],
      lElbow: -0.5,
      smile: 0.8,
      brow: -0.2,
      head: [0.25 * r, 0, 0],
      pupil: [0, -0.8 * r],
    });
  }, a, f);
  const held = f < PLACE;
  return (
    <>
      <Cam pos={[0.3, 1.72, 1.8]} look={[-0.05, 1.25, -0.8]} fov={46} f={f} a={a} />
      <BedroomScene />
      <DeskSet open={open} lock={0} inside={!held} t={t} />
      <Toy pose={pose} look={KID} palmRef={palm} />
      {held && (
        <InHand palm={palm}>
          <Controller p={[0, -0.02, 0.02]} r={[0.2, 0, Math.PI / 2]} s={1.05} />
        </InHand>
      )}
    </>
  );
};
/* 1c — close no livro: cadeado + assobio disfarçando */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const lock = backOut(ramp(f, LOCK, LOCK + 8));
  const pose = physics("d1c" + a, (fr) => {
    const w = ramp(fr, LOCK + 10, LOCK + 16);
    return deskPose(fr, {rShoulder: [-0.15, 0, -0.1], lShoulder: [-0.15, 0, 0.1], rElbow: -0.3, lElbow: -0.3, smile: 0.5 * (1 - w), mouthOpen: 0.22 * w, head: [-0.12 * w, 0.45 * w + 0.06 * Math.sin(fr / 6) * w, 0.1 * w], pupil: [1.4 * w, 0.8 * w], brow: 0.5 * w});
  }, a, f);
  return (
    <>
      <Cam pos={[0.12, 1.32, 0.8]} look={[-0.05, 1.28, -1.0]} fov={44} f={f} a={a} />
      <BedroomScene />
      <DeskSet open={0} lock={lock} inside t={t} />
      <Toy pose={pose} look={KID} />
    </>
  );
};
/* 2a — "Funciona perfeitamente..." (relaxado, mãos atrás da cabeça) */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("d2" + a, (fr) => deskPose(fr, {rShoulder: [-1.15, 0, 0.6], rElbow: -1.45, lShoulder: [-1.05, 0, -0.6], lElbow: -1.45, torso: [-0.08, 0, 0], head: [-0.18 + 0.06 * Math.sin(fr / 5), 0, 0.08], smile: 1, blink: 0.9, brow: 0.3}), a, f);
  return (
    <>
      <Cam pos={[0.2, 1.5, 1.45]} look={[0, 1.25, -0.9]} fov={46} f={f} a={a} />
      <BedroomScene />
      <DeskSet open={0} lock={1} inside t={t} />
      <Toy pose={pose} look={KID} />
    </>
  );
};
/* 2b — "até sua mãe mandar você estudar!" → abre o livro e acha o controle */
const MAE = at(2, "mae");
const ESTUDAR = at(2, "estudar");
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const off = ramp(f, ESTUDAR, ESTUDAR + 14);
  const open = easeInOut(ramp(f, ESTUDAR + 2, ESTUDAR + 12));
  const glow = ramp(f, ESTUDAR + 6, ESTUDAR + 14);
  const pose = physics("d2b" + a, (fr) => {
    const startle = ramp(fr, MAE - 2, MAE + 3) * (1 - ramp(fr, ESTUDAR - 6, ESTUDAR));
    const reach = ramp(fr, ESTUDAR - 6, ESTUDAR + 2) * (1 - ramp(fr, ESTUDAR + 10, ESTUDAR + 16));
    const joy = ramp(fr, ESTUDAR + 12, ESTUDAR + 18);
    return deskPose(fr, {
      head: [0, -0.7 * startle, 0],
      eyeWide: 0.7 * startle + 0.5 * joy,
      brow: 0.8 * startle + 0.6 * joy,
      mouthOpen: 0.4 * startle + 0.5 * joy,
      smile: joy,
      torso: [0.18 * reach, 0, 0],
      lShoulder: [lerp(lerp(-0.15, -0.95, reach), -2.6, joy), 0, lerp(0.15, 0.55, joy)],
      lElbow: lerp(-0.3, -0.2, reach),
      rShoulder: [lerp(-0.15, -2.6, joy), 0, lerp(-0.15, -0.55, joy)],
      rElbow: -0.3,
    });
  }, a, f);
  return (
    <>
      <Cam pos={[0.0, 1.45, 0.95]} look={[-0.08, 1.28, -0.9]} fov={46} f={f} a={a} />
      <BedroomScene />
      <DeskSet open={open} lock={1} lockOff={off} inside glow={glow} t={t} />
      <Toy pose={pose} look={KID} />
    </>
  );
};

/* =================== DICA 2 — segurança canina =================== */
const DOG_G: V3 = [-0.05, 0, 2.05];
const dogBlink = (f: number) => blinkCurve(f + 31);
/* 3a — o cachorro segurança na frente da TV */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("d3" + a, (fr) => ({...idle(fr), pos: [0.7, 0, 1.7], rotY: Math.PI + 0.5, lShoulder: [-1.0, 0, 0.55], lElbow: -0.35, lWrist: [0, 0, 0.3], smile: 0.9, brow: 0.4, mouthOpen: talk(fr, a + 8, a + 50) * 0.5}), a, f);
  return (
    <>
      <Cam pos={[0.3, 1.42, -1.55]} look={[0.32, 1.08, 2.0]} fov={46} f={f} a={a} />
      <LivingScene t={t} />
      <Dog d={{pos: DOG_G, rotY: Math.PI, legs: "crossed", glasses: true, cap: true, t, tail: 0.3, head: [0, 0.15 * Math.sin(t * 1.5), 0]}} />
      <Toy pose={pose} look={KID} />
    </>
  );
};
/* 3b — "contrate seu cachorro" (carinho na cabeça) → continência */
const VIGIAR = at(3, "vigiar");
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const salute = ramp(f, VIGIAR - 4, VIGIAR + 6);
  const pose = physics("d3b" + a, (fr) => {
    const pat = ramp(fr, a + 4, a + 12) * (1 - ramp(fr, VIGIAR - 8, VIGIAR));
    return {...idle(fr), pos: [0.58, 0, 2.12], rotY: Math.PI + 0.15, lShoulder: [lerp(0, -0.35, pat), 0, lerp(0.08, 1.05 + 0.1 * Math.sin(fr / 2.5) * pat, pat)], lElbow: lerp(-0.15, -1.0, pat), rShoulder: [0, 0, -0.1], smile: 1, brow: 0.3, mouthOpen: talk(fr, a + 2, VIGIAR) * 0.5, head: [0.05, -0.25, 0]};
  }, a, f);
  return (
    <>
      <Cam pos={[0.25, 1.42, -1.3]} look={[0.28, 1.12, 2.0]} fov={46} f={f} a={a} />
      <LivingScene t={t} />
      <Dog d={{pos: DOG_G, rotY: Math.PI, legs: salute > 0.05 ? "salute" : "crossed", legK: salute > 0.05 ? salute : 1, glasses: true, cap: true, t, tail: 1, mouth: 0.3 * ramp(f, a + 20, a + 26) * (1 - ramp(f, a + 40, a + 46)), head: [-0.1 * salute, 0, 0]}} />
      <Toy pose={pose} look={KID} />
    </>
  );
};
/* 4a — o cachorro jogando no sofá */
const DOG_S: V3 = [0.3, SOFA_SEAT - 0.02, -1.2];
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[lerp(0.35, 0.3, clamp((f - a) / 80)), 1.15, lerp(1.2, 0.85, clamp((f - a) / 80))]} look={[0.25, 0.9, -1.4]} fov={44} f={f} a={a} />
    <LivingScene t={t} />
    <pointLight position={[0.2, 1.2, 1.6]} intensity={2.5} distance={5} decay={2} color="#9fd8ff" />
    <Dog d={{pos: DOG_S, rotY: 0, legs: "hold", headset: true, controller: true, play: 1, t, tail: 1, mouth: 0.25 + 0.2 * Math.abs(Math.sin(t * 9)), tongue: 0.8, lean: 0.12, blink: dogBlink(f), head: [0.05 * Math.sin(t * 7), 0.08 * Math.sin(t * 3), 0]}} />
  </>
);
/* 4b — "e você foi banido do sofá!" — menino do lado de fora, olhando pela janela */
const BANIDO = at(4, "banido");
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const point = ramp(f, BANIDO - 4, BANIDO + 4);
  const sign = backOut(ramp(f, a + 2, a + 10));
  const pose = physics("d4b" + a, (fr) => ({...idle(fr), pos: [WIN.x, 0, -3.05], rotY: 0, rShoulder: [-1.25, 0, 0.12], rElbow: -1.0, lShoulder: [-1.25, 0, -0.12], lElbow: -1.0, brow: 0.6, smile: 0, mouthOpen: 0.08, blink: 0.35 + 0.65 * blinkCurve(fr), head: [0.1, 0, 0.12]}), a, f);
  return (
    <>
      <Cam pos={[0.5, 1.45, 2.75]} look={[0.55, 1.2, -1.9]} fov={52} f={f} a={a} />
      <LivingScene t={t} />
      <pointLight position={[0.2, 1.2, 1.6]} intensity={2.5} distance={5} decay={2} color="#9fd8ff" />
      <Dog d={{pos: [-0.2, SOFA_SEAT - 0.02, -1.2], rotY: 0.2, legs: point > 0.05 ? "point" : "hold", legK: point > 0.05 ? point : 1, headset: true, controller: point < 0.05, play: point < 0.05 ? 1 : 0, t, tail: 1, mouth: 0.2, lean: 0.12, blink: dogBlink(f), head: [0, 0.35 * point, 0]}} />
      {point >= 0.05 && <Controller p={[-0.35, SOFA_SEAT + 0.04, -0.85]} r={[0, 0.4, 0]} s={1.05} />}
      <SignPost p={[0.85, SOFA_SEAT, -1.3]} s={sign} tex={proibidoTex()} texKey="proibido-humanos" w={0.6} h={0.4} post={0.35} />
      <Toy pose={pose} look={KID} />
    </>
  );
};

/* =================== DICA 3 — agricultura terapêutica =================== */
const BOY_Y: V3 = [0.95, 0, -0.35];
/* 5a — de chapéu de palha, todo zen */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("d5" + a, (fr) => ({...idle(fr), pos: BOY_Y, rotY: -0.55, rShoulder: [-0.85, 0, 0.42], rElbow: -1.35, lShoulder: [-0.85, 0, -0.42], lElbow: -1.35, smile: 0.9, blink: 0.9, head: [-0.08, 0, 0.06 * Math.sin(fr / 15)]}), a, f);
  return (
    <>
      <Cam pos={[1.15, 1.55, 3.6]} look={[0.45, 1.1, -0.2]} fov={46} f={f} a={a} />
      <YardScene t={t} />
      <WateringCan p={[1.65, 0, -0.1]} r={[0, 2.6, 0]} s={1.1} />
      <Toy pose={pose} look={KID} headExtra={<StrawHat />} />
    </>
  );
};
/* 5b — joga o controle fora e rega a sementinha */
const TROQUE = at(5, "troque");
const THROW = TROQUE + 12;
const WATER = at(5, "arvore") - 8;
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const lpalm = useRef<THREE.Object3D>(null);
  const pour = ramp(f, WATER, WATER + 8);
  const pose = physics("d5b" + a, (fr) => {
    const wind = ramp(fr, TROQUE - 2, THROW - 2) * (1 - ramp(fr, THROW - 2, THROW + 4));
    const after = ramp(fr, THROW - 2, THROW + 4) * (1 - ramp(fr, THROW + 14, THROW + 24));
    const w = ramp(fr, WATER - 10, WATER);
    return {
      ...idle(fr),
      pos: BOY_Y,
      rotY: lerp(-0.55, -1.15, ramp(fr, THROW + 16, WATER - 10)),
      rShoulder: [lerp(lerp(-0.6, -2.7, wind), -1.6, after) * (1 - w) + -0.1 * w, 0, -0.2],
      rElbow: lerp(-1.0, -0.2, after),
      lShoulder: [lerp(-0.2, -1.05, w), 0, lerp(0.1, -0.05, w)],
      lElbow: lerp(-0.25, -0.15, w),
      torso: [0.12 * w, 0, 0],
      smile: 0.9,
      blink: w > 0.5 ? 0.8 : blinkCurve(fr),
      head: [0.2 * w, 0, 0],
    };
  }, a, f);
  const thrown = f >= THROW;
  const fly = clamp((f - THROW) / 22);
  const tilt = 0.75 * easeInOut(pour);
  const yaw = -1.15 - Math.PI / 2; // bico do regador pra frente do menino
  const CAN_OFF: V3 = [0.02, -0.42, 0]; // alça do regador na mão
  const spout = new THREE.Vector3(SPOUT[0] + CAN_OFF[0], SPOUT[1] + CAN_OFF[1], SPOUT[2]).applyEuler(new THREE.Euler(0, yaw, -tilt));
  return (
    <>
      <Cam pos={[1.0, 1.5, 3.3]} look={[0.35, 1.0, -0.2]} fov={46} f={f} a={a} />
      <YardScene t={t} />
      <ControllerTree p={[0, 0, 0]} g={0.05 * ramp(f, WATER + 14, WATER + 22)} t={t} />
      <Toy pose={pose} look={KID} palmRef={palm} lPalmRef={lpalm} headExtra={<StrawHat />} />
      {!thrown && (
        <InHand palm={palm}>
          <Controller p={[0, -0.02, 0.02]} r={[0.2, 0, Math.PI / 2]} s={1.05} />
        </InHand>
      )}
      {thrown && fly < 1 && <Controller p={arc([BOY_Y[0] - 0.2, 2.3, BOY_Y[2] - 0.3], [3.6, 3.5, -4.5], fly, 1.2)} r={[fly * 9, fly * 5, 0]} s={1.05} />}
      <AtPalm palm={lpalm}>
        <group rotation={[0, yaw, -tilt]}>
          <WateringCan p={CAN_OFF} s={1} />
        </group>
        <WaterDrops p={[spout.x, spout.y, spout.z]} k={pour} t={t} />
      </AtPalm>
    </>
  );
};
/* 6a — a árvore cresce, cresce... */
const G1 = at(6, "cresce", 0);
const G2 = at(6, "cresce", 1);
const TREE_S = 1.25;
const treeG = (f: number) => TREE_S * (0.05 + 0.4 * backOut(ramp(f, G1 - 2, G1 + 12)) + 0.55 * backOut(ramp(f, G2 - 2, G2 + 12)));
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("d6" + a, (fr) => {
    const up = ramp(fr, G1, G2 + 12);
    return {...idle(fr), pos: [lerp(BOY_Y[0], 1.25, ramp(fr, G1, G1 + 14)), 0, lerp(BOY_Y[2], -0.15, ramp(fr, G1, G1 + 14))], rotY: -1.0, head: [-0.55 * up, 0, 0], eyeWide: 0.8 * up, brow: 0.9 * up, mouthOpen: 0.45 * up, rShoulder: [-0.4 * up, 0, -0.3], lShoulder: [-0.4 * up, 0, 0.3], rElbow: -0.5, lElbow: -0.5};
  }, a, f);
  const k = clamp((f - a) / 85);
  return (
    <>
      <Cam pos={[lerp(1.6, 2.0, k), lerp(1.3, 1.6, k), lerp(4.0, 5.2, k)]} look={[0.4, lerp(1.1, 1.75, k), -0.2]} fov={50} f={f} a={a} />
      <YardScene t={t} />
      <ControllerTree p={[0, 0, 0]} g={treeG(f)} t={t} />
      <Toy pose={pose} look={KID} headExtra={<StrawHat />} />
      <WateringCan p={[1.65, 0, 0.4]} r={[0, 2.6, Math.PI / 2]} s={1.1} />
    </>
  );
};
/* 6b — "...e em vez de fruta, dá controle!" + um cai na cabeça */
const CTRL = at(6, "controle");
const FALL0 = CTRL + 10;
const BONK = FALL0 + 9;
const BOY_T: V3 = [1.25, 0, -0.15];
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const fruit = [0, 1, 2, 3, 4, 5, 6].map((i) => backOut(ramp(f, CTRL - 6 + i * 2, CTRL + 2 + i * 2)));
  const hit = ramp(f, BONK, BONK + 3);
  const pose = physics("d6b" + a, (fr) => {
    const h = ramp(fr, BONK, BONK + 3);
    return {...idle(fr), pos: BOY_T, rotY: -1.0, head: [lerp(-0.45, 0.1, h), 0, 0.15 * h * Math.sin(fr / 3)], eyeWide: 0.7 * (1 - h), brow: lerp(0.9, -0.2, h), mouthOpen: lerp(0.45, 0.25, h), blink: h > 0.5 ? 0.6 : 0, squash: 0.12 * Math.max(0, 1 - Math.abs(fr - BONK - 2) / 4), rShoulder: [-0.3, 0, -0.3], lShoulder: [-0.3, 0, 0.3]};
  }, a, f);
  const top: V3 = [BOY_T[0] + 0.02, 2.06, BOY_T[2]];
  const start: V3 = [BOY_T[0] - 0.05, 2.95, BOY_T[2] - 0.05];
  const kf = clamp((f - FALL0) / (BONK - FALL0));
  const kb = clamp((f - BONK) / 16);
  const cp = f < BONK ? mix(start, top, kf * kf) : arc(top, [BOY_T[0] + 0.7, 0.05, BOY_T[2] + 0.6], kb, 0.5);
  return (
    <>
      <Cam pos={[2.45, 1.75, 4.6]} look={[0.8, 1.6, -0.2]} fov={50} f={f} a={a} />
      <YardScene t={t} />
      <ControllerTree p={[0, 0, 0]} g={treeG(f)} fruit={fruit} t={t} />
      {f >= FALL0 - 1 && <Controller p={cp} r={f < BONK ? [Math.PI / 2 - 0.3, 0.3, 0] : [kb * 7, kb * 3, 0]} s={1.25} color="#e8412c" />}
      <Toy pose={pose} look={KID} headExtra={<StrawHat />} />
      <DizzyStars p={[BOY_T[0], 2.2, BOY_T[2]]} k={hit} t={t} />
      <WateringCan p={[1.65, 0, 0.4]} r={[0, 2.6, Math.PI / 2]} s={1.1} />
    </>
  );
};

/* =================== DICA 4 — exílio lunar =================== */
const ROCKET_P: V3 = [-1.7, 0, -1.6];
const CHAIR_M: V3 = [0.35, 0, 0.15];
const ALIEN_C: V3 = [2.3, 0, -1.6];
const LAND = L(7) + 48;
const MoonProps: React.FC<{f: number; t: number; sign?: number}> = ({f, t, sign = 0}) => (
  <>
    <Rocket p={ROCKET_P} rotY={0.5} t={t} />
    <BeachChair p={CHAIR_M} rotY={-0.25} />
    <Crater p={ALIEN_C} r={0.62} />
    {sign > 0.01 && <SignPost p={[1.25, 0, 0.55]} r={[0, -0.5, 0]} s={sign} tex={semTomadaTex()} texKey="sem-tomada" w={0.6} h={0.4} post={0.55} />}
  </>
);
const moonSit = (fr: number, extra: Pose = {}): Pose => ({...idle(fr), pos: [CHAIR_M[0] + 0.1 * Math.sin(-0.25), BEACH_SEAT + 0.118 - 0.72, CHAIR_M[2] - 0.08], rotY: -0.25, legLift: 1.6, torso: [-0.42, 0, 0], ...extra});
/* 7a — o foguete pousa na Lua */
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (LAND - a));
  const y = lerp(7, 0, 1 - (1 - k) * (1 - k));
  const flame = f < LAND + 6 ? 1 : 1 - ramp(f, LAND + 6, LAND + 16);
  return (
    <>
      <Cam pos={[1.3, 1.5, 5.6]} look={[-0.7, lerp(2.4, 1.6, k), -1.2]} fov={50} f={f} a={a} />
      <MoonScene t={t} />
      <Rocket p={[ROCKET_P[0], y, ROCKET_P[2]]} rotY={0.5} flame={flame} t={t} />
      <Dust p={ROCKET_P} k={(f - LAND) / 30} />
      <BeachChair p={CHAIR_M} rotY={-0.25} />
      <Crater p={ALIEN_C} r={0.62} />
    </>
  );
};
/* 7b — de capacete, relaxando na cadeira de praia; "sem tomada" */
const TOMADA = at(7, "tomada");
const S16: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("d7" + a, (fr) => moonSit(fr, {rShoulder: [-0.55, 0, 0.45], rElbow: -1.0, lShoulder: [-0.55, 0, -0.45], lElbow: -1.0, smile: 1, blink: 0.85, head: [-0.1, 0, 0.05 * Math.sin(fr / 12)]}), a, f);
  return (
    <>
      <Cam pos={[1.35, 1.25, 3.0]} look={[0.62, 0.85, -0.1]} fov={46} f={f} a={a} />
      <MoonScene t={t} />
      <MoonProps f={f} t={t} sign={backOut(ramp(f, TOMADA - 4, TOMADA + 6))} />
      <Toy pose={pose} look={KID} headExtra={<Helmet />} />
    </>
  );
};
/* 8a — "Só que na Lua tem wi-fi..." */
const WIFI = at(8, "wifi");
const S17: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("d8" + a, (fr) => {
    const w = ramp(fr, WIFI, WIFI + 6);
    return moonSit(fr, {torso: [lerp(-0.42, -0.15, w), 0, 0], rShoulder: [-0.55, 0, 0.45], rElbow: -1.0, lShoulder: [-0.55, 0, -0.45], lElbow: -1.0, head: [-0.45 * w, 0, 0], eyeWide: 0.8 * w, brow: 0.9 * w, mouthOpen: 0.4 * w, blink: w > 0.2 ? 0 : 0.85, smile: 1 - w});
  }, a, f);
  return (
    <>
      <Cam pos={[1.2, 0.95, 2.6]} look={[0.25, 1.75, -1.4]} fov={52} f={f} a={a} />
      <MoonScene t={t} />
      <MoonProps f={f} t={t} sign={1} />
      <Wifi p={[0.2, 3.1, -2.2]} s={1.25} k={backOut(ramp(f, WIFI - 2, WIFI + 8))} t={t} />
      <Toy pose={pose} look={KID} headExtra={<Helmet />} />
    </>
  );
};
/* 8b — o alienígena sai da cratera com dois controles */
const ALIEN = at(8, "alienigena");
const DOIS = at(8, "dois");
const S18: React.FC<ShotProps> = ({f, a, t}) => {
  const rise = backOut(ramp(f, ALIEN - 4, ALIEN + 12));
  const offer = easeInOut(ramp(f, DOIS - 4, DOIS + 6));
  const pose = physics("d8b" + a, (fr) => moonSit(fr, {torso: [-0.15, 0, 0], rShoulder: [lerp(-0.55, -1.0, offer), 0, 0.2], rElbow: lerp(-1.0, -0.4, offer), lShoulder: [-0.55, 0, -0.45], lElbow: -1.0, head: [0, 0.7, 0], eyeWide: 0.8, brow: 0.9, mouthOpen: 0.35, smile: 0.4 * offer}), a, f);
  return (
    <>
      <Cam pos={[1.15, 1.35, 4.4]} look={[1.2, 0.95, -0.6]} fov={52} f={f} a={a} />
      <MoonScene t={t} />
      <Wifi p={[0.2, 3.1, -2.2]} s={1.25} k={1} t={t} />
      <MoonProps f={f} t={t} sign={1} />
      <Alien a={{pos: [ALIEN_C[0], lerp(-1.45, 0, rise), ALIEN_C[2]], rotY: -0.84, offer, t, blink: blinkCurve(f + 11), mouth: 0.35 * ramp(f, ALIEN + 6, ALIEN + 10) * (1 - ramp(f, ALIEN + 30, ALIEN + 36))}} />
      <Toy pose={pose} look={KID} headExtra={<Helmet />} />
    </>
  );
};

/* =================== DICA 5 — paciência estratégica =================== */
const CHAIR_S: V3 = [7.3, 0.08, -2.2];
const BOY_S: V3 = [CHAIR_S[0], CHAIR_S[1] + CAMP_SEAT + 0.118 - 0.72, CHAIR_S[2] - 0.02];
const sitStore = (fr: number, extra: Pose = {}): Pose => ({...idle(fr), pos: BOY_S, rotY: 0, legLift: 1.75, ...extra});
const crossed: Pose = {rShoulder: [-1.15, 0, 0.6], rElbow: -1.45, lShoulder: [-1.05, 0, -0.6], lElbow: -1.45};
const BEARD0 = at(9, "anos") ;
const beardG = (f: number) => 0.12 * ramp(f, BEARD0, BEARD0 + 40) + 0.88 * easeInOut(ramp(f, at(10, "mais"), at(10, "anos") + 6));
const WEB = (f: number) => ramp(f, at(10, "dez") - 4, at(10, "dez") + 10);
const BIRD = at(10, "anos");
const StoreKid: React.FC<{f: number; t: number; pose: Pose; nest?: number; bird?: number}> = ({f, t, pose, nest = 0, bird = 0}) => (
  <>
    <CampChair p={CHAIR_S} />
    <Toy
      pose={pose}
      look={KID}
      headExtra={
        <>
          <Beard g={beardG(f)} t={t} />
          <Nest k={nest} bird={bird} t={t} />
        </>
      }
    />
  </>
);
/* 9a — "E a dica número cinco..." sentado na porta da loja, de braços cruzados */
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (at(9, "voce") - a));
  const pose = physics("d9" + a, (fr) => sitStore(fr, {...crossed, brow: -0.4, smile: 0.3, head: [0, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[lerp(6.6, 7.1, k), lerp(1.8, 1.4, k), lerp(4.4, 1.6, easeInOut(k))]} look={[lerp(6.4, 7.1, k), lerp(1.5, 1.05, k), -2.6]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[7, 0, -2]} />
      <StoreKid f={f} t={t} pose={pose} />
    </>
  );
};
/* 9b — "você já esperou esse jogo por anos... então espera mais um pouquinho" (calendário voando) */
const S20: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("d9b" + a, (fr) => sitStore(fr, {...crossed, bags: ramp(fr, a + 30, a + 120) * 0.8, blink: 0.25 + 0.75 * blinkCurve(fr), brow: 0.2, smile: 0.1, head: [0.08, 0, 0.06 * Math.sin(fr / 20)]}), a, f);
  const pages = Array.from({length: 14}, (_, i) => {
    const s = a + 6 + i * 9;
    const k = (f - s) / 28;
    if (k < 0 || k > 1) return null;
    return <CalendarPage key={i} i={i} p={[lerp(8.6, 6.0, k), 1.0 + 0.6 * Math.sin(i * 1.7) + 0.4 * Math.sin(k * 6 + i), -1.2 + 0.4 * Math.cos(i)]} r={[k * 4 + i, k * 6, k * 3]} />;
  });
  return (
    <>
      <Cam pos={[7.35, 1.3, 0.6]} look={[7.3, 1.0, -2.3]} fov={46} f={f} a={a} />
      <StreetScene t={t} target={[7, 0, -2]} />
      <StoreKid f={f} t={t} pose={pose} />
      {pages}
    </>
  );
};
/* 10 — "Tipo... mais uns dez anos!" barba até o chão, teia, passarinho */
const S21: React.FC<ShotProps> = ({f, a, t}) => {
  const web = WEB(f);
  const pose = physics("d10" + a, (fr) => sitStore(fr, {...crossed, bags: 0.8, blink: 0.45 + 0.55 * blinkCurve(fr), brow: 0.3, smile: 0, head: [0.1, 0, 0]}), a, f);
  const pages = Array.from({length: 8}, (_, i) => {
    const s = a + i * 8;
    const k = (f - s) / 22;
    if (k < 0 || k > 1) return null;
    return <CalendarPage key={i} i={i + 20} p={[lerp(8.8, 5.8, k), 1.2 + 0.5 * Math.sin(i * 2.1), -1.0]} r={[k * 4 + i, k * 6, k * 3]} />;
  });
  return (
    <>
      <Cam pos={[8.15, 1.15, 0.35]} look={[7.3, 0.85, -2.25]} fov={48} f={f} a={a} />
      <StreetScene t={t} target={[7, 0, -2]} />
      <StoreKid f={f} t={t} pose={pose} nest={backOut(ramp(f, BIRD - 14, BIRD - 6))} bird={easeOut(ramp(f, BIRD - 6, BIRD + 8))} />
      <Cobweb p={[CHAIR_S[0] + 0.36, CHAIR_S[1] + 0.12, CHAIR_S[2] + 0.2]} r={[0, -Math.PI / 2, 0]} s={0.7} k={web} />
      <Cobweb p={[CHAIR_S[0] - 0.36, CHAIR_S[1] + 0.55, CHAIR_S[2] - 0.15]} r={[0, Math.PI / 2, Math.PI / 2]} s={0.8} k={web} />
      <Cobweb p={[CHAIR_S[0] + 0.25, CHAIR_S[1] + 0.95, CHAIR_S[2] - 0.2]} r={[0, 0, Math.PI]} s={0.6} k={web} />
      {pages}
    </>
  );
};

/* =================== Parabéns — todo mundo reunido na porta da loja =================== */
const PB = L(11);
const Gang: React.FC<{f: number; t: number}> = ({f, t}) => (
  <>
    <Dog d={{pos: [6.4, 0.08, -2.05], rotY: 0.35, legs: "hold", headset: true, controller: true, play: 1, t, tail: 1, mouth: 0.2, tongue: 0.6, blink: dogBlink(f)}} s={0.95} />
    <Alien a={{pos: [8.1, 0.08, -2.0], rotY: -0.45, offer: 0.4 + 0.2 * Math.sin(t * 3), t, blink: blinkCurve(f + 11), mouth: 0.3}} />
    {/* vaso com a árvore de controles */}
    <group position={[5.55, 0.08, -2.35]}>
      <mesh position={[0, 0.2, 0]} material={sm("#c0603a", 0.7)} castShadow>
        <cylinderGeometry args={[0.32, 0.25, 0.4, 24]} />
      </mesh>
      <ControllerTree p={[0, 0.38, 0]} g={0.62} fruit={[1, 1, 1, 1, 1, 1, 1]} t={t} />
    </group>
    <MathBook p={[7.75, 0.08, -1.6]} r={[0, -0.5, 0]} s={0.7} lock={1} />
  </>
);
const S22: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("pb" + a, (fr) => sitStore(fr, {rShoulder: [-2.4, 0, -0.5], rElbow: -0.3, lShoulder: [-2.4, 0, 0.5], lElbow: -0.3, bags: 0.6, smile: 1, brow: 0.6, mouthOpen: 0.3}), a, f);
  const k = clamp((f - a) / 150);
  return (
    <>
      <Cam pos={[6.83, 1.6, lerp(3.4, 3.1, k)]} look={[6.83, 1.0, -2.2]} fov={58} f={f} a={a} />
      <StreetScene t={t} target={[7, 0, -2]} />
      <StoreKid f={f} t={t} pose={pose} nest={1} bird={1} />
      <Gang f={f} t={t} />
    </>
  );
};
const S23: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("pb2" + a, (fr) => sitStore(fr, {rShoulder: [-0.6, 0, 0.3], rElbow: -1.2, lShoulder: [-0.6, 0, -0.3], lElbow: -1.2, bags: 0.6, smile: 0.8, brow: 0.3, head: [0, -0.2, 0]}), a, f);
  const k = clamp((f - a) / 160);
  return (
    <>
      <Cam pos={[lerp(5.0, 5.3, k), 1.2, lerp(1.2, 1.0, k)]} look={[7.0, 1.0, -2.2]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[7, 0, -2]} />
      <StoreKid f={f} t={t} pose={pose} nest={1} bird={1} />
      <Gang f={f} t={t} />
    </>
  );
};
/* final — olha pra câmera: "é só lembrar dessas..." (emenda no começo) */
const S24: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (TOTAL_GTA - a));
  const pose = physics("fim" + a, (fr) => sitStore(fr, {...crossed, bags: 0.6, smile: 0.7, brow: lerp(0.2, 0.9, ramp(fr, at(12, "dessas") - 6, at(12, "dessas"))), head: [0.05, 0, 0.12], mouthOpen: talk(fr, a + 2, TOTAL_GTA) * 0.5}), a, f);
  return (
    <>
      <Cam pos={[7.3, 1.38, lerp(-0.05, -0.35, k)]} look={[7.3, 1.12, -2.25]} fov={42} f={f} a={a} punch={4} />
      <StreetScene t={t} target={[7, 0, -2]} />
      <StoreKid f={f} t={t} pose={pose} nest={1} bird={1} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "a", 0), Comp: S1},
  {from: L(1), Comp: S2},
  {from: OPEN1 - 2, Comp: S3},
  {from: at(1, "dentro"), Comp: S4},
  {from: L(2), Comp: S5},
  {from: at(2, "ate"), Comp: S6},
  {from: L(3), Comp: S7},
  {from: at(3, "contrate"), Comp: S8},
  {from: L(4), Comp: S9},
  {from: at(4, "e", 1), Comp: S10},
  {from: L(5), Comp: S11},
  {from: TROQUE, Comp: S12},
  {from: L(6), Comp: S13},
  {from: at(6, "e", 0), Comp: S14},
  {from: L(7), Comp: S15},
  {from: at(7, "va"), Comp: S16},
  {from: L(8), Comp: S17},
  {from: at(8, "e", 0), Comp: S18},
  {from: L(9), Comp: S19},
  {from: at(9, "voce"), Comp: S20},
  {from: L(10), Comp: S21},
  {from: PB, Comp: S22},
  {from: at(11, "tem"), Comp: S23},
  {from: L(12), Comp: S24},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_GTA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["cinco", "dicas", "nao", "gta", "6", "ultima", "vida", "esconderijo", "academico", "controle", "jamais", "livro", "matematica", "perfeitamente", "mae", "estudar", "seguranca", "canina", "cachorro", "videogame", "banido", "sofa", "agricultura", "terapeutica", "hobby", "saudavel", "arvore", "cresce", "fruta", "exilio", "lunar", "lua", "tomada", "wifi", "alienigena", "dois", "controles", "poderosa", "paciencia", "estrategica", "anos", "pouquinho", "dez", "parabens", "estuda", "jogando", "amigo", "barba", "vontade", "jogar", "dessas"]);
const Bubble: React.FC<{from: number; to: number; text: string; x: number; y: number; color?: string; shakeAmt?: number}> = ({from, to, text, x, y, color = "#101018", shakeAmt = 0}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  const sx = shakeAmt * Math.sin(f * 2.1) * 8;
  return (
    <div style={{position: "absolute", left: x - 360 + sx, top: y, width: 720, display: "flex", justifyContent: "center", transform: `scale(${s}) rotate(${-4 + shakeAmt * Math.sin(f * 1.7) * 2}deg)`}}>
      <div style={{background: "#fff", color, fontFamily, fontWeight: 900, fontSize: 92, padding: "18px 44px", borderRadius: 44, border: "8px solid #101018", textAlign: "center", lineHeight: 1.05, boxShadow: "0 10px 0 rgba(0,0,0,0.25)", WebkitTextStroke: "3px #101018", paintOrder: "stroke fill"}}>{text}</div>
    </div>
  );
};
/** gotinhas de suor na abertura */
const Sweat: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1].map((i) => {
        const k = ((f - from) / 24 + i * 0.5) % 1;
        return (
          <svg key={i} width={60} height={80} style={{position: "absolute", left: x + i * 60, top: y + k * 90, opacity: 1 - k}} viewBox="0 0 60 80">
            <path d="M30 4 C 44 30, 54 44, 54 56 A 24 24 0 0 1 6 56 C 6 44, 16 30, 30 4 Z" fill="#7fd4ff" stroke="#101018" strokeWidth={5} />
          </svg>
        );
      })}
    </>
  );
};

/* ======================= vídeo ======================= */
const FX = 0.3;
const MUSIC = 0.125;
const SND: React.FC<{src: string; from: number; dur?: number; v: number; loop?: boolean}> = ({src, from, dur = 60, v, loop}) => (
  <Sequence from={Math.max(0, from)} durationInFrames={dur}>
    <Audio src={staticFile(src)} volume={v} loop={loop} />
  </Sequence>
);
export const VideoGta: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const titles = [L(1), L(3), L(5), L(7), at(9, "paciencia") - 4];
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <StageTitle from={3} to={at(0, "a", 0) - 3} lines={["5 DICAS"]} />
      <StageTitle from={L(1) + 4} to={OPEN1 - 4} kicker="DICA 1" lines={["ESCONDERIJO", "ACADÊMICO"]} />
      <StageTitle from={L(3) + 4} to={at(3, "contrate") - 3} kicker="DICA 2" lines={["SEGURANÇA", "CANINA"]} />
      <StageTitle from={L(5) + 4} to={TROQUE - 3} kicker="DICA 3" lines={["AGRICULTURA", "TERAPÊUTICA"]} />
      <StageTitle from={L(7) + 4} to={at(7, "va") - 3} kicker="DICA 4" lines={["EXÍLIO", "LUNAR"]} />
      <StageTitle from={at(9, "paciencia") - 4} to={at(9, "voce") - 3} kicker="DICA 5" lines={["PACIÊNCIA", "ESTRATÉGICA"]} />

      <Sweat from={10} to={NAO + 4} x={640} y={640} />
      <Sparkles from={at(0, "a", 0)} to={L(1) - 2} x={540} y={760} r={300} />
      <Bubble from={MAE - 2} to={ESTUDAR + 4} text="VAI ESTUDAR!" x={400} y={220} color="#e8262d" shakeAmt={1} />
      <Sparkles from={ESTUDAR + 8} to={L(3) - 2} x={500} y={1000} r={280} />
      <Chip from={at(10, "dez") - 2} to={PB - 2} text="+10 ANOS" bg="#8a5cf0" top={300} size={110} />
      <Confetti from={PB} to={PB + 110} />
      <Chip from={PB + 1} to={at(11, "estuda") - 3} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(11, "estuda")} to={L(12) - 2} x={190} y={420} rot={-6} label="ESTUDA JOGANDO">
        <g transform="translate(152,100)">
          <rect x={-80} y={-55} width={160} height={110} rx={10} fill="#c0392b" stroke="#101018" strokeWidth={6} />
          <rect x={-46} y={-22} width={92} height={40} rx={18} fill="#2b2e3b" stroke="#101018" strokeWidth={4} />
          <circle cx={-22} cy={-2} r={7} fill="#ffffff" />
          <circle cx={24} cy={-2} r={7} fill="#2ecc71" />
        </g>
      </Sticker>
      <Sticker from={at(11, "banido")} to={L(12) - 2} x={540} y={400} rot={4} label="BANIDO DO SOFÁ">
        <g transform="translate(152,105)">
          <rect x={-90} y={-30} width={180} height={60} rx={14} fill="#3cb3a5" stroke="#101018" strokeWidth={6} />
          <rect x={-90} y={-70} width={180} height={50} rx={14} fill="#3cb3a5" stroke="#101018" strokeWidth={6} />
        </g>
        <Cross />
      </Sticker>
      <Sticker from={at(11, "arvore")} to={L(12) - 2} x={890} y={430} rot={6} label="ÁRVORE GAMER">
        <g transform="translate(152,100)">
          <rect x={-12} y={10} width={24} height={70} fill="#8a5a2b" stroke="#101018" strokeWidth={5} />
          <circle cx={0} cy={-20} r={62} fill="#4cb33f" stroke="#101018" strokeWidth={6} />
          <rect x={-40} y={-10} width={34} height={18} rx={8} fill="#2b2e3b" />
          <rect x={10} y={-40} width={34} height={18} rx={8} fill="#e8412c" />
        </g>
      </Sticker>
      <Sticker from={at(11, "alienigena")} to={L(12) - 2} x={250} y={1620} rot={-4} label="AMIGO ET">
        <g transform="translate(152,105)">
          <ellipse cx={0} cy={0} rx={70} ry={62} fill="#7ed957" stroke="#101018" strokeWidth={6} />
          <ellipse cx={-28} cy={-4} rx={18} ry={24} fill="#101018" transform="rotate(-20 -28 -4)" />
          <ellipse cx={28} cy={-4} rx={18} ry={24} fill="#101018" transform="rotate(20 28 -4)" />
          <path d="M -18 32 Q 0 44 18 32" stroke="#101018" strokeWidth={5} fill="none" />
        </g>
      </Sticker>
      <Sticker from={at(11, "barba")} to={L(12) - 2} x={830} y={1620} rot={5} label="BARBA DE 10 ANOS">
        <g transform="translate(152,90)">
          <circle cx={0} cy={-25} r={42} fill="#f1c08f" stroke="#101018" strokeWidth={5} />
          <path d="M -40 -15 Q -50 70 0 95 Q 50 70 40 -15 Q 0 10 -40 -15 Z" fill="#f4f4f0" stroke="#101018" strokeWidth={5} />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozgta.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 12) * (1 - ramp(fr, TOTAL_GTA - 20, TOTAL_GTA))} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FX * 0.18} />
      ))}
      {titles.map((b) => (
        <SND key={"b" + b} src="sfx7/boing.mp3" from={b + 3} dur={32} v={FX * 0.75} />
      ))}
      <SND src="sfx11/drama.mp3" from={at(0, "a", 0) - 2} dur={60} v={FX * 0.5} />
      <SND src="sfx11/lock.mp3" from={LOCK + 2} dur={30} v={FX * 0.9} />
      <SND src="sfx11/whistle.mp3" from={LOCK + 12} dur={L(2) - LOCK - 12} v={FX * 0.4} />
      <SND src="sfx11/angels.mp3" from={ESTUDAR + 4} dur={75} v={FX * 0.6} />
      <SND src="sfx11/bark.mp3" from={L(3) + 10} dur={36} v={FX * 0.6} />
      <SND src="sfx11/bark.mp3" from={VIGIAR + 4} dur={36} v={FX * 0.55} />
      <SND src="sfx11/gaming.mp3" from={L(4)} dur={L(5) - L(4)} v={FX * 0.45} loop />
      <SND src="sfx10/sad.mp3" from={BANIDO} dur={60} v={FX * 0.55} />
      <SND src="sfx7/whoosh.mp3" from={THROW - 2} dur={25} v={FX * 0.4} />
      <SND src="sfx11/water.mp3" from={WATER} dur={L(6) - WATER} v={FX * 0.6} />
      <SND src="sfx11/grow.mp3" from={G1 - 3} dur={60} v={FX * 0.7} />
      <SND src="sfx11/grow.mp3" from={G2 - 3} dur={60} v={FX * 0.7} />
      {[0, 3, 6].map((d) => (
        <SND key={"pp" + d} src="sfx7/pof.mp3" from={CTRL - 4 + d * 2} dur={22} v={FX * 0.4} />
      ))}
      <SND src="sfx10/bonk.mp3" from={BONK - 1} dur={30} v={FX * 0.9} />
      <SND src="sfx11/rocket.mp3" from={L(7)} dur={80} v={FX * 0.65} />
      <SND src="sfx10/plim.mp3" from={WIFI} dur={30} v={FX * 0.8} />
      <SND src="sfx11/alien.mp3" from={ALIEN} dur={45} v={FX * 0.7} />
      <SND src="sfx11/alien.mp3" from={DOIS + 4} dur={45} v={FX * 0.55} />
      <SND src="sfx11/wind.mp3" from={at(9, "voce")} dur={L(10) - at(9, "voce") + 40} v={FX * 0.45} loop />
      <SND src="sfx10/tick.mp3" from={L(10)} dur={PB - L(10)} v={FX * 0.5} loop />
      <SND src="sfx11/bird.mp3" from={BIRD - 6} dur={45} v={FX * 0.6} />
      <SND src="sfx7/confetti.mp3" from={PB - 2} dur={61} v={FX * 0.6} />
      {[at(11, "estuda"), at(11, "banido"), at(11, "arvore"), at(11, "alienigena"), at(11, "barba")].map((p, i) => (
        <SND key={"st" + i} src="sfx7/pof.mp3" from={p} dur={22} v={FX * 0.55} />
      ))}
    </AbsoluteFill>
  );
};
