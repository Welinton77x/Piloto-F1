// Plano de cenas v2 (sem fato real, a pedido do usuário) — "Isso vai cair na prova?" (AGUARDANDO APROVAÇÃO)
// História em corrente (guia do canal). Frames a 30 fps, intervalos [início, fim); estimativas até existir a voz.

export type VideoConfig = {width: number; height: number; fps: number; durationInFrames: number; theme: "sala-de-aula"; language: "pt-BR"};
export type Vec3 = [number, number, number];
export type Mood = "feliz" | "surpreso" | "bravo" | "eureka" | "sereno";
export type CameraKey = {f: number; target: Vec3; radius: number; az: number; el: number; fov?: number};
export type SceneObject = {id: string; kind: string; position?: Vec3; note?: string};
export type Animation = {target: string; from: number | string; to: number | string; unit: "u3d" | "deg" | "frac" | "count" | "state" | "hz"; f0: number; f1: number; fn: "linear" | "easeOut" | "spring" | "sine" | "set" | "random"};
export type Badge = {kind: "pill" | "title" | "card" | "fact" | "follow" | "notify" | "dica" | "counter" | "fx"; tone?: "problem" | "solution" | "neutral" | "attention"; text: string; f: number; anchor?: string; out?: number};
export type AudioCue = {kind: "sfx" | "music"; name: string; f: number; status: "planned" | "made"};
export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: string | null;
  narration: string; // texto da legenda
  delivery: string; // texto enviado à voz (igual à narração)
  set: "sala";
  camera: CameraKey[];
  objects: SceneObject[];
  animations: Animation[];
  badges: Badge[];
  highlights: string[];
  captions: "word-by-word";
  audioCues: AudioCue[];
  moods: {prof: {f: number; mood: Mood}[]; students?: {f: number; mood: "feliz" | "surpreso"}[]};
};

export const videoConfig: VideoConfig = {width: 1080, height: 1920, fps: 30, durationInFrames: 2313, theme: "sala-de-aula", language: "pt-BR"};
export const tts = {provider: "elevenlabs", voiceName: "Will - Social media", voiceId: "r3KkFedJ4n8aabIZ0RFQ", model: "eleven_multilingual_v2", settings: {stability: 0.3, similarity_boost: 0.8, style: 0.75, use_speaker_boost: true, speed: 1.0}} as const;

export const world: SceneObject[] = [
  {id: "room", kind: "sala-de-aula", note: "piso de madeira, parede creme, janela com prédios, relógio, mural"},
  {id: "board", kind: "quadro-negro", position: [0, 3.4, -4.4]},
  {id: "desk", kind: "mesa-do-professor", position: [2.4, 0, -2.4]},
  {id: "students", kind: "carteiras+alunos", note: "2 fileiras × 3, z = 0.6 e 2.6; x = -2.4, 0, 2.4"},
  {id: "asker", kind: "aluno-de-bone", position: [0, 0, 0.6]},
  {id: "prof", kind: "professor"},
  {id: "chalk", kind: "giz-com-rosto"},
  {id: "eraser", kind: "apagador-com-rosto"},
  {id: "marker", kind: "caneta-com-rosto"},
  {id: "projector", kind: "projetor-com-rosto"},
  {id: "clock", kind: "relogio-de-parede", position: [3.6, 6.2, -4.4]},
  {id: "bell", kind: "sinal-da-escola", position: [-3.6, 6.2, -4.4]},
];

