import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Objetos do vídeo "Se você quer assistir TV, mas perdeu o controle" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};

/* ---------- controle remoto (frente = +z, comprido em y) ----------
   alive = 0: controle normal, sem rosto/braços/pernas. alive = 1: ganha olhos, boca, bracinhos e perninhas. */
export type RemoteP = {
  alive?: number;
  t?: number;
  blink?: number;
  mouth?: number;
  smile?: number;
  rose?: boolean;
  dance?: number; // 0..1 passos de tango
  arms?: "down" | "tango" | "wave" | "up";
  ir?: number; // brilho do led infravermelho na ponta
  look?: [number, number];
};
export const Remote: React.FC<{p?: V3; r?: V3; s?: number; c?: RemoteP}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, c = {}}) => {
  const {alive = 0, t = 0, blink = 0, mouth = 0, smile = 1, rose = false, dance = 0, arms = "down", ir = 0, look = [0, 0]} = c;
  const body = sm("#1d1f27", 0.35);
  const grey = sm("#5a5f6b", 0.4);
  const k = alive;
  const eyeY = Math.max(0.08, 1 - blink);
  const legPh = t * 7;
  const armRot = (sd: number): V3 => {
    switch (arms) {
      case "tango":
        return sd > 0 ? [-1.4, 0, 0.3] : [0, 0, -1.25 - 0.15 * Math.sin(t * 7)];
      case "wave":
        return sd > 0 ? [0, 0, 2.4 + 0.3 * Math.sin(t * 12)] : [0, 0, -0.5];
      case "up":
        return [0, 0, sd * 2.6];
      default:
        return [0, 0, sd * 0.35];
    }
  };
  return (
    <group position={p} rotation={r} scale={s}>
      {/* corpo */}
      <mesh geometry={rbox(0.2, 0.62, 0.08, 0.035)} material={body} castShadow receiveShadow />
      {/* led infravermelho na ponta */}
      <mesh position={[0, 0.312, 0]} material={sm("#7a1010", 0.2, {emissive: "#ff2020", emissiveIntensity: 0.3 + 2.5 * ir})}>
        <sphereGeometry args={[0.022, 12, 8]} />
      </mesh>
      {/* botão vermelho de desligar */}
      <mesh position={[-0.05, 0.25, 0.042]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e8262d", 0.35)}>
        <cylinderGeometry args={[0.024, 0.024, 0.016, 16]} />
      </mesh>
      {/* botões coloridos */}
      {["#e8414f", "#2ecc71", "#ffd21f", "#3a86ff"].map((col, i) => (
        <mesh key={col} position={[-0.06 + i * 0.04, -0.01, 0.042]} rotation={[Math.PI / 2, 0, 0]} material={sm(col, 0.35)}>
          <cylinderGeometry args={[0.013, 0.013, 0.012, 12]} />
        </mesh>
      ))}
      {/* teclado numérico */}
      {Array.from({length: 9}, (_, i) => (
        <mesh key={"n" + i} position={[-0.045 + (i % 3) * 0.045, -0.08 - Math.floor(i / 3) * 0.045, 0.042]} geometry={rbox(0.032, 0.026, 0.012, 0.006)} material={grey} />
      ))}
      {/* direcional */}
      <mesh position={[0, -0.24, 0.042]} rotation={[Math.PI / 2, 0, 0]} material={grey}>
        <cylinderGeometry args={[0.035, 0.035, 0.012, 18]} />
      </mesh>
      {k > 0.01 && (
        <group scale={k}>
          {/* olhos */}
          {[-1, 1].map((sd) => (
            <group key={"e" + sd} position={[0.045 * sd, 0.17, 0.042]} scale={[1, eyeY, 1]}>
              <mesh scale={[0.035, 0.042, 0.012]} material={sm("#ffffff", 0.2)}>
                <sphereGeometry args={[1, 16, 12]} />
              </mesh>
              <mesh position={[0.008 * look[0], 0.006 * look[1], 0.01]} scale={[0.017, 0.021, 0.008]} material={sm("#0c0c10", 0.1)}>
                <sphereGeometry args={[1, 12, 10]} />
              </mesh>
              <mesh position={[0.006, 0.012, 0.016]} scale={0.006} material={sm("#ffffff", 0.2)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
          {/* boca */}
          {mouth > 0.05 ? (
            <mesh position={[0, 0.085, 0.043]} scale={[0.03, 0.01 + 0.02 * mouth, 0.01]} material={sm("#7a1a24", 0.5)}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
          ) : (
            <mesh position={[0, 0.098, 0.044]} rotation={[0, 0, smile > 0.3 ? Math.PI + 0.42 : 0.42]} material={sm("#ffffff", 0.4)}>
              <torusGeometry args={[0.028, 0.005, 6, 18, Math.PI * 0.75]} />
            </mesh>
          )}
          {/* rosa na boca */}
          {rose && (
            <group position={[0, 0.088, 0.06]} rotation={[0, 0, -0.15]}>
              <mesh position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#2e8b3a", 0.6)}>
                <cylinderGeometry args={[0.005, 0.005, 0.2, 6]} />
              </mesh>
              <mesh position={[0.16, 0.0, 0]} material={sm("#d81b2c", 0.5)}>
                <sphereGeometry args={[0.03, 12, 10]} />
              </mesh>
              <mesh position={[0.155, -0.025, 0.0]} rotation={[0, 0, 0.6]} scale={[0.03, 0.012, 0.02]} material={sm("#2e8b3a", 0.6)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          )}
          {/* braços */}
          {[-1, 1].map((sd) => (
            <group key={"b" + sd} position={[0.1 * sd, 0.04, 0]} rotation={armRot(sd)}>
              <mesh position={[0, -0.11, 0]} material={body}>
                <capsuleGeometry args={[0.014, 0.2, 4, 8]} />
              </mesh>
              <mesh position={[0, -0.23, 0]} material={sm("#ffffff", 0.5)}>
                <sphereGeometry args={[0.03, 12, 10]} />
              </mesh>
            </group>
          ))}
          {/* pernas */}
          {[-1, 1].map((sd) => {
            const sw = dance * 0.5 * Math.sin(legPh + (sd > 0 ? 0 : Math.PI));
            return (
              <group key={"l" + sd} position={[0.05 * sd, -0.3, 0]} rotation={[sw, 0, sd * 0.06]}>
                <mesh position={[0, -0.1, 0]} material={body}>
                  <capsuleGeometry args={[0.015, 0.18, 4, 8]} />
                </mesh>
                <mesh position={[0, -0.2, 0.025]} scale={[0.035, 0.022, 0.055]} material={sm("#c9262d", 0.35)}>
                  <sphereGeometry args={[1, 12, 8]} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}
    </group>
  );
};
/** altura do pé ao centro do controle vivo (pra apoiar no chão) */
export const REMOTE_LEG = 0.53;

/* ---------- raios infravermelhos saindo da ponta ---------- */
export const IRBeams: React.FC<{p: V3; t: number; k: number}> = ({p, t, k}) => (
  <group position={p}>
    {Array.from({length: 6}, (_, i) => {
      const q = (t * 2.2 + i / 6) % 1;
      const a = (i / 6) * Math.PI * 2 + t;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.5 * q, 0.15 + Math.sin(a) * 0.3 * q + 0.4 * q, 0.1]} rotation={[0, 0, a]} scale={[0.25 * k * (1 - q * 0.5), 0.02 * k, 0.02]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#ff2a2a" emissive="#ff2020" emissiveIntensity={2.5} transparent opacity={1 - q} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- chuvisco na tela da TV (sobrepõe a tela da TV do Sets9) ---------- */
const noiseTex = (i: number) =>
  canvasTex("chuvisco-" + i, 128, 72, (c) => {
    const r = rng(17 + i * 31);
    for (let y = 0; y < 72; y += 2)
      for (let x = 0; x < 128; x += 2) {
        const v = Math.floor(40 + r() * 215);
        c.fillStyle = `rgb(${v},${v},${v})`;
        c.fillRect(x, y, 2, 2);
      }
  });
export const TVStatic: React.FC<{p: V3; rotY?: number; f: number}> = ({p, rotY = 0, f}) => {
  const i = Math.floor(f / 2) % 4;
  const t = noiseTex(i);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 1.18, -0.008]} material={tm("chuvisco-" + i, t, 0.4, {emissive: "#ffffff", emissiveMap: t, emissiveIntensity: 1})}>
        <planeGeometry args={[1.65, 0.92]} />
      </mesh>
    </group>
  );
};

/* ---------- biscoito velho de 2009 ---------- */
export const Biscuit: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#b07a3a", 0.85)} castShadow>
      <cylinderGeometry args={[0.13, 0.13, 0.03, 24]} />
    </mesh>
    {[[-0.05, 0.04], [0.05, -0.03], [0.0, -0.07], [0.06, 0.06]].map(([x, y], i) => (
      <mesh key={i} position={[x, y, 0.017]} scale={[0.022, 0.022, 0.006]} material={sm(i % 2 ? "#6f9a4a" : "#5a3a1a", 0.9)}>
        <sphereGeometry args={[1, 8, 6]} />
      </mesh>
    ))}
    {/* teia de aranha velha */}
    <mesh position={[0.08, 0.08, 0.02]} rotation={[0, 0, 0.6]} material={sm("#ffffff", 0.9, {transparent: true, opacity: 0.5})}>
      <torusGeometry args={[0.05, 0.002, 4, 12, Math.PI]} />
    </mesh>
  </group>
);
/** poeirinha saindo do biscoito */
export const DustPuff: React.FC<{p: V3; t: number; k?: number}> = ({p, t, k = 1}) => (
  <group position={p}>
    {Array.from({length: 7}, (_, i) => {
      const q = (t * 0.8 + i / 7) % 1;
      return (
        <mesh key={i} position={[Math.sin(i * 2.3) * 0.25 * q, 0.05 + 0.3 * q, Math.cos(i * 1.7) * 0.1 * q]} scale={(0.03 + 0.06 * q) * k}>
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial color="#cfc6b0" transparent opacity={0.7 * (1 - q)} roughness={1} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- contorno de giz + fita de "não ultrapasse" ---------- */
const fitaTex = () =>
  canvasTex("fita-zebrada", 512, 48, (c) => {
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 0, 512, 48);
    c.fillStyle = "#101018";
    c.font = "bold 30px sans-serif";
    c.textBaseline = "middle";
    for (let x = 6; x < 512; x += 256) c.fillText("NÃO ULTRAPASSE", x, 26);
  });
export const ChalkOutline: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => {
  const w = 0.24, h = 0.66, rr = 0.05;
  const shape = new THREE.Shape();
  shape.moveTo(-w / 2 + rr, -h / 2);
  shape.lineTo(w / 2 - rr, -h / 2);
  shape.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + rr);
  shape.lineTo(w / 2, h / 2 - rr);
  shape.quadraticCurveTo(w / 2, h / 2, w / 2 - rr, h / 2);
  shape.lineTo(-w / 2 + rr, h / 2);
  shape.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - rr);
  shape.lineTo(-w / 2, -h / 2 + rr);
  shape.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rr, -h / 2);
  const pts = shape.getPoints(8).map((v) => new THREE.Vector3(v.x, v.y, 0));
  const curve = new THREE.CatmullRomCurve3(pts, true);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh material={sm("#ffffff", 0.9)}>
        <tubeGeometry args={[curve, 60, 0.008, 6, true]} />
      </mesh>
    </group>
  );
};
export const Tape: React.FC<{a: V3; b: V3; y?: number}> = ({a, b, y = 0}) => {
  const dx = b[0] - a[0], dz = b[2] - a[2];
  const len = Math.hypot(dx, dz);
  return (
    <mesh position={[(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + y, (a[2] + b[2]) / 2]} rotation={[0, -Math.atan2(dz, dx), (b[1] - a[1]) / len]} material={tm("fita-zebrada", fitaTex(), 0.5, {side: THREE.DoubleSide})}>
      <planeGeometry args={[len, 0.09]} />
    </mesh>
  );
};

/* ---------- poltrona ---------- */
export const Armchair: React.FC<{p: V3; rotY?: number; color?: string}> = ({p, rotY = 0, color = "#b5523b"}) => {
  const m = sm(color, 0.8);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.22, 0]} geometry={rbox(1.0, 0.34, 0.9, 0.08)} material={m} castShadow receiveShadow />
      <mesh position={[0, 0.42, 0.05]} geometry={rbox(0.7, 0.14, 0.75, 0.06)} material={m} castShadow />
      <mesh position={[0, 0.8, -0.38]} rotation={[-0.1, 0, 0]} geometry={rbox(1.0, 0.85, 0.2, 0.08)} material={m} castShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.43 * sd, 0.5, 0.0]} geometry={rbox(0.16, 0.36, 0.88, 0.07)} material={m} castShadow />
      ))}
    </group>
  );
};

/* ---------- jornal ---------- */
const jornalTex = () =>
  canvasTex("jornal", 256, 192, (c) => {
    c.fillStyle = "#f2efe6";
    c.fillRect(0, 0, 256, 192);
    c.fillStyle = "#101018";
    c.font = "bold 30px serif";
    c.textAlign = "center";
    c.fillText("O PASTO", 128, 34);
    c.fillRect(10, 44, 236, 3);
    c.fillStyle = "#777";
    for (let y = 60; y < 186; y += 10) {
      c.fillRect(12, y, 110, 4);
      c.fillRect(134, y, 110, 4);
    }
  });
export const Newspaper: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh material={tm("jornal", jornalTex(), 0.8, {side: THREE.DoubleSide})}>
      <planeGeometry args={[0.6, 0.45]} />
    </mesh>
  </group>
);
/* ---------- livro de cabeça pra baixo ---------- */
const livroTex = () =>
  canvasTex("livro-capa", 128, 160, (c) => {
    c.fillStyle = "#2e86de";
    c.fillRect(0, 0, 128, 160);
    c.save();
    c.translate(64, 80);
    c.rotate(Math.PI);
    c.fillStyle = "#ffffff";
    c.font = "bold 22px sans-serif";
    c.textAlign = "center";
    c.fillText("COMO", 0, -26);
    c.fillText("LER", 0, 2);
    c.fillText("LIVROS", 0, 30);
    c.restore();
  });
export const Book: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.26, 0.32, 0.05, 0.01)} material={sm("#2e86de", 0.6)} castShadow />
    <mesh position={[0, 0, 0.026]} material={tm("livro-capa", livroTex(), 0.6)}>
      <planeGeometry args={[0.24, 0.3]} />
    </mesh>
  </group>
);

