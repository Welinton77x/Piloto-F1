import React from "react";
import {AbsoluteFill, random, useCurrentFrame} from "remotion";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET, finalCut, norm, wordLocal} from "../data/scenes";
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
  // trechos longos são divididos (recursivamente, perto do meio) até caberem em 2 linhas
  const push = (g: W[]) => {
    const len = g.map((w) => w.t).join(" ").length;
    if (len <= 34 || g.length < 2) {
      out.push({words: g, start: g[0].start, end: g[g.length - 1].end});
      return;
    }
    let best = 1, bestD = 1e9, accLen = 0;
    for (let i = 0; i < g.length - 1; i++) {
      accLen += g[i].t.length + 1;
      const d = Math.abs(accLen - len / 2);
      if (d < bestD) {
        bestD = d;
        best = i + 1;
      }
    }
    push(g.slice(0, best));
    push(g.slice(best));
  };
  groups.forEach(push);
  return out;
};

/** Legendas no estilo da referência do usuário: UMA PALAVRA POR VEZ, grande, branca, contorno escuro,
 *  um pouco abaixo do centro, escrita como é falada (sem caixa alta, sem pontuação). */
const Captions: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const words = React.useMemo(() => {
    const ph = buildPhrases(s);
    return ph.flatMap((p) => p.words);
  }, [s]);
  let cur: (typeof words)[number] | undefined;
  let idx = -1;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    const next = words[i + 1];
    const until = next ? Math.min(next.start - 1, w.end + 10) : w.end + 10;
    if (f >= w.start - 1 && f < until) {
      cur = w;
      idx = i;
    }
  }
  if (!cur) return null;
  const text = cur.t.replace(/[.,:;!?…]+$/u, "");
  const pop = 1 + 0.18 * (1 - clamp01((f - (cur.start - 1)) / 5));
  return (
    <div key={idx} style={{position: "absolute", left: 60, right: 60, top: 1230, transform: `translateY(-50%) scale(${pop})`, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 104, lineHeight: 1, color: "#FFFFFF", WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(16,24,32,0.35)", whiteSpace: "nowrap"}}>
      {text}
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
  {id: "s3", text: "BOMBA", p: [-8.4, -0.9, 1.0], f0: 30, color: "#4a7fb8"},
  {id: "s6", text: "AREIA", p: [-0.35, 0.6, 1.0], f0: 40, color: "#e8cf93"},
  {id: "s6", text: "CASCALHO", p: [-0.35, 0.22, 1.0], f0: 70, color: "#9aa3ad"},
  {id: "s7", text: "FLÚOR", p: [1.6, 1.5, 0.6], f0: 230, color: "#4DD0FF"},
  {id: "s9", text: "REDE", p: [6.5, -0.45, 1.0], f0: 20, color: "#4DD0FF"},
];

const Labels: React.FC<{s: TimedScene; f: number}> = ({s, f}) => (
  <>
    {LABELS.filter((l) => l.id === s.id).map((l) => {
      const f0 = Math.round(l.f0 * s.k);
      const f1 = l.f1 !== undefined ? Math.round(l.f1 * s.k) : undefined;
      if (f < f0 || (f1 !== undefined && f >= f1)) return null;
      const pt = project(s.startFrame + f, l.p);
      if (!pt) return null;
      const y = Math.max(560, Math.min(1080, pt.y));
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

/* s2: lupa com micróbios na água bruta */
const Lens: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = Math.round(160 * s.k);
  if (f < a) return null;
  const sc = SP(f, a, 12, 140);
  const mic = (i: number) => {
    const ang = i * 1.7 + f * 0.03;
    const r = 70 + (i % 3) * 45;
    return {x: 230 + Math.cos(ang) * r, y: 230 + Math.sin(ang * 1.3) * r, c: ["#7ed957", "#b388ff", "#ffb74d"][i % 3]};
  };
  return (
    <div style={{position: "absolute", left: 310, top: 640, width: 460, height: 460, transform: `scale(${sc})`}}>
      <svg width={460} height={520} viewBox="0 0 460 520">
        <defs>
          <clipPath id="lensClip"><circle cx={230} cy={230} r={200} /></clipPath>
        </defs>
        <rect x={300} y={380} width={40} height={140} rx={16} fill="#5b3a1e" transform="rotate(-35 320 450)" />
        <circle cx={230} cy={230} r={200} fill="#9c8257" />
        <g clipPath="url(#lensClip)">
          {Array.from({length: 18}).map((_, i) => (
            <circle key={i} cx={40 + ((i * 97) % 380)} cy={40 + ((i * 53) % 380)} r={8 + (i % 4) * 3} fill="#6b4a2b" opacity={0.8} />
          ))}
          {Array.from({length: 7}).map((_, i) => {
            const m = mic(i);
            return (
              <g key={"m" + i} transform={`translate(${m.x} ${m.y})`}>
                {Array.from({length: 8}).map((__, k) => (
                  <line key={k} x1={0} y1={0} x2={Math.cos((k / 8) * 6.28) * 34} y2={Math.sin((k / 8) * 6.28) * 34} stroke={m.c} strokeWidth={6} strokeLinecap="round" />
                ))}
                <circle r={24} fill={m.c} stroke="#101820" strokeWidth={4} />
                <circle cx={-8} cy={-4} r={5} fill="#101820" />
                <circle cx={8} cy={-4} r={5} fill="#101820" />
              </g>
            );
          })}
        </g>
        <circle cx={230} cy={230} r={200} fill="none" stroke="#2a2f38" strokeWidth={22} />
        <circle cx={230} cy={230} r={200} fill="none" stroke="#c9d1da" strokeWidth={8} />
      </svg>
      <div style={{position: "absolute", left: 0, right: 0, top: 466, textAlign: "center"}}>
        <Card text="MICRÓBIOS" color="#E53935" />
      </div>
    </div>
  );
};

/* s8: manômetro de pressão (a gravidade cria a pressão) */
const Pressure: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = Math.round(170 * s.k);
  if (f < a) return null;
  const v = track("pressureGauge.value", s.startFrame + f, 0);
  const ang = -120 + 240 * v;
  return (
    <div style={{position: "absolute", right: 70, top: 640, width: 260, textAlign: "center", fontFamily: FONT, fontWeight: 900, color: "#fff", transform: `scale(${SP(f, a, 12, 140)})`}}>
      <svg width={260} height={230} viewBox="0 0 260 230">
        <circle cx={130} cy={130} r={110} fill="#ffffff" stroke="#101820" strokeWidth={10} />
        <path d="M 52 182 A 95 95 0 1 1 208 182" fill="none" stroke="#2E9E4F" strokeWidth={14} strokeLinecap="round" />
        <line x1={130} y1={130} x2={130 + Math.sin((ang * Math.PI) / 180) * 80} y2={130 - Math.cos((ang * Math.PI) / 180) * 80} stroke="#E53935" strokeWidth={9} strokeLinecap="round" />
        <circle cx={130} cy={130} r={13} fill="#101820" />
      </svg>
      <div style={{fontSize: 36, WebkitTextStroke: "7px #101820", paintOrder: "stroke fill"}}>PRESSÃO</div>
    </div>
  );
};

/* s11 (b): marca do canal (sem ícones de comentar/compartilhar, a pedido do usuário) */
const Brand: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const wf = (wordLocal(s, "segue") ?? Math.round(318 * s.k)) + 2;
  if (f < wf) return null;
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: 290, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 92, color: "#fff", WebkitTextStroke: "12px #101820", paintOrder: "stroke fill", transform: `scale(${SP(f, wf, 12, 140)})`}}>
      POR DENTRO <span style={{color: "#4DD0FF"}}>LAB</span>
    </div>
  );
};

