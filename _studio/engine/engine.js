// =====================================================================
//  STIX vs 10 ANCIENT WEAPONS — canvas animation engine (1080x1920)
// =====================================================================
const W = 1080, H = 1920, GROUND = 1250, SC = 0.56, HIPH = 318;
const cv = document.getElementById('c'); const ctx = cv.getContext('2d');
const TLD = window.TL; const CUE = TLD.cue;

// ---------------------------------------------------------------- utils
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, u) => a + (b - a) * u;
const prog = (t, a, b) => b > a ? clamp((t - a) / (b - a)) : (t >= a ? 1 : 0);
const eIO = u => { u = clamp(u); return u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2; };
const eOut = u => 1 - Math.pow(1 - clamp(u), 3);
const eOut5 = u => 1 - Math.pow(1 - clamp(u), 5);
const eIn = u => Math.pow(clamp(u), 3);
const eBack = u => { u = clamp(u); const c = 1.8; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
const spring = (t, f = 9, d = 7) => t <= 0 ? 0 : 1 - Math.exp(-d * t) * Math.cos(f * t);  // 0->1 with overshoot
const wob = (t, f = 18, d = 6) => t <= 0 ? 0 : Math.exp(-d * t) * Math.sin(f * t);       // decaying wobble
const rad = d => d * Math.PI / 180;
const noise = (t, s = 0) => Math.sin(t * 1.7 + s * 12.9) * .5 + Math.sin(t * 3.13 + s * 7.1) * .3 + Math.sin(t * 5.71 + s * 3.3) * .2;
const rnd = s => { const x = Math.sin(s * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
function hex(c) { c = c.replace('#', ''); return [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)]; }
function mixc(a, b, u) { const A = hex(a), B = hex(b); return '#' + A.map((v, i) => Math.round(lerp(v, B[i], u)).toString(16).padStart(2, '0')).join(''); }
function rgba(c, a) { const A = hex(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; }
const P2 = s => new Path2D(s);
const cue = k => CUE[k];

const C = { ink: '#16191F', head: '#FFF8F0', shade: '#F3E6D6', hair: '#111318', scarf: '#16B8B0', scarfD: '#0E8A86', scarfL: '#6FE3DC',
  amber: '#F5A623', lens: '#FFD47E', rim: '#C47E12', strap: '#2A2420', boot: '#69432F', bootD: '#4E3022', bootL: '#A47658',
  gold: '#FFD23F', wood: '#9A6233', woodD: '#6E4220', woodL: '#C89060', steel: '#DCE3EB', steelD: '#8D97A5', bronze: '#D19A3F', bronzeD: '#9A6A22', red: '#D63A3A' };
const TIER = { 10: '#A9B4C2', 9: '#7FD1A8', 8: '#9BD86A', 7: '#5CC8E8', 6: '#6E9BFF', 5: '#B08CFF', 4: '#E57CF0', 3: '#FF9A4A', 2: '#FF5E4A', 1: '#FFD23F' };
const PAL = {
  hook: ['#070B14', '#121A2E'], 10: ['#2C4268', '#A9C4DE'], 9: ['#1F4450', '#8CCAB6'], 8: ['#2A4A36', '#C2D58E'], 7: ['#373A62', '#DDB27C'],
  6: ['#3A2C55', '#E59C6C'], 5: ['#4C2E36', '#F2BD6A'], 4: ['#3C1F31', '#E58052'], 3: ['#2B1A30', '#D8673C'], 2: ['#1C1224', '#B2402C'], 1: ['#07060C', '#3A1410'],
  worse: ['#1A0507', '#4A0B10'], top3: ['#2A1A05', '#7A5212'], outro: ['#0D1222', '#25315A']
};

// ---------------------------------------------------------------- SVG paths (from the STIX master sheet)
const HAIR = P2('M 852 222 C 850 176 892 146 944 140 C 948 112 966 86 1000 70 C 990 94 990 116 1000 134 C 1020 110 1050 98 1086 98 C 1064 112 1052 132 1050 152 C 1072 146 1094 150 1112 162 C 1090 166 1074 180 1068 200 C 1040 186 1006 182 972 186 C 930 190 888 204 852 222 Z');
const HEADSHADE = P2('M 846 236 C 856 320 910 368 990 374 C 930 380 860 350 846 236 Z');
const WRAP = P2('M 906 382 Q 962 410 1016 380 Q 1030 398 1022 420 Q 962 452 902 424 Q 893 402 906 382 Z');
const KNOT = P2('M 930 414 Q 948 404 962 418 Q 966 440 950 450 Q 930 450 926 434 Z');
const BOOT = P2('M -22 -34 L -24 6 Q -26 22 -10 26 L 60 26 Q 86 24 84 4 Q 80 -14 46 -16 L 22 -20 L 22 -34 Q 0 -40 -22 -34 Z');
const BOOTSOLE = P2('M 84 14 Q 82 26 60 28 L -12 28 Q -24 26 -25 14 L -25 24 Q -24 34 -10 34 L 62 34 Q 86 32 84 14 Z');
const BOOTCUFF = P2('M 22 -36 Q 0 -44 -24 -36 L -24 -24 Q 0 -30 22 -24 Z');
const MITT = P2('M -14 0 Q -17 30 0 33 Q 16 30 14 0 Z');

// ---------------------------------------------------------------- drawing helpers
function line(c, pts, w, col, cap = 'round') { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.lineWidth = w; c.strokeStyle = col; c.lineCap = cap; c.lineJoin = 'round'; c.stroke(); }
function oline(c, pts, w, col, ow = 8) { line(c, pts, w + ow, C.ink); line(c, pts, w, col); }
function curve3(c, a, k, b, w, col) { // smooth limb through knee k
  const cx = 2 * k[0] - (a[0] + b[0]) / 2, cy = 2 * k[1] - (a[1] + b[1]) / 2;
  c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo(cx, cy, b[0], b[1]);
  c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.stroke();
}
function ell(c, x, y, rx, ry, fill, stroke, sw, rot = 0) { c.beginPath(); c.ellipse(x, y, Math.max(.1, rx), Math.max(.1, ry), rot, 0, Math.PI * 2); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = sw; c.strokeStyle = stroke; c.stroke(); } }
function poly(c, pts, fill, stroke, sw = 4) { c.beginPath(); c.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) c.lineTo(pts[i][0], pts[i][1]); c.closePath(); if (fill) { c.fillStyle = fill; c.fill(); } if (stroke) { c.lineWidth = sw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(); } }
function fillStroke(c, path, fill, stroke = C.ink, sw = 4) { if (fill) { c.fillStyle = fill; c.fill(path); } if (stroke) { c.lineWidth = sw; c.strokeStyle = stroke; c.lineJoin = 'round'; c.stroke(path); } }
const dirv = a => [Math.sin(rad(a)), Math.cos(rad(a))];   // 0 = down, 90 = forward
function ik2(a, b, L1, L2, bend) {
  let dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy); const m = L1 + L2 - .5;
  if (d > m) { dx *= m / d; dy *= m / d; d = m; }
  const ang = Math.atan2(dy, dx) - bend * Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  return [[a[0] + Math.cos(ang) * L1, a[1] + Math.sin(ang) * L1], [a[0] + dx, a[1] + dy]];
}
function text(c, s, x, y, size, fill, opt = {}) {
  c.save(); c.font = `${opt.weight || 900} ${size}px Inter`; c.textAlign = opt.align || 'center'; c.textBaseline = 'middle';
  if (opt.skew) c.transform(1, 0, -opt.skew, 1, y * opt.skew, 0);
  if (opt.shadow) { c.shadowColor = opt.shadow; c.shadowBlur = opt.blur || 18; c.shadowOffsetY = opt.sy || 6; }
  if (opt.stroke) { c.lineWidth = opt.stroke; c.strokeStyle = opt.sc || C.ink; c.lineJoin = 'round'; c.strokeText(s, x, y); c.shadowColor = 'transparent'; }
  c.fillStyle = fill; c.fillText(s, x, y); c.restore();
}

