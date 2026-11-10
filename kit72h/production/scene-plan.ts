// Contrato de dados da Fase 1 — vídeo 5 (kit 72h), roteiro v4 (AGUARDANDO APROVAÇÃO). Derivado de roteiro.md.
// Mesmos tipos dos vídeos 1 e 2 para reaproveitar o pipeline (voz por palavra, selos com palavra-âncora, câmera orbital).
export type Kind = "problem" | "solution" | "neutral" | "attention";
export type CamKey = { f: number; az: number; el: number; dist: number; target: [number, number, number]; atWord?: string; wordOffset?: number };
export type Anim = { target: string; unit: string; from: number | string; to: number | string; f0: number; f1: number; fn: "linear" | "easeInOut" | "easeOut" | "easeIn" | "spring" | "sin" | "seeded" };
export type Badge = { text: string; kind: Kind; f0: number; f1?: number; anchorWord?: string; untilWord?: string };
export type AudioCue = { id: string; f: number; kind: "sfx" | "music"; status: "planned" };
export type ScenePlan = {
  id: string; voKey: string; startFrame: number; durationInFrames: number; narration: string;
  camera: CamKey[]; objects: string[]; animations: Anim[]; badges: Badge[]; highlights: string[];
  captions: { mode: "one-word-at-a-time"; status: "provisional" }; audioCues: AudioCue[];
};
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 4535; theme: "smooth-3d-house-storm"; language: "pt-BR" };
export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 4535, theme: "smooth-3d-house-storm", language: "pt-BR" };
const cap = { mode: "one-word-at-a-time", status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

// Layout do quintal em corte (u3d, esquemático). Frente do corte em z = 1.
export const layout = { house: { x: [-4, 4], floors: 1 }, street: { z: [2, 5] } } as const;

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 417,
    narration: "A Defesa Civil fez um alerta: toda casa devia ter um kit de emergência pra setenta e duas horas. Parece exagero, né? Então imagina. Chuva forte a noite inteira. De repente, a luz acaba.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 417, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["house", "houseLights", "lightning", "mascot", "rain", "tv"],
    animations: [{ target: "camera", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 294, fn: "easeInOut" }, { target: "tv.glow", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 294, fn: "easeInOut" }, { target: "lights", unit: "ver roteiro", from: 0, to: 1, f0: 294, f1: 417, fn: "easeInOut" }, { target: "flash", unit: "ver roteiro", from: 0, to: 1, f0: 294, f1: 417, fn: "easeInOut" }],
    badges: [{ text: "SEM LUZ", kind: "problem", f0: 0, anchorWord: "luz" }], highlights: ["luz"], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("whoosh-s1", 0)] },
  { id: "s2", voKey: "s2", startFrame: 417, durationInFrames: 211,
    narration: "A geladeira desliga, o celular tá com dez por cento e a internet caiu. E agora?",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 211, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["fridge", "phone", "wifiIcon"],
    animations: [{ target: "battery", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 211, fn: "easeInOut" }, { target: "wifi", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 211, fn: "easeInOut" }],
    badges: [{ text: "SEM INTERNET", kind: "problem", f0: 0, anchorWord: "internet" }], highlights: ["internet"], captions: cap,
    audioCues: [cue("whoosh-s2", 0)] },
  { id: "s3", voKey: "s3", startFrame: 628, durationInFrames: 531,
    narration: "Sabe por que setenta e duas horas? Num desastre grande, a água, a energia e as estradas podem parar ao mesmo tempo. E o socorro não consegue chegar em todo mundo de uma vez. Nesses primeiros três dias, quem cuida de você é você.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 531, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["ambulance", "backpack", "bridge", "mascot", "pole", "rescueBoat", "street"],
    animations: [{ target: "flood.rise", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 410, fn: "easeInOut" }, { target: "rescue", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 410, fn: "easeInOut" }, { target: "backpack.off", unit: "ver roteiro", from: 0, to: 1, f0: 410, f1: 531, fn: "easeInOut" }],
    badges: [{ text: "72 HORAS = 3 DIAS", kind: "attention", f0: 0, anchorWord: "setenta" }, { text: "NÃO É OBRIGATÓRIO, É PREVENÇÃO", kind: "neutral", f0: 0, anchorWord: "cuida" }], highlights: ["cuida", "setenta"], captions: cap,
    audioCues: [cue("whoosh-s3", 0)] },
  { id: "s4", voKey: "s4", startFrame: 1159, durationInFrames: 577,
    narration: "Primeiro item: água. A torneira pode parar, ou a água ficar contaminada. A conta é dois litros por pessoa por dia. Três dias, seis litros por pessoa. Uma família de quatro? Vinte e quatro litros. E se não tiver? Você bebe água da enchente e passa mal. Volta!",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 577, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["bottles", "family", "faucet", "glass", "mascot", "mudWater", "waterBottles"],
    animations: [{ target: "bottles.count", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 325, fn: "easeInOut" }, { target: "bottles", unit: "ver roteiro", from: 0, to: 1, f0: 325, f1: 421, fn: "easeInOut" }, { target: "imagine", unit: "ver roteiro", from: 0, to: 1, f0: 421, f1: 577, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 421, f1: 577, fn: "easeInOut" }],
    badges: [{ text: "ÁGUA", kind: "solution", f0: 0, anchorWord: "água" }, { text: "2 L POR PESSOA POR DIA", kind: "neutral", f0: 0, anchorWord: "litros" }, { text: "FAMÍLIA DE 4 = 24 L", kind: "neutral", f0: 0, anchorWord: "família" }], highlights: ["família", "litros", "água"], captions: cap,
    audioCues: [cue("whoosh-s4", 0)] },
  { id: "s5", voKey: "s5", startFrame: 1736, durationInFrames: 360,
    narration: "Depois, comida que não precisa de geladeira nem de fogão: enlatados com abridor, biscoito, castanhas e barra de cereal. Sem luz, o que tá na geladeira começa a estragar.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 360, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["cans", "cerealBars", "crackers", "fridge", "nuts", "opener"],
    animations: [{ target: "items", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 360, fn: "easeInOut" }],
    badges: [{ text: "COMIDA", kind: "solution", f0: 0, anchorWord: "comida" }], highlights: ["comida"], captions: cap,
    audioCues: [cue("whoosh-s5", 0)] },
  { id: "s6", voKey: "s6", startFrame: 2096, durationInFrames: 440,
    narration: "Agora a noite chega e tá tudo escuro. Vela? Perigoso. E se usar? Ela cai e pega fogo na cortina. Volta! Por isso, lanterna. E várias pilhas de reserva, porque elas sempre acabam na pior hora.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 440, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["batteries", "candle", "curtain", "fire", "flashlights", "mascot"],
    animations: [{ target: "candle.light", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 122, fn: "easeInOut" }, { target: "imagine", unit: "ver roteiro", from: 0, to: 1, f0: 122, f1: 257, fn: "easeInOut" }, { target: "fire", unit: "ver roteiro", from: 0, to: 1, f0: 122, f1: 257, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 122, f1: 257, fn: "easeInOut" }, { target: "beam", unit: "ver roteiro", from: 0, to: 1, f0: 257, f1: 440, fn: "easeInOut" }, { target: "batteries", unit: "ver roteiro", from: 0, to: 1, f0: 257, f1: 440, fn: "easeInOut" }],
    badges: [{ text: "VELA = RISCO DE INCÊNDIO", kind: "problem", f0: 0, anchorWord: "Vela" }, { text: "LANTERNA + PILHAS", kind: "solution", f0: 0, anchorWord: "lanterna" }], highlights: ["lanterna", "vela"], captions: cap,
    audioCues: [cue("whoosh-s6", 0)] },
  { id: "s7", voKey: "s7", startFrame: 2536, durationInFrames: 806,
    narration: "Sem internet e sem sinal, como saber se a água vai subir ou pra onde ir? Com um rádio a pilha. Ele pega as rádios da sua cidade, que passam os avisos da Defesa Civil. E anota os telefones importantes num papel, porque celular descarregado não lembra de nada. Defesa Civil: cento e noventa e nove. Bombeiros: cento e noventa e três. Um carregador portátil cheio também ajuda.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 806, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["alertBubble", "antenna", "batteryRadio", "paperNote", "powerBank", "radio", "radioWaves"],
    animations: [{ target: "radio.on", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 249, fn: "easeInOut" }, { target: "waves", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 249, fn: "easeInOut" }, { target: "bubble", unit: "ver roteiro", from: 0, to: 1, f0: 249, f1: 415, fn: "easeInOut" }, { target: "note", unit: "ver roteiro", from: 0, to: 1, f0: 415, f1: 806, fn: "easeInOut" }],
    badges: [{ text: "RÁDIO A PILHA", kind: "solution", f0: 0, anchorWord: "rádio" }, { text: "AVISOS OFICIAIS", kind: "neutral", f0: 0, anchorWord: "avisos" }], highlights: ["avisos", "rádio"], captions: cap,
    audioCues: [cue("whoosh-s7", 0)] },
  { id: "s8", voKey: "s8", startFrame: 3342, durationInFrames: 337,
    narration: "Também vão os remédios de uso contínuo, um kit de primeiros socorros e os documentos dentro de um saco plástico fechado. E se molharem? Viram papa. Volta!",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 337, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["documents", "firstAidKit", "floodWater", "medicine", "zipBag"],
    animations: [{ target: "items", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 262, fn: "easeInOut" }, { target: "imagine", unit: "ver roteiro", from: 0, to: 1, f0: 262, f1: 337, fn: "easeInOut" }, { target: "rewind", unit: "ver roteiro", from: 0, to: 1, f0: 262, f1: 337, fn: "easeInOut" }],
    badges: [{ text: "REMÉDIOS", kind: "solution", f0: 0, anchorWord: "remédios" }, { text: "DOCUMENTOS", kind: "solution", f0: 0, anchorWord: "documentos" }], highlights: ["documentos", "remédios"], captions: cap,
    audioCues: [cue("whoosh-s8", 0)] },
  { id: "s9", voKey: "s9", startFrame: 3679, durationInFrames: 360,
    narration: "E o segredo: deixa tudo numa mochila, num lugar fácil de pegar. Na emergência, você não tem tempo de procurar nada. E confere a validade a cada seis meses.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 360, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["backpack", "calendar", "door", "hook"],
    animations: [{ target: "backpack.zip", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 360, fn: "easeInOut" }, { target: "hang", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 360, fn: "easeInOut" }],
    badges: [{ text: "MOCHILA PRONTA", kind: "solution", f0: 0, anchorWord: "mochila" }, { text: "VALIDADE: A CADA 6 MESES", kind: "neutral", f0: 0, anchorWord: "validade" }], highlights: ["mochila", "validade"], captions: cap,
    audioCues: [cue("whoosh-s9", 0)] },
  { id: "s10", voKey: "s10", startFrame: 4039, durationInFrames: 496,
    narration: "Não é pra ter medo, é pra estar pronto. Parabéns, agora você sabe montar um kit de setenta e duas horas! Você já tem o seu? Comenta aí embaixo o que você quer ver no próximo vídeo.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 496, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["confetti", "mascot", "sun"],
    animations: [{ target: "rain", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 496, fn: "easeInOut" }, { target: "sun", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 496, fn: "easeInOut" }],
    badges: [{ text: "AGORA VOCÊ SABE!", kind: "solution", f0: 0, anchorWord: "Parabéns" }], highlights: ["parabéns"], captions: cap,
    audioCues: [cue("whoosh-s10", 0)] },
];
// Integridade: 10 cenas contíguas, soma 4535 frames.
