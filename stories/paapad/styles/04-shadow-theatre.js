// Style 04: Shadow theatre (after Tholu Bommalata / Ravanchhaya). Translucent painted-leather puppets
// pressed against a cloth screen lit by an oil lamp. Hinged jaws do the talking, rods show from below,
// light leaks through punched patterns. Captions sit on the dark stage floor.
(() => {
  const FLOOR = 900;
  const L = { line: '#2a1206', hole: '#fff0c2', red: '#c4260f', green: '#2c7a20', yellow: '#e89c12', indigo: '#2e3592', skinK: '#c8763e', skinJ: '#de9a5c', black: '#3a1c10', white: '#f2d9a0' };
  let CLOTH = null;
  const P = s => new Path2D(s);
  let LAMP = 1;

  function screen(c, t, cx = 960) {
    const fl = 1 + noise1(t * 6) * .05 + noise1(t * 17 + 3) * .025;
    LAMP = fl;
    const g = c.createRadialGradient(cx, 460, 60, cx, 520, 1250);
    g.addColorStop(0, '#ffdc98'); g.addColorStop(.32, '#eea04c'); g.addColorStop(.68, '#8a3c12'); g.addColorStop(1, '#160502');
    c.fillStyle = g; c.fillRect(0, 0, W, FLOOR);
    c.drawImage(CLOTH, 0, 0);
    c.fillStyle = `rgba(0,0,0,${clamp(.18 - (fl - 1) * 2, 0, .4)})`; c.fillRect(0, 0, W, FLOOR);
  }
  function floor(c) {
    const g = c.createLinearGradient(0, FLOOR - 30, 0, H); g.addColorStop(0, '#1a0a03'); g.addColorStop(1, '#070302');
    c.fillStyle = g; c.fillRect(0, FLOOR, W, H - FLOOR);
    c.fillStyle = 'rgba(255,200,120,.25)'; c.fillRect(0, FLOOR - 3, W, 3);
  }

  // Translucent leather: colour multiplied by the light, a dark cut edge, light through punched holes
  function leather(c, path, col, holes) {
    c.save(); c.globalCompositeOperation = 'multiply'; c.fillStyle = col; c.fill(path); c.restore();
    c.save(); c.strokeStyle = L.line; c.lineWidth = 5; c.lineJoin = 'round'; c.stroke(path); c.restore();
    if (holes) { c.save(); c.clip(path); holes(c); c.restore(); }
  }
  const dots = (pts, r = 4) => c => { c.fillStyle = L.hole; c.globalAlpha = .85; for (const [x, y] of pts) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); } c.globalAlpha = 1; };
  function rowDots(x0, x1, y, step = 16) { const p = []; for (let x = x0; x <= x1; x += step) p.push([x, y]); return p; }
  function zig(c, x0, x1, y, h = 10, step = 20) { c.save(); c.strokeStyle = L.hole; c.globalAlpha = .7; c.lineWidth = 3; c.beginPath(); for (let x = x0, i = 0; x <= x1; x += step / 2, i++) c.lineTo(x, y + (i % 2 ? h : -h)); c.stroke(); c.restore(); }
  function rod(c, x, y) { c.save(); c.strokeStyle = 'rgba(30,10,2,.55)'; c.lineWidth = 7; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (960 - x) * .08, FLOOR + 40); c.stroke(); c.restore(); }
  function pin(c, x, y) { c.fillStyle = L.line; c.beginPath(); c.arc(x, y, 6, 0, 7); c.fill(); c.fillStyle = 'rgba(255,220,150,.6)'; c.beginPath(); c.arc(x - 1.5, y - 1.5, 2, 0, 7); c.fill(); }

  // ---------- puppets (profile, facing +x) ----------
  // pose: {near:[shoulder, elbow], far:[s,e], jaw 0..1, brow 'calm'|'angry'|'worried', eye 'open'|'wide'|'shut', hold, lean}
  function limb(c, ang, sleeve, skin, hold, rods = true) {
    const [a1, a2] = ang;
    const pts = [];
    c.save(); c.rotate(a1);
    leather(c, P('M-22,-6 C-26,60 -22,110 -16,150 L18,150 C24,110 26,60 22,-6 Z'), sleeve, dots([[0, 40], [0, 70], [0, 100]], 4));
    pin(c, 0, 0);
    c.translate(0, 150); c.rotate(a2);
    leather(c, P('M-16,-4 L-12,140 L12,140 L16,-4 Z'), skin);
    leather(c, P('M-16,136 C-24,160 -10,190 6,186 C22,182 22,150 14,136 Z'), skin);
    pin(c, 0, 0);
    if (hold) { c.save(); c.translate(0, 168); hold(c); c.restore(); }
    const m = c.getTransform(); pts.push([m.e + m.c * 170, m.f + m.d * 170]);
    c.restore();
    return pts[0];
  }
  function puppet(c, who, x, y, s, dir, pose, t) {
    const K = who === 'K';
    const skin = K ? L.skinK : L.skinJ;
    const sleeve = K ? L.indigo : L.green;
    const sway = Math.sin(t * 1.3 + (K ? 0 : 2)) * .015 + (pose.lean || 0);
    const yy = 862 - 392 * s * .74 + (y - 500) * .74;
    s *= .74;
    c.save(); c.translate(x, yy); c.scale(s * dir, s); c.rotate(sway);
    const hands = [];
    // far arm
    c.save(); c.translate(-6, -340); c.globalAlpha = .9; const fh = limb(c, pose.far || [.25, -.2], sleeve, skin, pose.holdFar); c.restore(); hands.push(fh);
    // body
    if (K) {
      leather(c, P('M-62,40 L-28,40 L-46,370 L-92,376 Z'), '#7a5a3a', dots(rowDots(-60, -40, 120, 20)));
      leather(c, P('M6,40 L40,40 L74,370 L30,376 Z'), '#7a5a3a');
      leather(c, P('M-92,376 L-40,376 L-60,392 L-110,392 Z M30,376 L80,376 L92,392 L40,392 Z'), L.black);
      leather(c, P('M-62,-372 L50,-372 C94,-330 104,-200 92,60 L-86,60 C-104,-200 -104,-330 -62,-372 Z'), L.yellow, c => { zig(c, -80, 90, -330); zig(c, -90, 92, 30); dots([[10, -280], [10, -230], [10, -180], [10, -130], [10, -80]], 6)(c); });
      leather(c, P('M-30,-200 L60,-200 L70,40 L-40,40 Z'), '#e9dcc0', dots(rowDots(-24, 56, -180, 14), 3));   // apron
    } else {
      leather(c, P('M-84,-90 L84,-90 C116,100 140,280 156,384 L-140,384 C-128,280 -114,100 -84,-90 Z'), L.red, c => { zig(c, -150, 160, 340, 12, 26); dots(rowDots(-140, 150, 365, 20), 5)(c); for (const px of [-40, 10, 60]) { c.strokeStyle = L.hole; c.globalAlpha = .5; c.lineWidth = 3; c.beginPath(); c.moveTo(px, -60); c.lineTo(px + 20, 320); c.stroke(); c.globalAlpha = 1; } });
      leather(c, P('M-62,-372 L50,-372 C86,-330 96,-220 84,-80 L-84,-80 C-98,-220 -98,-330 -62,-372 Z'), L.green, dots([[20, -300], [36, -270], [20, -240]], 5));
      leather(c, P('M-70,-370 C20,-330 80,-200 96,-60 L60,-50 C40,-180 -10,-290 -80,-330 Z'), L.yellow, c => zig(c, -80, 100, -200, 8, 18));   // pallu
    }
    // neck
    leather(c, P('M-20,-410 L28,-410 L34,-366 L-26,-366 Z'), skin);
    // head (upper) + hinged jaw
    if (!K) { leather(c, P('M-118,-520 C-118,-560 -60,-570 -56,-520 C-56,-480 -118,-480 -118,-520 Z'), L.black, dots([[-100, -540], [-80, -548], [-70, -520], [-96, -500]], 6)); }
    leather(c, P('M-52,-560 C10,-588 70,-566 82,-514 L86,-490 L108,-462 L92,-452 L96,-446 L44,-444 L36,-404 L-18,-400 C-52,-430 -72,-470 -68,-506 C-66,-534 -62,-550 -52,-560 Z'), skin);
    const jw = (pose.jaw || 0) * .32;
    c.save(); c.translate(40, -446); c.rotate(jw);
    leather(c, P('M0,0 L56,0 L58,8 L50,12 L54,22 C46,46 22,50 10,46 L-6,40 Z'), skin);
    c.restore();
    pin(c, 40, -446);
    // hair
    if (K) leather(c, P('M-58,-552 L-46,-604 L-24,-574 L-4,-616 L18,-580 L44,-610 L56,-570 L84,-540 C62,-574 4,-586 -42,-556 L-66,-500 L-70,-530 Z'), L.black);
    else { leather(c, P('M-60,-556 C0,-596 70,-574 82,-526 C40,-560 -20,-560 -50,-520 L-70,-430 C-80,-470 -76,-530 -60,-556 Z'), L.black); }
    // eye: a punched almond with a painted pupil
    const eye = pose.eye || 'open';
    c.save(); c.translate(42, -506);
    if (eye === 'shut') { c.strokeStyle = L.line; c.lineWidth = 5; c.beginPath(); c.moveTo(-22, 0); c.quadraticCurveTo(0, 8, 24, -2); c.stroke(); }
    else {
      const sc = eye === 'wide' ? 1.25 : 1; c.scale(sc, sc);
      const al = P('M-24,0 C-10,-14 14,-14 26,-2 C12,10 -10,10 -24,0 Z');
      c.fillStyle = L.hole; c.fill(al); c.fillStyle = L.line; c.beginPath(); c.arc(8, -3, 6.5, 0, 7); c.fill(); c.lineWidth = 3; c.strokeStyle = L.line; c.stroke(al);
    }
    c.restore();
    const b = pose.brow || 'calm';
    c.save(); c.strokeStyle = L.line; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath();
    if (b === 'angry') { c.moveTo(18, -540); c.lineTo(66, -524); } else if (b === 'worried') { c.moveTo(18, -526); c.lineTo(66, -542); } else { c.moveTo(16, -532); c.quadraticCurveTo(42, -546, 70, -532); }
    c.stroke(); c.restore();
    if (!K) { c.fillStyle = L.yellow; c.beginPath(); c.arc(-14, -440, 12, 0, 7); c.fill(); c.strokeStyle = L.line; c.lineWidth = 3; c.stroke(); c.beginPath(); c.arc(96, -452, 8, 0, 7); c.stroke(); c.fillStyle = L.red; c.beginPath(); c.arc(70, -540, 5, 0, 7); c.fill(); }
    if (K) { c.fillStyle = L.line; c.fill(P('M60,-458 C76,-462 92,-458 98,-452 C86,-448 70,-448 58,-452 Z')); }
    // near arm
    c.save(); c.translate(8, -340); const nh = limb(c, pose.near || [-.2, -.3], sleeve, skin, pose.holdNear); c.restore(); hands.push(nh);
    pin(c, 8, -340);
    c.restore();
    // rods from the hands, drawn in screen space
    if (!pose.noRods) for (const [hx, hy] of hands) rod(c, hx, hy);
  }

  // ---------- props ----------
  const knife = c => { c.rotate(-1.4); leather(c, P('M0,-10 L60,-10 L60,10 L0,10 Z'), '#6a3a14'); leather(c, P('M60,-12 L200,-8 C226,0 214,12 200,12 L60,12 Z'), '#cfd2c4', dots(rowDots(80, 190, 0, 22), 3)); };
  const ladle = c => { c.rotate(-.4); leather(c, P('M-8,0 L8,0 L8,-200 L-8,-200 Z'), '#8a6a3a'); leather(c, P('M-40,-200 C-40,-250 40,-250 40,-200 C40,-176 -40,-176 -40,-200 Z'), '#cfd2c4', dots([[-14, -210], [0, -222], [14, -210]], 5)); };
  const plate = c => { c.rotate(-1.2); leather(c, P('M-20,-150 C40,-160 160,-150 180,-110 C160,-80 40,-76 -20,-90 Z'), L.yellow, dots([[30, -120], [70, -126], [110, -118], [150, -112], [50, -100], [100, -96]], 6)); };
  const basket = c => { c.rotate(-1.6); leather(c, P('M-120,-60 L140,-60 L120,30 L-100,30 Z'), '#9a6a2a', c => { for (let y = -50; y < 30; y += 18) zig(c, -120, 140, y, 6, 16); }); };
  function heart(c, x, y, s, col, holes = true) { c.save(); c.translate(x, y); c.scale(s, s); leather(c, P('M0,40 C-80,-10 -56,-80 0,-40 C56,-80 80,-10 0,40 Z'), col, holes ? dots([[0, -10], [-24, -30], [24, -30], [0, 14]], 5) : null); c.restore(); }
  function sunPuppet(c, x, y, r, t) {
    c.save(); c.translate(x, y); c.rotate(t * .1);
    for (let i = 0; i < 16; i++) { c.save(); c.rotate(i / 16 * Math.PI * 2); leather(c, P(`M-14,${-r} L0,${-r - 70} L14,${-r} Z`), L.yellow); c.restore(); }
    c.restore();
    c.save(); c.translate(x, y);
    leather(c, P(`M${-r},0 A${r},${r} 0 1 0 ${r},0 A${r},${r} 0 1 0 ${-r},0 Z`), L.yellow, c => { for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; c.fillStyle = L.hole; c.globalAlpha = .8; c.beginPath(); c.arc(Math.cos(a) * r * .75, Math.sin(a) * r * .75, 6, 0, 7); c.fill(); } c.globalAlpha = 1; });
    c.restore();
  }
  function fridge(c, x, y, open) {
    c.save(); c.translate(x, y);
    // an ornate cabinet, like a temple door
    leather(c, P('M-190,-640 C-190,-700 190,-700 190,-640 L196,0 L-196,0 Z'), '#cfd2c4', c => { zig(c, -190, 190, -600, 12, 30); zig(c, -190, 190, -40, 12, 30); });
    if (open > 0) {
      c.fillStyle = '#fff6d6'; c.globalAlpha = .55 * open; c.fill(P('M-160,-600 L160,-600 L166,-60 L-166,-60 Z')); c.globalAlpha = 1;
      leather(c, P('M-160,-330 L160,-330 L160,-318 L-160,-318 Z'), L.line);
      leather(c, P('M-120,-430 C-130,-480 -40,-500 0,-480 C40,-500 130,-480 120,-430 L120,-340 L-120,-340 Z'), L.yellow, c => { c.fillStyle = '#2a4a10'; c.globalAlpha = .55; for (let i = 0; i < 10; i++) { c.beginPath(); c.arc(-90 + hash(i) * 180, -460 + hash(i + 3) * 110, 8 + hash(i + 5) * 14, 0, 7); c.fill(); } c.globalAlpha = 1; });
      leather(c, P('M-110,-220 L-30,-220 L-30,-80 L-110,-80 Z'), L.red); leather(c, P('M20,-200 C20,-240 120,-240 120,-200 L120,-80 L20,-80 Z'), L.green);
      // door swung toward the viewer: a narrowing panel on the left
      c.save(); c.translate(-196, 0); c.scale(-(1 - open) * .9 - .1, 1);
      leather(c, P('M0,-660 L390,-660 L390,0 L0,0 Z'), '#cfd2c4', c => zig(c, 0, 390, -330, 12, 30));
      c.restore();
    } else leather(c, P('M140,-520 L156,-520 L156,-380 L140,-380 Z'), L.line);
    c.restore();
  }
  function cloud(c, x, y, s, t) { c.save(); c.translate(x + Math.sin(t) * 10, y); c.scale(s, s); leather(c, P('M-160,40 C-200,40 -200,-30 -140,-30 C-140,-90 -40,-100 -20,-50 C10,-110 120,-90 110,-30 C170,-40 190,40 130,40 Z'), L.indigo, c => { for (let i = 0; i < 7; i++) { c.fillStyle = L.hole; c.globalAlpha = .7; c.fillRect(-120 + i * 36, 0, 6, 24); } c.globalAlpha = 1; }); c.restore(); }

  // ---------- captions on the floor ----------
  function caption(c, t) {
    const l = lineAt(t);
    if (!l) return;
    const a = clamp(l.age * 5) * clamp(l.left * 5);
    c.save(); c.globalAlpha = a; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = '600 48px Eczar';
    const lines = balanceWrap(c, l.text, 1500);
    const y0 = lines.length > 1 ? 975 : 1000;
    c.font = '800 26px Eczar'; c.fillStyle = '#e8a64a';
    c.fillText(l.name.toUpperCase().split('').join(' '), W / 2, y0 - 52);
    c.font = '600 48px Eczar'; c.fillStyle = '#f7e6c0';
    lines.forEach((s, i) => c.fillText(s, W / 2, y0 + i * 56));
    c.restore();
  }

  function scene(c, t) {
    const b = beatAt(t).name;
    if (b === 'open') {
      const chop = Math.sin(t * 15) > 0, ask = t > T('k02');
      puppet(c, 'K', 820, 500, 1.0, 1, { near: ask ? [-1.9, -.3] : [-1.0, chop ? -1.1 : -.6], holdNear: ask ? null : knife, far: [-.6, -.8], jaw: jaw(t, 'K'), brow: ask ? 'worried' : 'calm', eye: ask ? 'wide' : 'open' }, t);
      leather(c, P('M960,820 L1340,820 L1330,860 L970,860 Z'), '#8a5a2a', dots(rowDots(990, 1320, 840, 30), 4));
      for (let i = 0; i < 4; i++) leather(c, P(`M${1020 + i * 70},818 a26,22 0 1 1 52,0 Z`), '#7a2a5a');
      return;
    }
    if (b === 'narr' && t < T('n03')) {
      const tip = t > T('n02') + .9 ? easeOut(clamp((t - T('n02') - .9) * 2)) : 0;
      leather(c, P('M940,860 L980,860 L972,330 L948,330 Z'), '#8a6a3a');
      c.save(); c.translate(960, 330); c.rotate(-.25 * tip);
      leather(c, P('M-460,-10 L460,-10 L460,10 L-460,10 Z'), '#8a6a3a', dots(rowDots(-440, 440, 0, 40), 4));
      c.save(); c.translate(-420, 0); c.rotate(.25 * tip); c.strokeStyle = L.line; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(-90, 200); c.moveTo(0, 0); c.lineTo(90, 200); c.stroke(); leather(c, P('M-130,200 L130,200 L90,240 L-90,240 Z'), '#cfd2c4'); heart(c, 0, 140, 1.3, L.red); c.restore();
      c.save(); c.translate(420, 0); c.rotate(.25 * tip); c.strokeStyle = L.line; c.lineWidth = 4; c.beginPath(); c.moveTo(0, 0); c.lineTo(-90, 200); c.moveTo(0, 0); c.lineTo(90, 200); c.stroke(); leather(c, P('M-130,200 L130,200 L90,240 L-90,240 Z'), '#cfd2c4'); leather(c, P('M-110,200 C-110,150 110,150 110,200 Z'), L.yellow, dots([[-50, 180], [0, 170], [50, 180]], 6));
      const drop = inv(T('n02') + .3, T('n02') + .9, t);
      if (drop > 0) { c.save(); c.translate(0, lerp(-400, 150, easeIn(drop))); c.rotate(.5); leather(c, P('M-14,-70 C14,-74 20,30 0,74 C-16,30 -30,-40 -14,-70 Z'), L.red); c.restore(); }
      c.restore(); c.restore();
      return;
    }
    if (b === 'narr') {
      const irr = t > T('n06') + .8;
      puppet(c, 'K', 700, 500, .95, 1, { near: [-1.1, -.6], holdNear: ladle, far: [-.5, -.6], brow: 'calm' }, t);
      puppet(c, 'J', 1220, 500, .95, -1, { near: irr ? [.1, -.1] : [-1.4, -.2], far: [.3, -.4], brow: irr ? 'angry' : 'calm' }, t);
      if (!irr) for (let i = 0; i < 4; i++) heart(c, 960 + Math.sin(i * 2 + t) * 60, 300 - ((t * 40 + i * 70) % 260), .45, L.red, false);
      else cloud(c, 1220, 110, .8, t);
      return;
    }
    const fridgeOn = t > E('j09') + .1 && t < T('j11');
    if (fridgeOn) {
      const open = easeOut(clamp((t - E('j09') - .1) / .8));
      puppet(c, 'K', 520, 500, .9, 1, { near: [-1.3, -.2], far: [-.4, -.5], jaw: jaw(t, 'K'), brow: 'worried', eye: t > T('j10') ? 'wide' : 'open', lean: t > T('j10') ? -.06 : 0 }, t);
      fridge(c, 1050, 880, open);
      puppet(c, 'J', 1560, 500, .85, -1, { near: [.2, -.3], far: [.3, -.2], jaw: jaw(t, 'J'), brow: 'angry' }, t);
      return;
    }
    if (b === 'sunday') {
      sunPuppet(c, 1350, 300, 110, t);
      if (t > T('j12')) { const k = easeOut(clamp((t - T('j12')) / 1.2)); cloud(c, lerp(1900, 1360, k), 300, 1.3, t); }
      puppet(c, 'J', 720, 500, 1.0, 1, { near: t > T('j13') ? [-2.6, -.2] : [-.6, -.3], holdNear: t > T('j13') ? ladle : null, far: [.4, -.4], jaw: jaw(t, 'J'), brow: 'angry', eye: speaking(t, 'J') ? 'open' : 'shut' }, t);
      return;
    }
    // enter / argue / bread / paapad
    const enterK = b === 'enter' ? easeOut(clamp((t - beatAt(t).start) / 1.6)) : 1;
    const yell = t > T('j14');
    const gone = b === 'paapad' && t > T('k10') - .4;
    if (!gone) puppet(c, 'K', 720, 500, .95, 1, { near: b === 'paapad' ? [-1.4, -.2] : (t > T('k05') && t < T('j06') ? [-1.8, -.6] : [-.5, -.5]), holdNear: b === 'paapad' && t > T('k09') ? plate : null, far: [-.3, -.4], jaw: jaw(t, 'K'), brow: t > T('j03') && b !== 'paapad' ? 'worried' : 'calm', eye: t > T('j08') && b === 'bread' ? 'wide' : 'open' }, t);
    else { const k = clamp((t - T('k10') + .4) * .3); puppet(c, 'K', lerp(300, 160, k), 500, .55, -1, { near: [-2.2, -.3], far: [2.0, .3], jaw: jaw(t, 'K'), brow: 'worried', noRods: false }, t); }
    const raise = (t > T('j05') && t < T('k05')) || yell;
    const jx = lerp(1950, 1220, enterK) + (yell ? Math.sin(t * 50) * 8 : 0);
    puppet(c, 'J', jx, 500, yell ? 1.05 : .95, -1, {
      near: b === 'enter' ? [-2.9, .4] : raise ? [-2.6, -.3] : (t > T('j07') && b === 'bread' ? [-1.5, 0] : [.2, -.3]), holdNear: b === 'enter' ? basket : raise ? ladle : null,
      far: b === 'enter' ? [-2.7, .6] : [.3, -.3], jaw: yell ? 1 : jaw(t, 'J'), brow: t > T('j01') && !(b === 'paapad' && t < T('k10')) ? 'angry' : 'calm', eye: yell ? 'wide' : 'open',
    }, t);
    if (b === 'enter') { cloud(c, 1500, 120, .9, t); c.save(); c.strokeStyle = 'rgba(40,20,60,.35)'; c.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = (hash(i) * 2000 + t * 30) % 2000, y = (hash(i + 7) * 900 + t * 500) % 900; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 8, y + 40); c.stroke(); } c.restore(); }
  }

  function card(c, end) {
    c.save(); c.translate(960, 440);
    // a punched mandala
    leather(c, P('M-300,0 A300,300 0 1 0 300,0 A300,300 0 1 0 -300,0 Z'), L.red, c => { for (let r = 80; r < 300; r += 50) for (let i = 0; i < r / 8; i++) { const a = i / (r / 8) * Math.PI * 2; c.fillStyle = L.hole; c.globalAlpha = .85; c.beginPath(); c.arc(Math.cos(a) * r, Math.sin(a) * r, 6, 0, 7); c.fill(); } c.globalAlpha = 1; });
    c.globalCompositeOperation = 'source-over';
    c.font = '800 150px Eczar'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff3cf';
    c.fillText(end ? 'समाप्त' : 'पापड़', 0, -10);
    c.restore();
  }

  defineStyle({
    fps: 24,
    fonts: ['600 48px Eczar', '800 48px Eczar'],
    init() {
      const [cl, g] = layer(W, FLOOR);
      const r = rng(8);
      g.globalAlpha = .07; g.strokeStyle = '#3a1a08'; g.lineWidth = 1;
      for (let y = 0; y < FLOOR; y += 3) { g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke(); }
      for (let x = 0; x < W; x += 3) { g.beginPath(); g.moveTo(x + .5, 0); g.lineTo(x + .5, FLOOR); g.stroke(); }
      g.globalAlpha = 1;
      for (let i = 0; i < 30; i++) { g.strokeStyle = `rgba(60,25,5,${.04 + r() * .05})`; g.lineWidth = 2 + r() * 6; g.beginPath(); const x = r() * W; g.moveTo(x, 0); g.bezierCurveTo(x + (r() - .5) * 80, 300, x + (r() - .5) * 80, 600, x + (r() - .5) * 60, FLOOR); g.stroke(); }
      CLOTH = cl;
    },
    draw(c, t) {
      screen(c, t);
      c.save(); c.beginPath(); c.rect(0, 0, W, FLOOR); c.clip();
      if (t < TL.lead_in - .2 || t > TL.end_card) card(c, t > TL.end_card);
      else scene(c, t);
      c.restore();
      floor(c);
      // lamp glow spill on the screen edge
      const g = c.createRadialGradient(960, FLOOR + 80, 10, 960, FLOOR + 80, 500);
      g.addColorStop(0, `rgba(255,190,90,${.22 * LAMP})`); g.addColorStop(1, 'rgba(255,190,90,0)');
      c.fillStyle = g; c.fillRect(0, FLOOR - 400, W, 580);
      if (t > TL.lead_in - .2 && t <= TL.end_card) caption(c, t);
      else { c.save(); c.textAlign = 'center'; c.font = '600 44px Eczar'; c.fillStyle = '#f7e6c0'; c.fillText(t > TL.end_card ? 'Style 04 · Shadow Theatre' : 'Paapad · Kahaani No. 02', W / 2, 990); c.restore(); }
    },
  });
})();
