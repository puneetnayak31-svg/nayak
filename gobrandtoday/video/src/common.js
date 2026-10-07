// Shared helpers for every GoBrandToday composition. Everything is deterministic: seeded
// randomness only, no clocks, and all motion lives on the one paused timeline.
const SVGNS = "http://www.w3.org/2000/svg";

function rng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// The signature shape. m = 0 dot, 1 diamond, 2 spark; anything between is a smooth morph.
// Four cubic segments, tip to tip, clockwise from the top; radius 1 around the origin.
const SHAPES = [
  [[0.5523, -1], [1, -0.5523]],     // dot
  [[1 / 3, -2 / 3], [2 / 3, -1 / 3]], // diamond
  [[0, -0.32], [0.32, 0]],          // spark
];
function sparkD(m) {
  m = Math.max(0, Math.min(2, m));
  const i = Math.min(1, Math.floor(m));
  const f = m - i;
  const lerp = (a, b) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
  const c1 = lerp(SHAPES[i][0], SHAPES[i + 1][0]);
  const c2 = lerp(SHAPES[i][1], SHAPES[i + 1][1]);
  const rot = (p, q) => {
    let [x, y] = p;
    for (let k = 0; k < q; k++) [x, y] = [-y, x];
    return x.toFixed(4) + " " + y.toFixed(4);
  };
  let d = "M0 -1";
  for (let q = 0; q < 4; q++) d += " C" + rot(c1, q) + " " + rot(c2, q) + " " + rot([1, 0], q);
  return d + "Z";
}

function sparkSVG(color, m = 2, cls = "spark-svg") {
  const svg = document.createElementNS(SVGNS, "svg");
  svg.setAttribute("viewBox", "-1 -1 2 2");
  svg.setAttribute("class", cls);
  const path = document.createElementNS(SVGNS, "path");
  path.setAttribute("d", sparkD(m));
  path.setAttribute("fill", color);
  svg.appendChild(path);
  return { svg, path };
}

// Morph a spark path on the timeline by tweening its `d` attribute (every shape shares one path
// structure, so GSAP interpolates the numbers). No callbacks, so it is exact on any seek.
// Set the path's starting shape once with sparkD(); every morph has immediateRender off.
function morph(tl, path, from, to, at, dur, ease = "power2.inOut") {
  tl.fromTo(path, { attr: { d: sparkD(from) } }, { attr: { d: sparkD(to) }, duration: dur, ease, immediateRender: false }, at);
}

// Show an element from `at` (and optionally hide it again at `until`). Before `at` it is hidden on
// every seek, whatever its other tweens' starting states are.
function appear(tl, e, at, until) {
  tl.fromTo(e, { visibility: "hidden" }, { visibility: "visible", duration: 0.001 }, at);
  if (until != null) tl.to(e, { visibility: "hidden", duration: 0.001 }, until);
}

// Wait for the real fonts (fonts.ready alone resolves before any text has asked for them).
function fontsLoaded() {
  return Promise.all(['700 64px "Space Grotesk"', '500 64px "Space Grotesk"', '400 24px "Space Mono"',
    '700 24px "Space Mono"', '400 32px "Manrope"', '600 32px "Manrope"', '700 32px "Manrope"', '800 32px "Manrope"',
    '64px "Anton"', '600 64px "Fraunces"', '64px "Rozha One"', '700 64px "Syne"']
    .map(f => document.fonts.load(f))).then(() => document.fonts.ready);
}

function el(tag, cls, parent, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (parent) parent.appendChild(e);
  return e;
}

// Position of an element inside the root, ignoring any transform (works in Studio previews too).
function posIn(e, root) {
  let x = 0, y = 0, n = e;
  while (n && n !== root) { x += n.offsetLeft; y += n.offsetTop; n = n.offsetParent; }
  return { x, y, w: e.offsetWidth, h: e.offsetHeight, cx: x + e.offsetWidth / 2, cy: y + e.offsetHeight / 2 };
}

// The field of full stops. Returns the cells (row-major) and the grid size for GSAP grid staggers.
function buildField(layer, W, H, gap, color, sparkShare, seed, clear = []) {
  const r = rng(seed);
  const cols = Math.floor(W / gap) + 1, rows = Math.floor(H / gap) + 1;
  const ox = (W - (cols - 1) * gap) / 2, oy = (H - (rows - 1) * gap) / 2;
  const cells = [], dms = [], sps = [], spCells = [];
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const x = ox + i * gap, y = oy + j * gap;
      const c = el("i", "cell", layer);
      c.style.left = x + "px";
      c.style.top = y + "px";
      c.style.color = color;
      const dm = el("b", "dm", c);
      cells.push(c); dms.push(dm);
      const inClear = clear.some(z => x > z.x && x < z.x + z.w && y > z.y && y < z.y + z.h);
      if (r() < sparkShare && !inClear) {
        const s = sparkSVG("var(--violet)", 2, "sp");
        c.appendChild(s.svg);
        sps.push(s.svg); spCells.push(dm);
      }
    }
  }
  return { cells, dms, sps, spDms: spCells, grid: [rows, cols], ox, oy, gap };
}

// Typed characters: each glyph is its own span, revealed on its beat. Returns the spans.
function typeSpans(container, text, cls = "ch") {
  const spans = [];
  for (const ch of text) {
    const s = el("span", cls, container, ch);
    spans.push(s);
  }
  return spans;
}

