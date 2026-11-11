import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame} from "@react-three/fiber";
import {Boy, Pose, Look} from "./Boy";
import {Steam} from "./Fire";
import {Post} from "./Post";
import {physics} from "./Physics";
import {Cam, TitleTag, Flash, fontFamily} from "./Video";
import {Pharmacy, Bag, Portal, Birmingham, ClockShop, Carriage, TimeBubble, ClockWindow, BellTower} from "./Sets3";
import {Bread, HoneyJar, CandleBody, Pigeon, Sewer} from "./Sets4";
import {Flame, FireLight} from "./Fire";
import {InteriorLights, Box} from "./Sets";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import W from "./timingAnc.json";

type V3 = [number, number, number];
type Wd = {w: string; s: number; e: number; line: number};
const words = W as Wd[];

/* ---------- linha do tempo amarrada na narração ---------- */
const clean = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const F = (sec: number) => Math.round(sec * FPS);
const L = (i: number) => F(words.find((w) => w.line === i)!.s);
const at = (i: number, txt: string, n = 0) => {
  const list = words.filter((w) => w.line === i && clean(w.w).startsWith(clean(txt)));
  const w = list[Math.min(n, list.length - 1)];
  if (!w) throw new Error(`palavra não encontrada: ${i} ${txt}`);
  return F(w.s);
};
export const TOTAL_ANC = F(words[words.length - 1].e + 1.6);

/* ---------- personagens (estilo palito) ---------- */
const DAVI: Look = {palito: true, skin: "#b77b4e", hair: "#17110c", hairStyle: "short", shirt: "#f1efe8", trim: "#c9c4b5", pants: "#34507a", shorts: true, slim: 0.8};
const AFINADOR: Look = {palito: true, skin: "#e6cbb5", hair: "#2a2a2a", hairStyle: "short", shirt: "#3a3540", trim: "#222", pants: "#2a2830", coat: "#2a2430", scarf: "#7a1a1a", glasses: true};
const AGNES: Look = {palito: true, skin: "#f0c8a8", hair: "#dcdcdc", hairStyle: "short", shirt: "#6a3a5a", trim: "#4a2a3a", pants: "#4a2a3a", coat: "#5a2a4a", glasses: true};
const POVO: Look[] = [
  {palito: true, shirt: "#7a6a52", pants: "#3a3530", hair: "#3a2a1a", hairStyle: "short", skin: "#e8c0a0", cap: "#4a3a2a"},
  {palito: true, shirt: "#5a6a7a", pants: "#2e3038", hair: "#1a1a1a", hairStyle: "short", skin: "#c68a5a"},
  {palito: true, shirt: "#8a3a3a", pants: "#3a3030", hair: "#6a4a2a", hairStyle: "short", skin: "#f0d0b0", coat: "#5a4030"},
  {palito: true, shirt: "#4a5a3a", pants: "#2a2a2a", hair: "#b07a3a", hairStyle: "short", skin: "#e8c0a0", cap: "#2a3a4a"},
  {palito: true, shirt: "#6a5a7a", pants: "#3a3040", hair: "#2a1a10", hairStyle: "short", skin: "#8d5a3a", coat: "#3a3a4a"},
];

/* ---------- utilidades de pose ---------- */
const blinkCurve = (f: number) => clamp(1 - Math.abs(((f + 20) % 97) - 3) / 3);
const idle = (f: number, extra: Pose = {}): Pose => ({breathe: Math.sin((f / FPS) * 2.4), blink: blinkCurve(f), ...extra});
const kick = (f: number, a: number, len = 6) => (f < a ? 0 : Math.exp(-(f - a) / len));
const walkP = (f: number, a: number, rate = 1.5): Pose => {
  const ph = ((f - a) / FPS) * Math.PI * 2 * rate;
  return {walk: ph, walkAmt: 1, rShoulder: [Math.sin(ph) * 0.35, 0, -0.1], lShoulder: [-Math.sin(ph) * 0.35, 0, 0.1], rElbow: -0.35, lElbow: -0.35};
};
const talk = (f: number, a: number, b: number) => (f >= a && f < b ? 0.15 + 0.35 * Math.abs(Math.sin(f / 2.3)) : 0);
const hum = (f: number) => 0.18 + 0.04 * Math.sin(f / 3);
/** mãos tapando os ouvidos */
const earsCovered = (k: number): Pose => ({rShoulder: [-2.2 * k, 0, -0.08 - 0.22 * k], lShoulder: [-2.2 * k, 0, 0.08 + 0.22 * k], rElbow: -0.15 - 1.85 * k, lElbow: -0.15 - 1.85 * k, rWrist: [0, 0, 0.5 * k], lWrist: [0, 0, -0.5 * k]});

type ShotProps = {f: number; a: number; b: number; t: number};
type Shot = {from: number; Comp: React.FC<ShotProps>};

/** coloca filhos na posição da palma da mão */
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

const Day: React.FC<{t: number; vw?: number; vb?: boolean}> = ({t, vw, vb}) => (
  <>
    <color attach="background" args={["#b9ae94"]} />
    <fog attach="fog" args={["#b8a888", 5, 26]} />
    <hemisphereLight args={["#f0e2c0", "#4a3a2a", 0.9]} />
    <directionalLight position={[-4, 7, 5]} intensity={2.2} color="#ffe2b0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.0004} shadow-normalBias={0.02} />
    <Birmingham t={t} v="day" vitrineWobble={vw} vitrineBroken={vb} />
  </>
);
const Night: React.FC<{t: number; swing: number; crack: number}> = ({t, swing, crack}) => (
  <>
    <color attach="background" args={["#151826"]} />
    <fog attach="fog" args={["#151826", 6, 30]} />
    <hemisphereLight args={["#5a6a98", "#1a1410", 0.55]} />
    <directionalLight position={[3, 8, 4]} intensity={0.6} color="#9db4ff" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={7} shadow-camera-bottom={-7} />
    <Birmingham t={t} v="night" plaza />
    <BellTower t={t} swing={swing} crack={crack} p={[0, 0, -7.5]} />
    <pointLight position={[0, 7, -5.8]} color="#ffd890" intensity={4} distance={6} />
  </>
);
const Shop: React.FC<{t: number}> = ({t}) => (
  <>
    <color attach="background" args={["#1a120c"]} />
    <InteriorLights color="#ffd8a0" key1={[1.5, 2.8, 2.0]} power={0.8} />
    <pointLight position={[0.4, 1.6, -0.3]} color="#ffc070" intensity={2.5} distance={4} />
    <ClockShop t={t} />
  </>
);
const Dark: React.FC = () => <color attach="background" args={["#0a1222"]} />;
const PanelScene: React.FC<{C: React.FC<ShotProps>; a: number}> = ({C, a}) => {
  const f = useCurrentFrame();
  return (
    <>
      <C f={f} a={a} b={TOTAL_ANC} t={f / FPS} />
      <Post />
    </>
  );
};
const Panel: React.FC<{top: number; letter: string; label: string; active: boolean; C: React.FC<ShotProps>; a: number}> = ({top, letter, label, active, C, a}) => {
  const f = useCurrentFrame();
  return (
    <div style={{position: "absolute", top, left: 20, width: 1040, height: 720, borderRadius: 26, overflow: "hidden", border: `7px solid ${active ? "#ffd21f" : "rgba(160,190,230,0.55)"}`, boxShadow: active ? "0 0 38px rgba(255,210,31,0.75)" : "0 0 18px rgba(0,0,0,0.5)", transform: `scale(${(active ? 1.015 : 1) * Math.min(1, pop(f, a, 10))})`}}>
      <ThreeCanvas width={1026} height={706} shadows gl={{antialias: false}} dpr={1}>
        <PanelScene C={C} a={a} />
      </ThreeCanvas>
      {!active && <AbsoluteFill style={{background: "rgba(10,20,40,0.35)"}} />}
      <div style={{position: "absolute", top: 22, left: 22, width: 104, height: 104, borderRadius: 52, background: "#0d1b33", border: `6px solid ${active ? "#ffd21f" : "#9fb8dc"}`, color: active ? "#ffd21f" : "#fff", fontFamily, fontWeight: 900, fontSize: 66, display: "flex", alignItems: "center", justifyContent: "center"}}>{letter}</div>
      <div style={{position: "absolute", bottom: 20, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 56, color: "#fff", WebkitTextStroke: "8px #0d1b33", paintOrder: "stroke fill", textTransform: "uppercase"}}>{label}</div>
    </div>
  );
};

