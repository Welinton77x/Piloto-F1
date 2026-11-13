import React, {useMemo} from "react";
import * as THREE from "three";
import {RoundedBoxGeometry} from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import {canvasTex, clamp, lerp, rng, woodTex} from "./util";
import type {V3} from "./Sets5";

/* ===== Objetos do vídeo "5 dicas pra não jogar GTA 6" — mesmo estilo liso/arredondado do personagem ===== */

export const sm = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (color: string, rough = 0.5, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    const k = color + rough + JSON.stringify(extra);
    let m = cache.get(k);
    if (!m) {
      m = new THREE.MeshStandardMaterial({color, roughness: rough, metalness: 0, ...extra});
      cache.set(k, m);
    }
    return m;
  };
})();
const texMat = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (key: string, tex: THREE.Texture, rough = 0.7, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
    let m = cache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({map: tex, roughness: rough, ...extra});
      cache.set(key, m);
    }
    return m;
  };
})();
export const rbox = (() => {
  const cache = new Map<string, THREE.BufferGeometry>();
  return (w: number, h: number, d: number, r = 0.06) => {
    const k = `${w}|${h}|${d}|${r}`;
    let g = cache.get(k);
    if (!g) {
      g = new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
      cache.set(k, g);
    }
    return g;
  };
})();
const BLACK = "#15161d";

/* ---------- textos em textura ---------- */
const textTex = (key: string, w: number, h: number, bg: string, lines: {t: string; size: number; color: string; y: number; stroke?: string}[], border?: string) =>
  canvasTex(key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    if (border) {
      c.strokeStyle = border;
      c.lineWidth = Math.round(h * 0.07);
      c.strokeRect(c.lineWidth / 2, c.lineWidth / 2, w - c.lineWidth, h - c.lineWidth);
    }
    c.textAlign = "center";
    c.textBaseline = "middle";
    for (const l of lines) {
      c.font = `bold ${l.size}px sans-serif`;
      if (l.stroke) {
        c.lineWidth = l.size * 0.12;
        c.strokeStyle = l.stroke;
        c.strokeText(l.t, w / 2, l.y);
      }
      c.fillStyle = l.color;
      c.fillText(l.t, w / 2, l.y);
    }
  });

/* ---------- controle de videogame (genérico) — largura ~0.3 ---------- */
export const Controller: React.FC<{p?: V3; r?: V3; s?: number; color?: string; glow?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, color = "#2b2e3b", glow = 0}) => {
  const body = sm(color, 0.32);
  const dark = sm(BLACK, 0.4);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh geometry={rbox(0.24, 0.065, 0.12, 0.03)} material={body} castShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.088 * sd, -0.018, 0.062]} rotation={[Math.PI / 2 + 0.35, 0, -0.2 * sd]} material={body} castShadow>
          <capsuleGeometry args={[0.042, 0.07, 6, 12]} />
        </mesh>
      ))}
      {[-1, 1].map((sd) => (
        <group key={"s" + sd} position={[0.042 * sd, 0.036, 0.028]}>
          <mesh material={dark}>
            <cylinderGeometry args={[0.013, 0.016, 0.03, 12]} />
          </mesh>
          <mesh position={[0, 0.018, 0]} material={dark}>
            <cylinderGeometry args={[0.024, 0.024, 0.012, 16]} />
          </mesh>
        </group>
      ))}
      {(
        [
          ["#e8412c", 0, -0.02],
          ["#2ecc71", 0, 0.016],
          ["#3a86ff", -0.018, -0.002],
          ["#ffd21f", 0.018, -0.002],
        ] as [string, number, number][]
      ).map(([c, dx, dz], i) => (
        <mesh key={"b" + i} position={[0.083 + dx, 0.034, -0.014 + dz]} material={sm(c, 0.3)}>
          <sphereGeometry args={[0.011, 10, 8]} />
        </mesh>
      ))}
      <mesh position={[-0.083, 0.034, -0.014]} material={dark}>
        <boxGeometry args={[0.045, 0.008, 0.014]} />
      </mesh>
      <mesh position={[-0.083, 0.034, -0.014]} material={dark}>
        <boxGeometry args={[0.014, 0.008, 0.045]} />
      </mesh>
      <mesh position={[0, 0.034, -0.036]} material={sm("#7fd4ff", 0.3, {emissive: "#7fd4ff", emissiveIntensity: 1.2})}>
        <boxGeometry args={[0.05, 0.006, 0.008]} />
      </mesh>
      {glow > 0.01 && <pointLight position={[0, 0.25, 0.05]} intensity={3 * glow} distance={2.2} decay={2} color="#fff2b0" />}
    </group>
  );
};

/* ---------- feixes de luz (aditivos) ---------- */
const beamTex = () =>
  canvasTex("feixe", 64, 256, (c) => {
    const g = c.createLinearGradient(0, 256, 0, 0);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 256);
    const h = c.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, "rgba(0,0,0,1)");
    h.addColorStop(0.5, "rgba(0,0,0,0)");
    h.addColorStop(1, "rgba(0,0,0,1)");
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = h;
    c.fillRect(0, 0, 64, 256);
  });
const useBeamMat = (color: string, opacity: number) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: beamTex(), color, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false}), [color]);
  m.opacity = opacity;
  return m;
};
/** raios em leque (sol atrás de um objeto), no plano XY */
export const Burst: React.FC<{p: V3; r?: V3; s?: number; k?: number; n?: number; color?: string; t?: number}> = ({p, r = [0, 0, 0], s = 1, k = 1, n = 12, color = "#fff0a0", t = 0}) => {
  const mat = useBeamMat(color, 0.55 * k);
  if (k < 0.01) return null;
  return (
    <group position={p} rotation={r} scale={s * (0.6 + 0.4 * k)}>
      {Array.from({length: n}, (_, i) => (
        <group key={i} rotation={[0, 0, (i / n) * Math.PI * 2 + t * 0.35]}>
          <mesh position={[0, 0.6, 0]} material={mat}>
            <planeGeometry args={[i % 2 ? 0.16 : 0.24, 1.2]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
/** feixe de luz subindo (de dentro do livro), planos girados em volta do eixo y */
export const Beam: React.FC<{p: V3; s?: number; k?: number; color?: string; w?: number; h?: number}> = ({p, s = 1, k = 1, color = "#fff2b0", w = 0.5, h = 1.4}) => {
  const mat = useBeamMat(color, 0.5 * k);
  if (k < 0.01) return null;
  return (
    <group position={p} scale={[s, s * (0.3 + 0.7 * k), s]}>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[0, h / 2, 0]} rotation={[0, (i / 4) * Math.PI, 0]} material={mat}>
          <planeGeometry args={[w, h]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- caixa do jogo (genérica: só um "6" gigante) ---------- */
const boxTex = () =>
  canvasTex("caixa-6", 512, 680, (c, r) => {
    const g = c.createLinearGradient(0, 0, 0, 680);
    g.addColorStop(0, "#0b1340");
    g.addColorStop(1, "#22094a");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 680);
    for (let i = 0; i < 70; i++) {
      c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
      c.beginPath();
      c.arc(r() * 512, 80 + r() * 600, 1 + r() * 2.5, 0, Math.PI * 2);
      c.fill();
    }
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 500px sans-serif";
    c.shadowColor = "#00e5ff";
    c.shadowBlur = 50;
    c.lineWidth = 26;
    c.strokeStyle = "#00c8ff";
    c.strokeText("6", 256, 390);
    c.shadowBlur = 0;
    c.fillStyle = "#e6fdff";
    c.fillText("6", 256, 390);
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 0, 512, 78);
    c.fillStyle = "#101018";
    c.font = "bold 46px sans-serif";
    c.fillText("LANÇAMENTO", 256, 42);
  });
export const GameBox: React.FC<{p?: V3; r?: V3; s?: number; glow?: number; t?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, glow = 0, t = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.5, 0.66, 0.07, 0.02)} material={sm("#0d1030", 0.4)} castShadow />
    <mesh position={[0, 0, 0.0365]} material={texMat("caixa-6", boxTex(), 0.35, {emissive: "#ffffff", emissiveMap: boxTex(), emissiveIntensity: 0.35})}>
      <planeGeometry args={[0.47, 0.63]} />
    </mesh>
    {glow > 0.01 && (
      <>
        <Burst p={[0, 0, -0.06]} s={0.75} k={glow} t={t} color="#9fefff" />
        <pointLight position={[0, 0, 0.5]} intensity={2.5 * glow} distance={3} decay={2} color="#8fe8ff" />
      </>
    )}
  </group>
);

/* ---------- quarto / sala (caixa com 4 paredes) ---------- */
const floorTex = () => woodTex("piso-quarto", [186, 128, 84], 8, [3, 3]);
export const WIN: {x: number; y: number; w: number; h: number} = {x: 1.55, y: 1.85, w: 1.14, h: 0.94};
export const RoomShell: React.FC<{wall: string; accent: string; w?: number; d0?: number; d1?: number; h?: number; door?: boolean; openWindow?: boolean}> = ({wall, accent, w = 6, d0 = -2.6, d1 = 3.2, h = 3.3, door = true, openWindow = false}) => {
  const wm = sm(wall, 0.85);
  const zc = (d0 + d1) / 2;
  const D = d1 - d0;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} material={texMat("piso-quarto", floorTex(), 0.6)} receiveShadow>
        <planeGeometry args={[w, D]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, zc]} material={sm("#fbf7ee", 0.9)}>
        <planeGeometry args={[w, D]} />
      </mesh>
      {/* paredes */}
      {openWindow ? (
        /* parede do fundo com o vão da janela (dá pra ver lá fora) */
        <group position={[0, 0, d0 - 0.1]}>
          {(
            [
              [(-w / 2 + WIN.x - WIN.w / 2) / 2, h / 2, WIN.x - WIN.w / 2 + w / 2, h],
              [(WIN.x + WIN.w / 2 + w / 2) / 2, h / 2, w / 2 - WIN.x - WIN.w / 2, h],
              [WIN.x, (WIN.y - WIN.h / 2) / 2, WIN.w, WIN.y - WIN.h / 2],
              [WIN.x, (WIN.y + WIN.h / 2 + h) / 2, WIN.w, h - WIN.y - WIN.h / 2],
            ] as [number, number, number, number][]
          ).map(([x, y, ww, hh], i) => (
            <mesh key={i} position={[x, y, 0]} material={wm} receiveShadow>
              <boxGeometry args={[ww, hh, 0.2]} />
            </mesh>
          ))}
        </group>
      ) : (
        <mesh position={[0, h / 2, d0 - 0.1]} material={wm} receiveShadow>
          <boxGeometry args={[w, h, 0.2]} />
        </mesh>
      )}
      <mesh position={[0, h / 2, d1 + 0.1]} material={wm} receiveShadow>
        <boxGeometry args={[w, h, 0.2]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(w / 2 + 0.1) * sd, h / 2, zc]} material={wm} receiveShadow>
          <boxGeometry args={[0.2, h, D + 0.4]} />
        </mesh>
      ))}
      {/* rodapé */}
      <mesh position={[0, 0.06, d0 + 0.01]} material={sm("#ffffff", 0.6)}>
        <boxGeometry args={[w, 0.12, 0.04]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={"r" + sd} position={[(w / 2 - 0.01) * sd, 0.06, zc]} material={sm("#ffffff", 0.6)}>
          <boxGeometry args={[0.04, 0.12, D]} />
        </mesh>
      ))}
      {/* janela na parede do fundo */}
      <group position={[WIN.x, WIN.y, d0 + 0.005]}>
        {/* moldura (4 barras) */}
        {(
          [
            [0, (WIN.h + 0.08) / 2, WIN.w + 0.16, 0.08],
            [0, -(WIN.h + 0.08) / 2, WIN.w + 0.16, 0.08],
            [-(WIN.w + 0.08) / 2, 0, 0.08, WIN.h],
            [(WIN.w + 0.08) / 2, 0, 0.08, WIN.h],
          ] as [number, number, number, number][]
        ).map(([x, y, ww, hh], i) => (
          <mesh key={i} position={[x, y, 0]} material={sm("#ffffff", 0.5)}>
            <boxGeometry args={[ww, hh, 0.08]} />
          </mesh>
        ))}
        {openWindow ? (
          <mesh position={[0, 0, 0.0]} material={sm("#dff3ff", 0.05, {transparent: true, opacity: 0.12, depthWrite: false})}>
            <planeGeometry args={[WIN.w, WIN.h]} />
          </mesh>
        ) : (
          <mesh position={[0, 0, 0.0]} material={sm("#9fd8ff", 0.2, {emissive: "#bfe6ff", emissiveIntensity: 0.6})}>
            <planeGeometry args={[WIN.w, WIN.h]} />
          </mesh>
        )}
        <mesh position={[0, 0, 0.045]} material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[0.05, 0.94, 0.03]} />
        </mesh>
        <mesh position={[0, 0, 0.045]} material={sm("#ffffff", 0.5)}>
          <boxGeometry args={[1.14, 0.05, 0.03]} />
        </mesh>
        {/* cortinas */}
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.72 * sd, -0.05, 0.08]} material={sm(accent, 0.8)} castShadow>
            <boxGeometry args={[0.26, 1.35, 0.06]} />
          </mesh>
        ))}
      </group>
      {/* porta na parede da esquerda */}
      {door && (
        <group position={[-w / 2 + 0.005, 0, 0.6]} rotation={[0, Math.PI / 2, 0]}>
          <mesh position={[0, 1.08, 0]} material={sm("#ffffff", 0.5)}>
            <boxGeometry args={[1.05, 2.16, 0.06]} />
          </mesh>
          <mesh position={[0, 1.04, 0.035]} geometry={rbox(0.9, 2.04, 0.04, 0.02)} material={sm("#c98a4e", 0.6)} />
          <mesh position={[0.34, 1.05, 0.07]} material={sm("#e7c35a", 0.3, {metalness: 0.5})}>
            <sphereGeometry args={[0.04, 12, 10]} />
          </mesh>
        </group>
      )}
      {/* quadrinhos na parede */}
      {[
        [-1.2, 2.05, "#ff8a5c"],
        [-0.35, 2.2, "#5ccfff"],
      ].map(([x, y, c], i) => (
        <group key={"q" + i} position={[x as number, y as number, d0 + 0.02]}>
          <mesh geometry={rbox(0.55, 0.42, 0.04, 0.015)} material={sm("#ffffff", 0.6)} />
          <mesh position={[0, 0, 0.022]} material={sm(c as string, 0.7)}>
            <planeGeometry args={[0.45, 0.32]} />
          </mesh>
          <mesh position={[0.06, -0.04, 0.025]} material={sm("#ffffff", 0.7)}>
            <circleGeometry args={[0.08, 20]} />
          </mesh>
        </group>
      ))}
      {/* tapete */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0.5]} material={sm(accent, 0.95)} receiveShadow>
        <circleGeometry args={[1.5, 40]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0.5]} material={sm("#ffffff", 0.95)} receiveShadow>
        <ringGeometry args={[1.25, 1.33, 40]} />
      </mesh>
    </group>
  );
};

