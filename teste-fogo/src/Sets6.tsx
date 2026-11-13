import React, {useMemo, useRef} from "react";
import * as THREE from "three";
import {useFrame} from "@react-three/fiber";
import {canvasTex, clamp, lerp} from "./util";
import {lp, V3, Umbrella} from "./Sets5";

/* ===== Objetos do vídeo "Internet rápida" (pombo na antena) — mesmo estilo low-poly ===== */

const texMat = (() => {
  const cache = new Map<string, THREE.MeshStandardMaterial>();
  return (key: string, tex: THREE.Texture, rough = 0.8) => {
    let m = cache.get(key);
    if (!m) {
      m = new THREE.MeshStandardMaterial({map: tex, roughness: rough, flatShading: true});
      cache.set(key, m);
    }
    return m;
  };
})();

/* ---------- pombo (personagem) ---------- */
export type PPose = {
  pos?: V3;
  rotY?: number;
  peck?: number; // 0..1 cabeça abaixada bicando
  flap?: number;
  flapPh?: number;
  blink?: number;
  headYaw?: number;
  headTilt?: number;
  bob?: number; // balanço da cabeça pra frente/trás
  sit?: number;
  chest?: number;
  glow?: number; // olhos brilhando no escuro
  wingFwd?: number; // asas cruzadas na frente
  t?: number;
  hat?: boolean; // cartolinha de noivo
  veil?: boolean; // veuzinho de noiva
  rings?: boolean; // alianças no pescoço
};
export const Pigeon: React.FC<{p: PPose; s?: number}> = ({p, s = 1}) => {
  const {pos = [0, 0, 0], rotY = 0, peck = 0, flap = 0, flapPh = 0, blink = 0, headYaw = 0, headTilt = 0, bob = 0, sit = 0, chest = 0, glow = 0, wingFwd = 0, hat = false, veil = false, rings = false} = p;
  const body = lp("#8f97a5", 0.8);
  const head = lp("#a1a9b6", 0.8);
  const neckA = lp("#3f8a6a", 0.35, 0.45);
  const neckB = lp("#7a4f9a", 0.35, 0.45);
  const wing = lp("#737b89", 0.8);
  const bar = lp("#2e3138", 0.7);
  const feet = lp("#e58c8c", 0.6);
  const beak = lp("#3a3a3e", 0.5);
  const cere = lp("#ecebe4", 0.6);
  const eyeM = glow > 0.01 ? lp("#ff9a2e", 0.4, 0, "#ffb14a", 2.5) : lp("#ff8a1e", 0.4);
  const fa = flap * (0.5 + 0.7 * Math.sin(flapPh));
  const by = 0.17 - 0.08 * sit;
  return (
    <group position={pos} rotation={[0, rotY, 0]} scale={s}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.045 * sd, 0, 0.01]}>
          <mesh position={[0, (0.1 - 0.08 * sit) / 2 + 0.01, 0]} material={feet}>
            <cylinderGeometry args={[0.012, 0.012, 0.1 - 0.08 * sit, 4]} />
          </mesh>
          {[-0.5, 0, 0.5].map((a) => (
            <mesh key={a} position={[Math.sin(a) * 0.03, 0.008, Math.cos(a) * 0.03]} rotation={[Math.PI / 2, 0, -a]} material={feet}>
              <cylinderGeometry args={[0.008, 0.006, 0.06, 4]} />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[0, by, 0]} rotation={[-0.1, 0, 0]}>
        {/* corpo gordinho */}
        <mesh scale={[0.15, 0.13, 0.2]} material={body} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        <mesh position={[0, 0.0, 0.08]} scale={[0.13 * (1 + 0.3 * chest), 0.13 * (1 + 0.3 * chest), 0.12 * (1 + 0.3 * chest)]} material={body} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        {/* pescoço furta-cor */}
        <mesh position={[0, 0.09, 0.1]} rotation={[0.4, 0, 0]} scale={[0.09, 0.09, 0.085]} material={neckA}>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
        <mesh position={[0, 0.06, 0.13]} rotation={[0.4, 0, 0]} scale={[0.07, 0.06, 0.06]} material={neckB}>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
        {/* asas com as duas listras pretas */}
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.11 * sd, 0.04, 0.0]} rotation={[-wingFwd * 0.8, wingFwd * 0.6 * sd, sd * (0.15 + fa * 1.4)]}>
            <mesh position={[0.02 * sd, -0.03, -0.04]} scale={[0.035, 0.09, 0.17]} material={wing} castShadow>
              <icosahedronGeometry args={[1, 1]} />
            </mesh>
            {[0, 1].map((k) => (
              <mesh key={k} position={[0.05 * sd, -0.04 - k * 0.025, -0.08 - k * 0.02]} rotation={[0.3, 0, 0]} material={bar}>
                <boxGeometry args={[0.012, 0.012, 0.08]} />
              </mesh>
            ))}
          </group>
        ))}
        {/* cauda */}
        <mesh position={[0, 0.02, -0.21]} rotation={[0.35, 0, 0]} scale={[0.07, 0.015, 0.1]} material={wing} castShadow>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
        <mesh position={[0, 0.0, -0.29]} rotation={[0.35, 0, 0]} scale={[0.06, 0.012, 0.03]} material={bar}>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
        {/* cabeça */}
        <group position={[0, 0.17 - 0.12 * peck, 0.15 + 0.04 * bob + 0.08 * peck]} rotation={[0.9 * peck + headTilt, headYaw, 0]}>
          <mesh scale={[0.07, 0.072, 0.075]} material={head} castShadow>
            <icosahedronGeometry args={[1, 1]} />
          </mesh>
          <mesh position={[0, -0.01, 0.075]} rotation={[Math.PI / 2 - 0.2, 0, 0]} material={beak}>
            <coneGeometry args={[0.014, 0.05, 4]} />
          </mesh>
          <mesh position={[0, 0.0, 0.06]} scale={[0.018, 0.012, 0.012]} material={cere}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.036 * sd, 0.022, 0.052]} rotation={[0, 0.35 * sd, 0]} scale={[1, Math.max(0.1, 1 - blink), 1]}>
              <mesh scale={[0.024, 0.026, 0.013]} material={eyeM}>
                <sphereGeometry args={[1, 8, 6]} />
              </mesh>
              <mesh position={[0, 0, 0.011]} scale={[0.012, 0.013, 0.006]} material={lp("#101010", 0.3)}>
                <sphereGeometry args={[1, 6, 4]} />
              </mesh>
            </group>
          ))}
          {hat && (
            <group position={[0, 0.065, -0.005]} rotation={[-0.15, 0, 0.12]}>
              <mesh position={[0, 0.0, 0]} material={lp("#15161d", 0.4)}>
                <cylinderGeometry args={[0.075, 0.075, 0.008, 18]} />
              </mesh>
              <mesh position={[0, 0.045, 0]} material={lp("#15161d", 0.4)}>
                <cylinderGeometry args={[0.045, 0.048, 0.085, 18]} />
              </mesh>
              <mesh position={[0, 0.014, 0]} material={lp("#e8414f", 0.5)}>
                <cylinderGeometry args={[0.049, 0.049, 0.016, 18]} />
              </mesh>
            </group>
          )}
          {veil && (
            <group>
              <mesh position={[0, -0.04, -0.07]} material={new THREE.MeshStandardMaterial({color: "#ffffff", transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false})}>
                <cylinderGeometry args={[0.035, 0.12, 0.2, 18, 1, true, 2.2, Math.PI * 2 - 4.4]} />
              </mesh>
              <mesh position={[0, 0.06, -0.02]} material={lp("#ffb3c6", 0.5)}>
                <sphereGeometry args={[0.022, 10, 8]} />
              </mesh>
            </group>
          )}
        </group>
        {rings &&
          [-1, 1].map((sd) => (
            <mesh key={"anel" + sd} position={[0.02 * sd, 0.045, 0.16]} rotation={[0.3, 0.5 * sd, 0]} material={new THREE.MeshStandardMaterial({color: "#ffcc33", metalness: 0.8, roughness: 0.2, emissive: "#5a3a00", emissiveIntensity: 0.4})}>
              <torusGeometry args={[0.035, 0.01, 8, 20]} />
            </mesh>
          ))}
      </group>
    </group>
  );
};

