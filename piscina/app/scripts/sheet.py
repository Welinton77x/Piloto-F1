"""Folha de contato: python scripts/sheet.py dir out.png [colunas]"""
import sys, glob
from PIL import Image, ImageDraw
d, out = sys.argv[1], sys.argv[2]
cols = int(sys.argv[3]) if len(sys.argv) > 3 else 6
fs = sorted(glob.glob(d + "/f*.png"))
ims = [Image.open(f).convert("RGB") for f in fs]
w, h = ims[0].size
s = 0.6
tw, th = int(w * s), int(h * s)
rows = (len(ims) + cols - 1) // cols
M = Image.new("RGB", (tw * cols, (th + 22) * rows), "white")
dr = ImageDraw.Draw(M)
for i, (im, f) in enumerate(zip(ims, fs)):
    x, y = (i % cols) * tw, (i // cols) * (th + 22)
    M.paste(im.resize((tw, th)), (x, y + 22))
    dr.text((x + 6, y + 4), f.split("/")[-1], fill="black")
M.save(out)
print(out, M.size)
