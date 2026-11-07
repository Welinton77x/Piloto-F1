// Contrato de dados da Fase 1 — roteiro v1 (AGUARDANDO APROVAÇÃO). Derivado de roteiro.md.
// Mesmos tipos do vídeo 1 (rua-alagada) para reaproveitar o pipeline.
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
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 2910; theme: "smooth-3d-water-city"; language: "pt-BR" };

export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 2910, theme: "smooth-3d-water-city", language: "pt-BR" };
const cap = { mode: "one-phrase-at-a-time", maxChars: 20, maxLines: 2, gapFrames: 4, status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

// Layout do diorama (u3d, esquemático), da esquerda para a direita.
export const layout = {
  reservoirLake: [-14, -9], intake: -9.2, adutora: [-9, -6],
  eta: { mix: [-6, -4.5], floc: [-4.5, -3], decant: [-3, -1], filter: [-1, 0.3], chlorine: [0.3, 1.5] },
  hill: [2, 5], tower: { x: 3.5, top: 5 }, street: [5, 9], house: [9, 12], sink: [10.5, 1.2, 0],
} as const;

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 210,
    narration: "Você abre a torneira e a água sai limpa. Mas de onde ela vem?",
    camera: [{ f: 0, az: -6, el: 6, dist: 4.4, target: [9.75, 1.15, -0.8] }, { f: 210, az: -12, el: 6, dist: 4.0, target: [9.75, 1.15, -0.8] }],
    objects: ["house", "sink", "faucet", "glass", "mascot", "wallPipe"],
    animations: [
      { target: "faucet.handle", unit: "deg", from: 0, to: 70, f0: 10, f1: 30, fn: "spring" },
      { target: "tapStream.opacity", unit: "0-1", from: 0, to: 1, f0: 25, f1: 35, fn: "linear" },
      { target: "glass.fill", unit: "0-1", from: 0, to: 0.8, f0: 35, f1: 120, fn: "easeOut" },
      { target: "wallPipe.glow", unit: "0-1", from: 0, to: 1, f0: 140, f1: 210, fn: "sin" },
    ],
    badges: [{ text: "DE ONDE VEM?", kind: "attention", f0: 150, anchorWord: "onde" }], highlights: ["torneira", "onde"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("faucet-open", 10), cue("water-glass", 30), cue("pop-badge", 150)] },

  { id: "s2", voKey: "s2", startFrame: 210, durationInFrames: 240,
    narration: "Ela começa num rio ou numa represa. Só que essa água tem terra, folhas e micróbios invisíveis.",
    camera: [{ f: 0, az: 5, el: 6, dist: 3.4, target: [10.5, 1.2, 0] }, { f: 60, az: 10, el: 14, dist: 15, target: [-10.4, 0.4, 0] }, { f: 150, az: 10, el: 14, dist: 15, target: [-10.4, 0.4, 0] }, { f: 151, az: 0, el: 10, dist: 4, target: [-11, -0.3, 0.5] }, { f: 240, az: 6, el: 10, dist: 4, target: [-11, -0.3, 0.5] }],
    objects: ["lake", "shore", "trees", "leaves", "dirtParticles", "lens2D", "microbes2D"],
    animations: [
      { target: "camera.travel", unit: "spring", from: 0, to: 1, f0: 0, f1: 60, fn: "spring" },
      { target: "dirt.particles", unit: "seeded", from: 0, to: 1, f0: 60, f1: 240, fn: "seeded" },
      { target: "lens.scale", unit: "x", from: 0, to: 1, f0: 160, f1: 175, fn: "spring" },
    ],
    badges: [{ text: "ÁGUA BRUTA", kind: "problem", f0: 120, anchorWord: "terra" }], highlights: ["rio", "represa", "micróbios"], captions: cap,
    audioCues: [cue("whoosh-pipe", 0), cue("water-ambience", 60)] },

  { id: "s3", voKey: "s3", startFrame: 450, durationInFrames: 210,
    narration: "Bombas empurram essa água por canos grandes, as adutoras, até a estação de tratamento.",
    camera: [{ f: 0, az: 0, el: 8, dist: 10, target: [-7.9, -0.1, 0.5] }, { f: 60, az: 0, el: 8, dist: 10, target: [-7.9, -0.1, 0.5] }, { f: 210, az: 6, el: 10, dist: 11, target: [-6.3, 0.3, 0.5] }],
    objects: ["intakeGrate", "pump", "adutora", "flowArrows"],
    animations: [
      { target: "pump.rotor", unit: "deg/f", from: 0, to: 12, f0: 20, f1: 40, fn: "easeIn" },
      { target: "adutora.fill", unit: "0-1", from: 0, to: 1, f0: 30, f1: 120, fn: "easeOut" },
      { target: "flowArrows.offset", unit: "u3d", from: 0, to: 4, f0: 30, f1: 210, fn: "linear" },
    ],
    badges: [{ text: "ADUTORA", kind: "solution", f0: 90, anchorWord: "adutoras" }, { text: "ESTAÇÃO DE TRATAMENTO", kind: "neutral", f0: 150, anchorWord: "estação" }], highlights: ["bombas", "adutoras", "estação de tratamento"], captions: cap,
    audioCues: [cue("pump-hum", 20), cue("gurgle", 40)] },

  { id: "s4", voKey: "s4", startFrame: 660, durationInFrames: 240,
    narration: "Primeiro entra um produto que junta a sujeira fininha em flocos: é a coagulação e a floculação.",
    camera: [{ f: 0, az: 12, el: 14, dist: 6.5, target: [-4.5, 0.75, 0.3] }, { f: 240, az: 18, el: 14, dist: 6.0, target: [-4.3, 0.75, 0.3] }],
    objects: ["mixTank", "doser", "particles", "flocculator", "paddles", "flocs"],
    animations: [
      { target: "doser.drip", unit: "0-1", from: 0, to: 1, f0: 0, f1: 60, fn: "linear" },
      { target: "particles.cluster", unit: "0-1", from: 0, to: 1, f0: 60, f1: 200, fn: "easeInOut" },
      { target: "flocs.scale", unit: "x", from: 0, to: 1, f0: 120, f1: 220, fn: "easeOut" },
    ],
    badges: [{ text: "COAGULAÇÃO", kind: "solution", f0: 150, anchorWord: "coagulação" }, { text: "FLOCULAÇÃO", kind: "solution", f0: 200, anchorWord: "floculação" }], highlights: ["flocos", "coagulação", "floculação"], captions: cap,
    audioCues: [cue("drip", 10), cue("swirl", 60)] },

  { id: "s5", voKey: "s5", startFrame: 900, durationInFrames: 180,
    narration: "Os flocos são pesados e afundam no tanque. Isso é a decantação.",
    camera: [{ f: 0, az: 0, el: 8, dist: 5.6, target: [-2.0, 0.7, 0.3] }, { f: 180, az: 6, el: 8, dist: 5.2, target: [-2.0, 0.7, 0.3] }],
    objects: ["decanter", "flocs", "sludge"],
    animations: [
      { target: "flocs.y", unit: "u3d", from: 0, to: -1.2, f0: 0, f1: 140, fn: "easeIn" },
      { target: "sludge.height", unit: "u3d", from: 0, to: 0.25, f0: 60, f1: 170, fn: "easeOut" },
      { target: "water.clarity", unit: "0-1", from: 0, to: 1, f0: 80, f1: 180, fn: "easeInOut" },
    ],
    badges: [{ text: "DECANTAÇÃO", kind: "solution", f0: 130, anchorWord: "decantação" }], highlights: ["pesados", "afundam", "decantação"], captions: cap,
    audioCues: [cue("plop", 30)] },

  { id: "s6", voKey: "s6", startFrame: 1080, durationInFrames: 165,
    narration: "Depois, a água atravessa camadas de areia e cascalho: a filtração.",
    camera: [{ f: 0, az: 0, el: 6, dist: 4.8, target: [-0.35, 0.65, 0.4] }, { f: 165, az: -6, el: 6, dist: 4.5, target: [-0.35, 0.65, 0.4] }],
    objects: ["filter", "sandLayer", "gravelLayer", "drops", "trappedDirt"],
    animations: [
      { target: "drops.y", unit: "seeded", from: 0, to: 1, f0: 0, f1: 165, fn: "seeded" },
      { target: "trappedDirt.opacity", unit: "0-1", from: 0, to: 1, f0: 40, f1: 120, fn: "easeOut" },
    ],
    badges: [{ text: "FILTRAÇÃO", kind: "solution", f0: 120, anchorWord: "filtração" }], highlights: ["areia", "cascalho", "filtração"], captions: cap,
    audioCues: [cue("drip", 20)] },

  { id: "s7", voKey: "s7", startFrame: 1245, durationInFrames: 300,
    narration: "Mas micróbios passam pelo filtro. Então entra o cloro, que mata os germes e protege a água até a sua casa.",
    camera: [{ f: 0, az: 0, el: 6, dist: 4.6, target: [-0.35, 0.7, 0.4] }, { f: 110, az: 0, el: 6, dist: 4.6, target: [-0.35, 0.7, 0.4] }, { f: 111, az: 10, el: 10, dist: 5.6, target: [0.9, 0.8, 0.3] }, { f: 300, az: 14, el: 10, dist: 7.5, target: [1.4, 0.8, 0.3] }],
    objects: ["microbes2D", "chlorineDoser", "contactTank", "residualGlow", "labelFluor"],
    animations: [
      { target: "microbes.y", unit: "u3d", from: 0, to: -1, f0: 0, f1: 100, fn: "linear" },
      { target: "chlorine.drip", unit: "0-1", from: 0, to: 1, f0: 120, f1: 200, fn: "linear" },
      { target: "microbes.pop", unit: "x", from: 1, to: 0, f0: 150, f1: 200, fn: "easeIn" },
      { target: "residualGlow.opacity", unit: "0-1", from: 0, to: 1, f0: 220, f1: 300, fn: "easeOut" },
    ],
    badges: [{ text: "MICRÓBIOS PASSAM", kind: "problem", f0: 40, anchorWord: "passam" }, { text: "CLORO", kind: "solution", f0: 140, anchorWord: "cloro" }], highlights: ["micróbios", "cloro", "germes", "protege"], captions: cap,
    audioCues: [cue("drip", 120), cue("pop-microbe", 160)] },

  { id: "s8", voKey: "s8", startFrame: 1545, durationInFrames: 270,
    narration: "Daí ela sobe pra reservatórios no alto, e a gravidade cria a pressão que empurra a água pela rede.",
    camera: [{ f: 0, az: 5, el: 10, dist: 10, target: [3.0, 1.3, 0] }, { f: 140, az: 5, el: 10, dist: 10, target: [3.0, 1.3, 0] }, { f: 270, az: 8, el: 12, dist: 13, target: [4.0, 0.9, 0] }],
    objects: ["hill", "tower", "riserPipe", "downPipe", "upArrows", "downArrows", "pressureGauge2D"],
    animations: [
      { target: "rise.fill", unit: "0-1", from: 0, to: 1, f0: 20, f1: 120, fn: "easeOut" },
      { target: "tower.fill", unit: "0-1", from: 0.2, to: 0.8, f0: 60, f1: 150, fn: "easeOut" },
      { target: "downArrows.opacity", unit: "0-1", from: 0, to: 1, f0: 150, f1: 190, fn: "easeOut" },
      { target: "pressureGauge.value", unit: "0-1", from: 0, to: 1, f0: 180, f1: 260, fn: "easeOut" },
    ],
    badges: [{ text: "RESERVATÓRIO", kind: "neutral", f0: 40, anchorWord: "reservatórios" }, { text: "GRAVIDADE = PRESSÃO", kind: "solution", f0: 180, anchorWord: "pressão" }], highlights: ["reservatórios", "alto", "gravidade", "pressão", "rede"], captions: cap,
    audioCues: [cue("pump-hum", 10), cue("gurgle", 150)] },

  { id: "s9", voKey: "s9", startFrame: 1815, durationInFrames: 240,
    narration: "Debaixo da rua, ela passa pelo hidrômetro, o relógio da sua casa, e chega na caixa d'água.",
    camera: [{ f: 0, az: 0, el: 8, dist: 7, target: [8.4, 0.6, 0.3] }, { f: 240, az: 6, el: 8, dist: 6.5, target: [8.5, 0.8, 0.3] }],
    objects: ["streetMain", "branchPipe", "meter", "riser", "roofTank", "mascot"],
    animations: [
      { target: "mainFlow.offset", unit: "u3d", from: 0, to: 3, f0: 0, f1: 240, fn: "linear" },
      { target: "meter.dial", unit: "deg", from: 0, to: 720, f0: 60, f1: 240, fn: "linear" },
      { target: "riser.fill", unit: "0-1", from: 0, to: 1, f0: 100, f1: 200, fn: "easeOut" },
      { target: "roofTank.fill", unit: "0-1", from: 0.3, to: 0.7, f0: 150, f1: 240, fn: "easeOut" },
    ],
    badges: [{ text: "HIDRÔMETRO", kind: "neutral", f0: 70, anchorWord: "hidrômetro" }, { text: "CAIXA D'ÁGUA", kind: "solution", f0: 190, anchorWord: "caixa" }], highlights: ["rua", "hidrômetro", "caixa d'água"], captions: cap,
    audioCues: [cue("meter-tick", 60)] },

  { id: "s10", voKey: "s10", startFrame: 2055, durationInFrames: 210,
    narration: "A caixa guarda uma reserva, e a gravidade leva a água até a torneira.",
    camera: [{ f: 0, az: 10, el: 10, dist: 7, target: [10.5, 1.8, -0.8] }, { f: 210, az: -10, el: 6, dist: 4.2, target: [9.75, 1.15, -0.8] }],
    objects: ["roofTank", "downPipe", "faucet", "glass", "mascot"],
    animations: [
      { target: "houseDown.offset", unit: "u3d", from: 0, to: 2, f0: 20, f1: 150, fn: "linear" },
      { target: "tapStream.opacity", unit: "0-1", from: 0, to: 1, f0: 140, f1: 160, fn: "linear" },
      { target: "glass.fill", unit: "0-1", from: 0, to: 0.8, f0: 150, f1: 200, fn: "easeOut" },
    ],
    badges: [{ text: "RESERVA EM CASA", kind: "solution", f0: 40, anchorWord: "reserva" }], highlights: ["reserva", "gravidade", "torneira"], captions: cap,
    audioCues: [cue("water-glass", 150)] },

  { id: "s11", voKey: "s11", startFrame: 2265, durationInFrames: 645,
    narration: "Resumindo: represa, tratamento, reservatório, rede, caixa d'água e torneira. Agora você sabe de onde vem a água que sai na sua torneira! Se você já sabia, comente TORNEIRA. Se não sabia, comente REPRESA. E segue o Por Dentro Lab pra descobrir mais coisas por dentro.",
    camera: [{ f: 0, az: 4, el: 12, dist: 15, target: [-11.5, -0.3, 0] }, { f: 10, az: 4, el: 12, dist: 15, target: [-11.5, -0.3, 0], atWord: "represa", wordOffset: -8 }, { f: 11, az: 4, el: 12, dist: 15, target: [-11.5, -0.3, 0], atWord: "represa", wordOffset: 14 }, { f: 40, az: 4, el: 12, dist: 13, target: [-2.5, 0.7, 0], atWord: "tratamento", wordOffset: -8 }, { f: 41, az: 4, el: 12, dist: 13, target: [-2.5, 0.7, 0], atWord: "tratamento", wordOffset: 14 }, { f: 70, az: 4, el: 12, dist: 13, target: [3.4, 1.6, 0], atWord: "reservatório", wordOffset: -8 }, { f: 71, az: 4, el: 12, dist: 13, target: [3.4, 1.6, 0], atWord: "reservatório", wordOffset: 14 }, { f: 100, az: 4, el: 12, dist: 13, target: [7.2, -0.2, 0], atWord: "rede", wordOffset: -8 }, { f: 101, az: 4, el: 12, dist: 13, target: [7.2, -0.2, 0], atWord: "rede", wordOffset: 14 }, { f: 130, az: 4, el: 12, dist: 11, target: [10.6, 2.6, -0.6], atWord: "caixa", wordOffset: -8 }, { f: 131, az: 4, el: 12, dist: 11, target: [10.6, 2.6, -0.6], atWord: "caixa", wordOffset: 14 }, { f: 160, az: 4, el: 12, dist: 9, target: [10.3, 1.4, -1.6], atWord: "torneira", wordOffset: -8 }, { f: 161, az: 4, el: 12, dist: 9, target: [10.3, 1.4, -1.6], atWord: "torneira", wordOffset: 14 }, { f: 199, az: 4, el: 10, dist: 9, target: [10.3, 1.4, -1.6], atWord: "Agora", wordOffset: -6 }, { f: 200, az: 0, el: 4, dist: 4.8, target: [9.7, 1.15, -0.6], atWord: "Agora", wordOffset: -5 }, { f: 645, az: 5, el: 4, dist: 4.4, target: [9.7, 1.15, -0.6] }],
    objects: ["world", "flowHighlight", "mascot", "confetti2D", "hearts2D", "wordmark"],
    animations: [
      { target: "flowHighlight.stage", unit: "etapa 0-6", from: 0, to: 6, f0: 10, f1: 190, fn: "linear" },
    ],
    badges: [
      { text: "REPRESA → TORNEIRA", kind: "neutral", f0: 10, anchorWord: "Resumindo", untilWord: "Agora" },
      { text: "AGORA VOCÊ SABE!", kind: "solution", f0: 200, anchorWord: "Agora", untilWord: "sabia" },
      { text: "SABIA? COMENTE TORNEIRA", kind: "solution", f0: 240, anchorWord: "sabia", untilWord: "segue" },
      { text: "NÃO SABIA? COMENTE REPRESA", kind: "attention", f0: 300, anchorWord: "não", untilWord: "segue" },
    ], highlights: ["represa", "tratamento", "reservatório", "rede", "caixa", "torneira", "TORNEIRA", "REPRESA", "Por Dentro Lab"], captions: cap,
    audioCues: [cue("system-flow", 0), cue("celebrate", 200), cue("music-out", 615, "music")] },
];

export const checkPlan = () => {
  let t = 0;
  for (const s of scenes) { if (s.startFrame !== t) throw new Error(`lacuna/sobreposição em ${s.id}`); t += s.durationInFrames; }
  if (t !== config.durationInFrames) throw new Error(`soma ${t} ≠ ${config.durationInFrames}`);
  return true;
};