/* ---------- revoada: centenas de pombos com instâncias (leve de renderizar) ---------- */
export type Bird = {p: V3; yaw: number; flap: number; s?: number; pitch?: number};
export const Flock: React.FC<{birds: Bird[]; glow?: number}> = ({birds, glow = 0}) => {
  const n = Math.max(1, birds.length);
  const bodyRef = useRef<THREE.InstancedMesh>(null);
  const wingRef = useRef<THREE.InstancedMesh>(null);
  const eyeRef = useRef<THREE.InstancedMesh>(null);
  const geos = useMemo(() => {
    const body = new THREE.IcosahedronGeometry(1, 0);
    body.scale(0.13, 0.11, 0.2);
    const head = new THREE.IcosahedronGeometry(1, 0);
    head.scale(0.065, 0.065, 0.07);
    head.translate(0, 0.1, 0.17);
    const wingG = new THREE.BoxGeometry(0.22, 0.012, 0.14);
    wingG.translate(0.11, 0, -0.02);
    const eye = new THREE.SphereGeometry(0.016, 6, 4);
    return {body, head, wingG, eye};
  }, []);
  const mats = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({color: "#8f97a5", roughness: 0.8, flatShading: true}),
      wing: new THREE.MeshStandardMaterial({color: "#6c7482", roughness: 0.8, flatShading: true, side: THREE.DoubleSide}),
      eye: new THREE.MeshBasicMaterial({color: new THREE.Color("#ffb24a").multiplyScalar(3), toneMapped: false}),
    }),
    [],
  );
  const headRef = useRef<THREE.InstancedMesh>(null);
  const tmp = useMemo(() => ({m: new THREE.Matrix4(), q: new THREE.Quaternion(), e: new THREE.Euler(), v: new THREE.Vector3(), s: new THREE.Vector3(), w: new THREE.Matrix4(), o: new THREE.Matrix4()}), []);
  useFrame(() => {
    const B = bodyRef.current;
    const W = wingRef.current;
    const H = headRef.current;
    const E = eyeRef.current;
    if (!B || !W || !H || !E) return;
    birds.forEach((b, i) => {
      const sc = b.s ?? 1;
      tmp.e.set(b.pitch ?? 0, b.yaw, 0, "YXZ");
      tmp.q.setFromEuler(tmp.e);
      tmp.v.set(...b.p);
      tmp.s.set(sc, sc, sc);
      tmp.m.compose(tmp.v, tmp.q, tmp.s);
      B.setMatrixAt(i, tmp.m);
      H.setMatrixAt(i, tmp.m);
      for (let sd = 0; sd < 2; sd++) {
        const side = sd === 0 ? 1 : -1;
        tmp.o.makeRotationZ(side * (0.2 + b.flap));
        if (side < 0) tmp.o.premultiply(new THREE.Matrix4().makeScale(-1, 1, 1));
        tmp.w.makeTranslation(0.08 * side, 0.03, 0).multiply(tmp.o);
        W.setMatrixAt(i * 2 + sd, tmp.m.clone().multiply(tmp.w));
        const em = new THREE.Matrix4().makeTranslation(0.04 * side, 0.115, 0.215);
        E.setMatrixAt(i * 2 + sd, tmp.m.clone().multiply(em));
      }
    });
    B.count = birds.length;
    H.count = birds.length;
    W.count = birds.length * 2;
    E.count = glow > 0.01 ? birds.length * 2 : 0;
    B.instanceMatrix.needsUpdate = true;
    H.instanceMatrix.needsUpdate = true;
    W.instanceMatrix.needsUpdate = true;
    E.instanceMatrix.needsUpdate = true;
  }, -1);
  return (
    <>
      <instancedMesh ref={bodyRef} args={[geos.body, mats.body, n]} castShadow frustumCulled={false} />
      <instancedMesh ref={headRef} args={[geos.head, mats.body, n]} frustumCulled={false} />
      <instancedMesh ref={wingRef} args={[geos.wingG, mats.wing, n * 2]} castShadow frustumCulled={false} />
      <instancedMesh ref={eyeRef} args={[geos.eye, mats.eye, n * 2]} frustumCulled={false} />
    </>
  );
};

