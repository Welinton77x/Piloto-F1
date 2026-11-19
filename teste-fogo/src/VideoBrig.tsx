import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {Penguin} from "./Sets11";
import {Scooter} from "./Sets8";
import {WaterJet} from "./Sets13";
import {Bolt} from "./Sets14";
import {Space} from "./Sets18";
import {SkyClouds} from "./Sets19";
import {Bg} from "./Sets20";
import {Lata, TiaGeladeira, PrimoBatedeira, Lula, Bambolete, Pudim, BrigMonster, Panela, SprinklePile, Cushion, SprinkleCart, Toboga, StairQueue, ChocoBath, LunaGround, JellyWorld, SkyRip, WaterPark} from "./Sets28";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingBrig.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_BRIG = F(words[words.length - 1].e + 0.9);

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
const MAS0 = at(0, "mas");
const ALTURA0 = at(0, "altura");
const TIA1 = at(1, "tia");
const OITO1 = at(1, "oito");
const MAS1 = at(1, "mas");
const PEDIR1 = at(1, "pedir");
const FRANCES1 = at(1, "frances");
const QUINHENTAS2 = at(2, "quinhentas");
const SEGUIDORES2 = at(2, "seguidores");
const INCLUSIVE2 = at(2, "inclusive");
const PRIMO3 = at(3, "primo");
const EMPURRA3 = at(3, "empurra");
const DECOLA3 = at(3, "decola");
const LULA5 = at(5, "lula");
const APAGA5 = at(5, "apaga");
const COBRA5 = at(5, "cobra");
const SO5 = at(5, "so");
const PINGUIM6 = at(6, "pinguim");
const MOEDA6 = at(6, "moeda");
const TERRA6 = at(6, "terra");
const FIADO6 = at(6, "fiado");
const FURA7 = at(7, "fura");
const CAI7 = at(7, "cai");
const GELATINA7 = at(7, "gelatina");
const BRIG7 = at(7, "brigadeiro");
const FLIGORAR8 = at(8, "fligorar");
const PLOFT8 = at(8, "ploft");
const DIMENSAO8 = at(8, "dimensao");
const CHOQUE10 = at(10, "choque");
const MEXE10 = at(10, "mexe");
const SAI10 = at(10, "sai");
const CHOCO11 = at(11, "chocolate", 1);
const ACABAM12 = at(12, "acabam");
const PINGUIM12 = at(12, "pinguim");
const COBRA12B = at(12, "cobra", 1);
const UNICO12 = at(12, "unico");
const PARABENS13 = at(13, "parabens");
const SAIU13 = at(13, "saiu");
const TRANCAR14 = at(14, "trancar");
const SEMPRE14 = at(14, "sempre");

const PAN_ITEM = (
  <group rotation={[Math.PI / 2, 0, 0]}>
    <Panela p={[0.0, -0.12, 0.05]} s={0.45} />
  </group>
);
const HOLD_PAN: Pose = {rShoulder: [-0.9, 0.3, 0.05], rElbow: -1.1};
const SHRUG: Pose = {rShoulder: [-0.4, 0.2, -0.9], rElbow: -1.2, lShoulder: [-0.4, -0.2, 0.9], lElbow: -1.2};


/* ---------- física e movimento do menino ---------- */
const tf = (fr: number) => fr / FPS;
/** pulinho (arco) começando em `from` */
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
/** amassadinha ao pousar */
const land = (fr: number, at: number, d = 8) => {
  const k = (fr - at) / d;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.1 : 0;
};
/** pulos repetidos (gravidade baixa da Lua) */
const bounce = (fr: number, period = 34, h = 0.3) => Math.abs(Math.sin((fr / period) * Math.PI)) * h;
const WAVE = (fr: number): Pose => ({lShoulder: [-2.7, 0, 0.45], lElbow: -0.6 + 0.45 * Math.sin(tf(fr) * 14)});
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode; look?: ToyLook; headExtra?: React.ReactNode}> = ({id, a, f, pose, item, look = BOY, headExtra}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={look} headExtra={headExtra} item={item} /> : <Toy pose={p} look={look} headExtra={headExtra} />;
};

/* fundo de cor chapada + chão de cor chapada (igual à referência) */
const Flat: React.FC<{bg: string; ground: string; light?: number}> = ({bg, ground, light = 1}) => (
  <>
    <Bg c={bg} />
    <hemisphereLight args={["#ffffff", "#8a7a9a", 1.0 * light]} />
    <directionalLight position={[-4, 8, 6]} intensity={2.2 * light} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm(ground, 0.9)} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
  </>
);

