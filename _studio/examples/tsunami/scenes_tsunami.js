// =====================================================================
//  STIX vs LEVEL 1 to 10 TSUNAMI (true-scale, fixed camera)
// =====================================================================
const LN = {}; TLD.lines.forEach(l => LN[l.id] = l);
const T = id => LN[id].start, TE = id => LN[id].end;
const END = TLD.dur;
const LV = [ // line id, run-up height (m), tag
  ['l1', .5, ''], ['l2', 1, ''], ['l3', 2, ''], ['l4', 3, ''], ['l5', 5, ''], ['l6', 10, 'TYPICAL SEAWALL ≈ 10 m'],
  ['l7', 15, ''], ['l8', 30, 'ACEH, INDONESIA · 2004'], ['l9', 40, 'TOHOKU, JAPAN · 2011'], ['l10', 524, 'LITUYA BAY, ALASKA · 1958']];
const LCOL = ['#8FE3F0', '#74D6EC', '#5CC4EC', '#5AAEF5', '#6E92FF', '#9A7CFF', '#C46CF0', '#F0609A', '#FF5E4A', '#FFD23F'];
const BAL = 12, ROOF = 45, BX0 = 23, BX1 = 33;
const PAUSE0 = T('l7') + .85, PAUSE1 = T('l7b') + 2.95;           // water frozen while Stix climbs
const CLIMB0 = T('l7b') - .25, CLIMB1 = PAUSE1 - .15;
const ZOOM0 = T('l10') + .1, ZOOM1 = T('l10b') + 1.2;
const SLIDE0 = ZOOM1 - .2, SLIDE1 = SLIDE0 + .75, SURGE0 = SLIDE1 + .1, SURGE1 = SURGE0 + 1.7;
const BACK0 = T('out') + .55, BACK1 = END - .12;

// ---------------------------------------------------------------- water level timeline
function levelIndex(t) { let k = -1; LV.forEach((l, i) => { if (t >= T(l[0])) k = i; }); return k; }
function waterH(t) {
  let h = 0;
  for (let i = 0; i < 9; i++) {
    const s = T(LV[i][0]), prev = i ? LV[i - 1][1] : 0, tgt = LV[i][1];
    if (i === 6) { // level 7: rise to just below the balcony, freeze, then finish
      if (t >= s + .15) h = lerp(prev, 11.3, spring(t - s - .15, 9, 6));
      if (t >= PAUSE1) h = lerp(11.3, tgt, spring(t - PAUSE1, 8, 5));
      continue;
    }
    if (t >= s + .15) h = lerp(prev, tgt, i === 0 ? eOut(prog(t, s + .15, s + 1.0)) : spring(t - s - .15, 9, 6));
  }
  const b = eIO(prog(t, BACK0 + .2, BACK1 - .1)); return h * (1 - b);
}
function wTime(t) { if (t < PAUSE0) return t; if (t < PAUSE1) return PAUSE0; return t - (PAUSE1 - PAUSE0); }
const FRONT = t => lerp(-12, 60, eOut(prog(t, T('l1') + .1, T('l1') + 1.1)));

// ---------------------------------------------------------------- camera (meters -> screen)
let CAM = { s: 18, ax: 650, gY: 1330 };
function camAt(t) {
  const e = eIO(prog(t, ZOOM0, ZOOM1)) * (1 - eIO(prog(t, BACK0, BACK1)));
  const s = Math.exp(lerp(Math.log(18), Math.log(1.42), e));
  let shake = 0; for (let i = 0; i < 9; i++) { const d = t - T(LV[i][0]) - .15; if (d > 0 && d < .5) shake = Math.max(shake, (1 - d / .5) * (2 + i * .8)); }
  return { s, ax: lerp(650, 400, e) + noise(t * 40) * shake, gY: lerp(1330, 1300, e) + noise(t * 40, 3) * shake, e };
}
const X = x => CAM.ax + (x - 28) * CAM.s, Y = h => CAM.gY - h * CAM.s;
const P2S = (x, h) => [X(x), Y(h)];

// ---------------------------------------------------------------- terrain & props (world meters)
const SLOPE = [[60, 0], [140, 140], [230, 300], [330, 470], [420, 610], [520, 660], [900, 700]];
const CLIFF = [[-118, 0], [-128, 120], [-150, 260], [-176, 380], [-210, 470], [-300, 520], [-700, 560]];
function slopeH(x) { for (let i = 0; i < SLOPE.length - 1; i++) { const [x0, h0] = SLOPE[i], [x1, h1] = SLOPE[i + 1]; if (x >= x0 && x <= x1) return lerp(h0, h1, (x - x0) / (x1 - x0)); } return x < 60 ? 0 : 700; }
function slopeXat(h) { for (let i = 0; i < SLOPE.length - 1; i++) { const [x0, h0] = SLOPE[i], [x1, h1] = SLOPE[i + 1]; if (h >= h0 && h <= h1) return lerp(x0, x1, (h - h0) / (h1 - h0)); } return 900; }