/* ---------- antena parabólica no telhado ---------- */
const DR = 0.6; // raio da esfera do prato
const DT = 0.65; // abertura do prato
const DTILT = -0.45; // prato virado pra frente e pra cima
/** ponto da borda de cima do prato (onde o pombo senta), em coordenadas locais da antena (sem escala) */
export const DISH_RIM: V3 = [0, 1.05 + DR * Math.sin(DT) * Math.cos(DTILT), DR * Math.sin(DT) * Math.sin(DTILT)];
export const Dish: React.FC<{p: V3; rotY?: number; s?: number; children?: React.ReactNode}> = ({p, rotY = 0, s = 1, children}) => {
  const metal = lp("#cfd4da", 0.35, 0.6);
  const dark = lp("#4a5260", 0.5, 0.4);
  const dishGeo = useMemo(() => new THREE.SphereGeometry(DR, 16, 5, 0, Math.PI * 2, 0, DT), []);
  const dishMat = useMemo(() => new THREE.MeshStandardMaterial({color: "#f2f4f6", roughness: 0.45, metalness: 0.15, flatShading: true, side: THREE.DoubleSide}), []);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.5, -0.12]} material={dark} castShadow>
        <cylinderGeometry args={[0.035, 0.045, 1.0, 6]} />
      </mesh>
      <group position={[0, 1.05, 0]} rotation={[DTILT, 0, 0]}>
        {/* prato côncavo (abre pra frente) */}
        <group position={[0, 0, DR * Math.cos(DT)]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh geometry={dishGeo} material={dishMat} castShadow receiveShadow />
        </group>
        <mesh position={[0, 0, -0.12]} rotation={[Math.PI / 2, 0, 0]} material={dark}>
          <cylinderGeometry args={[0.06, 0.06, 0.12, 6]} />
        </mesh>
        {/* braço e captador (LNB) */}
        <mesh position={[0, -DR * Math.sin(DT) * 0.5, 0.2]} rotation={[-0.75, 0, 0]} material={metal}>
          <cylinderGeometry args={[0.012, 0.012, 0.5, 4]} />
        </mesh>
        <mesh position={[0, 0, 0.38]} material={dark}>
          <boxGeometry args={[0.07, 0.07, 0.1]} />
        </mesh>
      </group>
      <group position={DISH_RIM}>{children}</group>
    </group>
  );
};

