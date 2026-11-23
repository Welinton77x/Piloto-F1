import React from "react";
import {sm, rbox} from "./Sets9";
import {V3} from "./Sets5";
import {canvasTex} from "./util";

const signTex = (key: string, text: string, bg: string, fg: string, w = 512, h = 256, size = 110) =>
  canvasTex("sign-" + key, w, h, (c) => {
    c.fillStyle = bg;
    c.fillRect(0, 0, w, h);
    c.strokeStyle = "#101018";
    c.lineWidth = 16;
    c.strokeRect(8, 8, w - 16, h - 16);
    c.fillStyle = fg;
    c.font = `900 ${size}px sans-serif`;
    c.textAlign = "center";
    c.textBaseline = "middle";
    const lines = text.split("\n");
    lines.forEach((l, i) => c.fillText(l, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05));
  });

/* ---------- plaquinha num cabo (greve) ---------- */
export const PicketSign: React.FC<{p: V3; r?: V3; s?: number; text: string; k: string}> = ({p, r = [0, 0, 0], s = 1, text, k}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh position={[0, 0.35, 0]} material={sm("#8a5a2a", 0.7)}>
      <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
    </mesh>
    <mesh position={[0, 0.78, 0.015]}>
      <planeGeometry args={[0.6, 0.3]} />
      <meshBasicMaterial map={signTex(k, text, "#ffffff", "#e8262d")} toneMapped={false} />
    </mesh>
    <mesh position={[0, 0.78, 0]} geometry={rbox(0.62, 0.32, 0.02, 0.01)} material={sm("#ffffff", 0.6)} />
  </group>
);

/* ---------- tartaruga cronometrista ---------- */
export const Turtle: React.FC<{p: V3; rotY?: number; s?: number; t?: number; walk?: number; blink?: number; watch?: boolean; arm?: number}> = ({p, rotY = 0, s = 1, t = 0, walk = 0, blink = 0, watch = true, arm = 0}) => {
  const skin = sm("#8fcf6a", 0.6);
  const shell = sm("#6a4a2a", 0.6);
  const ph = t * 4 * walk;
  return (
    <group position={p} rotation={[0, rotY, 0]} scale={s}>
      {/* casco */}
      <mesh position={[0, 0.42, 0]} scale={[0.55, 0.38, 0.62]} material={shell} castShadow>
        <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
      </mesh>
      {[[-0.2, 0.18], [0.2, 0.18], [0, -0.05], [-0.18, -0.28], [0.18, -0.28]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.72 - Math.abs(z) * 0.3, z]} rotation={[-z * 1.2, 0, x * 1.5]} material={sm("#8a6a3a", 0.6)}>
          <cylinderGeometry args={[0.1, 0.12, 0.04, 6]} />
        </mesh>
      ))}
      <mesh position={[0, 0.42, 0]} scale={[0.57, 0.08, 0.64]} material={sm("#d9c08a", 0.6)}>
        <cylinderGeometry args={[1, 1, 1, 20]} />
      </mesh>
      {/* pernas */}
      {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz], i) => (
        <mesh key={i} position={[sx * 0.38, 0.2 + Math.max(0, Math.sin(ph + i * 1.6)) * 0.05, sz * 0.35]} material={skin}>
          <capsuleGeometry args={[0.09, 0.18, 4, 8]} />
        </mesh>
      ))}
      {/* pescoço e cabeça */}
      <mesh position={[0, 0.5, 0.62]} rotation={[0.9, 0, 0]} material={skin}>
        <capsuleGeometry args={[0.1, 0.22, 4, 8]} />
      </mesh>
      <group position={[0, 0.72, 0.8]}>
        <mesh scale={[0.2, 0.17, 0.22]} material={skin}>
          <sphereGeometry args={[1, 14, 10]} />
        </mesh>
        {[-1, 1].map((sd) => (
          <group key={sd} position={[0.09 * sd, 0.06, 0.15]}>
            <mesh scale={[0.06, 0.06 * Math.max(0.1, 1 - blink), 0.04]} material={sm("#ffffff", 0.3)}>
              <sphereGeometry args={[1, 10, 8]} />
            </mesh>
            <mesh position={[0, 0, 0.03]} scale={[0.03, 0.035 * Math.max(0.1, 1 - blink), 0.02]} material={sm("#101018", 0.3)}>
              <sphereGeometry args={[1, 8, 6]} />
            </mesh>
            {/* pálpebra caída (cara de sono) */}
            <mesh position={[0, 0.035, 0.01]} scale={[0.065, 0.03, 0.045]} material={skin}>
              <sphereGeometry args={[1, 10, 6]} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, -0.06, 0.2]} scale={[0.07, 0.015, 0.02]} material={sm("#3a2a1a", 0.6)}>
          <sphereGeometry args={[1, 8, 6]} />
        </mesh>
      </group>
      {/* braço com cronômetro */}
      {watch && (
        <group position={[0.35, 0.55, 0.45]} rotation={[-0.6 - arm, 0, -0.5]}>
          <mesh position={[0, 0.15, 0]} material={skin}>
            <capsuleGeometry args={[0.06, 0.22, 4, 8]} />
          </mesh>
          <Stopwatch p={[0, 0.36, 0.04]} s={0.9} t={t * 0.02} />
        </group>
      )}
    </group>
  );
};