/* 0 — o menino, a panela e a lata medrosa */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const scared = f >= MAS0 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.25, 1.5, 5.3]} look={[0.25, 0.95, 0]} fov={50} f={f} a={a} />
      <Flat bg="#ffb04a" ground="#ff8f3a" />
      <PBoy id="s0" a={a} f={f} item={PAN_ITEM} pose={(fr) => {
        const w = clamp(fr / 40);
        const sc = fr >= MAS0;
        const shake = fr >= ALTURA0 ? 0.25 * Math.sin(tf(fr) * 16) * (1 - clamp((fr - ALTURA0) / 24)) : 0;
        return {...idle(fr), pos: [lerp(-1.7, -0.35, easeOut(w)), hop(fr, MAS0, 14, 0.3), 0], rotY: w < 1 ? 1.2 : 0.25, walk: tf(fr) * 9, walkAmt: w < 1 ? 1 : 0, ...HOLD_PAN, smile: sc ? 0 : 1, eyeWide: sc ? 0.9 : 0.2, brow: sc ? 1 : 0, mouthOpen: sc && fr < MAS0 + 30 ? 0.5 : 0, squash: land(fr, MAS0 + 14), head: sc ? [0.3, 0.45 + shake, 0] : [0, 0.15 * Math.sin(tf(fr) * 2), 0], ...(sc ? {lShoulder: [-1.8, 0, 0.5], lElbow: -1.0} : {})};
      }} />
      {(() => {
        const j = clamp((f - MAS0) / 12);
        return <Lata p={[lerp(0.9, 0.2, j), Math.sin(j * Math.PI) * 0.6 + (f < MAS0 ? Math.abs(Math.sin(t * 6)) * 0.05 : 0), lerp(0.2, 0.35, j)]} rotY={-0.3} s={1.1} t={t} scared={scared} arms={scared} walk={f < MAS0 ? 1 : 0} />;
      })()}
    </>
  );
};