/* ---------- geladeira simples (sem rosto) com luz de dentro ---------- */
export const PlainFridge: React.FC<{p: V3; rotY?: number; light: number}> = ({p, rotY = 0, light}) => {
  const white = sm("#eef2f5", 0.35);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {/* caixa aberta na frente */}
      <mesh position={[0, 0.95, -0.33]} geometry={rbox(0.9, 1.9, 0.06, 0.02)} material={white} castShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.42 * sd, 0.95, 0]} geometry={rbox(0.06, 1.9, 0.72, 0.02)} material={white} castShadow />
      ))}
      <mesh position={[0, 1.88, 0]} geometry={rbox(0.9, 0.06, 0.72, 0.02)} material={white} />
      <mesh position={[0, 0.03, 0]} geometry={rbox(0.9, 0.06, 0.72, 0.02)} material={white} />
      {/* prateleiras e comidas */}
      {[0.55, 1.05, 1.5].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={sm("#cfe8f0", 0.1, {transparent: true, opacity: 0.6})}>
          <boxGeometry args={[0.78, 0.015, 0.6]} />
        </mesh>
      ))}
      <mesh position={[-0.2, 0.72, 0]} material={sm("#ffffff", 0.4)}>
        <cylinderGeometry args={[0.07, 0.07, 0.3, 14]} />
      </mesh>
      <mesh position={[0.15, 1.15, 0]} material={sm("#e8414f", 0.5)}>
        <sphereGeometry args={[0.09, 12, 10]} />
      </mesh>
      <mesh position={[0.18, 0.65, 0.05]} geometry={rbox(0.22, 0.14, 0.16, 0.03)} material={sm("#ffd21f", 0.5)} />
      {/* porta aberta */}
      <group position={[0.45, 0.95, 0.36]} rotation={[0, 1.9, 0]}>
        <mesh position={[-0.45, 0, 0]} geometry={rbox(0.9, 1.9, 0.08, 0.03)} material={white} castShadow />
      </group>
      {/* lâmpada de dentro */}
      <mesh position={[0, 1.8, -0.1]} material={sm("#fff6c8", 0.2, {emissive: "#fff3b0", emissiveIntensity: 2 * light})}>
        <sphereGeometry args={[0.05, 12, 10]} />
      </mesh>
      {light > 0.01 && <pointLight position={[0, 1.6, 0.1]} intensity={3 * light} distance={2.5} decay={1.5} color="#fff6d8" />}
    </group>
  );
};