function sky(c, t, lv) {
  const dark = clamp(lv / 9) * .55;
  const g = c.createLinearGradient(0, 0, 0, 1400); g.addColorStop(0, mixc('#6FB4E8', '#22324A', dark)); g.addColorStop(1, mixc('#D8EEF7', '#6E7F94', dark));
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.globalAlpha = .55 - dark * .3; for (let i = 0; i < 6; i++) { const x = ((i * 260 + t * 9) % 1500) - 200, y = 480 + (i % 3) * 90; ell(c, x, y, 110, 34, '#FFFFFF'); ell(c, x + 70, y - 18, 70, 30, '#FFFFFF'); } c.restore();
}
function terrain(c, t, ruH) {
  // underground / street cross-section
  c.fillStyle = '#2A2622'; c.fillRect(0, Y(0), W, H);
  // bay floor + sea (left of town)
  poly(c, [P2S(-10, 0), P2S(-118, 0), P2S(-118, -80), P2S(-10, -80)], '#1D3A52');
  // left cliff with landslide scar
  const cl = CLIFF.map(([x, h]) => P2S(x, h)); poly(c, [...cl, P2S(-700, -100), P2S(-118, -100)], '#4A4E58', C.ink, 3);
  // right mountain slope
  const sl = SLOPE.map(([x, h]) => P2S(x, h)); poly(c, [...sl, P2S(900, -100), P2S(60, -100)], '#55584F', C.ink, 3);
  // forest band on the slope (stripped below run-up after the surge)
  for (let x = 62; x < 520; x += 6) { const h = slopeH(x); const stripped = ruH > 0 && h < ruH; const [sx, sy] = P2S(x, h);
    if (CAM.s < 6) { c.fillStyle = stripped ? '#7A6048' : '#2F6B3A'; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 3, sy - 12 * (stripped ? .3 : 1)); c.lineTo(sx + 6, sy); c.fill(); } }
  // town ground
  c.fillStyle = '#7C8A6A'; c.fillRect(X(-10), Y(0) - 3, X(60) - X(-10), 6);
  c.fillStyle = '#3A3530'; c.fillRect(X(-10), Y(0) + 3, X(60) - X(-10), Math.max(4, 1.2 * CAM.s));
}
function house(c, x0, x1, hgt, col) {
  poly(c, [P2S(x0, 0), P2S(x0, hgt * .7), P2S((x0 + x1) / 2, hgt), P2S(x1, hgt * .7), P2S(x1, 0)], col, C.ink, 3);
  if (CAM.s > 6) { for (const wx of [x0 + 1.2, x1 - 2.6]) poly(c, [P2S(wx, 1.6), P2S(wx + 1.4, 1.6), P2S(wx + 1.4, 3), P2S(wx, 3)], '#9FD0F0', C.ink, 2); poly(c, [P2S((x0 + x1) / 2 - .6, 0), P2S((x0 + x1) / 2 + .6, 0), P2S((x0 + x1) / 2 + .6, 2.1), P2S((x0 + x1) / 2 - .6, 2.1)], '#7A4A28', C.ink, 2); }
}
function palm(c, x, hgt, t) {
  const [bx, by] = P2S(x, 0), [tx, ty] = P2S(x + .8, hgt); line(c, [[bx, by], [(bx + tx) / 2 + 6, (by + ty) / 2], [tx, ty]], Math.max(2, .45 * CAM.s), '#8A5A30');
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * .55 + Math.sin(t * 1.5 + i) * .06; line(c, [[tx, ty], [tx + Math.cos(a) * 3.2 * CAM.s, ty + Math.sin(a) * 1.4 * CAM.s + 1.2 * CAM.s]], Math.max(2, .35 * CAM.s), '#2F8A4A'); }
}
function car(c, x, h, rot, col) {
  const [sx, sy] = P2S(x, h); const L = 4.4 * CAM.s, Hh = 1.45 * CAM.s; c.save(); c.translate(sx, sy); c.rotate(rot);
  poly(c, [[-L / 2, 0], [-L / 2, -Hh * .55], [-L * .28, -Hh * .58], [-L * .16, -Hh], [L * .2, -Hh], [L * .34, -Hh * .58], [L / 2, -Hh * .5], [L / 2, 0]], col, C.ink, 2.5);
  poly(c, [[-L * .12, -Hh * .92], [L * .17, -Hh * .92], [L * .28, -Hh * .6], [-L * .22, -Hh * .6]], '#BFE6F7', C.ink, 1.5);
  ell(c, -L * .3, 0, Hh * .22, Hh * .22, '#222', C.ink, 2); ell(c, L * .3, 0, Hh * .22, Hh * .22, '#222', C.ink, 2); c.restore();
}
function building(c, t, xray) {
  const [x0, y0] = P2S(BX0, 0), [x1, y1] = P2S(BX1, ROOF);
  poly(c, [[x0, y0], [x0, y1], [x1, y1], [x1, y0]], '#C9D2DC', C.ink, 3);
  c.fillStyle = 'rgba(0,0,0,.12)'; c.fillRect(x1 - (x1 - x0) * .18, y1, (x1 - x0) * .18, y0 - y1);
  for (let f = 0; f < 15; f++) { const hb = f * 3; line(c, [P2S(BX0, hb), P2S(BX1, hb)], 1.5, 'rgba(60,70,90,.35)');
    for (let k = 0; k < 3; k++) { const wx = BX0 + 1.1 + k * 3.1; const lit = rnd(f * 7 + k) > .55; poly(c, [P2S(wx, hb + .8), P2S(wx + 1.9, hb + .8), P2S(wx + 1.9, hb + 2.3), P2S(wx, hb + 2.3)], lit ? '#FFE9A8' : '#7FB0D6', 'rgba(22,25,31,.6)', 1.2); } }
  poly(c, [P2S(27, 0), P2S(29, 0), P2S(29, 2.4), P2S(27, 2.4)], '#6A4A30', C.ink, 2);
  // balcony at 12 m
  poly(c, [P2S(20.6, BAL - .25), P2S(BX0, BAL - .25), P2S(BX0, BAL), P2S(20.6, BAL)], '#9AA6B4', C.ink, 2);
  line(c, [P2S(20.6, BAL), P2S(20.6, BAL + 1.05), P2S(BX0, BAL + 1.05)], 2, C.ink); for (let i = 0; i < 4; i++) line(c, [P2S(20.9 + i * .6, BAL), P2S(20.9 + i * .6, BAL + 1.05)], 1.2, C.ink);
  // roof access room + parapet
  poly(c, [P2S(24, ROOF), P2S(27.4, ROOF), P2S(27.4, ROOF + 2.6), P2S(24, ROOF + 2.6)], '#B7C1CC', C.ink, 2.5);
  line(c, [P2S(BX0, ROOF + .6), P2S(BX1, ROOF + .6)], 3, '#8C97A5');
  line(c, [P2S(31.5, ROOF), P2S(31.5, ROOF + 4)], 2, C.ink); ell(c, X(31.5), Y(ROOF + 4), 3, 3, '#FF4A3A');
  if (xray > 0) { // stairwell cut-away
    c.save(); c.globalAlpha = xray; const [a0, b0] = P2S(23.5, BAL - .2), [a1, b1] = P2S(26.9, ROOF);
    c.fillStyle = 'rgba(20,30,48,.82)'; c.fillRect(a0, b1, a1 - a0, b0 - b1); c.strokeStyle = C.scarfL; c.lineWidth = 2; c.strokeRect(a0, b1, a1 - a0, b0 - b1);
    for (let f = 4; f < 15; f++) { const h = f * 3; line(c, [P2S(23.7, h), P2S(26.7, h + 1.5), P2S(23.7, h + 3)], 1.6, 'rgba(160,220,230,.7)'); }
    c.restore();
  }
}
// tiny true-scale STIX
function miniStix(c, x, h, t, state) {
  const [sx, sy] = P2S(x, h); const hp = Math.max(1.75 * CAM.s, 6); const k = hp / 32;
  c.save(); c.translate(sx, sy); c.scale(k, k); c.lineCap = 'round';
  const run = state === 'run', ph = t * 18;
  const l1 = run ? Math.sin(ph) * 9 : 3, l2 = run ? -Math.sin(ph) * 9 : -4;
  line(c, [[0, -14], [l1, 0]], 3, C.ink); line(c, [[0, -14], [l2, 0]], 3, C.ink); line(c, [[0, -14], [0, -24]], 3.4, C.ink);
  const arm = state === 'wave' ? -32 + Math.sin(t * 12) * 4 : (run ? -20 + Math.sin(ph) * 4 : -15);
  line(c, [[0, -22], [7, arm]], 2.6, C.ink); line(c, [[0, -22], [-6, run ? -15 - Math.sin(ph) * 4 : -15]], 2.6, C.ink);
  line(c, [[0, -24], [-8 - (run ? 3 : 0), -23 + Math.sin(t * 9) * 1.5]], 2.6, C.scarf);
  ell(c, .5, -28.5, 5.2, 5, C.head, C.ink, 1.8); ell(c, 1.5, -32.8, 2, 1.4, C.amber); line(c, [[-3, -33], [2, -36], [4, -34]], 1.6, C.hair);
  c.restore();
}
// ---------------------------------------------------------------- water
function surfaceY(x, h, tw) { const A = clamp(.1 + h * .022, .1, .9); return h + A * (Math.sin(x * .35 - tw * 2.2) * .6 + Math.sin(x * .9 + tw * 3.1) * .25 + Math.sin(x * .13 + tw * 1.1) * .4); }
function water(c, t, h) {
  const tw = wTime(t); const front = FRONT(t); if (h <= .02 && t < BACK0) return;
  const xs = [], step = Math.max(.3, 6 / CAM.s); const xl = -118, xr = Math.min(front, 60);
  for (let x = xl; x <= xr; x += step) xs.push(x); xs.push(xr);
  const top = xs.map(x => P2S(x, surfaceY(x, h, tw) + (x > front - 4 ? (x - (front - 4)) * .35 : 0)));
  const g = c.createLinearGradient(0, Y(h), 0, Y(-2)); g.addColorStop(0, 'rgba(46,140,176,.88)'); g.addColorStop(1, 'rgba(14,52,82,.94)');
  c.beginPath(); c.moveTo(...P2S(xl, 0)); top.forEach(p => c.lineTo(p[0], p[1])); c.lineTo(...P2S(xr, 0)); c.closePath(); c.fillStyle = g; c.fill();
  // foam crest
  c.save(); c.lineWidth = Math.max(2, .25 * CAM.s); c.strokeStyle = 'rgba(235,250,255,.9)'; c.lineJoin = 'round'; c.beginPath(); top.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.restore();
  // current streaks
  c.save(); c.globalAlpha = .35; for (let i = 0; i < 26; i++) { const yy = h * (.1 + .8 * rnd(i)); const x = ((rnd(i * 3) * 80 + tw * (5 + rnd(i) * 5)) % 80) - 12; if (x > front || yy > h - .2) continue;
    line(c, [P2S(x, yy), P2S(x + 2.5 + rnd(i * 5) * 3, yy)], 2, '#BFEFFF'); } c.restore();
  // leading bore foam
  if (front < 58) { const fh = Math.max(h, .5); for (let i = 0; i < 14; i++) ell(c, X(front - rnd(i) * 2), Y(fh * rnd(i * 2) + .2), (4 + rnd(i * 3) * 6) * CAM.s / 18, (3 + rnd(i * 4) * 4) * CAM.s / 18, 'rgba(240,252,255,.85)'); }
}
function splash(c, t, i) {
  const s = T(LV[i][0]) + .15, d = t - s; if (d < 0 || d > .9) return; const h = LV[i][1];
  for (let k = 0; k < 28; k++) { const vx = -(2 + rnd(k + i * 9) * 6), vy = 4 + rnd(k * 3 + i) * (6 + i * 1.2); const x = BX0 - .3 + vx * d, yy = h * .9 + vy * d - 9.8 * d * d;
    if (yy < h - .5) continue; ell(c, X(x), Y(yy), Math.max(2, .22 * CAM.s * (1 - d)), Math.max(2, .22 * CAM.s * (1 - d)), `rgba(235,250,255,${.9 * (1 - d / .9)})`); }
}
// ---------------------------------------------------------------- PIP (Stix cam)
function pip(c, t, h, li) {
  const cx = 250, cy = 650, R = 140; const ap = 1 * (1 - eIO(prog(t, ZOOM0 - .1, ZOOM0 + .5))) + eBack(prog(t, BACK1 - .55, BACK1 - .2));
  if (ap <= .01) return;
  const climbing = t > CLIMB0 && t < CLIMB1; const feet = t < CLIMB0 ? BAL : (t < CLIMB1 ? lerp(BAL, ROOF, eIO(prog(t, CLIMB0 + .25, CLIMB1))) : ROOF);
  c.save(); c.translate(cx, cy); c.scale(ap, ap);
  c.save(); c.beginPath(); c.arc(0, 0, R, 0, 7); c.clip();
  const g = c.createLinearGradient(0, -R, 0, R); g.addColorStop(0, mixc('#7FC0EA', '#2A3A55', clamp(li / 9) * .6)); g.addColorStop(1, '#D8EEF7'); c.fillStyle = g; c.fillRect(-R, -R, 2 * R, 2 * R);
  const PPM = 120, fy = 92;  // pixels per meter inside the bubble, feet line
  if (climbing) { c.fillStyle = '#3A4A60'; c.fillRect(-R, -R, 2 * R, 2 * R); for (let i = -3; i < 4; i++) { const yy = ((i * 70 + t * 260) % 420) - 210; line(c, [[-R, yy], [R, yy - 60]], 10, '#5A6C84'); } }
  else { poly(c, [[-R, fy], [R, fy], [R, fy + 14], [-R, fy + 14]], t < CLIMB0 ? '#9AA6B4' : '#8C97A5', C.ink, 3); if (t < CLIMB0) { line(c, [[-R, fy - 64], [R, fy - 64]], 5, C.ink); for (let i = -2; i <= 2; i++) line(c, [[i * 55, fy], [i * 55, fy - 64]], 4, C.ink); } }
  // water in the bubble
  const rel = h - feet; const wy = fy - rel * PPM; const tw = wTime(t);
  if (!climbing && wy < R + 40) { c.beginPath(); c.moveTo(-R, R); for (let x = -R; x <= R; x += 8) c.lineTo(x, wy + Math.sin(x * .05 - tw * 3) * 6); c.lineTo(R, R); c.closePath(); c.fillStyle = 'rgba(40,130,170,.9)'; c.fill(); }
  // stix pose by beat
  let p = P({ mouth: 'smirk', ua1: 40, la1: -40, ua2: -15, la2: 20 });
  const at = id => t >= T(id);
  if (at('l1')) p = P({ mouth: 'smirk', ly: .8, lx: .3, br: 6, ua1: 20, la1: 40 });
  if (at('l2')) p = P({ mouth: 'flat', br: 10, bt: -6, ly: .8 });
  if (at('l3')) p = P({ mouth: 'o', mo: .3, br: 12, eo: 1.1, ly: .9 });
  if (at('l4')) p = P({ mouth: 'grit', br: 8, ly: .9, ua1: 60, la1: 100, ua2: 50, la2: 90 });
  if (at('l5')) p = P({ mouth: 'wavy', sweat: 1, br: 12, ly: 1, ua1: 60, la1: 100 });
  if (at('l6')) p = P({ mouth: 'o', mo: .6, sweat: 1, br: 16, eo: 1.2, ly: 1, ua1: 150, la1: 160, ua2: 150, la2: 170, lean: -6 });
  if (climbing) { p = locomote(P({ mouth: 'open', mo: .8, br: 14, eo: 1.15, lean: 10, sweat: 1 }), t * 600, 1, true); }
  if (t >= CLIMB1) p = P({ mouth: 'grin', mo: .4, br: 6, ua1: 165, la1: 175 + Math.sin(t * 12) * 10, ly: .6 });
  if (at('l8') && t >= CLIMB1) p = P({ mouth: 'o', mo: .5, br: 14, eo: 1.2, ly: 1, sweat: 1, ua1: 40, la1: 120 });
  if (at('l9')) p = P({ mouth: 'wavy', sweat: 1, br: 18, eo: 1.25, ly: 1, lean: -8, ua1: 150, la1: 165, ua2: -40, la2: -20 });
  if (t >= ZOOM1 + 7.5) p = P({ mouth: 'grin', mo: .3, br: 6, lx: .6, ua1: 50, la1: 20 });
  drawChar(c, breathe(p, t), { x: 0, gy: fy, face: 1, t, scale: .28, noShadow: true, speed: climbing ? 1 : .2 });
  c.restore();
  c.lineWidth = 9; c.strokeStyle = C.scarf; c.beginPath(); c.arc(0, 0, R, 0, 7); c.stroke(); c.lineWidth = 3; c.strokeStyle = C.ink; c.beginPath(); c.arc(0, 0, R + 5, 0, 7); c.stroke();
  c.beginPath(); c.roundRect(-74, -R - 22, 148, 40, 12); c.fillStyle = C.scarf; c.fill(); c.lineWidth = 3; c.strokeStyle = C.ink; c.stroke();
  text(c, 'STIX CAM', 0, -R - 2, 24, '#FFFFFF', { stroke: 5 });
  const lab = climbing ? `FLOOR ${Math.min(15, Math.floor(feet / 3) + 1)}` : `STIX AT ${Math.round(feet)} m`;
  c.beginPath(); c.roundRect(-96, R - 14, 192, 38, 12); c.fillStyle = 'rgba(14,17,30,.9)'; c.fill();
  text(c, lab, 0, R + 5, 24, C.gold, { weight: 900 });
  if (!climbing && t > T('l1')) { const d = feet - h; text(c, d > 0 ? `water ${d.toFixed(1)} m below` : 'UNDERWATER', 0, R + 46, 22, d > 2 ? '#FFFFFF' : '#FF6A5A', { stroke: 5, weight: 800 }); }
  c.restore();
}
// ---------------------------------------------------------------- HUD
function hud(c, t, li) {
  text(c, 'STIX vs', W / 2, 104, 42, '#FFFFFF', { stroke: 9, shadow: 'rgba(0,0,0,.45)' });
  text(c, 'LEVEL 1 → 10 TSUNAMI', W / 2, 160, 56, C.gold, { stroke: 11, shadow: 'rgba(0,0,0,.45)' });
  if (li >= 0) {
    const s = T(LV[li][0]); const u = eBack(prog(t, s, s + .28)); const col = LCOL[li];
    c.save(); c.translate(W / 2, 268); c.scale(lerp(2, 1, u), lerp(2, 1, u)); c.globalAlpha = clamp((t - s) / .06);
    c.font = '900 108px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.shadowColor = rgba(col, .8); c.shadowBlur = 30; c.lineWidth = 18; c.strokeStyle = C.ink; c.strokeText('LEVEL ' + (li + 1), 0, 0); c.shadowColor = 'transparent';
    const g = c.createLinearGradient(0, -50, 0, 50); g.addColorStop(0, '#FFFFFF'); g.addColorStop(.5, col); g.addColorStop(1, mixc(col, '#000000', .3)); c.fillStyle = g; c.fillText('LEVEL ' + (li + 1), 0, 0); c.restore();
    // height counter
    const shown = li === 9 ? lerp(40, 524, eOut(prog(t, SURGE0, SURGE1))) : LV[li][1];
    const ht = shown >= 10 ? Math.round(shown) + ' m' : shown.toFixed(1).replace('.0', '') + ' m';
    text(c, ht, W / 2 - 10, 360, 64 * eBack(prog(t, s + .1, s + .35)), '#FFFFFF', { stroke: 11 });
    text(c, 'RUN-UP', W / 2 + 150, 362, 26, 'rgba(255,255,255,.75)', { weight: 800, align: 'left', stroke: 5 });
    if (LV[li][2] && li !== 5) { const a = eOut(prog(t, s + .3, s + .6)); c.save(); c.globalAlpha = a; c.beginPath(); c.roundRect(W / 2 - 230, 398, 460, 44, 14); c.fillStyle = 'rgba(14,17,30,.85)'; c.fill(); text(c, LV[li][2], W / 2, 421, 28, col, { weight: 900 }); c.restore(); }
  } else if (t < T('l1')) {
    const a = eBack(prog(t, T('hook3'), T('hook3') + .3)); if (a > 0) text(c, 'ONLY THE WATER MOVES', W / 2, 290, 54 * a, '#FFFFFF', { stroke: 10 });
  }
  // level pips
  for (let i = 0; i < 10; i++) { const on = i <= li; const x = W / 2 - 252 + i * 56, y = 470; c.save(); if (on) { c.shadowColor = LCOL[i]; c.shadowBlur = 14; }
    c.beginPath(); c.roundRect(x - 22, y - 9, 44, 18, 7); c.fillStyle = on ? LCOL[i] : 'rgba(255,255,255,.18)'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = 'rgba(0,0,0,.5)'; c.stroke(); c.restore(); }
}
function ruler(c, t, h) {
  const step = CAM.s > 10 ? 5 : 100, maxH = CAM.s > 10 ? 45 : 600;
  const x = 46; line(c, [[x, Y(0)], [x, Y(maxH)]], 4, 'rgba(255,255,255,.85)');
  for (let m = 0; m <= maxH; m += step) { const y = Y(m); if (y < 500) continue; line(c, [[x - 10, y], [x + 10, y]], 3, '#FFFFFF'); text(c, m + '', x + 16, y, 22, '#FFFFFF', { align: 'left', stroke: 5, weight: 800 }); }
  if (h > .05) { const y = Math.max(Y(h), 510); poly(c, [[x + 6, y], [x + 26, y - 12], [x + 26, y + 12]], C.scarf, C.ink, 2.5); }
}
function youMarker(c, t, h) {
  if (CAM.s < 8) return; const x = 11, top = 1.75; const [sx, sy] = P2S(x, 0); const k = 1.75 * CAM.s / 32;
  c.save(); c.translate(sx, sy); c.scale(k, k); c.globalAlpha = .9; c.setLineDash([3, 3]);
  ell(c, 0, -28, 5, 5, null, '#FFFFFF', 2); line(c, [[0, -23], [0, -12]], 2.4, '#FFFFFF'); line(c, [[0, -12], [-4, 0]], 2.2, '#FFFFFF'); line(c, [[0, -12], [4, 0]], 2.2, '#FFFFFF'); line(c, [[0, -20], [-6, -13]], 2, '#FFFFFF'); line(c, [[0, -20], [6, -13]], 2, '#FFFFFF');
  c.setLineDash([]); c.restore();
  const a = 1 - prog(t, T('l4'), T('l4') + .4); if (a > 0) { c.save(); c.globalAlpha = a; text(c, 'YOU · 1.75 m', sx, Y(top) - 22, 20, '#FFFFFF', { stroke: 5, weight: 800 }); c.restore(); }
}
// ---------------------------------------------------------------- level 10 geography + explainer
function lituya(c, t) {
  if (t < ZOOM0) return 0;
  // landslide
  const ls = prog(t, SLIDE0, SLIDE1);
  if (ls > 0 && ls < 1) { for (let i = 0; i < 18; i++) { const x = -170 + 40 * eIn(ls) + rnd(i) * 30, hh = lerp(400 - rnd(i * 2) * 80, 10, eIn(ls)); poly(c, [P2S(x, hh), P2S(x + 14, hh + 6), P2S(x + 20, hh - 10), P2S(x + 4, hh - 16)], '#6E6A62', C.ink, 1.5); } }
  const sp = prog(t, SLIDE1 - .05, SLIDE1 + .9); if (sp > 0 && sp < 1) { for (let i = 0; i < 30; i++) { const a = -Math.PI * (.2 + .6 * rnd(i)), v = 150 + rnd(i * 3) * 200; ell(c, X(-115 + Math.cos(a) * v * sp), Y(Math.sin(-a) * v * sp - 300 * sp * sp), 5, 5, `rgba(230,248,255,${1 - sp})`); } }
  // bay wave travelling to the slope
  const bw = prog(t, SLIDE1, SURGE0 + .2); if (bw > 0 && bw < 1) { const xc = lerp(-110, 60, bw); const pts = []; for (let x = -118; x <= 62; x += 3) pts.push(P2S(x, 40 + 50 * Math.exp(-Math.pow((x - xc) / 18, 2)))); c.beginPath(); c.moveTo(...P2S(-118, 0)); pts.forEach(p => c.lineTo(...p)); c.lineTo(...P2S(62, 0)); c.closePath(); c.fillStyle = 'rgba(46,140,176,.9)'; c.fill(); }
  // run-up sheet climbing the slope
  const ru = 524 * eOut(prog(t, SURGE0, SURGE1));
  if (ru > 1) { const pts = []; for (let x = 60; x <= slopeXat(ru); x += 4) pts.push(P2S(x, slopeH(x))); pts.push(P2S(slopeXat(ru), ru));
    c.beginPath(); c.moveTo(...P2S(60, 0)); pts.forEach(p => c.lineTo(...p)); for (let i = pts.length - 1; i >= 0; i--) { const [px, py] = pts[i]; c.lineTo(px - 10, py + 6); } c.closePath(); c.fillStyle = 'rgba(80,175,210,.85)'; c.fill();
    const tip = P2S(slopeXat(ru), ru); if (t < SURGE1 + .4) for (let i = 0; i < 10; i++) ell(c, tip[0] - rnd(i) * 30, tip[1] - rnd(i * 2) * 20 + 10, 6, 6, 'rgba(240,252,255,.85)'); }
  return ru;
}
function explainer(c, t, ru) {
  const a1 = prog(t, T('c1'), T('c1') + .35) * (1 - prog(t, T('out'), T('out') + .3));
  if (a1 <= 0) return; c.save(); c.globalAlpha = a1;
  // 524 m dashed line + run-up arrow
  const [rx, ry] = P2S(slopeXat(524), 524); c.setLineDash([12, 10]); line(c, [[60, ry], [rx, ry]], 3, '#FFD23F'); c.setLineDash([]);
  text(c, '524 m', rx - 260, ry - 26, 40, C.gold, { stroke: 8 });
  const [bx, by] = P2S(70, 4); c.save(); c.lineWidth = 7; c.strokeStyle = '#FFFFFF'; c.lineCap = 'round'; c.beginPath(); c.moveTo(bx + 20, by - 30); c.lineTo(rx - 30, ry + 40); c.stroke(); poly(c, [[rx - 18, ry + 22], [rx - 50, ry + 34], [rx - 36, ry + 62]], '#FFFFFF'); c.restore();
  const lb = eBack(prog(t, T('c1') + .2, T('c1') + .5)); c.save(); c.translate(rx - 130, ry + 230); c.scale(lb, lb); c.beginPath(); c.roundRect(-190, -54, 380, 108, 18); c.fillStyle = 'rgba(14,17,30,.88)'; c.fill(); c.lineWidth = 4; c.strokeStyle = C.scarf; c.stroke();
  text(c, 'RUN-UP', 0, -20, 44, C.scarf, { stroke: 8 }); text(c, 'how high water climbs on land', 0, 24, 24, '#FFFFFF', { weight: 800 }); c.restore();
  // landslide + narrow bay labels
  const a2 = eBack(prog(t, T('c2'), T('c2') + .35)); if (a2 > 0) { const [lx, ly] = P2S(-165, 330); c.save(); c.translate(lx + 150, ly - 40); c.scale(a2, a2); text(c, 'LANDSLIDE', 0, 0, 38, '#FF8A5A', { stroke: 8 }); c.restore();
    c.save(); c.globalAlpha = a1 * clamp((t - T('c2')) * 3); line(c, [[lx + 90, ly - 20], [lx + 30, ly + 10]], 5, '#FF8A5A'); const [nx, ny] = P2S(-55, 0); text(c, 'NARROW BAY', nx, ny + 60, 32, '#9FE4FF', { stroke: 7 }); c.restore(); }
  // not a wall of water
  const a3 = prog(t, T('c3'), T('c3') + .3); if (a3 > 0) { const [wx0, wy0] = P2S(-90, 0), [wx1, wy1] = P2S(-40, 524 * eOut(a3));
    c.save(); c.fillStyle = 'rgba(255,80,80,.18)'; c.fillRect(wx0, wy1, wx1 - wx0, wy0 - wy1); c.setLineDash([10, 8]); c.strokeStyle = '#FF6A5A'; c.lineWidth = 4; c.strokeRect(wx0, wy1, wx1 - wx0, wy0 - wy1); c.setLineDash([]);
    const xs = eBack(prog(t, T('c3') + .45, T('c3') + .7)); if (xs > 0) { const cx = (wx0 + wx1) / 2, cy = (wy0 + wy1) / 2, r = 70 * xs; line(c, [[cx - r, cy - r], [cx + r, cy + r]], 16, '#FF3B3B'); line(c, [[cx - r, cy + r], [cx + r, cy - r]], 16, '#FF3B3B'); }
    text(c, 'NOT A 524 m WALL', (wx0 + wx1) / 2 + 130, (wy0 + wy1) / 2 + 120, 38, '#FF6A5A', { stroke: 8 }); c.restore(); }
  c.restore();
}