const STROKE = {WebkitTextStroke: "10px #0a0f18", paintOrder: "stroke fill" as const};
const TXT = {fontFamily, fontWeight: 900, fill: "#fff", stroke: "#0a0f18", strokeWidth: 10, paintOrder: "stroke" as const};

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
      if (/[.:…?,!]$/.test(w.w)) {
        out.push(cur);
        cur = [];
      }
    }
    if (cur.length) out.push(cur);
    return out;
  }, []);
  const t = f / FPS;
  const i = chunks.findIndex((c, k) => t >= c[0].s - 0.05 && t < (chunks[k + 1]?.[0].s ?? c[c.length - 1].e + 0.8) - 0.05);
  if (i < 0 || f >= at(18, "comenta")) return null;
  const c = chunks[i];
  const sc = pop(f, Math.round(c[0].s * FPS) - 2, 8);
  return (
    <div style={{position: "absolute", top: f >= SPLIT ? 905 : 1300, left: 50, right: 50, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 84, lineHeight: 1.05, textTransform: "uppercase", color: "#fff", ...STROKE, textShadow: "0 8px 18px rgba(0,0,0,0.55)", transform: `scale(${0.85 + 0.15 * sc})`}}>
      {c.map((w, k) => (
        <span key={k} style={{color: KEY.has(clean(w.w)) ? "#FFB31A" : "#FFFFFF"}}>
          {w.w.replace(/\.\.\.$/, "…")}
          {k < c.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

const Chip: React.FC<{from: number; to: number; text: string; bg: string; top?: number; size?: number}> = ({from, to, text, bg, top = 230, size = 70}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{transform: `scale(${pop(f, from, 10)}) rotate(-3deg)`, background: bg, color: "#fff", fontFamily, fontWeight: 900, fontSize: size, padding: "12px 44px", borderRadius: 18, border: "5px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 0 rgba(0,0,0,0.3)", WebkitTextStroke: "4px rgba(0,0,0,0.45)", paintOrder: "stroke fill", whiteSpace: "nowrap"}}>{text}</div>
    </div>
  );
};

const Rings: React.FC<{from: number; to: number; x: number; y: number; color?: string; speed?: number}> = ({from, to, x, y, color = "#8fd3ff", speed = 22}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 5), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {[0, 1, 2, 3].map((i) => {
        const k = ((f - from) / speed + i / 4) % 1;
        return <circle key={i} cx={x} cy={y} r={lerp(20, 560, k)} fill="none" stroke={color} strokeWidth={10 * (1 - k) + 2} opacity={1 - k} />;
      })}
    </svg>
  );
};

/** fundo dos painéis de ciência */
const PanelBg: React.FC<{from: number; to: number; children: React.ReactNode; bg?: string}> = ({from, to, children, bg = "radial-gradient(circle at 50% 35%, #183456, #07101e 75%)"}) => {
  const f = useCurrentFrame();
  if (f < from || f >= to) return null;
  return (
    <AbsoluteFill style={{background: bg}}>
      <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
        {children}
      </svg>
    </AbsoluteFill>
  );
};


/* ---------- painéis de ciência: relatividade ---------- */
const clockSvg = (cx: number, cy: number, r: number, ang: number, color = "#ffd21f") => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#f4ead2" stroke="#0a0f18" strokeWidth={10} />
    {Array.from({length: 12}, (_, i) => {
      const a2 = (i / 12) * Math.PI * 2;
      return <circle key={i} cx={cx + Math.sin(a2) * r * 0.8} cy={cy - Math.cos(a2) * r * 0.8} r={6} fill="#333" />;
    })}
    <line x1={cx} y1={cy} x2={cx + Math.sin(ang) * r * 0.78} y2={cy - Math.cos(ang) * r * 0.78} stroke={color} strokeWidth={12} strokeLinecap="round" />
    <circle cx={cx} cy={cy} r={12} fill="#0a0f18" />
  </g>
);

