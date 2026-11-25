import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";

/* ---------- mochila (rosto só quando "alive") ---------- */
export const Mochila: React.FC<{p: V3; r?: V3; s?: number; alive?: number; glasses?: boolean; blink?: number; mouth?: number; t?: number}> = ({p, r = [0, 0, 0], s = 1, alive = 0, glasses = false, blink = 0, mouth = 0, t = 0}) => {
  const blue = sm("#3a6ad0", 0.6);
  const dark = sm("#2a4a9a", 0.6);
  return (
    <group position={p} rotation={r} scale={s}>
      <mesh position={[0, 0.35, 0]} geometry={rbox(0.55, 0.7, 0.3, 0.12)} material={blue} castShadow />
      <mesh position={[0, 0.2, 0.17]} geometry={rbox(0.42, 0.28, 0.1, 0.06)} material={dark} />
      <mesh position={[0, 0.69, 0]} rotation={[0, Math.PI / 2, 0]} material={dark}>
        <torusGeometry args={[0.1, 0.025, 6, 12, Math.PI]} />
      </mesh>
      {/* zíper */}
      <mesh position={[0, 0.34, 0.215]} geometry={rbox(0.36, 0.015, 0.01, 0.004)} material={sm("#e8b020", 0.3, {metalness: 0.5})} />
      {alive > 0 && (
        <group position={[0, 0.5, 0.155]} scale={alive}>
          {[-1, 1].map((sd) => (
            <group key={sd} position={[0.1 * sd, 0, 0]}>
              <mesh scale={[0.06, 0.07 * Math.max(0.1, 1 - blink), 0.02]} material={sm("#ffffff", 0.3)}>
                <sphereGeometry args={[1, 12, 8]} />
              </mesh>
              <mesh position={[0, -0.01, 0.015]} scale={[0.035, 0.04 * Math.max(0.1, 1 - blink), 0.01]} material={sm("#101018", 0.2)}>
                <sphereGeometry args={[1, 10, 8]} />
              </mesh>
              {glasses && (
                <mesh position={[0, 0, 0.03]} material={sm("#101018", 0.3)}>
                  <torusGeometry args={[0.075, 0.012, 6, 16]} />
                </mesh>
              )}
            </group>
          ))}
          {glasses && <mesh position={[0, 0, 0.03]} material={sm("#101018", 0.3)}><boxGeometry args={[0.06, 0.012, 0.01]} /></mesh>}
          <mesh position={[0, -0.1, 0.01]} scale={[0.05, 0.015 + mouth * 0.04, 0.01]} material={sm("#3a1010", 0.6)}>
            <sphereGeometry args={[1, 10, 6]} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- armário de escola ---------- */
export const Armario: React.FC<{p: V3; rotY?: number; s?: number; open?: number; shake?: number; t?: number}> = ({p, rotY = 0, s = 1, open = 0, shake = 0, t = 0}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 1.0, 0]} geometry={rbox(0.7, 2.0, 0.6, 0.03)} material={sm("#6a8ab0", 0.4, {metalness: 0.3})} castShadow />
    <group position={[-0.33, 1.0, 0.31]} rotation={[0, -open * 1.6 + Math.sin(t * 30) * 0.03 * shake, 0]}>
      <mesh position={[0.33, 0, 0]} geometry={rbox(0.66, 1.94, 0.04, 0.02)} material={sm("#7a9ac0", 0.4, {metalness: 0.3})} />
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[0.33, 0.75 - i * 0.06, 0.025]} geometry={rbox(0.4, 0.02, 0.01, 0.004)} material={sm("#4a6a90", 0.5)} />
      ))}
      <mesh position={[0.58, 0, 0.04]} geometry={rbox(0.04, 0.16, 0.04, 0.01)} material={sm("#cfd4da", 0.3, {metalness: 0.6})} />
    </group>
  </group>
);

