// =====================================================================
//  Scenes, transitions, captions, compositor
// =====================================================================
const SEGS = TLD.segs;
const SEG = {}; SEGS.forEach(s => SEG[s.id] = s);
const rel = (seg, k) => cue(k) - seg.start;
const GY = GROUND;
const HEADY = (gy = GY, s = SC) => gy - (HIPH + 232 + 150) * s;   // approx head centre y

function withCam(c, cam, fn) { c.save(); setCam(c, cam, 1); fn(); c.restore(); }
function baseCam(lt, dur, extra = {}) { return Object.assign({ x: 540, y: 1000, z: 1 + .04 * eIO(lt / dur), r: 0 }, extra); }
function applyImpact(cam, ic) { cam.z += ic.z; cam.r += ic.r; cam.x -= ic.sx; cam.y -= ic.sy; return cam; }

// ---------------------------------------------------------------- weapon icons (for tiles / ranking)
const ICON = { club: ['club', 240], dagger: ['dagger', 190], sling: ['sling', 180], axe: ['axe', 320], mace: ['mace', 300], khopesh: ['khopesh', 240], spear: ['spear', 690], bow: ['bow', 0], ballista: ['ballista', 0], fire: ['siphon', 316] };
function icon(c, k, x, y, s) {
  c.save(); c.translate(x, y);
  if (k === 'bow') { c.scale(s * .62, s * .62); c.rotate(rad(-35)); weapon(c, 'bow', { draw: .3, arrow: true }); }
  else if (k === 'ballista') { c.scale(s * .42, s * .42); ballistaProp(c, 0, 90, 1, .6, true); }
  else { const [w, L] = ICON[k]; const sc = s * Math.min(1, 300 / L); c.rotate(rad(-38)); c.scale(sc, sc); c.translate(-L / 2 + (k === 'spear' ? 220 : 30), 0); weapon(c, w, { t: 0 }); }
  c.restore();
}
function tile(c, x, y, k, rank, u, q, glow = 0) {
  if (u <= 0) return; const s = eBack(u);
  c.save(); c.translate(x, y); c.scale(s, s); c.globalAlpha = clamp(u * 3);
  c.shadowColor = rgba(TIER[rank], .7 + glow * .3); c.shadowBlur = 22 + glow * 30;
  c.beginPath(); c.roundRect(-84, -70, 168, 140, 22); c.fillStyle = 'rgba(14,17,30,.82)'; c.fill(); c.shadowColor = 'transparent';
  c.lineWidth = 5; c.strokeStyle = TIER[rank]; c.stroke();
  c.save(); c.beginPath(); c.roundRect(-84, -70, 168, 140, 22); c.clip();
  const g = c.createLinearGradient(0, -70, 0, 70); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(.5, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(-84, -70, 168, 140);
  if (q) { text(c, '?', 0, 6, 100, C.gold, { stroke: 12, shadow: 'rgba(255,200,40,.9)', blur: 30 }); } else icon(c, k, 0, 8, .9);
  c.restore();
  ell(c, -70, -56, 22, 22, TIER[rank], C.ink, 4); text(c, '' + rank, -70, -55, 24, C.ink, { weight: 900 });
  c.restore();
}

// ---------------------------------------------------------------- props
function ballistaProp(c, x, y, s, draw, loaded, boltLen = 300) {
  c.save(); c.translate(x, y); c.scale(s, s);
  oline(c, [[-120, 0], [-60, -120]], 20, C.woodD); oline(c, [[120, 0], [60, -120]], 20, C.woodD);
  ell(c, -120, -8, 34, 34, '#5A3A20', C.ink, 6); ell(c, -120, -8, 8, 8, C.ink); ell(c, 120, -8, 34, 34, '#5A3A20', C.ink, 6); ell(c, 120, -8, 8, 8, C.ink);
  c.beginPath(); c.roundRect(-210, -150, 420, 34, 10); c.fillStyle = C.wood; c.fill(); c.lineWidth = 6; c.strokeStyle = C.ink; c.stroke();
  line(c, [[-200, -144], [200, -144]], 5, C.woodL);
  // arms + string
  const ax = 150, pull = -100 - 150 * draw;
  oline(c, [[ax - 10, -133], [ax - 40 - 20 * draw, -330]], 18, C.wood); oline(c, [[ax - 10, -133], [ax - 40 - 20 * draw, 64]], 18, C.wood);
  line(c, [[ax - 40 - 20 * draw, -330], [pull, -133], [ax - 40 - 20 * draw, 64]], 4, '#EDEDED');
  ell(c, ax - 10, -133, 26, 26, '#6C7482', C.ink, 5);
  if (loaded) arrow(c, pull, -133, 0, 1.4, boltLen);
  // winch
  ell(c, -170, -133, 30, 30, '#7A5030', C.ink, 5); line(c, [[-170, -163], [-170, -103]], 5, C.ink); line(c, [[-200, -133], [-140, -133]], 5, C.ink);
  c.restore();
}
function boat(c, x, y, t, burn) {
  c.save(); c.translate(x, y + Math.sin(t * 2) * 6); c.rotate(Math.sin(t * 1.6) * .03);
  poly(c, [[-230, -40], [230, -40], [190, 40], [-200, 40]], burn > .5 ? '#3A2418' : '#7A4A28', C.ink, 6);
  line(c, [[-210, -18], [210, -18]], 5, burn > .5 ? '#2A1A10' : '#A06A3A');
  oline(c, [[-20, -40], [-20, -300]], 12, C.woodD);
  poly(c, [[-14, -290], [150, -250], [150, -110], [-14, -80]], burn > .3 ? mixc('#E8DCC0', '#2A2420', clamp(burn)) : '#E8DCC0', C.ink, 5);
  for (let i = 0; i < 6; i++) oline(c, [[-160 + i * 60, 30], [-190 + i * 60, 110]], 6, C.woodD, 5);
  c.restore();
}
function scroll(c, x, y, u, burn, t) {
  if (u <= 0) return; c.save(); c.translate(x, y);
  const w = 220 * eOut(u), h = 150;
  c.globalAlpha = 1 - clamp(burn * 1.2 - .2);
  poly(c, [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], burn > 0 ? mixc('#F2E2B8', '#3A2A20', clamp(burn)) : '#F2E2B8', C.ink, 4);
  ell(c, -w / 2, 0, 16, h / 2 + 8, '#D9C08A', C.ink, 4); ell(c, w / 2, 0, 16, h / 2 + 8, '#D9C08A', C.ink, 4);
  if (u > .7 && burn < .5) { text(c, 'RECIPE', 0, -38, 32, '#5A3A20', { weight: 900 }); text(c, '???', 0, 22, 64, '#B03A2A', { weight: 900 }); }
  c.restore();
  if (burn > 0) { c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 24; i++) { const per = .45 + rnd(i) * .3; const a = ((t / per) + rnd(i * 3)) % 1; flameP(c, x - 110 + rnd(i * 7) * 220, y + 70 - a * 160 * clamp(burn * 2), 30 * (1 - a * .5), a, clamp(burn * 2)); } c.restore(); }
}

// ---------------------------------------------------------------- enemy reaction
function knock(lt, ti, power, dir = 1) {  // returns {dx, rot, hy, ko}
  const d = lt - ti; if (d < 0) return { dx: 0, rot: 0, hy: 0, ko: false };
  if (power < .3) return { dx: 8 * wob(d, 30, 8) * dir, rot: -3 * wob(d, 18, 5), hy: 0, ko: false };
  if (power < .55) { const u = eOut(d * 3); return { dx: 130 * power * u * dir * 2, rot: -lerp(0, 18, u) + 10 * wob(d, 14, 5), hy: 0, ko: false }; }
  const u = clamp(d / .55); const fall = eOut5(u);
  return { dx: 420 * power * eOut(d * 2.2) * dir, rot: -86 * fall + 8 * wob(d - .55, 22, 7), hy: -160 * power * Math.sin(Math.min(1, u) * Math.PI) * (1 - u * .3), ko: d > .12 };
}
function grunt(c, x, p, opt) { drawChar(c, p, Object.assign({ kind: 'grunt', x, gy: GY, face: -1 }, opt)); }

// ================================================================ SCENES
const SCN = {};

