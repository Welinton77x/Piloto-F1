import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {ThreeCanvas} from "@remotion/three";
import {useFrame, useThree} from "@react-three/fiber";
import {Post} from "./Post";
import {continueRender, delayRender} from "remotion";
import {Boy, Pose} from "./Boy";
import {Room, Lights, BOOK} from "./Room";
import {Flame, Embers, FireLight} from "./Fire";
import {FPS, clamp, lerp, ramp, pop, shake, easeInOut, easeOut} from "./util";
import words from "./timing.json";

const fontFamily = "RC";
/* fonte local (Roboto Condensed) — não depende de internet na renderização */
if (typeof document !== "undefined" && !document.getElementById("rc-font")) {
  const h = delayRender("fonte");
  const st = document.createElement("style");
  st.id = "rc-font";
  st.textContent = `@font-face{font-family:RC;font-weight:100 900;src:url(${staticFile("fonts/rc-latin.woff2")}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F,U+2026}
@font-face{font-family:RC;font-weight:100 900;src:url(${staticFile("fonts/rc-latin-ext.woff2")}) format("woff2");unicode-range:U+0100-02BA,U+1E00-1EFF,U+20A0-20C0}`;
  document.head.appendChild(st);
  Promise.all([document.fonts.load('900 40px RC', "ÃÉÇ…")]).then(() => continueRender(h), () => continueRender(h));
}

/** Troque para true depois de gerar public/voz.mp3 (scripts/voz.py) */
export const HAS_VOICE = false;

/* ---------- linha do tempo (frames, 30 fps) ---------- */
const S = (w: number) => Math.round(words[w].s * FPS);
export const T = {
  fogo1: S(4), // "fogo."
  snap: S(8) + 3, // "dedos..."
  ignite: S(12), // "acende."
  reach: S(17), // "tudo"
  touch: S(20) + 8, // "encosta..."
  burn: S(21), // "pega"
};
const SHOT_B = Math.round((words[4].e + 0.45) * FPS);
const SHOT_C = Math.round((words[12].e + 0.5) * FPS);
const SHOT_D = T.burn - 6;
export const TOTAL = Math.round((words[words.length - 1].e + 1.4) * FPS);

/* ---------- câmera ---------- */
const Cam: React.FC<{pos: [number, number, number]; look: [number, number, number]; fov: number}> = ({pos, look, fov}) => {
  const {camera} = useThree();
  const c = camera as THREE.PerspectiveCamera;
  c.position.set(...pos);
  c.fov = fov;
  c.near = 0.03;
  c.far = 30;
  c.updateProjectionMatrix();
  c.lookAt(...look);
  return null;
};

/** Chama que acompanha a palma da mão (posição de mundo lida a cada quadro) */
const PalmFire: React.FC<{palm: React.RefObject<THREE.Object3D | null>; t: number; power: number; size: number}> = ({palm, t, power, size}) => {
  const g = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.getWorldPosition(v);
    g.current.position.copy(v);
  }, -1);
  return (
    <group ref={g}>
      <Flame t={t} power={power} height={0.32 * size} width={0.2 * size} seed={3} />
      <Embers t={t} count={22} spread={0.14 * size} rise={0.8 * size} size={0.016} power={power * 0.6} seed={5} />
      <FireLight t={t} power={power} position={[0, 0.15, 0.05]} intensity={2.2 * size} distance={2.2} />
    </group>
  );
};

const PalmSparks: React.FC<{palm: React.RefObject<THREE.Object3D | null>; t: number; at: number}> = ({palm, t, at}) => {
  const g = useRef<THREE.Group>(null);
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    if (!palm.current || !g.current) return;
    palm.current.updateWorldMatrix(true, false);
    palm.current.getWorldPosition(v);
    g.current.position.copy(v);
  }, -1);
  const k = t - at;
  if (k < 0 || k > 1.2) return null;
  return (
    <group ref={g}>
      <Embers t={t} count={36} spread={0.05} rise={0.5} size={0.02} life={0.6} burst={at} seed={9} />
      <pointLight color="#ffb050" intensity={6 * Math.exp(-k * 8)} distance={1.5} />
    </group>
  );
};

/** Espiral de fogo em volta do personagem (apresentação do poder) */
const FireHelix: React.FC<{t: number; power: number; center: [number, number, number]}> = ({t, power, center}) => {
  const n = 16;
  return (
    <group position={center}>
      {Array.from({length: n}, (_, i) => {
        const k = i / n;
        const a = k * Math.PI * 4 + t * 3.2;
        const rise = clamp(power * 1.3 - k * 0.3);
        const y = 0.05 + k * 2.0 * rise;
        const r = 0.78 + 0.08 * Math.sin(t * 4 + i);
        return (
          <Flame
            key={i}
            t={t + i * 0.37}
            power={clamp(power * 1.4 - k * 0.4)}
            position={[Math.cos(a) * r, y, Math.sin(a) * r]}
            height={0.3 + 0.1 * Math.sin(i * 1.7)}
            width={0.2}
            seed={i * 1.3}
          />
        );
      })}
      <Embers t={t} count={70} spread={0.7} rise={2.2} life={1.6} size={0.03} power={power} seed={21} />
      <FireLight t={t} power={power} position={[0, 1.0, 0.9]} intensity={3.5} distance={4} />
    </group>
  );
};

