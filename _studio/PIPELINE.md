# STIX daily Short pipeline

## Channel (from 2026-11-09)
| | |
|---|---|
| Channel | **What If STIX** |
| Handle / URL | @whatifstixanim · https://www.youtube.com/@whatifstixanim/ |
| Channel ID | `UCySkb8kxrQA0VryTvaN9Ovw` (Studio URL must contain it) |
| On-screen watermark | `@WHATIFSTIXANIM` |
| Credit line | "Animation, character (Stix), script and editing: What If STIX (original work)" |
Never write CRAZELTIPS in new videos, READMEs or details sheets.

The daily session follows these steps to make **one** STIX Short and push it to this repo.
Quality bar: `examples/` (STIX vs 10 Ancient Weapons) shows the expected level.

## 0. Setup (≈2 min)
```bash
# repo is cloned at /home/user/youtube-stix- (add_repo + git clone --depth 1)
R=/home/user/youtube-stix-; ST=$R/_studio
W=$(mktemp -d)                      # work dir for this video
cp $ST/engine/{engine.js,index.html,rend.js,compress.py,thumb.js} $W/
```
Tools: Playwright + Chromium are preinstalled (`require('playwright')`). Python needs `numpy soundfile scipy` (`pip install -q soundfile scipy`).
`elevenlabsusercontent.com` is on the environment allowlist, so `curl` can download ElevenLabs outputs.

## 1. Pick the topic
Use the first unchecked line in `_studio/topics.md` that is not already in the root `README.md` index. Tick it (`[x]`) in the same commit.

