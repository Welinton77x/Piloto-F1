import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {canvasTex, clamp, lerp, rng} from "./util";

/* ===== Cenários low-poly coloridos: "Dormir até meio-dia" (galo, melancias, praia) ===== */
export type V3 = [number, number, number];

const MATS = new Map<string, THREE.MeshStandardMaterial>();
/** material facetado (low-poly), compartilhado por cor */
export const lp = (color: string, rough = 0.85, metal = 0, emissive?: string, ei = 0) => {
  const k = `${color}|${rough}|${metal}|${emissive}|${ei}`;
  let m = MATS.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({color, roughness: rough, metalness: metal, flatShading: true});
    if (emissive) {
      m.emissive = new THREE.Color(emissive);
      m.emissiveIntensity = ei;
    }
    MATS.set(k, m);
  }
  return m;
};
const texMat = (key: string, tex: THREE.Texture, rough = 0.8) => {
  let m = MATS.get("tex:" + key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: tex, roughness: rough, flatShading: true});
    MATS.set("tex:" + key, m);
  }
  return m;
};

/** barra entre dois pontos */
export const Rod: React.FC<{a: V3; b: V3; r: number; mat: THREE.Material; seg?: number}> = ({a, b, r, mat, seg = 6}) => {
  const {pos, q, len} = useMemo(() => {
    const va = new THREE.Vector3(...a);
    const vb = new THREE.Vector3(...b);
    const d = vb.clone().sub(va);
    const len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    return {pos: va.add(vb).multiplyScalar(0.5), q, len};
  }, [a[0], a[1], a[2], b[0], b[1], b[2]]);
  return (
    <mesh position={pos} quaternion={q} material={mat} castShadow>
      <cylinderGeometry args={[r, r, len, seg]} />
    </mesh>
  );
};

/* ---------- céu, sol, nuvens ---------- */
export const Sky: React.FC<{top?: string; bottom?: string}> = ({top = "#3d97e6", bottom = "#cfefff"}) => {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {top: {value: new THREE.Color()}, bottom: {value: new THREE.Color()}},
        vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: `uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h = normalize(vP).y; gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.03, 0.5, h)), 1.0); }`,
      }),
    [],
  );
  mat.uniforms.top.value.set(top);
  mat.uniforms.bottom.value.set(bottom);
  return (
    <mesh material={mat} renderOrder={-10}>
      <sphereGeometry args={[140, 24, 12]} />
    </mesh>
  );
};

export const SunDisc: React.FC<{p: V3; r?: number; color?: string; k?: number}> = ({p, r = 4, color = "#fff2b8", k = 2.2}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color(color).multiplyScalar(k), fog: false, toneMapped: false}), [color, k]);
  return (
    <mesh position={p} material={m}>
      <icosahedronGeometry args={[r, 1]} />
    </mesh>
  );
};

export const Clouds: React.FC<{t: number; n?: number; seed?: number; z?: number; y?: number; spread?: number}> = ({t, n = 9, seed = 3, z = -55, y = 16, spread = 70}) => {
  const list = useMemo(() => {
    const r = rng(seed);
    return Array.from({length: n}, () => ({x: (r() - 0.5) * spread, y: y + r() * 10, z: z + (r() - 0.5) * 16, s: 1.6 + r() * 2.2, k: Math.floor(r() * 3) + 3}));
  }, [n, seed, z, y, spread]);
  const m = lp("#ffffff", 1, 0, "#ffffff", 0.25);
  return (
    <group>
      {list.map((c, i) => (
        <group key={i} position={[c.x + t * 0.35, c.y, c.z]} scale={c.s}>
          {Array.from({length: c.k}, (_, j) => (
            <mesh key={j} position={[(j - (c.k - 1) / 2) * 0.9, Math.sin(j * 2.1) * 0.25, Math.cos(j * 1.3) * 0.3]} scale={0.6 + 0.35 * Math.sin(j * 1.7 + i) ** 2} material={m}>
              <icosahedronGeometry args={[1, 0]} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
};

/** luz do sol com alvo móvel (sombra acompanha o plano) */
export const SunLight: React.FC<{target: V3; dir?: V3; intensity?: number; color?: string; ext?: number}> = ({target, dir = [-5, 9, 6], intensity = 2.8, color = "#fff1d6", ext = 9}) => {
  const ref = useRef<THREE.DirectionalLight>(null);
  useFrame(() => {
    const l = ref.current;
    if (!l) return;
    l.target.position.set(...target);
    l.target.updateMatrixWorld();
  }, -2);
  return (
    <directionalLight
      ref={ref}
      position={[target[0] + dir[0], target[1] + dir[1], target[2] + dir[2]]}
      intensity={intensity}
      color={color}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-camera-left={-ext}
      shadow-camera-right={ext}
      shadow-camera-top={ext}
      shadow-camera-bottom={-ext}
      shadow-camera-near={0.5}
      shadow-camera-far={80}
      shadow-bias={-0.0006}
      shadow-normalBias={0.03}
    />
  );
};

/* ---------- relevo da cidade: rua plana, ladeira, rua plana lá embaixo ---------- */
export const SLOPE = 0.3;
const S0 = 0;
const S1 = 22;
const CRV = 1.6;
const fy = (u: number) => (u < -CRV ? 0 : u < CRV ? (-SLOPE * (u + CRV) ** 2) / (4 * CRV) : -SLOPE * u);
const fd = (u: number) => (u < -CRV ? 0 : u < CRV ? (-SLOPE * (u + CRV)) / (2 * CRV) : -SLOPE);
export const groundY = (x: number) => fy(x - S0) - fy(x - S1);
export const groundAng = (x: number) => Math.atan(fd(x - S0) - fd(x - S1));
const groundYSlope = groundY;
const groundAngSlope = groundAng;

const Strip: React.FC<{z0: number; z1: number; x0?: number; x1?: number; y?: number; mat: THREE.Material; flat?: boolean}> = ({z0, z1, x0 = -70, x1 = 90, y = 0, mat, flat = false}) => {
  const geo = useMemo(() => {
    const n = 200;
    const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, n, 1);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, (flat ? 0 : groundY(pos.getX(i) + (x0 + x1) / 2)) + y);
    g.computeVertexNormals();
    return g;
  }, [z0, z1, x0, x1, y, flat]);
  return <mesh geometry={geo} position={[(x0 + x1) / 2, 0, (z0 + z1) / 2]} material={mat} receiveShadow />;
};

const WALLS = ["#f7d08a", "#f4a6a0", "#a9d9ee", "#c5e8a8", "#fbe3c0", "#f6b26b", "#c3b4e4", "#ffe58a"];
const ROOFS = ["#d9534f", "#c0392b", "#e67e22", "#9c5a3c", "#d35400"];

export const House: React.FC<{p: V3; w?: number; h?: number; d?: number; wall: string; roof: string; rotY?: number; door?: string; base?: number; lit?: boolean; dark?: boolean}> = ({p, w = 3.4, h = 2.7, d = 3, wall, roof, rotY = 0, door = "#8a4f2a", base = 0, lit, dark}) => {
  const roofGeo = useMemo(() => {
    const s = new THREE.Shape();
    const o = 0.28;
    s.moveTo(-w / 2 - o, 0);
    s.lineTo(w / 2 + o, 0);
    s.lineTo(0, w * 0.4);
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, {depth: d + 0.5, bevelEnabled: false});
    g.translate(0, 0, -(d + 0.5) / 2);
    return g;
  }, [w, d]);
  const floors = h > 3.5 ? 2 : 1;
  const glass = lit ? lp("#ffd98a", 0.4, 0, "#ffc25a", 1.6) : dark ? lp("#27304a", 0.3, 0.1) : lp("#7cc6ec", 0.25, 0.1);
  const frame = lp("#ffffff", 0.7);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {base > 0 && (
        <mesh position={[0, -base / 2, 0]} material={lp("#b9b2a4")} receiveShadow>
          <boxGeometry args={[w + 0.1, base, d + 0.1]} />
        </mesh>
      )}
      <mesh position={[0, h / 2, 0]} material={lp(wall)} castShadow receiveShadow>
        <boxGeometry args={[w, h, d]} />
      </mesh>
      <mesh position={[0, h, 0]} geometry={roofGeo} material={lp(roof)} castShadow />
      <mesh position={[-w * 0.24, 0.62, d / 2 + 0.03]} material={lp(door)}>
        <boxGeometry args={[0.66, 1.24, 0.08]} />
      </mesh>
      <mesh position={[-w * 0.24 + 0.2, 0.62, d / 2 + 0.08]} material={lp("#f2c94c", 0.3, 0.6)}>
        <sphereGeometry args={[0.04, 6, 4]} />
      </mesh>
      {Array.from({length: floors}, (_, k) =>
        (k === 0 ? [w * 0.22] : [-w * 0.24, w * 0.22]).map((x, j) => (
          <group key={k + "-" + j} position={[x, k === 0 ? h * (floors === 1 ? 0.52 : 0.3) : h * 0.72, d / 2 + 0.03]}>
            <mesh material={frame}>
              <boxGeometry args={[0.86, 0.74, 0.06]} />
            </mesh>
            <mesh position={[0, 0, 0.02]} material={glass}>
              <boxGeometry args={[0.7, 0.58, 0.06]} />
            </mesh>
            <mesh position={[0, 0, 0.06]} material={frame}>
              <boxGeometry args={[0.05, 0.58, 0.02]} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
};

export const Tree: React.FC<{p: V3; s?: number; c?: string}> = ({p, s = 1, c = "#5fae3e"}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.55, 0]} material={lp("#8a5a33")} castShadow>
      <cylinderGeometry args={[0.09, 0.14, 1.1, 5]} />
    </mesh>
    <mesh position={[0, 1.55, 0]} material={lp(c)} castShadow>
      <icosahedronGeometry args={[0.72, 0]} />
    </mesh>
    <mesh position={[0.28, 2.05, 0.12]} material={lp(c)} castShadow>
      <icosahedronGeometry args={[0.48, 0]} />
    </mesh>
  </group>
);

export const Bush: React.FC<{p: V3; s?: number; c?: string}> = ({p, s = 1, c = "#4f9e36"}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.25, 0]} material={lp(c)} castShadow>
      <icosahedronGeometry args={[0.38, 0]} />
    </mesh>
    <mesh position={[0.35, 0.2, 0.05]} material={lp(c)} castShadow>
      <icosahedronGeometry args={[0.28, 0]} />
    </mesh>
  </group>
);

export const PalmTree: React.FC<{p: V3; s?: number; lean?: number}> = ({p, s = 1, lean = 0.25}) => (
  <group position={p} scale={s} rotation={[0, 0, lean]}>
    {Array.from({length: 6}, (_, i) => (
      <mesh key={i} position={[Math.sin(i * 0.25) * 0.15 * i * 0.3, 0.35 + i * 0.62, 0]} rotation={[0, 0, -0.04 * i]} material={lp(i % 2 ? "#9a6b3c" : "#86592f")} castShadow>
        <cylinderGeometry args={[0.13 - i * 0.008, 0.16 - i * 0.008, 0.66, 6]} />
      </mesh>
    ))}
    <group position={[0.2, 3.95, 0]}>
      {Array.from({length: 7}, (_, i) => (
        <group key={i} rotation={[0, (i / 7) * Math.PI * 2, 0]}>
          <mesh position={[0.75, -0.18, 0]} rotation={[0, 0, -0.45]} scale={[1, 0.09, 0.32]} material={lp(i % 2 ? "#3f9a3a" : "#4fb446")} castShadow>
            <octahedronGeometry args={[0.85, 0]} />
          </mesh>
        </group>
      ))}
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[Math.cos(i * 2.1) * 0.15, -0.2, Math.sin(i * 2.1) * 0.15]} material={lp("#6b4423")}>
          <icosahedronGeometry args={[0.11, 0]} />
        </mesh>
      ))}
    </group>
  </group>
);