// ---------------------------------------------------------------- weapons (hand space: grip at origin, +x along weapon)
function weapon(c, type, ex = {}) {
  switch (type) {
    case 'club': {
      poly(c, [[-34, -11], [150, -22], [205, -30], [238, -14], [242, 12], [205, 30], [150, 22], [-34, 11]], C.wood, C.ink, 5);
      line(c, [[-20, -4], [190, -14]], 5, C.woodL); ell(c, 120, 6, 7, 5, C.woodD); ell(c, 182, -8, 6, 5, C.woodD); break; }
    case 'dagger': {
      oline(c, [[-38, 0], [10, 0]], 14, '#5A3A22', 7); for (let i = -30; i < 6; i += 10) line(c, [[i, -7], [i + 5, 7]], 3, '#3A2414');
      poly(c, [[12, -24], [20, -24], [20, 24], [12, 24]], C.gold, C.ink, 4);
      poly(c, [[20, -12], [120, -6], [152, 0], [120, 6], [20, 12]], C.steel, C.ink, 4); line(c, [[24, 0], [128, 0]], 3, C.steelD); break; }
    case 'sling': {
      const L = 150; line(c, [[0, 0], [L, -10]], 4, '#D9C59A'); line(c, [[0, 0], [L, 10]], 4, '#D9C59A');
      ell(c, L + 6, 0, 16, 13, '#8A5A34', C.ink, 4); if (!ex.empty) ell(c, L + 10, -4, 11, 11, '#8C8F98', C.ink, 3.5); break; }
    case 'axe': {
      oline(c, [[-40, 0], [282, 0]], 18, C.wood); line(c, [[-30, -4], [270, -4]], 4, C.woodL);
      poly(c, [[204, 0], [190, 78], [236, 96], [284, 80], [268, 0]], C.steel, C.ink, 5);
      line(c, [[194, 76], [236, 92], [280, 78]], 6, '#FFFFFF'); poly(c, [[206, -8], [262, -8], [262, 8], [206, 8]], C.steelD, C.ink, 4); break; }
    case 'mace': {
      oline(c, [[-34, 0], [196, 0]], 18, '#4E3524'); for (let i = -28; i < 40; i += 12) line(c, [[i, -9], [i + 6, 9]], 4, '#2A1C12');
      for (let i = 0; i < 8; i++) { c.save(); c.translate(240, 0); c.rotate(i * Math.PI / 4 + .2); poly(c, [[30, -14], [72, 0], [30, 14]], C.steelD, C.ink, 4); c.restore(); }
      ell(c, 240, 0, 46, 46, '#6C7482', C.ink, 5); ell(c, 228, -14, 16, 12, '#AEB6C2'); break; }
    case 'khopesh': {
      oline(c, [[-36, 0], [36, 0]], 18, '#3F2A1A', 7); line(c, [[-30, -5], [30, -5]], 3, '#C9A050');
      c.save(); c.lineCap = 'round'; c.lineJoin = 'round';
      const pth = new Path2D('M 36 0 L 120 -4 Q 168 -14 196 8 Q 220 34 204 70 Q 196 86 178 82');
      c.lineWidth = 40; c.strokeStyle = C.ink; c.stroke(pth); c.lineWidth = 30; c.strokeStyle = C.bronze; c.stroke(pth);
      c.lineWidth = 7; c.strokeStyle = '#FFE2A4'; c.stroke(new Path2D('M 50 -8 L 120 -12 Q 162 -22 192 -4'));
      c.restore();
      if (ex.glint !== undefined && ex.glint > 0 && ex.glint < 1) { const gx = lerp(40, 220, ex.glint); c.save(); c.globalCompositeOperation = 'lighter'; ell(c, gx, -6, 26, 26, 'rgba(255,240,200,.55)'); ell(c, gx, -6, 9, 9, '#FFFFFF'); c.restore(); }
      break; }
    case 'spear': {
      oline(c, [[-220, 0], [372, 0]], 13, C.wood, 7); line(c, [[-210, -3], [360, -3]], 3, C.woodL);
      poly(c, [[370, -16], [420, -18], [470, 0], [420, 18], [370, 16]], C.steel, C.ink, 4); line(c, [[374, 0], [452, 0]], 3, C.steelD);
      for (let i = 0; i < 5; i++) line(c, [[364, -4 + i * 2], [340 + Math.sin((ex.t || 0) * 9 + i) * 8, 28 + i * 6]], 4, C.red); break; }
    case 'bow': {
      const dr = ex.draw || 0; const H2 = 190;
      const bow = new Path2D(`M -10 ${-H2} Q 20 ${-H2 + 30} 40 -70 Q 52 0 40 70 Q 20 ${H2 - 30} -10 ${H2}`);
      c.lineCap = 'round'; c.lineWidth = 22; c.strokeStyle = C.ink; c.stroke(bow); c.lineWidth = 14; c.strokeStyle = '#8B5A2B'; c.stroke(bow);
      c.lineWidth = 4; c.strokeStyle = '#D9A066'; c.stroke(new Path2D(`M 30 -110 Q 46 -40 44 0`));
      const nock = -8 - dr * 150; line(c, [[-10, -H2], [nock, 0], [-10, H2]], 3, '#F2F2F2');
      oline(c, [[30, -10], [30, 10]], 10, '#C9A050', 6);
      if (ex.arrow) arrow(c, nock, 0, 0, 1);
      return nock; }
    case 'siphon': {
      oline(c, [[-70, 0], [210, 0]], 34, C.bronze, 9); line(c, [[-60, -8], [200, -8]], 6, '#F4C77A');
      for (const x of [-30, 60, 150]) poly(c, [[x, -22], [x + 14, -22], [x + 14, 22], [x, 22]], C.bronzeD, C.ink, 4);
      poly(c, [[206, -20], [246, -30], [246, 30], [206, 20]], '#B07A2A', C.ink, 5);
      if (ex.pilot) { const f = ex.pilot; c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createRadialGradient(262, 0, 2, 262, 0, 40 * f); g.addColorStop(0, 'rgba(255,240,180,1)'); g.addColorStop(.5, 'rgba(255,140,30,.7)'); g.addColorStop(1, 'rgba(255,60,0,0)'); c.fillStyle = g; c.beginPath(); c.arc(262, 0, 40 * f, 0, 7); c.fill(); c.restore(); }
      break; }
  }
}
function arrow(c, x, y, ang, s = 1, L = 230) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  oline(c, [[0, 0], [L, 0]], 6, '#E3C99A', 5);
  poly(c, [[L - 4, -11], [L + 30, 0], [L - 4, 11]], C.steel, C.ink, 3.5);
  poly(c, [[-4, 0], [30, -16], [44, -16], [16, 0]], '#E04848', C.ink, 3); poly(c, [[-4, 0], [30, 16], [44, 16], [16, 0]], '#B83030', C.ink, 3);
  c.restore();
}