/* ---------- poste de madeira com cruzeta ---------- */
export const POLE_H = 4.6;
export const poleTop = (base: V3, bend: number, arm = 0): V3 => {
  // bend: giro em volta de x (tomba pra rua, +z) a partir da base; arm: posição na cruzeta (ao longo de z)
  const y = POLE_H - 0.15;
  return [base[0], base[1] + y * Math.cos(bend) - arm * Math.sin(bend), base[2] + y * Math.sin(bend) + arm * Math.cos(bend)];
};
export const UtilityPole: React.FC<{p: V3; bend?: number}> = ({p, bend = 0}) => {
  const wood = lp("#7a5a3a", 0.9);
  const ins = lp("#d9e6ef", 0.3, 0.2);
  return (
    <group position={p} rotation={[bend, 0, 0]}>
      <mesh position={[0, POLE_H / 2, 0]} material={wood} castShadow>
        <cylinderGeometry args={[0.07, 0.1, POLE_H, 6]} />
      </mesh>
      <mesh position={[0, POLE_H - 0.25, 0]} material={wood} castShadow>
        <boxGeometry args={[0.1, 0.1, 1.5]} />
      </mesh>
      {[-0.6, 0, 0.6].map((z) => (
        <mesh key={z} position={[0, POLE_H - 0.15, z]} material={ins}>
          <cylinderGeometry args={[0.035, 0.045, 0.12, 6]} />
        </mesh>
      ))}
    </group>
  );
};