/** barra de audição */
const Hearing: React.FC<{from: number; to: number; v0: number; v1: number}> = ({from, to, v0, v1}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const v = lerp(v0, v1, ramp(f, from + 10, to - 10, easeInOut));
  const col = v > 0.5 ? "#4cd964" : v > 0.25 ? "#ffcc00" : "#ff3b30";
  return (
    <div style={{position: "absolute", top: 260, left: 140, right: 140, opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{fontFamily, fontWeight: 900, fontSize: 60, color: "#fff", ...STROKE, marginBottom: 12}}>FÔLEGO {Math.round(v * 100)}%</div>
      <div style={{height: 56, borderRadius: 28, background: "rgba(10,15,24,0.7)", border: "5px solid #fff", overflow: "hidden"}}>
        <div style={{height: "100%", width: `${v * 100}%`, background: col}} />
      </div>
    </div>
  );
};



/* 15 — o porão: escondido atrás dos relógios de pêndulo */
const Basement: React.FC<{t: number}> = ({t}) => (
  <>
    <color attach="background" args={["#0c0806"]} />
    <hemisphereLight args={["#5a4030", "#0a0604", 0.25]} />
    <pointLight position={[0.3, 1.1, -0.2]} color="#ffb060" intensity={2.6 + 0.4 * Math.sin(t * 13) * Math.sin(t * 5)} distance={4.5} decay={1.6} castShadow />
    <ClockShop t={t} />
    <mesh position={[0.3, 0.95, -0.2]}>
      <sphereGeometry args={[0.025, 8, 6]} />
      <meshBasicMaterial color="#ffd890" />
    </mesh>
  </>
);

/* ======================= Davi e o Âncora ======================= */
const ANCORA: Look = {palito: true, bowler: "#141414", gloves: "#3a2414", skin: "#e8d0bc", hair: "#2a2a2a", hairStyle: "short", shirt: "#e8e2d8", trim: "#2a2a2a", pants: "#1e1c22", coat: "#1e1c22", scarf: "#3a3a44"};
const ANC_POS: V3 = [0.75, 0, -0.5];

/* 0a — saindo da farmácia; a luz no chão */
const S0: React.FC<ShotProps> = ({f, a, b, t}) => {
  const palm = useRef<THREE.Object3D>(null);
  const out = a + 34;
  const luz = at(0, "luz");
  const pux = at(0, "caiu") - 8;
  const sink = ramp(f, pux, pux + 10, (x) => x * x);
  const pose = physics("a0", (fr) => {
    const w = 1 - ramp(fr, out - 6, out);
    const look = ramp(fr, luz, luz + 8, easeOut);
    const s = ramp(fr, pux, pux + 10, (x) => x * x);
    return idle(fr, {...(w > 0 ? walkP(fr, a, 1.3) : {}), walkAmt: w, pos: [0, -1.8 * s, lerp(-2.0, 0.2, ramp(fr, a, out))], rShoulder: [0, 0, -0.12 - 1.2 * s], lShoulder: [0, 0, 0.12 + 1.2 * s], head: [0.55 * look * (1 - s), 0, 0], pupil: [0, -0.8 * look], eyeWide: look, brow: look, mouthOpen: 0.6 * look, squash: -0.25 * s, smile: 0.6 * (1 - look)});
  }, a, f);
  const sh = shake(f, 0.03 * kick(f, pux, 8));
  return (
    <>
      <Cam pos={[0.4 + sh[0], lerp(1.5, 1.2, ramp(f, luz, pux)) + sh[1], lerp(3.4, 2.7, ramp(f, a, b, easeInOut))]} look={[0, lerp(1.0, 0.5, ramp(f, luz, pux)), 0]} fov={42} />
      <color attach="background" args={["#a8d4f6"]} />
      <hemisphereLight args={["#eaf4ff", "#8a8070", 0.55]} />
      <directionalLight position={[3, 7, 5]} intensity={1.5} color="#fff4e0" castShadow shadow-mapSize={[2048, 2048]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
      <Pharmacy t={t} />
      <Portal t={t} power={ramp(f, luz, luz + 10, easeOut) * (1 - ramp(f, pux + 8, pux + 14))} p={[0, 0, 0.2]} />
      {sink < 0.95 && <Boy pose={pose} look={DAVI} palmRef={palm} />}
      {f < pux ? (
        <AtPalm palm={palm} offset={[0, -0.02, 0]}>
          <Bag />
        </AtPalm>
      ) : (
        <group position={[-0.32, Math.max(0.2, 0.6 - 4.9 * ((f - pux) / FPS) ** 2), 0.25]} rotation={[0, 0, Math.min(1.3, (f - pux) / 6)]}>
          <Bag />
        </group>
      )}
    </>
  );
};

/* 0b — cai em Birmingham; descobre a bolha */
const S0b: React.FC<ShotProps> = ({f, a, b, t}) => {
  const land = a + 12;
  const desc = at(0, "acelerar");
  const k = ramp(f, desc - 4, desc + 10);
  const tt = (a + (f - a) * (1 - 0.9 * k)) / FPS;
  const pose = physics("a0b", (fr) => {
    const look = ramp(fr, land + 12, land + 40, easeInOut);
    const kk = ramp(fr, desc - 4, desc + 10);
    return idle(fr, {pos: [0, fr < land ? lerp(3.5, 0, ((fr - a) / 12) ** 2) : 0, 0.6], squash: 0.22 * kick(fr, land, 5), eyeWide: 0.8, brow: 0.8, mouthOpen: 0.4 * kick(fr, land, 20) + 0.3 * kk, head: [-0.1, lerp(0, Math.sin(fr / 14) * 0.6, look * (1 - kk)), 0], rShoulder: [0, 0, -0.5 - 0.3 * kk], lShoulder: [0, 0, 0.5 + 0.3 * kk], pupil: [Math.sin(fr / 14) * 0.6 * (1 - kk), 0.2]});
  }, a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.8, 0.3, p), 1.35, lerp(4.2, 3.2, p)]} look={[0, 1.2, 0]} fov={44} />
      <Day t={tt} />
      <Boy pose={pose} look={DAVI} />
      <TimeBubble t={f / FPS} power={k} p={[0, 1.0, 0.6]} r={1.1} />
      {[-2.2, 2.3, -1.0].map((x, i) => (
        <Boy key={i} look={POVO[i]} pose={idle(Math.round(tt * FPS) + i * 20, {...walkP(Math.round(tt * FPS), 0, 1.1), pos: [x + (tt - a / FPS) * (i === 1 ? -0.5 : 0.5), 0, -1.6 - i * 0.3], rotY: i === 1 ? -Math.PI / 2 : Math.PI / 2})} />
      ))}
    </>
  );
};

/* 0c — alguém viu: o homem de chapéu-coco na névoa */
const S0c: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  const anc = idle(f, {pos: [0, 0, 0], rotY: 0, brow: -0.5, head: [0.05, 0, 0]});
  return (
    <>
      <Cam pos={[0.3, 1.45, lerp(5.5, 3.6, p)]} look={[0, 1.4, 0]} fov={36} />
      <Day t={t} />
      <fog attach="fog" args={["#8a8070", 2, 9]} />
      <Boy pose={anc} look={ANCORA} />
    </>
  );
};

