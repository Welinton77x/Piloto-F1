import React from "react";
import {AbsoluteFill, random, useCurrentFrame} from "remotion";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET, finalCut, norm, wordLocal} from "../data/scenes";
import type {TimedScene} from "../data/scenes";
import {L, SP, clamp01, easeOut, mixHex} from "../lib/anim";
import {project} from "../lib/camera";
import {track} from "../lib/track";
import {ITEMS, W, end, inS, itemK, start} from "../lib/story";

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
const TERMS = new Set(["72 HORAS = 3 DIAS", "ÁGUA POTÁVEL", "COMIDA", "LANTERNA + PILHAS", "RÁDIO A PILHA", "REMÉDIOS", "DOCUMENTOS", "MOCHILA PERTO DA PORTA"]);
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

/* ---------- s1: a pergunta grande + a notícia no celular ---------- */
const TitleCard: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = 6;
  const out = (wordLocal(s, "Vamos") ?? 1e9) + 10;
  if (f >= out + 8) return null;
  const sc = SP(f, a, 10, 140) * (1 - clamp01((f - out) / 8));
  const line = (t: string, c: string, fs: number, d: number) => <div style={{fontSize: fs, color: c, transform: `scale(${SP(f, a + d, 10, 160)})`}}>{t}</div>;
  return (
    <div style={{position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${sc}) rotate(${Math.sin(f * 0.1) * 1.2}deg)`}}>
      {line("O QUE VAI NO", "#FFFFFF", 90, 0)}
      {line("KIT DE 72 HORAS?", "#FFD60A", 104, 4)}
    </div>
  );
};
const NewsCard: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = 10, e = (wordLocal(s, "Vamos") ?? 200) + 10;
  if (f < a || f > e + 8) return null;
  const o = 1 - clamp01((f - e) / 8);
  return (
    <div style={{position: "absolute", left: 120, right: 120, top: 1330, opacity: o, transform: `scale(${SP(f, a, 11, 150) * 0.9})`, fontFamily: FONT, fontWeight: 900}}>
      <div style={{background: "#ffffff", border: "6px solid #101820", borderRadius: 24, padding: "14px 20px", boxShadow: "0 8px 0 rgba(0,0,0,0.3)"}}>
        <div style={{display: "inline-block", background: "#E53935", color: "#fff", fontSize: 26, padding: "4px 14px", borderRadius: 10}}>ALERTA</div>
        <div style={{fontSize: 34, color: "#101820", marginTop: 8, lineHeight: 1.1}}>DEFESA CIVIL RECOMENDA KIT DE EMERGÊNCIA PARA 72 HORAS</div>
      </div>
    </div>
  );
};

/* ---------- checklist do kit na tela, marcado item a item (s4–s7) ---------- */
const Checklist: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const a = W("s4", "Agora") - 4, e = W("s7", "família") + 30;
  if (gf < a || gf > e + 10) return null;
  const o = 1 - clamp01((gf - e) / 10);
  return (
    <div style={{position: "absolute", left: 40, top: 600, width: 420, opacity: o, transform: `scale(${SP(gf, a, 11, 150)})`, transformOrigin: "0% 0%", fontFamily: FONT, fontWeight: 900}}>
      <div style={{background: "rgba(255,255,255,0.94)", border: "5px solid #101820", borderRadius: 22, padding: "14px 16px", boxShadow: "0 8px 0 rgba(0,0,0,0.3)"}}>
        <div style={{fontSize: 30, color: "#101820", marginBottom: 8}}>KIT 72 HORAS</div>
        {ITEMS.map((it, i) => {
          const k = itemK(i, gf);
          const done = k > 0.5;
          const cur = done && (i === ITEMS.length - 1 || itemK(i + 1, gf) <= 0.5) && gf < W("s7", "mochila");
          return (
            <div key={it.k} style={{display: "flex", alignItems: "center", gap: 10, fontSize: 22, color: done ? "#101820" : "#9e9e9e", padding: "3px 6px", borderRadius: 10, background: cur ? "#FFF3B0" : "transparent", marginTop: 2}}>
              <div style={{width: 28, height: 28, borderRadius: 7, border: "3px solid #101820", background: done ? "#2E9E4F" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", flex: "none", transform: `scale(${done ? SP(gf, W(it.w[0], it.w[1]) - 4, 8, 180) : 1})`}}>
                {done && (
                  <svg width={20} height={20} viewBox="0 0 24 24">
                    <path d="M5 12.5l4.5 4.5 9.5-10" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  </svg>
                )}
              </div>
              {it.label}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ---------- cartão 199 / 193 ---------- */
const PhoneCard: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "Defesa", 1) ?? 1e9) - 4, e = (wordLocal(s, "Defesa", 1) ?? 1e9) + 100;
  if (f < a || f > e) return null;
  const o = 1 - clamp01((f - e + 8) / 8);
  return (
    <div style={{position: "absolute", right: 60, top: 640, width: 360, opacity: o, transform: `scale(${SP(f, a, 10, 160)}) rotate(3deg)`, fontFamily: FONT, fontWeight: 900, textAlign: "center"}}>
      <div style={{background: "#fffde7", border: "6px solid #101820", borderRadius: 18, padding: "14px 10px", boxShadow: "0 8px 0 rgba(0,0,0,0.3)"}}>
        <div style={{fontSize: 70, color: "#e65100", lineHeight: 1}}>199</div>
        <div style={{fontSize: 26, color: "#101820"}}>DEFESA CIVIL</div>
        <div style={{height: 4, background: "#101820", margin: "8px 20px"}} />
        <div style={{fontSize: 70, color: "#E53935", lineHeight: 1}}>193</div>
        <div style={{fontSize: 26, color: "#101820"}}>BOMBEIROS</div>
      </div>
    </div>
  );
};

/* ---------- aviso saindo do rádio ---------- */
const RadioAlert: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "avisos") ?? 1e9) - 6, e = (wordLocal(s, "carregador") ?? 1e9) - 8;
  if (f < a || f > e) return null;
  return (
    <div style={{position: "absolute", left: 560, right: 50, top: 640, transform: `scale(${SP(f, a, 10, 160)}) rotate(-3deg)`, fontFamily: FONT, fontWeight: 900}}>
      <div style={{background: "#101820", color: "#FFD60A", border: "5px solid #FFD60A", borderRadius: 22, padding: "14px 18px", fontSize: 30, lineHeight: 1.15, boxShadow: "0 8px 0 rgba(0,0,0,0.3)"}}>
        📻 ATENÇÃO: PROCURE UM LOCAL ALTO
      </div>
    </div>
  );
};

/* ---------- s2/s3: ícones do que para (energia, água, comunicação) e o relógio de 72 h ---------- */
const Outage: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  if (!inS("s2", gf)) return null;
  const items: [string, string, string][] = [["energia", "⚡", "ENERGIA"], ["água", "💧", "ÁGUA"], ["comunicação", "📶", "SINAL"]];
  return (
    <div style={{position: "absolute", left: 0, right: 0, top: 1350, display: "flex", justifyContent: "center", gap: 26, fontFamily: FONT, fontWeight: 900}}>
      {items.map(([w, ic, lb]) => {
        const a = wordLocal(s, w) ?? 1e9;
        if (f < a - 4) return <div key={lb} style={{width: 200}} />;
        return (
          <div key={lb} style={{width: 200, textAlign: "center", transform: `scale(${SP(f, a - 4, 10, 160)})`}}>
            <div style={{position: "relative", width: 120, height: 120, margin: "0 auto", borderRadius: 60, background: "#ffffff", border: "6px solid #101820", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 64}}>
              {ic}
              <svg width={120} height={120} viewBox="0 0 24 24" style={{position: "absolute", left: -6, top: -6}}>
                <path d="M5 5l14 14" stroke="#E53935" strokeWidth="3" strokeLinecap="round" />
              </svg>
            </div>
            <div style={{fontSize: 30, color: "#fff", WebkitTextStroke: "7px #101820", paintOrder: "stroke fill", marginTop: 6}}>{lb}</div>
          </div>
        );
      })}
    </div>
  );
};
const Clock72: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  if (!inS("s3", gf)) return null;
  const h = Math.round(Math.min(72, (f / s.durationInFrames) * 90));
  return (
    <div style={{position: "absolute", right: 60, top: 620, width: 260, textAlign: "center", fontFamily: FONT, fontWeight: 900, transform: `scale(${SP(f, 4, 11, 150)})`}}>
      <svg width={240} height={240} viewBox="0 0 240 240">
        <circle cx={120} cy={120} r={104} fill="#ffffff" stroke="#101820" strokeWidth={10} />
        <circle cx={120} cy={120} r={88} fill="none" stroke="#FFD60A" strokeWidth={16} strokeDasharray={553} strokeDashoffset={553 * (1 - h / 72)} transform="rotate(-90 120 120)" />
        <text x={120} y={136} textAnchor="middle" fontSize={56} fontFamily={FONT} fontWeight={900} fill="#101820">{h}h</text>
      </svg>
    </div>
  );
};
/* ---------- s7: calendário de 6 meses ---------- */
const Calendar: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "seis") ?? 1e9) - 10, e = (wordLocal(s, "Não") ?? 1e9) - 4;
  if (f < a || f > e) return null;
  return (
    <div style={{position: "absolute", right: 70, top: 640, transform: `scale(${SP(f, a, 10, 160)}) rotate(4deg)`, fontFamily: FONT, fontWeight: 900, textAlign: "center"}}>
      <svg width={230} height={230} viewBox="0 0 24 24">
        <rect x="2.5" y="4" width="19" height="17" rx="3" fill="#fff" stroke="#101820" strokeWidth="1.4" />
        <rect x="2.5" y="4" width="19" height="5" rx="2" fill="#E53935" stroke="#101820" strokeWidth="1.4" />
        <path d="M7 2.5v3M17 2.5v3" stroke="#101820" strokeWidth="1.6" strokeLinecap="round" />
        <text x="12" y="18.4" textAnchor="middle" fontSize="8.5" fontWeight="900" fontFamily={FONT} fill="#101820">6</text>
      </svg>
      <div style={{fontSize: 36, color: "#fff", WebkitTextStroke: "7px #101820", paintOrder: "stroke fill"}}>MESES</div>
    </div>
  );
};

/* ---------- ✓ e ✕ grandes ---------- */
type Stamp = {id: string; word: string; ok: boolean; x: number; y: number};
const STAMPS: Stamp[] = [
  // ✕ vermelho no que dá errado / ✓ verde no que resolve (pedido do usuário)
  {id: "s2", word: "geladeira", ok: false, x: 860, y: 900},
  {id: "s2", word: "bomba", ok: false, x: 860, y: 900},
  {id: "s2", word: "romper", ok: false, x: 860, y: 900},
  {id: "s2", word: "sinal", ok: false, x: 860, y: 900},
  {id: "s4", word: "potável", ok: true, x: 880, y: 1050},
  {id: "s4", word: "comida", ok: true, x: 880, y: 1050},
  {id: "s5", word: "vela", ok: false, x: 880, y: 1050},
  {id: "s5", word: "rádio", ok: true, x: 880, y: 1050},
  {id: "s6", word: "documentos", ok: true, x: 880, y: 1050},
  {id: "s7", word: "pegar", ok: true, x: 880, y: 1050},
];
const Stamps: React.FC<{s: TimedScene; f: number}> = ({s, f}) => (
  <>
    {STAMPS.filter((t) => t.id === s.id).map((t) => {
      const a = wordLocal(s, t.word);
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

/* ---------- s8: pergunta final grande ---------- */
const FinalCTA: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "Você") ?? Math.round(s.durationInFrames * 0.6)) - 6;
  const c = (wordLocal(s, "próximo") ?? a + 70) - 30;
  if (f < a) return null;
  return (
    <div style={{position: "absolute", top: 260, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "13px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${SP(f, a, 10, 140)})`}}>
      <div style={{fontSize: 92, color: "#fff"}}>VOCÊ JÁ TEM</div>
      <div style={{fontSize: 120, color: "#FFD60A", transform: `rotate(${Math.sin(f * 0.25) * 3}deg)`}}>O SEU KIT?</div>
      {f >= c && (
        <div style={{fontSize: 60, color: "#fff", marginTop: 14, transform: `scale(${SP(f, c, 9, 170)})`}}>
          COMENTA O QUE VOCÊ QUER VER
          <br />
          NO <span style={{color: "#4DD0FF"}}>PRÓXIMO VÍDEO!</span>
        </div>
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
      {s.id === "s8" && <Celebration s={s} f={f} />}
      {s.id === "s1" && <TitleCard s={s} f={f} />}
      {s.id === "s1" && <NewsCard s={s} f={f} />}
      <Outage s={s} f={f} />
      <Clock72 s={s} f={f} />
      <Checklist s={s} f={f} />
      {s.id === "s5" && <PhoneCard s={s} f={f} />}
      {s.id === "s5" && <RadioAlert s={s} f={f} />}
      {s.id === "s7" && <Calendar s={s} f={f} />}
      {s.id === "s8" && <FinalCTA s={s} f={f} />}
      <Stamps s={s} f={f} />
      <Badges s={s} f={f} />
      <Captions s={s} f={f} />
    </AbsoluteFill>
  );
};
export const unusedMix = mixHex;
export const _u = [end, start, W];
