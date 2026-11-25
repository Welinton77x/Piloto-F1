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
import {sm, rbox, Desk} from "./Sets9";
import {Rain} from "./Sets13";
import {Office, Sparkles} from "./Sets19";
import {Bg} from "./Sets20";
import {Maquina} from "./Sets30";
import {PicketSign} from "./Sets33";
import {Vapor} from "./Sets41";
import {Demiurgo, PortalChao} from "./Sets42";
import {MeiaViva, PoteSorvete, Cracha, PapelHig, ChuvaMeias, QuadroTempo} from "./Sets43";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {physics} from "./Physics";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingMeia.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_MEIA = F(words[words.length - 1].e + 1.2);

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
const NAO0 = at(0, "nao");
const PROMOVIDA0 = at(0, "promovida");
const PORTAL1 = at(1, "portal");
const ESCRITORIO1 = at(1, "escritorio");
const CONTRATA1 = at(1, "contrata");
const GERENTE2 = at(2, "gerente");
const CHOVE2 = at(2, "chove");
const CRACHA3 = at(3, "cracha");
const POTE3 = at(3, "pote");
const FEIJAO3 = at(3, "feijao");
const ABRE4 = at(4, "abre");
const FEIJAO4A = at(4, "feijao", 0);
const FEIJAO4B = at(4, "feijao", 1);
const FEIJAO4C = at(4, "feijao", 2);
const ULTIMO4 = at(4, "ultimo");
const FLOCOS4 = at(4, "flocos");
const NINGUEM4 = at(4, "ninguem");
const CRACHA5 = at(5, "cracha");
const ENTRA5 = at(5, "entra");
const CENTRIFUGA5 = at(5, "centrifuga");
const CHEGA5 = at(5, "chega");
const PAPEL6 = at(6, "papel");
const FRENTE6 = at(6, "frente");
const TRAS6 = at(6, "tras");
const FRENTE7 = at(7, "frente");
const CHORA7 = at(7, "chora");
const TREZE7 = at(7, "treze");
const DEVOLVE8 = at(8, "devolve");
const QUARENTA8 = at(8, "quarenta");
const TODAS9 = at(9, "todas");
const PARABENS10 = at(10, "parabens");
const QUARENTA10 = at(10, "quarenta");
const GREVE10 = at(10, "greve");
const SEGUE11 = at(11, "segue");
const DEMIURGO11 = at(11, "demiurgo");
const OUTRA11 = at(11, "outra");

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
const Street: React.FC<{t: number}> = ({t}) => (
  <>
    <DayOut />
    <group position={[0, 0, -2.5]}>
      <Town t={t} galo={false} variant="nova" flat clouds />
    </group>
  </>
);
const Casa: React.FC<{wall?: string}> = ({wall = "#f6d9a8"}) => (
  <>
    <Bg c="#f3e3c8" />
    <KitchenLights />
    <mesh position={[0, 2, -1.8]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color={wall} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#c99a6a" />
    </mesh>
  </>
);
/* lavanderia com a máquina */
const Lav: React.FC<{t: number; shake?: number; spin?: number}> = ({t, shake = 0, spin = 0}) => (
  <>
    <Bg c="#d9eef8" />
    <KitchenLights />
    <mesh position={[0, 2, -1.8]} receiveShadow>
      <boxGeometry args={[12, 4, 0.1]} />
      <meshStandardMaterial color="#bfe0ef" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[14, 10]} />
      <meshStandardMaterial color="#e8e2d6" />
    </mesh>
    <Maquina p={[0.1, 0, -0.8]} s={1.15} t={t} mood="happy" spin={spin} shake={shake} />
  </>
);
/* escritório do demiurgo */
const Escritorio: React.FC<{t: number; f: number; cry?: number; mouth?: number; workers?: boolean}> = ({t, f, cry = 0, mouth = 0.2, workers = true}) => (
  <>
    <Office />
    <KitchenLights />
    <pointLight position={[0, 3, 2]} intensity={8} distance={10} color="#fff0d8" />
    <Demiurgo p={[0.55, 0, -1.4]} s={0.95} t={t} blink={blinkCurve(f)} mouth={mouth} cry={cry} />
    <Desk p={[0.45, 0, -0.5]} w={1.8} />
    {workers &&
      [0, 1].map((i) => (
        <MeiaViva key={i} p={[-1.3 + i * 0.35 + Math.sin(t * 2 + i) * 0.1, 0, -0.9 + i * 0.3]} r={[0, 0.5, 0]} s={0.9} t={t} tie badge color={i ? "#ffd21f" : "#3a86ff"} blink={blinkCurve(f + i * 9)} />
      ))}
  </>
);

