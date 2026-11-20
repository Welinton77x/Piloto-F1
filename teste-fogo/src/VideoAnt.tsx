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
import {sm} from "./Sets9";
import {Penguin} from "./Sets11";
import {BigJet} from "./Sets19";
import {Bg} from "./Sets20";
import {Oleo, VoFritadeira, Skates, Treno, Foca, FishBowl, Pastel, Crocoto, FarofaPile, QueijoPresunto, Antarctica, CrunchWorld, Gorro} from "./Sets29";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingAnt.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_ANT = F(words[words.length - 1].e + 0.9);

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
const AVIAO0 = at(0, "aviao");
const VO1 = at(1, "vo");
const DOZE1 = at(1, "doze");
const CANTAR1 = at(1, "cantar");
const SERTANEJO1 = at(1, "sertanejo");
const QUINHENTOS2 = at(2, "quinhentos");
const INCLUSIVE2 = at(2, "inclusive");
const FOCA3 = at(3, "foca");
const PEIXE3 = at(3, "peixe");
const PEIXINHO3 = at(3, "peixinho");
const AMIGO3 = at(3, "amigo");
const ESQUENTA5 = at(5, "esquenta");
const DERRETE5 = at(5, "derrete");
const CAI5 = at(5, "cai");
const DIMENSAO6 = at(6, "dimensao");
const TUDO6 = at(6, "tudo");
const SILENCIO6 = at(6, "silencio");
const ESMIGALHAR7 = at(7, "esmigalhar");
const CREC7 = at(7, "crec");
const FAROFA7B = at(7, "farofa", 1);
const VIRA7B = at(7, "vira", 1);
const FRITA9 = at(9, "frita");
const PINGUINS9 = at(9, "pinguins");
const SAI9 = at(9, "sai");
const RECHEIO10B = at(10, "recheio", 1);
const COBRA11 = at(11, "cobra");
const PINGUINS11 = at(11, "pinguins");
const PAGA11 = at(11, "paga");
const VOANDO11 = at(11, "voando");
const PARABENS12 = at(12, "parabens");
const SAIU12 = at(12, "saiu");
const SEGUE13 = at(13, "segueee");
const SEGUE13B = at(13, "segueee", 1);
const SE13 = at(13, "se");
const FRITAR13 = at(13, "fritar");
const CELULAR13 = at(13, "celular");

const HAT = <Gorro color="#2e6fd8" />;
const ITEM_R: V3 = [Math.PI / 2, 0, 0];
const PASTEL_ITEM = (puff = 0) => (
  <group rotation={ITEM_R}>
    <Pastel p={[0, 0.02, 0.06]} r={[0, 0, 0]} s={0.8} puff={puff} />
  </group>
);
const HOLDP: Pose = {rShoulder: [-0.9, 0.3, 0.05], rElbow: -1.1};

/* ---------- física e movimento do menino ---------- */
const tf = (fr: number) => fr / FPS;
const hop = (fr: number, from: number, dur = 16, h = 0.4) => {
  const k = (fr - from) / dur;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * h : 0;
};
const land = (fr: number, at0: number, d = 8) => {
  const k = (fr - at0) / d;
  return k > 0 && k < 1 ? Math.sin(k * Math.PI) * 0.1 : 0;
};
const bounce = (fr: number, period = 34, h = 0.3) => Math.abs(Math.sin((fr / period) * Math.PI)) * h;
const WAVE = (fr: number): Pose => ({lShoulder: [-2.7, 0, 0.45], lElbow: -0.6 + 0.45 * Math.sin(tf(fr) * 14)});
const PBoy: React.FC<{id: string; a: number; f: number; pose: (fr: number) => Pose; item?: React.ReactNode}> = ({id, a, f, pose, item}) => {
  const p = physics(id + ":" + a, pose, a, f);
  return item !== undefined ? <HandToy pose={p} look={BOY} headExtra={HAT} item={item} /> : <Toy pose={p} look={BOY} headExtra={HAT} />;
};
const Flat: React.FC<{bg: string; ground?: string; light?: number}> = ({bg, ground, light = 1}) => (
  <>
    <Bg c={bg} />
    <hemisphereLight args={["#ffffff", "#7a8aa0", 1.0 * light]} />
    <directionalLight position={[-4, 8, 6]} intensity={2.2 * light} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
    {ground && (
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm(ground, 0.9)} receiveShadow>
        <planeGeometry args={[80, 80]} />
      </mesh>
    )}
  </>
);
const Ice: React.FC<{t: number; melt?: number; hole?: number}> = ({t, melt = 0, hole = 0}) => (
  <>
    <Flat bg="#9fd8ff" />
    <Antarctica t={t} melt={melt} hole={hole} />
  </>
);
/** fileira de pinguins de patins puxando o trenó (em coordenadas do trenó: na frente, +z) */
const PenguinTeam: React.FC<{t: number; run?: number}> = ({t, run = 0}) => (
  <>
    {Array.from({length: 12}, (_, i) => {
      const row = Math.floor(i / 2);
      const sd = i % 2 ? 1 : -1;
      return (
        <group key={i} position={[0.35 * sd, 0, 1.4 + row * 0.75]}>
          <Penguin p={[0, 0.12, 0]} rotY={0} t={t + i * 0.3} s={0.55} walk={run} />
          <Skates p={[0, 0, 0]} s={0.6} />
        </group>
      );
    })}
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.35 * sd, 0.35, 3.6]} material={sm("#8a5a33", 0.6)}>
        <boxGeometry args={[0.02, 0.02, 4.4]} />
      </mesh>
    ))}
  </>
);

