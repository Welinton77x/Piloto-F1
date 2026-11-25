import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame} from "@react-three/fiber";
import {Boy, Pose, Look} from "./Boy";
import {Room, Lights, WIN} from "./Room";
import {Flame, Embers, FireLight, Steam} from "./Fire";
import {Kitchen, PopcornPan, Bathroom, ShowerDrops, Classroom, Exterior, ExteriorLights, Grill, InteriorLights} from "./Sets";
import {Post} from "./Post";
import {physics} from "./Physics";
import {Cam, PalmFire, PalmSparks, FireHelix, TitleTag, Flash, fontFamily} from "./Video";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import W from "./timing90.json";

type V3 = [number, number, number];
type Wd = {w: string; s: number; e: number; line: number};
const words = W as Wd[];

/* ---------- linha do tempo: tudo amarrado nas palavras da narração ---------- */
const clean = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const F = (sec: number) => Math.round(sec * FPS);
const lineStart = (i: number) => F(words.find((w) => w.line === i)!.s);
/** quadro em que começa a n-ésima palavra da linha i que começa com `txt` */
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w).startsWith(clean(txt)));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
export const TOTAL90 = F(words[words.length - 1].e + 1.6);

/* ---------- utilidades de pose ---------- */
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const palmUp = (up: number, high = 0): Pose => ({
  rShoulder: [-0.5 * up - 0.25 * high, 0.2 * up, -0.08 - 0.04 * up],
  rElbow: lerp(-0.15, -1.75 - 0.4 * high, up),
  rWrist: [0.15 * up, 0, 0],
});
const kick = (f: number, a: number, len = 6) => (f < a ? 0 : Math.exp(-(f - a) / len));
const hop = (f: number, a: number, b: number, h: number) => {
  const x = (f - a) / (b - a);
  return x <= 0 || x >= 1 ? 0 : 4 * h * x * (1 - x);
};

/* figurantes */
const NPC: Record<string, Look> = {
  ana: {shirt: "#3a6ea5", coat: "#2f4f7f", scarf: "#e0a030", hair: "#2a1a10", hairStyle: "short", skin: "#c68a5a", pants: "#3a3a48"},
  leo: {shirt: "#e0c050", coat: "#7a2f5f", scarf: "#f0f0f0", hair: "#e0b050", hairStyle: "short", pants: "#40404a"},
  rafa: {shirt: "#3f9f6f", coat: "#3f6f3f", scarf: "#c33", hair: "#4a2a15", skin: "#8d5a3a", pants: "#2e3440"},
  prof: {shirt: "#6b4a7a", pants: "#5a4a3a", hairStyle: "bald", hair: "#d9d9d9", glasses: true, cap: "#2a5d9f", skin: "#e8b48a"},
  sombra: {shirt: "#26262e", coat: "#1c1c22", scarf: "#3a3a44", hair: "#111", hairStyle: "short", skin: "#b07a52", pants: "#1c1c22"},
};
const CAIO_SHORTS: Look = {shorts: true};
const shiver = (f: number, k = 1): Pose => ({
  rShoulder: [-0.75, 0, 0.42],
  lShoulder: [-0.75, 0, -0.42],
  rElbow: -1.8,
  lElbow: -1.8,
  torso: [0.05, 0, Math.sin(f * 2.6) * 0.025 * k],
  head: [0.08, 0, Math.sin(f * 2.6 + 1) * 0.04 * k],
  brow: 0.6,
  mouthOpen: 0.15 + 0.1 * Math.abs(Math.sin(f * 0.9)),
});

/** coloca filhos na posição (de mundo) da palma da mão */
const AtPalm: React.FC<{palm: React.RefObject<THREE.Object3D | null>; offset?: V3; children: React.ReactNode}> = ({palm, offset = [0, 0, 0], children}) => {
  const g = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.getWorldPosition(v);
    g.current.position.set(v.x + offset[0], v.y + offset[1], v.z + offset[2]);
  }, -1);
  return <group ref={g}>{children}</group>;
};

/* ---------- planos (cenas) ---------- */
type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

const Quarto: React.FC<{t: number; dim?: number; fuelGlow?: number}> = ({t, dim = 0, fuelGlow = 0}) => (
  <>
    <color attach="background" args={["#1a1210"]} />
    <Lights dim={dim} />
    <Room t={t} fuelGlow={fuelGlow} />
  </>
);

/* 0 — apresentação */
const S0: React.FC<ShotProps> = ({f, a, b, t}) => {
  const fogo = at(0, "fogo");
  const pose = physics("s0", (fr) => {
    const crouch = ramp(fr, fogo - 14, fogo - 2, easeInOut) * (1 - ramp(fr, fogo - 2, fogo + 3, easeOut));
    const k = ramp(fr, fogo - 2, fogo + 8, easeOut);
    const tt = fr / FPS;
    return idle(fr, {
      pos: [0, k * (0.07 + 0.02 * Math.sin(tt * 3.1)) - 0.05 * crouch, 0],
      squash: 0.12 * crouch - 0.06 * kick(fr, fogo, 5),
      torso: [0.12 * crouch - 0.05 * k, 0, 0],
      head: [0.15 * crouch - 0.08 * k, 0.12 * (1 - k), 0.05 * (1 - k)],
      brow: lerp(0, -0.7, Math.max(crouch, k)),
      smile: lerp(0.4, 0.9, k),
      glow: k,
      rShoulder: [-0.25 * crouch, 0, lerp(-0.08, -0.55, k) - 0.1 * crouch],
      lShoulder: [-0.25 * crouch, 0, lerp(0.08, 0.55, k) + 0.1 * crouch],
      rElbow: lerp(-0.15, -0.5, Math.max(k, crouch)),
      lElbow: lerp(-0.15, -0.5, Math.max(k, crouch)),
      rFist: Math.max(k, crouch),
      hairLift: ramp(fr, fogo, fogo + 14),
    });
  }, a, f);
  const helix = ramp(f, fogo, fogo + 14);
  const p = ramp(f, a, b, easeInOut);
  const sh = shake(f, 0.014 * helix + 0.02 * kick(f, fogo, 4));
  return (
    <>
      <Cam pos={[lerp(0.3, 0, p) + sh[0], 1.4 + sh[1], lerp(3.6, 2.8, p)]} look={[0, 1.15, 0]} fov={42} />
      <Quarto t={t} dim={0.25 * helix} />
      <Boy pose={pose} />
      <FireHelix t={t} power={helix} center={[0, 0, 0]} />
    </>
  );
};