/* 1/2 — ele trava as pernas do Davi; correr dentro de mel */
const S1: React.FC<ShotProps> = ({f, a, b, t}) => {
  const tent = at(1, "tentou");
  const mel = L(2) - 3;
  const heavy = ramp(f, mel, mel + 20);
  const fr0 = (fr: number) => (fr < mel ? fr : mel + (fr - mel) * 0.35); // "mel": o movimento do Davi fica devagar
  const davi = physics("a1", (fr) => {
    const run = ramp(fr, tent, tent + 6);
    const g = fr0(fr);
    return idle(fr, {...walkP(g, tent, 2.2), walkAmt: 1.1 * run, pos: [0.0, 0, 0.7], rotY: -Math.PI / 2 + 0.75 * run, torso: [0.22 * run, 0, 0], rShoulder: [Math.sin(((g - tent) / FPS) * 13.8) * 0.8 * run, 0, -0.2], lShoulder: [-Math.sin(((g - tent) / FPS) * 13.8) * 0.8 * run, 0, 0.2], rElbow: -1.2 * run, lElbow: -1.2 * run, brow: -0.6 * run + 0.6 * (1 - run), eyeWide: 0.8, mouthOpen: 0.4 + 0.2 * run, head: [0, lerp(0, -0.35, run), 0]});
  }, a, f);
  const anc = physics("a1a", (fr) => idle(fr, {pos: ANC_POS, rotY: -0.9, brow: -0.6, smile: 0.4 * ramp(fr, tent, tent + 20), rShoulder: [0, 0, -0.12], lShoulder: [0, 0, 0.12]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  const tt = (a + (Math.min(f, mel) - a) + Math.max(0, f - mel) * 0.2) / FPS;
  return (
    <>
      <Cam pos={[lerp(-0.2, 0.3, p), 1.45, lerp(3.9, 3.4, p)]} look={[0.25, 1.2, 0]} fov={44} />
      <Day t={tt} />
      <Boy pose={anc} look={ANCORA} />
      <Boy pose={davi} look={DAVI} />
      {heavy > 0 && <Steam t={tt} origin={[0.2, 0.3, 0.2]} count={16} spread={0.9} rise={0.4} size={0.6} power={0.4 * heavy} color="#d8b46a" seed={91} life={6} />}
    </>
  );
};

/* 4 — close no Âncora */
const S4: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  const anc = physics("a4", (fr) => idle(fr, {pos: [0, 0, 0], rotY: 0, brow: -0.7, smile: 0.35, head: [-0.05, 0, 0], pupil: [0, 0]}), a, f);
  return (
    <>
      <Cam pos={[0.15, 1.6, lerp(1.4, 0.95, p)]} look={[0, 1.55, 0]} fov={36} />
      <Day t={t} />
      <Boy pose={anc} look={ANCORA} />
    </>
  );
};

/* 5/6 — pega o pulso e puxa a bolha; o apito distrai */
const Drain: React.FC<{from: V3; to: V3; t: number; power: number}> = ({from, to, t, power}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(0.6, 1.1, 1.8), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending}), []);
  if (power <= 0.01) return null;
  m.opacity = power;
  return (
    <group>
      {Array.from({length: 26}, (_, i) => {
        const k = ((t * 0.9 + i / 26) % 1);
        const sw = Math.sin(k * Math.PI * 4 + i) * 0.12 * (1 - k);
        return (
          <mesh key={i} material={m} position={[lerp(from[0], to[0], k) + sw, lerp(from[1], to[1], k) + Math.cos(k * 9 + i) * 0.08 * (1 - k), lerp(from[2], to[2], k)]} scale={0.03 * (1 - 0.6 * k)}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
};
const S5: React.FC<ShotProps> = ({f, a, b, t}) => {
  const grab = at(5, "pegou");
  const pul = at(5, "puxada");
  const ap = at(6, "apito");
  const free = at(6, "pernas");
  const g = ramp(f, grab, grab + 8, easeOut) * (1 - ramp(f, ap + 4, ap + 12));
  const drain = ramp(f, pul - 10, pul + 6) * (1 - ramp(f, ap, ap + 8));
  const davi = physics("a5", (fr) => {
    const gg = ramp(fr, grab, grab + 8, easeOut) * (1 - ramp(fr, ap + 4, ap + 12));
    const back = ramp(fr, free, free + 10, easeOut);
    return idle(fr, {pos: [lerp(-0.1, -0.9, back), 0, 0.5], rotY: -Math.PI / 2 + 0.4, rShoulder: [-1.3 * gg, 0, -0.2], rElbow: -0.1, torso: [0.15 * gg - 0.2 * kick(fr, free, 8), 0, 0], blink: Math.max(blinkCurve(fr), 0.5 * ramp(fr, pul, pul + 10) * (1 - back)), brow: 0.7, mouthOpen: 0.4, legLift: 0.15 * gg, eyeWide: back});
  }, a, f);
  const anc = physics("a5a", (fr) => {
    const gg = ramp(fr, grab, grab + 8, easeOut) * (1 - ramp(fr, ap + 4, ap + 12));
    const turn = ramp(fr, ap, ap + 8, easeOut);
    return idle(fr, {pos: [0.7, 0, 0.35], rotY: -Math.PI / 2 - 0.3, rShoulder: [-1.35 * gg, 0, -0.1], rElbow: -0.15, head: [0, lerp(0, 1.0, turn), 0], brow: -0.7, smile: 0.4 * gg * (1 - turn)});
  }, a, f);
  const sh = shake(f, 0.02 * kick(f, ap, 8));
  return (
    <>
      <Cam pos={[0.0 + sh[0], 1.35 + sh[1], 3.6]} look={[-0.05, 1.15, 0.3]} fov={44} />
      <Day t={t} />
      <Boy pose={anc} look={ANCORA} />
      <Boy pose={davi} look={DAVI} />
      <TimeBubble t={f / FPS} power={0.6 * (1 - drain) * g} p={[-0.1, 1.0, 0.5]} r={0.95} />
      <Drain from={[-0.1, 1.1, 0.5]} to={[0.35, 1.2, 0.35]} t={f / FPS} power={drain} />
      {f >= ap - 2 && <Steam t={(f - ap) / FPS} origin={[-1.8, 5.6, -4.2]} count={20} spread={0.3} rise={2.5} size={0.9} power={Math.max(0, 1 - (f - ap) / 60)} color="#f2f2f2" seed={33} life={1.5} />}
    </>
  );
};

/* 7 — dona Agnes puxa pela gola → porão */
const S7: React.FC<ShotProps> = ({f, a, b}) => {
  const m = at(7, "mao");
  const davi = physics("a7", (fr) => {
    const kk = ramp(fr, m, m + 10, easeOut);
    return idle(fr, {pos: [lerp(-0.4, -1.45, kk), 0, lerp(-2.3, -3.05, kk)], rotY: lerp(Math.PI / 2, -2.4, kk), torso: [-0.3 * kick(fr, m + 2, 8), 0, 0.35 * kick(fr, m + 2, 8)], eyeWide: kk, brow: kk, mouthOpen: 0.5 * kk, rShoulder: [-1.3 * kk, 0, -0.4], rElbow: -0.2});
  }, a, f);
  const ag = physics("a7a", (fr) => idle(fr, {pos: [-1.7, 0, -2.75], rotY: 0.6, rShoulder: [-1.6 + 0.4 * ramp(fr, m, m + 10), 0, -0.1], rElbow: -0.1 - 1.2 * ramp(fr, m, m + 10), brow: -0.4}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.9, 0.6, p), 1.5, lerp(0.6, 0.2, p)]} look={[-1.3, 1.15, -3.0]} fov={44} />
      <Day t={f / FPS} />
      <ClockWindow t={f / FPS} spin={0.2} />
      <Boy pose={ag} look={AGNES} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};
const BasementA: React.FC<{t: number; win?: boolean}> = ({t, win = true}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({color: "#d8c8a0"}), []);
  const bars = useMemo(() => new THREE.MeshStandardMaterial({color: "#1a1410"}), []);
  return (
    <>
      <Basement t={t} />
      {win && (
        <group position={[-1.6, 2.55, -2.47]}>
          <mesh material={m}>
            <planeGeometry args={[0.7, 0.3]} />
          </mesh>
          {[-0.2, 0, 0.2].map((x) => (
            <mesh key={x} position={[x, 0, 0.01]} material={bars}>
              <boxGeometry args={[0.025, 0.3, 0.02]} />
            </mesh>
          ))}
          <pointLight position={[0, -0.2, 0.3]} color="#ffe6b0" intensity={1.2} distance={3} />
        </group>
      )}
    </>
  );
};
const S7b: React.FC<ShotProps> = ({f, a, b}) => {
  const ag = physics("a7b", (fr) => idle(fr, {...walkP(fr, a, 1.0), walkAmt: 1 - ramp(fr, a + 40, a + 50), pos: [lerp(-0.6, 1.4, ramp(fr, a, a + 50)), 0, -1.5], rotY: Math.PI / 2, lShoulder: [-1.1, 0, 0.2], lElbow: -0.6}), a, f);
  const davi = physics("a7c", (fr) => idle(fr, {...walkP(fr, a, 1.0), walkAmt: 1 - ramp(fr, a + 46, a + 56), pos: [lerp(-1.2, 1.9, ramp(fr, a, a + 56)), 0, -1.75], rotY: Math.PI / 2, head: [0, 0.4, 0], eyeWide: 0.5}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(-0.5, 0.4, p), 1.4, 1.3]} look={[lerp(0.2, 1.6, p), 1.1, -1.8]} fov={44} />
      <BasementA t={f / FPS} />
      <Boy pose={ag} look={AGNES} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 9 — Pressa: tremendo de fome */
const S9: React.FC<ShotProps> = ({f, a, b}) => {
  const davi = physics("a9", (fr) => idle(fr, {pos: [0.3, 0, -0.9], rotY: -0.2, torso: [0.2, 0, Math.sin(fr * 2.7) * 0.02], head: [0.2, 0, Math.sin(fr * 2.3) * 0.04], rShoulder: [-0.6, 0, 0.35], lShoulder: [-0.6, 0, -0.35], rElbow: -1.3, lElbow: -1.3, brow: 0.7, mouthOpen: 0.25, blink: Math.max(blinkCurve(fr), 0.3)}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.9, 0.7, p), 1.4, lerp(1.6, 1.3, p)]} look={[0.3, 1.2, -0.9]} fov={42} />
      <BasementA t={f / FPS} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 11 — comendo pão */
const S11: React.FC<ShotProps> = ({f, a, b}) => {
  const palm = useRef<THREE.Object3D>(null);
  const bite = (fr: number) => 0.5 + 0.5 * Math.sin(((fr - a) / FPS) * 5);
  const davi = physics("a11", (fr) => idle(fr, {pos: [0.4, 0, -1.25], rotY: 0, rShoulder: [-0.9 - 0.5 * bite(fr), 0, 0.3], rElbow: -1.6 - 0.5 * bite(fr), mouthOpen: 0.15 + 0.3 * Math.abs(Math.sin(fr / 2.5)), torso: [0.1, 0, Math.sin(fr * 2.7) * 0.015], brow: 0.4, head: [0.1, 0, 0]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.75, 0.6, p), 1.35, lerp(1.4, 1.2, p)]} look={[0.4, 1.15, -0.9]} fov={42} />
      <BasementA t={f / FPS} />
      <Boy pose={davi} look={DAVI} palmRef={palm} />
      <AtPalm palm={palm} offset={[0, 0.02, 0]}>
        <mesh scale={[1.2, 0.7, 0.85]}>
          <sphereGeometry args={[0.06, 12, 10]} />
          <meshStandardMaterial color="#b8783a" roughness={0.8} />
        </mesh>
      </AtPalm>
      <Bread p={[0.15, 0.765, -0.6]} bite={0.5} />
    </>
  );
};

/* 12–14 — a mesa: pão, mel, vela; bolha pequena na mão */
const Table: React.FC<{t: number; flameT: number; flame: number}> = ({t, flameT, flame}) => (
  <>
    <Bread p={[0.15, 0.765, -0.55]} />
    <HoneyJar p={[0.65, 0.765, -0.5]} />
    <CandleBody p={[0.4, 0.765, -0.6]} />
    <group position={[0.4, 0.94, -0.6]}>
      <Flame t={flameT} power={flame} height={0.09} width={0.05} seed={4} />
      <FireLight t={flameT} power={flame} position={[0, 0.06, 0]} intensity={1.2} distance={2} />
    </group>
  </>
);
const S12: React.FC<ShotProps> = ({f, a, b}) => {
  const ag = physics("a12", (fr) => idle(fr, {pos: [-0.45, 0, -1.0], rotY: 0.7, rShoulder: [-0.9 * ramp(fr, a, a + 20) * (1 - ramp(fr, a + 40, a + 55)), 0, 0.15], rElbow: -0.3, mouthOpen: talk(fr, at(12, "primeira"), L(13) - 6), smile: 0.4}), a, f);
  const davi = physics("a12d", (fr) => idle(fr, {pos: [0.8, 0, -1.15], rotY: -0.5, brow: 0.3, pupil: [-0.5, -0.5]}), a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.6, 0.4, p), 1.45, lerp(1.7, 1.4, p)]} look={[0.3, 1.0, -0.7]} fov={44} />
      <BasementA t={f / FPS} />
      <Table t={f / FPS} flameT={f / FPS} flame={1} />
      <Boy pose={ag} look={AGNES} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};