/* 0 — sumiu a meia: não procura atrás da máquina; ela foi promovida */
const M0: React.FC<ShotProps> = ({f, a, t}) => {
  const prom = f >= PROMOVIDA0 - 4 ? clamp((f - PROMOVIDA0 + 4) / 14) : 0;
  return (
    <>
      <Cam pos={[0, 1.6, 4.6]} look={[0, 1.0, -0.4]} fov={54} f={f} a={f >= PROMOVIDA0 - 4 ? PROMOVIDA0 - 4 : a} punch={f >= PROMOVIDA0 - 4 ? 10 : 7} />
      <Lav t={t} />
      {prom > 0 && (
        <>
          <MeiaViva p={[0.1, 0.4 + easeOut(prom) * 0.9, -0.2]} s={1.1} t={t} tie badge mouth={0.4} blink={blinkCurve(f)} />
          <Sparkles p={[0.1, 1.5, -0.1]} t={t} spread={0.6} n={10} />
        </>
      )}
      <PBoy id="m0" a={a} f={f} pose={(fr) =>
        fr < NAO0 - 2
          ? {...idle(fr), pos: [-0.75, 0, 0.3], rotY: 0.5, head: [0.1, 0, 0], brow: 0.6, rShoulder: [-0.6, 0, -0.3], rElbow: -1.0}
          : fr < PROMOVIDA0 - 4
            ? {...idle(fr), pos: [-0.75, 0, -0.1], rotY: 1.2, torso: [0.4, 0, 0], head: [0.2, 0, 0], rShoulder: [-1.4, 0, -0.2], rElbow: -0.2}
            : {...idle(fr), pos: [-0.75, 0, 0.3], rotY: 0.5, eyeWide: 1, mouthOpen: 0.7, brow: 1}
      } />
    </>
  );
};
/* 1 — portal no fundo da máquina → escritório do demiurgo, meias funcionárias */
const M1: React.FC<ShotProps> = ({f, a, t}) => {
  if (f < ESCRITORIO1 - 4)
    return (
      <>
        <Cam pos={[0.1, 0.9, 2.6]} look={[0.1, 0.65, -0.3]} fov={52} f={f} a={a} punch={9} />
        <Lav t={t} />
        {f >= PORTAL1 - 4 && <PortalChao p={[0.1, 0.6, -0.29]} s={0.32} t={t} k={clamp((f - PORTAL1 + 4) / 10)} />}
      </>
    );
  return (
    <>
      <Cam pos={[0, 1.7, 5.0]} look={[0, 1.2, -0.6]} fov={54} f={f} a={ESCRITORIO1 - 4} />
      <Escritorio t={t} f={f} workers={f >= CONTRATA1 - 4} mouth={0.3} />
    </>
  );
};
/* 2 — gerente da previsão do tempo → chove quando você esquece o guarda-chuva */
const M2: React.FC<ShotProps> = ({f, a, t}) => {
  if (f < CHOVE2 - 4)
    return (
      <>
        <Cam pos={[0, 1.5, 4.0]} look={[0, 1.2, -0.6]} fov={54} f={f} a={a} />
        <Office />
        <KitchenLights />
        <QuadroTempo p={[0.25, 1.5, -1.0]} s={1.0} />
        <MeiaViva p={[-0.6, 0, 0.9]} r={[0, 0.4, 0]} s={1.3} t={t} tie badge point={1} mouth={0.3 + 0.3 * Math.sin(t * 10)} blink={blinkCurve(f)} />
      </>
    );
  return (
    <>
      <Cam pos={[0, 1.6, 4.6]} look={[0, 1.1, 0]} fov={54} f={f} a={CHOVE2 - 4} />
      <Street t={t} />
      <Rain c={[0, 0, 0.4]} size={[3, 4, 2]} t={t} k={1} color="#7fb8ff" n={160} />
      <PBoy id="m2" a={CHOVE2 - 4} f={f} pose={(fr) => ({...idle(fr), pos: [0, 0, 0.5], rotY: 0, head: [-0.3, 0, 0], brow: -0.8, mouthOpen: 0.2, eyeWide: 0, rShoulder: [-0.3, 0, -0.5], lShoulder: [-0.3, 0, 0.5], lElbow: -2.2, rElbow: -2.2})} />
    </>
  );
};
/* 3 — crachá de visitante → fundo de um pote de sorvete → feijão */
const M3: React.FC<ShotProps> = ({f, a, t}) => {
  const pote = f >= POTE3 - 4;
  const open = f >= FEIJAO3 - 6 ? clamp((f - FEIJAO3 + 6) / 8) : 0;
  return (
    <>
      <Cam pos={[0, 1.5, pote ? 3.0 : 4.4]} look={[0, pote ? 1.0 : 1.3, 0]} fov={54} f={f} a={pote ? POTE3 - 4 : a} punch={pote ? 9 : 7} />
      <Casa wall="#ffe0b8" />
      {!pote && <Cracha p={[0.35, 1.7 + Math.sin(t * 3) * 0.06, 0.2]} r={[0, Math.sin(t * 2) * 0.4, 0]} s={1.3} />}
      {!pote && <Sparkles p={[0.35, 1.7, 0.3]} t={t} spread={0.5} n={8} />}
      {pote && (
        <>
          <mesh position={[0, 0.4, 0]} geometry={rbox(1.4, 0.8, 0.8, 0.03)} material={sm("#8a5a2a", 0.6)} castShadow />
          <PoteSorvete p={[0.2, 0.8, 0.1]} s={1.3} open={open} fill="feijao" />
        </>
      )}
      <PBoy id="m3" a={a} f={f} pose={(fr) => ({...idle(fr), pos: pote ? [-0.3, 0, -0.75] : [-0.65, 0, 0.3], rotY: pote ? 0 : 0.6, eyeWide: fr >= FEIJAO3 ? 1 : 0.4, brow: fr >= FEIJAO3 ? 1 : 0, mouthOpen: fr >= FEIJAO3 ? 0.7 : 0.1, head: [pote ? 0.3 : -0.2, 0, 0]})} />
    </>
  );
};
/* 4 — casa da avó: feijão, feijão, feijão... flocos */
const M4: React.FC<ShotProps> = ({f, a, t}) => {
  const opens = [FEIJAO4A, FEIJAO4B, FEIJAO4C, FLOCOS4].map((x) => (f >= x - 6 ? clamp((f - x + 6) / 8) : 0));
  const xs = [-0.75, -0.25, 0.25, 0.75];
  const cur = opens.filter((o) => o > 0).length;
  return (
    <>
      <Cam pos={[0, 1.9, 4.2]} look={[0, 1.0, -0.2]} fov={54} f={f} a={a} />
      <Casa wall="#ffe0b8" />
      <mesh position={[0, 0.4, 0]} geometry={rbox(2.2, 0.8, 0.8, 0.03)} material={sm("#8a5a2a", 0.6)} castShadow />
      {xs.map((x, i) => (
        <PoteSorvete key={i} p={[x, 0.8, 0.1]} s={0.95} open={opens[i]} fill={i === 3 ? "flocos" : "feijao"} dust={i === 3} label={i === 3 ? "#9ad0f0" : "#ff9ec7"} />
      ))}
      <PBoy id="m4" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [cur > 0 ? xs[Math.min(3, cur - 1)] : -0.9, 0, -0.75], rotY: 0, head: [0.35, 0, 0], torso: [0.15, 0, 0], rShoulder: [-1.0, 0, -0.1], rElbow: -0.5, brow: fr >= NINGUEM4 ? 1 : -0.3, eyeWide: fr >= FLOCOS4 ? 1 : 0.3, mouthOpen: fr >= FLOCOS4 ? 0.5 : 0.1})} />
    </>
  );
};
/* 5 — o crachá embaixo do flocos → entra na máquina → centrifuga → chega */
const M5: React.FC<ShotProps> = ({f, a, t}) => {
  if (f < ENTRA5 - 3)
    return (
      <>
        <Cam pos={[0, 1.6, 3.4]} look={[0, 1.3, 0]} fov={54} f={f} a={a} punch={9} />
        <Casa wall="#ffe0b8" />
        <PBoy id="m5" a={a} f={f} item={<Cracha p={[0, 0.15, 0]} s={1.4} />} pose={(fr) => ({...idle(fr), pos: [0, 0, 0.3], rotY: 0, rShoulder: [-2.6, 0, -0.2], rElbow: -0.2, smile: 1, mouthOpen: 0.5, eyeWide: 0.6})} />
        <Sparkles p={[-0.3, 2.2, 0.4]} t={t} spread={0.4} n={8} />
      </>
    );
  if (f < CHEGA5 - 3) {
    const spin = f >= CENTRIFUGA5 - 4 ? (f - CENTRIFUGA5 + 4) * 0.5 : 0;
    return (
      <>
        <Cam pos={[0.1, 0.75, 1.9]} look={[0.1, 0.62, -0.3]} fov={50} f={f} a={ENTRA5 - 3} punch={9} />
        <Lav t={t} shake={spin > 0 ? 1 : 0} />
        <group position={[0.1, 0.6, -0.27]} rotation={[0, 0, -spin]} scale={0.16}>
          <PBoy id="m5b" a={ENTRA5 - 3} f={f} pose={(fr) => ({...idle(fr), pos: [0, -1.0, 0], ...ARMS_UP, eyeWide: 1, mouthOpen: 0.8, brow: 1})} />
        </group>
      </>
    );
  }
  return (
    <>
      <Cam pos={[0, 1.7, 5.0]} look={[0, 1.2, -0.6]} fov={54} f={f} a={CHEGA5 - 3} />
      <Escritorio t={t} f={f} />
      <PortalChao p={[-0.6, 0, 0.6]} s={0.6} t={t} k={1 - clamp((f - CHEGA5 - 10) / 10)} />
      <PBoy id="m5c" a={CHEGA5 - 3} f={f} pose={(fr) => ({...idle(fr), pos: [-0.6, hop(fr, CHEGA5 - 3, 16, 0.9), 0.6], rotY: 0.5, eyeWide: 1, mouthOpen: 0.5, ...ARMS_UP})} />
    </>
  );
};
/* 6/7 — a maior dúvida do universo: o papel higiênico. Você acerta, ele chora */
const M6: React.FC<ShotProps> = ({f, a, t}) => {
  const paper = f >= PAPEL6 - 4;
  const fr2 = f < FRENTE6 ? 1 : f < TRAS6 ? 1 : f < L(7) ? 0 : 1;
  const crying = f >= CHORA7 - 2;
  return (
    <>
      <Cam pos={[0, 1.7, 4.8]} look={[0, 1.25, -0.4]} fov={54} f={f} a={a} />
      <Escritorio t={t} f={f} workers={false} cry={crying ? 1 : 0} mouth={crying ? 0.8 : f < L(7) ? 0.3 + 0.3 * Math.sin(t * 10) : 0.2} />
      {paper && (
        <group position={[0.0, 1.3 + Math.sin(t * 2) * 0.04, 0.3]} rotation={[0, 0.7, 0]}>
          <PapelHig p={[0, 0, 0]} s={1.0} frente={fr2} />
        </group>
      )}
      <PBoy id="m6" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [-0.8, 0, 0.6], rotY: 0.6, eyeWide: 0.5, ...(fr >= FRENTE7 - 2 && fr < CHORA7 ? {rShoulder: [-1.6, 0, -0.1], rElbow: 0, mouthOpen: 0.5, smile: 0.6} : {}), ...(crying ? {brow: 1, mouthOpen: 0.4} : {})})} />
    </>
  );
};
/* 8/9 — devolve a meia + 47 meias. Todas do pé esquerdo */
const M8: React.FC<ShotProps> = ({f, a, t}) => {
  const rain = f >= QUARENTA8 - 4 ? clamp((f - QUARENTA8 + 4) / 50) : 0;
  return (
    <>
      <Cam pos={[0, 1.7, 4.8]} look={[0, 1.1, -0.2]} fov={54} f={f} a={f >= TODAS9 - 2 ? TODAS9 - 2 : a} punch={f >= TODAS9 - 2 ? 10 : 7} />
      <Escritorio t={t} f={f} workers={false} cry={1} mouth={0.5} />
      <ChuvaMeias c={[-0.2, 0, 0.6]} t={t} k={rain} n={44} />
      <PBoy id="m8" a={a} f={f} item={f >= DEVOLVE8 ? <MeiaViva p={[0, -0.05, 0]} s={0.45} face={0} /> : undefined} pose={(fr) => ({...idle(fr), pos: [-0.3, 0, 0.6], rotY: 0.3, eyeWide: fr >= QUARENTA8 ? 1 : 0.4, mouthOpen: fr >= QUARENTA8 ? 0.7 : 0.2, brow: fr >= TODAS9 ? 1 : 0, rShoulder: [-1.3, 0, -0.2], rElbow: -0.6, ...(fr >= QUARENTA8 ? {lShoulder: [-2.6, 0, 0.4], lElbow: -0.3} : {})})} />
    </>
  );
};
/* 10 — PARABÉNS → 48 meias esquerdas → pé direito em greve */
const M10: React.FC<ShotProps> = ({f, a, t}) => {
  const later = f >= QUARENTA10 - 4;
  return (
    <>
      <Cam pos={[0, 1.6, 4.4]} look={[0, 1.1, 0]} fov={54} f={f} a={later ? QUARENTA10 - 4 : a} punch={10} />
      <Lav t={t} />
      {later && <ChuvaMeias c={[0, -0.05, 0.3]} t={t} k={1} n={44} />}
      {f >= GREVE10 - 4 && <PicketSign p={[0.75, 0, 0.9]} r={[0, -0.3, 0.1 * Math.sin(t * 3)]} s={0.8} text={"PÉ DIREITO\nEM GREVE"} k="greve-pe" />}
      <PBoy id="m10" a={a} f={f} pose={(fr) =>
        fr < QUARENTA10 - 4
          ? {...idle(fr), pos: [0, Math.abs(Math.sin(tf(fr) * 7)) * 0.3, 0.3], rotY: 0, ...ARMS_UP, rShoulder: [-2.9, 0, -0.35 - 0.3 * Math.sin(tf(fr) * 14)], lShoulder: [-2.9, 0, 0.35 + 0.3 * Math.sin(tf(fr) * 14)], smile: 1, mouthOpen: 0.6}
          : {...idle(fr), pos: [-0.1, -0.35, 0.3], rotY: 0, legLift: 1, head: [0.35, 0, 0], brow: -0.8, mouthOpen: 0.1, eyeWide: 0, rShoulder: [-0.2, 0, -0.2], lShoulder: [-0.2, 0, 0.2]}
      } />
    </>
  );
};
/* 11 — furioso: AGORA SEGUE O PERFIL... senão o demiurgo contrata a sua outra meia */
const M11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0, 1.7, 3.6]} look={[0, 1.45, 0.4]} fov={52} f={f} a={a} punch={14} />
    <Lav t={t} />
    <pointLight position={[0, 2.2, 2.0]} intensity={8} distance={6} color="#ff3020" />
    {f >= DEMIURGO11 - 4 && <Demiurgo p={[0.75, lerp(-2.5, 0, easeOut(clamp((f - DEMIURGO11 + 4) / 12))), -0.6]} s={0.75} t={t} mouth={0.8} />}
    {f >= OUTRA11 - 4 && <MeiaViva p={[lerp(0.3, 1.2, clamp((f - OUTRA11 + 4) / 20)), 1.6, -0.2]} r={[0, 0, -0.4]} s={0.6} t={t} tie badge blink={blinkCurve(f)} />}
    <PBoy id="m11" a={a} f={f} pose={(fr) => ({...idle(fr), pos: [0, hop(fr, a, 10, 0.2) + Math.sin(tf(fr) * 40) * 0.01, 0.3], rotY: 0, torso: [0.15, 0, 0], brow: -1, eyeWide: 0.3, mouthOpen: 0.7, smile: 0, rShoulder: [-1.5, 0, -0.1], rElbow: 0, lShoulder: [0.1, 0, 0.6], lElbow: -1.6})} />
    <Vapor p={[0, 2.25, 0.3]} t={t} />
  </>
);

