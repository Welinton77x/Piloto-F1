import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";
import {signTex} from "./Sets33";

const eyeM = () => sm("#101018", 0.3);

/* ---------- meia (com cara, gravata e crachá quando promovida) ---------- */
export const MeiaViva: React.FC<{p: V3; r?: V3; s?: number; t?: number; color?: string; face?: number; tie?: boolean; badge?: boolean; blink?: number; mouth?: number; point?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0, color = "#ffffff", face = 1, tie = false, badge = false, blink = 0, mouth = 0, point = 0}) => {
  const m = sm(color, 0.85);
  const stripe = sm("#e8262d", 0.7);
  return (
    <group position={p} rotation={r} scale={s}>
      {/* cano */}
      <mesh position={[0, 0.42, 0]} material={m} castShadow>
        <capsuleGeometry args={[0.13, 0.5, 6, 14]} />
      </mesh>
      {[0.66, 0.74].map((y) => (
        <mesh key={y} position={[0, y, 0]} material={stripe}>
          <cylinderGeometry args={[0.135, 0.135, 0.035, 14]} />
        </mesh>
      ))}
      {/* pé da meia */}
      <mesh position={[0, 0.1, 0.12]} rotation={[Math.PI / 2, 0, 0]} material={m} castShadow>
        <capsuleGeometry args={[0.12, 0.22, 6, 12]} />
      </mesh>
      <mesh position={[0, 0.1, 0.28]} scale={[0.12, 0.11, 0.08]} material={sm("#d9d9d9", 0.9)}>
        <sphereGeometry args={[1, 10, 8]} />
      </mesh>
      {face > 0 && (
        <group position={[0, 0.5, 0.13]}>
          {[-1, 1].map((sd) => (
            <mesh key={sd} position={[0.045 * sd, 0.03, 0]} scale={[0.022, 0.03 * Math.max(0.1, 1 - blink), 0.012]} material={eyeM()}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          ))}
          <mesh position={[0, -0.04, 0]} scale={[0.035, 0.01 + 0.025 * mouth, 0.01]} material={sm("#3a1510", 0.5)}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        </group>
      )}
      {tie && (
        <group position={[0, 0.34, 0.135]}>
          <mesh position={[0, -0.06, 0]} rotation={[0, 0, Math.PI]} material={sm("#1a3a8a", 0.5)}>
            <coneGeometry args={[0.03, 0.12, 4]} />
          </mesh>
          <mesh position={[0, 0.01, 0]} material={sm("#1a3a8a", 0.5)}>
            <boxGeometry args={[0.035, 0.03, 0.02]} />
          </mesh>
        </group>
      )}
      {badge && (
        <mesh position={[0.08, 0.28, 0.135]} rotation={[0, 0, 0.1]} geometry={rbox(0.08, 0.1, 0.01, 0.005)} material={sm("#ffd21f", 0.4)} />
      )}
      {point > 0 && (
        <mesh position={[0.16, 0.45, 0.05]} rotation={[0, 0, -1.2 + Math.sin(t * 6) * 0.15]} material={m}>
          <capsuleGeometry args={[0.025, 0.18, 4, 6]} />
        </mesh>
      )}
    </group>
  );
};

/* ---------- pote de sorvete (feijão / flocos) ---------- */
export const PoteSorvete: React.FC<{p: V3; s?: number; open?: number; fill?: "feijao" | "flocos"; dust?: boolean; label?: string}> = ({p, s = 1, open = 0, fill = "feijao", dust = false, label = "#ff9ec7"}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0.16, 0]} material={sm("#ffffff", 0.5)} castShadow>
      <cylinderGeometry args={[0.24, 0.2, 0.32, 20]} />
    </mesh>
    <mesh position={[0, 0.16, 0]} material={sm(label, 0.6)}>
      <cylinderGeometry args={[0.243, 0.203, 0.12, 20, 1, true]} />
    </mesh>
    {/* conteúdo */}
    {open > 0.05 &&
      (fill === "feijao" ? (
        Array.from({length: 16}, (_, i) => (
          <mesh key={i} position={[Math.cos(i * 2.4) * 0.15 * ((i % 4) / 4 + 0.3), 0.32, Math.sin(i * 2.4) * 0.15 * ((i % 4) / 4 + 0.3)]} rotation={[i, i * 0.7, 0]} scale={[0.035, 0.022, 0.022]} material={sm("#5a2a14", 0.5)}>
            <sphereGeometry args={[1, 8, 6]} />
          </mesh>
        ))
      ) : (
        <>
          <mesh position={[0, 0.33, 0]} scale={[0.22, 0.05, 0.22]} material={sm("#fff6e6", 0.7)}>
            <sphereGeometry args={[1, 14, 8]} />
          </mesh>
          {Array.from({length: 10}, (_, i) => (
            <mesh key={i} position={[Math.cos(i * 2.1) * 0.12, 0.37, Math.sin(i * 2.1) * 0.12]} material={sm("#3a1a0a", 0.6)}>
              <boxGeometry args={[0.025, 0.012, 0.012]} />
            </mesh>
          ))}
        </>
      ))}
    {/* tampa */}
    <group position={[-0.24, 0.33, 0]} rotation={[0, 0, open * 2.2]}>
      <mesh position={[0.24, 0.015, 0]} material={sm(label, 0.5)}>
        <cylinderGeometry args={[0.25, 0.25, 0.03, 20]} />
      </mesh>
    </group>
    {dust && (
      <mesh position={[0, 0.36 + (1 - open) * 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#e8e8e8", 0.9, {transparent: true, opacity: 0.55})}>
        <circleGeometry args={[0.3, 6]} />
      </mesh>
    )}
  </group>
);

/* ---------- crachá de visitante ---------- */
export const Cracha: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.3, 0.4, 0.015, 0.02)} material={sm("#ffffff", 0.4)} />
    <mesh position={[0, 0.0, 0.009]}>
      <planeGeometry args={[0.28, 0.38]} />
      <meshBasicMaterial map={signTex("cracha", "VISITANTE\n★", "#1a3a8a", "#ffffff", 256, 340, 46)} toneMapped={false} />
    </mesh>
    <mesh position={[0, 0.3, 0]} rotation={[0, 0, 0]} material={sm("#e8262d", 0.6)}>
      <torusGeometry args={[0.12, 0.012, 6, 16, Math.PI]} />
    </mesh>
  </group>
);