/* 0 — o pastel, a garrafa de óleo e o avião */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const plane = f >= AVIAO0 - 20;
  const hide = f >= AVIAO0;
  return (
    <>
      <Cam pos={[0.2, 1.5, 5.6]} look={[0.2, 1.0, 0]} fov={52} f={f} a={a} />
      <Ice t={t} />
      {plane && <BigJet p={[6 - (f - AVIAO0 + 20) * 0.25, 6.5, -6]} s={0.3} />}
      <PBoy id="a0" a={a} f={f} item={PASTEL_ITEM()} pose={(fr) => {
        const w = clamp(fr / 40);
        const sc = fr >= MAS0;
        return {...idle(fr), pos: [lerp(-1.8, -0.35, easeOut(w)), hop(fr, AVIAO0, 14, 0.3), 0], rotY: w < 1 ? 1.2 : 0.25, walk: tf(fr) * 9, walkAmt: w < 1 ? 1 : 0, ...HOLDP, smile: sc ? 0.3 : 1, head: hide ? [-0.5, 0.3, 0] : [0, 0.2 * Math.sin(tf(fr) * 2), 0], eyeWide: hide ? 1 : 0.3, ...(hide ? {lShoulder: [-2.6, 0, 0.6], lElbow: -0.2} : {}), squash: land(fr, AVIAO0 + 14)};
      }} />
      {(() => {
        const j = clamp((f - AVIAO0) / 12);
        return <Oleo p={[lerp(0.9, 0.25, j), Math.sin(j * Math.PI) * 0.5 + (f < AVIAO0 ? Math.abs(Math.sin(t * 6)) * 0.04 : 0), lerp(0.2, -0.35, j)]} rotY={-0.3} s={1.2} t={t} scared={f >= MAS0 ? 1 : 0.2} arms={hide ? 1 : 0} walk={f < AVIAO0 ? 1 : 0} />;
      })()}
    </>
  );
};

/* 1 — a vó fritadeira, o trenó e os 12 pinguins */
const SLED: V3 = [0.9, 0, -1.6];
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const team = f >= DOZE1 - 4 && f < CANTAR1 - 4;
  const sing = f >= CANTAR1 - 4;
  const go = f >= SERTANEJO1 + 18 ? clamp((f - SERTANEJO1 - 18) / 30) : 0;
  return (
    <>
      {team ? (
        <Cam pos={[3.6, 2.4, 3.8]} look={[3.2, 0.5, -1.6]} fov={58} f={f} a={DOZE1 - 4} />
      ) : sing ? (
        <Cam pos={[0.2, 1.5, 4.4]} look={[-0.6, 1.1, 0.4]} fov={52} f={f} a={CANTAR1 - 4} />
      ) : (
        <Cam pos={[-0.2, 1.8, 6.2]} look={[-0.7, 1.0, -0.5]} fov={58} f={f} a={a} />
      )}
      <Ice t={t} />
      <VoFritadeira p={[-1.9, 0, -1.2]} rotY={0.4} s={1.1} t={t} mouth={f >= VO1 && f < VO1 + 30 ? 0.4 : 0} />
      <group position={[SLED[0] + go * go * 30, 0, SLED[2]]} rotation={[0, Math.PI / 2, 0]}>
        <Treno p={[0, 0, 0]} rotY={0} />
        <PenguinTeam t={t} run={go > 0 ? 1 : 0} />
      </group>
      <PBoy id="a1" a={a} f={f} item={PASTEL_ITEM()} pose={(fr) => {
        const sg = fr >= CANTAR1 - 4;
        const tt = tf(fr);
        return {...idle(fr), pos: [-0.5, sg ? bounce(fr, 14, 0.12) : 0, 0.8], rotY: sg ? 0.1 : -0.4, ...HOLDP, ...(sg ? {lShoulder: [-1.2, -0.7, 0], lElbow: -2.0, head: [-0.15, 0.25 * Math.sin(tt * 4), 0.12 * Math.sin(tt * 4)], mouthOpen: 0.4 + 0.3 * Math.abs(Math.sin(tt * 9)), blink: 0.7} : fr >= VO1 && fr < VO1 + 40 ? WAVE(fr) : {}), smile: 1};
      }} />
      {sing && Array.from({length: 4}, (_, i) => {
        const q = ((t * 0.7 + i / 4) % 1);
        return (
          <mesh key={i} position={[-0.3 + q * 0.8, 1.9 + q * 1.4, 0.8]} scale={0.12 * (1 - q * 0.5)} material={sm(["#ff4d6d", "#ffd21f", "#2ecc71", "#3a86ff"][i], 0.4)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        );
      })}
    </>
  );
};