/* mesinha redonda (pedestal da caixa) */
export const SideTable: React.FC<{p: V3; h?: number; color?: string}> = ({p, h = 0.8, color = "#ffffff"}) => (
  <group position={p}>
    <mesh position={[0, h - 0.03, 0]} material={sm(color, 0.5)} castShadow receiveShadow>
      <cylinderGeometry args={[0.36, 0.36, 0.06, 32]} />
    </mesh>
    <mesh position={[0, (h - 0.06) / 2, 0]} material={sm(color, 0.5)} castShadow>
      <cylinderGeometry args={[0.06, 0.08, h - 0.06, 16]} />
    </mesh>
    <mesh position={[0, 0.02, 0]} material={sm(color, 0.5)} castShadow receiveShadow>
      <cylinderGeometry args={[0.26, 0.28, 0.04, 32]} />
    </mesh>
  </group>
);

/* escrivaninha (o menino fica atrás dela, de frente pra câmera) */
export const DESK_H = 0.82;
export const Desk: React.FC<{p: V3; r?: V3; w?: number}> = ({p, r = [0, 0, 0], w = 1.5}) => {
  const top = sm("#f2f2f2", 0.45);
  const leg = sm("#5b6ee1", 0.5);
  return (
    <group position={p} rotation={r}>
      <mesh position={[0, DESK_H - 0.035, 0]} geometry={rbox(w, 0.07, 0.75, 0.025)} material={top} castShadow receiveShadow />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[(w / 2 - 0.08) * sx, (DESK_H - 0.07) / 2, 0.3 * sz]} material={leg} castShadow>
            <boxGeometry args={[0.06, DESK_H - 0.07, 0.06]} />
          </mesh>
        )),
      )}
      {/* gaveteiro */}
      <mesh position={[w / 2 - 0.3, DESK_H - 0.22, 0]} geometry={rbox(0.42, 0.3, 0.66, 0.03)} material={leg} castShadow />
      <mesh position={[w / 2 - 0.3, DESK_H - 0.22, 0.335]} material={sm("#ffffff", 0.4)}>
        <boxGeometry args={[0.14, 0.03, 0.02]} />
      </mesh>
      {/* abajur e lápis */}
      <group position={[-w / 2 + 0.2, DESK_H, -0.22]}>
        <mesh position={[0, 0.02, 0]} material={sm("#ffd21f", 0.4)}>
          <cylinderGeometry args={[0.1, 0.11, 0.04, 20]} />
        </mesh>
        <mesh position={[0, 0.2, 0]} material={sm("#ffd21f", 0.4)}>
          <cylinderGeometry args={[0.015, 0.015, 0.36, 8]} />
        </mesh>
        <mesh position={[0.03, 0.4, 0.03]} rotation={[0.5, 0, -0.4]} material={sm("#ffd21f", 0.4)}>
          <coneGeometry args={[0.11, 0.15, 20, 1, true]} />
        </mesh>
      </group>
      <group position={[-w / 2 + 0.45, DESK_H, -0.2]}>
        <mesh position={[0, 0.08, 0]} material={sm("#e8412c", 0.5)}>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 16]} />
        </mesh>
        {[-0.02, 0.02, 0].map((x, i) => (
          <mesh key={i} position={[x, 0.2, (i - 1) * 0.015]} rotation={[0, 0, x * 4]} material={sm(["#3a86ff", "#2ecc71", "#ffd21f"][i], 0.5)}>
            <cylinderGeometry args={[0.009, 0.009, 0.2, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/* ---------- livro de matemática gigante (abre, guarda o controle, cadeado) ---------- */
const capaTex = () =>
  canvasTex("capa-matematica", 640, 480, (c) => {
    c.fillStyle = "#c0392b";
    c.fillRect(0, 0, 640, 480);
    c.strokeStyle = "#ffd21f";
    c.lineWidth = 14;
    c.strokeRect(24, 24, 592, 432);
    c.fillStyle = "#ffd21f";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 92px sans-serif";
    c.fillText("MATEMÁTICA", 320, 150);
    c.fillStyle = "#ffffff";
    c.font = "bold 70px sans-serif";
    c.fillText("π  x²  ÷  √", 320, 290);
    c.font = "bold 46px sans-serif";
    c.fillText("VOLUME 1", 320, 395);
  });
export const BOOK_W = 0.62;
export const BOOK_D = 0.46;
export const BOOK_H = 0.18;
const HOLE_W = 0.36;
const HOLE_D = 0.22;
export const MathBook: React.FC<{p: V3; r?: V3; s?: number; open?: number; lock?: number; lockOff?: number; inside?: React.ReactNode}> = ({p, r = [0, 0, 0], s = 1, open = 0, lock = 0, lockOff = 0, inside}) => {
  const cover = sm("#c0392b", 0.55);
  const paper = sm("#fbf6e8", 0.8);
  const W = BOOK_W;
  const D = BOOK_D;
  const H = BOOK_H;
  const lk = lock * (1 - lockOff);
  return (
    <group position={p} rotation={r} scale={s}>
      {/* contracapa + miolo */}
      <mesh position={[0, 0.012, 0]} geometry={rbox(W, 0.024, D, 0.01)} material={cover} castShadow receiveShadow />
      {/* miolo com um buraco recortado nas páginas (onde o controle mora) */}
      {(() => {
        const pw = W - 0.05;
        const pd = D - 0.035;
        const y0 = 0.0225;
        const y1 = H - 0.0225;
        const hb = 0.045; // fundo do buraco
        const cx = 0.02;
        const xl = -pw / 2 + 0.01;
        const xr = pw / 2 + 0.01;
        const hl = cx - HOLE_W / 2;
        const hr = cx + HOLE_W / 2;
        const blocks: [number, number, number, number, number, number][] = [
          [(xl + xr) / 2, (y0 + hb) / 2, 0, xr - xl, hb - y0, pd],
          [(xl + hl) / 2, (hb + y1) / 2, 0, hl - xl, y1 - hb, pd],
          [(hr + xr) / 2, (hb + y1) / 2, 0, xr - hr, y1 - hb, pd],
          [cx, (hb + y1) / 2, (HOLE_D / 2 + pd / 2) / 2, HOLE_W, y1 - hb, pd / 2 - HOLE_D / 2],
          [cx, (hb + y1) / 2, -(HOLE_D / 2 + pd / 2) / 2, HOLE_W, y1 - hb, pd / 2 - HOLE_D / 2],
        ];
        return blocks.map(([x, y, z, w, h, d], i) => (
          <mesh key={i} position={[x, y, z]} material={paper} castShadow receiveShadow>
            <boxGeometry args={[w, h, d]} />
          </mesh>
        ));
      })()}
      <mesh position={[0.02, 0.046, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#cbbf9f", 0.9)}>
        <planeGeometry args={[HOLE_W, HOLE_D]} />
      </mesh>
      <group position={[0.02, 0.075, 0]}>{inside}</group>
      {/* lombada */}
      <mesh position={[-W / 2 + 0.012, H / 2, 0]} geometry={rbox(0.05, H, D, 0.02)} material={cover} castShadow />
      {/* capa (gira na lombada) */}
      <group position={[-W / 2 + 0.012, H - 0.012, 0]} rotation={[0, 0, Math.PI * 0.98 * open]}>
        <mesh position={[W / 2 - 0.012, 0, 0]} geometry={rbox(W, 0.024, D, 0.01)} material={cover} castShadow />
        <mesh position={[W / 2 - 0.012, 0.0125, 0]} rotation={[-Math.PI / 2, 0, 0]} material={texMat("capa-matematica", capaTex(), 0.6)}>
          <planeGeometry args={[W - 0.03, D - 0.03]} />
        </mesh>
      </group>
      {/* correntes + cadeado */}
      {lk > 0.01 && (
        <group scale={[1, 1, 1]}>
          {[-0.12, 0.12].map((x) => (
            <mesh key={x} position={[x + 0.02, H / 2, 0]} scale={[1, lk, lk]} material={sm("#8c8f99", 0.35, {metalness: 0.6})}>
              <boxGeometry args={[0.035, H + 0.03, D + 0.03]} />
            </mesh>
          ))}
        </group>
      )}
      {lock > 0.01 && (
        <group position={[0.02 + lockOff * 0.5, H / 2 + lockOff * (1.2 - lockOff) * 0.9, D / 2 + 0.05 + lockOff * 0.3]} rotation={[lockOff * 2, 0, -lockOff * 4]} scale={lock}>
          <mesh geometry={rbox(0.15, 0.13, 0.06, 0.025)} material={sm("#e3b33b", 0.25, {metalness: 0.6})} castShadow />
          <mesh position={[0, 0.07, 0]} material={sm("#b7bac4", 0.25, {metalness: 0.7})} castShadow>
            <torusGeometry args={[0.05, 0.014, 8, 20, Math.PI]} />
          </mesh>
          <mesh position={[0, -0.01, 0.031]} material={sm(BLACK, 0.5)}>
            <circleGeometry args={[0.016, 12]} />
          </mesh>
          <mesh position={[0, -0.035, 0.031]} material={sm(BLACK, 0.5)}>
            <planeGeometry args={[0.012, 0.03]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- cachorro (sentado, olhando pra +z) ---------- */
export type DogP = {
  pos?: V3;
  rotY?: number;
  legs?: "down" | "shake" | "point" | "hold" | "crossed" | "salute";
  legK?: number;
  glasses?: boolean;
  cap?: boolean;
  headset?: boolean;
  controller?: boolean;
  play?: number; // 0..1 apertando botões
  mouth?: number;
  tongue?: number;
  blink?: number;
  tail?: number; // abanar
  lean?: number;
  head?: V3;
  t?: number;
  walk?: number; // >0: em pé andando (fase da passada = t)
  run?: number; // velocidade da passada (1 andando, 3 correndo)
  bowtie?: boolean;
  pillow?: number; // almofada das alianças nas costas (1 = presa, 0 = sem)
};
const capTex = () => textTex("bone-seguranca", 256, 64, "#1f2a44", [{t: "SEGURANÇA", size: 40, color: "#ffd21f", y: 34}]);
export const Dog: React.FC<{d: DogP; s?: number}> = ({d, s = 1}) => {
  const {pos = [0, 0, 0], rotY = 0, legs = "down", legK = 1, glasses = false, cap = false, headset = false, controller = false, play = 0, mouth = 0, tongue = 0, blink = 0, tail = 1, lean = 0, head = [0, 0, 0], t = 0, walk = 0, run = 1, bowtie = false, pillow = 0} = d;
  const fur = sm("#e0a456", 0.6);
  const cream = sm("#fbe6c4", 0.6);
  const ear = sm("#8a5a2b", 0.6);
  const eye = sm("#0c0c10", 0.12);
  const shine = sm("#ffffff", 0.2);
  const eyeY = Math.max(0.08, 1 - blink);
  const jig = (sd: number) => play * 0.08 * Math.sin(t * 38 + sd * 1.7);
  const legRot = (sd: number): V3 => {
    const k = legK;
    switch (legs) {
      case "shake":
        return sd > 0 ? [-1.25 * k + 0.08 * Math.sin(t * 10) * k, 0, 0.1 * k] : [-0.2, 0, 0];
      case "point":
        return sd > 0 ? [-1.55 * k, 0, 0.55 * k] : [-0.2, 0, 0];
      case "hold":
        return [-1.15 * k + jig(sd), 0, -0.22 * sd * k];
      case "crossed":
        return [-1.15 * k, 0, -0.62 * sd * k];
      case "salute":
        return sd > 0 ? [-2.905 * k, 0, 0.14 * k] : [-0.2, 0, 0];
      default:
        return [-0.2, 0, 0];
    }
  };
  const headAt = (hp: V3) => (
    <>
        <group position={hp} rotation={head}>
          <mesh scale={[1.05, 0.95, 0.95]} material={fur} castShadow>
            <sphereGeometry args={[0.27, 32, 24]} />
          </mesh>
          {/* mancha no olho */}
          <mesh position={[-0.1, 0.07, 0.19]} scale={[0.1, 0.09, 0.06]} material={ear}>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          {/* focinho */}
          <mesh position={[0, -0.08, 0.21]} scale={[0.16, 0.115, 0.13]} material={cream} castShadow>
            <sphereGeometry args={[1, 20, 14]} />
          </mesh>
          <mesh position={[0, -0.03, 0.33]} scale={[0.058, 0.042, 0.04]} material={eye}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
          <mesh position={[0.015, -0.015, 0.36]} scale={0.012} material={shine}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
          {/* boca */}
          {mouth > 0.05 ? (
            <mesh position={[0, -0.15, 0.3]} scale={[0.06, 0.02 + 0.04 * mouth, 0.03]} material={sm("#3a1510", 0.5)}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          ) : (
            <mesh position={[0, -0.135, 0.31]} rotation={[0.2, 0, Math.PI + 0.35 * Math.PI / 2]} material={sm("#3a1510", 0.5)}>
              <torusGeometry args={[0.04, 0.009, 8, 20, Math.PI * 0.65]} />
            </mesh>
          )}
          {tongue > 0.05 && (
            <mesh position={[0.02, -0.18, 0.3]} rotation={[0.4, 0, 0]} scale={[0.04, 0.06 * tongue, 0.02]} material={sm("#e2606e", 0.45)}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          )}
          {/* olhos */}
          {!glasses &&
            [-1, 1].map((sd) => (
              <group key={"e" + sd} position={[0.1 * sd, 0.06, 0.225]} rotation={[0, 0.35 * sd, 0]} scale={[1, eyeY, 1]}>
                <mesh scale={[0.045, 0.055, 0.025]} material={eye}>
                  <sphereGeometry args={[1, 16, 12]} />
                </mesh>
                <mesh position={[0.015, 0.02, 0.02]} scale={0.013} material={shine}>
                  <sphereGeometry args={[1, 8, 6]} />
                </mesh>
              </group>
            ))}
          {/* orelhas caídas */}
          {[-1, 1].map((sd) => (
            <mesh key={"o" + sd} position={[0.26 * sd, -0.03, -0.02]} rotation={[0.1, 0, 0.28 * sd]} scale={[0.075, 0.19, 0.06]} material={ear} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
          ))}
          {/* óculos escuros */}
          {glasses && (
            <group position={[0, 0.06, 0.235]}>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.1 * sd, 0, 0.01]} rotation={[0, 0.3 * sd, 0]} geometry={rbox(0.13, 0.085, 0.025, 0.03)} material={sm("#0a0a0f", 0.08)} />
              ))}
              <mesh position={[0, 0.015, 0.035]} material={sm("#0a0a0f", 0.2)}>
                <boxGeometry args={[0.06, 0.02, 0.015]} />
              </mesh>
            </group>
          )}
          {/* boné de SEGURANÇA */}
          {cap && (
            <group position={[0, 0.12, 0]}>
              <mesh scale={[1.08, 0.72, 1.08]} material={sm("#1f2a44", 0.6)} castShadow>
                <sphereGeometry args={[0.255, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
              </mesh>
              <mesh position={[0, 0.0, 0.28]} rotation={[0.12, 0, 0]} geometry={rbox(0.32, 0.025, 0.2, 0.012)} material={sm("#1f2a44", 0.6)} castShadow />
              <mesh position={[0, 0.1, 0.235]} rotation={[-0.55, 0, 0]} material={texMat("bone-seguranca", capTex(), 0.6)}>
                <planeGeometry args={[0.3, 0.075]} />
              </mesh>
            </group>
          )}
          {/* fone de gamer */}
          {headset && (
            <group>
              <mesh position={[0, 0.02, -0.01]} material={sm(BLACK, 0.4)}>
                <torusGeometry args={[0.3, 0.025, 8, 28, Math.PI]} />
              </mesh>
              {[-1, 1].map((sd) => (
                <group key={"h" + sd} position={[0.3 * sd, 0.0, -0.01]} rotation={[0, 0, Math.PI / 2]}>
                  <mesh material={sm(BLACK, 0.4)}>
                    <cylinderGeometry args={[0.095, 0.095, 0.07, 20]} />
                  </mesh>
                  <mesh position={[0, 0.036 * sd, 0]} material={sm("#2ecc71", 0.3, {emissive: "#2ecc71", emissiveIntensity: 0.6})}>
                    <cylinderGeometry args={[0.06, 0.06, 0.005, 20]} />
                  </mesh>
                </group>
              ))}
              <mesh position={[-0.22, -0.12, 0.17]} rotation={[0.9, 0, -0.5]} material={sm(BLACK, 0.4)}>
                <capsuleGeometry args={[0.012, 0.2, 4, 8]} />
              </mesh>
              <mesh position={[-0.15, -0.17, 0.26]} material={sm(BLACK, 0.4)}>
                <sphereGeometry args={[0.025, 10, 8]} />
              </mesh>
            </group>
          )}
        </group>
      {bowtie && (
        <group position={[hp[0], hp[1] - 0.26, hp[2] + 0.17]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.05 * sd, 0, 0]} rotation={[0, 0, (Math.PI / 2) * sd]} material={sm(BLACK, 0.4)}>
              <coneGeometry args={[0.045, 0.09, 4]} />
            </mesh>
          ))}
          <mesh material={sm(BLACK, 0.4)}>
            <sphereGeometry args={[0.025, 10, 8]} />
          </mesh>
        </group>
      )}
    </>
  );
  if (walk > 0) {
    /* em pé, andando de quatro (olhando pra +z) */
    const ph = t * 9 * run;
    const sw = (k: number) => 0.55 * Math.sin(ph + k) * Math.min(1, walk);
    const bob = 0.03 * Math.abs(Math.sin(ph)) * Math.min(1, walk);
    return (
      <group position={pos} rotation={[0, rotY, 0]} scale={s}>
        <group position={[0, bob, 0]}>
          <mesh position={[0, 0.55, 0]} scale={[0.27, 0.27, 0.42]} material={fur} castShadow receiveShadow>
            <sphereGeometry args={[1, 28, 20]} />
          </mesh>
          <mesh position={[0, 0.47, 0.08]} scale={[0.18, 0.15, 0.3]} material={cream}>
            <sphereGeometry args={[1, 20, 14]} />
          </mesh>
          {(
            [
              [0.15, 0.32, 0, 0],
              [-0.15, 0.32, Math.PI, 0],
              [0.15, -0.3, Math.PI, 1],
              [-0.15, -0.3, 0, 1],
            ] as [number, number, number, number][]
          ).map(([x, z, k, back], i) => (
            <group key={i} position={[x, 0.45, z]} rotation={[sw(k), 0, 0]}>
              <mesh position={[0, -0.2, 0]} material={fur} castShadow>
                <capsuleGeometry args={[back ? 0.075 : 0.065, 0.28, 6, 10]} />
              </mesh>
              <mesh position={[0, -0.42, 0.04]} scale={[1, 0.7, 1.25]} material={cream} castShadow>
                <sphereGeometry args={[0.075, 12, 10]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.72, -0.42]} rotation={[-0.6, 0, 0.5 * tail * Math.sin(t * 16)]} material={fur} castShadow>
            <capsuleGeometry args={[0.04, 0.24, 6, 10]} />
          </mesh>
          <mesh position={[0, 0.74, 0.3]} rotation={[Math.PI / 2 - 0.9, 0, 0]} material={sm("#e8412c", 0.5)}>
            <torusGeometry args={[0.15, 0.028, 8, 24]} />
          </mesh>
          {pillow > 0.01 && (
            <group position={[0, 0.84, -0.02]} scale={pillow}>
              <mesh geometry={rbox(0.36, 0.09, 0.3, 0.04)} material={sm("#fbf6ee", 0.6)} castShadow />
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.06 * sd, 0.065, 0]} rotation={[Math.PI / 2 - 0.5, 0, 0.3 * sd]} material={sm("#ffcc33", 0.2, {metalness: 0.8, emissive: "#5a3a00", emissiveIntensity: 0.5})}>
                  <torusGeometry args={[0.045, 0.012, 8, 20]} />
                </mesh>
              ))}
              <mesh position={[0, -0.02, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#d9c6a0", 0.6)}>
                <torusGeometry args={[0.27, 0.012, 6, 30]} />
              </mesh>
            </group>
          )}
          {headAt([0, 0.9, 0.45])}
        </group>
      </group>
    );
  }
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      <group rotation={[-lean, 0, 0]}>
        {/* corpo sentado */}
        <mesh position={[0, 0.42, -0.02]} rotation={[-0.15, 0, 0]} scale={[0.3, 0.38, 0.28]} material={fur} castShadow receiveShadow>
          <sphereGeometry args={[1, 28, 20]} />
        </mesh>
        <mesh position={[0, 0.42, 0.2]} rotation={[-0.15, 0, 0]} scale={[0.19, 0.27, 0.1]} material={cream}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        {/* coxas e patas de trás */}
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.22 * sd, 0.19, 0.02]} scale={[0.13, 0.16, 0.2]} material={fur} castShadow>
              <sphereGeometry args={[1, 18, 14]} />
            </mesh>
            <mesh position={[0.2 * sd, 0.05, 0.2]} scale={[0.09, 0.055, 0.13]} material={cream} castShadow>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          </group>
        ))}
        {/* rabo */}
        <mesh position={[0, 0.22, -0.3]} rotation={[-0.9, 0, 0.5 * tail * Math.sin(t * 14)]} material={fur} castShadow>
          <capsuleGeometry args={[0.04, 0.24, 6, 10]} />
        </mesh>
        {/* coleira */}
        <mesh position={[0, 0.74, 0.03]} rotation={[Math.PI / 2 - 0.15, 0, 0]} material={sm("#e8412c", 0.5)}>
          <torusGeometry args={[0.16, 0.03, 8, 24]} />
        </mesh>
        <mesh position={[0, 0.69, 0.2]} material={sm("#e3b33b", 0.25, {metalness: 0.6})}>
          <sphereGeometry args={[0.035, 12, 10]} />
        </mesh>
        {/* patas da frente */}
        {[-1, 1].map((sd) => (
          <group key={"f" + sd} position={[0.13 * sd, 0.62, 0.13]} rotation={legRot(sd)}>
            <mesh position={[0, -0.21, 0]} material={fur} castShadow>
              <capsuleGeometry args={[0.068, 0.36, 6, 12]} />
            </mesh>
            <mesh position={[0, -0.47, 0.015]} scale={[1, 0.75, 1.15]} material={cream} castShadow>
              <sphereGeometry args={[0.082, 14, 10]} />
            </mesh>
          </group>
        ))}
        {controller && <Controller p={[0, 0.47, 0.6]} r={[-0.5, 0, 0]} s={1.05} />}
        {headAt([0, 0.98, 0.06])}
      </group>
    </group>
  );
};

