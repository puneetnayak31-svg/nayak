// Style 07: Doordarshan '89. The story plays as a 1980s TV serial on an old set: scenes are painted at
// VHS resolution (480x360), pushed through a per-pixel tape pass (chroma shift, tracking wobble, noise),
// upscaled into a 4:3 screen inside a wood-veneer cabinet. Serial-style reaction zooms, a "vichaar"
// card for the narration, and a signal drop into "rukawat ke liye khed hai" at the end.
(() => {
  const SW = 480, SH = 360;
  const SX = 240, SY = 0, SWW = 1440, SHH = 1080;
  let small, sg, out, og, SCAN, CAB, VIG;
  const P = s => new Path2D(s);
  const C = { wall: '#4f9c9a', wall2: '#e3c27a', counter: '#d4683a', skinK: '#b9784c', skinJ: '#d29a6e', hair: '#1b1416', vest: '#8a5a2b', shirt: '#e8dfc6', saree: '#b8327a', blouse: '#e0b030', fridge: '#e9e1c8' };

  // ---------- serial characters (drawn at VHS scale; origin at the neck) ----------
  function person(g, who, x, y, s, ex = {}) {
    const K = who === 'K';
    g.save(); g.translate(x, y); g.scale(s, s);
    const skin = K ? C.skinK : C.skinJ;
    // body
    g.fillStyle = K ? C.shirt : C.blouse; g.beginPath(); g.moveTo(-46, 6); g.quadraticCurveTo(0, -4, 46, 6); g.lineTo(56, 120); g.lineTo(-56, 120); g.fill();
    if (K) { g.fillStyle = C.vest; g.beginPath(); g.moveTo(-40, 10); g.lineTo(-10, 60); g.lineTo(10, 60); g.lineTo(40, 10); g.lineTo(52, 120); g.lineTo(-52, 120); g.fill(); g.fillStyle = '#6a3a1a'; for (let i = 0; i < 4; i++) g.fillRect(-40 + i * 24, 70, 12, 50); }
    else { g.fillStyle = C.saree; g.beginPath(); g.moveTo(-50, 14); g.lineTo(46, 120); g.lineTo(10, 120); g.lineTo(-56, 40); g.fill(); g.fillStyle = '#f2d060'; g.fillRect(-56, 30, 10, 6); }
    // arms hang at the sides
    g.strokeStyle = K ? C.shirt : C.blouse; g.lineWidth = 16; g.lineCap = 'round';
    for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 46, 18); g.lineTo(sd * 54, 70); g.stroke(); }
    g.strokeStyle = skin; g.lineWidth = 12; for (const sd of [-1, 1]) { g.beginPath(); g.moveTo(sd * 54, 70); g.lineTo(sd * 56, 110); g.stroke(); }
    // hair behind the head (Jyotsna's 80s volume)
    if (!K) { g.fillStyle = C.hair; g.beginPath(); g.ellipse(0, -62, 52, 46, 0, 0, 7); g.fill(); g.beginPath(); g.ellipse(-34, -40, 18, 30, 0, 0, 7); g.ellipse(34, -40, 18, 30, 0, 0, 7); g.fill(); }
    // neck, head
    g.fillStyle = skin; g.fillRect(-10, -16, 20, 22);
    g.beginPath(); g.ellipse(0, -50, 34, 40, 0, 0, 7); g.fill();
    // hair
    g.fillStyle = C.hair;
    if (K) { g.beginPath(); g.ellipse(0, -80, 36, 16, 0, 0, 7); g.fill(); g.fillRect(-36, -80, 8, 26); g.fillRect(28, -80, 8, 26); }
    else { g.beginPath(); g.ellipse(0, -86, 38, 16, 0, Math.PI, 0); g.fill(); g.beginPath(); g.ellipse(-20, -82, 22, 10, -.3, 0, 7); g.ellipse(20, -82, 22, 10, .3, 0, 7); g.fill(); g.fillStyle = '#c0262d'; g.beginPath(); g.arc(0, -68, 3.5, 0, 7); g.fill(); }
    // glasses for Karun, an 80s essential
    const lx = (ex.look || 0) * 4;
    if (K) { g.strokeStyle = '#3a2a1a'; g.lineWidth = 3; g.beginPath(); g.rect(-28, -62, 22, 18); g.rect(6, -62, 22, 18); g.moveTo(-6, -54); g.lineTo(6, -54); g.stroke(); }
    g.fillStyle = '#140c0c';
    const wide = ex.wide ? 1.6 : 1;
    g.beginPath(); g.ellipse(-16 + lx, -53, 3.5 * wide, 4.5 * wide, 0, 0, 7); g.ellipse(16 + lx, -53, 3.5 * wide, 4.5 * wide, 0, 0, 7); g.fill();
    g.strokeStyle = '#140c0c'; g.lineWidth = 3;
    const b = ex.brow || 'calm';
    for (const sx of [-16, 16]) { const inn = sx < 0 ? 1 : -1; g.beginPath(); if (b === 'angry') { g.moveTo(sx - 10 * inn, -72); g.lineTo(sx + 8 * inn, -66); } else if (b === 'worried') { g.moveTo(sx - 10 * inn, -66); g.lineTo(sx + 8 * inn, -72); } else { g.moveTo(sx - 9, -68); g.lineTo(sx + 9, -68); } g.stroke(); }
    if (K) { g.fillStyle = C.hair; g.fillRect(-14, -36, 28, 5); }
    const m = ex.mouth || 0;
    g.fillStyle = '#5a1418';
    if (m > .3) { g.beginPath(); g.ellipse(0, -26, 9, 3 + m * 8, 0, 0, 7); g.fill(); }
    else { g.strokeStyle = '#7a2a28'; g.lineWidth = 3; g.beginPath(); if (ex.smile) g.arc(0, -32, 9, .3, Math.PI - .3); else if (ex.frown) g.arc(0, -18, 9, Math.PI + .4, -.4); else { g.moveTo(-7, -27); g.lineTo(7, -27); } g.stroke(); }
    g.restore();
  }
  function kitchen(g) {
    g.fillStyle = C.wall; g.fillRect(0, 0, SW, SH);
    g.fillStyle = 'rgba(255,255,255,.12)'; for (let x = 0; x < SW; x += 24) g.fillRect(x, 150, 1, 70); for (let y = 150; y < 220; y += 24) g.fillRect(0, y, SW, 1);
    g.fillStyle = '#e9e1c8'; g.fillRect(30, 30, 110, 90); g.fillStyle = '#9cc8e6'; g.fillRect(38, 38, 94, 74); g.fillStyle = '#e9e1c8'; g.fillRect(83, 38, 4, 74);
    g.fillStyle = '#a07a40'; g.fillRect(190, 90, 140, 8);
    for (const [x, col] of [[200, '#e0b030'], [236, '#c0262d'], [272, '#3a8a3a'], [304, '#e9e1c8']]) { g.fillStyle = col; g.fillRect(x, 64, 22, 26); }
    // a calendar with a film-star picture
    g.fillStyle = '#f0e6d0'; g.fillRect(360, 30, 70, 90); g.fillStyle = '#c0262d'; g.fillRect(360, 30, 70, 14); g.fillStyle = '#d29a6e'; g.beginPath(); g.arc(395, 72, 16, 0, 7); g.fill();
  }
  function counter(g) { g.fillStyle = C.counter; g.fillRect(0, 262, SW, 98); g.fillStyle = '#b44f28'; g.fillRect(0, 262, SW, 8); g.fillStyle = 'rgba(0,0,0,.15)'; g.fillRect(160, 280, 2, 80); g.fillRect(320, 280, 2, 80); }
  function zoomOn(g, t, t0, cx, cy, n = 3) {
    // the serial "dhum ta dhum" reaction zoom: quick punches toward a face
    let z = 1; for (let i = 0; i < n; i++) { const k = t - (t0 + i * .22); if (k > 0) z *= 1 + .28 * easeOut(clamp(k / .07)); }
    if (z > 1) { g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
    return z > 1;
  }

  function scene(g, t) {
    const b = beatAt(t).name;
    g.save();
    if (b === 'open') {
      kitchen(g); const ask = t > T('k02');
      person(g, 'K', 200, 200, 1.15, { mouth: jaw(t, 'K'), brow: ask ? 'worried' : 'calm', wide: ask, look: ask ? 1 : 0 });
      counter(g);
      g.fillStyle = '#c4935a'; g.fillRect(150, 268, 140, 14); g.fillStyle = '#cfd4d8'; const up = !ask && Math.sin(t * 15) > 0; g.save(); g.translate(250, up ? 250 : 262); g.rotate(up ? -.3 : 0); g.fillRect(0, -3, 50, 6); g.fillStyle = '#222'; g.fillRect(-24, -4, 24, 8); g.restore();
      g.fillStyle = '#cfd4d8'; g.beginPath(); g.ellipse(380, 270, 40, 12, 0, 0, 7); g.fill();
    } else if (b === 'narr' && t < T('n03')) {
      // "Aaj ka vichaar": a card with a flower border
      g.fillStyle = '#1d2a6a'; g.fillRect(0, 0, SW, SH);
      g.fillStyle = '#f0e6c8'; g.fillRect(40, 40, 400, 280);
      g.fillStyle = '#c0262d'; for (let i = 0; i < 26; i++) { const a = i / 26 * Math.PI * 2; g.beginPath(); g.arc(240 + Math.cos(a) * 190, 180 + Math.sin(a) * 130, 6, 0, 7); g.fill(); }
      g.fillStyle = '#1d2a6a'; g.font = '30px Rozha'; g.textAlign = 'center'; g.fillText('आज का विचार', 240, 100);
      g.fillStyle = '#c0262d'; g.beginPath(); g.moveTo(170, 200); g.bezierCurveTo(130, 170, 150, 135, 170, 155); g.bezierCurveTo(190, 135, 210, 170, 170, 200); g.fill();
      g.fillStyle = '#1d2a6a'; g.font = '40px Rozha'; g.fillText('=', 240, 195);
      g.fillStyle = '#fff'; g.beginPath(); g.ellipse(310, 185, 40, 14, 0, 0, 7); g.fill(); g.fillStyle = '#e0b030'; g.beginPath(); g.ellipse(310, 180, 26, 8, 0, 0, 7); g.fill();
      if (t > T('n02') + .8) { g.fillStyle = '#c0262d'; g.font = '26px Rozha'; g.fillText('एक गलत फ़ैसला...', 240, 260); }
    } else if (b === 'narr') {
      kitchen(g);
      const irr = t > T('n06') + .8;
      person(g, 'K', 160, 210, 1.05, { smile: true, look: 1 });
      person(g, 'J', 320, 210, 1.05, { smile: !irr, frown: irr, brow: irr ? 'angry' : 'calm', look: -1 });
      counter(g);
      if (!irr) for (let i = 0; i < 4; i++) { const yy = 130 - ((t * 30 + i * 30) % 110); g.fillStyle = '#e8447a'; g.beginPath(); g.arc(240 + Math.sin(i * 2 + t) * 20, yy, 6, 0, 7); g.fill(); }
    } else if (t > E('j09') + .1 && t < T('j11')) {
      // the fridge, an old rounded cream model
      g.fillStyle = C.wall2; g.fillRect(0, 0, SW, SH);
      const open = easeOut(clamp((t - E('j09') - .1) / .6));
      const z = zoomOn(g, t, T('j10') + .3, 240, 190, 3);
      g.fillStyle = C.fridge; g.beginPath(); g.roundRect(150, 30, 180, 320, 24); g.fill();
      g.fillStyle = '#dff0f6'; g.fillRect(166, 50, 148, 280 * open);
      if (open > .5) {
        g.fillStyle = '#d99a3a'; g.beginPath(); g.roundRect(186, 150, 108, 60, 14); g.fill();
        g.fillStyle = 'rgba(60,110,40,.7)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(196 + hash(i) * 88, 160 + hash(i + 2) * 40, 4 + hash(i + 4) * 6, 0, 7); g.fill(); }
        g.fillStyle = '#fff'; g.fillRect(232, 200, 74, 22); g.fillStyle = '#c0262d'; g.font = '16px VT323'; g.textAlign = 'center'; g.fillText('EXP 14 JUL', 269, 216);
      }
      g.fillStyle = '#9a9a9a'; g.fillRect(300, 120, 8, 60);
      if (t > T('k07')) { g.setTransform(1, 0, 0, 1, 0, 0); person(g, 'K', 90, 230, 1.0, { mouth: jaw(t, 'K'), brow: 'worried', look: 1 }); }
    } else if (b === 'sunday') {
      g.fillStyle = '#7a1e3a'; g.fillRect(0, 0, SW, SH);
      g.fillStyle = '#f0e6d0'; g.fillRect(270, 60, 160, 200); g.fillStyle = '#c0262d'; g.fillRect(270, 60, 160, 40);
      g.fillStyle = '#fff'; g.font = '26px Rozha'; g.textAlign = 'center'; g.fillText('रविवार', 350, 90);
      g.fillStyle = '#1b1416'; g.font = '90px Rozha'; g.fillText('21', 350, 200);
      if (t > T('j12')) { g.strokeStyle = '#c0262d'; g.lineWidth = 6; g.beginPath(); g.moveTo(280, 110); g.lineTo(420, 250); g.moveTo(420, 110); g.lineTo(280, 250); g.stroke(); }
      zoomOn(g, t, T('j13') + .2, 140, 160, 2);
      person(g, 'J', 140, 230, 1.25, { mouth: jaw(t, 'J'), brow: 'angry', look: 1 });
    } else if (b === 'paapad' && t > T('j14')) {
      g.fillStyle = '#c0262d'; g.fillRect(0, 0, SW, SH);
      zoomOn(g, t, T('j14'), 240, 160, 3);
      person(g, 'J', 240, 240, 1.7, { mouth: 1, brow: 'angry', wide: true });
    } else {
      // enter / argue / bread / paapad: the two-shot, with serial reaction zooms
      kitchen(g);
      const enterK = b === 'enter' ? easeOut(clamp((t - beatAt(t).start) / 1.4)) : 1;
      const gone = b === 'paapad' && t > T('k10') - .4;
      let zx = null;
      for (const [id, x] of [['j03', 330], ['k05', 160], ['j08', 330], ['j06', 330]]) if (t > T(id) + .3 && t < T(id) + 1.6) { zoomOn(g, t, T(id) + .3, x, 160, 2); zx = x; }
      if (!gone) person(g, 'K', 160, 210, 1.05, { mouth: jaw(t, 'K'), brow: t > T('j03') && b !== 'paapad' ? 'worried' : 'calm', look: 1, wide: zx === 160 || (b === 'bread' && t > T('j08')), smile: b === 'paapad' && !speaking(t, 'K') });
      person(g, 'J', lerp(560, 330, enterK), 210, 1.05, { mouth: jaw(t, 'J'), brow: t > T('j01') && !(b === 'paapad' && t < T('k10')) ? 'angry' : 'calm', look: -1, frown: !speaking(t, 'J') && t > T('j01') });
      counter(g);
      if (b === 'paapad' && !gone && t > T('k09')) { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(230, 262, 44, 12, 0, 0, 7); g.fill(); g.fillStyle = '#e0b030'; g.beginPath(); g.ellipse(230, 258, 32, 8, 0, 0, 7); g.fill(); }
      if (b === 'enter') { g.fillStyle = 'rgba(200,230,255,.6)'; for (let i = 0; i < 20; i++) g.fillRect(38 + (hash(i) * 94), 38 + ((hash(i + 3) * 74 + t * 120) % 74), 1, 6); }
    }
    g.restore();
  }

  function titleScene(g, t, end) {
    g.fillStyle = '#0a0a3a'; g.fillRect(0, 0, SW, SH);
    if (!end && t < .7) { // colour bars
      const cols = ['#c0c0c0', '#c0c000', '#00c0c0', '#00c000', '#c000c0', '#c00000', '#0000c0'];
      cols.forEach((col, i) => { g.fillStyle = col; g.fillRect(i * SW / 7, 0, SW / 7 + 1, SH * .75); });
      g.fillStyle = '#111'; g.fillRect(0, SH * .75, SW, SH * .25); return;
    }
    // swirling ribbons, the 80s station-ident way
    for (let k = 0; k < 5; k++) {
      g.strokeStyle = ['#e04a2a', '#e0b030', '#3aa0c0', '#8a3ab0', '#3ab060'][k]; g.lineWidth = 10;
      g.beginPath(); for (let x = -20; x <= SW + 20; x += 8) g.lineTo(x, 180 + Math.sin(x * .02 + t * 2 + k) * (60 + k * 12) * Math.cos(t * .7 + k)); g.stroke();
    }
    const gr = g.createLinearGradient(0, 120, 0, 220); gr.addColorStop(0, '#fff6c0'); gr.addColorStop(.5, '#e0a020'); gr.addColorStop(1, '#8a4a10');
    g.fillStyle = gr; g.font = '600 104px Khand'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.save(); g.translate(240, 170); g.scale(1, .8 + .2 * Math.abs(Math.sin(t * 1.5))); g.fillText(end ? 'समाप्त' : 'पापड़', 0, 0); g.restore();
    g.fillStyle = '#fff'; g.font = '24px Khand'; g.fillText(end ? 'Style 07 · Doordarshan ’89' : 'एक घर, दो लोग · किस्सा नं. २', 240, 270);
  }
  function rukawat(g, t) {
    g.fillStyle = '#20206a'; g.fillRect(0, 0, SW, SH);
    g.fillStyle = '#e8e0c0'; g.fillRect(60, 120, 360, 120);
    g.fillStyle = '#20206a'; g.font = '40px Rozha'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('रुकावट के लिए खेद है', 240, 180);
  }

  // ---------- the tape pass ----------
  function vhs(t, glitch) {
    const src = sg.getImageData(0, 0, SW, SH), d = src.data;
    const o = og.createImageData(SW, SH), q = o.data;
    const seed = Math.floor(t * 24);
    for (let y = 0; y < SH; y++) {
      let shift = Math.sin(y * .05 + t * 3) * .6;
      if (y > SH - 26) shift += (hash(seed * 7 + y) - .5) * 14 + 6;          // head-switching noise at the bottom
      if (glitch > 0 && hash(seed + y * .1) < glitch) shift += (hash(seed + y) - .5) * 60;
      const band = Math.abs(((t * 40) % (SH + 80)) - 40 - y) < 6 ? 18 : 0;  // a rolling tracking band
      for (let x = 0; x < SW; x++) {
        const sx = Math.round(x + shift);
        const iR = (y * SW + clamp(sx - 2, 0, SW - 1)) * 4, iG = (y * SW + clamp(sx, 0, SW - 1)) * 4, iB = (y * SW + clamp(sx + 2, 0, SW - 1)) * 4;
        const n = (hash(seed * 131 + y * 517 + x) - .5) * 22 + band;
        const i = (y * SW + x) * 4;
        let r = d[iR] + n, gg = d[iG + 1] + n, bb = d[iB + 2] + n;
        const l = .3 * r + .59 * gg + .11 * bb;          // a touch washed out and warm
        q[i] = lerp(l, r, .85) + 8; q[i + 1] = lerp(l, gg, .85) + 2; q[i + 2] = lerp(l, bb, .85) - 6; q[i + 3] = 255;
      }
    }
    og.putImageData(o, 0, 0);
  }

  function caption(c, t) {
    const l = lineAt(t);
    if (!l || t > TL.end_card || t > T('j14') + .9) return;
    const a = clamp(l.age * 10) * clamp(l.left * 8);
    c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '600 58px Khand';
    const lines = balanceWrap(c, l.text, 1240);
    const y0 = 985 - (lines.length - 1) * 60;
    lines.forEach((s, i) => {
      const w = c.measureText(s).width + 36;
      c.fillStyle = 'rgba(0,0,0,.72)'; c.fillRect(960 - w / 2, y0 + i * 60 - 30, w, 60);
      c.fillStyle = 'rgba(255,60,60,.5)'; c.fillText(s, 958, y0 + i * 60);
      c.fillStyle = 'rgba(60,200,255,.5)'; c.fillText(s, 962, y0 + i * 60);
      c.fillStyle = '#fbf6e0'; c.fillText(s, 960, y0 + i * 60);
    });
    c.restore();
  }
  function osd(c, t) {
    c.save(); c.font = '56px VT323'; c.fillStyle = '#7dff8a'; c.shadowColor = '#000'; c.shadowOffsetX = 3; c.shadowOffsetY = 3;
    if (t < 3.5 && Math.floor(t * 2) % 2 === 0) c.fillText('PLAY ▶', 300, 80);
    const s = Math.floor(t), tc = `SP 0:${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
    c.textAlign = 'right'; c.globalAlpha = .85; c.fillText(tc, 1630, 80);
    c.restore();
  }

  defineStyle({
    fps: 24,
    fonts: ['600 54px Khand', '56px VT323', '40px Rozha'],
    init() {
      small = document.createElement('canvas'); small.width = SW; small.height = SH; sg = small.getContext('2d', { willReadFrequently: true }); [out, og] = layer(SW, SH);
      sg.imageSmoothingEnabled = true;
      // scanlines
      const [s, g] = layer(SWW, SHH); g.fillStyle = 'rgba(0,0,0,.22)'; for (let y = 0; y < SHH; y += 3) g.fillRect(0, y, SWW, 1); SCAN = s;
      // CRT vignette with rounded corners
      const [v, h] = layer(SWW, SHH); const rg = h.createRadialGradient(SWW / 2, SHH / 2, 400, SWW / 2, SHH / 2, 980); rg.addColorStop(0, 'rgba(0,0,0,0)'); rg.addColorStop(1, 'rgba(0,0,0,.7)'); h.fillStyle = rg; h.fillRect(0, 0, SWW, SHH); VIG = v;
      // wood-veneer cabinet with speaker grilles and dials
      const [cb, k] = layer(W, H); const r = rng(3);
      k.fillStyle = '#5a361c'; k.fillRect(0, 0, W, H);
      for (let i = 0; i < 500; i++) { k.strokeStyle = `rgba(${r() < .5 ? '30,15,5' : '140,90,50'},${.08 + r() * .12})`; k.lineWidth = 1 + r() * 3; k.beginPath(); const x = r() * W; k.moveTo(x, 0); for (let y = 0; y <= H; y += 60) k.lineTo(x + Math.sin(y * .01 + i) * 8, y); k.stroke(); }
      for (const gx of [40]) { k.fillStyle = '#2a1a10'; k.fillRect(gx, 160, 160, 760); k.fillStyle = '#3a2618'; for (let y = 170; y < 910; y += 14) k.fillRect(gx + 8, y, 144, 6); }
      k.fillStyle = '#2a1a10'; k.fillRect(1720, 560, 160, 360); k.fillStyle = '#3a2618'; for (let y = 570; y < 910; y += 14) k.fillRect(1728, y, 144, 6);
      CAB = cb;
    },
    draw(c, t) {
      c.drawImage(CAB, 0, 0);
      // dials (the channel dial clicks round when the signal drops)
      const drop = t > T('j14') + .9 && t <= TL.end_card;
      for (const [y, rot] of [[200, drop ? (t * 3) : .4], [400, -.6]]) {
        c.save(); c.translate(1800, y); c.fillStyle = '#c8c0a8'; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.fill(); c.fillStyle = '#2a2a2a'; c.beginPath(); c.arc(0, 0, 48, 0, 7); c.fill();
        c.rotate(rot); c.fillStyle = '#e8e0c8'; c.fillRect(-6, -46, 12, 34); c.restore();
      }
      // picture
      sg.setTransform(1, 0, 0, 1, 0, 0);
      if (t < TL.lead_in - .1) titleScene(sg, t, false);
      else if (t > TL.end_card) titleScene(sg, t - TL.end_card + 1, true);
      else if (drop) rukawat(sg, t);
      else scene(sg, t);
      const glitch = drop && t < T('j14') + 1.1 ? .5 : (t > T('j14') && t < T('j14') + .95 ? .08 : 0);
      vhs(t, glitch);
      c.save(); c.beginPath(); c.roundRect(SX + 10, SY + 10, SWW - 20, SHH - 20, 60); c.clip();
      c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
      c.drawImage(out, SX, SY, SWW, SHH);
      c.globalCompositeOperation = 'multiply'; c.drawImage(SCAN, SX, SY); c.globalCompositeOperation = 'source-over';
      c.drawImage(VIG, SX, SY);
      c.restore();
      c.save(); c.strokeStyle = '#1a0f08'; c.lineWidth = 22; c.beginPath(); c.roundRect(SX + 10, SY + 10, SWW - 20, SHH - 20, 60); c.stroke(); c.restore();
      osd(c, t);
      caption(c, t);
    },
  });
})();
