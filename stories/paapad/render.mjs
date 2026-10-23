// Renders one style to MP4, or still frames for review.
//   node render.mjs STYLE out.mp4 audio.wav
//   node render.mjs STYLE outprefix --frames 2,40.5,77
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const [style, out, ...rest] = process.argv.slice(2);
const tl = JSON.parse(fs.readFileSync(path.join(HERE, 'build/timeline.json'), 'utf8'));
const framesArg = rest.indexOf('--frames');
const browser = await chromium.launch({ args: ['--disable-web-security', '--allow-file-access-from-files', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'] });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => { console.error('[pageerror]', e.message); process.exit(1); });
await page.goto('file://' + path.join(HERE, 'frame.html') + '?style=' + style);
const { fps, step } = await page.evaluate(t => window.setup(t), tl);

if (framesArg >= 0) {
  const times = rest[framesArg + 1].split(',').map(Number);
  for (const t of times) {
    await page.evaluate(t => window.drawAt(t), t);
    const b64 = await page.evaluate(() => window.grab(0.9));
    fs.writeFileSync(`${out}-${String(t).replace('.', '_')}.jpg`, Buffer.from(b64, 'base64'));
  }
  await browser.close();
  process.exit(0);
}

const audio = rest[0];
const OUT_FPS = 24;
const n = Math.ceil(tl.duration * OUT_FPS);
// Stop-motion styles hold each drawing for `hold` output frames
const hold = Math.max(1, Math.round(OUT_FPS / fps));
const workers = Number(process.env.WORKERS || 3);
const per = Math.ceil(n / workers / hold) * hold;
const tmp = path.join(HERE, 'build', 'seg-' + style);
fs.mkdirSync(tmp, { recursive: true });
const t0 = Date.now();

async function segment(w) {
  const a = w * per, b = Math.min(n, a + per);
  if (a >= b) return null;
  const pg = w === 0 ? page : await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  if (w) { await pg.goto('file://' + path.join(HERE, 'frame.html') + '?style=' + style); await pg.evaluate(t => window.setup(t), tl); }
  const file = path.join(tmp, `seg${w}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(OUT_FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-r', String(OUT_FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
  let last = null;
  for (let i = a; i < b; i++) {
    if ((i - a) % hold === 0 || !last) {
      const t = (i - (i % hold)) / OUT_FPS;
      await pg.evaluate(t => window.drawAt(t), t);
      last = Buffer.from(await pg.evaluate(() => window.grab(0.93)), 'base64');
    }
    if (!ff.stdin.write(last)) await new Promise(r => ff.stdin.once('drain', r));
    if ((i - a) % 480 === 0) console.log(style, 'worker', w, `${i - a}/${b - a}`, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  ff.stdin.end();
  await new Promise(r => ff.on('close', r));
  return file;
}
const segs = (await Promise.all([...Array(workers).keys()].map(segment))).filter(Boolean);
await browser.close();
fs.writeFileSync(path.join(tmp, 'list.txt'), segs.map(f => `file '${f}'`).join('\n'));
await new Promise((res, rej) => {
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-i', audio,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out], { stdio: 'inherit' });
  ff.on('close', c => c ? rej(new Error('mux failed')) : res());
});
fs.rmSync(tmp, { recursive: true, force: true });
console.log('wrote', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