/** fio entre dois pontos com barriga (sag); se `cut`, vira duas pontas penduradas */
export const Wire: React.FC<{a: V3; b: V3; sag: number; cut?: number; swing?: number; r?: number}> = ({a, b, sag, cut = 0, swing = 0, r = 0.018}) => {
  const mat = lp("#1b1d22", 0.6);
  const geos = useMemo(() => [] as THREE.TubeGeometry[], []);
  geos.forEach((g) => g.dispose());
  geos.length = 0;
  const mk = (pts: THREE.Vector3[]) => {
    const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 24, r, 4, false);
    geos.push(g);
    return g;
  };
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  if (cut <= 0) {
    const pts = Array.from({length: 13}, (_, i) => {
      const k = i / 12;
      const v = A.clone().lerp(B, k);
      v.y -= sag * 4 * k * (1 - k);
      return v;
    });
    return <mesh geometry={mk(pts)} material={mat} />;
  }
  // duas metades caindo e balançando
  const half = (P: THREE.Vector3, Q: THREE.Vector3, dir: number) => {
    const L = P.distanceTo(Q) / 2;
    return Array.from({length: 9}, (_, i) => {
      const k = i / 8;
      const ang = lerp(0, Math.PI / 2 - 0.15, cut) + swing * Math.sin(k * 2);
      const horiz = Math.cos(ang) * L * k;
      const down = Math.sin(ang) * L * k + sag * k * k;
      const v = P.clone().add(Q.clone().sub(P).normalize().multiplyScalar(horiz));
      v.y -= down;
      v.z += dir * 0.0;
      return v;
    });
  };
  return (
    <>
      <mesh geometry={mk(half(A, B, 1))} material={mat} />
      <mesh geometry={mk(half(B, A, -1))} material={mat} />
    </>
  );
};

/** faíscas (pontinhos que voam e caem) */
export const Sparks: React.FC<{p: V3; k: number; n?: number}> = ({p, k, n = 18}) => {
  const m = useMemo(() => new THREE.MeshBasicMaterial({color: new THREE.Color("#ffd27a").multiplyScalar(4), toneMapped: false}), []);
  if (k <= 0 || k >= 1) return null;
  return (
    <group position={p}>
      {Array.from({length: n}, (_, i) => {
        const a = i * 2.39;
        const v = 1.2 + (i % 5) * 0.35;
        const x = Math.cos(a) * v * k;
        const z = Math.sin(a) * v * k * 0.6;
        const y = (1.4 + (i % 3) * 0.4) * k - 3.5 * k * k;
        return (
          <mesh key={i} position={[x, y, z]} scale={0.035 * (1 - k)} material={m}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
        );
      })}
      <pointLight color="#ffd27a" intensity={12 * (1 - k)} distance={5} />
    </group>
  );
};

/* ---------- carrinho de milho ---------- */
const milhoTex = () =>
  canvasTex("milho-placa", 256, 96, (c) => {
    c.fillStyle = "#e8412c";
    c.fillRect(0, 0, 256, 96);
    c.fillStyle = "#ffd23a";
    c.font = "bold 62px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("MILHO", 128, 52);
  });
export const CornCart: React.FC<{p: V3; rotY?: number; t?: number}> = ({p, rotY = 0, t = 0}) => {
  const cart = lp("#2f9e5a", 0.6);
  const metal = lp("#c8ccd2", 0.3, 0.7);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.45 * sd, 0.22, 0.42]} rotation={[0, 0, Math.PI / 2]} material={lp("#24272d", 0.8)} castShadow>
          <cylinderGeometry args={[0.22, 0.22, 0.08, 10]} />
        </mesh>
      ))}
      <mesh position={[0, 0.62, 0]} material={cart} castShadow receiveShadow>
        <boxGeometry args={[1.1, 0.6, 0.9]} />
      </mesh>
      <mesh position={[0, 0.66, 0.456]} material={texMat("milho-placa", milhoTex(), 0.6)}>
        <boxGeometry args={[0.9, 0.34, 0.01]} />
      </mesh>
      {/* panela de milho cozido */}
      <mesh position={[-0.2, 1.08, 0]} material={metal} castShadow>
        <cylinderGeometry args={[0.24, 0.22, 0.32, 10]} />
      </mesh>
      {Array.from({length: 5}, (_, i) => (
        <mesh key={i} position={[-0.2 + Math.cos(i * 1.3) * 0.12, 1.28 + (i % 2) * 0.03, Math.sin(i * 1.3) * 0.12]} rotation={[0.3 * Math.sin(i), 0, 0.4 * Math.cos(i)]} material={lp("#ffd23a", 0.6)}>
          <capsuleGeometry args={[0.04, 0.14, 2, 6]} />
        </mesh>
      ))}
      {/* vapor */}
      {[0, 1, 2].map((i) => {
        const k = ((t * 0.6 + i / 3) % 1);
        return (
          <mesh key={"v" + i} position={[-0.2 + Math.sin(k * 6 + i) * 0.05, 1.35 + k * 0.6, 0]} scale={0.08 + 0.1 * k} material={lp("#ffffff", 1, 0, "#ffffff", 0.3)}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
        );
      })}
      {/* sacos de milho */}
      <CornSack p={[0.3, 0.92, 0.1]} s={0.7} />
      <CornSack p={[0.32, 0.92, -0.22]} s={0.65} />
      <Umbrella p={[0.0, 0.9, -0.1]} a="#ffd23a" b="#e8412c" tilt={0.05} s={0.75} />
    </group>
  );
};