const S13: React.FC<ShotProps> = ({f, a, b}) => {
  const tr = at(13, "tremular");
  const fim = at(13, "depois");
  const k = ramp(f, at(13, "tentou"), at(13, "tentou") + 12) * (1 - ramp(f, fim, fim + 8));
  const flameT = (f / FPS) * (1 + 9 * ramp(f, tr - 6, tr + 4) * (1 - ramp(f, fim, fim + 8)));
  const davi = physics("a13", (fr) => {
    const kk = ramp(fr, at(13, "tentou"), at(13, "tentou") + 12) * (1 - ramp(fr, fim, fim + 8));
    const dizzy = ramp(fr, fim, fim + 10);
    return idle(fr, {pos: [0.4, 0, -1.25], rotY: 0, rShoulder: [-1.2 * kk, 0, 0.1], rElbow: -0.5 * kk, rWrist: [0, Math.PI * 0.5 * kk, 0], brow: lerp(-0.5, 0.8, dizzy), blink: fr > at(13, "tentou") && fr < fim ? 1 : Math.max(blinkCurve(fr), 0.5 * dizzy), head: [0.15 + 0.15 * dizzy, Math.sin(fr / 6) * 0.2 * dizzy, Math.sin(fr / 7) * 0.15 * dizzy], torso: [0, 0, Math.sin(fr / 6) * 0.08 * dizzy]});
  }, a, f);
  const p = ramp(f, a, b, easeInOut);
  return (
    <>
      <Cam pos={[lerp(0.6, 0.5, p), 1.15, lerp(0.75, 0.55, p)]} look={[0.4, 0.95, -0.65]} fov={42} />
      <BasementA t={f / FPS} />
      <Table t={f / FPS} flameT={flameT} flame={1} />
      <TimeBubble t={f / FPS} power={k} p={[0.4, 0.93, -0.6]} r={0.17} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 14 — dona Agnes séria; 15 — sozinho */
const S14: React.FC<ShotProps> = ({f, a, b}) => {
  const p = ramp(f, a, b, easeInOut);
  const ag = physics("a14", (fr) => idle(fr, {pos: [-0.2, 0, -1.0], rotY: 0.15, brow: 0.6, mouthOpen: talk(fr, a + 4, b - 6), head: [0.12, 0, 0]}), a, f);
  return (
    <>
      <Cam pos={[0.05, 1.55, lerp(0.95, 0.7, p)]} look={[-0.2, 1.48, -1.0]} fov={36} />
      <BasementA t={f / FPS} />
      <Table t={f / FPS} flameT={f / FPS} flame={1} />
      <Boy pose={ag} look={AGNES} />
    </>
  );
};
const S15: React.FC<ShotProps> = ({f, a, b}) => {
  const p = ramp(f, a, b, easeInOut);
  const davi = physics("a15", (fr) => idle(fr, {pos: [0.4, 0, -1.25], rotY: 0, head: [0.35, 0, 0], brow: 0.5, rShoulder: [0.2, 0, -0.1], lShoulder: [0.2, 0, 0.1]}), a, f);
  return (
    <>
      <Cam pos={[lerp(1.6, 2.0, p), lerp(2.2, 2.5, p), lerp(1.8, 2.2, p)]} look={[0.4, 0.9, -1.2]} fov={44} />
      <BasementA t={f / FPS} />
      <Table t={f / FPS} flameT={f / FPS} flame={1} />
      <Boy pose={davi} look={DAVI} />
    </>
  );
};

/* 16/17 — pela janelinha: a feira congelada; o Âncora olhando */
const S16: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  const fz = a + 12; // pose congelada
  return (
    <>
      <Cam pos={[lerp(0.6, 0.2, p), 1.1, 4.6]} look={[0, 1.15, 0]} fov={42} />
      <Day t={(a + 12) / FPS} />
      {[-2.2, -1.1, 0.0, 1.2, 2.3].map((x, i) => (
        <Boy key={i} look={POVO[i % 5]} pose={idle(fz + i * 9, {...walkP(fz + i * 9, 0, 1.2), pos: [x, 0, 0.8 - (i % 2) * 0.9], rotY: i % 2 ? -Math.PI / 2 : Math.PI / 2, blink: 0})} />
      ))}
      <Pigeon p={[0.35, 1.75, 2.2]} flap={0.5} />
    </>
  );
};
const S17: React.FC<ShotProps> = ({f, a, b, t}) => {
  const p = ramp(f, a, b, easeInOut);
  const anc = idle(f, {pos: [0, 0, 0], rotY: 0, brow: -0.7, blink: 0, smile: 0.3, head: [-0.12, 0, 0]});
  return (
    <>
      <Cam pos={[0, 1.0, lerp(3.6, 2.2, p)]} look={[0, 1.45, 0]} fov={40} />
      <Day t={(L(16) + 9) / FPS} />
      <Boy pose={anc} look={ANCORA} />
    </>
  );
};

/* ---------- lista de planos ---------- */
const Empty: React.FC<ShotProps> = () => <Dark />;
const SHOTS: Shot[] = [
  {from: 0, Comp: S0},
  {from: at(0, "caiu") - 3, Comp: S0b},
  {from: at(0, "so") - 3, Comp: S0c},
  {from: L(1) - 3, Comp: S1},
  {from: L(3) - 3, Comp: Empty}, // gravidade e tempo
  {from: L(4) - 3, Comp: S4},
  {from: L(5) - 3, Comp: S5},
  {from: L(7) - 3, Comp: S7},
  {from: at(7, "porta") - 3, Comp: S7b},
  {from: L(8) - 3, Comp: Empty}, // tipos
  {from: L(9) - 3, Comp: S9},
  {from: L(10) - 3, Comp: Empty}, // glicogênio
  {from: L(11) - 3, Comp: S11},
  {from: L(12) - 3, Comp: S12},
  {from: L(13) - 3, Comp: S13},
  {from: L(14) - 3, Comp: S14},
  {from: L(15) - 3, Comp: S15},
  {from: L(16) - 3, Comp: S16},
  {from: L(17) - 3, Comp: S17},
];
const SPLIT = at(18, "davi") - 8;

const Scene: React.FC<{f: number}> = ({f}) => {
  if (f >= SPLIT) return <Dark />;
  let i = 0;
  for (let k = 0; k < SHOTS.length; k++) if (f >= SHOTS[k].from) i = k;
  const s = SHOTS[i];
  const C = s.Comp;
  return (
    <>
      <C key={i} f={f} a={s.from} b={SHOTS[i + 1]?.from ?? SPLIT} t={f / FPS} />
      {C !== Empty && <Post />}
    </>
  );
};

/* ---------- tela dividida A/B ---------- */
const PA: React.FC<ShotProps> = ({f, a, t}) => {
  const davi = physics("apa", (fr) => idle(fr, {pos: [-0.5, 0, 0.6], rotY: Math.PI / 2 - 0.3, rShoulder: [-1.4, 0, -0.1], rElbow: -0.2, brow: -0.8}), a, f);
  const anc = idle(f, {pos: [0.7, 0, 0.3], rotY: -Math.PI / 2 + 0.3, brow: -0.6, smile: 0.4});
  return (
    <>
      <Cam pos={[0.2, 1.4, 3.0]} look={[0.1, 1.2, 0.4]} fov={42} />
      <Day t={t} />
      <Boy pose={davi} look={DAVI} />
      <Boy pose={anc} look={ANCORA} />
      <TimeBubble t={t} power={0.8} p={[-0.05, 1.27, 0.6]} r={0.18} />
    </>
  );
};
const PB: React.FC<ShotProps> = ({f, a, t}) => {
  const z = -((f - a) / FPS) * 1.4;
  const pose = idle(f, {...walkP(f, a, 2.8), walkAmt: 1.4, pos: [-0.9, 0.0, z], rotY: Math.PI, torso: [0.3, 0, 0], mouthOpen: 0.5, brow: 0.8});
  return (
    <>
      <Cam pos={[-0.6, 1.4, z + 2.6]} look={[-0.6, 1.1, z - 2]} fov={50} />
      <color attach="background" args={["#0a0806"]} />
      <hemisphereLight args={["#c89a6a", "#2a1a10", 1.1]} />
      <pointLight position={[-0.6, 2.0, z + 1.0]} color="#ffc080" intensity={5} distance={6} />
      <Sewer t={t} />
      <Boy pose={pose} look={DAVI} />
    </>
  );
};

/* ---------- painéis 2D ---------- */
/** 3 — gravidade deixa o tempo mais devagar; relógios a 33 cm */
const Gravity: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(3) - 3, to = L(4) - 3;
  if (f < from || f >= to) return null;
  const y10 = at(3, "2010");
  const t = (f - from) / FPS;
  const grid = Array.from({length: 13}, (_, i) => i);
  const warp = (x: number, y: number) => {
    const dx = x - 540, dy = y - 760;
    const d = Math.sqrt(dx * dx + dy * dy);
    return 140 * Math.exp(-(d * d) / (2 * 190 * 190));
  };
  if (f < y10 - 3) {
    return (
      <PanelBg from={from} to={to} bg="radial-gradient(circle at 50% 40%, #102040, #02040a 75%)">
        <text x={540} y={210} textAnchor="middle" fontSize={64} {...TXT} fill="#ffd21f">GRAVIDADE MEXE NO TEMPO</text>
        {grid.map((i) => (
          <polyline key={"h" + i} points={Array.from({length: 41}, (_, j) => { const x = 90 + j * 22.5, y = 480 + i * 45; return `${x},${y + warp(x, y)}`; }).join(" ")} fill="none" stroke="#3a6aaa" strokeWidth={3} />
        ))}
        {Array.from({length: 41}, (_, j) => j).filter((j) => j % 4 === 0).map((j) => (
          <polyline key={"v" + j} points={grid.map((i) => { const x = 90 + j * 22.5, y = 480 + i * 45; return `${x},${y + warp(x, y)}`; }).join(" ")} fill="none" stroke="#3a6aaa" strokeWidth={3} />
        ))}
        <circle cx={540} cy={860} r={110} fill="#d06a2a" stroke="#fff" strokeWidth={5} />
        {clockSvg(540, 1040, 70, t * 0.8)}
        {clockSvg(860, 520, 70, t * 2.0, "#8fd3ff")}
        <text x={540} y={1160} textAnchor="middle" fontSize={44} {...TXT}>PERTO DA MASSA: MAIS DEVAGAR</text>
        <text x={860} y={640} textAnchor="middle" fontSize={40} {...TXT} fill="#8fd3ff">LONGE: NORMAL</text>
      </PanelBg>
    );
  }
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={220} textAnchor="middle" fontSize={84} {...TXT} fill="#ffd21f">2010</text>
      <text x={540} y={310} textAnchor="middle" fontSize={50} {...TXT}>RELÓGIOS ATÔMICOS</text>
      <rect x={360} y={1060} width={360} height={30} fill="#8a6a4a" />
      <rect x={560} y={760} width={160} height={30} fill="#8a6a4a" />
      <rect x={630} y={790} width={20} height={270} fill="#8a6a4a" />
      {clockSvg(440, 960, 90, t * 1.0)}
      {clockSvg(640, 660, 90, t * 1.0005, "#8fd3ff")}
      <line x1={820} y1={660} x2={820} y2={960} stroke="#ffd21f" strokeWidth={6} />
      <text x={850} y={830} fontSize={64} {...TXT} fill="#ffd21f">33 cm</text>
      {f >= at(3, "centimetros") && <text x={540} y={1230} textAnchor="middle" fontSize={50} {...TXT}>O DE CIMA ADIANTA</text>}
    </PanelBg>
  );
};

