import React, {useMemo} from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import type {ToyLook} from "./Toy";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng} from "./util";

/* ===== Vídeo "Se o seu pai pedir pra você levar o carro no mecânico" ===== */
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};

/* ---------- o pai ---------- */
export const DAD: ToyLook = {shirt: "#c0392b", plaid: "#1f2a44", pants: "#6b5b45", hair: "#2a1a10", hairStyle: "buzz", skin: "#d9a173", shoe: "#2e86de", sole: "#ffd21f", belly: 1, flipflop: true};
/** bigodão + boné (espaço da cabeça) */
export const DadHead: React.FC<{cap?: boolean}> = ({cap = true}) => (
  <group>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.07 * sd, -0.095, 0.29]} rotation={[0, 0.25 * sd, -0.28 * sd]} scale={[0.1, 0.04, 0.045]} material={sm("#2a1a10", 0.6)} castShadow>
        <sphereGeometry args={[1, 14, 10]} />
      </mesh>
    ))}
    {cap && (
      <group position={[0, 0.2, 0]} rotation={[-0.12, 0, 0]}>
        <mesh scale={[1.04, 0.62, 1.04]} material={sm("#2e86de", 0.6)} castShadow>
          <sphereGeometry args={[0.34, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        </mesh>
        <mesh position={[0, 0.01, 0.33]} rotation={[0.18, 0, 0]} geometry={rbox(0.42, 0.03, 0.28, 0.014)} material={sm("#2e86de", 0.6)} castShadow />
        <mesh position={[0, 0.215, 0]} material={sm("#ffffff", 0.5)}>
          <sphereGeometry args={[0.03, 10, 8]} />
        </mesh>
      </group>
    )}
  </group>
);

/* ---------- carro com cara (frente = +z) ---------- */
export type CarP = {mood?: number; sleepy?: number; wide?: number; smile?: number; mouth?: number; t?: number; spin?: number; bounce?: number; shake?: number; melon?: number; color?: string; blink?: number; steam?: number};
const melonTex = () =>
  canvasTex("casca-melancia", 512, 256, (c) => {
    c.fillStyle = "#3f9a35";
    c.fillRect(0, 0, 512, 256);
    c.fillStyle = "#1f5e1a";
    for (let i = 0; i < 12; i++) {
      c.beginPath();
      const x = i * 43;
      c.moveTo(x, 0);
      for (let y = 0; y <= 256; y += 16) c.lineTo(x + 10 * Math.sin(y / 20 + i), y);
      c.lineTo(x + 16, 256);
      for (let y = 256; y >= 0; y -= 16) c.lineTo(x + 16 + 10 * Math.sin(y / 20 + i), y);
      c.fill();
    }
  });
const plateTex = () =>
  canvasTex("placa-carro", 256, 80, (x) => {
    x.fillStyle = "#ffffff";
    x.fillRect(0, 0, 256, 80);
    x.fillStyle = "#2e5bd0";
    x.fillRect(0, 0, 256, 18);
    x.fillStyle = "#101018";
    x.font = "bold 46px sans-serif";
    x.textAlign = "center";
    x.fillText("PAI-0001", 128, 68);
  });
/** olho-farol: globo branco brilhante, aro cromado, íris azul, pupila, dois brilhos e pálpebra da cor da lataria */
export const CarEye: React.FC<{sd: number; r?: number; lid?: number; mood?: number; wide?: number; look?: [number, number]; body: THREE.Material; brow?: boolean}> = ({sd, r = 0.17, lid = 0, mood = 0, wide = 0, look = [0, 0], body, brow = true}) => {
  const sy = 1 + 0.15 * wide;
  const th = lid > 0.001 ? lerp(0.2, 1, lid) * Math.PI : lerp(0.2, 0.1, wide) * Math.PI;
  const ps = 1 - 0.35 * wide;
  return (
    <group>
      <mesh scale={[1, sy, 0.62]} material={sm("#ffffff", 0.08)}>
        <sphereGeometry args={[r, 28, 20]} />
      </mesh>
      <mesh scale={[1, sy, 1]} material={sm("#d9dde3", 0.22, {metalness: 0.65})}>
        <torusGeometry args={[r * 1.02, r * 0.13, 10, 32]} />
      </mesh>
      <group position={[look[0] * r * 0.28, look[1] * r * 0.28, 0]}>
        <mesh position={[0, 0, r * 0.555]} scale={[r * 0.56, r * 0.56 * sy, r * 0.12]} material={sm("#2f7fd6", 0.15)}>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        <mesh position={[0, 0, r * 0.6]} scale={[r * 0.3 * ps, r * 0.33 * ps * sy, r * 0.1]} material={sm("#08080c", 0.1)}>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh position={[r * 0.2, r * 0.22, r * 0.66]} scale={r * 0.12} material={sm("#ffffff", 0.1, {emissive: "#ffffff", emissiveIntensity: 0.4})}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
        <mesh position={[-r * 0.13, -r * 0.16, r * 0.66]} scale={r * 0.055} material={sm("#ffffff", 0.1, {emissive: "#ffffff", emissiveIntensity: 0.4})}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      </group>
      {/* pálpebra de cima: fecha do topo pra baixo; inclina quando bravo */}
      <group rotation={[0, 0, sd * 0.42 * mood]}>
        <mesh scale={[1.06, sy * 1.06, 0.7]} material={body}>
          <sphereGeometry args={[r, 28, 16, 0, Math.PI * 2, 0, th]} />
        </mesh>
      </group>
      {brow && <mesh position={[0, r * 1.3 * sy + 0.02, r * 0.3]} rotation={[0, 0, sd * (-0.45 * mood + 0.15 * wide)]} geometry={rbox(r * 1.45, r * 0.28, r * 0.3, r * 0.1)} material={sm("#1d1f27", 0.4)} />}
    </group>
  );
};
export const Car: React.FC<{p: V3; rotY?: number; c?: CarP; s?: number}> = ({p, rotY = 0, c = {}, s = 1}) => {
  const {mood = 0, sleepy = 0, wide = 0, smile = 0, mouth = 0, t = 0, spin = 0, bounce = 0, shake = 0, melon = 0, color = "#e8414f", blink = 0, steam = 0} = c;
  const body = sm(color, 0.3, {metalness: 0.15});
  const dark = sm("#1d1f27", 0.4);
  const glass = sm("#9fd8ff", 0.1, {metalness: 0.2});
  const lid = Math.max(sleepy, blink);
  const hop = Math.abs(Math.sin(t * 9)) * 0.25 * bounce;
  const sx = shake * 0.03 * Math.sin(t * 55);
  return (
    <group position={[p[0] + sx, p[1] + hop, p[2]]} rotation={[0, rotY, 0]} scale={s}>
      <group rotation={[0.08 * bounce * Math.sin(t * 9), 0, 0]}>
        {/* carroceria */}
        <mesh position={[0, 0.5, 0]} geometry={rbox(1.15, 0.5, 2.1, 0.18)} material={body} castShadow receiveShadow />
        <mesh position={[0, 0.92, -0.15]} geometry={rbox(1.0, 0.5, 1.15, 0.2)} material={body} castShadow />
        {/* vidros */}
        <mesh position={[0, 0.95, 0.43]} rotation={[-0.35, 0, 0]} geometry={rbox(0.86, 0.36, 0.03, 0.06)} material={glass} />
        <mesh position={[0, 0.95, -0.73]} rotation={[0.35, 0, 0]} geometry={rbox(0.86, 0.34, 0.03, 0.06)} material={glass} />
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.505 * sd, 0.95, -0.15]} rotation={[0, (Math.PI / 2) * sd, 0]} geometry={rbox(0.95, 0.32, 0.02, 0.06)} material={glass} />
        ))}
        {/* para-choques */}
        <mesh position={[0, 0.33, 1.06]} geometry={rbox(1.18, 0.16, 0.12, 0.06)} material={sm("#d0d4da", 0.25, {metalness: 0.6})} castShadow />
        <mesh position={[0, 0.33, -1.06]} geometry={rbox(1.18, 0.16, 0.12, 0.06)} material={sm("#d0d4da", 0.25, {metalness: 0.6})} castShadow />
        {/* placa */}
        <mesh position={[0, 0.33, 1.125]} material={tm("placa-carro", plateTex(), 0.5)}>
          <planeGeometry args={[0.32, 0.1]} />
        </mesh>
        {/* rodas */}
        {[-1, 1].map((sx2) =>
          [-0.68, 0.68].map((z) => (
            <group key={`${sx2}${z}`} position={[0.56 * sx2, 0.26, z]} rotation={[spin, 0, Math.PI / 2]}>
              <mesh material={dark} castShadow>
                <cylinderGeometry args={[0.26, 0.26, 0.2, 24]} />
              </mesh>
              <mesh position={[0, 0.105 * sx2, 0]} material={sm("#c9ced6", 0.3, {metalness: 0.6})}>
                <cylinderGeometry args={[0.12, 0.12, 0.02, 16]} />
              </mesh>
            </group>
          )),
        )}
        {/* cara: faróis = olhos */}
        {[-1, 1].map((sd) => (
          <group key={"e" + sd} position={[0.32 * sd, 0.63, 1.06]}>
            <CarEye sd={sd} r={0.17} lid={lid} mood={mood} wide={wide} body={body} />
          </group>
        ))}
        {/* grade = boca */}
        {mouth > 0.05 ? (
          <mesh position={[0, 0.4, 1.09]} scale={[0.26, 0.05 + 0.1 * mouth, 0.05]} material={sm("#3a1510", 0.5)}>
            <sphereGeometry args={[1, 16, 10]} />
          </mesh>
        ) : (
          <mesh position={[0, 0.45 - 0.04 * smile, 1.095]} rotation={[0, 0, smile > 0.3 ? Math.PI + 0.35 : 0.35]} material={dark}>
            <torusGeometry args={[0.16, 0.025, 8, 20, Math.PI * 0.75]} />
          </mesh>
        )}
        {steam > 0.01 &&
          [0, 1, 2].map((i) => {
            const k = ((t * 0.8 + i / 3) % 1);
            return (
              <mesh key={"v" + i} position={[0.2 * Math.sin(i * 2), 1.2 + k * 0.9, 0.6 - 0.3 * i]} material={sm("#ffffff", 0.9, {transparent: true, opacity: 0.6 * (1 - k) * steam})}>
                <sphereGeometry args={[0.12 + 0.15 * k, 12, 8]} />
              </mesh>
            );
          })}
        {/* fantasia de melancia */}
        {melon > 0.01 && (
          <group scale={melon}>
            <mesh position={[0, 0.72, -0.05]} scale={[0.82, 0.68, 1.3]} material={tm("melancia", melonTex(), 0.5)} castShadow>
              <sphereGeometry args={[1, 32, 22]} />
            </mesh>
            <mesh position={[0, 1.39, -0.1]} rotation={[0, 0, 0.3]} material={sm("#5a3a1a", 0.7)}>
              <cylinderGeometry args={[0.03, 0.04, 0.16, 8]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

/* ---------- xícara de café ---------- */
export const Cup: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.05, 0]} material={sm("#ffffff", 0.3)} castShadow>
      <cylinderGeometry args={[0.06, 0.045, 0.1, 16]} />
    </mesh>
    <mesh position={[0, 0.098, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#5a3418", 0.3)}>
      <circleGeometry args={[0.055, 16]} />
    </mesh>
    <mesh position={[0.065, 0.055, 0]} material={sm("#ffffff", 0.3)}>
      <torusGeometry args={[0.025, 0.008, 6, 12]} />
    </mesh>
  </group>
);

/* ---------- feira ---------- */
const lonaTex = (a: string, b: string) =>
  canvasTex("lona-" + a + b, 256, 32, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? a : b;
      c.fillRect(i * 32, 0, 32, 32);
    }
  });
