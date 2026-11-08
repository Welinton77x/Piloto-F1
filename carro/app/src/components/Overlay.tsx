import React from "react";
import {AbsoluteFill, random, useCurrentFrame} from "remotion";
import type {Badge, Kind} from "../data/scene-plan";
import {TAIL, VO_OFFSET, finalCut, norm, wordLocal} from "../data/scenes";
import type {TimedScene} from "../data/scenes";
import {L, SP, clamp01, easeOut, mixHex} from "../lib/anim";
import {project} from "../lib/camera";
import {track} from "../lib/track";
import {REWINDS, RW, W, carSpeed, carX, failing, imagineAmount, rew, te} from "../lib/story";
import {mascotLook} from "../lib/mascotPose";

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
const TERMS = new Set(["PISTÃO", "VIRABREQUIM", "MOTOR", "RADIADOR", "EMBREAGEM", "CÂMBIO", "DIFERENCIAL", "DIREÇÃO", "SUSPENSÃO", "PNEU", "FREIO", "CARRO PRONTO!"]);
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
  const a = (wordLocal(s, "viajar") ?? 10) - 2;
  const out = (wordLocal(s, "fôlego") ?? 1e9) - 10;
  if (f < a - 4 || f >= out + 8) return null;
  const sc = SP(f, a - 4, 10, 140) * (1 - clamp01((f - out) / 8));
  const line = (t: string, c: string, fs: number, d: number) => (
    <div style={{fontSize: fs, color: c, transform: `scale(${SP(f, a - 4 + d, 10, 160)})`}}>{t}</div>
  );
  return (
    <div style={{position: "absolute", top: 250, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "14px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${sc}) rotate(${Math.sin(f * 0.1) * 1.2}deg)`}}>
      {line("VOCÊ CONSTRUIU", "#FFFFFF", 92, 0)}
      {line("UM CARRO", "#FFD60A", 140, 4)}
      {line("DO ZERO?", "#FFFFFF", 100, 8)}
    </div>
  );
};

/* ---------- balões de reação do mascote (como na referência: EITA!, UHUL!) ---------- */
const BALLOONS: [string, string, string][] = [
  ["s1", "fôlego", "UFA!"], ["s2", "explode", "BUM!"], ["s3", "trancos", "EITA!"], ["s4", "travar", "AI!"],
  ["s5", "semáforo", "SOCORRO!"], ["s6", "chia", "IIIH!"], ["s7", "tombar", "OPA!"], ["s8", "coluna", "AI!"],
  ["s9", "demais", "SOCORRO!"], ["s10", "Parabéns", "VRUM!"],
];
const Balloon: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const b = BALLOONS.find((x) => x[0] === s.id);
  if (!b) return null;
  const a = (wordLocal(s, b[1]) ?? -999) - 4;
  if (f < a || f > a + 45) return null;
  const t = te(gf);
  const ml = mascotLook(t);
  if (!ml.at) return null;
  const pt = project(gf, [carX(t) + ml.at[0], ml.at[1] + (ml.pivotHip ? 1.05 : 1.55), ml.at[2]]);
  if (!pt) return null;
  const x = Math.max(200, Math.min(880, pt.x + 120)), y = Math.max(540, Math.min(1080, pt.y - 60));
  const o = 1 - clamp01((f - a - 38) / 7);
  return (
    <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%, -100%) scale(${SP(f, a, 9, 170)}) rotate(-6deg)`, opacity: o, fontFamily: FONT, fontWeight: 900, fontSize: 60, color: "#101820", background: "#FFD60A", border: "6px solid #101820", borderRadius: 40, padding: "6px 26px", boxShadow: "0 6px 0 rgba(0,0,0,0.3)", whiteSpace: "nowrap"}}>
      {b[2]}
    </div>
  );
};

/* ---------- s2: cartão histórico (como o "chacoalha-ossos" da referência) ---------- */
const HistoryCard: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "motor") ?? 1e9) + 4;
  if (f < a || f > a + 75) return null;
  const o = 1 - clamp01((f - a - 68) / 7);
  return (
    <div style={{position: "absolute", left: 140, right: 140, top: 1300, opacity: o, transform: `scale(${SP(f, a, 10, 150) * 0.85}) rotate(-2deg)`, fontFamily: FONT, fontWeight: 900, textAlign: "center"}}>
      <div style={{background: "#fff8e1", border: "6px solid #101820", borderRadius: 26, padding: "18px 22px", boxShadow: "0 8px 0 rgba(0,0,0,0.3)"}}>
        <div style={{fontSize: 46, color: "#e65100"}}>PRIMEIRO CARRO</div>
        <div style={{fontSize: 30, color: "#101820", marginTop: 4}}>1886 · 3 RODAS · ~16 km/h</div>
        <svg width={360} height={130} viewBox="0 0 360 130" style={{marginTop: 8}}>
          <circle cx={80} cy={95} r={30} fill="none" stroke="#101820" strokeWidth={8} />
          <circle cx={280} cy={95} r={30} fill="none" stroke="#101820" strokeWidth={8} />
          <path d="M80 95 L150 60 L250 60 L280 95 M150 60 L170 25 L210 25" stroke="#101820" strokeWidth={8} fill="none" strokeLinecap="round" />
          <rect x={185} y={62} width={50} height={26} fill="#8d6e63" stroke="#101820" strokeWidth={5} />
        </svg>
      </div>
    </div>
  );
};

/* ---------- s4: termômetro do motor ---------- */
const TempGauge: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const t = te(gf);
  const r = rew("s4");
  const a = r.P - s.startFrame - 6, e = (wordLocal(s, "radiador") ?? 200) + 50;
  if (f < a || f > e) return null;
  const hot = failing("s4", t) ? L(t, r.P, r.P + 30, 0.4, 1) : t >= r.R ? L(gf, W("s4", "água"), W("s4", "radiador"), 1, 0.45) : 0.4;
  const ang = -110 + 220 * hot;
  return (
    <div style={{position: "absolute", right: 60, top: 600, width: 250, textAlign: "center", fontFamily: FONT, fontWeight: 900, transform: `scale(${SP(f, a, 12, 140)})`}}>
      <svg width={250} height={220} viewBox="0 0 260 230">
        <circle cx={130} cy={130} r={110} fill="#ffffff" stroke="#101820" strokeWidth={10} />
        <path d="M 52 182 A 95 95 0 0 1 130 35" fill="none" stroke="#1e88e5" strokeWidth={14} strokeLinecap="round" />
        <path d="M 130 35 A 95 95 0 0 1 208 182" fill="none" stroke="#E53935" strokeWidth={14} strokeLinecap="round" />
        <line x1={130} y1={130} x2={130 + Math.sin((ang * Math.PI) / 180) * 80} y2={130 - Math.cos((ang * Math.PI) / 180) * 80} stroke="#101820" strokeWidth={9} strokeLinecap="round" />
        <circle cx={130} cy={130} r={13} fill="#101820" />
      </svg>
      <div style={{fontSize: 36, color: "#fff", WebkitTextStroke: "7px #101820", paintOrder: "stroke fill"}}>MOTOR</div>
    </div>
  );
};

/* ---------- s5/s9: velocímetro ---------- */
const Speedo: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const gf = s.startFrame + f;
  const t = te(gf);
  let a: number, e: number;
  if (s.id === "s5") {
    a = (wordLocal(s, "Primeira") ?? 0) - 6;
    e = (wordLocal(s, "câmbio") ?? 0) + 40;
  } else {
    a = 0;
    e = (wordLocal(s, "calor") ?? 0) + 30;
  }
  if (f < a || f > e) return null;
  const kmh = Math.round(carSpeed(t) * 700);
  const ang = -120 + 240 * clamp01(kmh / 120);
  return (
    <div style={{position: "absolute", left: 60, top: 600, width: 250, textAlign: "center", fontFamily: FONT, fontWeight: 900, transform: `scale(${SP(f, a, 12, 140)})`}}>
      <svg width={250} height={220} viewBox="0 0 260 230">
        <circle cx={130} cy={130} r={110} fill="#101820" stroke="#ffffff" strokeWidth={8} />
        <path d="M 52 182 A 95 95 0 1 1 208 182" fill="none" stroke="#2E9E4F" strokeWidth={12} strokeLinecap="round" />
        <path d="M 180 50 A 95 95 0 0 1 208 182" fill="none" stroke="#E53935" strokeWidth={12} strokeLinecap="round" />
        <line x1={130} y1={130} x2={130 + Math.sin((ang * Math.PI) / 180) * 82} y2={130 - Math.cos((ang * Math.PI) / 180) * 82} stroke="#ff7a1a" strokeWidth={8} strokeLinecap="round" />
        <text x={130} y={190} textAnchor="middle" fontSize={38} fontFamily={FONT} fontWeight={900} fill="#ffffff">{kmh}</text>
      </svg>
      <div style={{fontSize: 32, color: "#fff", WebkitTextStroke: "7px #101820", paintOrder: "stroke fill"}}>km/h</div>
    </div>
  );
};

/* ---------- s6: na curva, a roda de fora anda mais (diagrama visto de cima) ---------- */
const CurveDiagram: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const a = (wordLocal(s, "curioso") ?? 1e9) - 4, e = (wordLocal(s, "Então") ?? 1e9) + 10;
  if (f < a || f > e) return null;
  const k = clamp01((f - a) / 30);
  const arc = (r: number) => `M ${90 + r} 520 A ${r} ${r} 0 0 0 90 ${520 - r}`;
  const o = 1 - clamp01((f - e + 8) / 8);
  return (
    <div style={{position: "absolute", left: 140, top: 520, opacity: o, transform: `scale(${SP(f, a, 11, 150)})`, transformOrigin: "0% 0%"}}>
      <svg width={800} height={560} viewBox="0 0 800 560">
        <rect x={0} y={0} width={800} height={560} rx={36} fill="rgba(16,24,32,0.78)" />
        <path d={arc(420)} stroke="#E53935" strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray={700} strokeDashoffset={700 * (1 - k)} />
        <path d={arc(270)} stroke="#4DD0FF" strokeWidth={22} fill="none" strokeLinecap="round" strokeDasharray={460} strokeDashoffset={460 * (1 - k)} />
        <text x={480} y={150} fontSize={44} fontFamily={FONT} fontWeight={900} fill="#ff6b6b">FORA: MAIS</text>
        <text x={350} y={330} fontSize={44} fontFamily={FONT} fontWeight={900} fill="#4DD0FF">DENTRO: MENOS</text>
      </svg>
    </div>
  );
};

/* ---------- s9: linhas de velocidade (como na referência) ---------- */
const SpeedLines: React.FC<{s: TimedScene; f: number}> = ({s, f}) => {
  const t = te(s.startFrame + f);
  if (carSpeed(t) < 0.12) return null;
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <svg width={1080} height={1920}>
        {Array.from({length: 26}).map((_, i) => {
          const ang = (i / 26) * Math.PI * 2 + random("sl" + i);
          const r0 = 520 + ((f * 37 + i * 91) % 300), r1 = r0 + 220;
          return <line key={i} x1={540 + Math.cos(ang) * r0} y1={960 + Math.sin(ang) * r0} x2={540 + Math.cos(ang) * r1} y2={960 + Math.sin(ang) * r1} stroke="#ffffff" strokeWidth={6} opacity={0.7} strokeLinecap="round" />;
        })}
      </svg>
    </AbsoluteFill>
  );
};

/* ---------- ✓ e ✕ grandes ---------- */
type Stamp = {id: string; word: string; ok: boolean; x: number; y: number};
const STAMPS: Stamp[] = [
  {id: "s3", word: "lisinho", ok: true, x: 860, y: 760},
  {id: "s6", word: "diferencial", ok: true, x: 860, y: 760},
  {id: "s9", word: "freio", ok: true, x: 860, y: 760},
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
  const a = (wordLocal(s, "Comente") ?? Math.round(s.durationInFrames * 0.6)) - 6;
  const c = (wordLocal(s, "próximo") ?? a + 70) - 30;
  if (f < a) return null;
  return (
    <div style={{position: "absolute", top: 260, left: 40, right: 40, textAlign: "center", fontFamily: FONT, fontWeight: 900, lineHeight: 1.02, WebkitTextStroke: "13px #101820", paintOrder: "stroke fill", textShadow: "0 9px 0 rgba(16,24,32,0.4)", transform: `scale(${SP(f, a, 10, 140)})`}}>
      <div style={{fontSize: 100, color: "#fff"}}>COMENTE</div>
      <div style={{fontSize: 140, color: "#FFD60A", transform: `rotate(${Math.sin(f * 0.25) * 3}deg)`}}>"VRUM"</div>
      {f >= c && (
        <div style={{fontSize: 62, color: "#fff", marginTop: 14, transform: `scale(${SP(f, c, 9, 170)})`}}>
          O QUE VOCÊ QUER VER
          <br />
          NO <span style={{color: "#4DD0FF"}}>PRÓXIMO VÍDEO?</span>
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
      {s.id === "s9" && <SpeedLines s={s} f={f} />}
      {s.id === "s10" && <Celebration s={s} f={f} />}
      {s.id === "s1" && <TitleCard s={s} f={f} />}
      {s.id === "s2" && <HistoryCard s={s} f={f} />}
      {s.id === "s4" && <TempGauge s={s} f={f} />}
      {(s.id === "s5" || s.id === "s9") && <Speedo s={s} f={f} />}
      {s.id === "s6" && <CurveDiagram s={s} f={f} />}
      {s.id === "s10" && <FinalCTA s={s} f={f} />}
      <Balloon s={s} f={f} />
      <Imagine s={s} f={f} />
      <Stamps s={s} f={f} />
      <Badges s={s} f={f} />
      <Captions s={s} f={f} />
    </AbsoluteFill>
  );
};
export const unusedMix = mixHex;