/** 8 — os 4 tipos de poder do tempo */
const Types: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(8) - 3, to = L(9) - 3;
  if (f < from || f >= to) return null;
  const cards = [
    {w: "pressa", t: "PRESSA", d: "ACELERA O PRÓPRIO CORPO", c: "#3a8aff", icon: "»"},
    {w: "ancora", t: "ÂNCORA", d: "PESA O TEMPO DOS OUTROS", c: "#7a5aa0", icon: "⚓"},
    {w: "eco", t: "ECO", d: "REPETE OS ÚLTIMOS SEGUNDOS", c: "#2E9E4F", icon: "↺"},
    {w: "ferrugem", t: "FERRUGEM", d: "ENVELHECE O QUE TOCA", c: "#c0602a", icon: "⌛"},
  ];
  return (
    <PanelBg from={from} to={to}>
      <text x={540} y={200} textAnchor="middle" fontSize={64} {...TXT} fill="#ffd21f">OS TIPOS DE PODER DO TEMPO</text>
      {cards.map((c, i) => {
        const a0 = at(8, c.w);
        if (f < a0) return null;
        const x = i % 2 ? 790 : 290;
        const y = i < 2 ? 520 : 960;
        return (
          <g key={i} transform={`translate(${x} ${y}) scale(${pop(f, a0, 10)})`}>
            <rect x={-220} y={-170} width={440} height={340} rx={30} fill={c.c} stroke="#fff" strokeWidth={7} />
            <text x={0} y={-30} textAnchor="middle" fontSize={120} fill="#fff" fontFamily={fontFamily} fontWeight={900}>{c.icon}</text>
            <text x={0} y={70} textAnchor="middle" fontSize={60} fill="#fff" fontFamily={fontFamily} fontWeight={900}>{c.t}</text>
            <text x={0} y={128} textAnchor="middle" fontSize={28} fill="#fff" fontFamily={fontFamily} fontWeight={900}>{c.d}</text>
          </g>
        );
      })}
    </PanelBg>
  );
};

