import React from "react";
import {continueRender, delayRender, staticFile, useCurrentFrame} from "remotion";
import {fontFamily} from "./Video";
import {FPS, clamp, lerp, ramp, pop, rng} from "./util";

/* fonte arredondada (Fredoka, licença livre OFL) para os títulos das etapas, igual ao estilo da referência */
export const titleFont = "FRD";
if (typeof document !== "undefined" && !document.getElementById("frd-font")) {
  const h = delayRender("fonte-titulo");
  const st = document.createElement("style");
  st.id = "frd-font";
  st.textContent = `@font-face{font-family:FRD;font-weight:700;src:url(${staticFile("fonts/fredoka-latin.woff2")}) format("woff2");unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+2000-206F}
@font-face{font-family:FRD;font-weight:700;src:url(${staticFile("fonts/fredoka-latin-ext.woff2")}) format("woff2");unicode-range:U+0100-02BA,U+1E00-1EFF}`;
  document.head.appendChild(st);
  document.fonts.load('700 40px FRD', "ÃÉÇÍÂ").then(() => continueRender(h), () => continueRender(h));
}

/* ===== Camadas 2D reaproveitáveis (faixa amarela, legendas, chips, confete, figurinhas) ===== */
export type Wd = {w: string; s: number; e: number; line: number};
export const clean = (w: string) => w.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

/** legenda de UMA palavra por vez */
export const Captions: React.FC<{words: Wd[]; keys: Set<string>; top?: number}> = ({words, keys, top = 1235}) => {
  const f = useCurrentFrame();
  const t = f / FPS;
  let i = -1;
  for (let k = 0; k < words.length; k++) {
    const w = words[k];
    const next = words[k + 1];
    const end = next && next.s - w.e < 0.7 ? next.s : w.e + 0.3;
    if (t >= w.s - 0.03 && t < end - 0.03) i = k;
  }
  if (i < 0) return null;
  const w = words[i];
  const sc = pop(f, Math.round(w.s * FPS) - 1, 6);
  const txt = w.w.replace(/[.,!?…]+$/g, "").replace(/\.\.\.$/, "");
  const key = keys.has(clean(w.w));
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: txt.length > 10 ? 118 : 138, lineHeight: 1, textTransform: "uppercase", color: key ? "#FFD21F" : "#FFFFFF", ...STROKE, textShadow: "0 10px 22px rgba(0,0,0,0.5)", transform: `scale(${0.7 + 0.3 * sc}) rotate(${key ? -2 : 0}deg)`}}>
      {txt}
    </div>
  );
};

export const STROKE = {WebkitTextStroke: "14px #101018", paintOrder: "stroke fill" as const};
/** faixa amarela em arco no topo (nome da etapa) */
export const Banner: React.FC<{from: number; to: number; text: string; n: number}> = ({from, to, text, n}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const inn = pop(f, from, 12);
  const out = ramp(f, to - 7, to);
  const wob = Math.sin((f - from) / 5) * 1.2 * (1 - ramp(f, from, from + 40));
  const size = text.length > 19 ? 70 : 80;
  return (
    <div style={{position: "absolute", top: 120, left: 0, right: 0, height: 420, transform: `scale(${inn * (1 - 0.3 * out)}) rotate(${wob}deg)`, opacity: 1 - out, transformOrigin: "50% 40%"}}>
      <svg width={1080} height={420} viewBox="0 0 1080 420">
        <defs>
          <path id={"arc" + n} d="M 95 300 Q 540 105 985 300" />
        </defs>
        {/* pontas da fita */}
        <path d="M 40 330 L 120 300 L 105 360 Z" fill="#c98f00" stroke="#101018" strokeWidth={8} strokeLinejoin="round" />
        <path d="M 1040 330 L 960 300 L 975 360 Z" fill="#c98f00" stroke="#101018" strokeWidth={8} strokeLinejoin="round" />
        <use href={"#arc" + n} stroke="#101018" strokeWidth={150} fill="none" strokeLinecap="round" />
        <use href={"#arc" + n} stroke="#FFD21F" strokeWidth={132} fill="none" strokeLinecap="round" />
        <use href={"#arc" + n} stroke="#FFE680" strokeWidth={20} fill="none" strokeLinecap="round" transform="translate(0,-40)" opacity={0.55} />
        <text fontFamily={fontFamily} fontWeight={900} fontSize={size} fill="#1b1430" letterSpacing={2} dy={size * 0.35}>
          <textPath href={"#arc" + n} startOffset="50%" textAnchor="middle">
            {text}
          </textPath>
        </text>
      </svg>
      <div style={{position: "absolute", top: 30, left: 0, right: 0, textAlign: "center"}}>
        <span style={{fontFamily, fontWeight: 900, fontSize: 40, color: "#fff", background: "#101018", padding: "6px 22px", borderRadius: 30, letterSpacing: 4}}>ETAPA {n}</span>
      </div>
    </div>
  );
};