/* ---------- placas e objetos de rua ---------- */
const signTex = (key: string, lines: string[], bg: string, fg = "#ffffff", w = 512, h = 192) =>
  canvasTex(key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = fg;
    c.lineWidth = 10;
    c.strokeRect(12, 12, w - 24, h - 24);
    c.fillStyle = fg;
    c.textAlign = "center";
    c.textBaseline = "middle";
    lines.forEach((l, i) => {
      c.font = `bold ${i === 0 ? 64 : 52}px sans-serif`;
      c.fillText(l, w / 2, (h / (lines.length + 1)) * (i + 1) + 4);
    });
  });

export const RoadSign: React.FC<{p: V3; lines: string[]; bg?: string; rotY?: number; w?: number}> = ({p, lines, bg = "#1f7a3a", rotY = 0, w = 1.8}) => {
  const tex = signTex("sign:" + lines.join("|"), lines, bg);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[sd * w * 0.36, 1.1, -0.03]} material={lp("#9aa3ad", 0.4, 0.5)} castShadow>
          <cylinderGeometry args={[0.04, 0.04, 2.2, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 1.95, 0.0]} material={texMat("sign:" + lines.join("|"), tex, 0.6)} castShadow>
        <boxGeometry args={[w, w * 0.375, 0.05]} />
      </mesh>
    </group>
  );
};

export const LampPost: React.FC<{p: V3; on?: boolean}> = ({p, on = true}) => (
  <group position={p}>
    <mesh position={[0, 1.6, 0]} material={lp("#4a5260", 0.5, 0.4)} castShadow>
      <cylinderGeometry args={[0.05, 0.07, 3.2, 6]} />
    </mesh>
    <mesh position={[0, 3.25, 0.2]} rotation={[Math.PI / 2, 0, 0]} material={lp("#4a5260", 0.5, 0.4)}>
      <cylinderGeometry args={[0.04, 0.04, 0.45, 6]} />
    </mesh>
    <mesh position={[0, 3.15, 0.42]} material={on ? lp("#fff4c2", 0.4, 0, "#ffe28a", 0.4) : lp("#6a6f7a", 0.5)}>
      <coneGeometry args={[0.16, 0.22, 6]} />
    </mesh>
  </group>
);

