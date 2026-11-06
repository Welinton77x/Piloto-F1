import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import {loadFont} from "@remotion/google-fonts/Montserrat";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET} from "../data/scenes";
import type {TimedScene} from "../data/scenes";
import {L, SP, easeInOut, easeOut} from "../lib/anim";

const {fontFamily} = loadFont("normal", {weights: ["800", "900"], subsets: ["latin", "latin-ext"]});

const KIND: Record<Kind, {bg: string; fg: string; icon: string}> = {
  problem: {bg: "#E53935", fg: "#FFFFFF", icon: "✖"},
  solution: {bg: "#2E9E4F", fg: "#FFFFFF", icon: "✔"},
  neutral: {bg: "#1E88E5", fg: "#FFFFFF", icon: "i"},
  attention: {bg: "#FFC400", fg: "#1B1B1B", icon: "?"},
};

/** Ícone vetorial (SVG) — evita depender de emoji do sistema. */
const Icon: React.FC<{kind: Kind; size: number}> = ({kind, size}) => {
  const s = size;
  const c = KIND[kind].fg;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" style={{flex: "none"}}>
      <circle cx="12" cy="12" r="11" fill="rgba(255,255,255,0.22)" />
      {kind === "problem" && <path d="M7 7l10 10M17 7L7 17" stroke={c} strokeWidth="3.2" strokeLinecap="round" />}
      {kind === "solution" && <path d="M6 12.5l4 4 8-9" stroke={c} strokeWidth="3.2" strokeLinecap="round" fill="none" />}
      {kind === "neutral" && (
        <>
          <circle cx="12" cy="7" r="1.8" fill={c} />
          <path d="M12 11v7" stroke={c} strokeWidth="3" strokeLinecap="round" />
        </>
      )}
      {kind === "attention" && (
        <>
          <path d="M8.5 9a3.5 3.5 0 1 1 5.2 3c-1 .6-1.7 1.2-1.7 2.4" stroke={c} strokeWidth="2.8" strokeLinecap="round" fill="none" />
          <circle cx="12" cy="18" r="1.7" fill={c} />
        </>
      )}
    </svg>
  );
};

/* ---------- Badges: topo, a partir de ~262 px, empilhados ---------- */
const BadgeView: React.FC<{b: Badge; top: number; long: boolean}> = ({b, top, long}) => {
  const f = useCurrentFrame();
  const k = KIND[b.kind];
  const sc = SP(f, b.f0, 12, 120);
  if (f < b.f0 || (b.f1 !== undefined && f > b.f1)) return null;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 90,
        right: 90,
        display: "flex",
        justifyContent: "center",
        transform: `scale(${sc})`,
        transformOrigin: "50% 0%",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          background: k.bg,
          color: k.fg,
          fontFamily,
          fontWeight: 900,
          fontSize: long ? 38 : 44,
          lineHeight: 1.08,
          padding: "12px 24px",
          borderRadius: 24,
          border: "4px solid rgba(0,0,0,0.35)",
          boxShadow: "0 6px 0 rgba(0,0,0,0.3)",
          textAlign: "center",
          maxWidth: 860,
        }}
      >
        <Icon kind={b.kind} size={long ? 44 : 52} />
        <span>{b.text}</span>
      </div>
    </div>
  );
};

const Badges: React.FC<{s: TimedScene}> = ({s}) => {
  // empilha sem cobrir: cada badge desce pela altura estimada dos anteriores
  let top = 240;
  return (
    <>
      {s.badges.map((b, i) => {
        const long = b.text.length > 26;
        const lines = Math.max(1, Math.ceil(b.text.length / 26));
        const h = lines * (long ? 44 : 50) + 40;
        const el = <BadgeView key={i} b={b} top={top} long={long} />;
        top += h + 16;
        return el;
      })}
    </>
  );
};

/* ---------- Legendas estilo Shorts ---------- */
const norm = (w: string) =>
  w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");

type Chunk = {words: {t: string; start: number; end: number; key: boolean}[]; start: number; end: number};

