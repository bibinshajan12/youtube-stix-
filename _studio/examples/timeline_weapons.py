import json, soundfile as sf
W = json.load(open('words_mapped.json'))
vo, sr = sf.read('vo.wav'); VO = len(vo)/sr
def find(word, after=0.0, n=1):
    k = 0
    for w in W:
        if w['start'] >= after - 1e-6 and w['text'].strip('.,:;?!').lower().startswith(word.lower()):
            k += 1
            if k == n: return w['start']
    raise KeyError(word)
b = {}
b['club'] = find('Number') - 0.12
b['dagger'] = find('Nine') - 0.1
b['sling'] = find('Eight') - 0.1
b['axe'] = find('Seven') - 0.1
b['mace'] = find('Six') - 0.1
b['worse'] = find('But', 26) - 0.06
b['khopesh'] = find('Five') - 0.1
b['spear'] = find('Four') - 0.1
b['top3'] = find('Top') - 0.1
b['bow'] = find('Three', 39) - 0.1
b['ballista'] = find('Two', 43) - 0.1
b['fire'] = find('And', 48) - 0.1
b['outro'] = find('Comment') - 0.08
END = VO + 0.75
order = ['hook','club','dagger','sling','axe','mace','worse','khopesh','spear','top3','bow','ballista','fire','outro']
starts = [0.0] + [b[k] for k in order[1:]]
names = dict(club='CLUB',dagger='DAGGER',sling='SLING',axe='BATTLE AXE',mace='MACE',khopesh='KHOPESH',spear='SPEAR',bow='COMPOSITE BOW',ballista='BALLISTA',fire='GREEK FIRE')
ranks = dict(club=10,dagger=9,sling=8,axe=7,mace=6,khopesh=5,spear=4,bow=3,ballista=2,fire=1)
segs = []
for i, k in enumerate(order):
    segs.append(dict(id=k, start=round(starts[i],3), end=round(starts[i+1] if i+1 < len(order) else END,3), rank=ranks.get(k), name=names.get(k,'')))
cue = dict(
  one=find('ONE'), sword=find('sword'), so=find('So', 3), stix=find('Stix'), tested=find('tested'), weakest=find('weakest'), deadliest=find('deadliest'),
  literally=find('literally'), stick=find('stick'), bonk=find('Bonk'),
  fast=find('Fast'), sneaky=find('sneaky'), way=find('WAY'), close=find('close'),
  just=find('Just'), rock=find('rock'), strap=find('strap'), hits=find('hits'), bullet=find('bullet'),
  built=find('Built'), job=find('job'), smashing=find('smashing'), shields1=find('shields'),
  armor=find('Armor'), mace2=find('mace', 25.5), care=find('care'),
  worse=find('worse'),
  egypt=find('Egypt'), hooked=find('hooked'), ripped=find('ripped'), hands=find('hands'),
  cheap=find('Cheap'), long=find('long'), reach=find('reach'), king=find('king'), battlefields=find('battlefields'),
  top=find('Top'), horse=find('Horse'), hit=find('hit', 41), two=find('two', 42), hundred=find('hundred'), meters=find('meters'),
  giant=find('giant'), crossbow=find('crossbow'), punched=find('punched'), through=find('through'), shield=find('shield', 47), walls=find('walls'),
  numberone=find('one', 48.4), greek=find('Greek'), liquid=find('Liquid'), flame=find('flame'), burned=find('burned'), on=find('ON', 51.5), water=find('water'),
  today=find('day'), nobody=find('nobody'), recipe=find('recipe'),
  comment=find('Comment'), pick=find('pick'), nowknow=find('now', 56.3), why=find('why'))
TL = dict(dur=round(END,3), vo=VO, segs=segs, cue={k: round(v,3) for k, v in cue.items()}, words=W)
open('timeline.js','w').write('window.TL=' + json.dumps(TL) + ';')
for s in segs: print(s['id'], s['start'], s['end'], round(s['end']-s['start'],2))
print('END', END)
