import React from "react";
import {AbsoluteFill, random, useCurrentFrame} from "remotion";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET, finalCut, norm, wordLocal} from "../data/scenes";
import type {TimedScene} from "../data/scenes";
import {L, SP, clamp01, easeOut, mixHex} from "../lib/anim";
import {project} from "../lib/camera";
import {track} from "../lib/track";
import {REWINDS, RW, heat, imagineAmount, te} from "../lib/story";
import {neighborJump, neighborLand, neighborLook} from "../lib/mascotPose";

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
const TERMS = new Set(["CONCRETO MAGRO", "≈ 25 TONELADAS", "CONCRETO ARMADO", "IMPERMEABILIZAÇÃO", "TESTE DE ESTANQUEIDADE", "SKIMMER", "FILTRO DE AREIA", "CASA DE MÁQUINAS", "CLORO"]);
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
    <div style={{position: "absolute", top, left: 30, right: 30, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: text.length > 14 ? 72 : text.length > 8 ? 96 : 118, lineHeight: 1, color: "#FFD60A", WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${sc}) rotate(${-2 + Math.sin(f * 0.12)}deg)`, opacity: o}}>
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
  const a = (wordLocal(s, "Dia") ?? 10) + 4;
  const out = (wordLocal(s, "ideia") ?? 1e9) - 8; // some quando o mascote levanta com a ideia
  if (f < a - 4 || f >= out + 8) return null;
  const sc = SP(f, a - 4, 10, 140) * (1 - clamp01((f - out) / 8));
  const line = (t: string, c: string, fs: number, d: number) => (
    <div style={{fontSize: fs, color: c, transform: `scale(${SP(f, a - 4 + d, 10, 160)})`}}>{t}</div>
  );
  return (
    <div style={{position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${sc}) rotate(${Math.sin(f * 0.1) * 1.2}deg)`}}>
      {line("COMO UM BURACO", "#FFFFFF", 92, 0)}
      {line("VIRA UMA", "#FFFFFF", 92, 4)}
      {line("PISCINA?", "#FFD60A", 140, 8)}
    </div>
  );
};

/* ---------- s1: calor — sol forte, termômetro e ondas de calor ---------- */
const Heat: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const k = heat(s.startFrame + f);
  if (k <= 0.01) return null;
  const temp = Math.round(L(f, 0, (wordLocal(s, "derretendo") ?? 60) + 10, 32, 41));
  return (
    <AbsoluteFill style={{pointerEvents: "none", opacity: k}}>
      {/* ondas de calor */}
      {Array.from({length: 6}).map((_, i) => (
        <svg key={i} width={1080} height={60} style={{position: "absolute", left: 0, top: 1500 - ((f * 3 + i * 230) % 1300), opacity: 0.22}}>
          <path d={`M0 30 ${Array.from({length: 12}).map((__, j) => `Q ${j * 90 + 45} ${30 + (j % 2 ? -18 : 18) * Math.sin(f * 0.1 + i)} ${(j + 1) * 90} 30`).join(" ")}`} stroke="#ffffff" strokeWidth={6} fill="none" />
        </svg>
      ))}
      {/* sol */}
      <svg width={300} height={300} viewBox="-150 -150 300 300" style={{position: "absolute", right: -40, top: 560, transform: `rotate(${f * 0.8}deg) scale(${1 + 0.05 * Math.sin(f * 0.2)})`}}>
        {Array.from({length: 12}).map((_, i) => (
          <rect key={i} x={-10} y={-140} width={20} height={44} rx={10} fill="#ffb300" transform={`rotate(${i * 30})`} />
        ))}
        <circle r={78} fill="#ffd54f" stroke="#ff8f00" strokeWidth={8} />
      </svg>
      {/* termômetro */}
      <div style={{position: "absolute", left: 60, top: 600, display: "flex", alignItems: "center", gap: 12, background: "#ffffff", borderRadius: 60, padding: "10px 26px 10px 14px", boxShadow: "0 6px 0 rgba(0,0,0,0.28)", fontFamily: FONT, fontWeight: 900, fontSize: 54, color: "#E53935", transform: `scale(${SP(f, 6, 10, 150)})`}}>
        <svg width={44} height={70} viewBox="0 0 24 40">
          <rect x="8" y="2" width="8" height="26" rx="4" fill="#ffffff" stroke="#101820" strokeWidth="2" />
          <rect x="10.5" y={26 - 20 * clamp01((temp - 30) / 12)} width="3" height={20 * clamp01((temp - 30) / 12) + 4} fill="#E53935" />
          <circle cx="12" cy="32" r="6" fill="#E53935" stroke="#101820" strokeWidth="2" />
        </svg>
        {temp}°C
      </div>
    </AbsoluteFill>
  );
};