/* ---------- sala: sofá, TV, cordão de isolamento e plaquinha ---------- */
export const SOFA_SEAT = 0.46;
export const Sofa: React.FC<{p: V3; rotY?: number; color?: string}> = ({p, rotY = 0, color = "#3cb3a5"}) => {
  const m = sm(color, 0.8);
  const md = sm(new THREE.Color(color).multiplyScalar(0.8).getStyle(), 0.8);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.2, 0]} geometry={rbox(2.3, 0.3, 0.95, 0.08)} material={md} castShadow receiveShadow />
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.39, 0.05]} geometry={rbox(1.08, 0.16, 0.85, 0.07)} material={m} castShadow receiveShadow />
      ))}
      <mesh position={[0, 0.72, -0.38]} rotation={[-0.08, 0, 0]} geometry={rbox(2.3, 0.75, 0.24, 0.1)} material={m} castShadow receiveShadow />
      {[-1, 1].map((sd) => (
        <mesh key={"a" + sd} position={[1.08 * sd, 0.42, 0.0]} geometry={rbox(0.24, 0.62, 0.95, 0.1)} material={m} castShadow receiveShadow />
      ))}
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[1.05 * sx, 0.025, 0.38 * sz]} material={sm("#6b4a2e", 0.6)}>
            <cylinderGeometry args={[0.04, 0.03, 0.05, 10]} />
          </mesh>
        )),
      )}
      {/* almofada */}
      <mesh position={[-0.75, 0.62, -0.18]} rotation={[-0.3, 0.3, 0.15]} geometry={rbox(0.36, 0.34, 0.12, 0.06)} material={sm("#ffd21f", 0.85)} castShadow />
    </group>
  );
};
const telaTex = () =>
  canvasTex("tela-jogo", 512, 300, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 300);
    g.addColorStop(0, "#5ec8ff");
    g.addColorStop(1, "#c8f0ff");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 300);
    c.fillStyle = "#62c84f";
    c.fillRect(0, 190, 512, 110);
    c.fillStyle = "#555b66";
    c.beginPath();
    c.moveTo(200, 300);
    c.lineTo(312, 300);
    c.lineTo(270, 190);
    c.lineTo(242, 190);
    c.fill();
    const blds: [number, number, number, string][] = [[20, 90, 60, "#ff8a5c"], [90, 60, 50, "#ffd21f"], [380, 80, 70, "#c58cff"], [455, 110, 45, "#ff5c8a"]];
    for (const [x, h, w, col] of blds) {
      c.fillStyle = col;
      c.fillRect(x, 190 - h, w, h);
    }
    c.fillStyle = "#e8412c";
    c.fillRect(236, 240, 40, 24);
    c.fillStyle = "#101018";
    c.font = "bold 26px sans-serif";
    c.fillText("PLAYER 1", 16, 32);
    c.fillStyle = "#ffd21f";
    c.fillText("★★★", 400, 32);
  });
