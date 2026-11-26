// Plano de cenas v1 — "Vai cortar o cabelo?" (AGUARDANDO APROVAÇÃO)
// Contrato de dados para a Fase 2. Frames a 30 fps, intervalos [início, fim). Frames são estimativas:
// os cortes finais seguem a voz real (mesmo motor do vídeo da padaria).

export type VideoConfig = {width: number; height: number; fps: number; durationInFrames: number; theme: "barbearia"; language: "pt-BR"};
export type Vec3 = [number, number, number];
export type Mood = "feliz" | "surpreso" | "bravo" | "eureka" | "sereno";
export type CameraKey = {f: number; target: Vec3; radius: number; az: number; el: number; fov?: number};
export type SceneObject = {id: string; kind: string; position?: Vec3; note?: string};
export type Animation = {target: string; from: number | string; to: number | string; unit: "u3d" | "deg" | "frac" | "count" | "state" | "timescale" | "hz"; f0: number; f1: number; fn: "linear" | "easeOut" | "easeIn" | "spring" | "sine" | "set" | "random"};
export type Badge = {kind: "dica" | "pill" | "title" | "counter" | "fact" | "follow" | "fx"; tone?: "problem" | "solution" | "neutral" | "attention"; text: string; f: number; anchor?: string; out?: number};
export type AudioCue = {kind: "sfx" | "music"; name: string; f: number; status: "planned" | "made"};
export type ScenePlan = {
  id: string;
  startFrame: number;
  durationInFrames: number;
  voKey: string | null;
  narration: string;
  delivery: string; // fala com marcações de emoção (eleven_v3); as palavras são idênticas à narração
  set: "barbearia" | "espaco";
  camera: CameraKey[];
  objects: SceneObject[];
  animations: Animation[];
  badges: Badge[];
  highlights: string[];
  captions: "word-by-word";
  audioCues: AudioCue[];
  moods: {prof: {f: number; mood: Mood}[]; barber?: {f: number; mood: "feliz" | "surpreso" | "bravo" | "panico"}[]};
};

export const videoConfig: VideoConfig = {width: 1080, height: 1920, fps: 30, durationInFrames: 2268, theme: "barbearia", language: "pt-BR"};
export const tts = {provider: "elevenlabs", voiceName: "Will - Social media", voiceId: "r3KkFedJ4n8aabIZ0RFQ", model: "eleven_v3", stability: 0.0} as const;

export const world: SceneObject[] = [
  {id: "shop", kind: "barbearia", note: "piso xadrez, parede com espelho, janela com prédios"},
  {id: "chair", kind: "cadeira-barbeiro", position: [0, 0, 0]},
  {id: "mirror", kind: "espelho", position: [0, 3, -4]},
  {id: "pole", kind: "poste-listrado", position: [-4.5, 0, -3.5]},
  {id: "waitChair", kind: "cadeira-espera", position: [-3.5, 0, 1.5]},
  {id: "door", kind: "porta", position: [6, 0, 0]},
  {id: "calendar", kind: "calendario", position: [3.5, 4, -4.4]},
  {id: "prof", kind: "professor"},
  {id: "barber", kind: "barbeiro", position: [-1.2, 0, -0.6]},
  {id: "duck", kind: "pato"},
  {id: "lion", kind: "leao"},
  {id: "station", kind: "estacao-espacial", position: [80, 0, 0], note: "cenário separado"},
];

