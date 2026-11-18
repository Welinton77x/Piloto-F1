// uso: node capa.mjs teste 900,1000,1040   |   node capa.mjs capa <frameDoMotor> saida.jpg
import { createRequire } from 'module'; const { chromium } = createRequire(process.cwd() + '/')('playwright');
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const [mode, arg, outFile] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('PAGE', e));
await page.goto('file://' + path.join(dir, 'scene.html'));
await page.evaluate(() => window.init());
await page.evaluate(() => { window.drawOverlay = () => {}; }); // cena limpa, sem legendas
const shot = async (F, cover) => page.evaluate(([F, cover]) => {
  renderFrame(F);
  if (!cover) return document.getElementById('out').toDataURL('image/jpeg', 0.92).split(',')[1];
  const x = document.getElementById('out').getContext('2d'), W = 1080, H = 1920, FONT = '"Inter Display"';
  // escurece embaixo, vinheta vermelha nas bordas
  let g = x.createLinearGradient(0, 1000, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.55, 'rgba(0,0,0,0.82)'); g.addColorStop(1, 'rgba(0,0,0,0.95)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  g = x.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, 'rgba(0,0,0,0.7)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, W, 420);
  g = x.createRadialGradient(540, 820, 480, 540, 900, 1300); g.addColorStop(0, 'rgba(180,0,0,0)'); g.addColorStop(1, 'rgba(170,0,0,0.6)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.textAlign = 'center'; x.textBaseline = 'middle'; x.lineJoin = 'round';
  const txt = (t, y, size, fill, lw, rot = 0) => { x.save(); x.translate(540, y); x.rotate(rot); x.font = `900 ${size}px ${FONT}`; x.lineWidth = lw; x.strokeStyle = '#000'; x.strokeText(t, 0, 0); x.fillStyle = fill; x.fillText(t, 0, 0); x.restore(); };
  // gancho no topo
  x.save(); x.translate(540, 250); x.rotate(-0.03); x.font = `900 58px ${FONT}`; const hw = x.measureText('NÃO ABRA O PORTÃO').width + 70;
  x.fillStyle = '#c4161c'; x.beginPath(); x.roundRect(-hw/2, -50, hw, 100, 14); x.fill(); x.strokeStyle = '#fff'; x.lineWidth = 6; x.stroke();
  x.fillStyle = '#fff'; x.fillText('NÃO ABRA O PORTÃO', 0, 4); x.restore();
  // título
  txt('O SEGUNDO', 1420, 104, '#ffffff', 18);
  txt('VIGIA', 1600, 260, '#FFD21F', 30);
  // pílula EP1
  x.font = `900 76px ${FONT}`; const tw = x.measureText('EP1').width + 80;
  x.fillStyle = '#fff'; x.beginPath(); x.roundRect(540 - tw/2, 1750, tw, 112, 22); x.fill(); x.fillStyle = '#111'; x.fillText('EP1', 540, 1809);
  return document.getElementById('out').toDataURL('image/jpeg', 0.94).split(',')[1];
}, [F, cover]);
if (mode === 'teste') { fs.mkdirSync(path.join(dir, 'stills'), { recursive: true }); for (const F of arg.split(',').map(Number)) fs.writeFileSync(path.join(dir, 'stills', `c${F}.jpg`), Buffer.from(await shot(F, false), 'base64')); }
else fs.writeFileSync(outFile, Buffer.from(await shot(Number(arg), true), 'base64'));
await browser.close();
