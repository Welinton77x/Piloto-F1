import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, Town, Tree, House, V3} from "./Sets5";
import {sm, rbox, Dog} from "./Sets9";
import {Bg} from "./Sets20";
import {Meia, Maquina, Caranguejo, Sabio, Lavanderia, Espuma, ChuvaMeias, SOCKC} from "./Sets30";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingRoupa.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_ROUPA = F(words[words.length - 1].e + 0.9);

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
const DESCULPA0 = at(0, "desculpa");
const MAL1 = at(1, "mal");
const SENHA1 = at(1, "senha");
const AGORA1 = at(1, "agora");
const CARANGUEJO2 = at(2, "caranguejo");
const APERTA4 = at(4, "aperta");
const PORTAL4 = at(4, "portal");
const SAI4 = at(4, "sai");
const JURA4 = at(4, "jura");
const CAPA5 = at(5, "capa");
const QUATRO5 = at(5, "quatrocentas");
const NENHUMA5 = at(5, "nenhuma");
const ESSA6 = at(6, "essa");
const BATE7 = at(7, "bate");
const TEM7 = at(7, "tem");
const NINGUEM7 = at(7, "ninguem");
const ESCONDE8 = at(8, "esconde");
const CENTRIFUGA8 = at(8, "centrifuga");
const CASA8 = at(8, "casa");
const NUVEM10 = at(10, "nuvem");
const CHOVE10 = at(10, "chove");
const CACHORRO10 = at(10, "cachorro");
const PAZES11 = at(11, "pazes");
const SABIO11 = at(11, "sabio");
const CARANGUEJO11 = at(11, "caranguejo");
const APERTA12 = at(12, "aperta");
const LIMPINHA12 = at(12, "limpinha");
const JOGA12 = at(12, "joga");
const PARABENS13 = at(13, "parabens");
const SEGUIR13 = at(13, "seguir");
const MEIA13 = at(13, "meia");

const TIA: ToyLook = {shirt: "#e8414f", pants: "#5a4a6a", hairStyle: "bun", hair: "#6a3a20", lips: "#c0392b", belly: 0.6, skin: "#e0b08a", lashes: true};
const MAQ: V3 = [0.6, 0, -1.4];
const RALO: V3 = [1.2, 0, 0.6];

/* ---------- física do menino ---------- */
const tf = (fr: number) => fr / FPS;
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
const land = (fr: number, at0: number, d = 8) => {
  const k = (fr - at0) / d;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.1 : 0;
};
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode; look?: ToyLook}> = ({id, a, f, pose, item, look = BOY}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={look} item={item} /> : <Toy pose={p} look={look} />;
};
const Room: React.FC = () => (
  <>
    <Bg c="#bfe6d8" />
    <hemisphereLight args={["#ffffff", "#8a9aa0", 1.0]} />
    <pointLight position={[0.3, 3.2, 1.5]} intensity={10} distance={12} decay={1.4} color="#fff4e0" castShadow />
    <Lavanderia />
  </>
);
const MEIA_ITEM = <Meia p={[0, -0.02, 0.06]} r={[Math.PI / 2, 0, 0]} s={1.4} c="#ff4d6d" />;

