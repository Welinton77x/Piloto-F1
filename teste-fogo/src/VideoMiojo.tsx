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
import {Sky, SunDisc, SunLight, Town, V3} from "./Sets5";
import {Kitchen, WINDOW_P, Pot, WaterBlob, MiojoPack, Noodles, Cow, CowP, Scooter, Restaurant, MilkGlass, Planet, queuePoint, PLANET_R} from "./Sets8";
import {Captions, StageTitle, Chip, Sparkles, Confetti, Sticker, Cross, Zzz, Wd, clean, STROKE} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut, rng} from "./util";
import W from "./timingMiojo.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
export const TOTAL_MIOJO = F(words[words.length - 1].e + 1.6);

const KID: ToyLook = {hoodie: true};
const CUSTOMERS: ToyLook[] = [
  {shirt: "#e74c3c", hair: "#1a1a1a", hairStyle: "spiky"},
  {shirt: "#9b59b6", hair: "#d9b56a", hairStyle: "pigtails", skin: "#f5d0b0"},
  {shirt: "#2ecc71", hair: "#2a170d", hairStyle: "curly", skin: "#8d5a3a"},
  {shirt: "#3498db", hair: "#7a3a1a", hairStyle: "ponytail"},
];
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);

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
/** segue só a posição da mão (o objeto fica sempre em pé) */
const AtPalmUp: React.FC<{palm: React.RefObject<THREE.Object3D | null>; offset?: V3; children: React.ReactNode}> = ({palm, offset = [0, 0, 0], children}) => {
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
const arc = (A: V3, B: V3, k: number, h = 2): V3 => [lerp(A[0], B[0], k), lerp(A[1], B[1], k) + Math.sin(k * Math.PI) * h, lerp(A[2], B[2], k)];

/* ---------- ambientes ---------- */
const KitchenScene: React.FC<{t: number; clockMin?: number}> = ({t, clockMin = 0}) => (
  <>
    <Sky />
    <hemisphereLight args={["#fff6e6", "#b08a60", 1.15]} />
    <pointLight position={[0.5, 4.2, 1.5]} intensity={12} distance={12} decay={1.3} color="#fff4e0" castShadow shadow-mapSize={[1024, 1024]} />
    <SunLight target={[0, 1, -1.5]} dir={[3, 5, 6]} intensity={1.2} ext={5} />
    <Kitchen t={t} clockMin={clockMin} />
  </>
);
const StreetScene: React.FC<{t: number; target: V3; ext?: number}> = ({t, target, ext = 9}) => (
  <>
    <Sky />
    <fog attach="fog" args={["#cdeeff", 35, 120]} />
    <SunDisc p={[-40, 45, -110]} r={6} />
    <hemisphereLight args={["#d6ecff", "#a08a5e", 1.2]} />
    <SunLight target={target} dir={[-6, 10, 7]} intensity={2.6} ext={ext} />
    <Town t={t} galo={false} />
  </>
);
const SpaceScene: React.FC = () => {
  const stars = React.useMemo(() => {
    const r = rng(77);
    return Array.from({length: 160}, () => [(r() - 0.5) * 90, (r() - 0.5) * 120, -40 - r() * 20] as V3);
  }, []);
  return (
    <>
      <color attach="background" args={["#0a0f2a"]} />
      <hemisphereLight args={["#ffffff", "#203060", 0.9]} />
      <directionalLight position={[6, 5, 8]} intensity={2.4} color="#fff4e0" />
      {stars.map((p, i) => (
        <mesh key={i} position={p}>
          <sphereGeometry args={[0.08 + (i % 3) * 0.04, 6, 4]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </>
  );
};

/* ---------- lugares ---------- */
const POT_P: V3 = [-0.25, 1.01, -1.8];
const BOY_K: V3 = [0.6, 0, -1.0];
const REST_P: V3 = [6, 0, -3.05];
const CHEF_P: V3 = [6, 0, -3.05];
const COUNTER_Z = REST_P[2] + 1.15;

/* ======================= os planos ======================= */

/* 0 — com o miojo na mão, olhando o relógio */
const S0: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("miojo0" + a, (fr) => ({...idle(fr), pos: [0.35, 0, -0.55], rotY: 0.15, rShoulder: [-1.15, 0, -0.25], rElbow: -1.2, rFist: 1, lShoulder: [-0.2, 0, 0.15], smile: 0.8, brow: 0.5, mouthOpen: talk(fr, a + 4, a + 85) * 0.6, head: [0.05, -0.2 * ramp(fr, a + 40, a + 50), 0]}), a, f);
  const k = ramp(f, a, a + 90);
  return (
    <>
      <Cam pos={[lerp(0.6, 0.45, k), 1.65, lerp(3.0, 2.5, k)]} look={[0.1, 1.45, -1.2]} fov={48} f={f} a={a} />
      <KitchenScene t={t} clockMin={0} />
      <Pot p={POT_P}>
        <WaterBlob w={{sleepy: 1, t}} />
      </Pot>
      <Toy pose={pose} look={KID} palmRef={palm} />
      <InHand palm={palm}>
        <group position={[0, 0.02, 0.0]} rotation={[0.2, 0, 0]}>
          <MiojoPack s={1.1} />
        </group>
      </InHand>
    </>
  );
};
/* 1 — convencer a água a ferver mais rápido */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("miojo1" + a, (fr) => ({...idle(fr), pos: BOY_K, rotY: -1.35, rShoulder: [-1.05, 0, -0.42], lShoulder: [-1.05, 0, 0.42], rElbow: -1.15, lElbow: -1.15, rWrist: [0, 0, 0.4], lWrist: [0, 0, -0.4], brow: 0.8, mouthOpen: talk(fr, a + 6, a + 90) * 0.7}), a, f);
  return (
    <>
      <Cam pos={[-1.85, 2.0, 1.75]} look={[0.2, 1.35, -1.4]} fov={50} f={f} a={a} />
      <KitchenScene t={t} />
      <Pot p={POT_P}>
        <WaterBlob w={{sleepy: 1, t}} />
        <Noodles p={[0, 0.66, 0]} s={0.9} strands={4} t={t} />
      </Pot>
      <Toy pose={pose} look={KID} />
    </>
  );
};
/* 2 — a água é preguiçosa */
const S2: React.FC<ShotProps> = ({f, a, t}) => {
  const yawn = ramp(f, at(1, "e", 0) - 4, at(1, "preguicosa")) * (1 - ramp(f, at(1, "preguicosa") + 14, at(1, "preguicosa") + 26));
  return (
    <>
      <Cam pos={[POT_P[0], POT_P[1] + 0.95, POT_P[2] + 1.75]} look={[POT_P[0], POT_P[1] + 0.55, POT_P[2]]} fov={44} f={f} a={a} />
      <KitchenScene t={t} />
      <Pot p={POT_P}>
        <WaterBlob w={{sleepy: 1, yawn, t}} />
        <Noodles p={[0, 0.66, 0]} s={0.9} strands={4} t={t} />
      </Pot>
    </>
  );
};
/* 3 — conta a piada */
const S3: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("piada" + a, (fr) => ({...idle(fr), pos: BOY_K, rotY: -1.3, rShoulder: [-2.5 + 0.1 * Math.sin(fr / 5), 0, -0.25], rElbow: -0.4, rFist: 1, lShoulder: [-0.3, 0, 0.25], lElbow: -1.2, lWrist: [0, 0, -0.6], smile: 0.6, brow: 0.9, mouthOpen: talk(fr, a + 2, b3(a)) * 0.8, head: [-0.1, 0, 0.1 * Math.sin(fr / 9)]}), a, f);
  const peek = ramp(f, at(1, "macarrao") - 4, at(1, "macarrao") + 6);
  return (
    <>
      <Cam pos={[-1.9, 1.95, 1.85]} look={[0.2, 1.4, -1.35]} fov={50} f={f} a={a} />
      <KitchenScene t={t} />
      <Pot p={POT_P}>
        <WaterBlob w={{sleepy: 1 - 0.55 * peek, t}} />
        <Noodles p={[0, 0.66, 0]} s={0.9} strands={4} t={t} />
      </Pot>
      <Toy pose={pose} look={KID} />
    </>
  );
};
const b3 = (a: number) => a + 130;
/* 4 — "porque tava todo enrolado" */
const S4: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("enrolado" + a, (fr) => ({...idle(fr), pos: BOY_K, rotY: -1.2, rShoulder: [-1.3, 0, -0.35], rElbow: -0.9, rFist: 1, lShoulder: [-1.3, 0, 0.35], lElbow: -0.9, smile: 1, mouthOpen: 0.35 + 0.2 * Math.abs(Math.sin(fr / 2.5)), eyeWide: 0.3, brow: 1}), a, f);
  const giggle = ramp(f, at(1, "enrolado") + 4, at(1, "enrolado") + 14);
  return (
    <>
      <Cam pos={[-1.8, 1.85, 1.9]} look={[0.25, 1.4, -1.3]} fov={48} f={f} a={a} />
      <KitchenScene t={t} />
      <Pot p={POT_P}>
        <WaterBlob w={{sleepy: 0.3 * (1 - giggle), laugh: 0.6 * giggle, t}} />
        <Noodles p={[0, 0.66 + 0.04 * giggle * Math.abs(Math.sin(f / 2)), 0]} s={0.9} strands={4} t={t} />
      </Pot>
      <Toy pose={pose} look={KID} palmRef={palm} />
      <InHand palm={palm}>
        <Noodles s={0.55} strands={8} t={t} />
      </InHand>
    </>
  );
};
/* 5/6 — a água gargalha e ferve: humor térmico */
const BOIL = at(2, "ferve");
const WaterLaughShot: React.FC<ShotProps & {wide?: boolean}> = ({f, a, t, wide}) => {
  const boil = ramp(f, BOIL - 6, BOIL + 8);
  const sh = shake(f, 0.012 * boil);
  const pose = physics("ri" + a, (fr) => ({...idle(fr), pos: BOY_K, rotY: -1.1, smile: 1, mouthOpen: 0.4 + 0.3 * Math.abs(Math.sin(fr / 2)), eyeWide: 0.2, rShoulder: [-0.6, 0, -0.6], lShoulder: [-0.6, 0, 0.6], rElbow: -1.6, lElbow: -1.6, torso: [0.1 * Math.abs(Math.sin(fr / 3)), 0, 0]}), a, f);
  return (
    <>
      <Cam pos={wide ? [-1.9 + sh[0], 2.0 + sh[1], 1.85] : [POT_P[0] + sh[0], POT_P[1] + 0.95 + sh[1], POT_P[2] + 1.75]} look={wide ? [0.2, 1.4, -1.4] : [POT_P[0], POT_P[1] + 0.55, POT_P[2]]} fov={wide ? 50 : 46} f={f} a={a} />
      <KitchenScene t={t} />
      <Pot p={POT_P} pot={{shake: 0.4 * boil, t}}>
        <WaterBlob w={{laugh: 1, boil, t}} />
        <Noodles p={[0, 0.7 + 0.08 * Math.abs(Math.sin(t * 14)), 0]} s={0.9} strands={4} t={t} />
      </Pot>
      {wide && <Toy pose={pose} look={KID} />}
    </>
  );
};
const S5: React.FC<ShotProps> = (p) => <WaterLaughShot {...p} />;
const S6: React.FC<ShotProps> = (p) => <WaterLaughShot {...p} wide />;

/* 7/8 — a panela também ri, tomba, o miojo voa pela janela */
const TIP = at(4, "equilibrio");
const LAUNCH = at(4, "e", 0) - 2;
const potTilt = (f: number) => 0.9 * easeInOut(ramp(f, TIP - 4, LAUNCH));
const noodleFly = (f: number): {p: V3; k: number} => {
  const k = clamp((f - LAUNCH) / 30);
  const A: V3 = [POT_P[0] + 0.2, POT_P[1] + 0.8, POT_P[2]];
  const B: V3 = [WINDOW_P[0], WINDOW_P[1] + 0.2, WINDOW_P[2] - 3];
  return {p: arc(A, B, easeOut(k), 0.9), k};
};
const S7: React.FC<ShotProps> = ({f, a, t}) => {
  const face = pop(f, at(4, "panela") - 2, 10);
  const laugh = ramp(f, at(4, "ri") - 2, at(4, "ri") + 4);
  const tilt = potTilt(f);
  return (
    <>
      <Cam pos={[POT_P[0] + 0.9, POT_P[1] + 0.85, POT_P[2] + 1.7]} look={[POT_P[0] + 0.1, POT_P[1] + 0.35, POT_P[2]]} fov={48} f={f} a={a} />
      <KitchenScene t={t} />
      <Pot p={POT_P} pot={{face, laugh, shake: laugh, tilt: -tilt, t}}>
        <WaterBlob w={{laugh: 1, boil: 1, t}} />
        <Noodles p={[0, 0.7 + 0.08 * Math.abs(Math.sin(t * 14)), 0]} s={0.9} strands={4} t={t} />
      </Pot>
    </>
  );
};
const S8: React.FC<ShotProps> = ({f, a, t}) => {
  const nf = noodleFly(f);
  return (
    <>
      <Cam pos={[0.9, 1.85, 1.9]} look={[0.7, 1.75, -2.4]} fov={52} f={f} a={a} />
      <KitchenScene t={t} />
      <Pot p={POT_P} pot={{face: 1, laugh: 1, tilt: -potTilt(f), t}}>
        <WaterBlob w={{laugh: 1, boil: 1, t}} />
      </Pot>
      {nf.k < 1 && <Noodles p={nf.p} r={[nf.k * 8, nf.k * 5, 0]} s={1.4} strands={8} t={t} />}
    </>
  );
};

/* 9/10 — cai na cabeça da vaca de patinete: entrega bovina */
const BONK = at(4, "cabeca");
const cowX = (f: number) => -3 + (f - L(4) - 140) * 0.075;
const CowRider: React.FC<{f: number; t: number; hat: boolean; x: number; extra?: CowP}> = ({f, t, hat, x, extra = {}}) => (
  <group position={[x, 0, 0.4]} rotation={[0, Math.PI / 2, 0]}>
    <Scooter p={[0, 0, 0]} spin={-x * 6} />
    <Cow c={{pos: [0, 0.15, -0.12], arms: "hold", armK: 1, miojoHat: hat, t, blink: blinkCurve(f + 17), mouth: 0, lean: 0.06, ...extra}} />
  </group>
);
const S9: React.FC<ShotProps> = ({f, a, t}) => {
  const x = cowX(f);
  const k = clamp((f - (BONK - 18)) / 18);
  const head: V3 = [x, 2.25, 0.4];
  const np = arc([x + 1.6, 7, 0.4], head, easeInOut(k), 0);
  const surprised = ramp(f, BONK, BONK + 4) * (1 - ramp(f, BONK + 30, BONK + 40));
  return (
    <>
      <Cam pos={[x + 0.4, 1.7, 6.2]} look={[x + 0.2, 1.6, 0]} fov={48} f={f} a={a} />
      <StreetScene t={t} target={[x, 0, 0]} />
      <CowRider f={f} t={t} hat={f >= BONK} x={x} extra={{mouth: 0.7 * surprised, headTilt: -0.1 * surprised, headYaw: -0.85}} />
      {f < BONK && k > 0 && <Noodles p={np} r={[k * 6, k * 3, 0]} s={1.2} strands={8} t={t} />}
    </>
  );
};
const S10: React.FC<ShotProps> = ({f, a, t}) => {
  const x = cowX(f);
  const moo = ramp(f, a + 6, a + 12) * (1 - ramp(f, a + 40, a + 50));
  return (
    <>
      <Cam pos={[x + 3.0, 1.6, 4.2]} look={[x + 0.3, 1.5, 0.3]} fov={48} f={f} a={a} />
      <StreetScene t={t} target={[x, 0, 0]} />
      <CowRider f={f} t={t} hat x={x} extra={{mouth: 0.8 * moo, happy: 0, headYaw: -0.35}} />
    </>
  );
};

/* 11/12 — prova, adora, abre o restaurante: empreendedorismo leiteiro */
const OPEN = at(6, "restaurante") - 6;
const S11: React.FC<ShotProps> = ({f, a, t}) => {
  const eat = ramp(f, at(6, "prova") - 4, at(6, "prova") + 6) * (1 - ramp(f, at(6, "adora") - 2, at(6, "adora") + 4));
  const love = ramp(f, at(6, "adora") - 2, at(6, "adora") + 4);
  const open = ramp(f, OPEN, OPEN + 14, easeOut);
  const chef = f >= OPEN + 8;
  return (
    <>
      <Cam pos={[6.6, 1.9, 4.2]} look={[6.0, 1.7, -1.2]} fov={52} f={f} a={a} />
      <StreetScene t={t} target={[6, 0, -2]} />
      <Restaurant p={REST_P} open={open} />
      <Cow c={{pos: [6, 0, -1.2], rotY: 0.1, arms: eat > 0.5 ? "eat" : love > 0.5 && !chef ? "up" : chef ? "hold" : "down", armK: 1, miojoHat: !chef, chef, apron: chef, happy: love > 0.5 && !chef ? 1 : 0, mouth: eat > 0.5 ? 0.4 * Math.abs(Math.sin(f / 2)) : chef ? 0.3 : 0, t, blink: blinkCurve(f + 3)}} />
      <Scooter p={[7.4, 0, -0.6]} rotY={0.4} />
    </>
  );
};
const S12: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 80);
  return (
    <>
      <Cam pos={[lerp(7.4, 7.0, k), 1.8, lerp(3.6, 3.0, k)]} look={[6.0, 1.9, -2.2]} fov={52} f={f} a={a} />
      <StreetScene t={t} target={[6, 0, -2]} />
      <Restaurant p={REST_P} open={1} />
      <Cow c={{pos: CHEF_P, rotY: 0, arms: "up", armK: 0.6 + 0.2 * Math.sin(f / 5), chef: true, apron: true, mouth: 0.4, t, blink: blinkCurve(f + 3)}} />
      {CUSTOMERS.map((lk, i) => (
        <group key={i} position={[4.6 + i * 0.95, 0, -0.9 + (i % 2) * 0.25]} rotation={[0, Math.PI + 0.2 * Math.sin(i), 0]} scale={0.85}>
          <Toy pose={{...idle(f + i * 9), smile: 0.8, rShoulder: [-0.3, 0, -0.15]}} look={lk} />
        </group>
      ))}
    </>
  );
};