/** lixeira que tomba (fall 0..1) para frente (+x) */
export const TrashCan: React.FC<{p: V3; fall?: number; color?: string; ang?: number}> = ({p, fall = 0, color = "#2f9e5a", ang = 0}) => {
  const a = fall * (Math.PI / 2) * 0.95;
  return (
    <group position={p} rotation={[0, 0, ang]}>
      <group position={[0.27, 0, 0]} rotation={[0, 0, -a]}>
        <group position={[-0.27, 0, 0]}>
          <mesh position={[0, 0.42, 0]} material={lp(color)} castShadow receiveShadow>
            <cylinderGeometry args={[0.28, 0.24, 0.84, 8]} />
          </mesh>
          <mesh position={[0.25 * fall, 0.88 + 0.25 * Math.sin(Math.PI * clamp(fall * 1.2)), 0]} rotation={[0, 0, -1.6 * fall]} material={lp("#25804a")} castShadow>
            <cylinderGeometry args={[0.31, 0.31, 0.07, 8]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

export const Fence: React.FC<{x0: number; x1: number; z: number; y?: number; h?: number}> = ({x0, x1, z, y = 0, h = 0.85}) => {
  const n = Math.round((x1 - x0) / 0.32);
  const m = lp("#fbfbf5", 0.7);
  return (
    <group position={[0, y, z]}>
      {Array.from({length: n + 1}, (_, i) => (
        <mesh key={i} position={[x0 + i * 0.32, h / 2, 0]} material={m} castShadow>
          <boxGeometry args={[0.13, h, 0.05]} />
        </mesh>
      ))}
      {[0.25, 0.6].map((k) => (
        <mesh key={k} position={[(x0 + x1) / 2, h * k, -0.04]} material={m}>
          <boxGeometry args={[x1 - x0, 0.08, 0.04]} />
        </mesh>
      ))}
    </group>
  );
};

/* ---------- a cidade ---------- */
export const TOWN_HOUSES = (() => {
  const r = rng(77);
  const out: {x: number; w: number; h: number; wall: string; roof: string}[] = [];
  for (let x = -46; x < 66; x += 4.9) {
    out.push({x: x + (r() - 0.5) * 0.4, w: 3.2 + r() * 0.6, h: r() < 0.45 ? 4.2 : 2.7, wall: WALLS[Math.floor(r() * WALLS.length)], roof: ROOFS[Math.floor(r() * ROOFS.length)]});
  }
  return out;
})();
export const Town: React.FC<{t: number; cans?: number[]; frontHouses?: boolean; galo?: boolean; lit?: (i: number) => boolean; dark?: boolean; lamps?: boolean; clouds?: boolean; flat?: boolean; clear?: [number, number]}> = ({t, cans = [], frontHouses = false, galo = true, lit, dark, lamps = true, clouds = true, flat = false, clear}) => {
  const free = (x: number) => !clear || x < clear[0] || x > clear[1];
  const houses = TOWN_HOUSES;
  // flat: cidade sem a ladeira (rua toda no nível 0)
  const groundY = flat ? (_x: number) => 0 : groundYSlope;
  const groundAng = flat ? (_x: number) => 0 : groundAngSlope;
  const dash = lp("#ffd84a", 0.6);
  return (
    <group>
      <Strip flat={flat} z0={-60} z1={-2.7} mat={lp("#7ccc58")} />
      <Strip flat={flat} z0={-2.7} z1={-1.55} y={0.08} mat={lp("#dcd5c6")} />
      <Strip flat={flat} z0={-1.55} z1={1.55} mat={lp("#5b5f69", 0.9)} />
      <Strip flat={flat} z0={1.55} z1={2.7} y={0.08} mat={lp("#dcd5c6")} />
      <Strip flat={flat} z0={2.7} z1={40} mat={lp("#86d260")} />
      {Array.from({length: 60}, (_, i) => {
        const x = -60 + i * 2.6;
        return (
          <mesh key={i} position={[x, groundY(x) + 0.012, 0]} rotation={[0, 0, groundAng(x)]} material={dash}>
            <boxGeometry args={[1.2, 0.02, 0.12]} />
          </mesh>
        );
      })}
      {houses.map((h, i) => (
        <House key={i} p={[h.x, groundY(h.x), -5.9]} w={h.w} h={h.h} wall={h.wall} roof={h.roof} base={Math.abs(groundY(h.x - 1.8) - groundY(h.x + 1.8)) + 0.3} lit={lit ? lit(i) : false} dark={dark} />
      ))}
      {frontHouses &&
        houses
          .filter((h) => h.x < -22)
          .map((h, i) => <House key={"f" + i} p={[h.x + 2, 0, 5.9]} rotY={Math.PI} w={h.w} h={i % 2 ? 4.2 : 2.7} wall={WALLS[(i + 3) % WALLS.length]} roof={ROOFS[(i + 2) % ROOFS.length]} />)}
      {houses.map((h, i) => (i % 2 === 0 && free(h.x + 2.45) ? <Tree key={"t" + i} p={[h.x + 2.45, groundY(h.x + 2.45), -3.6]} s={0.9 + (i % 3) * 0.12} c={i % 3 ? "#5fae3e" : "#4c9a35"} /> : null))}
      {Array.from({length: 13}, (_, i) => {
        const x = -44 + i * 9;
        return free(x) ? <LampPost key={"l" + i} p={[x, groundY(x) + 0.08, -2.25]} on={lamps} /> : null;
      })}
      {Array.from({length: 22}, (_, i) => {
        const x = -46 + i * 5.3;
        return flat && clear ? null : <Bush key={"b" + i} p={[x, groundY(x), 3.6 + (i % 3) * 0.6]} s={0.8 + (i % 2) * 0.3} />;
      })}
      {/* lixeiras do "dominó" na calçada da ladeira */}
      {galo && CANS.map((x, i) => (
        <TrashCan key={"c" + i} p={[x, groundY(x) + 0.08, -2.05]} ang={groundAng(x)} fall={cans[i] ?? 0} color={i % 2 ? "#2f7fd0" : "#2f9e5a"} />
      ))}
      {/* cerca do vizinho e o poste do galo */}
      {galo && (
        <>
          <Fence x0={-5.1} x1={-1.7} z={-3.05} />
          <mesh position={[-3.4, 0.55, -3.0]} material={lp("#fbfbf5", 0.7)} castShadow>
            <boxGeometry args={[0.2, 1.1, 0.2]} />
          </mesh>
          <RoadSign p={[-17.5, 0.08, -2.2]} lines={["RODOVIÁRIA", "12 km  →"]} />
        </>
      )}
      {/* morros ao fundo */}
      {[-50, -20, 10, 40, 70].map((x, i) => (
        <mesh key={"m" + i} position={[x, -6, -48 - (i % 2) * 6]} scale={[22, 14 + (i % 3) * 3, 10]} material={lp(i % 2 ? "#6fbf55" : "#5cae48")}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      ))}
      {clouds && <Clouds t={t} />}
    </group>
  );
};
export const CANS = [7.2, 8.4, 9.6, 10.8, 12.0, 13.2];
export const NEIGHBOR_POST: V3 = [-3.4, 1.1, -3.0];

/* ---------- galo ---------- */
export type RPose = {
  pos?: V3;
  rotY?: number;
  flap?: number; // 0..1 asas abertas
  flapPh?: number; // fase da batida
  crow?: number; // 0..1 cabeça pra trás, bico aberto
  chest?: number; // 0..1 peito estufado
  blink?: number;
  shiver?: number; // tremedeira
  t?: number;
  headYaw?: number;
  headTilt?: number;
  lean?: number;
  sit?: number; // 0..1 sentado
  wingFwd?: number; // asas pra frente (abraçado / segurando)
  shrug?: number; // asas pra cima (ombros)
  glasses?: number; // 0..1 óculos escuros
  glassesUp?: boolean; // óculos na testa
  ticket?: boolean;
  walk?: number; // fase de passo
  walkAmt?: number;
  beakOpen?: number;
};

const ticketTex = () =>
  canvasTex("ticket", 256, 128, (c) => {
    c.fillStyle = "#ffe066";
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = "#e85d3a";
    c.fillRect(0, 0, 256, 30);
    c.fillStyle = "#fff";
    c.font = "bold 24px sans-serif";
    c.textAlign = "center";
    c.fillText("PASSAGEM", 128, 24);
    c.fillStyle = "#3a2a10";
    c.font = "bold 30px sans-serif";
    c.fillText("PRAIA", 100, 72);
    c.font = "bold 18px sans-serif";
    c.fillText("1 GALO · IDA", 100, 104);
    for (let i = 0; i < 16; i++) c.fillRect(196 + i * 3, 46, i % 3 ? 1.5 : 2.5, 66);
  });

export const Ticket: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => {
  const tex = ticketTex();
  return (
    <mesh position={p} rotation={r} scale={s} material={texMat("ticket", tex, 0.7)} castShadow>
      <boxGeometry args={[0.36, 0.18, 0.008]} />
    </mesh>
  );
};

export const Rooster: React.FC<{p: RPose; s?: number}> = ({p, s = 1}) => {
  const {pos = [0, 0, 0], rotY = 0, flap = 0, flapPh = 0, crow = 0, chest = 0, blink = 0, shiver = 0, t = 0, headYaw = 0, headTilt = 0, lean = 0, sit = 0, wingFwd = 0, shrug = 0, glasses = 0, glassesUp = false, ticket = false, walk = 0, walkAmt = 0, beakOpen = 0} = p;
  const W = lp("#f4efe3", 0.8);
  const gold = lp("#f0a83a", 0.7);
  const red = lp("#e5262d", 0.6);
  const yel = lp("#f6b40e", 0.5);
  const wing = lp("#e8ddc8", 0.8);
  const wingTip = lp("#b8642e", 0.8);
  const tailA = lp("#1d4a34", 0.35, 0.25);
  const tailB = lp("#28284a", 0.35, 0.25);
  const black = lp("#141414", 0.3);
  const white = lp("#ffffff", 0.3);
  const sx = shiver * 0.018 * Math.sin(t * 70);
  const flapA = flap * (0.6 + 0.6 * Math.sin(flapPh));
  const step = walkAmt * Math.abs(Math.sin(walk)) * 0.05;
  const bodyY = 0.36 - 0.17 * sit + step;
  const ch = 1 + 0.4 * chest;
  return (
    <group position={[pos[0] + sx, pos[1], pos[2]]} rotation={[0, rotY, 0]} scale={s}>
      {/* pernas */}
      {[-1, 1].map((sd) => {
        const lift = walkAmt * Math.max(0, Math.sin(walk + (sd > 0 ? 0 : Math.PI))) * 0.07;
        return (
          <group key={sd} position={[0.07 * sd, lift, 0.02]}>
            <mesh position={[0, (0.24 - 0.17 * sit) / 2 + 0.02, 0]} material={yel} castShadow>
              <cylinderGeometry args={[0.017, 0.017, 0.24 - 0.17 * sit, 5]} />
            </mesh>
            {[-0.45, 0, 0.45].map((a) => (
              <mesh key={a} position={[Math.sin(a) * 0.05, 0.012, Math.cos(a) * 0.05]} rotation={[Math.PI / 2, 0, -a]} material={yel}>
                <cylinderGeometry args={[0.012, 0.008, 0.11, 4]} />
              </mesh>
            ))}
            <mesh position={[0, 0.012, -0.04]} rotation={[-Math.PI / 2, 0, 0]} material={yel}>
              <cylinderGeometry args={[0.01, 0.007, 0.06, 4]} />
            </mesh>
          </group>
        );
      })}
      <group position={[0, bodyY, 0]} rotation={[-0.18 - lean, 0, 0]}>
        {/* corpo */}
        <mesh scale={[0.2, 0.19, 0.27]} material={W} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        {/* peito */}
        <mesh position={[0, 0.0, 0.13]} scale={[0.17 * ch, 0.18 * ch, 0.15 * ch]} material={W} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        {/* asas */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.16 * sd, 0.08 + 0.05 * shrug, 0.03]} rotation={[-wingFwd * 0.9 - 0.4 * shrug, wingFwd * 0.5 * sd, sd * (0.1 + flapA * 1.3 + 0.5 * shrug)]}>
            <mesh position={[0.03 * sd, -0.07, -0.03]} rotation={[0.25, 0, 0]} scale={[0.045, 0.12, 0.21]} material={wing} castShadow>
              <icosahedronGeometry args={[1, 1]} />
            </mesh>
            <mesh position={[0.035 * sd, -0.13, -0.17]} rotation={[0.6, 0, 0]} scale={[0.035, 0.06, 0.1]} material={wingTip}>
              <icosahedronGeometry args={[1, 0]} />
            </mesh>
            {ticket && sd === -1 && <Ticket p={[-0.06, -0.12, 0.2]} r={[0.2, 0.25, 0.1]} s={0.9} />}
          </group>
        ))}
        {/* cauda */}
        <group position={[0, 0.06, -0.22]} rotation={[-0.35, 0, 0]}>
          {[-2, -1, 0, 1, 2].map((k) => (
            <group key={k} rotation={[-0.5 + Math.abs(k) * 0.12, 0, k * 0.28]}>
              <mesh position={[0, 0.2, -0.05]} rotation={[-0.35, 0, 0]} scale={[0.05, 0.26, 0.022]} material={k % 2 ? tailB : tailA} castShadow>
                <icosahedronGeometry args={[1, 0]} />
              </mesh>
              <mesh position={[0, 0.36, -0.2]} rotation={[-1.1, 0, 0]} scale={[0.04, 0.16, 0.02]} material={k % 2 ? tailA : tailB}>
                <icosahedronGeometry args={[1, 0]} />
              </mesh>
            </group>
          ))}
        </group>
        {/* pescoço (penas douradas) */}
        <mesh position={[0, 0.17, 0.14]} rotation={[0.35, 0, 0]} scale={[0.12, 0.17, 0.11]} material={gold} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        {/* cabeça */}
        <group position={[0, 0.31, 0.19]} rotation={[0.18 + lean - crow * 0.85 + headTilt, headYaw, 0]}>
          <mesh scale={[0.092, 0.1, 0.1]} material={W} castShadow>
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
          {/* crista */}
          {[-0.04, 0.0, 0.045, 0.085].map((z, i) => (
            <mesh key={i} position={[0, 0.1 + (i === 1 || i === 2 ? 0.025 : 0), z - 0.02]} scale={[0.022, 0.05 - (i === 0 || i === 3 ? 0.012 : 0), 0.032]} material={red} castShadow>
              <icosahedronGeometry args={[1, 0]} />
            </mesh>
          ))}
          {/* bico */}
          <mesh position={[0, 0.0, 0.11]} rotation={[Math.PI / 2 - 0.15 - 0.25 * beakOpen - 0.35 * crow, 0, 0]} material={yel}>
            <coneGeometry args={[0.032, 0.085, 4]} />
          </mesh>
          <mesh position={[0, -0.025, 0.1]} rotation={[Math.PI / 2 + 0.3 + 0.6 * crow + 0.5 * beakOpen, 0, 0]} material={yel}>
            <coneGeometry args={[0.022, 0.06, 4]} />
          </mesh>
          {/* barbela */}
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.014 * sd, -0.075, 0.07]} scale={[0.02, 0.042, 0.022]} material={red}>
              <icosahedronGeometry args={[1, 0]} />
            </mesh>
          ))}
          {/* olhos */}
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.05 * sd, 0.025, 0.07]} rotation={[0, 0.35 * sd, 0]} scale={[1, Math.max(0.08, 1 - blink), 1]}>
              <mesh scale={[0.028, 0.03, 0.016]} material={white}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
              <mesh position={[0, 0, 0.012]} scale={[0.015, 0.018, 0.01]} material={black}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
            </group>
          ))}
          {/* óculos escuros */}
          {glasses > 0.01 && (
            <group position={[0, glassesUp ? 0.085 : 0.028, glassesUp ? 0.075 : 0.088]} rotation={[glassesUp ? -0.5 : 0, 0, 0]} scale={glasses}>
              {[-1, 1].map((sd) => (
                <mesh key={sd} position={[0.048 * sd, 0, 0]} rotation={[0, 0.3 * sd, 0]} material={lp("#111318", 0.15, 0.6)}>
                  <boxGeometry args={[0.062, 0.042, 0.012]} />
                </mesh>
              ))}
              <mesh material={lp("#111318", 0.15, 0.6)}>
                <boxGeometry args={[0.04, 0.01, 0.01]} />
              </mesh>
            </group>
          )}
        </group>
      </group>
    </group>
  );
};

