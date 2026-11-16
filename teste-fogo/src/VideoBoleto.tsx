import React, {useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Img, Sequence, staticFile, useCurrentFrame} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import type {Pose} from "./Boy";
import {Toy, ToyLook} from "./Toy";
import {Post} from "./Post";
import {fontFamily} from "./Video";
import {Sky, SunLight, House, V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {Ants, Goal} from "./Sets17";
import {Bg} from "./Sets20";
import {Boleto, Watermelon, Goat, CpfCard, BankOffice, Stamp, CoconutTree, JetSki, Pelican, Rapadura, River} from "./Sets23";
import {Captions, StageTitle, Confetti, Wd, clean} from "./Overlays";
import {FPS, clamp, lerp, ramp, pop, easeInOut, easeOut, canvasTex, rng} from "./util";
import W from "./timingBoleto.json";

const words = W as Wd[];
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w) === clean(txt));
  if (list.length <= n) throw new Error(`palavra não encontrada: ${i} ${txt} ${n}`);
  return F(list[n].s);
};
export const TOTAL_BOLETO = F(words[words.length - 1].e + 0.9);

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
const CHORANDO0 = at(0, "chorando");
const CEARA0 = at(0, "ceara");
const ENTAO0 = at(0, "entao");
const BODE0 = at(0, "bode");
const COME1 = at(1, "come");
const CPF1 = at(1, "cpf");
const BANCO3 = at(3, "banco");
const GERENTE3 = at(3, "gerente");
const ASSINA3 = at(3, "assina");
const APROVA4 = at(4, "aprova");
const COQUEIRO4 = at(4, "coqueiro");
const DOCUMENTO4 = at(4, "documento");
const COCO4 = at(4, "coco");
const JET5 = at(5, "jet");
const RIO5 = at(5, "rio");
const PELICANO5 = at(5, "pelicano");
const VENCE7 = at(7, "vence");
const RAPADURA7 = at(7, "rapadura");
const DOZE7 = at(7, "doze");
const DOCE8 = at(8, "doce");
const FORMIGAS8 = at(8, "formigas");
const CARTAO8 = at(8, "cartao");
const PARABENS10 = at(10, "parabens");
const BOLETO10 = at(10, "boleto");
const GERENTE10 = at(10, "gerente");
const COQUEIRO10 = at(10, "coqueiro");
const PAGO10 = at(10, "pago");
const BODE11 = at(11, "bode");

