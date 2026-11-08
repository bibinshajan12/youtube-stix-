import soundfile as sf, numpy as np, json, re
from kokoro_onnx import Kokoro
T = '/tmp/claude-0/-home-user/8bd2198b-527a-5326-8779-67504abd46cd/scratchpad/tts/'
k = Kokoro(T + 'kokoro-v1.0.onnx', T + 'voices-v1.0.bin')
SP = 1.26
L = [  # id, text, gap after (s)
 ('hook1', "Stix isn't moving.", .2), ('hook2', "Neither is this building.", .2), ('hook3', "Only the water rises. Level one... to ten.", .3),
 ('l1', "Level one. Half a meter.", .1), ('l1b', "Looks harmless... but moving water this deep can knock you off your feet.", .25),
 ('l2', "Level two. One meter. Cars start to float.", .25),
 ('l3', "Level three. Two meters. The ground floor is gone.", .25),
 ('l4', "Level four. Three meters.", .15),
 ('l5', "Level five. Five meters. Everything becomes debris.", .25),
 ('l6', "Level six. Ten meters. Taller than most seawalls.", .25),
 ('l7', "Level seven. Fifteen meters.", .15), ('l7b', "This is where you stop running away... and start running up.", 1.0),
 ('l8', "Level eight. Thirty meters. Indonesia, two thousand four.", .25),
 ('l9', "Level nine. Forty meters. Japan, twenty eleven... right below Stix's feet.", .35),
 ('l10', "Level ten.", .15), ('l10b', "Five hundred and twenty-four meters. Lituya Bay, Alaska.", .3),
 ('c1', "But that's run-up... how high the water climbs on land.", .15),
 ('c2', "A landslide crashed into a narrow bay, and the water surged up the mountainside.", .15),
 ('c3', "Not a five-hundred-meter wall of water.", .3),
 ('out', "So... which level could you survive?", .0)]
out, t, lines, words = [], 0.25, [], []
SR = 24000; out.append(np.zeros(int(.25 * SR)))
for lid, txt, gap in L:
    a, sr = k.create(txt, voice='bm_george', speed=SP, lang='en-gb'); nz = np.where(np.abs(a) > .008)[0]; a = a[max(0, nz[0] - 150):nz[-1] + 600]
    d = len(a) / sr; lines.append(dict(id=lid, text=txt, start=round(t, 3), end=round(t + d, 3)))
    ws = txt.split(); wt = [len(re.sub(r'[^\w]', '', w)) + 2 + (4 if re.search(r'[.,?]$', w) else 0) for w in ws]
    tt = t + .03; span = d - .08
    for w, q in zip(ws, wt): dd = span * q / sum(wt); words.append(dict(text=w, start=round(tt, 3), end=round(tt + dd, 3))); tt += dd
    out += [a, np.zeros(int(gap * sr))]; t += d + gap
y = np.concatenate(out); sf.write('george_raw.wav', y, SR)
json.dump(dict(lines=lines, words=words, vo=round(len(y) / SR, 3)), open('vo.json', 'w'), indent=0)
print('total', round(len(y) / SR, 2))
for l in lines: print(f"{l['id']:6} {l['start']:6.2f} {l['end']:6.2f}")