/* ---------- bicicleta ---------- */
export const Bicycle: React.FC<{p?: V3; rotY?: number; spin?: number; color?: string}> = ({p = [0, 0, 0], rotY = 0, spin = 0, color = "#e8412c"}) => {
  const fr = lp(color, 0.4, 0.3);
  const tire = lp("#1d1f24", 0.8);
  const metal = lp("#c8ccd2", 0.3, 0.8);
  const R = 0.34;
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {[-0.52, 0.52].map((x) => (
        <group key={x} position={[x, R, 0]} rotation={[0, 0, -spin]}>
          <mesh material={tire} castShadow>
            <torusGeometry args={[R, 0.035, 5, 16]} />
          </mesh>
          {[0, 1, 2].map((k) => (
            <mesh key={k} rotation={[0, 0, (k * Math.PI) / 3]} material={metal}>
              <boxGeometry args={[R * 2, 0.012, 0.012]} />
            </mesh>
          ))}
        </group>
      ))}
      <Rod a={[-0.52, R, 0]} b={[-0.05, R + 0.05, 0]} r={0.025} mat={fr} />
      <Rod a={[-0.05, R + 0.05, 0]} b={[-0.18, R + 0.5, 0]} r={0.025} mat={fr} />
      <Rod a={[-0.52, R, 0]} b={[-0.18, R + 0.45, 0]} r={0.022} mat={fr} />
      <Rod a={[-0.18, R + 0.45, 0]} b={[0.4, R + 0.48, 0]} r={0.025} mat={fr} />
      <Rod a={[-0.05, R + 0.05, 0]} b={[0.4, R + 0.48, 0]} r={0.025} mat={fr} />
      <Rod a={[0.52, R, 0]} b={[0.4, R + 0.62, 0]} r={0.025} mat={fr} />
      <mesh position={[-0.2, R + 0.56, 0]} material={lp("#2a2a2a")} castShadow>
        <boxGeometry args={[0.24, 0.05, 0.12]} />
      </mesh>
      <mesh position={[0.4, R + 0.64, 0]} rotation={[Math.PI / 2, 0, 0]} material={metal}>
        <cylinderGeometry args={[0.018, 0.018, 0.5, 6]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.4, R + 0.64, 0.25 * sd]} rotation={[Math.PI / 2, 0, 0]} material={lp("#2a2a2a")}>
          <cylinderGeometry args={[0.03, 0.03, 0.1, 6]} />
        </mesh>
      ))}
      <mesh position={[0.4, R + 0.67, 0.18]} material={lp("#f2c94c", 0.3, 0.7)}>
        <sphereGeometry args={[0.035, 6, 4]} />
      </mesh>
    </group>
  );
};