/** 10 — glicogênio */
const Glyco: React.FC = () => {
  const f = useCurrentFrame();
  const from = L(10) - 3, to = L(11) - 3;
  if (f < from || f >= to) return null;
  const fig = at(10, "figado"), mus = at(10, "musculos"), gli = at(10, "glicogenio"), cal = at(10, "duas"), qu = at(10, "queimava");
  const drainK = ramp(f, qu, to - 4, (x) => x);
  const level = 1 - drainK * 0.9;
  return (
    <PanelBg from={from} to={to} bg="radial-gradient(circle at 50% 40%, #3a1a1a, #0a0404 75%)">
      <text x={540} y={200} textAnchor="middle" fontSize={64} {...TXT} fill="#ffd21f">O ESTOQUE DE AÇÚCAR</text>
      {/* corpo */}
      <circle cx={540} cy={420} r={70} fill="#e8b48a" opacity={0.9} />
      <rect x={440} y={500} width={200} height={360} rx={60} fill="#e8b48a" opacity={0.9} />
      <rect x={370} y={510} width={60} height={300} rx={30} fill="#e8b48a" opacity={0.9} />
      <rect x={650} y={510} width={60} height={300} rx={30} fill="#e8b48a" opacity={0.9} />
      <rect x={460} y={870} width={70} height={320} rx={30} fill="#e8b48a" opacity={0.9} />
      <rect x={550} y={870} width={70} height={320} rx={30} fill="#e8b48a" opacity={0.9} />
      {f >= fig && <ellipse cx={575} cy={650} rx={70} ry={40} fill={`rgba(160,40,40,${0.5 + 0.5 * level})`} stroke="#fff" strokeWidth={4} />}
      {f >= fig && <text x={760} y={660} fontSize={44} {...TXT}>FÍGADO</text>}
      {f >= mus && [[400, 640], [680, 640], [495, 1020], [585, 1020]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx={24} ry={70} fill={`rgba(200,60,60,${0.4 + 0.5 * level})`} />)}
      {f >= mus && <text x={250} y={760} fontSize={44} {...TXT}>MÚSCULOS</text>}
      {f >= gli && (
        <g transform={`translate(540 310) scale(${pop(f, gli, 10)})`}>
          <rect x={-300} y={-60} width={600} height={100} rx={20} fill="#ffd21f" stroke="#fff" strokeWidth={5} />
          <text x={0} y={12} textAnchor="middle" fontSize={56} fontFamily={fontFamily} fontWeight={900} fill="#0a0f18">GLICOGÊNIO</text>
        </g>
      )}
      {f >= cal && (
        <g>
          <rect x={140} y={1400} width={800} height={60} rx={30} fill="rgba(10,15,24,0.7)" stroke="#fff" strokeWidth={5} />
          <rect x={146} y={1406} width={788 * level} height={48} rx={24} fill={level > 0.5 ? "#4cd964" : level > 0.25 ? "#ffcc00" : "#ff3b30"} />
          <text x={540} y={1540} textAnchor="middle" fontSize={50} {...TXT}>≈ 2.000 kcal {f >= qu ? "· QUEIMANDO 10× MAIS RÁPIDO" : ""}</text>
        </g>
      )}
    </PanelBg>
  );
};

/** "correr dentro de mel": tela âmbar puxando pro centro */
const Honey: React.FC = () => {
  const f = useCurrentFrame();
  const k = f >= L(2) - 3 && f < L(3) - 3 ? ramp(f, L(2) - 3, L(2) + 12) : f >= at(5, "pegou") && f < at(6, "apito") + 6 ? 0.5 * ramp(f, at(5, "pegou"), at(5, "pegou") + 10) : 0;
  if (k <= 0) return null;
  return <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, rgba(255,190,60,0) 30%, rgba(160,90,10,0.55) 100%)", opacity: k, mixBlendMode: "multiply"}} />;
};

/** moldura da janelinha do porão (cena 16) */
const LittleWindow: React.FC = () => {
  const f = useCurrentFrame();
  if (f < L(16) - 3 || f >= SPLIT) return null;
  return (
    <AbsoluteFill>
      <svg width={1080} height={1920}>
        <defs>
          <mask id="janela">
            <rect width={1080} height={1920} fill="white" />
            <rect x={110} y={560} width={860} height={520} rx={16} fill="black" />
          </mask>
        </defs>
        <rect width={1080} height={1920} fill="#0c0806" mask="url(#janela)" />
        {[330, 540, 750].map((x) => <rect key={x} x={x - 9} y={560} width={18} height={520} fill="#1a1410" />)}
        <rect x={110} y={560} width={860} height={520} rx={16} fill="none" stroke="#2a1a10" strokeWidth={22} />
      </svg>
    </AbsoluteFill>
  );
};

const KEY = new Set(["davi", "farmacia", "luz", "birmingham", "1880", "acelerar", "tempo", "viu", "chapeucoco", "luvas", "pernas", "andavam", "mel", "pesado", "gravidade", "devagar", "2010", "trinta", "tres", "centimetros", "ancora", "pulso", "bolha", "ralo", "apito", "voltaram", "gola", "agnes", "porao", "tipo", "pressa", "eco", "ferrugem", "problema", "energia", "acucar", "glicogenio", "duas", "mil", "calorias", "dez", "tremedeira", "fome", "vela", "primeira", "pequena", "cinco", "tontura", "levado", "voltou", "sozinho", "camera", "lenta", "pombo", "janela", "enfrenta", "foge", "esgotos", "comenta"]);

const Split: React.FC = () => {
  const f = useCurrentFrame();
  if (f < SPLIT) return null;
  const both = f >= at(18, "comenta");
  return (
    <AbsoluteFill style={{background: "radial-gradient(ellipse at 50% 50%, #17375f 0%, #0b1a30 70%)"}}>
      <Panel top={150} letter="A" label="Enfrenta o Âncora" active={both || (f >= at(18, "enfrenta") && f < at(18, "ou") + 2)} C={PA} a={SPLIT} />
      <Panel top={1050} letter="B" label="Foge pelos esgotos" active={both || f >= at(18, "foge")} C={PB} a={SPLIT + 4} />
    </AbsoluteFill>
  );
};