/* 1 — o parque aquático da tia geladeira */
const TOB_P: V3 = [2.4, 0, -4.5];
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const up = f >= OITO1 - 4 && f < MAS1 - 4 ? easeInOut(clamp((f - OITO1 + 4) / 30)) : 0;
  const open = f >= FRANCES1 + 6 ? easeOut(clamp((f - FRANCES1 - 6) / 12)) : 0;
  const close = f >= MAS1 - 4;
  return (
    <>
      {close ? (
        <Cam pos={[0.15, 1.6, 5.4]} look={[0.15, 1.15, -0.4]} fov={54} f={f} a={MAS1 - 4} />
      ) : (
        <Cam pos={[0.0, 1.8, 6.4]} look={[0.6, 1.6 + up * 14, -2.5]} fov={60} f={f} a={up > 0 ? OITO1 - 4 : a} />
      )}
      <Flat bg="#7fd0ff" ground="#f2e3c9" />
      <WaterPark t={t} />
      <Toboga p={TOB_P} h={30} />
      <TiaGeladeira p={[-0.5, 0, -1.0]} rotY={0.15} s={1.0} open={open} mouth={f >= TIA1 && f < TIA1 + 20 ? 0.4 : 0} blink={blinkCurve(f + 3)} />
      <PBoy id="s1" a={a} f={f} item={PAN_ITEM} pose={(fr) => {
        const w = clamp((fr - a) / 45);
        const look = fr >= OITO1 - 4 && fr < MAS1;
        const bow = fr >= PEDIR1 && fr < FRANCES1 + 8 ? Math.sin(clamp((fr - PEDIR1) / (FRANCES1 + 8 - PEDIR1)) * Math.PI) : 0;
        const happy = fr >= FRANCES1 + 6;
        return {...idle(fr), pos: [lerp(2.4, 0.7, easeOut(w)), hop(fr, FRANCES1 + 8, 14, 0.35) + hop(fr, FRANCES1 + 24, 14, 0.3), lerp(1.4, 0.6, w)], rotY: w < 1 ? -1.4 : -0.5, walk: tf(fr) * 9, walkAmt: w < 1 ? 1 : 0, ...HOLD_PAN, smile: 1, mouthOpen: fr >= PEDIR1 && fr < FRANCES1 + 20 ? 0.3 + 0.3 * Math.abs(Math.sin(tf(fr) * 10)) : 0, torso: [bow * 0.45 - (look ? 0.15 : 0), 0, 0], head: look ? [-0.7, 0.2, 0] : [0, 0, 0], eyeWide: look ? 1 : 0.2, ...(fr >= TIA1 && fr < TIA1 + 40 ? WAVE(fr) : happy ? {lShoulder: [-2.7, 0, 0.4], lElbow: -0.3} : bow > 0 ? {lShoulder: [-0.8, -0.6, 0], lElbow: -1.8} : {})};
      }} />
      <Lata p={[1.3, 0, 0.8]} rotY={-0.4} s={1.0} t={t} scared={0.4} />
    </>
  );
};
/* 2 — a fila dos 550 seguidores */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const close = f >= INCLUSIVE2 - 4;
  return (
    <>
      {close ? (
        <Cam pos={[1.6, 3.2, 0.6]} look={[0, 2.0, -2.3]} fov={44} f={f} a={INCLUSIVE2 - 4} />
      ) : (
        <Cam pos={[3.2, 2.6, 4.2]} look={[0, 2.2, -2.4]} fov={60} f={f} a={a} />
      )}
      <Flat bg="#7fd0ff" ground="#f2e3c9" />
      <StairQueue p={[0, 0.05, 0]} n={18} t={t} gap={6} />
      {close && (
        <group position={[-0.05, 6 * 0.32 - 0.05, -6 * 0.38]} scale={0.42}>
          <PBoy id="s2" a={INCLUSIVE2 - 4} f={f} pose={(fr) => ({...idle(fr), pos: [0, hop(fr, INCLUSIVE2 - 2, 12, 0.5), 0], rotY: 0.45, rShoulder: [-1.55, 0.25, -0.05], rElbow: -0.1, lShoulder: [-0.4, 0, 0.5], lElbow: -1.6, smile: 1, mouthOpen: fr < INCLUSIVE2 + 30 ? 0.3 + 0.3 * Math.abs(Math.sin(tf(fr) * 10)) : 0, head: [0.05, 0.25, 0.1 * Math.sin(tf(fr) * 4)], blink: fr > INCLUSIVE2 + 20 && fr < INCLUSIVE2 + 34 ? 1 : 0})} />
        </group>
      )}
      {close && (
        <group position={[0.45, 6 * 0.32 + 0.3, -6 * 0.38]}>
          <mesh position={[0, -0.2, 0]} material={sm("#8a6a4a", 0.6)}>
            <boxGeometry args={[0.04, 0.5, 0.04]} />
          </mesh>
          <mesh position={[0, 0.15, 0]} geometry={rbox(0.62, 0.3, 0.03, 0.02)} material={sm("#ffd21f", 0.5)} />
        </group>
      )}
    </>
  );
};
/* 3 — o primo batedeira empurra a lata lá no alto */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const push = f >= EMPURRA3 ? clamp((f - EMPURRA3) / 30) : 0;
  const launched = f >= DECOLA3 - 6;
  const lk = launched ? clamp((f - DECOLA3 + 6) / 24) : 0;
  return (
    <>
      <Cam pos={[0.2, 31.8 + lk * 3, 6.4]} look={[0.15, 30.9 + lk * 5, 0]} fov={58} f={f} a={a} />
      <Bg c="#7fd0ff" />
      <hemisphereLight args={["#ffffff", "#8a9aaa", 1.1]} />
      <directionalLight position={[-4, 40, 6]} intensity={2.2} />
      <SkyClouds x={0} />
      <mesh position={[0, 30.0, 0]} geometry={rbox(4, 0.3, 2.6, 0.05)} material={sm("#c9ccd3", 0.5)} receiveShadow />
      <PrimoBatedeira p={[-1.0, 30.15, -0.2]} rotY={0.4} s={1.3} t={t} spin={push > 0 ? 3 : 1} mouth={push > 0 ? 0.5 : 0} />
      <PBoy id="s3" a={a} f={f} item={PAN_ITEM} pose={(fr) => {
        const l = fr >= DECOLA3 - 6;
        const pushing = fr >= EMPURRA3 && !l;
        return {...idle(fr), pos: [1.3, 30.15 + hop(fr, DECOLA3 - 4, 14, 0.45) + hop(fr, DECOLA3 + 12, 12, 0.3), 0.1], rotY: -0.4, ...HOLD_PAN, eyeWide: l ? 1 : pushing ? 0.7 : 0.3, mouthOpen: l ? 0.5 : 0, brow: pushing || l ? 1 : 0, torso: [pushing ? 0.25 : l ? -0.2 : 0, 0, 0], head: l ? [-0.7, 0.2, 0] : pushing ? [0.2, -0.3, 0] : [0, 0, 0], ...(l ? WAVE(fr) : {}), squash: land(fr, DECOLA3 + 10)};
      }} />
      <Lata p={[lerp(0.1, 0.4, push), 30.15 + lk * lk * 12, lerp(0.2, -0.4, push)]} r={[launched ? -lk * 4 : 0, 0, launched ? lk * 2 : 0]} s={1.0} t={t} scared={1} arms={1} />
    </>
  );
};
/* 4 — tobogã espacial: a lata voando pelas estrelas */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / 60);
  return (
    <>
      <Cam pos={[0, 0.5, 6]} look={[0, 0.6, 0]} fov={56} f={f} a={a} punch={4} />
      <Space t={t} />
      <hemisphereLight args={["#ffffff", "#203050", 1.0]} />
      <directionalLight position={[-5, 6, 6]} intensity={2.2} />
      <mesh position={[3.2 - k * 1.2, 3.6 - k * 0.8, -6]} material={sm("#d9d3e6", 0.9, {emissive: "#6a6480", emissiveIntensity: 0.3})}>
        <sphereGeometry args={[1.6 + k * 0.6, 32, 24]} />
      </mesh>
      <Lata p={[-0.6 + k * 1.2, -0.6 + k * 1.4, 0]} r={[-0.6, t * 3, 0.4]} s={1.2} t={t} scared={1} arms={1} />
      <SpeedLines p={[-0.6 + k * 1.2, -1.0 + k * 1.4, 0]} />
    </>
  );
};

