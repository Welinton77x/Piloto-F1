// Camada 2D no estilo da referência: legenda palavra a palavra, título, DICA N, pílulas, contador, fato e card de seguir.
import React from "react";
import {AbsoluteFill, Img, spring, staticFile, useCurrentFrame, delayRender, continueRender} from "remotion";
import * as THREE from "three";
import {sceneAt, timing, FPS, planById, cutById} from "./data/timeline";
import {cameraAt, L, anchorAt, screenFx} from "./three/animate";

// Montserrat (variável 700–900) servida localmente: o navegador do render não acessa o Google Fonts
const fontFamily = "MontserratLocal";
if (typeof document !== "undefined" && !document.getElementById("font-montserrat")) {
  const h = delayRender("fonte Montserrat");
  const face = new FontFace(fontFamily, `url(${staticFile("fonts/montserrat.woff2")}) format("woff2")`, {weight: "700 900"});
  face.load().then((f) => {
    (document.fonts as any).add(f);
    continueRender(h);
  });
  const tag = document.createElement("meta");
  tag.id = "font-montserrat";
  document.head.appendChild(tag);
}
const W = 1080, H = 1920;
const YELLOW = "#FFD21F";
const DARK = "#161616";
const TONE: Record<string, string> = {problem: "#e53935", solution: "#2fb84f", neutral: "#2f7df6", attention: "#ff8f1f"};

const stroke = (px: number): React.CSSProperties => ({WebkitTextStroke: `${px}px ${DARK}`, paintOrder: "stroke fill"});
const pop = (f: number, f0: number) => (f < f0 ? 0 : spring({frame: f - f0, fps: FPS, config: {damping: 10, stiffness: 180, mass: 0.6}}));

function project(frame: number, p: [number, number, number]) {
  // projeta um ponto 3D com a pose de câmera deste frame
  const pose = cameraAt(frame);
  const cam = new THREE.PerspectiveCamera(pose.fov, W / H, 0.1, 200);
  cam.position.copy(pose.pos);
  cam.lookAt(pose.target);
  cam.updateMatrixWorld();
  const v = new THREE.Vector3(...p).project(cam);
  return {x: ((v.x + 1) / 2) * W, y: ((1 - v.y) / 2) * H};
}

