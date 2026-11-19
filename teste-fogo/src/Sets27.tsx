import React from "react";
import * as THREE from "three";
import type {V3} from "./Sets5";
import {sm, rbox} from "./Sets9";
import {canvasTex} from "./util";

/* ===== Objetos do vídeo "Perdeu o ônibus escolar" ===== */

const texCache = new Map<string, THREE.MeshStandardMaterial>();
const tm = (key: string, t: THREE.Texture, rough = 0.6, extra: Partial<THREE.MeshStandardMaterialParameters> = {}) => {
  let m = texCache.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({map: t, roughness: rough, ...extra});
    texCache.set(key, m);
  }
  return m;
};
const label = (key: string, text: string, bg: string, fg: string, size = 48, w = 512, h = 96) =>
  canvasTex(key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.fillStyle = fg;
    c.font = `bold ${size}px sans-serif`;
    c.textAlign = "center";
    c.fillText(text, w / 2, h / 2 + size * 0.35);
  });
const BLACK = "#15151c";

/* ---------- ônibus escolar amarelo ---------- */
export const SchoolBus: React.FC<{p: V3; rotY?: number; s?: number; spin?: number; float?: boolean; t?: number}> = ({p, rotY = 0, s = 1, spin = 0, float = false, t = 0}) => {
  const yellow = sm("#ffc21a", 0.45);
  const black = sm(BLACK, 0.5);
  const glass = sm("#9fd8ff", 0.15, {metalness: 0.2, emissive: "#3a6a90", emissiveIntensity: 0.15});
  const L = 5.6;
  const bob = float ? 0.08 * Math.sin(t * 2.2) : 0;
  return (
    <group position={[p[0], p[1] + bob, p[2]]} rotation={[0, rotY, float ? 0.04 * Math.sin(t * 1.7) : 0]} scale={s}>
      {/* rodas */}
      {[-1.8, 1.7].map((x) =>
        [-1, 1].map((sd) => (
          <group key={x + "" + sd} position={[x, 0.42, 1.0 * sd]} rotation={[Math.PI / 2, 0, 0]}>
            <group rotation={[0, spin, 0]}>
              <mesh material={black} castShadow>
                <cylinderGeometry args={[0.42, 0.42, 0.3, 14]} />
              </mesh>
              <mesh position={[0, 0.16 * sd, 0]} material={sm("#c0c6ce", 0.3, {metalness: 0.6})}>
                <cylinderGeometry args={[0.2, 0.2, 0.02, 10]} />
              </mesh>
            </group>
          </group>
        )),
      )}
      {/* corpo */}
      <mesh position={[0, 1.45, 0]} geometry={rbox(L, 2.0, 2.2, 0.18)} material={yellow} castShadow receiveShadow />
      {/* capô */}
      <mesh position={[L / 2 + 0.45, 0.95, 0]} geometry={rbox(1.0, 1.0, 2.1, 0.15)} material={yellow} castShadow />
      <mesh position={[L / 2 + 0.96, 0.85, 0]} material={sm("#c9ccd3", 0.3, {metalness: 0.6})}>
        <boxGeometry args={[0.06, 0.4, 1.4]} />
      </mesh>
      {[-0.7, 0.7].map((z) => (
        <mesh key={z} position={[L / 2 + 0.97, 1.15, z]} rotation={[0, Math.PI / 2, 0]} material={sm("#fff6c0", 0.2, {emissive: "#fff2a0", emissiveIntensity: 0.6})}>
          <circleGeometry args={[0.13, 14]} />
        </mesh>
      ))}
      {/* faixas pretas */}
      {[0.85, 1.25].map((y) =>
        [-1, 1].map((sd) => (
          <mesh key={y + "" + sd} position={[0, y, 1.105 * sd]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]} material={black}>
            <planeGeometry args={[L - 0.2, 0.06]} />
          </mesh>
        )),
      )}
      {/* janelas */}
      {Array.from({length: 6}, (_, i) =>
        [-1, 1].map((sd) => (
          <mesh key={i + "" + sd} position={[-L / 2 + 0.55 + i * 0.85, 1.95, 1.106 * sd]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]} material={glass}>
            <planeGeometry args={[0.66, 0.6]} />
          </mesh>
        )),
      )}
      <mesh position={[L / 2 + 0.001, 1.95, 0]} rotation={[0, Math.PI / 2, 0]} material={glass}>
        <planeGeometry args={[1.9, 0.75]} />
      </mesh>
      {/* placa ESCOLAR */}
      {[-1, 1].map((sd) => (
        <mesh key={"e" + sd} position={[-0.3, 2.62, 1.106 * sd]} rotation={[0, sd > 0 ? 0 : Math.PI, 0]} material={tm("bus-escolar", label("bus-escolar", "ESCOLAR", BLACK, "#ffc21a", 64, 512, 96), 0.5)}>
          <planeGeometry args={[2.2, 0.36]} />
        </mesh>
      ))}
      <mesh position={[L / 2 + 0.002, 2.62, 0]} rotation={[0, Math.PI / 2, 0]} material={tm("bus-escolar", label("bus-escolar", "ESCOLAR", BLACK, "#ffc21a", 64, 512, 96), 0.5)}>
        <planeGeometry args={[1.6, 0.3]} />
      </mesh>
      {/* placa de pare */}
      <mesh position={[L / 2 - 0.9, 1.6, 1.16]} rotation={[Math.PI / 2, 0, 0]} material={sm("#e8262d", 0.4)}>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 8]} />
      </mesh>
    </group>
  );
};