/* =================== na Lua =================== */
const Moon: React.FC<{t: number}> = ({t}) => (
  <>
    <Bg c="#b9a6e0" />
    <hemisphereLight args={["#ffffff", "#7a6a9a", 1.0]} />
    <directionalLight position={[-4, 8, 6]} intensity={2.3} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
    <LunaGround t={t} />
  </>
);
const PAN_P: V3 = [0, 0, -0.2];
/* 5 — sem fogão: a lula bombeira */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const lula = f >= LULA5 - 4 ? easeOut(clamp((f - LULA5 + 4) / 14)) : 0;
  const spray = f >= APAGA5 && f < COBRA5 - 4;
  const flame = f < APAGA5 + 6;
  const shrug = f >= SO5;
  return (
    <>
      <Cam pos={[0.15, 1.9, 6.8]} look={[0.1, 1.05, -0.3]} fov={58} f={f} a={a} />
      <Moon t={t} />
      <Panela p={PAN_P} s={1.0} />
      {flame && (
        <mesh position={[PAN_P[0], 0.15, PAN_P[2]]} material={sm("#ff9a1f", 0.2, {emissive: "#ff6a00", emissiveIntensity: 1.8})}>
          <coneGeometry args={[0.25 + 0.04 * Math.sin(t * 30), 0.3, 10]} />
        </mesh>
      )}
      {lula > 0 && <Lula p={[lerp(4, 1.15, lula), 0, -0.4]} rotY={-0.6} s={1.0} t={t} mouth={f >= COBRA5 ? 0.4 : 0} reach={f >= COBRA5 ? 1 : 0} blink={blinkCurve(f)} />}
      {spray && <WaterJet a={[0.9, 0.55, 0.0]} b={[PAN_P[0], 0.4, PAN_P[2]]} k={1} t={t} size={1.2} />}
      <PBoy id="s5" a={a} f={f} pose={(fr) => {
        const w = clamp((fr - a) / 60);
        const sh = fr >= SO5;
        const back = fr >= APAGA5 && fr < APAGA5 + 30;
        return {...idle(fr), pos: [lerp(-2.6, -1.1, w), w < 1 ? bounce(fr - a, 20, 0.45) : hop(fr, APAGA5, 16, 0.3), 0.3], rotY: w < 1 ? 1.2 : 0.5, walk: tf(fr) * 6, walkAmt: w < 1 ? 0.6 : 0, ...(sh ? SHRUG : back ? {rShoulder: [-1.4, 0.5, 0], rElbow: -1.6, lShoulder: [-1.4, -0.5, 0], lElbow: -1.6} : {}), eyeWide: sh || back ? 0.9 : 0.3, brow: sh ? 1 : 0, mouthOpen: back ? 0.5 : sh ? 0.2 : 0, torso: [back ? -0.25 : 0, 0, 0], head: [0, fr >= LULA5 ? 0.4 : 0, sh ? 0.15 * Math.sin(tf(fr) * 9) : 0], squash: land(fr, a + 60) + land(fr, APAGA5 + 16)};
      }} />
      <Lata p={[-0.4, 0, 0.9]} rotY={0.2} s={0.9} t={t} scared={0.3} />
    </>
  );
};
/* 6 — o pinguim do patinete e o fiado de 3 minutos */
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - PINGUIM6) / FPS;
  const px = clamp(4.5 - s2 * 3.0, 0.9, 6);
  const earth = f >= TERRA6 - 4 && f < at(6, "entao") - 4;
  return (
    <>
      {earth ? (
        <Cam pos={[-0.5, 2.6, 3.0]} look={[-6, 9.0, -30]} fov={46} f={f} a={TERRA6 - 4} />
      ) : (
        <Cam pos={[0.4, 1.9, 6.8]} look={[0.4, 1.05, -0.3]} fov={58} f={f} a={a} />
      )}
      <Moon t={t} />
      <Panela p={PAN_P} s={1.0} />
      <Lula p={[1.2, 0, -1.0]} rotY={-0.5} s={1.0} t={t} blink={blinkCurve(f + 5)} />
      <group position={[px, 0, 0.8]}>
        <Scooter p={[0, 0, 0]} rotY={-Math.PI / 2} spin={-s2 * 10} />
        <Penguin p={[0.05, 0.22, 0]} rotY={-Math.PI / 2 + 0.6} t={t} s={0.9} />
        <SprinkleCart p={[0.95, 0, 0]} rotY={0} />
      </group>
      <PBoy id="s6" a={a} f={f} pose={(fr) => {
        const pen = clamp(4.5 - ((fr - PINGUIM6) / FPS) * 3.0, 0.9, 6);
        const earth = fr >= TERRA6 - 4 && fr < FIADO6;
        const ok = fr >= FIADO6;
        return {...idle(fr), pos: [-1.1, bounce(fr, 40, 0.12) + hop(fr, FIADO6 + 4, 16, 0.5), 0.3], rotY: 0.6, head: [earth ? -0.6 : 0, earth ? -0.3 : (pen - 2) * 0.12, 0], eyeWide: 0.6, smile: ok ? 1 : 0, ...(earth ? {lShoulder: [-2.5, 0, 0.8], lElbow: -0.1} : ok ? ARMS_UP : {rShoulder: [-0.6, 0, -0.3], rElbow: -1.8})};
      }} />
      <Lata p={[-0.4, 0, 0.9]} rotY={0.4} s={0.9} t={t} scared={0.3} />
    </>
  );
};
/* 7 — a lata fura o espaço */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const rip = clamp((f - FURA7 + 6) / 14);
  return (
    <>
      <Cam pos={[0.3, 1.6, 6.0]} look={[0.3, 3.0, -4]} fov={60} f={f} a={a} />
      <Moon t={t} />
      <SkyRip p={[0.3, 5.0, -6]} k={rip * 1.6} t={t} />
      <Lata p={[0.3, 5.0 + (1 - rip) * 4, -5.5 + rip * 0.5]} r={[t * 4, 0, t * 3]} s={1.3} t={t} scared={1} arms={1} />
      <PBoy id="s7" a={a} f={f} pose={(fr) => {
        const run = fr >= FURA7 + 8;
        return {...idle(fr), pos: [-0.6 - (run ? clamp((fr - FURA7 - 8) / 30) * 0.3 : 0), hop(fr, FURA7, 12, 0.35), 1.2], rotY: run ? -1.0 : 0.2, head: [-0.6, 0, 0], eyeWide: 1, mouthOpen: 0.5, brow: 1, ...(run ? RUN(tf(fr)) : {rShoulder: [-2.7, 0, -0.7], rElbow: -2.0, lShoulder: [-2.7, 0, 0.7], lElbow: -2.0})};
      }} />
    </>
  );
};
/* dimensão mole */
const JellyLights: React.FC<{pudim?: number}> = ({pudim = 0}) => (
  <>
    <Bg c={pudim > 0.5 ? "#ffcf7a" : "#c86bfa"} />
    <hemisphereLight args={["#ffffff", "#a070c0", 1.1]} />
    <directionalLight position={[-4, 8, 6]} intensity={2.0} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
  </>
);
const S7b: React.FC<ShotProps> = ({f, a, t}) => {
  const bite = f >= BRIG7 - 2 ? 1 : 0;
  const land = clamp((f - a) / 14);
  return (
    <>
      <Cam pos={[0.2, 1.8, 6.6]} look={[0.2, 0.95, -0.5]} fov={58} f={f} a={bite ? BRIG7 - 2 : a} />
      <JellyLights />
      <JellyWorld t={t} />
      <PBoy id="s7b" a={a} f={f} pose={(fr) => {
        const b = fr >= BRIG7 - 2;
        const k = (fr - a) % 22;
        return {...idle(fr), pos: [-0.55 - (b ? clamp((fr - BRIG7) / 30) * 0.25 : 0), hop(k, 0, 16, 0.4), 0.4], rotY: b ? -0.6 : 0.4, eyeWide: 1, mouthOpen: b ? 0.7 : 0.3, brow: 1, squash: k > 16 ? 0.12 * Math.sin(((k - 16) / 6) * Math.PI) : -0.05 * Math.sin((k / 16) * Math.PI), ...(b ? ARMS_UP : {rShoulder: [-1.2, 0.3, -0.6 + 0.4 * Math.sin(tf(fr) * 9)], rElbow: -0.4, lShoulder: [-1.2, -0.3, 0.6 - 0.4 * Math.sin(tf(fr) * 9)], lElbow: -0.4})};
      }} />
      <Lata p={[0.2, (1 - land) * 5 + Math.abs(Math.sin(t * 7)) * 0.3, 0.8]} rotY={-0.3} s={0.9} t={t} scared={1} arms={1} />
      {f >= GELATINA7 && <BrigMonster p={[0.95, 0, -0.4]} s={1.3} t={t} bite={bite} />}
    </>
  );
};
/* 8 — fligorar o bambolete */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const spin = f >= FLIGORAR8 ? 1 : 0;
  const pudim = f >= PLOFT8 + 2 ? 1 : 0;
  const world = f >= DIMENSAO8 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.0, 1.7, 6.0]} look={[0.0, 1.0, -0.3]} fov={56} f={f} a={pudim ? PLOFT8 + 2 : a} />
      <JellyLights pudim={world} />
      <JellyWorld t={t} pudim={world} />
      <Bambolete p={[0.7, pudim ? 0 : 0.9 + 0.1 * Math.sin(t * 4), -0.2]} s={1.0} t={t} spin={spin} pudim={pudim} />
      <PBoy id="s8" a={a} f={f} pose={(fr) => {
        const sp = fr >= FLIGORAR8 && fr < PLOFT8 + 2;
        const pd = fr >= PLOFT8 + 2;
        const tt = tf(fr);
        return {...idle(fr), pos: [-0.65 - (pd ? clamp((fr - PLOFT8) / 12) * 0.15 : 0), hop(fr, PLOFT8 + 2, 14, 0.45), 0.3], rotY: 0.6, ...(sp ? {rShoulder: [-1.5 + 0.5 * Math.sin(tt * 14), 0.4 * Math.cos(tt * 14), 0], rElbow: -0.5, lShoulder: [-1.5 + 0.5 * Math.cos(tt * 14), -0.4 * Math.sin(tt * 14), 0], lElbow: -0.5, torso: [0, 0.15 * Math.sin(tt * 14), 0]} : pd ? ARMS_UP : {}), eyeWide: pd ? 1 : 0.4, mouthOpen: pd ? 0.6 : 0.1, brow: pd ? 1 : 0, squash: land(fr, PLOFT8 + 16)};
      }} />
      {world > 0 && <Pudim p={[-2.4, 0, -2.5]} s={1.6} t={t} face={false} />}
      {world > 0 && <Pudim p={[2.8, 0, -3.5]} s={2.0} t={t + 1} face={false} />}
    </>
  );
};
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.0, 2.2, 6.0]} look={[0.2, 1.2, -1]} fov={60} f={f} a={a} />
    <JellyLights pudim={1} />
    <JellyWorld t={t} pudim={1} />
    <Pudim p={[0.7, 0, -0.2]} s={0.9} t={t} />
    <Pudim p={[-2.4, 0, -2.5]} s={1.6} t={t} face={false} />
    <Pudim p={[2.8, 0, -3.5]} s={2.0} t={t + 1} face={false} />
    <PBoy id="s9" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.8, bounce(fr - a, 16, 0.4), 0.3], rotY: 0.4 + 0.3 * Math.sin(tf(fr) * 4), ...ARMS_UP, smile: 1, mouthOpen: 0.4})} />
  </>
);
/* 10 — de volta na Lua: choque de tentáculo, a batedeira mexe, só sai granulado */
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const zap = f >= CHOQUE10 - 4 && f < CHOQUE10 + 26;
  const lit = f >= CHOQUE10 + 6;
  const stir = f >= MEXE10 - 4;
  const spit = f >= SAI10 - 4;
  return (
    <>
      {spit ? (
        <Cam pos={[0.3, 1.6, 3.2]} look={[0.0, 0.8, -0.2]} fov={52} f={f} a={SAI10 - 4} />
      ) : (
        <Cam pos={[0.1, 2.0, 7.0]} look={[0.05, 1.05, -0.3]} fov={58} f={f} a={stir ? MEXE10 - 4 : a} />
      )}
      <Moon t={t} />
      <Panela p={PAN_P} s={1.0} t={t} spit={spit ? 1 : 0} />
      {lit && !spit && (
        <mesh position={[PAN_P[0], 0.12, PAN_P[2] + 0.42]} material={sm("#ff9a1f", 0.2, {emissive: "#ff6a00", emissiveIntensity: 1.8})}>
          <coneGeometry args={[0.16 + 0.03 * Math.sin(t * 30), 0.22, 10]} />
        </mesh>
      )}
      <Lula p={[1.25, 0, -0.5]} rotY={-0.9} s={1.0} t={t} zap={zap} reach={zap ? 1 : 0} blink={blinkCurve(f)} />
      {zap && <Bolt a={[1.1, 0.5, -0.1]} b={[PAN_P[0] + 0.2, 0.3, PAN_P[2]]} k={1} t={t} />}
      <PrimoBatedeira p={stir ? [-0.25, 0, -0.95] : [-1.6, 0, -1.0]} rotY={stir ? 0.25 : 0.5} s={1.2} t={t} spin={stir ? 3 : 0.5} mouth={stir ? 0.3 : 0} tilt={stir ? 0.25 : 0} />
      {!spit && <PBoy id="s10" a={a} f={f} pose={(fr) => {
        const z = fr >= CHOQUE10 - 4 && fr < CHOQUE10 + 26;
        return {...idle(fr), pos: [-1.1 - (z ? 0.12 : 0), hop(fr, CHOQUE10 - 2, 12, 0.35), 0.8], rotY: 0.5, eyeWide: z ? 1 : 0.6, brow: z ? 1 : 0, mouthOpen: z ? 0.5 : 0, torso: [z ? -0.25 : fr >= MEXE10 ? 0.25 : 0, 0, 0], head: [fr >= MEXE10 ? 0.25 : 0, 0.3, 0], ...(z ? {rShoulder: [-1.5, 0.4, 0], rElbow: -1.8, lShoulder: [-1.5, -0.4, 0], lElbow: -1.8} : {})};
      }} />}
    </>
  );
};
/* 11 — "o chocolate tá vindo" e o chocolate no banho de pudim */
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.7, 3.6]} look={[0.0, 1.0, -0.6]} fov={52} f={f} a={a} />
    <Moon t={t} />
    <Panela p={PAN_P} s={1.0} t={t} spit={1} />
    <PrimoBatedeira p={[-0.25, 0, -0.95]} rotY={0.25} s={1.2} t={t} spin={3} mouth={0.4 + 0.3 * Math.abs(Math.sin(t * 8))} tilt={0.1} />
    <SprinklePile p={[0.6, 0, 0.5]} n={80} r={0.7} />
  </>
);
const S11b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.5, 4.4]} look={[0.1, 0.9, 0]} fov={52} f={f} a={a} />
    <JellyLights pudim={1} />
    <JellyWorld t={t} pudim={1} />
    <ChocoBath p={[0, 0, 0]} s={1.3} t={t} />
  </>
);
/* 12 — acabou o fiado: o pinguim cobra a lula, a lula cobra você */
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const step1 = f >= PINGUIM12 - 4;
  const step2 = f >= COBRA12B - 4;
  const pay = f >= UNICO12 - 6;
  return (
    <>
      <Cam pos={pay ? [0.6, 1.7, 5.2] : [0.5, 2.0, 6.6]} look={pay ? [0.45, 1.0, -0.1] : [0.55, 1.0, -0.2]} fov={pay ? 60 : 60} f={f} a={pay ? UNICO12 - 6 : a} />
      <Moon t={t} />
      <SprinklePile p={[0.3, 0, -1.6]} n={70} r={0.7} />
      <Panela p={[0.3, 0, -1.6]} s={0.9} />
      <Penguin p={[1.9, 0, 0.1]} rotY={-1.2} t={t} s={1.0} dance={step1 ? 0 : 0.3} />
      <Lula p={[1.0, 0, -0.3]} rotY={step2 ? -1.0 : 1.0} s={0.95} t={t} reach={step2 ? 1 : 0} mouth={step1 && !step2 ? 0.4 : 0} blink={blinkCurve(f)} />
      <PBoy id="s12" a={a} f={f} item={pay ? <group rotation={[Math.PI / 2, 0, 0]}><Cushion p={[0, -0.05, 0.08]} s={1.1} /></group> : null} pose={(fr) => {
        const s2b = fr >= COBRA12B - 4;
        const py = fr >= UNICO12 - 6;
        const step = clamp((fr - COBRA12B) / 24);
        return {...idle(fr), pos: [lerp(-0.9, -0.5, step), 0, lerp(0.6, 0.5, step)], rotY: 0.9, walk: tf(fr) * 9, walkAmt: step > 0 && step < 1 ? 1 : 0, ...(py ? {rShoulder: [-1.15, 0.5, 0.1], rElbow: -0.3} : s2b ? {rShoulder: [-0.3, 0, -0.5], rElbow: -1.4, lShoulder: [-0.3, 0, 0.5], lElbow: -1.4} : {}), eyeWide: s2b ? 0.8 : 0.3, smile: py ? 0.6 : 0, brow: s2b && !py ? 1 : 0, head: [s2b && !py ? 0.3 : 0, 0.2, 0]};
      }} />
    </>
  );
};
/* 13 — parabéns */
const S13: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 2.1, 7.4]} look={[0.3, 1.1, -0.4]} fov={60} f={f} a={a} />
    <Moon t={t} />
    <PBoy id="s13" a={a} f={f} item={<group rotation={[Math.PI / 2, 0, 0]}><Panela p={[0, -0.12, 0.05]} s={0.45} t={t} spit={1} /></group>} pose={(fr) => ({...idle(fr), pos: [0.0, bounce(fr - a, 15, 0.35), 0.6], rotY: 0.35 * Math.sin(tf(fr) * 5), rShoulder: [-2.4 + 0.3 * Math.sin(tf(fr) * 10), 0.3, 0], rElbow: -0.4, lShoulder: [-2.5, 0, 0.5 + 0.3 * Math.sin(tf(fr) * 10)], lElbow: -0.3, torso: [0, 0, 0.12 * Math.sin(tf(fr) * 5)], smile: 1, mouthOpen: 0.4})} />
    <TiaGeladeira p={[-1.7, 0, -1.2]} rotY={0.35} s={0.9} mouth={0.3} />
    <PrimoBatedeira p={[1.6, 0, -1.0]} rotY={-0.4} s={1.1} t={t} spin={1} />
    <Lula p={[2.1, 0, -0.7]} rotY={-0.6} s={0.9} t={t} />
    <Lata p={[-0.9, 0, 0.9]} rotY={0.2} s={1.0} t={t} arms={1} />
    <SprinklePile p={[0.6, 0, 1.2]} n={60} r={0.6} />
  </>
);
/* 14 — a tia geladeira tranca o sorvete */
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const lock = f >= TRANCAR14 - 4 ? easeOut(clamp((f - TRANCAR14 + 4) / 10)) : 0;
  return (
    <>
      <Cam pos={[0.2, 1.4, 3.6]} look={[0.0, 1.2, 0]} fov={52} f={f} a={a} />
      <Flat bg="#ffb04a" ground="#ff8f3a" />
      <TiaGeladeira p={[0, 0, -0.3]} s={1.0} lock={lock} wink={f >= SEMPRE14 ? 1 : 0} mouth={f < TRANCAR14 ? 0.3 * Math.abs(Math.sin(t * 8)) : 0} />
    </>
  );
};

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
  {from: CAI7 - 3, Comp: S7b},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: S9},
  {from: L(10), Comp: S10},
  {from: L(11), Comp: S11},
  {from: CHOCO11 - 3, Comp: S11b},
  {from: L(12), Comp: S12},
  {from: L(13), Comp: S13},
  {from: L(14), Comp: S14},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_BRIG} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["brigadeiro", "lua", "leite", "condensado", "lata", "toboga", "medo", "altura", "tia", "geladeira", "oito", "mil", "metros", "favor", "frances", "fila", "quinhentas", "cinquenta", "seguidores", "segue", "primo", "batedeira", "oculos", "escuros", "decola", "espacial", "fogao", "lula", "bombeira", "apaga", "granulado", "pinguim", "patinete", "moeda", "chocolate", "terra", "fiado", "tres", "minutos", "fura", "espaco", "dimensao", "mole", "gelatina", "come", "fligorar", "bambolete", "ploft", "pudim", "fligoramento", "gelatinoso", "choque", "tentaculo", "mexe", "jura", "banho", "acabam", "unico", "parabens", "sabio", "trancar", "sorvete", "sempre"]);
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
const TITLES: [number, string[]][] = [
  [L(4), ["TOBOGÃ", "ESPACIAL"]],
  [L(9), ["FLIGORAMENTO", "GELATINOSO"]],
];
const FOLLOW_FROM = L(14) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoBrig: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      {TITLES.map(([x, lines], i) => {
        const next = [L(5), L(10)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}
      <TopTitle from={4} to={MAS0 - 3} text="BRIGADEIRO NA LUA" />
      <Ono from={20} to={MAS0 - 4} text="?" x={760} y={560} size={160} color="#ffffff" rot={8} />
      <Bubble from={MAS0 + 4} to={L(1) - 2} text="SOCORRO!" x={720} y={760} size={58} />
      <Ono from={ALTURA0} to={L(1) - 2} text="!" x={330} y={560} size={160} color="#ff4d6d" rot={-8} />
      <TopTitle from={TIA1} to={OITO1 - 3} text="TIA GELADEIRA" />
      <BigNum from={OITO1} to={MAS1 - 4} text="8.000 METROS" size={120} />
      <Bubble from={PEDIR1} to={L(2) - 2} text="S'IL VOUS PLAÎT!" x={640} y={640} size={56} />
      <BigNum from={QUINHENTAS2} to={INCLUSIVE2 - 3} text="550 NA FILA" size={120} />
      <Plaque from={INCLUSIVE2} to={L(3) - 2} text={"RESERVADO\nPRA VOCÊ"} x={600} y={720} size={52} />
      <TopTitle from={PRIMO3} to={EMPURRA3 - 3} text="PRIMO BATEDEIRA" />
      <Ono from={EMPURRA3 + 4} to={L(4) - 2} text="VRRRUM!" size={140} color="#ff4d6d" />
      <TopTitle from={LULA5} to={APAGA5 - 3} text="LULA BOMBEIRA" />
      <Ono from={APAGA5 + 2} to={COBRA5 - 4} text="FSSSH!" size={140} color="#7fd0ff" />
      <Tag from={COBRA5} to={L(6) - 2} text="COBRA EM GRANULADO" />
      <TopTitle from={PINGUIM6} to={MOEDA6 - 3} text="PINGUIM DO PATINETE" size={80} />
      <Plaque from={MOEDA6} to={TERRA6 - 4} text={"SÓ MOEDA\nDE CHOCOLATE"} x={540} y={600} size={52} />
      <FiadoClock from={FIADO6} to={L(7) - 2} end={FIADO6 + 1000} />
      <TopTitle from={FURA7} to={CAI7 - 3} text="FUROU O ESPAÇO" />
      <Ono from={FURA7 + 4} to={CAI7 - 3} text="CRÁÁS!" y={700} size={150} color="#ff5fb0" />
      <TopTitle from={CAI7} to={BRIG7 - 3} text="DIMENSÃO MOLE" />
      <Ono from={BRIG7} to={L(8) - 2} text="NHAC!" size={160} color="#ffd21f" />
      <TopTitle from={FLIGORAR8} to={PLOFT8 - 3} text="BAMBOLETE" />
      <Ono from={PLOFT8} to={DIMENSAO8 - 4} text="PLÓFT!" size={160} color="#3ee0c0" />
      <Ono from={CHOQUE10} to={MEXE10 - 4} text="BZZT!" size={150} color="#fff59a" />
      <TopTitle from={SAI10 - 2} to={L(11) - 2} text="SÓ GRANULADO" />
      <Bubble from={L(11)} to={CHOCO11 - 3} text="O CHOCOLATE TÁ VINDO!" x={540} y={560} size={48} />
      <FiadoClock from={L(12)} to={PINGUIM12 - 2} end={ACABAM12} start={0.12} />
      <Tag from={UNICO12} to={L(13) - 2} text="ÚNICO GRANULADO" />
      <Confetti from={PARABENS13} to={PARABENS13 + 70} />
      <TopTitle from={SAIU13} to={L(14) - 2} text="SÓ SAIU GRANULADO" size={80} />
      <TopTitle from={L(14)} to={TRANCAR14 - 3} text="SEGUE O SÁBIO" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_BRIG - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozbrig.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx7/pof.mp3" from={MAS0} dur={20} v={FXV * 0.4} />
      <SND src="sfx12/gasp.mp3" from={MAS0 + 4} dur={30} v={FXV * 0.3} />
      <SND src="sfx7/waves.mp3" from={L(1)} dur={MAS1 - L(1)} v={FXV * 0.2} />
      <SND src="sfx3/door.mp3" from={FRANCES1 + 6} dur={30} v={FXV * 0.35} />
      <SND src="sfx3/crowd.mp3" from={L(2)} dur={L(3) - L(2)} v={FXV * 0.2} />
      <SND src="sfx3/factory.mp3" from={EMPURRA3} dur={DECOLA3 - EMPURRA3} v={FXV * 0.2} />
      <SND src="sfx11/rocket.mp3" from={DECOLA3 - 6} dur={60} v={FXV * 0.35} />
      <SND src="sfx14/spray.mp3" from={APAGA5} dur={30} v={FXV * 0.35} />
      <SND src="sfx10/scooter.mp3" from={PINGUIM6} dur={50} v={FXV * 0.35} />
      <SND src="sfx10/tick.mp3" from={FIADO6} dur={L(7) - FIADO6} v={FXV * 0.25} />
      <SND src="sfx3/crack.mp3" from={FURA7} dur={30} v={FXV * 0.4} />
      <SND src="sfx10/bubble.mp3" from={CAI7} dur={BRIG7 - CAI7} v={FXV * 0.3} />
      <SND src="sfx16/glup.mp3" from={BRIG7} dur={30} v={FXV * 0.4} />
      <SND src="sfx9/splat.mp3" from={PLOFT8} dur={30} v={FXV * 0.45} />
      <SND src="sfx14/zap.mp3" from={CHOQUE10} dur={30} v={FXV * 0.4} />
      <SND src="sfx3/factory.mp3" from={MEXE10} dur={L(11) - MEXE10} v={FXV * 0.15} />
      <SND src="sfx10/tick.mp3" from={L(12)} dur={ACABAM12 - L(12)} v={FXV * 0.25} />
      <SND src="sfx7/cash.mp3" from={UNICO12} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS13} dur={50} v={FXV * 0.4} />
      <SND src="sfx9/yay.mp3" from={PARABENS13} dur={50} v={FXV * 0.3} />
      <SND src="sfx11/lock.mp3" from={TRANCAR14} dur={30} v={FXV * 0.45} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