/* 1 — acorda com o travesseiro quente */
const S1: React.FC<ShotProps> = ({f, a, b, t}) => {
  const wake = at(1, "sozinho");
  const pose = idle(f, {
    blink: 1 - ramp(f, wake, wake + 5),
    smile: lerp(0.2, 0.9, ramp(f, wake + 3, wake + 12)),
    head: [0, 0.25 * ramp(f, wake + 4, wake + 16, easeOut), 0],
    pupil: [0.4, 0.3],
    rShoulder: [0, 0, -0.1],
    lShoulder: [0, 0, 0.1],
  });
  const p = ramp(f, a, b, easeInOut);
  const pulse = 0.75 + 0.25 * Math.sin(t * 5);
  return (
    <>
      <Cam pos={[lerp(-0.9, -1.1, p), lerp(2.15, 1.95, p), lerp(-0.55, -0.75, p)]} look={[-2.05, 0.7, -1.75]} fov={40} />
      <Quarto t={t} dim={0.35} />
      <group position={[-2.05, 0.66, -0.38]} rotation={[-Math.PI / 2, 0, 0]}>
        <Boy pose={pose} />
      </group>
      <pointLight position={[-2.05, 0.62, -2.0]} color="#ff6a1a" intensity={2.4 * pulse} distance={1.4} decay={1.6} />
      <Steam t={t} origin={[-2.05, 0.62, -2.3]} count={14} spread={0.18} rise={0.9} size={0.22} power={0.45} seed={4} />
    </>
  );
};

/* close na mão: estalo + acende (usado na linha 2) */
const handShot = (key: string, snap: number | null, ignite: number, opts: {heat?: number; size?: number; wince?: number} = {}) => {
  const C: React.FC<ShotProps> = ({f, a, b, t}) => {
    const palm = useRef<THREE.Object3D>(null);
    const pose = physics(key, (fr) => {
      const up = ramp(fr, a - 4, a + 10, easeOut);
      const fist = snap === null ? 0 : ramp(fr, snap - 10, snap - 3) * (1 - ramp(fr, snap, snap + 2));
      const snapK = snap === null ? 0 : kick(fr, snap, 3);
      const ign = kick(fr, ignite, 5);
      const lit = ramp(fr, ignite, ignite + 8);
      const w = opts.wince ? ramp(fr, opts.wince, opts.wince + 8) : 0;
      return idle(fr, {
        ...palmUp(up),
        pos: [0, -0.015 * ign, 0],
        squash: 0.05 * ign,
        rElbow: lerp(-0.15, -1.75, up) + 0.15 * (fist - snapK) + 0.45 * ign,
        rWrist: [0.15 * up - 0.7 * snapK + 0.3 * fist, 0, -0.45 * snapK],
        rShoulder: [lerp(0, -0.5, up) + 0.25 * ign, 0.2 * up, lerp(-0.08, -0.12, up)],
        rFist: fist,
        head: [0.22 - 0.12 * ign + 0.08 * w, -0.32, 0.04 * ign],
        pupil: [-0.6, -0.5],
        brow: lerp(lerp(-0.3, 0.6, lit), -0.8, w),
        eyeWide: 0.7 * lit * (1 - w),
        smile: lerp(lerp(0.6, 1, lit), 0, w),
        mouthOpen: lerp(0.4 * lit * (1 - ramp(fr, ignite + 18, ignite + 28)), 0.35, w),
        glow: 0.3 * lit,
        heat: (opts.heat ?? 0) * (opts.wince ? ramp(fr, opts.wince, opts.wince + 20) : 0),
      });
    }, a, f);
    const p = ramp(f, a, b, easeInOut);
    const sh = shake(f, (snap === null ? 0 : 0.006 * kick(f, snap, 3)) + 0.012 * kick(f, ignite, 5));
    return (
      <>
        <Cam pos={[lerp(-1.05, -0.85, p) + sh[0], lerp(1.3, 1.28, p) + sh[1], lerp(1.75, 1.45, p)]} look={[-0.22, 1.3, 0.2]} fov={34} />
        <Quarto t={t} dim={0.35 * ramp(f, ignite, ignite + 8)} />
        <Boy pose={pose} palmRef={palm} />
        <PalmFire palm={palm} t={t} power={pop(f, ignite, 14)} size={opts.size ?? 1} />
        {snap !== null && <PalmSparks palm={palm} t={t} at={snap / FPS} />}
      </>
    );
  };
  return C;
};

/* 3 — inverno: de bermuda soltando vapor, turma tremendo */
const S3: React.FC<ShotProps> = ({f, a, b, t}) => {
  const lt = (f - a) / FPS;
  const x = -1.6 + lt * 0.75;
  const ph = lt * Math.PI * 2 * 1.5;
  const pose = idle(f, {
    pos: [x, 0.12 + Math.abs(Math.sin(ph)) * 0.025, -0.4],
    rotY: Math.PI / 2 - 0.25,
    walk: ph,
    walkAmt: 1,
    rShoulder: [Math.sin(ph) * 0.35, 0, -0.1],
    lShoulder: [-Math.sin(ph) * 0.35, 0, 0.1],
    rElbow: -0.35,
    lElbow: -0.35,
    smile: 0.9,
    head: [0, -0.35, 0],
    pupil: [0.5, 0],
  });
  const npcs: {look: Look; pos: V3; ry: number; seed: number}[] = [
    {look: NPC.ana, pos: [-1.0, 0.12, -1.9], ry: 0.3, seed: 1},
    {look: NPC.leo, pos: [0.4, 0.12, -2.1], ry: -0.2, seed: 2},
    {look: NPC.rafa, pos: [1.8, 0.12, -1.8], ry: -0.5, seed: 3},
  ];
  return (
    <>
      <Cam pos={[x + 0.35, 1.3, 2.3]} look={[x + 0.15, 1.05, -0.8]} fov={44} />
      <color attach="background" args={["#c9d6e3"]} />
      <fog attach="fog" args={["#d5dde6", 6, 22]} />
      <ExteriorLights variant="winter" />
      <Exterior variant="winter" kind="school" />
      <Boy pose={pose} look={CAIO_SHORTS} />
      <Steam t={t} origin={[x, 1.0, -0.4]} count={26} spread={0.25} rise={1.5} size={0.35} power={0.8} seed={8} />
      {npcs.map((n, i) => (
        <group key={i}>
          <Boy pose={idle(f + i * 30, {...shiver(f + i * 7), pos: n.pos, rotY: n.ry, pupil: [-0.6, 0]})} look={n.look} />
          <Steam t={t + i} origin={[n.pos[0] + Math.sin(n.ry) * 0.3, 1.5, n.pos[2] + Math.cos(n.ry) * 0.3]} count={6} spread={0.04} rise={0.35} size={0.12} power={0.5 + 0.5 * Math.sin(t * 2 + i)} seed={20 + i} life={1} />
        </group>
      ))}
    </>
  );
};

/* 4 — pipoca na panela em cima da mão */
const S4: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const hold = at(4, "segura");
  const pose = physics("s4", (fr) =>
    idle(fr, {
      pos: [0.3, 0, -1.3],
      ...palmUp(ramp(fr, a, a + 8, easeOut)),
      head: [0.25, -0.2, 0],
      pupil: [-0.4, -0.6],
      smile: 0.8,
      eyeWide: 0.4 * ramp(fr, hold + 20, hold + 30),
      mouthOpen: 0.3 * ramp(fr, hold + 20, hold + 30),
    }), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(1.05, 0.9, p), 1.4, lerp(-0.05, -0.25, p)]} look={[0.15, 1.3, -1.15]} fov={42} />
      <color attach="background" args={["#222"]} />
      <InteriorLights color="#fff1dc" />
      <Kitchen />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={0.85} size={0.8} />
      <AtPalm palm={palm} offset={[0, 0.11, 0]}>
        <PopcornPan t={Math.max(0, (f - hold) / FPS)} heat={1} />
      </AtPalm>
    </>
  );
};