/* ---------- cronômetro ---------- */
export const Stopwatch: React.FC<{p: V3; r?: V3; s?: number; t?: number}> = ({p, r = [0, 0, 0], s = 1, t = 0}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh rotation={[Math.PI / 2, 0, 0]} material={sm("#e8b020", 0.3, {metalness: 0.4})}>
      <cylinderGeometry args={[0.12, 0.12, 0.04, 24]} />
    </mesh>
    <mesh position={[0, 0, 0.021]}>
      <circleGeometry args={[0.1, 24]} />
      <meshBasicMaterial color="#ffffff" />
    </mesh>
    <mesh position={[0, 0, 0.025]} rotation={[0, 0, -t * Math.PI * 2]}>
      <planeGeometry args={[0.012, 0.16]} />
      <meshBasicMaterial color="#e8262d" />
    </mesh>
    <mesh position={[0, 0.15, 0]} material={sm("#e8b020", 0.3, {metalness: 0.4})}>
      <cylinderGeometry args={[0.025, 0.025, 0.05, 10]} />
    </mesh>
  </group>
);

/* ---------- miojo fossilizado (bloco de pedra com macarrão) ---------- */
export const FossilMiojo: React.FC<{p: V3; r?: V3; s?: number}> = ({p, r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.5, 0.18, 0.5, 0.05)} material={sm("#9a8a76", 0.95)} castShadow />
    {Array.from({length: 7}, (_, i) => (
      <mesh key={i} position={[-0.18 + i * 0.06, 0.092, 0.08 * Math.sin(i * 2)]} rotation={[-Math.PI / 2, 0, i]}>
        <torusGeometry args={[0.05, 0.008, 6, 14]} />
        <meshStandardMaterial color="#d9c49a" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

/* ---------- sachê de tempero ---------- */
export const Sache: React.FC<{p?: V3; r?: V3; s?: number}> = ({p = [0, 0, 0], r = [0, 0, 0], s = 1}) => (
  <group position={p} rotation={r} scale={s}>
    <mesh geometry={rbox(0.14, 0.1, 0.015, 0.008)} material={sm("#e8412c", 0.5)} />
    <mesh position={[0, 0, 0.009]}>
      <planeGeometry args={[0.08, 0.04]} />
      <meshBasicMaterial color="#ffd21f" />
    </mesh>
  </group>
);

/* ---------- padaria ---------- */
export const Padaria: React.FC<{p: V3; rotY?: number; s?: number; open?: number}> = ({p, rotY = 0, s = 1, open = 1}) => (
  <group position={p} rotation={[0, rotY, 0]} scale={s}>
    <mesh position={[0, 1.4, 0]} geometry={rbox(3.4, 2.8, 2.0, 0.06)} material={sm("#fff4e0", 0.7)} castShadow receiveShadow />
    <mesh position={[0, 2.45, 1.02]}>
      <planeGeometry args={[3.0, 0.75]} />
      <meshBasicMaterial map={signTex("padaria", "PADARIA", "#c8641e", "#ffffff", 1024, 256, 150)} toneMapped={false} />
    </mesh>
    {Array.from({length: 8}, (_, i) => (
      <mesh key={i} position={[-1.5 + 0.2 + i * 0.37, 1.95, 1.25]} rotation={[0.5, 0, 0]} material={sm(i % 2 ? "#ffffff" : "#e8412c", 0.6)}>
        <boxGeometry args={[0.37, 0.04, 0.6]} />
      </mesh>
    ))}
    {/* porta de enrolar subindo */}
    <mesh position={[-0.7, 0.85 + open * 0.6, 1.01]} scale={[1, 1 - open * 0.75, 1]} geometry={rbox(0.9, 1.6, 0.04, 0.02)} material={sm("#8a8f98", 0.5, {metalness: 0.3})} />
    <mesh position={[0.75, 1.05, 1.01]} geometry={rbox(1.4, 1.0, 0.04, 0.02)} material={sm("#fff0b0", 0.1, {emissive: "#ffd27a", emissiveIntensity: 0.5 * open})} />
    {[0, 1, 2].map((i) => (
      <mesh key={i} position={[0.35 + i * 0.4, 0.75, 1.08]} scale={[0.16, 0.08, 0.08]} material={sm("#d9913a", 0.6)}>
        <sphereGeometry args={[1, 12, 8]} />
      </mesh>
    ))}
  </group>
);

export {signTex};
