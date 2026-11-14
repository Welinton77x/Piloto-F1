import React, {useMemo} from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import type {ToyLook} from "./Toy";
import {sm, rbox} from "./Sets9";
import {canvasTex, rng, woodTex} from "./util";

/* ===== Casamento: noiva, noivo e objetos ===== */

/** a noiva (feita a partir da foto: cabelo preto liso comprido repartido no meio, pele morena) */
const HER_BASE: ToyLook = {skin: "#dfac80", hair: "#141114", hairStyle: "straight", lashes: true, lips: "#a4505a"};
export const HER_CASUAL: ToyLook = {...HER_BASE, polo: true, shirt: "#6a4c3a", pants: "#4a72a8", flare: true, shoe: "#efe3cf", sole: "#9a6a44"};
export const HER_BRIDE: ToyLook = {...HER_BASE, dress: true, veil: true, shirt: "#fbfaf6"};
/** o noivo (o boneco do canal) de terno */
export const GROOM: ToyLook = {suit: true, shirt: "#1d1f27", pants: "#1d1f27", shoe: "#15161d", sole: "#15161d"};

/** buquê de flores (cabinhos pra baixo; segura em y=0) */
export const Bouquet: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const flowers: [number, number, number, string][] = [
    [0, 0.2, 0, "#ffffff"],
    [0.08, 0.17, 0.05, "#ffb3c6"],
    [-0.08, 0.17, 0.04, "#ffffff"],
    [0.05, 0.16, -0.08, "#ffd1dc"],
    [-0.06, 0.16, -0.07, "#ffb3c6"],
    [0.11, 0.12, -0.02, "#ffffff"],
    [-0.11, 0.12, 0.0, "#ffd1dc"],
    [0.0, 0.14, 0.1, "#ffd1dc"],
  ];
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, -0.05, 0]} material={sm("#5c9e3e", 0.6)}>
        <cylinderGeometry args={[0.035, 0.025, 0.22, 10]} />
      </mesh>
      <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#f7f1e3", 0.5)}>
        <torusGeometry args={[0.04, 0.018, 8, 16]} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <mesh key={"l" + i} position={[Math.cos(a) * 0.1, 0.1, Math.sin(a) * 0.1]} rotation={[Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9]} scale={[0.05, 0.11, 0.025]} material={sm("#4c9a35", 0.6)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        );
      })}
      {flowers.map(([x, y, z, c], i) => (
        <group key={i} position={[x, y, z]}>
          <mesh material={sm(c, 0.55)} castShadow>
            <sphereGeometry args={[0.055, 14, 10]} />
          </mesh>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm(new THREE.Color(c).multiplyScalar(0.9).getStyle(), 0.6)}>
            <torusGeometry args={[0.03, 0.012, 6, 14]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* ===================== cenário do casamento ===================== */

export const ARCH_P: V3 = [0, 0, -3.2];
export const PARTY: V3 = [14, 0, 0];

/** arco de flores do altar (de frente pra +z) */
export const FlowerArch: React.FC<{p: V3}> = ({p}) => {
  const white = sm("#ffffff", 0.5);
  const flowers = useMemo(() => {
    const r = rng(5);
    return Array.from({length: 46}, (_, i) => {
      const a = (i / 45) * Math.PI;
      const rr = 1.15 + (r() - 0.5) * 0.12;
      return {pos: [Math.cos(a) * rr, 2.45 + Math.sin(a) * rr, (r() - 0.5) * 0.2] as V3, c: ["#ffffff", "#ffb3c6", "#ffd1dc", "#f7a1b5"][i % 4], s: 0.09 + r() * 0.06};
    });
  }, []);
  return (
    <group position={p}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[1.15 * sd, 0, 0]}>
          <mesh position={[0, 1.22, 0]} material={white} castShadow>
            <cylinderGeometry args={[0.07, 0.08, 2.45, 16]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={sm("#c0c0c8", 0.5)} castShadow>
            <cylinderGeometry args={[0.28, 0.32, 0.4, 20]} />
          </mesh>
          <mesh position={[0, 0.48, 0]} material={sm("#4c9a35", 0.7)} castShadow>
            <sphereGeometry args={[0.3, 16, 12]} />
          </mesh>
          {[0.55, 0.62, 0.5].map((y, i) => (
            <mesh key={i} position={[0.15 * Math.cos(i * 2), y + 0.12, 0.15 * Math.sin(i * 2)]} material={sm(["#ffffff", "#ffb3c6", "#ffd1dc"][i], 0.5)}>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 2.45, 0]} material={white} castShadow>
        <torusGeometry args={[1.15, 0.07, 10, 40, Math.PI]} />
      </mesh>
      {flowers.map((f, i) => (
        <mesh key={i} position={f.pos} material={sm(f.c, 0.55)} castShadow>
          <sphereGeometry args={[f.s, 12, 10]} />
        </mesh>
      ))}
      {flowers.filter((_, i) => i % 3 === 0).map((f, i) => (
        <mesh key={"l" + i} position={[f.pos[0] * 1.05, f.pos[1] - 0.05, f.pos[2] + 0.06]} scale={[0.12, 0.06, 0.03]} material={sm("#4c9a35", 0.6)}>
          <sphereGeometry args={[1, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
};
/** cadeira branca baixinha (assento a 0,3 — o boneco senta com os pés no chão) */
export const CHAIR_SEAT = 0.3;
export const WeddingChair: React.FC<{p: V3; rotY?: number; bow?: boolean}> = ({p, rotY = 0, bow = true}) => {
  const w = sm("#f7f7f4", 0.45);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, CHAIR_SEAT - 0.025, 0]} geometry={rbox(0.5, 0.05, 0.46, 0.02)} material={w} castShadow receiveShadow />
      {[-1, 1].map((sx) =>
        [-1, 1].map((sz) => (
          <mesh key={`${sx}${sz}`} position={[0.21 * sx, (CHAIR_SEAT - 0.05) / 2, 0.19 * sz]} material={w} castShadow>
            <cylinderGeometry args={[0.02, 0.02, CHAIR_SEAT - 0.05, 8]} />
          </mesh>
        )),
      )}
      {[-1, 1].map((sx) => (
        <mesh key={"b" + sx} position={[0.21 * sx, CHAIR_SEAT + 0.3, -0.21]} material={w} castShadow>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 8]} />
        </mesh>
      ))}
      {[0.38, 0.55].map((y) => (
        <mesh key={y} position={[0, CHAIR_SEAT + y, -0.21]} material={w}>
          <boxGeometry args={[0.44, 0.05, 0.03]} />
        </mesh>
      ))}
      {bow && (
        <group position={[0, CHAIR_SEAT + 0.47, -0.25]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.06 * sd, 0, 0]} rotation={[0, 0, (Math.PI / 2) * sd]} material={sm("#ffb3c6", 0.6)}>
              <coneGeometry args={[0.05, 0.11, 4]} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};
const gramaTex = () =>
  canvasTex("grama-casamento", 512, 512, (c, r) => {
    c.fillStyle = "#86cf5c";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 1400; i++) {
      c.fillStyle = r() > 0.5 ? "rgba(70,150,50,0.35)" : "rgba(170,220,120,0.35)";
      c.fillRect(r() * 512, r() * 512, 2, 5 + r() * 6);
    }
  }, [30, 30]);
const pistaTex = () => woodTex("pista-danca", [214, 170, 120], 10, [3, 3]);
/** gramado + altar + corredor + cadeiras + festa (pista, mesas, bolo, buffet, palco) */
export const WeddingVenue: React.FC<{t: number; party?: boolean; ceremony?: boolean; chairsLeft?: boolean}> = ({t, party = true, ceremony = true}) => {
  const petals = useMemo(() => {
    const r = rng(3);
    return Array.from({length: 60}, () => [(r() - 0.5) * 1.0, 0.012, -2.5 + r() * 9.5, r() * 6, ["#ffb3c6", "#ffffff", "#f7a1b5"][Math.floor(r() * 3)]] as [number, number, number, number, string]);
  }, []);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, 0, 0]} material={new THREE.MeshStandardMaterial({map: gramaTex(), roughness: 0.95})} receiveShadow>
        <planeGeometry args={[160, 160]} />
      </mesh>
      {/* árvores e arbustos de fundo */}
      {[-9, -6, -3.5, 4, 7.5, 10.5, 18, 21, 24].map((x, i) => (
        <group key={i} position={[x, 0, -9 - (i % 3) * 1.5]}>
          <mesh position={[0, 1.0, 0]} material={sm("#8a5a2b", 0.8)} castShadow>
            <cylinderGeometry args={[0.15, 0.22, 2.0, 10]} />
          </mesh>
          <mesh position={[0, 2.6, 0]} scale={[1.4, 1.3, 1.4]} material={sm(i % 2 ? "#4cb33f" : "#5fc94e", 0.75)} castShadow>
            <sphereGeometry args={[1, 18, 14]} />
          </mesh>
        </group>
      ))}
      {ceremony && (
        <>
          <FlowerArch p={ARCH_P} />
          {/* tapete do corredor */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 2.0]} material={sm("#fbf8f2", 0.8)} receiveShadow>
            <planeGeometry args={[1.25, 10.5]} />
          </mesh>
          {petals.map(([x, y, z, a, c], i) => (
            <mesh key={i} position={[x, y, z]} rotation={[-Math.PI / 2, 0, a]} material={sm(c, 0.7)}>
              <circleGeometry args={[0.035, 6]} />
            </mesh>
          ))}
          {/* tapetinho do altar */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -2.6]} material={sm("#f2e6d0", 0.8)} receiveShadow>
            <circleGeometry args={[1.6, 40]} />
          </mesh>
          {[-1, 1].map((sd) =>
            [1.15, 1.85, 2.55].map((x) =>
              [-0.6, 0.6, 1.8, 3.0, 4.2].map((z) => <WeddingChair key={`${sd}${x}${z}`} p={[x * sd, 0, z]} rotY={Math.PI} bow={Math.abs(x - 1.15) < 0.01} />),
            ),
          )}
        </>
      )}
      {party && (
        <group position={PARTY}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} material={new THREE.MeshStandardMaterial({map: pistaTex(), roughness: 0.08, metalness: 0.15})} receiveShadow>
            <circleGeometry args={[2.7, 48]} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]} material={sm("#fbf8f2", 0.5)}>
            <ringGeometry args={[2.7, 2.85, 48]} />
          </mesh>
          {(
            [
              [-4.2, 2.6],
              [4.2, 2.6],
              [-4.4, -1.2],
              [4.6, -0.6],
            ] as [number, number][]
          ).map(([x, z], i) => (
            <RoundTable key={i} p={[x, 0, z]} />
          ))}
          <CakeTable p={[4.2, 0, -3.4]} />
          <LightPoles t={t} />
        </group>
      )}
    </group>
  );
};
export const RoundTable: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.33, 0]} material={sm("#fbf8f2", 0.7)} castShadow receiveShadow>
      <cylinderGeometry args={[0.66, 0.74, 0.66, 32]} />
    </mesh>
    <mesh position={[0, 0.665, 0]} material={sm("#ffffff", 0.6)}>
      <cylinderGeometry args={[0.67, 0.67, 0.012, 32]} />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => {
      const a = (i / 5) * Math.PI * 2;
      return (
        <mesh key={i} position={[Math.cos(a) * 0.45, 0.675, Math.sin(a) * 0.45]} material={sm("#ffffff", 0.3)}>
          <cylinderGeometry args={[0.1, 0.08, 0.012, 20]} />
        </mesh>
      );
    })}
    <mesh position={[0, 0.76, 0]} material={sm("#cfe8f5", 0.1, {transparent: true, opacity: 0.6})}>
      <cylinderGeometry args={[0.06, 0.05, 0.18, 16]} />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={"f" + i} position={[0.05 * Math.cos(i * 1.3), 0.88 + (i % 2) * 0.04, 0.05 * Math.sin(i * 1.3)]} material={sm(["#ffb3c6", "#ffffff", "#f7a1b5"][i % 3], 0.55)}>
        <sphereGeometry args={[0.06, 10, 8]} />
      </mesh>
    ))}
  </group>
);
/** bolo de 3 andares */
export const Cake: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const icing = sm("#fffaf2", 0.5);
  const tiers: [number, number, number][] = [
    [0.34, 0.26, 0.13],
    [0.26, 0.22, 0.37],
    [0.18, 0.2, 0.58],
  ];
  return (
    <group position={p} rotation={r} scale={s}>
      {tiers.map(([rad, h, y], i) => (
        <group key={i}>
          <mesh position={[0, y, 0]} material={icing} castShadow>
            <cylinderGeometry args={[rad, rad, h, 32]} />
          </mesh>
          <mesh position={[0, y - h / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ffb3c6", 0.5)}>
            <torusGeometry args={[rad, 0.022, 8, 32]} />
          </mesh>
          {Array.from({length: 6}, (_, k) => {
            const a = (k / 6) * Math.PI * 2 + i;
            return (
              <mesh key={k} position={[Math.cos(a) * rad, y + h / 2 - 0.03, Math.sin(a) * rad]} material={sm(k % 2 ? "#ffd1dc" : "#f7a1b5", 0.5)}>
                <sphereGeometry args={[0.035, 10, 8]} />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* coraçãozinho no topo */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.035 * sd, 0.78, 0]} material={sm("#e8414f", 0.4)}>
          <sphereGeometry args={[0.045, 12, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.74, 0]} rotation={[0, 0, Math.PI]} material={sm("#e8414f", 0.4)}>
        <coneGeometry args={[0.075, 0.09, 16]} />
      </mesh>
    </group>
  );
};
export const CakeTable: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.36, 0]} geometry={rbox(1.2, 0.72, 0.8, 0.04)} material={sm("#fbf8f2", 0.7)} castShadow receiveShadow />
    <Cake p={[0, 0.72, 0]} s={1.1} />
  </group>
);
/** postes com cordão de lâmpadas em volta da pista */
const LightPoles: React.FC<{t: number}> = () => {
  const pts: V3[] = [
    [-3.3, 0, -3.3],
    [3.3, 0, -3.3],
    [3.6, 0, 3.4],
    [-3.6, 0, 3.4],
  ];
  const bulbs = useMemo(() => {
    const out: V3[] = [];
    for (let i = 0; i < 4; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % 4];
      for (let k = 1; k < 9; k++) {
        const u = k / 9;
        out.push([a[0] + (b[0] - a[0]) * u, 3.0 - Math.sin(u * Math.PI) * 0.45, a[2] + (b[2] - a[2]) * u]);
      }
    }
    return out;
  }, []);
  return (
    <group>
      {pts.map((q, i) => (
        <mesh key={i} position={[q[0], 1.6, q[2]]} material={sm("#5a4a3a", 0.6)} castShadow>
          <cylinderGeometry args={[0.05, 0.06, 3.2, 10]} />
        </mesh>
      ))}
      {bulbs.map((q, i) => (
        <mesh key={"b" + i} position={q} material={sm("#fff3c4", 0.3, {emissive: "#ffd36b", emissiveIntensity: 1.6})}>
          <sphereGeometry args={[0.055, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
};
/** mesa do buffet da Mimosa */
const mimosaTex = () =>
  canvasTex("placa-buffet-mimosa", 1024, 220, (c) => {
    c.fillStyle = "#ffd21f";
    c.fillRect(0, 0, 1024, 220);
    c.strokeStyle = "#e8412c";
    c.lineWidth = 16;
    c.strokeRect(8, 8, 1008, 204);
    c.fillStyle = "#e8412c";
    c.font = "bold 110px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("MIOJO DA MIMOSA", 512, 118);
  });
export const BuffetTable: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.36, 0]} geometry={rbox(2.4, 0.72, 0.8, 0.04)} material={sm("#fbf8f2", 0.7)} castShadow receiveShadow />
    <mesh position={[0, 0.5, 0.405]} material={sm("#ffb3c6", 0.7)}>
      <boxGeometry args={[2.4, 0.08, 0.01]} />
    </mesh>
    {[-0.8, -0.4, 0.4, 0.8].map((x) => (
      <mesh key={x} position={[x, 0.76, 0.15]} material={sm("#ffffff", 0.3)}>
        <cylinderGeometry args={[0.13, 0.08, 0.08, 20]} />
      </mesh>
    ))}
    {/* placa */}
    <group position={[0, 2.6, -0.35]}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[1.05 * sd, -0.9, 0]} material={sm("#8a5a2b", 0.7)}>
          <cylinderGeometry args={[0.03, 0.03, 1.9, 8]} />
        </mesh>
      ))}
      <mesh geometry={rbox(2.3, 0.5, 0.06, 0.02)} material={sm("#ffffff", 0.5)} castShadow />
      <mesh position={[0, 0, 0.032]} material={new THREE.MeshStandardMaterial({map: mimosaTex(), roughness: 0.6})}>
        <planeGeometry args={[2.22, 0.44]} />
      </mesh>
    </group>
  </group>
);
/** palco do mágico */
const magicoTex = () =>
  canvasTex("painel-magico", 512, 512, (c, r) => {
    const g = c.createRadialGradient(256, 256, 20, 256, 256, 360);
    g.addColorStop(0, "#5b2be0");
    g.addColorStop(1, "#1b0b4a");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 40; i++) {
      c.fillStyle = "#ffd21f";
      const x = r() * 512;
      const y = r() * 512;
      const s = 4 + r() * 10;
      c.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = (k / 10) * Math.PI * 2;
        const rr = k % 2 ? s * 0.45 : s;
        c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
      }
      c.fill();
    }
  });