/* 2 — o trenó a jato e os 550 seguidores */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const point = f >= INCLUSIVE2 - 4;
  const z = -((f - a) / FPS) * 9;
  return (
    <>
      {point ? (
        <Cam pos={[0.6, 1.8, z - 4.4]} look={[0.0, 1.1, z]} fov={54} f={f} a={INCLUSIVE2 - 4} />
      ) : (
        <Cam pos={[3.2, 2.4, z + 5.5]} look={[0.0, 0.8, z + 1.0]} fov={58} f={f} a={a} />
      )}
      <Ice t={t} />
      <group position={[0, 0, z]} rotation={[0, Math.PI, 0]}>
        <Treno p={[0, 0, 0]} />
        <PenguinTeam t={t} run={1} />
      </group>
      <PBoy id="a2" a={a} f={f} item={PASTEL_ITEM()} pose={(fr) => {
        const pt = fr >= INCLUSIVE2 - 4;
        const tt = tf(fr);
        const zz = -((fr - a) / FPS) * 9;
        return {...idle(fr), pos: [0, 0.36 + 0.03 * Math.sin(tt * 30), zz + 0.2], rotY: pt ? Math.PI - 0.15 : Math.PI, legLift: pt ? 0 : 0.6, ...(pt ? {rShoulder: [-1.55, 0.2, -0.05], rElbow: -0.1, smile: 1, mouthOpen: 0.3 + 0.3 * Math.abs(Math.sin(tt * 10)), head: [0, 0.1, 0.1 * Math.sin(tt * 4)]} : {...HOLDP, lShoulder: [-2.5, 0, 0.6], lElbow: -0.2, mouthOpen: 0.6, eyeWide: 1, hairLift: 1})};
      }} />
      <Oleo p={[0.35, 0.36, z - 0.5]} rotY={Math.PI} s={0.9} t={t} scared={1} arms={1} />
      {Array.from({length: 10}, (_, i) => (
        <mesh key={i} position={[(i % 2 ? 1 : -1) * (0.9 + (i % 3) * 0.4), 0.15 + (i % 4) * 0.2, z + 1 + ((t * 14 + i * 1.3) % 6)]}>
          <boxGeometry args={[0.03, 0.03, 1.0]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.7} />
        </mesh>
      ))}
    </>
  );
};

/* 3–4 — a foca garçom e o peixinho */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const hug = f >= PEIXINHO3 - 4;
  const dilema = f >= L(4);
  return (
    <>
      <Cam pos={hug ? [0.2, 1.5, 4.0] : [0.4, 1.7, 5.4]} look={hug ? [-0.2, 1.1, 0.3] : [0.3, 1.0, 0]} fov={hug ? 52 : 56} f={f} a={hug ? PEIXINHO3 - 4 : a} />
      <Ice t={t} />
      <Foca p={[1.0, 0, -0.3]} rotY={-0.5} s={1.1} t={t} mouth={f >= FOCA3 && f < PEIXE3 + 20 ? 0.3 + 0.3 * Math.abs(Math.sin(t * 9)) : 0} blink={blinkCurve(f + 4)} />
      {hug && <FishBowl p={[-0.33, 0.78, 0.92]} s={1.25} t={t} sad={1} />}
      <PBoy id="a3" a={a} f={f} item={hug ? null : PASTEL_ITEM()} pose={(fr) => {
        const h = fr >= PEIXINHO3 - 4;
        const d = fr >= L(4);
        const look = d ? Math.sin(tf(fr) * 7) * 0.7 : 0;
        return {...idle(fr), pos: [-0.5, 0, 0.5], rotY: 0.35, ...(h ? {rShoulder: [-0.75, 0.55, 0.1], rElbow: -1.2, lShoulder: [-0.75, -0.55, -0.1], lElbow: -1.2} : HOLDP), head: [d ? 0.1 : 0, look, 0], smile: h && fr < AMIGO3 ? 0.7 : 0, eyeWide: d ? 0.8 : 0.3, brow: d ? 1 : 0};
      }} />
      {f >= AMIGO3 && !dilema &&
        Array.from({length: 3}, (_, i) => {
          const q = ((t * 0.8 + i / 3) % 1);
          return (
            <mesh key={i} position={[-0.3 + i * 0.15, 1.7 + q * 0.8, 0.9]} scale={0.08 * (1 - q * 0.4)} material={sm("#ff4d6d", 0.4)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          );
        })}
    </>
  );
};

