// Plano de cenas v1 — "Vai na padaria comprar um pão?" (AGUARDANDO APROVAÇÃO)
// Contrato de dados para a Fase 2 (vira src/data/scenes.ts). Frames globais a 30 fps, intervalos [início, fim).

export type VideoConfig = {
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  theme: "padaria";
  language: "pt-BR";
};

export type Vec3 = [number, number, number];
export type Mood = "feliz" | "surpreso" | "bravo" | "eureka" | "sereno";

export type CameraKey = {f: number; target: Vec3; radius: number; az: number; el: number; fov?: number}; // f = frame local, ângulos em graus
export type SceneObject = {id: string; kind: string; position?: Vec3; note?: string};
export type Animation = {target: string; from: number | string; to: number | string; unit: "u3d" | "deg" | "frac" | "kg" | "count" | "state"; f0: number; f1: number; fn: "linear" | "easeOut" | "spring" | "sine" | "set"};
export type Badge = {kind: "dica" | "pill" | "title" | "counter" | "fact" | "follow" | "fx"; tone?: "problem" | "solution" | "neutral" | "attention"; text: string; f: number; anchor?: string; out?: number};
export type AudioCue = {kind: "sfx" | "music"; name: string; f: number; status: "planned" | "made"};

export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: string | null;
  narration: string;
  camera: CameraKey[];
  objects: SceneObject[];
  animations: Animation[];
  badges: Badge[];
  highlights: string[]; // palavras da legenda em amarelo
  captions: "word-by-word"; // tempos reais só após alinhar com a voz
  audioCues: AudioCue[];
  moods: {prof: {f: number; mood: Mood}[]; baker?: {f: number; mood: Mood}[]};
};

export const videoConfig: VideoConfig = {width: 1080, height: 1920, fps: 30, durationInFrames: 1980, theme: "padaria", language: "pt-BR"};

export const tts = {provider: "elevenlabs", voiceName: "Will - Social media", voiceId: "r3KkFedJ4n8aabIZ0RFQ", model: "eleven_multilingual_v2", speed: 1.05} as const;

// Peças persistentes do cenário (ids estáveis em todas as cenas)
export const world: SceneObject[] = [
  {id: "shop", kind: "padaria", note: "piso azul-acinzentado, paredes claras, janelão com prédios"},
  {id: "counter", kind: "balcao", position: [0, 0, 0], note: "madeira marrom, faixa amarela 'PADARIA'"},
  {id: "display", kind: "vitrine", position: [-1.1, 1.6, 0.1]},
  {id: "basket", kind: "cesto", position: [0.5, 1.6, 0.2]},
  {id: "scale", kind: "balanca", position: [1.4, 1.6, 0.2]},
  {id: "priceTag", kind: "placa-preco", position: [0.2, 1.2, 0.95]},
  {id: "oven", kind: "forno", position: [-2.6, 0, -3]},
  {id: "shelves", kind: "prateleiras", position: [1.6, 0, -3.2]},
  {id: "prof", kind: "professor", position: [2.6, 0, 0.8]},
  {id: "baker", kind: "padeiro", position: [-0.4, 0, -1.1]},
];