SCN.hook = (c, seg, lt) => {
  const dur = seg.end - seg.start, one = rel(seg, 'one'), so = rel(seg, 'so') - .05, tested = rel(seg, 'tested'), weak = rel(seg, 'weakest'), dead = rel(seg, 'deadliest');
  if (lt < so) {
    const ic = impactCam(lt, [[one, .6]]); const cam = applyImpact(baseCam(lt, so, { x: 580, z: 1.06 + .12 * eIO(lt / so) }), ic);
    background(c, PAL.hook, cam, lt, { noSun: true, mote: '#FFB070' });
    withCam(c, cam, () => {
      // spotlight
      c.save(); c.globalCompositeOperation = 'lighter'; const g = c.createLinearGradient(0, 300, 0, GY); g.addColorStop(0, 'rgba(255,220,160,0)'); g.addColorStop(1, 'rgba(255,200,140,.22)');
      c.fillStyle = g; poly(c, [[690, 300], [740, 300], [880, GY], [560, GY]], g); c.restore();
      // pedestal + mystery weapon
      poly(c, [[620, GY], [620, GY - 110], [800, GY - 110], [800, GY]], '#3A3F55', C.ink, 5); poly(c, [[600, GY - 110], [820, GY - 110], [820, GY - 130], [600, GY - 130]], '#4A5068', C.ink, 5);
      const pulse = .5 + .5 * Math.sin(lt * 5) + 1.5 * Math.exp(-Math.max(0, lt - one) * 3) * (lt > one ? 1 : 0);
      c.save(); c.translate(710, GY - 200); c.rotate(rad(-20)); c.scale(.62, .62); c.translate(-90, 0);
      c.shadowColor = `rgba(255,120,30,${.7 + .3 * pulse})`; c.shadowBlur = 50 + 30 * pulse; weapon(c, 'siphon', {}); c.shadowColor = 'transparent'; c.filter = 'brightness(0.1)'; weapon(c, 'siphon', {}); c.filter = 'none'; c.restore();
      c.save(); c.globalCompositeOperation = 'source-atop'; c.restore();
      text(c, '?', 710, GY - 420 - 10 * Math.sin(lt * 3), 150 + 20 * pulse * .3, C.gold, { stroke: 16, shadow: 'rgba(255,180,40,.9)', blur: 40 });
      // stix peeking, scared
      const scared = P({ lean: -8, br: 12, eo: 1.12, mouth: 'o', mo: .4 + .3 * Math.exp(-Math.max(0, lt - one) * 4), sweat: 1, ua1: 50, la1: 140, ua2: -30, la2: 40, lx: .8, ly: -.4, tilt: -4 });
      let pz = breathe(scared, lt); if (lt > one) { const d = lt - one; pz.sq = 1 - .08 * wob(d, 20, 6); pz.hx = -14 * eOut(d * 4); }
      drawChar(c, pz, { x: 300, gy: GY, face: 1, t: lt });
    });
    vignette(c, .8);
  } else {
    const l2 = lt - so; const cam = baseCam(l2, dur - so, { z: 1.0 });
    background(c, ['#1E2A4A', '#6E86B8'], cam, lt);
    const ids = ['club', 'dagger', 'sling', 'axe', 'mace', 'khopesh', 'spear', 'bow', 'ballista', 'fire'];
    withCam(c, cam, () => {
      const p0 = P({ w: null, mouth: 'smirk', ua1: 160, la1: 172, ua2: 20, la2: -70, br: 4, ly: -.8, lx: .3 });
      const pIn = lp(P({ lean: -8, br: 12, eo: 1.1, mouth: 'o', ua1: 50, la1: 140 }), p0, eBack(prog(l2, 0, .35)));
      const p = breathe(pIn, lt); p.sq = 1 + .06 * wob(l2, 16, 5);
      drawChar(c, p, { x: 470, gy: GY, face: 1, t: lt });
    });
    // tiles
    ids.forEach((k, i) => { const row = Math.floor(i / 5), col = i % 5; const st = tested - so - .1 + i * .085;
      tile(c, 136 + col * 202, 330 + row * 168, k, 10 - i, prog(l2, st, st + .3), k === 'fire', k === 'fire' ? .5 + .5 * Math.sin(lt * 6) : 0); });
    // weakest -> deadliest bar
    const bu = prog(lt, weak - .1, dead + .25); const y = 624;
    if (lt > weak - .3) { c.save(); c.globalAlpha = clamp((lt - weak + .3) * 4);
      c.beginPath(); c.roundRect(110, y - 16, 860, 32, 16); c.fillStyle = 'rgba(255,255,255,.12)'; c.fill();
      const g = c.createLinearGradient(110, 0, 970, 0); g.addColorStop(0, '#A9B4C2'); g.addColorStop(.6, '#FF9A4A'); g.addColorStop(1, '#FF3030');
      c.beginPath(); c.roundRect(110, y - 16, Math.max(32, 860 * eIO(bu)), 32, 16); c.fillStyle = g; c.shadowColor = '#FF6A3A'; c.shadowBlur = 20; c.fill(); c.restore();
      text(c, 'WEAKEST', 110, y + 46, 30, '#C9D2DE', { align: 'left', stroke: 6 }); if (lt > dead - .1) text(c, 'DEADLIEST', 970, y + 46, 30 * eBack(prog(lt, dead - .1, dead + .15)), '#FF6A4A', { align: 'right', stroke: 6 }); }
    if (l2 < .12) { c.fillStyle = `rgba(255,255,255,${1 - l2 / .12})`; c.fillRect(0, 0, W, H); }
    vignette(c, .5);
  }
};

