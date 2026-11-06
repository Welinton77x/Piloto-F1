import React from "react";
import * as THREE from "three";
import {random} from "remotion";
import {rad} from "../lib/anim";

export const Mat: React.FC<{
  color: string;
  opacity?: number;
  emissive?: string;
  ei?: number;
  metal?: number;
  double?: boolean;
}> = ({color, opacity = 1, emissive = "#000000", ei = 0, metal = 0, double = false}) => (
  <meshStandardMaterial
    color={color}
    flatShading
    transparent={opacity < 1}
    depthWrite={opacity >= 1}
    opacity={opacity}
    emissive={emissive}
    emissiveIntensity={ei}
    metalness={metal}
    roughness={0.8}
    side={double ? THREE.DoubleSide : THREE.FrontSide}
  />
);

export type DriverProps = {
  outfit?: "racing" | "mechanic" | "training";
  headTilt?: number; // graus, em Z
  lean?: number; // graus, tronco para frente (X)
  helmetScale?: number;
  helmetColor?: string;
  neckScale?: number;
  legMetal?: number; // 0-1
  wave?: number; // graus do braço direito (para fora)
  coreGlow?: number;
  harness?: number;
  xray?: number; // 0-1 (1 = corpo translúcido)
  seated?: boolean;
  scale?: number;
  position?: [number, number, number];
  rotationY?: number;
};

const OUT = {
  racing: {shirt: "#d83a34", pants: "#2b2f3a", head: "#f4f4f4", skin: "#f0bf98", shoe: "#15171c", glove: "#f4f4f4"},
  mechanic: {shirt: "#2f6fb5", pants: "#27598f", head: "#2f6fb5", skin: "#f0bf98", shoe: "#3b2a1f", glove: "#f0bf98"},
  training: {shirt: "#2e9e4f", pants: "#2b2f3a", head: "#2e9e4f", skin: "#f0bf98", shoe: "#f4f4f4", glove: "#f0bf98"},
} as const;

const Cap: React.FC<{r: number; l: number; color: string; opacity?: number; position?: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number]}> = ({
  r,
  l,
  color,
  opacity = 1,
  position,
  rotation,
  scale,
}) => (
  <mesh position={position} rotation={rotation} scale={scale}>
    <capsuleGeometry args={[r, l, 3, 8]} />
    <Mat color={color} opacity={opacity} />
  </mesh>
);