// Typed text that wraps only between words: each word is a no-wrap span of per-glyph spans, so
// whatever is appended to the last word (a full stop, a spark) stays on the same line as it.
function typeWords(container, text) {
  const chars = [], words = [];
  text.split(" ").forEach((w, k, arr) => {
    const ws = el("span", "", container);
    ws.style.whiteSpace = "nowrap";
    words.push(ws);
    for (const ch of w) chars.push(el("span", "ch", ws, ch));
    if (k < arr.length - 1) chars.push(el("span", "ch", container, " "));
  });
  return { chars, words, last: words[words.length - 1] };
}

// The gobrandtoday wordmark with its morphing spark and aqua twin. Size in px.
function buildWordmark(parent, size, opts = {}) {
  const wm = el("div", "wm", parent);
  wm.style.fontSize = size + "px";
  wm.style.color = opts.color || "var(--graphite)";
  const text = el("span", "wm-t", wm);
  const chars = typeSpans(text, "gobrandtoday");
  const base = el("span", "", text);
  base.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
  const mark = sparkSVG(opts.spark || "var(--violet)", opts.m == null ? 2 : opts.m, "mark");
  wm.appendChild(mark.svg);
  const twin = sparkSVG(opts.twin || "var(--aqua)", 2, "twin");
  wm.appendChild(twin.svg);
  const place = () => {
    const tw = text.offsetWidth, by = base.offsetTop;
    const s = 0.46 * size, cx = tw + 0.27 * size, cy = by - 0.24 * size;
    Object.assign(mark.svg.style, { width: s + "px", height: s + "px", left: (cx - s / 2) + "px", top: (cy - s / 2) + "px" });
    const t = 0.2 * size, tx = cx + 0.3 * size, ty = cy - 0.3 * size;
    Object.assign(twin.svg.style, { width: t + "px", height: t + "px", left: (tx - t / 2) + "px", top: (ty - t / 2) + "px" });
    return { cx, cy, tx, ty, width: cx + 0.23 * size };
  };
  return { wm, chars, mark, twin, place };
}

// A burst of light rays and a ring from (x, y), on the timeline at `at`.
function burst(tl, layer, x, y, at, opts = {}) {
  const n = opts.rays || 12, len = opts.len || 160, color = opts.color || "var(--violet)";
  const g = el("div", "", layer);
  g.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0`;
  const rays = [];
  for (let k = 0; k < n; k++) {
    const arm = el("div", "", g);
    arm.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;transform:rotate(${(360 / n) * k + (opts.spin || 0)}deg)`;
    const ray = el("div", "", arm);
    const w = k % 2 ? 3 : 5;
    ray.style.cssText = `position:absolute;left:${-w / 2}px;top:0;width:${w}px;height:${len * (k % 2 ? 0.6 : 1)}px;border-radius:${w}px;background:${color};transform-origin:50% 0`;
    rays.push(ray);
  }
  const ring = el("div", "", g);
  ring.style.cssText = `position:absolute;left:-60px;top:-60px;width:120px;height:120px;border-radius:50%;border:4px solid ${opts.ring || color}`;
  appear(tl, g, at, at + 1.0);
  tl.fromTo(rays, { y: (opts.r0 || 40), scaleY: 0, opacity: 1 }, { y: (opts.r1 || 260), scaleY: 1, duration: 0.32, ease: "expo.out" }, at);
  tl.to(rays, { scaleY: 0, opacity: 0, duration: 0.35, ease: "power2.in" }, at + 0.26);
  tl.fromTo(ring, { scale: 0.2, opacity: 0.9 }, { scale: opts.ringScale || 5, opacity: 0, duration: 0.9, ease: "expo.out" }, at);
  return g;
}

// Fade the whole field in, radiating from a point (fx, fy as 0..1 ratios of the grid).
function fieldIn(tl, F, at, from = "center", amount = 0.8, opacity = 1) {
  tl.fromTo(F.dms, { scale: 0, opacity: 0 }, { scale: 1, opacity, duration: 0.5, ease: "back.out(2)", stagger: { grid: F.grid, from, amount } }, at);
}
function fieldRipple(tl, F, at, from, amount = 0.9, peak = 2.2) {
  tl.to(F.dms, { keyframes: [{ scale: peak, duration: 0.12, ease: "power2.out" }, { scale: 1, duration: 0.45, ease: "power2.inOut" }], stagger: { grid: F.grid, from, amount } }, at);
}
function fieldToDiamonds(tl, F, at, from, amount = 0.7) {
  tl.to(F.dms, { borderRadius: "0%", rotation: 45, scale: 1.1, duration: 0.35, ease: "back.out(3)", stagger: { grid: F.grid, from, amount } }, at);
}
function fieldToSparks(tl, F, at, from, amount = 0.8) {
  tl.to(F.spDms, { scale: 0, duration: 0.2, ease: "power2.in", stagger: { grid: "auto", from, amount } }, at);
  tl.fromTo(F.sps, { opacity: 0, scale: 0, rotation: -90 }, { opacity: 1, scale: 1, rotation: 0, duration: 0.5, ease: "back.out(2.5)", stagger: { grid: "auto", from, amount } }, at + 0.05);
  const rest = F.dms.filter(d => !F.spDms.includes(d));
  tl.to(rest, { borderRadius: "50%", rotation: 0, scale: 1, duration: 0.4, ease: "power2.out", stagger: { grid: "auto", from, amount } }, at);
}
// Slow ambient twinkle of the field's sparks until `end`.
function fieldTwinkle(tl, F, start, end, seed) {
  const r = rng(seed);
  F.sps.forEach((s) => {
    let t = start + r() * 0.8;
    while (t + 0.8 < end) {
      tl.to(s, { keyframes: [{ scale: 1.6, rotation: 45, duration: 0.3, ease: "sine.out" }, { scale: 1, rotation: 0, duration: 0.5, ease: "sine.inOut" }] }, t);
      t += 1.2 + r() * 1.6;
    }
  });
}
