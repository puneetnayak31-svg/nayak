// Style 03: Hand-painted Bollywood hoarding. Enamel colours, faces painted in tonal bands with
// turquoise shadows and cream highlight strokes, sunbursts, 3D-extruded titles, dhishoom zooms.
(() => {
  const Q = { cream: '#fff1c9', ink: '#2a120c', red: '#d42a1f', yellow: '#ffcc1f', magenta: '#c4175e', teal: '#0f7f86', purple: '#4b1f6e', green: '#2f9a4a', orange: '#f26a1b' };
  let STROKES = null, GRAIN = null;
  const P = s => new Path2D(s);

  // ---------- painted faces ----------
  const HEAD = P('M0,-210 C95,-210 155,-140 152,-40 C150,40 130,110 90,165 C60,200 30,215 0,215 C-30,215 -60,200 -90,165 C-130,110 -150,40 -152,-40 C-155,-140 -95,-210 0,-210 Z');
  const SHADE = P('M-160,-60 C-160,40 -135,115 -92,168 C-60,205 -28,220 0,220 L-6,214 C-56,190 -96,120 -106,40 C-114,-40 -106,-120 -76,-196 C-130,-166 -162,-110 -160,-60 Z');
  const SHADE2 = P('M-160,-60 C-160,40 -135,115 -92,168 C-70,192 -50,205 -36,212 C-70,170 -80,100 -84,20 C-88,-60 -84,-130 -60,-200 C-130,-170 -162,-110 -160,-60 Z');
  const NOSE = P('M-6,-58 C-10,0 -26,40 -34,64 C-18,78 14,80 32,64 C18,60 6,50 4,40 C2,10 4,-30 6,-58 Z');
  const JAW_SH = P('M-70,150 C-40,175 40,175 70,150 C50,190 20,212 0,212 C-20,212 -50,190 -70,150 Z');
  function strokeHi(c, pts, w, col = 'rgba(255,244,205,.75)') { c.save(); c.strokeStyle = col; c.lineWidth = w; c.lineCap = 'round'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke(); c.restore(); }

  // ex: {brow: 'calm'|'angry'|'scared'|'sad', eyes: 0..1 open, wide, look:[x,y], mouth:0..1, smile, shout, sweat, tear}
  function face(c, who, x, y, s, ex, rot = 0) {
    const K = who === 'K';
    const skin = K ? '#d0875a' : '#e9a982', mid = K ? '#a9603c' : '#c97e5e', cool = K ? '#3d6f78' : '#6a6aa0';
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    // shoulders + neck
    const body = P('M-70,170 L70,170 L82,250 C210,262 310,320 340,440 L-340,440 C-310,320 -210,262 -82,250 Z');
    c.fillStyle = K ? '#c22a24' : '#b0125a'; c.fill(body);
    c.save(); c.clip(body); c.fillStyle = 'rgba(30,0,40,.35)'; c.fill(P('M-340,440 C-310,320 -210,262 -82,250 L-60,300 C-150,330 -220,380 -240,440 Z')); c.restore();
    if (K) { c.fillStyle = '#f4e3c0'; c.fill(P('M-82,250 L0,330 L82,250 L120,262 L40,360 L0,300 L-40,360 L-120,262 Z')); }
    else { c.fillStyle = Q.yellow; c.fill(P('M60,250 C120,270 220,300 300,440 L250,440 C190,320 110,280 46,262 Z')); }
    c.fillStyle = mid; c.fill(P('M-62,120 L62,120 L70,262 C30,280 -30,280 -70,262 Z'));
    // hair behind
    if (!K) { c.fillStyle = '#140c14'; c.fill(P('M-185,260 C-245,60 -215,-215 0,-255 C215,-215 245,60 185,260 C150,150 165,0 145,-80 C125,-170 40,-185 0,-190 C-40,-185 -125,-170 -145,-80 C-165,0 -150,150 -185,260 Z')); }
    // ears
    c.fillStyle = mid; c.beginPath(); c.ellipse(-150, -20, 26, 46, 0, 0, 7); c.ellipse(150, -20, 26, 46, 0, 0, 7); c.fill();
    if (!K) { c.fillStyle = Q.yellow; for (const sx of [-152, 152]) { c.beginPath(); c.moveTo(sx, 30); c.lineTo(sx - 22, 80); c.lineTo(sx + 22, 80); c.closePath(); c.fill(); c.beginPath(); c.arc(sx, 84, 22, 0, Math.PI); c.fill(); } }
    // head in tonal bands
    c.fillStyle = skin; c.fill(HEAD);
    c.save(); c.clip(HEAD);
    c.fillStyle = mid; c.fill(SHADE);
    c.globalAlpha = .42; c.fillStyle = cool; c.fill(SHADE2); c.globalAlpha = 1;
    c.fillStyle = mid; c.globalAlpha = .7; c.fill(JAW_SH); c.globalAlpha = 1;
    c.fillStyle = mid; c.fill(NOSE);
    c.globalAlpha = .5; c.fillStyle = K ? '#e08c8c' : '#f08a8a'; c.beginPath(); c.ellipse(80, 50, 40, 26, 0, 0, 7); c.fill(); c.globalAlpha = 1;
    c.restore();
    strokeHi(c, [[8, -150], [30, -170], [70, -160]], 16); strokeHi(c, [[10, -40], [12, 10], [16, 34]], 6); strokeHi(c, [[96, 14], [104, 22]], 8);
    // eyes
    const open = ex.eyes ?? 1, wide = ex.wide ? 1.25 : 1;
    for (const sx of [-62, 62]) {
      c.save(); c.translate(sx, -38); c.scale(wide, wide * Math.max(.08, open));
      const eye = P('M-42,0 C-22,-26 22,-26 42,0 C22,16 -22,16 -42,0 Z');
      c.fillStyle = '#fbf3e8'; c.fill(eye);
      c.save(); c.clip(eye);
      const [lx, ly] = ex.look || [0, 0];
      c.fillStyle = '#5a2a10'; c.beginPath(); c.arc(lx * 10, -3 + ly * 6, ex.wide ? 13 : 17, 0, 7); c.fill();
      c.fillStyle = '#100604'; c.beginPath(); c.arc(lx * 10, -3 + ly * 6, ex.wide ? 6 : 9, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(lx * 10 + 5, -9 + ly * 6, 4, 0, 7); c.fill();
      c.restore();
      c.strokeStyle = '#1a0806'; c.lineWidth = K ? 5 : 8; c.stroke(P('M-46,2 C-24,-28 24,-28 46,0'));
      if (!K) { c.lineWidth = 5; c.stroke(P('M44,0 L60,-10')); }
      c.restore();
    }
    // brows
    const b = ex.brow || 'calm';
    for (const sd of [-1, 1]) {
      c.save(); c.translate(sd * 62, -96); c.scale(sd, 1);
      const r = b === 'angry' ? .32 : b === 'scared' ? -.35 : b === 'sad' ? -.25 : 0;
      c.rotate(r); c.fillStyle = '#1a0a08';
      c.fill(P(K ? 'M44,6 C20,-16 -20,-14 -50,-4 L-48,10 C-18,2 18,-2 42,14 Z' : 'M44,4 C20,-12 -20,-12 -50,-2 L-48,6 C-18,0 18,-2 42,10 Z'));
      c.restore();
    }
    // mouth
    const m = ex.shout ? 1 : (ex.mouth || 0);
    c.save(); c.translate(0, 112);
    if (m > .3) {
      c.fillStyle = '#4a0a0a'; c.beginPath(); c.ellipse(0, 6, 40 + m * 14, 10 + m * (ex.shout ? 46 : 22), 0, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.fillRect(-30, -6 - m * 6, 60, 10);
      c.strokeStyle = K ? '#8e3a2a' : '#c4142c'; c.lineWidth = 9; c.beginPath(); c.ellipse(0, 6, 40 + m * 14, 10 + m * (ex.shout ? 46 : 22), 0, 0, 7); c.stroke();
    } else if (ex.smile) {
      c.fillStyle = K ? '#8e3a2a' : '#c4142c'; c.fill(P('M-46,-6 C-20,24 20,24 46,-6 C20,8 -20,8 -46,-6 Z'));
      strokeHi(c, [[-10, 10], [12, 10]], 4);
    } else {
      c.fillStyle = K ? '#8e3a2a' : '#c4142c';
      c.fill(P(b === 'angry' || b === 'sad' ? 'M-40,8 C-20,-8 20,-8 40,8 C20,4 -20,4 -40,8 Z M-34,8 C-14,18 14,18 34,8 Z' : 'M-40,0 C-20,-10 0,-6 0,-6 C0,-6 20,-10 40,0 C20,18 -20,18 -40,0 Z'));
      strokeHi(c, [[-8, 6], [10, 6]], 4);
    }
    c.restore();
    if (K) { c.fillStyle = '#1a0a08'; c.fill(P('M-56,80 C-30,64 30,64 56,80 C40,86 20,82 0,86 C-20,82 -40,86 -56,80 Z')); }
    // hair front
    c.fillStyle = K ? '#140c0a' : '#140c14';
    if (K) { c.fill(P('M-170,-10 C-200,-170 -100,-280 10,-272 C130,-275 210,-170 172,-10 C160,-90 135,-150 60,-162 C0,-140 -80,-172 -130,-124 C-150,-96 -160,-60 -170,-10 Z')); c.fillRect(-160, -40, 18, 90); c.fillRect(142, -40, 18, 90); }
    else c.fill(P('M-150,-60 C-160,-175 -80,-228 0,-218 C80,-228 160,-175 150,-60 C130,-135 70,-165 4,-174 L-4,-174 C-70,-165 -130,-135 -150,-60 Z'));
    strokeHi(c, K ? [[-60, -230], [20, -250], [100, -220]] : [[-90, -190], [-30, -212]], 10, 'rgba(90,140,220,.6)');
    if (!K) { c.fillStyle = Q.red; c.beginPath(); c.arc(0, -120, 13, 0, 7); c.fill(); c.fillRect(-4, -218, 8, 44); }
    if (ex.sweat) for (const [sx, sy] of [[120, -150], [-130, -120], [140, -70]]) { c.fillStyle = 'rgba(220,240,255,.9)'; c.fill(P(`M${sx},${sy} C${sx + 12},${sy + 18} ${sx + 12},${sy + 32} ${sx},${sy + 32} C${sx - 12},${sy + 32} ${sx - 12},${sy + 18} ${sx},${sy} Z`)); }
    if (ex.tear) { c.fillStyle = 'rgba(220,240,255,.95)'; c.fill(P('M70,-14 C82,10 82,30 70,34 C58,30 58,10 70,-14 Z')); }
    c.restore();
  }

  // ---------- backgrounds ----------
  function sunburst(c, cx, cy, a, b, t, n = 24) {
    c.fillStyle = a; c.fillRect(0, 0, W, H);
    c.fillStyle = b;
    const rot = t * .05;
    for (let i = 0; i < n; i++) { const a0 = rot + i / n * Math.PI * 2, a1 = a0 + Math.PI / n; c.beginPath(); c.moveTo(cx, cy); c.lineTo(cx + Math.cos(a0) * 2600, cy + Math.sin(a0) * 2600); c.lineTo(cx + Math.cos(a1) * 2600, cy + Math.sin(a1) * 2600); c.closePath(); c.fill(); }
    const g = c.createRadialGradient(cx, cy, 50, cx, cy, 1200); g.addColorStop(0, 'rgba(255,240,200,.45)'); g.addColorStop(1, 'rgba(0,0,0,.35)');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  function flames(c, t, base = H, col1 = Q.orange, col2 = Q.yellow) {
    for (const [col, h, sp] of [[Q.red, 520, 1.3], [col1, 400, 1.7], [col2, 260, 2.2]]) {
      c.fillStyle = col; c.beginPath(); c.moveTo(0, base);
      for (let x = 0; x <= W; x += 40) c.lineTo(x, base - h * (.55 + .45 * Math.abs(Math.sin(x * .011 + t * sp) * Math.cos(x * .004 - t))));
      c.lineTo(W, base); c.closePath(); c.fill();
    }
  }
  function bolt(c, x0, y0, x1, y1, w, col = Q.yellow) {
    const pts = [[x0, y0]]; const n = 7;
    for (let i = 1; i < n; i++) { const k = i / n; pts.push([lerp(x0, x1, k) + (i % 2 ? w : -w), lerp(y0, y1, k)]); }
    pts.push([x1, y1]);
    c.save(); c.strokeStyle = '#2a120c'; c.lineWidth = 34; c.lineJoin = 'miter'; c.beginPath(); pts.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
    c.strokeStyle = col; c.lineWidth = 20; c.stroke(); c.restore();
  }
  // 3D extruded painted title
  function title3d(c, text, x, y, size, font, face = Q.yellow, side = Q.red, depth = 14, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rot); c.font = `${size}px ${font}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.lineJoin = 'round';
    for (let i = depth; i > 0; i--) { c.fillStyle = side; c.fillText(text, i * .9, i); }
    c.strokeStyle = '#1a0806'; c.lineWidth = size * .07; c.strokeText(text, 0, 0);
    c.fillStyle = face; c.fillText(text, 0, 0);
    c.fillStyle = 'rgba(255,255,255,.35)'; c.save(); c.beginPath(); c.rect(-W, -size, 2 * W, size * .42); c.clip(); c.fillText(text, 0, 0); c.restore();
    c.restore();
  }
  function heart(c, x, y, s, col) { c.save(); c.translate(x, y); c.scale(s, s); c.fillStyle = col; c.fill(P('M0,30 C-60,-10 -40,-60 0,-30 C40,-60 60,-10 0,30 Z')); c.restore(); }

  // ---------- panels ----------
  function punch(t, t0, n = 1, gap = .28) { let z = 1; for (let i = 0; i < n; i++) { const k = t - (t0 + i * gap); if (k > 0) z *= 1 + .14 * easeOut(clamp(k / .08)); } return z; }
  function cam(c, z, cx = W / 2, cy = H / 2) { c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy); }
  function panel(c, t) {
    const b = beatAt(t).name;
    const drift = 1 + ((t * .012) % .08);
    if (b === 'open') {
      const ask = t > T('k02');
      sunburst(c, 960, 520, Q.teal, '#1aa3a0', t);
      cam(c, drift * punch(t, T('k02')), 960, 400);
      face(c, 'K', 960, 470, 1.55, { brow: ask ? 'scared' : 'calm', mouth: jaw(t, 'K'), wide: ask, look: ask ? [1, -.3] : [0, .4], sweat: ask });
      // the knife, raised like a sword
      c.save(); c.translate(1420, 700); c.rotate(-.5 + Math.sin(t * 14) * .05);
      c.fillStyle = '#d9dde0'; c.fill(P('M0,-20 L330,-24 C380,-10 380,10 330,20 L0,20 Z')); c.fillStyle = '#6b3a14'; c.fillRect(-150, -24, 150, 48); strokeHi(c, [[20, -10], [320, -12]], 6, 'rgba(255,255,255,.8)'); c.restore();
      return;
    }
    if (b === 'narr' && t < T('n03')) {
      sunburst(c, 960, 540, Q.purple, '#6a2c94', t);
      heart(c, 520, 560, 5.2, Q.red); strokeHi(c, [[400, 430], [460, 400]], 22);
      c.fillStyle = Q.cream; c.beginPath(); c.ellipse(1400, 640, 300, 90, 0, 0, 7); c.fill(); c.fillStyle = Q.yellow; c.beginPath(); c.ellipse(1400, 600, 210, 60, 0, 0, 7); c.fill();
      for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? Q.red : Q.green; c.beginPath(); c.arc(1260 + hash(i) * 280, 580 + hash(i + 2) * 40, 14, 0, 7); c.fill(); }
      title3d(c, 'PYAAR', 520, 220, 120, 'Bungee'); title3d(c, 'KHAANA', 1400, 220, 120, 'Bungee');
      title3d(c, 'VS', 960, 540, 170, 'Bungee', Q.red, Q.yellow, 16);
      if (t > T('n02') + .9) { bolt(c, 940, 0, 1000, 1080, 70); title3d(c, 'MOOD KHARAB!', 960, 790, 110, 'AlfaSlab', Q.cream, Q.red, 12, -.06); }
      return;
    }
    if (b === 'narr') {
      const cracked = t > T('n06') + .8;
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ff7aa8'); g.addColorStop(.6, '#ffb347'); g.addColorStop(1, '#ff5e3a');
      c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(960, 720, 260, 0, 7); c.fill();
      cam(c, drift, 960, 500);
      face(c, 'K', 700, 520, 1.1, { brow: 'calm', smile: true, look: [1, 0] }, .08);
      face(c, 'J', 1220, 500, 1.1, { brow: cracked ? 'angry' : 'calm', smile: !cracked, look: [-1, 0], eyes: cracked ? 1 : .8 }, -.08);
      if (!cracked) for (let i = 0; i < 6; i++) heart(c, 960 + Math.sin(i * 1.7 + t) * 120, 300 - ((t * 50 + i * 60) % 300), 1.2, Q.red);
      title3d(c, 'PYAAR KA TADKA', 960, 140, 100, 'Bungee', Q.yellow, Q.magenta, 12);
      if (cracked) bolt(c, 990, 0, 940, 1080, 50, '#fff');
      return;
    }
    const fridgeOn = t > E('j09') + .1 && t < T('j11');
    if (fridgeOn) {
      if (t < T('j10') || t > T('k07')) {
        // the fridge as the villain's lair
        const g = c.createRadialGradient(960, 520, 50, 960, 520, 900); g.addColorStop(0, '#c6ffd8'); g.addColorStop(.35, '#2fb36a'); g.addColorStop(1, '#06200f');
        c.fillStyle = g; c.fillRect(0, 0, W, H);
        cam(c, 1 + (t - E('j09')) * .03, 960, 560);
        for (let i = 0; i < 18; i++) { c.fillStyle = `rgba(220,255,230,${.06 + hash(i) * .06})`; c.beginPath(); c.ellipse(hash(i) * W, 900 - ((t * 40 + i * 50) % 500), 200, 60, 0, 0, 7); c.fill(); }
        c.save(); c.translate(960, 600); c.rotate(-.05);
        c.fillStyle = '#d99a2b'; c.fill(P('M-330,-60 C-330,-200 -150,-220 0,-180 C150,-220 330,-200 330,-60 L330,170 L-330,170 Z'));
        c.fillStyle = '#5c7a2c'; for (let i = 0; i < 12; i++) { c.globalAlpha = .75; c.beginPath(); c.arc(-260 + hash(i + 1) * 520, -120 + hash(i + 7) * 260, 14 + hash(i + 3) * 26, 0, 7); c.fill(); } c.globalAlpha = 1;
        // villain eyebrows on the bread
        c.fillStyle = '#1a0806'; c.fill(P('M-150,-40 L-40,0 L-40,20 L-160,-20 Z M150,-40 L40,0 L40,20 L160,-20 Z'));
        c.restore();
        title3d(c, 'EXP 14 JUL', 960, 170, 130, 'AlfaSlab', Q.cream, '#0b4a22', 12, -.04);
        if (t > T('k07')) { c.globalAlpha = .9; face(c, 'K', 1600, 330, .6, { brow: 'sad', mouth: jaw(t, 'K'), look: [-1, .5], sweat: true }); c.globalAlpha = 1; }
        return;
      }
      // "Haanji???" triple zoom on Karun
      sunburst(c, 960, 500, '#111', Q.red, t, 18);
      cam(c, punch(t, T('j10'), 3, .3), 960, 420);
      face(c, 'K', 960, 460, 1.7, { brow: 'scared', wide: true, mouth: .5, sweat: true, look: [0, -.2] });
      return;
    }
    if (b === 'enter') {
      const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#2a1a5e'); g.addColorStop(1, '#7a2a8a'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      cam(c, drift * punch(t, T('j01')), 960, 450);
      face(c, 'J', 960, 470, 1.45, { brow: 'angry', mouth: jaw(t, 'J'), look: [0, 0] }, Math.sin(t * 2) * .02);
      c.strokeStyle = 'rgba(220,230,255,.6)'; c.lineWidth = 4;
      for (let i = 0; i < 70; i++) { const x = (hash(i) * 2400 + t * 900) % 2400 - 300, y = (hash(i + 9) * 1300 + t * 1600) % 1300 - 100; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 50, y + 120); c.stroke(); }
      return;
    }
    if (b === 'sunday') {
      sunburst(c, 960, 380, '#4a0a0a', Q.red, t);
      flames(c, t, H + 40);
      cam(c, drift, 960, 450);
      face(c, 'J', 960, 430, 1.25, { brow: 'angry', mouth: jaw(t, 'J'), look: [0, 0] });
      title3d(c, 'SUNDAY', 960, 120, 140, 'Bungee', Q.yellow, Q.red, 14);
      if (t > T('j12')) title3d(c, 'JUNG KA DIN', 400, 560, 84, 'AlfaSlab', Q.cream, '#1a0806', 10, -.1);
      if (t > T('j13') + .4) title3d(c, '1 DIN KA DIVORCE', 1500, 600, 64, 'Bungee', Q.yellow, Q.magenta, 8, .12);
      return;
    }
    if (b === 'paapad' && t < T('k10') - .3) {
      sunburst(c, 960, 520, Q.magenta, '#e0408a', t);
      cam(c, drift, 960, 500);
      face(c, 'K', 820, 470, 1.3, { brow: 'sad', smile: !speaking(t, 'K'), mouth: jaw(t, 'K'), look: [1, 0] });
      if (t > T('k09')) {
        c.save(); c.translate(1360, 760); c.fillStyle = Q.cream; c.beginPath(); c.ellipse(0, 0, 260, 80, 0, 0, 7); c.fill(); c.fillStyle = Q.yellow; c.beginPath(); c.ellipse(0, -30, 190, 54, 0, 0, 7); c.fill();
        for (let i = 0; i < 16; i++) { c.fillStyle = i % 3 ? Q.red : Q.green; c.beginPath(); c.arc(-160 + hash(i) * 320, -50 + hash(i + 4) * 40, 12, 0, 7); c.fill(); }
        c.restore();
        for (let i = 0; i < 6; i++) { const a = t * 3 + i; c.fillStyle = '#fff'; c.save(); c.translate(1360 + Math.cos(a) * 280, 640 + Math.sin(a * 1.3) * 90); c.rotate(.785); c.fillRect(-6, -6, 12, 12); c.restore(); }
        title3d(c, 'PAAPAD CHAAT', 1360, 560, 90, 'Bungee', Q.yellow, Q.red, 10);
      }
      return;
    }
    if (b === 'paapad' && t < T('j14')) {
      sunburst(c, 960, 520, '#2a1a5e', '#3a2a7e', t);
      face(c, 'J', 960, 470, 1.4, { brow: 'angry', eyes: .55, look: [-1, 0] });
      return;
    }
    if (b === 'paapad') {
      sunburst(c, 960, 480, '#7a0000', Q.red, t * 4, 30);
      const sh = 12;
      c.translate((hash(Math.floor(t * 24)) - .5) * sh, (hash(Math.floor(t * 24) + 3) - .5) * sh);
      cam(c, punch(t, T('j14'), 2, .18), 960, 420);
      face(c, 'J', 960, 430, 1.8, { brow: 'angry', shout: true, wide: true, look: [0, 0] });
      title3d(c, 'KARUNNNN!!!', 960, 130, 170, 'Bungee', Q.yellow, '#1a0806', 16, -.04);
      return;
    }
    // argue + bread: split-screen face-off with a lightning divider
    const kTalk = !!speaking(t, 'K'), jTalk = !!speaking(t, 'J');
    c.save(); c.beginPath(); c.moveTo(0, 0); c.lineTo(1010, 0); c.lineTo(910, H); c.lineTo(0, H); c.clip();
    sunburst(c, 480, 540, Q.teal, '#1aa3a0', t);
    cam(c, kTalk ? 1.06 : 1, 480, 540);
    face(c, 'K', 480, 470, 1.2, { brow: t > T('j03') ? 'scared' : 'calm', mouth: jaw(t, 'K'), look: [1, 0], sweat: t > T('j08'), wide: t > T('j08') });
    c.restore();
    c.save(); c.beginPath(); c.moveTo(1010, 0); c.lineTo(W, 0); c.lineTo(W, H); c.lineTo(910, H); c.clip();
    sunburst(c, 1440, 540, Q.red, Q.orange, t);
    cam(c, jTalk ? 1.06 : 1, 1440, 540);
    face(c, 'J', 1440, 470, 1.2, { brow: 'angry', mouth: jaw(t, 'J'), look: [-1, 0] });
    c.restore();
    bolt(c, 1010, -20, 910, H + 20, 40);
    if (t > T('j05') && t < T('k05')) for (let i = 0; i < Math.min(5, Math.floor((t - T('j05')) * 2) + 1); i++) title3d(c, 'JYOTSNA?', 480 + (i % 2 ? 80 : -80), 140 + i * 90, 70 - i * 6, 'Bungee', Q.cream, Q.teal, 6, (i % 2 ? .08 : -.08));
    if (t > T('k05') + .6 && t < T('j07')) title3d(c, 'FIGHT MODE: ON', 960, 140, 110, 'Bungee', Q.yellow, Q.red, 14, -.04);
    if (t > T('j08') + .4 && b === 'bread') title3d(c, '2 MAHINE!', 1440, 140, 120, 'AlfaSlab', Q.cream, '#1a0806', 12, .05);
  }

  function poster(c, t, end) {
    sunburst(c, 960, 540, end ? Q.purple : Q.red, end ? '#6a2c94' : Q.orange, t);
    if (!end) {
      face(c, 'J', 1360, 390, .95, { brow: 'angry', look: [-1, 0] }, -.05);
      face(c, 'K', 560, 560, .85, { brow: 'scared', wide: true, sweat: true, look: [1, -.3] }, .05);
      title3d(c, 'पापड़', 960, 760, 220, 'Yatra', Q.yellow, '#7a0a0a', 18, -.04);
      title3d(c, 'EK SUNDAY. EK BREAD. EK JUNG.', 960, 940, 54, 'Bungee', Q.cream, '#1a0806', 6);
    } else {
      title3d(c, 'THE END', 960, 470, 220, 'Bungee', Q.yellow, Q.red, 18, -.03);
      title3d(c, 'Style 03 · Bollywood Hoarding', 960, 700, 64, 'AlfaSlab', Q.cream, '#1a0806', 6);
    }
  }

  // caption: a painted signboard strip
  function caption(c, t) {
    const l = lineAt(t);
    if (!l || t > TL.end_card) return;
    const a = clamp(l.age * 8) * clamp(l.left * 6);
    c.save(); c.globalAlpha = a;
    c.font = '50px AlfaSlab';
    const lines = balanceWrap(c, l.text, 1380);
    const w = Math.max(...lines.map(s => c.measureText(s).width)) + 120, h = lines.length * 62 + 50;
    c.translate(W / 2, 1000 - h / 2); c.rotate(-.012);
    c.fillStyle = '#1a0806'; c.fillRect(-w / 2 + 10, -h / 2 + 10, w, h);
    c.fillStyle = Q.yellow; c.fillRect(-w / 2, -h / 2, w, h);
    c.drawImage(STROKES, 0, 0, 600, 200, -w / 2, -h / 2, w, h);
    c.font = '32px Bungee'; c.fillStyle = l.spk === 'J' ? Q.magenta : l.spk === 'K' ? Q.teal : Q.purple;
    const nm = l.name.toUpperCase(), nw = c.measureText(nm).width + 30;
    c.fillRect(-w / 2 + 20, -h / 2 - 30, nw, 46); c.fillStyle = Q.cream; c.textBaseline = 'middle'; c.fillText(nm, -w / 2 + 35, -h / 2 - 6);
    c.font = '50px AlfaSlab'; c.fillStyle = '#2a0a06'; c.textAlign = 'center';
    lines.forEach((s, i) => c.fillText(s, 0, -h / 2 + 25 + 31 + i * 62));
    c.restore();
  }

  defineStyle({
    fps: 24,
    fonts: ['50px AlfaSlab', '50px Bungee', '50px Yatra'],
    init() {
      const [s, g] = layer(600, 200); const r = rng(4);
      for (let i = 0; i < 300; i++) { g.strokeStyle = `rgba(${r() < .5 ? '255,255,230' : '160,90,0'},${.05 + r() * .08})`; g.lineWidth = 2 + r() * 6; g.beginPath(); const x = r() * 600, y = r() * 200; g.moveTo(x, y); g.lineTo(x + 30 + r() * 60, y + (r() - .5) * 8); g.stroke(); }
      STROKES = s;
      // painterly brush-stroke texture over everything
      const [b, h] = layer(W, H);
      for (let i = 0; i < 2600; i++) { h.strokeStyle = `rgba(${r() < .5 ? '255,250,230' : '40,10,0'},${.025 + r() * .035})`; h.lineWidth = 3 + r() * 12; h.lineCap = 'round'; h.beginPath(); const x = r() * W, y = r() * H, a = r() * 6.28; h.moveTo(x, y); h.lineTo(x + Math.cos(a) * (20 + r() * 50), y + Math.sin(a) * (20 + r() * 50)); h.stroke(); }
      GRAIN = b;
    },
    draw(c, t) {
      c.save();
      if (t < TL.lead_in - .1) poster(c, t, false);
      else if (t > TL.end_card) poster(c, t, true);
      else panel(c, t);
      c.restore();
      c.drawImage(GRAIN, 0, 0);
      caption(c, t);
    },
  });
})();