/* ---------- cenas ---------- */
const Scene: React.FC<{f: number}> = ({f}) => {
  const t = f / FPS;
  const palm = useRef<THREE.Object3D>(null);
  const breathe = Math.sin(t * 2.4);
  const blinkAt = (fr: number) => clamp(1 - Math.abs(f - fr) / 3);
  const blink = Math.max(blinkAt(16), blinkAt(110), blinkAt(200));

  let pose: Pose = {breathe, blink};
  let cam: {pos: [number, number, number]; look: [number, number, number]; fov: number};
  let helix = 0;
  let palmPower = 0;
  let palmSize = 1;
  let bookBurn = 0;
  let dim = 0;

  if (f < SHOT_B) {
    // A — apresentação: olha para a câmera, sorriso de canto, olhos em brasa e espiral de fogo
    const k = ramp(f, T.fogo1 - 2, T.fogo1 + 14);
    helix = ramp(f, T.fogo1, T.fogo1 + 16);
    pose = {
      ...pose,
      head: [0.02 - 0.05 * k, 0.12 * (1 - k), 0.05 * (1 - k)],
      brow: lerp(0, -0.7, k),
      smile: lerp(0.3, 0.9, k),
      glow: k,
      rShoulder: [0, 0, lerp(-0.08, -0.35, k)],
      lShoulder: [0, 0, lerp(0.08, 0.35, k)],
      rElbow: lerp(-0.15, -0.4, k),
      lElbow: lerp(-0.15, -0.4, k),
      rFist: k,
      torso: [0, 0, 0],
    };
    const p = ramp(f, 0, SHOT_B, easeInOut);
    const sh = shake(f, 0.012 * helix);
    cam = {pos: [lerp(0.3, 0, p) + sh[0], 1.4 + sh[1], lerp(3.6, 2.9, p)], look: [0, 1.12, 0], fov: 42};
    dim = 0.25 * helix;
  } else if (f < SHOT_C) {
    // B — close na mão: estala os dedos, faíscas, a mão acende
    const up = ramp(f, SHOT_B - 4, SHOT_B + 14, easeOut);
    const fist = ramp(f, T.snap - 12, T.snap - 3) * (1 - ramp(f, T.snap, T.snap + 2));
    const flick = Math.exp(-Math.max(0, f - T.snap) / 3) * (f >= T.snap ? 1 : 0);
    palmPower = pop(f, T.ignite, 14);
    const lit = ramp(f, T.ignite, T.ignite + 10);
    pose = {
      ...pose,
      rShoulder: [lerp(0, -0.5, up), 0.2 * up, lerp(-0.08, -0.12, up)],
      rElbow: lerp(-0.15, -1.75, up),
      rWrist: [0.15 * up - 0.5 * flick, 0, -0.35 * flick],
      rFist: fist,
      head: [0.22, -0.32, 0],
      pupil: [-0.6, -0.5],
      brow: lerp(-0.3, 0.5, lit),
      eyeWide: 0.6 * lit,
      smile: lerp(0.6, 1, lit),
      mouthOpen: 0.35 * lit * (1 - ramp(f, T.ignite + 20, T.ignite + 30)),
      glow: 0.3 * lit,
    };
    const p = ramp(f, SHOT_B, SHOT_C, easeInOut);
    const sh = shake(f, 0.006 * Math.exp(-Math.max(0, f - T.ignite) / 8) * (f >= T.ignite ? 1 : 0));
    cam = {
      pos: [lerp(-1.05, -0.85, p) + sh[0], lerp(1.3, 1.28, p) + sh[1], lerp(1.75, 1.45, p)],
      look: [-0.22, 1.3, 0.2],
      fov: 34,
    };
    dim = 0.35 * lit;
  } else if (f < SHOT_D) {
    // C — vai até a mesa e estende a mão para o livro
    const reach = ramp(f, T.reach, T.touch, easeInOut);
    palmPower = 0.75;
    palmSize = 0.7;
    pose = {
      ...pose,
      pos: [1.2, 0, -0.82],
      rotY: Math.PI,
      rShoulder: [lerp(-0.45, -1.0, reach), 0.15 * (1 - reach), lerp(-0.15, -0.02, reach)],
      rElbow: lerp(-1.4, -0.35, reach),
      rWrist: [lerp(0.1, 0.5, reach), lerp(0, Math.PI, reach), 0],
      head: [lerp(0.25, 0.42, reach), lerp(-0.2, 0, reach), 0],
      pupil: [0, -0.7],
      smile: 0.6,
    };
    const p = ramp(f, SHOT_C, SHOT_D, easeInOut);
    cam = {pos: [lerp(2.25, 2.05, p), lerp(1.95, 1.8, p), lerp(0.45, 0.15, p)], look: [1.4, 0.9, -1.4], fov: 40};
    dim = 0.25;
  } else {
    // D — o livro pega fogo, susto
    bookBurn = ramp(f, T.burn, T.burn + 40, (x) => x);
    const jolt = ramp(f, T.burn + 2, T.burn + 9, easeOut);
    palmPower = 0.75 * (1 - jolt * 0.6);
    palmSize = 0.7;
    pose = {
      ...pose,
      pos: [1.2, 0, lerp(-0.82, -0.7, jolt)],
      rotY: Math.PI,
      torso: [lerp(0, -0.12, jolt), 0, 0],
      rShoulder: [lerp(-1.0, -0.2, jolt), 0, lerp(-0.02, -0.35, jolt)],
      rElbow: lerp(-0.35, -1.9, jolt),
      rWrist: [0.5, lerp(Math.PI, 0, jolt), 0],
      lShoulder: [lerp(0, -0.4, jolt), 0, lerp(0.08, 0.5, jolt)],
      lElbow: lerp(-0.15, -1.6, jolt),
      head: [lerp(0.42, -0.08, jolt), 0, 0],
      eyeWide: jolt,
      brow: lerp(0, 1, jolt),
      mouthOpen: jolt * 0.9,
      pupil: [0, lerp(-0.7, -0.4, jolt)],
    };
    const sh = shake(f, 0.025 * Math.exp(-Math.max(0, f - T.burn) / 10) * (f >= T.burn ? 1 : 0) + 0.004 * bookBurn);
    const p = ramp(f, SHOT_D, TOTAL, easeInOut);
    cam = {pos: [lerp(1.5, 1.45, p) + sh[0], lerp(1.08, 1.02, p) + sh[1], lerp(-2.38, -2.28, p)], look: [1.42, 1.12, -0.85], fov: 52};
    dim = 0.25 + 0.3 * ramp(f, T.burn, T.burn + 8);
  }

  const bookPower = bookBurn > 0 ? Math.min(1, pop(f, T.burn, 10)) : 0;
  return (
    <>
      <Cam {...cam} />
      <color attach="background" args={["#1a1210"]} />
      <Lights dim={dim} />
      <Room t={t} bookBurn={bookBurn} />
      <Boy pose={pose} palmRef={palm} />
      {f < SHOT_B && <FireHelix t={t} power={helix} center={[0, 0, 0]} />}
      {f >= SHOT_B && palmPower > 0 && <PalmFire palm={palm} t={t} power={palmPower} size={palmSize} />}
      {f >= SHOT_B && f < SHOT_C && <PalmSparks palm={palm} t={t} at={T.snap / FPS} />}
      {bookPower > 0 && (
        <group position={[BOOK.pos[0], BOOK.pos[1] + 0.02, BOOK.pos[2]]}>
          <Flame t={t} power={bookPower} height={lerp(0.3, 0.75, bookBurn)} width={lerp(0.28, 0.5, bookBurn)} seed={11} />
          <Flame t={t + 3} power={bookPower * 0.8} position={[0.08, 0, 0.04]} height={lerp(0.2, 0.55, bookBurn)} width={0.26} seed={17} />
          <Embers t={t} count={60} spread={0.12} rise={1.4} size={0.03} power={bookPower} seed={13} />
          <Embers t={t} count={40} spread={0.05} rise={0.5} size={0.03} life={0.8} burst={T.burn / FPS} seed={14} />
          <FireLight t={t} power={bookPower} position={[0, 0.4, 0.25]} intensity={4.5} distance={3.5} />
        </group>
      )}
      <Post />
    </>
  );
};