/* 5 — banho: a água vira vapor antes de encostar */
const S5: React.FC<ShotProps> = ({f, a, b, t}) => {
  const pose = physics("s5", (fr) =>
    idle(fr, {
      pos: [0, 0, -1.5],
      blink: 1,
      smile: 1,
      head: [-0.22, 0.1 * Math.sin(fr / 12), 0.05],
      rShoulder: [-0.3, 0, -2.4],
      lShoulder: [-0.3, 0, 2.4],
      rElbow: -1.9,
      lElbow: -1.9,
    }), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[0.35, 1.6, lerp(0.7, 0.45, p)]} look={[0, 1.55, -1.5]} fov={42} />
      <color attach="background" args={["#223"]} />
      <InteriorLights color="#eaf6ff" />
      <Bathroom />
      <Boy pose={pose} />
      <ShowerDrops t={t} origin={[0, 2.2, -1.6]} evap={1} />
      <Steam t={t} origin={[0, 1.95, -1.65]} count={26} spread={0.45} rise={0.9} size={0.6} power={0.5} seed={11} life={2.5} />
      <Steam t={t + 1} origin={[0, 0.4, -1.4]} count={14} spread={0.9} rise={1.8} size={0.9} power={0.35} seed={12} life={3} />
    </>
  );
};

/* 6 — o triângulo do fogo (olha para a chama) */
const S6: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("s6", (fr) => idle(fr, {...palmUp(1), head: [0.18, -0.28, 0], pupil: [-0.6, -0.4], brow: 0.2, smile: 0.3}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.7, 0.4, p), 1.5, lerp(1.7, 1.4, p)]} look={[-0.15, 1.35, 0.2]} fov={38} />
      <Quarto t={t} dim={0.45} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={1} />
    </>
  );
};

/* 7 — tudo em volta é combustível (câmera gira pelo quarto) */
const S7: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const comb = at(7, "combust");
  const pose = physics("s7", (fr) => idle(fr, {...palmUp(1), head: [0.05, lerp(0.3, -0.4, ramp(fr, comb, b, easeInOut)), 0], pupil: [0, 0], heat: 0.4 * (1 - ramp(fr, comb - 5, comb + 5))}), a, f);
  const ang = lerp(0.5, -0.5, ramp(f, a, b, easeInOut));
  return (
    <>
      <Cam pos={[Math.sin(ang) * 3.2, 1.9, Math.cos(ang) * 3.2]} look={[0, 1.1, -0.6]} fov={50} />
      <Quarto t={t} dim={0.3} fuelGlow={ramp(f, comb, comb + 10)} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={0.9} />
    </>
  );
};

/* 8 — camiseta 400 °C × chama 1000 °C */
const S8: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const mil = at(8, "mil");
  const pose = physics("s8", (fr) => idle(fr, {...palmUp(1, 0.2), head: [0.3, -0.2, 0], pupil: [-0.3, -0.8], brow: 0.5, eyeWide: 0.6 * ramp(fr, mil, mil + 8)}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.35, 0.2, p), 1.3, lerp(1.35, 1.15, p)]} look={[-0.15, 1.28, 0.1]} fov={40} />
      <Quarto t={t} dim={0.45} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={lerp(1, 1.5, ramp(f, mil, mil + 10))} />
    </>
  );
};

/* sala de aula: alunos sentados */
const Students: React.FC<{f: number; skip?: number}> = ({f}) => {
  const list: {look: Look; pos: V3}[] = [
    {look: {...NPC.ana, coat: undefined}, pos: [-1.6, -0.33, 0.05]},
    {look: {...NPC.leo, coat: undefined}, pos: [1.6, -0.33, 0.05]},
    {look: {...NPC.rafa, coat: undefined}, pos: [-1.6, -0.33, -1.25]},
    {look: {shirt: "#e07b39", hair: "#6a3a1a", hairStyle: "short"}, pos: [1.6, -0.33, -1.25]},
    {look: {shirt: "#5a7fd0", hair: "#1a1a1a", hairStyle: "short", skin: "#a36a45"}, pos: [0, -0.33, 1.35]},
  ];
  return (
    <>
      {list.map((s, i) => (
        <Boy key={i} pose={idle(f + i * 23, {pos: s.pos, rotY: Math.PI, legLift: 1.3, rShoulder: [-0.7, 0, -0.1], lShoulder: [-0.7, 0, 0.1], rElbow: -0.9, lElbow: -0.9, head: [0.3, 0, 0]})} look={s.look} />
      ))}
    </>
  );
};
const SalaBase: React.FC = () => (
  <>
    <color attach="background" args={["#1a1714"]} />
    <InteriorLights color="#fff0da" key1={[-3, 3, 1]} />
    <Classroom />
  </>
);

/* 9a — encosta no caderno */
const S9a: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const lenha = at(9, "lenha", 0);
  const pose = physics("s9a", (fr) => {
    const reach = ramp(fr, a, lenha - 4, easeInOut);
    const jerk = ramp(fr, lenha, lenha + 5, easeOut);
    return idle(fr, {
      pos: [0, -0.33, 0.15],
      rotY: Math.PI,
      legLift: 1.3,
      rShoulder: [lerp(-0.4, -0.85, reach) + 0.6 * jerk, 0, -0.05],
      rElbow: lerp(-1.3, -0.5, reach) - 1.0 * jerk,
      rWrist: [0.3, lerp(0, Math.PI, reach), 0],
      lShoulder: [-0.6, 0, 0.1],
      lElbow: -0.9,
      head: [lerp(0.35, 0.05, jerk), 0, 0],
      pupil: [0, -0.8],
      eyeWide: jerk,
      brow: jerk,
      mouthOpen: 0.6 * jerk,
    });
  }, a, f);
  const fire = pop(f, lenha, 10);
  return (
    <>
      <Cam pos={[0.75, 1.35, -1.35]} look={[0, 0.9, -0.15]} fov={42} />
      <SalaBase />
      <Students f={f} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={0.6} size={0.6} />
      {fire > 0 && (
        <group position={[0.05, 0.76, -0.27]}>
          <Flame t={t} power={fire} height={0.45} width={0.36} seed={2} />
          <Embers t={t} count={30} spread={0.1} rise={0.8} size={0.025} power={fire} seed={3} />
          <FireLight t={t} power={fire} position={[0, 0.3, 0]} intensity={4} distance={3} />
        </group>
      )}
    </>
  );
};