// ---------------------------------------------------------------- the character rig
const IDLE = { hx: 0, hy: 0, lean: 3, tilt: 0, sq: 1, ua1: 26, la1: 60, ua2: -18, la2: 10, f1x: 34, f1y: 0, f2x: -30, f2y: 0,
  w: null, wa: 0, br: 0, bt: 0, eo: 1, lx: 0, ly: 0, mouth: 'smirk', mo: 0, grip: 1, sweat: 0, light: 0 };
function P(o) { return Object.assign({}, IDLE, o); }
function lp(A, B, u) { const o = {}; for (const k in A) o[k] = (typeof A[k] === 'number' && typeof B[k] === 'number') ? lerp(A[k], B[k], u) : (u < .5 ? A[k] : B[k]); return o; }
// keyframe timeline: [[t, pose, ease], ...]
function kf(keys, t) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, p0] = keys[i], [t1, p1, e] = keys[i + 1];
    if (t < t1) return lp(p0, p1, (e || eIO)(prog(t, t0, t1)));
  }
  return keys[keys.length - 1][1];
}
function blink(t, seed) { const per = 2.9 + seed * .7; const ph = (t + seed * 1.3) % per; return ph < .13 ? Math.abs(ph - .065) / .065 : 1; }
function breathe(p, t, seed = 0) { const q = Object.assign({}, p); q.sq *= 1 + Math.sin(t * 2.6 + seed) * .012; q.hy += Math.sin(t * 2.6 + seed) * 2; q.ua2 += Math.sin(t * 2.6 + seed + 1) * 2; return q; }
function locomote(p, dist, amp = 1, run = false) {
  const stride = run ? 150 : 110; const ph = dist / stride * Math.PI; const q = Object.assign({}, p);
  const A = (run ? 70 : 46) * amp, L = (run ? 46 : 28) * amp;
  q.f1x = 8 + A * Math.sin(ph); q.f1y = -L * Math.max(0, Math.cos(ph));
  q.f2x = 8 - A * Math.sin(ph); q.f2y = -L * Math.max(0, -Math.cos(ph));
  q.hy += -Math.abs(Math.cos(ph)) * (run ? 16 : 8) * amp + (run ? 14 : 4) * amp;
  q.lean += (run ? 16 : 5) * amp; q.ua2 = lerp(q.ua2, -A * .9 * Math.sin(ph), amp); q.la2 = lerp(q.la2, q.ua2 + 50, amp);
  if (q.w === null) { q.ua1 = lerp(q.ua1, A * .9 * Math.sin(ph), amp); q.la1 = lerp(q.la1, q.ua1 + 50, amp); }
  return q;
}

// scarf ribbon
function ribbon(c, root, t, seed, len, w0, w1, speed, col, colD) {
  const N = 11, seg = len / N; let pts = [root]; let x = root[0], y = root[1];
  for (let i = 1; i <= N; i++) {
    const k = i / N;
    let a = Math.PI - .35 + .5 * k - speed * .35 * k +
      Math.sin(t * 7.5 - i * .7 + seed) * (.12 + .28 * k) * (1 + speed * .8) + Math.sin(t * 13 - i * 1.3 + seed * 2) * .05 * k;
    x += Math.cos(a) * seg; y += Math.sin(a) * seg; pts.push([x, y]);
  }
  const L = [], R = [];
  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const nx = -dy / d, ny = dx / d, w = lerp(w0, w1, i / N) / 2;
    L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  const e = pts[N], p = pts[N - 1]; const dx = e[0] - p[0], dy = e[1] - p[1], d = Math.hypot(dx, dy) || 1;
  const notch = [e[0] - dx / d * 14, e[1] - dy / d * 14];
  const shape = [...L, notch, ...R.reverse()];
  poly(c, shape, col, C.ink, 3.5);
  line(c, pts.slice(1, N - 1).map(q => [q[0], q[1] + 2]), 4, colD);
}

