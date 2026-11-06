// Contrato de dados da Fase 1 — roteiro v1 (AGUARDANDO APROVAÇÃO). Derivado de roteiro.md.
export type Kind = "problem" | "solution" | "neutral" | "attention";
export type CamKey = { f: number; az: number; el: number; dist: number; target: [number, number, number] };
export type Anim = { target: string; unit: string; from: number | string; to: number | string; f0: number; f1: number; fn: "linear" | "easeInOut" | "easeOut" | "spring" | "sin" | "seeded" };
export type Badge = { text: string; kind: Kind; f0: number; f1?: number; anchorWord?: string };
export type AudioCue = { id: string; f: number; kind: "sfx" | "music"; status: "planned" };
export type ScenePlan = {
  id: string; voKey: string; startFrame: number; durationInFrames: number; narration: string;
  camera: CamKey[]; objects: string[]; animations: Anim[]; badges: Badge[]; highlights: string[];
  captions: { mode: "auto-from-narration"; maxChars: 17; status: "provisional" }; audioCues: AudioCue[];
};
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 2940; theme: "lowpoly-f1"; language: "pt-BR" };

export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 2940, theme: "lowpoly-f1", language: "pt-BR" };
const cap = { mode: "auto-from-narration", maxChars: 17, status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 120,
    narration: "Por que o piloto de Fórmula 1 parece só ficar sentado?",
    camera: [{ f: 0, az: 15, el: 5, dist: 3.0, target: [0, 1, 0] }, { f: 120, az: 0, el: 5, dist: 2.6, target: [0, 1, 0] }],
    objects: ["driver", "helmet", "visor", "trackStripes", "titleCard"],
    animations: [
      { target: "camera.shake", unit: "u(0.012)", from: 0.012, to: 0.012, f0: 0, f1: 120, fn: "seeded" },
      { target: "camera.dist", unit: "u3d", from: 3.0, to: 2.6, f0: 0, f1: 120, fn: "easeOut" },
      { target: "trackStripes.x", unit: "u3d", from: 0, to: -12, f0: 0, f1: 120, fn: "linear" },
    ],
    badges: [{ text: "SÓ SENTADO?", kind: "attention", f0: 12, anchorWord: "sentado" }], highlights: ["sentado"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("pop-badge", 12)] },
  { id: "s2", voKey: "s2", startFrame: 120, durationInFrames: 210,
    narration: "Ele passa até duas horas numa caixinha quente, a mais de 300 quilômetros por hora. Vamos entender como funciona na prática!",
    camera: [{ f: 0, az: 35, el: 12, dist: 14, target: [0, 0.5, 0] }, { f: 40, az: 35, el: 12, dist: 14, target: [0, 0.5, 0] }, { f: 150, az: 10, el: 20, dist: 3.2, target: [0, 0.9, 0.3] }, { f: 210, az: 13, el: 20, dist: 3.2, target: [0, 0.9, 0.3] }],
    objects: ["car", "wheels", "halo", "driver", "heatParticles", "speedLines", "label300"],
    animations: [
      { target: "car.bodyOpacity", unit: "0-1", from: 1, to: 0.15, f0: 20, f1: 70, fn: "easeInOut" },
      { target: "camera.dist", unit: "u3d", from: 14, to: 3.2, f0: 40, f1: 150, fn: "spring" },
      { target: "heatParticles.y", unit: "u3d", from: 0, to: 1.2, f0: 40, f1: 210, fn: "seeded" },
      { target: "speedLines.opacity", unit: "0-1", from: 0.7, to: 0.25, f0: 40, f1: 90, fn: "linear" },
    ],
    badges: [{ text: "ATÉ 2 HORAS", kind: "neutral", f0: 100, anchorWord: "duas horas" }], highlights: ["duas horas", "300"], captions: cap,
    audioCues: [cue("whoosh-xray", 40)] },
  { id: "s3", voKey: "s3", startFrame: 330, durationInFrames: 360,
    narration: "Olha só: na curva, o corpo é empurrado para o lado com 4 a 6 vezes o peso dele! A cabeça com o capacete passa de 30 quilos, mais do que um botijão de gás cheio!",
    camera: [{ f: 0, az: 30, el: 15, dist: 10, target: [0, 1, 0.2] }, { f: 140, az: 60, el: 15, dist: 10, target: [0, 1, 0.2] }, { f: 150, az: 20, el: 8, dist: 3.0, target: [0, 1, 0.2] }, { f: 360, az: 25, el: 8, dist: 3.0, target: [0, 1, 0.2] }],
    objects: ["car", "driver", "head", "arrowLateral", "scale", "scaleDisplay", "gasCylinder", "labelG"],
    animations: [
      { target: "car.yaw", unit: "deg", from: 0, to: -35, f0: 0, f1: 140, fn: "linear" },
      { target: "head.tiltZ", unit: "deg", from: 0, to: 18, f0: 60, f1: 140, fn: "easeInOut" },
      { target: "arrowLateral.scale", unit: "u3d", from: 0, to: 2.0, f0: 70, f1: 100, fn: "spring" },
      { target: "scaleDisplay.value", unit: "kg", from: 6, to: 35, f0: 150, f1: 230, fn: "easeOut" },
      { target: "gasCylinder.y", unit: "u3d", from: 3, to: 0, f0: 220, f1: 250, fn: "spring" },
    ],
    badges: [{ text: "4 A 6 G", kind: "problem", f0: 40, anchorWord: "4" }, { text: "≈ 35 KG", kind: "problem", f0: 160 }], highlights: ["4 a 6", "30 quilos", "botijão"], captions: cap,
    audioCues: [cue("tire-squeal", 20), cue("thud-weight", 230)] },
  { id: "s4", voKey: "s4", startFrame: 690, durationInFrames: 300,
    narration: "Os músculos do pescoço funcionam como cordas: se ficam fracos, a cabeça cai para o lado. Por isso eles treinam puxando um elástico preso na cabeça, às vezes até com um capacete mais pesado!",
    camera: [{ f: 0, az: -20, el: 10, dist: 3.0, target: [0, 0.85, 0] }, { f: 40, az: -20, el: 10, dist: 2.2, target: [0, 0.85, 0] }, { f: 300, az: -5, el: 10, dist: 2.2, target: [0, 0.85, 0] }],
    objects: ["neck", "neckMuscles", "helmet", "elasticBand", "wallAnchor", "labelNeck"],
    animations: [
      { target: "neckMuscles.radius", unit: "u3d", from: 0.02, to: 0.045, f0: 170, f1: 230, fn: "easeInOut" },
      { target: "head.tiltZ", unit: "deg", from: 0, to: 14, f0: 60, f1: 110, fn: "easeInOut" },
      { target: "head.tiltZ", unit: "deg", from: 14, to: 0, f0: 200, f1: 240, fn: "easeInOut" },
      { target: "elasticBand.stretch", unit: "u3d", from: 0, to: 0.8, f0: 170, f1: 210, fn: "spring" },
      { target: "helmet.scale", unit: "x", from: 1, to: 1.08, f0: 220, f1: 250, fn: "easeInOut" },
    ],
    badges: [{ text: "ELÁSTICO + CAPACETE PESADO", kind: "solution", f0: 170, anchorWord: "elástico" }], highlights: ["cordas", "elástico", "capacete mais pesado"], captions: cap,
    audioCues: [cue("band-stretch", 170)] },
  { id: "s5", voKey: "s5", startFrame: 990, durationInFrames: 270,
    narration: "Parado, o coração bate cerca de 60 vezes por minuto. Na corrida, ele chega a 170 e fica assim por quase duas horas. É uma maratona... sentado!",
    camera: [{ f: 0, az: 0, el: 5, dist: 6, target: [0, 0, 0] }, { f: 270, az: 5, el: 5, dist: 6, target: [0, 0, 0] }],
    objects: ["heartCalm", "heartRacing", "bpmCounterL", "bpmCounterR", "stopwatch", "chairIcon"],
    animations: [
      { target: "heartRacing.bpm", unit: "bpm", from: 60, to: 170, f0: 60, f1: 170, fn: "easeInOut" },
      { target: "heartCalm.pulse", unit: "bpm", from: 60, to: 60, f0: 0, f1: 270, fn: "sin" },
      { target: "heartRacing.color", unit: "green→red", from: "green", to: "red", f0: 60, f1: 170, fn: "linear" },
      { target: "stopwatch.time", unit: "mm:ss", from: "0:00", to: "1:58", f0: 170, f1: 230, fn: "easeInOut" },
      { target: "chairIcon.rotZ", unit: "deg", from: -6, to: 6, f0: 235, f1: 265, fn: "sin" },
    ],
    badges: [{ text: "60 → 170+ BPM", kind: "problem", f0: 60 }], highlights: ["60", "170", "maratona"], captions: cap,
    audioCues: [cue("heartbeat-calm", 0), cue("heartbeat-accel", 60)] },
  { id: "s6", voKey: "s6", startFrame: 1260, durationInFrames: 270,
    narration: "Lá dentro é um forno! O piloto pode perder de 3 a 4 quilos de suor numa corrida: é como duas garrafas grandes de refrigerante.",
    camera: [{ f: 0, az: 10, el: 12, dist: 3.5, target: [0, 1, 0.2] }, { f: 100, az: 10, el: 12, dist: 4.5, target: [0, 1, 0.2] }, { f: 270, az: 14, el: 12, dist: 4.5, target: [0, 1, 0.2] }],
    objects: ["thermometer", "sweatDrops", "bottle1", "bottle2", "scaleDisplay", "steam"],
    animations: [
      { target: "thermometer.level", unit: "0-1", from: 0, to: 1, f0: 10, f1: 80, fn: "easeOut" },
      { target: "sweatDrops.y", unit: "u3d", from: 0.6, to: 0, f0: 70, f1: 270, fn: "seeded" },
      { target: "bottle1.liquid", unit: "0-1", from: 1, to: 0, f0: 110, f1: 170, fn: "linear" },
      { target: "bottle2.liquid", unit: "0-1", from: 1, to: 0, f0: 150, f1: 210, fn: "linear" },
      { target: "scaleDisplay.value", unit: "kg", from: 0, to: -4.0, f0: 110, f1: 220, fn: "easeOut" },
    ],
    badges: [{ text: "−3 A −4 KG", kind: "problem", f0: 130, anchorWord: "3" }], highlights: ["forno", "3 a 4 quilos", "duas garrafas"], captions: cap,
    audioCues: [cue("sizzle", 10), cue("drips", 70)] },
  { id: "s7", voKey: "s7", startFrame: 1530, durationInFrames: 360,
    narration: "O freio é muito duro: pesa mais de 100 quilos no pedal! E o corpo é jogado para a frente, com uns 5 G. O cinto segura, e a barriga ajuda a manter o tronco firme.",
    camera: [{ f: 0, az: 60, el: 10, dist: 2.0, target: [0, 0.2, 0.9] }, { f: 150, az: 90, el: 5, dist: 4, target: [0, 0.9, 0.3] }, { f: 270, az: 40, el: 8, dist: 2.6, target: [0, 0.9, 0.2] }, { f: 360, az: 40, el: 8, dist: 2.6, target: [0, 0.9, 0.2] }],
    objects: ["pedal", "foot", "forceGauge", "brakeDiscs", "arrowForward", "harness", "abdomen", "labelAbs"],
    animations: [
      { target: "pedal.depth", unit: "u3d", from: 0, to: 0.35, f0: 20, f1: 60, fn: "spring" },
      { target: "forceGauge.value", unit: "kg", from: 0, to: 110, f0: 20, f1: 70, fn: "easeOut" },
      { target: "brakeDiscs.emissive", unit: "0-1", from: 0, to: 1, f0: 30, f1: 90, fn: "easeInOut" },
      { target: "torso.leanX", unit: "deg", from: 0, to: 35, f0: 170, f1: 215, fn: "spring" },
      { target: "arrowForward.scale", unit: "u3d", from: 0, to: 1.8, f0: 175, f1: 200, fn: "spring" },
      { target: "harness.glow", unit: "0-1", from: 0, to: 1, f0: 250, f1: 275, fn: "easeInOut" },
      { target: "abdomen.emissive", unit: "0-1", from: 0, to: 1, f0: 285, f1: 340, fn: "sin" },
    ],
    badges: [{ text: "FREADA: ~5 G", kind: "problem", f0: 175, anchorWord: "5" }], highlights: ["100 quilos", "5 G", "cinto", "barriga"], captions: cap,
    audioCues: [cue("brake-thud", 40), cue("belt-click", 250)] },
  { id: "s8", voKey: "s8", startFrame: 1890, durationInFrames: 270,
    narration: "E tem a parte mais escondida: o cérebro! Ele decide em frações de segundo, com o corpo cansado e o coração bem acelerado.",
    camera: [{ f: 0, az: 0, el: 10, dist: 3, target: [0, 1.1, 0] }, { f: 270, az: -15, el: 10, dist: 3, target: [0, 1.1, 0] }],
    objects: ["brain", "brainLights24", "trackRibbons", "heartIcon", "energyBar"],
    animations: [
      { target: "brainLights.opacity", unit: "0-1", from: 0.15, to: 0.4, f0: 0, f1: 270, fn: "seeded" },
      { target: "trackRibbons.speed", unit: "u3d/frame", from: 0.5, to: 0.5, f0: 0, f1: 270, fn: "linear" },
      { target: "energyBar.value", unit: "0-1", from: 1, to: 0.3, f0: 80, f1: 200, fn: "linear" },
      { target: "heartIcon.pulse", unit: "bpm", from: 170, to: 170, f0: 0, f1: 270, fn: "sin" },
    ],
    badges: [{ text: "DECIDE NA HORA", kind: "neutral", f0: 60, anchorWord: "decide" }], highlights: ["cérebro", "frações de segundo"], captions: cap,
    audioCues: [cue("brain-ticks", 0)] },
  { id: "s9", voKey: "s9", startFrame: 2160, durationInFrames: 270,
    narration: "Por isso o treino imita a corrida: exercício longo para o coração, pescoço puxando elástico, e perna e barriga na academia.",
    camera: [{ f: 0, az: -10, el: 8, dist: 4, target: [0, 1, 0] }, { f: 90, az: 2, el: 8, dist: 4, target: [0, 1, 0] }, { f: 180, az: -6, el: 8, dist: 4.5, target: [0, 1, 0] }, { f: 270, az: 6, el: 8, dist: 4.5, target: [0, 1, 0] }],
    objects: ["trainee", "bench", "elasticBand", "treadmill", "bpmCounter", "barbell", "wipe"],
    animations: [
      { target: "cut.wipe", unit: "frames", from: 6, to: 6, f0: 87, f1: 93, fn: "linear" },
      { target: "cut.wipe", unit: "frames", from: 6, to: 6, f0: 177, f1: 183, fn: "linear" },
      { target: "elasticBand.stretch", unit: "u3d", from: 0.3, to: 0.8, f0: 0, f1: 90, fn: "sin" },
      { target: "bpmCounter.value", unit: "bpm", from: 170, to: 170, f0: 90, f1: 180, fn: "linear" },
      { target: "trainee.squatY", unit: "u3d", from: 0, to: 0.3, f0: 180, f1: 270, fn: "sin" },
    ],
    badges: [{ text: "TREINA DO TAMANHO DA CORRIDA", kind: "solution", f0: 20, anchorWord: "treino" }], highlights: ["treino", "cardio", "elástico", "academia"], captions: cap,
    audioCues: [cue("whoosh-cut1", 87), cue("whoosh-cut2", 177)] },
  { id: "s10", voKey: "s10", startFrame: 2430, durationInFrames: 240,
    narration: "Pescoço forte como uma mola, coração de maratonista e perna de aço. Sem isso, em poucas voltas o pescoço não aguentaria!",
    camera: [{ f: 0, az: 10, el: 8, dist: 4, target: [0, 1, 0] }, { f: 110, az: 10, el: 8, dist: 8, target: [0, 1.2, 0] }, { f: 240, az: 0, el: 6, dist: 4, target: [0, 1, 0] }],
    objects: ["giantSeat", "driverSmall", "neckSpring", "heart", "legsMetal", "sweatDrop"],
    animations: [
      { target: "giantSeat.scale", unit: "x", from: 2.2, to: 2.2, f0: 0, f1: 110, fn: "linear" },
      { target: "neck.scaleXZ", unit: "x", from: 1, to: 1.8, f0: 120, f1: 160, fn: "spring" },
      { target: "legs.metalness", unit: "0-1", from: 0, to: 1, f0: 160, f1: 200, fn: "easeInOut" },
      { target: "neckSpring.wobble", unit: "deg", from: -4, to: 4, f0: 0, f1: 240, fn: "sin" },
    ],
    badges: [{ text: "TUDO PARA NÃO PASSAR MAL", kind: "solution", f0: 130 }], highlights: ["mola", "maratonista", "aço", "não aguentaria"], captions: cap,
    audioCues: [cue("boing", 120), cue("metal-ping", 170)] },
  { id: "s11", voKey: "s11", startFrame: 2670, durationInFrames: 270,
    narration: "Agora você sabe por que o piloto de Fórmula 1 treina tanto! Você teria coragem de treinar assim? Comenta aqui e segue o Por Dentro Lab!",
    camera: [{ f: 0, az: 0, el: 4, dist: 4, target: [0, 1, 0] }, { f: 270, az: 0, el: 4, dist: 4, target: [0, 1, 0] }],
    objects: ["driver", "wavingArm", "wordmarkPlaceholder", "iconComment", "iconShare"],
    animations: [
      { target: "wavingArm.rotZ", unit: "deg", from: -25, to: 25, f0: 15, f1: 270, fn: "sin" },
      { target: "wordmark.scale", unit: "x", from: 0, to: 1, f0: 20, f1: 40, fn: "spring" },
      { target: "iconComment.scale", unit: "x", from: 1, to: 1.2, f0: 80, f1: 100, fn: "sin" },
    ],
    badges: [{ text: "COMENTA AÍ", kind: "attention", f0: 80, anchorWord: "comenta" }, { text: "E COMPARTILHA PARA UM AMIGO QUE SONHA EM SER UM PILOTO DE FÓRMULA 1", kind: "neutral", f0: 150 }], highlights: ["comenta", "Por Dentro Lab"], captions: cap,
    audioCues: [cue("pop-badge", 80), cue("music-out", 240, "music")] },
];

// Verificação de integridade (rodar ao importar): contíguo, começa em 0, soma = durationInFrames.
(() => {
  let t = 0;
  for (const s of scenes) { if (s.startFrame !== t) throw new Error(`gap em ${s.id}`); t += s.durationInFrames; }
  if (t !== config.durationInFrames) throw new Error(`soma ${t} != ${config.durationInFrames}`);
})();