SCN.club = (c, seg, lt) => {
  const dur = seg.end - seg.start, lit = rel(seg, 'literally'), bonk = rel(seg, 'bonk') - .04;
  const ic = impactCam(lt, [[bonk, .45]]); const cam = applyImpact(baseCam(lt, dur, { x: 560 }), ic);
  const T = hitstop(lt, [[bonk, .8]]);
  background(c, PAL[10], cam, lt);
  withCam(c, cam, () => {
    // grunt: arms crossed, smug
    const gp = breathe(P({ ua1: 50, la1: -40, ua2: 40, la2: -60, mouth: 'smug', lean: -2 }), lt, 1);
    if (T > bonk) { const d = T - bonk; gp.tilt = -10 * wob(d, 18, 4); gp.mouth = 'flat'; gp.br = 10 * clamp(d * 4); gp.bt = -8; gp.lx = 1; }
    grunt(c, 790, gp, { t: lt });
    // stix
    const rest = P({ w: 'club', ua1: 30, la1: 165, wa: -95, mouth: 'smirk' });
    const look = P({ w: 'club', ua1: 70, la1: 140, wa: -60, tilt: 8, ly: -.5, lx: .6, mouth: 'flat', br: 6, bt: -6 });
    const up = P({ w: 'club', ua1: 172, la1: 205, wa: -20, lean: -10, mouth: 'grit', bt: 10, f1x: 60 });
    const hit = P({ w: 'club', ua1: 96, la1: 118, wa: 0, lean: 16, mouth: 'grit', bt: 12, f1x: 90, f2x: -60 });
    const after = P({ w: 'club', ua1: 70, la1: 100, wa: -10, lean: -6, mouth: 'grin', mo: .2, sweat: 1, br: 10, lx: 1 });
    let p = kf([[0, rest], [lit - .2, rest], [lit + .15, look, eBack], [2.45, look], [2.75, rest], [bonk - .3, rest], [bonk - .08, up, eOut], [bonk, hit, eIn], [bonk + .5, hit], [bonk + .8, after, eBack]], T);
    const walk = prog(T, 2.55, bonk - .3); let x = lerp(300, 566, eIO(walk));
    if (walk > 0 && walk < 1) p = locomote(p, (x - 300) / SC, 1); p = breathe(p, lt);
    drawChar(c, p, { x, gy: GY, face: 1, t: lt, speed: walk > 0 && walk < 1 ? .5 : 0 });
    if (T > bonk - .1 && T < bonk + .05) trail(c, tt => { const q = kf([[bonk - .3, rest], [bonk - .08, up, eOut], [bonk, hit, eIn], [bonk + .5, hit]], tt); return [weaponWorld(q, { x, gy: GY, face: 1 }, 120), weaponWorld(q, { x, gy: GY, face: 1 }, 240)]; }, T, .1);
    // stars
    if (T > bonk) { const d = T - bonk; for (let i = 0; i < 3; i++) { const a = d * 8 + i * 2.1; const sx = 790 + Math.cos(a) * 80, sy = HEADY() - 90 + Math.sin(a) * 22; if (d < 1.2) text(c, '★', sx, sy, 40, C.gold, { stroke: 6 }); } }
    burst(c, 760, HEADY() - 30, T - bonk, 120);
    comic(c, 'BONK!', 640, HEADY() - 120, lt - bonk, '#FFE36A', 130);
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.dagger = (c, seg, lt) => {
  const dur = seg.end - seg.start, s1 = rel(seg, 'fast') + .05, s2 = rel(seg, 'sneaky') + .05, way = rel(seg, 'way'), close = rel(seg, 'close');
  const T = hitstop(lt, [[s1, .5], [s2, .5]]);
  const zoom = eIO(prog(lt, way - .5, way)) * (1 - eIO(prog(lt, close + .05, close + .35)));
  const ic = impactCam(lt, [[s1, .3], [s2, .3], [close, .7]]);
  const cam = applyImpact(baseCam(lt, dur, { x: lerp(560, 690, zoom), y: lerp(1000, 900, zoom), z: 1 + .5 * zoom }), ic);
  background(c, PAL[9], cam, lt);
  withCam(c, cam, () => {
    const gp0 = breathe(P({ ua1: 30, la1: 60, ua2: -20, la2: 20, mouth: 'frown' }), lt, 2);
    let gp = gp0; let gx = 800;
    for (const s of [s1, s2]) { const d = T - s; if (d > 0) { gx += 26 * eOut(d * 6); gp = Object.assign({}, gp, { lean: -10 * Math.exp(-d * 5), mouth: d < .4 ? 'o' : 'frown' }); } }
    if (lt > way - .4) gp = Object.assign({}, gp, { lean: 10 * eOut(prog(lt, way - .4, way)), bt: 10, mouth: 'grit', lx: 0 });
    if (lt > close) { const d = lt - close; gp = Object.assign({}, gp, { lean: 10 + 22 * wob(d, 14, 5) }); }
    grunt(c, gx, gp, { t: lt });
    // stix
    const idle = P({ w: 'dagger', ua1: 40, la1: 70, wa: 0, mouth: 'smirk' });
    const pull = P({ w: 'dagger', ua1: -20, la1: 50, wa: 0, lean: 2, mouth: 'grit' });
    const thr = P({ w: 'dagger', ua1: 86, la1: 88, wa: 0, lean: 18, f1x: 80, f2x: -50, mouth: 'grit', bt: 10 });
    const nerv = P({ w: 'dagger', ua1: 30, la1: 80, mouth: 'grin', mo: .1, sweat: 1, br: 12, eo: 1.1, lean: -4, ly: -.6, lx: .5 });
    let keys = [[0, idle], [s1 - .45, idle], [s1 - .1, pull], [s1, thr, eIn], [s1 + .15, thr], [s2 - .14, pull], [s2, thr, eIn], [s2 + .2, thr], [s2 + .5, idle], [way - .5, idle], [way - .2, nerv, eBack]];
    let p = kf(keys, T);
    let x = lerp(280, 600, eIO(prog(T, s1 - .75, s1 - .2)));
    x = lerp(x, 668, eIO(prog(lt, way - .6, way - .1)));
    const mv = prog(T, s1 - .75, s1 - .2); if (mv > 0 && mv < 1) p = locomote(p, (x - 280) / SC, 1, true);
    let rot = 0, gy = GY;
    if (lt > close) { const d = lt - close; x -= 260 * eOut(d * 2.5); rot = -24 * eOut(d * 4) + 6 * wob(d - .3, 16, 5); p = Object.assign({}, p, { mouth: 'o', mo: .6, eo: 1.15, br: 16, sweat: 0, lean: -20, ua1: 150, la1: 160, ua2: 170, la2: 170 }); }
    p = breathe(p, lt);
    drawChar(c, p, { x, gy, face: 1, t: lt, rot, speed: mv > 0 && mv < 1 ? 1 : 0 });
    for (const s of [s1, s2]) { burst(c, gx - 70, GY - 470, T - s, 70, '#B8FFE0'); sparks(c, gx - 70, GY - 470, T - s, 14, s * 10, 700, '#CFFFF0'); }
    comic(c, 'SHINK!', 600, 760, lt - s1, '#7FE8C0', 100);
    if (lt > close) { burst(c, 700, HEADY() - 40, lt - close, 110); comic(c, 'OOF!', 520, 760, lt - close, '#FFE36A', 120, 8); }
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.sling = (c, seg, lt) => {
  const dur = seg.end - seg.start, just = rel(seg, 'just'), strap = rel(seg, 'strap'), rel_ = rel(seg, 'hits') + .2, hit = rel(seg, 'bullet') + .02;
  const spinS = just + .45;
  const fly = prog(lt, rel_, hit);
  const ic = impactCam(lt, [[hit, .55]]);
  const cam = applyImpact(baseCam(lt, dur, { x: lerp(500, 660, eIO(prog(lt, rel_ - .1, hit + .1))) }), ic);
  background(c, PAL[8], cam, lt);
  withCam(c, cam, () => {
    const kn = knock(lt, hit, .5);
    let gp = breathe(P({ ua1: 20, la1: 40, mouth: 'smug' }), lt, 3); if (lt > rel_) gp = Object.assign({}, gp, { mouth: 'o', eo: 1.2, br: 10 });
    if (lt > hit) gp = Object.assign({}, gp, { mouth: 'ko', ua1: 140, la1: 160, ua2: 150, la2: 170 });
    grunt(c, 880 + kn.dx, gp, { t: lt, rot: kn.rot, helmet: !(lt > hit) });
    if (lt > hit) { const d = lt - hit; const hx = 900 + 300 * d, hy = HEADY() - 60 - 700 * d + 1500 * d * d; if (hy < GY) { c.save(); c.translate(hx, hy); c.rotate(d * 14); c.scale(SC, SC); c.translate(0, 60); c.beginPath(); c.moveTo(-122, 10); c.bezierCurveTo(-130, -140, 130, -140, 122, 10); c.closePath(); c.fillStyle = C.bronze; c.fill(); c.lineWidth = 5; c.strokeStyle = C.ink; c.stroke(); c.restore(); } }
    // stix
    let spinA = 0; const sp = clamp((lt - spinS) / (rel_ - spinS));
    if (lt > spinS && lt < rel_) spinA = 360 * (1.2 * (lt - spinS) + 2.6 * Math.pow(lt - spinS, 2));
    const idle = P({ w: 'sling', ua1: 10, la1: 10, wa: -10, mouth: 'smirk' });
    const show = P({ w: 'sling', ua1: 10, la1: 10, wa: -10, ua2: 120, la2: 160, mouth: 'smirk', br: 8, lx: -.6, ly: -.6 });
    const spin = P({ w: 'sling', ua1: 168, la1: 178, wa: 0, mouth: 'grit', bt: 10, lean: -4, ua2: 40, la2: 70 });
    const thr = P({ w: 'sling', ua1: 88, la1: 75, wa: 0, mouth: 'open', mo: .6, lean: 18, f1x: 80, f2x: -60 });
    let p = kf([[0, idle], [just - .1, idle], [just + .2, show, eBack], [spinS - .1, show], [spinS + .15, spin], [rel_ - .04, spin], [rel_ + .06, thr, eOut], [rel_ + .8, thr], [rel_ + 1.1, P({ w: 'sling', mouth: 'grin', mo: .4, ua2: 160, la2: 170 }), eBack]], lt);
    if (lt > spinS && lt < rel_) p.wa = spinA;
    p = breathe(p, lt);
    drawChar(c, p, { x: 230, gy: GY, face: 1, t: lt, wex: { empty: lt > rel_ } });
    if (lt > spinS + .2 && lt < rel_) { const h = weaponWorld(p, { x: 230, gy: GY, face: 1 }, 0); c.save(); c.globalAlpha = .25 * sp; c.beginPath(); c.arc(h[0], h[1], 160 * SC, 0, 7); c.lineWidth = 30 * SC; c.strokeStyle = '#FFFFFF'; c.stroke(); c.restore(); }
    if (lt > rel_ && lt < hit) { const a = [330, GY - 560], b = [850, HEADY() + 10]; const x = lerp(a[0], b[0], fly), y = lerp(a[1], b[1], fly) - 60 * Math.sin(fly * Math.PI);
      c.save(); for (let i = 1; i < 8; i++) { c.globalAlpha = .4 * (1 - i / 8); ell(c, x - i * 26, y + i * 1.5, 13 - i, 13 - i, '#FFFFFF'); } c.restore(); ell(c, x, y, 13, 13, '#8C8F98', C.ink, 3.5); }
    burst(c, 850, HEADY(), lt - hit, 130); sparks(c, 850, HEADY(), lt - hit, 18, 4, 900);
    comic(c, 'THWACK!', 690, HEADY() - 130, lt - hit, '#C8F070', 112);
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.axe = (c, seg, lt) => {
  const dur = seg.end - seg.start, built = rel(seg, 'built'), job = rel(seg, 'job'), hit = rel(seg, 'smashing') + .06;
  const T = hitstop(lt, [[hit, 1.2]]);
  const ic = impactCam(lt, [[hit, .8]]); const cam = applyImpact(baseCam(lt, dur, { x: 580, z: 1.02 + .08 * eIO(prog(lt, job, hit)) }), ic);
  background(c, PAL[7], cam, lt);
  withCam(c, cam, () => {
    const kn = knock(T, hit, .75);
    let gp = breathe(P({ ua1: 40, la1: 60, ua2: 70, la2: 80, mouth: 'grit', lean: 6, f1x: 50, f2x: -50 }), lt, 2);
    if (T > hit) gp = Object.assign({}, gp, { mouth: 'ko', ua1: 150, la1: 160, ua2: 150, la2: 175 });
    grunt(c, 810 + kn.dx, gp, { t: lt, rot: kn.rot, shield: T < hit ? 'round' : null });
    if (T >= hit) { const d = T - hit; for (const sg of [-1, 1]) { c.save(); const bx = 700 + sg * 40 * d * 6 + 120 * d, by = GY - 330 - 400 * d + 1600 * d * d; c.translate(bx, Math.min(by, GY - 40)); c.rotate(sg * d * 5); c.scale(SC, SC);
      c.beginPath(); c.ellipse(0, 0, 96, 104, 0, sg < 0 ? Math.PI / 2 : -Math.PI / 2, sg < 0 ? Math.PI * 1.5 : Math.PI / 2); c.closePath(); c.fillStyle = '#A8642E'; c.fill(); c.lineWidth = 6; c.strokeStyle = C.ink; c.stroke(); c.restore(); } }
    // stix
    const carry = P({ w: 'axe', ua1: 30, la1: 165, wa: -100, mouth: 'smirk' });
    const air = P({ w: 'axe', ua1: 176, la1: 215, wa: -20, lean: -8, mouth: 'grit', bt: 12, f1x: 40, f1y: -60, f2x: -40, f2y: -30 });
    const chop = P({ w: 'axe', ua1: 100, la1: 140, wa: 0, lean: 26, mouth: 'open', mo: .8, bt: 14, f1x: 90, f2x: -70 });
    const land = Object.assign({}, chop, { mouth: 'grin', mo: .3 });
    let p = kf([[0, carry], [built, carry], [job + .1, carry], [job + .3, air, eOut], [hit - .07, air], [hit, chop, eIn], [hit + .5, chop], [hit + .9, land]], T);
    const run = prog(T, built - .05, job + .15); let x = lerp(250, 520, eIO(run));
    if (run > 0 && run < 1) p = locomote(p, (x - 250) / SC, 1, true);
    let jumpY = 0; if (T > job + .1 && T < hit + .02) { const u = prog(T, job + .1, hit + .02); jumpY = -230 * Math.sin(u * Math.PI); x += 60 * u; } else if (T >= hit + .02) x += 60;
    if (T > hit) { const d = T - hit; p.sq = 1 - .12 * Math.exp(-d * 9) * Math.cos(d * 20); }
    p = breathe(p, lt);
    drawChar(c, p, { x, gy: GY + jumpY, face: 1, t: lt, speed: run > 0 && run < 1 ? 1 : 0 });
    if (T > hit - .12 && T < hit + .06) trail(c, tt => { let q = kf([[job + .3, air], [hit - .07, air], [hit, chop, eIn], [hit + .5, chop]], tt); const u = prog(tt, job + .1, hit + .02); const jy = -230 * Math.sin(u * Math.PI); return [weaponWorld(q, { x: x, gy: GY + jy, face: 1 }, 200, 40), weaponWorld(q, { x, gy: GY + jy, face: 1 }, 284, 90)]; }, T, .12);
    burst(c, 700, GY - 320, T - hit, 170); sparks(c, 700, GY - 320, T - hit, 22, 9, 1100); debris(c, 700, GY - 330, T - hit, 16, 3, ['#A8642E', '#C88A52', '#6E4220']); dust(c, x + 20, GY, T - hit, 6, 2);
    speedLines(c, 700, GY - 320, T - hit, .35);
    comic(c, 'CRACK!', 560, 790, T - hit, '#5CC8E8', 130);
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.mace = (c, seg, lt) => {
  const dur = seg.end - seg.start, armor = rel(seg, 'armor'), m2 = rel(seg, 'mace2'), hit = rel(seg, 'care') + .03;
  const T = hitstop(lt, [[hit, 1.3]]);
  const ic = impactCam(lt, [[hit, 1]]); const cam = applyImpact(baseCam(lt, dur, { x: 580 }), ic);
  background(c, PAL[6], cam, lt);
  withCam(c, cam, () => {
    // grunt flexing armor
    let gp = breathe(P({ ua1: 30, la1: 60, mouth: 'smug' }), lt, 1);
    if (lt > armor - .1) gp = lp(gp, P({ ua1: 70, la1: -60, ua2: 120, la2: 30, mouth: 'smug', lean: -8, tilt: -10, br: 8 }), eBack(prog(lt, armor - .1, armor + .2)));
    if (lt > armor + .1) gp.ua1 += 8 * Math.sin(lt * 18) * (lt < m2 ? 1 : 0);
    let gx = 770, grot = 0, gyy = GY;
    if (T > hit) { const d = T - hit; gx += 1500 * d; gyy = GY - 900 * d + 1200 * d * d; grot = -d * 900; gp = Object.assign({}, gp, { mouth: 'ko', ua1: 160, la1: 170, ua2: 140, la2: 160 }); }
    if (gyy < GY + 400) grunt(c, gx, gp, { t: lt, rot: grot, gy: Math.min(gyy, GY), plate: true, helmet: T < hit });
    if (T > hit) { const d = T - hit; const hx = 760 - 100 * d, hy = HEADY() - 80 - 1300 * d + 1700 * d * d; c.save(); c.translate(hx, Math.min(hy, GY - 30)); c.rotate(d * 20); c.scale(SC * 1.1, SC * 1.1); c.beginPath(); c.moveTo(-122, 10); c.bezierCurveTo(-130, -140, 130, -140, 122, 10); c.closePath(); c.fillStyle = C.bronze; c.fill(); c.lineWidth = 6; c.strokeStyle = C.ink; c.stroke(); c.restore(); }
    // stix
    const idle = P({ w: 'mace', ua1: 20, la1: 30, wa: 0, mouth: 'flat' });
    const brow = P({ w: 'mace', ua1: 20, la1: 30, wa: 0, mouth: 'flat', br: 4, bt: -10, tilt: 6 });
    const wind = P({ w: 'mace', ua1: -70, la1: -95, wa: 0, lean: -12, mouth: 'grit', bt: 14, f1x: 60, f2x: -60 });
    const swing = P({ w: 'mace', ua1: 92, la1: 98, wa: 0, lean: 24, mouth: 'open', mo: 1, bt: 14, f1x: 100, f2x: -70 });
    const after = P({ w: 'mace', ua1: 140, la1: 150, wa: 0, lean: 10, mouth: 'grin', mo: .4, f1x: 90, f2x: -60 });
    let p = kf([[0, idle], [armor + .1, idle], [armor + .35, brow, eBack], [m2 - .1, brow], [hit - .32, wind, eOut], [hit - .02, swing, eIn], [hit + .15, after, eOut], [hit + .7, after]], T);
    const step = prog(T, m2 - .1, hit - .3); let x = lerp(330, 560, eIO(step)); if (step > 0 && step < 1) { p = locomote(p, (x - 330) / SC, 1); p.wa = 360 * 2 * eIO(step); }
    p = breathe(p, lt);
    drawChar(c, p, { x, gy: GY, face: 1, t: lt });
    if (T > hit - .18 && T < hit + .12) trail(c, tt => { const q = kf([[hit - .32, wind, eOut], [hit - .02, swing, eIn], [hit + .15, after, eOut]], tt); return [weaponWorld(q, { x, gy: GY, face: 1 }, 170), weaponWorld(q, { x, gy: GY, face: 1 }, 290)]; }, T, .14, 12, '255,230,190');
    burst(c, 730, GY - 470, T - hit, 200, '#C9D6FF'); sparks(c, 730, GY - 470, T - hit, 26, 12, 1300, '#E6EEFF'); speedLines(c, 730, GY - 470, T - hit, .4);
    comic(c, 'CLANG!', 560, 760, T - hit, '#6E9BFF', 136);
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.worse = (c, seg, lt) => {
  const beat = (Math.exp(-((lt % .62) * 9))) ;
  const g = c.createRadialGradient(W / 2, 900, 50, W / 2, 900, 1100); g.addColorStop(0, mixc('#7A0F18', '#FF2A2A', beat * .4)); g.addColorStop(1, '#0A0204');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // stix close-up gulp
  const p = P({ br: 16, eo: 1.18, mouth: 'wavy', sweat: 1, ua1: 60, la1: 150, ua2: -20, la2: 30, lean: -6, lx: .4, ly: -.2, tilt: 4 * Math.sin(lt * 9) });
  p.sq = 1 - .03 * beat;
  drawChar(c, breathe(p, lt), { x: 520, gy: 1760, face: 1, t: lt, scale: 1.05, noShadow: true });
  // glitch title
  const q = Math.floor(lt * 22);
  for (let i = 0; i < 2; i++) { const off = (rnd(q + i * 7) - .5) * 26; c.save(); c.globalAlpha = i ? .55 : 1; text(c, 'IT GETS', W / 2 + (i ? off : 0), 470, 96, i ? '#FF2A4A' : '#FFFFFF', { stroke: 14 }); text(c, 'WORSE...', W / 2 - (i ? off : 0), 600, 140, i ? '#2AF0FF' : '#FF3B3B', { stroke: 16, shadow: 'rgba(255,0,0,.8)', blur: 40 }); c.restore(); }
  for (let i = 0; i < 5; i++) { if (rnd(q * 3 + i) > .55) { const y = rnd(q + i * 11) * H, h = 10 + rnd(q + i) * 40; c.drawImage(c.canvas, 0, y, W, h, (rnd(q + i * 5) - .5) * 60, y, W, h); } }
  vignette(c, .7);
};

SCN.khopesh = (c, seg, lt) => {
  const dur = seg.end - seg.start, hooked = rel(seg, 'hooked'), rip = rel(seg, 'ripped'), hands = rel(seg, 'hands');
  const T = hitstop(lt, [[rip, .8]]);
  const ic = impactCam(lt, [[rip, .55]]); const cam = applyImpact(baseCam(lt, dur, { x: 580 }), ic);
  background(c, PAL[5], cam, lt, { pyramids: true, sunX: 760, sunY: 760 });
  withCam(c, cam, () => {
    let gp = breathe(P({ ua1: 30, la1: 60, ua2: 70, la2: 80, mouth: 'grit', lean: 4 }), lt, 2);
    const yanked = T > rip + .05;
    if (yanked) gp = Object.assign({}, gp, { lean: 12 * wob(T - rip, 10, 3) + 4, mouth: 'o', mo: .3, eo: 1.1, ua2: 80, la2: 70 });
    if (lt > hands - .3) gp = lp(gp, Object.assign({}, gp, { tilt: 18, ly: 1, lx: .6, ua1: 60, la1: 20, ua2: 60, la2: 20, sweat: 1, mouth: 'o', mo: .6, eo: 1.2 }), eIO(prog(lt, hands - .3, hands)));
    grunt(c, 800, gp, { t: lt, shield: yanked ? null : 'round' });
    if (yanked) { const d = T - rip - .05; c.save(); c.translate(690 - 1100 * d, GY - 340 - 650 * d + 900 * d * d); c.rotate(-d * 14); c.scale(SC, SC); drawShield(c, 'round', [0, 0]); c.restore(); }
    // stix
    const idle = P({ w: 'khopesh', ua1: 30, la1: 80, wa: 0, mouth: 'smirk' });
    const show = P({ w: 'khopesh', ua1: 150, la1: 150, wa: -30, mouth: 'smirk', br: 8, bt: -6, lx: .2, ly: -.8, tilt: -4 });
    const reach = P({ w: 'khopesh', ua1: 100, la1: 112, wa: 6, lean: 18, mouth: 'grit', f1x: 80, f2x: -50 });
    const yank = P({ w: 'khopesh', ua1: 10, la1: -40, wa: 20, lean: -18, mouth: 'grin', mo: .6, f1x: 30, f2x: -80 });
    let p = kf([[0, idle], [hooked - .25, idle], [hooked + .05, show, eBack], [rip - .35, show], [rip - .08, reach, eOut], [rip, reach], [rip + .14, yank, eOut], [rip + .9, yank], [rip + 1.3, P({ w: 'khopesh', ua1: 30, la1: 80, mouth: 'grin', mo: .3 }), eIO]], T);
    const walk = prog(lt, .2, 1.3); const x = lerp(300, 540, eIO(walk)); if (walk > 0 && walk < 1) p = locomote(p, (x - 300) / SC, 1);
    p = breathe(p, lt);
    drawChar(c, p, { x, gy: GY, face: 1, t: lt, wex: { glint: prog(lt, hooked + .05, hooked + .55) } });
    if (T > rip - .1 && T < rip + .2) trail(c, tt => { const q = kf([[rip - .35, show], [rip - .08, reach, eOut], [rip, reach], [rip + .14, yank, eOut]], tt); return [weaponWorld(q, { x, gy: GY, face: 1 }, 120), weaponWorld(q, { x, gy: GY, face: 1 }, 205, 50)]; }, T, .12, 10, '255,226,164');
    burst(c, 690, GY - 360, T - rip, 120, '#FFE2A4'); sparks(c, 690, GY - 360, T - rip, 16, 21, 900);
    comic(c, 'YOINK!', 520, 790, T - rip, '#B08CFF', 130);
    if (lt > hands - .1) text(c, '...', 830, HEADY() - 190, 80 * eBack(prog(lt, hands - .1, hands + .15)), '#FFFFFF', { stroke: 10 });
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.spear = (c, seg, lt) => {
  const dur = seg.end - seg.start, cheap = rel(seg, 'cheap'), reach = rel(seg, 'reach'), king = rel(seg, 'king');
  const th1 = reach + .02, th2 = reach + .5;
  const T = hitstop(lt, [[th1, .6], [th2, 1]]);
  const ic = impactCam(lt, [[th1, .4], [th2, .8]]);
  const kz = eIO(prog(lt, king - .1, king + .5));
  const cam = applyImpact(baseCam(lt, dur, { x: lerp(600, 420, kz), y: lerp(1000, 950, kz), z: 1 + .22 * kz }), ic);
  background(c, PAL[4], cam, lt);
  withCam(c, cam, () => {
    if (lt > king) { c.save(); c.globalCompositeOperation = 'lighter'; c.translate(280, HEADY() - 20); c.rotate(lt * .5); for (let i = 0; i < 14; i++) { c.rotate(Math.PI / 7); c.fillStyle = `rgba(255,210,63,${.18 * clamp((lt - king) * 3)})`; c.beginPath(); c.moveTo(0, 0); c.lineTo(900, -70); c.lineTo(900, 70); c.fill(); } c.restore(); }
    // grunt charging
    const chargeA = cheap - .1, stop = th1;
    let gx = lerp(1150, 760, eIO(prog(T, chargeA, stop))); let gp = P({ w: 'dagger', ua1: 120, la1: 140, wa: -30, mouth: 'open', mo: .8, bt: 10 });
    const run = prog(T, chargeA, stop); if (run > 0 && run < 1) gp = locomote(gp, (1150 - gx) / SC, 1, true);
    if (T > stop) gp = Object.assign({}, gp, { mouth: 'o', mo: .2, eo: 1.2, lean: -8, lx: -1, ly: .3, br: 10 });
    const kn = knock(T, th2, .75);
    if (T > th2) gp = Object.assign({}, gp, { mouth: 'ko', ua1: 160, la1: 170, ua2: 140, la2: 170 });
    grunt(c, gx + kn.dx, gp, { t: lt, rot: kn.rot, speed: run > 0 && run < 1 ? 1 : 0 });
    if (T > stop) dust(c, gx + 30, GY, T - stop, 6, 5);
    // stix
    const ready = P({ w: 'spear', ua1: 60, la1: 88, wa: 0, ua2: 70, la2: 92, mouth: 'smirk', lean: 4, f1x: 60, f2x: -50 });
    const pull = P({ w: 'spear', ua1: 10, la1: 88, wa: 0, ua2: 20, la2: 92, mouth: 'grit', lean: -6, f1x: 60, f2x: -60 });
    const thr = P({ w: 'spear', ua1: 86, la1: 90, wa: 0, ua2: 86, la2: 90, mouth: 'grit', bt: 12, lean: 18, f1x: 100, f2x: -60 });
    const regal = P({ w: 'spear', ua1: 40, la1: 175, wa: -86, ua2: 60, la2: -60, mouth: 'smirk', lean: -6, tilt: -8, br: 6, eo: .7 });
    let p = kf([[0, ready], [th1 - .25, ready], [th1 - .1, pull], [th1, thr, eIn], [th1 + .2, thr], [th2 - .12, pull], [th2, thr, eIn], [th2 + .3, thr], [king - .15, ready], [king + .1, regal, eBack]], T);
    p = breathe(p, lt);
    drawChar(c, p, { x: 230, gy: GY, face: 1, t: lt, crown: lt > king ? eBack(prog(lt, king, king + .35)) : 0, wex: { t: lt } });
    for (const s of [th1, th2]) { if (T > s - .08 && T < s + .05) trail(c, tt => { const q = kf([[s - .1, pull], [s, thr, eIn], [s + .2, thr]], tt); return [weaponWorld(q, { x: 230, gy: GY, face: 1 }, 380, -14), weaponWorld(q, { x: 230, gy: GY, face: 1 }, 470, 14)]; }, T, .08); }
    burst(c, 700, GY - 470, T - th2, 150, '#F2A0FF'); sparks(c, 700, GY - 470, T - th2, 18, 31, 1000, '#F7C8FF');
    comic(c, 'SHUNK!', 600, 780, T - th2, '#E57CF0', 124);
    if (lt > king) { for (let i = 0; i < 6; i++) { const a = lt * 2 + i; const r = 150 + 30 * Math.sin(lt * 3 + i); text(c, '✦', 240 + Math.cos(a) * r, HEADY() - 120 + Math.sin(a) * r * .5, 34, C.gold, { stroke: 5 }); } }
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.top3 = (c, seg, lt) => {
  const g = c.createRadialGradient(W / 2, 900, 30, W / 2, 900, 1200); g.addColorStop(0, '#FFE07A'); g.addColorStop(.35, '#C08A1A'); g.addColorStop(1, '#2A1A05');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.save(); c.translate(W / 2, 900); c.rotate(lt * .8); for (let i = 0; i < 18; i++) { c.rotate(Math.PI / 9); c.fillStyle = 'rgba(255,255,255,.12)'; c.beginPath(); c.moveTo(0, 0); c.lineTo(1500, -120); c.lineTo(1500, 120); c.fill(); } c.restore();
  const u = eBack(prog(lt, 0, .3)); const sc = lerp(3, 1, u);
  c.save(); c.translate(W / 2 + noise(lt * 40) * 10 * Math.exp(-lt * 4), 600); c.scale(sc, sc); c.rotate(rad(-6));
  c.font = '900 230px Inter'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round'; c.lineWidth = 30; c.strokeStyle = C.ink; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 30; c.strokeText('TOP 3', 0, 0); c.shadowColor = 'transparent';
  const gg = c.createLinearGradient(0, -110, 0, 110); gg.addColorStop(0, '#FFFFFF'); gg.addColorStop(.5, '#FFD23F'); gg.addColorStop(1, '#E08A10'); c.fillStyle = gg; c.fillText('TOP 3', 0, 0); c.restore();
  const jump = Math.sin(clamp((lt - .1) / .6) * Math.PI) * 170;
  const p = P({ ua1: 165, la1: 175, ua2: -165, la2: -175, mouth: 'grin', mo: .8, br: 10, eo: 1.1, f1x: 40, f1y: jump > 10 ? -40 : 0, f2x: -30, f2y: jump > 10 ? -50 : 0, lean: -4 });
  p.sq = jump > 10 ? 1.06 : 1 - .1 * Math.exp(-Math.max(0, lt - .7) * 8);
  drawChar(c, p, { x: W / 2, gy: 1330 - jump, face: 1, t: lt, scale: .6 });
  sparks(c, W / 2, 600, lt, 40, 77, 1400, '#FFF1A0', 900);
  vignette(c, .5);
};

SCN.bow = (c, seg, lt) => {
  const dur = seg.end - seg.start, horse = rel(seg, 'horse'), rls = rel(seg, 'hit') + .02, imp = rel(seg, 'hundred');
  const FAR = 1980; const u = prog(lt, rls, imp); const ax = lerp(330, FAR - 60, eIn(u) * .35 + u * .65);
  const follow = lt < rls ? 0 : eIO(prog(lt, rls, rls + .25));
  const ic = impactCam(lt, [[imp, .6]]);
  const cam = applyImpact(baseCam(lt, dur, { x: lerp(540, Math.min(FAR - 300, ax + 100), follow), z: lt < rls ? 1 + .1 * eIO(prog(lt, horse, rls)) : 1 }), ic);
  if (lt > imp) cam.x = FAR - 300;
  background(c, PAL[3], cam, lt);
  withCam(c, cam, () => {
    // distance ruler
    if (lt > rls) { for (let m = 0; m <= 200; m += 25) { const x = lerp(300, FAR - 80, m / 200); if (x > ax + 40) continue; line(c, [[x, GY + 20], [x, GY + 44]], 5, 'rgba(255,255,255,.7)'); if (m % 50 === 0) text(c, m + 'm', x, GY + 80, 34, '#FFFFFF', { stroke: 6 }); } }
    const kn = knock(lt, imp, .7);
    let gp = breathe(P({ ua1: 20, la1: 50, mouth: 'smug', lx: -1 }), lt, 3);
    if (lt > imp) gp = Object.assign({}, gp, { mouth: 'ko', ua1: 150, la1: 170, ua2: 150, la2: 170 });
    grunt(c, FAR + kn.dx, gp, { t: lt, rot: kn.rot });
    if (lt > imp) { const k2 = { x: FAR + kn.dx, gy: GY, face: -1, rot: kn.rot }; c.save(); c.translate(k2.x, k2.gy); c.rotate(rad(kn.rot)); c.scale(-SC, SC); arrow(c, 40, -460, Math.PI, 1, 200); c.restore(); }
    // stix
    const draw = lt < rls ? eIO(prog(lt, horse - .1, rls - .15)) : 0;
    const ready = P({ w: 'bow', ua1: 86, la1: 90, wa: 0, ua2: 70, la2: 60, mouth: 'smirk', lean: -2 });
    let p = Object.assign({}, ready, { ua2: lerp(70, 92, draw), la2: lerp(60, -88, draw), mouth: draw > .3 ? 'grit' : 'smirk', eo: draw > .3 ? .55 : 1, bt: 10 * draw });
    if (lt > rls) { const d = lt - rls; p = Object.assign({}, p, { ua2: 100 - 20 * Math.exp(-d * 6), la2: -60, mouth: 'smirk', eo: 1, lean: -6 * Math.exp(-d * 5) }); }
    p = breathe(p, lt);
    drawChar(c, p, { x: 230, gy: GY, face: 1, t: lt, wex: { draw, arrow: lt < rls } });
    if (lt > rls && lt < imp) { const y = GY - 520 - 60 * Math.sin(u * Math.PI); c.save(); for (let i = 1; i < 6; i++) { c.globalAlpha = .3 * (1 - i / 6); line(c, [[ax - i * 70, y], [ax - i * 70 + 60, y]], 6, '#FFFFFF'); } c.restore(); arrow(c, ax - 200, y, 0, 1.0, 200); }
    burst(c, FAR - 40, GY - 480, lt - imp, 140, '#FFB070'); sparks(c, FAR - 40, GY - 480, lt - imp, 16, 41, 900);
    comic(c, 'THWIP!', FAR - 260, 780, lt - imp, '#FF9A4A', 124);
    if (lt > imp) text(c, '200 m', FAR - 330, GY + 170, 70 * eBack(prog(lt, imp, imp + .3)), C.gold, { stroke: 10 });
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.ballista = (c, seg, lt) => {
  const dur = seg.end - seg.start, giant = rel(seg, 'giant'), rls = rel(seg, 'punched') - .05, thr = rel(seg, 'through');
  const hitT = [rls + .12, rls + .22, thr + .02];
  const EX = [700, 820, 940];
  // slow-mo bolt progress
  const bx = lt < rls ? 0 : (lt < hitT[2] ? lerp(520, 960, prog(lt, rls, hitT[2])) : 960 + 2600 * (lt - hitT[2]));
  const ic = impactCam(lt, [[rls, .5], [hitT[0], .5], [hitT[1], .5], [hitT[2], .9]]);
  const cam = applyImpact(baseCam(lt, dur, { x: lerp(560, 640, eIO(prog(lt, rls, thr + .3))), z: 1 + .06 * eIO(prog(lt, giant, rls)) }), ic);
  background(c, PAL[2], cam, lt);
  withCam(c, cam, () => {
    const draw = lt < rls ? eIO(prog(lt, .5, rls - .2)) : 0;
    EX.forEach((ex, i) => {
      const kn = knock(lt, hitT[i], .8);
      let gp = breathe(P({ ua1: 60, la1: 80, ua2: 70, la2: 90, mouth: 'grit', lean: 6, f1x: 50, f2x: -50 }), lt, i + 1);
      if (lt > rls - .2 && lt < hitT[i]) gp = Object.assign({}, gp, { mouth: 'o', eo: 1.2, br: 10 });
      if (lt > hitT[i]) gp = Object.assign({}, gp, { mouth: 'ko', ua1: 150, la1: 170, ua2: 150, la2: 170 });
      grunt(c, ex + kn.dx, gp, { t: lt, rot: kn.rot, shield: lt < hitT[i] ? 'tower' : null });
      if (lt > hitT[i]) { const d = lt - hitT[i]; c.save(); c.translate(ex - 60 + 500 * d, GY - 330 - 400 * d + 1500 * d * d); c.rotate(d * 6); c.scale(SC, SC); drawShield(c, 'tower', [0, 0]); ell(c, 0, 20, 28, 28, '#1A0A08', C.ink, 3); c.restore(); }
    });
    ballistaProp(c, 320, GY, .62, draw, lt < rls);
    const crank = lt < rls ? lt * 9 : rls * 9;
    let p = P({ ua1: 95 + 40 * Math.sin(crank), la1: 100 + 50 * Math.sin(crank + 1), ua2: 80 + 40 * Math.sin(crank + 2), la2: 100 + 40 * Math.sin(crank + 3), mouth: lt < rls && lt > .4 ? 'grit' : 'smirk', lean: 14, bt: 10, f1x: 60, f2x: -60 });
    if (lt > rls) { const d = lt - rls; p = lp(p, P({ ua1: 150, la1: 170, ua2: -150, la2: -170, mouth: 'grin', mo: .8, br: 10, eo: 1.1 }), eBack(clamp(d * 4))); }
    p = breathe(p, lt);
    drawChar(c, p, { x: 150, gy: GY, face: 1, t: lt });
    if (lt > rls) { const y = GY - 82; c.save(); for (let i = 1; i < 8; i++) { c.globalAlpha = .35 * (1 - i / 8); line(c, [[bx - 140 - i * 80, y], [bx - 80 - i * 80, y]], 10, '#FFFFFF'); } c.restore(); arrow(c, bx - 260, y, 0, 1.4, 200); }
    hitT.forEach((h, i) => { burst(c, EX[i] - 40, GY - 90, lt - h, 130, '#FF8A6A'); debris(c, EX[i] - 40, GY - 120, lt - h, 10, 50 + i, ['#B23A30', C.bronze, '#7A1E18']); });
    speedLines(c, 700, GY - 100, lt - rls, .5, 'rgba(255,255,255,.6)');
    comic(c, 'WHAM!', 640, 790, lt - hitT[0], '#FF5E4A', 140);
  });
  rankCard(c, seg, lt); vignette(c);
};

SCN.fire = (c, seg, lt) => {
  const dur = seg.end - seg.start, greek = rel(seg, 'greek'), liquid = rel(seg, 'liquid'), flame = rel(seg, 'flame'), on = rel(seg, 'on'), water = rel(seg, 'water'), today = rel(seg, 'today'), nobody = rel(seg, 'nobody'), recipe = rel(seg, 'recipe');
  const fS = liquid - .05, fE = today - .2; const boatBurn = prog(lt, flame, flame + .8);
  const ic = impactCam(lt, [[greek, .35], [fS, .5]]);
  const cam = applyImpact(baseCam(lt, dur, { x: lerp(470, 600, eIO(prog(lt, fS, on))), z: lerp(1.15, 1, eIO(prog(lt, 0, greek))) + .1 * eIO(prog(lt, today, recipe)) }), ic);
  if (lt > today) cam.x = lerp(600, 380, eIO(prog(lt, today - .2, today + .5)));
  background(c, PAL[1], cam, lt, { sea: true, sunX: 820, sunY: 760, mote: '#FF8A40' });
  withCam(c, cam, () => {
    // boat & sailors
    const bxp = 880;
    boat(c, bxp, GY + 10, lt, boatBurn);
    for (let i = 0; i < 2; i++) { const jumpT = on - .4 + i * .15; let gx = bxp - 60 + i * 120, gyy = GY - 30, rot = 0; let gp = breathe(P({ ua1: 30, la1: 60, mouth: 'smug' }), lt, i);
      if (lt > flame) gp = Object.assign({}, gp, { mouth: 'open', mo: 1, eo: 1.2, br: 14, ua1: 160 + 30 * Math.sin(lt * 25 + i), la1: 170 + 40 * Math.sin(lt * 31 + i), ua2: 160 + 30 * Math.sin(lt * 27), la2: 170 + 30 * Math.sin(lt * 23) });
      if (lt > jumpT) { const d = lt - jumpT; gx += 160 * d; gyy = GY - 30 - 500 * d + 1400 * d * d; rot = d * 200; }
      if (gyy < GY + 120) grunt(c, gx, gp, { t: lt, rot, gy: Math.min(gyy, GY + 100), burnt: lt > flame + .3, scale: SC * .8, noCape: false });
      if (lt > jumpT + .5 && lt < jumpT + 1.4) { const d = lt - jumpT - .5; for (let k = 0; k < 8; k++) { const a = -Math.PI * (.2 + .6 * rnd(k + i * 9)); ell(c, gx + Math.cos(a) * 300 * d, GY + 20 + Math.sin(a) * 400 * d + 900 * d * d, 9, 9, 'rgba(160,210,255,.8)'); } }
    }
    // flame stream
    const sx = 300; const stixP = P({ w: 'siphon', ua1: 70, la1: 92, wa: 0, ua2: 80, la2: 100, mouth: 'smirk', lean: -4 });
    let p = stixP; if (lt < greek - .1) p = P({ w: 'siphon', ua1: 20, la1: 30, wa: -60, mouth: 'flat', eo: .8 });
    else p = lp(P({ w: 'siphon', ua1: 20, la1: 30, wa: -60 }), Object.assign({}, stixP, { mouth: 'grin', mo: .2, bt: 14, eo: .8 }), eBack(prog(lt, greek - .1, greek + .25)));
    if (lt > fS && lt < fE) { p = Object.assign({}, p, { lean: -10 + 2 * Math.sin(lt * 60), mouth: 'grin', mo: .6, hx: -8 }); }
    if (lt > today - .2) p = lp(p, P({ w: null, ua1: 80, la1: 120, ua2: 90, la2: 60, mouth: 'flat', br: 8, bt: -10, tilt: 8, ly: .5, lx: .6 }), eIO(prog(lt, today - .2, today + .2)));
    if (lt > recipe - .1) p = Object.assign({}, p, { mouth: 'o', mo: .6, eo: 1.2, br: 16, lean: -10, sweat: 1 });
    p = breathe(p, lt);
    drawChar(c, p, { x: sx, gy: GY, face: 1, t: lt, wex: { pilot: lt > greek ? .8 + .2 * Math.sin(lt * 30) : 0 } });
    const noz = weaponWorld(p, { x: sx, gy: GY, face: 1 }, 262);
    c.save(); c.globalCompositeOperation = 'lighter';
    if (lt > fS) { const n = Math.floor((Math.min(lt, fE) - fS) / .01);
      for (let i = Math.max(0, n - 90); i <= n; i++) { const te = fS + i * .01, age = lt - te; if (age < 0 || age > .9) continue;
        const vx = 1100 + rnd(i) * 300, vy = -260 + rnd(i * 3) * 200; let x = noz[0] + vx * age * (1 - .3 * age), y = noz[1] + vy * age + 700 * age * age;
        if (y > GY + 10) { y = GY + 10 - (y - GY - 10) * .1; }
        flameP(c, x, y, 26 + 120 * age * (1 - age * .6), age / .9, .95); } }
    // burning boat + water fire
    if (boatBurn > 0) for (let i = 0; i < 50; i++) { const per = .4 + rnd(i) * .4; const a = ((lt / per) + rnd(i * 3)) % 1; flameP(c, bxp - 220 + rnd(i * 7) * 440, GY - 10 - rnd(i * 11) * 300 * boatBurn - a * 140, 46 * (1 - a * .5), a, boatBurn); }
    const wf = prog(lt, on - .2, water + .5); if (wf > 0) for (let i = 0; i < 70; i++) { const x = 480 + rnd(i * 5) * 700; if ((x - 480) / 700 > wf) continue; const per = .35 + rnd(i) * .4; const a = ((lt / per) + rnd(i * 2)) % 1; flameP(c, x + 8 * Math.sin(a * 9), GY + 10 + rnd(i * 13) * 120 - a * 110, 38 * (1 - a * .5), a, .9); }
    // fire light
    const lightA = (lt > fS && lt < fE ? .5 : 0) + boatBurn * .35 + (lt > greek ? .15 : 0);
    const lg = c.createRadialGradient(noz[0] + 200, noz[1], 20, noz[0] + 200, noz[1], 900); lg.addColorStop(0, `rgba(255,120,30,${lightA * .6})`); lg.addColorStop(1, 'rgba(255,80,0,0)'); c.fillStyle = lg; c.fillRect(-500, 0, 3000, 2400);
    c.restore();
    scroll(c, sx + 170, GY - 470, prog(lt, today - .1, today + .4), prog(lt, recipe - .3, recipe + .4), lt);
    comic(c, 'FWOOSH!', 640, 760, lt - fS, '#FFB030', 136);
  });
  // darkness pre-reveal
  if (lt < greek + .3) { c.fillStyle = `rgba(0,0,0,${.7 * (1 - eIO(prog(lt, greek - .2, greek + .3)))})`; c.fillRect(0, 0, W, H); }
  rankCard(c, seg, lt); vignette(c, .65);
};

const LIST = ['fire', 'ballista', 'bow', 'spear', 'khopesh', 'mace', 'axe', 'sling', 'dagger', 'club'];
SCN.outro = (c, seg, lt) => {
  const cam = baseCam(lt, 4); background(c, PAL.outro, cam, lt);
  text(c, 'FINAL RANKING', W / 2, 290, 64 * eBack(prog(lt, 0, .3)), '#FFFFFF', { stroke: 10 });
  LIST.forEach((k, i) => { const s = SEG[k]; const u = eOut(prog(lt, .05 + i * .06, .35 + i * .06)); if (u <= 0) return; const y = 380 + i * 76, x = 70 - (1 - u) * 700;
    c.save(); c.globalAlpha = u; c.beginPath(); c.roundRect(x, y - 32, 650, 64, 16); c.fillStyle = i === 0 ? 'rgba(120,90,10,.9)' : 'rgba(18,22,40,.85)'; c.fill(); c.lineWidth = 3; c.strokeStyle = TIER[s.rank]; c.stroke();
    text(c, '#' + s.rank, x + 52, y + 2, 38, TIER[s.rank], { stroke: 6 }); icon(c, k, x + 150, y + 2, .32); text(c, s.name, x + 220, y + 2, 40, i === 0 ? C.gold : '#FFFFFF', { align: 'left', stroke: 6 }); c.restore(); });
  withCam(c, cam, () => {
    const pt = P({ ua1: 45 + 6 * Math.sin(lt * 8), la1: 30, mouth: 'grin', mo: .3, br: 6, lx: .5, ly: .8, eo: lt % 1.6 < .15 ? .2 : 1, tilt: -6 });
    drawChar(c, breathe(pt, lt), { x: 840, gy: GY, face: -1, t: lt });
  });
  const a = eBack(prog(lt, .4, .7)); text(c, 'COMMENT YOUR PICK', W / 2 - 70, 1225, 62 * a, C.gold, { stroke: 10, shadow: 'rgba(0,0,0,.6)' });
  vignette(c, .5);
};

// ================================================================ transitions
const TRANS = { club: 'zoom', dagger: 'whip', sling: 'slash', axe: 'whip', mace: 'iris', worse: 'glitch', khopesh: 'slash', spear: 'whip', top3: 'flash', bow: 'zoom', ballista: 'slash', fire: 'iris', outro: 'whip' };
const TPRE = .16, TPOST = .2;
const bufA = document.createElement('canvas'), bufB = document.createElement('canvas'); bufA.width = bufB.width = W; bufA.height = bufB.height = H;
const cA = bufA.getContext('2d'), cB = bufB.getContext('2d');
function drawSeg(c, seg, lt) { c.save(); SCN[seg.id](c, seg, Math.max(0, lt)); c.restore(); }
function composite(c, type, u, A, B) {
  const e = eIO(u);
  if (type === 'whip') {
    const sp = Math.sin(u * Math.PI);
    for (let k = 0; k < 5; k++) { const o = (k - 2) * 40 * sp; c.globalAlpha = k === 2 ? 1 : .22;
      if (e < .5) c.drawImage(A, -e * 2 * W * .9 + o, 0); else c.drawImage(B, (1 - e) * 2 * W * .9 + o, 0); }
    c.globalAlpha = 1; c.fillStyle = `rgba(255,255,255,${.25 * sp})`; for (let i = 0; i < 26; i++) c.fillRect(0, rnd(i) * H, W, 3 + rnd(i * 3) * 8);
  } else if (type === 'slash') {
    c.drawImage(A, 0, 0); const p = lerp(-500, W + H * .6 + 500, e);
    c.save(); c.beginPath(); c.moveTo(p, 0); c.lineTo(p - H * .6, H); c.lineTo(-2000, H); c.lineTo(-2000, 0); c.closePath(); c.clip(); c.drawImage(B, 0, 0); c.restore();
    c.save(); c.shadowColor = C.scarfL; c.shadowBlur = 40; line(c, [[p + 10, -20], [p - H * .6 + 10, H + 20]], 26, '#FFFFFF'); line(c, [[p + 40, -20], [p - H * .6 + 40, H + 20]], 10, C.scarf); c.restore();
  } else if (type === 'zoom') {
    if (u < .5) { const s = 1 + eIn(u * 2) * 2.2; c.save(); c.translate(W / 2, 950); c.scale(s, s); c.translate(-W / 2, -950); c.drawImage(A, 0, 0); c.restore(); }
    else { const s = 1.6 - .6 * eOut((u - .5) * 2); c.save(); c.translate(W / 2, 950); c.scale(s, s); c.translate(-W / 2, -950); c.drawImage(B, 0, 0); c.restore(); }
    c.fillStyle = `rgba(255,255,255,${Math.sin(u * Math.PI) * .85})`; c.fillRect(0, 0, W, H);
  } else if (type === 'iris') {
    const R = Math.hypot(W, H);
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    const r = u < .5 ? R * (1 - eIn(u * 2)) : R * eOut((u - .5) * 2);
    c.save(); c.beginPath(); c.arc(W / 2, 980, Math.max(1, r), 0, 7); c.clip(); c.drawImage(u < .5 ? A : B, 0, 0); c.restore();
    c.save(); c.beginPath(); c.arc(W / 2, 980, Math.max(1, r), 0, 7); c.lineWidth = 14; c.strokeStyle = C.scarf; c.shadowColor = C.scarfL; c.shadowBlur = 30; c.stroke(); c.restore();
  } else if (type === 'glitch') {
    c.drawImage(u < .45 ? A : B, 0, 0); const q = Math.floor(u * 30);
    for (let i = 0; i < 14; i++) { const y = rnd(q * 13 + i) * H, h = 20 + rnd(q + i * 3) * 120; c.drawImage(rnd(q + i) > .5 ? A : B, 0, y, W, h, (rnd(q * 7 + i) - .5) * 160, y, W, h); }
    c.fillStyle = `rgba(255,0,40,${.25 * Math.sin(u * Math.PI)})`; c.fillRect(0, 0, W, H);
  } else { // flash
    c.drawImage(u < .5 ? A : B, 0, 0); c.fillStyle = `rgba(255,240,200,${Math.sin(u * Math.PI)})`; c.fillRect(0, 0, W, H);
  }
  c.globalAlpha = 1;
}

// ================================================================ captions & overlays
const CHUNKS = (() => { const out = []; let cur = []; TLD.words.forEach((w, i) => { cur.push(w); const last = /[.,?!:]$|\.\.\.$/.test(w.text); if (cur.length >= 3 || last) { out.push(cur); cur = []; } }); if (cur.length) out.push(cur); return out; })();
function captions(c, t) {
  let ch = null; for (let i = 0; i < CHUNKS.length; i++) { const s = CHUNKS[i][0].start - .06, e = i + 1 < CHUNKS.length ? CHUNKS[i + 1][0].start - .06 : TLD.vo + .4; if (t >= s && t < e) { ch = CHUNKS[i]; break; } }
  if (!ch) return; const sz0 = 78; c.save(); c.font = `900 ${sz0}px Inter`;
  const words = ch.map(w => w.text.replace(/\.\.\.$/, '…').toUpperCase());
  let ws = words.map(w => c.measureText(w).width), gap = 22, total = ws.reduce((a, b) => a + b, 0) + gap * (ws.length - 1); let sz = sz0;
  if (total > 960) { sz = sz0 * 960 / total; c.font = `900 ${sz}px Inter`; ws = words.map(w => c.measureText(w).width); gap *= 960 / total; total = 960; }
  const pop = eBack(prog(t, ch[0].start - .06, ch[0].start + .1)); let x = W / 2 - total / 2; const y = 1420;
  c.translate(W / 2, y); c.scale(.85 + .15 * pop, .85 + .15 * pop); c.translate(-W / 2, -y);
  ch.forEach((w, i) => { const on = t >= w.start - .03; const active = on && (i === ch.length - 1 || t < ch[i + 1].start - .03);
    c.save(); c.translate(x + ws[i] / 2, y - (active ? 6 : 0)); c.textAlign = 'center'; c.textBaseline = 'middle'; c.lineJoin = 'round';
    if (active) { c.save(); c.beginPath(); c.roundRect(-ws[i] / 2 - 14, -sz * .62, ws[i] + 28, sz * 1.2, 16); c.fillStyle = C.scarf; c.shadowColor = 'rgba(0,0,0,.4)'; c.shadowBlur = 16; c.fill(); c.restore(); }
    c.lineWidth = 16; c.strokeStyle = C.ink; c.shadowColor = 'rgba(0,0,0,.5)'; c.shadowBlur = 12; c.shadowOffsetY = 5; c.strokeText(words[i], 0, 0); c.shadowColor = 'transparent';
    c.fillStyle = active ? '#FFFFFF' : (on ? '#FFFFFF' : 'rgba(255,255,255,.55)'); c.fillText(words[i], 0, 0); c.restore(); x += ws[i] + gap; });
  c.restore();
}
function header(c, t) {
  c.save(); text(c, 'STIX vs', W / 2, 112, 44, '#FFFFFF', { stroke: 9, shadow: 'rgba(0,0,0,.5)' });
  text(c, '10 ANCIENT WEAPONS', W / 2, 172, 60, C.gold, { stroke: 11, shadow: 'rgba(0,0,0,.5)' }); c.restore();
  text(c, '@CRAZELTIPS', W / 2, 1515, 30, 'rgba(255,255,255,.55)', { weight: 800, stroke: 5, sc: 'rgba(0,0,0,.4)' });
}

// ================================================================ main render
function render(t) {
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  let i = SEGS.findIndex(s => t >= s.start && t < s.end); if (i < 0) i = SEGS.length - 1;
  const seg = SEGS[i];
  let trans = null;
  if (i + 1 < SEGS.length && t > SEGS[i + 1].start - TPRE) trans = [seg, SEGS[i + 1]];
  else if (i > 0 && t < seg.start + TPOST) trans = [SEGS[i - 1], seg];
  if (trans && TRANS[trans[1].id]) {
    const [A, B] = trans; const T0 = B.start - TPRE, T1 = B.start + TPOST; const u = prog(t, T0, T1);
    cA.setTransform(1, 0, 0, 1, 0, 0); cB.setTransform(1, 0, 0, 1, 0, 0);
    drawSeg(cA, A, Math.min(t, B.start + .05) - A.start); drawSeg(cB, B, Math.max(0, t - B.start));
    composite(ctx, TRANS[B.id], u, bufA, bufB);
  } else drawSeg(ctx, seg, t - seg.start);
  // loop back into the hook's first frame
  if (seg.id === 'outro') { const lt = t - seg.start, d = seg.end - seg.start; const a = prog(lt, d - 1.35, d - .2); if (a > 0) { cA.setTransform(1, 0, 0, 1, 0, 0); drawSeg(cA, SEGS[0], 0); ctx.globalAlpha = eIO(a); ctx.drawImage(bufA, 0, 0); ctx.globalAlpha = 1; } }
  header(ctx, t); captions(ctx, t);
}
window.render = render;
window.frameJPEG = (t, q = .93) => { render(t); return cv.toDataURL('image/jpeg', q); };