export const Melon: React.FC<{p: V3; r?: number; s?: number}> = ({p, r = 0, s = 1}) => (
  <mesh position={p} rotation={[0, r, 0.1]} scale={[0.26 * s, 0.2 * s, 0.2 * s]} material={tm("melancia", melonTex(), 0.5)} castShadow>
    <sphereGeometry args={[1, 20, 14]} />
  </mesh>
);
export const FruitStall: React.FC<{p: V3; rotY?: number; kind?: "melancia" | "frutas" | "pastel"; colors?: [string, string]}> = ({p, rotY = 0, kind = "frutas", colors = ["#e8414f", "#ffffff"]}) => {
  const wood = sm("#b07a45", 0.7);
  const fr = useMemo(() => {
    const r = rng(kind.length * 7 + 3);
    return Array.from({length: 18}, () => [r(), r(), r()] as [number, number, number]);
  }, [kind]);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 0.8, 0]} geometry={rbox(2.0, 0.08, 0.95, 0.03)} material={wood} castShadow receiveShadow />
      {[-0.9, 0.9].map((x) =>
        [-0.4, 0.4].map((z) => (
          <mesh key={`${x}${z}`} position={[x, 0.4, z]} material={wood} castShadow>
            <boxGeometry args={[0.06, 0.8, 0.06]} />
          </mesh>
        )),
      )}
      {[-0.95, 0.95].map((x) => (
        <mesh key={"m" + x} position={[x, 1.55, -0.45]} material={sm("#8a8f99", 0.4)}>
          <cylinderGeometry args={[0.025, 0.025, 1.5, 8]} />
        </mesh>
      ))}
      <mesh position={[0, 2.25, -0.05]} rotation={[0.35, 0, 0]} material={tm("lona" + colors.join(""), lonaTex(colors[0], colors[1]), 0.7, {side: THREE.DoubleSide})} castShadow>
        <planeGeometry args={[2.3, 1.1]} />
      </mesh>
      {kind === "melancia" &&
        fr.slice(0, 9).map(([a, b], i) => <Melon key={i} p={[-0.7 + (i % 5) * 0.35, 0.98 + Math.floor(i / 5) * 0.28, -0.15 + Math.floor(i / 5) * 0.12 + b * 0.05]} r={a * 3} s={1} />)}
      {kind === "frutas" &&
        fr.map(([a, b, c2], i) => (
          <mesh key={i} position={[-0.8 + (i % 9) * 0.2, 0.92 + 0.02 * c2, -0.2 + Math.floor(i / 9) * 0.3]} material={sm(["#ff8a1f", "#ffd21f", "#e8414f", "#7ed957"][i % 4], 0.5)} castShadow>
            <sphereGeometry args={[0.085 + 0.02 * a, 12, 10]} />
          </mesh>
        ))}
      {kind === "pastel" && (
        <>
          <mesh position={[0.5, 0.95, 0]} material={sm("#3a3d48", 0.4, {metalness: 0.4})}>
            <cylinderGeometry args={[0.3, 0.25, 0.18, 24]} />
          </mesh>
          {[-0.6, -0.3, 0].map((x) => (
            <mesh key={x} position={[x - 0.2, 0.88, 0.1]} rotation={[-Math.PI / 2, 0, 0.3]} scale={[1, 0.6, 1]} material={sm("#e6b84a", 0.5)}>
              <circleGeometry args={[0.13, 16, 0, Math.PI]} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
};
/** frigideira com pastel (segura pelo cabo; cabo = -x local) */
export const Pan: React.FC<{p?: V3; r?: V3; s?: number; t?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, t = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0.2, 0, 0]} material={sm("#2b2e3b", 0.4, {metalness: 0.5})} castShadow>
      <cylinderGeometry args={[0.16, 0.13, 0.05, 24]} />
    </mesh>
    <mesh position={[0.02, 0.0, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#5a3418", 0.5)}>
      <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
    </mesh>
    <mesh position={[0.2, 0.035 + 0.03 * Math.abs(Math.sin(t * 8)), 0]} rotation={[-Math.PI / 2, 0, 0.4]} scale={[1, 0.6, 1]} material={sm("#e6b84a", 0.5)}>
      <circleGeometry args={[0.11, 16, 0, Math.PI]} />
    </mesh>
  </group>
);

/* ---------- oficina do polvo ---------- */
const oficinaTex = () =>
  canvasTex("placa-oficina", 1024, 220, (c) => {
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 0, 1024, 220);
    c.strokeStyle = "#101018";
    c.lineWidth = 14;
    c.strokeRect(7, 7, 1010, 206);
    c.fillStyle = "#101018";
    c.font = "bold 104px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("OFICINA DO POLVO", 512, 118);
  });
const pisoOficinaTex = () =>
  canvasTex("piso-oficina", 256, 256, (c, r) => {
    c.fillStyle = "#9aa0a8";
    c.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = `rgba(60,60,70,${0.08 + r() * 0.12})`;
      c.beginPath();
      c.ellipse(r() * 256, r() * 256, 8 + r() * 26, 5 + r() * 14, r() * 3, 0, Math.PI * 2);
      c.fill();
    }
  }, [8, 8]);
export const SHOP = {z0: -4.5, z1: 4.5, x0: -4.5, x1: 4.5, h: 4.2};
export const Workshop: React.FC = () => {
  const {z0, z1, x0, x1, h} = SHOP;
  const W = x1 - x0;
  const D = z1 - z0;
  const wall = sm("#3f6fb5", 0.8);
  const wall2 = sm("#e9e2d0", 0.85);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={tm("piso-oficina", pisoOficinaTex(), 0.8)} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      <mesh position={[0, h / 2, z0 - 0.1]} material={wall2} receiveShadow>
        <boxGeometry args={[W, h, 0.2]} />
      </mesh>
      <mesh position={[0, 0.6, z0 + 0.01]} material={wall}>
        <boxGeometry args={[W, 1.2, 0.02]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(W / 2 + 0.1) * sd, h / 2, 0]} material={wall2} receiveShadow>
          <boxGeometry args={[0.2, h, D]} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, h, 0]} material={sm("#d8d4c8", 0.9)}>
        <planeGeometry args={[W, D]} />
      </mesh>
      {/* placa */}
      <mesh position={[0, 3.45, z0 + 0.03]} geometry={rbox(4.2, 0.9, 0.06, 0.03)} material={sm("#101018", 0.5)} />
      <mesh position={[0, 3.45, z0 + 0.065]} material={tm("placa-oficina", oficinaTex(), 0.5, {emissive: "#ffffff", emissiveMap: oficinaTex(), emissiveIntensity: 0.25})}>
        <planeGeometry args={[4.05, 0.8]} />
      </mesh>
      {/* painel de ferramentas */}
      <group position={[-2.6, 2.0, z0 + 0.03]}>
        <mesh geometry={rbox(1.6, 1.1, 0.04, 0.02)} material={sm("#c98a4e", 0.7)} />
        {Array.from({length: 6}, (_, i) => (
          <mesh key={i} position={[-0.6 + (i % 3) * 0.6, 0.25 - Math.floor(i / 3) * 0.5, 0.04]} rotation={[0, 0, 0.3 * (i % 2 ? 1 : -1)]} material={sm("#8c8f99", 0.3, {metalness: 0.6})}>
            <boxGeometry args={[0.06, 0.38, 0.02]} />
          </mesh>
        ))}
      </group>
      {/* pilha de pneus */}
      {[0, 1, 2].map((i) => (
        <mesh key={"p" + i} position={[3.5, 0.13 + i * 0.25, -3.6]} rotation={[Math.PI / 2, 0, 0]} material={sm("#1d1f27", 0.6)} castShadow>
          <torusGeometry args={[0.32, 0.13, 10, 24]} />
        </mesh>
      ))}
      {/* tambores de óleo */}
      {[2.6, 3.3].map((x, i) => (
        <mesh key={"t" + x} position={[x, 0.45, -3.9 + i * 0.1]} material={sm(i ? "#e8414f" : "#2e8b57", 0.5)} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.9, 20]} />
        </mesh>
      ))}
      {/* espelho (pro moicano) */}
      <group position={[-x1 + 0.12, 1.6, -1.5]} rotation={[0, Math.PI / 2, 0]}>
        <mesh geometry={rbox(0.8, 1.1, 0.05, 0.03)} material={sm("#c98a4e", 0.6)} />
        <mesh position={[0, 0, 0.03]} material={sm("#cfeaf7", 0.08, {emissive: "#9fd8ff", emissiveIntensity: 0.25})}>
          <planeGeometry args={[0.7, 1.0]} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- polvo mecânico ---------- */
