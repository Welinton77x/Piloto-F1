import React from "react";
import {AbsoluteFill, useCurrentFrame} from "remotion";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET, norm, wordLocal} from "../data/scenes";
import type {TimedScene} from "../data/scenes";
import {L, SP, clamp01, easeOut, mixHex} from "../lib/anim";
import {project} from "../lib/camera";
import {track} from "../lib/track";

export const FONT = "Montserrat";
const KIND: Record<Kind, {bg: string; fg: string}> = {
  problem: {bg: "#E53935", fg: "#FFFFFF"},
  solution: {bg: "#2E9E4F", fg: "#FFFFFF"},
  neutral: {bg: "#1E88E5", fg: "#FFFFFF"},
  attention: {bg: "#FFC400", fg: "#1B1B1B"},
};

const Icon: React.FC<{kind: Kind; size: number}> = ({kind, size}) => {
  const c = KIND[kind].fg;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" style={{flex: "none"}}>
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

/* ---------- Selos no topo (a partir de 262 px), empilhados ---------- */
const BadgeView: React.FC<{b: Badge; top: number; f: number}> = ({b, top, f}) => {
  const k = KIND[b.kind];
  const sc = SP(f, b.f0, 11, 130);
  const out = b.f1 !== undefined ? 1 - clamp01((f - b.f1) / 8) : 1;
  return (
    <div style={{position: "absolute", top, left: 90, right: 90, display: "flex", justifyContent: "center", transform: `scale(${sc * out})`, transformOrigin: "50% 0%", opacity: out}}>
      <div style={{display: "flex", alignItems: "center", gap: 14, background: k.bg, color: k.fg, fontFamily: FONT, fontWeight: 900, fontSize: 44, lineHeight: 1.08, padding: "12px 26px", borderRadius: 24, border: "4px solid rgba(0,0,0,0.35)", boxShadow: "0 6px 0 rgba(0,0,0,0.3)", textAlign: "center", maxWidth: 880}}>
        <Icon kind={b.kind} size={52} />
        <span>{b.text}</span>
      </div>
    </div>
  );
};

const Badges: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  let top = 262;
  const vis = s.badges.filter((b) => f >= b.f0 && (b.f1 === undefined || f < b.f1 + 8));
  return (
    <>
      {vis.map((b, i) => {
        const lines = b.text.length > 22 ? 2 : 1;
        const el = <BadgeView key={b.text} b={b} top={top} f={f} />;
        top += lines * 48 + 40 + 16;
        return <React.Fragment key={i}>{el}</React.Fragment>;
      })}
    </>
  );
};

/* ---------- Legendas: UMA FALA POR VEZ (pedido do usuário) ---------- */
type W = {t: string; start: number; end: number; key: boolean};
type Phrase = {words: W[]; start: number; end: number};

const buildPhrases = (s: TimedScene): Phrase[] => {
  const raw = s.narration.split(/\s+/).filter(Boolean);
  const exact = s.voWords && s.voWords.length === raw.length;
  const speechEnd = s.voSeconds ? VO_OFFSET + s.voSeconds * 30 : s.durationInFrames - TAIL;
  const weights = raw.map((w) => w.length + 2 + (/[,.:?!]$/.test(w) ? 6 : 0));
  const total = weights.reduce((a, b) => a + b, 0);
  const keys = new Set(s.highlights.flatMap((h) => h.split(/\s+/).map(norm)).filter((x) => x.length > 2));
  let acc = 0;
  const ws: W[] = raw.map((t, i) => {
    let start: number, end: number;
    if (exact) {
      start = VO_OFFSET + s.voWords![i].s * 30;
      end = VO_OFFSET + s.voWords![i].e * 30;
    } else {
      start = VO_OFFSET + (acc / total) * (speechEnd - VO_OFFSET);
      acc += weights[i];
      end = VO_OFFSET + (acc / total) * (speechEnd - VO_OFFSET);
    }
    return {t, start, end, key: keys.has(norm(t))};
  });
  // corta nas pausas naturais (pontuação); trechos longos viram duas falas
  const groups: W[][] = [];
  let cur: W[] = [];
  for (const w of ws) {
    cur.push(w);
    if (/[,.:?!]$/.test(w.t)) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) groups.push(cur);
  const out: Phrase[] = [];
  for (const g of groups) {
    const len = g.map((w) => w.t).join(" ").length;
    if (len <= 38) out.push({words: g, start: g[0].start, end: g[g.length - 1].end});
    else {
      // divide perto do meio, em limite de palavra
      let best = 1, bestD = 1e9, accLen = 0;
      for (let i = 0; i < g.length - 1; i++) {
        accLen += g[i].t.length + 1;
        const d = Math.abs(accLen - len / 2);
        if (d < bestD) {
          bestD = d;
          best = i + 1;
        }
      }
      for (const part of [g.slice(0, best), g.slice(best)]) out.push({words: part, start: part[0].start, end: part[part.length - 1].end});
    }
  }
  return out;
};