/* 5 — a vó esquenta o óleo, o gelo derrete e o trenó cai no buraco */
const S5: React.FC<ShotProps> = ({f, a, t}) => {
  const melt = f >= DERRETE5 - 6 ? clamp((f - DERRETE5 + 6) / 40) : 0;
  const hole = f >= CAI5 - 4 ? clamp((f - CAI5 + 4) / 8) : 0;
  const fall = f >= CAI5 ? clamp((f - CAI5) / 18) : 0;
  return (
    <>
      <Cam pos={[0.3, 2.3 + fall * 1.5, 5.6]} look={[0.0, 0.8 - fall * 1.5, 0]} fov={56} f={f} a={a} />
      <Ice t={t} melt={melt} hole={hole} />
      <group position={[0, -fall * fall * 6, 0]}>
        <VoFritadeira p={[0.0, 0, -0.6]} s={1.1} t={t} boil={f >= ESQUENTA5 ? 1 : 0} mouth={0.2} />
        <PBoy id="a5" a={a} f={f} item={PASTEL_ITEM()} pose={(fr) => {
          const fl = fr >= CAI5;
          return {...idle(fr), pos: [-0.85, hop(fr, DERRETE5, 14, 0.25), 0.6], rotY: 0.5, ...HOLDP, ...(fl ? {lShoulder: [-2.8, 0, 0.6], lElbow: -0.2, rShoulder: [-2.8, 0, -0.6], rElbow: -0.2, hairLift: 1} : {}), eyeWide: fr >= DERRETE5 ? 1 : 0.4, mouthOpen: fl ? 0.8 : fr >= DERRETE5 ? 0.3 : 0, brow: fr >= DERRETE5 ? 1 : 0};
        }} />
        <Oleo p={[1.0, 0, 0.6]} rotY={-0.4} s={1.0} t={t} scared={1} arms={fall > 0 ? 1 : 0} />
      </group>
    </>
  );
};

/* 6 — dimensão crocante: cada passo faz crec */
const CrunchLights: React.FC<{farofa?: number}> = ({farofa = 0}) => <Flat bg={farofa > 0.5 ? "#f7d58a" : "#ffb347"} light={1} />;
const S6: React.FC<ShotProps> = ({f, a, t}) => {
  const landK = clamp((f - a) / 14);
  return (
    <>
      <Cam pos={[0.2, 1.7, 5.6]} look={[0.2, 1.0, 0]} fov={56} f={f} a={a} />
      <CrunchLights />
      <CrunchWorld t={t} />
      <PBoy id="a6" a={a} f={f} item={PASTEL_ITEM()} pose={(fr) => {
        const walking = fr >= TUDO6 && fr < SILENCIO6 - 6;
        const frozen = fr >= SILENCIO6 - 6;
        const y = (1 - clamp((fr - a) / 14)) * 4;
        return {...idle(fr), pos: [walking ? lerp(-0.6, 0.4, clamp((fr - TUDO6) / (SILENCIO6 - 6 - TUDO6))) : frozen ? 0.4 : -0.6, y, 0.3], rotY: walking ? 1.3 : 0.2, walk: tf(fr) * 7, walkAmt: walking ? 1 : 0, ...HOLDP, squash: land(fr, a + 14), eyeWide: frozen ? 1 : 0.5, blink: 0, ...(frozen ? {lShoulder: [-0.3, 0, 0.3], lElbow: -0.1, torso: [0, 0, 0], head: [0, 0.4, 0]} : {}), brow: frozen ? 1 : 0};
      }} />
      <Oleo p={[1.2, (1 - landK) * 4.5, -0.2]} rotY={-0.3} s={0.9} t={t} scared={0.6} />
    </>
  );
};

/* 7–8 — esmigalhar o crocotó, tudo vira farofa */
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const squish = f >= CREC7 - 4 ? clamp((f - CREC7 + 4) / 8) : 0;
  const pile = f >= CREC7 + 4;
  const world = f >= VIRA7B - 2 ? 1 : 0;
  return (
    <>
      <Cam pos={[0.2, 1.6, 4.8]} look={[0.2, 0.9, -0.2]} fov={54} f={f} a={pile ? CREC7 + 4 : a} />
      <CrunchLights farofa={world} />
      <CrunchWorld t={t} farofa={world} />
      {!pile ? <Crocoto p={[0.5, 0, 0.2]} s={1.2} t={t} squish={squish} /> : <FarofaPile p={[0.5, 0, 0.2]} s={0.9} />}
      <PBoy id="a7" a={a} f={f} pose={(fr) => {
        const sq = fr >= ESMIGALHAR7 - 4 && fr < CREC7 + 4;
        const tt = tf(fr);
        return {...idle(fr), pos: [-0.35, hop(fr, CREC7 + 4, 14, 0.3), 0.6], rotY: 0.6, ...(sq ? {rShoulder: [-1.3, 0.6 + 0.2 * Math.sin(tt * 20), 0], rElbow: -0.6, lShoulder: [-1.3, -0.6 - 0.2 * Math.sin(tt * 20), 0], lElbow: -0.6, torso: [0.3, 0, 0]} : fr >= CREC7 + 4 ? ARMS_UP : {}), eyeWide: sq ? 0.4 : 0.8, brow: sq ? -0.8 : 0.5, mouthOpen: fr >= CREC7 + 4 ? 0.5 : 0.1, squash: land(fr, CREC7 + 18)};
      }} />
    </>
  );
};
const S8: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.0, 2.0, 6.2]} look={[0.0, 1.4, 0]} fov={58} f={f} a={a} />
    <CrunchLights farofa={1} />
    <CrunchWorld t={t} farofa={1} />
    <FarofaPile p={[0, 0, 0]} s={2.2} />
    <PBoy id="a8" a={a} f={f} pose={(fr) => {
      const tt = tf(fr);
      return {...idle(fr), pos: [0.3 * Math.sin(tt * 3), 0.62 + 0.06 * Math.sin(tt * 6), 0], rotY: 0.6 + 0.2 * Math.sin(tt * 3), rShoulder: [-0.2, 0, -1.4], rElbow: -0.1, lShoulder: [-0.2, 0, 1.4], lElbow: -0.1, torso: [0, 0, 0.18 * Math.sin(tt * 3)], legLift: 0.25, smile: 1, mouthOpen: 0.4};
    }} />
  </>
);