export type OctoP = {pos?: V3; rotY?: number; t?: number; blink?: number; mouth?: number; tools?: boolean; work?: number; shades?: boolean; foam?: number; tapFeet?: number; thumbs?: number; s?: number; scissors?: V3; tips?: Partial<Record<number, V3>>; lean?: number; wrench?: boolean};
/* braços: ângulo a partir da frente (+z), 0..3 à direita (+x), 4..7 à esquerda */
const ARM_A = Array.from({length: 8}, (_, i) => ((i + 0.5) / 8) * Math.PI * 2);
const ARM_WORK: V3[] = [
  [0.6, 1.0, 0.62], // café
  [1.2, 1.55, 0.3], // chave
  [1.3, 0.85, 0.15], // bateria
  [0.62, 0.04, -0.72], // perna
  [-0.62, 0.04, -0.72], // perna
  [-1.3, 0.85, 0.15], // óleo
  [-1.2, 1.55, 0.3], // pneu
  [-0.6, 1.0, 0.62], // livre / tesoura
];
const ARM_THUMB: V3[] = [ARM_WORK[0], [0.95, 2.1, 0.35], ARM_WORK[2], ARM_WORK[3], ARM_WORK[4], ARM_WORK[5], [-0.95, 2.1, 0.35], ARM_WORK[7]];
const restTip = (i: number): V3 => (i === 1 ? [0.95, 1.2, 0.5] : [Math.sin(ARM_A[i]) * 1.05, 0.04, Math.cos(ARM_A[i]) * 0.95]);
/** ponta do braço i (espaço do polvo) */
export const octoTip = (i: number, o: OctoP): V3 => {
  const {t = 0, work = 0, thumbs = 0, tapFeet = 0, scissors, tips} = o;
  const ov = tips?.[i] ?? (i === 7 && scissors ? scissors : undefined);
  if (ov) return [ov[0] + 0.02 * Math.sin(t * 7), ov[1] + 0.02 * Math.sin(t * 9), ov[2]];
  const r = restTip(i);
  const w = ARM_WORK[i];
  const k = i === 3 || i === 4 ? 1 : work;
  const wig = 0.1 * Math.sin(t * (4 + i * 0.7) + i) * k * (i === 3 || i === 4 ? 0 : 1);
  let p: V3 = [lerp(r[0], w[0], k), lerp(r[1], w[1], k) + wig, lerp(r[2], w[2], k)];
  if (thumbs > 0) p = [lerp(p[0], ARM_THUMB[i][0], thumbs), lerp(p[1], ARM_THUMB[i][1], thumbs), lerp(p[2], ARM_THUMB[i][2], thumbs)];
  if (p[1] < 0.1) p[1] += 0.1 * Math.abs(Math.sin(t * 11 + i * 1.3)) * tapFeet;
  return p;
};
/** chave inglesa (segura pelo cabo; cabeça pra cima) */
export const ChaveInglesa: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const steel = sm("#c9ced6", 0.22, {metalness: 0.75});
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.16, 0]} geometry={rbox(0.075, 0.36, 0.03, 0.03)} material={steel} castShadow />
      <mesh position={[0, 0.02, 0]} geometry={rbox(0.085, 0.12, 0.04, 0.03)} material={sm("#e8414f", 0.4)} />
      {/* cabeça: mandíbula fixa + móvel e a rosca */}
      <mesh position={[0.0, 0.37, 0]} geometry={rbox(0.12, 0.1, 0.035, 0.02)} material={steel} castShadow />
      <mesh position={[0.07, 0.43, 0]} geometry={rbox(0.11, 0.05, 0.035, 0.015)} material={steel} />
      <mesh position={[0.06, 0.33, 0]} geometry={rbox(0.09, 0.045, 0.035, 0.015)} material={steel} />
      <mesh position={[-0.01, 0.335, 0.0]} rotation={[0, 0, Math.PI / 2]} material={sm("#8c919b", 0.3, {metalness: 0.7})}>
        <cylinderGeometry args={[0.022, 0.022, 0.07, 10]} />
      </mesh>
    </group>
  );
};
const Tool: React.FC<{i: number}> = ({i}) => {
  switch (i) {
    case 0:
      return <Cup p={[0, 0.02, 0]} s={1.5} />;
    case 1:
      return (
        <group rotation={[0, 0, 0.5]}>
          <mesh position={[0, 0.12, 0]} material={sm("#9aa0aa", 0.25, {metalness: 0.7})}>
            <boxGeometry args={[0.05, 0.34, 0.025]} />
          </mesh>
          <mesh position={[0, 0.3, 0]} material={sm("#9aa0aa", 0.25, {metalness: 0.7})}>
            <torusGeometry args={[0.055, 0.02, 8, 16, Math.PI * 1.5]} />
          </mesh>
        </group>
      );
    case 2:
      return (
        <group position={[0.08, 0.05, 0]}>
          <mesh geometry={rbox(0.26, 0.2, 0.16, 0.025)} material={sm("#2b2e3b", 0.5)} />
          <mesh position={[-0.07, 0.12, 0]} material={sm("#e8414f", 0.5)}>
            <cylinderGeometry args={[0.025, 0.025, 0.05, 10]} />
          </mesh>
          <mesh position={[0.07, 0.12, 0]} material={sm("#101018", 0.5)}>
            <cylinderGeometry args={[0.025, 0.025, 0.05, 10]} />
          </mesh>
        </group>
      );
    case 5:
      return (
        <group position={[-0.08, 0.05, 0]}>
          <mesh geometry={rbox(0.2, 0.28, 0.1, 0.03)} material={sm("#ffd21f", 0.45)} />
          <mesh position={[0.04, 0.17, 0]} material={sm("#101018", 0.5)}>
            <cylinderGeometry args={[0.025, 0.03, 0.07, 10]} />
          </mesh>
          <mesh position={[0, 0, 0.052]} material={sm("#101018", 0.5)}>
            <planeGeometry args={[0.14, 0.06]} />
          </mesh>
        </group>
      );
    case 6:
      return (
        <mesh rotation={[0, 0.4, 0]} material={sm("#1d1f27", 0.6)}>
          <torusGeometry args={[0.2, 0.085, 10, 22]} />
        </mesh>
      );
    default:
      return null;
  }
};
/** tubo afinando (tentáculo) */
const taperTube = (curve: THREE.Curve<THREE.Vector3>, r0: number, r1: number, seg = 22, rad = 12) => {
  const g = new THREE.TubeGeometry(curve, seg, 1, rad, false);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const v = new THREE.Vector3();
  for (let i = 0; i <= seg; i++) {
    const u = i / seg;
    const c = curve.getPointAt(u);
    const r = r0 + (r1 - r0) * u;
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j;
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  g.computeVertexNormals();
  return g;
};
export const OCTO_MANTLE_Y = 1.1;
export const Octopus: React.FC<{o: OctoP; children?: React.ReactNode}> = ({o, children}) => {
  const {pos = [0, 0, 0], rotY = 0, t = 0, blink = 0, mouth = 0, tools = false, shades = false, foam = 0, s = 1, scissors, lean = 0, wrench = true} = o;
  const skin = sm("#9b59b6", 0.4);
  const skin2 = sm("#d7b4e6", 0.45);
  const blue = sm("#2e5bd0", 0.6);
  const eyeY = Math.max(0.1, 1 - blink);
  const MY = OCTO_MANTLE_Y;
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      {children}
      {/* 8 braços */}
      {ARM_A.map((ang, i) => {
        const tip = octoTip(i, o);
        const base: V3 = [Math.sin(ang) * 0.3, 0.58, Math.cos(ang) * 0.28];
        const ctrl: V3 = [Math.sin(ang) * 0.85, Math.min(0.3, tip[1] * 0.4) + 0.05, Math.cos(ang) * 0.75];
        const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(...base), new THREE.Vector3(...ctrl), new THREE.Vector3(...tip));
        return (
          <group key={i}>
            <mesh geometry={taperTube(curve, 0.13, 0.045)} material={skin} castShadow />
            <mesh position={tip} material={skin}>
              <sphereGeometry args={[0.046, 10, 8]} />
            </mesh>
            {[0.3, 0.5, 0.7].map((u) => {
              const q = curve.getPointAt(u);
              return (
                <mesh key={u} position={[q.x, q.y - 0.12 * (1 - 0.65 * u) + 0.015, q.z]} scale={[1, 0.45, 1]} material={skin2}>
                  <sphereGeometry args={[0.05 * (1 - 0.5 * u), 10, 8]} />
                </mesh>
              );
            })}
            {tools && i !== 1 && (
              <group position={tip}>
                <Tool i={i} />
              </group>
            )}
            {wrench && i === 1 && <ChaveInglesa p={[tip[0], tip[1] - 0.06, tip[2]]} r={[0, -0.5, -0.35]} s={1.5} />}
            {i === 7 && scissors && <Scissors p={tip} t={t} s={1.6} />}
            {foam > 0.01 &&
              [0.35, 0.6, 0.85].map((u, k) => {
                const q = curve.getPointAt(u);
                return (
                  <mesh key={"f" + k} position={[q.x, q.y + 0.09, q.z]} material={sm("#ffffff", 0.6)}>
                    <sphereGeometry args={[0.075 * foam + 0.015 * Math.sin(t * 5 + k + i), 10, 8]} />
                  </mesh>
                );
              })}
          </group>
        );
      })}
      <group rotation={[lean, 0, 0]} position={[0, 0.5, 0]}>
        <group position={[0, -0.5, 0]}>
          {/* cabeça (manto) */}
          <mesh position={[0, MY, -0.02]} scale={[0.55, 0.65, 0.52]} material={skin} castShadow>
            <sphereGeometry args={[1, 32, 24]} />
          </mesh>
          {/* macacão jeans: calça cobrindo a parte de baixo + peitilho com bolso e botões */}
          <mesh position={[0, MY, -0.02]} scale={[0.55 * 1.035, 0.65 * 1.035, 0.52 * 1.035]} material={blue} castShadow>
            <sphereGeometry args={[1, 32, 12, 0, Math.PI * 2, Math.PI * 0.62, Math.PI * 0.38]} />
          </mesh>
          <mesh position={[0, MY - 0.245, -0.02]} rotation={[Math.PI / 2, 0, 0]} scale={[0.55 * 1.04 * 0.93, 0.52 * 1.04 * 0.93, 1]} material={sm("#1f3f9a", 0.6)}>
            <torusGeometry args={[1, 0.022, 8, 40]} />
          </mesh>
          <mesh position={[0, 0.875, 0.49]} rotation={[0.29, 0, 0]} geometry={rbox(0.44, 0.15, 0.035, 0.03)} material={blue} />
          <mesh position={[0, 0.86, 0.51]} rotation={[0.29, 0, 0]} geometry={rbox(0.17, 0.08, 0.015, 0.015)} material={sm("#4a7be0", 0.6)} />
          {[-1, 1].map((sd) => (
            <mesh key={"bt" + sd} position={[0.17 * sd, 0.925, 0.5]} material={sm("#ffd21f", 0.35, {metalness: 0.3})}>
              <sphereGeometry args={[0.028, 10, 8]} />
            </mesh>
          ))}
          {/* olhos */}
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.19 * sd, MY + 0.08, 0.44]} rotation={[0, 0.32 * sd, 0]} scale={[1, eyeY, 1]}>
              <mesh scale={[0.13, 0.15, 0.06]} material={sm("#ffffff", 0.2)}>
                <sphereGeometry args={[1, 18, 14]} />
              </mesh>
              <mesh position={[0, 0, 0.05]} scale={[0.07, 0.085, 0.04]} material={sm("#0c0c10", 0.1)}>
                <sphereGeometry args={[1, 14, 10]} />
              </mesh>
              <mesh position={[0.02, 0.035, 0.085]} scale={0.02} material={sm("#ffffff", 0.2)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
          {shades && (
            <group position={[0, MY + 0.09, 0.51]}>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.19 * sd, 0, 0]} rotation={[0, 0.32 * sd, 0]} geometry={rbox(0.27, 0.18, 0.03, 0.07)} material={sm("#0b0b10", 0.1)} />
              ))}
              <mesh position={[0, 0.03, 0.015]} geometry={rbox(0.12, 0.03, 0.02, 0.01)} material={sm("#0b0b10", 0.1)} />
            </group>
          )}
          {/* bigodão */}
          <group position={[0, 1.035, 0.5]}>
            {[-1, 1].map((sd) => (
              <group key={"bg" + sd}>
                <mesh position={[0.1 * sd, 0, 0]} rotation={[0, 0.3 * sd, -0.28 * sd]} scale={[0.135, 0.055, 0.06]} material={sm("#3b2416", 0.55)} castShadow>
                  <sphereGeometry args={[1, 16, 10]} />
                </mesh>
                <mesh position={[0.225 * sd, 0.03, -0.04]} material={sm("#3b2416", 0.55)}>
                  <sphereGeometry args={[0.035, 10, 8]} />
                </mesh>
              </group>
            ))}
          </group>
          {mouth > 0.05 ? (
            <mesh position={[0, 0.96, 0.49]} scale={[0.08, 0.02 + 0.045 * mouth, 0.03]} material={sm("#3a1510", 0.5)}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          ) : (
            <mesh position={[0, 0.975, 0.495]} rotation={[0.25, 0, Math.PI + 0.55]} material={sm("#3a1510", 0.5)}>
              <torusGeometry args={[0.07, 0.013, 8, 18, Math.PI * 0.62]} />
            </mesh>
          )}
          {/* boné */}
          <group position={[0, MY + 0.52, -0.04]} rotation={[-0.12, 0, 0.08]}>
            <mesh scale={[1.02, 0.62, 1.02]} material={sm("#e8414f", 0.6)} castShadow>
              <sphereGeometry args={[0.36, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0.01, 0.37]} rotation={[0.12, 0, 0]} geometry={rbox(0.42, 0.03, 0.26, 0.012)} material={sm("#e8414f", 0.6)} />
          </group>
        </group>
      </group>
    </group>
  );
};
/** tesoura */
export const Scissors: React.FC<{p: V3; t: number; s?: number}> = ({p, t, s = 1}) => {
  const open = 0.3 + 0.25 * Math.abs(Math.sin(t * 14));
  return (
    <group position={p} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} rotation={[0, 0, sd * open]}>
          <mesh position={[0, 0.09, 0]} material={sm("#c9ced6", 0.2, {metalness: 0.7})}>
            <boxGeometry args={[0.02, 0.18, 0.01]} />
          </mesh>
          <mesh position={[0, -0.06, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e8414f", 0.4)}>
            <torusGeometry args={[0.035, 0.01, 6, 12]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};
/** fios de cabelo caindo */
export const HairBits: React.FC<{p: V3; k: number; t: number}> = ({p, k, t}) => {
  if (k < 0.01) return null;
  return (
    <group position={p}>
      {Array.from({length: 14}, (_, i) => {
        const ph = (t * 0.9 + i / 14) % 1;
        return (
          <mesh key={i} position={[0.3 * Math.sin(i * 2.3), -ph * 1.4, 0.3 * Math.cos(i * 1.7)]} rotation={[i, ph * 5, i * 0.5]} material={sm("#3b2416", 0.5)}>
            <boxGeometry args={[0.012, 0.07, 0.012]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- robô (o carro transformado): ~3,95 de altura em escala 1 ---------- */
const RobotArm: React.FC<{sd: number; rot: V3; elbow: number; body: THREE.Material; steel: THREE.Material; dark: THREE.Material; mic?: boolean; wave?: number}> = ({sd, rot, elbow, body, steel, dark, mic}) => (
  <group position={[0.98 * sd, 2.65, 0]} rotation={rot}>
    {/* ombro = roda */}
    <group rotation={[0, 0, Math.PI / 2]}>
      <mesh material={dark} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.26, 26]} />
      </mesh>
      <mesh position={[0, 0.135 * sd, 0]} material={steel}>
        <cylinderGeometry args={[0.15, 0.15, 0.02, 18]} />
      </mesh>
    </group>
    <mesh position={[0, -0.3, 0]} material={steel} castShadow>
      <cylinderGeometry args={[0.11, 0.11, 0.5, 14]} />
    </mesh>
    <group position={[0, -0.55, 0]} rotation={[elbow, 0, 0]}>
      <mesh material={dark}>
        <sphereGeometry args={[0.15, 14, 10]} />
      </mesh>
      <mesh position={[0, -0.3, 0]} geometry={rbox(0.3, 0.5, 0.32, 0.08)} material={body} castShadow />
      <mesh position={[0, -0.3, 0.165]} geometry={rbox(0.18, 0.06, 0.02, 0.02)} material={sm("#ffb020", 0.3, {emissive: "#ff9a1f", emissiveIntensity: 0.6})} />
      {/* mão de 3 dedos */}
      <group position={[0, -0.62, 0]}>
        <mesh material={steel}>
          <sphereGeometry args={[0.13, 14, 10]} />
        </mesh>
        {[-1, 0, 1].map((k) => (
          <mesh key={k} position={[0.07 * k, -0.11, 0.06 * Math.abs(k) - 0.03]} rotation={[0.5, 0, 0.25 * k]} geometry={rbox(0.06, 0.16, 0.06, 0.025)} material={dark} />
        ))}
        {mic && (
          <group position={[0, -0.12, 0.02]}>
            <mesh material={sm("#2b2e3b", 0.35)}>
              <cylinderGeometry args={[0.04, 0.032, 0.26, 12]} />
            </mesh>
            <mesh position={[0, -0.17, 0]} material={sm("#9aa0aa", 0.25, {metalness: 0.6})}>
              <sphereGeometry args={[0.085, 14, 10]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  </group>
);
export const CarRobot: React.FC<{p: V3; rotY?: number; t?: number; dance?: number; k?: number; mic?: boolean; mouth?: number; s?: number; look?: [number, number]}> = ({p, rotY = 0, t = 0, dance = 0, k = 1, mic = true, mouth = 0, s = 1, look = [0, 0]}) => {
  const body = sm("#e8414f", 0.28, {metalness: 0.15});
  const dark = sm("#1d1f27", 0.4);
  const steel = sm("#c9ced6", 0.28, {metalness: 0.6});
  const glass = sm("#9fd8ff", 0.08, {metalness: 0.2});
  const ph = t * 6;
  const sway = dance * 0.12 * Math.sin(ph);
  const bob = dance * 0.12 * Math.abs(Math.sin(ph));
  const nod = dance * 0.1 * Math.sin(ph * 2);
  if (k < 0.01) return null;
  const rArm: V3 = mic ? [-1.774 + 0.06 * Math.sin(ph), -0.704, -0.538] : [-0.4 - 0.9 * dance * (0.5 + 0.5 * Math.sin(ph)), 0, -0.35 - 0.5 * dance];
  const lArm: V3 = [-0.3 - 0.5 * dance * (0.5 + 0.5 * Math.sin(ph + Math.PI)), 0, 0.35 + 1.3 * dance * (0.5 + 0.5 * Math.sin(ph + Math.PI))];
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s * k}>
      {/* pernas: pés com pneu, canela vermelha, joelho cromado, coxa de pistão */}
      {[-1, 1].map((sd) => {
        const lift = dance * 0.12 * Math.max(0, Math.sin(ph + (sd > 0 ? 0 : Math.PI)));
        return (
          <group key={sd} position={[0.45 * sd, lift, 0]}>
            <mesh position={[0, 0.14, 0.08]} geometry={rbox(0.55, 0.28, 0.8, 0.1)} material={dark} castShadow />
            <mesh position={[0.29 * sd, 0.2, 0.0]} rotation={[0, 0, Math.PI / 2]} material={sm("#2b2e3b", 0.6)}>
              <cylinderGeometry args={[0.22, 0.22, 0.1, 22]} />
            </mesh>
            <mesh position={[0.35 * sd, 0.2, 0.0]} rotation={[0, 0, Math.PI / 2]} material={steel}>
              <cylinderGeometry args={[0.11, 0.11, 0.02, 16]} />
            </mesh>
            <mesh position={[0, 0.72, 0]} geometry={rbox(0.44, 0.85, 0.48, 0.1)} material={body} castShadow />
            <mesh position={[0, 0.72, 0.245]} geometry={rbox(0.26, 0.5, 0.02, 0.05)} material={glass} />
            <mesh position={[0, 1.2, 0.05]} material={steel} castShadow>
              <sphereGeometry args={[0.17, 16, 12]} />
            </mesh>
            <mesh position={[0, 1.42, 0]} material={steel} castShadow>
              <cylinderGeometry args={[0.13, 0.15, 0.4, 14]} />
            </mesh>
          </group>
        );
      })}
      <group position={[0, bob, 0]} rotation={[0, 0, sway]}>
        {/* quadril */}
        <mesh position={[0, 1.66, 0]} geometry={rbox(1.05, 0.3, 0.55, 0.1)} material={dark} castShadow />
        {/* tronco = frente do carro */}
        <mesh position={[0, 2.3, 0]} geometry={rbox(1.6, 1.15, 0.9, 0.22)} material={body} castShadow />
        <mesh position={[0, 2.58, 0.4]} rotation={[-0.25, 0, 0]} geometry={rbox(1.15, 0.42, 0.05, 0.07)} material={glass} />
        {/* grade no peito */}
        <mesh position={[0, 2.02, 0.455]} geometry={rbox(0.9, 0.34, 0.03, 0.06)} material={dark} />
        {[-0.3, -0.1, 0.1, 0.3].map((x) => (
          <mesh key={x} position={[x, 2.02, 0.475]} geometry={rbox(0.05, 0.26, 0.02, 0.015)} material={steel} />
        ))}
        {/* faróis do peito */}
        {[-1, 1].map((sd) => (
          <mesh key={"f" + sd} position={[0.62 * sd, 2.05, 0.43]} scale={[1, 1, 0.4]} material={sm("#fff6c8", 0.2, {emissive: "#ffe9a0", emissiveIntensity: 0.9})}>
            <sphereGeometry args={[0.12, 16, 12]} />
          </mesh>
        ))}
        <mesh position={[0, 1.8, 0.47]} material={tm("placa-carro", plateTex(), 0.5)}>
          <planeGeometry args={[0.42, 0.13]} />
        </mesh>
        {/* portas nas costas (asas) */}
        {[-1, 1].map((sd) => (
          <group key={"p" + sd} position={[0.6 * sd, 2.45, -0.5]} rotation={[0.15, sd * 0.55, sd * 0.25]}>
            <mesh position={[0.45 * sd, 0, 0]} geometry={rbox(0.9, 0.8, 0.08, 0.1)} material={body} castShadow />
            <mesh position={[0.45 * sd, 0.15, 0.045]} geometry={rbox(0.62, 0.32, 0.02, 0.06)} material={glass} />
          </group>
        ))}
        {/* escapamentos nos ombros, soltando fumaça */}
        {[-1, 1].map((sd) => (
          <group key={"x" + sd} position={[0.62 * sd, 3.0, -0.3]}>
            <mesh material={steel}>
              <cylinderGeometry args={[0.07, 0.07, 0.4, 12]} />
            </mesh>
            {[0, 1].map((i) => {
              const q = (t * 0.7 + i * 0.5 + (sd > 0 ? 0.25 : 0)) % 1;
              return (
                <mesh key={i} position={[0, 0.3 + q * 0.8, 0]} material={sm("#d8dbe2", 0.9, {transparent: true, opacity: 0.55 * (1 - q)})}>
                  <sphereGeometry args={[0.08 + 0.14 * q, 10, 8]} />
                </mesh>
              );
            })}
          </group>
        ))}
        <RobotArm sd={1} rot={rArm} elbow={mic ? -1.151 : -0.5 - 0.4 * dance} body={body} steel={steel} dark={dark} mic={mic} />
        <RobotArm sd={-1} rot={lArm} elbow={-0.6 - 0.5 * dance} body={body} steel={steel} dark={dark} />
        {/* cabeça = cabine, com os mesmos olhos do carro */}
        <group position={[0, 3.25, 0.02]} rotation={[nod, 0, -sway * 0.6]}>
          <mesh position={[0, -0.32, 0]} material={steel}>
            <cylinderGeometry args={[0.16, 0.2, 0.2, 14]} />
          </mesh>
          <mesh geometry={rbox(1.0, 0.68, 0.78, 0.22)} material={body} castShadow />
          <mesh position={[0, 0.3, 0]} geometry={rbox(0.9, 0.12, 0.7, 0.05)} material={glass} />
          {[-1, 1].map((sd) => (
            <group key={"e" + sd} position={[0.24 * sd, 0.06, 0.4]}>
              <CarEye sd={sd} r={0.15} look={look} body={body} />
            </group>
          ))}
          {/* boca = grade que abre cantando */}
          <group position={[0, -0.2, 0.395]}>
            <mesh scale={[1, 0.35 + 1.2 * mouth, 1]} geometry={rbox(0.38, 0.12, 0.03, 0.04)} material={sm("#3a1510", 0.5)} />
            {[-0.12, 0, 0.12].map((x) => (
              <mesh key={x} position={[x, 0.02 + 0.05 * mouth, 0.02]} geometry={rbox(0.025, 0.07 * (0.35 + 1.2 * mouth), 0.02, 0.01)} material={steel} />
            ))}
          </group>
          {/* retrovisores = orelhas */}
          {[-1, 1].map((sd) => (
            <group key={"r" + sd} position={[0.55 * sd, 0.05, 0.1]} rotation={[0, 0, -0.2 * sd]}>
              <mesh geometry={rbox(0.12, 0.2, 0.14, 0.04)} material={body} />
              <mesh position={[0.065 * sd, 0, 0]} rotation={[0, (Math.PI / 2) * sd, 0]} material={glass}>
                <planeGeometry args={[0.1, 0.14]} />
              </mesh>
            </group>
          ))}
          <mesh position={[0, 0.48, 0]} material={steel}>
            <cylinderGeometry args={[0.02, 0.02, 0.32, 8]} />
          </mesh>
          <mesh position={[0, 0.66, 0]} material={sm("#ffd21f", 0.3, {emissive: "#ffd21f", emissiveIntensity: 0.6 + 0.6 * Math.abs(Math.sin(t * 8))})}>
            <sphereGeometry args={[0.07, 12, 10]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};
/** conta que desenrola até o chão */
const notaTex = () =>
  canvasTex("nota-polvo", 256, 1024, (c) => {
    c.fillStyle = "#fffdf5";
    c.fillRect(0, 0, 256, 1024);
    c.fillStyle = "#101018";
    c.font = "bold 30px monospace";
    c.textAlign = "center";
    c.fillText("OFICINA DO POLVO", 128, 50);
    c.font = "22px monospace";
    const itens = ["PNEU", "ÓLEO", "BATERIA", "CAFEZINHO", "CORTE MOICANO", "PARAFUSO EXTRA", "ROBÔ", "BRAÇO 1", "BRAÇO 2", "BRAÇO 3", "BRAÇO 4", "BRAÇO 5", "BRAÇO 6", "BRAÇO 7", "BRAÇO 8"];
    itens.forEach((s, i) => {
      c.textAlign = "left";
      c.fillText(s, 20, 110 + i * 52);
      c.textAlign = "right";
      c.fillText("x8", 236, 110 + i * 52);
    });
    c.font = "bold 40px monospace";
    c.textAlign = "center";
    c.fillStyle = "#e8262d";
    c.fillText("TOTAL: x8!!!", 128, 960);
  });
const stripGeo = (w: number, len: number, v0: number) => {
  const g = new THREE.PlaneGeometry(w, Math.max(0.001, len));
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) > 0.5 ? v0 : v0 - len / 1.6);
  return g;
};
/** conta que desenrola: pendurada em p, cai até o chão (hang) e o resto se amontoa pra frente */
export const Receipt: React.FC<{p: V3; len: number; hang: number}> = ({p, len, hang}) => {
  if (len < 0.01) return null;
  const tx = notaTex();
  tx.wrapT = THREE.RepeatWrapping;
  const m = tm("nota-polvo", tx, 0.8, {side: THREE.DoubleSide});
  const v1 = Math.min(len, hang);
  const v2 = Math.max(0, len - hang);
  return (
    <group position={p}>
      <mesh position={[0, -v1 / 2, 0]} geometry={stripGeo(0.4, v1, 1)} material={m} castShadow />
      {v2 > 0.01 && <mesh position={[0, -hang + 0.006, v2 / 2]} rotation={[-Math.PI / 2, 0, 0]} geometry={stripGeo(0.4, v2, 1 - v1 / 1.6)} material={m} />}
    </group>
  );
};
/** mosquinha voando */
export const Fly: React.FC<{p: V3; t: number; k?: number}> = ({p, t, k = 1}) => {
  if (k < 0.01) return null;
  const q: V3 = [p[0] + 0.25 * Math.sin(t * 5) * k, p[1] + 0.4 * k + 0.1 * Math.sin(t * 9), p[2] + 0.2 * Math.cos(t * 6) * k];
  return (
    <group position={q}>
      <mesh material={sm("#15161d", 0.5)}>
        <sphereGeometry args={[0.03, 10, 8]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.03 * sd, 0.02, 0]} rotation={[0, 0, sd * (0.5 + 0.4 * Math.sin(t * 80))]} scale={[0.04, 0.012, 0.025]} material={sm("#dff3ff", 0.2, {transparent: true, opacity: 0.6})}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      ))}
    </group>
  );
};
/** esponja */
export const Sponge: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.18, 0.08, 0.12, 0.03)} material={sm("#ffd21f", 0.9)} />
    <mesh position={[0, 0.045, 0]} geometry={rbox(0.18, 0.025, 0.12, 0.01)} material={sm("#2ecc71", 0.8)} />
  </group>
);
/** chave do carro com chaveirinho */
export const CarKey: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, -0.03, 0]} geometry={rbox(0.06, 0.07, 0.025, 0.012)} material={sm("#1d1f27", 0.4)} />
    <mesh position={[0, -0.1, 0]} material={sm("#c9ced6", 0.25, {metalness: 0.8})}>
      <boxGeometry args={[0.022, 0.09, 0.008]} />
    </mesh>
    <mesh position={[0, 0.015, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ffcc33", 0.3, {metalness: 0.7})}>
      <torusGeometry args={[0.025, 0.005, 6, 14]} />
    </mesh>
    <mesh position={[0.035, 0.03, 0]} rotation={[0, 0, -0.4]} geometry={rbox(0.04, 0.06, 0.012, 0.01)} material={sm("#e8414f", 0.5)} />
  </group>
);
/** celular */
export const Phone: React.FC<{p?: V3; r?: V3; s?: number; ring?: number; t?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, ring = 0, t = 0}) => (
  <group position={p} rotation={[r[0], r[1], r[2] + ring * 0.12 * Math.sin(t * 50)]} scale={s}>
    <mesh geometry={rbox(0.085, 0.17, 0.014, 0.012)} material={sm("#1d1f27", 0.3)} />
    <mesh position={[0, 0, 0.0075]} material={sm("#5ad1ff", 0.2, {emissive: "#3aa0ff", emissiveIntensity: 0.4 + 0.6 * ring})}>
      <planeGeometry args={[0.072, 0.15]} />
    </mesh>
  </group>
);
/** pandeiro (segura pela borda) */
export const Pandeiro: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#b07a45", 0.6)}>
      <cylinderGeometry args={[0.16, 0.16, 0.05, 24, 1, true]} />
    </mesh>
    <mesh position={[0, 0, 0.024]} material={sm("#fff3df", 0.7)}>
      <circleGeometry args={[0.158, 24]} />
    </mesh>
    {Array.from({length: 5}, (_, i) => {
      const a = (i / 5) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.165, Math.sin(a) * 0.165, 0]} rotation={[0, 0, a]} material={sm("#d9dde3", 0.25, {metalness: 0.8})}>
          <cylinderGeometry args={[0.022, 0.022, 0.01, 12]} />
        </mesh>
      );
    })}
  </group>
);
/** touca branca de pasteleiro (espaço da cabeça) */
export const PaperHat: React.FC = () => (
  <group position={[0, 0.24, -0.02]} rotation={[-0.1, 0, 0]}>
    <mesh scale={[1.05, 0.55, 1.05]} material={sm("#ffffff", 0.7)} castShadow>
      <sphereGeometry args={[0.35, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
    </mesh>
    <mesh position={[0, 0.02, 0]} material={sm("#f0f0f0", 0.7)}>
      <cylinderGeometry args={[0.37, 0.37, 0.07, 28]} />
    </mesh>
  </group>
);
/** balde com espuma */
export const Bucket: React.FC<{p: V3; t?: number}> = ({p, t = 0}) => (
  <group position={p}>
    <mesh position={[0, 0.18, 0]} material={sm("#3a86ff", 0.5)} castShadow>
      <cylinderGeometry args={[0.22, 0.18, 0.36, 20, 1, true]} />
    </mesh>
    <mesh position={[0, 0.02, 0]} material={sm("#3a86ff", 0.5)}>
      <cylinderGeometry args={[0.18, 0.18, 0.04, 20]} />
    </mesh>
    {Array.from({length: 7}, (_, i) => (
      <mesh key={i} position={[0.12 * Math.cos(i * 0.9), 0.36 + 0.03 * Math.sin(t * 3 + i), 0.12 * Math.sin(i * 0.9)]} material={sm("#ffffff", 0.6)}>
        <sphereGeometry args={[0.07 + 0.02 * (i % 3), 10, 8]} />
      </mesh>
    ))}
  </group>
);
