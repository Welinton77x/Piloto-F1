# uso: python3 mix_voz.py <video.mp4> <efeitos.wav (sfx.py)> <saida.mp4>
# Vozes ElevenLabs (eleven_v3) em vozes/. Caio (protagonista) = Davi Andrei, outro vigia = Wesley Bessa,
# Central = Thiago (filtro de rádio), regras vermelhas = Nassif (grave + camada + impacto).
# Outro vigia: tom 0.87, 6% mais lento, camada grave leve, eco reverso suave antes da fala.
import subprocess, sys, os, tempfile
D = os.path.dirname(os.path.abspath(__file__)); VID, BG, OUT = sys.argv[1:4]
T = tempfile.mkdtemp()
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
TRIM = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
FX = {
 "P": "aecho=0.8:0.5:35:0.12,highpass=f=90",
 "O": "asetrate=44100*0.93,aresample=44100,atempo=0.95,aecho=0.8:0.6:60|140:0.28|0.16,lowpass=f=6500,highpass=f=80",
 "C": "highpass=f=380,lowpass=f=3200,acompressor=threshold=-22dB:ratio=6:attack=2:release=60,volume=2.2,alimiter=limit=0.7",
}
RULE = ("[0:a]highpass=f=60,acompressor=threshold=-20dB:ratio=4:attack=5:release=120,volume=1.6,asplit[m][l];"
        "[l]asetrate=44100*0.84,aresample=44100,atempo=1.19,lowpass=f=2500,volume=0.45[low];"
        "[m][low]amix=inputs=2:normalize=0,aecho=0.8:0.7:90|180:0.3|0.18,"
        "alimiter=limit=0.9[o]")
PRE = 0.5  # segundos de eco reverso antes da fala do outro vigia
GHOST = ("[0:a]adelay=500|500,apad=pad_dur=0.5,asplit=3[a][b][d];"
  "[a]rubberband=pitch=0.87:tempo=0.94,acompressor=threshold=-20dB:ratio=3,volume=1.25[main];"
  "[b]rubberband=pitch=0.6:tempo=0.94,lowpass=f=600,volume=0.22[sub];"
  "[d]rubberband=pitch=0.87:tempo=0.94,areverse,aecho=0.8:0.85:120|260:0.4|0.22,areverse,highpass=f=250,volume=0.32[rev];"
  "[main][sub][rev]amix=inputs=3:normalize=0,"
  "aecho=0.8:0.45:75|170:0.22|0.12,lowpass=f=7500,highpass=f=50,alimiter=limit=0.9[o]")
GT = {"10": 1.0, "17": 1.0}  # falas longas do outro vigia sem desacelerar
# (arquivo, quem, início em s, velocidade) — EP2, 88 s
L = [("01","P",3.0,1),("02","P",8.0,1),("03","P",13.0,1),("04","P",16.1,1),("05","P",20.3,1),
     ("06","C",26.2,1.06),("07","P",31.8,1),("08","C",34.6,1),("09","R",41.2,1),("10","O",45.3,1),
     ("11","P",52.0,1),("12","O",55.6,1),("13","P",61.0,1),("14","P",68.6,1),("15","P",73.5,1),
     ("16","P",76.6,1),("17","O",80.6,1)]
files = []
for n,w,st,sp in L:
    t=f"{T}/{n}_t.wav"; o=f"{T}/{n}.wav"
    subprocess.run(["ffmpeg","-v","error","-y","-i",f"{D}/vozes/{n}.mp3","-af",TRIM,"-ar","44100",t],check=True)
    pre = f"atempo={sp}," if sp!=1 else ""
    if w=="R": subprocess.run(["ffmpeg","-v","error","-y","-i",t,"-filter_complex",RULE.replace("[0:a]","[0:a]"+pre),"-map","[o]","-ac","2","-ar","48000",o],check=True)
    elif w=="O": subprocess.run(["ffmpeg","-v","error","-y","-i",t,"-filter_complex",GHOST.replace("tempo=0.88", f"tempo={GT.get(n, 0.88)}"),"-map","[o]","-ac","2","-ar","48000",o],check=True); st -= PRE
    else: subprocess.run(["ffmpeg","-v","error","-y","-i",t,"-af",pre+FX[w]+",aformat=channel_layouts=stereo","-ar","48000",o],check=True)
    files.append((o,st,w)); print(f"{n} {w} {st:.2f} -> {st+dur(o):.2f}")
# impacto grave no início de cada regra
boom=f"{T}/boom.wav"
subprocess.run(["ffmpeg","-v","error","-y","-f","lavfi","-i","aevalsrc='0.9*sin(2*PI*(38+30*exp(-6*t))*t)*exp(-2.6*t)+0.25*(random(0)*2-1)*exp(-18*t)':s=48000:d=2","-af","lowpass=f=900,aformat=channel_layouts=stereo",boom],check=True)
inp=["-i",VID,"-i",BG]; parts=[]; vl=[]; bl=[]
for i,(o,st,w) in enumerate(files,2):
    inp+=["-i",o]; ms=int(st*1000); parts.append(f"[{i}:a]adelay={ms}|{ms}[v{i}]"); vl.append(f"[v{i}]")
k=len(files)+2
for j,(o,st,w) in enumerate([f for f in files if f[2]=="R"]):
    inp+=["-i",boom]; ms=int((st-0.05)*1000); parts.append(f"[{k+j}:a]adelay={ms}|{ms},volume=0.9[b{j}]"); bl.append(f"[b{j}]")
fc=";".join(parts)+f";{''.join(vl)}amix=inputs={len(vl)}:normalize=0,apad[vox];[vox]asplit[vk][vm];"
fc+=f"[1:a]aformat=channel_layouts=stereo,aresample=48000[bg];[bg][vk]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=350[duck];"
fc+=f"[duck][vm]{''.join(bl)}amix=inputs={2+len(bl)}:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=11[a]"
mix=f"{T}/mix.mp4"
subprocess.run(["ffmpeg","-v","error","-y",*inp,"-filter_complex",fc,"-map","0:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",mix],check=True)
# ajuste fino de loudness (2ª passada)
import re
r=subprocess.run(["ffmpeg","-nostats","-i",mix,"-af","ebur128","-f","null","-"],capture_output=True,text=True).stderr
I=float(re.findall(r"I:\s+(-?[\d.]+) LUFS",r)[-1]); g=-16-I
subprocess.run(["ffmpeg","-v","error","-y","-i",mix,"-c:v","copy","-af",f"volume={g:.2f}dB,alimiter=limit=0.7:level=false","-c:a","aac","-b:a","192k","-movflags","+faststart",OUT],check=True)
print("loudness ajustado", I, "->", -16)