/* 9 — a vó frita, os pinguins em roda, só sai pastel de vento */
const PenguinRing: React.FC<{t: number; c: V3; r?: number}> = ({t, c, r = 1.6}) => (
  <>
    {Array.from({length: 12}, (_, i) => {
      const ang = (i / 12) * Math.PI * 2;
      if (Math.cos(ang) > 0.75) return null;
      return (
        <group key={i} position={[c[0] + Math.sin(ang) * r, 0, c[2] + Math.cos(ang) * r]}>
          <Penguin p={[0, 0.12, 0]} rotY={ang + Math.PI} t={t + i * 0.4} s={0.6} dance={0.3} />
          <Skates p={[0, 0, 0]} s={0.6} />
        </group>
      );
    })}
  </>
);
const FRY: V3 = [0, 0, -0.6];
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const ring = f >= PINGUINS9 - 4;
  const puff = f >= SAI9 - 4;
  return (
    <>
      <Cam pos={[0.2, 2.3, 5.4]} look={[0.0, 1.0, -0.6]} fov={58} f={f} a={ring ? PINGUINS9 - 4 : a} />
      <Ice t={t} />
      <VoFritadeira p={FRY} s={1.1} t={t} boil={1} basket={f >= FRITA9 ? 0.5 + 0.5 * Math.sin(t * 4) : 0} mouth={0.2} />
      {ring && <PenguinRing t={t} c={FRY} />}
      {puff &&
        Array.from({length: 5}, (_, i) => {
          const q = clamp((f - SAI9 + 4 - i * 6) / 30);
          return q > 0 ? <Pastel key={i} p={[FRY[0] - 0.6 + i * 0.3, 1.2 + q * (i === 2 ? 4 : 1.2), FRY[2] + 0.4]} r={[0, i, 0.3 * Math.sin(t * 3 + i)]} s={0.9} puff={1} /> : null;
        })}
      {!ring && <PBoy id="a9" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-1.0, 0, 0.6], rotY: 0.6, smile: 1, head: [0.15, 0.3, 0], torso: [0.15, 0, 0]})} />}
    </>
  );
};

/* 10 — "o recheio tá vindo" e o recheio patinando */
const S10: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.5, 3.8]} look={[0.6, 1.1, -0.2]} fov={52} f={f} a={a} />
    <Ice t={t} />
    <Foca p={[0.6, 0, -0.3]} rotY={-0.2} s={1.1} t={t} mouth={0.3 + 0.35 * Math.abs(Math.sin(t * 9))} />
  </>
);
const S10b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.4, 4.2]} look={[0.0, 0.7, 0]} fov={54} f={f} a={a} />
    <CrunchLights farofa={1} />
    <CrunchWorld t={t} farofa={1} />
    <QueijoPresunto p={[0, 0, 0.3]} t={t} />
    {[-1, 1].map((sd) => (
      <group key={sd} position={[1.1 * sd + 0.25 * Math.sin(t * 2 + sd), 0, -0.6]}>
        <Penguin p={[0, 0.12, 0]} rotY={-0.3 * sd} t={t} s={0.6} dance={0.5} />
        <Skates p={[0, 0, 0]} s={0.6} />
      </group>
    ))}
  </>
);

/* 11 — a conta e o pastel de vento que sai voando */
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const pay = f >= PAGA11 - 6;
  const fly = f >= VOANDO11 - 6 ? clamp((f - VOANDO11 + 6) / 40) : 0;
  return (
    <>
      <Cam pos={[0.2, 1.8 + fly * 0.5, 6.0]} look={[0.2, 1.1 + fly * 1.2, -0.3]} fov={60} f={f} a={pay ? PAGA11 - 6 : a} />
      <Ice t={t} />
      <Foca p={[0.8, 0, -0.4]} rotY={-0.5} s={1.0} t={t} bill mouth={f >= COBRA11 && f < COBRA11 + 30 ? 0.4 : 0} />
      {f >= PINGUINS11 - 4 && (
        <>
          {[0, 1, 2].map((i) => (
            <group key={i} position={[1.9 + i * 0.5, 0, -0.9 + i * 0.3]}>
              <Penguin p={[0, 0.12, 0]} rotY={-1.4} t={t + i} s={0.6} />
              <Skates p={[0, 0, 0]} s={0.6} />
            </group>
          ))}
        </>
      )}
      <PBoy id="a11" a={a} f={f} item={!pay ? PASTEL_ITEM(1) : null} pose={(fr) => {
        const py = fr >= PAGA11 - 6;
        const fl = fr >= VOANDO11 - 6;
        return {...idle(fr), pos: [-0.6, 0, 0.5], rotY: 0.7, ...(py && !fl ? {rShoulder: [-1.4, 0.5, 0.1], rElbow: -0.3} : fl ? {rShoulder: [-2.6, 0.2, -0.3], rElbow: -0.2, head: [-0.6, 0, 0], eyeWide: 1, mouthOpen: 0.5} : HOLDP), smile: py && !fl ? 0.6 : 0};
      }} />
      {pay && <Pastel p={[-0.1 + fly * 0.6, 1.25 + fly * fly * 5, 0.9 - fly * 0.6]} r={[0, t * 2, 0.2 * Math.sin(t * 5)]} s={1.0} puff={1} />}
    </>
  );
};