/** Personagem original, low-poly arredondado ("chibi"). 'mechanic' = mascote do canal (calça, camisa e boné azuis). */
export const Driver: React.FC<DriverProps> = ({
  outfit = "racing",
  headTilt = 0,
  lean = 0,
  helmetScale = 1,
  helmetColor,
  neckScale = 1,
  legMetal = 0,
  wave = 0,
  coreGlow = 0,
  harness = -1,
  xray = 0,
  seated = false,
  scale = 1,
  position = [0, 0, 0],
  rotationY = 0,
}) => {
  const c = OUT[outfit];
  const op = 1 - xray * 0.65;
  const legColor = legMetal > 0.5 ? "#aab4c0" : c.pants;
  const hipY = seated ? 0.33 : 0.52;
  const headCol = helmetColor ?? c.head;
  return (
    <group position={position} scale={scale} rotation={[0, rotationY, 0]}>
      {/* pernas e sapatos */}
      {[-0.1, 0.1].map((x) =>
        seated ? (
          <group key={x}>
            <Cap r={0.085} l={0.2} color={legColor} opacity={op} position={[x, 0.3, 0.2]} rotation={[Math.PI / 2, 0, 0]} />
            <Cap r={0.08} l={0.1} color={legColor} opacity={op} position={[x, 0.16, 0.42]} />
            <mesh position={[x, 0.05, 0.5]} scale={[1, 0.6, 1.5]}>
              <icosahedronGeometry args={[0.1, 1]} />
              <Mat color={c.shoe} />
            </mesh>
          </group>
        ) : (
          <group key={x}>
            <Cap r={0.085} l={0.3} color={legColor} opacity={op} position={[x, 0.3, 0]} />
            <mesh position={[x, 0.06, 0.05]} scale={[1, 0.65, 1.55]}>
              <icosahedronGeometry args={[0.1, 1]} />
              <Mat color={c.shoe} />
            </mesh>
          </group>
        ),
      )}
      {/* tronco (pivô na cintura) */}
      <group position={[0, hipY, 0]} rotation={[rad(lean), 0, 0]}>
        <Cap r={0.19} l={0.14} color={c.shirt} opacity={op} position={[0, 0.25, 0]} scale={[1.08, 1, 0.8]} />
        {/* cinto/cós */}
        <mesh position={[0, 0.0, 0]} scale={[1, 1, 0.8]}>
          <cylinderGeometry args={[0.2, 0.19, 0.09, 10]} />
          <Mat color={outfit === "mechanic" ? "#5b3d24" : c.pants} opacity={op} />
        </mesh>
        {outfit === "mechanic" && (
          <mesh position={[0.17, -0.02, 0.1]}>
            <boxGeometry args={[0.1, 0.12, 0.07]} />
            <Mat color="#7a5230" />
          </mesh>
        )}
        {/* abdômen luminoso */}
        <mesh position={[0, 0.18, 0.15]} scale={[1, 0.8, 0.3]}>
          <icosahedronGeometry args={[0.13, 1]} />
          <Mat color="#ffb74d" emissive="#ff9800" ei={coreGlow * 1.4} opacity={coreGlow > 0 ? 1 : 0.0001} />
        </mesh>
        {/* cinto de 5 pontos (x) */}
        {harness >= 0 && (
          <group>
            {[-1, 1].map((s) => (
              <mesh key={s} position={[s * 0.1, 0.3, 0.16]} rotation={[0, 0, s * rad(-14)]}>
                <boxGeometry args={[0.05, 0.5, 0.02]} />
                <Mat color={harness > 0 ? "#ffd400" : "#111111"} emissive="#ffd400" ei={harness * 1.2} />
              </mesh>
            ))}
          </group>
        )}
        {/* braço esquerdo (do personagem) */}
        <group position={[-0.28, 0.4, 0]} rotation={[0, 0, rad(-5)]}>
          <Cap r={0.07} l={0.2} color={c.shirt} opacity={op} position={[0, -0.17, 0]} />
          <mesh position={[0, -0.36, 0]}>
            <icosahedronGeometry args={[0.085, 1]} />
            <Mat color={c.glove} />
          </mesh>
          {outfit === "mechanic" && (
            <group position={[0, -0.38, 0.1]} rotation={[rad(90), 0, 0]}>
              <mesh position={[0, 0.18, 0]}>
                <boxGeometry args={[0.045, 0.36, 0.035]} />
                <Mat color="#c9d1da" metal={0.6} />
              </mesh>
              <mesh position={[0, 0.38, 0]}>
                <boxGeometry args={[0.14, 0.09, 0.035]} />
                <Mat color="#c9d1da" metal={0.6} />
              </mesh>
            </group>
          )}
        </group>
        {/* braço direito: gira PARA FORA (+wave) */}
        <group position={[0.28, 0.4, 0]} rotation={[0, 0, rad(wave + 5)]}>
          <Cap r={0.07} l={0.2} color={c.shirt} opacity={op} position={[0, -0.17, 0]} />
          <mesh position={[0, -0.36, 0]}>
            <icosahedronGeometry args={[0.085, 1]} />
            <Mat color={c.glove} />
          </mesh>
        </group>
        {/* pescoço */}
        <mesh position={[0, 0.5, 0]} scale={[neckScale, 1, neckScale]}>
          <cylinderGeometry args={[0.08, 0.09, 0.14, 8]} />
          <Mat color={c.skin} opacity={op} />
        </mesh>
        {/* cabeça grande e arredondada */}
        <group position={[0, 0.78, 0]} rotation={[0, 0, rad(headTilt)]} scale={helmetScale}>
          {outfit === "racing" ? (
            <>
              <mesh>
                <icosahedronGeometry args={[0.34, 2]} />
                <Mat color={headCol} />
              </mesh>
              {/* janela do rosto */}
              <mesh position={[0, -0.04, 0.2]} scale={[1, 0.95, 0.62]}>
                <icosahedronGeometry args={[0.25, 2]} />
                <Mat color={c.skin} />
              </mesh>
              {/* viseira levantada */}
              <mesh rotation={[0, 0, 0]}>
                <sphereGeometry args={[0.35, 12, 6, Math.PI / 2 - 0.95, 1.9, 0.5, 0.42]} />
                <Mat color="#2f94b8" emissive="#4dd0ff" ei={0.3} />
              </mesh>
              {/* faixa */}
              <mesh position={[0, 0.33, 0]}>
                <boxGeometry args={[0.07, 0.04, 0.5]} />
                <Mat color="#ffd400" />
              </mesh>
            </>
          ) : (
            <>
              <mesh>
                <icosahedronGeometry args={[0.32, 2]} />
                <Mat color={c.skin} />
              </mesh>
              {/* boné */}
              <mesh position={[0, 0.03, -0.01]}>
                <sphereGeometry args={[0.335, 12, 6, 0, Math.PI * 2, 0, 1.05]} />
                <Mat color={headCol} />
              </mesh>
              <mesh position={[0, 0.1, 0.3]} rotation={[rad(-8), 0, 0]} scale={[1, 0.25, 1]}>
                <cylinderGeometry args={[0.2, 0.22, 0.2, 10, 1, false, -Math.PI / 2, Math.PI]} />
                <Mat color={headCol} />
              </mesh>
            </>
          )}
          {/* olhos, bochechas e sorriso */}
          {[-0.1, 0.1].map((x) => (
            <group key={x}>
              <mesh position={[x, 0.0, outfit === "racing" ? 0.34 : 0.3]} scale={[1, 1.35, 0.5]}>
                <icosahedronGeometry args={[0.04, 1]} />
                <Mat color="#1b1b1b" />
              </mesh>
              <mesh position={[x * 1.6, -0.1, outfit === "racing" ? 0.33 : 0.29]} scale={[1, 0.7, 0.4]}>
                <icosahedronGeometry args={[0.04, 1]} />
                <Mat color="#ff8a80" />
              </mesh>
            </group>
          ))}
          <mesh position={[0, -0.1, outfit === "racing" ? 0.35 : 0.31]} rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.055, 0.014, 5, 10, Math.PI]} />
            <Mat color="#8a3b2a" />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/** Carro de F1 genérico fictício (sem equipes ou patrocinadores). Eixo longo = Z, frente = +Z. */