const sackTex = () =>
  canvasTex("saco-milho", 128, 128, (c, r) => {
    c.fillStyle = "#c9a46a";
    c.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 400; i++) {
      c.fillStyle = `rgba(90,60,20,${0.08 + r() * 0.1})`;
      c.fillRect(r() * 128, r() * 128, 2, 2);
    }
    c.fillStyle = "#7a4a1a";
    c.font = "bold 30px sans-serif";
    c.textAlign = "center";
    c.fillText("MILHO", 64, 76);
  });
export const CornSack: React.FC<{p?: V3; s?: number; r?: V3}> = ({p = [0, 0, 0], s = 1, r = [0, 0, 0]}) => (
  <group position={p} scale={s} rotation={r}>
    <mesh position={[0, 0.27, 0]} scale={[0.24, 0.29, 0.18]} material={texMat("saco-milho", sackTex(), 0.95)} castShadow>
      <icosahedronGeometry args={[1, 1]} />
    </mesh>
    <mesh position={[0, 0.58, 0]} scale={[0.09, 0.07, 0.07]} material={lp("#b48c52", 0.95)}>
      <icosahedronGeometry args={[1, 0]} />
    </mesh>
    <mesh position={[0, 0.53, 0]} material={lp("#7a4a1a", 0.9)}>
      <torusGeometry args={[0.07, 0.015, 4, 8]} />
    </mesh>
  </group>
);

/** grãos de milho espalhados (pilha) */
export const Kernels: React.FC<{p: V3; n?: number; r?: number; eaten?: number}> = ({p, n = 40, r = 0.35, eaten = 0}) => {
  const m = lp("#ffd23a", 0.5);
  const left = Math.round(n * (1 - eaten));
  return (
    <group position={p}>
      {Array.from({length: left}, (_, i) => {
        const a = i * 2.39996;
        const d = r * Math.sqrt((i + 0.5) / n);
        return (
          <mesh key={i} position={[Math.cos(a) * d, 0.015 + 0.03 * Math.max(0, 1 - d / r) * ((i % 3) / 2), Math.sin(a) * d]} scale={0.025} material={m}>
            <icosahedronGeometry args={[1, 0]} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- videogame, roteador, celular ---------- */
export const Console: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh material={lp("#1d1f26", 0.4, 0.2)} castShadow>
      <boxGeometry args={[0.34, 0.08, 0.26]} />
    </mesh>
    <mesh position={[0, 0.0, 0.131]} material={lp("#58b8ff", 0.3, 0, "#58b8ff", 1.5)}>
      <boxGeometry args={[0.2, 0.012, 0.004]} />
    </mesh>
    {/* controle por cima */}
    <group position={[0.02, 0.07, 0.02]} rotation={[0, 0.3, 0]}>
      <mesh scale={[0.12, 0.03, 0.07]} material={lp("#3a3f4a", 0.5)}>
        <icosahedronGeometry args={[1, 1]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.07 * sd, -0.005, -0.03]} scale={[0.045, 0.03, 0.05]} material={lp("#3a3f4a", 0.5)}>
          <icosahedronGeometry args={[1, 0]} />
        </mesh>
      ))}
    </group>
  </group>
);

export const Router: React.FC<{p: V3; on?: number; t?: number; rotY?: number; s?: number}> = ({p, on = 0, t = 0, rotY = 0, s = 1}) => {
  const ledOn = lp("#4cff7a", 0.3, 0, "#4cff7a", 2.2);
  const ledOff = lp("#2a3a2e", 0.5);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.04, 0]} material={lp("#f2f2f2", 0.5)} castShadow>
        <boxGeometry args={[0.32, 0.07, 0.22]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[0.13 * sd, 0.2, -0.09]} rotation={[0, 0, -0.15 * sd]} material={lp("#2a2d33", 0.6)}>
          <cylinderGeometry args={[0.012, 0.016, 0.28, 5]} />
        </mesh>
      ))}
      {[0, 1, 2, 3].map((i) => {
        const lit = on > 0.5 && (i === 0 || Math.sin(t * (9 + i * 3) + i) > -0.3);
        return (
          <mesh key={i} position={[-0.09 + i * 0.06, 0.05, 0.111]} material={lit ? ledOn : ledOff}>
            <boxGeometry args={[0.022, 0.012, 0.004]} />
          </mesh>
        );
      })}
      {on > 0.5 && <pointLight position={[0, 0.1, 0.25]} color="#8cffaa" intensity={0.5} distance={0.9} />}
    </group>
  );
};