/* 9b — travesseiro */
const S9b: React.FC<ShotProps> = ({f, t}) => {
  const lenha = at(9, "lenha", 1);
  const fire = pop(f, lenha, 10);
  return (
    <>
      <Cam pos={[-1.45, 1.25, -1.3]} look={[-2.05, 0.6, -2.0]} fov={40} />
      <Quarto t={t} dim={0.4} />
      {fire > 0 && (
        <group position={[-2.05, 0.6, -2.0]}>
          <Flame t={t} power={fire} height={0.6} width={0.6} seed={5} />
          <Flame t={t + 2} power={fire} position={[0.18, 0, 0.05]} height={0.45} width={0.35} seed={6} />
          <Embers t={t} count={40} spread={0.2} rise={1.0} size={0.03} power={fire} seed={7} />
          <FireLight t={t} power={fire} position={[0, 0.3, 0.3]} intensity={5} distance={3} />
        </group>
      )}
    </>
  );
};

/* 9c — boné do professor */
const S9c: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const lenha = at(9, "lenha", 2);
  const tap = lenha - 14;
  const caio = physics("s9c", (fr) => {
    const r = ramp(fr, a + 4, tap, easeInOut) * (1 - ramp(fr, tap + 8, tap + 18, easeInOut));
    return idle(fr, {pos: [1.6, 0, -2.95], rotY: -Math.PI / 2, rShoulder: [lerp(-0.3, -2.45, r), 0, -0.1], rElbow: lerp(-0.6, -0.25, r), rWrist: [0, Math.PI * r, 0], head: [-0.15, 0, 0], smile: 0.9, pupil: [0, 0.5]});
  }, a, f);
  const shock = ramp(f, lenha, lenha + 5, easeOut);
  const prof = physics("s9c_prof", (fr) => {
    const s = ramp(fr, lenha, lenha + 5, easeOut);
    return idle(fr, {
      pos: [1.0, hop(fr, lenha + 1, lenha + 12, 0.12), -3.25],
      rotY: 0.25,
      mouthOpen: s > 0 ? 0.9 * s : 0.25 * Math.abs(Math.sin(fr / 3)),
      eyeWide: s,
      brow: s,
      rShoulder: [lerp(-0.3, -0.5, s), 0, lerp(-0.1, -2.6, s)],
      lShoulder: [lerp(-0.3, -0.5, s), 0, lerp(0.1, 2.6, s)],
      rElbow: lerp(-1.2, -0.6, s),
      lElbow: lerp(-1.2, -0.6, s),
    });
  }, a, f);
  const fire = pop(f, lenha, 10);
  return (
    <>
      <Cam pos={[1.15 + shake(f, 0.02 * kick(f, lenha, 8))[0], 1.6, -1.35]} look={[1.15, 1.55, -3.1]} fov={42} />
      <SalaBase />
      <Boy pose={prof} look={NPC.prof} />
      <Boy pose={caio} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={0.5} size={0.5} />
      {fire > 0 && (
        <group position={[1.0 + (prof.pos?.[0] ?? 1) - 1, 1.95 + (prof.pos?.[1] ?? 0), -3.25]}>
          <Flame t={t} power={fire} height={0.5} width={0.42} seed={9} />
          <Embers t={t} count={30} spread={0.12} rise={0.9} size={0.025} power={fire} seed={10} />
          <FireLight t={t} power={fire} position={[0, 0.2, 0.3]} intensity={4} distance={3} />
        </group>
      )}
      {shock > 0 && <Steam t={t} origin={[1.0, 2.1, -3.25]} count={10} spread={0.1} rise={0.8} size={0.25} power={0.4 * shock} color="#555" seed={14} />}
    </>
  );
};

/* 10 — a chama suga o oxigênio perto do rosto */
const S10: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("s10", (fr) => idle(fr, {...palmUp(1, 0.4), head: [0.1, -0.2, 0], pupil: [-0.5, -0.3], brow: 0.4, mouthOpen: 0.15}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.35, 0.25, p), 1.5, lerp(1.15, 0.95, p)]} look={[-0.12, 1.42, 0]} fov={38} />
      <Quarto t={t} dim={0.5} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={1.1} />
    </>
  );
};

/* 11 — sala fechada: boceja, fica tonto, quase apaga na prova */
const S11: React.FC<ShotProps> = ({f, a, b, t}) => {
  const boc = at(11, "boceja");
  const ton = at(11, "tonto");
  const apa = at(11, "apaga");
  const pose = physics("s11", (fr) => {
    const yawn = ramp(fr, boc - 2, boc + 6) * (1 - ramp(fr, ton - 6, ton));
    const dizzy = ramp(fr, ton, ton + 10);
    const drop = ramp(fr, apa, apa + 10, easeInOut);
    return idle(fr, {
      pos: [0, -0.33, 0.15],
      rotY: Math.PI,
      legLift: 1.3,
      rShoulder: [-0.75 + 0.3 * yawn, 0, -0.1 - 0.4 * yawn],
      lShoulder: [-0.75 + 0.3 * yawn, 0, 0.1 + 0.4 * yawn],
      rElbow: -0.9 - 0.8 * yawn,
      lElbow: -0.9 - 0.8 * yawn,
      torso: [0.55 * drop, 0, Math.sin(fr / 6) * 0.06 * dizzy * (1 - drop)],
      head: [lerp(0.2 - 0.3 * yawn, 0.6, drop), Math.sin(fr / 5) * 0.15 * dizzy * (1 - drop), Math.sin(fr / 7) * 0.12 * dizzy],
      mouthOpen: yawn * 1.0,
      blink: Math.max(blinkCurve(fr), yawn * 0.8, 0.4 * dizzy, drop),
      pupil: [Math.sin(fr / 4) * dizzy, Math.cos(fr / 4) * dizzy],
      brow: 0.4 * yawn - 0.3 * dizzy,
    });
  }, a, f);
  return (
    <>
      <Cam pos={[0.1, 1.35, -1.25]} look={[0, 1.0, 0.1]} fov={44} />
      <SalaBase />
      <Students f={f} />
      <Boy pose={pose} />
    </>
  );
};

/* 13 — controle: respira e a chama diminui */
const S13: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const k = ramp(f, a, b, easeInOut);
  const pose = physics("s13", (fr) => idle(fr, {...palmUp(1), blink: 1, smile: 0.4, head: [0.1, -0.15, 0], breathe: Math.sin((fr / FPS) * 1.6) * 2}), a, f);
  return (
    <>
      <Cam pos={[0.1, 1.45, lerp(2.0, 1.6, k)]} look={[-0.05, 1.3, 0]} fov={40} />
      <Quarto t={t} dim={0.4} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={lerp(1.3, 0.35, k)} />
    </>
  );
};