export const scenes: ScenePlan[] = [
  {
    id: "s1", startFrame: 0, durationInFrames: 234, voKey: "s1", set: "sala",
    narration: "Se você for dar aula e um aluno perguntar se isso vai cair na prova, nunca responda: talvez.",
    delivery: "Se você for dar aula e um aluno perguntar se isso vai cair na prova, nunca responda: talvez.",
    camera: [{f: 0, target: [0, 2.6, 0], radius: 26, az: 0, el: 14, fov: 24}, {f: 110, target: [0, 2.6, 0], radius: 22, az: 8, el: 12}, {f: 111, target: [0, 2.6, 0.6], radius: 8, az: 10, el: 6}, {f: 170, target: [0, 2.6, 0.6], radius: 7.5, az: 4, el: 6}, {f: 171, target: [-1.0, 3.3, -3.0], radius: 7, az: 0, el: 2}, {f: 234, target: [-1.0, 3.3, -3.0], radius: 6.5, az: 0, el: 2}],
    objects: [{id: "prof", kind: "professor"}, {id: "asker", kind: "aluno-de-bone"}, {id: "board", kind: "quadro", note: "AULA 7"}],
    animations: [
      {target: "chalk.draw", from: 0, to: 1, unit: "frac", f0: 0, f1: 90, fn: "linear"},
      {target: "asker.handUp", from: 0, to: 1, unit: "frac", f0: 40, f1: 55, fn: "spring"},
      {target: "prof.turn", from: 180, to: 0, unit: "deg", f0: 160, f1: 180, fn: "spring"},
    ],
    badges: [
      {kind: "title", text: "Isso vai cair na|[prova]?", f: 0, out: 90},
      {kind: "pill", tone: "neutral", text: "VAI CAIR NA PROVA?", f: 120, anchor: "asker.head", out: 145},
      {kind: "pill", tone: "problem", text: "TALVEZ.", f: 210, anchor: "prof.head"},
    ],
    highlights: ["prova", "talvez"], captions: "word-by-word",
    audioCues: [{kind: "music", name: "trilha", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 115, status: "made"}, {kind: "sfx", name: "pop", f: 210, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 171, mood: "sereno"}], students: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s2", startFrame: 234, durationInFrames: 291, voKey: "s2", set: "sala",
    narration: "Porque o talvez se espalha. Em trinta segundos, a sala cria um grupo chamado resumão definitivo, com trinta e oito pessoas e nenhum resumo.",
    delivery: "Porque o talvez se espalha. Em trinta segundos, a sala cria um grupo chamado resumão definitivo, com trinta e oito pessoas e nenhum resumo.",
    camera: [{f: 0, target: [-4, 2.4, 1.6], radius: 14, az: 20, el: 22}, {f: 291, target: [4, 2.4, 1.6], radius: 14, az: -20, el: 22}],
    objects: [{id: "talvezBubbles", kind: "baloes-talvez", note: "texto 3D amarelo"}, {id: "phones", kind: "celulares", note: "6"}],
    animations: [
      {target: "talvezBubbles.hop", from: 0, to: 6, unit: "count", f0: 0, f1: 60, fn: "linear"},
      {target: "phones.y", from: 0, to: 1, unit: "frac", f0: 70, f1: 100, fn: "spring"},
    ],
    badges: [
      {kind: "notify", tone: "neutral", text: "Novo grupo|RESUMÃO DEFINITIVO 🔥|38 participantes", f: 150},
      {kind: "pill", tone: "problem", text: "0 RESUMOS", f: 250, anchor: "asker.head"},
    ],
    highlights: ["espalha", "resumão", "definitivo", "nenhum"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "notificacao", f: 80, status: "planned"}, {kind: "sfx", name: "notificacao", f: 90, status: "planned"}, {kind: "sfx", name: "notificacao", f: 150, status: "planned"}],
    moods: {prof: [{f: 0, mood: "surpreso"}], students: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s3", startFrame: 525, durationInFrames: 102, voKey: "s3", set: "sala",
    narration: "Isso é chamado de pânico acadêmico coletivo.",
    delivery: "Isso é chamado de pânico acadêmico coletivo.",
    camera: [{f: 0, target: [-1.0, 3.2, -2.6], radius: 9, az: -6, el: 4}, {f: 102, target: [-1.0, 3.2, -2.6], radius: 8, az: 4, el: 4}],
    objects: [{id: "papers", kind: "folhas-voando", note: "12"}],
    animations: [{target: "students.orbit", from: 0, to: 1, unit: "hz", f0: 0, f1: 102, fn: "linear"}],
    badges: [{kind: "card", text: "DEFINIÇÃO TÉCNICA|PÂNICO ACADÊMICO COLETIVO", f: 10}],
    highlights: ["pânico", "acadêmico", "coletivo"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "pop", f: 10, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}], students: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s4", startFrame: 627, durationInFrames: 312, voKey: "s4", set: "sala",
    narration: "Nesse caso, o correto é escrever no quadro: tudo cai. Só que o giz quebra no meio da palavra, porque giz não trabalha sob pressão.",
    delivery: "Nesse caso, o correto é escrever no quadro: tudo cai. Só que o giz quebra no meio da palavra, porque giz não trabalha sob pressão.",
    camera: [{f: 0, target: [0.5, 3.4, -3.4], radius: 11, az: -12, el: 6}, {f: 180, target: [0.5, 3.4, -3.4], radius: 9, az: 0, el: 6}, {f: 181, target: [0.6, 0.6, -3.0], radius: 4, az: 10, el: 20}, {f: 312, target: [0.6, 0.6, -3.0], radius: 3.6, az: -4, el: 20}],
    objects: [{id: "chalk", kind: "giz-com-rosto"}, {id: "boardText", kind: "texto-tudo-c"}, {id: "chalkDust", kind: "poeira", note: "20"}],
    animations: [
      {target: "boardText.letters", from: 0, to: 6, unit: "count", f0: 60, f1: 150, fn: "linear"},
      {target: "chalk.break", from: 0, to: 1, unit: "frac", f0: 165, f1: 180, fn: "spring"},
    ],
    badges: [{kind: "pill", tone: "problem", text: "SOB PRESSÃO ✖", f: 230, anchor: "chalk"}],
    highlights: ["quebra", "pressão", "tudo"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "giz", f: 60, status: "planned"}, {kind: "sfx", name: "crec", f: 168, status: "planned"}, {kind: "sfx", name: "pop", f: 230, status: "made"}],
    moods: {prof: [{f: 0, mood: "bravo"}, {f: 170, mood: "surpreso"}]},
  },
  {
    id: "s5", startFrame: 939, durationInFrames: 270, voKey: "s5", set: "sala",
    narration: "Aí o apagador pede férias, a caneta pede aumento, e o projetor só liga se você souber a senha do wi-fi.",
    delivery: "Aí o apagador pede férias, a caneta pede aumento, e o projetor só liga se você souber a senha do wi-fi.",
    camera: [{f: 0, target: [2.4, 2.4, -2.4], radius: 9, az: -10, el: 12}, {f: 270, target: [1.2, 3.0, -3.2], radius: 12, az: 8, el: 10}],
    objects: [{id: "eraser", kind: "apagador", note: "chapéu de palha e óculos"}, {id: "marker", kind: "caneta", note: "placa AUMENTO JÁ"}, {id: "projector", kind: "projetor"}, {id: "beam", kind: "feixe"}, {id: "wifiScreen", kind: "tela-senha-wifi"}],
    animations: [
      {target: "eraser.hop", from: 0, to: 1, unit: "frac", f0: 10, f1: 25, fn: "spring"},
      {target: "marker.hop", from: 0, to: 1, unit: "frac", f0: 70, f1: 85, fn: "spring"},
      {target: "projector.beam", from: 0, to: 0.5, unit: "frac", f0: 140, f1: 160, fn: "easeOut"},
    ],
    badges: [
      {kind: "pill", tone: "attention", text: "FÉRIAS", f: 15, anchor: "eraser"},
      {kind: "pill", tone: "problem", text: "AUMENTO JÁ", f: 75, anchor: "marker"},
      {kind: "pill", tone: "neutral", text: "SENHA DO WI-FI?", f: 150, anchor: "projector"},
    ],
    highlights: ["férias", "aumento", "wi-fi"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "pop", f: 15, status: "made"}, {kind: "sfx", name: "pop", f: 75, status: "made"}, {kind: "sfx", name: "pop", f: 150, status: "made"}],
    moods: {prof: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s6", startFrame: 1209, durationInFrames: 123, voKey: "s6", set: "sala",
    narration: "Esse procedimento é conhecido como greve do material escolar.",
    delivery: "Esse procedimento é conhecido como greve do material escolar.",
    camera: [{f: 0, target: [2.4, 2.4, -2.2], radius: 10, az: 6, el: 10}, {f: 123, target: [2.4, 2.4, -2.2], radius: 9, az: -6, el: 10}],
    objects: [{id: "signs", kind: "plaquinhas", note: "GREVE, REAJUSTE, ZZZ"}],
    animations: [{target: "material.march", from: 0, to: 1, unit: "frac", f0: 0, f1: 123, fn: "sine"}],
    badges: [{kind: "card", text: "DEFINIÇÃO TÉCNICA|GREVE DO MATERIAL ESCOLAR", f: 10}],
    highlights: ["greve", "material", "escolar"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "pop", f: 10, status: "made"}],
    moods: {prof: [{f: 0, mood: "bravo"}]},
  },
  {
    id: "s7", startFrame: 1332, durationInFrames: 270, voKey: "s7", set: "sala",
    narration: "Pra acabar com a greve, ofereça quinze minutos de intervalo. Mas cuidado: se eles aceitarem, o intervalo vira matéria de prova.",
    delivery: "Pra acabar com a greve, ofereça quinze minutos de intervalo. Mas cuidado: se eles aceitarem, o intervalo vira matéria de prova.",
    camera: [{f: 0, target: [0, 3.4, -2], radius: 20, az: -8, el: 12}, {f: 150, target: [0, 3.4, -2], radius: 18, az: 4, el: 12}, {f: 151, target: [0, 3.6, -4.2], radius: 10, az: 0, el: 4}, {f: 270, target: [0, 3.6, -4.2], radius: 9, az: 0, el: 4}],
    objects: [{id: "clock", kind: "relogio"}, {id: "bell", kind: "sinal"}, {id: "boardExam", kind: "texto-materia-da-prova"}],
    animations: [
      {target: "clock.hands", from: 0, to: 720, unit: "deg", f0: 40, f1: 110, fn: "linear"},
      {target: "bell.ring", from: 0, to: 20, unit: "hz", f0: 100, f1: 140, fn: "sine"},
      {target: "students.jump", from: 0, to: 1, unit: "frac", f0: 105, f1: 125, fn: "spring"},
      {target: "boardExam.write", from: 0, to: 1, unit: "frac", f0: 180, f1: 230, fn: "linear"},
    ],
    badges: [{kind: "pill", tone: "solution", text: "ACORDO ✓", f: 110, anchor: "prof.head", out: 150}],
    highlights: ["intervalo", "prova", "cuidado"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "sinal", f: 100, status: "planned"}, {kind: "sfx", name: "pop", f: 110, status: "made"}, {kind: "sfx", name: "whoosh", f: 151, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}], students: [{f: 0, mood: "feliz"}, {f: 200, mood: "surpreso"}]},
  },
  {
    id: "s8", startFrame: 1602, durationInFrames: 165, voKey: "s8", set: "sala",
    narration: "Agora a turma passa o intervalo estudando o intervalo, e alguém já fez um mapa mental do recreio.",
    delivery: "Agora a turma passa o intervalo estudando o intervalo, e alguém já fez um mapa mental do recreio.",
    camera: [{f: 0, target: [0, 2.4, 1.6], radius: 16, az: -12, el: 18}, {f: 90, target: [0, 2.4, 1.6], radius: 14, az: 6, el: 18}, {f: 91, target: [0, 3.6, -4.2], radius: 10, az: 0, el: 4}, {f: 165, target: [0, 3.6, -4.2], radius: 9, az: 0, el: 4}],
    objects: [{id: "books", kind: "livros-abertos", note: "nas 6 carteiras"}, {id: "mindmap", kind: "mapa-mental-no-quadro", note: "RECREIO → lanche, pega-pega, fila da cantina, bola"}],
    animations: [
      {target: "students.read", from: 0, to: 1, unit: "frac", f0: 0, f1: 20, fn: "spring"},
      {target: "mindmap.draw", from: 0, to: 1, unit: "frac", f0: 95, f1: 150, fn: "linear"},
    ],
    badges: [{kind: "pill", tone: "problem", text: "ESTUDANDO O INTERVALO", f: 20, anchor: "asker.head", out: 90}],
    highlights: ["intervalo", "mapa", "recreio"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 20, status: "made"}, {kind: "sfx", name: "giz", f: 95, status: "planned"}],
    moods: {prof: [{f: 0, mood: "surpreso"}], students: [{f: 0, mood: "surpreso"}]},
  },
  {
    id: "s9", startFrame: 1767, durationInFrames: 345, voKey: "s9", set: "sala",
    narration: "No dia da prova, o aluno que perguntou está na sua cadeira, de óculos e bigode, corrigindo as provas, porque foi o único que leu o plano de ensino.",
    delivery: "No dia da prova, o aluno que perguntou está na sua cadeira, de óculos e bigode, corrigindo as provas, porque foi o único que leu o plano de ensino.",
    camera: [{f: 0, target: [3.6, 2.8, -1.0], radius: 14, az: -20, el: 10}, {f: 150, target: [2.6, 2.8, -2.2], radius: 9, az: -6, el: 8}, {f: 151, target: [3.8, 3.2, 0.4], radius: 6, az: -40, el: 2}, {f: 200, target: [3.8, 3.2, 0.4], radius: 5.5, az: -40, el: 2}, {f: 201, target: [2.4, 2.8, -2.4], radius: 8, az: 4, el: 8}, {f: 345, target: [2.4, 2.8, -2.4], radius: 7, az: -4, el: 8}],
    objects: [{id: "askerDisguise", kind: "oculos-redondos+bigode-postico"}, {id: "stamp", kind: "carimbo"}, {id: "exams", kind: "pilha-de-provas"}, {id: "syllabus", kind: "documento-plano-de-ensino"}],
    animations: [
      {target: "prof.enter", from: 0, to: 1, unit: "frac", f0: 0, f1: 60, fn: "easeOut"},
      {target: "asker.stamp", from: 0, to: 1, unit: "frac", f0: 60, f1: 345, fn: "sine"},
      {target: "syllabus.raise", from: 0, to: 1, unit: "frac", f0: 280, f1: 295, fn: "spring"},
    ],
    badges: [
      {kind: "pill", tone: "solution", text: "CORRIGIDO ✓", f: 100, anchor: "asker.head", out: 150},
      {kind: "card", text: "PLANO DE ENSINO|Lido por: 1 pessoa", f: 285},
    ],
    highlights: ["óculos", "bigode", "plano", "ensino"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "tum", f: 75, status: "made"}, {kind: "sfx", name: "tum", f: 90, status: "made"}, {kind: "sfx", name: "tum", f: 105, status: "made"}, {kind: "sfx", name: "pop", f: 285, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 151, mood: "surpreso"}]},
  },
  {
    id: "s10", startFrame: 2112, durationInFrames: 201, voKey: "s10", set: "sala",
    narration: "Moral da história: nunca diga talvez pra quem tem grupo no celular.",
    delivery: "Moral da história: nunca diga talvez pra quem tem grupo no celular.",
    camera: [{f: 0, target: [0, 2.8, -0.4], radius: 20, az: -10, el: 12}, {f: 201, target: [0, 2.8, -0.4], radius: 24, az: 10, el: 14}],
    objects: [{id: "notify", kind: "notificacao"}],
    animations: [
      {target: "prof.handUp", from: 0, to: 1, unit: "frac", f0: 30, f1: 45, fn: "spring"},
      {target: "follow.state", from: "Seguir", to: "Seguindo ✓", unit: "state", f0: 160, f1: 161, fn: "set"},
    ],
    badges: [{kind: "notify", tone: "neutral", text: "RESUMÃO DEFINITIVO 🔥|Nova mensagem: \"vai cair?\"", f: 60, out: 110}, {kind: "follow", text: "@professorpowerguido", f: 120}],
    highlights: ["talvez", "celular", "moral"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "notificacao", f: 60, status: "planned"}, {kind: "sfx", name: "pop", f: 120, status: "made"}, {kind: "sfx", name: "pop", f: 160, status: "made"}],
    moods: {prof: [{f: 0, mood: "sereno"}], students: [{f: 0, mood: "feliz"}]},
  },
];

(() => {
  let f = 0;
  for (const s of scenes) {
    if (s.startFrame !== f) throw new Error(`cena ${s.id} começa em ${s.startFrame}, esperado ${f}`);
    f += s.durationInFrames;
  }
  if (f !== videoConfig.durationInFrames) throw new Error(`soma ${f} ≠ ${videoConfig.durationInFrames}`);
  const plain = (x: string) => x.toLowerCase().replace(/[^a-zà-ú ]/g, "").split(/\s+/).filter(Boolean).join(" ");
  for (const s of scenes) if (plain(s.delivery) !== plain(s.narration)) throw new Error(`cena ${s.id}: delivery difere da narração`);
})();
