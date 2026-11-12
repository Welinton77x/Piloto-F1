import React from "react";
import {AbsoluteFill, random, useCurrentFrame} from "remotion";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET, finalCut, norm, wordLocal} from "../data/scenes";
import type {TimedScene} from "../data/scenes";
import {L, SP, clamp01, easeOut, mixHex} from "../lib/anim";
import {project} from "../lib/camera";
import {track} from "../lib/track";
import {REWINDS, RW, W, end, imagineAmount, inS, start} from "../lib/story";

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
const TERMS = new Set(["SOL A PINO", "SERTÃO / SEMIÁRIDO", "ILHA DE CALOR", "EL NIÑO"]);
const BIG = 46;

const BadgeView: React.FC<{b: Badge; top: number; f: number; from: number}> = ({b, top, f, from}) => {
  const k = KIND[b.kind];
  const sc = SP(f, from, 11, 130);
  const out = b.f1 !== undefined ? 1 - clamp01((f - b.f1) / 8) : 1;
  return (
    <div style={{position: "absolute", top, left: 70, right: 70, display: "flex", justifyContent: "center", transform: `scale(${sc * out})`, transformOrigin: "50% 0%", opacity: out}}>
      <div style={{display: "flex", alignItems: "center", gap: 16, background: "#FFFFFF", color: "#101820", fontFamily: FONT, fontWeight: 900, fontSize: 42, lineHeight: 1.08, padding: "12px 30px 12px 16px", borderRadius: 60, boxShadow: "0 6px 0 rgba(0,0,0,0.28)", textAlign: "center", maxWidth: 900}}>
        <div style={{width: 24, height: 24, borderRadius: 12, background: k.bg, flex: "none", marginLeft: 10, boxShadow: `0 0 0 ${3 + 3 * Math.abs(Math.sin(f * 0.15))}px ${k.bg}44`}} />
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

/* ---------- s1: a pergunta grande (como a da referência: palavras-chave coloridas) ---------- */
const TitleCard: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const out = (wordLocal(s, "Se") ?? 1e9) - 6;
  if (f >= out + 8) return null;
  const sc = SP(f, 2, 10, 140) * (1 - clamp01((f - out) / 8));
  return (
    <div style={{position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, fontSize: 92, color: "#fff", WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${sc})`}}>
      <div>POR QUE O</div>
      <div style={{color: "#FFD60A", fontSize: 110}}>NORDESTE</div>
      <div>TÁ TÃO <span style={{color: "#FF3B30"}}>QUENTE?</span></div>
    </div>
  );
};
/* ---------- termômetro da rua (calor) ---------- */
const Thermo: React.FC<{s: TimedScene; f: number; value: number; label: string; a: number; e: number; right?: boolean}> = ({f, value, label, a, e, right}) => {
  if (f < a || f > e) return null;
  const o = 1 - clamp01((f - e + 8) / 8);
  return (
    <div style={{position: "absolute", [right ? "right" : "left"]: 60, top: 620, display: "flex", alignItems: "center", gap: 12, background: "#ffffff", borderRadius: 60, padding: "10px 26px 10px 14px", boxShadow: "0 6px 0 rgba(0,0,0,0.28)", fontFamily: FONT, fontWeight: 900, fontSize: 52, color: "#E53935", opacity: o, transform: `scale(${SP(f, a, 10, 150)})`}}>
      <svg width={42} height={66} viewBox="0 0 24 40">
        <rect x="8" y="2" width="8" height="26" rx="4" fill="#ffffff" stroke="#101820" strokeWidth="2" />
        <rect x="10.5" y={26 - 20 * clamp01((value - 25) / 17)} width="3" height={20 * clamp01((value - 25) / 17) + 4} fill="#E53935" />
        <circle cx="12" cy="32" r="6" fill="#E53935" stroke="#101820" strokeWidth="2" />
      </svg>
      <div style={{lineHeight: 1}}>
        {Math.round(value)}°C
        <div style={{fontSize: 22, color: "#101820"}}>{label}</div>
      </div>
    </div>
  );
};
/* ---------- s6: cartão do recorde do Pacífico ---------- */
const NinoCard: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "recorde") ?? 1e9) - 6, e = s.durationInFrames - 4;
  if (f < a) return null;
  const o = 1 - clamp01((f - e) / 6);
  return (
    <div style={{position: "absolute", left: 140, right: 140, top: 1330, opacity: o, transform: `scale(${SP(f, a, 10, 150)}) rotate(-2deg)`, fontFamily: FONT, fontWeight: 900, textAlign: "center"}}>
      <div style={{background: "#fff8e1", border: "6px solid #101820", borderRadius: 24, padding: "12px 18px", boxShadow: "0 8px 0 rgba(0,0,0,0.3)"}}>
        <div style={{fontSize: 30, color: "#101820"}}>PACÍFICO EM OUTUBRO</div>
        <div style={{fontSize: 70, color: "#E53935", lineHeight: 1.05}}>+2,5 °C</div>
        <div style={{fontSize: 24, color: "#101820"}}>ACIMA DO NORMAL · RECORDE</div>
      </div>
    </div>
  );
};
/* ---------- s9: dicas com ícones ---------- */
const TIPS: [string, string, string][] = [["bebe", "💧", "ÁGUA ANTES DA SEDE"], ["foge", "⏰", "SOMBRA DAS 10H ÀS 16H"], ["roupa", "👕", "ROUPA CLARA E LEVE"], ["idosos", "👵", "IDOSOS E CRIANÇAS"], ["alertas", "📱", "ALERTA DE ONDA DE CALOR"]];
const Tips: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  if (s.id !== "s9") return null;
  return (
    <div style={{position: "absolute", left: 40, top: 1330, display: "flex", flexDirection: "column", gap: 10, fontFamily: FONT, fontWeight: 900}}>
      {TIPS.map(([w, ic, lb]) => {
        const a = wordLocal(s, w) ?? 1e9;
        if (f < a - 4) return null;
        return (
          <div key={lb} style={{display: "flex", alignItems: "center", gap: 10, background: "#ffffff", borderRadius: 40, padding: "6px 18px 6px 8px", fontSize: 26, color: "#101820", boxShadow: "0 5px 0 rgba(0,0,0,0.25)", transform: `scale(${SP(f, a - 4, 10, 170)})`, transformOrigin: "0% 50%"}}>
            <div style={{width: 40, height: 40, borderRadius: 20, background: "#2E9E4F", display: "flex", alignItems: "center", justifyContent: "center"}}>
              <svg width={26} height={26} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5 9.5-10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" /></svg>
            </div>
            <span style={{fontSize: 30}}>{ic}</span>
            {lb}
          </div>
        );
      })}
    </div>
  );
};
/* ---------- ✓ e ✕ grandes ---------- */
type Stamp = {id: string; word: string; ok: boolean; x: number; y: number; occ?: number};
const STAMPS: Stamp[] = [
  {id: "s4", word: "seca", ok: false, x: 860, y: 900},
  {id: "s7", word: "chove", ok: false, x: 860, y: 900},
  {id: "s8", word: "esfria", ok: false, x: 860, y: 900, occ: 1},
];
const Stamps: React.FC<{s: TimedScene; f: number}> = ({s, f}) => (
  <>
    {STAMPS.filter((t) => t.id === s.id).map((t) => {
      const a = wordLocal(s, t.word, t.occ ?? 0);
      if (a === undefined || f < a || f > a + 55) return null;
      const sc = SP(f, a, 9, 170) * (1 - clamp01((f - a - 47) / 8));
      const c = t.ok ? "#2E9E4F" : "#E53935";
      return (
        <svg key={t.word} width={190} height={190} viewBox="0 0 24 24" style={{position: "absolute", left: t.x - 95, top: t.y - 95, transform: `scale(${sc})`, filter: "drop-shadow(0 6px 0 rgba(0,0,0,0.3))"}}>
          <circle cx="12" cy="12" r="10.6" fill={c} stroke="#101820" strokeWidth="1.6" />
          {t.ok ? <path d="M6.5 12.5l3.8 3.8 7.4-8.3" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" /> : <path d="M7.5 7.5l9 9M16.5 7.5l-9 9" stroke="#fff" strokeWidth="3" strokeLinecap="round" />}
        </svg>
      );
    })}
  </>
);

/* ---------- pausar e rebobinar: ⏸ e ⏪ GRANDES NO MEIO DA TELA (pedido do usuário) ---------- */
const Imagine: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const r = REWINDS.find((x) => x.id === s.id);
  if (!r) return null;
  const k = imagineAmount(gf);
  const rewOn = gf >= r.R && gf < r.R + RW;
  const pauseOn = gf >= r.P && gf < r.P + 30;
  const icon = (kind: "pause" | "rew", sc: number, o: number) => (
    <svg width={300} height={300} viewBox="0 0 24 24" style={{position: "absolute", left: 540 - 150, top: 960 - 150, transform: `scale(${sc})`, opacity: o}}>
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
  const po = 1 - clamp01((gf - r.P - 22) / 8);
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      {k > 0.01 && <AbsoluteFill style={{boxShadow: `inset 0 0 ${260 * k}px ${80 * k}px rgba(30,20,10,0.7)`}} />}
      {pauseOn && icon("pause", SP(gf, r.P, 10, 160), po)}
      {rewOn && (
        <>
          {icon("rew", 1 + 0.08 * Math.sin(f * 0.9), 1)}
          {Array.from({length: 7}).map((_, i) => (
            <div key={i} style={{position: "absolute", left: 0, right: 0, top: ((i * 293 + f * 97) % 1920), height: 6 + (i % 3) * 5, background: "rgba(255,255,255,0.35)"}} />
          ))}
          <div style={{position: "absolute", top: 740, left: 0, right: 0, textAlign: "center", fontFamily: FONT, fontWeight: 900, fontSize: 58, color: "#fff", WebkitTextStroke: "10px #101820", paintOrder: "stroke fill", opacity: Math.floor(f / 6) % 2 ? 1 : 0.6}}>VOLTANDO...</div>
        </>
      )}
    </AbsoluteFill>
  );
};

/* ---------- s10: pergunta final grande ---------- */
const FinalCTA: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "qual") ?? Math.round(s.durationInFrames * 0.45)) - 6;
  const c = (wordLocal(s, "próximo") ?? a + 70) - 30;
  if (f < a) return null;
  return (
    <div style={{position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.03, WebkitTextStroke: "13px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${SP(f, a, 10, 140)})`}}>
      <div style={{fontSize: 70, color: "#fff"}}>QUAL A TEMPERATURA</div>
      <div style={{fontSize: 70, color: "#fff"}}>MAIS ALTA NA SUA</div>
      <div style={{fontSize: 104, color: "#FFD60A"}}>CIDADE?</div>
      {f >= c && <div style={{fontSize: 56, color: "#fff", marginTop: 12, transform: `scale(${SP(f, c, 9, 170)})`}}>COMENTA AÍ E DIZ O QUE QUER VER NO <span style={{color: "#4DD0FF"}}>PRÓXIMO VÍDEO!</span></div>}
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
      {/* canhões de confete saindo dos dois cantos de baixo (no lugar dos corações) */}
      {[0, 1].map((side) =>
        Array.from({length: 45}).map((_, i) => {
          const d = random("cc" + side + i) * 12;
          const tt = t - d;
          if (tt < 0 || tt > 110) return null;
          const ang = (side ? -1 : 1) * (0.35 + random("ca" + side + i) * 0.45);
          const v = 30 + random("cv2" + side + i) * 22;
          const x = (side ? 1080 : 0) + Math.sin(ang) * v * tt;
          const y = 1900 - Math.cos(ang) * v * tt + 0.55 * tt * tt;
          if (y > 1960) return null;
          const COL2 = ["#E53935", "#FFC400", "#2E9E4F", "#1E88E5", "#4DD0FF", "#ff7aa8", "#ffffff"];
          return <div key={"cc" + side + i} style={{position: "absolute", left: x, top: y, width: 16, height: 26, background: COL2[i % COL2.length], borderRadius: 3, transform: `rotate(${tt * (8 + random("cr2" + side + i) * 12)}deg) scaleX(${Math.cos(tt * 0.35 + i)})`, opacity: 1 - clamp01((tt - 90) / 20)}} />;
        }),
      )}
    </AbsoluteFill>
  );
};