/* ---------- Buenos Aires (casinhas coloridas estilo Caminito) ---------- */
const BA_COLS = ["#e8414f", "#ffd21f", "#2e86de", "#2ecc71", "#ff8a1f", "#9b59b6", "#26c6da", "#f06292"];
export const Caminito: React.FC = () => {
  const r = rng(91);
  const houses = Array.from({length: 9}, (_, i) => ({x: -6 + i * 1.5, h: 2.6 + r() * 1.6, c: BA_COLS[i % BA_COLS.length], c2: BA_COLS[(i * 3 + 2) % BA_COLS.length]}));
  return (
    <group>
      <color attach="background" args={["#8fd0ff"]} />
      {/* calçada de pedra */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} material={sm("#b9a58c", 0.95)} receiveShadow>
        <planeGeometry args={[30, 14]} />
      </mesh>
      {Array.from({length: 60}, (_, i) => (
        <mesh key={"p" + i} rotation={[-Math.PI / 2, 0, 0]} position={[-7 + (i % 12) * 1.25 + (Math.floor(i / 12) % 2) * 0.6, 0.005, -1 + Math.floor(i / 12) * 1.0]} material={sm("#a8937a", 0.95)}>
          <planeGeometry args={[1.1, 0.85]} />
        </mesh>
      ))}
      {houses.map((h, i) => (
        <group key={i} position={[h.x, 0, -2.5]}>
          <mesh position={[0, h.h / 2, 0]} geometry={rbox(1.48, h.h, 1.2, 0.03)} material={sm(h.c, 0.8)} castShadow receiveShadow />
          {/* janelas e varandinha */}
          <mesh position={[0, h.h - 0.75, 0.61]} geometry={rbox(0.5, 0.6, 0.04, 0.02)} material={sm(h.c2, 0.6)} />
          <mesh position={[0, h.h - 1.05, 0.72]} geometry={rbox(0.8, 0.05, 0.25, 0.02)} material={sm("#2b2f36", 0.5)} />
          {[-0.3, -0.1, 0.1, 0.3].map((x) => (
            <mesh key={x} position={[x, h.h - 0.93, 0.83]} material={sm("#2b2f36", 0.5)}>
              <boxGeometry args={[0.02, 0.24, 0.02]} />
            </mesh>
          ))}
          <mesh position={[0.3, 0.6, 0.61]} geometry={rbox(0.42, 1.2, 0.04, 0.02)} material={sm(h.c2, 0.6)} />
          {/* telhadinho de chapa */}
          <mesh position={[0, h.h + 0.05, 0.1]} rotation={[0.12, 0, 0]} geometry={rbox(1.56, 0.06, 1.4, 0.02)} material={sm("#8c919b", 0.4, {metalness: 0.4})} castShadow />
        </group>
      ))}
      {/* varal de bandeirinhas azul e branco */}
      {Array.from({length: 22}, (_, i) => (
        <mesh key={"b" + i} position={[-5.5 + i * 0.5, 3.0 - 0.15 * Math.sin((i / 21) * Math.PI), -1.0]} rotation={[0, 0, Math.PI]} material={sm(i % 2 ? "#ffffff" : "#74b9e8", 0.6, {side: THREE.DoubleSide})}>
          <circleGeometry args={[0.16, 3]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- palquinho, plateia de chinelos e meias com cartaz de coração ---------- */
const coracaoTex = () =>
  canvasTex("cartaz-coracao", 96, 96, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 96, 96);
    c.fillStyle = "#e8262d";
    c.beginPath();
    c.moveTo(48, 80);
    c.bezierCurveTo(10, 55, 8, 22, 30, 18);
    c.bezierCurveTo(42, 16, 48, 28, 48, 32);
    c.bezierCurveTo(48, 28, 54, 16, 66, 18);
    c.bezierCurveTo(88, 22, 86, 55, 48, 80);
    c.fill();
  });
export const HeartSign: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, -0.22, -0.01]} material={sm("#b07a45", 0.7)}>
      <boxGeometry args={[0.025, 0.4, 0.02]} />
    </mesh>
    <mesh material={tm("cartaz-coracao", coracaoTex(), 0.6, {side: THREE.DoubleSide})}>
      <planeGeometry args={[0.26, 0.26]} />
    </mesh>
  </group>
);
export const Sock: React.FC<{p: V3; rotY?: number; s?: number; color?: string}> = ({p, rotY = 0, s = 1, color = "#ffffff"}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 0.3, 0]} material={sm(color, 0.85)} castShadow>
      <capsuleGeometry args={[0.09, 0.4, 6, 12]} />
    </mesh>
    <mesh position={[0, 0.06, 0.08]} scale={[1, 0.7, 1.6]} material={sm(color, 0.85)} castShadow>
      <sphereGeometry args={[0.095, 12, 10]} />
    </mesh>
    {[0.4, 0.5].map((y) => (
      <mesh key={y} position={[0, y, 0]} material={sm("#e8414f", 0.8)}>
        <cylinderGeometry args={[0.093, 0.093, 0.035, 16]} />
      </mesh>
    ))}
  </group>
);
export const MiniStage: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.15, 0]} geometry={rbox(2.2, 0.3, 1.2, 0.04)} material={sm("#7a1f2b", 0.6)} castShadow receiveShadow />
    <mesh position={[0, 1.6, -0.62]} material={sm("#b3122d", 0.8)}>
      <planeGeometry args={[2.6, 2.8]} />
    </mesh>
    {Array.from({length: 10}, (_, i) => (
      <mesh key={i} position={[-1.1 + i * 0.245, 2.9, -0.55]} material={sm("#ffe08a", 0.3, {emissive: "#ffd21f", emissiveIntensity: 1.2})}>
        <sphereGeometry args={[0.05, 10, 8]} />
      </mesh>
    ))}
  </group>
);