export const Car: React.FC<{opacity?: number; yaw?: number; position?: [number, number, number]}> = ({
  opacity = 1,
  yaw = 0,
  position = [0, 0, 0],
}) => {
  const body = "#d83a34";
  const dark = "#222831";
  const wheelOp = Math.max(opacity, 0.5);
  return (
    <group position={position} rotation={[0, rad(yaw), 0]}>
      {/* monocoque */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[0.56, 0.26, 2.0]} />
        <Mat color={body} opacity={opacity} />
      </mesh>
      {/* bico */}
      <mesh position={[0, 0.25, 1.55]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.65]}>
        <coneGeometry args={[0.2, 1.3, 8]} />
        <Mat color={body} opacity={opacity} />
      </mesh>
      {/* faixa branca */}
      <mesh position={[0, 0.415, 0.7]}>
        <boxGeometry args={[0.12, 0.012, 1.4]} />
        <Mat color="#f4f4f4" opacity={opacity} />
      </mesh>
      {/* laterais (sidepods) */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 0.45, 0.26, -0.2]}>
            <boxGeometry args={[0.36, 0.24, 1.2]} />
            <Mat color="#b82f2a" opacity={opacity} />
          </mesh>
          <mesh position={[s * 0.45, 0.28, 0.42]}>
            <boxGeometry args={[0.3, 0.14, 0.12]} />
            <Mat color="#101318" opacity={opacity} />
          </mesh>
        </group>
      ))}
      {/* cobertura do motor + entrada de ar */}
      <mesh position={[0, 0.5, -0.6]}>
        <boxGeometry args={[0.3, 0.3, 1.0]} />
        <Mat color={body} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.68, -0.35]}>
        <boxGeometry args={[0.2, 0.12, 0.2]} />
        <Mat color="#101318" opacity={opacity} />
      </mesh>
      {/* cockpit */}
      <mesh position={[0, 0.42, 0.25]}>
        <boxGeometry args={[0.34, 0.05, 0.6]} />
        <Mat color="#101318" opacity={opacity} />
      </mesh>
      {/* halo */}
      <mesh position={[0, 0.62, 0.3]} rotation={[rad(90), 0, 0]}>
        <torusGeometry args={[0.2, 0.025, 4, 10, Math.PI]} />
        <Mat color="#9aa4b2" opacity={wheelOp} />
      </mesh>
      {/* asa dianteira */}
      <mesh position={[0, 0.1, 2.15]}>
        <boxGeometry args={[1.5, 0.04, 0.38]} />
        <Mat color={dark} opacity={opacity} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.76, 0.18, 2.15]}>
          <boxGeometry args={[0.04, 0.2, 0.42]} />
          <Mat color={body} opacity={opacity} />
        </mesh>
      ))}
      {/* asa traseira */}
      <mesh position={[0, 0.8, -1.5]}>
        <boxGeometry args={[1.1, 0.05, 0.32]} />
        <Mat color={dark} opacity={opacity} />
      </mesh>
      <mesh position={[0, 0.92, -1.52]}>
        <boxGeometry args={[1.1, 0.04, 0.2]} />
        <Mat color={body} opacity={opacity} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.56, 0.72, -1.5]}>
          <boxGeometry args={[0.04, 0.4, 0.46]} />
          <Mat color={body} opacity={opacity} />
        </mesh>
      ))}
      <mesh position={[0, 0.5, -1.38]}>
        <boxGeometry args={[0.07, 0.4, 0.18]} />
        <Mat color={dark} opacity={opacity} />
      </mesh>
      {/* rodas com aro */}
      {[
        [-0.72, 0.32, 1.35, 0.32, 0.3],
        [0.72, 0.32, 1.35, 0.32, 0.3],
        [-0.74, 0.36, -1.15, 0.36, 0.42],
        [0.74, 0.36, -1.15, 0.36, 0.42],
      ].map((w, i) => (
        <group key={i} position={[w[0], w[1], w[2]]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[w[3], w[3], w[4], 12]} />
            <Mat color="#1c1f26" opacity={wheelOp} />
          </mesh>
          <mesh>
            <cylinderGeometry args={[w[3] * 0.55, w[3] * 0.55, w[4] + 0.02, 10]} />
            <Mat color="#aeb8c4" metal={0.4} opacity={wheelOp} />
          </mesh>
        </group>
      ))}
      {/* eixos */}
      <mesh position={[0, 0.34, 1.35]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.4, 6]} />
        <Mat color={dark} opacity={wheelOp} />
      </mesh>
      <mesh position={[0, 0.36, -1.15]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 1.5, 6]} />
        <Mat color={dark} opacity={wheelOp} />
      </mesh>
    </group>
  );
};