export const TV: React.FC<{p: V3; rotY?: number; on?: number}> = ({p, rotY = 0, on = 1}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    {/* rack */}
    <mesh position={[0, 0.25, 0]} geometry={rbox(1.9, 0.5, 0.5, 0.05)} material={sm("#f2f2f2", 0.5)} castShadow receiveShadow />
    <mesh position={[0.45, 0.25, 0.252]} material={sm("#d6d6d6", 0.5)}>
      <planeGeometry args={[0.7, 0.36]} />
    </mesh>
    {/* videogame */}
    <mesh position={[-0.45, 0.56, 0.05]} geometry={rbox(0.5, 0.12, 0.34, 0.04)} material={sm("#20222c", 0.35)} castShadow />
    <mesh position={[-0.45, 0.56, 0.222]} material={sm("#7fd4ff", 0.3, {emissive: "#7fd4ff", emissiveIntensity: 1.5})}>
      <planeGeometry args={[0.3, 0.012]} />
    </mesh>
    {/* TV */}
    <mesh position={[0, 0.54, -0.05]} material={sm(BLACK, 0.4)}>
      <boxGeometry args={[0.3, 0.06, 0.18]} />
    </mesh>
    <mesh position={[0, 0.62, -0.05]} material={sm(BLACK, 0.4)}>
      <boxGeometry args={[0.06, 0.12, 0.05]} />
    </mesh>
    <mesh position={[0, 1.18, -0.05]} geometry={rbox(1.75, 1.02, 0.07, 0.03)} material={sm(BLACK, 0.3)} castShadow />
    <mesh position={[0, 1.18, -0.013]} material={texMat("tela-jogo", telaTex(), 0.3, {emissive: "#ffffff", emissiveMap: telaTex(), emissiveIntensity: 0.9 * on})}>
      <planeGeometry args={[1.65, 0.92]} />
    </mesh>
    {on > 0.01 && <pointLight position={[0, 1.2, 0.6]} intensity={1.6 * on} distance={4} decay={2} color="#bfe6ff" />}
  </group>
);
export const VelvetRope: React.FC<{a: V3; b: V3}> = ({a, b}) => {
  const curve = useMemo(() => new THREE.QuadraticBezierCurve3(new THREE.Vector3(a[0], 0.86, a[2]), new THREE.Vector3((a[0] + b[0]) / 2, 0.55, (a[2] + b[2]) / 2), new THREE.Vector3(b[0], 0.86, b[2])), [a, b]);
  const gold = sm("#e3b33b", 0.25, {metalness: 0.6});
  return (
    <group>
      {[a, b].map((q, i) => (
        <group key={i} position={[q[0], 0, q[2]]}>
          <mesh position={[0, 0.02, 0]} material={gold} castShadow>
            <cylinderGeometry args={[0.16, 0.18, 0.04, 24]} />
          </mesh>
          <mesh position={[0, 0.45, 0]} material={gold} castShadow>
            <cylinderGeometry args={[0.03, 0.035, 0.86, 12]} />
          </mesh>
          <mesh position={[0, 0.9, 0]} material={gold}>
            <sphereGeometry args={[0.055, 14, 10]} />
          </mesh>
        </group>
      ))}
      <mesh material={sm("#b3122d", 0.6)} castShadow>
        <tubeGeometry args={[curve, 24, 0.03, 8, false]} />
      </mesh>
    </group>
  );
};
export const SignPost: React.FC<{p: V3; r?: V3; s?: number; tex: THREE.Texture; texKey: string; w?: number; h?: number; post?: number}> = ({p, r = [0, 0, 0], s = 1, tex, texKey, w = 0.6, h = 0.4, post = 0.5}) => (
  <group position={p} rotation={r} scale={s}>
    {post > 0 && (
      <mesh position={[0, post / 2, -0.02]} material={sm("#8a5a2b", 0.7)} castShadow>
        <boxGeometry args={[0.04, post, 0.03]} />
      </mesh>
    )}
    <mesh position={[0, post + h / 2, 0]} geometry={rbox(w + 0.04, h + 0.04, 0.03, 0.012)} material={sm("#ffffff", 0.5)} castShadow />
    <mesh position={[0, post + h / 2, 0.016]} material={texMat(texKey, tex, 0.6)}>
      <planeGeometry args={[w, h]} />
    </mesh>
  </group>
);
export const proibidoTex = () =>
  canvasTex("proibido-humanos", 480, 320, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 480, 320);
    c.strokeStyle = "#e8262d";
    c.lineWidth = 22;
    c.strokeRect(11, 11, 458, 298);
    c.fillStyle = "#e8262d";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 74px sans-serif";
    c.fillText("PROIBIDO", 240, 110);
    c.fillText("HUMANOS", 240, 210);
  });

