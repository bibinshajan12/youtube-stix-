import json, subprocess, numpy as np, soundfile as sf
from scipy.signal import lfilter, butter
LIB = '/home/user/youtube-stix-/_studio/'; SR = 48000
CAT = json.load(open(LIB + 'catalog.json')); TL = json.loads(open('timeline.js').read()[len('window.TL='):-1])
L = {l['id']: l for l in TL['lines']}; T = lambda k: L[k]['start']; END = TL['dur']; N = int((END + .3) * SR)
def load(p):
    raw = subprocess.run(['ffmpeg','-loglevel','error','-i',p,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
X = {k: load(LIB + v['file']) for k, v in CAT['sfx'].items()}; PK = {k: v['peak_after_onset'] for k, v in CAT['sfx'].items()}
vo, sfx, mus = (np.zeros((N, 2)) for _ in range(3))
def put(buf, t, x, g=1.0): i = int(max(0, t) * SR); x = x[:max(0, N - i)]; buf[i:i+len(x)] += x * g
def hit(k, t, g=1.0, dur=None): x = X[k] if dur is None else X[k][:int(dur*SR)]; put(sfx, t - PK[k], x, g)
rng = np.random.default_rng(7)
def rush(d, bright=.5, swell=.25):   # synthesized water surge: filtered noise with swell + gurgle
    n = int(d * SR); x = rng.normal(size=(n, 2))
    b, a = butter(2, [120 / (SR / 2), (900 + 3000 * bright) / (SR / 2)], 'band'); y = lfilter(b, a, x, axis=0)
    t = np.arange(n) / SR; env = np.minimum(1, t / swell) * np.exp(-np.maximum(0, t - swell) * 1.6)
    gur = 1 + .35 * np.sin(2 * np.pi * (3 + 2 * np.sin(t * 1.3)) * t); y *= (env * gur)[:, None]
    return y / (np.abs(y).max() + 1e-9)
def rumble(d):
    n = int(d * SR); x = rng.normal(size=(n, 2)); b, a = butter(2, 90 / (SR / 2)); y = lfilter(b, a, x, axis=0)
    t = np.arange(n) / SR; y *= (np.minimum(1, t / .1) * np.exp(-t * 1.2))[:, None]; return y / (np.abs(y).max() + 1e-9)
v, _ = sf.read('vo.wav'); v = np.stack([v, v], 1) if v.ndim == 1 else v; put(vo, 0, v)
put(mus, 0, load(LIB + CAT['music']['music3']['file'])[:N])
levels = ['l1','l2','l3','l4','l5','l6','l7','l8','l9','l10']
PAUSE0 = T('l7') + .85; PAUSE1 = T('l7b') + 2.95; CLIMB0 = T('l7b') - .25
ZOOM0 = T('l10') + .1; ZOOM1 = T('l10b') + 1.2; SLIDE1 = ZOOM1 - .2 + .75; SURGE0 = SLIDE1 + .1; BACK0 = T('cta1') - .05
for i, k in enumerate(levels):
    hit('slam', T(k) + .05, .28 + .035 * i)
    if i < 9: put(sfx, T(k) + .12, rush(1.6 if i == 0 else 1.1 + .06 * i, .3 + .07 * i), .35 + .05 * i); hit('impact', T(k) + .2, .25 + .04 * i)
hit('braam', PAUSE0, .9); hit('whoosh', CLIMB0 + .1, .5); hit('swoosh', PAUSE1, .45, 2.0); put(sfx, PAUSE1, rush(.9, .6), .55)
hit('swoosh', ZOOM1 - .5, .5, 2.0); hit('braam', ZOOM0 + .2, .7)
hit('crack', SLIDE1, .9); hit('impact', SLIDE1, .9); put(sfx, SLIDE1 - .7, rumble(2.4), .8)
put(sfx, SURGE0, rush(2.4, .8, .5), .85); hit('impact', T('c3') + .55, .6); hit('swoosh', BACK0 + .4, .4, 2.0)
def bell(d=1.6):
    t = np.arange(int(d * SR)) / SR; y = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * k) * a for f, k, a in ((1320, 3, 1), (2640, 5, .5), (3960, 7, .25), (1760, 4, .3)))
    return np.stack([y, y], 1) / 2
hit('whoosh', T('l2') + .3, .5)                                   # Stix leaps from the floating car
hit('whoosh', T('cta1') + .7, .5); hit('impact', T('cta1') + .85, .8); hit('slam', T('cta1') + .87, .35)   # like smash
hit('whoosh', T('cta2') + .45, .6); put(sfx, T('cta2') + 1.05, rush(.8, .7, .05), .7)                        # dive onto the raft
hit('impact', T('cta2') + 1.95, .7); hit('bonk', T('cta2') + 1.95, .5); put(sfx, T('cta2') + 2.0, bell(), .45)  # stomp -> subscribed + bell
hit('swoosh', T('cta3') + .1, .35, 1.6)
# music: duck under voice + dip during the level-7 freeze
act = np.convolve((np.abs(vo[:, 0]) > .015).astype(float), np.ones(int(.2*SR))/int(.2*SR), 'same'); act = np.clip(act*2.5, 0, 1)
g = .40 - .19 * act; t = np.arange(N) / SR
g *= 1 - .55 * np.clip(np.minimum((t - PAUSE0) / .25, (PAUSE1 - t) / .25), 0, 1)
fl = int(1.2 * SR); g[-fl:] *= np.linspace(1, 0, fl); mus *= g[:, None]
sf.write('mix_raw.wav', (vo + sfx * .55 + mus).astype(np.float32), SR)
subprocess.run(['ffmpeg','-loglevel','error','-y','-i','mix_raw.wav','-af','loudnorm=I=-14:TP=-1.2:LRA=9','-ar','48000','mix.wav']); print('ok', N / SR)