export const MagicStage: React.FC<{p: V3}> = ({p}) => (
  <group position={p}>
    <mesh position={[0, 0.12, 0]} geometry={rbox(3.6, 0.24, 2.0, 0.04)} material={sm("#7a1f2a", 0.6)} castShadow receiveShadow />
    <mesh position={[0, 1.7, -0.95]} geometry={rbox(3.6, 3.0, 0.1, 0.03)} material={new THREE.MeshStandardMaterial({map: magicoTex(), roughness: 0.6, emissive: "#ffffff", emissiveMap: magicoTex(), emissiveIntensity: 0.25})} castShadow />
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[1.9 * sd, 1.6, -0.8]} rotation={[0, 0, 0.04 * sd]} material={sm("#b3122d", 0.7)} castShadow>
        <boxGeometry args={[0.4, 3.2, 0.12]} />
      </mesh>
    ))}
  </group>
);
/** cartola do mágico (espaço da cabeça) + bigode */
export const MagicianHat: React.FC = () => (
  <group>
    <group position={[0, 0.27, 0]} rotation={[-0.1, 0, 0.08]}>
      <mesh material={sm("#15161d", 0.4)} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 0.025, 32]} />
      </mesh>
      <mesh position={[0, 0.27, 0]} material={sm("#15161d", 0.4)} castShadow>
        <cylinderGeometry args={[0.3, 0.32, 0.54, 32]} />
      </mesh>
      <mesh position={[0, 0.06, 0]} material={sm("#b3122d", 0.5)}>
        <cylinderGeometry args={[0.325, 0.325, 0.08, 32]} />
      </mesh>
    </group>
    {[-1, 1].map((sd) => (
      <mesh key={sd} position={[0.065 * sd, -0.105, 0.29]} rotation={[0, 0, sd * 0.4]} scale={[0.08, 0.028, 0.035]} material={sm("#15161d", 0.5)}>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
    ))}
  </group>
);
/** capa do mágico (fica atrás do corpo, no espaço do boneco) */
export const Cape: React.FC<{p: V3; rotY?: number; t?: number}> = ({p, rotY = 0, t = 0}) => (
  <group position={p} rotation={[0, rotY, 0]}>
    <mesh position={[0, 0.85, -0.26]} rotation={[0.08 + 0.03 * Math.sin(t * 3), 0, 0]} material={sm("#5b2be0", 0.6, {side: THREE.DoubleSide})} castShadow>
      <cylinderGeometry args={[0.3, 0.55, 1.15, 24, 1, true, Math.PI * 0.6, Math.PI * 0.8]} />
    </mesh>
  </group>
);
export const Wand: React.FC<{glow?: number}> = ({glow = 0}) => (
  <group>
    <mesh position={[0, 0.0, 0.17]} rotation={[Math.PI / 2, 0, 0]} material={sm("#15161d", 0.4)}>
      <cylinderGeometry args={[0.015, 0.015, 0.34, 8]} />
    </mesh>
    <mesh position={[0, 0.0, 0.33]} rotation={[Math.PI / 2, 0, 0]} material={sm("#ffffff", 0.4, {emissive: "#fff3b0", emissiveIntensity: 0.5 + 2 * glow})}>
      <cylinderGeometry args={[0.017, 0.017, 0.06, 8]} />
    </mesh>
  </group>
);
/** fumaça de mágica (puf) */
export const Puff: React.FC<{p: V3; k: number; color?: string}> = ({p, k, color = "#f4f0ff"}) => {
  if (k <= 0 || k >= 1) return null;
  const m = sm(color, 0.9, {transparent: true, opacity: 0.9 * (1 - k * k)});
  return (
    <group position={p}>
      {Array.from({length: 14}, (_, i) => {
        const a = i * 2.399;
        const y = (i / 14) * 2.0;
        const r = (0.25 + 0.6 * k) * (0.6 + 0.4 * Math.sin(i * 1.7));
        return (
          <mesh key={i} position={[Math.cos(a) * r, y * (0.6 + 0.6 * k), Math.sin(a) * r]} material={m}>
            <sphereGeometry args={[0.25 + 0.35 * k, 14, 10]} />
          </mesh>
        );
      })}
    </group>
  );
};
/** satélite */
export const Satellite: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.4, 0.4, 0.5, 0.04)} material={sm("#e3b33b", 0.3, {metalness: 0.6})} castShadow />
    {[-1, 1].map((sd) => (
      <group key={sd} position={[0.55 * sd, 0, 0]}>
        <mesh material={sm("#2b4fd0", 0.25, {metalness: 0.4, emissive: "#0b1a5a", emissiveIntensity: 0.4})}>
          <boxGeometry args={[0.7, 0.03, 0.36]} />
        </mesh>
      </group>
    ))}
    <mesh position={[0, 0.3, 0]} rotation={[0.4, 0, 0]} material={sm("#f2f2f2", 0.4)}>
      <coneGeometry args={[0.18, 0.12, 20, 1, true]} />
    </mesh>
  </group>
);
/** redemoinho do tornado (anéis girando) */
export const Tornado: React.FC<{p: V3; k: number; t: number; h?: number}> = ({p, k, t, h = 4.5}) => {
  const mats = useMemo(() => [0, 1, 2].map((i) => new THREE.MeshStandardMaterial({color: ["#ffffff", "#e6eef7", "#d6e2ee"][i], transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide, roughness: 0.8})), []);
  if (k < 0.01) return null;
  mats.forEach((m) => (m.opacity = 0.42 * k));
  return (
    <group position={p}>
      {Array.from({length: 14}, (_, i) => {
        const u = i / 13;
        const y = u * h * k;
        const r = 0.45 + 2.2 * u * u;
        return (
          <mesh key={i} position={[0.15 * Math.sin(t * 3 + i), y, 0.15 * Math.cos(t * 3 + i)]} rotation={[Math.PI / 2, 0, t * (8 - u * 4) + i]} material={mats[i % 3]}>
            <torusGeometry args={[r, 0.06 + 0.12 * u, 6, 32, Math.PI * 1.4]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ===================== pombos de casamento (lisinhos, no estilo dos bonecos) ===================== */
export type WPigeonP = {pos?: V3; rotY?: number; flap?: number; t?: number; hat?: boolean; veil?: boolean; rings?: boolean; blink?: number; bob?: number; peck?: number; chest?: number};
export const WeddingPigeon: React.FC<{p: WPigeonP; s?: number}> = ({p, s = 1}) => {
  const {pos = [0, 0, 0], rotY = 0, flap = 0, t = 0, hat = false, veil = false, rings = false, blink = 0, bob = 0, peck = 0, chest = 0} = p;
  const body = sm("#9aa3b2", 0.55);
  const dark = sm("#6f7786", 0.55);
  const neck = sm("#7a6bb0", 0.35, {emissive: "#2a1f55", emissiveIntensity: 0.25});
  const neck2 = sm("#5fae94", 0.35, {emissive: "#123a2c", emissiveIntensity: 0.25});
  const eye = sm("#0c0c10", 0.1);
  const white = sm("#ffffff", 0.2);
  const pink = sm("#f08aa0", 0.5);
  const fa = flap > 0 ? flap * (0.5 + 0.5 * Math.sin(t * 40)) : 0;
  const eyeY = Math.max(0.1, 1 - blink);
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      {/* perninhas */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.055 * sd, 0, 0.02]}>
          <mesh position={[0, 0.05, 0]} material={pink}>
            <cylinderGeometry args={[0.012, 0.012, 0.1, 8]} />
          </mesh>
          {[-0.5, 0, 0.5].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.03, 0.008, Math.cos(a) * 0.03]} rotation={[Math.PI / 2, 0, -a]} material={pink}>
              <capsuleGeometry args={[0.009, 0.04, 4, 6]} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[0, 0.22 + 0.01 * Math.sin(t * 6) * bob, 0]} rotation={[-0.15 + 0.4 * peck, 0, 0]}>
        {/* corpo, peito furta-cor */}
        <mesh scale={[0.16, 0.15, 0.22]} material={body} castShadow>
          <sphereGeometry args={[1, 24, 18]} />
        </mesh>
        <mesh position={[0, 0.06, 0.1]} scale={[0.125 * (1 + 0.25 * chest), 0.13 * (1 + 0.25 * chest), 0.11 * (1 + 0.25 * chest)]} material={neck} castShadow>
          <sphereGeometry args={[1, 20, 14]} />
        </mesh>
        <mesh position={[0, 0.12, 0.12]} scale={[0.095, 0.08, 0.085]} material={neck2}>
          <sphereGeometry args={[1, 18, 12]} />
        </mesh>
        {/* asas */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.13 * sd, 0.04, 0.0]} rotation={[0, 0, sd * (0.1 + 1.3 * fa)]}>
            <mesh position={[0.015 * sd, -0.02, -0.04]} scale={[0.04, 0.1, 0.18]} material={dark} castShadow>
              <sphereGeometry args={[1, 16, 12]} />
            </mesh>
            {[0, 1].map((k) => (
              <mesh key={k} position={[0.045 * sd, -0.03 - k * 0.03, -0.09 - k * 0.025]} rotation={[0.3, 0, 0]} scale={[0.008, 0.012, 0.06]} material={sm("#2a2c33", 0.5)}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* rabo */}
        <mesh position={[0, 0.0, -0.24]} rotation={[0.3, 0, 0]} scale={[0.08, 0.018, 0.1]} material={dark} castShadow>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        {/* alianças no pescoço */}
        {rings &&
          [-1, 1].map((sd) => (
            <mesh key={"r" + sd} position={[0.03 * sd, 0.02, 0.2]} rotation={[0.2, 0.5 * sd, 0]} material={sm("#ffcc33", 0.2, {metalness: 0.8, emissive: "#5a3a00", emissiveIntensity: 0.5})}>
              <torusGeometry args={[0.045, 0.012, 8, 20]} />
            </mesh>
          ))}
        {/* cabeça */}
        <group position={[0, 0.17 - 0.1 * peck, 0.15 + 0.06 * peck]}>
          <mesh scale={[0.085, 0.085, 0.09]} material={sm("#b4bcc8", 0.5)} castShadow>
            <sphereGeometry args={[1, 20, 16]} />
          </mesh>
          <mesh position={[0, -0.012, 0.1]} rotation={[Math.PI / 2 - 0.15, 0, 0]} material={sm("#3a3a44", 0.4)}>
            <coneGeometry args={[0.016, 0.055, 10]} />
          </mesh>
          <mesh position={[0, 0.006, 0.083]} scale={[0.02, 0.012, 0.014]} material={sm("#f2f2ee", 0.6)}>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.045 * sd, 0.02, 0.065]} rotation={[0, 0.45 * sd, 0]} scale={[1, eyeY, 1]}>
              <mesh scale={[0.022, 0.026, 0.012]} material={eye}>
                <sphereGeometry args={[1, 12, 10]} />
              </mesh>
              <mesh position={[0.007, 0.01, 0.01]} scale={0.006} material={white}>
                <sphereGeometry args={[1, 6, 4]} />
              </mesh>
            </group>
          ))}
          {[-1, 1].map((sd) => (
            <mesh key={"c" + sd} position={[0.06 * sd, -0.02, 0.055]} rotation={[0, 0.7 * sd, 0]} scale={[0.016, 0.01, 0.006]} material={sm("#f3a0a6", 0.6)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          ))}
          {hat && (
            <group position={[0, 0.075, -0.01]} rotation={[-0.15, 0, 0.15]}>
              <mesh material={sm("#15161d", 0.4)} castShadow>
                <cylinderGeometry args={[0.08, 0.08, 0.008, 20]} />
              </mesh>
              <mesh position={[0, 0.05, 0]} material={sm("#15161d", 0.4)} castShadow>
                <cylinderGeometry args={[0.048, 0.05, 0.095, 20]} />
              </mesh>
              <mesh position={[0, 0.016, 0]} material={sm("#e8414f", 0.5)}>
                <cylinderGeometry args={[0.051, 0.051, 0.018, 20]} />
              </mesh>
            </group>
          )}
          {veil && (
            <group>
              <mesh position={[0, -0.06, -0.08]} material={sm("#ffffff", 0.3, {transparent: true, opacity: 0.5, side: THREE.DoubleSide, depthWrite: false})}>
                <cylinderGeometry args={[0.04, 0.14, 0.24, 20, 1, true, 2.1, Math.PI * 2 - 4.2]} />
              </mesh>
              {[-1, 0, 1].map((k) => (
                <mesh key={k} position={[0.03 * k, 0.075, -0.01]} material={sm(k ? "#ffd1dc" : "#ffffff", 0.5)}>
                  <sphereGeometry args={[0.02, 10, 8]} />
                </mesh>
              ))}
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

/* ===================== igreja bem grande (cerimônia) ===================== */
const pisoIgrejaTex = () =>
  canvasTex("piso-igreja", 512, 512, (c) => {
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        c.fillStyle = (i + j) % 2 ? "#e9dfcc" : "#d6c7ab";
        c.fillRect(i * 64, j * 64, 64, 64);
      }
  }, [10, 18]);
const vitralTex = (seed: number) =>
  canvasTex("vitral-" + seed, 256, 512, (c, r) => {
    const cols = ["#e8414f", "#3a86ff", "#ffd21f", "#2ecc71", "#9b59b6", "#ff8a5c", "#5ccfff"];
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 16; j++) {
        c.fillStyle = cols[Math.floor(r() * cols.length)];
        c.fillRect(i * 32, j * 32, 32, 32);
      }
    c.strokeStyle = "#2a2a30";
    c.lineWidth = 5;
    for (let i = 0; i <= 8; i++) {
      c.beginPath();
      c.moveTo(i * 32, 0);
      c.lineTo(i * 32, 512);
      c.stroke();
    }
    for (let j = 0; j <= 16; j++) {
      c.beginPath();
      c.moveTo(0, j * 32);
      c.lineTo(256, j * 32);
      c.stroke();
    }
  });
const rosaceaTex = () =>
  canvasTex("rosacea", 512, 512, (c) => {
    c.fillStyle = "#1b2a6b";
    c.fillRect(0, 0, 512, 512);
    const cols = ["#e8414f", "#ffd21f", "#3a86ff", "#2ecc71", "#ff8a5c", "#9b59b6"];
    for (let ring = 4; ring >= 1; ring--) {
      const n = ring * 6;
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI * 2;
        const a1 = ((i + 1) / n) * Math.PI * 2;
        c.fillStyle = cols[(i + ring) % cols.length];
        c.beginPath();
        c.moveTo(256, 256);
        c.arc(256, 256, ring * 62, a0, a1);
        c.closePath();
        c.fill();
        c.strokeStyle = "#2a2a30";
        c.lineWidth = 4;
        c.stroke();
      }
    }
    c.fillStyle = "#fff3b0";
    c.beginPath();
    c.arc(256, 256, 40, 0, Math.PI * 2);
    c.fill();
  });
export const CH = {x: 5, z0: -6.6, z1: 12.5, wall: 6.5};
export const CHURCH_PLAT = 0.3; // altura do altar
/** banco de igreja (os convidados olham pra -z) */
const Pew: React.FC<{p: V3; w: number}> = ({p, w}) => {
  const wood = sm("#8a5a33", 0.55);
  return (
    <group position={p}>
      <mesh position={[0, 0.275, 0]} geometry={rbox(w, 0.06, 0.48, 0.02)} material={wood} castShadow receiveShadow />
      <mesh position={[0, 0.62, 0.24]} rotation={[-0.08, 0, 0]} geometry={rbox(w, 0.6, 0.06, 0.02)} material={wood} castShadow />
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(w / 2) * sd, 0.42, 0.04]} geometry={rbox(0.07, 0.84, 0.56, 0.03)} material={sm("#74482a", 0.55)} castShadow />
      ))}
    </group>
  );
};
export type ChurchTheme = {wall?: string; carpet?: string; flowers?: [string, string, string]; vault?: string};
export const Church: React.FC<{t: number; theme?: ChurchTheme}> = ({t, theme = {}}) => {
  const TH = {wall: "#f3ead9", carpet: "#b3122d", flowers: ["#ffb3c6", "#ffffff", "#ffd1dc"] as [string, string, string], vault: "#f7f0e2", ...theme};
  const {x: X, z0, z1, wall} = CH;
  const L = z1 - z0;
  const zc = (z0 + z1) / 2;
  const wallM = sm(TH.wall, 0.85);
  const stone = sm("#e6dcc8", 0.75);
  const gold = sm("#e3b33b", 0.3, {metalness: 0.6});
  const vault = useMemo(() => {
    const g = new THREE.CylinderGeometry(X, X, L, 40, 1, true, Math.PI / 2, Math.PI);
    g.rotateX(Math.PI / 2);
    return g;
  }, [X, L]);
  const cols = [-3.6, -0.4, 2.8, 6.0, 9.2];
  const rows = [-0.6, 0.6, 1.8, 3.0, 4.2, 5.4, 6.6, 7.8];
  return (
    <group>
      {/* piso */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} material={new THREE.MeshStandardMaterial({map: pisoIgrejaTex(), roughness: 0.35})} receiveShadow>
        <planeGeometry args={[2 * X, L]} />
      </mesh>
      {/* paredes */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[(X + 0.1) * sd, wall / 2, zc]} material={wallM} receiveShadow>
          <boxGeometry args={[0.2, wall, L]} />
        </mesh>
      ))}
      <mesh position={[0, (wall + X) / 2, z0 - 0.1]} material={wallM} receiveShadow>
        <boxGeometry args={[2 * X + 0.4, wall + X, 0.2]} />
      </mesh>
      <mesh position={[0, (wall + X) / 2, z1 + 0.1]} material={wallM}>
        <boxGeometry args={[2 * X + 0.4, wall + X, 0.2]} />
      </mesh>
      {/* abóbada */}
      <mesh position={[0, wall, zc]} geometry={vault} material={sm(TH.vault, 0.85, {side: THREE.DoubleSide})} />
      {cols.map((z) => (
        <mesh key={"arco" + z} position={[0, wall, z]} material={stone}>
          <torusGeometry args={[X - 0.05, 0.12, 8, 40, Math.PI]} />
        </mesh>
      ))}
      {/* colunas */}
      {[-1, 1].map((sd) =>
        cols.map((z) => (
          <group key={`${sd}${z}`} position={[(X - 0.55) * sd, 0, z]}>
            <mesh position={[0, wall / 2, 0]} material={stone} castShadow>
              <cylinderGeometry args={[0.32, 0.32, wall, 20]} />
            </mesh>
            <mesh position={[0, 0.15, 0]} material={stone}>
              <cylinderGeometry args={[0.45, 0.48, 0.3, 20]} />
            </mesh>
            <mesh position={[0, wall - 0.15, 0]} material={gold}>
              <cylinderGeometry args={[0.45, 0.34, 0.3, 20]} />
            </mesh>
          </group>
        )),
      )}
      {/* vitrais nas laterais */}
      {[-1, 1].map((sd) =>
        cols.slice(0, -1).map((z, i) => (
          <group key={`v${sd}${z}`} position={[(X - 0.005) * sd, 3.3, z + 1.6]} rotation={[0, -sd * Math.PI / 2, 0]}>
            <mesh material={new THREE.MeshStandardMaterial({map: vitralTex(i + (sd > 0 ? 10 : 0)), emissive: "#ffffff", emissiveMap: vitralTex(i + (sd > 0 ? 10 : 0)), emissiveIntensity: 0.9, roughness: 0.4})}>
              <planeGeometry args={[1.3, 3.0]} />
            </mesh>
            <mesh position={[0, 1.5, 0]} material={new THREE.MeshStandardMaterial({map: vitralTex(i + 20), emissive: "#ffffff", emissiveMap: vitralTex(i + 20), emissiveIntensity: 0.9})}>
              <circleGeometry args={[0.65, 24, 0, Math.PI]} />
            </mesh>
            <mesh position={[0, 0.2, 0.01]} material={stone}>
              <torusGeometry args={[0.7, 0.05, 6, 20, Math.PI]} />
            </mesh>
          </group>
        )),
      )}
      {/* rosácea atrás do altar */}
      <group position={[0, 7.3, z0 + 0.02]}>
        <mesh material={new THREE.MeshStandardMaterial({map: rosaceaTex(), emissive: "#ffffff", emissiveMap: rosaceaTex(), emissiveIntensity: 1.0})}>
          <circleGeometry args={[2.0, 48]} />
        </mesh>
        <mesh position={[0, 0, 0.02]} material={stone}>
          <torusGeometry args={[2.05, 0.12, 8, 48]} />
        </mesh>
      </group>
      {/* altar: plataforma, degrau, mesa, velas, flores */}
      <mesh position={[0, CHURCH_PLAT / 2, (z0 - 2.9) / 2]} material={stone} receiveShadow castShadow>
        <boxGeometry args={[2 * X, CHURCH_PLAT, -2.9 - z0]} />
      </mesh>
      <mesh position={[0, CHURCH_PLAT / 4, -2.72]} material={stone} receiveShadow>
        <boxGeometry args={[7, CHURCH_PLAT / 2, 0.36]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, CHURCH_PLAT + 0.005, -4.4]} material={sm(TH.carpet, 0.8)} receiveShadow>
        <planeGeometry args={[3.2, 3.0]} />
      </mesh>
      <group position={[0, CHURCH_PLAT, -5.3]}>
        <mesh position={[0, 0.45, 0]} geometry={rbox(2.2, 0.9, 0.8, 0.03)} material={sm("#fbf8f2", 0.7)} castShadow receiveShadow />
        <mesh position={[0, 0.7, 0.405]} material={gold}>
          <boxGeometry args={[2.2, 0.06, 0.01]} />
        </mesh>
        {[-0.8, -0.5, 0.5, 0.8].map((x) => (
          <group key={x} position={[x, 0.9, 0]}>
            <mesh position={[0, 0.18, 0]} material={sm("#fffaf0", 0.5)}>
              <cylinderGeometry args={[0.04, 0.04, 0.36, 12]} />
            </mesh>
            <mesh position={[0, 0.41, 0]} material={sm("#ffd36b", 0.3, {emissive: "#ffb020", emissiveIntensity: 2.5})}>
              <sphereGeometry args={[0.035, 10, 8]} />
            </mesh>
          </group>
        ))}
        {[-0.15, 0, 0.15].map((x, i) => (
          <mesh key={i} position={[x, 1.0 + (i === 1 ? 0.06 : 0), 0]} material={sm(TH.flowers[i], 0.55)}>
            <sphereGeometry args={[0.12, 14, 10]} />
          </mesh>
        ))}
      </group>
      <FlowerArch p={[0, CHURCH_PLAT, -4.1]} />
      {/* tapete vermelho do corredor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, (-2.55 + z1) / 2]} material={sm(TH.carpet, 0.85)} receiveShadow>
        <planeGeometry args={[1.3, z1 + 2.55]} />
      </mesh>
      {/* bancos + lacinhos */}
      {[-1, 1].map((sd) =>
        rows.map((z) => (
          <group key={`${sd}${z}`}>
            <Pew p={[1.95 * sd, 0, z]} w={2.55} />
            <group position={[0.7 * sd, 0.75, z + 0.2]}>
              {[-1, 1].map((k) => (
                <mesh key={k} position={[0, 0, 0.05 * k]} rotation={[(Math.PI / 2) * k, 0, 0]} material={sm("#ffffff", 0.5)}>
                  <coneGeometry args={[0.06, 0.13, 4]} />
                </mesh>
              ))}
              <mesh position={[0, -0.05, 0]} material={sm(TH.flowers[0], 0.5)}>
                <sphereGeometry args={[0.07, 12, 10]} />
              </mesh>
            </group>
          </group>
        )),
      )}
      {/* lustres */}
      {[0.5, 5.5, 10.5].map((z) => (
        <group key={"l" + z} position={[0, 6.2, z]}>
          <mesh position={[0, 2.0, 0]} material={gold}>
            <cylinderGeometry args={[0.02, 0.02, 4.0, 6]} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]} material={gold}>
            <torusGeometry args={[0.8, 0.05, 8, 32]} />
          </mesh>
          {Array.from({length: 10}, (_, i) => {
            const a = (i / 10) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.8, 0.12, Math.sin(a) * 0.8]} material={sm("#fff3c4", 0.3, {emissive: "#ffd36b", emissiveIntensity: 2})}>
                <sphereGeometry args={[0.07, 10, 8]} />
              </mesh>
            );
          })}
        </group>
      ))}
      {/* portas grandes no fundo */}
      <group position={[0, 0, z1 - 0.005]} rotation={[0, Math.PI, 0]}>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.85 * sd, 2.0, 0]} geometry={rbox(1.6, 4.0, 0.1, 0.03)} material={sm("#7a4a28", 0.6)} />
        ))}
        <mesh position={[0, 4.0, 0]} material={sm("#7a4a28", 0.6)}>
          <circleGeometry args={[1.7, 24, 0, Math.PI]} />
        </mesh>
      </group>
    </group>
  );
};