/* 14 — chama pequena · ponta do dedo · longe do rosto · janela aberta */
const S14: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const longe = at(14, "longe");
  const jan = at(14, "janela");
  const pose = physics("s14", (fr) => {
    const away = ramp(fr, longe, longe + 10, easeOut);
    const turn = ramp(fr, jan - 4, jan + 10, easeInOut);
    return idle(fr, {
      ...palmUp(1),
      rShoulder: [-0.5, lerp(0.2, -0.3, away), lerp(-0.12, -1.25, away)],
      rElbow: lerp(-1.75, -0.35, away),
      rWrist: [0.15, 0, 0],
      rotY: lerp(0, -2.6, turn),
      head: [0.05, -0.3 * (1 - away), 0],
      smile: 0.8,
      pupil: [-0.5 * (1 - away), -0.3],
    });
  }, a, f);
  const turn = ramp(f, jan - 4, jan + 12, easeInOut);
  const camPos: V3 = [lerp(-0.7, 1.6, turn), lerp(1.45, 1.7, turn), lerp(1.4, 1.2, turn)];
  const look: V3 = [lerp(-0.2, WIN.x, turn), lerp(1.35, 1.75, turn), lerp(0.2, -2.5, turn)];
  return (
    <>
      <Cam pos={camPos} look={look} fov={40} />
      <Quarto t={t} dim={0.25 - 0.25 * turn} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={0.32} />
    </>
  );
};

/* 15 — churrasco */
const S15: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const ch = at(15, "churrasco");
  const light = at(15, "cara");
  const pose = physics("s15", (fr) =>
    idle(fr, {
      pos: [-0.85, 0, -0.75],
      rotY: 0.75,
      rShoulder: [lerp(-0.2, -1.3, ramp(fr, a + 4, light, easeOut)), 0, -0.1],
      rElbow: -0.3,
      smile: 1,
      head: [0.05, 0, 0],
    }), a, f);
  const fire = pop(f, light, 12);
  const friends: {look: Look; pos: V3; ry: number}[] = [
    {look: {...NPC.ana, coat: undefined}, pos: [0.95, 0, -0.55], ry: -1.0},
    {look: {...NPC.leo, coat: undefined}, pos: [1.45, 0, -1.7], ry: -1.4},
    {look: {...NPC.rafa, coat: undefined}, pos: [0.9, 0, -2.6], ry: -0.4},
  ];
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-0.1, -0.3, p), 1.5, lerp(2.2, 1.9, p)]} look={[-0.35, 1.05, -1.0]} fov={48} />
      <color attach="background" args={["#a8d6ff"]} />
      <ExteriorLights variant="sunny" />
      <Exterior variant="sunny" kind="yard" />
      <group position={[0, 0, -1.25]}>
        <Grill t={t} />
        <group position={[0, 1.0, 0]}>
          <Flame t={t} power={fire} height={0.5} width={0.9} seed={3} />
          <Steam t={t} origin={[0, 0.3, 0]} count={14} spread={0.3} rise={1.6} size={0.5} power={0.45} color="#d8d8d8" seed={30} life={2.5} />
          <FireLight t={t} power={fire} position={[0, 0.4, 0.4]} intensity={3} distance={3} />
        </group>
      </group>
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1 - ramp(f, light + 10, light + 20)} size={0.4} />
      {friends.map((fr, i) => {
        const go = f >= ch - 6;
        const ph = (f - ch + i * 4) / 9;
        return (
          <Boy
            key={i}
            pose={idle(f + i * 11, {
              pos: [fr.pos[0], go ? Math.abs(Math.sin(ph)) * 0.18 : 0, fr.pos[2]],
              rotY: fr.ry,
              rShoulder: go ? [0, 0, -2.6] : [0, 0, -0.1],
              lShoulder: go ? [0, 0, 2.6] : [0, 0, 0.1],
              rElbow: go ? -0.3 : -0.2,
              lElbow: go ? -0.3 : -0.2,
              mouthOpen: go ? 0.8 : 0,
              smile: 1,
              eyeWide: go ? 0.5 : 0,
            })}
            look={fr.look}
          />
        );
      })}
    </>
  );
};

/* 16a — saída do colégio ao entardecer, mão faiscando */
const S16a: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const lt = (f - a) / FPS;
  const ph = lt * Math.PI * 2 * 1.4;
  const z = -3.3 + lt * 0.7;
  const pose = idle(f, {
    pos: [0, 0.12 * clamp((z + 1.5) * 4) + Math.abs(Math.sin(ph)) * 0.02, z],
    walk: ph,
    walkAmt: 1,
    rShoulder: [Math.sin(ph) * 0.3, 0, -0.1],
    lShoulder: [-Math.sin(ph) * 0.3, 0, 0.1],
    rElbow: -0.4,
    head: [0.1, 0, 0],
    smile: 0.3,
  });
  const flick = 0.5 + 0.5 * Math.max(0, Math.sin(t * 9) * Math.sin(t * 4.3));
  return (
    <>
      <Cam pos={[0.55, 1.35, 1.0]} look={[0, 1.15, z - 0.5]} fov={42} />
      <color attach="background" args={["#2b2350"]} />
      <ExteriorLights variant="dusk" />
      <Exterior variant="dusk" kind="school" />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={flick} size={0.5} />
    </>
  );
};

/* 16b — alguém viu */
const S16b: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  const see = ramp(f, a + 4, a + 12, easeOut);
  const pose = idle(f, {pos: [-2.6, 0.12, -3.3], rotY: 1.2, eyeWide: see, brow: see, mouthOpen: 0.5 * see, pupil: [0.7, 0], head: [0, 0.25, 0], lShoulder: [-1.4 * see, 0, 0.3], lElbow: -2.0 * see});
  return (
    <>
      <Cam pos={[lerp(-1.2, -1.45, p), 1.55, lerp(-1.7, -2.0, p)]} look={[-2.55, 1.5, -3.3]} fov={36} />
      <color attach="background" args={["#2b2350"]} />
      <ExteriorLights variant="dusk" />
      <Exterior variant="dusk" kind="school" />
      <Boy pose={pose} look={NPC.sombra} />
      <pointLight position={[-1.9, 1.5, -2.6]} color="#ff7a2a" intensity={1.5 + 0.8 * Math.sin(t * 9)} distance={2.5} />
    </>
  );
};

/* 17 — final: olha para a câmera */
const S17: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("s17", (fr) => idle(fr, {...palmUp(1, 0.6), head: [0.02, 0.05, 0], pupil: [0, 0], smile: 0.5, brow: -0.3, glow: 0.35}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[0.15, 1.5, lerp(1.9, 1.35, p)]} look={[0, 1.45, 0]} fov={40} />
      <Quarto t={t} dim={0.75} />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={0.8} />
    </>
  );
};

const L = lineStart;
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: L(1) - 3, Comp: S1},
  {from: L(2) - 3, Comp: handShot("s2", at(2, "dedos") + 8, at(2, "acende"))},
  {from: L(3) - 3, Comp: S3},
  {from: L(4) - 3, Comp: S4},
  {from: L(5) - 3, Comp: S5},
  {from: L(6) - 3, Comp: S6},
  {from: L(7) - 3, Comp: S7},
  {from: L(8) - 3, Comp: S8},
  {from: L(9) - 3, Comp: S9a},
  {from: at(9, "no", 1) - 2, Comp: S9b},
  {from: at(9, "no", 2) - 2, Comp: S9c},
  {from: L(10) - 3, Comp: S10},
  {from: L(11) - 3, Comp: S11},
  {from: L(12) - 3, Comp: handShot("s12", null, L(12) + 2, {heat: 1, size: 1.1, wince: at(12, "queimar")})},
  {from: L(13) - 3, Comp: S13},
  {from: L(14) - 3, Comp: S14},
  {from: L(15) - 3, Comp: S15},
  {from: L(16) - 3, Comp: S16a},
  {from: at(16, "alguem") - 2, Comp: S16b},
  {from: L(17) - 3, Comp: S17},
];
const shotIndex = (f: number) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  return i;
};