/* ---------- cabine do avião (poltrona + janelinha) ---------- */
export const PlaneCabin: React.FC<{t: number}> = ({t}) => (
  <group>
    <color attach="background" args={["#e9eef5"]} />
    <mesh position={[0, 1.4, -0.9]} material={sm("#e9eef5", 0.8)}>
      <planeGeometry args={[8, 5]} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a6070", 0.9)} receiveShadow>
      <planeGeometry args={[8, 6]} />
    </mesh>
    {/* janelinha oval com nuvens passando */}
    <group position={[0.75, 1.45, -0.88]}>
      <mesh scale={[0.32, 0.45, 1]} material={sm("#cfd5de", 0.5)}>
        <circleGeometry args={[1, 32]} />
      </mesh>
      <mesh position={[0, 0, 0.005]} scale={[0.25, 0.37, 1]} material={sm("#7fc8ff", 0.4, {emissive: "#7fc8ff", emissiveIntensity: 0.5})}>
        <circleGeometry args={[1, 32]} />
      </mesh>
      {[0, 1, 2].map((i) => {
        const x = 0.35 - ((t * 0.5 + i * 0.33) % 1) * 0.7;
        return (
          <mesh key={i} position={[x, -0.1 + i * 0.1, 0.01]} scale={[0.09, 0.05, 1]} material={sm("#ffffff", 0.6, {emissive: "#ffffff", emissiveIntensity: 0.4})}>
            <circleGeometry args={[1, 16]} />
          </mesh>
        );
      })}
    </group>
    {/* poltrona */}
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.42, 0]} geometry={rbox(0.8, 0.18, 0.7, 0.06)} material={sm("#2e4a8a", 0.7)} castShadow />
      <mesh position={[0, 0.95, -0.33]} rotation={[-0.1, 0, 0]} geometry={rbox(0.8, 1.0, 0.16, 0.08)} material={sm("#2e4a8a", 0.7)} castShadow />
      <mesh position={[0, 1.42, -0.36]} geometry={rbox(0.5, 0.2, 0.14, 0.06)} material={sm("#ffffff", 0.7)} />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.42 * sd, 0.62, 0]} geometry={rbox(0.08, 0.06, 0.6, 0.02)} material={sm("#3a3f4a", 0.6)} />
      ))}
      <mesh position={[0, 0.2, 0]} geometry={rbox(0.7, 0.4, 0.5, 0.04)} material={sm("#3a3f4a", 0.6)} />
    </group>
  </group>
);