// expressions (head local coords: head centre at 0,0; SVG features offset by -960,-262)
function drawFace(c, p, t, kind) {
  const eo = p.eo * blink(t, kind === 'stix' ? 0 : 1.7);
  if (kind === 'stix') {
    // brows
    const brow = (x0, y0, x1, y1, inner) => {
      const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 - p.br; c.save(); c.translate(cx, cy); c.rotate(rad(inner * p.bt));
      c.beginPath(); c.moveTo(x0 - cx, y0 - (y0 + y1) / 2); c.quadraticCurveTo(0, -14 - p.br * .1, x1 - cx, y1 - (y0 + y1) / 2);
      c.lineWidth = 9; c.strokeStyle = C.ink; c.lineCap = 'round'; c.stroke(); c.restore();
    };
    brow(-39, -26, 4, -32, 1); brow(30, -40, 74, -42, -1);
    const lx = p.lx * 6, ly = p.ly * 5;
    ell(c, -14 + lx, 8 + ly, 15.5, 26 * eo, C.ink); ell(c, 51 + lx, 5 + ly, 14, 25 * eo, C.ink);
    if (eo > .4) { ell(c, -8 + lx, -4 + ly, 6, 6 * eo, '#fff'); ell(c, 56 + lx, -7 + ly, 5.5, 5.5 * eo, '#fff'); ell(c, -17 + lx, 19 + ly, 2.6, 2.6, '#fff'); ell(c, 48 + lx, 16 + ly, 2.4, 2.4, '#fff'); }
    mouth(c, p.mouth, p.mo, 26, 62);
    if (p.sweat > 0) { c.save(); c.globalAlpha = p.sweat; const sy = -30 + (t * 60 % 30); c.beginPath(); c.moveTo(96, sy - 18); c.quadraticCurveTo(110, sy + 4, 96, sy + 10); c.quadraticCurveTo(82, sy + 4, 96, sy - 18); c.fillStyle = '#9FE4FF'; c.fill(); c.lineWidth = 3; c.strokeStyle = C.ink; c.stroke(); c.restore(); }
  } else {
    // grunt: angry brows, smaller eyes
    const tilt = 14 + p.bt;
    c.save(); c.translate(-12, -22 - p.br); c.rotate(rad(tilt)); line(c, [[-26, 0], [22, 0]], 11, C.ink); c.restore();
    c.save(); c.translate(54, -26 - p.br); c.rotate(rad(-tilt)); line(c, [[-22, 0], [24, 0]], 11, C.ink); c.restore();
    const lx = p.lx * 5;
    if (p.mouth === 'ko') { for (const [x, y] of [[-12, 10], [52, 6]]) { line(c, [[x - 10, y - 10], [x + 10, y + 10]], 6, C.ink); line(c, [[x - 10, y + 10], [x + 10, y - 10]], 6, C.ink); } }
    else { ell(c, -12 + lx, 10, 11, 17 * eo, C.ink); ell(c, 52 + lx, 7, 10, 16 * eo, C.ink); if (eo > .5) { ell(c, -8 + lx, 3, 3.5, 3.5, '#fff'); ell(c, 55 + lx, 0, 3.2, 3.2, '#fff'); } }
    mouth(c, p.mouth === 'ko' ? 'o' : p.mouth, p.mo, 24, 64);
    if (p.sweat > 0) { c.save(); c.globalAlpha = p.sweat; ell(c, 98, -10 + (t * 50 % 24), 9, 14, '#9FE4FF', C.ink, 3); c.restore(); }
  }
}
function mouth(c, type, open, x, y) {
  c.save(); c.translate(x, y); c.lineCap = 'round'; c.lineJoin = 'round';
  switch (type) {
    case 'smirk': c.beginPath(); c.moveTo(-36, -6); c.quadraticCurveTo(-4, 16, 36, -12); c.quadraticCurveTo(20, 8, 0, 10); c.quadraticCurveTo(-22, 10, -36, -6); c.fillStyle = '#3A1F22'; c.fill(); c.lineWidth = 4.5; c.strokeStyle = C.ink; c.stroke();
      line(c, [[-16, 6], [-2, 1], [12, 7]], 5, '#E7737A'); line(c, [[32, -20], [38, -12], [37, -4]], 4, C.ink); break;
    case 'grin': c.beginPath(); c.moveTo(-40, -10); c.quadraticCurveTo(0, 6, 40, -14); c.quadraticCurveTo(30, 30 + open * 10, 0, 32 + open * 10); c.quadraticCurveTo(-30, 30, -40, -10); c.fillStyle = '#3A1F22'; c.fill(); c.lineWidth = 4.5; c.strokeStyle = C.ink; c.stroke();
      c.save(); c.clip(); ell(c, 2, 34 + open * 10, 20, 12, '#E7737A'); poly(c, [[-38, -12], [40, -16], [38, 0], [-36, 2]], '#fff'); c.restore(); break;
    case 'open': ell(c, 2, 4, 22, 8 + 20 * open, '#3A1F22', C.ink, 4.5); c.save(); c.beginPath(); c.ellipse(2, 4, 22, 8 + 20 * open, 0, 0, 7); c.clip(); ell(c, 2, 16 + 16 * open, 16, 10, '#E7737A'); c.restore(); break;
    case 'o': ell(c, 4, 4, 9 + 4 * open, 12 + 8 * open, '#3A1F22', C.ink, 4.5); break;
    case 'frown': line(c, [[-22, 12], [0, 0], [24, 10]], 5, C.ink); break;
    case 'flat': line(c, [[-18, 4], [22, 2]], 5, C.ink); break;
    case 'wavy': c.beginPath(); c.moveTo(-24, 6); for (let i = 0; i <= 8; i++) c.lineTo(-24 + i * 6, 6 + (i % 2 ? -5 : 5)); c.lineWidth = 4.5; c.strokeStyle = C.ink; c.stroke(); break;
    case 'grit': poly(c, [[-26, -8], [28, -10], [30, 12], [-24, 12]], '#fff', C.ink, 4.5); line(c, [[-26, 2], [30, 1]], 3, C.ink); for (const xx of [-10, 6, 20]) line(c, [[xx, -9], [xx, 12]], 3, C.ink); break;
    case 'smug': line(c, [[-20, 2], [6, 6], [30, -6]], 5, C.ink); break;
  }
  c.restore();
}

