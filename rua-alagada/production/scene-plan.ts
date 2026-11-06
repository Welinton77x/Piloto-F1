// Contrato de dados da Fase 1 — roteiro v1 (AGUARDANDO APROVAÇÃO). Derivado de roteiro.md.
// Mesmos tipos do projeto da F1 (vid/production/scene-plan.ts) para reaproveitar Overlay, badges e legendas.
export type Kind = "problem" | "solution" | "neutral" | "attention";
export type CamKey = { f: number; az: number; el: number; dist: number; target: [number, number, number] };
export type Anim = { target: string; unit: string; from: number | string; to: number | string; f0: number; f1: number; fn: "linear" | "easeInOut" | "easeOut" | "easeIn" | "spring" | "sin" | "seeded" };
export type Badge = { text: string; kind: Kind; f0: number; f1?: number; anchorWord?: string };
export type AudioCue = { id: string; f: number; kind: "sfx" | "music"; status: "planned" };
export type ScenePlan = {
  id: string; voKey: string; startFrame: number; durationInFrames: number; narration: string;
  camera: CamKey[]; objects: string[]; animations: Anim[]; badges: Badge[]; highlights: string[];
  captions: { mode: "auto-from-narration"; maxChars: 17; status: "provisional" }; audioCues: AudioCue[];
};
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 2700; theme: "lowpoly-city-rain"; language: "pt-BR" };