/* ---------- canguru (bicho normal, com a plaquinha de 5 estrelas) ---------- */
export const Kangaroo: React.FC<{p: V3; rotY?: number; s?: number; t?: number; blink?: number; tired?: number; squash?: number; plaque?: boolean; pouch?: React.ReactNode; legs?: number}> = ({p, rotY = 0, s = 1, t = 0, blink = 0, tired = 0, squash = 0, plaque = true, pouch, legs = 0}) => {
  const fur = sm("#c98a4b", 0.75);
  const belly = sm("#ecc597", 0.8);
  const dark = sm("#6b4426", 0.7);
  const eyeW = sm("#ffffff", 0.3);
  const pupil = sm(BLACK, 0.2);
  const ear = 0.12 * Math.sin(t * 3);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={[s * (1 + squash * 0.25), s * (1 - squash * 0.3), s * (1 + squash * 0.25)]}>
      {/* rabo */}
      <mesh position={[0, 0.42, -0.9]} rotation={[1.15, 0, 0]} material={fur} castShadow>
        <cylinderGeometry args={[0.05, 0.2, 1.3, 12]} />
      </mesh>
      {/* pernas de trás e pés compridos */}
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.27 * sd, 0, 0]}>
          <mesh position={[0, 0.62, -0.05]} rotation={[-0.4 - legs * 0.6, 0, 0]} scale={[0.22, 0.42, 0.3]} material={fur} castShadow>
            <sphereGeometry args={[1, 18, 14]} />
          </mesh>
          <mesh position={[0, 0.1 + legs * 0.15, 0.28 - legs * 0.2]} rotation={[legs * -0.9, 0, 0]} geometry={rbox(0.16, 0.12, 0.7, 0.05)} material={dark} castShadow />
        </group>
      ))}
      {/* corpo */}
      <mesh position={[0, 1.22, 0]} rotation={[0.18, 0, 0]} scale={[0.37, 0.7, 0.34]} material={fur} castShadow>
        <sphereGeometry args={[1, 22, 18]} />
      </mesh>
      <mesh position={[0, 1.18, 0.14]} rotation={[0.18, 0, 0]} scale={[0.27, 0.55, 0.22]} material={belly}>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      {/* bolsa: barriguinha clara com a abertura escura em cima */}
      <mesh position={[0, 0.92, 0.3]} scale={[0.27, 0.22, 0.17]} material={belly} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      <mesh position={[0, 1.1, 0.33]} rotation={[-1.1, 0, 0]} scale={[0.22, 0.09, 1]} material={dark}>
        <circleGeometry args={[1, 20]} />
      </mesh>
      {pouch && <group position={[0, 0.95, 0.32]}>{pouch}</group>}
      {/* bracinhos */}
      {[-1, 1].map((sd) => (
        <mesh key={"a" + sd} position={[0.3 * sd, 1.45, 0.33]} rotation={[1.1, 0, 0.2 * sd]} material={fur} castShadow>
          <capsuleGeometry args={[0.06, 0.3, 4, 8]} />
        </mesh>
      ))}
      {/* cabeça */}
      <group position={[0, 1.98, 0.14]} rotation={[tired * 0.35, 0, 0]}>
        <mesh scale={[0.27, 0.27, 0.28]} material={fur} castShadow>
          <sphereGeometry args={[1, 20, 16]} />
        </mesh>
        <mesh position={[0, -0.06, 0.24]} scale={[0.15, 0.13, 0.22]} material={fur} castShadow>
          <sphereGeometry args={[1, 16, 12]} />
        </mesh>
        <mesh position={[0, -0.02, 0.45]} scale={[0.07, 0.05, 0.04]} material={pupil}>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={"e" + sd} position={[0.12 * sd, 0.08, 0.2]}>
            <mesh scale={[0.075, 0.09 * (1 - Math.max(blink, tired * 0.5)) + 0.01, 0.05]} material={eyeW}>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
            <mesh position={[0, -0.01, 0.04]} scale={[0.045, 0.055 * (1 - Math.max(blink, tired * 0.5)) + 0.005, 0.02]} material={pupil}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          </group>
        ))}
        {/* orelhas */}
        {[-1, 1].map((sd) => (
          <group key={"o" + sd} position={[0.13 * sd, 0.22, -0.04]} rotation={[-0.15, 0, -0.25 * sd + ear * sd]}>
            <mesh position={[0, 0.2, 0]} scale={[0.08, 0.22, 0.04]} material={fur} castShadow>
              <sphereGeometry args={[1, 12, 10]} />
            </mesh>
            <mesh position={[0, 0.2, 0.02]} scale={[0.05, 0.16, 0.02]} material={belly}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* plaquinha de 5 estrelas */}
      {plaque && (
        <group position={[0, 1.66, 0.38]} rotation={[-0.2, 0, 0]}>
          <mesh position={[0, 0.02, 0]} geometry={rbox(0.42, 0.14, 0.03, 0.02)} material={sm("#ffffff", 0.4)} />
          <mesh position={[0, 0.02, 0.017]} material={tm("estrelas", label("estrelas", "★★★★★", "#ffffff", "#f5b301", 80, 512, 140), 0.5)}>
            <planeGeometry args={[0.4, 0.12]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- escola com telhado reto (dá pra pousar) ---------- */
export const SchoolHouse: React.FC<{p: V3; rotY?: number}> = ({p, rotY = 0}) => {
  const wall = sm("#f6e3b4", 0.8);
  const trim = sm("#e7a845", 0.7);
  const glass = sm("#8fd0f2", 0.2, {metalness: 0.1});
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <mesh position={[0, 2.0, 0]} geometry={rbox(8, 4, 4, 0.1)} material={wall} castShadow receiveShadow />
      <mesh position={[0, 4.1, 0]} geometry={rbox(8.4, 0.25, 4.4, 0.05)} material={sm("#d9534f", 0.6)} castShadow receiveShadow />
      {[-1, 1].map((r) =>
        [-3, -1.8, 1.8, 3].map((x) => (
          <mesh key={r + "" + x} position={[x, r > 0 ? 3.0 : 1.4, 2.01]} material={glass}>
            <planeGeometry args={[0.8, 0.8]} />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.0, 2.01]} material={sm("#8a5a33", 0.6)}>
        <planeGeometry args={[1.4, 2.0]} />
      </mesh>
      <mesh position={[0, 2.6, 2.02]} material={tm("placa-escola", label("placa-escola", "ESCOLA", "#2e6fd8", "#ffffff", 70, 512, 120), 0.5)}>
        <planeGeometry args={[2.4, 0.56]} />
      </mesh>
      <mesh position={[0, 3.4, 2.02]} material={tm("placa-diretoria", label("placa-diretoria", "DIRETORIA ↑", "#ffffff", "#101018", 56, 512, 100), 0.5)}>
        <planeGeometry args={[1.6, 0.32]} />
      </mesh>
      {[-4.05, 4.05].map((x) => (
        <mesh key={x} position={[x, 2.0, 0]} material={trim}>
          <boxGeometry args={[0.12, 4, 4.05]} />
        </mesh>
      ))}
      {/* mastro com bandeira */}
      <mesh position={[3.4, 5.0, 1.4]} material={sm("#c9ccd3", 0.3, {metalness: 0.6})}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
      </mesh>
      <mesh position={[3.75, 5.6, 1.4]} material={sm("#2ecc71", 0.6, {side: THREE.DoubleSide})}>
        <planeGeometry args={[0.7, 0.45]} />
      </mesh>
    </group>
  );
};

/* ---------- gorro de Papai Noel (espaço da cabeça) ---------- */
export const SantaHat: React.FC<{k?: number}> = ({k = 1}) => (
  <group position={[0, 0.3, -0.02]} scale={k}>
    <mesh position={[0, 0.0, 0]} material={sm("#ffffff", 0.9)}>
      <torusGeometry args={[0.3, 0.08, 10, 26]} />
    </mesh>
    <mesh position={[0, 0.0, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#d8262d", 0.7)}>
      <circleGeometry args={[0.3, 24]} />
    </mesh>
    <mesh position={[0.08, 0.28, -0.04]} rotation={[0.2, 0, -0.35]} material={sm("#d8262d", 0.7)} castShadow>
      <coneGeometry args={[0.3, 0.6, 22]} />
    </mesh>
    <mesh position={[0.24, 0.5, -0.1]} material={sm("#ffffff", 0.9)}>
      <sphereGeometry args={[0.08, 12, 10]} />
    </mesh>
  </group>
);

/* ---------- presente com laço (lid sobe) ---------- */
export const GiftBox: React.FC<{p?: V3; r?: V3; s?: number; open?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1, open = 0}) => {
  const red = sm("#2e86de", 0.5);
  const ribbon = sm("#ffd21f", 0.4);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.15, 0]} geometry={rbox(0.36, 0.3, 0.36, 0.02)} material={red} castShadow />
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.37, 0.31, 0.07]} />
        <meshStandardMaterial color="#ffd21f" roughness={0.4} />
      </mesh>
      <group position={[open * 0.45, 0.31 + open * 0.1, 0]} rotation={[0, 0, -open * 1.3]}>
        <mesh geometry={rbox(0.4, 0.07, 0.4, 0.02)} material={red} castShadow />
        <mesh position={[0, 0.0, 0]} material={ribbon}>
          <boxGeometry args={[0.41, 0.075, 0.07]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.07 * sd, 0.07, 0]} rotation={[0, 0, 0.6 * sd]} scale={[1, 0.6, 0.4]} material={ribbon}>
            <torusGeometry args={[0.06, 0.02, 8, 14]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/* ---------- prova surpresa com nota zero ---------- */
const provaTex = () =>
  canvasTex("prova-surpresa", 256, 340, (c) => {
    c.fillStyle = "#ffffff";
    c.fillRect(0, 0, 256, 340);
    c.fillStyle = "#101018";
    c.font = "bold 30px sans-serif";
    c.textAlign = "center";
    c.fillText("PROVA SURPRESA", 128, 44);
    c.font = "bold 24px sans-serif";
    c.textAlign = "left";
    ["1) 7 × 8 = ?", "2) √144 = ?", "3) x² + 2x = ?", "4) ∫ dx = ?"].forEach((l, i) => c.fillText(l, 22, 100 + i * 46));
    c.strokeStyle = "#e8262d";
    c.lineWidth = 9;
    c.beginPath();
    c.ellipse(190, 270, 44, 52, 0, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#e8262d";
    c.font = "bold 80px sans-serif";
    c.textAlign = "center";
    c.fillText("0", 190, 298);
  });
export const SurpriseTest: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <mesh position={p} rotation={r} scale={s} material={tm("prova-surpresa", provaTex(), 0.8, {side: THREE.DoubleSide})}>
    <planeGeometry args={[0.24, 0.32]} />
  </mesh>
);

/* ---------- coala ---------- */
export const Koala: React.FC<{p: V3; rotY?: number; s?: number; sleep?: number; glasses?: boolean; t?: number; clap?: number; head?: number}> = ({p, rotY = 0, s = 1, sleep = 0, glasses = false, t = 0, clap = 0, head = 0}) => {
  const fur = sm("#9aa1ab", 0.85);
  const light = sm("#e6e8ec", 0.9);
  const nose = sm("#2a2a30", 0.3);
  const breathe = 1 + 0.03 * Math.sin(t * (sleep > 0.5 ? 1.5 : 3));
  const cl = clap > 0 ? 0.12 * Math.abs(Math.sin(t * 3)) : 0.15;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {/* corpo sentado */}
      <mesh position={[0, 0.42, 0]} scale={[0.36 * breathe, 0.42, 0.32 * breathe]} material={fur} castShadow>
        <sphereGeometry args={[1, 20, 16]} />
      </mesh>
      <mesh position={[0, 0.38, 0.12]} scale={[0.25, 0.3, 0.22]} material={light}>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      {/* pernas */}
      {[-1, 1].map((sd) => (
        <mesh key={"p" + sd} position={[0.17 * sd, 0.1, 0.18]} scale={[0.12, 0.1, 0.17]} material={fur} castShadow>
          <sphereGeometry args={[1, 12, 10]} />
        </mesh>
      ))}
      {/* braços */}
      {[-1, 1].map((sd) => (
        <mesh key={"b" + sd} position={[cl * sd + 0.12 * sd, 0.55, 0.26]} rotation={[1.0, 0, 0.3 * sd]} material={fur} castShadow>
          <capsuleGeometry args={[0.07, 0.22, 4, 8]} />
        </mesh>
      ))}
      {/* cabeça */}
      <group position={[0, 0.98, 0.04]} rotation={[0.25 * sleep + head, 0, 0.12 * sleep * Math.sin(t * 0.8)]}>
        <mesh scale={[0.34, 0.3, 0.3]} material={fur} castShadow>
          <sphereGeometry args={[1, 22, 16]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={"o" + sd} position={[0.32 * sd, 0.16, -0.02]}>
            <mesh scale={[0.17, 0.17, 0.08]} material={fur} castShadow>
              <sphereGeometry args={[1, 14, 10]} />
            </mesh>
            <mesh position={[0, 0, 0.05]} scale={[0.11, 0.11, 0.04]} material={light}>
              <sphereGeometry args={[1, 12, 8]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.04, 0.27]} scale={[0.1, 0.13, 0.08]} material={nose}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        {[-1, 1].map((sd) =>
          sleep > 0.5 ? (
            <mesh key={"e" + sd} position={[0.13 * sd, 0.06, 0.27]} rotation={[0, 0, 0]} material={nose}>
              <boxGeometry args={[0.07, 0.012, 0.01]} />
            </mesh>
          ) : (
            <mesh key={"e" + sd} position={[0.13 * sd, 0.06, 0.26]} scale={[0.035, 0.04, 0.02]} material={nose}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
          ),
        )}
        {glasses && (
          <group position={[0, 0.06, 0.29]}>
            {[-1, 1].map((sd) => (
              <mesh key={sd} position={[0.13 * sd, 0, 0]} material={sm(BLACK, 0.3)}>
                <torusGeometry args={[0.07, 0.012, 8, 20]} />
              </mesh>
            ))}
            <mesh material={sm(BLACK, 0.3)}>
              <boxGeometry args={[0.08, 0.012, 0.012]} />
            </mesh>
          </group>
        )}
      </group>
    </group>
  );
};

/* ---------- sala de aula dos coalas (no meio dos eucaliptos) ---------- */
export const KoalaClass: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#b88a5a", 0.8)} receiveShadow>
      <planeGeometry args={[14, 12]} />
    </mesh>
    <mesh position={[0, 2.5, -2.6]} material={sm("#cfe8c0", 0.9)} receiveShadow>
      <boxGeometry args={[12, 5, 0.2]} />
    </mesh>
    <mesh position={[0, 1.9, -2.48]} geometry={rbox(3.2, 1.5, 0.06, 0.03)} material={sm("#7a5230", 0.6)} />
    <mesh position={[0, 1.9, -2.44]} material={tm("lousa-dormir", canvasTex("lousa-dormir", 640, 300, (c) => {
      c.fillStyle = "#24533a";
      c.fillRect(0, 0, 640, 300);
      c.fillStyle = "#ffffff";
      c.font = "bold 110px sans-serif";
      c.textAlign = "center";
      c.fillText("DORMIR", 320, 150);
      c.font = "bold 46px sans-serif";
      c.fillText("aula 1 de 22 horas  💤", 320, 240);
    }), 0.8)}>
      <planeGeometry args={[3.0, 1.35]} />
    </mesh>
    {/* galhos de eucalipto pela parede */}
    {[-4.2, -3.2, 3.2, 4.2].map((x, i) => (
      <group key={x} position={[x, 0, -2.2 + (i % 2) * 0.4]}>
        <mesh position={[0, 2.2, 0]} material={sm("#8a6a4a", 0.8)} castShadow>
          <cylinderGeometry args={[0.12, 0.18, 4.4, 10]} />
        </mesh>
        {Array.from({length: 7}, (_, k) => (
          <mesh key={k} position={[Math.sin(k * 2.1) * 0.45, 2.6 + k * 0.32, Math.cos(k * 1.7) * 0.25]} rotation={[0, k, 0.6 * Math.sin(k)]} scale={[0.35, 0.09, 0.14]} material={sm("#6aa58a", 0.8)} castShadow>
            <sphereGeometry args={[1, 10, 8]} />
          </mesh>
        ))}
      </group>
    ))}
  </group>
);

/* ---------- medalha de ouro (pendurada no pescoço, espaço do corpo) ---------- */
export const Medal: React.FC<{p?: V3; s?: number}> = ({p = [0, 0, 0], s = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.12, 0]} rotation={[0.3, 0, 0]} material={sm("#2e6fd8", 0.6)}>
      <torusGeometry args={[0.15, 0.018, 6, 20, Math.PI]} />
    </mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#f5c518", 0.25, {metalness: 0.7, emissive: "#7a5a00", emissiveIntensity: 0.3})}>
      <cylinderGeometry args={[0.09, 0.09, 0.025, 20]} />
    </mesh>
  </group>
);

/* ---------- boia de patinho (cintura) ---------- */
export const DuckRing: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => {
  const y = sm("#ffd21f", 0.35);
  return (
    <group position={p} scale={s}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={y} castShadow>
        <torusGeometry args={[0.36, 0.12, 12, 28]} />
      </mesh>
      <group position={[0, 0.14, 0.42]}>
        <mesh material={y} castShadow>
          <sphereGeometry args={[0.13, 14, 12]} />
        </mesh>
        <mesh position={[0, 0.0, 0.13]} scale={[1, 0.45, 1]} material={sm("#ff8a1a", 0.4)}>
          <sphereGeometry args={[0.06, 10, 8]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <mesh key={sd} position={[0.06 * sd, 0.05, 0.1]} material={sm(BLACK, 0.2)}>
            <sphereGeometry args={[0.02, 8, 6]} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

/* ---------- diploma (canudo) ---------- */
export const Diploma: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#fbf3dc", 0.8)} castShadow>
      <cylinderGeometry args={[0.04, 0.04, 0.34, 14]} />
    </mesh>
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#d8262d", 0.5)}>
      <cylinderGeometry args={[0.045, 0.045, 0.05, 14]} />
    </mesh>
  </group>
);

/* ---------- maquininha de cartão ---------- */
export const CardMachine: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.12, 0.2, 0.04, 0.015)} material={sm("#2a2e3b", 0.4)} castShadow />
    <mesh position={[0, 0.045, 0.021]} material={tm("maquininha", canvasTex("maquininha", 200, 140, (c) => {
      c.fillStyle = "#c8f0d0";
      c.fillRect(0, 0, 200, 140);
      c.fillStyle = "#101018";
      c.font = "bold 30px sans-serif";
      c.textAlign = "center";
      c.fillText("AU$", 100, 52);
      c.font = "bold 40px sans-serif";
      c.fillText("8.000", 100, 104);
    }), 0.4, {emissive: "#ffffff", emissiveIntensity: 0.25})}>
      <planeGeometry args={[0.1, 0.07]} />
    </mesh>
    {Array.from({length: 9}, (_, i) => (
      <mesh key={i} position={[-0.03 + (i % 3) * 0.03, -0.025 - Math.floor(i / 3) * 0.022, 0.021]} material={sm("#d9dde3", 0.4)}>
        <planeGeometry args={[0.02, 0.014]} />
      </mesh>
    ))}
  </group>
);

