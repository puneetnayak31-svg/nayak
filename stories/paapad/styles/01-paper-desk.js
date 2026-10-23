// Style 01: Paper Ephemera Desk. Stop-motion paper cut-outs shot top-down on a wooden desk.
// Captions are typewriter strips taped onto the frame; speaker names are rubber stamps.
(() => {
  const FPS = 12;
  const P = {};            // paper patterns
  let DESK = null;

  function tex(w, h, base, fn, grain = 18, seed = 3) {
    const [c, g] = layer(w, h);
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    if (fn) fn(g, w, h);
    const n = grainCanvas(w, h, grain, seed);
    g.globalCompositeOperation = 'overlay'; g.globalAlpha = .5; g.drawImage(n, 0, 0);
    g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1;
    return c;
  }
  const pat = c => ctx.createPattern(c, 'repeat');

  function makeTextures() {
    const r = rng(11);
    P.kraft = pat(tex(512, 512, '#b88a5a', (g) => {
      for (let i = 0; i < 260; i++) { g.strokeStyle = `rgba(${r() < .5 ? '90,60,30' : '230,200,160'},${.08 + r() * .12})`; g.lineWidth = .6 + r(); g.beginPath(); const x = r() * 512, y = r() * 512, a = r() * 6.28, l = 6 + r() * 26; g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
    }, 26));
    P.wall = pat(tex(512, 512, '#c9dccf', null, 14, 5));
    P.wall2 = pat(tex(512, 512, '#e9d9b8', null, 14, 9));
    P.graph = pat(tex(256, 256, '#f3f0e6', (g) => {
      g.strokeStyle = 'rgba(70,120,190,.35)'; g.lineWidth = 1;
      for (let i = 0; i <= 256; i += 32) { g.beginPath(); g.moveTo(i + .5, 0); g.lineTo(i + .5, 256); g.stroke(); g.beginPath(); g.moveTo(0, i + .5); g.lineTo(256, i + .5); g.stroke(); }
    }, 10));
    P.check = pat(tex(120, 120, '#4f74ad', (g) => {
      g.fillStyle = 'rgba(220,230,245,.35)'; g.fillRect(0, 0, 120, 18); g.fillRect(0, 0, 18, 120);
      g.fillStyle = 'rgba(20,30,70,.25)'; g.fillRect(0, 60, 120, 8); g.fillRect(60, 0, 8, 120);
    }, 14));
    P.block = pat(tex(140, 140, '#d9682a', (g) => {
      g.fillStyle = '#f3dcb5';
      for (const [x, y] of [[35, 35], [105, 105]]) {
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; g.beginPath(); g.ellipse(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 6, 4, a, 0, 7); g.fill(); }
        g.fillStyle = '#8c2c1c'; g.beginPath(); g.arc(x, y, 4, 0, 7); g.fill(); g.fillStyle = '#f3dcb5';
      }
    }, 16));
    P.skinK = pat(tex(256, 256, '#b97a52', null, 16, 21));
    P.skinJ = pat(tex(256, 256, '#cf9670', null, 16, 22));
    P.black = pat(tex(256, 256, '#201c1b', null, 20, 23));
    P.pants = pat(tex(256, 256, '#6b5440', null, 18, 24));
    P.white = pat(tex(256, 256, '#f2ece0', null, 12, 25));
    P.cream = pat(tex(256, 256, '#efe3c6', null, 14, 26));
    P.red = pat(tex(256, 256, '#c3352b', null, 18, 27));
    P.yellow = pat(tex(256, 256, '#e8b638', null, 18, 28));
    P.green = pat(tex(256, 256, '#4d8a3e', null, 18, 29));
    P.steel = pat(tex(256, 256, '#a6acb1', null, 14, 30));
    P.blue = pat(tex(256, 256, '#7fb2d8', null, 14, 31));
    P.ice = pat(tex(256, 256, '#d7ecf3', null, 10, 32));
    P.purple = pat(tex(256, 256, '#8a3a6b', null, 16, 33));
    P.pink = pat(tex(256, 256, '#e98a8f', null, 16, 34));
    P.news = pat(tex(512, 512, '#e7e1d0', (g) => {
      g.fillStyle = 'rgba(40,40,40,.28)';
      for (let y = 12; y < 512; y += 11) for (let x = 8; x < 512;) { const w = 10 + r() * 40; g.fillRect(x, y, w, 3); x += w + 6; }
    }, 10));
    P.ruled = pat(tex(512, 512, '#f6f2e7', (g) => {
      g.strokeStyle = 'rgba(80,130,200,.45)'; g.lineWidth = 1.5;
      for (let y = 40; y < 512; y += 38) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
    }, 10));
    // walnut desk
    const [d, g] = layer(W, H);
    g.fillStyle = '#4a2f1e'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      const y = r() * H, a = .03 + r() * .09;
      g.strokeStyle = r() < .6 ? `rgba(20,10,4,${a})` : `rgba(160,110,70,${a})`;
      g.lineWidth = .5 + r() * 2.5; g.beginPath();
      for (let x = -20; x <= W + 20; x += 40) g.lineTo(x, y + Math.sin(x * .004 + i) * 6 + noise1(x * .01 + i) * 5);
      g.stroke();
    }
    const vg = g.createRadialGradient(W / 2, H / 2, 300, W / 2, H / 2, 1200);
    vg.addColorStop(0, 'rgba(255,220,170,.10)'); vg.addColorStop(1, 'rgba(0,0,0,.55)');
    g.fillStyle = vg; g.fillRect(0, 0, W, H);
    DESK = d;
  }

  // ---------- paper primitives ----------
  let FI = 0;   // drawing index (12 per second), drives the stop-motion boil
  const jit = (id, a = 1) => (hash(id * 91.7 + FI * 13.1) - .5) * 2 * a;

  function blobPts(cx, cy, rx, ry, seed, n = 28, rough = .035) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = i / n * Math.PI * 2, k = 1 + (hash(seed * 31 + i) - .5) * rough * 2;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }
  function polyPts(pts, seed, rough = 2.5) { return pts.map(([x, y], i) => [x + (hash(seed + i * 7.3) - .5) * rough, y + (hash(seed + i * 3.1 + 9) - .5) * rough]); }
  function rectPts(x, y, w, h, seed, rough = 3) {
    const pts = []; const n = Math.max(2, Math.round(w / 60)), m = Math.max(2, Math.round(h / 60));
    for (let i = 0; i < n; i++) pts.push([x + w * i / n, y]);
    for (let i = 0; i < m; i++) pts.push([x + w, y + h * i / m]);
    for (let i = 0; i < n; i++) pts.push([x + w - w * i / n, y + h]);
    for (let i = 0; i < m; i++) pts.push([x, y + h - h * i / m]);
    return polyPts(pts, seed, rough);
  }
  function path(pts) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); p.closePath(); return p; }
  function cut(c, pts, fill, lift = 1) {
    const p = path(pts);
    // layered offset shadows (a real blur is far too slow to rasterise per frame)
    c.save();
    c.fillStyle = 'rgba(15,8,2,.16)';
    for (const k of [1.0, .65, .3]) { c.save(); c.translate(5 * lift * k, 7 * lift * k); c.fill(p); c.restore(); }
    c.restore();
    c.fillStyle = fill; c.fill(p);
    c.save(); c.strokeStyle = 'rgba(255,250,235,.35)'; c.lineWidth = 1.2; c.stroke(p); c.restore();
  }
  function ink(c, pts, w = 4, col = '#1a1512', seed = 1) {
    c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
    pts.forEach(([x, y], i) => { const dx = (hash(seed + i) - .5) * 1.5, dy = (hash(seed + i + 50) - .5) * 1.5; i ? c.lineTo(x + dx, y + dy) : c.moveTo(x + dx, y + dy); });
    c.stroke(); c.restore();
  }
  function tape(c, x, y, w, rot, seed) {
    c.save(); c.translate(x, y); c.rotate(rot);
    c.fillStyle = 'rgba(236,228,196,.72)';
    c.fill(path(polyPts([[-w / 2, -16], [w / 2, -16], [w / 2 + 3, -6], [w / 2 - 2, 4], [w / 2 + 2, 16], [-w / 2, 16], [-w / 2 - 3, 5], [-w / 2 + 2, -6]], seed, 2)));
    c.restore();
  }
  // place: translate + small stop-motion boil
  function place(c, id, x, y, rot = 0, s = 1, boil = 1) {
    c.translate(x + jit(id, 1.6 * boil), y + jit(id + 5, 1.6 * boil));
    c.rotate(rot + jit(id + 9, .006 * boil)); c.scale(s, s);
  }

  // ---------- characters ----------
  // pose: {armL, armR, mouth 0..1, brow: 'calm'|'angry'|'worried'|'up', eyes: 'open'|'wide'|'shut', look, tilt, apron}
  function doll(c, who, x, y, s, pose, id) {
    const K = who === 'K';
    c.save(); place(c, id, x, y, (pose.tilt || 0), s);
    const shirt = K ? P.check : P.block, skin = K ? P.skinK : P.skinJ;
    // arms (behind torso)
    const arm = (side, ang, sd) => {
      c.save(); c.translate(side * 92, -232); c.rotate(ang);
      cut(c, rectPts(-24, 0, 48, 150, sd, 2), shirt, .8);
      cut(c, blobPts(0, 168, 26, 30, sd + 2), skin, .8);
      c.restore();
    };
    arm(-1, pose.armL ?? .18, id * 10 + 1); arm(1, pose.armR ?? -.18, id * 10 + 2);
    // legs
    cut(c, rectPts(-70, -10, 62, 250, id * 10 + 3), K ? P.pants : P.cream);
    cut(c, rectPts(8, -10, 62, 250, id * 10 + 4), K ? P.pants : P.cream);
    // torso
    cut(c, polyPts([[-98, -250], [98, -250], [K ? 92 : 112, 10], [K ? -92 : -112, 10]], id * 10 + 5, 3), shirt);
    if (K && pose.apron) cut(c, polyPts([[-62, -170], [62, -170], [70, 20], [-70, 20]], id * 10 + 6, 3), P.white, .6);
    if (K && pose.apron) { c.fillStyle = 'rgba(195,53,43,.85)'; c.fillRect(-70, -10, 140, 9); }
    // neck + head
    cut(c, rectPts(-22, -290, 44, 50, id * 10 + 7, 1), skin, .5);
    const hx = 0, hy = -352;
    if (!K) cut(c, blobPts(hx, hy - 14, 84, 86, id + 70), P.black);     // hair behind
    cut(c, blobPts(hx, hy, 70, 80, id + 71), skin);
    if (K) cut(c, polyPts([[-74, -372], [-60, -428], [-10, -446], [46, -440], [76, -400], [72, -368], [40, -400], [-20, -398], [-56, -380]], id + 72, 3), P.black, .6);
    else {
      cut(c, polyPts([[-74, -350], [-66, -412], [-10, -436], [50, -428], [78, -380], [74, -340], [40, -396], [-30, -398]], id + 73, 3), P.black, .6);
      cut(c, blobPts(0, -452, 44, 34, id + 74), P.black, .6);   // bun
      c.fillStyle = '#c3352b'; c.beginPath(); c.arc(0, -382, 6, 0, 7); c.fill();  // bindi
    }
    // face: pen eyes + brows + replacement mouths
    const lx = (pose.look || 0) * 6;
    const ey = -356;
    for (const sx of [-26, 26]) {
      if (pose.eyes === 'shut') ink(c, [[sx - 10 + lx, ey], [sx + lx, ey + 4], [sx + 10 + lx, ey]], 4, '#1a1512', id + sx);
      else { c.fillStyle = '#1a1512'; c.beginPath(); c.ellipse(sx + lx, ey, pose.eyes === 'wide' ? 9 : 6.5, pose.eyes === 'wide' ? 11 : 8, 0, 0, 7); c.fill(); if (pose.eyes === 'wide') { c.fillStyle = '#fff'; c.beginPath(); c.arc(sx + lx + 2, ey - 3, 2.5, 0, 7); c.fill(); } }
      const b = pose.brow || 'calm';
      const inner = sx < 0 ? 1 : -1;
      const by = ey - 26;
      const pts = b === 'angry' ? [[sx - 16 * inner, by - 8], [sx + 14 * inner, by + 6]]
        : b === 'worried' ? [[sx - 16 * inner, by + 6], [sx + 14 * inner, by - 8]]
          : b === 'up' ? [[sx - 16, by - 10], [sx, by - 16], [sx + 16, by - 10]]
            : [[sx - 15, by - 2], [sx, by - 6], [sx + 15, by - 2]];
      ink(c, pts, 5, '#1a1512', id + sx + 3);
    }
    ink(c, [[-4 + lx, -336], [-8 + lx, -318], [2 + lx, -316]], 3, 'rgba(60,30,20,.7)', id + 40);
    const m = pose.mouth || 0;
    if (m > .45) { cut(c, blobPts(lx * .5, -296, 18 + m * 6, 8 + m * 12, id + 41), P.black, .3); c.fillStyle = '#b8484a'; c.beginPath(); c.ellipse(lx * .5, -290 + m * 4, 10, 4 + m * 3, 0, 0, 7); c.fill(); }
    else if (pose.smile) ink(c, [[-20, -302], [0, -290], [20, -302]], 4.5, '#1a1512', id + 42);
    else if (pose.frown) ink(c, [[-18, -290], [0, -298], [18, -290]], 4.5, '#1a1512', id + 42);
    else ink(c, [[-14, -296], [14, -296]], 4.5, '#1a1512', id + 42);
    if (pose.sweat) { cut(c, polyPts([[78, -400], [86, -380], [80, -370], [70, -380]], id + 43, 1), P.blue, .4); }
    c.restore();
  }

  // ---------- props ----------
  function knife(c, x, y, rot, id) {
    c.save(); place(c, id, x, y, rot);
    cut(c, polyPts([[0, -14], [190, -10], [230, 6], [0, 14]], id, 1.5), P.steel, .7);
    cut(c, rectPts(-110, -16, 110, 32, id + 1, 1.5), P.kraft, .7);
    c.restore();
  }
  function board(c, x, y, id) { c.save(); place(c, id, x, y); cut(c, rectPts(-190, -60, 380, 120, id, 3), P.kraft, .9); c.restore(); }
  function onion(c, x, y, r, id) { cut(c, blobPts(x, y, r, r, id), P.purple, .5); c.save(); c.strokeStyle = 'rgba(255,230,240,.6)'; c.lineWidth = 2; c.beginPath(); c.arc(x, y, r * .62, 0, 7); c.stroke(); c.beginPath(); c.arc(x, y, r * .3, 0, 7); c.stroke(); c.restore(); }
  function bowl(c, x, y, id) { c.save(); place(c, id, x, y); cut(c, polyPts([[-90, -20], [90, -20], [60, 50], [-60, 50]], id, 2), P.steel, .8); cut(c, blobPts(0, -20, 90, 16, id + 1), P.white, .3); c.restore(); }
  function heart(c, x, y, s, fill, id, rot = 0) {
    c.save(); place(c, id, x, y, rot, s);
    const pts = []; for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2; pts.push([16 * Math.pow(Math.sin(a), 3) * 3, -(13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * 3]); }
    cut(c, polyPts(pts, id, 2), fill, .7); c.restore();
  }
  function scribble(c, x, y, r, id, k = 1) {
    c.save(); c.strokeStyle = '#1a1512'; c.lineWidth = 4; c.lineCap = 'round'; c.beginPath();
    const n = Math.floor(60 * k);
    for (let i = 0; i < n; i++) { const a = i * .7 + FI * .4, rr = r * (.5 + .5 * hash(i + FI * 3)); c.lineTo(x + Math.cos(a) * rr * 1.4, y + Math.sin(a) * rr * .8); }
    c.stroke(); c.restore();
  }
  function stamp(c, text, x, y, rot, size, col, id, font = 'Stencil') {
    c.save(); place(c, id, x, y, rot, 1, .5);
    c.font = `900 ${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    const w = c.measureText(text).width + size * .6, h = size * 1.15;
    c.globalAlpha = .88; c.strokeStyle = col; c.lineWidth = size * .08; c.strokeRect(-w / 2, -h / 2, w, h);
    c.fillStyle = col; c.fillText(text, 0, size * .04);
    // ink gaps
    c.globalCompositeOperation = 'destination-out'; c.globalAlpha = .5;
    for (let i = 0; i < 40; i++) { c.beginPath(); c.arc((hash(id + i) - .5) * w, (hash(id + i + 99) - .5) * h, 1 + hash(i + id * 2) * 4, 0, 7); c.fill(); }
    c.restore();
  }
  function card(c, x, y, w, h, rot, fill, id, lift = 1) { c.save(); place(c, id, x, y, rot); cut(c, rectPts(-w / 2, -h / 2, w, h, id, 3), fill, lift); c.restore(); }
  function typeOn(c, text, x, y, size, col, font = 'SpecialElite', align = 'left') { c.save(); c.font = `${size}px ${font}`; c.fillStyle = col; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(text, x, y); c.restore(); }

  // ---------- sets ----------
  const STAGE = { x: 140, y: 40, w: 1640, h: 840 };
  const CACHE = {};
  function cached(key, fn) {
    const v = FI % 3, k = key + v;
    if (!CACHE[k]) { const [cv2, g] = layer(); const keep = FI; FI = v; fn(g); FI = keep; CACHE[k] = cv2; }
    ctx.drawImage(CACHE[k], 0, 0);
  }
  function kitchenSet(c, t, rainOn) {
    cached('set', kitchenSetRaw);
    if (rainOn) {
      const { x, y } = STAGE;
      c.save(); c.beginPath(); c.rect(x + 110, y + 90, 340, 250); c.clip();
      for (let i = 0; i < 30; i++) { const rx = x + 110 + hash(i) * 340, ry = y + 90 + ((hash(i + 7) * 250 + FI * 38) % 270) - 10; ink(c, [[rx, ry], [rx - 6, ry + 26]], 2.5, 'rgba(240,250,255,.85)', i); }
      c.restore();
      ink(c, [[x + 280, y + 90], [x + 280, y + 340]], 6, '#efe3c6', 6); ink(c, [[x + 110, y + 215], [x + 450, y + 215]], 6, '#efe3c6', 7);
    }
  }
  function kitchenSetRaw(c) {
    const { x, y, w, h } = STAGE;
    c.save(); place(c, 1, 0, 0, 0, 1, .3);
    cut(c, rectPts(x, y, w, h, 2, 4), P.wall, 1.2);
    // tiled backsplash from graph paper
    cut(c, rectPts(x + 20, y + 420, w - 40, 200, 3, 3), P.graph, .4);
    // window with rain
    cut(c, rectPts(x + 90, y + 70, 380, 290, 4, 3), P.cream, .7);
    cut(c, rectPts(x + 110, y + 90, 340, 250, 5, 2), P.blue, .3);
    c.save(); c.beginPath(); c.rect(x + 110, y + 90, 340, 250); c.clip();

    c.restore();
    ink(c, [[x + 280, y + 90], [x + 280, y + 340]], 6, '#efe3c6', 6); ink(c, [[x + 110, y + 215], [x + 450, y + 215]], 6, '#efe3c6', 7);
    // shelf with jars
    cut(c, rectPts(x + 560, y + 230, 420, 24, 8, 2), P.kraft, .6);
    cut(c, rectPts(x + 590, y + 150, 70, 80, 9, 2), P.yellow, .5); cut(c, rectPts(x + 680, y + 130, 80, 100, 10, 2), P.red, .5); cut(c, rectPts(x + 790, y + 160, 60, 70, 11, 2), P.green, .5);
    typeOn(c, 'HALDI', x + 625, y + 196, 18, '#3a2a10', 'SpecialElite', 'center'); typeOn(c, 'MIRCH', x + 720, y + 190, 18, '#fff1e0', 'SpecialElite', 'center');
    // fridge
    cut(c, rectPts(x + 1290, y + 60, 300, 760, 12, 3), P.white, 1.1);
    ink(c, [[x + 1300, y + 330], [x + 1580, y + 330]], 3, 'rgba(80,80,80,.6)', 13);
    cut(c, rectPts(x + 1310, y + 160, 18, 120, 14, 1), P.steel, .4); cut(c, rectPts(x + 1310, y + 380, 18, 160, 15, 1), P.steel, .4);
    card(c, x + 1450, y + 200, 110, 80, .08, P.yellow, 16, .4); typeOn(c, 'SUN', x + 1450, y + 200, 26, '#3a2a10', 'SpecialElite', 'center');
    heart(c, x + 1520, y + 440, .7, P.red, 17, -.2);
    c.restore();
  }
  function counterFront(c) { cached('counter', counterRaw); }
  function counterRaw(c) {
    const { x, y, w, h } = STAGE;
    c.save(); place(c, 20, 0, 0, 0, 1, .3);
    cut(c, rectPts(x - 10, y + 600, 1300, 250, 21, 4), P.kraft, 1.3);
    cut(c, rectPts(x - 10, y + 600, 1300, 26, 22, 2), P.news, .6);
    ink(c, [[x + 420, y + 640], [x + 420, y + 840]], 3, 'rgba(60,35,15,.6)', 23); ink(c, [[x + 860, y + 640], [x + 860, y + 840]], 3, 'rgba(60,35,15,.6)', 24);
    c.restore();
  }

  // ---------- captions: typewriter strips ----------
  const NAMECOL = { K: '#1f4f9a', J: '#b8321f', N: '#2b6b2f' };
  function caption(c, t) {
    const l = lineAt(t);
    if (!l) return;
    const text = l.text;
    const shown = Math.ceil(text.length * clamp(l.age / Math.max(.6, (l.end - l.start) * .5)));
    c.save();
    c.font = '50px SpecialElite';
    const lines = balanceWrap(c, text, 1300);
    const lh = 64, padX = 40, nameW = 230;
    const wMax = Math.max(...lines.map(s => c.measureText(s).width));
    const sw = wMax + padX * 2 + nameW, sh = lines.length * lh + 44;
    const cx = W / 2, cy = 1020 - sh / 2;
    const rot = (hash(l.i * 3.3) - .5) * .035;
    c.translate(cx + jit(500 + l.i, 1), cy + jit(600 + l.i, 1)); c.rotate(rot);
    const slide = clamp(l.age * 12 / 2);   // in over two drawings
    c.translate(0, (1 - slide) * 40); c.globalAlpha = slide;
    cut(c, rectPts(-sw / 2, -sh / 2, sw, sh, 700 + l.i, 3), P.white, 1.1);
    tape(c, -sw / 2 + 20, -sh / 2 + 6, 90, -.5, 800 + l.i); tape(c, sw / 2 - 20, -sh / 2 + 6, 90, .5, 900 + l.i);
    // name stamp
    c.save(); c.translate(-sw / 2 + nameW / 2 + 16, 2); c.rotate(-.05);
    c.font = '900 40px Stencil'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const nm = l.name.toUpperCase();
    const nw = c.measureText(nm).width + 26;
    c.strokeStyle = NAMECOL[l.spk]; c.lineWidth = 3.5; c.globalAlpha = .9 * slide; c.strokeRect(-nw / 2, -28, nw, 56);
    c.fillStyle = NAMECOL[l.spk]; c.fillText(nm, 0, 2); c.restore();
    // typed text
    c.font = '50px SpecialElite'; c.fillStyle = '#1d1a17'; c.textBaseline = 'middle';
    let left = shown;
    lines.forEach((s, i) => {
      const part = s.slice(0, Math.max(0, left)); left -= s.length + 1;
      c.fillText(part, -sw / 2 + nameW + padX, -sh / 2 + 22 + lh / 2 + i * lh + 4);
    });
    c.restore();
  }

  // ---------- scenes ----------
  function sceneOpen(c, t) {
    kitchenSet(c, t, false);
    const chop = Math.floor(t * 12) % 3 === 0;
    const asking = t > T('k02');
    doll(c, 'K', 640, 640, 1, { armL: .25, armR: chop ? -.75 : -.55, mouth: jaw(t, 'K'), brow: asking ? 'worried' : 'calm', look: asking ? 1 : 0, apron: true, eyes: asking ? 'wide' : 'open' }, 100);
    counterFront(c);
    board(c, 640, 720, 30);
    for (let i = 0; i < 5; i++) onion(c, 560 + i * 34, 712 + (i % 2) * 8, 22, 40 + i);
    knife(c, 700, chop ? 690 : 650, chop ? .1 : -.25, 31);
    bowl(c, 1000, 700, 32);
    if (asking) { // "Jyotsnaaa" call lines
      for (let i = 0; i < 3; i++) ink(c, [[880 + i * 8, 260 + i * 40], [960 + i * 26, 240 + i * 34]], 5, '#1a1512', 50 + i);
    }
  }
  function sceneNarr(c, t) {
    const a = T('n03');
    if (t < a) {
      // the recipe card and the paper balance: love vs food
      card(c, W / 2, 470, 1380, 820, -.012, P.ruled, 200, 1.2);
      c.save(); place(c, 201, 0, 0, -.012, 1, .3);
      typeOn(c, 'RECIPE:  PYAAR  aur  KHAANA', W / 2 - 600, 120, 54, '#b8321f');
      ink(c, [[W / 2 - 610, 160], [W / 2 + 560, 162]], 3, '#b8321f', 202);
      c.restore();
      const tip = t > T('n02') + .9 ? clamp((t - T('n02') - .9) * 2) : 0;
      const ang = -.28 * easeOut(tip);
      // stand
      cut(c, polyPts([[W / 2 - 30, 760], [W / 2 + 30, 760], [W / 2 + 14, 360], [W / 2 - 14, 360]], 210, 2), P.kraft, .8);
      cut(c, rectPts(W / 2 - 150, 750, 300, 40, 211, 2), P.kraft, .9);
      c.save(); c.translate(W / 2, 360); c.rotate(ang);
      cut(c, rectPts(-430, -12, 860, 24, 212, 2), P.steel, .8);
      // left pan: heart
      c.save(); c.translate(-400, 0); c.rotate(-ang);
      ink(c, [[0, 0], [-80, 180]], 3, '#1a1512', 213); ink(c, [[0, 0], [80, 180]], 3, '#1a1512', 214);
      cut(c, polyPts([[-130, 180], [130, 180], [90, 225], [-90, 225]], 215, 2), P.steel, .7);
      heart(c, 0, 110, 1.3, P.red, 216);
      c.restore();
      // right pan: plate of food (+ chilli dropped on "ek galat decision")
      c.save(); c.translate(400, 0); c.rotate(-ang);
      ink(c, [[0, 0], [-80, 180]], 3, '#1a1512', 217); ink(c, [[0, 0], [80, 180]], 3, '#1a1512', 218);
      cut(c, polyPts([[-130, 180], [130, 180], [90, 225], [-90, 225]], 219, 2), P.steel, .7);
      cut(c, blobPts(0, 150, 110, 34, 220), P.white, .6); cut(c, blobPts(0, 138, 70, 20, 221), P.yellow, .4);
      const drop = inv(T('n02') + .3, T('n02') + .9, t);
      if (drop > 0) { c.save(); c.translate(10, lerp(-420, 110, easeIn(drop))); c.rotate(.6); cut(c, polyPts([[-14, -70], [10, -74], [16, 40], [0, 76], [-12, 40]], 222, 2), P.red, .8); cut(c, rectPts(-10, -96, 16, 26, 223, 1), P.green, .5); c.restore(); }
      c.restore();
      c.restore();
      if (t > T('n02') + 1) stamp(c, 'MOOD KHARAB', W / 2 + 420, 680, -.12, 64, '#b8321f', 230);
      return;
    }
    // "Shuru-shuru mein": Karun cooks, Jyotsna guides. Hearts, then irritation.
    kitchenSet(c, t, false);
    const irritated = t > T('n06') + .8;
    doll(c, 'K', 560, 640, 1, { armL: .2, armR: -.6, mouth: 0, brow: 'up', look: 1, apron: true, smile: !irritated }, 101);
    doll(c, 'J', 1000, 640, 1, { armL: irritated ? .1 : 1.0, armR: irritated ? -.1 : -.2, mouth: 0, brow: irritated ? 'angry' : 'calm', look: -1, smile: !irritated, frown: irritated }, 102);
    counterFront(c);
    bowl(c, 560, 700, 33);
    card(c, 860, 700, 220, 150, .1, P.ruled, 240, .8);
    typeOn(c, 'Dahi 1 katori', 770, 680, 22, '#1d1a17'); typeOn(c, 'Namak thoda', 770, 715, 22, '#1d1a17');
    stamp(c, irritated ? 'AB NAHI.' : 'SHURU-SHURU MEIN', 1000, 110, -.04, 58, irritated ? '#b8321f' : '#2b6b2f', irritated ? 242 : 241);
    if (t < T('n06') + .6) {
      const n = Math.floor(clamp((t - T('n04')) / 4) * 7) + 1;
      for (let i = 0; i < n; i++) heart(c, 820 + Math.sin(i * 2.1) * 160, 520 - i * 50 - (FI % 2) * 4, .55, i % 2 ? P.pink : P.red, 250 + i, Math.sin(i) * .3);
    } else {
      // torn hearts falling, scribble cloud over Jyotsna
      for (let i = 0; i < 5; i++) { const fall = clamp((t - T('n06') - .6) * .8); heart(c, 800 + i * 70, 300 + i * 30 + fall * 300, .45, P.pink, 260 + i, 1 + i); }
      scribble(c, 1000, 140, 90, 270, clamp((t - T('n06')) / 1.5));
    }
  }
  function sceneKitchen2(c, t, b) {
    // enter / argue / bread: two-shot at the counter. Jyotsna slides in from the right with laundry.
    kitchenSet(c, t, b === 'enter');
    const enterK = b === 'enter' ? easeOut(clamp((t - TL.beats.find(x => x.name === 'enter').start) / 1.4)) : 1;
    const jx = lerp(1700, 1080, enterK);
    const jAngry = t > T('j01') && t < T('k08');
    const kWorry = t > T('j03');
    doll(c, 'K', 600, 640, 1, { armL: .25, armR: t > T('k05') && t < T('j06') ? -1.2 : -.4, mouth: jaw(t, 'K'), brow: kWorry ? 'worried' : 'up', look: 1, apron: true, sweat: t > T('j08') }, 103);
    const fist = t > T('j05') && t < T('k05');
    doll(c, 'J', jx, 640, 1, { armL: b === 'enter' ? .9 : (fist ? 1.6 : .35), armR: b === 'enter' ? -.9 : (t > T('j07') ? -1.4 : -.2), mouth: jaw(t, 'J'), brow: jAngry ? 'angry' : 'calm', look: -1, frown: !speaking(t, 'J') && jAngry }, 104);
    if (b === 'enter') { // laundry stack in her arms
      c.save(); place(c, 300, jx, 380, .04);
      cut(c, rectPts(-130, -30, 260, 50, 301, 3), P.check, .7); cut(c, rectPts(-120, -70, 240, 44, 302, 3), P.pink, .7); cut(c, rectPts(-126, -106, 252, 40, 303, 3), P.yellow, .7);
      c.restore();
    }
    counterFront(c);
    board(c, 600, 720, 34); knife(c, 640, 690, -.1, 35); bowl(c, 900, 700, 36);
    // "Jyotsna ye bata do… Jyotsna ye kaisa hoga" sticky notes multiplying
    if (t > T('j05') && t < T('k05') + .3) {
      const n = Math.min(9, Math.floor((t - T('j05')) * 4) + 1);
      const words = ['Jyotsna?', 'Jyotsna??', 'Jyotsna…', 'J??', 'Jyotsna!', 'Jyo…', 'Jyotsna ji?', 'Jyotsna???', 'JYOTSNA'];
      for (let i = 0; i < n; i++) {
        const nx = 260 + hash(i * 3.7) * 1400, ny = 120 + hash(i * 5.1) * 360;
        card(c, nx, ny, 200, 120, (hash(i) - .5) * .4, i % 2 ? P.yellow : P.pink, 400 + i, .7);
        typeOn(c, words[i], nx, ny, 30, '#1d1a17', 'Kalam', 'center');
      }
    }
    if (t > T('k05') + .6 && t < T('j07')) stamp(c, 'FIGHT MODE: ON', 1080, 150, .06, 60, '#b8321f', 420);
    if (b === 'bread' && t > T('j07')) { // bread? and the 2-month note
      card(c, 1330, 240, 250, 150, -.08, P.cream, 430, .8);
      typeOn(c, 'BREAD ?', 1330, 240, 46, '#1d1a17', 'SpecialElite', 'center');
      if (t > T('j08')) stamp(c, '2 MAHINE+', 1330, 330, .1, 44, '#b8321f', 431);
    }
  }
  function sceneFridge(c, t) {
    // a new sheet: the open fridge, cold blue inside, the bread with its expiry tag
    const open = easeOut(clamp((t - (E('j09') + .1)) / .6));
    card(c, W / 2, 470, 1500, 860, .01, P.white, 500, 1.2);
    c.save(); place(c, 501, 0, 0, .01, 1, .3);
    cut(c, rectPts(300, 90, 1320, 760, 502, 3), P.ice, .5);
    for (const sy of [330, 580]) cut(c, rectPts(300, sy, 1320, 16, 503 + sy, 2), P.steel, .4);
    // odd fridge contents
    cut(c, rectPts(380, 200, 120, 130, 510, 2), P.green, .6); cut(c, blobPts(620, 280, 70, 50, 511), P.yellow, .6);
    cut(c, rectPts(1260, 430, 110, 150, 512, 2), P.red, .6); cut(c, rectPts(1420, 470, 120, 110, 513, 2), P.white, .6);
    typeOn(c, 'ACHAAR', 1315, 510, 22, '#fff', 'SpecialElite', 'center');
    // the bread
    const lift = open > .99 ? clamp((t - (E('j09') + .8)) * 1.5) : 0;
    c.save(); c.translate(860, 470 - lift * 40); c.rotate(-.04);
    cut(c, polyPts([[-230, -70], [-150, -110], [150, -110], [230, -70], [230, 90], [-230, 90]], 520, 3), P.yellow, 1 + lift);
    cut(c, polyPts([[-200, -40], [200, -40], [200, 60], [-200, 60]], 521, 2), P.cream, .3);
    typeOn(c, 'SOFT WHITE BREAD', 0, 0, 34, '#7a4a12', 'SpecialElite', 'center');
    card(c, 200, 110, 230, 70, .12, P.white, 522, .6);
    typeOn(c, 'EXP 14 JUL', 200, 110, 34, '#1d1a17', 'SpecialElite', 'center');
    c.restore();
    // calendar page clipped on the fridge
    card(c, 1420, 210, 220, 200, .05, P.white, 530, .8);
    cut(c, rectPts(1312, 112, 216, 50, 531, 1), P.red, .3);
    typeOn(c, 'SEPTEMBER', 1420, 137, 26, '#fff', 'SpecialElite', 'center'); typeOn(c, '21', 1420, 230, 90, '#1d1a17', 'Stencil', 'center'); typeOn(c, 'SUNDAY', 1420, 285, 24, '#1d1a17', 'SpecialElite', 'center');
    if (t > T('j10') + .5) stamp(c, 'EXPIRED', 860, 470, -.18, 120, '#b8321f', 540);
    if (t > T('k07')) { card(c, 560, 720, 300, 170, -.1, P.cream, 550, 1); typeOn(c, 'ORDER #4471', 560, 690, 30, '#1d1a17', 'SpecialElite', 'center'); typeOn(c, '1x Dahi ke Sholay', 560, 735, 26, '#1d1a17', 'SpecialElite', 'center'); }
    c.restore();
    // door swings over the left half: a paper flap
    c.save(); place(c, 560, 300, 90, 0, 1, .4);
    const dw = 1320 * (1 - open);
    if (dw > 4) {
      cut(c, rectPts(0, 0, dw, 760, 561, 3), P.white, 1.4);
      ink(c, [[0, 250], [dw, 250]], 3, 'rgba(80,80,80,.6)', 562);
      if (dw > 80) { cut(c, rectPts(dw - 50, 90, 18, 120, 563, 1), P.steel, .4); cut(c, rectPts(dw - 50, 310, 18, 170, 564, 1), P.steel, .4); }
      if (dw > 300) { card(c, dw * .45, 450, 120, 90, .1, P.yellow, 565, .4); heart(c, dw * .7, 600, .8, P.red, 566); }
    }
    c.restore();
  }
  function sceneSunday(c, t) {
    card(c, W / 2, 470, 1200, 820, -.02, P.white, 600, 1.2);
    c.save(); place(c, 601, 0, 0, -.02, 1, .3);
    cut(c, rectPts(W / 2 - 600, 60, 1200, 150, 602, 2), P.red, .3);
    typeOn(c, 'SUNDAY', W / 2, 140, 110, '#fff', 'Stencil', 'center');
    typeOn(c, 'sukoon ka din', W / 2, 330, 80, '#1d1a17', 'SpecialElite', 'center');
    if (t > T('j12')) { ink(c, [[W / 2 - 300, 330], [W / 2 + 300, 324]], 9, '#b8321f', 603); stamp(c, 'JUNG KA DIN', W / 2, 470, .05, 96, '#b8321f', 604); }
    if (t > T('j13') + .3) {
      card(c, W / 2 + 330, 690, 520, 240, .07, P.cream, 610, 1.2);
      typeOn(c, 'CERTIFICATE OF DIVORCE', W / 2 + 330, 620, 32, '#1d1a17', 'SpecialElite', 'center');
      typeOn(c, 'valid for: 1 day (Sunday)', W / 2 + 330, 680, 28, '#1d1a17', 'SpecialElite', 'center');
      if (t > T('j13') + 1.2) stamp(c, 'APPROVED', W / 2 + 380, 750, -.15, 54, '#2b6b2f', 611);
    }
    c.restore();
    doll(c, 'J', 430, 760, .7, { armL: .6, armR: -1.0, mouth: jaw(t, 'J'), brow: 'angry', look: 1, eyes: speaking(t, 'J') ? 'open' : 'shut' }, 105);
  }
  function scenePaapad(c, t) {
    kitchenSet(c, t, false);
    const gone = t > T('k10') - .4;
    const yell = t > T('j14');
    if (!gone) doll(c, 'K', 640, 640, 1, { armL: .25, armR: -1.3, mouth: jaw(t, 'K'), brow: 'up', look: 1, smile: !speaking(t, 'K'), apron: true }, 106);
    const shake = yell ? 14 : 0;
    doll(c, 'J', 1080 + jit(990, shake), 640 + jit(991, shake), yell ? 1.08 : 1, { armL: yell ? 2.2 : .35, armR: yell ? -2.2 : -.3, mouth: yell ? 1 : jaw(t, 'J'), brow: 'angry', look: -1, eyes: yell ? 'wide' : 'open', frown: !yell }, 107);
    counterFront(c);
    // paapad chaat on a paper plate, held out by Karun
    if (!gone && t > T('k09')) { cut(c, blobPts(860, 520, 120, 44, 700), P.white, 1); cut(c, blobPts(860, 508, 95, 30, 701), P.yellow, .5); for (let i = 0; i < 12; i++) cut(c, blobPts(800 + hash(i) * 120, 500 + hash(i + 5) * 20, 8, 6, 702 + i), i % 2 ? P.red : P.green, .2); }
    if (gone) {
      card(c, 300, 300, 330, 120, -.06, P.cream, 720, .9);
      typeOn(c, '(door se…)', 300, 300, 40, '#1d1a17', 'SpecialElite', 'center');
    }
    if (yell) {
      for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI * 2; ink(c, [[1080 + Math.cos(a) * 300, 290 + Math.sin(a) * 200], [1080 + Math.cos(a) * 420, 290 + Math.sin(a) * 280]], 7, '#b8321f', 730 + i); }
    }
  }
  function titleCard(c, t, end) {
    card(c, W / 2, 500, 760, 860, -.03, P.white, end ? 800 : 810, 1.3);
    c.save(); place(c, end ? 801 : 811, W / 2, 500, -.03, 1, .3);
    typeOn(c, end ? 'THANK YOU · VISIT AGAIN' : 'KIRANA STORE · CASH MEMO', 0, -360, 30, '#1d1a17', 'SpecialElite', 'center');
    ink(c, [[-330, -320], [330, -320]], 2, '#1d1a17', 812);
    const items = end ? [['Story', '02'], ['Style', '01'], ['Paper', 'Desk'], ['Voices', 'temp']] : [['Dahi', '1 kg'], ['Bread', '??'], ['Papad', '1 pkt'], ['Sukoon', '0']];
    items.forEach(([a, b], i) => { typeOn(c, a, -300, -260 + i * 56, 36, '#1d1a17'); typeOn(c, b, 300, -260 + i * 56, 36, '#1d1a17', 'SpecialElite', 'right'); });
    ink(c, [[-330, -20], [330, -20]], 2, '#1d1a17', 813);
    c.restore();
    stamp(c, end ? 'THE END' : 'PAAPAD', W / 2, 640, -.08, end ? 120 : 150, '#b8321f', end ? 820 : 821);
    if (!end) typeOn(c, 'Kahaani No. 02', W / 2, 820, 44, '#1d1a17', 'SpecialElite', 'center');
    else typeOn(c, 'Style 01 · Paper Ephemera Desk', W / 2, 820, 38, '#1d1a17', 'SpecialElite', 'center');
  }

  defineStyle({
    fps: FPS,
    fonts: ['50px SpecialElite', '900 40px Stencil', '30px Kalam'],
    init() { makeTextures(); },
    draw(c, t) {
      FI = Math.floor(t * FPS + 1e-6);
      c.drawImage(DESK, 0, 0);
      const b = beatAt(t).name;
      if (t < TL.lead_in - .2) { titleCard(c, t, false); return; }
      if (t > TL.end_card) { titleCard(c, t, true); return; }
      if (b === 'open') sceneOpen(c, t);
      else if (b === 'narr') sceneNarr(c, t);
      else if ((b === 'enter' || b === 'argue' || b === 'bread') && !(b === 'bread' && t > E('j09') + .1)) sceneKitchen2(c, t, b);
      else if (b === 'fridge' || (b === 'bread' && t > E('j09') + .1)) sceneFridge(c, t);
      else if (b === 'sunday') sceneSunday(c, t);
      else scenePaapad(c, t);
      caption(c, t);
    },
  });
})();