/* ---------- s2: o vizinho grita ao pular no lamaçal ---------- */
const Shout: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const t = te(gf);
  const a = neighborJump() - 14, b = neighborLand() + 12;
  if (t < a || t > b) return null;
  const nl = neighborLook(t);
  if (!nl.at) return null;
  const pt = project(gf, [nl.at[0], nl.at[1] + 1.95, nl.at[2]]);
  if (!pt) return null;
  const x = Math.max(220, Math.min(860, pt.x)), y = Math.max(560, Math.min(1080, pt.y - 40));
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${SP(t, a, 9, 170)}) rotate(-6deg)`, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: "#101820", background: "#FFD60A", border: "6px solid #101820", borderRadius: 40, padding: "6px 28px", boxShadow: "0 6px 0 rgba(0,0,0,0.3)", whiteSpace: "nowrap"}}>
      UHUUU!
    </div>
  );
};

/* ---------- ✓ e ✕ grandes ---------- */
type Stamp = {id: string; word: string; ok: boolean; x: number; y: number};
const STAMPS: Stamp[] = [
  {id: "s2", word: "Nem", ok: false, x: 840, y: 760},
  {id: "s4", word: "armado", ok: true, x: 860, y: 760},
  {id: "s5", word: "estanqueidade", ok: true, x: 860, y: 760},
  {id: "s6", word: "antiderrapante", ok: true, x: 860, y: 760},
  {id: "s8", word: "não", ok: false, x: 860, y: 1000},
  {id: "s8", word: "sempre", ok: true, x: 860, y: 760},
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

/* ---------- "E se fizer errado?": pausa + tela de imaginação + REBOBINAR (todas as janelas) ---------- */
const Imagine: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const r = REWINDS.find((x) => x.id === s.id);
  if (!r) return null;
  const k = imagineAmount(gf);
  const rewOn = gf >= r.R && gf < r.R + RW;
  const pauseOn = gf >= r.P && gf < r.P + 34;
  const txt = s.id === "s2" || s.id === "s8" ? "IMAGINA…" : "E SE…?";
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
  const po = 1 - clamp01((gf - r.P - 26) / 8);
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {k > 0.01 && <AbsoluteFill style={{boxShadow: `inset 0 0 ${260 * k}px ${80 * k}px rgba(30,20,10,0.75)`}} />}
      {pauseOn && icon("pause", SP(gf, r.P, 10, 160), po)}
      {pauseOn && (
        <div style={{position: "absolute", top: 1110, left: 50, fontFamily: FONT, fontWeight: 900, fontSize: 58, color: "#FFD60A", WebkitTextStroke: "10px #101820", paintOrder: "stroke fill", opacity: po, transform: `scale(${SP(gf, r.P + 3, 10, 160)})`, transformOrigin: "0% 50%"}}>{txt}</div>
      )}
      {rewOn && (
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

/* ---------- s5 (E se?): conta de água disparando ---------- */
const Bill: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const r = REWINDS.find((x) => x.id === "s5")!;
  const a = r.P + 30;
  if (gf < a || gf >= r.R) return null;
  const v = Math.round(L(gf, a, r.R - 6, 95, 780));
  return (
    <div style={{position: "absolute", left: 680, top: 600, width: 330, transform: `scale(${SP(gf, a, 10, 150)}) rotate(4deg)`, fontFamily: FONT, fontWeight: 900}}>
      <div style={{background: "#ffffff", borderRadius: 18, padding: "18px 22px", boxShadow: "0 8px 0 rgba(0,0,0,0.3)", border: "5px solid #101820", textAlign: "center"}}>
        <div style={{fontSize: 30, color: "#101820"}}>CONTA DE ÁGUA</div>
        <div style={{height: 4, background: "#cfd8dc", margin: "10px 0"}} />
        <div style={{fontSize: 70, color: "#E53935"}}>R$ {v}</div>
      </div>
    </div>
  );
};

/* ---------- s9: pergunta final grande ---------- */
const FinalCTA: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "teria") ?? Math.round(s.durationInFrames * 0.6)) - 10;
  const c = wordLocal(s, "Comenta") ?? a + 70;
  const e = (wordLocal(s, "segue") ?? c + 30) - 2;
  if (f < a || f >= e + 6) return null;
  const o = 1 - clamp01((f - e) / 6);
  return (
    <div style={{position: "absolute", top: 270, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "13px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", opacity: o, transform: `scale(${SP(f, a, 10, 140)})`}}>
      <div style={{fontSize: 80, color: "#fff"}}>VOCÊ TERIA CORAGEM</div>
      <div style={{fontSize: 80, color: "#fff"}}>DE FAZER UMA?</div>
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

type Lab = {id: string; text: string; p: [number, number, number]; word: string; until?: string; color: string};
const LABELS: Lab[] = [
  {id: "s3", text: "6 m", p: [1.5, 0.15, 1.5], word: "tamanho", until: "cava", color: "#1e88e5"},
  {id: "s3", text: "3 m", p: [4.6, 0.15, 0.0], word: "tamanho", until: "cava", color: "#1e88e5"},
  {id: "s3", text: "1,4 m", p: [-1.85, -0.7, 1.5], word: "profundidade", until: "cava", color: "#FFC400"},
  {id: "s4", text: "1.000 kg", p: [-2.85, 0.45, 1.3], word: "mil", until: "Uma", color: "#E53935"},
  {id: "s7", text: "RALO DE FUNDO", p: [1.5, -1.25, 1.2], word: "ralo", until: "bomba", color: "#1e88e5"},
  {id: "s7", text: "BOMBA", p: [6.35, -0.65, 1.5], word: "bomba", color: "#1e88e5"},
  {id: "s7", text: "BOCAIS", p: [-1.2, -0.3, 1.4], word: "bocais", color: "#1e88e5"},
];

const Labels: React.FC<{s: TimedScene; f: number}> = ({s, f}) => (
  <>
    {LABELS.filter((l) => l.id === s.id).map((l) => {
      const f0 = wordLocal(s, l.word) ?? 0;
      const f1 = l.until ? wordLocal(s, l.until) : undefined;
      if (f < f0 || (f1 !== undefined && f >= f1)) return null;
      const pt = project(s.startFrame + f, l.p);
      if (!pt) return null;
      const y = Math.max(520, Math.min(1150, pt.y));
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

/* lupa: s5 poros do concreto; s8 micróbios na água (estouram com o cloro) */
const Lens: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const pores = s.id === "s5";
  const a = pores ? (wordLocal(s, "poros") ?? 30) - 4 : 4;
  const endF = pores ? REWINDS.find((x) => x.id === "s5")!.P - s.startFrame + 20 : (wordLocal(s, "cloro") ?? 120) + 45;
  if (f < a || f >= endF) return null;
  const sc = SP(f, a, 12, 140) * (1 - clamp01((f - endF + 8) / 8));
  const cl = wordLocal(s, "cloro") ?? 1e9;
  const pop = pores ? 1 : 1 - clamp01((f - cl - 6) / 16);
  const mic = (i: number) => {
    const ang = i * 1.7 + f * 0.03;
    const r = 70 + (i % 3) * 45;
    return {x: 230 + Math.cos(ang) * r, y: 230 + Math.sin(ang * 1.3) * r, c: ["#7ed957", "#b388ff", "#ffb74d"][i % 3]};
  };
  return (
    <div style={{position: "absolute", left: 600, top: 540, width: 460, height: 460, transform: `scale(${sc * 0.72})`, transformOrigin: "100% 0%"}}>
      <svg width={460} height={520} viewBox="0 0 460 520">
        <defs>
          <clipPath id="lensClip"><circle cx={230} cy={230} r={200} /></clipPath>
        </defs>
        <rect x={300} y={380} width={40} height={140} rx={16} fill="#5b3a1e" transform="rotate(-35 320 450)" />
        <circle cx={230} cy={230} r={200} fill={pores ? "#b9bec4" : "#4fb6ea"} />
        <g clipPath="url(#lensClip)">
          {pores
            ? Array.from({length: 26}).map((_, i) => (
                <g key={i}>
                  <circle cx={30 + ((i * 97) % 400)} cy={30 + ((i * 61) % 400)} r={7 + (i % 5) * 4} fill="#5d6268" />
                  {i % 4 === 0 && <circle cx={30 + ((i * 97) % 400)} cy={34 + ((i * 61) % 400) + ((f * 2 + i * 13) % 40)} r={6} fill="#3fb4f0" />}
                </g>
              ))
            : Array.from({length: 7}).map((_, i) => {
                const m = mic(i);
                const ps = pop * (1 + (f > cl + 6 ? 0.4 * Math.sin((f - cl) * 0.6 + i) : 0));
                return ps <= 0.02 ? null : (
                  <g key={"m" + i} transform={`translate(${m.x} ${m.y}) scale(${ps})`}>
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
        <Card text={pores ? "POROS" : "MICRÓBIOS"} color="#E53935" />
      </div>
    </div>
  );
};

/* s8: medidor de pH (faixa verde = equilibrado); no "Imagina" sai do ponto */
const PhGauge: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "pH") ?? 150) - 4;
  if (f < a) return null;
  const gf = s.startFrame + f;
  const r = REWINDS.find((x) => x.id === "s8")!;
  const tt = te(gf);
  const off = tt >= r.P && tt < r.R ? L(tt, r.P + 10, r.P + 35, 0, 1) : 0;
  const ang = -10 + off * 100 + Math.sin(f * 0.2) * 3;
  return (
    <div style={{position: "absolute", right: 70, top: 640, width: 260, textAlign: "center", fontFamily: FONT, fontWeight: 900, color: "#fff", transform: `scale(${SP(f, a, 12, 140)})`}}>
      <svg width={260} height={230} viewBox="0 0 260 230">
        <circle cx={130} cy={130} r={110} fill="#ffffff" stroke="#101820" strokeWidth={10} />
        <path d="M 52 182 A 95 95 0 0 1 75 60" fill="none" stroke="#E53935" strokeWidth={14} strokeLinecap="round" />
        <path d="M 95 45 A 95 95 0 0 1 165 45" fill="none" stroke="#2E9E4F" strokeWidth={16} strokeLinecap="round" />
        <path d="M 185 60 A 95 95 0 0 1 208 182" fill="none" stroke="#E53935" strokeWidth={14} strokeLinecap="round" />
        <line x1={130} y1={130} x2={130 + Math.sin((ang * Math.PI) / 180) * 80} y2={130 - Math.cos((ang * Math.PI) / 180) * 80} stroke="#101820" strokeWidth={9} strokeLinecap="round" />
        <circle cx={130} cy={130} r={13} fill="#101820" />
      </svg>
      <div style={{fontSize: 40, WebkitTextStroke: "7px #101820", paintOrder: "stroke fill"}}>pH</div>
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
      {(s.id === "s5" || s.id === "s8") && <Lens s={s} f={f} />}
      {s.id === "s5" && <Bill s={s} f={f} />}
      {s.id === "s8" && <PhGauge s={s} f={f} />}
      {s.id === "s9" && <Brand s={s} f={f} />}
      {s.id === "s9" && <Celebration s={s} f={f} />}
      {s.id === "s1" && <Heat s={s} f={f} />}
      {s.id === "s2" && <Shout s={s} f={f} />}
      {s.id === "s1" && <TitleCard s={s} f={f} />}
      {s.id === "s9" && <FinalCTA s={s} f={f} />}
      <Imagine s={s} f={f} />
      <Labels s={s} f={f} />
      <Stamps s={s} f={f} />
      <Badges s={s} f={f} />
      <Captions s={s} f={f} />
    </AbsoluteFill>
  );
};
export const unusedMix = mixHex;