/* ---------- papel higiênico no suporte (pra frente / pra trás) ---------- */
export const PapelHig: React.FC<{p: V3; s?: number; frente?: number}> = ({p, s = 1, frente = 1}) => (
  <group position={p} scale={s}>
    <mesh position={[0, 0, -0.25]} geometry={rbox(0.5, 0.12, 0.05, 0.02)} material={sm("#cfd4da", 0.3, {metalness: 0.5})} />
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#cfd4da", 0.3, {metalness: 0.5})}>
      <cylinderGeometry args={[0.02, 0.02, 0.5, 8]} />
    </mesh>
    <mesh rotation={[0, 0, Math.PI / 2]} material={sm("#ffffff", 0.9)} castShadow>
      <cylinderGeometry args={[0.18, 0.18, 0.4, 24]} />
    </mesh>
    {/* folha pendurada: na frente (z+) ou atrás (z-) */}
    <mesh position={[0, -0.25, 0.18 * (frente * 2 - 1)]} material={sm("#ffffff", 0.9)}>
      <boxGeometry args={[0.4, 0.5, 0.01]} />
    </mesh>
  </group>
);

/* ---------- chuva de meias ---------- */
export const ChuvaMeias: React.FC<{c: V3; t: number; k: number; n?: number}> = ({c, t, k, n = 40}) => (
  <group position={c}>
    {Array.from({length: n}, (_, i) => {
      const x = ((i * 0.618) % 1) * 2.6 - 1.3;
      const z = ((i * 0.381) % 1) * 1.2 - 0.6;
      const delay = (i % 10) * 0.06;
      const kk = Math.max(0, Math.min(1, (k - delay) / 0.5));
      const y = 4.5 - kk * kk * (4.5 - 0.1 - ((i * 0.27) % 1) * 0.5);
      if (k <= delay) return null;
      return (
        <group key={i} position={[x, y, z]} rotation={[kk < 1 ? t * 5 + i : 1.4, i, kk < 1 ? t * 3 : 0.3 * (i % 3)]}>
          <mesh material={sm(["#ffffff", "#ffd21f", "#3a86ff", "#e8262d", "#2ecc71"][i % 5], 0.85)}>
            <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
          </mesh>
          <mesh position={[0, -0.13, 0.07]} rotation={[Math.PI / 2, 0, 0]} material={sm(["#ffffff", "#ffd21f", "#3a86ff", "#e8262d", "#2ecc71"][i % 5], 0.85)}>
            <capsuleGeometry args={[0.055, 0.1, 4, 8]} />
          </mesh>
        </group>
      );
    })}
  </group>
);

/* ---------- quadro da previsão do tempo ---------- */
export const QuadroTempo: React.FC<{p: V3; s?: number}> = ({p, s = 1}) => (
  <group position={p} scale={s}>
    <mesh geometry={rbox(2.0, 1.3, 0.06, 0.03)} material={sm("#1a3a8a", 0.5)} />
    <mesh position={[0, 0, 0.035]}>
      <planeGeometry args={[1.9, 1.2]} />
      <meshBasicMaterial map={signTex("previsao", "PREVISÃO\nCHUVA  CHUVA\nCHUVA", "#2a6ad8", "#ffffff", 512, 330, 64)} toneMapped={false} />
    </mesh>
  </group>
);