const buildChunks = (s: TimedScene): Chunk[] => {
  const raw = s.narration.split(/\s+/).filter(Boolean);
  const speechStart = VO_OFFSET;
  const speechEnd = s.voSeconds ? VO_OFFSET + s.voSeconds * 30 : s.durationInFrames - TAIL;
  const weights = raw.map((w) => w.length + 2);
  const total = weights.reduce((a, b) => a + b, 0);
  const exact = s.voWords && s.voWords.length === raw.length;
  let acc = 0;
  const keys = new Set(s.highlights.flatMap((h) => h.split(/\s+/).map(norm)).filter(Boolean));
  const ws = raw.map((t, i) => {
    let start: number;
    let end: number;
    if (exact) {
      start = VO_OFFSET + s.voWords![i].s * 30;
      end = VO_OFFSET + s.voWords![i].e * 30;
    } else {
      start = speechStart + (acc / total) * (speechEnd - speechStart);
      acc += weights[i];
      end = speechStart + (acc / total) * (speechEnd - speechStart);
    }
    return {t, start, end, key: keys.has(norm(t)) || /\d/.test(t)};
  });
  const chunks: Chunk[] = [];
  let cur: Chunk["words"] = [];
  const flush = () => {
    if (cur.length) {
      chunks.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
      cur = [];
    }
  };
  for (const w of ws) {
    const len = cur.map((x) => x.t).join(" ").length + w.t.length + (cur.length ? 1 : 0);
    if (cur.length && len > 15) flush();
    cur.push(w);
    if (/[.!?:…]$/.test(w.t)) flush();
  }
  flush();
  return chunks;
};