export const Phone: React.FC<{p?: V3; r?: V3; s?: number; glow?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, glow = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh material={lp("#1b1d22", 0.4)}>
      <boxGeometry args={[0.08, 0.15, 0.012]} />
    </mesh>
    <mesh position={[0, 0, 0.007]} material={lp("#9fd7ff", 0.3, 0, "#9fd7ff", 1.2 * glow)}>
      <boxGeometry args={[0.068, 0.13, 0.002]} />
    </mesh>
  </group>
);

/** cavalete que segura a roda de trás da bicicleta (pedalar parado) */
export const BikeStand: React.FC<{p: V3}> = ({p}) => {
  const m = lp("#5a6270", 0.4, 0.5);
  return (
    <group position={p}>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0, 0, 0.12 * sd]}>
          <mesh position={[-0.12, 0.17, 0]} rotation={[0, 0, -0.5]} material={m}>
            <cylinderGeometry args={[0.015, 0.015, 0.4, 5]} />
          </mesh>
          <mesh position={[0.12, 0.17, 0]} rotation={[0, 0, 0.5]} material={m}>
            <cylinderGeometry args={[0.015, 0.015, 0.4, 5]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/** fio solto entre dois pontos (ex.: da bicicleta ao roteador) */
export const Cable: React.FC<{a: V3; b: V3; sag?: number}> = ({a, b, sag = 0.25}) => {
  const geo = useMemo(() => {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const pts = Array.from({length: 9}, (_, i) => {
      const k = i / 8;
      const v = A.clone().lerp(B, k);
      v.y -= sag * 4 * k * (1 - k);
      return v;
    });
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.012, 4, false);
  }, [a[0], a[1], a[2], b[0], b[1], b[2], sag]);
  return <mesh geometry={geo} material={lp("#1b1d22", 0.6)} />;
};

/** "cheiro" de milho: fitinhas amarelas onduladas subindo */
export const Smell: React.FC<{p: V3; k: number; t: number}> = ({p, k, t}) => {
  if (k <= 0) return null;
  const m = lp("#ffe066", 0.6, 0, "#ffd23a", 0.8);
  return (
    <group position={p}>
      {[0, 1, 2].map((i) => {
        const ph = ((t * 0.7 + i / 3) % 1);
        return (
          <group key={i} position={[(i - 1) * 0.15 + Math.sin(t * 3 + i) * 0.05, ph * 0.8, 0.1]} scale={clamp(k) * (1 - ph)}>
            {[0, 1, 2, 3].map((j) => (
              <mesh key={j} position={[Math.sin(j * 1.6 + t * 4) * 0.04, j * 0.06, 0]} material={m}>
                <boxGeometry args={[0.03, 0.05, 0.01]} />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  );
};