export const scenes: ScenePlan[] = [
  {
    id: "s1", startFrame: 0, durationInFrames: 150, voKey: "s1",
    narration: "Vai na padaria comprar um pão? Então presta atenção nessas quatro dicas.",
    camera: [{f: 0, target: [0, 1.5, 0], radius: 26, az: 20, el: 28, fov: 24}, {f: 150, target: [0, 1.5, 0], radius: 22, az: 12, el: 28, fov: 24}],
    objects: [{id: "prof", kind: "professor"}, {id: "baker", kind: "padeiro"}, {id: "basket", kind: "cesto", note: "vazio"}],
    animations: [
      {target: "prof.x", from: 6, to: 2.6, unit: "u3d", f0: 0, f1: 75, fn: "easeOut"},
      {target: "prof.walk", from: 1, to: 0, unit: "frac", f0: 60, f1: 75, fn: "linear"},
    ],
    badges: [
      {kind: "title", text: "Vai na padaria|comprar um [pão]?", f: 0, out: 95},
      {kind: "counter", tone: "neutral", text: "4 DICAS", f: 100, anchor: "prof.head"},
    ],
    highlights: ["pão"], captions: "word-by-word",
    audioCues: [{kind: "music", name: "trilha-padaria", f: 0, status: "planned"}, {kind: "sfx", name: "pop", f: 100, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s2", startFrame: 150, durationInFrames: 90, voKey: "s2",
    narration: "Primeiro: descubra o horário da fornada.",
    camera: [{f: 0, target: [1.8, 2.8, 0.5], radius: 9, az: -25, el: 6}, {f: 90, target: [1.8, 2.8, 0.5], radius: 9, az: -18, el: 6}],
    objects: [{id: "oven", kind: "forno", note: "porta fechada, luz laranja fraca"}],
    animations: [{target: "prof.armR", from: "idle", to: "point", unit: "state", f0: 0, f1: 10, fn: "spring"}],
    badges: [{kind: "dica", text: "DICA 1", f: 0}],
    highlights: ["fornada"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "pop", f: 2, status: "planned"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s3", startFrame: 240, durationInFrames: 225, voKey: "s3",
    narration: "Chegou fora de hora, só sobrou o pão de ontem. Na hora certa, o pão sai quentinho, estalando.",
    camera: [{f: 0, target: [0, 1.8, 0], radius: 14, az: 15, el: 14}, {f: 225, target: [0, 1.8, 0], radius: 11, az: -10, el: 14}],
    objects: [
      {id: "breadOld", kind: "pao-velho", note: "2 pães murchos no cesto"},
      {id: "steam", kind: "particulas-vapor"},
      {id: "breadHot", kind: "paes-dourados", note: "12 unidades"},
      {id: "bulb", kind: "lampada"},
    ],
    animations: [
      {target: "breadOld.sag", from: 0, to: 0.4, unit: "frac", f0: 20, f1: 50, fn: "easeOut"},
      {target: "oven.door", from: 0, to: 80, unit: "deg", f0: 100, f1: 115, fn: "spring"},
      {target: "steam.y", from: 0, to: 2.5, unit: "u3d", f0: 105, f1: 160, fn: "linear"},
      {target: "breadHot.count", from: 0, to: 12, unit: "count", f0: 120, f1: 180, fn: "spring"},
    ],
    badges: [
      {kind: "pill", tone: "problem", text: "PÃO DE ONTEM", f: 10, anchor: "basket", out: 100},
      {kind: "fx", tone: "problem", text: "✖", f: 30, anchor: "basket", out: 100},
      {kind: "pill", tone: "solution", text: "QUENTINHO ✓", f: 130, anchor: "basket"},
    ],
    highlights: ["ontem", "quentinho"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "tsss", f: 102, status: "planned"}, {kind: "sfx", name: "pop", f: 130, status: "planned"}],
    moods: {prof: [{f: 0, mood: "bravo"}, {f: 105, mood: "eureka"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s4", startFrame: 465, durationInFrames: 135, voKey: "s4",
    narration: "Segundo: peça o seu ponto. Mais moreninho ou mais clarinho.",
    camera: [{f: 0, target: [-0.8, 1.7, 0.6], radius: 8, az: 5, el: 12}, {f: 135, target: [-0.8, 1.7, 0.6], radius: 8, az: 15, el: 12}],
    objects: [{id: "breadDark", kind: "pao-moreninho"}, {id: "breadLight", kind: "pao-clarinho"}],
    animations: [
      {target: "breadDark.lift", from: 0, to: 0.3, unit: "u3d", f0: 40, f1: 70, fn: "spring"},
      {target: "breadDark.spin", from: 0, to: 360, unit: "deg", f0: 40, f1: 70, fn: "easeOut"},
      {target: "breadLight.lift", from: 0, to: 0.3, unit: "u3d", f0: 80, f1: 110, fn: "spring"},
      {target: "breadLight.spin", from: 0, to: 360, unit: "deg", f0: 80, f1: 110, fn: "easeOut"},
    ],
    badges: [
      {kind: "dica", text: "DICA 2", f: 0},
      {kind: "pill", tone: "neutral", text: "MORENINHO", f: 40, anchor: "breadDark"},
      {kind: "pill", tone: "neutral", text: "CLARINHO", f: 80, anchor: "breadLight"},
    ],
    highlights: ["ponto"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "pop", f: 40, status: "planned"}, {kind: "sfx", name: "pop", f: 80, status: "planned"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s5", startFrame: 600, durationInFrames: 192, voKey: "s5",
    narration: "O padeiro escolhe um por um pra você. Ninguém precisa levar pão branquelo pra casa.",
    camera: [{f: 0, target: [-0.6, 2.2, -0.4], radius: 10, az: -10, el: 10}, {f: 192, target: [-0.6, 2.2, -0.4], radius: 10, az: 5, el: 10}],
    objects: [{id: "tongs", kind: "pegador"}, {id: "bag", kind: "saco-papel"}, {id: "breadPale", kind: "pao-branquelo", note: "único pão com rostinho triste"}],
    animations: [
      {target: "baker.reach", from: 0, to: 1, unit: "frac", f0: 10, f1: 110, fn: "sine"},
      {target: "breadPale.lift", from: 0, to: 0.5, unit: "u3d", f0: 120, f1: 135, fn: "spring"},
      {target: "breadPale.lift", from: 0.5, to: -0.1, unit: "u3d", f0: 150, f1: 165, fn: "spring"},
    ],
    badges: [{kind: "pill", tone: "problem", text: "BRANQUELO ✖", f: 125, anchor: "breadPale"}],
    highlights: ["branquelo"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "pop", f: 125, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 150, mood: "sereno"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s6", startFrame: 792, durationInFrames: 135, voKey: "s6",
    narration: "Terceiro: o pãozinho é vendido por peso, não por unidade.",
    camera: [{f: 0, target: [1.2, 1.9, 0.3], radius: 7, az: 20, el: 18}, {f: 135, target: [1.2, 1.9, 0.3], radius: 7, az: 8, el: 18}],
    objects: [{id: "scale", kind: "balanca"}, {id: "bag", kind: "saco-papel"}],
    animations: [
      {target: "bag.y", from: 3.2, to: 1.75, unit: "u3d", f0: 20, f1: 35, fn: "spring"},
      {target: "scale.display", from: 0, to: 0.52, unit: "kg", f0: 35, f1: 70, fn: "easeOut"},
    ],
    badges: [{kind: "dica", text: "DICA 3", f: 0}, {kind: "pill", tone: "neutral", text: "PESO, NÃO UNIDADE", f: 40, anchor: "scale"}],
    highlights: ["peso"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "plim", f: 70, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s7", startFrame: 927, durationInFrames: 180, voKey: "s7",
    narration: "Fato real: pela regra do Inmetro, o pão francês só pode ser vendido a peso,",
    camera: [{f: 0, target: [2.4, 2.4, 0.6], radius: 12, az: -5, el: 8}, {f: 180, target: [2.4, 2.4, 0.6], radius: 12, az: 5, el: 8}],
    objects: [{id: "stamp", kind: "carimbo", note: "ícone de balança, sem logotipo oficial"}, {id: "bulb", kind: "lampada"}],
    animations: [{target: "stamp.y", from: 8, to: 3.5, unit: "u3d", f0: 10, f1: 25, fn: "spring"}],
    badges: [{kind: "fact", tone: "attention", text: "FATO REAL · INMETRO", f: 5}],
    highlights: ["Inmetro", "peso"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "tum", f: 25, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 10, mood: "surpreso"}, {f: 90, mood: "eureka"}]},
  },
  {
    id: "s8", startFrame: 1107, durationInFrames: 117, voKey: "s8",
    narration: "com o preço do quilo bem à vista no balcão.",
    camera: [{f: 0, target: [0.2, 1.4, 0.9], radius: 7, az: 10, el: 10}, {f: 117, target: [0.2, 1.4, 0.9], radius: 7, az: -5, el: 10}],
    objects: [{id: "priceTag", kind: "placa-preco", note: "'PÃO FRANCÊS · R$ __/kg' (valor em branco)"}, {id: "arrow", kind: "seta-azul"}],
    animations: [
      {target: "priceTag.swing", from: 4, to: 0, unit: "deg", f0: 0, f1: 60, fn: "sine"},
      {target: "arrow.scale", from: 1, to: 1.15, unit: "frac", f0: 0, f1: 117, fn: "sine"},
      {target: "prof.armR", from: "idle", to: "point", unit: "state", f0: 5, f1: 15, fn: "spring"},
    ],
    badges: [{kind: "pill", tone: "neutral", text: "PREÇO DO KG À VISTA", f: 15, anchor: "priceTag"}],
    highlights: ["quilo"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "pop", f: 15, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s9", startFrame: 1224, durationInFrames: 156, voKey: "s9",
    narration: "Então, se pedir dez pães, quem decide o preço é a balança.",
    camera: [{f: 0, target: [0.8, 2.2, 0.4], radius: 12, az: -15, el: 12}, {f: 156, target: [0.8, 2.2, 0.4], radius: 9, az: 10, el: 12}],
    objects: [{id: "bagBig", kind: "saco-papel-grande"}, {id: "scale", kind: "balanca"}],
    animations: [
      {target: "prof.arms", from: "idle", to: "up", unit: "state", f0: 0, f1: 12, fn: "spring"},
      {target: "bagBig.count", from: 0, to: 10, unit: "count", f0: 15, f1: 75, fn: "linear"},
      {target: "scale.display", from: 0, to: 0.5, unit: "kg", f0: 80, f1: 110, fn: "easeOut"},
    ],
    badges: [
      {kind: "counter", tone: "neutral", text: "{n} PÃES", f: 15, anchor: "bagBig"},
      {kind: "pill", tone: "solution", text: "A BALANÇA DECIDE ✓", f: 90, anchor: "scale"},
    ],
    highlights: ["dez", "balança"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "plim", f: 110, status: "planned"}],
    moods: {prof: [{f: 0, mood: "eureka"}, {f: 80, mood: "feliz"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s10", startFrame: 1380, durationInFrames: 114, voKey: "s10",
    narration: "Quarto: leve o pão no saco de papel.",
    camera: [{f: 0, target: [2.6, 2.6, 0.6], radius: 9, az: -20, el: 6}, {f: 114, target: [2.6, 2.6, 0.6], radius: 8, az: -8, el: 6}],
    objects: [{id: "bag", kind: "saco-papel", note: "na mão do Professor"}],
    animations: [{target: "bag.y", from: 1.2, to: 2.4, unit: "u3d", f0: 5, f1: 20, fn: "spring"}],
    badges: [{kind: "dica", text: "DICA 4", f: 0}],
    highlights: ["papel"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "pop", f: 2, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s11", startFrame: 1494, durationInFrames: 135, voKey: "s11",
    narration: "No plástico, o vapor fica preso e a casca amolece.",
    camera: [{f: 0, target: [0, 1.4, 0], radius: 7, az: 0, el: 10}, {f: 135, target: [0, 1.4, 0], radius: 7, az: 10, el: 10}],
    objects: [{id: "homeTable", kind: "mesa-casa"}, {id: "plasticBag", kind: "saco-plastico"}, {id: "drops", kind: "gotas-vapor", note: "20 esferas, random(seed)"}, {id: "breadSoft", kind: "pao"}],
    animations: [
      {target: "drops.opacity", from: 0, to: 0.8, unit: "frac", f0: 10, f1: 60, fn: "linear"},
      {target: "breadSoft.sag", from: 0, to: 0.5, unit: "frac", f0: 40, f1: 120, fn: "easeOut"},
      {target: "breadSoft.color", from: "#d9963f", to: "#d8c6a2", unit: "state", f0: 40, f1: 120, fn: "linear"},
    ],
    badges: [{kind: "pill", tone: "problem", text: "CASCA MOLE ✖", f: 60, anchor: "breadSoft"}],
    highlights: ["vapor", "amolece"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "pop", f: 60, status: "planned"}],
    moods: {prof: [{f: 0, mood: "bravo"}]},
  },
  {
    id: "s12", startFrame: 1629, durationInFrames: 147, voKey: "s12",
    narration: "No papel, o pão respira e continua crocante até o café.",
    camera: [{f: 0, target: [0, 1.6, 0], radius: 7, az: -10, el: 10}, {f: 147, target: [0, 1.6, 0], radius: 6, az: 5, el: 10}],
    objects: [{id: "homeTable", kind: "mesa-casa"}, {id: "bag", kind: "saco-papel"}, {id: "breadCrisp", kind: "pao", note: "parte em 2 metades"}, {id: "crumbs", kind: "farelos", note: "25, random(seed)"}, {id: "mug", kind: "caneca-cafe"}],
    animations: [
      {target: "breadCrisp.split", from: 0, to: 0.4, unit: "u3d", f0: 60, f1: 72, fn: "spring"},
      {target: "crumbs.t", from: 0, to: 1, unit: "frac", f0: 60, f1: 90, fn: "easeOut"},
    ],
    badges: [
      {kind: "pill", tone: "solution", text: "CROCANTE ✓", f: 62, anchor: "breadCrisp"},
      {kind: "fx", tone: "attention", text: "CROC!", f: 60, anchor: "breadCrisp", out: 100},
    ],
    highlights: ["crocante"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "croc", f: 60, status: "planned"}, {kind: "sfx", name: "pop", f: 62, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 60, mood: "surpreso"}, {f: 80, mood: "feliz"}]},
  },
  {
    id: "s13", startFrame: 1776, durationInFrames: 114, voKey: "s13",
    narration: "Pronto: agora você é o professor da padaria.",
    camera: [{f: 0, target: [1.5, 2.2, 0.5], radius: 16, az: -15, el: 14}, {f: 114, target: [1.5, 2.2, 0.5], radius: 13, az: 15, el: 14}],
    objects: [{id: "bulb", kind: "lampada"}, {id: "confetti", kind: "confete", note: "40 peças, random(seed)"}],
    animations: [
      {target: "prof.lift", from: 0, to: 1, unit: "frac", f0: 10, f1: 25, fn: "spring"},
      {target: "prof.y", from: 0, to: 0.3, unit: "u3d", f0: 12, f1: 28, fn: "sine"},
      {target: "confetti.t", from: 0, to: 1, unit: "frac", f0: 15, f1: 100, fn: "linear"},
    ],
    badges: [],
    highlights: ["professor"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "planned"}, {kind: "sfx", name: "confete", f: 15, status: "planned"}],
    moods: {prof: [{f: 0, mood: "eureka"}], baker: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s14", startFrame: 1890, durationInFrames: 90, voKey: null,
    narration: "",
    camera: [{f: 0, target: [1.5, 2.2, 0.5], radius: 13, az: 15, el: 14}, {f: 90, target: [1.5, 2.2, 0.5], radius: 13, az: 25, el: 14}],
    objects: [],
    animations: [{target: "follow.state", from: "Seguir", to: "Seguindo ✓", unit: "state", f0: 40, f1: 41, fn: "set"}],
    badges: [{kind: "follow", text: "@professorpowerguido", f: 0}],
    highlights: [], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "pop", f: 0, status: "planned"}, {kind: "sfx", name: "pop", f: 40, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}]},
  },
];

// Integridade: contíguo e soma exata
(() => {
  let f = 0;
  for (const s of scenes) {
    if (s.startFrame !== f) throw new Error(`cena ${s.id} começa em ${s.startFrame}, esperado ${f}`);
    f += s.durationInFrames;
  }
  if (f !== videoConfig.durationInFrames) throw new Error(`soma ${f} ≠ ${videoConfig.durationInFrames}`);
})();