const Captions: React.FC<{s: TimedScene}> = ({s}) => {
  const f = useCurrentFrame();
  const chunks = React.useMemo(() => buildChunks(s), [s]);
  const idx = chunks.findIndex((c, i) => f >= c.start && f < (chunks[i + 1]?.start ?? c.end + 8));
  if (idx < 0) return null;
  const c = chunks[idx];
  const pop = SP(f, c.start, 14, 200);
  return (
    <div
      style={{
        position: "absolute",
        left: 110,
        right: 110,
        top: 1580,
        transform: `translateY(-50%) scale(${0.9 + 0.1 * pop})`,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        columnGap: 22,
        rowGap: 6,
        fontFamily,
        fontWeight: 900,
        fontSize: 58,
        lineHeight: 1.08,
        textTransform: "uppercase",
        WebkitTextStroke: "8px #101820",
        paintOrder: "stroke fill",
      }}
    >
      {c.words.map((w, i) => {
        const active = f >= w.start && f < w.end;
        const color = active ? "#FFD400" : w.key ? "#4DD0FF" : "#FFFFFF";
        return (
          <span key={i} style={{color, display: "inline-block", transform: active ? "scale(1.05)" : "none"}}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- Rótulos 2D: cartões brancos pequenos (posição fixa) ---------- */
const CardBox: React.FC<{text: string; color: string; scale?: number; fs?: number}> = ({text, color, scale = 1, fs = 44}) => (
  <div
    style={{
      fontFamily,
      fontWeight: 900,
      fontSize: fs,
      color: "#101820",
      background: "#FFFFFF",
      borderBottom: `8px solid ${color}`,
      borderRadius: 18,
      padding: "6px 24px 4px",
      boxShadow: "0 6px 0 rgba(0,0,0,0.28)",
      whiteSpace: "nowrap",
      transform: `scale(${scale})`,
    }}
  >
    {text}
  </div>
);
type Lbl = {text: string; f0: number; y: number; color?: string};
const LABELS: Record<string, Lbl[]> = {
  s2: [{text: "300 KM/H", f0: 60, y: 1250, color: "#FFC400"}],
  s3: [{text: "FORÇA G", f0: 30, y: 1170, color: "#E53935"}],
  s4: [
    {text: "MÚSCULOS DO PESCOÇO", f0: 20, y: 1170, color: "#FF7043"},
    {text: "PESCOÇO", f0: 50, y: 1250, color: "#4DD0FF"},
  ],
  s7: [{text: "ABDÔMEN", f0: 285, y: 1250, color: "#FFB74D"}],
};
const Labels: React.FC<{id: string}> = ({id}) => {
  const f = useCurrentFrame();
  return (
    <>
      {(LABELS[id] ?? []).map((l, i) => {
        if (f < l.f0) return null;
        const sc = SP(f, l.f0, 14, 130);
        return (
          <div key={i} style={{position: "absolute", left: 60, right: 60, top: l.y, display: "flex", justifyContent: "center"}}>
            <CardBox text={l.text} color={l.color ?? "#4DD0FF"} scale={sc} />
          </div>
        );
      })}
    </>
  );
};

/* ---------- Contadores (balança, bpm, cronômetro, medidor) ---------- */
const bpmAt = (f: number) => L(f, 60, 170, 60, 170, easeInOut);
const Chip: React.FC<{text: string; color: string; x?: "l" | "r" | "c"; top?: number}> = ({text, color, x = "c", top = 1250}) => (
  <div
    style={{
      position: "absolute",
      top,
      left: x === "r" ? 540 : 40,
      right: x === "l" ? 540 : 40,
      display: "flex",
      justifyContent: "center",
    }}
  >
    <CardBox text={text} color={color} fs={46} />
  </div>
);

const Counters: React.FC<{id: string}> = ({id}) => {
  const f = useCurrentFrame();
  if (id === "s3" && f >= 150) return <Chip text={`${Math.round(L(f, 150, 230, 6, 35, easeOut))} KG`} color="#E53935" />;
  if (id === "s5") {
    const t = L(f, 170, 230, 0, 118, easeInOut);
    const mm = Math.floor(t / 60);
    const ss = String(Math.floor(t % 60)).padStart(2, "0");
    return (
      <>
        <Chip text="60 BPM" color="#2E9E4F" x="l" top={1150} />
        <Chip text={`${Math.round(bpmAt(f))} BPM`} color="#E53935" x="r" top={1150} />
        {f >= 170 && <Chip text={`${mm}:${ss}`} color="#FFC400" top={1250} />}
      </>
    );
  }
  if (id === "s6" && f >= 110) return <Chip text={`${L(f, 110, 220, 0, -4, easeOut).toFixed(1).replace(".", ",")} KG`} color="#E53935" />;
  if (id === "s7" && f >= 20 && f < 150) return <Chip text={`${"PESA MAIS DE "}${Math.round(L(f, 20, 70, 0, 100, easeOut))} KG NO PEDAL`} color="#E53935" />;
  if (id === "s9" && f >= 90 && f < 180) return <Chip text="170 BPM" color="#E53935" />;
  return null;
};

/* ---------- Cortes (wipe) da cena 9 ---------- */
const Wipe: React.FC = () => {
  const f = useCurrentFrame();
  const w = [87, 177].find((a) => f >= a && f <= a + 6);
  if (w === undefined) return null;
  const x = L(f, w, w + 6, -1080, 1080);
  return <div style={{position: "absolute", top: 0, bottom: 0, left: x, width: 1080, background: "#101820", opacity: 0.9}} />;
};

/* ---------- Fecho: wordmark provisório do canal + ícones ---------- */
const Closing: React.FC = () => {
  const f = useCurrentFrame();
  const wm = SP(f, 20, 12, 120);
  const pulse = 1 + 0.2 * Math.max(0, Math.sin(((f - 80) / 20) * Math.PI)) * (f >= 80 && f <= 100 ? 1 : 0);
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 90,
          right: 90,
          top: 1200,
          textAlign: "center",
          fontFamily,
          fontWeight: 900,
          fontSize: 78,
          color: "#fff",
          WebkitTextStroke: "12px #101820",
          paintOrder: "stroke fill",
          transform: `scale(${wm})`,
          letterSpacing: 2,
        }}
      >
        POR DENTRO <span style={{color: "#4DD0FF"}}>LAB</span>
      </div>
      <svg width={110} height={110} viewBox="0 0 24 24" style={{position: "absolute", left: 250, top: 1310, transform: `scale(${pulse})`}}>
        <path d="M4 4h16v12H9l-5 4z" fill="#fff" stroke="#101820" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
      <svg width={110} height={110} viewBox="0 0 24 24" style={{position: "absolute", right: 250, top: 1310}}>
        <path d="M4 12l16-8-6 16-3-7z" fill="#fff" stroke="#101820" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    </>
  );
};

export const Overlay: React.FC<{s: TimedScene}> = ({s}) => (
  <AbsoluteFill style={{pointerEvents: "none"}}>
    <Labels id={s.id} />
    <Counters id={s.id} />
    {s.id === "s9" && <Wipe />}
    {s.id === "s11" && <Closing />}
    <Badges s={s} />
    <Captions s={s} />
  </AbsoluteFill>
);