/** Coração de verdade (formato de coração extrudado). Largura ≈ 1,2; ponta para baixo. */
export const Heart: React.FC<{color: string; pulse: number; position?: [number, number, number]}> = ({
  color,
  pulse,
  position = [0, 0, 0],
}) => {
  const geo = React.useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(25, 25);
    s.bezierCurveTo(25, 25, 20, 0, 0, 0);
    s.bezierCurveTo(-30, 0, -30, 35, -30, 35);
    s.bezierCurveTo(-30, 55, -10, 77, 25, 95);
    s.bezierCurveTo(60, 77, 80, 55, 80, 35);
    s.bezierCurveTo(80, 35, 80, 0, 50, 0);
    s.bezierCurveTo(35, 0, 25, 25, 25, 25);
    const g = new THREE.ExtrudeGeometry(s, {depth: 28, bevelEnabled: true, bevelThickness: 8, bevelSize: 6, bevelSegments: 2, curveSegments: 10});
    g.translate(-25, -47, -14);
    g.scale(0.0105, 0.0105, 0.0105);
    return g;
  }, []);
  return (
    <group position={position} scale={pulse}>
      <mesh geometry={geo} rotation={[0, 0, Math.PI]}>
        <Mat color={color} emissive={color} ei={0.25} />
      </mesh>
    </group>
  );
};

