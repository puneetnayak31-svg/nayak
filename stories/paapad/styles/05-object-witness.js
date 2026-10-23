// Style 05: The Object Witness. No faces, ever: only hands and the objects that carry the story,
// lit like product shots (one hard key light, long cast shadows) on bold seamless backdrops.
// Captions are packaging labels with a speaker tab and a barcode.
(() => {
  const P = s => new Path2D(s);
  const TABLE = 720;
  let GR = null;

  function backdrop(c, col, tableCol) {
    c.fillStyle = col; c.fillRect(0, 0, W, H);
    const g = c.createLinearGradient(0, 0, 0, TABLE); g.addColorStop(0, 'rgba(0,0,0,.28)'); g.addColorStop(1, 'rgba(255,255,255,.12)');
    c.fillStyle = g; c.fillRect(0, 0, W, TABLE);
    c.fillStyle = tableCol || col; c.fillRect(0, TABLE, W, H - TABLE);
    const t = c.createLinearGradient(0, TABLE, 0, H); t.addColorStop(0, 'rgba(255,255,255,.18)'); t.addColorStop(1, 'rgba(0,0,0,.25)');
    c.fillStyle = t; c.fillRect(0, TABLE, W, H - TABLE);
    // a hard window-light slash across the backdrop
    c.save(); c.globalAlpha = .1; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(1100, 0); c.lineTo(1500, 0); c.lineTo(900, TABLE); c.lineTo(500, TABLE); c.fill(); c.restore();
  }
  // Cast shadow: the silhouette flattened onto the table behind the object (key light front-left)
  function shadow(c, path, baseX, baseY, len = .9, k = .32, a = .32) {
    c.save(); c.translate(baseX, baseY); c.transform(1, 0, -len, k, 0, 0); c.translate(-baseX, -baseY);
    c.fillStyle = `rgba(10,5,0,${a})`; c.fill(path); c.restore();
  }
  function shade(c, path, x0, y0, x1, y1, stops) {
    const g = c.createLinearGradient(x0, y0, x1, y1); stops.forEach(([o, col]) => g.addColorStop(o, col)); c.fillStyle = g; c.fill(path);
  }
  const spec = (c, x, y, w, h, a = .8) => { c.save(); c.globalAlpha = a; c.fillStyle = '#fff'; c.beginPath(); c.ellipse(x, y, w, h, 0, 0, 7); c.fill(); c.restore(); };

  // ---------- hands ----------
  const MITT = P('M0,-40 C60,-48 120,-46 152,-30 C178,-18 178,18 152,28 C120,38 60,42 0,40 Z');
  const THUMB = P('M40,-38 C58,-74 98,-84 106,-62 C110,-48 86,-40 72,-32 Z');
  const FIST = P('M0,-44 C50,-52 110,-50 130,-30 C146,-10 146,20 130,36 C110,52 50,50 0,44 Z');
  const POINT = P('M0,-40 C50,-46 100,-44 128,-30 L232,-26 C248,-24 248,-6 232,-4 L130,-2 C140,10 136,28 122,34 C96,44 50,44 0,40 Z');
  function hand(c, who, x, y, rot, s, pose = 'flat') {
    const K = who === 'K';
    const skin = K ? '#b97a4e' : '#d7a073';
    c.save(); c.translate(x, y); c.rotate(rot); c.scale(s, s);
    // sleeve
    const cuff = P('M-420,-58 L6,-50 L6,50 L-420,58 Z');
    if (K) { c.fillStyle = '#3e63a8'; c.fill(cuff); c.save(); c.clip(cuff); c.fillStyle = 'rgba(255,255,255,.22)'; for (let i = -420; i < 10; i += 40) c.fillRect(i, -60, 12, 120); for (let j = -60; j < 60; j += 40) c.fillRect(-420, j, 430, 10); c.restore(); }
    else { c.fillStyle = '#2f7a46'; c.fill(cuff); }
    const body = pose === 'point' ? POINT : pose === 'fist' ? FIST : MITT;
    shade(c, body, 0, -50, 0, 50, [[0, skin], [1, K ? '#8a5432' : '#b07a52']]);
    if (pose !== 'fist') shade(c, THUMB, 40, -80, 100, -30, [[0, skin], [1, K ? '#8a5432' : '#b07a52']]);
    c.strokeStyle = 'rgba(60,25,10,.35)'; c.lineWidth = 3;
    for (const k of [-14, 4, 22]) { c.beginPath(); c.moveTo(pose === 'fist' ? 110 : 132, k); c.lineTo(pose === 'fist' ? 140 : 162, k); c.stroke(); }
    if (!K) { // bangles
      for (const [bx, col] of [[-30, '#d8a624'], [-48, '#c1272d'], [-66, '#d8a624'], [-84, '#c1272d']]) { c.fillStyle = col; c.fillRect(bx, -56, 13, 112); c.fillStyle = 'rgba(255,255,255,.4)'; c.fillRect(bx + 2, -50, 3, 100); }
    }
    c.restore();
  }

  // ---------- objects ----------
  function board(c, x, y) {
    const top = P(`M${x - 340},${y - 40} L${x + 340},${y - 40} L${x + 360},${y + 40} L${x - 360},${y + 40} Z`);
    shadow(c, top, x, y + 40);
    shade(c, top, 0, y - 40, 0, y + 40, [[0, '#d39a5c'], [1, '#b47a40']]);
    c.fillStyle = '#8a5428'; c.fillRect(x - 360, y + 40, 720, 26);
    c.strokeStyle = 'rgba(100,50,10,.25)'; c.lineWidth = 2; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(x - 330, y - 26 + i * 15); c.bezierCurveTo(x - 100, y - 36 + i * 15, x + 100, y - 16 + i * 15, x + 340, y - 26 + i * 15); c.stroke(); }
  }
  function knife(c, x, y, rot) {
    c.save(); c.translate(x, y); c.rotate(rot);
    const blade = P('M0,-30 L380,-22 C420,-14 430,8 400,14 L0,22 Z'), handle = P('M-200,-26 L0,-26 L0,26 L-200,26 C-214,26 -214,-26 -200,-26 Z');
    shade(c, blade, 0, -30, 0, 22, [[0, '#f4f6f7'], [.5, '#aab3b9'], [1, '#6c757b']]);
    c.fillStyle = '#1d1d1f'; c.fill(handle); for (const rx of [-160, -100, -40]) { c.fillStyle = '#c9ccd0'; c.beginPath(); c.arc(rx, 0, 7, 0, 7); c.fill(); }
    spec(c, 200, -14, 150, 3, .9);
    c.restore();
  }
  function onionSlices(c, x, y, n) { for (let i = 0; i < n; i++) { const ox = x + i * 34; c.fillStyle = '#7a2a5c'; c.beginPath(); c.ellipse(ox, y, 14, 34, 0, 0, 7); c.fill(); c.strokeStyle = '#e8c4dc'; c.lineWidth = 3; c.beginPath(); c.ellipse(ox, y, 8, 24, 0, 0, 7); c.stroke(); } }
  function bowl(c, x, y, s = 1) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const b = P('M-170,-60 L170,-60 C160,30 100,80 0,80 C-100,80 -160,30 -170,-60 Z');
    shadow(c, b, 0, 80);
    shade(c, b, -170, 0, 170, 0, [[0, '#dfe4e7'], [.3, '#8d979d'], [.7, '#f1f4f5'], [1, '#7c868c']]);
    c.fillStyle = '#f6f2e8'; c.beginPath(); c.ellipse(0, -60, 170, 36, 0, 0, 7); c.fill();
    c.fillStyle = '#e6dfcf'; c.beginPath(); c.ellipse(20, -56, 120, 22, 0, 0, 7); c.fill();
    spec(c, -110, -10, 10, 40, .7);
    c.restore();
  }
  function plate(c, x, y, s = 1, food = true, broken = 0) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const p = P('M-300,0 A300,80 0 1 0 300,0 A300,80 0 1 0 -300,0 Z');
    shadow(c, p, 0, 80, .6, .3, .25);
    c.fillStyle = '#f4f1ea'; c.fill(p); c.fillStyle = '#e2ddd2'; c.beginPath(); c.ellipse(0, 4, 210, 52, 0, 0, 7); c.fill();
    if (food) {
      for (const [side, dx] of [[-1, -broken * 60], [1, broken * 60]]) {
        c.save(); c.translate(dx, -broken * 20); c.rotate(side * broken * .1);
        c.beginPath(); c.rect(side < 0 ? -400 : 0, -200, 400, 400); c.clip();
        c.fillStyle = '#e9c46a'; c.beginPath(); c.ellipse(0, -12, 190, 54, 0, 0, 7); c.fill();
        for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(170,110,30,.35)'; c.beginPath(); c.arc((hash(i) - .5) * 340, -12 + (hash(i + 3) - .5) * 80, 4 + hash(i + 6) * 7, 0, 7); c.fill(); }
        for (let i = 0; i < 30; i++) { c.fillStyle = ['#c1272d', '#2f8a3e', '#f2efe6'][i % 3]; c.fillRect((hash(i + 11) - .5) * 280, -20 + (hash(i + 13) - .5) * 50, 14, 10); }
        c.restore();
      }
    }
    c.restore();
  }
  function cooker(c, x, y, t, pressure, whistle) {
    // stove
    c.fillStyle = '#1c1c1e'; c.fillRect(x - 380, y + 10, 760, 50);
    for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI; c.fillStyle = `rgba(80,150,255,${.6 + .3 * Math.sin(t * 20 + i)})`; c.beginPath(); c.ellipse(x + Math.cos(a) * 150, y + 8, 14, 22 + 6 * Math.sin(t * 15 + i), 0, 0, 7); c.fill(); }
    const jig = whistle ? Math.sin(t * 60) * 8 : pressure * Math.sin(t * 30) * 3;
    const body = P(`M${x - 230},${y - 300} L${x + 230},${y - 300} L${x + 240},${y} C${x + 160},${y + 20} ${x - 160},${y + 20} ${x - 240},${y} Z`);
    shadow(c, body, x, y + 10, .7, .3, .25);
    shade(c, body, x - 240, 0, x + 240, 0, [[0, '#6c757b'], [.25, '#e9edef'], [.45, '#b8c0c5'], [.8, '#f5f7f8'], [1, '#717a80']]);
    const lid = P(`M${x - 250},${y - 300} C${x - 200},${y - 360} ${x + 200},${y - 360} ${x + 250},${y - 300} Z`);
    shade(c, lid, x - 250, 0, x + 250, 0, [[0, '#7c868c'], [.3, '#f5f7f8'], [1, '#7c868c']]);
    c.fillStyle = '#1d1d1f'; c.fillRect(x + 220, y - 330, 300, 34); c.fillRect(x - 520, y - 220, 300, 30);
    // whistle weight
    c.save(); c.translate(x, y - 350 + jig - (whistle ? 14 : 0)); c.fillStyle = '#2a2a2c'; c.fillRect(-26, -60, 52, 60); c.beginPath(); c.arc(0, -60, 26, Math.PI, 0); c.fill(); spec(c, -10, -40, 4, 16, .5); c.restore();
    // steam
    const n = Math.floor(pressure * 10) + (whistle ? 14 : 0);
    for (let i = 0; i < n; i++) { const k = ((t * (whistle ? 1.6 : .6) + i * .13) % 1); c.fillStyle = `rgba(255,255,255,${.5 * (1 - k)})`; c.beginPath(); c.arc(x + Math.sin(i * 3 + t) * 40 * k, y - 420 - k * (whistle ? 600 : 300), 20 + k * (whistle ? 120 : 60), 0, 7); c.fill(); }
  }
  function phone(c, x, y, rot, screen) {
    c.save(); c.translate(x, y); c.rotate(rot);
    const body = P('M-150,-300 L150,-300 C170,-300 180,-290 180,-270 L180,270 C180,290 170,300 150,300 L-150,300 C-170,300 -180,290 -180,270 L-180,-270 C-180,-290 -170,-300 -150,-300 Z');
    shadow(c, body, 0, 300, .4, .2, .2);
    c.fillStyle = '#111'; c.fill(body);
    c.save(); c.beginPath(); c.roundRect(-160, -280, 320, 560, 18); c.clip(); screen(c); c.restore();
    c.restore();
  }
  function calendar(c, x, y, marks) {
    const p = P(`M${x - 300},${y - 380} L${x + 300},${y - 380} L${x + 300},${y + 340} L${x - 300},${y + 340} Z`);
    shadow(c, p, x, y + 340, .25, .1, .2);
    c.fillStyle = '#f6f3ec'; c.fill(p); c.fillStyle = '#c1272d'; c.fillRect(x - 300, y - 380, 600, 150);
    c.font = '90px Anton'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SEPTEMBER', x, y - 300);
    c.fillStyle = '#1b1b1b'; c.font = '300px Anton'; c.fillText('21', x, y + 10);
    c.font = '700 54px SpaceMono'; c.fillText('SUNDAY', x, y + 240);
    if (marks > 0) { c.save(); c.strokeStyle = '#c1272d'; c.lineWidth = 16; c.lineCap = 'round'; c.beginPath(); c.ellipse(x, y + 10, 200, 190, -.2, -1, -1 + Math.PI * 2 * clamp(marks)); c.stroke(); c.restore(); }
    if (marks > 1.2) { c.save(); c.translate(x + 120, y + 330); c.rotate(-.12); c.font = '120px Anton'; c.fillStyle = '#c1272d'; c.fillText('JUNG', 0, 0); c.restore(); }
  }
  function ring(c, x, y, s) {
    c.save(); c.translate(x, y); c.scale(s, s);
    const outer = P('M-100,0 A100,40 0 1 0 100,0 A100,40 0 1 0 -100,0 Z M-70,0 A70,24 0 1 1 70,0 A70,24 0 1 1 -70,0 Z');
    shadow(c, outer, 0, 40, .9, .3, .3);
    c.fillStyle = '#b8862b'; c.fill(outer, 'evenodd');
    c.save(); c.translate(0, -26); shade(c, outer, -100, 0, 100, 0, [[0, '#8a5a12'], [.3, '#ffe08a'], [.5, '#d9a43a'], [.8, '#fff2b8'], [1, '#8a5a12']]); c.restore();
    c.fillStyle = '#b8862b'; c.fillRect(-100, -26, 0, 0);
    spec(c, 40, -46, 18, 5, .9);
    c.restore();
  }

  // ---------- shots ----------
  function shots(c, t) {
    const S = [
      ['chop', TL.lead_in], ['chilli', T('n01')], ['recipe', T('n03')], ['laundry', T('j01') - 1.5], ['cooker', T('k04')],
      ['handle', T('j07')], ['fridge', E('j09') + .1], ['phone', T('k07')], ['calendar', T('j11')], ['ring', T('j13')], ['plate', T('k08')], ['empty', T('k10') - .3],
    ];
    let cur = S[0], next = null;
    for (let i = 0; i < S.length; i++) if (t >= S[i][1]) { cur = S[i]; next = S[i + 1]; }
    const age = t - cur[1], len = (next ? next[1] : TL.end_card) - cur[1];
    const push = 1 + .05 * (age / len);
    c.translate(W / 2, H / 2); c.scale(push, push); c.translate(-W / 2, -H / 2);
    const id = cur[0];
    if (id === 'chop') {
      backdrop(c, '#e0a526', '#d39a1f');
      const ask = t > T('k02');
      const up = !ask && Math.sin(t * 15) > 0;
      bowl(c, 1460, 760);
      board(c, 820, 800);
      onionSlices(c, 640, 770, Math.min(8, 2 + Math.floor((t - TL.lead_in) * 1.4)));
      knife(c, 920, up ? 640 : 740, up ? -.25 : -.02);
      hand(c, 'K', 760, up ? 640 : 742, up ? -.25 : -.02, 1, 'fist');
      if (ask) { c.font = '80px Anton'; c.fillStyle = '#1b1b1b'; c.textAlign = 'left'; c.fillText('?', 1100 + Math.sin(t * 3) * 6, 420); }
    } else if (id === 'chilli') {
      backdrop(c, '#c4532f', '#b04826');
      plate(c, 960, 820, 1.2);
      const drop = inv(T('n02') + .3, T('n02') + .9, t);
      if (drop > 0) { c.save(); c.translate(960, lerp(-200, 760, easeIn(drop))); c.rotate(1.2 + drop * .4); const ch = P('M-30,-130 C30,-140 40,60 0,150 C-30,60 -60,-90 -30,-130 Z'); shade(c, ch, -40, 0, 40, 0, [[0, '#8a0f0f'], [.4, '#e8261c'], [1, '#7a0a0a']]); c.fillStyle = '#2f7a2e'; c.fillRect(-26, -170, 30, 50); spec(c, -8, -40, 5, 50, .6); c.restore(); }
      if (t > T('n02') + 1) { for (let i = 0; i < 6; i++) { const k = ((t * .8 + i * .17) % 1); c.fillStyle = `rgba(255,80,40,${.45 * (1 - k)})`; c.beginPath(); c.arc(900 + i * 24, 700 - k * 400, 30 + k * 60, 0, 7); c.fill(); } }
    } else if (id === 'recipe') {
      backdrop(c, '#8fae8b', '#7e9c7a');
      c.translate(0, -300);
      const card = P('M560,560 L1360,540 L1380,1000 L540,1010 Z');
      shadow(c, card, 960, 1000, .3, .08, .25);
      c.fillStyle = '#fbf8ef'; c.fill(card);
      c.strokeStyle = 'rgba(60,110,190,.35)'; c.lineWidth = 3; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(580, 640 + i * 60); c.lineTo(1360, 630 + i * 60); c.stroke(); }
      c.font = '700 40px Kalam'; c.fillStyle = '#23305a'; c.textAlign = 'left';
      ['Dahi ke Sholay', '1. Bread ke kinare kaato', '2. Dahi + namak + mirch', '3. Bharo, mod do, tal lo'].forEach((s, i) => c.fillText(s, 600, 625 + i * 60));
      const irr = t > T('n06') + .6;
      hand(c, 'K', 600, 820, -.2, 1, 'point');
      if (!irr) hand(c, 'J', 1500, 700, Math.PI + .25, 1, 'point');
      else { const k = easeOut(clamp((t - T('n06') - .6) * 1.5)); hand(c, 'J', lerp(1500, 2100, k), 700, Math.PI + .25, 1, 'flat'); }
      if (irr) { const tap = Math.abs(Math.sin(t * 9)) * 18; c.save(); c.translate(0, -tap); hand(c, 'K', 760, 760, -.2, 1, 'point'); c.restore(); }
    } else if (id === 'laundry') {
      backdrop(c, '#3d7d86', '#346c74');
      const k = easeOut(clamp(age / .9));
      const pile = P('M640,820 C620,700 760,640 960,650 C1160,640 1300,700 1280,820 Z');
      c.save(); c.translate(0, (1 - k) * -700);
      shadow(c, pile, 960, 820);
      c.fillStyle = '#e9e2d0'; c.fill(pile);
      for (const [col, yy, w] of [['#c1272d', 760, 300], ['#e0a526', 720, 260], ['#3e63a8', 690, 220]]) { c.fillStyle = col; c.beginPath(); c.ellipse(960 + Math.sin(yy) * 40, yy, w, 40, 0, 0, 7); c.fill(); }
      c.restore();
      for (let i = 0; i < 12; i++) { const kk = ((t * 1.2 + i * .19) % 1); c.fillStyle = 'rgba(200,235,255,.8)'; c.beginPath(); c.ellipse(700 + hash(i) * 520, 820 + kk * 160, 6, 10, 0, 0, 7); c.fill(); }
      hand(c, 'J', 1500, 640, Math.PI - .1, 1, 'flat');
    } else if (id === 'cooker') {
      backdrop(c, '#a8392b', '#923022');
      const lines = ['j03', 'j04', 'j05', 'k05', 'j06'];
      let p = 0; for (const lid of lines) if (t > T(lid)) p += .2;
      const whistle = (t > T('k05') + .5 && t < T('k05') + 2.6) || (t > T('j06') && t < E('j06') + .6);
      cooker(c, 900, 900, t, clamp(p), whistle);
      if (whistle) { c.save(); c.font = '150px Anton'; c.fillStyle = '#fff'; c.textAlign = 'center'; c.translate(1450, 360); c.rotate(-.1); c.fillText('FIGHT MODE: ON', 0, 0); c.restore(); }
    } else if (id === 'handle') {
      backdrop(c, '#d8d2c4', '#c9c2b2');
      const door = P('M300,-20 L1700,-20 L1700,1100 L300,1100 Z');
      c.fillStyle = '#ecebe6'; c.fill(door); c.fillStyle = 'rgba(0,0,0,.08)'; c.fillRect(300, 420, 1400, 8);
      const handle = P('M1280,180 L1340,180 L1340,880 L1280,880 Z');
      shadow(c, handle, 1310, 880, -.2, .05, .2);
      shade(c, handle, 1280, 0, 1340, 0, [[0, '#7c868c'], [.4, '#f5f7f8'], [1, '#7c868c']]);
      const k = easeOut(clamp((t - T('k06')) / 1.2));
      if (t > T('k06')) hand(c, 'K', lerp(400, 1300, k), 520, 0, 1.1, k > .95 ? 'fist' : 'flat');
      c.save(); c.translate(780, 280); c.rotate(.06); c.fillStyle = '#e0a526'; c.fillRect(-90, -60, 180, 120); c.font = '64px Anton'; c.fillStyle = '#1b1b1b'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('SUN', 0, 4); c.restore();
    } else if (id === 'fridge') {
      c.fillStyle = '#cfe9f4'; c.fillRect(0, 0, W, H);
      const g = c.createRadialGradient(960, 200, 50, 960, 400, 1100); g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(1, 'rgba(60,120,160,.5)'); c.fillStyle = g; c.fillRect(0, 0, W, H);
      c.fillStyle = 'rgba(255,255,255,.6)'; c.fillRect(0, 800, W, 12); c.fillRect(0, 300, W, 12);
      const turn = easeInOut(clamp((t - T('j10') - .2) / .9));
      c.save(); c.translate(960, 560);
      const bag = P('M-360,-220 C-380,-260 -300,-280 -240,-260 L240,-260 C300,-280 380,-260 360,-220 L360,230 L-360,230 Z');
      shadow(c, bag, 0, 230, .3, .25, .2);
      c.fillStyle = 'rgba(255,255,255,.55)'; c.fill(bag);
      c.fillStyle = '#d99a3a'; c.beginPath(); c.roundRect(-320, -200, 640, 400, 60); c.fill();
      c.fillStyle = '#f2d39a'; c.beginPath(); c.roundRect(-280, -150, 560, 300, 40); c.fill();
      for (let i = 0; i < 14; i++) { c.fillStyle = 'rgba(60,110,40,.55)'; c.beginPath(); c.arc(-240 + hash(i + 1) * 480, -120 + hash(i + 2) * 240, 10 + hash(i + 3) * 28, 0, 7); c.fill(); }
      // the tag swings round to face camera
      c.save(); c.translate(250, 210); c.scale(Math.max(.05, turn), 1);
      c.fillStyle = '#fff'; c.fillRect(-170, -60, 340, 120); c.font = '700 52px SpaceMono'; c.fillStyle = '#c1272d'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('EXP 14 JUL', 0, 4);
      c.restore();
      spec(c, -200, -230, 120, 8, .7);
      c.restore();
    } else if (id === 'phone') {
      backdrop(c, '#1f2a44', '#1a2338');
      hand(c, 'K', 1180, 700, -.2, 1.3, 'flat');
      phone(c, 960, 540, -.05, g => {
        g.fillStyle = '#f2efe8'; g.fillRect(-170, -290, 340, 580);
        g.fillStyle = '#e0a526'; g.fillRect(-170, -290, 340, 110);
        g.font = '40px Anton'; g.fillStyle = '#1b1b1b'; g.textAlign = 'center'; g.fillText('ORDER PLACED', 0, -220);
        g.font = '700 26px SpaceMono'; g.fillText('Dahi ke Sholay x1', 0, -120); g.fillText('Arriving: 35 min', 0, -80);
        g.fillStyle = '#2f8a3e'; g.beginPath(); g.arc(0, 60, 70, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 14; g.beginPath(); g.moveTo(-30, 60); g.lineTo(-6, 86); g.lineTo(36, 30); g.stroke();
      });
    } else if (id === 'calendar') {
      backdrop(c, '#e98aa0', '#d97b91');
      c.translate(1180, 450); c.scale(.85, .85); c.translate(-960, -520);
      calendar(c, 960, 520, clamp((t - T('j11') - .4) / 1.2) + (t > T('j12') ? 1.3 : 0));
    } else if (id === 'ring') {
      backdrop(c, '#23305a', '#1d2850');
      const k = easeInOut(clamp((t - T('j13') - 1.2) / 1.2));
      ring(c, lerp(960, 1460, k), 800, 1.4);
      hand(c, 'J', lerp(560, 1100, k), 760, -.05, 1.1, 'flat');
      if (k > .9) { c.font = '700 44px SpaceMono'; c.fillStyle = '#e8e4da'; c.textAlign = 'center'; c.fillText('valid till: Monday', 1460, 560); }
    } else if (id === 'plate') {
      backdrop(c, '#e0a526', '#d39a1f');
      const k = easeOut(clamp((t - T('k09')) / 1.0));
      plate(c, 1060, lerp(1300, 700, k), 1.2, true);
      hand(c, 'K', lerp(600, 760, k) - 160, lerp(1300, 740, k), -.1, 1.2, 'flat');
    } else if (id === 'empty') {
      backdrop(c, '#b52a22', '#a02520');
      const yell = t > T('j14');
      const hop = yell ? Math.abs(Math.sin((t - T('j14')) * 18)) * 40 * Math.exp(-(t - T('j14')) * 1.2) : 0;
      plate(c, 960, 700 - hop, 1.2, true, yell ? easeOut(clamp((t - T('j14')) * 4)) : 0);
      // steel glass
      const gl = P(`M1440,${520 - hop * 1.3} L1600,${520 - hop * 1.3} L1580,${840 - hop * 1.3} L1460,${840 - hop * 1.3} Z`);
      shadow(c, gl, 1520, 840);
      shade(c, gl, 1440, 0, 1600, 0, [[0, '#6c757b'], [.3, '#f5f7f8'], [.6, '#aab3b9'], [1, '#6c757b']]);
      if (!yell) { c.font = '700 46px SpaceMono'; c.fillStyle = 'rgba(255,240,220,.8)'; c.textAlign = 'center'; c.fillText('(Karun, doosre kamre se)', 960, 300); }
    }
  }

  // ---------- caption: a packaging label ----------
  const TAB = { K: '#3e63a8', J: '#2f7a46', N: '#1b1b1b' };
  function caption(c, t) {
    const l = lineAt(t);
    if (!l || t > TL.end_card) return;
    const a = clamp(l.age * 8) * clamp(l.left * 6);
    c.save(); c.globalAlpha = a;
    c.font = '700 42px SpaceMono';
    const lines = balanceWrap(c, l.text, 1150);
    const w = Math.max(...lines.map(s => c.measureText(s).width)) + 260, h = lines.length * 56 + 60;
    const x = 110, y = 1010 - h;
    c.fillStyle = 'rgba(0,0,0,.25)'; c.fillRect(x + 8, y + 8, w, h);
    c.fillStyle = '#fbfaf6'; c.fillRect(x, y, w, h);
    c.fillStyle = TAB[l.spk]; c.fillRect(x, y, 22, h);
    c.font = '34px Anton'; const nw = c.measureText(l.name.toUpperCase()).width + 36;
    c.fillStyle = TAB[l.spk]; c.fillRect(x, y - 50, nw, 50); c.fillStyle = '#fbfaf6'; c.textBaseline = 'middle'; c.fillText(l.name.toUpperCase(), x + 18, y - 23);
    c.font = '700 42px SpaceMono'; c.fillStyle = '#1b1b1b'; c.textBaseline = 'middle';
    lines.forEach((s, i) => c.fillText(s, x + 50, y + 30 + 28 + i * 56));
    // barcode
    c.fillStyle = '#1b1b1b'; let bx = x + w - 170;
    for (let i = 0; i < 28; i++) { const bw = 1 + Math.floor(hash(l.i * 50 + i) * 4); c.fillRect(bx, y + 22, bw, h - 60); bx += bw + 2 + Math.floor(hash(i + 7) * 3); }
    c.font = '700 16px SpaceMono'; c.textBaseline = 'alphabetic'; c.fillText('02-' + l.id.toUpperCase(), x + w - 168, y + h - 14);
    c.restore();
  }

  function card(c, t, end) {
    backdrop(c, end ? '#1f2a44' : '#c4532f', end ? '#1a2338' : '#b04826');
    if (!end) {
      const p = P('M-260,0 A260,90 0 1 0 260,0 A260,90 0 1 0 -260,0 Z');
      c.save(); c.translate(960, 800); c.rotate(Math.sin(t) * .02);
      shadow(c, p, 0, 90, .8, .3, .3);
      c.fillStyle = '#ecc978'; c.fill(p);
      for (let i = 0; i < 50; i++) { c.fillStyle = 'rgba(160,100,30,.35)'; c.beginPath(); c.arc((hash(i) - .5) * 460, (hash(i + 3) - .5) * 140, 4 + hash(i + 6) * 9, 0, 7); c.fill(); }
      spec(c, -100, -40, 80, 8, .5);
      c.restore();
    }
    c.textAlign = 'center'; c.fillStyle = '#fbfaf6';
    c.font = '260px Anton'; c.fillText(end ? 'THE END' : 'PAAPAD', 960, 470);
    c.font = '700 44px SpaceMono'; c.fillText(end ? 'Style 05 · The Object Witness' : 'Kahaani No. 02 · no faces, only evidence', 960, 570);
  }

  defineStyle({
    fps: 24,
    fonts: ['700 42px SpaceMono', '40px Anton', '700 40px Kalam'],
    init() { GR = grainCanvas(W, H, 26, 12); },
    draw(c, t) {
      c.save();
      if (t > T('j14')) { c.translate((hash(Math.floor(t * 24)) - .5) * 16 * Math.exp(-(t - T('j14'))), (hash(Math.floor(t * 24) + 9) - .5) * 16 * Math.exp(-(t - T('j14')))); }
      if (t < TL.lead_in - .1) card(c, t, false);
      else if (t > TL.end_card) card(c, t, true);
      else shots(c, t);
      c.restore();
      c.globalCompositeOperation = 'overlay'; c.globalAlpha = .35; c.drawImage(GR, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      caption(c, t);
    },
  });
})();