export const scenes: ScenePlan[] = [
  {
    id: "s1", startFrame: 0, durationInFrames: 144, voKey: "s1", set: "barbearia",
    narration: "Vai cortar o cabelo? Então segue essas quatro dicas!",
    delivery: "[excited] Vai cortar o cabelo? Então segue essas quatro dicas!",
    camera: [{f: 0, target: [0, 2.6, 0], radius: 28, az: 18, el: 18, fov: 24}, {f: 144, target: [0, 2.6, 0], radius: 24, az: 10, el: 15, fov: 24}],
    objects: [{id: "prof", kind: "professor"}, {id: "barber", kind: "barbeiro"}, {id: "pole", kind: "poste-listrado"}],
    animations: [
      {target: "prof.x", from: 8, to: 2.8, unit: "u3d", f0: 0, f1: 70, fn: "easeOut"},
      {target: "chair.rotY", from: 0, to: 360, unit: "deg", f0: 40, f1: 80, fn: "spring"},
    ],
    badges: [{kind: "title", text: "Vai cortar o|[cabelo]?", f: 0, out: 95}, {kind: "counter", tone: "neutral", text: "4 DICAS", f: 100, anchor: "prof.head"}],
    highlights: ["cabelo"], captions: "word-by-word",
    audioCues: [{kind: "music", name: "trilha", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 100, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}], barber: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s2", startFrame: 144, durationInFrames: 249, voKey: "s2", set: "barbearia",
    narration: "Primeiro: leve uma foto de referência. Mas não de um corte. Leve a foto de um leão.",
    delivery: "[excited] Primeiro: leve uma foto de referência. [whispers] Mas não de um corte. [excited] Leve a foto de um leão!",
    camera: [{f: 0, target: [-0.6, 3.0, 0], radius: 12, az: -15, el: 8}, {f: 180, target: [-0.6, 3.0, 0], radius: 10, az: -5, el: 8}, {f: 181, target: [-0.8, 3.0, 0.4], radius: 3.5, az: 0, el: 2}, {f: 249, target: [-0.8, 3.0, 0.4], radius: 3.2, az: 0, el: 2}],
    objects: [{id: "photo", kind: "foto-leao", note: "o leão da foto ruge"}, {id: "wind", kind: "linhas-de-vento"}],
    animations: [
      {target: "photo.handoff", from: 0, to: 1, unit: "frac", f0: 30, f1: 50, fn: "spring"},
      {target: "photo.roar", from: 0, to: 1, unit: "frac", f0: 190, f1: 200, fn: "spring"},
      {target: "cam.shake", from: 0.1, to: 0, unit: "u3d", f0: 190, f1: 210, fn: "sine"},
      {target: "barber.mustache.wobble", from: 1, to: 0, unit: "frac", f0: 190, f1: 240, fn: "sine"},
    ],
    badges: [{kind: "dica", text: "DICA 1", f: 0}, {kind: "pill", tone: "attention", text: "REFERÊNCIA: LEÃO", f: 185, anchor: "photo"}],
    highlights: ["leão", "referência"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 2, status: "made"}, {kind: "sfx", name: "rugido", f: 190, status: "planned"}],
    moods: {prof: [{f: 0, mood: "feliz"}], barber: [{f: 0, mood: "feliz"}, {f: 190, mood: "surpreso"}]},
  },
  {
    id: "s3", startFrame: 393, durationInFrames: 180, voKey: "s3", set: "barbearia",
    narration: "O barbeiro vai entender. E se um pato entrar, finge que é normal.",
    delivery: "[confident] O barbeiro vai entender. [excited] E se um pato entrar, finge que é normal. [laughs]",
    camera: [{f: 0, target: [0.5, 2.4, 0.5], radius: 20, az: 0, el: 12}, {f: 180, target: [-0.5, 2.2, 0.8], radius: 19, az: -10, el: 12}],
    objects: [{id: "duck", kind: "pato"}, {id: "waitChair", kind: "cadeira-espera"}],
    animations: [
      {target: "duck.x", from: 7, to: -3.5, unit: "u3d", f0: 60, f1: 150, fn: "linear"},
      {target: "duck.waddle", from: 0, to: 4, unit: "hz", f0: 60, f1: 150, fn: "sine"},
      {target: "heads.followDuck", from: 0, to: 1, unit: "frac", f0: 70, f1: 150, fn: "linear"},
      {target: "duck.hopOnChair", from: 0, to: 1, unit: "frac", f0: 150, f1: 165, fn: "spring"},
    ],
    badges: [{kind: "pill", tone: "solution", text: "NORMAL ✓", f: 155, anchor: "duck"}],
    highlights: ["pato", "normal"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "quack", f: 70, status: "planned"}, {kind: "sfx", name: "quack", f: 120, status: "planned"}, {kind: "sfx", name: "pop", f: 155, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 70, mood: "surpreso"}, {f: 160, mood: "feliz"}], barber: [{f: 0, mood: "feliz"}, {f: 70, mood: "surpreso"}, {f: 160, mood: "feliz"}]},
  },
  {
    id: "s4", startFrame: 573, durationInFrames: 180, voKey: "s4", set: "barbearia",
    narration: "Segundo: quando ele perguntar como vai ser, responda só: surpreenda-me.",
    delivery: "[excited] Segundo: quando ele perguntar como vai ser, responda só: [dramatic] surpreenda-me.",
    camera: [{f: 0, target: [-1.2, 3.4, -0.6], radius: 7.5, az: 10, el: 4}, {f: 100, target: [-1.2, 3.4, -0.6], radius: 7, az: 4, el: 4}, {f: 101, target: [0, 3.2, 0], radius: 7, az: -10, el: 2}, {f: 180, target: [0, 3.2, 0], radius: 6, az: -4, el: 2}],
    objects: [{id: "scissors", kind: "tesoura"}, {id: "comb", kind: "pente"}],
    animations: [{target: "light.key", from: 1, to: 0.6, unit: "frac", f0: 100, f1: 110, fn: "easeOut"}],
    badges: [
      {kind: "dica", text: "DICA 2", f: 0},
      {kind: "pill", tone: "neutral", text: "COMO VAI SER?", f: 40, anchor: "barber.head", out: 100},
      {kind: "pill", tone: "problem", text: "SURPREENDA-ME.", f: 120, anchor: "prof.head"},
    ],
    highlights: ["surpreenda-me"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 40, status: "made"}, {kind: "sfx", name: "pop", f: 120, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}, {f: 100, mood: "sereno"}], barber: [{f: 0, mood: "feliz"}]},
  },
  {
    id: "s5", startFrame: 753, durationInFrames: 156, voKey: "s5", set: "barbearia",
    narration: "Pronto: ele entrou em pânico e o alarme da barbearia disparou.",
    delivery: "[panicked] Pronto: ele entrou em pânico e o alarme da barbearia disparou!",
    camera: [{f: 0, target: [-1.2, 3.2, -0.6], radius: 9, az: 6, el: 6}, {f: 156, target: [-0.6, 3.4, -0.3], radius: 14, az: -8, el: 10}],
    objects: [{id: "siren", kind: "sirene"}, {id: "sweat", kind: "gotas-de-suor", note: "10, random(seed)"}, {id: "redLight", kind: "luz-vermelha"}],
    animations: [
      {target: "siren.y", from: 9, to: 6.2, unit: "u3d", f0: 5, f1: 20, fn: "spring"},
      {target: "redLight.blink", from: 0, to: 3, unit: "hz", f0: 20, f1: 156, fn: "sine"},
      {target: "duck.flap", from: 0, to: 8, unit: "hz", f0: 30, f1: 156, fn: "sine"},
    ],
    badges: [{kind: "pill", tone: "problem", text: "MODO PÂNICO", f: 10, anchor: "barber.head"}],
    highlights: ["pânico", "alarme"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "sirene", f: 20, status: "planned"}, {kind: "sfx", name: "quack", f: 40, status: "planned"}],
    moods: {prof: [{f: 0, mood: "sereno"}], barber: [{f: 0, mood: "panico"}]},
  },
  {
    id: "s6", startFrame: 909, durationInFrames: 237, voKey: "s6", set: "barbearia",
    narration: "Terceiro: desafie o barbeiro pra um duelo de penteado usando garfos. Barbeiro nunca recusa um garfo.",
    delivery: "[excited] Terceiro: desafie o barbeiro pra um duelo de penteado usando garfos! [confident] Barbeiro nunca recusa um garfo.",
    camera: [{f: 0, target: [0, 2.8, 0.5], radius: 22, az: 0, el: 10}, {f: 150, target: [0, 2.8, 0.5], radius: 20, az: 6, el: 10}, {f: 151, target: [2.2, 3.3, 0.5], radius: 4, az: -80, el: 0}, {f: 166, target: [-2.2, 3.3, 0.5], radius: 4, az: 80, el: 0}, {f: 181, target: [0, 2.8, 0.5], radius: 21, az: 0, el: 6}, {f: 237, target: [0, 2.8, 0.5], radius: 20, az: 0, el: 6}],
    objects: [{id: "forks", kind: "garfos-gigantes", note: "um para cada"}, {id: "tumbleweed", kind: "bola-de-feno"}, {id: "dust", kind: "poeira"}],
    animations: [
      {target: "forks.scale", from: 0, to: 1, unit: "frac", f0: 60, f1: 80, fn: "spring"},
      {target: "tumbleweed.x", from: 6, to: -6, unit: "u3d", f0: 120, f1: 200, fn: "linear"},
    ],
    badges: [{kind: "dica", text: "DICA 3", f: 0}, {kind: "pill", tone: "neutral", text: "DESAFIO ACEITO", f: 100, anchor: "barber.head"}],
    highlights: ["garfos", "garfo", "duelo"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "tlim", f: 62, status: "planned"}, {kind: "sfx", name: "tlim", f: 82, status: "planned"}, {kind: "sfx", name: "ventofaroeste", f: 120, status: "planned"}],
    moods: {prof: [{f: 0, mood: "bravo"}], barber: [{f: 0, mood: "surpreso"}, {f: 90, mood: "bravo"}]},
  },
  {
    id: "s7", startFrame: 1146, durationInFrames: 192, voKey: "s7", set: "barbearia",
    narration: "No meio do duelo, seu cabelo vira uma nuvem e chove na barbearia inteira.",
    delivery: "[excited] No meio do duelo, seu cabelo vira uma nuvem e chove na barbearia inteira! [laughs]",
    camera: [{f: 0, target: [0, 3.4, 0.5], radius: 12, az: -10, el: 6}, {f: 192, target: [0, 4.0, 0.5], radius: 18, az: 10, el: 12}],
    objects: [{id: "hairCloud", kind: "nuvem-de-cabelo"}, {id: "rain", kind: "chuva", note: "80 gotas"}, {id: "bolt", kind: "raio"}, {id: "umbrella", kind: "guarda-chuva"}, {id: "puddles", kind: "pocas"}],
    animations: [
      {target: "time.scale", from: 0.35, to: 1, unit: "timescale", f0: 0, f1: 60, fn: "set"},
      {target: "hairCloud.gather", from: 0, to: 1, unit: "frac", f0: 20, f1: 70, fn: "spring"},
      {target: "hairCloud.gray", from: 0, to: 1, unit: "frac", f0: 60, f1: 80, fn: "linear"},
      {target: "rain.on", from: 0, to: 1, unit: "frac", f0: 80, f1: 192, fn: "random"},
      {target: "bolt.flash", from: 0, to: 1, unit: "frac", f0: 100, f1: 106, fn: "set"},
      {target: "umbrella.open", from: 0, to: 1, unit: "frac", f0: 110, f1: 125, fn: "spring"},
    ],
    badges: [{kind: "pill", tone: "attention", text: "CÂMERA LENTA", f: 5, anchor: "prof.head", out: 60}, {kind: "pill", tone: "neutral", text: "PREVISÃO: CHUVA", f: 80, anchor: "hairCloud"}],
    highlights: ["nuvem", "chove"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whooshlento", f: 0, status: "made"}, {kind: "sfx", name: "chuva", f: 80, status: "planned"}, {kind: "sfx", name: "trovao", f: 100, status: "planned"}],
    moods: {prof: [{f: 0, mood: "bravo"}, {f: 70, mood: "surpreso"}], barber: [{f: 0, mood: "bravo"}, {f: 80, mood: "surpreso"}]},
  },
  {
    id: "s8", startFrame: 1338, durationInFrames: 204, voKey: "s8", set: "barbearia",
    narration: "Quarto: se ele reclamar da bagunça, diga que podia ser pior. Podia ser no espaço.",
    delivery: "[excited] Quarto: se ele reclamar da bagunça, diga que podia ser pior. [whispers] Podia ser no espaço.",
    camera: [{f: 0, target: [-0.6, 3.0, 0], radius: 13, az: -6, el: 8}, {f: 140, target: [-0.6, 3.2, 0], radius: 12, az: 6, el: 8}, {f: 204, target: [-0.6, 40, 0], radius: 12, az: 6, el: 8}],
    objects: [{id: "puddles", kind: "pocas"}, {id: "duckSwim", kind: "pato-na-poca"}, {id: "stars", kind: "ceu-estrelado"}],
    animations: [
      {target: "barber.armPoint", from: 0, to: 1, unit: "frac", f0: 30, f1: 45, fn: "spring"},
      {target: "prof.shrug", from: 0, to: 1, unit: "frac", f0: 90, f1: 105, fn: "spring"},
      {target: "cam.y", from: 3.2, to: 40, unit: "u3d", f0: 140, f1: 204, fn: "easeIn"},
    ],
    badges: [{kind: "dica", text: "DICA 4", f: 0}, {kind: "pill", tone: "problem", text: "BAGUNÇA ✖", f: 40, anchor: "barber.head", out: 140}],
    highlights: ["bagunça", "espaço"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 40, status: "made"}, {kind: "sfx", name: "whooshlento", f: 140, status: "made"}],
    moods: {prof: [{f: 0, mood: "sereno"}, {f: 90, mood: "feliz"}], barber: [{f: 0, mood: "bravo"}]},
  },
  {
    id: "s9", startFrame: 1542, durationInFrames: 273, voKey: "s9", set: "espaco",
    narration: "Fato real: no espaço, os astronautas cortam o cabelo com uma máquina ligada a um aspirador, pros fios não saírem voando.",
    delivery: "[excited] Fato real: no espaço, os astronautas cortam o cabelo com uma máquina ligada a um aspirador, pros fios não saírem voando!",
    camera: [{f: 0, target: [0, 3, 0], radius: 11, az: -12, el: 6}, {f: 273, target: [0, 3, 0], radius: 9, az: 12, el: 6}],
    objects: [{id: "station", kind: "estacao-espacial"}, {id: "earth", kind: "terra-na-janela"}, {id: "profAstro", kind: "professor-astronauta"}, {id: "helper", kind: "astronauta-ajudante"}, {id: "clipper", kind: "maquina-com-aspirador"}, {id: "hairBits", kind: "fios-flutuando", note: "40"}],
    animations: [
      {target: "float.bob", from: -0.1, to: 0.1, unit: "u3d", f0: 0, f1: 273, fn: "sine"},
      {target: "hairBits.suck", from: 0, to: 1, unit: "frac", f0: 80, f1: 200, fn: "easeIn"},
      {target: "earth.rotY", from: 0, to: 30, unit: "deg", f0: 0, f1: 273, fn: "linear"},
    ],
    badges: [{kind: "fact", tone: "attention", text: "FATO REAL · NASA", f: 5}],
    highlights: ["astronautas", "aspirador", "espaço"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "aspirador", f: 60, status: "planned"}],
    moods: {prof: [{f: 0, mood: "surpreso"}, {f: 120, mood: "feliz"}]},
  },
  {
    id: "s10", startFrame: 1815, durationInFrames: 273, voKey: "s10", set: "barbearia",
    narration: "No fim, você sai careca, o pato sai de topete, e um leão entra pedindo o mesmo corte que o seu.",
    delivery: "[excited] No fim, você sai careca, [laughs] o pato sai de topete, e um leão entra pedindo o mesmo corte que o seu!",
    camera: [{f: 0, target: [1.5, 2.6, 0.8], radius: 16, az: -10, el: 10}, {f: 125, target: [1.5, 2.6, 0.8], radius: 15, az: 0, el: 10}, {f: 126, target: [3, 2.4, 0.5], radius: 20, az: 10, el: 10}, {f: 273, target: [0.5, 2.6, 0], radius: 15, az: -6, el: 10}],
    objects: [{id: "duckQuiff", kind: "pato-de-topete"}, {id: "lion", kind: "leao"}, {id: "photoBald", kind: "foto-professor-careca"}],
    animations: [
      {target: "duck.x", from: -3, to: 6, unit: "u3d", f0: 40, f1: 120, fn: "linear"},
      {target: "lion.x", from: 8, to: 0.5, unit: "u3d", f0: 130, f1: 190, fn: "easeOut"},
      {target: "lion.hopOnChair", from: 0, to: 1, unit: "frac", f0: 195, f1: 210, fn: "spring"},
      {target: "barber.faint", from: 0, to: -80, unit: "deg", f0: 225, f1: 245, fn: "spring"},
    ],
    badges: [
      {kind: "pill", tone: "solution", text: "CARECA ✓", f: 10, anchor: "prof.head", out: 60},
      {kind: "pill", tone: "solution", text: "TOPETE ✓", f: 60, anchor: "duck", out: 125},
      {kind: "pill", tone: "problem", text: "O MESMO CORTE, POR FAVOR", f: 200, anchor: "lion"},
    ],
    highlights: ["careca", "topete", "leão"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "quack", f: 60, status: "planned"}, {kind: "sfx", name: "rugido", f: 140, status: "planned"}, {kind: "sfx", name: "tum", f: 240, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}], barber: [{f: 0, mood: "feliz"}, {f: 200, mood: "panico"}]},
  },
  {
    id: "s11", startFrame: 2088, durationInFrames: 180, voKey: "s11", set: "barbearia",
    narration: "E você, corta ou deixa crescer?",
    delivery: "[curious] E você, corta ou deixa crescer?",
    camera: [{f: 0, target: [0.5, 2.6, 0], radius: 22, az: -14, el: 12}, {f: 180, target: [0.5, 2.6, 0], radius: 21, az: 14, el: 12}],
    objects: [{id: "calendar", kind: "calendario"}, {id: "lionBald", kind: "leao-careca"}, {id: "duckQuiff", kind: "pato-de-topete"}],
    animations: [
      {target: "calendar.pages", from: 0, to: 30, unit: "count", f0: 20, f1: 150, fn: "linear"},
      {target: "prof.hair.regrow", from: 0, to: 1, unit: "frac", f0: 60, f1: 150, fn: "easeOut"},
      {target: "follow.state", from: "Seguir", to: "Seguindo ✓", unit: "state", f0: 130, f1: 131, fn: "set"},
    ],
    badges: [{kind: "follow", text: "@professorpowerguido", f: 90}],
    highlights: ["corta", "crescer"], captions: "word-by-word",
    audioCues: [{kind: "sfx", name: "whoosh", f: 0, status: "made"}, {kind: "sfx", name: "pop", f: 90, status: "made"}, {kind: "sfx", name: "pop", f: 130, status: "made"}],
    moods: {prof: [{f: 0, mood: "feliz"}], barber: [{f: 0, mood: "surpreso"}]},
  },
];

(() => {
  let f = 0;
  for (const s of scenes) {
    if (s.startFrame !== f) throw new Error(`cena ${s.id} começa em ${s.startFrame}, esperado ${f}`);
    f += s.durationInFrames;
  }
  if (f !== videoConfig.durationInFrames) throw new Error(`soma ${f} ≠ ${videoConfig.durationInFrames}`);
  const plain = (x: string) => x.toLowerCase().replace(/\[[a-z]+\]/g, "").replace(/[^a-zà-ú ]/g, "").split(/\s+/).filter(Boolean).join(" ");
  for (const s of scenes) if (plain(s.delivery) !== plain(s.narration)) throw new Error(`cena ${s.id}: delivery difere da narração`);
})();
