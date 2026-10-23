// Shared helpers for every style. A style file calls defineStyle({fps, fonts, init, draw}).
const W = 1920, H = 1080;
const cv = document.getElementById('c');
const ctx = cv.getContext('2d');
let TL = null, STYLE = null;

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, k) => a + (b - a) * k;
const inv = (a, b, x) => clamp((x - a) / (b - a));
const smooth = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - Math.pow(1 - k, 3);
const easeIn = k => k * k * k;
const easeInOut = k => k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
const backOut = k => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2); };
const elastic = k => k === 0 || k === 1 ? k : Math.pow(2, -10 * k) * Math.sin((k * 10 - .75) * 2 * Math.PI / 3) + 1;

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; };
}
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function noise1(x) { const i = Math.floor(x), f = x - i; return lerp(hash(i), hash(i + 1), smooth(f)) * 2 - 1; }

// The line being spoken at t, plus how long the caption stays (until the next line or +0.8 s)
function lineAt(t, hold = 0.8) {
  const L = TL.lines;
  for (let i = L.length - 1; i >= 0; i--) {
    const l = L[i];
    const next = L[i + 1];
    const until = Math.min(next ? next.start - 0.05 : Infinity, l.end + hold);
    if (t >= l.start - 0.08 && t < until) return { ...l, i, k: inv(l.start, l.end, t), age: t - l.start, until, left: until - t };
  }
  return null;
}
const lineById = id => TL.lines.find(l => l.id === id);
const T = id => lineById(id).start;          // start of a line
const E = id => lineById(id).end;            // end of a line
function speaking(t, spk) { const l = TL.lines.find(l => t >= l.start && t < l.end); return l && l.spk === spk ? l : null; }
// Mouth flap 0..1 driven by time while a speaker talks (no lip-sync, just puppet jaw rhythm)
function jaw(t, spk) {
  const l = speaking(t, spk);
  if (!l) return 0;
  const v = Math.abs(Math.sin(t * 17.3) * 0.6 + Math.sin(t * 9.1 + 1) * 0.4);
  return clamp(v * 1.3) * smooth(inv(l.start, l.start + .06, t)) * smooth(inv(l.end, l.end - .06, t));
}
function beatAt(t) { return TL.beats.find(b => t >= b.start && t < b.end) || TL.beats[TL.beats.length - 1]; }

function wrapText(c, text, maxW) {
  const words = text.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    const tryL = cur ? cur + ' ' + w : w;
    if (c.measureText(tryL).width > maxW && cur) { lines.push(cur); cur = w; } else cur = tryL;
  }
  if (cur) lines.push(cur);
  return lines;
}
// Balanced wrap: same number of lines as greedy, but evens out their widths
function balanceWrap(c, text, maxW) {
  const greedy = wrapText(c, text, maxW);
  if (greedy.length < 2) return greedy;
  let lo = maxW * 0.4, hi = maxW;
  for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; if (wrapText(c, text, m).length > greedy.length) lo = m; else hi = m; }
  return wrapText(c, text, hi);
}

// Offscreen canvas helper
function layer(w = W, h = H) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
// Grain/noise texture
function grainCanvas(w, h, amt, seed = 7, mono = true) {
  const [c, g] = layer(w, h);
  const id = g.createImageData(w, h);
  const r = rng(seed);
  for (let i = 0; i < w * h; i++) {
    const v = (r() - .5) * amt;
    id.data[i * 4] = 128 + v; id.data[i * 4 + 1] = 128 + (mono ? v : (r() - .5) * amt); id.data[i * 4 + 2] = 128 + (mono ? v : (r() - .5) * amt); id.data[i * 4 + 3] = 255;
  }
  g.putImageData(id, 0, 0);
  return c;
}
function roundRect(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); }

window.defineStyle = function (s) { STYLE = s; };
window.setup = async function (timeline) {
  TL = timeline;
  while (!STYLE) await new Promise(r => setTimeout(r, 10));
  const fams = STYLE.fonts || [];
  await Promise.all(fams.map(f => document.fonts.load(f)));
  await document.fonts.ready;
  if (STYLE.init) await STYLE.init();
  return { fps: STYLE.fps || 24, step: STYLE.step || 1 };
};
window.drawAt = function (t) { ctx.save(); STYLE.draw(ctx, t); ctx.restore(); return true; };
window.grab = function (q = 0.92) { return cv.toDataURL('image/jpeg', q).slice(23); };
