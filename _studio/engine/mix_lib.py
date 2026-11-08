# Mixer that uses the STIX asset library: each SFX is placed so its PEAK lands on the event time.
import json, os, subprocess, sys, numpy as np, soundfile as sf
from scipy.signal import lfilter
LIB = os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + '/'; SR = 48000   # = _studio/
CAT = json.load(open(LIB + 'catalog.json'))
work = sys.argv[1]                     # folder with timeline.js + vo.wav
music = sys.argv[2] if len(sys.argv) > 2 else 'music3'
TL = json.loads(open(work + '/timeline.js').read()[len('window.TL='):-1]); C = TL['cue']; S = {s['id']: s for s in TL['segs']}
N = int((TL['dur'] + .5) * SR)
def load(p):
    raw = subprocess.run(['ffmpeg','-loglevel','error','-i',p,'-ac','2','-ar',str(SR),'-f','f32le','-'],capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()
X = {k: load(LIB + v['file']) for k, v in CAT['sfx'].items()}
PK = {k: v['peak_after_onset'] for k, v in CAT['sfx'].items()}
vo = np.zeros((N, 2)); sfx = np.zeros((N, 2)); mus = np.zeros((N, 2))
def put(buf, t, x, g=1.0):
    i = int(max(0, t) * SR); x = x[:max(0, N - i)]; buf[i:i+len(x)] += x * g
def hit(k, t, g=1.0, dur=None):       # place so the sound's peak lands at time t
    x = X[k] if dur is None else X[k][:int(dur * SR)]; put(sfx, t - PK[k], x, g)
v, _ = sf.read(work + '/vo.wav'); put(vo, 0, np.stack([v, v], 1))
put(mus, 0, load(LIB + CAT['music'][music]['file'])[:N])
# ---- per-video sound events live in <work>/sfx_events.py (see _studio/examples/sfx_events_weapons.py)
exec(open(work + '/sfx_events.py').read())
# duck music under voice
act = np.convolve((np.abs(vo[:, 0]) > .015).astype(float), np.ones(int(.2*SR))/int(.2*SR), 'same'); act = np.clip(act*2.5, 0, 1)
g = .42 - .2 * act; fl = int(1.5*SR); g[-fl:] *= np.linspace(1, 0, fl); mus *= g[:, None]
sf.write(work + '/mix_raw.wav', (vo + sfx * .5 + mus).astype(np.float32), SR)
subprocess.run(['ffmpeg','-loglevel','error','-y','-i',work + '/mix_raw.wav','-af','loudnorm=I=-14:TP=-1.2:LRA=9','-ar','48000',work + '/mix.wav'])
print('mixed', N / SR)