const Scene: React.FC<{f: number}> = ({f}) => {
  if (f >= SPLIT1) return <color attach="background" args={["#0b1a30"]} />;
  const i = shotIndex(f);
  const s = SHOTS[i];
  const b = SHOTS[i + 1]?.from ?? TOTAL90;
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={b} t={f / FPS} />
      <Post />
    </>
  );
};


/* ---------- final em tela dividida: A em cima, B embaixo (as duas escolhas) ---------- */
const SPLIT1 = at(17, "caio") - 6;

/* Q1-A: conta pra turma — mostra a mão em chamas na frente da sala */
const P1A: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("p1a", (fr) => idle(fr, {pos: [0, 0, -2.6], ...palmUp(ramp(fr, a, a + 10, easeOut), 1), smile: 1, brow: 0.3, head: [-0.05, 0, 0], pupil: [0, 0]}), a, f);
  const wow = ramp(f, a + 10, a + 20, easeOut);
  const kids: {look: Look; pos: V3}[] = [
    {look: {...NPC.ana, coat: undefined}, pos: [-1.1, 0, -1.1]},
    {look: {...NPC.leo, coat: undefined}, pos: [1.1, 0, -1.0]},
    {look: {...NPC.rafa, coat: undefined}, pos: [-0.45, 0, -0.2]},
  ];
  return (
    <>
      <Cam pos={[0.2, 2.3, 1.2]} look={[0, 1.25, -2.6]} fov={36} />
      <SalaBase />
      <Boy pose={pose} palmRef={palm} />
      <PalmFire palm={palm} t={t} power={1} size={1} />
      {kids.map((k, i) => (
        <Boy key={i} look={k.look} pose={idle(f + i * 9, {pos: [k.pos[0], Math.abs(Math.sin((f + i * 5) / 7)) * 0.08 * wow, k.pos[2]], rotY: Math.PI + (k.pos[0] > 0 ? 0.3 : -0.3), rShoulder: [0, 0, -2.5 * wow], lShoulder: [0, 0, 2.5 * wow], rElbow: -0.3, lElbow: -0.3, mouthOpen: 0.8 * wow, eyeWide: wow})} />
      ))}
    </>
  );
};

/* Q1-B: esconde — mão atrás das costas soltando fumaça, sorriso nervoso */
const P1B: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("p1b", (fr) => idle(fr, {rShoulder: [0.7, 0, -0.2], rElbow: -0.9, lShoulder: [0.6, 0, 0.2], lElbow: -0.9, smile: 0.6, brow: 0.8, eyeWide: 0.4, pupil: [Math.sin(fr / 9) * 0.8, 0], head: [0, Math.sin(fr / 18) * 0.15, 0.05]}), a, f);
  return (
    <>
      <Cam pos={[0.9, 1.45, 2.2]} look={[0, 1.2, 0]} fov={36} />
      <Quarto t={t} dim={0.55} />
      <Boy pose={pose} />
      <Steam t={t} origin={[-0.05, 0.9, -0.35]} count={16} spread={0.12} rise={1.3} size={0.3} power={0.6} color="#9a9a9a" seed={41} />
      <Embers t={t} origin={[-0.05, 0.85, -0.3]} count={14} spread={0.08} rise={0.8} size={0.02} power={0.8} seed={42} />
      <pointLight position={[0, 0.9, -0.5]} color="#ff6a1a" intensity={1.6} distance={1.5} />
    </>
  );
};

const PanelScene: React.FC<{C: React.FC<ShotProps>; a: number}> = ({C, a}) => {
  const f = useCurrentFrame();
  return (
    <>
      <C f={f} a={a} b={TOTAL90} t={f / FPS} />
      <Post />
    </>
  );
};

const Panel: React.FC<{top: number; letter: string; label: string; active: boolean; C: React.FC<ShotProps>; a: number}> = ({top, letter, label, active, C, a}) => {
  const f = useCurrentFrame();
  const glow = active ? 1 : 0;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 20,
        width: 1040,
        height: 720,
        borderRadius: 26,
        overflow: "hidden",
        border: `7px solid ${active ? "#ffd21f" : "rgba(160,190,230,0.55)"}`,
        boxShadow: active ? "0 0 38px rgba(255,210,31,0.75)" : "0 0 18px rgba(0,0,0,0.5)",
        transform: `scale(${(1 + 0.015 * glow) * Math.min(1, pop(f, a, 10))})`,
      }}
    >
      <ThreeCanvas width={1026} height={706} shadows gl={{antialias: false}} dpr={1}>
        <PanelScene C={C} a={a} />
      </ThreeCanvas>
      {!active && <AbsoluteFill style={{background: "rgba(10,20,40,0.35)"}} />}
      <div style={{position: "absolute", top: 22, left: 22, width: 104, height: 104, borderRadius: 52, background: "#0d1b33", border: `6px solid ${active ? "#ffd21f" : "#9fb8dc"}`, color: active ? "#ffd21f" : "#fff", fontFamily, fontWeight: 900, fontSize: 66, display: "flex", alignItems: "center", justifyContent: "center"}}>
        {letter}
      </div>
      <div style={{position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 56, color: "#fff", WebkitTextStroke: "8px #0d1b33", paintOrder: "stroke fill", textTransform: "uppercase"}}>{label}</div>
    </div>
  );
};

const Split: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SPLIT1) return null;
  const both = f >= at(17, "comenta");
  const aOn = both || (f >= at(17, "conta") && f < at(17, "ou") + 2);
  const bOn = both || f >= at(17, "esconde");
  return (
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, #17375f 0%, #0b1a30 70%)"}}>
      <Panel top={150} letter="A" label="Conta pra turma" active={aOn} C={P1A} a={SPLIT1} />
      <Panel top={1050} letter="B" label="Esconde de todos" active={bOn} C={P1B} a={SPLIT1 + 4} />
    </AbsoluteFill>
  );
};