export const Chip: React.FC<{from: number; to: number; text: string; bg: string; top?: number; size?: number; rot?: number}> = ({from, to, text, bg, top = 300, size = 84, rot = -3}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: 1 - ramp(f, to - 6, to)}}>
      <div style={{transform: `scale(${pop(f, from, 10)}) rotate(${rot}deg)`, background: bg, color: "#fff", fontFamily, fontWeight: 900, fontSize: size, padding: "10px 44px", borderRadius: 22, border: "7px solid #101018", boxShadow: "0 10px 0 rgba(0,0,0,0.35)", WebkitTextStroke: "5px #101018", paintOrder: "stroke fill", whiteSpace: "nowrap"}}>{text}</div>
    </div>
  );
};

/** balão de pensamento com a praia (férias) */
export const Bubble: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 12) * (1 - ramp(f, to - 6, to));
  const sw = Math.sin(f / 6) * 3;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      <g transform={`translate(${x},${y}) scale(${s})`}>
        <circle cx={-150} cy={175} r={16} fill="#fff" stroke="#101018" strokeWidth={7} />
        <circle cx={-110} cy={120} r={26} fill="#fff" stroke="#101018" strokeWidth={7} />
        <ellipse cx={0} cy={0} rx={210} ry={150} fill="#fff" stroke="#101018" strokeWidth={9} />
        <clipPath id="bub">
          <ellipse cx={0} cy={0} rx={190} ry={132} />
        </clipPath>
        <g clipPath="url(#bub)">
          <rect x={-210} y={-150} width={420} height={170} fill="#8fd8ff" />
          <circle cx={110} cy={-60} r={42} fill="#ffd21f" />
          <rect x={-210} y={10} width={420} height={60} fill="#2bb0e0" />
          <rect x={-210} y={60} width={420} height={100} fill="#f3d697" />
          <path d={`M -80 95 Q -70 10 ${-50 + sw} -50`} stroke="#8a5a33" strokeWidth={16} fill="none" strokeLinecap="round" />
          {[-2.6, -1.9, -1.2, -0.5, 0.2].map((ang, i) => (
            <path key={i} d={`M ${-50 + sw} -50 q ${Math.cos(ang) * 40} ${Math.sin(ang) * 40 - 10} ${Math.cos(ang) * 80} ${Math.sin(ang) * 60 + 20}`} stroke="#3f9a3a" strokeWidth={16} fill="none" strokeLinecap="round" />
          ))}
          <path d="M 40 110 L 130 110 L 85 40 Z" fill="#e74c3c" />
          <rect x={83} y={40} width={5} height={70} fill="#fff" />
        </g>
      </g>
    </svg>
  );
};

/** "Zzz" saindo do menino dormindo */
export const Zzz: React.FC<{from: number; to: number; x: number; y: number}> = ({from, to, x, y}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <>
      {[0, 1, 2].map((i) => {
        const k = (((f - from) / 45 + i / 3) % 1);
        return (
          <div key={i} style={{position: "absolute", left: x + k * 140 + Math.sin(k * 6) * 20, top: y - k * 260, fontFamily, fontWeight: 900, fontSize: 60 + k * 60, color: "#ffffff", ...STROKE, WebkitTextStroke: "9px #101018", opacity: Math.min(1, k * 5) * (1 - k), transform: `rotate(${-10 + k * 20}deg)`}}>
            Z
          </div>
        );
      })}
    </>
  );
};

export const Rings: React.FC<{from: number; to: number; x: number; y: number; color?: string; speed?: number}> = ({from, to, x, y, color = "#ffffff", speed = 14}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const o = Math.min(ramp(f, from, from + 4), 1 - ramp(f, to - 6, to));
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: o}}>
      {[0, 1, 2, 3].map((i) => {
        const k = ((f - from) / speed + i / 4) % 1;
        return <circle key={i} cx={x} cy={y} r={lerp(40, 700, k)} fill="none" stroke={color} strokeWidth={16 * (1 - k) + 3} opacity={1 - k} />;
      })}
    </svg>
  );
};

/** estrelinhas de brilho */
export const Sparkles: React.FC<{from: number; to: number; x: number; y: number; r?: number}> = ({from, to, x, y, r = 260}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0}}>
      {Array.from({length: 7}, (_, i) => {
        const k = (((f - from) / 22 + i / 7) % 1);
        const ang = i * 2.4;
        const s = Math.sin(k * Math.PI) * (26 + (i % 3) * 10);
        const cx = x + Math.cos(ang) * r * (0.6 + 0.4 * ((i * 37) % 10) / 10);
        const cy = y + Math.sin(ang) * r * 0.8;
        return <path key={i} d={`M ${cx} ${cy - s} L ${cx + s * 0.3} ${cy - s * 0.3} L ${cx + s} ${cy} L ${cx + s * 0.3} ${cy + s * 0.3} L ${cx} ${cy + s} L ${cx - s * 0.3} ${cy + s * 0.3} L ${cx - s} ${cy} L ${cx - s * 0.3} ${cy - s * 0.3} Z`} fill="#fff6a8" stroke="#101018" strokeWidth={4} />;
      })}
    </svg>
  );
};