## 2. Script (retention rules, all mandatory)
- 140–155 spoken words, so the narration is ≤ 58 s after pauses are compressed. The video must stay under 60 s.
- **0–3 s hook:** an open loop that hides #1, e.g. "Ancient soldiers feared ONE weapon more than any sword…" Show a mysterious "?" silhouette on screen.
- Ranked countdown (#10 → #1, or 8–10 items), one punchy line per item, each with a concrete fact and a joke beat.
- **Re-hooks** after the 5th item ("But it gets way worse.") and before the top 3 ("Top three.").
- #1 gets the biggest payoff plus a mystery fact.
- **Loop ending:** the final line flows back into the first line (e.g. "…and now you know why").
- Facts must be accurate. Hedge anything uncertain ("about", "up to"). Note your sources for the description.

## 3. Voiceover: ElevenLabs connector (budget: ONE take)
- `creative_generate_speech`: voice_id `TX3LPaxmHKxFdv7VOQHJ` (Liam, the channel voice), model `eleven_v4`, **generations_count: 1**. Use audio tags like `[intense]`, `[playful]`, `[whispering]`, `[dramatic pause]`.
- Poll `creative_get_flow_run_status`, then `curl` the `content_url` to `$W/take.mp3`. Never re-call a generation to retry.
- Word timings: `creative_add_flow_asset_node` (generation_id, modality audio) → `creative_transcribe_audio` (connect_from that node, `eleven_scribe_v1`) → `curl` `words_download_url` to `$W/words.json`.
- `ffmpeg -i take.mp3 -ar 48000 -ac 1 takeA.wav`, then `python3 compress.py` (in $W). This gives `vo.wav` + `words_mapped.json` with pauses trimmed. Edit `keep_for()` so the pause before your #1 reveal stays long.
- **Do not generate music or SFX.** Use the library (`catalog.json`, `README` table below). Rotate music: music3 → music1 → music2 → music4.

## 4. Timeline
Write `$W/timeline.py` modelled on `examples/timeline_weapons.py`:
- segments `hook`, one per rank (`rank`, `name`), optional `worse` / `top3` cards, `outro`. Each boundary is `find(word) - 0.1`.
- `cue` dict: every word an action syncs to (impacts land ON the word).
Run it to produce `timeline.js`.

## 5. Scenes (the creative part)
Write `$W/scenes.js` modelled on `examples/scenes_weapons.js`:
- **Copy verbatim** from the example: helpers at the top, `icon`/`tile`, `knock`, `grunt`, and everything from `// ===== transitions` to the end (transitions, captions, header, render). Then change only: `header()` title text, `ICON`/`LIST` for the new items, `TRANS` keys = your segment ids.
- Write one `SCN.<id>` per segment using the engine primitives: `drawChar` (STIX = kind 'stix', enemies = `grunt`), poses via `P({...})`, `kf()` keyframes, `locomote`, `breathe`, `weapon()`, `trail`, `burst`, `sparks`, `debris`, `dust`, `speedLines`, `comic`, `impactCam`, `hitstop`, `background(c, PAL[rank], cam, lt, {pyramids|sea})`, `rankCard`, `vignette`.
- New props/objects: draw them with canvas paths in the same flat style (ink outline `C.ink`, 4–6 px, flat fills).
- Every scene needs anticipation, then impact ON the cue word, then a reaction/follow-through. STIX stays expressive (brows, eyes, mouth).
- STIX must match `character/STIX_spec.md`: teal scarf, amber goggles, three hair spikes.

## 6. Check stills, then render
```bash
cd $W && node rend.js still 0.3 2 5 <one per segment…> && python3 -c "…contact sheet…"
```
**Look at the contact sheet** (Read the PNG). Fix overlaps (text vs HUD, captions vs action), off-screen action and timing. Iterate until clean.
```bash
for k in 0 1 2 3; do node rend.js chunk $k 4 & done; wait
printf "file 'part_%d.mp4'\n" 0 1 2 3 > parts.txt
```

## 7. Audio mix
Write `$W/sfx_events.py` (modelled on `examples/sfx_events_weapons.py`): a transition swoosh at every boundary, a slam on each rank card, whoosh + hit/clang/crack/bonk ON each impact cue.
```bash
python3 $ST/engine/mix_lib.py $W music3   # → $W/mix.wav at -14 LUFS
ffmpeg -f concat -safe 0 -i parts.txt -i mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 256k -shortest -movflags +faststart <slug>.mp4
```
Verify: duration < 60 s, 1080×1920, 60 fps, loudness ≈ -14 LUFS. Extract 8–10 frames and look at them.

## 8. Thumbnail + cover
Adapt `thumb.js`: the best action frame, no captions, a big 2-line title (top) and a hook (bottom, teal pill). Save `<slug>_thumbnail.jpg` (≤ 2 MB). Save the plain frame as `<slug>_cover_frame.png`.

## 9. YouTube Studio details: `<slug>_YouTube_Studio.txt`
Fill in `details_template_whatifstix.txt` (the current template). `examples/details_weapons.txt` shows a filled-in example:
- **Title** with `#shorts` and the word **Aura**, max 100 chars:
  - evening (default slot, 6:00 PM IST): `The Legend of [NAME] [emoji] [hook] Aura #shorts`
  - morning (10:00 AM IST): `Wildest [THING] Ever [emoji] Top N Aura Moments #shorts`
- **Description:** hook line, the full ranking, a CTA, then the credits block: source clips ("No third-party footage"), voice (ElevenLabs "Liam"), music (library track name, ElevenLabs Music, licence + links), SFX, font (Inter, OFL 1.1), history sources (links), then 3–5 hashtags.
- **Tags:** 10–15 tags, ≤ 500 chars total. Include the save → reopen check instructions.
- **Settings:** Audience "Not made for kids", Visibility Public, altered content No, plus the rest of the checklist, channel check **What If STIX (@whatifstixanim), not CRAZELTIPS**, and a pinned comment.

## 10. Package + push
```
YYYY-MM-DD/HHMM_IST_<slug>/
  <slug>.zip     (mp4 + thumbnail + cover frame + details txt, zip -9)
  README.md      (title, slot, file table: see 2026-11-08 example)
```
Add a row to the root `README.md` index. Commit to `main` with a clear message, then `git push origin main` (if the push fails for network reasons, retry up to 4× with backoff 2/4/8/16 s).
Final message: title, link to the folder, duration, ElevenLabs credits used, and anything that needs a human eye.

## Library quick reference
SFX (`sfx/*.wav`; `hit()` aligns each sound's loudest point to the cue): bonk (comedic), whoosh (swing), impact (body hit, layer under everything), clang (metal), crack (wood/shield break), stab (blade shing), spin (loop for wind-ups), bow (release), ballista (heavy thunk), fire (loop for flames), swoosh (transitions), slam (rank reveal), braam (twist card).
Music (`music/*.mp3`, 60 s, ~120 BPM): music3 = big build-up (verified instrumental) · music1 = flat/steady · music2 = late climax · music4 = dense, ~80 BPM feel.