export const Overlay: React.FC<{s: TimedScene}> = ({s}) => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill>
      {s.id === "s10" && <Celebration s={s} f={f} />}
      {s.id === "s1" && <TitleCard s={s} f={f} />}
      {s.id === "s1" && <Thermo s={s} f={f} value={30 + 9 * clamp01(f / 120)} label="NO SERTÃO" a={(wordLocal(s, "calorão") ?? 60) - 6} e={s.durationInFrames - 4} />}
      {s.id === "s5" && <Thermo s={s} f={f} value={31} label="ÀS 23H" a={(wordLocal(s, "noite") ?? 100) - 6} e={s.durationInFrames - 4} right />}
      {s.id === "s8" && <Thermo s={s} f={f} value={36} label="NO QUARTO" a={6} e={s.durationInFrames - 4} right />}
      {s.id === "s6" && <NinoCard s={s} f={f} />}
      <Tips s={s} f={f} />
      {s.id === "s10" && <FinalCTA s={s} f={f} />}
      <Imagine s={s} f={f} />
      <Stamps s={s} f={f} />
      {!(s.id === "s10" && f >= (wordLocal(s, "qual") ?? 1e9) - 8) && <Badges s={s} f={f} />}
      <Captions s={s} f={f} />
    </AbsoluteFill>
  );
};
export const unusedMix = mixHex;
export const _u = [end, start, W, inS];