/* 13/14/15 — a fila dá a volta no planeta; o último é você */
const QUEUE0 = at(8, "fila") - 6;
const QUEUE1 = at(8, "planeta") + 10;
const queueK = (f: number) => ramp(f, QUEUE0, QUEUE1, easeInOut);
const PlanetBits: React.FC<{f: number; t: number; spin?: number; boy?: boolean}> = ({f, t, spin = 0, boy = true}) => {
  const top = queuePoint(0, 0);
  const n = new THREE.Vector3(...top).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  const end = queuePoint(1.0, 0);
  const ne = new THREE.Vector3(...end).normalize();
  const qe = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), ne);
  return (
    <group rotation={[0, spin, 0]}>
      <Planet t={t} queue={queueK(f)} />
      {/* restaurante pequenininho no começo da fila */}
      <group position={top} quaternion={q} scale={0.09}>
        <Restaurant p={[0, 0, 0]} open={1} />
      </group>
      {boy && queueK(f) > 0.98 && (
        <group position={end} quaternion={qe} scale={0.12}>
          <Toy pose={{...idle(f), rShoulder: [-0.2, 0, -0.5 - 0.3 * Math.abs(Math.sin(f / 6))], brow: 0.8, smile: 0}} look={KID} />
        </group>
      )}
    </group>
  );
};
const S13: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 100);
  return (
    <>
      <Cam pos={[0, lerp(2, 3, k), lerp(14, 11.5, k)]} look={[0, 0.3, 0]} fov={50} f={f} a={a} />
      <SpaceScene />
      <PlanetBits f={f} t={t} spin={-0.3 + k * 0.4} boy={false} />
    </>
  );
};
const endCam = (zoom: number): {pos: V3; look: V3} => {
  const end = new THREE.Vector3(...queuePoint(1.0, 0));
  const n = end.clone().normalize();
  const side = new THREE.Vector3(0, 0, 1).cross(n).normalize();
  const look = end.clone().add(n.clone().multiplyScalar(0.13));
  const far = look.clone().add(n.clone().multiplyScalar(6)).add(side.clone().multiplyScalar(1.5)).add(new THREE.Vector3(0, 0, 4));
  const near = look.clone().add(n.clone().multiplyScalar(0.25)).add(side.clone().multiplyScalar(0.12)).add(new THREE.Vector3(0, 0, 0.55));
  const p = far.clone().lerp(near, zoom);
  return {pos: [p.x, p.y, p.z], look: [look.x, look.y, look.z]};
};
const S14: React.FC<ShotProps> = ({f, a, t}) => {
  const zoom = ramp(f, a, at(8, "voce") - 2, easeInOut);
  const c = endCam(zoom);
  return (
    <>
      <Cam pos={c.pos} look={c.look} fov={44} f={f} a={a} />
      <SpaceScene />
      <PlanetBits f={Math.max(f, QUEUE1 + 2)} t={t} spin={0} />
    </>
  );
};
const S15: React.FC<ShotProps> = ({f, a, t}) => {
  const k = ramp(f, a, a + 100);
  return (
    <>
      <Cam pos={[lerp(-5, -3, k), lerp(4, 2, k), lerp(9, 10, k)]} look={[0, 0, 0]} fov={46} f={f} a={a} />
      <SpaceScene />
      <PlanetBits f={Math.max(f, QUEUE1 + 2)} t={t} spin={0.6 + k * 0.6} />
    </>
  );
};

