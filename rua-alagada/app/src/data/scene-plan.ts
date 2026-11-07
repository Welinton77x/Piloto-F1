// Contrato de dados da Fase 1 — roteiro v2 (AGUARDANDO APROVAÇÃO; v1 aprovada com pedido de mudanças). Derivado de roteiro.md.
// Mesmos tipos do projeto da F1 (vid/production/scene-plan.ts) para reaproveitar Overlay, badges e legendas.
export type Kind = "problem" | "solution" | "neutral" | "attention";
export type CamKey = { f: number; az: number; el: number; dist: number; target: [number, number, number]; atWord?: string; wordOffset?: number };
export type Anim = { target: string; unit: string; from: number | string; to: number | string; f0: number; f1: number; fn: "linear" | "easeInOut" | "easeOut" | "easeIn" | "spring" | "sin" | "seeded" };
export type Badge = { text: string; kind: Kind; f0: number; f1?: number; anchorWord?: string; untilWord?: string };
export type AudioCue = { id: string; f: number; kind: "sfx" | "music"; status: "planned" };
export type ScenePlan = {
  id: string; voKey: string; startFrame: number; durationInFrames: number; narration: string;
  camera: CamKey[]; objects: string[]; animations: Anim[]; badges: Badge[]; highlights: string[];
  captions: { mode: "one-phrase-at-a-time"; maxChars: 20; maxLines: 2; gapFrames: 4; status: "provisional" }; audioCues: AudioCue[];
};
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 3450; theme: "lowpoly-city-rain"; language: "pt-BR" };

