const { chromium } = require('playwright'); const fs = require('fs'); const { spawn } = require('child_process');
const dir = __dirname; const mode = process.argv[2];
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const page = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto('file://' + dir + '/index.html');
  await page.evaluate(async () => { await document.fonts.load('900 40px Inter'); await document.fonts.load('800 40px Inter'); });
  const dur = await page.evaluate(() => TL.dur);
  if (mode === 'still') {
    for (const t of process.argv.slice(3)) {
      const d = await page.evaluate(tt => { try { return frameJPEG(+tt, .9); } catch (e) { return 'ERR ' + e.stack; } }, t);
      if (d.startsWith('ERR')) { console.log(t, d); continue; }
      fs.writeFileSync(`${dir}/st_${t}.jpg`, Buffer.from(d.split(',')[1], 'base64'));
    }
  } else {
    const k = +process.argv[3], n = +process.argv[4], fps = 60; const N = Math.round(dur * fps);
    const a = Math.floor(N * k / n), e = Math.floor(N * (k + 1) / n);
    const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '' + fps, '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', `${dir}/part_${k}.mp4`]);
    for (let i = a; i < e; i++) {
      const d = await page.evaluate(tt => frameJPEG(tt, .94), i / fps);
      if (!ff.stdin.write(Buffer.from(d.split(',')[1], 'base64'))) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 300 === 0) console.log('chunk', k, i, '/', e);
    }
    ff.stdin.end(); await new Promise(r => ff.on('close', r));
  }
  if (errs.length) console.log('PAGE ERRORS:', errs.slice(0, 5));
  await b.close();
})();