export const Ground: React.FC<{y?: number; color?: string}> = ({y = 0, color = "#3a4252"}) => (
  <mesh position={[0, y - 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
    <planeGeometry args={[60, 60]} />
    <Mat color={color} />
  </mesh>
);

export const Lights: React.FC = () => (
  <>
    <ambientLight intensity={0.85} />
    <directionalLight position={[4, 8, 5]} intensity={1.6} />
    <directionalLight position={[-5, 3, -4]} intensity={0.5} color="#9fc4ff" />
  </>
);

export const tubeFromPoints = (pts: [number, number, number][], radius: number) => {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  return new THREE.TubeGeometry(curve, 16, radius, 6, false);
};

/** Osso/segmento entre dois pontos (não deforma posição ao mudar o raio). */
export const Bone: React.FC<{
  a: [number, number, number];
  b: [number, number, number];
  r: number;
  color: string;
  emissive?: string;
  ei?: number;
  opacity?: number;
}> = ({a, b, r, color, emissive, ei, opacity}) => {
  const A = new THREE.Vector3(a[0], a[1], a[2]);
  const B = new THREE.Vector3(b[0], b[1], b[2]);
  const mid = A.clone().add(B).multiplyScalar(0.5);
  const dir = B.clone().sub(A);
  const len = Math.max(dir.length(), 0.0001);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  return (
    <mesh position={[mid.x, mid.y, mid.z]} quaternion={q}>
      <cylinderGeometry args={[r, r, len, 8]} />
      <Mat color={color} emissive={emissive} ei={ei} opacity={opacity} />
    </mesh>
  );
};

/** Seta 3D de A até B (haste + ponta). */
export const Arrow: React.FC<{a: [number, number, number]; b: [number, number, number]; color?: string; r?: number}> = ({
  a,
  b,
  color = "#e53935",
  r = 0.035,
}) => {
  const A = new THREE.Vector3(a[0], a[1], a[2]);
  const B = new THREE.Vector3(b[0], b[1], b[2]);
  const dir = B.clone().sub(A);
  const len = dir.length();
  if (len < 0.05) return null;
  const n = dir.clone().normalize();
  const tip = Math.min(0.28, len * 0.4);
  const base = B.clone().sub(n.clone().multiplyScalar(tip));
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  const mid = B.clone().sub(n.clone().multiplyScalar(tip / 2));
  return (
    <group>
      <Bone a={a} b={[base.x, base.y, base.z]} r={r} color={color} emissive={color} ei={0.5} />
      <mesh position={[mid.x, mid.y, mid.z]} quaternion={q}>
        <coneGeometry args={[r * 3, tip, 8]} />
        <Mat color={color} emissive={color} ei={0.5} />
      </mesh>
    </group>
  );
};

const GRASS_N = 1400;
const Grass: React.FC = () => {
  const ref = React.useRef<THREE.InstancedMesh>(null);
  React.useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const d = new THREE.Object3D();
    for (let i = 0; i < GRASS_N; i++) {
      const x = (random("gx" + i) - 0.5) * 60;
      let z = (random("gz" + i) - 0.5) * 60;
      if (Math.abs(z) < 3.2) z = z < 0 ? z - 3.2 : z + 3.2;
      const sc = 0.7 + random("gs" + i) * 0.9;
      d.position.set(x, 0.17, z);
      d.rotation.set(0, random("gr" + i) * 6.28, 0);
      d.scale.set(sc, sc * (0.8 + random("gh" + i) * 0.8), sc);
      d.updateMatrix();
      m.setMatrixAt(i, d.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  }, []);
  return (
    <instancedMesh ref={ref} args={[undefined as any, undefined as any, GRASS_N]} frustumCulled={false}>
      <coneGeometry args={[0.06, 0.4, 3]} />
      <Mat color="#58a847" />
    </instancedMesh>
  );
};

/** Cenário externo persistente: grama, pista, zebras, árvores, morros, montanhas e nuvens. */
export const World: React.FC<{frame: number; road?: boolean}> = ({frame, road = true}) => {
  const trees = React.useMemo(
    () =>
      Array.from({length: 26}).map((_, i) => {
        const x = (random("tr" + i) - 0.5) * 44;
        const z = -(4.8 + random("tq" + i) * 18);
        return {x, z, s: 0.8 + random("ts" + i) * 0.9, c: ["#3f9a4d", "#2f8a4a", "#4aa65a"][i % 3]};
      }),
    [],
  );
  const kerbs = React.useMemo(() => Array.from({length: 36}).map((_, i) => -18 + i), []);
  const clouds = React.useMemo(
    () =>
      Array.from({length: 7}).map((_, i) => ({
        x: -30 + random("cx" + i) * 60,
        y: 9 + random("cy" + i) * 5,
        z: -18 - random("cz" + i) * 14,
        s: 1.4 + random("cs" + i) * 1.4,
      })),
    [],
  );
  return (
    <group>
      <mesh position={[0, -0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[160, 160]} />
        <Mat color="#78c25a" />
      </mesh>
      {road && (
        <>
          <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[160, 5.2]} />
            <Mat color="#3a4252" />
          </mesh>
          {kerbs.map((x) => (
            <React.Fragment key={x}>
              <mesh position={[x + 0.5, 0.01, 2.75]}>
                <boxGeometry args={[1, 0.04, 0.3]} />
                <Mat color={x % 2 === 0 ? "#e53935" : "#f4f4f4"} />
              </mesh>
              <mesh position={[x + 0.5, 0.01, -2.75]}>
                <boxGeometry args={[1, 0.04, 0.3]} />
                <Mat color={x % 2 === 0 ? "#e53935" : "#f4f4f4"} />
              </mesh>
            </React.Fragment>
          ))}
        </>
      )}
      <Grass />
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} scale={t.s}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.08, 0.11, 0.6, 5]} />
            <Mat color="#7a4e2d" />
          </mesh>
          <mesh position={[0, 0.95, 0]}>
            <coneGeometry args={[0.5, 1.0, 6]} />
            <Mat color={t.c} />
          </mesh>
          <mesh position={[0, 1.45, 0]}>
            <coneGeometry args={[0.36, 0.8, 6]} />
            <Mat color={t.c} />
          </mesh>
        </group>
      ))}
      {[-26, -6, 18, 38].map((x, i) => (
        <mesh key={x} position={[x, 0, -32 - (i % 2) * 6]} scale={[9 + i * 2, 4 + (i % 2) * 2, 6]}>
          <icosahedronGeometry args={[1, 0]} />
          <Mat color={i % 2 ? "#5aa65a" : "#4c9a52"} />
        </mesh>
      ))}
      {[-34, -12, 10, 32].map((x, i) => (
        <group key={x} position={[x, 0, -52]}>
          <mesh position={[0, 6 + (i % 2) * 2, 0]}>
            <coneGeometry args={[9 + (i % 2) * 3, 12 + (i % 2) * 4, 5]} />
            <Mat color="#7f93b8" />
          </mesh>
          <mesh position={[0, 10.8 + (i % 2) * 3.2, 0]}>
            <coneGeometry args={[3.2, 4, 5]} />
            <Mat color="#f2f6fb" />
          </mesh>
        </group>
      ))}
      {clouds.map((c, i) => {
        const x = ((((c.x + frame * 0.01) + 40) % 80) + 80) % 80 - 40;
        return (
          <group key={i} position={[x, c.y, c.z]} scale={c.s}>
            {[-1, 0, 1].map((k) => (
              <mesh key={k} position={[k * 0.9, k === 0 ? 0.25 : 0, 0]}>
                <icosahedronGeometry args={[k === 0 ? 1.1 : 0.8, 0]} />
                <meshBasicMaterial color="#ffffff" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};

/** Palco do laboratório: plataforma circular com anel luminoso (cenas internas). */
export const LabFloor: React.FC<{r?: number; y?: number; color?: string}> = ({r = 2.6, y = 0, color = "#1c3a6e"}) => (
  <group position={[0, y, 0]}>
    <mesh position={[0, -0.04, 0]}>
      <cylinderGeometry args={[r, r, 0.08, 36]} />
      <Mat color={color} />
    </mesh>
    <mesh position={[0, 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[r * 0.92, r * 0.97, 48]} />
      <meshBasicMaterial color="#4dd0ff" />
    </mesh>
  </group>
);