/* =================== o sertão do Ceará =================== */
const Sertao: React.FC<{table?: boolean}> = ({table = true}) => (
  <>
    <Bg c="#ffd59a" />
    <hemisphereLight args={["#fff2d8", "#a08a5e", 1.1]} />
    <directionalLight position={[4, 9, 6]} intensity={2.4} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#e3b878", 0.95)} receiveShadow>
      <planeGeometry args={[80, 80]} />
    </mesh>
    {[[-3.5, -4], [3.8, -5], [-5.5, -9], [5.5, -10], [0.5, -12]].map(([x, z], i) => (
      <group key={i} position={[x, 0, z]}>
        <mesh position={[0, 0.9, 0]} material={sm("#3f8a3a", 0.8)} castShadow>
          <capsuleGeometry args={[0.22, 1.4, 6, 10]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.35 * sd, 1.1 + (sd > 0 ? 0.2 : 0), 0]} rotation={[0, 0, -0.4 * sd]} material={sm("#3f8a3a", 0.8)}>
            <capsuleGeometry args={[0.13, 0.5, 6, 8]} />
          </mesh>
        ))}
      </group>
    ))}
    {table && <mesh position={[0, 0.39, 0]} geometry={rbox(1.6, 0.06, 1.0, 0.02)} material={sm("#8a5a33", 0.6)} castShadow />}
    {table &&
      [[-0.7, -0.4], [0.7, -0.4], [-0.7, 0.4], [0.7, 0.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.19, z]} material={sm("#6b4a2a", 0.6)}>
          <cylinderGeometry args={[0.04, 0.04, 0.38, 6]} />
        </mesh>
      ))}
  </>
);
const S0: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.4, 2.6]} look={[0, 0.75, 0]} fov={50} f={f} a={a} />
    <Sertao />
    <Watermelon p={[0, 0.42, 0]} s={1} open={1} />
    <Boleto p={[0, 1.05 + 0.03 * Math.sin(t * 4), 0.05]} r={[-0.1, 0, 0.05 * Math.sin(t * 3)]} s={0.85} t={t} cry={f >= CHORANDO0 - 4 ? 1 : 0} />
  </>
);
/* o goleiro aposentado, que é um bode */
const S0b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.3, 1.3, 3.6]} look={[0, 0.9, 0]} fov={52} f={f} a={a} />
    <Sertao table={false} />
    <Goal p={[0, 0, -1.2]} />
    <Goat p={[0, 0, 0]} rotY={0} s={1.2} t={t} blink={blinkCurve(f)} gloves />
  </>
);
/* o bode come o boleto */
const S1: React.FC<ShotProps> = ({f, a, t}) => {
  const bite = easeInOut(ramp(f, COME1 - 2, COME1 + 30));
  const cpf = easeOut(ramp(f, CPF1 - 2, CPF1 + 10));
  return (
    <>
      <Cam pos={[1.2, 1.45, 3.3]} look={[-0.15, 0.85, 0]} fov={54} f={f} a={a} />
      <Sertao />
      {bite < 0.85 && <Watermelon p={[0.55, 0.42, 0]} s={1} open={1} bite={bite * 0.9} />}
      {bite < 0.3 && <Boleto p={[0.55, 1.05, 0.05]} r={[-0.1, 0, 0]} s={0.85} t={t} cry={1} mood="scared" />}
      <Goat p={[-0.95, 0, 0.1]} rotY={Math.PI / 2 - 0.2} s={1.2} t={t} blink={blinkCurve(f)} chew={f >= COME1 ? 1 : 0} gloves />
      {cpf > 0 && <CpfCard p={[-0.3, 1.9 + 0.05 * Math.sin(t * 3), 0.3]} r={[0, -0.4, 0]} s={1.4 * cpf} />}
    </>
  );
};
const S2: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.5, 3.4]} look={[0, 1.2, 0]} fov={52} f={f} a={a} />
    <Sertao table={false} />
    <Goat p={[0, 0, 0]} rotY={0.2} s={1.2} t={t} blink={blinkCurve(f)} gloves />
    <CpfCard p={[0, 2.0 + 0.05 * Math.sin(t * 3), 0.4]} r={[0, 0, 0.1 * Math.sin(t * 2)]} s={1.6} />
  </>
);
/* o bode gerente do banco */
const BankScene: React.FC<{f: number; a: number; t: number; tie?: boolean; stamp?: boolean; sweet?: number; tree?: boolean; rap?: number; ants?: boolean; cam?: "wide" | "desk"}> = ({f, a, t, tie, stamp, sweet = 0, tree, rap = 0, ants, cam = "desk"}) => (
  <>
    <Cam pos={cam === "wide" ? [0.45, 1.8, 4.0] : [0.2, 1.6, 3.2]} look={cam === "wide" ? [0.4, 1.2, -0.5] : [0, 1.1, -0.6]} fov={54} f={f} a={a} />
    <Bg c="#cfe8ff" />
    <hemisphereLight args={["#ffffff", "#8090a0", 1.0]} />
    <pointLight position={[0, 3.4, 1.5]} intensity={10} distance={12} decay={1.4} castShadow />
    <BankOffice sweet={sweet} />
    <Goat p={[0, 0, -1.35]} rotY={0} s={1.15} t={t} blink={blinkCurve(f)} tie={tie} stamp={stamp ? Math.max(0, Math.sin(t * 10)) : 0} />
    {stamp && <Stamp p={[0.15, 0.84 + 0.08 * Math.max(0, Math.sin(t * 10)), -0.25]} s={1.4} />}
    {tree && <CoconutTree p={[1.15, 0, 0.3]} s={0.6} t={t} lean={0.05} />}
    {rap > 0 &&
      Array.from({length: Math.round(rap)}, (_, i) => <Rapadura key={i} p={[-0.6 + (i % 4) * 0.34, 0.9 + Math.floor(i / 4) * 0.13, -0.3 + (i % 2) * 0.05]} r={[0, 0.1 * i, 0]} />)}
    {ants && <Ants from={[-3.5, 0.0, 0.6]} to={[-0.4, 0.86, -0.2]} n={30} t={t} s={2.6} />}
  </>
);
const S3: React.FC<ShotProps> = ({f, a, t}) => <BankScene f={f} a={a} t={t} tie={f >= GERENTE3 - 4} stamp={f >= ASSINA3} cam="wide" />;
const S4a: React.FC<ShotProps> = ({f, a, t}) => <BankScene f={f} a={a} t={t} tie stamp />;
const S4b: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <BankScene f={f} a={a} t={t} tie tree cam="wide" />
    {f >= COCO4 - 2 && [0, 1, 2].map((i) => <mesh key={i} position={[1.4 - i * 0.25, Math.max(0.92, 2.6 - (f - COCO4) * 0.12 - i * 0.2), -0.1 + i * 0.1]} material={sm("#6b4a2a", 0.7)}><sphereGeometry args={[0.1, 12, 10]} /></mesh>)}
  </>
);
/* o coqueiro de jet ski no rio São Francisco */
const JetScene: React.FC<ShotProps> = ({f, a, t}) => {
  const s2 = (f - a) / FPS;
  const x = s2 * 3;
  return (
    <>
      <Cam pos={[x + 1.3, 1.6, 4.4]} look={[x + 0.2, 1.05, 0]} fov={56} f={f} a={a} punch={4} />
      <Sky />
      <hemisphereLight args={["#ffffff", "#5a8aa8", 1.1]} />
      <directionalLight position={[4, 8, 6]} intensity={2.2} castShadow />
      <River t={t} />
      {[-12, -4, 6, 14].map((xx, i) => <CoconutTree key={i} p={[Math.round(x / 30) * 30 + xx, 0, -9 - (i % 2)]} s={1} face={false} t={t} lean={0.15 * (i % 2 ? 1 : -1)} />)}
      <group position={[x, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
        <JetSki p={[0, 0, 0]} t={t} s={1.1} />
        <group position={[0, 0.55, 0.2]}>
          <CoconutTree p={[0, 0, 0]} s={0.5} t={t} lean={-0.1} />
        </group>
        {f >= PELICANO5 - 6 && <Pelican p={[0, 0.6, -0.55]} rotY={0} s={0.8} t={t} />}
      </group>
    </>
  );
};
const S7: React.FC<ShotProps> = ({f, a, t}) => <BankScene f={f} a={a} t={t} tie tree rap={f >= RAPADURA7 - 2 ? (f >= DOZE7 ? 12 : 1 + Math.floor((f - RAPADURA7) / 6)) : 0} cam="wide" />;
const S8: React.FC<ShotProps> = ({f, a, t}) => <BankScene f={f} a={a} t={t} tie rap={12} sweet={easeOut(ramp(f, DOCE8 - 4, DOCE8 + 30))} ants={f >= FORMIGAS8 - 4} cam="wide" />;
const S9: React.FC<ShotProps> = ({f, a, t}) => <BankScene f={f} a={a} t={t} tie rap={12} sweet={1} ants cam="wide" />;
/* parabéns: recapitulação */
const S10: React.FC<ShotProps> = (p) => {
  const {f} = p;
  if (f >= PAGO10 - 3) return <S7 {...p} f={DOZE7 + 10} a={PAGO10 - 3} />;
  if (f >= COQUEIRO10 - 3) return <JetScene {...p} a={COQUEIRO10 - 3} />;
  if (f >= GERENTE10 - 3) return <BankScene f={f} a={GERENTE10 - 3} t={p.t} tie stamp />;
  if (f >= BOLETO10 - 3) return <S1 {...p} f={COME1 + 10 + (f - BOLETO10)} a={BOLETO10 - 3} />;
  return <S2 {...p} />;
};
/* final: o bode na sua porta, cobrando */
const S11: React.FC<ShotProps> = ({f, a, t}) => (
  <>
    <Cam pos={[0.2, 1.45, 4.3]} look={[0, 1.1, 0]} fov={52} f={f} a={a} />
    <DayOut />
    <House p={[0, 0, -1.8]} w={3.6} h={2.8} d={3} wall="#ffd166" roof="#e8414f" />
    <Goat p={[0.3, 0, 0.2]} rotY={-0.4} s={1.2} t={t} blink={blinkCurve(f)} tie />
    <Boleto p={[0.08, 1.3, 1.0]} r={[0, -0.3, 0]} s={0.6} t={t} mood="scared" />
  </>
);

/* ---------- lista de cenas ---------- */
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: ENTAO0 - 4, Comp: S0b},
  {from: L(1), Comp: S1},
  {from: L(2), Comp: S2},
  {from: L(3), Comp: S3},
  {from: L(4), Comp: S4a},
  {from: COQUEIRO4 - 4, Comp: S4b},
  {from: L(5), Comp: JetScene},
  {from: L(6), Comp: JetScene},
  {from: L(7), Comp: S7},
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
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? TOTAL_BOLETO} t={f / FPS} />
      <Post bloom={0.5} />
    </>
  );
};

