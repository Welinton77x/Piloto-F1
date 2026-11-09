import React, {useMemo} from "react";
import * as THREE from "three";
import {canvasTex, woodTex, rng} from "./util";

const W = {x0: -3, x1: 3, zBack: -2.5, h: 3.2};
export const WIN = {x: 0.55, y0: 1.05, y1: 2.55, w: 1.35};
export const BOOK = {pos: [1.5, 0.79, -1.42] as [number, number, number]};

const plaster = () =>
  canvasTex("plaster", 512, 512, (c, r) => {
    c.fillStyle = "#d8c3b0";
    c.fillRect(0, 0, 512, 512);
    for (let i = 0; i < 4000; i++) {
      c.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "90,60,40"},${r() * 0.05})`;
      c.fillRect(r() * 512, r() * 512, 2 + r() * 6, 2 + r() * 6);
    }
  }, [3, 2]);

const panel = () =>
  canvasTex("panel", 512, 256, (c, r) => {
    c.fillStyle = "#5a3522";
    c.fillRect(0, 0, 512, 256);
    for (let i = 0; i < 4; i++) {
      c.fillStyle = "#4a2b1b";
      c.fillRect(i * 128 + 14, 22, 100, 212);
      c.strokeStyle = "rgba(255,210,170,0.12)";
      c.lineWidth = 3;
      c.strokeRect(i * 128 + 14, 22, 100, 212);
    }
    for (let g = 0; g < 200; g++) {
      c.fillStyle = `rgba(20,10,5,${r() * 0.12})`;
      c.fillRect(r() * 512, r() * 256, 1, 10 + r() * 40);
    }
  }, [4, 1]);

const skyTex = () =>
  canvasTex("sky", 512, 512, (c, r) => {
    const g = c.createLinearGradient(0, 0, 0, 512);
    g.addColorStop(0, "#fff6dc");
    g.addColorStop(0.55, "#ffe1a8");
    g.addColorStop(1, "#cfe6b0");
    c.fillStyle = g;
    c.fillRect(0, 0, 512, 512);
    const hill = (y: number, col: string, amp: number) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(0, 512);
      for (let x = 0; x <= 512; x += 16) c.lineTo(x, y + Math.sin(x * 0.012 + amp) * 30 + Math.sin(x * 0.04 + amp * 2) * 8);
      c.lineTo(512, 512);
      c.fill();
    };
    hill(330, "#9cc477", 1);
    hill(380, "#6fa45a", 3);
    for (let i = 0; i < 9; i++) {
      const x = r() * 512, y = 360 + r() * 60, s = 18 + r() * 20;
      c.fillStyle = "#4f8a46";
      c.beginPath();
      c.arc(x, y, s, 0, Math.PI * 2);
      c.fill();
    }
  });

const posterTex = () =>
  canvasTex("poster", 256, 384, (c, r) => {
    c.fillStyle = "#1d2a5c";
    c.fillRect(0, 0, 256, 384);
    for (let i = 0; i < 70; i++) {
      c.fillStyle = `rgba(255,255,255,${0.3 + r() * 0.7})`;
      c.fillRect(r() * 256, r() * 384, 2, 2);
    }
    c.fillStyle = "#e0a456";
    c.beginPath();
    c.arc(128, 170, 52, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = "rgba(160,90,40,0.5)";
    c.fillRect(76, 158, 104, 10);
    c.fillRect(80, 184, 96, 7);
    c.strokeStyle = "#f3d9a6";
    c.lineWidth = 6;
    c.beginPath();
    c.ellipse(128, 172, 96, 22, -0.2, 0, Math.PI * 2);
    c.stroke();
    c.fillStyle = "#f3d9a6";
    c.font = "bold 22px sans-serif";
    c.textAlign = "center";
    c.fillText("SATURNO", 128, 330);
  });

const rugTex = () =>
  canvasTex("rug", 512, 512, (c) => {
    c.fillStyle = "#9e3b2f";
    c.beginPath();
    c.arc(256, 256, 256, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e7b35a";
    c.lineWidth = 10;
    for (const rr of [225, 160, 90]) {
      c.beginPath();
      c.arc(256, 256, rr, 0, Math.PI * 2);
      c.stroke();
    }
    c.fillStyle = "#2f3f7a";
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      c.beginPath();
      c.arc(256 + Math.cos(a) * 192, 256 + Math.sin(a) * 192, 14, 0, Math.PI * 2);
      c.fill();
    }
  });

const shaftTex = () =>
  canvasTex("shaft", 64, 256, (c) => {
    const g = c.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, "rgba(255,230,170,0.9)");
    g.addColorStop(1, "rgba(255,230,170,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, 64, 256);
    const h = c.createLinearGradient(0, 0, 64, 0);
    h.addColorStop(0, "rgba(0,0,0,1)");
    h.addColorStop(0.2, "rgba(0,0,0,0)");
    h.addColorStop(0.8, "rgba(0,0,0,0)");
    h.addColorStop(1, "rgba(0,0,0,1)");
    c.globalCompositeOperation = "destination-out";
    c.fillStyle = h;
    c.fillRect(0, 0, 64, 256);
  });

const M = (color: string, rough = 0.8) => new THREE.MeshStandardMaterial({color, roughness: rough});

const Box: React.FC<{p: [number, number, number]; s: [number, number, number]; m: THREE.Material; r?: [number, number, number]}> = ({p, s, m, r}) => (
  <mesh position={p} rotation={r} material={m} castShadow receiveShadow>
    <boxGeometry args={s} />
  </mesh>
);

const BOOK_COLORS = ["#2f4a8a", "#8a2f3a", "#2f7a5a", "#c8902a", "#5a3a7a", "#2a6a8a", "#a04a2a", "#e0d6c0"];

const Books: React.FC<{p: [number, number, number]; n: number; seed: number; rotY?: number}> = ({p, n, seed, rotY = 0}) => {
  const items = useMemo(() => {
    const r = rng(seed);
    let x = 0;
    return Array.from({length: n}, () => {
      const w = 0.035 + r() * 0.03, h = 0.2 + r() * 0.1, d = 0.15 + r() * 0.04;
      const it = {x: x + w / 2, w, h, d, col: BOOK_COLORS[Math.floor(r() * BOOK_COLORS.length)], tilt: r() > 0.85 ? 0.12 : 0};
      x += w + 0.004;
      return it;
    });
  }, [n, seed]);
  const mats = useMemo(() => Object.fromEntries(BOOK_COLORS.map((c) => [c, M(c, 0.7)])), []);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      {items.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, 0]} rotation={[0, 0, b.tilt]} material={mats[b.col]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.d]} />
        </mesh>
      ))}
    </group>
  );
};

/** Quarto: parede com lambri, janela com luz do sol, cama, mesa com livros, pôster, tapete */
export const Room: React.FC<{t: number; bookBurn?: number}> = ({t, bookBurn = 0}) => {
  const mats = useMemo(
    () => ({
      floor: new THREE.MeshStandardMaterial({map: woodTex("floor", [150, 92, 58], 8, [3, 3]), roughness: 0.65}),
      wall: new THREE.MeshStandardMaterial({map: plaster(), roughness: 0.95}),
      panel: new THREE.MeshStandardMaterial({map: panel(), roughness: 0.7}),
      wood: new THREE.MeshStandardMaterial({map: woodTex("desk", [120, 72, 42], 4, [1, 1]), roughness: 0.6}),
      dark: M("#3b2416", 0.6),
      sky: new THREE.MeshBasicMaterial({map: skyTex(), color: new THREE.Color(1.25, 1.2, 1.1)}),
      curtain: M("#5b2f6e", 0.95),
      blanket: M("#2d3f8f", 0.95),
      sheet: M("#efe8dc", 0.9),
      poster: new THREE.MeshStandardMaterial({map: posterTex(), roughness: 0.8}),
      rug: new THREE.MeshStandardMaterial({map: rugTex(), roughness: 1, transparent: true}),
      shaft: new THREE.MeshBasicMaterial({map: shaftTex(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.22, side: THREE.DoubleSide}),
      book: M("#b3262e", 0.6),
      pages: M("#f3ead2", 0.9),
      lamp: M("#2f6a5a", 0.4),
      glass: new THREE.MeshStandardMaterial({color: "#cfe9ff", roughness: 0.05, transparent: true, opacity: 0.45}),
    }),
    [],
  );
  // o livro escurece enquanto queima
  const burnt = Math.min(1, bookBurn * 1.3);
  mats.book.color.set("#b3262e").lerp(new THREE.Color("#1a0d08"), burnt);
  mats.pages.color.set("#f3ead2").lerp(new THREE.Color("#2a1a10"), burnt);
  mats.book.emissive.set("#ff4a00");
  mats.book.emissiveIntensity = bookBurn > 0 ? 0.35 * (0.7 + 0.3 * Math.sin(t * 17)) * Math.min(1, bookBurn * 3) : 0;

  const hx = WIN.w / 2;
  return (
    <group>
      {/* chão */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.25]} material={mats.floor} receiveShadow>
        <planeGeometry args={[6, 5.5]} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, 0.1]} material={mats.rug} receiveShadow>
        <circleGeometry args={[1.05, 48]} />
      </mesh>

      {/* parede do fundo com vão da janela */}
      <Box p={[(W.x0 + WIN.x - hx) / 2, W.h / 2, W.zBack]} s={[WIN.x - hx - W.x0, W.h, 0.1]} m={mats.wall} />
      <Box p={[(W.x1 + WIN.x + hx) / 2, W.h / 2, W.zBack]} s={[W.x1 - WIN.x - hx, W.h, 0.1]} m={mats.wall} />
      <Box p={[WIN.x, WIN.y0 / 2, W.zBack]} s={[WIN.w, WIN.y0, 0.1]} m={mats.wall} />
      <Box p={[WIN.x, (W.h + WIN.y1) / 2, W.zBack]} s={[WIN.w, W.h - WIN.y1, 0.1]} m={mats.wall} />
      {/* lambri */}
      <mesh position={[0, 0.5, W.zBack + 0.06]} material={mats.panel} receiveShadow>
        <planeGeometry args={[6, 1]} />
      </mesh>
      <Box p={[0, 1.02, W.zBack + 0.07]} s={[6, 0.05, 0.05]} m={mats.dark} />
      {/* paredes laterais */}
      <mesh position={[W.x0, W.h / 2, 0.25]} rotation={[0, Math.PI / 2, 0]} material={mats.wall} receiveShadow>
        <planeGeometry args={[5.5, W.h]} />
      </mesh>
      <mesh position={[W.x0 + 0.01, 0.5, 0.25]} rotation={[0, Math.PI / 2, 0]} material={mats.panel} receiveShadow>
        <planeGeometry args={[5.5, 1]} />
      </mesh>
      <mesh position={[W.x1, W.h / 2, 0.25]} rotation={[0, -Math.PI / 2, 0]} material={mats.wall} receiveShadow>
        <planeGeometry args={[5.5, W.h]} />
      </mesh>
      <mesh position={[W.x1 - 0.01, 0.5, 0.25]} rotation={[0, -Math.PI / 2, 0]} material={mats.panel} receiveShadow>
        <planeGeometry args={[5.5, 1]} />
      </mesh>
      <mesh position={[0, W.h, 0.25]} rotation={[Math.PI / 2, 0, 0]} material={mats.wall}>
        <planeGeometry args={[6, 5.5]} />
      </mesh>

      {/* janela: céu lá fora + moldura + treliça */}
      <mesh position={[WIN.x, (WIN.y0 + WIN.y1) / 2, W.zBack - 0.6]} material={mats.sky}>
        <planeGeometry args={[3, 2.4]} />
      </mesh>
      <Box p={[WIN.x, WIN.y0 - 0.03, W.zBack + 0.08]} s={[WIN.w + 0.2, 0.07, 0.2]} m={mats.dark} />
      <Box p={[WIN.x, WIN.y1 + 0.03, W.zBack + 0.03]} s={[WIN.w + 0.16, 0.07, 0.12]} m={mats.dark} />
      <Box p={[WIN.x - hx - 0.03, (WIN.y0 + WIN.y1) / 2, W.zBack + 0.03]} s={[0.07, WIN.y1 - WIN.y0, 0.12]} m={mats.dark} />
      <Box p={[WIN.x + hx + 0.03, (WIN.y0 + WIN.y1) / 2, W.zBack + 0.03]} s={[0.07, WIN.y1 - WIN.y0, 0.12]} m={mats.dark} />
      {[-1, 0, 1].map((k) => (
        <Box key={"v" + k} p={[WIN.x + k * (WIN.w / 4), (WIN.y0 + WIN.y1) / 2, W.zBack - 0.02]} s={[0.025, WIN.y1 - WIN.y0, 0.03]} m={mats.dark} />
      ))}
      {[1, 2, 3, 4].map((k) => (
        <Box key={"h" + k} p={[WIN.x, WIN.y0 + k * ((WIN.y1 - WIN.y0) / 5), W.zBack - 0.02]} s={[WIN.w, 0.025, 0.03]} m={mats.dark} />
      ))}
      {/* cortinas */}
      {[-1, 1].map((s) => (
        <group key={s} position={[WIN.x + s * (hx + 0.28), 0, W.zBack + 0.15]}>
          {[0, 1, 2, 3, 4].map((k) => (
            <mesh key={k} position={[(k - 2) * 0.07, 1.6, (k % 2) * 0.03]} material={mats.curtain} castShadow>
              <cylinderGeometry args={[0.055, 0.075, 3.0, 10]} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[WIN.x, 2.95, W.zBack + 0.18]} rotation={[0, 0, Math.PI / 2]} material={mats.dark}>
        <cylinderGeometry args={[0.02, 0.02, 2.6, 8]} />
      </mesh>
      {/* feixe de luz do sol */}
      <mesh position={[WIN.x + 0.15, 1.2, W.zBack + 1.1]} rotation={[-0.75, 0.05, 0]} material={mats.shaft}>
        <planeGeometry args={[1.3, 2.6]} />
      </mesh>

      {/* pôster */}
      <mesh position={[-1.05, 1.95, W.zBack + 0.06]} material={mats.poster}>
        <planeGeometry args={[0.6, 0.9]} />
      </mesh>

      {/* cama */}
      <group position={[-2.05, 0, -1.25]}>
        <Box p={[0, 0.2, 0]} s={[1.1, 0.25, 2.1]} m={mats.wood} />
        <Box p={[0, 0.45, -1.05]} s={[1.15, 0.9, 0.08]} m={mats.wood} />
        <Box p={[0, 0.4, 0]} s={[1.0, 0.16, 2.0]} m={mats.sheet} />
        <mesh position={[0, 0.53, -0.75]} scale={[0.4, 0.09, 0.2]} material={mats.sheet} castShadow>
          <sphereGeometry args={[1, 24, 16]} />
        </mesh>
        <mesh position={[0.02, 0.5, 0.25]} scale={[0.56, 0.1, 0.78]} material={mats.blanket} castShadow receiveShadow>
          <sphereGeometry args={[1, 32, 16]} />
        </mesh>
      </group>

      {/* estante na parede esquerda */}
      <group position={[W.x0 + 0.17, 0, 0.6]}>
        <Box p={[0, 1.0, 0]} s={[0.32, 2.0, 1.2]} m={mats.dark} />
        {[0.45, 0.95, 1.45].map((y, i) => (
          <Books key={i} p={[0.12, y, -0.55]} n={18} seed={10 + i} rotY={-Math.PI / 2} />
        ))}
      </group>

      {/* mesa com livros e luminária */}
      <group>
        <Box p={[1.7, 0.74, -1.62]} s={[1.3, 0.05, 0.62]} m={mats.wood} />
        {[
          [1.1, -1.37],
          [2.3, -1.37],
          [1.1, -1.88],
          [2.3, -1.88],
        ].map(([x, z], i) => (
          <Box key={i} p={[x, 0.36, z]} s={[0.05, 0.72, 0.05]} m={mats.dark} />
        ))}
        <Books p={[1.85, 0.765, -1.82]} n={9} seed={77} />
        {/* livro que vai pegar fogo */}
        <group position={BOOK.pos} rotation={[0, 0.25, 0]}>
          <mesh material={mats.book} castShadow receiveShadow>
            <boxGeometry args={[0.26, 0.05, 0.19]} />
          </mesh>
          <mesh position={[0.008, 0, 0]} material={mats.pages}>
            <boxGeometry args={[0.25, 0.04, 0.18]} />
          </mesh>
        </group>
        {/* copo d'água */}
        <mesh position={[1.2, 0.83, -1.75]} material={mats.glass}>
          <cylinderGeometry args={[0.035, 0.03, 0.13, 16]} />
        </mesh>
        {/* luminária */}
        <group position={[2.15, 0.765, -1.72]}>
          <mesh material={mats.lamp} castShadow>
            <cylinderGeometry args={[0.08, 0.09, 0.03, 16]} />
          </mesh>
          <mesh position={[0, 0.2, 0]} material={mats.lamp}>
            <cylinderGeometry args={[0.012, 0.012, 0.4, 8]} />
          </mesh>
          <mesh position={[-0.05, 0.4, 0]} rotation={[0, 0, 0.6]} material={mats.lamp} castShadow>
            <coneGeometry args={[0.09, 0.14, 16, 1, true]} />
          </mesh>
        </group>
      </group>
    </group>
  );
};

/** Iluminação base: sol entrando pela janela + preenchimento suave */
export const Lights: React.FC<{dim?: number}> = ({dim = 0}) => {
  const target = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(0.2, 0, 0.3);
    return o;
  }, []);
  const k = 1 - dim;
  return (
    <>
      <hemisphereLight args={["#ffe9d0", "#5a3a28", 0.6 * k + 0.12]} />
      <ambientLight intensity={0.15 * k + 0.03} color="#b9a6ff" />
      <primitive object={target} />
      <directionalLight
        position={[WIN.x + 1.2, 4.6, W.zBack - 3.2]}
        target={target}
        intensity={3.2 * k}
        color="#ffd9a0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
        shadow-camera-near={0.5}
        shadow-camera-far={16}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
      />
      {/* luz de preenchimento vinda da frente (rebote) */}
      <pointLight position={[0, 2.4, 2.6]} intensity={2.2 * k + 0.4} distance={8} decay={1.5} color="#ffe4cf" />
    </>
  );
};