/** confete */
export const Confetti: React.FC<{from: number; to: number}> = ({from, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const cols = ["#ff4d6d", "#ffd21f", "#2ecc71", "#3498db", "#9b59b6", "#ff9f1c", "#ffffff"];
  return (
    <svg width={1080} height={1920} style={{position: "absolute", inset: 0, opacity: 1 - ramp(f, to - 12, to)}}>
      {Array.from({length: 110}, (_, i) => {
        const r = rng(i * 9 + 1);
        const t = (f - from) / FPS;
        const vx = (r() - 0.5) * 900;
        const vy = -900 - r() * 900;
        const side = i % 2 ? 1 : -1;
        const x0 = side > 0 ? 1080 : 0;
        const x = x0 - side * Math.abs(vx) * 0.6 * Math.min(t, 1.2) + Math.sin(t * 5 + i) * 30;
        const y = 1500 + vy * t + 900 * t * t;
        const rot = t * (300 + r() * 500) * (r() > 0.5 ? 1 : -1);
        return <rect key={i} x={x - 12} y={y - 7} width={24} height={14} rx={3} fill={cols[i % cols.length]} transform={`rotate(${rot} ${x} ${y}) scale(1 ${Math.cos(t * 9 + i)})`} />;
      })}
    </svg>
  );
};

/** figurinhas do "parabéns": bicicleta x, 40 melancias, muro, sol x */
export const Sticker: React.FC<{from: number; x: number; y: number; rot: number; children: React.ReactNode; label: string; to: number}> = ({from, x, y, rot, children, label, to}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const s = pop(f, from, 10) * (1 - ramp(f, to - 6, to));
  return (
    <div style={{position: "absolute", left: x - 160, top: y - 150, width: 320, height: 300, transform: `scale(${s}) rotate(${rot}deg)`}}>
      <div style={{position: "absolute", inset: 0, background: "#fff", border: "8px solid #101018", borderRadius: 34, boxShadow: "0 12px 0 rgba(0,0,0,0.3)", overflow: "hidden"}}>
        <svg width={304} height={210} viewBox="0 0 304 210">
          {children}
        </svg>
        <div style={{position: "absolute", bottom: 8, left: 0, right: 0, textAlign: "center", fontFamily, fontWeight: 900, fontSize: 46, color: "#101018"}}>{label}</div>
      </div>
    </div>
  );
};
export const Cross: React.FC = () => (
  <g stroke="#e8262d" strokeWidth={20} strokeLinecap="round">
    <line x1={60} y1={30} x2={244} y2={185} />
    <line x1={244} y1={30} x2={60} y2={185} />
  </g>
);


/** nome da etapa no estilo da referência: letras grandes amarelas, contorno preto grosso, duas linhas, sem faixa */
export const StageTitle: React.FC<{from: number; to: number; lines: string[]; top?: number; kicker?: string}> = ({from, to, lines, top = 250, kicker}) => {
  const f = useCurrentFrame();
  if (f < from || f > to) return null;
  const inn = pop(f, from, 12);
  const out = ramp(f, to - 6, to);
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(150, Math.round(1500 / Math.max(6, longest)));
  return (
    <div style={{position: "absolute", top, left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", transform: `scale(${inn * (1 - 0.2 * out)}) rotate(-3deg)`, opacity: 1 - out, transformOrigin: "50% 40%"}}>
      {kicker && (
        <div style={{fontFamily: titleFont, fontWeight: 700, fontSize: Math.round(size * 0.55), lineHeight: 1, color: "#ffffff", WebkitTextStroke: `${Math.round(size * 0.09)}px #141414`, paintOrder: "stroke fill", textShadow: "0 8px 0 rgba(0,0,0,0.25)", letterSpacing: 2, marginBottom: 6}}>{kicker}</div>
      )}
      {lines.map((l, i) => (
        <div key={i} style={{fontFamily: titleFont, fontWeight: 700, fontSize: size, lineHeight: 0.98, color: "#FFD21F", WebkitTextStroke: `${Math.round(size * 0.13)}px #141414`, paintOrder: "stroke fill", textShadow: "0 10px 0 rgba(0,0,0,0.25)", letterSpacing: 1, whiteSpace: "nowrap", transform: `translateX(${i % 2 ? 12 : -8}px)`}}>
          {l}
        </div>
      ))}
    </div>
  );
};
