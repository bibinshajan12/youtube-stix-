const { chromium } = require('playwright'); const fs = require('fs');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] }); const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  page.on('pageerror', e => console.log('ERR', e.message));
  await page.goto('file://' + __dirname + '/index.html'); await page.evaluate(async () => { await document.fonts.load('900 40px Inter'); await document.fonts.load('800 40px Inter'); });
  const shot = async (t, file, top, top2, bot) => { const d = await page.evaluate(([t, top, top2, bot]) => {
      captions = () => {}; hud = () => {}; render(t);
      const g = ctx.createLinearGradient(0, 0, 0, 640); g.addColorStop(0, 'rgba(0,0,0,.9)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 640);
      text(ctx, top, W / 2, 150, 84, '#FFFFFF', { stroke: 14 });
      ctx.save(); ctx.translate(W / 2, 290); ctx.rotate(rad(-3)); ctx.font = '900 150px Inter'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round'; ctx.shadowColor = 'rgba(40,180,255,.9)'; ctx.shadowBlur = 50; ctx.lineWidth = 24; ctx.strokeStyle = C.ink; ctx.strokeText(top2, 0, 0); ctx.shadowColor = 'transparent';
      const gg = ctx.createLinearGradient(0, -70, 0, 70); gg.addColorStop(0, '#E8FBFF'); gg.addColorStop(.5, '#4FD3FF'); gg.addColorStop(1, '#1676C8'); ctx.fillStyle = gg; ctx.fillText(top2, 0, 0); ctx.restore();
      const b2 = ctx.createLinearGradient(0, 1260, 0, 1700); b2.addColorStop(0, 'rgba(0,0,0,0)'); b2.addColorStop(.4, 'rgba(0,0,0,.75)'); b2.addColorStop(1, 'rgba(0,0,0,.88)'); ctx.fillStyle = b2; ctx.fillRect(0, 1260, W, 660);
      ctx.save(); ctx.translate(W / 2, 1450); ctx.font = '900 92px Inter'; const w = ctx.measureText(bot).width; ctx.beginPath(); ctx.roundRect(-w / 2 - 26, -62, w + 52, 120, 22); ctx.fillStyle = C.scarf; ctx.fill(); ctx.restore();
      text(ctx, bot, W / 2, 1450, 92, '#FFFFFF', { stroke: 16 });
      return cv.toDataURL('image/jpeg', .92); }, [t, top, top2, bot]);
    fs.writeFileSync(file, Buffer.from(d.split(',')[1], 'base64')); };
  await shot(44.4, 'thumb.jpg', 'A 524 m', 'TSUNAMI?!', "IT'S NOT A WALL");
  await b.close();
})();