/* ---------- dinheiro ---------- */
const billTex = () =>
  canvasTex("bill", 128, 64, (c) => {
    c.fillStyle = "#6cc070";
    c.fillRect(0, 0, 128, 64);
    c.strokeStyle = "#2e7d32";
    c.lineWidth = 5;
    c.strokeRect(5, 5, 118, 54);
    c.fillStyle = "#1b5e20";
    c.font = "bold 30px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("R$", 64, 34);
  });
export const Bill: React.FC<{p: V3; r: V3; s?: number}> = ({p, r, s = 1}) => (
  <mesh position={p} rotation={r} scale={s} material={texMat("bill", billTex(), 0.8)}>
    <boxGeometry args={[0.32, 0.16, 0.006]} />
  </mesh>
);

/* ---------- melancia ---------- */
const melonTex = () =>
  canvasTex("melon", 256, 128, (c, r) => {
    c.fillStyle = "#79c447";
    c.fillRect(0, 0, 256, 128);
    c.fillStyle = "#2d6e1e";
    for (let i = 0; i < 10; i++) {
      const x0 = i * 25.6 + 6;
      c.beginPath();
      c.moveTo(x0, 0);
      for (let y = 0; y <= 128; y += 8) c.lineTo(x0 + (r() - 0.5) * 6, y);
      for (let y = 128; y >= 0; y -= 8) c.lineTo(x0 + 11 + (r() - 0.5) * 6, y);
      c.closePath();
      c.fill();
    }
  });
export const Melon: React.FC<{p: V3; roll?: number; yaw?: number; r?: number; tilt?: number}> = ({p, roll = 0, yaw = 0, r = 0.24, tilt = 0}) => (
  <group position={p} rotation={[0, yaw, 0]}>
    <group rotation={[tilt, 0, -roll]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={[r, r * 1.22, r]} material={texMat("melon", melonTex(), 0.45)} castShadow receiveShadow>
        <sphereGeometry args={[1, 9, 7]} />
      </mesh>
    </group>
  </group>
);

/** pilha de melancias na carroceria (posições locais) */
export const PILE: V3[] = (() => {
  const out: V3[] = [];
  const r = 0.24;
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) out.push([-1.45 + i * 0.5, 0.95 + r, -0.48 + j * 0.48]);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) out.push([-1.2 + i * 0.5, 0.95 + r * 2.7, -0.24 + j * 0.48]);
  for (let i = 0; i < 3; i++) out.push([-0.95 + i * 0.5, 0.95 + r * 4.4, 0]);
  return out;
})();

/* ---------- caminhão de melancia ---------- */
export const MelonTruck: React.FC<{p: V3; tilt?: number; spin?: number; melons?: number; jump?: number; t?: number; children?: React.ReactNode}> = ({p, tilt = 0, spin = 0, melons = PILE.length, jump = 0, t = 0, children}) => {
  const cab = lp("#e8412c", 0.5, 0.1);
  const wood = lp("#c98a4b", 0.85);
  const dark = lp("#2a2d33", 0.8);
  const glass = lp("#9fd7f2", 0.15, 0.3);
  const grey = lp("#b8bec6", 0.35, 0.7);
  const R = 0.4;
  return (
    <group position={p} rotation={[0, 0, tilt]}>
      {/* rodas */}
      {[-1.05, 1.35].map((x) =>
        [-1, 1].map((sd) => (
          <group key={x + "" + sd} position={[x, R, 0.78 * sd]} rotation={[Math.PI / 2, 0, 0]}>
            <group rotation={[0, spin, 0]}>
              <mesh material={dark} castShadow>
                <cylinderGeometry args={[R, R, 0.28, 10]} />
              </mesh>
              <mesh position={[0, 0.15 * sd, 0]} material={grey}>
                <cylinderGeometry args={[R * 0.5, R * 0.5, 0.02, 6]} />
              </mesh>
            </group>
          </group>
        )),
      )}
      {/* chassi */}
      <mesh position={[0.05, 0.62, 0]} material={dark} castShadow>
        <boxGeometry args={[3.6, 0.2, 1.3]} />
      </mesh>
      {/* cabine */}
      <group position={[1.35, 0, 0]}>
        <mesh position={[0, 1.25, 0]} material={cab} castShadow receiveShadow>
          <boxGeometry args={[1.0, 1.1, 1.62]} />
        </mesh>
        <mesh position={[0.18, 0.88, 0]} material={cab} castShadow>
          <boxGeometry args={[1.08, 0.5, 1.64]} />
        </mesh>
        <mesh position={[0.15, 1.42, 0]} material={glass}>
          <boxGeometry args={[0.76, 0.5, 1.66]} />
        </mesh>
        <mesh position={[0.51, 1.42, 0]} material={glass}>
          <boxGeometry args={[0.02, 0.5, 1.4]} />
        </mesh>
        <mesh position={[0.74, 0.75, 0]} material={grey}>
          <boxGeometry args={[0.1, 0.22, 1.7]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.73, 0.98, 0.58 * sd]} material={lp("#fff6c8", 0.3, 0, "#ffe9a0", 0.6)}>
            <boxGeometry args={[0.06, 0.16, 0.24]} />
          </mesh>
        ))}
        <mesh position={[-0.1, 1.82, 0]} material={lp("#ffd84a", 0.5)}>
          <boxGeometry args={[0.6, 0.08, 1.0]} />
        </mesh>
      </group>
      {/* carroceria */}
      <mesh position={[-0.35, 0.78, 0]} material={wood} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.12, 1.62]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[-0.35, 1.06, 0.78 * sd]} material={wood} castShadow>
          <boxGeometry args={[2.5, 0.46, 0.07]} />
        </mesh>
      ))}
      <mesh position={[0.87, 1.1, 0]} material={wood} castShadow>
        <boxGeometry args={[0.07, 0.56, 1.62]} />
      </mesh>
      <mesh position={[-1.58, 1.06, 0]} material={wood} castShadow>
        <boxGeometry args={[0.07, 0.46, 1.62]} />
      </mesh>
      {/* melancias */}
      {PILE.slice(0, melons).map((m, i) => (
        <Melon key={i} p={[m[0], m[1] + jump * (0.15 + 0.1 * Math.sin(i * 2.7)) - 0.75 + 0.75, m[2]]} roll={i * 0.7 + jump * Math.sin(i) * 0.6} yaw={0.15 * Math.sin(i * 3.1)} />
      ))}
      {children}
    </group>
  );
};