export const VideoAnc: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const cuts = [...SHOTS.slice(1).map((s) => s.from), SPLIT];
  const street = (g: number) => (g < at(0, "caiu") - 3 ? 0 : g < L(3) - 3 ? 0.8 : g < L(4) - 3 ? 0 : g < L(7) - 3 ? 0.6 : g < at(7, "porta") - 3 ? 0.6 : 0);
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>
      <Honey />
      <LittleWindow />
      <Gravity />
      <Types />
      <Glyco />
      {cuts.map((c) => (f >= c && f < c + 5 ? <AbsoluteFill key={c} style={{background: "#000", opacity: 0.35 * (1 - (f - c) / 5)}} /> : null))}
      <Flash at={at(0, "caiu") - 2} strength={1} />
      <TitleTag text="BIRMINGHAM · 1880" from={at(0, "birmingham")} to={at(0, "acelerar") - 2} />
      <Chip from={at(0, "viu")} to={L(1) - 4} text="ALGUÉM VIU…" bg="#3a0a0a" size={60} />
      <TitleTag text="O ÂNCORA" from={at(4, "ancora")} to={L(5) - 4} />
      <Chip from={at(7, "agnes")} to={at(7, "porta") - 4} text="DONA AGNES · RELOJOEIRA" bg="#5a2a4a" size={52} />
      <Chip from={at(9, "pressa")} to={L(10) - 4} text="TIPO: PRESSA" bg="#3a8aff" size={60} />
      <Hearing from={L(11) - 3} to={L(12) - 4} v0={0.12} v1={0.3} />
      <Chip from={at(11, "tremedeira")} to={L(12) - 4} text="TREMEDEIRA + FOME" bg="#d01f1a" top={420} size={56} />
      <TitleTag text="1ª LIÇÃO" from={at(12, "primeira")} to={L(13) - 4} />
      <Chip from={at(13, "cinco")} to={at(13, "depois") - 2} text="5 SEGUNDOS" bg="#2E9E4F" size={60} />
      <Chip from={at(13, "tontura")} to={L(14) - 4} text="TONTURA" bg="#d01f1a" size={60} />
      <Chip from={at(15, "sozinho")} to={L(16) - 4} text="SOZINHO" bg="#222" size={70} />
      <Split />
      <Captions />
      <Chip from={at(18, "comenta")} to={TOTAL_ANC} text="COMENTA AÍ ↓" bg="#2E9E4F" top={905} />
      {/* ---------- áudio ---------- */}
      <Audio src={staticFile("vozanc.mp3")} />
      <Audio src={staticFile("trilha-bham.mp3")} volume={(fr) => 0.14 * clamp(fr / 30) * (1 - ramp(fr, TOTAL_ANC - 40, TOTAL_ANC))} />
      <Sequence from={0} durationInFrames={at(0, "caiu") - 3}>
        <Audio src={staticFile("sfx3/street.mp3")} volume={0.25} />
      </Sequence>
      <Sequence from={4} durationInFrames={60}>
        <Audio src={staticFile("sfx3/door.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={at(0, "luz") - 4} durationInFrames={70}>
        <Audio src={staticFile("sfx3/portal.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(0, "caiu") - 8} durationInFrames={40}>
        <Audio src={staticFile("sfx2/whoosh.mp3")} volume={0.8} />
      </Sequence>
      <Sequence from={at(0, "caiu") + 9} durationInFrames={30}>
        <Audio src={staticFile("sfx2/land.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(0, "caiu") - 3} durationInFrames={at(7, "porta") - at(0, "caiu")}>
        <Audio src={staticFile("sfx4/rua1880.mp3")} volume={(fr) => street(fr + at(0, "caiu") - 3)} loop />
      </Sequence>
      <Sequence from={at(0, "acelerar") - 4} durationInFrames={60}>
        <Audio src={staticFile("sfx4/slow.mp3")} volume={0.35} />
      </Sequence>
      {cuts.map((c) => (
        <Sequence key={"w" + c} from={c - 4} durationInFrames={30}>
          <Audio src={staticFile("sfx2/whoosh.mp3")} volume={0.16} />
        </Sequence>
      ))}
      <Sequence from={at(0, "so") - 3} durationInFrames={L(3) - at(0, "so")}>
        <Audio src={staticFile("sfx5/eye.mp3")} volume={0.45} loop />
      </Sequence>
      <Sequence from={L(2) - 3} durationInFrames={L(3) - L(2)}>
        <Audio src={staticFile("sfx6/heavy.mp3")} volume={0.25} />
      </Sequence>
      <Sequence from={L(3) - 3} durationInFrames={L(4) - L(3)}>
        <Audio src={staticFile("sfx3/ticking.mp3")} volume={0.15} loop />
      </Sequence>
      <Sequence from={L(4) - 3} durationInFrames={L(5) - L(4)}>
        <Audio src={staticFile("sfx5/eye.mp3")} volume={0.4} />
      </Sequence>
      <Sequence from={at(5, "puxada") - 10} durationInFrames={at(6, "apito") - at(5, "puxada") + 10}>
        <Audio src={staticFile("sfx6/drain.mp3")} volume={0.45} />
      </Sequence>
      <Sequence from={at(6, "apito") - 2} durationInFrames={60}>
        <Audio src={staticFile("sfx6/whistleshort.mp3")} volume={0.25} />
      </Sequence>
      <Sequence from={at(7, "porta") - 3} durationInFrames={TOTAL_ANC - at(7, "porta")}>
        <Audio src={staticFile("sfx5/basement.mp3")} volume={(fr) => (fr + at(7, "porta") - 3 >= L(16) - 3 ? 0 : 0.3)} loop />
      </Sequence>
      <Sequence from={at(7, "porta") - 3} durationInFrames={50}>
        <Audio src={staticFile("sfx3/lock.mp3")} volume={0.7} />
      </Sequence>
      <Sequence from={at(9, "problema") - 4} durationInFrames={60}>
        <Audio src={staticFile("sfx6/stomach.mp3")} volume={0.35} />
      </Sequence>
      <Sequence from={L(11) - 3} durationInFrames={L(12) - L(11)}>
        <Audio src={staticFile("sfx6/chew.mp3")} volume={0.9} />
      </Sequence>
      <Sequence from={at(13, "tremular") - 6} durationInFrames={at(13, "depois") - at(13, "tremular") + 6}>
        <Audio src={staticFile("sfx6/candle.mp3")} volume={0.6} />
      </Sequence>
      <Sequence from={L(16) - 3} durationInFrames={SPLIT - L(16)}>
        <Audio src={staticFile("sfx6/heavy.mp3")} volume={0.3} loop />
      </Sequence>
      <Sequence from={at(16, "pombo") - 2} durationInFrames={40}>
        <Audio src={staticFile("sfx6/pigeon.mp3")} volume={0.3} />
      </Sequence>
      <Sequence from={L(17) - 3} durationInFrames={SPLIT - L(17)}>
        <Audio src={staticFile("sfx5/eye.mp3")} volume={0.5} />
      </Sequence>
      <Sequence from={SPLIT} durationInFrames={TOTAL_ANC - SPLIT}>
        <Audio src={staticFile("sfx6/sewer.mp3")} volume={0.35} loop />
      </Sequence>
    </AbsoluteFill>
  );
};