const Captions: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const phrases = React.useMemo(() => buildPhrases(s), [s]);
  // cada fala aparece sozinha: some antes da próxima (intervalo mínimo de 4 f)
  let cur: Phrase | undefined;
  let endF = 0;
  for (let i = 0; i < phrases.length; i++) {
    const p = phrases[i];
    const next = phrases[i + 1];
    const show0 = p.start - 2;
    const show1 = Math.min(p.end + 6, next ? next.start - 6 : Infinity);
    if (f >= show0 && f < show1) {
      cur = p;
      endF = show1;
    }
  }
  if (!cur) return null;
  const fadeIn = clamp01((f - (cur.start - 2)) / 4);
  const fadeOut = clamp01((endF - f) / 4);
  return (
    <div style={{position: "absolute", left: 90, right: 90, top: 1418, transform: `translateY(-50%)`, opacity: Math.min(fadeIn, fadeOut), display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: 18, rowGap: 4, fontFamily: FONT, fontWeight: 900, fontSize: 58, lineHeight: 1.1, textTransform: "uppercase", WebkitTextStroke: "10px #101820", paintOrder: "stroke fill", textAlign: "center"}}>
      {cur.words.map((w, i) => {
        const active = f >= w.start - 1 && f < w.end + 1;
        const color = active ? "#FFD400" : w.key ? "#4DD0FF" : "#FFFFFF";
        return (
          <span key={i} style={{color, display: "inline-block"}}>
            {w.t}
          </span>
        );
      })}
    </div>
  );
};

/* ---------- Rótulos ancorados em pontos 3D ---------- */
const Card: React.FC<{text: string; color: string; scale?: number; fs?: number}> = ({text, color, scale = 1, fs = 36}) => (
  <div style={{fontFamily: FONT, fontWeight: 900, fontSize: fs, color: "#101820", background: "#FFFFFF", borderBottom: `7px solid ${color}`, borderRadius: 16, padding: "5px 20px 3px", boxShadow: "0 5px 0 rgba(0,0,0,0.28)", whiteSpace: "nowrap", transform: `scale(${scale})`}}>
    {text}
  </div>
);

type Lab = {id: string; text: string; p: [number, number, number]; f0: number; f1?: number; color: string};
const LABELS: Lab[] = [
  {id: "s2", text: "SOLO", p: [-2.0, -1.4, 1.0], f0: 119, color: "#8d6e63"},
  {id: "s4", text: "CAIMENTO", p: [0, 0.45, 1.0], f0: 26, f1: 142, color: "#4DD0FF"},
  {id: "s4", text: "MEIO-FIO", p: [2.25, 0.35, -0.6], f0: 120, color: "#9aa4ae"},
  {id: "s5", text: "RIO", p: [5.5, -1.7, 1.0], f0: 140, color: "#4DD0FF"},
  {id: "s9", text: "PISCINÃO", p: [3.85, -1.3, 1.0], f0: 120, color: "#2E9E4F"},
];

const Labels: React.FC<{s: TimedScene; f: number}> = ({s, f}) => (
  <>
    {LABELS.filter((l) => l.id === s.id).map((l) => {
      const f0 = Math.round(l.f0 * s.k);
      const f1 = l.f1 !== undefined ? Math.round(l.f1 * s.k) : undefined;
      if (f < f0 || (f1 !== undefined && f >= f1)) return null;
      const pt = project(s.startFrame + f, l.p);
      if (!pt) return null;
      const y = Math.max(560, Math.min(1290, pt.y));
      const x = Math.max(200, Math.min(880, pt.x));
      return (
        <div key={l.text} style={{position: "absolute", left: x, top: y, transform: "translate(-50%, -50%)"}}>
          <Card text={l.text} color={l.color} scale={SP(f, f0, 12, 160)} />
        </div>
      );
    })}
  </>
);

/* ---------- Painel genérico ---------- */
const Panel: React.FC<{top: number; height: number; children: React.ReactNode; scale?: number; width?: number}> = ({top, height, children, scale = 1, width = 900}) => (
  <div style={{position: "absolute", left: (1080 - width) / 2, width, top, height, background: "rgba(16,24,32,0.82)", border: "4px solid rgba(255,255,255,0.15)", borderRadius: 28, transform: `scale(${scale})`, transformOrigin: "50% 50%", fontFamily: FONT, fontWeight: 900, color: "#fff"}}>{children}</div>
);