// ================================================================ render
const CHUNKS = (() => { const out = []; let cur = []; TLD.words.forEach(w => { cur.push(w); if (cur.length >= 3 || /[.,?!]$/.test(w.text)) { out.push(cur); cur = []; } }); if (cur.length) out.push(cur); return out; })();
function captions(c, t) {
  let ch = null; for (let i = 0; i < CHUNKS.length; i++) { const s = CHUNKS[i][0].start - .06, e = i + 1 < CHUNKS.length ? CHUNKS[i + 1][0].start - .06 : TLD.vo + .4; if (t >= s && t < e) { ch = CHUNKS[i]; break; } }
  if (!ch) return; const sz0 = 76; c.save(); c.font = `900 ${sz0}px Inter`;
  const words = ch.map(w => w.text.replace(/\.\.\.$/, '…').toUpperCase());
  let ws = words.map(w => c.measureText(w).width), gap = 22, total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1), sz = sz0;
  if (total > 960) { sz = sz0 * 960 / total; c.font = `900 ${sz}px Inter`; ws = words.map(w => c.measureText(w).width); gap *= 960 / total; total = 960; }
  const pop = eBack(prog(t, ch[0].start - .06, ch[0].start + .1)); let x = W / 2 - total / 2; const y = 1450;
  c.translate(W / 2, y); c.scale(.85 + .15 * pop, .85 + .15 * pop); c.translate(-W / 2, -y);
  ch.forEach((w, i) => { const on = t >= w.start - .03, active = on && (i === ch.length - 1 || t < ch[i + 1].start - .03);
    c.save(); c.translate(x + ws[i] / 2, y - (active ? 6 : 0)); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (active) { c.save(); c.beginPath(); c.roundRect(-ws[i] / 2 - 14, -sz * .62, ws[i] + 28, sz * 1.2, 16); c.fillStyle = C.scarf; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 16; c.fill(); c.restore(); }
    c.lineWidth = 16; c.strokeStyle = C.ink; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 12; c.shadowOffsetY = 5; c.strokeText(words[i], 0, 0); c.shadowColor = 'transparent';
    c.fillStyle = on ? '#FFFFFF' : 'rgba(255,255,255,.55)'; c.fillText(words[i], 0, 0); c.restore(); x += ws[i] + gap; });
  c.restore();
}
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  const c = ctx; CAM = camAt(t); const li = t >= BACK0 + .6 ? -1 : levelIndex(t); const h = waterH(t);
  sky(c, t, Math.max(li, 0));
  const ru = t >= ZOOM0 && t < BACK1 ? 524 * eOut(prog(t, SURGE0, SURGE1)) * (1 - prog(t, BACK0, BACK0 + .5)) : 0;
  terrain(c, t, ru);
  house(c, 0, 6.5, 6, '#E7C9A0'); palm(c, 8.5, 9, t); house(c, 36, 43, 4.5, '#C9E0D0');
  // cars: float away once the water is deep enough
  const tw = wTime(t);
  const floatT = h > .65 && t < BACK0 ? (wTime(t) - wTime(T('l2') + .4)) : 0;
  if (floatT > 0) car(c, 15.2 + floatT * 1.6, h - .45 + Math.sin(tw * 2.5) * .12, Math.sin(tw * 1.7) * .12, '#E04848'); else car(c, 15.2, 0, 0, '#E04848');
  const f2 = h > .7 && t < BACK0 ? (wTime(t) - wTime(T('l2') + .7)) : 0;
  if (f2 > 0) car(c, 47 + f2 * 1.3, h - .45 + Math.sin(tw * 2.2 + 1) * .12, Math.sin(tw * 1.3 + 2) * .1, '#3A7AE0'); else car(c, 47, 0, 0, '#3A7AE0');
  line(c, [P2S(20, 0), P2S(20, 6)], Math.max(2, .25 * CAM.s), '#4A4E58'); ell(c, X(20.6), Y(6), Math.max(2, .4 * CAM.s), Math.max(1.5, .25 * CAM.s), '#FFE9A8', C.ink, 1.5);
  const xray = eIO(prog(t, CLIMB0 - .1, CLIMB0 + .25)) * (1 - eIO(prog(t, CLIMB1, CLIMB1 + .4)));
  building(c, t, xray);
  youMarker(c, t, h);
  lituya(c, t);
  // debris
  if (h > 4 && t < BACK0) for (let i = 0; i < 7; i++) { const x = ((rnd(i) * 70 + tw * (1.4 + rnd(i * 2))) % 70) - 10; const yy = surfaceY(x, h, tw) - .3; const [sx, sy] = P2S(x, yy); c.save(); c.translate(sx, sy); c.rotate(Math.sin(tw + i) * .3); poly(c, [[-.9 * CAM.s, -.2 * CAM.s], [.9 * CAM.s, -.3 * CAM.s], [.9 * CAM.s, .2 * CAM.s], [-.9 * CAM.s, .25 * CAM.s]], i % 2 ? '#8A5A30' : '#B88A50', C.ink, 1.5); c.restore(); }
  // stix (true scale)
  let sx = 21.9, sh = BAL, st = 'idle';
  if (t > CLIMB0) { const u = prog(t, CLIMB0, CLIMB1); if (u < .1) { sx = lerp(21.9, 24.5, u / .1); st = 'run'; } else if (u < 1) { const k = (u - .1) / .9; sh = lerp(BAL, ROOF, k); const zz = (k * 11) % 1; sx = lerp(24, 26.4, zz < .5 ? zz * 2 : 2 - zz * 2); st = 'run'; } else { sx = 25.8; sh = ROOF; st = t < T('l8') ? 'wave' : 'idle'; } }
  water(c, t, h);
  for (let i = 0; i < 9; i++) splash(c, t, i);
  miniStix(c, sx, sh, t, st);
  if (CAM.s > 8 && t > .2) { const [ax, ay] = P2S(sx, sh + 1.75); const bob = Math.sin(t * 5) * 5; poly(c, [[ax - 9, ay - 26 + bob], [ax + 9, ay - 26 + bob], [ax, ay - 12 + bob]], C.gold, C.ink, 2.5); if (t < T('l2')) text(c, 'STIX', ax, ay - 46 + bob, 24, C.gold, { stroke: 6 }); }
  // level 6 seawall reference
  const sw = prog(t, T('l6') + .3, T('l6') + .6) * (1 - prog(t, T('l7'), T('l7') + .3)); if (sw > 0) { c.save(); c.globalAlpha = sw; c.setLineDash([14, 10]); line(c, [[0, Y(10)], [W, Y(10)]], 4, '#FFD23F'); c.setLineDash([]); text(c, 'TYPICAL SEAWALL ≈ 10 m', 560, Y(10) - 26, 30, C.gold, { stroke: 7 }); c.restore(); }
  // level 7 pause overlay
  if (t > PAUSE0 && t < PAUSE1 + .2) { const a = clamp((t - PAUSE0) * 5) * (1 - clamp((t - PAUSE1) * 5)); c.save(); c.globalAlpha = a * .18; c.fillStyle = '#A0C8FF'; c.fillRect(0, 0, W, H); c.globalAlpha = a; c.beginPath(); c.roundRect(W - 300, 540, 250, 64, 18); c.fillStyle = 'rgba(14,17,30,.88)'; c.fill(); poly(c, [[W - 276, 556], [W - 266, 556], [W - 266, 588], [W - 276, 588]], '#FFFFFF'); poly(c, [[W - 258, 556], [W - 248, 556], [W - 248, 588], [W - 258, 588]], '#FFFFFF'); text(c, 'PAUSED', W - 160, 572, 34, '#FFFFFF', { weight: 900 }); c.restore(); }
  explainer(c, t, ru);
  ruler(c, t, h);
  vignette(c, .35);
  pip(c, t, h, Math.max(li, 0));
  hud(c, t, li);
  if (t > T('out') + .1) { const a = eBack(prog(t, T('out') + .1, T('out') + .4)) * (1 - prog(t, BACK1 - .5, BACK1)); if (a > 0) { text(c, 'WHICH LEVEL', W / 2, 640, 74 * a, '#FFFFFF', { stroke: 12 }); text(c, 'COULD YOU SURVIVE?', W / 2, 730, 74 * a, C.gold, { stroke: 12 }); } }
  text(c, '@CRAZELTIPS', W / 2, 1530, 30, 'rgba(255,255,255,.55)', { weight: 800, stroke: 5, sc: 'rgba(0,0,0,.4)' });
  captions(c, t);
}
window.render = render;
window.frameJPEG = (t, q = .93) => { render(t); return cv.toDataURL('image/jpeg', q); };