/* 16/17/18 — acabou o miojo; copo de leite: consolação láctea */
const EMPTY = at(10, "acabou") - 4;
const MILK = at(10, "copo") - 6;
const BOY_C: V3 = [6.1, 0, COUNTER_Z + 0.55];
const CounterShot: React.FC<ShotProps & {stage: 0 | 1 | 2}> = ({f, a, t, stage}) => {
  const palm = useRef<THREE.Object3D>(null);
  const cowPalm = useRef<THREE.Object3D>(null);
  const hasMilk = stage === 2 || (stage === 1 && f >= MILK + 18);
  const sad = stage === 0 ? ramp(f, EMPTY, EMPTY + 8) : 1;
  const pose = physics("balcao" + a, (fr) => {
    const take = stage === 1 ? ramp(fr, MILK + 10, MILK + 18) : stage === 2 ? 1 : 0;
    return {...idle(fr), pos: BOY_C, rotY: stage === 2 ? 0.15 : Math.PI - 0.35, rShoulder: [-1.0 * take, 0, -0.2], rElbow: -1.2 * take, rFist: take, brow: lerp(0.4, 1, sad), smile: lerp(0.6, 0, sad), mouthOpen: stage === 0 ? 0.3 * ramp(fr, EMPTY, EMPTY + 6) : 0, eyeWide: stage === 0 ? 0.4 * ramp(fr, EMPTY, EMPTY + 6) : 0};
  }, a, f);
  const potUp = stage === 0 ? ramp(f, EMPTY - 6, EMPTY + 2) : 0;
  const giving = stage === 1 && f < MILK + 18;
  const cam: {pos: V3; look: V3} =
    stage === 2 ? {pos: [6.35, 1.7, BOY_C[2] + 2.5], look: [6.1, 1.5, BOY_C[2]]} : {pos: [8.3, 2.1, BOY_C[2] + 2.2], look: [6.0, 1.55, CHEF_P[2] + 0.6]};
  return (
    <>
      <Cam pos={cam.pos} look={cam.look} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[6, 0, -2]} />
      <Restaurant p={REST_P} open={1} />
      <Cow c={{pos: CHEF_P, rotY: 0, arms: giving ? "give" : stage === 0 ? "up" : "down", armK: stage === 0 ? 0.55 * potUp + 0.3 : 1, chef: true, apron: true, t, blink: blinkCurve(f + 3), mouth: stage === 0 ? 0.3 : 0.2, headTilt: stage === 0 ? 0.15 : 0}} palmRef={cowPalm} />
      {stage === 0 && (
        <group position={[CHEF_P[0] - 0.1, 1.35 + 0.9 * potUp, CHEF_P[2] + 0.55]} rotation={[0, 0, Math.PI * potUp]}>
          <mesh>
            <cylinderGeometry args={[0.3, 0.27, 0.36, 24, 1, true]} />
            <meshStandardMaterial color="#c8ced6" roughness={0.25} metalness={0.7} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
      {giving && (
        <AtPalmUp palm={cowPalm} offset={[0, -0.12, 0]}>
          <MilkGlass s={1.4} />
        </AtPalmUp>
      )}
      <Toy pose={pose} look={KID} palmRef={palm} />
      {hasMilk && (
        <AtPalmUp palm={palm} offset={[0, -0.13, 0]}>
          <MilkGlass s={1.4} />
        </AtPalmUp>
      )}
    </>
  );
};
const S16: React.FC<ShotProps> = (p) => <CounterShot {...p} stage={0} />;
const S17: React.FC<ShotProps> = (p) => <CounterShot {...p} stage={1} />;
const S18: React.FC<ShotProps> = (p) => <CounterShot {...p} stage={2} />;

/* 19 — parabéns */
const S19: React.FC<ShotProps> = ({f, a, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const pose = physics("parab" + a, (fr) => ({...idle(fr), pos: [5.4, 0, 0.6], rotY: 0.25, rShoulder: [-1.0, 0, -0.2], rElbow: -1.2, rFist: 1, bags: 0.4, brow: 0.9, smile: 0, blink: 0.25 + 0.75 * blinkCurve(fr), head: [0.1, 0.15, 0.08]}), a, f);
  const k = ramp(f, a, a + 200);
  return (
    <>
      <Cam pos={[lerp(6.2, 6.0, k), 1.6, lerp(5.2, 4.6, k)]} look={[6.0, 1.3, 0.3]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[6, 0, 0]} />
      <Restaurant p={REST_P} open={1} />
      <Toy pose={pose} look={KID} palmRef={palm} />
      <AtPalmUp palm={palm} offset={[0, -0.13, 0]}>
        <MilkGlass s={1.4} />
      </AtPalmUp>
      <group position={[6.8, 0, 0.3]} rotation={[0, -0.5, 0]}>
        <Scooter p={[0, 0, 0]} />
        <Cow c={{pos: [0, 0.15, -0.12], arms: "up", armK: 0.7 + 0.2 * Math.sin(f / 4), chef: true, t, mouth: 0.4, blink: blinkCurve(f + 7)}} />
      </group>
    </>
  );
};
/* 20 — outra piada... pra vaca (de braços cruzados) */
const S20: React.FC<ShotProps> = ({f, a, t}) => {
  const pose = physics("final" + a, (fr) => ({...idle(fr), pos: [5.6, 0, 0.5], rotY: 0.7, rShoulder: [-2.3, 0, -0.2], rElbow: -2.0, rWrist: [0.3, 0, 0], brow: 0.7, smile: 0.2, mouthOpen: talk(fr, a + 4, a + 120) * 0.6, head: [0, 0, 0.15]}), a, f);
  const cross = ramp(f, at(13, "outra") - 6, at(13, "outra") + 6);
  return (
    <>
      <Cam pos={[6.2, 1.7, 4.7]} look={[6.2, 1.4, 0.3]} fov={50} f={f} a={a} />
      <StreetScene t={t} target={[6, 0, 0]} />
      <Restaurant p={REST_P} open={1} />
      <Toy pose={pose} look={KID} />
      <Cow c={{pos: [6.75, 0, 0.2], rotY: -0.6, arms: "crossed", armK: easeInOut(cross), chef: true, apron: true, brow: cross, mouth: 0, t, blink: blinkCurve(f + 7), headTilt: -0.1 * cross}} />
    </>
  );
};

const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "primeiro"), Comp: S1},
  {from: L(1), Comp: S2},
  {from: at(1, "entao"), Comp: S3},
  {from: at(1, "porque"), Comp: S4},
  {from: L(2), Comp: S5},
  {from: L(3), Comp: S6},
  {from: L(4), Comp: S7},
  {from: LAUNCH, Comp: S8},
  {from: at(4, "direto"), Comp: S9},
  {from: L(5), Comp: S10},
  {from: L(6), Comp: S11},
  {from: L(7), Comp: S12},
  {from: L(8), Comp: S13},
  {from: at(8, "e", 0), Comp: S14},
  {from: L(9), Comp: S15},
  {from: L(10), Comp: S16},
  {from: at(10, "e", 0), Comp: S17},
  {from: L(11), Comp: S18},
  {from: L(12), Comp: S19},
  {from: L(13), Comp: S20},
];
const Scene: React.FC<{f: number}> = ({f}) => {
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_MIOJO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["miojo", "tres", "minutos", "agua", "ferver", "preguicosa", "piada", "macarrao", "medico", "enrolado", "ferve", "humor", "termico", "panela", "equilibrio", "voando", "janela", "vaca", "patinete", "entrega", "bovina", "adora", "restaurante", "empreendedorismo", "leiteiro", "fila", "planeta", "voce", "intercontinental", "acabou", "copo", "leite", "premio", "consolacao", "lactea", "parabens"]);
/** cronômetro do miojo */
const Timer: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  const secs = Math.max(0, 180 - Math.floor((f - from) / 12));
  const txt = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, "0")}`;
  return (
    <div style={{position: "absolute", top: 290, left: 0, right: 0, display: "flex", justifyContent: "center", transform: `scale(${s})`}}>
      <div style={{background: "#101018", color: "#ff5c5c", fontFamily, fontWeight: 900, fontSize: 110, padding: "6px 40px", borderRadius: 26, border: "7px solid #ff5c5c", letterSpacing: 6}}>⏱ {txt}</div>
    </div>
  );
};
const Bubble: React.FC<{from: number; to: number; text: string; x: number; y: number}> = ({from, to, text, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: x - 360, top: y, width: 720, display: "flex", justifyContent: "center", transform: `scale(${s})`}}>
      <div style={{background: "#fff", color: "#101018", fontFamily, fontWeight: 900, fontSize: 66, padding: "18px 34px", borderRadius: 40, border: "7px solid #101018", textAlign: "center", lineHeight: 1.05, boxShadow: "0 10px 0 rgba(0,0,0,0.25)"}}>{text}</div>
    </div>
  );
};
const Kkk: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1, 2, 3].map((i) => {
        const k = (((f - from) / 26 + i / 4) % 1);
        return (
          <div key={i} style={{position: "absolute", left: 180 + i * 190 + Math.sin(k * 7 + i) * 30, top: 760 - k * 300, fontFamily, fontWeight: 900, fontSize: 70 + 40 * k, color: "#6cc8f2", ...STROKE, WebkitTextStroke: "10px #101018", opacity: Math.min(1, k * 4) * (1 - k), transform: `rotate(${-12 + i * 8}deg)`}}>
            KKK
          </div>
        );
      })}
    </>
  );
};

/* ======================= vídeo ======================= */
const FX = 0.3;
const MUSIC = 0.125;
export const VideoMiojo: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  const pb = L(12);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <StageTitle from={L(3) + 4} to={L(4) - 3} lines={["HUMOR", "TÉRMICO"]} />
      <StageTitle from={L(5) + 4} to={L(6) - 3} lines={["ENTREGA", "BOVINA"]} />
      <StageTitle from={L(7) + 4} to={L(8) - 3} lines={["EMPREENDEDORISMO", "LEITEIRO"]} />
      <StageTitle from={L(9) + 4} to={L(10) - 3} lines={["FILA", "INTERCONTINENTAL"]} />
      <StageTitle from={L(11) + 4} to={L(12) - 3} lines={["CONSOLAÇÃO", "LÁCTEA"]} />

      <Timer from={4} to={at(0, "primeiro") - 2} />
      <Zzz from={at(0, "primeiro") + 4} to={at(1, "entao") - 2} x={560} y={760} />
      <Bubble from={at(1, "por") - 2} to={at(1, "porque") - 2} text="Por que o macarrão foi ao médico?" x={540} y={330} />
      <Bubble from={at(1, "porque") - 2} to={L(2) - 2} text="Porque tava todo ENROLADO! 🍝" x={540} y={330} />
      <Kkk from={L(2) + 4} to={L(4) - 2} />
      <Chip from={at(4, "patinete") - 2} to={L(5) - 2} text="🐄 + 🛴" bg="#2ecc71" top={300} size={100} />
      <Chip from={at(6, "adora") - 2} to={at(6, "e", 0) - 2} text="😍 AMEI!" bg="#ff4d6d" top={300} size={100} />
      <Chip from={at(8, "dez") - 2} to={L(9) - 2} text="+10 MINUTOS" bg="#3a86ff" top={300} size={84} />
      <Chip from={at(8, "voce") - 2} to={L(9) - 2} text="👇 VOCÊ" bg="#e8412c" top={1450} size={90} rot={3} />
      <Chip from={at(10, "acabou") - 2} to={at(10, "e", 0) - 2} text="ACABOU 😢" bg="#5a6b8a" top={300} size={100} />
      <Sparkles from={L(3)} to={L(4) - 2} x={540} y={900} />
      <Confetti from={pb} to={pb + 100} />
      <Chip from={pb + 1} to={at(12, "voce") - 2} text="PARABÉNS!" bg="#ff4d6d" top={280} size={110} />
      <Sticker from={at(12, "volta")} to={L(13) - 2} x={250} y={420} rot={-6} label="VOLTA NO MUNDO">
        <g transform="translate(152,105)">
          <circle r={70} fill="#2f8fe0" stroke="#101018" strokeWidth={6} />
          <ellipse cx={-20} cy={-15} rx={28} ry={18} fill="#5cbf4a" />
          <ellipse cx={25} cy={25} rx={22} ry={14} fill="#5cbf4a" />
        </g>
      </Sticker>
      <Sticker from={at(12, "miojo")} to={L(13) - 2} x={830} y={430} rot={5} label="SEM MIOJO">
        <g transform="translate(152,105)">
          <rect x={-70} y={-45} width={140} height={90} rx={14} fill="#e8262d" stroke="#101018" strokeWidth={6} />
          <text x={0} y={12} textAnchor="middle" fontFamily={fontFamily} fontWeight={900} fontSize={40} fill="#ffd21f">MIOJO</text>
        </g>
        <Cross />
      </Sticker>
      <Sticker from={at(12, "leite")} to={L(13) - 2} x={540} y={1060} rot={-3} label="1 COPO DE LEITE">
        <g transform="translate(152,105)">
          <path d="M -40 -60 L 40 -60 L 32 70 L -32 70 Z" fill="#dff3ff" stroke="#101018" strokeWidth={6} />
          <path d="M -37 -30 L 37 -30 L 32 70 L -32 70 Z" fill="#ffffff" />
        </g>
      </Sticker>

      <Captions words={words} keys={KEYS} />

      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozmiojo.mp3")} />
      <Audio src={staticFile("trilha-galo.mp3")} volume={(fr) => MUSIC * clamp(fr / 20) * (1 - ramp(fr, TOTAL_MIOJO - 30, TOTAL_MIOJO))} />
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 3} durationInFrames={25}>
          <Audio src={staticFile("sfx7/whoosh.mp3")} volume={FX * 0.18} />
        </Sequence>
      ))}
      {[L(3), L(5), L(7), L(9), L(11)].map((b) => (
        <Sequence key={"b" + b} from={b + 3} durationInFrames={32}>
          <Audio src={staticFile("sfx7/boing.mp3")} volume={FX * 0.75} />
        </Sequence>
      ))}
      <Sequence from={0} durationInFrames={at(0, "primeiro")}>
        <Audio src={staticFile("sfx10/tick.mp3")} volume={FX * 0.6} loop />
      </Sequence>
      <Sequence from={at(0, "primeiro")} durationInFrames={at(1, "entao") - at(0, "primeiro")}>
        <Audio src={staticFile("sfx7/snore.mp3")} volume={FX * 0.4} />
      </Sequence>
      <Sequence from={at(1, "enrolado") + 6} durationInFrames={L(4) - at(1, "enrolado")}>
        <Audio src={staticFile("sfx10/giggle.mp3")} volume={(fr) => FX * 0.7 * clamp(fr / 8)} loop />
      </Sequence>
      <Sequence from={BOIL - 6} durationInFrames={LAUNCH - BOIL + 10}>
        <Audio src={staticFile("sfx10/bubble.mp3")} volume={FX * 0.55} loop />
      </Sequence>
      <Sequence from={at(4, "ri") - 4} durationInFrames={LAUNCH - at(4, "ri") + 6}>
        <Audio src={staticFile("sfx10/rattle.mp3")} volume={FX * 0.6} loop />
      </Sequence>
      <Sequence from={LAUNCH} durationInFrames={45}>
        <Audio src={staticFile("sfx10/fly.mp3")} volume={FX * 0.8} />
      </Sequence>
      <Sequence from={at(4, "direto")} durationInFrames={L(6) - at(4, "direto")}>
        <Audio src={staticFile("sfx10/scooter.mp3")} volume={FX * 0.5} loop />
      </Sequence>
      <Sequence from={BONK - 1} durationInFrames={30}>
        <Audio src={staticFile("sfx10/bonk.mp3")} volume={FX * 0.9} />
      </Sequence>
      <Sequence from={L(5) + 6} durationInFrames={60}>
        <Audio src={staticFile("sfx10/moo.mp3")} volume={FX * 0.42} />
      </Sequence>
      <Sequence from={OPEN} durationInFrames={30}>
        <Audio src={staticFile("sfx7/pof.mp3")} volume={FX * 0.7} />
      </Sequence>
      <Sequence from={OPEN + 10} durationInFrames={30}>
        <Audio src={staticFile("sfx10/ding.mp3")} volume={FX * 0.7} />
      </Sequence>
      <Sequence from={L(7) + 10} durationInFrames={30}>
        <Audio src={staticFile("sfx10/ding.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={QUEUE0} durationInFrames={L(10) - QUEUE0}>
        <Audio src={staticFile("sfx10/queue.mp3")} volume={(fr) => FX * 0.5 * clamp(fr / 15)} loop />
      </Sequence>
      <Sequence from={EMPTY} durationInFrames={60}>
        <Audio src={staticFile("sfx10/sad.mp3")} volume={FX * 0.7} />
      </Sequence>
      <Sequence from={MILK + 14} durationInFrames={30}>
        <Audio src={staticFile("sfx10/plim.mp3")} volume={FX * 0.8} />
      </Sequence>
      {[at(12, "volta"), at(12, "miojo"), at(12, "leite")].map((p, i) => (
        <Sequence key={"p" + i} from={p} durationInFrames={22}>
          <Audio src={staticFile("sfx7/pof.mp3")} volume={FX * 0.55} />
        </Sequence>
      ))}
      <Sequence from={pb - 2} durationInFrames={61}>
        <Audio src={staticFile("sfx7/confetti.mp3")} volume={FX * 0.6} />
      </Sequence>
      <Sequence from={at(13, "vaca") - 4} durationInFrames={60}>
        <Audio src={staticFile("sfx10/moo.mp3")} volume={FX * 0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};