export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 2700, theme: "lowpoly-city-rain", language: "pt-BR" };
const cap = { mode: "auto-from-narration", maxChars: 17, status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

// Layout fixo do diorama (u3d, esquemático). Corte no plano XY, face cortada em z = +1.
export const layout = {
  house: { x: -5.3, w: 2, h: 2 }, downspoutX: -4.2,
  sidewalkL: [-3.5, -2.5], street: [-2.5, 2.5], streetCrownY: 0.1, inlet: { x: 2.6, z: 0.6 },
  sidewalkR: [2.6, 3.6], green: [3.6, 6.2], river: { x: [6.2, 7.8], bedY: -1.4 },
  galeria: { from: [2.6, -1.0], to: [6.2, -1.3], diameter: 0.8 },
  reservoir: { x: [3.8, 6.0], y: [-3.6, -1.9] }, mascotX: -3.0, cloudsY: [7, 9], rainCount: 300,
} as const;

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 165,
    narration: "Choveu forte e a sua rua virou rio. Pra onde essa água deveria ir?",
    camera: [{ f: 0, az: 20, el: 4, dist: 9, target: [-1.4, 0.6, 0] }, { f: 165, az: 8, el: 4, dist: 7, target: [-1.4, 0.6, 0] }],
    objects: ["street", "sidewalkL", "sidewalkR", "house", "mascot", "umbrella", "rain", "streetWater", "bottle"],
    animations: [
      { target: "streetWater.level", unit: "u3d", from: 0.35, to: 0.35, f0: 0, f1: 165, fn: "linear" },
      { target: "streetWater.ripple", unit: "u3d", from: 0, to: 0.02, f0: 0, f1: 165, fn: "sin" },
      { target: "rain.speed", unit: "u3d/f", from: 0.6, to: 0.6, f0: 0, f1: 165, fn: "seeded" },
      { target: "umbrella.rotZ", unit: "deg", from: 0, to: 25, f0: 40, f1: 60, fn: "spring" },
      { target: "bottle.x", unit: "u3d", from: -2, to: 1, f0: 0, f1: 165, fn: "linear" },
      { target: "camera.dist", unit: "u3d", from: 9, to: 7, f0: 0, f1: 165, fn: "easeOut" },
    ],
    badges: [{ text: "PRA ONDE VAI A ÁGUA?", kind: "attention", f0: 110, anchorWord: "onde" }], highlights: ["rio"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("rain-loop", 0), cue("wind-gust", 40), cue("pop-badge", 110)] },

  { id: "s2", voKey: "s2", startFrame: 165, durationInFrames: 240,
    narration: "Antes da cidade, o chão era terra e mato. A chuva caía e o solo bebia boa parte, como uma esponja.",
    camera: [{ f: 0, az: 8, el: 10, dist: 7, target: [0, 0, 0] }, { f: 60, az: 0, el: 10, dist: 30, target: [0, 0, 0] }, { f: 240, az: 6, el: 6, dist: 24, target: [0, -0.8, 0] }],
    objects: ["city", "terrain", "grass", "bushes", "trees", "soilSection", "infiltrationDrops", "rain", "labelSoil"],
    animations: [
      { target: "city.scaleY", unit: "x", from: 1, to: 0, f0: 10, f1: 50, fn: "easeInOut" },
      { target: "streetWater.level", unit: "u3d", from: 0.35, to: 0, f0: 10, f1: 50, fn: "linear" },
      { target: "grass.scale", unit: "x", from: 0, to: 1, f0: 40, f1: 80, fn: "spring" },
      { target: "infiltrationDrops.y", unit: "u3d", from: 0, to: -2.5, f0: 90, f1: 240, fn: "seeded" },
      { target: "soilSection.wetness", unit: "0-1", from: 0, to: 0.6, f0: 100, f1: 220, fn: "easeOut" },
    ],
    badges: [{ text: "SOLO = ESPONJA", kind: "neutral", f0: 175, anchorWord: "esponja" }], highlights: ["terra", "esponja"], captions: cap,
    audioCues: [cue("rewind-whoosh", 0), cue("soft-soak", 100)] },

  { id: "s3", voKey: "s3", startFrame: 405, durationInFrames: 345,
    narration: "Só que a gente cobriu tudo: asfalto, calçada, telhado. A água não entra. No terreno natural, só uma em cada dez gotas escorre. Com quase tudo cimentado, passa da metade.",
    camera: [{ f: 0, az: 0, el: 14, dist: 24, target: [-1, 0.5, 0] }, { f: 110, az: 15, el: 14, dist: 22, target: [-1, 0.5, 0] }, { f: 111, az: 15, el: 20, dist: 14, target: [0, 0.2, 0] }, { f: 200, az: 25, el: 20, dist: 14, target: [0, 0.2, 0] }, { f: 345, az: 30, el: 20, dist: 14, target: [0, 0.2, 0] }],
    objects: ["asphalt", "sidewalkL", "sidewalkR", "house", "roof", "gutterRoof", "downspout", "soilCaps", "rain", "runoff", "runoffArrows", "gaugeNatural", "gaugeCity"],
    animations: [
      { target: "asphalt.scaleY", unit: "x", from: 0, to: 1, f0: 10, f1: 30, fn: "spring" },
      { target: "sidewalk.scaleY", unit: "x", from: 0, to: 1, f0: 30, f1: 50, fn: "spring" },
      { target: "house.scaleY", unit: "x", from: 0, to: 1, f0: 50, f1: 75, fn: "spring" },
      { target: "infiltration.rate", unit: "0-1", from: 1, to: 0, f0: 60, f1: 110, fn: "linear" },
      { target: "soilCaps.opacity", unit: "0-1", from: 0, to: 1, f0: 70, f1: 100, fn: "easeOut" },
      { target: "runoff.flow", unit: "0-1", from: 0, to: 1, f0: 110, f1: 170, fn: "easeOut" },
      { target: "runoffArrows.scale", unit: "x", from: 0, to: 1, f0: 120, f1: 140, fn: "spring" },
      { target: "gaugeNatural.drops", unit: "gotas/10", from: 0, to: 1, f0: 210, f1: 250, fn: "easeOut" },
      { target: "gaugeCity.drops", unit: "gotas/10", from: 0, to: 5.5, f0: 270, f1: 330, fn: "easeOut" },
    ],
    badges: [
      { text: "IMPERMEABILIZAÇÃO", kind: "problem", f0: 95, anchorWord: "entra" },
      { text: "TERRA: 1 EM 10 ESCORRE", kind: "solution", f0: 210, anchorWord: "dez" },
      { text: "CIMENTO: MAIS DA METADE", kind: "problem", f0: 270, anchorWord: "metade" },
    ], highlights: ["asfalto", "calçada", "telhado", "dez", "metade"], captions: cap,
    audioCues: [cue("build-pop", 10), cue("build-pop", 30), cue("build-pop", 50), cue("splash", 110), cue("drip-count", 210)] },

  { id: "s4", voKey: "s4", startFrame: 750, durationInFrames: 255,
    narration: "Então a rua é inclinada: a água corre pra beirada, a sarjeta, e cai num buraco com grade, a boca de lobo.",
    camera: [{ f: 0, az: 35, el: 22, dist: 14, target: [0, 0.1, 0.3] }, { f: 110, az: 35, el: 22, dist: 12, target: [0, 0.1, 0.3] }, { f: 111, az: 35, el: 18, dist: 6, target: [2.6, 0, 0.6] }, { f: 255, az: 50, el: 18, dist: 6, target: [2.6, 0, 0.6] }],
    objects: ["street", "crownLine", "flowLines", "gutter", "inlet", "inletWaterfall", "labelSlope"],
    animations: [
      { target: "crownLine.opacity", unit: "0-1", from: 0, to: 1, f0: 0, f1: 30, fn: "easeOut" },
      { target: "flowLines.offset", unit: "u3d", from: 0, to: -3, f0: 20, f1: 255, fn: "linear" },
      { target: "gutter.glow", unit: "0-1", from: 0, to: 1, f0: 70, f1: 100, fn: "easeOut" },
      { target: "inletWaterfall.opacity", unit: "0-1", from: 0, to: 1, f0: 140, f1: 170, fn: "easeOut" },
    ],
    badges: [
      { text: "SARJETA", kind: "solution", f0: 75, anchorWord: "sarjeta" },
      { text: "BOCA DE LOBO", kind: "solution", f0: 200, anchorWord: "boca" },
    ], highlights: ["inclinada", "sarjeta", "boca de lobo"], captions: cap,
    audioCues: [cue("trickle", 20), cue("gurgle-inlet", 140)] },

  { id: "s5", voKey: "s5", startFrame: 1005, durationInFrames: 165,
    narration: "Lá embaixo, canos grandes, as galerias, levam tudo até o rio mais próximo.",
    camera: [{ f: 0, az: 50, el: 18, dist: 6, target: [2.6, 0, 0.6] }, { f: 90, az: 0, el: 0, dist: 18, target: [4.4, -1.2, 0] }, { f: 165, az: 0, el: 0, dist: 18, target: [4.4, -1.2, 0] }],
    objects: ["galeria", "pipeWater", "pipeFlowArrows", "river", "galeriaOutlet", "labelRiver", "bgGradient"],
    animations: [
      { target: "camera.pose", unit: "spring(damping 200)", from: "inlet", to: "subsolo", f0: 0, f1: 90, fn: "spring" },
      { target: "bgGradient.mix", unit: "céu→azul profundo", from: 0, to: 1, f0: 0, f1: 60, fn: "easeInOut" },
      { target: "pipeWater.fill", unit: "0-1", from: 0, to: 0.3, f0: 30, f1: 100, fn: "easeOut" },
      { target: "pipeFlowArrows.offset", unit: "u3d", from: 0, to: 4, f0: 30, f1: 165, fn: "linear" },
      { target: "river.level", unit: "u3d (y)", from: -1.2, to: -1.0, f0: 90, f1: 165, fn: "easeOut" },
    ],
    badges: [{ text: "GALERIA", kind: "solution", f0: 40, anchorWord: "galerias" }], highlights: ["galerias", "rio"], captions: cap,
    audioCues: [cue("dive-whoosh", 0), cue("pipe-flow", 30)] },

  { id: "s6", voKey: "s6", startFrame: 1170, durationInFrames: 285,
    narration: "Mas aí vem o lixo: saco plástico e folha tampam a boca de lobo, e a água fica na rua. Lixo no lixo já ajuda.",
    camera: [{ f: 0, az: 40, el: 25, dist: 7, target: [2.4, 0.1, 0.5] }, { f: 150, az: 40, el: 25, dist: 7, target: [2.4, 0.1, 0.5] }, { f: 151, az: 25, el: 14, dist: 13, target: [0, 0.2, 0] }, { f: 220, az: 25, el: 14, dist: 13, target: [0, 0.2, 0] }, { f: 221, az: 30, el: 18, dist: 8, target: [1.8, 0.4, 0.4] }, { f: 285, az: 30, el: 18, dist: 8, target: [1.8, 0.4, 0.4] }],
    objects: ["trashBags", "leaves", "inlet", "inletWaterfall", "streetWater", "mascot", "trashBin", "bgGradient"],
    animations: [
      { target: "bgGradient.mix", unit: "azul profundo→céu", from: 1, to: 0, f0: 0, f1: 20, fn: "easeInOut" },
      { target: "trash.x", unit: "u3d (sarjeta→grade)", from: -1, to: 2.6, f0: 10, f1: 70, fn: "seeded" },
      { target: "inlet.blocked", unit: "0-1", from: 0, to: 1, f0: 60, f1: 100, fn: "linear" },
      { target: "inletWaterfall.opacity", unit: "0-1", from: 1, to: 0, f0: 60, f1: 100, fn: "linear" },
      { target: "streetWater.level", unit: "u3d", from: 0, to: 0.18, f0: 100, f1: 220, fn: "easeIn" },
      { target: "mascot.x", unit: "u3d", from: -3.0, to: 2.0, f0: 220, f1: 245, fn: "easeInOut" },
      { target: "trash.y", unit: "arco → lixeira", from: 0, to: 1, f0: 245, f1: 265, fn: "spring" },
      { target: "inlet.blocked", unit: "0-1", from: 1, to: 0, f0: 245, f1: 265, fn: "linear" },
      { target: "streetWater.level", unit: "u3d", from: 0.18, to: 0.05, f0: 255, f1: 285, fn: "easeOut" },
    ],
    badges: [
      { text: "BOCA DE LOBO ENTUPIDA", kind: "problem", f0: 95, anchorWord: "tampam" },
      { text: "LIXO NO LIXO", kind: "solution", f0: 230, anchorWord: "lixo" },
    ], highlights: ["lixo", "tampam", "lixo no lixo"], captions: cap,
    audioCues: [cue("plastic-crinkle", 20), cue("water-rise", 100), cue("bin-drop", 260)] },

  { id: "s7", voKey: "s7", startFrame: 1455, durationInFrames: 270,
    narration: "E tem chuva demais. A galeria é feita pras chuvas comuns. No temporal, o cano enche e a água volta pela boca de lobo.",
    camera: [{ f: 0, az: 0, el: 8, dist: 46, target: [0, 2, 0] }, { f: 90, az: 0, el: 8, dist: 46, target: [0, 2, 0] }, { f: 91, az: 0, el: 4, dist: 18, target: [4, -1.2, 0] }, { f: 190, az: 8, el: 4, dist: 18, target: [4, -1.2, 0] }, { f: 191, az: 30, el: 15, dist: 10, target: [2, 0.3, 0.5] }, { f: 270, az: 30, el: 15, dist: 10, target: [2, 0.3, 0.5] }],
    objects: ["clouds", "sky", "rain", "lightning", "galeria", "pipeWater", "capacityBar", "inletGeyser", "streetWater"],
    animations: [
      { target: "rain.density", unit: "x", from: 1, to: 2, f0: 0, f1: 40, fn: "easeIn" },
      { target: "sky.darkness", unit: "0-1", from: 0, to: 0.7, f0: 0, f1: 40, fn: "easeInOut" },
      { target: "lightning.flash", unit: "0-1", from: 0.8, to: 0, f0: 35, f1: 44, fn: "linear" },
      { target: "pipeWater.fill", unit: "0-1", from: 0.3, to: 1, f0: 100, f1: 170, fn: "easeIn" },
      { target: "capacityBar.value", unit: "%", from: 30, to: 100, f0: 100, f1: 170, fn: "easeIn" },
      { target: "inletGeyser.height", unit: "u3d", from: 0, to: 0.5, f0: 190, f1: 215, fn: "spring" },
      { target: "streetWater.level", unit: "u3d", from: 0.05, to: 0.3, f0: 200, f1: 270, fn: "easeIn" },
    ],
    badges: [
      { text: "FEITA PRA CHUVA COMUM", kind: "neutral", f0: 100, anchorWord: "comuns" },
      { text: "GALERIA CHEIA", kind: "problem", f0: 170, anchorWord: "enche" },
    ], highlights: ["demais", "comuns", "enche", "volta"], captions: cap,
    audioCues: [cue("thunder", 35), cue("heavy-rain", 0), cue("pipe-bubble", 120), cue("geyser-splash", 190)] },

  { id: "s8", voKey: "s8", startFrame: 1725, durationInFrames: 225,
    narration: "E se o rio já tá cheio, a galeria não tem onde despejar. A água fica presa na cidade.",
    camera: [{ f: 0, az: 0, el: 6, dist: 16, target: [5.6, -0.8, 0] }, { f: 130, az: 0, el: 6, dist: 16, target: [5.6, -0.8, 0] }, { f: 131, az: 0, el: 10, dist: 40, target: [0, 0, 0] }, { f: 225, az: 10, el: 10, dist: 40, target: [0, 0, 0] }],
    objects: ["river", "galeriaOutlet", "pipeFlowArrows", "outletArrow", "streetWater", "mascot", "stool"],
    animations: [
      { target: "river.level", unit: "u3d (y)", from: -1.0, to: 0.2, f0: 0, f1: 90, fn: "easeInOut" },
      { target: "pipeFlowArrows.speed", unit: "x", from: 1, to: 0, f0: 40, f1: 100, fn: "linear" },
      { target: "outletArrow.color", unit: "cor", from: "#4DD0FF", to: "#E53935", f0: 60, f1: 100, fn: "linear" },
      { target: "streetWater.level", unit: "u3d", from: 0.3, to: 0.4, f0: 120, f1: 225, fn: "easeInOut" },
      { target: "mascot.y", unit: "u3d", from: 0, to: 0.4, f0: 140, f1: 160, fn: "spring" },
    ],
    badges: [
      { text: "RIO CHEIO", kind: "problem", f0: 20, anchorWord: "cheio" },
      { text: "ÁGUA PRESA", kind: "problem", f0: 160, anchorWord: "presa" },
    ], highlights: ["rio", "cheio", "presa"], captions: cap,
    audioCues: [cue("river-rush", 0), cue("flow-stop", 60)] },

  { id: "s9", voKey: "s9", startFrame: 1950, durationInFrames: 225,
    narration: "Por isso existem os piscinões: reservatórios gigantes que guardam a água no pico da chuva e soltam devagar depois.",
    camera: [{ f: 0, az: 0, el: 6, dist: 20, target: [4.6, -2.0, 0] }, { f: 225, az: 10, el: 6, dist: 18, target: [4.6, -2.0, 0] }],
    objects: ["reservoir", "weir", "weirFlow", "outletPipe", "river", "streetWater", "levelRuler", "clockIcon", "reservoirLabel"],
    animations: [
      { target: "reservoir.scaleY", unit: "x", from: 0, to: 1, f0: 10, f1: 40, fn: "spring" },
      { target: "weirFlow.opacity", unit: "0-1", from: 0, to: 1, f0: 40, f1: 60, fn: "easeOut" },
      { target: "reservoir.fill", unit: "0-1", from: 0, to: 0.85, f0: 50, f1: 140, fn: "easeOut" },
      { target: "streetWater.level", unit: "u3d", from: 0.4, to: 0, f0: 60, f1: 150, fn: "easeOut" },
      { target: "river.level", unit: "u3d (y)", from: 0.2, to: -0.6, f0: 90, f1: 200, fn: "easeInOut" },
      { target: "reservoir.fill", unit: "0-1", from: 0.85, to: 0.6, f0: 150, f1: 225, fn: "linear" },
      { target: "outletPipe.flow", unit: "0-1", from: 0, to: 0.3, f0: 150, f1: 225, fn: "easeOut" },
      { target: "clockIcon.rot", unit: "deg", from: 0, to: 360, f0: 150, f1: 225, fn: "linear" },
    ],
    badges: [{ text: "PISCINÃO", kind: "solution", f0: 20, anchorWord: "piscinões" }], highlights: ["piscinões", "guardam", "devagar"], captions: cap,
    audioCues: [cue("reservoir-thud", 10), cue("waterfall", 40), cue("slow-drain", 150)] },

  { id: "s10", voKey: "s10", startFrame: 2175, durationInFrames: 195,
    narration: "E dá pra devolver a esponja: calçada que deixa a água passar, jardim de chuva, telhado verde.",
    camera: [{ f: 0, az: 10, el: 22, dist: 20, target: [-1.5, 0.3, 0] }, { f: 195, az: 25, el: 22, dist: 16, target: [-1.5, 0.3, 0] }],
    objects: ["permeableSidewalk", "rainGarden", "downspout", "greenRoof", "infiltrationDrops", "soilSection"],
    animations: [
      { target: "sidewalk.permeable", unit: "0-1", from: 0, to: 1, f0: 40, f1: 60, fn: "spring" },
      { target: "rainGarden.scaleY", unit: "x", from: 0, to: 1, f0: 90, f1: 110, fn: "spring" },
      { target: "downspout.redirect", unit: "0-1", from: 0, to: 1, f0: 100, f1: 120, fn: "easeInOut" },
      { target: "roof.green", unit: "0-1", from: 0, to: 1, f0: 140, f1: 160, fn: "spring" },
      { target: "soilSection.wetness", unit: "0-1", from: 0, to: 0.5, f0: 60, f1: 195, fn: "easeOut" },
    ],
    badges: [
      { text: "CALÇADA PERMEÁVEL", kind: "solution", f0: 40, f1: 160, anchorWord: "calçada" },
      { text: "JARDIM DE CHUVA", kind: "solution", f0: 95, f1: 160, anchorWord: "jardim" },
      { text: "TELHADO VERDE", kind: "solution", f0: 140, f1: 160, anchorWord: "telhado" },
      { text: "ESPONJA DE VOLTA", kind: "solution", f0: 160 },
    ], highlights: ["esponja", "calçada", "jardim de chuva", "telhado verde"], captions: cap,
    audioCues: [cue("pop-badge", 40), cue("pop-badge", 95), cue("pop-badge", 140)] },

  { id: "s11", voKey: "s11", startFrame: 2370, durationInFrames: 330,
    narration: "Agora você sabe: a rua alaga quando chega mais água do que o chão bebe e os canos levam. Sua rua alaga? Comenta aí e segue o Por Dentro Lab!",
    camera: [{ f: 0, az: 0, el: 8, dist: 46, target: [0, 0.5, 0] }, { f: 170, az: 12, el: 8, dist: 40, target: [0, 0.5, 0] }, { f: 171, az: 0, el: 4, dist: 7, target: [-3.0, 1.0, 0] }, { f: 330, az: 0, el: 4, dist: 7, target: [-3.0, 1.0, 0] }],
    objects: ["world", "flowArrowsAll", "inflowBar", "outflowBar", "mascot", "umbrella", "wordmark", "iconComment", "iconShare", "bgBrand"],
    animations: [
      { target: "flowArrowsAll.opacity", unit: "0-1", from: 0, to: 1, f0: 10, f1: 60, fn: "easeOut" },
      { target: "inflowBar.value", unit: "0-1", from: 0, to: 1, f0: 60, f1: 140, fn: "easeOut" },
      { target: "outflowBar.value", unit: "0-1", from: 0, to: 0.9, f0: 60, f1: 140, fn: "easeOut" },
      { target: "umbrella.close", unit: "0-1", from: 0, to: 1, f0: 170, f1: 195, fn: "spring" },
      { target: "arm.rotZ", unit: "deg", from: -25, to: 25, f0: 190, f1: 330, fn: "sin" },
      { target: "wordmark.scale", unit: "x", from: 0, to: 1, f0: 250, f1: 270, fn: "spring" },
      { target: "iconComment.scale", unit: "x", from: 1, to: 1.15, f0: 215, f1: 240, fn: "sin" },
    ],
    badges: [
      { text: "CHEGA > SAI = ALAGA", kind: "neutral", f0: 90, anchorWord: "bebe" },
      { text: "SUA RUA ALAGA?", kind: "attention", f0: 190, anchorWord: "alaga" },
    ], highlights: ["chega", "bebe", "levam", "Por Dentro Lab"], captions: cap,
    audioCues: [cue("system-flow", 0), cue("pop-badge", 190), cue("music-out", 300, "music")] },
];

// Verificação de integridade (executar na Fase 2 ao importar):
// contíguo a partir de 0 e soma = config.durationInFrames (2700).
export const checkPlan = () => {
  let t = 0;
  for (const s of scenes) { if (s.startFrame !== t) throw new Error(`lacuna/sobreposição em ${s.id}`); t += s.durationInFrames; }
  if (t !== config.durationInFrames) throw new Error(`soma ${t} ≠ ${config.durationInFrames}`);
  return true;
};