/* comemoração (s11): confete caindo e corações subindo a partir do "Parabéns" */
const Celebration: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const c0 = finalCut - s.startFrame;
  const t = f - c0;
  if (t < 0) return null;
  const COL = ["#E53935", "#FFC400", "#2E9E4F", "#1E88E5", "#4DD0FF", "#ff7aa8"];
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {t < 110 &&
        Array.from({length: 90}).map((_, i) => {
          const x = random("cx" + i) * 1080;
          const sp = 9 + random("cv" + i) * 9;
          const y = -60 + (t - random("cd" + i) * 25) * sp;
          if (y < -60 || y > 1960) return null;
          const rot = t * (6 + random("cr" + i) * 10);
          return <div key={i} style={{position: "absolute", left: x + Math.sin(t * 0.15 + i) * 30, top: y, width: 18, height: 30, background: COL[i % COL.length], transform: `rotate(${rot}deg) scaleX(${Math.cos(t * 0.3 + i)})`, borderRadius: 4, opacity: 1 - clamp01((t - 90) / 20)}} />;
        })}
      {Array.from({length: 10}).map((_, i) => {
        const d = random("hd" + i) * 120;
        const tt = t - d;
        if (tt < 0 || tt > 150) return null;
        const x = 120 + random("hx" + i) * 840;
        const y = 1250 - tt * 6;
        return (
          <svg key={i} width={80} height={72} viewBox="0 0 24 22" style={{position: "absolute", left: x, top: y, opacity: Math.min(1, tt / 10) * (1 - clamp01((tt - 110) / 40)), transform: `scale(${0.8 + Math.sin(tt * 0.2) * 0.1})`}}>
            <path d="M12 21s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z" fill="#ff4d6d" stroke="#ffffff" strokeWidth="1.2" />
          </svg>
        );
      })}
    </AbsoluteFill>
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
      {s.id === "s2" && <Lens s={s} f={f} />}
      {s.id === "s8" && <Pressure s={s} f={f} />}
      {s.id === "s11" && <Brand s={s} f={f} />}
      {s.id === "s11" && <Celebration s={s} f={f} />}
      <Labels s={s} f={f} />
      <Badges s={s} f={f} />
      <Captions s={s} f={f} />
    </AbsoluteFill>
  );
};
export const unusedMix = mixHex;