/* ======================= camadas 2D ======================= */
const KEYS = new Set(["boleto", "chorando", "melancia", "ceara", "goleiro", "aposentado", "bode", "come", "cpf", "contabilidade", "caprina", "banco", "gerente", "casco", "emprestimo", "coqueiro", "documento", "coco", "jet", "ski", "rio", "sao", "francisco", "buzinando", "pelicano", "financiamento", "tropical", "parcela", "vence", "rapadura", "doze", "rapaduras", "doce", "formigas", "conta", "cartao", "credito", "economia", "acucarada", "parabens", "pago", "seguir", "perfil", "pessoalmente"]);
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
const MapCeara: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const d = BR.map(([lo, la], i) => `${i ? "L" : "M"} ${projBR(lo, la)[0].toFixed(0)} ${projBR(lo, la)[1].toFixed(0)}`).join(" ") + " Z";
  const P = projBR(-38.5, -3.9);
  const drop = Math.min(1, (f - from) / 10);
  return (
    <AbsoluteFill style={{background: "#7fc8ff"}}>
      <svg width={1080} height={1920}>
        <path d={d} fill="#ffc35a" stroke="#c9822a" strokeWidth={8} strokeLinejoin="round" />
      </svg>
      <div style={{position: "absolute", left: P[0], top: P[1] - 200 * (1 - drop), transform: "translate(-50%,-100%)", fontSize: 110}}>🍉</div>
      <div style={{position: "absolute", left: P[0], top: P[1] + 20, transform: "translateX(-50%)", background: "#ffffff", border: "5px solid #101018", fontFamily, fontWeight: 900, fontSize: 44, padding: "4px 16px"}}>CEARÁ</div>
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
  [L(2), ["CONTABILIDADE", "CAPRINA"]],
  [L(6), ["FINANCIAMENTO", "TROPICAL"]],
  [L(9), ["ECONOMIA", "AÇUCARADA"]],
];
const FOLLOW_FROM = L(11) + 6;
const FOLLOW_TAP = FOLLOW_FROM + 50;
export const VideoBoleto: React.FC = () => {
  const f = useCurrentFrame();
  const cuts = SHOTS.slice(1).map((s) => s.from);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={1080} height={1920} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>

      <MapCeara from={CEARA0 - 2} to={ENTAO0 - 6} />
      {TITLES.map(([x, lines], i) => {
        const next = [L(3), L(7), L(10)][i];
        return <StageTitle key={i} from={x + 4} to={next - 3} lines={lines} />;
      })}

      <Ono from={4} to={CHORANDO0 - 6} text="?" x={540} y={470} size={200} color="#ffd21f" rot={8} />
      <Ono from={CHORANDO0} to={CEARA0 - 4} text="BUÁÁÁ!" size={140} color="#9fe0ff" />
      <Tag from={BODE0} to={L(1) - 2} text="GOLEIRO APOSENTADO" />
      <Ono from={COME1} to={CPF1 - 4} text="NHAC!" />
      <Tag from={CPF1 + 4} to={L(2) - 2} text="CPF NA HORA" />
      <Tag from={GERENTE3} to={ASSINA3 - 3} text="GERENTE" />
      <Ono from={ASSINA3 + 6} to={L(4) - 2} text="TUM! TUM!" size={130} color="#ffffff" />
      <Ono from={APROVA4} to={COQUEIRO4 - 6} text="APROVADO!" size={130} color="#2ecc71" />
      <Tag from={DOCUMENTO4} to={COCO4 - 3} text="SEM DOCUMENTO" />
      <Tag from={COCO4} to={L(5) - 2} text="MAS TEM COCO" />
      <Tag from={RIO5} to={PELICANO5 - 3} text="RIO SÃO FRANCISCO" />
      <Ono from={at(5, "buzinando")} to={PELICANO5 - 3} text="BIIII-BIII!" y={640} size={110} color="#ffd21f" />
      <Tag from={PELICANO5} to={L(6) - 2} text="PELICANO NA GARUPA" />
      <Tag from={VENCE7} to={RAPADURA7 - 3} text="PARCELA VENCIDA" />
      <BigNum from={DOZE7} to={L(8) - 2} text="12 RAPADURAS" size={110} />
      <Tag from={FORMIGAS8 + 6} to={CARTAO8 - 3} text="CONTA DAS FORMIGAS" />
      <Tag from={CARTAO8} to={L(9) - 2} text="CARTÃO DE CRÉDITO" />
      <Confetti from={PARABENS10} to={PARABENS10 + 60} />
      <Ono from={BODE11 + 6} to={TOTAL_BOLETO - 70} text="TOC TOC!" size={120} color="#ffffff" />

      <Captions words={words} keys={KEYS} />
      <FollowCard from={FOLLOW_FROM} to={TOTAL_BOLETO - 1} tap={FOLLOW_TAP} />

      {/* ---------- áudio (sem música de fundo) ---------- */}
      <Audio src={staticFile("vozboleto.mp3")} />
      {cuts.map((c) => (
        <SND key={"w" + c} src="sfx7/whoosh.mp3" from={c - 3} dur={25} v={FXV * 0.15} />
      ))}
      {TITLES.map(([x]) => (
        <SND key={"t" + x} src="sfx12/tada.mp3" from={x + 4} dur={40} v={FXV * 0.2} />
      ))}
      <SND src="sfx9/sniffle.mp3" from={CHORANDO0} dur={40} v={FXV * 0.35} />
      <SND src="sfx3/whistle.mp3" from={BODE0 - 4} dur={25} v={FXV * 0.3} />
      <SND src="sfx6/chew.mp3" from={COME1} dur={40} v={FXV * 0.4} />
      <SND src="sfx10/ding.mp3" from={CPF1 + 2} dur={30} v={FXV * 0.3} />
      <SND src="sfx9/stamp.mp3" from={ASSINA3 + 6} dur={20} v={FXV * 0.4} />
      <SND src="sfx9/stamp.mp3" from={ASSINA3 + 20} dur={20} v={FXV * 0.4} />
      <SND src="sfx9/stamp.mp3" from={APROVA4} dur={20} v={FXV * 0.45} />
      <SND src="sfx7/pof.mp3" from={COCO4 + 2} dur={20} v={FXV * 0.4} />
      <SND src="sfx10/scooter.mp3" from={JET5} dur={L(7) - JET5} v={FXV * 0.25} />
      <SND src="sfx14/buzina.mp3" from={at(5, "buzinando")} dur={30} v={FXV * 0.3} />
      <SND src="sfx7/cash.mp3" from={RAPADURA7} dur={30} v={FXV * 0.35} />
      <SND src="sfx10/queue.mp3" from={FORMIGAS8} dur={L(9) - FORMIGAS8} v={FXV * 0.25} />
      <SND src="sfx7/confetti.mp3" from={PARABENS10} dur={50} v={FXV * 0.4} />
      <SND src="sfx5/knock.mp3" from={BODE11 + 6} dur={30} v={FXV * 0.45} />
      <SND src="sfx2/click.mp3" from={FOLLOW_TAP - 2} dur={20} v={FXV * 0.8} />
    </AbsoluteFill>
  );
};
