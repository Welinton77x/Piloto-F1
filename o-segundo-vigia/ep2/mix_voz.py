# EP2 — uso: python3 mix_voz.py <video.mp4> <efeitos.wav (sfx.py)> <saida.mp4>
# Vozes ElevenLabs (eleven_v3) em vozes/, sons extras (ElevenLabs sound effects) em sfx_gen/.
# Caio = Davi Andrei, Central = Thiago (rádio), regras = Nassif (grave + camada + impacto).
# Outro vigia = Wesley Bessa SUSSURRANDO, seco, colado no ouvido direito (efeito "tá do seu lado" no fone).
import subprocess, sys, os, tempfile, re
D = os.path.dirname(os.path.abspath(__file__)); VID, BG, OUT = sys.argv[1:4]
T = tempfile.mkdtemp()
def dur(f): return float(subprocess.run(["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0",f],capture_output=True,text=True).stdout)
def ff(*a): subprocess.run(["ffmpeg","-v","error","-y",*a],check=True)
TRIM = "silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse"
FX = {
 "P": "aecho=0.8:0.5:35:0.12,highpass=f=90",
 "C": "highpass=f=380,lowpass=f=3200,acompressor=threshold=-22dB:ratio=6:attack=2:release=60,volume=2.2,alimiter=limit=0.7",
}
RULE = ("[0:a]highpass=f=60,acompressor=threshold=-20dB:ratio=4:attack=5:release=120,volume=1.6,asplit[m][l];"
        "[l]asetrate=44100*0.84,aresample=44100,atempo=1.19,lowpass=f=2500,volume=0.45[low];"
        "[m][low]amix=inputs=2:normalize=0,aecho=0.8:0.7:90|180:0.3|0.18,alimiter=limit=0.9[o]")
# sussurro no ouvido: seco, grave de proximidade, presença, direita forte + esquerda fraca e atrasada (efeito binaural)
EAR = ("[0:a]highpass=f=80,equalizer=f=160:t=q:w=1:g=5,equalizer=f=5000:t=q:w=1.2:g=3,"
       "acompressor=threshold=-28dB:ratio=4:attack=3:release=80,volume={g},asplit[r][l];"
       "[l]lowpass=f=2200,volume=0.18,adelay=1|1[l2];[l2][r]amerge=inputs=2,pan=stereo|c0=c0|c1=c1,alimiter=limit=0.95[o]")
# (arquivo, quem, início em s, velocidade)
L = [("01","P",3.0,1),("02","P",8.0,1),("03","P",13.0,1),("04","P",16.1,1),("05","P",20.3,1),
     ("06","C",26.2,1.06),("07","P",31.8,1),("08","C",34.6,1),("09","R",41.2,1),("10","W",45.6,1),
     ("11","P",52.0,1),("12","W",55.8,1),("13","P",61.0,1),("14","P",68.6,1),("15","P",73.5,1),
     ("16","P",76.6,1),("17","W",80.7,1)]
# sons extras: (arquivo, início, duração, ganho, lado) lado: 'R' = ouvido direito, 'C' = centro
X = [("respira", 43.9, 1.6, 1.6, "R"), ("respira", 54.2, 1.5, 1.6, "R"), ("respira", 62.2, 2.0, 1.3, "R"), ("respira", 79.2, 1.4, 1.8, "R"),
     ("drone", 36.0, 22.0, 0.55, "C"), ("zumbido", 60.2, 3.6, 0.22, "C")]
files = []
for n,w,st,sp in L:
    t=f"{T}/{n}_t.wav"; o=f"{T}/{n}.wav"
    ff("-i",f"{D}/vozes/{n}.mp3","-af",TRIM,"-ar","44100",t)
    pre = f"atempo={sp}," if sp!=1 else ""
    if w=="R": ff("-i",t,"-filter_complex",RULE.replace("[0:a]","[0:a]"+pre),"-map","[o]","-ac","2","-ar","48000",o)
    elif w=="W": ff("-i",t,"-filter_complex",EAR.format(g=3.2 if n!="17" else 4.0),"-map","[o]","-ar","48000",o)
    else: ff("-i",t,"-af",pre+FX[w]+",aformat=channel_layouts=stereo","-ar","48000",o)
    files.append((o,st,w)); print(f"{n} {w} {st:.2f} -> {st+dur(o):.2f}")
xf = []
for i,(n,st,d,g,side) in enumerate(X):
    o=f"{T}/x{i}.wav"
    pan = "pan=stereo|c0=0.2*c0|c1=c0" if side=="R" else "aformat=channel_layouts=stereo"
    ff("-i",f"{D}/sfx_gen/{n}.mp3","-af",f"atrim=0:{d},afade=t=in:d=0.3,afade=t=out:st={max(0,d-0.6)}:d=0.6,volume={g},{pan}","-ar","48000",o)
    xf.append((o,st))
boom=f"{T}/boom.wav"
ff("-f","lavfi","-i","aevalsrc='0.9*sin(2*PI*(38+30*exp(-6*t))*t)*exp(-2.6*t)+0.25*(random(0)*2-1)*exp(-18*t)':s=48000:d=2","-af","lowpass=f=900,aformat=channel_layouts=stereo",boom)
inp=["-i",VID,"-i",BG]; parts=[]; vl=[]; el=[]
k=2
for (o,st,w) in files:
    inp+=["-i",o]; ms=int(st*1000); parts.append(f"[{k}:a]adelay={ms}|{ms}[v{k}]"); vl.append(f"[v{k}]"); k+=1
for (o,st,w) in [f for f in files if f[2]=="R"]:
    inp+=["-i",boom]; ms=int((st-0.05)*1000); parts.append(f"[{k}:a]adelay={ms}|{ms},volume=0.8[e{k}]"); el.append(f"[e{k}]"); k+=1
for (o,st) in xf:
    inp+=["-i",o]; ms=int(st*1000); parts.append(f"[{k}:a]adelay={ms}|{ms}[e{k}]"); el.append(f"[e{k}]"); k+=1
# efeitos 5 dB mais baixos e "silêncio" antes de cada sussurro
dips = "+".join(f"between(t,{a},{b})" for a,b in [(44.4,46.0),(54.7,56.2),(79.8,82.0)])
fc=";".join(parts)+f";{''.join(vl)}amix=inputs={len(vl)}:normalize=0,apad[vox];[vox]asplit[vk][vm];"
fc+=f"[1:a]aformat=channel_layouts=stereo,aresample=48000,volume=0.56,volume='if({dips},0.3,1)':eval=frame[bg0];"
fc+=f"[bg0]{''.join(el)}amix=inputs={1+len(el)}:normalize=0[bg];"
fc+="[bg][vk]sidechaincompress=threshold=0.02:ratio=8:attack=10:release=400[duck];"
fc+="[duck][vm]amix=inputs=2:normalize=0:duration=first,loudnorm=I=-16:TP=-1.5:LRA=14[a]"
mix=f"{T}/mix.mp4"
ff(*inp,"-filter_complex",fc,"-map","0:v","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-ar","48000",mix)
r=subprocess.run(["ffmpeg","-nostats","-i",mix,"-af","ebur128","-f","null","-"],capture_output=True,text=True).stderr
I=float(re.findall(r"I:\s+(-?[\d.]+) LUFS",r)[-1]); g=-16-I
ff("-i",mix,"-c:v","copy","-af",f"volume={g:.2f}dB,alimiter=limit=0.7:level=false","-c:a","aac","-b:a","192k","-movflags","+faststart",OUT)
print("loudness ajustado", I, "->", -16)
