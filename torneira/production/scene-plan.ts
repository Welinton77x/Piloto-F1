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
    narration: "Você abre a sua torneira e sai água. Mas você já se perguntou de onde vem a água que sai da sua torneira?",
    camera: [{ f: 0, az: 15, el: 6, dist: 4, target: [10.5, 1.2, 0] }, { f: 210, az: 5, el: 6, dist: 3.4, target: [10.5, 1.2, 0] }],
    objects: ["house", "sink", "faucet", "glass", "mascot", "wallPipe"],
    animations: [
      { target: "faucet.handle", unit: "deg", from: 0, to: 70, f0: 10, f1: 30, fn: "spring" },
      { target: "tapStream.opacity", unit: "0-1", from: 0, to: 1, f0: 25, f1: 35, fn: "linear" },
      { target: "glass.fill", unit: "0-1", from: 0, to: 0.8, f0: 35, f1: 120, fn: "easeOut" },
      { target: "wallPipe.glow", unit: "0-1", from: 0, to: 1, f0: 140, f1: 210, fn: "sin" },
    ],
    badges: [{ text: "DE ONDE VEM?", kind: "attention", f0: 60, anchorWord: "perguntou" }], highlights: ["torneira", "onde"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("faucet-open", 10), cue("water-glass", 30), cue("pop-badge", 150)] },

  { id: "s2", voKey: "s2", startFrame: 210, durationInFrames: 240,
    narration: "Tudo começa num rio ou numa represa. Agora imagina beber essa água direto de lá. Ela tem terra, folhas e micróbios que você nem enxerga. Resultado: dor de barriga, diarreia e vômito. Por isso ela não pode ir direto pra sua casa.",
    camera: [{ f: 0, az: 5, el: 6, dist: 3.4, target: [10.5, 1.2, 0] }, { f: 60, az: 10, el: 18, dist: 16, target: [-11.5, 0, 0] }, { f: 150, az: 10, el: 18, dist: 16, target: [-11.5, 0, 0] }, { f: 151, az: 0, el: 10, dist: 4, target: [-11, -0.3, 0.5] }, { f: 240, az: 6, el: 10, dist: 4, target: [-11, -0.3, 0.5] }],
    objects: ["lake", "shore", "trees", "leaves", "dirtParticles", "lens2D", "microbes2D"],
    animations: [
      { target: "camera.travel", unit: "spring", from: 0, to: 1, f0: 0, f1: 60, fn: "spring" },
      { target: "dirt.particles", unit: "seeded", from: 0, to: 1, f0: 60, f1: 240, fn: "seeded" },
      { target: "lens.scale", unit: "x", from: 0, to: 1, f0: 160, f1: 175, fn: "spring" },
    ],
    badges: [{ text: "ÁGUA BRUTA", kind: "problem", f0: 120, anchorWord: "terra" }, { text: "DOR DE BARRIGA, DIARREIA E VÔMITO", kind: "problem", f0: 170, anchorWord: "Resultado" }], highlights: ["rio", "represa", "micróbios"], captions: cap,
    audioCues: [cue("whoosh-pipe", 0), cue("water-ambience", 60)] },

  { id: "s3", voKey: "s3", startFrame: 450, durationInFrames: 210,
    narration: "Primeiro, bombas gigantes puxam essa água e mandam por canos enormes, as adutoras, até um lugar especial: a estação de tratamento.",
    camera: [{ f: 0, az: 0, el: 10, dist: 12, target: [-7.5, -0.3, 0] }, { f: 60, az: 0, el: 10, dist: 12, target: [-7.5, -0.3, 0] }, { f: 210, az: 8, el: 12, dist: 14, target: [-5, 0, 0] }],
    objects: ["intakeGrate", "pump", "adutora", "flowArrows"],
    animations: [
      { target: "pump.rotor", unit: "deg/f", from: 0, to: 12, f0: 20, f1: 40, fn: "easeIn" },
      { target: "adutora.fill", unit: "0-1", from: 0, to: 1, f0: 30, f1: 120, fn: "easeOut" },
      { target: "flowArrows.offset", unit: "u3d", from: 0, to: 4, f0: 30, f1: 210, fn: "linear" },
    ],
    badges: [{ text: "ADUTORA", kind: "solution", f0: 90, anchorWord: "adutoras" }, { text: "ESTAÇÃO DE TRATAMENTO", kind: "neutral", f0: 150, anchorWord: "estação" }], highlights: ["bombas", "adutoras", "estação de tratamento"], captions: cap,
    audioCues: [cue("pump-hum", 20), cue("gurgle", 40)] },

  { id: "s4", voKey: "s4", startFrame: 660, durationInFrames: 240,
    narration: "Só que tem um problema: a sujeira mais fininha não afunda sozinha. Ela fica boiando e deixa a água turva. Aí entra um produto que faz essas partículas grudarem umas nas outras, virando bolinhas maiores. Isso se chama coagulação e floculação.",
    camera: [{ f: 0, az: 20, el: 22, dist: 7, target: [-4.5, 0.2, 0] }, { f: 240, az: 26, el: 22, dist: 6.5, target: [-4.2, 0.2, 0] }],
    objects: ["mixTank", "doser", "particles", "flocculator", "paddles", "flocs"],
    animations: [
      { target: "doser.drip", unit: "0-1", from: 0, to: 1, f0: 0, f1: 60, fn: "linear" },
      { target: "particles.cluster", unit: "0-1", from: 0, to: 1, f0: 60, f1: 200, fn: "easeInOut" },
      { target: "flocs.scale", unit: "x", from: 0, to: 1, f0: 120, f1: 220, fn: "easeOut" },
    ],
    badges: [{ text: "ÁGUA TURVA", kind: "problem", f0: 80, anchorWord: "turva" }, { text: "COAGULAÇÃO", kind: "solution", f0: 150, anchorWord: "coagulação" }, { text: "FLOCULAÇÃO", kind: "solution", f0: 200, anchorWord: "floculação" }], highlights: ["flocos", "coagulação", "floculação"], captions: cap,
    audioCues: [cue("drip", 10), cue("swirl", 60)] },

  { id: "s5", voKey: "s5", startFrame: 900, durationInFrames: 180,
    narration: "Essas bolinhas, os flocos, ficam pesadas e afundam devagar até o fundo do tanque. A água de cima fica muito mais clara. Isso é a decantação.",
    camera: [{ f: 0, az: 0, el: 8, dist: 7, target: [-2, -0.3, 0] }, { f: 180, az: 6, el: 8, dist: 6.5, target: [-2, -0.3, 0] }],
    objects: ["decanter", "flocs", "sludge"],
    animations: [
      { target: "flocs.y", unit: "u3d", from: 0, to: -1.2, f0: 0, f1: 140, fn: "easeIn" },
      { target: "sludge.height", unit: "u3d", from: 0, to: 0.25, f0: 60, f1: 170, fn: "easeOut" },
      { target: "water.clarity", unit: "0-1", from: 0, to: 1, f0: 80, f1: 180, fn: "easeInOut" },
    ],
    badges: [{ text: "DECANTAÇÃO", kind: "solution", f0: 130, anchorWord: "decantação" }], highlights: ["pesados", "afundam", "decantação"], captions: cap,
    audioCues: [cue("plop", 30)] },

  { id: "s6", voKey: "s6", startFrame: 1080, durationInFrames: 165,
    narration: "Mas ainda sobra sujeira. Então a água passa por camadas de areia e cascalho, tipo uma peneira gigante. O que sobrou fica preso ali. Isso é a filtração.",
    camera: [{ f: 0, az: 0, el: 6, dist: 6, target: [-0.35, -0.5, 0] }, { f: 165, az: -6, el: 6, dist: 5.6, target: [-0.35, -0.5, 0] }],
    objects: ["filter", "sandLayer", "gravelLayer", "drops", "trappedDirt"],
    animations: [
      { target: "drops.y", unit: "seeded", from: 0, to: 1, f0: 0, f1: 165, fn: "seeded" },
      { target: "trappedDirt.opacity", unit: "0-1", from: 0, to: 1, f0: 40, f1: 120, fn: "easeOut" },
    ],
    badges: [{ text: "AINDA SOBRA SUJEIRA", kind: "attention", f0: 10, anchorWord: "sobra" }, { text: "FILTRAÇÃO", kind: "solution", f0: 120, anchorWord: "filtração" }], highlights: ["areia", "cascalho", "filtração"], captions: cap,
    audioCues: [cue("drip", 20)] },

  { id: "s7", voKey: "s7", startFrame: 1245, durationInFrames: 300,
    narration: "Parece limpa, né? Só que alguns micróbios são tão pequenos que passam até pelo filtro. Aí entra o cloro. Ele mata esses germes e continua protegendo a água pelo caminho todo até a sua casa. É por isso que às vezes a água tem aquele cheirinho de piscina.",
    camera: [{ f: 0, az: 0, el: 6, dist: 5, target: [-0.35, -0.6, 0] }, { f: 110, az: 0, el: 6, dist: 5, target: [-0.35, -0.6, 0] }, { f: 111, az: 10, el: 12, dist: 6, target: [0.9, 0, 0] }, { f: 300, az: 14, el: 12, dist: 8, target: [1.2, 0, 0] }],
    objects: ["microbes2D", "chlorineDoser", "contactTank", "residualGlow", "labelFluor"],
    animations: [
      { target: "microbes.y", unit: "u3d", from: 0, to: -1, f0: 0, f1: 100, fn: "linear" },
      { target: "chlorine.drip", unit: "0-1", from: 0, to: 1, f0: 120, f1: 200, fn: "linear" },
      { target: "microbes.pop", unit: "x", from: 1, to: 0, f0: 150, f1: 200, fn: "easeIn" },
      { target: "residualGlow.opacity", unit: "0-1", from: 0, to: 1, f0: 220, f1: 300, fn: "easeOut" },
    ],
    badges: [{ text: "MICRÓBIOS PASSAM", kind: "problem", f0: 40, anchorWord: "passam" }, { text: "CLORO", kind: "solution", f0: 140, anchorWord: "cloro" }, { text: "CHEIRINHO DE PISCINA = CLORO", kind: "neutral", f0: 250, anchorWord: "piscina" }], highlights: ["micróbios", "cloro", "germes", "protege"], captions: cap,
    audioCues: [cue("drip", 120), cue("pop-microbe", 160)] },

  { id: "s8", voKey: "s8", startFrame: 1545, durationInFrames: 270,
    narration: "Agora a água limpa é bombeada pra reservatórios no alto. E aqui vem o truque: lá de cima, a própria gravidade empurra a água com força pelos canos da cidade.",
    camera: [{ f: 0, az: 5, el: 12, dist: 14, target: [3.5, 2.5, 0] }, { f: 140, az: 5, el: 12, dist: 14, target: [3.5, 2.5, 0] }, { f: 270, az: 8, el: 14, dist: 20, target: [5.5, 1.5, 0] }],
    objects: ["hill", "tower", "riserPipe", "downPipe", "upArrows", "downArrows", "pressureGauge2D"],
    animations: [
      { target: "rise.fill", unit: "0-1", from: 0, to: 1, f0: 20, f1: 120, fn: "easeOut" },
      { target: "tower.fill", unit: "0-1", from: 0.2, to: 0.8, f0: 60, f1: 150, fn: "easeOut" },
      { target: "downArrows.opacity", unit: "0-1", from: 0, to: 1, f0: 150, f1: 190, fn: "easeOut" },
      { target: "pressureGauge.value", unit: "0-1", from: 0, to: 1, f0: 180, f1: 260, fn: "easeOut" },
    ],
    badges: [{ text: "RESERVATÓRIO", kind: "neutral", f0: 40, anchorWord: "reservatórios" }, { text: "GRAVIDADE = PRESSÃO", kind: "solution", f0: 180, anchorWord: "gravidade" }], highlights: ["reservatórios", "alto", "gravidade", "pressão", "rede"], captions: cap,
    audioCues: [cue("pump-hum", 10), cue("gurgle", 150)] },

  { id: "s9", voKey: "s9", startFrame: 1815, durationInFrames: 240,
    narration: "Debaixo da rua, ela entra no cano da sua casa e passa pelo hidrômetro, aquele relógio que mede quanto você gasta. É ele que define a sua conta de água. Depois, ela sobe até a caixa d'água.",
    camera: [{ f: 0, az: 0, el: 8, dist: 9, target: [8.5, 0, 0] }, { f: 240, az: 6, el: 8, dist: 7, target: [10, 2.5, 0] }],
    objects: ["streetMain", "branchPipe", "meter", "riser", "roofTank", "mascot"],
    animations: [
      { target: "mainFlow.offset", unit: "u3d", from: 0, to: 3, f0: 0, f1: 240, fn: "linear" },
      { target: "meter.dial", unit: "deg", from: 0, to: 720, f0: 60, f1: 240, fn: "linear" },
      { target: "riser.fill", unit: "0-1", from: 0, to: 1, f0: 100, f1: 200, fn: "easeOut" },
      { target: "roofTank.fill", unit: "0-1", from: 0.3, to: 0.7, f0: 150, f1: 240, fn: "easeOut" },
    ],
    badges: [{ text: "HIDRÔMETRO", kind: "neutral", f0: 70, anchorWord: "hidrômetro" }, { text: "DEFINE A SUA CONTA", kind: "attention", f0: 140, anchorWord: "conta" }, { text: "CAIXA D'ÁGUA", kind: "solution", f0: 190, anchorWord: "caixa" }], highlights: ["rua", "hidrômetro", "caixa d'água"], captions: cap,
    audioCues: [cue("meter-tick", 60)] },

  { id: "s10", voKey: "s10", startFrame: 2055, durationInFrames: 210,
    narration: "A caixa guarda uma reserva pra quando falta água na rua. E fica a dica: limpe a sua caixa d'água a cada seis meses. Se ela ficar suja, todo aquele tratamento vai pro ralo.",
    camera: [{ f: 0, az: 10, el: 10, dist: 6, target: [10.5, 2, 0] }, { f: 210, az: 6, el: 8, dist: 4, target: [10.5, 1.2, 0] }],
    objects: ["roofTank", "downPipe", "faucet", "glass", "mascot"],
    animations: [
      { target: "houseDown.offset", unit: "u3d", from: 0, to: 2, f0: 20, f1: 150, fn: "linear" },
      { target: "tapStream.opacity", unit: "0-1", from: 0, to: 1, f0: 140, f1: 160, fn: "linear" },
      { target: "glass.fill", unit: "0-1", from: 0, to: 0.8, f0: 150, f1: 200, fn: "easeOut" },
    ],
    badges: [{ text: "RESERVA EM CASA", kind: "solution", f0: 40, anchorWord: "reserva" }, { text: "DICA: LIMPE A CADA 6 MESES", kind: "attention", f0: 100, anchorWord: "dica" }], highlights: ["reserva", "gravidade", "torneira"], captions: cap,
    audioCues: [cue("water-glass", 150)] },

  { id: "s11", voKey: "s11", startFrame: 2265, durationInFrames: 645,
    narration: "Resumindo: represa, tratamento, reservatório, rede, caixa d'água e torneira. Parabéns, agora você sabe de onde vem a água da sua torneira! Você já limpou a sua caixa d'água? Comenta aí e segue o Por Dentro Lab pra descobrir mais coisas por dentro.",
    camera: [{ f: 0, az: 0, el: 12, dist: 34, target: [-1, 1, 0] }, { f: 199, az: 6, el: 12, dist: 32, target: [-1, 1, 0], atWord: "Agora", wordOffset: -6 }, { f: 200, az: 0, el: 4, dist: 7.6, target: [10.2, 1.3, 0.4], atWord: "Agora", wordOffset: -5 }, { f: 645, az: 5, el: 4, dist: 7.2, target: [10.2, 1.3, 0.4] }],
    objects: ["world", "flowHighlight", "mascot", "confetti2D", "hearts2D", "wordmark"],
    animations: [
      { target: "flowHighlight.stage", unit: "etapa 0-6", from: 0, to: 6, f0: 10, f1: 190, fn: "linear" },
    ],
    badges: [{ text: "REPRESA → TORNEIRA", kind: "neutral", f0: 10, anchorWord: "Resumindo", untilWord: "agora" }, { text: "AGORA VOCÊ SABE!", kind: "solution", f0: 200, anchorWord: "agora", untilWord: "limpou" }], highlights: ["represa", "tratamento", "reservatório", "rede", "caixa", "torneira", "TORNEIRA", "REPRESA", "Por Dentro Lab"], captions: cap,
    audioCues: [cue("system-flow", 0), cue("celebrate", 200), cue("music-out", 615, "music")] },
];

export const checkPlan = () => {
  let t = 0;
  for (const s of scenes) { if (s.startFrame !== t) throw new Error(`lacuna/sobreposição em ${s.id}`); t += s.durationInFrames; }
  if (t !== config.durationInFrames) throw new Error(`soma ${t} ≠ ${config.durationInFrames}`);
  return true;
};
