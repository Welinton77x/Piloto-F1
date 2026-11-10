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
export type VideoConfig = { width: 1080; height: 1920; fps: 30; durationInFrames: 4914; theme: "smooth-3d-house-storm"; language: "pt-BR" };
export const config: VideoConfig = { width: 1080, height: 1920, fps: 30, durationInFrames: 4914, theme: "smooth-3d-house-storm", language: "pt-BR" };
const cap = { mode: "one-word-at-a-time", status: "provisional" } as const;
const cue = (id: string, f: number, kind: "sfx" | "music" = "sfx"): AudioCue => ({ id, f, kind, status: "planned" });

// Layout do quintal em corte (u3d, esquemático). Frente do corte em z = 1.
export const layout = { house: { x: [-4, 4], floors: 1 }, street: { z: [2, 5] } } as const;

export const scenes: ScenePlan[] = [
  { id: "s1", voKey: "s1", startFrame: 0, durationInFrames: 371,
    narration: "A Defesa Civil recomendou que toda casa tenha um kit de emergência pra setenta e duas horas. Mas por que três dias? E o que vai dentro? Vamos montar juntos.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 371, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["checklist", "house", "mascot", "phone"],
    animations: [{ target: "checklist.in", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 371, fn: "easeInOut" }],
    badges: [], highlights: [], captions: cap,
    audioCues: [cue("music-in", 0, "music"), cue("whoosh-s1", 0)] },
  { id: "s2", voKey: "s2", startFrame: 371, durationInFrames: 955,
    narration: "Num temporal, numa enchente ou num apagão grande, três coisas podem parar ao mesmo tempo. Primeira: a energia. Sem luz, a geladeira desliga, o celular não carrega e, em prédio, a bomba que sobe a água pra caixa também para. Segunda: a água. A estação de tratamento também precisa de energia, canos podem romper e a enchente pode contaminar a água. Terceira: a comunicação. As antenas de celular têm bateria só por algumas horas. Depois disso, sem sinal e sem internet.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 955, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["battery", "building", "cellTower", "faucet", "flood", "fridge", "houseLights", "phone", "pipe", "pole", "pump", "storm", "tank"],
    animations: [{ target: "lights", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 212, fn: "easeInOut" }, { target: "tank.level", unit: "ver roteiro", from: 0, to: 1, f0: 212, f1: 472, fn: "easeInOut" }, { target: "faucet", unit: "ver roteiro", from: 0, to: 1, f0: 472, f1: 719, fn: "easeInOut" }, { target: "tower.battery", unit: "ver roteiro", from: 0, to: 1, f0: 719, f1: 955, fn: "easeInOut" }, { target: "signal", unit: "ver roteiro", from: 0, to: 1, f0: 719, f1: 955, fn: "easeInOut" }],
    badges: [{ text: "ENERGIA", kind: "problem", f0: 0, anchorWord: "energia" }, { text: "ÁGUA", kind: "problem", f0: 0, anchorWord: "água" }, { text: "COMUNICAÇÃO", kind: "problem", f0: 0, anchorWord: "comunicação" }], highlights: ["comunicação", "energia", "água"], captions: cap,
    audioCues: [cue("whoosh-s2", 0)] },
  { id: "s3", voKey: "s3", startFrame: 1326, durationInFrames: 531,
    narration: "E por que setenta e duas horas? Porque num desastre grande as estradas ficam bloqueadas e o socorro não consegue chegar em todo mundo de uma vez. Esses três primeiros dias são os mais difíceis, e o kit te deixa seguro até tudo voltar.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 531, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["clock72", "rescueBoat", "street", "truck"],
    animations: [{ target: "clock", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 531, fn: "easeInOut" }],
    badges: [{ text: "72 HORAS = 3 DIAS", kind: "attention", f0: 0, anchorWord: "setenta" }], highlights: ["setenta"], captions: cap,
    audioCues: [cue("whoosh-s3", 0)] },
  { id: "s4", voKey: "s4", startFrame: 1857, durationInFrames: 554,
    narration: "Agora, a lista. Item um: água potável. Dois litros por pessoa por dia, então seis litros por pessoa pros três dias. Em garrafas fechadas, longe do sol. Item dois: comida que não precisa de geladeira nem de fogão. Enlatados com abridor, biscoito, castanhas, barra de cereal.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 554, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["bars", "bottles", "cans", "checklist", "crackers", "nuts", "opener"],
    animations: [{ target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 325, fn: "easeInOut" }, { target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 325, f1: 554, fn: "easeInOut" }],
    badges: [{ text: "ÁGUA POTÁVEL", kind: "solution", f0: 0, anchorWord: "potável" }, { text: "2 L POR PESSOA POR DIA", kind: "neutral", f0: 0, anchorWord: "litros" }, { text: "COMIDA", kind: "solution", f0: 0, anchorWord: "comida" }], highlights: ["comida", "litros", "potável"], captions: cap,
    audioCues: [cue("whoosh-s4", 0)] },
  { id: "s5", voKey: "s5", startFrame: 2411, durationInFrames: 749,
    narration: "Item três: lanterna, e várias pilhas de reserva. É mais seguro que vela, que pode causar incêndio. Item quatro: rádio a pilha. Sem internet, é por ele que chegam os avisos da Defesa Civil sobre pra onde ir. Item cinco: carregador portátil cheio e os telefones importantes anotados num papel. Defesa Civil, cento e noventa e nove. Bombeiros, cento e noventa e três.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 749, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["alertBubble", "batteries", "batteryRadio", "candle", "flashlights", "paperNote", "powerBank"],
    animations: [{ target: "beam", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 202, fn: "easeInOut" }, { target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 202, fn: "easeInOut" }, { target: "radio", unit: "ver roteiro", from: 0, to: 1, f0: 202, f1: 452, fn: "easeInOut" }, { target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 202, f1: 452, fn: "easeInOut" }, { target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 452, f1: 749, fn: "easeInOut" }],
    badges: [{ text: "LANTERNA + PILHAS", kind: "solution", f0: 0, anchorWord: "lanterna" }, { text: "RÁDIO A PILHA", kind: "solution", f0: 0, anchorWord: "rádio" }, { text: "199 · 193", kind: "neutral", f0: 0, anchorWord: "telefones" }], highlights: ["lanterna", "rádio", "telefones"], captions: cap,
    audioCues: [cue("whoosh-s5", 0)] },
  { id: "s6", voKey: "s6", startFrame: 3160, durationInFrames: 566,
    narration: "Item seis: remédios de uso contínuo e um kit de primeiros socorros. Item sete: documentos num saco plástico bem fechado, pra não molhar. Item oito: itens de higiene, um agasalho e o que sua família precisa a mais, como fralda, leite pro bebê ou ração pro pet.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 566, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["diaper", "documents", "firstAidKit", "hygiene", "jacket", "medicine", "petFood", "zipBag"],
    animations: [{ target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 145, fn: "easeInOut" }, { target: "zip", unit: "ver roteiro", from: 0, to: 1, f0: 145, f1: 277, fn: "easeInOut" }, { target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 145, f1: 277, fn: "easeInOut" }, { target: "check", unit: "ver roteiro", from: 0, to: 1, f0: 277, f1: 566, fn: "easeInOut" }],
    badges: [{ text: "REMÉDIOS", kind: "solution", f0: 0, anchorWord: "remédios" }, { text: "DOCUMENTOS", kind: "solution", f0: 0, anchorWord: "documentos" }, { text: "BEBÊS E PETS TAMBÉM", kind: "neutral", f0: 0, anchorWord: "família" }], highlights: ["documentos", "família", "remédios"], captions: cap,
    audioCues: [cue("whoosh-s6", 0)] },
  { id: "s7", voKey: "s7", startFrame: 3726, durationInFrames: 692,
    narration: "Agora, as dicas pra montar. Deixa tudo numa mochila, num lugar fácil, perto da porta. Assim, se precisar sair às pressas, é só pegar e ir. E a cada seis meses confere a validade da água, da comida, dos remédios e das pilhas. Não precisa comprar tudo de uma vez. Monta aos poucos, do jeito da sua família.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 692, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["backpack", "batteries", "calendar", "cans", "checklist", "door", "hook"],
    animations: [{ target: "zip", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 310, fn: "easeInOut" }, { target: "hang", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 310, fn: "easeInOut" }, { target: "calendar", unit: "ver roteiro", from: 0, to: 1, f0: 310, f1: 513, fn: "easeInOut" }, { target: "all", unit: "ver roteiro", from: 0, to: 1, f0: 513, f1: 692, fn: "easeInOut" }],
    badges: [{ text: "MOCHILA PERTO DA PORTA", kind: "solution", f0: 0, anchorWord: "mochila" }, { text: "CONFERIR A CADA 6 MESES", kind: "neutral", f0: 0, anchorWord: "seis" }, { text: "NÃO É OBRIGATÓRIO, É PREVENÇÃO", kind: "neutral", f0: 0, anchorWord: "aos" }], highlights: ["aos", "mochila", "seis"], captions: cap,
    audioCues: [cue("whoosh-s7", 0)] },
  { id: "s8", voKey: "s8", startFrame: 4418, durationInFrames: 496,
    narration: "Não é pra ter medo, é pra estar pronto. Parabéns, agora você sabe montar um kit de setenta e duas horas! Você já tem o seu? Comenta aí embaixo o que você quer ver no próximo vídeo.",
    camera: [{ f: 0, az: 10, el: 12, dist: 10, target: [0, 1.0, 0] }, { f: 496, az: -6, el: 10, dist: 8, target: [0, 1.0, 0] }],
    objects: ["confetti", "mascot", "sun"],
    animations: [{ target: "rain", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 496, fn: "easeInOut" }, { target: "sun", unit: "ver roteiro", from: 0, to: 1, f0: 0, f1: 496, fn: "easeInOut" }],
    badges: [{ text: "AGORA VOCÊ SABE!", kind: "solution", f0: 0, anchorWord: "Parabéns" }], highlights: ["parabéns"], captions: cap,
    audioCues: [cue("whoosh-s8", 0)] },
];
// Integridade: 8 cenas contíguas, soma 4914 frames.
