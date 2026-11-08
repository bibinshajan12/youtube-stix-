const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + __dirname + '/index.html');
  await page.evaluate(async () => { await document.fonts.load('900 40px Inter'); });
  const d = await page.evaluate(() => {
    rankCard = () => {};
    const s = SEG.fire; ctx.setTransform(1,0,0,1,0,0);
    SCN.fire(ctx, s, 50.95 - s.start);
    // top band
    const g = ctx.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 760);
    text(ctx, 'THE LEGEND OF', W/2, 250, 78, '#FFFFFF', { stroke: 14, shadow: 'rgba(0,0,0,.6)' });
    ctx.save(); ctx.translate(W/2, 410); ctx.rotate(rad(-4));
    ctx.font = '900 168px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(255,120,20,.9)'; ctx.shadowBlur = 50; ctx.lineWidth = 26; ctx.strokeStyle = C.ink; ctx.strokeText('GREEK FIRE', 0, 0); ctx.shadowColor = 'transparent';
    const gg = ctx.createLinearGradient(0, -80, 0, 80); gg.addColorStop(0, '#FFF4C0'); gg.addColorStop(.5, '#FFB020'); gg.addColorStop(1, '#E2420E'); ctx.fillStyle = gg; ctx.fillText('GREEK FIRE', 0, 0); ctx.restore();
    // bottom hook
    const b2 = ctx.createLinearGradient(0, 1250, 0, 1700); b2.addColorStop(0, 'rgba(0,0,0,0)'); b2.addColorStop(.4, 'rgba(0,0,0,.75)'); b2.addColorStop(1, 'rgba(0,0,0,.85)'); ctx.fillStyle = b2; ctx.fillRect(0, 1250, W, 670);
    text(ctx, 'NOBODY KNOWS', W/2, 1400, 96, '#FFFFFF', { stroke: 16 });
    ctx.save(); ctx.translate(W/2, 1515); ctx.font = '900 96px Inter'; const w = ctx.measureText('THE RECIPE').width; ctx.beginPath(); ctx.roundRect(-w/2 - 26, -62, w + 52, 120, 22); ctx.fillStyle = C.scarf; ctx.fill(); ctx.restore();
    text(ctx, 'THE RECIPE', W/2, 1515, 96, '#FFFFFF', { stroke: 16 });
    text(ctx, '#1 DEADLIEST ANCIENT WEAPON', W/2, 1630, 40, C.gold, { stroke: 8 });
    return cv.toDataURL('image/jpeg', .92);
  });
  fs.writeFileSync('/home/user/STIX_vs_10_Ancient_Weapons_thumbnail.jpg', Buffer.from(d.split(',')[1], 'base64'));
  await b.close();
})();