/* 12 — parabéns */
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const deflate = f >= SAIU12 ? clamp((f - SAIU12) / 20) : 0;
  return (
    <>
      <Cam pos={[0.3, 2.1, 7.4]} look={[0.3, 1.1, -0.4]} fov={60} f={f} a={a} />
      <Ice t={t} />
      <VoFritadeira p={[-1.8, 0, -1.2]} rotY={0.4} s={0.9} t={t} boil={1} mouth={0.3} />
      <Foca p={[1.8, 0, -1.0]} rotY={-0.4} s={0.9} t={t} />
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-0.9 + i * 0.9, 0, -1.8]}>
          <Penguin p={[0, 0.12, 0]} rotY={0} t={t + i} s={0.55} dance={1} />
          <Skates p={[0, 0, 0]} s={0.55} />
        </group>
      ))}
      <Oleo p={[-0.9, 0, 0.9]} rotY={0.2} s={1.0} t={t} arms={1} />
      <FishBowl p={[1.0, 0, 1.0]} s={1.3} t={t} />
      <PBoy id="a12" a={a} f={f} item={PASTEL_ITEM(1 - deflate)} pose={(fr) => ({...idle(fr), pos: [0.0, bounce(fr - a, 15, 0.3), 0.6], rotY: 0.3 * Math.sin(tf(fr) * 5), rShoulder: [-1.5, 0.3, 0.05], rElbow: -1.6, lShoulder: [-2.5, 0, 0.5 + 0.3 * Math.sin(tf(fr) * 10)], lElbow: -0.3, smile: 1, mouthOpen: 0.4})} />
    </>
  );
};