const SHOTS: Shot[] = [
  {from: 0, Comp: M0},
  {from: L(1), Comp: M1},
  {from: L(2), Comp: M2},
  {from: L(3), Comp: M3},
  {from: L(4), Comp: M4},
  {from: L(5), Comp: M5},
  {from: L(6), Comp: M6},
  {from: L(8), Comp: M8},
  {from: L(10), Comp: M10},
  {from: L(11), Comp: M11},
];

const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_MEIA} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["meia", "sumiu", "maquina", "promovida", "portal", "escritorio", "demiurgo", "funcionarias", "gerente", "previsao", "chove", "guarda-chuva", "cracha", "visitante", "pote", "sorvete", "feijao", "avo", "flocos", "abriu", "centrifuga", "papel", "higienico", "frente", "tras", "chora", "bilhoes", "quarenta", "esquerdo", "parabens", "esquerdas", "greve", "segue", "perfil", "outra"]);
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
/* X vermelho grande / V verde de certinho */
const Mark: React.FC<{from: number; to: number; ok?: boolean; x?: number; y?: number; size?: number}> = ({from, to, ok = false, x = 540, y = 760, size = 360}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const k = Math.min(1, (f - from) / 6);
  const s = (k < 1 ? 0.4 + k * 0.8 : 1.2 - Math.min(0.2, (f - from - 6) / 20)) * (1 - Math.max(0, (f - to + 5) / 5));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%,-50%) scale(${s}) rotate(${ok ? -6 : 0}deg)`, fontFamily, fontWeight: 900, fontSize: size, lineHeight: 1, color: ok ? "#2ecc40" : "#ff2020", WebkitTextStroke: "14px #ffffff", paintOrder: "stroke fill", filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.35))"}}>
      {ok ? "✔" : "✖"}
    </div>
  );
};
const Angry: React.FC<{from: number}> = ({from}) => {
  const f = useCurrentFrame();
  if (f < from) return null;
  const k = Math.min(1, (f - from) / 8);
  return <AbsoluteFill style={{background: `radial-gradient(circle at 50% 40%, rgba(255,0,0,0) 40%, rgba(220,0,0,${0.35 * k}) 100%)`}} />;
};
const FOLLOW_FROM = SEGUE11 - 6;
const FOLLOW_TAP = FOLLOW_FROM + 30;
export const VideoMeia: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <Mark from={NAO0} to={NAO0 + 40} />
      <Ono from={PROMOVIDA0} to={L(1) - 2} text="PROMOVIDA! 🎉" size={110} color="#ffd21f" />
      <Ono from={PORTAL1} to={ESCRITORIO1 - 4} text="VUUUSH!" size={140} color="#e08aff" />
      <Plaque from={CONTRATA1} to={L(2) - 2} text={"🧦 MEIAS LTDA\nCONTRATANDO"} x={540} y={420} size={58} />
      <Ono from={CHOVE2} to={L(3) - 2} text="PLIC PLOC!" size={120} color="#7fd0ff" />
      <Ono from={CRACHA3} to={POTE3 - 4} text="TCHARAM!" size={120} color="#ffd21f" />
      <Ono from={FEIJAO3} to={L(4) - 2} text="FEIJÃO?!" size={140} color="#ffffff" />
      <Mark from={FEIJAO4A} to={FEIJAO4B - 2} x={260} y={760} size={240} />
      <Mark from={FEIJAO4B} to={FEIJAO4C - 2} x={460} y={760} size={240} />
      <Mark from={FEIJAO4C} to={ULTIMO4 - 2} x={660} y={760} size={240} />
      <Ono from={FLOCOS4} to={NINGUEM4 - 2} text="FLOCOS 😐" size={120} color="#9ad0f0" />
      <Ono from={NINGUEM4} to={L(5) - 2} text="COF COF!" size={120} color="#e8e8e8" />
      <Ono from={CENTRIFUGA5} to={CHEGA5 - 3} text="VRRRRRUM!" size={120} color="#7fd0ff" />
      <Ono from={CHEGA5} to={L(6) - 2} text="PLOP!" size={140} color="#e08aff" />
      <Ono from={FRENTE6} to={TRAS6 - 2} text="⬆ FRENTE?" size={100} color="#ffffff" />
      <Ono from={TRAS6} to={L(7) - 2} text="TRÁS? ⬇" size={100} color="#ffffff" />
      <Mark from={FRENTE7} to={CHORA7 - 2} ok />
      <Ono from={CHORA7} to={TREZE7 - 2} text="BUÁÁÁ!" size={150} color="#7fd0ff" />
      <BigNum from={TREZE7} to={L(8) - 2} text="13.000.000.000 ANOS" size={80} />
      <Ono from={QUARENTA8} to={L(9) - 2} text="+47 🧦" size={170} color="#ffd21f" />
      <Plaque from={TODAS9} to={L(10) - 2} text={"🦶 TODAS DO\nPÉ ESQUERDO"} x={540} y={420} size={62} />
      <Confetti from={PARABENS10} to={PARABENS10 + 60} />
      <Ono from={QUARENTA10} to={GREVE10 - 4} text="48 ESQUERDAS" size={110} color="#ffffff" />
      <Ono from={GREVE10} to={L(11) - 2} text="GREVE! 🪧" size={130} color="#ff3030" />
      <Angry from={L(11)} />
      <Ono from={SEGUE11 - 6} to={TOTAL_MEIA - 1} text="😡" size={200} color="#ffffff" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_MEIA - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio: som junto de cada onomatopeia ---------- */}
      <Audio src={staticFile("vozmeia.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.12} />
      ))}
      <SND src="sfx10/bonk.mp3" from={NAO0} dur={25} v={FXV * 0.5} />
      <SND src="sfx18/brilho.mp3" from={PROMOVIDA0} dur={40} v={FXV * 0.45} />
      <SND src="sfx11/rocket.mp3" from={PORTAL1} dur={45} v={FXV * 0.35} />
      <SND src="sfx17/splash.mp3" from={CHOVE2} dur={40} v={FXV * 0.35} />
      <SND src="sfx18/brilho.mp3" from={CRACHA3} dur={40} v={FXV * 0.4} />
      <SND src="sfx7/pof.mp3" from={FEIJAO3 - 4} dur={20} v={FXV * 0.5} />
      <SND src="sfx10/bonk.mp3" from={FEIJAO4A} dur={20} v={FXV * 0.45} />
      <SND src="sfx10/bonk.mp3" from={FEIJAO4B} dur={20} v={FXV * 0.45} />
      <SND src="sfx10/bonk.mp3" from={FEIJAO4C} dur={20} v={FXV * 0.45} />
      <SND src="sfx7/pof.mp3" from={FLOCOS4 - 4} dur={20} v={FXV * 0.5} />
      <SND src="sfx18/brilho.mp3" from={CRACHA5} dur={40} v={FXV * 0.4} />
      <SND src="sfx9/wobble.mp3" from={CENTRIFUGA5} dur={50} v={FXV * 0.45} />
      <SND src="sfx7/pof.mp3" from={CHEGA5} dur={20} v={FXV * 0.5} />
      <SND src="sfx9/yay.mp3" from={FRENTE7} dur={40} v={FXV * 0.3} />
      <SND src="sfx7/whoosh.mp3" from={QUARENTA8} dur={40} v={FXV * 0.4} />
      <SND src="sfx9/yay.mp3" from={PARABENS10} dur={50} v={FXV * 0.35} />
      <SND src="sfx7/confetti.mp3" from={PARABENS10} dur={50} v={FXV * 0.4} />
      <SND src="sfx20/steam.mp3" from={L(11)} dur={45} v={FXV * 0.5} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