/* s3 (c): medidores "1 em 10" × "mais da metade" */
const Gauges: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const k = s.k;
  const fa = Math.round(261 * k);
  if (f < fa) return null;
  const nat = track("gaugeNatural.drops", s.startFrame + f, 0);
  const city = track("gaugeCity.drops", s.startFrame + f, 0);
  const Drop: React.FC<{on: boolean; c: string}> = ({on, c}) => (
    <svg width={52} height={64} viewBox="0 0 24 30">
      <path d="M12 2C12 2 4 13 4 19a8 8 0 0 0 16 0C20 13 12 2 12 2z" fill={on ? c : "rgba(255,255,255,0.15)"} stroke={on ? "#fff" : "rgba(255,255,255,0.35)"} strokeWidth="1.6" />
    </svg>
  );
  const Row: React.FC<{title: string; sub: string; n: number; c: string; delay: number}> = ({title, sub, n, c, delay}) => (
    <div style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10, opacity: clamp01((f - delay) / 8)}}>
      <div style={{fontSize: 40, color: c}}>{title}</div>
      <div style={{display: "grid", gridTemplateColumns: "repeat(5, 52px)", gap: 8}}>
        {Array.from({length: 10}).map((_, i) => (
          <Drop key={i} on={i < Math.round(n)} c={c} />
        ))}
      </div>
      <div style={{fontSize: 34}}>{sub}</div>
    </div>
  );
  return (
    <Panel top={600} height={720} scale={SP(f, fa, 14, 140)}>
      <div style={{textAlign: "center", fontSize: 34, marginTop: 26, color: "#cfe8ff"}}>DE CADA 10 GOTAS, QUANTAS ESCORREM?</div>
      <div style={{display: "flex", justifyContent: "space-around", marginTop: 34}}>
        <Row title="TERRA" sub={`≈ ${Math.round(nat * 10)}%`} n={nat} c="#2E9E4F" delay={fa} />
        <Row title="CIDADE" sub={`≈ ${Math.round(city * 10)}%`} n={city} c="#E53935" delay={Math.round(352 * k) - 4} />
      </div>
      <div style={{textAlign: "center", fontSize: 22, marginTop: 30, color: "rgba(255,255,255,0.6)", fontWeight: 800}}>valores aproximados · Arnold &amp; Gibbons (1996)</div>
    </Panel>
  );
};

/* s7: régua de capacidade da galeria */
const Capacity: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const k = s.k;
  const a = Math.round(125 * k), b = Math.round(264 * k);
  if (f < a || f >= b) return null;
  const v = track("capacityBar.value", s.startFrame + f, 30);
  const col = v > 90 ? "#E53935" : v > 70 ? "#FFC400" : "#4DD0FF";
  return (
    <div style={{position: "absolute", right: 70, top: 640, width: 150, height: 560, fontFamily: FONT, fontWeight: 900, color: "#fff", textAlign: "center", opacity: clamp01((f - a) / 8)}}>
      <div style={{fontSize: 26, WebkitTextStroke: "6px #101820", paintOrder: "stroke fill"}}>CAPACIDADE</div>
      <div style={{position: "relative", margin: "12px auto", width: 74, height: 440, borderRadius: 18, background: "rgba(16,24,32,0.8)", border: "4px solid #fff", overflow: "hidden"}}>
        <div style={{position: "absolute", left: 0, right: 0, bottom: 0, height: `${v}%`, background: col}} />
      </div>
      <div style={{fontSize: 40, WebkitTextStroke: "7px #101820", paintOrder: "stroke fill", color: col}}>{Math.round(v)}%</div>
    </div>
  );
};

/* s9: hidrograma esquemático (vazão × tempo), sem números */
const Hydrograph: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const k = s.k;
  const a = Math.round(250 * k);
  if (f < a) return null;
  const without = track("hydrograph.curveWithout", s.startFrame + f, 0);
  const withR = track("hydrograph.curveWith", s.startFrame + f, 0);
  const W = 760, H = 250;
  const curve = (peak: number, spread: number, center: number) => {
    const pts: string[] = [];
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const y = 0.06 + peak * Math.exp(-((t - center) ** 2) / (2 * spread ** 2));
      pts.push(`${(t * W).toFixed(1)},${(H - y * H).toFixed(1)}`);
    }
    return pts.join(" ");
  };
  const len = 1400;
  return (
    <Panel top={1010} height={340} scale={SP(f, a, 14, 140)}>
      <div style={{display: "flex", justifyContent: "space-between", padding: "16px 34px 0", fontSize: 26}}>
        <span>VAZÃO NO RIO ↑</span>
        <span style={{color: "#E53935"}}>— SEM</span>
        <span style={{color: "#4DD0FF"}}>— COM PISCINÃO</span>
      </div>
      <svg width={W} height={H} style={{position: "absolute", left: 70, top: 64}}>
        <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(255,255,255,0.5)" strokeWidth={3} />
        <polyline points={curve(0.88, 0.09, 0.3)} fill="none" stroke="#E53935" strokeWidth={8} strokeDasharray={len} strokeDashoffset={len * (1 - without)} strokeLinecap="round" />
        <polyline points={curve(0.5, 0.17, 0.42)} fill="none" stroke="#4DD0FF" strokeWidth={8} strokeDasharray={len} strokeDashoffset={len * (1 - withR)} strokeLinecap="round" />
      </svg>
      <div style={{position: "absolute", right: 34, bottom: 8, fontSize: 24, color: "rgba(255,255,255,0.75)"}}>TEMPO →</div>
    </Panel>
  );
};

