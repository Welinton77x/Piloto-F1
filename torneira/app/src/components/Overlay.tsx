import React from "react";
import {AbsoluteFill, random, useCurrentFrame} from "remotion";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET, finalCut, norm, wordLocal} from "../data/scenes";
import type {TimedScene} from "../data/scenes";
import {L, SP, clamp01, easeOut, mixHex} from "../lib/anim";
import {project} from "../lib/camera";
import {track} from "../lib/track";
import {REWIND_FRAMES} from "../lib/mascotPose";

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

/* ---------- Etiquetas (pílulas brancas com bolinha colorida, como no vídeo de exemplo) ---------- */
// termos técnicos aparecem primeiro como TÍTULO GRANDE AMARELO e depois viram etiqueta
const TERMS = new Set(["ADUTORA", "ESTAÇÃO DE TRATAMENTO", "COAGULAÇÃO", "FLOCULAÇÃO", "DECANTAÇÃO", "FILTRAÇÃO", "CLORO", "RESERVATÓRIO", "HIDRÔMETRO", "CAIXA D'ÁGUA"]);
const BIG = 46;

const BadgeView: React.FC<{b: Badge; top: number; f: number; from: number}> = ({b, top, f, from}) => {
  const k = KIND[b.kind];
  const sc = SP(f, from, 11, 130);
  const out = b.f1 !== undefined ? 1 - clamp01((f - b.f1) / 8) : 1;
  return (
    <div style={{position: "absolute", top, left: 70, right: 70, display: "flex", justifyContent: "center", transform: `scale(${sc * out})`, transformOrigin: "50% 0%", opacity: out}}>
      <div style={{display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", color: "#101820", fontFamily: FONT, fontWeight: 900, fontSize: 42, lineHeight: 1.08, padding: "12px 30px 12px 16px", borderRadius: 60, boxShadow: "0 6px 0 rgba(0,0,0,0.28)", textAlign: "center", maxWidth: 900}}>
        <div style={{width: 50, height: 50, borderRadius: 25, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", flex: "none", boxShadow: `0 0 0 ${4 + 3 * Math.abs(Math.sin(f * 0.15))}px ${k.bg}44`}}>
          <Icon kind={b.kind} size={44} />
        </div>
        <span>{b.text}</span>
      </div>
    </div>
  );
};

const BigTerm: React.FC<{text: string; top: number; f: number; f0: number; f1: number}> = ({text, top, f, f0, f1}) => {
  const sc = SP(f, f0, 10, 150) * (1 - 0.25 * clamp01((f - f1 + 6) / 6));
  const o = 1 - clamp01((f - f1 + 5) / 5);
  return (
    <div style={{position: "absolute", top, left: 30, right: 30, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: text.length > 14 ? 84 : text.length > 8 ? 100 : 118, lineHeight: 1, color: "#FFD60A", WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${sc}) rotate(${-2 + Math.sin(f * 0.12)}deg)`, opacity: o}}>
      {text}
    </div>
  );
};

const Badges: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  let top = 262;
  // fase "título grande" de cada termo: termina 46 frames depois ou quando o próximo termo entra
  const terms = s.badges.filter((b) => TERMS.has(b.text));
  const bigEnd = (b: Badge) => {
    const nxt = terms.find((t) => t.f0 > b.f0);
    return Math.min(b.f0 + BIG, nxt ? nxt.f0 : 1e9);
  };
  const vis = s.badges.filter((b) => f >= b.f0 && (b.f1 === undefined || f < b.f1 + 8));
  const pills = vis.filter((b) => !TERMS.has(b.text) || f >= bigEnd(b));
  const bigs = vis.filter((b) => TERMS.has(b.text) && f < bigEnd(b));
  return (
    <>
      {pills.map((b, i) => {
        const lines = b.text.length > 24 ? 2 : 1;
        const el = <BadgeView key={b.text} b={b} top={top} f={f} from={TERMS.has(b.text) ? bigEnd(b) : b.f0} />;
        top += lines * 46 + 24 + 22;
        return <React.Fragment key={i}>{el}</React.Fragment>;
      })}
      {bigs.map((b) => (
        <BigTerm key={"big" + b.text} text={b.text} top={top + 30} f={f} f0={b.f0} f1={bigEnd(b)} />
      ))}
    </>
  );
};

/* ---------- s1: a pergunta grande ---------- */
const TitleCard: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = wordLocal(s, "perguntou") ?? Math.round(s.durationInFrames * 0.45);
  if (f < a - 4) return null;
  const sc = SP(f, a - 4, 10, 140);
  const line = (t: string, c: string, fs: number, d: number) => (
    <div style={{fontSize: fs, color: c, transform: `scale(${SP(f, a - 4 + d, 10, 160)})`}}>{t}</div>
  );
  return (
    <div style={{position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${sc}) rotate(${Math.sin(f * 0.1) * 1.2}deg)`}}>
      {line("DE ONDE VEM", "#FFFFFF", 96, 0)}
      {line("A ÁGUA DA SUA", "#FFFFFF", 82, 4)}
      {line("TORNEIRA?", "#FFD60A", 132, 8)}
    </div>
  );
};

/* ---------- círculo vermelho desenhado em volta do ponto que importa ---------- */
type Ring = {id: string; word: string; occ?: number; p: [number, number, number]; r: number; dur?: number};
const RINGS: Ring[] = [
  {id: "s2", word: "terra", p: [-11.2, -1.1, 1.03], r: 150},
  {id: "s3", word: "Bombas", p: [-8.4, -1.35, 1.0], r: 120},
  {id: "s4", word: "turva", p: [-4.4, 0.65, 1.0], r: 140},
  {id: "s5", word: "flocos", p: [-1.7, 1.0, 0.7], r: 130},
  {id: "s6", word: "preso", p: [-0.35, 0.35, 1.0], r: 140},
  {id: "s7", word: "micróbios", p: [-0.35, 1.25, 1.04], r: 130},
  {id: "s8", word: "reservatórios", p: [3.5, 1.9, -0.5], r: 170},
  {id: "s9", word: "hidrômetro", p: [8.75, 0.5, 0.75], r: 100},
  {id: "s9", word: "caixa", p: [11.0, 2.85, -0.6], r: 150},
];
const Rings: React.FC<{s: TimedScene; f: number}> = ({s, f}) => (
  <>
    {RINGS.filter((r) => r.id === s.id).map((r) => {
      const a = wordLocal(s, r.word, r.occ ?? 0);
      if (a === undefined) return null;
      const dur = r.dur ?? 75;
      if (f < a - 2 || f > a + dur) return null;
      const pt = project(s.startFrame + f, r.p);
      if (!pt) return null;
      const draw = clamp01((f - a + 2) / 10);
      const o = 1 - clamp01((f - a - dur + 10) / 10);
      const R = r.r * (1 + 0.04 * Math.sin(f * 0.3));
      const C = 2 * Math.PI * R;
      return (
        <svg key={r.word} width={R * 2 + 40} height={R * 2 + 40} style={{position: "absolute", left: pt.x - R - 20, top: pt.y - R - 20, opacity: o, overflow: "visible"}}>
          <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke="#101820" strokeWidth={18} strokeDasharray={C} strokeDashoffset={C * (1 - draw)} strokeLinecap="round" transform={`rotate(-80 ${R + 20} ${R + 20})`} opacity={0.35} />
          <circle cx={R + 20} cy={R + 20} r={R} fill="none" stroke="#FF2D2D" strokeWidth={11} strokeDasharray={C} strokeDashoffset={C * (1 - draw)} strokeLinecap="round" transform={`rotate(-80 ${R + 20} ${R + 20})`} />
          <circle cx={R + 20 + Math.cos(-1.4) * R} cy={R + 20 + Math.sin(-1.4) * R} r={13 * draw} fill="#FF2D2D" stroke="#fff" strokeWidth={4} />
        </svg>
      );
    })}
  </>
);

/* ---------- ✓ e ✕ grandes ---------- */
type Stamp = {id: string; word: string; ok: boolean; x: number; y: number};
const STAMPS: Stamp[] = [
  {id: "s2", word: "não", ok: false, x: 840, y: 760},
  {id: "s4", word: "turva", ok: false, x: 860, y: 720},
  {id: "s5", word: "clara", ok: true, x: 860, y: 720},
  {id: "s7", word: "filtro", ok: false, x: 860, y: 720},
  {id: "s7", word: "mata", ok: true, x: 860, y: 720},
];
const Stamps: React.FC<{s: TimedScene; f: number}> = ({s, f}) => (
  <>
    {STAMPS.filter((t) => t.id === s.id).map((t) => {
      const a = wordLocal(s, t.word);
      if (a === undefined || f < a || f > a + 55) return null;
      const sc = SP(f, a, 9, 170) * (1 - clamp01((f - a - 47) / 8));
      const c = t.ok ? "#2E9E4F" : "#E53935";
      return (
        <svg key={t.word} width={170} height={170} viewBox="0 0 24 24" style={{position: "absolute", left: t.x - 85, top: t.y - 85, transform: `scale(${sc}) rotate(${t.ok ? -8 : 8}deg)`}}>
          <circle cx="12" cy="12" r="11" fill={c} stroke="#fff" strokeWidth="1.6" />
          {t.ok ? <path d="M6.5 12.5l3.8 3.8 7.4-8.3" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /> : <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />}
        </svg>
      );
    })}
  </>
);

/* ---------- s2: "imagina beber..." (pausa + tela de imaginação) e o REBOBINAR no "Por isso" ---------- */
export const imagineAmount = (s: TimedScene, f: number) => {
  if (s.id !== "s2") return 0;
  const a = wordLocal(s, "imagina");
  const p = wordLocal(s, "Por");
  if (a === undefined || p === undefined) return 0;
  return L(f, a - 8, a + 2, 0, 1) * (1 - L(f, p + REWIND_FRAMES - 4, p + REWIND_FRAMES + 4, 0, 1));
};
const Imagine: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  if (s.id !== "s2") return null;
  const k = imagineAmount(s, f);
  const a = wordLocal(s, "imagina") ?? 0;
  const p = wordLocal(s, "Por") ?? 1e9;
  const rew = f >= p && f < p + REWIND_FRAMES;
  const pauseOn = f >= a - 8 && f < a + 22;
  const icon = (kind: "pause" | "rew", sc: number, o: number) => (
    <svg width={200} height={200} viewBox="0 0 24 24" style={{position: "absolute", left: 60, top: 900, transform: `scale(${sc})`, opacity: o}}>
      <circle cx="12" cy="12" r="11.5" fill="rgba(16,24,32,0.55)" />
      {kind === "pause" ? (
        <>
          <rect x="7.5" y="6.5" width="3" height="11" rx="1" fill="#fff" />
          <rect x="13.5" y="6.5" width="3" height="11" rx="1" fill="#fff" />
        </>
      ) : (
        <>
          <path d="M12 7v10l-6.5-5z" fill="#fff" />
          <path d="M19 7v10l-6.5-5z" fill="#fff" />
        </>
      )}
    </svg>
  );
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {k > 0.01 && <AbsoluteFill style={{boxShadow: `inset 0 0 ${260 * k}px ${80 * k}px rgba(30,20,10,0.75)`}} />}
      {pauseOn && icon("pause", SP(f, a - 8, 10, 160), 1 - clamp01((f - a - 14) / 8))}
      {rew && (
        <>
          {icon("rew", 1 + 0.08 * Math.sin(f * 0.9), 1)}
          {Array.from({length: 7}).map((_, i) => (
            <div key={i} style={{position: "absolute", left: 0, right: 0, top: ((i * 293 + f * 97) % 1920), height: 6 + (i % 3) * 5, background: "rgba(255,255,255,0.35)"}} />
          ))}
          <div style={{position: "absolute", top: 1110, left: 50, fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#fff", WebkitTextStroke: "9px #101820", paintOrder: "stroke fill", opacity: Math.floor(f / 6) % 2 ? 1 : 0.6}}>VOLTANDO...</div>
        </>
      )}
    </AbsoluteFill>
  );
};

/* ---------- s10: cartão da DICA ---------- */
const Tip: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  if (s.id !== "s10") return null;
  const a = wordLocal(s, "dica") ?? Math.round(s.durationInFrames * 0.4);
  if (f < a - 3) return null;
  const sj = wordLocal(s, "suja") ?? 1e9;
  const sc = SP(f, a - 3, 11, 140);
  const six = SP(f, (wordLocal(s, "seis") ?? a + 70) - 2, 8, 180);
  return (
    <div style={{position: "absolute", top: 250, left: 110, right: 110, transform: `scale(${sc}) rotate(${-1.5 + Math.sin(f * 0.08) * 0.8}deg)`, transformOrigin: "50% 0%", fontFamily: FONT, fontWeight: 900}}>
      <div style={{background: "#FFD60A", border: "6px solid #101820", borderRadius: 34, padding: "26px 30px 24px", boxShadow: "0 10px 0 rgba(16,24,32,0.4)", textAlign: "center", color: "#101820"}}>
        <div style={{display: "inline-block", background: "#101820", color: "#FFD60A", fontSize: 40, padding: "6px 26px", borderRadius: 40, marginBottom: 12}}>DICA</div>
        <div style={{fontSize: 46, lineHeight: 1.05}}>LIMPE A SUA CAIXA D'ÁGUA</div>
        <div style={{display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginTop: 14, transform: `scale(${0.6 + 0.4 * six})`}}>
          <svg width={86} height={86} viewBox="0 0 24 24">
            <rect x="2.5" y="4" width="19" height="17" rx="3" fill="#fff" stroke="#101820" strokeWidth="1.6" />
            <rect x="2.5" y="4" width="19" height="5" rx="2" fill="#E53935" stroke="#101820" strokeWidth="1.6" />
            <path d="M7 2.5v3M17 2.5v3" stroke="#101820" strokeWidth="1.8" strokeLinecap="round" />
            <text x="12" y="18.6" textAnchor="middle" fontSize="9" fontWeight="900" fontFamily={FONT} fill="#101820">6</text>
          </svg>
          <div style={{fontSize: 72, color: "#E53935", WebkitTextStroke: "3px #101820"}}>A CADA 6 MESES</div>
        </div>
      </div>
      {f >= sj && (
        <div style={{marginTop: 22, display: "flex", justifyContent: "center", transform: `scale(${SP(f, sj, 10, 160)})`}}>
          <div style={{display: "flex", alignItems: "center", gap: 14, background: "#fff", borderRadius: 60, padding: "10px 28px 10px 12px", fontSize: 38, color: "#101820", boxShadow: "0 6px 0 rgba(0,0,0,0.28)"}}>
            <div style={{width: 48, height: 48, borderRadius: 24, background: "#E53935", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <Icon kind="problem" size={42} />
            </div>
            SUJA = TRATAMENTO PRO RALO
          </div>
        </div>
      )}
    </div>
  );
};

/* ---------- s11: pergunta final grande ---------- */
const FinalCTA: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "limpou") ?? Math.round(s.durationInFrames * 0.66)) - 10;
  const c = wordLocal(s, "Comenta") ?? a + 70;
  const e = (wordLocal(s, "segue") ?? c + 30) - 2;
  if (f < a || f >= e + 6) return null;
  const o = 1 - clamp01((f - e) / 6);
  return (
    <div style={{position: "absolute", top: 270, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "13px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", opacity: o, transform: `scale(${SP(f, a, 10, 140)})`}}>
      <div style={{fontSize: 84, color: "#fff"}}>VOCÊ JÁ LIMPOU</div>
      <div style={{fontSize: 84, color: "#fff"}}>SUA CAIXA D'ÁGUA?</div>
      {f >= c - 2 && (
        <div style={{fontSize: 120, color: "#FFD60A", marginTop: 10, transform: `scale(${SP(f, c - 2, 8, 180)}) rotate(${Math.sin(f * 0.25) * 3}deg)`}}>COMENTA AÍ!</div>
      )}
    </div>
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
  const a = wordLocal(s, "micróbios") ?? Math.round(160 * s.k);
  const p = wordLocal(s, "Por") ?? 1e9;
  if (f < a || f >= p) return null;
  const sc = SP(f, a, 12, 140);
  const mic = (i: number) => {
    const ang = i * 1.7 + f * 0.03;
    const r = 70 + (i % 3) * 45;
    return {x: 230 + Math.cos(ang) * r, y: 230 + Math.sin(ang * 1.3) * r, c: ["#7ed957", "#b388ff", "#ffb74d"][i % 3]};
  };
  return (
    <div style={{position: "absolute", left: 600, top: 520, width: 460, height: 460, transform: `scale(${sc * 0.72})`, transformOrigin: "100% 0%"}}>
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
  const cm = wordLocal(s, "Comenta");
  const c0 = cm !== undefined && f >= cm ? cm : finalCut - s.startFrame;
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

export const Overlay: React.FC<{s: TimedScene}> = ({s}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {s.id === "s2" && <Lens s={s} f={f} />}
      {s.id === "s8" && <Pressure s={s} f={f} />}
      {s.id === "s11" && <Brand s={s} f={f} />}
      {s.id === "s11" && <Celebration s={s} f={f} />}
      {s.id === "s1" && <TitleCard s={s} f={f} />}
      {s.id === "s11" && <FinalCTA s={s} f={f} />}
      <Imagine s={s} f={f} />
      <Rings s={s} f={f} />
      <Labels s={s} f={f} />
      <Stamps s={s} f={f} />
      <Tip s={s} f={f} />
      <Badges s={s} f={f} />
      <Captions s={s} f={f} />
    </AbsoluteFill>
  );
};
export const unusedMix = mixHex;
