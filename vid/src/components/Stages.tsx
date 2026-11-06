import React, {useMemo} from "react";
import {random, useCurrentFrame} from "remotion";
import {Car, Driver, Heart, LabFloor, Mat, World, tubeFromPoints, Bone} from "./Parts";
import {L, SP, easeInOut, easeOut, rad} from "../lib/anim";

// Cada Stage lê o frame LOCAL da cena (useCurrentFrame dentro da Sequence).
// Tudo é função do frame; aleatoriedade só via random(seed).

const Stripes: React.FC<{speed: number; z?: number; y?: number; color?: string; n?: number}> = ({
  speed,
  z = -1.5,
  y = 0,
  color = "#cfd8e3",
  n = 14,
}) => {
  const f = useCurrentFrame();
  return (
    <>
      {Array.from({length: n}).map((_, i) => {
        const x = ((((i * 2 - f * speed) % (n * 2)) + n * 2) % (n * 2)) - n;
        return (
          <mesh key={i} position={[x, y + 0.01, z]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[1.2, 0.12]} />
            <Mat color={color} />
          </mesh>
        );
      })}
    </>
  );
};

/* ---------- s1 ---------- */
export const S1: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <group>
      <World frame={f} />
      <Stripes speed={0.1} z={-1.2} />
      <Stripes speed={0.1} z={1.4} />
      <Driver outfit="racing" position={[0, 0.2, 0]} headTilt={Math.sin(f / 9) * 1.5} />
    </group>
  );
};