// opt: {kind:'stix'|'grunt', x, gy, face, rot, t, helmet, shield, plate, speed, alpha, crown, burnt}
function fkChar(p, opt) {
  const hip = [p.hx, -HIPH + p.hy];
  const L = rad(p.lean); const neck = [hip[0] + Math.sin(L) * 232, hip[1] - Math.cos(L) * 232];
  const shoulder = [neck[0] - Math.sin(L) * 12, neck[1] + Math.cos(L) * 12];
  const head = [neck[0] + Math.sin(L + rad(p.tilt) * .6) * 150, neck[1] - Math.cos(L + rad(p.tilt) * .6) * 150];
  const e1 = [shoulder[0] + dirv(p.ua1)[0] * 95, shoulder[1] + dirv(p.ua1)[1] * 95];
  const h1 = [e1[0] + dirv(p.la1)[0] * 90, e1[1] + dirv(p.la1)[1] * 90];
  const e2 = [shoulder[0] + dirv(p.ua2)[0] * 95, shoulder[1] + dirv(p.ua2)[1] * 95];
  const h2 = [e2[0] + dirv(p.la2)[0] * 90, e2[1] + dirv(p.la2)[1] * 90];
  return { hip, neck, shoulder, head, e1, h1, e2, h2 };
}
// world position of a hand-space point of the held weapon
function weaponWorld(p, opt, wx, wy = 0) {
  const k = fkChar(p, opt); const a = Math.atan2(dirv(p.la1 + p.wa)[1], dirv(p.la1 + p.wa)[0]);
  let x = k.h1[0] + Math.cos(a) * wx - Math.sin(a) * wy, y = k.h1[1] + Math.sin(a) * wx + Math.cos(a) * wy;
  const s = opt.scale || SC; const r = rad(opt.rot || 0);
  let X = x * opt.face * s, Y = y * s * p.sq;
  return [opt.x + X * Math.cos(r) - Y * Math.sin(r), opt.gy + X * Math.sin(r) + Y * Math.cos(r)];
}
function drawChar(c, p, opt) {
  const s = opt.scale || SC; const kind = opt.kind || 'stix'; const t = opt.t || 0;
  const k = fkChar(p, opt);
  c.save(); c.globalAlpha = opt.alpha === undefined ? 1 : opt.alpha;
  // shadow
  if (!opt.noShadow) { c.save(); c.translate(opt.x, opt.gy); c.scale(1, .22); ell(c, 0, 0, 120 * s * (1 + (opt.rot ? Math.abs(opt.rot) / 60 : 0)), 120 * s, 'rgba(0,0,0,.28)'); c.restore(); }
  c.translate(opt.x, opt.gy); c.rotate(rad(opt.rot || 0)); c.scale(opt.face * s / Math.sqrt(p.sq), s * p.sq);
  const ink = opt.burnt ? '#0A0A0A' : C.ink;
  // scarf tails (behind)
  if (kind === 'stix') { const root = [k.neck[0] - 12, k.neck[1] + 6]; ribbon(c, [root[0] + 4, root[1] + 14], t, 2.1, 150, 26, 18, opt.speed || 0, C.scarfD, '#0A6B68'); ribbon(c, root, t, 0, 205, 30, 20, opt.speed || 0, C.scarf, C.scarfD); }
  if (kind === 'grunt' && !opt.noCape) { ribbon(c, [k.neck[0] - 10, k.neck[1] + 10], t, 1.3, 170, 46, 60, opt.speed || 0, '#B5302F', '#8A2222'); }
  // back arm
  curve3(c, k.shoulder, k.e2, k.h2, 15, ink); ell(c, k.h2[0], k.h2[1], 13, 13, kind === 'stix' ? C.boot : '#3A2A22', C.ink, 3.5);
  // legs (IK)
  const hipL = k.hip; const f2 = [p.f2x, -32 + p.f2y], f1 = [p.f1x, -32 + p.f1y];
  const [kn2, a2] = ik2(hipL, f2, 150, 150, 1), [kn1, a1] = ik2(hipL, f1, 150, 150, 1);
  curve3(c, hipL, kn2, a2, 16, ink); boot(c, a2, kind, -p.f2y * .25);
  curve3(c, hipL, kn1, a1, 16, ink); boot(c, a1, kind, -p.f1y * .25);
  // torso
  c.save(); c.translate(hipL[0], hipL[1]); c.rotate(rad(p.lean));
  poly(c, [[-11, 0], [-21, -228], [21, -228], [11, 0]], ink, ink, 6);
  if (opt.plate) { poly(c, [[-30, -200], [30, -200], [26, -110], [0, -96], [-26, -110]], C.bronze, C.ink, 4); line(c, [[0, -196], [0, -104]], 3, C.bronzeD); ell(c, -10, -170, 6, 4, '#FFE2A4'); }
  c.restore();
  // shield (held by back arm, in front of body)
  if (opt.shield) drawShield(c, opt.shield, [k.h2[0] + 40, k.h2[1] - 20]);
  // front arm + weapon
  if (p.w) {
    c.save(); c.translate(k.h1[0], k.h1[1]); const a = Math.atan2(dirv(p.la1 + p.wa)[1], dirv(p.la1 + p.wa)[0]); c.rotate(a);
    const nock = weapon(c, p.w, opt.wex || {}); c.restore();
  }
  curve3(c, k.shoulder, k.e1, k.h1, 15, ink);
  if (kind === 'stix') { c.save(); c.translate(k.h1[0], k.h1[1]); const a = Math.atan2(dirv(p.la1)[1], dirv(p.la1)[0]); c.rotate(a - Math.PI / 2); c.translate(0, -6); fillStroke(c, MITT, C.boot, C.ink, 3.5); ell(c, -13, 12, 6, 9, C.boot, C.ink, 3); poly(c, [[-13, -12], [13, -12], [13, 0], [-13, 0]], C.bootD, C.ink, 3); c.restore(); }
  else ell(c, k.h1[0], k.h1[1], 13, 13, '#3A2A22', C.ink, 3.5);
  // scarf wrap / neck
  if (kind === 'stix') { c.save(); c.translate(k.neck[0], k.neck[1]); c.rotate(rad(p.lean * .7)); c.translate(-961, -410); fillStroke(c, WRAP, C.scarf, C.ink, 4); c.lineWidth = 6; c.strokeStyle = C.scarfD; c.stroke(P2('M 912 412 Q 962 436 1012 408')); fillStroke(c, KNOT, C.scarf, C.ink, 4); c.lineWidth = 5; c.strokeStyle = C.scarfL; c.stroke(P2('M 984 398 Q 998 394 1008 388')); c.restore(); }
  // head
  c.save(); c.translate(k.head[0], k.head[1]); c.rotate(rad(p.lean + p.tilt));
  const hc = kind === 'stix' ? C.head : (opt.burnt ? '#5A4A44' : '#F1DCD2');
  ell(c, 0, 0, 112, 108, hc);
  c.save(); c.beginPath(); c.ellipse(0, 0, 112, 108, 0, 0, 7); c.clip(); c.translate(-960, -262); c.fillStyle = kind === 'stix' ? C.shade : (opt.burnt ? '#3A302C' : '#E0C4B8'); c.fill(HEADSHADE); c.restore();
  if (kind === 'stix') { ell(c, 56, 38, 20, 11, 'rgba(246,198,180,.6)'); ell(c, -55, 40, 14, 9, 'rgba(246,198,180,.45)'); }
  ell(c, 0, 0, 112, 108, null, C.ink, 6.5);
  if (kind === 'stix') {
    line(c, [[80, -48], [96, -26], [100, 0]], 7, '#FFFDF8');
    c.save(); c.translate(-960, -262); c.fillStyle = C.hair; c.fill(HAIR); c.lineWidth = 5; c.strokeStyle = '#2C313B'; c.stroke(P2('M 870 196 C 868 182 878 166 892 160')); c.restore();
    // goggles
    c.save(); c.translate(-960, -262); c.lineWidth = 11; c.strokeStyle = C.strap; c.lineCap = 'round'; c.stroke(P2('M 851 214 Q 960 172 1071 204'));
    ell(c, 1012, 172, 27, 31, C.amber, C.ink, 4.5); ell(c, 1012, 172, 17, 21, C.lens, C.rim, 3); ell(c, 928, 180, 34, 34, C.amber, C.ink, 4.5); ell(c, 928, 180, 23, 23, C.lens, C.rim, 3);
    line(c, [[914, 168], [920, 160], [931, 159]], 5, '#FFF6E2'); line(c, [[1004, 160], [1008, 154], [1016, 154]], 4, '#FFF6E2'); c.restore();
    if (opt.crown) { const u = opt.crown; c.save(); c.translate(10, -150 - 30 * (1 - u)); c.scale(u, u); poly(c, [[-60, 20], [-66, -40], [-30, -8], [0, -56], [30, -8], [66, -40], [60, 20]], C.gold, C.ink, 5); ell(c, 0, -10, 9, 9, '#E0405A', C.ink, 3); c.restore(); }
  } else {
    // bronze helmet + crest
    if (opt.helmet !== false) {
      c.save(); c.beginPath(); c.moveTo(-122, 10); c.bezierCurveTo(-130, -140, 130, -140, 122, 10); c.lineTo(100, 4); c.lineTo(98, -14); c.lineTo(-96, -14); c.lineTo(-104, 30); c.closePath(); c.fillStyle = C.bronze; c.fill(); c.lineWidth = 5; c.strokeStyle = C.ink; c.stroke();
      line(c, [[-100, -14], [104, -14]], 9, C.bronzeD); line(c, [[-60, -86], [-20, -104]], 7, '#FFE2A4');
      c.beginPath(); c.moveTo(-70, -96); c.bezierCurveTo(-60, -170, 70, -170, 80, -96); c.bezierCurveTo(40, -128, -30, -128, -70, -96); c.fillStyle = '#D63A3A'; c.fill(); c.lineWidth = 4; c.strokeStyle = C.ink; c.stroke(); c.restore();
    }
  }
  drawFace(c, p, t, kind);
  if (opt.light) { c.save(); c.globalCompositeOperation = 'source-atop'; c.restore(); }
  c.restore();
  c.restore();
}
function boot(c, a, kind, tilt) {
  c.save(); c.translate(a[0], a[1]); c.rotate(rad(tilt)); c.translate(4, 12);
  if (kind === 'stix') { fillStroke(c, BOOT, C.boot); fillStroke(c, BOOTSOLE, C.bootD); fillStroke(c, BOOTCUFF, C.bootD); c.lineWidth = 5; c.strokeStyle = C.bootL; c.lineCap = 'round'; c.stroke(P2('M 52 -12 Q 66 -10 74 -2')); }
  else { fillStroke(c, BOOT, '#4A3328'); fillStroke(c, BOOTSOLE, '#2E1F18'); }
  c.restore();
}
function drawShield(c, sh, at) {
  c.save(); c.translate(at[0], at[1]);
  if (sh === 'round') { ell(c, 0, 0, 96, 104, '#A8642E', C.ink, 6); ell(c, 0, 0, 82, 90, null, C.bronze, 8); ell(c, 0, 0, 22, 22, C.bronze, C.ink, 4); line(c, [[-60, -40], [-30, -70]], 6, '#D99A5E'); }
  if (sh === 'tower') { poly(c, [[-60, -150], [60, -150], [66, 150], [-66, 150]], '#B23A30', C.ink, 6); poly(c, [[-14, -150], [14, -150], [14, 150], [-14, 150]], C.bronze, C.ink, 3); ell(c, 0, 0, 26, 26, C.bronze, C.ink, 4); }
  c.restore();
}