export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 3450, theme: "lowpoly-city-rain", language: "pt-BR" };
// v2: uma fala por vez — blocos cortados nas pausas da fala, nunca dois blocos na tela.
const cap = { mode: "one-phrase-at-a-time", maxChars: 20, maxLines: 2, gapFrames: 4, status: "provisional" } as const;
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
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 210,
    narration: "Uma chuva forte, e a rua vira rio. Para onde essa água deveria ir?",
    camera: [{ f: 0, az: 22, el: 6, dist: 9, target: [-3.0, 0.75, 0.2] }, { f: 210, az: 10, el: 6, dist: 7.5, target: [-3.0, 0.75, 0.2] }],
    objects: ["street", "sidewalkL", "sidewalkR", "house", "mascot", "umbrella", "rain", "streetWater", "bottle"],
    animations: [
      { target: "streetWater.level", unit: "u3d", from: 0.35, to: 0.35, f0: 0, f1: 210, fn: "linear" },
      { target: "streetWater.ripple", unit: "u3d", from: 0, to: 0.02, f0: 0, f1: 210, fn: "sin" },
      { target: "rain.speed", unit: "u3d/f", from: 0.6, to: 0.6, f0: 0, f1: 210, fn: "seeded" },
      { target: "umbrella.rotZ", unit: "deg", from: 0, to: 25, f0: 51, f1: 76, fn: "spring" },
      { target: "bottle.x", unit: "u3d", from: -2, to: 1, f0: 0, f1: 210, fn: "linear" },
      { target: "camera.dist", unit: "u3d", from: 9, to: 7, f0: 0, f1: 210, fn: "easeOut" },
    ],
    badges: [{ text: "PRA ONDE VAI A ÁGUA?", kind: "attention", f0: 140, anchorWord: "onde" }], highlights: ["rio"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("rain-loop", 0), cue("wind-gust", 51), cue("pop-badge", 140)] },

  { id: "s2", voKey: "s2", startFrame: 210, durationInFrames: 285,
    narration: "Antes da cidade, o solo era terra e vegetação. Boa parte da chuva infiltrava pelos poros, como numa esponja.",
    camera: [{ f: 0, az: 8, el: 10, dist: 7, target: [0, 0, 0] }, { f: 71, az: 0, el: 10, dist: 30, target: [0, 0, 0] }, { f: 285, az: 6, el: 6, dist: 24, target: [0, -0.8, 0] }],
    objects: ["city", "terrain", "grass", "bushes", "trees", "soilSection", "infiltrationDrops", "rain", "labelSoil"],
    animations: [
      { target: "city.scaleY", unit: "x", from: 1, to: 0, f0: 12, f1: 59, fn: "easeInOut" },
      { target: "streetWater.level", unit: "u3d", from: 0.35, to: 0, f0: 12, f1: 59, fn: "linear" },
      { target: "grass.scale", unit: "x", from: 0, to: 1, f0: 48, f1: 95, fn: "spring" },
      { target: "infiltrationDrops.y", unit: "u3d", from: 0, to: -2.5, f0: 107, f1: 285, fn: "seeded" },
      { target: "soilSection.wetness", unit: "0-1", from: 0, to: 0.6, f0: 119, f1: 261, fn: "easeOut" },
    ],
    badges: [{ text: "INFILTRAÇÃO", kind: "neutral", f0: 150, anchorWord: "infiltrava" }], highlights: ["infiltrava", "poros", "esponja"], captions: cap,
    audioCues: [cue("rewind-whoosh", 0), cue("soft-soak", 119)] },

  { id: "s3", voKey: "s3", startFrame: 495, durationInFrames: 450,
    narration: "A cidade cobriu esse solo com asfalto, concreto e telhados: é a impermeabilização. No terreno natural, cerca de dez por cento da chuva escorre. Numa área quase toda impermeável, mais da metade.",
    camera: [{ f: 0, az: 0, el: 14, dist: 24, target: [-1, 0.5, 0] }, { f: 143, az: 15, el: 14, dist: 22, target: [-1, 0.5, 0] }, { f: 145, az: 15, el: 20, dist: 14, target: [0, 0.2, 0] }, { f: 261, az: 25, el: 20, dist: 14, target: [0, 0.2, 0] }, { f: 450, az: 30, el: 20, dist: 14, target: [0, 0.2, 0] }],
    objects: ["asphalt", "sidewalkL", "sidewalkR", "house", "roof", "gutterRoof", "downspout", "soilCaps", "rain", "runoff", "runoffArrows", "gaugeNatural", "gaugeCity"],
    animations: [
      { target: "asphalt.scaleY", unit: "x", from: 0, to: 1, f0: 13, f1: 39, fn: "spring" },
      { target: "sidewalk.scaleY", unit: "x", from: 0, to: 1, f0: 39, f1: 65, fn: "spring" },
      { target: "house.scaleY", unit: "x", from: 0, to: 1, f0: 65, f1: 98, fn: "spring" },
      { target: "infiltration.rate", unit: "0-1", from: 1, to: 0, f0: 78, f1: 143, fn: "linear" },
      { target: "soilCaps.opacity", unit: "0-1", from: 0, to: 1, f0: 91, f1: 130, fn: "easeOut" },
      { target: "runoff.flow", unit: "0-1", from: 0, to: 1, f0: 143, f1: 222, fn: "easeOut" },
      { target: "runoffArrows.scale", unit: "x", from: 0, to: 1, f0: 157, f1: 183, fn: "spring" },
      { target: "gaugeNatural.drops", unit: "gotas/10", from: 0, to: 1, f0: 274, f1: 326, fn: "easeOut" },
      { target: "gaugeCity.drops", unit: "gotas/10", from: 0, to: 5.5, f0: 352, f1: 430, fn: "easeOut" },
    ],
    badges: [
      { text: "IMPERMEABILIZAÇÃO", kind: "problem", f0: 124, anchorWord: "impermeabilização" },
      { text: "TERRA: 1 EM 10 ESCORRE", kind: "solution", f0: 274, anchorWord: "dez" },
      { text: "CIMENTO: MAIS DA METADE", kind: "problem", f0: 352, anchorWord: "metade" },
    ], highlights: ["asfalto", "concreto", "telhados", "impermeabilização", "dez por cento", "metade"], captions: cap,
    audioCues: [cue("build-pop", 13), cue("build-pop", 39), cue("build-pop", 65), cue("splash", 143), cue("drip-count", 274)] },

  { id: "s4", voKey: "s4", startFrame: 945, durationInFrames: 330,
    narration: "Por isso a rua tem caimento para as bordas. A água corre pela sarjeta até a boca de lobo, a entrada da drenagem.",
    camera: [{ f: 0, az: -25, el: 24, dist: 15, target: [0, 0.1, 0.3] }, { f: 142, az: -25, el: 24, dist: 13, target: [0, 0.1, 0.3] }, { f: 143, az: -30, el: 38, dist: 6.5, target: [2.4, 0, 0.6] }, { f: 330, az: -42, el: 38, dist: 6.5, target: [2.4, 0, 0.6] }],
    objects: ["street", "crownLine", "flowLines", "gutter", "inlet", "inletWaterfall", "labelSlope"],
    animations: [
      { target: "crownLine.opacity", unit: "0-1", from: 0, to: 1, f0: 0, f1: 39, fn: "easeOut" },
      { target: "flowLines.offset", unit: "u3d", from: 0, to: -3, f0: 26, f1: 330, fn: "linear" },
      { target: "gutter.glow", unit: "0-1", from: 0, to: 1, f0: 91, f1: 129, fn: "easeOut" },
      { target: "inletWaterfall.opacity", unit: "0-1", from: 0, to: 1, f0: 181, f1: 220, fn: "easeOut" },
    ],
    badges: [
      { text: "SARJETA", kind: "solution", f0: 97, anchorWord: "sarjeta" },
      { text: "BOCA DE LOBO", kind: "solution", f0: 259, anchorWord: "boca" },
    ], highlights: ["caimento", "sarjeta", "boca de lobo", "drenagem"], captions: cap,
    audioCues: [cue("trickle", 26), cue("gurgle-inlet", 181)] },

  { id: "s5", voKey: "s5", startFrame: 1275, durationInFrames: 210,
    narration: "Embaixo da rua, as galerias pluviais levam essa água até um córrego ou rio.",
    camera: [{ f: 0, az: -42, el: 38, dist: 6.5, target: [2.4, 0, 0.6] }, { f: 115, az: 0, el: 0, dist: 18, target: [4.4, -1.2, 0] }, { f: 210, az: 0, el: 0, dist: 18, target: [4.4, -1.2, 0] }],
    objects: ["galeria", "pipeWater", "pipeFlowArrows", "river", "galeriaOutlet", "labelRiver", "bgGradient"],
    animations: [
      { target: "camera.pose", unit: "spring(damping 200)", from: "inlet", to: "subsolo", f0: 0, f1: 115, fn: "spring" },
      { target: "bgGradient.mix", unit: "céu→azul profundo", from: 0, to: 1, f0: 0, f1: 76, fn: "easeInOut" },
      { target: "pipeWater.fill", unit: "0-1", from: 0, to: 0.3, f0: 38, f1: 127, fn: "easeOut" },
      { target: "pipeFlowArrows.offset", unit: "u3d", from: 0, to: 4, f0: 38, f1: 210, fn: "linear" },
      { target: "river.level", unit: "u3d (y)", from: -1.2, to: -1.0, f0: 115, f1: 210, fn: "easeOut" },
    ],
    badges: [{ text: "GALERIA PLUVIAL", kind: "solution", f0: 51, anchorWord: "galerias" }], highlights: ["galerias pluviais", "córrego", "rio"], captions: cap,
    audioCues: [cue("dive-whoosh", 0), cue("pipe-flow", 38)] },

  { id: "s6", voKey: "s6", startFrame: 1485, durationInFrames: 315,
    narration: "Primeiro problema: lixo e folhas obstruem a boca de lobo, e a água se acumula. Limpeza e descarte correto evitam isso.",
    camera: [{ f: 0, az: -35, el: 36, dist: 7, target: [2.3, 0.1, 0.5] }, { f: 166, az: -35, el: 36, dist: 7, target: [2.3, 0.1, 0.5] }, { f: 167, az: -20, el: 16, dist: 14, target: [0, 0.2, 0] }, { f: 243, az: -20, el: 16, dist: 14, target: [0, 0.2, 0] }, { f: 244, az: -25, el: 22, dist: 9, target: [1.4, 0.4, 0.4] }, { f: 315, az: -25, el: 22, dist: 9, target: [1.4, 0.4, 0.4] }],
    objects: ["trashBags", "leaves", "inlet", "inletWaterfall", "streetWater", "mascot", "trashBin", "bgGradient"],
    animations: [
      { target: "bgGradient.mix", unit: "azul profundo→céu", from: 1, to: 0, f0: 0, f1: 22, fn: "easeInOut" },
      { target: "trash.x", unit: "u3d (sarjeta→grade)", from: -1, to: 2.6, f0: 11, f1: 77, fn: "seeded" },
      { target: "inlet.blocked", unit: "0-1", from: 0, to: 1, f0: 66, f1: 111, fn: "linear" },
      { target: "inletWaterfall.opacity", unit: "0-1", from: 1, to: 0, f0: 66, f1: 111, fn: "linear" },
      { target: "streetWater.level", unit: "u3d", from: 0, to: 0.18, f0: 111, f1: 243, fn: "easeIn" },
      { target: "mascot.x", unit: "u3d", from: -3.0, to: 2.0, f0: 243, f1: 271, fn: "easeInOut" },
      { target: "trash.y", unit: "arco → lixeira", from: 0, to: 1, f0: 271, f1: 293, fn: "spring" },
      { target: "inlet.blocked", unit: "0-1", from: 1, to: 0, f0: 271, f1: 293, fn: "linear" },
      { target: "streetWater.level", unit: "u3d", from: 0.18, to: 0.05, f0: 282, f1: 315, fn: "easeOut" },
    ],
    badges: [
      { text: "BOCA DE LOBO OBSTRUÍDA", kind: "problem", f0: 105, anchorWord: "obstruem" },
      { text: "LIMPEZA + DESCARTE CORRETO", kind: "solution", f0: 254, anchorWord: "Limpeza" },
    ], highlights: ["lixo", "obstruem", "limpeza", "descarte correto"], captions: cap,
    audioCues: [cue("plastic-crinkle", 22), cue("water-rise", 111), cue("bin-drop", 287)] },

  { id: "s7", voKey: "s7", startFrame: 1800, durationInFrames: 375,
    narration: "Segundo: as galerias são dimensionadas para chuvas frequentes. Num temporal raro, a vazão supera a capacidade do tubo, e a água volta pela boca de lobo.",
    camera: [{ f: 0, az: 0, el: 8, dist: 46, target: [0, 2, 0] }, { f: 125, az: 0, el: 8, dist: 46, target: [0, 2, 0] }, { f: 126, az: 0, el: 4, dist: 18, target: [4, -1.2, 0] }, { f: 264, az: 8, el: 4, dist: 18, target: [4, -1.2, 0] }, { f: 265, az: 30, el: 15, dist: 10, target: [2, 0.3, 0.5] }, { f: 375, az: 30, el: 15, dist: 10, target: [2, 0.3, 0.5] }],
    objects: ["clouds", "sky", "rain", "lightning", "galeria", "pipeWater", "capacityBar", "inletGeyser", "streetWater"],
    animations: [
      { target: "rain.density", unit: "x", from: 1, to: 2, f0: 0, f1: 56, fn: "easeIn" },
      { target: "sky.darkness", unit: "0-1", from: 0, to: 0.7, f0: 0, f1: 56, fn: "easeInOut" },
      { target: "lightning.flash", unit: "0-1", from: 0.8, to: 0, f0: 49, f1: 61, fn: "linear" },
      { target: "pipeWater.fill", unit: "0-1", from: 0.3, to: 1, f0: 139, f1: 236, fn: "easeIn" },
      { target: "capacityBar.value", unit: "%", from: 30, to: 100, f0: 139, f1: 236, fn: "easeIn" },
      { target: "inletGeyser.height", unit: "u3d", from: 0, to: 0.5, f0: 264, f1: 299, fn: "spring" },
      { target: "streetWater.level", unit: "u3d", from: 0.05, to: 0.3, f0: 278, f1: 375, fn: "easeIn" },
    ],
    badges: [
      { text: "PROJETO: CHUVAS FREQUENTES", kind: "neutral", f0: 139, anchorWord: "frequentes" },
      { text: "VAZÃO > CAPACIDADE", kind: "problem", f0: 236, anchorWord: "supera" },
    ], highlights: ["dimensionadas", "chuvas frequentes", "vazão", "capacidade"], captions: cap,
    audioCues: [cue("thunder", 49), cue("heavy-rain", 0), cue("pipe-bubble", 167), cue("geyser-splash", 264)] },

  { id: "s8", voKey: "s8", startFrame: 2175, durationInFrames: 285,
    narration: "Terceiro: se o rio sobe acima da saída da galeria, a água não descarrega e fica retida na cidade.",
    camera: [{ f: 0, az: 0, el: 6, dist: 16, target: [5.6, -0.8, 0] }, { f: 165, az: 0, el: 6, dist: 16, target: [5.6, -0.8, 0] }, { f: 166, az: 0, el: 10, dist: 40, target: [0, 0, 0] }, { f: 285, az: 10, el: 10, dist: 40, target: [0, 0, 0] }],
    objects: ["river", "galeriaOutlet", "pipeFlowArrows", "outletArrow", "streetWater", "mascot", "stool"],
    animations: [
      { target: "river.level", unit: "u3d (y)", from: -1.0, to: 0.2, f0: 0, f1: 114, fn: "easeInOut" },
      { target: "pipeFlowArrows.speed", unit: "x", from: 1, to: 0, f0: 51, f1: 127, fn: "linear" },
      { target: "outletArrow.color", unit: "cor", from: "#4DD0FF", to: "#E53935", f0: 76, f1: 127, fn: "linear" },
      { target: "streetWater.level", unit: "u3d", from: 0.3, to: 0.4, f0: 152, f1: 285, fn: "easeInOut" },
      { target: "mascot.y", unit: "u3d", from: 0, to: 0.4, f0: 177, f1: 203, fn: "spring" },
    ],
    badges: [
      { text: "NÍVEL DO RIO ALTO", kind: "problem", f0: 60, anchorWord: "sobe" },
      { text: "SEM DESCARGA", kind: "problem", f0: 203, anchorWord: "descarrega" },
    ], highlights: ["saída da galeria", "descarrega", "retida"], captions: cap,
    audioCues: [cue("river-rush", 0), cue("flow-stop", 76)] },

  { id: "s9", voKey: "s9", startFrame: 2460, durationInFrames: 360,
    narration: "Por isso existem os reservatórios de detenção, os piscinões. Eles guardam o excesso no pico da chuva e devolvem aos poucos, reduzindo a vazão máxima.",
    camera: [{ f: 0, az: 0, el: 6, dist: 20, target: [4.6, -3.4, 0] }, { f: 360, az: 10, el: 6, dist: 18, target: [4.6, -3.4, 0] }],
    objects: ["reservoir", "weir", "weirFlow", "outletPipe", "river", "streetWater", "levelRuler", "clockIcon", "reservoirLabel", "hydrograph"],
    animations: [
      { target: "reservoir.scaleY", unit: "x", from: 0, to: 1, f0: 60, f1: 100, fn: "spring" },
      { target: "weirFlow.opacity", unit: "0-1", from: 0, to: 1, f0: 100, f1: 130, fn: "easeOut" },
      { target: "reservoir.fill", unit: "0-1", from: 0, to: 0.85, f0: 80, f1: 224, fn: "easeOut" },
      { target: "streetWater.level", unit: "u3d", from: 0.4, to: 0, f0: 96, f1: 240, fn: "easeOut" },
      { target: "river.level", unit: "u3d (y)", from: 0.2, to: -0.6, f0: 144, f1: 320, fn: "easeInOut" },
      { target: "reservoir.fill", unit: "0-1", from: 0.85, to: 0.6, f0: 240, f1: 360, fn: "linear" },
      { target: "outletPipe.flow", unit: "0-1", from: 0, to: 0.3, f0: 240, f1: 360, fn: "easeOut" },
      { target: "hydrograph.curveWithout", unit: "0-1 (desenho)", from: 0, to: 1, f0: 250, f1: 290, fn: "easeOut" },
      { target: "hydrograph.curveWith", unit: "0-1 (desenho)", from: 0, to: 1, f0: 280, f1: 330, fn: "easeOut" },
      { target: "clockIcon.rot", unit: "deg", from: 0, to: 360, f0: 240, f1: 360, fn: "linear" },
    ],
    badges: [{ text: "RESERVATÓRIO DE DETENÇÃO", kind: "solution", f0: 80, anchorWord: "detenção" }, { text: "PICO REDUZIDO", kind: "solution", f0: 300, anchorWord: "máxima" }], highlights: ["reservatórios de detenção", "piscinões", "pico", "vazão máxima"], captions: cap,
    audioCues: [cue("reservoir-thud", 16), cue("waterfall", 64), cue("slow-drain", 240)] },

  { id: "s10", voKey: "s10", startFrame: 2820, durationInFrames: 210,
    narration: "E dá para recuperar a infiltração: pavimento permeável, jardim de chuva e telhado verde.",
    camera: [{ f: 0, az: 10, el: 22, dist: 20, target: [-1.5, 0.3, 0] }, { f: 210, az: 25, el: 22, dist: 16, target: [-1.5, 0.3, 0] }],
    objects: ["permeableSidewalk", "rainGarden", "downspout", "greenRoof", "infiltrationDrops", "soilSection"],
    animations: [
      { target: "sidewalk.permeable", unit: "0-1", from: 0, to: 1, f0: 43, f1: 65, fn: "spring" },
      { target: "rainGarden.scaleY", unit: "x", from: 0, to: 1, f0: 97, f1: 118, fn: "spring" },
      { target: "downspout.redirect", unit: "0-1", from: 0, to: 1, f0: 108, f1: 129, fn: "easeInOut" },
      { target: "roof.green", unit: "0-1", from: 0, to: 1, f0: 151, f1: 172, fn: "spring" },
      { target: "soilSection.wetness", unit: "0-1", from: 0, to: 0.5, f0: 65, f1: 210, fn: "easeOut" },
    ],
    badges: [
      { text: "PAVIMENTO PERMEÁVEL", kind: "solution", f0: 43, f1: 172, anchorWord: "pavimento" },
      { text: "JARDIM DE CHUVA", kind: "solution", f0: 102, f1: 172, anchorWord: "jardim" },
      { text: "TELHADO VERDE", kind: "solution", f0: 151, f1: 172, anchorWord: "telhado" },
      { text: "INFILTRAÇÃO DE VOLTA", kind: "solution", f0: 172 },
    ], highlights: ["infiltração", "pavimento permeável", "jardim de chuva", "telhado verde"], captions: cap,
    audioCues: [cue("pop-badge", 43), cue("pop-badge", 102), cue("pop-badge", 151)] },

  { id: "s11", voKey: "s11", startFrame: 3030, durationInFrames: 420,
    narration: "Resumindo: a rua alaga quando chega mais água do que o solo infiltra e a drenagem escoa. Parabéns, agora você sabe para onde a água da chuva vai. Se você sabia, comente chuva. Se não sabia, comente alagado. E segue o Por Dentro Lab e manda para um amigo que ainda acha que a água da chuva vai pro céu de novo.",
    camera: [{ f: 0, az: 0, el: 8, dist: 48, target: [1.5, -0.8, 0] }, { f: 216, az: 10, el: 8, dist: 44, target: [1.5, -0.8, 0], atWord: "Parabéns", wordOffset: -6 }, { f: 217, az: 0, el: 4, dist: 7.8, target: [-3.0, 0.75, 0], atWord: "Parabéns", wordOffset: -5 }, { f: 420, az: 5, el: 4, dist: 7.4, target: [-3.0, 0.75, 0] }],
    objects: ["world", "flowArrowsAll", "inflowBar", "outflowBar", "mascot", "umbrella", "wordmark", "iconComment", "iconShare", "bgBrand"],
    animations: [
      { target: "flowArrowsAll.opacity", unit: "0-1", from: 0, to: 1, f0: 13, f1: 76, fn: "easeOut" },
      { target: "inflowBar.value", unit: "0-1", from: 0, to: 1, f0: 76, f1: 178, fn: "easeOut" },
      { target: "outflowBar.value", unit: "0-1", from: 0, to: 0.9, f0: 76, f1: 178, fn: "easeOut" },
      { target: "umbrella.close", unit: "0-1", from: 0, to: 1, f0: 216, f1: 248, fn: "spring" },
      { target: "arm.rotZ", unit: "deg", from: -25, to: 25, f0: 242, f1: 420, fn: "sin" },
      { target: "wordmark.scale", unit: "x", from: 0, to: 1, f0: 318, f1: 344, fn: "spring" },
      { target: "iconComment.scale", unit: "x", from: 1, to: 1.15, f0: 274, f1: 305, fn: "sin" },
    ],
    badges: [
      { text: "CHUVA > INFILTRA + ESCOA", kind: "neutral", f0: 115, anchorWord: "escoa", untilWord: "Parabéns" },
      { text: "SABIA? COMENTE CHUVA", kind: "solution", f0: 300, anchorWord: "sabia", untilWord: "segue" },
      { text: "NÃO SABIA? COMENTE ALAGADO", kind: "attention", f0: 380, anchorWord: "não", untilWord: "segue" },
    ], highlights: ["infiltra", "escoa", "Parabéns", "chuva", "alagado", "Por Dentro Lab", "amigo", "céu"], captions: cap,
    audioCues: [cue("system-flow", 0), cue("pop-badge", 242), cue("music-out", 382, "music")] },
];

// Verificação de integridade (executar na Fase 2 ao importar):
// contíguo a partir de 0 e soma = config.durationInFrames (3450).
export const checkPlan = () => {
  let t = 0;
  for (const s of scenes) { if (s.startFrame !== t) throw new Error(`lacuna/sobreposição em ${s.id}`); t += s.durationInFrames; }
  if (t !== config.durationInFrames) throw new Error(`soma ${t} ≠ ${config.durationInFrames}`);
  return true;
};