/* ---------- sobreposições 2D ---------- */
const KEY = new Set(["fogo", "acende"]);
const clean = (w: string) => w.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

const Captions: React.FC = () => {
  const f = useCurrentFrame();
  const chunks = useMemo(() => {
    const out: {w: typeof words; s: number; e: number}[] = [];
    let cur: typeof words = [];
    for (const w of words) {
      const len = cur.map((x) => x.w).join(" ").length + w.w.length;
      if (cur.length && len > 14) {
        out.push({w: cur, s: cur[0].s, e: cur[cur.length - 1].e});
        cur = [];
      }
      cur.push(w);
      if (/[.:…]$/.test(w.w)) {
        out.push({w: cur, s: cur[0].s, e: cur[cur.length - 1].e});
        cur = [];
      }
    }
    if (cur.length) out.push({w: cur, s: cur[0].s, e: cur[cur.length - 1].e});
    return out;
  }, []);
  const t = f / FPS;
  const i = chunks.findIndex((c, k) => t >= c.s - 0.05 && t < (chunks[k + 1]?.s ?? c.e + 0.6) - 0.05);
  if (i < 0) return null;
  const c = chunks[i];
  const sc = pop(f, Math.round(c.s * FPS) - 2, 8);
  return (
    <div
      style={{
        position: "absolute",
        top: 1250,
        left: 60,
        right: 60,
        textAlign: "center",
        fontFamily,
        fontWeight: 900,
        fontSize: 86,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "#fff",
        WebkitTextStroke: "10px #120c08",
        paintOrder: "stroke fill",
        textShadow: "0 8px 18px rgba(0,0,0,0.55)",
        transform: `scale(${0.85 + 0.15 * sc})`,
      }}
    >
      {c.w.map((w, k) => (
        <span key={k} style={{color: KEY.has(clean(w.w)) ? "#FFB31A" : "#FFFFFF"}}>
          {w.w.replace(/\.\.\.$/, "…")}
          {k < c.w.length - 1 ? " " : ""}
        </span>
      ))}
    </div>
  );
};

