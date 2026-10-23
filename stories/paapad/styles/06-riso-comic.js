// Style 06: Two-ink risograph comic. Fluoro pink + blue only, overprinting to purple, halftone tones,
// a little misregistration and ink voids. Every line of dialogue is its own panel; panels build a
// comic page as the scene plays, and the speech bubbles are the captions.
(() => {
  const INK = { P: '#ff4fa8', B: '#1f6fd0' };
  const PAPER = '#f5f0e4';
  const PAT = {};
  let VOIDS = null, MIS = [0, 0];
  const P = s => new Path2D(s);

  function dotPattern(col, step, r) {
    const [cv, g] = layer(step, step);
    g.fillStyle = col; g.beginPath(); g.arc(step / 2, step / 2, r, 0, 7); g.fill();
    g.beginPath(); g.arc(0, 0, r, 0, 7); g.arc(step, 0, r, 0, 7); g.arc(0, step, r, 0, 7); g.arc(step, step, r, 0, 7); g.fill();
    return ctx.createPattern(cv, 'repeat');
  }
  // fill/stroke with one ink; tone 1 = solid, otherwise a halftone
  function fillI(c, path, ink, tone = 1) {
    c.save(); c.globalCompositeOperation = 'multiply';
    if (ink === 'P') c.translate(MIS[0], MIS[1]);
    c.fillStyle = tone >= 1 ? INK[ink] : PAT[ink + (tone < .3 ? 1 : tone < .55 ? 2 : 3)];
    c.fill(path); c.restore();
  }
  function strokeI(c, path, ink, w = 6) {
    c.save(); c.globalCompositeOperation = 'multiply'; if (ink === 'P') c.translate(MIS[0], MIS[1]);
    c.strokeStyle = INK[ink]; c.lineWidth = w; c.lineJoin = 'round'; c.lineCap = 'round'; c.stroke(path); c.restore();
  }
  const paperFill = (c, path) => { c.save(); c.fillStyle = PAPER; c.fill(path); c.restore(); };
  function textI(c, s, x, y, font, ink, align = 'center') { c.save(); c.globalCompositeOperation = 'multiply'; if (ink === 'P') c.translate(MIS[0], MIS[1]); c.font = font; c.fillStyle = INK[ink]; c.textAlign = align; c.textBaseline = 'middle'; c.fillText(s, x, y); c.restore(); }
  function sfx(c, s, x, y, size, rot = 0) {
    c.save(); c.translate(x, y); c.rotate(rot); c.font = `${size}px Bowlby`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.globalCompositeOperation = 'multiply';
    c.strokeStyle = INK.B; c.lineWidth = size * .14; c.lineJoin = 'round'; c.strokeText(s, 0, 0);
    c.translate(MIS[0], MIS[1]); c.fillStyle = INK.P; c.fillText(s, 0, 0); c.restore();
  }
  const ellipseP = (x, y, rx, ry) => { const p = new Path2D(); p.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); return p; };
  const rectP = (x, y, w, h) => { const p = new Path2D(); p.rect(x, y, w, h); return p; };

  // ---------- cartoon characters (waist up, origin at the neck) ----------
  // ex: {eyes:'open'|'wide'|'happy'|'shut'|'side', brow:'calm'|'angry'|'worried', mouth:0..1, smile, frown, sweat, blush, arms:'down'|'up'|'point'|'cross'|'thumb'|'hold', look}
  function toon(c, who, x, y, s, ex = {}) {
    const K = who === 'K';
    c.save(); c.translate(x, y); c.scale(s, s);
    const body = K ? P('M-150,30 C-150,0 -60,-6 0,-6 C60,-6 150,0 150,30 L170,400 L-170,400 Z') : P('M-140,30 C-140,0 -60,-6 0,-6 C60,-6 140,0 140,30 L180,400 L-180,400 Z');
    fillI(c, body, K ? 'B' : 'P', K ? .45 : 1); strokeI(c, body, 'B', 6);
    if (!K) { fillI(c, P('M-120,40 C-40,120 60,200 150,320 L120,340 C40,230 -40,150 -130,80 Z'), 'B', .25); }
    if (K) { const col = P('M-50,-4 L0,50 L50,-4'); strokeI(c, col, 'B', 6); }
    // arms
    const arms = ex.arms || 'down';
    const armPath = {
      down: ['M-150,40 C-190,140 -190,240 -170,320', 'M150,40 C190,140 190,240 170,320'],
      up: ['M-150,40 C-230,-20 -250,-120 -230,-200', 'M150,40 C230,-20 250,-120 230,-200'],
      point: ['M-150,40 C-190,140 -190,240 -170,320', 'M150,40 C230,30 320,10 400,-10'],
      cross: ['M-150,60 C-60,140 60,150 150,120', 'M150,60 C60,140 -60,150 -150,120'],
      thumb: ['M-150,40 C-190,140 -190,240 -170,320', 'M150,40 C230,60 280,0 280,-70'],
      hold: ['M-150,40 C-160,120 -60,170 40,170', 'M150,40 C200,120 220,160 260,170'],
    }[arms];
    for (const a of armPath) { strokeI(c, P(a), 'B', 46); strokeI(c, P(a), K ? 'B' : 'P', 34); }
    const hands = { up: [[-230, -210], [230, -210]], point: [[400, -10]], thumb: [[280, -80]], hold: [[40, 170], [260, 170]] }[arms] || [];
    for (const [hx, hy] of hands) { const h = ellipseP(hx, hy, 30, 30); fillI(c, h, 'P', .25); strokeI(c, h, 'B', 6); }
    if (arms === 'thumb') strokeI(c, P('M280,-110 L280,-150'), 'B', 18);
    // neck + head
    const neck = rectP(-34, -60, 68, 64); fillI(c, neck, 'P', .25); strokeI(c, neck, 'B', 5);
    const head = P('M0,-300 C80,-300 128,-250 128,-170 C128,-90 80,-40 0,-40 C-80,-40 -128,-90 -128,-170 C-128,-250 -80,-300 0,-300 Z');
    paperFill(c, head); fillI(c, head, 'P', .25); strokeI(c, head, 'B', 6);
    // ears
    for (const sx of [-1, 1]) { const e = ellipseP(sx * 128, -160, 18, 28); fillI(c, e, 'P', .25); strokeI(c, e, 'B', 5); }
    // hair
    if (K) fillI(c, P('M-132,-170 C-150,-300 -40,-340 20,-322 C110,-330 160,-270 130,-170 C120,-230 80,-262 30,-260 L40,-230 L0,-258 C-60,-262 -110,-230 -132,-170 Z'), 'B');
    else { fillI(c, P('M-140,-90 C-170,-300 -40,-332 0,-322 C40,-332 170,-300 140,-90 C140,-170 120,-250 0,-268 C-120,-250 -140,-170 -140,-90 Z'), 'B'); fillI(c, ellipseP(0, -330, 56, 44), 'B'); fillI(c, ellipseP(0, -232, 10, 10), 'P'); }
    // face
    const lx = (ex.look || 0) * 12, eyes = ex.eyes || 'open';
    for (const sx of [-48, 48]) {
      if (eyes === 'happy') strokeI(c, P(`M${sx - 22},-160 Q${sx},-186 ${sx + 22},-160`), 'B', 7);
      else if (eyes === 'shut') strokeI(c, P(`M${sx - 22},-166 Q${sx},-150 ${sx + 22},-166`), 'B', 7);
      else {
        const big = eyes === 'wide';
        const w = ellipseP(sx, -168, big ? 30 : 22, big ? 36 : 28); paperFill(c, w); strokeI(c, w, 'B', 5);
        fillI(c, ellipseP(sx + lx + (eyes === 'side' ? 10 : 0), -166, big ? 8 : 12, big ? 8 : 14), 'B');
      }
      const b = ex.brow || 'calm', inn = sx < 0 ? 1 : -1;
      const by = -214;
      strokeI(c, P(b === 'angry' ? `M${sx - 26 * inn},${by - 12} L${sx + 22 * inn},${by + 10}` : b === 'worried' ? `M${sx - 26 * inn},${by + 10} L${sx + 22 * inn},${by - 12}` : `M${sx - 24},${by} Q${sx},${by - 14} ${sx + 24},${by}`), 'B', 9);
    }
    if (ex.blush) for (const sx of [-80, 80]) fillI(c, ellipseP(sx, -112, 26, 14), 'P', 1);
    const m = ex.mouth || 0;
    if (m > .35) { const mo = ellipseP(0, -88, 30 + m * 10, 10 + m * 26); fillI(c, mo, 'P'); fillI(c, mo, 'B', .5); strokeI(c, mo, 'B', 6); }
    else if (ex.smile) strokeI(c, P('M-40,-100 Q0,-62 40,-100'), 'B', 7);
    else if (ex.frown) strokeI(c, P('M-34,-78 Q0,-104 34,-78'), 'B', 7);
    else strokeI(c, P('M-24,-90 L24,-90'), 'B', 7);
    if (K) fillI(c, P('M-46,-112 C-20,-124 20,-124 46,-112 C20,-104 -20,-104 -46,-112 Z'), 'B');
    if (ex.sweat) for (const [sx, sy] of [[140, -260], [-150, -230]]) { const d = P(`M${sx},${sy} C${sx + 14},${sy + 22} ${sx + 14},${sy + 40} ${sx},${sy + 40} C${sx - 14},${sy + 40} ${sx - 14},${sy + 22} ${sx},${sy} Z`); paperFill(c, d); strokeI(c, d, 'B', 5); }
    c.restore();
  }

  // ---------- backgrounds & props ----------
  const bgTone = (c, r, ink, tone) => fillI(c, rectP(r.x, r.y, r.w, r.h), ink, tone);
  function speed(c, r, cx, cy, ink = 'P') {
    c.save(); c.globalCompositeOperation = 'multiply'; if (ink === 'P') c.translate(MIS[0], MIS[1]); c.fillStyle = INK[ink];
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, a2 = a + .035; c.beginPath(); c.moveTo(cx + Math.cos(a) * 220, cy + Math.sin(a) * 220); c.lineTo(cx + Math.cos(a) * 1400, cy + Math.sin(a) * 1400); c.lineTo(cx + Math.cos(a2) * 1400, cy + Math.sin(a2) * 1400); c.fill(); }
    c.restore();
  }
  function tiles(c, r) { c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = INK.B; c.globalAlpha = .35; c.lineWidth = 3; for (let x = r.x; x < r.x + r.w; x += 70) { c.beginPath(); c.moveTo(x, r.y); c.lineTo(x, r.y + r.h); c.stroke(); } for (let y = r.y; y < r.y + r.h; y += 70) { c.beginPath(); c.moveTo(r.x, y); c.lineTo(r.x + r.w, y); c.stroke(); } c.restore(); }
  function rain(c, r, t) { c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = INK.B; c.lineWidth = 4; for (let i = 0; i < 40; i++) { const x = r.x + (hash(i) * r.w + t * 60) % r.w, y = r.y + (hash(i + 3) * r.h + t * 700) % r.h; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 10, y + 40); c.stroke(); } c.restore(); }
  function heart(c, x, y, s, ink = 'P') { const h = P(`M${x},${y + 40 * s} C${x - 80 * s},${y - 10 * s} ${x - 56 * s},${y - 80 * s} ${x},${y - 40 * s} C${x + 56 * s},${y - 80 * s} ${x + 80 * s},${y - 10 * s} ${x},${y + 40 * s} Z`); fillI(c, h, ink); strokeI(c, h, 'B', 5); }
  function plateP(c, x, y, s, food = 'P') { const p = ellipseP(x, y, 200 * s, 56 * s); paperFill(c, p); strokeI(c, p, 'B', 6); const f = ellipseP(x, y - 8 * s, 130 * s, 34 * s); fillI(c, f, food, .5); strokeI(c, f, 'B', 4); }
  function fridgeP(c, x, y, s, open) {
    const body = rectP(x - 160 * s, y - 420 * s, 320 * s, 420 * s); fillI(c, body, 'B', .15); strokeI(c, body, 'B', 7);
    if (open) {
      const inside = rectP(x - 130 * s, y - 390 * s, 260 * s, 360 * s); paperFill(c, inside); fillI(c, inside, 'B', .2); strokeI(c, inside, 'B', 5);
      const bread = P(`M${x - 100 * s},${y - 200 * s} C${x - 110 * s},${y - 270 * s} ${x - 30 * s},${y - 290 * s} ${x},${y - 270 * s} C${x + 30 * s},${y - 290 * s} ${x + 110 * s},${y - 270 * s} ${x + 100 * s},${y - 200 * s} L${x + 100 * s},${y - 150 * s} L${x - 100 * s},${y - 150 * s} Z`);
      fillI(c, bread, 'P', .5); strokeI(c, bread, 'B', 6);
      for (let i = 0; i < 8; i++) fillI(c, ellipseP(x + (hash(i) - .5) * 160 * s, y - 220 * s + (hash(i + 5) - .5) * 80 * s, (8 + hash(i + 2) * 14) * s, (8 + hash(i + 2) * 14) * s), 'B');
      const door = P(`M${x - 160 * s},${y - 420 * s} L${x - 300 * s},${y - 450 * s} L${x - 300 * s},${y + 30 * s} L${x - 160 * s},${y} Z`); fillI(c, door, 'B', .3); strokeI(c, door, 'B', 7);
    } else strokeI(c, P(`M${x + 120 * s},${y - 330 * s} L${x + 120 * s},${y - 220 * s}`), 'B', 14);
  }

  // ---------- speech bubbles = captions ----------
  function bubble(c, r, l, tail, narr) {
    c.save();
    c.font = '54px PatrickHand';
    const maxW = Math.min(r.w - 80, 760);
    const lines = balanceWrap(c, l.text, maxW - 50);
    const w = Math.max(...lines.map(s => c.measureText(s).width)) + 70, h = lines.length * 58 + 40;
    let bx = r.x + 30, by = r.y + 26;
    if (tail && tail[0] > r.x + r.w / 2) bx = r.x + r.w - w - 30;
    if (narr) { const box = rectP(bx, by, w, h); fillI(c, box, 'P', .25); paperFill(c, rectP(bx + 6, by + 6, w - 12, h - 12)); fillI(c, rectP(bx + 6, by + 6, w - 12, h - 12), 'P', .2); strokeI(c, box, 'B', 5); }
    else {
      const b = new Path2D(); b.roundRect(bx, by, w, h, 40);
      if (tail) { const tx0 = clamp(tail[0], bx + 50, bx + w - 50); b.moveTo(tx0 - 26, by + h - 4); b.lineTo(tail[0], Math.max(tail[1], by + h + 40)); b.lineTo(tx0 + 26, by + h - 4); }
      paperFill(c, b); strokeI(c, b, 'B', 5);
      c.save(); c.fillStyle = PAPER; c.fillRect(bx + 20, by + h - 8, w - 40, 6); c.restore();
    }
    lines.forEach((s, i) => textI(c, s, bx + w / 2, by + 20 + 29 + i * 58, '54px PatrickHand', 'B'));
    c.restore();
  }

  // ---------- panel art per line ----------
  const NY = r => r.h > 700 ? .74 : .95, SZ = r => r.h > 700 ? 1.35 : 1;
  const ART = {
    k01: (c, r, t) => { tiles(c, r); fillI(c, rectP(r.x, r.y + r.h * .78, r.w, r.h * .22), 'P', .5); toon(c, 'K', r.x + r.w * .35, r.y + r.h * .62, .75, { brow: 'worried', mouth: jaw(t, 'K'), arms: 'hold', look: 1 }); plateP(c, r.x + r.w * .72, r.y + r.h * .82, .9, 'B'); sfx(c, 'CHOP!', r.x + r.w * .78, r.y + r.h * .45, 90, -.15); return [r.x + r.w * .35, r.y + r.h * .3]; },
    k02: (c, r, t) => { speed(c, r, r.x + r.w / 2, r.y + r.h * .7); toon(c, 'K', r.x + r.w / 2, r.y + r.h * NY(r), .9 * SZ(r), { eyes: 'shut', mouth: Math.max(.7, jaw(t, 'K')), arms: 'down' }); return [r.x + r.w / 2, r.y + r.h * .5]; },
    k03: (c, r, t) => { bgTone(c, r, 'B', .15); toon(c, 'K', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { eyes: 'side', look: 1, brow: 'worried', mouth: jaw(t, 'K'), arms: 'up' }); return [r.x + r.w / 2, r.y + r.h * .55]; },
    n01: (c, r) => { bgTone(c, r, 'P', .25); heart(c, r.x + r.w * .3, r.y + r.h * .62, 1.5); textI(c, '=', r.x + r.w / 2, r.y + r.h * .62, '160px Bowlby', 'B'); plateP(c, r.x + r.w * .72, r.y + r.h * .7, .8, 'P'); },
    n02: (c, r, t) => { bgTone(c, r, 'B', .15); plateP(c, r.x + r.w / 2, r.y + r.h * .78, 1, 'P'); const k = clamp((t - T('n02')) / .9); const ch = P(`M${r.x + r.w / 2 - 20},${r.y + r.h * (.2 + .5 * easeIn(k)) - 80} C${r.x + r.w / 2 + 30},${r.y + r.h * (.2 + .5 * easeIn(k)) - 90} ${r.x + r.w / 2 + 30},${r.y + r.h * (.2 + .5 * easeIn(k)) + 40} ${r.x + r.w / 2},${r.y + r.h * (.2 + .5 * easeIn(k)) + 90} Z`); fillI(c, ch, 'P'); strokeI(c, ch, 'B', 5); if (k >= 1) sfx(c, 'MOOD: KHARAB', r.x + r.w / 2, r.y + r.h * .55, 70, -.06); },
    n03: (c, r) => { tiles(c, r); toon(c, 'K', r.x + r.w * .3, r.y + r.h * NY(r), .7 * SZ(r), { smile: true, arms: 'hold', look: 1 }); toon(c, 'J', r.x + r.w * .72, r.y + r.h * NY(r), .7 * SZ(r), { smile: true, arms: 'point', look: -1, eyes: 'happy' }); },
    n04: (c, r, t) => { bgTone(c, r, 'P', .25); toon(c, 'J', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { eyes: 'happy', smile: true, blush: true }); for (let i = 0; i < 4; i++) heart(c, r.x + r.w * (.2 + i * .2), r.y + r.h * (.35 + Math.sin(t * 3 + i) * .05), .5); },
    n05: (c, r) => { tiles(c, r); toon(c, 'K', r.x + r.w * .4, r.y + r.h * NY(r), .75 * SZ(r), { smile: true, arms: 'hold', eyes: 'happy' }); sfx(c, 'GUIDANCE MODE', r.x + r.w * .62, r.y + r.h * .42, 46, .08); },
    n06: (c, r, t) => { bgTone(c, r, 'B', .5); toon(c, 'J', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', frown: true, arms: 'cross' }); c.save(); c.globalCompositeOperation = 'multiply'; c.strokeStyle = INK.P; c.lineWidth = 8; c.beginPath(); for (let i = 0; i < 50; i++) { const a = i * .8 + t * 4; c.lineTo(r.x + r.w / 2 + Math.cos(a) * (100 + hash(i) * 60), r.y + r.h * .35 + Math.sin(a) * (40 + hash(i + 1) * 30)); } c.stroke(); c.restore(); },
    j01: (c, r, t) => { rain(c, r, t); toon(c, 'J', r.x + r.w * .55, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), arms: 'hold' }); const pile = ellipseP(r.x + r.w * .62, r.y + r.h * .88, 180, 60); fillI(c, pile, 'P', .5); fillI(c, pile, 'B', .25); strokeI(c, pile, 'B', 6); return [r.x + r.w * .55, r.y + r.h * .5]; },
    j02: (c, r, t) => { bgTone(c, r, 'B', .25); rain(c, r, t); toon(c, 'J', r.x + r.w / 2, r.y + r.h * NY(r), .85 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), look: -1 }); return [r.x + r.w / 2, r.y + r.h * .55]; },
    k04: (c, r, t) => { tiles(c, r); toon(c, 'K', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'worried', mouth: jaw(t, 'K'), arms: 'hold', eyes: 'wide' }); return [r.x + r.w / 2, r.y + r.h * .55]; },
    j03: (c, r, t) => { bgTone(c, r, 'P', .25); toon(c, 'J', r.x + r.w * .4, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), arms: 'point', look: 1 }); return [r.x + r.w * .4, r.y + r.h * .55]; },
    j04: (c, r, t) => { speed(c, r, r.x + r.w / 2, r.y + r.h * .7, 'B'); toon(c, 'J', r.x + r.w / 2, r.y + r.h * NY(r), .85 * SZ(r), { eyes: 'shut', brow: 'angry', mouth: jaw(t, 'J') }); return [r.x + r.w / 2, r.y + r.h * .55]; },
    j05: (c, r, t) => { bgTone(c, r, 'B', .15); for (let i = 0; i < 6; i++) { const cx = r.x + r.w * (.15 + (i % 3) * .35), cy = r.y + r.h * (.62 + Math.floor(i / 3) * .3); toon(c, 'K', cx, cy, .3, { brow: 'worried', mouth: .6 + .3 * Math.sin(t * 9 + i) }); } return [r.x + r.w * .9, r.y + r.h]; },
    k05: (c, r, t) => { tiles(c, r); toon(c, 'K', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'worried', mouth: jaw(t, 'K'), arms: 'up', eyes: 'shut' }); sfx(c, 'FIGHT MODE: ON', r.x + r.w * .5, r.y + r.h * .5, 64, -.1); return [r.x + r.w / 2, r.y + r.h * .55]; },
    j06: (c, r, t) => { bgTone(c, r, 'P', .5); toon(c, 'J', r.x + r.w * .4, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), arms: 'point', look: 1 }); return [r.x + r.w * .4, r.y + r.h * .55]; },
    j07: (c, r, t) => { tiles(c, r); toon(c, 'J', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), arms: 'cross', eyes: 'side', look: -1 }); return [r.x + r.w / 2, r.y + r.h * .55]; },
    k06: (c, r, t) => { bgTone(c, r, 'B', .25); toon(c, 'K', r.x + r.w * .45, r.y + r.h * NY(r), .8 * SZ(r), { smile: !speaking(t, 'K'), mouth: jaw(t, 'K'), arms: 'thumb', eyes: 'happy' }); return [r.x + r.w * .45, r.y + r.h * .55]; },
    j08: (c, r, t) => { bgTone(c, r, 'P', .25); toon(c, 'J', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), arms: 'thumb', look: 1 }); sfx(c, '2 MAHINE!', r.x + r.w * .78, r.y + r.h * .55, 56, .12); return [r.x + r.w / 2, r.y + r.h * .55]; },
    j09: (c, r) => { tiles(c, r); fridgeP(c, r.x + r.w / 2, r.y + r.h * .98, .95, false); return [r.x + r.w * .95, r.y + r.h]; },
    j10: (c, r, t) => { speed(c, r, r.x + r.w * .55, r.y + r.h * .7, 'B'); fridgeP(c, r.x + r.w * .58, r.y + r.h * .98, 1.35, true); sfx(c, 'KHATAAK!', r.x + r.w * .3, r.y + r.h * .62, 96, -.15); sfx(c, 'EXP 14 JUL', r.x + r.w * .62, r.y + r.h * .86, 64, .05); return [r.x + r.w * .98, r.y + r.h * .7]; },
    k07: (c, r, t) => { bgTone(c, r, 'B', .25); toon(c, 'K', r.x + r.w / 2, r.y + r.h * NY(r), .75 * SZ(r), { brow: 'worried', mouth: jaw(t, 'K'), arms: 'hold', sweat: true, eyes: 'side', look: -1 }); const ph = new Path2D(); ph.roundRect(r.x + r.w * .62, r.y + r.h * .66, 70, 120, 12); fillI(c, ph, 'B'); return [r.x + r.w / 2, r.y + r.h * .55]; },
    j11: (c, r) => { bgTone(c, r, 'P', .25); const cal = rectP(r.x + r.w * .3, r.y + r.h * .42, r.w * .4, r.h * .52); paperFill(c, cal); strokeI(c, cal, 'B', 6); fillI(c, rectP(r.x + r.w * .3, r.y + r.h * .42, r.w * .4, r.h * .12), 'P'); textI(c, 'SUNDAY', r.x + r.w / 2, r.y + r.h * .48, '46px Bowlby', 'B'); textI(c, '21', r.x + r.w / 2, r.y + r.h * .75, '150px Bowlby', 'B'); return [r.x + r.w * .95, r.y + r.h]; },
    j12: (c, r, t) => { speed(c, r, r.x + r.w / 2, r.y + r.h * .7); toon(c, 'J', r.x + r.w / 2, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), arms: 'up' }); sfx(c, 'JUNG!', r.x + r.w * .8, r.y + r.h * .6, 80, .12); return [r.x + r.w / 2, r.y + r.h * .55]; },
    j13: (c, r, t) => { bgTone(c, r, 'B', .15); toon(c, 'J', r.x + r.w * .4, r.y + r.h * NY(r), .8 * SZ(r), { brow: 'angry', mouth: jaw(t, 'J'), arms: 'hold', eyes: 'side', look: 1 }); const d = rectP(r.x + r.w * .62, r.y + r.h * .58, 200, 140); paperFill(c, d); strokeI(c, d, 'B', 5); textI(c, '1 DIN KA', r.x + r.w * .62 + 100, r.y + r.h * .58 + 50, '30px Bowlby', 'P'); textI(c, 'DIVORCE', r.x + r.w * .62 + 100, r.y + r.h * .58 + 95, '30px Bowlby', 'B'); return [r.x + r.w * .4, r.y + r.h * .55]; },
    k08: (c, r, t) => { tiles(c, r); toon(c, 'K', r.x + r.w / 2, r.y + r.h * NY(r), .78 * SZ(r), { brow: 'worried', mouth: jaw(t, 'K'), arms: 'cross', eyes: 'shut' }); return [r.x + r.w / 2, r.y + r.h * .55]; },
    k09: (c, r, t) => { bgTone(c, r, 'P', .25); toon(c, 'K', r.x + r.w * .4, r.y + r.h * NY(r), .78 * SZ(r), { smile: !speaking(t, 'K'), mouth: jaw(t, 'K'), arms: 'hold', eyes: 'happy' }); plateP(c, r.x + r.w * .62, r.y + r.h * .8, .8, 'P'); return [r.x + r.w * .4, r.y + r.h * .55]; },
    k10: (c, r) => { tiles(c, r); const door = rectP(r.x + r.w * .3, r.y + r.h * .35, r.w * .4, r.h * .65); fillI(c, door, 'B', .5); strokeI(c, door, 'B', 6); return [r.x + r.w * .5, r.y + r.h * .5]; },
    j14: (c, r, t) => { speed(c, r, r.x + r.w / 2, r.y + r.h * .6); speed(c, r, r.x + r.w / 2, r.y + r.h * .6, 'B'); const sh = 10 * Math.exp(-(t - T('j14')) * 1.5); c.save(); c.translate((hash(Math.floor(t * 24)) - .5) * sh, 0); toon(c, 'J', r.x + r.w / 2, r.y + r.h * 1.1, 1.0, { eyes: 'wide', brow: 'angry', mouth: 1, arms: 'up' }); c.restore(); sfx(c, 'KARUNNNN!!!', r.x + r.w / 2, r.y + r.h * .18, 150, -.04); return null; },
  };

  // ---------- pages ----------
  const X0 = 60, Y0 = 44, PW = 1800, PH = 992, G = 22;
  const R = (x, y, w, h) => ({ x: X0 + x * PW + (x ? G / 2 : 0), y: Y0 + y * PH + (y ? G / 2 : 0), w: w * PW - (x ? G / 2 : 0) - (x + w < 1 ? G / 2 : 0), h: h * PH - (y ? G / 2 : 0) - (y + h < 1 ? G / 2 : 0) });
  const L3 = [R(0, 0, 1, .48), R(0, .48, .5, .52), R(.5, .48, .5, .52)];
  const L2 = [R(0, 0, .55, 1), R(.55, 0, .45, 1)];
  const L4 = [R(0, 0, .5, .5), R(.5, 0, .5, .5), R(0, .5, .5, .5), R(.5, .5, .5, .5)];
  const PAGES = [
    { ids: ['k01', 'k02', 'k03'], lay: L3 }, { ids: ['n01', 'n02', 'n03'], lay: [R(0, 0, .5, .5), R(.5, 0, .5, .5), R(0, .5, 1, .5)] },
    { ids: ['n04', 'n05', 'n06'], lay: [R(0, 0, .34, 1), R(.34, 0, .33, 1), R(.67, 0, .33, 1)] },
    { ids: ['j01', 'j02', 'k04'], lay: L3 }, { ids: ['j03', 'j04', 'j05'], lay: [R(0, 0, .5, .5), R(0, .5, .5, .5), R(.5, 0, .5, 1)] },
    { ids: ['k05', 'j06'], lay: L2 }, { ids: ['j07', 'k06', 'j08', 'j09'], lay: L4 }, { ids: ['j10', 'k07'], lay: [R(0, 0, .64, 1), R(.64, 0, .36, 1)] },
    { ids: ['j11', 'j12', 'j13'], lay: L3 }, { ids: ['k08', 'k09', 'k10', 'j14'], lay: [R(0, 0, .34, .4), R(.34, 0, .33, .4), R(.67, 0, .33, .4), R(0, .4, 1, .6)] },
  ];
  const NARR = id => id[0] === 'n';

  function drawPage(c, pg, t, dx) {
    c.save(); c.translate(dx, 0);
    pg.ids.forEach((id, i) => {
      const l = lineById(id), r = pg.lay[i];
      const appear = l.start - .12;
      if (t < appear) return;
      const k = backOut(clamp((t - appear) / .28));
      c.save(); c.translate(r.x + r.w / 2, r.y + r.h / 2); c.scale(lerp(.92, 1, k), lerp(.92, 1, k)); c.translate(-r.x - r.w / 2, -r.y - r.h / 2);
      const box = rectP(r.x, r.y, r.w, r.h);
      paperFill(c, box);
      c.save(); c.clip(box);
      const tail = ART[id](c, r, t);
      c.restore();
      strokeI(c, box, 'B', 7);
      if (id !== 'j14') bubble(c, r, l, NARR(id) ? null : (tail === undefined ? null : tail), NARR(id));
      c.restore();
    });
    c.restore();
  }
  function cover(c, t, end) {
    const r = { x: 0, y: 0, w: W, h: H };
    fillI(c, rectP(0, 0, W, H), 'P', .25);
    speed(c, r, 960, 520, 'B');
    if (!end) { toon(c, 'K', 640, 900, .9, { eyes: 'wide', brow: 'worried', sweat: true, arms: 'hold' }); toon(c, 'J', 1300, 900, .9, { brow: 'angry', arms: 'cross', look: -1 }); }
    sfx(c, end ? 'THE END' : 'PAAPAD', 960, end ? 470 : 230, 230, -.04);
    const s = end ? 'Style 06 · Two-Ink Riso Comic' : 'Kahaani No. 02 · ek Sunday ki ladaai';
    const w = 1000; const b = rectP(960 - w / 2, end ? 640 : 960, w, 76); paperFill(c, b); strokeI(c, b, 'B', 5);
    textI(c, s, 960, (end ? 640 : 960) + 40, '46px PatrickHand', 'B');
  }

  defineStyle({
    fps: 12,
    fonts: ['46px PatrickHand', '60px Bowlby'],
    init() {
      for (const ink of ['P', 'B']) { PAT[ink + 1] = dotPattern(INK[ink], 12, 2.6); PAT[ink + 2] = dotPattern(INK[ink], 12, 4); PAT[ink + 3] = dotPattern(INK[ink], 12, 5.4); }
      const [v, g] = layer(W, H); const r = rng(77);
      for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(245,240,228,${.25 + r() * .5})`; g.fillRect(r() * W, r() * H, 1 + r() * 2.5, 1 + r() * 2.5); }
      for (let i = 0; i < 30; i++) { g.fillStyle = 'rgba(245,240,228,.25)'; g.fillRect(0, r() * H, W, 1 + r() * 3); }
      VOIDS = v;
    },
    draw(c, t) {
      MIS = [3 + Math.round(noise1(t * .5) * 2), -2 + Math.round(noise1(t * .5 + 9) * 2)];
      c.fillStyle = PAPER; c.fillRect(0, 0, W, H);
      if (t < TL.lead_in - .1) cover(c, t, false);
      else if (t > TL.end_card) cover(c, t, true);
      else {
        let pi = 0;
        PAGES.forEach((pg, i) => { if (t >= lineById(pg.ids[0]).start - .15) pi = i; });
        const start = lineById(PAGES[pi].ids[0]).start - .15;
        const k = pi > 0 ? easeInOut(clamp((t - start) / .4)) : 1;
        if (k < 1) drawPage(c, PAGES[pi - 1], t, -k * W);
        drawPage(c, PAGES[pi], t, (1 - k) * W);
      }
      c.drawImage(VOIDS, 0, 0);
    },
  });
})();