// ---------------------------------------------------------------- FX
function burst(c, x, y, age, size, col = '#FFE36A') {
  if (age < 0 || age > .45) return; const u = age / .45;
  c.save(); c.globalCompositeOperation = 'lighter';
  const r = size * eOut5(u * 1.4); c.globalAlpha = 1 - u;
  c.beginPath(); c.arc(x, y, r, 0, 7); c.lineWidth = 18 * (1 - u) + 2; c.strokeStyle = col; c.stroke();
  c.beginPath(); for (let i = 0; i < 16; i++) { const rr = i % 2 ? r * .25 : r * .9; const a = i * Math.PI / 8 + .2; c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } c.closePath(); c.fillStyle = rgba('#FFF6C8', .9 * (1 - u)); c.fill();
  const g = c.createRadialGradient(x, y, 0, x, y, size * .8); g.addColorStop(0, `rgba(255,255,255,${1 - u})`); g.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = g; c.beginPath(); c.arc(x, y, size * .8, 0, 7); c.fill();
  c.restore();
}
function sparks(c, x, y, age, n, seed, spd = 900, col = '#FFD27A', grav = 1600) {
  if (age < 0 || age > .7) return; c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = rnd(seed + i) * Math.PI * 2, v = (.35 + rnd(seed + i * 3.1) * .65) * spd, life = .35 + rnd(seed + i * 5.3) * .35; if (age > life) continue;
    const px = x + Math.cos(a) * v * age, py = y + Math.sin(a) * v * age + grav * age * age * .5;
    const vx = Math.cos(a) * v, vy = Math.sin(a) * v + grav * age;
    c.globalAlpha = 1 - age / life; c.lineWidth = 5 * (1 - age / life) + 1; c.strokeStyle = col;
    c.beginPath(); c.moveTo(px, py); c.lineTo(px - vx * .03, py - vy * .03); c.stroke();
  }
  c.restore();
}
function debris(c, x, y, age, n, seed, cols, spd = 700) {
  if (age < 0 || age > 1.6) return;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI * (.15 + rnd(seed + i) * .7), v = (.4 + rnd(seed + i * 2.7) * .6) * spd;
    let px = x + Math.cos(a) * v * age * (i % 2 ? 1 : -1), py = y + Math.sin(a) * v * age + 1900 * age * age * .5;
    if (py > GROUND - 6) py = GROUND - 6;
    c.save(); c.translate(px, py); c.rotate(age * (8 + i) * (i % 2 ? 1 : -1)); c.globalAlpha = clamp(2 - age * 1.4);
    poly(c, [[-9, -4], [10, -6], [7, 5], [-8, 6]], cols[i % cols.length], C.ink, 2.5); c.restore();
  }
}
function dust(c, x, y, age, n, seed, size = 40) {
  if (age < 0 || age > 1) return;
  for (let i = 0; i < n; i++) {
    const dir = (i % 2 ? 1 : -1), v = (.5 + rnd(seed + i) * .5) * 260;
    const px = x + dir * v * eOut(age) * .9, py = y - 10 - rnd(seed + i * 2) * 30 * age - 20 * age;
    const r = size * (.5 + rnd(seed + i * 3)) * (0.4 + eOut(age));
    c.fillStyle = `rgba(230,220,205,${.35 * (1 - age)})`; c.beginPath(); c.arc(px, py, r, 0, 7); c.fill();
  }
}
function speedLines(c, cx, cy, age, dur, col = 'rgba(255,255,255,.75)', n = 40, seed = 1) {
  if (age < 0 || age > dur) return; const u = age / dur; c.save(); c.globalAlpha = Math.sin(u * Math.PI); c.fillStyle = col;
  for (let i = 0; i < n; i++) { const a = rnd(seed + i) * Math.PI * 2, r0 = 360 + rnd(seed + i * 2) * 260, r1 = 1300; const w = .012 + rnd(i + 9) * .012;
    c.beginPath(); c.moveTo(cx + Math.cos(a - w) * r1, cy + Math.sin(a - w) * r1); c.lineTo(cx + Math.cos(a) * r0, cy + Math.sin(a) * r0); c.lineTo(cx + Math.cos(a + w) * r1, cy + Math.sin(a + w) * r1); c.fill(); }
  c.restore();
}
function comic(c, word, x, y, age, col, size = 120, rot = -8) {
  if (age < 0 || age > 1.05) return; const sc = eBack(age / .2); const a = clamp((1.05 - age) / .3);
  c.save(); c.translate(x, y - age * 30); c.rotate(rad(rot + wob(age, 20, 8) * 6)); c.scale(sc, sc); c.globalAlpha = a;
  c.font = `900 ${size}px Inter`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.transform(1, 0, -.16, 1, 0, 0);
  c.lineJoin = 'round'; c.lineWidth = 26; c.strokeStyle = C.ink; c.strokeText(word, 0, 6);
  const g = c.createLinearGradient(0, -size / 2, 0, size / 2); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.45, col); g.addColorStop(1, mixc(col, '#000000', .25));
  c.fillStyle = g; c.fillText(word, 0, 0); c.lineWidth = 3; c.strokeStyle = 'rgba(255,255,255,.6)'; c.strokeText(word, 0, -2);
  c.restore();
}
function trail(c, fnPts, t, len = .09, steps = 10, col = '255,255,255') { // fnPts(t) -> [inner, outer] world points
  const A = [], B = []; for (let i = 0; i <= steps; i++) { const pp = fnPts(t - len * i / steps); A.push(pp[0]); B.push(pp[1]); }
  c.save(); for (let i = 0; i < steps; i++) { c.globalAlpha = .55 * (1 - i / steps); c.beginPath(); c.moveTo(A[i][0], A[i][1]); c.lineTo(B[i][0], B[i][1]); c.lineTo(B[i + 1][0], B[i + 1][1]); c.lineTo(A[i + 1][0], A[i + 1][1]); c.closePath(); c.fillStyle = `rgb(${col})`; c.fill(); }
  c.restore();
}
function flameP(c, x, y, r, life, a = 1) {
  const col = life < .3 ? [255, 245, 200] : life < .6 ? [255, 160, 40] : [210, 60, 20];
  const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(${col},${a * (1 - life)})`); g.addColorStop(1, `rgba(${col},0)`);
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
}

// ---------------------------------------------------------------- background & camera
function setCam(c, cam, par = 1) { // world -> screen with parallax
  const z = 1 + (cam.z - 1) * par;
  c.translate(W / 2, 1000); c.scale(z, z); c.rotate(rad(cam.r || 0) * par); c.translate(-cam.x * par - 540 * (1 - par), -cam.y * par - 1000 * (1 - par));
}
function background(c, pal, cam, t, extra = {}) {
  const [top, bot] = pal;
  const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, mixc(top, '#000000', .25)); g.addColorStop(.55, bot); g.addColorStop(1, mixc(bot, '#000000', .5));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // sun / glow
  c.save(); setCam(c, cam, .1); const sx = extra.sunX || 700, sy = extra.sunY || 820;
  const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 520); sg.addColorStop(0, rgba(mixc(bot, '#FFFFFF', .55), .75)); sg.addColorStop(.25, rgba(mixc(bot, '#FFFFFF', .3), .35)); sg.addColorStop(1, rgba(bot, 0));
  c.fillStyle = sg; c.fillRect(-600, 0, 2400, 2000); if (!extra.noSun) ell(c, sx, sy, 70, 70, rgba(mixc(bot, '#FFFFFF', .7), .9)); c.restore();
  // far mountains / pyramids
  c.save(); setCam(c, cam, .22); const far = mixc(bot, top, .55);
  if (extra.pyramids) { for (const [x, h] of [[180, 300], [470, 420], [800, 260]]) poly(c, [[x - h * .9, GROUND - 40], [x, GROUND - 40 - h], [x + h * .9, GROUND - 40]], mixc(far, '#E0A050', .25)); }
  else { c.beginPath(); c.moveTo(-800, GROUND); for (let x = -800; x <= 2000; x += 40) c.lineTo(x, GROUND - 140 - 90 * Math.sin(x * .004 + 1) - 50 * Math.sin(x * .011 + 2)); c.lineTo(2000, GROUND); c.fillStyle = far; c.fill(); }
  if (extra.sea) { c.fillStyle = mixc(top, '#203050', .35); c.fillRect(-800, GROUND - 90, 3600, 300); }
  c.restore();
  // ruins
  c.save(); setCam(c, cam, .5); const mid = mixc(top, '#000000', .35);
  if (!extra.sea) for (let i = -3; i < 10; i++) {
    const x = i * 250 + 60, hgt = 260 + 160 * rnd(i + 3), broken = rnd(i + 7) > .55;
    c.fillStyle = mid; c.fillRect(x, GROUND - hgt, 44, hgt); c.fillRect(x - 12, GROUND - hgt - 18, 68, 20);
    if (!broken && i % 2 === 0) c.fillRect(x - 12, GROUND - hgt - 34, 318, 22);
    c.fillStyle = rgba(mixc(bot, '#FFFFFF', .2), .12); c.fillRect(x + 30, GROUND - hgt, 8, hgt);
  }
  c.restore();
  // ground
  c.save(); setCam(c, cam, 1);
  if (extra.sea) {
    c.fillStyle = mixc(top, '#0A1830', .4); c.fillRect(-1000, GROUND - 6, 4000, 900);
    poly(c, [[-1000, GROUND - 6], [470, GROUND - 6], [470, GROUND + 900], [-1000, GROUND + 900]], '#3A2618'); // pier
    for (let i = -6; i < 3; i++) line(c, [[i * 80, GROUND - 4], [i * 80, GROUND + 60]], 3, '#2A1A10');
    line(c, [[-1000, GROUND - 6], [470, GROUND - 6]], 6, '#6A4A30');
    for (let k = 0; k < 7; k++) { c.beginPath(); for (let x = 470; x < 2400; x += 20) c.lineTo(x, GROUND + 10 + k * 34 + Math.sin(x * .02 + t * 2 + k) * 6); c.lineWidth = 3; c.strokeStyle = `rgba(140,190,255,${.18 - k * .02})`; c.stroke(); }
  } else {
    const gg = c.createLinearGradient(0, GROUND, 0, GROUND + 700); gg.addColorStop(0, mixc(top, bot, .25)); gg.addColorStop(1, mixc(top, '#000000', .6));
    c.fillStyle = gg; c.fillRect(-1000, GROUND - 4, 4000, 900);
    line(c, [[-1000, GROUND - 2], [3000, GROUND - 2]], 5, rgba(mixc(bot, '#FFFFFF', .4), .55));
    c.strokeStyle = 'rgba(0,0,0,.18)'; c.lineWidth = 3; for (let i = -10; i < 30; i++) { c.beginPath(); c.moveTo(i * 120, GROUND + 4); c.lineTo(i * 120 - 60, GROUND + 140); c.stroke(); }
    c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(-1000, GROUND + 70, 4000, 6);
  }
  c.restore();
  // floating motes
  c.save(); setCam(c, cam, .8); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const x = (rnd(i) * 1600 - 200 + t * (10 + rnd(i * 3) * 20)) % 1500 - 200, y = 500 + rnd(i * 7) * 800 + Math.sin(t + i) * 20; ell(c, x, y, 2 + rnd(i * 5) * 3, 2 + rnd(i * 5) * 3, rgba(extra.mote || '#FFE9B0', .35)); }
  c.restore();
}
function vignette(c, strength = .55) {
  const g = c.createRadialGradient(W / 2, H * .5, H * .25, W / 2, H * .5, H * .78); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${strength})`);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  const t = c.createLinearGradient(0, 0, 0, 620); t.addColorStop(0, 'rgba(0,0,0,.55)'); t.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = t; c.fillRect(0, 0, W, 620);
  const b = c.createLinearGradient(0, 1300, 0, H); b.addColorStop(0, 'rgba(0,0,0,0)'); b.addColorStop(1, 'rgba(0,0,0,.6)'); c.fillStyle = b; c.fillRect(0, 1300, W, 620);
}
function impactCam(lt, imps) { // returns {z, r, sx, sy}
  let z = 0, r = 0, sx = 0, sy = 0;
  for (const [ti, pw] of imps) { const d = lt - ti; if (d < 0) continue; const e = Math.exp(-d * 7);
    z += pw * .1 * e * (1 + Math.cos(d * 22) * .3); r += pw * 1.2 * wob(d, 26, 7); sx += pw * 22 * e * noise(d * 45, ti); sy += pw * 22 * e * noise(d * 45, ti + 3); }
  return { z, r, sx, sy };
}
function hitstop(lt, imps, hold = .07) { let off = 0; for (const [ti, pw] of imps) { const h = hold * pw; if (lt > ti + h) off += h; else if (lt > ti) off += lt - ti; } return lt - off; }