/** Faixa de título inclinada (ex.: "FOGO") */
const TitleTag: React.FC<{text: string; from: number; to: number}> = ({text, from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const inn = pop(f, from, 10);
  const out = ramp(f, to - 8, to);
  return (
    <div style={{position: "absolute", top: 210, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - out}}>
      <div
        style={{
          transform: `rotate(-4deg) scale(${inn}) translateY(${-40 * out}px)`,
          background: "linear-gradient(90deg,#b3160b,#ff5a12 55%,#ffb21c)",
          padding: "18px 70px",
          borderRadius: 14,
          border: "6px solid #fff3d6",
          boxShadow: "0 0 40px rgba(255,110,20,0.75), 0 10px 0 rgba(0,0,0,0.35)",
          fontFamily,
          fontWeight: 900,
          fontSize: 104,
          letterSpacing: 10,
          color: "#fff",
          WebkitTextStroke: "6px #3a0c04",
          paintOrder: "stroke fill",
        }}
      >
        {text}
      </div>
    </div>
  );
};

const Flash: React.FC<{at: number; strength?: number}> = ({at, strength = 0.7}) => {
  const f = useCurrentFrame();
  const k = f - at;
  if (k < 0 || k > 14) return null;
  return (
    <AbsoluteFill
      style={{background: "radial-gradient(circle at 50% 55%, rgba(255,190,90,1), rgba(255,90,20,0.6) 45%, rgba(0,0,0,0) 75%)", opacity: strength * Math.exp(-k / 3.5), mixBlendMode: "screen"}}
    />
  );
};

/** Corte seco com leve “flash” de transição */
const Cut: React.FC<{at: number}> = ({at}) => {
  const f = useCurrentFrame();
  const k = f - at;
  if (k < 0 || k > 5) return null;
  return <AbsoluteFill style={{background: "#000", opacity: 0.35 * (1 - k / 5)}} />;
};

export const Video: React.FC = () => {
  const f = useCurrentFrame();
  const {width, height} = useVideoConfig();
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <ThreeCanvas width={width} height={height} shadows gl={{antialias: false, powerPreference: "high-performance"}} dpr={1}>
        <Scene f={f} />
      </ThreeCanvas>
      <Flash at={T.fogo1} />
      <Flash at={T.ignite} strength={0.45} />
      <Flash at={T.burn} strength={0.8} />
      <Cut at={SHOT_B} />
      <Cut at={SHOT_C} />
      <Cut at={SHOT_D} />
      <TitleTag text="FOGO" from={T.fogo1} to={SHOT_B + 40} />
      <Captions />
      {HAS_VOICE && <Audio src={staticFile("voz.mp3")} />}
      <Sequence from={T.fogo1 - 12}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={T.fogo1}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={T.snap}>
        <Audio src={staticFile("sfx/snap.wav")} volume={0.9} />
      </Sequence>
      <Sequence from={T.ignite - 4}>
        <Audio src={staticFile("sfx/whoosh.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={T.ignite}>
        <Audio src={staticFile("sfx/crackle.wav")} volume={(fr) => 0.18 * clamp(fr / 10)} />
      </Sequence>
      <Sequence from={T.burn}>
        <Audio src={staticFile("sfx/boom.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={T.burn}>
        <Audio src={staticFile("sfx/crackle.wav")} volume={(fr) => 0.45 * clamp(fr / 6)} />
      </Sequence>
    </AbsoluteFill>
  );
};


