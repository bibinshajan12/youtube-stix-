# Executed inside mix_lib.py. Available: hit(key, t_peak, gain, dur=None) puts a library SFX so its PEAK lands on t;
# put(sfx, t_start, array, gain) raw placement; X[key] arrays; C = word cues (seconds); S = segments by id; np, lfilter, SR, sfx.
from scipy.signal import lfilter
ranks = [k for k in S if S[k].get('rank')]
for k in list(S)[1:]: hit('swoosh', S[k]['start'], .45, 2.0)
for k in ranks: hit('slam', S[k]['start'] + .05, .45 if S[k]['rank'] > 1 else .7)
if 'worse' in S: hit('braam', S['worse']['start'] + .05, .9)
if 'top3' in S: hit('slam', S['top3']['start'] + .05, .8)
# per-weapon events (cue times = moment of impact)
def strike(t, main, g=1.0, whoosh=.6): hit('whoosh', t - .04, whoosh); hit(main, t, g)
b = C['bonk'] - .04; strike(b, 'bonk', 1.0, .5)
for t in [C['fast'] + .05, C['sneaky'] + .05]: strike(t, 'stab', .8, .45)
hit('impact', C['close'], .8)
spinS, rel = C['just'] + .45, C['hits'] + .2; t = spinS
while t < rel - .15: put(sfx, t, X['spin'], .5); t += .3
hit('whoosh', rel, .6); hit('impact', C['bullet'] + .02, .9); hit('bonk', C['bullet'] + .02, .35)
h = C['smashing'] + .06; strike(h, 'crack', 1.0); hit('impact', h, .7)
h = C['care'] + .03; strike(h, 'clang', 1.0, .7); hit('impact', h, .6)
h = C['ripped']; strike(h, 'stab', .8); hit('swoosh', h + .3, .35, 1.6)
th1 = C['reach'] + .02; th2 = th1 + .48; strike(th1, 'impact', .45, .5); strike(th2, 'impact', .9, .6); hit('slam', C['king'] + .05, .35)
hit('bow', C['hit'] + .02, 1.0); hit('impact', C['hundred'], .8)
r = C['punched'] - .05; hit('ballista', r, 1.0); hit('whoosh', r + .05, .7)
for hh in [r + .12, r + .22, C['through'] + .02]: hit('crack', hh, .7); hit('impact', hh, .55)
hit('whoosh', C['greek'] - .02, .5)
fS, fE = C['liquid'] - .05, C['today'] - .2; t = fS
while t < fE: put(sfx, t, X['fire'], .7); t += .6
n = np.random.default_rng(3).normal(size=(int((C['recipe'] + .8 - fS) * SR), 2)) * .05
n = lfilter([.02], [1, -.98], n, axis=0) * 6; e = np.ones(len(n)); f = int(.4 * SR); e[:f] = np.linspace(0, 1, f); e[-f:] = np.linspace(1, 0, f)
put(sfx, fS, n * e[:, None]); put(sfx, C['recipe'] - .2, X['fire'], .5)