/* ---------- gente (figurante low-poly) ---------- */
export type MiniP = {p: V3; rotY?: number; shirt: string; pants?: string; skin?: string; hair?: string; ph?: number; amt?: number; arms?: number; s?: number; look?: number; cap?: string; sit?: number; wave?: number; t?: number};
export const Mini: React.FC<MiniP> = ({p, rotY = 0, shirt, pants = "#3b4a6b", skin = "#e9b98f", hair = "#3a2416", ph = 0, amt = 0, arms = 0, s = 1, look = 0, cap, sit = 0, wave = 0, t = 0}) => {
  const sw = Math.sin(ph) * 0.7 * amt;
  const bob = Math.abs(Math.sin(ph)) * 0.08 * amt;
  return (
    <group position={[p[0], p[1] + bob, p[2]]} rotation={[0, rotY, 0]} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.1 * sd, 0.82, 0]} rotation={[sw * sd - 1.4 * sit, 0, 0]}>
          <mesh position={[0, -0.38, 0]} material={lp(pants)} castShadow>
            <capsuleGeometry args={[0.08, 0.6, 2, 6]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.86, 0]} material={lp(pants)}>
        <cylinderGeometry args={[0.18, 0.18, 0.16, 6]} />
      </mesh>
      <mesh position={[0, 1.18, 0]} scale={[1, 1, 0.75]} material={lp(shirt)} castShadow>
        <capsuleGeometry args={[0.2, 0.32, 2, 6]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.26 * sd, 1.4, 0]} rotation={[-sw * sd * 0.9 - arms * 2.7 - (sd > 0 ? wave * 2.6 : 0), 0, sd * (0.18 + (sd > 0 ? wave * 0.3 * Math.sin(t * 14) : 0))]}>
          <mesh position={[0, -0.27, 0]} material={lp(skin)} castShadow>
            <capsuleGeometry args={[0.06, 0.42, 2, 5]} />
          </mesh>
          <mesh position={[0, -0.04, 0]} material={lp(shirt)}>
            <icosahedronGeometry args={[0.09, 0]} />
          </mesh>
        </group>
      ))}
      <group position={[0, 1.66, 0]} rotation={[-look, 0, 0]}>
        <mesh material={lp(skin)} castShadow>
          <icosahedronGeometry args={[0.2, 1]} />
        </mesh>
        <mesh position={[0, 0.03, -0.01]} rotation={[0.25, 0, 0]} material={lp(hair)}>
          <sphereGeometry args={[0.215, 7, 4, 0, Math.PI * 2, 0, 1.25]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.07 * sd, 0.02, 0.18]} material={lp("#151515", 0.3)}>
            <sphereGeometry args={[0.025, 6, 4]} />
          </mesh>
        ))}
        <mesh position={[0, -0.07, 0.185]} rotation={[0, 0, 0]} scale={[1, 0.5, 0.5]} material={lp("#7a2a2a", 0.5)}>
          <sphereGeometry args={[0.035, 6, 4]} />
        </mesh>
        {cap && (
          <group position={[0, 0.08, 0]}>
            <mesh material={lp(cap)}>
              <sphereGeometry args={[0.225, 7, 4, 0, Math.PI * 2, 0, 1.3]} />
            </mesh>
            <mesh position={[0, 0.0, 0.2]} scale={[1, 0.15, 0.7]} material={lp(cap)}>
              <cylinderGeometry args={[0.16, 0.16, 0.1, 8, 1, false, -Math.PI / 2, Math.PI]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};
export const SHIRTS = ["#e74c3c", "#3498db", "#f39c12", "#9b59b6", "#1abc9c", "#ff6f91", "#2ecc71", "#f1c40f", "#e67e22", "#5dade2"];
export const SKINS = ["#f1c08f", "#e0a878", "#c68a5a", "#8d5a3a", "#f5d0b0", "#a8714a"];
export const HAIRS = ["#2a1a10", "#5a3418", "#1a1a1a", "#b07a3a", "#d9b56a", "#7a3a1a"];

/* ---------- praia ---------- */
export const SAND_K = 0.05;
export const sandY = (z: number) => (z >= 0 ? SAND_K * z : 0.12 * z);
const umbTex = (a: string, b: string) =>
  canvasTex("umb" + a + b, 256, 32, (c) => {
    for (let i = 0; i < 8; i++) {
      c.fillStyle = i % 2 ? a : b;
      c.fillRect(i * 32, 0, 32, 32);
    }
  });
export const Umbrella: React.FC<{p: V3; a?: string; b?: string; tilt?: number; s?: number}> = ({p, a = "#e74c3c", b = "#ffffff", tilt = 0.12, s = 1}) => (
  <group position={p} rotation={[tilt, 0, tilt * 0.6]} scale={s}>
    <mesh position={[0, 1.0, 0]} material={lp("#f5f5f5", 0.5)} castShadow>
      <cylinderGeometry args={[0.03, 0.03, 2.0, 5]} />
    </mesh>
    <mesh position={[0, 2.05, 0]} material={texMat("umb" + a + b, umbTex(a, b), 0.8)} castShadow>
      <coneGeometry args={[1.1, 0.45, 8, 1, true]} />
    </mesh>
  </group>
);
export const Towel: React.FC<{p: V3; c?: string; r?: number}> = ({p, c = "#3498db", r = 0}) => (
  <mesh position={p} rotation={[0, r, 0]} material={lp(c)} receiveShadow>
    <boxGeometry args={[0.8, 0.02, 1.6]} />
  </mesh>
);

export const BeachChair: React.FC<{p: V3; rotY?: number; c?: string}> = ({p, rotY = 0, c = "#ff7f50"}) => {
  const w = lp("#c99a5b");
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[0.3 * sd, 0.15, 0.2]} material={w}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
          </mesh>
          <mesh position={[0.3 * sd, 0.15, -0.35]} material={w}>
            <boxGeometry args={[0.04, 0.3, 0.04]} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.3, 0.0]} rotation={[-0.08, 0, 0]} material={lp(c)} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.04, 0.8]} />
      </mesh>
      <mesh position={[0, 0.58, -0.52]} rotation={[0.85, 0, 0]} material={lp(c)} castShadow receiveShadow>
        <boxGeometry args={[0.62, 0.04, 0.7]} />
      </mesh>
    </group>
  );
};

const hotelTex = () =>
  canvasTex("hotel", 256, 512, (c) => {
    c.fillStyle = "#f4efe4";
    c.fillRect(0, 0, 256, 512);
    for (let fl = 0; fl < 10; fl++)
      for (let k = 0; k < 4; k++) {
        c.fillStyle = (fl + k) % 3 ? "#5fb3e0" : "#86c9ec";
        c.fillRect(18 + k * 60, 20 + fl * 49, 44, 30);
        c.fillStyle = "#e0d6c4";
        c.fillRect(14 + k * 60, 52 + fl * 49, 52, 5);
      }
  });
export const Hotel: React.FC<{p: V3; h?: number; w?: number}> = ({p, h = 10, w = 3.6}) => (
  <group position={p}>
    <mesh position={[0, h / 2, 0]} material={texMat("hotel", hotelTex(), 0.8)} castShadow receiveShadow>
      <boxGeometry args={[w, h, w]} />
    </mesh>
    <mesh position={[0, h + 0.1, 0]} material={lp("#e85d3a")}>
      <boxGeometry args={[w + 0.2, 0.2, w + 0.2]} />
    </mesh>
  </group>
);

/** mar com ondas facetadas */
export const Sea: React.FC<{t: number; y: number; z?: number}> = ({t, y, z = -40}) => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(200, 110, 70, 40);
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const zz = pos.getZ(i);
    pos.setY(i, 0.07 * Math.sin(x * 0.55 + t * 1.7 + zz * 0.2) + 0.05 * Math.sin(zz * 0.9 - t * 1.3 + x * 0.25));
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return <mesh geometry={geo} position={[0, y, z]} material={lp("#25a9dc", 0.3, 0.1)} receiveShadow />;
};