/* ---------- sobreposições 2D ---------- */
const KEY = new Set(["fogo", "acende", "inverno", "bah", "pipoca", "gelado", "calor", "combustivel", "oxigenio", "quatrocentos", "mil", "lenha", "quarenta", "quatro", "controle", "churrasco", "segredo", "foge", "enfrenta", "comenta"]);

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const chunks = useMemo(() => {
    const out: Wd[][] = [];
    let cur: Wd[] = [];
    for (const w of words) {
      const len = cur.map((x) => x.w).join(" ").length + w.w.length;
      if (cur.length && (len > 15 || w.line !== cur[0].line)) {
        out.push(cur);
        cur = [];
      }
      cur.push(w);
      if (/[.:…?,]$/.test(w.w) && cur.length >= 1) {
        out.push(cur);
        cur = [];
      }
    }
    if (cur.length) out.push(cur);
    return out;
  }, []);
  const t = f / FPS;
  const i = chunks.findIndex((c, k) => t >= c[0].s - 0.05 && t < (chunks[k + 1]?.[0].s ?? c[c.length - 1].e + 0.8) - 0.05);
  if (i < 0 || f >= at(17, "comenta")) return null;
  const c = chunks[i];
  const sc = pop(f, Math.round(c[0].s * FPS) - 2, 8);
  return (
    <div
      style={{
        position: "absolute",
        top: f >= SPLIT1 ? 905 : 1250,
        left: 50,
        right: 50,
        textAlign: "center",
        fontFamily,
        fontWeight: 900,
        fontSize: 84,
        lineHeight: 1.05,
        textTransform: "uppercase",
        color: "#fff",
        WebkitTextStroke: "10px #120c08",
        paintOrder: "stroke fill",
        textShadow: "0 8px 18px rgba(0,0,0,0.55)",
        transform: `scale(${0.85 + 0.15 * sc})`,
      }}
    >
      {c.map((w, k) => (
        <span key={k} style={{color: KEY.has(clean(w.w)) ? "#FFB31A" : "#FFFFFF"}}>
          {w.w.replace(/\.\.\.$/, "…")}
          {k < c.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

const Chip: React.FC<{from: number; to: number; text: string; bg: string; top?: number}> = ({from, to, text, bg, top = 230}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10);
  const o = 1 - ramp(f, to - 6, to);
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: o}}>
      <div style={{transform: `scale(${s}) rotate(-3deg)`, background: bg, color: "#fff", fontFamily, fontWeight: 900, fontSize: 70, padding: "12px 44px", borderRadius: 18, border: "5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 0 rgba(0,0,0,0.3)", WebkitTextStroke: "4px rgba(0,0,0,0.45)", paintOrder: "stroke fill"}}>
        {text}
      </div>
    </div>
  );
};

/** Triângulo do fogo montando vértice por vértice */
const Triangle: React.FC<{from: number; to: number; k1: number; k2: number; k3: number}> = ({from, to, k1, k2, k3}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = 1 - ramp(f, to - 6, to);
  const v = [pop(f, k1, 10), pop(f, k2, 10), pop(f, k3, 10)];
  const P = [
    [540, 260],
    [300, 690],
    [780, 690],
  ];
  const lab = ["CALOR", "COMBUSTÍVEL", "OXIGÊNIO"];
  const col = ["#ff5a1f", "#c98a2a", "#3aa0ff"];
  return (
    <svg width={1080} height={1920} style={{position: "absolute", top: 0, left: 0, opacity: o}}>
      {[0, 1, 2].map((i) => {
        const p0 = P[i], p1 = P[(i + 1) % 3];
        const k = ramp(f, [k2, k3, k3 + 8][i], [k2, k3, k3 + 8][i] + 10);
        if (k <= 0) return null;
        return <line key={i} x1={p0[0]} y1={p0[1]} x2={p0[0] + (p1[0] - p0[0]) * k} y2={p0[1] + (p1[1] - p0[1]) * k} stroke="#fff" strokeWidth={10} strokeLinecap="round" opacity={0.9} />;
      })}
      {[0, 1, 2].map((i) =>
        v[i] > 0 ? (
          <g key={i} transform={`translate(${P[i][0]},${P[i][1]}) scale(${v[i]})`}>
            <circle r={58} fill={col[i]} stroke="#fff" strokeWidth={8} />
            <text y={i === 0 ? -86 : 120} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={64} fill="#fff" stroke="#120c08" strokeWidth={10} paintOrder="stroke">
              {lab[i]}
            </text>
          </g>
        ) : null,
      )}
    </svg>
  );
};

/** Termômetro lateral que sobe até o valor do momento */
const Thermo: React.FC<{from: number; to: number; steps: {at: number; value: number; label: string; color: string}[]}> = ({from, to, steps}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 6), 1 - ramp(f, to - 6, to));
  let val = 0;
  let cur = steps[0];
  steps.forEach((s, i) => {
    const prev = i === 0 ? 0 : steps[i - 1].value;
    if (f >= s.at) cur = s;
    val = f >= s.at ? lerp(prev, s.value, ramp(f, s.at, s.at + 14, easeOut)) : val;
  });
  const h = 620 * clamp(val / 1100);
  return (
    <div style={{position: "absolute", top: 300, right: 70, width: 150, height: 760, opacity: o}}>
      <div style={{position: "absolute", left: 45, top: 0, width: 60, height: 660, borderRadius: 30, background: "rgba(255,255,255,0.88)", border: "6px solid #120c08"}} />
      <div style={{position: "absolute", left: 57, bottom: 70, width: 36, height: h, borderRadius: 18, background: `linear-gradient(0deg, ${cur.color}, #ffd34d)`}} />
      <div style={{position: "absolute", left: 25, bottom: 0, width: 100, height: 100, borderRadius: 50, background: cur.color, border: "6px solid #120c08"}} />
      {f >= steps[0].at && (
        <div style={{position: "absolute", right: 160, top: 640 - h - 30, whiteSpace: "nowrap", textAlign: "right", fontFamily, fontWeight: 900, color: "#fff", WebkitTextStroke: "7px #120c08", paintOrder: "stroke fill"}}>
          <div style={{fontSize: 92, color: cur.color}}>{Math.round(val)} °C</div>
          <div style={{fontSize: 48}}>{cur.label}</div>
        </div>
      )}
    </div>
  );
};

/** bolinhas de O₂ sendo puxadas para a chama */
const O2: React.FC<{from: number; to: number; target: [number, number]}> = ({from, to, target}) => {
  const f = useCurrentFrame();
  const items = useMemo(() => Array.from({length: 14}, (_, i) => ({ang: (i / 14) * Math.PI * 2 + i, r: 520 + (i % 4) * 90, off: (i % 5) * 7})), []);
  if (f < from || f > to) return null;
  return (
    <>
      {items.map((it, i) => {
        const k = ((f - from + it.off * 3) % 40) / 40;
        const rr = it.r * (1 - easeInOut(k));
        const x = target[0] + Math.cos(it.ang) * rr;
        const y = target[1] + Math.sin(it.ang) * rr * 0.8;
        return (
          <div key={i} style={{position: "absolute", left: x - 42, top: y - 42, width: 84, height: 84, borderRadius: 42, background: "rgba(80,170,255,0.85)", border: "5px solid #fff", color: "#fff", fontFamily, fontWeight: 900, fontSize: 36, display: "flex", alignItems: "center", justifyContent: "center", opacity: Math.sin(k * Math.PI), transform: `scale(${1 - 0.6 * k})`}}>
            O₂
          </div>
        );
      })}
    </>
  );
};

