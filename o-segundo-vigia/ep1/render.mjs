// uso: node render.mjs stills 100,500,900   |   node render.mjs video saida.mp4 [frameInicial]
import { createRequire } from 'module'; const { chromium } = createRequire(process.cwd() + '/')('playwright');
import { spawn } from 'child_process';
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const dir = path.dirname(fileURLToPath(import.meta.url));
const [mode, arg, startArg] = process.argv.slice(2);
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
page.on('pageerror', e => console.error('PAGE', e));
await page.goto('file://' + path.join(dir, 'scene.html'));
await page.evaluate(() => window.init());
const total = await page.evaluate(() => window.TOTAL);
const grab = F => page.evaluate(F => window.renderAny(F).split(',')[1], F);
if (mode === 'stills') {
  fs.mkdirSync(path.join(dir, 'stills'), { recursive: true });
  for (const F of arg.split(',').map(Number)) fs.writeFileSync(path.join(dir, 'stills', `f${F}.jpg`), Buffer.from(await grab(F), 'base64'));
} else {
  const start = Number(startArg || 0);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', '30', '-c:v', 'mjpeg', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', '30', arg], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let F = start; F < total; F++) {
    const b = Buffer.from(await grab(F), 'base64');
    if (!ff.stdin.write(b)) await new Promise(r => ff.stdin.once('drain', r));
    if (F % 100 === 0) console.log('frame', F, '/', total);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}
await browser.close();