/* ---------- quintal, regador, chapéu de palha, árvore de controles ---------- */
export const YardSet: React.FC = () => {
  const r = rng(9);
  const flowers = useMemo(() => Array.from({length: 26}, () => [(r() - 0.5) * 9, 0, -2.6 + r() * 0.8, r()] as [number, number, number, number]), []);
  const wood = sm("#ffffff", 0.6);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
        <planeGeometry args={[120, 120]} />
      </mesh>
      {/* canteiro de terra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]} material={sm("#7a4f2c", 0.95)} receiveShadow>
        <circleGeometry args={[0.75, 32]} />
      </mesh>
      {/* cerca branca */}
      {Array.from({length: 31}, (_, i) => {
        const x = -7.5 + i * 0.5;
        return (
          <group key={i} position={[x, 0, -3.2]}>
            <mesh position={[0, 0.55, 0]} material={wood} castShadow receiveShadow>
              <boxGeometry args={[0.16, 1.1, 0.05]} />
            </mesh>
            <mesh position={[0, 1.13, 0]} rotation={[0, 0, Math.PI / 4]} material={wood}>
              <boxGeometry args={[0.113, 0.113, 0.05]} />
            </mesh>
          </group>
        );
      })}
      {[0.35, 0.85].map((y) => (
        <mesh key={y} position={[0, y, -3.24]} material={wood}>
          <boxGeometry args={[15.5, 0.08, 0.04]} />
        </mesh>
      ))}
      {/* arbustos e flores */}
      {[-4.2, -2.6, 2.9, 4.6].map((x, i) => (
        <mesh key={"b" + i} position={[x, 0.35, -2.75]} scale={[0.7, 0.5, 0.45]} material={sm(i % 2 ? "#4fae3a" : "#5cbf45", 0.8)} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
      ))}
      {flowers.map(([x, , z, k], i) => (
        <group key={"f" + i} position={[x, 0, z]}>
          <mesh position={[0, 0.12, 0]} material={sm("#3f9a35", 0.8)}>
            <cylinderGeometry args={[0.01, 0.01, 0.24, 5]} />
          </mesh>
          <mesh position={[0, 0.25, 0]} material={sm(["#ff5c8a", "#ffd21f", "#ffffff", "#c58cff"][Math.floor(k * 4)], 0.6)}>
            <sphereGeometry args={[0.05, 10, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
export const StrawHat: React.FC = () => (
  <group position={[0, 0.2, 0]}>
    <mesh material={sm("#e9c46a", 0.85)} castShadow>
      <cylinderGeometry args={[0.54, 0.56, 0.025, 36]} />
    </mesh>
    <mesh position={[0, 0.095, 0]} material={sm("#e9c46a", 0.85)} castShadow>
      <cylinderGeometry args={[0.3, 0.33, 0.18, 30]} />
    </mesh>
    <mesh position={[0, 0.185, 0]} scale={[1, 0.45, 1]} material={sm("#e9c46a", 0.85)}>
      <sphereGeometry args={[0.3, 24, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh position={[0, 0.04, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e8412c", 0.6)}>
      <torusGeometry args={[0.325, 0.028, 8, 30]} />
    </mesh>
  </group>
);
/** regador: bico aponta pra +x local; a água sai em SPOUT */
export const SPOUT: V3 = [0.42, 0.33, 0];
export const WateringCan: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const m = sm("#2ecc71", 0.4);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.15, 0]} material={m} castShadow>
        <cylinderGeometry args={[0.13, 0.15, 0.3, 24]} />
      </mesh>
      <mesh position={[0.2, 0.2, 0]} rotation={[0, 0, -0.9]} material={m} castShadow>
        <cylinderGeometry args={[0.025, 0.04, 0.36, 12]} />
      </mesh>
      <mesh position={[0.37, 0.31, 0]} rotation={[0, 0, -0.9]} material={sm("#27ae60", 0.4)}>
        <cylinderGeometry args={[0.055, 0.03, 0.06, 14]} />
      </mesh>
      <mesh position={[-0.02, 0.32, 0]} rotation={[0, 0, 0]} material={m}>
        <torusGeometry args={[0.11, 0.022, 8, 20, Math.PI]} />
      </mesh>
    </group>
  );
};
export const WaterDrops: React.FC<{p: V3; k: number; t: number}> = ({p, k, t}) => {
  if (k < 0.01) return null;
  const m = sm("#6cc8f2", 0.15, {transparent: true, opacity: 0.85});
  return (
    <group position={p}>
      {Array.from({length: 12}, (_, i) => {
        const ph = (t * 1.6 + i / 12) % 1;
        return (
          <mesh key={i} position={[0.05 * Math.sin(i * 2.3) + ph * 0.12, -ph * 0.9, 0.05 * Math.cos(i * 1.7)]} scale={[1, 1.8, 1]} material={m}>
            <sphereGeometry args={[0.022 * k, 8, 6]} />
          </mesh>
        );
      })}
    </group>
  );
};
export const Seed: React.FC<{p: V3}> = ({p}) => (
  <mesh position={p} scale={[0.05, 0.035, 0.035]} material={sm("#6b3f1d", 0.6)}>
    <sphereGeometry args={[1, 12, 8]} />
  </mesh>
);
/** posições (no espaço da árvore, tamanho final) onde os controles nascem */
export const TREE_FRUIT: V3[] = [
  [0.75, 1.62, 0.3],
  [-0.7, 1.68, 0.38],
  [0.05, 1.55, 0.72],
  [0.45, 1.95, 0.65],
  [-0.35, 2.0, 0.66],
  [0.9, 2.05, -0.1],
  [-0.9, 2.0, -0.05],
];
export const ControllerTree: React.FC<{p: V3; g: number; fruit?: number[]; hide?: number; t?: number; rotY?: number}> = ({p, g, fruit = [], hide = -1, t = 0, rotY = 0}) => {
  const trunk = sm("#8a5a2b", 0.8);
  const leaf = sm("#4cb33f", 0.75);
  const leaf2 = sm("#5fc94e", 0.75);
  const sway = 0.03 * Math.sin(t * 1.3);
  if (g < 0.005) return null;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={g}>
      <mesh position={[0, 0.8, 0]} material={trunk} castShadow>
        <cylinderGeometry args={[0.11, 0.19, 1.6, 14]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.22 * sd, 1.5, 0]} rotation={[0, 0, -0.7 * sd]} material={trunk} castShadow>
          <cylinderGeometry args={[0.05, 0.08, 0.6, 10]} />
        </mesh>
      ))}
      <group rotation={[0, 0, sway]}>
        {(
          [
            [0, 2.3, 0, 0.78, 0],
            [0.62, 2.05, 0.1, 0.6, 1],
            [-0.62, 2.08, 0.05, 0.6, 1],
            [0.2, 2.65, -0.15, 0.55, 1],
            [-0.25, 2.1, 0.45, 0.55, 0],
            [0.3, 2.0, 0.45, 0.5, 1],
            [0, 2.0, -0.5, 0.6, 0],
          ] as [number, number, number, number, number][]
        ).map(([x, y, z, r, k], i) => (
          <mesh key={i} position={[x, y, z]} material={k ? leaf2 : leaf} castShadow receiveShadow>
            <sphereGeometry args={[r, 22, 16]} />
          </mesh>
        ))}
        {TREE_FRUIT.map((q, i) => {
          const k = fruit[i] ?? 0;
          if (k < 0.01 || i === hide) return null;
          return (
            <group key={"c" + i} position={q} scale={k}>
              <mesh position={[0, 0.09, 0]} material={sm("#3f9a35", 0.8)}>
                <cylinderGeometry args={[0.012, 0.012, 0.16, 6]} />
              </mesh>
              <Controller p={[0, -0.03, 0]} r={[Math.PI / 2 - 0.3, Math.atan2(q[0], q[2]), 0]} s={1.25} color={["#2b2e3b", "#f2f2f2", "#e8412c", "#3a86ff"][i % 4]} />
            </group>
          );
        })}
      </group>
    </group>
  );
};
/** estrelinhas girando em volta da cabeça (tontura) */
export const DizzyStars: React.FC<{p: V3; k: number; t: number}> = ({p, k, t}) => {
  if (k < 0.01) return null;
  return (
    <group position={p} scale={k}>
      {[0, 1, 2, 3].map((i) => {
        const a = t * 5 + (i * Math.PI) / 2;
        return (
          <mesh key={i} position={[0.32 * Math.cos(a), 0.04 * Math.sin(a * 2), 0.32 * Math.sin(a)]} rotation={[0, a, 0]} material={sm("#ffd21f", 0.3, {emissive: "#ffd21f", emissiveIntensity: 0.8})}>
            <octahedronGeometry args={[0.055, 0]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- Lua ---------- */
const moonTex = () =>
  canvasTex("chao-lua", 512, 512, (c, r) => {
    c.fillStyle = "#a6a6ae";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 900; i++) {
      const v = 140 + Math.floor(r() * 50);
      c.fillStyle = `rgba(${v},${v},${v + 6},0.5)`;
      c.beginPath();
      c.arc(r() * 512, r() * 512, 2 + r() * 10, 0, Math.PI * 2);
      c.fill();
    }
  }, [16, 16]);
export const MOON_CRATERS: [number, number, number][] = [
  [-2.6, -2.2, 1.1],
  [2.8, -3.5, 1.5],
  [-5, -7, 2.2],
  [5.5, -9, 2.6],
  [0.6, -8, 1.6],
  [-1.2, 2.6, 0.7],
];
export const Crater: React.FC<{p: V3; r: number}> = ({p, r}) => (
  <group position={p}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, 0]} material={sm("#7d7d86", 0.95)} receiveShadow>
      <circleGeometry args={[r, 36]} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.75]} material={sm("#b4b4bc", 0.95)} castShadow receiveShadow>
      <torusGeometry args={[r, r * 0.2, 10, 40]} />
    </mesh>
  </group>
);
export const MoonSet: React.FC<{t: number}> = ({t}) => {
  const stars = useMemo(() => {
    const r = rng(41);
    return Array.from({length: 220}, () => {
      const th = r() * Math.PI * 2;
      const ph = 0.08 + r() * 1.3;
      return [Math.cos(th) * Math.cos(ph) * 90, Math.sin(ph) * 90, Math.sin(th) * Math.cos(ph) * 90] as V3;
    });
  }, []);
  const rocks = useMemo(() => {
    const r = rng(7);
    return Array.from({length: 18}, () => [(r() - 0.5) * 16, 0, -1 - r() * 14, 0.08 + r() * 0.22, r() * 6] as [number, number, number, number, number]);
  }, []);
  return (
    <group>
      <color attach="background" args={["#05060f"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={texMat("chao-lua", moonTex(), 0.95)} receiveShadow>
        <planeGeometry args={[200, 200]} />
      </mesh>
      {MOON_CRATERS.map(([x, z, r], i) => (
        <Crater key={i} p={[x, 0, z]} r={r} />
      ))}
      {rocks.map(([x, , z, s, a], i) => (
        <mesh key={"r" + i} position={[x, s * 0.4, z]} rotation={[a, a * 2, 0]} scale={s} material={sm("#8e8e97", 0.9)} castShadow>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
      {stars.map((p, i) => (
        <mesh key={"s" + i} position={p}>
          <sphereGeometry args={[0.12 + (i % 3) * 0.08, 6, 4]} />
          <meshBasicMaterial color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
      {/* a Terra no céu */}
      <group position={[-16, 17, -60]} rotation={[0.3, t * 0.05, 0.2]}>
        <mesh material={sm("#2f8fe0", 0.5, {emissive: "#123a66", emissiveIntensity: 0.6})}>
          <sphereGeometry args={[7, 40, 30]} />
        </mesh>
        {[[0.3, 0.2, 0], [-0.4, -0.3, 0.6], [0.1, -0.6, -0.3], [0.7, 0.1, 1.9]].map(([a, b, c], i) => {
          const v = new THREE.Vector3(Math.cos(a) * Math.cos(b + c), Math.sin(a), Math.cos(a) * Math.sin(b + c)).normalize().multiplyScalar(6.75);
          return (
            <mesh key={i} position={[v.x, v.y, v.z]} scale={[2.6, 2.0, 2.6]} material={sm("#5cbf4a", 0.6, {emissive: "#1e4a18", emissiveIntensity: 0.5})}>
              <sphereGeometry args={[1, 20, 14]} />
            </mesh>
          );
        })}
      </group>
    </group>
  );
};
/** foguetinho de desenho */
export const Rocket: React.FC<{p: V3; s?: number; flame?: number; t?: number; rotY?: number}> = ({p, s = 1, flame = 0, t = 0, rotY = 0}) => {
  const white = sm("#f6f6f2", 0.4);
  const red = sm("#e8412c", 0.4);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 1.45, 0]} material={white} castShadow receiveShadow>
        <cylinderGeometry args={[0.42, 0.46, 1.5, 32]} />
      </mesh>
      <mesh position={[0, 2.62, 0]} material={red} castShadow>
        <coneGeometry args={[0.42, 0.85, 32]} />
      </mesh>
      <mesh position={[0, 0.62, 0]} material={sm("#3a3d48", 0.4)} castShadow>
        <cylinderGeometry args={[0.3, 0.36, 0.2, 24]} />
      </mesh>
      <mesh position={[0, 0.7, 0]} material={red}>
        <cylinderGeometry args={[0.47, 0.47, 0.12, 32]} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0, 0.55, 0.55]} rotation={[0.35, 0, 0]} geometry={rbox(0.07, 1.0, 0.42, 0.03)} material={red} castShadow />
          </group>
        );
      })}
      <group position={[0, 1.75, 0.43]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#e3b33b", 0.3, {metalness: 0.5})}>
          <torusGeometry args={[0.17, 0.035, 10, 28]} />
        </mesh>
        <mesh position={[0, 0, -0.01]} rotation={[Math.PI / 2, 0, 0]} material={sm("#7fd4ff", 0.1, {emissive: "#3a86ff", emissiveIntensity: 0.4})}>
          <cylinderGeometry args={[0.16, 0.16, 0.04, 24]} />
        </mesh>
      </group>
      {flame > 0.01 && (
        <group position={[0, 0.48, 0]} scale={[flame, flame * (1 + 0.15 * Math.sin(t * 60)), flame]}>
          <mesh position={[0, -0.45, 0]} rotation={[Math.PI, 0, 0]} material={sm("#ffb020", 0.4, {emissive: "#ff8a00", emissiveIntensity: 2.2, transparent: true, opacity: 0.9})}>
            <coneGeometry args={[0.28, 0.9, 20]} />
          </mesh>
          <mesh position={[0, -0.32, 0]} rotation={[Math.PI, 0, 0]} material={sm("#fff3b0", 0.4, {emissive: "#fff3b0", emissiveIntensity: 2.5})}>
            <coneGeometry args={[0.15, 0.55, 16]} />
          </mesh>
          <pointLight position={[0, -0.6, 0]} intensity={6} distance={6} decay={2} color="#ffb040" />
        </group>
      )}
    </group>
  );
};
/** nuvem de poeira (pouso) */
export const Dust: React.FC<{p: V3; k: number}> = ({p, k}) => {
  if (k <= 0 || k >= 1) return null;
  const m = sm("#c9c9d1", 0.9, {transparent: true, opacity: 0.8 * (1 - k)});
  return (
    <group position={p}>
      {Array.from({length: 10}, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        const r = 0.4 + 1.6 * k;
        return (
          <mesh key={i} position={[Math.cos(a) * r, 0.15 + 0.25 * k, Math.sin(a) * r]} material={m}>
            <sphereGeometry args={[0.18 + 0.3 * k, 12, 8]} />
          </mesh>
        );
      })}
    </group>
  );
};
const listraTex = () =>
  canvasTex("lona-listrada", 128, 128, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? "#ffffff" : "#ff7a3d";
      c.fillRect(i * 16, 0, 16, 128);
    }
  });