/** lista com ✔ */
const Checklist: React.FC<{from: number; to: number; items: {at: number; text: string}[]}> = ({from, to, items}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = 1 - ramp(f, to - 6, to);
  return (
    <div style={{position: "absolute", top: 260, left: 80, opacity: o}}>
      {items.map((it, i) =>
        f >= it.at ? (
          <div key={i} style={{display: "flex", alignItems: "center", gap: 22, marginBottom: 22, transform: `translateX(${-60 * (1 - pop(f, it.at, 8))}px)`, opacity: ramp(f, it.at, it.at + 5)}}>
            <svg width={72} height={72} viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="11" fill="#2E9E4F" stroke="#fff" strokeWidth="1.6" />
              <path d="M6 12.5l4 4 8-9" stroke="#fff" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
            <span style={{fontFamily, fontWeight: 900, fontSize: 62, color: "#fff", WebkitTextStroke: "8px #120c08", paintOrder: "stroke fill", textTransform: "uppercase"}}>{it.text}</span>
          </div>
        ) : null,
      )}
    </div>
  );
};

/** enquete A/B para os comentários */
const Poll: React.FC<{from: number; to: number; q: string; a: string; b: string; top?: number}> = ({from, to, q, a, b, top = 230}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = 1 - ramp(f, to - 6, to);
  const card = (letter: string, txt: string, col: string, d: number) => (
    <div style={{display: "flex", alignItems: "center", gap: 20, background: "rgba(18,12,8,0.82)", border: `6px solid ${col}`, borderRadius: 26, padding: "18px 30px", transform: `scale(${pop(f, from + d, 10)})`, marginTop: 20}}>
      <div style={{width: 76, height: 76, borderRadius: 38, background: col, color: "#fff", fontFamily, fontWeight: 900, fontSize: 52, display: "flex", alignItems: "center", justifyContent: "center"}}>{letter}</div>
      <div style={{fontFamily, fontWeight: 900, fontSize: 58, color: "#fff", textTransform: "uppercase"}}>{txt}</div>
    </div>
  );
  return (
    <div style={{position: "absolute", top, left: 90, right: 90, opacity: o}}>
      <div style={{fontFamily, fontWeight: 900, fontSize: 60, color: "#FFB31A", textAlign: "center", WebkitTextStroke: "8px #120c08", paintOrder: "stroke fill", transform: `scale(${pop(f, from, 10)})`}}>{q}</div>
      {card("A", a, "#ff5a1f", 4)}
      {card("B", b, "#3a7bff", 8)}
    </div>
  );
};

const Blur: React.FC<{children: React.ReactNode}> = ({children}) => {
  const f = useCurrentFrame();
  const ton = at(11, "tonto");
  const apa = at(11, "apaga");
  const end = L(12) - 3;
  const k = f >= end ? 0 : ramp(f, ton, apa + 6);
  const dark = f >= end ? 0 : ramp(f, apa, apa + 14) * 0.75;
  return (
    <AbsoluteFill style={{filter: k > 0 ? `blur(${k * 9}px) saturate(${1 - 0.5 * k})` : undefined, transform: k > 0 ? `rotate(${Math.sin(f / 6) * 1.5 * k}deg) scale(${1 + 0.04 * k})` : undefined}}>
      {children}
      {dark > 0 && <AbsoluteFill style={{background: "#000", opacity: dark}} />}
    </AbsoluteFill>
  );
};

export const Video90: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <Blur>
        <ThreeCanvas width={width} height={height} shadows gl={{antialias: false}} dpr={1}>
          <Scene f={f} />
        </ThreeCanvas>
      </Blur>
      {cuts.map((c) => (f >= c && f < c + 5 ? <AbsoluteFill key={c} style={{background: "#000", opacity: 0.35 * (1 - (f - c) / 5)}} /> : null))}
      <Flash at={at(0, "fogo")} />
      <Flash at={at(2, "acende")} strength={0.45} />
      {[0, 1, 2].map((n) => (
        <Flash key={n} at={at(9, "lenha", n)} strength={0.55} />
      ))}
      <Flash at={at(15, "cara")} strength={0.4} />
      <Chip from={at(0, "caio")} to={at(0, "fogo") - 1} text="CAIO" bg="#d4302a" />
      <TitleTag text="FOGO" from={at(0, "fogo")} to={L(1) + 20} />
      <Chip from={L(3) + 4} to={L(4) - 4} text="5 °C" bg="#2f6fd6" />
      <Triangle from={at(6, "calor")} to={L(7) - 4} k1={at(6, "calor")} k2={at(6, "combust")} k3={at(6, "oxig")} />
      <Thermo
        from={at(8, "camiseta") - 2}
        to={L(9) - 4}
        steps={[
          {at: at(8, "quatrocentos"), value: 400, label: "ALGODÃO PEGA FOGO", color: "#ff8a1f"},
          {at: at(8, "mil"), value: 1000, label: "CHAMA", color: "#e0261c"},
        ]}
      />
      <O2 from={at(10, "suga") - 4} to={L(11) - 4} target={[620, 1050]} />
      <Thermo
        from={at(12, "pele") - 2}
        to={L(13) - 4}
        steps={[
          {at: at(12, "quarenta"), value: 44, label: "PELE COMEÇA A QUEIMAR", color: "#e0261c"},
          {at: at(12, "poder"), value: 1000, label: "TEU PODER", color: "#ff5a1f"},
        ]}
      />
      <TitleTag text="CONTROLE" from={at(13, "controle")} to={L(14) - 4} />
      <Checklist
        from={L(14) - 2}
        to={L(15) - 4}
        items={[
          {at: at(14, "chama"), text: "Chama pequena"},
          {at: at(14, "ponta"), text: "Na ponta do dedo"},
          {at: at(14, "longe"), text: "Longe do rosto"},
          {at: at(14, "janela"), text: "Janela aberta"},
        ]}
      />
      <Split />
      <Captions />
      <Chip from={at(17, "comenta")} to={TOTAL90} text="COMENTA AÍ ↓" bg="#2E9E4F" top={905} />
      <Audio src={staticFile("voz90.mp3")} />
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 3} durationInFrames={45}>
          <Audio src={staticFile("sfx/whoosh.wav")} volume={0.12} />
        </Sequence>
      ))}
      <Sequence from={at(0, "fogo")} durationInFrames={40}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={at(2, "dedos") + 8} durationInFrames={10}>
        <Audio src={staticFile("sfx/snap.wav")} volume={0.8} />
      </Sequence>
      {[0, 1, 2].map((n) => (
        <Sequence key={"l" + n} from={at(9, "lenha", n)} durationInFrames={36}>
          <Audio src={staticFile("sfx/boom.wav")} volume={0.35} />
        </Sequence>
      ))}
      <Sequence from={at(2, "acende")} durationInFrames={L(3) - at(2, "acende")}>
        <Audio src={staticFile("sfx/crackle.wav")} volume={0.12} />
      </Sequence>
      <Sequence from={L(9)} durationInFrames={L(10) - L(9)}>
        <Audio src={staticFile("sfx/crackle.wav")} volume={0.18} loop />
      </Sequence>
      <Sequence from={at(15, "cara")} durationInFrames={L(16) - at(15, "cara")}>
        <Audio src={staticFile("sfx/crackle.wav")} volume={0.18} />
      </Sequence>
    </AbsoluteFill>
  );
};