/* 0–1 — pedir desculpa pra máquina ofendida */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const sock = f >= AGORA1;
  return (
    <>
      <Cam pos={[0.2, 1.5, 4.6]} look={[0.2, 0.9, -0.6]} fov={54} f={f} a={f >= L(1) ? L(1) : a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood={f >= MAL1 ? "mad" : "sad"} mouth={f >= SENHA1 && f < AGORA1 ? 0.4 : 0} shake={f >= MAL1 && f < AGORA1 ? 1 : 0} />
      {sock && <Meia p={[0.6, 0.05 + Math.max(0, 0.6 - (f - AGORA1) * 0.03), -0.6]} r={[0, 0.5, Math.PI / 2]} s={1.6} c="#3a86ff" />}
      <PBoy id="r0" a={a} f={f} pose={(fr) => {
        const w = clamp(fr / 40);
        const sorry = fr >= DESCULPA0 - 6 && fr < L(1) + 10;
        const tt = tf(fr);
        return {...idle(fr), pos: [lerp(-1.8, -0.6, easeOut(w)), hop(fr, MAL1, 12, 0.2), 0.3], rotY: w < 1 ? 1.2 : 0.55, walk: tt * 9, walkAmt: w < 1 ? 1 : 0, ...(sorry ? {rShoulder: [-1.4, 0.6, 0], rElbow: -1.6, lShoulder: [-1.4, -0.6, 0], lElbow: -1.6, torso: [0.35, 0, 0], head: [0.2, 0, 0]} : fr >= AGORA1 ? {rShoulder: [-0.4, 0.2, -0.9], rElbow: -1.2, lShoulder: [-0.4, -0.2, 0.9], lElbow: -1.2} : {}), eyeWide: fr >= MAL1 ? 0.9 : 0.3, brow: fr >= MAL1 ? 1 : 0, smile: sorry ? 0.3 : 0};
      }} />
    </>
  );
};
/* 2–3 — o caranguejo encanador */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - CARANGUEJO2 + 6) / 24);
  return (
    <>
      <Cam pos={[0.2, 1.5, 5.2]} look={[0.3, 0.7, -0.4]} fov={56} f={f} a={a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood="mad" />
      <Caranguejo p={[lerp(3.0, 1.2, k), 0, lerp(0.8, 0.0, k)]} rotY={k < 1 ? -1.4 : -0.3} s={1.4} t={t} work={f >= L(3) ? 1 : 0} />
      <PBoy id="r2" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, 0, 0.4], rotY: 0.7, ...(fr >= CARANGUEJO2 && fr < CARANGUEJO2 + 40 ? {lShoulder: [-1.5, -0.3, 0.2], lElbow: -0.1} : {}), smile: 1, head: [0.15, 0.3, 0]})} />
    </>
  );
};
/* 4 — o ralo vira portal e sai o sábio */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const portal = f >= PORTAL4 - 4 ? clamp((f - PORTAL4 + 4) / 14) : 0;
  const rise = f >= SAI4 - 4 ? easeOut(clamp((f - SAI4 + 4) / 24)) : 0;
  return (
    <>
      <Cam pos={[0.4, 1.8, 5.4]} look={[0.6, 1.0, 0]} fov={58} f={f} a={rise > 0 ? SAI4 - 4 : a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood="mad" />
      <Caranguejo p={[2.0, 0, 0.3]} rotY={-0.6} s={1.4} t={t} work={f < PORTAL4 ? 1 : 0} />
      {portal > 0 && (
        <group position={[RALO[0], 0.01, RALO[2]]} rotation={[-Math.PI / 2, 0, t * 2]} scale={portal}>
          <mesh>
            <circleGeometry args={[0.9, 7]} />
            <meshBasicMaterial color="#c86bfa" toneMapped={false} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <circleGeometry args={[0.6, 6]} />
            <meshBasicMaterial color="#3ee0c0" toneMapped={false} />
          </mesh>
        </group>
      )}
      {rise > 0 && <Sabio p={[RALO[0], -1.8 + rise * 1.8, RALO[2]]} rotY={-0.4} s={1.0} t={t} mouth={f >= JURA4 ? 0.3 + 0.3 * Math.abs(Math.sin(t * 9)) : 0} arms={f >= JURA4 ? 1 : 0} />}
      <PBoy id="r4" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.8, hop(fr, PORTAL4, 14, 0.3), 0.4], rotY: 0.7, eyeWide: fr >= PORTAL4 ? 1 : 0.3, mouthOpen: fr >= PORTAL4 ? 0.5 : 0, brow: fr >= PORTAL4 ? 1 : 0, ...(fr >= SAI4 ? {rShoulder: [-1.2, 0.5, 0], rElbow: -1.8, lShoulder: [-1.2, -0.5, 0], lElbow: -1.8} : {})})} />
    </>
  );
};
/* 5–6 — a capa de 400 meias e a dobradura do caranguejo */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const fold = f >= L(6);
  return (
    <>
      <Cam pos={fold ? [0.6, 1.5, 4.4] : [0.6, 1.9, 5.7]} look={fold ? [1.0, 0.8, 0.3] : [0.6, 1.1, 0.3]} fov={56} f={f} a={fold ? L(6) : a} />
      <Room />
      <Sabio p={[1.2, 0, 0.4]} rotY={-0.3} s={1.0} t={t} mouth={f < CAPA5 + 30 ? 0.3 + 0.3 * Math.abs(Math.sin(t * 9)) : 0} />
      <Caranguejo p={[1.45, 0, 1.1]} rotY={-1.0} s={1.25} t={t} fold={fold ? 1 : 0} work={fold ? 1 : 0} />
      <PBoy id="r5" a={a} f={f} item={MEIA_ITEM} pose={(fr) => ({...idle(fr), pos: [-0.3, 0, 0.8], rotY: 0.8, rShoulder: [-1.1, 0.3, 0.05], rElbow: -1.0, head: [0, 0.2, fr >= NENHUMA5 ? 0.15 * Math.sin(tf(fr) * 8) : 0], eyeWide: fr >= QUATRO5 ? 0.9 : 0.3, brow: fr >= NENHUMA5 ? 1 : 0})} />
    </>
  );
};
/* 7 — a tia Cleuza bate na porta */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const knock = f >= BATE7 && f < TEM7 + 30;
  return (
    <>
      <Cam pos={[0.7, 1.7, 3.6]} look={[-0.9, 1.15, -1.5]} fov={58} f={f} a={a} />
      <Room />
      <mesh position={[-2.2, 1.05 + (knock ? 0.01 * Math.sin(t * 60) : 0), -2.47]} rotation={[0, knock ? 0.02 * Math.sin(t * 50) : 0, 0]} geometry={rbox(0.9, 2.1, 0.06, 0.03)} material={sm("#a0704a", 0.6)} />
      <Sabio p={[0.4, 0, -0.6]} rotY={0.6} s={1.0} t={t} shy={f >= NINGUEM7 ? 1 : 0} />
      <Caranguejo p={[-0.4, 0, -0.2]} rotY={0.6} s={1.3} t={t} />
      <PBoy id="r7" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-1.1, 0, -0.3], rotY: -0.7, head: [0, -0.3, 0], ...(fr >= NINGUEM7 ? {rShoulder: [-1.7, 0.5, 0], rElbow: -2.4, smile: 0} : {}), eyeWide: 0.8})} />
    </>
  );
};
/* 8 — o sábio se esconde na máquina e a casa gira */
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const hide = f >= ESCONDE8 ? easeInOut(clamp((f - ESCONDE8) / 18)) : 0;
  const out = f >= CASA8 - 4;
  return out ? (
    <>
      <Cam pos={[0, 6, 14]} look={[0, 2, 0]} fov={52} f={f} a={CASA8 - 4} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
        <planeGeometry args={[80, 80]} />
      </mesh>
      <group rotation={[0, (f - CASA8) * 0.25, 0]}>
        <House p={[0, 0, 0]} w={4} h={3} d={3.5} wall="#ffd166" roof="#e8414f" />
      </group>
      <Tree p={[-6, 0, -3]} s={1.4} />
      <Tree p={[6, 0, -2]} s={1.2} />
    </>
  ) : (
    <>
      <Cam pos={[0.0, 1.6, 4.8]} look={[0.2, 0.9, -0.8]} fov={56} f={f} a={a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood="sad" spin={f >= CENTRIFUGA8 ? 1 : 0} shake={f >= CENTRIFUGA8 ? 1.5 : 0} />
      {hide < 1 && <Sabio p={[lerp(1.6, MAQ[0], hide), 0, lerp(0.2, MAQ[2] + 0.3, hide)]} rotY={-0.5} s={1.0 - hide * 0.7} t={t} shy={1} />}
      <PBoy id="r8" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.45, hop(fr, CENTRIFUGA8, 12, 0.2), 0.5], rotY: 0.6, eyeWide: fr >= CENTRIFUGA8 ? 1 : 0.4, mouthOpen: fr >= CENTRIFUGA8 ? 0.4 : 0})} />
    </>
  );
};
/* 9 — centrifugação doméstica: o menino girando */
const S9: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.0, 1.6, 4.4]} look={[0.0, 1.0, -0.5]} fov={56} f={f} a={a} />
    <Room />
    <group rotation={[0, 0, 0.08 * Math.sin(t * 8)]}>
      <Maquina p={MAQ} s={1.1} t={t} mood="sad" spin={1} shake={2} />
    </group>
    <PBoy id="r9" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.5 + 0.4 * Math.sin(tf(fr) * 6), 0.1, 0.4], rotY: tf(fr) * 8, rShoulder: [-0.2, 0, -1.4], rElbow: -0.1, lShoulder: [-0.2, 0, 1.4], lElbow: -0.1, eyeWide: 1, mouthOpen: 0.6, hairLift: 1})} />
  </>
);
/* 10 — espuma, nuvem e chuva de meias no bairro */
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const outside = f >= CHOVE10 - 4;
  return outside ? (
    <>
      <Cam pos={[0.3, 2.4, 7]} look={[0.3, 1.6, 0]} fov={58} f={f} a={CHOVE10 - 4} />
      <Sky />
      <hemisphereLight args={["#d6ecff", "#a08a5e", 1.1]} />
      <SunLight target={[0, 1, 0]} dir={[-6, 10, 7]} intensity={2.6} ext={12} />
      <group position={[0, 0, -8]}>
        <Town t={t} galo={false} variant="nova" flat clouds />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
        <planeGeometry args={[60, 30]} />
      </mesh>
      <Espuma p={[0, 6.2, -3]} s={2.2} t={t} />
      <ChuvaMeias t={t} c={[0, 0, 0]} />
      {f >= CACHORRO10 - 4 && <Dog d={{pos: [0.9, 0, 1.2], rotY: -0.4, t, blink: 0, tail: 1, legs: "down", mouthItem: <Meia p={[0, -0.02, 0.1]} r={[0, 0, Math.PI / 2]} s={1.3} c="#ffd21f" />}} />}
      <PBoy id="r10b" a={CHOVE10 - 4} f={f} pose={(fr) => ({...idle(fr), pos: [-0.8, Math.abs(Math.sin(tf(fr) * 6)) * 0.15, 1.0], rotY: 0.3, ...ARMS_UP, smile: 1, mouthOpen: 0.4, head: [-0.3, 0, 0]})} />
    </>
  ) : (
    <>
      <Cam pos={[0.3, 2.0, 4.6]} look={[0.6, 1.8, -1.0]} fov={56} f={f} a={a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood="sad" spin={1} shake={1} />
      <Espuma p={[MAQ[0], 1.2 + clamp((f - a) / 50) * 1.5, MAQ[2]]} s={0.6 + clamp((f - a) / 50) * 0.9} t={t} />
      <PBoy id="r10" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.9, 0, 0.5], rotY: 0.6, head: [-0.5, 0, 0], eyeWide: 1})} />
    </>
  );
};
/* 11 — as pazes */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const sab = f >= SABIO11 - 4 && f < CARANGUEJO11 - 4;
  const car = f >= CARANGUEJO11 - 4;
  return (
    <>
      <Cam pos={car ? [1.6, 0.9, 2.6] : sab ? [0.3, 1.7, 5.3] : [0.2, 1.6, 4.8]} look={car ? [1.2, 0.3, 0.6] : sab ? [0.3, 1.1, -0.3] : [0.3, 0.9, -0.8]} fov={52} f={f} a={car ? CARANGUEJO11 - 4 : sab ? SABIO11 - 4 : a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood="happy" />
      <Sabio p={[0.2, 0, -0.3]} rotY={0} s={0.95} t={t} mouth={sab ? 0.3 + 0.3 * Math.abs(Math.sin(t * 9)) : 0} arms={sab ? 1 : 0} />
      <group position={[RALO[0], -0.25, RALO[2]]}>
        <Caranguejo p={[0, 0, 0]} rotY={0.2} s={1.2} t={t} />
      </group>
      <mesh position={[RALO[0], 0.005, RALO[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.32, 0.6, 24]} />
        <meshStandardMaterial color="#9aa1ad" />
      </mesh>
      <PBoy id="r11" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.5, 0, 0.3], rotY: 0.5, ...(fr < PAZES11 + 20 && fr >= PAZES11 - 6 ? {rShoulder: [-1.4, 0.3, 0], rElbow: -0.2} : {}), smile: 1})} />
    </>
  );
};
/* 12 — a roupa limpinha e a tia Cleuza */
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const clean = f >= LIMPINHA12 - 4;
  const tia = f >= JOGA12 - 10 ? clamp((f - JOGA12 + 10) / 16) : 0;
  return (
    <>
      <Cam pos={[0.2, 1.5, 4.6]} look={[0.0, 1.0, -0.6]} fov={56} f={f} a={a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood={tia > 0.8 ? "mad" : "happy"} shake={tia > 0.8 ? 1 : 0} />
      {clean && tia < 0.5 &&
        [0, 1, 2].map((i) => <Meia key={i} p={[-0.2 + i * 0.25, 1.25 + 0.05 * Math.sin(t * 4 + i), 0.6]} r={[0, 0, 0.3 * Math.sin(t * 2 + i)]} s={1.6} c={SOCKC[i]} />)}
      {tia > 0 && (
        <>
          <PBoy id="r12t" a={JOGA12 - 10} f={f} look={TIA} pose={(fr) => ({...idle(fr), pos: [lerp(-3.2, -1.2, clamp((fr - JOGA12 + 10) / 16)), 0, 0.1], rotY: 1.0, walk: tf(fr) * 9, walkAmt: fr < JOGA12 + 6 ? 1 : 0, ...(fr >= JOGA12 + 6 ? {rShoulder: [-2.4, 0.2, -0.3], rElbow: -0.3} : {}), brow: -0.5})} />
          {f >= JOGA12 + 6 && <Espuma p={[MAQ[0] - 0.2, 1.3 + (1 - clamp((f - JOGA12 - 6) / 10)) * 0.8, MAQ[2] + 0.4]} s={0.35} t={t} />}
        </>
      )}
      <PBoy id="r12" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0.0, hop(fr, LIMPINHA12, 14, 0.35), 0.6], rotY: 0.2, ...(fr >= APERTA12 && fr < LIMPINHA12 ? {rShoulder: [-1.5, 0.5, 0], rElbow: -0.3} : fr >= LIMPINHA12 && fr < JOGA12 ? ARMS_UP : {}), smile: fr >= LIMPINHA12 && fr < JOGA12 + 8 ? 1 : 0, eyeWide: fr >= JOGA12 + 8 ? 1 : 0.3, mouthOpen: fr >= JOGA12 + 8 ? 0.5 : 0})} />
    </>
  );
};
/* 13 — parabéns, e a máquina devolve só uma meia */
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const threat = f >= SEGUIR13 - 4;
  return (
    <>
      <Cam pos={threat ? [0.3, 1.2, 2.8] : [0.3, 1.8, 5.4]} look={threat ? [MAQ[0], 0.8, MAQ[2]] : [0.3, 1.0, -0.4]} fov={52} f={f} a={threat ? SEGUIR13 - 4 : a} />
      <Room />
      <Maquina p={MAQ} s={1.1} t={t} mood={threat ? "mad" : "happy"} mouth={threat && f < MEIA13 ? 0.3 * Math.abs(Math.sin(t * 8)) : 0} />
      {f >= MEIA13 - 4 && <Meia p={[MAQ[0], 0.3 + Math.max(0, 0.4 - (f - MEIA13) * 0.03), MAQ[2] + 0.75]} r={[0, 0.4, Math.PI / 2]} s={2.0} c="#3a86ff" />}
      {!threat && (
        <>
          <Sabio p={[1.7, 0, -0.6]} rotY={-0.4} s={0.9} t={t} />
          <Caranguejo p={[2.1, 0, 0.5]} rotY={-0.6} s={1.2} t={t} />
          <PBoy id="r13" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, Math.abs(Math.sin(tf(fr) * 7)) * 0.3, 0.5], rotY: 0.4, ...ARMS_UP, smile: 1, mouthOpen: 0.4})} />
        </>
      )}
    </>
  );
};

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(2), Comp: S2},
  {from: L(4), Comp: S4},
  {from: L(5), Comp: S5},
  {from: L(7), Comp: S7},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: S9},
  {from: L(10), Comp: S10},
  {from: L(11), Comp: S11},
  {from: L(12), Comp: S12},
  {from: L(13), Comp: S13},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_ROUPA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["roupa", "desculpa", "maquina", "lavar", "branca", "colorida", "mal", "senha", "wifi", "meias", "cada", "encanador", "caranguejo", "ferramentas", "encanamento", "crustaceo", "cano", "errado", "ralo", "portal", "sabio", "perdidas", "inventou", "sabao", "capa", "quatrocentas", "par", "garras", "dobradura", "ancestral", "tia", "cleuza", "porta", "ninguem", "vergonha", "centrifuga", "casa", "gira", "centrifugacao", "domestica", "espuma", "nuvem", "meia", "bairro", "cachorro", "pena", "pazes", "limpinha", "parabens", "seguir", "perfil", "sempre"]);
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
  [L(3), L(4), ["ENCANAMENTO", "CRUSTÁCEO"]],
  [ESSA6, L(7), ["DOBRADURA", "ANCESTRAL"]],
  [L(9), L(10), ["CENTRIFUGAÇÃO", "DOMÉSTICA"]],
];
const FOLLOW_FROM = SEGUIR13 - 10;
const FOLLOW_TAP = FOLLOW_FROM + 40;
export const VideoRoupa: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      {TITLES.map(([x, nx, lines], i) => (
        <StageTitle key={i} from={x + 4} to={nx - 3} lines={lines} />
      ))}
      <TopTitle from={4} to={DESCULPA0 - 3} text="LAVAR A ROUPA" />
      <Bubble from={DESCULPA0} to={L(1) - 2} text="DESCULPA, MÁQUINA!" x={380} y={640} size={50} />
      <Tag from={MAL1} to={SENHA1 - 3} text="FICOU DE MAL 😤" y={330} />
      <Plaque from={SENHA1} to={AGORA1 - 3} text={"SENHA DO WI-FI:\n********"} x={700} y={560} size={48} />
      <Tag from={AGORA1 + 20} to={L(2) - 2} text="UMA DE CADA 🧦" y={330} />
      <TopTitle from={CARANGUEJO2} to={L(3) - 2} text="CARANGUEJO ENCANADOR" size={76} />
      <Ono from={PORTAL4} to={SAI4 - 4} text="VUUUSH!" size={140} color="#c86bfa" />
      <TopTitle from={SAI4 + 6} to={L(5) - 2} text="SÁBIO DAS MEIAS PERDIDAS" size={72} />
      <BigNum from={QUATRO5} to={NENHUMA5 - 3} text="400 MEIAS" size={130} />
      <Tag from={NENHUMA5} to={L(6) - 2} text="NENHUMA TEM PAR" y={330} />
      <Ono from={BATE7} to={TEM7 - 2} text="TOC TOC!" size={140} color="#ffffff" />
      <Bubble from={TEM7} to={NINGUEM7 - 3} text="TEM ALGUÉM AÍ DENTRO?" x={540} y={560} size={50} />
      <Ono from={NINGUEM7 + 6} to={L(8) - 2} text="..." size={170} color="#ffffff" rot={0} />
      <Ono from={CENTRIFUGA8} to={CASA8 - 4} text="VRRRRR!" size={150} color="#3a86ff" />
      <TopTitle from={NUVEM10} to={CHOVE10 - 3} text="NUVEM DE ESPUMA" />
      <TopTitle from={CHOVE10} to={L(11) - 2} text="CHUVA DE MEIA" />
      <Tag from={PAZES11} to={SABIO11 - 3} text="FIZERAM AS PAZES 🤝" y={330} />
      <Tag from={CARANGUEJO11} to={L(12) - 2} text="CONTINUA NO RALO" y={330} />
      <Ono from={JOGA12 + 6} to={L(13) - 2} text="PLOFT!" size={150} color="#ffd21f" />
      <Confetti from={PARABENS13} to={PARABENS13 + 60} />
      <BigNum from={MEIA13} to={TOTAL_ROUPA - 1} text="SÓ UMA MEIA 🧦" y={330} size={110} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_ROUPA - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozroupa.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx10/bonk.mp3" from={MAL1} dur={20} v={FXV * 0.35} />
      <SND src="sfx14/zap.mp3" from={CARANGUEJO2 + 10} dur={20} v={FXV * 0.25} />
      <SND src="sfx3/portal.mp3" from={PORTAL4} dur={50} v={FXV * 0.35} />
      <SND src="sfx5/knock.mp3" from={BATE7} dur={30} v={FXV * 0.45} />
      <SND src="sfx3/factory.mp3" from={CENTRIFUGA8} dur={L(10) - CENTRIFUGA8} v={FXV * 0.25} />
      <SND src="sfx10/bubble.mp3" from={L(10)} dur={CHOVE10 - L(10)} v={FXV * 0.3} />
      <SND src="sfx11/bark.mp3" from={CACHORRO10} dur={30} v={FXV * 0.35} />
      <SND src="sfx10/plim.mp3" from={PAZES11} dur={30} v={FXV * 0.3} />
      <SND src="sfx9/splat.mp3" from={JOGA12 + 6} dur={30} v={FXV * 0.4} />
      <SND src="sfx7/confetti.mp3" from={PARABENS13} dur={50} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