/* ---------- toupeira cavadora ---------- */
export const Toupeira: React.FC<{p: V3; rotY?: number; s?: number; t?: number; dig?: number}> = ({p, rotY = 0, s = 1, t = 0, dig = 0}) => {
  const fur = sm("#4a3a3a", 0.95);
  const pink = sm("#f4a0b0", 0.6);
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.3, 0]} scale={[0.3, 0.28, 0.4]} material={fur} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
      </mesh>
      <mesh position={[0, 0.32, 0.4]} material={pink}>
        <sphereGeometry args={[0.07, 10, 8]} />
      </mesh>
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <mesh position={[0.09 * sd, 0.42, 0.3]} material={sm("#101018", 0.2)}>
            <sphereGeometry args={[0.025, 8, 6]} />
          </mesh>
          {/* patas cavando */}
          <mesh position={[0.24 * sd, 0.15 + Math.sin(t * 25 + sd) * 0.05 * dig, 0.3]} rotation={[0.5 + Math.sin(t * 25 + sd) * 0.6 * dig, 0, 0]} scale={[0.09, 0.03, 0.1]} material={pink}>
            <sphereGeometry args={[1, 10, 6]} />
          </mesh>
        </group>
      ))}
      {/* capacete de obra com lanterna */}
      <mesh position={[0, 0.56, 0.02]} scale={[1, 0.6, 1]} material={sm("#ffd21f", 0.4)}>
        <sphereGeometry args={[0.2, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      <mesh position={[0, 0.6, 0.18]} material={sm("#ffffff", 0.2, {emissive: "#fff6c0", emissiveIntensity: 1.5})}>
        <sphereGeometry args={[0.04, 8, 6]} />
      </mesh>
    </group>
  );
};

/* ---------- terra voando ---------- */
export const Terra: React.FC<{p: V3; t: number; k?: number}> = ({p, t, k = 1}) => (
  <group position={p}>
    {Array.from({length: 14}, (_, i) => {
      const q = (t * 1.6 + i / 14) % 1;
      return (
        <mesh key={i} position={[Math.sin(i * 2.4) * q * 1.2, Math.sin(q * Math.PI) * 1.0 * k, Math.cos(i * 1.9) * q * 0.8]} scale={0.05 + (i % 3) * 0.02} material={sm("#6a4a2a", 0.95)}>
          <dodecahedronGeometry args={[1, 0]} />
        </mesh>
      );
    })}
  </group>
);

