# STIX long-form production guide (16:9, 8–12 min)

Read these first:
- `stix-longform-blueprint.md` (structure + retention rules)
- the episode's script design, e.g. `antarctica-door-script-design.md`

Everything in `../PIPELINE.md` (channel block, STIX spec, quality bar, verify-before-push) still applies. This guide only lists what differs from Shorts.

## 1. Specs
| | Long-form |
|---|---|
| Canvas | **1920×1080** (16:9) |
| Frame rate | **30 fps** (halves render time and file size versus Shorts) |
| Length | 10–12 min (follow the episode's design) |
| Encode | `libx264 -preset medium -crf 21 -pix_fmt yuv420p`, AAC 192k, `-movflags +faststart` |
| Loudness | -14 LUFS integrated (`loudnorm=I=-14:TP=-1.5:LRA=11`) |
| Captions | **not burned in**. Write `<slug>.srt` from line timings for YouTube CC. A small on-screen subtitle is optional. |
| Watermark | `@WHATIFSTIXANIM`, small, bottom-right |

## 2. Engine setup (landscape)
```bash
R=/home/user/youtube-stix-; ST=$R/_studio; W=$(mktemp -d)
cp $ST/engine/{engine.js,index.html,rend.js} $W/
# in the COPIES only:
#  engine.js : const W = 1920, H = 1080 ; pick a GROUND / SC that fits 16:9 (e.g. GROUND 900, SC .5)
#  index.html: <canvas id="c" width="1920" height="1080">
#  rend.js   : viewport {width:1920,height:1080}, fps = 30
```
`vignette()` and `rankCard()` assume the portrait layout, so write landscape versions. `drawChar`, `weapon`, the FX (`burst`, `sparks`, `debris`, `dust`, `speedLines`, `comic`, `trail`), `kf`, `locomote`, `breathe`, `impactCam` and `hitstop` all work unchanged.
Organise the code as **one scene function per beat** in `scenes_<slug>.js`, with a `render(t)` dispatcher and crossfades or wipes between beats (reuse `composite()` from `examples/scenes_weapons.js`).

## 3. Narration: Kokoro "George" (free, works without any connector)
```bash
pip install -q kokoro-onnx soundfile scipy
mkdir -p ~/tts && cd ~/tts
curl -sSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -sSLO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
```
Model the script on `examples/tsunami/vo_kokoro_george.py` (fix its model path to `~/tts/`):
- voice `bm_george`, lang `en-gb`, speed about 1.12 (calmer than Shorts), one entry per narration line with an explicit gap.
- Long-form needs **breathing room**: add 0.6–1.5 s gaps where the picture tells the story (door reveal, biosphere reveal).
- The output `vo.json` (line start/end + word times) drives the timeline, the SRT and the sound events.
- Polish chain: `highpass=f=70,equalizer=f=160:t=q:w=1:g=2.5,equalizer=f=3200:t=q:w=1.2:g=3,acompressor=threshold=-20dB:ratio=3:attack=8:release=120:makeup=3`.
- If the ElevenLabs connector IS available in the session, Liam (`TX3LPaxmHKxFdv7VOQHJ`, eleven_v4, 1 take) sounds better. A ~9,000-character script costs about 9,000 credits, so only use it if the task prompt says so.

## 4. Music and ambience for 10+ minutes
- The library tracks are 60 s each. Don't loop one track for 11 minutes.
- Build an **ambience bed** with numpy/scipy:
  - wind: band-passed noise with a slow LFO
  - deep ice drone: low sines plus a slight detune
  - creaks: short filtered noise bursts
  - warm hum: 60–120 Hz for the vault
- Use library music only for key acts, crossfaded in and out (2–3 s fades):
  - `music3` for the climax (it has the biggest build)
  - `music2` for the biosphere reveal
  - `music1` under the lock sequence
- Duck everything under the voice (see `engine/mix_lib.py`). Use library SFX with `hit()` peak alignment.

## 5. On-screen system for this series
- **Stix Meter HUD** (top-left, compact): one bar per tracked meter, each with an icon + value. Flash on change.
- **Level / chapter card** at each level change: big title with a short subtitle, 1.5 s, slam in, then shrink to a corner tag.
- **Timer** (top-right) when a deadline exists.
- Keep Stix on screen during every explanation (blueprint rule).

## 6. Rendering
About 20,000 frames for 11 min at 30 fps. Render in 4–6 parallel chunks (`node rend.js chunk k n`), each about 10–20 min.
**Check stills for EVERY beat before the full render.** Render a contact sheet of 2–3 frames per beat, look at it, fix, repeat.

## 7. Packaging (GitHub file limit is 100 MB)
```
YYYY-MM-DD/HHMM_IST_<slug>/
  README.md                 (line 2 exactly: `Format: Long-form`)
  <slug>.zip                (mp4 + thumbnail + srt + details txt)
  # if the zip would be > 95 MB, split it instead:  zip -9 -s 90m <slug>.zip ...  → <slug>.z01, <slug>.z02, …, <slug>.zip
```
The README must explain how to join split parts (`zip -s 0 <slug>.zip --out full.zip`).
Also push the episode source to `_studio/longform/<slug>/` (scenes, vo script, mix script) so it can be fixed or reused.
**Checkpoint:** push the source folder after the scenes are written and stills look right, before the long render. A failed render then doesn't lose the work.

## 8. Thumbnail (1280×720 JPEG, ≤ 2 MB)
Follow the episode's packaging direction. Render the scene without HUD/captions and add 2–4 words of big text.

## 9. YouTube Studio details: `<slug>_YouTube_Studio.txt`
Same sections as `../details_template_whatifstix.txt`, with these long-form differences:
- **Title:** the episode title (no `#shorts`, no "Aura" rule). Max 100 chars.
- **Description:** a 2-line hook, then a **chapter list with timestamps** (`0:00 Cold open`, … from the beat start times; the first must be 0:00, each chapter ≥ 10 s), then a fiction disclaimer if the story is fictional, credits (George/Kokoro, Apache 2.0; library music and SFX; Inter OFL), real-fact sources, and 3–5 hashtags.
- **Tags:** 10–15, ≤ 500 chars, including `what if stix`, `stix`, `stickman animation`.
- **Settings:** channel What If STIX (@whatifstixanim, ID `UCySkb8kxrQA0VryTvaN9Ovw`), not made for kids, Public, altered content **No** (cartoon), category Film & Animation, upload `<slug>.srt` under Subtitles, add an end screen (subscribe + latest Short) in the last 20 s, pinned comment.
- **Root README index row:** Format `Long-form`, Slot `Long-form`.
