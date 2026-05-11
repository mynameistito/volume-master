---
"volume-master": patch
---

Fix boost being silent or inaudible — rework the audio graph to bypass WebAudio entirely at ≤100% and only intercept when boosting.

- **Silent-until-popup bug**: the content script eagerly created an `AudioContext` at `document_start` and called `createMediaElementSource` on every `<audio>`/`<video>`. Chrome's autoplay policy keeps the context suspended until a user gesture, but `createMediaElementSource` reroutes the element's audio exclusively through the (suspended) graph — so media played mute on every page until the popup was opened. Now the graph is only built when boost > 100% is actually requested.
- **Boost was being eaten by the compressor**: previous chain ran `DynamicsCompressor(threshold −6 dB, ratio 12:1, knee 12)` + `WaveShaper` soft-clipper inline at every gain, including unity. At 600% the `(v/100)^1.6` curve produced ~+23 dB of linear gain that the compressor immediately squashed back down to a few dB and the waveshaper coloured. Replaced with a linear `v/100` curve and a gentle limiter (`threshold −3 dB, ratio 4:1, knee 6, attack 3 ms, release 100 ms`), and dropped the waveshaper. 600% now actually sounds ~6× louder.
- **Native fidelity at ≤100%**: at and below unity, volume is applied as `el.volume` on each tracked element — the page's audio is bit-identical to no extension installed (no compressor colouring, no autoplay-policy interactions).
- **Volume restore on page load**: the content script now queries `vm/get-volume` on init (and on bfcache `pageshow`) so navigating within a boosted tab keeps the boost. Background resolves the tab from the message sender.
- **Late media + gesture handling**: rescan media elements on `DOMContentLoaded` and `load` in addition to the existing `MutationObserver`; hook one-shot `pointerdown`/`keydown`/`touchstart` listeners that resume the `AudioContext` on user gesture.