/** cadeira de praia: assento a 0,3 do chão, encosto reclinado pra trás (-z) */
export const BEACH_SEAT = 0.3;
export const BeachChair: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => {
  const frame = sm("#e3e3e8", 0.3, {metalness: 0.4});
  const cloth = texMat("lona-listrada", listraTex(), 0.8, {side: THREE.DoubleSide});
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, BEACH_SEAT - 0.02, 0.05]} rotation={[-Math.PI / 2 + 0.08, 0, 0]} material={cloth} castShadow receiveShadow>
        <planeGeometry args={[0.62, 0.62]} />
      </mesh>
      <group position={[0, BEACH_SEAT - 0.02, -0.26]} rotation={[-0.55, 0, 0]}>
        <mesh position={[0, 0.4, 0]} material={cloth} castShadow receiveShadow>
          <planeGeometry args={[0.62, 0.8]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.32 * sd, 0.4, 0]} material={frame}>
            <cylinderGeometry args={[0.018, 0.018, 0.82, 8]} />
          </mesh>
        ))}
      </group>
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[0.32 * sd, BEACH_SEAT - 0.02, 0.05]} rotation={[Math.PI / 2 - 0.08, 0, 0]} material={frame}>
            <cylinderGeometry args={[0.018, 0.018, 0.66, 8]} />
          </mesh>
          <mesh position={[0.32 * sd, BEACH_SEAT / 2, 0.3]} material={frame}>
            <cylinderGeometry args={[0.018, 0.018, BEACH_SEAT, 8]} />
          </mesh>
          <mesh position={[0.32 * sd, BEACH_SEAT / 2, -0.24]} material={frame}>
            <cylinderGeometry args={[0.018, 0.018, BEACH_SEAT, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
/** capacete de astronauta (no espaço da cabeça do boneco) */
export const Helmet: React.FC = () => (
  <group>
    <mesh position={[0, 0.02, 0]} material={sm("#cfefff", 0.05, {transparent: true, opacity: 0.22, depthWrite: false})}>
      <sphereGeometry args={[0.5, 36, 26]} />
    </mesh>
    <mesh position={[0.18, 0.22, 0.38]} scale={[0.08, 0.13, 0.03]} rotation={[0, 0.4, 0.5]} material={sm("#ffffff", 0.1, {transparent: true, opacity: 0.5, depthWrite: false})}>
      <sphereGeometry args={[1, 12, 10]} />
    </mesh>
    <mesh position={[0, -0.4, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e3e3e8", 0.35, {metalness: 0.4})} castShadow>
      <torusGeometry args={[0.3, 0.07, 12, 32]} />
    </mesh>
  </group>
);
/** sinal de wi-fi gigante */
export const Wifi: React.FC<{p: V3; s?: number; k: number; t: number}> = ({p, s = 1, k, t}) => {
  if (k < 0.01) return null;
  const m = (i: number) => sm("#7fd4ff", 0.3, {emissive: "#7fd4ff", emissiveIntensity: 1.3 + 0.8 * Math.max(0, Math.sin(t * 6 - i))});
  return (
    <group position={p} scale={s * k}>
      {[0.35, 0.65, 0.95].map((r, i) => (
        <mesh key={i} rotation={[0, 0, Math.PI / 4]} material={m(i)}>
          <torusGeometry args={[r, 0.08, 10, 30, Math.PI / 2]} />
        </mesh>
      ))}
      <mesh position={[0, 0.0, 0]} material={m(-1)}>
        <sphereGeometry args={[0.13, 16, 12]} />
      </mesh>
    </group>
  );
};
const tomadaTex = () =>
  canvasTex("sem-tomada", 480, 320, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 480, 320);
    c.strokeStyle = "#e8262d";
    c.lineWidth = 20;
    c.strokeRect(10, 10, 460, 300);
    // tomada
    c.fillStyle = "#e9e9ee";
    c.strokeStyle = "#101018";
    c.lineWidth = 8;
    c.beginPath();
    c.roundRect(170, 40, 140, 150, 26);
    c.fill();
    c.stroke();
    c.fillStyle = "#101018";
    c.beginPath();
    c.arc(215, 115, 14, 0, Math.PI * 2);
    c.arc(265, 115, 14, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e8262d";
    c.lineWidth = 18;
    c.beginPath();
    c.moveTo(160, 30);
    c.lineTo(320, 200);
    c.stroke();
    c.fillStyle = "#e8262d";
    c.font = "bold 62px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("SEM TOMADA", 240, 260);
  });
export const semTomadaTex = tomadaTex;
/** alienígena verde (olha pra +z) com controles nas mãos */
export type AlienP = {pos?: V3; rotY?: number; offer?: number; blink?: number; mouth?: number; wave?: number; t?: number};
export const Alien: React.FC<{a: AlienP; s?: number}> = ({a, s = 1}) => {
  const {pos = [0, 0, 0], rotY = 0, offer = 0, blink = 0, mouth = 0, t = 0} = a;
  const g = sm("#7ed957", 0.45);
  const gd = sm("#5fbf3f", 0.45);
  const eye = sm("#0c0c10", 0.08);
  const shine = sm("#ffffff", 0.2);
  const eyeY = Math.max(0.08, 1 - blink);
  const arm = (sd: number) => {
    const out = sd > 0 ? offer : 0;
    const rot: V3 = [-0.9 - 0.55 * out, 0, sd * (0.35 - 0.25 * out)];
    return (
      <group key={sd} position={[0.21 * sd, 0.66, 0.02]} rotation={rot}>
        <mesh position={[0, -0.16, 0]} material={g} castShadow>
          <capsuleGeometry args={[0.055, 0.26, 6, 10]} />
        </mesh>
        <mesh position={[0, -0.33, 0]} material={g}>
          <sphereGeometry args={[0.07, 12, 10]} />
        </mesh>
        <Controller p={[0, -0.36, 0.05]} r={[-Math.PI / 2 + 0.9 + 0.55 * out, 0, 0]} s={1.1} color={sd > 0 ? "#f2f2f2" : "#2b2e3b"} />
      </group>
    );
  };
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      {/* pernas */}
      {[-1, 1].map((sd) => (
        <mesh key={"l" + sd} position={[0.1 * sd, 0.16, 0]} material={gd} castShadow>
          <capsuleGeometry args={[0.065, 0.2, 6, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, 0]} scale={[1, 1.05, 0.9]} material={g} castShadow>
        <capsuleGeometry args={[0.2, 0.28, 8, 16]} />
      </mesh>
      {arm(-1)}
      {arm(1)}
      {/* cabeça */}
      <group position={[0, 1.08, 0]} rotation={[0, 0, 0.06 * Math.sin(t * 3)]}>
        <mesh scale={[1.12, 0.95, 1]} material={g} castShadow>
          <sphereGeometry args={[0.34, 32, 24]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={"e" + sd} position={[0.14 * sd, 0.03, 0.29]} rotation={[0, 0.4 * sd, -0.35 * sd]} scale={[1, eyeY, 1]}>
            <mesh scale={[0.1, 0.13, 0.04]} material={eye}>
              <sphereGeometry args={[1, 18, 14]} />
            </mesh>
            <mesh position={[0.03, 0.05, 0.035]} scale={0.022} material={shine}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        ))}
        {mouth > 0.05 ? (
          <mesh position={[0, -0.16, 0.29]} scale={[0.07, 0.02 + 0.05 * mouth, 0.03]} material={sm("#2a0f12", 0.5)}>
            <sphereGeometry args={[1, 14, 10]} />
          </mesh>
        ) : (
          <mesh position={[0, -0.14, 0.305]} rotation={[0.2, 0, Math.PI + 0.35 * Math.PI / 2]} material={sm("#2a0f12", 0.5)}>
            <torusGeometry args={[0.07, 0.012, 8, 20, Math.PI * 0.65]} />
          </mesh>
        )}
        {[-1, 1].map((sd) => (
          <group key={"a" + sd} position={[0.12 * sd, 0.28, 0]} rotation={[0, 0, -0.35 * sd + 0.08 * Math.sin(t * 5 + sd)]}>
            <mesh position={[0, 0.15, 0]} material={gd}>
              <cylinderGeometry args={[0.014, 0.014, 0.3, 8]} />
            </mesh>
            <mesh position={[0, 0.32, 0]} material={sm("#ff5c8a", 0.3, {emissive: "#ff5c8a", emissiveIntensity: 0.9})}>
              <sphereGeometry args={[0.05, 14, 10]} />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
};

/* ---------- loja de games + cadeira de camping + barba + passarinho + calendário ---------- */
const lojaPlacaTex = () =>
  canvasTex("placa-games", 1024, 200, (c) => {
    const g = c.createLinearGradient(0, 0, 1024, 0);
    g.addColorStop(0, "#5b2be0");
    g.addColorStop(1, "#2b7be0");
    c.fillStyle = g;
    c.fillRect(0, 0, 1024, 200);
    c.strokeStyle = "#ffd21f";
    c.lineWidth = 14;
    c.strokeRect(7, 7, 1010, 186);
    c.fillStyle = "#ffffff";
    c.font = "bold 132px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.shadowColor = "#00e5ff";
    c.shadowBlur = 24;
    c.fillText("GAMES", 512, 108);
  });
const posterTex = () =>
  canvasTex("poster-6", 512, 640, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 640);
    g.addColorStop(0, "#0b1340");
    g.addColorStop(1, "#22094a");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 640);
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.font = "bold 430px sans-serif";
    c.shadowColor = "#00e5ff";
    c.shadowBlur = 40;
    c.lineWidth = 22;
    c.strokeStyle = "#00c8ff";
    c.strokeText("6", 256, 300);
    c.shadowBlur = 0;
    c.fillStyle = "#e6fdff";
    c.fillText("6", 256, 300);
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 540, 512, 100);
    c.fillStyle = "#101018";
    c.font = "bold 70px sans-serif";
    c.fillText("EM BREVE", 256, 592);
  });
const fechadoTex = () => textTex("fechado", 256, 110, "#ffffff", [{t: "FECHADO", size: 54, color: "#e8262d", y: 58}], "#e8262d");
/** fachada virada pra +z; a frente fica em z=0 */
export const GameStore: React.FC<{p: V3}> = ({p}) => {
  const wall = sm("#8a7cf0", 0.8);
  const trim = sm("#ffffff", 0.5);
  return (
    <group position={p}>
      {/* prédio */}
      <mesh position={[0, 1.75, -0.75]} geometry={rbox(4.6, 3.5, 1.5, 0.06)} material={wall} castShadow receiveShadow />
      <mesh position={[0, 3.55, -0.75]} geometry={rbox(4.8, 0.14, 1.7, 0.04)} material={trim} />
      {/* vitrine */}
      <group position={[-0.85, 1.35, 0.005]}>
        <mesh geometry={rbox(2.3, 1.75, 0.08, 0.03)} material={trim} />
        <mesh position={[0, 0, 0.03]} material={sm("#1d1d33", 0.6)}>
          <planeGeometry args={[2.1, 1.55]} />
        </mesh>
        <mesh position={[-0.35, 0.02, 0.04]} material={texMat("poster-6", posterTex(), 0.4, {emissive: "#ffffff", emissiveMap: posterTex(), emissiveIntensity: 0.55})}>
          <planeGeometry args={[1.0, 1.25]} />
        </mesh>
        {[0.55, 0.85].map((x, i) => (
          <GameBox key={i} p={[x, -0.42 + i * 0.05, 0.12]} r={[0, -0.25, 0]} s={0.75} />
        ))}
        <mesh position={[0, 0, 0.07]} material={sm("#cfefff", 0.05, {transparent: true, opacity: 0.18, depthWrite: false})}>
          <planeGeometry args={[2.1, 1.55]} />
        </mesh>
      </group>
      {/* porta */}
      <group position={[1.35, 0, 0.005]}>
        <mesh position={[0, 1.15, 0]} geometry={rbox(1.15, 2.3, 0.08, 0.03)} material={trim} />
        <mesh position={[0, 1.12, 0.04]} geometry={rbox(1.0, 2.2, 0.04, 0.02)} material={sm("#2b3a7a", 0.5)} />
        <mesh position={[0, 1.45, 0.065]} material={sm("#9fd8ff", 0.1, {emissive: "#5a7aa8", emissiveIntensity: 0.3})}>
          <planeGeometry args={[0.7, 0.9]} />
        </mesh>
        <mesh position={[0.36, 1.05, 0.08]} material={sm("#e3b33b", 0.3, {metalness: 0.5})}>
          <boxGeometry args={[0.05, 0.3, 0.05]} />
        </mesh>
        <group position={[0, 1.52, 0.1]} rotation={[0, 0, 0.04]}>
          <mesh position={[0, 0.17, -0.01]} rotation={[0, 0, Math.PI / 4]} material={sm("#8c8f99", 0.4)}>
            <torusGeometry args={[0.1, 0.006, 6, 16, Math.PI / 2]} />
          </mesh>
          <mesh material={texMat("fechado", fechadoTex(), 0.6)}>
            <planeGeometry args={[0.46, 0.2]} />
          </mesh>
        </group>
      </group>
      {/* placa */}
      <mesh position={[0, 2.85, 0.05]} geometry={rbox(4.0, 0.8, 0.12, 0.04)} material={trim} castShadow />
      <mesh position={[0, 2.85, 0.115]} material={texMat("placa-games", lojaPlacaTex(), 0.4, {emissive: "#ffffff", emissiveMap: lojaPlacaTex(), emissiveIntensity: 0.5})}>
        <planeGeometry args={[3.85, 0.7]} />
      </mesh>
      {/* rodapé */}
      <mesh position={[0, 0.12, 0.01]} geometry={rbox(4.6, 0.24, 0.1, 0.03)} material={sm("#5b4bd0", 0.7)} />
    </group>
  );
};
/** cadeira de camping baixinha: assento a 0,3 do chão (o menino senta com os pés no chão) */
export const CAMP_SEAT = 0.3;
export const CampChair: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => {
  const cloth = sm("#2e8b57", 0.8);
  const frame = sm("#2b2e3b", 0.4, {metalness: 0.3});
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, CAMP_SEAT - 0.03, 0.02]} geometry={rbox(0.62, 0.05, 0.56, 0.02)} material={cloth} castShadow receiveShadow />
      <mesh position={[0, CAMP_SEAT + 0.33, -0.27]} rotation={[-0.12, 0, 0]} geometry={rbox(0.62, 0.66, 0.05, 0.02)} material={cloth} castShadow receiveShadow />
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[0.33 * sd, CAMP_SEAT / 2, 0.02]} rotation={[0.6, 0, 0]} material={frame}>
            <cylinderGeometry args={[0.018, 0.018, CAMP_SEAT / Math.cos(0.6), 8]} />
          </mesh>
          <mesh position={[0.33 * sd, CAMP_SEAT / 2, 0.02]} rotation={[-0.6, 0, 0]} material={frame}>
            <cylinderGeometry args={[0.018, 0.018, CAMP_SEAT / Math.cos(0.6), 8]} />
          </mesh>
          <mesh position={[0.34 * sd, CAMP_SEAT + 0.2, 0.0]} geometry={rbox(0.06, 0.04, 0.5, 0.015)} material={frame} />
          <mesh position={[0.34 * sd, CAMP_SEAT + 0.1, 0.22]} material={frame}>
            <cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />
          </mesh>
          <mesh position={[0.33 * sd, CAMP_SEAT + 0.33, -0.29]} rotation={[-0.12, 0, 0]} material={frame}>
            <cylinderGeometry args={[0.018, 0.018, 0.7, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
/** barba gigante (no espaço da cabeça do boneco sentado); g 0..1 */
const BEARD_PATH: [number, number, number, number][] = [
  // x, y, z (cabeça), raio
  [0, -0.21, 0.24, 0.17],
  [0, -0.33, 0.3, 0.2],
  [0, -0.48, 0.38, 0.21],
  [0, -0.64, 0.46, 0.21],
  [0, -0.8, 0.56, 0.2],
  [0, -0.95, 0.66, 0.19],
  [0, -1.1, 0.74, 0.18],
  [0, -1.26, 0.8, 0.17],
  [0, -1.42, 0.84, 0.17],
  [0, -1.56, 0.9, 0.17],
];
const beardGeo = (g: number) => {
  const curve = new THREE.CatmullRomCurve3(BEARD_PATH.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const N = 40;
  const M = 28;
  const n = Math.max(2, Math.round(N * g));
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const rAt = (u: number) => {
    const q = u * (BEARD_PATH.length - 1);
    const i = Math.min(BEARD_PATH.length - 2, Math.floor(q));
    return lerp(BEARD_PATH[i][3], BEARD_PATH[i + 1][3], q - i);
  };
  for (let i = 0; i <= n; i++) {
    const u = (i / N) * 1;
    const c = curve.getPoint(Math.min(1, u));
    const tip = clamp((n - i) / 3); // ponta arredondada
    const r = rAt(Math.min(1, u)) * (0.35 + 0.65 * Math.sqrt(tip)) * (i === 0 ? 0.6 : 1);
    for (let j = 0; j < M; j++) {
      const th = (j / M) * Math.PI * 2;
      const wav = 1 + 0.07 * Math.sin(th * 7 + i * 0.9);
      pos.push(c.x + Math.cos(th) * r * 1.12 * wav, c.y + 0.02 * Math.sin(th * 5 + i), c.z + Math.sin(th) * r * 0.62 * wav);
      uv.push(j / M, u * 3);
    }
  }
  for (let i = 0; i < n; i++)
    for (let j = 0; j < M; j++) {
      const a = i * M + j;
      const b = i * M + ((j + 1) % M);
      const c = (i + 1) * M + j;
      const d = (i + 1) * M + ((j + 1) % M);
      idx.push(a, c, b, b, c, d);
    }
  // tampa de baixo
  const end = curve.getPoint(Math.min(1, n / N));
  const ci = pos.length / 3;
  pos.push(end.x, end.y - 0.03, end.z);
  uv.push(0.5, (n / N) * 3);
  for (let j = 0; j < M; j++) idx.push(n * M + j, ci, n * M + ((j + 1) % M));
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
};
const fiosTex = () =>
  canvasTex("fios-barba", 256, 256, (c, r) => {
    c.fillStyle = "#f3f3f0";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 70; i++) {
      const x = r() * 256;
      const v = 200 + Math.floor(r() * 30);
      c.strokeStyle = `rgb(${v},${v},${v - 4})`;
      c.lineWidth = 2 + r() * 3;
      c.beginPath();
      c.moveTo(x, 0);
      c.bezierCurveTo(x + 10, 85, x - 10, 170, x + 4, 256);
      c.stroke();
    }
  }, [6, 1]);
export const Beard: React.FC<{g: number; t?: number}> = ({g, t = 0}) => {
  const m = texMat("fios-barba", fiosTex(), 0.85);
  const gq = Math.round(clamp(g) * 60) / 60;
  const geo = useMemo(() => (gq > 0.01 ? beardGeo(gq) : null), [gq]);
  if (g < 0.01 || !geo) return null;
  return (
    <group rotation={[0, 0, 0.015 * Math.sin(t * 2)]}>
      {/* bigode */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.07 * sd, -0.11, 0.285]} rotation={[0, 0, sd * 0.35]} scale={[0.085 * Math.min(1, g * 3), 0.035 * Math.min(1, g * 3), 0.04]} material={m}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
      ))}
      <mesh geometry={geo} material={m} castShadow />
      {/* sobra no chão */}
      {g > 0.92 && (
        <mesh position={[0, -1.66, 1.1]} scale={[0.34 * clamp((g - 0.92) / 0.08), 0.06, 0.32 * clamp((g - 0.92) / 0.08)]} material={m} castShadow>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
      )}
    </group>
  );
};
/** ninho + passarinho em cima da cabeça (espaço da cabeça) */
export const Nest: React.FC<{k: number; bird: number; t: number}> = ({k, bird, t}) => {
  if (k < 0.01) return null;
  const straw = sm("#a0743c", 0.9);
  const flap = bird < 1 ? Math.sin(t * 40) : 0.15 * Math.sin(t * 4);
  return (
    <group position={[0, 0.34, -0.02]} scale={k}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.7]} material={straw} castShadow>
        <torusGeometry args={[0.15, 0.06, 8, 20]} />
      </mesh>
      <mesh position={[0, -0.02, 0]} scale={[0.15, 0.04, 0.15]} material={straw}>
        <sphereGeometry args={[1, 14, 8]} />
      </mesh>
      {bird > 0.01 && (
        <group position={[0, 0.08 + (1 - bird) * 0.9, (1 - bird) * 0.3]} rotation={[0, 0.5, 0]}>
          <mesh scale={[0.09, 0.08, 0.11]} material={sm("#4aa3ff", 0.5)} castShadow>
            <sphereGeometry args={[1, 16, 12]} />
          </mesh>
          <mesh position={[0, 0.09, 0.06]} material={sm("#4aa3ff", 0.5)}>
            <sphereGeometry args={[0.065, 14, 10]} />
          </mesh>
          <mesh position={[0, 0.085, 0.13]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ffb020", 0.4)}>
            <coneGeometry args={[0.022, 0.06, 8]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.03 * sd, 0.11, 0.11]} material={sm("#0c0c10", 0.1)}>
              <sphereGeometry args={[0.012, 8, 6]} />
            </mesh>
          ))}
          {[-1, 1].map((sd) => (
            <mesh key={"w" + sd} position={[0.085 * sd, 0.02, -0.01]} rotation={[0, 0, sd * (0.3 + 0.9 * flap)]} scale={[0.02, 0.06, 0.08]} material={sm("#2f7fd0", 0.5)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
/** teia de aranha (plano com transparência) */
const teiaTex = () =>
  canvasTex("teia", 256, 256, (c) => {
    c.clearRect(0, 0, 256, 256);
    c.strokeStyle = "rgba(255,255,255,0.95)";
    c.lineWidth = 2.2;
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 0.5;
      c.beginPath();
      c.moveTo(0, 0);
      c.lineTo(Math.cos(a) * 256, Math.sin(a) * 256);
      c.stroke();
    }
    for (let r = 30; r < 256; r += 34) {
      c.beginPath();
      for (let i = 0; i <= 8; i++) {
        const a = (i / 8) * Math.PI * 0.5;
        const rr = r * (0.92 + 0.08 * Math.cos(i * 1.7));
        if (i === 0) c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
        else c.quadraticCurveTo(Math.cos(a - 0.1) * rr * 0.9, Math.sin(a - 0.1) * rr * 0.9, Math.cos(a) * rr, Math.sin(a) * rr);
      }
      c.stroke();
    }
  });
export const Cobweb: React.FC<{p: V3; r?: V3; s?: number; k: number}> = ({p, r = [0, 0, 0], s = 1, k}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({map: teiaTex(), transparent: true, depthWrite: false, side: THREE.DoubleSide}), []);
  m.opacity = k;
  if (k < 0.01) return null;
  return (
    <mesh position={p} rotation={r} scale={s} material={m}>
      <planeGeometry args={[0.6, 0.6]} />
    </mesh>
  );
};
const MESES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
const paginaTex = (i: number) =>
  canvasTex("calendario-" + i, 200, 240, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 200, 240);
    c.fillStyle = "#e8412c";
    c.fillRect(0, 0, 200, 64);
    c.fillStyle = "#ffffff";
    c.font = "bold 44px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText(MESES[i % 12], 100, 34);
    c.fillStyle = "#101018";
    c.font = "bold 110px sans-serif";
    c.fillText(String(1 + ((i * 7) % 28)), 100, 156);
  });
export const CalendarPage: React.FC<{p: V3; r: V3; i: number; s?: number}> = ({p, r, i, s = 1}) => (
  <mesh position={p} rotation={r} scale={s} material={texMat("calendario-" + i, paginaTex(i), 0.7, {side: THREE.DoubleSide})}>
    <planeGeometry args={[0.36, 0.43]} />
  </mesh>
);
export const lerp3 = (a: V3, b: V3, k: number): V3 => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