/* ---------- caneca gigante de café ---------- */
export const BigCoffee: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.2, 0]} material={sm("#ffffff", 0.4)} castShadow>
      <cylinderGeometry args={[0.16, 0.14, 0.4, 20]} />
    </mesh>
    <mesh position={[0, 0.395, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#4a2a14", 0.3)}>
      <circleGeometry args={[0.15, 20]} />
    </mesh>
    <mesh position={[0.18, 0.22, 0]} rotation={[0, 0, Math.PI / 2]} material={sm("#ffffff", 0.4)}>
      <torusGeometry args={[0.08, 0.025, 8, 16]} />
    </mesh>
    <mesh position={[0, 0.2, 0.161]} material={tm("cafe-3l", label("cafe-3l", "3 LITROS", "#ffffff", "#e8262d", 54, 256, 80), 0.5)}>
      <planeGeometry args={[0.22, 0.07]} />
    </mesh>
  </group>
);

/* ---------- janela de noite (parede do quarto) ---------- */
export const NightWindow: React.FC<{p: V3; w?: number; h?: number}> = ({p, w = 1.4, h = 1.1}) => (
  <group position={p}>
    {(
      [
        [0, h / 2 + 0.05, w + 0.2, 0.1],
        [0, -h / 2 - 0.05, w + 0.2, 0.1],
        [-w / 2 - 0.05, 0, 0.1, h],
        [w / 2 + 0.05, 0, 0.1, h],
        [0, 0, 0.05, h],
      ] as [number, number, number, number][]
    ).map(([x, y, ww, hh], i) => (
      <mesh key={i} position={[x, y, 0.03]} material={sm("#ffffff", 0.5)}>
        <boxGeometry args={[ww, hh, 0.08]} />
      </mesh>
    ))}
  </group>
);

/* ---------- rachadura (decal) ---------- */
const crackTex = () =>
  canvasTex("rachadura", 512, 512, (c) => {
    c.clearRect(0, 0, 512, 512);
    c.strokeStyle = "rgba(30,20,15,0.95)";
    c.lineCap = "round";
    const branch = (x: number, y: number, a: number, len: number, w: number, d: number) => {
      if (d > 4 || len < 12) return;
      let px = x, py = y;
      const steps = 5;
      c.lineWidth = w;
      c.beginPath();
      c.moveTo(px, py);
      for (let i = 0; i < steps; i++) {
        a += (Math.sin(x * 0.37 + y * 0.11 + i * 1.7 + d) * 0.6);
        px += Math.cos(a) * len / steps;
        py += Math.sin(a) * len / steps;
        c.lineTo(px, py);
      }
      c.stroke();
      branch(px, py, a + 0.7, len * 0.6, w * 0.65, d + 1);
      branch(px, py, a - 0.6, len * 0.55, w * 0.65, d + 1);
    };
    for (let k = 0; k < 7; k++) branch(256, 256, (k / 7) * Math.PI * 2, 150, 9, 0);
  });
export const Crack: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [-Math.PI / 2, 0, 0], s = 1}) => (
  <mesh position={p} rotation={r} scale={s} material={tm("rachadura", crackTex(), 0.9, {transparent: true, depthWrite: false})}>
    <planeGeometry args={[1, 1]} />
  </mesh>
);