/* 13 — "me segueee": o menino vem correndo pra cima de você */
const S13a: React.FC<ShotProps> = ({f, a, t}) => {
  const k = clamp((f - a) / (SE13 - a));
  const z = lerp(-9, 1.6, k);
  const shake = 0.04 * Math.sin(t * 37);
  return (
    <>
      <Cam pos={[0.15 + shake, 1.15 + shake * 0.5, lerp(4.2, 4.6, k)]} look={[0, 1.15, z - 2]} fov={52} f={f} a={a} punch={4} />
      <Flat bg="#ff5a3a" ground="#c8402a" light={0.9} />
      {Array.from({length: 8}, (_, i) => (
        <mesh key={i} position={[(i % 2 ? 1 : -1) * (1.2 + (i % 3) * 0.5), 0.6 + (i % 4) * 0.5, z - 1 - ((t * 12 + i * 1.7) % 6)]}>
          <boxGeometry args={[0.03, 0.03, 1.2]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.6} />
        </mesh>
      ))}
      <PBoy id="a13" a={a} f={f} pose={(fr) => {
        const tt = tf(fr);
        const yell = (fr >= SEGUE13 - 2 && fr < SEGUE13 + 24) || (fr >= SEGUE13B - 2 && fr < SEGUE13B + 20);
        return {...idle(fr), pos: [0.08 * Math.sin(tt * 8), Math.abs(Math.sin(tt * 8)) * 0.12, lerp(-9, 1.6, clamp((fr - a) / (SE13 - a)))], rotY: 0, ...RUN(tt * 0.6), rShoulder: [-1.55 + 0.12 * Math.sin(tt * 16), 0.15, -0.1], rElbow: -0.15, lShoulder: [-1.55 - 0.12 * Math.sin(tt * 16), -0.15, 0.1], lElbow: -0.15, torso: [0.22, 0, 0.05 * Math.sin(tt * 8)], head: [-0.15, 0.08 * Math.sin(tt * 5), 0], brow: -1, eyeWide: 1, mouthOpen: yell ? 0.8 : 0.35, blink: 0};
      }} />
    </>
  );
};
/* a vó fritadeira frita o celular */
const S13b: React.FC<ShotProps> = ({f, a, t}) => {
  const drop = f >= FRITAR13 ? clamp((f - FRITAR13) / 14) : 0;
  return (
    <>
      <Cam pos={[0.2, 1.7, 3.6]} look={[0.0, 1.0, 0]} fov={52} f={f} a={a} />
      <Flat bg="#ffb04a" ground="#ff8f3a" />
      <VoFritadeira p={[0, 0, -0.3]} s={1.1} t={t} boil={1} phone={Math.max(0.02, drop)} wink={f >= CELULAR13 + 10 ? 1 : 0} mouth={f < FRITAR13 ? 0.3 * Math.abs(Math.sin(t * 8)) : 0} />
      {drop >= 1 &&
        Array.from({length: 10}, (_, i) => {
          const q = ((t * 1.6 + i / 10) % 1);
          return (
            <mesh key={i} position={[-0.3 + (i % 5) * 0.15, 1.15 + q * 0.6, -0.4 + Math.floor(i / 5) * 0.2]} scale={0.06 * (1 - q)}>
              <sphereGeometry args={[1, 8, 6]} />
              <meshStandardMaterial color="#fff3b0" transparent opacity={0.8} />
            </mesh>
          );
        })}
    </>
  );
};

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3},
  {from: L(5), Comp: S5},
  {from: L(6), Comp: S6},
  {from: L(7), Comp: S7},
  {from: L(8), Comp: S8},
  {from: L(9), Comp: S9},
  {from: L(10), Comp: S10},
  {from: RECHEIO10B - 3, Comp: S10b},
  {from: L(11), Comp: S11},
  {from: L(12), Comp: S12},
  {from: L(13), Comp: S13a},
  {from: SE13 - 3, Comp: S13b},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_ANT} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["pastel", "antartida", "oleo", "treno", "medo", "aviao", "vo", "fritadeira", "touca", "doze", "pinguins", "patins", "cantar", "sertanejo", "patinam", "noticia", "quinhentos", "cinquenta", "seguidores", "inclusive", "segue", "ai", "garcom", "foca", "gravata", "borboleta", "peixe", "peixinho", "aquario", "amigo", "dilema", "aquatico", "esquenta", "quente", "derrete", "gelo", "buraco", "dimensao", "crocante", "estala", "silencio", "crec", "esmigalhar", "crocoto", "farofa", "esmigalhamento", "farofistico", "frita", "panela", "vento", "recheio", "patinando", "conta", "cobram", "unico", "voando", "parabens", "segueee", "agora", "fritar", "celular"]);
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
/* ---------- celular com o perfil dos pinguins ---------- */
const PhoneCard: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 5, to));
  const n = Math.round(lerp(480, 550, clamp((f - from) / 25)));
  return (
    <div style={{position: "absolute", left: 540, top: 760, transform: `translate(-50%,-50%) scale(${s}) rotate(4deg)`, width: 400, height: 560, borderRadius: 48, background: "#15151c", padding: 18, boxShadow: "0 12px 0 rgba(0,0,0,0.25)"}}>
      <div style={{width: "100%", height: "100%", borderRadius: 32, background: "#ffffff", fontFamily, textAlign: "center", paddingTop: 50}}>
        <div style={{fontSize: 130}}>🐧</div>
        <div style={{fontWeight: 900, fontSize: 38, color: "#101018", marginTop: 6}}>@pinguins.de.patins</div>
        <div style={{fontWeight: 900, fontSize: 92, color: "#101018", marginTop: 26}}>{n}</div>
        <div style={{fontWeight: 700, fontSize: 36, color: "#7a7f8a"}}>seguidores</div>
        <div style={{margin: "26px auto 0", width: 240, background: "#2e6fd8", color: "#ffffff", fontWeight: 900, fontSize: 34, borderRadius: 18, padding: "10px 0"}}>Seguindo ✓</div>
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
  [L(4), ["DILEMA", "AQUÁTICO"]],
  [L(8), ["ESMIGALHAMENTO", "FAROFÍSTICO"]],
];
const FOLLOW_FROM = L(13) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoAnt: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const crecs = [0, 1, 2, 3, 4].map((i) => TUDO6 + 6 + i * 11);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      {TITLES.map(([x, lines], i) => {
        const next = [L(5), L(9)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}
      <TopTitle from={4} to={MAS0 - 3} text="PASTEL NA ANTÁRTIDA" size={80} />
      <Ono from={24} to={MAS0 - 4} text="?" x={760} y={560} size={160} color="#ffffff" rot={8} />
      <Bubble from={AVIAO0 - 2} to={L(1) - 2} text="AVIÃO NÃO!" x={720} y={760} size={58} />
      <TopTitle from={VO1} to={DOZE1 - 3} text="VÓ FRITADEIRA" />
      <BigNum from={DOZE1} to={CANTAR1 - 4} text="12 PINGUINS" size={130} />
      <Ono from={CANTAR1} to={L(2) - 2} text="♪ ♫ ♪" y={420} size={130} color="#ff4d6d" />
      <PhoneCard from={QUINHENTOS2 - 6} to={INCLUSIVE2 - 4} />
      <Plaque from={INCLUSIVE2} to={L(3) - 2} text={"SEGUE AÍ 👉"} x={700} y={980} size={60} />
      <TopTitle from={FOCA3} to={PEIXE3 - 3} text="FOCA GARÇOM" />
      <Tag from={PEIXE3} to={PEIXINHO3 - 3} text="SÓ ACEITA PEIXE 🐟" y={330} />
      <Tag from={AMIGO3} to={L(4) - 2} text="ELE É SEU AMIGO 🥺" y={330} />
      <Ono from={ESQUENTA5 + 4} to={DERRETE5 - 4} text="BLUB BLUB!" size={120} color="#ffd21f" />
      <Ono from={CAI5} to={L(6) - 2} text="CRÁÁS!" size={160} color="#7fd0ff" />
      <TopTitle from={DIMENSAO6} to={TUDO6 - 3} text="DIMENSÃO CROCANTE" size={80} />
      {crecs.map((c, i) => (
        <Ono key={i} from={c} to={c + 14} text="CREC!" x={300 + (i % 3) * 230} y={480 + (i % 2) * 140} size={100} color="#ffd21f" rot={(i % 2 ? 8 : -8)} />
      ))}
      <Ono from={SILENCIO6 + 14} to={L(7) - 2} text="crec." y={520} size={80} color="#ffffff" rot={0} />
      <TopTitle from={L(7) + 4} to={ESMIGALHAR7 + 20} text="CROCOTÓ" />
      <Ono from={CREC7} to={FAROFA7B - 4} text="CREC!" size={170} color="#ffd21f" />
      <TopTitle from={SAI9 - 2} to={L(10) - 2} text="SÓ PASTEL DE VENTO" size={80} />
      <Bubble from={L(10)} to={RECHEIO10B - 4} text="O RECHEIO TÁ VINDO!" x={540} y={560} size={48} />
      <Tag from={PAGA11} to={VOANDO11 - 3} text="ÚNICO PASTEL" y={330} />
      <Ono from={VOANDO11} to={L(12) - 2} text="FIUUU!" size={150} color="#ffffff" />
      <Confetti from={PARABENS12} to={PARABENS12 + 70} />
      <TopTitle from={SAIU12} to={L(13) - 2} text="SÓ SAIU PASTEL DE VENTO" size={72} />
      <Ono from={SEGUE13} to={SEGUE13B - 4} text="ME SEGUEEE!" y={420} size={140} color="#ffd21f" rot={-6 + 3 * Math.sin(f / 2)} />
      <Ono from={SEGUE13B} to={SE13 - 3} text="ME SEGUEEE AGORA!" y={420} size={88} color="#ff4d6d" rot={5 + 3 * Math.sin(f / 2)} />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_ANT - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozant.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      {crecs.map((c, i) => (
        <SND key={"c" + i} src="sfx3/crack.mp3" from={c} dur={14} v={FXV * 0.3} />
      ))}
      <SND src="sfx2/plane.mp3" from={AVIAO0 - 20} dur={40} v={FXV * 0.3} />
      <SND src="sfx12/gasp.mp3" from={AVIAO0} dur={30} v={FXV * 0.3} />
      <SND src="sfx3/bell.mp3" from={DOZE1} dur={40} v={FXV * 0.3} />
      <SND src="sfx14/forro.mp3" from={CANTAR1} dur={L(2) - CANTAR1} v={FXV * 0.25} />
      <SND src="sfx2/wind.mp3" from={L(2)} dur={INCLUSIVE2 - L(2)} v={FXV * 0.3} />
      <SND src="sfx10/plim.mp3" from={QUINHENTOS2} dur={30} v={FXV * 0.35} />
      <SND src="sfx12/aww.mp3" from={AMIGO3} dur={50} v={FXV * 0.35} />
      <SND src="sfx10/bubble.mp3" from={ESQUENTA5} dur={DERRETE5 - ESQUENTA5} v={FXV * 0.3} />
      <SND src="sfx3/crack.mp3" from={CAI5} dur={30} v={FXV * 0.45} />
      <SND src="sfx3/crack.mp3" from={CREC7} dur={20} v={FXV * 0.5} />
      <SND src="sfx7/pof.mp3" from={VIRA7B} dur={20} v={FXV * 0.4} />
      <SND src="sfx14/chuva.mp3" from={VIRA7B} dur={L(9) - VIRA7B} v={FXV * 0.15} />
      <SND src="sfx10/bubble.mp3" from={FRITA9} dur={L(10) - FRITA9} v={FXV * 0.25} />
      <SND src="sfx7/cash.mp3" from={COBRA11} dur={30} v={FXV * 0.35} />
      <SND src="sfx7/whoosh.mp3" from={VOANDO11} dur={30} v={FXV * 0.45} />
      <SND src="sfx7/confetti.mp3" from={PARABENS12} dur={50} v={FXV * 0.4} />
      <SND src="sfx9/yay.mp3" from={PARABENS12} dur={50} v={FXV * 0.3} />
      <SND src="sfx2/steps.mp3" from={L(13)} dur={SE13 - L(13)} v={FXV * 0.4} />
      <SND src="sfx11/drama.mp3" from={L(13)} dur={40} v={FXV * 0.3} />
      <SND src="sfx10/bubble.mp3" from={FRITAR13} dur={40} v={FXV * 0.4} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