/* ---------- s2 ---------- */
export const S2: React.FC = () => {
  const f = useCurrentFrame();
  const bodyOp = L(f, 20, 70, 1, 0.15, easeInOut);
  const lines = L(f, 40, 90, 0.7, 0.25);
  return (
    <group>
      <World frame={f} />
      <Car opacity={bodyOp} />
      <Driver outfit="racing" seated position={[0, 0.2, -0.45]} scale={0.8} xray={1 - bodyOp} />
      {Array.from({length: 40}).map((_, i) => {
        const period = 45;
        const ph = ((f + random("hp" + i) * period) % period) / period;
        const x = (random("hx" + i) - 0.5) * 0.9;
        const z = (random("hz" + i) - 0.5) * 1.6;
        return f < 40 ? null : (
          <mesh key={i} position={[x, 0.6 + ph * 1.2, z]} scale={1 - ph}>
            <icosahedronGeometry args={[0.04, 0]} />
            <Mat color="#ff9a3c" emissive="#ff6d00" ei={0.8} />
          </mesh>
        );
      })}
      {Array.from({length: 12}).map((_, i) => {
        const x = (random("sl" + i) - 0.5) * 6;
        const y = 0.2 + random("sy" + i) * 1.6;
        const z = ((((random("sz" + i) * 10 - f * 0.9) % 10) + 10) % 10) - 3;
        return (
          <mesh key={i} position={[x, y, z]} scale={[1, 1, 1]}>
            <boxGeometry args={[0.02, 0.02, 1.2]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={lines} />
          </mesh>
        );
      })}
    </group>
  );
};

/* ---------- s3 ---------- */
export const S3: React.FC = () => {
  const f = useCurrentFrame();
  const yaw = L(f, 0, 140, 0, -35);
  const tilt = L(f, 60, 140, 0, 18, easeInOut);
  const arrow = SP(f, 70) * 2;
  const gasY = 3 * (1 - SP(f, 220, 14, 120));
  const extCar = f < 150;
  return (
    <group>
      <World frame={f} />
      {extCar ? (
        <>
          <Car yaw={yaw} />
          <Driver outfit="racing" seated position={[0, 0.2, -0.45]} scale={0.8} headTilt={tilt} xray={0.7} />
        </>
      ) : (
        <>
          <Driver outfit="racing" position={[-0.4, 0, 0]} headTilt={tilt} />
          {/* seta lateral */}
          <group position={[0.4, 1.1, 0]} scale={[arrow, 1, 1]}>
            <mesh position={[0.3, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
              <Mat color="#e53935" emissive="#e53935" ei={0.5} />
            </mesh>
            <mesh position={[0.65, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
              <coneGeometry args={[0.09, 0.2, 6]} />
              <Mat color="#e53935" emissive="#e53935" ei={0.5} />
            </mesh>
          </group>
          {/* balança */}
          <mesh position={[0.9, 0.04, 0.2]}>
            <boxGeometry args={[0.8, 0.08, 0.6]} />
            <Mat color="#cfd8e3" />
          </mesh>
          <mesh position={[0.9, 0.12, 0.2]}>
            <boxGeometry args={[0.35, 0.07, 0.22]} />
            <Mat color="#12202e" emissive="#4dd0ff" ei={0.6} />
          </mesh>
          {/* botijão de gás */}
          <group position={[0.9, 0.2 + gasY + 0.25, 0.2]}>
            <mesh>
              <cylinderGeometry args={[0.2, 0.2, 0.5, 8]} />
              <Mat color="#e0a21a" />
            </mesh>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.07, 0.1, 0.1, 6]} />
              <Mat color="#9aa4b2" />
            </mesh>
          </group>
        </>
      )}
    </group>
  );
};

/* ---------- s4 ---------- */
export const S4: React.FC = () => {
  const f = useCurrentFrame();
  const radius = f < 170 ? 0.02 : L(f, 170, 230, 0.02, 0.045, easeInOut);
  const tilt = f < 200 ? L(f, 60, 110, 0, 14, easeInOut) : L(f, 200, 240, 14, 0, easeInOut);
  const stretch = SP(f, 170, 14, 90) * 0.8;
  const helm = L(f, 220, 250, 1, 1.08, easeInOut);
  return (
    <group>
      <LabFloor />
      <Driver
        outfit="racing"
        headTilt={tilt}
        helmetScale={helm}
        helmetColor={f > 220 ? "#8e1b17" : undefined}
        xray={0.8}
        position={[0, 0, 0]}
      />
      {/* músculos do pescoço: segmentos que engrossam */}
      {[-0.06, -0.02, 0.02, 0.06].map((x, k) => (
        <Bone
          key={k}
          a={[x, 0.93, k % 2 ? 0.04 : -0.04]}
          b={[x * 1.6, 1.1, k % 2 ? -0.03 : 0.03]}
          r={radius}
          color="#ff7043"
          emissive="#ff7043"
          ei={0.3}
        />
      ))}
      {/* elástico preso na cabeça */}
      {f >= 160 && (
        <group>
          <mesh position={[-0.45 - stretch / 2, 1.3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.02, 0.02, 0.9 + stretch, 6]} />
            <Mat color="#2e9e4f" emissive="#2e9e4f" ei={0.4} />
          </mesh>
          <mesh position={[-1.05 - stretch, 1.3, 0]}>
            <boxGeometry args={[0.12, 0.3, 0.12]} />
            <Mat color="#6b7686" />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- s5 ---------- */
const phaseAt = (f: number) => {
  let p = 0;
  for (let i = 0; i < f; i++) p += L(i, 60, 170, 60, 170, easeInOut) / 60 / 30;
  return p;
};
export const S5: React.FC = () => {
  const f = useCurrentFrame();
  const calm = 1 + 0.08 * Math.abs(Math.sin(Math.PI * (f / 30))) ; // 60 bpm
  const racing = 1 + 0.1 * Math.abs(Math.sin(Math.PI * phaseAt(f)));
  const t = L(f, 60, 170, 0, 1);
  const col = `rgb(${Math.round(46 + 190 * t)},${Math.round(158 - 100 * t)},${Math.round(79 - 30 * t)})`;
  const rock = f > 235 ? Math.sin(f * 0.5) * 6 : 0;
  return (
    <group>
      <Heart color="#2e9e4f" pulse={calm} position={[-0.9, 0.1, 0]} />
      <Heart color={col} pulse={racing} position={[0.9, 0.1, 0]} />
      {f > 170 && (
        <group position={[0, 0.95, 0]} scale={0.55} rotation={[0, rad(-40), rad(rock)]}>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.7, 0.1, 0.6]} />
            <Mat color="#d83a34" />
          </mesh>
          <mesh position={[0, 0.6, -0.25]}>
            <boxGeometry args={[0.7, 0.8, 0.1]} />
            <Mat color="#d83a34" />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- s6 ---------- */
export const S6: React.FC = () => {
  const f = useCurrentFrame();
  const level = L(f, 10, 80, 0, 1, easeOut);
  const therm = `rgb(${Math.round(60 + 180 * level)},${Math.round(150 - 100 * level)},${Math.round(230 - 190 * level)})`;
  const b1 = L(f, 110, 170, 1, 0);
  const b2 = L(f, 150, 210, 1, 0);
  return (
    <group>
      <LabFloor />
      <Driver outfit="racing" position={[-0.5, 0, 0]} xray={0.5} />
      {/* termômetro */}
      <group position={[0.5, 0.2, 0]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 1.4, 8]} />
          <Mat color="#dfe6ee" opacity={0.6} />
        </mesh>
        <mesh position={[0, 0.0 + 0.7 * level, 0]} scale={[1, Math.max(level, 0.01), 1]}>
          <cylinderGeometry args={[0.045, 0.045, 1.4, 8]} />
          <Mat color={therm} emissive={therm} ei={0.4} />
        </mesh>
        <mesh position={[0, -0.05, 0]}>
          <icosahedronGeometry args={[0.16, 1]} />
          <Mat color={therm} emissive={therm} ei={0.4} />
        </mesh>
      </group>
      {/* gotas de suor */}
      {f >= 70 &&
        Array.from({length: 8}).map((_, i) => {
          const per = 30;
          const ph = ((f + random("sd" + i) * per) % per) / per;
          return (
            <mesh key={i} position={[-0.5 + (random("sx" + i) - 0.5) * 0.4, 1.4 - ph * 0.6, 0.25]} scale={1 - ph * 0.4}>
              <icosahedronGeometry args={[0.035, 0]} />
              <Mat color="#4dd0ff" emissive="#4dd0ff" ei={0.6} />
            </mesh>
          );
        })}
      {/* vapor */}
      {Array.from({length: 6}).map((_, i) => {
        const ph = ((f + i * 12) % 60) / 60;
        return (
          <mesh key={i} position={[-0.5 + (i - 3) * 0.12, 1.5 + ph * 0.6, -0.1]} scale={0.6 + ph}>
            <icosahedronGeometry args={[0.05, 0]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.35 * (1 - ph)} />
          </mesh>
        );
      })}
      {/* balança + garrafas (após ~f 100) */}
      {f > 100 && (
        <group position={[1.5, 0, 0]}>
          <mesh position={[0, 0.04, 0]}>
            <boxGeometry args={[0.9, 0.08, 0.6]} />
            <Mat color="#cfd8e3" />
          </mesh>
          {[b1, b2].map((v, i) => (
            <group key={i} position={[-0.2 + i * 0.36, 0.5, 0]}>
              <mesh>
                <cylinderGeometry args={[0.13, 0.13, 0.8, 8]} />
                <Mat color="#dfe6ee" opacity={0.35} />
              </mesh>
              <mesh position={[0, -0.4 + 0.38 * v, 0]} scale={[1, Math.max(v, 0.001), 1]}>
                <cylinderGeometry args={[0.115, 0.115, 0.76, 8]} />
                <Mat color="#5d3a1a" />
              </mesh>
              <mesh position={[0, 0.45, 0]}>
                <cylinderGeometry args={[0.05, 0.08, 0.1, 6]} />
                <Mat color="#e53935" />
              </mesh>
            </group>
          ))}
        </group>
      )}
    </group>
  );
};

/* ---------- s7 ---------- */
export const S7: React.FC = () => {
  const f = useCurrentFrame();
  const depth = SP(f, 20, 14, 110) * 0.35;
  const disc = L(f, 30, 90, 0, 1, easeInOut);
  const lean = SP(f, 170, 14, 90) * 35;
  const arrow = SP(f, 175, 14, 110) * 1.8;
  const harness = L(f, 250, 275, 0, 1, easeInOut);
  const core = f >= 285 ? 0.6 + 0.4 * Math.sin(f * 0.2) : 0;
  const gauge = L(f, 20, 70, 0, 1, easeOut);
  return (
    <group>
      <LabFloor />
      {/* assento */}
      <mesh position={[0, 0.4, 0.02]}>
        <boxGeometry args={[0.6, 0.8, 0.1]} />
        <Mat color="#222831" />
      </mesh>
      <Driver outfit="racing" seated position={[0, 0, 0.2]} lean={lean * 0.6} harness={harness} coreGlow={core} xray={0.55} />
      {/* pedal e pé */}
      <group position={[0, 0.2, 0.85]}>
        <mesh position={[0, 0, depth]} rotation={[rad(-20), 0, 0]}>
          <boxGeometry args={[0.35, 0.3, 0.05]} />
          <Mat color="#9aa4b2" />
        </mesh>
        <mesh position={[0, 0.1, -0.25 + depth]}>
          <boxGeometry args={[0.18, 0.14, 0.4]} />
          <Mat color="#2b2f3a" />
        </mesh>
      </group>
      {/* medidor de força */}
      <group position={[-0.8, 0.2, 0.8]}>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.12, 1.0, 0.1]} />
          <Mat color="#dfe6ee" opacity={0.5} />
        </mesh>
        <mesh position={[0, 0.5 * gauge, 0]} scale={[1, Math.max(gauge, 0.01), 1]}>
          <boxGeometry args={[0.1, 1.0, 0.08]} />
          <Mat color="#e53935" emissive="#e53935" ei={0.5} />
        </mesh>
      </group>
      {/* discos de freio */}
      {[-0.7, 0.7].map((x) => (
        <mesh key={x} position={[x * 0.75, 0.2, 1.05]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 12]} />
          <Mat color="#ff7043" emissive="#ff5722" ei={disc * 1.6} />
        </mesh>
      ))}
      {/* seta de inércia */}
      {f > 170 && (
        <group position={[0, 1.2, 0.3]} scale={[1, 1, arrow]}>
          <mesh position={[0, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
            <Mat color="#e53935" emissive="#e53935" ei={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.09, 0.2, 6]} />
            <Mat color="#e53935" emissive="#e53935" ei={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
};

/* ---------- s8 ---------- */
export const S8: React.FC = () => {
  const f = useCurrentFrame();
  const freq = L(f, 0, 270, 0.15, 0.4);
  const energy = L(f, 80, 200, 1, 0.3);
  const heart = 1 + 0.12 * Math.abs(Math.sin(Math.PI * (170 / 60 / 30) * f));
  return (
    <group>
      {/* fitas de pista ao fundo */}
      {Array.from({length: 10}).map((_, i) => {
        const x = ((((i * 2.2 - f * 0.15) % 22) + 22) % 22) - 11;
        return (
          <mesh key={i} position={[x, 0.2 + (i % 3) * 0.6, -2.5]} rotation={[0, 0, rad(i % 2 ? 8 : -8)]}>
            <boxGeometry args={[1.8, 0.06, 0.02]} />
            <meshBasicMaterial color="#4dd0ff" transparent opacity={0.5} />
          </mesh>
        );
      })}
      <group position={[0, 1.1, 0]}>
        {[-0.28, 0.28].map((x) => (
          <mesh key={x} position={[x, 0, 0]} scale={[1, 0.85, 1.1]}>
            <icosahedronGeometry args={[0.42, 1]} />
            <Mat color="#f48fb1" emissive="#ad1457" ei={0.15} />
          </mesh>
        ))}
        {Array.from({length: 24}).map((_, i) => {
          const th = random("bt" + i) * Math.PI * 2;
          const ph = random("bp" + i) * Math.PI;
          const ops = 0.2 + 0.8 * Math.abs(Math.sin(f * freq + random("b" + i) * Math.PI * 2));
          return (
            <mesh key={i} position={[Math.cos(th) * Math.sin(ph) * 0.7, Math.cos(ph) * 0.35, Math.sin(th) * Math.sin(ph) * 0.5 + 0.35]}>
              <icosahedronGeometry args={[0.04, 0]} />
              <meshBasicMaterial color="#ffee58" transparent opacity={ops} />
            </mesh>
          );
        })}
      </group>
      {/* ícone de coração e barra de energia */}
      <Heart color="#e53935" pulse={heart * 0.38} position={[0.7, 0.3, 0]} />
      <group position={[-0.7, 0.3, 0]}>
        <mesh>
          <boxGeometry args={[0.2, 1, 0.1]} />
          <Mat color="#dfe6ee" opacity={0.4} />
        </mesh>
        <mesh position={[0, -0.5 + 0.5 * energy, 0.01]} scale={[1, Math.max(energy, 0.01), 1]}>
          <boxGeometry args={[0.16, 1, 0.1]} />
          <Mat color={energy > 0.5 ? "#2e9e4f" : "#e53935"} emissive={energy > 0.5 ? "#2e9e4f" : "#e53935"} ei={0.5} />
        </mesh>
      </group>
    </group>
  );
};

/* ---------- s9: três cortes de 90 f ---------- */
export const S9: React.FC = () => {
  const f = useCurrentFrame();
  const cut = f < 90 ? 0 : f < 180 ? 1 : 2;
  const lf = f - cut * 90;
  return (
    <group>
      <LabFloor />
      {cut === 0 && (
        <group>
          <mesh position={[0, 0.2, 0]}>
            <boxGeometry args={[0.9, 0.4, 0.5]} />
            <Mat color="#6b7686" />
          </mesh>
          <Driver outfit="training" position={[0, 0.4, 0]} scale={0.9} />
          <mesh position={[-1.3, 1.2, 0]}>
            <boxGeometry args={[0.14, 0.5, 0.14]} />
            <Mat color="#6b7686" />
          </mesh>
          <Bone a={[-1.23, 1.3, 0]} b={[-0.36 - Math.sin(lf * 0.25) * 0.08, 1.3, 0]} r={0.025} color="#2e9e4f" emissive="#2e9e4f" ei={0.4} />
          {Array.from({length: 6}).map((_, i) => (
            <mesh key={i} position={[0, 0.23, ((i * 0.34 + lf * 0.04) % 2.04) - 1.0]}>
              <boxGeometry args={[1.0, 0.02, 0.06]} />
              <Mat color="#9aa4b2" />
            </mesh>
          ))}
          <Driver outfit="training" position={[0, 0.25, 0]} scale={0.9} lean={8 + Math.sin(lf * 0.4) * 3} />
        </group>
      )}
      {cut === 2 && (
        <group>
          <Driver outfit="training" position={[0, Math.abs(Math.sin(lf * 0.1)) * -0.3 + 0.0, 0]} scale={0.9} coreGlow={1} />
          <mesh position={[0, 1.3 - Math.abs(Math.sin(lf * 0.1)) * 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.03, 0.03, 1.6, 6]} />
            <Mat color="#9aa4b2" />
          </mesh>
          {[-0.8, 0.8].map((x) => (
            <mesh key={x} position={[x, 1.3 - Math.abs(Math.sin(lf * 0.1)) * 0.3, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.2, 0.2, 0.08, 10]} />
              <Mat color="#1c1f26" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

/* ---------- s10 ---------- */
export const S10: React.FC = () => {
  const f = useCurrentFrame();
  const bull = SP(f, 120, 12, 120);
  const neckS = 1 + 0.8 * bull;
  const metal = L(f, 160, 200, 0, 1, easeInOut);
  const spring = useMemo(
    () =>
      tubeFromPoints(
        Array.from({length: 24}).map((_, i) => {
          const t = i / 23;
          return [Math.cos(t * Math.PI * 8) * 0.12, t * 0.5, Math.sin(t * Math.PI * 8) * 0.12] as [number, number, number];
        }),
        0.02,
      ),
    [],
  );
  return (
    <group>
      <LabFloor />
      {f < 120 ? (
        <group>
          {/* cadeira gigante */}
          <group scale={1.6}>
            <mesh position={[0, 0.2, 0]}>
              <boxGeometry args={[0.8, 0.1, 0.8]} />
              <Mat color="#d83a34" />
            </mesh>
            <mesh position={[0, 0.55, -0.4]}>
              <boxGeometry args={[0.8, 0.7, 0.1]} />
              <Mat color="#d83a34" />
            </mesh>
            {[-0.34, 0.34].map((x) => (
              <mesh key={x} position={[x, 0.08, 0.34]}>
                <boxGeometry args={[0.08, 0.16, 0.08]} />
                <Mat color="#9aa4b2" />
              </mesh>
            ))}
          </group>
          <Driver outfit="racing" seated position={[0, 0.42, -0.1]} scale={0.38} />
        </group>
      ) : (
        <Driver outfit="racing" neckScale={neckS} legMetal={metal} position={[0, 0, 0]} headTilt={Math.sin(f * 0.15) * 2} />
      )}
      {/* mola do pescoço */}
      <mesh geometry={spring} position={[-0.9, 0.9, 0]} rotation={[0, 0, rad(Math.sin(f * 0.2) * 4)]}>
        <Mat color="#4dd0ff" emissive="#4dd0ff" ei={0.3} />
      </mesh>
      <Heart color="#e53935" pulse={0.3 * (1 + 0.1 * Math.abs(Math.sin(f * 0.3)))} position={[0.9, 1.0, 0]} />
      {f > 215 && (
        <mesh position={[0.2, 1.5 - ((f - 215) % 25) * 0.02, 0.3]}>
          <icosahedronGeometry args={[0.04, 0]} />
          <Mat color="#4dd0ff" emissive="#4dd0ff" ei={0.6} />
        </mesh>
      )}
    </group>
  );
};

/* ---------- s11: mascote do canal ---------- */
export const S11: React.FC = () => {
  const f = useCurrentFrame();
  const wave = f >= 15 ? Math.sin((f - 15) * 0.35) * 25 + 95 : 0;
  return (
    <group>
      <World frame={f} />
      <Driver outfit="mechanic" position={[0, 0, 0]} wave={wave} scale={0.95} />
    </group>
  );
};

export const STAGES: Record<string, React.FC> = {
  s1: S1,
  s2: S2,
  s3: S3,
  s4: S4,
  s5: S5,
  s6: S6,
  s7: S7,
  s8: S8,
  s9: S9,
  s10: S10,
  s11: S11,
};