const clean = (w: string) => w.replace(/[.,:;!?…"]/g, "");
const norm = (w: string) => clean(w).toLowerCase();

const Caption: React.FC<{frame: number}> = ({frame}) => {
  const {cut, plan} = sceneAt(frame);
  if (!cut.voKey) return null;
  const words = timing[cut.voKey].words;
  const t = (frame - cut.voStart) / FPS;
  let i = -1;
  for (let k = 0; k < words.length; k++) if (t >= words[k].s - 0.02) i = k;
  if (i < 0 || t > words[words.length - 1].e + 0.35) return null;
  const w = words[i];
  const hl = plan.highlights.map((h) => h.toLowerCase()).includes(norm(w.w));
  const k = pop(frame, cut.voStart + Math.round(w.s * FPS));
  const scale = 0.82 + 0.18 * k;
  return (
    <div style={{position: "absolute", top: 1150, width: W, textAlign: "center", transform: `scale(${scale})`}}>
      <span style={{fontFamily, fontWeight: 900, fontSize: 116, color: hl ? YELLOW : "#ffffff", ...stroke(14), textShadow: "0 8px 0 rgba(0,0,0,0.28)", letterSpacing: -1}}>{clean(w.w)}</span>
    </div>
  );
};

const Title: React.FC<{local: number; text: string; out: number}> = ({local, text, out}) => {
  const k = pop(local, 0);
  const o = 1 - Math.min(1, Math.max(0, (local - out) / 8));
  if (o <= 0) return null;
  const txt = {fontFamily, fontWeight: 900, fontSize: 96, color: "#fff", ...stroke(13), lineHeight: 1.15};
  return (
    <div style={{position: "absolute", top: 250, width: W, textAlign: "center", transform: `scale(${0.6 + 0.4 * k})`, opacity: o}}>
      {text.split("|").map((line, i) => (
        <div key={i} style={txt}>
          {line.split(/(\[[^\]]+\])/).map((part, j) =>
            part.startsWith("[") ? (
              <span key={j} style={{background: YELLOW, borderRadius: 18, padding: "0 18px", display: "inline-block", transform: "rotate(-2deg)"}}>{part.slice(1, -1)}</span>
            ) : (
              <span key={j}>{part}</span>
            ),
          )}
        </div>
      ))}
    </div>
  );
};

const Dica: React.FC<{text: string; k: number; top?: number}> = ({text, k, top = 270}) => (
  <div style={{position: "absolute", top, width: W, textAlign: "center", transform: `scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k * 2)}}>
    <span style={{fontFamily, fontWeight: 900, fontSize: 128, color: YELLOW, ...stroke(14), textShadow: "0 8px 0 rgba(0,0,0,0.28)"}}>{text}</span>
  </div>
);

const Pill: React.FC<{text: string; tone: string; x: number; y: number; k: number; big?: boolean}> = ({text, tone, x, y, k, big}) => (
  <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * k})`, opacity: Math.min(1, k * 2)}}>
    <div style={{display: "flex", alignItems: "center", gap: 16, background: "#fff", borderRadius: text.length > 26 ? 40 : 999, padding: big ? "18px 34px" : "14px 28px", boxShadow: "0 8px 20px rgba(0,0,0,0.18)", whiteSpace: text.length > 26 ? "normal" : "nowrap", width: text.length > 26 ? 640 : undefined}}>
      <div style={{width: big ? 26 : 22, height: big ? 26 : 22, minWidth: big ? 26 : 22, borderRadius: 99, background: TONE[tone] ?? TONE.neutral}} />
      <span style={{fontFamily, fontWeight: 800, fontSize: big ? 46 : 38, color: "#1d1d1d", letterSpacing: 0.5, lineHeight: 1.2}}>{text}</span>
    </div>
  </div>
);

const XMark: React.FC<{x: number; y: number; k: number}> = ({x, y, k}) => (
  <div style={{position: "absolute", left: x, top: y, width: 120, height: 120, borderRadius: 99, background: "#e53935", border: "8px solid #fff", boxShadow: "0 8px 18px rgba(0,0,0,0.25)", transform: `translate(-50%, -50%) scale(${k})`}}>
    {[45, -45].map((r) => (
      <div key={r} style={{position: "absolute", left: 24, top: 46, width: 56, height: 14, borderRadius: 8, background: "#fff", transform: `rotate(${r}deg)`}} />
    ))}
  </div>
);

const Counter: React.FC<{n: string; label: string; x: number; y: number; k: number}> = ({n, label, x, y, k}) => (
  <div style={{position: "absolute", left: x, top: y, transform: `translate(-50%, -50%) scale(${0.4 + 0.6 * k})`, opacity: Math.min(1, k * 2), background: "#fff", borderRadius: 26, padding: "14px 30px", textAlign: "center", boxShadow: "0 8px 20px rgba(0,0,0,0.18)"}}>
    <div style={{fontFamily, fontWeight: 900, fontSize: 76, color: "#1d1d1d", lineHeight: 1}}>{n}</div>
    <div style={{fontFamily, fontWeight: 800, fontSize: 26, color: "#6b6b6b", letterSpacing: 2}}>{label}</div>
  </div>
);

const InfoCard: React.FC<{text: string; k: number}> = ({text, k}) => {
  const [label, ...rest] = text.split("|");
  return (
    <div style={{position: "absolute", left: W / 2, top: 430, transform: `translate(-50%, -50%) rotate(-2deg) scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k * 2)}}>
      <div style={{background: "#16213e", border: "8px solid #FFD21F", borderRadius: 30, padding: "26px 44px", textAlign: "center", boxShadow: "0 14px 34px rgba(0,0,0,0.3)", maxWidth: 820}}>
        <div style={{fontFamily, fontWeight: 800, fontSize: 30, color: "#ffffff", letterSpacing: 4, marginBottom: 8}}>{label}</div>
        {rest.map((r, i) => (
          <div key={i} style={{fontFamily, fontWeight: 900, fontSize: i === 0 ? 64 : 44, color: i === 0 ? YELLOW : "#ffffff", lineHeight: 1.1}}>{r}</div>
        ))}
      </div>
    </div>
  );
};

const Notify: React.FC<{text: string; k: number}> = ({text, k}) => {
  const [title, ...rest] = text.split("|");
  return (
    <div style={{position: "absolute", left: W / 2, top: 300 - (1 - k) * 260, transform: "translate(-50%, -50%)", opacity: Math.min(1, k * 2)}}>
      <div style={{display: "flex", gap: 22, alignItems: "center", background: "rgba(255,255,255,0.97)", borderRadius: 34, padding: "24px 34px", width: 820, boxShadow: "0 14px 34px rgba(0,0,0,0.25)"}}>
        <div style={{width: 92, height: 92, minWidth: 92, borderRadius: 24, background: "#25d366", display: "flex", alignItems: "center", justifyContent: "center"}}>
          <div style={{width: 46, height: 46, borderRadius: 99, border: "7px solid #fff"}} />
        </div>
        <div>
          <div style={{fontFamily, fontWeight: 700, fontSize: 26, color: "#777"}}>{title}</div>
          {rest.map((r, i) => (
            <div key={i} style={{fontFamily, fontWeight: i === 0 ? 900 : 700, fontSize: i === 0 ? 40 : 30, color: "#1d1d1d"}}>{r}</div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Cracha: React.FC<{text: string; k: number}> = ({text, k}) => {
  const [role, sub] = text.split("|");
  return (
    <div style={{position: "absolute", left: W / 2, top: 440, transform: `translate(-50%, -50%) rotate(-3deg) scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k * 2)}}>
      <div style={{background: "#1d3a8a", borderRadius: 30, padding: "22px 34px", width: 760, boxShadow: "0 14px 34px rgba(0,0,0,0.3)", border: "6px solid #fff"}}>
        <div style={{fontFamily, fontWeight: 800, fontSize: 28, color: "#FFD21F", letterSpacing: 4}}>CRACHÁ OFICIAL · ESCOLA</div>
        <div style={{display: "flex", gap: 24, alignItems: "center", marginTop: 12}}>
          <div style={{width: 120, height: 140, borderRadius: 16, background: "#e9eef5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80}}>{role.startsWith("DIRETOR") ? "🦖" : "🦆"}</div>
          <div>
            <div style={{fontFamily, fontWeight: 900, fontSize: role.length > 14 ? 44 : 60, color: "#fff", lineHeight: 1.05}}>{role}</div>
            <div style={{fontFamily, fontWeight: 700, fontSize: 32, color: "#cfe0ff", marginTop: 8}}>{sub}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Exam: React.FC<{text: string; k: number}> = ({text, k}) => {
  const [title, q, body] = text.split("|");
  return (
    <div style={{position: "absolute", left: W / 2, top: 520 + (1 - k) * 600, transform: "translate(-50%, -50%) rotate(2deg)", opacity: Math.min(1, k * 2)}}>
      <div style={{background: "#fffdf6", borderRadius: 18, padding: "36px 46px", width: 800, boxShadow: "0 14px 34px rgba(0,0,0,0.3)", backgroundImage: "repeating-linear-gradient(#fffdf6 0 54px, #cfe0ff 54px 56px)"}}>
        <div style={{fontFamily, fontWeight: 900, fontSize: 54, color: "#c0392b"}}>{title}</div>
        <div style={{fontFamily, fontWeight: 800, fontSize: 34, color: "#1d1d1d", marginTop: 14}}>{q}</div>
        <div style={{fontFamily, fontWeight: 900, fontSize: 52, color: "#1d1d1d", marginTop: 10, lineHeight: 1.15}}>{body}</div>
        <div style={{height: 90}} />
      </div>
    </div>
  );
};

const VHS: React.FC<{text: string; frame: number}> = ({text, frame}) => (
  <AbsoluteFill>
    <AbsoluteFill style={{background: "rgba(40,80,200,0.28)", mixBlendMode: "multiply"}} />
    <AbsoluteFill style={{backgroundImage: "repeating-linear-gradient(rgba(255,255,255,0.07) 0 3px, transparent 3px 7px)"}} />
    <div style={{position: "absolute", left: 0, right: 0, top: ((frame * 37) % 1920), height: 40, background: "rgba(255,255,255,0.18)"}} />
    <div style={{position: "absolute", left: 90, top: 300, fontFamily: "'Courier New', monospace", fontWeight: 700, fontSize: 64, color: "#fff", textShadow: "3px 0 #ff2a6d, -3px 0 #2af0ff", opacity: frame % 30 < 22 ? 1 : 0.3}}>{text}</div>
  </AbsoluteFill>
);

const Follow: React.FC<{local: number}> = ({local}) => {
  const k = pop(local, 0);
  const done = local >= 40;
  const b = done ? pop(local, 40) : 0;
  return (
    <div style={{position: "absolute", left: W / 2, top: 560, transform: `translate(-50%, -50%) scale(${0.5 + 0.5 * k})`, opacity: Math.min(1, k * 2)}}>
      <div style={{background: "#fff", borderRadius: 44, padding: "40px 60px 36px", textAlign: "center", boxShadow: "0 14px 34px rgba(0,0,0,0.22)", minWidth: 460, whiteSpace: "nowrap"}}>
        <Img src={staticFile("avatar.png")} style={{width: 170, height: 170, borderRadius: 999, border: "6px solid #FFD21F", objectFit: "cover"}} />
        <div style={{fontFamily, fontWeight: 900, fontSize: 46, color: "#1d1d1d", marginTop: 16}}>@professorpowerguido</div>
        <div style={{display: "inline-block", marginTop: 18, borderRadius: 999, padding: "14px 40px", background: done ? "#e9e9e9" : "#ff3b5c", transform: `scale(${1 + 0.12 * Math.sin(Math.PI * Math.min(1, b))})`}}>
          <span style={{fontFamily, fontWeight: 800, fontSize: 36, color: done ? "#444" : "#fff"}}>{done ? "Seguindo ✓" : "Seguir"}</span>
        </div>
      </div>
    </div>
  );
};

export const Overlay: React.FC = () => {
  const frame = useCurrentFrame();
  const {id, local} = sceneAt(frame);
  const plan = planById[id];
  const hasTop = plan.badges.some((b) => b.kind === "dica" || b.kind === "fact" || b.kind === "title" || b.kind === "card" || b.kind === "notify" || b.kind === "badge" || b.kind === "exam" || b.kind === "vhs");
  const items: React.ReactNode[] = [];
  plan.badges.forEach((b, i) => {
    const f0 = L(id, b.f);
    if (local < f0) return;
    if (b.kind !== "title" && b.out !== undefined && local >= L(id, b.out)) return;
    const k = pop(local, f0);
    if (b.kind === "title") items.push(<Title key={i} local={local} text={b.text} out={L(id, b.out ?? 95)} />);
    if (b.kind === "dica" && local - f0 < 72) items.push(<Dica key={i} text={b.text} k={k * (1 - Math.max(0, Math.min(1, (local - f0 - 62) / 10)))} />);
    if (b.kind === "fact") items.push(<div key={i}><Pill text={b.text} tone={b.tone ?? "attention"} x={W / 2} y={330} k={k} big /></div>);
    if (b.kind === "follow") items.push(<Follow key={i} local={local - f0} />);
    if (b.kind === "card") items.push(<InfoCard key={i} text={b.text} k={k} />);
    if (b.kind === "badge") items.push(<Cracha key={i} text={b.text} k={k} />);
    if (b.kind === "exam") items.push(<Exam key={i} text={b.text} k={k} />);
    if (b.kind === "notify") items.push(<Notify key={i} text={b.text} k={k} />);
    if (!b.anchor) return;
    const a3 = anchorAt(b.anchor, frame);
    if (!a3) return;
    const p = project(frame, a3);
    const x = Math.max(300, Math.min(W - 300, p.x));
    let y = Math.max(hasTop ? 480 : 300, Math.min(1060, p.y - 40));
    if (b.kind === "pill") items.push(<Pill key={i} text={b.text} tone={b.tone ?? "neutral"} x={x} y={y} k={k} />);
    if (b.kind === "fx" && b.text === "✖") items.push(<XMark key={i} x={x} y={y - 120} k={k} />);
    if (b.kind === "fx" && b.text !== "✖") {
      items.push(
        <div key={i} style={{position: "absolute", left: x, top: y - 150, transform: `translate(-50%, -50%) rotate(-8deg) scale(${k})`}}>
          <span style={{fontFamily, fontWeight: 900, fontSize: 130, color: YELLOW, ...stroke(14)}}>{b.text}</span>
        </div>,
      );
    }
    if (b.kind === "counter") {
      let n = b.text.split(" ")[0];
      let label = b.text.split(" ").slice(1).join(" ");
      if (b.text.includes("{n}")) {
        const t0 = L(id, 15);
        n = String(Math.max(1, Math.min(10, Math.floor((local - t0) / 6) + 1)));
        label = "PÃES";
        y = Math.max(480, y - 60);
      }
      items.push(<Counter key={i} n={n} label={label} x={x} y={y} k={k} />);
    }
  });
  const fx = screenFx(frame);
  return (
    <AbsoluteFill>
      {(fx as any).sepia > 0 ? <AbsoluteFill style={{background: "#c89b5a", opacity: (fx as any).sepia, mixBlendMode: "color"}} /> : null}
      {(fx as any).vhs > 0 ? <VHS text={plan.badges.find((b) => b.kind === "vhs")?.text ?? ""} frame={frame} /> : null}
      {fx.red > 0 ? <AbsoluteFill style={{background: "#ff1a1a", opacity: fx.red, mixBlendMode: "multiply"}} /> : null}
      {fx.white > 0 ? <AbsoluteFill style={{background: "#ffffff", opacity: fx.white}} /> : null}
      {items}
      <Caption frame={frame} />
    </AbsoluteFill>
  );
};

export const sceneStart = (id: string) => cutById[id].start;