/* ---------- cuia de chimarrão ---------- */
export const Cuia: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh scale={[1, 1.15, 1]} material={sm("#8a5a2b", 0.6)} castShadow>
      <sphereGeometry args={[0.08, 16, 12, 0, Math.PI * 2, Math.PI * 0.18, Math.PI * 0.82]} />
    </mesh>
    <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a8a2a", 0.9)}>
      <circleGeometry args={[0.045, 16]} />
    </mesh>
    <mesh position={[0.02, 0.14, 0]} rotation={[0, 0, -0.25]} material={sm("#c9ced6", 0.25, {metalness: 0.8})}>
      <cylinderGeometry args={[0.006, 0.006, 0.18, 8]} />
    </mesh>
  </group>
);

/* ---------- pasto (vaca) ---------- */
export const Pasture: React.FC = () => (
  <group>
    <color attach="background" args={["#8fd0ff"]} />
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#7fcf5a", 0.95)} receiveShadow>
      <planeGeometry args={[60, 40]} />
    </mesh>
    {[-6, -2.5, 2.5, 6].map((x, i) => (
      <mesh key={i} position={[x, 0.6, -8 - i]} scale={[2.2, 1.2, 1.4]} material={sm(i % 2 ? "#5cbf45" : "#4fae3a", 0.8)}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
    ))}
  </group>
);