/* s11 (a): balança "chega × sai" */
const Balance: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const k = s.k;
  const a = Math.round(70 * k), b = Math.round(216 * k);
  if (f < a || f >= b) return null;
  const inflow = track("inflowBar.value", s.startFrame + f, 0);
  const outflow = track("outflowBar.value", s.startFrame + f, 0);
  const Bar: React.FC<{label: string; v: number; c: string}> = ({label, v, c}) => (
    <div style={{display: "flex", alignItems: "center", gap: 18, margin: "14px 34px"}}>
      <div style={{width: 300, fontSize: 30, textAlign: "right"}}>{label}</div>
      <div style={{flex: 1, height: 44, borderRadius: 14, background: "rgba(255,255,255,0.12)", overflow: "hidden"}}>
        <div style={{width: `${v * 100}%`, height: "100%", background: c}} />
      </div>
    </div>
  );
  return (
    <Panel top={1040} height={230} scale={SP(f, a, 14, 140)}>
      <div style={{height: 18}} />
      <Bar label="CHUVA QUE CHEGA" v={inflow} c="#E53935" />
      <Bar label="INFILTRA + ESCOA" v={outflow} c="#2E9E4F" />
    </Panel>
  );
};

/* s11 (b): marca + ícones */
const Brand: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const wf = Math.round(318 * s.k);
  const ci = wordLocal(s, "Comenta") ?? Math.round(274 * s.k);
  if (f < ci - 4) return null;
  const pulse = 1 + 0.08 * Math.max(0, Math.sin((f - ci) * 0.3)) * (f < ci + 40 ? 1 : 0);
  return (
    <>
      <div style={{position: "absolute", left: 0, right: 0, top: 1060, display: "flex", justifyContent: "center", gap: 560, opacity: clamp01((f - ci) / 6)}}>
        {[0, 1].map((i) => (
          <svg key={i} width={96} height={96} viewBox="0 0 24 24" style={{transform: `scale(${i === 0 ? pulse : 1})`}}>
            {i === 0 ? <path d="M4 4h16v12H9l-5 4z" fill="#fff" stroke="#101820" strokeWidth="1.4" strokeLinejoin="round" /> : <path d="M4 12l16-8-6 16-3-7z" fill="#fff" stroke="#101820" strokeWidth="1.4" strokeLinejoin="round" />}
          </svg>
        ))}
      </div>
      {f >= wf && (
        <div style={{position: "absolute", left: 0, right: 0, top: 1180, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 92, color: "#fff", WebkitTextStroke: "12px #101820", paintOrder: "stroke fill", transform: `scale(${SP(f, wf, 12, 140)})`}}>
          POR DENTRO <span style={{color: "#4DD0FF"}}>LAB</span>
        </div>
      )}
    </>
  );
};

/* relâmpago (s7) */
const Flash: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  if (s.id !== "s7") return null;
  const a = Math.round(35 * s.k), b = Math.round(38 * s.k);
  const o = Math.max(L(f, a, a + 6, 0.8, 0, easeOut) * (f >= a ? 1 : 0), L(f, b, b + 6, 0.8, 0, easeOut) * (f >= b ? 1 : 0));
  return o > 0.01 ? <AbsoluteFill style={{background: "#ffffff", opacity: o}} /> : null;
};

export const Overlay: React.FC<{s: TimedScene}> = ({s}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      <Flash s={s} f={f} />
      {s.id === "s3" && <Gauges s={s} f={f} />}
      {s.id === "s7" && <Capacity s={s} f={f} />}
      {s.id === "s9" && <Hydrograph s={s} f={f} />}
      {s.id === "s11" && <Balance s={s} f={f} />}
      {s.id === "s11" && <Brand s={s} f={f} />}
      <Labels s={s} f={f} />
      <Badges s={s} f={f} />
      <Captions s={s} f={f} />
    </AbsoluteFill>
  );
};
export const unusedMix = mixHex;
