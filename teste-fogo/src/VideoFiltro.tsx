import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, V3, House} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {Duck, IceCube} from "./Sets15";
import {Sparkles} from "./Sets19";
import {Bg} from "./Sets20";
import {TiaGeladeira} from "./Sets28";
import {Filtro, PeixeTerapeuta, Bolhas} from "./Sets37";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingFiltro.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_FILTRO = F(words[words.length - 1].e + 1.2);

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
const ACALMAR0 = at(0, "acalmar");
const DEPRESSAO1 = at(1, "depressao");
const SALGADA1 = at(1, "salgada");
const PEIXE3 = at(3, "peixe");
const CHORAR4 = at(4, "chorar");
const AQUARIO4 = at(4, "aquario");
const PATO6 = at(6, "pato");
const BOIA6 = at(6, "boia");
const SOCORRO6 = at(6, "socorro");
const PORTA8 = at(8, "porta");
const GELO8 = at(8, "gelo");
const CONGELA8 = at(8, "congela");
const RIR10 = at(10, "rir");
const GAS10 = at(10, "gas");
const BOLHAS12 = at(12, "bolhas");
const NUVENS12 = at(12, "nuvens");
const PARABENS13 = at(13, "parabens");
const SEGUIR14 = at(14, "seguir");
const GARRAFINHA14 = at(14, "garrafinha");

/* ---------- física e utilidades ---------- */
const tf = (fr: number) => fr / FPS;
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode; look?: ToyLook}> = ({id, a, f, pose, item, look = BOY}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={look} item={item} /> : <Toy pose={p} look={look} />;
};
const COUNTER: V3 = [0.6, 0, -1.2];
const FILTRO: V3 = [0.6, 0.9, -1.15];
const FRIDGE_P: V3 = [-1.6, 0, -1.1];
const Kitchen: React.FC = () => (
  <>
    <Bg c="#f3e3c8" />
    <KitchenLights />
    <mesh position={[0, 2, -1.8]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color="#bfe3d0" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#d9c2a0" />
    </mesh>
    <mesh position={[COUNTER[0], 0.45, COUNTER[2]]} geometry={rbox(1.6, 0.9, 0.8, 0.04)} material={sm("#f2f2ee", 0.5)} castShadow receiveShadow />
  </>
);
/* água subindo (aquário) ou gelo */
const Water: React.FC<{h: number; t: number; ice?: number}> = ({h, t, ice = 0}) =>
  h > 0.01 ? (
    <mesh position={[0, h / 2 + Math.sin(t * 2) * 0.01 * (1 - ice), -0.5]}>
      <boxGeometry args={[12, h, 8]} />
      <meshStandardMaterial color={ice > 0.5 ? "#e6f6ff" : "#3a9ad9"} transparent opacity={ice > 0.5 ? 0.95 : 0.45} roughness={ice > 0.5 ? 0.15 : 0.05} />
    </mesh>
  ) : null;
const LifeDuck: React.FC<{p: V3; t: number; flip?: number; s?: number}> = ({p, t, flip = 0, s = 1}) => (
  <group position={p} rotation={[flip * Math.PI * 0.9, t * 0.5, Math.sin(t * 3) * 0.15]} scale={s}>
    <Duck p={[0, 0, 0]} s={1} t={t} />
    <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e8262d", 0.5)}>
      <torusGeometry args={[0.42, 0.08, 8, 20]} />
    </mesh>
  </group>
);

/* nuvem fofinha de bolas */
const Nuvem: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    {[[0, 0, 0, 1], [0.9, -0.1, 0.1, 0.8], [-0.9, -0.1, 0.1, 0.8], [0.45, 0.45, -0.1, 0.75], [-0.45, 0.4, -0.1, 0.7], [1.6, -0.25, 0, 0.55], [-1.6, -0.25, 0, 0.55]].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]}>
        <sphereGeometry args={[r, 16, 12]} />
        <meshStandardMaterial color="#ffffff" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

