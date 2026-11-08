import re, json, subprocess, numpy as np, soundfile as sf
a, sr = sf.read('takeA.wav')
log = subprocess.run(['ffmpeg','-i','takeA.wav','-af','silencedetect=n=-40dB:d=0.18','-f','null','-'],capture_output=True,text=True).stderr
st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]
en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
words = [w for w in json.load(open('words.json'))['words'] if not w['text'].startswith('[') and not w['text'].endswith(']')]
def keep_for(s, e):
    nxt = next((w['text'] for w in words if w['start'] >= s - 0.05), '')
    if nxt.startswith('Greek'): return 0.55
    if nxt.startswith('deadliest'): return 0.25
    if nxt.startswith('Bonk'): return 0.2
    return 0.13
cuts = []  # (start, end) to remove
for s, e in zip(st, en):
    k = keep_for(s, e)
    if e - s > k + 0.02:
        mid_s = s + k/2; mid_e = e - k/2
        cuts.append((mid_s, mid_e))
# also trim leading silence beyond 0.05
segs = []; prev = 0.0
for s, e in cuts: segs.append((prev, s)); prev = e
segs.append((prev, len(a)/sr))
out = []; F = int(0.006*sr)
for s, e in segs:
    x = a[int(s*sr):int(e*sr)].copy()
    if len(x) > 2*F: x[:F] *= np.linspace(0,1,F); x[-F:] *= np.linspace(1,0,F)
    out.append(x)
y = np.concatenate(out); sf.write('vo.wav', y, sr)
def mapt(t):
    removed = 0
    for s, e in cuts:
        if t >= e: removed += e - s
        elif t > s: removed += t - s
    return t - removed
W = [dict(text=w['text'], start=round(mapt(w['start']),3), end=round(mapt(w['end']),3)) for w in words]
json.dump(W, open('words_mapped.json','w'), indent=0)
print('orig', len(a)/sr, 'new', len(y)/sr, 'cuts', len(cuts))