/* ---------- sala da diretora (com teto que quebra) ---------- */
export const OFFICE_H = 3.6;
export const HOLE: V3 = [0.9, OFFICE_H, 0.4];
export const DirectorOffice: React.FC<{broken?: number; crack?: number; t?: number}> = ({broken = 0, crack = 0, t = 0}) => {
  const wall = sm("#e9dcc3", 0.85);
  const H = OFFICE_H;
  const hw = 1.0; // metade do buraco
  const shake = crack > 0 && broken < 1 ? 0.01 * Math.sin(t * 60) * crack : 0;
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} material={sm("#8a5a3a", 0.7)} receiveShadow>
        <planeGeometry args={[9, 9]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -0.6]} material={sm("#7a2a3a", 0.9)} receiveShadow>
        <planeGeometry args={[4.2, 3.2]} />
      </mesh>
      <mesh position={[0, H / 2, -3.1]} material={wall} receiveShadow>
        <boxGeometry args={[9, H, 0.2]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <mesh key={sd} position={[3.6 * sd, H / 2, 0.5]} material={wall} receiveShadow>
          <boxGeometry args={[0.2, H, 7.4]} />
        </mesh>
      ))}
      {/* teto com o buraco no meio (quatro pedaços) */}
      <group position={[shake, 0, 0]}>
        {(
          [
            [(-4.5 + HOLE[0] - hw) / 2, HOLE[2], HOLE[0] - hw + 4.5, 2 * hw],
            [(HOLE[0] + hw + 4.5) / 2, HOLE[2], 4.5 - HOLE[0] - hw, 2 * hw],
            [0, (-3.2 + HOLE[2] - hw) / 2, 9, HOLE[2] - hw + 3.2],
            [0, (HOLE[2] + hw + 4.2) / 2, 9, 4.2 - HOLE[2] - hw],
          ] as [number, number, number, number][]
        ).map(([x, z, w, d], i) => (
          <mesh key={i} position={[x, H + 0.1, z]} material={sm("#f4f0e6", 0.9)}>
            <boxGeometry args={[w, 0.2, d]} />
          </mesh>
        ))}
        {broken < 0.5 && (
          <mesh position={[HOLE[0], H + 0.1, HOLE[2]]} material={sm("#f4f0e6", 0.9)}>
            <boxGeometry args={[2 * hw, 0.2, 2 * hw]} />
          </mesh>
        )}
        {crack > 0.01 && broken < 0.5 && <Crack p={[HOLE[0], H - 0.005, HOLE[2]]} r={[Math.PI / 2, 0, 0]} s={0.6 + crack * 2.0} />}
        {broken >= 0.5 && (
          <mesh position={[HOLE[0], H + 1.5, HOLE[2]]} rotation={[Math.PI / 2, 0, 0]}>
            <planeGeometry args={[2 * hw, 2 * hw]} />
            <meshBasicMaterial color="#8fd0ff" />
          </mesh>
        )}
      </group>
      {/* janela, quadro e estante */}
      <mesh position={[-2.2, 2.0, -2.99]} material={sm("#9fd8ff", 0.2, {emissive: "#bfe6ff", emissiveIntensity: 0.5})}>
        <planeGeometry args={[1.4, 1.1]} />
      </mesh>
      <mesh position={[1.8, 2.3, -2.99]} geometry={rbox(1.0, 0.7, 0.04, 0.02)} material={sm("#c9a26a", 0.5)} />
      <mesh position={[1.8, 2.3, -2.965]} material={tm("quadro-diploma", label("quadro-diploma", "DIPLOMA", "#fbf3dc", "#7a5230", 60, 512, 320), 0.6)}>
        <planeGeometry args={[0.9, 0.6]} />
      </mesh>
      <group position={[3.2, 0, -1.6]}>
        <mesh position={[0, 1.1, 0]} geometry={rbox(0.5, 2.2, 1.6, 0.03)} material={sm("#7a5230", 0.6)} castShadow />
        {[0.5, 1.1, 1.7].map((y) =>
          Array.from({length: 5}, (_, i) => (
            <mesh key={y + "" + i} position={[-0.1, y + 0.18, -0.6 + i * 0.28]} material={sm(["#e8414f", "#2e86de", "#2ecc71", "#ffd21f", "#8e44ad"][i], 0.6)}>
              <boxGeometry args={[0.3, 0.36, 0.2]} />
            </mesh>
          )),
        )}
      </group>
      {/* mesa da diretora com plaquinha */}
      <group position={[-0.5, 0, -1.5]}>
        <mesh position={[0, 0.76, 0]} geometry={rbox(2.0, 0.08, 0.95, 0.02)} material={sm("#6b4426", 0.5)} castShadow receiveShadow />
        <mesh position={[0, 0.38, 0.0]} geometry={rbox(1.9, 0.72, 0.85, 0.02)} material={sm("#5a3820", 0.6)} castShadow />
        <group position={[0.45, 0.85, 0.32]} rotation={[-0.35, 0, 0]}>
          <mesh geometry={rbox(0.62, 0.15, 0.05, 0.01)} material={sm("#d9b25a", 0.3, {metalness: 0.6})} />
          <mesh position={[0, 0, 0.027]} material={tm("placa-diretora", label("placa-diretora", "DIRETORA", "#d9b25a", "#101018", 70, 512, 120), 0.4)}>
            <planeGeometry args={[0.58, 0.13]} />
          </mesh>
        </group>
        {[[-0.6, 0.85, -0.1], [-0.45, 0.85, -0.05]].map((q, i) => (
          <mesh key={i} position={q as V3} rotation={[0, 0.2 * i, 0]} material={sm(i ? "#ffffff" : "#f2efe6", 0.8)}>
            <boxGeometry args={[0.3, 0.04 + i * 0.04, 0.4]} />
          </mesh>
        ))}
      </group>
      {/* cadeira */}
      <group position={[-0.5, 0, -2.3]}>
        <mesh position={[0, 0.5, 0]} geometry={rbox(0.6, 0.1, 0.6, 0.03)} material={sm("#1d1f27", 0.5)} />
        <mesh position={[0, 0.95, -0.28]} geometry={rbox(0.6, 0.85, 0.08, 0.03)} material={sm("#1d1f27", 0.5)} />
      </group>
      {/* vaso de planta */}
      <group position={[-3.1, 0, -2.5]}>
        <mesh position={[0, 0.25, 0]} material={sm("#c0623a", 0.7)} castShadow>
          <cylinderGeometry args={[0.25, 0.2, 0.5, 14]} />
        </mesh>
        <mesh position={[0, 0.85, 0]} scale={[0.45, 0.6, 0.45]} material={sm("#3e9a4a", 0.8)} castShadow>
          <icosahedronGeometry args={[1, 1]} />
        </mesh>
      </group>
    </group>
  );
};
/** pedaços do teto caindo + poeira */
export const Debris: React.FC<{k: number; at: V3}> = ({k, at}) => {
  if (k <= 0 || k >= 1.6) return null;
  const q = Math.min(1, k);
  return (
    <group position={at}>
      {Array.from({length: 14}, (_, i) => {
        const a = Math.sin(i * 12.9898) * 43758.5453;
        const r1 = a - Math.floor(a);
        const b = Math.sin(i * 78.233) * 12345.678;
        const r2 = b - Math.floor(b);
        const y = Math.max(0.08, -q * q * at[1] * (0.9 + r1 * 0.3));
        return (
          <mesh key={i} position={[(r1 - 0.5) * 1.8 * (0.5 + q), y, (r2 - 0.5) * 1.8 * (0.5 + q)]} rotation={[q * 6 + i, q * 4 + i, 0]} material={sm("#f4f0e6", 0.9)} castShadow>
            <boxGeometry args={[0.18 + r2 * 0.25, 0.08, 0.15 + r1 * 0.2]} />
          </mesh>
        );
      })}
      {k > 0.6 &&
        Array.from({length: 10}, (_, i) => (
          <mesh key={"p" + i} position={[Math.cos(i * 0.63) * (0.5 + (k - 0.6) * 1.5), -at[1] + 0.4, Math.sin(i * 0.63) * (0.5 + (k - 0.6) * 1.5)]} scale={0.35 + (k - 0.6) * 0.6}>
            <sphereGeometry args={[1, 10, 8]} />
            <meshStandardMaterial color="#e8e0d0" transparent opacity={Math.max(0, 0.6 - (k - 0.6) * 0.6)} depthWrite={false} />
          </mesh>
        ))}
    </group>
  );
};
