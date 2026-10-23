// Style 02: Neo-Kalighat. Swelling black brush outlines, flat watercolour fills with edge shading,
// blank unprimed paper, hinged cut-out puppetry. Captions are ink inscriptions across the top,
// the way Kalighat painters titled their pats.
(() => {
  const C = { ink: '#16110c', paper: '#efe4c8', indigo: '#2e3f86', ochre: '#d7a136', verm: '#cc4128', green: '#4f8a3a',
    skinK: '#c8935e', skinJ: '#e8c49a', white: '#f6efdf', black: '#1b1611', pink: '#e7a3a0', gold: '#d9b043' };
  let PAPER = null, TEXT = null;

  // ---------- path mini-language: [['M',x,y],['C',x1,y1,x2,y2,x,y],['Q',x1,y1,x,y],['L',x,y]] ----------
  function sample(cmds, seg = 14) {
    const pts = []; let cx = 0, cy = 0;
    for (const c of cmds) {
      if (c[0] === 'M' || c[0] === 'L') { cx = c[1]; cy = c[2]; pts.push([cx, cy]); }
      else if (c[0] === 'C') { const [, x1, y1, x2, y2, x, y] = c; for (let i = 1; i <= seg; i++) { const t = i / seg, u = 1 - t; pts.push([u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x, u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y]); } cx = x; cy = y; }
      else if (c[0] === 'Q') { const [, x1, y1, x, y] = c; for (let i = 1; i <= seg; i++) { const t = i / seg, u = 1 - t; pts.push([u * u * cx + 2 * u * t * x1 + t * t * x, u * u * cy + 2 * u * t * y1 + t * t * y]); } cx = x; cy = y; }
    }
    return pts;
  }
  function ellipse(cx, cy, rx, ry, rot = 0) { const p = []; for (let i = 0; i <= 48; i++) { const a = i / 48 * Math.PI * 2; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; p.push([cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]); } return p; }
  function polyPath(pts, close = true) { const p = new Path2D(); pts.forEach(([x, y], i) => i ? p.lineTo(x, y) : p.moveTo(x, y)); if (close) p.closePath(); return p; }
  // Brush ribbon whose width swells and tapers
  function brush(c, pts, wMin, wMax, seed = 1, closed = false, col = C.ink) {
    if (pts.length < 2) return;
    const L = [], R = []; const n = pts.length;
    for (let i = 0; i < n; i++) {
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
      let dx = b[0] - a[0], dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
      const s = i / (n - 1);
      let w = wMin + (wMax - wMin) * (.5 + .5 * Math.sin(s * 9.0 + seed * 2.3 + Math.sin(s * 3 + seed)));
      if (!closed) w *= Math.min(1, Math.sin(Math.PI * s) * 2.2 + .12);
      L.push([pts[i][0] - dy * w / 2, pts[i][1] + dx * w / 2]); R.push([pts[i][0] + dy * w / 2, pts[i][1] - dx * w / 2]);
    }
    c.fillStyle = col; c.fill(polyPath(L.concat(R.reverse())));
  }
  // Flat fill with darker shading hugging the contour (Kalighat modelling), then a swelling outline
  function paint(c, pts, fill, shade, seed, wMin = 4, wMax = 10, outline = true) {
    const p = polyPath(pts);
    c.fillStyle = fill; c.fill(p);
    if (shade) {
      c.save(); c.clip(p);
      for (const [w, a] of [[46, .10], [28, .14], [14, .2]]) { c.strokeStyle = shade; c.globalAlpha = a; c.lineWidth = w; c.lineJoin = 'round'; c.stroke(p); }
      c.restore();
    }
    if (outline) brush(c, pts.concat([pts[0], pts[1] || pts[0]]), wMin, wMax, seed, true);
  }
  const line = (c, cmds, a, b, seed) => brush(c, sample(cmds), a, b, seed, false);

  // ---------- figures ----------
  // pose: {armL, armR, mouth, brow 'calm'|'angry'|'worried', eyes 'open'|'wide'|'shut', tilt, ladle, plate, bundle, knife}
  function face(c, who, pose, t) {
    const K = who === 'K';
    const skin = K ? C.skinK : C.skinJ;
    // back hair / bun
    if (!K) { paint(c, ellipse(-62, -735, 62, 56), C.black, null, 3, 3, 7); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; c.fillStyle = C.white; c.beginPath(); c.arc(-62 + Math.cos(a) * 52, -735 + Math.sin(a) * 48, 9, 0, 7); c.fill(); } }
    // neck
    paint(c, sample([['M', -28, -640], ['L', 30, -640], ['L', 34, -585], ['L', -32, -585]]), skin, '#8a5a35', 4, 3, 6);
    // face (3/4 view, facing +x)
    const fc = [['M', -70, -740], ['C', -80, -800, -10, -830, 40, -805], ['C', 80, -785, 88, -730, 84, -700], ['L', 98, -676], ['C', 100, -668, 92, -662, 84, -660], ['C', 86, -640, 78, -612, 50, -600], ['C', 20, -592, -40, -600, -62, -640], ['C', -82, -670, -76, -715, -70, -740]];
    paint(c, sample(fc), skin, '#8a5a35', 5, 4, 9);
    // hair
    if (K) {
      paint(c, sample([['M', -78, -730], ['C', -96, -820, 0, -860, 60, -812], ['C', 70, -800, 74, -790, 70, -780], ['C', 30, -800, -20, -790, -50, -760], ['C', -55, -735, -66, -712, -78, -700]]), C.black, null, 6, 3, 7);
      for (let i = 0; i < 5; i++) { c.strokeStyle = C.black; c.lineWidth = 9; c.beginPath(); c.arc(-80 + i * 3, -760 + i * 20, 13, 0, 7); c.stroke(); }
    } else {
      paint(c, sample([['M', -76, -720], ['C', -90, -825, 10, -858, 66, -806], ['C', 76, -792, 80, -775, 78, -760], ['C', 40, -792, -10, -790, -40, -770], ['C', -50, -740, -58, -690, -66, -640], ['C', -86, -670, -84, -700, -76, -720]]), C.black, null, 7, 3, 7);
      brush(c, sample([['M', 10, -836], ['Q', 18, -806, 20, -790]]), 4, 7, 2, false, C.verm);  // sindoor
    }
    // ear + earring
    paint(c, ellipse(-28, -705, 14, 22), skin, null, 8, 2, 5);
    if (!K) { c.fillStyle = C.gold; c.beginPath(); c.arc(-28, -672, 10, 0, 7); c.fill(); brush(c, ellipse(-28, -672, 10, 10), 2, 3, 9, true); }
    // brow flowing into the nose: the Kalighat signature line
    const b = pose.brow || 'calm';
    const by = b === 'angry' ? 8 : b === 'worried' ? -8 : 0;
    line(c, [['M', -14, -748 - by * .4], ['C', 10, -770 + by, 50, -768 + by, 70, -746 + by], ['C', 78, -730, 86, -700, 96, -678]], 2, 6.5, 11);
    if (b === 'angry') line(c, [['M', 10, -760], ['L', 48, -752]], 3, 6, 12);
    // eyes: big almond, pupil kissing the top lid
    const eyeW = pose.eyes === 'wide' ? 1.2 : 1;
    const lx = 40;
    if (pose.eyes === 'shut') line(c, [['M', lx - 30, -726], ['Q', lx, -716, lx + 30, -728]], 2, 5, 13);
    else {
      const eye = sample([['M', lx - 32, -726], ['Q', lx, -752 * 1 - (eyeW - 1) * 30, lx + 34, -730], ['Q', lx, -712 + (eyeW - 1) * 20, lx - 32, -726]]);
      c.fillStyle = '#fbf6ea'; c.fill(polyPath(eye));
      c.save(); c.clip(polyPath(eye)); c.fillStyle = C.ink; c.beginPath(); c.arc(lx + 8 + (pose.look || 0) * 6, -737, eyeW > 1 ? 9 : 12, 0, 7); c.fill(); c.restore();
      brush(c, eye, 1.5, 4.5, 14, true);
      line(c, [['M', lx - 34, -726], ['L', lx - 48, -722]], 1, 3, 15);
    }
    // far eye (smaller, behind the nose)
    if (pose.eyes !== 'shut') { c.fillStyle = C.ink; c.beginPath(); c.ellipse(84, -730, 4, 7, 0, 0, 7); c.fill(); }
    // moustache (Karun) with curled ends
    if (K) { line(c, [['M', 94, -656], ['C', 82, -664, 60, -658, 50, -646], ['C', 44, -636, 52, -630, 60, -637]], 5, 11, 16); }
    // bindi
    if (!K) { c.fillStyle = C.verm; c.beginPath(); c.arc(64, -760, 7, 0, 7); c.fill(); }
    // mouth: small red lips, or an open mouth while talking
    const m = pose.mouth || 0;
    if (m > .4) { paint(c, ellipse(70, -628, 12, 6 + m * 9), '#5a1c14', null, 17, 2, 4); }
    else if (pose.frown) line(c, [['M', 56, -622], ['Q', 70, -632, 82, -624]], 2, 5, 18);
    else { c.fillStyle = C.verm; c.beginPath(); c.ellipse(72, -626, 13, 5.5, -.1, 0, 7); c.fill(); line(c, [['M', 58, -626], ['L', 86, -627]], 1.5, 3, 19); }
  }
  function arm(c, x, y, ang, sleeve, skin, seed, hold) {
    c.save(); c.translate(x, y); c.rotate(ang);
    paint(c, sample([['M', -32, 0], ['C', -40, 120, -36, 200, -26, 330], ['L', 26, 330], ['C', 36, 200, 40, 120, 32, 0]]), skin, '#8a5a35', seed, 3, 8);
    paint(c, sample([['M', -40, -10], ['C', -46, 60, -44, 120, -38, 170], ['L', 38, 170], ['C', 44, 120, 46, 60, 40, -10]]), sleeve.fill, sleeve.shade, seed + 1, 3, 8);
    paint(c, ellipse(0, 352, 30, 36), skin, '#8a5a35', seed + 2, 3, 7);
    if (hold) hold(c);
    c.restore();
  }
  function figure(c, who, x, y, s, dir, pose, t) {
    const K = who === 'K';
    const skin = K ? C.skinK : C.skinJ;
    s *= .8;
    c.save(); c.translate(x, y); c.scale(s * dir, s); c.rotate(pose.tilt || 0);
    const sl = K ? { fill: C.ochre, shade: '#8a5a12' } : { fill: C.green, shade: '#24461a' };
    // far arm
    arm(c, -110, -590, pose.armL ?? .15, sl, skin, 30, pose.holdL);
    if (K) {
      paint(c, sample([['M', -110, -390], ['C', -150, -210, -150, -60, -126, 0], ['L', 130, 0], ['C', 152, -60, 150, -210, 112, -390]]), C.white, '#9c9070', 31);
      for (const px of [-30, 10, 50]) line(c, [['M', px, -360], ['C', px - 10, -240, px + 10, -120, px - 4, -20]], 2, 5, 32 + px);
      paint(c, sample([['M', -128, -605], ['C', -175, -560, -168, -420, -140, -340], ['C', -40, -320, 60, -320, 150, -340], ['C', 172, -420, 176, -560, 128, -605], ['C', 60, -630, -60, -630, -128, -605]]), C.ochre, '#8a5a12', 33);
      for (let i = 0; i < 4; i++) { c.fillStyle = C.ink; c.beginPath(); c.arc(22, -560 + i * 46, 5, 0, 7); c.fill(); }
    } else {
      paint(c, sample([['M', -130, -420], ['C', -175, -220, -205, -70, -182, 0], ['L', 184, 0], ['C', 205, -70, 175, -220, 132, -420]]), C.white, '#9c9070', 34);
      c.save(); c.clip(polyPath(sample([['M', -130, -420], ['C', -175, -220, -205, -70, -182, 0], ['L', 184, 0], ['C', 205, -70, 175, -220, 132, -420]])));
      c.fillStyle = C.verm; c.fillRect(-220, -46, 440, 46); c.fillStyle = C.gold; c.fillRect(-220, -54, 440, 8); c.restore();
      for (const px of [-60, 0, 60, 110]) line(c, [['M', px * .8, -400], ['C', px, -260, px * 1.1, -120, px * 1.15, -10]], 2, 4, 35 + px);
      paint(c, sample([['M', -122, -605], ['C', -168, -560, -160, -460, -140, -400], ['C', -40, -386, 60, -386, 142, -400], ['C', 164, -460, 170, -560, 122, -605], ['C', 60, -628, -60, -628, -122, -605]]), C.green, '#24461a', 36);
      // pallu across the chest
      paint(c, sample([['M', -128, -600], ['C', -60, -560, 60, -470, 150, -380], ['L', 130, -330], ['C', 40, -400, -60, -480, -150, -520]]), C.white, '#9c9070', 37);
      brush(c, sample([['M', -140, -560], ['C', -60, -520, 60, -430, 140, -356]]), 10, 14, 38, false, C.verm);
    }
    c.save(); c.translate(0, -620); c.scale(1.22, 1.22); c.translate(0, 620); face(c, who, pose, t); c.restore();
    // near arm
    arm(c, 115, -590, pose.armR ?? -.15, sl, skin, 40, pose.holdR);
    c.restore();
  }

  // held props, drawn in hand space (hand at 0,352)
  const ladle = c => { c.save(); c.translate(0, 352); c.rotate(.7); line(c, [['M', 0, 0], ['L', 150, 0]], 12, 16, 50); paint(c, ellipse(180, 0, 40, 28), '#9aa0a3', '#4d5356', 51); c.restore(); };
  const knife = c => { c.save(); c.translate(0, 352); c.rotate(-1.4); paint(c, sample([['M', 0, -12], ['L', 70, -12], ['L', 70, 12], ['L', 0, 12]]), '#6b4520', null, 52, 2, 5); paint(c, sample([['M', 70, -14], ['L', 220, -10], ['Q', 260, 0, 230, 14], ['L', 70, 14]]), '#b9bec1', '#5c6266', 53, 2, 6); c.restore(); };
  const plate = c => { c.save(); c.translate(0, 352); c.rotate(.15); paint(c, ellipse(110, -20, 140, 42), '#7a9a4a', '#365020', 54, 3, 7); paint(c, ellipse(110, -36, 100, 26), C.ochre, '#8a5a12', 55, 2, 5); for (let i = 0; i < 14; i++) { c.fillStyle = i % 2 ? C.verm : C.green; c.beginPath(); c.arc(40 + hash(i) * 140, -44 + hash(i + 3) * 18, 6, 0, 7); c.fill(); } c.restore(); };
  const bundle = c => { c.save(); c.translate(0, 352); paint(c, sample([['M', -150, -40], ['C', -160, -120, 160, -130, 150, -40], ['C', 160, 20, -160, 30, -150, -40]]), C.indigo, '#141c40', 56); for (let i = 0; i < 4; i++) line(c, [['M', -120 + i * 70, -90], ['Q', -100 + i * 70, -40, -120 + i * 70, 10]], 2, 4, 57 + i); c.restore(); };

  // ---------- still-life pieces ----------
  function heartShape(cx, cy, s) { const p = []; for (let i = 0; i < 48; i++) { const a = i / 48 * Math.PI * 2; p.push([cx + 16 * Math.pow(Math.sin(a), 3) * s, cy - (13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a)) * s]); } return p; }
  function fridge(c, x, y, open, t) {
    c.save(); c.translate(x, y);
    paint(c, sample([['M', -170, -760], ['C', -180, -780, 180, -780, 170, -760], ['L', 176, 0], ['L', -176, 0]]), '#c9d7e2', '#56708a', 60, 5, 11);
    if (open > 0) {
      paint(c, sample([['M', -140, -720], ['L', 140, -720], ['L', 146, -40], ['L', -146, -40]]), '#eaf4f6', '#7fa3b4', 61, 3, 7);
      line(c, [['M', -140, -470], ['L', 140, -470]], 4, 7, 62); line(c, [['M', -140, -250], ['L', 140, -250]], 4, 7, 63);
      // bread
      paint(c, sample([['M', -110, -300], ['C', -120, -360, -40, -380, 0, -360], ['C', 40, -380, 120, -360, 110, -300], ['L', 110, -256], ['L', -110, -256]]), C.ochre, '#8a5a12', 64);
      for (let i = 0; i < 9; i++) { c.fillStyle = '#5c7a2c'; c.globalAlpha = .7; c.beginPath(); c.arc(-80 + hash(i + 3) * 160, -330 + hash(i) * 60, 6 + hash(i + 9) * 10, 0, 7); c.fill(); }
      c.globalAlpha = 1;
      paint(c, ellipse(-60, -540, 40, 50), C.verm, '#6a1a0e', 65); paint(c, ellipse(60, -560, 50, 36), C.green, '#24461a', 66);
      // door swung open to the left
      c.save(); c.translate(-176, 0); c.scale(-open * .5, 1);
      paint(c, sample([['M', 0, -760], ['L', 340, -760], ['L', 340, 0], ['L', 0, 0]]), '#c9d7e2', '#56708a', 67, 5, 11);
      c.restore();
    } else { line(c, [['M', 130, -560], ['L', 130, -420]], 8, 12, 68); line(c, [['M', -170, -520], ['L', 170, -520]], 3, 6, 69); }
    c.restore();
  }

  // ---------- inscription captions across the top ----------
  function caption(c, t) {
    const l = lineAt(t);
    if (!l) return;
    const a = clamp(l.age * 5) * clamp(l.left * 5);
    c.save(); c.globalAlpha = a;
    c.font = '700 60px Kalam';
    const lines = balanceWrap(c, l.text, 1500);
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    const y0 = 128;
    c.font = '700 40px Amita'; c.fillStyle = C.verm;
    c.fillText(l.name, W / 2, y0 - 50);
    c.font = '700 60px Kalam'; c.fillStyle = C.ink;
    lines.forEach((s, i) => c.fillText(s, W / 2, y0 + 20 + i * 70));
    c.restore();
  }

  // ---------- scenes ----------
  const cam = (c, s, x, y) => { c.translate(W / 2, H / 2); c.scale(s, s); c.translate(-x, -y); };
  function scene(c, t) {
    const b = beatAt(t).name;
    const fridgeOn = t > E('j09') + .1 && t < T('j11') - .3;
    if (b === 'open') {
      const k = inv(TL.lead_in, T('n01'), t);
      cam(c, lerp(1.0, 1.08, k), 900, 640);
      const chop = Math.sin(t * 15) > 0;
      const ask = t > T('k02');
      figure(c, 'K', 800, 1080, 1.0, 1, { armL: .3, armR: ask ? -.9 : (chop ? -.55 : -.35), holdR: knife, mouth: jaw(t, 'K'), brow: ask ? 'worried' : 'calm', eyes: ask ? 'wide' : 'open', look: ask ? 1 : 0 }, t);
      paint(c, sample([['M', 900, 960], ['L', 1260, 960], ['L', 1250, 1020], ['L', 910, 1020]]), '#a8713c', '#5a3510', 70);
      for (let i = 0; i < 4; i++) paint(c, ellipse(980 + i * 60, 950, 26, 18), '#a33a6a', '#4a1030', 71 + i, 2, 5);
      if (ask) for (let i = 0; i < 3; i++) line(c, [['M', 1150 + i * 30, 300 + i * 50], ['Q', 1230 + i * 30, 270 + i * 50, 1300 + i * 30, 300 + i * 50]], 3, 8, 75 + i);
      return;
    }
    if (b === 'narr' && t < T('n03')) {
      // still-life pat: the heart and the plate, then the chilli of one wrong decision
      cam(c, 1.0, W / 2, 560);
      paint(c, sample([['M', 980, 820], ['C', 1100, 600, 1500, 600, 1620, 820], ['C', 1500, 900, 1100, 900, 980, 820]]), '#6f9a44', '#2e4a18', 80);
      line(c, [['M', 990, 820], ['L', 1610, 818]], 3, 6, 81);
      paint(c, ellipse(1300, 770, 170, 50), C.white, '#9c9070', 82); paint(c, ellipse(1300, 750, 120, 34), C.ochre, '#8a5a12', 83);
      const crack = t > T('n02') + 1.0;
      const hx = 620;
      if (!crack) paint(c, heartShape(hx, 560, 15), C.verm, '#6a1a0e', 84, 5, 11);
      else {
        const k = easeOut(clamp((t - T('n02') - 1) * 2));
        c.save(); c.translate(-30 * k, 10 * k); c.rotate(-.12 * k); c.save(); c.beginPath(); c.rect(0, 0, hx + 6, H); c.clip(); paint(c, heartShape(hx, 560, 15), C.verm, '#6a1a0e', 85, 5, 11); c.restore(); c.restore();
        c.save(); c.translate(30 * k, 10 * k); c.rotate(.12 * k); c.save(); c.beginPath(); c.rect(hx - 6, 0, W, H); c.clip(); paint(c, heartShape(hx, 560, 15), C.verm, '#6a1a0e', 86, 5, 11); c.restore(); c.restore();
      }
      const drop = inv(T('n02') + .3, T('n02') + 1.0, t);
      if (drop > 0) { c.save(); c.translate(1300, lerp(-200, 690, easeIn(drop))); c.rotate(.9); paint(c, sample([['M', -18, -100], ['C', 20, -100, 30, 40, 0, 110], ['C', -20, 40, -40, -60, -18, -100]]), C.verm, '#6a1a0e', 87); line(c, [['M', -14, -100], ['Q', -30, -140, 0, -150]], 4, 8, 88); c.restore(); }
      return;
    }
    if (b === 'narr') {
      cam(c, 1.0, W / 2, 560);
      const irritated = t > T('n06') + .8;
      figure(c, 'K', 730, 1080, .95, 1, { armL: .2, armR: -.7, holdR: ladle, brow: 'calm', look: 1 }, t);
      figure(c, 'J', 1190, 1080, .95, -1, { armL: .2, armR: irritated ? -.15 : -1.3, brow: irritated ? 'angry' : 'calm', frown: irritated, look: 0 }, t);
      if (!irritated) for (let i = 0; i < 5; i++) { const yy = 440 - ((t * 60 + i * 90) % 360); paint(c, heartShape(960 + Math.sin(i * 2 + t) * 80, yy + 120, 2.2), C.verm, null, 90 + i, 2, 4); }
      else { line(c, [['M', 1180, 160], ['L', 1230, 230], ['L', 1200, 240], ['L', 1260, 320]], 6, 12, 96); line(c, [['M', 1320, 170], ['L', 1290, 240], ['L', 1320, 246], ['L', 1290, 320]], 6, 12, 97); }
      return;
    }
    if (fridgeOn || b === 'fridge') {
      const open = easeOut(clamp((t - (E('j09') + .1)) / .7));
      cam(c, lerp(1.0, 1.08, clamp((t - E('j09')) / 6)), 1000, 600);
      figure(c, 'K', 480, 1080, .95, 1, { armL: .3, armR: -1.1, eyes: t > T('j10') ? 'wide' : 'open', brow: 'worried', mouth: jaw(t, 'K'), look: 1 }, t);
      c.save(); c.translate(1000, 1050); c.scale(.85, .85); fridge(c, 0, 0, open, t); c.restore();
      if (open > .8) {
        c.save(); c.translate(1000, 810); c.rotate(-.06); c.font = '700 40px Kalam'; c.fillStyle = C.ink; c.textAlign = 'center'; c.fillText('Exp. 14 July', 0, 0); c.restore();
        if (t > T('j10') + .5) { c.save(); c.translate(1330, 470); c.rotate(.1); c.font = '700 64px Amita'; c.fillStyle = C.verm; c.textAlign = 'center'; c.fillText('२ महीने!', 0, 0); c.restore(); }
      }
      figure(c, 'J', 1560, 1080, .95, -1, { armL: .2, armR: -.4, brow: 'angry', mouth: jaw(t, 'J'), frown: !speaking(t, 'J') }, t);
      return;
    }
    if (b === 'sunday') {
      cam(c, 1.06, 960, 600);
      // a painted sun with a cross through it
      paint(c, ellipse(1350, 470, 120, 120), C.gold, '#8a5a12', 100);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(c, [['M', 1350 + Math.cos(a) * 140, 470 + Math.sin(a) * 140], ['L', 1350 + Math.cos(a) * 200, 470 + Math.sin(a) * 200]], 3, 8, 101 + i); }
      if (t > T('j12')) { line(c, [['M', 1180, 300], ['L', 1520, 640]], 10, 20, 115); }
      if (t > T('j13') + .3) {
        c.save(); c.translate(1350, 820); c.rotate(-.05);
        paint(c, sample([['M', -230, -80], ['L', 230, -80], ['L', 230, 80], ['L', -230, 80]]), '#f3e2b5', '#9c8050', 116);
        c.font = '700 40px Kalam'; c.fillStyle = C.ink; c.textAlign = 'center'; c.fillText('Talaq-naama', 0, -20); c.fillText('(sirf 1 din)', 0, 34); c.restore();
      }
      figure(c, 'J', 700, 1080, 1.0, 1, { armL: .4, armR: -1.1, brow: 'angry', mouth: jaw(t, 'J'), eyes: speaking(t, 'J') ? 'open' : 'shut', frown: !speaking(t, 'J') }, t);
      return;
    }
    // enter / argue / bread / paapad: the classic domestic quarrel pat
    const enterK = b === 'enter' ? easeOut(clamp((t - beatAt(t).start) / 1.4)) : 1;
    const yell = t > T('j14');
    const gone = b === 'paapad' && t > T('k10') - .4;
    const ang = t > T('j01') && !(b === 'paapad' && t < T('k10'));
    cam(c, yell ? 1.12 : lerp(1.0, 1.05, Math.sin(t * .2) * .5 + .5), yell ? 1100 : 960, yell ? 640 : 600);
    if (!gone) figure(c, 'K', 720, 1080, .98, 1, {
      armL: .25, armR: b === 'paapad' ? -1.2 : (t > T('k05') && t < T('j06') ? -1.3 : -.4), holdR: b === 'paapad' ? plate : null,
      mouth: jaw(t, 'K'), brow: t > T('j03') && b !== 'paapad' ? 'worried' : 'calm', look: 1, eyes: t > T('j08') && b === 'bread' ? 'wide' : 'open',
    }, t);
    else { c.save(); c.translate(380 + (t - T('k10')) * 40, 1075); c.scale(.32, .32); figure(c, 'K', 0, 0, 1, -1, { armL: 1.2, armR: -1.2, brow: 'worried', mouth: jaw(t, 'K') }, t); c.restore(); }
    const raise = (t > T('j05') && t < T('k05')) || yell || (t > T('j07') && b === 'bread');
    figure(c, 'J', lerp(1900, 1200, enterK), 1080 + (yell ? Math.sin(t * 60) * 6 : 0), yell ? 1.06 : .98, -1, {
      armL: b === 'enter' ? -.4 : .2, holdL: b === 'enter' ? bundle : null,
      armR: raise ? -2.4 : -.3, holdR: raise ? ladle : null,
      mouth: yell ? 1 : jaw(t, 'J'), brow: ang ? 'angry' : 'calm', eyes: yell ? 'wide' : 'open', frown: ang && !speaking(t, 'J'),
    }, t);
    if (b === 'enter') for (let i = 0; i < 26; i++) { const rx = (hash(i) * 2200 + t * 40) % 2000, ry = (hash(i + 4) * 1100 + t * 600) % 1100; line(c, [['M', rx, ry], ['L', rx - 14, ry + 50]], 2, 4, 120 + i); }
    if (yell) for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; line(c, [['M', 1200 + Math.cos(a) * 260, 520 + Math.sin(a) * 200], ['L', 1200 + Math.cos(a) * 360, 520 + Math.sin(a) * 280]], 5, 12, 140 + i); }
  }

  function titleCard(c, end) {
    c.save(); c.textAlign = 'center';
    c.font = '700 260px Amita'; c.fillStyle = C.ink; c.fillText(end ? 'समाप्त' : 'पापड़', W / 2, 560);
    c.font = '700 70px Kalam'; c.fillStyle = C.verm; c.fillText(end ? 'Style 02 · Neo-Kalighat' : 'Paapad · Kahaani No. 02', W / 2, 700);
    // red seal
    c.translate(W / 2 + 380, 820); c.rotate(-.08);
    c.fillStyle = C.verm; c.fillRect(-60, -60, 120, 120); c.fillStyle = C.paper; c.font = '700 54px Amita'; c.textBaseline = 'middle'; c.fillText('पा', 0, 4);
    c.restore();
  }

  defineStyle({
    fps: 12,
    fonts: ['700 60px Kalam', '700 60px Amita', '700 60px Amita'],
    init() {
      const [p, g] = layer(W, H);
      g.fillStyle = C.paper; g.fillRect(0, 0, W, H);
      const r = rng(5);
      for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(150,110,50,${.008 + r() * .018})`; g.beginPath(); g.ellipse(r() * W, r() * H, 20 + r() * 160, 20 + r() * 120, r() * 3, 0, 7); g.fill(); }
      for (let i = 0; i < 400; i++) { g.strokeStyle = `rgba(120,90,40,${.05 + r() * .08})`; g.lineWidth = .7; g.beginPath(); const x = r() * W, y = r() * H; g.moveTo(x, y); g.lineTo(x + (r() - .5) * 30, y + (r() - .5) * 30); g.stroke(); }
      const vg = g.createRadialGradient(W / 2, H / 2, 400, W / 2, H / 2, 1150); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,60,20,.35)');
      g.fillStyle = vg; g.fillRect(0, 0, W, H);
      PAPER = p;
      TEXT = grainCanvas(W, H, 40, 9);
    },
    draw(c, t) {
      c.drawImage(PAPER, 0, 0);
      if (t < TL.lead_in - .2) titleCard(c, false);
      else if (t > TL.end_card) titleCard(c, true);
      else { c.save(); scene(c, t); c.restore(); caption(c, t); }
      c.globalCompositeOperation = 'soft-light'; c.globalAlpha = .55; c.drawImage(TEXT, 0, 0);
      c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
    },
  });
})();