export const Sand: React.FC = () => {
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(120, 70, 60, 35);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const r = rng(9);
    for (let i = 0; i < pos.count; i++) {
      const z = pos.getZ(i) + 10;
      pos.setY(i, sandY(z) + (r() - 0.5) * 0.05);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return <mesh geometry={geo} position={[0, 0, 10]} material={lp("#f3d697", 0.95)} receiveShadow />;
};

/** muro de areia (cresce de baixo pra cima), com ameias de balde no topo */
export const WALL_Z = 7.3;
export const SandWall: React.FC<{h: number; x0?: number; x1?: number}> = ({h, x0 = -40, x1 = 40}) => {
  if (h <= 0.01) return null;
  const n = Math.round((x1 - x0) / 1.3);
  const m = lp("#e9c27c", 0.95);
  const m2 = lp("#dcb26a", 0.95);
  const top = sandY(WALL_Z) + h;
  return (
    <group>
      <mesh position={[(x0 + x1) / 2, (top - 1) / 2, WALL_Z]} material={m} castShadow receiveShadow>
        <boxGeometry args={[x1 - x0, top + 1, 2.2]} />
      </mesh>
      {Array.from({length: Math.max(0, Math.floor(h / 1.1))}, (_, k) => (
        <mesh key={"s" + k} position={[(x0 + x1) / 2, sandY(WALL_Z) + (k + 1) * 1.1 - 0.05, WALL_Z + 1.11]} material={m2}>
          <boxGeometry args={[x1 - x0, 0.09, 0.02]} />
        </mesh>
      ))}
      {Array.from({length: n}, (_, i) => (
        <mesh key={i} position={[x0 + 0.65 + i * 1.3, top + 0.28, WALL_Z + (i % 2 ? 0.45 : -0.45)]} material={i % 3 ? m : m2} castShadow>
          <cylinderGeometry args={[0.36, 0.46, 0.56, 7]} />
        </mesh>
      ))}
    </group>
  );
};

export const Bucket: React.FC<{p?: V3; r?: V3; s?: number; c?: string}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, c = "#e8412c"}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, -0.1, 0]} material={lp(c, 0.5)} castShadow>
      <cylinderGeometry args={[0.13, 0.1, 0.2, 8]} />
    </mesh>
    <mesh position={[0, -0.005, 0]} material={lp("#f3d697", 0.95)}>
      <cylinderGeometry args={[0.122, 0.122, 0.02, 8]} />
    </mesh>
    <mesh position={[0, 0.0, 0]} rotation={[0, 0, 0]} material={lp("#f2f2f2", 0.4)}>
      <torusGeometry args={[0.13, 0.008, 4, 10, Math.PI]} />
    </mesh>
  </group>
);
export const Shovel: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, -0.18, 0]} material={lp("#ffd23a", 0.5)}>
      <cylinderGeometry args={[0.018, 0.018, 0.4, 5]} />
    </mesh>
    <mesh position={[0, -0.43, 0.02]} rotation={[0.2, 0, 0]} material={lp("#2f9be0", 0.5)}>
      <boxGeometry args={[0.13, 0.16, 0.02]} />
    </mesh>
  </group>
);

/* ---------- ônibus ---------- */
export const Bus: React.FC<{p: V3; rotY?: number; spin?: number; door?: number; children?: React.ReactNode}> = ({p, rotY = 0, spin = 0, door = 0, children}) => {
  const body = lp("#2d7dd2", 0.5, 0.1);
  const top = lp("#f4f4f0", 0.6);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({color: "#bfe6ff", roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.28, flatShading: true}), []);
  const dark = lp("#24272d", 0.8);
  const R = 0.45;
  const L = 6.2;
  const signT = signTex("bus-sign2", ["CENTRO"], "#141414", "#ffb347", 512, 96);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {[-2.0, 1.9].map((x) =>
        [-1, 1].map((sd) => (
          <group key={x + "" + sd} position={[x, R, 1.0 * sd]} rotation={[Math.PI / 2, 0, 0]}>
            <group rotation={[0, spin, 0]}>
              <mesh material={dark} castShadow>
                <cylinderGeometry args={[R, R, 0.3, 10]} />
              </mesh>
              <mesh position={[0, 0.16 * sd, 0]} material={lp("#c0c6ce", 0.3, 0.7)}>
                <cylinderGeometry args={[R * 0.5, R * 0.5, 0.02, 6]} />
              </mesh>
            </group>
          </group>
        )),
      )}
      {/* saia azul + faixa branca + teto */}
      <mesh position={[0, 0.95, 0]} material={body} castShadow receiveShadow>
        <boxGeometry args={[L, 0.9, 2.2]} />
      </mesh>
      {/* laterais acima da janela */}
      <mesh position={[0, 2.55, 0]} material={top} castShadow>
        <boxGeometry args={[L, 0.42, 2.2]} />
      </mesh>
      {/* colunas entre janelas (laterais) */}
      {Array.from({length: 7}, (_, i) => (
        <group key={i}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[-L / 2 + 0.1 + i * ((L - 1.4) / 6), 1.88, 1.07 * sd]} material={top}>
              <boxGeometry args={[0.16, 0.95, 0.06]} />
            </mesh>
          ))}
        </group>
      ))}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[-0.6, 1.88, 1.07 * sd]} material={glass}>
          <boxGeometry args={[L - 1.3, 0.92, 0.03]} />
        </mesh>
      ))}
      {/* traseira */}
      <mesh position={[-L / 2 + 0.04, 1.88, 0]} material={top}>
        <boxGeometry args={[0.08, 0.95, 2.2]} />
      </mesh>
      {/* frente: para-brisa transparente, pilares */}
      <mesh position={[L / 2 - 0.02, 1.86, 0]} material={glass}>
        <boxGeometry args={[0.04, 1.0, 2.0]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[L / 2 - 0.05, 1.86, 1.04 * sd]} material={top}>
          <boxGeometry args={[0.1, 1.0, 0.12]} />
        </mesh>
      ))}
      <mesh position={[L / 2 + 0.01, 2.53, 0]} material={texMat("bus-sign2", signT, 0.5)}>
        <boxGeometry args={[0.04, 0.3, 1.6]} />
      </mesh>
      {/* porta lateral (perto da frente) */}
      <mesh position={[L / 2 - 0.85 - door * 0.55, 1.45, 1.1]} material={glass}>
        <boxGeometry args={[0.55, 1.9, 0.04]} />
      </mesh>
      <mesh position={[L / 2 - 0.85 - door * 0.55, 1.45, 1.11]} material={top}>
        <boxGeometry args={[0.6, 0.06, 0.02]} />
      </mesh>
      {/* faróis e para-choque */}
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[L / 2 + 0.02, 0.85, 0.72 * sd]} material={lp("#fff6c8", 0.3, 0, "#ffe9a0", 0.7)}>
          <boxGeometry args={[0.04, 0.22, 0.34]} />
        </mesh>
      ))}
      <mesh position={[L / 2 + 0.06, 0.55, 0]} material={lp("#c0c6ce", 0.3, 0.7)}>
        <boxGeometry args={[0.1, 0.18, 2.24]} />
      </mesh>
      {/* piso e banco do motorista */}
      <mesh position={[0, 1.42, 0]} material={lp("#555b66")}>
        <boxGeometry args={[L - 0.1, 0.04, 2.1]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[L / 2 - 1.05, 1.44, 0.5 * sd]}>
          <mesh position={[0, 0.25, 0]} material={lp("#3a6fb0")}>
            <boxGeometry args={[0.5, 0.12, 0.6]} />
          </mesh>
          <mesh position={[-0.25, 0.65, 0]} material={lp("#3a6fb0")}>
            <boxGeometry args={[0.1, 0.8, 0.6]} />
          </mesh>
        </group>
      ))}
      {/* volante */}
      <mesh position={[L / 2 - 0.55, 2.05, -0.5]} rotation={[0, 0, Math.PI / 2 - 0.5]} material={dark}>
        <torusGeometry args={[0.2, 0.03, 5, 12]} />
      </mesh>
      {children}
    </group>
  );
};