/* ===================== salão de festas (depois do casamento) ===================== */
export const HALL = {x0: 7.5, x1: 20.5, z0: -8.6, z1: 10, h: 5.2};
const parquetTex = () => woodTex("parquet-salao", [190, 140, 95], 12, [6, 7]);
const cortinaTex = () =>
  canvasTex("cortina-salao", 128, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 128, 0);
    for (let i = 0; i <= 8; i++) g.addColorStop(i / 8, i % 2 ? "#8a1d36" : "#b3284a");
    c.fillStyle = g;
    c.fillRect(0, 0, 128, 256);
  });
export const Hall: React.FC<{t: number; hole?: number; holeAt?: [number, number]; wall?: string; lowerC?: string}> = ({t, hole = 0, holeAt = [PARTY[0], PARTY[2] - 0.8], wall = "#f6ead7", lowerC = "#d9c3a0"}) => {
  const {x0, x1, z0, z1, h} = HALL;
  const W = x1 - x0;
  const D = z1 - z0;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const wallM = sm(wall, 0.85);
  const lower = sm(lowerC, 0.7);
  const gold = sm("#e3b33b", 0.3, {metalness: 0.6});
  const ceiling = useMemo(() => {
    const sh = new THREE.Shape();
    sh.moveTo(-W / 2, -D / 2);
    sh.lineTo(W / 2, -D / 2);
    sh.lineTo(W / 2, D / 2);
    sh.lineTo(-W / 2, D / 2);
    sh.closePath();
    if (hole > 0.01) {
      const hp = new THREE.Path();
      const r = 1.1 * hole;
      const hx = holeAt[0] - cx;
      const hz = -(holeAt[1] - cz);
      for (let i = 0; i <= 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const rr = r * (0.8 + 0.25 * Math.sin(i * 2.7));
        if (i === 0) hp.moveTo(hx + Math.cos(a) * rr, hz + Math.sin(a) * rr);
        else hp.lineTo(hx + Math.cos(a) * rr, hz + Math.sin(a) * rr);
      }
      sh.holes.push(hp);
    }
    const g = new THREE.ShapeGeometry(sh);
    g.rotateX(Math.PI / 2);
    return g;
  }, [W, D, hole > 0.01 ? Math.round(hole * 10) : 0]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} material={new THREE.MeshStandardMaterial({map: parquetTex(), roughness: 0.4})} receiveShadow>
        <planeGeometry args={[W, D]} />
      </mesh>
      {/* paredes com barrado, cortinas e arandelas */}
      {(
        [
          [cx, z0 - 0.1, W + 0.4, 0],
          [cx, z1 + 0.1, W + 0.4, 0],
          [x0 - 0.1, cz, D, Math.PI / 2],
          [x1 + 0.1, cz, D, Math.PI / 2],
        ] as [number, number, number, number][]
      ).map(([x, z, w, ry], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, ry, 0]}>
          <mesh position={[0, h / 2, 0]} material={wallM} receiveShadow>
            <boxGeometry args={[w, h, 0.2]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0, 0.55, 0.11 * sd]} material={lower}>
              <boxGeometry args={[w, 1.1, 0.02]} />
            </mesh>
          ))}
          {[-1, 1].map((sd) => (
            <mesh key={"g" + sd} position={[0, 1.12, 0.12 * sd]} material={gold}>
              <boxGeometry args={[w, 0.05, 0.02]} />
            </mesh>
          ))}
        </group>
      ))}
      {/* cortinas nas paredes do fundo e laterais */}
      {Array.from({length: 6}, (_, i) => x0 + 1.2 + i * 2.1).map((x) => (
        <mesh key={"cf" + x} position={[x, h / 2 + 0.2, z0 + 0.06]} material={new THREE.MeshStandardMaterial({map: cortinaTex(), roughness: 0.8})}>
          <planeGeometry args={[0.8, h - 0.6]} />
        </mesh>
      ))}
      {[-1, 1].map((sd) =>
        Array.from({length: 7}, (_, i) => z0 + 1.6 + i * 2.6).map((z) => (
          <group key={`a${sd}${z}`} position={[sd < 0 ? x0 + 0.06 : x1 - 0.06, 0, z]} rotation={[0, sd < 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
            <mesh position={[0, h / 2 + 0.2, 0]} material={new THREE.MeshStandardMaterial({map: cortinaTex(), roughness: 0.8})}>
              <planeGeometry args={[0.8, h - 0.6]} />
            </mesh>
            <mesh position={[1.3, 2.6, 0.05]} material={sm("#fff3c4", 0.3, {emissive: "#ffd36b", emissiveIntensity: 1.8})}>
              <sphereGeometry args={[0.1, 12, 10]} />
            </mesh>
          </group>
        )),
      )}
      {/* teto (com buraco quando o buquê passa) */}
      <mesh position={[cx, h, cz]} geometry={ceiling} material={sm("#fbf7ee", 0.9, {side: THREE.DoubleSide})} />
      {/* lustres de cristal */}
      {(
        [
          [PARTY[0], PARTY[2] + 1.0],
          [PARTY[0] - 3.8, PARTY[2] + 5.0],
          [PARTY[0] + 3.8, PARTY[2] + 5.0],
          [PARTY[0] - 3.8, PARTY[2] - 4.2],
          [PARTY[0] + 3.8, PARTY[2] - 4.2],
        ] as [number, number][]
      ).map(([x, z], i) => (
        <group key={"lu" + i} position={[x, h - 1.0, z]}>
          <mesh position={[0, 0.5, 0]} material={gold}>
            <cylinderGeometry args={[0.02, 0.02, 1.0, 6]} />
          </mesh>
          {[0.55, 0.35].map((r, k) => (
            <group key={k} position={[0, -k * 0.28, 0]}>
              <mesh rotation={[Math.PI / 2, 0, 0]} material={gold}>
                <torusGeometry args={[r, 0.03, 8, 28]} />
              </mesh>
              {Array.from({length: 8 - k * 2}, (_, j) => {
                const a = (j / (8 - k * 2)) * Math.PI * 2 + t * 0.2;
                return (
                  <group key={j}>
                    <mesh position={[Math.cos(a) * r, 0.08, Math.sin(a) * r]} material={sm("#fff3c4", 0.3, {emissive: "#ffd36b", emissiveIntensity: 2})}>
                      <sphereGeometry args={[0.05, 10, 8]} />
                    </mesh>
                    <mesh position={[Math.cos(a) * r, -0.12, Math.sin(a) * r]} material={sm("#dff3ff", 0.05, {metalness: 0.3})}>
                      <octahedronGeometry args={[0.04, 0]} />
                    </mesh>
                  </group>
                );
              })}
            </group>
          ))}
        </group>
      ))}
    </group>
  );
};
/** pista de dança + mesas + bolo dentro do salão */
export const HallParty: React.FC = () => (
  <group position={PARTY}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} material={new THREE.MeshStandardMaterial({map: pistaTex(), roughness: 0.08, metalness: 0.15})} receiveShadow>
      <circleGeometry args={[2.7, 48]} />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]} material={sm("#e3b33b", 0.3, {metalness: 0.6})}>
      <ringGeometry args={[2.7, 2.82, 48]} />
    </mesh>
    {(
      [
        [-4.2, 2.6],
        [4.2, 2.6],
        [-4.4, -1.2],
        [4.6, -0.6],
        [-3.4, 6.2],
        [3.4, 6.2],
      ] as [number, number][]
    ).map(([x, z], i) => (
      <RoundTable key={i} p={[x, 0, z]} />
    ))}
    <CakeTable p={[4.2, 0, -3.4]} />
  </group>
);
/** caquinhos do teto caindo */
export const Debris: React.FC<{p: V3; k: number}> = ({p, k}) => {
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={p}>
      {Array.from({length: 12}, (_, i) => {
        const a = i * 2.4;
        const r = 0.3 + 0.5 * ((i * 37) % 10) / 10;
        return (
          <mesh key={i} position={[Math.cos(a) * r * (1 + k), -k * k * 5 * (0.6 + 0.4 * (i % 3) / 2), Math.sin(a) * r * (1 + k)]} rotation={[k * 8 + i, k * 5, i]} material={sm("#fbf7ee", 0.8)}>
            <boxGeometry args={[0.18, 0.04, 0.12]} />
          </mesh>
        );
      })}
    </group>
  );
};