/* 0–2 — o filtro deprimido chora */
const F0: React.FC<ShotProps> = ({f, a, t}) => {
  const cry = f >= DEPRESSAO1 - 4 ? 1 : 0.3;
  const puddle = f >= SALGADA1 ? clamp((f - SALGADA1) / 60) : 0;
  return (
    <>
      <Cam pos={[0.1, 1.6, 3.8]} look={[0.2, 1.1, -0.8]} fov={54} f={f} a={f >= L(1) ? L(1) : a} />
      <Kitchen />
      <Filtro p={FILTRO} s={1.0} t={t} cry={cry} blink={blinkCurve(f)} />
      {puddle > 0 && (
        <mesh position={[0.6, 0.012, -0.5]} rotation={[-Math.PI / 2, 0, 0]} scale={0.3 + puddle * 1.2}>
          <circleGeometry args={[1, 24]} />
          <meshStandardMaterial color="#7fc8ef" transparent opacity={0.7} roughness={0.05} />
        </mesh>
      )}
      <PBoy id="f0" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, hop(fr, ACALMAR0, 12, 0.15), 0.2], rotY: 0.6, ...(fr >= ACALMAR0 && fr < DEPRESSAO1 ? {lShoulder: [-1.3, -0.3, 0.2], lElbow: -0.4 - 0.3 * Math.sin(tf(fr) * 10)} : fr >= SALGADA1 ? {rShoulder: [-0.4, 0, -0.9], rElbow: -2.1, lShoulder: [-0.4, 0, 0.9], lElbow: -2.1} : {}), eyeWide: fr >= DEPRESSAO1 ? 0.9 : 0.4, mouthOpen: fr >= SALGADA1 ? 0.5 : 0, brow: fr >= DEPRESSAO1 ? 1 : 0})} />
    </>
  );
};
/* 3–5 — o peixe terapeuta chora junto e a cozinha vira aquário */
const F3: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - PEIXE3 + 4) / 26);
  const fishCry = f >= CHORAR4 ? 1 : 0;
  const water = f >= AQUARIO4 - 10 ? easeInOut(clamp((f - AQUARIO4 + 10) / 60)) * 1.8 : 0;
  return (
    <>
      <Cam pos={[0.1, 2.0, 5.2]} look={[0.1, 1.3, -0.6]} fov={56} f={f} a={water > 0 ? AQUARIO4 - 10 : a} />
      <Kitchen />
      <Filtro p={FILTRO} s={1.0} t={t} cry={1} />
      <PeixeTerapeuta p={[lerp(3, 1.0, easeOut(k)), 1.35 + Math.sin(t * 2) * 0.08 + Math.max(0, water - 1.2) * 0.4, -0.4]} rotY={Math.PI} s={0.95} t={t} cry={fishCry} />
      <Water h={water} t={t} />
      <PBoy id="f3" a={a} f={f} pose={(fr) => {
        const w = fr >= AQUARIO4 - 10 ? easeInOut(clamp((fr - AQUARIO4 + 10) / 60)) * 1.8 : 0;
        const float = Math.max(0, w - 0.9);
        return {...idle(fr), pos: [-0.6, float + Math.sin(tf(fr) * 3) * 0.06 * (float > 0 ? 1 : 0), 0.3], rotY: 0.5, eyeWide: fr >= AQUARIO4 ? 1 : 0.5, mouthOpen: fr >= AQUARIO4 ? 0.6 : 0, ...(float > 0 ? {rShoulder: [-2.4 + 0.5 * Math.sin(tf(fr) * 8), 0, -0.3], lShoulder: [-2.4 + 0.5 * Math.sin(tf(fr) * 8 + 2), 0, 0.3], walk: tf(fr) * 6, walkAmt: 0.6} : {})};
      }} />
    </>
  );
};
/* 6–7 — o pato salva-vidas que não sabe nadar */
const F6: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - PATO6 + 4) / 20);
  const flip = f >= BOIA6 ? clamp((f - BOIA6) / 12) : 0;
  return (
    <>
      <Cam pos={[0.0, 2.1, 5.4]} look={[-0.1, 1.4, -0.6]} fov={56} f={f} a={a} />
      <Kitchen />
      <TiaGeladeira p={FRIDGE_P} rotY={0.4} s={1.0} blink={blinkCurve(f)} mouth={f >= SOCORRO6 ? 0.3 : 0} />
      <Filtro p={FILTRO} s={1.0} t={t} cry={1} />
      <Water h={1.8} t={t} />
      <LifeDuck p={[lerp(2.4, 0.5, easeOut(k)), 1.85 + Math.sin(t * 3) * 0.06, 0.4]} t={t} flip={flip} s={0.8} />
      <PeixeTerapeuta p={[1.3, 1.5 + Math.sin(t * 2) * 0.08, -0.6]} rotY={Math.PI} s={0.9} t={t} cry={1} />
      <PBoy id="f6" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, 0.9 + Math.sin(tf(fr) * 3) * 0.06, 0.3], rotY: 0.5, rShoulder: [-2.4 + 0.5 * Math.sin(tf(fr) * 8), 0, -0.3], lShoulder: [-2.4 + 0.5 * Math.sin(tf(fr) * 8 + 2), 0, 0.3], walk: tf(fr) * 6, walkAmt: 0.6, eyeWide: 0.8, mouthOpen: 0.4})} />
    </>
  );
};
/* 8–9 — o gelo cai, a cozinha congela e todo mundo patina */
const F8: React.FC<ShotProps> = ({f, a, t}) => {
  const open = f >= PORTA8 - 4 ? easeOut(clamp((f - PORTA8 + 4) / 12)) : 0;
  const ice = f >= CONGELA8 ? 1 : 0;
  const lvl = ice ? 0.35 : 1.8;
  const sk = tf(f - CONGELA8);
  return (
    <>
      <Cam pos={ice ? [0.2, 2.4, 5.4] : [-0.6, 1.9, 4.2]} look={ice ? [0, 0.9, -0.4] : [-1.0, 1.4, -0.8]} fov={56} f={f} a={ice ? CONGELA8 : a} />
      <Kitchen />
      <TiaGeladeira p={FRIDGE_P} rotY={0.4} s={1.0} open={open} blink={blinkCurve(f)} mouth={0.3} />
      <Filtro p={FILTRO} s={1.0} t={t} cry={ice ? 0.4 : 1} />
      {!ice && f >= GELO8 - 6 &&
        Array.from({length: 8}, (_, i) => {
          const q = clamp((f - GELO8 + 6 - i * 2) / 16);
          return q > 0 ? <IceCube key={i} p={[FRIDGE_P[0] + 0.3 + (i % 3) * 0.25, 1.4 - q * 0.4 + (i % 2) * 0.2, FRIDGE_P[2] + 0.6 + q * (0.4 + i * 0.12)]} t={t} s={0.6} /> : null;
        })}
      <Water h={lvl} t={t} ice={ice} />
      {ice ? (
        <>
          {/* patinação: escorregões e tombos */}
          <group position={[Math.sin(sk * 1.6) * 1.2, lvl, 0.4]} rotation={[0, 0, Math.sin(sk * 3.2) * 0.35]}>
            <PBoy id="f8" a={CONGELA8} f={f} pose={(fr) => ({...idle(fr), pos: [0, 0, 0], rotY: Math.cos(tf(fr - CONGELA8) * 1.6) > 0 ? 1.2 : -1.2, rShoulder: [-1.6, 0, -1.2 + 0.4 * Math.sin(tf(fr) * 9)], lShoulder: [-1.6, 0, 1.2 - 0.4 * Math.sin(tf(fr) * 9)], rElbow: -0.2, lElbow: -0.2, eyeWide: 1, mouthOpen: 0.6, brow: 1})} />
          </group>
          <group position={[1.4 - Math.sin(sk * 1.2) * 1.0, lvl + 0.18, -0.3]} rotation={[0, sk * 4, 0]}>
            <PeixeTerapeuta p={[0, 0, 0]} s={1.1} t={t} />
          </group>
          <LifeDuck p={[-1.2 + Math.sin(sk * 2.1) * 0.6, lvl + 0.15, 0.9]} t={t * 3} s={0.75} />
          <Sparkles p={[0, lvl + 0.5, 0.3]} t={t} spread={2} n={8} />
        </>
      ) : (
        <PBoy id="f8w" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.2, 0.9 + Math.sin(tf(fr) * 3) * 0.06, 0.4], rotY: -0.3, eyeWide: 1, mouthOpen: 0.5, rShoulder: [-2.4, 0, -0.3], lShoulder: [-2.4, 0, 0.3], walk: tf(fr) * 6, walkAmt: 0.6})} />
      )}
    </>
  );
};
/* 10–11 — o filtro ri e solta água com gás */
const F10: React.FC<ShotProps> = ({f, a, t}) => {
  const laugh = f >= RIR10 ? 1 : 0;
  const gas = f >= GAS10 ? clamp((f - GAS10) / 20) : 0;
  return (
    <>
      <Cam pos={[0.4, 1.5, 3.0]} look={[0.5, 1.2, -1.0]} fov={52} f={f} a={f >= RIR10 ? RIR10 : a} />
      <Kitchen />
      <Water h={0.35} t={t} ice={1} />
      <Filtro p={[FILTRO[0], FILTRO[1] + hop(f, RIR10, 14, 0.1), FILTRO[2]]} s={1.0} t={t} laugh={laugh} cry={laugh ? 0 : 0.5} />
      {gas > 0 && <Bolhas p={[FILTRO[0], FILTRO[1] + 0.2, FILTRO[2] + 0.35]} t={t} n={20} spread={0.6 + gas} h={2.5} s={1.4} />}
      <PBoy id="f10" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.5, 0.35 + hop(fr, GAS10, 14, 0.25), 0.2], rotY: 0.6, smile: 1, mouthOpen: 0.4, ...(fr >= GAS10 ? ARMS_UP : {})})} />
    </>
  );
};
/* 12 — as bolhas levantam a casa até as nuvens */
const F12: React.FC<ShotProps> = ({f, a, t}) => {
  const up = f >= BOLHAS12 ? easeInOut(clamp((f - BOLHAS12) / 70)) : 0;
  return (
    <>
      <Cam pos={[0.5, 3.0 + up * 5, 13]} look={[0, 2.4 + up * 6, -0.6]} fov={58} f={f} a={a} />
      <DayOut />
      <group position={[0, 0, -5]}>
        <Town t={t} galo={false} variant="nova" flat clouds />
      </group>
      <group position={[0, up * 7, 0]} rotation={[0, 0, Math.sin(t * 2) * 0.05 * up]}>
        <House p={[0, 0, -0.6]} w={3.4} h={2.7} d={3} wall="#f6d9a8" roof="#e8412c" />
        <Bolhas p={[0, -0.6, -0.4]} t={t} n={30} spread={2.2} h={2.5} s={3.5} />
      </group>
      {up > 0.5 && <><Nuvem p={[-2.5, 11, -3]} s={1.4} /><Nuvem p={[2.8, 12.5, -4]} s={1.2} /></>}
    </>
  );
};
/* 13–14 — bebendo água da nuvem; e a ameaça */
const F13: React.FC<ShotProps> = ({f, a, t}) => {
  const threat = f >= SEGUIR14 - 4;
  return (
    <>
      <Cam pos={threat ? [0.3, 1.4, 3.0] : [0, 1.6, 5.0]} look={threat ? [0.4, 1.0, -0.6] : [0, 1.1, 0]} fov={54} f={f} a={threat ? SEGUIR14 - 4 : a} />
      <Bg c="#8fd3ff" />
      <hemisphereLight args={["#ffffff", "#bcd8ea", 1.2]} />
      <directionalLight position={[3, 8, 5]} intensity={2} />
      {threat ? (
        <>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[20, 20]} />
            <meshStandardMaterial color="#f2f6fa" />
          </mesh>
          <Filtro p={[0.2, 0.0, -0.8]} s={1.2} t={t} cry={1} />
          {/* garrafinha recebendo as lágrimas */}
          <group position={[0.55, 0, -0.1]}>
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.5, 16]} />
              <meshStandardMaterial color="#bfe6ff" transparent opacity={0.5} />
            </mesh>
            <mesh position={[0, 0.06 + clamp((f - GARRAFINHA14) / 60) * 0.18, 0]}>
              <cylinderGeometry args={[0.095, 0.095, 0.12 + clamp((f - GARRAFINHA14) / 60) * 0.36, 16]} />
              <meshStandardMaterial color="#3a9ad9" transparent opacity={0.8} />
            </mesh>
            <mesh position={[0, 0.55, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.08, 10]} />
              <meshStandardMaterial color="#3a86ff" />
            </mesh>
          </group>
        </>
      ) : (
        <>
          <Nuvem p={[-0.2, -0.3, 0]} s={1.2} />
          <PeixeTerapeuta p={[1.2, 1.4 + Math.sin(t * 2) * 0.1, 0]} rotY={Math.PI} s={1.0} t={t} />
          <mesh position={[-0.2, 1.3, 0.25]} rotation={[0.9, 0, -0.4]}>
            <cylinderGeometry args={[0.02, 0.02, 0.9, 8]} />
            <meshStandardMaterial color="#ff4d6d" />
          </mesh>
          <PBoy id="f13" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.5, 0.55 + Math.abs(Math.sin(tf(fr) * 5)) * (fr >= PARABENS13 ? 0.15 : 0), 0.4], rotY: 0.3, sit: 1, smile: 1, mouthOpen: 0.2, rShoulder: [-1.2, 0.4, 0], rElbow: -1.5} as Pose)} />
        </>
      )}
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: F0},
  {from: L(3), Comp: F3},
  {from: L(6), Comp: F6},
  {from: L(8), Comp: F8},
  {from: L(10), Comp: F10},
  {from: L(12), Comp: F12},
  {from: L(13), Comp: F13},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_FILTRO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["agua", "acalmar", "filtro", "depressao", "agradece", "salgada", "choradeira", "hidraulica", "peixe", "terapeuta", "chorar", "aquario", "alagamento", "emocional", "pato", "salva-vidas", "nadar", "boia", "socorro", "geladeira", "resgate", "palmipede", "gelo", "congela", "patinacao", "domestica", "rir", "gas", "refrigerante", "terapeutico", "bolhas", "casa", "nuvens", "parabens", "nuvem", "seguir", "garrafinha"]);
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
  [L(2), L(3), ["CHORADEIRA", "HIDRÁULICA"]],
  [L(5), L(6), ["ALAGAMENTO", "EMOCIONAL"]],
  [L(7), L(8), ["RESGATE", "PALMÍPEDE"]],
  [L(9), L(10), ["PATINAÇÃO", "DOMÉSTICA"]],
  [L(11), L(12), ["REFRIGERANTE", "TERAPÊUTICO"]],
];
const FOLLOW_FROM = SEGUIR14 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoFiltro: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      {TITLES.map(([x, nx, lines], i) => (
        <StageTitle key={i} from={x + 2} to={nx - 3} lines={lines} />
      ))}
      <TopTitle from={4} to={ACALMAR0 - 3} text="BEBER ÁGUA" />
      <Ono from={AQUARIO4} to={L(5) - 2} text="GLUB GLUB!" size={130} color="#7fd0ff" />
      <Ono from={SOCORRO6} to={L(7) - 2} text="QUÉ QUÉ!" size={130} color="#ffd21f" />
      <Ono from={CONGELA8} to={L(9) - 2} text="CREC!" size={150} color="#ffffff" />
      <Ono from={RIR10 + 4} to={GAS10 - 2} text="HAHAHA!" size={140} color="#ffd21f" />
      <Ono from={NUVENS12} to={L(13) - 2} text="FIUUU!" size={140} color="#ffffff" />
      <Confetti from={PARABENS13} to={PARABENS13 + 60} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_FILTRO - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio: só efeitos que combinam com a cena ---------- */}
      <Audio src={staticFile("vozfiltro.mp3")} />
      <SND src="sfx17/cry.mp3" from={DEPRESSAO1} dur={75} v={FXV * 0.35} />
      <SND src="sfx9/sniffle.mp3" from={SALGADA1 + 10} dur={40} v={FXV * 0.4} />
      <SND src="sfx17/cry.mp3" from={CHORAR4} dur={75} v={FXV * 0.4} />
      <SND src="sfx17/splash.mp3" from={AQUARIO4 - 6} dur={60} v={FXV * 0.5} />
      <SND src="sfx11/water.mp3" from={AQUARIO4 + 40} dur={L(6) - AQUARIO4 - 40} v={FXV * 0.2} />
      <SND src="sfx17/quack.mp3" from={PATO6 + 4} dur={45} v={FXV * 0.6} />
      <SND src="sfx17/quack.mp3" from={SOCORRO6} dur={45} v={FXV * 0.6} />
      <SND src="sfx3/door.mp3" from={PORTA8 - 4} dur={30} v={FXV * 0.35} />
      <SND src="sfx17/splash.mp3" from={GELO8} dur={50} v={FXV * 0.4} />
      <SND src="sfx3/crack.mp3" from={CONGELA8} dur={30} v={FXV * 0.5} />
      <SND src="sfx12/slip.mp3" from={CONGELA8 + 30} dur={30} v={FXV * 0.4} />
      <SND src="sfx12/slip.mp3" from={CONGELA8 + 75} dur={30} v={FXV * 0.4} />
      <SND src="sfx10/giggle.mp3" from={RIR10} dur={50} v={FXV * 0.5} />
      <SND src="sfx10/bubble.mp3" from={GAS10} dur={L(13) - GAS10} v={FXV * 0.35} />
      <SND src="sfx7/whoosh.mp3" from={NUVENS12 - 6} dur={40} v={FXV * 0.4} />
      <SND src="sfx7/confetti.mp3" from={PARABENS13} dur={50} v={FXV * 0.4} />
      <SND src="sfx17/cry.mp3" from={GARRAFINHA14 - 10} dur={75} v={FXV * 0.3} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