/* ---------- panda mestre de kung fu ---------- */
export const Panda: React.FC<{p: V3; rotY?: number; s?: number; t?: number; kick?: number; scared?: number; run?: number}> = ({p, rotY = 0, s = 1, t = 0, kick = 0, scared = 0, run = 0}) => {
  const w = sm("#f4f4f0", 0.8);
  const b = sm("#1d1d22", 0.8);
  const ph = t * 14 * run;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      <mesh position={[0, 0.75, 0]} scale={[0.5, 0.55, 0.45]} material={w} castShadow>
        <sphereGeometry args={[1, 18, 14]} />
      </mesh>
      {/* faixa preta de kung fu */}
      <mesh position={[0, 0.62, 0]} rotation={[Math.PI / 2, 0, 0]} material={sm("#101018", 0.6)}>
        <torusGeometry args={[0.47, 0.04, 6, 24]} />
      </mesh>
      <group position={[0, 1.45 + scared * 0.05 * Math.sin(t * 40), 0]}>
        <mesh scale={[0.38, 0.33, 0.33]} material={w}>
          <sphereGeometry args={[1, 18, 14]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd}>
            <mesh position={[0.28 * sd, 0.26, 0]} material={b}>
              <sphereGeometry args={[0.1, 10, 8]} />
            </mesh>
            <mesh position={[0.13 * sd, 0.04, 0.27]} rotation={[0, 0, sd * 0.5]} scale={[0.08, 0.11, 0.04]} material={b}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0.13 * sd, 0.05, 0.31]} scale={[0.03 + scared * 0.02, 0.03 + scared * 0.02, 0.01]} material={sm("#ffffff", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.08, 0.31]} material={b}>
          <sphereGeometry args={[0.04, 8, 6]} />
        </mesh>
        {scared > 0 && (
          <mesh position={[0, -0.18, 0.29]} scale={[0.06, 0.05, 0.02]} material={sm("#3a1010", 0.6)}>
            <sphereGeometry args={[1, 10, 6]} />
          </mesh>
        )}
      </group>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[0.45 * sd, 1.0, 0]} rotation={[scared > 0 ? -2.6 : -0.3 + Math.sin(ph + sd) * 0.6 * run, 0, sd * (0.4 + kick * 0.8)]}>
          <mesh position={[0, -0.25, 0]} material={b}>
            <capsuleGeometry args={[0.11, 0.3, 4, 8]} />
          </mesh>
        </group>
      ))}
      {[-1, 1].map((sd) => (
        <group key={"l" + sd} position={[0.2 * sd, 0.3, 0]} rotation={[sd > 0 ? -kick * 1.4 : 0 + Math.sin(ph + sd * 2) * 0.7 * run, 0, 0]}>
          <mesh position={[0, -0.15, 0]} material={b}>
            <capsuleGeometry args={[0.12, 0.18, 4, 8]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

/* ---------- dojô no Japão ---------- */
export const Dojo: React.FC = () => (
  <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={sm("#d9b88a", 0.7)}>
      <planeGeometry args={[14, 10]} />
    </mesh>
    {[-2, 0, 2].map((x) => (
      <mesh key={x} position={[x * 1.5, 0.011, -1]} rotation={[-Math.PI / 2, 0, 0]} material={sm("#c8a070", 0.7)}>
        <planeGeometry args={[2.8, 6]} />
      </mesh>
    ))}
    <mesh position={[0, 2, -2.4]} material={sm("#f4ecd8", 0.8)}>
      <boxGeometry args={[14, 4, 0.1]} />
    </mesh>
    {[-3, -1, 1, 3].map((x) => (
      <mesh key={x} position={[x * 1.2, 2, -2.3]} material={sm("#b81d22", 0.5)}>
        <boxGeometry args={[0.18, 4, 0.18]} />
      </mesh>
    ))}
    {/* lanternas */}
    {[-1.8, 1.8].map((x) => (
      <group key={x} position={[x, 2.8, -1.8]}>
        <mesh scale={[1, 1.3, 1]} material={sm("#e8262d", 0.5, {emissive: "#ff5030", emissiveIntensity: 0.6})}>
          <sphereGeometry args={[0.22, 14, 10]} />
        </mesh>
      </group>
    ))}
    {/* sol vermelho na parede */}
    <mesh position={[0, 2.6, -2.34]}>
      <circleGeometry args={[0.55, 32]} />
      <meshBasicMaterial color="#e8262d" />
    </mesh>
  </group>
);

/* ---------- tapete mágico ---------- */
export const TapeteMagico: React.FC<{p: V3; rotY?: number; s?: number; t?: number; children?: React.ReactNode}> = ({p, rotY = 0, s = 1, t = 0, children}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} position={[-0.7 + i * 0.2, Math.sin(t * 6 + i * 0.8) * 0.04, 0]} material={sm(i % 2 ? "#8a2aaa" : "#c8641e", 0.7)}>
        <boxGeometry args={[0.2, 0.03, 0.9]} />
      </mesh>
    ))}
    {[-1, 1].map((sd) =>
      [0, 1, 2].map((k) => (
        <mesh key={sd + "-" + k} position={[sd * 0.82, Math.sin(t * 6 + sd * 3) * 0.04, -0.3 + k * 0.3]} material={sm("#ffd21f", 0.5)}>
          <cylinderGeometry args={[0.01, 0.01, 0.12, 4]} />
        </mesh>
      )),
    )}
    <group position={[0, 0.03, 0]}>{children}</group>
  </group>
);

/* ---------- folha da prova ---------- */
export const Prova: React.FC<{p: V3; r?: V3; s?: number; nota?: boolean}> = ({p, r = [-Math.PI / 2, 0, 0], s = 1, nota = false}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh>
      <planeGeometry args={[0.3, 0.4]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} position={[-0.02, 0.12 - i * 0.06, 0.001]}>
        <planeGeometry args={[0.22, 0.012]} />
        <meshBasicMaterial color="#8a8f98" />
      </mesh>
    ))}
    {nota && (
      <mesh position={[0.1, 0.15, 0.002]}>
        <circleGeometry args={[0.05, 20]} />
        <meshBasicMaterial color="#e8262d" />
      </mesh>
    )}
  </group>
);