/* ---------- quarto ---------- */
export const Bedroom: React.FC<{night?: number; t: number; clock?: number}> = ({night = 0, t, clock = 0}) => {
  const wall = lp(night > 0.5 ? "#4b6aa8" : "#9ad6f2", 0.95);
  const wall2 = lp(night > 0.5 ? "#405c96" : "#86c9ea", 0.95);
  const wood = lp("#d9a86c", 0.8);
  const frameW = lp("#ffffff", 0.7);
  // parede do fundo com a janela (x -0.95..0.35, y 1.45..2.55)
  const WX0 = -0.95;
  const WX1 = 0.35;
  const WY0 = 1.45;
  const WY1 = 2.55;
  const BZ = -2.5;
  return (
    <group>
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} material={wood} receiveShadow>
        <planeGeometry args={[7, 7]} />
      </mesh>
      {/* tapete */}
      <mesh position={[0.6, 0.01, 0.9]} rotation={[-Math.PI / 2, 0, 0]} material={lp("#ffb3c1", 0.95)} receiveShadow>
        <circleGeometry args={[0.8, 8]} />
      </mesh>
      {/* parede do fundo em 4 pedaços em volta da janela */}
      <mesh position={[(WX0 - 3.5) / 2, 2, BZ]} material={wall} receiveShadow>
        <boxGeometry args={[WX0 + 3.5, 4, 0.2]} />
      </mesh>
      <mesh position={[(WX1 + 3.5) / 2, 2, BZ]} material={wall} receiveShadow>
        <boxGeometry args={[3.5 - WX1, 4, 0.2]} />
      </mesh>
      <mesh position={[(WX0 + WX1) / 2, WY0 / 2, BZ]} material={wall} receiveShadow>
        <boxGeometry args={[WX1 - WX0, WY0, 0.2]} />
      </mesh>
      <mesh position={[(WX0 + WX1) / 2, (WY1 + 4) / 2, BZ]} material={wall} receiveShadow>
        <boxGeometry args={[WX1 - WX0, 4 - WY1, 0.2]} />
      </mesh>
      {/* moldura e parapeito */}
      {[WX0, WX1].map((x) => (
        <mesh key={x} position={[x, (WY0 + WY1) / 2, BZ + 0.02]} material={frameW}>
          <boxGeometry args={[0.1, WY1 - WY0 + 0.1, 0.26]} />
        </mesh>
      ))}
      <mesh position={[(WX0 + WX1) / 2, WY1, BZ + 0.02]} material={frameW}>
        <boxGeometry args={[WX1 - WX0 + 0.1, 0.1, 0.26]} />
      </mesh>
      <mesh position={[(WX0 + WX1) / 2, WY0 - 0.03, BZ + 0.08]} material={frameW} receiveShadow castShadow>
        <boxGeometry args={[WX1 - WX0 + 0.3, 0.08, 0.5]} />
      </mesh>
      {/* paredes laterais */}
      <mesh position={[-2.3, 2, 0]} material={wall2} receiveShadow>
        <boxGeometry args={[0.2, 4, 7]} />
      </mesh>
      <mesh position={[2.6, 2, 0]} material={wall2} receiveShadow>
        <boxGeometry args={[0.2, 4, 7]} />
      </mesh>
      {/* lá fora: árvore e casa do vizinho */}
      <group position={[0, 0, -9]}>
        <House p={[1.6, 0, 0]} wall={night > 0.5 ? "#7d6a8a" : "#f4a6a0"} roof={night > 0.5 ? "#5a3a50" : "#d9534f"} />
        <Tree p={[-2.4, 0, 1.5]} s={1.3} c={night > 0.5 ? "#2f5a4a" : "#5fae3e"} />
      </group>
      <mesh position={[0, -0.01, -9]} rotation={[-Math.PI / 2, 0, 0]} material={lp(night > 0.5 ? "#2f4a3a" : "#7ccc58")}>
        <planeGeometry args={[30, 12]} />
      </mesh>
      {/* cama */}
      <group position={[-0.3, 0, -1.2]}>
        <mesh position={[0, 0.17, 0]} material={wood} castShadow receiveShadow>
          <boxGeometry args={[1.45, 0.3, 2.5]} />
        </mesh>
        <mesh position={[0, 0.38, 0]} material={lp("#ffffff", 0.95)} castShadow receiveShadow>
          <boxGeometry args={[1.35, 0.16, 2.4]} />
        </mesh>
        <mesh position={[0, 0.62, -1.24]} material={lp("#e98b4a", 0.8)} castShadow>
          <boxGeometry args={[1.5, 1.24, 0.1]} />
        </mesh>
        <mesh position={[0, 0.54, -0.95]} scale={[0.55, 0.11, 0.24]} material={lp("#fff4dc", 0.95)} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      </group>
      {/* criado-mudo + despertador */}
      <group position={[1.05, 0, -2.05]}>
        <mesh position={[0, 0.3, 0]} material={lp("#f2c14e", 0.8)} castShadow receiveShadow>
          <boxGeometry args={[0.55, 0.6, 0.5]} />
        </mesh>
        <mesh position={[0, 0.72, 0.05]} rotation={[-0.1, -0.35, 0]} material={lp("#e74c3c", 0.5)} castShadow>
          <boxGeometry args={[0.36, 0.24, 0.16]} />
        </mesh>
      </group>
      {/* relógio de parede */}
      <group position={[0.95, 2.45, BZ + 0.12]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} material={lp("#ffffff", 0.6)}>
          <cylinderGeometry args={[0.32, 0.32, 0.05, 12]} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]} material={lp("#e74c3c", 0.6)}>
          <cylinderGeometry args={[0.36, 0.36, 0.04, 12]} />
        </mesh>
        {Array.from({length: 12}, (_, i) => (
          <mesh key={i} position={[Math.sin((i / 12) * Math.PI * 2) * 0.25, Math.cos((i / 12) * Math.PI * 2) * 0.25, 0.03]} material={lp("#333")}>
            <boxGeometry args={[0.03, 0.03, 0.01]} />
          </mesh>
        ))}
        <group rotation={[0, 0, -clock / 12 * Math.PI * 2]} position={[0, 0, 0.04]}>
          <mesh position={[0, 0.08, 0]} material={lp("#222")}>
            <boxGeometry args={[0.03, 0.17, 0.01]} />
          </mesh>
        </group>
        <group rotation={[0, 0, -clock * Math.PI * 2]} position={[0, 0, 0.05]}>
          <mesh position={[0, 0.11, 0]} material={lp("#222")}>
            <boxGeometry args={[0.02, 0.23, 0.01]} />
          </mesh>
        </group>
      </group>
      {/* quadro */}
      <mesh position={[-1.7, 2.3, BZ + 0.12]} material={lp("#ffd84a", 0.7)}>
        <boxGeometry args={[0.7, 0.5, 0.04]} />
      </mesh>
      <mesh position={[-1.7, 2.3, BZ + 0.145]} material={lp("#3fb3a8", 0.7)}>
        <boxGeometry args={[0.58, 0.38, 0.02]} />
      </mesh>
      <mesh position={[-1.7, 2.27, BZ + 0.16]} material={lp("#f39c12", 0.7)}>
        <icosahedronGeometry args={[0.09, 0]} />
      </mesh>
    </group>
  );
};
export const SILL: V3 = [-0.3, 1.46, -2.38];

/** cobertor em cima do menino deitado */
export const Blanket: React.FC<{c?: string}> = ({c = "#ff7b54"}) => (
  <group position={[-0.3, 0, -1.2]}>
    <mesh position={[0, 0.5, 0.42]} material={lp(c, 0.9)} castShadow receiveShadow>
      <boxGeometry args={[1.42, 0.14, 1.62]} />
    </mesh>
    <mesh position={[0, 0.62, 0.3]} scale={[0.5, 0.2, 0.75]} material={lp(c, 0.9)} castShadow>
      <icosahedronGeometry args={[1, 1]} />
    </mesh>
    <mesh position={[0, 0.58, -0.36]} scale={[1.42, 0.2, 0.18]} material={lp("#fff1e6", 0.9)}>
      <boxGeometry args={[1, 1, 1]} />
    </mesh>
  </group>
);