// ---------------------------------------------------------------- HUD (rank card)
function rankCard(c, seg, lt) {
  const r = seg.rank, col = TIER[r];
  const u = eBack(prog(lt, 0, .32)); const sc = lerp(2.4, 1, u), rot = lerp(-14, 0, u);
  c.save(); c.translate(W / 2, 352); c.rotate(rad(rot)); c.scale(sc, sc); c.globalAlpha = clamp(lt / .08);
  c.font = '900 190px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.shadowColor = rgba(col, .8); c.shadowBlur = 40; c.lineJoin = 'round'; c.lineWidth = 22; c.strokeStyle = C.ink; c.strokeText('#' + r, 0, 0); c.shadowColor = 'transparent';
  const g = c.createLinearGradient(0, -90, 0, 90); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, col); g.addColorStop(1, mixc(col, '#000000', .3)); c.fillStyle = g; c.fillText('#' + r, 0, 0);
  // glint
  const gp = prog(lt, .35, .85); if (gp > 0 && gp < 1) { c.save(); c.globalCompositeOperation = 'source-atop'; c.restore(); c.save(); c.globalAlpha = .9 * Math.sin(gp * Math.PI); c.globalCompositeOperation = 'lighter'; c.fillStyle = 'rgba(255,255,255,.5)'; c.beginPath(); const gx = lerp(-200, 200, gp); c.moveTo(gx - 30, -100); c.lineTo(gx + 10, -100); c.lineTo(gx - 30, 100); c.lineTo(gx - 70, 100); c.fill(); c.restore(); }
  c.restore();
  // name: letters cascade
  const name = seg.name; c.save(); c.font = '900 84px Inter'; c.textBaseline = 'middle';
  const total = c.measureText(name).width + (name.length - 1) * 4; let x = W / 2 - total / 2;
  for (let i = 0; i < name.length; i++) { const ch = name[i]; const w = c.measureText(ch).width; const lu = eBack(prog(lt, .12 + i * .028, .32 + i * .028));
    c.save(); c.translate(x + w / 2, 478 - (1 - lu) * 60); c.globalAlpha = clamp(lu * 2); c.textAlign = 'center'; c.lineJoin = 'round'; c.lineWidth = 14; c.strokeStyle = C.ink; c.strokeText(ch, 0, 0); c.fillStyle = '#FFFFFF'; c.fillText(ch, 0, 0); c.restore(); x += w + 4; }
  c.restore();
  // power pips
  const n = 11 - r; for (let i = 0; i < 10; i++) { const on = i < n && lt > .35 + i * .06; const x = W / 2 - 270 + i * 60, y = 556;
    c.save(); if (on) { c.shadowColor = mixc('#5BE08A', '#FF4A3A', i / 9); c.shadowBlur = 18; }
    c.fillStyle = on ? mixc('#5BE08A', '#FF4A3A', i / 9) : 'rgba(255,255,255,.14)'; c.beginPath(); c.roundRect(x - 24, y - 12, 48, 24, 8); c.fill(); c.lineWidth = 3; c.strokeStyle = 'rgba(0,0,0,.5)'; c.stroke(); c.restore(); }
  text(c, 'POWER', W / 2 - 330, 556, 26, 'rgba(255,255,255,.75)', { weight: 800, align: 'right' });
}
